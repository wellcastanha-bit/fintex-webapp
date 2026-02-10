import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function getSupabase() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) return { supabase: null as any, envOk: false };

  const supabase = createClient(url, key, { auth: { persistSession: false } });
  return { supabase, envOk: true };
}

function cleanTime(t?: string | null) {
  if (t === undefined) return undefined;
  if (t === null || t === "") return null;
  const s = String(t).trim();
  if (/^\d{2}:\d{2}$/.test(s)) return `${s}:00`;
  if (/^\d{2}:\d{2}:\d{2}$/.test(s)) return s;
  return null;
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { supabase, envOk } = getSupabase();
    if (!envOk) {
      return NextResponse.json(
        { ok: false, error: "ENV faltando: SUPABASE_URL e/ou SUPABASE_SERVICE_ROLE_KEY" },
        { status: 500 }
      );
    }

    const { id } = await ctx.params;
    const body = await req.json();

    if (!id) return NextResponse.json({ ok: false, error: "id inválido" }, { status: 400 });

    const patch: any = {};

    if (body.day !== undefined) patch.day = String(body.day).trim();

    if (body.start_time !== undefined) {
      const st = cleanTime(body.start_time);
      if (!st) return NextResponse.json({ ok: false, error: "start_time inválido" }, { status: 400 });
      patch.start_time = st;
    }

    if (body.end_time !== undefined) patch.end_time = cleanTime(body.end_time);

    if (body.people !== undefined) patch.people = Math.max(1, Number(body.people) || 1);
    if (body.table_code !== undefined) patch.table_code = body.table_code ? String(body.table_code).trim() : null;
    if (body.customer_name !== undefined) patch.customer_name = String(body.customer_name ?? "").trim();
    if (body.phone !== undefined) patch.phone = body.phone ? String(body.phone).trim() : null;
    if (body.notes !== undefined) patch.notes = body.notes ? String(body.notes).trim() : null;
    if (body.location !== undefined) patch.location = body.location ? String(body.location).trim() : null;
    if (body.value_cents !== undefined) patch.value_cents = Math.max(0, Number(body.value_cents) || 0);
    if (body.is_paid !== undefined) patch.is_paid = Boolean(body.is_paid);

    const { data, error } = await supabase.from("reservations").update(patch).eq("id", id).select("*").single();
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true, data });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "Erro interno" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { supabase, envOk } = getSupabase();
    if (!envOk) {
      return NextResponse.json(
        { ok: false, error: "ENV faltando: SUPABASE_URL e/ou SUPABASE_SERVICE_ROLE_KEY" },
        { status: 500 }
      );
    }

    const { id } = await ctx.params;
    if (!id) return NextResponse.json({ ok: false, error: "id inválido" }, { status: 400 });

    const { error } = await supabase.from("reservations").delete().eq("id", id);
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "Erro interno" }, { status: 500 });
  }
}
