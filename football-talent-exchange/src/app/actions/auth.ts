"use server";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { createSession, destroySession, hashPassword, homeFor, verifyPassword } from "@/lib/auth";
import { isMinor, ageOn } from "@/lib/domain/age";
import { slugify } from "@/lib/domain/slug";
import { autoVerifyRecruiter } from "@/lib/domain/rules";
import { TRIAL_DAYS } from "@/lib/domain/pricing";
import { appUrl, sendEmail } from "@/lib/email";
import { audit } from "@/lib/audit";

const fail = (path: string, msg: string): never => redirect(`${path}${path.includes("?") ? "&" : "?"}erreur=${encodeURIComponent(msg)}`);

const base = z.object({
  name: z.string().trim().min(2, "Nom trop court").max(80),
  email: z.string().trim().toLowerCase().email("Courriel invalide").max(160),
  password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères").max(200),
  country: z.string().length(2),
  accept: z.literal("on", { errorMap: () => ({ message: "Tu dois accepter les conditions d'utilisation" }) }),
});

async function uniqueSlug(first: string, last: string) {
  const root = slugify(`${first} ${last}`) || "joueur";
  for (let i = 0; i < 50; i++) {
    const slug = i === 0 ? root : `${root}-${i + 1}`;
    if (!(await db.playerProfile.findUnique({ where: { slug } }))) return slug;
  }
  return `${root}-${Date.now()}`;
}

export async function signupAction(formData: FormData) {
  const role = String(formData.get("role"));
  const back = `/inscription?role=${encodeURIComponent(role)}`;
  const raw = Object.fromEntries(formData) as Record<string, string>;
  const parsed = base.safeParse(raw);
  if (!parsed.success) fail(back, parsed.error!.issues[0].message);
  const { name, email, password, country } = parsed.data!;

  if (await db.user.findUnique({ where: { email } })) fail(back, "Un compte existe déjà avec ce courriel.");
  const passwordHash = await hashPassword(password);

  if (role === "joueur") {
    const p = z
      .object({
        firstName: z.string().trim().min(1).max(60),
        lastName: z.string().trim().min(1).max(60),
        birthDate: z.coerce.date(),
        guardianEmail: z.string().trim().toLowerCase().email().optional().or(z.literal("")),
      })
      .safeParse(raw);
    if (!p.success) fail(back, "Vérifie ton prénom, ton nom et ta date de naissance.");
    const { firstName, lastName, birthDate, guardianEmail } = p.data!;
    const age = ageOn(birthDate);
    if (age < 13) fail(back, "La plateforme est ouverte aux joueurs de 13 ans et plus.");
    if (age > 45) fail(back, "Date de naissance invalide.");
    const minor = isMinor(birthDate);
    if (minor && !guardianEmail) fail(back, "Tu as moins de 18 ans : le courriel d'un parent ou tuteur légal est obligatoire.");
    if (minor && guardianEmail === email) fail(back, "Le courriel du parent doit être différent du tien.");

    const guardian = minor ? await db.user.findUnique({ where: { email: guardianEmail! } }) : null;
    const user = await db.user.create({
      data: {
        email, passwordHash, name, role: "PLAYER", country,
        player: {
          create: {
            slug: await uniqueSlug(firstName, lastName),
            firstName, lastName, birthDate, country, nationalities: [country], languages: [], otherPositions: [], relocationCountries: [],
            guardianEmail: minor ? guardianEmail : null,
            guardianId: guardian?.role === "GUARDIAN" ? guardian.id : null,
          },
        },
        subscription: { create: { plan: "FREE", status: "ACTIVE", currentPeriodEnd: new Date("2999-12-31") } },
      },
    });
    if (minor) {
      await sendEmail(
        guardianEmail!,
        `${firstName} souhaite créer son profil sur Football Talent Exchange`,
        `Bonjour,\n\n${firstName} ${lastName} (${age} ans) a créé un profil de footballeur et vous a indiqué comme parent ou tuteur légal.\n\n` +
          `Son profil restera invisible des recruteurs tant que vous n'aurez pas donné votre accord. Tous les messages des recruteurs vous seront aussi adressés.\n\n` +
          (guardian ? `Connectez-vous pour confirmer : ${appUrl()}/tuteur\n` : `Créez votre compte parent pour confirmer : ${appUrl()}/inscription?role=tuteur&email=${encodeURIComponent(guardianEmail!)}\n`) +
          `\nSi vous ne connaissez pas ce joueur, ignorez ce message.`,
      );
    }
    await audit(user.id, "signup", { role: "PLAYER", minor });
    await createSession(user.id);
    redirect(minor ? "/joueur?ok=" + encodeURIComponent("Compte créé ! Ton parent ou tuteur a reçu un courriel pour confirmer.") : "/joueur?ok=Bienvenue ! Complète ton profil pour attirer les recruteurs.");
  }

  if (role === "recruteur") {
    const r = z
      .object({
        type: z.enum(["CLUB", "COACH", "SCOUT", "AGENT", "TECHNICAL_DIRECTOR"]),
        organization: z.string().trim().min(2).max(120),
        website: z.string().trim().max(200).optional(),
        fifaLicense: z.string().trim().max(60).optional(),
      })
      .safeParse(raw);
    if (!r.success) fail(back, "Vérifie le type de recruteur et le nom de ton organisation.");
    const { type, organization, website, fifaLicense } = r.data!;
    if (type === "AGENT" && !fifaLicense) fail(back, "Un agent doit fournir son numéro de licence FIFA.");
    const verification = autoVerifyRecruiter(email, website, type);
    const user = await db.user.create({
      data: {
        email, passwordHash, name, role: "RECRUITER", country,
        recruiter: { create: { type, organization, website: website || null, fifaLicense: fifaLicense || null, country, verification } },
        subscription: { create: { plan: "RECRUITER_PRO", status: "TRIALING", currentPeriodEnd: new Date(Date.now() + TRIAL_DAYS * 86400000) } },
      },
    });
    await audit(user.id, "signup", { role: "RECRUITER", verification });
    await createSession(user.id);
    redirect(`/recruteur/recherche?ok=${encodeURIComponent(`Bienvenue ! Ton essai gratuit de ${TRIAL_DAYS} jours commence maintenant.`)}`);
  }

  if (role === "tuteur") {
    const user = await db.user.create({ data: { email, passwordHash, name, role: "GUARDIAN", country } });
    await db.playerProfile.updateMany({ where: { guardianEmail: email }, data: { guardianId: user.id } });
    await audit(user.id, "signup", { role: "GUARDIAN" });
    await createSession(user.id);
    redirect("/tuteur");
  }

  fail("/inscription", "Choisis un type de compte.");
}

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const user = await db.user.findUnique({ where: { email } });
  // Comparaison toujours effectuée pour ne pas révéler l'existence du compte.
  const ok = await verifyPassword(password, user?.passwordHash ?? "$2b$11$invalidinvalidinvalidinvalidinvalidinvalidinvalidinva");
  if (!user || !ok) fail("/connexion", "Courriel ou mot de passe incorrect.");
  if (user!.suspended) fail("/connexion", "Ce compte est suspendu. Contacte le support.");
  await createSession(user!.id);
  redirect(homeFor(user!.role));
}

export async function logoutAction() {
  await destroySession();
  redirect("/");
}
