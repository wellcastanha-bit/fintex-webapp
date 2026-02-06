// app/dashboard/components/relatorio_detalhado.tsx
"use client";

import React, { useMemo, useState } from "react";
import { ChevronDown, Search, Trash2, TrendingUp, FileText } from "lucide-react";

type Plataforma = "WHATSAPP" | "BALCÃO" | "AIQFOME" | "IFOOD" | "DELIVERY MUCH";
type Atendimento = "ENTREGA" | "RETIRADA" | "MESA";
type Pagamento = "Dinheiro" | "PIX" | "Débito" | "Crédito" | "Online";
type Status = "EM PRODUÇÃO" | "ENTREGUE" | "CANCELADO" | "PENDENTE";
type Responsavel = "Motoboy 01" | "Motoboy 02" | "Operador de Caixa" | "Gerente";

type PedidoMock = {
  id: string;
  dia: string;
  mes: string;
  cliente: string;
  plataforma: Plataforma;
  atendimento: Atendimento;
  rsInicial: number;
  troco: number;
  rsFinal: number;
  pagamento: Pagamento;
  bairro: string;
  taxaEntrega: number;
  responsavel: Responsavel;
  status: Status;
};

function fmtBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

function SelectLike({
  label,
  value,
  onChange,
  options,
  w,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  w: number;
}) {
  return (
    <div style={{ width: w, minWidth: w }}>
      <div style={{ color: "rgba(255,255,255,0.70)", fontWeight: 900, fontSize: 11, marginBottom: 6 }}>
        {label}
      </div>

      <div style={{ position: "relative" }}>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            width: "100%",
            height: 42,
            borderRadius: 14,
            padding: "0 38px 0 12px",
            border: "1px solid rgba(255,255,255,0.14)",
            outline: "none",
            background: "rgba(0,0,0,0.22)",
            color: "rgba(255,255,255,0.92)",
            fontWeight: 900,
            appearance: "none",
            boxShadow: "0 0 0 1px rgba(79,220,255,0.06)",
            cursor: "pointer",
          }}
        >
          {options.map((op) => (
            <option key={op} value={op} style={{ background: "#061a31", color: "white" }}>
              {op}
            </option>
          ))}
        </select>

        <div
          style={{
            position: "absolute",
            right: 10,
            top: "50%",
            transform: "translateY(-50%)",
            pointerEvents: "none",
            opacity: 0.75,
          }}
        >
          <ChevronDown size={16} />
        </div>
      </div>
    </div>
  );
}

function SearchLike({
  label,
  value,
  onChange,
  w,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  w: number;
  placeholder?: string;
}) {
  return (
    <div style={{ width: w, minWidth: w }}>
      <div style={{ color: "rgba(255,255,255,0.70)", fontWeight: 900, fontSize: 11, marginBottom: 6 }}>
        {label}
      </div>

      <div style={{ position: "relative" }}>
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || ""}
          style={{
            width: "100%",
            height: 42,
            borderRadius: 14,
            padding: "0 12px 0 38px",
            border: "1px solid rgba(255,255,255,0.14)",
            outline: "none",
            background: "rgba(0,0,0,0.22)",
            color: "rgba(255,255,255,0.92)",
            fontWeight: 900,
            boxShadow: "0 0 0 1px rgba(79,220,255,0.06)",
          }}
        />
        <div style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", opacity: 0.75 }}>
          <Search size={16} />
        </div>
      </div>
    </div>
  );
}

function Pill({
  text,
  tone,
}: {
  text: string;
  tone: "aqua" | "green" | "red" | "gray" | "orange";
}) {
  const map = {
    aqua: { bg: "rgba(79,220,255,0.12)", bd: "rgba(79,220,255,0.28)", glow: "rgba(79,220,255,0.20)" },
    green: { bg: "rgba(67, 208, 121, 0.14)", bd: "rgba(67, 208, 121, 0.30)", glow: "rgba(67, 208, 121, 0.22)" },
    red: { bg: "rgba(255, 107, 107, 0.14)", bd: "rgba(255, 107, 107, 0.30)", glow: "rgba(255, 107, 107, 0.22)" },
    orange: { bg: "rgba(255,184,77,0.14)", bd: "rgba(255,184,77,0.28)", glow: "rgba(255,184,77,0.20)" },
    gray: { bg: "rgba(255,255,255,0.06)", bd: "rgba(255,255,255,0.14)", glow: "rgba(255,255,255,0.12)" },
  }[tone];

  return (
    <div
      style={{
        height: 34,
        padding: "0 12px",
        borderRadius: 999,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        background: map.bg,
        border: `1px solid ${map.bd}`,
        color: "rgba(255,255,255,0.92)",
        fontWeight: 950,
        fontSize: 12,
        boxShadow: `0 0 18px ${map.glow}`,
        whiteSpace: "nowrap",
      }}
    >
      {text}
    </div>
  );
}

function Card({
  title,
  icon,
  right,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        borderRadius: 18,
        padding: 16,
        border: "1px solid rgba(79,220,255,0.16)",
        background: "linear-gradient(180deg, rgba(79,220,255,0.10), rgba(255,255,255,0.02))",
        boxShadow: "0 0 0 1px rgba(79,220,255,0.08), 0 18px 55px rgba(0,0,0,0.55)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 12,
              display: "grid",
              placeItems: "center",
              background: "rgba(79,220,255,0.10)",
              border: "1px solid rgba(79,220,255,0.22)",
              boxShadow: "0 0 18px rgba(79,220,255,0.10)",
            }}
          >
            {icon}
          </div>
          <div style={{ color: "rgba(255,255,255,0.92)", fontWeight: 950, fontSize: 14 }}>
            {title}
          </div>
        </div>
        {right ? right : null}
      </div>

      {children}
    </div>
  );
}

function DRELine({
  label,
  value,
  strong,
  sign,
}: {
  label: string;
  value: number;
  strong?: boolean;
  sign?: "plus" | "minus" | "none";
}) {
  const color =
    sign === "minus"
      ? "rgba(255, 107, 107, 0.92)"
      : sign === "plus"
      ? "rgba(79, 220, 255, 0.92)"
      : "rgba(255,255,255,0.92)";

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
      <div style={{ color: "rgba(255,255,255,0.70)", fontWeight: 900, fontSize: 12 }}>
        {label}
      </div>
      <div style={{ color, fontWeight: strong ? 980 : 900, fontSize: strong ? 14 : 13 }}>
        {fmtBRL(value)}
      </div>
    </div>
  );
}

export default function RelatorioDetalhadoView() {
  const pedidos: PedidoMock[] = useMemo(
    () => [
      {
        id: "p1",
        dia: "02",
        mes: "Fev/2026",
        cliente: "Cliente Teste 01",
        plataforma: "WHATSAPP",
        atendimento: "ENTREGA",
        rsInicial: 89.9,
        troco: 0,
        rsFinal: 89.9,
        pagamento: "Dinheiro",
        bairro: "Centro",
        taxaEntrega: 6,
        responsavel: "Motoboy 01",
        status: "EM PRODUÇÃO",
      },
      {
        id: "p2",
        dia: "02",
        mes: "Fev/2026",
        cliente: "Cliente Teste 02",
        plataforma: "BALCÃO",
        atendimento: "RETIRADA",
        rsInicial: 54,
        troco: 0,
        rsFinal: 54,
        pagamento: "PIX",
        bairro: "-",
        taxaEntrega: 0,
        responsavel: "Operador de Caixa",
        status: "ENTREGUE",
      },
      {
        id: "p3",
        dia: "02",
        mes: "Fev/2026",
        cliente: "Amanda Santos",
        plataforma: "AIQFOME",
        atendimento: "ENTREGA",
        rsInicial: 121.5,
        troco: 0,
        rsFinal: 121.5,
        pagamento: "Crédito",
        bairro: "Flor da Serra",
        taxaEntrega: 8,
        responsavel: "Motoboy 02",
        status: "ENTREGUE",
      },
      {
        id: "p4",
        dia: "01",
        mes: "Fev/2026",
        cliente: "Bruno Almeida",
        plataforma: "IFOOD",
        atendimento: "ENTREGA",
        rsInicial: 76.9,
        troco: 0,
        rsFinal: 76.9,
        pagamento: "Online",
        bairro: "Centro",
        taxaEntrega: 9,
        responsavel: "Motoboy 01",
        status: "PENDENTE",
      },
      {
        id: "p5",
        dia: "01",
        mes: "Fev/2026",
        cliente: "Mesa 07",
        plataforma: "BALCÃO",
        atendimento: "MESA",
        rsInicial: 142,
        troco: 0,
        rsFinal: 142,
        pagamento: "Débito",
        bairro: "-",
        taxaEntrega: 0,
        responsavel: "Gerente",
        status: "ENTREGUE",
      },
    ],
    []
  );

  const [fDia, setFDia] = useState<string>("Todos");
  const [fMes, setFMes] = useState<string>("Todos");
  const [fCliente, setFCliente] = useState<string>("");
  const [fPlataforma, setFPlataforma] = useState<string>("Todas");
  const [fAtendimento, setFAtendimento] = useState<string>("Todos");
  const [fPagamento, setFPagamento] = useState<string>("Todos");
  const [fBairro, setFBairro] = useState<string>("Todos");
  const [fResponsavel, setFResponsavel] = useState<string>("Todos");
  const [fStatus, setFStatus] = useState<string>("Todos");

  const dias = useMemo(() => ["Todos", ...Array.from(new Set(pedidos.map((p) => p.dia)))], [pedidos]);
  const meses = useMemo(() => ["Todos", ...Array.from(new Set(pedidos.map((p) => p.mes)))], [pedidos]);
  const plataformas = useMemo(() => ["Todas", ...Array.from(new Set(pedidos.map((p) => p.plataforma)))], [pedidos]);
  const atendimentos = useMemo(() => ["Todos", ...Array.from(new Set(pedidos.map((p) => p.atendimento)))], [pedidos]);
  const pagamentos = useMemo(() => ["Todos", ...Array.from(new Set(pedidos.map((p) => p.pagamento)))], [pedidos]);
  const bairros = useMemo(() => ["Todos", ...Array.from(new Set(pedidos.map((p) => p.bairro)))], [pedidos]);
  const responsaveis = useMemo(() => ["Todos", ...Array.from(new Set(pedidos.map((p) => p.responsavel)))], [pedidos]);
  const statuses = useMemo(() => ["Todos", ...Array.from(new Set(pedidos.map((p) => p.status)))], [pedidos]);

  const filtered = useMemo(() => {
    return pedidos.filter((p) => {
      if (fDia !== "Todos" && p.dia !== fDia) return false;
      if (fMes !== "Todos" && p.mes !== fMes) return false;

      const c = fCliente.trim().toLowerCase();
      if (c && !p.cliente.toLowerCase().includes(c)) return false;

      if (fPlataforma !== "Todas" && p.plataforma !== fPlataforma) return false;
      if (fAtendimento !== "Todos" && p.atendimento !== fAtendimento) return false;
      if (fPagamento !== "Todos" && p.pagamento !== fPagamento) return false;
      if (fBairro !== "Todos" && p.bairro !== fBairro) return false;
      if (fResponsavel !== "Todos" && p.responsavel !== fResponsavel) return false;
      if (fStatus !== "Todos" && p.status !== fStatus) return false;

      return true;
    });
  }, [pedidos, fDia, fMes, fCliente, fPlataforma, fAtendimento, fPagamento, fBairro, fResponsavel, fStatus]);

  const dre = useMemo(() => {
    const receitaBruta = filtered.reduce((s, p) => s + p.rsFinal, 0);
    const taxaEntrega = filtered.reduce((s, p) => s + p.taxaEntrega, 0);

    const descontosMock = receitaBruta * 0.02;
    const receitaLiquida = receitaBruta - descontosMock;

    const cmvMock = receitaLiquida * 0.34;
    const despesasOperMock = receitaLiquida * 0.18;
    const lucroOper = receitaLiquida - cmvMock - despesasOperMock;

    const margem = receitaLiquida > 0 ? lucroOper / receitaLiquida : 0;

    return {
      receitaBruta,
      taxaEntrega,
      descontosMock,
      receitaLiquida,
      cmvMock,
      despesasOperMock,
      lucroOper,
      margem,
      pedidos: filtered.length,
    };
  }, [filtered]);

  const empty = filtered.length === 0;

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        overflow: "auto",
        background:
          "radial-gradient(1200px 700px at 18% 0%, rgba(79,220,255,0.18), rgba(0,0,0,0) 55%), radial-gradient(900px 600px at 85% 10%, rgba(79,220,255,0.10), rgba(0,0,0,0) 60%), linear-gradient(180deg, #041328, #020b18 55%, #020914)",
      }}
    >
      <div style={{ padding: 18, paddingBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 16,
              display: "grid",
              placeItems: "center",
              background: "rgba(79,220,255,0.10)",
              border: "1px solid rgba(79,220,255,0.22)",
              boxShadow: "0 0 22px rgba(79,220,255,0.14)",
            }}
          >
            <FileText size={18} color="rgba(255,255,255,0.92)" />
          </div>
          <div>
            <div style={{ color: "rgba(255,255,255,0.95)", fontWeight: 980, fontSize: 18 }}>
              Relatório Detalhado · DRE por filtros (mock)
            </div>
            <div style={{ marginTop: 2, color: "rgba(255,255,255,0.62)", fontWeight: 850, fontSize: 12 }}>
              Tela estilo “Pedidos” → recorte → DRE do recorte
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: 18, paddingTop: 0 }}>
        <div
          style={{
            borderRadius: 18,
            border: "1px solid rgba(79,220,255,0.18)",
            overflow: "hidden",
            boxShadow: "0 0 0 1px rgba(79,220,255,0.08), 0 18px 55px rgba(0,0,0,0.55)",
            background: "rgba(0,0,0,0.16)",
          }}
        >
          {/* Header aqua (filtros) */}
          <div
            style={{
              background: "linear-gradient(180deg, rgba(22, 120, 145, 0.65), rgba(12, 70, 92, 0.65))",
              borderBottom: "1px solid rgba(79,220,255,0.16)",
              padding: 14,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12, overflowX: "auto", paddingBottom: 2 }}>
              <SelectLike label="DATA" value={fDia} onChange={setFDia} options={dias} w={90} />
              <SelectLike label="MÊS" value={fMes} onChange={setFMes} options={meses} w={140} />
              <SearchLike label="CLIENTE" value={fCliente} onChange={setFCliente} w={260} placeholder="Buscar cliente..." />
              <SelectLike label="PLATAFORMA" value={fPlataforma} onChange={setFPlataforma} options={plataformas} w={180} />
              <SelectLike label="ATENDIMENTO" value={fAtendimento} onChange={setFAtendimento} options={atendimentos} w={160} />
              <SelectLike label="FORMA DE PAGAMENTO" value={fPagamento} onChange={setFPagamento} options={pagamentos} w={220} />
              <SelectLike label="BAIRROS" value={fBairro} onChange={setFBairro} options={bairros} w={180} />
              <SelectLike label="RESPONSÁVEL" value={fResponsavel} onChange={setFResponsavel} options={responsaveis} w={200} />
              <SelectLike label="STATUS" value={fStatus} onChange={setFStatus} options={statuses} w={180} />
            </div>
          </div>

          {/* Corpo */}
          <div style={{ padding: 14 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Card
                title="DRE (mock) do recorte filtrado"
                icon={<TrendingUp size={16} color="rgba(255,255,255,0.92)" />}
                right={
                  <Pill
                    text={empty ? "SEM DADOS" : `MARGEM ${Math.round(clamp(dre.margem, -1, 1) * 100)}%`}
                    tone={empty ? "gray" : dre.lucroOper >= 0 ? "green" : "red"}
                  />
                }
              >
                {empty ? (
                  <div
                    style={{
                      padding: 16,
                      borderRadius: 16,
                      background: "rgba(0,0,0,0.18)",
                      border: "1px dashed rgba(255,255,255,0.16)",
                      color: "rgba(255,255,255,0.70)",
                      fontWeight: 900,
                      lineHeight: 1.35,
                    }}
                  >
                    Nenhum dado nesse filtro ainda.
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <DRELine label="Receita bruta (R$ final)" value={dre.receitaBruta} strong sign="plus" />
                    <DRELine label="Taxa de entrega (soma)" value={dre.taxaEntrega} />
                    <DRELine label="Descontos (mock)" value={dre.descontosMock} sign="minus" />
                    <div style={{ height: 1, background: "rgba(255,255,255,0.10)", margin: "4px 0" }} />
                    <DRELine label="Receita líquida" value={dre.receitaLiquida} strong />
                    <DRELine label="CMV (mock)" value={dre.cmvMock} sign="minus" />
                    <DRELine label="Despesas operacionais (mock)" value={dre.despesasOperMock} sign="minus" />
                    <div style={{ height: 1, background: "rgba(255,255,255,0.10)", margin: "4px 0" }} />
                    <DRELine
                      label="Lucro operacional (mock)"
                      value={dre.lucroOper}
                      strong
                      sign={dre.lucroOper >= 0 ? "plus" : "minus"}
                    />
                  </div>
                )}
              </Card>

              <Card
                title="Resumo do recorte"
                icon={<FileText size={16} color="rgba(255,255,255,0.92)" />}
                right={<Pill text={empty ? "0 RESULTADOS" : `PEDIDOS: ${filtered.length}`} tone={empty ? "gray" : "aqua"} />}
              >
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {[
                    { k: "DATA", v: fDia },
                    { k: "MÊS", v: fMes },
                    { k: "PLATAFORMA", v: fPlataforma },
                    { k: "STATUS", v: fStatus },
                  ].map((x) => (
                    <div
                      key={x.k}
                      style={{
                        padding: 12,
                        borderRadius: 14,
                        background: "rgba(0,0,0,0.18)",
                        border: "1px solid rgba(255,255,255,0.10)",
                      }}
                    >
                      <div style={{ color: "rgba(255,255,255,0.65)", fontWeight: 900, fontSize: 12 }}>{x.k}</div>
                      <div style={{ marginTop: 6, color: "rgba(255,255,255,0.92)", fontWeight: 980, fontSize: 14 }}>
                        {x.v}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Tabela espelho PEDIDOS */}
            <div style={{ marginTop: 12 }}>
              <div
                style={{
                  borderRadius: 18,
                  border: "1px solid rgba(79,220,255,0.16)",
                  overflow: "hidden",
                  background: "rgba(0,0,0,0.14)",
                }}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "90px 140px 260px 180px 160px 120px 110px 120px 220px 180px 160px 200px 180px 54px",
                    padding: "12px 12px",
                    background: "linear-gradient(180deg, rgba(22, 120, 145, 0.60), rgba(12, 70, 92, 0.60))",
                    borderBottom: "1px solid rgba(79,220,255,0.14)",
                    color: "rgba(255,255,255,0.86)",
                    fontWeight: 950,
                    fontSize: 12,
                    textTransform: "uppercase",
                    letterSpacing: 0.3,
                  }}
                >
                  <div>DATA</div>
                  <div>MÊS</div>
                  <div>CLIENTE</div>
                  <div>PLATAFORMA</div>
                  <div>ATENDIMENTO</div>
                  <div>R$ INICIAL</div>
                  <div>TROCO</div>
                  <div>R$ FINAL</div>
                  <div>FORMA DE PAGAMENTO</div>
                  <div>BAIRROS</div>
                  <div>TAXA DE ENTREGA</div>
                  <div>RESPONSÁVEL</div>
                  <div>STATUS</div>
                  <div />
                </div>

                {empty ? (
                  <div style={{ padding: 16 }}>
                    <div
                      style={{
                        padding: 16,
                        borderRadius: 16,
                        border: "1px dashed rgba(255,255,255,0.16)",
                        background: "rgba(0,0,0,0.16)",
                        color: "rgba(255,255,255,0.70)",
                        fontWeight: 900,
                      }}
                    >
                      Nenhum pedido nesse filtro.
                    </div>
                  </div>
                ) : (
                  filtered.map((p) => {
                    const statusTone =
                      p.status === "ENTREGUE"
                        ? "green"
                        : p.status === "EM PRODUÇÃO"
                        ? "red"
                        : p.status === "CANCELADO"
                        ? "gray"
                        : "orange";

                    return (
                      <div
                        key={p.id}
                        style={{
                          display: "grid",
                          gridTemplateColumns:
                            "90px 140px 260px 180px 160px 120px 110px 120px 220px 180px 160px 200px 180px 54px",
                          padding: "10px 12px",
                          borderTop: "1px solid rgba(255,255,255,0.06)",
                          color: "rgba(255,255,255,0.90)",
                          fontWeight: 900,
                          fontSize: 12,
                          alignItems: "center",
                          background: "linear-gradient(180deg, rgba(0,0,0,0.06), rgba(0,0,0,0.14))",
                        }}
                      >
                        <div>{p.dia}</div>
                        <div>{p.mes}</div>
                        <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.cliente}</div>
                        <div>{p.plataforma}</div>
                        <div>{p.atendimento}</div>
                        <div>{fmtBRL(p.rsInicial)}</div>
                        <div>{fmtBRL(p.troco)}</div>
                        <div>{fmtBRL(p.rsFinal)}</div>
                        <div>{p.pagamento}</div>
                        <div>{p.bairro}</div>
                        <div>{fmtBRL(p.taxaEntrega)}</div>

                        <div>
                          <div
                            style={{
                              height: 34,
                              padding: "0 12px",
                              borderRadius: 999,
                              display: "inline-flex",
                              alignItems: "center",
                              background: "rgba(79,220,255,0.10)",
                              border: "1px solid rgba(79,220,255,0.22)",
                              boxShadow: "0 0 18px rgba(79,220,255,0.10)",
                              gap: 8,
                            }}
                          >
                            <span style={{ color: "rgba(255,255,255,0.92)", fontWeight: 950, fontSize: 12 }}>
                              {p.responsavel}
                            </span>
                            <ChevronDown size={14} color="rgba(255,255,255,0.70)" />
                          </div>
                        </div>

                        <div>
                          <Pill text={p.status} tone={statusTone} />
                        </div>

                        <div style={{ display: "grid", placeItems: "center" }}>
                          <button
                            style={{
                              width: 40,
                              height: 40,
                              borderRadius: 14,
                              border: "1px solid rgba(255,255,255,0.12)",
                              background: "rgba(255,255,255,0.06)",
                              color: "rgba(255,255,255,0.80)",
                              cursor: "pointer",
                            }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
