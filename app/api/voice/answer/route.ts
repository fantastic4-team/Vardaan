import { read } from "@/lib/db";
import { readTwilioWebhook, sayAndHangUp } from "@/lib/twilio";
import { greet } from "@/lib/voice";

// Twilio fetches this when the user picks up a call Vardaan placed.
export async function POST(req: Request) {
  if (!(await readTwilioWebhook(req))) return new Response("Forbidden", { status: 403 });
  const id = new URL(req.url).searchParams.get("call");
  const call = await read((d) => d.calls.find((c) => c.id === id));
  if (!call) return sayAndHangUp("Sorry, something went wrong. Goodbye.");
  return greet(call);
}
