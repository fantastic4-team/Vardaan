# Phone calls with Sarvam AI

Vardaan places and answers real phone calls on a phone number rented from Sarvam. Sarvam's voice
agent does the speaking and listening (in Indian languages and Hinglish). Vardaan's own agent
works out every reply, so it can still use its tools, start tasks and remember things.

```
You ── phone ──► Sarvam number ──► Sarvam voice agent ──(ask_vardaan tool)──► Vardaan /api/sarvam/turn
                                                       ◄──────── { reply } ──────────┘
Call ends ──► Sarvam ──► Vardaan /api/sarvam/webhook   (status, duration, transcript)
```

## What it costs (pay as you go, no subscription)

| Item | Price (excl. 18% GST) |
|---|---|
| Phone number (11, 79 or 80 series) | ₹59 per 30 days, auto-renews from your wallet |
| Voice agent minutes (speech recognition, AI and voice included) | ₹3.50 per minute, billed per started minute |
| Phone line (Sarvam telephony) | ₹0.20 per 30 seconds (about ₹0.40 per minute) |
| Unanswered, busy or failed calls | Free |

Example: ₹500 of credit pays for the number for a month plus about 100 minutes of calls.
If your wallet can't cover a renewal, **Sarvam releases the number immediately**, with no grace period.
Keep some credit in the wallet. Source: https://docs.sarvam.ai/voice-agents/pricing

## 1. Account, wallet and number

1. Sign up at https://dashboard.sarvam.ai.
2. Add credit to your wallet. ₹500 is plenty to start; you don't need a paid plan.
3. Go to **Deploy → Phone Numbers → Add Connection → Rent from Sarvam**. Choose **Individual**,
   enter your email and complete the **KYC**. Rental only opens once KYC is approved.
4. Click **Buy Number**, pick one and buy it. A connection named **Sarvam Vobiz** appears.
   Note down:
   - the number, as `SARVAM_PHONE_NUMBER` (E.164 format, e.g. `+918044620704`)
   - the connection's ID, as `SARVAM_CONNECTION_ID`

## 2. A fixed public address for this app

Sarvam needs a URL that stays the same, because you type it into the agent once.
A free **ngrok** static domain works:

1. Sign up at https://ngrok.com (free), then go to **Domains** and claim your free static domain.
2. Run: `ngrok http --url=your-name.ngrok-free.app 3000`
3. Set `PUBLIC_URL=https://your-name.ngrok-free.app` in `.env.local`.

(Without `PUBLIC_URL`, `npm run phone` opens a temporary tunnel instead. That address changes on
every run, so you'd have to update the URLs in Sarvam each time.)

## 3. Create the voice agent

In the Sarvam dashboard, create a new agent named **Vardaan**.

**Prompt.** Paste this as the agent's instructions:

> You are the phone voice of Vardaan, a personal AI assistant. You do not answer questions or
> take actions yourself. Whenever the caller says anything (a question, a request, an answer or a
> follow-up), first say a short filler like "One moment" and then call tool:ask_vardaan with
> exactly what the caller said. Then speak the tool's `reply` to the caller word for word, in the
> caller's language. Never invent information. If the reply says goodbye, or the caller says bye,
> end the call politely.

**Voice and language.** Pick the default language and voice you like. Vardaan also sets the
greeting and language for each outbound call.

**API tool.** Add one tool with these settings:

| Setting | Value |
|---|---|
| Name | `ask_vardaan` |
| Description | Ask Vardaan, the user's assistant, what to say. Use for everything the caller says. |
| When | During conversation |
| Method / URL | `POST` `https://<PUBLIC_URL>/api/sarvam/turn` |
| Auth | Bearer token = the `SARVAM_WEBHOOK_SECRET` value from your `.env.local` (save it as a Sarvam secret) |
| Max wait | 30 seconds |
| If it fails | "Sorry, I couldn't reach Vardaan just now. Please try again in a minute." |
| Response template | `{{reply}}` |

The **body** is JSON. Insert the `@` variables using the `@` menu:

```json
{
  "message": "<the caller's latest words>",
  "phone": "@User Identifier",
  "interaction_id": "@Interaction ID",
  "transcript": "@Call Transcript"
}
```

If the tool editor can't fill `message` from the conversation, leave it out. Vardaan then takes
the caller's last line from `transcript`.

Save the agent and **publish** it. Note down:
- the agent's ID, as `SARVAM_APP_ID`
- the published version number, as `SARVAM_APP_VERSION`

## 4. Let people call your number (inbound)

Go to **Deploy → Inbound** and create an inbound deployment that sends your number to the Vardaan
agent. Set its **webhook URL** to:

```
https://<PUBLIC_URL>/api/sarvam/webhook?token=<SARVAM_WEBHOOK_SECRET>
```

Outbound calls don't need this step, because Vardaan sends that webhook URL with every call it places.

## 5. API key and IDs

1. Go to **Settings → API Key** and create a key. Put it in `SARVAM_API_KEY`.
   If that key doesn't work for calls (a 401 or 403 error), set it as `SARVAM_AGENT_API_KEY`
   instead, and keep your speech `sk_...` key in `SARVAM_API_KEY`.
2. Copy `SARVAM_ORG_ID` and `SARVAM_WORKSPACE_ID` from your dashboard URL or from **Settings**.

Your `.env.local` should now have:

```
SARVAM_API_KEY=...
SARVAM_ORG_ID=...
SARVAM_WORKSPACE_ID=...
SARVAM_APP_ID=...
SARVAM_APP_VERSION=1
SARVAM_CONNECTION_ID=...
SARVAM_PHONE_NUMBER=+91...
SARVAM_WEBHOOK_SECRET=...   # already generated for you
PUBLIC_URL=https://your-name.ngrok-free.app
```

## 6. Try it

1. Run `npm run dev` (with ngrok running), sign up at `http://localhost:3000/signup`, and save
   your mobile number and call language in **Settings**.
2. Press **Call me**. Your phone rings from the Sarvam number.
3. Or run `npm run phone` (stop `npm run dev` first) to place calls by pressing Enter and watch
   the conversation live.

## Things to know

- **No SMS.** Sarvam doesn't send texts. Updates and questions appear on the dashboard's
  Messages page. If you've set up Gmail SMTP, they're emailed to you as well.
- **Indian rules apply.** Numbers on the TRAI DND list may not get calls. A failed call shows
  Sarvam's reason in the call log.
- **Landline numbers** (080 or 079) need `+91` in front when dialled.
