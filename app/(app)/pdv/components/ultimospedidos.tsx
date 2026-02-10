"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

type MoneyLike = number | string | null | undefined;

export type UltimoPedidoUI = {
  id?: string | number;
  order_date?: string;
  created_at?: string;

  customer_name?: string;
  platform?: string;
  service_type?: string;

  r_inicial?: MoneyLike;
  troco?: MoneyLike;
  r_final?: MoneyLike;

  payment_method?: string;

  bairros?: string;
  taxa_entrega?: MoneyLike;

  responsavel?: string;
  status?: string;

  // compat com formato do PedidosClient
  cliente_nome?: string | null;
  plataforma?: string | null;
  atendimento?: string | null;
  valor_pago?: MoneyLike;
  valor_final?: MoneyLike;
  pagamento?: string | null;
  bairro?: string | null;
};

type Row = Record<string, any>;

const COLS = [
  { key: "DATA", label: "DATA", w: 90, type: "text" },
  { key: "HORA", label: "HORA", w: 90, type: "text" }, // ✅ antes era MÊS
  { key: "CLIENTE", label: "CLIENTE", w: 260, type: "text" },
  { key: "PLATAFORMA", label: "PLATAFORMA", w: 160, type: "text" },
  { key: "ATENDIMENTO", label: "ATENDIMENTO", w: 160, type: "text" },
  { key: "R$ INICIAL", label: "R$ INICIAL", w: 120, type: "money" },
  { key: "TROCO", label: "TROCO", w: 120, type: "money" },
  { key: "R$ FINAL", label: "R$ FINAL", w: 120, type: "money" },
  { key: "FORMA DE PAGAMENTO", label: "FORMA DE PAGAMENTO", w: 220, type: "text" },
  { key: "BAIRROS", label: "BAIRROS", w: 170, type: "text" },
  { key: "TAXA DE ENTREGA", label: "TAXA DE ENTREGA", w: 150, type: "money" },
  { key: "RESPONSÁVEL", label: "RESPONSÁVEL", w: 170, type: "text" },
  { key: "STATUS", label: "STATUS", w: 170, type: "text" },
] as const;

function normKey(s: string) {
  return (s || "")
    .toString()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s$]/g, "")
    .replace(/\s+/g, " ")
    .toUpperCase();
}

function parseBRLToNumber(v: any): number | null {
  if (v === null || v === undefined) return null;
  if (typeof v === "number") return Number.isFinite(v) ? v : null;

  const original = String(v).trim();
  if (!original || original === "-" || original.toUpperCase() === "R$" || original.includes("R$ -")) return null;

  let s = original.replace(/^R\$/i, "").replace(/\s/g, "");
  if (s.includes(",")) s = s.replace(/\./g, "").replace(",", ".");
  else s = s.replace(/[^0-9.\-]/g, "");

  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function brl(v: any) {
  const n = parseBRLToNumber(v);
  if (n === null) return "R$  -";
  return `R$ ${n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function dateBRFromISO(iso?: string) {
  if (!iso) return "-";
  const d = new Date(String(iso));
  if (Number.isNaN(d.getTime())) return "-";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}`;
}


// ✅ NOVO: HH:mm a partir do ISO (created_at do backend)
function hourFromISO(iso?: string) {
  if (!iso) return "-";
  const d = new Date(String(iso));
  if (Number.isNaN(d.getTime())) return "-";
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

function paymentLabel(v: any) {
  const s = (v ?? "").toString().trim().toUpperCase();
  if (s === "CRÉDITO" || s === "CREDITO" || s === "CREDIT") return "Cartão de Crédito";
  if (s === "DÉBITO" || s === "DEBITO" || s === "DEBIT") return "Cartão de Débito";
  if (s === "ONLINE") return "Pagamento Online";
  if (s === "PIX") return "PIX";
  if (s === "DINHEIRO") return "Dinheiro";
  return (v ?? "-").toString();
}

const AQUA_SOFT = "rgba(79,220,255,0.22)";

const headerStyle = (hover: boolean, width: number): React.CSSProperties => {
  const borderColor = hover ? "rgba(75,212,246,0.85)" : "rgba(75,212,246,0.55)";
  return {
    width,
    height: 46,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    overflow: "hidden",
    position: "sticky",
    top: 0,
    zIndex: 5,
    border: `1px solid ${borderColor}`,
    transition: "border 160ms ease, box-shadow 160ms ease",
    userSelect: "none",
    background: `linear-gradient(180deg, #11586994 0%, #1b5d6d94 40%, #3590a794 100%)`,
    boxShadow: hover ? "0 0 22px rgba(75,212,246,0.55)" : `0 0 18px ${AQUA_SOFT}`,
  };
};

type Props = {
  emptyText?: string;
  filterOperationalDay?: boolean;
  operationalISO?: string; // YYYY-MM-DD
};

export default function UltimosPedidos({
  emptyText = "Nada para mostrar.",
  filterOperationalDay = true,
  operationalISO,
}: Props) {
  const [hoverHeader, setHoverHeader] = useState(false);
  const [orders, setOrders] = useState<UltimoPedidoUI[]>([]);
  const busyRef = useRef(false);

  const minWidth = useMemo(() => COLS.reduce((a, c) => a + c.w, 0), []);

  function datePrefix10(iso?: string) {
    const s = String(iso ?? "");
    return s.length >= 10 ? s.slice(0, 10) : "";
  }

  async function load() {
    if (busyRef.current) return;
    busyRef.current = true;

    try {
      const r = await fetch("/api/orders", { cache: "no-store" });
      const j = await r.json().catch(() => null);

      const rows = (r.ok && j?.ok ? (j.rows ?? []) : []) as UltimoPedidoUI[];
      setOrders(rows.slice(0, 10));
    } catch {
      setOrders([]);
    } finally {
      busyRef.current = false;
    }
  }

  useEffect(() => {
    load(); // primeira

    const t = setInterval(() => {
      load();
    }, 2000);

    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredSourceOrders = useMemo(() => {
    const sliced = (orders || []).slice(0, 10);

    if (!filterOperationalDay) return sliced;
    if (!operationalISO) return sliced;

    return sliced.filter((o) => {
      const iso = o.order_date || o.created_at || "";
      return datePrefix10(iso) === operationalISO;
    });
  }, [orders, operationalISO, filterOperationalDay]);

  const rows: Row[] = useMemo(() => {
    return (filteredSourceOrders || []).map((o, i) => {
      const out: Row = { __ROWNUMBER: i + 2, __ID: o?.id ?? "" };

      const baseISO = o.order_date || o.created_at || "";

      out[normKey("DATA")] = dateBRFromISO(baseISO) || "-";

      out[normKey("HORA")] = hourFromISO(baseISO) || "-"; // ✅ antes era MÊS

      const cliente = o.customer_name ?? o.cliente_nome ?? "-";
      const plataforma = (o.platform ?? o.plataforma ?? "-").toString().toUpperCase();
      const atendimento = (o.service_type ?? o.atendimento ?? "-").toString().toUpperCase();

      const rInicial = (o as any)?.r_inicial ?? (o as any)?.valor_pago ?? 0;
      const rFinal = (o as any)?.r_final ?? (o as any)?.valor_final ?? 0;

      const pay = o.payment_method ?? (o as any)?.pagamento ?? "-";
      const bairro = o.bairros ?? (o as any)?.bairro ?? "-";
      const taxa = (o as any)?.taxa_entrega ?? 0;

      out[normKey("CLIENTE")] = cliente;
      out[normKey("PLATAFORMA")] = plataforma;
      out[normKey("ATENDIMENTO")] = atendimento;

      out[normKey("R$ INICIAL")] = rInicial;
      out[normKey("TROCO")] = (o as any)?.troco ?? 0;
      out[normKey("R$ FINAL")] = rFinal;

      out[normKey("FORMA DE PAGAMENTO")] = paymentLabel(pay);

      out[normKey("BAIRROS")] = (bairro ?? "-").toString().trim() || "-";
      out[normKey("TAXA DE ENTREGA")] = taxa;

      out[normKey("RESPONSÁVEL")] = o.responsavel ?? "Operador de Caixa";
      out[normKey("STATUS")] = o.status ?? "EM PRODUÇÃO";

      for (const c of COLS) {
        const k = normKey(c.key);
        if (!(k in out)) out[k] = c.type === "money" ? null : "-";
      }

      return out;
    });
  }, [filteredSourceOrders]);

  return (
    <div
      style={{
        maxWidth: 1350,
        width: "100%",
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        overflow: "hidden",
        border: "1px solid rgba(79,220,255,0.30)",
        boxShadow: `0 18px 60px rgba(0,0,0,0.55), 0 0 18px ${AQUA_SOFT}`,
        background: `
          radial-gradient(1200px 320px at 15% -10%, rgba(79,220,255,0.10) 0%, rgba(79,220,255,0.04) 45%, rgba(79,220,255,0.02) 70%),
          linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.03) 22%, rgba(6,16,37,0.94) 100%)
        `,
      }}
    >
      <div style={{ maxHeight: 500, overflowY: "auto", overflowX: "auto" }}>
        <div style={{ width: minWidth }}>
          <div
            onMouseEnter={() => setHoverHeader(true)}
            onMouseLeave={() => setHoverHeader(false)}
            style={headerStyle(hoverHeader, minWidth)}
          >
            <div
              style={{
                pointerEvents: "none",
                position: "absolute",
                inset: 0,
                background: `
                  linear-gradient(
                    180deg,
                    transparent 0%,
                    rgba(75,212,246,0.28) 48%,
                    rgba(75,212,246,0.28) 52%,
                    transparent 72%
                  )
                `,
                opacity: hoverHeader ? 0.9 : 0.6,
                transition: "opacity 180ms ease",
              }}
            />
            <div
              style={{
                position: "relative",
                zIndex: 2,
                height: "100%",
                display: "grid",
                gridTemplateColumns: COLS.map((c) => `${c.w}px`).join(" "),
                alignItems: "center",
              }}
            >
              {COLS.map((c) => (
                <div
                  key={c.key}
                  style={{
                    textAlign: "center",
                    color: "#eaf0ff",
                    fontWeight: 900,
                    fontSize: 12,
                    letterSpacing: 0.35,
                    textTransform: "uppercase",
                    whiteSpace: "nowrap",
                  }}
                >
                  {c.label}
                </div>
              ))}
            </div>
          </div>

          {rows.map((r, idx) => (
            <div
              key={String(r.__ID || r.__ROWNUMBER || idx)}
              style={{
                display: "grid",
                gridTemplateColumns: COLS.map((c) => `${c.w}px`).join(" "),
                background: "rgba(1,27,60,0.42)",
                borderBottom: "1px solid rgba(255,255,255,0.08)",
                color: "#e9f1ff",
              }}
            >
              {COLS.map((c) => {
                const raw = r?.[normKey(c.key)];
                const txt = c.type === "money" ? brl(raw) : (raw ?? "").toString().trim() || "-";
                return (
                  <div
                    key={c.key}
                    title={txt}
                    style={{
                      padding: "12px 8px",
                      fontWeight: 800,
                      fontSize: 12,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      textAlign: "center",
                      boxSizing: "border-box",
                    }}
                  >
                    {txt}
                  </div>
                );
              })}
            </div>
          ))}

          {!rows.length && (
            <div style={{ padding: 14, fontWeight: 900, color: "#eaf0ff", opacity: 0.75 }}>{emptyText}</div>
          )}
        </div>
      </div>
    </div>
  );
}
