// Pays où le paiement par mobile money (Flutterwave) est proposé.
// Taux indicatifs : unités de devise locale pour 1 $ US. Ajustables via la variable FX_RATES (JSON).

export interface MobileMoneyCountry {
  currency: string;
  option: string;
  operators: string;
}

// Airtel Money est cité en premier là où il existe : c'est le moyen de paiement le plus répandu dans ces pays.
// La disponibilité exacte de chaque opérateur dépend du compte Flutterwave (à confirmer dans son tableau de bord).
export const MOBILE_MONEY: Record<string, MobileMoneyCountry> = {
  SN: { currency: "XOF", option: "mobilemoneyfranco", operators: "Orange Money, Wave, Free Money" },
  CI: { currency: "XOF", option: "mobilemoneyfranco", operators: "Orange Money, MTN Mobile Money, Moov Money, Wave" },
  ML: { currency: "XOF", option: "mobilemoneyfranco", operators: "Orange Money, Moov Money" },
  BF: { currency: "XOF", option: "mobilemoneyfranco", operators: "Orange Money, Moov Money" },
  BJ: { currency: "XOF", option: "mobilemoneyfranco", operators: "MTN Mobile Money, Moov Money" },
  TG: { currency: "XOF", option: "mobilemoneyfranco", operators: "Flooz, T-Money" },
  NE: { currency: "XOF", option: "mobilemoneyfranco", operators: "Airtel Money, Orange Money" },
  CM: { currency: "XAF", option: "mobilemoneyfranco", operators: "Orange Money, MTN Mobile Money" },
  GA: { currency: "XAF", option: "mobilemoneyfranco", operators: "Airtel Money, Moov Money" },
  CG: { currency: "XAF", option: "mobilemoneyfranco", operators: "Airtel Money, MTN Mobile Money" },
  TD: { currency: "XAF", option: "mobilemoneyfranco", operators: "Airtel Money, Moov Money" },
  GH: { currency: "GHS", option: "mobilemoneyghana", operators: "MTN Mobile Money, AirtelTigo Money, Telecel Cash" },
  KE: { currency: "KES", option: "mpesa", operators: "M-Pesa" },
  UG: { currency: "UGX", option: "mobilemoneyuganda", operators: "Airtel Money, MTN Mobile Money" },
  TZ: { currency: "TZS", option: "mobilemoneytanzania", operators: "Airtel Money, M-Pesa, Tigo Pesa" },
  RW: { currency: "RWF", option: "mobilemoneyrwanda", operators: "Airtel Money, MTN Mobile Money" },
  ZM: { currency: "ZMW", option: "mobilemoneyzambia", operators: "Airtel Money, MTN Mobile Money" },
  NG: { currency: "NGN", option: "ussd,banktransfer,card", operators: "USSD, virement, carte" },
};

/** Liste des opérateurs, pour les afficher séparément. */
export function operatorList(mm: MobileMoneyCountry): string[] {
  return mm.operators.split(",").map((o) => o.trim()).filter(Boolean);
}

export const DEFAULT_FX: Record<string, number> = {
  XOF: 600, XAF: 600, GHS: 15, KES: 130, UGX: 3700, TZS: 2600, RWF: 1400, ZMW: 26, NGN: 1600,
};

export function fxRates(env: string | undefined = process.env.FX_RATES): Record<string, number> {
  if (!env) return DEFAULT_FX;
  try {
    return { ...DEFAULT_FX, ...(JSON.parse(env) as Record<string, number>) };
  } catch {
    return DEFAULT_FX;
  }
}

/** Montant en devise locale (unités entières), arrondi à un prix « rond ». */
export function localAmount(usdCents: number, currency: string, rates = fxRates()): number {
  const rate = rates[currency];
  if (!rate) throw new Error(`Devise non prise en charge : ${currency}`);
  const raw = (usdCents / 100) * rate;
  const step = raw >= 10000 ? 100 : raw >= 1000 ? 50 : raw >= 100 ? 5 : 1;
  return Math.max(step, Math.round(raw / step) * step);
}

export function formatLocal(amount: number, currency: string, intlLocale = "fr-FR") {
  return new Intl.NumberFormat(intlLocale, { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
}
