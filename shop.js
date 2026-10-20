/* ==========================================================
   CAP DE LA PDI – Boutique en ligne (panier + commande / devis)
   ----------------------------------------------------------
   Pour modifier un prix ou ajouter un produit, éditez la liste
   PRODUCTS ci-dessous.
   - price: nombre en F CFA, ou null pour « Sur devis »
   - quote: true  → le produit part dans la demande de devis
                    (même s'il a un prix indicatif)
   - options: liste de variantes (ex. sexée mâle / femelle)
   ========================================================== */

const WHATSAPP = "33766551505";
const EMAIL = "la-pdi@hotmail.com";

// Rayons de la boutique (ordre d'affichage)
const CATEGORIES = [
  { id: "all", label: "Tout", icon: "🛒" },
  { id: "bovins", label: "Semences bovines", icon: "🐄", intro: "Taureaux sélectionnés GENES DIFFUSION. Prix par dose." },
  { id: "porcins", label: "Semences porcines", icon: "🐖", intro: "Lignées françaises GENES DIFFUSION / AXIOM." },
  { id: "reproducteurs", label: "Reproducteurs porcins", icon: "🐷", intro: "Animaux vivants AXIOM importés de France. Prix TTC par animal." },
  { id: "repro", label: "Insémination & reproduction", icon: "🔬", intro: "Tout le matériel pour réussir vos inséminations." },
  { id: "sante", label: "Santé animale", icon: "💊", intro: "Médicaments vétérinaires délivrés sur commande, sur devis et sur conseil technique." },
  { id: "soins", label: "Matériel vétérinaire", icon: "💉", intro: "Pour soigner, vacciner et manipuler vos animaux." },
  { id: "nutrition", label: "Alimentation & nutrition", icon: "🌾", intro: "Aliments, compléments minéraux et animaux de compagnie." },
  { id: "equipement", label: "Équipement d'élevage", icon: "🏗️", intro: "Fabrication d'aliment, pesée, alimentation et hygiène." },
  { id: "services", label: "Services", icon: "🧑‍🔬", intro: "Nos techniciens se déplacent dans votre élevage." },
  { id: "excel", label: "Outils Excel", icon: "📊", intro: "Téléchargement immédiat, paiement sécurisé via Chariow." },
];

const SEXEE = ["Sexée femelle", "Sexée mâle"];
const P = "images/produits/";

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
  { id: "adenia", prefix: "Prix TTC par animal", cat: "reproducteurs", sub: "Femelle – AXIOM", name: "Cochette Adénia", desc: "Truie hybride AXIOM, remplace avantageusement les Large White / Landrace. Importée de France.", price: 1083000, unit: "animal", quote: true, icon: "🐷" },
  { id: "verrat-pietrain", prefix: "Prix TTC par animal", cat: "reproducteurs", sub: "Verrat – AXIOM", name: "Verrat Piétrain NN", desc: "Verrat terminal très musclé, sans gène de stress. Importé de France.", price: 2453000, unit: "animal", quote: true, icon: "🐖" },
  { id: "verrat-duroc", prefix: "Prix TTC par animal", cat: "reproducteurs", sub: "Verrat – AXIOM", name: "Verrat Duroc", desc: "Verrat rustique, viande persillée, bonne tolérance à la chaleur. Importé de France.", price: 2453000, unit: "animal", quote: true, icon: "🐖" },
  { id: "verrat-thor", prefix: "Prix TTC par animal", cat: "reproducteurs", sub: "Verrat – AXIOM", name: "Verrat Thor", desc: "Verrat hybride recommandé pour la vigueur hybride de vos porcelets. Importé de France.", price: 2650000, unit: "animal", quote: true, icon: "🐖" },

  // ===== Insémination & reproduction =====
  { id: "detecteur", cat: "repro", sub: "Détection des chaleurs", name: "Détecteur d'ovulation", desc: "Indique le meilleur moment pour inséminer. Vaches, truies, brebis, juments. Batterie rechargeable.", price: null, unit: "pièce", img: P + "detecteur-ovulation.jpg" },
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

  // ===== Santé animale (sur commande et sur devis) =====
  { id: "oxytetracycline", fit: "cover", cat: "sante", sub: "Antibiotique", name: "Oxytétracycline HCl 20 % injectable", desc: "Antibiotique à large spectre. Bovins, ovins, caprins, porcs, volailles. Flacon 100 ml.", price: null, unit: "flacon", img: P + "oxytetracycline.jpg", rx: true },
  { id: "tylosine", fit: "cover", cat: "sante", sub: "Antibiotique", name: "Tylosine tartrate 20 % injectable", desc: "Infections respiratoires et digestives. Flacon 100 ml.", price: null, unit: "flacon", img: P + "tylosine.jpg", rx: true },
  { id: "ivermectine", fit: "cover", cat: "sante", sub: "Antiparasitaire", name: "Ivermectine 1 % injectable", desc: "Parasites internes et externes : vers, gale, poux, tiques. Flacon 100 ml.", price: null, unit: "flacon", img: P + "ivermectine.jpg", rx: true },
  { id: "levamisole-inj", fit: "cover", cat: "sante", sub: "Antiparasitaire", name: "Lévamisole 10 % injectable", desc: "Vermifuge contre les vers digestifs et pulmonaires. Flacon 100 ml.", price: null, unit: "flacon", img: P + "levamisole-injectable.jpg", rx: true },
  { id: "levamisole-poudre", cat: "sante", sub: "Antiparasitaire", name: "Lévamisole HCl 20 % poudre soluble", desc: "Vermifuge à diluer dans l'eau de boisson. Porcs et volailles. Sachet 100 g.", price: null, unit: "sachet", img: P + "levamisole-poudre.jpg", rx: true },
  { id: "multivitamine", fit: "cover", cat: "sante", sub: "Vitamines", name: "Multivitamine injectable", desc: "Soutient la croissance, la fertilité et la récupération. Flacon 100 ml.", price: null, unit: "flacon", img: P + "multivitamine.jpg" },
  { id: "fer-dextran", fit: "cover", cat: "sante", sub: "Minéraux", name: "Fer dextran 10 % injectable", desc: "Prévention de l'anémie des porcelets. Flacon 100 ml.", price: null, unit: "flacon", img: P + "fer-dextran.jpg" },
  { id: "vaccins-porcins", cat: "sante", sub: "Vaccin", name: "Vaccins porcins", desc: "Porcelets et truies, chaîne du froid respectée.", price: null, unit: "lot", icon: "💉", rx: true },
  { id: "desinfectants", cat: "sante", sub: "Hygiène", name: "Désinfectants", desc: "Bâtiments et matériel d'élevage.", price: null, unit: "lot", icon: "🧽" },
  { id: "autre-veto", cat: "sante", sub: "Sur demande", name: "Autre produit vétérinaire", desc: "Vous cherchez un produit précis ? Indiquez-le dans le message, nous le commandons pour vous.", price: null, unit: "lot", icon: "📋" },

  // ===== Matériel vétérinaire =====
  { id: "seringue-auto", cat: "soins", sub: "Injection", name: "Seringue automatique doseuse", desc: "Vaccinations et traitements en série, dose réglable, se fixe sur le flacon.", price: null, unit: "pièce", img: P + "seringue-automatique.jpg" },
  { id: "aiguilles", cat: "soins", sub: "Injection", name: "Aiguilles vétérinaires inox", desc: "Réutilisables, plusieurs calibres (7 à 16).", price: null, unit: "lot", img: P + "aiguilles.jpg" },
  { id: "lasso", cat: "soins", sub: "Contention", name: "Lasso de contention pour porcs", desc: "Câble acier et poignée en T pour immobiliser le porc pendant les soins.", price: null, unit: "pièce", img: P + "lasso-contention.jpg" },

  // ===== Alimentation & nutrition =====
  { id: "pierres-lecher", fit: "cover", cat: "nutrition", sub: "Complément minéral", name: "Pierres à lécher minérales", desc: "Sel enrichi en minéraux et oligo-éléments (zinc, fer, cuivre, sélénium…). Bovins, ovins, caprins.", price: null, unit: "bloc", img: P + "pierres-a-lecher.jpg" },
  { id: "aliment-porc", cat: "nutrition", sub: "Aliment", name: "Aliments porcins", desc: "Porcelets, croissance, finition, truies.", price: null, unit: "sac", icon: "🌾" },
  { id: "aliment-volaille", cat: "nutrition", sub: "Aliment", name: "Aliments volailles", desc: "Démarrage, croissance, ponte.", price: null, unit: "sac", icon: "🌾" },
  { id: "aliment-ruminant", cat: "nutrition", sub: "Aliment", name: "Aliments ruminants", desc: "Bovins, ovins, caprins.", price: null, unit: "sac", icon: "🌾" },
  { id: "croquettes-chien", cat: "nutrition", sub: "Animaux de compagnie", name: "Croquettes chien Premium 20 kg", desc: "Haisenpet, tous âges. 28 % de protéines, 13 % de matières grasses.", price: null, unit: "sac", img: P + "croquettes-chien.jpg" },

  // ===== Équipement d'élevage =====
  { id: "broyeur", fit: "cover", cat: "equipement", sub: "Fabrication d'aliment", name: "Broyeur-mélangeur d'aliment", desc: "Broie et mélange vos matières premières pour fabriquer votre propre aliment à la ferme.", price: null, unit: "machine", img: P + "broyeur-melangeur.jpg" },
  { id: "balance", cat: "equipement", sub: "Pesée", name: "Balance plateforme électronique", desc: "Pesée des animaux, des sacs et de l'aliment, avec afficheur digital.", price: null, unit: "pièce", img: P + "balance-plateforme.jpg" },
  { id: "nourrisseur", cat: "equipement", sub: "Alimentation", name: "Nourrisseur inox pour porcs", desc: "Trémie en acier inoxydable à plusieurs places, solide et facile à nettoyer.", price: null, unit: "pièce", img: P + "nourrisseur-inox.jpg" },
  { id: "bottes", fit: "cover", cat: "equipement", sub: "Hygiène & sécurité", name: "Bottes d'élevage", desc: "Caoutchouc imperméable, semelle antidérapante.", price: null, unit: "paire", img: P + "bottes.jpg", options: ["Pointure 39", "Pointure 40", "Pointure 41", "Pointure 42", "Pointure 43", "Pointure 44", "Pointure 45", "Pointure 46"] },

  // ===== Services =====
  { id: "ia-bovine", cat: "services", sub: "Insémination bovine", name: "Intervention technicien – insémination bovine", desc: "Présélection des femelles, pose et retrait des PRID, inséminations. Hors transport, hébergement, semences et hormones.", price: 22958, unit: "femelle", quote: true, icon: "🧑‍🔬" },
  { id: "ia-porcine", cat: "services", sub: "Insémination porcine", name: "Insémination porcine", desc: "Réalisée ou encadrée par nos techniciens.", price: null, unit: "truie", icon: "🧑‍🔬" },
  { id: "formation", cat: "services", sub: "Formation", name: "Formation des éleveurs", desc: "Insémination, alimentation, conduite d'élevage.", price: null, unit: "session", icon: "🎓" },

  // ===== Outils Excel (achat direct sur Chariow) =====
  { id: "calc-aliment", cat: "excel", sub: "Fichier Excel", name: "Calculateur aliment porc", desc: "5 formules équilibrées, quantités à peser, coût au kg et au sac.", price: 14900, unit: "fichier", img: "images/calculateur-aliment-porc.jpg", link: "https://boghdxow.mychariow.com/prd_txlatneq" },
  { id: "suivi-truies", cat: "excel", sub: "Fichier Excel", name: "Suivi des truies", desc: "Mises bas et chaleurs calculées, alerte consanguinité.", price: 9900, unit: "fichier", img: "images/suivi-des-truies.jpg", link: "https://boghdxow.mychariow.com/prd_xmkoxo9e" },
];

/* ---------------- Utilitaires ---------------- */
const $ = (sel) => document.querySelector(sel);
const fmt = (n) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " F CFA";
const esc = (t) => String(t).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const byId = Object.fromEntries(PRODUCTS.map((p) => [p.id, p]));
const isQuote = (p) => p.price == null || p.quote;

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

function priceHtml(p) {
  if (p.price == null) return `<p class="pcard__price pcard__price--quote">Prix sur devis</p>`;
  const prefix = p.quote ? `<small>${esc(p.prefix || "À partir de")}</small>` : "";
  return `<p class="pcard__price">${prefix}${fmt(p.price)} <span>/ ${esc(p.unit)}</span></p>`;
}

function cardHtml(p) {
  const media = p.img
    ? `<div class="pcard__media"><img class="fit-${p.fit || "contain"}" src="${p.img}" alt="${esc(p.name)}" loading="lazy"></div>`
    : `<div class="pcard__media pcard__media--icon" aria-hidden="true">${p.icon || "📦"}</div>`;
  const badge = p.link ? `<span class="pcard__flag pcard__flag--dl">Téléchargement</span>`
    : isQuote(p) ? `<span class="pcard__flag">Sur commande</span>` : `<span class="pcard__flag pcard__flag--ok">Prix affiché</span>`;
  let actions;
  if (p.link) {
    actions = `<a class="btn btn--primary pcard__btn" href="${p.link}" target="_blank" rel="noopener">Acheter et télécharger</a>`;
  } else {
    const opts = p.options
      ? `<select class="pcard__opt" aria-label="Variante">${p.options.map((o) => `<option>${esc(o)}</option>`).join("")}</select>`
      : "";
    actions = `${opts}
      <div class="pcard__buy">
        <div class="qty"><button type="button" data-step="-1" aria-label="Moins">−</button><input type="number" min="1" value="1" inputmode="numeric" aria-label="Quantité"><button type="button" data-step="1" aria-label="Plus">+</button></div>
        <button type="button" class="btn btn--primary pcard__add" data-add="${p.id}">${isQuote(p) ? "Demander un devis" : "Ajouter au panier"}</button>
      </div>`;
  }
  return `<article class="pcard">
    ${media}${badge}
    <div class="pcard__body">
      <span class="pcard__sub">${esc(p.sub || "")}</span>
      <h3>${esc(p.name)}</h3>
      <p class="pcard__desc">${esc(p.desc)}</p>
      ${p.rx ? `<p class="pcard__rx">⚕️ Délivré sur conseil vétérinaire</p>` : ""}
      ${priceHtml(p)}
      ${actions}
    </div>
  </article>`;
}

function renderGrid() {
  const q = norm(query.trim());
  const match = (p) => !q || norm(`${p.name} ${p.desc} ${p.sub || ""}`).includes(q);
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

$("#shopFilters").addEventListener("click", (e) => {
  const b = e.target.closest("[data-cat]"); if (!b) return;
  currentCat = b.dataset.cat; renderFilters(); renderGrid();
  b.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
});
$("#shopSearch").addEventListener("input", (e) => { query = e.target.value; renderGrid(); });

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
document.querySelectorAll("[data-shop-cat]").forEach((a) => a.addEventListener("click", () => {
  currentCat = a.dataset.shopCat; query = ""; $("#shopSearch").value = ""; renderFilters(); renderGrid();
}));

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
    const price = isQuote(p) ? `<span class="cart-line__quote">Sur devis</span>` : `<span>${fmt(p.price * l.qty)}</span>`;
    return `<div class="cart-line">
      <div class="cart-line__name">${esc(lineLabel(l))}<small>${isQuote(p) ? esc(p.unit) : fmt(p.price) + " / " + esc(p.unit)}</small></div>
      <div class="qty qty--sm"><button type="button" data-line="${i}" data-d="-1" aria-label="Moins">−</button><span>${l.qty}</span><button type="button" data-line="${i}" data-d="1" aria-label="Plus">+</button></div>
      <div class="cart-line__price">${price}<button type="button" class="cart-line__del" data-del="${i}" aria-label="Retirer">Retirer</button></div>
    </div>`;
  };
  let html = "";
  if (priced.length) html += `<h3 class="cart__group">À commander</h3>` + priced.map(row).join("");
  if (quoted.length) html += `<h3 class="cart__group">Demande de devis</h3>` + quoted.map(row).join("");
  $("#cartItems").innerHTML = html;
  const total = priced.reduce((s, l) => s + byId[l.id].price * l.qty, 0);
  $("#cartTotal").innerHTML = priced.length
    ? `<div><span>Sous-total indicatif</span><strong>${fmt(total)}</strong></div><small>Hors transport et dédouanement${quoted.length ? ", hors articles sur devis" : ""}. Prix confirmés par CAP DE LA PDI.</small>`
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
    priced.forEach((l) => { const p = byId[l.id]; L.push(`• ${l.qty} × ${lineLabel(l)} (${fmt(p.price)} / ${p.unit}) = ${fmt(p.price * l.qty)}`); });
    L.push(`Sous-total indicatif : ${fmt(priced.reduce((s, l) => s + byId[l.id].price * l.qty, 0))} (hors transport et dédouanement)`);
  }
  if (quoted.length) {
    L.push(``, `SUR DEVIS :`);
    quoted.forEach((l) => L.push(`• ${l.qty} ${byId[l.id].unit}(s) – ${lineLabel(l)}`));
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
