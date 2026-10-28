import "server-only";
import type { CvData } from "./domain/cv-merge";

/**
 * Réponses fixes pour les tests automatiques (variable AI_FAKE_RESPONSES=1), afin de tester l'import
 * de CV sans appeler l'IA. Jamais active quand une vraie clé ANTHROPIC_API_KEY est configurée.
 */
export const aiFake = () => process.env.AI_FAKE_RESPONSES === "1" && !process.env.ANTHROPIC_API_KEY;

export const FAKE_CV: CvData = {
  heightCm: 176, weightKg: 70, foot: "LEFT", mainPosition: "AG", otherPositions: ["AD"], currentLevel: "SEMI_PRO",
  city: "Thiès", nationalities: ["SN"], languages: ["Français", "Wolof"],
  career: [
    { club: "AS Douanes", kind: "CLUB", country: "SN", startYear: 2022, endYear: null },
    { club: "Académie Génération Foot", kind: "ACADEMY", country: "SN", startYear: 2017, endYear: 2022 },
  ],
  stats: [{ season: "2024-2025", club: "AS Douanes", matches: 24, goals: 9, assists: 5, minutes: 1850 }],
  summary: "Ailier gauche formé à l'académie Génération Foot, je joue à l'AS Douanes depuis 2022. Lors de la saison 2024-2025, j'ai marqué 9 buts et délivré 5 passes décisives en 24 matchs.",
};

export const FAKE_BIO = "Ailier gauche, je privilégie la vitesse et le jeu vers l'avant. Je cherche un club où progresser et montrer mon niveau.";
