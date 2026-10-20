/* Commande : formulaire, validation et envoi réel par WhatsApp ou e-mail */
(function () {
  "use strict";
  const { $, $$, D, esc, fmt, byId, priceOf, unitOf, isQuote, Cart, linesHTML, ROOT } = window.PDI;
  const app = $("#checkoutApp"); if (!app) return;
  const form = $("#coForm");

  function emptyState() {
    app.innerHTML = `<div class="done"><div class="done__ico" aria-hidden="true">🧺</div><h1>Votre panier est vide</h1><p>Ajoutez des produits ou des demandes de devis depuis la boutique.</p><a class="btn btn--primary btn--lg" href="${ROOT}boutique.html">Découvrir la boutique</a></div>`;
  }
  if (!Cart.items().length) { emptyState(); return; }

  $("#coDelivery").innerHTML = D.delivery.map((d, i) => `<label class="radio"><input type="radio" name="livraison" value="${d.id}" ${i ? "" : "checked"}><span><strong>${esc(d.label)}</strong><span>${esc(d.desc)}</span></span></label>`).join("");
  $("#coPay").innerHTML = D.payments.map((p, i) => `<label class="radio"><input type="radio" name="paiement" value="${p.id}" ${i ? "" : "checked"}><span><strong>${esc(p.label)}</strong></span></label>`).join("");
  $("#coDepot").innerHTML = D.depots.map((d) => `<option value="${d.id}">${esc(d.name)} – ${esc(d.addr)}</option>`).join("");

  function summary() {
    const items = Cart.items(); if (!items.length) { emptyState(); return; }
    $("#coLines").innerHTML = linesHTML(true);
    const t = Cart.totals();
    $("#coTotal").innerHTML = (t.priced.length ? `<div class="sum"><span>Sous-total</span><strong>${fmt(t.total)}</strong></div>` : "") +
      `<p class="sum-note">${t.quoted.length ? t.quoted.length + " article(s) sur devis, chiffré(s) par notre équipe. " : ""}Frais de livraison éventuels communiqués avant validation.</p>`;
    $("#coAirport").hidden = !items.some((l) => byId[l.id].cat === "reproducteurs");
  }
  summary(); Cart.onChange(summary);

  function syncDelivery() {
    const v = form.livraison.value;
    $("#depotField").hidden = v !== "retrait";
    $("#addrField").hidden = v === "retrait";
    $("#addrField").firstChild.textContent = v === "expedition" ? "Ville et adresse de destination *" : "Adresse ou quartier de livraison *";
  }
  $$("input[name=livraison]").forEach((r) => r.addEventListener("change", syncDelivery)); syncDelivery();

  const setErr = (name, msg) => { const f = form[name].closest(".field"); f.classList.toggle("invalid", !!msg); $(".err", f).textContent = msg || ""; };
  function validate() {
    let ok = true; const v = (n) => form[n].value.trim();
    if (v("nom").length < 2) { setErr("nom", "Indiquez votre nom."); ok = false; } else setErr("nom");
    if (v("tel").replace(/\D/g, "").length < 8) { setErr("tel", "Indiquez un numéro de téléphone valide."); ok = false; } else setErr("tel");
    if (v("email") && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v("email"))) { setErr("email", "Adresse e-mail invalide."); ok = false; } else setErr("email");
    if (form.livraison.value !== "retrait" && v("adresse").length < 3) { setErr("adresse", "Indiquez l'adresse ou le quartier."); ok = false; } else setErr("adresse");
    $("#cgvErr").textContent = form.cgv.checked ? "" : "Merci d'accepter les conditions générales de vente.";
    if (!form.cgv.checked) ok = false;
    if (!ok) { const first = $(".field.invalid input, .field.invalid select", form) || form.cgv; first.focus(); }
    return ok;
  }

  function message() {
    const now = new Date(), pad = (n) => String(n).padStart(2, "0");
    const ref = `CMD-${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}`;
    const t = Cart.totals();
    const kind = t.priced.length && t.quoted.length ? "COMMANDE + DEMANDE DE DEVIS" : t.priced.length ? "COMMANDE" : "DEMANDE DE DEVIS";
    const clean = (s) => String(s).replace(/[\u0000-\u001f]/g, " ").trim();
    const L = ["Bonjour CAP DE LA PDI,", "", `${kind} – Réf. ${ref}`];
    if (t.priced.length) {
      L.push("", "À COMMANDER :");
      t.priced.forEach((l) => { const p = byId[l.id], pr = priceOf(p, l.option); L.push(`• ${l.qty} × ${p.name}${l.option ? " – " + l.option : ""} (${fmt(pr)} / ${unitOf(p, l.option)}) = ${fmt(pr * l.qty)}`); });
      L.push(`Sous-total : ${fmt(t.total)} (hors frais de livraison éventuels)`);
    }
    if (t.quoted.length) {
      L.push("", "DEMANDE DE DEVIS :");
      t.quoted.forEach((l) => { const p = byId[l.id], pr = priceOf(p, l.option); L.push(`• ${l.qty} × ${p.name}${l.option ? " – " + l.option : ""}${pr != null ? ` (indicatif : ${fmt(pr)} / ${unitOf(p, l.option)})` : ""}`); });
    }
    const d = D.delivery.find((x) => x.id === form.livraison.value);
    const dep = D.depots.find((x) => x.id === form.depot.value);
    const pay = D.payments.find((x) => x.id === form.paiement.value);
    L.push("", "CLIENT :", `Nom : ${clean(form.nom.value)}`, `Téléphone : ${clean(form.tel.value)}`);
    if (form.email.value.trim()) L.push(`E-mail : ${clean(form.email.value)}`);
    if (form.ville.value.trim()) L.push(`Ville : ${clean(form.ville.value)}`);
    L.push(`Livraison : ${d.label}${d.id === "retrait" ? " – " + dep.name : " – " + clean(form.adresse.value)}`);
    L.push(`Paiement souhaité : ${pay.label}`);
    if (form.gros.checked) L.push("Demande de PRIX DE GROS (palette / conteneur)");
    if (form.message.value.trim()) L.push("", `Message : ${clean(form.message.value)}`);
    return { ref, kind, text: L.join("\n") };
  }

  let via = "whatsapp";
  $$("[data-via]", form).forEach((b) => b.addEventListener("click", () => (via = b.dataset.via)));
  form.addEventListener("submit", (e) => {
    e.preventDefault(); if (!validate()) return;
    const m = message();
    const wa = `https://wa.me/${D.site.whatsapp}?text=${encodeURIComponent(m.text)}`;
    const mail = `mailto:${D.site.email}?subject=${encodeURIComponent(m.kind + " " + m.ref + " – " + form.nom.value.trim())}&body=${encodeURIComponent(m.text)}`;
    if (via === "email") location.href = mail; else window.open(wa, "_blank", "noopener");
    app.innerHTML = `<div class="done">
      <div class="done__ico" aria-hidden="true">✓</div>
      <h1>Votre message est prêt</h1>
      <p>${via === "email" ? "Votre messagerie s'est ouverte" : "WhatsApp s'est ouvert"} avec le détail de votre ${m.kind.toLowerCase()}. <strong>Envoyez ce message</strong> pour transmettre votre demande à notre équipe.</p>
      <span class="ref">Référence : ${m.ref}</span>
      <ol>
        <li>Nous vérifions la disponibilité et vous confirmons le montant total.</li>
        <li>Vous recevez les instructions de paiement (Mobile Money, virement ou espèces).</li>
        <li>Vous récupérez votre commande au dépôt choisi, ou nous organisons la livraison.</li>
      </ol>
      <div style="display:flex;flex-wrap:wrap;gap:.7rem;justify-content:center">
        <a class="btn btn--wa" href="${wa}" target="_blank" rel="noopener">Renvoyer par WhatsApp</a>
        <a class="btn btn--outline" href="${mail}">Renvoyer par e-mail</a>
      </div>
      <p style="margin-top:2rem"><button class="btn btn--primary btn--lg" type="button" id="coDone">J'ai envoyé ma commande – vider le panier</button></p>
      <p class="sum-note">Votre panier reste enregistré tant que vous n'avez pas confirmé l'envoi.</p>
    </div>`;
    scrollTo({ top: 0, behavior: "smooth" });
    $("#coDone").addEventListener("click", () => { Cart.clear(); location.href = ROOT + "index.html"; });
  });
})();
