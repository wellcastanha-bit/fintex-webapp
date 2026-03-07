"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import PedidosClient, { type OrdersSourceItem } from "./components/pedidosclient";

export default function Page() {
  const [orders, setOrders] = useState<OrdersSourceItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const busyRef = useRef(false);
  const mountedRef = useRef(false);

  // guarda os ids já vistos para tocar som só em pedido novo
  const knownIdsRef = useRef<Set<string>>(new Set());

  // áudio
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const playCashSound = useCallback(() => {
    try {
      if (!audioRef.current) {
        audioRef.current = new Audio("/sounds/cash.mp3");
        audioRef.current.preload = "auto";
      }

      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {
        // navegador pode bloquear autoplay até o usuário interagir
      });
    } catch (e) {
      console.error("[PedidosPage] sound failed:", e);
    }
  }, []);

  const loadOrders = useCallback(async () => {
    if (busyRef.current) return;
    busyRef.current = true;

    try {
      const r = await fetch("/api/orders", {
        method: "GET",
        cache: "no-store",
      });

      const j = await r.json().catch(() => null);

      console.log("[PedidosPage] GET /api/orders status:", r.status);
      console.log("[PedidosPage] GET /api/orders body:", j);

      if (!mountedRef.current) return;

      if (r.ok && j?.ok) {
        const nextOrders = Array.isArray(j.rows)
          ? (j.rows as OrdersSourceItem[])
          : [];

        const nextIds = new Set(
          nextOrders.map((o) => String(o?.id ?? "")).filter(Boolean)
        );

        // primeira carga: só registra, sem tocar som
        if (knownIdsRef.current.size === 0) {
          knownIdsRef.current = nextIds;
        } else {
          let hasNewOrder = false;

          for (const id of nextIds) {
            if (!knownIdsRef.current.has(id)) {
              hasNewOrder = true;
              break;
            }
          }

          if (hasNewOrder) {
            playCashSound();
          }

          knownIdsRef.current = nextIds;
        }

        setOrders(nextOrders);
      } else {
        setOrders([]);
      }
    } catch (e) {
      console.error("[PedidosPage] load failed:", e);
      if (mountedRef.current) setOrders([]);
    } finally {
      busyRef.current = false;
      if (mountedRef.current) setLoading(false);
    }
  }, [playCashSound]);

  useEffect(() => {
    mountedRef.current = true;

    loadOrders();

    const t = setInterval(() => {
      loadOrders();
    }, 2000);

    return () => {
      mountedRef.current = false;
      clearInterval(t);
    };
  }, [loadOrders]);

  async function onRequestDelete(id: string) {
    if (!id) return;

    try {
      const r = await fetch(`/api/orders?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
        cache: "no-store",
      });

      const j = await r.json().catch(() => null);

      console.log("[PedidosPage] DELETE /api/orders status:", r.status);
      console.log("[PedidosPage] DELETE /api/orders body:", j);

      if (!r.ok || !j?.ok) {
        console.error("[PedidosPage] delete failed:", j?.error || r.statusText, j);
        return;
      }

      await loadOrders();
    } catch (e) {
      console.error("[PedidosPage] delete exception:", e);
    }
  }

  return loading ? (
    <div style={{ padding: 14, fontWeight: 900 }}>Carregando...</div>
  ) : (
    <PedidosClient orders={orders} onRequestDelete={onRequestDelete} />
  );
}