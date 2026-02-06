// app/dashboard/page.tsx
// ✅ Junta Dashboard / Relatório Detalhado em 1 tela
// ✅ Toggle no topo (sem backend)
// ✅ Regra de Ouro: page NÃO cria padding externo (shell do app decide os 40px)

"use client";

import React, { useState } from "react";
import DashboardView from "./components/dashboard";
import RelatorioDetalhadoView from "./components/relatorio-detalhado";
import { LayoutDashboard, ListOrdered } from "lucide-react";

type Tab = "DASHBOARD" | "RELATORIO";

function TabBtn({
  active,
  label,
  icon,
  onClick,
}: {
  active: boolean;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        height: 40,
        padding: "0 12px",
        borderRadius: 14,
        border: active ? "1px solid rgba(79,220,255,0.40)" : "1px solid rgba(255,255,255,0.12)",
        background: active ? "rgba(79,220,255,0.16)" : "rgba(255,255,255,0.06)",
        color: "rgba(255,255,255,0.92)",
        fontWeight: 950,
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        gap: 10,
        boxShadow: active ? "0 0 22px rgba(79,220,255,0.12)" : "none",
        userSelect: "none",
        transition: "all .16s ease",
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLButtonElement;
        if (!active) {
          el.style.border = "1px solid rgba(79,220,255,0.28)";
          el.style.background = "rgba(79,220,255,0.10)";
          el.style.boxShadow = "0 0 18px rgba(79,220,255,0.10)";
        }
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLButtonElement;
        if (!active) {
          el.style.border = "1px solid rgba(255,255,255,0.12)";
          el.style.background = "rgba(255,255,255,0.06)";
          el.style.boxShadow = "none";
        }
      }}
    >
      {icon}
      {label}
    </button>
  );
}

export default function DashboardPage() {
  const [tab, setTab] = useState<Tab>("DASHBOARD");

  return (
    <div style={{ width: "100%", height: "100%", position: "relative", overflow: "hidden" }}>
      {/* ✅ FUNDO ÚNICO: remove as “marcações/placas” */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 0,
          background: "none",
        }}
      />

      {/* Conteúdo por cima do fundo */}
      <div style={{ position: "relative", zIndex: 1, width: "100%", height: "100%" }}>
        {/* ✅ Toggle no canto direito, alinhado com o header (mesma “faixa” do título) */}
        <div
          style={{
            position: "absolute",
            top: 18,
            right: 18,
            zIndex: 5,
          }}
        >
          <div
            style={{
              borderRadius: 18,
              border: "1px solid rgba(79,220,255,0.22)",
              background: "rgba(0,0,0,0.18)",
              boxShadow:
               "0 0 0 1px rgba(79,220,255,0.10) inset, 0 0 22px rgba(79,220,255,0.12)",
              padding: 10,
              display: "flex",
              gap: 10,
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              transition: "all .18s ease",
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLDivElement;
              el.style.border = "1px solid rgba(79,220,255,0.36)";
              el.style.boxShadow =
              el.style.boxShadow =
  "0 0 0 1px rgba(79,220,255,0.14) inset, 0 0 28px rgba(79,220,255,0.22)";

              (el.style as any).WebkitBackdropFilter = "blur(16px)";
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLDivElement;
              el.style.border = "1px solid rgba(79,220,255,0.22)";
              el.style.boxShadow =
                "0 0 0 1px rgba(79,220,255,0.08) inset, 0 18px 55px rgba(0,0,0,0.45)";
              el.style.backdropFilter = "blur(12px)";
              (el.style as any).WebkitBackdropFilter = "blur(12px)";
            }}
          >
            <TabBtn
              active={tab === "DASHBOARD"}
              label="Dashboard"
              icon={<LayoutDashboard size={16} />}
              onClick={() => setTab("DASHBOARD")}
            />
            <TabBtn
              active={tab === "RELATORIO"}
              label="Relatório Detalhado"
              icon={<ListOrdered size={16} />}
              onClick={() => setTab("RELATORIO")}
            />
          </div>
        </div>

        {/* Conteúdo */}
        <div style={{ width: "100%", height: "100%" }}>
          {tab === "DASHBOARD" ? <DashboardView /> : <RelatorioDetalhadoView />}
        </div>
      </div>
    </div>
  );
}
