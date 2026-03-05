// app/(app)/layout.tsx
"use client";

import React from "react";
import Sidebar from "./components/sidebar";
import Topbar from "./components/topbar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const TOPBAR_H = 76;
  const INSET = 40;

  return (
    <div style={{ width: "100vw", height: "100vh", overflow: "hidden" }}>
      {/* TOPBAR (colada no topo) */}
      <div style={{ height: TOPBAR_H, flex: "0 0 auto" }}>
        <Topbar />
      </div>

      {/* ABAIXO DA TOPBAR */}
      <div
        style={{
          height: `calc(100vh - ${TOPBAR_H}px)`,
          display: "flex",
          overflow: "hidden",
        }}
      >
        {/* SIDEBAR (colada na esquerda) */}
        <Sidebar />

        {/* ✅ CONTEÚDO INTERNO com 40px (Regra de Ouro) */}
        <main
          style={{
            flex: 1,
            minWidth: 0,
            minHeight: 0,

            // ✅ precisa permitir scroll (principalmente Y)
            overflowY: "auto",

            // ✅ não mata o scroll horizontal dos filhos (tabela grande)
            overflowX: "hidden",

            padding: INSET,
            boxSizing: "border-box",
          }}
        >
          {/* viewport interno */}
          <div
            style={{
              width: "100%",
              minHeight: "100%",

              // ✅ deixa o componente (ex: Pedidos) poder criar scroll horizontal
              overflowX: "auto",
              overflowY: "visible",
            }}
          >
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
