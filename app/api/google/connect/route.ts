import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { authUrl, googleConfigured, redirectUri } from "@/lib/google";

// GET /api/google/connect: send the signed-in user to Google to allow Calendar and Gmail access.
export async function GET(req: Request) {
  const origin = new URL(req.url).origin;
  if (!(await getCurrentUser())) return NextResponse.redirect(`${origin}/login`);
  if (!googleConfigured()) return NextResponse.redirect(`${origin}/app?google=not_configured`);

  // A one-time value tied to this browser, checked on the way back, so nobody can link their
  // Google account to your Vardaan account (or yours to theirs) with a forged callback.
  const state = randomBytes(24).toString("hex");
  const res = NextResponse.redirect(authUrl(state, redirectUri(origin)));
  res.cookies.set("vardaan_google_state", state, { httpOnly: true, sameSite: "lax", secure: origin.startsWith("https"), path: "/api/google", maxAge: 600 });
  return res;
}
