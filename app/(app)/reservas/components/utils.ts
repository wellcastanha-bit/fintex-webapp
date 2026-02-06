// app/reservas/components/utils.ts
import type { LocacaoStatus, Reserva } from "./types";

/* =========================
   THEME
========================= */
export const AQUA = "#4fdcff";
export const AQUA_DAY_BG = "rgba(75,212,246,0.58)"; // ✅ dia com reserva
export const PAGE_BG =
  "linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.03) 22%, rgba(6,16,37,0.94) 100%)";

/* =========================
   DATE (BR interface, ISO interno)
========================= */
export function pad2(n: number) {
  return String(n).padStart(2, "0");
}
export function toISODate(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}
export function isoToBR(iso: string) {
  const m = String(iso || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return "";
  return `${m[3]}/${m[2]}/${m[1]}`;
}
export function brToISO(br: string) {
  const m = String(br || "").match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return "";
  const dd = Number(m[1]);
  const mm = Number(m[2]);
  const yy = Number(m[3]);
  if (!yy || mm < 1 || mm > 12 || dd < 1 || dd > 31) return "";
  return `${yy}-${pad2(mm)}-${pad2(dd)}`;
}
export function maskDateBR(value: string) {
  const d = (value || "").replace(/\D/g, "").slice(0, 8);
  const a = d.slice(0, 2);
  const b = d.slice(2, 4);
  const c = d.slice(4, 8);
  let out = a;
  if (b) out += `/${b}`;
  if (c) out += `/${c}`;
  return out;
}

/* =========================
   TEXT FORMAT
========================= */
function cap(w: string) {
  if (!w) return "";
  return w.charAt(0).toUpperCase() + w.slice(1);
}
export function titleCaseName(s: string) {
  const raw = (s || "").trim().toLowerCase();
  if (!raw) return "";
  const keepLower = new Set(["da", "de", "do", "das", "dos", "e", "di", "du"]);
  return raw
    .split(/\s+/)
    .map((w, i) => {
      if (!w) return "";
      if (i !== 0 && keepLower.has(w)) return w;
      if (w.includes("'")) {
        return w
          .split("'")
          .map((p) => cap(p))
          .join("'");
      }
      return cap(w);
    })
    .join(" ");
}
export function formatPhoneBR(input: string) {
  let d = (input || "").replace(/\D/g, "");
  if (!d) return "";

  if (d.startsWith("55") && d.length > 11) d = d.slice(2);

  const dd = d.slice(0, 2);
  const rest = d.slice(2);

  if (rest.length === 9) return `${dd} ${rest.slice(0, 1)} ${rest.slice(1, 5)}-${rest.slice(5, 9)}`;
  if (rest.length === 8) return `${dd} ${rest.slice(0, 4)}-${rest.slice(4, 8)}`;

  if (d.length <= 2) return d;
  if (d.length <= 6) return `${d.slice(0, 2)} ${d.slice(2)}`;
  return `${d.slice(0, 2)} ${d.slice(2, 3)} ${d.slice(3, 7)}-${d.slice(7, 11)}`.trim();
}

/* =========================
   MONEY (BRL)
========================= */
export function fmtBRL(raw: string) {
  const v = raw.toString().replace(/[^\d]/g, "").padStart(3, "0");
  const cents = v.slice(-2);
  const ints = v.slice(0, -2);
  const n = Number(ints);
  const withThousands = n.toLocaleString("pt-BR");
  return `${withThousands},${cents}`;
}
export function brlToNumber(s: string) {
  const clean = (s ?? "0,00").toString().replace(/\./g, "").replace(",", ".");
  const n = Number(clean);
  return Number.isFinite(n) ? n : 0;
}
export function numberToBRL(n: number | null | undefined) {
  const v = typeof n === "number" && Number.isFinite(n) ? n : 0;
  return v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
