import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "e2e",
  timeout: 60_000,
  workers: 1,
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000",
    launchOptions: process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {},
    // Chromium complet (et non la version allégée « headless shell ») : elle seule gère les notifications push.
    channel: process.env.CHROMIUM_PATH ? undefined : "chromium",
    viewport: { width: 390, height: 844 }, // téléphone
    locale: "fr-FR",
  },
});
