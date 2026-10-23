"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { POSITIONS, LEVELS } from "@/lib/domain/reference";
import { parseTimestamp, parseVideoUrl } from "@/lib/domain/video";
import { FREE_VIDEO_LIMIT } from "@/lib/domain/pricing";
import { isPremiumPlayer } from "@/lib/domain/rules";

const back = (msg: string, err = false): never => redirect(`/joueur?${err ? "erreur" : "ok"}=${encodeURIComponent(msg)}`);

async function myPlayer() {
  const user = await requireUser(["PLAYER"]);
  if (!user.player) redirect("/");
  return { user, player: user.player };
}

const posCodes = POSITIONS.map((p) => p.code) as string[];
const levelCodes = LEVELS.map((l) => l.code) as string[];
const optInt = (min: number, max: number) =>
  z.preprocess((v) => (v === "" || v == null ? undefined : Number(v)), z.number().int().min(min).max(max).optional());
const list = (fd: FormData, k: string, max = 10) =>
  String(fd.get(k) ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, max);

export async function updateProfileAction(fd: FormData) {
  const { player } = await myPlayer();
  const schema = z.object({
    firstName: z.string().trim().min(1).max(60),
    lastName: z.string().trim().min(1).max(60),
    city: z.string().trim().max(80).optional(),
    country: z.string().length(2),
    photoUrl: z.string().trim().url().startsWith("https://").max(500).optional().or(z.literal("")),
    bio: z.string().trim().max(1500).optional(),
    heightCm: optInt(120, 230),
    weightKg: optInt(35, 150),
    foot: z.enum(["RIGHT", "LEFT", "BOTH"]).optional().or(z.literal("")),
    currentLevel: z.string().optional(),
    contractStatus: z.enum(["FREE", "UNDER_CONTRACT"]),
    contractEnd: z.string().optional(),
    availability: z.enum(["IMMEDIATE", "END_OF_SEASON", "TRIAL_ONLY", "NOT_AVAILABLE"]),
  });
  const r = schema.safeParse(Object.fromEntries(fd));
  if (!r.success) back(`Champ invalide : ${r.error!.issues[0].path.join(".")}`, true);
  const d = r.data!;
  const mainPosition = String(fd.get("mainPosition") ?? "");
  const otherPositions = fd.getAll("otherPositions").map(String).filter((p) => posCodes.includes(p) && p !== mainPosition).slice(0, 4);

  await db.playerProfile.update({
    where: { id: player.id },
    data: {
      firstName: d.firstName,
      lastName: d.lastName,
      city: d.city || null,
      country: d.country,
      photoUrl: d.photoUrl || null,
      bio: d.bio || null,
      heightCm: d.heightCm ?? null,
      weightKg: d.weightKg ?? null,
      foot: d.foot ? d.foot : null,
      mainPosition: posCodes.includes(mainPosition) ? mainPosition : null,
      otherPositions,
      currentLevel: d.currentLevel && levelCodes.includes(d.currentLevel) ? (d.currentLevel as never) : null,
      contractStatus: d.contractStatus,
      contractEnd: d.contractStatus === "UNDER_CONTRACT" && d.contractEnd ? new Date(d.contractEnd) : null,
      hasAgent: fd.get("hasAgent") === "on",
      availability: d.availability,
      willingToRelocate: fd.get("willingToRelocate") === "on",
      nationalities: list(fd, "nationalities", 3).map((s) => s.toUpperCase().slice(0, 2)),
      languages: list(fd, "languages", 8),
      relocationCountries: list(fd, "relocationCountries", 20).map((s) => s.toUpperCase().slice(0, 2)),
    },
  });
  revalidatePath("/joueur");
  back("Profil enregistré.");
}

export async function togglePublishedAction() {
  const { player } = await myPlayer();
  await db.playerProfile.update({ where: { id: player.id }, data: { published: !player.published } });
  back(player.published ? "Ton profil est maintenant masqué." : "Ton profil est de nouveau visible.");
}

export async function addCareerAction(fd: FormData) {
  const { player } = await myPlayer();
  const r = z
    .object({
      club: z.string().trim().min(1).max(120),
      kind: z.enum(["CLUB", "ACADEMY", "NATIONAL_TEAM", "REGIONAL_TEAM", "UNIVERSITY"]),
      level: z.string().optional(),
      country: z.string().max(2).optional(),
      startYear: z.coerce.number().int().min(1990).max(2100),
      endYear: optInt(1990, 2100),
      notes: z.string().trim().max(300).optional(),
    })
    .safeParse(Object.fromEntries(fd));
  if (!r.success) back("Vérifie le club et les années du parcours.", true);
  const d = r.data!;
  if (d.endYear && d.endYear < d.startYear) back("L'année de fin doit être après l'année de début.", true);
  if ((await db.careerEntry.count({ where: { playerId: player.id } })) >= 30) back("Maximum 30 étapes de parcours.", true);
  await db.careerEntry.create({
    data: {
      playerId: player.id, club: d.club, kind: d.kind, country: d.country || null, startYear: d.startYear, endYear: d.endYear ?? null, notes: d.notes || null,
      level: d.level && levelCodes.includes(d.level) ? (d.level as never) : null,
    },
  });
  back("Étape de parcours ajoutée.");
}

export async function deleteCareerAction(fd: FormData) {
  const { player } = await myPlayer();
  await db.careerEntry.deleteMany({ where: { id: String(fd.get("id")), playerId: player.id } });
  back("Étape supprimée.");
}

export async function addStatAction(fd: FormData) {
  const { player } = await myPlayer();
  const n = optInt(0, 10000);
  const r = z
    .object({
      season: z.string().trim().regex(/^\d{4}(-\d{2,4})?$/, "Saison au format 2025 ou 2025-26"),
      club: z.string().trim().min(1).max(120),
      matches: n, minutes: n, goals: n, assists: n, yellowCards: n, redCards: n, cleanSheets: n, saves: n,
    })
    .safeParse(Object.fromEntries(fd));
  if (!r.success) back(r.error!.issues[0].message.startsWith("Saison") ? r.error!.issues[0].message : "Vérifie les statistiques saisies.", true);
  const { season, club, ...nums } = r.data!;
  if ((await db.seasonStat.count({ where: { playerId: player.id } })) >= 30) back("Maximum 30 saisons.", true);
  await db.seasonStat.create({
    data: {
      playerId: player.id, season, club,
      ...Object.fromEntries(Object.entries(nums).map(([k, v]) => [k, v ?? 0])),
    },
  });
  back("Saison ajoutée. Elle apparaît comme « déclarée » jusqu'à vérification.");
}

export async function deleteStatAction(fd: FormData) {
  const { player } = await myPlayer();
  await db.seasonStat.deleteMany({ where: { id: String(fd.get("id")), playerId: player.id } });
  back("Saison supprimée.");
}

export async function addVideoAction(fd: FormData) {
  const { user, player } = await myPlayer();
  const url = String(fd.get("url") ?? "").trim();
  const title = String(fd.get("title") ?? "").trim().slice(0, 120) || "Vidéo";
  const kind = fd.get("kind") === "FULL_MATCH" ? "FULL_MATCH" : "HIGHLIGHTS";
  if (!parseVideoUrl(url)) back("Lien vidéo non reconnu. Utilise un lien YouTube, Vimeo ou un fichier .mp4 en https.", true);
  const count = await db.video.count({ where: { playerId: player.id } });
  const limit = isPremiumPlayer(user.subscription) ? 50 : FREE_VIDEO_LIMIT;
  if (count >= limit) back(`Limite de ${limit} vidéo(s) atteinte. Passe à Premium pour en ajouter d'autres.`, true);

  // Une ligne par moment : "01:12 But du gauche"
  const moments = String(fd.get("moments") ?? "")
    .split("\n")
    .map((line) => line.trim().match(/^(\d{1,2}(?::\d{1,2}){1,2})\s*[-–—:]?\s*(.+)$/))
    .filter((m): m is RegExpMatchArray => !!m)
    .map((m) => ({ seconds: parseTimestamp(m[1]), label: m[2].slice(0, 80) }))
    .filter((m): m is { seconds: number; label: string } => m.seconds !== null)
    .slice(0, 30);

  await db.video.create({ data: { playerId: player.id, url, title, kind, moments: { create: moments } } });
  back("Vidéo ajoutée.");
}

export async function deleteVideoAction(fd: FormData) {
  const { player } = await myPlayer();
  await db.video.deleteMany({ where: { id: String(fd.get("id")), playerId: player.id } });
  back("Vidéo supprimée.");
}
