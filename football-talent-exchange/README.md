# ⚽ Football Talent Exchange

Plateforme internationale qui relie directement les footballeurs aux recruteurs (clubs, entraîneurs, scouts, agents licenciés, directeurs techniques).

## Ce qui est construit

| Espace | Fonctionnalités |
|---|---|
| **Joueur** | Inscription, CV football complet (identité, physique, pied fort), choix des postes sur un terrain interactif, parcours (clubs, académies, sélections), statistiques par saison (« déclarées » ou « vérifiées »), vidéos YouTube/Vimeo/MP4 avec moments clés cliquables, score de complétude avec conseils, profil public, fiche PDF, masquer son profil, statistiques de vues (Premium) |
| **Mineurs** | Courriel du parent obligatoire, profil invisible jusqu'à son accord, visible seulement par des recruteurs connectés, contact réservé aux recruteurs **vérifiés**, le parent est ajouté à chaque conversation, il peut retirer son accord |
| **Recruteur** | Recherche multicritère (âge, poste, pied, taille, pays, nationalité, niveau, contrat, disponibilité, vidéo, stats vérifiées, mobilité), recherches sauvegardées avec alertes par courriel, listes de suivi, évaluations privées (technique/physique/tactique/mental), comparateur de 2 à 4 joueurs, essai gratuit de 14 jours |
| **Messagerie** | Conversations sécurisées, invitations à un essai (date + lieu), **détection automatique des arnaques** (frais d'essai, visa, Western Union…), signalement, blocage, limites anti-spam |
| **Abonnements** | Joueur Premium, Recruteur Pro, Club ; mensuel ou annuel (2 mois offerts) ; **prix adaptés au pays** (jusqu'à −65 %) ; paiement Stripe, renouvellement automatique, gestion par le client (portail Stripe), mode démo sans Stripe |
| **Automatisation** | Vérification automatique des recruteurs (courriel = domaine du club), fin des essais et des abonnements, rappel 3 jours avant la fin de l'essai, alertes quotidiennes, nettoyage des sessions |
| **Administration** | Indicateurs (inscrits, abonnés, revenu mensuel, résiliations), file de vérification des recruteurs, signalements, messages suspects, validation des statistiques, suspension de comptes, journal d'audit |
| **Conformité** | Export des données (JSON) et suppression du compte en libre-service, CGU, politique de confidentialité, page sécurité (FIFA art. 19, agents), en-têtes de sécurité |

## Lancer en local

Prérequis : Node.js 22 et PostgreSQL.

```bash
cp .env.example .env          # puis ajuster DATABASE_URL
npm install
npm run db:push               # crée les tables
npm run db:seed               # comptes de démonstration
npm run dev                   # http://localhost:3000
```

Comptes de démo (mot de passe `demo1234`) : `admin@fte.local`, `scout@fte.local`, `moussa@fte.local`, `parent@fte.local`, `awa@fte.local`.

## Tests

```bash
npm test                      # règles métier (17 tests)
npm run lint                  # vérification des types
# Parcours complets dans un navigateur (serveur lancé + base de démo) :
npx playwright test
```

## Mettre en ligne (pas à pas, sans être développeur)

1. **Base de données** — crée un compte gratuit sur [neon.tech](https://neon.tech), crée un projet, copie la « connection string » (elle commence par `postgresql://`).
2. **Hébergement** — crée un compte sur [vercel.com](https://vercel.com) avec ton GitHub, clique « Add New → Project », choisis ce dépôt et règle **Root Directory** sur `football-talent-exchange`.
3. **Variables** — dans Vercel → Settings → Environment Variables, ajoute :
   - `DATABASE_URL` : la chaîne Neon
   - `AUTH_SECRET` et `CRON_SECRET` : deux longues phrases aléatoires différentes
   - `APP_URL` : l'adresse de ton site (ex. `https://football-talent-exchange.vercel.app`)
4. **Créer les tables** — sur ton ordinateur : `DATABASE_URL="…neon…" npx prisma db push`. Pour créer ton compte administrateur, lance `npm run db:seed` puis **change immédiatement le mot de passe** de `admin@fte.local` (ou supprime les comptes de démo).
5. **Paiements** — sur [stripe.com](https://stripe.com) : copie la clé secrète dans `STRIPE_SECRET_KEY` ; dans Développeurs → Webhooks, ajoute l'adresse `https://TON-SITE/api/stripe/webhook` avec les événements `checkout.session.completed`, `customer.subscription.*`, `invoice.payment_failed`, et copie le secret dans `STRIPE_WEBHOOK_SECRET`. Active le portail client (Settings → Billing → Customer portal). Pour les taxes (TPS/TVQ, TVA), active Stripe Tax.
6. **Courriels** — sur [resend.com](https://resend.com), vérifie ton nom de domaine et copie la clé dans `RESEND_API_KEY` ; règle `EMAIL_FROM`.
7. Redéploie. Les tâches automatiques (`vercel.json`) tournent chaque jour.

Tant que `STRIPE_SECRET_KEY` est vide, le site est en **mode démo** : les abonnements s'activent sans paiement. Ne lance jamais le site public dans ce mode.

## Avant le lancement commercial

- Faire relire les CGU et la politique de confidentialité par un avocat (mineurs, international, Loi 25 / RGPD).
- Désigner un responsable de la protection des renseignements personnels.
- Ajouter une limitation des tentatives de connexion (ex. Upstash Rate Limit) et la confirmation du courriel.

## Prochaines étapes possibles

- Upload direct de vidéos et de photos (Mux ou Cloudflare Stream).
- Interface en anglais, espagnol, portugais et arabe.
- Mobile money (Flutterwave / Paystack) pour l'Afrique.
- Vérification d'identité (Stripe Identity) et attestations de stats signées par les clubs.
- Application mobile (PWA).

## Architecture

- `src/lib/domain/` — règles métier pures et testées (âge, recherche, prix, anti-arnaque, droits de contact, vidéos).
- `src/app/actions/` — actions serveur (formulaires), toujours protégées par rôle.
- `src/app/` — pages (Next.js App Router), rendues côté serveur.
- `prisma/schema.prisma` — modèle de données.
- Stack : Next.js 15, React 19, TypeScript, Tailwind CSS 4, Prisma + PostgreSQL, Stripe, Resend.
