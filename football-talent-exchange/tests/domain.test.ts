import { describe, expect, it } from "vitest";
import { ageOn, isMinor, birthDateRangeForAge } from "@/lib/domain/age";
import { completeness } from "@/lib/domain/completeness";
import { detectScam } from "@/lib/domain/scam";
import { priceCents } from "@/lib/domain/pricing";
import { parseVideoUrl, parseTimestamp, formatTimestamp, embedAt } from "@/lib/domain/video";
import { parseFilters, buildPlayerWhere, filtersToQueryString } from "@/lib/domain/search";
import { canRecruiterContact, isSubscriptionActive, autoVerifyRecruiter, dailyConversationLimit } from "@/lib/domain/rules";
import { slugify } from "@/lib/domain/slug";

const today = new Date(Date.UTC(2026, 9, 23));

describe("âge", () => {
  it("calcule l'âge avant et après l'anniversaire", () => {
    expect(ageOn(new Date(Date.UTC(2008, 9, 23)), today)).toBe(18);
    expect(ageOn(new Date(Date.UTC(2008, 9, 24)), today)).toBe(17);
    expect(isMinor(new Date(Date.UTC(2008, 9, 24)), today)).toBe(true);
  });
  it("produit une plage de dates cohérente", () => {
    const r = birthDateRangeForAge(18, 21, today);
    const inRange = (d: Date) => d >= r.gte! && d <= r.lte!;
    expect(inRange(new Date(Date.UTC(2008, 9, 23)))).toBe(true); // 18 ans
    expect(inRange(new Date(Date.UTC(2008, 9, 24)))).toBe(false); // 17 ans
    expect(inRange(new Date(Date.UTC(2004, 9, 24)))).toBe(true); // 21 ans
    expect(inRange(new Date(Date.UTC(2004, 9, 23)))).toBe(false); // 22 ans
  });
});

describe("complétude du profil", () => {
  it("vaut 100 quand tout est rempli", () => {
    const r = completeness({
      photoUrl: "x", bio: "x".repeat(100), heightCm: 180, weightKg: 75, foot: "LEFT", mainPosition: "AD",
      otherPositions: ["AG"], currentLevel: "AMATEUR", languages: ["fr"], careerCount: 1, statsCount: 1, videoCount: 1, momentCount: 1,
    });
    expect(r.score).toBe(100);
    expect(r.tips).toHaveLength(0);
  });
  it("donne des conseils quand c'est vide", () => {
    const r = completeness({ careerCount: 0, statsCount: 0, videoCount: 0, momentCount: 0 });
    expect(r.score).toBe(0);
    expect(r.tips.length).toBeGreaterThan(5);
  });
});

describe("détection d'arnaques", () => {
  it("repère les demandes de frais", () => {
    expect(detectScam("Pour l'essai il faut payer les frais d'essai de 500 €")).toContain("frais");
    expect(detectScam("Envoie 300 $ par Western Union pour ton visa")).toEqual(expect.arrayContaining(["paiement", "transfert-argent"]));
  });
  it("laisse passer un message normal", () => {
    expect(detectScam("Bonjour, nous aimerions t'inviter à un essai le 12 novembre au stade.")).toEqual([]);
    expect(detectScam("Réponds-moi, c'est urgent !")).toEqual([]);
  });
});

describe("tarifs", () => {
  it("applique la parité de pouvoir d'achat", () => {
    expect(priceCents("RECRUITER_PRO", "MONTH", "CA")).toBe(4900);
    expect(priceCents("PLAYER_PREMIUM", "MONTH", "SN")).toBe(300);
    expect(priceCents("PLAYER_PREMIUM", "YEAR", "CA")).toBe(9000);
  });
});

describe("vidéos", () => {
  it("reconnaît YouTube, Vimeo et les fichiers", () => {
    expect(parseVideoUrl("https://www.youtube.com/watch?v=abc123XYZ")?.embedUrl).toBe("https://www.youtube-nocookie.com/embed/abc123XYZ");
    expect(parseVideoUrl("https://youtu.be/abc123XYZ")?.provider).toBe("youtube");
    expect(parseVideoUrl("https://vimeo.com/123456")?.embedUrl).toBe("https://player.vimeo.com/video/123456");
    expect(parseVideoUrl("https://cdn.example.com/match.mp4")?.provider).toBe("file");
    expect(parseVideoUrl("http://youtube.com/watch?v=abc")).toBeNull();
    expect(parseVideoUrl("javascript:alert(1)")).toBeNull();
  });
  it("convertit les horodatages", () => {
    expect(parseTimestamp("1:23")).toBe(83);
    expect(parseTimestamp("1:02:03")).toBe(3723);
    expect(parseTimestamp("abc")).toBeNull();
    expect(formatTimestamp(83)).toBe("01:23");
    expect(embedAt({ provider: "youtube", embedUrl: "https://y/e/x" }, 10)).toContain("start=10");
  });
});

describe("recherche", () => {
  it("analyse et nettoie les paramètres", () => {
    const f = parseFilters({ position: "AD", foot: "LEFT", minAge: "18", maxAge: "abc", withVideo: "1", contract: "HACK" });
    expect(f).toMatchObject({ position: "AD", foot: "LEFT", minAge: 18, withVideo: true });
    expect(f.maxAge).toBeUndefined();
    expect(f.contract).toBeUndefined();
    expect(filtersToQueryString(f)).toContain("withVideo=1");
  });
  it("exclut toujours les mineurs sans consentement", () => {
    const where = JSON.stringify(buildPlayerWhere({}, today));
    expect(where).toContain("guardianConsentAt");
    expect(where).toContain("published");
  });
  it("cache les mineurs aux recruteurs non vérifiés", () => {
    const hidden = buildPlayerWhere({}, today) as { AND: Record<string, unknown>[] };
    const shown = buildPlayerWhere({}, today, { includeMinors: true }) as { AND: Record<string, unknown>[] };
    expect(hidden.AND.length).toBe(shown.AND.length + 1);
  });
});

describe("règles de contact", () => {
  const active = { plan: "RECRUITER_PRO", status: "ACTIVE", currentPeriodEnd: new Date(today.getTime() + 86400000) };
  const base = {
    recruiterSuspended: false, recruiterVerification: "PENDING", subscription: active, newConversationsToday: 0,
    playerIsMinor: false, guardianLinkedAndConsented: false, blocked: false, now: today,
  };
  it("autorise un recruteur abonné à contacter un majeur", () => {
    expect(canRecruiterContact(base).ok).toBe(true);
  });
  it("refuse sans abonnement", () => {
    expect(canRecruiterContact({ ...base, subscription: null }).ok).toBe(false);
    expect(isSubscriptionActive({ ...active, currentPeriodEnd: new Date(today.getTime() - 1) }, today)).toBe(false);
  });
  it("protège les mineurs", () => {
    expect(canRecruiterContact({ ...base, playerIsMinor: true }).ok).toBe(false);
    expect(canRecruiterContact({ ...base, playerIsMinor: true, recruiterVerification: "VERIFIED" }).ok).toBe(false);
    expect(canRecruiterContact({ ...base, playerIsMinor: true, recruiterVerification: "VERIFIED", guardianLinkedAndConsented: true }).ok).toBe(true);
  });
  it("applique la limite quotidienne et les blocages", () => {
    expect(canRecruiterContact({ ...base, newConversationsToday: 20 }).ok).toBe(false);
    expect(canRecruiterContact({ ...base, blocked: true }).ok).toBe(false);
    expect(dailyConversationLimit({ ...active, status: "TRIALING" }, today)).toBe(5);
  });
  it("vérifie automatiquement les courriels de club", () => {
    expect(autoVerifyRecruiter("scout@cfmontreal.com", "https://www.cfmontreal.com", "SCOUT")).toBe("VERIFIED");
    expect(autoVerifyRecruiter("scout@gmail.com", "https://gmail.com", "SCOUT")).toBe("PENDING");
    expect(autoVerifyRecruiter("a@club.com", "club.com", "AGENT")).toBe("PENDING");
    expect(autoVerifyRecruiter("a@evilclub.com", "club.com", "CLUB")).toBe("PENDING");
  });
});

describe("slug", () => {
  it("normalise les accents", () => {
    expect(slugify("Kévin N'Diaye Élan")).toBe("kevin-n-diaye-elan");
  });
});
