import Link from "next/link";
import { signupAction } from "@/app/actions/auth";
import { Field, Flash } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { CountrySelect } from "@/components/country-select";
import { RECRUITER_TYPE_LABELS } from "@/lib/domain/reference";
import { TRIAL_DAYS } from "@/lib/domain/pricing";

export const metadata = { title: "Créer un compte" };

const CHOICES = [
  { role: "joueur", icon: "🏃", title: "Je suis joueur", text: "Crée ton CV football, ajoute tes vidéos et sois repéré partout dans le monde." },
  { role: "recruteur", icon: "🔍", title: "Je recrute", text: `Club, entraîneur, scout, agent licencié ou directeur technique. Essai gratuit ${TRIAL_DAYS} jours.` },
  { role: "tuteur", icon: "👨‍👧", title: "Je suis parent / tuteur", text: "Accompagne et protège un joueur de moins de 18 ans." },
];

export default async function SignupPage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const sp = await searchParams;
  const role = sp.role;

  if (!CHOICES.some((c) => c.role === role)) {
    return (
      <div className="mx-auto max-w-3xl">
        <h1 className="h1 mb-2">Créer un compte</h1>
        <p className="muted mb-6">Choisis ton profil.</p>
        <Flash sp={sp} />
        <div className="grid gap-4 sm:grid-cols-3">
          {CHOICES.map((c) => (
            <Link key={c.role} href={`/inscription?role=${c.role}`} className="card transition hover:border-pitch-500 hover:shadow-md">
              <div className="text-3xl">{c.icon}</div>
              <h2 className="h2 mt-2">{c.title}</h2>
              <p className="muted mt-1">{c.text}</p>
            </Link>
          ))}
        </div>
      </div>
    );
  }

  const choice = CHOICES.find((c) => c.role === role)!;
  return (
    <div className="mx-auto max-w-xl">
      <Link href="/inscription" className="link text-sm">← Changer de profil</Link>
      <h1 className="h1 mb-6 mt-2">{choice.icon} {choice.title}</h1>
      <Flash sp={sp} />
      <form action={signupAction} className="card space-y-4">
        <input type="hidden" name="role" value={role} />
        {role === "joueur" && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Prénom"><input className="input" name="firstName" required maxLength={60} /></Field>
            <Field label="Nom"><input className="input" name="lastName" required maxLength={60} /></Field>
            <Field label="Date de naissance"><input className="input" type="date" name="birthDate" required /></Field>
          </div>
        )}
        <Field label={role === "joueur" ? "Nom affiché" : "Nom complet"}><input className="input" name="name" required maxLength={80} autoComplete="name" /></Field>
        <Field label="Courriel"><input className="input" type="email" name="email" required defaultValue={sp.email} autoComplete="email" /></Field>
        <Field label="Mot de passe" hint="8 caractères minimum."><input className="input" type="password" name="password" required minLength={8} autoComplete="new-password" /></Field>
        <Field label="Pays de résidence"><CountrySelect name="country" /></Field>

        {role === "joueur" && (
          <Field label="Courriel d'un parent ou tuteur légal" hint="Obligatoire si tu as moins de 18 ans. Ton profil restera privé jusqu'à son accord.">
            <input className="input" type="email" name="guardianEmail" />
          </Field>
        )}

        {role === "recruteur" && (
          <>
            <Field label="Je suis">
              <select className="input" name="type" required>
                {Object.entries(RECRUITER_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </Field>
            <Field label="Club ou organisation"><input className="input" name="organization" required maxLength={120} /></Field>
            <Field label="Site web officiel" hint="Si ton courriel utilise le même domaine que ce site, ton compte est vérifié automatiquement.">
              <input className="input" name="website" placeholder="https://monclub.com" />
            </Field>
            <Field label="Numéro de licence FIFA (agents)"><input className="input" name="fifaLicense" maxLength={60} /></Field>
          </>
        )}

        <label className="flex items-start gap-2 text-sm text-gray-700">
          <input type="checkbox" name="accept" required className="mt-1" />
          <span>J&apos;accepte les <Link className="link" href="/legal/cgu" target="_blank">conditions d&apos;utilisation</Link> et la <Link className="link" href="/legal/confidentialite" target="_blank">politique de confidentialité</Link>.</span>
        </label>
        <SubmitButton className="btn-primary w-full">Créer mon compte</SubmitButton>
      </form>
    </div>
  );
}
