/* Football Talent Exchange — animations de la page d'accueil.
   Sans bibliothèque. Respecte « réduire les animations » et allège tout sur les appareils modestes. */
(function () {
  "use strict";
  var root = document.querySelector("[data-lx]");
  if (!root || root.__lx) return;
  root.__lx = true;
  var doc = document.documentElement;
  doc.classList.add("lx-js");
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var conn = navigator.connection || {};
  var lite = reduce || conn.saveData || (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2) || (navigator.deviceMemory && navigator.deviceMemory <= 2);
  if (lite) root.classList.add("lx-lite");
  var finePointer = window.matchMedia("(pointer: fine)").matches;

  /* ---------- Introduction ---------- */
  var intro = root.querySelector(".lx-intro");
  function endIntro() {
    if (!intro || doc.getAttribute("data-lx-intro") !== "on") return;
    intro.classList.add("is-leaving");
    setTimeout(function () { doc.removeAttribute("data-lx-intro"); }, 950);
  }
  if (doc.getAttribute("data-lx-intro") === "on") {
    var introTimer = setTimeout(endIntro, 1500);
    var skip = root.querySelector("[data-lx-skip]");
    intro.addEventListener("click", function () { clearTimeout(introTimer); endIntro(); });
    document.addEventListener("keydown", function once(e) { if (e.key === "Escape") { clearTimeout(introTimer); endIntro(); document.removeEventListener("keydown", once); } });
    if (skip) skip.tabIndex = 0;
  }

  /* ---------- En-tête translucide au défilement ---------- */
  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      doc.classList.toggle("lx-scrolled", window.scrollY > 40);
      var fin = root.querySelector(".lx-final");
      if (fin && !lite) {
        var r = fin.getBoundingClientRect();
        var p = Math.min(1, Math.max(0, 1 - r.top / window.innerHeight));
        fin.style.setProperty("--sp", p.toFixed(3));
      }
      ticking = false;
    });
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Carrousel cinématographique ---------- */
  var hero = root.querySelector("[data-carousel]");
  if (hero) {
    var slides = [].slice.call(hero.querySelectorAll(".lx-slide"));
    var dots = [].slice.call(hero.querySelectorAll(".lx-dot"));
    var current = 0;
    var paused = reduce; // pas de défilement automatique si l'utilisateur réduit les animations
    var visible = true;
    var counter = hero.querySelector("[data-lx-current]");
    var toggle = hero.querySelector("[data-toggle]");
    var leaveTimer;

    function setFocusable(slide, on) {
      [].forEach.call(slide.querySelectorAll("a, button"), function (el) { if (on) el.removeAttribute("tabindex"); else el.setAttribute("tabindex", "-1"); });
      if (on) slide.removeAttribute("aria-hidden"); else slide.setAttribute("aria-hidden", "true");
    }
    function go(i) {
      i = (i + slides.length) % slides.length;
      if (i === current) return;
      var prev = slides[current];
      slides.forEach(function (s) { s.classList.remove("is-leaving"); });
      prev.classList.remove("is-active");
      prev.classList.add("is-leaving");
      setFocusable(prev, false);
      clearTimeout(leaveTimer);
      leaveTimer = setTimeout(function () { prev.classList.remove("is-leaving"); }, 1600);
      var next = slides[i];
      // Relance les animations d'entrée
      next.classList.remove("is-active");
      void next.offsetWidth;
      next.classList.add("is-active");
      setFocusable(next, true);
      dots.forEach(function (d, k) {
        d.classList.remove("is-active");
        d.classList.toggle("is-done", k < i);
      });
      void dots[i].offsetWidth;
      dots[i].classList.add("is-active");
      current = i;
      if (counter) counter.textContent = String(i + 1).padStart(2, "0");
      hero.classList.add("is-ready");
    }
    // La barre de progression de la scène active rythme le défilement : fin de barre = scène suivante.
    dots.forEach(function (d, k) {
      d.addEventListener("click", function () { go(k); });
      var bar = d.querySelector("span");
      bar.addEventListener("animationend", function () { if (k === current && !paused) go(current + 1); });
    });
    hero.querySelector("[data-next]").addEventListener("click", function () { go(current + 1); });
    hero.querySelector("[data-prev]").addEventListener("click", function () { go(current - 1); });
    // Deux notions distinctes : la pause choisie (bouton) et la pause automatique
    // (navigation au clavier dans le carrousel, onglet caché, carrousel hors écran).
    var userPaused = reduce;
    function sync() {
      var keyboardFocus = !!hero.querySelector(":focus-visible");
      paused = userPaused || !visible || document.hidden || keyboardFocus;
      hero.classList.toggle("is-paused", paused);
      if (toggle) toggle.setAttribute("aria-label", userPaused ? toggle.dataset.labelPlay : toggle.dataset.labelPause);
      hero.classList.toggle("is-user-paused", userPaused);
    }
    sync();
    if (toggle) toggle.addEventListener("click", function () { userPaused = !userPaused; sync(); });
    hero.addEventListener("focusin", function () { setTimeout(sync, 0); });
    hero.addEventListener("focusout", function () { setTimeout(sync, 0); });
    document.addEventListener("visibilitychange", sync);
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (es) { visible = es[0].isIntersecting; sync(); }, { threshold: 0.25 }).observe(hero);
    }
    // Clavier
    hero.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight") { go(current + (doc.dir === "rtl" ? -1 : 1)); e.preventDefault(); }
      if (e.key === "ArrowLeft") { go(current + (doc.dir === "rtl" ? 1 : -1)); e.preventDefault(); }
    });
    // Glissement au doigt
    var x0 = null, y0 = null;
    hero.addEventListener("pointerdown", function (e) { if (e.pointerType !== "mouse") { x0 = e.clientX; y0 = e.clientY; } }, { passive: true });
    hero.addEventListener("pointerup", function (e) {
      if (x0 === null) return;
      var dx = e.clientX - x0, dy = e.clientY - y0;
      x0 = null;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) go(current + ((dx < 0) !== (doc.dir === "rtl") ? 1 : -1));
    }, { passive: true });
    // Profondeur : la scène suit doucement la souris (caméra virtuelle)
    if (finePointer && !lite) {
      var raf = 0, mx = 0, my = 0;
      hero.addEventListener("pointermove", function (e) {
        var r = hero.getBoundingClientRect();
        mx = ((e.clientX - r.left) / r.width) * 2 - 1;
        my = ((e.clientY - r.top) / r.height) * 2 - 1;
        if (!raf) raf = requestAnimationFrame(function () { hero.style.setProperty("--mx", mx.toFixed(3)); hero.style.setProperty("--my", my.toFixed(3)); raf = 0; });
      });
      hero.addEventListener("pointerleave", function () { hero.style.setProperty("--mx", "0"); hero.style.setProperty("--my", "0"); });
    }
    // Précharge l'image suivante quand la page est au repos
    var idle = window.requestIdleCallback || function (f) { setTimeout(f, 1200); };
    idle(function () {
      slides.forEach(function (s) { var img = s.querySelector("img"); if (img && img.loading === "lazy") img.loading = "eager"; });
    });
  }

  /* ---------- Apparition au défilement ---------- */
  var reveals = [].slice.call(root.querySelectorAll("[data-reveal]"));
  // Décalage en cascade pour les éléments voisins
  reveals.forEach(function (el) {
    var sib = el.parentElement ? [].indexOf.call(el.parentElement.children, el) : 0;
    el.style.setProperty("--rd", Math.min(sib, 5) * 0.08 + "s");
  });
  if ("IntersectionObserver" in window && !reduce) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.12 });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("is-in"); });
  }

  /* ---------- Compteurs ---------- */
  var counters = [].slice.call(root.querySelectorAll("[data-count]"));
  function animateCount(el) {
    var target = parseInt(el.getAttribute("data-count"), 10) || 0;
    if (reduce || target === 0) { el.textContent = target.toLocaleString(); return; }
    var t0 = performance.now(), dur = 1600;
    (function step(t) {
      var p = Math.min(1, (t - t0) / dur);
      var eased = 1 - Math.pow(1 - p, 4);
      el.textContent = Math.round(target * eased).toLocaleString();
      if (p < 1) requestAnimationFrame(step);
    })(t0);
  }
  if ("IntersectionObserver" in window) {
    var co = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { animateCount(e.target); co.unobserve(e.target); } });
    }, { threshold: 0.5 });
    counters.forEach(function (el) { el.textContent = "0"; co.observe(el); });
  }

  /* ---------- Profondeur des cartes et téléphones ---------- */
  if (finePointer && !lite) {
    [].forEach.call(root.querySelectorAll("[data-tilt]"), function (el) {
      el.addEventListener("pointermove", function (e) {
        var r = el.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        el.style.setProperty("--ty", ((px - 0.5) * 10).toFixed(2));
        el.style.setProperty("--tx", ((0.5 - py) * 8).toFixed(2));
        el.style.setProperty("--px", (px * 100).toFixed(1) + "%");
        el.style.setProperty("--py", (py * 100).toFixed(1) + "%");
      });
      el.addEventListener("pointerleave", function () { el.style.setProperty("--tx", "0"); el.style.setProperty("--ty", "0"); });
    });
  }
})();
