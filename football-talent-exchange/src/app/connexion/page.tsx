import Link from "next/link";
import { redirect } from "next/navigation";
import { loginAction } from "@/app/actions/auth";
import { getCurrentUser, homeFor } from "@/lib/auth";
import { Field, Flash } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";

export const metadata = { title: "Connexion" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const user = await getCurrentUser();
  if (user) redirect(homeFor(user.role));
  const sp = await searchParams;
  return (
    <div className="mx-auto max-w-md">
      <h1 className="h1 mb-6">Connexion</h1>
      <Flash sp={sp} />
      <form action={loginAction} className="card space-y-4">
        <Field label="Courriel"><input className="input" type="email" name="email" required autoComplete="email" /></Field>
        <Field label="Mot de passe"><input className="input" type="password" name="password" required autoComplete="current-password" /></Field>
        <SubmitButton className="btn-primary w-full">Se connecter</SubmitButton>
      </form>
      <p className="muted mt-4 text-center">Pas encore de compte ? <Link className="link" href="/inscription">Inscris-toi</Link></p>
    </div>
  );
}
