import "server-only";

/** Envoie un courriel via Resend ; sans clé, l'affiche dans la console (mode développement). */
export async function sendEmail(to: string, subject: string, text: string) {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.log(`\n[courriel simulé] À : ${to}\nSujet : ${subject}\n${text}\n`);
    return;
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: process.env.EMAIL_FROM, to, subject, text }),
  });
  if (!res.ok) console.error("Échec d'envoi du courriel", res.status, await res.text());
}

// Adresse du site : APP_URL, sinon l'adresse de production donnée par Vercel, sinon le développement local.
export const appUrl = () =>
  process.env.APP_URL || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000");
