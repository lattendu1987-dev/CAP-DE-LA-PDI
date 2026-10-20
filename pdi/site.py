"""Générateur du site statique de guides d'achat (affiliation Amazon.ca).

`python -m pdi site` écrit le site dans public/ à partir de config/site.toml.
Aucun témoin, aucun outil de mesure tiers : rien à faire consentir (Loi 25).
"""

from __future__ import annotations

import html
import shutil
from pathlib import Path
from urllib.parse import quote_plus

from . import config

ASSETS = Path(__file__).resolve().parent / "site_assets"
DISCLOSURE = (
    "En tant que Partenaire Amazon, nous touchons une commission sur les achats admissibles "
    "faits par nos liens, sans frais supplémentaires pour vous. Nous n'avons pas testé "
    "chaque produit : nos guides expliquent les critères à vérifier."
)


def e(s: str) -> str:
    return html.escape(s, quote=True)


def amazon_url(query: str, tag: str) -> str:
    url = f"https://www.amazon.ca/s?k={quote_plus(query)}"
    return f"{url}&tag={quote_plus(tag)}" if tag else url


def page(site: dict, title: str, description: str, body: str, path: str) -> str:
    full_title = title if title == site["name"] else f"{title} · {site['name']}"
    canonical = site["base_url"].rstrip("/") + "/" + ("" if path == "index.html" else path)
    return f"""<!doctype html>
<html lang="fr-CA">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{e(full_title)}</title>
<meta name="description" content="{e(description)}">
<link rel="canonical" href="{e(canonical)}">
<meta property="og:title" content="{e(full_title)}">
<meta property="og:description" content="{e(description)}">
<meta property="og:type" content="website">
<meta property="og:locale" content="fr_CA">
<meta name="theme-color" content="#14243a">
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🐾</text></svg>">
<link rel="stylesheet" href="style.css">
<script>document.documentElement.classList.add("js")</script>
</head>
<body>
<a class="skip" href="#contenu">Aller au contenu</a>
<header class="top">
  <a class="brand" href="./"><span aria-hidden="true">🐾</span> {e(site['name'])}</a>
  <nav aria-label="Navigation principale"><a href="./#guides">Guides</a><a href="a-propos.html">À propos</a></nav>
</header>
<div class="disclosure" role="note">{e(DISCLOSURE)} <a href="divulgation.html">En savoir plus</a></div>
<main id="contenu">
{body}
</main>
<footer class="foot">
  <p><strong>{e(site['name'])}</strong> — {e(site['tagline'])}</p>
  <p><a href="divulgation.html">Divulgation</a> · <a href="confidentialite.html">Confidentialité</a> · <a href="a-propos.html">À propos</a></p>
  <p class="muted">Mis à jour le {e(site['updated'])}. Amazon, Amazon.ca et le logo Amazon sont des marques de commerce d'Amazon.com, Inc. ou de ses sociétés affiliées.</p>
</footer>
<script src="app.js" defer></script>
</body>
</html>
"""


def guide_card(g: dict) -> str:
    return f"""<a class="card reveal" href="{e(g['slug'])}.html">
  <span class="card-icon" aria-hidden="true">{e(g['icon'])}</span>
  <h3>{e(g['title'])}</h3>
  <p>{e(g['description'])}</p>
  <span class="card-cta">Lire le guide →</span>
</a>"""


def index_body(site: dict, guides: list[dict]) -> str:
    cards = "\n".join(guide_card(g) for g in guides)
    return f"""<section class="hero">
  <div class="snow" aria-hidden="true"></div>
  <p class="eyebrow">Guides d'achat indépendants</p>
  <h1>L'hiver est long.<br><span>Vos animaux méritent le bon équipement.</span></h1>
  <p class="lead">{e(site['tagline'])} Des critères clairs, sans faux avis, pour acheter une seule fois et bien.</p>
  <a class="btn" href="#guides">Voir les guides</a>
</section>
<section id="guides" class="section">
  <h2 class="reveal">Nos guides</h2>
  <div class="grid">
{cards}
  </div>
</section>
<section class="section promise reveal">
  <h2>Notre façon de faire</h2>
  <ul class="checks">
    <li>Nous expliquons <strong>quoi vérifier</strong> avant d'acheter, selon la réalité de l'hiver québécois.</li>
    <li>Nous n'inventons <strong>ni avis ni tests</strong>.</li>
    <li>Nous n'affichons <strong>pas de prix</strong> qui pourraient être périmés : vous les voyez à jour sur Amazon.ca.</li>
  </ul>
</section>"""


def guide_body(g: dict, tag: str) -> str:
    parts = [f"""<article class="guide">
<header class="guide-head reveal">
  <p class="eyebrow"><span aria-hidden="true">{e(g['icon'])}</span> Guide d'achat</p>
  <h1>{e(g['title'])}</h1>
  <p class="lead">{e(g['intro'])}</p>
</header>"""]
    for s in g.get("sections", []):
        parts.append(f'<section class="block reveal"><h2>{e(s["h"])}</h2>')
        for p in s.get("p", []):
            parts.append(f"<p>{e(p)}</p>")
        if s.get("bullets"):
            parts.append('<ul class="checks">' + "".join(f"<li>{e(b)}</li>" for b in s["bullets"]) + "</ul>")
        parts.append("</section>")
    picks = "".join(
        f"""<li class="pick reveal"><div><h3>{e(p['label'])}</h3><p>{e(p['why'])}</p></div>
<a class="btn btn-small" href="{e(amazon_url(p['query'], tag))}" rel="sponsored nofollow noopener" target="_blank">Voir les prix sur Amazon.ca</a></li>"""
        for p in g.get("picks", [])
    )
    parts.append(f'<section class="block"><h2 class="reveal">Où chercher</h2><ul class="picks">{picks}</ul>'
                 f'<p class="muted small">Liens d\'affiliation. Les prix et la disponibilité changent : vérifiez-les sur Amazon.ca.</p></section>')
    if g.get("faq"):
        faq = "".join(f"<details class=\"reveal\"><summary>{e(f['q'])}</summary><p>{e(f['a'])}</p></details>" for f in g["faq"])
        parts.append(f'<section class="block"><h2 class="reveal">Questions fréquentes</h2>{faq}</section>')
    parts.append('<p class="back"><a href="./#guides">← Tous les guides</a></p></article>')
    return "\n".join(parts)


STATIC_PAGES = {
    "divulgation.html": ("Divulgation", "Comment ce site est financé.", """<article class="guide prose">
<h1>Divulgation</h1>
<p>Ce site participe au Programme Partenaires d'Amazon.ca, un programme d'affiliation qui permet de toucher une commission en créant des liens vers Amazon.ca.</p>
<p>Quand vous achetez après avoir cliqué sur l'un de nos liens, nous pouvons recevoir une commission. Le prix que vous payez ne change pas.</p>
<p>Nous ne recevons ni produits gratuits ni paiements de marques. Nos guides présentent des critères de choix ; ils ne prétendent pas avoir testé chaque produit.</p>
</article>"""),
    "confidentialite.html": ("Confidentialité", "Quels renseignements ce site recueille.", """<article class="guide prose">
<h1>Politique de confidentialité</h1>
<p><strong>En bref : ce site ne recueille aucun renseignement personnel.</strong></p>
<h2>Ce que nous ne faisons pas</h2>
<ul class="checks"><li>Aucun formulaire, aucun compte, aucune infolettre.</li><li>Aucun témoin (cookie) ni outil de mesure d'audience déposé par ce site.</li><li>Aucune publicité ciblée.</li></ul>
<h2>Hébergement</h2>
<p>Le site est hébergé par GitHub Pages (GitHub, Inc.), qui peut traiter des données techniques comme l'adresse IP pour assurer la sécurité du service, selon sa propre politique de confidentialité.</p>
<h2>Liens vers Amazon.ca</h2>
<p>Quand vous cliquez sur un lien vers Amazon.ca, vous quittez ce site. Amazon peut alors utiliser des témoins, notamment pour attribuer la commission, selon sa propre politique de confidentialité.</p>
<h2>Questions</h2>
<p>Pour toute question sur la protection des renseignements personnels, ouvrez une demande sur la <a href="https://github.com/lattendu1987-dev/CAP-DE-LA-PDI/issues">page du projet</a>.</p>
</article>"""),
    "a-propos.html": ("À propos", "Qui sommes-nous et comment nos guides sont faits.", """<article class="guide prose">
<h1>À propos</h1>
<p>Pattes au chaud publie des guides d'achat pour les propriétaires d'animaux au Québec, avec une attention particulière à l'hiver : froid intense, sel de déglaçage, jours courts.</p>
<h2>Comment nos guides sont faits</h2>
<ul class="checks"><li>Nous partons des besoins concrets (protéger les coussinets, garder un petit chien au chaud, gérer les poils).</li><li>Nous listons les critères vérifiables : matériaux, mesures, fermetures, autonomie, consignes de sécurité.</li><li>Nous renvoyons vers une recherche Amazon.ca pour comparer les offres à jour.</li></ul>
<p>Nous ne publions ni avis inventés ni classements payés.</p>
</article>"""),
    "404.html": ("Page introuvable", "Cette page n'existe pas.", """<section class="hero small"><h1>Oups, cette page s'est perdue dans la neige.</h1><a class="btn" href="./">Retour à l'accueil</a></section>"""),
}


def build(out_dir: Path | None = None) -> Path:
    data = config.load_toml("site.toml")
    site, guides = data["site"], data["guide"]
    tag = site.get("amazon_tag", "")
    out = out_dir or (config.ROOT / "public")
    if out.exists():
        shutil.rmtree(out)
    out.mkdir(parents=True)
    for asset in ASSETS.iterdir():
        shutil.copy(asset, out / asset.name)

    (out / "index.html").write_text(page(site, site["name"], site["tagline"], index_body(site, guides), "index.html"), encoding="utf-8")
    for g in guides:
        name = f"{g['slug']}.html"
        (out / name).write_text(page(site, g["title"], g["description"], guide_body(g, tag), name), encoding="utf-8")
    for name, (title, desc, body) in STATIC_PAGES.items():
        (out / name).write_text(page(site, title, desc, body, name), encoding="utf-8")

    base = site["base_url"].rstrip("/") + "/"
    urls = [base] + [f"{base}{g['slug']}.html" for g in guides] + [f"{base}{n}" for n in STATIC_PAGES if n != "404.html"]
    sitemap = "\n".join(f"  <url><loc>{e(u)}</loc><lastmod>{site['updated']}</lastmod></url>" for u in urls)
    (out / "sitemap.xml").write_text(
        f'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n{sitemap}\n</urlset>\n',
        encoding="utf-8")
    (out / "robots.txt").write_text(f"User-agent: *\nAllow: /\nSitemap: {base}sitemap.xml\n", encoding="utf-8")
    (out / ".nojekyll").write_text("", encoding="utf-8")
    return out
