// app/dashboard/page.tsx
// ✅ Junta Dashboard / Relatório Detalhado em 1 tela
// ✅ Toggle no topo (sem backend)
// ✅ Regra de Ouro: page NÃO cria padding externo (shell do app decide os 40px)
// ✅ GATE DE SENHA (UI) antes de mostrar dashboard/relatório

"use client";

import React, { useEffect, useState } from "react";
import DashboardView from "./components/dashboard";
import RelatorioDetalhadoView from "./components/relatorio-detalhado";
import { LayoutDashboard, ListOrdered, Lock, LogOut } from "lucide-react";

type Tab = "DASHBOARD" | "RELATORIO";


const PASS_ENV = (process.env.NEXT_PUBLIC_DASH_PASS || "").trim();
const DASH_PASS = PASS_ENV || "wendel20"; // 

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

function IconBtn({
  title,
  icon,
  onClick,
}: {
  title: string;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      style={{
        height: 40,
        width: 44,
        borderRadius: 14,
        border: "1px solid rgba(255,255,255,0.12)",
        background: "rgba(255,255,255,0.06)",
        color: "rgba(255,255,255,0.92)",
        fontWeight: 1000,
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        userSelect: "none",
        transition: "all .16s ease",
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLButtonElement;
        el.style.border = "1px solid rgba(79,220,255,0.28)";
        el.style.background = "rgba(79,220,255,0.10)";
        el.style.boxShadow = "0 0 18px rgba(79,220,255,0.10)";
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLButtonElement;
        el.style.border = "1px solid rgba(255,255,255,0.12)";
        el.style.background = "rgba(255,255,255,0.06)";
        el.style.boxShadow = "none";
      }}
    >
      {icon}
    </button>
  );
}

function LockCard({
  onUnlock,
  error,
}: {
  onUnlock: (pass: string) => void;
  error?: string;
}) {
  const [pass, setPass] = useState("");

  return (
    <div
      style={{
        width: "300%",
        maxWidth: 920,
        borderRadius: 22,
        padding: 16,
        border: "1px solid rgba(79,220,255,0.22)",
        background: "rgba(0,0,0,0.22)",
        boxShadow: "0 0 0 1px rgba(79,220,255,0.10) inset, 0 0px 0px rgba(0,0,0,0.55)",
        backdropFilter: "blur(0px)",
        WebkitBackdropFilter: "blur(0px)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: 14,
            border: "1px solid rgba(79,220,255,0.28)",
            background: "rgba(79,220,255,0.10)",
            display: "grid",
            placeItems: "center",
            boxShadow: "0 0 18px rgba(79,220,255,0.16)",
          }}
        >
          <Lock size={16} />
        </div>

        <div>
          <div style={{ fontSize: 18, fontWeight: 1000, letterSpacing: 0.2 }}>Acesso ao Dashboard</div>
          <div style={{ marginTop: 4, fontSize: 12, opacity: 0.78, fontWeight: 900 }}>
            Digite a senha para continuar
          </div>
        </div>
      </div>

      <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
        <input
          type="password"
          value={pass}
          onChange={(e) => setPass(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") onUnlock(pass);
          }}
          placeholder="Senha"
          style={{
            width: "100%",
            padding: "14px 14px",
            borderRadius: 16,
            border: "1px solid rgba(79,220,255,0.18)",
            background: "rgba(2,11,24,0.62)",
            color: "rgba(255,255,255,0.92)",
            fontWeight: 950,
            outline: "none",
          }}
        />

        <button
          onClick={() => onUnlock(pass)}
          style={{
            width: "100%",
            padding: "14px 14px",
            borderRadius: 16,
            border: "1px solid rgba(79,220,255,0.30)",
            background: "linear-gradient(180deg, rgba(79,220,255,0.18), rgba(79,220,255,0.08))",
            color: "rgba(255,255,255,0.92)",
            fontWeight: 1000,
            cursor: "pointer",
            boxShadow: "0 0 0 1px rgba(79,220,255,0.06) inset, 0 24px 60px rgba(0,0,0,0.45)",
          }}
        >
          Entrar
        </button>

        {error ? (
          <div style={{ marginTop: 2, fontSize: 12, fontWeight: 900, color: "rgba(255,120,140,0.95)" }}>
            {error}
          </div>
        ) : null}

        <div style={{ marginTop: 6, fontSize: 11, opacity: 0.65, fontWeight: 900 }}>
        <span style={{ opacity: 0.95 }}></span>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [tab, setTab] = useState<Tab>("DASHBOARD");

  // ✅ gate
  const [unlocked, setUnlocked] = useState(false);
  const [authErr, setAuthErr] = useState("");


  function unlockNow(pass: string) {
    const p = (pass || "").trim();
    if (!p) {
      setAuthErr("Digite a senha.");
      return;
    }
    if (p !== DASH_PASS) {
      setAuthErr("Senha incorreta.");
      return;
    }
setUnlocked(true);

  }

  function lockNow() {
 setUnlocked(false);
setAuthErr("");

  }

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

      {/* ✅ Lock overlay (SEM FUNDO, só bloqueia clique) */}
      {!unlocked ? (
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 50,
            background: "transparent", // ✅ usa o fundo do próprio app
          }}
        >
          {/* ✅ Card fixo no topo/esquerda do conteúdo */}
          <div
            style={{
              position: "absolute",
              top: 20,
              left: 20,
            }}
          >
            <LockCard onUnlock={unlockNow} error={authErr} />
          </div>

          {/* ✅ Layer invisível pra bloquear interação no resto */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "transparent",
            }}
          />
          {/* ✅ Recoloca o card acima do bloqueio */}
          <div
            style={{
              position: "absolute",
              top: 20,
              left: 20,
              pointerEvents: "auto",
            }}
          >
            <LockCard onUnlock={unlockNow} error={authErr} />
          </div>
        </div>
      ) : null}

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
              boxShadow: "0 0 0 1px rgba(79,220,255,0.10) inset, 0 0 22px rgba(79,220,255,0.12)",
              padding: 10,
              display: "flex",
              gap: 10,
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              transition: "all .18s ease",
              opacity: unlocked ? 1 : 0,
              pointerEvents: unlocked ? "auto" : "none",
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLDivElement;
              el.style.border = "1px solid rgba(79,220,255,0.36)";
              el.style.boxShadow = "0 0 0 1px rgba(79,220,255,0.14) inset, 0 0 28px rgba(79,220,255,0.22)";
              (el.style as any).WebkitBackdropFilter = "blur(16px)";
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLDivElement;
              el.style.border = "1px solid rgba(79,220,255,0.22)";
              el.style.boxShadow = "0 0 0 1px rgba(79,220,255,0.08) inset, 0 18px 55px rgba(0,0,0,0.45)";
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

            {/* ✅ Sair (bloquear) */}
            <IconBtn title="Sair" icon={<LogOut size={16} />} onClick={lockNow} />
          </div>
        </div>

        {/* Conteúdo */}
        <div style={{ width: "100%", height: "100%", opacity: unlocked ? 1 : 0 }}>
          {tab === "DASHBOARD" ? <DashboardView /> : <RelatorioDetalhadoView />}
        </div>
      </div>
    </div>
  );
}
