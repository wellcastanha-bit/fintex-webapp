// app/dashboard/components/boxes/pedidos_por_plataforma.tsx
"use client";

import React, { useState } from "react";
import { CardShell, fmtBRL, pct } from "../card_shell";

export type PlataformaRow = {
  key: string;
  pedidos: number;
  valor: number;
  pct: number;
  accent: "purple" | "blue" | "green" | "red" | "orange";
};

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
  accent: "purple" | "blue" | "green" | "red" | "orange";
  corner: string;
}) {
  const [hover, setHover] = useState(false);

  const map = {
    purple: {
      bd: "rgba(171, 95, 255, 0.42)",
      glow: "rgba(171,95,255,0.20)",
      fog: "rgba(171,95,255,0.38)",
      fog2: "rgba(171,95,255,0.18)",
    },
    blue: {
      bd: "rgba(79,220,255,0.38)",
      glow: "rgba(79,220,255,0.18)",
      fog: "rgba(79,220,255,0.38)",
      fog2: "rgba(79,220,255,0.18)",
    },
    green: {
      bd: "rgba(67,208,121,0.38)",
      glow: "rgba(67,208,121,0.18)",
      fog: "rgba(67,208,121,0.36)",
      fog2: "rgba(67,208,121,0.16)",
    },
    red: {
      bd: "rgba(255,107,107,0.38)",
      glow: "rgba(255,107,107,0.18)",
      fog: "rgba(255,107,107,0.34)",
      fog2: "rgba(255,107,107,0.14)",
    },
    orange: {
      bd: "rgba(255,184,77,0.40)",
      glow: "rgba(255,184,77,0.18)",
      fog: "rgba(255,184,77,0.34)",
      fog2: "rgba(255,184,77,0.14)",
    },
  }[accent];

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        borderRadius: 16,
        border: `1px solid ${hover ? map.fog : map.bd}`,
        background: hover
          ? `radial-gradient(900px 240px at 20% 0%, ${map.fog}, rgba(0,0,0,0) 58%),
             radial-gradient(700px 260px at 85% 20%, ${map.fog2}, rgba(0,0,0,0) 62%),
             linear-gradient(180deg, rgba(255,255,255,0.06), rgba(0,0,0,0.14))`
          : `radial-gradient(900px 240px at 20% 0%, ${map.fog2}, rgba(0,0,0,0) 58%),
             linear-gradient(180deg, rgba(255,255,255,0.04), rgba(0,0,0,0.12))`,
        boxShadow: hover
          ? `0 0 0 1px rgba(255,255,255,0.06), 0 0 30px ${map.glow}, 0 18px 55px rgba(0,0,0,0.55)`
          : `0 0 20px ${map.glow}`,
        padding: 14,
        position: "relative",
        minHeight: 94,
        backdropFilter: hover ? "blur(18px)" : "blur(10px)",
        WebkitBackdropFilter: hover ? "blur(18px)" : "blur(10px)",
        transition:
          "border-color 180ms ease, box-shadow 180ms ease, backdrop-filter 180ms ease, background 180ms ease, transform 180ms ease",
        transform: hover ? "translateY(-1px)" : "translateY(0px)",
        filter: hover ? "brightness(1.06)" : "brightness(1)",
      }}
    >
      <div style={{ color: "#ffffff", fontWeight: 950, fontSize: 15 }}>{title}</div>
      <div style={{ marginTop: 10, color: "rgba(255,255,255,0.95)", fontWeight: 980, fontSize: 20 }}>{value}</div>
      <div style={{ marginTop: 6, color: "#d4d4d4", fontWeight: 850, fontSize: 15 }}>{meta}</div>
      <div style={{ position: "absolute", right: 10, top: 10, color: "#d4d4d4", fontWeight: 950, fontSize: 18 }}>
        {corner}
      </div>
    </div>
  );
}

export default function PedidosPorPlataforma({ rows }: { rows: PlataformaRow[] }) {
  const [outerHover, setOuterHover] = useState(false);

  return (
    <div
      onMouseEnter={() => setOuterHover(true)}
      onMouseLeave={() => setOuterHover(false)}
      style={{
        borderRadius: 18,
        border: `1px solid ${outerHover ? "rgba(79,220,255,0.34)" : "rgba(79,220,255,0.22)"}`,
        boxShadow: outerHover
          ? "0 0 0 1px rgba(79,220,255,0.12), 0 0 34px rgba(79,220,255,0.16), 0 18px 55px rgba(0,0,0,0.55)"
          : "0 0 0 1px rgba(79,220,255,0.08), 0 18px 55px rgba(0,0,0,0.55)",
        backdropFilter: outerHover ? "blur(14px)" : "blur(8px)",
        WebkitBackdropFilter: outerHover ? "blur(14px)" : "blur(8px)",
        transition: "border-color 180ms ease, box-shadow 180ms ease, backdrop-filter 180ms ease",
      }}
    >
      <CardShell style={{ border: "1px solid rgba(0,0,0,0)", boxShadow: "none" }}>
        {/* Title maior */}
        <div
          style={{
            padding: "14px 16px 10px 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <div style={{ color: "rgba(255,255,255,0.92)", fontWeight: 980, fontSize: 18 }}>
            Pedidos por Plataforma
          </div>
          <div style={{ color: "rgb(255, 255, 255)", fontWeight: 900, fontSize: 18 }}></div>
        </div>

        <div style={{ padding: "0 16px 16px 16px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 10 }}>
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
