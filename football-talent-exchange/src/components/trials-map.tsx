"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";
import { directionsUrl } from "@/lib/domain/distance";

export interface MapTrial {
  id: string;
  title: string;
  lat: number;
  lng: number;
  when: string;
  place: string;
  org: string;
}

export interface TrialsMapText {
  plan: string;
  satellite: string;
  open: string;
  directions: string;
  you: string;
  label: string;
}


const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/**
 * Carte des détections : plan (OpenStreetMap) ou vue satellite, un repère par détection,
 * et le cercle de recherche autour du joueur quand il a partagé sa position.
 */
export function TrialsMap({ trials, center, radiusKm, text, height = 420 }: { trials: MapTrial[]; center?: { lat: number; lng: number } | null; radiusKm?: number; text: TrialsMapText; height?: number }) {
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let map: import("leaflet").Map | undefined;
    let cancelled = false;
    (async () => {
      const L = await import("leaflet");
      if (cancelled || !box.current) return;
      map = L.map(box.current, { scrollWheelZoom: false, attributionControl: true });
      const plan = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      });
      const satellite = L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
        maxZoom: 19,
        attribution: "Imagery &copy; Esri",
      });
      plan.addTo(map);
      L.control.layers({ [text.plan]: plan, [text.satellite]: satellite }, {}, { position: "topright" }).addTo(map);

      const pin = L.divIcon({ className: "trial-pin", html: "<span></span>", iconSize: [28, 28], iconAnchor: [14, 28], popupAnchor: [0, -26] });
      const points: [number, number][] = [];
      for (const t of trials) {
        points.push([t.lat, t.lng]);
        L.marker([t.lat, t.lng], { icon: pin, title: t.title })
          .addTo(map)
          .bindPopup(
            `<strong>${esc(t.title)}</strong><br>${esc(t.when)}<br>${esc(t.place)}<br><em>${esc(t.org)}</em><br>` +
              `<a href="/detections/${t.id}">${esc(text.open)}</a> · <a href="${directionsUrl(t.lat, t.lng)}" target="_blank" rel="noopener">${esc(text.directions)}</a>`,
          );
      }
      if (center) {
        points.push([center.lat, center.lng]);
        L.circleMarker([center.lat, center.lng], { radius: 8, color: "#fff", weight: 3, fillColor: "#2563eb", fillOpacity: 1 }).addTo(map).bindTooltip(text.you);
        if (radiusKm) L.circle([center.lat, center.lng], { radius: radiusKm * 1000, color: "#c9a45a", weight: 1.5, fillOpacity: 0.06 }).addTo(map);
      }
      if (center && radiusKm) map.fitBounds(L.latLng(center.lat, center.lng).toBounds(radiusKm * 2000), { padding: [16, 16] });
      else if (points.length > 1) map.fitBounds(points, { padding: [32, 32], maxZoom: 13 });
      else if (points.length === 1) map.setView(points[0], 13);
      else map.setView([14, 2], 2); // vue d'ensemble Afrique - Europe
    })();
    return () => {
      cancelled = true;
      map?.remove();
    };
  }, [trials, center, radiusKm, text]);

  return <div ref={box} role="region" aria-label={text.label} className="trials-map w-full overflow-hidden rounded-2xl border" style={{ height }} data-testid="trials-map" />;
}
