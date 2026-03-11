// app/(app)/dashboard/components/dashboard.tsx
"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { fmtBRL } from "./ui/card_shell";

import HeaderDashboard, {
  type DashboardQuery,
  buildDashboardQS,
} from "./ui/boxes/header_dashboard";
import CardsTopo, { type DashboardKpis } from "./ui/boxes/cards_topo";
import RankingPagamentos, {
  type RankingPagamentoRow,
} from "./ui/boxes/ranking_pagamentos";
import PedidosPorPlataforma, {
  type PlataformaRow,
} from "./ui/boxes/pedidos_por_plataforma";
import PedidosPorAtendimento, {
  type AtendimentoRow,
} from "./ui/boxes/pedidos_por_atendimento";
import ConferenciaCaixa, {
  type ConferenciaData,
} from "./ui/boxes/conferencia_caixa";
import DespesasDetalhadas, {
  type DespesaRow,
} from "./ui/boxes/despesas_detalhadas";

type ApiDashboard = {
  ok: boolean;
  range?: unknown;
  kpis?: {
    pedidos: number;
    faturamento: number;
    ticket_medio: number;
    margem: number;
    lucro_estimado: number;
    despesas: number;
    despesas_pct: number;
    fatias_vendidas?: number;
    valor_fatias?: number;
  };
  conferencia_caixa?: {
    caixa_inicial: number;
    caixa_final: number;
    entradas_dinheiro: number;
    saidas_dinheiro: number;
    prova_real: number;
    quebra_caixa: number;
    status: "OK" | "ATENÇÃO";
  };
  ranking_pagamentos?: Array<{
    label: string;
    pedidos: number;
    valor: number;
    pct: number;
  }>;
  pedidos_por_plataforma?: Array<{
    label: string;
    pedidos: number;
    valor: number;
    pct: number;
  }>;
  pedidos_por_atendimento?: Array<{
    label: string;
    pedidos: number;
    valor: number;
    pct: number;
  }>;
  saidas?: {
    items?: Array<{
      id: string;
      category?: string | null;
      description?: string | null;
      amount: number;
    }>;
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

function mapDespesaLabel(category?: string | null, description?: string | null) {
  const raw = normKey(category || description || "Outros");

  if (
    raw.includes("MOTO") ||
    raw.includes("FRETE") ||
    raw.includes("ENTREGA") ||
    raw.includes("LOGIST")
  ) {
    return "Logística";
  }

  if (
    raw.includes("INSUMO") ||
    raw.includes("EMBALAGEM") ||
    raw.includes("INGREDIENTE") ||
    raw.includes("ALIMENTO")
  ) {
    return "Insumos";
  }

  if (
    raw.includes("MARKETING") ||
    raw.includes("TRAFEGO") ||
    raw.includes("ANUNCIO") ||
    raw.includes("PUBLICIDADE")
  ) {
    return "Marketing";
  }

  if (
    raw.includes("SALARIO") ||
    raw.includes("FUNCION") ||
    raw.includes("FOLHA") ||
    raw.includes("MÃO DE OBRA") ||
    raw.includes("MAO DE OBRA")
  ) {
    return "Mão de Obra";
  }

  if (
    raw.includes("TAXA") ||
    raw.includes("JURO") ||
    raw.includes("TARIFA") ||
    raw.includes("MANUTEN") ||
    raw.includes("ENERGIA") ||
    raw.includes("AGUA") ||
    raw.includes("GÁS") ||
    raw.includes("GAS")
  ) {
    return "Variáveis";
  }

  return "Variáveis";
}

function buildDespesasDetalhadas(
  items: Array<{ category?: string | null; description?: string | null; amount: number }>,
  despesasTotal: number
): DespesaRow[] {
  const baseOrder = ["Logística", "Variáveis", "Insumos", "Marketing", "Mão de Obra"];
  const acc = new Map<string, number>();

  for (const item of items) {
    const key = mapDespesaLabel(item.category, item.description);
    acc.set(key, (acc.get(key) || 0) + Number(item.amount || 0));
  }

  return baseOrder.map((key) => {
    const valor = Number(acc.get(key) || 0);
    const pct = despesasTotal > 0 ? (valor / despesasTotal) * 100 : 0;
    return { key, valor, pct };
  });
}

function makeDashboardKpis(data?: Partial<Record<string, number>>): DashboardKpis {
  return {
    pedidos: Number(data?.pedidos ?? 0),
    faturamento: Number(data?.faturamento ?? 0),
    ticket_medio: Number(data?.ticket_medio ?? 0),
    margem: Number(data?.margem ?? 30),
    lucro_estimado: Number(data?.lucro_estimado ?? 0),
    despesas: Number(data?.despesas ?? 0),
    despesas_pct: Number(data?.despesas_pct ?? 0),
    fatias_vendidas: Number(data?.fatias_vendidas ?? 0),
    valor_fatias: Number(data?.valor_fatias ?? 0),
  };
}

export default function DashboardView() {
  const mockTitle = useMemo(
    () => "Fatias de Pizza · 30/01/2026 · Sexta-feira",
    []
  );

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

  const [subtitle] = useState<string>(mockTitle);
  const [currentQuery, setCurrentQuery] = useState<DashboardQuery>({
    kind: "period",
    period: "hoje",
  } as DashboardQuery);

  const currentQueryRef = useRef<DashboardQuery>(currentQuery);
  const fetchingRef = useRef(false);

  const [kpis, setKpis] = useState<DashboardKpis>(
    makeDashboardKpis({
      pedidos: 0,
      faturamento: 0,
      ticket_medio: 0,
      margem: 30,
      lucro_estimado: 0,
      despesas: 0,
      despesas_pct: 0,
      fatias_vendidas: 0,
      valor_fatias: 0,
    })
  );

  const [rankingPagamentos, setRankingPagamentos] =
    useState<RankingPagamentoRow[]>(basePagamentos);
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

  const [despesasDetalhadas, setDespesasDetalhadas] =
    useState<DespesaRow[]>(baseDespesas);
  const [loading, setLoading] = useState(false);

  const fetchDashboard = useCallback(
    async (q: DashboardQuery) => {
      if (fetchingRef.current) return;

      fetchingRef.current = true;
      setLoading(true);

      try {
        const qs = buildDashboardQS(q);
        const dashRes = await fetch(`/api/dashboard?${qs}`, { cache: "no-store" });
        const json = (await dashRes.json()) as ApiDashboard;

        if (!json?.ok) {
          console.error("dashboard api error:", json?.error || "unknown");
          return;
        }

        const nextKpis = makeDashboardKpis({
          pedidos: json.kpis?.pedidos,
          faturamento: json.kpis?.faturamento,
          ticket_medio: json.kpis?.ticket_medio,
          margem: json.kpis?.margem,
          lucro_estimado: json.kpis?.lucro_estimado,
          despesas: json.kpis?.despesas,
          despesas_pct: json.kpis?.despesas_pct,
          fatias_vendidas: json.kpis?.fatias_vendidas,
          valor_fatias: json.kpis?.valor_fatias,
        });

        setKpis(nextKpis);

        if (json.conferencia_caixa) {
          setConferencia({
            status: json.conferencia_caixa.status ?? "OK",
            caixaInicial: Number(json.conferencia_caixa.caixa_inicial ?? 0),
            entradasDinheiro: Number(json.conferencia_caixa.entradas_dinheiro ?? 0),
            saidas: Number(json.conferencia_caixa.saidas_dinheiro ?? 0),
            caixaFinal: Number(json.conferencia_caixa.caixa_final ?? 0),
            quebra: Number(json.conferencia_caixa.quebra_caixa ?? 0),
          });
        } else {
          setConferencia({
            status: "OK",
            caixaInicial: 0,
            entradasDinheiro: 0,
            saidas: 0,
            caixaFinal: 0,
            quebra: 0,
          });
        }

        const payBackend: RankingPagamentoRow[] = (json.ranking_pagamentos || []).map((x) => ({
          key: x.label,
          pedidos: Number(x.pedidos ?? 0),
          valor: Number(x.valor ?? 0),
          pct: Number(x.pct ?? 0),
        }));

        const mergedPay: RankingPagamentoRow[] = basePagamentos.map((base) => {
          const found = payBackend.find((x) => normKey(x.key) === normKey(base.key));
          return found ? { ...base, ...found } : base;
        });

        const extrasPay: RankingPagamentoRow[] = payBackend.filter(
          (x) => !basePagamentos.some((b) => normKey(b.key) === normKey(x.key))
        );

        setRankingPagamentos([...mergedPay, ...extrasPay]);

        const platBackend = (json.pedidos_por_plataforma || []).map((x) => ({
          key: x.label,
          pedidos: Number(x.pedidos ?? 0),
          valor: Number(x.valor ?? 0),
          pct: Number(x.pct ?? 0),
        }));

        const mergedPlat: PlataformaRow[] = basePlataformas.map((base) => {
          const found = platBackend.find((x) => normKey(x.key) === normKey(base.key));
          if (!found) return base;
          return {
            ...base,
            ...found,
            accent: base.accent ?? pickAccentPlataforma(base.key),
          };
        });

        const extrasPlat: PlataformaRow[] = platBackend
          .filter((x) => !basePlataformas.some((b) => normKey(b.key) === normKey(x.key)))
          .map((x) => ({
            ...x,
            accent: pickAccentPlataforma(x.key),
          })) as PlataformaRow[];

        setPorPlataforma([...mergedPlat, ...extrasPlat]);

        const attBackend = (json.pedidos_por_atendimento || []).map((x) => ({
          key: x.label,
          pedidos: Number(x.pedidos ?? 0),
          valor: Number(x.valor ?? 0),
          pct: Number(x.pct ?? 0),
        }));

        const mergedAtt: AtendimentoRow[] = baseAtendimentos.map((base) => {
          const found = attBackend.find((x) => normKey(x.key) === normKey(base.key));
          if (!found) return base;
          return {
            ...base,
            ...found,
            accent: base.accent ?? pickAccentAtendimento(base.key),
          };
        });

        const extrasAtt: AtendimentoRow[] = attBackend
          .filter((x) => !baseAtendimentos.some((b) => normKey(b.key) === normKey(x.key)))
          .map((x) => ({
            ...x,
            accent: pickAccentAtendimento(x.key),
          })) as AtendimentoRow[];

        setPorAtendimento([...mergedAtt, ...extrasAtt]);

        setDespesasDetalhadas(
          buildDespesasDetalhadas(json.saidas?.items || [], Number(nextKpis.despesas ?? 0))
        );
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : String(e);
        console.error("fetch dashboard failed:", message);
      } finally {
        fetchingRef.current = false;
        setLoading(false);
      }
    },
    [baseAtendimentos, basePagamentos, basePlataformas]
  );

  useEffect(() => {
    currentQueryRef.current = currentQuery;
    fetchDashboard(currentQuery);
  }, [currentQuery, fetchDashboard]);

  useEffect(() => {
    const id = window.setInterval(() => {
      fetchDashboard(currentQueryRef.current);
    }, 5000);

    return () => window.clearInterval(id);
  }, [fetchDashboard]);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        overflow: "auto",
        background: "transparent",
      }}
    >
      <HeaderDashboard
        title="Dashboard"
        subtitle={subtitle}
        initialPreset="hoje"
        onQueryChange={(q) => setCurrentQuery(q)}
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
          <div
            style={{
              marginTop: 12,
              color: "rgba(255,255,255,0.55)",
              fontWeight: 900,
              fontSize: 12,
            }}
          >
            atualizando dados...
          </div>
        ) : null}
      </div>
    </div>
  );
}