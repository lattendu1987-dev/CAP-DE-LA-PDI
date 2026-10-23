// Pays où le paiement par mobile money (Flutterwave) est proposé.
// Taux indicatifs : unités de devise locale pour 1 $ US. Ajustables via la variable FX_RATES (JSON).

export interface MobileMoneyCountry {
  currency: string;
  option: string;
  operators: string;
}

export const MOBILE_MONEY: Record<string, MobileMoneyCountry> = {
  SN: { currency: "XOF", option: "mobilemoneyfranco", operators: "Orange Money, Wave, Free Money" },
  CI: { currency: "XOF", option: "mobilemoneyfranco", operators: "Orange Money, MTN, Moov, Wave" },
  ML: { currency: "XOF", option: "mobilemoneyfranco", operators: "Orange Money, Moov" },
  BF: { currency: "XOF", option: "mobilemoneyfranco", operators: "Orange Money, Moov" },
  BJ: { currency: "XOF", option: "mobilemoneyfranco", operators: "MTN, Moov" },
  TG: { currency: "XOF", option: "mobilemoneyfranco", operators: "Flooz, T-Money" },
  NE: { currency: "XOF", option: "mobilemoneyfranco", operators: "Airtel, Orange" },
  CM: { currency: "XAF", option: "mobilemoneyfranco", operators: "Orange Money, MTN MoMo" },
  GA: { currency: "XAF", option: "mobilemoneyfranco", operators: "Airtel Money, Moov" },
  CG: { currency: "XAF", option: "mobilemoneyfranco", operators: "MTN, Airtel" },
  GH: { currency: "GHS", option: "mobilemoneyghana", operators: "MTN, Vodafone Cash, AirtelTigo" },
  KE: { currency: "KES", option: "mpesa", operators: "M-Pesa" },
  UG: { currency: "UGX", option: "mobilemoneyuganda", operators: "MTN, Airtel" },
  TZ: { currency: "TZS", option: "mobilemoneytanzania", operators: "M-Pesa, Tigo Pesa, Airtel" },
  RW: { currency: "RWF", option: "mobilemoneyrwanda", operators: "MTN, Airtel" },
  ZM: { currency: "ZMW", option: "mobilemoneyzambia", operators: "MTN, Airtel" },
  NG: { currency: "NGN", option: "ussd,banktransfer,card", operators: "USSD, virement, carte" },
};

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
