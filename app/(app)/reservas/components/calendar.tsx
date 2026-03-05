"use client";

import React, { useState } from "react";
import { AQUA_DAY_BG, toISODate } from "./utils";

export function MonthCalendar({
  monthDate,
  selectedISO,
  onSelectISO,
  hasReservaByDay,
}: {
  monthDate: Date;
  selectedISO: string;
  onSelectISO: (iso: string) => void;
  hasReservaByDay: Record<string, boolean>;
}) {
  const y = monthDate.getFullYear();
  const m = monthDate.getMonth();

  const first = new Date(y, m, 1);
  const last = new Date(y, m + 1, 0);

  const startWeekday = first.getDay(); // 0=Dom
  const totalDays = last.getDate();

  const days: (string | null)[] = [];
  for (let i = 0; i < startWeekday; i++) days.push(null);
  for (let d = 1; d <= totalDays; d++) {
    const iso = toISODate(new Date(y, m, d));
    days.push(iso);
  }
  while (days.length % 7 !== 0) days.push(null);

  const [hoverCell, setHoverCell] = useState<string | null>(null);
  const week = ["D", "S", "T", "Q", "Q", "S", "S"];

  return (
    <div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: 10,
          marginBottom: 10,
          color: "#eaf0ff",
          fontWeight: 900,
          fontSize: 12,
          opacity: 0.9,
          userSelect: "none",
        }}
      >
        {week.map((w, i) => (
          <div key={`${w}-${i}`} style={{ textAlign: "center" }}>
            {w}
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 10 }}>
        {days.map((iso, i) => {
          if (!iso) return <div key={`e-${i}`} style={{ height: 44 }} />;

          const d = Number(iso.slice(-2));
          const active = iso === selectedISO;
          const hovered = hoverCell === iso;
          const hasReserva = !!hasReservaByDay[iso];

          // ✅ AQUI: marcação só por reserva (igual foto), sem badge
          const border = hasReserva
            ? "1px solid rgba(79,220,255,0.70)"
            : active || hovered
            ? "1px solid rgba(79,220,255,0.55)"
            : "1px solid rgba(255,255,255,0.10)";

          const bg = hasReserva
            ? AQUA_DAY_BG
            : active
            ? "rgba(79,220,255,0.10)"
            : "rgba(255,255,255,0.04)";

          const shadow = hasReserva
            ? "0 0 18px rgba(79,220,255,0.22)"
            : hovered
            ? "0 0 14px rgba(79,220,255,0.16)"
            : active
            ? "0 0 0 1px rgba(79,220,255,0.18)"
            : "none";

          return (
            <div
              key={iso}
              onMouseEnter={() => setHoverCell(iso)}
              onMouseLeave={() => setHoverCell((cur) => (cur === iso ? null : cur))}
              onClick={() => onSelectISO(iso)}
              style={{
                height: 44,
                borderRadius: 14,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                userSelect: "none",
                border,
                boxShadow: shadow,
                color: "#ffffff",
                fontWeight: 900,
                background: bg,
                transition: "border 160ms ease, box-shadow 160ms ease, background 160ms ease",
              }}
              title={hasReserva ? "Dia com reserva(s)" : "Sem reservas"}
            >
              {d}
            </div>
          );
        })}
      </div>
    </div>
  );
}
