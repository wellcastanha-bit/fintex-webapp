// app/(app)/dashboard/components/dashboard.tsx
"use client";

import React, { useMemo } from "react";
import { fmtBRL } from "./ui/card_shell";

import HeaderDashboard from "./ui/boxes/header_dashboard";
import CardsTopo from "./ui/boxes/cards_topo";
import RankingPagamentos, { type RankingPagamentoRow } from "./ui/boxes/ranking_pagamentos";
import PedidosPorPlataforma, { type PlataformaRow } from "./ui/boxes/pedidos_por_plataforma";
import PedidosPorAtendimento, { type AtendimentoRow } from "./ui/boxes/pedidos_por_atendimento";
import ConferenciaCaixa, { type ConferenciaData } from "./ui/boxes/conferencia_caixa";
import DespesasDetalhadas, { type DespesaRow } from "./ui/boxes/despesas_detalhadas";

export default function DashboardView() {
  const mock = useMemo(() => {
    const rankingPagamentos: RankingPagamentoRow[] = [
      { key: "DINHEIRO", pedidos: 6, valor: 780.5, pct: 32.1 },
      { key: "PAGAMENTO ONLINE", pedidos: 10, valor: 726.17, pct: 29.9 },
      { key: "CARTÃO DE CRÉDITO", pedidos: 6, valor: 384.13, pct: 15.8 },
      { key: "PIX", pedidos: 7, valor: 358.02, pct: 14.7 },
      { key: "CARTÃO DE DÉBITO", pedidos: 2, valor: 180.66, pct: 7.4 },
    ];

    const porPlataforma: PlataformaRow[] = [
      { key: "AIQFOME", pedidos: 11, valor: 842.07, pct: 34.7, accent: "purple" },
      { key: "BALCÃO", pedidos: 9, valor: 744.99, pct: 30.7, accent: "blue" },
      { key: "WHATSAPP", pedidos: 6, valor: 486.59, pct: 20.0, accent: "green" },
      { key: "DELIVERY MUCH", pedidos: 3, valor: 223.85, pct: 9.2, accent: "orange" },
      { key: "IFOOD", pedidos: 2, valor: 131.98, pct: 5.4, accent: "red" },
    ];

    const porAtendimento: AtendimentoRow[] = [
      { key: "ENTREGA", pedidos: 18, valor: 1540.22, pct: 63.4, accent: "gray" },
      { key: "RETIRADA", pedidos: 10, valor: 721.5, pct: 29.7, accent: "blue" },
      { key: "MESAS", pedidos: 3, valor: 167.76, pct: 6.9, accent: "orange" },
    ];

    const conferencia: ConferenciaData = {
      status: "OK",
      caixaInicial: 600,
      entradasDinheiro: 780.5,
      saidas: 206,
      caixaFinal: 1174.5,
      quebra: 0,
    };

    const despesasDetalhadas: DespesaRow[] = [
      { key: "Logística", pct: 7.7, valor: 186 },
      { key: "Variáveis", pct: 0.8, valor: 20 },
      { key: "Insumos", pct: 0.0, valor: 0 },
      { key: "Marketing", pct: 0.0, valor: 0 },
      { key: "Mão de Obra", pct: 0.0, valor: 0 },
    ];

    return {
      titleDate: "Pizza Blu · 30/01/2026 · Sexta-feira",
      pedidos: 31,
      ticketMedio: 78.37,
      faturamento: 2429.48,
      lucroEstimado: 485.9,
      margemPct: 20.0,
      despesas: 206,
      despesasPct: 8.5,
      rankingPagamentos,
      porPlataforma,
      porAtendimento,
      conferencia,
      despesasDetalhadas,
    };
  }, []);

  return (
    <div style={{ width: "100%", height: "100%", overflow: "auto", background: "transparent" }}>
    <HeaderDashboard
  title="Dashboard"
  subtitle={mock.titleDate}
/>


      <CardsTopo
        pedidos={mock.pedidos}
        ticketMedio={mock.ticketMedio}
        faturamento={mock.faturamento}
        lucroEstimado={mock.lucroEstimado}
        margemPct={mock.margemPct}
        despesas={mock.despesas}
        despesasPct={mock.despesasPct}
        fmtBRL={fmtBRL}
      />

      <div style={{ padding: 18, paddingTop: 0 }}>

        <div style={{ display: "grid", gridTemplateColumns: "1.05fr 1fr", gap: 12 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <RankingPagamentos rows={mock.rankingPagamentos} />
            <ConferenciaCaixa data={mock.conferencia} />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <PedidosPorPlataforma rows={mock.porPlataforma} />
            <PedidosPorAtendimento rows={mock.porAtendimento} />
            <DespesasDetalhadas rows={mock.despesasDetalhadas} />
          </div>
        </div>
      </div>
    </div>
  );
}
