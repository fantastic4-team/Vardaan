import type { Metadata } from "next";
import SectionPage from "@/components/SectionPage";

export const metadata: Metadata = {
  title: "Docs",
  description: "How Vardaan works: the idea, the architecture, what is live today, how to set it up and what comes next.",
  alternates: { canonical: "/docs" },
};

const TOC = [
  { id: "idea", label: "The idea" },
  { id: "modes", label: "Two ways to use it" },
  { id: "architecture", label: "How it connects" },
  { id: "call-flow", label: "A call, step by step" },
  { id: "capabilities", label: "What it can do" },
  { id: "free", label: "Free vs paid" },
  { id: "limits", label: "What it can't do yet" },
  { id: "setup", label: "Setting it up" },
  { id: "stack", label: "Tools we use" },
  { id: "roadmap", label: "Roadmap" },
  { id: "principles", label: "Principles" },
];

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
  { name: "Telegram voice notes", detail: "Send a voice note to the Vardaan bot and hang up; it does the task and messages you back. The free alternative to a phone line.", status: "next", needs: "Free Telegram bot" },
  { name: "Phone line", detail: "Call a real number; it answers, listens and talks back.", status: "next", needs: "Twilio or Exotel" },
  { name: "Hang up, get a message", detail: "Results and approvals by SMS or WhatsApp; reply YES to approve.", status: "next", needs: "Twilio" },
  { name: "Call me button", detail: "Press a button on the website and Vardaan rings you.", status: "next", needs: "Twilio" },
  { name: "Places and directions", detail: "Nearest metro, hospital, ATM, with distance and directions.", status: "next", needs: "Free map data" },
  { name: "Calendar", detail: "Add and move events in your Google Calendar.", status: "later", needs: "Google sign-in" },
  { name: "Call a business for you", detail: "Vardaan phones a shop or office and speaks on your behalf.", status: "later", needs: "Twilio" },
  { name: "Book rides and food", detail: "Rapido, Uber, Ola, Swiggy and similar apps.", status: "no", needs: "A partnership with each company" },
];

const FREE = [
  { what: "AI model", free: "Groq or Gemini free tier", paid: "Only at large scale" },
  { what: "Voice on the website", free: "Built into Chrome and Edge", paid: "Never" },
  { what: "Voice by message", free: "Telegram bot with voice notes", paid: "Never" },
  { what: "Email", free: "Your Gmail", paid: "Never" },
  { what: "WhatsApp and SMS", free: "Opens your own app with the message filled in", paid: "Sending automatically: Twilio or WhatsApp Business" },
  { what: "Phone calls", free: "Twilio trial credit (about $15, calls to your verified number only)", paid: "After the trial: a few rupees per minute" },
  { what: "Database and hosting", free: "Vercel and Supabase / Neon free tiers", paid: "Only at large scale" },
];

const SETUP: { title: string; body: string; link?: { href: string; label: string } }[] = [
  {
    title: "Get a free AI key",
    body: "Create a Groq account and copy an API key. Google Gemini also works. This is the agent's brain and both have free tiers.",
    link: { href: "https://console.groq.com", label: "console.groq.com" },
  },
  {
    title: "Add it to the project",
    body: "In the project folder, create a file called .env.local and add one line: GROQ_API_KEY= followed by your key. Every setting is explained in .env.example.",
  },
  {
    title: "Start the app",
    body: "In a terminal opened in the project folder, run npm run dev, then open localhost:3000/signup and create an account.",
  },
  {
    title: "Optional: send real email",
    body: "Turn on two-step verification on your Google account, create an app password, and add it as SMTP_USER and SMTP_PASS.",
    link: { href: "https://myaccount.google.com/apppasswords", label: "Google app passwords" },
  },
  {
    title: "Free option: a Telegram bot",
    body: "In Telegram, message @BotFather, choose /newbot and copy the token. Users send voice notes to the bot instead of calling. Completely free.",
    link: { href: "https://t.me/BotFather", label: "@BotFather" },
  },
  {
    title: "For a phone line: Twilio",
    body: "Start a Twilio trial, verify your own number and get a Twilio number. The trial includes free credit; after that calls cost a few rupees a minute.",
    link: { href: "https://www.twilio.com/try-twilio", label: "twilio.com" },
  },
  {
    title: "For testing calls locally: ngrok",
    body: "Twilio and Telegram need to reach your laptop over the internet. A free ngrok account gives localhost a temporary public link while you test.",
    link: { href: "https://ngrok.com", label: "ngrok.com" },
  },
];

const STACK = [
  { area: "Website and backend", tool: "Next.js (React) in one project", cost: "Free" },
  { area: "Hosting", tool: "Vercel", cost: "Free tier" },
  { area: "AI model", tool: "Groq or Google Gemini, any OpenAI-compatible model", cost: "Free tier" },
  { area: "Voice in the browser", tool: "Web Speech API (speech to text and text to speech)", cost: "Free" },
  { area: "Voice notes", tool: "Telegram Bot API, transcribed with Groq Whisper", cost: "Free" },
  { area: "Phone calls and SMS", tool: "Twilio, or Exotel for Indian numbers", cost: "Trial credit, then pay per use" },
  { area: "WhatsApp", tool: "Click-to-chat links today; WhatsApp Business API later", cost: "Free today" },
  { area: "Email", tool: "Gmail over SMTP", cost: "Free" },
  { area: "Database", tool: "Local file today; Supabase, Neon or Turso before launch", cost: "Free tier" },
  { area: "Maps", tool: "OpenStreetMap", cost: "Free" },
];

const ROADMAP = [
  { phase: "Now", items: ["Accounts and login", "Voice console with Talk & Help and Call & Cut", "Drafts with approval, memory, reminders", "Real email sending"] },
  { phase: "Next", items: ["Telegram bot with voice notes (free)", "Phone line on a real number", "Results and approvals by message", "Call me button", "Places and directions"] },
  { phase: "Before launch", items: ["Move data to a hosted database", "Set the login secret on Vercel", "Log in link in the navbar", "Privacy policy and data deletion"] },
  { phase: "Later", items: ["Google Calendar", "Vardaan calls businesses for you", "Partner integrations for bookings"] },
];

const PRINCIPLES = [
  { title: "Never fake it", body: "If Vardaan can't do something, it says so and does the most useful part instead, like drafting the message or listing the steps." },
  { title: "Ask before acting", body: "Nothing is sent, booked or paid without the user's approval. When information is missing, it asks rather than guesses." },
  { title: "Your language, your way", body: "Speak naturally in any language or a mix. Replies come back in the same language." },
  { title: "Your data is yours", body: "Passwords are hashed, sessions are signed, every user sees only their own tasks, and memories can be deleted." },
];

function H2({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="scroll-mt-24 text-[clamp(26px,3vw,34px)] font-medium tracking-[-0.02em] text-ink">
      {children}
    </h2>
  );
}

const P = ({ children }: { children: React.ReactNode }) => (
  <p className="mt-4 max-w-[680px] text-[16px] leading-[27px] text-ink/70">{children}</p>
);

function Table({ head, rows }: { head: string[]; rows: React.ReactNode[][] }) {
  return (
    <div className="mt-8 overflow-x-auto">
      <table className="w-full min-w-[600px] border-collapse text-left text-[14px]">
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

export default function Docs() {
  return (
    <SectionPage
      eyebrow="Docs"
      title="How Vardaan works."
      intro="The idea, how the pieces connect, what works today, how to set it up and where it goes next. Written for the team, testers and anyone curious."
      scene="lotus"
    >
      <div className="grid gap-12 lg:grid-cols-[200px_minmax(0,1fr)] lg:gap-16">
        <nav aria-label="On this page" className="lg:sticky lg:top-8 lg:self-start">
          <p className="text-[12px] uppercase tracking-[0.16em] text-mute">On this page</p>
          <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-[14px] lg:block lg:space-y-2.5">
            {TOC.map((t) => (
              <li key={t.id}>
                <a href={`#${t.id}`} className="text-ink/65 transition hover:text-ink">
                  {t.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="min-w-0 space-y-20">
          <section>
            <H2 id="idea">The idea</H2>
            <P>
              Getting things done still means juggling apps, websites and long waits. Vardaan turns a phone call into a
              personal agent: you say what you need in your own language, and it gets done. No apps, no screens, no
              typing.
            </P>
            <P>
              It is built for people who aren&apos;t comfortable with screens, people who are busy, and anyone who is
              driving or away from a screen.
            </P>
          </section>

          <section>
            <H2 id="modes">Two ways to use it</H2>
            <div className="mt-8 grid gap-4 md:grid-cols-2">
              <div className="app-panel p-7">
                <h3 className="text-[20px] font-medium text-ink">Talk &amp; Help</h3>
                <p className="mt-3 text-[15px] leading-[24px] text-ink/65">
                  Stay on the line. Ask a question, understand a bill, think through a decision. Vardaan answers out
                  loud, straight away.
                </p>
              </div>
              <div className="app-panel p-7">
                <h3 className="text-[20px] font-medium text-ink">Call &amp; Cut</h3>
                <p className="mt-3 text-[15px] leading-[24px] text-ink/65">
                  Say what you need and hang up. Vardaan plans the task, works on it in the background, and messages
                  you when it is done or needs your yes.
                </p>
              </div>
            </div>
          </section>

          <section>
            <H2 id="architecture">How it connects</H2>
            <P>
              The website and the backend live in one Next.js project. The backend talks to the AI model, stores
              accounts and tasks, and, with a phone or messaging provider, answers calls and sends messages.
            </P>
            <div className="app-panel mt-8 overflow-x-auto p-6">
              <ol className="flex min-w-[640px] items-center justify-between gap-3 text-center text-[13px]">
                {["Phone, Telegram or browser", "Twilio or Telegram", "Vardaan backend", "AI model"].map((step, i, all) => (
                  <li key={step} className="flex flex-1 items-center gap-3">
                    <span className="flex-1 rounded-[12px] border border-white/12 bg-white/[0.04] px-3 py-4 text-ink">{step}</span>
                    {i < all.length - 1 && (
                      <span aria-hidden="true" className="text-ink/40">
                        →
                      </span>
                    )}
                  </li>
                ))}
              </ol>
              <p className="mt-5 text-center text-[13px] text-ink/55">
                Results go back to you as a message, and every task also appears in your web console.
              </p>
            </div>
          </section>

          <section>
            <H2 id="call-flow">A call, step by step</H2>
            <ol className="mt-8 space-y-4">
              {[
                "You call the Vardaan number, or send a voice note to the Vardaan bot, from the phone saved on your account.",
                "Vardaan recognises you by your number, so there is no login on the phone.",
                "You say what you need. Your voice is turned into text and sent to the AI.",
                "Stay on the line and Vardaan replies out loud, or hang up and it becomes a background task.",
                "The task is planned step by step. If something is missing, Vardaan messages you a question.",
                "Anything that sends, books or spends needs your approval. Reply YES, or approve on the website.",
                "When it is done, you get a message with the result.",
              ].map((s, i) => (
                <li key={s} className="flex gap-4">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/[0.08] text-[12px] tabular-nums text-ink/80">
                    {i + 1}
                  </span>
                  <p className="pt-0.5 text-[16px] leading-[26px] text-ink/75">{s}</p>
                </li>
              ))}
            </ol>
          </section>

          <section>
            <H2 id="capabilities">What it can do</H2>
            <P>Everything marked Live works today on a local setup. Nothing on this list is simulated.</P>
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
          </section>

          <section>
            <H2 id="free">Free vs paid</H2>
            <P>
              Almost everything runs on free tools. The one thing no provider gives away is a real phone line, so the
              free path uses Telegram voice notes instead, and the phone line starts on Twilio&apos;s trial credit.
            </P>
            <Table head={["Part", "Free option", "When it costs money"]} rows={FREE.map((f) => [f.what, f.free, f.paid])} />
          </section>

          <section>
            <H2 id="limits">What it can&apos;t do yet</H2>
            <P>
              Ride, food and ticket apps such as Rapido, Uber, Ola and Swiggy don&apos;t offer public booking access. The
              only workaround is a robot that taps through their app as if it were you, which breaks often, gets stuck
              on OTPs and payments, and goes against their terms. We won&apos;t fake it. Bookings come through official
              partner access, one company at a time.
            </P>
            <P>
              Until then, Vardaan does the useful part honestly: it finds the details, drafts the message, or tells you
              exactly what to tap.
            </P>
          </section>

          <section>
            <H2 id="setup">Setting it up</H2>
            <P>No coding needed, only sign-ups and copying keys into one file.</P>
            <ol className="mt-8 grid gap-4 md:grid-cols-2">
              {SETUP.map((s, i) => (
                <li key={s.title} className="app-panel p-6">
                  <span className="text-[12px] tabular-nums text-mute">Step {i + 1}</span>
                  <h3 className="mt-2 text-[18px] font-medium text-ink">{s.title}</h3>
                  <p className="mt-2 text-[14px] leading-[22px] text-ink/65">{s.body}</p>
                  {s.link && (
                    <a
                      href={s.link.href}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 inline-block text-[13px] text-[#b9e0ff] underline underline-offset-2 hover:text-white"
                    >
                      {s.link.label}
                    </a>
                  )}
                </li>
              ))}
            </ol>
          </section>

          <section>
            <H2 id="stack">Tools we use</H2>
            <Table head={["Area", "Tool", "Cost"]} rows={STACK.map((s) => [s.area, s.tool, s.cost])} />
          </section>

          <section>
            <H2 id="roadmap">Roadmap</H2>
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
          </section>

          <section>
            <H2 id="principles">Principles</H2>
            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {PRINCIPLES.map((p) => (
                <div key={p.title} className="app-panel p-6">
                  <h3 className="text-[18px] font-medium text-ink">{p.title}</h3>
                  <p className="mt-2 text-[14px] leading-[22px] text-ink/65">{p.body}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </SectionPage>
  );
}
