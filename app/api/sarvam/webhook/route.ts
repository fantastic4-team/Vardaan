import { NextResponse } from "next/server";
import { newId, now, write, type CallLog } from "@/lib/db";
import { normalisePhone } from "@/lib/phone";
import { OUTBOUND_STATUS, toTurns, validSarvamSecret } from "@/lib/sarvam-calls";

// Sarvam posts here when a call ends: for calls Vardaan placed (URL sent with each call) and for
// calls to your Sarvam number (set this URL as the inbound deployment's webhook). Sarvam doesn't
// sign webhooks, so the URL carries ?token=<SARVAM_WEBHOOK_SECRET>.
// Payloads: https://docs.sarvam.ai/voice-agents/api/instant-outbound/webhook-payload

type Payload = {
  attempt_id?: string;
  status?: string;
  interaction_id?: string | null;
  user_phone_number?: string;
  duration?: number | null;
  failure_reason?: string | null;
  start_datetime?: string | null;
  end_datetime?: string | null;
  interaction_transcript?: unknown;
  webhook_config?: { metadata?: Record<string, unknown> | null } | null;
  metadata?: Record<string, unknown> | null;
};

export async function POST(req: Request) {
  if (!validSarvamSecret(new URL(req.url).searchParams.get("token") ?? req.headers.get("authorization"))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const p = ((await req.json().catch(() => null)) ?? {}) as Payload;
  const ended = p.end_datetime || now();
  const callId = p.webhook_config?.metadata?.vardaan_call_id ?? p.metadata?.vardaan_call_id;

  await write((d) => {
    let c =
      (callId ? d.calls.find((x) => x.id === callId) : undefined) ??
      (p.attempt_id ? d.calls.find((x) => x.sarvamAttemptId === p.attempt_id) : undefined) ??
      (p.interaction_id ? d.calls.find((x) => x.sarvamInteractionId === p.interaction_id) : undefined);

    if (!c && !p.attempt_id) {
      // An inbound call where the agent never asked Vardaan anything: log it if we know the caller.
      const phone = normalisePhone(p.user_phone_number ?? "");
      const user = phone ? d.users.find((u) => u.phone === phone) : undefined;
      if (!user || !phone) return;
      c = {
        id: newId(),
        userId: user.id,
        direction: "inbound",
        reason: "You called Vardaan",
        phone,
        status: "in-progress",
        turns: [],
        silences: 0,
        taskIds: [],
        startedAt: p.start_datetime || ended,
        answeredAt: p.start_datetime || undefined,
      };
      d.calls.push(c);
    }
    if (!c) return;

    const status: CallLog["status"] = p.status ? (OUTBOUND_STATUS[p.status] ?? "failed") : "completed";
    c.status = status;
    c.endedAt = ended;
    if (p.interaction_id) c.sarvamInteractionId ??= p.interaction_id;
    if (typeof p.duration === "number") c.durationSec = Math.round(p.duration);
    if (p.failure_reason) c.error = p.failure_reason;
    if (status === "completed") c.answeredAt ??= p.start_datetime || ended;
    // Sarvam's transcript is the full record of what was said; prefer it over the turns we logged
    // from tool calls, which only cover what reached Vardaan.
    const transcript = toTurns(p.interaction_transcript, ended);
    if (transcript.length >= c.turns.length) c.turns = transcript;
  });

  return NextResponse.json({ ok: true });
}
