/* Boutique : filtres, recherche, tri, chargement progressif */
(function () {
  "use strict";
  const { $, $$, D, esc, cardHTML, catById, search, minPrice, isQuote, reveal } = window.PDI;
  const params = new URLSearchParams(location.search);
  const PAGE = 24;
  const st = { cat: params.get("cat") || "all", q: params.get("q") || "", sort: params.get("tri") || "reco", types: new Set(), shown: PAGE };
  if (params.get("filtre") === "nouveautes") st.types.add("new");
  if (params.get("filtre") === "france") st.types.add("fr");
  if (st.cat !== "all" && !catById[st.cat]) st.cat = "all";

  const count = (id) => id === "all" ? D.products.length : D.products.filter((p) => p.cat === id).length;
  const cats = [{ id: "all", label: "Tous les produits", icon: "🛒" }].concat(D.categories);

  function renderNav() {
    $("#fCats").innerHTML = cats.map((c) => `<button type="button" class="fcat${c.id === st.cat ? " is-active" : ""}" data-cat="${c.id}" aria-pressed="${c.id === st.cat}"><span aria-hidden="true">${c.icon}</span>${esc(c.label)}<em>${count(c.id)}</em></button>`).join("");
    $("#chips").innerHTML = cats.map((c) => `<button type="button" class="chip${c.id === st.cat ? " is-active" : ""}" data-cat="${c.id}">${c.icon} ${esc(c.id === "all" ? "Tout" : c.label)}</button>`).join("");
    const a = $("#chips .is-active"); if (a) a.scrollIntoView({ inline: "center", block: "nearest" });
    $$("[data-ftype]").forEach((i) => (i.checked = st.types.has(i.value)));
    $("#shopQ").value = st.q; $("#shopSort").value = st.sort;
  }

  function list() {
    let l = st.q.trim() ? search(st.q) : D.products.slice();
    if (st.cat !== "all") l = l.filter((p) => p.cat === st.cat);
    if (st.types.size) l = l.filter((p) =>
      (st.types.has("priced") && !isQuote(p) && !p.link) || (st.types.has("quote") && isQuote(p)) ||
      (st.types.has("download") && p.link) || (st.types.has("new") && p.new) || (st.types.has("fr") && p.origin));
    const pr = (p) => { const v = minPrice(p); return v == null ? Infinity : v; };
    if (st.sort === "price-asc") l.sort((a, b) => pr(a) - pr(b));
    if (st.sort === "price-desc") l.sort((a, b) => (pr(b) === Infinity ? -1 : pr(b)) - (pr(a) === Infinity ? -1 : pr(a)));
    if (st.sort === "name") l.sort((a, b) => a.name.localeCompare(b.name, "fr"));
    if (st.sort === "reco" && !st.q.trim()) l.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
    return l;
  }

  function render() {
    const l = list();
    const c = catById[st.cat];
    $("#shopTitle").textContent = st.types.has("new") && st.cat === "all" ? "Nouveautés" : st.types.has("fr") && st.types.size === 1 && st.cat === "all" ? "Qualité France" : c ? c.label : "La boutique";
    $("#crumbCat").textContent = c ? c.label : "Boutique";
    $("#shopLead").textContent = (st.types.has("fr") && st.types.size === 1 && !c) ? "Génétique, semences, reproducteurs, vaccin et matériel d'insémination importés de France par CAP DE LA PDI." : c ? c.intro : "Génétique, santé animale, alimentation et matériel : " + D.products.length + " produits pour votre élevage.";
    document.title = (c ? c.label + " – Boutique" : "Boutique en ligne") + " | CAP DE LA PDI";
    $("#catIntro").innerHTML = "";
    $("#shopCount").textContent = l.length + " produit" + (l.length > 1 ? "s" : "") + (st.q ? ` pour « ${st.q} »` : "");
    const grid = $("#shopGrid");
    if (!l.length) {
      const filtered = st.q || st.types.size;
      grid.innerHTML = `<div class="shop__empty" style="grid-column:1/-1"><p><strong>Aucun produit ne correspond${filtered ? " à vos filtres" : ""}.</strong></p>${filtered ? '<p><button class="btn btn--primary" type="button" id="clearFilters">Effacer la recherche et les filtres</button></p>' : ""}<p>Vous cherchez un produit précis ? <a href="https://wa.me/${D.site.whatsapp}?text=${encodeURIComponent("Bonjour, je cherche : " + st.q)}" target="_blank" rel="noopener">Demandez-nous sur WhatsApp</a> : nous pouvons le commander pour vous.</p></div>`;
      const cf = $("#clearFilters"); if (cf) cf.addEventListener("click", () => { st.q = ""; st.types.clear(); update(); });
      $("#shopMore").hidden = true; return;
    }
    const limit = st.cat === "all" && !st.q.trim() ? st.shown : Infinity;
    grid.innerHTML = l.slice(0, limit).map(cardHTML).join("");
    // Apparition douce des cartes, sans jamais les laisser invisibles
    $$(".pcard", grid).forEach((c, i) => { c.style.animation = `cardIn .6s cubic-bezier(.22,.61,.36,1) ${Math.min(i, 12) * 40}ms both`; });
    $("#shopMore").hidden = l.length <= limit;
  }

  function sync() {
    const p = new URLSearchParams();
    if (st.cat !== "all") p.set("cat", st.cat);
    if (st.q) p.set("q", st.q);
    if (st.sort !== "reco") p.set("tri", st.sort);
    if (st.types.has("new")) p.set("filtre", "nouveautes");
    else if (st.types.has("fr") && st.types.size === 1) p.set("filtre", "france");
    history.replaceState(null, "", location.pathname + (p.toString() ? "?" + p : ""));
  }
  function update() { st.shown = PAGE; renderNav(); render(); sync(); }

  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-cat]"); if (b && (b.closest("#fCats") || b.closest("#chips"))) { st.cat = b.dataset.cat; st.q = ""; st.types.clear(); update(); if (b.closest("#fCats") && innerWidth > 1020) scrollTo({ top: 0, behavior: "smooth" }); }
    if (e.target.closest("#openFilters")) { $("#filters").classList.add("is-open"); $("#filtersBackdrop").classList.add("is-on"); }
    if (e.target.closest("[data-close-filters]") || e.target.id === "filtersBackdrop") { $("#filters").classList.remove("is-open"); $("#filtersBackdrop").classList.remove("is-on"); }
  });
  $$("[data-ftype]").forEach((i) => i.addEventListener("change", () => { i.checked ? st.types.add(i.value) : st.types.delete(i.value); update(); }));
  let t; $("#shopQ").addEventListener("input", (e) => { clearTimeout(t); t = setTimeout(() => { st.q = e.target.value; update(); }, 180); });
  $("#shopSort").addEventListener("change", (e) => { st.sort = e.target.value; update(); });
  $("#shopMore").addEventListener("click", () => { st.shown += PAGE; render(); });
  renderNav(); render();
})();
