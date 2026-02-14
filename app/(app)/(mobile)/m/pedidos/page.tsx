// app/(mobile)/m/pedidos/page.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";

const AQUA_LINE = "rgba(79,220,255,0.18)";
const CARD_BG =
  "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))";
const CARD_INNER = "rgba(2,11,24,0.42)";

type Accent = "aqua" | "green" | "yellow" | "red" | "purple";

function accentRGB(accent: Accent) {
  switch (accent) {
    case "green":
      return { line: "rgba(80,255,160,0.35)", glow: "rgba(80,255,160,0.14)", dot: "rgba(80,255,160,0.95)" };
    case "yellow":
      return { line: "rgba(255,200,80,0.35)", glow: "rgba(255,200,80,0.14)", dot: "rgba(255,200,80,0.95)" };
    case "red":
      return { line: "rgba(255,100,120,0.35)", glow: "rgba(255,100,120,0.14)", dot: "rgba(255,100,120,0.95)" };
    case "purple":
      return { line: "rgba(160,120,255,0.35)", glow: "rgba(160,120,255,0.14)", dot: "rgba(160,120,255,0.95)" };
    default:
      return { line: "rgba(79,220,255,0.35)", glow: "rgba(79,220,255,0.14)", dot: "rgba(79,220,255,0.95)" };
  }
}

function fmtBRL(v: number) {
  const n = Number(v);
  const vv = Number.isFinite(n) ? n : 0;
  try {
    return vv.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  } catch {
    return `R$ ${vv.toFixed(2)}`;
  }
}

function brMoneyToNumber(v: any): number {
  if (v == null) return 0;
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;

  let s = String(v).trim();
  if (!s) return 0;

  s = s.replace(/[^\d,.\-]/g, "");
  if (s.includes(",")) s = s.replace(/\./g, "").replace(",", ".");

  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
}
function toISODate(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

/** Dia operacional 06:00 */
function opDateISO(now = new Date(), cutoffHour = 6) {
  const d = new Date(now);
  if (d.getHours() < cutoffHour) d.setDate(d.getDate() - 1);
  return toISODate(d);
}

function Shell({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        borderRadius: 22,
        padding: 14,
        background: CARD_BG,
        border: `1px solid ${AQUA_LINE}`,
        boxShadow: "0 0 0 1px rgba(79,220,255,0.06) inset, 0 26px 70px rgba(0,0,0,0.42)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function PageTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{ fontSize: 18, fontWeight: 1000, letterSpacing: 0.2 }}>{children}</div>
    </div>
  );
}

function Badge({ text, accent = "aqua" }: { text: string; accent?: Accent }) {
  const a = accentRGB(accent);
  return (
    <span
      style={{
        padding: "6px 10px",
        borderRadius: 999,
        border: `1px solid ${a.line}`,
        background: "rgba(255,255,255,0.06)",
        color: "rgba(255,255,255,0.92)",
        fontSize: 11,
        fontWeight: 1000,
        letterSpacing: 0.2,
        boxShadow: `0 0 18px ${a.glow}`,
        whiteSpace: "nowrap",
      }}
    >
      {text}
    </span>
  );
}

type Pedido = {
  id: string;
  cliente: string;
  valor: number;
  plataforma: string;
  atendimento: string;
  pagamento: string;
  hora: string;
  status: string;
  responsavel?: string;
  bairro?: string;
  taxaEntrega?: number;
};

function platformAccent(p: string): Accent {
  const k = String(p || "").toUpperCase();
  if (k.includes("IFOOD")) return "red";
  if (k.includes("AIQ")) return "purple";
  if (k.includes("WHATS")) return "green";
  if (k.includes("DELIVERY")) return "yellow";
  return "aqua";
}
function statusAccent(s: string): Accent {
  const k = String(s || "").toUpperCase();
  if (k.includes("PRODU")) return "red";
  if (k.includes("FATIAS")) return "aqua";
  if (k.includes("ENTREG")) return "green";
  if (k.includes("CANCEL")) return "red";
  return "aqua";
}
function paymentAccent(p: string): Accent {
  const k = String(p || "").toUpperCase();
  if (k.includes("DIN")) return "green";
  if (k.includes("PIX")) return "aqua";
  if (k.includes("CART")) return "yellow";
  if (k.includes("ONLINE")) return "purple";
  return "aqua";
}

function FieldRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 10,
        padding: "10px 12px",
        borderRadius: 14,
        border: "1px solid rgba(79,220,255,0.10)",
        background: "rgba(2,11,24,0.36)",
        boxShadow: "0 0 0 1px rgba(255,255,255,0.02) inset",
      }}
    >
      <div style={{ fontSize: 11, fontWeight: 1000, opacity: 0.7 }}>{label.toUpperCase()}</div>
      <div
        style={{
          fontSize: 12,
          fontWeight: 950,
          opacity: 0.92,
          textAlign: "right",
          wordBreak: "break-word",
        }}
      >
        {value}
      </div>
    </div>
  );
}

function PedidoCard({ p, open, onToggle }: { p: Pedido; open: boolean; onToggle: () => void }) {
  const acc = platformAccent(p.plataforma);
  const a = accentRGB(acc);

  return (
    <div
      style={{
        borderRadius: 18,
        padding: 14,
        background: CARD_INNER,
        border: `1px solid ${a.line}`,
        boxShadow: `0 0 0 1px rgba(255,255,255,0.02) inset, 0 0 26px ${a.glow}`,
      }}
    >
      <button
        onClick={onToggle}
        style={{
          width: "100%",
          textAlign: "left",
          background: "transparent",
          border: "none",
          padding: 0,
          color: "inherit",
          cursor: "pointer",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr auto auto",
            gap: 10,
            alignItems: "center",
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 1000, letterSpacing: 0.2 }}>{p.cliente}</div>

          <div style={{ fontSize: 13, fontWeight: 1000, opacity: 0.95, whiteSpace: "nowrap" }}>
            {fmtBRL(p.valor)}
          </div>

          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 12,
              border: `1px solid ${a.line}`,
              background: "rgba(255,255,255,0.06)",
              display: "grid",
              placeItems: "center",
              boxShadow: `0 0 18px ${a.glow}`,
              transform: open ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 220ms ease",
              fontWeight: 1000,
              opacity: 0.9,
            }}
            aria-label="Expandir"
          >
            ▾
          </div>
        </div>

        <div
          style={{
            marginTop: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
            opacity: 0.85,
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 1000, letterSpacing: 0.2 }}>
            {p.plataforma} - {p.atendimento}
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <div style={{ fontSize: 11, fontWeight: 950, opacity: 0.75 }}>{p.hora}</div>
            <Badge text={p.pagamento} accent={paymentAccent(p.pagamento)} />
          </div>
        </div>
      </button>

      {open ? (
        <div
          style={{
            marginTop: 12,
            paddingTop: 12,
            borderTop: "1px solid rgba(255,255,255,0.08)",
            display: "grid",
            gap: 10,
          }}
        >
          <FieldRow label="Forma de pagamento" value={p.pagamento} />
          <FieldRow label="Bairros" value={p.bairro || "—"} />
          <FieldRow label="Taxa de entrega" value={p.taxaEntrega != null ? fmtBRL(p.taxaEntrega) : "—"} />
          <FieldRow label="Responsável" value={p.responsavel || "—"} />
          <FieldRow label="Status" value={<Badge text={p.status} accent={statusAccent(p.status)} />} />
        </div>
      ) : null}
    </div>
  );
}

function toHHMM(v: any) {
  const s = String(v ?? "");
  const m = s.match(/T(\d{2}):(\d{2})/);
  if (m) return `${m[1]}:${m[2]}`;
  const m2 = s.match(/^(\d{2}):(\d{2})/);
  if (m2) return `${m2[1]}:${m2[2]}`;
  return "—";
}

function normalizePedido(row: any): Pedido {
  // ✅ prioridade TOTAL pros teus campos reais
  const cliente = String(row?.customer_name ?? row?.cliente ?? row?.customer ?? row?.name ?? "—").trim() || "—";
  const valor = brMoneyToNumber(row?.r_final ?? row?.valor ?? row?.total ?? row?.amount ?? 0);

  const plataforma = String(row?.plataforma ?? row?.platform ?? row?.source ?? "BALCÃO").toUpperCase();
  const atendimento = String(row?.atendimento ?? row?.service ?? "ENTREGA").toUpperCase();
  const pagamento = String(row?.pagamento ?? row?.pagamentoLabel ?? row?.pay_method ?? "—").toUpperCase();

  const hora = toHHMM(row?.hora ?? row?.time ?? row?.created_at ?? row?.createdAt ?? "");
  const status = String(row?.status ?? row?.state ?? "ABERTO").toUpperCase();

  const bairro = row?.bairro ?? row?.neighborhood ?? undefined;
  const taxaEntrega = row?.taxaEntrega ?? row?.delivery_fee ?? row?.taxa_entrega ?? undefined;
  const responsavel = row?.responsavel ?? row?.owner ?? row?.handler ?? undefined;

  const id = String(row?.id ?? row?.uuid ?? `${cliente}-${hora}-${Math.random()}`);

  return {
    id,
    cliente,
    valor,
    plataforma,
    atendimento,
    pagamento,
    hora,
    status,
    bairro: bairro != null ? String(bairro) : undefined,
    taxaEntrega: taxaEntrega != null ? brMoneyToNumber(taxaEntrega) : undefined,
    responsavel: responsavel != null ? String(responsavel) : undefined,
  };
}

async function fetchOrders(opISO: string): Promise<Pedido[]> {
  const r1 = await fetch(`/api/orders?op_date=${encodeURIComponent(opISO)}`, { cache: "no-store" });
  if (r1.ok) {
    const j = await r1.json().catch(() => null);
    const rows = (j?.rows || j?.data || j?.orders || j?.items || []) as any[];
    if (Array.isArray(rows)) return rows.map(normalizePedido);
  }

  const r2 = await fetch(`/api/orders?date=${encodeURIComponent(opISO)}`, { cache: "no-store" });
  if (r2.ok) {
    const j = await r2.json().catch(() => null);
    const rows = (j?.rows || j?.data || j?.orders || j?.items || []) as any[];
    if (Array.isArray(rows)) return rows.map(normalizePedido);
  }

  return [];
}

export default function MobilePedidosPage() {
  const [openId, setOpenId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);

  const opISO = useMemo(() => opDateISO(new Date(), 6), []);

  async function refresh() {
    try {
      setErr(null);
      const rows = await fetchOrders(opISO);
      setPedidos(rows);
    } catch (e: any) {
      setErr(e?.message ? String(e.message) : "Falha ao carregar pedidos");
    }
  }

  useEffect(() => {
    let alive = true;

    (async () => {
      setLoading(true);
      await refresh();
      if (!alive) return;
      setLoading(false);
    })();

    // ✅ "tempo real" via polling
    const iv = window.setInterval(() => {
      if (document.visibilityState === "visible") refresh();
    }, 6000);

    const onVis = () => {
      if (document.visibilityState === "visible") refresh();
    };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      alive = false;
      window.clearInterval(iv);
      document.removeEventListener("visibilitychange", onVis);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opISO]);

  const totalPedidos = pedidos.length;
  const totalValor = useMemo(() => pedidos.reduce((acc, p) => acc + (Number(p.valor) || 0), 0), [pedidos]);

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <PageTitle>Pedidos</PageTitle>

      <Shell>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr auto",
            gap: 12,
            alignItems: "baseline",
          }}
        >
          <div style={{ fontSize: 12, opacity: 0.82, fontWeight: 950 }}>
            {loading ? "Carregando..." : `Total de pedidos: ${totalPedidos}`}
          </div>
          <div style={{ fontSize: 13, fontWeight: 1000, opacity: 0.95, whiteSpace: "nowrap" }}>
            {loading ? "—" : fmtBRL(totalValor)}
          </div>
        </div>

        {err ? (
          <div
            style={{
              marginTop: 12,
              padding: "10px 12px",
              borderRadius: 14,
              border: "1px solid rgba(255,100,120,0.35)",
              background: "rgba(255,100,120,0.08)",
              fontSize: 12,
              fontWeight: 900,
              opacity: 0.95,
            }}
          >
            {err}
          </div>
        ) : null}
      </Shell>

      <div style={{ display: "grid", gap: 10 }}>
        {!loading && pedidos.length === 0 ? (
          <Shell style={{ opacity: 0.9 }}>
            <div style={{ fontSize: 13, fontWeight: 1000 }}>Nenhum pedido no dia operacional</div>
            <div style={{ marginTop: 6, fontSize: 12, opacity: 0.7 }}>Data operacional: {opISO}</div>
          </Shell>
        ) : (
          pedidos.map((p) => (
            <PedidoCard
              key={p.id}
              p={p}
              open={openId === p.id}
              onToggle={() => setOpenId((cur) => (cur === p.id ? null : p.id))}
            />
          ))
        )}
      </div>
    </div>
  );
}
