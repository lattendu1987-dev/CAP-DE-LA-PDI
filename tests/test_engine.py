import unittest

from pdi import config
from pdi.economics import order_economics, suggested_price
from pdi.guardrails import CampaignStats, OrderCheck, check_order, evaluate_campaign
from pdi.scoring import rank
from pdi.simulation import Scenario, run


class EconomicsTest(unittest.TestCase):
    def test_contribution(self):
        e = order_economics(100, 30, 10, fee_rate=0.029, fee_fixed=0.30, ad_cost=20, refund_rate=0.05)
        # 100 - 30 - 10 - 3.20 - 20 - 5
        self.assertAlmostEqual(e.contribution, 31.80)
        self.assertAlmostEqual(e.breakeven_cpa, 51.80)

    def test_suggested_price_hits_target(self):
        p = suggested_price(20, 10, fee_rate=0.029, fee_fixed=0.30, ad_cost=15, refund_rate=0.05, target_margin=0.25)
        e = order_economics(p, 20, 10, fee_rate=0.029, fee_fixed=0.30, ad_cost=15, refund_rate=0.05)
        self.assertGreaterEqual(e.contribution_pct, 0.25)
        self.assertTrue(f"{p:.2f}".endswith(".99"))

    def test_impossible_margin(self):
        with self.assertRaises(ValueError):
            suggested_price(1, 1, fee_rate=0.5, fee_fixed=0, ad_cost=0, refund_rate=0.3, target_margin=0.3)


class GuardrailsTest(unittest.TestCase):
    rules = config.settings()["ads_guardrails"]

    def test_kill_without_sales(self):
        d = evaluate_campaign(CampaignStats("x", spend=40, purchases=0, daily_budget=20), 25, self.rules)
        self.assertEqual(d.action, "ARRETER")

    def test_continue_early(self):
        d = evaluate_campaign(CampaignStats("x", spend=10, purchases=0, daily_budget=20), 25, self.rules)
        self.assertEqual(d.action, "CONTINUER")

    def test_scale_when_profitable(self):
        d = evaluate_campaign(CampaignStats("x", spend=80, purchases=8, daily_budget=20), 25, self.rules)
        self.assertEqual(d.action, "AUGMENTER")
        self.assertAlmostEqual(d.new_daily_budget, 24.0)

    def test_escalate_over_daily_cap(self):
        d = evaluate_campaign(CampaignStats("x", spend=80, purchases=8, daily_budget=55), 25, self.rules)
        self.assertEqual(d.action, "ESCALADER")

    def test_escalate_monthly_cap(self):
        d = evaluate_campaign(CampaignStats("x", spend=10, purchases=1, daily_budget=20), 25, self.rules,
                              account_spend_month=1500)
        self.assertEqual(d.action, "ESCALADER")

    def test_kill_when_cpa_too_high(self):
        d = evaluate_campaign(CampaignStats("x", spend=90, purchases=2, daily_budget=20), 25, self.rules)
        self.assertEqual(d.action, "ARRETER")


class OrderCheckTest(unittest.TestCase):
    rules = config.settings()["orders"]

    def test_normal_order_passes(self):
        ok, reasons = check_order(OrderCheck(60, 1, "CA", "CA"), self.rules)
        self.assertTrue(ok, reasons)

    def test_high_risk_held(self):
        ok, _ = check_order(OrderCheck(60, 1, "CA", "US", platform_risk="high"), self.rules)
        self.assertFalse(ok)

    def test_unpaid_held(self):
        ok, _ = check_order(OrderCheck(60, 1, "CA", "CA", payment_captured=False), self.rules)
        self.assertFalse(ok)


class ScoringTest(unittest.TestCase):
    def test_catalog_ranks(self):
        ranked = rank(config.products()["product"], config.settings())
        self.assertEqual(len(ranked), 6)
        # Les produits retenus passent avant les écartés.
        seen_ineligible = False
        for s in ranked:
            if not s.eligible:
                seen_ineligible = True
            else:
                self.assertFalse(seen_ineligible)


class SimulationTest(unittest.TestCase):
    def test_run(self):
        s = Scenario("t", ad_spend=1000, cpc=1.0, organic_sessions=0, conversion_rate=0.02,
                     aov=50, cogs_ratio=0.5, refund_rate=0.0, fixed_costs=100)
        r = run(s, 0.0, 0.0)
        self.assertEqual(r.orders, 20)
        self.assertEqual(r.revenue, 1000)
        self.assertEqual(r.net_before_tax, 1000 - 500 - 1000 - 100)


if __name__ == "__main__":
    unittest.main()
