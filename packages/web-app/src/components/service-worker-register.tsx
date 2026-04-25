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
    void navigator.serviceWorker.register("/pwa/sw.js");
  }, []);

  return null;
}
