// app/api/dashboard/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
});

const OP_CUTOFF_HOUR = 6;
const TZ_OFFSET_MIN = -180;
const COMPANY_ID = "default";
const PAGE_SIZE = 1000;
const PRECO_FATIA = 5;

const ORDER_SELECT =
  "id, created_at, platform, service_type, payment_method, r_final, fatias";

type OrderRow = {
  id: string;
  created_at: string;
  r_final: number | string | null;
  fatias: number | string | null;
  platform: string | null;
  service_type: string | null;
  payment_method: string | null;
};

type CashEntryRow = {
  id: string;
  company_id?: string | null;
  op_date?: string | null;
  type: string | null;
  category?: string | null;
  description?: string | null;
  amount: number | string | null;
  occurred_at?: string | null;
  created_at?: string | null;
};

type CashSessionRow = {
  initial_counts?: unknown;
  final_counts?: unknown;
  op_date?: string | null;
  company_id?: string | null;
};

type GroupAggRow = {
  key: string;
  pedidos: number;
  valor: number;
};

type FixedListRow = {
  label: string;
  pedidos: number;
  valor: number;
  pct: number;
};

function num(v: unknown) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function intNonNegative(v: unknown) {
  const n = Math.floor(Number(v));
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function parseISODate(iso: string) {
  const [y, m, d] = iso.split("-").map((x) => Number(x));
  return { y, m, d };
}

function clampISO(iso: string) {
  const m = String(iso || "").match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[1]}-${m[2]}-${m[3]}` : "";
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

function localDateTimeToUtcISO(
  dateISO: string,
  hour = 0,
  min = 0,
  sec = 0,
  ms = 0
) {
  const { y, m, d } = parseISODate(dateISO);
  const utcMs =
    Date.UTC(y, m - 1, d, hour, min, sec, ms) - TZ_OFFSET_MIN * 60_000;
  return new Date(utcMs).toISOString();
}

function getOperationalBaseDateISO(nowUtcMs: number) {
  const todayLocalISO = dateToISODateLocal(nowUtcMs);
  const hLocal = hourLocal(nowUtcMs);
  if (hLocal < OP_CUTOFF_HOUR) return addDaysISO(todayLocalISO, -1);
  return todayLocalISO;
}

function isoToBR(iso: string) {
  const m = String(iso || "").match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return iso;
  return `${m[3]}/${m[2]}/${m[1]}`;
}

function resolveRange(params: URLSearchParams) {
  const now = Date.now();
  const baseOp = getOperationalBaseDateISO(now);

  const fromQ = clampISO(params.get("from") || params.get("date_from") || "");
  const toQ = clampISO(params.get("to") || params.get("date_to") || "");

  if (fromQ && toQ) {
    const a = fromQ <= toQ ? fromQ : toQ;
    const b = fromQ <= toQ ? toQ : fromQ;

    const startLocalISO = a;
    const endLocalISO = addDaysISO(b, 1);

    const startUtcISO = localDateTimeToUtcISO(
      startLocalISO,
      OP_CUTOFF_HOUR,
      0,
      0,
      0
    );
    const endUtcISO = localDateTimeToUtcISO(
      endLocalISO,
      OP_CUTOFF_HOUR,
      0,
      0,
      0
    );

    const label = `${isoToBR(a)} - ${isoToBR(b)}`;

    return { label, startLocalISO, endLocalISO, startUtcISO, endUtcISO };
  }

  const raw = (params.get("period") || "hoje").toLowerCase().trim();

  let startLocalISO = baseOp;
  let endLocalISO = addDaysISO(baseOp, 1);
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
  } else if (raw === "este_mes") {
    const { y, m } = parseISODate(baseOp);
    const first = `${y}-${pad2(m)}-01`;
    startLocalISO = first;
    endLocalISO = addDaysISO(baseOp, 1);
    label = "Esse mês";
  } else if (raw === "mes_anterior") {
    const { y, m } = parseISODate(baseOp);
    const firstThisMonth = Date.UTC(y, m - 1, 1, 12, 0, 0);
    const lastPrevDate = new Date(firstThisMonth - 24 * 60 * 60 * 1000);
    const yy = lastPrevDate.getUTCFullYear();
    const mm = lastPrevDate.getUTCMonth() + 1;
    const lastPrevISO = `${yy}-${pad2(mm)}-${pad2(lastPrevDate.getUTCDate())}`;
    const firstPrevISO = `${yy}-${pad2(mm)}-01`;

    startLocalISO = firstPrevISO;
    endLocalISO = addDaysISO(lastPrevISO, 1);
    label = "Mês anterior";
  }

  const startUtcISO = localDateTimeToUtcISO(
    startLocalISO,
    OP_CUTOFF_HOUR,
    0,
    0,
    0
  );
  const endUtcISO = localDateTimeToUtcISO(
    endLocalISO,
    OP_CUTOFF_HOUR,
    0,
    0,
    0
  );

  return { label, startLocalISO, endLocalISO, startUtcISO, endUtcISO };
}

function norm(s: unknown) {
  return String(s || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, " ");
}

function normPlatform(v: unknown) {
  const x = norm(v);
  if (!x) return "OUTROS";
  if (x === "BALCAO") return "BALCÃO";
  if (x.includes("DELIVERY")) return "DELIVERY MUCH";
  if (x.includes("WHATS")) return "WHATSAPP";
  return x;
}

function normService(v: unknown) {
  const x = norm(v);
  if (!x) return "OUTROS";
  if (x === "MESA") return "MESAS";
  return x;
}

function normPay(v: unknown) {
  const x = norm(v);
  if (!x) return "OUTROS";
  if (x === "CARTAO DE CREDITO") return "CARTÃO DE CRÉDITO";
  if (x === "CARTAO DE DEBITO") return "CARTÃO DE DÉBITO";
  if (x === "PAGAMENTO_ONLINE") return "PAGAMENTO ONLINE";
  return x;
}

function groupAgg(rows: OrderRow[], key: (r: OrderRow) => string) {
  const map = new Map<string, GroupAggRow>();

  for (const r of rows) {
    const k = key(r) || "OUTROS";
    const item = map.get(k) || { key: k, pedidos: 0, valor: 0 };
    item.pedidos += 1;
    item.valor += num(r.r_final);
    map.set(k, item);
  }

  return Array.from(map.values()).sort((a, b) => b.valor - a.valor);
}

function sumCounts(counts: unknown): number {
  if (!Array.isArray(counts)) return 0;

  let total = 0;

  for (const it of counts) {
    const row = it as Record<string, unknown>;

    const qty = num(
      row?.quantity ??
        row?.qty ??
        row?.qtd ??
        row?.count ??
        row?.quantidade ??
        0
    );

    const val = num(
      row?.denomination ?? row?.value ?? row?.valor ?? row?.val ?? row?.v ?? 0
    );

    total += qty * val;
  }

  return Number.isFinite(total) ? total : 0;
}

function fixedList(
  labels: string[],
  agg: GroupAggRow[],
  faturamento: number
): FixedListRow[] {
  const map = new Map<string, { pedidos: number; valor: number }>();

  for (const it of agg) {
    map.set(it.key, { pedidos: it.pedidos, valor: it.valor });
  }

  return labels.map((label) => {
    const got = map.get(label);
    const valor = got ? got.valor : 0;
    const pedidos = got ? got.pedidos : 0;
    const pct = faturamento > 0 ? (valor / faturamento) * 100 : 0;
    return { label, pedidos, valor, pct };
  });
}

async function fetchAllOrdersInRange(startUtcISO: string, endUtcISO: string) {
  const allRows: OrderRow[] = [];
  let from = 0;

  while (true) {
    const to = from + PAGE_SIZE - 1;

    const { data, error } = await supabase
      .from("orders")
      .select(ORDER_SELECT)
      .gte("created_at", startUtcISO)
      .lt("created_at", endUtcISO)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      return { data: null as OrderRow[] | null, error };
    }

    const batch = (data || []) as OrderRow[];
    allRows.push(...batch);

    if (!batch.length || batch.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  return { data: allRows, error: null };
}

export async function GET(req: NextRequest) {
  try {
    if (!SUPABASE_URL || !SERVICE_KEY) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Env faltando: NEXT_PUBLIC_SUPABASE_URL e/ou SUPABASE_SERVICE_ROLE_KEY",
        },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(req.url);
    const range = resolveRange(searchParams);

    const { data: orders, error: ordersError } = await fetchAllOrdersInRange(
      range.startUtcISO,
      range.endUtcISO
    );

    if (ordersError) {
      return NextResponse.json(
        { ok: false, error: ordersError.message },
        { status: 500 }
      );
    }

    const rows = (orders || []) as OrderRow[];

    const pedidos = rows.length;
    const faturamento = rows.reduce((acc, r) => acc + num(r.r_final), 0);
    const ticket_medio = pedidos > 0 ? faturamento / pedidos : 0;
    const fatias_vendidas = rows.reduce(
      (acc, r) => acc + intNonNegative(r.fatias),
      0
    );
    const valor_fatias = fatias_vendidas * PRECO_FATIA;

    const { data: cashRows, error: cashError } = await supabase
      .from("cash_entries")
      .select(
        "id, type, category, description, amount, occurred_at, created_at, op_date, company_id"
      )
      .eq("company_id", COMPANY_ID)
      .gte("occurred_at", range.startUtcISO)
      .lt("occurred_at", range.endUtcISO)
      .order("occurred_at", { ascending: false });

    if (cashError) {
      return NextResponse.json(
        { ok: false, error: cashError.message },
        { status: 500 }
      );
    }

    const cash = (cashRows || []) as CashEntryRow[];

    const saidasItems = cash
      .filter((r) => norm(r.type) === "EXPENSE")
      .map((r) => ({
        id: r.id,
        type: r.type,
        category: r.category ?? null,
        description: r.description ?? null,
        amount: num(r.amount),
        occurred_at: r.occurred_at ?? null,
        created_at: r.created_at ?? null,
        op_date: r.op_date ?? null,
        company_id: r.company_id ?? null,
      }));

    const despesas = saidasItems.reduce((acc, r) => acc + num(r.amount), 0);
    const despesas_pct = faturamento > 0 ? (despesas / faturamento) * 100 : 0;

    const envMargem = Number(process.env.DASHBOARD_MARGIN_PCT);
    const MARGEM_PCT = Number.isFinite(envMargem) ? envMargem : 30;

    const lucro_estimado = faturamento * (MARGEM_PCT / 100);

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
        .select("initial_counts, final_counts, op_date, company_id")
        .eq("company_id", COMPANY_ID)
        .eq("op_date", op_date)
        .maybeSingle();

      if (sErr) {
        return NextResponse.json(
          { ok: false, error: sErr.message },
          { status: 500 }
        );
      }

      const cashSession = session as CashSessionRow | null;

      const caixaInicial = sumCounts(cashSession?.initial_counts);
      const caixaFinal = sumCounts(cashSession?.final_counts);

      const { data: dayCash, error: dErr } = await supabase
        .from("cash_entries")
        .select("type, amount")
        .eq("company_id", COMPANY_ID)
        .eq("op_date", op_date);

      if (dErr) {
        return NextResponse.json(
          { ok: false, error: dErr.message },
          { status: 500 }
        );
      }

      let manual_in = 0;
      let expense = 0;
      let withdrawal = 0;

      for (const r of (dayCash || []) as Array<{ type: string | null; amount: unknown }>) {
        const t = norm(r.type);
        const amt = num(r.amount);
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

      const status: "OK" | "ATENÇÃO" =
        Math.abs(quebra) > 5 ? "ATENÇÃO" : "OK";

      conferencia = {
        status,
        caixaInicial,
        entradasDinheiro,
        saidas,
        caixaFinal,
        quebra,
      };
    }

    const byPagamentoDyn = groupAgg(rows, (r) => normPay(r.payment_method));
    const byPlataformaDyn = groupAgg(rows, (r) => normPlatform(r.platform));
    const byAtendimentoDyn = groupAgg(rows, (r) => normService(r.service_type));

    const FIX_PAY = [
      "DINHEIRO",
      "PIX",
      "PAGAMENTO ONLINE",
      "CARTÃO DE CRÉDITO",
      "CARTÃO DE DÉBITO",
    ];
    const FIX_PLAT = [
      "AIQFOME",
      "BALCÃO",
      "WHATSAPP",
      "DELIVERY MUCH",
      "IFOOD",
    ];
    const FIX_ATT = ["ENTREGA", "RETIRADA", "MESAS"];

    const ranking_pagamentos = fixedList(FIX_PAY, byPagamentoDyn, faturamento);
    const pedidos_por_plataforma = fixedList(
      FIX_PLAT,
      byPlataformaDyn,
      faturamento
    );
    const pedidos_por_atendimento = fixedList(
      FIX_ATT,
      byAtendimentoDyn,
      faturamento
    );

    const groups = {
      pagamentos: byPagamentoDyn.map((x) => ({
        ...x,
        pct: faturamento > 0 ? (x.valor / faturamento) * 100 : 0,
      })),
      plataformas: byPlataformaDyn.map((x) => ({
        ...x,
        pct: faturamento > 0 ? (x.valor / faturamento) * 100 : 0,
      })),
      atendimentos: byAtendimentoDyn.map((x) => ({
        ...x,
        pct: faturamento > 0 ? (x.valor / faturamento) * 100 : 0,
      })),
    };

    const conferencia_caixa = {
      caixa_inicial: conferencia.caixaInicial,
      caixa_final: conferencia.caixaFinal,
      entradas_dinheiro: conferencia.entradasDinheiro,
      saidas_dinheiro: conferencia.saidas,
      prova_real:
        conferencia.caixaInicial +
        conferencia.entradasDinheiro -
        conferencia.saidas,
      quebra_caixa: conferencia.quebra,
      status: conferencia.status,
    };

    return NextResponse.json({
      ok: true,
      range,
      kpis: {
        pedidos,
        faturamento,
        ticket_medio,
        margem: MARGEM_PCT,
        lucro_estimado,
        despesas,
        despesas_pct,
        fatias_vendidas,
        valor_fatias,
        preco_unitario_fatia: PRECO_FATIA,
      },
      conferencia,
      conferencia_caixa,
      ranking_pagamentos,
      pedidos_por_plataforma,
      pedidos_por_atendimento,
      saidas: {
        items: saidasItems,
      },
      groups,
      total_orders: pedidos,
      total_fatias: fatias_vendidas,
      valor_total_fatias: valor_fatias,
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Erro desconhecido";
    return NextResponse.json(
      { ok: false, error: message },
      { status: 500 }
    );
  }
}