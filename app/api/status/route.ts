import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { googleConfigured, googleLinkFor } from "@/lib/google";
import { provider } from "@/lib/llm";
import { mailConfigured } from "@/lib/mail";
import { sarvamCallsConfigured, sarvamPhoneNumber } from "@/lib/sarvam-calls";

// What's connected, so the dashboard can show setup status. Never returns secrets or tokens.
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Please log in." }, { status: 401 });
  const p = provider();
  const link = await googleLinkFor(user.id);
  return NextResponse.json({
    ai: p ? p.name : null,
    phone: sarvamCallsConfigured(),
    phoneNumber: sarvamCallsConfigured() ? sarvamPhoneNumber() : null,
    publicUrl: Boolean(process.env.PUBLIC_URL),
    email: mailConfigured(),
    // Which web search provider the agent uses (see lib/search.ts).
    search: process.env.TAVILY_API_KEY ? "tavily" : process.env.BRAVE_API_KEY ? "brave" : "duckduckgo",
    google: { configured: googleConfigured(), connected: Boolean(link), email: link?.email ?? null },
  });
}
