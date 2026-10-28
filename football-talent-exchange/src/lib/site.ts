import { appUrl } from "./email";

/** Nom officiel du site, utilisé par Google et les réseaux sociaux (même nom dans toutes les langues). */
export const SITE_NAME = "Football Talent Exchange";

/** Pages privées : jamais proposées aux moteurs de recherche. */
export const PRIVATE_PATHS = [
  "/admin", "/api/", "/compte", "/joueur", "/messages", "/tableau-de-bord", "/abonnement",
  "/tuteur", "/recruteur", "/parrainage", "/publicite/campagnes", "/detections/nouvelle", "/connexion",
];

export const siteUrl = () => appUrl().replace(/\/$/, "");
