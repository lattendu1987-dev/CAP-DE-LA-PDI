import Link from "next/link";
import { requestPasswordResetAction } from "@/app/actions/auth";
import { getMessages } from "@/i18n/server";
import { Field, Flash } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";

export async function generateMetadata() {
  return { title: (await getMessages()).auth.forgotTitle, robots: { index: false } };
}

export default async function ForgotPasswordPage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const [sp, m] = await Promise.all([searchParams, getMessages()]);
  const t = m.auth;
  return (
    <div className="mx-auto max-w-md">
      <h1 className="h1 mb-2">{t.forgotTitle}</h1>
      <p className="muted mb-6">{t.forgotText}</p>
      <Flash sp={sp} />
      {!sp.ok && (
        <form action={requestPasswordResetAction} className="card space-y-4" data-testid="forgot-form">
          <Field label={t.email}><input className="input" type="email" name="email" required autoComplete="email" dir="ltr" /></Field>
          <SubmitButton className="btn-primary w-full" pendingLabel={m.common.wait}>{t.forgotButton}</SubmitButton>
        </form>
      )}
      <p className="mt-4 text-center"><Link className="link" href="/connexion">{t.backToLogin}</Link></p>
    </div>
  );
}
