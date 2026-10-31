import { timingSafeEqual } from "crypto";
import { openingLine } from "@/lib/call-script";
import type { CallLog, CallTurn } from "@/lib/db";

// Phone calls on a Sarvam number, through Sarvam Voice Agents (Samvaad).
//
// How a call works: Vardaan asks Sarvam to ring the user (Instant Outbound API), or the user dials
// the Sarvam number. Sarvam's agent handles the voice; for anything the caller asks, it calls the
// `ask_vardaan` API tool, which posts to /api/sarvam/turn, where Vardaan's own agent replies (with
// its tools, tasks and memory). When the call ends Sarvam posts the result to /api/sarvam/webhook.
//
// One-time setup in the Sarvam dashboard is described in docs/SARVAM_SETUP.md.
// API docs: https://docs.sarvam.ai/voice-agents/api/instant-outbound/create

const env = (k: string) => process.env[k]?.trim() || "";
const publicUrl = () => env("PUBLIC_URL").replace(/\/$/, "");

/** Calls go through Sarvam when the agent, number and a shared secret are all configured. */
export function sarvamCallsConfigured() {
  return Boolean(
    (env("SARVAM_AGENT_API_KEY") || env("SARVAM_API_KEY")) &&
      env("SARVAM_ORG_ID") &&
      env("SARVAM_WORKSPACE_ID") &&
      env("SARVAM_APP_ID") &&
      env("SARVAM_CONNECTION_ID") &&
      env("SARVAM_PHONE_NUMBER") &&
      env("SARVAM_WEBHOOK_SECRET") &&
      publicUrl(),
  );
}

export const sarvamPhoneNumber = () => env("SARVAM_PHONE_NUMBER");

/** Sarvam doesn't sign its requests, so both endpoints check a shared secret (constant-time). */
export function validSarvamSecret(given: string | null | undefined) {
  const secret = env("SARVAM_WEBHOOK_SECRET");
  if (!secret || !given) return false;
  const a = Buffer.from(given.replace(/^Bearer\s+/i, "").trim());
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}

const LANGUAGE_NAMES: Record<string, string> = {
  "en-IN": "English", "hi-IN": "Hindi", "bn-IN": "Bengali", "ta-IN": "Tamil", "te-IN": "Telugu",
  "mr-IN": "Marathi", "gu-IN": "Gujarati", "kn-IN": "Kannada", "ml-IN": "Malayalam", "pa-IN": "Punjabi", "od-IN": "Odia",
};

/** Languages Vardaan can speak on calls (the user picks one in Settings). */
export const PHONE_LANGUAGES = Object.keys(LANGUAGE_NAMES);

/** Ask Sarvam to ring `to`. Returns Sarvam's attempt id. */
export async function placeSarvamCall(call: CallLog, user: { name?: string; lang?: string }) {
  const base = (env("SARVAM_AGENTS_API_BASE") || "https://apps.sarvam.ai").replace(/\/$/, "");
  const url = `${base}/api/outbounds/v1/orgs/${encodeURIComponent(env("SARVAM_ORG_ID"))}/workspaces/${encodeURIComponent(env("SARVAM_WORKSPACE_ID"))}/outbounds`;
  const language = LANGUAGE_NAMES[user.lang ?? ""];
  const res = await fetch(url, {
    method: "POST",
    headers: { "X-API-Key": env("SARVAM_AGENT_API_KEY") || env("SARVAM_API_KEY"), "Content-Type": "application/json" },
    body: JSON.stringify({
      app_config: {
        app_id: env("SARVAM_APP_ID"),
        app_version: Number(env("SARVAM_APP_VERSION") || 1),
        connection_config: { connection_id: env("SARVAM_CONNECTION_ID"), agent_phone_number: sarvamPhoneNumber() },
        // No agent_variables: Sarvam rejects any the agent doesn't define, and the greeting below
        // already carries the reason for the call.
        app_overrides: { initial_bot_message: openingLine(call, user.name), ...(language ? { initial_language_name: language } : {}) },
      },
      user_config: { user_phone_number: call.phone },
      webhook_config: {
        url: `${publicUrl()}/api/sarvam/webhook?token=${encodeURIComponent(env("SARVAM_WEBHOOK_SECRET"))}`,
        metadata: { vardaan_call_id: call.id },
      },
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    // Sarvam answers either { detail } (FastAPI) or { error: { message, data: { details } } }.
    const detail = Array.isArray(data?.detail)
      ? data.detail.map((d: { msg?: string }) => d.msg).join("; ")
      : data?.error?.data?.details || data?.error?.message || data?.detail || data?.message;
    throw new Error(`Sarvam: ${detail || `could not place the call (${res.status})`}`);
  }
  if (!data.attempt_id) throw new Error("Sarvam didn't return a call id.");
  return data.attempt_id as string;
}

// ---- Webhook payloads ----------------------------------------------------------------------

/** Sarvam's outcome for an outbound attempt, mapped to our call statuses. */
export const OUTBOUND_STATUS: Record<string, CallLog["status"]> = {
  connected: "completed",
  no_answer: "no-answer",
  busy: "busy",
  failed: "failed",
};

type SarvamTurn = { role?: string; en_text?: string | null; indic_text?: string | null };

/** Convert Sarvam's transcript to ours, preferring the caller's own language over the English. */
export function toTurns(transcript: unknown, at: string): CallTurn[] {
  if (!Array.isArray(transcript)) return [];
  return (transcript as SarvamTurn[])
    .map((t) => ({ role: t.role === "user" ? ("user" as const) : ("assistant" as const), content: (t.indic_text || t.en_text || "").trim(), at }))
    .filter((t) => t.content);
}

/**
 * The caller's latest words, from the `ask_vardaan` tool body. Prefers an explicit `message`; falls
 * back to the last user line of the call transcript, which may arrive as a list or as text.
 */
export function latestUserMessage(body: Record<string, unknown>) {
  if (typeof body.message === "string" && body.message.trim()) return body.message.trim();
  let t = body.transcript;
  if (typeof t === "string") {
    const text = t;
    try {
      t = JSON.parse(text);
    } catch {
      const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
      const userLines = lines.filter((l) => /^(user|caller|customer)\s*:/i.test(l));
      const last = userLines.at(-1) ?? lines.at(-1) ?? "";
      return last.replace(/^(user|caller|customer)\s*:\s*/i, "").trim();
    }
  }
  const user = toTurns(t, "").filter((x) => x.role === "user");
  return user.at(-1)?.content ?? "";
}
