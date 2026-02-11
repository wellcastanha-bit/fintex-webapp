// app/dashboard/components/boxes/ranking_pagamentos.tsx
"use client";

import React, { useState } from "react";
import { CardShell, fmtBRL, pct } from "../card_shell";

export type RankingPagamentoRow = {
  key: string;
  pedidos: number;
  valor: number;
  pct: number; // % sobre o faturamento (0-100)
};

function BarRow({
  label,
  pedidos,
  pctValue,
  valorTotal,
}: {
  label: string;
  pedidos: number;
  pctValue: number;
  valorTotal: number;
}) {
  const [hover, setHover] = useState(false);

  const w = Math.max(0, Math.min(100, pctValue));
  const pedidoLabel = `${pedidos} Pedido${pedidos === 1 ? "" : "s"}`;

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
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "flex-start" }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ color: "#4dd5f8", fontWeight: 950, fontSize: 15 }}>
            {label}
          </div>

          {/* ✅ agora: "1 Pedido(s) · 50,0%" (sem o valor aqui) */}
          <div style={{ marginTop: 6, color: "rgba(255,255,255,0.95)", fontWeight: 850, fontSize: 15 }}>
            {pedidoLabel} <span style={{ opacity: 0.9 }}>·</span> {pct(pctValue)}
          </div>
        </div>

        {/* ✅ no lugar do #1: valor total (fonte um pouco maior) */}
        <div
          style={{
            color: "#4dd5f8",
            fontWeight: 950,
            fontSize: 17,
            lineHeight: "18px",
            whiteSpace: "nowrap",
            marginTop: 1,
          }}
        >
          {fmtBRL(valorTotal)}
        </div>
      </div>

      {/* ✅ BARRINHA */}
      <div
        style={{
          marginTop: 8,
          height: 8,
          borderRadius: 999,
          background: "rgba(255,255,255,0.08)",
          overflow: "hidden",
          border: "1px solid rgba(79,220,255,0.10)",
        }}
      >
        <div
          style={{
            width: `${w}%`,
            height: "100%",
            background:
              "linear-gradient(90deg, rgba(79,220,255,0.30) 0%, #4dd5f8 55%, rgba(255,255,255,0.25) 100%)",
            boxShadow: "0 0 20px rgba(79,220,255,0.18)",
          }}
        />
      </div>
    </div>
  );
}

export default function RankingPagamentos({ rows }: { rows: RankingPagamentoRow[] }) {
  const [outerHover, setOuterHover] = useState(false);

  return (
    <div
      onMouseEnter={() => setOuterHover(true)}
      onMouseLeave={() => setOuterHover(false)}
      style={{
        borderRadius: 20,
        border: "1px solid rgba(79,220,255,0.34)",
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
        {/* HEADER */}
        <div
          style={{
            padding: "16px 16px 10px 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <div
            style={{
              fontSize: 18,
              fontWeight: 950,
              letterSpacing: 0.2,
              color: "rgba(255,255,255,0.95)",
            }}
          >
            Ranking de Pagamentos
          </div>
        </div>

        {/* CONTEÚDO */}
        <div
          style={{
            padding: "0 16px 16px 16px",
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          {rows.map((r) => (
            <BarRow
              key={r.key}
              label={r.key}
              pedidos={r.pedidos}
              pctValue={r.pct}
              valorTotal={r.valor}
            />
          ))}
        </div>
      </CardShell>
    </div>
  );
}
