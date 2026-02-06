// app/(app)/reservas/page.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import {
  AQUA,
  isoToBR,
  brToISO,
  maskDateBR,
  toISODate,
  titleCaseName,
  formatPhoneBR,
  fmtBRL,
  brlToNumber,
} from "./components/utils";

import type { LocacaoStatus, Reserva } from "./components/types";

import { CardShell, FieldLabel, FieldShell, Input, AquaButton, TimeSelect } from "./components/ui";
import { MonthCalendar } from "./components/calendar";
import { ReservasDoDia } from "./components/reservas-do-dia";

const EVT_REFRESH = "reservas:refresh";

// ✅ mapeia do backend (snake_case) -> Reserva (frontend)
function apiToReserva(row: any): Reserva {
  return {
    id: String(row?.id ?? `r-${Date.now()}`),
    dataISO: String(row?.date ?? ""),
    chegada: String(row?.arrival_time ?? ""),
    saida: row?.departure_time ? String(row.departure_time) : "",
    pessoas: Number(row?.people ?? 1),
    nome: String(row?.name ?? "Sem nome"),
    telefone: row?.phone ? String(row.phone) : "",
    mesa: row?.table_label ? String(row.table_label) : "",
    observacao: row?.description ? String(row.description) : "",
    locacaoDesc: row?.locacao_description ? String(row.locacao_description) : "",
    locacaoValor:
      row?.locacao_value === null || row?.locacao_value === undefined || row?.locacao_value === ""
        ? null
        : Number(row.locacao_value),
    locacaoStatus: row?.locacao_status ? (String(row.locacao_status) as LocacaoStatus) : undefined,
  };
}

export default function ReservasPage() {
  const today = useMemo(() => new Date(), []);
  const [monthDate, setMonthDate] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));

  // ✅ interno ISO, interface BR
  const [selectedISO, setSelectedISO] = useState(() => toISODate(today));
  const [selectedBR, setSelectedBR] = useState(() => isoToBR(toISODate(today)));

  // form
  const [chegada, setChegada] = useState("19:30");
  const [saida, setSaida] = useState(""); // opcional

  const [pessoas, setPessoas] = useState("");
  const [mesa, setMesa] = useState("");

  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [observacao, setObservacao] = useState("");

  const [locacaoDesc, setLocacaoDesc] = useState("");
  const [locacaoValor, setLocacaoValor] = useState("0,00");
  const [locacaoStatus, setLocacaoStatus] = useState<LocacaoStatus>("PENDENTE");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // ✅ agora é o “estado espelho” do backend (hidrata via GET)
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [saving, setSaving] = useState(false);
  const [loadingDay, setLoadingDay] = useState(false);

  const hasReservaByDay = useMemo(() => {
    const map: Record<string, boolean> = {};
    for (const r of reservas) map[r.dataISO] = true;
    return map;
  }, [reservas]);

  const listDia = useMemo(() => {
    return reservas
      .filter((r) => r.dataISO === selectedISO)
      .slice()
      .sort((a, b) => (a.chegada < b.chegada ? -1 : a.chegada > b.chegada ? 1 : 0));
  }, [reservas, selectedISO]);

  const monthLabel = useMemo(() => {
    const m = monthDate.toLocaleString("pt-BR", { month: "long" });
    const y = monthDate.getFullYear();
    return `${m.charAt(0).toUpperCase()}${m.slice(1)} ${y}`;
  }, [monthDate]);

  const prevMonth = () => setMonthDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  const nextMonth = () => setMonthDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));

  const onPickDayISO = (iso: string) => {
    setSelectedISO(iso);
    setSelectedBR(isoToBR(iso));
    setConfirmDeleteId(null);
  };

  const onSelectedBRChange = (v: string) => {
    const masked = maskDateBR(v);
    setSelectedBR(masked);

    const iso = brToISO(masked);
    if (iso) {
      setSelectedISO(iso);
      setConfirmDeleteId(null);
    }
  };

  const resetForm = () => {
    setChegada("19:30");
    setSaida("");
    setPessoas("");
    setMesa("");
    setNome("");
    setTelefone("");
    setObservacao("");
    setLocacaoDesc("");
    setLocacaoValor("0,00");
    setLocacaoStatus("PENDENTE");
    setEditingId(null);
  };

  const limpar = () => resetForm();

  const startEdit = (r: Reserva) => {
    setEditingId(r.id);

    setSelectedISO(r.dataISO);
    setSelectedBR(isoToBR(r.dataISO));

    setChegada(r.chegada || "19:30");
    setSaida(r.saida || "");

    setPessoas(String(r.pessoas ?? ""));
    setMesa(r.mesa || "");

    setNome(r.nome || "");
    setTelefone(r.telefone || "");
    setObservacao(r.observacao || "");

    setLocacaoDesc(r.locacaoDesc || "");
    const cents = Math.round(((r.locacaoValor ?? 0) as number) * 100);
    setLocacaoValor(fmtBRL(String(cents)));
    setLocacaoStatus(r.locacaoStatus || "PENDENTE");

    setConfirmDeleteId(null);
  };

  // ✅ GET do backend (dia selecionado)
  async function loadDay(iso: string) {
    setLoadingDay(true);
    try {
      const res = await fetch(`/api/reservas?date=${encodeURIComponent(iso)}`, { cache: "no-store" });
      const text = await res.text();
      let json: any = null;
      try {
        json = text ? JSON.parse(text) : null;
      } catch {
        json = null;
      }

      if (!res.ok || !json?.ok) {
        console.error("[ReservasPage] GET /api/reservas error:", {
          status: res.status,
          statusText: res.statusText,
          body: text,
        });
        return;
      }

      const arr = Array.isArray(json.reservas) ? json.reservas : [];
      const mapped = arr.map(apiToReserva);

      // ✅ substitui somente as reservas daquele dia, mantendo outros dias já carregados (se existirem)
      setReservas((cur) => {
        const others = cur.filter((r) => r.dataISO !== iso);
        return [...mapped, ...others];
      });
    } finally {
      setLoadingDay(false);
    }
  }

  // ✅ carrega quando muda o dia + escuta evento refresh
  useEffect(() => {
    loadDay(selectedISO);

    const onRefresh = () => loadDay(selectedISO);
    window.addEventListener(EVT_REFRESH, onRefresh);
    return () => window.removeEventListener(EVT_REFRESH, onRefresh);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedISO]);

  // ✅ POST (criar/editar)
  async function postReservaBackend(payload: Reserva) {
const body = {
  id: payload.id, // ✅ ADD ISSO AQUI
  date: payload.dataISO,
  arrival_time: payload.chegada,
  departure_time: payload.saida?.trim() ? payload.saida.trim() : null,
  people: payload.pessoas,
  name: payload.nome,
  phone: payload.telefone?.trim() ? payload.telefone.trim() : null,
  table_label: payload.mesa?.trim() ? payload.mesa.trim() : null,
  description: payload.observacao?.trim() ? payload.observacao.trim() : null,
  locacao_description: payload.locacaoDesc?.trim() ? payload.locacaoDesc.trim() : null,
  locacao_value: typeof payload.locacaoValor === "number" ? payload.locacaoValor : null,
  locacao_status: payload.locacaoStatus ?? null,
};


    const res = await fetch("/api/reservas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const text = await res.text();
    let json: any = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      json = null;
    }

    if (!res.ok || !json?.ok) {
      console.error("[ReservasPage] POST /api/reservas error:", {
        status: res.status,
        statusText: res.statusText,
        body: text,
      });
      throw new Error(json?.error || "Falha ao salvar no backend.");
    }

    return json; // { ok: true, reserva: ... }
  }

  // ✅ DELETE backend
  async function deleteReservaBackend(id: string) {
    const res = await fetch(`/api/reservas?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    const text = await res.text();
    let json: any = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      json = null;
    }

    if (!res.ok || !json?.ok) {
      console.error("[ReservasPage] DELETE /api/reservas error:", {
        status: res.status,
        statusText: res.statusText,
        body: text,
      });
      throw new Error(json?.error || "Falha ao excluir no backend.");
    }
  }

  const doDelete = async (id: string) => {
    setSaving(true);
    try {
      await deleteReservaBackend(id);

      // remove local e recarrega o dia pra garantir estado “espelho”
      setReservas((cur) => cur.filter((x) => x.id !== id));
      setConfirmDeleteId(null);
      if (editingId === id) setEditingId(null);

      window.dispatchEvent(new Event(EVT_REFRESH));
    } catch (e) {
      console.error("[ReservasPage] delete failed:", e);
    } finally {
      setSaving(false);
    }
  };

  const criarOuSalvar = async () => {
    const nP = Math.max(1, Number(String(pessoas).replace(/[^\d]/g, "")) || 1);

    const nomeFmt = titleCaseName(nome);
    const telFmt = formatPhoneBR(telefone);

    const locDesc = (locacaoDesc || "").trim();
    const locValNum = brlToNumber(locacaoValor);
    const hasLocacao = !!locDesc || locValNum > 0;

    const localId = editingId ? editingId : `r-${Date.now()}`;

    const payload: Reserva = {
      id: localId,
      dataISO: selectedISO,
      chegada: chegada || "19:00",
      saida: saida || "",
      pessoas: nP,
      nome: (nomeFmt || "").trim() || "Sem nome",
      telefone: (telFmt || "").trim(),
      mesa: (mesa || "").trim(),
      observacao: (observacao || "").trim(),
      ...(hasLocacao
        ? {
            locacaoDesc: locDesc || "",
            locacaoValor: locValNum > 0 ? locValNum : null,
            locacaoStatus,
          }
        : {
            locacaoDesc: "",
            locacaoValor: null,
            locacaoStatus: undefined,
          }),
    };

    setSaving(true);
    try {
      // 1) POST no backend
      const json = await postReservaBackend(payload);
      const backendId = String(json?.reserva?.id || payload.id);

      // 2) atualiza local
      const finalPayload: Reserva = { ...payload, id: backendId };

      setReservas((cur) => {
        const idx = cur.findIndex((x) => x.id === payload.id || x.id === backendId);
        if (idx >= 0) {
          const copy = cur.slice();
          copy[idx] = finalPayload;
          return copy;
        }
        return [finalPayload, ...cur];
      });

      // 3) recarrega dia do backend (mão dupla)
      window.dispatchEvent(new Event(EVT_REFRESH));

      resetForm();
    } catch (e) {
      console.error("[ReservasPage] save failed:", e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      style={{
        width: "100%",
        minWidth: 0,
        boxSizing: "border-box",
        position: "relative",
      }}
    >
      {/* TOPO */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 18 }}>
        <div style={{ fontWeight: 900, fontSize: 34, color: "#ffffff" }}>Reservas</div>

        <Link
          href="/pedidos"
          style={{
            textDecoration: "none",
            color: "#eaf0ff",
            fontWeight: 900,
            fontSize: 14,
            opacity: 0.85,
            marginLeft: 8,
          }}
        >
          {/* (tu deixou vazio, mantive) */}
        </Link>

        <div style={{ marginLeft: "auto", color: "#eaf0ff", fontWeight: 900, opacity: 0.75, fontSize: 12 }}>
          {saving || loadingDay ? (
            <span>
              Salvando/Carregando… <span style={{ color: AQUA }}>●</span>
            </span>
          ) : (
            <span>
              Backend: <span style={{ color: AQUA }}>OK</span>
            </span>
          )}
        </div>
      </div>

      {/* GRID PRINCIPAL */}
      <div style={{ display: "grid", gridTemplateColumns: "500px 600px", gap: 18, alignItems: "start" }}>
        {/* COLUNA ESQUERDA */}
        <div style={{ display: "grid", gap: 18 }}>
          {/* CALENDÁRIO */}
          <CardShell title="Calendário">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <div style={{ color: "#ffffff", fontWeight: 900, fontSize: 22 }}>{monthLabel}</div>

              <div style={{ display: "flex", gap: 10 }}>
                <AquaButton onClick={prevMonth}>◀</AquaButton>
                <AquaButton onClick={nextMonth}>▶</AquaButton>
              </div>
            </div>

            <MonthCalendar
              monthDate={monthDate}
              selectedISO={selectedISO}
              onSelectISO={onPickDayISO}
              hasReservaByDay={hasReservaByDay}
            />

            <div style={{ marginTop: 14, display: "grid", gap: 8 }}>
              <FieldLabel></FieldLabel>
              <FieldShell>
                <Input
                  value={selectedBR}
                  onChange={onSelectedBRChange}
                  placeholder="dd/mm/aaaa"
                  inputMode="numeric"
                  filled={!!brToISO(selectedBR)}
                />
              </FieldShell>

              <div style={{ color: "#eaf0ff", fontWeight: 900, opacity: 0.75, fontSize: 12 }}>
                <span style={{ color: AQUA }}></span>
              </div>
            </div>
          </CardShell>

          {/* RESERVAS DO DIA */}
          <ReservasDoDia
            title={`Reservas do dia: ${isoToBR(selectedISO)}`}
            listDia={listDia}
            confirmDeleteId={confirmDeleteId}
            setConfirmDeleteId={setConfirmDeleteId}
            startEdit={startEdit}
            doDelete={doDelete}
          />
        </div>

        {/* COLUNA DIREITA */}
        <CardShell title="Nova reserva">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div>
              <FieldLabel>Horário chegada</FieldLabel>
              <FieldShell>
                <TimeSelect value={chegada} onChange={setChegada} />
              </FieldShell>
            </div>

            <div>
              <FieldLabel>Horário saída (opcional)</FieldLabel>
              <FieldShell>
                <TimeSelect value={saida} onChange={setSaida} allowEmpty />
              </FieldShell>
            </div>

            <div>
              <FieldLabel>Pessoas</FieldLabel>
              <FieldShell>
                <Input value={pessoas} onChange={setPessoas} placeholder="Quantidade de pessoas:" inputMode="numeric" align="left" />
              </FieldShell>
            </div>

            <div>
              <FieldLabel>Mesa (opcional)</FieldLabel>
              <FieldShell>
                <Input value={mesa} onChange={setMesa} placeholder="Ex: 04" />
              </FieldShell>
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <FieldLabel>Nome</FieldLabel>
              <FieldShell>
                <Input value={nome} onChange={setNome} placeholder="Nome do cliente" onBlur={() => setNome((cur) => titleCaseName(cur))} />
              </FieldShell>
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <FieldLabel>Telefone (opcional)</FieldLabel>
              <FieldShell>
                <Input
                  value={telefone}
                  onChange={setTelefone}
                  placeholder="WhatsApp / telefone"
                  inputMode="numeric"
                  onBlur={() => setTelefone((cur) => formatPhoneBR(cur))}
                />
              </FieldShell>
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <FieldLabel>Observação (opcional)</FieldLabel>
              <FieldShell>
                <Input value={observacao} onChange={setObservacao} placeholder="Ex: Deck Inferior / Salão Inferior / Deck Superior " />
              </FieldShell>
            </div>

            {/* LOCAÇÃO */}
            <div style={{ gridColumn: "1 / -1", display: "grid", gap: 12 }}>
              <div>
                <FieldLabel>Locação</FieldLabel>
                <FieldShell>
                  <Input value={locacaoDesc} onChange={setLocacaoDesc} placeholder="Descrição: Período Vespertino / Período Noturno" />
                </FieldShell>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 12, alignItems: "end" }}>
                <div>
                  <FieldLabel>Valor</FieldLabel>
                  <FieldShell>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, width: "100%" }}>
                      <div style={{ color: "#fff", fontWeight: 900 }}>R$</div>
                      <Input
                        value={locacaoValor}
                        onChange={(v) => setLocacaoValor(fmtBRL(v))}
                        placeholder="0,00"
                        inputMode="numeric"
                        align="right"
                        filled={brlToNumber(locacaoValor) > 0}
                      />
                    </div>
                  </FieldShell>
                </div>

                <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                  {(["PAGO", "PENDENTE"] as LocacaoStatus[]).map((st) => {
                    const active = locacaoStatus === st;
                    return (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setLocacaoStatus(st)}
                        style={{
                          height: 54,
                          padding: "0 16px",
                          borderRadius: 16,
                          border: active ? "1px solid rgba(79,220,255,0.55)" : "1px solid rgba(255,255,255,0.14)",
                          background: active ? "rgba(79,220,255,0.14)" : "rgba(255,255,255,0.06)",
                          color: "#fff",
                          fontWeight: 900,
                          cursor: "pointer",
                          userSelect: "none",
                        }}
                      >
                        {st === "PAGO" ? "Pago" : "Pendente"}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div style={{ gridColumn: "1 / -1", display: "grid", gridTemplateColumns: "1fr 140px", gap: 14 }}>
              <AquaButton full onClick={criarOuSalvar} disabled={saving}>
                {editingId ? "Salvar alterações" : "Criar reserva"}
              </AquaButton>
              <AquaButton onClick={limpar} disabled={saving}>
                {editingId ? "Cancelar edição" : "Limpar"}
              </AquaButton>
            </div>

            {editingId && (
              <div style={{ gridColumn: "1 / -1", color: "#eaf0ff", fontWeight: 900, opacity: 0.75, fontSize: 12 }}></div>
            )}
          </div>
        </CardShell>
      </div>
    </div>
  );
}
