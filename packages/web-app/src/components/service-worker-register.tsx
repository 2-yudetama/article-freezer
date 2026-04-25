"use client";

import { useEffect } from "react";

/**
 * アプリ起動時に service worker を一度だけ登録する
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) {
      return;
    }

    // installability 判定に必要な service worker を登録する
    navigator.serviceWorker.register("/sw.js").catch((error) => {
      console.error("[PWA] Service worker registration failed", error);
    });
  }, []);

  return null;
}
