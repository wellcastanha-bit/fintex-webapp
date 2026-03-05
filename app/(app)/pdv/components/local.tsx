/* =========================================
  app/pdv/components/local.tsx
  ✅ PORTAL (document.body) = não clipa/overlap/buga no layout
  ✅ SEMPRE abre PRA CIMA (fixo)
  ✅ BUSCA (sem "Balcão" no dropdown)
  ✅ FUNDO OPACO (sem transparência / sem blur)
  ✅ TRAVA "Balcão" automaticamente quando Atendimento = RETIRADA ou MESA
  ✅ Só libera escolha quando Atendimento = ENTREGA
  ✅ grava bairros + taxa_entrega no pdvstore (TIPADO, sem any)
  ✅ FIX VAZAMENTO VISUAL: tampa opaca no topo + clipPath + scroll interno
========================================= */
"use client";

import { MapPin, ChevronDown, Search, Lock } from "lucide-react";
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { pdvSet } from "../pdvstore";

type Bairro = { nome: string; valor: number | null };
type AtendimentoKey = "RETIRADA" | "ENTREGA" | "MESA" | "";

export default function Local() {
  const BAIRROS: Bairro[] = useMemo(
    () => [
      { nome: "Selecione:", valor: null },
      { nome: "Anzolin Jba", valor: 8 },
      { nome: "Armindo Haro", valor: 15 },
      { nome: "Barcelona das Nações", valor: 15 },
      { nome: "Bela Vista", valor: 11 },
      { nome: "Boa Vista", valor: 9 },
      { nome: "Boate Darci", valor: 17 },
      { nome: "Brisas do Vale", valor: 9 },
      { nome: "Caetano Branco", valor: 11 },
      { nome: "Centro Herval", valor: 8 },
      { nome: "Centro Joaçaba", valor: 7 },
      { nome: "Centro Luzerna", valor: 18 },
      { nome: "Clara Adélia", valor: 12 },
      { nome: "Contestado", valor: 12 },
      { nome: "Cruzeiro Do Sul", valor: 7 },
      { nome: "Distrito Industrial", valor: 28 },
      { nome: "Estação Luzerna", valor: 15 },
      { nome: "Flor da Serra", valor: 7 },
      { nome: "Frei Bruno", valor: 12 },
      { nome: "Jardim Alvorada", valor: 11 },
      { nome: "Jardim Cidade Alta", valor: 11 },
      { nome: "Jardim Das Hortências", valor: 14 },
      { nome: "Jardim Europa", valor: 11 },
      { nome: "Jardim Italia", valor: 10 },
      { nome: "Jardim José Rupp", valor: 11 },
      { nome: "Jardim Lindóia", valor: 12 },
      { nome: "João Paulo II", valor: 10 },
      { nome: "João Pires", valor: 12 },
      { nome: "Joviva", valor: 12 },
      { nome: "Lacerdópolis", valor: 35 },
      { nome: "Linha Duas Casas", valor: 20 },
      { nome: "Linha Ferreirinha", valor: 15 },
      { nome: "Linha Pacífico", valor: 18 },
      { nome: "Loteamento Laske", valor: 14 },
      { nome: "Loteamento Zagonel", valor: 13 },
      { nome: "Luzerna", valor: 20 },
      { nome: "Menino Deus", valor: 9 },
      { nome: "Monte Belo", valor: 9 },
      { nome: "Morada Do Sol", valor: 14 },
      { nome: "Nossa Senhora Aparecida", valor: 12 },
      { nome: "Nossa Senhora de Lourdes", valor: 10 },
      { nome: "Nossa Senhora de Fatima", valor: 11 },
      { nome: "Pátio 04 ADM", valor: 15 },
      { nome: "Pesque Pague Zanella", valor: 20 },
      { nome: "Santa Tereza", valor: 10 },
      { nome: "Santo Antônio", valor: 11 },
      { nome: "São Brás", valor: 17 },
      { nome: "São Jorge", valor: 10 },
      { nome: "São Vicente", valor: 11 },
      { nome: "Serp", valor: 14 },
      { nome: "Serra Alta", valor: 19 },
      { nome: "Tobias", valor: 9 },
      { nome: "Vila Cachoeirinha", valor: 8 },
      { nome: "Vila Cordazzo", valor: 11 },
      { nome: "Vila Germânica", valor: 18 },
      { nome: "Vila Kennedy", valor: 26 },
      { nome: "Vila Militar", valor: 9 },
      { nome: "Vila Pedrini", valor: 8 },
      { nome: "Vila Remor", valor: 14 },
      { nome: "Vila Rica", valor: 9 },
      { nome: "Vila Simone", valor: 12 },
    ],
    []
  );

  const [bairro, setBairro] = useState<string>("Selecione:");
  const [serviceType, setServiceType] = useState<AtendimentoKey>("");

  // hover card/campo
  const [hoverCard, setHoverCard] = useState(false);
  const [hoverField, setHoverField] = useState(false);
  const cardGlowOn = hoverCard && !hoverField;
  const fieldGlowOn = hoverField;

  // dropdown
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const anchorRef = useRef<HTMLDivElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const searchRef = useRef<HTMLInputElement | null>(null);

  // busca
  const [q, setQ] = useState("");

  // posição do portal
  const [pos, setPos] = useState<{ left: number; top: number; width: number } | null>(null);

  useEffect(() => setMounted(true), []);

  const enabled = serviceType === "ENTREGA";
  const locked = serviceType === "RETIRADA" || serviceType === "MESA";

  // ✅ reset
  useEffect(() => {
    const onReset = () => {
      setBairro("Selecione:");
      setServiceType("");
      setOpen(false);
      setQ("");
      pdvSet("bairros", "");
      pdvSet("taxa_entrega", 0);
    };
    window.addEventListener("pdv:reset", onReset);
    return () => window.removeEventListener("pdv:reset", onReset);
  }, []);

  // ✅ escuta atendimento e TRAVA balcão
  useEffect(() => {
    const onService = (e: any) => {
      const next = (e?.detail ?? "") as AtendimentoKey;
      setServiceType(next);

      if (next === "RETIRADA" || next === "MESA") {
        setOpen(false);
        setQ("");
        setBairro("Balcão");
        pdvSet("bairros", "Balcão");
        pdvSet("taxa_entrega", 0);
      }

      if (next === "ENTREGA") {
        setOpen(false);
        setQ("");
        setBairro("Selecione:");
        pdvSet("bairros", "");
        pdvSet("taxa_entrega", 0);
      }
    };

    window.addEventListener("pdv:service_type", onService);
    return () => window.removeEventListener("pdv:service_type", onService);
  }, []);

  const valor = useMemo(() => {
    const item = BAIRROS.find((b) => b.nome === bairro);
    return item?.valor ?? null;
  }, [bairro, BAIRROS]);

  const isSelecione = bairro === "Selecione:";
  const showRS = enabled && !isSelecione && valor != null;

  const fmt = (v: number | null) => {
    if (v == null) return "";
    return v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const applyBairro = (next: string) => {
    if (!enabled) return;

    setBairro(next);
    setOpen(false);
    setQ("");

    pdvSet("bairros", next);

    const item = BAIRROS.find((b) => b.nome === next);
    const v = item?.valor ?? null;
    pdvSet("taxa_entrega", v ?? 0);
  };

  const qNorm = q.trim().toLowerCase();

  const filtered = useMemo(() => {
    const base = BAIRROS.filter((b) => b.nome !== "Selecione:" && b.nome !== "Balcão");
    if (!qNorm) return base;
    return base.filter((b) => b.nome.toLowerCase().includes(qNorm));
  }, [BAIRROS, qNorm]);

  // ✅ SEMPRE PRA CIMA (nasce acima e depois recalibra com altura real)
  const computePos = () => {
    const el = anchorRef.current;
    if (!el) return;

    const r = el.getBoundingClientRect();
    const GAP = 10;

    const W = r.width;
    const left = Math.max(12, Math.min(window.innerWidth - W - 12, r.left));

    const EST_H = 360;
    const top = Math.max(12, r.top - GAP - EST_H);

    setPos({ left, top, width: W });
  };

  const openDropdown = () => {
    if (!enabled) return;
    setOpen(true);
  };

  const toggleOpen = () => {
    if (!enabled) return;
    setOpen((v) => !v);
  };

  // ✅ ao abrir: calcula posição + foca busca
  useEffect(() => {
    if (!open) return;

    computePos();

    requestAnimationFrame(() => {
      searchRef.current?.focus();
      searchRef.current?.select();
    });

    const onScroll = () => computePos();
    const onResize = () => computePos();
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
    };
  }, [open]);

  // ✅ ajuste fino: usa altura REAL do dropdown pra “colar” perfeito acima
  useLayoutEffect(() => {
    if (!open) return;
    const r = anchorRef.current?.getBoundingClientRect();
    const d = dropdownRef.current?.getBoundingClientRect();
    if (!r || !d) return;

    const GAP = 10;
    const targetTop = Math.max(12, r.top - GAP - d.height);

    setPos((p) => (p ? { ...p, top: targetTop } : p));
  }, [open, q, showRS]);

  // ✅ fechar clicando fora (portal)
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!open) return;
      const t = e.target as Node;

      const a = anchorRef.current;
      const d = dropdownRef.current;

      const insideAnchor = !!a && a.contains(t);
      const insideDrop = !!d && d.contains(t);

      if (!insideAnchor && !insideDrop) setOpen(false);
    };
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, [open]);

  const onKeyDownField = (e: React.KeyboardEvent) => {
    if (!enabled) return;
    if (e.key === "Escape") return setOpen(false);
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggleOpen();
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      openDropdown();
    }
  };

  return (
    <div
      onMouseEnter={() => setHoverCard(true)}
      onMouseLeave={() => {
        setHoverCard(false);
        setHoverField(false);
      }}
      style={{
        width: "100%",
        maxWidth: 600,
        padding: "16px 20px",
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

      <div
        style={{
          color: "#4fdcff",
          fontWeight: 700,
          fontSize: 17,
          marginBottom: 10,
          paddingLeft: 22,
          position: "relative",
          zIndex: 1,
        }}
      >
        Local:
      </div>

      {/* ANCHOR */}
      <div
        ref={anchorRef}
        onMouseEnter={() => setHoverField(true)}
        onMouseLeave={() => setHoverField(false)}
        style={{ position: "relative", zIndex: 2 }}
      >
        {/* CAMPO */}
        <div
          role="button"
          tabIndex={enabled ? 0 : -1}
          aria-haspopup="listbox"
          aria-expanded={open}
          onClick={toggleOpen}
          onKeyDown={onKeyDownField}
          style={{
            height: 52,
            borderRadius: 12,
            position: "relative",
            background: `
              linear-gradient(180deg,
                rgba(255,255,255,0.03) 0%,
                rgba(255,255,255,0.04) 25%,
                rgba(6,16,37,0.95) 100%
              )
            `,
            border: fieldGlowOn || open ? "1px solid rgba(79,220,255,0.55)" : "1px solid rgba(255,255,255,0.14)",
            boxShadow: fieldGlowOn || open
              ? `
                inset 0 1px 0 rgba(255,255,255,0.12),
                0 0 18px rgba(79,220,255,0.45)
              `
              : `
                inset 0 1px 0 rgba(255,255,255,0.10),
                inset 0 -1px 0 rgba(0,0,0,0.45)
              `,
            transition: "border 160ms ease, box-shadow 160ms ease, opacity 160ms ease",
            display: "grid",
            gridTemplateColumns: showRS ? "1fr 120px" : "1fr",
            alignItems: "center",
            padding: "0 12px",
            gap: 12,
            boxSizing: "border-box",
            cursor: enabled ? "pointer" : "not-allowed",
            outline: "none",
            opacity: locked ? 0.92 : 1,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0, position: "relative" }}>
            <MapPin
              size={28}
              color="#4fdcff"
              style={{
                flexShrink: 0,
                position: "relative",
                top: -3,
                filter: fieldGlowOn || open ? "drop-shadow(0 0 10px rgba(79,220,255,0.30))" : "none",
                transition: "filter 140ms ease",
              }}
            />

            <div
              style={{
                flex: 1,
                minWidth: 0,
                height: 40,
                display: "flex",
                alignItems: "center",
                color: isSelecione ? "rgba(234,240,255,0.70)" : "#eaf0ff",
                fontSize: 18,
                fontWeight: 650,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                paddingRight: 30,
              }}
            >
              {bairro}
            </div>

            {locked ? (
              <Lock
                size={18}
                color="rgba(234,240,255,0.65)"
                style={{ position: "absolute", right: 6, pointerEvents: "none", opacity: 0.0 }}
              />
            ) : (
              <ChevronDown
                size={18}
                color="rgba(234,240,255,0.65)"
                style={{
                  position: "absolute",
                  right: 6,
                  pointerEvents: "none",
                  opacity: fieldGlowOn || open ? 0.95 : 0.7,
                  transform: open ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "opacity 140ms ease, transform 160ms ease",
                }}
              />
            )}
          </div>

          {showRS && (
            <div
              title={`Taxa: R$ ${fmt(valor)}`}
              style={{
                height: 40,
                width: "100%",
                padding: "0 14px",
                marginLeft: -6,
                borderRadius: 10,
                background: `
                  linear-gradient(180deg,
                    rgba(255,255,255,0.04) 0%,
                    rgba(255,255,255,0.03) 25%,
                    rgba(6,16,37,0.92) 100%
                  )
                `,
                color: "#4fdcff",
                fontWeight: 900,
                fontSize: 18,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                whiteSpace: "nowrap",
                justifySelf: "start",
                userSelect: "none",
                letterSpacing: 0.2,
              }}
            >
              R$ {fmt(valor)}
            </div>
          )}
        </div>
      </div>

      {/* PORTAL */}
      {mounted &&
        open &&
        pos &&
        enabled &&
        createPortal(
          <div
            ref={dropdownRef}
            role="listbox"
            aria-label="Lista de bairros"
            style={{
              position: "fixed",
              left: pos.left,
              top: pos.top,
              width: pos.width - (showRS ? 132 : 0),
              borderRadius: 14,

              // ✅ FUNDO OPACO TOTAL
              background: "#061025",
              border: "1px solid rgba(79,220,255,0.44)",
              boxShadow: `
                0 28px 80px rgba(0,0,0,0.82),
                0 0 24px rgba(79,220,255,0.16),
                inset 0 1px 0 rgba(255,255,255,0.06)
              `,

              maxHeight: 380,

              // ✅ FIX: nada “vaza” nas bordas arredondadas
              overflow: "hidden",
              clipPath: "inset(0 round 14px)",

              padding: 0,
              zIndex: 2147483647,
              boxSizing: "border-box",
            }}
          >
            {/* tampa opaca no topo (anti-vazamento total) */}
            <div
              aria-hidden
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: 0,
                height: 18,
                background: "#061025",
                zIndex: 6,
              }}
            />

            {/* scrollbar fintex */}
            <style>{`
              .fintex-local-scroll::-webkit-scrollbar { width: 10px; }
              .fintex-local-scroll::-webkit-scrollbar-track { background: rgba(255,255,255,0.04); border-radius: 999px; }
              .fintex-local-scroll::-webkit-scrollbar-thumb { background: rgba(79,220,255,0.25); border-radius: 999px; border: 2px solid rgba(6,16,37,1); }
              .fintex-local-scroll::-webkit-scrollbar-thumb:hover { background: rgba(79,220,255,0.35); }
            `}</style>

            {/* ✅ SCROLL INTERNO (não no container do dropdown) */}
            <div
              className="fintex-local-scroll"
              style={{
                maxHeight: 380,
                overflowY: "auto",
                padding: 12,
                boxSizing: "border-box",
              }}
            >
              {/* HEADER OPACO (sticky) */}
              <div
                style={{
                  position: "sticky",
                  top: 0,
                  zIndex: 7,

                  background: "#061025",
                  paddingTop: 10,
                  paddingBottom: 12,

                  borderBottom: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <div
                  style={{
                    height: 46,
                    borderRadius: 12,
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "0 12px",
                    border: "1px solid rgba(255,255,255,0.14)",
                    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.10)",
                    background: `
                      linear-gradient(180deg,
                        rgba(255,255,255,0.05) 0%,
                        rgba(255,255,255,0.03) 35%,
                        rgba(6,16,37,0.98) 100%
                      )
                    `,
                  }}
                >
                  <Search size={18} color="rgba(79,220,255,0.95)" />
                  <input
                    ref={searchRef}
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Buscar bairro…"
                    onKeyDown={(e) => {
                      if (e.key === "Escape") setOpen(false);
                    }}
                    style={{
                      width: "100%",
                      height: 32,
                      border: "none",
                      outline: "none",
                      background: "transparent",
                      color: "#eaf0ff",
                      fontSize: 15,
                      fontWeight: 800,
                      letterSpacing: 0.2,
                    }}
                  />
                </div>
              </div>

              {filtered.length === 0 ? (
                <div
                  style={{
                    padding: "14px 10px",
                    color: "rgba(234,240,255,0.75)",
                    fontWeight: 800,
                    fontSize: 14,
                  }}
                >
                  Nenhum bairro encontrado.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 6, paddingTop: 10 }}>
                  {filtered.map((b) => (
                    <OptionRow
                      key={b.nome}
                      label={b.nome}
                      value={b.valor}
                      active={bairro === b.nome}
                      onClick={() => applyBairro(b.nome)}
                      fmt={fmt}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}

function OptionRow({
  label,
  value,
  active,
  onClick,
  fmt,
}: {
  label: string;
  value: number | null;
  active: boolean;
  onClick: () => void;
  fmt: (v: number | null) => string;
}) {
  return (
    <div
      role="option"
      aria-selected={active}
      onClick={onClick}
      style={{
        height: 48,
        borderRadius: 12,
        padding: "0 12px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        cursor: "pointer",
        userSelect: "none",
        background: active ? "rgba(79,220,255,0.14)" : "rgba(255,255,255,0.02)",
        border: active ? "1px solid rgba(79,220,255,0.38)" : "1px solid rgba(255,255,255,0.06)",
        boxShadow: active ? "0 0 16px rgba(79,220,255,0.14)" : "inset 0 1px 0 rgba(255,255,255,0.04)",
        transition: "background 120ms ease, border 120ms ease, box-shadow 120ms ease, transform 120ms ease",
      }}
      onMouseEnter={(e) => {
        if (active) return;
        e.currentTarget.style.background = "rgba(79,220,255,0.08)";
        e.currentTarget.style.border = "1px solid rgba(79,220,255,0.22)";
      }}
      onMouseLeave={(e) => {
        if (active) return;
        e.currentTarget.style.background = "rgba(255,255,255,0.02)";
        e.currentTarget.style.border = "1px solid rgba(255,255,255,0.06)";
      }}
    >
      <div
        style={{
          color: "#eaf0ff",
          fontWeight: 900,
          fontSize: 15,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          paddingRight: 10,
          flex: 1,
          minWidth: 0,
          letterSpacing: 0.2,
        }}
      >
        {label}
      </div>

      {value != null && (
        <div
          style={{
            color: "rgba(79,220,255,0.98)",
            fontWeight: 950,
            fontSize: 13,
            whiteSpace: "nowrap",
            letterSpacing: 0.3,
          }}
        >
          R$ {fmt(value)}
        </div>
      )}
    </div>
  );
}
