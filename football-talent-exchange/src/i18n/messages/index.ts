import type { Locale } from "../config";
import fr, { type Messages } from "./fr";
import en from "./en";
import es from "./es";
import pt from "./pt";
import ar from "./ar";

// Chaque langue doit respecter exactement le type Messages (vérifié par TypeScript).
export const dictionaries: Record<Locale, Messages> = { fr, en, es, pt, ar };
export type { Messages };
