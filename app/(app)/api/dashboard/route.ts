// app/api/dashboard/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// =========================
// ✅ SUPABASE (SERVER)
// =========================
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// =========================
// ✅ CONFIG DIA OPERACIONAL
// =========================
const OP_CUTOFF_HOUR = 6; // 06:00
const TZ_OFFSET_MIN = -180; // Brasil (-03:00)

// =========================
// helpers
// =========================
function num(v: any) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}
function pad2(n: number) {
  return String(n).padStart(2, "0");
}
function parseISODate(iso: string) {
  const [y, m, d] = iso.split("-").map((x) => Number(x));
  return { y, m, d };
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
function localDateTimeToUtcISO(dateISO: string, hour = 0, min = 0, sec = 0, ms = 0) {
  const { y, m, d } = parseISODate(dateISO);
  const utcMs = Date.UTC(y, m - 1, d, hour, min, sec, ms) - TZ_OFFSET_MIN * 60_000;
  return new Date(utcMs).toISOString();
}

function getOperationalBaseDateISO(nowUtcMs: number) {
  const todayLocalISO = dateToISODateLocal(nowUtcMs);
  const hLocal = hourLocal(nowUtcMs);
  if (hLocal < OP_CUTOFF_HOUR) return addDaysISO(todayLocalISO, -1);
  return todayLocalISO;
}

function firstDayOfMonthISO(iso: string) {
  const { y, m } = parseISODate(iso);
  return `${y}-${pad2(m)}-01`;
}
function firstDayNextMonthISO(iso: string) {
  const { y, m } = parseISODate(iso);
  const nextMonthBase = Date.UTC(y, m, 1, 12, 0, 0);
  const nm = new Date(nextMonthBase);
  const ny = nm.getUTCFullYear();
  const nmm = nm.getUTCMonth() + 1;
  return `${ny}-${pad2(nmm)}-01`;
}
function firstDayPrevMonthISO(iso: string) {
  const { y, m } = parseISODate(iso);
  const prevMonthBase = Date.UTC(y, m - 2, 1, 12, 0, 0);
  const pm = new Date(prevMonthBase);
  const py = pm.getUTCFullYear();
  const pmm = pm.getUTCMonth() + 1;
  return `${py}-${pad2(pmm)}-01`;
}

// =========================
// ✅ resolveRange (usa params do front)
// - period=hoje|ontem|ultimos_7|ultimos_30|esse_mes|mes_anterior
// - date=YYYY-MM-DD
// - start=YYYY-MM-DD&end=YYYY-MM-DD (end inclusivo)
// =========================
function resolveRange(params: URLSearchParams) {
  const periodRaw = (params.get("period") || "hoje").toLowerCase();
  const date = params.get("date");
  const start = params.get("start");
  const end = params.get("end");

  const now = Date.now();
  const baseOp = getOperationalBaseDateISO(now);

  let startLocalISO: string;
  let endLocalISO: string; // exclusivo
  let label = periodRaw;

  if (start && end) {
    startLocalISO = start;
    endLocalISO = addDaysISO(end, 1);
    label = "intervalo";
  } else if (date) {
    startLocalISO = date;
    endLocalISO = addDaysISO(date, 1);
    label = "data";
  } else {
    if (periodRaw === "hoje") {
      startLocalISO = baseOp;
      endLocalISO = addDaysISO(baseOp, 1);
      label = "hoje";
    } else if (periodRaw === "ontem") {
      startLocalISO = addDaysISO(baseOp, -1);
      endLocalISO = baseOp;
      label = "ontem";
    } else if (periodRaw === "ultimos_7" || periodRaw === "últimos_7") {
      startLocalISO = addDaysISO(baseOp, -6);
      endLocalISO = addDaysISO(baseOp, 1);
      label = "ultimos_7";
    } else if (periodRaw === "ultimos_30" || periodRaw === "últimos_30") {
      startLocalISO = addDaysISO(baseOp, -29);
      endLocalISO = addDaysISO(baseOp, 1);
      label = "ultimos_30";
    } else if (periodRaw === "esse_mes" || periodRaw === "esse mês" || periodRaw === "mes" || periodRaw === "mês") {
      startLocalISO = firstDayOfMonthISO(baseOp);
      endLocalISO = addDaysISO(baseOp, 1);
      label = "esse_mes";
    } else if (periodRaw === "mes_anterior" || periodRaw === "mês anterior") {
      const startPrev = firstDayPrevMonthISO(baseOp);
      const startThis = firstDayOfMonthISO(baseOp);
      startLocalISO = startPrev;
      endLocalISO = startThis;
      label = "mes_anterior";
    } else if (periodRaw === "proximo_mes" || periodRaw === "próximo_mes") {
      const startNext = firstDayNextMonthISO(baseOp);
      const endNext = firstDayNextMonthISO(startNext);
      startLocalISO = startNext;
      endLocalISO = endNext;
      label = "proximo_mes";
    } else {
      startLocalISO = baseOp;
      endLocalISO = addDaysISO(baseOp, 1);
      label = "hoje";
    }
  }

  const startUtcISO = localDateTimeToUtcISO(startLocalISO, OP_CUTOFF_HOUR, 0, 0, 0);
  const endUtcISO = localDateTimeToUtcISO(endLocalISO, OP_CUTOFF_HOUR, 0, 0, 0);

  return { label, startLocalISO, endLocalISO, startUtcISO, endUtcISO };
}

type OrderRow = {
  id: string;
  created_at: string;
  r_final: number | string | null;
  platform: string | null;
  service_type: string | null;
  payment_method: string | null;
};

function groupAgg(rows: OrderRow[], key: (r: OrderRow) => string) {
  const map = new Map<string, { key: string; pedidos: number; valor: number }>();

  for (const r of rows) {
    const k = (key(r) || "OUTROS").trim() || "OUTROS";
    const item = map.get(k) || { key: k, pedidos: 0, valor: 0 };
    item.pedidos += 1;
    item.valor += num(r.r_final);
    map.set(k, item);
  }

  return Array.from(map.values()).sort((a, b) => b.valor - a.valor);
}

// ✅ soma contagens do cash_sessions (jsonb)
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

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const range = resolveRange(searchParams);

    // ✅ por enquanto fixo (igual teu schema default)
    const company_id = (searchParams.get("company_id") || "pizzablu").trim();

    // =========================
    // ✅ ORDERS (faturamento etc)
    // =========================
    const { data: orders, error: ordersError } = await supabase
      .from("orders")
      .select("id, created_at, platform, service_type, payment_method, r_final")
      .gte("created_at", range.startUtcISO)
      .lt("created_at", range.endUtcISO)
      .order("created_at", { ascending: false });

    if (ordersError) {
      return NextResponse.json({ ok: false, error: ordersError.message }, { status: 500 });
    }

    const rows = (orders || []) as OrderRow[];

    const pedidos = rows.length;
    const faturamento = rows.reduce((acc, r) => acc + num(r.r_final), 0);
    const ticket_medio = pedidos > 0 ? faturamento / pedidos : 0;

    // =========================
    // ✅ CASH ENTRIES (para despesas + conferência)
    // usamos occurred_at pra KPIs do período
    // =========================
    const { data: cashRows, error: cashError } = await supabase
      .from("cash_entries")
      .select("type, amount, occurred_at, op_date")
      .gte("occurred_at", range.startUtcISO)
      .lt("occurred_at", range.endUtcISO);

    if (cashError) {
      return NextResponse.json({ ok: false, error: cashError.message }, { status: 500 });
    }

    const cash = (cashRows || []) as Array<{ type: string | null; amount: any; occurred_at: string; op_date: string }>;

    // KPIs despesas (período)
    const despesas = cash
      .filter((r) => (r.type || "").toLowerCase() === "expense")
      .reduce((acc, r) => acc + num(r.amount), 0);

    const despesas_pct = faturamento > 0 ? despesas / faturamento : 0;

    // ✅ margem/lucro por enquanto: fixo 30%
    const FIXED_MARGIN = 0.3;
    const margem = FIXED_MARGIN;
    const lucro_estimado = faturamento * FIXED_MARGIN;

    // =========================
    // ✅ CONFERÊNCIA DE CAIXA (SÓ faz sentido p/ 1 dia)
    // - usa cash_sessions (contagens) + cash_entries por op_date
    // - entradasDinheiro: pedidos dinheiro (do range operacional) + manual_in do dia
    // - saidas: expense + withdrawal do dia
    // =========================

    // detecta se o range é exatamente 1 dia operacional
    const isOneDay = range.endLocalISO === addDaysISO(range.startLocalISO, 1);
    const op_date = isOneDay ? range.startLocalISO : null;

    let conferencia = {
      status: "ATENÇÃO" as "OK" | "ATENÇÃO",
      caixaInicial: 0,
      entradasDinheiro: 0,
      saidas: 0,
      caixaFinal: 0,
      quebra: 0,
    };

    if (op_date) {
      // sessão (contagens)
      const { data: session, error: sErr } = await supabase
        .from("cash_sessions")
        .select("initial_counts, final_counts")
        .eq("company_id", company_id)
        .eq("op_date", op_date)
        .maybeSingle();

      if (sErr) {
        return NextResponse.json({ ok: false, error: sErr.message }, { status: 500 });
      }

      const caixaInicial = sumCounts(session?.initial_counts);
      const caixaFinal = sumCounts(session?.final_counts);

      // entradas/saídas por op_date (não depende de timezone)
      const { data: dayCash, error: dErr } = await supabase
        .from("cash_entries")
        .select("type, amount")
        .eq("company_id", company_id)
        .eq("op_date", op_date);

      if (dErr) {
        return NextResponse.json({ ok: false, error: dErr.message }, { status: 500 });
      }

      let manual_in = 0;
      let expense = 0;
      let withdrawal = 0;

      for (const r of dayCash || []) {
        const t = String(r.type || "").toLowerCase();
        const amt = num((r as any).amount);

        if (t === "manual_in") manual_in += amt;
        if (t === "expense") expense += amt;
        if (t === "withdrawal") withdrawal += amt;
      }

      // pedidos em dinheiro (já respeita 06:00 porque vem do range start/end)
      const pedidosDinheiro = rows
        .filter((r) => String(r.payment_method || "").trim().toLowerCase() === "dinheiro")
        .reduce((acc, r) => acc + num(r.r_final), 0);

      const entradasDinheiro = pedidosDinheiro + manual_in;
      const saidas = expense + withdrawal;

      const esperado = caixaInicial + entradasDinheiro - saidas;
      const quebra = caixaFinal - esperado;

      const status: "OK" | "ATENÇÃO" = Math.abs(quebra) > 5 ? "ATENÇÃO" : "OK";

      conferencia = {
        status,
        caixaInicial,
        entradasDinheiro,
        saidas,
        caixaFinal,
        quebra,
      };
    }

    // =========================
    // agrupamentos
    // =========================
    const byPagamento = groupAgg(rows, (r) => (r.payment_method || "OUTROS").trim().toUpperCase());
    const byPlataforma = groupAgg(rows, (r) => (r.platform || "OUTROS").trim().toUpperCase());
    const byAtendimento = groupAgg(rows, (r) => (r.service_type || "OUTROS").trim().toUpperCase());

    const withPct = (arr: { key: string; pedidos: number; valor: number }[]) =>
      arr.map((x) => ({ ...x, pct: faturamento > 0 ? x.valor / faturamento : 0 }));

    return NextResponse.json({
      ok: true,
      range,
      kpis: {
        pedidos,
        faturamento,
        ticket_medio,
        margem,
        lucro_estimado,
        despesas,
        despesas_pct,
      },
      conferencia,
      groups: {
        pagamentos: withPct(byPagamento),
        plataformas: withPct(byPlataforma),
        atendimentos: withPct(byAtendimento),
      },
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Erro desconhecido" }, { status: 500 });
  }
}
