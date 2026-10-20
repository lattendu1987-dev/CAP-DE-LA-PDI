"""Simulation financière mensuelle (régime établi, après le mois de test)."""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class Scenario:
    name: str
    ad_spend: float          # budget pub mensuel
    cpc: float               # coût moyen par clic
    organic_sessions: int    # visites non payées (SEO, contenus, courriels)
    conversion_rate: float
    aov: float               # panier moyen hors taxes
    cogs_ratio: float        # (produit + livraison) / panier
    refund_rate: float
    fixed_costs: float


@dataclass(frozen=True)
class Result:
    scenario: Scenario
    sessions: int
    orders: float
    revenue: float
    cogs: float
    fees: float
    refunds: float
    contribution: float
    net_before_tax: float

    @property
    def cac(self) -> float:
        return self.scenario.ad_spend / self.orders if self.orders else float("inf")


def run(s: Scenario, fee_rate: float, fee_fixed: float) -> Result:
    paid_sessions = s.ad_spend / s.cpc if s.cpc else 0
    sessions = int(paid_sessions + s.organic_sessions)
    orders = sessions * s.conversion_rate
    revenue = orders * s.aov
    cogs = revenue * s.cogs_ratio
    fees = revenue * fee_rate + orders * fee_fixed
    refunds = revenue * s.refund_rate
    contribution = revenue - cogs - fees - refunds - s.ad_spend
    return Result(
        scenario=s, sessions=sessions, orders=round(orders, 1),
        revenue=round(revenue, 2), cogs=round(cogs, 2), fees=round(fees, 2),
        refunds=round(refunds, 2), contribution=round(contribution, 2),
        net_before_tax=round(contribution - s.fixed_costs, 2),
    )


def default_scenarios(fixed_costs: float) -> list[Scenario]:
    return [
        # Scénario recommandé pour démarrer : contenus courts + courriels, pub limitée.
        Scenario("Organique d'abord", ad_spend=500, cpc=1.10, organic_sessions=3000,
                 conversion_rate=0.015, aov=60, cogs_ratio=0.45, refund_rate=0.05,
                 fixed_costs=fixed_costs),
        Scenario("Prudent", ad_spend=1500, cpc=1.20, organic_sessions=300,
                 conversion_rate=0.012, aov=55, cogs_ratio=0.48, refund_rate=0.06,
                 fixed_costs=fixed_costs),
        Scenario("Intermédiaire", ad_spend=3000, cpc=1.00, organic_sessions=1500,
                 conversion_rate=0.018, aov=62, cogs_ratio=0.45, refund_rate=0.05,
                 fixed_costs=fixed_costs),
        Scenario("Ambitieux", ad_spend=8000, cpc=0.90, organic_sessions=6000,
                 conversion_rate=0.025, aov=70, cogs_ratio=0.42, refund_rate=0.04,
                 fixed_costs=fixed_costs + 150),
    ]
