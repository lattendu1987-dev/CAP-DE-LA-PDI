# CAP-DE-LA-PDI

Système de commerce en ligne presque autonome : veille produits, notation, calcul des marges,
règles de dépense publicitaire, contrôle des commandes et simulation financière.

- **Plan de démarrage** : [`docs/PLAN.md`](docs/PLAN.md)
- **Chiffres générés par le moteur** : [`docs/rapport-chiffres.md`](docs/rapport-chiffres.md)
- **Architecture** : [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)

## Utilisation

Python 3.11+ sans dépendance externe.

```bash
python -m pdi classement   # classement des produits candidats
python -m pdi simulation   # scénarios financiers
python -m pdi rapport      # régénère docs/rapport-chiffres.md
python -m unittest discover -s tests -t .
```

Pour ajouter ou modifier un produit : éditer `config/products.toml`, puis relancer `python -m pdi rapport`.
