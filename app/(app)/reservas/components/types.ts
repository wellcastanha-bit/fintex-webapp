// app/reservas/components/types.ts
export type LocacaoStatus = "PAGO" | "PENDENTE";

export type Reserva = {
  id: string;
  dataISO: string; // yyyy-mm-dd (interno)
  chegada: string; // HH:MM (obrigatório)
  saida?: string; // HH:MM (opcional)

  pessoas: number;
  nome: string;
  telefone: string;
  observacao: string;
  mesa: string;

  // Locação (opcional)
  locacaoDesc?: string;
  locacaoValor?: number | null;
  locacaoStatus?: LocacaoStatus;
};
