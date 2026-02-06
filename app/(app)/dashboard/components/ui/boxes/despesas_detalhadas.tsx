// app/dashboard/components/boxes/despesas_detalhadas.tsx
"use client";

import React from "react";
import { CardShell, SectionTitle, fmtBRL, pct } from "../card_shell";

export type DespesaRow = { key: string; pct: number; valor: number };

export default function DespesasDetalhadas({ rows }: { rows: DespesaRow[] }) {
  return (
    <CardShell>
      <SectionTitle
        title="Despesas Detalhadas"
        right={<div style={{ color: "rgba(255,255,255,0.55)", fontWeight: 900, fontSize: 11 }}>% sobre faturamento</div>}
      />
      <div style={{ padding: "0 16px 16px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
        {rows.map((d) => (
          <div
            key={d.key}
            style={{
              padding: 12,
              borderRadius: 14,
              border: "1px solid rgba(255,255,255,0.10)",
              background: "rgba(0,0,0,0.14)",
              display: "flex",
              justifyContent: "space-between",
              gap: 10,
            }}
          >
            <div>
              <div style={{ color: "rgba(255,255,255,0.92)", fontWeight: 950, fontSize: 12 }}>{d.key}</div>
              <div style={{ marginTop: 4, color: "rgba(255,255,255,0.60)", fontWeight: 850, fontSize: 11 }}>
                {pct(d.pct)} do faturamento
              </div>
            </div>
            <div style={{ color: "rgba(255,255,255,0.92)", fontWeight: 980, fontSize: 12 }}>
              {fmtBRL(d.valor)}
            </div>
          </div>
        ))}
      </div>
    </CardShell>
  );
}
