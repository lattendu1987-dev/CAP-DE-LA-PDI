import { requireUser } from "@/lib/auth";
import { Badge, Field, Flash } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { RECRUITER_TYPE_LABELS } from "@/lib/domain/reference";
import { changePasswordAction, deleteAccountAction } from "@/app/actions/account";
import { updateRecruiterAction } from "@/app/actions/recruiter";

export const metadata = { title: "Mon compte" };

export default async function AccountPage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const user = await requireUser();
  const sp = await searchParams;
  const r = user.recruiter;
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="h1">Mon compte</h1>
      <Flash sp={sp} />
      <div className="card text-sm">
        <p><b>{user.name}</b> · {user.email}</p>
        <p className="muted">Membre depuis le {user.createdAt.toLocaleDateString("fr-CA")}</p>
      </div>

      {r && (
        <form action={updateRecruiterAction} className="card space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="h2">Mon organisation</h2>
            {r.verification === "VERIFIED" ? <Badge tone="blue">✓ Vérifié</Badge> : r.verification === "REJECTED" ? <Badge tone="red">Refusé</Badge> : <Badge tone="gold">En attente</Badge>}
          </div>
          <p className="muted">{RECRUITER_TYPE_LABELS[r.type]}</p>
          <Field label="Club ou organisation"><input className="input" name="organization" defaultValue={r.organization} required /></Field>
          <Field label="Site web officiel"><input className="input" name="website" defaultValue={r.website ?? ""} /></Field>
          <Field label="Licence FIFA"><input className="input" name="fifaLicense" defaultValue={r.fifaLicense ?? ""} /></Field>
          <SubmitButton>Enregistrer</SubmitButton>
        </form>
      )}

      <form action={changePasswordAction} className="card space-y-3">
        <h2 className="h2">Mot de passe</h2>
        <Field label="Mot de passe actuel"><input className="input" type="password" name="current" required autoComplete="current-password" /></Field>
        <Field label="Nouveau mot de passe"><input className="input" type="password" name="next" required minLength={8} autoComplete="new-password" /></Field>
        <SubmitButton className="btn-secondary">Modifier</SubmitButton>
      </form>

      <div className="card space-y-3">
        <h2 className="h2">Mes données</h2>
        <p className="muted">Télécharge une copie complète de tes données personnelles.</p>
        <a className="btn-secondary" href="/api/compte/export">Télécharger mes données (JSON)</a>
      </div>

      <form action={deleteAccountAction} className="card space-y-3 border-red-200">
        <h2 className="h2 text-red-700">Supprimer mon compte</h2>
        <p className="muted">Suppression définitive de ton profil, tes vidéos, tes messages et ton abonnement.</p>
        <Field label="Écris SUPPRIMER pour confirmer"><input className="input" name="confirm" required /></Field>
        <button className="btn-danger">Supprimer définitivement</button>
      </form>
    </div>
  );
}
