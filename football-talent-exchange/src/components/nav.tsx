import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getMessages } from "@/i18n/server";
import { logoutAction } from "@/app/actions/auth";
import { LanguageSwitcher } from "./language-switcher";

export async function Nav() {
  const [user, m] = await Promise.all([getCurrentUser(), getMessages()]);
  const n = m.nav;
  const links: { href: string; label: string }[] = [];
  if (user?.role === "PLAYER")
    links.push({ href: "/joueur", label: n.myProfile }, { href: "/detections", label: n.trials }, { href: "/messages", label: n.messages }, { href: "/parrainage", label: n.referral }, { href: "/abonnement", label: n.subscription });
  if (user?.role === "GUARDIAN") links.push({ href: "/tuteur", label: n.myPlayers }, { href: "/messages", label: n.messages }, { href: "/parrainage", label: n.referral });
  if (user?.role === "RECRUITER")
    links.push(
      { href: "/recruteur/recherche", label: n.search },
      { href: "/recruteur/listes", label: n.myLists },
      { href: "/detections", label: n.trials },
      { href: "/messages", label: n.messages },
      { href: "/parrainage", label: n.referral },
      { href: "/abonnement", label: n.subscription },
    );
  if (user?.role === "ADMIN") links.push({ href: "/admin", label: n.admin }, { href: "/recruteur/recherche", label: n.search }, { href: "/detections", label: n.trials });
  if (!user) links.push({ href: "/detections", label: n.trials });

  return (
    <header className="no-print sticky top-0 z-30 border-b border-gray-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-5 gap-y-2 px-4 py-3">
        <Link href={user ? "/tableau-de-bord" : "/"} className="flex items-center gap-2 font-extrabold tracking-tight text-pitch-900">
          <span aria-hidden className="grid h-8 w-8 place-items-center rounded-lg bg-pitch-600 text-white">⚽</span>
          <span dir="ltr">Talent<span className="text-pitch-600">Exchange</span></span>
        </Link>
        <nav className="flex flex-1 flex-wrap items-center gap-x-4 gap-y-1 text-sm font-medium text-gray-600">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="hover:text-pitch-700">{l.label}</Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          {user ? (
            <>
              <Link href="/compte" className="hidden text-sm text-gray-600 hover:text-gray-900 sm:inline">{user.name}</Link>
              <form action={logoutAction}><button className="btn-secondary btn-sm">{n.logout}</button></form>
            </>
          ) : (
            <>
              <Link href="/connexion" className="btn-secondary btn-sm">{n.login}</Link>
              <Link href="/inscription" className="btn-primary btn-sm">{n.signup}</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
