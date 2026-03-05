"use client";

import React, { useMemo, useState } from "react";

/**
 * Saídas (mobile) — UI por categoria + detalhamento ao clicar
 * ✅ 5 categorias fixas (todas AQUA)
 * ✅ Sem barras
 * ✅ Sem "entradas" e sem "% sobre faturamento"
 * ✅ Seta (▾/▴) ao lado do título indicando expandir
 * ✅ SEM MOCK: tudo vem do backend (data.items) a partir de public.cash_entries (type='expense')
 */

const CARD_BG =
  "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))";
const CARD_INNER = "rgba(2,11,24,0.42)";
const AQUA_LINE = "rgba(79,220,255,0.18)";

type Accent = "aqua" | "green" | "yellow" | "red" | "purple";

function fmtBRL(v: number) {
  const n = Number(v) || 0;
  try {
    return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  } catch {
    return `R$ ${n.toFixed(2)}`;
  }
}

function accentRGB(accent: Accent) {
  switch (accent) {
    case "green":
      return {
        line: "rgba(80,255,160,0.35)",
        glow: "rgba(80,255,160,0.14)",
        dot: "rgba(80,255,160,0.95)",
      };
    case "yellow":
      return {
        line: "rgba(255,200,80,0.35)",
        glow: "rgba(255,200,80,0.14)",
        dot: "rgba(255,200,80,0.95)",
      };
    case "red":
      return {
        line: "rgba(255,100,120,0.35)",
        glow: "rgba(255,100,120,0.14)",
        dot: "rgba(255,100,120,0.95)",
      };
    case "purple":
      return {
        line: "rgba(160,120,255,0.35)",
        glow: "rgba(160,120,255,0.14)",
        dot: "rgba(160,120,255,0.95)",
      };
    default:
      return {
        line: "rgba(79,220,255,0.35)",
        glow: "rgba(79,220,255,0.14)",
        dot: "rgba(79,220,255,0.95)",
      };
  }
}

function Shell({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        borderRadius: 22,
        padding: 14,
        background: CARD_BG,
        border: `1px solid ${AQUA_LINE}`,
        boxShadow:
          "0 0 0 1px rgba(79,220,255,0.06) inset, 0 26px 70px rgba(0,0,0,0.42)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 12, fontWeight: 1000, opacity: 0.9 }}>
      {children}
    </div>
  );
}

function RowCard({
  title,
  right,
  accent = "aqua",
  open,
  onToggle,
  children,
}: {
  title: string;
  right: string;
  accent?: Accent;
  open: boolean;
  onToggle: () => void;
  children?: React.ReactNode;
}) {
  const a = accentRGB(accent);

  return (
    <div
      style={{
        borderRadius: 18,
        background: CARD_INNER,
        border: `1px solid ${a.line}`,
        boxShadow: `0 0 0 1px rgba(255,255,255,0.02) inset, 0 0 26px ${a.glow}`,
        overflow: "hidden",
      }}
    >
      <button
        type="button"
        onClick={onToggle}
        style={{
          width: "100%",
          cursor: "pointer",
          padding: 12,
          background: "transparent",
          border: "none",
          color: "inherit",
          textAlign: "left",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: 999,
                background: a.dot,
                boxShadow: `0 0 12px ${a.dot}`,
                display: "inline-block",
                flex: "0 0 auto",
              }}
            />

            <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
              <div
                style={{
                  fontWeight: 1000,
                  fontSize: 13,
                  color: "rgba(255,255,255,0.96)",
                  whiteSpace: "nowrap",
                  flex: "0 0 auto",
                }}
              >
                {title.toUpperCase()}
              </div>

              <div
                style={{
                  fontSize: 14,
                  fontWeight: 1000,
                  opacity: 0.9,
                  transform: open ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "transform 160ms ease",
                  lineHeight: 1,
                  marginTop: 1,
                }}
                aria-hidden
              >
                ▾
              </div>
            </div>
          </div>

          <div
            style={{
              fontSize: 12,
              fontWeight: 1000,
              opacity: 0.92,
              whiteSpace: "nowrap",
              flex: "0 0 auto",
            }}
          >
            {right}
          </div>
        </div>
      </button>

      {open ? (
        <div
          style={{
            padding: "10px 12px 12px",
            borderTop: "1px solid rgba(255,255,255,0.08)",
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.02), rgba(0,0,0,0))",
          }}
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}

/* ========================= Tipos (cash_entries) ========================= */

type CategoriaKey =
  | "mao_obra"
  | "logistica"
  | "insumos"
  | "marketing"
  | "variaveis";

type CashEntryType = "expense" | "manual_in" | string;

type CashEntry = {
  id: string;
  company_id?: string | null;
  op_date?: string | null; // date
  type: CashEntryType; // expense = saída
  category?: string | null;
  description?: string | null;
  amount: number | string;
  occurred_at?: string | null; // timestamptz
  created_at?: string | null;  // timestamptz
};

type SaidasProps = {
  faturamento?: number; // opcional
  data?: {
    items?: CashEntry[]; // ✅ backend manda cash_entries aqui
  };
};

/* ========================= Helpers ========================= */

const CATEGORIAS_UI: Array<{ key: CategoriaKey; label: string; accent: Accent }> = [
  { key: "mao_obra", label: "Mão de Obra", accent: "aqua" },
  { key: "logistica", label: "Logística", accent: "aqua" },
  { key: "insumos", label: "Insumos", accent: "aqua" },
  { key: "marketing", label: "Marketing", accent: "aqua" },
  { key: "variaveis", label: "Variáveis", accent: "aqua" },
];

function mapCategoria(raw: string | null | undefined): CategoriaKey {
  const c = String(raw || "").trim().toLowerCase();

  if (c.includes("mão") || c.includes("mao") || c.includes("folha") || c.includes("sal") || c.includes("encargo"))
    return "mao_obra";

  if (c.includes("log") || c.includes("entrega") || c.includes("moto") || c.includes("combust") || c.includes("frete"))
    return "logistica";

  if (c.includes("insumo") || c.includes("merc") || c.includes("ingred") || c.includes("refor") || c.includes("compra"))
    return "insumos";

  if (c.includes("market") || c.includes("tráfego") || c.includes("trafego") || c.includes("ads") || c.includes("meta"))
    return "marketing";

  return "variaveis";
}

function toNumber(v: number | string) {
  const n = typeof v === "string" ? Number(v) : v;
  return Number.isFinite(n) ? n : 0;
}

function fmtDataBR(iso?: string | null) {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    return `${dd}/${mm}`;
  } catch {
    return "";
  }
}

/* ========================= Component ========================= */

export default function Saidas({ faturamento = 0, data }: SaidasProps) {
  void faturamento;

  const [openKey, setOpenKey] = useState<CategoriaKey | null>(null);

  const items = useMemo(() => {
    const arr = data?.items ?? [];
    // ✅ Saídas = expense
    return arr.filter((x) => String(x.type || "").toLowerCase() === "expense");
  }, [data]);

  const grouped = useMemo(() => {
    const base: Record<CategoriaKey, CashEntry[]> = {
      mao_obra: [],
      logistica: [],
      insumos: [],
      marketing: [],
      variaveis: [],
    };

    for (const it of items) {
      const key = mapCategoria(it.category);
      base[key].push(it);
    }

    // ordena por occurred_at/created_at desc
    (Object.keys(base) as CategoriaKey[]).forEach((k) => {
      base[k] = base[k].sort((a, b) => {
        const da = a.occurred_at || a.created_at || "";
        const db = b.occurred_at || b.created_at || "";
        return db.localeCompare(da);
      });
    });

    return base;
  }, [items]);

  const totals = useMemo(() => {
    const t: Record<CategoriaKey, number> = {
      mao_obra: 0,
      logistica: 0,
      insumos: 0,
      marketing: 0,
      variaveis: 0,
    };

    (Object.keys(t) as CategoriaKey[]).forEach((k) => {
      t[k] = grouped[k].reduce((acc, it) => acc + toNumber(it.amount), 0);
    });

    return t;
  }, [grouped]);

  const totalDespesas = useMemo(() => {
    return (Object.keys(totals) as CategoriaKey[]).reduce((acc, k) => acc + totals[k], 0);
  }, [totals]);

  return (
    <Shell>
      <SectionLabel>Saídas por Categoria</SectionLabel>

      <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
        {CATEGORIAS_UI.map((c) => {
          const list = grouped[c.key];
          const total = totals[c.key];

          return (
            <RowCard
              key={c.key}
              title={c.label}
              right={fmtBRL(total)}
              accent="aqua"
              open={openKey === c.key}
              onToggle={() => setOpenKey((prev) => (prev === c.key ? null : c.key))}
            >
              <div style={{ display: "grid", gap: 8 }}>
                {list.length === 0 ? (
                  <div
                    style={{
                      padding: "10px 10px",
                      borderRadius: 12,
                      border: "1px solid rgba(255,255,255,0.08)",
                      background: "rgba(0,0,0,0.14)",
                      fontSize: 12,
                      fontWeight: 900,
                      opacity: 0.75,
                    }}
                  >
                    Nenhuma saída nessa categoria.
                  </div>
                ) : (
                  list.map((it) => (
                    <div
                      key={it.id}
                      style={{
                        display: "flex",
                        alignItems: "baseline",
                        justifyContent: "space-between",
                        gap: 12,
                        padding: "8px 10px",
                        borderRadius: 12,
                        border: "1px solid rgba(255,255,255,0.08)",
                        background: "rgba(0,0,0,0.18)",
                      }}
                    >
                      <div style={{ minWidth: 0 }}>
                        <div
                          style={{
                            fontWeight: 1000,
                            fontSize: 12,
                            color: "rgba(255,255,255,0.92)",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {(it.description && it.description.trim()) || "(sem descrição)"}
                        </div>

                        <div
                          style={{
                            marginTop: 4,
                            fontSize: 11,
                            opacity: 0.7,
                            fontWeight: 900,
                            display: "flex",
                            gap: 10,
                            flexWrap: "wrap",
                          }}
                        >
                          <span>{fmtDataBR(it.occurred_at || it.created_at)}</span>
                          {it.category ? <span>{it.category}</span> : null}
                        </div>
                      </div>

                      <div style={{ fontWeight: 1000, fontSize: 12, opacity: 0.92 }}>
                        {fmtBRL(toNumber(it.amount))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </RowCard>
          );
        })}

        <div
          style={{
            marginTop: 6,
            paddingTop: 10,
            borderTop: "1px solid rgba(255,255,255,0.10)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              justifyContent: "space-between",
              gap: 12,
              padding: "0 6px",
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 1000,
                letterSpacing: 0.4,
                opacity: 0.78,
                textTransform: "uppercase",
                whiteSpace: "nowrap",
              }}
            >
              Despesas totais
            </div>

            <div
              style={{
                fontSize: 13,
                fontWeight: 1100 as any,
                opacity: 0.96,
                whiteSpace: "nowrap",
              }}
            >
              {fmtBRL(totalDespesas)}
            </div>
          </div>
        </div>
      </div>
    </Shell>
  );
}