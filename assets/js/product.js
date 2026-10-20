/* Fiche produit : galerie, zoom, variantes, ajout au panier, achat rapide */
(function () {
  "use strict";
  const { $, $$, byId, fmt, priceOf, unitOf, Cart, ROOT } = window.PDI;
  const root = $("[data-product]"); if (!root) return;
  const p = byId[root.dataset.product];
  let option = p.options ? (typeof p.options[0] === "string" ? p.options[0] : p.options[0].label) : "";

  /* ---- Galerie ---- */
  const gal = $("[data-gallery]");
  if (gal) {
    const main = $(".gal__main", gal), slides = $$(".gal__slide", gal), thumbs = $$(".gal__thumb", gal);
    let cur = 0;
    const go = (i) => {
      cur = (i + slides.length) % slides.length;
      slides.forEach((s, k) => s.classList.toggle("is-active", k === cur));
      thumbs.forEach((t, k) => t.classList.toggle("is-active", k === cur));
    };
    thumbs.forEach((t) => t.addEventListener("click", () => go(+t.dataset.go)));
    // Zoom au survol (souris)
    const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (fine) {
      main.addEventListener("mousemove", (e) => {
        const r = main.getBoundingClientRect(); const img = $(".gal__slide.is-active img", main);
        img.style.transformOrigin = `${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`;
        main.classList.add("is-zooming");
      });
      main.addEventListener("mouseleave", () => main.classList.remove("is-zooming"));
    }
    // Balayage tactile
    let x0 = null;
    main.addEventListener("touchstart", (e) => (x0 = e.touches[0].clientX), { passive: true });
    main.addEventListener("touchend", (e) => { if (x0 == null || slides.length < 2) return; const dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 40) go(cur + (dx < 0 ? 1 : -1)); x0 = null; }, { passive: true });
    // Plein écran
    const lb = $("#lightbox"), lbImg = $("img", lb);
    const srcOf = (i) => { const im = $("img", slides[i]); const s = im.getAttribute("srcset").split(", ").pop().split(" ")[0]; return { src: s, alt: im.alt }; };
    const show = (i) => { cur = (i + slides.length) % slides.length; const s = srcOf(cur); lbImg.src = s.src; lbImg.alt = s.alt; go(cur); };
    const openLb = () => { show(cur); lb.classList.toggle("single", slides.length < 2); lb.classList.add("is-on"); lb.setAttribute("aria-hidden", "false"); document.body.classList.add("lock"); $("[data-close-lb]", lb).focus(); };
    const closeLb = () => { lb.classList.remove("is-on"); lb.setAttribute("aria-hidden", "true"); document.body.classList.remove("lock"); };
    main.addEventListener("click", (e) => { if (!fine || e.target.closest("[data-zoom]")) openLb(); });
    $("[data-zoom]", gal).addEventListener("click", (e) => { e.stopPropagation(); openLb(); });
    $("[data-close-lb]", lb).addEventListener("click", closeLb);
    $("[data-lb-prev]", lb).addEventListener("click", () => show(cur - 1));
    $("[data-lb-next]", lb).addEventListener("click", () => show(cur + 1));
    lb.addEventListener("click", (e) => { if (e.target === lb) closeLb(); });
    let lx = null;
    lb.addEventListener("touchstart", (e) => (lx = e.touches[0].clientX), { passive: true });
    lb.addEventListener("touchend", (e) => { if (lx == null) return; const dx = e.changedTouches[0].clientX - lx; if (Math.abs(dx) > 40) show(cur + (dx < 0 ? 1 : -1)); lx = null; }, { passive: true });
    document.addEventListener("keydown", (e) => { if (!lb.classList.contains("is-on")) return; if (e.key === "Escape") closeLb(); if (e.key === "ArrowRight") show(cur + 1); if (e.key === "ArrowLeft") show(cur - 1); });
  }

  /* ---- Variantes ---- */
  const updPrice = () => {
    const pr = priceOf(p, option);
    const amt = $("[data-amount]"); if (amt && pr != null) amt.textContent = fmt(pr);
    const un = $("[data-unit]"); if (un) un.textContent = unitOf(p, option);
    const sp = $("[data-sticky-price]"); if (sp) sp.textContent = pr == null ? "Prix sur devis" : fmt(pr) + (option ? " · " + option : "");
  };
  $$(".opt").forEach((b) => b.addEventListener("click", () => {
    $$(".opt").forEach((x) => { x.classList.toggle("is-active", x === b); x.setAttribute("aria-pressed", x === b); });
    option = b.dataset.opt; const l = $("[data-opt-label]"); if (l) l.textContent = option; updPrice();
  }));
  updPrice();

  /* ---- Quantité & achat ---- */
  const q = $("[data-qty] input");
  $$("[data-qty] [data-step]").forEach((b) => b.addEventListener("click", () => { q.value = Math.max(1, (parseInt(q.value, 10) || 1) + +b.dataset.step); }));
  const qty = () => Math.max(1, parseInt(q && q.value, 10) || 1);
  const add = $("[data-add]"); if (add) add.addEventListener("click", () => Cart.add(p.id, option, qty()));
  const now = $("[data-buynow]"); if (now) now.addEventListener("click", () => { Cart.add(p.id, option, qty()); location.href = ROOT + "commande.html"; });

  /* ---- Barre d'achat fixe (mobile) ---- */
  const sticky = $("#stickyBuy"), target = $(".pp__buy");
  if (sticky && target && "IntersectionObserver" in window) {
    new IntersectionObserver(([e]) => sticky.classList.toggle("is-on", !e.isIntersecting && e.boundingClientRect.top < 0)).observe(target);
    $("[data-sticky-add]", sticky).addEventListener("click", () => {
      if (p.link) { window.open(p.link, "_blank", "noopener"); return; }
      Cart.add(p.id, option, qty());
    });
  }
})();
