// app/api/conferencia/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * ✅ CONFERÊNCIA DE CAIXA (compatível com teu schema)
 *
 * ✅ Agora soma Entradas (Dinheiro) assim:
 *   entradas_dinheiro = (cash_moves: entrada + dinheiro) + (cash_order_entries: pedidos em dinheiro)
 *
 * ✅ Sem company_id obrigatório (default)
 *
 * Tabelas:
 * - cash_sessions (op_date, opening_cash, status, opened_at...)
 * - cash_moves (session_id, kind, pay_method, amount...)
 * - cash_order_entries (company_id, op_date, order_id, amount)  <-- NOVA (ledger de pedidos em dinheiro)
 *
 * GET  /api/conferencia?op_date=YYYY-MM-DD&company_id=default
 * POST /api/conferencia  (set opening_cash OU add move)
 */

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)!,
  { auth: { persistSession: false } }
);

// ✅ CONFIG DIA OPERACIONAL
const OP_CUTOFF_HOUR = 6; // 06:00
const TZ_OFFSET_MIN = -180; // Brasil (-03:00)

// trava simples opcional
const CASH_ADMIN_KEY = process.env.CASH_ADMIN_KEY || "";

function num(v: any) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}
function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function nowLocalMs() {
  return Date.now() + TZ_OFFSET_MIN * 60_000;
}

function getOperationalDateISO() {
  const ms = nowLocalMs();
  const d = new Date(ms);

  const h = d.getUTCHours();
  let y = d.getUTCFullYear();
  let m = d.getUTCMonth();
  let day = d.getUTCDate();

  if (h < OP_CUTOFF_HOUR) {
    const prev = new Date(Date.UTC(y, m, day) - 24 * 60 * 60 * 1000);
    y = prev.getUTCFullYear();
    m = prev.getUTCMonth();
    day = prev.getUTCDate();
  }

  return `${y}-${pad2(m + 1)}-${pad2(day)}`;
}

async function getOrCreateSession(opDateISO: string, companyId: string) {
  const s1 = await supabase
    .from("cash_sessions")
    .select(
      "id, company_id, op_date, created_at, updated_at, opened_at, closed_at, status, opening_cash, initial_counts, final_counts"
    )
    .eq("op_date", opDateISO)
    .eq("company_id", companyId)
    .maybeSingle();

  if (s1.error) throw new Error(s1.error.message);
  if (s1.data) return s1.data;

  const ins = await supabase
    .from("cash_sessions")
    .insert({
      op_date: opDateISO,
      company_id: companyId,
      opening_cash: 0,
      status: "open",
      opened_at: new Date().toISOString(),
      initial_counts: null,
      final_counts: null,
    })
    .select(
      "id, company_id, op_date, created_at, updated_at, opened_at, closed_at, status, opening_cash, initial_counts, final_counts"
    )
    .single();

  if (!ins.error) return ins.data;

  const s2 = await supabase
    .from("cash_sessions")
    .select(
      "id, company_id, op_date, created_at, updated_at, opened_at, closed_at, status, opening_cash, initial_counts, final_counts"
    )
    .eq("op_date", opDateISO)
    .eq("company_id", companyId)
    .single();

  if (s2.error) throw new Error(s2.error.message);
  return s2.data;
}

async function sumPedidosDinheiroLedger(opDateISO: string, companyId: string) {
  // ✅ se a tabela não existir ainda, não quebra a conferência
  const res = await supabase
    .from("cash_order_entries")
    .select("amount")
    .eq("op_date", opDateISO)
    .eq("company_id", companyId);

  if (res.error) {
    const msg = String(res.error.message || "");
    if (msg.toLowerCase().includes("does not exist")) return 0;
    throw new Error(res.error.message);
  }

  return (res.data || []).reduce((s: number, r: any) => s + num(r.amount), 0);
}

async function loadConferencia(opDateISO: string, companyId: string) {
  const session = await getOrCreateSession(opDateISO, companyId);

  const movesRes = await supabase
    .from("cash_moves")
    .select("id, kind, pay_method, amount, category, note, created_at, created_by")
    .eq("session_id", session.id)
    .order("created_at", { ascending: true });

  let moves: any[] = [];
  if (movesRes.error) {
    const msg = String(movesRes.error.message || "");
    if (!msg.toLowerCase().includes("does not exist")) {
      throw new Error(movesRes.error.message);
    }
  } else {
    moves = movesRes.data || [];
  }

  const opening_cash = num(session.opening_cash);

  // ✅ entradas manuais em dinheiro (moves)
  const entradas_manuais_dinheiro = moves
    .filter(
      (m: any) =>
        String(m.kind || "").toLowerCase() === "entrada" && String(m.pay_method || "").toLowerCase() === "dinheiro"
    )
    .reduce((acc: number, m: any) => acc + num(m.amount), 0);

  // ✅ pedidos em dinheiro (ledger)
  const pedidos_dinheiro_total = await sumPedidosDinheiroLedger(opDateISO, companyId);

  // ✅ TOTAL entradas dinheiro
  const entradas_dinheiro = entradas_manuais_dinheiro + pedidos_dinheiro_total;

  const saidas = moves
    .filter((m: any) => String(m.kind || "").toLowerCase() === "saida")
    .reduce((acc: number, m: any) => acc + num(m.amount), 0);

  const caixa_final = opening_cash + entradas_dinheiro - saidas;

  return {
    ok: true,
    op_date: session.op_date,
    company_id: session.company_id,
    session: {
      id: session.id,
      status: session.status,
      opened_at: session.opened_at,
      closed_at: session.closed_at,
      opening_cash,
      initial_counts: session.initial_counts,
      final_counts: session.final_counts,
    },
    totals: {
      caixa_inicial: opening_cash,
      entradas_dinheiro,
      saidas,
      caixa_final,
      quebra: 0,

      // ✅ debug útil (se quiser logar na UI)
      entradas_manuais_dinheiro,
      pedidos_dinheiro_total,
    },
    moves,
  };
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);

    const opDateISO = (url.searchParams.get("op_date") || "").trim() || getOperationalDateISO();
    const companyId = (url.searchParams.get("company_id") || "").trim() || "default";

    const data = await loadConferencia(opDateISO, companyId);
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Erro" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    if (CASH_ADMIN_KEY) {
      const key = req.headers.get("x-cash-key") || "";
      if (key !== CASH_ADMIN_KEY) {
        return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
      }
    }

    const body = await req.json().catch(() => ({} as any));

    const opDateISO = String(body.op_date || "").trim() || getOperationalDateISO();
    const companyId = String(body.company_id || "").trim() || "default";

    // A) set opening_cash
    if (body.opening_cash !== undefined && body.opening_cash !== null) {
      const session = await getOrCreateSession(opDateISO, companyId);

      const up = await supabase
        .from("cash_sessions")
        .update({ opening_cash: num(body.opening_cash), updated_at: new Date().toISOString() })
        .eq("id", session.id);

      if (up.error) throw new Error(up.error.message);

      const data = await loadConferencia(opDateISO, companyId);
      return NextResponse.json(data);
    }

    // B) add move
    const kind = String(body.kind || "").toLowerCase();
    if (kind !== "entrada" && kind !== "saida") {
      return NextResponse.json(
        { ok: false, error: 'Body inválido. Use "opening_cash" OU "kind" = "entrada"/"saida".' },
        { status: 400 }
      );
    }

    const amount = num(body.amount);
    if (!(amount > 0)) {
      return NextResponse.json({ ok: false, error: "amount precisa ser > 0" }, { status: 400 });
    }

    const session = await getOrCreateSession(opDateISO, companyId);

    const ins = await supabase.from("cash_moves").insert({
      session_id: session.id,
      kind,
      pay_method: String(body.pay_method || "dinheiro"),
      amount,
      category: body.category ? String(body.category) : null,
      note: body.note ? String(body.note) : null,
      created_by: body.created_by ? String(body.created_by) : null,
    });

    if (ins.error) throw new Error(ins.error.message);

    const data = await loadConferencia(opDateISO, companyId);
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Erro" }, { status: 500 });
  }
}
