import { NextResponse, type NextRequest } from "next/server";

// Mémorise le code de parrainage (?ref=CODE) pendant 30 jours.
export function middleware(req: NextRequest) {
  const ref = req.nextUrl.searchParams.get("ref")?.trim().toUpperCase();
  const res = NextResponse.next();
  if (ref && /^[A-Z0-9]{6,12}$/.test(ref) && !req.cookies.get("fte_ref")) {
    res.cookies.set("fte_ref", ref, { path: "/", maxAge: 30 * 86400, sameSite: "lax", httpOnly: true });
  }
  return res;
}

export const config = { matcher: ["/((?!_next|api|.*\\..*).*)"] };
