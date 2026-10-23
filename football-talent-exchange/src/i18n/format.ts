import { INTL, type Locale } from "./config";

export function countryName(code: string | null | undefined, locale: Locale): string {
  if (!code) return "—";
  try {
    return new Intl.DisplayNames([INTL[locale]], { type: "region" }).of(code) ?? code;
  } catch {
    return code;
  }
}

export function formatDate(d: Date, locale: Locale, opts: Intl.DateTimeFormatOptions = { dateStyle: "medium" }) {
  return new Intl.DateTimeFormat(INTL[locale], opts).format(d);
}

export function formatUsd(cents: number, locale: Locale) {
  return new Intl.NumberFormat(INTL[locale], { style: "currency", currency: "USD", maximumFractionDigits: cents % 100 ? 2 : 0 }).format(cents / 100);
}
