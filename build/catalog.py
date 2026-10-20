# -*- coding: utf-8 -*-
"""
CATALOGUE CAP DE LA PDI — source unique de toutes les données de la boutique.

Après toute modification : lancer  `python3 build/build.py`  depuis la racine du dépôt.
Le script régénère les fiches produits, le catalogue JavaScript et le plan du site.

Champs d'un produit
  id        identifiant unique, utilisé aussi dans l'adresse de la fiche (produits/<id>.html)
  cat       rayon (voir CATEGORIES)
  sub       sous-catégorie affichée au-dessus du nom
  name      nom du produit
  desc      phrase courte (cartes produits)
  details   points clés affichés sur la fiche produit
  price     prix en F CFA, ou None = « Prix sur devis »
  unit      unité de vente (dose, flacon, sac…)
  quote     True = passe par une demande de devis même avec un prix indiqué
  prefix    texte au-dessus du prix (ex. « À partir de »)
  options   variantes : texte simple, ou {"label":…, "price":…, "unit":…}
  imgs      photos (noms des fichiers de build/src sans extension). Vide = visuel temporaire
  fit       "contain" (photo détourée, défaut) ou "cover" (photo plein cadre)
  icon      pictogramme du visuel temporaire
  badge     étiquette mise en avant (« Nouveau », « Promo »…)
  featured  True = apparaît dans « Les incontournables » sur l'accueil
  new       True = apparaît dans « Nouveautés »
  oldPrice  ancien prix barré
  link      lien d'achat externe (Chariow) : paiement en ligne réel
  rx        True = délivré sur conseil vétérinaire
  stock     texte de disponibilité (sinon valeur par défaut selon le type)
"""

SITE = {
    "name": "CAP DE LA PDI",
    "legal_name": "Coopérative Agro-Pastorale de la Production Diverse des IPOLO",
    "url": "https://lattendu1987-dev.github.io/CAP-DE-LA-PDI/",
    "whatsapp": "33766551505",
    "whatsapp_display": "+33 7 66 55 15 05",
    "phones": [("+242050795618", "+242 05 079 56 18"), ("+242044383024", "+242 04 438 30 24")],
    "email": "la-pdi@hotmail.com",
    "address": "Quartier La Base, Avenue Félix TCHIKAYA, Pointe-Noire, République du Congo",
    "agrement": "0491/MAEP/DGA-DAPR",
    "niu": "M250000007537101",
    "group": "https://chat.whatsapp.com/HusaXUhaVfu4SBQWiqmLqY",
    "director": "IPOLO, Directeur Général",
}

# Points de retrait / dépôts (utilisés dans la commande, le pied de page et la page contact)
DEPOTS = [
    {"id": "la-base", "name": "Siège – La Base", "addr": "Avenue Félix TCHIKAYA, Pointe-Noire", "tel": None, "kind": "Siège"},
    {"id": "ngoyo", "name": "Dépôt Ngoyo", "addr": "Arrêt La Datcha, Pointe-Noire", "tel": ("+242067434310", "06 743 43 10"), "kind": "Dépôt"},
    {"id": "djeno", "name": "Dépôt Djeno", "addr": "Arrêt Supermarché, Djeno", "tel": ("+242067958233", "06 795 82 33"), "kind": "Dépôt"},
    {"id": "cote-mateve", "name": "Dépôt Côte Matève", "addr": "Côte Matève, Pointe-Noire", "tel": None, "kind": "Dépôt"},
]

HOURS = [("Lundi – vendredi", "8h00 – 12h00 · 13h30 – 17h00"), ("Samedi", "8h00 – 12h00"), ("Dimanche", "Fermé")]

# Options de livraison proposées à la commande (configurables)
DELIVERY = [
    {"id": "retrait", "label": "Retrait en dépôt", "desc": "Gratuit. Choisissez votre point de retrait ci-dessous.", "fee": 0},
    {"id": "livraison-pn", "label": "Livraison à Pointe-Noire", "desc": "Frais selon le quartier, communiqués avant validation.", "fee": None},
    {"id": "expedition", "label": "Expédition hors Pointe-Noire", "desc": "Brazzaville et autres villes : frais et délai communiqués sur devis.", "fee": None},
]

# Moyens de paiement acceptés (paiement après confirmation de la commande par notre équipe)
PAYMENTS = [
    {"id": "mtn", "label": "MTN Mobile Money"},
    {"id": "airtel", "label": "Airtel Money"},
    {"id": "virement", "label": "Virement bancaire (UBA)"},
    {"id": "especes", "label": "Espèces au dépôt"},
]

# Annonces de la barre supérieure (« until » = date de fin d'affichage, AAAA-MM-JJ)
ANNOUNCEMENTS = [
    {"text": "Nouveau : vaccin porc 3-en-1 de France — arrivage le 20 novembre, réservez avant le 13 novembre", "href": "produits/vaccin-3en1.html", "until": "2026-11-20"},
    {"text": "Suivi des Truies : 9 900 F au lieu de 15 000 F — téléchargement immédiat", "href": "produits/suivi-truies.html"},
    {"text": "Reproducteurs AXIOM : nouveaux tarifs négociés, fret et dédouanement inclus", "href": "boutique.html?cat=reproducteurs"},
    {"text": "Commandez en ligne, payez par MTN Mobile Money ou Airtel Money", "href": "livraison-retours.html"},
]

# Avis clients : n'ajoutez que de vrais avis, avec l'accord du client. La section reste masquée tant que la liste est vide.
TESTIMONIALS = [
    # {"name": "Prénom N.", "place": "Pointe-Noire", "text": "…"},
]

CATEGORIES = [
    {"id": "bovins", "label": "Semences bovines", "short": "Génétique bovine", "icon": "🐄", "img": "race-charolaise", "intro": "Taureaux sélectionnés GENES DIFFUSION, en semence conventionnelle ou sexée. Prix par dose."},
    {"id": "reproducteurs", "label": "Reproducteurs porcins", "short": "Reproducteurs AXIOM", "icon": "🐷", "img": "axiom-adenia", "intro": "Animaux vivants AXIOM de 30 à 59,9 kg, importés de France. Prix TTC : fret et dédouanement inclus. Enlèvement à l'aéroport aux frais de l'acheteur. Paiement : 80 % à la signature du devis, 20 % au plus tard 1 mois avant le départ."},
    {"id": "porcins", "label": "Semences porcines", "short": "Semences porcines", "icon": "🧬", "img": "axiom-duroc", "intro": "Lignées françaises GENES DIFFUSION / AXIOM, sur commande."},
    {"id": "sante", "label": "Santé animale", "short": "Santé animale", "icon": "💊", "img": "oxytetracycline", "intro": "Médicaments vétérinaires de notre partenaire ANIMAX et vaccins de France, délivrés sur conseil."},
    {"id": "repro", "label": "Insémination & reproduction", "short": "Matériel d'insémination", "icon": "🔬", "img": "race-montbeliarde", "intro": "Tout le matériel pour réussir vos inséminations."},
    {"id": "soins", "label": "Matériel vétérinaire", "short": "Matériel vétérinaire", "icon": "💉", "img": "seringue-automatique", "intro": "Pour soigner, vacciner, identifier et manipuler vos animaux."},
    {"id": "nutrition", "label": "Alimentation & nutrition", "short": "Alimentation", "icon": "🌾", "img": "pierre-a-lecher-vache", "intro": "Matières premières en sac, aliments, boosters et compléments minéraux."},
    {"id": "equipement", "label": "Équipement d'élevage", "short": "Équipement", "icon": "🏗️", "img": "cage-truie", "intro": "Fabrication d'aliment, pesée, logement, alimentation et hygiène."},
    {"id": "volailles", "label": "Volailles & œufs", "short": "Volailles & œufs", "icon": "🐔", "img": None, "intro": "Animaux vivants et œufs frais."},
    {"id": "services", "label": "Services techniques", "short": "Services", "icon": "🧑‍🔬", "img": None, "intro": "Nos techniciens se déplacent dans votre élevage."},
    {"id": "excel", "label": "Outils Excel", "short": "Outils Excel", "icon": "📊", "img": "calculateur", "intro": "Téléchargement immédiat après paiement en ligne sécurisé (MTN / Airtel Money) via Chariow."},
]

SEXEE = ["Sexée femelle", "Sexée mâle"]
AXIOM = "Prix TTC · 30 à 59,9 kg"
AXIOM_DETAILS = [
    "Animal vivant de 30 à 59,9 kg, sélectionné par AXIOM (France)",
    "Photo AXIOM d'illustration de la race",
    "Prix TTC : animal, fret et dédouanement inclus",
    "Enlèvement à l'aéroport du Congo aux frais de l'acheteur",
    "Paiement en 2 étapes : 80 % à la signature du devis, 20 % au plus tard 1 mois avant le départ",
]
SEMENCE_BOV = ["Semence de taureau sélectionné GENES DIFFUSION", "Prix par dose (paillette)", "Conservation dans l'azote liquide, livraison en cuve", "Insémination possible par nos techniciens"]

PRODUCTS = [
    # ===== Semences bovines =====
    {"id": "semence-holstein", "cat": "bovins", "sub": "Lait", "name": "Semence Holstein", "desc": "Race laitière n° 1 dans le monde.", "details": ["Très forte production laitière"] + SEMENCE_BOV, "price": 50000, "unit": "dose", "imgs": ["race-holstein"], "options": ["Sexée femelle"]},
    {"id": "semence-montbeliarde", "cat": "bovins", "sub": "Lait / mixte", "name": "Semence Montbéliarde", "desc": "Lait riche, robuste, bonne valeur bouchère.", "details": ["Race mixte : lait riche et bonne valeur bouchère", "Robuste et rustique"] + SEMENCE_BOV, "price": 50000, "unit": "dose", "imgs": ["race-montbeliarde"], "options": SEXEE},
    {"id": "semence-charolaise", "cat": "bovins", "sub": "Viande", "name": "Semence Charolaise", "desc": "Race à viande très musclée, croissance rapide.", "details": ["Croissance rapide, très bonne conformation", "Excellente en croisement pour améliorer les troupeaux locaux"] + SEMENCE_BOV, "price": 50000, "unit": "dose", "imgs": ["race-charolaise"], "options": SEXEE, "featured": True},
    {"id": "semence-limousine", "cat": "bovins", "sub": "Viande", "name": "Semence Limousine", "desc": "Carcasses de qualité, vêlages faciles.", "details": ["Carcasses de grande qualité", "Vêlages faciles, bonne rusticité"] + SEMENCE_BOV, "price": 50000, "unit": "dose", "imgs": ["race-limousine"], "options": SEXEE},
    {"id": "semence-blonde-aquitaine", "cat": "bovins", "sub": "Viande", "name": "Semence Blonde d'Aquitaine", "desc": "Format imposant, fort rendement en viande.", "details": ["Format imposant", "Fort rendement en viande"] + SEMENCE_BOV, "price": 50000, "unit": "dose", "imgs": ["race-blonde-aquitaine"], "options": SEXEE},
    {"id": "semence-brahman", "cat": "bovins", "sub": "Zébu – climat tropical", "name": "Semence Brahman", "desc": "Zébu résistant à la chaleur et aux tiques.", "details": ["Zébu très résistant à la chaleur et aux tiques", "Idéal en croisement en zone tropicale", "Semence conventionnelle"] + SEMENCE_BOV, "price": 45000, "unit": "dose", "imgs": ["race-brahman"], "featured": True},
    {"id": "semence-salers", "cat": "bovins", "sub": "Rustique", "name": "Semence Salers", "desc": "Race rustique, bonne mère.", "details": ["Race rustique, adaptée aux conditions difficiles", "Bonne mère", "Semence conventionnelle"] + SEMENCE_BOV, "price": 21000, "unit": "dose", "imgs": ["race-salers"]},
    {"id": "semence-angus", "cat": "bovins", "sub": "Viande", "name": "Semence Angus", "desc": "Viande persillée, vêlages faciles.", "details": ["Viande persillée", "Animaux sans cornes, vêlages faciles", "Semence conventionnelle"] + SEMENCE_BOV, "price": 16000, "unit": "dose", "imgs": ["race-angus"]},

    # ===== Reproducteurs porcins AXIOM (photos AXIOM d'illustration de la race) =====
    {"id": "cochette-adenia", "cat": "reproducteurs", "sub": "Cochette parentale – AXIOM", "badge": "Notre recommandation", "name": "Cochette Adénia (F1)", "tagline": "La cochette équilibrée", "desc": "Pour des porcelets lourds, nombreux, homogènes et rentables. 300 000 F de moins qu'une Large White ou Landrace.", "details": ["« La cochette équilibrée » : truie hybride F1 AXIOM", "Pour produire des porcelets lourds, nombreux, homogènes et rentables", "300 000 F de moins qu'une cochette Large White ou Landrace"] + AXIOM_DETAILS, "price": 985000, "unit": "animal", "quote": True, "prefix": AXIOM, "imgs": ["axiom-adenia"], "fit": "cover", "featured": True, "new": True},
    {"id": "cochette-large-white", "cat": "reproducteurs", "sub": "Cochette – AXIOM", "name": "Cochette Large White", "tagline": "Calme à la conduite facile", "desc": "Calme, à la conduite facile. Lignée maternelle de référence.", "details": ["« Calme à la conduite facile »", "Lignée maternelle de référence"] + AXIOM_DETAILS, "price": 1285000, "unit": "animal", "quote": True, "prefix": AXIOM, "imgs": ["axiom-large-white"], "fit": "cover", "new": True},
    {"id": "cochette-landrace", "cat": "reproducteurs", "sub": "Cochette – AXIOM", "name": "Cochette Landrace", "tagline": "Prolifique et robuste", "desc": "Prolifique et robuste.", "details": ["« Prolifique et robuste »", "Lignée maternelle : grandes portées"] + AXIOM_DETAILS, "price": 1285000, "unit": "animal", "quote": True, "prefix": AXIOM, "imgs": ["axiom-landrace"], "fit": "cover", "new": True},
    {"id": "cochette-duroc", "cat": "reproducteurs", "sub": "Cochette – AXIOM", "name": "Cochette Duroc", "tagline": "La qualité de la viande", "desc": "La qualité de la viande.", "details": ["« La qualité de la viande »", "Race rustique, bonne tolérance à la chaleur"] + AXIOM_DETAILS, "price": 1350000, "unit": "animal", "quote": True, "prefix": AXIOM, "imgs": ["axiom-duroc"], "fit": "cover", "new": True},
    {"id": "cochette-pietrain", "cat": "reproducteurs", "sub": "Cochette – AXIOM", "name": "Cochette Piétrain", "tagline": "L'indice et la conformation", "desc": "L'indice et la conformation.", "details": ["« L'indice et la conformation »", "Carcasses très musclées"] + AXIOM_DETAILS, "price": 1350000, "unit": "animal", "quote": True, "prefix": AXIOM, "imgs": ["axiom-pietrain"], "fit": "cover", "new": True},
    {"id": "verrat-thor", "cat": "reproducteurs", "sub": "Verrat – AXIOM", "badge": "Vigueur hybride", "name": "Verrat Thor", "tagline": "La vigueur hybride", "desc": "La vigueur hybride, déjà éprouvée chez nous au Congo.", "details": ["« La vigueur hybride » : verrat hybride AXIOM", "Déjà utilisé chez nous au Congo : la 2e photo montre un porcelet sevré issu de la génétique THOR"] + AXIOM_DETAILS, "price": 2440000, "unit": "animal", "quote": True, "prefix": AXIOM, "imgs": ["axiom-thor", "thor-porcelet", "thor-ferme"], "fit": "cover", "featured": True, "new": True},
    {"id": "verrat-valens", "cat": "reproducteurs", "sub": "Verrat – AXIOM", "name": "Verrat Valens", "tagline": "L'excellence validée", "desc": "L'excellence validée.", "details": ["« L'excellence validée »"] + AXIOM_DETAILS, "price": 2440000, "unit": "animal", "quote": True, "prefix": AXIOM, "imgs": ["axiom-valens"], "fit": "cover", "new": True},
    {"id": "verrat-pietrain-nn", "cat": "reproducteurs", "sub": "Verrat – AXIOM", "name": "Verrat Piétrain NN", "tagline": "L'indice et la conformation", "desc": "Verrat terminal très musclé, sans gène de stress.", "details": ["« L'indice et la conformation »", "Version NN : indemne du gène de sensibilité au stress, un atout en climat chaud"] + AXIOM_DETAILS, "price": 2245000, "unit": "animal", "quote": True, "prefix": AXIOM, "imgs": ["axiom-pietrain"], "fit": "cover", "new": True},
    {"id": "verrat-duroc", "cat": "reproducteurs", "sub": "Verrat – AXIOM", "name": "Verrat Duroc", "tagline": "La qualité de la viande", "desc": "La qualité de la viande, rustique et résistant à la chaleur.", "details": ["« La qualité de la viande »", "Verrat rustique, bonne tolérance à la chaleur"] + AXIOM_DETAILS, "price": 2245000, "unit": "animal", "quote": True, "prefix": AXIOM, "imgs": ["axiom-duroc"], "fit": "cover", "new": True},
    {"id": "verrat-large-white", "cat": "reproducteurs", "sub": "Verrat – AXIOM", "name": "Verrat Large White", "tagline": "Calme à la conduite facile", "desc": "Calme, à la conduite facile.", "details": ["« Calme à la conduite facile »"] + AXIOM_DETAILS, "price": 2245000, "unit": "animal", "quote": True, "prefix": AXIOM, "imgs": ["axiom-large-white"], "fit": "cover", "new": True},
    {"id": "verrat-landrace", "cat": "reproducteurs", "sub": "Verrat – AXIOM", "name": "Verrat Landrace", "tagline": "Prolifique et robuste", "desc": "Prolifique et robuste.", "details": ["« Prolifique et robuste »"] + AXIOM_DETAILS, "price": 2245000, "unit": "animal", "quote": True, "prefix": AXIOM, "imgs": ["axiom-landrace"], "fit": "cover", "new": True},

    # ===== Semences porcines =====
    {"id": "semence-porc-large-white", "cat": "porcins", "sub": "Lignée maternelle", "name": "Semence Large White", "desc": "Truies prolifiques, bonnes mères.", "details": ["Lignée maternelle : truies prolifiques et bonnes mères", "Croissance rapide"], "price": None, "unit": "dose", "imgs": ["axiom-large-white"], "fit": "cover"},
    {"id": "semence-porc-landrace", "cat": "porcins", "sub": "Lignée maternelle", "name": "Semence Landrace", "desc": "Grandes portées, bonne production laitière.", "details": ["Lignée maternelle : grandes portées", "Croisée avec la Large White, donne une truie F1 robuste"], "price": None, "unit": "dose", "imgs": ["axiom-landrace"], "fit": "cover"},
    {"id": "semence-porc-pietrain", "cat": "porcins", "sub": "Verrat terminal", "name": "Semence Piétrain NN", "desc": "Carcasses très musclées, sans gène de stress.", "details": ["Verrat terminal : carcasses très riches en muscle", "Version NN : indemne du gène de sensibilité au stress, un atout en climat chaud"], "price": None, "unit": "dose", "imgs": ["axiom-pietrain"], "fit": "cover"},
    {"id": "semence-porc-duroc", "cat": "porcins", "sub": "Verrat terminal", "name": "Semence Duroc", "desc": "Rustique, résiste à la chaleur, viande persillée.", "details": ["Verrat terminal rustique", "Bonne résistance à la chaleur", "Viande tendre et persillée"], "price": None, "unit": "dose", "imgs": ["axiom-duroc"], "fit": "cover"},

    # ===== Santé animale =====
    {"id": "vaccin-3en1", "cat": "sante", "sub": "Vaccin – produit de France", "badge": "Nouveau", "name": "Vaccin porc 3-en-1", "desc": "Une piqûre, trois protections : rouget, parvovirose, leptospirose.", "details": ["Rouget : fièvre, plaques rouges, avortements", "Parvovirose : momies, mises bas ratées, petites portées", "Leptospirose : avortements, porcelets faibles", "13 000 F par porc vacciné, primo-vaccination + rappel inclus", "Vente par flacon de 10 doses = 5 porcs protégés", "Arrivage au Congo le 20 novembre 2026 – réservez et payez avant le 13 novembre"], "price": 65000, "unit": "flacon de 10 doses", "imgs": ["vaccin-flacon", "vaccin-affiche"], "fit": "cover", "rx": True, "featured": True, "new": True, "stock": "Précommande – arrivage le 20 novembre 2026"},
    {"id": "oxytetracycline-20", "cat": "sante", "sub": "Antibiotique", "name": "Oxytétracycline 20 % injectable", "desc": "Antibiotique à large spectre. Flacon 100 ml.", "details": ["Antibiotique à large spectre", "Bovins, ovins, caprins, porcs, volailles", "Flacon de 100 ml – ANIMAX"], "price": 4500, "unit": "flacon", "imgs": ["oxytetracycline"], "fit": "cover", "rx": True, "featured": True},
    {"id": "tylosine-20", "cat": "sante", "sub": "Antibiotique", "name": "Tylosine 20 % injectable", "desc": "Infections respiratoires et digestives. Flacon 100 ml.", "details": ["Infections respiratoires et digestives", "Flacon de 100 ml – ANIMAX"], "price": 4500, "unit": "flacon", "imgs": ["tylosine"], "fit": "cover", "rx": True},
    {"id": "pen-strep", "cat": "sante", "sub": "Antibiotique", "name": "Pen-Strep injectable", "desc": "Pénicilline + streptomycine, large spectre.", "details": ["Association pénicilline + streptomycine", "Large spectre"], "price": 5000, "unit": "flacon", "icon": "💉", "rx": True},
    {"id": "ceftriaxone", "cat": "sante", "sub": "Antibiotique", "name": "Ceftriaxone", "desc": "Antibiotique injectable (céphalosporine).", "details": ["Antibiotique injectable de la famille des céphalosporines"], "price": 2500, "unit": "flacon", "icon": "💉", "rx": True},
    {"id": "sulfa-333", "cat": "sante", "sub": "Antibiotique", "name": "Sulfa 333 injectable", "desc": "Sulfamide injectable.", "details": ["Sulfamide injectable"], "price": 4500, "unit": "flacon", "icon": "💉", "rx": True},
    {"id": "flunixine", "cat": "sante", "sub": "Anti-inflammatoire", "name": "Flunixine injectable", "desc": "Contre la fièvre, la douleur et l'inflammation.", "details": ["Anti-inflammatoire injectable", "Contre la fièvre, la douleur et l'inflammation"], "price": 5000, "unit": "boîte", "icon": "💊", "rx": True},
    {"id": "ketoprofene", "cat": "sante", "sub": "Anti-inflammatoire", "name": "Kétoprofène", "desc": "Contre la fièvre, la douleur et l'inflammation.", "details": ["Anti-inflammatoire", "Contre la fièvre, la douleur et l'inflammation"], "price": 5000, "unit": "flacon", "icon": "💊", "rx": True},
    {"id": "ocytocine", "cat": "sante", "sub": "Hormone", "name": "Ocytocine", "desc": "Aide à la mise bas et à la descente du lait.", "details": ["Aide à la mise bas", "Favorise la descente du lait"], "price": 2500, "unit": "boîte", "icon": "💉", "rx": True},
    {"id": "ivermectine-1", "cat": "sante", "sub": "Antiparasitaire", "name": "Ivermectine 1 % injectable", "desc": "Vers, gale, poux, tiques. Flacon 100 ml.", "details": ["Parasites internes et externes : vers, gale, poux, tiques", "Flacon de 100 ml – ANIMAX"], "price": 4500, "unit": "flacon", "imgs": ["ivermectine"], "fit": "cover", "rx": True, "featured": True},
    {"id": "ivermectine-poudre", "cat": "sante", "sub": "Antiparasitaire", "name": "Ivermectine poudre", "desc": "Vermifuge en poudre.", "details": ["Vermifuge en poudre, en sachet"], "price": 3000, "unit": "sachet", "icon": "🪱", "rx": True},
    {"id": "levamisole-poudre", "cat": "sante", "sub": "Antiparasitaire", "name": "Lévamisole 20 % poudre soluble", "desc": "Vermifuge pour l'eau de boisson. Sachet 100 g.", "details": ["Vermifuge à diluer dans l'eau de boisson", "Porcs et volailles", "Sachet de 100 g – ANIMAX"], "price": 3000, "unit": "sachet", "imgs": ["levamisole-poudre"], "rx": True},
    {"id": "levamisole-injectable", "cat": "sante", "sub": "Antiparasitaire", "name": "Lévamisole 10 % injectable", "desc": "Vers digestifs et pulmonaires. Flacon 100 ml.", "details": ["Vermifuge contre les vers digestifs et pulmonaires", "Flacon de 100 ml – ANIMAX"], "price": None, "unit": "flacon", "imgs": ["levamisole-injectable"], "fit": "cover", "rx": True},
    {"id": "vermifuge-premium", "cat": "sante", "sub": "Antiparasitaire", "name": "Vermifuge Premium", "desc": "Vermifuge en sachet.", "details": ["Vermifuge en sachet"], "price": 3500, "unit": "sachet", "icon": "🪱"},
    {"id": "multivitamine", "cat": "sante", "sub": "Vitamines", "name": "Multivitamine injectable", "desc": "Croissance, fertilité, récupération. Flacon 100 ml.", "details": ["Soutient la croissance, la fertilité et la récupération", "Flacon de 100 ml – ANIMAX"], "price": 4500, "unit": "flacon", "imgs": ["multivitamine"], "fit": "cover"},
    {"id": "fer-dextran", "cat": "sante", "sub": "Minéraux", "name": "Fer dextran injectable", "desc": "Prévention de l'anémie des porcelets.", "details": ["Prévention de l'anémie des porcelets", "Flacon de 100 ml – ANIMAX"], "price": 5000, "unit": "flacon", "imgs": ["fer-dextran"], "fit": "cover", "featured": True},
    {"id": "vitamines-poudre", "cat": "sante", "sub": "Vitamines", "name": "Vitamines en poudre", "desc": "À mélanger dans l'eau ou l'aliment.", "details": ["À mélanger dans l'eau de boisson ou l'aliment"], "price": 2500, "unit": "sachet", "icon": "🧂"},
    {"id": "anti-diarrhee", "cat": "sante", "sub": "Digestif", "name": "Anti-diarrhée poudre", "desc": "Contre les diarrhées.", "details": ["Poudre contre les diarrhées"], "price": 3000, "unit": "sachet", "icon": "🧂"},
    {"id": "desinfectants", "cat": "sante", "sub": "Hygiène", "name": "Désinfectants", "desc": "Bâtiments et matériel d'élevage.", "details": ["Désinfection des bâtiments et du matériel d'élevage"], "price": None, "unit": "lot", "icon": "🧽"},
    {"id": "autre-produit-veterinaire", "cat": "sante", "sub": "Sur demande", "name": "Autre produit vétérinaire", "desc": "Un produit précis ? Nous le commandons pour vous.", "details": ["Indiquez le produit recherché dans le message de votre commande", "Nous vous répondons avec un devis"], "price": None, "unit": "lot", "icon": "📋"},

    # ===== Insémination & reproduction =====
    {"id": "detecteur-ovulation", "cat": "repro", "sub": "Détection des chaleurs", "name": "Détecteur d'ovulation", "desc": "Le bon moment pour inséminer. Batterie rechargeable.", "details": ["Détecte le moment des chaleurs pour inséminer au bon moment", "Universel : vaches, truies, brebis, juments, ânesses", "Mise en marche en un clic, lecture automatique", "Batterie rechargeable"], "price": None, "unit": "pièce", "imgs": ["detecteur-ovulation"], "new": True},
    {"id": "pipettes-insemination", "cat": "repro", "sub": "Insémination porcine", "name": "Pipettes d'insémination", "desc": "Vendues à l'unité.", "details": ["Pipettes d'insémination, vendues à l'unité"], "price": 2000, "unit": "unité", "icon": "🧪"},
    {"id": "support-pipettes", "cat": "repro", "sub": "Insémination porcine", "name": "Support de pipettes", "desc": "Vendu à l'unité.", "details": ["Support de pipettes, vendu à l'unité"], "price": 2000, "unit": "unité", "icon": "🧷"},
    {"id": "pistolet-flexia", "cat": "repro", "sub": "Insémination bovine", "name": "Pistolet universel Flexia", "desc": "Pistolet d'insémination bovine.", "details": ["Pistolet d'insémination bovine universel"], "price": 34000, "unit": "pièce", "icon": "🔫"},
    {"id": "gaine-universelle", "cat": "repro", "sub": "Consommable", "name": "Gaine universelle", "desc": "Vendue à l'unité.", "details": ["Gaine d'insémination universelle, à l'unité"], "price": 100, "unit": "unité", "icon": "🧪"},
    {"id": "chemise-sanitaire", "cat": "repro", "sub": "Consommable", "name": "Chemise sanitaire", "desc": "Vendue à l'unité.", "details": ["Chemise sanitaire pour gaine, à l'unité"], "price": 200, "unit": "unité", "icon": "🧪"},
    {"id": "gel-lubrifiant", "cat": "repro", "sub": "Consommable", "name": "Gel lubrifiant", "desc": "Pour l'insémination.", "details": ["Gel lubrifiant pour l'insémination"], "price": 6000, "unit": "flacon", "icon": "🧴"},
    {"id": "coupe-paillettes", "cat": "repro", "sub": "Accessoire", "name": "Coupe-paillettes", "desc": "Coupe nette des paillettes.", "details": ["Coupe nette et rapide des paillettes"], "price": 14500, "unit": "pièce", "icon": "✂️"},
    {"id": "lame-coupe-paillettes", "cat": "repro", "sub": "Accessoire", "name": "Lame coupe-paillettes", "desc": "Lame de rechange.", "details": ["Lame de rechange pour coupe-paillettes"], "price": 2500, "unit": "pièce", "icon": "✂️"},
    {"id": "ciseaux-mousse", "cat": "repro", "sub": "Accessoire", "name": "Ciseaux mousse 14 cm", "desc": "Bouts arrondis.", "details": ["Ciseaux à bouts arrondis, 14 cm"], "price": 5500, "unit": "pièce", "icon": "✂️"},
    {"id": "pince-brucelle", "cat": "repro", "sub": "Accessoire", "name": "Pince brucelle 16 cm", "desc": "Manipulation des paillettes.", "details": ["Pince pour manipuler les paillettes, 16 cm"], "price": 12500, "unit": "pièce", "icon": "🔧"},
    {"id": "decongelateur", "cat": "repro", "sub": "Équipement", "name": "Décongélateur 12-220 V", "desc": "Décongélation des paillettes, secteur ou batterie.", "details": ["Décongélation des paillettes à bonne température", "Fonctionne sur secteur (220 V) ou batterie (12 V)"], "price": 364500, "unit": "pièce", "icon": "🌡️"},
    {"id": "cuve-azote-et34", "cat": "repro", "sub": "Équipement", "name": "Cuve azote ET 34", "desc": "Conservation des semences dans l'azote liquide.", "details": ["Conservation des semences dans l'azote liquide"], "price": 830000, "unit": "pièce", "icon": "🛢️"},
    {"id": "hormones-synchronisation", "cat": "repro", "sub": "Hormones", "name": "Hormones de synchronisation", "desc": "Synchronisation des chaleurs (PRID…).", "details": ["Synchronisation des chaleurs (PRID…)", "Sur conseil technique"], "price": None, "unit": "lot", "icon": "💉", "rx": True},

    # ===== Matériel vétérinaire =====
    {"id": "seringue-automatique", "cat": "soins", "sub": "Injection", "name": "Seringue automatique doseuse", "desc": "Vaccinations en série, dose réglable.", "details": ["Vaccinations et traitements en série", "Dose réglable", "Se fixe directement sur le flacon"], "price": None, "unit": "pièce", "imgs": ["seringue-automatique"], "new": True},
    {"id": "aiguilles-veterinaires", "cat": "soins", "sub": "Injection", "name": "Aiguilles vétérinaires en fer", "desc": "Réutilisables, plusieurs calibres.", "details": ["Aiguilles réutilisables", "Plusieurs calibres disponibles", "Vendues à l'unité"], "price": 500, "unit": "unité", "imgs": ["aiguilles"]},
    {"id": "thermometre-numerique", "cat": "soins", "sub": "Diagnostic", "name": "Thermomètre numérique", "desc": "Prise de température rapide.", "details": ["Prise de température rapide de vos animaux"], "price": 5000, "unit": "pièce", "icon": "🌡️"},
    {"id": "petites-piles", "cat": "soins", "sub": "Accessoire", "name": "Petites piles", "desc": "Pour thermomètre et petits appareils.", "details": ["Petites piles pour thermomètre et petits appareils"], "price": 200, "unit": "unité", "icon": "🔋"},
    {"id": "boucles-identification", "cat": "soins", "sub": "Identification", "name": "Boucles d'identification", "desc": "Pour identifier vos animaux.", "details": ["Identification de vos animaux", "Grande boucle : 500 F – petite boucle : 300 F"], "price": 500, "unit": "unité", "icon": "🏷️",
     "options": [{"label": "Grande boucle", "price": 500}, {"label": "Petite boucle", "price": 300}]},
    {"id": "lasso-contention", "cat": "soins", "sub": "Contention", "name": "Lasso de contention pour porcs", "desc": "Immobilise le porc pendant les soins.", "details": ["Câble acier et poignée en T", "Immobilise le porc pendant les soins et les injections"], "price": 10000, "unit": "pièce", "imgs": ["lasso-contention"], "featured": True},

    # ===== Alimentation & nutrition =====
    {"id": "son-fin", "cat": "nutrition", "sub": "Matière première", "name": "Son fin", "desc": "En sac de 30 ou 40 kg.", "details": ["Sac de 30 kg : 2 500 F", "Sac de 40 kg : 3 000 F"], "price": 2500, "unit": "sac", "icon": "🌾",
     "options": [{"label": "Sac 30 kg", "price": 2500}, {"label": "Sac 40 kg", "price": 3000}]},
    {"id": "tourteau-palmiste", "cat": "nutrition", "sub": "Matière première", "name": "Tourteau de palmiste", "desc": "Sac de 50 kg.", "details": ["Sac de 50 kg"], "price": 8000, "unit": "sac", "icon": "🌴"},
    {"id": "huile-de-palme", "cat": "nutrition", "sub": "Matière première", "name": "Huile de palme", "desc": "Énergie pour vos formules d'aliment.", "details": ["Source d'énergie pour vos formules d'aliment", "Vendue au litre"], "price": 1000, "unit": "litre", "icon": "🫒"},
    {"id": "aliments-porcins", "cat": "nutrition", "sub": "Aliment complet", "name": "Aliments porcins", "desc": "Porcelet, croissance, porc unique, truie allaitante.", "details": ["Aliment porcelet, croissance, porc unique et truie allaitante", "Disponibles dans nos dépôts"], "price": None, "unit": "sac", "icon": "🐖"},
    {"id": "aliments-volailles", "cat": "nutrition", "sub": "Aliment complet", "name": "Aliments volailles", "desc": "Démarrage, poulette, ponte.", "details": ["Aliment démarrage, poulette et ponte", "Disponibles dans nos dépôts"], "price": None, "unit": "sac", "icon": "🐔"},
    {"id": "aliments-ruminants", "cat": "nutrition", "sub": "Aliment complet", "name": "Aliments ruminants", "desc": "Bovins, ovins, caprins.", "details": ["Pour bovins, ovins et caprins"], "price": None, "unit": "sac", "icon": "🐄"},
    {"id": "booster-croissance-porc", "cat": "nutrition", "sub": "Booster", "name": "Booster Croissance Porc", "desc": "Pour une croissance plus rapide.", "details": ["Favorise une croissance plus rapide des porcs"], "price": 2500, "unit": "sachet", "icon": "📈"},
    {"id": "booster-lait-truie", "cat": "nutrition", "sub": "Booster", "name": "Booster Lait Truie", "desc": "Soutient la production de lait.", "details": ["Soutient la production de lait des truies"], "price": 2500, "unit": "sachet", "icon": "🍼"},
    {"id": "booster-probiotique-porc", "cat": "nutrition", "sub": "Booster", "name": "Booster Probiotique Porc", "desc": "Favorise une bonne digestion.", "details": ["Probiotique : favorise une bonne digestion"], "price": 2000, "unit": "sachet", "icon": "🦠"},
    {"id": "bio-earn", "cat": "nutrition", "sub": "Complément", "name": "Bio Earn", "desc": "Complément pour l'élevage.", "details": ["Complément pour l'élevage", "Demandez conseil à nos techniciens pour l'utilisation"], "price": 2000, "unit": "sachet", "icon": "🧂"},
    {"id": "pierres-a-lecher", "cat": "nutrition", "sub": "Complément minéral", "name": "Pierres à lécher minérales", "desc": "Sel enrichi en minéraux et oligo-éléments.", "details": ["Sel enrichi en minéraux et oligo-éléments", "Pour bovins, ovins et caprins", "Les animaux se servent selon leurs besoins"], "price": None, "unit": "bloc", "imgs": ["pierres-a-lecher", "pierre-a-lecher-vache"], "fit": "cover"},
    {"id": "croquettes-chien-premium", "cat": "nutrition", "sub": "Animaux de compagnie", "name": "Croquettes chien Premium 20 kg", "desc": "28 % de protéines, 13 % de matières grasses.", "details": ["Marque Haisenpet, sac de 20 kg", "Tous âges, goût mixte", "28 % de protéines, 13 % de matières grasses"], "price": None, "unit": "sac", "imgs": ["croquettes-chien"]},
    {"id": "booster-chien", "cat": "nutrition", "sub": "Animaux de compagnie", "name": "Booster Chien", "desc": "Complément pour chiens.", "details": ["Complément pour chiens, en boîte"], "price": 10000, "unit": "boîte", "icon": "🐕"},

    # ===== Équipement d'élevage =====
    {"id": "broyeur-melangeur", "cat": "equipement", "sub": "Fabrication d'aliment", "name": "Broyeur-mélangeur d'aliment", "desc": "Fabriquez votre propre aliment à la ferme.", "details": ["Broie et mélange vos matières premières", "Pour fabriquer votre propre aliment à la ferme"], "price": None, "unit": "machine", "imgs": ["broyeur-melangeur"], "fit": "cover", "featured": True},
    {"id": "balance-plateforme", "cat": "equipement", "sub": "Pesée", "name": "Balance plateforme électronique", "desc": "Animaux, sacs et aliment, afficheur digital.", "details": ["Pesée des animaux, des sacs et de l'aliment", "Afficheur digital"], "price": None, "unit": "pièce", "imgs": ["balance-plateforme"]},
    {"id": "cage-truie", "cat": "equipement", "sub": "Logement des truies", "name": "Cage pour truie (case de gestation)", "desc": "Acier galvanisé, auge individuelle.", "details": ["Acier galvanisé avec auge individuelle", "Longueur 220 cm, hauteur 100 cm", "Largeur 60 ou 70 cm"], "price": None, "unit": "cage", "imgs": ["cage-truie"], "options": ["Largeur 60 cm", "Largeur 70 cm"], "new": True},
    {"id": "nourrisseur-inox", "cat": "equipement", "sub": "Alimentation", "name": "Nourrisseur inox pour porcs", "desc": "Trémie inox à plusieurs places.", "details": ["Trémie en acier inoxydable à plusieurs places", "Solide et facile à nettoyer"], "price": None, "unit": "pièce", "imgs": ["nourrisseur-inox"]},
    {"id": "bottes-elevage", "cat": "equipement", "sub": "Hygiène & sécurité", "name": "Bottes d'élevage", "desc": "Caoutchouc imperméable, semelle antidérapante.", "details": ["Caoutchouc imperméable", "Semelle antidérapante", "De 5 000 à 10 000 F selon le modèle", "Pointures 39 à 46"], "price": 5000, "unit": "paire", "quote": True, "prefix": "Selon modèle, à partir de", "imgs": ["bottes"], "fit": "cover", "options": ["Pointure %d" % n for n in range(39, 47)]},
    {"id": "pelette", "cat": "equipement", "sub": "Petit matériel", "name": "Pelette", "desc": "Petite pelle pour l'aliment et le nettoyage.", "details": ["Petite pelle pour l'aliment et le nettoyage"], "price": 2500, "unit": "pièce", "icon": "🧹"},
    {"id": "tendeur", "cat": "equipement", "sub": "Petit matériel", "name": "Tendeur", "desc": "Vendu à l'unité.", "details": ["Tendeur, vendu à l'unité"], "price": 750, "unit": "unité", "icon": "🪢"},

    # ===== Volailles & œufs =====
    {"id": "poussin", "cat": "volailles", "sub": "Animal vivant", "name": "Poussin", "desc": "Vendu à l'unité.", "details": ["Poussin vendu à l'unité"], "price": 1500, "unit": "unité", "icon": "🐣"},
    {"id": "poule", "cat": "volailles", "sub": "Animal vivant", "name": "Poule", "desc": "Vendue à l'unité.", "details": ["Poule vendue à l'unité"], "price": 3000, "unit": "unité", "icon": "🐔"},
    {"id": "coq", "cat": "volailles", "sub": "Animal vivant", "name": "Coq", "desc": "Vendu à l'unité.", "details": ["Coq vendu à l'unité"], "price": 7000, "unit": "unité", "icon": "🐓"},
    {"id": "canard", "cat": "volailles", "sub": "Animal vivant", "name": "Canard", "desc": "Vendu à l'unité.", "details": ["Canard vendu à l'unité"], "price": 8000, "unit": "unité", "icon": "🦆"},
    {"id": "oeufs", "cat": "volailles", "sub": "Œufs frais", "name": "Œufs", "desc": "À l'unité ou à la palette.", "details": ["Palette : 3 000 F", "À l'unité : 100 F"], "price": 3000, "unit": "palette", "icon": "🥚",
     "options": [{"label": "Palette", "price": 3000, "unit": "palette"}, {"label": "À l'unité", "price": 100, "unit": "œuf"}]},

    # ===== Services =====
    {"id": "insemination-bovine", "cat": "services", "sub": "Insémination bovine", "name": "Intervention technicien – insémination bovine", "desc": "Protocole complet sur votre ferme.", "details": ["Présélection des femelles", "Pose et retrait des PRID", "Inséminations", "35 € (22 958 F) par femelle, tout compris", "Hors devis : transport, hébergement et repas du technicien", "Semences, hormones et matériel non inclus"], "price": 22958, "unit": "femelle", "quote": True, "icon": "🧑‍🔬", "stock": "Intervention planifiée sur devis"},
    {"id": "insemination-porcine", "cat": "services", "sub": "Insémination porcine", "name": "Insémination porcine", "desc": "Réalisée ou encadrée par nos techniciens.", "details": ["Insémination réalisée ou encadrée par nos techniciens"], "price": None, "unit": "truie", "icon": "🧑‍🔬", "stock": "Intervention planifiée sur devis"},
    {"id": "formation-eleveurs", "cat": "services", "sub": "Formation", "name": "Formation des éleveurs", "desc": "Insémination, alimentation, conduite d'élevage.", "details": ["Insémination artificielle", "Alimentation et fabrication d'aliment", "Conduite d'élevage"], "price": None, "unit": "session", "icon": "🎓", "stock": "Sessions organisées sur demande"},

    # ===== Outils Excel (paiement en ligne réel sur Chariow) =====
    {"id": "calculateur-aliment-porc", "cat": "excel", "sub": "Fichier Excel", "badge": "Prix de lancement", "name": "Calculateur Aliment Porc", "desc": "5 formules équilibrées, coût au kg et au sac.", "details": ["5 formules : porcelet 2e âge, croissance (25-60 kg), finition, truie gestante, truie allaitante", "Avec les matières premières disponibles chez nous : maïs, tourteau de soja 49 %, son de blé, tourteau de palmiste, farine de poisson, prémix 1 %", "Vous saisissez la quantité (50 kg, 500 kg, 1 tonne…) et vos prix d'achat", "Le fichier donne le poids exact de chaque ingrédient, le coût au kg et au sac de 50 kg", "Contrôle automatique de l'équilibre de l'aliment", "Fonctionne sur téléphone et ordinateur"], "price": 14900, "unit": "fichier", "imgs": ["calculateur", "calculateur-banniere"], "link": "https://boghdxow.mychariow.com/prd_txlatneq", "featured": True, "stock": "Téléchargement immédiat après paiement"},
    {"id": "suivi-truies", "cat": "excel", "sub": "Fichier Excel", "badge": "Promo", "name": "Suivi des Truies", "desc": "Chaleurs, mises bas, truies rentables, consanguinité.", "details": ["Calcule automatiquement les dates de chaleurs et de mise bas", "Classe vos truies, de la plus rentable à la moins rentable", "Alertes de consanguinité", "Simple, en français, sur téléphone ou ordinateur"], "price": 9900, "oldPrice": 15000, "unit": "fichier", "imgs": ["suivi-truies", "suivi-truies-banniere"], "link": "https://boghdxow.mychariow.com/prd_xmkoxo9e", "featured": True, "stock": "Téléchargement immédiat après paiement"},
]
