import { NextResponse, type NextRequest } from "next/server";

// The demo account is read-only: while signed in as the demo, any request that would change
// something is refused here, before it reaches a route. Signing out still works.
const DEMO_USER_ID = "demo";
const ALLOWED = new Set(["/api/auth/logout", "/api/auth/login", "/api/auth/signup"]);

export function middleware(req: NextRequest) {
  if (req.method === "GET" || req.method === "HEAD" || ALLOWED.has(req.nextUrl.pathname)) return;
  const session = req.cookies.get("vardaan_session")?.value;
  if (session?.split(".")[0] !== DEMO_USER_ID) return;
  return NextResponse.json({ error: "This is a read-only demo. Create a free account to try it for real." }, { status: 403 });
}

export const config = { matcher: "/api/:path*" };
