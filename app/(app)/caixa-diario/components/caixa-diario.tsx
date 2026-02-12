"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
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
  valor: number; // ✅ soma do r_final
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

/* =========================
   ✅ DIA OPERACIONAL (06:00)
========================= */
const OP_CUTOFF_HOUR = 6; // 06:00
const TZ_OFFSET_MIN = -180; // Brasil (-03:00)

function getDiaOperacionalISO() {
  const now = new Date(Date.now() + TZ_OFFSET_MIN * 60_000);
  if (now.getHours() < OP_CUTOFF_HOUR) now.setDate(now.getDate() - 1);
  return `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;
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
   ✅ BACKEND: normaliza pagamento
========================= */
function normPaymentLabel(v: any): PedidoCashRow["pagamentoLabel"] {
  const s = String(v ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  if (!s) return "Dinheiro";
  if (s.includes("dinheiro") || s === "cash") return "Dinheiro";
  if (s === "pix" || s.includes("pix")) return "PIX";
  if (s.includes("online") || s.includes("pagamento online") || s.includes("gateway")) return "Pagamento Online";
  if (s.includes("debito") || s.includes("debit")) return "Cartão de Débito";
  if (s.includes("credito") || s.includes("credit")) return "Cartão de Crédito";
  return "Dinheiro";
}

function parseDateAndTimeFromISO(iso: any) {
  const dt = new Date(String(iso ?? ""));
  if (!Number.isFinite(dt.getTime())) {
    return { date: getDiaOperacionalISO(), time: "00:00" };
  }
  const date = `${dt.getFullYear()}-${pad2(dt.getMonth() + 1)}-${pad2(dt.getDate())}`;
  const time = `${pad2(dt.getHours())}:${pad2(dt.getMinutes())}`;
  return { date, time };
}

/* =========================
   ✅ API Caixa Diário (backend)
========================= */
type CashEntryRow = {
  id: string;
  op_date: string;
  type: "manual_in" | "expense" | "withdrawal";
  category: string | null;
  description: string;
  amount: number;
  occurred_at: string;
  created_at: string;
};

type CashSessionRow = {
  id: string;
  op_date: string;
  initial_counts: any;
  final_counts: any;
  created_at: string;
  updated_at: string;
};

function timeFromOccurredAt(iso: string) {
  const d = new Date(String(iso || ""));
  if (!Number.isFinite(d.getTime())) return "00:00";
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

export default function CaixaDiario() {
  const STAT_W = 170;

  const [tab, setTab] = useState<TabKey>("entradas");

  // ✅ dia operacional (vira às 06:00)
  const [dateISO, setDateISO] = useState<string>(() => getDiaOperacionalISO());

  useEffect(() => {
    const t = setInterval(() => {
      const next = getDiaOperacionalISO();
      setDateISO((cur) => (cur === next ? cur : next));
    }, 30_000);
    return () => clearInterval(t);
  }, []);

  // ✅ Pedidos (BACKEND) — soma por pagamento usando r_final
  const [pedidosAll, setPedidosAll] = useState<PedidoCashRow[]>([]);
  const [pedidosStatus, setPedidosStatus] = useState<"idle" | "ok" | "err">("idle");

  // ✅ Caixa (BACKEND) — lançamentos e contagens
  const [caixaStatus, setCaixaStatus] = useState<"idle" | "ok" | "err">("idle");

  const [manualCash, setManualCash] = useState<ManualCashEntry[]>([]);
  const [manualAmount, setManualAmount] = useState("");
  const [manualDesc, setManualDesc] = useState("");

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [expenseCategory, setExpenseCategory] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseDescription, setExpenseDescription] = useState("");

  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [withdrawalAmount, setWithdrawalAmount] = useState("");
  const [withdrawalReason, setWithdrawalReason] = useState("");
  const [withdrawalAuthorizedBy, setWithdrawalAuthorizedBy] = useState("");

  const [initialCounts, setInitialCounts] = useState<CountItem[]>(DENOMS.map((d) => ({ denomination: d, quantity: 0 })));
  const [finalCounts, setFinalCounts] = useState<CountItem[]>(DENOMS.map((d) => ({ denomination: d, quantity: 0 })));

  /* =========================================
     ✅ 0) CARREGA CAIXA DO BACKEND (sessão + entries)
     - multi-dispositivo
  ========================================= */
  useEffect(() => {
    let alive = true;

    async function loadCaixa() {
      setCaixaStatus("idle");
      try {
        const res = await fetch(`/api/caixa-diario?date=${encodeURIComponent(dateISO)}`, {
          method: "GET",
          cache: "no-store",
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = await res.json();
        const session: CashSessionRow | null = data?.session || null;
        const entries: CashEntryRow[] = Array.isArray(data?.entries) ? data.entries : [];

        if (!alive) return;

        // contagens
        const init = normalizeCounts(session?.initial_counts, DENOMS.map((d) => ({ denomination: d, quantity: 0 })));
        const fin = normalizeCounts(session?.final_counts, DENOMS.map((d) => ({ denomination: d, quantity: 0 })));
        setInitialCounts(init);
        setFinalCounts(fin);

        // entradas/despesas/sangrias
        const m: ManualCashEntry[] = [];
        const e: Expense[] = [];
        const w: Withdrawal[] = [];

        for (const it of entries) {
          const t = timeFromOccurredAt(it.occurred_at);
          const amt = Number(it.amount ?? 0);

          if (it.type === "manual_in") {
            m.push({
              id: it.id,
              date: dateISO,
              time: t,
              description: String(it.description || "Reforço de caixa"),
              amount: amt,
            });
          } else if (it.type === "expense") {
            e.push({
              id: it.id,
              date: dateISO,
              time: t,
              category: String(it.category || ""),
              description: String(it.description || ""),
              amount: amt,
            });
          } else if (it.type === "withdrawal") {
            // ✅ padrão: category = authorizedBy | description = reason
            w.push({
              id: it.id,
              date: dateISO,
              time: t,
              reason: String(it.description || ""),
              authorizedBy: String(it.category || ""),
              amount: amt,
            });
          }
        }

        setManualCash(m);
        setExpenses(e);
        setWithdrawals(w);

        setCaixaStatus("ok");
      } catch {
        if (!alive) return;
        setCaixaStatus("err");
      }
    }

    loadCaixa();
    return () => {
      alive = false;
    };
  }, [dateISO]);

  /* =========================================
     ✅ 1) CARREGA PEDIDOS DO BACKEND (r_final)
  ========================================= */
  useEffect(() => {
    let alive = true;

    async function loadOrders() {
      setPedidosStatus("idle");
      try {
        const res = await fetch(`/api/orders?date=${encodeURIComponent(dateISO)}&mode=caixa`, {
          method: "GET",
          cache: "no-store",
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = await res.json();
        const arr: any[] = Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : [];

        const mapped: PedidoCashRow[] = arr.map((row: any) => {
          const id = String(row?.id ?? row?.uuid ?? row?.order_id ?? `${Date.now()}_${Math.random().toString(16).slice(2)}`);
          const created = row?.created_at ?? row?.order_date ?? row?.date ?? row?.createdAt;
          const { date, time } = parseDateAndTimeFromISO(created);
          const valor = toNumberSmart(row?.r_final ?? row?.valor ?? row?.amount ?? 0);

          return {
            id,
            date,
            time,
            cliente: String(row?.customer_name ?? row?.cliente ?? row?.customer ?? "").trim(),
            plataforma: String(row?.platform ?? row?.plataforma ?? "").trim(),
            atendimento: String(row?.service_type ?? row?.atendimento ?? "").trim(),
            pagamentoLabel: normPaymentLabel(row?.payment_method ?? row?.pagamento ?? row?.pagamento_label),
            valor,
          };
        });

        if (!alive) return;
        setPedidosAll(mapped);
        setPedidosStatus("ok");
      } catch {
        if (!alive) return;
        setPedidosAll([]);
        setPedidosStatus("err");
      }
    }

    loadOrders();
    return () => {
      alive = false;
    };
  }, [dateISO]);

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

  // ✅ ENTRADA TOTAL DINHEIRO = pedidos dinheiro + reforços (BACKEND)
  const manualCashTotal = useMemo(() => manualCash.reduce((s, m) => s + (m.amount ?? 0), 0), [manualCash]);
  const cashInTotal = totalsByPay.dinheiro + manualCashTotal;

  const totalDespesas = useMemo(() => expenses.reduce((s, e) => s + (e.amount ?? 0), 0), [expenses]);
  const totalSangrias = useMemo(() => withdrawals.reduce((s, w) => s + (w.amount ?? 0), 0), [withdrawals]);

  const caixaInicial = useMemo(() => calcTotalCounts(initialCounts), [initialCounts]);
  const caixaFinal = useMemo(() => calcTotalCounts(finalCounts), [finalCounts]);

  const esperado = useMemo(() => caixaInicial + cashInTotal - totalDespesas - totalSangrias, [
    caixaInicial,
    cashInTotal,
    totalDespesas,
    totalSangrias,
  ]);

  const diferenca = useMemo(() => esperado - caixaFinal, [esperado, caixaFinal]);
  const difIsBad = Math.abs(diferenca) > 5;

  /* =========================
     ✅ Helpers API (POST/PATCH)
  ========================= */
  async function createEntry(payload: {
    type: "manual_in" | "expense" | "withdrawal";
    amount: number;
    category?: string | null;
    description?: string;
    occurred_at?: string;
  }) {
    const res = await fetch(`/api/caixa-diario`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      body: JSON.stringify({
        dateISO,
        type: payload.type,
        amount: payload.amount,
        category: payload.category ?? null,
        description: payload.description ?? "",
        occurred_at: payload.occurred_at,
      }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data?.entry as CashEntryRow;
  }

  async function saveCounts(payload: { initial_counts?: CountItem[]; final_counts?: CountItem[] }) {
    const res = await fetch(`/api/caixa-diario`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      body: JSON.stringify({
        dateISO,
        ...(payload.initial_counts ? { initial_counts: payload.initial_counts } : {}),
        ...(payload.final_counts ? { final_counts: payload.final_counts } : {}),
      }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  }

  /* =========================
     ✅ Entradas manuais (BACKEND)
  ========================= */
  const addManualCash = async () => {
    const desc = manualDesc.trim();
    const amt = toNumberSmart(manualAmount);
    if (!amt || amt <= 0) return;

    // ✅ otimista
    const now = new Date();
    const optimistic: ManualCashEntry = {
      id: `tmp_${Date.now()}_${Math.random().toString(16).slice(2)}`,
      date: dateISO,
      time: `${pad2(now.getHours())}:${pad2(now.getMinutes())}`,
      description: desc || "Reforço de caixa",
      amount: amt,
    };
    setManualCash((prev) => [optimistic, ...prev]);
    setManualAmount("");
    setManualDesc("");

    try {
      const entry = await createEntry({
        type: "manual_in",
        amount: amt,
        description: optimistic.description,
      });

      const time = timeFromOccurredAt(entry.occurred_at);

      setManualCash((prev) =>
        prev.map((m) => (m.id === optimistic.id ? { ...m, id: entry.id, time } : m))
      );
    } catch {
      // volta se falhar
      setManualCash((prev) => prev.filter((m) => m.id !== optimistic.id));
    }
  };

  // ⚠️ Sem DELETE no backend ainda: remove só da tela (se quiser eu adiciono DELETE na API e aí apaga de verdade)
  const removeManual = (id: string) => setManualCash((prev) => prev.filter((m) => m.id !== id));

  // ✅ pedidos são do backend: remover só “da tela”
  const removePedido = (id: string) => setPedidosAll((prev) => prev.filter((p) => p.id !== id));

  /* =========================
     ✅ Despesas / Sangrias (BACKEND)
  ========================= */
  const addExpense = async () => {
    const v = toNumberSmart(expenseAmount);
    if (!expenseCategory || !expenseDescription.trim() || !v) return;

    const now = new Date();
    const time = now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

    const optimistic: Expense = {
      id: `tmp_${Date.now()}_${Math.random().toString(16).slice(2)}`,
      date: dateISO,
      time,
      category: expenseCategory,
      description: expenseDescription,
      amount: v,
    };

    setExpenses((prev) => [optimistic, ...prev]);
    setExpenseCategory("");
    setExpenseAmount("");
    setExpenseDescription("");

    try {
      const entry = await createEntry({
        type: "expense",
        amount: v,
        category: optimistic.category,
        description: optimistic.description,
      });

      const t = timeFromOccurredAt(entry.occurred_at);
      setExpenses((prev) => prev.map((e) => (e.id === optimistic.id ? { ...e, id: entry.id, time: t } : e)));
    } catch {
      setExpenses((prev) => prev.filter((e) => e.id !== optimistic.id));
    }
  };

  const addWithdrawal = async () => {
    const v = toNumberSmart(withdrawalAmount);
    if (!withdrawalReason.trim() || !withdrawalAuthorizedBy.trim() || !v) return;

    const now = new Date();
    const time = now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

    const optimistic: Withdrawal = {
      id: `tmp_${Date.now()}_${Math.random().toString(16).slice(2)}`,
      date: dateISO,
      time,
      amount: v,
      reason: withdrawalReason,
      authorizedBy: withdrawalAuthorizedBy,
    };

    setWithdrawals((prev) => [optimistic, ...prev]);
    setWithdrawalAmount("");
    setWithdrawalReason("");
    setWithdrawalAuthorizedBy("");

    try {
      // ✅ padrão: category = authorizedBy | description = reason
      const entry = await createEntry({
        type: "withdrawal",
        amount: v,
        category: optimistic.authorizedBy,
        description: optimistic.reason,
      });

      const t = timeFromOccurredAt(entry.occurred_at);
      setWithdrawals((prev) =>
        prev.map((w) => (w.id === optimistic.id ? { ...w, id: entry.id, time: t } : w))
      );
    } catch {
      setWithdrawals((prev) => prev.filter((w) => w.id !== optimistic.id));
    }
  };

  /* =========================
     ✅ Contadores (BACKEND)
     - debounce PATCH pra não spammar
  ========================= */
  const saveTimerRef = useRef<any>(null);

  const scheduleSaveCounts = (payload: { initial?: CountItem[]; final?: CountItem[] }) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      try {
        await saveCounts({
          ...(payload.initial ? { initial_counts: payload.initial } : {}),
          ...(payload.final ? { final_counts: payload.final } : {}),
        });
      } catch {
        // ignora (não quebra UX). Se quiser, eu coloco um toast depois.
      }
    }, 650);
  };

  const updateCount = (which: "initial" | "final", denom: number, qty: number) => {
    const setter = which === "initial" ? setInitialCounts : setFinalCounts;

    setter((prev) => {
      const next = prev.map((it) => (it.denomination === denom ? { ...it, quantity: qty } : it));
      scheduleSaveCounts(which === "initial" ? { initial: next } : { final: next });
      return next;
    });
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
    <div className="w-full min-w-0 text-white">
      <div className="w-full min-w-0">
        {/* Header */}
        <div className="mb-8">
          <div className="text-[34px] font-extrabold leading-none">Caixa Diário</div>

          {pedidosStatus === "idle" && <div className="mt-3 text-[13px] text-slate-200/70">Carregando pedidos…</div>}
          {pedidosStatus === "err" && <div className="mt-3 text-[13px] text-red-300/80">Falha ao puxar pedidos do backend.</div>}

          {caixaStatus === "idle" && <div className="mt-2 text-[13px] text-slate-200/60">Carregando caixa…</div>}
          {caixaStatus === "err" && <div className="mt-2 text-[13px] text-red-300/70">Falha ao puxar o Caixa Diário.</div>}
        </div>

        {/* Stats */}
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
              <StatCard label="Diferença:" value={(diferenca >= 0 ? "+" : "") + brl(diferenca)} color={difIsBad ? "red" : "emerald"} />
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
              pedidosStatus={pedidosStatus === "ok" ? "ok" : "idle"}
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
