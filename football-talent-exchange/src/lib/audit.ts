import "server-only";
import { db } from "./db";

export async function audit(actorId: string | null, action: string, details?: unknown) {
  await db.auditLog.create({ data: { actorId, action, details: details === undefined ? null : JSON.stringify(details) } });
}
