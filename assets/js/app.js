/* CAP DE LA PDI — scripts communs à toutes les pages */
(function () {
  "use strict";
  const D = window.CAT;
  const ROOT = document.body.dataset.root || "";
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const esc = (t) => String(t == null ? "" : t).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const fmt = (n) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " F CFA";
  const byId = Object.fromEntries(D.products.map((p) => [p.id, p]));
  const catById = Object.fromEntries(D.categories.map((c) => [c.id, c]));
  const optLabel = (o) => (typeof o === "string" ? o : o.label);
  const optOf = (p, l) => (p.options || []).find((o) => typeof o === "object" && o.label === l);
  const priceOf = (p, l) => { const o = optOf(p, l); return o ? o.price : p.price; };
  const unitOf = (p, l) => { const o = optOf(p, l); return (o && o.unit) || p.unit; };
  const isQuote = (p) => p.price == null || !!p.quote;
  const url = (p) => ROOT + p.url;
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
  };
  const ICO = {
    plus: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
    arrow: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
  };

  function imgHTML(im, sizes, cls, alt, eager) {
    if (!im) return "";
    const srcset = im.srcset.split(", ").map((s) => ROOT + s).join(", ");
    return `<img class="${cls || ""}" src="${ROOT + im.src}" srcset="${srcset}" sizes="${sizes}" width="${im.w}" height="${im.h}" alt="${esc(alt || "")}" ${eager ? "" : 'loading="lazy" decoding="async"'}>`;
  }
  function placeholder(p) {
    return `<div class="ph"><span class="ph__icon" aria-hidden="true">${p.icon || "📦"}</span><span class="ph__tag">Visuel temporaire</span></div>`;
  }

  /* ---------------- Prix ---------------- */
  function priceHTML(p, label, cls) {
    const pr = priceOf(p, label);
    if (pr == null) return `<p class="${cls || "price"} price--quote">Prix sur devis</p>`;
    const pre = p.quote ? `<small>${esc(p.prefix || "À partir de")}</small>` : (p.options && p.options.some((o) => typeof o === "object") ? "<small>À partir de</small>" : "");
    const old = p.oldPrice ? `<s>${fmt(p.oldPrice)}</s>` : "";
    return `<p class="${cls || "price"}">${pre}${fmt(pr)}${old} <em>/ ${esc(unitOf(p, label))}</em></p>`;
  }
  function minPrice(p) {
    if (p.options && p.options.some((o) => typeof o === "object")) return Math.min(...p.options.map((o) => o.price));
    return p.price;
  }

  /* ---------------- Carte produit ---------------- */
  function cardHTML(p) {
    const fit = p.fit || "contain";
    const imgs = p.images || [];
    const media = imgs.length
      ? imgHTML(imgs[0], "(min-width:1240px) 300px, (min-width:700px) 33vw, 50vw", "fit-" + fit, p.name) +
        (imgs[1] ? imgHTML(imgs[1], "(min-width:1240px) 300px, 50vw", "alt fit-" + fit, "") : "")
      : placeholder(p);
    const badges = [];
    if (p.badge) badges.push(`<span class="badge badge--hot">${esc(p.badge)}</span>`);
    if (p.origin === "fr") badges.push('<span class="badge badge--fr">🇫🇷 Qualité France</span>');
    if (p.origin === "fr-dist") badges.push('<span class="badge badge--fr">🇫🇷 Fournisseur français</span>');
    if (p.link) badges.push('<span class="badge badge--dl">Téléchargement</span>');
    else if (isQuote(p)) badges.push('<span class="badge badge--quote">Sur commande</span>');
    const direct = !p.link && !p.options;
    const quickLabel = p.link ? "Voir le produit" : p.options ? "Choisir une variante" : isQuote(p) ? "Ajouter au devis" : "Ajouter au panier";
    const pp = Object.assign({}, p, { price: minPrice(p) });
    const priceLabel = p.options && p.options.some((o) => typeof o === "object") ? "" : (p.options ? optLabel(p.options[0]) : "");
    return `<article class="pcard">
      <a class="pcard__media" href="${url(p)}" tabindex="-1" aria-hidden="true">${media}</a>
      <div class="pcard__badges">${badges.join("")}</div>
      <div class="pcard__quick">${direct ? `<button class="btn" data-quick-add="${p.id}">${quickLabel}</button>` : `<a class="btn" href="${url(p)}">${quickLabel}</a>`}</div>
      <div class="pcard__body">
        <span class="pcard__sub">${esc(p.sub || (catById[p.cat] || {}).label)}</span>
        <h3 class="pcard__name"><a href="${url(p)}">${esc(p.name)}</a></h3>
        <p class="pcard__desc">${esc(p.tagline ? "« " + p.tagline + " » " : "")}${esc(p.desc)}</p>
        <div class="pcard__foot">${priceHTML(pp, priceLabel)}
          ${direct ? `<button class="pcard__add" data-quick-add="${p.id}" aria-label="${quickLabel} : ${esc(p.name)}">${ICO.plus}</button>` : `<a class="pcard__add" href="${url(p)}" aria-label="${quickLabel} : ${esc(p.name)}">${ICO.arrow}</a>`}
        </div>
      </div>
    </article>`;
  }

  /* ---------------- Panier ---------------- */
  const KEY = "pdi-cart-v2";
  let cart = store.get(KEY, []).filter((l) => byId[l.id] && !byId[l.id].link && l.qty > 0);
  const listeners = [];
  function saveCart() { store.set(KEY, cart); listeners.forEach((f) => f(cart)); renderCart(); }
  const Cart = {
    items: () => cart,
    onChange: (f) => listeners.push(f),
    add(id, option, qty) {
      const p = byId[id]; if (!p || p.link) return;
      qty = Math.max(1, parseInt(qty, 10) || 1);
      const line = cart.find((l) => l.id === id && (l.option || "") === (option || ""));
      if (line) line.qty += qty; else cart.push({ id, option: option || "", qty });
      saveCart();
      const b = $("#cartOpen"); if (b) { b.classList.remove("bump"); void b.offsetWidth; b.classList.add("bump"); }
      toast(`<b>${esc(p.name)}</b>${option ? " – " + esc(option) : ""} ${isQuote(p) ? "ajouté à votre demande de devis" : "ajouté au panier"}`, { label: "Voir le panier", fn: openCart });
    },
    setQty(i, q) { if (!cart[i]) return; cart[i].qty = q; if (q < 1) cart.splice(i, 1); saveCart(); },
    remove(i) { cart.splice(i, 1); saveCart(); },
    clear() { cart = []; saveCart(); },
    totals() {
      const priced = cart.filter((l) => !isQuote(byId[l.id]));
      const quoted = cart.filter((l) => isQuote(byId[l.id]));
      return { priced, quoted, total: priced.reduce((s, l) => s + priceOf(byId[l.id], l.option) * l.qty, 0) };
    },
  };

  function lineHTML(l, i, compact) {
    const p = byId[l.id]; const pr = priceOf(p, l.option);
    const im = (p.images || [])[0];
    const thumb = im ? imgHTML(im, "64px", "", "") : `<span aria-hidden="true">${p.icon || "📦"}</span>`;
    const meta = [l.option, pr != null ? `${fmt(pr)} / ${unitOf(p, l.option)}${isQuote(p) ? " (indicatif)" : ""}` : unitOf(p, l.option)].filter(Boolean).join(" · ");
    const right = isQuote(p) ? `<span class="cline__price q">Sur devis</span>` : `<span class="cline__price">${fmt(pr * l.qty)}</span>`;
    return `<div class="cline">
      <a class="cline__img" href="${url(p)}">${thumb}</a>
      <div><a class="cline__name" href="${url(p)}">${esc(p.name)}</a><div class="cline__meta">${esc(meta)}</div>
        ${compact ? `<div class="cline__meta">Quantité : ${l.qty}</div>` : `<div class="qty qty--sm"><button type="button" data-cq="${i}" data-d="-1" aria-label="Diminuer">−</button><span>${l.qty}</span><button type="button" data-cq="${i}" data-d="1" aria-label="Augmenter">+</button></div>`}
      </div>
      <div>${right}${compact ? "" : `<button type="button" class="cline__rm" data-crm="${i}">Retirer</button>`}</div>
    </div>`;
  }
  function linesHTML(compact) {
    const t = Cart.totals(); let h = "";
    if (t.priced.length) h += `<h3 class="cart__group">À commander</h3>` + t.priced.map((l) => lineHTML(l, cart.indexOf(l), compact)).join("");
    if (t.quoted.length) h += `<h3 class="cart__group">Demande de devis</h3>` + t.quoted.map((l) => lineHTML(l, cart.indexOf(l), compact)).join("");
    return h;
  }
  function renderCart() {
    const n = cart.reduce((s, l) => s + 1, 0);
    const c = $("#cartCount"); if (c) { c.textContent = n; c.hidden = n === 0; }
    const body = $("#cartBody"), foot = $("#cartFoot"); if (!body) return;
    if (!cart.length) {
      body.innerHTML = `<div class="cart__empty"><div aria-hidden="true">🧺</div><p>Votre panier est vide.</p><p><a class="btn btn--primary" href="${ROOT}boutique.html" style="margin-top:1rem">Découvrir la boutique</a></p></div>`;
      foot.innerHTML = ""; return;
    }
    body.innerHTML = linesHTML(false);
    const t = Cart.totals();
    foot.innerHTML = `${t.priced.length ? `<div class="sum"><span>Sous-total</span><strong>${fmt(t.total)}</strong></div>` : ""}
      <p class="sum-note">${t.quoted.length ? "Les articles sur devis seront chiffrés par notre équipe. " : ""}Frais de livraison éventuels communiqués avant validation.</p>
      <a class="btn btn--primary btn--lg btn--block" href="${ROOT}commande.html">${t.priced.length ? "Passer la commande" : "Envoyer ma demande de devis"}</a>
      <button class="btn btn--outline btn--block" data-close-cart>Continuer mes achats</button>`;
  }
  document.addEventListener("click", (e) => {
    const q = e.target.closest("[data-cq]"); if (q) { const i = +q.dataset.cq; Cart.setQty(i, cart[i].qty + +q.dataset.d); return; }
    const r = e.target.closest("[data-crm]"); if (r) { Cart.remove(+r.dataset.crm); return; }
    const a = e.target.closest("[data-quick-add]"); if (a) { e.preventDefault(); Cart.add(a.dataset.quickAdd, "", 1); }
  });

  /* ---------------- Panneaux (panier, menu, recherche) ---------------- */
  let lastFocus = null;
  function openPanel(el, focusSel) {
    if (!el) return; lastFocus = document.activeElement;
    el.classList.add("is-open"); el.setAttribute("aria-hidden", "false"); document.body.classList.add("lock");
    setTimeout(() => { const f = focusSel ? $(focusSel, el) : $("button, a, input", el); if (f) f.focus(); }, 60);
  }
  function closePanel(el) {
    if (!el || !el.classList.contains("is-open")) return;
    el.classList.remove("is-open"); el.setAttribute("aria-hidden", "true");
    if (!$(".drawer.is-open, .cart.is-open, .search.is-open")) document.body.classList.remove("lock");
    if (lastFocus) lastFocus.focus();
  }
  function openCart() { openPanel($("#cart"), "[data-close-cart]"); }
  const burger = $("#burger");
  if (burger) burger.addEventListener("click", () => { openPanel($("#drawer")); burger.setAttribute("aria-expanded", "true"); });
  const cartBtn = $("#cartOpen"); if (cartBtn) cartBtn.addEventListener("click", openCart);
  const sBtn = $("#searchOpen"); if (sBtn) sBtn.addEventListener("click", () => { openPanel($("#search"), "#searchInput"); renderSearch(""); });
  document.addEventListener("click", (e) => {
    if (e.target.closest("[data-close-cart]") || e.target === $("#cart")) closePanel($("#cart"));
    if (e.target.closest("[data-close-drawer]") || e.target === $("#drawer")) { closePanel($("#drawer")); burger && burger.setAttribute("aria-expanded", "false"); }
    if (e.target.closest("[data-close-search]") || e.target === $("#search")) closePanel($("#search"));
  });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") $$(".drawer, .cart, .search").forEach(closePanel); });

  /* ---------------- Recherche instantanée ---------------- */
  const norm = (t) => String(t).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  function search(q) {
    const words = norm(q).split(/\s+/).filter(Boolean);
    if (!words.length) return [];
    return D.products.map((p) => {
      const hay = norm([p.name, p.sub, p.desc, p.tagline, (catById[p.cat] || {}).label, (p.options || []).map(optLabel).join(" ")].join(" "));
      const name = norm(p.name);
      let score = 0;
      for (const w of words) { if (!hay.includes(w)) return null; score += name.includes(w) ? 3 : 1; if (name.startsWith(w)) score += 2; }
      return { p, score };
    }).filter(Boolean).sort((a, b) => b.score - a.score).map((r) => r.p);
  }
  function renderSearch(q) {
    const box = $("#searchResults"); if (!box) return;
    if (!q.trim()) {
      const sugg = ["Vaccin", "Ivermectine", "Charolaise", "Adénia", "Cage", "Booster", "Calculateur"];
      box.innerHTML = `<p class="sr-empty">Recherches fréquentes</p><div class="sr-hint">${sugg.map((s) => `<a href="${ROOT}boutique.html?q=${encodeURIComponent(s)}">${s}</a>`).join("")}</div>`;
      return;
    }
    const res = search(q).slice(0, 8);
    box.innerHTML = res.length ? res.map((p) => {
      const im = (p.images || [])[0];
      const pr = minPrice(p);
      return `<a class="sr-item" href="${url(p)}"><span class="sr-item__img">${im ? imgHTML(im, "56px", "", "") : p.icon || "📦"}</span><span><strong>${esc(p.name)}</strong><small>${esc((catById[p.cat] || {}).label)}</small></span><span class="sr-item__price">${pr == null ? "Sur devis" : fmt(pr)}</span></a>`;
    }).join("") + `<a class="link-arrow" style="padding:.6rem" href="${ROOT}boutique.html?q=${encodeURIComponent(q)}">Voir tous les résultats ${ICO.arrow}</a>`
      : `<p class="sr-empty">Aucun produit pour « ${esc(q)} ». <a href="https://wa.me/${D.site.whatsapp}?text=${encodeURIComponent("Bonjour, je cherche : " + q)}" target="_blank" rel="noopener">Demandez-le-nous sur WhatsApp</a> : nous pouvons le commander pour vous.</p>`;
  }
  const sIn = $("#searchInput"); if (sIn) sIn.addEventListener("input", () => renderSearch(sIn.value));

  /* ---------------- Barre d'annonces ---------------- */
  (function topbar() {
    const bar = $("#topbar"), track = $("#topbarTrack"); if (!bar) return;
    const today = new Date().toISOString().slice(0, 10);
    const msgs = D.announcements.filter((a) => !a.until || today <= a.until);
    let closed = false; try { closed = sessionStorage.getItem("pdi-topbar") === "0"; } catch (e) {}
    if (!msgs.length || closed) { bar.hidden = true; document.body.classList.add("no-topbar"); return; }
    track.innerHTML = msgs.map((m, i) => `<a class="topbar__msg${i ? "" : " is-on"}" href="${ROOT + m.href}" ${i ? 'tabindex="-1"' : ""}><span>${esc(m.text)}</span></a>`).join("");
    const els = $$(".topbar__msg", track); let i = 0;
    if (els.length > 1 && !matchMedia("(prefers-reduced-motion: reduce)").matches) setInterval(() => {
      els[i].classList.remove("is-on"); els[i].tabIndex = -1; i = (i + 1) % els.length; els[i].classList.add("is-on"); els[i].tabIndex = 0;
    }, 5000);
    $("#topbarClose").addEventListener("click", () => { bar.hidden = true; document.body.classList.add("no-topbar"); try { sessionStorage.setItem("pdi-topbar", "0"); } catch (e) {} });
  })();

  /* ---------------- En-tête ---------------- */
  const hdr = $("#hdr");
  const onScroll = () => hdr && hdr.classList.toggle("is-scrolled", window.scrollY > 30);
  onScroll(); window.addEventListener("scroll", onScroll, { passive: true });
  const page = (document.body.className.match(/page-(\S+)/) || [])[1];
  const map = { accueil: "accueil", boutique: "boutique", produit: "boutique", apropos: "apropos", contact: "contact" };
  const params = new URLSearchParams(location.search);
  $$(".nav [data-nav]").forEach((a) => {
    const n = a.dataset.nav;
    if ((n === "nouveautes" && page === "boutique" && params.get("filtre") === "nouveautes") || (n === map[page] && !(n === "boutique" && params.get("filtre") === "nouveautes"))) a.classList.add("is-current");
  });

  /* ---------------- Notification ---------------- */
  let tT;
  function toast(html, action) {
    const t = $("#toast"); if (!t) return;
    t.innerHTML = `<span class="toast__ico" aria-hidden="true">✓</span><span>${html}</span>${action ? `<button type="button">${esc(action.label)}</button>` : ""}`;
    if (action) $("button", t).addEventListener("click", () => { t.classList.remove("is-on"); action.fn(); });
    t.classList.add("is-on"); clearTimeout(tT); tT = setTimeout(() => t.classList.remove("is-on"), 4200);
  }

  /* ---------------- Animations au défilement ---------------- */
  const io = "IntersectionObserver" in window ? new IntersectionObserver((ents) => ents.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } }), { rootMargin: "0px 0px -8% 0px", threshold: .08 }) : null;
  function reveal(scope) { $$(".reveal, .reveal-stagger", scope || document).forEach((el) => io ? io.observe(el) : el.classList.add("is-in")); }

  /* ---------------- Rails (carrousels produits) ---------------- */
  function initRails(scope) {
    $$("[data-rail]", scope || document).forEach((rail) => {
      if (rail.dataset.ids && !rail.children.length) rail.innerHTML = JSON.parse(rail.dataset.ids).map((id) => byId[id]).filter(Boolean).map(cardHTML).join("");
      const sec = rail.closest("section") || document;
      const prev = $("[data-rail-prev]", sec), next = $("[data-rail-next]", sec);
      const step = () => { const c = rail.firstElementChild; return c ? (c.getBoundingClientRect().width + 16) * Math.max(1, Math.floor(rail.clientWidth / (c.getBoundingClientRect().width + 16))) : rail.clientWidth; };
      const upd = () => { if (prev) prev.disabled = rail.scrollLeft < 8; if (next) next.disabled = rail.scrollLeft + rail.clientWidth > rail.scrollWidth - 8; };
      prev && prev.addEventListener("click", () => rail.scrollBy({ left: -step(), behavior: "smooth" }));
      next && next.addEventListener("click", () => rail.scrollBy({ left: step(), behavior: "smooth" }));
      rail.addEventListener("scroll", upd, { passive: true }); upd();
    });
  }

  /* ---------------- Horaires : ouvert / fermé ---------------- */
  (function openNow() {
    let d; try { d = new Date(new Date().toLocaleString("en-US", { timeZone: "Africa/Brazzaville" })); } catch (e) { return; }
    const day = d.getDay(), m = d.getHours() * 60 + d.getMinutes();
    const open = (day >= 1 && day <= 5 && ((m >= 480 && m < 720) || (m >= 810 && m < 1020))) || (day === 6 && m >= 480 && m < 720);
    $$("[data-open-status]").forEach((el) => { el.textContent = open ? "Ouvert maintenant" : "Fermé actuellement"; el.classList.add(open ? "is-open" : "is-closed"); });
  })();
  $$("[data-year]").forEach((el) => (el.textContent = new Date().getFullYear()));

  /* ---------------- Newsletter (par e-mail, sans stockage) ---------------- */
  const nl = $("#nlForm");
  if (nl) nl.addEventListener("submit", (e) => {
    e.preventDefault();
    const em = $("#nlEmail").value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(em)) { toast("Merci d'indiquer une adresse e-mail valide."); $("#nlEmail").focus(); return; }
    location.href = `mailto:${D.site.email}?subject=${encodeURIComponent("Inscription aux nouveautés CAP DE LA PDI")}&body=${encodeURIComponent("Bonjour,\n\nJe souhaite recevoir vos nouveautés, arrivages et promotions à cette adresse : " + em + "\n\nMerci.")}`;
    toast("Votre messagerie s'ouvre : envoyez le message pour confirmer l'inscription.");
  });

  window.PDI = { D, ROOT, $, $$, esc, fmt, byId, catById, optLabel, optOf, priceOf, unitOf, isQuote, minPrice, imgHTML, placeholder, priceHTML, cardHTML, Cart, linesHTML, openCart, toast, reveal, initRails, search, norm, store };
  renderCart(); reveal(); initRails();
})();
