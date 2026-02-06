"use client";

import React, { useState } from "react";
import { SectionCard, Field, FieldLabel, SmallBtn } from "./ui";

type BairroRow = { bairro: string; valor: string };

export default function TaxasEntrega() {
  const [taxaPadrao, setTaxaPadrao] = useState<string>("");
  const [bairros, setBairros] = useState<BairroRow[]>([]);

  function addBairro() {
    setBairros((prev) => [...prev, { bairro: "", valor: "" }]);
  }

  function setBairro(i: number, patch: Partial<BairroRow>) {
    setBairros((prev) => {
      const next = [...prev];
      next[i] = { ...next[i], ...patch };
      return next;
    });
  }

  function removeBairro(i: number) {
    setBairros((prev) => prev.filter((_, idx) => idx !== i));
  }

  return (
    <SectionCard title="Taxas / Taxa de Entrega">
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <FieldLabel>Taxa padrão</FieldLabel>
          <Field
            placeholder="Ex: 10,00"
            value={taxaPadrao}
            onChange={(v: string) => setTaxaPadrao(v)}
          />
        </div>

        <div style={{ alignSelf: "end", display: "flex", justifyContent: "flex-end" }}>
          <SmallBtn onClick={addBairro}>+ Adicionar bairro</SmallBtn>
        </div>

        {bairros.map((b, i) => (
          <div
            key={i}
            style={{
              gridColumn: "1 / -1",
              display: "grid",
              gridTemplateColumns: "2fr 1fr auto",
              gap: 8,
              alignItems: "center",
            }}
          >
            <Field
              placeholder="Nome do bairro"
              value={b.bairro}
              onChange={(v: string) => setBairro(i, { bairro: v })}
            />
            <Field
              placeholder="Valor"
              value={b.valor}
              onChange={(v: string) => setBairro(i, { valor: v })}
            />
            <SmallBtn danger onClick={() => removeBairro(i)}>
              Remover
            </SmallBtn>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
