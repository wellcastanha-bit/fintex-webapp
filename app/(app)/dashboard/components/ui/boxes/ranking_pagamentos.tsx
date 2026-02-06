// app/dashboard/components/boxes/ranking_pagamentos.tsx
"use client";

import React from "react";
import { CardShell, SectionTitle, fmtBRL, pct } from "../card_shell";

export type RankingPagamentoRow = {
  key: string;
  pedidos: number;
  valor: number;
  pct: number;
};

function BarRow({
  label,
  subtitle,
  pctValue,
  rank,
}: {
  label: string;
  subtitle: string;
  pctValue: number;
  rank: number;
}) {
  const w = Math.max(2, Math.min(100, pctValue));
  return (
    <div
      style={{
        padding: "12px 12px",
        borderRadius: 14,
        border: "1px solid rgba(255,255,255,0.10)",
        background: "rgba(0,0,0,0.16)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ color: "rgba(255,255,255,0.92)", fontWeight: 950, fontSize: 12 }}>
            {label}
          </div>
          <div style={{ marginTop: 4, color: "rgba(255,255,255,0.70)", fontWeight: 850, fontSize: 11 }}>
            {subtitle}
          </div>
        </div>
        <div style={{ color: "rgba(255,255,255,0.55)", fontWeight: 950, fontSize: 11 }}>{`#${rank}`}</div>
      </div>

      <div
        style={{
          marginTop: 10,
          height: 8,
          borderRadius: 999,
          background: "rgba(255,255,255,0.08)",
          border: "1px solid rgba(255,255,255,0.10)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${w}%`,
            height: "100%",
            background: "rgba(79,220,255,0.85)",
            boxShadow: "0 0 18px rgba(79,220,255,0.35)",
          }}
        />
      </div>
    </div>
  );
}

export default function RankingPagamentos({ rows }: { rows: RankingPagamentoRow[] }) {
  return (
    <CardShell>
      <SectionTitle title="Ranking de Pagamentos" />
      <div style={{ padding: "0 16px 16px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
        {rows.map((r, idx) => (
          <BarRow
            key={r.key}
            label={r.key}
            subtitle={`${r.pedidos} pedidos · ${fmtBRL(r.valor)} · ${pct(r.pct)}`}
            pctValue={r.pct}
            rank={idx + 1}
          />
        ))}
      </div>
    </CardShell>
  );
}
