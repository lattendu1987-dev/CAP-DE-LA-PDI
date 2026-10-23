import { describe, expect, it } from "vitest";
import { commissionFor, availableAtFrom, normalizeReferralCode, newReferralCode, REFERRAL_RATE } from "@/lib/domain/referral";
import { localAmount, fxRates, MOBILE_MONEY } from "@/lib/domain/mobile-money";
import { eligibleAge, isOpen, validTrialDates } from "@/lib/domain/trials";
import { ownsKey, MEDIA_RULES } from "@/lib/domain/media";
import { parseVideoUrl } from "@/lib/domain/video";
import { pickLocale, isLocale } from "@/i18n/config";
import { detectScam } from "@/lib/domain/scam";

describe("parrainage", () => {
  const signup = new Date(Date.UTC(2026, 0, 15));
  it("verse 20 % pendant 12 mois", () => {
    expect(REFERRAL_RATE).toBe(0.2);
    expect(commissionFor(4900, signup, new Date(Date.UTC(2026, 5, 1)))).toBe(980);
    expect(commissionFor(4900, signup, new Date(Date.UTC(2027, 0, 16)))).toBe(0);
    expect(commissionFor(0, signup, signup)).toBe(0);
  });
  it("bloque la commission 30 jours", () => {
    expect(availableAtFrom(signup).getTime() - signup.getTime()).toBe(30 * 86400000);
  });
  it("valide les codes", () => {
    expect(normalizeReferralCode(" ab12cd34 ")).toBe("AB12CD34");
    expect(normalizeReferralCode("x")).toBeNull();
    expect(normalizeReferralCode("<script>")).toBeNull();
    expect(newReferralCode()).toMatch(/^[A-Z2-9]{8}$/);
  });
});

describe("mobile money", () => {
  it("convertit en prix ronds en devise locale", () => {
    const rates = fxRates(undefined);
    expect(localAmount(300, "XOF", rates)).toBe(1800); // 3 $ -> 1800 FCFA
    expect(localAmount(1700, "XOF", rates) % 50).toBe(0);
    expect(localAmount(300, "KES", rates)).toBe(390);
  });
  it("accepte des taux personnalisés", () => {
    expect(fxRates('{"XOF":650}').XOF).toBe(650);
    expect(fxRates("pas du json").XOF).toBe(600);
  });
  it("couvre l'Afrique francophone et anglophone", () => {
    for (const c of ["SN", "CI", "CM", "GH", "KE"]) expect(MOBILE_MONEY[c]).toBeDefined();
    expect(MOBILE_MONEY.FR).toBeUndefined();
  });
});

describe("détections", () => {
  const trial = { minAge: 16, maxAge: 19, startsAt: new Date(Date.UTC(2026, 11, 1)), deadline: new Date(Date.UTC(2026, 10, 20)) };
  it("vérifie l'âge au jour de la détection", () => {
    expect(eligibleAge(trial, new Date(Date.UTC(2009, 0, 1)))).toBe(true); // 17 ans
    expect(eligibleAge(trial, new Date(Date.UTC(2005, 0, 1)))).toBe(false); // 21 ans
    expect(eligibleAge({ ...trial, minAge: null, maxAge: null }, new Date(Date.UTC(1990, 0, 1)))).toBe(true);
  });
  it("ferme après la date limite", () => {
    expect(isOpen(trial, new Date(Date.UTC(2026, 10, 1)))).toBe(true);
    expect(isOpen(trial, new Date(Date.UTC(2026, 10, 21)))).toBe(false);
    expect(validTrialDates(trial.startsAt, trial.deadline, new Date(Date.UTC(2026, 9, 1)))).toBe(true);
    expect(validTrialDates(trial.deadline, trial.startsAt, new Date(Date.UTC(2026, 9, 1)))).toBe(false);
  });
});

describe("fichiers envoyés", () => {
  it("n'accepte que les clés de l'utilisateur", () => {
    expect(ownsKey("u/abc123/video/xYz_-9.mp4", "abc123", "video")).toBe(true);
    expect(ownsKey("u/other/video/x.mp4", "abc123", "video")).toBe(false);
    expect(ownsKey("u/abc123/photo/x.jpg", "abc123", "video")).toBe(false);
    expect(ownsKey("u/abc123/video/../../etc.mp4", "abc123", "video")).toBe(false);
  });
  it("lit les vidéos stockées localement", () => {
    expect(parseVideoUrl("/api/media/u/abc/video/k-1.mov")?.provider).toBe("file");
    expect(parseVideoUrl("/api/media/../secret")).toBeNull();
    expect(MEDIA_RULES.video.types["video/quicktime"]).toBe("mov");
  });
});

describe("langues", () => {
  it("choisit la langue du navigateur", () => {
    expect(pickLocale("pt-BR,pt;q=0.9,en;q=0.8")).toBe("pt");
    expect(pickLocale("de-DE,ar;q=0.5")).toBe("ar");
    expect(pickLocale("de-DE")).toBe("fr");
    expect(pickLocale(null)).toBe("fr");
    expect(isLocale("es")).toBe(true);
    expect(isLocale("xx")).toBe(false);
  });
  it("détecte les arnaques dans plusieurs langues", () => {
    expect(detectScam("Para la prueba debes pagar la inscripción")).not.toEqual([]);
    expect(detectScam("يجب دفع رسوم التجربة")).not.toEqual([]);
    expect(detectScam("You must pay the trial fee of 200 USD")).not.toEqual([]);
  });
});

import { dictionaries } from "@/i18n/messages";

describe("dictionnaires", () => {
  // Compare la forme (clés, longueurs de listes, types) de chaque langue avec le français.
  const shape = (v: unknown): unknown =>
    Array.isArray(v) ? v.map(shape) : v && typeof v === "object" ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, shape(x)])) : typeof v;
  for (const lang of ["en", "es", "pt", "ar"] as const) {
    it(`${lang} a exactement les mêmes textes que le français`, () => {
      expect(shape(dictionaries[lang])).toEqual(shape(dictionaries.fr));
    });
  }
});
