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

  // Determine the opening based on why Vardaan is calling.
  let opening: string;
  if (call.reason.startsWith("Reminder:")) {
    const reminderText = call.reason.slice(9).trim();
    opening = `Hi ${first}, this is Vardaan, your AI assistant. I'm calling about your reminder: ${reminderText}. Would you like me to do anything about it?`;
  } else if (call.reason.startsWith("Task result:")) {
    const taskContext = call.reason.slice(12).trim();
    opening = `Hi ${first}, this is Vardaan, your AI assistant. I'm calling because you asked me to help with: ${taskContext}. Is this a good time to go over the results?`;
  } else if (call.reason === "Call me") {
    opening = `Hi ${first}, this is Vardaan, your AI assistant. What can I help you with today?`;
  } else {
    opening = `Hi ${first}, this is Vardaan, your AI assistant. I'm calling about: ${call.reason}. Is this a good time?`;
  }

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

  if (/^(bye|goodbye|that's all|thats all|nothing else|no thanks?|hang up|end call)\.?$/i.test(speech.trim())) {
    await updateCall(call.id, (c) => void c.turns.push({ role: "user", content: speech, at: now() }));
    return sayAndHangUp("Okay. I'll message you with any updates. Goodbye!", lang);
  }

  const withUser = await updateCall(call.id, (c) => {
    c.silences = 0;
    c.turns.push({ role: "user", content: speech, at: now() });
  });

  // Build conversation history. If there are linked tasks, prepend their context.
  const taskContext = await getTaskContext(call);
  const rawTurns = (withUser?.turns ?? []).slice(1);
  const history = rawTurns.map(({ role, content }) => ({ role, content }));

  // Prepend task context to the first user message for better agent awareness.
  const enrichedHistory = taskContext && history.length > 0
    ? [{ role: "user" as const, content: `[Context: This call was triggered by the following task — ${taskContext}]\n\n${history[0].content}` }, ...history.slice(1)]
    : history;

  let reply: string;
  try {
    const result = await talk(call.userId, enrichedHistory);
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

/** Read the summary from any tasks linked to this call, for context injection. */
async function getTaskContext(call: CallLog): Promise<string | null> {
  if (!call.taskIds.length) return null;
  const tasks = await read((d) => d.tasks.filter((t) => call.taskIds.includes(t.id) && t.summary));
  if (!tasks.length) return null;
  return tasks.map((t) => `${t.request}: ${t.summary}`).join("; ");
}
