"use client";

import React, { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";

/* ==============================
   ✅ dynamic imports (sem ciclo)
============================== */
const EntradasTab: any = dynamic(() => import("./entradas").then((m: any) => m.default), { ssr: false });
const DespesasTab: any = dynamic(() => import("./despesas").then((m: any) => m.default), { ssr: false });
const SangriasTab: any = dynamic(() => import("./sangria").then((m: any) => m.default), { ssr: false });
const ContadoresTab: any = dynamic(() => import("./contadores").then((m: any) => m.default), { ssr: false });

type TabKey = "entradas" | "despesas" | "sangrias" | "contadores";

export type PedidoCashRow = {
  id: string;
  date: string;
  time: string;
  cliente: string;
  plataforma: string;
  atendimento: string;
  pagamentoLabel: "Dinheiro" | "PIX" | "Pagamento Online" | "Cartão de Débito" | "Cartão de Crédito";
  valor: number;
};

export type ManualCashEntry = {
  id: string;
  date: string;
  time: string;
  description: string;
  amount: number;
};

export type Expense = { id: string; date: string; time: string; category: string; description: string; amount: number };
export type Withdrawal = { id: string; date: string; time: string; reason: string; authorizedBy: string; amount: number };

export type CountItem = { denomination: number; quantity: number };

// ✅ agora com moedas
export const DENOMS: number[] = [200, 100, 50, 20, 10, 5, 2, 1, 0.5, 0.25, 0.1, 0.05];

function brl(n: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n);
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function isoToday() {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

/** ✅ DIA OPERACIONAL (front-only) */
function getDiaOperacionalISO() {
  return isoToday();
}

/** ✅ parse robusto pra "R$ 85,00", "85.00", "85", "1.234,56" etc */
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

function calcTotalCounts(list: CountItem[]) {
  return list.reduce((s, it) => s + it.denomination * it.quantity, 0);
}

/* =========================
   ✅ VISUAL PDV (aqua + glow)
========================= */
const AQUA = "rgba(79,220,255,0.45)";
const AQUA_SOFT = "rgba(79,220,255,0.22)";

function CardShell({ children, hoverOn }: { children: React.ReactNode; hoverOn: boolean }) {
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
        border: hoverOn ? "1px solid rgba(79,220,255,0.55)" : "1px solid rgba(79,220,255,0.40)",
        boxShadow: hoverOn
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

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: "emerald" | "red" | "orange" | "blue" | "cyan" | "white";
}) {
  const [hover, setHover] = useState(false);

  const valClass =
    color === "emerald"
      ? "text-emerald-400"
      : color === "red"
      ? "text-red-400"
      : color === "orange"
      ? "text-orange-400"
      : color === "blue"
      ? "text-blue-400"
      : color === "cyan"
      ? "text-cyan-400"
      : "text-white";

  return (
    <div onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
      <CardShell hoverOn={hover}>
        <div className="px-5 py-4">
          <div className="text-[12px] text-slate-300/70">{label}</div>
          <div className={"mt-1 text-[14px] font-semibold " + valClass}>{value}</div>
        </div>
      </CardShell>
    </div>
  );
}

/* =========================
   ✅ PERSISTÊNCIA LOCAL (front-only)
========================= */
type CaixaDraft = {
  pedidosAll: PedidoCashRow[];
  manualCash: ManualCashEntry[];
  expenses: Expense[];
  withdrawals: Withdrawal[];
  initialCounts: CountItem[];
  finalCounts: CountItem[];
};

function storageKey(dateISO: string) {
  return `fintex::caixa_diario::${dateISO}`;
}

function safeParse<T>(s: string | null): T | null {
  if (!s) return null;
  try {
    return JSON.parse(s) as T;
  } catch {
    return null;
  }
}

function normalizeCounts(list: any, fallback: CountItem[]) {
  if (!Array.isArray(list)) return fallback;
  const m = new Map<number, number>();
  for (const it of list) {
    const denom = Number(it?.denomination);
    const qty = Number(it?.quantity);
    if (Number.isFinite(denom) && Number.isFinite(qty) && qty >= 0) m.set(denom, qty);
  }
  return DENOMS.map((d) => ({ denomination: d, quantity: m.get(d) ?? 0 }));
}

export default function CaixaDiario() {
  // ✅ 170px como tu pediu (pra caber 7 cards na linha)
  const STAT_W = 170;

  const [tab, setTab] = useState<TabKey>("entradas");

  // ✅ dia operacional (ISO)
  const [dateISO] = useState<string>(() => getDiaOperacionalISO());

  // ✅ Pedidos (front-only) — sem API/back
  const [pedidosAll, setPedidosAll] = useState<PedidoCashRow[]>([]);
  const [pedidosStatus, setPedidosStatus] = useState<"idle" | "ok">("idle");

  // Entradas manuais (LOCAL) ✅
  const [manualCash, setManualCash] = useState<ManualCashEntry[]>([]);
  const [manualAmount, setManualAmount] = useState("");
  const [manualDesc, setManualDesc] = useState("");

  // Despesas (LOCAL) ✅
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [expenseCategory, setExpenseCategory] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseDescription, setExpenseDescription] = useState("");

  // Sangrias (LOCAL) ✅
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [withdrawalAmount, setWithdrawalAmount] = useState("");
  const [withdrawalReason, setWithdrawalReason] = useState("");
  const [withdrawalAuthorizedBy, setWithdrawalAuthorizedBy] = useState("");

  // Contadores (LOCAL) ✅
  const [initialCounts, setInitialCounts] = useState<CountItem[]>(DENOMS.map((d) => ({ denomination: d, quantity: 0 })));
  const [finalCounts, setFinalCounts] = useState<CountItem[]>(DENOMS.map((d) => ({ denomination: d, quantity: 0 })));

  // ✅ trava autosave até terminar o load
  const [draftReady, setDraftReady] = useState(false);

  /* =========================================
     ✅ 0) CARREGA RASCUNHO DO DIA (localStorage)
  ========================================= */
  useEffect(() => {
    try {
      const key = storageKey(dateISO);
      const raw = localStorage.getItem(key);
      const saved = safeParse<CaixaDraft>(raw);

      if (saved) {
        setPedidosAll(Array.isArray(saved.pedidosAll) ? saved.pedidosAll : []);
        setPedidosStatus("ok");

        setManualCash(Array.isArray(saved.manualCash) ? saved.manualCash : []);
        setExpenses(Array.isArray(saved.expenses) ? saved.expenses : []);
        setWithdrawals(Array.isArray(saved.withdrawals) ? saved.withdrawals : []);
        setInitialCounts(normalizeCounts(saved.initialCounts, DENOMS.map((d) => ({ denomination: d, quantity: 0 }))));
        setFinalCounts(normalizeCounts(saved.finalCounts, DENOMS.map((d) => ({ denomination: d, quantity: 0 }))));
      }
    } catch {
      // ignora
    } finally {
      setDraftReady(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateISO]);

  /* =========================================
     ✅ 0.1) SALVA RASCUNHO DO DIA (localStorage)
  ========================================= */
  useEffect(() => {
    if (!draftReady) return;

    try {
      const key = storageKey(dateISO);
      const draft: CaixaDraft = { pedidosAll, manualCash, expenses, withdrawals, initialCounts, finalCounts };
      localStorage.setItem(key, JSON.stringify(draft));
    } catch {
      // sem stress
    }
  }, [draftReady, dateISO, pedidosAll, manualCash, expenses, withdrawals, initialCounts, finalCounts]);

  // ✅ totais por forma (PEDIDOS)
  const totalsByPay = useMemo(() => {
    const base = { dinheiro: 0, pix: 0, online: 0, debito: 0, credito: 0, total: 0 };
    for (const p of pedidosAll) {
      base.total += p.valor;
      if (p.pagamentoLabel === "Dinheiro") base.dinheiro += p.valor;
      else if (p.pagamentoLabel === "PIX") base.pix += p.valor;
      else if (p.pagamentoLabel === "Pagamento Online") base.online += p.valor;
      else if (p.pagamentoLabel === "Cartão de Débito") base.debito += p.valor;
      else if (p.pagamentoLabel === "Cartão de Crédito") base.credito += p.valor;
    }
    return base;
  }, [pedidosAll]);

  const pedidosDinheiro = useMemo(() => pedidosAll.filter((p) => p.pagamentoLabel === "Dinheiro"), [pedidosAll]);

  // ✅ ENTRADA TOTAL DINHEIRO = pedidos dinheiro + reforços locais
  const manualCashTotal = useMemo(() => manualCash.reduce((s, m) => s + (m.amount ?? 0), 0), [manualCash]);
  const cashInTotal = totalsByPay.dinheiro + manualCashTotal;

  const totalDespesas = useMemo(() => expenses.reduce((s, e) => s + (e.amount ?? 0), 0), [expenses]);
  const totalSangrias = useMemo(() => withdrawals.reduce((s, w) => s + (w.amount ?? 0), 0), [withdrawals]);

  // ✅ caixa inicial/final vêm dos contadores
  const caixaInicial = useMemo(() => calcTotalCounts(initialCounts), [initialCounts]);
  const caixaFinal = useMemo(() => calcTotalCounts(finalCounts), [finalCounts]);

  // ✅ LÓGICA CERTA
  const esperado = useMemo(() => caixaInicial + cashInTotal - totalDespesas - totalSangrias, [
    caixaInicial,
    cashInTotal,
    totalDespesas,
    totalSangrias,
  ]);

  // ✅ Diferença = Esperado - Caixa final
  const diferenca = useMemo(() => esperado - caixaFinal, [esperado, caixaFinal]);

  const difIsBad = Math.abs(diferenca) > 5;

  /* =========================
     ✅ Entradas manuais (LOCAL)
  ========================= */
  const addManualCash = () => {
    const desc = manualDesc.trim();
    const amt = toNumberSmart(manualAmount);
    if (!amt || amt <= 0) return;

    const now = new Date();
    const item: ManualCashEntry = {
      id: `${Date.now()}_${Math.random().toString(16).slice(2)}`,
      date: dateISO,
      time: `${pad2(now.getHours())}:${pad2(now.getMinutes())}`,
      description: desc || "Reforço de caixa",
      amount: amt,
    };

    setManualCash((prev) => [item, ...prev]);
    setManualAmount("");
    setManualDesc("");
  };

  const removeManual = (id: string) => setManualCash((prev) => prev.filter((m) => m.id !== id));

  const removePedido = (id: string) => setPedidosAll((prev) => prev.filter((p) => p.id !== id));

  /* =========================
     ✅ Despesas / Sangrias (LOCAL)
  ========================= */
  const addExpense = () => {
    const v = toNumberSmart(expenseAmount);
    if (!expenseCategory || !expenseDescription.trim() || !v) return;

    const now = new Date();
    const time = now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

    setExpenses((prev) => [
      {
        id: `${Date.now()}_${Math.random().toString(16).slice(2)}`,
        date: dateISO,
        time,
        category: expenseCategory,
        description: expenseDescription,
        amount: v,
      },
      ...prev,
    ]);
    setExpenseCategory("");
    setExpenseAmount("");
    setExpenseDescription("");
  };

  const addWithdrawal = () => {
    const v = toNumberSmart(withdrawalAmount);
    if (!withdrawalReason.trim() || !withdrawalAuthorizedBy.trim() || !v) return;

    const now = new Date();
    const time = now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

    setWithdrawals((prev) => [
      {
        id: `${Date.now()}_${Math.random().toString(16).slice(2)}`,
        date: dateISO,
        time,
        amount: v,
        reason: withdrawalReason,
        authorizedBy: withdrawalAuthorizedBy,
      },
      ...prev,
    ]);
    setWithdrawalAmount("");
    setWithdrawalReason("");
    setWithdrawalAuthorizedBy("");
  };

  const updateCount = (which: "initial" | "final", denom: number, qty: number) => {
    const setter = which === "initial" ? setInitialCounts : setFinalCounts;
    setter((prev) => prev.map((it) => (it.denomination === denom ? { ...it, quantity: qty } : it)));
  };

  const TabBar = () => {
    const base = "h-[44px] w-full rounded-full border border-white/10 bg-white/[0.04] px-2";
    const item = "h-[44px] rounded-full flex items-center justify-center gap-2 text-[18px] font-semibold transition-all";
    const inactive = "text-slate-300/70 hover:text-white";
    const activeWrap = "ring-2 ring-white/20 shadow-[0_10px_30px_rgba(0,0,0,0.35)]";

    const getActiveClass = (k: TabKey) => {
      if (k !== tab) return item + " " + inactive;
      if (k === "entradas") return item + " bg-emerald-500 text-white " + activeWrap;
      if (k === "despesas") return item + " bg-red-500 text-white " + activeWrap;
      if (k === "sangrias") return item + " bg-orange-500 text-white " + activeWrap;
      return item + " bg-blue-500 text-white " + activeWrap;
    };

    return (
      <div className={base}>
        <div className="grid grid-cols-4 gap-2">
          <button className={getActiveClass("entradas")} onClick={() => setTab("entradas")}>
            <span className="opacity-90">↗</span> Entradas
          </button>
          <button className={getActiveClass("despesas")} onClick={() => setTab("despesas")}>
            <span className="opacity-90">$</span> Despesas
          </button>
          <button className={getActiveClass("sangrias")} onClick={() => setTab("sangrias")}>
            <span className="opacity-90">↘</span> Sangrias
          </button>
          <button className={getActiveClass("contadores")} onClick={() => setTab("contadores")}>
            <span className="opacity-90">▦</span> Contadores
          </button>
        </div>
      </div>
    );
  };

  return (
    // ✅ SEM padding externo / SEM background externo
    // (Topbar/Sidebar/40px é controlado pelo Shell global)
    <div className="w-full min-w-0 text-white">
      {/* ✅ REMOVE mx-auto / max-w: isso que “afastava” da sidebar */}
      <div className="w-full min-w-0">
        {/* Header */}
        <div className="mb-8">
          <div className="text-[34px] font-extrabold leading-none">Caixa Diário</div>

          {pedidosStatus === "idle" && (
            <div className="mt-3 text-[13px] text-slate-200/70">Pedidos: (front-only)</div>
          )}
        </div>

        {/* ✅ Stats (1 linha) */}
        <div className="w-full overflow-x-auto pb-1">
          <div style={{ display: "flex", gap: 16, flexWrap: "nowrap", minWidth: "max-content" }}>
            <div style={{ width: STAT_W, flex: `0 0 ${STAT_W}px` }}>
              <StatCard label="Caixa Inicial:" value={brl(caixaInicial)} color="cyan" />
            </div>

            <div style={{ width: STAT_W, flex: `0 0 ${STAT_W}px` }}>
              <StatCard label="Entradas (Dinheiro):" value={brl(cashInTotal)} color="emerald" />
            </div>

            <div style={{ width: STAT_W, flex: `0 0 ${STAT_W}px` }}>
              <StatCard label="Despesas:" value={brl(totalDespesas)} color="red" />
            </div>

            <div style={{ width: STAT_W, flex: `0 0 ${STAT_W}px` }}>
              <StatCard label="Sangrias:" value={brl(totalSangrias)} color="orange" />
            </div>

            <div style={{ width: STAT_W, flex: `0 0 ${STAT_W}px` }}>
              <StatCard label="Esperado:" value={brl(esperado)} color="blue" />
            </div>

            <div style={{ width: STAT_W, flex: `0 0 ${STAT_W}px` }}>
              <StatCard label="Caixa Final:" value={brl(caixaFinal)} color="cyan" />
            </div>

            <div style={{ width: STAT_W, flex: `0 0 ${STAT_W}px` }}>
              <StatCard
                label="Diferença:"
                value={(diferenca >= 0 ? "+" : "") + brl(diferenca)}
                color={difIsBad ? "red" : "emerald"}
              />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-6">
          <TabBar />
        </div>

        {/* CONTENT */}
        <div className="mt-8 space-y-6">
          {tab === "entradas" && (
            <EntradasTab
              totalsByPay={totalsByPay}
              pedidosStatus={pedidosStatus}
              pedidosDinheiro={pedidosDinheiro}
              manualCash={manualCash}
              manualDesc={manualDesc}
              manualAmount={manualAmount}
              cashInTotal={cashInTotal}
              setManualDesc={setManualDesc}
              setManualAmount={setManualAmount}
              addManualCash={addManualCash}
              removeManual={removeManual}
              removePedido={removePedido}
              pedidosAll={pedidosAll}
              setPedidosAll={setPedidosAll}
            />
          )}

          {tab === "despesas" && (
            <DespesasTab
              expenses={expenses}
              setExpenses={setExpenses}
              expenseCategory={expenseCategory}
              setExpenseCategory={setExpenseCategory}
              expenseAmount={expenseAmount}
              setExpenseAmount={setExpenseAmount}
              expenseDescription={expenseDescription}
              setExpenseDescription={setExpenseDescription}
              addExpense={addExpense}
              totalDespesas={totalDespesas}
            />
          )}

          {tab === "sangrias" && (
            <SangriasTab
              withdrawals={withdrawals}
              setWithdrawals={setWithdrawals}
              withdrawalAmount={withdrawalAmount}
              setWithdrawalAmount={setWithdrawalAmount}
              withdrawalReason={withdrawalReason}
              setWithdrawalReason={setWithdrawalReason}
              withdrawalAuthorizedBy={withdrawalAuthorizedBy}
              setWithdrawalAuthorizedBy={setWithdrawalAuthorizedBy}
              addWithdrawal={addWithdrawal}
              totalSangrias={totalSangrias}
            />
          )}

          {tab === "contadores" && (
            <ContadoresTab
              initialCounts={initialCounts}
              finalCounts={finalCounts}
              initialTotal={caixaInicial}
              finalTotal={caixaFinal}
              updateCount={updateCount}
            />
          )}
        </div>
      </div>
    </div>
  );
}
