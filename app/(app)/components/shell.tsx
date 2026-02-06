"use client";

import React from "react";
import Sidebar from "./sidebar";
import Topbar from "./topbar";


export default function Shell({
  children,
  contentPadding = 40,
}: {
  children: React.ReactNode;
  contentPadding?: number;
}) {
  const TOPBAR_H = 76;

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <div style={{ height: TOPBAR_H, flex: "0 0 auto" }}>
        <Topbar />
      </div>

      <div style={{ flex: 1, minHeight: 0, display: "flex", overflow: "hidden" }}>
        <div style={{ flex: "0 0 auto" }}>
          <Sidebar />
        </div>

        <main
          style={{
            flex: 1,
            minWidth: 0,
            minHeight: 0,
            overflow: "auto",
            background: "transparent",

            // ✅ AQUI é o 40px padrão global
            padding: contentPadding,
            boxSizing: "border-box",
          }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
