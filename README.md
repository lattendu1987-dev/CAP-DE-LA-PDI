# CAP DE LA PDI – Site & boutique en ligne

Site de la Coopérative Agro-Pastorale de la Production Diverse des IPOLO (Pointe-Noire, Congo).
En ligne : https://lattendu1987-dev.github.io/CAP-DE-LA-PDI/

## Modifier les produits, prix, dépôts, annonces
Tout se trouve dans **`build/catalog.py`** (un produit = une ligne). Ensuite :

```
python3 build/build.py
```

Le script régénère les fiches produits (`produits/`), le catalogue (`assets/js/catalog.js`), les images WebP (`assets/img/`) et le plan du site (`sitemap.xml`).

- **Ajouter une photo** : déposez-la dans `build/src/` (ex. `mon-produit.jpg`) puis indiquez `"imgs": ["mon-produit"]` sur le produit.
- **Visuel temporaire** : un produit sans `imgs` affiche un visuel « Visuel temporaire » à remplacer.
- **Avis clients** : liste `TESTIMONIALS` (la section reste masquée tant qu'elle est vide). N'ajoutez que de vrais avis.
- **Annonces de la barre supérieure** : liste `ANNOUNCEMENTS` (date de fin facultative).
- **Pages de contenu** (accueil, à propos, CGV…) : `build/pages/`.

## Commandes et paiements
- Le panier est enregistré dans le navigateur du client.
- La commande est envoyée réellement par WhatsApp (+33 7 66 55 15 05) ou par e-mail (la-pdi@hotmail.com) ; le paiement se fait après confirmation par l'équipe (Mobile Money, virement, espèces).
- Les fichiers Excel se paient en ligne sur Chariow.

## Structure
- `index.html`, `boutique.html`, `commande.html`, pages d'information : générées
- `assets/css/main.css` : design
- `assets/js/app.js` (commun), `home.js`, `boutique.js`, `product.js`, `checkout.js`
