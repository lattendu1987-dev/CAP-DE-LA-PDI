"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export interface NearMeText {
  nearMe: string;
  locating: string;
  denied: string;
}

/** Demande la position du téléphone (avec accord) et affiche les détections autour du joueur. */
export function NearMeButton({ text }: { text: NearMeText }) {
  const router = useRouter();
  const sp = useSearchParams();
  const [state, setState] = useState<"idle" | "busy" | "denied">("idle");

  function locate() {
    if (!("geolocation" in navigator)) return setState("denied");
    setState("busy");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const q = new URLSearchParams(sp.toString());
        q.set("lat", pos.coords.latitude.toFixed(4));
        q.set("lng", pos.coords.longitude.toFixed(4));
        q.delete("ville");
        q.delete("country");
        if (!q.get("rayon")) q.set("rayon", "100");
        router.push(`/detections?${q.toString()}`);
        setState("idle");
      },
      () => setState("denied"),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 600000 },
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <button type="button" onClick={locate} disabled={state === "busy"} className="btn-primary" data-testid="near-me">
        📍 {state === "busy" ? text.locating : text.nearMe}
      </button>
      {state === "denied" && <p role="status" className="text-xs text-red-700">{text.denied}</p>}
    </div>
  );
}
