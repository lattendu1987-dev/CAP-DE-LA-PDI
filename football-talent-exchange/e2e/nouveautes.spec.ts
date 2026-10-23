// Parrainage, mobile money, détections, langues. Prérequis : base de démo (npm run db:seed) et serveur lancé.
import { expect, test, type Page } from "@playwright/test";

const uid = Date.now().toString(36);
const PW = "demo1234";

async function login(page: Page, email: string) {
  await page.goto("/connexion");
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', PW);
  await page.click('button[type="submit"]');
  await page.waitForURL((u) => !u.pathname.startsWith("/connexion"));
}

async function logout(page: Page) {
  await page.getByRole("button", { name: "Déconnexion" }).click();
  await page.waitForURL("/");
}

test("parrainage + mobile money : le parrain gagne 20 % automatiquement", async ({ page }) => {
  await login(page, "moussa@fte.local");
  await page.goto("/parrainage");
  const link = (await page.getByTestId("referral-link").textContent())!.trim();
  expect(link).toMatch(/\?ref=[A-Z0-9]{8}$/);
  await logout(page);

  // Un ami arrive par le lien et s'inscrit
  await page.goto(new URL(link).pathname + new URL(link).search);
  await page.getByRole("link", { name: /Je suis joueur/ }).click();
  await expect(page.getByText("Invité par Moussa Diallo 🎉")).toBeVisible();
  await page.fill('input[name="firstName"]', `Ibou${uid}`);
  await page.fill('input[name="lastName"]', `Filleul${uid}`);
  await page.fill('input[name="birthDate"]', "2004-05-10");
  await page.fill('input[name="name"]', `Ibou${uid}`);
  await page.fill('input[name="email"]', `ibou-${uid}@test.local`);
  await page.fill('input[name="password"]', PW);
  await page.selectOption('select[name="country"]', "SN");
  await page.check('input[name="accept"]');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/\/joueur/);

  // Il paie Premium par mobile money (mode démo : sans Flutterwave configuré)
  await page.goto("/abonnement");
  await expect(page.getByText(/Orange Money, Wave/).first()).toBeVisible();
  await page.locator("form", { has: page.locator('input[name="interval"][value="MONTH"]') }).filter({ has: page.getByRole("button", { name: /📱/ }) }).getByRole("button").click();
  await expect(page.getByText(/abonnement Joueur Premium activé/)).toBeVisible();
  await logout(page);

  // Le parrain voit sa commission (20 % de 3 $ = 0,60 $)
  await login(page, "moussa@fte.local");
  await page.goto("/parrainage");
  const row = page.locator("li", { hasText: `Commission — Ibou${uid}` });
  await expect(row).toBeVisible();
  await expect(row.getByText(/\+0,60/)).toBeVisible();
});

test("détections : publication, candidature, invitation", async ({ page }) => {
  const title = `Détection U23 ${uid}`;
  await login(page, "scout@fte.local");
  await page.goto("/detections/nouvelle");
  await page.fill('input[name="title"]', title);
  await page.fill('textarea[name="description"]', "Détection gratuite pour joueurs de 16 à 23 ans. Venir en tenue avec protège-tibias.");
  await page.fill('input[name="city"]', "Dakar");
  await page.selectOption('select[name="country"]', "SN");
  const d = (days: number) => new Date(Date.now() + days * 86400000).toISOString().slice(0, 16);
  await page.fill('input[name="startsAt"]', d(20));
  await page.fill('input[name="deadline"]', d(10));
  await page.fill('input[name="minAge"]', "16");
  await page.fill('input[name="maxAge"]', "23");
  await page.check('input[name="free"]');
  await page.getByRole("button", { name: "Publier" }).click();
  await expect(page.getByText("Détection publiée !")).toBeVisible();
  const trialUrl = page.url().split("?")[0];
  await logout(page);

  await login(page, "moussa@fte.local");
  await page.goto("/detections");
  await page.getByRole("link", { name: new RegExp(title) }).click();
  await page.fill('textarea[name="message"]', "Disponible, merci !");
  await page.getByRole("button", { name: "Postuler avec mon profil" }).click();
  await expect(page.getByText(/Candidature envoyée !/)).toBeVisible();
  await logout(page);

  await login(page, "scout@fte.local");
  await page.goto(trialUrl);
  await expect(page.getByRole("link", { name: "Moussa Diallo" })).toBeVisible();
  await page.getByRole("button", { name: "Inviter" }).click();
  await expect(page.getByText(/Statut mis à jour/)).toBeVisible();
  await logout(page);

  await login(page, "moussa@fte.local");
  await expect(page.locator("#candidatures li", { hasText: title }).getByText("Invité")).toBeVisible();
});

test("une annonce de détection qui demande de l'argent est refusée", async ({ page }) => {
  await login(page, "scout@fte.local");
  await page.goto("/detections/nouvelle");
  await page.fill('input[name="title"]', "Essai Europe");
  await page.fill('textarea[name="description"]', "Pour participer il faut payer les frais d'inscription de 100 € par Western Union.");
  await page.fill('input[name="city"]', "Abidjan");
  const d = (days: number) => new Date(Date.now() + days * 86400000).toISOString().slice(0, 16);
  await page.fill('input[name="startsAt"]', d(20));
  await page.fill('input[name="deadline"]', d(10));
  await page.check('input[name="free"]');
  await page.getByRole("button", { name: "Publier" }).click();
  await expect(page.getByText("Vérifie les informations de la détection.")).toBeVisible();
});

test("langues : anglais, espagnol, portugais et arabe (de droite à gauche)", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Ton talent mérite d'être vu.");
  const cases: [string, string, string][] = [
    ["en", "Your talent deserves to be seen.", "ltr"],
    ["es", "Tu talento merece ser visto.", "ltr"],
    ["pt", "Seu talento merece ser visto.", "ltr"],
    ["ar", "موهبتك تستحق أن تُرى.", "rtl"],
  ];
  for (const [lang, title, dir] of cases) {
    await page.locator('select[name="locale"]').first().selectOption(lang);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(title);
    await expect(page.locator("html")).toHaveAttribute("dir", dir);
    await expect(page.locator("html")).toHaveAttribute("lang", lang);
  }
  // La langue du navigateur est détectée automatiquement pour un nouveau visiteur.
  const ctx = await page.context().browser()!.newContext({ locale: "pt-BR" });
  const p2 = await ctx.newPage();
  await p2.goto(page.url());
  await expect(p2.getByRole("heading", { level: 1 })).toContainText("Seu talento merece ser visto.");
  await ctx.close();
});
