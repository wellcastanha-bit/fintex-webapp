// app/(mobile)/m/reservas/page.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

/* =========================
   FINtex Mobile - Reservas
   ✅ Backend ON
   ✅ Lista por dia (GET /api/reservas?date=YYYY-MM-DD)
   ✅ Criar reserva (POST /api/reservas)
   ✅ Editar reserva (PATCH /api/reservas/:id)  <-- tu vai mandar o route.ts depois
   ✅ Destaque de dias com reserva (pré-carrega mês todo)
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
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
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
function parseBRLMoneyTextToNumber(v: string) {
  let s = String(v ?? "").trim();
  if (!s) return 0;
  s = s.replace(/[^\d,.\-]/g, "");
  if (s.includes(",")) s = s.replace(/\./g, "").replace(",", ".");
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}
function makeTimes(startHHMM: string, endHHMM: string, stepMin = 30) {
  const [sh, sm] = startHHMM.split(":").map(Number);
  const [eh, em] = endHHMM.split(":").map(Number);

  const start = sh * 60 + sm;
  // end pode ser "00:00" -> considera 24:00 pra incluir
  let end = eh * 60 + em;
  if (end === 0) end = 24 * 60;

  const out: string[] = [];
  for (let m = start; m <= end; m += stepMin) {
    if (m === 24 * 60) out.push("00:00");
    else out.push(`${pad2(Math.floor(m / 60))}:${pad2(m % 60)}`);
  }
  return out;
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
  // ✅ removeu a bolinha aqua do lado do título
  return (
    <div style={{ display: "flex", alignItems: "center" }}>
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
    <div
      style={{
        fontSize: 11,
        fontWeight: 1000,
        letterSpacing: 0.2,
        color: "#ffffff",        // ✅ branco puro
        opacity: 1,              // ✅ remove o efeito cinza
      }}
    >
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
        border: "none",
        outline: "none",
        background: "transparent",
        color: "rgba(255,255,255,0.92)",
        fontWeight: 850,
        padding: 0,              // ✅ sem padding duplicado
        borderRadius: 0,         // ✅ sem caixa interna
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
        border: "none",
        outline: "none",
        background: "transparent",
        color: "rgba(255,255,255,0.92)",
        fontWeight: 900,
        padding: 0,           // ✅ sem padding duplicado
        borderRadius: 0,      // ✅ sem caixa interna
        appearance: "none",   // ✅ mantém teu estilo clean
        WebkitAppearance: "none",
        MozAppearance: "none",
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
        border: solid
          ? "1px solid rgba(79,220,255,0.26)"
          : "1px solid rgba(79,220,255,0.14)",
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
  open,
  setOpen,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  open: boolean;
  setOpen: (v: boolean) => void;
}) {
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
        onClick={() => setOpen(!open)}
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

async function apiUpdateReserva(id: string, payload: any) {
  const r = await fetch(`/api/reservas/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  const j = await r.json().catch(() => null);
  if (!r.ok || !j?.ok) throw new Error(j?.error || "Falha ao salvar reserva");
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
  const [loadingMonth, setLoadingMonth] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [reservas, setReservas] = useState<ReservaRow[]>([]);

  // ✅ mapa de dias do mês que tem reserva (pra destacar no calendário)
  const [hasByDay, setHasByDay] = useState<Record<string, boolean>>({});

  const timeOptions = useMemo(() => makeTimes("10:00", "00:00", 30), []);

  function monthRangeISO(month: Date) {
    const y = month.getFullYear();
    const m = month.getMonth();
    const from = toISODate(new Date(y, m, 1));
    const to = toISODate(new Date(y, m + 1, 0));
    return { from, to };
  }
  function eachDayISOInclusive(fromISO: string, toISO: string) {
    const out: string[] = [];
    const [fy, fm, fd] = fromISO.split("-").map(Number);
    const [ty, tm, td] = toISO.split("-").map(Number);
    const start = new Date(fy, fm - 1, fd);
    const end = new Date(ty, tm - 1, td);
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      out.push(toISODate(new Date(d)));
    }
    return out;
  }

  async function refreshDay(dateISO: string) {
    try {
      setErr(null);
      const rows = await apiGetReservas(dateISO);
      setReservas(rows);
    } catch (e: any) {
      setErr(e?.message ? String(e.message) : "Erro ao carregar reservas");
    }
  }

  // ✅ carrega o mês inteiro e marca dias com reserva
  async function refreshMonthHighlights(month: Date) {
    setLoadingMonth(true);
    try {
      const { from, to } = monthRangeISO(month);
      const days = eachDayISOInclusive(from, to);

      const results = await Promise.all(
        days.map(async (dISO) => {
          try {
            const rows = await apiGetReservas(dISO);
            return { dISO, ok: true, count: rows.length };
          } catch {
            // não derruba o mês inteiro
            return { dISO, ok: false, count: 0 };
          }
        })
      );

      const map: Record<string, boolean> = {};
      for (const r of results) {
        if (r.ok && r.count > 0) map[r.dISO] = true;
      }
      setHasByDay(map);
    } finally {
      setLoadingMonth(false);
    }
  }

  // 1) ao trocar DIA (selectedISO): carrega lista do dia
  useEffect(() => {
    let alive = true;

    (async () => {
      setLoading(true);
      await refreshDay(selectedISO);
      if (!alive) return;
      setLoading(false);
    })();

    const iv = window.setInterval(() => {
      if (document.visibilityState === "visible") refreshDay(selectedISO);
    }, 6000);

    const onVis = () => {
      if (document.visibilityState === "visible") refreshDay(selectedISO);
    };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      alive = false;
      window.clearInterval(iv);
      document.removeEventListener("visibilitychange", onVis);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedISO]);

  // 2) ao trocar MÊS: pré-carrega o mês e marca dias com reserva
  useEffect(() => {
    refreshMonthHighlights(monthRef);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monthRef]);

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
  const [locacao, setLocacao] = useState(""); // ✅ agora é placeholder, não value fixo
  const [valor, setValor] = useState("0,00");
  const [status, setStatus] = useState<"Pago" | "Pendente">("Pago"); // ✅ default Pago

  const [accordionOpen, setAccordionOpen] = useState(false);

  // edição
  const [editingId, setEditingId] = useState<string | null>(null);

  const hasValor = useMemo(() => parseBRLMoneyTextToNumber(valor) > 0, [valor]);

  // ✅ se valor for 0, força "Pago" (não fica pendente sem valor)
  useEffect(() => {
    if (!hasValor) setStatus("Pago");
  }, [hasValor]);

  function limpar() {
    setHoraChegada("19:30");
    setHoraSaida("");
    setPessoas("");
    setMesa("");
    setNome("");
    setTelefone("");
    setObs("");
    setLocacao("");
    setValor("0,00");
    setStatus("Pago");
    setEditingId(null);
  }

  function startEdit(r: ReservaRow) {
    setEditingId(r.id);
    setAccordionOpen(true);

    setHoraChegada((r.hora_chegada || "19:30").slice(0, 5));
    setHoraSaida(r.hora_saida ? String(r.hora_saida).slice(0, 5) : "");
    setPessoas(r.pessoas != null ? String(r.pessoas) : "");
    setMesa(r.mesa ? String(r.mesa) : "");
    setNome(r.nome ? String(r.nome) : "");
    setTelefone(r.telefone ? String(r.telefone) : "");
    setObs(r.obs ? String(r.obs) : "");
    setLocacao(r.locacao ? String(r.locacao) : "");

    const vNum = Number(r.valor ?? 0);
    const vOk = Number.isFinite(vNum) ? vNum : 0;
    setValor(vOk > 0 ? String(vOk).replace(".", ",") : "0,00");

    const st = String(r.status || "").toLowerCase();
    setStatus(st.includes("pago") ? "Pago" : "Pendente");
  }

  const dow = ["D", "S", "T", "Q", "Q", "S", "S"];

  async function onSave() {
    const nomeOk = nome.trim().length >= 2;
    const horaOk = horaChegada.trim().length >= 4;
    if (!nomeOk || !horaOk) {
      setErr("Preencha pelo menos NOME e HORÁRIO CHEGADA.");
      return;
    }

    // ✅ se não tem valor, não precisa status pendente nem valor/locação
    const payload = {
      date: selectedISO,
      hora_chegada: horaChegada,
      hora_saida: horaSaida || null,
      pessoas: toIntOrNull(pessoas),
      mesa: mesa || null,
      nome,
      telefone: telefone || null,
      obs: obs || null,

      locacao: hasValor ? (locacao || null) : null,
      valor: hasValor ? (valor || "0,00") : "0,00",

      // ✅ Pago => TRUE no Supabase / Pendente => FALSE
      // (teu route.ts atual usa "status" string; mantendo Pago/Pendente pra mapear is_paid)
      status: hasValor ? status : "Pago",
    };

    setSaving(true);
    try {
      setErr(null);

      if (!editingId) {
        await apiCreateReserva(payload);
      } else {
        await apiUpdateReserva(editingId, payload);
      }

      limpar();
      setAccordionOpen(false);

      await refreshDay(selectedISO);
      await refreshMonthHighlights(monthRef);
    } catch (e: any) {
      setErr(e?.message ? String(e.message) : "Falha ao salvar reserva");
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

        <div
          style={{
            marginTop: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 1000, letterSpacing: 0.2 }}>
            {monthTitlePT(monthRef)}
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <SmallIconButton
              onClick={() => setMonthRef((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))}
            >
              ◀
            </SmallIconButton>
            <SmallIconButton
              onClick={() => setMonthRef((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))}
            >
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
            const hasReserva = c.iso ? !!hasByDay[c.iso] : false;

            const border = isSelected
              ? "rgba(79,220,255,0.30)"
              : hasReserva
                ? "rgba(79,220,255,0.42)"
                : "rgba(79,220,255,0.12)";

            const bg = c.day
              ? isSelected
                ? "rgba(79,220,255,0.14)"
                : hasReserva
                  ? "rgba(79,220,255,0.10)" // ✅ destaque do dia com reserva
                  : "rgba(255,255,255,0.05)"
              : "transparent";

            const shadow = isSelected
              ? "0 0 22px rgba(79,220,255,0.10)"
              : hasReserva
                ? "0 0 18px rgba(79,220,255,0.12)"
                : "none";

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
                  border: `1px solid ${border}`,
                  background: bg,
                  color: c.day ? "rgba(255,255,255,0.92)" : "transparent",
                  fontWeight: 950,
                  fontSize: 12,
                  cursor: c.day ? "pointer" : "default",
                  boxShadow: shadow,
                  position: "relative",
                }}
              >
                {c.day || "—"}

                {/* bolinha do HOJE (mantém) */}
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
          {loadingMonth ? (
            <div style={{ marginTop: 6, fontSize: 11, opacity: 0.65 }}>
              Verificando reservas do mês…
            </div>
          ) : null}
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
            const valorNum = Number(r.valor ?? 0);
            const hasLocacaoValor = Number.isFinite(valorNum) && valorNum > 0;

            // ✅ se valor == 0: formatação verde como pago, e NÃO mostra valor nem status chip
            const a = hasLocacaoValor ? statusAccent(r.status) : statusAccent("Pago");

            return (
              <button
                key={r.id}
                type="button"
                onClick={() => startEdit(r)} // ✅ editar pelo celular
                style={{
                  textAlign: "left",
                  borderRadius: 18,
                  padding: 14,
                  background: "rgba(2,11,24,0.42)",
                  border: `1px solid ${a.line}`,
                  boxShadow: `0 0 0 1px rgba(255,255,255,0.02) inset, 0 0 26px ${a.glow}`,
                  color: "inherit",
                  cursor: "pointer",
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

                  {/* ✅ só mostra valor se > 0 */}
                  {hasLocacaoValor ? (
                    <div style={{ fontSize: 13, fontWeight: 1000, opacity: 0.95, whiteSpace: "nowrap" }}>
                      {fmtBRL(valorNum)}
                    </div>
                  ) : (
                    <div />
                  )}
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
                    {r.hora_saida ? ` → ${r.hora_saida}` : ""} {r.mesa ? `• Mesa ${r.mesa}` : ""}{" "}
                    {r.pessoas ? `• ${r.pessoas} pessoas` : ""}
                  </div>

                  {/* ✅ só mostra status se valor > 0 */}
                  {hasLocacaoValor ? (
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
                      {String(r.status || "Pendente")}
                    </div>
                  ) : null}
                </div>

                {r.telefone || r.obs || r.locacao ? (
                  <div style={{ marginTop: 12, display: "grid", gap: 8 }}>
                    {r.telefone ? (
                      <div style={{ fontSize: 12, opacity: 3.0 }}>
                        <span style={{ fontWeight: 1000, opacity: 0.9 }}>Telefone:</span> {r.telefone}
                      </div>
                    ) : null}
                    {r.locacao ? (
                      <div style={{ fontSize: 12, opacity:  3.0}}>
                        <span style={{ fontWeight: 1000, opacity: 0.9 }}>Locação:</span> {r.locacao}
                      </div>
                    ) : null}
                    {r.obs ? (
                      <div style={{ fontSize: 12, opacity: 3.0 }}>
                        <span style={{ fontWeight: 1000, opacity: 0.9 }}>Obs:</span> {r.obs}
                      </div>
                    ) : null}
                  </div>
                ) : null}

                <div style={{ marginTop: 10, fontSize: 11, opacity: 0.55 }}>
                  Toque para editar
                </div>
              </button>
            );
          })}
        </div>
      </CardShell>

      {/* nova/editar reserva */}
      <Accordion
        title={editingId ? "Editar reserva" : "Nova reserva"}
        subtitle={editingId ? "Alterar e salvar" : "Toque para abrir e preencher"}
        open={accordionOpen}
        setOpen={setAccordionOpen}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSave();
          }}
          style={{ display: "grid", gap: 12 }}
        >
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <FieldLabel>Horário chegada</FieldLabel>
              <FieldShell>
                <Select value={horaChegada} onChange={setHoraChegada}>
                  {timeOptions.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </Select>
              </FieldShell>
            </div>

            <div>
              <FieldLabel>Horário saída (opcional)</FieldLabel>
              <FieldShell>
                <Select value={horaSaida} onChange={setHoraSaida}>
                  <option value="">—</option>
                  {timeOptions.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </Select>
              </FieldShell>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <FieldLabel>Pessoas</FieldLabel>
              <FieldShell>
                <Input value={pessoas} onChange={setPessoas} placeholder="Qtde. Pessoas:" />
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
              <Input
                value={locacao}
                onChange={setLocacao}
                placeholder="Descrição: Período Vespertino / Período Noturno"
              />
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
                {!hasValor ? (
                  <div style={{ marginTop: 8, fontSize: 11, opacity: 0.65 }}>
                   
                  </div>
                ) : null}
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
                    disabled={!hasValor} // ✅ se valor==0, trava em Pago
                  >
                    Pago
                  </AquaButton>
                  <AquaButton
                    variant={status === "Pendente" ? "solid" : "ghost"}
                    onClick={() => setStatus("Pendente")}
                    style={{ flex: 1 }}
                    type="button"
                    disabled={!hasValor} // ✅ se valor==0, trava em Pago
                  >
                    Pendente
                  </AquaButton>
                </div>
              </FieldShell>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <AquaButton type="submit" disabled={saving}>
              {saving ? (editingId ? "Salvando..." : "Criando...") : (editingId ? "Salvar alterações" : "Criar reserva")}
            </AquaButton>

            <AquaButton
              variant="ghost"
              type="button"
              onClick={() => {
                limpar();
                setAccordionOpen(false);
              }}
              disabled={saving}
            >
              {editingId ? "Cancelar" : "Limpar"}
            </AquaButton>
          </div>
        </form>
      </Accordion>
    </div>
  );
}
