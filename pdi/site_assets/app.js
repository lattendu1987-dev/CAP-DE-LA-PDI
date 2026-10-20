// Apparition douce des blocs au défilement. Sans JavaScript, tout reste visible.
(function () {
  var els = document.querySelectorAll(".reveal");
  if (!("IntersectionObserver" in window)) {
    els.forEach(function (el) { el.classList.add("in"); });
    return;
  }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) { entry.target.classList.add("in"); io.unobserve(entry.target); }
    });
  }, { rootMargin: "0px 0px -8% 0px" });
  els.forEach(function (el) { io.observe(el); });
  // Sécurité : tout afficher après 2 s même si l'observateur ne s'est pas déclenché.
  setTimeout(function () { els.forEach(function (el) { el.classList.add("in"); }); }, 2000);
})();
