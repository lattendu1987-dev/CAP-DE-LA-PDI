# -*- coding: utf-8 -*-
"""
Génère le site CAP DE LA PDI.
Usage (depuis la racine du dépôt) :  python3 build/build.py

- convertit les images de build/src en WebP (plusieurs tailles) dans assets/img
- écrit assets/js/catalog.js (données de la boutique)
- assemble les pages de build/pages avec l'en-tête et le pied de page communs
- génère une fiche HTML par produit dans produits/
- écrit sitemap.xml
"""
import html, json, os, re, sys
from datetime import date
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "build"))
import catalog as C  # noqa: E402

SRC = os.path.join(ROOT, "build", "src")
OUT_IMG = os.path.join(ROOT, "assets", "img")
PAGES = os.path.join(ROOT, "build", "pages")
WIDTHS = [400, 800, 1200, 1800]
VERSION = date.today().strftime("%Y%m%d")
E = html.escape

# ------------------------------------------------------------------ images
MANIFEST = {}

def build_images():
    os.makedirs(OUT_IMG, exist_ok=True)
    for f in sorted(os.listdir(SRC)):
        name, ext = os.path.splitext(f)
        if ext.lower() not in (".jpg", ".jpeg", ".png", ".webp"):
            continue
        im = Image.open(os.path.join(SRC, f))
        has_alpha = im.mode in ("RGBA", "LA", "P")
        im = im.convert("RGBA" if has_alpha else "RGB")
        w, h = im.size
        sizes = [x for x in WIDTHS if x < w] + [min(w, WIDTHS[-1])]
        out = []
        for sw in sorted(set(sizes)):
            sh = round(h * sw / w)
            fn = f"{name}-{sw}.webp"
            path = os.path.join(OUT_IMG, fn)
            if not os.path.exists(path) or os.path.getmtime(path) < os.path.getmtime(os.path.join(SRC, f)):
                im.resize((sw, sh), Image.LANCZOS).save(path, "WEBP", quality=80, method=6)
            out.append((sw, sh, fn))
        MANIFEST[name] = out
    keep = {fn for v in MANIFEST.values() for _, _, fn in v}
    for f in os.listdir(OUT_IMG):  # supprime les images WebP devenues inutiles
        if f.endswith(".webp") and f not in keep:
            os.remove(os.path.join(OUT_IMG, f))
    # image de partage (Open Graph) et logo en JPG/PNG pour les réseaux sociaux
    xxv = Image.open(os.path.join(SRC, "verrat-xxv.png")).convert("RGBA")
    og = Image.new("RGBA", xxv.size, (23, 25, 27, 255)); og.alpha_composite(xxv); og = og.convert("RGB")
    og = og.resize((1200, round(og.height * 1200 / og.width)), Image.LANCZOS)
    top = max(0, (og.height - 630) // 2)
    og.crop((0, top, 1200, top + 630)).save(os.path.join(OUT_IMG, "og-cap-de-la-pdi.jpg"), quality=85)
    Image.open(os.path.join(SRC, "favicon.png")).save(os.path.join(OUT_IMG, "favicon.png"))
    Image.open(os.path.join(SRC, "logo-cap-pdi.png")).convert("RGBA").resize((400, 400), Image.LANCZOS).save(os.path.join(OUT_IMG, "logo-cap-pdi.png"))


def img_data(name):
    v = MANIFEST[name]
    return {
        "src": "assets/img/" + v[min(1, len(v) - 1)][2],
        "srcset": ", ".join(f"assets/img/{fn} {w}w" for w, h, fn in v),
        "w": v[-1][0], "h": v[-1][1],
    }


def img_tag(name, root="", sizes="100vw", cls="", alt="", eager=False, extra=""):
    d = img_data(name)
    srcset = ", ".join(root + s for s in d["srcset"].split(", "))
    load = 'fetchpriority="high"' if eager else 'loading="lazy" decoding="async"'
    c = f' class="{cls}"' if cls else ""
    return (f'<img{c} src="{root}{d["src"]}" srcset="{srcset}" sizes="{sizes}" '
            f'width="{d["w"]}" height="{d["h"]}" alt="{E(alt)}" {load}{extra}>')

# ------------------------------------------------------------------ helpers
def fmt(n):
    return f"{n:,}".replace(",", " ") + " F CFA"

def opt_label(o):
    return o if isinstance(o, str) else o["label"]

def is_quote(p):
    return p.get("price") is None or p.get("quote")

def default_stock(p):
    if p.get("stock"):
        return p["stock"]
    if p["cat"] == "reproducteurs":
        return "Importation sur commande – délai communiqué sur devis"
    if p["cat"] in ("sante", "nutrition", "repro", "soins", "equipement", "volailles"):
        return "Disponibilité confirmée par notre équipe à la commande"
    return "Sur commande"

CAT = {c["id"]: c for c in C.CATEGORIES}

# ------------------------------------------------------------------ catalog.js
def write_catalog_js():
    prods = []
    for p in C.PRODUCTS:
        q = dict(p)
        q["images"] = [img_data(n) for n in p.get("imgs", [])]
        q.pop("imgs", None)
        q["url"] = f"produits/{p['id']}.html"
        q["stock"] = default_stock(p)
        prods.append(q)
    cats = []
    for c in C.CATEGORIES:
        d = dict(c)
        d["image"] = img_data(c["img"]) if c.get("img") else None
        cats.append(d)
    data = {
        "site": C.SITE, "depots": C.DEPOTS, "hours": C.HOURS, "depotHours": C.DEPOT_HOURS, "delivery": C.DELIVERY,
        "payments": C.PAYMENTS, "announcements": C.ANNOUNCEMENTS, "testimonials": C.TESTIMONIALS,
        "categories": cats, "products": prods,
    }
    os.makedirs(os.path.join(ROOT, "assets", "js"), exist_ok=True)
    with open(os.path.join(ROOT, "assets", "js", "catalog.js"), "w", encoding="utf-8") as f:
        f.write("/* Fichier généré par build/build.py — ne pas modifier à la main (éditez build/catalog.py). */\n")
        f.write("window.CAT = " + json.dumps(data, ensure_ascii=False, separators=(",", ":")) + ";\n")

# ------------------------------------------------------------------ layout
ICON = {
    "search": '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
    "bag": '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 8h14l-1 12H6L5 8Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>',
    "menu": '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
    "close": '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>',
    "wa": '<svg viewBox="0 0 32 32" aria-hidden="true" class="ico-fill"><path d="M16 3C8.8 3 3 8.8 3 16c0 2.3.6 4.5 1.7 6.5L3 29l6.7-1.7c1.9 1 4.1 1.6 6.3 1.6 7.2 0 13-5.8 13-13S23.2 3 16 3zm0 23.7c-2 0-3.9-.5-5.6-1.5l-.4-.2-4 1 1.1-3.9-.3-.4c-1.1-1.7-1.7-3.7-1.7-5.8C5.1 10 10 5.2 16 5.2S26.9 10 26.9 16 22 26.7 16 26.7zm6-8c-.3-.2-1.9-1-2.2-1.1-.3-.1-.5-.2-.7.2-.2.3-.8 1.1-1 1.3-.2.2-.4.2-.7.1-.3-.2-1.4-.5-2.6-1.6-1-.9-1.6-1.9-1.8-2.3-.2-.3 0-.5.1-.7l.5-.6c.2-.2.2-.3.3-.6.1-.2 0-.4 0-.6l-1-2.4c-.3-.6-.5-.5-.7-.5h-.6c-.2 0-.6.1-.9.4-.3.3-1.2 1.1-1.2 2.8s1.2 3.2 1.4 3.5c.2.2 2.4 3.6 5.8 5 .8.4 1.4.6 1.9.7.8.3 1.5.2 2.1.1.6-.1 1.9-.8 2.2-1.5.3-.7.3-1.4.2-1.5-.1-.2-.3-.3-.6-.4z"/></svg>',
    "arrow": '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
    "phone": '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/></svg>',
    "mail": '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>',
    "pin": '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-7-6.2-7-12a7 7 0 0 1 14 0c0 5.8-7 12-7 12Z"/><circle cx="12" cy="9" r="2.5"/></svg>',
    "clock": '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
}

def header(root, overlay):
    cats = "".join(
        f'<a class="mega__item" href="{root}boutique.html?cat={c["id"]}"><span class="mega__icon" aria-hidden="true">{c["icon"]}</span><span>{E(c["label"])}</span></a>'
        for c in C.CATEGORIES)
    mob_cats = "".join(f'<a href="{root}boutique.html?cat={c["id"]}"><span aria-hidden="true">{c["icon"]}</span> {E(c["label"])}</a>' for c in C.CATEGORIES)
    return f'''
<a class="skip" href="#contenu">Aller au contenu</a>
<div class="topbar" id="topbar" role="region" aria-label="Annonces">
  <div class="topbar__track" id="topbarTrack"></div>
  <button class="topbar__close" id="topbarClose" aria-label="Masquer les annonces">{ICON["close"]}</button>
</div>
<header class="hdr{' hdr--overlay' if overlay else ''}" id="hdr">
  <div class="hdr__inner wrap">
    <button class="icon-btn hdr__burger" id="burger" aria-label="Ouvrir le menu" aria-controls="drawer" aria-expanded="false">{ICON["menu"]}</button>
    <a class="brand" href="{root}index.html" aria-label="CAP DE LA PDI – accueil">
      <img src="{root}assets/img/logo-cap-pdi.png" alt="" width="44" height="44">
      <span class="brand__txt"><strong>CAP DE LA PDI</strong><small>Coopérative Agro-Pastorale</small></span>
    </a>
    <nav class="nav" aria-label="Navigation principale">
      <a href="{root}index.html" data-nav="accueil">Accueil</a>
      <div class="nav__dd">
        <a href="{root}boutique.html" data-nav="boutique" aria-haspopup="true">Boutique</a>
        <div class="mega" role="menu"><div class="mega__grid">{cats}</div>
          <a class="mega__all" href="{root}boutique.html">Voir toute la boutique {ICON["arrow"]}</a></div>
      </div>
      <a href="{root}boutique.html?filtre=nouveautes" data-nav="nouveautes">Nouveautés</a>
      <a href="{root}a-propos.html" data-nav="apropos">À propos</a>
      <a href="{root}contact.html" data-nav="contact">Contact</a>
    </nav>
    <div class="hdr__actions">
      <button class="icon-btn" id="searchOpen" aria-label="Rechercher un produit">{ICON["search"]}</button>
      <a class="icon-btn hide-sm" href="https://wa.me/{C.SITE["whatsapp"]}" target="_blank" rel="noopener" aria-label="Nous écrire sur WhatsApp">{ICON["wa"]}</a>
      <button class="icon-btn cart-btn" id="cartOpen" aria-label="Ouvrir le panier" aria-controls="cart">{ICON["bag"]}<span class="cart-btn__n" id="cartCount" hidden>0</span></button>
    </div>
  </div>
</header>

<div class="drawer" id="drawer" aria-hidden="true">
  <div class="drawer__panel" role="dialog" aria-label="Menu">
    <div class="drawer__head"><span class="brand__txt"><strong>CAP DE LA PDI</strong></span><button class="icon-btn" data-close-drawer aria-label="Fermer le menu">{ICON["close"]}</button></div>
    <nav class="drawer__nav" aria-label="Menu mobile">
      <a href="{root}index.html">Accueil</a><a href="{root}boutique.html">Toute la boutique</a><a href="{root}boutique.html?filtre=nouveautes">Nouveautés</a>
      <p class="drawer__label">Rayons</p>{mob_cats}
      <p class="drawer__label">Informations</p>
      <a href="{root}a-propos.html">À propos</a><a href="{root}contact.html">Contact</a><a href="{root}livraison-retours.html">Livraison & retours</a><a href="{root}faq.html">Questions fréquentes</a>
    </nav>
    <a class="btn btn--wa drawer__wa" href="https://wa.me/{C.SITE["whatsapp"]}" target="_blank" rel="noopener">{ICON["wa"]} WhatsApp {C.SITE["whatsapp_display"]}</a>
  </div>
</div>

<div class="search" id="search" aria-hidden="true">
  <div class="search__panel wrap" role="dialog" aria-label="Recherche">
    <form class="search__form" action="{root}boutique.html" role="search">
      {ICON["search"]}<input type="search" name="q" id="searchInput" placeholder="Rechercher : ivermectine, Charolaise, cage…" autocomplete="off" aria-label="Rechercher un produit">
      <button type="button" class="icon-btn" data-close-search aria-label="Fermer la recherche">{ICON["close"]}</button>
    </form>
    <div class="search__results" id="searchResults" aria-live="polite"></div>
  </div>
</div>
'''

def footer(root):
    cats = "".join(f'<li><a href="{root}boutique.html?cat={c["id"]}">{E(c["label"])}</a></li>' for c in C.CATEGORIES[:8])
    depots = "".join(f'<li><strong>{E(d["name"])}</strong><br>{E(d["addr"])}' + (f'<br><a href="tel:{d["tel"][0]}">{d["tel"][1]}</a>' if d["tel"] else "") + "</li>" for d in C.DEPOTS)
    hours = "".join(f"<li><span>{a}</span><span>{b}</span></li>" for a, b in C.HOURS) + f"<li><span>Dépôts d'aliment</span><span>{C.DEPOT_HOURS}</span></li>"
    pays = "".join(f'<span class="paybadge">{E(p["label"])}</span>' for p in C.PAYMENTS)
    phones = "".join(f'<a href="tel:{t}">{ICON["phone"]} {d}</a>' for t, d in C.SITE["phones"])
    return f'''
<section class="newsletter reveal" aria-labelledby="nl-title">
  <div class="wrap newsletter__inner">
    <div>
      <p class="eyebrow eyebrow--light">Restez informé</p>
      <h2 id="nl-title">Nouveautés, arrivages et promotions</h2>
      <p>Rejoignez le groupe d'entraide des éleveurs sur WhatsApp, ou inscrivez votre e-mail : nous vous écrirons à chaque arrivage.</p>
    </div>
    <div class="newsletter__actions">
      <a class="btn btn--wa btn--lg" href="{C.SITE["group"]}" target="_blank" rel="noopener">{ICON["wa"]} Rejoindre le groupe WhatsApp</a>
      <form class="nl-form" id="nlForm" novalidate>
        <label class="sr-only" for="nlEmail">Votre adresse e-mail</label>
        <input id="nlEmail" type="email" name="email" placeholder="Votre e-mail" autocomplete="email" required>
        <button class="btn btn--sun" type="submit">S'inscrire</button>
      </form>
      <p class="nl-note">L'inscription par e-mail ouvre votre messagerie avec une demande prête à envoyer. Aucune donnée n'est enregistrée par ce site.</p>
    </div>
  </div>
</section>
<footer class="ftr">
  <div class="wrap ftr__grid">
    <div class="ftr__brand">
      <a class="brand brand--light" href="{root}index.html"><img src="{root}assets/img/logo-cap-pdi.png" alt="" width="52" height="52" loading="lazy"><span class="brand__txt"><strong>CAP DE LA PDI</strong><small>{E(C.SITE["legal_name"])}</small></span></a>
      <p>Génétique, santé animale, alimentation et matériel d'élevage à Pointe-Noire. Représentant officiel de GENES DIFFUSION pour les deux Congos.</p>
      <p class="ftr__motto">« Le travail continue ! »</p>
      <div class="ftr__contact">{phones}<a href="https://wa.me/{C.SITE["whatsapp"]}" target="_blank" rel="noopener">{ICON["wa"]} {C.SITE["whatsapp_display"]}</a><a href="mailto:{C.SITE["email"]}">{ICON["mail"]} {C.SITE["email"]}</a></div>
    </div>
    <div><h3>Boutique</h3><ul>{cats}</ul></div>
    <div><h3>Informations</h3><ul>
      <li><a href="{root}a-propos.html">À propos</a></li><li><a href="{root}contact.html">Contact</a></li>
      <li><a href="{root}livraison-retours.html">Livraison & retours</a></li><li><a href="{root}faq.html">Questions fréquentes</a></li>
      <li><a href="{root}cgv.html">Conditions générales de vente</a></li><li><a href="{root}confidentialite.html">Confidentialité</a></li>
      <li><a href="{root}mentions-legales.html">Mentions légales</a></li></ul></div>
    <div><h3>Nos dépôts</h3><ul class="ftr__depots">{depots}</ul></div>
    <div><h3>Horaires du bureau</h3><ul class="ftr__hours">{hours}</ul><p class="open-status" data-open-status></p></div>
  </div>
  <div class="wrap ftr__pay"><span>Paiements acceptés</span>{pays}</div>
  <div class="wrap ftr__legal">
    <p>© <span data-year>{date.today().year}</span> {E(C.SITE["legal_name"])} (CAP DE LA PDI) · Agrément n° {C.SITE["agrement"]} · NIU {C.SITE["niu"]}</p>
    <p>Pointe-Noire, République du Congo</p>
  </div>
</footer>

<a class="wa-float" href="https://wa.me/{C.SITE["whatsapp"]}?text={E("Bonjour CAP DE LA PDI, j'ai une question.")}" target="_blank" rel="noopener" aria-label="Nous écrire sur WhatsApp">{ICON["wa"]}</a>

<div class="cart" id="cart" aria-hidden="true">
  <div class="cart__panel" role="dialog" aria-label="Panier">
    <div class="cart__head"><h2>Mon panier</h2><button class="icon-btn" data-close-cart aria-label="Fermer le panier">{ICON["close"]}</button></div>
    <div class="cart__body" id="cartBody"></div>
    <div class="cart__foot" id="cartFoot"></div>
  </div>
</div>
<div class="toast" id="toast" role="status" aria-live="polite"></div>
'''

BASE = '''<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title}</title>
<meta name="description" content="{desc}">
<link rel="canonical" href="{canonical}">
<meta name="theme-color" content="#0e3b29">
<meta property="og:type" content="{og_type}">
<meta property="og:site_name" content="CAP DE LA PDI">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{desc}">
<meta property="og:url" content="{canonical}">
<meta property="og:image" content="{og_image}">
<meta property="og:locale" content="fr_FR">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" type="image/png" href="{root}assets/img/favicon.png">
<link rel="apple-touch-icon" href="{root}assets/img/favicon.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="{root}assets/css/main.css?v={v}">
{preload}{jsonld}{headextra}
</head>
<body class="page-{page}" data-root="{root}">
{header}
<main id="contenu">
{body}
</main>
{footer}
<script src="{root}assets/js/catalog.js?v={v}"></script>
<script src="{root}assets/js/app.js?v={v}"></script>
{scripts}
</body>
</html>
'''

def render(page, body, root="", title="", desc="", canonical="", og_image=None, jsonld="", scripts="", overlay=False, og_type="website", preload="", headextra=""):
    body = expand(body, root)
    out = BASE.format(
        title=E(title), desc=E(desc), canonical=canonical or C.SITE["url"], og_image=og_image or C.SITE["url"] + "assets/img/og-cap-de-la-pdi.jpg",
        root=root, v=VERSION, jsonld=jsonld, page=page, header=header(root, overlay), body=body, footer=footer(root),
        scripts="\n".join(f'<script src="{root}assets/js/{s}.js?v={VERSION}"></script>' for s in scripts.split() if s),
        og_type=og_type, preload=preload, headextra=headextra)
    return out

def expand(body, root):
    """Remplace {{root}}, {{img:nom|sizes|classe|alt|eager}} et {{site:clé}} dans les pages."""
    def im(m):
        parts = m.group(1).split("|")
        name = parts[0]; sizes = parts[1] if len(parts) > 1 and parts[1] else "100vw"
        cls = parts[2] if len(parts) > 2 else ""; alt = parts[3] if len(parts) > 3 else ""
        eager = len(parts) > 4 and parts[4] == "eager"
        return img_tag(name, root, sizes, cls, alt, eager)
    body = re.sub(r"\{\{img:([^}]+)\}\}", im, body)
    if "{{cats}}" in body:
        tiles = []
        for i, c in enumerate(C.CATEGORIES):
            n = sum(1 for p in C.PRODUCTS if p["cat"] == c["id"])
            media = img_tag(c["img"], root, "(min-width:900px) 50vw, 100vw" if i < 2 else "(min-width:900px) 33vw, 50vw", "", "") if c.get("img") else \
                f'<div class="ph"><span class="ph__icon" aria-hidden="true">{c["icon"]}</span><span class="ph__tag">Visuel temporaire</span></div>'
            tiles.append(f'<a class="cat{" cat--lg" if i < 2 else ""}" href="{root}boutique.html?cat={c["id"]}">{media}'
                         f'<div class="cat__body"><div><h3>{E(c["label"])}</h3><small>{n} produit{"s" if n > 1 else ""}</small></div><span class="cat__go">{ICON["arrow"]}</span></div></a>')
        body = body.replace("{{cats}}", "".join(tiles))
    body = body.replace("{{ids:featured}}", json.dumps([p["id"] for p in C.PRODUCTS if p.get("featured")]))
    body = body.replace("{{ids:new}}", json.dumps([p["id"] for p in C.PRODUCTS if p.get("new")]))
    body = body.replace("{{count:products}}", str(len(C.PRODUCTS)))
    body = body.replace("{{root}}", root)
    for k, v in C.SITE.items():
        if isinstance(v, str):
            body = body.replace("{{site:%s}}" % k, v)
    body = body.replace("{{icon:arrow}}", ICON["arrow"]).replace("{{icon:wa}}", ICON["wa"])
    body = body.replace("{{icon:phone}}", ICON["phone"]).replace("{{icon:mail}}", ICON["mail"]).replace("{{icon:pin}}", ICON["pin"]).replace("{{icon:clock}}", ICON["clock"])
    return body

INTRO_HEAD = """<script>try{if(!matchMedia('(prefers-reduced-motion: reduce)').matches&&!sessionStorage.getItem('pdi-intro')&&!/[?&]nointro/.test(location.search))document.documentElement.classList.add('intro-on')}catch(e){}</script>"""

def jsonld(obj):
    return '<script type="application/ld+json">' + json.dumps(obj, ensure_ascii=False) + "</script>"

ORG = {
    "@context": "https://schema.org", "@type": "Store", "name": "CAP DE LA PDI",
    "legalName": C.SITE["legal_name"], "url": C.SITE["url"], "logo": C.SITE["url"] + "assets/img/logo-cap-pdi.png",
    "image": C.SITE["url"] + "assets/img/og-cap-de-la-pdi.jpg", "email": C.SITE["email"], "telephone": C.SITE["phones"][0][1],
    "address": {"@type": "PostalAddress", "streetAddress": "Quartier La Base, Avenue Félix TCHIKAYA", "addressLocality": "Pointe-Noire", "addressCountry": "CG"},
    "openingHoursSpecification": [
        {"@type": "OpeningHoursSpecification", "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], "opens": "08:00", "closes": "12:00"},
        {"@type": "OpeningHoursSpecification", "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], "opens": "13:30", "closes": "17:00"},
        {"@type": "OpeningHoursSpecification", "dayOfWeek": "Saturday", "opens": "08:00", "closes": "12:00"}],
    "currenciesAccepted": "XAF", "paymentAccepted": "Airtel Money, virement bancaire, espèces",
}

# ------------------------------------------------------------------ pages
def read_page(fn):
    with open(os.path.join(PAGES, fn), encoding="utf-8") as f:
        txt = f.read()
    m = re.match(r"<!--(.*?)-->\s*", txt, re.S)
    meta = json.loads(m.group(1))
    return meta, txt[m.end():]

def write(path, content):
    full = os.path.join(ROOT, path)
    os.makedirs(os.path.dirname(full) or ROOT, exist_ok=True)
    with open(full, "w", encoding="utf-8") as f:
        f.write(content)

def build_pages():
    urls = []
    for fn in sorted(os.listdir(PAGES)):
        if not fn.endswith(".html"):
            continue
        meta, body = read_page(fn)
        out = meta.get("out", fn)
        canonical = C.SITE["url"] + ("" if out == "index.html" else out)
        ld = ""
        if meta.get("org"):
            ld = jsonld(ORG)
        if meta.get("faq"):
            qs = re.findall(r'<details class="faq__item"[^>]*>\s*<summary>(.*?)</summary>\s*<div class="faq__a">(.*?)</div>', body, re.S)
            ld += jsonld({"@context": "https://schema.org", "@type": "FAQPage", "mainEntity": [
                {"@type": "Question", "name": re.sub("<[^>]+>", "", q).strip(), "acceptedAnswer": {"@type": "Answer", "text": re.sub("<[^>]+>", "", a).strip()}} for q, a in qs]})
        preload = ""
        if meta.get("preload"):
            d = img_data(meta["preload"])
            preload = f'<link rel="preload" as="image" href="{d["src"]}" imagesrcset="{d["srcset"]}" imagesizes="100vw" fetchpriority="high">\n'
        write(out, render(meta["page"], body, meta.get("root", ""), meta["title"], meta["desc"], canonical, jsonld=ld,
                          scripts=meta.get("scripts", ""), overlay=meta.get("overlay", False), preload=preload, headextra=INTRO_HEAD if meta.get("intro") else ""))
        if not meta.get("noindex"):
            urls.append(canonical)
    return urls

# ------------------------------------------------------------------ fiches produits
def product_page(p):
    root = "../"
    c = CAT[p["cat"]]
    imgs = p.get("imgs", [])
    fit = p.get("fit", "contain")
    if imgs:
        main = "".join(
            f'<figure class="gal__slide{" is-active" if i == 0 else ""}" data-i="{i}">' +
            img_tag(n, root, "(min-width: 900px) 50vw, 100vw", f"gal__img fit-{fit}", p["name"] + (" – photo %d" % (i + 1) if i else ""), eager=(i == 0)) +
            "</figure>" for i, n in enumerate(imgs))
        thumbs = "" if len(imgs) < 2 else '<div class="gal__thumbs">' + "".join(
            f'<button class="gal__thumb{" is-active" if i == 0 else ""}" data-go="{i}" aria-label="Photo {i + 1}">' + img_tag(n, root, "96px", f"fit-{fit}", "") + "</button>" for i, n in enumerate(imgs)) + "</div>"
        cap = '<span class="gal__cap">Photo d\'illustration de la race</span>' if imgs[0].startswith(("axiom-", "race-")) else ""
        gallery = f'<div class="gal" data-gallery><div class="gal__main">{main}{cap}<button class="gal__zoom" data-zoom aria-label="Agrandir la photo">⤢</button></div>{thumbs}</div>'
    else:
        gallery = f'<div class="gal"><div class="gal__main gal__main--ph"><div class="ph"><span class="ph__icon" aria-hidden="true">{p.get("icon", "📦")}</span><span class="ph__tag">Visuel temporaire</span></div></div></div>'

    price = p.get("price")
    if price is None:
        price_html = '<p class="pp__price pp__price--quote">Prix sur devis</p>'
    else:
        pre = f'<small>{E(p.get("prefix", "À partir de"))}</small>' if p.get("quote") else ""
        old = f' <s>{fmt(p["oldPrice"])}</s>' if p.get("oldPrice") else ""
        price_html = f'<p class="pp__price" data-price>{pre}<span data-amount>{fmt(price)}</span> <b class="ttc">TTC</b>{old} <em>/ <span data-unit>{E(p["unit"])}</span></em></p>'

    opts = ""
    if p.get("options"):
        o = "".join(f'<button type="button" class="opt{" is-active" if i == 0 else ""}" data-opt="{E(opt_label(x))}" aria-pressed="{"true" if i == 0 else "false"}">{E(opt_label(x))}</button>' for i, x in enumerate(p["options"]))
        opts = f'<div class="pp__opts"><p class="pp__label">Variante : <strong data-opt-label>{E(opt_label(p["options"][0]))}</strong></p><div class="opts" role="group" aria-label="Choisir une variante">{o}</div></div>'

    if p.get("link"):
        buy = f'''<div class="pp__buy"><a class="btn btn--primary btn--lg btn--block" href="{p["link"]}" target="_blank" rel="noopener">Acheter maintenant – paiement sécurisé</a></div>
        <p class="pp__note">Paiement en ligne sécurisé sur Chariow. Téléchargement immédiat après paiement.</p>'''
    else:
        quote = is_quote(p)
        buy = f'''<div class="pp__buy">
          <div class="qty" data-qty><button type="button" data-step="-1" aria-label="Diminuer la quantité">−</button><input type="number" min="1" value="1" inputmode="numeric" aria-label="Quantité"><button type="button" data-step="1" aria-label="Augmenter la quantité">+</button></div>
          <button type="button" class="btn btn--primary btn--lg" data-add>{"Ajouter à ma demande de devis" if quote else "Ajouter au panier"}</button>
        </div>
        <button type="button" class="btn btn--dark btn--lg btn--block" data-buynow>{"Demander un devis maintenant" if quote else "Commander maintenant"}</button>'''

    details = "".join(f"<li>{E(d)}</li>" for d in p.get("details", []))
    rx = '<p class="pp__rx">⚕️ Produit vétérinaire : délivré sur conseil de nos techniciens ou de votre vétérinaire.</p>' if p.get("rx") else ""
    badge = f'<span class="badge badge--hot">{E(p["badge"])}</span>' if p.get("badge") else ""
    if p.get("origin") == "fr":
        badge += '<span class="badge badge--fr">🇫🇷 Qualité France</span>'
    elif p.get("origin") == "fr-dist":
        badge += '<span class="badge badge--fr">🇫🇷 Fournisseur français</span>'
    origin_li = ""
    if p.get("origin") == "fr":
        origin_li = f'<li><span class="flag-fr" aria-hidden="true">🇫🇷</span><span><strong>Qualité France</strong>Produit sélectionné auprès de nos partenaires français et importé de France par CAP DE LA PDI.</span></li>'
    elif p.get("origin") == "fr-dist":
        origin_li = f'<li><span class="flag-fr" aria-hidden="true">🇫🇷</span><span><strong>Fournisseur français</strong>Semence distribuée par GENES DIFFUSION (France) et expédiée depuis la France.</span></li>'

    flag = "Paiement en ligne" if p.get("link") else ("Sur commande / devis" if is_quote(p) else "Prix affiché")
    delivery = ("Fichier envoyé immédiatement par Chariow après paiement." if p.get("link") else
                "Retrait gratuit au bureau (La Base) ou dans nos 3 dépôts (La Datcha, Côte Matève, arrêt Supermarché). Livraison à Pointe-Noire, au Congo et partout dans le monde : frais communiqués avant validation. Expédition express possible pour les petites commandes ; grosses commandes : 1,5 à 2 mois.")
    if p["cat"] == "reproducteurs":
        delivery = "Animaux livrés par avion : enlèvement à l'aéroport du Congo aux frais de l'acheteur. Fret et dédouanement inclus dans le prix."

    related = [q for q in C.PRODUCTS if q["cat"] == p["cat"] and q["id"] != p["id"]][:10]
    if len(related) < 4:
        related += [q for q in C.PRODUCTS if q.get("featured") and q["id"] != p["id"] and q not in related][:8 - len(related)]
    rel_ids = json.dumps([q["id"] for q in related])

    body = f'''
<nav class="crumbs wrap" aria-label="Fil d'Ariane"><a href="{{{{root}}}}index.html">Accueil</a><span>/</span><a href="{{{{root}}}}boutique.html">Boutique</a><span>/</span><a href="{{{{root}}}}boutique.html?cat={c["id"]}">{E(c["label"])}</a><span>/</span><span aria-current="page">{E(p["name"])}</span></nav>
<section class="pp wrap" data-product="{p["id"]}">
  <div class="pp__media">{gallery}</div>
  <div class="pp__info">
    <p class="pp__cat">{c["icon"]} {E(p.get("sub") or c["label"])} {badge}</p>
    <h1 class="pp__title">{E(p["name"])}</h1>
    <p class="pp__lead">{E(p["desc"])}</p>
    {price_html}
    <p class="pp__flag"><span class="dot"></span>{E(default_stock(p))}{"" if is_quote(p) and not p.get("link") else f" · <em>{flag}</em>"}</p>
    {opts}
    {buy}
    {rx}
    <ul class="pp__assure">
      {origin_li}
      <li>{ICON["pin"]}<span><strong>Retrait ou livraison</strong>{E(delivery)}</span></li>
      <li>{ICON["phone"]}<span><strong>Conseil d'un technicien</strong>Une question avant d'acheter ? Écrivez-nous sur WhatsApp au {C.SITE["whatsapp_display"]}.</span></li>
    </ul>
    <div class="acc">
      <details open><summary>Description</summary><div><ul class="ticks">{details}</ul></div></details>
      <details><summary>Livraison & retrait</summary><div><p>{E(delivery)}</p><p><a href="{{{{root}}}}livraison-retours.html">Toutes les conditions de livraison et de retour</a></p></div></details>
      <details><summary>Paiement</summary><div><p>{"Paiement en ligne sécurisé sur Chariow." if p.get("link") else "Après confirmation de votre commande par notre équipe : Airtel Money, virement bancaire (UBA) ou espèces au bureau."}</p></div></details>
      <details><summary>Avis clients</summary><div><p>Aucun avis publié pour le moment.</p><p><a href="https://wa.me/{C.SITE["whatsapp"]}?text={E("Bonjour, je souhaite donner mon avis sur : " + p["name"])}" target="_blank" rel="noopener">Vous avez acheté ce produit ? Donnez-nous votre avis</a></p></div></details>
    </div>
  </div>
</section>
<section class="section section--tint">
  <div class="wrap">
    <div class="sec-head"><div><p class="eyebrow">À découvrir aussi</p><h2>Produits similaires</h2></div>
      <div class="rail-nav"><button class="icon-btn" data-rail-prev aria-label="Précédent">‹</button><button class="icon-btn" data-rail-next aria-label="Suivant">›</button></div></div>
    <div class="rail" data-rail data-ids='{rel_ids}'></div>
  </div>
</section>
<div class="lightbox" id="lightbox" aria-hidden="true"><button class="icon-btn lightbox__close" data-close-lb aria-label="Fermer">{ICON["close"]}</button><button class="lightbox__nav lightbox__prev" data-lb-prev aria-label="Photo précédente">‹</button><img alt=""><button class="lightbox__nav lightbox__next" data-lb-next aria-label="Photo suivante">›</button></div>
<div class="sticky-buy" id="stickyBuy"><div><strong>{E(p["name"])}</strong><span data-sticky-price>{"Prix sur devis" if price is None else fmt(price)}</span></div><button class="btn btn--primary" data-sticky-add>{"Acheter" if p.get("link") else ("Devis" if is_quote(p) else "Ajouter")}</button></div>
'''
    url = C.SITE["url"] + f"produits/{p['id']}.html"
    ld = {"@context": "https://schema.org", "@type": "Product", "name": p["name"], "description": " ".join([p["desc"]] + p.get("details", [])),
          "sku": p["id"], "category": c["label"], "brand": {"@type": "Brand", "name": "CAP DE LA PDI"}, "url": url}
    if imgs:
        ld["image"] = [C.SITE["url"] + img_data(n)["src"] for n in imgs]
    if price is not None and not p.get("quote"):
        ld["offers"] = {"@type": "Offer", "priceCurrency": "XAF", "price": price, "availability": "https://schema.org/InStock" if p.get("link") else "https://schema.org/PreOrder" if p["id"] == "vaccin-3en1" else "https://schema.org/InStoreOnly", "url": url,
                        "seller": {"@type": "Organization", "name": "CAP DE LA PDI"}}
    crumbs = {"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [
        {"@type": "ListItem", "position": 1, "name": "Accueil", "item": C.SITE["url"]},
        {"@type": "ListItem", "position": 2, "name": "Boutique", "item": C.SITE["url"] + "boutique.html"},
        {"@type": "ListItem", "position": 3, "name": c["label"], "item": C.SITE["url"] + "boutique.html?cat=" + c["id"]},
        {"@type": "ListItem", "position": 4, "name": p["name"], "item": url}]}
    title = f'{p["name"]} – {c["label"]} | CAP DE LA PDI Pointe-Noire'
    desc_price = ("Prix sur devis" if price is None else ("à partir de " if p.get("quote") else "") + fmt(price) + " / " + p["unit"])
    desc = f'{p["name"]} : {p["desc"]} {desc_price}. Commande en ligne, retrait à Pointe-Noire ou livraison au Congo.'
    og = C.SITE["url"] + img_data(imgs[0])["src"] if imgs else None
    preload = ""
    if imgs:
        d = img_data(imgs[0])
        preload = f'<link rel="preload" as="image" href="{root}{d["src"]}" imagesrcset="{", ".join(root + s for s in d["srcset"].split(", "))}" imagesizes="(min-width: 900px) 50vw, 100vw" fetchpriority="high">\n'
    return render("produit", body, root, title, desc[:300], url, og, jsonld(ld) + jsonld(crumbs), "product", og_type="product", preload=preload)

def build_products():
    os.makedirs(os.path.join(ROOT, "produits"), exist_ok=True)
    keep = set()
    for p in C.PRODUCTS:
        write(f"produits/{p['id']}.html", product_page(p))
        keep.add(p["id"] + ".html")
    for f in os.listdir(os.path.join(ROOT, "produits")):  # supprime les fiches de produits retirés
        if f.endswith(".html") and f not in keep:
            os.remove(os.path.join(ROOT, "produits", f))
    return [C.SITE["url"] + f"produits/{p['id']}.html" for p in C.PRODUCTS]

def write_sitemap(urls):
    today = date.today().isoformat()
    items = "".join(f"<url><loc>{u}</loc><lastmod>{today}</lastmod></url>" for u in urls)
    write("sitemap.xml", f'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">{items}</urlset>\n')
    write("robots.txt", f"User-agent: *\nAllow: /\nSitemap: {C.SITE['url']}sitemap.xml\n")

if __name__ == "__main__":
    ids = [p["id"] for p in C.PRODUCTS]
    assert len(ids) == len(set(ids)), "identifiants de produits en double"
    build_images()
    for p in C.PRODUCTS:
        for n in p.get("imgs", []):
            assert n in MANIFEST, f"image manquante : {n} ({p['id']})"
    write_catalog_js()
    urls = build_pages()
    urls += build_products()
    write_sitemap(urls)
    print(f"OK : {len(C.PRODUCTS)} produits, {len(urls)} pages, {sum(len(v) for v in MANIFEST.values())} images WebP")
