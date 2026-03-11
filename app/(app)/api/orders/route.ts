// app/api/orders/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  (process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)!
);

const OP_CUTOFF_HOUR = 6;
const TZ_OFFSET_MIN = -180;
const PAGE_SIZE = 1000;

const ORDER_SELECT =
  "id, created_at, status, responsavel, customer_name, fatias, platform, service_type, bairros, taxa_entrega, payment_method, r_inicial, r_final, troco";

type RawOrderRow = {
  id: string;
  created_at: string;
  status: string | null;
  responsavel: string | null;
  customer_name: string | null;
  fatias: number | string | null;
  platform: string | null;
  service_type: string | null;
  bairros: string | null;
  taxa_entrega: number | string | null;
  payment_method: string | null;
  r_inicial: number | string | null;
  r_final: number | string | null;
  troco: number | string | null;
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

function normalizePlatform(v: unknown): string | null {
  const raw = String(v ?? "").trim();
  if (!raw) return null;

  const up = raw.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();

  if (up.includes("BALCAO")) return "BALCÃO";
  if (up.includes("WHATS")) return "WHATSAPP";
  if (up.includes("AIQ")) return "AIQFOME";
  if (up.includes("IFOOD") || up.includes("I FOOD") || up.includes("I-FOOD")) return "IFOOD";
  if (up.includes("DELIVERY")) return "DELIVERY MUCH";

  return raw;
}

function normalizeServiceType(v: unknown): string | null {
  const raw = String(v ?? "").trim();
  if (!raw) return null;

  const up = raw.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();

  if (up === "MESA" || up === "MESAS" || up.includes("MESA")) return "MESAS";
  if (up.includes("RET")) return "RETIRADA";
  if (up.includes("ENT")) return "ENTREGA";

  return raw;
}

function normalizePaymentMethod(v: unknown): string | null {
  const raw = String(v ?? "").trim();
  if (!raw) return null;

  const up = raw.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();

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

  return raw;
}

function mapOrderRow(o: RawOrderRow) {
  const fatias = intNonNegative(o.fatias);
  const rFinal = num(o.r_final);
  const rInicial = num(o.r_inicial);
  const taxaEntrega = num(o.taxa_entrega);
  const troco = num(o.troco);

  return {
    id: String(o.id),
    created_at: String(o.created_at),

    status: o.status ?? null,
    responsavel: o.responsavel ?? null,

    customer_name: o.customer_name ?? null,
    fatias,
    r_final: rFinal,

    cliente_nome: o.customer_name ?? null,
    valor_final: rFinal,

    platform: o.platform ?? null,
    service_type: o.service_type ?? null,
    bairros: o.bairros ?? null,
    taxa_entrega: taxaEntrega,
    payment_method: o.payment_method ?? null,
    r_inicial: rInicial,
    troco,

    plataforma: o.platform ?? null,
    atendimento: o.service_type ?? null,
    bairro: o.bairros ?? null,
    pagamento: o.payment_method ?? null,
    valor_pago: rInicial,
  };
}

async function fetchAllOrdersInRange(startISO: string, endISO: string) {
  const allRows: RawOrderRow[] = [];
  let from = 0;

  while (true) {
    const to = from + PAGE_SIZE - 1;

    const { data, error } = await supabase
      .from("orders")
      .select(ORDER_SELECT)
      .gte("created_at", startISO)
      .lt("created_at", endISO)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      return { data: null as RawOrderRow[] | null, error };
    }

    const batch = (data ?? []) as RawOrderRow[];
    allRows.push(...batch);

    if (batch.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  return { data: allRows, error: null };
}

export async function GET(req: Request) {
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

  const { data, error } = await fetchAllOrdersInRange(startISO, endISO);

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

  const rawRows = (data ?? []) as RawOrderRow[];
  const rows = rawRows.map(mapOrderRow);

  const totalFatias = rows.reduce((acc, row) => acc + intNonNegative(row.fatias), 0);
  const totalFaturamento = rows.reduce((acc, row) => acc + num(row.r_final), 0);

  if (mode === "caixa") {
    const items = rawRows.map((o) => ({
      id: String(o.id),
      created_at: String(o.created_at),
      payment_method: o.payment_method ?? null,
      r_final: num(o.r_final),
      customer_name: o.customer_name ?? null,
      fatias: intNonNegative(o.fatias),
      platform: o.platform ?? null,
      service_type: o.service_type ?? null,
      pagamento: o.payment_method ?? null,
      valor_final: num(o.r_final),
      cliente_nome: o.customer_name ?? null,
      plataforma: o.platform ?? null,
      atendimento: o.service_type ?? null,
    }));

    return NextResponse.json({
      ok: true,
      items,
      total: items.length,
      total_fatias: items.reduce((acc, item) => acc + intNonNegative(item.fatias), 0),
      total_faturamento: items.reduce((acc, item) => acc + num(item.r_final), 0),
      op: { anchorISO, fromISO, toISO, startISO, endISO },
    });
  }

  return NextResponse.json({
    ok: true,
    rows,
    total: rows.length,
    total_fatias: totalFatias,
    total_faturamento: totalFaturamento,
    resumo: {
      pedidos: rows.length,
      fatias_vendidas: totalFatias,
      faturamento: totalFaturamento,
      ticket_medio: rows.length > 0 ? totalFaturamento / rows.length : 0,
    },
    op: { anchorISO, fromISO, toISO, startISO, endISO },
  });
}

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: "INVALID_JSON" }, { status: 400 });
  }

  const fatias = intNonNegative(body?.fatias);
  const rInicial = num(body?.r_inicial);
  const troco = num(body?.troco);
  const rFinal =
    body?.r_final !== undefined && body?.r_final !== null
      ? num(body.r_final)
      : rInicial;

  const payload = {
    order_date: body?.order_date ?? undefined,
    customer_name: body?.customer_name ?? null,
    fatias,
    platform: normalizePlatform(body?.platform),
    service_type: normalizeServiceType(body?.service_type),
    payment_method: normalizePaymentMethod(body?.payment_method),
    bairros: body?.bairros ?? null,
    taxa_entrega: num(body?.taxa_entrega),
    responsavel: body?.responsavel ?? null,
    status: "EM PRODUÇÃO",
    r_inicial: rInicial,
    r_final: rFinal,
    troco,
  };

  const { data, error } = await supabase
    .from("orders")
    .insert(payload)
    .select(ORDER_SELECT)
    .single();

  if (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error.message,
        debug: {
          sent_fatias: body?.fatias ?? null,
          normalized_fatias: payload.fatias,
          sent_platform: body?.platform ?? null,
          normalized_platform: payload.platform,
          sent_service_type: body?.service_type ?? null,
          normalized_service_type: payload.service_type,
          sent_payment_method: body?.payment_method ?? null,
          normalized_payment_method: payload.payment_method,
          sent_r_inicial: body?.r_inicial ?? null,
          normalized_r_inicial: payload.r_inicial,
          sent_r_final: body?.r_final ?? null,
          normalized_r_final: payload.r_final,
        },
      },
      { status: 500 }
    );
  }

  const row = mapOrderRow(data as RawOrderRow);

  return NextResponse.json({ ok: true, row });
}

export async function PATCH(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: "INVALID_JSON" }, { status: 400 });
  }

  const id = body?.id ? String(body.id) : "";
  if (!id) {
    return NextResponse.json({ ok: false, error: "MISSING_ID" }, { status: 400 });
  }

  const update: Record<string, unknown> = {};

  if (body?.responsavel !== undefined) update.responsavel = body.responsavel ?? null;
  if (body?.status !== undefined) update.status = body.status ?? null;
  if (body?.fatias !== undefined) update.fatias = intNonNegative(body.fatias);
  if (body?.customer_name !== undefined) update.customer_name = body.customer_name ?? null;
  if (body?.platform !== undefined) update.platform = normalizePlatform(body.platform);
  if (body?.service_type !== undefined) update.service_type = normalizeServiceType(body.service_type);
  if (body?.payment_method !== undefined) {
    update.payment_method = normalizePaymentMethod(body.payment_method);
  }
  if (body?.bairros !== undefined) update.bairros = body.bairros ?? null;
  if (body?.taxa_entrega !== undefined) update.taxa_entrega = num(body.taxa_entrega);
  if (body?.r_inicial !== undefined) update.r_inicial = num(body.r_inicial);
  if (body?.r_final !== undefined) update.r_final = num(body.r_final);
  if (body?.troco !== undefined) update.troco = num(body.troco);

  if (!Object.keys(update).length) {
    return NextResponse.json({ ok: false, error: "NOTHING_TO_UPDATE" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("orders")
    .update(update)
    .eq("id", id)
    .select(ORDER_SELECT)
    .single();

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  const row = mapOrderRow(data as RawOrderRow);

  return NextResponse.json({ ok: true, row });
}

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