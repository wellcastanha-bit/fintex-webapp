// app/api/orders/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const OP_CUTOFF_HOUR = 6;
const TZ_OFFSET_MIN = -180;

function corsHeaders(origin?: string | null) {
  const allowedOrigin = origin === "http://localhost:3002" ? origin : "http://localhost:3002";

  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Credentials": "true",
    Vary: "Origin",
  };
}

function jsonWithCors(
  data: any,
  init?: { status?: number; origin?: string | null }
) {
  return NextResponse.json(data, {
    status: init?.status,
    headers: corsHeaders(init?.origin),
  });
}

export async function OPTIONS(req: Request) {
  const origin = req.headers.get("origin");
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(origin),
  });
}

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
function localDateTimeToUTCISO(
  dateISO: string,
  hour: number,
  minute = 0,
  second = 0,
  ms = 0
) {
  const [yy, mm, dd] = dateISO.split("-").map((x) => Number(x));
  const localMs = Date.UTC(yy, (mm || 1) - 1, dd || 1, hour, minute, second, ms);
  const utcMs = localMs - TZ_OFFSET_MIN * 60 * 1000;
  return new Date(utcMs).toISOString();
}
function operationalRangeUTCFromAnchor(dateISO: string) {
  const startISO = localDateTimeToUTCISO(dateISO, OP_CUTOFF_HOUR, 0, 0, 0);
  const startMs = new Date(startISO).getTime();
  const endISO = new Date(startMs + 24 * 60 * 60 * 1000).toISOString();
  return { startISO, endISO };
}
function operationalRangeUTCFromTo(fromISO: string, toISO: string) {
  const startISO = localDateTimeToUTCISO(fromISO, OP_CUTOFF_HOUR, 0, 0, 0);
  const toPlus1 = addDaysISO(toISO, 1);
  const endISO = localDateTimeToUTCISO(toPlus1, OP_CUTOFF_HOUR, 0, 0, 0);
  return { startISO, endISO };
}
function currentOperationalAnchorISO() {
  const nowUtc = Date.now();
  const nowLocalMs = nowUtc + TZ_OFFSET_MIN * 60 * 1000;
  const nowLocal = new Date(nowLocalMs);

  let anchorISO = `${nowLocal.getFullYear()}-${pad2(nowLocal.getMonth() + 1)}-${pad2(
    nowLocal.getDate()
  )}`;

  if (nowLocal.getHours() < OP_CUTOFF_HOUR) {
    const yesterdayLocalMs = nowLocalMs - 24 * 60 * 60 * 1000;
    anchorISO = toISODateLocalFromMs(yesterdayLocalMs);
  }

  return anchorISO;
}

function normalizePlatform(v: any): string {
  const raw = String(v ?? "").trim();
  if (!raw) return "ValeFood";

  const up = raw
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();

  if (up.includes("VALEFOOD")) return "ValeFood";
  if (up.includes("BALCAO")) return "BALCÃO";
  return raw;
}
function normalizeServiceType(v: any): string | null {
  const raw = String(v ?? "").trim();
  if (!raw) return null;

  const up = raw
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();

  if (up === "MESA" || up === "MESAS" || up.includes("MESA")) return "MESAS";
  if (up.includes("ENTREGA")) return "entrega";
  if (up.includes("RETIRADA")) return "retirada";
  if (up.includes("BALCAO")) return "BALCÃO";

  return raw;
}
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
  if (up === "CARTAO NA ENTREGA") return "CARTÃO NA ENTREGA";

  if (up.includes("DIN")) return "DINHEIRO";
  if (up.includes("PIX")) return "PIX";
  if (up.includes("DEB")) return "CARTÃO DE DÉBITO";
  if (up.includes("CRED")) return "CARTÃO DE CRÉDITO";
  if (up.includes("ONLINE")) return "PAGAMENTO ONLINE";
  if (up.includes("CARTAO")) return "CARTÃO NA ENTREGA";

  return raw;
}

function toDatePartsBR(input: any) {
  const d = input ? new Date(input) : new Date();
  if (Number.isNaN(d.getTime())) {
    const now = new Date();
    return {
      data: `${pad2(now.getDate())}/${pad2(now.getMonth() + 1)}/${now.getFullYear()}`,
      hora: `${pad2(now.getHours())}:${pad2(now.getMinutes())}`,
    };
  }

  return {
    data: `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`,
    hora: `${pad2(d.getHours())}:${pad2(d.getMinutes())}`,
  };
}

function extractCustomerName(body: any): string | null {
  return body?.customer_name ?? body?.cliente_nome ?? body?.customer?.name ?? null;
}
function extractOrderDate(body: any): string | undefined {
  const raw = body?.order_date ?? body?.created_at ?? body?.createdAt ?? body?.data_hora;
  if (!raw) return undefined;

  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return undefined;
  return d.toISOString();
}
function extractPaymentMethod(body: any): string | null {
  return body?.payment_method ?? body?.forma_pagamento ?? body?.payment?.method ?? null;
}
function extractServiceType(body: any): string | null {
  return body?.service_type ?? body?.tipo_entrega ?? body?.deliveryType ?? null;
}
function extractTroco(body: any): number {
  return num(body?.troco ?? body?.troco_para ?? body?.payment?.changeFor ?? 0);
}
function extractInitialValue(body: any): number {
  return num(body?.r_inicial ?? body?.subtotal ?? body?.pricing?.subtotal ?? 0);
}
function extractTaxaEntrega(body: any): number {
  return num(body?.taxa_entrega ?? body?.delivery_fee ?? body?.pricing?.deliveryFee ?? 0);
}
function extractBairro(body: any): string | null {
  return (
    body?.bairros ??
    body?.bairro ??
    body?.customer?.bairro ??
    body?.endereco?.bairro ??
    null
  );
}

function mapPedidoRow(o: any) {
  const dt = toDatePartsBR(o.created_at);

  const clienteNome = o.cliente_nome ?? o.customer_name ?? null;
  const atendimento = o.tipo_entrega ?? o.service_type ?? null;
  const pagamento = o.forma_pagamento ?? o.payment_method ?? null;
  const bairro = o.bairros ?? o.bairro ?? null;
  const rInicial = num(o.subtotal ?? o.r_inicial ?? 0);
  const taxaEntrega = num(o.taxa_entrega ?? 0);
  const rFinal = num(o.total ?? o.r_final ?? rInicial + taxaEntrega);
  const troco = num(o.troco_para ?? o.troco ?? 0);
  const plataforma = o.plataforma ?? o.platform ?? "ValeFood";

  return {
    id: String(o.id),
    created_at: String(o.created_at),

    status: o.status ?? null,
    responsavel: o.responsavel ?? null,

    customer_name: clienteNome,
    r_final: rFinal,

    cliente_nome: clienteNome,
    valor_final: rFinal,

    platform: plataforma,
    service_type: atendimento,
    bairros: bairro,
    taxa_entrega: taxaEntrega,
    payment_method: pagamento,
    r_inicial: rInicial,
    troco,

    plataforma,
    atendimento,
    bairro,
    pagamento,
    valor_pago: rInicial,

    data: dt.data,
    hora: dt.hora,
    cliente: clienteNome,
  };
}

/* =========================
   GET
========================= */
export async function GET(req: Request) {
  const origin = req.headers.get("origin");
  const { searchParams } = new URL(req.url);

  const mode = searchParams.get("mode");
  const fromISO = searchParams.get("from") || null;
  const toISO = searchParams.get("to") || null;
  const dateISO = searchParams.get("date") || searchParams.get("op_date");

  const anchorISO = dateISO || currentOperationalAnchorISO();

  const range =
    fromISO && toISO
      ? operationalRangeUTCFromTo(fromISO, toISO)
      : operationalRangeUTCFromAnchor(anchorISO);

  const { startISO, endISO } = range;

  let q = supabase
    .from("pedidos")
    .select("*")
    .order("created_at", { ascending: false });

  q = q.gte("created_at", startISO).lt("created_at", endISO);

  const { data, error } = await q;

  if (error) {
    return jsonWithCors(
      {
        ok: false,
        error: error.message,
        debug: { startISO, endISO, anchorISO, fromISO, toISO },
      },
      { status: 500, origin }
    );
  }

  if (mode === "caixa") {
    const items = (data ?? []).map((o: any) => {
      const row = mapPedidoRow(o);
      return {
        id: row.id,
        created_at: row.created_at,

        payment_method: row.payment_method,
        r_final: row.r_final,
        customer_name: row.customer_name,
        platform: row.platform,
        service_type: row.service_type,

        pagamento: row.pagamento,
        valor_final: row.valor_final,
        cliente_nome: row.cliente_nome,
        plataforma: row.plataforma,
        atendimento: row.atendimento,
      };
    });

    return jsonWithCors(
      {
        ok: true,
        items,
        op: { anchorISO, fromISO, toISO, startISO, endISO },
      },
      { origin }
    );
  }

  const rows = (data ?? []).map(mapPedidoRow);

  return jsonWithCors(
    {
      ok: true,
      rows,
      op: { anchorISO, fromISO, toISO, startISO, endISO },
    },
    { origin }
  );
}

/* =========================
   POST
========================= */
export async function POST(req: Request) {
  const origin = req.headers.get("origin");

  let body: any;
  try {
    body = await req.json();
  } catch {
    return jsonWithCors(
      { ok: false, error: "INVALID_JSON" },
      { status: 400, origin }
    );
  }

  const payload = {
    origem: String(body?.origem ?? "valefood").trim() || "valefood",
    cliente_nome: extractCustomerName(body),
    cliente_telefone: body?.cliente_telefone ?? body?.customer_phone ?? body?.customer?.phone ?? null,
    endereco: body?.endereco ?? null,
    tipo_entrega: normalizeServiceType(extractServiceType(body)),
    forma_pagamento: normalizePaymentMethod(extractPaymentMethod(body)),
    troco_para: extractTroco(body),
    subtotal: extractInitialValue(body),
    taxa_entrega: extractTaxaEntrega(body),
    total: num(body?.total ?? body?.r_final ?? extractInitialValue(body) + extractTaxaEntrega(body)),
    status: body?.status ?? "EM PRODUÇÃO",
    observacoes: body?.observacoes ?? null,
    created_at: extractOrderDate(body) ?? undefined,
  };

  const { data, error } = await supabase
    .from("pedidos")
    .insert(payload)
    .select("*")
    .single();

  if (error) {
    return jsonWithCors(
      {
        ok: false,
        error: error.message,
        debug: {
          payload,
          sent_customer_name:
            body?.customer_name ?? body?.cliente_nome ?? body?.customer?.name ?? null,
          sent_payment_method:
            body?.payment_method ?? body?.forma_pagamento ?? body?.payment?.method ?? null,
          sent_service_type:
            body?.service_type ?? body?.tipo_entrega ?? body?.deliveryType ?? null,
        },
      },
      { status: 500, origin }
    );
  }

  return jsonWithCors(
    { ok: true, row: mapPedidoRow(data) },
    { origin }
  );
}

/* =========================
   PATCH
========================= */
export async function PATCH(req: Request) {
  const origin = req.headers.get("origin");

  let body: any;
  try {
    body = await req.json();
  } catch {
    return jsonWithCors(
      { ok: false, error: "INVALID_JSON" },
      { status: 400, origin }
    );
  }

  const id = body?.id ? String(body.id) : "";
  if (!id) {
    return jsonWithCors(
      { ok: false, error: "MISSING_ID" },
      { status: 400, origin }
    );
  }

  const update: any = {};
  if (body?.status !== undefined) update.status = body.status ?? null;
  if (body?.responsavel !== undefined) update.responsavel = body.responsavel ?? null;

  if (!Object.keys(update).length) {
    return jsonWithCors(
      { ok: false, error: "NOTHING_TO_UPDATE" },
      { status: 400, origin }
    );
  }

  const { data, error } = await supabase
    .from("pedidos")
    .update(update)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    return jsonWithCors(
      { ok: false, error: error.message },
      { status: 500, origin }
    );
  }

  return jsonWithCors(
    { ok: true, row: mapPedidoRow(data) },
    { origin }
  );
}

/* =========================
   DELETE
========================= */
export async function DELETE(req: Request) {
  const origin = req.headers.get("origin");
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return jsonWithCors(
      { ok: false, error: "MISSING_ID" },
      { status: 400, origin }
    );
  }

  const { error } = await supabase.from("pedidos").delete().eq("id", id);

  if (error) {
    return jsonWithCors(
      { ok: false, error: error.message },
      { status: 500, origin }
    );
  }

  return jsonWithCors(
    { ok: true },
    { origin }
  );
}