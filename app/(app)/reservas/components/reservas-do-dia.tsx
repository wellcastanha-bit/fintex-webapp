"use client";

import React, { useEffect, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import type { Reserva } from "./types";
import { CardShell, MiniButton } from "./ui";
import { AQUA, numberToBRL } from "./utils";

/*
✅ LIMPO (front burro)
- REMOVEU: getAccessTokenFromLocalStorage()
- REMOVEU: Authorization: Bearer ...
- REMOVEU: varredura de localStorage sb-*-auth-token
- REMOVEU: authFetch()
- REMOVEU: evento global "reservas:refresh"
- Mantém: modo controlado (listDia) OU modo auto (busca no backend) sem token no client
*/

async function apiFetch(url: string, init?: RequestInit) {
  // se teu backend usa cookie (Supabase Auth Helpers / middleware), isso é o correto
  return fetch(url, { ...init, credentials: "include" });
}

export function ReservasDoDia({
  title,
  listDia,
  confirmDeleteId,
  setConfirmDeleteId,
  startEdit,
  doDelete,

  // ✅ modo auto (backend)
  selectedISO,
  // ✅ opcional: avisa o pai pra marcar o calendário
  setHasReservaByDay,
}: {
  title: string;

  // modo controlado (pai manda a lista)
  listDia?: Reserva[];

  confirmDeleteId: string | null;
  setConfirmDeleteId: React.Dispatch<React.SetStateAction<string | null>>;

  startEdit: (r: Reserva) => void;

  // se passar, apaga pelo pai (controlado)
  doDelete?: (id: string) => void;

  // modo auto (sem lista controlada)
  selectedISO?: string; // YYYY-MM-DD

  setHasReservaByDay?: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
}) {
  const isControlled = Array.isArray(listDia);
  const finalList = isControlled ? (listDia as Reserva[]) : undefined;

  const [autoList, setAutoList] = useState<Reserva[]>([]);
  const [loading, setLoading] = useState(false);

  const list = isControlled ? (finalList as Reserva[]) : autoList;

  async function loadFromBackend() {
    if (isControlled) return;
    if (!selectedISO) return;

    setLoading(true);
    try {
      const res = await apiFetch(`/api/reservas?date=${encodeURIComponent(selectedISO)}`, {
        cache: "no-store" as any,
      });
      const json = await res.json().catch(() => null);

      if (!res.ok || !json?.ok) {
        console.error("[ReservasDoDia] GET /api/reservas error:", json);
        setAutoList([]);
        if (setHasReservaByDay) setHasReservaByDay((m) => ({ ...m, [selectedISO]: false }));
        return;
      }

      const arr: Reserva[] = Array.isArray(json.reservas) ? json.reservas : [];
      setAutoList(arr);

      if (setHasReservaByDay) {
        setHasReservaByDay((prev) => ({
          ...prev,
          [selectedISO]: arr.length > 0,
        }));
      }
    } catch (e) {
      console.error("[ReservasDoDia] load failed:", e);
      setAutoList([]);
      if (setHasReservaByDay && selectedISO) setHasReservaByDay((m) => ({ ...m, [selectedISO]: false }));
    } finally {
      setLoading(false);
    }
  }

  async function deleteBackend(id: string) {
    // modo controlado: pai resolve
    if (doDelete) {
      doDelete(id);
      return;
    }

    // modo auto: apaga aqui (sem token no client)
    try {
      const res = await apiFetch(`/api/reservas?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      const json = await res.json().catch(() => null);

      if (!res.ok || !json?.ok) {
        console.error("[ReservasDoDia] DELETE /api/reservas error:", json);
        return;
      }

      setAutoList((prev) => {
        const next = prev.filter((r) => r.id !== id);

        if (setHasReservaByDay && selectedISO) {
          setHasReservaByDay((m) => ({
            ...m,
            [selectedISO]: next.length > 0,
          }));
        }

        return next;
      });

      setConfirmDeleteId(null);
    } catch (e) {
      console.error("[ReservasDoDia] delete failed:", e);
    }
  }

  useEffect(() => {
    loadFromBackend();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isControlled, selectedISO]);

  const emptyMsg = loading ? "Carregando..." : "Nenhuma reserva nesse dia.";

  return (
    <CardShell title={title}>
      {!list.length ? (
        <div style={{ color: "#eaf0ff", fontWeight: 800, opacity: 0.75 }}>{emptyMsg}</div>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {list.map((r) => {
            const hasLocDesc = !!(r.locacaoDesc || "").trim();
            const hasLocVal = typeof r.locacaoValor === "number" && r.locacaoValor > 0;

            return (
              <div
                key={r.id}
                style={{
                  borderRadius: 16,
                  padding: 14,
                  border: "1px solid rgba(255,255,255,0.12)",
                  background: "rgba(1,27,60,0.30)",
                  display: "grid",
                  gap: 8,
                  position: "relative",
                }}
              >
                {/* ÍCONES */}
                <div style={{ position: "absolute", top: 10, right: 10, display: "flex", gap: 10 }}>
                  <button
                    type="button"
                    title="Editar"
                    onClick={() => startEdit(r)}
                    onMouseDown={(e) => e.preventDefault()}
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 12,
                      border: "1px solid rgba(255,255,255,0.14)",
                      background: "rgba(255,255,255,0.06)",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Pencil size={18} color={AQUA} />
                  </button>

                  <button
                    type="button"
                    title="Excluir"
                    onClick={() => setConfirmDeleteId((cur) => (cur === r.id ? null : r.id))}
                    onMouseDown={(e) => e.preventDefault()}
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 12,
                      border: "1px solid rgba(255,255,255,0.14)",
                      background: "rgba(255,255,255,0.06)",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Trash2 size={18} color="rgba(255,110,110,0.95)" />
                  </button>
                </div>

                <div style={{ color: "#fff", fontWeight: 900, fontSize: 16 }}>
                  {r.nome} <span style={{ color: "#eaf0ff", opacity: 0.9 }}>- {r.pessoas} Pessoas</span>
                </div>

                <div style={{ color: "#eaf0ff", fontWeight: 900 }}>
                  Horário:{" "}
                  <span style={{ color: "#fff" }}>
                    {r.chegada}
                    {r.saida ? ` - ${r.saida}` : ""}
                  </span>
                </div>

                {!!r.telefone?.trim() && (
                  <div style={{ color: "#eaf0ff", fontWeight: 900 }}>
                    Contato: <span style={{ color: "#fff" }}>{r.telefone}</span>
                  </div>
                )}

                {!!r.observacao?.trim() && (
                  <div style={{ color: "#eaf0ff", fontWeight: 900 }}>
                    Descrição: <span style={{ color: "#fff" }}>{r.observacao}</span>
                  </div>
                )}

                {!!r.mesa?.trim() && (
                  <div style={{ color: "#eaf0ff", fontWeight: 900 }}>
                    Mesa: <span style={{ color: "#fff" }}>{r.mesa}</span>
                  </div>
                )}

                {hasLocDesc && (
                  <div style={{ color: "#eaf0ff", fontWeight: 900 }}>
                    Locação: <span style={{ color: "#fff" }}>{r.locacaoDesc}</span>
                  </div>
                )}

                {hasLocVal && (
                  <div style={{ color: "#eaf0ff", fontWeight: 900, display: "flex", gap: 10, alignItems: "center" }}>
                    <span>
                      Valor da Locação: <span style={{ color: "#0ed43f" }}>R$ {numberToBRL(r.locacaoValor!)}</span>
                    </span>

                    {!!r.locacaoStatus && (
                      <span
                        style={{
                          marginLeft: "auto",
                          padding: "6px 10px",
                          borderRadius: 999,
                          border: "1px solid rgba(255,255,255,0.18)",
                          background: r.locacaoStatus === "PAGO" ? "rgba(14,212,63,0.18)" : "rgba(255,196,0,0.14)",
                          color: "#fff",
                          fontWeight: 900,
                          fontSize: 12,
                          userSelect: "none",
                        }}
                      >
                        {r.locacaoStatus === "PAGO" ? "Pago" : "Pendente"}
                      </span>
                    )}
                  </div>
                )}

                {/* CONFIRMAÇÃO DE EXCLUSÃO */}
                {confirmDeleteId === r.id && (
                  <div
                    style={{
                      marginTop: 10,
                      borderRadius: 14,
                      border: "1px solid rgba(255,255,255,0.14)",
                      background: "rgba(0,0,0,0.20)",
                      padding: 12,
                      display: "grid",
                      gap: 10,
                    }}
                  >
                    <div style={{ color: "#fff", fontWeight: 900 }}>Você realmente deseja excluir essa reserva?</div>
                    <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                      <MiniButton tone="neutral" onClick={() => setConfirmDeleteId(null)}>
                        Não
                      </MiniButton>
                      <MiniButton tone="red" onClick={() => deleteBackend(r.id)}>
                        Sim
                      </MiniButton>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </CardShell>
  );
}
