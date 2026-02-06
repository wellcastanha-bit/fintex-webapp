export type Row = Record<string, any>;

export type ColDef = {
  key: string;
  label: string;
  w: number;
  type: "text" | "money" | "action";
};

export const COLS: readonly ColDef[] = [
  { key: "DATA", label: "DATA", w: 90, type: "text" },
  { key: "MÊS", label: "MÊS", w: 110, type: "text" },
  { key: "CLIENTE", label: "CLIENTE", w: 260, type: "text" },
  { key: "PLATAFORMA", label: "PLATAFORMA", w: 160, type: "text" },
  { key: "ATENDIMENTO", label: "ATENDIMENTO", w: 160, type: "text" },
  { key: "R$ INICIAL", label: "R$ INICIAL", w: 120, type: "money" },
  { key: "TROCO", label: "TROCO", w: 120, type: "money" },
  { key: "R$ FINAL", label: "R$ FINAL", w: 120, type: "money" },
  { key: "FORMA DE PAGAMENTO", label: "FORMA DE PAGAMENTO", w: 200, type: "text" },
  { key: "BAIRROS", label: "BAIRROS", w: 170, type: "text" },
  { key: "TAXA DE ENTREGA", label: "TAXA DE ENTREGA", w: 150, type: "money" },
  { key: "RESPONSÁVEL", label: "RESPONSÁVEL", w: 210, type: "text" },
  { key: "STATUS", label: "STATUS", w: 190, type: "text" },
  { key: "__AÇÕES", label: "", w: 66, type: "action" },
] as const;

export const RESPONSAVEIS = [
  "Operador de Caixa",
  "Motoboy 01",
  "Motoboy 02",
  "Motoboy 03",
  "Motoboy 04",
  "Motoboy 05",
  "Motoboy 06",
] as const;

export const STATUS_OPTS = ["EM PRODUÇÃO", "ENTREGUE", "FATIAS DE PIZZA"] as const;
