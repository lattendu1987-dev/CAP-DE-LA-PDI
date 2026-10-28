import Link from "next/link";
import { resetPasswordAction } from "@/app/actions/auth";
import { getMessages } from "@/i18n/server";
import { Field, Flash } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";

export async function generateMetadata() {
  return { title: (await getMessages()).auth.resetTitle, robots: { index: false } };
}

export default async function NewPasswordPage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const [sp, m] = await Promise.all([searchParams, getMessages()]);
  const t = m.auth;
  const token = (sp.jeton ?? "").slice(0, 100);
  return (
    <div className="mx-auto max-w-md">
      <h1 className="h1 mb-2">{t.resetTitle}</h1>
      <p className="muted mb-6">{t.resetText}</p>
      <Flash sp={sp} />
      {token ? (
        <form action={resetPasswordAction} className="card space-y-4" data-testid="reset-form">
          <input type="hidden" name="jeton" value={token} />
          <Field label={t.newPassword} hint={t.passwordHint}>
            <input className="input" type="password" name="password" required minLength={8} maxLength={200} autoComplete="new-password" />
          </Field>
          <SubmitButton className="btn-primary w-full" pendingLabel={m.common.wait}>{t.resetButton}</SubmitButton>
        </form>
      ) : (
        <p><Link className="link" href="/connexion/oubli">{t.forgotLink}</Link></p>
      )}
      <p className="mt-4 text-center"><Link className="link" href="/connexion">{t.backToLogin}</Link></p>
    </div>
  );
}
