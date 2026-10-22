import { NextResponse } from "next/server";
import { createSessionToken, SESSION_COOKIE, sessionCookieOptions, verifyPassword } from "@/lib/auth";
import { read } from "@/lib/db";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  const user = await read((d) => d.users.find((u) => u.email === email));
  // Same message for unknown email and wrong password, so accounts can't be probed.
  if (!user || !(await verifyPassword(password, user.passwordHash)))
    return NextResponse.json({ error: "That email and password don't match." }, { status: 401 });

  const { token, expires } = createSessionToken(user.id);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions(req, expires));
  return res;
}
