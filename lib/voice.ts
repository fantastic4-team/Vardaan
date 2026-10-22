import { talk } from "@/lib/agent";
import { now, read, type CallLog } from "@/lib/db";
import { updateCall } from "@/lib/phone";
import { sayAndHangUp, sayAndListen } from "@/lib/twilio";

// The conversation loop for phone calls. Twilio posts what the caller said; we ask the agent for a
// reply, speak it, and listen again. Work the caller hands off keeps running after they hang up.

const turnPath = (call: CallLog) => `/api/voice/turn?call=${call.id}`;

export async function greet(call: CallLog) {
  const user = await read((d) => d.users.find((u) => u.id === call.userId));
  const first = user?.name.split(" ")[0] ?? "there";
  const lang = user?.lang ?? "en-IN";
  const opening =
    call.reason.startsWith("Reminder:")
      ? `Hi ${first}, it's Vardaan with your reminder: ${call.reason.slice(9).trim()}. Would you like me to do anything about it?`
      : `Hi ${first}, Vardaan here. What can I do for you?`;
  await updateCall(call.id, (c) => {
    c.status = "in-progress";
    c.answeredAt ??= now();
    c.turns.push({ role: "assistant", content: opening, at: now() });
  });
  return sayAndListen(opening, lang, turnPath(call));
}

export async function respond(call: CallLog, speech: string, onTasks: (ids: string[]) => void) {
  const user = await read((d) => d.users.find((u) => u.id === call.userId));
  const lang = user?.lang ?? "en-IN";

  if (!speech) {
    // Nothing heard: prompt once or twice, then end the call politely.
    const updated = await updateCall(call.id, (c) => void (c.silences += 1));
    if ((updated?.silences ?? 0) >= 3) return sayAndHangUp("I'll let you go. Call me anytime. Goodbye!", lang);
    return sayAndListen("Are you still there? You can tell me what you need.", lang, turnPath(call));
  }

  if (/^(bye|goodbye|that's all|thats all|nothing else|no thanks?)\.?$/i.test(speech.trim())) {
    await updateCall(call.id, (c) => void c.turns.push({ role: "user", content: speech, at: now() }));
    return sayAndHangUp("Okay. I'll message you with any updates. Goodbye!", lang);
  }

  const withUser = await updateCall(call.id, (c) => {
    c.silences = 0;
    c.turns.push({ role: "user", content: speech, at: now() });
  });
  // The greeting isn't part of the model's conversation.
  const history = (withUser?.turns ?? []).slice(1).map(({ role, content }) => ({ role, content }));

  let reply: string;
  try {
    const result = await talk(call.userId, history);
    reply = result.reply;
    if (result.startedTaskIds.length) {
      await updateCall(call.id, (c) => void c.taskIds.push(...result.startedTaskIds));
      onTasks(result.startedTaskIds);
    }
  } catch (err) {
    reply = "Sorry, I'm having trouble thinking right now. Please try again in a moment.";
    await updateCall(call.id, (c) => void (c.error = err instanceof Error ? err.message : "Agent error"));
  }

  await updateCall(call.id, (c) => void c.turns.push({ role: "assistant", content: reply, at: now() }));
  return sayAndListen(reply, lang, turnPath(call));
}
