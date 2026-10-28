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
When done: calls user via Twilio outbound call
        ↓
Two-way voice conversation (speech → LLM → TTS)
        ↓
Call summary + task result saved to dashboard
```

### The core call flow

1. User presses **Call me** in the dashboard (or a background task completes with `call_user=true`).
2. Vardaan calls the user's verified phone number via Twilio.
3. Twilio fetches TwiML from `/api/voice/answer` → agent greets user, identifies itself as an AI.
4. User speaks → Twilio transcribes → posts to `/api/voice/turn`.
5. Agent responds → speak + listen loop continues.
6. User says "goodbye" or hangs up → call ends, summary saved.

---

## Feature set

| Feature | Status |
|---|---|
| Real outbound phone calls via Twilio | ✅ Working |
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
| Multi-language calls (en-IN, hi-IN, 8+ Indian languages) | ✅ Working |
| Secure webhook signature verification | ✅ Working |
| SMS notifications | ✅ Working |
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
| Telephony | Twilio Programmable Voice (TwiML + webhooks) |
| STT | Twilio `<Gather input="speech">` (built-in) |
| TTS | Amazon Polly (Aditi voice for Indian English/Hindi) via Twilio |
| Database | JSON file (`data/db.json`) for local dev — swap for Supabase/Neon in production |
| Auth | Stateless HMAC-signed session cookies, scrypt password hashing |
| Hosting | Vercel (frontend), any persistent host for production webhooks |

---

## Getting started

### Requirements

- **Node.js 20+** and npm
- A free [Groq](https://console.groq.com) or [Google AI Studio](https://aistudio.google.com) API key for the LLM
- (Optional but recommended) A [Twilio](https://console.twilio.com) account for phone calls

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
| `TWILIO_ACCOUNT_SID` | For calls | From console.twilio.com. |
| `TWILIO_AUTH_TOKEN` | For calls | From console.twilio.com. |
| `TWILIO_PHONE_NUMBER` | For calls | Your Twilio number in E.164 format. |
| `PUBLIC_URL` | For calls | Public HTTPS URL Twilio can reach (ngrok for local dev). |
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
| `POST` | `/api/voice/answer` | Twilio webhook: call answered |
| `POST` | `/api/voice/turn` | Twilio webhook: speech turn |
| `POST` | `/api/voice/status` | Twilio webhook: call status |
| `POST` | `/api/voice/incoming` | Twilio webhook: inbound call |
| `POST` | `/api/sms/incoming` | Twilio webhook: inbound SMS |
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

### Prerequisites

1. Create a free Twilio account at [twilio.com](https://www.twilio.com).
2. Verify your mobile number in Twilio (trial accounts can only call verified numbers).
3. Get a Twilio phone number.

### Local setup (with ngrok)

```bash
# Terminal 1: start the app
npm run dev

# Terminal 2: expose it to the internet
npx ngrok http 3000
# Copy the https URL, e.g. https://abcd-1234.ngrok-free.app
```

Add to `.env.local`:

```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890
PUBLIC_URL=https://abcd-1234.ngrok-free.app
```

Restart `npm run dev`.

### Configure Twilio webhooks

In Twilio Console → Phone Numbers → your number, set:

| Event | Webhook URL | Method |
|---|---|---|
| A call comes in | `https://your-ngrok-url/api/voice/incoming` | POST |
| A message comes in | `https://your-ngrok-url/api/sms/incoming` | POST |

### Make your first call

1. Open [http://localhost:3000](http://localhost:3000) and sign up.
2. In Settings, add your verified mobile number.
3. Press **Call me** in the dashboard.
4. Your phone rings. Pick up and say what you need.

### Test task-triggered callbacks

1. Hand off a task from the Tasks tab: *"Research the top 3 free LLM APIs and call me with the results."*
2. Vardaan searches the web, compiles results, and calls you back automatically.

### Terminal shortcut

```bash
npm run phone
# Enter your phone number and email when prompted — Vardaan will call immediately.
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
    voice/answer/             Twilio: call answered
    voice/turn/               Twilio: speech turn
    voice/status/             Twilio: call status
    voice/call-me/            "Call me now"
    voice/incoming/           Inbound calls
    sms/incoming/             Inbound SMS
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
  voice.ts                    Call conversation loop (greet, respond)
  phone.ts                    startCall / updateCall / notifyUser
  twilio.ts                   TwiML helpers, webhook verification, normalisePhone
  search.ts                   Web search (Tavily / Brave / DuckDuckGo)
  llm.ts                      OpenAI-compatible chat client (Groq / Gemini / Ollama)
  db.ts                       JSON file store (local dev)
  auth.ts                     Session cookies, password hashing
  scheduler.ts                Reminder poller (calls due reminders)
  mail.ts                     SMTP email sender
  drafts.ts                   Draft approve / discard logic
scripts/
  phone.mjs                   Terminal shortcut to trigger a call
data/                         Auto-created: db.json, auth-secret (gitignored)
docs/                         Screenshots
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
5. Set `PUBLIC_URL` to your production domain (same value, used for Twilio webhooks).
6. In Twilio, update the webhook URLs to your production domain.

---

## Troubleshooting

### "AI model is not configured"

Add `GROQ_API_KEY` or `GEMINI_API_KEY` to `.env.local` and restart the dev server.

### "Phone calls aren't set up yet"

Add `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`, and `PUBLIC_URL` to `.env.local`. Restart the server and make sure ngrok (or your tunnel) is running.

### Twilio says "Forbidden" on webhooks

Your `PUBLIC_URL` doesn't match the URL Twilio is posting to, so the HMAC signature check fails. Make sure `PUBLIC_URL` is the exact base URL ngrok is forwarding (no trailing slash).

### Call connects but I hear silence / errors

Check that the LLM is configured — the agent needs to be able to respond before TwiML can speak anything back.

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
