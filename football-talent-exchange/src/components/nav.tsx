import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getMessages } from "@/i18n/server";
import { logoutAction } from "@/app/actions/auth";
import { LanguageSwitcher } from "./language-switcher";

function Logo() {
  return (
    <svg aria-hidden viewBox="0 0 120 120" className="brand-mark">
      <circle cx="60" cy="60" r="52" />
      <path d="M60 30 88 50 77 83H43L32 50z" />
      <path d="M60 30V8M88 50l21-7M77 83l13 18M43 83l-13 18M32 50l-21-7" />
    </svg>
  );
}

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
  if (user?.role === "ADVERTISER") links.push({ href: "/publicite/campagnes", label: m.ads.myCampaigns }, { href: "/actualites", label: n.news });
  if (user?.role === "ADMIN") links.push({ href: "/admin", label: n.admin }, { href: "/recruteur/recherche", label: n.search }, { href: "/detections", label: n.trials }, { href: "/publicite/campagnes", label: n.ads });
  if (!user) links.push({ href: "/detections", label: n.trials }, { href: "/actualites", label: n.news }, { href: "/tarifs", label: m.footer.pricing });
  else if (user.role !== "ADMIN" && user.role !== "ADVERTISER") links.splice(links.findIndex((l) => l.href === "/detections") + 1 || links.length, 0, { href: "/actualites", label: n.news });
  else if (user.role === "ADMIN") links.push({ href: "/actualites", label: n.news });

  const account = user ? (
    <>
      <Link href="/compte" className="account-link text-sm">{user.name}</Link>
      <form action={logoutAction}><button className="btn-secondary btn-sm">{n.logout}</button></form>
    </>
  ) : (
    <>
      <Link href="/connexion" className="btn-secondary btn-sm">{n.login}</Link>
      <Link href="/inscription" className="btn-primary btn-sm">{n.signup}</Link>
    </>
  );

  return (
    <header className="site-header no-print sticky top-0 z-30 border-b backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-x-3 px-4 py-3 lg:gap-x-6">
        <Link href={user ? "/tableau-de-bord" : "/"} className="flex shrink-0 items-center gap-2.5" aria-label={m.meta.title}>
          <Logo />
          <span dir="ltr" className="brand-word">Talent<span className="brand-accent">Exchange</span></span>
        </Link>
        <nav className="hidden flex-1 items-center gap-x-5 text-sm font-medium lg:flex">
          {links.map((l) => <Link key={l.href} href={l.href}>{l.label}</Link>)}
        </nav>
        <div className="hidden items-center gap-2 lg:flex">
          <LanguageSwitcher />
          {account}
        </div>
        {/* Téléphone et tablette : menu déroulant */}
        <div className="ms-auto flex items-center gap-2 lg:hidden">
          {!user && <Link href="/inscription" className="btn-primary btn-sm whitespace-nowrap max-[359px]:hidden">{n.signup}</Link>}
          <details className="nav-menu">
            <summary aria-label={m.common.menu}>
              <span className="nav-burger" aria-hidden><i /><i /></span>
            </summary>
            <div className="nav-panel">
              <nav className="flex flex-col">
                {links.map((l) => <Link key={l.href} href={l.href} className="nav-panel-link">{l.label}</Link>)}
              </nav>
              <div className="nav-panel-foot">
                <LanguageSwitcher />
                <div className="flex flex-wrap items-center gap-2">{account}</div>
              </div>
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}
