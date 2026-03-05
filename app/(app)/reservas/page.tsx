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

  // ✅ cache local (mês inteiro + refresh do dia)
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
  // BACKEND (GET / POST)
  // =========================

  // normaliza "2026-02-09T..." -> "2026-02-09"
  const normISO = (dayLike: any) => {
    const s = String(dayLike ?? "").trim();
    if (!s) return "";
    const m = s.match(/^(\d{4}-\d{2}-\d{2})/);
    return m ? m[1] : s.slice(0, 10);
  };

  // ✅ NORMALIZA STATUS SEMPRE PRA "PAGO" | "PENDENTE"
  const normLocStatus = (v: any): LocacaoStatus => {
    const s = String(v ?? "").trim().toLowerCase();
    if (s === "pago" || s === "paid" || s === "true" || s === "1") return "PAGO";
    return "PENDENTE";
  };

  // ✅ API atual retorna rows no formato PT:
  // { date, hora_chegada, hora_saida, pessoas, mesa, nome, telefone, obs, locacao, valor, status, _raw }
  const mapApiRowToReserva = (r: any): Reserva => {
    const dataISO = normISO(r?.date);
    const chegada = String(r?.hora_chegada || "").slice(0, 5) || "19:00";
    const saida = r?.hora_saida ? String(r.hora_saida).slice(0, 5) : "";

    const pessoasN = Number(r?.pessoas ?? 1) || 1;

    const nomeS = String(r?.nome ?? "Sem nome");
    const telS = String(r?.telefone ?? "");
    const mesaS = String(r?.mesa ?? "");
    const obsS = String(r?.obs ?? "");
    const locDesc = String(r?.locacao ?? "");

    const valorNum = Number(r?.valor ?? 0);
    const locacaoValor = Number.isFinite(valorNum) && valorNum > 0 ? valorNum : null;

    const locacaoStatus = normLocStatus(r?.status);

    return {
      id: String(r?.id ?? ""),
      dataISO,
      chegada,
      saida,
      pessoas: pessoasN,
      nome: nomeS,
      telefone: telS,
      mesa: mesaS,
      observacao: obsS,
      locacaoDesc: locDesc,
      locacaoValor,
      locacaoStatus,
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

  // helpers de mês
  const getMonthRangeISO = (month: Date) => {
    const y = month.getFullYear();
    const m = month.getMonth();
    const fromISO = toISODate(new Date(y, m, 1));
    const toISO = toISODate(new Date(y, m + 1, 0));
    return { fromISO, toISO };
  };

  const eachDayISOInclusive = (fromISO: string, toISO: string) => {
    const out: string[] = [];
    const [fy, fm, fd] = fromISO.split("-").map(Number);
    const [ty, tm, td] = toISO.split("-").map(Number);
    const start = new Date(fy, fm - 1, fd);
    const end = new Date(ty, tm - 1, td);

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      out.push(toISODate(new Date(d)));
    }
    return out;
  };

  // ✅ carrega mês inteiro (pra destacar sem clicar)
  const fetchReservasDoMes = async (month: Date) => {
    setLoadingMonth(true);
    try {
      const { fromISO, toISO } = getMonthRangeISO(month);
      const days = eachDayISOInclusive(fromISO, toISO);

      const results = await Promise.all(
        days.map(async (dayISO) => {
          const res = await fetch(`/api/reservas?date=${dayISO}`, { cache: "no-store" });
          const json = await res.json().catch(() => null);

          if (!res.ok || !json?.ok) {
            console.error("GET /api/reservas (mês/dia) falhou:", { dayISO, status: res.status, json });
            return [] as Reserva[];
          }

          const rows = Array.isArray(json.rows) ? json.rows : [];
          return rows.map(mapApiRowToReserva);
        })
      );

      const monthList = results.flat().filter((r) => r?.id && r?.dataISO);
      mergeMonthIntoCache(fromISO, toISO, monthList);
    } catch (e) {
      console.error("Erro carregando reservas do mês:", e);
    } finally {
      setLoadingMonth(false);
    }
  };

  // ✅ carrega dia selecionado (lista do dia)
  const fetchReservasDoDia = async (dayISO: string) => {
    setLoadingDay(true);
    try {
      const res = await fetch(`/api/reservas?date=${dayISO}`, { cache: "no-store" });

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

      const dayList: Reserva[] = (Array.isArray(json.rows) ? json.rows : []).map(mapApiRowToReserva);
      mergeDayIntoCache(dayISO, dayList);
    } catch (e) {
      console.error("Erro carregando reservas do dia:", e);
    } finally {
      setLoadingDay(false);
    }
  };

  useEffect(() => {
    fetchReservasDoMes(monthDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monthDate]);

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

    // ✅ garante que o estado vira "PAGO" ou "PENDENTE" sempre
    setLocacaoStatus(normLocStatus(r.locacaoStatus));

    setConfirmDeleteId(null);
  };

  const doDelete = async (id: string) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/reservas/${id}`, { method: "DELETE" }).catch(() => null);
      if (res && !res.ok) {
        const j = await res.json().catch(() => null);
        console.error("DELETE /api/reservas/:id falhou:", j);
      }

      setReservas((cur) => cur.filter((x) => x.id !== id));
      setConfirmDeleteId(null);
      if (editingId === id) setEditingId(null);

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
        const json = await res.json().catch(() => null);
        if (!res.ok || !json?.ok) throw new Error(json?.error || `HTTP ${res.status}`);
      } else {
        const res = await fetch(`/api/reservas/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const json = await res.json().catch(() => null);
        if (!res.ok || !json?.ok) throw new Error(json?.error || `HTTP ${res.status}`);
      }

      await fetchReservasDoMes(monthDate);
      await fetchReservasDoDia(selectedISO);

      resetForm();
    } catch (e: any) {
      console.error("Erro ao salvar reserva:", e?.message || e);
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
              <span style={{ color: AQUA }}></span>
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
