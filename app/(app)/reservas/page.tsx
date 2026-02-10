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

  // ✅ cache local (AGORA: mês inteiro + refresh do dia)
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [saving, setSaving] = useState(false);
  const [loadingDay, setLoadingDay] = useState(false);
  const [loadingMonth, setLoadingMonth] = useState(false);

  // ✅ calendário: destaca tudo que estiver no cache (mês inteiro)
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

  // =========================
  // BACKEND (GET / POST / PATCH)
  // =========================
  const normISO = (dayLike: any) => {
    const s = String(dayLike ?? "").trim();
    if (!s) return "";
    // ✅ se vier "2026-02-09T00:00:00.000Z" ou Date, pega só YYYY-MM-DD
    const m = s.match(/^(\d{4}-\d{2}-\d{2})/);
    return m ? m[1] : s.slice(0, 10);
  };

  const mapRowToReserva = (r: any): Reserva => {
    const valueCents = Number(r?.value_cents ?? 0) || 0;
    const locVal = valueCents > 0 ? valueCents / 100 : null;

    return {
      id: String(r.id),
      dataISO: normISO(r.day),
      chegada: String(r.start_time || "").slice(0, 5) || "19:00",
      saida: r.end_time ? String(r.end_time).slice(0, 5) : "",
      pessoas: Number(r.people ?? 1) || 1,
      nome: String(r.customer_name ?? "Sem nome"),
      telefone: String(r.phone ?? ""),
      mesa: String(r.table_code ?? ""),
      observacao: String(r.notes ?? ""),
      locacaoDesc: String(r.location ?? ""),
      locacaoValor: locVal,
      locacaoStatus: (r.is_paid ? "PAGO" : "PENDENTE") as LocacaoStatus,
    };
  };

  const mergeMonthIntoCache = (fromISO: string, toISO: string, monthList: Reserva[]) => {
    setReservas((cur) => {
      // remove tudo do range do mês, injeta a lista do mês
      const keep = cur.filter((x) => x.dataISO < fromISO || x.dataISO > toISO);
      return [...keep, ...monthList];
    });
  };

  const mergeDayIntoCache = (dayISO: string, dayList: Reserva[]) => {
    setReservas((cur) => {
      const keep = cur.filter((x) => x.dataISO !== dayISO);
      return [...keep, ...dayList];
    });
  };

  // ✅ carrega mês inteiro (pra destacar sem clicar)
  const fetchReservasDoMes = async (month: Date) => {
    setLoadingMonth(true);
    try {
      const y = month.getFullYear();
      const m = month.getMonth();
      const fromISO = toISODate(new Date(y, m, 1));
      const toISO = toISODate(new Date(y, m + 1, 0));

      const res = await fetch(`/api/reservas?from=${fromISO}&to=${toISO}`, { cache: "no-store" });

      const text = await res.text();
      let json: any = null;
      try {
        json = JSON.parse(text);
      } catch {
        console.error("GET /api/reservas (mês) retornou não-JSON:", text);
        throw new Error("API retornou HTML (provável 500). Veja o console.");
      }

      if (!res.ok || !json?.ok) {
        console.error("GET /api/reservas (mês) falhou:", json);
        throw new Error(json?.error || `HTTP ${res.status}`);
      }

      const monthList: Reserva[] = (json.data ?? []).map(mapRowToReserva);
      mergeMonthIntoCache(fromISO, toISO, monthList);
    } catch (e) {
      console.error("Erro carregando reservas do mês:", e);
    } finally {
      setLoadingMonth(false);
    }
  };

  // ✅ carrega dia selecionado (pra lista do dia estar sempre fresh)
  const fetchReservasDoDia = async (dayISO: string) => {
    setLoadingDay(true);
    try {
      const res = await fetch(`/api/reservas?day=${dayISO}`, { cache: "no-store" });

      const text = await res.text();
      let json: any = null;
      try {
        json = JSON.parse(text);
      } catch {
        console.error("GET /api/reservas retornou não-JSON:", text);
        throw new Error("API retornou HTML (provável 500). Veja o console.");
      }

      if (!res.ok || !json?.ok) {
        console.error("GET /api/reservas falhou:", json);
        throw new Error(json?.error || `HTTP ${res.status}`);
      }

      const dayList: Reserva[] = (json.data ?? []).map(mapRowToReserva);
      mergeDayIntoCache(dayISO, dayList);
    } catch (e) {
      console.error("Erro carregando reservas do dia:", e);
      // não apaga cache
    } finally {
      setLoadingDay(false);
    }
  };

  // ✅ ao abrir / trocar mês: carrega mês inteiro → destaque aparece sem clique
  useEffect(() => {
    fetchReservasDoMes(monthDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monthDate]);

  // ✅ ao trocar o dia: carrega só o dia (lista do dia)
  useEffect(() => {
    fetchReservasDoDia(selectedISO);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedISO]);

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

  const doDelete = async (id: string) => {
    setSaving(true);
    try {
      await fetch(`/api/reservas/${id}`, { method: "DELETE" }).catch(() => null);

      setReservas((cur) => cur.filter((x) => x.id !== id));
      setConfirmDeleteId(null);
      if (editingId === id) setEditingId(null);

      // ✅ garante highlights perfeitos após delete
      await fetchReservasDoMes(monthDate);
      await fetchReservasDoDia(selectedISO);
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

    const payload = {
      day: selectedISO,
      start_time: chegada || "19:00",
      end_time: saida || null,

      people: nP,
      table_code: (mesa || "").trim() || null,
      customer_name: (nomeFmt || "").trim() || "Sem nome",
      phone: (telFmt || "").trim() || null,

      notes: (observacao || "").trim() || null,
      location: hasLocacao ? (locDesc || "").trim() || null : null,

      value_cents: hasLocacao ? Math.max(0, Math.round(locValNum * 100)) : 0,
      is_paid: hasLocacao ? locacaoStatus === "PAGO" : false,
    };

    setSaving(true);
    try {
      if (!editingId) {
        const res = await fetch("/api/reservas", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const json = await res.json();
        if (!json?.ok) throw new Error(json?.error || "Falha ao criar reserva");
      } else {
        const res = await fetch(`/api/reservas/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const json = await res.json();
        if (!json?.ok) throw new Error(json?.error || "Falha ao salvar alterações");
      }

      // ✅ atualiza dia + mês (pra calendário ficar certo sem clicar)
      await fetchReservasDoMes(monthDate);
      await fetchReservasDoDia(selectedISO);

      resetForm();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ width: "100%", minWidth: 0, boxSizing: "border-box", position: "relative" }}>
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
          {saving || loadingDay || loadingMonth ? (
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
              <div style={{ gridColumn: "1 / -1", color: "#eaf0ff", fontWeight: 900, opacity: 0.75, fontSize: 12 }} />
            )}
          </div>
        </CardShell>
      </div>
    </div>
  );
}
