import { COUNTRY_CODES } from "@/lib/domain/reference";
import { countryName } from "@/i18n/format";
import type { Locale } from "@/i18n/config";

export function CountrySelect({ name, locale, defaultValue, anyLabel }: { name: string; locale: Locale; defaultValue?: string; anyLabel?: string }) {
  const sorted = COUNTRY_CODES.map((c) => ({ code: c, name: countryName(c, locale) })).sort((a, b) => a.name.localeCompare(b.name, locale));
  return (
    <select className="input" name={name} defaultValue={defaultValue ?? (anyLabel ? "" : "CA")}>
      {anyLabel && <option value="">{anyLabel}</option>}
      {sorted.map((c) => (
        <option key={c.code} value={c.code}>{c.name}</option>
      ))}
    </select>
  );
}
