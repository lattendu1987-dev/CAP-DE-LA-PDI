"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { createSession, destroySession, hashPassword, homeFor, verifyPassword } from "@/lib/auth";
import { getLocale, getMessages, messagesFor } from "@/i18n/server";
import { isMinor, ageOn } from "@/lib/domain/age";
import { slugify } from "@/lib/domain/slug";
import { autoVerifyRecruiter } from "@/lib/domain/rules";
import { TRIAL_DAYS } from "@/lib/domain/pricing";
import { normalizeReferralCode } from "@/lib/domain/referral";
import { uniqueReferralCode } from "@/lib/referral";
import { appUrl, sendEmail } from "@/lib/email";
import { audit } from "@/lib/audit";

const fail = (path: string, msg: string): never => redirect(`${path}${path.includes("?") ? "&" : "?"}erreur=${encodeURIComponent(msg)}`);

async function uniqueSlug(first: string, last: string) {
  const root = slugify(`${first} ${last}`) || "joueur";
  for (let i = 0; i < 50; i++) {
    const slug = i === 0 ? root : `${root}-${i + 1}`;
    if (!(await db.playerProfile.findUnique({ where: { slug } }))) return slug;
  }
  return `${root}-${Date.now()}`;
}

/** Parrain mémorisé par le lien ?ref= (cookie) ou saisi dans le formulaire. */
async function findReferrer(fd: FormData) {
  const code = normalizeReferralCode(String(fd.get("ref") ?? "")) ?? normalizeReferralCode((await cookies()).get("fte_ref")?.value);
  if (!code) return null;
  const u = await db.user.findUnique({ where: { referralCode: code } });
  return u && !u.suspended ? u : null;
}

export async function signupAction(formData: FormData) {
  const [m, locale] = await Promise.all([getMessages(), getLocale()]);
  const e = m.auth.errors;
  const role = String(formData.get("role"));
  const back = `/inscription?role=${encodeURIComponent(role)}`;
  const raw = Object.fromEntries(formData) as Record<string, string>;
  const base = z.object({
    name: z.string().trim().min(2, e.nameShort).max(80),
    email: z.string().trim().toLowerCase().email(e.emailInvalid).max(160),
    password: z.string().min(8, e.passwordShort).max(200),
    country: z.string().length(2),
    accept: z.literal("on", { errorMap: () => ({ message: e.acceptRequired }) }),
  });
  const parsed = base.safeParse(raw);
  if (!parsed.success) fail(back, parsed.error!.issues[0].message);
  const { name, email, password, country } = parsed.data!;

  if (await db.user.findUnique({ where: { email } })) fail(back, e.emailTaken);
  const passwordHash = await hashPassword(password);
  const referrer = await findReferrer(formData);
  const common = { email, passwordHash, name, country, locale, referralCode: await uniqueReferralCode(), referredById: referrer?.id ?? null };

  if (role === "joueur") {
    const p = z
      .object({
        firstName: z.string().trim().min(1).max(60),
        lastName: z.string().trim().min(1).max(60),
        birthDate: z.coerce.date(),
        guardianEmail: z.string().trim().toLowerCase().email().optional().or(z.literal("")),
      })
      .safeParse(raw);
    if (!p.success) fail(back, e.playerFields);
    const { firstName, lastName, birthDate, guardianEmail } = p.data!;
    const age = ageOn(birthDate);
    if (age < 13) fail(back, e.tooYoung);
    if (age > 45) fail(back, e.badBirthDate);
    const minor = isMinor(birthDate);
    if (minor && !guardianEmail) fail(back, e.guardianRequired);
    if (minor && guardianEmail === email) fail(back, e.guardianSame);

    const guardian = minor ? await db.user.findUnique({ where: { email: guardianEmail! } }) : null;
    const user = await db.user.create({
      data: {
        ...common, role: "PLAYER",
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
      const gm = messagesFor(guardian?.locale ?? locale);
      const link = guardian ? `${appUrl()}/tuteur` : `${appUrl()}/inscription?role=tuteur&email=${encodeURIComponent(guardianEmail!)}`;
      await sendEmail(guardianEmail!, gm.email.guardianSubject(firstName), gm.email.guardianBody(firstName, lastName, age, link));
    }
    await audit(user.id, "signup", { role: "PLAYER", minor, referred: !!referrer });
    await createSession(user.id);
    redirect(`/joueur?ok=${encodeURIComponent(minor ? m.auth.welcomeMinor : m.auth.welcomePlayer)}`);
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
    if (!r.success) fail(back, e.recruiterFields);
    const { type, organization, website, fifaLicense } = r.data!;
    if (type === "AGENT" && !fifaLicense) fail(back, e.agentLicense);
    const verification = autoVerifyRecruiter(email, website, type);
    const user = await db.user.create({
      data: {
        ...common, role: "RECRUITER",
        recruiter: { create: { type, organization, website: website || null, fifaLicense: fifaLicense || null, country, verification } },
        subscription: { create: { plan: "RECRUITER_PRO", status: "TRIALING", currentPeriodEnd: new Date(Date.now() + TRIAL_DAYS * 86400000) } },
      },
    });
    await audit(user.id, "signup", { role: "RECRUITER", verification, referred: !!referrer });
    await createSession(user.id);
    redirect(`/recruteur/recherche?ok=${encodeURIComponent(m.auth.welcomeRecruiter(TRIAL_DAYS))}`);
  }

  if (role === "tuteur") {
    const user = await db.user.create({ data: { ...common, role: "GUARDIAN" } });
    await db.playerProfile.updateMany({ where: { guardianEmail: email }, data: { guardianId: user.id } });
    await audit(user.id, "signup", { role: "GUARDIAN" });
    await createSession(user.id);
    redirect("/tuteur");
  }

  fail("/inscription", e.chooseType);
}

export async function loginAction(formData: FormData) {
  const m = await getMessages();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const user = await db.user.findUnique({ where: { email } });
  // Comparaison toujours effectuée pour ne pas révéler l'existence du compte.
  const ok = await verifyPassword(password, user?.passwordHash ?? "$2b$11$invalidinvalidinvalidinvalidinvalidinvalidinvalidinva");
  if (!user || !ok) fail("/connexion", m.auth.errors.invalidCredentials);
  if (user!.suspended) fail("/connexion", m.auth.errors.suspended);
  await createSession(user!.id);
  redirect(homeFor(user!.role));
}

export async function logoutAction() {
  await destroySession();
  redirect("/");
}
