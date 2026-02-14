// app/(mobile)/m/reservas/page.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

/* =========================
   FINtex Mobile - Reservas
   ✅ Backend ON
   ✅ Lista por dia (GET /api/reservas?date=YYYY-MM-DD)
   ✅ Criar reserva (POST /api/reservas)
   ✅ Polling (6s) + refresh ao voltar pra aba
========================= */

const AQUA_LINE = "rgba(79,220,255,0.18)";
const BG_CARD =
  "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))";

function pad2(n: number) {
  return String(n).padStart(2, "0");
}
function toISODate(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}
function isoToBR(iso: string) {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}
function monthTitlePT(date: Date) {
  const months = [
    "Janeiro","Fevereiro","Março","Abril","Maio","Junho",
    "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro",
  ];
  return `${months[date.getMonth()]} ${date.getFullYear()}`;
}
function startDow(date: Date) {
  const d = new Date(date.getFullYear(), date.getMonth(), 1);
  return d.getDay(); // 0=Dom..6=Sáb
}
function daysInMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}
function fmtBRL(v: any) {
  const n = Number(v);
  const vv = Number.isFinite(n) ? n : 0;
  try {
    return vv.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  } catch {
    return `R$ ${vv.toFixed(2)}`;
  }
}
function toIntOrNull(v: any) {
  const s = String(v ?? "").trim();
  if (!s) return null;
  const n = Number(s);
  if (!Number.isFinite(n)) return null;
  return Math.trunc(n);
}

/* ---------- UI shells ---------- */

function CardShell({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        borderRadius: 20,
        padding: 14,
        background: BG_CARD,
        border: `1px solid ${AQUA_LINE}`,
        boxShadow:
          "0 0 0 1px rgba(79,220,255,0.05) inset, 0 22px 60px rgba(0,0,0,0.40)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function PageTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: 999,
          background: "rgba(79,220,255,0.9)",
          boxShadow: "0 0 16px rgba(79,220,255,0.55)",
          display: "inline-block",
        }}
      />
      <div style={{ fontSize: 18, fontWeight: 1000, letterSpacing: 0.2 }}>
        {children}
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 13,
        fontWeight: 1000,
        letterSpacing: 0.2,
        color: "rgba(79,220,255,0.95)",
      }}
    >
      {children}
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 950, opacity: 0.75, letterSpacing: 0.2 }}>
      {children}
    </div>
  );
}

function FieldShell({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        marginTop: 8,
        borderRadius: 16,
        padding: 12,
        background: "rgba(2,11,24,0.45)",
        border: "1px solid rgba(79,220,255,0.12)",
        boxShadow: "0 0 0 1px rgba(79,220,255,0.04) inset",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function Input({
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <input
      value={value}
      type={type}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        width: "100%",
        padding: "12px 12px",
        borderRadius: 14,
        border: "1px solid rgba(79,220,255,0.16)",
        background: "rgba(2,11,24,0.55)",
        color: "rgba(255,255,255,0.92)",
        fontWeight: 850,
        outline: "none",
      }}
    />
  );
}

function Select({
  value,
  onChange,
  children,
}: {
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        width: "100%",
        padding: "12px 12px",
        borderRadius: 14,
        border: "1px solid rgba(79,220,255,0.16)",
        background: "rgba(2,11,24,0.55)",
        color: "rgba(255,255,255,0.92)",
        fontWeight: 850,
        outline: "none",
        appearance: "none",
      }}
    >
      {children}
    </select>
  );
}

function AquaButton({
  children,
  onClick,
  variant = "solid",
  style,
  disabled,
  type = "button",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "solid" | "ghost";
  style?: React.CSSProperties;
  disabled?: boolean;
  type?: "button" | "submit";
}) {
  const solid = variant === "solid";
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        width: "100%",
        padding: "12px 14px",
        borderRadius: 14,
        border: solid ? "1px solid rgba(79,220,255,0.26)" : "1px solid rgba(79,220,255,0.14)",
        background: solid ? "rgba(79,220,255,0.12)" : "rgba(255,255,255,0.06)",
        color: "rgba(255,255,255,0.92)",
        fontWeight: 1000,
        fontSize: 12,
        cursor: disabled ? "not-allowed" : "pointer",
        boxShadow: solid ? "0 0 24px rgba(79,220,255,0.10)" : "none",
        opacity: disabled ? 0.65 : 1,
        ...style,
      }}
    >
      {children}
    </button>
  );
}

function SmallIconButton({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        width: 38,
        height: 38,
        borderRadius: 12,
        border: "1px solid rgba(79,220,255,0.18)",
        background: "rgba(255,255,255,0.06)",
        color: "rgba(255,255,255,0.92)",
        display: "grid",
        placeItems: "center",
        boxShadow: "0 0 18px rgba(79,220,255,0.06)",
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}

/* ---------- Accordion com animação descendo ---------- */

function Accordion({
  title,
  subtitle,
  children,
  defaultOpen = false,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const innerRef = useRef<HTMLDivElement | null>(null);
  const [h, setH] = useState<number>(0);

  useEffect(() => {
    const el = innerRef.current;
    if (!el) return;
    const measure = () => setH(el.scrollHeight);
    measure();

    const ro = new ResizeObserver(() => measure());
    ro.observe(el);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  return (
    <CardShell style={{ padding: 0, overflow: "hidden" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          width: "100%",
          textAlign: "left",
          padding: 14,
          background: "transparent",
          border: "none",
          color: "inherit",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
        }}
      >
        <div>
          <div style={{ fontSize: 13, fontWeight: 1000, color: "rgba(79,220,255,0.95)" }}>
            {title}
          </div>
          {subtitle ? <div style={{ marginTop: 6, fontSize: 11, opacity: 0.72 }}>{subtitle}</div> : null}
        </div>

        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: 12,
            border: "1px solid rgba(79,220,255,0.18)",
            background: "rgba(255,255,255,0.06)",
            display: "grid",
            placeItems: "center",
            boxShadow: "0 0 18px rgba(79,220,255,0.06)",
          }}
        >
          <div
            style={{
              transform: open ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 220ms ease",
              fontWeight: 1000,
              opacity: 0.9,
            }}
          >
            ▾
          </div>
        </div>
      </button>

      <div
        style={{
          height: open ? h : 0,
          transition: "height 260ms ease",
          overflow: "hidden",
          borderTop: "1px solid rgba(79,220,255,0.10)",
        }}
      >
        <div
          ref={innerRef}
          style={{
            padding: 14,
            opacity: open ? 1 : 0,
            transform: open ? "translateY(0px)" : "translateY(-6px)",
            transition: "opacity 220ms ease, transform 260ms ease",
          }}
        >
          {children}
        </div>
      </div>
    </CardShell>
  );
}

/* ---------- Tipos ---------- */

type ReservaRow = {
  id: string;
  date: string | null;
  hora_chegada: string | null;
  hora_saida: string | null;
  pessoas: any;
  mesa: string | null;
  nome: string | null;
  telefone: string | null;
  obs: string | null;
  locacao: string | null;
  valor: any;
  status: "Pago" | "Pendente" | string;
};

function statusAccent(status: string) {
  const s = String(status || "").toLowerCase();
  if (s.includes("pago")) return { line: "rgba(80,255,160,0.35)", glow: "rgba(80,255,160,0.14)" };
  return { line: "rgba(255,200,80,0.35)", glow: "rgba(255,200,80,0.14)" };
}

/* ---------- API helpers ---------- */

async function apiGetReservas(dateISO: string) {
  const r = await fetch(`/api/reservas?date=${encodeURIComponent(dateISO)}`, { cache: "no-store" });
  const j = await r.json().catch(() => null);
  if (!r.ok || !j?.ok) throw new Error(j?.error || "Falha ao carregar reservas");
  return (j.rows || []) as ReservaRow[];
}

async function apiCreateReserva(payload: any) {
  const r = await fetch(`/api/reservas`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  const j = await r.json().catch(() => null);
  if (!r.ok || !j?.ok) throw new Error(j?.error || "Falha ao criar reserva");
  return j.row as ReservaRow;
}

/* ---------- Page ---------- */

export default function MobileReservasPage() {
  const [monthRef, setMonthRef] = useState<Date>(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const [selectedISO, setSelectedISO] = useState<string>(() => toISODate(new Date()));

  // backend state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [reservas, setReservas] = useState<ReservaRow[]>([]);

  async function refresh() {
    try {
      setErr(null);
      const rows = await apiGetReservas(selectedISO);
      setReservas(rows);
    } catch (e: any) {
      setErr(e?.message ? String(e.message) : "Erro ao carregar reservas");
    }
  }

  useEffect(() => {
    let alive = true;

    (async () => {
      setLoading(true);
      await refresh();
      if (!alive) return;
      setLoading(false);
    })();

    const iv = window.setInterval(() => {
      if (document.visibilityState === "visible") refresh();
    }, 6000);

    const onVis = () => {
      if (document.visibilityState === "visible") refresh();
    };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      alive = false;
      window.clearInterval(iv);
      document.removeEventListener("visibilitychange", onVis);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedISO]);

  const reservasDoDia = useMemo(() => reservas, [reservas]);

  const grid = useMemo(() => {
    const start = startDow(monthRef);
    const total = daysInMonth(monthRef);
    const cells: Array<{ day: number | null; iso?: string }> = [];

    for (let i = 0; i < start; i++) cells.push({ day: null });
    for (let d = 1; d <= total; d++) {
      const iso = toISODate(new Date(monthRef.getFullYear(), monthRef.getMonth(), d));
      cells.push({ day: d, iso });
    }
    while (cells.length % 7 !== 0) cells.push({ day: null });

    return cells;
  }, [monthRef]);

  // Form
  const [horaChegada, setHoraChegada] = useState("19:30");
  const [horaSaida, setHoraSaida] = useState("");
  const [pessoas, setPessoas] = useState("");
  const [mesa, setMesa] = useState("");
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [obs, setObs] = useState("");
  const [locacao, setLocacao] = useState("Descrição: Período Vespertino / Período Noturno");
  const [valor, setValor] = useState("0,00");
  const [status, setStatus] = useState<"Pago" | "Pendente">("Pendente");

  function limpar() {
    setHoraChegada("19:30");
    setHoraSaida("");
    setPessoas("");
    setMesa("");
    setNome("");
    setTelefone("");
    setObs("");
    setLocacao("Descrição: Período Vespertino / Período Noturno");
    setValor("0,00");
    setStatus("Pendente");
  }

  const dow = ["D", "S", "T", "Q", "Q", "S", "S"];

  async function onCreate() {
    const nomeOk = nome.trim().length >= 2;
    const horaOk = horaChegada.trim().length >= 4;
    if (!nomeOk || !horaOk) {
      setErr("Preencha pelo menos NOME e HORÁRIO CHEGADA.");
      return;
    }

    setSaving(true);
    try {
      setErr(null);
      await apiCreateReserva({
        date: selectedISO,
        hora_chegada: horaChegada,
        hora_saida: horaSaida || null,
        pessoas: toIntOrNull(pessoas),
        mesa: mesa || null,
        nome: nome,
        telefone: telefone || null,
        obs: obs || null,
        locacao: locacao || null,
        valor: valor || "0,00",
        status,
      });

      limpar();
      await refresh();
    } catch (e: any) {
      setErr(e?.message ? String(e.message) : "Falha ao criar reserva");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <PageTitle>Reservas</PageTitle>

      {/* calendário */}
      <CardShell>
        <SectionTitle>Calendário</SectionTitle>

        <div style={{ marginTop: 10, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
          <div style={{ fontSize: 14, fontWeight: 1000, letterSpacing: 0.2 }}>
            {monthTitlePT(monthRef)}
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <SmallIconButton onClick={() => setMonthRef((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))}>
              ◀
            </SmallIconButton>
            <SmallIconButton onClick={() => setMonthRef((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))}>
              ▶
            </SmallIconButton>
          </div>
        </div>

        {/* dias semana */}
        <div
          style={{
            marginTop: 12,
            display: "grid",
            gridTemplateColumns: "repeat(7, 1fr)",
            gap: 8,
            fontSize: 11,
            fontWeight: 900,
            opacity: 0.7,
          }}
        >
          {dow.map((x, idx) => (
            <div key={`${x}-${idx}`} style={{ textAlign: "center" }}>
              {x}
            </div>
          ))}
        </div>

        {/* grid */}
        <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 8 }}>
          {grid.map((c, idx) => {
            const isSelected = c.iso && c.iso === selectedISO;
            const isToday = c.iso && c.iso === toISODate(new Date());
            return (
              <button
                key={idx}
                disabled={!c.day}
                onClick={() => {
                  if (!c.iso) return;
                  setErr(null);
                  setLoading(true);
                  setSelectedISO(c.iso);
                }}
                style={{
                  height: 34,
                  borderRadius: 12,
                  border: `1px solid ${isSelected ? "rgba(79,220,255,0.30)" : "rgba(79,220,255,0.12)"}`,
                  background: c.day
                    ? isSelected
                      ? "rgba(79,220,255,0.14)"
                      : "rgba(255,255,255,0.05)"
                    : "transparent",
                  color: c.day ? "rgba(255,255,255,0.92)" : "transparent",
                  fontWeight: 950,
                  fontSize: 12,
                  cursor: c.day ? "pointer" : "default",
                  boxShadow: isSelected ? "0 0 22px rgba(79,220,255,0.10)" : "none",
                  position: "relative",
                }}
              >
                {c.day || "—"}
                {isToday && !isSelected ? (
                  <span
                    style={{
                      position: "absolute",
                      left: 7,
                      top: 7,
                      width: 6,
                      height: 6,
                      borderRadius: 999,
                      background: "rgba(79,220,255,0.9)",
                      boxShadow: "0 0 12px rgba(79,220,255,0.55)",
                    }}
                  />
                ) : null}
              </button>
            );
          })}
        </div>

        {/* data selecionada */}
        <FieldShell style={{ marginTop: 12 }}>
          <div style={{ fontWeight: 1000, letterSpacing: 0.2 }}>{isoToBR(selectedISO)}</div>
        </FieldShell>
      </CardShell>

      {/* reservas do dia */}
      <CardShell>
        <SectionTitle>Reservas do dia: {isoToBR(selectedISO)}</SectionTitle>

        {err ? (
          <div
            style={{
              marginTop: 10,
              padding: "10px 12px",
              borderRadius: 14,
              border: "1px solid rgba(255,100,120,0.35)",
              background: "rgba(255,100,120,0.08)",
              fontSize: 12,
              fontWeight: 900,
              opacity: 0.95,
            }}
          >
            {err}
          </div>
        ) : null}

        <div style={{ marginTop: 10, fontSize: 12, opacity: 0.75 }}>
          {loading ? "Carregando..." : reservasDoDia.length === 0 ? "Nenhuma reserva nesse dia." : ""}
        </div>

        <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
          {reservasDoDia.map((r) => {
            const a = statusAccent(r.status);
            return (
              <div
                key={r.id}
                style={{
                  borderRadius: 18,
                  padding: 14,
                  background: "rgba(2,11,24,0.42)",
                  border: `1px solid ${a.line}`,
                  boxShadow: `0 0 0 1px rgba(255,255,255,0.02) inset, 0 0 26px ${a.glow}`,
                }}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr auto",
                    gap: 12,
                    alignItems: "baseline",
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 1000, letterSpacing: 0.2 }}>
                    {r.nome || "—"}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 1000, opacity: 0.95, whiteSpace: "nowrap" }}>
                    {fmtBRL(r.valor)}
                  </div>
                </div>

                <div
                  style={{
                    marginTop: 10,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 10,
                    opacity: 0.88,
                  }}
                >
                  <div style={{ fontSize: 12, fontWeight: 950 }}>
                    {r.hora_chegada || "—"}
                    {r.hora_saida ? ` → ${r.hora_saida}` : ""}{" "}
                    {r.mesa ? `• Mesa ${r.mesa}` : ""}{" "}
                    {r.pessoas ? `• ${r.pessoas} pessoas` : ""}
                  </div>

                  <div
                    style={{
                      padding: "6px 10px",
                      borderRadius: 999,
                      border: `1px solid ${a.line}`,
                      background: "rgba(255,255,255,0.06)",
                      fontSize: 11,
                      fontWeight: 1000,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {r.status || "Pendente"}
                  </div>
                </div>

                {(r.telefone || r.obs || r.locacao) ? (
                  <div style={{ marginTop: 12, display: "grid", gap: 8 }}>
                    {r.telefone ? (
                      <div style={{ fontSize: 12, opacity: 0.8 }}>
                        <span style={{ fontWeight: 1000, opacity: 0.9 }}>Telefone:</span>{" "}
                        {r.telefone}
                      </div>
                    ) : null}
                    {r.locacao ? (
                      <div style={{ fontSize: 12, opacity: 0.8 }}>
                        <span style={{ fontWeight: 1000, opacity: 0.9 }}>Locação:</span>{" "}
                        {r.locacao}
                      </div>
                    ) : null}
                    {r.obs ? (
                      <div style={{ fontSize: 12, opacity: 0.8 }}>
                        <span style={{ fontWeight: 1000, opacity: 0.9 }}>Obs:</span>{" "}
                        {r.obs}
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </CardShell>

      {/* nova reserva */}
      <Accordion title="Nova reserva" subtitle="Toque para abrir e preencher" defaultOpen={false}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onCreate();
          }}
          style={{ display: "grid", gap: 12 }}
        >
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <FieldLabel>Horário chegada</FieldLabel>
              <FieldShell>
                <Select value={horaChegada} onChange={setHoraChegada}>
                  {["18:30","19:00","19:30","20:00","20:30","21:00","21:30"].map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </Select>
              </FieldShell>
            </div>

            <div>
              <FieldLabel>Horário saída (opcional)</FieldLabel>
              <FieldShell>
                <Select value={horaSaida} onChange={setHoraSaida}>
                  <option value="">—</option>
                  {["20:30","21:00","21:30","22:00","22:30","23:00"].map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </Select>
              </FieldShell>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <FieldLabel>Pessoas</FieldLabel>
              <FieldShell>
                <Input value={pessoas} onChange={setPessoas} placeholder="Quantidade de pessoas:" />
              </FieldShell>
            </div>

            <div>
              <FieldLabel>Mesa (opcional)</FieldLabel>
              <FieldShell>
                <Input value={mesa} onChange={setMesa} placeholder="Ex: 04" />
              </FieldShell>
            </div>
          </div>

          <div>
            <FieldLabel>Nome</FieldLabel>
            <FieldShell>
              <Input value={nome} onChange={setNome} placeholder="Nome do cliente" />
            </FieldShell>
          </div>

          <div>
            <FieldLabel>Telefone (opcional)</FieldLabel>
            <FieldShell>
              <Input value={telefone} onChange={setTelefone} placeholder="WhatsApp / telefone" />
            </FieldShell>
          </div>

          <div>
            <FieldLabel>Observação (opcional)</FieldLabel>
            <FieldShell>
              <Input value={obs} onChange={setObs} placeholder="Ex: Deck Inferior / Salão Inferior / Deck Superior" />
            </FieldShell>
          </div>

          <div>
            <FieldLabel>Locação</FieldLabel>
            <FieldShell>
              <Input value={locacao} onChange={setLocacao} placeholder="Descrição..." />
            </FieldShell>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            <div>
              <FieldLabel>Valor</FieldLabel>
              <FieldShell>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ fontWeight: 1000, opacity: 0.8 }}>R$</div>
                  <Input value={valor} onChange={setValor} placeholder="0,00" />
                </div>
              </FieldShell>
            </div>

            <div style={{ gridColumn: "2 / span 2" }}>
              <FieldLabel>Status</FieldLabel>
              <FieldShell>
                <div style={{ display: "flex", gap: 10 }}>
                  <AquaButton
                    variant={status === "Pago" ? "solid" : "ghost"}
                    onClick={() => setStatus("Pago")}
                    style={{ flex: 1 }}
                    type="button"
                  >
                    Pago
                  </AquaButton>
                  <AquaButton
                    variant={status === "Pendente" ? "solid" : "ghost"}
                    onClick={() => setStatus("Pendente")}
                    style={{ flex: 1 }}
                    type="button"
                  >
                    Pendente
                  </AquaButton>
                </div>
              </FieldShell>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <AquaButton type="submit" disabled={saving}>
              {saving ? "Criando..." : "Criar reserva"}
            </AquaButton>
            <AquaButton variant="ghost" type="button" onClick={limpar} disabled={saving}>
              Limpar
            </AquaButton>
          </div>
        </form>
      </Accordion>
    </div>
  );
}
