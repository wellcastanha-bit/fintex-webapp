"use client";

import React, { useMemo, useState } from "react";
import FechamentoCaixa from "./fechamentocaixa";

import { brl, matchLoose, matchMotoboy, matchPlataforma, stripPrefix } from "./pedidos.utils";
import { glowBox, Stat } from "./pedidos.styles";

type Props = {
  q: string;
  setQ: React.Dispatch<React.SetStateAction<string>>;

  fechamentoOpen: boolean;
  setFechamentoOpen: React.Dispatch<React.SetStateAction<boolean>>;

  responsavelFilter: string;
  setResponsavelFilter: React.Dispatch<React.SetStateAction<string>>;

  plataformaFilter: string;
  setPlataformaFilter: React.Dispatch<React.SetStateAction<string>>;

  atendimentoFilter: string;
  setAtendimentoFilter: React.Dispatch<React.SetStateAction<string>>;

  pagamentoFilter: string;
  setPagamentoFilter: React.Dispatch<React.SetStateAction<string>>;

  autosomasMotoboy: { repassePizzaria: number; qtdeEntregas: number; valorEntregas: number };
  autosomasGerais: { qtdePedidos: number; valorTotal: number };
};

export default function PedidosHeader(props: Props) {
  const {
    q,
    setQ,
    fechamentoOpen,
    setFechamentoOpen,
    responsavelFilter,
    setResponsavelFilter,
    plataformaFilter,
    setPlataformaFilter,
    atendimentoFilter,
    setAtendimentoFilter,
    pagamentoFilter,
    setPagamentoFilter,
    autosomasMotoboy,
    autosomasGerais,
  } = props;

  const [hoverSearchWrap, setHoverSearchWrap] = useState(false);
  const [hoverBtn, setHoverBtn] = useState(false);

  const activeLabel = useMemo(() => {
    return (
      responsavelFilter ||
      (plataformaFilter ? `Pedidos - ${plataformaFilter}` : "") ||
      (pagamentoFilter ? `Entradas - ${pagamentoFilter}` : "") ||
      (atendimentoFilter ? atendimentoFilter : "") ||
      "Fechamento de Caixa"
    );
  }, [responsavelFilter, plataformaFilter, pagamentoFilter, atendimentoFilter]);

  const hasAnyFilter = !!(responsavelFilter || plataformaFilter || atendimentoFilter || pagamentoFilter);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 96,
        marginBottom: 26,
        position: "relative",
        zIndex: 30,
      }}
    >
      <div style={{ fontWeight: 900, fontSize: 30, color: "#ffffff" }}>Pedidos</div>

      <div
        onMouseEnter={() => setHoverSearchWrap(true)}
        onMouseLeave={() => setHoverSearchWrap(false)}
        style={{
          width: 360,
          height: 44,
          borderRadius: 12,
          padding: "0 12px",
          display: "flex",
          alignItems: "center",
          background: `linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.04) 25%, rgba(6,16,37,0.95) 100%)`,
          border: hoverSearchWrap ? "1px solid rgba(79,220,255,0.55)" : "1px solid rgba(255,255,255,0.14)",
          boxShadow: hoverSearchWrap
            ? "inset 0 1px 0 rgba(255,255,255,0.12), 0 0 18px rgba(79,220,255,0.45)"
            : "inset 0 1px 0 rgba(255,255,255,0.10), inset 0 -1px 0 rgba(0,0,0,0.45)",
          transition: "border 160ms ease, box-shadow 160ms ease",
          boxSizing: "border-box",
        }}
      >
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Procurar pedido..."
          style={{
            width: "100%",
            height: 40,
            background: "transparent",
            border: "none",
            outline: "none",
            color: "#eaf0ff",
            fontSize: 18,
            fontWeight: 700,
          }}
        />
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ position: "relative", display: "inline-block" }}>
          <button
            type="button"
            onClick={() => setFechamentoOpen((v) => !v)}
            onMouseEnter={() => setHoverBtn(true)}
            onMouseLeave={() => setHoverBtn(false)}
            style={{
              height: 40,
              padding: "0 14px",
              borderRadius: 12,
              border: hoverBtn ? "1px solid rgba(79,220,255,0.55)" : "1px solid rgba(79,220,255,0.40)",
              background: `
                radial-gradient(700px 140px at 15% -10%, rgba(79,220,255,0.10) 0%, rgba(79,220,255,0.05) 40%, rgba(79,220,255,0.03) 65%),
                linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.03) 22%, rgba(6,16,37,0.94) 100%)
              `,
              color: "#fff",
              fontWeight: 900,
              letterSpacing: 0.2,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 10,
              boxShadow: hoverBtn ? glowBox(true) : glowBox(false),
              userSelect: "none",
              whiteSpace: "nowrap",
              transition: "border 160ms ease, box-shadow 160ms ease",
            }}
            title="Fechamento de Caixa"
          >
            <span
              style={{
                width: 12,
                height: 12,
                borderRadius: 999,
                background: "#4fdcff",
                boxShadow: "0 0 0 4px rgba(79,220,255,0.18)",
              }}
            />
            <span>{activeLabel}</span>

            {hasAnyFilter && (
              <span
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setResponsavelFilter("");
                  setPlataformaFilter("");
                  setAtendimentoFilter("");
                  setPagamentoFilter("");
                  setFechamentoOpen(false);
                }}
                title="Limpar filtros"
                style={{
                  marginLeft: 10,
                  width: 26,
                  height: 26,
                  borderRadius: 999,
                  border: "1px solid rgba(255,255,255,0.35)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 16,
                  lineHeight: "16px",
                  fontWeight: 900,
                  cursor: "pointer",
                  userSelect: "none",
                }}
              >
                ✕
              </span>
            )}
          </button>

          {fechamentoOpen && (
            <div style={{ position: "absolute", top: 44, left: 0, zIndex: 9999 }}>
              <FechamentoCaixa
                {...({
                  open: fechamentoOpen,
                  onToggle: () => setFechamentoOpen(false),

                  responsavelFilter,
                  onPickMotoboy: (label: string) => {
                    setResponsavelFilter((cur) => (matchMotoboy(cur, label) ? "" : label));
                    setFechamentoOpen(false);
                  },

                  plataformaFilter,
                  onPickPlataforma: (label: string) => {
                    const value = stripPrefix(label, "Pedidos - ");
                    setPlataformaFilter((cur) => (matchPlataforma(cur, value) ? "" : value));
                    setFechamentoOpen(false);
                  },

                  atendimentoFilter,
                  onPickAtendimento: (label: string) => {
                    const up = label.toString().trim().toUpperCase();
                    const mapped =
                      up === "RETIRADAS" ? "RETIRADA" : up === "ENTREGAS" ? "ENTREGA" : up === "MESAS" ? "MESA" : label;
                    setAtendimentoFilter((cur) => (matchLoose(cur, mapped) ? "" : String(mapped)));
                    setFechamentoOpen(false);
                  },

                  pagamentoFilter,
                  onPickPagamento: (label: string) => {
                    const value = stripPrefix(label, "Entradas - ");
                    setPagamentoFilter((cur) => (matchLoose(cur, value) ? "" : value));
                    setFechamentoOpen(false);
                  },
                } as any)}
              />
            </div>
          )}
        </div>

        {responsavelFilter && (
          <>
            <Stat label="Repasse - Pizzaria" value={brl(autosomasMotoboy.repassePizzaria)} />
            <Stat label="Qtde Entregas" value={String(autosomasMotoboy.qtdeEntregas)} />
            <Stat label="Valor das Entregas" value={brl(autosomasMotoboy.valorEntregas)} />
          </>
        )}

        {!responsavelFilter && (plataformaFilter || atendimentoFilter || pagamentoFilter) && (
          <>
            <Stat label="Qtde - Pedidos" value={String(autosomasGerais.qtdePedidos)} />
            <Stat label="Valor Total" value={brl(autosomasGerais.valorTotal)} />
          </>
        )}
      </div>
    </div>
  );
}
