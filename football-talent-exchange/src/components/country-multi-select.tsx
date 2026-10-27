import { COUNTRY_CODES } from "@/lib/domain/reference";
import { countryName } from "@/i18n/format";
import type { Locale } from "@/i18n/config";

/** Choix de plusieurs pays (cases à cocher dans une liste qui défile). Aucun coché = tous. */
export function CountryMultiSelect({ name, locale, selected = [] }: { name: string; locale: Locale; selected?: string[] }) {
  const sorted = COUNTRY_CODES.map((c) => ({ code: c, name: countryName(c, locale) })).sort((a, b) => a.name.localeCompare(b.name, locale));
  return (
    <div className="max-h-44 overflow-y-auto rounded-xl border border-gray-200 p-2">
      <div className="grid grid-cols-2 gap-1 text-sm">
        {sorted.map((c) => (
          <label key={c.code} className="flex items-center gap-1.5 rounded px-1 py-0.5 hover:bg-gray-50">
            <input type="checkbox" name={name} value={c.code} defaultChecked={selected.includes(c.code)} /> {c.name}
          </label>
        ))}
      </div>
    </div>
  );
}
