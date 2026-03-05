// app/dashboard/components/boxes/conferencia_caixa.tsx
"use client";

import React, { useMemo, useState } from "react";
import { CardShell, fmtBRL } from "../card_shell";

export type ConferenciaData = {
  status: "OK" | "ATENÇÃO";
  caixaInicial: number;
  entradasDinheiro: number;
  saidas: number;
  caixaFinal: number;
  quebra: number;
};

/* =========================
   PADRÃO FINtEX (igual Pedidos Plataforma final)
========================= */
const OUTER_RADIUS = 20;
const OUTER_BORDER = "1px solid rgba(79,220,255,0.34)";
const OUTER_BG = "linear-gradient(180deg, rgba(255,255,255,0.03), rgba(0,0,0,0.12))";
const OUTER_SHADOW_OFF =
  "0 0 0 1px rgba(79,220,255,0.14), 0 0 40px rgba(79,220,255,0.16), 0 18px 60px rgba(0,0,0,0.62)";
const OUTER_SHADOW_ON =
  "0 0 0 1px rgba(79,220,255,0.18), 0 0 52px rgba(79,220,255,0.20), 0 18px 60px rgba(0,0,0,0.62)";

type Tone = "blue" | "green" | "red";

function toneMap(tone: Tone) {
  const map = {
    blue: {
      bd: "rgba(79,220,255,0.38)",
      bdHover: "rgba(79,220,255,0.62)",
      glow: "rgba(79,220,255,0.20)",
      innerTop: "rgba(255,255,255,0.08)",
      innerBot: "rgba(0,0,0,0.22)",
      tag: "rgba(79,220,255,0.96)",
    },
    green: {
      bd: "rgba(67,208,121,0.38)",
      bdHover: "rgba(67,208,121,0.62)",
      glow: "rgba(67,208,121,0.18)",
      innerTop: "rgba(255,255,255,0.08)",
      innerBot: "rgba(0,0,0,0.22)",
      tag: "rgba(67, 208, 121, 0.95)",
    },
    red: {
      bd: "rgba(255,107,107,0.40)",
      bdHover: "rgba(255,107,107,0.66)",
      glow: "rgba(255,107,107,0.18)",
      innerTop: "rgba(255,255,255,0.08)",
      innerBot: "rgba(0,0,0,0.22)",
      tag: "rgba(255, 107, 107, 0.95)",
    },
  } as const;

  return map[tone];
}

function MiniStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: Tone;
}) {
  const [hover, setHover] = useState(false);
  const t = useMemo(() => toneMap(tone), [tone]);

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        borderRadius: 18,
        border: `1px solid ${hover ? t.bdHover : t.bd}`,
        background: hover
          ? "linear-gradient(180deg, rgba(255,255,255,0.10), rgba(0,0,0,0.24))"
          : `linear-gradient(180deg, ${t.innerTop}, ${t.innerBot})`,
        boxShadow: hover
          ? `0 0 0 1px rgba(255,255,255,0.06),
             0 0 34px ${t.glow},
             0 18px 55px rgba(0,0,0,0.58)`
          : `0 0 18px ${t.glow}`,
        padding: 16,
        minHeight: 92,
        transition:
          "border-color 180ms ease, box-shadow 180ms ease, background 180ms ease, transform 180ms ease, filter 180ms ease",
        transform: hover ? "translateY(-1px)" : "translateY(0px)",
        filter: hover ? "brightness(1.06)" : "brightness(1)",
      }}
    >
      {/* ✅ label + canto na mesma cor (tag) */}
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
            color: t.tag,
            fontWeight: 950,
            fontSize: 15,
            letterSpacing: 0.6,
            textTransform: "uppercase",
          }}
        >
          {label}
        </div>

        {/* sem corner aqui (não precisa), mas deixei o layout igual */}
        <div style={{ width: 1, height: 1, opacity: 0 }} />
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
    </div>
  );
}

export default function ConferenciaCaixa({ data }: { data: ConferenciaData }) {
  const [outerHover, setOuterHover] = useState(false);

  const quebraAbs = Math.abs(Number(data.quebra || 0));
  const dangerQuebra = quebraAbs > 5;

  const statusPalette = dangerQuebra
    ? {
        bd: "rgba(255,107,107,0.32)",
        bg: "rgba(255,107,107,0.14)",
        dot: "rgba(255,107,107,0.95)",
        glow: "rgba(255,107,107,0.24)",
        label: "QUEBRA",
      }
    : data.status === "OK"
    ? {
        bd: "rgba(67,208,121,0.30)",
        bg: "rgba(67,208,121,0.12)",
        dot: "rgba(67,208,121,0.95)",
        glow: "rgba(67,208,121,0.14)",
        label: "OK",
      }
    : {
        bd: "rgba(255,184,77,0.30)",
        bg: "rgba(255,184,77,0.12)",
        dot: "rgba(255,184,77,0.95)",
        glow: "rgba(255,184,77,0.12)",
        label: "ATENÇÃO",
      };

  const quebraPalette = dangerQuebra
    ? {
        bd: "rgba(255,107,107,0.32)",
        bg: "rgba(255,107,107,0.14)",
        fg: "rgba(255,107,107,0.95)",
        glow: "rgba(255,107,107,0.20)",
      }
    : {
        bd: "rgba(67,208,121,0.30)",
        bg: "rgba(67,208,121,0.12)",
        fg: "rgba(67,208,121,0.95)",
        glow: "rgba(67,208,121,0.14)",
      };

  return (
    <div
      onMouseEnter={() => setOuterHover(true)}
      onMouseLeave={() => setOuterHover(false)}
      style={{
        borderRadius: OUTER_RADIUS,
        border: OUTER_BORDER, // ✅ sempre marcada
        boxShadow: outerHover ? OUTER_SHADOW_ON : OUTER_SHADOW_OFF,
        background: OUTER_BG,
        backdropFilter: outerHover ? "blur(16px)" : "blur(12px)",
        WebkitBackdropFilter: outerHover ? "blur(16px)" : "blur(12px)",
        transition: "box-shadow 180ms ease, backdrop-filter 180ms ease, filter 180ms ease",
        filter: outerHover ? "brightness(1.03)" : "brightness(1)",
        overflow: "hidden",
      }}
    >
      <CardShell style={{ border: "1px solid rgba(0,0,0,0)", boxShadow: "none" }}>
        {/* HEADER ORGANIZADO (igual padrão) */}
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
            Conferência de Caixa
          </div>

          <div
            style={{
              height: 28,
              padding: "0 12px",
              borderRadius: 999,
              border: `1px solid ${statusPalette.bd}`,
              background: statusPalette.bg,
              color: "rgba(255,255,255,0.92)",
              fontWeight: 950,
              fontSize: 15,
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              boxShadow: `0 0 22px ${statusPalette.glow}`,
              backdropFilter: "blur(10px)",
              WebkitBackdropFilter: "blur(10px)",
              transition: "box-shadow 180ms ease, backdrop-filter 180ms ease, filter 180ms ease",
              whiteSpace: "nowrap",
            }}
            title={dangerQuebra ? "Quebra de caixa acima de R$ 5,00" : undefined}
          >
            <span
              style={{
                width: 9,
                height: 9,
                borderRadius: 999,
                background: statusPalette.dot,
                boxShadow: `0 0 14px ${statusPalette.glow}`,
                display: "inline-block",
              }}
            />
            Status: {statusPalette.label}
          </div>
        </div>

        <div style={{ padding: "0 18px 18px 18px", display: "flex", flexDirection: "column", gap: 12 }}>
          {/* 3 mini cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 12 }}>
            <MiniStat label="Caixa inicial" value={fmtBRL(data.caixaInicial)} tone="blue" />
            <MiniStat label="Entradas (dinheiro)" value={fmtBRL(data.entradasDinheiro)} tone="green" />
            <MiniStat label="Saídas" value={fmtBRL(data.saidas)} tone="red" />
          </div>

          {/* Caixa final (tile grande) */}
          <div
            style={{
              position: "relative",
              borderRadius: 18,
              border: "1px solid rgba(79,220,255,0.18)",
              background:
                "radial-gradient(900px 260px at 20% 0%, rgba(79,220,255,0.22), rgba(0,0,0,0) 58%), linear-gradient(180deg, rgba(255,255,255,0.05), rgba(0,0,0,0.16))",
              boxShadow:
                "0 0 0 1px rgba(79,220,255,0.10) inset, 0 0 32px rgba(79,220,255,0.12), 0 18px 55px rgba(0,0,0,0.52)",
              padding: 16,
              overflow: "hidden",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              transition: "all 180ms ease",
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: -2,
                borderRadius: 20,
                background: "radial-gradient(110% 80% at 25% 0%, rgba(79,220,255,0.12), rgba(0,0,0,0) 62%)",
                pointerEvents: "none",
              }}
            />

            <div style={{ position: "relative" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-end",
                  justifyContent: "space-between",
                  gap: 12,
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <div style={{ color: "rgb(255, 255, 255)", fontWeight: 980, fontSize: 18 }}>
                    Caixa final
                  </div>
                  <div
                    style={{
                      marginTop: 10,
                      color: "#4dd5f8",
                      fontWeight: 990,
                      fontSize: 34,
                      letterSpacing: 0.2,
                    }}
                  >
                    {fmtBRL(data.caixaFinal)}
                  </div>
                </div>

                <div
                  style={{
                    height: 30,
                    padding: "0 12px",
                    borderRadius: 999,
                    border: `1px solid ${quebraPalette.bd}`,
                    background: quebraPalette.bg,
                    color: "rgba(255,255,255,0.92)",
                    fontWeight: 980,
                    fontSize: 18,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    boxShadow: `0 0 22px ${quebraPalette.glow}`,
                    backdropFilter: "blur(10px)",
                    WebkitBackdropFilter: "blur(10px)",
                    transition: "box-shadow 180ms ease, backdrop-filter 180ms ease, filter 180ms ease",
                    whiteSpace: "nowrap",
                  }}
                  title={dangerQuebra ? "Quebra de caixa acima de R$ 5,00" : "Diferença entre o caixa final e os registros"}
                >
                  Quebra:{" "}
                  <span style={{ color: quebraPalette.fg, fontWeight: 990 }}>
                    {fmtBRL(data.quebra)}
                  </span>
                </div>
              </div>

              <div style={{ marginTop: 10, color: "rgb(255, 255, 255)", fontWeight: 900, fontSize: 12 }}>
                {dangerQuebra
                  ? "Quebra acima de R$ 5,00 — conferir lançamentos e contadores antes de fechar."
                  : data.status === "OK"
                  ? ""
                  : "Conferir lançamentos e contadores antes de fechar o dia."}
              </div>
            </div>
          </div>
        </div>
      </CardShell>
    </div>
  );
}
