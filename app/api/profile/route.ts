import { NextResponse } from "next/server";
import { EMAIL_RE, getCurrentUser } from "@/lib/auth";
import { read, write } from "@/lib/db";
import { normalisePhone } from "@/lib/phone";
import { PHONE_LANGUAGES } from "@/lib/sarvam-calls";

const view = (u?: { phone?: string; lang?: string; emergencyName?: string; emergencyEmail?: string }) => ({
  phone: u?.phone ?? "",
  lang: u?.lang ?? "en-IN",
  emergencyName: u?.emergencyName ?? "",
  emergencyEmail: u?.emergencyEmail ?? "",
});

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Please log in." }, { status: 401 });
  const full = await read((d) => d.users.find((u) => u.id === user.id));
  return NextResponse.json({ name: full?.name, email: full?.email, ...view(full) });
}

// Save the phone number Vardaan calls, the language it speaks on calls, and the emergency contact.
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Please log in." }, { status: 401 });
  const body = await req.json().catch(() => null);

  let phone: string | undefined;
  if (typeof body?.phone === "string" && body.phone.trim()) {
    const normalised = normalisePhone(body.phone);
    if (!normalised) return NextResponse.json({ error: "Enter a valid mobile number, e.g. 98765 43210 or +91 98765 43210." }, { status: 400 });
    phone = normalised;
  }
  const lang = typeof body?.lang === "string" && PHONE_LANGUAGES.includes(body.lang) ? body.lang : undefined;

  const emergencyEmail = typeof body?.emergencyEmail === "string" ? body.emergencyEmail.trim().toLowerCase() : undefined;
  if (emergencyEmail && (!EMAIL_RE.test(emergencyEmail) || emergencyEmail.length > 254)) {
    return NextResponse.json({ error: "Enter a valid emergency contact email." }, { status: 400 });
  }
  const emergencyName = typeof body?.emergencyName === "string" ? body.emergencyName.trim().slice(0, 80) : undefined;

  const taken = phone ? await read((d) => d.users.some((u) => u.phone === phone && u.id !== user.id)) : false;
  if (taken) return NextResponse.json({ error: "That number is already linked to another account." }, { status: 409 });

  const saved = await write((d) => {
    const u = d.users.find((x) => x.id === user.id);
    if (!u) return null;
    if (phone !== undefined) u.phone = phone;
    if (body?.phone === "") u.phone = undefined;
    if (lang) u.lang = lang;
    if (emergencyEmail !== undefined) u.emergencyEmail = emergencyEmail || undefined;
    if (emergencyName !== undefined) u.emergencyName = emergencyName || undefined;
    return view(u);
  });
  return NextResponse.json(saved);
}
