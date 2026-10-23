import { LOCALES, LOCALE_NAMES } from "@/i18n/config";
import { getLocale, getMessages } from "@/i18n/server";
import { setLocaleAction } from "@/app/actions/locale";
import { AutoSubmitSelect } from "./auto-submit-select";

export async function LanguageSwitcher() {
  const [locale, m] = await Promise.all([getLocale(), getMessages()]);
  return (
    <form action={setLocaleAction} className="flex items-center gap-1">
      <label className="sr-only" htmlFor="lang">{m.common.language}</label>
      <span aria-hidden>🌐</span>
      <AutoSubmitSelect id="lang" name="locale" defaultValue={locale} className="rounded-lg border border-gray-200 bg-white px-1.5 py-1 text-xs">
        {LOCALES.map((l) => <option key={l} value={l}>{LOCALE_NAMES[l]}</option>)}
      </AutoSubmitSelect>
      <noscript><button className="btn-secondary btn-sm">OK</button></noscript>
    </form>
  );
}
