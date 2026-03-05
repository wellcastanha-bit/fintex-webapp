// app/dashboard/components/boxes/cards_topo.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";

function accentMap(accent: "aqua" | "green" | "red" | "gray") {
  const map = {
    aqua: {
      bd: "rgba(79,220,255,0.34)",
      bdHover: "rgba(79,220,255,0.60)",
      glow: "rgba(79,220,255,0.18)",
      innerTop: "rgba(255,255,255,0.08)",
      innerBot: "rgba(0,0,0,0.22)",
      tag: "rgba(79, 220, 255, 0.96)",
    },
    green: {
      bd: "rgba(67,208,121,0.34)",
      bdHover: "rgba(67,208,121,0.60)",
      glow: "rgba(67,208,121,0.16)",
      innerTop: "rgba(255,255,255,0.08)",
      innerBot: "rgba(0,0,0,0.22)",
      tag: "rgba(67, 208, 121, 0.95)",
    },
    red: {
      bd: "rgba(255,107,107,0.34)",
      bdHover: "rgba(255,107,107,0.62)",
      glow: "rgba(255,107,107,0.16)",
      innerTop: "rgba(255,255,255,0.08)",
      innerBot: "rgba(0,0,0,0.22)",
      tag: "rgba(255, 107, 107, 0.95)",
    },
    gray: {
      bd: "rgba(255,255,255,0.26)",
      bdHover: "rgba(255,255,255,0.40)",
      glow: "rgba(255,255,255,0.10)",
      innerTop: "rgba(255,255,255,0.08)",
      innerBot: "rgba(0,0,0,0.22)",
      tag: "rgb(255, 255, 255)",
    },
  } as const;

  return map[accent];
}

function MetricCard({
  title,
  value,
  sub,
  accent = "aqua",
}: {
  title: string;
  value: string;
  sub: string;
  accent?: "aqua" | "green" | "red" | "gray";
}) {
  const [hover, setHover] = useState(false);
  const m = useMemo(() => accentMap(accent), [accent]);

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        borderRadius: 18,
        border: `1px solid ${hover ? m.bdHover : m.bd}`,
        background: hover
          ? `linear-gradient(180deg, rgba(255,255,255,0.10), rgba(0,0,0,0.24))`
          : `linear-gradient(180deg, ${m.innerTop}, ${m.innerBot})`,
        boxShadow: hover
          ? `0 0 0 1px rgba(255,255,255,0.06),
             0 0 34px ${m.glow},
             0 18px 55px rgba(0,0,0,0.58)`
          : `0 0 18px ${m.glow}`,
        padding: 16,
        minHeight: 108,
        backdropFilter: "none",
        WebkitBackdropFilter: "none",
        transition:
          "border-color 180ms ease, box-shadow 180ms ease, background 180ms ease, transform 180ms ease, filter 180ms ease",
        transform: hover ? "translateY(-1px)" : "translateY(0px)",
        filter: hover ? "brightness(1.06)" : "brightness(1)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
        <div
          style={{
            color: m.tag,
            fontWeight: 950,
            fontSize: 15,
            letterSpacing: 0.6,
            textTransform: "uppercase",
          }}
        >
          {title}
        </div>

        <div style={{ color: m.tag, fontWeight: 950, fontSize: 15, letterSpacing: 0.2 }} />
      </div>

      <div
        style={{
          marginTop: 12,
          color: "rgba(255,255,255,0.96)",
          fontWeight: 990,
          fontSize: 25,
          letterSpacing: -0.2,
        }}
      >
        {value}
      </div>

      <div style={{ marginTop: 8, color: "rgb(248, 246, 246)", fontWeight: 850, fontSize: 15 }}>{sub}</div>
    </div>
  );
}

// =========================
// ✅ Agora puxa DESPESAS do backend (Supabase) AUTOMATICAMENTE
// - sem tenant / sem company_id
// - margem FIXA em 30% (por enquanto)
// =========================
export type DashboardKpis = {
  pedidos: number;
  faturamento: number;
  ticket_medio: number;

  // ⚠️ backend pode mandar qualquer coisa aqui, mas NO FRONT vamos travar 30% por enquanto
  margem: number; // fração (0.3 -> 30%)
  lucro_estimado: number;

  despesas: number;
  despesas_pct: number; // fração (0.085 -> 8,5%)
};

type ApiKpisResponse =
  | DashboardKpis
  | { kpis: DashboardKpis }
  | { ok: boolean; kpis: DashboardKpis }
  | { data: DashboardKpis }
  | any;

function pickKpisFromApi(data: ApiKpisResponse): DashboardKpis | null {
  if (!data) return null;
  const k =
    (data?.kpis as DashboardKpis) ??
    (data?.data as DashboardKpis) ??
    (typeof data?.pedidos === "number" ? (data as DashboardKpis) : null);

  if (!k) return null;

  const safe: DashboardKpis = {
    pedidos: Number(k.pedidos ?? 0) || 0,
    faturamento: Number(k.faturamento ?? 0) || 0,
    ticket_medio: Number(k.ticket_medio ?? 0) || 0,

    // vai ser sobrescrito abaixo (30% fixo)
    margem: Number(k.margem ?? 0) || 0,
    lucro_estimado: Number(k.lucro_estimado ?? 0) || 0,

    despesas: Number(k.despesas ?? 0) || 0,
    despesas_pct: Number(k.despesas_pct ?? 0) || 0,
  };

  return safe;
}

export default function CardsTopo({
  // novo (preferido)
  kpis,

  // ✅ opcional: se teu dashboard já tem filtro de data, passa a dateISO (YYYY-MM-DD)
  dateISO,

  // ✅ opcional: se tua rota do dashboard for diferente, passa aqui
  apiPath,

  // fallback (se o pai ainda não foi migrado)
  pedidos,
  ticketMedio,
  faturamento,
  lucroEstimado,
  // margemPct NÃO vamos usar (fica travada em 30%), mas mantém pra compatibilidade
  margemPct,
  despesas,
  despesasPct,

  fmtBRL,
}: {
  kpis?: DashboardKpis;

  dateISO?: string;
  apiPath?: string;

  pedidos?: number;
  ticketMedio?: number;
  faturamento?: number;
  lucroEstimado?: number;
  margemPct?: number;
  despesas?: number;
  despesasPct?: number;

  fmtBRL: (v: number) => string;
}) {
  const [kpisDb, setKpisDb] = useState<DashboardKpis | null>(null);
  const [status, setStatus] = useState<"idle" | "ok" | "err">("idle");

  useEffect(() => {
    if (kpis) return;

    let alive = true;

    async function load() {
      setStatus("idle");
      try {
        const base = apiPath?.trim() || "/api/dashboard";
        const u = new URL(base, typeof window !== "undefined" ? window.location.origin : "http://localhost");
        u.searchParams.set("kpis", "1");
        if (dateISO) u.searchParams.set("date", dateISO);

        const res = await fetch(u.toString(), { method: "GET", cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = await res.json();
        const picked = pickKpisFromApi(data);
        if (!picked) throw new Error("kpis inválido");

        if (!alive) return;
        setKpisDb(picked);
        setStatus("ok");
      } catch {
        if (!alive) return;
        setKpisDb(null);
        setStatus("err");
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, [kpis, apiPath, dateISO]);

  // ✅ prioridade: kpis prop > kpisDb > props soltas
// ✅ prioridade: kpis prop > kpisDb > props soltas
const K = kpis ?? kpisDb;

// pedidos/faturamento com fallback
const p = (K?.pedidos ?? pedidos ?? 0);
const fat = (K?.faturamento ?? faturamento ?? 0);

// ✅ ticket: se não vier do backend, calcula
const tm = (K?.ticket_medio ?? (p > 0 ? fat / p : 0));

// ✅ MARGEM FIXA (30%)
const FIXED_MARGIN = 0.3;
const margemPctUI = FIXED_MARGIN * 100;

// ✅ lucro estimado = faturamento * 30%
const luc = fat * FIXED_MARGIN;

// ✅ despesas vindo do supabase (via route do dashboard) com fallback
const desp = (K?.despesas ?? despesas ?? 0);

// ✅ % despesas no faturamento (se backend não mandou, calcula)
const despPctNum =
  (K?.despesas_pct != null ? K.despesas_pct * 100 : (fat > 0 ? (desp / fat) * 100 : 0));

const subDesp =
  status === "idle"
    ? "Despesa Total:"
    : status === "err"
    ? "Falha ao buscar despesas"
    : `${despPctNum.toFixed(1).replace(".", ",")}% do faturamento`;


  return (
    <div style={{ padding: 18, paddingTop: 0 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 12 }}>
        <MetricCard title="PEDIDOS" value={String(p)} sub={`Ticket médio: ${fmtBRL(tm)}`} accent="gray" />
        <MetricCard title="FATURAMENTO" value={fmtBRL(fat)} sub="Receita Total:" accent="aqua" />
        <MetricCard
          title="LUCRO ESTIMADO"
          value={fmtBRL(luc)}
          sub={`Margem: ${margemPctUI.toFixed(1).replace(".", ",")}%`}
          accent="green"
        />
        <MetricCard title="DESPESAS" value={fmtBRL(desp)} sub={subDesp} accent="red" />
      </div>
    </div>
  );
}
