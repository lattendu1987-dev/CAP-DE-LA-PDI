import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <p className="text-5xl">🥅</p>
      <h1 className="h1 mt-4">Hors-jeu !</h1>
      <p className="muted mt-2">Cette page n&apos;existe pas ou ce profil n&apos;est pas public.</p>
      <Link href="/" className="btn-primary mt-6">Retour à l&apos;accueil</Link>
    </div>
  );
}
