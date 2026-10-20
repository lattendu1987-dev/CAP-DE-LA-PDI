"""Point d'entrée : `python -m pdi [classement|simulation|rapport]`.

`rapport` produit un fichier Markdown chiffré (docs/rapport-chiffres.md) régénéré
à chaque changement de configuration.
"""

from __future__ import annotations

import sys

from . import config
from .economics import order_economics
from .scoring import rank
from .simulation import default_scenarios, run


def _money(x: float) -> str:
    return f"{x:,.2f} $".replace(",", " ")


def ranking_md(settings: dict, catalog: dict) -> str:
    lines = [
        "| Rang | Produit | Note /10 | Prix | Coût livré | Frais paiement | CAC estimé | Provision remb. | Marge après pub | CPA d'équilibre | Prix suggéré (25 %) | Statut |",
        "|---|---|---|---|---|---|---|---|---|---|---|---|",
    ]
    for i, s in enumerate(rank(catalog["product"], settings), 1):
        e = s.economics
        status = "Retenu" if s.eligible else "Écarté : " + "; ".join(s.reasons)
        lines.append(
            f"| {i} | {s.name} | {s.score:.1f} | {_money(e.price)} | "
            f"{_money(e.product_cost + e.shipping_cost)} | {_money(e.payment_fees)} | {_money(e.ad_cost)} | "
            f"{_money(e.refund_provision)} | {_money(e.contribution)} ({e.contribution_pct:.0%}) | "
            f"{_money(e.breakeven_cpa)} | {_money(s.suggested_price)} | {status} |"
        )
    return "\n".join(lines)


def simulation_md(settings: dict) -> str:
    pay = settings["payments"]
    fixed = sum(settings["fixed_costs_monthly"].values())
    rows = [
        "| Scénario | Pub/mois | Visites | Taux conv. | Commandes | Panier | Chiffre d'affaires | Coût produits+livr. | Frais paiement | Remboursements | Marge contributive | Charges fixes | Résultat avant impôt | Pub par commande |",
        "|---|---|---|---|---|---|---|---|---|---|---|---|---|---|",
    ]
    for sc in default_scenarios(fixed):
        r = run(sc, pay["rate"], pay["fixed"])
        rows.append(
            f"| {sc.name} | {_money(sc.ad_spend)} | {r.sessions} | {sc.conversion_rate:.1%} | {r.orders:.0f} | "
            f"{_money(sc.aov)} | {_money(r.revenue)} | {_money(r.cogs)} | {_money(r.fees)} | "
            f"{_money(r.refunds)} | {_money(r.contribution)} | {_money(sc.fixed_costs)} | "
            f"**{_money(r.net_before_tax)}** | {_money(r.cac)} |"
        )
    return "\n".join(rows)


def report() -> str:
    settings, catalog = config.settings(), config.products()
    rejected = "\n".join(f"- **{r['name']}** : {r['reason']}" for r in catalog.get("rejected", []))
    evidence = []
    for p in catalog["product"]:
        evidence.append(f"\n**{p['name']}**")
        for ev in p["evidence"]:
            evidence.append(f"- [{ev['kind']}] {ev['signal']} — [source]({ev['url']})")
        evidence.append(f"- Fournisseurs à comparer : {', '.join(p['suppliers'])}")
        evidence.append(f"- Réglementation : {p['regulatory']}")
    return f"""# Rapport chiffré (généré)

> Généré par `python -m pdi rapport` à partir de `config/`. Ne pas modifier à la main.
> Montants en CAD hors taxes. Coûts = estimations tirées de prix de gros publics, à confirmer par devis et échantillon.

## Classement des produits

{ranking_md(settings, catalog)}

## Preuves de demande et fournisseurs

{chr(10).join(evidence)}

## Produits écartés

{rejected}

## Simulation mensuelle (régime établi)

{simulation_md(settings)}
"""


def main(argv: list[str]) -> int:
    cmd = argv[1] if len(argv) > 1 else "rapport"
    settings, catalog = config.settings(), config.products()
    if cmd == "classement":
        print(ranking_md(settings, catalog))
    elif cmd == "simulation":
        print(simulation_md(settings))
    elif cmd == "rapport":
        out = config.ROOT / "docs" / "rapport-chiffres.md"
        out.write_text(report(), encoding="utf-8")
        print(f"Écrit : {out}")
    else:
        print(__doc__)
        return 2
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
