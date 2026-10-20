import tempfile
import unittest
from pathlib import Path

from pdi import config
from pdi.affiliate import AffiliateScenario, run
from pdi.site import DISCLOSURE, amazon_url, build, e


class SiteTest(unittest.TestCase):
    def setUp(self):
        self.tmp = Path(tempfile.mkdtemp()) / "public"
        self.out = build(self.tmp)
        self.guides = config.load_toml("site.toml")["guide"]

    def test_all_pages_exist(self):
        for g in self.guides:
            self.assertTrue((self.out / f"{g['slug']}.html").exists())
        for name in ["index.html", "divulgation.html", "confidentialite.html", "a-propos.html",
                     "404.html", "sitemap.xml", "robots.txt", "style.css", "app.js"]:
            self.assertTrue((self.out / name).exists(), name)

    def test_disclosure_on_every_page(self):
        for page in self.out.glob("*.html"):
            self.assertIn(e(DISCLOSURE), page.read_text(encoding="utf-8"), page.name)

    def test_affiliate_links_are_marked_sponsored(self):
        html = (self.out / f"{self.guides[0]['slug']}.html").read_text(encoding="utf-8")
        self.assertIn("amazon.ca/s?k=", html)
        self.assertIn('rel="sponsored nofollow noopener"', html)

    def test_no_prices_shown(self):
        # Le contrat Amazon interdit d'afficher des prix hors API officielle.
        for page in self.out.glob("*.html"):
            text = page.read_text(encoding="utf-8")
            self.assertNotRegex(text, r"\d+[,.]\d{2}\s?\$", page.name)


class AmazonUrlTest(unittest.TestCase):
    def test_tag_added(self):
        self.assertEqual(amazon_url("bottes chien", "abc-20"), "https://www.amazon.ca/s?k=bottes+chien&tag=abc-20")

    def test_no_tag(self):
        self.assertEqual(amazon_url("bottes chien", ""), "https://www.amazon.ca/s?k=bottes+chien")


class AffiliateTest(unittest.TestCase):
    def test_run(self):
        r = run(AffiliateScenario("t", 1000, 0.1, 0.1, 50, 0.04))
        self.assertEqual(r.orders, 10)
        self.assertEqual(r.commission, 20)


if __name__ == "__main__":
    unittest.main()
