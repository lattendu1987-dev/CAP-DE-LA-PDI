import "server-only";
import { cookies, headers } from "next/headers";
import { cache } from "react";
import { DEFAULT_LOCALE, isLocale, pickLocale, type Locale } from "./config";
import { dictionaries } from "./messages";

export const LOCALE_COOKIE = "fte_lang";

export const getLocale = cache(async (): Promise<Locale> => {
  const fromCookie = (await cookies()).get(LOCALE_COOKIE)?.value;
  if (isLocale(fromCookie)) return fromCookie;
  return pickLocale((await headers()).get("accept-language"));
});

export async function getMessages() {
  return dictionaries[await getLocale()];
}

export function messagesFor(locale: string | null | undefined) {
  return dictionaries[isLocale(locale) ? locale : DEFAULT_LOCALE];
}
