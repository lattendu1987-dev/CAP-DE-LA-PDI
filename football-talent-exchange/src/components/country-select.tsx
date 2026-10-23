import { COUNTRIES } from "@/lib/domain/reference";

export function CountrySelect({ name, defaultValue, includeAny }: { name: string; defaultValue?: string; includeAny?: boolean }) {
  const sorted = [...COUNTRIES].sort((a, b) => a.name.localeCompare(b.name, "fr"));
  return (
    <select className="input" name={name} defaultValue={defaultValue ?? (includeAny ? "" : "CA")}>
      {includeAny && <option value="">Tous les pays</option>}
      {sorted.map((c) => (
        <option key={c.code} value={c.code}>{c.name}</option>
      ))}
    </select>
  );
}
