// app/reservas/components/ui.tsx
"use client";

import React, { useMemo, useState } from "react";
import { AQUA, PAGE_BG, brToISO, pad2 } from "./utils";

/* =========================
   SMALL UI PRIMITIVES
========================= */
export function CardShell({
  title,
  children,
  style,
}: {
  title: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  const [hoverCard, setHoverCard] = useState(false);

  return (
    <div
      onMouseEnter={() => setHoverCard(true)}
      onMouseLeave={() => setHoverCard(false)}
      style={{
        borderRadius: 18,
        padding: 18,
        border: hoverCard ? "1px solid rgba(79,220,255,0.55)" : "1px solid rgba(79,220,255,0.32)",
        boxShadow: hoverCard
          ? `0 0 0 1px rgba(79,220,255,0.18), 0 18px 60px rgba(0,0,0,0.55), 0 0 28px rgba(79,220,255,0.22)`
          : `0 18px 60px rgba(0,0,0,0.55)`,
        background: `
          radial-gradient(1200px 320px at 15% -10%, rgba(79,220,255,0.10) 0%, rgba(79,220,255,0.04) 45%, rgba(79,220,255,0.02) 70%),
          ${PAGE_BG}
        `,
        transition: "border 160ms ease, box-shadow 160ms ease",
        ...style,
      }}
    >
      <div style={{ marginBottom: 14, color: AQUA, fontWeight: 900, fontSize: 20 }}>{title}</div>
      {children}
    </div>
  );
}

export function FieldLabel({ children }: { children?: React.ReactNode }) {
  return <div style={{ color: "#eaf0ff", fontWeight: 800, fontSize: 13, marginBottom: 8, opacity: 0.95 }}>{children}</div>;
}

export function FieldShell({ children }: { children: React.ReactNode }) {
  const [hover, setHover] = useState(false);
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        height: 54,
        borderRadius: 16,
        padding: "0 14px",
        display: "flex",
        alignItems: "center",
        border: hover ? "1px solid rgba(79,220,255,0.55)" : "1px solid rgba(255,255,255,0.14)",
        boxShadow: hover
          ? `inset 0 1px 0 rgba(255,255,255,0.12), 0 0 18px rgba(79,220,255,0.35)`
          : `inset 0 1px 0 rgba(255,255,255,0.10), inset 0 -1px 0 rgba(0,0,0,0.45)`,
        background: "linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.04) 25%, rgba(6,16,37,0.95) 100%)",
        transition: "border 160ms ease, box-shadow 160ms ease",
        boxSizing: "border-box",
      }}
    >
      {children}
    </div>
  );
}

export function Input({
  value,
  onChange,
  placeholder,
  type = "text",
  inputMode,
  align = "left",
  filled,
  onBlur,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  align?: "left" | "right" | "center";
  filled?: boolean;
  onBlur?: () => void;
}) {
  const isFilled = filled ?? !!value?.trim();
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      placeholder={placeholder}
      type={type}
      inputMode={inputMode}
      style={{
        width: "100%",
        height: 44,
        background: "transparent",
        border: "none",
        outline: "none",
        color: "#ffffff",
        fontSize: 18,
        fontWeight: isFilled ? 900 : 800,
        textAlign: align,
        opacity: isFilled ? 1 : 0.92,
      }}
    />
  );
}

export function AquaButton({
  children,
  onClick,
  full = false,
  disabled = false,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  full?: boolean;
  disabled?: boolean;
}) {
  const [hover, setHover] = useState(false);

  const borderColor = hover ? "rgba(75,212,246,0.85)" : "rgba(75,212,246,0.55)";
  const glowColor = "rgba(75,212,246,0.55)";

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onPointerDown={(e) => (e.currentTarget.style.transform = "scale(0.98)")}
      onPointerUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
      onPointerLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
      onPointerCancel={(e) => (e.currentTarget.style.transform = "scale(1)")}
      onMouseDown={(e) => e.preventDefault()}
      style={{
        height: 54,
        width: full ? "100%" : "auto",
        borderRadius: 16,
        padding: "0 18px",
        border: `1px solid ${borderColor}`,
        boxShadow: hover
          ? `inset 0 1px 0 rgba(255,255,255,0.14), 0 0 18px ${glowColor}, 0 0 32px ${glowColor}`
          : `inset 0 1px 0 rgba(255,255,255,0.10), inset 0 -1px 0 rgba(0,0,0,0.45)`,
        transition: "border 160ms ease, box-shadow 160ms ease, transform 90ms ease, opacity 160ms ease",
        background: "linear-gradient(0deg, rgba(75,212,246,0.58) 0%, rgba(255,255,255,0.04) 55%, rgba(255,255,255,0.02) 100%)",
        color: "#fff",
        fontWeight: 900,
        fontSize: 16,
        cursor: disabled ? "not-allowed" : "pointer",
        userSelect: "none",
        WebkitTapHighlightColor: "transparent",
        opacity: disabled ? 0.55 : 1,
      }}
    >
      {children}
    </button>
  );
}

export function MiniButton({
  children,
  onClick,
  tone = "aqua",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  tone?: "aqua" | "red" | "neutral";
}) {
  const [h, setH] = useState(false);
  const tint =
    tone === "red"
      ? { b: "rgba(225,11,11,0.55)", g: "rgba(225,11,11,0.35)" }
      : tone === "aqua"
      ? { b: "rgba(79,220,255,0.55)", g: "rgba(79,220,255,0.30)" }
      : { b: "rgba(255,255,255,0.18)", g: "rgba(255,255,255,0.10)" };

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      onMouseDown={(e) => e.preventDefault()}
      style={{
        height: 34,
        padding: "0 12px",
        borderRadius: 12,
        border: `1px solid ${h ? tint.b : "rgba(255,255,255,0.14)"}`,
        background: "rgba(255,255,255,0.06)",
        color: "#fff",
        fontWeight: 900,
        cursor: "pointer",
        boxShadow: h ? `0 0 18px ${tint.g}` : "none",
        transition: "border 160ms ease, box-shadow 160ms ease, transform 90ms ease",
      }}
    >
      {children}
    </button>
  );
}

/* =========================
   TIME PICKER (SELECT)
   ✅ padrão fixo 30m (sem seletor)
========================= */
function buildTimeOptions(stepMinutes = 30, start = "10:00", end = "23:30") {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  const startMin = sh * 60 + sm;
  const endMin = eh * 60 + em;

  const out: string[] = [];
  for (let t = startMin; t <= endMin; t += stepMinutes) {
    const h = Math.floor(t / 60);
    const m = t % 60;
    out.push(`${pad2(h)}:${pad2(m)}`);
  }
  return out;
}

export function TimeSelect({
  value,
  onChange,
  allowEmpty = false,
}: {
  value: string;
  onChange: (v: string) => void;
  allowEmpty?: boolean;
}) {
  const options = useMemo(() => buildTimeOptions(30, "10:00", "23:30"), []);

  return (
    <div style={{ width: "100%", height: 44, display: "flex", alignItems: "center" }}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: "100%",
          height: 44,
          border: "none",
          outline: "none",
          background: "transparent",
          color: "#fff",
          fontSize: 18,
          fontWeight: 900,
          appearance: "none",
          WebkitAppearance: "none",
          paddingRight: 26,
          cursor: "pointer",
        }}
      >
        {allowEmpty && (
          <option value="" style={{ background: "#061025", color: "#fff" }}>
            —
          </option>
        )}
        {options.map((t) => (
          <option key={t} value={t} style={{ background: "#061025", color: "#fff" }}>
            {t}
          </option>
        ))}
      </select>

      <div
        style={{
          marginLeft: -22,
          pointerEvents: "none",
          color: "rgba(234,240,255,0.85)",
          fontWeight: 900,
          fontSize: 14,
        }}
      >
        ▾
      </div>
    </div>
  );
}

/* (export pra manter o mesmo uso do campo selecionado) */
export { brToISO };
