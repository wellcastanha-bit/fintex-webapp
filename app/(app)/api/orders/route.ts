// app/api/orders/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function num(v: any) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function startEndFromISODate(dateISO: string) {
  // dateISO: YYYY-MM-DD
  // intervalo [00:00, 00:00 do dia seguinte)
  const start = `${dateISO}T00:00:00.000`;
  const end = `${dateISO}T23:59:59.999`;
  return { start, end };
}

/* =========================
   GET
   - padrão: { ok, rows } (PedidosClient)
   - mode=caixa: { ok, items } (Caixa Diário)
   - ?date=YYYY-MM-DD filtra por created_at
========================= */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const dateISO = searchParams.get("date"); // YYYY-MM-DD
  const mode = searchParams.get("mode"); // "caixa" | null

  let q = supabase
    .from("orders")
    .select(
      "id, created_at, status, responsavel, customer_name, platform, service_type, bairros, taxa_entrega, payment_method, r_inicial, r_final, troco"
    )
    .order("created_at", { ascending: false });

  // ✅ filtro por dia (created_at)
  if (dateISO) {
    const { start, end } = startEndFromISODate(dateISO);
    q = q.gte("created_at", start).lte("created_at", end);
  }

  const { data, error } = await q;

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  // ✅ Caixa Diário quer payload leve e fácil de somar r_final
  if (mode === "caixa") {
    const items = (data ?? []).map((o: any) => ({
      id: String(o.id),
      created_at: String(o.created_at),
      payment_method: o.payment_method ?? null,
      r_final: o.r_final ?? 0,
      customer_name: o.customer_name ?? null,
      platform: o.platform ?? null,
      service_type: o.service_type ?? null,
    }));

    return NextResponse.json({ ok: true, items });
  }

  // ✅ formato antigo (PedidosClient) — mantém compatibilidade
  const rows = (data ?? []).map((o: any) => ({
    id: String(o.id),
    created_at: String(o.created_at),

    status: o.status ?? null,
    responsavel: o.responsavel ?? null,

    cliente_nome: o.customer_name ?? null,
    plataforma: o.platform ?? null,
    atendimento: o.service_type ?? null,

    bairro: o.bairros ?? null,
    taxa_entrega: o.taxa_entrega ?? 0,

    pagamento: o.payment_method ?? null,
    valor_pago: o.r_inicial ?? 0,
    valor_final: o.r_final ?? 0,
    troco: o.troco ?? 0,
  }));

  return NextResponse.json({ ok: true, rows });
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
    // se não mandar, banco usa default current_date
    order_date: body?.order_date ?? undefined,

    customer_name: body?.customer_name ?? null,
    platform: body?.platform ?? null,
    service_type: body?.service_type ?? null,
    payment_method: body?.payment_method ?? null,

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
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, row: data });
}

/* =========================
   PATCH — editar RESPONSÁVEL e/ou STATUS
   ✅ sem login
   ✅ devolve row no formato do PedidosClient
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

    cliente_nome: data.customer_name ?? null,
    plataforma: data.platform ?? null,
    atendimento: data.service_type ?? null,

    bairro: data.bairros ?? null,
    taxa_entrega: data.taxa_entrega ?? 0,

    pagamento: data.payment_method ?? null,
    valor_pago: data.r_inicial ?? 0,
    valor_final: data.r_final ?? 0,
    troco: data.troco ?? 0,
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
