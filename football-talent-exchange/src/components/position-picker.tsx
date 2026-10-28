"use client";
import { useState } from "react";
import { POSITION_CODES } from "@/lib/domain/reference";

// Coordonnées sur le terrain (en %), attaque vers le haut.
const SPOTS: Record<string, [number, number]> = {
  GB: [50, 92], DG: [15, 74], DC: [50, 77], DD: [85, 74], MDC: [50, 62], MG: [15, 47], MC: [50, 50], MD: [85, 47],
  MOC: [50, 36], AG: [18, 22], BU: [50, 13], AD: [82, 22],
};

export interface PositionPickerText {
  help: string;
  mainLabel: string;
  otherLabel: string;
  none: string;
  labels: Record<string, string>;
}

export function PositionPicker({ main, others, text }: { main?: string | null; others: string[]; text: PositionPickerText }) {
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
      <p className="mb-2 text-xs text-gray-500">{text.help}</p>
      <div dir="ltr" className="relative mx-auto aspect-[3/4] w-full max-w-xs rounded-2xl border-4 border-white bg-gradient-to-b from-pitch-600 to-pitch-700 shadow-inner">
        <div className="absolute inset-x-0 top-1/2 h-0.5 bg-white/50" />
        <div className="absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/50" />
        <div className="absolute bottom-0 left-1/2 h-12 w-32 -translate-x-1/2 border-2 border-b-0 border-white/50" />
        <div className="absolute left-1/2 top-0 h-12 w-32 -translate-x-1/2 border-2 border-t-0 border-white/50" />
        {POSITION_CODES.map((code) => {
          const [x, y] = SPOTS[code];
          const isMain = mainPos === code;
          const isExtra = extra.includes(code);
          return (
            <button
              key={code}
              type="button"
              title={text.labels[code]}
              aria-label={text.labels[code]}
              aria-pressed={isMain || isExtra}
              onClick={() => click(code)}
              style={{ left: `${x}%`, top: `${y}%` }}
              className={`absolute grid h-10 w-10 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 text-[11px] font-bold transition ${
                isMain ? "border-white bg-pitch-900 text-white" : isExtra ? "border-white bg-pitch-100 text-pitch-900" : "border-white/70 bg-white/15 text-white hover:bg-white/30"
              }`}
            >
              {code}
            </button>
          );
        })}
      </div>
      <input type="hidden" name="mainPosition" value={mainPos ?? ""} />
      {extra.filter((e) => e !== mainPos).map((e) => (
        <input key={e} type="hidden" name="otherPositions" value={e} />
      ))}
      <p className="mt-2 text-center text-xs text-gray-600">
        {text.mainLabel} : <b>{(mainPos && text.labels[mainPos]) || text.none}</b>
        {extra.length > 0 && <> · {text.otherLabel} : {extra.filter((e) => e !== mainPos).join(", ")}</>}
      </p>
    </div>
  );
}
