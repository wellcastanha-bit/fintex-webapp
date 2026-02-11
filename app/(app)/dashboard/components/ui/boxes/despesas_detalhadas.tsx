// app/dashboard/components/boxes/despesas_detalhadas.tsx
"use client";

import React, { useState } from "react";
import { CardShell, SectionTitle, fmtBRL, pct } from "../card_shell";

export type DespesaRow = { key: string; pct: number; valor: number };

export default function DespesasDetalhadas({ rows }: { rows: DespesaRow[] }) {
  const [outerHover, setOuterHover] = useState(false);

  return (
    <div
      onMouseEnter={() => setOuterHover(true)}
      onMouseLeave={() => setOuterHover(false)}
      style={{
        borderRadius: 20,
        border: "1px solid rgba(79,220,255,0.34)", // ✅ sempre marcada
        boxShadow: outerHover
          ? "0 0 0 1px rgba(79,220,255,0.18), 0 0 52px rgba(79,220,255,0.20), 0 18px 60px rgba(0,0,0,0.62)"
          : "0 0 0 1px rgba(79,220,255,0.14), 0 0 40px rgba(79,220,255,0.16), 0 18px 60px rgba(0,0,0,0.62)",
        background: "linear-gradient(180deg, rgba(255,255,255,0.03), rgba(0,0,0,0.12))",
        backdropFilter: outerHover ? "blur(16px)" : "blur(12px)",
        WebkitBackdropFilter: outerHover ? "blur(16px)" : "blur(12px)",
        transition: "box-shadow 180ms ease, backdrop-filter 180ms ease, filter 180ms ease",
        filter: outerHover ? "brightness(1.03)" : "brightness(1)",
        overflow: "hidden",
      }}
    >
      <CardShell style={{ border: "1px solid rgba(0,0,0,0)", boxShadow: "none" }}>
        {/* Header igual padrão */}
        <div
          style={{
            padding: "16px 18px 12px 18px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <div style={{ color: "rgba(255,255,255,0.92)", fontWeight: 980, fontSize: 18 }}>
            Despesas Totais
          </div>
          <div style={{ color: "rgba(255,255,255,0.65)", fontWeight: 850, fontSize: 13 }}>
            
          </div>
        </div>

        <div style={{ padding: "0 18px 18px 18px", display: "flex", flexDirection: "column", gap: 10 }}>
          {rows.map((d) => (
            <DespesaRowTile key={d.key} label={d.key} pctValue={d.pct} value={d.valor} />
          ))}
        </div>
      </CardShell>
    </div>
  );
}

function DespesaRowTile({
  label,
  pctValue,
  value,
}: {
  label: string;
  pctValue: number;
  value: number;
}) {
  const [hover, setHover] = useState(false);

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        padding: "14px 14px",
        borderRadius: 16,
        border: `1px solid ${hover ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.12)"}`,
        background: hover
          ? "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(0,0,0,0.20))"
          : "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(0,0,0,0.18))",
        boxShadow: hover
          ? "0 0 0 1px rgba(255,255,255,0.06), 0 18px 55px rgba(0,0,0,0.55)"
          : "0 18px 55px rgba(0,0,0,0.45)",
        transition:
          "border-color 180ms ease, box-shadow 180ms ease, background 180ms ease, filter 180ms ease, transform 180ms ease",
        transform: hover ? "translateY(-1px)" : "translateY(0px)",
        filter: hover ? "brightness(1.04)" : "brightness(1)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 12,
        minWidth: 0,
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            color: "#4dd5f8",
            fontWeight: 950,
            fontSize: 15,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {label}
        </div>
        <div style={{ marginTop: 6, color: "rgb(255, 255, 255)", fontWeight: 850, fontSize: 12 }}>
          {pct(pctValue)} do faturamento
        </div>
      </div>

      <div style={{ color: "#4dd5f8", fontWeight: 980, fontSize: 18, whiteSpace: "nowrap" }}>
        {fmtBRL(value)}
      </div>
    </div>
  );
}
