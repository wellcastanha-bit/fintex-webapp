"use client";

import { SectionCard, Field, FieldLabel } from "./ui";
import { useState } from "react";

export default function Empresa() {
  const [nome, setNome] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [telefone, setTelefone] = useState("");
  const [endereco, setEndereco] = useState("");

  return (
    <SectionCard title="Empresa / Loja">
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div style={{ gridColumn: "1 / -1" }}>
          <FieldLabel>Nome da Empresa</FieldLabel>
          <Field placeholder="Pizza Blu" value={nome} onChange={setNome} />
        </div>

        <div>
          <FieldLabel>CNPJ</FieldLabel>
          <Field placeholder="00.000.000/0000-00" value={cnpj} onChange={setCnpj} />
        </div>

        <div>
          <FieldLabel>Telefone</FieldLabel>
          <Field placeholder="(49) 9 0000-0000" value={telefone} onChange={setTelefone} />
        </div>

        <div style={{ gridColumn: "1 / -1" }}>
          <FieldLabel>Endereço</FieldLabel>
          <Field placeholder="Rua, número, bairro" value={endereco} onChange={setEndereco} />
        </div>
      </div>
    </SectionCard>
  );
}
