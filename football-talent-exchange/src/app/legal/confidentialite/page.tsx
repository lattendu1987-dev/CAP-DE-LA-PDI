export const metadata = { title: "Politique de confidentialité" };

export default function PrivacyPage() {
  return (
    <article className="mx-auto max-w-2xl space-y-4 text-sm leading-relaxed text-gray-800">
      <h1 className="h1">Politique de confidentialité</h1>
      <p className="rounded-xl bg-amber-50 p-3 text-amber-900">Modèle conforme dans l&apos;esprit au RGPD, à la Loi 25 (Québec) et à la LPRPDE (Canada), à faire valider par un avocat. Désigner un responsable de la protection des renseignements personnels avant le lancement.</p>
      <h2 className="h2">Données collectées</h2>
      <p>Identité (nom, date de naissance, nationalité), données sportives (postes, mensurations, parcours, statistiques, vidéos), coordonnées de connexion (courriel), messages échangés, données d&apos;abonnement (le paiement est traité par Stripe ; nous ne stockons pas les numéros de carte).</p>
      <h2 className="h2">Finalités</h2>
      <p>Afficher le profil sportif aux recruteurs, permettre la mise en relation, sécuriser la plateforme (détection des arnaques, modération), gérer les abonnements.</p>
      <h2 className="h2">Mineurs</h2>
      <p>Les données des moins de 18 ans ne sont publiées qu&apos;avec le consentement d&apos;un parent ou tuteur légal, révocable à tout moment depuis l&apos;espace parent. Elles ne sont visibles que par des recruteurs connectés.</p>
      <h2 className="h2">Partage</h2>
      <p>Nous ne vendons aucune donnée. Sous-traitants : hébergement, base de données, envoi de courriels, paiement (Stripe).</p>
      <h2 className="h2">Tes droits</h2>
      <p>Accès, rectification, portabilité et suppression : directement depuis la page Mon compte (export JSON et suppression définitive). Tu peux aussi masquer ton profil à tout moment.</p>
      <h2 className="h2">Conservation</h2>
      <p>Les données sont conservées tant que le compte est actif, puis supprimées. Les journaux de sécurité sont conservés 12 mois.</p>
    </article>
  );
}
