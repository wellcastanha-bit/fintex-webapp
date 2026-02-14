// app/(mobile)/m/dashboard/page.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";

/* =========================================================
   FINtex Mobile - Dashboard
   ✅ UI FIXA (sempre mostra TODAS as opções)
   ✅ Só muda valores (se não tem dado, fica 0)
   ✅ Integra /api/dashboard?period=hoje|ontem|7d|30d
========================================================= */

const BG_PAGE =
  "radial-gradient(1200px 700px at 20% 0%, rgba(79,220,255,0.12), transparent 55%), radial-gradient(900px 520px at 80% 10%, rgba(79,220,255,0.10), transparent 60%), linear-gradient(180deg, rgba(4,19,40,1), rgba(2,11,24,1) 58%, rgba(2,9,20,1))";

const CARD_BG = "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))";
const CARD_INNER = "rgba(2,11,24,0.42)";
const AQUA_LINE = "rgba(79,220,255,0.18)";

type Accent = "aqua" | "green" | "yellow" | "red" | "purple";
type Period = "hoje" | "ontem" | "7d" | "30d";

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
    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
      <div>
        <div style={{ fontSize: 18, fontWeight: 1000, letterSpacing: 0.2 }}>{title}</div>
        {subtitle ? (
          <div style={{ marginTop: 6, fontSize: 12, opacity: 0.75, fontWeight: 900 }}>{subtitle}</div>
        ) : null}
      </div>
      {right ? <div style={{ flex: "0 0 auto" }}>{right}</div> : null}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 12, fontWeight: 1000, opacity: 0.9 }}>{children}</div>;
}

function Selector({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ display: "grid", gap: 8 }}>
      <div style={{ fontSize: 12, fontWeight: 1000, opacity: 0.85 }}>Selecione um Período:</div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: 170,
          maxWidth: "100%",
          padding: "12px 12px",
          borderRadius: 14,
          border: `1px solid ${AQUA_LINE}`,
          background: "rgba(2,11,24,0.55)",
          color: "rgba(255,255,255,0.92)",
          fontWeight: 950,
          outline: "none",
          appearance: "none",
        }}
      >
        <option value="hoje">hoje</option>
        <option value="ontem">ontem</option>
        <option value="7d">últimos 7 dias</option>
        <option value="30d">últimos 30 dias</option>
      </select>
    </div>
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
      <div style={{ fontSize: 11, fontWeight: 1000, opacity: 0.8 }}>{title.toUpperCase()}</div>
      <div style={{ marginTop: 10, fontSize: 18, fontWeight: 1000 }}>{value}</div>
      {sub1 ? <div style={{ marginTop: 8, fontSize: 11, opacity: 0.78, fontWeight: 900 }}>{sub1}</div> : null}
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
        <div style={{ fontSize: 11, fontWeight: 1000, opacity: 0.85 }}>{title}</div>
      </div>

      <div style={{ marginTop: 12, fontSize: 18, fontWeight: 1000 }}>{value}</div>
      <div style={{ marginTop: 8, fontSize: 11, opacity: 0.78, fontWeight: 900 }}>{sub}</div>
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
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
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
          {subtitle ? <div style={{ fontSize: 11, opacity: 0.72, fontWeight: 900 }}>{subtitle}</div> : null}
        </div>

        <div style={{ fontSize: 12, fontWeight: 1000, opacity: 0.9 }}>{right}</div>
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
    margem: number; // ✅ vem em % (ex: 30)
    lucro_estimado: number;
    despesas: number;
  };
  ranking_pagamentos?: ApiRow[];
  pedidos_por_plataforma?: ApiRow[];
  pedidos_por_atendimento?: ApiRow[];
  error?: string;
};

/* ========================= FIXED UI LISTS ========================= */

const FIX_PAY = ["DINHEIRO", "PIX", "PAGAMENTO ONLINE", "CARTÃO DE CRÉDITO", "CARTÃO DE DÉBITO"];
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

// garante lista fixa mesmo se API falhar
function mergeFixed(fixed: string[], incoming?: ApiRow[]) {
  const map = new Map<string, ApiRow>();
  (incoming || []).forEach((r) => map.set((r.label || "").toUpperCase(), r));

  return fixed.map((label) => {
    const found = map.get(label);
    return {
      label,
      pedidos: found?.pedidos || 0,
      valor: found?.valor || 0,
      pct: found?.pct || 0, // ✅ 0–100
    };
  });
}

/* ========================= Page ========================= */

export default function MobileDashboardPage() {
  const [period, setPeriod] = useState<Period>("hoje");
  const [loading, setLoading] = useState(false);
  const [api, setApi] = useState<ApiMobileDashboard | null>(null);
  const [err, setErr] = useState<string>("");

  useEffect(() => {
    let alive = true;

    async function load() {
      setLoading(true);
      setErr("");

      try {
        const res = await fetch(`/api/dashboard?period=${encodeURIComponent(period)}&view=mobile`, {
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
  }, [period]);

  const d = useMemo(() => {
    const k = api?.kpis || {
      pedidos: 0,
      faturamento: 0,
      ticket_medio: 0,
      margem: 30, // ✅ default % (30)
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

      // ✅ SEMPRE FIXO
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

      rangeLabel: api?.range?.label || "",
    };
  }, [api]);

  return (
    <div style={{ display: "grid", gap: 12 }}>
      {/* header */}
      <Shell style={{ background: BG_PAGE }}>
        <TitleRow
          title="Dashboard"
          subtitle={`Pizza Blu • ${d.rangeLabel || new Date().toLocaleDateString("pt-BR")}`}
          right={<Selector value={period} onChange={(v) => setPeriod(v as any)} />}
        />

        <div style={{ marginTop: 12, fontSize: 11, opacity: 0.78, fontWeight: 900 }}>
          {loading ? "Carregando…" : err ? `Erro: ${err}` : ""}
        </div>
      </Shell>

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
  );
}
