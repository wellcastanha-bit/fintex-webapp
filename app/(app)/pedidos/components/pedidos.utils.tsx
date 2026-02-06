import type { Row } from "./pedidos.constant";
import { COLS } from "./pedidos.constant";

export function normKey(s: string) {
  return (s || "")
    .toString()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s$]/g, "")
    .replace(/\s+/g, " ")
    .toUpperCase();
}

export function normVal(v: any) {
  return (v ?? "")
    .toString()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .toUpperCase();
}

export function matchLoose(rowVal: any, filterVal: any) {
  const a = normVal(rowVal);
  const b = normVal(filterVal);
  if (!b) return true;
  if (!a) return false;
  return a === b || a.includes(b) || b.includes(a);
}

export function matchMotoboy(rowVal: any, filterVal: any) {
  const a = normVal(rowVal);
  const b = normVal(filterVal);
  if (!b) return true;
  if (!a) return false;

  if (a === b || a.includes(b) || b.includes(a)) return true;

  const na = (a.match(/\d+/g) || []).join("");
  const nb = (b.match(/\d+/g) || []).join("");
  if (na && nb) {
    const ia = parseInt(na, 10);
    const ib = parseInt(nb, 10);
    if (Number.isFinite(ia) && Number.isFinite(ib) && ia === ib) return true;
  }
  return false;
}

export function matchPlataforma(rowVal: any, filterVal: any) {
  return matchLoose(rowVal, filterVal);
}

export function parseBRLToNumber(v: any): number | null {
  if (v === null || v === undefined) return null;
  if (typeof v === "number") return Number.isFinite(v) ? v : null;

  const original = String(v).trim();
  if (!original || original === "-" || original.toUpperCase() === "R$" || original.includes("R$ -")) return null;

  let s = original.replace(/^R\$/i, "").replace(/\s/g, "");
  if (s.includes(",")) s = s.replace(/\./g, "").replace(",", ".");
  else s = s.replace(/[^0-9.\-]/g, "");

  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

export function brl(v: any) {
  const n = parseBRLToNumber(v);
  if (n === null) return "R$  -";
  return `R$ ${n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function stripPrefix(label: string, prefix: string) {
  const s = (label || "").toString().trim();
  const p = prefix.toLowerCase();
  return s.toLowerCase().startsWith(p) ? s.slice(prefix.length).trim() : s;
}

export function paymentLabel(v: any) {
  const s = (v ?? "").toString().trim().toUpperCase();

  if (s === "CRÉDITO" || s === "CREDITO") return "Cartão de Crédito";
  if (s === "DÉBITO" || s === "DEBITO") return "Cartão de Débito";
  if (s === "ONLINE") return "Pagamento Online";
  if (s === "PIX") return "PIX";
  if (s === "DINHEIRO") return "Dinheiro";

  return v ?? "-";
}

export function ensureAllCols(out: Row) {
  for (const c of COLS) {
    if (c.type === "action") continue;
    const k = normKey(c.key);
    if (!(k in out)) out[k] = c.type === "money" ? null : "-";
  }
  return out;
}
