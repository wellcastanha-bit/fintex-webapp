"use client";

import { SectionCard, Toggle, FieldLabel } from "./ui";
import { useState } from "react";

export default function Integracoes() {
  const [whats, setWhats] = useState(false);
  const [ifood, setIfood] = useState(false);
  const [aiq, setAiq] = useState(false);

  return (
    <SectionCard title="Integrações">
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <FieldLabel>WhatsApp</FieldLabel>
          <Toggle value={whats} onChange={setWhats} />
        </div>
        <div>
          <FieldLabel>iFood</FieldLabel>
          <Toggle value={ifood} onChange={setIfood} />
        </div>
        <div>
          <FieldLabel>AiqFome</FieldLabel>
          <Toggle value={aiq} onChange={setAiq} />
        </div>
      </div>
    </SectionCard>
  );
}
