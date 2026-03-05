"use client";

import React, { useState } from "react";
import type { Withdrawal } from "./caixa-diario";

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
   ✅ MESMA FORMATAÇÃO DO DespesasTab
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

function TrashBtn({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="h-9 w-9 inline-flex items-center justify-center rounded-lg transition text-orange-300 hover:text-orange-200 hover:bg-orange-500/10"
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
  withdrawals: Withdrawal[];
  setWithdrawals: React.Dispatch<React.SetStateAction<Withdrawal[]>>;

  withdrawalAmount: string;
  setWithdrawalAmount: React.Dispatch<React.SetStateAction<string>>;

  withdrawalReason: string;
  setWithdrawalReason: React.Dispatch<React.SetStateAction<string>>;

  withdrawalAuthorizedBy: string;
  setWithdrawalAuthorizedBy: React.Dispatch<React.SetStateAction<string>>;

  // ✅ agora o ADD pode ser async (backend) ou sync (local)
  addWithdrawal: () => void | Promise<void>;
  totalSangrias: number;

  // ✅ NOVO: se passar, delete vai pro backend; senão é só visual/local
  onDeleteWithdrawal?: (id: string) => void | Promise<void>;
};

export default function SangriasTab({
  withdrawals,
  setWithdrawals,
  withdrawalAmount,
  setWithdrawalAmount,
  withdrawalReason,
  setWithdrawalReason,
  withdrawalAuthorizedBy,
  setWithdrawalAuthorizedBy,
  addWithdrawal,
  totalSangrias,
  onDeleteWithdrawal,
}: Props) {
  const [hoverRegCard, setHoverRegCard] = useState(false);
  const [hoverHistCard, setHoverHistCard] = useState(false);
  const [hoverField, setHoverField] = useState<"valor" | "motivo" | "aut" | null>(null);

  const regCardGlowOn = hoverRegCard && !hoverField;

  const [busyAdd, setBusyAdd] = useState(false);
  const [busyDel, setBusyDel] = useState<string | null>(null);

  // ✅ delete: se tiver callback -> backend; senão -> local
  const removeWithdrawal = async (id: string) => {
    try {
      setBusyDel(id);
      if (onDeleteWithdrawal) {
        await onDeleteWithdrawal(id);
        return;
      }
      setWithdrawals((prev) => prev.filter((x) => x.id !== id));
    } finally {
      setBusyDel(null);
    }
  };

  const onAdd = async () => {
    if (busyAdd) return;
    try {
      setBusyAdd(true);
      await addWithdrawal();
    } finally {
      setBusyAdd(false);
    }
  };

  return (
    <>
      {/* Registrar Sangria */}
      <div
        onMouseEnter={() => setHoverRegCard(true)}
        onMouseLeave={() => {
          setHoverRegCard(false);
          setHoverField(null);
        }}
      >
        <CardShell cardGlowOn={regCardGlowOn}>
          <div className="p-8">
            <div className="text-[18px] font-semibold">Registrar Sangria</div>
            <div className="mt-1 text-[13px] text-slate-300/70">Registre as retiradas de dinheiro do caixa</div>

            <div className="mt-6 grid grid-cols-3 gap-6">
              {/* Valor */}
              <div onMouseEnter={() => setHoverField("valor")} onMouseLeave={() => setHoverField(null)}>
                <div className="mb-2 text-[15px] font-semibold" style={{ color: "#4fdcff" }}>
                  Valor (R$)
                </div>

                <FieldShell glowOn={hoverField === "valor"}>
                  <UiInput
                    placeholder="0,00"
                    value={withdrawalAmount}
                    onChange={(e) => setWithdrawalAmount(e.target.value)}
                    inputMode="decimal"
                  />
                </FieldShell>
              </div>

              {/* Motivo */}
              <div onMouseEnter={() => setHoverField("motivo")} onMouseLeave={() => setHoverField(null)}>
                <div className="mb-2 text-[15px] font-semibold" style={{ color: "#4fdcff" }}>
                  Motivo
                </div>

                <FieldShell glowOn={hoverField === "motivo"}>
                  <UiInput placeholder="Motivo da sangria" value={withdrawalReason} onChange={(e) => setWithdrawalReason(e.target.value)} />
                </FieldShell>
              </div>

              {/* Autorizado por */}
              <div onMouseEnter={() => setHoverField("aut")} onMouseLeave={() => setHoverField(null)}>
                <div className="mb-2 text-[15px] font-semibold" style={{ color: "#4fdcff" }}>
                  Autorizado por
                </div>

                <FieldShell glowOn={hoverField === "aut"}>
                  <UiInput
                    placeholder="Nome do responsável"
                    value={withdrawalAuthorizedBy}
                    onChange={(e) => setWithdrawalAuthorizedBy(e.target.value)}
                  />
                </FieldShell>
              </div>
            </div>

            <div className="mt-6">
              <button
                type="button"
                onClick={onAdd}
                disabled={busyAdd}
                className={[
                  "h-[44px] inline-flex items-center gap-2 rounded-xl px-6 text-[14px] font-semibold text-white",
                  "shadow-[0_12px_30px_rgba(0,0,0,0.35)]",
                  busyAdd ? "bg-orange-500/60 cursor-not-allowed" : "bg-orange-500 hover:bg-orange-600",
                ].join(" ")}
              >
                <span className="opacity-90">↘</span> {busyAdd ? "Salvando…" : "Adicionar Sangria"}
              </button>
            </div>
          </div>
        </CardShell>
      </div>

      {/* Histórico de Sangrias */}
      <div onMouseEnter={() => setHoverHistCard(true)} onMouseLeave={() => setHoverHistCard(false)}>
        <CardShell cardGlowOn={hoverHistCard}>
          <div className="p-8">
            <div className="text-[18px] font-semibold">Histórico de Sangrias</div>
            <div className="mt-1 text-[13px] text-slate-300/70">Total: {brl(totalSangrias)}</div>

            {withdrawals.length === 0 ? (
              <div className="py-24 text-center text-slate-400/50">Nenhuma sangria registrada</div>
            ) : (
              <div className="mt-6 overflow-x-auto">
                <table className="w-full text-left text-[13px]">
                  <thead className="text-slate-300/70">
                    <tr className="border-b border-white/10">
                      <th className="py-3">Data</th>
                      <th className="py-3">Hora</th>
                      <th className="py-3">Motivo</th>
                      <th className="py-3">Autorizado por</th>
                      <th className="py-3 text-right">Valor</th>
                      <th className="py-3 text-right"> </th>
                    </tr>
                  </thead>

                  <tbody>
                    {withdrawals.map((w) => (
                      <tr
                        key={w.id}
                        className="
                          border-b border-white/5
                          transition-all duration-150
                          hover:bg-white/[0.02]
                          hover:shadow-[inset_0_0_0_1px_rgba(79,220,255,0.10)]
                          group
                        "
                      >
                        <td className="py-3 text-slate-300 transition-colors duration-150 group-hover:text-white">{w.date}</td>
                        <td className="py-3 text-slate-300 transition-colors duration-150 group-hover:text-white">{w.time}</td>

                        <td className="py-3">
                          <span
                            className="
                              rounded-lg px-3 py-1
                              bg-orange-500/15 text-orange-300
                              transition-all duration-150
                              group-hover:text-orange-200
                              group-hover:drop-shadow-[0_0_7px_rgba(249,115,22,0.45)]
                            "
                          >
                            {w.reason}
                          </span>
                        </td>

                        <td className="py-3 text-slate-300 transition-colors duration-150 group-hover:text-white">{w.authorizedBy}</td>

                        <td
                          className="
                            py-3 text-right font-semibold text-orange-300
                            transition-all duration-150
                            group-hover:text-orange-200
                            group-hover:drop-shadow-[0_0_7px_rgba(249,115,22,0.45)]
                          "
                        >
                          {brl(w.amount)}
                        </td>

                        <td className="py-2 text-right">
                          <div className="opacity-70 group-hover:opacity-100 transition">
                            <TrashBtn onClick={() => removeWithdrawal(w.id)} />
                          </div>
                          {busyDel === w.id && <div className="mt-1 text-[11px] text-orange-300/70">Removendo…</div>}
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
