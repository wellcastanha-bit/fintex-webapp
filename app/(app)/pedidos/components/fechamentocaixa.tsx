"use client";

import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

type Props = {
  open: boolean;
  onToggle: () => void;

  responsavelFilter?: string;
  onPickMotoboy?: (label: string) => void;

  plataformaFilter?: string;
  onPickPlataforma?: (label: string) => void;

  pagamentoFilter?: string;
  onPickPagamento?: (label: string) => void;

  atendimentoFilter?: string;
  onPickAtendimento?: (label: string) => void;
};

type Anchor = { top: number; left: number };

const AQUA = "rgba(79,220,255,0.45)";
const AQUA_SOFT = "rgba(79,220,255,0.22)";

function glow(on: boolean) {
  return on
    ? `0 20px 55px rgba(0,0,0,0.60), 0 1px 0 rgba(255,255,255,0.08), 0 0 26px ${AQUA}`
    : `0 20px 55px rgba(0,0,0,0.60), 0 1px 0 rgba(255,255,255,0.08), 0 0 18px ${AQUA_SOFT}`;
}

function stripPrefix(label: string, prefix: string) {
  const s = (label || "").toString().trim();
  const p = prefix.toLowerCase();
  return s.toLowerCase().startsWith(p) ? s.slice(prefix.length).trim() : s;
}

export default function FechamentoCaixa({
  open,
  onToggle,

  responsavelFilter = "",
  onPickMotoboy,

  plataformaFilter = "",
  onPickPlataforma,

  pagamentoFilter = "",
  onPickPagamento,

  atendimentoFilter = "",
  onPickAtendimento,
}: Props) {
  const placeholderRef = useRef<HTMLDivElement | null>(null);
  const [anchor, setAnchor] = useState<Anchor>({ top: 0, left: 0 });

  const CLOSED_W = 320;
  const CLOSED_H = 40;
  const OPEN_W = 720;
  const OPEN_H = 560;

  const [anim, setAnim] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const [vp, setVp] = useState({ w: 0, h: 0 });
  useEffect(() => {
    const upd = () => setVp({ w: window.innerWidth, h: window.innerHeight });
    upd();
    window.addEventListener("resize", upd);
    return () => window.removeEventListener("resize", upd);
  }, []);

  const measure = () => {
    const el = placeholderRef.current;
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { top: r.top, left: r.left };
  };

  useLayoutEffect(() => {
    const r = measure();
    if (r) setAnchor(r);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onWin = () => {
      if (!open) return;
      const r = measure();
      if (r) setAnchor(r);
    };
    window.addEventListener("resize", onWin);
    window.addEventListener("scroll", onWin, true);
    return () => {
      window.removeEventListener("resize", onWin);
      window.removeEventListener("scroll", onWin, true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) onToggle();
    };
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [open, onToggle]);

  useEffect(() => {
    if (!open) {
      setAnim(false);
      return;
    }

    const r1 = measure();
    if (r1) setAnchor(r1);

    setAnim(false);
    const raf1 = requestAnimationFrame(() => {
      const r2 = measure();
      if (r2) setAnchor(r2);
      const raf2 = requestAnimationFrame(() => setAnim(true));
      return () => cancelAnimationFrame(raf2);
    });

    return () => cancelAnimationFrame(raf1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const Item = ({
    label,
    onClick,
    selected,
  }: {
    label: string;
    onClick?: () => void;
    selected?: boolean;
  }) => {
    const [hv, setHv] = useState(false);

    return (
      <button
        type="button"
        onClick={onClick}
        onMouseEnter={() => setHv(true)}
        onMouseLeave={() => setHv(false)}
        style={{
          height: 40,
          padding: "0 14px",
          borderRadius: 999,
          border: selected
            ? "1px solid rgba(79,220,255,0.78)"
            : hv
            ? "1px solid rgba(79,220,255,0.55)"
            : "1px solid rgba(255,255,255,0.12)",
          background: selected
            ? `
              radial-gradient(700px 140px at 15% -10%, rgba(79,220,255,0.18) 0%, rgba(79,220,255,0.08) 45%, rgba(79,220,255,0.03) 70%),
              linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.03) 22%, rgba(6,16,37,0.94) 100%)
            `
            : `
              radial-gradient(700px 140px at 15% -10%, rgba(79,220,255,0.10) 0%, rgba(79,220,255,0.05) 45%, rgba(79,220,255,0.02) 70%),
              linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.03) 22%, rgba(6,16,37,0.94) 100%)
            `,
          color: "#fff",
          fontWeight: 950,
          fontSize: 12,
          letterSpacing: 0.2,
          textAlign: "left",
          cursor: "pointer",
          boxShadow: selected
            ? "0 10px 22px rgba(0,0,0,0.18), 0 0 18px rgba(79,220,255,0.22)"
            : hv
            ? "0 10px 22px rgba(0,0,0,0.18), 0 0 16px rgba(79,220,255,0.16)"
            : "0 10px 22px rgba(0,0,0,0.18), 0 0 12px rgba(79,220,255,0.10)",
          transition: "border 160ms ease, box-shadow 160ms ease, transform 120ms ease",
          userSelect: "none",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          transform: hv ? "translateY(-1px)" : "translateY(0px)",
        }}
      >
        {label}
      </button>
    );
  };

  const Card = ({
    title,
    items,
    onItemClick,
    selectedLabel,
  }: {
    title: string;
    items: string[];
    onItemClick?: (label: string) => void;
    selectedLabel?: string;
  }) => {
    const [hv, setHv] = useState(false);

    return (
      <div
        onMouseEnter={() => setHv(true)}
        onMouseLeave={() => setHv(false)}
        style={{
          borderRadius: 18,
          border: hv ? "1px solid rgba(79,220,255,0.50)" : "1px solid rgba(79,220,255,0.28)",
          background: `
            radial-gradient(1200px 420px at 18% 12%, rgba(79,220,255,0.10) 0%, rgba(2,11,24,0) 52%),
            radial-gradient(900px 360px at 86% 18%, rgba(79,220,255,0.05) 0%, rgba(2,11,24,0) 55%),
            linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.03) 22%, rgba(6,16,37,0.94) 100%)
          `,
          overflow: "hidden",
          boxShadow: hv
            ? "0 22px 60px rgba(0,0,0,0.55), 0 0 24px rgba(79,220,255,0.16)"
            : "0 22px 60px rgba(0,0,0,0.55), 0 0 18px rgba(79,220,255,0.12)",
          transition: "border 160ms ease, box-shadow 160ms ease",
          position: "relative",
        }}
      >
        {/* ✅ FUNDO INTERNO (o que tu pediu) */}
        <div
          aria-hidden
          style={{
            pointerEvents: "none",
            position: "absolute",
            inset: 0,
            background: `
              radial-gradient(820px 220px at 22% -10%, rgba(79,220,255,0.14) 0%, rgba(79,220,255,0.06) 45%, rgba(0,0,0,0) 72%),
              radial-gradient(780px 220px at 88% 0%, rgba(79,220,255,0.09) 0%, rgba(0,0,0,0) 70%),
              linear-gradient(180deg, rgba(1,27,60,0.35) 0%, rgba(6,16,37,0.78) 55%, rgba(6,16,37,0.92) 100%)
            `,
            opacity: 0.95,
          }}
        />

        <div
          style={{
            position: "relative",
            zIndex: 1,
            padding: "12px 14px",
            borderBottom: "1px solid rgba(255,255,255,0.10)",
            background: `
              linear-gradient(
                180deg,
                rgba(17,88,105,0.70) 0%,
                rgba(27,93,109,0.70) 40%,
                rgba(53,144,167,0.70) 100%
              )
            `,
            fontWeight: 950,
            fontSize: 12,
            letterSpacing: 0.6,
            color: "#eaf0ff",
            textTransform: "uppercase",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
            userSelect: "none",
          }}
        >
          <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{title}</span>
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: 999,
              background: "#4fdcff",
              boxShadow: "0 0 0 4px rgba(79,220,255,0.18)",
              flex: "0 0 auto",
              opacity: 0.95,
            }}
          />
        </div>

        <div style={{ position: "relative", zIndex: 1, padding: 14, display: "grid", gap: 10 }}>
          {items.map((label) => (
            <Item
              key={label}
              label={label}
              onClick={onItemClick ? () => onItemClick(label) : undefined}
              selected={!!selectedLabel && selectedLabel.toLowerCase() === label.toLowerCase()}
            />
          ))}
        </div>
      </div>
    );
  };

  const selectedPlataforma = plataformaFilter ? `Pedidos - ${plataformaFilter}` : "";
  const selectedPagamento = pagamentoFilter ? `Entradas - ${pagamentoFilter}` : "";
  const selectedAtendimento = atendimentoFilter
    ? atendimentoFilter.toUpperCase() === "RETIRADA"
      ? "Retiradas"
      : atendimentoFilter.toUpperCase() === "ENTREGA"
      ? "Entregas"
      : atendimentoFilter.toUpperCase() === "MESA"
      ? "Mesas"
      : atendimentoFilter
    : "";

  const [hoverBtn, setHoverBtn] = useState(false);

  const HeaderButton = (
    <div ref={placeholderRef} style={{ flex: "0 0 auto" }}>
      <button
        type="button"
        onClick={onToggle}
        onMouseEnter={() => setHoverBtn(true)}
        onMouseLeave={() => setHoverBtn(false)}
        style={{
          width: CLOSED_W,
          height: CLOSED_H,
          borderRadius: 12,
          border: hoverBtn ? "1px solid rgba(79,220,255,0.55)" : "1px solid rgba(79,220,255,0.40)",
          background: `
            radial-gradient(700px 140px at 15% -10%, rgba(79,220,255,0.10) 0%, rgba(79,220,255,0.05) 40%, rgba(79,220,255,0.03) 65%),
            linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.03) 22%, rgba(6,16,37,0.94) 100%)
          `,
          color: "#fff",
          fontWeight: 950,
          letterSpacing: 0.2,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 14px",
          boxShadow: hoverBtn ? glow(true) : glow(false),
          userSelect: "none",
          whiteSpace: "nowrap",
          transition: "border 160ms ease, box-shadow 160ms ease",
        }}
        title="Fechamento de Caixa"
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span
            style={{
              width: 12,
              height: 12,
              borderRadius: 999,
              background: "#4fdcff",
              boxShadow: "0 0 0 4px rgba(79,220,255,0.18)",
              flex: "0 0 auto",
            }}
          />
          <span>Fechamento de Caixa</span>
        </div>

        {open ? (
          <span
            style={{
              width: 26,
              height: 26,
              borderRadius: 999,
              border: "1px solid rgba(255,255,255,0.35)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 16,
              lineHeight: "16px",
              fontWeight: 900,
              userSelect: "none",
            }}
          >
            ✕
          </span>
        ) : (
          <span
            style={{
              width: 26,
              height: 26,
              borderRadius: 999,
              border: "1px solid rgba(255,255,255,0.16)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 14,
              opacity: 0.85,
              userSelect: "none",
            }}
          >
            ▾
          </span>
        )}
      </button>
    </div>
  );

  const OverlayPanel = useMemo(() => {
    if (!open) return null;

    const w = anim ? OPEN_W : CLOSED_W;
    const h = anim ? OPEN_H : CLOSED_H;

    const margin = 10;
    const maxLeft = Math.max(margin, (vp.w || 0) - w - margin);
    const maxTop = Math.max(margin, (vp.h || 0) - h - margin);

    const left = Math.min(Math.max(margin, anchor.left), maxLeft);
    const top = Math.min(Math.max(margin, anchor.top), maxTop);

    return (
      <div style={{ position: "fixed", inset: 0, zIndex: 999999, pointerEvents: "none" }}>
        {/* ✅ FUNDO FINtEX (com gradiente + blur) */}
        <div
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) onToggle();
          }}
          style={{
            position: "fixed",
            inset: 0,
            pointerEvents: "auto",
            background: `
              radial-gradient(1200px 700px at 18% 18%, rgba(79,220,255,0.14) 0%, rgba(2,11,24,0) 55%),
              radial-gradient(1000px 700px at 86% 24%, rgba(79,220,255,0.08) 0%, rgba(2,11,24,0) 55%),
              linear-gradient(180deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.62) 100%)
            `,
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
          }}
        />

        {/* PANEL */}
        <div
          style={{
            position: "fixed",
            top,
            left,
            width: w,
            height: h,
            boxSizing: "border-box",
            borderRadius: 16,
            overflow: "hidden",
            pointerEvents: "auto",
            border: "1px solid rgba(79,220,255,0.30)",
            background: `
              radial-gradient(1200px 420px at 18% 12%, rgba(79,220,255,0.12) 0%, rgba(2,11,24,0) 52%),
              radial-gradient(1000px 360px at 86% 18%, rgba(79,220,255,0.06) 0%, rgba(2,11,24,0) 55%),
              linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.03) 22%, rgba(6,16,37,0.96) 100%)
            `,
            boxShadow: "0 28px 90px rgba(0,0,0,0.70), 0 0 34px rgba(79,220,255,0.18)",
            transition: "width 420ms cubic-bezier(.2,.9,.2,1), height 420ms cubic-bezier(.2,.9,.2,1)",
            willChange: "width,height",
          }}
        >
          <button
            type="button"
            onClick={onToggle}
            style={{
              width: "100%",
              height: 44,
              background: `
                linear-gradient(
                  180deg,
                  rgba(17,88,105,0.70) 0%,
                  rgba(27,93,109,0.70) 40%,
                  rgba(53,144,167,0.70) 100%
                )
              `,
              color: "#eaf0ff",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0 14px",
              fontWeight: 950,
              fontSize: 13,
              letterSpacing: 0.3,
              userSelect: "none",
              borderBottom: "1px solid rgba(255,255,255,0.10)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 999,
                  background: "#4fdcff",
                  boxShadow: "0 0 0 4px rgba(79,220,255,0.18)",
                }}
              />
              FECHAMENTO DE CAIXA
            </div>

            <span
              style={{
                width: 28,
                height: 28,
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.22)",
                background: "rgba(0,0,0,0.16)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 16,
                lineHeight: "16px",
              }}
            >
              ✕
            </span>
          </button>

          <div
            style={{
              opacity: anim ? 1 : 0,
              transform: anim ? "translateY(0)" : "translateY(-10px)",
              transition: "opacity 220ms ease 140ms, transform 260ms ease 140ms",
              pointerEvents: anim ? "auto" : "none",
              height: "calc(100% - 44px)",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "12px 14px",
                fontSize: 12,
                fontWeight: 900,
                color: "rgba(234,240,255,0.92)",
                borderBottom: "1px solid rgba(255,255,255,0.10)",
                background: "rgba(255,255,255,0.03)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              <span style={{ opacity: 0.92 }}>Filtros rápidos</span>

              <button
                type="button"
                onClick={() => {
                  onPickMotoboy?.("");
                  onPickPlataforma?.("");
                  onPickPagamento?.("");
                  onPickAtendimento?.("");
                }}
                style={{
                  height: 32,
                  padding: "0 12px",
                  borderRadius: 999,
                  border: "1px solid rgba(255,255,255,0.14)",
                  background: "rgba(0,0,0,0.18)",
                  color: "#eaf0ff",
                  fontWeight: 950,
                  fontSize: 11,
                  cursor: "pointer",
                  boxShadow: "0 10px 22px rgba(0,0,0,0.18)",
                  userSelect: "none",
                }}
                title="Limpar filtros"
              >
                Limpar
              </button>
            </div>

            <div style={{ padding: 14, flex: 1, overflowY: "auto", overflowX: "hidden" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <Card
                  title="Fechamento - Entregas"
                  items={["Motoboy 01", "Motoboy 02", "Motoboy 03", "Motoboy 04", "Motoboy 05", "Motoboy 06"]}
                  onItemClick={(label) => onPickMotoboy?.(label)}
                  selectedLabel={responsavelFilter}
                />

                <Card
                  title="Pedidos - Plataforma"
                  items={["Pedidos - Balcão", "Pedidos - Aiqfome", "Pedidos - Delivery Much", "Pedidos - Ifood", "Pedidos - WhatsApp"]}
                  onItemClick={(label) => onPickPlataforma?.(stripPrefix(label, "Pedidos - "))}
                  selectedLabel={selectedPlataforma}
                />

                <Card
                  title="Entradas"
                  items={[
                    "Entradas - Dinheiro",
                    "Entradas - Pix",
                    "Entradas - Cartão de Crédito",
                    "Entradas - Cartão de Débito",
                    "Entradas - Pagamento Online",
                    "Entradas - Marcados",
                  ]}
                  onItemClick={(label) => onPickPagamento?.(stripPrefix(label, "Entradas - "))}
                  selectedLabel={selectedPagamento}
                />

                <Card
                  title="Atendimento"
                  items={["Retiradas", "Entregas", "Mesas"]}
                  onItemClick={(label) => onPickAtendimento?.(label)}
                  selectedLabel={selectedAtendimento}
                />
              </div>
            </div>

            <div
              style={{
                padding: "10px 14px",
                borderTop: "1px solid rgba(255,255,255,0.10)",
                fontSize: 11,
                fontWeight: 900,
                color: "rgba(234,240,255,0.75)",
                background: "rgba(255,255,255,0.03)",
                userSelect: "none",
              }}
            >
              Usar apenas um filtro por vez para obter resultados precisos.
            </div>
          </div>
        </div>
      </div>
    );
  }, [
    open,
    anim,
    anchor.left,
    anchor.top,
    vp.w,
    vp.h,
    onPickMotoboy,
    responsavelFilter,
    onPickPlataforma,
    plataformaFilter,
    onPickPagamento,
    pagamentoFilter,
    onPickAtendimento,
    atendimentoFilter,
    onToggle,
  ]);

  return (
    <>
      {HeaderButton}
      {mounted && OverlayPanel ? createPortal(OverlayPanel, document.body) : null}
    </>
  );
}
