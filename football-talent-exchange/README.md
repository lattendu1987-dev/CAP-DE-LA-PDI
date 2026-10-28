# ⚽ Football Talent Exchange

Plateforme internationale qui relie directement les footballeurs aux recruteurs (clubs, entraîneurs, scouts, agents licenciés, directeurs techniques).

## Ce qui est construit

| Espace | Fonctionnalités |
|---|---|
| **Joueur** | CV football complet, postes sur un terrain interactif, parcours, statistiques par saison (« déclarées » ou « vérifiées »), **vidéos et photo envoyées directement depuis le téléphone** (barre de progression) ou liens YouTube/Vimeo, moments clés cliquables, score de complétude avec conseils, profil public, fiche PDF, **partage WhatsApp**, statistiques de vues (Premium), candidatures aux détections |
| **Mineurs** | Courriel du parent obligatoire, profil invisible jusqu'à son accord, ensuite visible **uniquement par les recruteurs vérifiés**, le parent est ajouté à chaque conversation et prévenu des réponses aux candidatures |
| **Recruteur** | Recherche multicritère, recherches sauvegardées avec alertes courriel, listes de suivi, évaluations privées, comparateur, essai gratuit 14 jours |
| **Détections** | Les recruteurs vérifiés publient des essais (gratuits obligatoirement) avec **adresse exacte et conditions de participation**, les joueurs postulent en un clic, le recruteur présélectionne / invite / refuse et le joueur est prévenu. Une annonce qui demande de l'argent est refusée automatiquement. **Carte interactive** (plan ou satellite), bouton **« Autour de moi »** (position du téléphone ou ville) avec rayon de 25 à 500 km, itinéraire Google Maps |
| **CV et IA** | Le joueur **dépose son CV (PDF, Word ou photo)** : l'IA (Claude, d'Anthropic) le lit et **remplit son profil** (taille, poste, pied, niveau, parcours, saisons, présentation), sans jamais toucher à son nom ni à sa date de naissance ni remplacer ce qu'il a déjà saisi. Bouton **« Rédiger ma présentation avec l'IA »** (texte proposé, à relire). Le CV est téléchargeable par les recruteurs vérifiés. Limite de 10 utilisations de l'IA par joueur et par jour |
| **Actualités** | **Veille automatique quotidienne** : détections, essais en club et actualités du football repérés dans des flux publics (5 langues), triés automatiquement, annonces payantes écartées, avertissement anti-arnaque |
| **Publicité** | **Régie en libre-service** : compte annonceur, bannière ou pop-up plein écran (image ou vidéo courte), ciblage par pays et par public, durée 7 à 30 jours, paiement carte ou mobile money, **validation et mise en ligne automatiques** (liens https sans raccourcisseur, pas de paris / alcool / tabac / contenus adultes, pas d'arnaque), statistiques (affichages, clics) et arrêt à tout moment |
| **Messagerie** | Conversations sécurisées, invitations à un essai, **détection automatique des arnaques en 5 langues**, signalement, blocage, limites anti-spam |
| **Abonnements** | Joueur Premium, Recruteur Pro, Club ; mensuel ou annuel ; prix adaptés au pays (jusqu'à −65 %), **pays détecté automatiquement** ; joueur en Afrique dès **2 500 FCFA par mois** ; **carte (Stripe, renouvellement automatique)** ou **mobile money (Flutterwave : Airtel Money, MTN Mobile Money, Orange Money, Wave, M-Pesa…)**, en devise locale ; **option Boost** (7 ou 30 jours en tête des recherches, badge « À la une ») |
| **Parrainage** | Lien personnel `?ref=CODE`, **20 % de chaque paiement des filleuls crédités automatiquement pendant 12 mois**, disponible après 30 jours de garantie, solde utilisé automatiquement pour payer son propre abonnement ou retiré dès 20 $ (mobile money, PayPal, virement — réservé aux majeurs) |
| **Langues** | **Français, anglais, espagnol, portugais, arabe** (affichage de droite à gauche), détection automatique de la langue du téléphone, courriels envoyés dans la langue de chaque personne |
| **Vidéo et 3G** | **Compression automatique sur le téléphone avant l'envoi** (ex. 150 Mo → 30 Mo, en 720p), réglée selon la durée (un match de 90 min tient sous 300 Mo) ; lecture **adaptative** via Cloudflare Stream (optionnel) : le recruteur en 3G reçoit automatiquement une qualité plus légère ; en mode économie de données, rien n'est téléchargé avant d'appuyer sur lecture |
| **Notifications** | Sur le téléphone (Web Push, Android et iPhone avec l'app installée) : profil consulté par un club (nom du club en Premium, « un recruteur » en gratuit — une fois par jour et par club), nouveau message, candidature reçue ou mise à jour, commission de parrainage, accord parental, compte vérifié, nouveaux joueurs pour une recherche sauvegardée ; dans la langue de chacun ; toucher la notification ouvre la bonne page |
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
npm test                      # 41 tests des règles métier (dont la cohérence des 5 langues)
npm run lint                  # vérification des types
npx playwright test           # 10 parcours complets dans un navigateur (serveur lancé + base de démo)
```

## Identité visuelle « Nocturne »

- **Page d'accueil cinématographique** : apparition du logo (une fois par visite, passable avec un clic ou Échap), carrousel plein écran avec zoom lent et titres animés. Le rythme se règle dans `src/app/page.tsx` (`CAROUSEL_INTERVAL`, en millisecondes).
- **Visuels** : images 3D originales d'un stade de nuit (aucun droit à payer), dans `public/visuals/`. Chaque scène existe en version horizontale (`hero.jpg`) et verticale pour téléphone (`hero-mobile.jpg`). Pour changer une image, remplacer le fichier en gardant le même nom.
- **Couleurs** : nuit `#040907`, or `#c9a45a`, vert pelouse `#123d26`. Polices Archivo (titres) et Instrument Serif (accents), servies par le site lui-même.
- **Confort** : les animations s'arrêtent si le téléphone demande de « réduire les animations », et une version allégée s'active sur les appareils modestes ou en économie de données.

## Mettre en ligne (pas à pas, sans être développeur)

### Étape A — un site testable en 15 minutes (gratuit, depuis un téléphone)

1. **Fusionner** — sur GitHub, ouvre la demande de fusion du site et touche « Merge pull request » puis « Confirm ».
2. **Vercel** — sur [vercel.com](https://vercel.com), « Continue with GitHub ». Puis « Add New… → Project », choisis le dépôt `CAP-DE-LA-PDI` (s'il n'apparaît pas : « Adjust GitHub App Permissions » et autorise-le). Dans **Root Directory**, touche « Edit » et choisis `football-talent-exchange`. Touche « Deploy ». Si ce premier essai échoue, c'est normal : la base de données n'existe pas encore.
3. **Base de données** — dans le projet Vercel : onglet **Storage → Create Database → Neon** (Postgres), offre gratuite, région la plus proche de tes joueurs (ex. Europe), puis « Connect » au projet. La variable `DATABASE_URL` est ajoutée toute seule, et les tables seront créées automatiquement au prochain déploiement.
4. **Fichiers (photos, vidéos, CV)** — toujours dans **Storage → Create → Blob**, choisis l'accès **Public**, puis « Connect » au projet. La variable `BLOB_READ_WRITE_TOKEN` est ajoutée toute seule.
5. **Variables** — **Settings → Environment Variables**, ajoute :
   - `ADMIN_EMAILS` : ton adresse courriel. En t'inscrivant avec elle sur le site, tu obtiens le compte d'administration (validation des recruteurs, signalements, statistiques).
   - `CRON_SECRET` : une longue phrase au hasard (sert aux tâches automatiques de chaque jour).
   - `ANTHROPIC_API_KEY` (pour l'IA) : sur [console.anthropic.com](https://console.anthropic.com), crée une clé (« API Keys ») et ajoute un peu de crédit. Lire un CV coûte quelques centimes. Sans cette clé, le CV est quand même enregistré, mais pas lu automatiquement.
6. **Redéployer** — onglet **Deployments**, sur le dernier déploiement « ⋯ → Redeploy ». Ton site est en ligne sur `https://<nom-du-projet>.vercel.app`. Inscris-toi d'abord avec ton adresse administrateur, puis partage le lien aux joueurs.

À ce stade : inscription, profils, CV lus par l'IA, vidéos, détections, carte, messagerie et actualités fonctionnent. Les paiements affichent « bientôt disponibles » tant que les clés ne sont pas ajoutées (personne n'obtient d'abonnement gratuit). Les courriels ne partent pas encore (étape B) : les **mineurs** ne peuvent donc pas finir leur inscription, car l'accord de leur parent arrive par courriel. L'offre gratuite de Vercel (Hobby) est prévue pour un usage non commercial : passe à l'offre Pro avant d'encaisser des paiements.

### Étape B — tout activer

1. **Courriels** — sur [resend.com](https://resend.com), vérifie ton nom de domaine, copie la clé dans `RESEND_API_KEY` et règle `EMAIL_FROM`.
2. **Carte bancaire** — sur [stripe.com](https://stripe.com) : clé secrète dans `STRIPE_SECRET_KEY` ; webhook vers `https://TON-SITE/api/stripe/webhook` avec les événements `checkout.session.completed`, `customer.subscription.*`, `invoice.paid`, `invoice.payment_failed` ; secret dans `STRIPE_WEBHOOK_SECRET`. Active le portail client et, si besoin, Stripe Tax.
3. **Mobile money** — sur [flutterwave.com](https://flutterwave.com) : fais valider ton compte (pièces d'entreprise), copie la clé secrète dans `FLW_SECRET_KEY`. Dans Settings → Webhooks, mets `https://TON-SITE/api/flutterwave/webhook` et choisis une phrase secrète que tu recopies dans `FLW_WEBHOOK_HASH`. Ajuste les taux de change avec `FX_RATES` si besoin. La disponibilité d'Airtel Money pays par pays dépend de ton compte Flutterwave.
4. **Notifications sur le téléphone** — sur un ordinateur, lance une seule fois `npx web-push generate-vapid-keys`, puis copie les deux clés dans `VAPID_PUBLIC_KEY` et `VAPID_PRIVATE_KEY` (et ton courriel dans `VAPID_SUBJECT`, ex. `mailto:toi@domaine.com`). Ne change plus ces clés ensuite.
5. **Vidéo adaptative (recommandé pour la 3G)** — Cloudflare → Stream : jeton API « Stream: Edit », renseigne `CF_ACCOUNT_ID` et `CF_STREAM_TOKEN`.
6. **Carte et actualités (facultatif)** — `GOOGLE_MAPS_API_KEY` (Geocoding API) pour placer les adresses avec Google ; `NEWS_API_KEY` (newsapi.org) pour plus d'articles ; `NEWS_FEEDS` pour choisir tes sources (voir `.env.example`).
7. **Ton nom de domaine** — Vercel → Settings → Domains, puis mets l'adresse dans `APP_URL`.
8. Redéploie. La tâche automatique quotidienne (`vercel.json`) s'occupe des abonnements, alertes, commissions et actualités.

Autre hébergeur que Vercel : le site fonctionne aussi avec n'importe quel PostgreSQL et un stockage compatible S3 (ex. Cloudflare R2 : `S3_ENDPOINT`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_PUBLIC_URL`, avec une règle CORS autorisant `PUT`). Tables : `npx prisma db push`.

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
- Vérifier les obligations fiscales liées aux commissions versées et à la vente d'espaces publicitaires.
- Choisir un fournisseur de fonds de carte pour un fort trafic (les serveurs OpenStreetMap sont limités ; MapTiler ou Mapbox ont des offres gratuites).

## Prochaines étapes possibles

- Virements automatiques des gains de parrainage (API Flutterwave Transfers).
- Vérification d'identité (Stripe Identity) et attestations de statistiques signées par les clubs.

## Architecture

- `src/lib/domain/` — règles métier pures et testées (âge, recherche, prix, mobile money, parrainage, détections, anti-arnaque, droits de contact, médias).
- `src/i18n/` — langues : `messages/fr.ts` est la référence ; TypeScript et un test vérifient que les 4 autres langues ont exactement les mêmes textes.
- `src/app/actions/` — actions serveur (formulaires), toujours protégées par rôle.
- `src/app/` — pages (Next.js App Router), rendues côté serveur.
- `prisma/schema.prisma` — modèle de données.
- Stack : Next.js 15, React 19, TypeScript, Tailwind CSS 4, Prisma + PostgreSQL, Stripe, Flutterwave, stockage S3 / Cloudflare R2, Resend.
