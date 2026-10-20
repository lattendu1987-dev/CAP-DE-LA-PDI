"""Règles automatiques de dépense publicitaire et de contrôle des commandes.

Le système applique ces règles sans intervention ; tout ce qui dépasse un plafond
est renvoyé à un humain (décision "ESCALADER").
"""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class CampaignStats:
    product_id: str
    spend: float
    purchases: int
    daily_budget: float


@dataclass(frozen=True)
class Decision:
    action: str   # CONTINUER | ARRETER | AUGMENTER | ESCALADER
    reason: str
    new_daily_budget: float | None = None


def evaluate_campaign(stats: CampaignStats, breakeven_cpa: float, rules: dict,
                      account_spend_month: float = 0.0) -> Decision:
    if breakeven_cpa <= 0:
        return Decision("ARRETER", "produit non rentable même sans publicité")

    if account_spend_month >= rules["monthly_account_cap"]:
        return Decision("ESCALADER", "plafond mensuel du compte atteint : accord humain requis")

    if stats.purchases == 0 and stats.spend >= rules["kill_no_sale_multiple"] * breakeven_cpa:
        return Decision("ARRETER", f"{stats.spend:.0f} $ dépensés sans vente "
                                   f"(seuil {rules['kill_no_sale_multiple']} x CPA d'équilibre)")

    if stats.spend >= rules["test_budget_per_product"] and stats.purchases < rules["scale_min_purchases"]:
        return Decision("ARRETER", "budget de test épuisé sans volume de ventes suffisant")

    cpa = stats.spend / stats.purchases if stats.purchases else float("inf")
    if stats.spend >= rules["judge_multiple"] * breakeven_cpa and cpa > breakeven_cpa:
        return Decision("ARRETER", f"CPA {cpa:.2f} $ > CPA d'équilibre {breakeven_cpa:.2f} $")

    if stats.purchases >= rules["scale_min_purchases"] and cpa <= rules["scale_cpa_ratio"] * breakeven_cpa:
        new_budget = round(stats.daily_budget * (1 + rules["scale_step"]), 2)
        if new_budget > rules["daily_account_cap"]:
            return Decision("ESCALADER", f"hausse rentable mais dépasserait le plafond quotidien "
                                         f"({rules['daily_account_cap']:.0f} $)")
        return Decision("AUGMENTER", f"CPA {cpa:.2f} $ bien sous l'équilibre", new_budget)

    return Decision("CONTINUER", "données encore insuffisantes pour conclure")


@dataclass(frozen=True)
class OrderCheck:
    total: float
    max_line_quantity: int
    billing_country: str
    shipping_country: str
    platform_risk: str = "low"   # niveau de risque fourni par Shopify : low | medium | high
    payment_captured: bool = True


def check_order(order: OrderCheck, rules: dict) -> tuple[bool, list[str]]:
    """Retourne (transmettre_au_fournisseur, raisons_de_blocage)."""
    reasons = []
    if not order.payment_captured:
        reasons.append("paiement non confirmé")
    if order.platform_risk == "high":
        reasons.append("risque de fraude élevé signalé par la plateforme")
    if order.total > rules["hold_if_order_total_above"]:
        reasons.append("montant inhabituel pour la boutique")
    if order.max_line_quantity > rules["max_quantity_per_line"]:
        reasons.append("quantité anormale (revente ou fraude possible)")
    if order.billing_country != order.shipping_country and order.platform_risk != "low":
        reasons.append("pays de facturation et de livraison différents avec risque non nul")
    return (not reasons, reasons)
