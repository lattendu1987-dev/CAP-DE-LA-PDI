import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { logoutAction } from "@/app/actions/auth";

export async function Nav() {
  const user = await getCurrentUser();
  const links: { href: string; label: string }[] = [];
  if (user?.role === "PLAYER") links.push({ href: "/joueur", label: "Mon profil" }, { href: "/messages", label: "Messages" }, { href: "/abonnement", label: "Abonnement" });
  if (user?.role === "GUARDIAN") links.push({ href: "/tuteur", label: "Mes joueurs" }, { href: "/messages", label: "Messages" });
  if (user?.role === "RECRUITER")
    links.push(
      { href: "/recruteur/recherche", label: "Recherche" },
      { href: "/recruteur/listes", label: "Mes listes" },
      { href: "/messages", label: "Messages" },
      { href: "/abonnement", label: "Abonnement" },
    );
  if (user?.role === "ADMIN") links.push({ href: "/admin", label: "Administration" }, { href: "/recruteur/recherche", label: "Recherche" });

  return (
    <header className="no-print sticky top-0 z-30 border-b border-gray-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-5 gap-y-2 px-4 py-3">
        <Link href={user ? "/tableau-de-bord" : "/"} className="flex items-center gap-2 font-extrabold tracking-tight text-pitch-900">
          <span aria-hidden className="grid h-8 w-8 place-items-center rounded-lg bg-pitch-600 text-white">⚽</span>
          <span>Talent<span className="text-pitch-600">Exchange</span></span>
        </Link>
        <nav className="flex flex-1 flex-wrap items-center gap-x-4 gap-y-1 text-sm font-medium text-gray-600">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="hover:text-pitch-700">{l.label}</Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Link href="/compte" className="hidden text-sm text-gray-600 hover:text-gray-900 sm:inline">{user.name}</Link>
              <form action={logoutAction}><button className="btn-secondary btn-sm">Déconnexion</button></form>
            </>
          ) : (
            <>
              <Link href="/connexion" className="btn-secondary btn-sm">Connexion</Link>
              <Link href="/inscription" className="btn-primary btn-sm">Créer un compte</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
