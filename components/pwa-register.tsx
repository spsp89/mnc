"use client";

import { useEffect } from "react";

export function PwaRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator) || process.env.NODE_ENV !== "production") return;

    const localHostnames = new Set(["localhost", "127.0.0.1", "::1"]);
    if (localHostnames.has(window.location.hostname)) {
      // Production-mode local builds are replaced frequently. Keeping an old
      // document cache here can reference asset hashes from the previous build.
      void navigator.serviceWorker.getRegistrations().then((registrations) =>
        Promise.all(registrations.map((registration) => registration.unregister())),
      );
      if ("caches" in window) {
        void caches.keys().then((keys) =>
          Promise.all(keys.filter((key) => key.startsWith("bnc-shell-")).map((key) => caches.delete(key))),
        );
      }
      return;
    }

    navigator.serviceWorker.register("/sw.js", { updateViaCache: "none" }).catch(() => {
      // The site remains fully usable when service-worker registration is unavailable.
    });
  }, []);

  return null;
}
