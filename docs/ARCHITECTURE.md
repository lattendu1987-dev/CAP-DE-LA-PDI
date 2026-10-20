# Architecture du système autonome

```
             ┌──────────────── VEILLE (hebdomadaire) ────────────────┐
             │ Google Trends · TikTok Creative Center · Amazon.ca     │
             │ Etsy · avis clients · prix concurrents                 │
             └───────────────┬────────────────────────────────────────┘
                             ▼
   config/products.toml ──► pdi/scoring.py ──► classement + prix suggéré
                             │  (rejet auto si marge après pub < 15 %
                             │   ou preuves de demande insuffisantes)
                             ▼
   ┌──────── CATALOGUE (quotidien) ────────┐       ┌──── PUBLICITÉ (quotidien) ────┐
   │ API fournisseur (CJ, Printify)        │       │ API Meta / TikTok             │
   │  → coût, stock, frais de port          │       │  → dépense, achats            │
   │  → pdi/economics.py recalcule le prix  │       │  → pdi/guardrails.py          │
   │  → mise à jour Shopify si écart ≤ 10 % │       │    CONTINUER / ARRÊTER /      │
   │    sinon alerte humaine                │       │    AUGMENTER (+20 %) /        │
   │  → produit masqué si rupture           │       │    ESCALADER (plafond atteint)│
   └────────────────────────────────────────┘       └───────────────────────────────┘

   ┌──────────────────── COMMANDES (en temps réel) ─────────────────────┐
   │ Webhook Shopify « commande payée »                                  │
   │  → pdi/guardrails.check_order : paiement capté ? risque fraude ?     │
   │     montant ou quantité anormaux ?                                   │
   │  → OK : commande créée chez le fournisseur (API)                     │
   │  → sinon : commande suspendue + alerte                               │
   │  → numéro de suivi récupéré → expédition confirmée au client          │
   │    (JAMAIS avant d'avoir un numéro de suivi réel)                    │
   │  → retard > délai annoncé : courriel au client + alerte               │
   └─────────────────────────────────────────────────────────────────────┘

   ┌──── PILOTAGE (quotidien / hebdomadaire) ────┐
   │ Chiffre d'affaires, commandes, panier moyen,│
   │ conversion, CAC, marge par produit, bénéfice│
   │ net estimé, pub, remboursements, retards,   │
   │ produits à renforcer / à retirer            │
   └─────────────────────────────────────────────┘
```

## Modules existants

| Fichier | Rôle |
|---|---|
| `config/settings.toml` | Frais, charges fixes, poids de notation, plafonds pub, règles de commande |
| `config/products.toml` | Produits candidats, preuves (avec type : observé / estimé / hypothèse), fournisseurs, réglementation, produits écartés |
| `pdi/economics.py` | Marge contributive réelle par commande, CPA d'équilibre, prix suggéré |
| `pdi/scoring.py` | Note sur 10 et classement, avec filtres éliminatoires |
| `pdi/guardrails.py` | Règles d'arrêt et de hausse des budgets pub ; contrôle des commandes avant transmission |
| `pdi/simulation.py` | Scénarios financiers mensuels |
| `pdi/__main__.py` | `python -m pdi classement | simulation | rapport` |
| `tests/` | Tests (`python -m unittest discover -s tests -t .`) |

## Modules à brancher (dès réception des accès)

| Module | Service | Variable d'environnement lue |
|---|---|---|
| `pdi/connectors/shopify.py` | API Admin GraphQL de Shopify | `SHOPIFY_STORE`, `SHOPIFY_ADMIN_TOKEN` |
| `pdi/connectors/cj.py` | API CJdropshipping | `CJ_API_KEY` |
| `pdi/connectors/printify.py` | API Printify | `PRINTIFY_TOKEN` |
| `pdi/connectors/meta_ads.py` | API Marketing de Meta | `META_ADS_TOKEN`, `META_AD_ACCOUNT_ID` |
| `pdi/content.py` | Rédaction des fiches : n'utilise **que** les champs fournis par le fournisseur ; aucun avis, certification ou résultat inventé | — |

## Règles de sécurité intégrées

- Plafonds pub en double : dans le code **et** dans le compte publicitaire (limite de dépense du compte).
- Toute dépense au-delà des plafonds, tout contrat, tout changement bancaire → décision humaine.
- Les clés d'API sont stockées comme secrets de l'environnement, jamais dans le dépôt.
- Données clients : transmises au fournisseur uniquement pour la livraison (nom, adresse, téléphone) ; photos de personnalisation supprimées après production.
