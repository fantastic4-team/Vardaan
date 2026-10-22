// Single source for the docs: the /docs page renders it, and /docs.md and the "Copy as Markdown"
// button turn the same content into Markdown, so the two never drift apart.

export type IconName =
  | "overview" | "modes" | "architecture" | "callflow" | "lifecycle" | "agent" | "capabilities" | "free"
  | "limits" | "setup" | "config" | "api" | "data" | "security" | "stack" | "roadmap" | "principles"
  | "talk" | "cut" | "key" | "terminal" | "play" | "mail" | "phone" | "tunnel" | "lock" | "cookie"
  | "users" | "check" | "eye" | "trash" | "compass" | "language" | "heart";

export const TOC: { id: string; label: string; icon: IconName }[] = [
  { id: "overview", label: "Overview", icon: "overview" },
  { id: "modes", label: "Two modes", icon: "modes" },
  { id: "architecture", label: "Architecture", icon: "architecture" },
  { id: "call-flow", label: "Call flow", icon: "callflow" },
  { id: "lifecycle", label: "Task lifecycle", icon: "lifecycle" },
  { id: "agent", label: "The agent", icon: "agent" },
  { id: "capabilities", label: "Capabilities", icon: "capabilities" },
  { id: "free", label: "Free vs paid", icon: "free" },
  { id: "limits", label: "Limitations", icon: "limits" },
  { id: "setup", label: "Getting started", icon: "setup" },
  { id: "config", label: "Configuration", icon: "config" },
  { id: "api", label: "API reference", icon: "api" },
  { id: "data", label: "Data model", icon: "data" },
  { id: "security", label: "Security & privacy", icon: "security" },
  { id: "stack", label: "Tech stack", icon: "stack" },
  { id: "roadmap", label: "Roadmap", icon: "roadmap" },
  { id: "principles", label: "Principles", icon: "principles" },
];

export const INTRO =
  "Everything about the product and the system behind it: the idea, architecture, call flow, the agent, setup, configuration, API and roadmap. Written for the team, testers and anyone curious.";

export const OVERVIEW = [
  "Getting things done still means juggling apps, websites and long waits. Vardaan turns a phone call into a personal agent: say what you need in your own language, and it gets done. No apps, no screens, no typing.",
  "It is for people who aren't comfortable with screens, people short on time, and anyone driving or away from a screen.",
];

export const STATS = [
  { value: "2", label: "ways to use it" },
  { value: "12", label: "languages for voice" },
  { value: "6", label: "agent tools" },
  { value: "0", label: "messages sent without approval" },
];

export const MODES: { title: string; body: string; icon: IconName }[] = [
  { title: "Talk & Help", icon: "talk", body: "Stay on the line. Ask a question, understand a bill, think through a decision. Vardaan answers out loud, straight away." },
  { title: "Call & Cut", icon: "cut", body: "Say what you need and hang up. Vardaan plans the task, works on it in the background and messages you when it is done or needs your yes." },
];

export const ARCHITECTURE_TEXT =
  "One Next.js project holds both the website and the backend. Every channel, whether the web console, a phone call or Telegram, reaches the same agent, which plans with the AI model and acts through a small set of services.";

export const CALL_FLOW_TEXT =
  "What happens on a call, whether you dial Vardaan or press Call me and it rings you. Vardaan recognises you by the number saved on your account, so there is no login on the phone.";

export const LIFECYCLE_TEXT = "Call & Cut tasks run in the background. You only step in when Vardaan needs an answer or an approval.";

export const AGENT_TEXT =
  "The agent is an AI model with a fixed set of tools. It decides which tools to use, step by step, and can never go beyond them. That is what keeps it honest: it can draft, plan and remember, but it cannot send or spend on its own.";

export const TOOLS = [
  { name: "update_plan", does: "Records the step-by-step plan shown as progress on the task.", mode: "Call & Cut" },
  { name: "ask_user", does: "Pauses the task and asks you a question when information is missing.", mode: "Call & Cut" },
  { name: "draft_message", does: "Drafts an email, SMS or WhatsApp message for your approval. Never sends on its own.", mode: "Both" },
  { name: "save_memory", does: "Remembers a lasting fact or preference, like your city or a usual contact.", mode: "Both" },
  { name: "set_reminder", does: "Creates a reminder, with a time if you gave one.", mode: "Both" },
  { name: "finish", does: "Closes the task with a short summary of what was done and what's next.", mode: "Call & Cut" },
];

export const STATUS = {
  live: { label: "Live", tone: "bg-[#8fcf3c]/15 text-[#c9e877]" },
  next: { label: "Next", tone: "bg-[#8ccbff]/15 text-[#b9e0ff]" },
  later: { label: "Later", tone: "bg-white/10 text-ink/70" },
  no: { label: "Not planned", tone: "bg-[#ff5d6e]/15 text-[#ffb4a8]" },
} as const;

export type Status = keyof typeof STATUS;

export const CAPABILITIES: { name: string; detail: string; status: Status; needs: string }[] = [
  { name: "Accounts", detail: "Sign up, log in, stay signed in for 30 days.", status: "live", needs: "Nothing" },
  { name: "Talk in your own language", detail: "Speak in the browser and hear the reply, in 12 Indian and English languages.", status: "live", needs: "Chrome or Edge" },
  { name: "Call & Cut tasks", detail: "Hand off a task; it plans, works in the background and asks if something is missing.", status: "live", needs: "Free AI key" },
  { name: "Drafts with approval", detail: "Email, SMS and WhatsApp drafts you can edit, approve or discard.", status: "live", needs: "Free AI key" },
  { name: "Send email for real", detail: "Approved emails go out from your own Gmail.", status: "live", needs: "Gmail app password" },
  { name: "Memory and reminders", detail: "Remembers what you tell it; you can make it forget.", status: "live", needs: "Free AI key" },
  { name: "Call me", detail: "Press a button and Vardaan rings your phone; talk, or hang up and let it work.", status: "next", needs: "Twilio trial" },
  { name: "Phone line", detail: "Call a real number; it answers, recognises you by caller ID and talks back.", status: "next", needs: "Twilio or Exotel" },
  { name: "Results by message", detail: "Results and approvals by SMS or WhatsApp; reply YES to approve.", status: "next", needs: "Twilio" },
  { name: "Telegram voice notes", detail: "Send a voice note, get the result as a message. The free alternative to calls.", status: "next", needs: "Free Telegram bot" },
  { name: "Places and directions", detail: "Nearest metro, hospital or ATM, with distance and directions.", status: "next", needs: "Free map data" },
  { name: "Calendar", detail: "Add and move events in Google Calendar.", status: "later", needs: "Google sign-in" },
  { name: "Call a business for you", detail: "Vardaan phones a shop or office and speaks on your behalf.", status: "later", needs: "Twilio" },
  { name: "Book rides and food", detail: "Rapido, Uber, Ola, Swiggy and similar apps.", status: "no", needs: "A partnership with each company" },
];

export const FREE_TEXT =
  "Almost everything runs on free tools. The one thing no provider gives away is a real phone call, in or out. Calls start on Twilio's trial credit, and Telegram voice notes are the free alternative.";

export const FREE = [
  { what: "AI model", free: "Groq or Gemini free tier", paid: "Only at large scale" },
  { what: "Voice on the website", free: "Built into Chrome and Edge", paid: "Never" },
  { what: "Voice notes", free: "Telegram bot", paid: "Never" },
  { what: "Email", free: "Your Gmail", paid: "Never" },
  { what: "WhatsApp and SMS", free: "Opens your own app with the message filled in", paid: "Sending automatically: Twilio or WhatsApp Business" },
  { what: "Phone calls, in or out", free: "Twilio trial credit (about $15, verified numbers only)", paid: "After the trial: a few rupees per minute" },
  { what: "Database and hosting", free: "Vercel and Supabase / Neon free tiers", paid: "Only at large scale" },
];

export const LIMITS = [
  "Ride, food and ticket apps such as Rapido, Uber, Ola and Swiggy don't offer public booking access. The only workaround is a robot that taps through their app as if it were you, which breaks often, gets stuck on OTPs and payments, and goes against their terms. We won't fake it. Bookings will come through official partner access, one company at a time.",
  "Until then, Vardaan does the useful part: it finds the details, drafts the message, or tells you exactly what to tap.",
];

export const SETUP: { title: string; body: string; icon: IconName; link?: { href: string; label: string } }[] = [
  { title: "Get a free AI key", icon: "key", body: "Create a Groq account and copy an API key. Google Gemini also works. Both have free tiers.", link: { href: "https://console.groq.com", label: "console.groq.com" } },
  { title: "Add it to the project", icon: "terminal", body: "In the project folder, create .env.local and add GROQ_API_KEY= followed by your key. Every setting is listed under Configuration." },
  { title: "Start the app", icon: "play", body: "In a terminal in the project folder, run npm run dev, then open localhost:3000/signup and create an account." },
  { title: "Optional: send real email", icon: "mail", body: "Turn on two-step verification on your Google account, create an app password, and add it as SMTP_USER and SMTP_PASS.", link: { href: "https://myaccount.google.com/apppasswords", label: "Google app passwords" } },
  { title: "For calls: Twilio", icon: "phone", body: "Start a Twilio trial, verify your own number and get a Twilio number. The trial includes free credit.", link: { href: "https://www.twilio.com/try-twilio", label: "twilio.com" } },
  { title: "For local testing: ngrok", icon: "tunnel", body: "Twilio and Telegram need to reach your laptop. A free ngrok account gives localhost a temporary public link.", link: { href: "https://ngrok.com", label: "ngrok.com" } },
];

export const CONFIG = [
  { key: "GROQ_API_KEY", req: "One AI key", desc: "Free key from console.groq.com." },
  { key: "GEMINI_API_KEY", req: "One AI key", desc: "Alternative: free key from aistudio.google.com." },
  { key: "LLM_BASE_URL · LLM_MODEL · LLM_API_KEY", req: "Optional", desc: "Any OpenAI-compatible server, for example a local Ollama." },
  { key: "AUTH_SECRET", req: "Production", desc: "Signs login sessions. Generated automatically when running locally." },
  { key: "SMTP_HOST · SMTP_PORT · SMTP_USER · SMTP_PASS · SMTP_FROM", req: "Optional", desc: "Sends approved emails, e.g. Gmail with an app password." },
  { key: "NEXT_PUBLIC_SITE_URL", req: "Production", desc: "Public site address for links, sitemap and social previews." },
];

export const API = [
  { method: "POST", path: "/api/auth/signup", desc: "Create an account and start a session." },
  { method: "POST", path: "/api/auth/login", desc: "Log in with email and password." },
  { method: "POST", path: "/api/auth/logout", desc: "End the session." },
  { method: "POST", path: "/api/agent/talk", desc: "Talk & Help: send the conversation, get a reply." },
  { method: "GET", path: "/api/tasks", desc: "Your tasks, memories and reminders." },
  { method: "POST", path: "/api/tasks", desc: "Call & Cut: hand off a task; it runs in the background." },
  { method: "POST", path: "/api/tasks/:id/answer", desc: "Answer the agent's question; the task resumes." },
  { method: "POST", path: "/api/tasks/:id/drafts/:draftId", desc: "Approve (optionally edited) or discard a draft." },
  { method: "DELETE", path: "/api/memories/:id", desc: "Make Vardaan forget something." },
  { method: "POST", path: "/api/waitlist", desc: "Join the beta waitlist." },
];

export const API_NEXT = [
  { path: "/api/voice/incoming", desc: "answer calls to the Vardaan number" },
  { path: "/api/voice/call-me", desc: "ring the signed-in user" },
  { path: "/api/telegram/webhook", desc: "receive voice notes" },
];

export const DATA = [
  { name: "User", fields: "name, email, password hash, created at" },
  { name: "Task", fields: "request, status, plan steps, question, answers, drafts, summary" },
  { name: "Draft", fields: "channel (email, SMS, WhatsApp), recipient, subject, body, status" },
  { name: "Memory", fields: "one remembered fact per entry, deletable by the user" },
  { name: "Reminder", fields: "title and optional due time" },
];

export const SECURITY: { title: string; body: string; icon: IconName }[] = [
  { title: "Passwords", icon: "lock", body: "Hashed with scrypt and a unique salt per user. Plain passwords are never stored." },
  { title: "Sessions", icon: "cookie", body: "HttpOnly cookies signed with HMAC-SHA256, valid for 30 days, secure over HTTPS." },
  { title: "Isolation", icon: "users", body: "Every request is checked against the signed-in user, so no one can see or change another person's tasks." },
  { title: "Approval first", icon: "check", body: "The agent can only draft. Sending, booking or spending always needs your explicit approval." },
  { title: "Secrets", icon: "eye", body: "API keys live in .env.local on the server, are never sent to the browser and are never committed to git." },
  { title: "Your control", icon: "trash", body: "Memories can be deleted at any time. Account deletion and export arrive before launch." },
];

export const STACK = [
  { area: "Website and backend", tool: "Next.js 15 (React 19, TypeScript) in one project", cost: "Free" },
  { area: "Hosting", tool: "Vercel", cost: "Free tier" },
  { area: "AI model", tool: "Groq or Google Gemini, any OpenAI-compatible model", cost: "Free tier" },
  { area: "Voice in the browser", tool: "Web Speech API (speech to text and text to speech)", cost: "Free" },
  { area: "Voice notes", tool: "Telegram Bot API, transcribed with Groq Whisper", cost: "Free" },
  { area: "Phone calls and SMS", tool: "Twilio, or Exotel for Indian numbers", cost: "Trial credit, then pay per use" },
  { area: "Email", tool: "Gmail over SMTP (Nodemailer)", cost: "Free" },
  { area: "Database", tool: "Local file today; Supabase, Neon or Turso before launch", cost: "Free tier" },
  { area: "Maps", tool: "OpenStreetMap", cost: "Free" },
];

export const ROADMAP = [
  { phase: "Now", items: ["Accounts and login", "Voice console: Talk & Help and Call & Cut", "Drafts with approval, memory, reminders", "Real email sending"] },
  { phase: "Next", items: ["Call me and a phone line (Twilio)", "Recognise callers by saved number", "Results and approvals by message", "Telegram voice notes", "Places and directions"] },
  { phase: "Before launch", items: ["Hosted database", "Login secret on Vercel", "Log in link in the navbar", "Privacy policy, data export and deletion"] },
  { phase: "Later", items: ["Google Calendar", "Vardaan calls businesses for you", "Partner integrations for bookings"] },
];

export const PRINCIPLES: { title: string; body: string; icon: IconName }[] = [
  { title: "Never fake it", icon: "compass", body: "If Vardaan can't do something, it says so and does the most useful part instead." },
  { title: "Ask before acting", icon: "check", body: "Nothing is sent, booked or paid without approval. Missing information means a question, not a guess." },
  { title: "Your language, your way", icon: "language", body: "Speak naturally in any language or a mix. Replies come back in the same language." },
  { title: "Your data is yours", icon: "heart", body: "Hashed passwords, signed sessions, strict isolation, and memories you can delete." },
];

// ---------------------------------------------------------------------------------------------
// Markdown

const row = (cells: string[]) => `| ${cells.map((c) => c.replace(/\|/g, "\\|")).join(" | ")} |`;
const table = (head: string[], rows: string[][]) => [row(head), row(head.map(() => "---")), ...rows.map(row)].join("\n");

const MERMAID_ARCH = `\`\`\`mermaid
flowchart LR
  subgraph Channels
    W[Web console]
    P[Phone call]
    T[Telegram]
  end
  subgraph Backend["Vardaan backend (Next.js)"]
    R[API routes] --> A[Agent] --> Q[Task runner]
  end
  subgraph Services
    M[AI model]
    D[(Database)]
    E[Email]
    S[SMS & WhatsApp]
  end
  W --> R
  P --> R
  T --> R
  A --> M
  A --> D
  A --> E
  A --> S
\`\`\``;

const MERMAID_FLOW = `\`\`\`mermaid
sequenceDiagram
  participant You
  participant Twilio
  participant Vardaan
  participant AI as AI model
  You->>Twilio: Calls, or presses "Call me"
  Twilio->>Vardaan: Caller ID + your speech as text
  Vardaan->>AI: Request + memory + tools
  AI-->>Vardaan: Reply, or a plan
  Vardaan-->>Twilio: Text to speak
  Twilio-->>You: You hear the answer
  You->>Twilio: You hang up (Call & Cut)
  Note over Vardaan: Works in the background
  Vardaan-->>You: SMS: "Done" or "Approve? Reply YES"
\`\`\``;

const MERMAID_LIFECYCLE = `\`\`\`mermaid
stateDiagram-v2
  [*] --> Planning
  Planning --> Working
  Working --> NeedsAnswer: missing info
  NeedsAnswer --> Planning: you reply
  Working --> NeedsApproval: draft ready
  NeedsApproval --> Done: you approve
  Working --> Done: nothing to approve
  Working --> Failed: error
  Done --> [*]
\`\`\``;

export function docsMarkdown(siteUrl = "") {
  const h = (id: string) => {
    const i = TOC.findIndex((t) => t.id === id);
    return `## ${String(i + 1).padStart(2, "0")}. ${TOC[i].label}`;
  };
  return [
    "# How Vardaan works",
    "",
    `> ${INTRO}`,
    "",
    siteUrl ? `Online version: ${siteUrl}/docs` : "",
    "",
    "## Contents",
    "",
    // GitHub's heading anchors: lowercase, drop punctuation other than hyphens and spaces, spaces to hyphens.
    ...TOC.map((t, i) => {
      const anchor = `${String(i + 1).padStart(2, "0")}. ${t.label}`.toLowerCase().replace(/[^a-z0-9 -]/g, "").replace(/ /g, "-");
      return `${i + 1}. [${t.label}](#${anchor})`;
    }),
    "",
    h("overview"),
    "",
    ...OVERVIEW.flatMap((p) => [p, ""]),
    table(["", ""], STATS.map((s) => [`**${s.value}**`, s.label])),
    "",
    h("modes"),
    "",
    ...MODES.flatMap((m) => [`**${m.title}.** ${m.body}`, ""]),
    h("architecture"),
    "",
    ARCHITECTURE_TEXT,
    "",
    MERMAID_ARCH,
    "",
    h("call-flow"),
    "",
    CALL_FLOW_TEXT,
    "",
    MERMAID_FLOW,
    "",
    h("lifecycle"),
    "",
    LIFECYCLE_TEXT,
    "",
    MERMAID_LIFECYCLE,
    "",
    h("agent"),
    "",
    AGENT_TEXT,
    "",
    table(["Tool", "What it does", "Mode"], TOOLS.map((t) => [`\`${t.name}\``, t.does, t.mode])),
    "",
    h("capabilities"),
    "",
    "Everything marked Live works today on a local setup. Nothing on this list is simulated.",
    "",
    table(["Feature", "Status", "Needs"], CAPABILITIES.map((c) => [`**${c.name}** — ${c.detail}`, STATUS[c.status].label, c.needs])),
    "",
    h("free"),
    "",
    FREE_TEXT,
    "",
    table(["Part", "Free option", "When it costs money"], FREE.map((f) => [f.what, f.free, f.paid])),
    "",
    h("limits"),
    "",
    ...LIMITS.flatMap((p) => [p, ""]),
    h("setup"),
    "",
    "No coding needed: sign up for the services and copy keys into one file.",
    "",
    ...SETUP.map((s, i) => `${i + 1}. **${s.title}.** ${s.body}${s.link ? ` ([${s.link.label}](${s.link.href}))` : ""}`),
    "",
    h("config"),
    "",
    "Settings go in `.env.local` in the project folder. A template with comments is in `.env.example`.",
    "",
    table(["Setting", "Required", "Purpose"], CONFIG.map((c) => [`\`${c.key}\``, c.req, c.desc])),
    "",
    h("api"),
    "",
    "All routes except signup, login and the waitlist require a signed-in session.",
    "",
    table(["Method", "Route", "Description"], API.map((a) => [`\`${a.method}\``, `\`${a.path}\``, a.desc])),
    "",
    "Coming with the phone line and Telegram:",
    "",
    ...API_NEXT.map((a) => `- \`${a.path}\` — ${a.desc}`),
    "",
    h("data"),
    "",
    "Stored in a local file for development, moving to a hosted database before launch.",
    "",
    table(["Record", "Fields"], DATA.map((d) => [d.name, d.fields])),
    "",
    h("security"),
    "",
    ...SECURITY.map((s) => `- **${s.title}.** ${s.body}`),
    "",
    h("stack"),
    "",
    table(["Area", "Tool", "Cost"], STACK.map((s) => [s.area, s.tool, s.cost])),
    "",
    h("roadmap"),
    "",
    ...ROADMAP.flatMap((r) => [`**${r.phase}**`, "", ...r.items.map((i) => `- ${i}`), ""]),
    h("principles"),
    "",
    ...PRINCIPLES.map((p) => `- **${p.title}.** ${p.body}`),
    "",
  ]
    .filter((line, i, all) => !(line === "" && all[i - 1] === ""))
    .join("\n");
}
