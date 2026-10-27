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

async function openMenu(page: Page) {
  const menu = page.locator(".nav-menu > summary");
  if (await menu.isVisible()) await menu.click();
}

async function logout(page: Page) {
  await openMenu(page);
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

  // Le parrain voit sa commission (20 % de 4,17 $ = 2 500 FCFA, soit 0,83 $)
  await login(page, "moussa@fte.local");
  await page.goto("/parrainage");
  const row = page.locator("li", { hasText: `Commission — Ibou${uid}` });
  await expect(row).toBeVisible();
  await expect(row.getByText(/\+0,83/)).toBeVisible();
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
    await openMenu(page);
    await page.locator('select[name="locale"]:visible').first().selectOption(lang);
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

test("vidéo lourde : compressée sur le téléphone avant l'envoi", async ({ page }) => {
  test.setTimeout(180_000); // fabrication de la vidéo + compression
  // Fabrique une vidéo 1080p très lourde avec ffmpeg (fourni par le paquet npm ffmpeg-static).
  const { execFileSync } = await import("node:child_process");
  const ffmpeg = (await import("ffmpeg-static")).default as unknown as string | null;
  const { existsSync, statSync, mkdirSync } = await import("node:fs");
  const fixture = "test-results/lourde-1080p.webm";
  try {
    mkdirSync("test-results", { recursive: true });
    if (!ffmpeg) throw new Error("ffmpeg absent");
    if (!existsSync(fixture))
      execFileSync(ffmpeg, ("-y -loglevel error -f lavfi -i testsrc2=size=1920x1080:rate=30 -f lavfi -i sine=frequency=440:sample_rate=48000 -t 12 -c:v libvpx-vp9 -b:v 12M -deadline realtime -cpu-used 8 -c:a libopus -b:a 128k " + fixture).split(" "));
  } catch {
    test.skip(true, "ffmpeg indisponible");
  }
  const original = statSync(fixture).size;
  await login(page, "moussa@fte.local");
  const form = page.locator("form", { has: page.getByTestId("upload-video") });
  await page.getByTestId("upload-video").setInputFiles(fixture);
  await expect(form.getByText("Envoyé ✓")).toBeVisible({ timeout: 120_000 });
  const info = await form.getByText(/Vidéo allégée/).textContent();
  const [, from, to] = info!.match(/([\d.]+) Mo → ([\d.]+) Mo/)!;
  expect(Number(to)).toBeLessThan(Number(from) / 2);
  expect(Number(from)).toBeCloseTo(original / 1024 / 1024, 0);
  await form.getByRole("button", { name: "Ajouter la vidéo" }).click();
  await expect(page.getByText("Vidéo ajoutée.")).toBeVisible();
});

test("notifications : un club regarde le profil puis écrit au joueur", async ({ page, browser }) => {
  // Faux service de notification (comme ceux de Google ou d'Apple), sur la machine de test.
  const https = await import("node:https");
  const { execFileSync } = await import("node:child_process");
  const { mkdirSync, readFileSync } = await import("node:fs");
  mkdirSync("test-results", { recursive: true });
  execFileSync("openssl", ["req", "-x509", "-newkey", "rsa:2048", "-nodes", "-keyout", "test-results/push.key", "-out", "test-results/push.crt", "-days", "1", "-subj", "/CN=localhost"], { stdio: "ignore" });
  const crypto = await import("node:crypto");
  const ece = (await import("http_ece")).default;
  const received: { headers: Record<string, unknown>; body: Buffer }[] = [];
  const server = https.createServer({ key: readFileSync("test-results/push.key"), cert: readFileSync("test-results/push.crt") }, (req, res) => {
    const chunks: Buffer[] = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => {
      received.push({ headers: req.headers, body: Buffer.concat(chunks) });
      res.writeHead(201).end();
    });
  });
  await new Promise<void>((r) => server.listen(4599, r));

  // Clés de l'« appareil » du joueur.
  const device = crypto.createECDH("prime256v1");
  device.generateKeys();
  const authSecret = crypto.randomBytes(16);
  const decrypt = (body: Buffer) =>
    JSON.parse(ece.decrypt(body, { version: "aes128gcm", privateKey: device, authSecret: authSecret.toString("base64url") }).toString());

  try {
    // Un nouveau joueur s'inscrit et active les notifications.
    const first = `Notif${uid}`;
    await page.goto("/inscription?role=joueur");
    await page.fill('input[name="firstName"]', first);
    await page.fill('input[name="lastName"]', "Test");
    await page.fill('input[name="birthDate"]', "2003-03-03");
    await page.fill('input[name="name"]', first);
    await page.fill('input[name="email"]', `notif-${uid}@test.local`);
    await page.fill('input[name="password"]', PW);
    await page.check('input[name="accept"]');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/joueur/);
    await expect(page.getByTestId("push-toggle")).toBeVisible();
    const origin = new URL(page.url()).origin;
    const reg = await page.request.post("/api/push", {
      headers: { Origin: origin },
      data: { endpoint: `https://localhost:4599/push/${uid}`, keys: { p256dh: device.getPublicKey("base64url"), auth: authSecret.toString("base64url") } },
    });
    expect(reg.ok()).toBe(true);
    // Un autre site ne peut pas enregistrer d'appareil à la place du joueur.
    expect((await page.request.post("/api/push", { headers: { Origin: "https://evil.com" }, data: {} })).status()).toBe(403);
    const slug = new URL((await page.getByRole("link", { name: "Voir mon profil public" }).getAttribute("href"))!, origin).pathname;

    // Un recruteur vérifié regarde le profil, puis écrit au joueur.
    const scout = await (await browser.newContext({ locale: "fr-FR" })).newPage();
    await scout.goto("/connexion");
    await scout.fill('input[name="email"]', "scout@fte.local");
    await scout.fill('input[name="password"]', PW);
    await scout.click('button[type="submit"]');
    await scout.waitForURL(/recherche/);
    await scout.goto(slug);
    await expect.poll(() => received.length, { timeout: 15_000 }).toBe(1);
    expect(received[0].headers["content-encoding"]).toBe("aes128gcm");
    expect(String(received[0].headers.authorization)).toMatch(/^vapid t=/);
    const view = decrypt(received[0].body);
    expect(view.title).toBe("👀 Ton profil a été consulté");
    expect(view.body).toContain("Passe Premium"); // joueur gratuit : le club reste anonyme
    expect(view.url).toBe("/joueur");

    // Revenir sur le profil le même jour ne renvoie pas de notification.
    await scout.reload();
    await scout.fill('textarea[name="body"]', "Bonjour, nous aimerions te voir lors de notre prochaine détection à Dakar.");
    await scout.getByRole("button", { name: "Envoyer" }).click();
    await expect(scout).toHaveURL(/\/messages\//);
    await expect.poll(() => received.length, { timeout: 15_000 }).toBe(2);
    const msg = decrypt(received[1].body);
    expect(msg.title).toBe("💬 Message de Sophie Martin");
    expect(msg.url).toMatch(/^\/messages\//);
    await scout.context().close();
  } finally {
    server.close();
  }
});

test("accueil : introduction, carrousel cinématographique et préférences d'animation", async ({ browser }) => {
  test.setTimeout(60_000);
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: "fr-FR" });
  const page = await ctx.newPage();
  await page.goto("/");
  // Introduction : le logo se dessine puis le rideau se lève
  await expect(page.locator("html")).toHaveAttribute("data-lx-intro", "on");
  await expect(page.locator("html")).not.toHaveAttribute("data-lx-intro", "on", { timeout: 5000 });
  const counter = page.locator("[data-lx-current]");
  await expect(counter).toHaveText("01");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Partout.");
  // Défilement automatique (7 s par scène)
  await expect(counter).toHaveText("02", { timeout: 10_000 });
  // Boutons et clavier
  await page.getByRole("button", { name: "Scène suivante" }).click();
  await expect(counter).toHaveText("03");
  await page.getByRole("button", { name: "Scène précédente" }).click();
  await expect(counter).toHaveText("02");
  await page.getByRole("button", { name: "Scène 5 sur 5" }).click();
  await expect(counter).toHaveText("05");
  await expect(page.locator(".lx-slide.is-active")).toHaveAttribute("data-slide", "4");
  // Pause
  await page.getByRole("button", { name: "Mettre en pause" }).click();
  await expect(page.locator(".lx-hero")).toHaveClass(/is-user-paused/);
  await expect(page.getByRole("button", { name: "Reprendre" })).toBeVisible();
  await page.waitForTimeout(8000);
  await expect(counter).toHaveText("05");
  // Pas de deuxième introduction dans la même session
  await page.reload();
  await expect(page.locator("html")).not.toHaveAttribute("data-lx-intro", "on");
  await ctx.close();

  // « Réduire les animations » : ni introduction, ni défilement automatique
  const calm = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: "fr-FR", reducedMotion: "reduce" });
  const p2 = await calm.newPage();
  await p2.goto("/");
  await expect(p2.locator("html")).not.toHaveAttribute("data-lx-intro", "on");
  await expect(p2.locator(".lx-hero")).toHaveClass(/is-paused/);
  await p2.waitForTimeout(8000);
  await expect(p2.locator("[data-lx-current]")).toHaveText("01");
  // Les sections restent visibles sans animation
  await p2.locator(".lx-manifesto").scrollIntoViewIfNeeded();
  await expect(p2.locator(".lx-big")).toBeVisible();
  await calm.close();
});

test("inscription : les saisies sont sauvegardées et restaurées, jamais le mot de passe", async ({ page }) => {
  await page.goto("/inscription?role=joueur");
  await page.fill('input[name="firstName"]', "Brouillon");
  await page.fill('input[name="lastName"]', "Test");
  await page.fill('input[name="password"]', "secret-123");
  await page.waitForTimeout(600); // la sauvegarde attend une courte pause dans la frappe
  await page.reload();
  await expect(page.locator('input[name="firstName"]')).toHaveValue("Brouillon");
  await expect(page.locator('input[name="lastName"]')).toHaveValue("Test");
  await expect(page.locator('input[name="password"]')).toHaveValue("");
  await expect(page.getByTestId("autosave-signup-joueur")).toContainText("Brouillon restauré");
  // « Effacer » remet le formulaire à zéro et oublie le brouillon.
  await page.getByTestId("autosave-signup-joueur").getByRole("button").click();
  await expect(page.locator('input[name="firstName"]')).toHaveValue("");
  await page.reload();
  await expect(page.locator('input[name="firstName"]')).toHaveValue("");
});

test("Boost : le joueur paie une fois et passe en tête des recherches", async ({ page }) => {
  await login(page, "moussa@fte.local");
  await page.goto("/abonnement");
  const boost = page.getByTestId("boost");
  await boost.locator('form:has(input[name="option"][value="WEEK"]) button').first().click();
  await expect(page.getByText("Boost activé")).toBeVisible();
  await expect(page.getByTestId("boost")).toContainText("Boost actif jusqu'au");
  await logout(page);

  await login(page, "scout@fte.local");
  await page.goto("/recruteur/recherche");
  const first = page.locator(".card:has(a[href^='/joueurs/'])").first();
  await expect(first).toContainText("Moussa Diallo");
  await expect(first).toContainText("À la une");
});

test("tarifs : prix adaptés au pays choisi, plancher africain en FCFA", async ({ page }) => {
  await page.goto("/tarifs?pays=SN");
  await expect(page.getByTestId("pricing-country")).toContainText("Sénégal");
  await expect(page.getByTestId("local-PLAYER_PREMIUM")).toContainText(/2\s?500/);
  await expect(page.getByText("2 500 FCFA par mois")).toBeVisible();
  await page.goto("/tarifs?pays=FR");
  await expect(page.getByTestId("price-RECRUITER_PRO")).toContainText("49");
});

test("carte des détections : autour de moi, dans un rayon de 100 km", async ({ browser }) => {
  const ctx = await browser.newContext({ geolocation: { latitude: 14.7167, longitude: -17.4677 }, permissions: ["geolocation"], locale: "fr-FR", viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  await page.goto("/detections");
  await expect(page.getByTestId("trials-map")).toBeVisible();
  await expect(page.locator(".trial-pin").first()).toBeVisible();
  await page.getByTestId("near-me").click();
  await expect(page).toHaveURL(/lat=14\.7167.*lng=-17\.4677.*rayon=100/);
  await expect(page.getByText(/Détections à moins de 100 km de toi/)).toBeVisible();
  await expect(page.getByRole("link", { name: /Détection U19 — FC Démo/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /Détection régionale — Thiès/ })).toContainText(/à \d+ km/);
  await expect(page.getByRole("link", { name: /gardiens de but/ })).toHaveCount(0);
  // Fiche : lieu exact, conditions, frais d'accès et itinéraire.
  await page.getByRole("link", { name: /Détection U19 — FC Démo/ }).click();
  await expect(page.getByText("Stade Léopold-Sédar-Senghor", { exact: false })).toBeVisible();
  await expect(page.getByText("Gratuit (règle de la plateforme)")).toBeVisible();
  await expect(page.getByRole("link", { name: /Itinéraire/ })).toHaveAttribute("href", /google\.com\/maps\/dir\/\?api=1&destination=14\.7467,-17\.4511/);
  await ctx.close();
});

test("actualités : opportunités repérées automatiquement, avertissement anti-arnaque", async ({ page }) => {
  await page.goto("/actualites");
  await expect(page.getByText("Un vrai club ne demande jamais d'argent pour un essai.", { exact: false })).toBeVisible();
  await expect(page.getByTestId("news-list")).toContainText("Journée de détection U17");
  await expect(page.getByRole("link", { name: /Lire sur le site d'origine/ }).first()).toHaveAttribute("rel", /nofollow/);
  await page.getByRole("navigation", { name: "Actualités et opportunités" }).getByRole("link", { name: "Actualités", exact: true }).click();
  await expect(page.getByTestId("news-list")).toContainText("nouvelle académie");
});

test("régie publicitaire : refus automatique, paiement, diffusion et statistiques", async ({ page, browser }) => {
  // Un équipementier crée son compte annonceur.
  await page.goto("/inscription?role=annonceur");
  await page.fill('input[name="name"]', `Crampons Pro ${uid}`);
  await page.fill('input[name="email"]', `pub-${uid}@test.local`);
  await page.fill('input[name="password"]', PW);
  await page.selectOption('select[name="country"]', "SN");
  await page.check('input[name="accept"]');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/\/publicite\/campagnes/);

  // Petite image PNG (1 × 1 pixel) comme visuel.
  const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==", "base64");
  const fillAd = async (headline: string, link: string) => {
    await page.getByTestId("upload-ad").setInputFiles({ name: "visuel.png", mimeType: "image/png", buffer: png });
    await expect(page.locator('input[name="storageKey"]')).not.toHaveValue("");
    await page.fill('input[name="headline"]', headline);
    await page.fill('input[name="linkUrl"]', link);
    await page.getByTestId("new-campaign").getByRole("button", { name: "Payer et diffuser" }).click();
  };

  // Lien raccourci : refusé automatiquement, rien n'est facturé.
  await fillAd("Crampons pro pour la rentrée", "https://bit.ly/promo");
  await expect(page.getByText("Les liens raccourcis sont refusés")).toBeVisible();

  // Annonce correcte : payée (mode démo) et en ligne aussitôt.
  await fillAd(`Crampons pro -20 % ${uid}`, "https://crampons-pro.example.com/promo");
  await expect(page.getByText("Campagne en ligne")).toBeVisible();
  const card = page.getByTestId("campaigns").locator(".card", { hasText: `Crampons pro -20 % ${uid}` });
  await expect(card).toContainText("En ligne");

  // Un visiteur au Sénégal voit la bannière sponsorisée.
  const ctx = await browser.newContext({ locale: "fr-FR", extraHTTPHeaders: { "x-country-code": "SN" } });
  const visitor = await ctx.newPage();
  let seen = false;
  for (let i = 0; i < 10 && !seen; i++) {
    await visitor.goto("/detections");
    seen = (await visitor.getByTestId("ad-banner").filter({ hasText: uid }).count()) > 0;
  }
  expect(seen).toBe(true);
  await expect(visitor.getByTestId("ad-banner").filter({ hasText: uid })).toContainText("Sponsorisé");
  await ctx.close();

  // L'annonceur voit ses affichages, puis arrête la campagne.
  await page.reload();
  expect(Number(await card.getByTestId("ad-impressions").textContent())).toBeGreaterThan(0);
  await card.getByRole("button", { name: "Arrêter la campagne" }).click();
  await expect(page.getByTestId("campaigns").locator(".card", { hasText: `Crampons pro -20 % ${uid}` })).toContainText("Arrêtée");
});
