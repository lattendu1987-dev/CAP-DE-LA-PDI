import Link from "next/link";
import { redirect } from "next/navigation";
import { loginAction } from "@/app/actions/auth";
import { getCurrentUser, homeFor } from "@/lib/auth";
import { getMessages } from "@/i18n/server";
import { Field, Flash } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";

export async function generateMetadata() {
  return { title: (await getMessages()).auth.loginTitle };
}

export default async function LoginPage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const user = await getCurrentUser();
  if (user) redirect(homeFor(user.role));
  const [sp, m] = await Promise.all([searchParams, getMessages()]);
  return (
    <div className="mx-auto max-w-md">
      <h1 className="h1 mb-6">{m.auth.loginTitle}</h1>
      <Flash sp={sp} />
      <form action={loginAction} className="card space-y-4">
        <Field label={m.auth.email}><input className="input" type="email" name="email" required autoComplete="email" dir="ltr" /></Field>
        <Field label={m.auth.password}><input className="input" type="password" name="password" required autoComplete="current-password" /></Field>
        <SubmitButton className="btn-primary w-full" pendingLabel={m.common.wait}>{m.auth.loginButton}</SubmitButton>
      </form>
      <p className="muted mt-4 text-center">{m.auth.noAccount} <Link className="link" href="/inscription">{m.auth.signupLink}</Link></p>
    </div>
  );
}
