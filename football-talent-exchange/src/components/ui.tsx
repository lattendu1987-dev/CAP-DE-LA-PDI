import type { ReactNode } from "react";

export function Flash({ sp }: { sp: Record<string, string | string[] | undefined> }) {
  const err = typeof sp.erreur === "string" ? sp.erreur : null;
  const ok = typeof sp.ok === "string" ? sp.ok : null;
  if (!err && !ok) return null;
  return (
    <div role="status" className={`mb-5 rounded-xl border px-4 py-3 text-sm ${err ? "border-red-200 bg-red-50 text-red-800" : "border-pitch-100 bg-pitch-50 text-pitch-900"}`}>
      {err ?? ok}
    </div>
  );
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-gray-500">{hint}</span>}
    </label>
  );
}

export function Badge({ tone = "gray", children }: { tone?: "gray" | "green" | "gold" | "red" | "blue"; children: ReactNode }) {
  const tones = {
    gray: "bg-gray-100 text-gray-700",
    green: "bg-pitch-100 text-pitch-700",
    gold: "bg-amber-100 text-amber-800",
    red: "bg-red-100 text-red-700",
    blue: "bg-sky-100 text-sky-800",
  };
  return <span className={`badge ${tones[tone]}`}>{children}</span>;
}

export function Stat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-xl bg-gray-50 px-3 py-2">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-lg font-bold text-gray-900">{value}</div>
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-500">{children}</div>;
}

export function Avatar({ name, url, size = 56 }: { name: string; url?: string | null; size?: number }) {
  const initials = name.split(" ").map((s) => s[0]).join("").slice(0, 2).toUpperCase();
  return url ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={url} alt={name} width={size} height={size} className="rounded-full object-cover" style={{ width: size, height: size }} />
  ) : (
    <div className="grid shrink-0 place-items-center rounded-full bg-pitch-100 font-bold text-pitch-700" style={{ width: size, height: size }}>{initials}</div>
  );
}

export function Progress({ value }: { value: number }) {
  return (
    <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-200" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}>
      <div className="h-full rounded-full bg-pitch-500" style={{ width: `${value}%` }} />
    </div>
  );
}
