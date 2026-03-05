"use client";

import React, { useMemo } from "react";

/**
 * CardCaixa (Conferência de Caixa) — Mobile
 * ✅ 6 campos (2 colunas):
 * - Caixa inicial / Caixa final
 * - Entradas (dinheiro) / Saídas (dinheiro)
 * - Prova real / Quebra de caixa
 *
 * Regras (se não vierem prontos):
 * - Prova real = caixa_inicial + entradas - saídas
 * - Quebra = caixa_final - prova_real
 */

const CARD_BG =
  "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))";
const CARD_INNER = "rgba(2,11,24,0.42)";
const AQUA_LINE = "rgba(79,220,255,0.18)";

type Accent = "aqua" | "green" | "yellow" | "red" | "purple";

function fmtBRL(v: number) {
  const n = Number(v) || 0;
  try {
    return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  } catch {
    return `R$ ${n.toFixed(2)}`;
  }
}

function accentRGB(accent: Accent) {
  switch (accent) {
    case "green":
      return {
        line: "rgba(80,255,160,0.35)",
        glow: "rgba(80,255,160,0.14)",
        dot: "rgba(80,255,160,0.95)",
      };
    case "yellow":
      return {
        line: "rgba(255,200,80,0.35)",
        glow: "rgba(255,200,80,0.14)",
        dot: "rgba(255,200,80,0.95)",
      };
    case "red":
      return {
        line: "rgba(255,100,120,0.35)",
        glow: "rgba(255,100,120,0.14)",
        dot: "rgba(255,100,120,0.95)",
      };
    case "purple":
      return {
        line: "rgba(160,120,255,0.35)",
        glow: "rgba(160,120,255,0.14)",
        dot: "rgba(160,120,255,0.95)",
      };
    default:
      return {
        line: "rgba(79,220,255,0.35)",
        glow: "rgba(79,220,255,0.14)",
        dot: "rgba(79,220,255,0.95)",
      };
  }
}

function Shell({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        borderRadius: 22,
        padding: 14,
        background: CARD_BG,
        border: `1px solid ${AQUA_LINE}`,
        boxShadow:
          "0 0 0 1px rgba(79,220,255,0.06) inset, 0 26px 70px rgba(0,0,0,0.42)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function GlowCard({
  accent = "aqua",
  title,
  value,
}: {
  accent?: Accent;
  title: string;
  value: string;
}) {
  const a = accentRGB(accent);

  return (
    <div
      style={{
        borderRadius: 18,
        padding: 14,
        background: CARD_INNER,
        border: `1px solid ${a.line}`,
        boxShadow: `0 0 0 1px rgba(255,255,255,0.02) inset, 0 0 26px ${a.glow}`,
        minHeight: 88,
      }}
    >
      {/* ✅ título branco */}
      <div
        style={{
          fontSize: 11,
          fontWeight: 1000,
          opacity: 1,
          color: "rgba(255,255,255,0.98)",
        }}
      >
        {title.toUpperCase()}
      </div>

      <div style={{ marginTop: 10, fontSize: 18, fontWeight: 1000 }}>
        {value}
      </div>
    </div>
  );
}

export default function CardCaixa({
  caixaInicial = 0,
  caixaFinal = 0,
  entradasDinheiro = 0,
  saidasDinheiro = 0,
  provaReal, // opcional
  quebraCaixa, // opcional
}: {
  caixaInicial?: number;
  caixaFinal?: number;
  entradasDinheiro?: number;
  saidasDinheiro?: number;
  provaReal?: number;
  quebraCaixa?: number;
}) {
  const calc = useMemo(() => {
    const ci = Number(caixaInicial) || 0;
    const cf = Number(caixaFinal) || 0;
    const ent = Number(entradasDinheiro) || 0;
    const sai = Number(saidasDinheiro) || 0;

    const pr = Number.isFinite(Number(provaReal))
      ? (Number(provaReal) as number)
      : ci + ent - sai;

    const qb = Number.isFinite(Number(quebraCaixa))
      ? (Number(quebraCaixa) as number)
      : cf - pr;

    return { ci, cf, ent, sai, pr, qb };
  }, [
    caixaInicial,
    caixaFinal,
    entradasDinheiro,
    saidasDinheiro,
    provaReal,
    quebraCaixa,
  ]);

  // ✅ regra: até R$5,00 (abs) = verde; acima = vermelho
  const quebraAccent: Accent = Math.abs(calc.qb) <= 5 ? "green" : "red";

  return (
    <Shell>
      <div style={{ fontSize: 12, fontWeight: 1000, opacity: 0.9 }}>
        Conferência de Caixa
      </div>

      <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}
        >
          <GlowCard title="Caixa inicial" value={fmtBRL(calc.ci)} accent="aqua" />
          <GlowCard title="Caixa final" value={fmtBRL(calc.cf)} accent="aqua" />
        </div>

        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}
        >
          <GlowCard
            title="Entradas (dinheiro)"
            value={fmtBRL(calc.ent)}
            accent="green"
          />
          <GlowCard
            title="Saídas (dinheiro)"
            value={fmtBRL(calc.sai)}
            accent="red"
          />
        </div>

        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}
        >
          {/* ✅ prova real com borda aqua */}
          <GlowCard title="Prova real" value={fmtBRL(calc.pr)} accent="aqua" />

          {/* ✅ quebra condicional */}
          <GlowCard
            title="Quebra de caixa"
            value={fmtBRL(calc.qb)}
            accent={quebraAccent}
          />
        </div>
      </div>
    </Shell>
  );
}