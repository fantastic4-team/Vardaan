import { newId, now, read, write, type CallLog } from "@/lib/db";
import { normalisePhone, readTwilioWebhook, sayAndHangUp } from "@/lib/twilio";
import { greet } from "@/lib/voice";

// Set this as your Twilio number's "A call comes in" webhook. Callers are recognised by the
// number saved in their Vardaan account, so there's no login on the phone.
export async function POST(req: Request) {
  const params = await readTwilioWebhook(req);
  if (!params) return new Response("Forbidden", { status: 403 });
  const from = normalisePhone(params.get("From") ?? "");
  const user = from ? await read((d) => d.users.find((u) => u.phone === from)) : undefined;
  if (!user) return sayAndHangUp("Hello! This number isn't linked to a Vardaan account yet. Add it in your dashboard settings and call again. Goodbye.");

  const call: CallLog = {
    id: newId(),
    userId: user.id,
    direction: "inbound",
    reason: "You called Vardaan",
    phone: from!,
    status: "in-progress",
    twilioSid: params.get("CallSid") ?? undefined,
    turns: [],
    silences: 0,
    taskIds: [],
    startedAt: now(),
  };
  await write((d) => void d.calls.push(call));
  return greet(call);
}
