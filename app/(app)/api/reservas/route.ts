// app/api/reservas/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * ✅ Reservas (tabela: reservations)
 * - GET   /api/reservas?date=YYYY-MM-DD   (lista do dia)
 * - POST  /api/reservas                  (cria)
 *
 * ✅ Aceita payload tanto no formato PT (nome/hora_chegada...) quanto no formato DB (customer_name/start_time...)
 */

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)!
);

// ✅ TABELA REAL
const TABLE = "reservations";

// Brasil (-03:00)
const TZ_OFFSET_MIN = -180;

/* =========================
   Utils
========================= */
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
function isISODate(s: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(s);
}

/* =========================
   GET (lista reservas do dia)
========================= */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const dateISO = searchParams.get("date") || todayISO_BR();

  // se vier lixo, cai pra hoje (evita quebrar tela)
  const safeDate = isISODate(dateISO) ? dateISO : todayISO_BR();

  const { data, error } = await supabase
    .from(TABLE)
    .select(
      "id, created_at, day, start_time, end_time, people, customer_name, phone, notes, table_code, location, value_cents, is_paid"
    )
    .eq("day", safeDate)
    .order("start_time", { ascending: true });

  if (error) {
    return NextResponse.json({ ok: false, error: error.message, debug: { TABLE, dateISO: safeDate } }, { status: 500 });
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

/* =========================
   POST (cria reserva)
   ✅ aceita PT e DB/camelCase
========================= */
export async function POST(req: Request) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "INVALID_JSON" }, { status: 400 });
  }

  // ✅ Day (PT: date | DB: day)
  const day = str(body?.date) ?? str(body?.day) ?? todayISO_BR();

  // ✅ Times (PT: hora_chegada/hora_saida | DB: start_time/end_time | camelCase)
  const start_time =
    toTimeHHMMSS(body?.hora_chegada) ??
    toTimeHHMMSS(body?.start_time) ??
    toTimeHHMMSS(body?.horaChegada) ??
    toTimeHHMMSS(body?.startTime);

  const end_time =
    toTimeHHMMSS(body?.hora_saida) ??
    toTimeHHMMSS(body?.end_time) ??
    toTimeHHMMSS(body?.horaSaida) ??
    toTimeHHMMSS(body?.endTime);

  // ✅ Nome (PT: nome | DB: customer_name | camelCase)
  const customer_name =
    str(body?.nome) ??
    str(body?.customer_name) ??
    str(body?.customerName) ??
    str(body?.cliente) ??
    str(body?.name);

  // ✅ Outros campos (PT e DB)
  const people = toIntOrNull(body?.pessoas) ?? toIntOrNull(body?.people) ?? 1;

  const table_code = str(body?.mesa) ?? str(body?.table_code) ?? str(body?.tableCode);

  const phone = str(body?.telefone) ?? str(body?.phone);

  const notes = str(body?.obs) ?? str(body?.notes);

  const location = str(body?.locacao) ?? str(body?.location);

  const value_cents = moneyBRToCents(body?.valor ?? body?.value ?? body?.value_cents);

  const is_paid =
    body?.is_paid === true ||
    String(body?.status ?? "")
      .toLowerCase()
      .includes("pago");

  // ✅ Regras mínimas
  if (!customer_name || !start_time) {
    return NextResponse.json(
      {
        ok: false,
        error: "MISSING_REQUIRED_FIELDS",
        hint: "nome/customer_name e hora_chegada/start_time são obrigatórios",
        debug_received: {
          day,
          nome: body?.nome ?? body?.customer_name ?? body?.customerName ?? null,
          hora_chegada: body?.hora_chegada ?? body?.start_time ?? body?.startTime ?? null,
        },
      },
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
