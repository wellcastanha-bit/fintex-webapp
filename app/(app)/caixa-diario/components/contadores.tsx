"use client";

import React, { useState } from "react";
import type { CountItem } from "./caixa-diario";

/* =========================
   ✅ FRONT/UI ONLY
   - sem fetch, sem /api, sem backend
   - card glow externo no hover
   - field glow interno quando hover no campo
   - começa fechado (compacto)
   - ao clicar, abre com efeito de “descida”
========================= */

const AQUA = "rgba(79,220,255,0.45)";
const AQUA_SOFT = "rgba(79,220,255,0.22)";

function CardShell({ children, cardGlowOn }: { children: React.ReactNode; cardGlowOn: boolean }) {
  return (
    <div
      style={{
        borderRadius: 24,
        position: "relative",
        overflow: "hidden",
        boxSizing: "border-box",
        background: `
          radial-gradient(
            900px 240px at 15% -10%,
            rgba(79, 220, 255, 0.10) 0%,
            rgba(79,220,255,0.05) 40%,
            rgba(79, 220, 255, 0.03) 65%
          ),
          linear-gradient(
            180deg,
            rgba(255,255,255,0.06) 0%,
            rgba(255,255,255,0.03) 22%,
            rgba(6,16,37,0.94) 100%
          )
        `,
        border: cardGlowOn ? "1px solid rgba(79,220,255,0.55)" : "1px solid rgba(79,220,255,0.40)",
        boxShadow: cardGlowOn
          ? `
            0 20px 55px rgba(0,0,0,0.60),
            0 1px 0 rgba(255,255,255,0.08),
            0 0 26px ${AQUA}
          `
          : `
            0 20px 55px rgba(0,0,0,0.60),
            0 1px 0 rgba(255,255,255,0.08),
            0 0 18px ${AQUA_SOFT}
          `,
        transition: "border 160ms ease, box-shadow 160ms ease",
      }}
    >
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: 24,
          pointerEvents: "none",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.10), inset 0 0 0 1px rgba(255,255,255,0.05)",
        }}
      />
      <div style={{ position: "relative", zIndex: 1 }}>{children}</div>
    </div>
  );
}

function FieldShell({ children, glowOn }: { children: React.ReactNode; glowOn: boolean }) {
  return (
    <div
      style={{
        borderRadius: 12,
        position: "relative",
        overflow: "hidden",
        height: 44,
        display: "flex",
        alignItems: "center",
        padding: "0 14px",
        background: `
          linear-gradient(
            180deg,
            rgba(255,255,255,0.03) 0%,
            rgba(255,255,255,0.04) 25%,
            rgba(6,16,37,0.95) 100%
          )
        `,
        border: glowOn ? "1px solid rgba(79,220,255,0.55)" : "1px solid rgba(255,255,255,0.14)",
        boxShadow: glowOn
          ? `
            inset 0 1px 0 rgba(255,255,255,0.12),
            0 0 18px rgba(79,220,255,0.45)
          `
          : `
            inset 0 1px 0 rgba(255,255,255,0.10),
            inset 0 -1px 0 rgba(0,0,0,0.45)
          `,
        transition: "border 160ms ease, box-shadow 160ms ease",
      }}
    >
      {children}
    </div>
  );
}

function UiInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      style={{
        flex: 1,
        height: "100%",
        background: "transparent",
        border: "none",
        outline: "none",
        color: "#eaf0ff",
        fontSize: 16,
        fontWeight: 500,
      }}
      className={"placeholder:text-slate-400/60 " + (props.className ?? "")}
    />
  );
}

function brl(n: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n);
}

type Props = {
  initialCounts: CountItem[];
  finalCounts: CountItem[];
  initialTotal: number;
  finalTotal: number;
  updateCount: (which: "initial" | "final", denom: number, qty: number) => void;
};

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="rgba(79,220,255,0.85)"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{
        transform: open ? "rotate(180deg)" : "rotate(0deg)",
        transition: "transform 180ms ease",
        opacity: 0.95,
      }}
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

function ContadorCard({
  title,
  which,
  counts,
  total,
  totalColor,
  setOpenExternal,
  openExternal,
  updateCount,
}: {
  title: string;
  which: "initial" | "final";
  counts: CountItem[];
  total: number;
  totalColor: string;
  openExternal: boolean;
  setOpenExternal: (v: boolean) => void;
  updateCount: (which: "initial" | "final", denom: number, qty: number) => void;
}) {
  const [hoverCard, setHoverCard] = useState(false);
  const [hoverFieldKey, setHoverFieldKey] = useState<string | null>(null);

  const cardGlowOn = hoverCard && !hoverFieldKey;
  const MAX_H = 900;

  return (
    <div
      onMouseEnter={() => setHoverCard(true)}
      onMouseLeave={() => {
        setHoverCard(false);
        setHoverFieldKey(null);
      }}
    >
      <CardShell cardGlowOn={cardGlowOn}>
        {/* HEADER */}
        <button
          type="button"
          onClick={() => setOpenExternal(!openExternal)}
          style={{
            width: "100%",
            border: "none",
            background: "transparent",
            color: "inherit",
            cursor: "pointer",
            padding: 0,
            textAlign: "left",
          }}
        >
          <div
            style={{
              padding: "22px 32px 18px 32px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 14,
            }}
          >
            <div>
              <div className="text-[18px] font-semibold">{title}</div>
              <div className="mt-1 text-[12px] text-slate-300/60">
                {openExternal ? "Clique para minimizar" : "Clique para abrir"}
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ textAlign: "right" }}>
                <div className="text-[12px] font-semibold text-slate-300/60">
                  {which === "initial" ? "Total Inicial" : "Total Final"}
                </div>
                <div
                  style={{
                    fontSize: 22,
                    fontWeight: 900,
                    color: totalColor,
                    textShadow: "0 0 14px rgba(79,220,255,0.20)",
                  }}
                >
                  {brl(total)}
                </div>
              </div>

              <div style={{ width: 38, height: 38, borderRadius: 12, display: "grid", placeItems: "center" }}>
                <Chevron open={openExternal} />
              </div>
            </div>
          </div>
        </button>

        {/* CONTEÚDO */}
        <div
          style={{
            maxHeight: openExternal ? MAX_H : 0,
            overflow: "hidden",
            transition: "max-height 260ms ease",
          }}
        >
          <div
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            style={{
              padding: "0 32px 28px 32px",
              transform: openExternal ? "translateY(0px)" : "translateY(-10px)",
              opacity: openExternal ? 1 : 0,
              transition: "transform 220ms ease, opacity 220ms ease",
            }}
          >
            <div className="mt-2 space-y-3">
              {counts.map((it) => {
                const key = `${which}-${it.denomination}`;
                return (
                  <div key={String(it.denomination)} className="flex items-center gap-4">
                    <div className="w-[90px] text-[14px] font-semibold text-slate-200/90">
                      R$ {it.denomination.toString().replace(".", ",")}
                    </div>

                    <div className="flex-1" onMouseEnter={() => setHoverFieldKey(key)} onMouseLeave={() => setHoverFieldKey(null)}>
                      <FieldShell glowOn={hoverFieldKey === key}>
                        <UiInput
                          placeholder="0"
                          value={it.quantity ? String(it.quantity) : ""}
                          onChange={(e) =>
                            updateCount(which, it.denomination, parseInt(e.target.value || "0", 10) || 0)
                          }
                          inputMode="numeric"
                        />
                      </FieldShell>
                    </div>

                    <div className="w-[120px] text-right text-[14px] font-semibold" style={{ color: totalColor }}>
                      {brl(it.denomination * it.quantity)}
                    </div>
                  </div>
                );
              })}

              <div className="mt-6 pt-6 border-t border-white/10 flex items-center justify-between">
                <div className="text-[14px] font-semibold text-slate-200/90">
                  {which === "initial" ? "Total Inicial:" : "Total Final:"}
                </div>
                <div className="text-[26px] font-bold" style={{ color: totalColor }}>
                  {brl(total)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardShell>
    </div>
  );
}

export default function ContadoresTab({ initialCounts, finalCounts, initialTotal, finalTotal, updateCount }: Props) {
  const [openInitial, setOpenInitial] = useState(false);
  const [openFinal, setOpenFinal] = useState(false);

  const initialColor = "#60a5fa";
  const finalColor = "#22d3ee";

  return (
    <div className="grid grid-cols-2 gap-6">
      <ContadorCard
        title="Contagem Inicial"
        which="initial"
        counts={initialCounts}
        total={initialTotal}
        totalColor={initialColor}
        openExternal={openInitial}
        setOpenExternal={setOpenInitial}
        updateCount={updateCount}
      />

      <ContadorCard
        title="Contagem Final"
        which="final"
        counts={finalCounts}
        total={finalTotal}
        totalColor={finalColor}
        openExternal={openFinal}
        setOpenExternal={setOpenFinal}
        updateCount={updateCount}
      />
    </div>
  );
}
