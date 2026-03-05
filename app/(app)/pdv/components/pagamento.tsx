/* =========================================
   app/pdv/components/pagamento.tsx
   ✅ UI/Front
   ✅ cancelar -> pede modal no Page via onRequestCancel
   ✅ SALVAR: monta payload (SEM TENANT) e envia pro backend (/api/orders)
   ✅ (sem Supabase direto aqui)
========================================= */
"use client";

import Image from "next/image";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Save, X } from "lucide-react";
import { pdvGet, pdvSet, pdvClear } from "../pdvstore";

type PagamentoKey = "PIX" | "DÉBITO" | "CRÉDITO" | "DINHEIRO" | "ONLINE" | "";
type ToastType = "success" | "error";

type Props = {
  showToast: (msg: string, type?: ToastType) => void;
  onRequestCancel: (cancelFn: () => void) => void;
};

// ✅ payload que o backend /api/orders espera
type ApiOrderPayload = {
  customer_name: string;
  platform: string;
  service_type: string;

  bairros?: string | null;
  taxa_entrega?: number;

  payment_method: PagamentoKey;

  // regra do teu sistema:
  // r_final = r_inicial - troco  (calculado no banco)
  r_inicial: number; // dinheiro recebido (ou valor do pedido se não for dinheiro)
  troco: number; // troco calculado (dinheiro_recebido - valor_pedido)
  responsavel?: string | null;
};

export default function Pagamento({ showToast, onRequestCancel }: Props) {
  const [forma, setForma] = useState<PagamentoKey>("");

  // Valor do pedido
  const [valorPedido, setValorPedido] = useState<string>("0,00");
  const [editandoValor, setEditandoValor] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Troco (só aparece no DINHEIRO)
  const [trocoPara, setTrocoPara] = useState<string>("0,00");
  const trocoRef = useRef<HTMLInputElement | null>(null);

  // hovers
  const [hoverFormas, setHoverFormas] = useState(false);
  const [hoverValor, setHoverValor] = useState(false);
  const [hoverSalvar, setHoverSalvar] = useState(false);
  const [hoverCancelar, setHoverCancelar] = useState(false);

  const IMG = useMemo(
    () => ({
      pix: "/imagens/pix.png",
      debito: "/imagens/debito.png",
      credito: "/imagens/credito.png",
      dinheiro: "/imagens/dinheiro.png",
      online: "/imagens/online.png",
    }),
    []
  );

  const WRAP_W = 370;

  // tamanhos reais
  const PAY_BTN_W = 100;
  const PAY_BTN_H = 100;

  // espaçamento
  const GAP_X = 16;
  const GAP_Y = 12;

  // clip do halo
  const PAY_RADIUS = 14;

  const pressIn = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.currentTarget.style.transform = "scale(0.96)";
  };
  const pressOut = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.currentTarget.style.transform = "scale(1)";
  };
  const pressOutPay = (e: React.PointerEvent<HTMLButtonElement>) => {
    const key = e.currentTarget.getAttribute("data-key") as PagamentoKey;
    e.currentTarget.style.transform = key && key === forma ? "scale(0.99)" : "scale(1)";
  };

  const fmtBRL = (raw: string) => {
    const v = raw.toString().replace(/[^\d]/g, "").padStart(3, "0");
    const cents = v.slice(-2);
    const ints = v.slice(0, -2);
    const n = Number(ints);
    const withThousands = n.toLocaleString("pt-BR");
    return `${withThousands},${cents}`;
  };

  const brlToNumber = (s: string) => {
    const clean = (s ?? "0,00").toString().replace(/\./g, "").replace(",", ".");
    const n = Number(clean);
    return Number.isFinite(n) ? n : 0;
  };

  const onValorChange = (s: string) => {
    const f = fmtBRL(s);
    setValorPedido(f);
    pdvSet("total", brlToNumber(f));
  };

  const onTrocoChange = (s: string) => setTrocoPara(fmtBRL(s));

  const startEditValor = () => {
    setEditandoValor(true);
    requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    });
  };
  const stopEditValor = () => setEditandoValor(false);

  // mantém store coerente (sem listeners globais)
  useEffect(() => {
    pdvSet("total", brlToNumber(valorPedido));
    if (forma) pdvSet("payment_method", forma);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const salvar = async () => {
    const valor_pedido = brlToNumber(valorPedido); // total digitado
    const dinheiro_recebido = brlToNumber(trocoPara); // "troco para" (se dinheiro)

    if (!forma) return showToast("Selecione a forma de pagamento.");
    if (valor_pedido <= 0) return showToast("Informe o valor do pedido.");

    const d = pdvGet();

    if (!d.customer_name || !String(d.customer_name).trim()) return showToast("Falta: Nome do cliente");
    if (!d.platform || !String(d.platform).trim()) return showToast("Falta: Plataforma");
    if (!d.service_type || !String(d.service_type).trim()) return showToast("Falta: Atendimento");

    pdvSet("payment_method", forma);
    pdvSet("total", valor_pedido);

    const bairro_raw = String((d as any)?.bairros ?? "").trim();
    const bairros = bairro_raw && bairro_raw !== "Selecione:" ? bairro_raw : "";

    const taxa_entrega_num = Number((d as any)?.taxa_entrega ?? 0);
    const taxa_entrega = Number.isFinite(taxa_entrega_num) ? taxa_entrega_num : 0;

    // ✅ regra:
    // - se DINHEIRO e digitou "Troco para" > 0: r_inicial = dinheiro_recebido
    // - caso contrário: r_inicial = valor_pedido
    const isDinheiro = forma === "DINHEIRO" && dinheiro_recebido > 0;
    const r_inicial = isDinheiro ? dinheiro_recebido : valor_pedido;

    // ✅ troco = dinheiro_recebido - valor_pedido (nunca negativo)
    const troco = isDinheiro ? Math.max(0, dinheiro_recebido - valor_pedido) : 0;

    const payload: ApiOrderPayload = {
      customer_name: String(d.customer_name).trim(),
      platform: String(d.platform).trim(),
      service_type: String(d.service_type).trim(),

      bairros: bairros || null,
      taxa_entrega: taxa_entrega > 0 ? taxa_entrega : 0,

      payment_method: forma,

      r_inicial,
      troco,

      responsavel: (d as any)?.responsavel ? String((d as any).responsavel).trim() : null,
    };

    try {
      const r = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const j = await r.json().catch(() => null);

      if (!r.ok || !j?.ok) {
        console.error("[PDV] POST /api/orders failed:", j?.error || r.statusText, j);
        return showToast("Erro ao salvar no backend.", "error");
      }

      showToast("Pedido salvo ✅", "success");

      pdvClear();
      setForma("");
      setValorPedido("0,00");
      setEditandoValor(false);
      setTrocoPara("0,00");
    } catch (e) {
      console.error("[PDV] network error:", e);
      return showToast("Sem conexão com o backend.", "error");
    }
  };

  const cancelarReal = () => {
    setForma("");
    setValorPedido("0,00");
    setEditandoValor(false);
    setTrocoPara("0,00");
    pdvClear();
    showToast("Pedido cancelado");
  };

  const cancelar = () => {
    onRequestCancel(cancelarReal);
  };

  const PayBtn = ({ k, src, alt }: { k: Exclude<PagamentoKey, "">; src: string; alt: string }) => {
    const ativo = forma === k;

    return (
      <button
        type="button"
        data-key={k}
        tabIndex={-1}
        onClick={(e) => {
          setForma(k);
          pdvSet("payment_method", k);
          (e.currentTarget as HTMLButtonElement).blur();
          if (k === "DINHEIRO") requestAnimationFrame(() => trocoRef.current?.focus());
        }}
        onFocus={(e) => (e.currentTarget as HTMLButtonElement).blur()}
        onPointerDown={pressIn}
        onPointerUp={pressOutPay}
        onPointerLeave={pressOutPay}
        onPointerCancel={pressOutPay}
        onMouseDown={(e) => e.preventDefault()}
        aria-pressed={ativo}
        style={{
          width: PAY_BTN_W,
          height: PAY_BTN_H,
          padding: 0,
          border: "none",
          background: "transparent",
          cursor: "pointer",
          outline: "none",
          boxShadow: "none",
          filter: "none",
          borderRadius: PAY_RADIUS,
          overflow: "hidden",
          lineHeight: 0,
          userSelect: "none",
          WebkitTapHighlightColor: "transparent",
          WebkitAppearance: "none",
          appearance: "none",
          boxSizing: "border-box",
          transform: ativo ? "scale(0.99)" : "scale(1)",
          transition: "transform 90ms ease",
        }}
      >
        <Image
          src={src}
          alt={alt}
          width={PAY_BTN_W}
          height={PAY_BTN_H}
          priority
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            display: "block",
            filter: forma && !ativo ? "grayscale(100%) contrast(0.9) brightness(0.9)" : "none",
            transition: "filter 140ms ease",
          }}
        />
      </button>
    );
  };

  const valorNum = brlToNumber(valorPedido);
  const trocoParaNum = brlToNumber(trocoPara);
  const trocoCalc = Math.max(0, trocoParaNum - valorNum);
  const trocoFmt = trocoCalc.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const premiumBg = `radial-gradient(
      900px 200px at 15% -10%,
      rgba(79, 220, 255, 0.12) 0%,
      rgba(79,220,255,0.06) 35%,
      rgba(79, 220, 255, 0.04) 60%
    ),
    linear-gradient(
      180deg,
      rgba(255,255,255,0.08) 0%,
      rgba(255,255,255,0.04) 25%,
      rgba(6,16,37,0.94) 100%
    )`;

  const hoverBorder = (_hover: boolean) => "1px solid rgba(79,220,255,0.55)";

  const hoverShadow = (hover: boolean) =>
    hover
      ? `inset 0 1px 0 rgba(255,255,255,0.12),
         0 0 18px rgba(79,220,255,0.45)`
      : `inset 0 1px 0 rgba(255,255,255,0.10),
         inset 0 -1px 0 rgba(0,0,0,0.45)`;

  const actionFieldStyle = (hover: boolean, tint: "green" | "red"): React.CSSProperties => {
    const glowColor = tint === "green" ? "rgba(14,212,63,0.55)" : "rgba(225,11,11,0.55)";
    const borderColor =
      tint === "green"
        ? hover
          ? "rgba(14,212,63,0.85)"
          : "rgba(14,212,63,0.55)"
        : hover
        ? "rgba(225,11,11,0.85)"
        : "rgba(225,11,11,0.55)";

    return {
      height: 58,
      width: "100%",
      borderRadius: 14,
      border: `1px solid ${borderColor}`,
      boxShadow: hover
        ? `inset 0 1px 0 rgba(255,255,255,0.14),
           0 0 18px ${glowColor},
           0 0 32px ${glowColor}`
        : `inset 0 1px 0 rgba(255,255,255,0.10),
           inset 0 -1px 0 rgba(0,0,0,0.45)`,
      transition: "border 160ms ease, box-shadow 160ms ease, transform 90ms ease",
      transform: "scale(1)",
      cursor: "pointer",
      userSelect: "none",
      WebkitTapHighlightColor: "transparent",
      background:
        tint === "green"
          ? `linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.03) 25%, rgba(8,85,28,0.95) 100%)`
          : `linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.03) 25%, rgba(120,10,10,0.95) 100%)`,
      color: "#fff",
      fontWeight: 900,
      fontSize: 20,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
    };
  };

  return (
    <div style={{ width: WRAP_W }}>
      <div
        onMouseEnter={() => setHoverFormas(true)}
        onMouseLeave={() => setHoverFormas(false)}
        style={{
          borderRadius: 16,
          padding: "16px 14px 16px",
          background: premiumBg,
          border: hoverBorder(hoverFormas),
          boxShadow: hoverShadow(hoverFormas),
          transition: "border 160ms ease, box-shadow 160ms ease",
        }}
      >
        <div style={{ color: "#27d3ff", fontWeight: 800, fontSize: 18, marginBottom: 12 }}>Formas de Pagamento:</div>

        <div
          style={{
            paddingLeft: 20,
            paddingRight: 20,
            display: "grid",
            gridTemplateColumns: `repeat(3, ${PAY_BTN_W}px)`,
            gridAutoRows: `${PAY_BTN_H}px`,
            columnGap: GAP_X,
            rowGap: GAP_Y,
            justifyContent: "center",
            alignContent: "start",
            boxSizing: "border-box",
          }}
        >
          <PayBtn k="PIX" src={IMG.pix} alt="PIX" />
          <PayBtn k="DINHEIRO" src={IMG.dinheiro} alt="DINHEIRO" />
          <PayBtn k="DÉBITO" src={IMG.debito} alt="DÉBITO" />

          <PayBtn k="CRÉDITO" src={IMG.credito} alt="CRÉDITO" />
          <PayBtn k="ONLINE" src={IMG.online} alt="ONLINE" />

          <div style={{ width: PAY_BTN_W, height: PAY_BTN_H }} />
        </div>
      </div>

      <div
        onMouseEnter={() => setHoverValor(true)}
        onMouseLeave={() => setHoverValor(false)}
        style={{
          marginTop: 16,
          borderRadius: 16,
          padding: "18px 18px",
          background: premiumBg,
          border: hoverBorder(hoverValor),
          boxShadow: hoverShadow(hoverValor),
          transition: "border 160ms ease, box-shadow 160ms ease",
        }}
      >
        {!editandoValor ? (
          <button
            type="button"
            onClick={startEditValor}
            onPointerDown={pressIn}
            onPointerUp={pressOut}
            onPointerLeave={pressOut}
            onPointerCancel={pressOut}
            onMouseDown={(e) => e.preventDefault()}
            style={{
              width: "100%",
              border: "none",
              padding: 0,
              background: "transparent",
              cursor: "pointer",
              textAlign: "left",
              outline: "none",
              WebkitTapHighlightColor: "transparent",
              userSelect: "none",
            }}
          >
            <div style={{ color: "#fdfeff", fontWeight: 800, fontSize: 18 }}>Valor do Pedido:</div>
            <div style={{ marginTop: 10, display: "flex", alignItems: "baseline", gap: 10 }}>
              <span style={{ color: "#ffffff", fontWeight: 900, fontSize: 34 }}>R$</span>
              <span style={{ color: "#ffffff", fontWeight: 900, fontSize: 34, lineHeight: 1 }}>{valorPedido}</span>
            </div>
          </button>
        ) : (
          <div>
            <div style={{ color: "#fdfeff", fontWeight: 800, fontSize: 18 }}>Valor do Pedido:</div>

            <div style={{ marginTop: 10, display: "flex", alignItems: "baseline", gap: 10 }}>
              <span style={{ color: "#ffffff", fontWeight: 900, fontSize: 34 }}>R$</span>

              <input
                ref={inputRef}
                value={valorPedido}
                placeholder="0,00"
                onChange={(e) => onValorChange(e.target.value)}
                onBlur={stopEditValor}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === "Escape") stopEditValor();
                }}
                inputMode="numeric"
                style={{
                  width: 180,
                  height: 44,
                  border: "none",
                  outline: "none",
                  background: "rgba(255,255,255,0.10)",
                  color: "#fff",
                  borderRadius: 12,
                  padding: "0 12px",
                  fontSize: 34,
                  fontWeight: 900,
                  textAlign: "left",
                }}
              />
            </div>
          </div>
        )}

        {forma === "DINHEIRO" && (
          <div style={{ marginTop: 14 }}>
            <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", alignItems: "center", gap: 10 }}>
              <div style={{ color: "#e9fbff", fontWeight: 800, fontSize: 22 }}>Troco para:</div>

              <div
                style={{
                  background: "rgba(0,0,0,0.22)",
                  borderRadius: 12,
                  padding: "10px 12px",
                  display: "grid",
                  gridTemplateColumns: "46px 92px",
                  justifyContent: "end",
                  alignItems: "center",
                  gap: 0,
                  width: "fit-content",
                  marginLeft: "auto",
                }}
              >
                <div style={{ color: "#fff", fontWeight: 900, fontSize: 18 }}>R$</div>

                <input
                  ref={trocoRef}
                  value={trocoPara}
                  placeholder="0,00"
                  onChange={(e) => onTrocoChange(e.target.value)}
                  inputMode="numeric"
                  style={{
                    width: 92,
                    maxWidth: 92,
                    border: "none",
                    outline: "none",
                    background: "transparent",
                    color: "#fff",
                    fontWeight: 900,
                    fontSize: 22,
                    textAlign: "right",
                  }}
                />
              </div>
            </div>

            <div style={{ marginTop: 8, color: "#dffbff", fontWeight: 900, fontSize: 22 }}>
              Troco: <span style={{ color: "#0ed43f" }}>R$ {trocoFmt}</span>
            </div>
          </div>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 16 }}>
        <button
          type="button"
          onClick={salvar}
          onMouseEnter={() => setHoverSalvar(true)}
          onMouseLeave={() => setHoverSalvar(false)}
          onPointerDown={(e) => (e.currentTarget.style.transform = "scale(0.97)")}
          onPointerUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
          onPointerLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
          onPointerCancel={(e) => (e.currentTarget.style.transform = "scale(1)")}
          onMouseDown={(e) => e.preventDefault()}
          style={actionFieldStyle(hoverSalvar, "green")}
        >
          <Save size={22} />
          SALVAR
        </button>

        <button
          type="button"
          onClick={cancelar}
          onMouseEnter={() => setHoverCancelar(true)}
          onMouseLeave={() => setHoverCancelar(false)}
          onPointerDown={(e) => (e.currentTarget.style.transform = "scale(0.97)")}
          onPointerUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
          onPointerLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
          onPointerCancel={(e) => (e.currentTarget.style.transform = "scale(1)")}
          onMouseDown={(e) => e.preventDefault()}
          style={actionFieldStyle(hoverCancelar, "red")}
        >
          <X size={22} />
          CANCELAR
        </button>
      </div>
    </div>
  );
}
