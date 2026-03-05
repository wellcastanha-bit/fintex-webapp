"use client";

import React, { useState } from "react";

import MenuConfig from "./components/menu";
import Empresa from "./components/empresa";
import FormasPagamento from "./components/formasdepagamento";
import TaxasEntrega from "./components/taxasentrega";
import Impressora from "./components/impressora";
import Integracoes from "./components/integracoes";
import UsuariosPermissoes from "./components/usuariospermissoes";

export type SectionKey =
  | "empresa"
  | "pagamentos"
  | "taxas"
  | "impressora"
  | "integracoes"
  | "usuarios";

export default function ConfiguracoesPage() {
  const [active, setActive] = useState<SectionKey>("empresa");

  return (
    <>
      {/* TÍTULO */}
      <div
        style={{
          fontWeight: 900,
          fontSize: 30,
          color: "#ffffff",
          marginBottom: 18,
        }}
      >
        Configurações
      </div>

      {/* CONTEÚDO */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "520px 1fr",
          gap: 18,
          alignItems: "start",
          minWidth: 0,
        }}
      >
        {/* MENU */}
        <MenuConfig active={active} onChange={setActive} />

        {/* PAINEL */}
        {active === "empresa" && <Empresa />}
        {active === "pagamentos" && <FormasPagamento />}
        {active === "taxas" && <TaxasEntrega />}
        {active === "impressora" && <Impressora />}
        {active === "integracoes" && <Integracoes />}
        {active === "usuarios" && <UsuariosPermissoes />}
      </div>
    </>
  );
}
