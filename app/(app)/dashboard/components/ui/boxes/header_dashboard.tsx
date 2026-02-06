// app/dashboard/components/boxes/header_dashboard.tsx
"use client";

import React from "react";

export default function HeaderDashboard({
  title,
  subtitle,
  rightSlot,
}: {
  title: string;
  subtitle: string;
  rightSlot?: React.ReactNode;
}) {
  return (
    <div style={{ padding: 0, paddingBottom: 44 }}>
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 14,
          flexWrap: "wrap",
        }}
      >
        {/* ESQUERDA — título */}
        <div style={{ minWidth: 260 }}>
          <div
            style={{
              color: "rgba(255,255,255,0.96)",
              fontWeight: 980,
              fontSize: 28,
              letterSpacing: 0.2,
            }}
          >
            {title}
          </div>

          <div
            style={{
              marginTop: 6,
              color: "rgb(255, 255, 255)",
              fontWeight: 900,
              fontSize: 18,
              lineHeight: "16px",
              maxWidth: 520,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
            title={subtitle}
          >
            {subtitle}
          </div>
        </div>

        {/* DIREITA — ações */}
        {rightSlot ? (
          <div style={{ display: "flex", alignItems: "center", marginLeft: "auto" }}>
            {rightSlot}
          </div>
        ) : null}
      </div>
    </div>
  );
}
