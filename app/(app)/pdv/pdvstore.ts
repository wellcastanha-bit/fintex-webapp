// app/pdv/lib/pdvstore.ts
"use client";

export type AtendimentoKey = "RETIRADA" | "ENTREGA" | "MESA" | "";
export type PaymentKey = "DINHEIRO" | "DÉBITO" | "CRÉDITO" | "PIX" | "ONLINE" | "";

export type PdvPayload = {
  customer_name: string;
  platform: string;
  service_type: AtendimentoKey;
  payment_method: PaymentKey;
  total: number;

  // ✅ LOCAL
  bairros: string;        // nome do bairro/local
  taxa_entrega: number;   // taxa de entrega (0 quando não tiver)
};

type PdvDraft = Partial<PdvPayload>;

const KEY = "__pdv_draft__";

function read(): PdvDraft {
  if (typeof window === "undefined") return {};
  return (window as any)[KEY] ?? {};
}

function write(next: PdvDraft) {
  (window as any)[KEY] = next;
}

export function pdvSet<K extends keyof PdvPayload>(key: K, value: PdvPayload[K]) {
  const curr = read();
  write({ ...curr, [key]: value });
}

export function pdvGet(): PdvDraft {
  return read();
}

export function pdvClear() {
  write({});
  window.dispatchEvent(new Event("pdv:reset"));
}
