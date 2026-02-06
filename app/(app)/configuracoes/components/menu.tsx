"use client";

import {
  Building2,
  CreditCard,
  Truck,
  Printer,
  PlugZap,
  Users,
} from "lucide-react";
import { SectionCard, RowButton } from "./ui";
import type { SectionKey } from "../page";

export default function MenuConfig({
  active,
  onChange,
}: {
  active: SectionKey;
  onChange: (k: SectionKey) => void;
}) {
  return (
    <SectionCard title="Menu">
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <RowButton
          title="Empresa / Loja"
          subtitle="Dados da empresa e do PDV"
          Icon={Building2}
          active={active === "empresa"}
          onClick={() => onChange("empresa")}
        />

        <RowButton
          title="Formas de Pagamento"
          subtitle="PIX, Dinheiro, Cartão, Online"
          Icon={CreditCard}
          active={active === "pagamentos"}
          onClick={() => onChange("pagamentos")}
        />

        <RowButton
          title="Taxas / Entrega"
          subtitle="Taxa padrão e por bairro"
          Icon={Truck}
          active={active === "taxas"}
          onClick={() => onChange("taxas")}
        />

        <RowButton
          title="Impressoras"
          subtitle="Cozinha e Caixa"
          Icon={Printer}
          badge="Futuro"
          active={active === "impressora"}
          onClick={() => onChange("impressora")}
        />

        <RowButton
          title="Integrações"
          subtitle="WhatsApp, iFood, AiqFome"
          Icon={PlugZap}
          active={active === "integracoes"}
          onClick={() => onChange("integracoes")}
        />

        <RowButton
          title="Usuários"
          subtitle="Perfis e permissões"
          Icon={Users}
          badge="Futuro"
          active={active === "usuarios"}
          onClick={() => onChange("usuarios")}
        />
      </div>
    </SectionCard>
  );
}
