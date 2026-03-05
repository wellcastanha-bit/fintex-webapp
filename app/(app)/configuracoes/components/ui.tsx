"use client";

import React, { useState } from "react";
import { ChevronRight } from "lucide-react";

const AQUA = "rgba(79,220,255,0.45)";
const AQUA_SOFT = "rgba(79,220,255,0.22)";

function cardBg() {
  return `
    radial-gradient(1200px 320px at 15% -10%, rgba(79,220,255,0.10) 0%, rgba(79,220,255,0.04) 45%, rgba(79,220,255,0.02) 70%),
    linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.03) 22%, rgba(6,16,37,0.94) 100%)
  `;
}

function glow(on: boolean) {
  return on
    ? `0 0 0 1px rgba(79,220,255,0.22), 0 18px 60px rgba(0,0,0,0.55), 0 0 30px rgba(79,220,255,0.22)`
    : `0 0 0 1px rgba(79,220,255,0.16), 0 18px 60px rgba(0,0,0,0.55), 0 0 22px rgba(79,220,255,0.16)`;
}

export function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const [hover, setHover] = useState(false);

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        borderRadius: 18,
        padding: 18,
        border: hover
          ? "1px solid rgba(79,220,255,0.55)"
          : "1px solid rgba(79,220,255,0.32)",
        boxShadow: glow(hover),
        background: cardBg(),
        transition: "border 160ms ease, box-shadow 160ms ease",
        minWidth: 0,
      }}
    >
      <div style={{ marginBottom: 14, color: "#eaf0ff", fontWeight: 900, fontSize: 20 }}>
        {title}
      </div>
      {children}
    </div>
  );
}

export function RowButton({
  title,
  subtitle,
  Icon,
  badge,
  active,
  onClick,
}: {
  title: string;
  subtitle: string;
  Icon: any;
  badge?: string;
  active: boolean;
  onClick: () => void;
}) {
  const [hover, setHover] = useState(false);
  const on = hover || active;

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        width: "100%",
        border: on
          ? "1px solid rgba(79,220,255,0.55)"
          : "1px solid rgba(255,255,255,0.14)",
        background: `
          radial-gradient(700px 160px at 15% -10%, rgba(79,220,255,0.10) 0%, rgba(79,220,255,0.04) 45%, rgba(79,220,255,0.02) 70%),
          linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.03) 25%, rgba(6,16,37,0.94) 100%)
        `,
        boxShadow: on
          ? `inset 0 1px 0 rgba(255,255,255,0.12), 0 0 18px ${AQUA}`
          : `inset 0 1px 0 rgba(255,255,255,0.10), inset 0 -1px 0 rgba(0,0,0,0.45)`,
        borderRadius: 16,
        padding: 14,
        cursor: "pointer",
        color: "#fff",
        textAlign: "left",
        display: "flex",
        alignItems: "center",
        gap: 14,
        userSelect: "none",
        transition: "border 160ms ease, box-shadow 160ms ease",
      }}
    >
      <div
        style={{
          width: 52,
          height: 52,
          borderRadius: 16,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,255,255,0.10)",
          flex: "0 0 52px",
        }}
      >
        <Icon
          size={24}
          color={on ? "#4fdcff" : "#ffffff"}
          style={{
            filter: on
              ? `drop-shadow(0 0 6px rgba(79,220,255,0.55)) drop-shadow(0 0 14px rgba(79,220,255,0.35))`
              : "none",
            transition: "filter 160ms ease, color 160ms ease",
          }}
        />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              fontWeight: 900,
              fontSize: 18,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {title}
          </div>

          {badge && (
            <div
              style={{
                padding: "4px 10px",
                borderRadius: 999,
                border: "1px solid rgba(255,255,255,0.22)",
                background: "rgba(0,0,0,0.25)",
                fontSize: 12,
                fontWeight: 900,
                color: "#eaf0ff",
              }}
            >
              {badge}
            </div>
          )}
        </div>

        <div style={{ marginTop: 4, opacity: 0.85, fontWeight: 700, fontSize: 13, lineHeight: 1.2 }}>
          {subtitle}
        </div>
      </div>

      <ChevronRight size={20} color={on ? "#4fdcff" : "rgba(255,255,255,0.55)"} />
    </button>
  );
}

export function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ color: "#eaf0ff", fontWeight: 800, fontSize: 13, marginBottom: 8, opacity: 0.95 }}>
      {children}
    </div>
  );
}

export function Field({
  placeholder,
  value,
  onChange,
  disabled,
}: {
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  return (
    <input
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        width: "100%",
        height: 44,
        borderRadius: 12,
        border: "1px solid rgba(255,255,255,0.14)",
        background: disabled ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.08)",
        color: "#eaf0ff",
        outline: "none",
        padding: "0 12px",
        fontWeight: 800,
        fontSize: 14,
        boxSizing: "border-box",
      }}
    />
  );
}

export function Toggle({
  value,
  onChange,
  labelOn = "Ativo",
  labelOff = "Desligado",
}: {
  value: boolean;
  onChange: (v: boolean) => void;
  labelOn?: string;
  labelOff?: string;
}) {
  const on = value;

  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      style={{
        width: "100%",
        height: 44,
        borderRadius: 12,
        border: on
          ? "1px solid rgba(79,220,255,0.55)"
          : "1px solid rgba(255,255,255,0.14)",
        background: on ? "rgba(79,220,255,0.10)" : "rgba(255,255,255,0.06)",
        color: "#eaf0ff",
        fontWeight: 900,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 12px",
        boxShadow: on ? `0 0 18px ${AQUA_SOFT}` : "none",
      }}
    >
      <span style={{ opacity: 0.92 }}>{on ? labelOn : labelOff}</span>

      <span
        style={{
          width: 44,
          height: 22,
          borderRadius: 999,
          border: "1px solid rgba(255,255,255,0.14)",
          background: "rgba(0,0,0,0.25)",
          position: "relative",
          flex: "0 0 44px",
        }}
      >
        <span
          style={{
            position: "absolute",
            top: 2,
            left: on ? 22 : 2,
            width: 18,
            height: 18,
            borderRadius: 999,
            background: on ? "#4fdcff" : "rgba(255,255,255,0.55)",
            boxShadow: on ? "0 0 10px rgba(79,220,255,0.55)" : "none",
            transition: "left 160ms ease, background 160ms ease, box-shadow 160ms ease",
          }}
        />
      </span>
    </button>
  );
}

/** ✅ ADICIONADO: SmallBtn (resolve "Export SmallBtn doesn't exist") */
export function SmallBtn({
  children,
  onClick,
  danger,
}: {
  children: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
}) {
  const [hover, setHover] = useState(false);

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        height: 40,
        padding: "0 12px",
        borderRadius: 12,
        border: danger
          ? "1px solid rgba(255,80,80,0.30)"
          : hover
          ? "1px solid rgba(79,220,255,0.55)"
          : "1px solid rgba(255,255,255,0.14)",
        background: "rgba(255,255,255,0.06)",
        color: "#eaf0ff",
        fontWeight: 900,
        cursor: "pointer",
        boxShadow: hover ? `0 0 18px rgba(79,220,255,0.22)` : "none",
        transition: "border 160ms ease, box-shadow 160ms ease",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </button>
  );
}
