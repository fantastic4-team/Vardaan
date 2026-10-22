import { chat, type ChatMessage, type ToolSpec } from "@/lib/llm";
import { mailConfigured } from "@/lib/mail";
import { newId, now, read, write, type Draft, type Task } from "@/lib/db";

// The Vardaan agent. Two entry points, matching the product's two modes:
//   talk()    – Talk & Help: a live conversation; replies are short and spoken aloud.
//   runTask() – Call & Cut: works on a task in the background, plans it, drafts what's needed,
//               and stops to ask the user whenever information is missing or approval is needed.
// The agent never sends anything on its own: drafts wait for the user to approve them.

const MAX_STEPS = 8;

const tool = (name: string, description: string, properties: Record<string, unknown>, required: string[]): ToolSpec => ({
  type: "function",
  function: { name, description, parameters: { type: "object", properties, required } },
});

const TOOLS = {
  save_memory: tool(
    "save_memory",
    "Remember a lasting fact or preference about the user (their name, city, family, preferred language, usual contacts). Do not store passwords or one-time codes.",
    { fact: { type: "string", description: "One short sentence." } },
    ["fact"],
  ),
  set_reminder: tool(
    "set_reminder",
    "Create a reminder for the user.",
    {
      title: { type: "string" },
      due_at: { type: "string", description: "ISO 8601 date-time, if the user gave a time." },
    },
    ["title"],
  ),
  draft_message: tool(
    "draft_message",
    "Draft an email, SMS or WhatsApp message on the user's behalf. It is saved for the user to review and approve; nothing is sent until they do.",
    {
      channel: { type: "string", enum: ["email", "sms", "whatsapp"] },
      to: { type: "string", description: "Email address or phone number of the recipient." },
      subject: { type: "string", description: "Email subject. Omit for SMS and WhatsApp." },
      body: { type: "string" },
    },
    ["channel", "to", "body"],
  ),
  update_plan: tool(
    "update_plan",
    "Record the step-by-step plan for the current task, shown to the user as progress.",
    { steps: { type: "array", items: { type: "string" } } },
    ["steps"],
  ),
  ask_user: tool(
    "ask_user",
    "Stop and ask the user for missing information or a decision. Use whenever guessing would be risky.",
    { question: { type: "string" } },
    ["question"],
  ),
  finish: tool(
    "finish",
    "Finish the task with a short summary of what was done and what the user should do next.",
    { summary: { type: "string" } },
    ["summary"],
  ),
};

async function context(userId: string) {
  const { user, memories, reminders } = await read((d) => ({
    user: d.users.find((u) => u.id === userId),
    memories: d.memories.filter((m) => m.userId === userId).slice(-30),
    reminders: d.reminders.filter((r) => r.userId === userId).slice(-10),
  }));
  return `You are Vardaan, a voice-first AI agent that gets everyday tasks done for people.

The user is ${user?.name ?? "a user"} (${user?.email ?? "no email"}). Current time: ${new Date().toString()}.
What you remember about them:
${memories.length ? memories.map((m) => `- ${m.fact}`).join("\n") : "- nothing yet"}
Their reminders:
${reminders.length ? reminders.map((r) => `- ${r.title}${r.dueAt ? ` (${r.dueAt})` : ""}`).join("\n") : "- none"}

How you work:
- Reply in the same language the user speaks, including Hinglish or any mix.
- Be warm, brief and practical. Plain sentences, no markdown, no lists unless asked.
- You can: remember preferences, set reminders, explain documents and bills, think through decisions,
  and draft emails, SMS and WhatsApp messages. ${mailConfigured() ? "Approved emails are sent automatically." : "Email sending is not connected yet, so approved emails can be copied and sent by the user."}
- You cannot browse websites, fill web forms, make payments or phone businesses yourself yet. When a task needs
  that, say so honestly and do the most useful part: draft the message, script or complaint, and list next steps.
- Never invent facts like order numbers, addresses or phone numbers. Ask instead.
- Never claim something was sent. Drafts wait for the user's approval.`;
}

function parseArgs(raw: string) {
  try {
    return JSON.parse(raw || "{}") as Record<string, unknown>;
  } catch {
    return {};
  }
}

const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");

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
  const messages: ChatMessage[] = [{ role: "system", content: await context(userId) }, ...history.slice(-20)];
  const tools = [TOOLS.save_memory, TOOLS.set_reminder, TOOLS.draft_message];
  let createdTaskId: string | undefined;

  for (let i = 0; i < MAX_STEPS; i++) {
    const { content, toolCalls } = await chat(messages, tools);
    if (!toolCalls.length) return { reply: content?.trim() || "Sorry, I didn't catch that.", taskId: createdTaskId };

    messages.push({ role: "assistant", content, tool_calls: toolCalls });
    for (const call of toolCalls) {
      const args = parseArgs(call.function.arguments);
      let result = "Unknown tool.";
      if (call.function.name === "save_memory") result = await saveMemory(userId, str(args.fact));
      if (call.function.name === "set_reminder") result = await setReminder(userId, str(args.title), str(args.due_at));
      if (call.function.name === "draft_message") {
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
      messages.push({ role: "tool", tool_call_id: call.id, content: result });
    }
  }
  return { reply: "I've noted that. Is there anything else?", taskId: createdTaskId };
}

// ---------------------------------------------------------------------------------------------
// Call & Cut

async function updateTask(id: string, patch: Partial<Task> | ((t: Task) => void)) {
  await write((d) => {
    const t = d.tasks.find((x) => x.id === id);
    if (!t) return;
    if (typeof patch === "function") patch(t);
    else Object.assign(t, patch);
    t.updatedAt = now();
  });
}

export async function runTask(taskId: string) {
  const task = await read((d) => d.tasks.find((t) => t.id === taskId));
  if (!task) return;

  await updateTask(taskId, { status: "working", question: undefined, error: undefined });

  const brief = [
    `Task from the user: ${task.request}`,
    ...task.answers.map((a) => `You asked: ${a.question}\nThey answered: ${a.answer}`),
    task.drafts.length ? `Drafts already prepared: ${task.drafts.map((d) => `${d.channel} to ${d.to}`).join(", ")}` : "",
    "Work on this now. First call update_plan, then do the work with your tools. Call ask_user if anything important is missing, otherwise end with finish.",
  ]
    .filter(Boolean)
    .join("\n\n");

  const messages: ChatMessage[] = [
    { role: "system", content: await context(task.userId) },
    { role: "user", content: brief },
  ];
  const tools = Object.values(TOOLS);

  try {
    for (let i = 0; i < MAX_STEPS; i++) {
      const { content, toolCalls } = await chat(messages, tools);
      if (!toolCalls.length) {
        await finishTask(taskId, content?.trim() || "Done.");
        return;
      }
      messages.push({ role: "assistant", content, tool_calls: toolCalls });

      for (const call of toolCalls) {
        const args = parseArgs(call.function.arguments);
        let result = "Unknown tool.";
        switch (call.function.name) {
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
          case "ask_user":
            await updateTask(taskId, { status: "needs_input", question: str(args.question) || "Can you tell me more?" });
            return;
          case "finish":
            await finishTask(taskId, str(args.summary) || "Done.");
            return;
        }
        messages.push({ role: "tool", tool_call_id: call.id, content: result });
      }
    }
    await finishTask(taskId, "I've done what I can on this. Review the details below.");
  } catch (err) {
    await updateTask(taskId, { status: "failed", error: err instanceof Error ? err.message : "Something went wrong." });
  }
}

async function finishTask(taskId: string, summary: string) {
  await updateTask(taskId, (t) => {
    t.summary = summary;
    t.status = t.drafts.some((d) => d.status === "draft") ? "needs_approval" : "done";
  });
}
