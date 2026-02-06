// app/dashboard/components/boxes/cards_topo.tsx
"use client";

import React from "react";

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
  const map = {
    aqua: { top: "rgba(79,220,255,0.14)", bd: "rgba(79,220,255,0.18)" },
    green: { top: "rgba(67,208,121,0.16)", bd: "rgba(67,208,121,0.20)" },
    red: { top: "rgba(255,107,107,0.16)", bd: "rgba(255,107,107,0.20)" },
    gray: { top: "rgba(255,255,255,0.08)", bd: "rgba(255,255,255,0.12)" },
  }[accent];

  return (
    <div
      style={{
        borderRadius: 18,
        border: `1px solid ${map.bd}`,
        background: `linear-gradient(180deg, ${map.top}, rgba(255,255,255,0.02))`,
        boxShadow:
          "0 0 0 1px rgba(79,220,255,0.05), 0 18px 55px rgba(0,0,0,0.45)",
        padding: 16,
        minHeight: 92,
      }}
    >
      <div style={{ color: "rgb(255, 255, 255)", fontWeight: 900, fontSize: 15 }}>
        {title}
      </div>
      <div style={{ marginTop: 10, color: "rgba(255,255,255,0.95)", fontWeight: 980, fontSize: 24 }}>
        {value}
      </div>
      <div style={{ marginTop: 6, color: "rgba(255,255,255,0.62)", fontWeight: 850, fontSize: 15 }}>
        {sub}
      </div>
    </div>
  );
}

export default function CardsTopo({
  pedidos,
  ticketMedio,
  faturamento,
  lucroEstimado,
  margemPct,
  despesas,
  despesasPct,
  fmtBRL,
}: {
  pedidos: number;
  ticketMedio: number;
  faturamento: number;
  lucroEstimado: number;
  margemPct: number;
  despesas: number;
  despesasPct: number;
  fmtBRL: (v: number) => string;
}) {
  return (
    <div style={{ padding: 18, paddingTop: 0 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 12 }}>
        <MetricCard title="PEDIDOS" value={String(pedidos)} sub={`Ticket médio: ${fmtBRL(ticketMedio)}`} accent="gray" />
        <MetricCard title="FATURAMENTO" value={fmtBRL(faturamento)} sub="Receita total do dia" accent="aqua" />
        <MetricCard title="LUCRO ESTIMADO" value={fmtBRL(lucroEstimado)} sub={`Margem: ${margemPct.toFixed(1).replace(".", ",")}%`} accent="green" />
        <MetricCard title="DESPESAS" value={fmtBRL(despesas)} sub={`${despesasPct.toFixed(1).replace(".", ",")}% do faturamento`} accent="red" />
      </div>
    </div>
  );
}
