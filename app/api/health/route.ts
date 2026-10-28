import { NextResponse } from "next/server";
import { provider } from "@/lib/llm";
import { twilioConfigured } from "@/lib/twilio";

// Public health check endpoint — no auth required.
// Useful for deployment platforms, uptime monitors, and the README's quick-test step.
export async function GET() {
  const status = {
    status: "ok",
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version ?? "0.1.0",
    services: {
      ai: provider() ? "configured" : "not_configured",
      telephony: twilioConfigured() ? "configured" : "not_configured",
    },
  };
  return NextResponse.json(status);
}
