/* =========================================
   app/pedidos/pedidosclient.tsx
   ✅ FRONT BURRO (SEM TENANT / SEM API / SEM LS / SEM WINDOW)
   ✅ recebe pedidos do PAI via props
   ✅ delete pede pro PAI (callback)
   ✅ não mexe em layout
   ✅ regra 40px: ZERO padding externo aqui (shell controla)
========================================= */
"use client";

import React, { useMemo, useRef, useState } from "react";

import { COLS, type Row, type ColDef } from "./pedidos.constant";
import { ensureAllCols, matchLoose, matchMotoboy, matchPlataforma, normKey, parseBRLToNumber } from "./pedidos.utils";

import PedidosHeader from "./pedidosheader";
import PedidosTable from "./pedidostable";
import PedidosConfirmDeleteModal from "./pedidosconfirmdeletemodal";

export type OrdersSourceItem = {
  id: string;
  created_at: string; // ISO

  status?: string | null;
  responsavel?: string | null;

  cliente_nome?: string | null;
  plataforma?: string | null;
  atendimento?: string | null;

  bairro?: string | null;
  taxa_entrega?: number | null;

  pagamento?: string | null;
  valor_pago?: number | null;
  valor_final?: number | null;
  troco?: number | null;
};

const MONTHS_PT = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function monthLabelFromISO(iso: string) {
  const d = new Date(iso);
  const m = MONTHS_PT[d.getMonth()] ?? "";
  const y = d.getFullYear();
  return `${m}/${y}`;
}

function dayFromISO(iso: string) {
  const d = new Date(iso);
  return pad2(d.getDate());
}

function nicePayLabel(p: string) {
  const up = (p ?? "").toString().trim().toUpperCase();
  if (!up) return "";
  if (up === "DINHEIRO") return "Dinheiro";
  if (up === "DEBITO" || up === "DÉBITO" || up === "CARTÃO DE DÉBITO") return "Cartão de Débito";
  if (up === "CREDITO" || up === "CRÉDITO" || up === "CARTÃO DE CRÉDITO") return "Cartão de Crédito";
  if (up === "ONLINE" || up === "PAGAMENTO ONLINE") return "Pagamento Online";
  if (up === "PIX") return "PIX";
  return up;
}

function toNumSafe(v: any) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function mapOrderToRow(o: OrdersSourceItem): Row {
  const id = String(o?.id ?? "");
  const createdAt = String(o?.created_at ?? new Date().toISOString());

  const data = dayFromISO(createdAt);
  const mes = monthLabelFromISO(createdAt);

  const cliente = String(o?.cliente_nome ?? "");
  const plataforma = String(o?.plataforma ?? "").toUpperCase();
  const atendimento = String(o?.atendimento ?? "").toUpperCase();

  const valorInicial = toNumSafe(o?.valor_pago ?? 0);
  const valorFinal = toNumSafe(o?.valor_final ?? 0);
  const troco = toNumSafe(o?.troco ?? 0);

  const bairro = String(o?.bairro ?? "");
  const taxaEntrega = toNumSafe(o?.taxa_entrega ?? 0);

  const responsavel = o?.responsavel ? String(o.responsavel) : "-";
  const status = o?.status ? String(o.status) : "EM PRODUÇÃO";

  const forma = nicePayLabel(String(o?.pagamento ?? ""));

  return ensureAllCols({
    __ID: id,
    __ROWNUMBER: 0,

    [normKey("DATA")]: data,
    [normKey("MÊS")]: mes,
    [normKey("CLIENTE")]: cliente,
    [normKey("PLATAFORMA")]: plataforma,
    [normKey("ATENDIMENTO")]: atendimento,

    [normKey("R$ INICIAL")]: valorInicial,
    [normKey("TROCO")]: troco,
    [normKey("R$ FINAL")]: valorFinal,

    [normKey("FORMA DE PAGAMENTO")]: forma,
    [normKey("BAIRROS")]: bairro || "-",
    [normKey("TAXA DE ENTREGA")]: taxaEntrega,

    [normKey("RESPONSÁVEL")]: responsavel,
    [normKey("STATUS")]: status,
  });
}

type Props = {
  // ✅ fonte de dados vem do PAI (server/page/hook)
  orders: OrdersSourceItem[];

  // ✅ quando deletar, quem apaga é o PAI (api/server/supabase)
  onRequestDelete?: (id: string) => Promise<void> | void;

  // opcional: se o pai quiser “piscar” highlight quando chegar pedido novo
  highlightIdsFromParent?: string[];
};

export default function PedidosClient({ orders, onRequestDelete, highlightIdsFromParent }: Props) {
  const [q, setQ] = useState<string>("");

  // ✅ rows derivadas dos orders (front burro)
  const rows = useMemo(() => (orders || []).map(mapOrderToRow), [orders]);

  // ✅ highlight da TABELA (seleção/click). Mantém como está.
  const [highlightIds, setHighlightIds] = useState<string[]>([]);
  const highlightSetRef = useRef<Set<string>>(new Set());

  // ✅ se o pai mandar highlight “novo pedido”, aplica aqui sem misturar com seleção
  React.useEffect(() => {
    if (!highlightIdsFromParent?.length) return;
    setHighlightIds(highlightIdsFromParent);
  }, [highlightIdsFromParent]);

  const [responsavelFilter, setResponsavelFilter] = useState<string>("");
  const [plataformaFilter, setPlataformaFilter] = useState<string>("");
  const [atendimentoFilter, setAtendimentoFilter] = useState<string>("");
  const [pagamentoFilter, setPagamentoFilter] = useState<string>("");

  const [fechamentoOpen, setFechamentoOpen] = useState<boolean>(false);

  const [confirmOpen, setConfirmOpen] = useState<boolean>(false);
  const [confirmId, setConfirmId] = useState<string>("");
  const [confirmBusy, setConfirmBusy] = useState<boolean>(false);

  const minWidth = useMemo(() => COLS.reduce((a: number, c: ColDef) => a + c.w, 0), []);

  const base = useMemo(() => {
    let rws = rows;

    if (responsavelFilter) rws = rws.filter((r: Row) => matchMotoboy(r?.[normKey("RESPONSÁVEL")], responsavelFilter));
    if (plataformaFilter) rws = rws.filter((r: Row) => matchPlataforma(r?.[normKey("PLATAFORMA")], plataformaFilter));
    if (atendimentoFilter) rws = rws.filter((r: Row) => matchLoose(r?.[normKey("ATENDIMENTO")], atendimentoFilter));
    if (pagamentoFilter) rws = rws.filter((r: Row) => matchLoose(r?.[normKey("FORMA DE PAGAMENTO")], pagamentoFilter));

    return rws;
  }, [rows, responsavelFilter, plataformaFilter, atendimentoFilter, pagamentoFilter]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return base;

    return base.filter((r: Row) =>
      COLS.some((c: ColDef) => {
        if (c.type === "action") return false;
        return (r?.[normKey(c.key)] ?? "").toString().toLowerCase().includes(term);
      })
    );
  }, [q, base]);

  const autosomasMotoboy = useMemo(() => {
    let repassePizzaria = 0;
    let qtdeEntregas = 0;
    let valorEntregas = 0;

    for (const r of base) {
      const vInicial = parseBRLToNumber(r?.[normKey("R$ INICIAL")]);
      const vTaxa = parseBRLToNumber(r?.[normKey("TAXA DE ENTREGA")]);

      const forma = (r?.[normKey("FORMA DE PAGAMENTO")] ?? "").toString().trim().toUpperCase();
      if (forma === "DINHEIRO" && typeof vInicial === "number") repassePizzaria += vInicial;

      if (typeof vTaxa === "number") valorEntregas += vTaxa;

      const atend = (r?.[normKey("ATENDIMENTO")] ?? "").toString().trim().toUpperCase();
      if (atend === "ENTREGA") qtdeEntregas += 1;
    }

    return { repassePizzaria, qtdeEntregas, valorEntregas };
  }, [base]);

  const autosomasGerais = useMemo(() => {
    let qtdePedidos = 0;
    let valorTotal = 0;

    for (const r of base) {
      qtdePedidos += 1;
      const v = parseBRLToNumber(r?.[normKey("R$ INICIAL")]);
      if (typeof v === "number") valorTotal += v;
    }

    return { qtdePedidos, valorTotal };
  }, [base]);

  const hasAnyFilter = !!(responsavelFilter || plataformaFilter || atendimentoFilter || pagamentoFilter);

  function openConfirmDelete(id: string) {
    if (!id) return;
    setConfirmId(id);
    setConfirmOpen(true);
  }

  function closeConfirm() {
    if (confirmBusy) return;
    setConfirmOpen(false);
    setConfirmId("");
  }

  async function confirmDelete() {
    if (!confirmId) return;
    if (confirmBusy) return;

    try {
      setConfirmBusy(true);
      await onRequestDelete?.(confirmId); // ✅ pai apaga (backend)
      setConfirmBusy(false);
      closeConfirm();
    } catch (e) {
      console.error("[PedidosClient] delete failed:", e);
      setConfirmBusy(false);
      closeConfirm();
    }
  }

  return (
    <div style={{ width: "100%", minWidth: 0, boxSizing: "border-box", position: "relative" }}>
      <PedidosConfirmDeleteModal open={confirmOpen} busy={confirmBusy} onClose={closeConfirm} onConfirm={confirmDelete} />

      <PedidosHeader
        q={q}
        setQ={setQ}
        fechamentoOpen={fechamentoOpen}
        setFechamentoOpen={setFechamentoOpen}
        responsavelFilter={responsavelFilter}
        setResponsavelFilter={setResponsavelFilter}
        plataformaFilter={plataformaFilter}
        setPlataformaFilter={setPlataformaFilter}
        atendimentoFilter={atendimentoFilter}
        setAtendimentoFilter={setAtendimentoFilter}
        pagamentoFilter={pagamentoFilter}
        setPagamentoFilter={setPagamentoFilter}
        autosomasMotoboy={autosomasMotoboy}
        autosomasGerais={autosomasGerais}
      />

      <PedidosTable
        filtered={filtered}
        minWidth={minWidth}
        highlightSetRef={highlightSetRef}
        setHighlightIds={setHighlightIds}
        confirmBusy={confirmBusy}
        onRequestDelete={openConfirmDelete}
        setRows={() => {
          /* front burro: tabela não muda o source */
        }}
      />

      {!filtered.length && (
        <div style={{ padding: 14, fontWeight: 900 }}>
          {rows.length ? (hasAnyFilter ? "Nenhum pedido bateu com esse filtro." : "Nada encontrado na busca.") : "Nada para mostrar."}
        </div>
      )}
    </div>
  );
}
