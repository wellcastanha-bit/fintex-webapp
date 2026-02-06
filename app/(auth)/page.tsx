"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { LogIn, AlertTriangle } from "lucide-react";

type MockSession = {
  ok: true;
  tenantKey: string;
  userLabel: string;
  createdAt: string; // ISO
};

const LS_KEY = "fintex_mock_auth_v1";
const LOGO_SRC = "/imagens/logo_fintex.jpeg";
const HEADER_BG = "#011b3c";

function readSession(): MockSession | null {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.ok) return null;
    return parsed as MockSession;
  } catch {
    return null;
  }
}

function writeSession(s: MockSession) {
  localStorage.setItem(LS_KEY, JSON.stringify(s));
}
function clearSession() {
  localStorage.removeItem(LS_KEY);
}

function ShellCard({ children }: { children: React.ReactNode }) {
  const [hover, setHover] = useState(false);

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        width: 560,
        maxWidth: "92vw",
        borderRadius: 26,
        overflow: "hidden",
        position: "relative",
        background:
          "radial-gradient(120% 120% at 18% 0%, rgba(79,220,255,.10) 0%, rgba(4,19,40,0) 45%)," +
          "linear-gradient(180deg, rgba(255,255,255,.05), rgba(255,255,255,.02))",
        border: hover ? "1px solid rgba(79,220,255,.35)" : "1px solid rgba(79,220,255,.16)",
        boxShadow: hover
          ? "0 0 0 1px rgba(79,220,255,.20) inset, 0 0 42px rgba(79,220,255,.16), 0 40px 130px rgba(0,0,0,.70)"
          : "0 0 0 1px rgba(255,255,255,.03) inset, 0 28px 90px rgba(0,0,0,.62)",
        backdropFilter: hover ? "blur(14px)" : "blur(10px)",
        WebkitBackdropFilter: hover ? "blur(14px)" : "blur(10px)",
        transition: "all .22s ease",
      }}
    >
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: -2,
          borderRadius: 28,
          pointerEvents: "none",
          boxShadow: hover ? "0 0 60px rgba(79,220,255,.12)" : "none",
          transition: "box-shadow .22s ease",
        }}
      />
      {children}
    </div>
  );
}

function FieldFintex({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  autoFocus,
  error,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  autoFocus?: boolean;
  error?: boolean;
}) {
  const [hover, setHover] = useState(false);
  const [focus, setFocus] = useState(false);
  const filled = value.trim().length > 0;

  const active = focus || hover;
  const danger = !!error;

  return (
    <label style={{ display: "block" }}>
      <div
        style={{
          fontSize: 15,
          fontWeight: 950,
          letterSpacing: 0.2,
          color: "rgba(2, 204, 255, 0.92)",
          marginBottom: 10,
          textShadow: "0 1px 0 rgba(0,0,0,.35)",
        }}
      >
        {label}
      </div>

      <div
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{
          position: "relative",
          borderRadius: 16,
          padding: 2,
          transition: "all .18s ease",
          background: danger
            ? "linear-gradient(180deg, rgba(255,70,90,.22), rgba(255,70,90,.08))"
            : active
            ? "linear-gradient(180deg, rgba(79,220,255,.22), rgba(79,220,255,.08))"
            : "linear-gradient(180deg, rgba(79,220,255,.10), rgba(79,220,255,.04))",
          boxShadow: danger
            ? "0 0 28px rgba(255,70,90,.18)"
            : active
            ? "0 0 26px rgba(79,220,255,.14)"
            : "0 0 0 rgba(0,0,0,0)",
          backdropFilter: (danger || active) ? "blur(12px)" : "blur(10px)",
          WebkitBackdropFilter: (danger || active) ? "blur(12px)" : "blur(10px)",
        }}
      >
        <div
          style={{
            borderRadius: 14,
            background: "linear-gradient(180deg, rgba(10,28,55,.82), rgba(6,18,38,.78))",
            border: danger
              ? "1px solid rgba(255,70,90,.55)"
              : active
              ? "1px solid rgba(79,220,255,.38)"
              : "1px solid rgba(255,255,255,.10)",
            boxShadow: danger
              ? "0 0 0 1px rgba(255,70,90,.18) inset, 0 22px 66px rgba(0,0,0,.58)"
              : active
              ? "0 0 0 1px rgba(79,220,255,.16) inset, 0 20px 60px rgba(0,0,0,.55)"
              : "0 0 0 1px rgba(255,255,255,.04) inset, 0 20px 60px rgba(0,0,0,.50)",
            transition: "all .18s ease",
            overflow: "hidden",
            position: "relative",
          }}
        >
          <div
            aria-hidden
            style={{
              position: "absolute",
              left: 12,
              right: 12,
              top: 8,
              height: 12,
              borderRadius: 999,
              background: danger
                ? "linear-gradient(90deg, rgba(255,255,255,0), rgba(255,120,130,.18), rgba(255,255,255,0))"
                : "linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,.14), rgba(255,255,255,0))",
              opacity: active ? 0.55 : 0.30,
              filter: "blur(.2px)",
              transition: "opacity .18s ease",
              pointerEvents: "none",
            }}
          />

          <input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            type={type}
            autoFocus={autoFocus}
            onFocus={() => setFocus(true)}
            onBlur={() => setFocus(false)}
            style={{
              width: "100%",
              height: 46,
              outline: "none",
              border: "none",
              background: "transparent",
              padding: "0 16px",
              lineHeight: "46px",
              color: filled ? "rgba(235,250,255,.96)" : "rgba(210,235,245,.60)",
              fontWeight: filled ? 900 : 800,
              letterSpacing: 0.2,
              fontSize: 20,
            }}
          />
        </div>
      </div>
    </label>
  );
}

function GlowButton({
  children,
  onClick,
  disabled,
  variant = "primary",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: "primary" | "ghost";
}) {
  const [hover, setHover] = useState(false);
  const isGhost = variant === "ghost";

  return (
    <button
      type={isGhost ? "button" : "submit"}
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        height: 52,
        fontSize: 18,
        letterSpacing: 0.3,
        borderRadius: 16,
        padding: "0 16px",
        fontWeight: 950,
        cursor: disabled ? "not-allowed" : "pointer",
        width: "100%",
        opacity: disabled ? 0.55 : 1,
        transition: "all .16s ease",
        transform: hover && !disabled ? "translateY(-1px)" : "translateY(0)",
        border: isGhost ? "1px solid rgba(255,255,255,.14)" : "1px solid rgba(79,220,255,.30)",
        background: isGhost
          ? "linear-gradient(180deg, rgba(10,28,55,.68), rgba(6,18,38,.62))"
          : "linear-gradient(180deg, rgba(79,220,255,.85), rgba(79,220,255,.55))",
        color: isGhost ? "rgba(235,248,255,.90)" : "rgba(2,12,20,.92)",
        boxShadow: isGhost
          ? hover
            ? "0 0 0 1px rgba(79,220,255,.12) inset, 0 0 24px rgba(79,220,255,.12), 0 20px 56px rgba(0,0,0,.55)"
            : "0 0 0 1px rgba(255,255,255,.04) inset, 0 20px 56px rgba(0,0,0,.52)"
          : hover
          ? "0 0 0 1px rgba(255,255,255,.06) inset, 0 0 30px rgba(79,220,255,.22), 0 22px 60px rgba(0,0,0,.60)"
          : "0 0 0 1px rgba(255,255,255,.06) inset, 0 22px 60px rgba(0,0,0,.60)",
      }}
      onMouseDown={(e) => {
        if (disabled) return;
        e.currentTarget.style.transform = "translateY(0px) scale(0.99)";
      }}
      onMouseUp={(e) => {
        if (disabled) return;
        e.currentTarget.style.transform = hover ? "translateY(-1px)" : "translateY(0)";
      }}
    >
      {children}
    </button>
  );
}

export default function FintexEntradaLoginClean() {
  const [tenantKey, setTenantKey] = useState("");
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [remember, setRemember] = useState(true);

  // ✅ erros por campo
  const [errTenant, setErrTenant] = useState("");
  const [errUser, setErrUser] = useState("");
  const [errPass, setErrPass] = useState("");

  // ✅ mensagem (embaixo do botão Entrar)
  const [bannerMsg, setBannerMsg] = useState("");
  const [bannerPulse, setBannerPulse] = useState(false);

  const canLogin = useMemo(
    () => tenantKey.trim().length >= 2 && user.trim().length >= 3 && pass.trim().length >= 3,
    [tenantKey, user, pass]
  );

  useEffect(() => {
    const s = readSession();
    if (!s) return;
    // mantém campos vazios para aparecer placeholder
  }, []);

  function clearErrors() {
    setErrTenant("");
    setErrUser("");
    setErrPass("");
  }

  function fintexBanner(msg: string) {
    setBannerMsg(msg);
    setBannerPulse(true);
    window.setTimeout(() => setBannerPulse(false), 260);
    window.setTimeout(() => setBannerMsg(""), 2200);
  }

  function validateAndLogin() {
    clearErrors();

    const t = tenantKey.trim();
    const u = user.trim();
    const p = pass.trim();

    let ok = true;

    if (t.length < 2) {
      setErrTenant("Empresa inválida");
      ok = false;
    }
    if (u.length < 3) {
      setErrUser("Usuário inválido");
      ok = false;
    }
    if (p.length < 3) {
      setErrPass("Senha inválida");
      ok = false;
    }

    if (!ok) {
      fintexBanner("Verifique os campos.");
      return;
    }

    const SENHA_FIXA = "1234";
    if (p !== SENHA_FIXA) {
      setErrPass("Senha inválida");
      fintexBanner("Senha inválida.");
      return;
    }

    const s: MockSession = {
      ok: true,
      tenantKey: t.toLowerCase(),
      userLabel: u,
      createdAt: new Date().toISOString(),
    };

    if (remember) writeSession(s);
    else clearSession();

    window.location.href = "/pdv";
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100%",
        display: "grid",
        placeItems: "center",
        padding: 18,
        overflow: "hidden",
        background:
          "radial-gradient(1400px 900px at 18% 18%, rgba(79,220,255,.15) 0%, rgba(2,11,24,0) 52%), radial-gradient(1200px 900px at 86% 24%, rgba(79,220,255,.08) 0%, rgba(2,11,24,0) 55%), linear-gradient(180deg, #041328 0%, #031022 40%, #020b18 100%)",
        color: "rgba(235,248,255,.92)",
        fontFamily:
          'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, "Helvetica Neue", Arial',
      }}
    >
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background:
            "radial-gradient(900px 260px at 50% 0%, rgba(79,220,255,.14), rgba(2,11,24,0) 70%)",
        }}
      />

      <ShellCard>
        {/* header */}
        <div
          style={{
            height: 86,
            padding: "0 18px",
            display: "flex",
            alignItems: "center",
            gap: 16,
            background: HEADER_BG,
            borderBottom: "1px solid rgba(255,255,255,.08)",
          }}
        >
          <div style={{ width: 176, height: 44, display: "flex", alignItems: "center" }}>
            <Image src={LOGO_SRC} alt="Fintex" width={196} height={65} priority style={{ objectFit: "contain" }} />
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 20, fontWeight: 950, letterSpacing: 0.3, lineHeight: 1.1 }}>
              Sistemas de Gestão
            </div>
            <div
              style={{
                marginTop: 4,
                fontSize: 12,
                fontWeight: 850,
                letterSpacing: 0.5,
                color: "rgba(190,225,240,.80)",
              }}
            >
              Insira seu login para continuar...
            </div>
          </div>
        </div>

        {/* body */}
        <div
          style={{
            padding: 18,
            paddingTop: 14,
            background:
              "radial-gradient(900px 340px at 30% 0%, rgba(79,220,255,.10), rgba(255,255,255,.02) 60%), linear-gradient(180deg, rgba(255,255,255,.03), rgba(255,255,255,.02))",
          }}
        >
          {/* ✅ Enter = submit */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              validateAndLogin();
            }}
            style={{ display: "grid", gap: 14 }}
          >
            <FieldFintex
              label="Nome de Empresa:"
              value={tenantKey}
              onChange={(v) => {
                setTenantKey(v);
                if (errTenant) setErrTenant("");
                if (bannerMsg) setBannerMsg("");
              }}
              placeholder="Ex: Pizza Blu"
              error={!!errTenant}
              autoFocus
            />
            <FieldFintex
              label="Usuário:"
              value={user}
              onChange={(v) => {
                setUser(v);
                if (errUser) setErrUser("");
                if (bannerMsg) setBannerMsg("");
              }}
              placeholder="Ex: Welton"
              error={!!errUser}
            />
            <FieldFintex
              label="Senha:"
              value={pass}
              onChange={(v) => {
                setPass(v);
                if (errPass) setErrPass("");
                if (bannerMsg) setBannerMsg("");
              }}
              placeholder="••••••••"
              type="password"
              error={!!errPass}
            />

            {/* lembrar */}
            <div
              style={{
                borderRadius: 16,
                padding: 2,
                background:
                  "linear-gradient(180deg, rgba(79,220,255,.10), rgba(79,220,255,.04))",
              }}
            >
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 12px",
                  borderRadius: 14,
                  background:
                    "linear-gradient(180deg, rgba(10,28,55,.78), rgba(6,18,38,.70))",
                  color: "rgba(200,235,245,.86)",
                  fontSize: 15,
                  fontWeight: 900,
                  userSelect: "none",
                }}
              >
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  style={{ width: 16, height: 16 }}
                />
                Lembrar neste dispositivo
              </label>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 180px", gap: 12 }}>
              <div style={{ display: "grid", gap: 10 }}>
                <GlowButton onClick={validateAndLogin} disabled={!canLogin}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
                    <LogIn size={20} />
                    Entrar
                  </span>
                </GlowButton>

                {/* ✅ mensagem embaixo do botão Entrar */}
                {bannerMsg ? (
                  <div
                    style={{
                      borderRadius: 14,
                      padding: 2,
                      background: "linear-gradient(180deg, rgba(255,70,90,.22), rgba(255,70,90,.10))",
                      boxShadow: bannerPulse ? "0 0 36px rgba(255,70,90,.20)" : "0 0 26px rgba(255,70,90,.12)",
                      transition: "all .18s ease",
                    }}
                  >
                    <div
                      style={{
                        borderRadius: 12,
                        padding: "10px 12px",
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        background: "rgba(20,10,14,.55)",
                        backdropFilter: "blur(10px)",
                        WebkitBackdropFilter: "blur(10px)",
                        border: "1px solid rgba(255,120,130,.26)",
                        color: "rgba(255,220,225,.92)",
                        fontWeight: 900,
                        letterSpacing: 0.2,
                      }}
                    >
                      <AlertTriangle size={18} />
                      {bannerMsg}
                    </div>
                  </div>
                ) : (
                  <div style={{ height: 0 }} />
                )}
              </div>

              <GlowButton
                variant="ghost"
                onClick={() => {
                  setTenantKey("");
                  setUser("");
                  setPass("");
                  clearErrors();
                  setBannerMsg("");
                  clearSession();
                }}
              >
                Limpar
              </GlowButton>
            </div>
          </form>
        </div>

        {/* footer */}
        <div
          style={{
            padding: 14,
            borderTop: "1px solid rgba(255,255,255,.06)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            color: "rgba(140,190,210,.70)",
            fontSize: 12,
            fontWeight: 900,
            letterSpacing: 0.2,
            background: "rgba(0,0,0,.08)",
          }}
        >
          <div>Fintex</div>
          <div>v0.2</div>
        </div>
      </ShellCard>
    </div>
  );
}
