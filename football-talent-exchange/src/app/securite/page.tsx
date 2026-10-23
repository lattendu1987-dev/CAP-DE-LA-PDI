export const metadata = { title: "Sécurité des joueurs" };

export default function SafetyPage() {
  return (
    <article className="mx-auto max-w-2xl space-y-5 text-gray-800">
      <h1 className="h1">Sécurité des joueurs</h1>
      <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
        <h2 className="h2 text-red-800">La règle d&apos;or</h2>
        <p className="mt-2 text-red-900">Un vrai club ne te demandera <b>jamais</b> d&apos;argent : ni pour un essai, ni pour un visa, ni pour un billet d&apos;avion, ni pour « réserver ta place ». Si quelqu&apos;un le fait, c&apos;est une arnaque. Signale-le immédiatement.</p>
      </div>
      <h2 className="h2">Ce que fait la plateforme</h2>
      <ul className="list-disc space-y-2 pl-5">
        <li>Les profils des moins de 18 ans restent invisibles tant qu&apos;un parent ou tuteur légal n&apos;a pas donné son accord. Ils ne sont visibles que par des recruteurs connectés.</li>
        <li>Seuls les recruteurs vérifiés peuvent contacter un mineur, et le parent ou tuteur participe automatiquement à la conversation.</li>
        <li>Les messages sont analysés automatiquement : toute demande d&apos;argent ou de documents affiche une alerte et est signalée à notre équipe.</li>
        <li>Tu peux bloquer ou signaler n&apos;importe quel contact en un clic.</li>
        <li>Ton courriel et ton téléphone ne sont jamais affichés publiquement.</li>
      </ul>
      <h2 className="h2">Transferts internationaux de mineurs</h2>
      <p>Le Règlement de la FIFA sur le statut et le transfert des joueurs (article 19) interdit en principe le transfert international des joueurs de moins de 18 ans, sauf exceptions strictes. Méfie-toi de toute promesse de départ à l&apos;étranger pour un mineur.</p>
      <h2 className="h2">Agents</h2>
      <p>Football Talent Exchange n&apos;est pas un agent et ne prend aucune commission. Si un agent te contacte, vérifie sa licence dans le registre public des agents de la FIFA.</p>
    </article>
  );
}
