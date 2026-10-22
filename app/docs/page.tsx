import type { Metadata } from "next";
import DocsToc from "@/components/DocsToc";
import SectionPage from "@/components/SectionPage";
import { ArchitectureDiagram, CallSequenceDiagram, TaskLifecycleDiagram } from "@/components/docs/Diagrams";

export const metadata: Metadata = {
  title: "Docs",
  description:
    "How Vardaan works: the idea, architecture, call flow, agent, features, setup, configuration, API, security and roadmap.",
  alternates: { canonical: "/docs" },
};

const TOC = [
  { id: "overview", label: "Overview" },
  { id: "modes", label: "Two modes" },
  { id: "architecture", label: "Architecture" },
  { id: "call-flow", label: "Call flow" },
  { id: "lifecycle", label: "Task lifecycle" },
  { id: "agent", label: "The agent" },
  { id: "capabilities", label: "Capabilities" },
  { id: "free", label: "Free vs paid" },
  { id: "limits", label: "Limitations" },
  { id: "setup", label: "Getting started" },
  { id: "config", label: "Configuration" },
  { id: "api", label: "API reference" },
  { id: "data", label: "Data model" },
  { id: "security", label: "Security & privacy" },
  { id: "stack", label: "Tech stack" },
  { id: "roadmap", label: "Roadmap" },
  { id: "principles", label: "Principles" },
];

const num = (id: string) => String(TOC.findIndex((t) => t.id === id) + 1).padStart(2, "0");

const STATUS = {
  live: { label: "Live", tone: "bg-[#8fcf3c]/15 text-[#c9e877]" },
  next: { label: "Next", tone: "bg-[#8ccbff]/15 text-[#b9e0ff]" },
  later: { label: "Later", tone: "bg-white/10 text-ink/70" },
  no: { label: "Not planned", tone: "bg-[#ff5d6e]/15 text-[#ffb4a8]" },
} as const;

type Status = keyof typeof STATUS;

const CAPABILITIES: { name: string; detail: string; status: Status; needs: string }[] = [
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

const TOOLS = [
  { name: "update_plan", does: "Records the step-by-step plan shown as progress on the task.", mode: "Call & Cut" },
  { name: "ask_user", does: "Pauses the task and asks you a question when information is missing.", mode: "Call & Cut" },
  { name: "draft_message", does: "Drafts an email, SMS or WhatsApp message for your approval. Never sends on its own.", mode: "Both" },
  { name: "save_memory", does: "Remembers a lasting fact or preference, like your city or a usual contact.", mode: "Both" },
  { name: "set_reminder", does: "Creates a reminder, with a time if you gave one.", mode: "Both" },
  { name: "finish", does: "Closes the task with a short summary of what was done and what's next.", mode: "Call & Cut" },
];

const FREE = [
  { what: "AI model", free: "Groq or Gemini free tier", paid: "Only at large scale" },
  { what: "Voice on the website", free: "Built into Chrome and Edge", paid: "Never" },
  { what: "Voice notes", free: "Telegram bot", paid: "Never" },
  { what: "Email", free: "Your Gmail", paid: "Never" },
  { what: "WhatsApp and SMS", free: "Opens your own app with the message filled in", paid: "Sending automatically: Twilio or WhatsApp Business" },
  { what: "Phone calls, in or out", free: "Twilio trial credit (about $15, verified numbers only)", paid: "After the trial: a few rupees per minute" },
  { what: "Database and hosting", free: "Vercel and Supabase / Neon free tiers", paid: "Only at large scale" },
];

const SETUP: { title: string; body: string; link?: { href: string; label: string } }[] = [
  { title: "Get a free AI key", body: "Create a Groq account and copy an API key. Google Gemini also works. Both have free tiers.", link: { href: "https://console.groq.com", label: "console.groq.com" } },
  { title: "Add it to the project", body: "In the project folder, create .env.local and add GROQ_API_KEY= followed by your key. Every setting is listed under Configuration." },
  { title: "Start the app", body: "In a terminal in the project folder, run npm run dev, then open localhost:3000/signup and create an account." },
  { title: "Optional: send real email", body: "Turn on two-step verification on your Google account, create an app password, and add it as SMTP_USER and SMTP_PASS.", link: { href: "https://myaccount.google.com/apppasswords", label: "Google app passwords" } },
  { title: "For calls: Twilio", body: "Start a Twilio trial, verify your own number and get a Twilio number. The trial includes free credit.", link: { href: "https://www.twilio.com/try-twilio", label: "twilio.com" } },
  { title: "For local testing: ngrok", body: "Twilio and Telegram need to reach your laptop. A free ngrok account gives localhost a temporary public link.", link: { href: "https://ngrok.com", label: "ngrok.com" } },
];

const CONFIG = [
  { key: "GROQ_API_KEY", req: "One AI key", desc: "Free key from console.groq.com." },
  { key: "GEMINI_API_KEY", req: "One AI key", desc: "Alternative: free key from aistudio.google.com." },
  { key: "LLM_BASE_URL · LLM_MODEL · LLM_API_KEY", req: "Optional", desc: "Any OpenAI-compatible server, for example a local Ollama." },
  { key: "AUTH_SECRET", req: "Production", desc: "Signs login sessions. Generated automatically when running locally." },
  { key: "SMTP_HOST · SMTP_PORT · SMTP_USER · SMTP_PASS · SMTP_FROM", req: "Optional", desc: "Sends approved emails, e.g. Gmail with an app password." },
  { key: "NEXT_PUBLIC_SITE_URL", req: "Production", desc: "Public site address for links, sitemap and social previews." },
];

const API = [
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

const API_NEXT = ["/api/voice/incoming — answer calls to the Vardaan number", "/api/voice/call-me — ring the signed-in user", "/api/telegram/webhook — receive voice notes"];

const DATA = [
  { name: "User", fields: "name, email, password hash, created at" },
  { name: "Task", fields: "request, status, plan steps, question, answers, drafts, summary" },
  { name: "Draft", fields: "channel (email, SMS, WhatsApp), recipient, subject, body, status" },
  { name: "Memory", fields: "one remembered fact per entry, deletable by the user" },
  { name: "Reminder", fields: "title and optional due time" },
];

const SECURITY = [
  { title: "Passwords", body: "Hashed with scrypt and a unique salt per user. Plain passwords are never stored." },
  { title: "Sessions", body: "HttpOnly cookies signed with HMAC-SHA256, valid for 30 days, secure over HTTPS." },
  { title: "Isolation", body: "Every request is checked against the signed-in user, so no one can see or change another person's tasks." },
  { title: "Approval first", body: "The agent can only draft. Sending, booking or spending always needs your explicit approval." },
  { title: "Secrets", body: "API keys live in .env.local on the server, are never sent to the browser and are never committed to git." },
  { title: "Your control", body: "Memories can be deleted at any time. Account deletion and export arrive before launch." },
];

const STACK = [
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

const ROADMAP = [
  { phase: "Now", items: ["Accounts and login", "Voice console: Talk & Help and Call & Cut", "Drafts with approval, memory, reminders", "Real email sending"] },
  { phase: "Next", items: ["Call me and a phone line (Twilio)", "Recognise callers by saved number", "Results and approvals by message", "Telegram voice notes", "Places and directions"] },
  { phase: "Before launch", items: ["Hosted database", "Login secret on Vercel", "Log in link in the navbar", "Privacy policy, data export and deletion"] },
  { phase: "Later", items: ["Google Calendar", "Vardaan calls businesses for you", "Partner integrations for bookings"] },
];

const PRINCIPLES = [
  { title: "Never fake it", body: "If Vardaan can't do something, it says so and does the most useful part instead." },
  { title: "Ask before acting", body: "Nothing is sent, booked or paid without approval. Missing information means a question, not a guess." },
  { title: "Your language, your way", body: "Speak naturally in any language or a mix. Replies come back in the same language." },
  { title: "Your data is yours", body: "Hashed passwords, signed sessions, strict isolation, and memories you can delete." },
];

function Section({ id, title, lead, children }: { id: string; title: string; lead?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <section aria-labelledby={id} className="nav-grid border-t pt-12 first:border-t-0 first:pt-0">
      <p className="text-[12px] tabular-nums tracking-[0.16em] text-mute">{num(id)}</p>
      <h2 id={id} className="mt-2 scroll-mt-24 text-[clamp(26px,3vw,34px)] font-medium tracking-[-0.02em] text-ink">
        {title}
      </h2>
      {lead && <div className="mt-4 max-w-[680px] space-y-4 text-[16px] leading-[27px] text-ink/70">{lead}</div>}
      {children}
    </section>
  );
}

function Table({ head, rows, min = 600 }: { head: string[]; rows: React.ReactNode[][]; min?: number }) {
  return (
    <div className="mt-8 overflow-x-auto">
      <table className="w-full border-collapse text-left text-[14px]" style={{ minWidth: min }}>
        <thead>
          <tr className="text-[12px] uppercase tracking-[0.12em] text-mute">
            {head.map((h) => (
              <th key={h} className="nav-grid border-b pb-3 pr-4 font-normal">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="align-top">
              {r.map((cell, j) => (
                <td key={j} className={`nav-grid border-b py-4 pr-4 ${j === 0 ? "text-ink" : "text-ink/65"}`}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const Code = ({ children }: { children: React.ReactNode }) => (
  <code className="rounded-[6px] bg-white/[0.06] px-1.5 py-0.5 font-mono text-[12.5px] text-ink/90">{children}</code>
);

const Card = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="app-panel p-6">
    <h3 className="text-[17px] font-medium text-ink">{title}</h3>
    <p className="mt-2 text-[14px] leading-[22px] text-ink/65">{children}</p>
  </div>
);

export default function Docs() {
  return (
    <SectionPage
      eyebrow="Docs · Private beta"
      title="How Vardaan works."
      intro="Everything about the product and the system behind it: the idea, architecture, call flow, the agent, setup, configuration, API and roadmap. Written for the team, testers and anyone curious."
      scene="lotus"
    >
      <div className="grid gap-12 lg:grid-cols-[200px_minmax(0,1fr)] lg:gap-16">
        <DocsToc items={TOC} />

        <div className="min-w-0 space-y-16">
          <Section
            id="overview"
            title="Overview"
            lead={
              <>
                <p>
                  Getting things done still means juggling apps, websites and long waits. Vardaan turns a phone call into
                  a personal agent: say what you need in your own language, and it gets done. No apps, no screens, no
                  typing.
                </p>
                <p>
                  It is for people who aren&apos;t comfortable with screens, people short on time, and anyone driving or
                  away from a screen.
                </p>
              </>
            }
          >
            <dl className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
              {[
                ["2", "ways to use it"],
                ["12", "languages for voice"],
                ["6", "agent tools"],
                ["0", "messages sent without approval"],
              ].map(([n, l]) => (
                <div key={l} className="app-panel p-5">
                  <dt className="text-[32px] font-medium tracking-[-0.02em] text-ink">{n}</dt>
                  <dd className="mt-1 text-[13px] text-ink/60">{l}</dd>
                </div>
              ))}
            </dl>
          </Section>

          <Section id="modes" title="Two modes">
            <div className="mt-8 grid gap-4 md:grid-cols-2">
              <Card title="Talk & Help">
                Stay on the line. Ask a question, understand a bill, think through a decision. Vardaan answers out loud,
                straight away.
              </Card>
              <Card title="Call & Cut">
                Say what you need and hang up. Vardaan plans the task, works on it in the background and messages you
                when it is done or needs your yes.
              </Card>
            </div>
          </Section>

          <Section
            id="architecture"
            title="Architecture"
            lead={
              <p>
                One Next.js project holds both the website and the backend. Every channel, whether the web console, a
                phone call or Telegram, reaches the same agent, which plans with the AI model and acts through a small
                set of services.
              </p>
            }
          >
            <ArchitectureDiagram />
          </Section>

          <Section
            id="call-flow"
            title="Call flow"
            lead={
              <p>
                What happens on a call, whether you dial Vardaan or press <em>Call me</em> and it rings you. Vardaan
                recognises you by the number saved on your account, so there is no login on the phone.
              </p>
            }
          >
            <CallSequenceDiagram />
          </Section>

          <Section
            id="lifecycle"
            title="Task lifecycle"
            lead={<p>Call & Cut tasks run in the background. You only step in when Vardaan needs an answer or an approval.</p>}
          >
            <TaskLifecycleDiagram />
          </Section>

          <Section
            id="agent"
            title="The agent"
            lead={
              <p>
                The agent is an AI model with a fixed set of tools. It decides which tools to use, step by step, and
                can never go beyond them. That is what keeps it honest: it can draft, plan and remember, but it cannot
                send or spend on its own.
              </p>
            }
          >
            <Table head={["Tool", "What it does", "Mode"]} rows={TOOLS.map((t) => [<Code key="c">{t.name}</Code>, t.does, t.mode])} />
          </Section>

          <Section id="capabilities" title="Capabilities" lead={<p>Everything marked Live works today on a local setup. Nothing on this list is simulated.</p>}>
            <Table
              head={["Feature", "Status", "Needs"]}
              rows={CAPABILITIES.map((c) => [
                <>
                  <p>{c.name}</p>
                  <p className="mt-1 text-[13px] leading-[20px] text-ink/55">{c.detail}</p>
                </>,
                <span key="s" className={`whitespace-nowrap rounded-full px-2.5 py-0.5 text-[12px] ${STATUS[c.status].tone}`}>
                  {STATUS[c.status].label}
                </span>,
                c.needs,
              ])}
            />
          </Section>

          <Section
            id="free"
            title="Free vs paid"
            lead={
              <p>
                Almost everything runs on free tools. The one thing no provider gives away is a real phone call, in or
                out. Calls start on Twilio&apos;s trial credit, and Telegram voice notes are the free alternative.
              </p>
            }
          >
            <Table head={["Part", "Free option", "When it costs money"]} rows={FREE.map((f) => [f.what, f.free, f.paid])} />
          </Section>

          <Section
            id="limits"
            title="Limitations"
            lead={
              <>
                <p>
                  Ride, food and ticket apps such as Rapido, Uber, Ola and Swiggy don&apos;t offer public booking access.
                  The only workaround is a robot that taps through their app as if it were you, which breaks often, gets
                  stuck on OTPs and payments, and goes against their terms. We won&apos;t fake it. Bookings will come
                  through official partner access, one company at a time.
                </p>
                <p>Until then, Vardaan does the useful part: it finds the details, drafts the message, or tells you exactly what to tap.</p>
              </>
            }
          />

          <Section id="setup" title="Getting started" lead={<p>No coding needed: sign up for the services and copy keys into one file.</p>}>
            <ol className="mt-8 grid gap-4 md:grid-cols-2">
              {SETUP.map((s, i) => (
                <li key={s.title} className="app-panel p-6">
                  <span className="text-[12px] tabular-nums text-mute">Step {i + 1}</span>
                  <h3 className="mt-2 text-[17px] font-medium text-ink">{s.title}</h3>
                  <p className="mt-2 text-[14px] leading-[22px] text-ink/65">{s.body}</p>
                  {s.link && (
                    <a href={s.link.href} target="_blank" rel="noreferrer" className="mt-3 inline-block text-[13px] text-[#b9e0ff] underline underline-offset-2 hover:text-white">
                      {s.link.label}
                    </a>
                  )}
                </li>
              ))}
            </ol>
          </Section>

          <Section id="config" title="Configuration" lead={<p>Settings go in <Code>.env.local</Code> in the project folder. A template with comments is in <Code>.env.example</Code>.</p>}>
            <Table head={["Setting", "Required", "Purpose"]} min={680} rows={CONFIG.map((c) => [<Code key="c">{c.key}</Code>, c.req, c.desc])} />
          </Section>

          <Section id="api" title="API reference" lead={<p>All routes except signup, login and the waitlist require a signed-in session.</p>}>
            <Table
              head={["Method", "Route", "Description"]}
              min={640}
              rows={API.map((a) => [
                <span key="m" className="font-mono text-[12.5px] text-[#b9e0ff]">
                  {a.method}
                </span>,
                <Code key="p">{a.path}</Code>,
                a.desc,
              ])}
            />
            <p className="mt-6 text-[14px] text-ink/60">Coming with the phone line and Telegram:</p>
            <ul className="mt-2 space-y-1.5 text-[14px] text-ink/60">
              {API_NEXT.map((a) => (
                <li key={a}>
                  <Code>{a.split(" — ")[0]}</Code> — {a.split(" — ")[1]}
                </li>
              ))}
            </ul>
          </Section>

          <Section id="data" title="Data model" lead={<p>Stored in a local file for development, moving to a hosted database before launch.</p>}>
            <Table head={["Record", "Fields"]} min={520} rows={DATA.map((d) => [d.name, d.fields])} />
          </Section>

          <Section id="security" title="Security & privacy">
            <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {SECURITY.map((s) => (
                <Card key={s.title} title={s.title}>
                  {s.body}
                </Card>
              ))}
            </div>
          </Section>

          <Section id="stack" title="Tech stack">
            <Table head={["Area", "Tool", "Cost"]} rows={STACK.map((s) => [s.area, s.tool, s.cost])} />
          </Section>

          <Section id="roadmap" title="Roadmap">
            <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {ROADMAP.map((r) => (
                <div key={r.phase} className="app-panel p-6">
                  <h3 className="text-[13px] uppercase tracking-[0.14em] text-mute">{r.phase}</h3>
                  <ul className="mt-4 space-y-2.5 text-[14px] leading-[21px] text-ink/75">
                    {r.items.map((item) => (
                      <li key={item} className="flex gap-2">
                        <span aria-hidden="true" className="text-ink/35">
                          ·
                        </span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </Section>

          <Section id="principles" title="Principles">
            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {PRINCIPLES.map((p) => (
                <Card key={p.title} title={p.title}>
                  {p.body}
                </Card>
              ))}
            </div>
          </Section>
        </div>
      </div>
    </SectionPage>
  );
}
