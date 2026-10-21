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
    const motes = $(".intro__motes", intro), n = innerWidth < 600 ? 18 : 40;
    let h = ""; for (let i = 0; i < n; i++) h += `<i style="left:${Math.random() * 100}%;--s:${2 + Math.random() * 5}px;--d:${3 + Math.random() * 3}s;--dl:${Math.random() * 4}s;--x:${(Math.random() - .5) * 120}px"></i>`;
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
    setTimeout(finish, 13500); // sécurité
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

/* ---- Globe qui tourne sans interruption ---- */
(function globe() {
  const svg = document.getElementById("globe"); if (!svg) return;
  const R = 110, NS = "http://www.w3.org/2000/svg", rad = Math.PI / 180, tilt = 18 * rad;
  const el = (n, a) => { const e = document.createElementNS(NS, n); for (const k in a) e.setAttribute(k, a[k]); return e; };
  const defs = el("defs", {});
  const g1 = el("radialGradient", { id: "gl", cx: "38%", cy: "32%", r: "75%" });
  [["0%", "#2f8f52"], ["60%", "#134a34"], ["100%", "#081d14"]].forEach(([o, c]) => g1.appendChild(el("stop", { offset: o, "stop-color": c })));
  defs.appendChild(g1); svg.appendChild(defs);
  svg.appendChild(el("circle", { r: R + 12, fill: "rgba(242,182,50,.12)" }));
  svg.appendChild(el("circle", { r: R, fill: "url(#gl)", stroke: "rgba(242,182,50,.55)", "stroke-width": 1.2 }));
  const grid = el("g", { fill: "none", stroke: "rgba(255,255,255,.18)", "stroke-width": .8 }); svg.appendChild(grid);
  const landG = el("g", { fill: "rgba(242,182,50,.28)", stroke: "rgba(247,207,107,.75)", "stroke-width": 1, "stroke-linejoin": "round" }); svg.appendChild(landG);
  const lands = [
    [[35.8,-5.9],[37.1,10],[33,11.5],[32.6,22],[31.2,32.3],[29.9,32.6],[22,36.8],[15.6,39.5],[12.6,43.3],[11.8,51.2],[10.4,51],[4,47.8],[-1.7,41.6],[-6.2,39.3],[-10.5,40.5],[-15,40.7],[-20,35],[-25.9,32.9],[-29.9,31],[-34,25.6],[-34.8,20],[-33.9,18.4],[-28.6,16.5],[-22.9,14.5],[-17.2,11.8],[-12.6,13.6],[-8.8,13.2],[-4.8,11.9],[-0.7,8.8],[4,9.7],[4.4,7],[6.4,3.4],[5.6,-0.2],[4.9,-1.8],[5.3,-4],[4.4,-7.5],[6.3,-10.8],[8.5,-13.2],[11.9,-16.7],[14.7,-17.4],[20.8,-17],[27,-13.2],[31.6,-9.8],[35.8,-5.9]],
    [[36,-6],[43.4,-8.2],[43.4,-1.8],[47.5,-2.5],[48.6,-4.6],[51,2],[53.4,5],[54,8.8],[57.6,10],[56,12.5],[54.2,13.8],[54.4,19.6],[59.4,24],[60.5,30],[46,30],[45.2,29.7],[41.8,28.1],[40.9,26],[37.9,23.7],[36.6,22.4],[39.9,19.5],[40.6,18],[38.1,15.6],[41.9,12.2],[44.4,8.9],[43.3,5.4],[41.9,3.2],[40.4,0.3],[36.7,-2.2],[36,-6]],
    [[-12,49.3],[-15.7,50.2],[-25.6,47.1],[-25.1,44],[-21.9,43.3],[-16.8,44.5],[-12,49.3]],
    [[29.9,32.6],[27.7,34.2],[24,38],[17,42.7],[12.7,43.5],[14.5,49],[17,54],[22.6,59.8],[26.4,56.4],[24.3,51.5],[29.3,48.1],[30.1,47.9],[29,34.8],[29.9,32.6]],
  ];
  const landP = lands.map(() => { const p = el("path", {}); landG.appendChild(p); return p; });
  const dots = el("g", {}); svg.appendChild(dots);
  svg.appendChild(el("circle", { r: R, fill: "none", stroke: "rgba(242,182,50,.5)", "stroke-width": 1 }));
  // villes (lat, lon) : Pointe-Noire mise en avant
  const cities = [[-4.8, 11.9, 1], [-4.3, 15.3], [5.3, -4.0], [14.7, -17.4], [4.05, 9.7], [0.4, 9.45], [6.5, 3.4], [-1.3, 36.8], [-26.2, 28.0], [30.0, 31.2], [33.6, -7.6], [48.85, 2.35], [9.0, 38.7], [-8.8, 13.2], [12.4, -1.5]];
  const project = (lat, lon, rot) => {
    const la = lat * rad, lo = lon * rad + rot;
    let x = Math.cos(la) * Math.sin(lo), y = Math.sin(la), z = Math.cos(la) * Math.cos(lo);
    const y2 = y * Math.cos(tilt) - z * Math.sin(tilt), z2 = y * Math.sin(tilt) + z * Math.cos(tilt);
    return [x * R, -y2 * R, z2];
  };
  const path = (pts) => { let d = "", pen = false; pts.forEach(([x, y, z]) => { if (z > 0) { d += (pen ? "L" : "M") + x.toFixed(1) + " " + y.toFixed(1); pen = true; } else pen = false; }); return d; };
  const lines = [];
  for (let lat = -60; lat <= 60; lat += 30) { const p = el("path", {}); grid.appendChild(p); lines.push({ type: "lat", v: lat, p }); }
  for (let lon = 0; lon < 180; lon += 20) { const p = el("path", {}); grid.appendChild(p); lines.push({ type: "lon", v: lon, p }); }
  const cdots = cities.map(([la, lo, main]) => {
    const c = el("circle", { r: main ? 4.5 : 2.4, fill: main ? "#f2b632" : "rgba(255,236,190,.9)" }); dots.appendChild(c);
    let halo = null; if (main) { halo = el("circle", { r: 4.5, fill: "none", stroke: "#f2b632", "stroke-width": 1.5, class: "globe__ping" }); dots.appendChild(halo); }
    return { la, lo, c, halo };
  });
  const label = svg.parentNode.querySelector(".globe__label");
  let rot = -0.35;
  function landPath(poly) {
    const pts = []; for (let i = 0; i < poly.length - 1; i++) { const [a1, b1] = poly[i], [a2, b2] = poly[i + 1]; for (let k = 0; k < 4; k++) pts.push(project(a1 + (a2 - a1) * k / 4, b1 + (b2 - b1) * k / 4, rot)); }
    if (pts.every((p) => p[2] <= 0)) return "";
    return "M" + pts.map(([x, y, z]) => { if (z < 0) { const m = Math.hypot(x, y) || 1; x = x / m * R; y = y / m * R; } return x.toFixed(1) + " " + y.toFixed(1); }).join("L") + "Z";
  }
  function draw() {
    lands.forEach((poly, i) => landP[i].setAttribute("d", landPath(poly)));
    lines.forEach((l) => {
      const pts = [];
      if (l.type === "lat") for (let lo = 0; lo <= 360; lo += 6) pts.push(project(l.v, lo, rot));
      else { for (let la = -90; la <= 90; la += 5) pts.push(project(la, l.v, rot)); for (let la = 90; la >= -90; la -= 5) pts.push(project(la, l.v + 180, rot)); }
      l.p.setAttribute("d", path(pts));
    });
    cdots.forEach((d) => {
      const [x, y, z] = project(d.la, d.lo, rot), vis = z > 0.02;
      d.c.setAttribute("cx", x.toFixed(1)); d.c.setAttribute("cy", y.toFixed(1)); d.c.style.opacity = vis ? Math.min(1, z * 2.5) : 0;
      if (d.halo) { d.halo.setAttribute("cx", x.toFixed(1)); d.halo.setAttribute("cy", y.toFixed(1)); d.halo.style.display = vis ? "" : "none";
        if (label) { label.style.opacity = vis && z > .3 ? 1 : 0; label.style.left = (50 + x / 260 * 100).toFixed(1) + "%"; label.style.top = (50 + y / 260 * 100).toFixed(1) + "%"; } }
    });
  }
  let last = performance.now();
  function frame(t) { rot += ((t - last) / 1000) * 0.32; last = t; draw(); requestAnimationFrame(frame); }
  draw(); requestAnimationFrame(frame);
})();
