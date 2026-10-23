"use server";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { isMinor } from "@/lib/domain/age";
import { autoVerifyRecruiter, canRecruiterContact } from "@/lib/domain/rules";
import { postMessage } from "@/lib/messaging";
import { audit } from "@/lib/audit";

const go = (path: string, msg: string, err = false): never => redirect(`${path}${path.includes("?") ? "&" : "?"}${err ? "erreur" : "ok"}=${encodeURIComponent(msg)}`);

async function me() {
  const user = await requireUser(["RECRUITER"]);
  if (!user.recruiter) redirect("/");
  return { user, recruiter: user.recruiter };
}

async function playerPath(playerId: string) {
  const p = await db.playerProfile.findUnique({ where: { id: playerId }, select: { slug: true } });
  return p ? `/joueurs/${p.slug}` : "/recruteur/recherche";
}

export async function startConversationAction(fd: FormData) {
  const { user, recruiter } = await me();
  const playerId = String(fd.get("playerId"));
  const body = String(fd.get("body") ?? "").trim();
  const path = await playerPath(playerId);
  if (body.length < 20 || body.length > 3000) go(path, "Ton message doit contenir entre 20 et 3000 caractères.", true);

  const player = await db.playerProfile.findUnique({ where: { id: playerId }, include: { user: true } });
  if (!player || !player.published || player.user.suspended) go("/recruteur/recherche", "Joueur introuvable.", true);
  const p = player!;
  const minor = isMinor(p.birthDate);

  // Conversation existante : on ajoute simplement le message.
  const existing = await db.conversation.findFirst({ where: { playerId: p.id, participants: { some: { userId: user.id } } } });
  const startOfDay = new Date();
  startOfDay.setUTCHours(0, 0, 0, 0);
  const blocked = !!(await db.block.findFirst({ where: { blockedId: user.id, blockerId: { in: [p.userId, p.guardianId ?? ""] } } }));
  const decision = canRecruiterContact({
    recruiterSuspended: user.suspended,
    recruiterVerification: recruiter.verification,
    subscription: user.subscription,
    newConversationsToday: existing ? 0 : await db.conversation.count({ where: { createdAt: { gte: startOfDay }, participants: { some: { userId: user.id } } } }),
    playerIsMinor: minor,
    guardianLinkedAndConsented: !!p.guardianId && !!p.guardianConsentAt,
    blocked,
  });
  if (!decision.ok) go(path, decision.reason, true);

  let conversationId = existing?.id;
  if (!conversationId) {
    const ids = [user.id, p.userId, ...(minor && p.guardianId ? [p.guardianId] : [])];
    const conv = await db.conversation.create({ data: { playerId: p.id, participants: { create: ids.map((userId) => ({ userId })) } } });
    conversationId = conv.id;
    await audit(user.id, "conversation.start", { playerId: p.id, minor });
  }
  await postMessage(conversationId, user.id, body);
  redirect(`/messages/${conversationId}`);
}

export async function addToShortlistAction(fd: FormData) {
  const { recruiter } = await me();
  const playerId = String(fd.get("playerId"));
  const path = await playerPath(playerId);
  let shortlistId = String(fd.get("shortlistId") ?? "");
  if (!shortlistId) {
    const name = String(fd.get("newName") ?? "").trim().slice(0, 80) || "Ma liste";
    if ((await db.shortlist.count({ where: { recruiterId: recruiter.id } })) >= 50) go(path, "Maximum 50 listes.", true);
    shortlistId = (await db.shortlist.create({ data: { recruiterId: recruiter.id, name } })).id;
  } else if (!(await db.shortlist.findFirst({ where: { id: shortlistId, recruiterId: recruiter.id } }))) {
    go(path, "Liste introuvable.", true);
  }
  await db.shortlistItem.upsert({ where: { shortlistId_playerId: { shortlistId, playerId } }, create: { shortlistId, playerId }, update: {} });
  go(path, "Joueur ajouté à la liste.");
}

export async function removeFromShortlistAction(fd: FormData) {
  const { recruiter } = await me();
  await db.shortlistItem.deleteMany({ where: { id: String(fd.get("id")), shortlist: { recruiterId: recruiter.id } } });
  go("/recruteur/listes", "Joueur retiré de la liste.");
}

export async function deleteShortlistAction(fd: FormData) {
  const { recruiter } = await me();
  await db.shortlist.deleteMany({ where: { id: String(fd.get("id")), recruiterId: recruiter.id } });
  go("/recruteur/listes", "Liste supprimée.");
}

export async function saveEvaluationAction(fd: FormData) {
  const { recruiter } = await me();
  const n = z.coerce.number().int().min(1).max(10);
  const r = z.object({ playerId: z.string(), technical: n, physical: n, tactical: n, mental: n, comment: z.string().max(2000).optional() }).safeParse(Object.fromEntries(fd));
  if (!r.success) go("/recruteur/recherche", "Évaluation invalide.", true);
  const { playerId, comment, ...scores } = r.data!;
  const path = await playerPath(playerId);
  await db.evaluation.upsert({
    where: { recruiterId_playerId: { recruiterId: recruiter.id, playerId } },
    create: { recruiterId: recruiter.id, playerId, ...scores, comment: comment || null },
    update: { ...scores, comment: comment || null },
  });
  go(path, "Évaluation enregistrée.");
}

export async function saveSearchAction(fd: FormData) {
  const { recruiter } = await me();
  const query = String(fd.get("query") ?? "").slice(0, 1000);
  const name = String(fd.get("name") ?? "").trim().slice(0, 80) || "Ma recherche";
  if ((await db.savedSearch.count({ where: { recruiterId: recruiter.id } })) >= 20) go(`/recruteur/recherche?${query}`, "Maximum 20 recherches sauvegardées.", true);
  await db.savedSearch.create({ data: { recruiterId: recruiter.id, name, query } });
  go(`/recruteur/recherche?${query}`, "Recherche sauvegardée. Tu recevras un courriel quand un nouveau joueur correspond.");
}

export async function deleteSavedSearchAction(fd: FormData) {
  const { recruiter } = await me();
  await db.savedSearch.deleteMany({ where: { id: String(fd.get("id")), recruiterId: recruiter.id } });
  go("/recruteur/listes", "Recherche supprimée.");
}

export async function updateRecruiterAction(fd: FormData) {
  const { user, recruiter } = await me();
  const r = z
    .object({ organization: z.string().trim().min(2).max(120), website: z.string().trim().max(200).optional(), fifaLicense: z.string().trim().max(60).optional() })
    .safeParse(Object.fromEntries(fd));
  if (!r.success) go("/compte", "Informations invalides.", true);
  const d = r.data!;
  const changed = d.website !== (recruiter.website ?? "") || d.fifaLicense !== (recruiter.fifaLicense ?? "");
  await db.recruiterProfile.update({
    where: { id: recruiter.id },
    data: {
      organization: d.organization, website: d.website || null, fifaLicense: d.fifaLicense || null,
      // Changer le site ou la licence relance la vérification.
      verification: changed && recruiter.verification !== "REJECTED" ? autoVerifyRecruiter(user.email, d.website, recruiter.type) : recruiter.verification,
    },
  });
  await audit(user.id, "recruiter.update", { changed });
  go("/compte", "Informations mises à jour.");
}
