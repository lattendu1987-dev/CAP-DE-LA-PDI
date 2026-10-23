"use client";
import { useState } from "react";
import { POSITIONS } from "@/lib/domain/reference";

// Coordonnées sur le terrain (en %), attaque vers le haut.
const SPOTS: Record<string, [number, number]> = {
  GB: [50, 92], DG: [15, 74], DC: [50, 77], DD: [85, 74], MDC: [50, 62], MG: [15, 47], MC: [50, 50], MD: [85, 47],
  MOC: [50, 36], AG: [18, 22], BU: [50, 13], AD: [82, 22],
};

export function PositionPicker({ main, others }: { main?: string | null; others: string[] }) {
  const [mainPos, setMain] = useState<string | null>(main ?? null);
  const [extra, setExtra] = useState<string[]>(others);

  function click(code: string) {
    if (!mainPos) return setMain(code);
    if (code === mainPos) {
      setMain(null);
      return;
    }
    setExtra((e) => (e.includes(code) ? e.filter((x) => x !== code) : [...e, code].slice(0, 4)));
  }

  return (
    <div>
      <p className="mb-2 text-xs text-gray-500">Touche un poste pour le choisir comme <b>principal</b> (vert foncé), puis d&apos;autres pour les postes <b>secondaires</b> (vert clair, 4 max).</p>
      <div className="relative mx-auto aspect-[3/4] w-full max-w-xs rounded-2xl border-4 border-white bg-gradient-to-b from-pitch-600 to-pitch-700 shadow-inner">
        <div className="absolute inset-x-0 top-1/2 h-0.5 bg-white/50" />
        <div className="absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/50" />
        <div className="absolute bottom-0 left-1/2 h-12 w-32 -translate-x-1/2 border-2 border-b-0 border-white/50" />
        <div className="absolute left-1/2 top-0 h-12 w-32 -translate-x-1/2 border-2 border-t-0 border-white/50" />
        {POSITIONS.map((p) => {
          const [x, y] = SPOTS[p.code];
          const isMain = mainPos === p.code;
          const isExtra = extra.includes(p.code);
          return (
            <button
              key={p.code}
              type="button"
              title={p.label}
              aria-pressed={isMain || isExtra}
              onClick={() => click(p.code)}
              style={{ left: `${x}%`, top: `${y}%` }}
              className={`absolute grid h-10 w-10 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 text-[11px] font-bold transition ${
                isMain ? "border-white bg-pitch-900 text-white" : isExtra ? "border-white bg-pitch-100 text-pitch-900" : "border-white/70 bg-white/15 text-white hover:bg-white/30"
              }`}
            >
              {p.code}
            </button>
          );
        })}
      </div>
      <input type="hidden" name="mainPosition" value={mainPos ?? ""} />
      {extra.filter((e) => e !== mainPos).map((e) => (
        <input key={e} type="hidden" name="otherPositions" value={e} />
      ))}
      <p className="mt-2 text-center text-xs text-gray-600">
        Principal : <b>{POSITIONS.find((p) => p.code === mainPos)?.label ?? "aucun"}</b>
        {extra.length > 0 && <> · Secondaires : {extra.filter((e) => e !== mainPos).join(", ")}</>}
      </p>
    </div>
  );
}
