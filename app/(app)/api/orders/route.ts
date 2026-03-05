// app/api/orders/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * ✅ IMPORTANTE
 * Em rota server (Next Route Handler), use SERVICE ROLE para evitar RLS/travas.
 * (Se não tiver setado em algum ambiente, cai no ANON como fallback.)
 */
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)!
);

// ✅ CONFIG DIA OPERACIONAL
const OP_CUTOFF_HOUR = 6; // 06:00
const TZ_OFFSET_MIN = -180; // Brasil (-03:00)

function num(v: any) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}
function pad2(n: number) {
  return String(n).padStart(2, "0");
}
function toISODateLocalFromMs(ms: number) {
  const d = new Date(ms);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function addDaysISO(dateISO: string, days: number) {
  const [yy, mm, dd] = dateISO.split("-").map((x) => Number(x));
  const d = new Date(yy, (mm || 1) - 1, dd || 1);
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

/**
 * Converte "data local" + hora local em UTC ISO (com Z) usando offset fixo.
 * local = UTC + offset  => UTC = local - offset
 */
function localDateTimeToUTCISO(dateISO: string, hour: number, minute = 0, second = 0, ms = 0) {
  const [yy, mm, dd] = dateISO.split("-").map((x) => Number(x));
  const localMs = Date.UTC(yy, (mm || 1) - 1, dd || 1, hour, minute, second, ms);
  const utcMs = localMs - TZ_OFFSET_MIN * 60 * 1000;
  return new Date(utcMs).toISOString();
}

/**
 * Range UTC [start, end) do dia operacional ancorado em dateISO (local).
 * start = dateISO 06:00 local
 * end   = (dateISO+1) 06:00 local
 */
function operationalRangeUTCFromAnchor(dateISO: string) {
  const startISO = localDateTimeToUTCISO(dateISO, OP_CUTOFF_HOUR, 0, 0, 0);
  const startMs = new Date(startISO).getTime();
  const endISO = new Date(startMs + 24 * 60 * 60 * 1000).toISOString();
  return { startISO, endISO };
}

/**
 * Range UTC [start, end) para PERÍODO OPERACIONAL
 * fromISO = YYYY-MM-DD (âncora início)
 * toISO   = YYYY-MM-DD (âncora fim)  -> end = (toISO + 1 dia) às 06:00 local
 */
function operationalRangeUTCFromTo(fromISO: string, toISO: string) {
  const startISO = localDateTimeToUTCISO(fromISO, OP_CUTOFF_HOUR, 0, 0, 0);
  const toPlus1 = addDaysISO(toISO, 1);
  const endISO = localDateTimeToUTCISO(toPlus1, OP_CUTOFF_HOUR, 0, 0, 0);
  return { startISO, endISO };
}

/**
 * Calcula o "anchor dateISO" do dia operacional de agora (no fuso -03) com cutoff 06:00.
 */
function currentOperationalAnchorISO() {
  const nowUtc = Date.now();
  const nowLocalMs = nowUtc + TZ_OFFSET_MIN * 60 * 1000;
  const nowLocal = new Date(nowLocalMs);

  let anchorISO = `${nowLocal.getFullYear()}-${pad2(nowLocal.getMonth() + 1)}-${pad2(nowLocal.getDate())}`;

  // se ainda é antes do cutoff, âncora é ontem
  if (nowLocal.getHours() < OP_CUTOFF_HOUR) {
    const yesterdayLocalMs = nowLocalMs - 24 * 60 * 60 * 1000;
    anchorISO = toISODateLocalFromMs(yesterdayLocalMs);
  }

  return anchorISO;
}

/**
 * ✅ PLATFORM: travar BALCÃO (com acento).
 * Qualquer variação "balcao/balcão" vira "BALCÃO".
 */
function normalizePlatform(v: any): string | null {
  const raw = String(v ?? "").trim();
  if (!raw) return null;

  const up = raw
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();

  if (up.includes("BALCAO")) return "BALCÃO";
  return raw;
}

/**
 * ✅ ATENDIMENTO: você quer somente "MESAS"
 * Qualquer variação "mesa/mesas" vira "MESAS".
 */
function normalizeServiceType(v: any): string | null {
  const raw = String(v ?? "").trim();
  if (!raw) return null;

  const up = raw
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();

  if (up === "MESA" || up === "MESAS" || up.includes("MESA")) return "MESAS";
  return raw;
}

/**
 * ✅ CORREÇÃO DO ERRO "payment_method_check"
 * Mapeia o que o PDV manda para o que o banco aceita.
 * Se não reconhecer, retorna null (não quebra insert).
 */
function normalizePaymentMethod(v: any): string | null {
  const raw = String(v ?? "").trim();
  if (!raw) return null;

  const up = raw
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();

  if (up === "DINHEIRO") return "DINHEIRO";
  if (up === "PIX") return "PIX";
  if (up === "CARTAO DE DEBITO") return "CARTÃO DE DÉBITO";
  if (up === "CARTAO DE CREDITO") return "CARTÃO DE CRÉDITO";
  if (up === "PAGAMENTO ONLINE") return "PAGAMENTO ONLINE";

  if (up.includes("DIN")) return "DINHEIRO";
  if (up.includes("PIX")) return "PIX";
  if (up.includes("DEB")) return "CARTÃO DE DÉBITO";
  if (up.includes("CRED")) return "CARTÃO DE CRÉDITO";
  if (up.includes("ONLINE")) return "PAGAMENTO ONLINE";

  return null;
}

/* =========================
   GET
========================= */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const mode = searchParams.get("mode"); // "caixa" | null

  // ✅ NOVO: período (range) por dia operacional
  // Ex: /api/orders?from=2026-02-10&to=2026-02-16
  const fromISO = searchParams.get("from") || null;
  const toISO = searchParams.get("to") || null;

  // ✅ mantém compat: aceita tanto date quanto op_date
  const dateISO = searchParams.get("date") || searchParams.get("op_date"); // YYYY-MM-DD

  // ✅ decide range:
  // - se vier from/to => range operacional [from 06:00, (to+1) 06:00)
  // - senão => janela operacional de 1 dia pela âncora date/op_date/hoje
  const anchorISO = dateISO || currentOperationalAnchorISO();

  const range =
    fromISO && toISO
      ? operationalRangeUTCFromTo(fromISO, toISO)
      : operationalRangeUTCFromAnchor(anchorISO);

  const { startISO, endISO } = range;

  let q = supabase
    .from("orders")
    .select(
      "id, created_at, status, responsavel, customer_name, platform, service_type, bairros, taxa_entrega, payment_method, r_inicial, r_final, troco"
    )
    .order("created_at", { ascending: false });

  q = q.gte("created_at", startISO).lt("created_at", endISO);

  const { data, error } = await q;

  if (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error.message,
        debug: { startISO, endISO, anchorISO, fromISO, toISO },
      },
      { status: 500 }
    );
  }

  // ✅ modo caixa: manter como estava, mas também devolver aliases (compat)
  if (mode === "caixa") {
    const items = (data ?? []).map((o: any) => ({
      id: String(o.id),
      created_at: String(o.created_at),

      payment_method: o.payment_method ?? null,
      r_final: o.r_final ?? 0,
      customer_name: o.customer_name ?? null,
      platform: o.platform ?? null,
      service_type: o.service_type ?? null,

      // aliases para UI antiga/desktop, se precisar:
      pagamento: o.payment_method ?? null,
      valor_final: o.r_final ?? 0,
      cliente_nome: o.customer_name ?? null,
      plataforma: o.platform ?? null,
      atendimento: o.service_type ?? null,
    }));

    return NextResponse.json({
      ok: true,
      items,
      op: { anchorISO, fromISO, toISO, startISO, endISO },
    });
  }

  // ✅ rows: devolve OS DOIS NOMES (mobile e desktop)
  const rows = (data ?? []).map((o: any) => ({
    id: String(o.id),
    created_at: String(o.created_at),

    status: o.status ?? null,
    responsavel: o.responsavel ?? null,

    // ✅ nomes "originais" (mobile quer esses)
    customer_name: o.customer_name ?? null,
    r_final: o.r_final ?? 0,

    // ✅ nomes "legados" (desktop/UI anterior)
    cliente_nome: o.customer_name ?? null,
    valor_final: o.r_final ?? 0,

    // outros campos
    platform: o.platform ?? null,
    service_type: o.service_type ?? null,
    bairros: o.bairros ?? null,
    taxa_entrega: o.taxa_entrega ?? 0,
    payment_method: o.payment_method ?? null,
    r_inicial: o.r_inicial ?? 0,
    troco: o.troco ?? 0,

    // aliases "bonitinhos"
    plataforma: o.platform ?? null,
    atendimento: o.service_type ?? null,
    bairro: o.bairros ?? null,
    pagamento: o.payment_method ?? null,
    valor_pago: o.r_inicial ?? 0,
  }));

  return NextResponse.json({
    ok: true,
    rows,
    op: { anchorISO, fromISO, toISO, startISO, endISO },
  });
}

/* =========================
   POST — PDV salva pedido no banco
========================= */
export async function POST(req: Request) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "INVALID_JSON" }, { status: 400 });
  }

  const payload = {
    order_date: body?.order_date ?? undefined,
    customer_name: body?.customer_name ?? null,

    // ✅ BALCAO/BALCÃO -> BALCÃO
    platform: normalizePlatform(body?.platform),

    // ✅ MESA/MESAS -> MESAS
    service_type: normalizeServiceType(body?.service_type),

    // ✅ pagamento no padrão do banco
    payment_method: normalizePaymentMethod(body?.payment_method),

    bairros: body?.bairros ?? null,
    taxa_entrega: num(body?.taxa_entrega),

    responsavel: body?.responsavel ?? null,
    status: "EM PRODUÇÃO",

    r_inicial: num(body?.r_inicial),
    troco: num(body?.troco),
    // r_final NÃO envia (calculado no banco)
  };

  const { data, error } = await supabase.from("orders").insert(payload).select("*").single();

  if (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error.message,
        debug: {
          sent_platform: body?.platform ?? null,
          normalized_platform: payload.platform,
          sent_service_type: body?.service_type ?? null,
          normalized_service_type: payload.service_type,
          sent_payment_method: body?.payment_method ?? null,
          normalized_payment_method: payload.payment_method,
        },
      },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, row: data });
}

/* =========================
   PATCH — editar RESPONSÁVEL e/ou STATUS
========================= */
export async function PATCH(req: Request) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "INVALID_JSON" }, { status: 400 });
  }

  const id = body?.id ? String(body.id) : "";
  if (!id) return NextResponse.json({ ok: false, error: "MISSING_ID" }, { status: 400 });

  const update: any = {};
  if (body?.responsavel !== undefined) update.responsavel = body.responsavel ?? null;
  if (body?.status !== undefined) update.status = body.status ?? null;

  if (!Object.keys(update).length) {
    return NextResponse.json({ ok: false, error: "NOTHING_TO_UPDATE" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("orders")
    .update(update)
    .eq("id", id)
    .select(
      "id, created_at, status, responsavel, customer_name, platform, service_type, bairros, taxa_entrega, payment_method, r_inicial, r_final, troco"
    )
    .single();

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  const row = {
    id: String(data.id),
    created_at: String(data.created_at),

    status: data.status ?? null,
    responsavel: data.responsavel ?? null,

    // ✅ ambos nomes
    customer_name: data.customer_name ?? null,
    r_final: data.r_final ?? 0,

    cliente_nome: data.customer_name ?? null,
    valor_final: data.r_final ?? 0,

    platform: data.platform ?? null,
    service_type: data.service_type ?? null,
    bairros: data.bairros ?? null,
    taxa_entrega: data.taxa_entrega ?? 0,
    payment_method: data.payment_method ?? null,
    r_inicial: data.r_inicial ?? 0,
    troco: data.troco ?? 0,

    plataforma: data.platform ?? null,
    atendimento: data.service_type ?? null,
    bairro: data.bairros ?? null,
    pagamento: data.payment_method ?? null,
    valor_pago: data.r_inicial ?? 0,
  };

  return NextResponse.json({ ok: true, row });
}

/* =========================
   DELETE — apagar pedido
========================= */
export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ ok: false, error: "MISSING_ID" }, { status: 400 });
  }

  const { error } = await supabase.from("orders").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
