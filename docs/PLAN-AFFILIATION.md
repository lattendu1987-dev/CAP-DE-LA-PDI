# Plan retenu : affiliation, 0 $, sans entreprise

*Version 2 — 20 octobre 2026. Remplace le plan boutique ([`PLAN.md`](PLAN.md)), gardé pour plus tard si un budget se libère.*

## Pourquoi ce modèle

Contraintes : Québec/Canada, budget 0 $, pas d'entreprise, rôle d'intermédiaire seulement.

| Modèle | Coût de départ | Entreprise / comptes | Verdict |
|---|---|---|---|
| Boutique (livraison directe par le fournisseur) | ≈ 675 $ minimum | Shopify, fournisseurs, paiements, Loi 25 sur les adresses clients | ❌ Hors budget |
| Impression à la demande sur Etsy | Frais de mise en vente et de création de boutique | Boutique, service client | ❌ Pas 0 $ et pas un simple rôle d'intermédiaire |
| Affiliation TikTok Shop | 0 $ | — | ❌ TikTok Shop n'est pas officiellement lancé au Canada ([Atlantic Works](https://atlanticworks.ca/blog/tiktok-shop-canada)) |
| **Affiliation Amazon.ca + site de guides** | **0 $** | **1 compte personnel (Partenaires Amazon.ca)** | ✅ **Retenu** |

Avec l'affiliation, **vous recommandez, Amazon vend.** Pas de stock, pas de paiement à encaisser, pas de service après-vente, pas d'adresses de clients à gérer.

## Ce qui est déjà fait

- Site **Pattes au chaud** : 5 guides d'achat pour propriétaires d'animaux au Québec, axés sur l'hiver (bottes, manteaux, chauffe-mains, poils, cadeaux de Noël). Conçu d'abord pour le téléphone, avec mode sombre et animations légères.
- Conformité intégrée : divulgation d'affiliation sur chaque page, liens marqués « sponsorisés », aucun prix affiché (le contrat Amazon l'interdit hors API officielle), aucun faux avis, aucun témoin ni outil de mesure (rien à faire consentir pour la Loi 25).
- Hébergement gratuit : GitHub Pages, publication automatique à chaque mise à jour.
- Tests automatiques (21) : pages présentes, divulgation partout, liens marqués, aucun prix affiché.

## Ce que vous devez faire (environ 15 minutes en tout)

1. **Activer l'hébergement** : sur GitHub, dépôt `CAP-DE-LA-PDI` → *Settings* → *Pages* → *Source* : **GitHub Actions**.
2. **M'autoriser à fusionner la branche dans `main`** : la publication part de `main`.
3. **S'inscrire aux Partenaires Amazon.ca** (associates.amazon.ca) avec l'adresse du site : `https://lattendu1987-dev.github.io/CAP-DE-LA-PDI/`. Inscription à votre nom, avec votre compte bancaire personnel et l'entrevue fiscale (NAS). **M'envoyer ensuite l'identifiant de suivi** (ex. `pattesauchaud-20`). Ce n'est pas un secret : il apparaît dans tous les liens.

> ⚠️ Amazon exige **3 ventes dans les 180 jours** suivant l'inscription, sinon le compte est fermé ([Amazon.ca](https://associates.amazon.ca/help/node/topic/G7MJTPEP9NC3YKMG)). Vos propres achats ne comptent pas. Inscrivez-vous seulement quand le site est en ligne : la saison des fêtes est le meilleur moment.

## Statut légal et fiscal (simple)

- **Pas d'immatriculation au REQ** si vous exercez sous votre prénom et nom complets.
- **Impôts** : les commissions sont des revenus d'entreprise à déclarer dans votre déclaration personnelle (fédéral : T2125 ; Québec : annexe L et TP-80) ([QuickBooks](https://quickbooks.intuit.com/fr-ca/ressources/taxes/comment-declarer-des-revenus-de-travailleur-autonome-au-canada/)). Gardez les relevés de paiement d'Amazon.
- **TPS/TVQ** : rien à faire sous 30 000 $ de revenus sur 4 trimestres.
- **Divulgation** : obligatoire sur le site **et** dans chaque publication sur les réseaux sociaux (ex. « #affilié — je touche une commission ») ([BLG](https://www.blg.com/fr/insights/2025/07/trust-me-im-an-influencer-an-overview-of-influencer-marketing-in-canada)).

## Revenus attendus (honnêtement)

Commission « animaux » ≈ 3 % selon des sources tierces 2026, non confirmé par Amazon ([AffiliateX](https://affiliatexblocks.com/amazon-affiliate-commission-rates/)). Amazon rémunère tout le panier acheté dans les 24 h suivant le clic.

| Scénario | Visites/mois | Achats | **Commission/mois** |
|---|---|---|---|
| Démarrage (mois 1-3) | 500 | ≈ 4 | **≈ 7 $** |
| Croissance (mois 4-9) | 5 000 | ≈ 52 | **≈ 110 $** |
| Établi (12 mois et plus) | 30 000 | ≈ 360 | **≈ 756 $** |

Hypothèses : 15 % des visiteurs cliquent vers Amazon, 6 à 8 % de ceux-là achètent, panier de 55 à 60 $. Calcul : `python -m pdi affiliation`. **Le seul vrai levier, c'est le trafic.**

## Comment attirer du trafic à 0 $

| Canal | Effort pour vous | Ce que je fais | Délai |
|---|---|---|---|
| Référencement Google (guides en français, sujets québécois) | Aucun | Je rédige et publie de nouveaux guides chaque semaine | 3 à 6 mois |
| Pinterest (épingles vers les guides) | Créer un compte gratuit | J'écris les titres et descriptions des épingles et je prépare les visuels | 1 à 3 mois |
| Groupes Facebook québécois d'animaux | Publier vous-même, en respectant les règles des groupes | J'écris des réponses utiles, avec divulgation | Immédiat |
| Vidéos courtes (Reels, Shorts) | Filmer 30 s avec votre téléphone (votre animal, si vous en avez un) | J'écris les scripts | 1 à 2 mois |

## Étapes suivantes

1. Vous : activer GitHub Pages et autoriser la fusion → site en ligne.
2. Vous : inscription aux Partenaires Amazon.ca → me donner l'identifiant.
3. Moi : ajouter l'identifiant au site, publier 2 nouveaux guides par semaine jusqu'à Noël, préparer les épingles Pinterest et les messages pour les groupes.
4. Quand les commissions couvrent un budget, reprendre le plan boutique ([`PLAN.md`](PLAN.md)) avec les produits qui ont fait cliquer le plus.
