"use client";

import Image from "next/image";
import React, { useEffect, useMemo, useState } from "react";
import { pdvGet, pdvSet, pdvClear } from "../pdvstore";
import type { AtendimentoKey } from "../pdvstore";


export default function Atendimento() {
  const [selecionada, setSelecionada] = useState<AtendimentoKey>("");

  const [hoverCard, setHoverCard] = useState(false);
  const [hoverInner, setHoverInner] = useState(false);
  const cardGlowOn = hoverCard && !hoverInner;

  useEffect(() => {
    const onReset = () => setSelecionada("");
    window.addEventListener("pdv:reset", onReset);
    return () => window.removeEventListener("pdv:reset", onReset);
  }, []);

  const items = useMemo(
    () =>
      [
        { k: "RETIRADA", src: "/imagens/retirada.png", alt: "Retirada" },
        { k: "ENTREGA", src: "/imagens/entrega.png", alt: "Entrega" },
        { k: "MESA", src: "/imagens/mesa.png", alt: "Mesa" },
      ] as const,
    []
  );

  const select = (k: AtendimentoKey) => {
    setSelecionada(k);
    pdvSet("service_type", k);

    // ✅ Local escuta isso e trava/solta
    window.dispatchEvent(new CustomEvent("pdv:service_type", { detail: k }));
  };

  return (
    <div
      onMouseEnter={() => setHoverCard(true)}
      onMouseLeave={() => {
        setHoverCard(false);
        setHoverInner(false);
      }}
      style={{
        width: "100%",
        maxWidth: 600,
        padding: "16px 38px",
        borderRadius: 16,
        position: "relative",
        background: `
          radial-gradient(900px 200px at 15% -10%,
            rgba(79, 220, 255, 0.12) 0%,
            rgba(79,220,255,0.06) 35%,
            rgba(79, 220, 255, 0.04) 60%
          ),
          linear-gradient(180deg,
            rgba(255,255,255,0.08) 0%,
            rgba(255,255,255,0.04) 25%,
            rgba(6,16,37,0.94) 100%
          )
        `,
        border: cardGlowOn ? "1px solid rgba(79,220,255,0.55)" : "1px solid rgba(79, 220, 255, 0.42)",
        boxShadow: cardGlowOn
          ? `
            0 20px 55px rgba(0,0,0,0.6),
            0 1px 0 rgba(255,255,255,0.08),
            0 0 26px rgba(79,220,255,0.45)
          `
          : `
            0 20px 55px rgba(0,0,0,0.6),
            0 1px 0 rgba(255,255,255,0.08),
            0 0 22px rgba(79,220,255,0.12)
          `,
        transition: "border 160ms ease, box-shadow 160ms ease",
        boxSizing: "border-box",
        overflow: "hidden",
      }}
    >
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: 16,
          pointerEvents: "none",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.10), inset 0 0 0 1px rgba(255,255,255,0.05)",
        }}
      />

      <div style={{ color: "#4fdcff", fontWeight: 700, fontSize: 17, marginBottom: 12, position: "relative", zIndex: 1 }}>
        Atendimento:
      </div>

      <div
        onMouseEnter={() => setHoverInner(true)}
        onMouseLeave={() => setHoverInner(false)}
        style={{ display: "flex", gap: 15, alignItems: "center", position: "relative", zIndex: 1 }}
      >
        {items.map((it) => {
          const ativo = selecionada === it.k;
          return (
            <button
              key={it.k}
              type="button"
              onClick={() => select(it.k)}
              onMouseDown={(e) => e.preventDefault()}
              style={{
                width: 200,
                height: 80,
                padding: 0,
                border: "none",
                background: "transparent",
                cursor: "pointer",
                borderRadius: 12,
                overflow: "hidden",
                lineHeight: 0,
                userSelect: "none",
                WebkitTapHighlightColor: "transparent",
                transform: ativo ? "scale(0.99)" : "scale(1)",
                transition: "transform 90ms ease, filter 140ms ease",
                filter: ativo ? "drop-shadow(0 10px 14px rgba(0,0,0,0.28))" : "none",
              }}
            >
              <Image
                src={it.src}
                alt={it.alt}
                width={200}
                height={80}
                priority
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                  display: "block",
                  borderRadius: 12,
                  filter: selecionada && !ativo ? "grayscale(100%) contrast(0.9) brightness(0.9)" : "none",
                  transition: "filter 140ms ease",
                }}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
