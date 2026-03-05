"use client";

import { SectionCard, Toggle, FieldLabel } from "./ui";
import { useState } from "react";

export default function FormasPagamento() {
  const [pix, setPix] = useState(true);
  const [dinheiro, setDinheiro] = useState(true);
  const [debito, setDebito] = useState(true);
  const [credito, setCredito] = useState(true);
  const [online, setOnline] = useState(false);

  return (
    <SectionCard title="Formas de Pagamento">
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <FieldLabel>PIX</FieldLabel>
          <Toggle value={pix} onChange={setPix} />
        </div>
        <div>
          <FieldLabel>Dinheiro</FieldLabel>
          <Toggle value={dinheiro} onChange={setDinheiro} />
        </div>
        <div>
          <FieldLabel>Débito</FieldLabel>
          <Toggle value={debito} onChange={setDebito} />
        </div>
        <div>
          <FieldLabel>Crédito</FieldLabel>
          <Toggle value={credito} onChange={setCredito} />
        </div>
        <div style={{ gridColumn: "1 / -1" }}>
          <FieldLabel>Pagamento Online</FieldLabel>
          <Toggle value={online} onChange={setOnline} />
        </div>
      </div>
    </SectionCard>
  );
}
