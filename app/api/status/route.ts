import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { provider } from "@/lib/llm";
import { mailConfigured } from "@/lib/mail";
import { publicUrl, twilioConfigured } from "@/lib/twilio";

// What's connected, so the dashboard can show setup status. Never returns secrets.
export async function GET() {
  if (!(await getCurrentUser())) return NextResponse.json({ error: "Please log in." }, { status: 401 });
  const p = provider();
  return NextResponse.json({
    ai: p ? p.name : null,
    phone: twilioConfigured(),
    twilioNumber: twilioConfigured() ? process.env.TWILIO_PHONE_NUMBER : null,
    publicUrl: Boolean(publicUrl()),
    email: mailConfigured(),
  });
}
