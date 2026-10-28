export const LOCALES = ["fr", "en", "es", "pt", "ar"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "fr";

export const LOCALE_NAMES: Record<Locale, string> = {
  fr: "Français",
  en: "English",
  es: "Español",
  pt: "Português",
  ar: "العربية",
};

export const RTL: Locale[] = ["ar"];

/** Locale BCP 47 utilisée pour les dates et noms de pays. */
export const INTL: Record<Locale, string> = { fr: "fr-FR", en: "en-GB", es: "es-ES", pt: "pt-BR", ar: "ar" };

export function isLocale(v: unknown): v is Locale {
  return typeof v === "string" && (LOCALES as readonly string[]).includes(v);
}

/** Choisit la meilleure langue à partir de l'en-tête Accept-Language. */
export function pickLocale(acceptLanguage: string | null | undefined): Locale {
  if (!acceptLanguage) return DEFAULT_LOCALE;
  const ranked = acceptLanguage
    .split(",")
    .map((part) => {
      const [tag, q] = part.trim().split(";q=");
      return { lang: tag.toLowerCase().split("-")[0], q: q ? Number(q) : 1 };
    })
    .sort((a, b) => b.q - a.q);
  for (const r of ranked) if (isLocale(r.lang)) return r.lang;
  return DEFAULT_LOCALE;
}
