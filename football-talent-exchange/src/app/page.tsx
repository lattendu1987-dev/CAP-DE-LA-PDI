import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser, homeFor } from "@/lib/auth";
import { db } from "@/lib/db";
import { TRIAL_DAYS } from "@/lib/domain/pricing";
import { Flash } from "@/components/ui";

export default async function Home({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const user = await getCurrentUser();
  if (user) redirect(homeFor(user.role));
  const sp = await searchParams;
  const [players, recruiters, countries] = await Promise.all([
    db.playerProfile.count({ where: { published: true } }),
    db.recruiterProfile.count(),
    db.playerProfile.groupBy({ by: ["country"], where: { published: true } }).then((r) => r.length),
  ]);

  return (
    <div className="space-y-16">
      <Flash sp={sp} />
      <section className="relative overflow-hidden rounded-3xl bg-pitch-900 px-6 py-14 text-white sm:px-12 sm:py-20">
        <div aria-hidden className="absolute inset-0 opacity-15" style={{ backgroundImage: "repeating-linear-gradient(90deg, transparent 0 60px, rgba(255,255,255,.35) 60px 120px)" }} />
        <div aria-hidden className="absolute -right-24 -top-24 h-72 w-72 rounded-full border-[10px] border-white/10" />
        <div className="relative max-w-2xl">
          <p className="mb-4 inline-block rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest">Le marché mondial des talents du football</p>
          <h1 className="text-4xl font-extrabold leading-tight sm:text-5xl">Ton talent mérite d&apos;être vu. <span className="text-gold">Partout.</span></h1>
          <p className="mt-5 text-lg text-white/80">Les joueurs créent leur CV football avec vidéos et statistiques. Clubs, scouts et agents licenciés les trouvent et les contactent directement, sans intermédiaire.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/inscription?role=joueur" className="btn bg-white text-pitch-900 hover:bg-pitch-50">Je suis joueur — c&apos;est gratuit</Link>
            <Link href="/inscription?role=recruteur" className="btn border border-white/40 text-white hover:bg-white/10">Je recrute — essai {TRIAL_DAYS} jours</Link>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-3 gap-3 text-center">
        {[[players, "joueurs inscrits"], [recruiters, "recruteurs"], [countries, "pays représentés"]].map(([n, l]) => (
          <div key={String(l)} className="card"><p className="text-3xl font-extrabold text-pitch-700">{n}</p><p className="muted">{l}</p></div>
        ))}
      </section>

      <section>
        <h2 className="h1 mb-6 text-center">Comment ça marche</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            ["🏃", "1. Le joueur crée son profil", "Poste sur un terrain interactif, taille, pied fort, parcours, statistiques par saison et vidéos avec moments clés."],
            ["🔍", "2. Le recruteur cherche", "Filtres par âge, poste, pied, niveau, pays, contrat, disponibilité. Alertes automatiques sur les nouveaux profils."],
            ["💬", "3. Ils se parlent directement", "Messagerie sécurisée, invitations à des essais, détection automatique des arnaques."],
          ].map(([i, t, d]) => (
            <div key={t} className="card"><p className="text-3xl">{i}</p><h3 className="h2 mt-2">{t}</h3><p className="muted mt-1">{d}</p></div>
          ))}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="card">
          <h2 className="h2">🛡️ Pensé pour protéger les jeunes</h2>
          <ul className="mt-3 space-y-2 text-sm text-gray-700">
            <li>• Les moins de 18 ans n&apos;apparaissent qu&apos;après l&apos;accord d&apos;un parent ou tuteur.</li>
            <li>• Seuls les recruteurs vérifiés peuvent les contacter, et le parent reçoit chaque message.</li>
            <li>• Toute demande d&apos;argent (« frais d&apos;essai », « visa ») déclenche une alerte.</li>
          </ul>
          <Link href="/securite" className="link mt-3 inline-block text-sm">En savoir plus →</Link>
        </div>
        <div className="card">
          <h2 className="h2">🌍 Accessible partout</h2>
          <ul className="mt-3 space-y-2 text-sm text-gray-700">
            <li>• Profil joueur gratuit, pour toujours.</li>
            <li>• Prix adaptés au pouvoir d&apos;achat de chaque pays.</li>
            <li>• Fiche PDF à envoyer aux clubs en un clic.</li>
          </ul>
          <Link href="/tarifs" className="link mt-3 inline-block text-sm">Voir les tarifs →</Link>
        </div>
      </section>
    </div>
  );
}
