import { visitorCountry } from "@/lib/geo";
import { FormAutosave } from "@/components/form-autosave";
import { autosaveText } from "@/lib/ui-text";
import Link from "next/link";
import { cookies } from "next/headers";
import { signupAction } from "@/app/actions/auth";
import { db } from "@/lib/db";
import { getLocale, getMessages } from "@/i18n/server";
import { normalizeReferralCode } from "@/lib/domain/referral";
import { RECRUITER_TYPES } from "@/lib/domain/reference";
import { Field, Flash } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { CountrySelect } from "@/components/country-select";

export async function generateMetadata() {
  return { title: (await getMessages()).auth.signupTitle };
}

const ROLES = ["joueur", "recruteur", "tuteur"] as const;

export default async function SignupPage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const [sp, m, locale] = await Promise.all([searchParams, getMessages(), getLocale()]);
  const a = m.auth;
  const role = sp.role as (typeof ROLES)[number];
  const refCode = normalizeReferralCode(sp.ref) ?? normalizeReferralCode((await cookies()).get("fte_ref")?.value);
  const referrer = refCode ? await db.user.findUnique({ where: { referralCode: refCode }, select: { name: true } }) : null;
  const refQs = refCode ? `&ref=${refCode}` : "";

  if (!ROLES.includes(role)) {
    return (
      <div className="mx-auto max-w-3xl">
        <h1 className="h1 mb-2">{a.signupTitle}</h1>
        <p className="muted mb-6">{a.chooseProfile}</p>
        {referrer && <p className="mb-4 rounded-xl bg-pitch-50 px-4 py-3 text-sm text-pitch-900">{a.referredBy(referrer.name)}</p>}
        <Flash sp={sp} />
        <div className="grid gap-4 sm:grid-cols-3">
          {ROLES.map((r) => {
            const [icon, title, text] = a.choices[r];
            return (
              <Link key={r} href={`/inscription?role=${r}${refQs}`} className="card transition hover:border-pitch-500 hover:shadow-md">
                <div className="text-3xl">{icon}</div>
                <h2 className="h2 mt-2">{title}</h2>
                <p className="muted mt-1">{text}</p>
              </Link>
            );
          })}
        </div>
      </div>
    );
  }

  const [icon, title] = a.choices[role];
  return (
    <div className="mx-auto max-w-xl">
      <Link href={`/inscription?${refQs.slice(1)}`} className="link text-sm">{a.changeProfile}</Link>
      <h1 className="h1 mb-6 mt-2">{icon} {title}</h1>
      {referrer && <p className="mb-4 rounded-xl bg-pitch-50 px-4 py-3 text-sm text-pitch-900">{a.referredBy(referrer.name)}</p>}
      <Flash sp={sp} />
      <form action={signupAction} className="card space-y-4">
        <input type="hidden" name="role" value={role} />
        <FormAutosave id={`signup-${role}`} text={autosaveText(m)} />
        {refCode && <input type="hidden" name="ref" value={refCode} />}
        {role === "joueur" && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={a.firstName}><input className="input" name="firstName" required maxLength={60} /></Field>
            <Field label={a.lastName}><input className="input" name="lastName" required maxLength={60} /></Field>
            <Field label={a.birthDate}><input className="input" type="date" name="birthDate" required /></Field>
          </div>
        )}
        <Field label={role === "joueur" ? a.displayName : a.fullName}><input className="input" name="name" required maxLength={80} autoComplete="name" /></Field>
        <Field label={a.email}><input className="input" type="email" name="email" required defaultValue={sp.email} autoComplete="email" dir="ltr" /></Field>
        <Field label={a.password} hint={a.passwordHint}><input className="input" type="password" name="password" required minLength={8} autoComplete="new-password" /></Field>
        <Field label={a.country}><CountrySelect name="country" locale={locale} defaultValue={(await visitorCountry()) ?? "CA"} /></Field>

        {role === "joueur" && (
          <Field label={a.guardianEmail} hint={a.guardianHint}><input className="input" type="email" name="guardianEmail" dir="ltr" /></Field>
        )}

        {role === "recruteur" && (
          <>
            <Field label={a.iAm}>
              <select className="input" name="type" required>
                {RECRUITER_TYPES.map((k) => <option key={k} value={k}>{m.labels.recruiterTypes[k]}</option>)}
              </select>
            </Field>
            <Field label={a.organization}><input className="input" name="organization" required maxLength={120} /></Field>
            <Field label={a.website} hint={a.websiteHint}><input className="input" name="website" placeholder="https://" dir="ltr" /></Field>
            <Field label={a.fifaLicense}><input className="input" name="fifaLicense" maxLength={60} /></Field>
          </>
        )}

        <label className="flex items-start gap-2 text-sm text-gray-700">
          <input type="checkbox" name="accept" required className="mt-1" />
          <span>{a.acceptPrefix} <Link className="link" href="/legal/cgu" target="_blank">{a.acceptTerms}</Link> {a.acceptAnd} <Link className="link" href="/legal/confidentialite" target="_blank">{a.acceptPrivacy}</Link>.</span>
        </label>
        <SubmitButton className="btn-primary w-full" pendingLabel={m.common.wait}>{a.createButton}</SubmitButton>
      </form>
    </div>
  );
}
