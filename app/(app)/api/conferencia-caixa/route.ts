// app/api/conferencia-caixa/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const COMPANY_ID = "default";

// dia operacional
const OP_CUTOFF_HOUR = 6;
const TZ_OFFSET_MIN = -180; // -03:00

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
});

function json(ok: boolean, data: any, status = 200) {
  return NextResponse.json({ ok, ...data }, { status });
}

function num(v: any) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}
function pad2(n: number) {
  return String(n).padStart(2, "0");
}
function isISODate(s: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(s);
}
function parseISODate(iso: string) {
  const [y, m, d] = iso.split("-").map((x) => Number(x));
  return { y, m, d };
}
function addDaysISO(iso: string, days: number) {
  const { y, m, d } = parseISODate(iso);
  const base = Date.UTC(y, m - 1, d, 12, 0, 0);
  const next = base + days * 24 * 60 * 60 * 1000;
  const dd = new Date(next);
  const yy = dd.getUTCFullYear();
  const mm = dd.getUTCMonth() + 1;
  const day = dd.getUTCDate();
  return `${yy}-${pad2(mm)}-${pad2(day)}`;
}
function dateToISODateLocal(msUtc: number) {
  const msLocal = msUtc + TZ_OFFSET_MIN * 60_000;
  const d = new Date(msLocal);
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth() + 1;
  const day = d.getUTCDate();
  return `${y}-${pad2(m)}-${pad2(day)}`;
}
function hourLocal(msUtc: number) {
  const msLocal = msUtc + TZ_OFFSET_MIN * 60_000;
  const d = new Date(msLocal);
  return d.getUTCHours();
}
function getOperationalDateISO(nowUtcMs: number) {
  const todayLocalISO = dateToISODateLocal(nowUtcMs);
  const hLocal = hourLocal(nowUtcMs);
  if (hLocal < OP_CUTOFF_HOUR) return addDaysISO(todayLocalISO, -1);
  return todayLocalISO;
}
function localDateTimeToUtcISO(dateISO: string, hour = 0, min = 0, sec = 0, ms = 0) {
  const { y, m, d } = parseISODate(dateISO);
  const utcMs = Date.UTC(y, m - 1, d, hour, min, sec, ms) - TZ_OFFSET_MIN * 60_000;
  return new Date(utcMs).toISOString();
}

// soma contagens do cash_sessions (jsonb)
function sumCounts(counts: any): number {
  if (!Array.isArray(counts)) return 0;
  let total = 0;
  for (const it of counts) {
    const qty = num(it?.qty ?? it?.qtd ?? it?.count ?? 0);
    const val = num(it?.value ?? it?.valor ?? it?.val ?? 0);
    total += qty * val;
  }
  return Number.isFinite(total) ? total : 0;
}

// normaliza pagamento igual teu dashboard
function norm(s: any) {
  return String(s || "").trim().toUpperCase().replace(/\s+/g, " ");
}
function normPay(v: any) {
  const x = norm(v);
  if (!x) return "OUTROS";
  if (x === "CARTAO DE CREDITO") return "CARTÃO DE CRÉDITO";
  if (x === "CARTAO DE DEBITO") return "CARTÃO DE DÉBITO";
  if (x === "PAGAMENTO_ONLINE") return "PAGAMENTO ONLINE";
  return x;
}

export async function GET(req: NextRequest) {
  try {
    if (!SUPABASE_URL || !SERVICE_KEY) {
      return json(false, { error: "Env faltando: NEXT_PUBLIC_SUPABASE_URL e/ou SUPABASE_SERVICE_ROLE_KEY" }, 500);
    }

    const { searchParams } = new URL(req.url);
    const dateQ = String(searchParams.get("date") || "").trim();

    const op_date = dateQ && isISODate(dateQ) ? dateQ : getOperationalDateISO(Date.now());

    // range UTC do dia operacional (06:00 -> 06:00)
    const startUtcISO = localDateTimeToUtcISO(op_date, OP_CUTOFF_HOUR, 0, 0, 0);
    const endUtcISO = localDateTimeToUtcISO(addDaysISO(op_date, 1), OP_CUTOFF_HOUR, 0, 0, 0);

    // 1) cash_session
    const { data: session, error: sErr } = await supabase
      .from("cash_sessions")
      .select("id, op_date, initial_counts, final_counts, created_at, updated_at, company_id")
      .eq("company_id", COMPANY_ID)
      .eq("op_date", op_date)
      .maybeSingle();

    if (sErr) return json(false, { error: sErr.message }, 500);

    const caixaInicial = sumCounts((session as any)?.initial_counts);
    const caixaFinal = sumCounts((session as any)?.final_counts);

    // 2) cash_entries do dia
    const { data: entries, error: eErr } = await supabase
      .from("cash_entries")
      .select("id, op_date, type, category, description, amount, occurred_at, created_at, company_id")
      .eq("company_id", COMPANY_ID)
      .eq("op_date", op_date)
      .order("occurred_at", { ascending: false });

    if (eErr) return json(false, { error: eErr.message }, 500);

    let manual_in = 0;
    let expense = 0;
    let withdrawal = 0;

    for (const r of (entries || []) as any[]) {
      const t = norm(r?.type);
      const amt = num(r?.amount);
      if (t === "MANUAL_IN") manual_in += amt;
      if (t === "EXPENSE") expense += amt;
      if (t === "WITHDRAWAL") withdrawal += amt;
    }

    // 3) pedidos em dinheiro do dia operacional
    const { data: orders, error: oErr } = await supabase
      .from("orders")
      .select("id, created_at, payment_method, r_final")
      .gte("created_at", startUtcISO)
      .lt("created_at", endUtcISO);

    if (oErr) return json(false, { error: oErr.message }, 500);

    const pedidosDinheiro = (orders || [])
      .filter((r: any) => normPay(r?.payment_method) === "DINHEIRO")
      .reduce((acc: number, r: any) => acc + num(r?.r_final), 0);

    const entradasDinheiro = pedidosDinheiro + manual_in;
    const saidasDinheiro = expense + withdrawal;

    const esperado = caixaInicial + entradasDinheiro - saidasDinheiro;
    const quebraCaixa = caixaFinal - esperado;

    // "prova real": o que deveria ter no caixa (esperado)
    const provaReal = esperado;

    const status: "OK" | "ATENÇÃO" = Math.abs(quebraCaixa) > 5 ? "ATENÇÃO" : "OK";

    return json(true, {
      op_date,
      range: { startUtcISO, endUtcISO },
      conferencia_caixa: {
        status,
        caixaInicial,
        caixaFinal,
        entradasDinheiro,
        saidasDinheiro,
        provaReal,
        quebraCaixa,
      },
      session: session || null,
      entries: entries || [],
    });
  } catch (e: any) {
    return json(false, { error: e?.message || "server_error" }, 500);
  }
}