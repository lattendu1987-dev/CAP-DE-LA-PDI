"""Notation et classement des produits candidats.

Chaque critère est noté de 0 à 10 (plus haut = meilleur). La marge et l'efficacité
d'acquisition sont calculées à partir des coûts ; les autres notes viennent de la
veille (config/products.toml). Un produit est éliminé d'office si sa marge après
acquisition est sous le minimum fixé, quelle que soit sa note.
"""

from __future__ import annotations

from dataclasses import dataclass, field

from .economics import OrderEconomics, order_economics, suggested_price


def _clip(x: float, lo: float = 0.0, hi: float = 10.0) -> float:
    return max(lo, min(hi, x))


@dataclass
class ProductScore:
    id: str
    name: str
    strategy: str
    score: float
    economics: OrderEconomics
    suggested_price: float
    criteria: dict[str, float]
    eligible: bool
    reasons: list[str] = field(default_factory=list)


def margin_score(contribution_pct: float) -> float:
    """0 % de marge après pub -> 0 ; 40 % ou plus -> 10."""
    return _clip(contribution_pct / 0.40 * 10)


def cac_score(cac: float, price: float) -> float:
    """CAC nul -> 10 ; CAC >= 50 % du prix -> 0."""
    return _clip(10 * (1 - (cac / price) / 0.5)) if price else 0.0


def score_product(p: dict, settings: dict) -> ProductScore:
    pay = settings["payments"]
    pricing = settings["pricing"]
    weights = settings["scoring"]["weights"]

    econ = order_economics(
        p["price"], p["unit_cost"], p["shipping_cost"],
        fee_rate=pay["rate"], fee_fixed=pay["fixed"],
        ad_cost=p["est_cac"], refund_rate=p["refund_rate"],
    )
    criteria = dict(p["scores"])
    criteria["margin"] = round(margin_score(econ.contribution_pct), 2)
    criteria["cac_efficiency"] = round(cac_score(p["est_cac"], p["price"]), 2)

    missing = set(weights) - set(criteria)
    if missing:
        raise KeyError(f"{p['id']}: critères manquants {sorted(missing)}")

    total = sum(weights[k] * criteria[k] for k in weights)

    reasons = []
    eligible = True
    if econ.contribution_pct < pricing["min_contribution_after_cac"]:
        eligible = False
        reasons.append(
            f"marge après pub {econ.contribution_pct:.0%} < minimum {pricing['min_contribution_after_cac']:.0%}"
        )
    if criteria.get("evidence", 0) < 4:
        eligible = False
        reasons.append("preuves de demande insuffisantes")

    sp = suggested_price(
        p["unit_cost"], p["shipping_cost"],
        fee_rate=pay["rate"], fee_fixed=pay["fixed"], ad_cost=p["est_cac"],
        refund_rate=p["refund_rate"], target_margin=pricing["target_contribution_after_cac"],
    )
    return ProductScore(
        id=p["id"], name=p["name"], strategy=p.get("strategy", ""),
        score=round(total, 2), economics=econ, suggested_price=sp,
        criteria=criteria, eligible=eligible, reasons=reasons,
    )


def rank(products: list[dict], settings: dict) -> list[ProductScore]:
    scored = [score_product(p, settings) for p in products]
    return sorted(scored, key=lambda s: (s.eligible, s.score), reverse=True)
