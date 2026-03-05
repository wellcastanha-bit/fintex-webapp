// app/dashboard/components/ui/card_shell.tsx
"use client";

import React from "react";

export function CardShell({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        borderRadius: 18,
        border: "1px solid rgba(79,220,255,0.16)",
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))",
        boxShadow:
          "0 0 0 1px rgba(79,220,255,0.08), 0 18px 55px rgba(0,0,0,0.55)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function SectionTitle({
  title,
  right,
}: {
  title: string;
  right?: React.ReactNode;
}) {
  return (
    <div
      style={{
        padding: "14px 16px 10px 16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
      }}
    >
      <div
        style={{
          color: "rgba(255,255,255,0.92)",
          fontWeight: 950,
          fontSize: 13,
        }}
      >
        {title}
      </div>
      {right ? <div>{right}</div> : null}
    </div>
  );
}

export function fmtBRL(v: any) {
  const n =
    typeof v === "number"
      ? v
      : Number(String(v ?? "").replace(/\./g, "").replace(",", "."));
  const safe = Number.isFinite(n) ? n : 0;
  return safe.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}


export function pct(v: number) {
  return `${v.toFixed(1).replace(".", ",")}%`;
}
