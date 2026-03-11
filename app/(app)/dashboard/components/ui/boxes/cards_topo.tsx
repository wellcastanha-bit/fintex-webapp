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
          ? "linear-gradient(180deg, rgba(255,255,255,0.10), rgba(0,0,0,0.24))"
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
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
        }}
      >
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

        <div
          style={{
            color: m.tag,
            fontWeight: 950,
            fontSize: 15,
            letterSpacing: 0.2,
          }}
        />
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

      <div
        style={{
          marginTop: 8,
          color: "rgb(248, 246, 246)",
          fontWeight: 850,
          fontSize: 15,
        }}
      >
        {sub}
      </div>
    </div>
  );
}

export type DashboardKpis = {
  pedidos: number;
  faturamento: number;
  ticket_medio: number;
  margem: number;
  lucro_estimado: number;
  despesas: number;
  despesas_pct: number;
  fatias_vendidas?: number;
  valor_fatias?: number;
};

type ApiKpisResponse =
  | DashboardKpis
  | { kpis: DashboardKpis }
  | { ok: boolean; kpis: DashboardKpis }
  | { data: DashboardKpis }
  | Record<string, unknown>;

function pickKpisFromApi(data: ApiKpisResponse): DashboardKpis | null {
  if (!data) return null;

  const direct =
    typeof (data as DashboardKpis)?.pedidos === "number"
      ? (data as DashboardKpis)
      : null;

  const nestedKpis =
    (data as { kpis?: DashboardKpis })?.kpis ??
    (data as { data?: DashboardKpis })?.data ??
    direct;

  if (!nestedKpis) return null;

  return {
    pedidos: Number(nestedKpis.pedidos ?? 0) || 0,
    faturamento: Number(nestedKpis.faturamento ?? 0) || 0,
    ticket_medio: Number(nestedKpis.ticket_medio ?? 0) || 0,
    margem: Number(nestedKpis.margem ?? 0) || 0,
    lucro_estimado: Number(nestedKpis.lucro_estimado ?? 0) || 0,
    despesas: Number(nestedKpis.despesas ?? 0) || 0,
    despesas_pct: Number(nestedKpis.despesas_pct ?? 0) || 0,
    fatias_vendidas:
      nestedKpis.fatias_vendidas == null
        ? undefined
        : Number(nestedKpis.fatias_vendidas) || 0,
    valor_fatias:
      nestedKpis.valor_fatias == null
        ? undefined
        : Number(nestedKpis.valor_fatias) || 0,
  };
}

export default function CardsTopo({
  kpis,
  dateISO,
  apiPath,
  pedidos,
  ticketMedio,
  faturamento,
  lucroEstimado,
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

  useEffect(() => {
    if (kpis) return;

    let alive = true;

    async function load() {
      try {
        const base = apiPath?.trim() || "/api/dashboard";
        const u = new URL(
          base,
          typeof window !== "undefined"
            ? window.location.origin
            : "http://localhost"
        );

        if (dateISO) u.searchParams.set("date", dateISO);

        const res = await fetch(u.toString(), {
          method: "GET",
          cache: "no-store",
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = await res.json();
        const picked = pickKpisFromApi(data);

        if (!picked) throw new Error("kpis inválido");
        if (!alive) return;

        setKpisDb(picked);
      } catch {
        if (!alive) return;
        setKpisDb(null);
      }
    }

    load();

    return () => {
      alive = false;
    };
  }, [kpis, apiPath, dateISO]);

  const K = kpis ?? kpisDb;

  const totalPedidos = Number(K?.pedidos ?? pedidos ?? 0) || 0;
  const totalFaturamento = Number(K?.faturamento ?? faturamento ?? 0) || 0;
  const ticketMedioFinal =
    Number(K?.ticket_medio ?? 0) ||
    (totalPedidos > 0
      ? totalFaturamento / totalPedidos
      : Number(ticketMedio ?? 0) || 0);

  const margemFinal =
    Number(K?.margem ?? margemPct ?? 30) || 0;

  const lucroFinal =
    Number(K?.lucro_estimado ?? lucroEstimado ?? 0) ||
    totalFaturamento * (margemFinal / 100);

  const despesasFinal = Number(K?.despesas ?? despesas ?? 0) || 0;
  const despesasPctFinal =
    Number(K?.despesas_pct ?? despesasPct ?? 0) || 0;

  const totalFatias =
    K?.fatias_vendidas != null
      ? Number(K.fatias_vendidas) || 0
      : totalPedidos;

  const valorFatias =
    K?.valor_fatias != null
      ? Number(K.valor_fatias) || 0
      : totalFaturamento;

  return (
    <div style={{ padding: 18, paddingTop: 0 }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
          gap: 12,
        }}
      >
        <MetricCard
          title="PEDIDOS"
          value={String(totalPedidos)}
          sub={`Ticket médio: ${fmtBRL(ticketMedioFinal)}`}
          accent="gray"
        />

        <MetricCard
          title="FATURAMENTO"
          value={fmtBRL(totalFaturamento)}
          sub="Receita total"
          accent="aqua"
        />

        <MetricCard
          title="LUCRO ESTIMADO"
          value={fmtBRL(lucroFinal)}
          sub={`Margem: ${margemFinal.toFixed(1).replace(".", ",")}%`}
          accent="green"
        />

        <MetricCard
          title="FATIAS"
          value={fmtBRL(valorFatias)}
          sub={`${totalFatias} fatias vendidas`}
          accent="green"
        />
      </div>

      {(despesasFinal > 0 || despesasPctFinal > 0) && (
        <div
          style={{
            marginTop: 10,
            color: "rgba(255,255,255,0.58)",
            fontWeight: 800,
            fontSize: 12,
            paddingLeft: 2,
          }}
        >
          Despesas: {fmtBRL(despesasFinal)} · {despesasPctFinal.toFixed(1).replace(".", ",")}%
        </div>
      )}
    </div>
  );
}