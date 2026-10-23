import "server-only";

/** Vercel Cron envoie "Authorization: Bearer <CRON_SECRET>". */
export function cronAuthorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  return !!secret && req.headers.get("authorization") === `Bearer ${secret}`;
}
