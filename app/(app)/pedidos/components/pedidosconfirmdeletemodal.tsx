"use client";

import React, { useEffect, useState } from "react";
import { AlertTriangle, Trash2, X } from "lucide-react";

type Props = {
  open: boolean;
  busy: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export default function PedidosConfirmDeleteModal({ open, busy, onClose, onConfirm }: Props) {
  const [hoverCancel, setHoverCancel] = useState(false);
  const [hoverDanger, setHoverDanger] = useState(false);

  const modalBtn = (kind: "cancel" | "danger", hover: boolean, disabled: boolean): React.CSSProperties => {
    const isDanger = kind === "danger";
    const border = isDanger
      ? hover
        ? "rgba(225,11,11,0.85)"
        : "rgba(225,11,11,0.55)"
      : hover
      ? "rgba(79,220,255,0.85)"
      : "rgba(79,220,255,0.55)";

    const glow = isDanger
      ? hover
        ? "0 0 22px rgba(225,11,11,0.28)"
        : "0 0 18px rgba(225,11,11,0.18)"
      : hover
      ? "0 0 22px rgba(79,220,255,0.22)"
      : "0 0 18px rgba(79,220,255,0.14)";

    return {
      height: 40,
      minWidth: 140,
      padding: "0 16px",
      borderRadius: 999,
      border: `1px solid ${border}`,
      background: `
        radial-gradient(700px 140px at 15% -10%,
          ${isDanger ? "rgba(225,11,11,0.12)" : "rgba(79,220,255,0.10)"} 0%,
          ${isDanger ? "rgba(225,11,11,0.06)" : "rgba(79,220,255,0.05)"} 40%,
          rgba(79,220,255,0.02) 70%
        ),
        linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.03) 22%, rgba(6,16,37,0.94) 100%)
      `,
      color: "#fff",
      fontWeight: 950,
      fontSize: 12,
      cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.65 : 1,
      boxShadow: `0 10px 22px rgba(0,0,0,0.18), ${glow}`,
      userSelect: "none",
      transition: "border 160ms ease, box-shadow 160ms ease, opacity 160ms ease",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      letterSpacing: 0.2,
    };
  };

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
      if (e.key === "Enter") {
        if (!busy) onConfirm();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, busy, onClose, onConfirm]);

  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        background: "rgba(0,0,0,0.62)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 18,
      }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: 520,
          maxWidth: "92vw",
          borderRadius: 18,
          overflow: "hidden",
          border: "1px solid rgba(225,11,11,0.35)",
          background: `
            radial-gradient(900px 220px at 15% -10%, rgba(225,11,11,0.12) 0%, rgba(225,11,11,0.06) 40%, rgba(225,11,11,0.02) 70%),
            radial-gradient(1000px 300px at 20% -10%, rgba(79,220,255,0.10) 0%, rgba(79,220,255,0.04) 45%, rgba(79,220,255,0.02) 70%),
            linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.03) 22%, rgba(6,16,37,0.96) 100%)
          `,
          boxShadow:
            "0 28px 80px rgba(0,0,0,0.65), 0 0 34px rgba(225,11,11,0.20), 0 0 26px rgba(79,220,255,0.10)",
        }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div
          style={{
            height: 56,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 16px",
            borderBottom: "1px solid rgba(255,255,255,0.10)",
            background: "rgba(255,255,255,0.03)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              fontWeight: 950,
              letterSpacing: 0.2,
              fontSize: 14,
              textTransform: "uppercase",
              color: "#eaf0ff",
            }}
          >
            <span
              style={{
                width: 28,
                height: 28,
                borderRadius: 10,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                border: "1px solid rgba(225,11,11,0.40)",
                background: "rgba(225,11,11,0.08)",
                boxShadow: "0 0 18px rgba(225,11,11,0.18)",
              }}
            >
              <AlertTriangle size={16} />
            </span>
            <span>Confirmar exclusão</span>
          </div>

          <button
            type="button"
            disabled={busy}
            onClick={onClose}
            title="Fechar"
            style={{
              width: 34,
              height: 34,
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.10)",
              background: "rgba(255,255,255,0.04)",
              color: "#fff",
              cursor: busy ? "not-allowed" : "pointer",
              opacity: busy ? 0.55 : 1,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 10px 22px rgba(0,0,0,0.18)",
            }}
          >
            <X size={16} />
          </button>
        </div>

        <div style={{ padding: "18px 18px 14px 18px", color: "#eaf0ff" }}>
          <div style={{ fontWeight: 900, fontSize: 13, opacity: 0.9 }}>Este pedido será removido do sistema.</div>

          <div style={{ marginTop: 12, fontSize: 14, fontWeight: 800, opacity: 0.95, lineHeight: "20px" }}>
            Apagar este pedido? <span style={{ opacity: 0.85 }}>Isso não dá pra desfazer.</span>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", padding: "0 18px 18px 18px" }}>
          <button
            type="button"
            disabled={busy}
            onClick={onClose}
            onMouseEnter={() => setHoverCancel(true)}
            onMouseLeave={() => setHoverCancel(false)}
            style={modalBtn("cancel", hoverCancel, busy)}
          >
            <X size={16} />
            Cancelar
          </button>

          <button
            type="button"
            disabled={busy}
            onClick={onConfirm}
            onMouseEnter={() => setHoverDanger(true)}
            onMouseLeave={() => setHoverDanger(false)}
            style={modalBtn("danger", hoverDanger, busy)}
          >
            <Trash2 size={16} />
            {busy ? "Apagando..." : "Apagar"}
          </button>
        </div>
      </div>
    </div>
  );
}
