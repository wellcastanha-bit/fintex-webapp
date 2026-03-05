"use client";

import React, { useEffect, useRef, useState } from "react";
import PedidosClient, { type OrdersSourceItem } from "./components/pedidosclient";

export default function Page() {
  const [orders, setOrders] = useState<OrdersSourceItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // evita requests concorrentes
  const busyRef = useRef(false);

  async function loadOrders() {
    if (busyRef.current) return;
    busyRef.current = true;

    try {
      const r = await fetch("/api/orders", { cache: "no-store" });
      const j = await r.json().catch(() => null);

      if (r.ok && j?.ok) setOrders((j.rows ?? []) as OrdersSourceItem[]);
      else setOrders([]);
    } catch (e) {
      console.error("[PedidosPage] load failed:", e);
      setOrders([]);
    } finally {
      busyRef.current = false;
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrders(); // primeira carga

    // ✅ “quase tempo real” sem Supabase Realtime
    const t = setInterval(() => {
      loadOrders();
    }, 2000);

    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onRequestDelete(id: string) {
    if (!id) return;

    try {
      const r = await fetch(`/api/orders?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
        cache: "no-store",
      });

      const j = await r.json().catch(() => null);

      if (!r.ok || !j?.ok) {
        console.error("[PedidosPage] delete failed:", j?.error || r.statusText, j);
        return;
      }

      // ✅ recarrega do backend
      await loadOrders();
    } catch (e) {
      console.error("[PedidosPage] delete exception:", e);
    }
  }

  return (
    <>
      {loading ? (
        <div style={{ padding: 14, fontWeight: 900 }}>Carregando...</div>
      ) : (
        <PedidosClient orders={orders} onRequestDelete={onRequestDelete} />
      )}
    </>
  );
}
