// Données de démonstration. Mot de passe de tous les comptes : demo1234
import { PrismaClient, type CompetitionLevel, type Foot } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();
const yearsAgo = (y: number, extraDays = 0) => new Date(Date.UTC(new Date().getUTCFullYear() - y, 2, 15 + extraDays));

const PLAYERS: { first: string; last: string; age: number; country: string; nat: string[]; pos: string; other: string[]; foot: Foot; h: number; w: number; level: CompetitionLevel; free: boolean; goals: number; assists: number; video?: string }[] = [
  { first: "Moussa", last: "Diallo", age: 20, country: "SN", nat: ["SN"], pos: "AG", other: ["AD", "BU"], foot: "LEFT", h: 178, w: 70, level: "SEMI_PRO", free: true, goals: 14, assists: 9, video: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
  { first: "Lucas", last: "Tremblay", age: 22, country: "CA", nat: ["CA"], pos: "DC", other: ["MDC"], foot: "RIGHT", h: 189, w: 82, level: "UNIVERSITY", free: true, goals: 3, assists: 1 },
  { first: "Kévin", last: "Joseph", age: 19, country: "HT", nat: ["HT", "CA"], pos: "MOC", other: ["MC"], foot: "BOTH", h: 172, w: 66, level: "YOUTH_ACADEMY", free: true, goals: 8, assists: 12, video: "https://vimeo.com/76979871" },
  { first: "Yassine", last: "El Amrani", age: 24, country: "MA", nat: ["MA", "FR"], pos: "BU", other: [], foot: "RIGHT", h: 183, w: 78, level: "PRO_LOWER", free: false, goals: 17, assists: 4 },
  { first: "Thiago", last: "Silva Santos", age: 21, country: "BR", nat: ["BR"], pos: "GB", other: [], foot: "RIGHT", h: 191, w: 84, level: "SEMI_PRO", free: true, goals: 0, assists: 0 },
  { first: "Emeka", last: "Okafor", age: 23, country: "NG", nat: ["NG"], pos: "MDC", other: ["DC"], foot: "RIGHT", h: 184, w: 79, level: "PRO_LOWER", free: true, goals: 2, assists: 5 },
];

async function main() {
  const passwordHash = await bcrypt.hash("demo1234", 11);
  const far = new Date("2999-12-31");

  await db.user.upsert({ where: { email: "admin@fte.local" }, update: {}, create: { email: "admin@fte.local", passwordHash, name: "Admin FTE", role: "ADMIN" } });

  await db.user.upsert({
    where: { email: "scout@fte.local" },
    update: {},
    create: {
      email: "scout@fte.local", passwordHash, name: "Sophie Martin", role: "RECRUITER", country: "FR",
      recruiter: { create: { type: "SCOUT", organization: "FC Démo", website: "https://fc-demo.example", country: "FR", verification: "VERIFIED" } },
      subscription: { create: { plan: "RECRUITER_CLUB", status: "ACTIVE", currentPeriodEnd: new Date(Date.now() + 365 * 86400000) } },
    },
  });

  for (const [i, p] of PLAYERS.entries()) {
    const email = `${p.first.toLowerCase().normalize("NFD").replace(/[^a-z]/g, "")}@fte.local`;
    const slug = `${p.first}-${p.last}`.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-");
    if (await db.user.findUnique({ where: { email } })) continue;
    await db.user.create({
      data: {
        email, passwordHash, name: `${p.first} ${p.last}`, role: "PLAYER", country: p.country,
        subscription: { create: i === 0 ? { plan: "PLAYER_PREMIUM", status: "ACTIVE", currentPeriodEnd: new Date(Date.now() + 30 * 86400000), amountCents: 300 } : { plan: "FREE", status: "ACTIVE", currentPeriodEnd: far } },
        player: {
          create: {
            slug, firstName: p.first, lastName: p.last, birthDate: yearsAgo(p.age, i), country: p.country, nationalities: p.nat,
            languages: ["français"], otherPositions: p.other, relocationCountries: [], mainPosition: p.pos, foot: p.foot, heightCm: p.h, weightKg: p.w,
            currentLevel: p.level, contractStatus: p.free ? "FREE" : "UNDER_CONTRACT", willingToRelocate: true,
            featuredUntil: i === 0 ? new Date(Date.now() + 30 * 86400000) : null,
            bio: `Joueur ${p.pos === "GB" ? "calme et décisif dans les airs" : "travailleur, rapide et généreux dans l'effort"}. Je cherche un club ambitieux pour franchir un cap et progresser au plus haut niveau.`,
            career: { create: [{ club: `Académie ${p.country}`, kind: "ACADEMY", level: "YOUTH_ACADEMY", country: p.country, startYear: 2016 + i % 3, endYear: 2022 }, { club: `Club ${p.last}`, kind: "CLUB", level: p.level, country: p.country, startYear: 2022 }] },
            stats: { create: [{ season: "2025-26", club: `Club ${p.last}`, matches: 24, minutes: 1980, goals: p.goals, assists: p.assists, cleanSheets: p.pos === "GB" ? 11 : 0, saves: p.pos === "GB" ? 74 : 0, verified: i % 2 === 0 }] },
            videos: p.video ? { create: [{ title: "Highlights 2025", url: p.video, moments: { create: [{ seconds: 12, label: "Dribble et frappe" }, { seconds: 43, label: "Passe décisive" }] } }] } : undefined,
          },
        },
      },
    });
  }

  // Joueur mineur rattaché à un parent (consentement déjà donné).
  if (!(await db.user.findUnique({ where: { email: "parent@fte.local" } }))) {
    const parent = await db.user.create({ data: { email: "parent@fte.local", passwordHash, name: "Fatou Ndiaye", role: "GUARDIAN", country: "CA" } });
    await db.user.create({
      data: {
        email: "awa@fte.local", passwordHash, name: "Awa Ndiaye", role: "PLAYER", country: "CA",
        subscription: { create: { plan: "FREE", status: "ACTIVE", currentPeriodEnd: far } },
        player: {
          create: {
            slug: "awa-ndiaye", firstName: "Awa", lastName: "Ndiaye", birthDate: yearsAgo(16), country: "CA", nationalities: ["CA", "SN"], languages: ["français", "anglais"],
            otherPositions: ["AD"], relocationCountries: [], mainPosition: "MD", foot: "RIGHT", heightCm: 165, weightKg: 55, currentLevel: "YOUTH",
            guardianEmail: parent.email, guardianId: parent.id, guardianConsentAt: new Date(),
          },
        },
      },
    });
  }
  console.log("Données de démo prêtes. Comptes : admin@, scout@, moussa@, parent@, awa@fte.local — mot de passe demo1234");
}

main().finally(() => db.$disconnect());
