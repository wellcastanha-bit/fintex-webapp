"use client";

import React, { useMemo, useState } from "react";
import { Trash2 } from "lucide-react";

import { COLS, RESPONSAVEIS, STATUS_OPTS, type Row, type ColDef } from "./pedidos.constant";
import { brl, normKey } from "./pedidos.utils";
import {
  Arrow,
  fintexSelectStyleBase,
  headerFieldStyle,
  optionStyle,
  pillStyle,
  selectCommon,
  statusTint,
} from "./pedidos.styles";

type Props = {
  filtered: Row[];
  minWidth: number;
  highlightSetRef: React.MutableRefObject<Set<string>>;
  setHighlightIds: React.Dispatch<React.SetStateAction<string[]>>;
  confirmBusy: boolean;
  onRequestDelete: (id: string) => void;
  setRows: React.Dispatch<React.SetStateAction<Row[]>>;
};

const INK = "#0b2c4a";
const INK_SOFT = "rgba(11,44,74,0.72)";
const BORDER = "#cfe7ef";
const BORDER_STRONG = "#2fc1e0";

export default function PedidosTable(props: Props) {
  const { filtered, minWidth, highlightSetRef, setHighlightIds, confirmBusy, onRequestDelete, setRows } = props;

  const [hoverTable, setHoverTable] = useState(false);
  const [hoverHeader, setHoverHeader] = useState(false);
  const [trashHoverId, setTrashHoverId] = useState<string>("");

  const totalW = useMemo(() => COLS.reduce((a: number, c: ColDef) => a + c.w, 0), []);

  const trashBtnStyle = (hover: boolean, disabled: boolean): React.CSSProperties => ({
    width: 36,
    height: 36,
    borderRadius: 14,
    border: hover ? "2px solid rgba(220,38,38,0.55)" : "2px solid rgba(11,44,74,0.14)",
    background: hover
      ? "linear-gradient(180deg, #ffffff 0%, #ffffff 55%, rgba(220,38,38,0.10) 100%)"
      : "linear-gradient(180deg, #ffffff 0%, #ffffff 60%, #f0f7fb 100%)",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.55 : 1,
    boxShadow: "none",
    transition: "border 160ms ease, opacity 160ms ease, background 160ms ease",
    userSelect: "none",
    color: hover ? "rgba(220,38,38,0.85)" : INK_SOFT,
  });

  const killShadowSelect: React.CSSProperties = {
    boxShadow: "none",
    filter: "none",
    outline: "none",
    WebkitAppearance: "none",
    appearance: "none",
    backgroundClip: "padding-box",
  };

  return (
    <div
      onMouseEnter={() => setHoverTable(true)}
      onMouseLeave={() => setHoverTable(false)}
      style={{
        borderRadius: 18,
        width: minWidth + 6,
        height: "auto",
        overflow: "hidden",
        boxSizing: "border-box",
        position: "relative",
        zIndex: 1,
        background: "linear-gradient(180deg, #ffffff 0%, #ffffff 60%, #f0f7fb 100%)",
        border: '"none"',
        boxShadow: hoverTable ? "0 18px 60px rgba(2,12,27,0.14)" : "0 16px 52px rgba(2,12,27,0.10)",
        transition: "border 160ms ease, box-shadow 160ms ease",
      }}
    >
      <div style={{ width: minWidth }}>
        <div
          onMouseEnter={() => setHoverHeader(true)}
          onMouseLeave={() => setHoverHeader(false)}
          style={headerFieldStyle(hoverHeader, totalW)}
        >
          <div
            style={{
              position: "relative",
              zIndex: 2,
              height: "100%",
              display: "grid",
              gridTemplateColumns: COLS.map((c: ColDef) => `${c.w}px`).join(" "),
              alignItems: "center",
            }}
          >
            {COLS.map((c: ColDef) => {
              const k = normKey(c.key);
              const isEditable = k === normKey("RESPONSÁVEL") || k === normKey("STATUS");

              return (
                <div
                  key={c.key}
                  style={{
                    textAlign: "center",
                    color: "#ffffff",
                    fontWeight: 900,
                    fontSize: 13,
                    letterSpacing: 0.4,
                    textTransform: "uppercase",
                    whiteSpace: "nowrap",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                  }}
                >
                  <span>{c.label}</span>
                  {isEditable && <Arrow tint="aqua" />}
                </div>
              );
            })}
          </div>
        </div>

        {filtered.map((r: Row, idx: number) => {
          const rowId = String(r.__ID || "");
          const isHighlighted = rowId ? highlightSetRef.current.has(rowId) : false;

          const applyRowHover = (el: HTMLDivElement) => {
            el.style.background = "rgba(47,193,224,0.08)";
            el.style.boxShadow = "inset 0 0 0 1px rgba(47,193,224,0.18)";
          };

          const applyRowNormal = (el: HTMLDivElement) => {
            el.style.background = "#ffffff";
            el.style.boxShadow = "none";
          };

          return (
            <div
              key={String(r.__ID || r.__ROWNUMBER || idx)}
              onDoubleClick={() => {
                if (!rowId) return;

                const next = new Set(highlightSetRef.current);
                if (next.has(rowId)) next.delete(rowId);
                else next.add(rowId);

                highlightSetRef.current = next;
                setHighlightIds(Array.from(next));
              }}
              style={{
                display: "grid",
                gridTemplateColumns: COLS.map((c: ColDef) => `${c.w}px`).join(" "),
                background: isHighlighted
                  ? "linear-gradient(90deg, rgba(47,193,224,0.22) 0%, rgba(47,193,224,0.10) 55%, #ffffff 100%)"
                  : "#ffffff",
                borderBottom: "1px solid rgba(11,44,74,0.10)",
                color: INK,
                transition: "background 160ms ease, box-shadow 160ms ease",
                boxShadow: isHighlighted ? "inset 0 0 0 2px rgba(47,193,224,0.22)" : "none",
                cursor: "default",
              }}
              onMouseEnter={(e) => {
                if (isHighlighted) return;
                applyRowHover(e.currentTarget as HTMLDivElement);
              }}
              onMouseLeave={(e) => {
                if (isHighlighted) return;
                applyRowNormal(e.currentTarget as HTMLDivElement);
              }}
            >
              {COLS.map((c: ColDef) => {
                if (c.type === "action") {
                  const id = rowId;
                  const disabled = !id || confirmBusy;
                  const hover = trashHoverId === id;

                  return (
                    <div
                      key={c.key}
                      style={{
                        padding: "10px 8px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <button
                        type="button"
                        disabled={disabled}
                        title="Apagar pedido"
                        onMouseEnter={() => setTrashHoverId(id)}
                        onMouseLeave={() => setTrashHoverId("")}
                        style={trashBtnStyle(hover, disabled)}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (!id || disabled) return;
                          onRequestDelete(id);
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  );
                }

                const k = normKey(c.key);
                const raw = r?.[k];
                const txt = c.type === "money" ? brl(raw) : (raw ?? "").toString().trim() || "-";

                const isResp = k === normKey("RESPONSÁVEL");
                const isStatus = k === normKey("STATUS");
                const isEditable = isResp || isStatus;

                const tint = isStatus ? statusTint(txt) : "aqua";

                return (
                  <div
                    key={c.key}
                    style={{
                      padding: isEditable ? "10px 10px" : "14px 8px",
                      fontWeight: 800,
                      fontSize: 15,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      textAlign: "center",
                      boxSizing: "border-box",
                      transition: "color 160ms ease",
                      position: "relative",
                      color: INK,
                    }}
                  >
                    {!isEditable ? (
                      <span style={{ color: INK, opacity: txt === "-" ? 0.55 : 1 }}>{txt}</span>
                    ) : (
                      <div style={{ width: "100%", position: "relative" }}>
                        <div
                          style={{
                            position: "absolute",
                            right: 12,
                            top: "50%",
                            transform: "translateY(-50%)",
                            pointerEvents: "none",
                          }}
                        >
                          <Arrow tint={isStatus ? tint : "aqua"} />
                        </div>

                        <select
                          value={String(txt || "").trim()}
                          onChange={(e) => {
                            const id = rowId;
                            if (!id) return;
                            const next = e.target.value;

                            setRows((cur: Row[]) =>
                              cur.map((rr: Row) => {
                                if (String(rr.__ID || "") !== id) return rr;
                                const copy: Row = { ...rr };
                                if (isResp) copy[normKey("RESPONSÁVEL")] = next;
                                if (isStatus) copy[normKey("STATUS")] = next;
                                return copy;
                              })
                            );
                          }}
                          style={
                            isStatus
                              ? { ...selectCommon, ...pillStyle(tint, false), color: INK, ...killShadowSelect }
                              : { ...fintexSelectStyleBase, color: INK, border: `2px solid ${BORDER}`, ...killShadowSelect }
                          }
                          onMouseEnter={(e) => {
                            // NÃO reaplica shadow no hover
                            if (!isStatus) return;
                            Object.assign((e.currentTarget as HTMLSelectElement).style, {
                              ...pillStyle(tint, true),
                              ...killShadowSelect,
                              color: INK,
                            } as any);
                          }}
                          onMouseLeave={(e) => {
                            if (!isStatus) return;
                            Object.assign((e.currentTarget as HTMLSelectElement).style, {
                              ...pillStyle(tint, false),
                              ...killShadowSelect,
                              color: INK,
                            } as any);
                          }}
                        >
                          {(isResp ? RESPONSAVEIS : STATUS_OPTS).map((opt: string) => (
                            <option key={opt} value={opt} style={optionStyle}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}