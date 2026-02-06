"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, List, Wallet, Settings, CalendarClock, BarChart3 } from "lucide-react";
import { useState } from "react";

type Item = { href: string; label: string; Icon: any };

const ITEMS: Item[] = [
  // ✅ NOVO: Dashboard
  { href: "/dashboard", label: "Dashboard", Icon: BarChart3 },

  { href: "/pdv", label: "PDV", Icon: LayoutGrid },
  { href: "/pedidos", label: "Pedidos", Icon: List },

  // ✅ Caixa Diário
  { href: "/caixa-diario", label: "Caixa Diário", Icon: Wallet },

  // ✅ Reservas (AGORA ABAIXO do Caixa Diário)
  { href: "/reservas", label: "Reservas", Icon: CalendarClock },

  { href: "/configuracoes", label: "Configurações", Icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [hoveredHref, setHoveredHref] = useState<string | null>(null);

  const CLOSED_W = 96;
  const OPEN_W = 280;

  // ✅ mesma altura da área abaixo da topbar
  const TOPBAR_H = 76;

  const AQUA = "rgba(79,220,255,0.45)";
  const AQUA_SOFT = "rgba(79,220,255,0.22)";

  return (
    <aside
      style={{
        width: open ? OPEN_W : CLOSED_W,
        height: `calc(100vh - ${TOPBAR_H}px)`,
        background: "#011b3c",
        transition: "width 180ms ease",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => {
        setOpen(false);
        setHoveredHref(null);
      }}
    >
      {/* MENU */}
      <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 14 }}>
        {ITEMS.map((it) => {
          const active = pathname === it.href;
          const hovered = hoveredHref === it.href;
          const Icon = it.Icon;

          // ✅ glow só quando hover e NÃO ativo (ativo já tem destaque)
          const glowOn = hovered && !active;

          return (
            <Link
              key={it.href}
              href={it.href}
              title={!open ? it.label : undefined}
              onMouseEnter={() => setHoveredHref(it.href)}
              onMouseLeave={() => setHoveredHref((cur) => (cur === it.href ? null : cur))}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                height: 64,
                padding: "0 8px",
                borderRadius: 18,
                textDecoration: "none",
                color: "#fff",

                background: active ? "rgba(0,182,194,0.22)" : "rgba(255,255,255,0.10)",

                // ✅ borda base + borda aqua no hover
                border: glowOn ? "1px solid rgba(79,220,255,0.55)" : "1px solid rgba(255,255,255,0.12)",

                // ✅ brilho externo (igual vibe Cliente.tsx)
                boxShadow: active
                  ? "inset 0 0 0 1px rgba(255,255,255,0.12)"
                  : glowOn
                  ? `inset 0 0 0 1px rgba(255,255,255,0.06), 0 0 0 1px rgba(79,220,255,0.18), 0 0 26px ${AQUA}, 0 10px 22px rgba(0,0,0,0.20)`
                  : `inset 0 0 0 1px rgba(255,255,255,0.10), 0 0 16px ${AQUA_SOFT}`,

                transition: "border 160ms ease, box-shadow 160ms ease, background 160ms ease",
              }}
            >
              {/* ÍCONE — SEM FUNDO / SEM BORDA / BRILHO NO SVG */}
              <div
                style={{
                  width: 52,
                  height: 52,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flex: "0 0 52px",
                  background: "transparent",
                  border: "none",
                }}
              >
                <Icon
                  size={28}
                  color={active || hovered ? "#4fdcff" : "#ffffff"}
                  style={{
                    filter:
                      active || hovered
                        ? `
                          drop-shadow(0 0 6px rgba(79,220,255,0.55))
                          drop-shadow(0 0 14px rgba(79,220,255,0.35))
                          drop-shadow(0 0 26px rgba(79,220,255,0.18))
                        `
                        : "none",
                    transition: "filter 160ms ease, color 160ms ease",
                  }}
                />
              </div>

              <div
                style={{
                  fontSize: 20,
                  fontWeight: 800,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  maxWidth: open ? 220 : 0,
                  opacity: open ? 1 : 0,
                  transition: "max-width 180ms ease, opacity 120ms ease",
                }}
              >
                {it.label}
              </div>
            </Link>
          );
        })}
      </div>
    </aside>
  );
}
