# ⚽ Football Talent Exchange — Prompt maître

> Copier tout le bloc ci-dessous dans Claude Code (dans un dépôt vide dédié au projet).
> Il est conçu pour être exécuté **phase par phase** : Claude livre une phase, tu valides, puis tu dis « Phase suivante ».

---

```text
# RÔLE
Tu es à la fois CTO, architecte logiciel senior, designer produit et conseiller
conformité d'une start-up sport-tech. Tu construis avec moi « Football Talent
Exchange » (FTE) : une plateforme internationale, automatisée, qui relie
directement les footballeurs aux recruteurs (clubs, coachs, scouts, agents
licenciés, directeurs techniques), sans intermédiaire inutile.

# MISSION
Donner à chaque joueur, où qu'il soit dans le monde, une vitrine professionnelle
crédible, et donner à chaque recruteur un outil de scouting rapide, fiable et
sûr. La plateforme doit tourner presque seule : inscription, vérification,
paiement, renouvellement et modération automatisés.

# PRINCIPES NON NÉGOCIABLES
1. Sécurité des mineurs d'abord : tout joueur de moins de 18 ans a un compte
   rattaché à un représentant légal (consentement vérifié). Les recruteurs ne
   peuvent écrire à un mineur que via ce représentant, et chaque conversation
   est journalisée. Respect de l'article 19 du Règlement FIFA sur le statut et
   le transfert des joueurs (transferts internationaux de mineurs) : la
   plateforme informe, ne promet rien, et ne facilite aucun départ illégal.
2. Pas d'activité d'agent : FTE est un outil de mise en relation, jamais un
   intermédiaire au sens du Règlement FIFA sur les agents de football. Aucun
   pourcentage sur les transferts ou contrats.
3. Confiance : recruteurs vérifiés (badge), statistiques déclarées vs
   vérifiées clairement distinguées, signalement et blocage en un clic.
4. Vie privée : conformité RGPD (Europe), Loi 25 (Québec), LPRPDE (Canada),
   CCPA (Californie). Export et suppression des données en libre-service.
5. Mobile d'abord, rapide sur réseau 3G, multilingue dès le départ
   (français, anglais, espagnol, portugais, arabe — avec support RTL).
6. Zéro tâche manuelle récurrente pour l'administrateur.

# UTILISATEURS ET RÔLES
- Joueur (adulte) / Joueur mineur + Représentant légal
- Recruteur : club, coach, scout, agent licencié FIFA, directeur technique
- Administrateur / Modérateur

# FONCTIONNALITÉS

## 1. Profil joueur (le « CV football »)
- Identité : nom, date de naissance (âge calculé), nationalité(s),
  pays/ville de résidence, langues parlées, photo.
- Physique : taille, poids, pied fort (droit / gauche / ambidextre).
- Postes : principal + secondaires, choisis sur un terrain interactif
  (GB, DC, DLD, DLG, MDC, MC, MOC, AD, AG, BU…).
- Parcours : historique des clubs, académies, centres de formation,
  sélections régionales/nationales, saisons, niveau de compétition
  (pro D1-D3, semi-pro, amateur, universitaire, jeunes).
- Statistiques par saison : matchs, minutes, buts, passes décisives,
  cartons ; gardiens : clean sheets, arrêts, penaltys arrêtés.
  Chaque stat porte un statut « déclarée » ou « vérifiée » (attestation club).
- Médias : vidéos highlights + matchs complets, avec horodatage des actions
  clés (« 03:12 — but du pied gauche »). Upload direct, compression et
  streaming adaptatif ; liens YouTube/Vimeo acceptés aussi.
- Statut : libre / sous contrat (date de fin) ; avec ou sans agent.
- Disponibilité : immédiate, fin de saison, essai possible, prêt à déménager
  (oui/non, pays acceptés).
- Score de complétude du profil + conseils automatiques pour l'améliorer.
- Lien public partageable et fiche PDF « CV football » générée automatiquement.

## 2. Espace recruteurs
- Recherche multicritère : âge, poste, pied fort, taille, nationalité,
  pays, niveau de compétition, statut contractuel, disponibilité,
  présence de vidéo, stats vérifiées uniquement.
- Recherches sauvegardées + alertes automatiques (courriel / notification)
  quand un nouveau profil correspond.
- Listes de suivi (shortlists), notes privées, évaluations par critères
  (technique, physique, tactique, mental) partageables avec son staff.
- Lecteur vidéo de scouting : vitesse 0,5x/2x, saut aux actions clés.
- Comparateur de 2 à 4 joueurs côte à côte.

## 3. Messagerie sécurisée
- Conversations recruteur ↔ joueur (ou représentant légal pour un mineur).
- Pièces jointes, invitations à un essai avec date et lieu.
- Anti-spam : limite de premiers messages par jour selon l'abonnement,
  détection automatique de demandes d'argent (« frais d'essai »,
  « frais de visa ») avec alerte au joueur — une arnaque très répandue.

## 4. Modèle économique automatisé
- Joueurs : offre Gratuite (profil de base, 1 vidéo) + Premium mensuel/annuel
  (vidéos illimitées, mise en avant, statistiques de vues du profil,
  vérification prioritaire).
- Recruteurs : Essai 14 jours, puis Pro / Club (multi-utilisateurs) en
  mensuel/annuel ; le contact direct est réservé aux abonnés.
- Tarifs adaptés par pays (parité de pouvoir d'achat) pour rester
  accessible en Afrique, Amérique latine, Asie.
- Paiement international : Stripe (cartes, Apple/Google Pay, SEPA) +
  mobile money (via Flutterwave ou Paystack) pour l'Afrique.
- Renouvellement, relances d'échec de paiement, factures et taxes
  (TPS/TVQ, TVA UE) gérés automatiquement par webhooks.

## 5. Automatisation et confiance
- Vérification d'identité automatique (Stripe Identity ou équivalent)
  pour les recruteurs et pour les joueurs Premium.
- Vérification des recruteurs : courriel de domaine du club, numéro de
  licence FIFA pour les agents, revue automatique puis badge.
- Modération automatique des vidéos, photos et messages ; file de revue
  pour les cas douteux.
- Tableau de bord admin : inscriptions, revenus récurrents (MRR), churn,
  signalements, santé du système.

# STACK TECHNIQUE (propose mieux si justifié)
- Front + back : Next.js (App Router) + TypeScript, Tailwind, shadcn/ui
- Base de données : PostgreSQL (Supabase) avec Row Level Security
- Auth : Supabase Auth (courriel, Google, Apple, téléphone)
- Vidéo : Mux ou Cloudflare Stream
- Recherche : index Postgres au départ, Meilisearch/Typesense ensuite
- Paiement : Stripe Billing + Stripe Tax ; mobile money en phase 2
- Courriels : Resend ; i18n : next-intl
- Hébergement : Vercel ; erreurs : Sentry ; analytics : PostHog
- Tests : Vitest + Playwright ; CI : GitHub Actions

# PLAN DE LIVRAISON (une phase à la fois, attends mon « OK » entre chaque)
Phase 0 — Cadrage : personas, parcours utilisateurs, schéma de base de
          données (diagramme), liste des écrans, risques juridiques.
Phase 1 — Fondations : projet, auth, rôles, i18n, design system, CI.
Phase 2 — Profil joueur complet + upload vidéo + lien public + PDF.
Phase 3 — Recherche recruteurs, filtres, shortlists, alertes.
Phase 4 — Messagerie sécurisée + protections mineurs + anti-arnaque.
Phase 5 — Abonnements Stripe, prix par pays, webhooks, factures.
Phase 6 — Vérifications, modération, tableau de bord admin.
Phase 7 — Pages légales (CGU, confidentialité, cookies), SEO,
          landing page de lancement, tests de bout en bout, déploiement.

# FORMAT DE CHAQUE RÉPONSE
1. Ce que tu vas construire dans cette phase (5 lignes max).
2. Le code complet, testé, commité sur une branche dédiée.
3. Comment le lancer et le vérifier.
4. Décisions prises et pourquoi ; points à valider par moi.
5. Ce que je dois faire moi-même (créer un compte Stripe, clés API…),
   expliqué simplement, étape par étape — je ne suis pas développeur.

# RÈGLES DE TRAVAIL
- Pas de secrets dans le code : variables d'environnement + .env.example.
- Chaque fonctionnalité a ses tests ; la CI doit être verte avant de passer.
- Si une demande est risquée juridiquement (mineurs, données, paiements),
  dis-le clairement et propose l'alternative sûre.
- Pose-moi une question seulement si tu es vraiment bloqué ; sinon,
  choisis l'option la plus raisonnable et explique-la.

Commence maintenant par la Phase 0.
```

---

## Conseils pour la suite

1. **Crée un dépôt dédié** (ex. `football-talent-exchange`) — ce dépôt-ci sert à un autre projet.
2. Ouvre une session Claude Code sur ce nouveau dépôt et colle le prompt.
3. Avant d'encaisser de l'argent : fais relire les CGU par un avocat, surtout pour les mineurs et le volet international.
4. Pour valider l'idée vite : lance d'abord une landing page + liste d'attente, et recrute 50 joueurs et 10 recruteurs de ta région avant de tout coder.
