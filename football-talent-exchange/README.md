# ⚽ Football Talent Exchange

Plateforme internationale qui relie directement les footballeurs aux recruteurs (clubs, entraîneurs, scouts, agents licenciés, directeurs techniques).

## Ce qui est construit

| Espace | Fonctionnalités |
|---|---|
| **Joueur** | CV football complet, postes sur un terrain interactif, parcours, statistiques par saison (« déclarées » ou « vérifiées »), **vidéos et photo envoyées directement depuis le téléphone** (barre de progression) ou liens YouTube/Vimeo, moments clés cliquables, score de complétude avec conseils, profil public, fiche PDF, **partage WhatsApp**, statistiques de vues (Premium), candidatures aux détections |
| **Mineurs** | Courriel du parent obligatoire, profil invisible jusqu'à son accord, ensuite visible **uniquement par les recruteurs vérifiés**, le parent est ajouté à chaque conversation et prévenu des réponses aux candidatures |
| **Recruteur** | Recherche multicritère, recherches sauvegardées avec alertes courriel, listes de suivi, évaluations privées, comparateur, essai gratuit 14 jours |
| **Détections** | Les recruteurs vérifiés publient des essais (gratuits obligatoirement), les joueurs postulent en un clic, le recruteur présélectionne / invite / refuse et le joueur est prévenu. Une annonce qui demande de l'argent est refusée automatiquement |
| **Messagerie** | Conversations sécurisées, invitations à un essai, **détection automatique des arnaques en 5 langues**, signalement, blocage, limites anti-spam |
| **Abonnements** | Joueur Premium, Recruteur Pro, Club ; mensuel ou annuel ; prix adaptés au pays (jusqu'à −65 %) ; **carte (Stripe, renouvellement automatique)** ou **mobile money (Flutterwave : Orange Money, Wave, MTN, M-Pesa…)**, en devise locale |
| **Parrainage** | Lien personnel `?ref=CODE`, **20 % de chaque paiement des filleuls crédités automatiquement pendant 12 mois**, disponible après 30 jours de garantie, solde utilisé automatiquement pour payer son propre abonnement ou retiré dès 20 $ (mobile money, PayPal, virement — réservé aux majeurs) |
| **Langues** | **Français, anglais, espagnol, portugais, arabe** (affichage de droite à gauche), détection automatique de la langue du téléphone, courriels envoyés dans la langue de chaque personne |
| **Application** | **Installable sur le téléphone** (icône sur l'écran d'accueil), page hors ligne |
| **Automatisation** | Vérification automatique des recruteurs, fin des essais et abonnements, rappels (fin d'essai, renouvellement mobile money), alertes quotidiennes, déblocage des commissions, nettoyage |
| **Administration** | Indicateurs (revenu mensuel, abonnés, commissions dues), vérification des recruteurs, signalements, messages suspects, validation des statistiques, **demandes de retrait**, derniers paiements, suspension de comptes (annule les commissions en attente) |
| **Conformité** | Export et suppression des données (y compris les fichiers), CGU et confidentialité dans les 5 langues, page sécurité (FIFA art. 19, agents) |

## Lancer en local

Prérequis : Node.js 22 et PostgreSQL.

```bash
cp .env.example .env          # puis ajuster DATABASE_URL
npm install
npm run db:push               # crée les tables
npm run db:seed               # comptes de démonstration
npm run dev                   # http://localhost:3000
```

Comptes de démo (mot de passe `demo1234`) : `admin@fte.local`, `scout@fte.local`, `moussa@fte.local` (Sénégal, pour tester le mobile money), `parent@fte.local`, `awa@fte.local`.

Sans clés, tout fonctionne en **mode démo** : paiements simulés (qui déclenchent quand même le parrainage), fichiers stockés dans `./uploads`, courriels affichés dans la console.

## Tests

```bash
npm test                      # 34 tests des règles métier (dont la cohérence des 5 langues)
npm run lint                  # vérification des types
npx playwright test           # 8 parcours complets dans un navigateur (serveur lancé + base de démo)
```

## Mettre en ligne (pas à pas, sans être développeur)

1. **Base de données** — compte gratuit sur [neon.tech](https://neon.tech), crée un projet, copie la « connection string » (`postgresql://…`).
2. **Hébergement** — compte sur [vercel.com](https://vercel.com) avec ton GitHub, « Add New → Project », choisis ce dépôt et règle **Root Directory** sur `football-talent-exchange`.
3. **Variables** — dans Vercel → Settings → Environment Variables, ajoute au minimum `DATABASE_URL`, `AUTH_SECRET`, `CRON_SECRET` (deux longues phrases aléatoires différentes) et `APP_URL` (l'adresse de ton site).
4. **Créer les tables** — sur ton ordinateur : `DATABASE_URL="…neon…" npx prisma db push`. Lance `npm run db:seed` pour créer le compte administrateur, puis **change immédiatement son mot de passe** (ou supprime les comptes de démo).
5. **Vidéos et photos** (obligatoire en ligne : Vercel n'a pas de disque permanent) — sur [Cloudflare](https://dash.cloudflare.com) → R2 : crée un bucket, active l'accès public (domaine `r2.dev` ou ton domaine), crée un jeton API « Object Read & Write ». Renseigne `S3_ENDPOINT`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_PUBLIC_URL`. Dans le bucket → Settings → CORS, autorise la méthode `PUT` depuis l'adresse de ton site (en-tête `Content-Type`). R2 ne facture pas la bande passante : idéal pour la vidéo.
6. **Carte bancaire** — sur [stripe.com](https://stripe.com) : clé secrète dans `STRIPE_SECRET_KEY` ; webhook vers `https://TON-SITE/api/stripe/webhook` avec les événements `checkout.session.completed`, `customer.subscription.*`, `invoice.paid`, `invoice.payment_failed` ; secret dans `STRIPE_WEBHOOK_SECRET`. Active le portail client et, si besoin, Stripe Tax.
7. **Mobile money** — sur [flutterwave.com](https://flutterwave.com) : fais valider ton compte (pièces d'entreprise), copie la clé secrète dans `FLW_SECRET_KEY`. Dans Settings → Webhooks, mets `https://TON-SITE/api/flutterwave/webhook` et choisis une phrase secrète que tu recopies dans `FLW_WEBHOOK_HASH`. Ajuste les taux de change avec `FX_RATES` si besoin.
8. **Courriels** — sur [resend.com](https://resend.com), vérifie ton domaine, clé dans `RESEND_API_KEY`, règle `EMAIL_FROM`.
9. Redéploie. Les tâches automatiques (`vercel.json`) tournent chaque jour.

Ne lance jamais le site public en mode démo : sans clés de paiement, les abonnements s'activent sans payer.

## Parrainage : comment l'argent circule

- Commission = 20 % du montant **réellement payé** (carte ou mobile money) par le filleul, pendant 12 mois après son inscription.
- Statut « en attente » pendant 30 jours (le temps de détecter fraude ou remboursement), puis « disponible » automatiquement.
- Le solde disponible paie automatiquement le prochain abonnement du parrain (crédit Stripe ou déduction mobile money).
- Retrait à partir de 20 $ : la demande apparaît dans l'administration ; tu envoies l'argent (mobile money, PayPal, virement) puis tu cliques « Marquer payé ».
- Suspendre un compte annule ses commissions en attente.

## Avant le lancement commercial

- Faire relire CGU et confidentialité par un avocat (mineurs, international, parrainage rémunéré, Loi 25 / RGPD / LGPD).
- Désigner un responsable de la protection des renseignements personnels.
- Ajouter une limitation des tentatives de connexion et la confirmation du courriel.
- Vérifier les obligations fiscales liées aux commissions versées.

## Prochaines étapes possibles

- Compression automatique des vidéos et lecture adaptative (Mux ou Cloudflare Stream).
- Virements automatiques des gains de parrainage (API Flutterwave Transfers).
- Vérification d'identité (Stripe Identity) et attestations de statistiques signées par les clubs.
- Notifications push sur le téléphone.

## Architecture

- `src/lib/domain/` — règles métier pures et testées (âge, recherche, prix, mobile money, parrainage, détections, anti-arnaque, droits de contact, médias).
- `src/i18n/` — langues : `messages/fr.ts` est la référence ; TypeScript et un test vérifient que les 4 autres langues ont exactement les mêmes textes.
- `src/app/actions/` — actions serveur (formulaires), toujours protégées par rôle.
- `src/app/` — pages (Next.js App Router), rendues côté serveur.
- `prisma/schema.prisma` — modèle de données.
- Stack : Next.js 15, React 19, TypeScript, Tailwind CSS 4, Prisma + PostgreSQL, Stripe, Flutterwave, stockage S3 / Cloudflare R2, Resend.
