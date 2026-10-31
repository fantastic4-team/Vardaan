"use client";

import { useState } from "react";

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

type Integration = {
  id: string;
  name: string;
  body: string;
  tile: string;
  icon: React.ReactNode;
  state: State;
  detail?: string;
  setup?: { steps: string[]; env?: string[] };
};

const ICONS = {
  phone: (
    <path d="M21 16.4v2.7a1.9 1.9 0 0 1-2.1 1.9 18.8 18.8 0 0 1-8.2-2.9 18.5 18.5 0 0 1-5.7-5.7A18.8 18.8 0 0 1 2.1 4.1 1.9 1.9 0 0 1 4 2h2.7a1.9 1.9 0 0 1 1.9 1.6c.1.9.4 1.8.7 2.7a1.9 1.9 0 0 1-.4 2L7.7 9.4a15.2 15.2 0 0 0 5.7 5.7l1.1-1.1a1.9 1.9 0 0 1 2-.4c.9.3 1.8.6 2.7.7a1.9 1.9 0 0 1 1.8 2.1z" />
  ),
  ai: (
    <>
      <path d="M12 3.5 13.8 9l5.7 1.5-5.7 1.6L12 17.5l-1.8-5.4L4.5 10.5 10.2 9z" />
      <path d="M18.5 16.5 19.2 18.6 21 19.2 19.2 19.9 18.5 22 17.8 19.9 16 19.2 17.8 18.6z" />
    </>
  ),
  sms: <path d="M20 15.5a2 2 0 0 1-2 2H8l-4.5 3.5V5.5a2 2 0 0 1 2-2H18a2 2 0 0 1 2 2zM8 9.5h8M8 13h5" />,
  mail: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2.5" />
      <path d="m4 7 8 6 8-6" />
    </>
  ),
  search: (
    <>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m20 20-4.8-4.8" />
    </>
  ),
  whatsapp: (
    <>
      <path d="M4 20.5 5.3 16.6A8.5 8.5 0 1 1 8.4 19.3z" />
      <path d="M9.2 8.6c.2-.5.5-.6.8-.6h.5c.2 0 .4.1.5.4l.7 1.6c.1.2 0 .5-.1.6l-.5.6c.6 1.1 1.5 2 2.6 2.6l.6-.5c.2-.1.4-.2.6-.1l1.6.7c.3.1.4.3.4.5v.5c0 .3-.1.6-.6.8-.6.3-1.6.4-3.2-.4a8.4 8.4 0 0 1-3.6-3.6c-.8-1.6-.7-2.6-.3-3.1z" />
    </>
  ),
  weather: (
    <>
      <path d="M7.5 18.5h9.5a4 4 0 0 0 .4-8 5.5 5.5 0 0 0-10.6 1.4A3.3 3.3 0 0 0 7.5 18.5z" />
      <path d="M12 2.5v1.5M5.4 5.4l1 1M2.5 12H4" />
    </>
  ),
  calendar: (
    <>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" />
      <path d="M3.5 10h17M8 3v4M16 3v4" />
    </>
  ),
};

function build(s: IntegrationStatus | null): Integration[] {
  const search = s?.search ?? "duckduckgo";
  return [
    {
      id: "ai",
      name: "AI model",
      body: "The brain behind every call and task. Free with Groq or Gemini.",
      tile: "tile-violet",
      icon: ICONS.ai,
      state: s?.ai ? "connected" : "available",
      detail: s?.ai ? `Using ${s.ai === "custom" ? "a custom model" : s.ai}` : undefined,
      setup: { steps: ["Create a free key at console.groq.com/keys", "Add it to .env.local and restart the app"], env: ["GROQ_API_KEY"] },
    },
    {
      id: "phone",
      name: "Phone calls",
      body: "Vardaan rings your phone, and answers when you call it, in Indian languages and Hinglish. Powered by Sarvam AI.",
      tile: "tile-leaf",
      icon: ICONS.phone,
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
      id: "weather",
      name: "Live weather",
      body: "Current conditions and forecasts for any city, on calls and in your briefings.",
      tile: "tile-teal",
      icon: ICONS.weather,
      state: "connected",
      detail: "Using Open-Meteo (free, no key)",
    },
    {
      id: "email",
      name: "Email",
      body: "Approved emails are sent for you. Without it, you get a ready-to-send link instead.",
      tile: "tile-rose",
      icon: ICONS.mail,
      state: s?.email ? "connected" : "available",
      detail: s?.email ? "Sending through your mail server" : undefined,
      setup: {
        steps: ["Turn on 2-step verification in your Google account", "Create an app password and add your Gmail settings to .env.local"],
        env: ["SMTP_HOST", "SMTP_USER", "SMTP_PASS"],
      },
    },
    {
      id: "search",
      name: "Web search",
      body: "Research, prices and comparisons from the live web, cited in every answer.",
      tile: "tile-sky",
      icon: ICONS.search,
      state: "connected",
      detail: search === "tavily" ? "Using Tavily" : search === "brave" ? "Using Brave Search" : "Using DuckDuckGo (free). Add Tavily or Brave for better results",
      setup: { steps: ["Optional: get a free key from tavily.com or Brave Search and add it to .env.local"], env: ["TAVILY_API_KEY", "BRAVE_API_KEY"] },
    },
    {
      id: "whatsapp",
      name: "WhatsApp",
      body: "Updates and approvals on WhatsApp, and send Vardaan a photo of a bill to explain.",
      tile: "tile-leaf",
      icon: ICONS.whatsapp,
      state: "soon",
    },
    {
      id: "calendar",
      name: "Google Calendar",
      body: "Ask what's on your day, check if you're free, and book meetings. Google emails the invites.",
      tile: "tile-amber",
      icon: ICONS.calendar,
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
      body: "\"Any unread emails from my professor?\" Vardaan reads your inbox aloud. Read-only: it never sends or deletes.",
      tile: "tile-rose",
      icon: ICONS.mail,
      state: s?.google?.connected ? "connected" : "available",
      detail: s?.google?.connected ? `Connected as ${s.google.email}` : undefined,
      setup: { steps: ["Comes with the Google Calendar connection: connect Google once in Settings"] },
    },
    {
      id: "sms",
      name: "Text messages",
      body: "Questions, results and approvals by SMS. Sarvam has no SMS yet, so updates show on your dashboard and by email.",
      tile: "tile-teal",
      icon: ICONS.sms,
      state: "soon",
    },
  ];
}

const BADGE: Record<State, { label: string; className: string }> = {
  connected: { label: "Connected", className: "border-[#8fcf3c]/30 bg-[#8fcf3c]/12 text-[#c9e877]" },
  available: { label: "Not set up", className: "border-white/10 bg-white/[0.05] text-ink/60" },
  soon: { label: "Coming soon", className: "border-white/10 bg-white/[0.03] text-ink/45" },
};

export default function Integrations({ status }: { status: IntegrationStatus | null }) {
  const [open, setOpen] = useState<string | null>(null);
  const items = build(status);
  const connected = items.filter((i) => i.state === "connected").length;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-[clamp(26px,3vw,32px)] font-medium leading-[1.15] tracking-[-0.02em] text-ink">Integrations</h1>
        <p className="mt-2 max-w-[640px] text-[14px] leading-[22px] text-ink/55">
          The services Vardaan uses to call, think, search and get things done. {connected} of {items.filter((i) => i.state !== "soon").length} connected.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {items.map((it) => {
          const badge = BADGE[it.state];
          const isOpen = open === it.id;
          return (
            <article
              key={it.id}
              className={`flex flex-col rounded-[18px] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(255,255,255,0.04)_0%,rgba(255,255,255,0.012)_100%)] p-5 ${it.state === "soon" ? "opacity-70" : ""}`}
            >
              <div className="flex items-start justify-between gap-3">
                <span className={`glass-tile ${it.tile} flex h-12 w-12 items-center justify-center rounded-[14px]`}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" aria-hidden className="h-6 w-6">
                    {it.icon}
                  </svg>
                </span>
                <span className={`rounded-full border px-2.5 py-0.5 text-[11px] ${badge.className}`}>{badge.label}</span>
              </div>
              <h2 className="mt-5 text-[16px] font-medium text-ink">{it.name}</h2>
              <p className="mt-1.5 flex-1 text-[13px] leading-[20px] text-ink/55">{it.body}</p>
              {it.detail && <p className="mt-3 text-[12px] text-ink/45">{it.detail}</p>}

              {it.setup && (
                <>
                  <button
                    onClick={() => setOpen(isOpen ? null : it.id)}
                    aria-expanded={isOpen}
                    className="mt-4 h-9 cursor-pointer rounded-[10px] border border-white/[0.1] bg-white/[0.03] text-[13px] text-ink/80 transition hover:border-white/20 hover:text-ink"
                  >
                    {isOpen ? "Hide setup" : it.state === "connected" ? "View setup" : "How to connect"}
                  </button>
                  {isOpen && (
                    <div className="mt-3 space-y-3 rounded-[12px] bg-black/25 p-4">
                      <ol className="space-y-2 text-[13px] leading-[20px] text-ink/70">
                        {it.setup.steps.map((step, k) => (
                          <li key={k} className="flex gap-2.5">
                            <span className="text-ink/40 tabular-nums">{k + 1}.</span>
                            {step}
                          </li>
                        ))}
                      </ol>
                      {it.setup.env && (
                        <div className="flex flex-wrap gap-1.5">
                          {it.setup.env.map((e) => (
                            <code key={e} className="rounded-[6px] bg-white/[0.06] px-2 py-0.5 font-mono text-[11.5px] text-ink/80">
                              {e}
                            </code>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
