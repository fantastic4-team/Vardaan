import { after } from "next/server";
import { runTask } from "@/lib/agent";
import { read } from "@/lib/db";
import { readTwilioWebhook, sayAndHangUp } from "@/lib/twilio";
import { respond } from "@/lib/voice";

// Twilio posts what the caller said (SpeechResult); Vardaan replies and listens again.
export async function POST(req: Request) {
  const params = await readTwilioWebhook(req);
  if (!params) return new Response("Forbidden", { status: 403 });
  const id = new URL(req.url).searchParams.get("call");
  const call = await read((d) => d.calls.find((c) => c.id === id));
  if (!call) return sayAndHangUp("Sorry, something went wrong. Goodbye.");
  return respond(call, (params.get("SpeechResult") ?? "").trim(), (ids) => after(() => Promise.all(ids.map(runTask))));
}
