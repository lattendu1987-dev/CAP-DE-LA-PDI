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

  let go = function (n) {
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
  /* ---- Titres : découpe mot par mot ---- */
  $$(".hero__title", hero).forEach((t) => {
    let i = 0;
    const walk = (node) => Array.from(node.childNodes).forEach((n) => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(" ")); return; }
          const w = document.createElement("span"); w.className = "w";
          const inner = document.createElement("span"); inner.textContent = part; inner.style.setProperty("--i", i++);
          w.appendChild(inner); frag.appendChild(w);
        });
        n.replaceWith(frag);
      } else if (n.nodeType === 1) walk(n);
    });
    walk(t);
  });

  /* ---- Balayage lumineux ---- */
  const flash = document.createElement("div"); flash.className = "hero__flash"; hero.appendChild(flash);
  const _go = go;
  go = function (n) { _go(n); if (!reduce) { flash.classList.remove("go"); void flash.offsetWidth; flash.classList.add("go"); } };

  /* ---- Parallaxe souris + défilement (ordinateur) ---- */
  if (!reduce && matchMedia("(hover: hover) and (pointer: fine)").matches) {
    let raf = 0, mx = 0, my = 0;
    hero.addEventListener("mousemove", (e) => {
      const r = hero.getBoundingClientRect(); mx = (e.clientX - r.left) / r.width - .5; my = (e.clientY - r.top) / r.height - .5;
      if (!raf) raf = requestAnimationFrame(() => { hero.style.setProperty("--mx", mx.toFixed(3)); hero.style.setProperty("--my", my.toFixed(3)); raf = 0; });
    });
    let sraf = 0;
    addEventListener("scroll", () => {
      if (sraf) return;
      sraf = requestAnimationFrame(() => { const v = Math.min(1, Math.max(0, scrollY / hero.offsetHeight)); hero.style.setProperty("--sy", v.toFixed(3)); sraf = 0; });
    }, { passive: true });
  }

  /* ---- Introduction cinématique (une fois par session) ---- */
  const root = document.documentElement, intro = $("#intro");
  function startSite() { setPaused(reduce); go(0); }
  if (intro && root.classList.contains("intro-on")) {
    slides[0].classList.remove("is-active");
    intro.setAttribute("aria-hidden", "false");
    const brand = $(".intro__brand", intro);
    brand.innerHTML = Array.from("CAP DE LA PDI").map((c, i) => `<span style="--i:${i}">${c === " " ? "&nbsp;" : c}</span>`).join("");
    const motes = $(".intro__motes", intro), n = innerWidth < 600 ? 14 : 34;
    let h = ""; for (let i = 0; i < n; i++) h += `<i style="left:${Math.random() * 100}%;--s:${2 + Math.random() * 5}px;--d:${2 + Math.random() * 1.6}s;--dl:${Math.random() * 1.2}s;--x:${(Math.random() - .5) * 120}px"></i>`;
    motes.innerHTML = h;
    let done = false;
    const finish = () => {
      if (done) return; done = true;
      try { sessionStorage.setItem("pdi-intro", "1"); } catch (e) {}
      root.classList.remove("intro-on"); intro.remove(); startSite();
    };
    const skip = () => { if (done) return; intro.classList.add("is-leaving"); setTimeout(finish, 650); };
    intro.addEventListener("animationend", (e) => { if (e.target === intro) finish(); });
    $(".intro__skip", intro).addEventListener("click", skip);
    intro.addEventListener("click", (e) => { if (!e.target.closest(".intro__skip")) skip(); });
    addEventListener("keydown", function k(e) { if (["Escape", "Enter", " "].includes(e.key)) { skip(); removeEventListener("keydown", k); } });
    setTimeout(finish, 4500); // sécurité
    $(".intro__skip", intro).focus({ preventScroll: true });
  } else { startSite(); }

  /* ---- Musique d'ambiance (désactivée par défaut, générée par le navigateur) ---- */
  const sb = $(".hero__sound", hero);
  if (sb) {
    let ctx = null, master = null;
    const startPad = () => {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      master = ctx.createGain(); master.gain.value = 0; master.connect(ctx.destination);
      const filter = ctx.createBiquadFilter(); filter.type = "lowpass"; filter.frequency.value = 900; filter.connect(master);
      [130.81, 196.0, 261.63, 329.63, 392.0].forEach((f, i) => {
        const o = ctx.createOscillator(), g = ctx.createGain(), lfo = ctx.createOscillator(), lg = ctx.createGain();
        o.type = i % 2 ? "sine" : "triangle"; o.frequency.value = f; o.detune.value = (i - 2) * 4;
        g.gain.value = .05; lfo.frequency.value = .05 + i * .03; lg.gain.value = .03;
        lfo.connect(lg); lg.connect(g.gain); o.connect(g); g.connect(filter); o.start(); lfo.start();
      });
    };
    sb.addEventListener("click", () => {
      const on = sb.getAttribute("aria-pressed") !== "true";
      if (on && !ctx) startPad();
      if (!ctx) return;
      if (ctx.state === "suspended") ctx.resume();
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.linearRampToValueAtTime(on ? .5 : 0, ctx.currentTime + 1.2);
      sb.setAttribute("aria-pressed", on); sb.setAttribute("aria-label", on ? "Couper la musique d'ambiance" : "Activer la musique d'ambiance");
    });
  }

  /* ---- Vidéo chargée seulement quand elle est visible (et pas en mode économie de données) ---- */
  $$("video[data-lazy-video]").forEach((v) => {
    const conn = navigator.connection || {};
    const light = conn.saveData || /2g/.test(conn.effectiveType || "");
    const load = () => { const s = v.querySelector("source[data-src]"); if (s) { s.src = s.dataset.src; s.removeAttribute("data-src"); v.load(); } };
    if (light || reduce) {
      const b = document.createElement("button"); b.className = "f2__play"; b.type = "button"; b.setAttribute("aria-label", "Lire la vidéo"); b.textContent = "▶";
      v.parentNode.appendChild(b);
      b.addEventListener("click", () => { load(); v.play(); b.remove(); });
      return;
    }
    if (!("IntersectionObserver" in window)) { load(); v.play().catch(() => {}); return; }
    new IntersectionObserver(([e]) => { if (e.isIntersecting) { load(); v.play().catch(() => {}); } else v.pause(); }, { threshold: .25 }).observe(v);
  });


  // Bandeaux datés (masqués après la date de fin)
  $$("[data-until]").forEach((el) => { if (new Date().toISOString().slice(0, 10) > el.dataset.until) el.hidden = true; });

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
