// app/api/reservas/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function getSupabase() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    return { supabase: null as any, envOk: false };
  }

  const supabase = createClient(url, key, { auth: { persistSession: false } });
  return { supabase, envOk: true };
}

function cleanTime(t?: string | null) {
  if (!t) return null;
  const s = String(t).trim();
  if (/^\d{2}:\d{2}$/.test(s)) return `${s}:00`;
  if (/^\d{2}:\d{2}:\d{2}$/.test(s)) return s;
  return null;
}

export async function GET(req: Request) {
  try {
    const { supabase, envOk } = getSupabase();
    if (!envOk) {
      return NextResponse.json(
        { ok: false, error: "ENV faltando: SUPABASE_URL e/ou SUPABASE_SERVICE_ROLE_KEY" },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(req.url);
    const day = searchParams.get("day");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    // ✅ aceita:
    // 1) ?day=YYYY-MM-DD
    // 2) ?from=YYYY-MM-DD&to=YYYY-MM-DD  (pra carregar mês inteiro e destacar calendário)
    if (!day && !(from && to)) {
      return NextResponse.json(
        { ok: false, error: "Use ?day=YYYY-MM-DD OU ?from=YYYY-MM-DD&to=YYYY-MM-DD" },
        { status: 400 }
      );
    }

    let query = supabase.from("reservations").select("*").order("start_time", { ascending: true });

    if (day) {
      query = query.eq("day", day);
    } else {
      query = query.gte("day", from!).lte("day", to!);
    }

    const { data, error } = await query;

    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true, data: data ?? [] });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "Erro interno" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { supabase, envOk } = getSupabase();
    if (!envOk) {
      return NextResponse.json(
        { ok: false, error: "ENV faltando: SUPABASE_URL e/ou SUPABASE_SERVICE_ROLE_KEY" },
        { status: 500 }
      );
    }

    const body = await req.json();

    const day = String(body?.day ?? "").trim();
    const start_time = cleanTime(body?.start_time);
    const customer_name = String(body?.customer_name ?? "").trim();

    if (!day) return NextResponse.json({ ok: false, error: "day obrigatório" }, { status: 400 });
    if (!start_time) return NextResponse.json({ ok: false, error: "start_time obrigatório (ex: 19:30)" }, { status: 400 });
    if (!customer_name) return NextResponse.json({ ok: false, error: "customer_name obrigatório" }, { status: 400 });

    const payload = {
      day,
      start_time,
      end_time: cleanTime(body?.end_time),
      people: Math.max(1, Number(body?.people) || 1),
      table_code: body?.table_code ? String(body.table_code).trim() : null,
      customer_name,
      phone: body?.phone ? String(body.phone).trim() : null,
      notes: body?.notes ? String(body.notes).trim() : null,
      location: body?.location ? String(body.location).trim() : null,
      value_cents: Math.max(0, Number(body?.value_cents) || 0),
      is_paid: Boolean(body?.is_paid ?? false),
    };

    const { data, error } = await supabase.from("reservations").insert(payload).select("*").single();
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true, data });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "Erro interno" }, { status: 500 });
  }
}
