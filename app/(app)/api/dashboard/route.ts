// app/api/dashboard/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// =========================
// ✅ SUPABASE (SERVER)
// =========================
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
});

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

// =========================
// ✅ resolveRange (mobile)
// - period=hoje|ontem|7d|30d
// =========================
function resolveRange(params: URLSearchParams) {
  const raw = (params.get("period") || "hoje").toLowerCase().trim();
  const now = Date.now();
  const baseOp = getOperationalBaseDateISO(now);

  let startLocalISO = baseOp;
  let endLocalISO = addDaysISO(baseOp, 1); // exclusivo
  let label = "Hoje";

  if (raw === "ontem") {
    startLocalISO = addDaysISO(baseOp, -1);
    endLocalISO = baseOp;
    label = "Ontem";
  } else if (raw === "7d") {
    startLocalISO = addDaysISO(baseOp, -6);
    endLocalISO = addDaysISO(baseOp, 1);
    label = "Últimos 7 dias";
  } else if (raw === "30d") {
    startLocalISO = addDaysISO(baseOp, -29);
    endLocalISO = addDaysISO(baseOp, 1);
    label = "Últimos 30 dias";
  } else {
    // hoje (default)
    startLocalISO = baseOp;
    endLocalISO = addDaysISO(baseOp, 1);
    label = "Hoje";
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

// normaliza texto p/ bater certinho
function norm(s: any) {
  return String(s || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, " ");
}

// Mapas p/ “consertar” variações comuns
function normPlatform(v: any) {
  const x = norm(v);
  if (!x) return "OUTROS";
  if (x === "BALCAO") return "BALCÃO";
  if (x.includes("DELIVERY")) return "DELIVERY MUCH";
  if (x.includes("WHATS")) return "WHATSAPP";
  return x;
}
function normService(v: any) {
  const x = norm(v);
  if (!x) return "OUTROS";
  if (x === "MESA") return "MESAS";
  return x;
}
function normPay(v: any) {
  const x = norm(v);
  if (!x) return "OUTROS";
  if (x === "CARTAO DE CREDITO") return "CARTÃO DE CRÉDITO";
  if (x === "CARTAO DE DEBITO") return "CARTÃO DE DÉBITO";
  if (x === "PAGAMENTO_ONLINE") return "PAGAMENTO ONLINE";
  return x;
}

function groupAgg(rows: OrderRow[], key: (r: OrderRow) => string) {
  const map = new Map<string, { key: string; pedidos: number; valor: number }>();

  for (const r of rows) {
    const k = key(r) || "OUTROS";
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

// ✅ monta lista fixa (sempre retorna todos, mesmo zerado)
// pct em % (0–100)
function fixedList(
  labels: string[],
  agg: { key: string; pedidos: number; valor: number }[],
  faturamento: number
) {
  const map = new Map<string, { pedidos: number; valor: number }>();
  for (const it of agg) map.set(it.key, { pedidos: it.pedidos, valor: it.valor });

  return labels.map((label) => {
    const got = map.get(label);
    const valor = got ? got.valor : 0;
    const pedidos = got ? got.pedidos : 0;
    const pct = faturamento > 0 ? (valor / faturamento) * 100 : 0;
    return { label, pedidos, valor, pct };
  });
}

export async function GET(req: NextRequest) {
  try {
    if (!SUPABASE_URL || !SERVICE_KEY) {
      return NextResponse.json(
        { ok: false, error: "Env faltando: NEXT_PUBLIC_SUPABASE_URL e/ou SUPABASE_SERVICE_ROLE_KEY" },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(req.url);
    const range = resolveRange(searchParams);

    // =========================
    // ✅ ORDERS
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
    // ✅ CASH ENTRIES (despesas do período)
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

    const despesas = cash
      .filter((r) => norm(r.type) === "EXPENSE")
      .reduce((acc, r) => acc + num(r.amount), 0);

    const despesas_pct = faturamento > 0 ? (despesas / faturamento) * 100 : 0;

    // ✅ margem/lucro: em % (30)
    const MARGEM_PCT = Number.isFinite(Number(process.env.DASHBOARD_MARGIN_PCT))
      ? num(process.env.DASHBOARD_MARGIN_PCT)
      : 30;

    const lucro_estimado = faturamento * (MARGEM_PCT / 100);

    // =========================
    // ✅ CONFERÊNCIA (só 1 dia)
    // =========================
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
      const { data: session, error: sErr } = await supabase
        .from("cash_sessions")
        .select("initial_counts, final_counts, op_date")
        .eq("op_date", op_date)
        .maybeSingle();

      if (sErr) return NextResponse.json({ ok: false, error: sErr.message }, { status: 500 });

      const caixaInicial = sumCounts((session as any)?.initial_counts);
      const caixaFinal = sumCounts((session as any)?.final_counts);

      const { data: dayCash, error: dErr } = await supabase
        .from("cash_entries")
        .select("type, amount")
        .eq("op_date", op_date);

      if (dErr) return NextResponse.json({ ok: false, error: dErr.message }, { status: 500 });

      let manual_in = 0;
      let expense = 0;
      let withdrawal = 0;

      for (const r of (dayCash || []) as any[]) {
        const t = norm(r?.type);
        const amt = num(r?.amount);
        if (t === "MANUAL_IN") manual_in += amt;
        if (t === "EXPENSE") expense += amt;
        if (t === "WITHDRAWAL") withdrawal += amt;
      }

      const pedidosDinheiro = rows
        .filter((r) => normPay(r.payment_method) === "DINHEIRO")
        .reduce((acc, r) => acc + num(r.r_final), 0);

      const entradasDinheiro = pedidosDinheiro + manual_in;
      const saidas = expense + withdrawal;

      const esperado = caixaInicial + entradasDinheiro - saidas;
      const quebra = caixaFinal - esperado;

      const status: "OK" | "ATENÇÃO" = Math.abs(quebra) > 5 ? "ATENÇÃO" : "OK";

      conferencia = { status, caixaInicial, entradasDinheiro, saidas, caixaFinal, quebra };
    }

    // =========================
    // ✅ agrupamentos (dinâmicos)
    // =========================
    const byPagamentoDyn = groupAgg(rows, (r) => normPay(r.payment_method) || "OUTROS");
    const byPlataformaDyn = groupAgg(rows, (r) => normPlatform(r.platform) || "OUTROS");
    const byAtendimentoDyn = groupAgg(rows, (r) => normService(r.service_type) || "OUTROS");

    // =========================
    // ✅ listas FIXAS (mobile quer sempre mostrar tudo)
    // =========================
    const FIX_PAY = ["DINHEIRO", "PIX", "PAGAMENTO ONLINE", "CARTÃO DE CRÉDITO", "CARTÃO DE DÉBITO"];
    const FIX_PLAT = ["AIQFOME", "BALCÃO", "WHATSAPP", "DELIVERY MUCH", "IFOOD"];
    const FIX_ATT = ["ENTREGA", "RETIRADA", "MESAS"];

    const ranking_pagamentos = fixedList(FIX_PAY, byPagamentoDyn, faturamento);
    const pedidos_por_plataforma = fixedList(FIX_PLAT, byPlataformaDyn, faturamento);
    const pedidos_por_atendimento = fixedList(FIX_ATT, byAtendimentoDyn, faturamento);

    // (opcional) compat antigo
    const groups = {
      pagamentos: byPagamentoDyn.map((x) => ({ ...x, pct: faturamento > 0 ? (x.valor / faturamento) * 100 : 0 })),
      plataformas: byPlataformaDyn.map((x) => ({ ...x, pct: faturamento > 0 ? (x.valor / faturamento) * 100 : 0 })),
      atendimentos: byAtendimentoDyn.map((x) => ({ ...x, pct: faturamento > 0 ? (x.valor / faturamento) * 100 : 0 })),
    };

    return NextResponse.json({
      ok: true,
      range,
      kpis: {
        pedidos,
        faturamento,
        ticket_medio,
        margem: MARGEM_PCT, // ✅ 30 (não 0.3)
        lucro_estimado,
        despesas,
        despesas_pct, // ✅ em %
      },
      conferencia,

      // ✅ MOBILE: SEMPRE FIXO
      ranking_pagamentos,
      pedidos_por_plataforma,
      pedidos_por_atendimento,

      // ✅ compat
      groups,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Erro desconhecido" }, { status: 500 });
  }
}
