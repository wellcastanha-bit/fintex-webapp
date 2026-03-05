import React from "react";

export const AQUA = "rgba(79,220,255,0.45)";
export const AQUA_SOFT = "rgba(79,220,255,0.22)";

export const GREEN = "rgba(14,212,63,0.55)";
export const GREEN_SOFT = "rgba(14,212,63,0.22)";
export const RED = "rgba(225,11,11,0.55)";
export const RED_SOFT = "rgba(225,11,11,0.22)";

export function glowBox(on: boolean) {
  return on
    ? `0 20px 55px rgba(0,0,0,0.60), 0 1px 0 rgba(255,255,255,0.08), 0 0 26px ${AQUA}`
    : `0 20px 55px rgba(0,0,0,0.60), 0 1px 0 rgba(255,255,255,0.08), 0 0 18px ${AQUA_SOFT}`;
}

export const headerFieldStyle = (hover: boolean, totalW: number): React.CSSProperties => {
  const borderColor = hover ? "rgba(75,212,246,0.85)" : "rgba(75,212,246,0.55)";
  return {
    width: totalW + 6,
    height: 58,
    borderRadius: 0,
    overflow: "hidden",
    position: "sticky",
    top: 0,
    zIndex: 6,
    borderTop: `1px solid ${borderColor}`,
    borderLeft: `1px solid ${borderColor}`,
    borderRight: `1px solid ${borderColor}`,
    borderBottom: "0px solid transparent",
    transition: "border 160ms ease, box-shadow 160ms ease",
    userSelect: "none",
    WebkitTapHighlightColor: "transparent",
    background: `
      linear-gradient(
        180deg,
        #115869 0%,
        #1b5d6d 40%,
        #3590a7 100%
      )
    `,
  };
};

export const Arrow = ({ tint = "aqua" }: { tint?: "aqua" | "red" | "green" }) => {
  const col =
    tint === "green"
      ? "rgba(14,212,63,0.95)"
      : tint === "red"
      ? "rgba(225,11,11,0.95)"
      : "rgba(79,220,255,0.95)";
  const glow =
    tint === "green"
      ? "0 0 16px rgba(14,212,63,0.35)"
      : tint === "red"
      ? "0 0 16px rgba(225,11,11,0.35)"
      : "0 0 16px rgba(79,220,255,0.35)";
  return (
    <span
      aria-hidden
      style={{
        marginLeft: 8,
        fontSize: 12,
        fontWeight: 900,
        color: col,
        textShadow: glow,
        opacity: 0.95,
        lineHeight: "12px",
      }}
      title="Editável"
    >
      ▾
    </span>
  );
};

/**
 * RESPONSÁVEL (ex: Motoboy 01)
 * Mantém o “look” com azul embaixo, mas tira a sombra pesada
 */
export const fintexSelectStyleBase: React.CSSProperties = {
  width: "100%",
  height: 38,
  borderRadius: 999,
  border: "2px solid rgba(79,220,255,0.35)",
  background: "linear-gradient(180deg, #ffffff 0%, #ffffff 55%, #37a7c2 100%)",
  color: "#0b2c4a",
  fontWeight: 900,
  fontSize: 15,
  textAlign: "center",
  outline: "none",
  cursor: "pointer",
  padding: "0 28px 0 14px",
  appearance: "none",
  WebkitAppearance: "none",
  MozAppearance: "none",
  boxShadow: "0 0 12px rgba(79,220,255,0.18)", // leve (sem sombra preta)
};

export const optionStyle: React.CSSProperties = {
  background: "#061025",
  color: "#eaf0ff",
  fontWeight: 900,
};

export function statusTint(statusRaw: any): "red" | "green" | "aqua" {
  const s = (statusRaw ?? "").toString().trim().toUpperCase();
  if (s === "ENTREGUE") return "green";
  if (s === "FATIAS DE PIZZA") return "aqua";
  return "red";
}

/**
 * STATUS (ENTREGUE / PRODUÇÃO / FATIAS)
 * Flat igual, com glow só da cor do status
 */
export function pillStyle(tint: "red" | "green" | "aqua", hover: boolean): React.CSSProperties {
  const border =
    tint === "green"
      ? hover
        ? "rgba(14,212,63,0.85)"
        : "rgba(14,212,63,0.60)"
      : tint === "red"
      ? hover
        ? "rgba(225,11,11,0.85)"
        : "rgba(225,11,11,0.60)"
      : hover
      ? "rgba(79,220,255,0.85)"
      : "rgba(79,220,255,0.60)";

  const glow =
    tint === "green"
      ? hover
        ? "0 0 22px rgba(14,212,63,0.35)"
        : "0 0 14px rgba(14,212,63,0.22)"
      : tint === "red"
      ? hover
        ? "0 0 22px rgba(225,11,11,0.30)"
        : "0 0 14px rgba(225,11,11,0.18)"
      : hover
      ? "0 0 22px rgba(79,220,255,0.32)"
      : "0 0 14px rgba(79,220,255,0.20)";

  // ✅ background condicional (não cobre o glow)
  const bg =
    tint === "green"
      ? "linear-gradient(180deg, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.92) 30%, rgba(0, 255, 64, 0.3) 100%)"
      : tint === "red"
      ? "linear-gradient(180deg, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.92) 30%, rgba(255, 0, 0, 0.3) 100%)"
      : "linear-gradient(180deg, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.92) 30%, rgba(0, 204, 255, 0.5) 100%)";

  return {
    width: "100%",
    height: 38,
    borderRadius: 999,
    border: `2px solid ${border}`,
    background: bg,
    color: "#0b2c4a",
    fontWeight: 900,
    fontSize: 13,
    textAlign: "center",
    outline: "none",
    cursor: "pointer",
    padding: "0 32px 0 14px",
    appearance: "none",
    WebkitAppearance: "none",
    MozAppearance: "none",
    boxShadow: glow,
  };
}

/**
 * ⚠️ IMPORTANTE:
 * Removi `color: "#fff"` daqui para NÃO sobrescrever as cores do pillStyle/fintexSelect.
 */
export const selectCommon: React.CSSProperties = {
  width: "100%",
  height: 38,
  borderRadius: 999,
  fontWeight: 900,
  fontSize: 12,
  textAlign: "center",
  outline: "none",
  cursor: "pointer",
  padding: "0 32px 0 14px",
  appearance: "none",
  WebkitAppearance: "none",
  MozAppearance: "none",
  backgroundClip: "padding-box",
};

export const Stat = ({ label, value }: { label: string; value: string }) => (
  <div
    style={{
      height: 40,
      padding: "0 12px",
      borderRadius: 10,
      border: "1px solid rgba(79,220,255,0.30)",
      background: `
        radial-gradient(700px 160px at 15% -10%, rgba(79,220,255,0.10) 0%, rgba(79,220,255,0.04) 45%, rgba(79,220,255,0.02) 70%),
        linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.03) 25%, rgba(6,16,37,0.94) 100%)
      `,
      color: "#fff",
      fontWeight: 900,
      display: "flex",
      alignItems: "center",
      gap: 10,
      boxShadow: "0 10px 22px rgba(0,0,0,0.18), 0 0 16px rgba(79,220,255,0.16)",
      userSelect: "none",
      whiteSpace: "nowrap",
    }}
    title={label}
  >
    <span style={{ fontSize: 12, opacity: 0.9 }}>{label}</span>
    <span style={{ fontSize: 14 }}>{value}</span>
  </div>
);