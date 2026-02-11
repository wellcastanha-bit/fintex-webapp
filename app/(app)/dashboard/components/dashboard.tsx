// app/(app)/dashboard/components/dashboard.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { fmtBRL } from "./ui/card_shell";

import HeaderDashboard, { type DashboardQuery, buildDashboardQS } from "./ui/boxes/header_dashboard";
import CardsTopo, { type DashboardKpis } from "./ui/boxes/cards_topo";
import RankingPagamentos, { type RankingPagamentoRow } from "./ui/boxes/ranking_pagamentos";
import PedidosPorPlataforma, { type PlataformaRow } from "./ui/boxes/pedidos_por_plataforma";
import PedidosPorAtendimento, { type AtendimentoRow } from "./ui/boxes/pedidos_por_atendimento";
import ConferenciaCaixa, { type ConferenciaData } from "./ui/boxes/conferencia_caixa";
import DespesasDetalhadas, { type DespesaRow } from "./ui/boxes/despesas_detalhadas";

type ApiDashboard = {
  ok: boolean;
  range?: any;
  kpis?: {
    pedidos: number;
    faturamento: number;
    ticket_medio: number;
    margem: number; // 0.2
    lucro_estimado: number;
    despesas: number;
    despesas_pct: number; // 0.085
  };
  groups?: {
    pagamentos: Array<{ key: string; pedidos: number; valor: number; pct: number }>;
    plataformas: Array<{ key: string; pedidos: number; valor: number; pct: number }>;
    atendimentos: Array<{ key: string; pedidos: number; valor: number; pct: number }>;
  };
  error?: string;
};

function pickAccentPlataforma(k: string): PlataformaRow["accent"] {
  const key = (k || "").toUpperCase();
  if (key.includes("AIQ")) return "purple";
  if (key.includes("BAL")) return "blue";
  if (key.includes("WHAT")) return "green";
  if (key.includes("DEL")) return "orange";
  if (key.includes("IFOOD") || key.includes("I FOOD") || key.includes("I-FOOD")) return "red";
  return "red";
}

function pickAccentAtendimento(k: string): AtendimentoRow["accent"] {
  const key = (k || "").toUpperCase();
  if (key.includes("ENT")) return "gray";
  if (key.includes("RET")) return "blue";
  if (key.includes("MES")) return "orange";
  return "gray";
}

function normKey(s: string) {
  return (s || "").trim().toUpperCase().replace(/\s+/g, " ");
}

export default function DashboardView() {
  const mockTitle = useMemo(() => "Pizza Blu · 30/01/2026 · Sexta-feira", []);

  // ✅ BASE FIXA (nada some)
  const basePlataformas = useMemo<PlataformaRow[]>(
    () => [
      { key: "AIQFOME", pedidos: 0, valor: 0, pct: 0, accent: "purple" },
      { key: "BALCÃO", pedidos: 0, valor: 0, pct: 0, accent: "blue" },
      { key: "WHATSAPP", pedidos: 0, valor: 0, pct: 0, accent: "green" },
      { key: "DELIVERY MUCH", pedidos: 0, valor: 0, pct: 0, accent: "orange" },
      { key: "IFOOD", pedidos: 0, valor: 0, pct: 0, accent: "red" },
    ],
    []
  );

  const baseAtendimentos = useMemo<AtendimentoRow[]>(
    () => [
      { key: "ENTREGA", pedidos: 0, valor: 0, pct: 0, accent: "gray" },
      { key: "RETIRADA", pedidos: 0, valor: 0, pct: 0, accent: "blue" },
      { key: "MESAS", pedidos: 0, valor: 0, pct: 0, accent: "orange" },
    ],
    []
  );

  // ✅ base fixa do ranking de pagamentos (pra não ocultar linhas/ícones)
  const basePagamentos = useMemo<RankingPagamentoRow[]>(
    () => [
      { key: "DINHEIRO", pedidos: 0, valor: 0, pct: 0 },
      { key: "PAGAMENTO ONLINE", pedidos: 0, valor: 0, pct: 0 },
      { key: "CARTÃO DE CRÉDITO", pedidos: 0, valor: 0, pct: 0 },
      { key: "PIX", pedidos: 0, valor: 0, pct: 0 },
      { key: "CARTÃO DE DÉBITO", pedidos: 0, valor: 0, pct: 0 },
    ],
    []
  );

  // ✅ base fixa das despesas detalhadas (pra não ficar vazio/oculto)
  const baseDespesas = useMemo<DespesaRow[]>(
    () => [
      { key: "Logística", pct: 0, valor: 0 },
      { key: "Variáveis", pct: 0, valor: 0 },
      { key: "Insumos", pct: 0, valor: 0 },
      { key: "Marketing", pct: 0, valor: 0 },
      { key: "Mão de Obra", pct: 0, valor: 0 },
    ],
    []
  );

  const [subtitle, setSubtitle] = useState<string>(mockTitle);

  const [kpis, setKpis] = useState<DashboardKpis>({
    pedidos: 0,
    faturamento: 0,
    ticket_medio: 0,
    margem: 0.2,
    lucro_estimado: 0,
    despesas: 0,
    despesas_pct: 0,
  });

  // ✅ começa já com base fixa
  const [rankingPagamentos, setRankingPagamentos] = useState<RankingPagamentoRow[]>(basePagamentos);
  const [porPlataforma, setPorPlataforma] = useState<PlataformaRow[]>(basePlataformas);
  const [porAtendimento, setPorAtendimento] = useState<AtendimentoRow[]>(baseAtendimentos);

  const [conferencia, setConferencia] = useState<ConferenciaData>({
    status: "OK",
    caixaInicial: 0,
    entradasDinheiro: 0,
    saidas: 0,
    caixaFinal: 0,
    quebra: 0,
  });

  const [despesasDetalhadas, setDespesasDetalhadas] = useState<DespesaRow[]>(baseDespesas);

  const [loading, setLoading] = useState(false);

  async function fetchDashboard(q: DashboardQuery) {
    const qs = buildDashboardQS(q);

    setLoading(true);
    try {
      const r = await fetch(`/api/dashboard?${qs}`, { cache: "no-store" });
      const json = (await r.json()) as ApiDashboard;

      if (!json?.ok) {
        console.error("dashboard api error:", json?.error || "unknown");
        return;
      }

      if (json.kpis) {
        setKpis({
          pedidos: json.kpis.pedidos ?? 0,
          faturamento: Number(json.kpis.faturamento ?? 0),
          ticket_medio: Number(json.kpis.ticket_medio ?? 0),
          margem: Number(json.kpis.margem ?? 0.2),
          lucro_estimado: Number(json.kpis.lucro_estimado ?? 0),
          despesas: Number(json.kpis.despesas ?? 0),
          despesas_pct: Number(json.kpis.despesas_pct ?? 0),
        });

        // ✅ se ainda não temos backend de despesas detalhadas, pelo menos não deixa vazio:
        // aqui você pode depois substituir pelo retorno real do /api/dashboard
        setDespesasDetalhadas(
          baseDespesas.map((d) => ({
            ...d,
            // opcional: se quiser refletir a despesa total distribuída, deixa como 0 por enquanto
            pct: 0,
            valor: 0,
          }))
        );
      }

      // ✅ ranking pagamentos: base fixa + merge backend
      const payBackend = (json.groups?.pagamentos || []).map((x) => ({
        key: x.key,
        pedidos: x.pedidos,
        valor: Number(x.valor),
        pct: Number(x.pct) * 100, // backend vem fração -> UI quer %
      }));

      const mergedPay: RankingPagamentoRow[] = basePagamentos.map((base) => {
        const found = payBackend.find((x) => normKey(x.key) === normKey(base.key));
        return found ? { ...base, ...found } : base;
      });

      const extrasPay = payBackend
        .filter((x) => !basePagamentos.some((b) => normKey(b.key) === normKey(x.key)))
        .map((x) => ({ ...x })) as RankingPagamentoRow[];

      setRankingPagamentos([...mergedPay, ...extrasPay]);

      // ✅ plataformas: base fixa + merge backend
      const platBackend = (json.groups?.plataformas || []).map((x) => ({
        key: x.key,
        pedidos: x.pedidos,
        valor: Number(x.valor),
        pct: Number(x.pct) * 100,
      }));

      const mergedPlat: PlataformaRow[] = basePlataformas.map((base) => {
        const found = platBackend.find((x) => normKey(x.key) === normKey(base.key));
        if (!found) return base;
        return { ...base, ...found, accent: base.accent ?? pickAccentPlataforma(base.key) };
      });

      const extrasPlat = platBackend
        .filter((x) => !basePlataformas.some((b) => normKey(b.key) === normKey(x.key)))
        .map(
          (x) =>
            ({
              ...x,
              accent: pickAccentPlataforma(x.key),
            }) as PlataformaRow
        );

      setPorPlataforma([...mergedPlat, ...extrasPlat]);

      // ✅ atendimentos: base fixa + merge backend
      const attBackend = (json.groups?.atendimentos || []).map((x) => ({
        key: x.key,
        pedidos: x.pedidos,
        valor: Number(x.valor),
        pct: Number(x.pct) * 100,
      }));

      const mergedAtt: AtendimentoRow[] = baseAtendimentos.map((base) => {
        const found = attBackend.find((x) => normKey(x.key) === normKey(base.key));
        if (!found) return base;
        return { ...base, ...found, accent: base.accent ?? pickAccentAtendimento(base.key) };
      });

      const extrasAtt = attBackend
        .filter((x) => !baseAtendimentos.some((b) => normKey(b.key) === normKey(x.key)))
        .map(
          (x) =>
            ({
              ...x,
              accent: pickAccentAtendimento(x.key),
            }) as AtendimentoRow
        );

      setPorAtendimento([...mergedAtt, ...extrasAtt]);

      // subtitle: mantém por enquanto
      // setSubtitle(...)
    } catch (e: any) {
      console.error("fetch dashboard failed:", e?.message || e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchDashboard({ kind: "period", period: "hoje" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ width: "100%", height: "100%", overflow: "auto", background: "transparent" }}>
      <HeaderDashboard
        title="Dashboard"
        subtitle={subtitle}
        initialPreset="hoje"
        onQueryChange={(q) => fetchDashboard(q)}
      />

      <CardsTopo kpis={kpis} fmtBRL={fmtBRL} />

      <div style={{ padding: 18, paddingTop: 0 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1.05fr 1fr", gap: 12 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <RankingPagamentos rows={rankingPagamentos} />
            <ConferenciaCaixa data={conferencia} />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <PedidosPorPlataforma rows={porPlataforma} />
            <PedidosPorAtendimento rows={porAtendimento} />
            <DespesasDetalhadas rows={despesasDetalhadas} />
          </div>
        </div>

        {loading ? (
          <div style={{ marginTop: 12, color: "rgba(255,255,255,0.55)", fontWeight: 900, fontSize: 12 }}>
            atualizando dados...
          </div>
        ) : null}
      </div>
    </div>
  );
}
