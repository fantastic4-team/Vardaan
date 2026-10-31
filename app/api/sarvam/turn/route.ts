import { NextResponse, after } from "next/server";
import { runTask } from "@/lib/agent";
import { openingLine } from "@/lib/call-script";
import { newId, now, write, type CallLog } from "@/lib/db";
import { normalisePhone } from "@/lib/phone";
import { latestUserMessage, validSarvamSecret } from "@/lib/sarvam-calls";
import { agentReply } from "@/lib/voice";

// The `ask_vardaan` API tool on your Sarvam voice agent posts here during a call, with what the
// caller said. Vardaan's agent answers and Sarvam speaks the reply. Setup: docs/SARVAM_SETUP.md.
//
// Body (JSON): { message, phone: <User Identifier>, interaction_id: <Interaction ID>, transcript?: <Call Transcript> }
// Auth: "Authorization: Bearer <SARVAM_WEBHOOK_SECRET>"   Response: { reply }

// Sarvam waits at most 30s for a tool; answer before that even if the agent is still thinking.
const REPLY_WITHIN_MS = 25_000;

export async function POST(req: Request) {
  if (!validSarvamSecret(req.headers.get("authorization") ?? new URL(req.url).searchParams.get("token"))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const interactionId = typeof body.interaction_id === "string" ? body.interaction_id.trim() : "";
  const phone = normalisePhone(String(body.phone ?? body.user_phone_number ?? ""));
  const message = latestUserMessage(body);

  const call = await findOrStartCall(interactionId, phone);
  if (!call) {
    return NextResponse.json({
      reply: "This number isn't linked to a Vardaan account yet. Add it in your Vardaan settings, then call again. Goodbye!",
    });
  }
  if (!message) return NextResponse.json({ reply: "Sorry, I didn't catch that. What would you like me to do?" });

  const reply = agentReply(call, message, (ids) => after(() => Promise.all(ids.map(runTask))));
  const slow = new Promise<string>((r) =>
    setTimeout(() => r("I'm working on that now. I'll update you on your dashboard as soon as it's done."), REPLY_WITHIN_MS),
  );
  return NextResponse.json({ reply: await Promise.race([reply, slow]) });
}

/**
 * The call this turn belongs to: one already linked to this Sarvam conversation, else the outbound
 * call Vardaan just placed to this number, else a new inbound call from a known user's number.
 */
async function findOrStartCall(interactionId: string, phone: string | null): Promise<CallLog | null> {
  const recent = Date.now() - 15 * 60_000;
  const call = await write((d) => {
    const linked = interactionId ? d.calls.find((c) => c.sarvamInteractionId === interactionId) : undefined;
    if (linked) return { ...linked };

    // The call Vardaan placed to this number (or, if the tool sent no phone or interaction id, the
    // most recent call it placed or is on).
    const placed = [...d.calls]
      .reverse()
      .find(
        (c) =>
          (phone ? c.direction === "outbound" && c.phone === phone && !c.sarvamInteractionId : !interactionId || !c.sarvamInteractionId) &&
          ["queued", "ringing", "in-progress"].includes(c.status) &&
          Date.parse(c.startedAt) >= recent,
      );
    if (!phone && !placed) return null;
    const user = d.users.find((u) => u.id === placed?.userId) ?? d.users.find((u) => u.phone === phone);
    if (!user) return null;

    let c = placed;
    if (!c) {
      c = {
        id: newId(),
        userId: user.id,
        direction: "inbound",
        reason: "You called Vardaan",
        phone: phone!,
        status: "in-progress",
        turns: [],
        silences: 0,
        taskIds: [],
        startedAt: now(),
      };
      d.calls.push(c);
    }
    if (interactionId) c.sarvamInteractionId = interactionId;
    c.status = "in-progress";
    c.answeredAt ??= now();
    // The greeting is spoken by Sarvam; log it so the transcript (and agent history) reads in order.
    if (!c.turns.length) c.turns.push({ role: "assistant", content: openingLine(c, user.name), at: now() });
    return { ...c };
  });
  return call;
}
