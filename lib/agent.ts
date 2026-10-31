import { appTools, appsSummary, runAppTool } from "@/lib/app-tools";
import { chat, type ChatMessage, type ToolSpec } from "@/lib/llm";
import { mailConfigured } from "@/lib/mail";
import { newId, now, read, write, type Draft, type Task } from "@/lib/db";
import { notifyUser } from "@/lib/phone";
import { webSearch, formatResults } from "@/lib/search";

// The Vardaan agent. Two entry points, matching the product's two modes:
//   talk()    – Talk & Help: a live conversation; replies are short and spoken aloud.
//   runTask() – Call & Cut: works on a task in the background, plans it, drafts what's needed,
//               and stops to ask the user whenever information is missing or approval is needed.
// The agent never sends anything on its own: drafts wait for the user to approve them.

const MAX_STEPS = 12;

const tool = (name: string, description: string, properties: Record<string, unknown>, required: string[]): ToolSpec => ({
  type: "function",
  function: { name, description, parameters: { type: "object", properties, required } },
});

// Tool and prompt text is sent on every model call, so it's kept short: Groq's free tier limits
// tokens per minute, and every word here costs tokens on each step of every call.
const TOOLS = {
  web_search: tool(
    "web_search",
    "Search the web for current facts, news, prices or research. Cite source URLs in written answers.",
    { query: { type: "string" }, limit: { type: "number", description: "1-8, default 3" } },
    ["query"],
  ),
  save_memory: tool("save_memory", "Remember a lasting fact about the user (never passwords or codes).", { fact: { type: "string" } }, ["fact"]),
  set_reminder: tool("set_reminder", "Create a reminder.", { title: { type: "string" }, due_at: { type: "string", description: "ISO 8601" } }, ["title"]),
  draft_message: tool(
    "draft_message",
    "Draft an email, SMS or WhatsApp for the user to approve. Nothing is sent until they do.",
    {
      channel: { type: "string", enum: ["email", "sms", "whatsapp"] },
      to: { type: "string", description: "Email or phone" },
      subject: { type: "string", description: "Email only" },
      body: { type: "string" },
    },
    ["channel", "to", "body"],
  ),
  update_plan: tool("update_plan", "Record the task's step-by-step plan.", { steps: { type: "array", items: { type: "string" } } }, ["steps"]),
  ask_user: tool("ask_user", "Ask the user for missing information or a decision instead of guessing.", { question: { type: "string" } }, ["question"]),
  start_task: tool(
    "start_task",
    "On a call: hand longer work to the background so the user can hang up. Include every detail they gave.",
    { request: { type: "string" } },
    ["request"],
  ),
  finish: tool(
    "finish",
    "End the task with a short summary and next steps.",
    { summary: { type: "string" }, call_user: { type: "boolean", description: "True if they asked for a call back or results are best explained by phone" } },
    ["summary"],
  ),
};

async function context(userId: string) {
  const { user, memories, reminders } = await read((d) => ({
    user: d.users.find((u) => u.id === userId),
    memories: d.memories.filter((m) => m.userId === userId).slice(-15),
    // Only reminders still to come.
    reminders: d.reminders.filter((r) => r.userId === userId && !r.calledAt).slice(-5),
  }));
  const now = new Date().toLocaleString("en-IN", { timeZone: process.env.APP_TIMEZONE || "Asia/Kolkata", dateStyle: "full", timeStyle: "short" });
  return `You are Vardaan, a voice-first AI assistant that gets everyday tasks done.
User: ${user?.name ?? "unknown"} (${user?.email ?? "-"}). Now: ${now}.
Memory: ${memories.length ? memories.map((m) => m.fact).join("; ") : "none"}
Reminders: ${reminders.length ? reminders.map((r) => `${r.title}${r.dueAt ? ` (${r.dueAt})` : ""}`).join("; ") : "none"}
${await appsSummary(userId)}
Rules:
- Reply in the language of the user's latest message. Warm, brief, plain sentences, no markdown.
- On a call, 1-2 short sentences (spoken aloud). For longer work use start_task and say you'll call back.
- Use tools for live facts; never invent numbers, addresses or contacts: ask.
- Book calendar events only after the user confirms title, time and guests; check clashes first.
- Drafts wait for approval; never say something was sent. Only exception: send_emergency_alert, which sends at once.${mailConfigured() ? " Approved emails are sent automatically." : ""}
- You can't fill forms, pay, or phone businesses: draft what's needed and give next steps.
- Summarise emails and events: the few that matter, not everything.`;
}

function parseArgs(raw: string) {
  try {
    return JSON.parse(raw || "{}") as Record<string, unknown>;
  } catch {
    return {};
  }
}

const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");

/** Cap a tool result before it goes back to the model (saves tokens on every later step). */
const clip = (text: string, max = 1500) => (text.length > max ? `${text.slice(0, max)}
…(trimmed)` : text);

async function saveMemory(userId: string, fact: string) {
  if (!fact) return "No fact given.";
  await write((d) => {
    d.memories.push({ id: newId(), userId, fact, createdAt: now() });
  });
  return "Saved.";
}

async function setReminder(userId: string, title: string, dueAt: string) {
  if (!title) return "No title given.";
  await write((d) => {
    d.reminders.push({ id: newId(), userId, title, dueAt: dueAt || undefined, createdAt: now() });
  });
  return "Reminder set.";
}

function makeDraft(args: Record<string, unknown>): Draft | null {
  const channel = str(args.channel);
  if (channel !== "email" && channel !== "sms" && channel !== "whatsapp") return null;
  const to = str(args.to);
  const body = str(args.body);
  if (!to || !body) return null;
  return { id: newId(), channel, to, subject: str(args.subject) || undefined, body, status: "draft" };
}

// ---------------------------------------------------------------------------------------------
// Talk & Help

export type TalkTurn = { role: "user" | "assistant"; content: string };

export async function talk(userId: string, history: TalkTurn[]) {
  const messages: ChatMessage[] = [{ role: "system", content: await context(userId) }, ...history.slice(-10)];
  const tools = [TOOLS.web_search, TOOLS.save_memory, TOOLS.set_reminder, TOOLS.draft_message, TOOLS.start_task, ...(await appTools(userId))];
  let createdTaskId: string | undefined;
  // Tasks started during the call; the route runs them in the background after responding.
  const startedTaskIds: string[] = [];

  for (let i = 0; i < MAX_STEPS; i++) {
    const { content, toolCalls } = await chat(messages, tools);
    if (!toolCalls.length) return { reply: content?.trim() || "Sorry, I didn't catch that.", taskId: createdTaskId, startedTaskIds };

    messages.push({ role: "assistant", content, tool_calls: toolCalls });
    for (const call of toolCalls) {
      const args = parseArgs(call.function.arguments);
      let result = "Unknown tool.";
      const appResult = await runAppTool(userId, call.function.name, args);

      if (appResult !== null) {
        result = appResult;
      } else if (call.function.name === "web_search") {
        const query = str(args.query);
        const limit = typeof args.limit === "number" ? Math.min(8, Math.max(1, args.limit)) : 3;
        if (!query) {
          result = "A search query is required.";
        } else {
          const results = await webSearch(query, limit);
          result = formatResults(results);
        }
      } else if (call.function.name === "save_memory") {
        result = await saveMemory(userId, str(args.fact));
      } else if (call.function.name === "set_reminder") {
        result = await setReminder(userId, str(args.title), str(args.due_at));
      } else if (call.function.name === "start_task") {
        const request = str(args.request);
        if (!request) result = "Describe the task.";
        else {
          const id = newId();
          await write((d) => {
            d.tasks.push({ id, userId, request, status: "planning", steps: [], answers: [], drafts: [], createdAt: now(), updatedAt: now() });
          });
          startedTaskIds.push(id);
          result = "Task started in the background. Tell the user they can hang up and you'll call them back with the results.";
        }
      } else if (call.function.name === "draft_message") {
        const draft = makeDraft(args);
        if (!draft) result = "Draft needs a channel, a recipient and a body.";
        else {
          // Drafts from a conversation land in the task list for the user to approve.
          const lastUser = [...history].reverse().find((t) => t.role === "user")?.content ?? "Draft a message";
          const id = newId();
          await write((d) => {
            d.tasks.push({
              id,
              userId,
              request: lastUser,
              status: "needs_approval",
              steps: ["Drafted during a call"],
              answers: [],
              drafts: [draft],
              summary: "Drafted during your call. Review and approve to send.",
              createdAt: now(),
              updatedAt: now(),
            });
          });
          createdTaskId = id;
          result = "Draft saved for the user to review and approve.";
        }
      }

      messages.push({ role: "tool", tool_call_id: call.id, content: clip(result) });
    }
  }
  return { reply: "I've noted that. Is there anything else?", taskId: createdTaskId, startedTaskIds };
}

// ---------------------------------------------------------------------------------------------
// Call & Cut

/** A task the user cancelled from the dashboard. Background work must stop and leave it alone. */
const cancelled = (t: Task) => t.status === "failed" && t.error === "Cancelled by user.";

/** Apply a change to a task. Returns false (and changes nothing) if it's gone or was cancelled. */
async function updateTask(id: string, patch: Partial<Task> | ((t: Task) => void)) {
  return write((d) => {
    const t = d.tasks.find((x) => x.id === id);
    if (!t || cancelled(t)) return false;
    if (typeof patch === "function") patch(t);
    else Object.assign(t, patch);
    t.updatedAt = now();
    return true;
  });
}

const isCancelled = (id: string) => read((d) => d.tasks.some((t) => t.id === id && cancelled(t)));

export async function runTask(taskId: string) {
  const task = await read((d) => d.tasks.find((t) => t.id === taskId));
  if (!task || cancelled(task)) return;

  if (!(await updateTask(taskId, { status: "working", question: undefined, error: undefined }))) return;

  const brief = [
    `Task from the user: ${task.request}`,
    ...task.answers.map((a) => `You asked: ${a.question}\nThey answered: ${a.answer}`),
    task.drafts.length ? `Drafts already prepared: ${task.drafts.map((d) => `${d.channel} to ${d.to}`).join(", ")}` : "",
    "Work on this now. First call update_plan, then do the work with your tools. Use web_search for any research. Call ask_user if anything important is missing, otherwise end with finish. Set call_user=true on finish if the user asked to be called with results.",
  ]
    .filter(Boolean)
    .join("\n\n");

  const messages: ChatMessage[] = [
    { role: "system", content: await context(task.userId) },
    { role: "user", content: brief },
  ];
  const tools = [...Object.values(TOOLS), ...(await appTools(task.userId))];

  try {
    for (let i = 0; i < MAX_STEPS; i++) {
      if (await isCancelled(taskId)) return;
      const { content, toolCalls } = await chat(messages, tools);
      if (!toolCalls.length) {
        await finishTask(taskId, content?.trim() || "Done.", false);
        return;
      }
      messages.push({ role: "assistant", content, tool_calls: toolCalls });

      for (const call of toolCalls) {
        const args = parseArgs(call.function.arguments);
        let result = (await runAppTool(task.userId, call.function.name, args)) ?? "Unknown tool.";
        switch (call.function.name) {
          case "web_search": {
            const query = str(args.query);
            const limit = typeof args.limit === "number" ? Math.min(8, Math.max(1, args.limit)) : 3;
            if (!query) {
              result = "A search query is required.";
            } else {
              const results = await webSearch(query, limit);
              result = formatResults(results);
            }
            break;
          }
          case "update_plan": {
            const steps = Array.isArray(args.steps) ? args.steps.map(String).slice(0, 12) : [];
            await updateTask(taskId, { steps });
            result = "Plan recorded.";
            break;
          }
          case "save_memory":
            result = await saveMemory(task.userId, str(args.fact));
            break;
          case "set_reminder":
            result = await setReminder(task.userId, str(args.title), str(args.due_at));
            break;
          case "draft_message": {
            const draft = makeDraft(args);
            if (!draft) result = "Draft needs a channel, a recipient and a body.";
            else {
              await updateTask(taskId, (t) => void t.drafts.push(draft));
              result = "Draft saved for approval.";
            }
            break;
          }
          case "ask_user": {
            const question = str(args.question) || "Can you tell me more?";
            if (!(await updateTask(taskId, { status: "needs_input", question }))) return;
            await notifyUser(task.userId, `Vardaan: ${question}\nAnswer it on your Vardaan dashboard.`);
            return;
          }
          case "finish": {
            const callUser = Boolean(args.call_user);
            await finishTask(taskId, str(args.summary) || "Done.", callUser);
            return;
          }
        }
        messages.push({ role: "tool", tool_call_id: call.id, content: clip(result) });
      }
    }
    await finishTask(taskId, "I've done what I can on this. Review the details below.", false);
  } catch (err) {
    await updateTask(taskId, { status: "failed", error: err instanceof Error ? err.message : "Something went wrong." });
  }
}

async function finishTask(taskId: string, summary: string, callUser: boolean) {
  const task = await write((d) => {
    const t = d.tasks.find((x) => x.id === taskId);
    if (!t || cancelled(t)) return null;
    t.summary = summary;
    t.status = t.drafts.some((x) => x.status === "draft") ? "needs_approval" : "done";
    t.updatedAt = now();
    return { ...t };
  });
  if (!task) return;

  // Only finished results are delivered by call. A task waiting for approval always gets the
  // approval message, because a call can't approve drafts.
  if (callUser && task.status === "done") {
    // Call the user to deliver the results over the phone.
    try {
      const { startCall } = await import("@/lib/phone");
      const reason = `Task result: ${task.request.slice(0, 120)}`;
      const callId = await startCall(task.userId, reason, taskId);
      // Link the call to this task for dashboard display.
      await write((d) => {
        const c = d.calls.find((x) => x.id === callId);
        if (c && !c.taskIds.includes(taskId)) c.taskIds.push(taskId);
      });
      return; // The call delivers the result; skip the text notification.
    } catch {
      // Fall through to text notification if call fails.
    }
  }

  await notifyUser(
    task.userId,
    task.status === "needs_approval"
      ? `Vardaan: ${summary}\nOpen your Vardaan dashboard to review and approve it.`
      : `Vardaan: Done. ${summary}`,
  );
}
