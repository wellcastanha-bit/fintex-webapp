// app/api/dashboard/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// =========================
// ✅ SUPABASE (SERVER)
// =========================
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // coloque no .env da Vercel também
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
  const { y, m } = parseISODate(iso); // m 1..12
  const nextMonthBase = Date.UTC(y, m, 1, 12, 0, 0); // m aqui já é "próximo" pq Date.UTC mês é 0..11
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

// ✅ normaliza pagamentos pra não existir "ONLINE", "DÉBITO" etc separado
function normalizePayment(raw: string | null | undefined) {
  const x = (raw || "").trim().toUpperCase();

  if (!x) return "OUTROS";
  if (x.includes("DIN")) return "DINHEIRO";
  if (x.includes("PIX")) return "PIX";
  if (x.includes("DEB")) return "CARTÃO DE DÉBITO";
  if (x.includes("CRÉD") || x.includes("CRED")) return "CARTÃO DE CRÉDITO";
  if (x.includes("ONLINE")) return "PAGAMENTO ONLINE";

  // se já veio certinho:
  if (x === "CARTÃO DE DÉBITO" || x === "CARTÃO DE CRÉDITO" || x === "PAGAMENTO ONLINE") return x;

  return x;
}

function resolveRange(params: URLSearchParams) {
  const periodRaw = (params.get("period") || "hoje").toLowerCase();
  const date = params.get("date"); // YYYY-MM-DD (local)
  const start = params.get("start"); // YYYY-MM-DD (local)
  const end = params.get("end"); // YYYY-MM-DD (local)

  const now = Date.now();
  const baseOp = getOperationalBaseDateISO(now);

  let startLocalISO: string;
  let endLocalISO: string; // sempre EXCLUSIVO em "data local" (a gente aplica cutoff depois)
  let label = periodRaw;

  // prioridade: intervalo explícito
  if (start && end) {
    startLocalISO = start;
    endLocalISO = addDaysISO(end, 1); // end inclusivo -> exclusivo
    label = "intervalo";
  } else if (date) {
    startLocalISO = date;
    endLocalISO = addDaysISO(date, 1);
    label = "data";
  } else {
    // ✅ aceita nomes que o FRONT manda
    if (periodRaw === "hoje") {
      startLocalISO = baseOp;
      endLocalISO = addDaysISO(baseOp, 1);
      label = "hoje";
    } else if (periodRaw === "ontem") {
      startLocalISO = addDaysISO(baseOp, -1);
      endLocalISO = baseOp; // exclusivo (baseOp 06:00)
      label = "ontem";
    } else if (periodRaw === "ultimos_7" || periodRaw === "últimos_7") {
      // 7 dias incluindo o dia operacional atual
      startLocalISO = addDaysISO(baseOp, -6);
      endLocalISO = addDaysISO(baseOp, 1);
      label = "ultimos_7";
    } else if (periodRaw === "ultimos_30" || periodRaw === "últimos_30") {
      startLocalISO = addDaysISO(baseOp, -29);
      endLocalISO = addDaysISO(baseOp, 1);
      label = "ultimos_30";
    } else if (periodRaw === "esse_mes" || periodRaw === "esse mês" || periodRaw === "mes" || periodRaw === "mês") {
      // mês até o dia operacional atual (MTD)
      startLocalISO = firstDayOfMonthISO(baseOp);
      endLocalISO = addDaysISO(baseOp, 1);
      label = "esse_mes";
    } else if (periodRaw === "mes_anterior" || periodRaw === "mês anterior") {
      // mês fechado anterior
      const startPrev = firstDayPrevMonthISO(baseOp);
      const startThis = firstDayOfMonthISO(baseOp);
      startLocalISO = startPrev;
      endLocalISO = startThis;
      label = "mes_anterior";
    } else {
      // fallback seguro
      startLocalISO = baseOp;
      endLocalISO = addDaysISO(baseOp, 1);
      label = "hoje";
    }
  }

  // aplica cutoff 06:00
  const startUtcISO = localDateTimeToUtcISO(startLocalISO, OP_CUTOFF_HOUR, 0, 0, 0);
  const endUtcISO = localDateTimeToUtcISO(endLocalISO, OP_CUTOFF_HOUR, 0, 0, 0);

  return {
    label,
    startLocalISO,
    endLocalISO,
    startUtcISO,
    endUtcISO,
  };
}

type OrderRow = {
  id: string;
  created_at: string;
  platform: string | null;
  service_type: string | null;
  payment_method: string | null;
  r_final: number | string | null;
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

  const out = Array.from(map.values()).sort((a, b) => b.valor - a.valor);
  return out;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const range = resolveRange(searchParams);

    const { data: orders, error } = await supabase
      .from("orders")
      .select("id, created_at, platform, service_type, payment_method, r_final")
      .gte("created_at", range.startUtcISO)
      .lt("created_at", range.endUtcISO)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    const rows = (orders || []) as OrderRow[];

    const pedidos = rows.length;
    const faturamento = rows.reduce((acc, r) => acc + num(r.r_final), 0);
    const ticket_medio = pedidos > 0 ? faturamento / pedidos : 0;

    const margem = 0.2;
    const lucro_estimado = faturamento * margem;

    const despesas = 0;
    const despesas_pct = faturamento > 0 ? despesas / faturamento : 0;

    // ✅ aqui entra a normalização
    const byPagamento = groupAgg(rows, (r) => normalizePayment(r.payment_method));
    const byPlataforma = groupAgg(rows, (r) => (r.platform || "OUTROS").trim().toUpperCase());
    const byAtendimento = groupAgg(rows, (r) => (r.service_type || "OUTROS").trim().toUpperCase());

    const withPct = (arr: { key: string; pedidos: number; valor: number }[]) =>
      arr.map((x) => ({
        ...x,
        pct: faturamento > 0 ? x.valor / faturamento : 0,
      }));

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
