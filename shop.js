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

const CATEGORIES = [
  { id: "all", label: "Tout" },
  { id: "bovins", label: "Semences bovines" },
  { id: "porcins", label: "Semences porcines" },
  { id: "materiel", label: "Matériel d'insémination" },
  { id: "veto", label: "Vétérinaire & vaccins" },
  { id: "aliments", label: "Aliments" },
  { id: "services", label: "Services" },
  { id: "excel", label: "Outils Excel" },
];

const SEXEE = ["Sexée femelle", "Sexée mâle"];

const PRODUCTS = [
  // --- Semences bovines (prix par dose) ---
  { id: "holstein", cat: "bovins", name: "Semence Holstein", desc: "Race laitière n° 1 dans le monde.", price: 50000, unit: "dose", img: "images/race-holstein.jpg", options: ["Sexée femelle"] },
  { id: "montbeliarde", cat: "bovins", name: "Semence Montbéliarde", desc: "Lait riche, robuste, bonne valeur bouchère.", price: 50000, unit: "dose", img: "images/race-montbeliarde.jpg", options: SEXEE },
  { id: "charolaise", cat: "bovins", name: "Semence Charolaise", desc: "Race à viande très musclée, croissance rapide.", price: 50000, unit: "dose", img: "images/race-charolaise.jpg", options: SEXEE },
  { id: "limousine", cat: "bovins", name: "Semence Limousine", desc: "Carcasses de qualité, vêlages faciles.", price: 50000, unit: "dose", img: "images/race-limousine.jpg", options: SEXEE },
  { id: "blonde", cat: "bovins", name: "Semence Blonde d'Aquitaine", desc: "Format imposant, fort rendement en viande.", price: 50000, unit: "dose", img: "images/race-blonde-aquitaine.jpg", options: SEXEE },
  { id: "brahman", cat: "bovins", name: "Semence Brahman", desc: "Zébu résistant à la chaleur et aux tiques.", price: 45000, unit: "dose", img: "images/race-brahman.jpg" },
  { id: "salers", cat: "bovins", name: "Semence Salers", desc: "Race rustique, bonne mère.", price: 21000, unit: "dose", img: "images/race-salers.jpg" },
  { id: "angus", cat: "bovins", name: "Semence Angus", desc: "Viande persillée, vêlages faciles.", price: 16000, unit: "dose", img: "images/race-angus.jpg" },

  // --- Semences porcines (sur devis) ---
  { id: "porc-lw", cat: "porcins", name: "Semence porcine Large White", desc: "Lignée maternelle prolifique.", price: null, unit: "dose", icon: "🐖" },
  { id: "porc-landrace", cat: "porcins", name: "Semence porcine Landrace", desc: "Grandes portées, bonne production laitière.", price: null, unit: "dose", icon: "🐖" },
  { id: "porc-pietrain", cat: "porcins", name: "Semence porcine Piétrain NN", desc: "Verrat terminal, carcasses très musclées.", price: null, unit: "dose", icon: "🐖" },
  { id: "porc-duroc", cat: "porcins", name: "Semence porcine Duroc", desc: "Verrat terminal rustique, viande persillée.", price: null, unit: "dose", icon: "🐖" },

  // --- Matériel d'insémination ---
  { id: "pistolet", cat: "materiel", name: "Pistolet universel Flexia", desc: "Pistolet d'insémination bovine.", price: 34000, unit: "pièce", icon: "🔫" },
  { id: "gaine", cat: "materiel", name: "Gaine universelle", desc: "Vendue à l'unité.", price: 100, unit: "unité", icon: "🧪" },
  { id: "chemise", cat: "materiel", name: "Chemise sanitaire", desc: "Vendue à l'unité.", price: 200, unit: "unité", icon: "🧪" },
  { id: "gel", cat: "materiel", name: "Gel lubrifiant", desc: "Pour l'insémination.", price: 6000, unit: "flacon", icon: "🧴" },
  { id: "coupe-paillettes", cat: "materiel", name: "Coupe-paillettes", desc: "Coupe nette des paillettes.", price: 14500, unit: "pièce", icon: "✂️" },
  { id: "lame", cat: "materiel", name: "Lame coupe-paillettes", desc: "Lame de rechange.", price: 2500, unit: "pièce", icon: "✂️" },
  { id: "ciseaux", cat: "materiel", name: "Ciseaux mousse 14 cm", desc: "Bouts arrondis.", price: 5500, unit: "pièce", icon: "✂️" },
  { id: "pince", cat: "materiel", name: "Pince brucelle 16 cm", desc: "Manipulation des paillettes.", price: 12500, unit: "pièce", icon: "🔧" },
  { id: "decongelateur", cat: "materiel", name: "Décongélateur 12-220 V", desc: "Décongélation des paillettes, sur secteur ou batterie.", price: 364500, unit: "pièce", icon: "🌡️" },
  { id: "cuve", cat: "materiel", name: "Cuve azote ET 34", desc: "Conservation des semences dans l'azote liquide.", price: 830000, unit: "pièce", icon: "🛢️" },

  // --- Vétérinaire (sur commande et sur devis) ---
  { id: "hormones", cat: "veto", name: "Hormones de reproduction", desc: "Synchronisation des chaleurs (PRID…). Sur ordonnance / conseil technique.", price: null, unit: "lot", icon: "💉" },
  { id: "antibiotiques", cat: "veto", name: "Antibiotiques", desc: "Selon l'espèce et le traitement prescrit.", price: null, unit: "lot", icon: "💊" },
  { id: "antiparasitaires", cat: "veto", name: "Antiparasitaires", desc: "Internes et externes.", price: null, unit: "lot", icon: "💊" },
  { id: "vaccins-porcins", cat: "veto", name: "Vaccins porcins", desc: "Porcelets et truies, chaîne du froid respectée.", price: null, unit: "lot", icon: "💉" },
  { id: "vitamines", cat: "veto", name: "Vitamines & minéraux", desc: "Compléments pour la croissance et la reproduction.", price: null, unit: "lot", icon: "🧴" },
  { id: "desinfectants", cat: "veto", name: "Désinfectants & hygiène", desc: "Bâtiments et matériel d'élevage.", price: null, unit: "lot", icon: "🧽" },

  // --- Aliments (sur devis) ---
  { id: "aliment-porc", cat: "aliments", name: "Aliments porcins", desc: "Porcelets, croissance, finition, truies.", price: null, unit: "sac", icon: "🌾" },
  { id: "aliment-volaille", cat: "aliments", name: "Aliments volailles", desc: "Démarrage, croissance, ponte.", price: null, unit: "sac", icon: "🌾" },
  { id: "aliment-ruminant", cat: "aliments", name: "Aliments ruminants", desc: "Bovins, ovins, caprins.", price: null, unit: "sac", icon: "🌾" },

  // --- Services ---
  { id: "ia-bovine", cat: "services", name: "Intervention technicien – insémination bovine", desc: "Présélection des femelles, pose et retrait des PRID, inséminations. Hors transport, hébergement, semences et hormones.", price: 22958, unit: "femelle", quote: true, icon: "🧑‍🔬" },
  { id: "ia-porcine", cat: "services", name: "Insémination porcine", desc: "Réalisée ou encadrée par nos techniciens.", price: null, unit: "truie", icon: "🧑‍🔬" },
  { id: "formation", cat: "services", name: "Formation des éleveurs", desc: "Insémination, alimentation, conduite d'élevage.", price: null, unit: "session", icon: "🎓" },

  // --- Outils Excel (achat direct sur Chariow) ---
  { id: "calc-aliment", cat: "excel", name: "Calculateur aliment porc", desc: "5 formules équilibrées, quantités à peser, coût au kg et au sac.", price: 14900, unit: "fichier", img: "images/calculateur-aliment-porc.jpg", link: "https://boghdxow.mychariow.com/prd_txlatneq" },
  { id: "suivi-truies", cat: "excel", name: "Suivi des truies", desc: "Mises bas et chaleurs calculées, alerte consanguinité.", price: 9900, unit: "fichier", img: "images/suivi-des-truies.jpg", link: "https://boghdxow.mychariow.com/prd_xmkoxo9e" },
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

function renderFilters() {
  $("#shopFilters").innerHTML = CATEGORIES.map((c) =>
    `<button type="button" class="chip${c.id === currentCat ? " is-active" : ""}" data-cat="${c.id}" role="tab" aria-selected="${c.id === currentCat}">${esc(c.label)}</button>`
  ).join("");
}

function priceHtml(p) {
  if (p.price == null) return `<p class="pcard__price pcard__price--quote">Sur devis</p>`;
  const prefix = p.quote ? "<small>À partir de</small>" : "";
  return `<p class="pcard__price">${prefix}${fmt(p.price)} <span>/ ${esc(p.unit)}</span></p>`;
}

function renderGrid() {
  const list = PRODUCTS.filter((p) => currentCat === "all" || p.cat === currentCat);
  $("#shopGrid").innerHTML = list.map((p) => {
    const media = p.img
      ? `<img class="pcard__img" src="${p.img}" alt="${esc(p.name)}" loading="lazy">`
      : `<div class="pcard__icon" aria-hidden="true">${p.icon || "📦"}</div>`;
    const catLabel = CATEGORIES.find((c) => c.id === p.cat).label;
    const badge = isQuote(p) ? `<span class="pcard__badge">Sur commande / devis</span>` : "";
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
      ${media}
      <div class="pcard__body">
        <span class="breed__tag">${esc(catLabel)}</span>${badge}
        <h3>${esc(p.name)}</h3>
        <p class="pcard__desc">${esc(p.desc)}</p>
        ${priceHtml(p)}
        ${actions}
      </div>
    </article>`;
  }).join("");
}

$("#shopFilters").addEventListener("click", (e) => {
  const b = e.target.closest("[data-cat]"); if (!b) return;
  currentCat = b.dataset.cat; renderFilters(); renderGrid();
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

// Liens externes vers une catégorie (ex. fiches races → semences bovines)
document.querySelectorAll("[data-shop-cat]").forEach((a) => a.addEventListener("click", () => {
  currentCat = a.dataset.shopCat; renderFilters(); renderGrid();
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
