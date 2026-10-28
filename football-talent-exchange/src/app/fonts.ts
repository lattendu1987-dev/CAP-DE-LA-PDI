import localFont from "next/font/local";

/**
 * Polices servies par le site lui-même, préchargées et avec une police de secours
 * aux mêmes proportions : pas de clignotement ni de saut de mise en page au chargement.
 */
export const archivo = localFont({
  src: [
    { path: "../../node_modules/@fontsource-variable/archivo/files/archivo-latin-wdth-normal.woff2", weight: "100 900", style: "normal" },
    { path: "../../node_modules/@fontsource-variable/archivo/files/archivo-latin-ext-wdth-normal.woff2", weight: "100 900", style: "normal" },
  ],
  declarations: [{ prop: "font-stretch", value: "62% 125%" }],
  variable: "--font-archivo",
  display: "swap",
  fallback: ["Arial", "system-ui", "sans-serif"],
  adjustFontFallback: "Arial",
});

export const instrumentSerif = localFont({
  src: [
    { path: "../../node_modules/@fontsource/instrument-serif/files/instrument-serif-latin-400-italic.woff2", weight: "400", style: "italic" },
    { path: "../../node_modules/@fontsource/instrument-serif/files/instrument-serif-latin-ext-400-italic.woff2", weight: "400", style: "italic" },
  ],
  variable: "--font-instrument",
  display: "swap",
  fallback: ["Georgia", "serif"],
  adjustFontFallback: "Times New Roman",
});

export const notoKufi = localFont({
  src: [{ path: "../../node_modules/@fontsource-variable/noto-kufi-arabic/files/noto-kufi-arabic-arabic-wght-normal.woff2", weight: "100 900", style: "normal" }],
  variable: "--font-kufi",
  display: "swap",
  preload: false, // chargée seulement quand une page arabe en a besoin
  fallback: ["Tahoma", "system-ui", "sans-serif"],
});
