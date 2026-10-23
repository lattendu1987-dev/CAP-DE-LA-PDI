"use client";
import { useEffect, useState } from "react";

export interface PushText {
  title: string;
  text: string;
  enable: string;
  disable: string;
  enabled: string;
  denied: string;
  unsupported: string;
  iosInstall: string;
}

function urlBase64ToUint8Array(base64: string) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

/** Bouton pour activer / désactiver les notifications sur cet appareil. */
export function PushToggle({ publicKey, text, compact = false }: { publicKey: string; text: PushText; compact?: boolean }) {
  const [state, setState] = useState<"loading" | "unsupported" | "ios" | "denied" | "off" | "on">("loading");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
      const standalone = window.matchMedia("(display-mode: standalone)").matches;
      if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
        setState(ios && !standalone ? "ios" : "unsupported");
        return;
      }
      if (Notification.permission === "denied") return setState("denied");
      const reg = await navigator.serviceWorker.register("/sw.js");
      const sub = await reg.pushManager.getSubscription();
      setState(sub ? "on" : "off");
    })().catch(() => setState("unsupported"));
  }, []);

  async function enable() {
    setBusy(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") return setState(permission === "denied" ? "denied" : "off");
      const reg = await navigator.serviceWorker.ready;
      const sub = (await reg.pushManager.getSubscription()) ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(publicKey) }));
      const res = await fetch("/api/push", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(sub.toJSON()) });
      setState(res.ok ? "on" : "off");
    } catch {
      setState("off");
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/push", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ endpoint: sub.endpoint }) });
        await sub.unsubscribe();
      }
      setState("off");
    } finally {
      setBusy(false);
    }
  }

  if (state === "loading" || (compact && (state === "on" || state === "unsupported" || state === "denied"))) return null;
  return (
    <div className={compact ? "rounded-xl border border-pitch-100 bg-pitch-50 p-4" : ""} data-testid="push-toggle">
      <p className="font-semibold">🔔 {text.title}</p>
      <p className="text-sm text-gray-600">{state === "ios" ? text.iosInstall : state === "denied" ? text.denied : state === "unsupported" ? text.unsupported : text.text}</p>
      {state === "off" && <button type="button" disabled={busy} onClick={enable} className="btn-primary btn-sm mt-2">{text.enable}</button>}
      {state === "on" && (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-pitch-700">{text.enabled}</span>
          <button type="button" disabled={busy} onClick={disable} className="btn-secondary btn-sm">{text.disable}</button>
        </div>
      )}
    </div>
  );
}
