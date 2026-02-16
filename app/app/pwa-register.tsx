"use client";

import { useEffect } from "react";

export default function PWARegister() {
  useEffect(() => {
    // Só em produção
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    (async () => {
      try {
        const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });

        // força atualização do SW quando houver deploy novo
        await reg.update();

        // opcional: log
        // console.log("[PWA] SW registrado:", reg.scope);
      } catch (err) {
        console.error("[PWA] Falha ao registrar SW:", err);
      }
    })();
  }, []);

  return null;
}
