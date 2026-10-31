"use client";

import { useState } from "react";
import BrandLogo, { type Brand, type Glyph } from "@/components/dashboard/BrandLogo";

// The services Vardaan connects to, with live status from /api/status and how to set each one up.
// Keys live in .env.local on the server; nothing secret is shown here.

export type IntegrationStatus = {
  ai: string | null;
  phone: boolean;
  phoneNumber: string | null;
  publicUrl: boolean;
  email: boolean;
  search?: string;
  google?: { configured: boolean; connected: boolean; email: string | null };
};

type State = "connected" | "available" | "soon";
type Group = "Core" | "Apps" | "Knowledge";

type Integration = {
  id: string;
  name: string;
  by?: string;
  body: string;
  group: Group;
  brand?: Brand;
  glyph?: Glyph;
  state: State;
  detail?: string;
  setup?: { steps: string[]; env?: string[] };
};

function build(s: IntegrationStatus | null): Integration[] {
  const search = s?.search ?? "duckduckgo";
  return [
    {
      id: "ai",
      name: "AI model",
      by: "Groq, Gemini or OpenAI",
      body: "The brain behind every call and task. Free with Groq or Gemini.",
      group: "Core",
      brand: s?.ai === "gemini" ? "gemini" : undefined,
      glyph: "ai",
      state: s?.ai ? "connected" : "available",
      detail: s?.ai ? `Using ${s.ai === "custom" ? "a custom model" : s.ai}` : undefined,
      setup: { steps: ["Create a free key at console.groq.com/keys", "Add it to .env.local and restart the app"], env: ["GROQ_API_KEY"] },
    },
    {
      id: "phone",
      name: "Phone calls",
      by: "Sarvam AI",
      body: "Vardaan rings your phone, and answers when you call it, in Indian languages and Hinglish.",
      group: "Core",
      glyph: "phone",
      state: s?.phone ? "connected" : "available",
      detail: s?.phoneNumber ? `Calling from ${s.phoneNumber}` : undefined,
      setup: {
        steps: [
          "Add wallet credit in the Sarvam dashboard, complete KYC and rent a number",
          "Create the Vardaan voice agent with the ask_vardaan tool (docs/SARVAM_SETUP.md)",
          "Run npm run tunnel and npm run dev, then press Call me",
        ],
        env: ["SARVAM_AGENT_API_KEY", "SARVAM_ORG_ID", "SARVAM_WORKSPACE_ID", "SARVAM_APP_ID", "SARVAM_CONNECTION_ID", "SARVAM_PHONE_NUMBER", "PUBLIC_URL"],
      },
    },
    {
      id: "calendar",
      name: "Google Calendar",
      by: "Google",
      body: "Ask what's on your day, check if you're free, and book meetings. Google emails the invites.",
      group: "Apps",
      brand: "googlecalendar",
      state: s?.google?.connected ? "connected" : "available",
      detail: s?.google?.connected ? `Connected as ${s.google.email}` : undefined,
      setup: {
        steps: ["Create a Google OAuth client (docs/GOOGLE_SETUP.md) and add the keys to .env.local", "Open Settings and press Connect Google"],
        env: ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"],
      },
    },
    {
      id: "gmail",
      name: "Gmail",
      by: "Google",
      body: "\"Any unread emails from my professor?\" Vardaan reads your inbox aloud. Read-only: it never sends or deletes.",
      group: "Apps",
      brand: "gmail",
      state: s?.google?.connected ? "connected" : "available",
      detail: s?.google?.connected ? `Connected as ${s.google.email}` : undefined,
      setup: { steps: ["Comes with the Google Calendar connection: connect Google once in Settings"] },
    },
    {
      id: "email",
      name: "Email sending",
      by: "Gmail SMTP",
      body: "Approved emails are sent for you. Without it, you get a ready-to-send link instead.",
      group: "Apps",
      brand: "gmail",
      state: s?.email ? "connected" : "available",
      detail: s?.email ? "Sending through your mail server" : undefined,
      setup: {
        steps: ["Turn on 2-step verification in your Google account", "Create an app password and add your Gmail settings to .env.local"],
        env: ["SMTP_HOST", "SMTP_USER", "SMTP_PASS"],
      },
    },
    {
      id: "whatsapp",
      name: "WhatsApp",
      by: "Meta",
      body: "Updates and approvals on WhatsApp, and send Vardaan a photo of a bill to explain.",
      group: "Apps",
      brand: "whatsapp",
      state: "soon",
    },
    {
      id: "sms",
      name: "Text messages",
      body: "Questions, results and approvals by SMS. Until then, updates show on your dashboard and by email.",
      group: "Apps",
      glyph: "sms",
      state: "soon",
    },
    {
      id: "search",
      name: "Web search",
      by: search === "tavily" ? "Tavily" : search === "brave" ? "Brave Search" : "DuckDuckGo",
      body: "Research, prices and comparisons from the live web, cited in every answer.",
      group: "Knowledge",
      brand: search === "brave" ? "brave" : search === "tavily" ? undefined : "duckduckgo",
      glyph: "search",
      state: "connected",
      detail: search === "duckduckgo" ? "Free, no key. Add Tavily or Brave for better results" : undefined,
      setup: { steps: ["Optional: get a free key from tavily.com or Brave Search and add it to .env.local"], env: ["TAVILY_API_KEY", "BRAVE_API_KEY"] },
    },
    {
      id: "weather",
      name: "Live weather",
      by: "Open-Meteo",
      body: "Current conditions and forecasts for any city, on calls and in your briefings.",
      group: "Knowledge",
      glyph: "weather",
      state: "connected",
      detail: "Free, no key",
    },
  ];
}

const BADGE: Record<State, { label: string; className: string }> = {
  connected: { label: "Connected", className: "border-[#8fcf3c]/30 bg-[#8fcf3c]/12 text-[#c9e877]" },
  available: { label: "Not set up", className: "border-white/10 bg-white/[0.05] text-ink/60" },
  soon: { label: "Coming soon", className: "border-white/10 bg-white/[0.03] text-ink/45" },
};

const GROUPS: { id: Group; sub: string }[] = [
  { id: "Core", sub: "What Vardaan needs to think and to call you." },
  { id: "Apps", sub: "Your calendar, inbox and messaging." },
  { id: "Knowledge", sub: "Live information from the web." },
];

export default function Integrations({ status }: { status: IntegrationStatus | null }) {
  const [open, setOpen] = useState<string | null>(null);
  const items = build(status);
  const live = items.filter((i) => i.state !== "soon");
  const connected = live.filter((i) => i.state === "connected").length;

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-[clamp(26px,3vw,32px)] font-medium leading-[1.15] tracking-[-0.02em] text-ink">Integrations</h1>
          <p className="mt-2 max-w-[560px] text-[14px] leading-[22px] text-ink/55">The services Vardaan uses to call, think, search and get things done.</p>
        </div>
        <div className="flex items-center gap-3 sm:flex-col sm:items-end sm:gap-2">
          <span className="text-[12.5px] text-ink/55 tabular-nums">
            {connected} of {live.length} connected
          </span>
          <span className="h-1 w-32 overflow-hidden rounded-full bg-white/[0.08]">
            <span className="block h-full rounded-full bg-[#8fcf3c]" style={{ width: `${(connected / live.length) * 100}%` }} />
          </span>
        </div>
      </div>

      <div className="space-y-8">
        {GROUPS.map((g) => (
          <section key={g.id}>
            <div className="mb-3 flex items-baseline gap-3">
              <h2 className="text-[12px] font-medium uppercase tracking-[0.14em] text-ink/45">{g.id}</h2>
              <p className="text-[12.5px] text-ink/35">{g.sub}</p>
            </div>
            <ul className="app-panel divide-y divide-white/[0.06] overflow-hidden">
              {items
                .filter((it) => it.group === g.id)
                .map((it) => {
                  const badge = BADGE[it.state];
                  const isOpen = open === it.id;
                  return (
                    <li key={it.id}>
                      <div className={`flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center ${it.state === "soon" ? "opacity-60" : ""}`}>
                        <div className="flex min-w-0 flex-1 items-start gap-4 sm:items-center">
                          <BrandLogo brand={it.brand} glyph={it.glyph} />
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                              <h3 className="text-[14.5px] font-medium text-ink">{it.name}</h3>
                              {it.by && <span className="text-[12px] text-ink/40">{it.by}</span>}
                            </div>
                            <p className="mt-0.5 text-[13px] leading-[20px] text-ink/55">{it.body}</p>
                            {it.detail && <p className="mt-1 text-[12px] text-ink/40">{it.detail}</p>}
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-2.5 pl-[60px] sm:pl-0">
                          <span className="flex justify-end sm:w-[96px]">
                            <span className={`whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[11px] ${badge.className}`}>{badge.label}</span>
                          </span>
                          {it.setup ? (
                            <button
                              onClick={() => setOpen(isOpen ? null : it.id)}
                              aria-expanded={isOpen}
                              className="h-8 w-[92px] cursor-pointer rounded-[9px] border border-white/[0.12] bg-white/[0.04] text-[12.5px] text-ink/85 transition hover:border-white/25 hover:bg-white/[0.08] hover:text-ink"
                            >
                              {isOpen ? "Close" : it.state === "connected" ? "Details" : "Set up"}
                            </button>
                          ) : (
                            <span aria-hidden className="hidden w-[92px] sm:block" />
                          )}
                        </div>
                      </div>
                      {isOpen && it.setup && (
                        <div className="border-t border-white/[0.06] bg-black/20 px-5 py-4 sm:pl-[80px]">
                          <ol className="space-y-2 text-[13px] leading-[20px] text-ink/70">
                            {it.setup.steps.map((step, k) => (
                              <li key={k} className="flex gap-3">
                                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-white/15 text-[10.5px] text-ink/55 tabular-nums">{k + 1}</span>
                                {step}
                              </li>
                            ))}
                          </ol>
                          {it.setup.env && (
                            <div className="mt-3 flex flex-wrap gap-1.5 pl-8">
                              {it.setup.env.map((e) => (
                                <code key={e} className="rounded-[6px] bg-white/[0.06] px-2 py-0.5 font-mono text-[11.5px] text-ink/80">
                                  {e}
                                </code>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </li>
                  );
                })}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
