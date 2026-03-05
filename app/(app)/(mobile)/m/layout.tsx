// app/(mobile)/m/layout.tsx
"use client";

import React, { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

export default function MobileLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 999999,
        overflow: "auto",
        WebkitOverflowScrolling: "touch",
        background:
          "radial-gradient(1200px 700px at 50% -20%, rgba(79,220,255,0.15), transparent 60%)," +
          "linear-gradient(180deg, #041328 0%, #020b18 70%, #020814 100%)",
        color: "rgba(255,255,255,0.92)",
      }}
    >
      {/* Header mobile */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          padding: "16px",
          background: "#011b3c",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          {/* LOGO COM LINK */}
          <Link href="/m" style={{ display: "flex", alignItems: "center" }}>
            <Image
              src="/imagens/logo_fintex.jpeg"
              alt="Fintex"
              width={160}
              height={48}
              style={{
                height: "36px",
                width: "auto",
                objectFit: "contain",
                cursor: "pointer",
              }}
              priority
            />
          </Link>

          <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.1 }}>
            <div
              style={{
                fontWeight: 800,
                fontSize: 18,
                letterSpacing: 0.2,
                color: "#ffffff",
              }}
            >
              Sistema de gestão Pizza Blu
            </div>

            <div
              style={{
                fontSize: 20,
                opacity: 0.7,
                color: "#ffffff",
              }}
            >
              
            </div>
          </div>
        </div>
      </div>

      <main style={{ maxWidth: 560, margin: "0 auto", padding: 16, paddingBottom: 40 }}>
        {children}
      </main>
    </div>
  );
}
