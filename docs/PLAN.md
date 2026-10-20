# Plan de démarrage — système de commerce en ligne autonome

*Version 1 — 20 octobre 2026. Marché supposé : Québec puis reste du Canada (à confirmer).
Montants en dollars canadiens, hors taxes. Les chiffres détaillés sont dans
[`rapport-chiffres.md`](rapport-chiffres.md), généré par le moteur (`python -m pdi rapport`).*

## Ce qu'il faut retenir

1. **Avec de la publicité payante, un produit vendu seul à moins de 40 $ n'est pas rentable.** Le moteur le montre : rouleau anti-poils à 29,99 $ → environ 0,42 $ de marge après publicité. Pour être rentable, il faut un **panier plus élevé** (offres groupées, personnalisation) **et** du trafic non payé (vidéos courtes, courriels).
2. **Démarrer sur une marque de niche « animaux de compagnie » au Québec**, avec un catalogue court et cohérent, pas une boutique généraliste.
3. **Deux produits passent les filtres aujourd'hui** : le kit anti-poils (offre groupée, 21 % de marge après pub) et le plaid personnalisé avec portrait de l'animal (16 %). Le chauffe-mains a la meilleure preuve de demande mais ne passe qu'à environ 66 $ ou avec un trafic non payé.
4. **Lancement progressif** : 3 semaines de test sans publicité, puis 300 $ maximum par produit avec des règles d'arrêt automatiques. Budget total recommandé : **environ 3 000 $**, minimum possible environ 700 $.
5. **Point légal à traiter dès le départ** : avec la Loi 25, transmettre l'adresse d'un client québécois à un fournisseur hors Québec (Chine, États-Unis) exige une **évaluation des facteurs relatifs à la vie privée (EFVP)** et une mention dans la politique de confidentialité.

---

## A. Les trois stratégies les plus prometteuses

| # | Stratégie | Pourquoi | Limites |
|---|---|---|---|
| **1** | **Marque de niche « animaux » au Québec** — 5 à 8 produits utiles, contenus en français, offres groupées | Catégorie en croissance (e-commerce animaux estimé de 34,6 à 38,7 G$ US, +11,8 %, [ResearchAndMarkets](https://www.globenewswire.com/fr/news-release/2026/07/07/3322935/28124/en/Pet-Care-E-commerce-Market-Report-2026.html)). Achats répétés, attachement émotionnel, contenus vidéo faciles. *Hypothèse à tester* : en français, le contenu commercial est moins saturé qu'en anglais. | Petits paniers : il faut regrouper les produits. Concurrence d'Amazon.ca. |
| **2** | **Personnalisation à la demande** — portrait illustré de l'animal du client (IA) imprimé sur plaid, tasse, affiche | Aucun stock, produit unique (difficile à copier), prix élevé. Concurrents à 79–110 $ US ([Printify](https://printify.com/knowledge-hub/deep-dive-into-custom-pet-blankets/), source intéressée). Articles personnalisés pour animaux : +20 à 50 % en 2025 chez les détaillants suivis ([GRIPS](https://gripsintelligence.com/insights/industries/animals-pet-supplies/pet-accessories-and-custom-gear)), prévision 2026 stable. Pic à Noël. | Délais d'impression ; le client doit téléverser une photo (Loi 25). |
| **3** | **Collection saisonnière « Hiver avec son chien »** — chauffe-mains rechargeables pour les promenades, de novembre à février | Demande saisonnière **mesurée** : ventes Amazon estimées de ~205/mois en août 2025 à ~8 300/mois en janvier 2026 pour un lot de 2 ([Accio](https://www.accio.com/business/electric-hand-warmer-trends)). L'hiver québécois favorise ce produit. | Batterie lithium (transport, sécurité). Concurrence forte. Rentable seulement à ~66 $ ou sans publicité. |

**Recommandation** : 1 + 2 forment la marque permanente ; 3 est une collection d'hiver dans la même marque (« promenades d'hiver »). La sélection reste cohérente et chaque visite peut mener à plusieurs achats.

Écartés : boutique généraliste ; vente de compléments (licence Santé Canada obligatoire) ; produits électriques 120 V (certification CSA/cUL) ; produits pour enfants (réglementation lourde).

---

## B. Les cinq premiers produits à étudier

Détails, sources et calculs : [`rapport-chiffres.md`](rapport-chiffres.md). Coûts = prix de gros publics, **à confirmer par devis et échantillon**.

| Produit | Preuve de demande | Fournisseurs à comparer | Coût livré | Prix | Marge après pub (CAC estimé) | Verdict |
|---|---|---|---|---|---|---|
| **Kit anti-poils** (rouleau réutilisable + 2 brosses d'angle) | Référence du marché ChomChom à 25–35 $ US, promotions récurrentes ([Chewy](https://www.chewy.com/chomchom-roller-limited-edition-pet/dp/255118)) ; brosse d'angle citée comme produit viral TikTok ([Dashboardly](https://www.dashboardly.io/tiktok-shop/pet-supplies), sans chiffres). Le kit lui-même reste une hypothèse. | CJdropshipping, BigBuy (4,28 € à 18 u.), Alibaba | 20,00 $ | 49,99 $ | 10,74 $ (21 %) — CAC 16 $ | **Retenu** |
| **Plaid portrait de l'animal** (impression à la demande) | Concurrents 79–110 $ US ; croissance des articles personnalisés en 2025 | Printify, Gelato, Printful | 62,00 $ | 119 $ | 18,49 $ (16 %) — CAC 30 $ | **Retenu** (prix suggéré 136 $ si la marge doit atteindre 25 %) |
| **Chauffe-mains rechargeable** (paire) | Ventes saisonnières mesurées (voir A.3) | CJdropshipping (entrepôt US), DSers/AliExpress | 25,00 $ | 54,99 $ | 6,80 $ (12 %) — CAC 18 $ | **Sous condition** : prix 65,99 $ ou vente sans publicité |
| **Rouleau anti-poils seul** | Voir kit | BigBuy, CJ | 13,50 $ | 29,99 $ | 0,42 $ (1 %) | **En complément seulement** (ajout au panier, pas de pub) |
| **Plaid chauffant USB 5 V** | Sondage R.-U. : 31 % utilisent un plaid chauffant ([ClearScore/Uswitch](https://www.clearscore.com/learn/managing-money/how-to-keep-warm)) ; mais vendu 22,99 $ US sur Amazon | Alibaba (12–15 $ US), CJ | 38,00 $ | 79,99 $ | 8,77 $ (11 %) | **Écarté** pour l'instant (trop volumineux, guerre des prix) |

Le CAC estimé est une hypothèse : il sera remplacé par le CAC réel dès les premiers tests. Les références de marché (Facebook/Instagram) citent 15–50 $ US par commande en dropshipping ([Carro](https://getcarro.com/blog/dropshipping-statistics)), et le taux de conversion français est mesuré à environ 1,1 % ([eightx](https://eightx.co/blog/average-eu-ecommerce-cac-by-country-2026)). Aucune donnée fiable n'a été trouvée pour le Québec.

---

## C. Les outils nécessaires

| Fonction | Outil recommandé | Coût | Pourquoi / alternative |
|---|---|---|---|
| Boutique | **Shopify Basic** | 39 $ US/mois (29 $ en annuel) + 2,9 % + 0,30 $ par vente avec Shopify Payments ; +2 % si autre passerelle ([NerdWallet](https://www.nerdwallet.com/article/small-business/shopify-pricing)) | API complète, paiements intégrés, TPS/TVQ, Shopify Flow. Alternative : WooCommerce (moins cher, plus d'entretien). |
| Fournisseur général | **CJdropshipping** | Gratuit (frais par article) | Entrepôts US, API pour commandes, stocks et suivi. Comparer avec **DSers** (AliExpress) et **BigBuy** (UE, 69 €/mois). |
| Impression à la demande | **Printify** ou **Gelato** | Gratuit au départ | API ; production en Amérique du Nord (à confirmer pour le Canada). |
| Génération des portraits | Modèle d'image par API | ~0,05–0,20 $ par image (à confirmer) | Automatise la création du portrait après la commande. |
| Courriels | **Klaviyo** | Gratuit jusqu'à 250 profils / 500 courriels, puis ~20 $ US ([Omnisend](https://www.omnisend.com/blog/klaviyo-pricing/)) | Relance de panier, fidélisation. Consentement exigé par la LCAP (loi anti-pourriel). |
| Publicité | Meta (Facebook/Instagram), TikTok | Budget plafonné | Pilotage par le moteur de règles (`pdi/guardrails.py`) + **plafond de dépense réglé dans le compte publicitaire**. |
| Veille | Google Trends, TikTok Creative Center, meilleures ventes Amazon.ca, Etsy | Gratuit | TikTok et Amazon n'offrent pas d'API publique pour ces données ; les extraire automatiquement enfreint leurs conditions. Lecture hebdomadaire assistée par l'IA, ou outil payant (Keepa, Kalodata) plus tard. |
| Comptabilité | **Wave** (gratuit) puis QuickBooks | 0–30 $/mois | Rapprochement Shopify, TPS/TVQ. |
| Orchestration | Ce dépôt (Python) + tâches planifiées (GitHub Actions ou tâches planifiées Claude) | Gratuit au départ | Synchronisation des prix et stocks, commandes, règles pub, rapport quotidien. |
| Témoins / consentement | Bannière Shopify (Customer Privacy API) | Gratuit | Loi 25. |

---

## D. Coût réel de lancement

| Poste | Minimum | Recommandé |
|---|---|---|
| Échantillons (contrôle qualité, photos et vidéos maison) | 150 $ | 250 $ |
| Nom de domaine | 25 $ | 25 $ |
| Immatriculation au REQ si nom commercial (montant à vérifier) | 40 $ | 40 $ |
| Relecture juridique des politiques (optionnelle) | 0 $ | 400 $ |
| **Abonnements, 1er mois** (Shopify, apps, divers) | 60 $ | 106 $ |
| **Budget publicitaire de test** (5 tests × 300 $, plafond dur) | 0 $ (organique seul) | 1 500 $ |
| **Fonds de roulement** (fournisseur payé avant le versement Shopify, remboursements, rétrofacturations) | 400 $ | 1 000 $ |
| **Total** | **≈ 675 $** | **≈ 3 300 $** |

Charges fixes ensuite : environ **106 $/mois** (détail dans `config/settings.toml`), plus Klaviyo quand la liste dépasse 250 contacts.

---

## E. Difficultés, risques et obligations légales (Québec / Canada)

**Obligations légales** — à faire valider par un juriste avant le lancement :
- **Loi 25 (vie privée)** : consentement explicite aux témoins non essentiels, politique de confidentialité, responsable de la protection des renseignements personnels, registre des incidents. **Communication hors Québec** (fournisseur en Chine ou aux États-Unis) : une EFVP est exigée. Sanctions administratives jusqu'à 10 M$ ou 2 % du chiffre d'affaires mondial ([Secure Privacy](https://secureprivacy.ai/fr/blog/loi-25-au-quebec-guide-complet-de-conformite-pour-les-entreprises-2026)).
- **Loi sur la protection du consommateur (contrats à distance)** : informations obligatoires avant la commande (prix total, frais, délais, politique de retour), envoi d'une copie du contrat, droit de résolution du client si la livraison dépasse le délai annoncé. Il faut donc annoncer des délais réalistes.
- **Charte de la langue française (Loi 96)** : site, fiches produits et inscriptions sur les produits en français.
- **LCAP (loi anti-pourriel)** : consentement exprès avant tout courriel commercial, lien de désabonnement.
- **Loi canadienne sur la sécurité des produits de consommation** : déclaration d'incident sous 2 jours, rappels. Batteries lithium : documents UN38.3 et fiche de sécurité.
- **Étiquetage des textiles** (plaids) : étiquette bilingue de composition des fibres + identification du vendeur.
- **Loi sur la concurrence** : pas de faux prix barrés, pas de faux avis, prix affiché complet (pas de frais ajoutés au dernier moment).
- **TPS/TVQ** : inscription obligatoire au-delà de 30 000 $ de ventes taxables sur 4 trimestres (inscription volontaire possible plus tôt).
- **Douanes** : les sources se contredisent sur les seuils de faible valeur au Canada en 2026 ([Salaccounting](https://salaccounting.ca/blog/cross-border-ecommerce-shipping/) vs [Gaia Dynamics](https://www.gaiadynamics.ai/blog/canada-still-has-de-minimis-clvs-thresholds-for-cross-border-e-commerce-after-the-us-suspension)). Exiger du fournisseur des envois **droits et taxes acquittés (DDP)** pour que le client ne paie rien à la livraison, et vérifier auprès de l'ASFC.

**Risques commerciaux** : qualité inégale des fournisseurs ; délais de 7 à 15 jours depuis la Chine (baisse de conversion, plus de litiges) ; rétention de fonds par Shopify Payments ou suspension d'un compte publicitaire ; copie rapide des produits gagnants ; forte saisonnalité ; variation du taux de change USD/CAD (achats en dollars américains, ventes en dollars canadiens).

**Difficultés techniques** : pas d'API publique pour les tendances TikTok ni pour les classements Amazon (veille semi-automatique) ; images des fournisseurs à n'utiliser qu'avec autorisation, sinon nos propres photos d'échantillons ; un texte généré par l'IA ne doit contenir **que** les caractéristiques fournies par le fournisseur (règle intégrée au générateur) ; les webhooks Shopify exigent un petit service en ligne (Shopify Flow ou fonction sans serveur).

---

## F. Plan d'exécution étape par étape

Légende : 🤖 je peux le faire directement · 🔌 nécessite une connexion à un service (clé d'API) · 👤 exige votre intervention.

| # | Étape | Qui |
|---|---|---|
| 1 | Confirmer le marché, le budget et le statut d'entreprise (3 questions en fin de message) | 👤 |
| 2 | Moteur de notation, calcul des marges, règles pub, simulation (**fait, dans ce dépôt**) | 🤖 |
| 3 | Proposer 3 noms de marque, vérifier domaine et marques déposées (OPIC) | 🤖 → 👤 choix |
| 4 | Créer les comptes Shopify, CJdropshipping, Printify, Meta Business, Klaviyo ; vérification d'identité et compte bancaire | 👤 (étapes légales : je ne peux pas les faire à votre place) |
| 5 | Ajouter les clés d'API comme secrets de l'environnement (menu de l'environnement cloud dans la barre de titre → Modifier). Noms lus : `SHOPIFY_ADMIN_TOKEN`, `SHOPIFY_STORE`, `CJ_API_KEY`, `PRINTIFY_TOKEN`, `META_ADS_TOKEN`. Ne jamais les coller dans la conversation. | 👤 puis 🔌 |
| 6 | Commander les échantillons, vérifier la qualité, faire photos et vidéos | 👤 (≈ 1 h + délai de livraison) |
| 7 | Thème de boutique haut de gamme (Liquid/CSS, animations légères, mobile d'abord), pages légales, bannière témoins | 🤖 + 🔌 Shopify |
| 8 | Fiches produits en français : titres, descriptions, variantes, prix calculés par le moteur | 🤖 + 🔌 |
| 9 | Automatisations : synchronisation prix/stock quotidienne, transmission des commandes payées et non suspectes, suivi des colis (expédition confirmée **uniquement** avec un numéro de suivi réel), alertes de retard et de rupture | 🤖 + 🔌 |
| 10 | Parcours de personnalisation : téléversement de la photo → portrait IA → **validation par le client** → envoi à l'imprimeur → photo supprimée après production | 🤖 + 🔌 |
| 11 | Contenus courts : 2–3 vidéos par jour (scripts et variantes par l'IA, tournage avec les échantillons) | 🤖 scripts · 👤 publication au début |
| 12 | Tests publicitaires plafonnés avec arrêt automatique | 🔌 + 👤 accord du budget |
| 13 | Tableau de bord quotidien et rapport hebdomadaire ; seules les exceptions vous sont signalées | 🤖 |

---

## G. Simulation financière (mois en régime établi)

Tableau complet dans [`rapport-chiffres.md`](rapport-chiffres.md). Hypothèses : coût des produits livrés = 42–48 % du panier, frais de paiement 2,9 % + 0,30 $, remboursements 4–6 % (marchandise perdue), charges fixes ≈ 106 $/mois.

| Scénario | Hypothèses clés | Chiffre d'affaires | **Résultat avant impôt** |
|---|---|---|---|
| **Prudent** | 1 500 $ de pub, CPC 1,20 $, conversion 1,2 %, panier 55 $, peu de trafic non payé | 1 023 $ | **−1 171 $** |
| **Intermédiaire** | 3 000 $ de pub, CPC 1,00 $, conversion 1,8 %, panier 62 $, 1 500 visites non payées | 5 022 $ | **−765 $** |
| **Ambitieux** | 8 000 $ de pub, CPC 0,90 $, conversion 2,5 %, panier 70 $, 6 000 visites non payées | 26 054 $ | **+4 946 $** |
| **Organique d'abord** (recommandé) | 500 $ de pub, 3 000 visites non payées (vidéos, courriels), conversion 1,5 %, panier 60 $ | 3 109 $ | **+843 $** |

**Lecture** : avec de la publicité payante seulement, il faut un panier ≥ 65 $ et une conversion ≥ 2 % pour être rentable. La rentabilité vient d'abord du trafic non payé et des offres groupées ; la publicité ne sert qu'à amplifier un produit déjà validé. Le chiffre d'affaires n'est jamais présenté comme un bénéfice.

---

## H. Lancement progressif (tester avant de dépenser)

Dates clés : Vendredi fou le **27 novembre 2026** ; fin des commandes de Noël pour l'impression à la demande vers le **10 décembre** (à confirmer avec l'imprimeur).

| Phase | Période | Dépense | Critère pour passer à la suite |
|---|---|---|---|
| **0. Mise en place** | Sem. 1–2 (21 oct – 3 nov) | ≈ 400 $ (échantillons, domaine, Shopify) | Échantillons conformes ; boutique et politiques en ligne |
| **1. Test sans publicité** | Sem. 3–4 (4 – 17 nov) | 0 $ | ≥ 1 % des visiteurs ajoutent au panier ; vidéos avec un taux de sauvegarde ou de partage au-dessus de la moyenne du compte |
| **2. Test payant plafonné** | 18 nov – 6 déc (Vendredi fou inclus) | ≤ 300 $ par produit, ≤ 60 $/jour | Arrêt auto. après 1,5 × le CPA d'équilibre sans vente ; poursuite si CPA < CPA d'équilibre |
| **3. Noël** | 7 – 20 déc | Hausses de +20 % seulement sur les gagnants | Marge contributive réelle positive sur 2 semaines |
| **4. Consolidation** | Janvier – février | Selon les résultats | Retrait des perdants, remplacement par la veille ; produit gagnant → stock en marque privée au Canada (entrepôt logistique) pour livrer en 2–3 jours |

Toute hausse au-delà des plafonds (60 $/jour, 1 500 $/mois) vous est demandée avant d'être appliquée.
