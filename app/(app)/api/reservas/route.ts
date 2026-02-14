// app/api/reservas/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)!
);

// ✅ TABELA REAL
const TABLE = "reservations";

const TZ_OFFSET_MIN = -180;

function pad2(n: number) {
  return String(n).padStart(2, "0");
}
function toISODateLocalFromMs(ms: number) {
  const d = new Date(ms);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}
function todayISO_BR() {
  const nowUtc = Date.now();
  const nowLocalMs = nowUtc + TZ_OFFSET_MIN * 60 * 1000;
  return toISODateLocalFromMs(nowLocalMs);
}
function str(v: any) {
  const s = String(v ?? "").trim();
  return s ? s : null;
}
function toTimeHHMMSS(v: any) {
  const s = str(v);
  if (!s) return null;
  if (/^\d{2}:\d{2}:\d{2}$/.test(s)) return s;
  if (/^\d{2}:\d{2}$/.test(s)) return `${s}:00`;
  return null;
}
function toIntOrNull(v: any) {
  if (v == null) return null;
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  return Math.trunc(n);
}
function moneyBRToCents(v: any) {
  if (v == null) return 0;
  if (typeof v === "number") return Math.round(v * 100);

  let s = String(v).trim();
  if (!s) return 0;

  s = s.replace(/[^\d,.\-]/g, "");
  if (s.includes(",")) s = s.replace(/\./g, "").replace(",", ".");
  const n = Number(s);
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100);
}
function centsToBRL(cents: any) {
  const n = Number(cents);
  const c = Number.isFinite(n) ? n : 0;
  return c / 100;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const dateISO = searchParams.get("date") || todayISO_BR();

  const { data, error } = await supabase
    .from(TABLE)
    .select("id, created_at, day, start_time, end_time, people, customer_name, phone, notes, table_code, location, value_cents, is_paid")
    .eq("day", dateISO)
    .order("start_time", { ascending: true });

  if (error) {
    return NextResponse.json({ ok: false, error: error.message, debug: { TABLE, dateISO } }, { status: 500 });
  }

  const rows = (data ?? []).map((r: any) => ({
    id: String(r.id ?? ""),
    created_at: r.created_at ?? null,

    date: r.day ?? null,
    hora_chegada: r.start_time ? String(r.start_time).slice(0, 5) : null,
    hora_saida: r.end_time ? String(r.end_time).slice(0, 5) : null,
    pessoas: r.people ?? null,
    mesa: r.table_code ?? null,
    nome: r.customer_name ?? null,
    telefone: r.phone ?? null,
    obs: r.notes ?? null,
    locacao: r.location ?? null,
    valor: centsToBRL(r.value_cents),
    status: r.is_paid ? "Pago" : "Pendente",

    _raw: r,
  }));

  return NextResponse.json({ ok: true, rows });
}

export async function POST(req: Request) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "INVALID_JSON" }, { status: 400 });
  }

  const day = str(body?.date) ?? todayISO_BR();
  const start_time = toTimeHHMMSS(body?.hora_chegada);
  const end_time = toTimeHHMMSS(body?.hora_saida);
  const customer_name = str(body?.nome);
  const people = toIntOrNull(body?.pessoas) ?? 1;
  const table_code = str(body?.mesa);
  const phone = str(body?.telefone);
  const notes = str(body?.obs);
  const location = str(body?.locacao);
  const value_cents = moneyBRToCents(body?.valor);
  const is_paid = String(body?.status || "").toLowerCase().includes("pago");

  if (!customer_name || !start_time) {
    return NextResponse.json(
      { ok: false, error: "MISSING_REQUIRED_FIELDS", hint: "nome e hora_chegada são obrigatórios" },
      { status: 400 }
    );
  }

  const payload = {
    day,
    start_time,
    end_time: end_time || null,
    people,
    customer_name,
    phone,
    notes,
    table_code,
    location,
    value_cents,
    is_paid,
  };

  const { data, error } = await supabase.from(TABLE).insert(payload).select("*").single();

  if (error) {
    return NextResponse.json({ ok: false, error: error.message, debug: { TABLE, payload } }, { status: 500 });
  }

  const row = {
    id: String(data?.id ?? ""),
    created_at: data?.created_at ?? null,
    date: data?.day ?? null,
    hora_chegada: data?.start_time ? String(data.start_time).slice(0, 5) : null,
    hora_saida: data?.end_time ? String(data.end_time).slice(0, 5) : null,
    pessoas: data?.people ?? null,
    mesa: data?.table_code ?? null,
    nome: data?.customer_name ?? null,
    telefone: data?.phone ?? null,
    obs: data?.notes ?? null,
    locacao: data?.location ?? null,
    valor: centsToBRL(data?.value_cents),
    status: data?.is_paid ? "Pago" : "Pendente",
    _raw: data,
  };

  return NextResponse.json({ ok: true, row });
}
