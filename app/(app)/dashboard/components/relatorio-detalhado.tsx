// app/dashboard/components/relatorio_detalhado.tsx
"use client";

import React from "react";
import { Construction, FileText } from "lucide-react";

export default function RelatorioDetalhadoView() {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        minHeight: "100vh",
        overflow: "hidden",
        background:
          "radial-gradient(1200px 700px at 18% 0%, rgba(79,220,255,0.18), rgba(0,0,0,0) 55%), radial-gradient(900px 600px at 85% 10%, rgba(79,220,255,0.10), rgba(0,0,0,0) 60%), linear-gradient(180deg, #041328, #020b18 55%, #020914)",
      }}
    >
      <div style={{ padding: 18, paddingBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 16,
              display: "grid",
              placeItems: "center",
              background: "rgba(79,220,255,0.10)",
              border: "1px solid rgba(79,220,255,0.22)",
              boxShadow: "0 0 22px rgba(79,220,255,0.14)",
            }}
          >
            <FileText size={18} color="rgba(255,255,255,0.92)" />
          </div>

          <div>
            <div style={{ color: "rgba(255,255,255,0.95)", fontWeight: 980, fontSize: 18 }}>
              Relatório Detalhado
            </div>
            <div style={{ marginTop: 2, color: "rgba(255,255,255,0.62)", fontWeight: 850, fontSize: 12 }}>
              Em construção
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: 18, paddingTop: 0 }}>
        <div
          style={{
            borderRadius: 20,
            border: "1px solid rgba(79,220,255,0.34)",
            boxShadow:
              "0 0 0 1px rgba(79,220,255,0.14), 0 0 40px rgba(79,220,255,0.16), 0 18px 60px rgba(0,0,0,0.62)",
            background: "linear-gradient(180deg, rgba(255,255,255,0.03), rgba(0,0,0,0.12))",
            overflow: "hidden",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
          }}
        >
          <div
            style={{
              padding: 16,
              borderBottom: "1px solid rgba(79,220,255,0.16)",
              background: "linear-gradient(180deg, rgba(22, 120, 145, 0.55), rgba(12, 70, 92, 0.45))",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
            }}
          >
            <div style={{ color: "rgba(255,255,255,0.92)", fontWeight: 980, fontSize: 15 }}>
              Painel em construção
            </div>

            <div
              style={{
                height: 30,
                padding: "0 12px",
                borderRadius: 999,
                border: "1px solid rgba(79,220,255,0.22)",
                background: "rgba(255,255,255,0.06)",
                color: "rgba(255,255,255,0.86)",
                fontWeight: 950,
                fontSize: 12,
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.10)",
                whiteSpace: "nowrap",
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 999,
                  background: "rgba(79,220,255,0.95)",
                  boxShadow: "0 0 14px rgba(79,220,255,0.28)",
                  display: "inline-block",
                }}
              />
              FINtEX · Relatórios
            </div>
          </div>

          <div style={{ padding: 16 }}>
            <div
              style={{
                borderRadius: 18,
                border: "1px solid rgba(255,255,255,0.10)",
                background:
                  "radial-gradient(900px 260px at 20% 0%, rgba(79,220,255,0.18), rgba(0,0,0,0) 58%), linear-gradient(180deg, rgba(255,255,255,0.05), rgba(0,0,0,0.16))",
                boxShadow:
                  "0 0 0 1px rgba(79,220,255,0.10) inset, 0 0 32px rgba(79,220,255,0.12), 0 18px 55px rgba(0,0,0,0.52)",
                padding: 18,
                overflow: "hidden",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 16,
                      display: "grid",
                      placeItems: "center",
                      background: "rgba(79,220,255,0.10)",
                      border: "1px solid rgba(79,220,255,0.22)",
                      boxShadow: "0 0 22px rgba(79,220,255,0.14)",
                    }}
                  >
                    <Construction size={20} color="rgba(255,255,255,0.92)" />
                  </div>

                  <div>
                    <div style={{ color: "rgba(255,255,255,0.96)", fontWeight: 990, fontSize: 22 }}>
                      Em construção
                    </div>
                    <div style={{ marginTop: 6, color: "rgba(255,255,255,0.70)", fontWeight: 850, fontSize: 13, lineHeight: 1.35 }}>
                      Aqui vai entrar o <b style={{ color: "rgba(255,255,255,0.92)" }}>Relatório Detalhado</b> com filtros + DRE do recorte,
                      no padrão “Pedidos”.
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    height: 32,
                    padding: "0 12px",
                    borderRadius: 999,
                    border: "1px solid rgba(255,184,77,0.30)",
                    background: "rgba(255,184,77,0.12)",
                    color: "rgba(255,255,255,0.92)",
                    fontWeight: 950,
                    fontSize: 12,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    boxShadow: "0 0 20px rgba(255,184,77,0.14)",
                    whiteSpace: "nowrap",
                  }}
                  title="Feature em desenvolvimento"
                >
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 999,
                      background: "rgba(255,184,77,0.95)",
                      boxShadow: "0 0 14px rgba(255,184,77,0.18)",
                      display: "inline-block",
                    }}
                  />
                  beta
                </div>
              </div>

              <div
                style={{
                  marginTop: 14,
                  padding: 14,
                  borderRadius: 16,
                  background: "rgba(0,0,0,0.18)",
                  border: "1px dashed rgba(255,255,255,0.16)",
                  color: "rgba(255,255,255,0.72)",
                  fontWeight: 900,
                  fontSize: 13,
                  lineHeight: 1.45,
                }}
              >
                Próximos blocos:
                <div style={{ marginTop: 8, display: "grid", gap: 6 }}>
                  <div>• Filtros (data/mês/cliente/plataforma/atendimento/pagamento/bairro/responsável/status)</div>
                  <div>• Tabela espelho “Pedidos” (com edição e sincronização)</div>
                  <div>• DRE do recorte (receita, CMV, despesas, lucro, margem)</div>
                </div>
              </div>
            </div>

            <div
              style={{
                marginTop: 12,
                padding: 12,
                borderRadius: 16,
                border: "1px solid rgba(79,220,255,0.15)",
                background: "rgba(255,255,255,0.04)",
                color: "rgba(255,255,255,0.70)",
                fontSize: 12,
                lineHeight: 1.4,
              }}
            >
              <b style={{ color: "rgba(255,255,255,0.92)" }}>FINtEX</b> · verdade operacional & fluxo real.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
