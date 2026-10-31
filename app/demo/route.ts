import { NextResponse } from "next/server";
import { SESSION_COOKIE, createSessionToken, sessionCookieOptions } from "@/lib/auth";
import { DEMO_USER_ID } from "@/lib/demo";

// GET /demo — sign in to the read-only demo account and open the dashboard.
export function GET(req: Request) {
  const { token, expires } = createSessionToken(DEMO_USER_ID);
  const res = NextResponse.redirect(new URL("/app", req.url));
  res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions(req, expires));
  return res;
}
