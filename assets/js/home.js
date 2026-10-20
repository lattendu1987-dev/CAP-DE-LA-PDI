/* Accueil : carrousel plein écran, compte à rebours, avis */
(function () {
  "use strict";
  const { $, $$, D, esc } = window.PDI;
  const hero = $("#hero"); if (!hero) return;
  const slides = $$(".hero__slide", hero);
  const dotsBox = $(".hero__dots", hero), count = $(".hero__count", hero), pauseBtn = $(".hero__pause", hero);
  const DELAY = 7000;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  hero.style.setProperty("--hero-delay", DELAY + "ms");
  dotsBox.innerHTML = slides.map((_, i) => `<button class="hero__dot" role="tab" aria-label="Diapositive ${i + 1}"><span></span></button>`).join("");
  const dots = $$(".hero__dot", dotsBox);
  let cur = 0, timer = null, paused = reduce, hover = false;

  function go(n) {
    slides[cur].classList.remove("is-active"); slides[cur].setAttribute("aria-hidden", "true");
    cur = (n + slides.length) % slides.length;
    slides[cur].classList.add("is-active"); slides[cur].removeAttribute("aria-hidden");
    slides.forEach((s, i) => s.querySelectorAll("a, button").forEach((el) => (el.tabIndex = i === cur ? 0 : -1)));
    dots.forEach((d, i) => { d.classList.toggle("is-active", i === cur); d.classList.toggle("is-done", i < cur); d.setAttribute("aria-selected", i === cur); const sp = d.firstElementChild; sp.style.animation = "none"; void sp.offsetWidth; sp.style.animation = ""; });
    count.textContent = String(cur + 1).padStart(2, "0") + " / " + String(slides.length).padStart(2, "0");
    schedule();
  }
  function schedule() { clearTimeout(timer); if (!paused && !hover) timer = setTimeout(() => go(cur + 1), DELAY); }
  function setPaused(p) { paused = p; hero.classList.toggle("is-paused", p || hover); pauseBtn.textContent = p ? "▶" : "❚❚"; pauseBtn.setAttribute("aria-label", p ? "Relancer le carrousel" : "Mettre le carrousel en pause"); schedule(); }
  dots.forEach((d, i) => d.addEventListener("click", () => go(i)));
  $("[data-hero-prev]", hero).addEventListener("click", () => go(cur - 1));
  $("[data-hero-next]", hero).addEventListener("click", () => go(cur + 1));
  pauseBtn.addEventListener("click", () => setPaused(!paused));
  hero.addEventListener("mouseenter", () => { hover = true; hero.classList.add("is-paused"); clearTimeout(timer); });
  hero.addEventListener("mouseleave", () => { hover = false; hero.classList.toggle("is-paused", paused); schedule(); });
  hero.addEventListener("keydown", (e) => { if (e.key === "ArrowRight") go(cur + 1); if (e.key === "ArrowLeft") go(cur - 1); });
  // Balayage tactile
  let x0 = null, y0 = null;
  hero.addEventListener("touchstart", (e) => { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; }, { passive: true });
  hero.addEventListener("touchend", (e) => {
    if (x0 == null) return; const dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) go(cur + (dx < 0 ? 1 : -1)); x0 = null;
  }, { passive: true });
  document.addEventListener("visibilitychange", () => { if (document.hidden) clearTimeout(timer); else schedule(); });
  setPaused(reduce); go(0);

  // Compte à rebours (réservation du vaccin)
  $$("[data-countdown]").forEach((el) => {
    const end = new Date(el.dataset.countdown).getTime(), box = $(".countdown", el);
    const tick = () => {
      const s = Math.max(0, Math.floor((end - Date.now()) / 1000));
      if (!s) { box.innerHTML = "<div><strong>Clos</strong><small>réservations</small></div>"; return; }
      const v = [[Math.floor(s / 86400), "jours"], [Math.floor(s / 3600) % 24, "heures"], [Math.floor(s / 60) % 60, "min"], [s % 60, "s"]];
      box.innerHTML = v.map(([n, l]) => `<div><strong>${String(n).padStart(2, "0")}</strong><small>${l}</small></div>`).join("");
    };
    tick(); setInterval(tick, 1000);
  });

  // Avis clients (affichés uniquement s'il en existe)
  if (D.testimonials && D.testimonials.length) {
    $("#reviews").hidden = false;
    $("#reviewsList").innerHTML = D.testimonials.map((t) => `<blockquote class="review"><p>« ${esc(t.text)} »</p><footer>${esc(t.name)}${t.place ? " · " + esc(t.place) : ""}</footer></blockquote>`).join("");
  }
})();
