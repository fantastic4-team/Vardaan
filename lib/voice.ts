import { talk } from "@/lib/agent";
import { now, read, type CallLog } from "@/lib/db";
import { updateCall } from "@/lib/phone";

// The brain of a phone call. Sarvam's voice agent handles speaking and listening; for each thing the
// caller asks, it posts to /api/sarvam/turn, which calls agentReply(). Work the caller hands off
// keeps running after they hang up.

/** One turn: log what the caller said, ask the agent, then log and return its reply. Never throws. */
export async function agentReply(call: CallLog, speech: string, onTasks: (ids: string[]) => void) {
  const withUser = await updateCall(call.id, (c) => {
    c.silences = 0;
    c.turns.push({ role: "user", content: speech, at: now() });
  });

  // Build conversation history (skipping the greeting). If there are linked tasks, prepend their context.
  const taskContext = await getTaskContext(call);
  const rawTurns = (withUser?.turns ?? []).slice(1);
  const history = rawTurns.map(({ role, content }) => ({ role, content }));

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
  return reply;
}

/** Read the summary from any tasks linked to this call, for context injection. */
async function getTaskContext(call: CallLog): Promise<string | null> {
  if (!call.taskIds.length) return null;
  const tasks = await read((d) => d.tasks.filter((t) => t.userId === call.userId && call.taskIds.includes(t.id) && t.summary));
  if (!tasks.length) return null;
  return tasks.map((t) => `${t.request}: ${t.summary}`).join("; ");
}
