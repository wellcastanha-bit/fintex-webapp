/* =========================================
   app/pdv/components/plataforma.tsx
   ✅ layout igual à imagem (card + grid 2 linhas)
   ✅ mantém imagens dos botões
   ✅ animação de clique (press-in)
   ✅ escuta "pdv:reset" e zera seleção
   ✅ VISUAL IGUAL AO CLIENTE (#061025)
   ✅ BRILHO EXTERNO CONDICIONAL (igual Cliente):
      - Hover no CARD (fora dos botões): ativa brilho externo
      - Hover nos BOTÕES: desativa brilho externo
   ✅ INTEGRAÇÃO PDVSTORE (minúsculo): salva platform
========================================= */
"use client";

import Image from "next/image";
import React, { useEffect, useMemo, useState } from "react";
import { pdvSet } from "../pdvstore";

type PlataformaKey = "WHATSAPP" | "DELIVERY MUCH" | "BALCAO" | "AIQFOME" | "IFOOD" | "";

export default function Plataforma() {
  const [selecionada, setSelecionada] = useState<PlataformaKey>("");

  // ✅ hover states (igual Cliente)
  const [hoverCard, setHoverCard] = useState(false);
  const [hoverInner, setHoverInner] = useState(false); // mouse em cima dos botões/área interna

  const cardGlowOn = hoverCard && !hoverInner;

  useEffect(() => {
    const onReset = () => setSelecionada("");
    window.addEventListener("pdv:reset", onReset);
    return () => window.removeEventListener("pdv:reset", onReset);
  }, []);

  // tamanhos próximos do print
  const CARD_RADIUS = 16;
  const CARD_PAD_X = 38;
  const CARD_PAD_Y = 16;

  const BTN_W = 160;
  const BTN_H = 60;
  const BTN_RADIUS = 12;
  const GAP = 15;

  const items = useMemo(
    () =>
      [
        { k: "WHATSAPP", src: "/imagens/whatsapp.png", alt: "WhatsApp" },
        { k: "MUCH", src: "/imagens/delivery_Much.png", alt: "Delivery Much" },
        { k: "BALCAO", src: "/imagens/balcao.png", alt: "Balcão" },
        { k: "AIQFOME", src: "/imagens/aiqfome.png", alt: "Aiqfome" },
        { k: "IFOOD", src: "/imagens/ifood.png", alt: "iFood" },
      ] as const,
    []
  );

  const pressIn = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.currentTarget.style.transform = "scale(0.96)";
  };
  const pressOut = (e: React.PointerEvent<HTMLButtonElement>) => {
    const key = e.currentTarget.getAttribute("data-key") as PlataformaKey;
    const ativo = key && key === selecionada;
    e.currentTarget.style.transform = ativo ? "scale(0.99)" : "scale(1)";
  };

  const Btn = ({ k, src, alt }: { k: Exclude<PlataformaKey, "">; src: string; alt: string }) => {
    const ativo = selecionada === k;

    return (
      <button
        type="button"
        data-key={k}
        onClick={() => {
          setSelecionada(k);
          pdvSet("platform", k); // ✅ grava no store
        }}
        onPointerDown={pressIn}
        onPointerUp={pressOut}
        onPointerLeave={pressOut}
        onPointerCancel={pressOut}
        onMouseDown={(e) => e.preventDefault()}
        aria-pressed={ativo}
        style={{
          width: BTN_W,
          height: BTN_H,
          padding: 0,
          border: "none",
          background: "transparent",
          cursor: "pointer",
          borderRadius: BTN_RADIUS,
          overflow: "hidden",
          lineHeight: 0,
          userSelect: "none",
          WebkitTapHighlightColor: "transparent",
          boxSizing: "border-box",
          transform: ativo ? "scale(0.99)" : "scale(1)",
          transition: "transform 90ms ease, filter 140ms ease",
          filter: ativo ? "drop-shadow(0 10px 14px rgba(0,0,0,0.28))" : "none",
        }}
      >
        <Image
          src={src}
          alt={alt}
          width={BTN_W}
          height={BTN_H}
          priority
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            display: "block",
            borderRadius: BTN_RADIUS,
            filter: selecionada && !ativo ? "grayscale(100%) contrast(0.9) brightness(0.9)" : "none",
            transition: "filter 140ms ease",
          }}
        />
      </button>
    );
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
        padding: `${CARD_PAD_Y}px ${CARD_PAD_X}px`,
        borderRadius: CARD_RADIUS,
        position: "relative",
        boxSizing: "border-box",
        overflow: "hidden",

        /* FUNDO PREMIUM – IGUAL AO CLIENTE */
        background: `
          radial-gradient(
            900px 200px at 15% -10%,
            rgba(79, 220, 255, 0.12) 0%,
            rgba(79,220,255,0.06) 35%,
            rgba(79, 220, 255, 0.04) 60%
          ),
          linear-gradient(
            180deg,
            rgba(255,255,255,0.08) 0%,
            rgba(255,255,255,0.04) 25%,
            rgba(6,16,37,0.94) 100%
          )
        `,

        /* ✅ BRILHO EXTERNO CONDICIONAL */
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
      }}
    >
      {/* brilho interno igual (fixo) */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: CARD_RADIUS,
          pointerEvents: "none",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.10), inset 0 0 0 1px rgba(255,255,255,0.05)",
        }}
      />

      <div
        style={{
          color: "#4fdcff",
          fontWeight: 700,
          fontSize: 17,
          marginBottom: 12,
          position: "relative",
          zIndex: 1,
        }}
      >
        Plataforma:
      </div>

      {/* ✅ área interna: quando mouse entra aqui, desliga o brilho externo */}
      <div
        onMouseEnter={() => setHoverInner(true)}
        onMouseLeave={() => setHoverInner(false)}
        style={{ display: "grid", gap: GAP, position: "relative", zIndex: 1 }}
      >
        {/* 2 linhas: 2 botões em cima e 3 embaixo */}
        <div style={{ display: "flex", gap: GAP, alignItems: "center" }}>
          <Btn k="WHATSAPP" src="/imagens/whatsapp.png" alt="WhatsApp" />
          <Btn k="DELIVERY MUCH" src="/imagens/delivery_Much.png" alt="Delivery Much" />
        </div>

        <div style={{ display: "flex", gap: GAP, alignItems: "center" }}>
          <Btn k="BALCAO" src="/imagens/balcao.png" alt="Balcão" />
          <Btn k="AIQFOME" src="/imagens/aiqfome.png" alt="Aiqfome" />
          <Btn k="IFOOD" src="/imagens/ifood.png" alt="iFood" />
        </div>
      </div>
    </div>
  );
}
