# Vardaan

**The AI agent you can call for anything.**

Vardaan is a voice-first AI agent. You call it, say what you need in your own language, and it gets done, quietly in the background or live with you on the line. No apps, no screens, no typing.

---

## Contents

- [Product overview](#product-overview)
- [How it works](#how-it-works)
- [Feature set](#feature-set)
- [Tech stack](#tech-stack)
- [Getting started](#getting-started)
- [Configuration](#configuration)
- [API reference](#api-reference)
- [Project structure](#project-structure)
- [Making a real test call](#making-a-real-test-call)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)
- [Team](#team)
- [License](#license)

---

## Product overview

Getting things done today means switching between apps, navigating confusing websites and waiting on hold. Vardaan turns a phone call into a capable personal agent: you describe the task, it plans the steps, confirms the details and takes the work off your hands.

It works in two modes:

| Mode | What happens |
|---|---|
| **Call & Cut** | Hang up and Vardaan finishes the task in the background, then calls you back with results or texts you an update. |
| **Talk & Help** | Stay on the line for real-time support: research, decisions, document review, or drafting together. |

Vardaan remembers preferences and context, and when information is missing or a decision carries real consequences, it asks rather than guessing.

---

## How it works

```
User submits a task or calls
        ↓
Agent parses intent and plans steps
        ↓
Agent executes tools (web search, drafting, reminders…)
        ↓
When done: calls user on a Sarvam phone number
        ↓
Two-way voice conversation (speech → LLM → TTS)
        ↓
Call summary + task result saved to dashboard
```

### The core call flow

1. User presses **Call me** in the dashboard (or a background task completes with `call_user=true`).
2. Vardaan asks Sarvam (Instant Outbound API) to ring the user's number from your Sarvam number.
3. Sarvam's voice agent greets the user with Vardaan's opening line and identifies itself as an AI.
4. User speaks → Sarvam's `ask_vardaan` tool posts it to `/api/sarvam/turn` → Vardaan's agent replies → Sarvam speaks it.
5. The loop continues until the user says goodbye or hangs up.
6. Sarvam posts the outcome and full transcript to `/api/sarvam/webhook`; the call log is saved.

---

## Feature set

| Feature | Status |
|---|---|
| Real outbound phone calls on a Sarvam number | ✅ Working |
| Inbound calls (user calls Vardaan's number) | ✅ Working |
| Two-way voice conversation (speech-to-text + LLM + TTS) | ✅ Working |
| AI identity disclosure ("this is Vardaan, your AI assistant") | ✅ Working |
| Background task execution | ✅ Working |
| Task-triggered callbacks (Vardaan calls you with results) | ✅ Working |
| Web search (DuckDuckGo fallback, Tavily, Brave) | ✅ Working |
| Memory (facts the agent remembers between sessions) | ✅ Working |
| Reminders with scheduled callbacks | ✅ Working |
| Message drafting (email, SMS, WhatsApp) | ✅ Working |
| Draft approval workflow | ✅ Working |
| Task cancel from dashboard | ✅ Working |
| Multi-language calls (English, Hindi, 9 more Indian languages, Hinglish) | ✅ Working |
| Sarvam tool and webhook secured by a shared secret | ✅ Working |
| Notifications (dashboard, plus email if SMTP is set up) | ✅ Working |
| Email sending via SMTP | ✅ Working (optional) |
| Authentication (session cookie, scrypt passwords) | ✅ Working |
| Real-time agent status polling | ✅ Working |

---

## Tech stack

| Area | Choice |
|---|---|
| Framework | Next.js 15 (App Router) |
| UI | React 19, TypeScript, Tailwind CSS 4 |
| AI / LLM | Groq (Llama 3.3 70B) or Gemini 2.5 Flash via OpenAI-compatible API |
| Web search | Tavily / Brave Search / DuckDuckGo (no key fallback) |
| Telephony | Sarvam Voice Agents (rented Sarvam number, Instant Outbound API, webhooks) |
| STT / TTS | Sarvam (built into the voice agent; Indian languages and code-mixed speech) |
| Database | JSON file (`data/db.json`) for local dev — swap for Supabase/Neon in production |
| Auth | Stateless HMAC-signed session cookies, scrypt password hashing |
| Hosting | Vercel (frontend), any persistent host for production webhooks |

---

## Getting started

### Requirements

- **Node.js 20+** and npm
- A free [Groq](https://console.groq.com) or [Google AI Studio](https://aistudio.google.com) API key for the LLM
- For phone calls: a [Sarvam](https://dashboard.sarvam.ai) account with wallet credit and a rented number (see [docs/SARVAM_SETUP.md](docs/SARVAM_SETUP.md))

### 1. Clone and install

```bash
git clone https://github.com/fantastic4-team/Vardaan.git
cd Vardaan
npm install
```

### 2. Set environment variables

```bash
cp .env.example .env.local
```

Edit `.env.local` and set at minimum:

```env
GROQ_API_KEY=gsk_...          # from console.groq.com (free)
AUTH_SECRET=<random 32 bytes> # node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), sign up, and try handing off a task.

---

## Configuration

### Environment variables

| Variable | Required | Purpose |
|---|---|---|
| `AUTH_SECRET` | Production only | Signs session cookies. Auto-generated locally. |
| `GROQ_API_KEY` | One of GROQ/GEMINI | Free LLM via Groq. |
| `GEMINI_API_KEY` | One of GROQ/GEMINI | Free LLM via Google AI Studio. |
| `LLM_MODEL` | Optional | Override the default model name. |
| `LLM_BASE_URL` | Optional | Use any OpenAI-compatible server (e.g. Ollama). |
| `TAVILY_API_KEY` | Optional | Better web search (1000 free/month). |
| `BRAVE_API_KEY` | Optional | Alternative web search (2000 free/month). |
| `SARVAM_API_KEY` | For calls | Sarvam API key (Settings → API Key). |
| `SARVAM_ORG_ID`, `SARVAM_WORKSPACE_ID` | For calls | From your Sarvam dashboard URL or Settings. |
| `SARVAM_APP_ID`, `SARVAM_APP_VERSION` | For calls | Your published Vardaan voice agent. |
| `SARVAM_CONNECTION_ID`, `SARVAM_PHONE_NUMBER` | For calls | Your rented number's connection and the number (E.164). |
| `SARVAM_WEBHOOK_SECRET` | For calls | Random string; Sarvam sends it back so only it can drive calls. |
| `PUBLIC_URL` | For calls | Fixed public HTTPS URL Sarvam can reach (ngrok static domain for local dev). |
| `SMTP_HOST` | Optional | Gmail SMTP for email sending. |
| `SMTP_USER` | Optional | Gmail address. |
| `SMTP_PASS` | Optional | Gmail app password. |
| `NEXT_PUBLIC_SITE_URL` | Production | Canonical URL for SEO. |

---

## API reference

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/health` | Public health check — no auth |
| `GET` | `/api/agent/status` | Agent's current disposition (Idle, On Call, etc.) |
| `GET` | `/api/status` | Integration status (AI, telephony, email) |
| `POST` | `/api/tasks` | Create a task and run it in the background |
| `GET` | `/api/tasks` | List all tasks, calls, messages, memories, reminders |
| `GET` | `/api/tasks/:id` | Fetch one task |
| `DELETE` | `/api/tasks/:id` | Cancel a task |
| `POST` | `/api/tasks/:id/cancel` | Cancel a task (POST alias) |
| `POST` | `/api/tasks/:id/answer` | Reply to an agent question |
| `POST` | `/api/tasks/:id/drafts/:draftId` | Approve or discard a draft |
| `GET` | `/api/calls` | List all calls |
| `GET` | `/api/calls/:id` | Fetch one call |
| `POST` | `/api/calls/request` | Request an outbound call with a reason/taskId |
| `POST` | `/api/voice/call-me` | Shorthand: "Call me now" |
| `POST` | `/api/sarvam/turn` | Sarvam `ask_vardaan` tool: caller's words in, `{ reply }` out |
| `POST` | `/api/sarvam/webhook` | Sarvam webhook: call outcome and transcript (outbound and inbound) |
| `GET/POST` | `/api/reminders` | List / create reminders |
| `DELETE` | `/api/reminders/:id` | Delete a reminder |
| `GET/POST` | `/api/memories` | List / add memories |
| `DELETE` | `/api/memories/:id` | Delete a memory |
| `GET/POST` | `/api/profile` | Get / update phone and language |
| `POST` | `/api/auth/login` | Log in |
| `POST` | `/api/auth/signup` | Sign up |
| `POST` | `/api/auth/logout` | Log out |

---

## Making a real test call

Full step-by-step guide (buying the number, creating the agent, costs): **[docs/SARVAM_SETUP.md](docs/SARVAM_SETUP.md)**.

In short:

1. In the Sarvam dashboard, add wallet credit, complete KYC and rent a number.
2. Claim a free ngrok static domain and run `ngrok http --url=your-name.ngrok-free.app 3000`.
3. Create a Sarvam voice agent with an `ask_vardaan` API tool → `https://<PUBLIC_URL>/api/sarvam/turn`, publish it, and set the inbound webhook to `https://<PUBLIC_URL>/api/sarvam/webhook?token=<SARVAM_WEBHOOK_SECRET>`.
4. Fill in the `SARVAM_*` variables and `PUBLIC_URL` in `.env.local`, then restart `npm run dev`.

### Make your first call

1. Open [http://localhost:3000](http://localhost:3000) and sign up.
2. In Settings, add your mobile number and call language.
3. Press **Call me** in the dashboard.
4. Your phone rings. Pick up and say what you need.

### Test task-triggered callbacks

1. Hand off a task from the Tasks tab: *"Research the top 3 free LLM APIs and call me with the results."*
2. Vardaan searches the web, compiles results, and calls you back automatically.

### Terminal shortcut

```bash
npm run phone
# Asks for any missing Sarvam settings, starts the app, prints the URLs to paste into Sarvam,
# then calls you whenever you press Enter.
```

---

## Project structure

```text
app/
  page.tsx                    Beta landing page
  app/page.tsx                Dashboard shell (auth-gated)
  login/, signup/             Auth pages
  api/
    health/route.ts           Public health check
    agent/status/route.ts     Agent disposition
    tasks/route.ts            Task list / create
    tasks/[id]/route.ts       Task detail / cancel
    tasks/[id]/cancel/        POST cancel alias
    tasks/[id]/answer/        Answer agent question
    tasks/[id]/drafts/[id]/   Approve / discard draft
    calls/route.ts            Call list
    calls/[id]/route.ts       Call detail
    calls/request/route.ts    Request outbound call
    voice/call-me/            "Call me now"
    sarvam/turn/              Sarvam ask_vardaan tool (one conversational turn)
    sarvam/webhook/           Sarvam call outcome + transcript
    reminders/, memories/     CRUD
    profile/, status/         User settings / integration status
    auth/                     Login / signup / logout
    waitlist/                 Beta signup
components/
  dashboard/
    Dashboard.tsx             Main app shell (sidebar, views, polling)
    TaskCard.tsx              Task with answer, draft approval, cancel, call-me
    api.ts                    Typed fetch wrapper
  docs/, AuthForm.tsx, …      Shared UI components
lib/
  agent.ts                    LLM agent with tool calling (web search, drafts, reminders…)
  voice.ts                    One call turn: caller's words → agent reply
  phone.ts                    startCall / updateCall / notifyUser / normalisePhone
  sarvam-calls.ts             Sarvam Voice Agents: place calls, verify secret, parse webhooks
  call-script.ts              Opening line for each kind of call
  search.ts                   Web search (Tavily / Brave / DuckDuckGo)
  llm.ts                      OpenAI-compatible chat client (Groq / Gemini / Ollama)
  db.ts                       JSON file store (local dev)
  auth.ts                     Session cookies, password hashing
  scheduler.ts                Reminder poller (calls due reminders)
  mail.ts                     SMTP email sender
  drafts.ts                   Draft approve / discard logic
scripts/
  phone.mjs                   Terminal phone line: start app, print Sarvam URLs, call on Enter
data/                         Auto-created: db.json, auth-secret (gitignored)
docs/                         Screenshots, SARVAM_SETUP.md
```

---

## Deployment

### Vercel (recommended for frontend + API)

> ⚠️ **Important:** Vercel's serverless functions are stateless. The JSON file database (`data/db.json`) will not persist between deployments. Before production, swap `lib/db.ts` for Supabase, Neon, or another hosted database.
>
> The reminder scheduler (`lib/scheduler.ts`) uses `setInterval` and requires a long-lived Node process. On Vercel, replace it with a Vercel Cron Job calling `/api/reminders/check`.

1. Push to GitHub.
2. Import the repository in [Vercel](https://vercel.com).
3. Set all required environment variables under **Settings → Environment Variables**.
4. Set `NEXT_PUBLIC_SITE_URL` to your production domain.
5. Set `PUBLIC_URL` to your production domain (same value, used for Sarvam's tool and webhooks).
6. In Sarvam, update the `ask_vardaan` tool URL and the inbound webhook URL to your production domain.

---

## Troubleshooting

### "AI model is not configured"

Add `GROQ_API_KEY` or `GEMINI_API_KEY` to `.env.local` and restart the dev server.

### "Phone calls aren't set up yet"

Fill in every `SARVAM_*` variable and `PUBLIC_URL` in `.env.local` (see [docs/SARVAM_SETUP.md](docs/SARVAM_SETUP.md)). Restart the server and make sure your tunnel is running.

### Sarvam's tool gets "Forbidden"

The tool's Bearer token (or the webhook's `?token=`) doesn't match `SARVAM_WEBHOOK_SECRET` in `.env.local`.

### Call connects but I hear silence / errors

Check that the LLM is configured and that Sarvam can reach `PUBLIC_URL/api/sarvam/turn` (the call log shows each turn that reached Vardaan). The agent must reply within 30 seconds.

### Reminders don't fire

The scheduler runs inside the Node server process. It won't fire on Vercel serverless deployments. Use a Vercel Cron Job or external scheduler that hits `/api/reminders/check`.

### "Add your phone number in Settings first"

Go to Dashboard → Settings, enter your mobile number in E.164 format (e.g. `+919876543210`) and save.

---

## Team

Built by **Fantastic 4**.

| Name | Role |
|---|---|
| Souradeep Pradhan | Frontend Developer |
| Aniruddha Das | Backend & Full Stack Engineer |
| Sampurna | AI/ML Engineer |
| Sattwik | Database Manager |

Questions: [fantastic4.team.dev@gmail.com](mailto:fantastic4.team.dev@gmail.com)

---

## License

See [LICENSE](LICENSE).
