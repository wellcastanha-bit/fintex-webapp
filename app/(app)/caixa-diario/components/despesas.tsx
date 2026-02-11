"use client";

import React, { useMemo, useRef, useState } from "react";
import type { Expense } from "./caixa-diario";

function TrashIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </svg>
  );
}

/* =========================
   ✅ FRONT/UI ONLY
   - sem fetch, sem /api, sem backend
   ✅ FORMATAÇÃO IGUAL Cliente.tsx / EntradasTab
========================= */

const AQUA = "rgba(79,220,255,0.45)";
const AQUA_SOFT = "rgba(79,220,255,0.22)";

function CardShell({ children, cardGlowOn }: { children: React.ReactNode; cardGlowOn: boolean }) {
  return (
    <div
      style={{
        borderRadius: 24,
        position: "relative",
        overflow: "hidden",
        boxSizing: "border-box",
        background: `
          radial-gradient(
            900px 240px at 15% -10%,
            rgba(79, 220, 255, 0.10) 0%,
            rgba(79,220,255,0.05) 40%,
            rgba(79, 220, 255, 0.03) 65%
          ),
          linear-gradient(
            180deg,
            rgba(255,255,255,0.06) 0%,
            rgba(255,255,255,0.03) 22%,
            rgba(6,16,37,0.94) 100%
          )
        `,
        border: cardGlowOn ? "1px solid rgba(79,220,255,0.55)" : "1px solid rgba(79,220,255,0.40)",
        boxShadow: cardGlowOn
          ? `
            0 20px 55px rgba(0,0,0,0.60),
            0 1px 0 rgba(255,255,255,0.08),
            0 0 26px ${AQUA}
          `
          : `
            0 20px 55px rgba(0,0,0,0.60),
            0 1px 0 rgba(255,255,255,0.08),
            0 0 18px ${AQUA_SOFT}
          `,
        transition: "border 160ms ease, box-shadow 160ms ease",
      }}
    >
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: 24,
          pointerEvents: "none",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.10), inset 0 0 0 1px rgba(255,255,255,0.05)",
        }}
      />
      <div style={{ position: "relative", zIndex: 1 }}>{children}</div>
    </div>
  );
}

function FieldShell({ children, glowOn }: { children: React.ReactNode; glowOn: boolean }) {
  return (
    <div
      style={{
        borderRadius: 12,
        position: "relative",
        overflow: "hidden",
        height: 52,
        display: "flex",
        alignItems: "center",
        padding: "0 14px",
        background: `
          linear-gradient(
            180deg,
            rgba(255,255,255,0.03) 0%,
            rgba(255,255,255,0.04) 25%,
            rgba(6,16,37,0.95) 100%
          )
        `,
        border: glowOn ? "1px solid rgba(79,220,255,0.55)" : "1px solid rgba(255,255,255,0.14)",
        boxShadow: glowOn
          ? `
            inset 0 1px 0 rgba(255,255,255,0.12),
            0 0 18px rgba(79,220,255,0.45)
          `
          : `
            inset 0 1px 0 rgba(255,255,255,0.10),
            inset 0 -1px 0 rgba(0,0,0,0.45)
          `,
        transition: "border 160ms ease, box-shadow 160ms ease",
      }}
    >
      {children}
    </div>
  );
}

function UiInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      style={{
        flex: 1,
        height: "100%",
        background: "transparent",
        border: "none",
        outline: "none",
        color: "#eaf0ff",
        fontSize: 18,
        fontWeight: 500,
      }}
      className={"placeholder:text-slate-400/60 " + (props.className ?? "")}
    />
  );
}

/* ✅ MANTÉM O LAYOUT IGUAL (TRANSPARENTE) + FUNDO DO DROPDOWN (options) */
const UiSelect = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(function UiSelect(
  props,
  ref
) {
  return (
    <select
      ref={ref}
      {...props}
      style={{
        flex: 1,
        height: "100%",
        width: "100%",
        background: "transparent",
        border: "none",
        outline: "none",
        color: "#eaf0ff",
        fontSize: 15,
        fontWeight: 600,
        WebkitAppearance: "none",
        MozAppearance: "none",
        appearance: "none",
        cursor: "pointer",
        ...(props.style ?? {}),
      }}
      className={props.className ?? ""}
    >
      {React.Children.map(props.children, (child) => {
        if (!React.isValidElement(child)) return child;

        if (child.type === "option") {
          return React.cloneElement(child as any, {
            style: {
              backgroundColor: "#0b192d",
              color: "#eaf0ff",
            },
          });
        }

        return child;
      })}
    </select>
  );
});

function SelectChevron() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      style={{ opacity: 0.9 }}
      fill="none"
      stroke="rgba(79,220,255,0.85)"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

function DeleteBtn({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="h-9 w-9 inline-flex items-center justify-center rounded-lg transition text-red-300 hover:text-red-200 hover:bg-red-500/10"
      title="Apagar"
    >
      <TrashIcon className="h-4 w-4" />
    </button>
  );
}

function brl(n: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n);
}

type Props = {
  expenses: Expense[];
  setExpenses: React.Dispatch<React.SetStateAction<Expense[]>>;

  expenseCategory: string;
  setExpenseCategory: React.Dispatch<React.SetStateAction<string>>;

  expenseAmount: string;
  setExpenseAmount: React.Dispatch<React.SetStateAction<string>>;

  expenseDescription: string;
  setExpenseDescription: React.Dispatch<React.SetStateAction<string>>;

  addExpense: () => void;
  totalDespesas: number;
};

export default function DespesasTab({
  expenses,
  setExpenses,
  expenseCategory,
  setExpenseCategory,
  expenseAmount,
  setExpenseAmount,
  expenseDescription,
  setExpenseDescription,
  addExpense,
  totalDespesas,
}: Props) {
  const [hoverRegCard, setHoverRegCard] = useState(false);
  const [hoverHistCard, setHoverHistCard] = useState(false);
  const [hoverField, setHoverField] = useState<"cat" | "valor" | "desc" | null>(null);

  const regCardGlowOn = hoverRegCard && !hoverField;

  const catRef = useRef<HTMLSelectElement | null>(null);

  useMemo(() => {
    // mantém o useMemo (não quebra), mesmo que tu não use label aqui
    const map: Record<string, string> = {
      operacional: "Mão de Obra",
      logistica: "Logística",
      insumos: "Insumos",
      marketing: "Marketing",
      variaveis: "Variáveis",
    };
    return map[expenseCategory] ?? "";
  }, [expenseCategory]);

  // ✅ FRONT-ONLY: remove só visualmente
  const removeExpense = (id: string) => {
    setExpenses((prev) => prev.filter((x) => x.id !== id));
  };

  return (
    <>
      {/* Registrar Despesa */}
      <div
        onMouseEnter={() => setHoverRegCard(true)}
        onMouseLeave={() => {
          setHoverRegCard(false);
          setHoverField(null);
        }}
      >
        <CardShell cardGlowOn={regCardGlowOn}>
          <div className="p-8">
            <div className="text-[18px] font-semibold">Registrar Despesa</div>
            <div className="mt-1 text-[13px] text-slate-300/70">Adicione as despesas realizadas no caixa</div>

            <div className="mt-6 grid grid-cols-3 gap-6">
              {/* Categoria */}
              <div onMouseEnter={() => setHoverField("cat")} onMouseLeave={() => setHoverField(null)}>
                <div className="mb-2 text-[15px] font-semibold" style={{ color: "#4fdcff" }}>
                  Categoria
                </div>

                <FieldShell glowOn={hoverField === "cat"}>
                  <div
                    onClick={() => {
                      catRef.current?.focus();
                      catRef.current?.click();
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      width: "100%",
                      height: "100%",
                      cursor: "pointer",
                    }}
                  >
                    <UiSelect
                      ref={catRef}
                      value={expenseCategory}
                      onChange={(e) => setExpenseCategory(e.target.value)}
                      style={{ height: "100%", width: "100%" }}
                    >
                      <option value="" disabled>
                        Selecione
                      </option>

                      <option value="operacional">Mão de Obra</option>
                      <option value="logistica">Logística</option>
                      <option value="insumos">Insumos</option>
                      <option value="marketing">Marketing</option>
                      <option value="variaveis">Variáveis</option>
                    </UiSelect>

                    <div style={{ pointerEvents: "none" }}>
                      <SelectChevron />
                    </div>
                  </div>
                </FieldShell>

                <div className="mt-2 text-[12px] text-slate-300/40"></div>
              </div>

              {/* Valor */}
              <div onMouseEnter={() => setHoverField("valor")} onMouseLeave={() => setHoverField(null)}>
                <div className="mb-2 text-[15px] font-semibold" style={{ color: "#4fdcff" }}>
                  Valor (R$)
                </div>

                <FieldShell glowOn={hoverField === "valor"}>
                  <UiInput placeholder="0,00" value={expenseAmount} onChange={(e) => setExpenseAmount(e.target.value)} inputMode="decimal" />
                </FieldShell>
              </div>

              {/* Descrição */}
              <div onMouseEnter={() => setHoverField("desc")} onMouseLeave={() => setHoverField(null)}>
                <div className="mb-2 text-[15px] font-semibold" style={{ color: "#4fdcff" }}>
                  Descrição
                </div>

                <FieldShell glowOn={hoverField === "desc"}>
                  <UiInput
                    placeholder="Descrição da despesa"
                    value={expenseDescription}
                    onChange={(e) => setExpenseDescription(e.target.value)}
                  />
                </FieldShell>
              </div>
            </div>

            <div className="mt-6">
              <button
                type="button"
                onClick={addExpense}
                className="h-[44px] inline-flex items-center gap-2 rounded-xl bg-red-500 px-6 text-[14px] font-semibold text-white shadow-[0_12px_30px_rgba(0,0,0,0.35)] hover:bg-red-600"
              >
                <span className="opacity-90">$</span> Adicionar Despesa
              </button>
            </div>
          </div>
        </CardShell>
      </div>

      {/* Histórico de Despesas */}
      <div onMouseEnter={() => setHoverHistCard(true)} onMouseLeave={() => setHoverHistCard(false)}>
        <CardShell cardGlowOn={hoverHistCard}>
          <div className="p-8">
            <div className="text-[18px] font-semibold">Histórico de Despesas</div>
            <div className="mt-1 text-[13px] text-slate-300/70">Total: {brl(totalDespesas)}</div>

            {expenses.length === 0 ? (
              <div className="py-24 text-center text-slate-400/50">Nenhuma despesa registrada</div>
            ) : (
              <div className="mt-6 overflow-x-auto">
                <table className="w-full text-left text-[13px]">
                  <thead className="text-slate-300/70">
                    <tr className="border-b border-white/10">
                      <th className="py-3">Data</th>
                      <th className="py-3">Hora</th>
                      <th className="py-3">Categoria</th>
                      <th className="py-3">Descrição</th>
                      <th className="py-3 text-right">Valor</th>
                      <th className="py-3 text-right"> </th>
                    </tr>
                  </thead>

                  <tbody>
                    {expenses.map((e) => (
                      <tr
                        key={e.id}
                        className="
                          border-b border-white/5
                          transition-all duration-150
                          hover:bg-white/[0.02]
                          hover:shadow-[inset_0_0_0_1px_rgba(79,220,255,0.10)]
                          group
                        "
                      >
                        <td className="py-3 text-slate-300 transition-colors duration-150 group-hover:text-white">{e.date}</td>
                        <td className="py-3 text-slate-300 transition-colors duration-150 group-hover:text-white">{e.time}</td>

                        <td className="py-3">
                          <span
                            className="
                              rounded-lg px-3 py-1
                              bg-red-500/15 text-red-300
                              transition-all duration-150
                              group-hover:text-red-200
                              group-hover:drop-shadow-[0_0_7px_rgba(239,68,68,0.45)]
                            "
                          >
                            {e.category}
                          </span>
                        </td>

                        <td className="py-3 text-slate-300 transition-colors duration-150 group-hover:text-white">
                          {e.description}
                        </td>

                        <td
                          className="
                            py-3 text-right font-semibold text-red-300
                            transition-all duration-150
                            group-hover:text-red-200
                            group-hover:drop-shadow-[0_0_7px_rgba(239,68,68,0.45)]
                          "
                        >
                          {brl(e.amount)}
                        </td>

                        <td className="py-2 text-right">
                          <div className="opacity-70 group-hover:opacity-100 transition">
                            <DeleteBtn onClick={() => removeExpense(e.id)} />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </CardShell>
      </div>
    </>
  );
}
