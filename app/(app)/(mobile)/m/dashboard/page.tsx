// app/(mobile)/m/dashboard/page.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";

/* =========================================================
   FINtex Mobile - Dashboard
   ✅ UI FIXA (sempre mostra TODAS as opções)
   ✅ Só muda valores (se não tem dado, fica 0)
   ✅ Backend atualizado:
      - /api/dashboard?period=hoje|ontem|7d|30d|este_mes|mes_anterior
      - /api/dashboard?from=YYYY-MM-DD&to=YYYY-MM-DD  (inclusive)
   ✅ Seletor novo (mês anterior / esse mês / uma data / um período)
   ✅ Visual igual ao Pedidos:
      - dropdown fica no header
      - cards (uma_data / um_periodo) ficam FORA do header
========================================================= */

const BG_PAGE =
  "radial-gradient(1200px 700px at 20% 0%, rgba(79,220,255,0.12), transparent 55%), radial-gradient(900px 520px at 80% 10%, rgba(79,220,255,0.10), transparent 60%), linear-gradient(180deg, rgba(4,19,40,1), rgba(2,11,24,1) 58%, rgba(2,9,20,1))";

const CARD_BG =
  "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))";
const CARD_INNER = "rgba(2,11,24,0.42)";
const AQUA_LINE = "rgba(79,220,255,0.18)";

type Accent = "aqua" | "green" | "yellow" | "red" | "purple";

/* ========================= Utils ========================= */

function fmtBRL(v: number) {
  const n = Number(v) || 0;
  try {
    return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  } catch {
    return `R$ ${n.toFixed(2)}`;
  }
}
function pct(v: number) {
  const n = Number(v) || 0;
  const r = Math.round(n * 10) / 10;
  return `${r.toFixed(1)}%`;
}

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
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function TitleRow({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: 12,
      }}
    >
      <div>
        <div style={{ fontSize: 18, fontWeight: 1000, letterSpacing: 0.2 }}>
          {title}
        </div>
        {subtitle ? (
          <div
            style={{
              marginTop: 6,
              fontSize: 12,
              opacity: 0.75,
              fontWeight: 900,
            }}
          >
            {subtitle}
          </div>
        ) : null}
      </div>
      {right ? <div style={{ flex: "0 0 auto" }}>{right}</div> : null}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 12, fontWeight: 1000, opacity: 0.9 }}>
      {children}
    </div>
  );
}

/* ========================= Data helpers (igual Pedidos) ========================= */

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

function isoToBR(iso: string) {
  const m = String(iso || "").match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return iso;
  return `${m[3]}/${m[2]}/${m[1]}`;
}

/* =========================
   Seletor novo (Período mobile)
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
      <div
        style={{
          fontSize: 11,
          fontWeight: 950,
          opacity: 0.75,
          textAlign: "right",
        }}
      />
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
            [
              "hoje",
              "ontem",
              "7d",
              "30d",
              "mes_anterior",
              "este_mes",
              "uma_data",
              "um_periodo",
            ] as PeriodKey[]
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
  padding: "0 12px",
  boxSizing: "border-box",
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

/* ========= Cards (borda destacada por cor) ========= */

function GlowCard({
  accent = "aqua",
  children,
  style,
}: {
  accent?: Accent;
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  const a = accentRGB(accent);
  return (
    <div
      style={{
        borderRadius: 18,
        padding: 14,
        background: CARD_INNER,
        border: `1px solid ${a.line}`,
        boxShadow: `0 0 0 1px rgba(255,255,255,0.02) inset, 0 0 26px ${a.glow}`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function TopCard({
  title,
  value,
  sub1,
  accent = "aqua",
}: {
  title: string;
  value: string;
  sub1?: string;
  accent?: Accent;
}) {
  return (
    <GlowCard accent={accent} style={{ minHeight: 84 }}>
      <div style={{ fontSize: 11, fontWeight: 1000, opacity: 0.8 }}>
        {title.toUpperCase()}
      </div>
      <div style={{ marginTop: 10, fontSize: 18, fontWeight: 1000 }}>
        {value}
      </div>
      {sub1 ? (
        <div
          style={{
            marginTop: 8,
            fontSize: 11,
            opacity: 0.78,
            fontWeight: 900,
          }}
        >
          {sub1}
        </div>
      ) : null}
    </GlowCard>
  );
}

function MiniMetricCard({
  title,
  value,
  sub,
  accent = "aqua",
  badge,
}: {
  title: string;
  value: string;
  sub: string;
  accent?: Accent;
  badge?: string;
}) {
  const a = accentRGB(accent);
  return (
    <GlowCard accent={accent} style={{ minHeight: 92, position: "relative" }}>
      <div
        style={{
          position: "absolute",
          top: 10,
          right: 12,
          fontSize: 12,
          fontWeight: 1000,
          opacity: 0.9,
          color: a.dot,
        }}
      >
        {badge ?? "0"}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: 999,
            background: a.dot,
            boxShadow: `0 0 12px ${a.dot}`,
            display: "inline-block",
          }}
        />
        <div style={{ fontSize: 11, fontWeight: 1000, opacity: 0.85 }}>
          {title}
        </div>
      </div>

      <div style={{ marginTop: 12, fontSize: 18, fontWeight: 1000 }}>
        {value}
      </div>
      <div style={{ marginTop: 8, fontSize: 11, opacity: 0.78, fontWeight: 900 }}>
        {sub}
      </div>
    </GlowCard>
  );
}

function BarRow({
  label,
  right,
  pctValue,
  subtitle,
  accent = "aqua",
}: {
  label: string;
  right: string;
  pctValue: number;
  subtitle?: string;
  accent?: Accent;
}) {
  const w = Math.max(0, Math.min(100, Number(pctValue) || 0));
  const a = accentRGB(accent);

  return (
    <GlowCard accent={accent} style={{ padding: 12, display: "grid", gap: 10 }}>
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: 999,
              background: a.dot,
              boxShadow: `0 0 12px ${a.dot}`,
              display: "inline-block",
              marginTop: 2,
            }}
          />
          <div style={{ fontWeight: 1000, fontSize: 12 }}>{label}</div>
          {subtitle ? (
            <div style={{ fontSize: 11, opacity: 0.72, fontWeight: 900 }}>
              {subtitle}
            </div>
          ) : null}
        </div>

        <div style={{ fontSize: 12, fontWeight: 1000, opacity: 0.9 }}>
          {right}
        </div>
      </div>

      <div
        style={{
          height: 10,
          borderRadius: 999,
          border: "1px solid rgba(255,255,255,0.08)",
          background: "rgba(255,255,255,0.04)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${w}%`,
            background: a.line,
            boxShadow: `0 0 18px ${a.glow}`,
          }}
        />
      </div>
    </GlowCard>
  );
}

/* ========================= Types (API) ========================= */

type ApiRow = { label: string; pedidos: number; valor: number; pct: number };

type ApiMobileDashboard = {
  ok: boolean;
  range?: { label: string };
  kpis?: {
    pedidos: number;
    faturamento: number;
    ticket_medio: number;
    margem: number;
    lucro_estimado: number;
    despesas: number;
  };
  ranking_pagamentos?: ApiRow[];
  pedidos_por_plataforma?: ApiRow[];
  pedidos_por_atendimento?: ApiRow[];
  error?: string;
};

/* ========================= FIXED UI LISTS ========================= */

const FIX_PAY = [
  "DINHEIRO",
  "PIX",
  "PAGAMENTO ONLINE",
  "CARTÃO DE CRÉDITO",
  "CARTÃO DE DÉBITO",
];
const FIX_PLAT = ["AIQFOME", "BALCÃO", "WHATSAPP", "DELIVERY MUCH", "IFOOD"];
const FIX_ATT = ["ENTREGA", "RETIRADA", "MESAS"];

function mapAccentFromLabel(label: string, kind: "pay" | "plat" | "att"): Accent {
  const L = (label || "").toUpperCase();

  if (kind === "plat") {
    if (L.includes("AIQ")) return "purple";
    if (L.includes("WHATS")) return "green";
    if (L.includes("DELIVERY")) return "yellow";
    if (L.includes("IFOOD")) return "red";
    return "aqua";
  }
  if (kind === "att") {
    if (L.includes("MES")) return "yellow";
    return "aqua";
  }
  return "aqua";
}

function mergeFixed(fixed: string[], incoming?: ApiRow[]) {
  const map = new Map<string, ApiRow>();
  (incoming || []).forEach((r) => map.set((r.label || "").toUpperCase(), r));

  return fixed.map((label) => {
    const found = map.get(label);
    return {
      label,
      pedidos: found?.pedidos || 0,
      valor: found?.valor || 0,
      pct: found?.pct || 0,
    };
  });
}

/* ========================= Page ========================= */

export default function MobileDashboardPage() {
  // ✅ igual Pedidos (dia operacional)
  const opToday = useMemo(() => opDateISO(new Date(), 6), []);

  // ✅ seletor novo
  const [period, setPeriod] = useState<PeriodKey>("hoje");
  const [singleDate, setSingleDate] = useState<string>(opToday);
  const [rangeFrom, setRangeFrom] = useState<string>(addDaysISO(opToday, -6));
  const [rangeTo, setRangeTo] = useState<string>(opToday);

  // ✅ calcula query pro backend:
  // - period=... (hoje/ontem/7d/30d/este_mes/mes_anterior)
  // - from/to pra uma_data e um_periodo
  const { queryQS, localLabel } = useMemo(() => {
    const end = opToday;

    if (period === "hoje") return { queryQS: "period=hoje", localLabel: "Hoje" };
    if (period === "ontem") return { queryQS: "period=ontem", localLabel: "Ontem" };
    if (period === "7d") return { queryQS: "period=7d", localLabel: "Últimos 7 dias" };
    if (period === "30d") return { queryQS: "period=30d", localLabel: "Últimos 30 dias" };
    if (period === "este_mes") return { queryQS: "period=este_mes", localLabel: "Esse mês" };
    if (period === "mes_anterior") return { queryQS: "period=mes_anterior", localLabel: "Mês anterior" };

    if (period === "uma_data") {
      const d = clampISO(singleDate) || end;
      return { queryQS: `from=${encodeURIComponent(d)}&to=${encodeURIComponent(d)}`, localLabel: isoToBR(d) };
    }

    // um_periodo
    const f0 = clampISO(rangeFrom) || addDaysISO(end, -6);
    const t0 = clampISO(rangeTo) || end;
    const f = f0 <= t0 ? f0 : t0;
    const t = f0 <= t0 ? t0 : f0;
    return {
      queryQS: `from=${encodeURIComponent(f)}&to=${encodeURIComponent(t)}`,
      localLabel: `${isoToBR(f)} - ${isoToBR(t)}`,
    };
  }, [period, opToday, singleDate, rangeFrom, rangeTo]);

  const [loading, setLoading] = useState(false);
  const [api, setApi] = useState<ApiMobileDashboard | null>(null);
  const [err, setErr] = useState<string>("");

  useEffect(() => {
    let alive = true;

    async function load() {
      setLoading(true);
      setErr("");

      try {
        const res = await fetch(`/api/dashboard?${queryQS}&view=mobile`, {
          method: "GET",
          headers: { "content-type": "application/json" },
          cache: "no-store",
        });

        const j = (await res.json()) as ApiMobileDashboard;

        if (!res.ok || !j?.ok) {
          const msg = j?.error || `Falha ao carregar dashboard (${res.status})`;
          throw new Error(msg);
        }

        if (alive) setApi(j);
      } catch (e: any) {
        if (alive) {
          setApi(null);
          setErr(e?.message || "Erro ao carregar dashboard");
        }
      } finally {
        if (alive) setLoading(false);
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, [queryQS]);

  const d = useMemo(() => {
    const k = api?.kpis || {
      pedidos: 0,
      faturamento: 0,
      ticket_medio: 0,
      margem: 30,
      lucro_estimado: 0,
      despesas: 0,
    };

    return {
      pedidos: k.pedidos || 0,
      fat: k.faturamento || 0,
      ticket: k.ticket_medio || 0,
      margem: k.margem ?? 30,
      lucro: k.lucro_estimado || 0,
      despesas: k.despesas || 0,

      pagamentos: mergeFixed(FIX_PAY, api?.ranking_pagamentos).map((r) => ({
        ...r,
        accent: mapAccentFromLabel(r.label, "pay"),
      })),
      plataformas: mergeFixed(FIX_PLAT, api?.pedidos_por_plataforma).map((r) => ({
        ...r,
        accent: mapAccentFromLabel(r.label, "plat"),
      })),
      atendimento: mergeFixed(FIX_ATT, api?.pedidos_por_atendimento).map((r) => ({
        ...r,
        accent: mapAccentFromLabel(r.label, "att"),
      })),

      // ✅ prioridade: label da API; fallback: label local (do seletor)
      rangeLabel: api?.range?.label || localLabel,
    };
  }, [api, localLabel]);

  return (
    <>
      <div style={{ display: "grid", gap: 12 }}>
        {/* header (dropdown no header, igual Pedidos) */}
        <Shell style={{ background: BG_PAGE }}>
          <TitleRow
            title="Dashboard"
            subtitle={`Pizza Blu • ${d.rangeLabel || new Date().toLocaleDateString("pt-BR")}`}
            right={
              <PeriodSelect
                value={period}
                onChange={(v) => {
                  setPeriod(v);
                  setErr("");

                  // ✅ igual Pedidos: quando troca pra uma_data/um_periodo, inicializa
                  if (v === "uma_data") setSingleDate(opToday);
                  if (v === "um_periodo") {
                    setRangeFrom(addDaysISO(opToday, -6));
                    setRangeTo(opToday);
                  }
                }}
              />
            }
          />

          <div style={{ marginTop: 12, fontSize: 11, opacity: 0.78, fontWeight: 900 }}>
            {loading ? "Carregando…" : err ? `Erro: ${err}` : ""}
          </div>
        </Shell>

        {/* ✅ cards fora do header (igual Pedidos) */}
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

        {/* KPIs */}
        <Shell>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <TopCard
              title="Pedidos"
              value={String(d.pedidos)}
              sub1={`Ticket médio: ${fmtBRL(d.ticket)}`}
              accent="aqua"
            />
            <TopCard title="Faturamento" value={fmtBRL(d.fat)} sub1="Receita Total:" accent="aqua" />
            <TopCard
              title="Lucro Estimado"
              value={fmtBRL(d.lucro)}
              sub1={`Margem: ${pct(d.margem)}`}
              accent="green"
            />
            <TopCard title="Despesas" value={fmtBRL(d.despesas)} sub1="Despesa Total:" accent="red" />
          </div>
        </Shell>

        {/* Ranking pagamentos */}
        <Shell>
          <SectionLabel>Ranking de Pagamentos</SectionLabel>
          <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
            {d.pagamentos.map((r) => (
              <BarRow
                key={r.label}
                label={r.label}
                subtitle={`${r.pedidos} pedidos • ${pct(r.pct)}`}
                right={fmtBRL(r.valor)}
                pctValue={r.pct}
                accent={r.accent}
              />
            ))}
          </div>
        </Shell>

        {/* Pedidos por Plataforma */}
        <Shell>
          <SectionLabel>Pedidos por Plataforma</SectionLabel>
          <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {d.plataformas.map((r) => (
              <MiniMetricCard
                key={r.label}
                title={r.label}
                value={fmtBRL(r.valor)}
                sub={`${r.pedidos} pedidos • ${pct(r.pct)}`}
                accent={r.accent}
                badge={String(r.pedidos)}
              />
            ))}
          </div>
        </Shell>

        {/* Pedidos por Atendimento */}
        <Shell>
          <SectionLabel>Pedidos por Atendimento</SectionLabel>
          <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {d.atendimento.map((r) => (
              <MiniMetricCard
                key={r.label}
                title={r.label}
                value={fmtBRL(r.valor)}
                sub={`${r.pedidos} pedidos • ${pct(r.pct)}`}
                accent={r.accent}
                badge={String(r.pedidos)}
              />
            ))}
          </div>
        </Shell>
      </div>

      {/* ✅ REMOVE O ÍCONE DO CALENDÁRIO (sem quebrar o input no mobile) */}
      <style jsx global>{`
        input.fintex-date::-webkit-calendar-picker-indicator {
          opacity: 0;
          width: 0;
          height: 0;
          margin: 0;
          padding: 0;
          pointer-events: none;
        }
        input.fintex-date {
          padding-right: 12px !important;
        }
      `}</style>
    </>
  );
}
