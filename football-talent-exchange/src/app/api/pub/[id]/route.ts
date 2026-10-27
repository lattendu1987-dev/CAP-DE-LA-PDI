import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";

// Clic sur une publicité : compté, puis redirection vers le site de l'annonceur (adresse https validée à la création).
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ad = await db.adCampaign.findUnique({ where: { id }, select: { id: true, linkUrl: true, status: true } });
  if (!ad || !/^https:\/\//.test(ad.linkUrl)) return new Response("Introuvable", { status: 404 });
  if (ad.status === "ACTIVE") await db.adCampaign.update({ where: { id }, data: { clicks: { increment: 1 } } });
  return NextResponse.redirect(ad.linkUrl, 302);
}

// Affichage réel d'un pop-up sponsorisé (compté côté navigateur, une fois par visite).
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await db.adCampaign.updateMany({ where: { id, status: "ACTIVE", format: "INTERSTITIAL" }, data: { impressions: { increment: 1 } } });
  return new Response(null, { status: 204 });
}
