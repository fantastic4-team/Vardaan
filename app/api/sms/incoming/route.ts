import { after } from "next/server";
import { runTask } from "@/lib/agent";
import { newId, now, read, write } from "@/lib/db";
import { normalisePhone, readTwilioWebhook, twiml } from "@/lib/twilio";
import { approveDraft } from "@/lib/drafts";

// Set this as your Twilio number's "A message comes in" webhook. Replies to Vardaan's texts:
// YES approves waiting drafts; anything else answers the question a task is waiting on.
export async function POST(req: Request) {
  const params = await readTwilioWebhook(req);
  if (!params) return new Response("Forbidden", { status: 403 });
  const from = normalisePhone(params.get("From") ?? "");
  const body = (params.get("Body") ?? "").trim();
  const user = from ? await read((d) => d.users.find((u) => u.phone === from)) : undefined;
  if (!user || !body) return twiml("");

  await write((d) => void d.messages.push({ id: newId(), userId: user.id, direction: "inbound", body, status: "received", createdAt: now() }));

  const tasks = await read((d) => d.tasks.filter((t) => t.userId === user.id).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)));

  if (/^(yes|y|ok|okay|approve|haan|ha)\b/i.test(body)) {
    const waiting = tasks.find((t) => t.status === "needs_approval");
    if (waiting) {
      const results = [];
      for (const draft of waiting.drafts.filter((d) => d.status === "draft")) {
        results.push(await approveDraft(user, waiting.id, draft.id));
      }
      const failed = results.filter((r) => r.error).length;
      const links = results.map((r) => ("link" in r ? r.link : undefined)).filter(Boolean);
      const reply = failed
        ? "Vardaan: Some messages couldn't be sent. Check your dashboard."
        : links.length
          ? `Vardaan: Approved. Tap to send: ${links.join(" ")}`
          : "Vardaan: Approved and sent. Done!";
      return twiml(`<Message>${reply.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</Message>`);
    }
  }

  const asking = tasks.find((t) => t.status === "needs_input");
  if (asking) {
    await write((d) => {
      const t = d.tasks.find((x) => x.id === asking.id);
      if (!t) return;
      t.answers.push({ question: t.question ?? "", answer: body });
      t.question = undefined;
      t.status = "planning";
      t.updatedAt = now();
    });
    after(() => runTask(asking.id));
    return twiml("<Message>Vardaan: Got it, working on it.</Message>");
  }

  return twiml("<Message>Vardaan: Nothing is waiting on you right now. Call me anytime!</Message>");
}
