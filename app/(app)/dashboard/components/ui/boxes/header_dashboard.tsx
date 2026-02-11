// app/dashboard/components/boxes/header_dashboard.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

/* =========================================================
   HeaderDashboard (FINtEX)
   ✅ Centro REAL: seletor de datas fica NO MEIO entre ESQ e DIR
   ✅ Não empurra pro lado direito
   ✅ Agora: emite onDateChange com payload pronto pro /api/dashboard
========================================================= */

type PresetKey =
  | "hoje"
  | "ontem"
  | "ultimos_7"
  | "ultimos_30"
  | "mes_anterior"
  | "esse_mes"
  | "uma_data"
  | "um_periodo";

type DateSelection = {
  preset: PresetKey;
  startISO: string; // YYYY-MM-DD (inclusive)
  endISO: string; // YYYY-MM-DD (inclusive)
};

// ✅ payload pronto pro backend
export type DashboardQuery =
  | { kind: "period"; period: "hoje" | "ontem" | "ultimos_7" | "ultimos_30" | "mes_anterior" | "esse_mes" }
  | { kind: "date"; date: string } // YYYY-MM-DD
  | { kind: "range"; start: string; end: string }; // YYYY-MM-DD (inclusive)

function pad2(n: number) {
  return String(n).padStart(2, "0");
}
function toISODate(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}
function fromISODate(iso: string) {
  const [y, m, dd] = iso.split("-").map(Number);
  return new Date(y, (m || 1) - 1, dd || 1);
}
function addDays(d: Date, days: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}
function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function endOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}
function addMonths(d: Date, months: number) {
  return new Date(d.getFullYear(), d.getMonth() + months, 1);
}
function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
function clampISOOrder(aISO: string, bISO: string) {
  if (!aISO || !bISO) return { startISO: aISO, endISO: bISO };
  return aISO <= bISO ? { startISO: aISO, endISO: bISO } : { startISO: bISO, endISO: aISO };
}
function formatBR(iso: string) {
  const d = fromISODate(iso);
  return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`;
}
function monthLabel(d: Date) {
  const meses = [
    "janeiro",
    "fevereiro",
    "março",
    "abril",
    "maio",
    "junho",
    "julho",
    "agosto",
    "setembro",
    "outubro",
    "novembro",
    "dezembro",
  ];
  return `${meses[d.getMonth()]} de ${d.getFullYear()}`;
}

function computePreset(preset: PresetKey, now = new Date()): DateSelection {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (preset === "hoje") {
    const iso = toISODate(today);
    return { preset, startISO: iso, endISO: iso };
  }
  if (preset === "ontem") {
    const d = addDays(today, -1);
    const iso = toISODate(d);
    return { preset, startISO: iso, endISO: iso };
  }
  if (preset === "ultimos_7") {
    const end = today;
    const start = addDays(today, -6);
    return { preset, startISO: toISODate(start), endISO: toISODate(end) };
  }
  if (preset === "ultimos_30") {
    const end = today;
    const start = addDays(today, -29);
    return { preset, startISO: toISODate(start), endISO: toISODate(end) };
  }
  if (preset === "esse_mes") {
    const s = startOfMonth(today);
    const e = endOfMonth(today);
    return { preset, startISO: toISODate(s), endISO: toISODate(e) };
  }
  if (preset === "mes_anterior") {
    const prev = addMonths(today, -1);
    const s = startOfMonth(prev);
    const e = endOfMonth(prev);
    return { preset, startISO: toISODate(s), endISO: toISODate(e) };
  }
  const iso = toISODate(today);
  return { preset: "uma_data", startISO: iso, endISO: iso };
}

// ✅ converte seleção do UI para "query" pro /api/dashboard
function selectionToQuery(sel: DateSelection): DashboardQuery {
  const p = sel.preset;
  if (p === "uma_data") return { kind: "date", date: sel.startISO };
  if (p === "um_periodo") {
    const ordered = clampISOOrder(sel.startISO, sel.endISO);
    return { kind: "range", start: ordered.startISO, end: ordered.endISO };
  }
  return { kind: "period", period: p };
}

// ✅ monta a querystring final
export function buildDashboardQS(q: DashboardQuery) {
  if (q.kind === "period") return `period=${encodeURIComponent(q.period)}`;
  if (q.kind === "date") return `date=${encodeURIComponent(q.date)}`;
  return `start=${encodeURIComponent(q.start)}&end=${encodeURIComponent(q.end)}`;
}

/* =========================
   Calendar
========================= */
function MonthGrid({
  monthBase,
  mode,
  startISO,
  endISO,
  onPick,
}: {
  monthBase: Date;
  mode: "single" | "range";
  startISO: string;
  endISO: string;
  onPick: (iso: string) => void;
}) {
  const base = startOfMonth(monthBase);
  const firstDay = new Date(base.getFullYear(), base.getMonth(), 1);
  const lastDay = endOfMonth(base);

  const leading = firstDay.getDay(); // 0..6
  const totalDays = lastDay.getDate();

  const cells: Array<{ iso: string; date: Date; inMonth: boolean }> = [];

  for (let i = 0; i < leading; i++) {
    const d = addDays(firstDay, -(leading - i));
    cells.push({ iso: toISODate(d), date: d, inMonth: false });
  }
  for (let day = 1; day <= totalDays; day++) {
    const d = new Date(base.getFullYear(), base.getMonth(), day);
    cells.push({ iso: toISODate(d), date: d, inMonth: true });
  }
  while (cells.length % 7 !== 0) {
    const last = cells[cells.length - 1]?.date || lastDay;
    const nd = addDays(last, 1);
    cells.push({ iso: toISODate(nd), date: nd, inMonth: false });
  }

  const isInRange = (iso: string) => {
    if (!startISO || !endISO) return false;
    return iso >= startISO && iso <= endISO;
  };
  const isEdge = (iso: string) => {
    if (!startISO) return false;
    if (mode === "single") return iso === startISO;
    return iso === startISO || iso === endISO;
  };

  return (
    <div style={{ padding: 12, minWidth: 260 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6, marginTop: 10 }}>
        {["dom", "seg", "ter", "qua", "qui", "sex", "sab"].map((w) => (
          <div
            key={w}
            style={{
              color: "rgba(255,255,255,0.55)",
              fontWeight: 900,
              fontSize: 11,
              textAlign: "center",
              padding: "2px 0",
            }}
          >
            {w}
          </div>
        ))}

        {cells.map((c, i) => {
          const inRange = mode === "range" ? isInRange(c.iso) : false;
          const edge = isEdge(c.iso);
          const muted = !c.inMonth;

          const today = new Date();
          const isToday = isSameDay(c.date, new Date(today.getFullYear(), today.getMonth(), today.getDate()));

          const bg = edge ? "rgba(79,220,255,0.26)" : inRange ? "rgba(79,220,255,0.12)" : "transparent";

          const bd = edge
            ? "1px solid rgba(79,220,255,0.55)"
            : isToday
            ? "1px solid rgba(255,255,255,0.18)"
            : "1px solid rgba(255,255,255,0.00)";

          const color = muted ? "rgba(255,255,255,0.30)" : "rgba(255,255,255,0.86)";

          return (
            <button
              key={c.iso + i}
              onClick={() => c.inMonth && onPick(c.iso)}
              disabled={!c.inMonth}
              style={{
                height: 32,
                borderRadius: 10,
                border: bd,
                background: bg,
                color,
                fontWeight: edge ? 980 : 900,
                fontSize: 12,
                cursor: c.inMonth ? "pointer" : "default",
                outline: "none",
                boxShadow: edge ? "0 0 18px rgba(79,220,255,0.18)" : "none",
                transition: "180ms ease",
              }}
              onMouseEnter={(e) => {
                if (!c.inMonth) return;
                const el = e.currentTarget;
                if (!edge) {
                  el.style.border = "1px solid rgba(79,220,255,0.32)";
                  el.style.background = "rgba(79,220,255,0.10)";
                }
              }}
              onMouseLeave={(e) => {
                if (!c.inMonth) return;
                const el = e.currentTarget;
                el.style.border = bd;
                el.style.background = bg;
              }}
            >
              {c.date.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* =========================
   DatePicker Fintex
========================= */
function DatePickerFintex({
  value,
  onChange,
}: {
  value: DateSelection;
  onChange: (next: DateSelection) => void;
}) {
  const TRIGGER_H = 55;
  const DROPDOWN_GAP = 40;
  const DROPDOWN_W = 620;

  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"presets" | "single" | "range">("presets");

  const [rangeDraftStart, setRangeDraftStart] = useState<string>("");
  const [rangeDraftEnd, setRangeDraftEnd] = useState<string>("");

  const anchorRef = useRef<HTMLDivElement | null>(null);

  const now = new Date();
  const [m1, setM1] = useState<Date>(() => startOfMonth(now));
  const [m2, setM2] = useState<Date>(() => startOfMonth(addMonths(now, 1)));

  useEffect(() => {
    const onDoc = (ev: MouseEvent) => {
      const t = ev.target as any;
      if (!anchorRef.current) return;
      if (anchorRef.current.contains(t)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const labelText = useMemo(() => {
    if (value.preset === "uma_data") return formatBR(value.startISO);
    if (value.preset === "um_periodo") return `${formatBR(value.startISO)} - ${formatBR(value.endISO)}`;

    const map: Record<PresetKey, string> = {
      hoje: "hoje",
      ontem: "ontem",
      ultimos_7: "últimos 7 dias",
      ultimos_30: "últimos 30 dias",
      mes_anterior: "mês anterior",
      esse_mes: "esse mês",
      uma_data: "uma data",
      um_periodo: "um período",
    };
    return map[value.preset];
  }, [value]);

  const presets: Array<{ key: PresetKey; label: string }> = [
    { key: "hoje", label: "hoje" },
    { key: "ontem", label: "ontem" },
    { key: "ultimos_7", label: "últimos 7 dias" },
    { key: "ultimos_30", label: "últimos 30 dias" },
    { key: "mes_anterior", label: "mês anterior" },
    { key: "esse_mes", label: "esse mês" },
    { key: "uma_data", label: "uma data" },
    { key: "um_periodo", label: "um período" },
  ];

  const openPresets = () => {
    setStep("presets");
    setOpen(true);
  };

  const applyPreset = (k: PresetKey) => {
    if (k === "uma_data") {
      setStep("single");
      setOpen(true);
      return;
    }
    if (k === "um_periodo") {
      setStep("range");
      setOpen(true);
      const s = value.startISO || toISODate(new Date());
      const e = value.endISO || s;
      setRangeDraftStart(s);
      setRangeDraftEnd(e);
      return;
    }
    const next = computePreset(k);
    onChange(next);
    setOpen(false);
  };

  const applySingle = (iso: string) => {
    onChange({ preset: "uma_data", startISO: iso, endISO: iso });
    setOpen(false);
  };

  const pickRange = (iso: string) => {
    if (!rangeDraftStart || (rangeDraftStart && rangeDraftEnd)) {
      setRangeDraftStart(iso);
      setRangeDraftEnd("");
      return;
    }
    const ordered = clampISOOrder(rangeDraftStart, iso);
    setRangeDraftStart(ordered.startISO);
    setRangeDraftEnd(ordered.endISO);
  };

  const applyRange = () => {
    if (!rangeDraftStart || !rangeDraftEnd) return;
    const ordered = clampISOOrder(rangeDraftStart, rangeDraftEnd);
    onChange({ preset: "um_periodo", startISO: ordered.startISO, endISO: ordered.endISO });
    setOpen(false);
  };

  const shellBd = open ? "rgba(79,220,255,0.42)" : "rgba(79,220,255,0.26)";

  return (
    <div ref={anchorRef} style={{ position: "relative", minWidth: 250, maxWidth: 300, width: "100%" }}>
      <div style={{ color: "rgb(255, 255, 255)", fontWeight: 900, fontSize: 18, marginBottom: 6 }}>
        Selecione um Período:
      </div>

      <button
        type="button"
        onClick={() => (open ? setOpen(false) : openPresets())}
        style={{
          width: "100%",
          height: TRIGGER_H,
          borderRadius: 14,
          padding: "0 38px 0 12px",
          border: `1px solid ${shellBd}`,
          outline: "none",
          background: "rgba(0,0,0,0.22)",
          color: "rgba(255,255,255,0.92)",
          fontWeight: 950,
          cursor: "pointer",
          textAlign: "left",
          boxShadow: open
            ? "0 0 0 1px rgba(79,220,255,0.12), 0 0 26px rgba(79,220,255,0.18)"
            : "0 0 0 1px rgba(79,220,255,0.06)",
          transition: "180ms ease",
          position: "relative",
        }}
        onMouseEnter={(e) => {
          const el = e.currentTarget;
          if (!open) el.style.border = "1px solid rgba(79,220,255,0.34)";
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget;
          if (!open) el.style.border = `1px solid ${shellBd}`;
        }}
      >
        <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 18, fontWeight: 950 }}>{labelText}</span>
        </span>

        <span
          style={{
            position: "absolute",
            right: 12,
            top: "50%",
            transform: "translateY(-50%)",
            color: "rgba(255,255,255,0.70)",
            fontWeight: 950,
            fontSize: 14,
          }}
        >
          ▾
        </span>
      </button>

      {open ? (
        <div
          style={{
            position: "absolute",
            top: TRIGGER_H + DROPDOWN_GAP,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 50,
            width: DROPDOWN_W,
            maxWidth: "min(920px, 92vw)",
            borderRadius: 18,
            border: "1px solid rgba(79,220,255,0.26)",
            background:
              "radial-gradient(900px 260px at 20% 0%, rgba(79,220,255,0.20), rgba(0,0,0,0) 58%), linear-gradient(180deg, rgba(255,255,255,0.06), rgba(0,0,0,0.26))",
            boxShadow:
              "0 0 0 1px rgba(79,220,255,0.10), 0 0 34px rgba(79,220,255,0.14), 0 18px 60px rgba(0,0,0,0.62)",
            overflow: "hidden",
            backdropFilter: "blur(14px)",
            WebkitBackdropFilter: "blur(14px)",
          }}
        >
          {step === "presets" ? (
            <div style={{ padding: 12 }}>
              <div
                style={{
                  borderRadius: 16,
                  border: "1px solid rgba(255,255,255,0.10)",
                  background: "rgba(0,0,0,0.14)",
                  overflow: "hidden",
                }}
              >
                {presets.map((p) => {
                  const active = value.preset === p.key;
                  return (
                    <button
                      key={p.key}
                      type="button"
                      onClick={() => applyPreset(p.key)}
                      style={{
                        width: "100%",
                        height: 50,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "0 12px",
                        border: "none",
                        borderTop: "1px solid rgba(255,255,255,0.06)",
                        background: active ? "rgba(79,220,255,0.10)" : "transparent",
                        color: "rgba(255,255,255,0.92)",
                        fontWeight: active ? 980 : 900,
                        cursor: "pointer",
                        textAlign: "left",
                      }}
                    >
                      <span>{p.label}</span>
                      {active ? <span style={{ color: "#4fdcff", fontWeight: 980 }}>✓</span> : <span />}
                    </button>
                  );
                })}
              </div>

              {value.startISO && value.endISO ? (
                <div
                  style={{
                    marginTop: 10,
                    color: "rgba(255,255,255,0.55)",
                    fontWeight: 900,
                    fontSize: 12,
                    textAlign: "center",
                  }}
                >
                  {formatBR(value.startISO)} - {formatBR(value.endISO)}
                </div>
              ) : null}
            </div>
          ) : step === "single" ? (
            <div style={{ padding: 12 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setM1(addMonths(m1, -1))}
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 12,
                    border: "1px solid rgba(255,255,255,0.14)",
                    background: "rgba(0,0,0,0.14)",
                    color: "rgba(255,255,255,0.86)",
                    fontWeight: 950,
                    cursor: "pointer",
                  }}
                >
                  ‹
                </button>

                <div style={{ color: "rgba(255,255,255,0.92)", fontWeight: 950, fontSize: 14 }}>{monthLabel(m1)}</div>

                <button
                  type="button"
                  onClick={() => setM1(addMonths(m1, 1))}
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 12,
                    border: "1px solid rgba(255,255,255,0.14)",
                    background: "rgba(0,0,0,0.14)",
                    color: "rgba(255,255,255,0.86)",
                    fontWeight: 950,
                    cursor: "pointer",
                  }}
                >
                  ›
                </button>
              </div>

              <MonthGrid monthBase={m1} mode="single" startISO={value.startISO} endISO={value.endISO} onPick={applySingle} />
            </div>
          ) : (
            <div style={{ padding: 12 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                <button
                  type="button"
                  onClick={() => {
                    const nm1 = addMonths(m1, -1);
                    setM1(nm1);
                    setM2(startOfMonth(addMonths(nm1, 1)));
                  }}
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 12,
                    border: "1px solid rgba(255,255,255,0.14)",
                    background: "rgba(0,0,0,0.14)",
                    color: "rgba(255,255,255,0.86)",
                    fontWeight: 950,
                    cursor: "pointer",
                  }}
                >
                  ‹
                </button>

                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <div style={{ color: "rgba(255,255,255,0.92)", fontWeight: 950, fontSize: 14 }}>{monthLabel(m1)}</div>
                  <div style={{ width: 1, height: 18, background: "rgba(255,255,255,0.10)" }} />
                  <div style={{ color: "rgba(255,255,255,0.92)", fontWeight: 950, fontSize: 14 }}>{monthLabel(m2)}</div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const nm1 = addMonths(m1, 1);
                    setM1(nm1);
                    setM2(startOfMonth(addMonths(nm1, 1)));
                  }}
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 12,
                    border: "1px solid rgba(255,255,255,0.14)",
                    background: "rgba(0,0,0,0.14)",
                    color: "rgba(255,255,255,0.86)",
                    fontWeight: 950,
                    cursor: "pointer",
                  }}
                >
                  ›
                </button>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 6 }}>
                <div style={{ borderRadius: 16, border: "1px solid rgba(255,255,255,0.10)", background: "rgba(0,0,0,0.14)" }}>
                  <MonthGrid
                    monthBase={m1}
                    mode="range"
                    startISO={rangeDraftStart}
                    endISO={rangeDraftEnd || rangeDraftStart}
                    onPick={pickRange}
                  />
                </div>

                <div style={{ borderRadius: 16, border: "1px solid rgba(255,255,255,0.10)", background: "rgba(0,0,0,0.14)" }}>
                  <MonthGrid
                    monthBase={m2}
                    mode="range"
                    startISO={rangeDraftStart}
                    endISO={rangeDraftEnd || rangeDraftStart}
                    onPick={pickRange}
                  />
                </div>
              </div>

              <div style={{ marginTop: 10, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                <div style={{ color: "rgba(255,255,255,0.70)", fontWeight: 900, fontSize: 12 }}>
                  {rangeDraftStart && rangeDraftEnd
                    ? `${formatBR(clampISOOrder(rangeDraftStart, rangeDraftEnd).startISO)} - ${formatBR(
                        clampISOOrder(rangeDraftStart, rangeDraftEnd).endISO
                      )}`
                    : rangeDraftStart
                    ? `início: ${formatBR(rangeDraftStart)}`
                    : "selecione um período"}
                </div>

                <button
                  type="button"
                  onClick={applyRange}
                  disabled={!rangeDraftStart || !rangeDraftEnd}
                  style={{
                    height: 34,
                    padding: "0 12px",
                    borderRadius: 12,
                    border: `1px solid ${
                      !rangeDraftStart || !rangeDraftEnd ? "rgba(255,255,255,0.14)" : "rgba(79,220,255,0.40)"
                    }`,
                    background: !rangeDraftStart || !rangeDraftEnd ? "rgba(255,255,255,0.06)" : "rgba(79,220,255,0.10)",
                    color: !rangeDraftStart || !rangeDraftEnd ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.92)",
                    fontWeight: 950,
                    cursor: !rangeDraftStart || !rangeDraftEnd ? "not-allowed" : "pointer",
                    boxShadow: !rangeDraftStart || !rangeDraftEnd ? "none" : "0 0 18px rgba(79,220,255,0.14)",
                  }}
                >
                  aplicar
                </button>
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

/* =========================
   HeaderDashboard
========================= */
export default function HeaderDashboard({
  title,
  subtitle,
  rightSlot,
  initialPreset = "hoje",
  onDateChange,
  onQueryChange, // ✅ novo: já manda query pro /api/dashboard
}: {
  title: string;
  subtitle: string;
  rightSlot?: React.ReactNode;
  initialPreset?: PresetKey;

  onDateChange?: (sel: DateSelection) => void;
  onQueryChange?: (q: DashboardQuery, qs: string, sel: DateSelection) => void;
}) {
  const [sel, setSel] = useState<DateSelection>(() => computePreset(initialPreset));

const onDateChangeRef = useRef<typeof onDateChange>(onDateChange);
const onQueryChangeRef = useRef<typeof onQueryChange>(onQueryChange);

useEffect(() => {
  onDateChangeRef.current = onDateChange;
}, [onDateChange]);

useEffect(() => {
  onQueryChangeRef.current = onQueryChange;
}, [onQueryChange]);

useEffect(() => {
  onDateChangeRef.current?.(sel);

  const q = selectionToQuery(sel);
  const qs = buildDashboardQS(q);

  onQueryChangeRef.current?.(q, qs, sel);
}, [sel]);


  return (
    <div style={{ padding: 0, paddingBottom: 44 }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(260px, 1fr) minmax(320px, 520px) minmax(260px, 1fr)",
          alignItems: "start",
          gap: 14,
        }}
      >
        <div style={{ minWidth: 260 }}>
          <div style={{ color: "rgba(255,255,255,0.96)", fontWeight: 980, fontSize: 28, letterSpacing: 0.2 }}>
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

        <div style={{ display: "flex", justifyContent: "center" }}>
          <DatePickerFintex value={sel} onChange={setSel} />
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center" }}>{rightSlot ? rightSlot : null}</div>
      </div>

      <div style={{ height: 0 }} />
    </div>
  );
}
