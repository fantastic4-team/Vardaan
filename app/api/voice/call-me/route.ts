import { timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { read, write } from "@/lib/db";
import { startCall } from "@/lib/phone";
import { normalisePhone } from "@/lib/twilio";

// "Call me": Vardaan rings the user's phone. Triggered from the dashboard (logged-in user), or from
// the `npm run phone` terminal, which proves itself with a random token it set for this server only.
export async function POST(req: Request) {
  const user = (await getCurrentUser()) ?? (await terminalUser(req));
  if (!user) return NextResponse.json({ error: "Please log in." }, { status: 401 });
  try {
    return NextResponse.json({ id: await startCall(user.id, "Call me") });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Could not call." }, { status: 400 });
  }
}

async function terminalUser(req: Request) {
  const token = process.env.VARDAAN_CLI_TOKEN;
  const sent = req.headers.get("x-vardaan-cli");
  if (!token || !sent || sent.length !== token.length || !timingSafeEqual(Buffer.from(sent), Buffer.from(token))) return null;
  const { phone, email } = (await req.json().catch(() => ({}))) as { phone?: string; email?: string };
  const wanted = normalisePhone(phone ?? "");
  if (!wanted) return null;
  const linked = await read((d) => d.users.find((u) => u.phone === wanted) ?? null);
  if (linked || !email) return linked;
  // First run: save this number on the account with that email, so calls and texts reach it.
  return write((d) => {
    const u = d.users.find((x) => x.email === email.trim().toLowerCase());
    if (u) u.phone = wanted;
    return u ?? null;
  });
}
