/* ==========================================================
   CAP DE LA PDI – Boutique en ligne (panier + commande / devis)
   ----------------------------------------------------------
   Pour modifier un prix ou ajouter un produit, éditez la liste
   PRODUCTS ci-dessous.
   - price   : nombre en F CFA, ou null pour « Prix sur devis »
   - quote   : true → le produit part dans la demande de devis
               (même s'il a un prix indiqué)
   - options : variantes. Texte simple, ou { label, price } quand
               chaque variante a son propre prix.
   - badge   : petite étiquette mise en avant (ex. "Recommandé")
   - oldPrice: ancien prix barré
   Source des prix : grille tarifaire officielle (juillet 2026),
   factures et tarifs AXIOM. Les produits vendus au kg ne sont
   volontairement pas en ligne.
   ========================================================== */

const WHATSAPP = "33766551505";
const EMAIL = "la-pdi@hotmail.com";

// Vaccin porc 3-en-1 : précommande (dates affichées dans le bandeau)
const VACCIN = { reserveAvant: "2026-11-13", arrivage: "2026-11-20" };

// Rayons de la boutique (ordre d'affichage)
const CATEGORIES = [
  { id: "all", label: "Tout", icon: "🛒" },
  { id: "bovins", label: "Semences bovines", icon: "🐄", intro: "Taureaux sélectionnés GENES DIFFUSION. Prix par dose." },
  { id: "porcins", label: "Semences porcines", icon: "🐖", intro: "Lignées françaises GENES DIFFUSION / AXIOM." },
  { id: "reproducteurs", label: "Reproducteurs porcins", icon: "🐷", intro: "Animaux vivants AXIOM de 30 à 59,9 kg, importés de France. Prix TTC : fret et dédouanement inclus. Enlèvement à l'aéroport aux frais de l'acheteur. Paiement : 80 % à la signature du devis, 20 % au plus tard 1 mois avant le départ." },
  { id: "repro", label: "Insémination & reproduction", icon: "🔬", intro: "Tout le matériel pour réussir vos inséminations." },
  { id: "sante", label: "Santé animale", icon: "💊", intro: "Médicaments vétérinaires de notre partenaire ANIMAX et vaccins de France." },
  { id: "soins", label: "Matériel vétérinaire", icon: "💉", intro: "Pour soigner, vacciner, identifier et manipuler vos animaux." },
  { id: "nutrition", label: "Alimentation & nutrition", icon: "🌾", intro: "Matières premières en sac, aliments, boosters et compléments." },
  { id: "equipement", label: "Équipement d'élevage", icon: "🏗️", intro: "Fabrication d'aliment, pesée, logement, alimentation et hygiène." },
  { id: "volailles", label: "Volailles & œufs", icon: "🐔", intro: "Animaux vivants et œufs frais." },
  { id: "services", label: "Services", icon: "🧑‍🔬", intro: "Nos techniciens se déplacent dans votre élevage." },
  { id: "excel", label: "Outils Excel", icon: "📊", intro: "Téléchargement immédiat, paiement MTN / Airtel Money via Chariow." },
];

const SEXEE = ["Sexée femelle", "Sexée mâle"];
const P = "images/produits/";
const AXIOM = "Prix TTC · 30 à 59,9 kg";

const PRODUCTS = [
  // ===== Semences bovines (prix par dose) =====
  { id: "holstein", cat: "bovins", sub: "Lait", name: "Semence Holstein", desc: "Race laitière n° 1 dans le monde.", price: 50000, unit: "dose", img: "images/race-holstein.jpg", options: ["Sexée femelle"] },
  { id: "montbeliarde", cat: "bovins", sub: "Lait / mixte", name: "Semence Montbéliarde", desc: "Lait riche, robuste, bonne valeur bouchère.", price: 50000, unit: "dose", img: "images/race-montbeliarde.jpg", options: SEXEE },
  { id: "charolaise", cat: "bovins", sub: "Viande", name: "Semence Charolaise", desc: "Race à viande très musclée, croissance rapide.", price: 50000, unit: "dose", img: "images/race-charolaise.jpg", options: SEXEE },
  { id: "limousine", cat: "bovins", sub: "Viande", name: "Semence Limousine", desc: "Carcasses de qualité, vêlages faciles.", price: 50000, unit: "dose", img: "images/race-limousine.jpg", options: SEXEE },
  { id: "blonde", cat: "bovins", sub: "Viande", name: "Semence Blonde d'Aquitaine", desc: "Format imposant, fort rendement en viande.", price: 50000, unit: "dose", img: "images/race-blonde-aquitaine.jpg", options: SEXEE },
  { id: "brahman", cat: "bovins", sub: "Zébu – climat tropical", name: "Semence Brahman", desc: "Zébu résistant à la chaleur et aux tiques.", price: 45000, unit: "dose", img: "images/race-brahman.jpg" },
  { id: "salers", cat: "bovins", sub: "Rustique", name: "Semence Salers", desc: "Race rustique, bonne mère.", price: 21000, unit: "dose", img: "images/race-salers.jpg" },
  { id: "angus", cat: "bovins", sub: "Viande", name: "Semence Angus", desc: "Viande persillée, vêlages faciles.", price: 16000, unit: "dose", img: "images/race-angus.jpg" },

  // ===== Semences porcines (sur devis) =====
  { id: "porc-lw", cat: "porcins", sub: "Lignée maternelle", name: "Semence Large White", desc: "Truies prolifiques, bonnes mères.", price: null, unit: "dose", icon: "🐖" },
  { id: "porc-landrace", cat: "porcins", sub: "Lignée maternelle", name: "Semence Landrace", desc: "Grandes portées, bonne production laitière.", price: null, unit: "dose", icon: "🐖" },
  { id: "porc-pietrain", cat: "porcins", sub: "Verrat terminal", name: "Semence Piétrain NN", desc: "Carcasses très musclées, sans gène de stress.", price: null, unit: "dose", icon: "🐖" },
  { id: "porc-duroc", cat: "porcins", sub: "Verrat terminal", name: "Semence Duroc", desc: "Rustique, résiste à la chaleur, viande persillée.", price: null, unit: "dose", icon: "🐖" },

  // ===== Reproducteurs porcins vivants AXIOM (importation, sur devis) =====
  { id: "adenia", cat: "reproducteurs", sub: "Cochette – AXIOM", badge: "Notre recommandation", name: "Cochette Adénia (F1)", desc: "Truie hybride prolifique et robuste : 300 000 F de moins qu'une cochette Large White ou Landrace.", price: 985000, unit: "animal", quote: true, prefix: AXIOM, icon: "🐷" },
  { id: "cochette-pure", cat: "reproducteurs", sub: "Cochette – AXIOM", name: "Cochette de race pure", desc: "Choisissez la race. Femelles sélectionnées en France.", price: 1285000, unit: "animal", quote: true, prefix: AXIOM, icon: "🐷",
    options: [{ label: "Large White", price: 1285000 }, { label: "Landrace", price: 1285000 }, { label: "Duroc", price: 1350000 }, { label: "Piétrain", price: 1350000 }] },
  { id: "verrat-thor", cat: "reproducteurs", sub: "Verrat – AXIOM", badge: "Vigueur hybride", name: "Verrat Thor", desc: "Verrat hybride recommandé pour des porcelets vigoureux. Déjà éprouvé chez nous au Congo (photo : porcelet sevré THOR).", price: 2440000, unit: "animal", quote: true, prefix: AXIOM, img: P + "porcelet-thor.jpg", fit: "cover" },
  { id: "verrat-pur", cat: "reproducteurs", sub: "Verrat – AXIOM", name: "Verrat reproducteur", desc: "Choisissez la race. Mâles sélectionnés en France.", price: 2245000, unit: "animal", quote: true, prefix: AXIOM, icon: "🐖",
    options: [{ label: "Large White", price: 2245000 }, { label: "Landrace", price: 2245000 }, { label: "Duroc", price: 2245000 }, { label: "Piétrain NN", price: 2245000 }, { label: "Valens", price: 2440000 }] },

  // ===== Insémination & reproduction =====
  { id: "detecteur", cat: "repro", sub: "Détection des chaleurs", name: "Détecteur d'ovulation", desc: "Indique le meilleur moment pour inséminer. Vaches, truies, brebis, juments. Batterie rechargeable.", price: null, unit: "pièce", img: P + "detecteur-ovulation.jpg" },
  { id: "pipettes-ia", cat: "repro", sub: "Insémination porcine", name: "Pipettes d'insémination", desc: "Vendues à l'unité.", price: 2000, unit: "unité", icon: "🧪" },
  { id: "supports-pipettes", cat: "repro", sub: "Insémination porcine", name: "Support de pipettes", desc: "Vendu à l'unité.", price: 2000, unit: "unité", icon: "🧷" },
  { id: "pistolet", cat: "repro", sub: "Insémination bovine", name: "Pistolet universel Flexia", desc: "Pistolet d'insémination bovine.", price: 34000, unit: "pièce", icon: "🔫" },
  { id: "gaine", cat: "repro", sub: "Consommable", name: "Gaine universelle", desc: "Vendue à l'unité.", price: 100, unit: "unité", icon: "🧪" },
  { id: "chemise", cat: "repro", sub: "Consommable", name: "Chemise sanitaire", desc: "Vendue à l'unité.", price: 200, unit: "unité", icon: "🧪" },
  { id: "gel", cat: "repro", sub: "Consommable", name: "Gel lubrifiant", desc: "Pour l'insémination.", price: 6000, unit: "flacon", icon: "🧴" },
  { id: "coupe-paillettes", cat: "repro", sub: "Accessoire", name: "Coupe-paillettes", desc: "Coupe nette des paillettes.", price: 14500, unit: "pièce", icon: "✂️" },
  { id: "lame", cat: "repro", sub: "Accessoire", name: "Lame coupe-paillettes", desc: "Lame de rechange.", price: 2500, unit: "pièce", icon: "✂️" },
  { id: "ciseaux", cat: "repro", sub: "Accessoire", name: "Ciseaux mousse 14 cm", desc: "Bouts arrondis.", price: 5500, unit: "pièce", icon: "✂️" },
  { id: "pince", cat: "repro", sub: "Accessoire", name: "Pince brucelle 16 cm", desc: "Manipulation des paillettes.", price: 12500, unit: "pièce", icon: "🔧" },
  { id: "decongelateur", cat: "repro", sub: "Équipement", name: "Décongélateur 12-220 V", desc: "Décongélation des paillettes, sur secteur ou batterie.", price: 364500, unit: "pièce", icon: "🌡️" },
  { id: "cuve", cat: "repro", sub: "Équipement", name: "Cuve azote ET 34", desc: "Conservation des semences dans l'azote liquide.", price: 830000, unit: "pièce", icon: "🛢️" },
  { id: "hormones", cat: "repro", sub: "Hormones", name: "Hormones de synchronisation", desc: "Synchronisation des chaleurs (PRID…). Sur conseil technique.", price: null, unit: "lot", icon: "💉", rx: true },

  // ===== Santé animale =====
  // Vaccin
  { id: "vaccin-3en1", cat: "sante", sub: "Vaccin – produit de France", badge: "Nouveau", name: "Vaccin porc 3-en-1", desc: "Une piqûre, trois protections : rouget, parvovirose, leptospirose. 13 000 F par porc vacciné, primo-vaccination + rappel inclus. Flacon de 10 doses = 5 porcs protégés.", price: 65000, unit: "flacon de 10 doses", img: P + "vaccin-3en1.jpg", fit: "cover", rx: true },
  // Antibiotiques
  { id: "oxytetracycline", fit: "cover", cat: "sante", sub: "Antibiotique", name: "Oxytétracycline 20 % injectable", desc: "Antibiotique à large spectre. Bovins, ovins, caprins, porcs, volailles. Flacon 100 ml.", price: 4500, unit: "flacon", img: P + "oxytetracycline.jpg", rx: true },
  { id: "tylosine", fit: "cover", cat: "sante", sub: "Antibiotique", name: "Tylosine 20 % injectable", desc: "Infections respiratoires et digestives. Flacon 100 ml.", price: 4500, unit: "flacon", img: P + "tylosine.jpg", rx: true },
  { id: "penstrep", cat: "sante", sub: "Antibiotique", name: "Pen-Strep injectable", desc: "Pénicilline + streptomycine, large spectre.", price: 5000, unit: "flacon", icon: "💉", rx: true },
  { id: "ceftriaxone", cat: "sante", sub: "Antibiotique", name: "Ceftriaxone", desc: "Antibiotique injectable de la famille des céphalosporines.", price: 2500, unit: "flacon", icon: "💉", rx: true },
  { id: "sulfa-333", cat: "sante", sub: "Antibiotique", name: "Sulfa 333 injectable", desc: "Sulfamide injectable.", price: 4500, unit: "flacon", icon: "💉", rx: true },
  // Anti-inflammatoires & hormones
  { id: "flunixin", cat: "sante", sub: "Anti-inflammatoire", name: "Flunixine injectable", desc: "Contre la fièvre, la douleur et l'inflammation.", price: 5000, unit: "boîte", icon: "💊", rx: true },
  { id: "ketoprofene", cat: "sante", sub: "Anti-inflammatoire", name: "Kétoprofène", desc: "Contre la fièvre, la douleur et l'inflammation.", price: 5000, unit: "flacon", icon: "💊", rx: true },
  { id: "ocytocine", cat: "sante", sub: "Hormone", name: "Ocytocine", desc: "Aide à la mise bas et à la descente du lait.", price: 2500, unit: "boîte", icon: "💉", rx: true },
  // Antiparasitaires
  { id: "ivermectine", fit: "cover", cat: "sante", sub: "Antiparasitaire", name: "Ivermectine 1 % injectable", desc: "Parasites internes et externes : vers, gale, poux, tiques. Flacon 100 ml.", price: 4500, unit: "flacon", img: P + "ivermectine.jpg", rx: true },
  { id: "ivermectine-poudre", cat: "sante", sub: "Antiparasitaire", name: "Ivermectine poudre", desc: "Vermifuge en poudre.", price: 3000, unit: "sachet", icon: "🪱", rx: true },
  { id: "levamisole-poudre", cat: "sante", sub: "Antiparasitaire", name: "Lévamisole 20 % poudre soluble", desc: "Vermifuge à diluer dans l'eau de boisson. Porcs et volailles. Sachet 100 g.", price: 3000, unit: "sachet", img: P + "levamisole-poudre.jpg", rx: true },
  { id: "levamisole-inj", fit: "cover", cat: "sante", sub: "Antiparasitaire", name: "Lévamisole 10 % injectable", desc: "Vermifuge contre les vers digestifs et pulmonaires. Flacon 100 ml.", price: null, unit: "flacon", img: P + "levamisole-injectable.jpg", rx: true },
  { id: "vermifuge-premium", cat: "sante", sub: "Antiparasitaire", name: "Vermifuge Premium", desc: "Vermifuge en sachet.", price: 3500, unit: "sachet", icon: "🪱" },
  // Vitamines, minéraux, digestif
  { id: "multivitamine", fit: "cover", cat: "sante", sub: "Vitamines", name: "Multivitamine injectable", desc: "Soutient la croissance, la fertilité et la récupération. Flacon 100 ml.", price: 4500, unit: "flacon", img: P + "multivitamine.jpg" },
  { id: "fer-dextran", fit: "cover", cat: "sante", sub: "Minéraux", name: "Fer dextran injectable", desc: "Prévention de l'anémie des porcelets. Flacon 100 ml.", price: 5000, unit: "flacon", img: P + "fer-dextran.jpg" },
  { id: "vitamines-poudre", cat: "sante", sub: "Vitamines", name: "Vitamines en poudre", desc: "À mélanger dans l'eau ou l'aliment.", price: 2500, unit: "sachet", icon: "🧂" },
  { id: "anti-diarrhee", cat: "sante", sub: "Digestif", name: "Anti-diarrhée poudre", desc: "Contre les diarrhées.", price: 3000, unit: "sachet", icon: "🧂" },
  { id: "desinfectants", cat: "sante", sub: "Hygiène", name: "Désinfectants", desc: "Bâtiments et matériel d'élevage.", price: null, unit: "lot", icon: "🧽" },
  { id: "autre-veto", cat: "sante", sub: "Sur demande", name: "Autre produit vétérinaire", desc: "Vous cherchez un produit précis ? Indiquez-le dans le message, nous le commandons pour vous.", price: null, unit: "lot", icon: "📋" },

  // ===== Matériel vétérinaire =====
  { id: "seringue-auto", cat: "soins", sub: "Injection", name: "Seringue automatique doseuse", desc: "Vaccinations et traitements en série, dose réglable, se fixe sur le flacon.", price: null, unit: "pièce", img: P + "seringue-automatique.jpg" },
  { id: "aiguilles", cat: "soins", sub: "Injection", name: "Aiguilles vétérinaires en fer", desc: "Réutilisables, plusieurs calibres. Vendues à l'unité.", price: 500, unit: "unité", img: P + "aiguilles.jpg" },
  { id: "thermometre", cat: "soins", sub: "Diagnostic", name: "Thermomètre numérique", desc: "Prise de température rapide de vos animaux.", price: 5000, unit: "pièce", icon: "🌡️" },
  { id: "piles", cat: "soins", sub: "Accessoire", name: "Petites piles", desc: "Pour thermomètre et petits appareils.", price: 200, unit: "unité", icon: "🔋" },
  { id: "boucles", cat: "soins", sub: "Identification", name: "Boucles d'identification", desc: "Pour identifier vos animaux. Vendues à l'unité.", price: 500, unit: "unité", icon: "🏷️",
    options: [{ label: "Grande boucle", price: 500 }, { label: "Petite boucle", price: 300 }] },
  { id: "lasso", cat: "soins", sub: "Contention", name: "Lasso de contention pour porcs", desc: "Câble acier et poignée en T pour immobiliser le porc pendant les soins.", price: 10000, unit: "pièce", img: P + "lasso-contention.jpg" },

  // ===== Alimentation & nutrition =====
  { id: "son-fin", cat: "nutrition", sub: "Matière première", name: "Son fin", desc: "En sac.", price: 2500, unit: "sac", icon: "🌾",
    options: [{ label: "Sac 30 kg", price: 2500 }, { label: "Sac 40 kg", price: 3000 }] },
  { id: "palmiste", cat: "nutrition", sub: "Matière première", name: "Tourteau de palmiste", desc: "Sac de 50 kg.", price: 8000, unit: "sac", icon: "🌴" },
  { id: "huile-palme", cat: "nutrition", sub: "Matière première", name: "Huile de palme", desc: "Énergie pour vos formules d'aliment.", price: 1000, unit: "litre", icon: "🫒" },
  { id: "aliment-porc", cat: "nutrition", sub: "Aliment complet", name: "Aliments porcins", desc: "Porcelet, croissance, porc unique, truie allaitante.", price: null, unit: "sac", icon: "🐖" },
  { id: "aliment-volaille", cat: "nutrition", sub: "Aliment complet", name: "Aliments volailles", desc: "Démarrage, poulette, ponte.", price: null, unit: "sac", icon: "🐔" },
  { id: "aliment-ruminant", cat: "nutrition", sub: "Aliment complet", name: "Aliments ruminants", desc: "Bovins, ovins, caprins.", price: null, unit: "sac", icon: "🐄" },
  { id: "booster-croissance", cat: "nutrition", sub: "Booster", name: "Booster Croissance Porc", desc: "Pour une croissance plus rapide.", price: 2500, unit: "sachet", icon: "📈" },
  { id: "booster-lait", cat: "nutrition", sub: "Booster", name: "Booster Lait Truie", desc: "Soutient la production de lait des truies.", price: 2500, unit: "sachet", icon: "🍼" },
  { id: "booster-probiotique", cat: "nutrition", sub: "Booster", name: "Booster Probiotique Porc", desc: "Favorise une bonne digestion.", price: 2000, unit: "sachet", icon: "🦠" },
  { id: "bio-earn", cat: "nutrition", sub: "Complément", name: "Bio Earn", desc: "Complément pour l'élevage. Demandez conseil à nos techniciens.", price: 2000, unit: "sachet", icon: "🧂" },
  { id: "pierres-lecher", fit: "cover", cat: "nutrition", sub: "Complément minéral", name: "Pierres à lécher minérales", desc: "Sel enrichi en minéraux et oligo-éléments. Bovins, ovins, caprins.", price: null, unit: "bloc", img: P + "pierres-a-lecher.jpg" },
  { id: "croquettes-chien", cat: "nutrition", sub: "Animaux de compagnie", name: "Croquettes chien Premium 20 kg", desc: "Haisenpet, tous âges. 28 % de protéines, 13 % de matières grasses.", price: null, unit: "sac", img: P + "croquettes-chien.jpg" },
  { id: "booster-chien", cat: "nutrition", sub: "Animaux de compagnie", name: "Booster Chien", desc: "Complément pour chiens.", price: 10000, unit: "boîte", icon: "🐕" },

  // ===== Équipement d'élevage =====
  { id: "broyeur", fit: "cover", cat: "equipement", sub: "Fabrication d'aliment", name: "Broyeur-mélangeur d'aliment", desc: "Broie et mélange vos matières premières pour fabriquer votre propre aliment à la ferme.", price: null, unit: "machine", img: P + "broyeur-melangeur.jpg" },
  { id: "balance", cat: "equipement", sub: "Pesée", name: "Balance plateforme électronique", desc: "Pesée des animaux, des sacs et de l'aliment, avec afficheur digital.", price: null, unit: "pièce", img: P + "balance-plateforme.jpg" },
  { id: "cage-truie", cat: "equipement", sub: "Logement des truies", name: "Cage pour truie (case de gestation)", desc: "Acier galvanisé avec auge individuelle. 220 cm × 60 ou 70 cm, hauteur 100 cm.", price: null, unit: "cage", img: P + "cage-truie.jpg", options: ["Largeur 60 cm", "Largeur 70 cm"] },
  { id: "nourrisseur", cat: "equipement", sub: "Alimentation", name: "Nourrisseur inox pour porcs", desc: "Trémie en acier inoxydable à plusieurs places, solide et facile à nettoyer.", price: null, unit: "pièce", img: P + "nourrisseur-inox.jpg" },
  { id: "bottes", fit: "cover", cat: "equipement", sub: "Hygiène & sécurité", name: "Bottes d'élevage", desc: "Caoutchouc imperméable, semelle antidérapante. De 5 000 à 10 000 F selon le modèle.", price: 5000, unit: "paire", quote: true, prefix: "Selon modèle, à partir de", img: P + "bottes.jpg", options: ["Pointure 39", "Pointure 40", "Pointure 41", "Pointure 42", "Pointure 43", "Pointure 44", "Pointure 45", "Pointure 46"] },
  { id: "pelette", cat: "equipement", sub: "Petit matériel", name: "Pelette", desc: "Petite pelle pour l'aliment et le nettoyage.", price: 2500, unit: "pièce", icon: "🧹" },
  { id: "tendeur", cat: "equipement", sub: "Petit matériel", name: "Tendeur", desc: "Vendu à l'unité.", price: 750, unit: "unité", icon: "🪢" },

  // ===== Volailles & œufs =====
  { id: "poussin", cat: "volailles", sub: "Animal vivant", name: "Poussin", desc: "Vendu à l'unité.", price: 1500, unit: "unité", icon: "🐣" },
  { id: "poule", cat: "volailles", sub: "Animal vivant", name: "Poule", desc: "Vendue à l'unité.", price: 3000, unit: "unité", icon: "🐔" },
  { id: "coq", cat: "volailles", sub: "Animal vivant", name: "Coq", desc: "Vendu à l'unité.", price: 7000, unit: "unité", icon: "🐓" },
  { id: "canard", cat: "volailles", sub: "Animal vivant", name: "Canard", desc: "Vendu à l'unité.", price: 8000, unit: "unité", icon: "🦆" },
  { id: "oeufs", cat: "volailles", sub: "Œufs frais", name: "Œufs", desc: "À l'unité ou à la palette.", price: 3000, unit: "palette", icon: "🥚",
    options: [{ label: "Palette", price: 3000, unit: "palette" }, { label: "À l'unité", price: 100, unit: "œuf" }] },

  // ===== Services =====
  { id: "ia-bovine", cat: "services", sub: "Insémination bovine", name: "Intervention technicien – insémination bovine", desc: "Présélection des femelles, pose et retrait des PRID, inséminations. Hors transport, hébergement, semences et hormones.", price: 22958, unit: "femelle", quote: true, icon: "🧑‍🔬" },
  { id: "ia-porcine", cat: "services", sub: "Insémination porcine", name: "Insémination porcine", desc: "Réalisée ou encadrée par nos techniciens.", price: null, unit: "truie", icon: "🧑‍🔬" },
  { id: "formation", cat: "services", sub: "Formation", name: "Formation des éleveurs", desc: "Insémination, alimentation, conduite d'élevage.", price: null, unit: "session", icon: "🎓" },

  // ===== Outils Excel (achat direct sur Chariow) =====
  { id: "calc-aliment", cat: "excel", sub: "Fichier Excel", badge: "Prix de lancement", name: "Calculateur Aliment Porc", desc: "5 formules équilibrées (porcelet, croissance, finition, truie gestante, truie allaitante) : poids de chaque ingrédient, coût au kg et au sac de 50 kg.", price: 14900, unit: "fichier", img: "images/calculateur-aliment-porc.jpg", link: "https://boghdxow.mychariow.com/prd_txlatneq" },
  { id: "suivi-truies", cat: "excel", sub: "Fichier Excel", badge: "Promo", name: "Suivi des Truies", desc: "Dates de chaleurs et de mise bas, classement des truies les plus rentables, alertes de consanguinité.", price: 9900, oldPrice: 15000, unit: "fichier", img: "images/suivi-des-truies.jpg", link: "https://boghdxow.mychariow.com/prd_xmkoxo9e" },
];

/* ---------------- Utilitaires ---------------- */
const $ = (sel) => document.querySelector(sel);
const fmt = (n) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " F CFA";
const esc = (t) => String(t).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const byId = Object.fromEntries(PRODUCTS.map((p) => [p.id, p]));
const isQuote = (p) => p.price == null || p.quote;
const optLabel = (o) => (typeof o === "string" ? o : o.label);
const optOf = (p, label) => (p.options || []).find((o) => typeof o === "object" && o.label === label);
// Prix et unité d'une ligne (tient compte de la variante choisie)
const priceOf = (p, label) => { const o = optOf(p, label); return o ? o.price : p.price; };
const unitOf = (p, label) => { const o = optOf(p, label); return (o && o.unit) || p.unit; };

/* ---------------- Panier (sauvegardé dans le navigateur) ---------------- */
let cart = [];
try { cart = JSON.parse(localStorage.getItem("pdi-cart") || "[]").filter((l) => byId[l.id]); } catch (e) { cart = []; }
function save() { try { localStorage.setItem("pdi-cart", JSON.stringify(cart)); } catch (e) {} }

function addToCart(id, option, qty) {
  const line = cart.find((l) => l.id === id && l.option === option);
  if (line) line.qty += qty; else cart.push({ id, option, qty });
  save(); renderCart();
  const p = byId[id];
  toast(`${qty} × ${p.name}${option ? " – " + option : ""} ajouté au panier`);
}

/* ---------------- Catalogue ---------------- */
let currentCat = "all";
let query = "";
const norm = (t) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

function renderFilters() {
  $("#shopFilters").innerHTML = CATEGORIES.map((c) => {
    const n = c.id === "all" ? PRODUCTS.length : PRODUCTS.filter((p) => p.cat === c.id).length;
    return `<button type="button" class="chip${c.id === currentCat ? " is-active" : ""}" data-cat="${c.id}" role="tab" aria-selected="${c.id === currentCat}"><span aria-hidden="true">${c.icon}</span> ${esc(c.label)} <em>${n}</em></button>`;
  }).join("");
}

function priceHtml(p, label) {
  const price = priceOf(p, label);
  if (price == null) return `<p class="pcard__price pcard__price--quote">Prix sur devis</p>`;
  const prefix = p.quote ? `<small>${esc(p.prefix || "À partir de")}</small>` : "";
  const old = p.oldPrice ? ` <s>${fmt(p.oldPrice)}</s>` : "";
  return `<p class="pcard__price">${prefix}${fmt(price)}${old} <span>/ ${esc(unitOf(p, label))}</span></p>`;
}

function cardHtml(p) {
  const media = p.img
    ? `<div class="pcard__media"><img class="fit-${p.fit || "contain"}" src="${p.img}" alt="${esc(p.name)}" loading="lazy"></div>`
    : `<div class="pcard__media pcard__media--icon" aria-hidden="true">${p.icon || "📦"}</div>`;
  const flag = p.link ? `<span class="pcard__flag pcard__flag--dl">Téléchargement</span>`
    : isQuote(p) ? `<span class="pcard__flag">Sur commande</span>` : `<span class="pcard__flag pcard__flag--ok">Prix affiché</span>`;
  const badge = p.badge ? `<span class="pcard__badge-hot">${esc(p.badge)}</span>` : "";
  const first = p.options ? optLabel(p.options[0]) : "";
  let actions;
  if (p.link) {
    actions = `<a class="btn btn--primary pcard__btn" href="${p.link}" target="_blank" rel="noopener">Acheter et télécharger</a>`;
  } else {
    const opts = p.options
      ? `<select class="pcard__opt" aria-label="Variante">${p.options.map((o) => `<option>${esc(optLabel(o))}</option>`).join("")}</select>`
      : "";
    actions = `${opts}
      <div class="pcard__buy">
        <div class="qty"><button type="button" data-step="-1" aria-label="Moins">−</button><input type="number" min="1" value="1" inputmode="numeric" aria-label="Quantité"><button type="button" data-step="1" aria-label="Plus">+</button></div>
        <button type="button" class="btn btn--primary pcard__add" data-add="${p.id}">${isQuote(p) ? "Demander un devis" : "Ajouter au panier"}</button>
      </div>`;
  }
  return `<article class="pcard${p.badge ? " pcard--hot" : ""}" data-id="${p.id}">
    ${media}${flag}${badge}
    <div class="pcard__body">
      <span class="pcard__sub">${esc(p.sub || "")}</span>
      <h3>${esc(p.name)}</h3>
      <p class="pcard__desc">${esc(p.desc)}</p>
      ${p.rx ? `<p class="pcard__rx">⚕️ Délivré sur conseil vétérinaire</p>` : ""}
      <div class="pcard__pricebox">${priceHtml(p, first)}</div>
      ${actions}
    </div>
  </article>`;
}

function renderGrid() {
  const q = norm(query.trim());
  const match = (p) => !q || norm(`${p.name} ${p.desc} ${p.sub || ""} ${(p.options || []).map(optLabel).join(" ")}`).includes(q);
  const cats = CATEGORIES.filter((c) => c.id !== "all" && (currentCat === "all" || c.id === currentCat));
  let html = "";
  cats.forEach((c) => {
    const list = PRODUCTS.filter((p) => p.cat === c.id && match(p));
    if (!list.length) return;
    html += `<section class="shelf" aria-label="${esc(c.label)}">
      <header class="shelf__head"><span class="shelf__icon" aria-hidden="true">${c.icon}</span><div><h3>${esc(c.label)}</h3>${c.intro ? `<p>${esc(c.intro)}</p>` : ""}</div><span class="shelf__count">${list.length} produit${list.length > 1 ? "s" : ""}</span></header>
      <div class="shop-grid">${list.map(cardHtml).join("")}</div>
    </section>`;
  });
  $("#shopGrid").innerHTML = html || `<p class="shop-empty">Aucun produit trouvé. Essayez un autre mot, ou demandez-nous directement sur WhatsApp : nous pouvons le commander pour vous.</p>`;
}

function showCat(cat) {
  currentCat = cat; query = ""; const s = $("#shopSearch"); if (s) s.value = "";
  renderFilters(); renderGrid();
}

$("#shopFilters").addEventListener("click", (e) => {
  const b = e.target.closest("[data-cat]"); if (!b) return;
  currentCat = b.dataset.cat; renderFilters(); renderGrid();
  b.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
});
$("#shopSearch").addEventListener("input", (e) => { query = e.target.value; renderGrid(); });

$("#shopGrid").addEventListener("change", (e) => {
  const sel = e.target.closest(".pcard__opt"); if (!sel) return;
  const card = sel.closest(".pcard");
  card.querySelector(".pcard__pricebox").innerHTML = priceHtml(byId[card.dataset.id], sel.value);
});

$("#shopGrid").addEventListener("click", (e) => {
  const card = e.target.closest(".pcard"); if (!card) return;
  const input = card.querySelector(".qty input");
  const step = e.target.closest("[data-step]");
  if (step) { input.value = Math.max(1, (parseInt(input.value, 10) || 1) + Number(step.dataset.step)); return; }
  const add = e.target.closest("[data-add]");
  if (add) {
    const sel = card.querySelector(".pcard__opt");
    addToCart(add.dataset.add, sel ? sel.value : "", Math.max(1, parseInt(input.value, 10) || 1));
    input.value = 1;
  }
});

// Liens externes vers un rayon (ex. fiches races → semences bovines)
document.querySelectorAll("[data-shop-cat]").forEach((a) => a.addEventListener("click", () => showCat(a.dataset.shopCat)));

/* ---------------- Tiroir panier ---------------- */
function lineLabel(l) { const p = byId[l.id]; return p.name + (l.option ? " – " + l.option : ""); }

function renderCart() {
  const count = cart.length;
  $("#cartCount").textContent = count;
  $("#cartFab").classList.toggle("has-items", count > 0);

  if (!cart.length) {
    $("#cartItems").innerHTML = `<p class="cart__empty">Votre panier est vide.<br>Parcourez la boutique et ajoutez des produits.</p>`;
    $("#cartTotal").innerHTML = ""; $("#cartForm").hidden = true; return;
  }
  $("#cartForm").hidden = false;
  const priced = cart.filter((l) => !isQuote(byId[l.id]));
  const quoted = cart.filter((l) => isQuote(byId[l.id]));
  const row = (l) => {
    const p = byId[l.id]; const i = cart.indexOf(l);
    const unitPrice = priceOf(p, l.option); const unit = unitOf(p, l.option);
    const price = isQuote(p) ? `<span class="cart-line__quote">Sur devis</span>` : `<span>${fmt(unitPrice * l.qty)}</span>`;
    const info = unitPrice == null ? esc(unit) : `${fmt(unitPrice)} / ${esc(unit)}${isQuote(p) ? " (indicatif)" : ""}`;
    return `<div class="cart-line">
      <div class="cart-line__name">${esc(lineLabel(l))}<small>${info}</small></div>
      <div class="qty qty--sm"><button type="button" data-line="${i}" data-d="-1" aria-label="Moins">−</button><span>${l.qty}</span><button type="button" data-line="${i}" data-d="1" aria-label="Plus">+</button></div>
      <div class="cart-line__price">${price}<button type="button" class="cart-line__del" data-del="${i}" aria-label="Retirer">Retirer</button></div>
    </div>`;
  };
  let html = "";
  if (priced.length) html += `<h3 class="cart__group">À commander</h3>` + priced.map(row).join("");
  if (quoted.length) html += `<h3 class="cart__group">Demande de devis</h3>` + quoted.map(row).join("");
  $("#cartItems").innerHTML = html;
  const total = priced.reduce((s, l) => s + priceOf(byId[l.id], l.option) * l.qty, 0);
  $("#cartTotal").innerHTML = priced.length
    ? `<div><span>Sous-total indicatif</span><strong>${fmt(total)}</strong></div><small>Hors transport${quoted.length ? ", hors articles sur devis" : ""}. Prix confirmés par CAP DE LA PDI.</small>`
    : `<small>Nous vous répondons rapidement avec un devis détaillé.</small>`;
}

$("#cartItems").addEventListener("click", (e) => {
  const d = e.target.closest("[data-d]"); const del = e.target.closest("[data-del]");
  if (d) { const l = cart[d.dataset.line]; l.qty += Number(d.dataset.d); if (l.qty < 1) cart.splice(d.dataset.line, 1); }
  else if (del) cart.splice(del.dataset.del, 1);
  else return;
  save(); renderCart();
});

function openCart() { $("#cartPanel").classList.add("is-open"); $("#cartPanel").setAttribute("aria-hidden", "false"); $("#cartOverlay").hidden = false; document.body.classList.add("no-scroll"); }
function closeCart() { $("#cartPanel").classList.remove("is-open"); $("#cartPanel").setAttribute("aria-hidden", "true"); $("#cartOverlay").hidden = true; document.body.classList.remove("no-scroll"); }
$("#cartFab").addEventListener("click", openCart);
$("#cartClose").addEventListener("click", closeCart);
$("#cartOverlay").addEventListener("click", closeCart);
document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeCart(); });
$("#cartClear").addEventListener("click", () => { if (confirm("Vider le panier ?")) { cart = []; save(); renderCart(); } });

/* ---------------- Bandeau vaccin (précommande) ---------------- */
(function vaccinPromo() {
  const box = document.getElementById("promoVaccin"); if (!box) return;
  const today = new Date().toISOString().slice(0, 10);
  if (today > VACCIN.arrivage) { box.hidden = true; document.querySelectorAll("[data-vaccin-ribbon]").forEach((el) => (el.hidden = true)); return; }
  const closed = today > VACCIN.reserveAvant;
  const st = box.querySelector("[data-vaccin-status]");
  if (st) st.textContent = closed ? "Réservations closes – disponible à l'arrivage selon le stock" : "Réservations ouvertes";
  box.querySelector("[data-vaccin-add]").addEventListener("click", () => {
    const q = Math.max(1, parseInt(box.querySelector("[data-vaccin-qty]").value, 10) || 1);
    addToCart("vaccin-3en1", "", q); openCart();
  });
})();

/* ---------------- Envoi de la commande / du devis ---------------- */
function buildMessage(f) {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  const ref = `WEB-${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}`;
  const priced = cart.filter((l) => !isQuote(byId[l.id]));
  const quoted = cart.filter((l) => isQuote(byId[l.id]));
  const kind = priced.length && quoted.length ? "COMMANDE + DEMANDE DE DEVIS" : priced.length ? "COMMANDE" : "DEMANDE DE DEVIS";
  const L = [`Bonjour CAP DE LA PDI,`, ``, `${kind} – Réf. ${ref}`];
  if (priced.length) {
    L.push(``, `À COMMANDER :`);
    priced.forEach((l) => { const p = byId[l.id]; const pr = priceOf(p, l.option); L.push(`• ${l.qty} × ${lineLabel(l)} (${fmt(pr)} / ${unitOf(p, l.option)}) = ${fmt(pr * l.qty)}`); });
    L.push(`Sous-total indicatif : ${fmt(priced.reduce((s, l) => s + priceOf(byId[l.id], l.option) * l.qty, 0))} (hors transport)`);
  }
  if (quoted.length) {
    L.push(``, `SUR DEVIS :`);
    quoted.forEach((l) => { const p = byId[l.id]; const pr = priceOf(p, l.option); L.push(`• ${l.qty} × ${lineLabel(l)}${pr != null ? ` (indicatif : ${fmt(pr)} / ${unitOf(p, l.option)})` : ""}`); });
  }
  L.push(``, `CLIENT :`, `Nom : ${f.nom}`, `Téléphone : ${f.tel}`);
  if (f.ville) L.push(`Ville / élevage : ${f.ville}`);
  L.push(`Retrait / livraison : ${f.retrait}`);
  if (f.message) L.push(``, `Message : ${f.message}`);
  return { ref, kind, text: L.join("\n") };
}

let via = "whatsapp";
$("#cartForm").addEventListener("click", (e) => { const b = e.target.closest("[data-via]"); if (b) via = b.dataset.via; });
$("#cartForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const fd = Object.fromEntries(new FormData(e.target).entries());
  Object.keys(fd).forEach((k) => (fd[k] = String(fd[k]).trim()));
  if (!fd.nom || !fd.tel) { $("#cartError").textContent = "Merci d'indiquer votre nom et votre téléphone."; return; }
  $("#cartError").textContent = "";
  const m = buildMessage(fd);
  const url = via === "email"
    ? `mailto:${EMAIL}?subject=${encodeURIComponent(m.kind + " " + m.ref + " – " + fd.nom)}&body=${encodeURIComponent(m.text)}`
    : `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(m.text)}`;
  if (via === "email") window.location.href = url; else window.open(url, "_blank", "noopener");
  toast("Votre demande est prête : envoyez le message pour la valider.");
});

/* ---------------- Notification ---------------- */
let toastTimer;
function toast(msg) {
  const t = $("#toast"); t.textContent = msg; t.classList.add("is-visible");
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove("is-visible"), 2600);
}

renderFilters(); renderGrid(); renderCart();
