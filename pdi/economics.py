"""Économie unitaire : marge contributive réelle par commande et prix suggéré.

Toutes les valeurs sont hors taxes. Les taxes (TPS/TVQ) encaissées ne sont jamais
comptées comme revenu : elles sont reversées.
"""

from __future__ import annotations

import math
from dataclasses import dataclass


@dataclass(frozen=True)
class OrderEconomics:
    price: float            # prix encaissé (hors taxes)
    product_cost: float
    shipping_cost: float
    payment_fees: float
    ad_cost: float          # dépense pub attribuable à la commande (CAC)
    refund_provision: float  # perte attendue liée aux remboursements
    contribution: float     # marge contributive réelle

    @property
    def contribution_pct(self) -> float:
        return self.contribution / self.price if self.price else 0.0

    @property
    def contribution_before_ads(self) -> float:
        return self.contribution + self.ad_cost

    @property
    def breakeven_cpa(self) -> float:
        """Dépense pub maximale par commande avant de perdre de l'argent."""
        return max(self.contribution_before_ads, 0.0)


def order_economics(
    price: float,
    product_cost: float,
    shipping_cost: float,
    *,
    fee_rate: float,
    fee_fixed: float,
    ad_cost: float = 0.0,
    refund_rate: float = 0.0,
) -> OrderEconomics:
    """Marge contributive d'une commande.

    Hypothèse prudente pour les remboursements : en livraison directe, la marchandise
    est rarement récupérée, donc un remboursement fait perdre tout le prix encaissé,
    alors que coût produit, livraison et frais de paiement restent dus.
    """
    fees = price * fee_rate + fee_fixed
    refund = price * refund_rate
    contribution = price - product_cost - shipping_cost - fees - ad_cost - refund
    return OrderEconomics(
        price=price,
        product_cost=product_cost,
        shipping_cost=shipping_cost,
        payment_fees=round(fees, 2),
        ad_cost=ad_cost,
        refund_provision=round(refund, 2),
        contribution=round(contribution, 2),
    )


def suggested_price(
    product_cost: float,
    shipping_cost: float,
    *,
    fee_rate: float,
    fee_fixed: float,
    ad_cost: float,
    refund_rate: float,
    target_margin: float,
) -> float:
    """Plus petit prix en ,99 $ qui atteint la marge contributive cible après CAC."""
    denom = 1.0 - fee_rate - refund_rate - target_margin
    if denom <= 0:
        raise ValueError("Marge cible impossible avec ces frais et ce taux de remboursement.")
    raw = (product_cost + shipping_cost + fee_fixed + ad_cost) / denom
    return math.ceil(raw + 0.01) - 0.01
