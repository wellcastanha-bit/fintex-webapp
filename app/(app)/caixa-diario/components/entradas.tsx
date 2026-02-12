"use client";

import React, { useMemo, useState } from "react";

// ===== tipos locais (quebra ciclo) =====
type PedidoCashRow = {
  id: string;
  date: string;
  time: string;
  cliente: string;
  plataforma: string;
  atendimento: string;
  pagamentoLabel: "Dinheiro" | "PIX" | "Pagamento Online" | "Cartão de Débito" | "Cartão de Crédito";
  valor: number;
};

type ManualCashEntry = {
  id: string;
  date: string;
  time: string;
  description: string;
  amount: number;
};

// ===== helpers locais =====
function brl(n: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n);
}
function toNumberSmart(v: any) {
  if (v === null || v === undefined) return 0;
  let s = String(v).trim();
  if (!s) return 0;

  s = s.replace(/[R$\s]/g, "");

  if (s.includes(",")) {
    s = s.replace(/\./g, "").replace(",", ".");
    const n = Number(s);
    return Number.isFinite(n) ? n : 0;
  }

  if (s.includes(".")) {
    const m = s.match(/^\d+(\.\d{1,2})$/);
    if (m) {
      const n = Number(s);
      return Number.isFinite(n) ? n : 0;
    }
    s = s.replace(/\./g, "");
    const n = Number(s);
    return Number.isFinite(n) ? n : 0;
  }

  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}

/* =========================
   ✅ FORMATAÇÃO IGUAL Cliente.tsx
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

function DeleteBtn({ onClick, tone }: { onClick: () => void; tone?: "emerald" | "red" | "orange" }) {
  const cls =
    tone === "red"
      ? "text-red-300 hover:text-red-200 hover:bg-red-500/10"
      : tone === "orange"
      ? "text-orange-300 hover:text-orange-200 hover:bg-orange-500/10"
      : "text-emerald-300 hover:text-emerald-200 hover:bg-emerald-500/10";

  return (
    <button
      type="button"
      onClick={onClick}
      className={"h-9 w-9 inline-flex items-center justify-center rounded-lg transition " + cls}
      title="Apagar"
    >
      🗑
    </button>
  );
}

function StatPill({ value }: { value: string }) {
  return (
    <div
      className={[
        "mt-2 rounded-2xl border px-5 py-3 text-[14px] font-semibold",
        "bg-[#0b1325]/60",
        "text-emerald-400 border-emerald-500/20",
        "transition-all duration-200",
        "hover:border-emerald-400/35",
        "hover:shadow-[0_0_0_1px_rgba(52,211,153,0.22),0_0_36px_rgba(52,211,153,0.12)]",
      ].join(" ")}
    >
      {value}
    </div>
  );
}

export default function EntradasTab(props: {
  // pedidos vêm do PAI (CaixaDiario)
  pedidosAll: PedidoCashRow[];
  pedidosStatus?: "idle" | "ok";

  manualCash: ManualCashEntry[];
  manualDesc: string;
  manualAmount: string;

  setManualDesc: (v: string) => void;
  setManualAmount: (v: string) => void;
  addManualCash: () => void;

  removeManual: (id: string) => void;

  // UI-only: remove do estado do pai (não apaga em backend)
  removePedido?: (id: string) => void;

  // ✅ NOVO: se o pai passar, apaga manual de verdade (backend); senão apaga só no estado
  onDeleteManual?: (id: string) => void;
}) {
  const {
    pedidosAll,
    pedidosStatus = "ok",
    manualCash,
    manualDesc,
    manualAmount,
    setManualDesc,
    setManualAmount,
    addManualCash,
    removeManual,
    removePedido,
    onDeleteManual,
  } = props;

  const totalsByPay = useMemo(() => {
    const base = { dinheiro: 0, pix: 0, online: 0, debito: 0, credito: 0, total: 0 };
    for (const p of pedidosAll) {
      const v = p.valor ?? 0;
      base.total += v;
      if (p.pagamentoLabel === "Dinheiro") base.dinheiro += v;
      else if (p.pagamentoLabel === "PIX") base.pix += v;
      else if (p.pagamentoLabel === "Pagamento Online") base.online += v;
      else if (p.pagamentoLabel === "Cartão de Débito") base.debito += v;
      else if (p.pagamentoLabel === "Cartão de Crédito") base.credito += v;
    }
    return base;
  }, [pedidosAll]);

  const pedidosDinheiro = useMemo(() => pedidosAll.filter((p) => p.pagamentoLabel === "Dinheiro"), [pedidosAll]);

  // hover states
  const [hoverResumo, setHoverResumo] = useState(false);
  const [hoverRegCard, setHoverRegCard] = useState(false);
  const [hoverRegField, setHoverRegField] = useState<"desc" | "valor" | null>(null);
  const [hoverHist, setHoverHist] = useState(false);

  const regCardGlowOn = hoverRegCard && !hoverRegField;

  // total dinheiro = pedidos dinheiro + reforços
  const manualCashTotal = useMemo(() => manualCash.reduce((s, m) => s + (m.amount ?? 0), 0), [manualCash]);

  const pedidosDinheiroTotal = useMemo(() => pedidosDinheiro.reduce((s, p) => s + (p.valor ?? 0), 0), [pedidosDinheiro]);

  const cashInTotal = pedidosDinheiroTotal + manualCashTotal;

  // delete manual: se tiver callback, usa; senão usa o removeManual antigo
  const delManual = (id: string) => {
    if (onDeleteManual) return onDeleteManual(id);
    return removeManual(id);
  };

  // lista unificada (manual + pedidos) ordenada por data/hora (desc)
  const rowsMerged = useMemo(() => {
    const man = manualCash.map((m) => ({
      k: `M-${m.id}`,
      origem: "Manual" as const,
      date: m.date,
      time: m.time,
      desc: m.description || "Reforço de caixa",
      valor: m.amount ?? 0,
      del: () => delManual(m.id),
    }));

    const ped = pedidosDinheiro.map((p) => ({
      k: `P-${p.id}`,
      origem: "Pedido" as const,
      date: p.date || "-",
      time: p.time || "-",
      desc: p.cliente ? `${p.cliente} • ${p.plataforma || ""} • ${p.atendimento || ""}` : "Venda em dinheiro",
      valor: p.valor ?? 0,
      del: () => (removePedido ? removePedido(p.id) : undefined),
    }));

    const all = [...man, ...ped];

    const toMins = (hhmm: string) => {
      const m = String(hhmm || "").match(/^(\d{1,2}):(\d{2})$/);
      if (!m) return -1;
      return Number(m[1]) * 60 + Number(m[2]);
    };

    all.sort((a, b) => {
      if (a.date !== b.date) return String(b.date).localeCompare(String(a.date));
      return toMins(b.time) - toMins(a.time);
    });

    return all;
  }, [manualCash, pedidosDinheiro, removePedido]); // delManual já é estável (depende só de props)

  const onAddManual = () => {
    const amt = toNumberSmart(manualAmount);
    if (!amt || amt <= 0) return;
    addManualCash();
  };

  return (
    <>
      {/* Resumo Entradas */}
      <div onMouseEnter={() => setHoverResumo(true)} onMouseLeave={() => setHoverResumo(false)}>
        <CardShell cardGlowOn={hoverResumo}>
          <div className="p-8">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-[18px] font-semibold">Resumo de Entradas</div>
                <div className="mt-1 text-[13px] text-slate-300/70"></div>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-5 gap-4">
              <div className="col-span-1">
                <div className="text-[13px] text-slate-300/70">Dinheiro</div>
                <StatPill value={brl(totalsByPay.dinheiro)} />
              </div>

              {[
                ["PIX", totalsByPay.pix],
                ["Pagamento Online", totalsByPay.online],
                ["Cartão de Débito", totalsByPay.debito],
                ["Cartão de Crédito", totalsByPay.credito],
              ].map(([t, v]) => (
                <div key={String(t)}>
                  <div className="text-[13px] text-slate-300/70">{t}</div>
                  <StatPill value={brl(Number(v))} />
                </div>
              ))}
            </div>

            {pedidosStatus === "idle" && <div className="mt-5 text-[13px] text-slate-300/60">Carregando pedidos…</div>}
          </div>
        </CardShell>
      </div>

      {/* Registrar Entrada (manual dinheiro) */}
      <div
        onMouseEnter={() => setHoverRegCard(true)}
        onMouseLeave={() => {
          setHoverRegCard(false);
          setHoverRegField(null);
        }}
      >
        <CardShell cardGlowOn={regCardGlowOn}>
          <div className="p-8">
            <div className="text-[18px] font-semibold">Registrar Entrada</div>

            <div className="mt-6 grid grid-cols-2 gap-6">
              <div onMouseEnter={() => setHoverRegField("desc")} onMouseLeave={() => setHoverRegField(null)}>
                <div className="mb-2 text-[15px] font-semibold" style={{ color: "#4fdcff" }}>
                  Descrição
                </div>

                <FieldShell glowOn={hoverRegField === "desc"}>
                  <UiInput placeholder="Ex: Reforço de caixa" value={manualDesc} onChange={(e) => setManualDesc(e.target.value)} />
                </FieldShell>
              </div>

              <div onMouseEnter={() => setHoverRegField("valor")} onMouseLeave={() => setHoverRegField(null)}>
                <div className="mb-2 text-[15px] font-semibold" style={{ color: "#4fdcff" }}>
                  Valor (R$)
                </div>

                <FieldShell glowOn={hoverRegField === "valor"}>
                  <UiInput placeholder="0,00" value={manualAmount} onChange={(e) => setManualAmount(e.target.value)} />
                </FieldShell>
              </div>
            </div>

            <div className="mt-6">
              <button
                type="button"
                onClick={onAddManual}
                className="h-[44px] inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-6 text-[14px] font-semibold text-white shadow-[0_12px_30px_rgba(0,0,0,0.35)] hover:bg-emerald-600"
              >
                <span className="opacity-90">↗</span> Adicionar Entrada (Reforço)
              </button>
            </div>
          </div>
        </CardShell>
      </div>

      {/* Histórico Dinheiro (PEDIDOS + manual) */}
      <div onMouseEnter={() => setHoverHist(true)} onMouseLeave={() => setHoverHist(false)}>
        <CardShell cardGlowOn={hoverHist}>
          <div className="p-8">
            <div className="text-[18px] font-semibold">Histórico de Entradas (Dinheiro)</div>
            <div className="mt-1 text-[13px] text-slate-300/70">
              Vendas em dinheiro + reforços de caixa • Total: {brl(cashInTotal)}
            </div>

            {rowsMerged.length === 0 ? (
              <div className="py-24 text-center text-slate-400/50">Nenhuma entrada em dinheiro encontrada</div>
            ) : (
              <div className="mt-6 overflow-x-auto">
                <table className="w-full text-left text-[13px]">
                  <thead className="text-slate-300/70">
                    <tr className="border-b border-white/10">
                      <th className="py-3">Origem</th>
                      <th className="py-3">Data</th>
                      <th className="py-3">Hora</th>
                      <th className="py-3">Descrição</th>
                      <th className="py-3 text-right">Valor</th>
                      <th className="py-3 text-right"> </th>
                    </tr>
                  </thead>

                  <tbody>
                    {rowsMerged.map((r) => (
                      <tr
                        key={r.k}
                        className="
                          border-b border-white/5
                          transition-all duration-150
                          hover:bg-white/[0.02]
                          hover:shadow-[inset_0_0_0_1px_rgba(79,220,255,0.10)]
                          group
                        "
                      >
                        <td className="py-3 text-slate-300 transition-colors duration-150 group-hover:text-white">{r.origem}</td>
                        <td className="py-3 text-slate-300 transition-colors duration-150 group-hover:text-white">{r.date}</td>
                        <td className="py-3 text-slate-300 transition-colors duration-150 group-hover:text-white">{r.time}</td>
                        <td className="py-3 text-slate-300 transition-colors duration-150 group-hover:text-white">{r.desc}</td>

                        <td
                          className="
                            py-3 text-right font-semibold
                            text-emerald-300
                            transition-all duration-150
                            group-hover:text-emerald-200
                            group-hover:drop-shadow-[0_0_6px_rgba(52,211,153,0.45)]
                          "
                        >
                          {brl(r.valor)}
                        </td>

                        <td className="py-2 text-right">
                          <div className="opacity-70 group-hover:opacity-100 transition">
                            <DeleteBtn tone="emerald" onClick={r.del} />
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
