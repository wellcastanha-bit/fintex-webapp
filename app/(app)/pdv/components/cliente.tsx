/* =========================================
   app/pdv/components/cliente.tsx
   ✅ Card com brilho externo condicional
   ✅ Input com brilho interno condicional
   ✅ Formata nome APENAS ao terminar (onBlur)
   ✅ Grava customer_name no pdvstore
========================================= */
"use client";

import { useEffect, useState } from "react";
import { User } from "lucide-react";
import { pdvSet } from "../pdvstore";

const LOWER_WORDS = ["de", "da", "do", "dos", "das", "e"];

function formatNomeFinal(nome: string) {
  return nome
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map((word, index) => {
      if (index !== 0 && LOWER_WORDS.includes(word)) {
        return word;
      }
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
}

export default function Cliente() {
  const [cliente, setCliente] = useState("");

  // hover states
  const [hoverCard, setHoverCard] = useState(false);
  const [hoverInput, setHoverInput] = useState(false);

  const cardGlowOn = hoverCard && !hoverInput;
  const inputGlowOn = hoverInput;

  useEffect(() => {
    const onReset = () => {
      setCliente("");
      pdvSet("customer_name", "");
    };
    window.addEventListener("pdv:reset", onReset);
    return () => window.removeEventListener("pdv:reset", onReset);
  }, []);

  return (
    <div
      onMouseEnter={() => setHoverCard(true)}
      onMouseLeave={() => setHoverCard(false)}
      style={{
        width: "100%",
        maxWidth: 600,
        padding: "20px 34px",
        borderRadius: 16,
        position: "relative",
        overflow: "hidden",
        boxSizing: "border-box",

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

        border: cardGlowOn
          ? "1px solid rgba(79,220,255,0.55)"
          : "1px solid rgba(79, 220, 255, 0.42)",

        boxShadow: cardGlowOn
          ? `
            0 20px 55px rgba(0,0,0,0.6),
            0 1px 0 rgba(255,255,255,0.08),
            0 0 26px rgba(79,220,255,0.45)
          `
          : `
            0 20px 55px rgba(0,0,0,0.6),
            0 1px 0 rgba(255,255,255,0.08),
            0 0 18px rgba(79,220,255,0.22)
          `,
        transition: "border 160ms ease, box-shadow 160ms ease",
      }}
    >
      {/* brilho interno fixo */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: 16,
          pointerEvents: "none",
          boxShadow:
            "inset 0 1px 0 rgba(255,255,255,0.10), inset 0 0 0 1px rgba(255,255,255,0.05)",
        }}
      />

      {/* LABEL */}
      <div
        style={{
          color: "#4fdcff",
          fontWeight: 700,
          fontSize: 17,
          marginBottom: 10,
          position: "relative",
          zIndex: 1,
        }}
      >
        Nome do Cliente:
      </div>

      {/* INPUT */}
      <div
        onMouseEnter={() => setHoverInput(true)}
        onMouseLeave={() => setHoverInput(false)}
        style={{
          height: 48,
          borderRadius: 12,
          position: "relative",
          zIndex: 1,
          display: "flex",
          alignItems: "center",
          padding: "0 14px",
          gap: 10,

          background: `
            linear-gradient(
              180deg,
              rgba(255,255,255,0.03) 0%,
              rgba(255,255,255,0.04) 25%,
              rgba(6,16,37,0.95) 100%
            )
          `,

          border: inputGlowOn
            ? "1px solid rgba(79,220,255,0.55)"
            : "1px solid rgba(255,255,255,0.14)",

          boxShadow: inputGlowOn
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
        <User size={24} color="#4fdcff" />

        <input
          type="text"
          value={cliente}
          onChange={(e) => {
            const v = e.target.value;
            setCliente(v);
            pdvSet("customer_name", v);
          }}
          onBlur={() => {
            if (cliente.trim()) {
              const f = formatNomeFinal(cliente);
              setCliente(f);
              pdvSet("customer_name", f);
            }
          }}
          placeholder="Digite o nome do cliente"
          style={{
            flex: 1,
            background: "transparent",
            border: "none",
            outline: "none",
            color: "#eaf0ff",
            fontSize: 20,
            fontWeight: 500,
          }}
        />
      </div>
    </div>
  );
}
