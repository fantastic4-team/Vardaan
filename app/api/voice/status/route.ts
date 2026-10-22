import { now } from "@/lib/db";
import { updateCall } from "@/lib/phone";
import { readTwilioWebhook } from "@/lib/twilio";
import type { CallLog } from "@/lib/db";

const STATUSES: CallLog["status"][] = ["queued", "ringing", "in-progress", "completed", "busy", "no-answer", "failed", "canceled"];

// Twilio reports call progress here: ringing, answered, and finally how it ended and for how long.
export async function POST(req: Request) {
  const params = await readTwilioWebhook(req);
  if (!params) return new Response("Forbidden", { status: 403 });
  const id = new URL(req.url).searchParams.get("call");
  const status = params.get("CallStatus") as CallLog["status"];
  if (id && STATUSES.includes(status)) {
    await updateCall(id, (c) => {
      c.status = status;
      if (status === "in-progress") c.answeredAt ??= now();
      if (["completed", "busy", "no-answer", "failed", "canceled"].includes(status)) {
        c.endedAt = now();
        const d = Number(params.get("CallDuration"));
        if (Number.isFinite(d)) c.durationSec = d;
      }
    });
  }
  return new Response(null, { status: 204 });
}
