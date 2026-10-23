// Parcours complets. Prérequis : base de démo (npm run db:seed) et serveur lancé.
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

function isoBirth(age: number) {
  const d = new Date();
  d.setFullYear(d.getFullYear() - age);
  d.setMonth(d.getMonth() - 1);
  return d.toISOString().slice(0, 10);
}

test("joueur majeur : inscription, profil, vidéo, Premium démo", async ({ page }) => {
  await page.goto("/inscription?role=joueur");
  await page.fill('input[name="firstName"]', "Samuel");
  await page.fill('input[name="lastName"]', `Test${uid}`);
  await page.fill('input[name="birthDate"]', isoBirth(21));
  await page.fill('input[name="name"]', "Samuel T.");
  await page.fill('input[name="email"]', `samuel-${uid}@test.local`);
  await page.fill('input[name="password"]', PW);
  await page.check('input[name="accept"]');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/\/joueur/);
  await expect(page.getByText("Profil complété à 0 %")).toBeVisible();

  // Poste principal AG puis secondaire AD sur le terrain
  await page.getByRole("button", { name: "AG", exact: true }).click();
  await page.getByRole("button", { name: "AD", exact: true }).click();
  await page.fill('input[name="heightCm"]', "180");
  await page.fill('input[name="weightKg"]', "74");
  await page.selectOption('select[name="foot"]', "LEFT");
  await page.getByRole("button", { name: "Enregistrer" }).click();
  await expect(page.getByText("Profil enregistré.")).toBeVisible();
  await expect(page.getByText("Profil complété à 30 %")).toBeVisible();

  await page.fill('input[name="url"]', "https://youtu.be/abc123XYZ");
  await page.fill('input[name="title"]', "Mes buts");
  await page.fill('textarea[name="moments"]', "00:45 Dribble\n01:12 But du gauche");
  await page.getByRole("button", { name: "Ajouter la vidéo" }).click();
  await expect(page.getByText("Vidéo ajoutée.")).toBeVisible();

  // Limite gratuite : 1 vidéo
  await page.fill('input[name="url"]', "https://youtu.be/second123");
  await page.getByRole("button", { name: "Ajouter la vidéo" }).click();
  await expect(page.getByText(/Limite de 1 vidéo/)).toBeVisible();

  // Abonnement Premium en mode démo
  await page.goto("/abonnement");
  await page.getByRole("button", { name: "Mensuel" }).click();
  await expect(page.getByText(/Mode démo : abonnement Joueur Premium activé/)).toBeVisible();

  // Profil public + lecteur avec moments clés
  await page.goto("/joueur");
  await page.getByRole("link", { name: "Voir mon profil public" }).click();
  await expect(page.getByRole("heading", { name: `Samuel Test${uid}` })).toBeVisible();
  await expect(page.getByText("★ Premium")).toBeVisible();
  await expect(page.getByRole("button", { name: /01:12 But du gauche/ })).toBeVisible();
});

test("mineur : bloqué sans parent, invisible jusqu'au consentement", async ({ page }) => {
  await page.goto("/inscription?role=joueur");
  const fill = async (withGuardian: boolean) => {
    await page.fill('input[name="firstName"]', "Nina");
    await page.fill('input[name="lastName"]', `Mineure${uid}`);
    await page.fill('input[name="birthDate"]', isoBirth(15));
    await page.fill('input[name="name"]', "Nina");
    await page.fill('input[name="email"]', `nina-${uid}@test.local`);
    await page.fill('input[name="password"]', PW);
    if (withGuardian) await page.fill('input[name="guardianEmail"]', `parent-${uid}@test.local`);
    await page.check('input[name="accept"]');
    await page.click('button[type="submit"]');
  };
  await fill(false);
  await expect(page.getByText(/courriel d'un parent ou tuteur légal est obligatoire/)).toBeVisible();
  await fill(true);
  await expect(page.getByText(/en attente de l'accord/)).toBeVisible();
  await logout(page);

  // Le recruteur ne la trouve pas
  await login(page, "scout@fte.local");
  await page.goto(`/recruteur/recherche?q=Mineure${uid}`);
  await expect(page.getByText("Aucun joueur ne correspond")).toBeVisible();
  await logout(page);

  // Le parent crée son compte et consent
  await page.goto(`/inscription?role=tuteur&email=parent-${uid}@test.local`);
  await page.fill('input[name="name"]', "Parent Test");
  await page.fill('input[name="password"]', PW);
  await page.check('input[name="accept"]');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/\/tuteur/);
  await expect(page.getByText(`Nina Mineure${uid}`)).toBeVisible();
  await page.locator('form:has(button:text("Je donne mon accord")) input[type="checkbox"]').check();
  await page.getByRole("button", { name: "Je donne mon accord" }).click();
  await expect(page.getByText("Consentement donné")).toBeVisible();
  await logout(page);

  // Visible maintenant, et le parent participe à la conversation
  await login(page, "scout@fte.local");
  await page.goto(`/recruteur/recherche?q=Mineure${uid}`);
  await page.getByRole("link", { name: `Nina Mineure${uid}` }).click();
  await page.fill('textarea[name="body"]', "Bonjour, nous organisons une détection U17 le mois prochain et aimerions inviter Nina.");
  await page.getByRole("button", { name: "Envoyer" }).click();
  await expect(page).toHaveURL(/\/messages\//);
  await expect(page.getByText("Représentant légal")).toBeVisible();
});

test("arnaque : alerte, signalement puis suspension par l'admin", async ({ page }) => {
  // Un faux recruteur s'inscrit (essai gratuit) et demande de l'argent
  await page.goto("/inscription?role=recruteur");
  await page.fill('input[name="name"]', `Faux Agent ${uid}`);
  await page.fill('input[name="email"]', `faux-${uid}@gmail.com`);
  await page.fill('input[name="password"]', PW);
  await page.selectOption('select[name="type"]', "SCOUT");
  await page.fill('input[name="organization"]', "Elite Europe Academy");
  await page.check('input[name="accept"]');
  await page.click('button[type="submit"]');
  await expect(page.getByText(/essai gratuit de 14 jours/)).toBeVisible();
  await expect(page.getByText("Vérification en cours")).toBeVisible();

  // Non vérifié : aucun accès aux mineurs
  await page.goto("/recruteur/recherche?q=Awa");
  await expect(page.getByText("Aucun joueur ne correspond")).toBeVisible();
  expect((await page.goto("/joueurs/awa-ndiaye"))?.status()).toBe(404);

  await page.goto("/recruteur/recherche?position=AG&foot=LEFT");
  await page.getByRole("link", { name: "Moussa Diallo" }).click();
  await page.fill('textarea[name="body"]', "Bravo ! Pour ton essai en Europe tu dois payer les frais de visa de 500 € par Western Union.");
  await page.getByRole("button", { name: "Envoyer" }).click();
  await expect(page).toHaveURL(/\/messages\//);
  await logout(page);

  await login(page, "moussa@fte.local");
  await page.goto("/messages");
  await page.getByRole("link", { name: new RegExp(`Faux Agent ${uid}`) }).click();
  await expect(page.getByText(/Un vrai club ne demande jamais de frais/)).toBeVisible();
  await page.getByText("Un problème avec ce contact ?").click();
  await page.getByRole("button", { name: new RegExp(`Signaler Faux Agent ${uid}`) }).click();
  await expect(page.getByText(/Notre équipe va examiner/)).toBeVisible();
  await logout(page);

  await login(page, "admin@fte.local");
  await expect(page).toHaveURL(/\/admin/);
  const row = page.locator("li", { hasText: `Faux Agent ${uid}` }).filter({ has: page.getByRole("button", { name: "Suspendre", exact: true }) }).first();
  await row.getByRole("button", { name: "Suspendre", exact: true }).click();
  await expect(page.getByText("Compte suspendu.")).toBeVisible();
  await logout(page);

  await page.goto("/connexion");
  await page.fill('input[name="email"]', `faux-${uid}@gmail.com`);
  await page.fill('input[name="password"]', PW);
  await page.click('button[type="submit"]');
  await expect(page.getByText(/compte est suspendu/)).toBeVisible();
});

test("recruteur : filtres, liste, évaluation, comparateur", async ({ page }) => {
  await login(page, "scout@fte.local");
  await page.goto("/recruteur/recherche?minAge=18&withVideo=1");
  await expect(page.getByRole("link", { name: "Moussa Diallo" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Lucas Tremblay" })).toHaveCount(0);

  await page.getByRole("link", { name: "Moussa Diallo" }).click();
  await page.fill('input[name="newName"]', `Ailiers ${uid}`);
  await page.getByRole("button", { name: "Ajouter", exact: true }).click();
  await expect(page.getByText("Joueur ajouté à la liste.")).toBeVisible();
  await page.getByRole("button", { name: "Enregistrer" }).click();
  await expect(page.getByText("Évaluation enregistrée.")).toBeVisible();

  await page.goto("/recruteur/comparer?ids=moussa-diallo&ids=lucas-tremblay");
  await expect(page.getByText("Comparateur")).toBeVisible();
  await expect(page.getByText("5.0/10")).toBeVisible();
});
