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
      return {
        line: "rgba(80,255,160,0.35)",
        glow: "rgba(80,255,160,0.14)",
        dot: "rgba(80,255,160,0.95)",
      };
    case "yellow":
      return {
        line: "rgba(255,200,80,0.35)",
        glow: "rgba(255,200,80,0.14)",
        dot: "rgba(255,200,80,0.95)",
      };
    case "red":
      return {
        line: "rgba(255,100,120,0.35)",
        glow: "rgba(255,100,120,0.14)",
        dot: "rgba(255,100,120,0.95)",
      };
    case "purple":
      return {
        line: "rgba(160,120,255,0.35)",
        glow: "rgba(160,120,255,0.14)",
        dot: "rgba(160,120,255,0.95)",
      };
    default:
      return {
        line: "rgba(79,220,255,0.35)",
        glow: "rgba(79,220,255,0.14)",
        dot: "rgba(79,220,255,0.95)",
      };
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
function isoToBR(iso: string) {
  const m = String(iso || "").match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return iso;
  return `${m[3]}/${m[2]}/${m[1]}`;
}

/** Dia operacional 06:00 */
function opDateISO(now = new Date(), cutoffHour = 6) {
  const d = new Date(now);
  if (d.getHours() < cutoffHour) d.setDate(d.getDate() - 1);
  return toISODate(d);
}
function addDaysISO(iso: string, deltaDays: number) {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + deltaDays);
  return toISODate(dt);
}
function clampISO(iso: string) {
  const m = String(iso || "").match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[1]}-${m[2]}-${m[3]}` : "";
}

function Shell({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        borderRadius: 22,
        padding: 14,
        background: CARD_BG,
        border: `1px solid ${AQUA_LINE}`,
        boxShadow:
          "0 0 0 1px rgba(79,220,255,0.06) inset, 0 26px 70px rgba(0,0,0,0.42)",
        overflow: "hidden",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function PageTitleRow({
  children,
  right,
}: {
  children: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
      <div style={{ fontSize: 18, fontWeight: 1000, letterSpacing: 0.2 }}>
        {children}
      </div>
      <div style={{ marginLeft: "auto", minWidth: 0 }}>{right}</div>
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
        border: "none",
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

function statusAccentBadge(s: string): Accent {
  const k = String(s || "").toUpperCase();
  if (k.includes("PRODU")) return "red";
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
function orderBorderAccentOnly2(status: string): "red" | "green" {
  const k = String(status || "").toUpperCase();
  if (k.includes("ENTREG")) return "green";
  return "red";
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
      <div style={{ fontSize: 11, fontWeight: 1000, opacity: 0.7 }}>
        {label.toUpperCase()}
      </div>
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

function PedidoCard({
  p,
  open,
  onToggle,
}: {
  p: Pedido;
  open: boolean;
  onToggle: () => void;
}) {
  const borderAcc = orderBorderAccentOnly2(p.status);
  const a = accentRGB(borderAcc);

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
            minWidth: 0,
          }}
        >
          <div
            style={{
              fontSize: 13,
              fontWeight: 1000,
              letterSpacing: 0.2,
              minWidth: 0,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {p.cliente}
          </div>

          <div
            style={{
              fontSize: 13,
              fontWeight: 1000,
              opacity: 0.95,
              whiteSpace: "nowrap",
            }}
          >
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
            minWidth: 0,
          }}
        >
          <div
            style={{
              fontSize: 12,
              fontWeight: 1000,
              letterSpacing: 0.2,
              minWidth: 0,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {p.plataforma} - {p.atendimento}
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
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
          <FieldRow
            label="Taxa de entrega"
            value={p.taxaEntrega != null ? fmtBRL(p.taxaEntrega) : "—"}
          />
          <FieldRow label="Responsável" value={p.responsavel || "—"} />
          <FieldRow
            label="Status"
            value={<Badge text={p.status} accent={statusAccentBadge(p.status)} />}
          />
        </div>
      ) : null}
    </div>
  );
}

function toHHMM(v: any) {
  const s = String(v ?? "").trim();
  if (!s) return "—";

  // Se já veio "HH:MM"
  const m2 = s.match(/^(\d{2}):(\d{2})/);
  if (m2) return `${m2[1]}:${m2[2]}`;

  // Tenta interpretar como ISO/Date e formatar no fuso SP
  const d = new Date(s);
  if (!Number.isNaN(d.getTime())) {
    try {
      return new Intl.DateTimeFormat("pt-BR", {
        timeZone: "America/Sao_Paulo",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }).format(d);
    } catch {
      // fallback: usa horário local do device
      return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
    }
  }

  // fallback final (caso venha string fora do padrão)
  const m = s.match(/T(\d{2}):(\d{2})/);
  if (m) return `${m[1]}:${m[2]}`;

  return "—";
}


function normalizePedido(row: any): Pedido {
  const cliente =
    String(
      row?.customer_name ?? row?.cliente ?? row?.customer ?? row?.name ?? "—"
    ).trim() || "—";
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

async function fetchOrdersSingleDay(opISO: string): Promise<Pedido[]> {
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

async function fetchOrdersRange(fromISO: string, toISO: string): Promise<Pedido[]> {
  const from = clampISO(fromISO);
  const to = clampISO(toISO);
  if (!from || !to) return [];

  const candidates = [
    `/api/orders?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
    `/api/orders?start=${encodeURIComponent(from)}&end=${encodeURIComponent(to)}`,
    `/api/orders?date_from=${encodeURIComponent(from)}&date_to=${encodeURIComponent(to)}`,
  ];

  for (const url of candidates) {
    const r = await fetch(url, { cache: "no-store" }).catch(() => null);
    if (!r || !r.ok) continue;
    const j = await r.json().catch(() => null);
    const rows = (j?.rows || j?.data || j?.orders || j?.items || []) as any[];
    if (Array.isArray(rows)) return rows.map(normalizePedido);
  }

  const out: Pedido[] = [];
  let cur = from;
  while (cur <= to) {
    const dayRows = await fetchOrdersSingleDay(cur);
    out.push(...dayRows);
    cur = addDaysISO(cur, 1);
    if (out.length > 20000) break;
  }
  return out;
}

/* =========================
   Período (mobile)
========================= */

type PeriodKey =
  | "hoje"
  | "ontem"
  | "7d"
  | "30d"
  | "mes_anterior"
  | "este_mes"
  | "uma_data"
  | "um_periodo";

const PERIOD_LABEL: Record<PeriodKey, string> = {
  hoje: "hoje",
  ontem: "ontem",
  "7d": "últimos 7 dias",
  "30d": "últimos 30 dias",
  mes_anterior: "mês anterior",
  este_mes: "esse mês",
  uma_data: "uma data",
  um_periodo: "um período",
};

function PeriodSelect({
  value,
  onChange,
}: {
  value: PeriodKey;
  onChange: (v: PeriodKey) => void;
}) {
  return (
    <div style={{ display: "grid", gap: 8, minWidth: 160 }}>
      <div style={{ fontSize: 11, fontWeight: 950, opacity: 0.75, textAlign: "right" }} />
      <div style={{ position: "relative" }}>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value as PeriodKey)}
          style={{
            width: "100%",
            height: 40,
            borderRadius: 14,
            border: "1px solid rgba(79,220,255,0.20)",
            background: "rgba(2,11,24,0.55)",
            color: "rgba(255,255,255,0.92)",
            fontWeight: 950,
            outline: "none",
            padding: "0 12px",
            appearance: "none",
          }}
        >
          {(
            ["hoje", "ontem", "7d", "30d", "mes_anterior", "este_mes", "uma_data", "um_periodo"] as PeriodKey[]
          ).map((k) => (
            <option key={k} value={k}>
              {PERIOD_LABEL[k]}
            </option>
          ))}
        </select>

        <div
          style={{
            position: "absolute",
            right: 12,
            top: 0,
            height: 40,
            display: "grid",
            placeItems: "center",
            pointerEvents: "none",
            opacity: 0.85,
            fontWeight: 1000,
          }}
        >
          ▾
        </div>
      </div>
    </div>
  );
}

/* =========================
   ✅ DateInput (mobile)
   - retângulo proporcional (sem “vazar”)
   - remove ícone do calendário (CSS global abaixo)
========================= */

const DATE_INPUT_STYLE: React.CSSProperties = {
  width: "100%",
  minWidth: 0,
  height: 42,
  borderRadius: 14,
  border: "1px solid rgba(79,220,255,0.20)",
  background: "rgba(2,11,24,0.55)",
  color: "rgba(255,255,255,0.92)",
  fontWeight: 1000,
  fontSize: 13,
  letterSpacing: 0.2,
  outline: "none",
  padding: "0 12px", // ✅ sem espaço extra (ícone removido)
  boxSizing: "border-box", // ✅ não estoura no mobile
  appearance: "none",
  WebkitAppearance: "none",
};

function DateInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <input
      className="fintex-date"
      type="date"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={DATE_INPUT_STYLE}
    />
  );
}

export default function MobilePedidosPage() {
  const [openId, setOpenId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);

  const opToday = useMemo(() => opDateISO(new Date(), 6), []);

  const [period, setPeriod] = useState<PeriodKey>("hoje");
  const [singleDate, setSingleDate] = useState<string>(opToday);
  const [rangeFrom, setRangeFrom] = useState<string>(addDaysISO(opToday, -6));
  const [rangeTo, setRangeTo] = useState<string>(opToday);

  const { fromISO, toISO } = useMemo(() => {
    const end = opToday;

    if (period === "hoje") return { fromISO: end, toISO: end };
    if (period === "ontem") {
      const y = addDaysISO(end, -1);
      return { fromISO: y, toISO: y };
    }
    if (period === "7d") return { fromISO: addDaysISO(end, -6), toISO: end };
    if (period === "30d") return { fromISO: addDaysISO(end, -29), toISO: end };

    if (period === "este_mes") {
      const [yy, mm] = end.split("-").map(Number);
      const first = toISODate(new Date(yy, mm - 1, 1));
      return { fromISO: first, toISO: end };
    }

    if (period === "mes_anterior") {
      const [yy, mm] = end.split("-").map(Number);
      const firstPrev = toISODate(new Date(yy, mm - 2, 1));
      const lastPrev = toISODate(new Date(yy, mm - 1, 0));
      return { fromISO: firstPrev, toISO: lastPrev };
    }

    if (period === "uma_data") {
      const d = clampISO(singleDate) || end;
      return { fromISO: d, toISO: d };
    }

    const f = clampISO(rangeFrom) || addDaysISO(end, -6);
    const t = clampISO(rangeTo) || end;
    return f <= t ? { fromISO: f, toISO: t } : { fromISO: t, toISO: f };
  }, [period, opToday, singleDate, rangeFrom, rangeTo]);

  async function refresh() {
    try {
      setErr(null);

      if (fromISO === toISO) {
        const rows = await fetchOrdersSingleDay(fromISO);
        setPedidos(rows);
        return;
      }

      const rows = await fetchOrdersRange(fromISO, toISO);
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
  }, [fromISO, toISO]);

  const totalPedidos = pedidos.length;
  const totalValor = useMemo(
    () => pedidos.reduce((acc, p) => acc + (Number(p.valor) || 0), 0),
    [pedidos]
  );

  return (
    <>
      <div style={{ display: "grid", gap: 12 }}>
        <PageTitleRow
          right={
            <PeriodSelect
              value={period}
              onChange={(v) => {
                setPeriod(v);
                setOpenId(null);
                setErr(null);
                if (v === "uma_data") setSingleDate(fromISO);
                if (v === "um_periodo") {
                  setRangeFrom(fromISO);
                  setRangeTo(toISO);
                }
              }}
            />
          }
        >
          Pedidos
        </PageTitleRow>

        {period === "uma_data" ? (
          <Shell>
            <div style={{ display: "grid", gap: 8 }}>
              <div style={{ fontSize: 12, fontWeight: 950, opacity: 0.82 }}>
                Selecionar data
              </div>

              <DateInput value={singleDate} onChange={setSingleDate} />
            </div>
          </Shell>
        ) : null}

        {period === "um_periodo" ? (
          <Shell>
            <div style={{ display: "grid", gap: 10 }}>
              <div style={{ fontSize: 12, fontWeight: 950, opacity: 0.82 }}>
                Selecionar período
              </div>

              {/* ✅ no mobile, garante que não estoura e os inputs ficam proporcionais */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 10,
                  minWidth: 0,
                }}
              >
                <div style={{ display: "grid", gap: 6, minWidth: 0 }}>
                  <div style={{ fontSize: 11, fontWeight: 950, opacity: 0.75 }}>
                    De:
                  </div>
                  <DateInput value={rangeFrom} onChange={setRangeFrom} />
                </div>

                <div style={{ display: "grid", gap: 6, minWidth: 0 }}>
                  <div style={{ fontSize: 11, fontWeight: 950, opacity: 0.75 }}>
                    Até:
                  </div>
                  <DateInput value={rangeTo} onChange={setRangeTo} />
                </div>
              </div>
            </div>
          </Shell>
        ) : null}

        <Shell>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr auto",
              gap: 12,
              alignItems: "baseline",
              minWidth: 0,
            }}
          >
            <div
              style={{
                fontSize: 12,
                opacity: 0.82,
                fontWeight: 950,
                minWidth: 0,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {loading ? "Carregando..." : `Total de pedidos: ${totalPedidos}`}
            </div>

            <div
              style={{
                fontSize: 13,
                fontWeight: 1000,
                opacity: 0.95,
                whiteSpace: "nowrap",
                maxWidth: 160,
                overflow: "hidden",
                textOverflow: "ellipsis",
                textAlign: "right",
              }}
            >
              {loading ? "—" : fmtBRL(totalValor)}
            </div>
          </div>

          <div style={{ marginTop: 8, fontSize: 11, opacity: 0.7, fontWeight: 950 }}>
            {isoToBR(fromISO)} - {isoToBR(toISO)}
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
          {pedidos.map((p) => (
            <PedidoCard
              key={p.id}
              p={p}
              open={openId === p.id}
              onToggle={() => setOpenId((cur) => (cur === p.id ? null : p.id))}
            />
          ))}
        </div>
      </div>

      {/* ✅ REMOVE O ÍCONE DO CALENDÁRIO (sem quebrar o input no mobile) */}
      <style jsx global>{`
        /* Chrome/Edge/Safari (webkit) */
        input.fintex-date::-webkit-calendar-picker-indicator {
          opacity: 0;
          width: 0;
          height: 0;
          margin: 0;
          padding: 0;
          pointer-events: none; /* some e não ocupa espaço */
        }

        /* iOS às vezes reserva padding interno: força o texto a caber */
        input.fintex-date {
          padding-right: 12px !important;
        }
      `}</style>
    </>
  );
}
