// app/dashboard/components/boxes/pedidos_por_atendimento.tsx
"use client";

import React, { useMemo, useState } from "react";
import { CardShell, fmtBRL, pct } from "../card_shell";

export type AtendimentoRow = {
  key: string;
  pedidos: number;
  valor: number;
  pct: number;
  accent: "gray" | "blue" | "orange";
};

function accentMap(accent: AtendimentoRow["accent"]) {
  const map = {
    gray: {
      bd: "rgba(255,255,255,0.22)",
      bdHover: "rgba(255,255,255,0.34)",
      glow: "rgba(255,255,255,0.12)",
      innerTop: "rgba(255,255,255,0.08)",
      innerBot: "rgba(0,0,0,0.22)",
      tag: "rgba(255,255,255,0.80)",
    },
    blue: {
      bd: "rgba(79,220,255,0.38)",
      bdHover: "rgba(79,220,255,0.62)",
      glow: "rgba(79,220,255,0.20)",
      innerTop: "rgba(255,255,255,0.08)",
      innerBot: "rgba(0,0,0,0.22)",
      tag: "rgba(79, 220, 255, 0.96)",
    },
    orange: {
      bd: "rgba(255,184,77,0.42)",
      bdHover: "rgba(255,184,77,0.68)",
      glow: "rgba(255,184,77,0.18)",
      innerTop: "rgba(255,255,255,0.08)",
      innerBot: "rgba(0,0,0,0.22)",
      tag: "rgba(255, 184, 77, 0.95)",
    },
  } as const;

  return map[accent];
}

function MiniCard({
  title,
  value,
  meta,
  accent,
  corner,
}: {
  title: string;
  value: string;
  meta: string;
  accent: AtendimentoRow["accent"];
  corner: string;
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
        position: "relative",
        minHeight: 108,
        backdropFilter: "none",
        WebkitBackdropFilter: "none",
        transition:
          "border-color 180ms ease, box-shadow 180ms ease, background 180ms ease, transform 180ms ease, filter 180ms ease",
        transform: hover ? "translateY(-1px)" : "translateY(0px)",
        filter: hover ? "brightness(1.06)" : "brightness(1)",
      }}
    >
      {/* ✅ título e número do canto na MESMA cor (m.tag) */}
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
        >
          {corner}
        </div>
      </div>

      {/* valor */}
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

      {/* meta */}
      <div
        style={{
          marginTop: 8,
          color: "rgb(248, 246, 246)",
          fontWeight: 850,
          fontSize: 15,
        }}
      >
        {meta}
      </div>

      {/* ✅ removido: "participação" */}
    </div>
  );
}

export default function PedidosPorAtendimento({ rows }: { rows: AtendimentoRow[] }) {
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
            Pedidos por Atendimento
          </div>

          <div style={{ color: "rgba(255,255,255,0.72)", fontWeight: 850, fontSize: 13 }} />
        </div>

        <div style={{ padding: "0 18px 18px 18px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 12 }}>
            {rows.map((p) => (
              <MiniCard
                key={p.key}
                title={p.key}
                value={fmtBRL(p.valor)}
                meta={`${p.pedidos} pedidos · ${pct(p.pct)}`}
                accent={p.accent}
                corner={String(p.pedidos)}
              />
            ))}
          </div>
        </div>
      </CardShell>
    </div>
  );
}
