import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createHash, randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import type { Role } from "@prisma/client";
import { db } from "./db";

const COOKIE = "fte_session";
const SESSION_DAYS = 30;

const hashToken = (t: string) => createHash("sha256").update(t).digest("hex");

export async function hashPassword(pw: string) {
  return bcrypt.hash(pw, 11);
}

export async function verifyPassword(pw: string, hash: string) {
  return bcrypt.compare(pw, hash);
}

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86400000);
  await db.session.create({ data: { id: hashToken(token), userId, expiresAt } });
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) await db.session.deleteMany({ where: { id: hashToken(token) } });
  jar.delete(COOKIE);
}

export async function getCurrentUser() {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  const session = await db.session.findUnique({
    where: { id: hashToken(token) },
    include: { user: { include: { player: true, recruiter: true, subscription: true } } },
  });
  if (!session || session.expiresAt < new Date() || session.user.suspended) return null;
  return session.user;
}

export type CurrentUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;

export async function requireUser(roles?: Role[]): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/connexion");
  if (roles && !roles.includes(user.role)) redirect("/tableau-de-bord");
  return user;
}

export function homeFor(role: Role): string {
  switch (role) {
    case "PLAYER":
      return "/joueur";
    case "GUARDIAN":
      return "/tuteur";
    case "RECRUITER":
      return "/recruteur/recherche";
    case "ADMIN":
      return "/admin";
    case "ADVERTISER":
      return "/publicite/campagnes";
  }
}
