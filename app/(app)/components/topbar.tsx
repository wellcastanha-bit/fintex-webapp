"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

export default function Topbar() {
  const [now, setNow] = useState<Date>(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const dataHora = now.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  // ✅ padronização geral
  const TEXT_COLOR = "#fff";
  const FONT_FAMILY =
    'system-ui, -apple-system, Segoe UI, Roboto, "Helvetica Neue", Arial, "Noto Sans", "Liberation Sans", sans-serif';

  const BASE = {
    color: TEXT_COLOR,
    fontFamily: FONT_FAMILY,
    fontWeight: 800 as const,
    fontSize: 15,
    letterSpacing: 0.2,
    lineHeight: 1,
  };

  return (
    <div
      style={{
        height: 76,
        background: "#011b3c",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 24px",
        boxSizing: "border-box",
        borderBottom: "0px solid #000",
        fontFamily: FONT_FAMILY,
      }}
    >
      {/* ESQUERDA */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          minWidth: 360,
        }}
      >
        <Link
          href="/pdv"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            textDecoration: "none",
          }}
        >
          <Image
            src="/imagens/logo_fintex.jpeg"
            alt="Fintex"
            width={210}
            height={50}
            style={{
              width: "auto",
              height: 54,
              display: "block",
            }}
            priority
          />
        </Link>

        <div
          style={{
            ...BASE,
            fontWeight: 700,
            fontSize: 25,
            letterSpacing: 0.6,
            textTransform: "none",
            opacity: 0.95,
            paddingTop: 0,
          }}
        >
       Sistema de gestão - Pizza Blu
        </div>
      </div>

  

      {/* DIREITA */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          gap: 18,
          minWidth: 320,
          ...BASE,
        }}
      >
        {/* Status online */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: "#2ecc71",
              boxShadow: "0 0 6px rgba(46,204,113,.85)",
              display: "block",
            }}
          />
          <span style={{ ...BASE, fontSize: 20, fontWeight: 700 }}>Online</span>
        </div>

        {/* Separador fino */}
        <span
          style={{
            width: 1,
            height: 18,
            background: "rgba(255,255,255,.25)",
            display: "block",
          }}
        />

        {/* Usuário */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            cursor: "pointer",
            padding: "8px 10px",
            borderRadius: 10,
            background: "rgba(255, 0, 0, 0.06)",
            border: "1px solid rgba(255, 0, 0, 0.12)",
          }}
          title="Trocar usuário (layout)"
        >
          <span style={{ ...BASE, fontSize: 20, fontWeight: 700 }}>Welton</span>
          <span style={{ ...BASE, fontSize: 20, fontWeight: 700, opacity: 0.9 }}>▾</span>
        </div>
      </div>
    </div>
  );
}
