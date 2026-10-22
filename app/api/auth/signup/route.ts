import { NextResponse } from "next/server";
import { createSessionToken, EMAIL_RE, hashPassword, SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth";
import { newId, now, write } from "@/lib/db";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!name || name.length > 80) return NextResponse.json({ error: "Please enter your name." }, { status: 400 });
  if (!EMAIL_RE.test(email) || email.length > 254)
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  if (password.length < 8) return NextResponse.json({ error: "Use at least 8 characters for your password." }, { status: 400 });

  const passwordHash = await hashPassword(password);
  const id = newId();
  const created = await write((d) => {
    if (d.users.some((u) => u.email === email)) return false;
    d.users.push({ id, name, email, passwordHash, createdAt: now() });
    return true;
  });
  if (!created) return NextResponse.json({ error: "An account with this email already exists. Try logging in." }, { status: 409 });

  const { token, expires } = createSessionToken(id);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions(req, expires));
  return res;
}
