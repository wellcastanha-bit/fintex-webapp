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

export default function PedidosTable(props: Props) {
  const { filtered, minWidth, highlightSetRef, setHighlightIds, confirmBusy, onRequestDelete, setRows } = props;

  const [hoverTable, setHoverTable] = useState(false);
  const [hoverHeader, setHoverHeader] = useState(false);
  const [trashHoverId, setTrashHoverId] = useState<string>("");

  const totalW = useMemo(() => COLS.reduce((a: number, c: ColDef) => a + c.w, 0), []);

  const trashBtnStyle = (hover: boolean, disabled: boolean): React.CSSProperties => ({
    width: 36,
    height: 36,
    borderRadius: 12,
    border: hover ? "1px solid rgba(225,11,11,0.65)" : "1px solid rgba(255,255,255,0.10)",
    background: `
      radial-gradient(700px 140px at 15% -10%, rgba(225,11,11,0.10) 0%, rgba(225,11,11,0.05) 40%, rgba(225,11,11,0.02) 70%),
      linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.03) 22%, rgba(6,16,37,0.94) 100%)
    `,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.55 : 1,
    boxShadow: hover
      ? "0 10px 22px rgba(0,0,0,0.18), 0 0 18px rgba(225,11,11,0.28)"
      : "0 10px 22px rgba(0,0,0,0.18), 0 0 14px rgba(255,255,255,0.06)",
    transition: "border 160ms ease, box-shadow 160ms ease, opacity 160ms ease",
    userSelect: "none",
  });

  return (
    <div
      onMouseEnter={() => setHoverTable(true)}
      onMouseLeave={() => setHoverTable(false)}
      style={{
        borderRadius: 16,
        width: minWidth + 6,
        height: "auto",
        overflow: "hidden",
        boxSizing: "border-box",
        position: "relative",
        zIndex: 1,
        background: `
          radial-gradient(1200px 320px at 15% -10%, rgba(79,220,255,0.10) 0%, rgba(79,220,255,0.04) 45%, rgba(79,220,255,0.02) 70%),
          linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.03) 22%, rgba(6,16,37,0.94) 100%)
        `,
        border: hoverTable ? "1px solid rgba(79,220,255,0.55)" : "1px solid rgba(79,220,255,0.32)",
        boxShadow: hoverTable
          ? "0 0 0 1px rgba(79,220,255,0.22), 0 18px 60px rgba(0,0,0,0.55), 0 0 30px rgba(79,220,255,0.22)"
          : "0 0 0 1px rgba(79,220,255,0.16), 0 18px 60px rgba(0,0,0,0.55), 0 0 22px rgba(79,220,255,0.16)",
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
              pointerEvents: "none",
              position: "absolute",
              inset: 0,
              background: `
                linear-gradient(
                  180deg,
                  transparent 0%,
                  rgba(75,212,246,0.28) 48%,
                  rgba(75,212,246,0.28) 52%,
                  transparent 72%
                )
              `,
              opacity: hoverHeader ? 0.9 : 0.55,
              transition: "opacity 180ms ease",
            }}
          />

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
                    color: "#eaf0ff",
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
            el.style.background = "rgba(79,220,255,0.06)";
            el.style.boxShadow = "inset 0 0 0 1px rgba(79,220,255,0.10)";
          };

          const applyRowNormal = (el: HTMLDivElement) => {
            el.style.background = "rgba(1,27,60,0.42)";
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
                  ? `
                    linear-gradient(90deg,
                      rgba(79,220,255,0.26) 0%,
                      rgba(79,220,255,0.14) 55%,
                      rgba(1,27,60,0.42) 100%
                    )
                  `
                  : "rgba(1,27,60,0.42)",
                borderBottom: "1px solid rgba(255,255,255,0.08)",
                color: "#e9f1ff",
                transition: "background 160ms ease, box-shadow 160ms ease",
                boxShadow: isHighlighted
                  ? "inset 0 0 0 1px rgba(79,220,255,0.26), 0 0 18px rgba(79,220,255,0.12)"
                  : "none",
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
                      fontSize: 12,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      textAlign: "center",
                      boxSizing: "border-box",
                      transition: "color 160ms ease, text-shadow 160ms ease",
                      position: "relative",
                    }}
                  >
                    {!isEditable ? (
                      txt
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
                          style={isStatus ? { ...selectCommon, ...pillStyle(tint, false) } : { ...fintexSelectStyleBase }}
                          onMouseEnter={(e) => {
                            if (!isStatus) return;
                            Object.assign((e.currentTarget as HTMLSelectElement).style, pillStyle(tint, true) as any);
                          }}
                          onMouseLeave={(e) => {
                            if (!isStatus) return;
                            Object.assign((e.currentTarget as HTMLSelectElement).style, pillStyle(tint, false) as any);
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
