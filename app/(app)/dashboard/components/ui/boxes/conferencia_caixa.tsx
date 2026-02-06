// app/dashboard/components/boxes/conferencia_caixa.tsx
"use client";

import React from "react";
import { CardShell, SectionTitle, fmtBRL } from "../card_shell";

export type ConferenciaData = {
  status: "OK" | "ATENÇÃO";
  caixaInicial: number;
  entradasDinheiro: number;
  saidas: number;
  caixaFinal: number;
  quebra: number;
};

function MiniStat({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "neutral" | "blue" | "green" | "red";
}) {
  const t = {
    neutral: {
      bd: "rgba(255,255,255,0.10)",
      bgTop: "rgba(255,255,255,0.04)",
      glow: "rgba(79,220,255,0.06)",
      hoverBd: "rgba(79,220,255,0.26)",
      hoverGlow: "rgba(79,220,255,0.14)",
    },
    blue: {
      bd: "rgba(79,220,255,0.22)",
      bgTop: "rgba(79,220,255,0.10)",
      glow: "rgba(79,220,255,0.14)",
      hoverBd: "rgba(79,220,255,0.38)",
      hoverGlow: "rgba(79,220,255,0.22)",
    },
    green: {
      bd: "rgba(67,208,121,0.22)",
      bgTop: "rgba(67,208,121,0.10)",
      glow: "rgba(67,208,121,0.12)",
      hoverBd: "rgba(67,208,121,0.36)",
      hoverGlow: "rgba(67,208,121,0.20)",
    },
    red: {
      bd: "rgba(255,107,107,0.22)",
      bgTop: "rgba(255,107,107,0.10)",
      glow: "rgba(255,107,107,0.12)",
      hoverBd: "rgba(255,107,107,0.36)",
      hoverGlow: "rgba(255,107,107,0.20)",
    },
  }[tone];

  return (
    <div
      style={{
        borderRadius: 16,
        border: `1px solid ${t.bd}`,
        background: `linear-gradient(180deg, ${t.bgTop}, rgba(0,0,0,0.10))`,
        boxShadow: `0 0 0 1px rgba(79,220,255,0.04) inset, 0 0 24px ${t.glow}`,
        padding: 12,
        minHeight: 74,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        gap: 8,
        transition: "all .18s ease",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.border = `1px solid ${t.hoverBd}`;
        el.style.boxShadow = `0 0 0 1px rgba(79,220,255,0.10) inset, 0 0 28px ${t.hoverGlow}`;
        el.style.backdropFilter = "blur(14px)";
        (el.style as any).WebkitBackdropFilter = "blur(14px)";
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.border = `1px solid ${t.bd}`;
        el.style.boxShadow = `0 0 0 1px rgba(79,220,255,0.04) inset, 0 0 24px ${t.glow}`;
        el.style.backdropFilter = "blur(10px)";
        (el.style as any).WebkitBackdropFilter = "blur(10px)";
      }}
    >
      <div
        style={{
          color: "rgba(255,255,255,0.70)",
          fontWeight: 950,
          fontSize: 15,
          letterSpacing: 0.5,
        }}
      >
        {label}
      </div>

      <div
        style={{
          color: "rgba(255,255,255,0.96)",
          fontWeight: 985,
          fontSize: 20,
          letterSpacing: 0.2,
          textShadow: "0 2px 16px rgba(0,0,0,0.35)",
        }}
      >
        {value}
      </div>
    </div>
  );
}

export default function ConferenciaCaixa({ data }: { data: ConferenciaData }) {
  const quebraAbs = Math.abs(Number(data.quebra || 0));
  const dangerQuebra = quebraAbs > 5; // ✅ regra: acima de R$ 5,00 fica vermelho

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
    <CardShell
      style={{
        // ✅ borda aqua mais visível no retângulo externo principal
        border: "1px solid rgba(79,220,255,0.28)",
        boxShadow:
          "0 0 0 1px rgba(79,220,255,0.14), 0 18px 55px rgba(0,0,0,0.55)",
        transition: "all .18s ease",
      }}
    >
      {/* ✅ blur externo no CardShell ao passar o mouse */}
      <div
        style={{ borderRadius: 18 }}
        onMouseEnter={(e) => {
          const shell = (e.currentTarget.parentElement as HTMLDivElement) || null;
          if (!shell) return;
          shell.style.border = "1px solid rgba(79,220,255,0.40)";
          shell.style.boxShadow =
            "0 0 0 1px rgba(79,220,255,0.18), 0 0 34px rgba(79,220,255,0.18), 0 18px 55px rgba(0,0,0,0.58)";
          shell.style.backdropFilter = "blur(10px)";
          (shell.style as any).WebkitBackdropFilter = "blur(10px)";
        }}
        onMouseLeave={(e) => {
          const shell = (e.currentTarget.parentElement as HTMLDivElement) || null;
          if (!shell) return;
          shell.style.border = "1px solid rgba(79,220,255,0.28)";
          shell.style.boxShadow =
            "0 0 0 1px rgba(79,220,255,0.14), 0 18px 55px rgba(0,0,0,0.55)";
          shell.style.backdropFilter = "none";
          (shell.style as any).WebkitBackdropFilter = "none";
        }}
      >
        <SectionTitle
          // ✅ aumenta fonte do título "Conferência de Caixa"
          title={<span style={{ fontSize: 16, fontWeight: 980 }}>Conferência de Caixa</span> as any}
          right={
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
                transition: "all .18s ease",
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLDivElement;
                // ✅ somente blur externo no hover (status)
                el.style.boxShadow = `0 0 28px ${statusPalette.glow}`;
                el.style.backdropFilter = "blur(14px)";
                (el.style as any).WebkitBackdropFilter = "blur(14px)";
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLDivElement;
                el.style.boxShadow = `0 0 22px ${statusPalette.glow}`;
                el.style.backdropFilter = "blur(10px)";
                (el.style as any).WebkitBackdropFilter = "blur(10px)";
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
          }
        />

        <div style={{ padding: "0 16px 16px 16px", display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 10 }}>
            <MiniStat label="Caixa inicial" value={fmtBRL(data.caixaInicial)} tone="blue" />
            <MiniStat label="Entradas (dinheiro)" value={fmtBRL(data.entradasDinheiro)} tone="green" />
            <MiniStat label="Saídas" value={fmtBRL(data.saidas)} tone="red" />
          </div>

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
              transition: "all .18s ease",
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLDivElement;
              el.style.border = "1px solid rgba(79,220,255,0.32)";
              el.style.boxShadow =
                "0 0 0 1px rgba(79,220,255,0.14) inset, 0 0 40px rgba(79,220,255,0.18), 0 18px 55px rgba(0,0,0,0.56)";
              el.style.backdropFilter = "blur(16px)";
              (el.style as any).WebkitBackdropFilter = "blur(16px)";
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLDivElement;
              el.style.border = "1px solid rgba(79,220,255,0.18)";
              el.style.boxShadow =
                "0 0 0 1px rgba(79,220,255,0.10) inset, 0 0 32px rgba(79,220,255,0.12), 0 18px 55px rgba(0,0,0,0.52)";
              el.style.backdropFilter = "blur(12px)";
              (el.style as any).WebkitBackdropFilter = "blur(12px)";
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: -2,
                borderRadius: 20,
                background:
                  "radial-gradient(110% 80% at 25% 0%, rgba(79,220,255,0.12), rgba(0,0,0,0) 62%)",
                pointerEvents: "none",
              }}
            />

            <div style={{ position: "relative" }}>
              <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                <div>
                  <div style={{ color: "rgb(255, 255, 255)", fontWeight: 950, fontSize: 15, letterSpacing: 0.5 }}>
                    Caixa final
                  </div>
                  <div style={{ marginTop: 10, color: "rgba(255,255,255,0.98)", fontWeight: 990, fontSize: 30, letterSpacing: 0.2 }}>
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
                    transition: "all .18s ease",
                  }}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget as HTMLDivElement;
                    // ✅ somente blur externo no hover (quebra)
                    el.style.boxShadow = `0 0 28px ${quebraPalette.glow}`;
                    el.style.backdropFilter = "blur(14px)";
                    (el.style as any).WebkitBackdropFilter = "blur(14px)";
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget as HTMLDivElement;
                    el.style.boxShadow = `0 0 22px ${quebraPalette.glow}`;
                    el.style.backdropFilter = "blur(10px)";
                    (el.style as any).WebkitBackdropFilter = "blur(10px)";
                  }}
                  title={dangerQuebra ? "Quebra de caixa acima de R$ 5,00" : "Diferença entre o caixa final e os registros"}
                >
                  Quebra:{" "}
                  <span style={{ color: quebraPalette.fg, fontWeight: 990 }}>
                    {fmtBRL(data.quebra)}
                  </span>
                </div>
              </div>

              <div style={{ marginTop: 10, color: "rgba(255,255,255,0.66)", fontWeight: 900, fontSize: 12 }}>
                {dangerQuebra
                  ? "Quebra acima de R$ 5,00 — conferir lançamentos e contadores antes de fechar."
                  : data.status === "OK"
                  ? "Caixa conferido com os registros do sistema."
                  : "Conferir lançamentos e contadores antes de fechar o dia."}
              </div>
            </div>
          </div>
        </div>
      </div>
    </CardShell>
  );
}
