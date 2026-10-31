import { newId, now, read, write, type CallLog } from "@/lib/db";
import { DEMO_USER_ID } from "@/lib/demo";
import { mailConfigured, sendEmail } from "@/lib/mail";
import { placeSarvamCall, sarvamCallsConfigured } from "@/lib/sarvam-calls";

// Phone features: Vardaan calls the user on a Sarvam number (lib/sarvam-calls.ts), and sends them
// updates by email (Sarvam has no SMS). Every call and message is logged for the dashboard.

/** Normalise an Indian or international number to E.164 (+919876543210), or null if invalid. */
export function normalisePhone(input: string) {
  const digits = input.replace(/[^\d+]/g, "");
  if (/^\+\d{8,15}$/.test(digits)) return digits;
  const plain = digits.replace(/\D/g, "");
  if (/^[6-9]\d{9}$/.test(plain)) return `+91${plain}`;
  if (/^0[6-9]\d{9}$/.test(plain)) return `+91${plain.slice(1)}`;
  if (/^91[6-9]\d{9}$/.test(plain)) return `+${plain}`;
  return null;
}

/**
 * Initiate an outbound call to the user.
 * @param userId   – Owner of the call.
 * @param reason   – Human-readable reason shown in the dashboard.
 * @param taskId   – Optional task that triggered this call; linked in the call log.
 */
export async function startCall(userId: string, reason: string, taskId?: string) {
  if (userId === DEMO_USER_ID) throw new Error("The demo can't place calls. Create a free account to talk to Vardaan.");
  if (!sarvamCallsConfigured()) throw new Error("Phone calls aren't set up yet. Add your Sarvam settings and PUBLIC_URL to .env.local (see docs/SARVAM_SETUP.md).");
  const user = await read((d) => d.users.find((u) => u.id === userId));
  if (!user?.phone) throw new Error("Add your phone number in Settings first.");
  if (taskId && !(await read((d) => d.tasks.some((t) => t.id === taskId && t.userId === userId)))) throw new Error("Task not found.");

  const call: CallLog = {
    id: newId(),
    userId,
    direction: "outbound",
    reason,
    phone: user.phone,
    status: "queued",
    turns: [],
    silences: 0,
    taskIds: taskId ? [taskId] : [],
    startedAt: now(),
  };
  await write((d) => void d.calls.push(call));

  try {
    await updateCall(call.id, { sarvamAttemptId: await placeSarvamCall(call, user), status: "ringing" });
  } catch (err) {
    const error = err instanceof Error ? err.message : "Could not place the call.";
    await updateCall(call.id, { status: "failed", error, endedAt: now() });
    throw new Error(error);
  }
  return call.id;
}

export async function updateCall(id: string, patch: Partial<CallLog> | ((c: CallLog) => void)) {
  return write((d) => {
    const c = d.calls.find((x) => x.id === id);
    if (!c) return null;
    if (typeof patch === "function") patch(c);
    else Object.assign(c, patch);
    return { ...c };
  });
}

/**
 * Send the user an update. Emailed when SMTP is set up; always logged so it shows on the dashboard.
 * Never throws.
 */
export async function notifyUser(userId: string, body: string) {
  if (userId === DEMO_USER_ID) return;
  const user = await read((d) => d.users.find((u) => u.id === userId));
  if (!user) return;
  let status: "sent" | "failed" = "sent";
  let error: string | undefined;
  if (mailConfigured()) {
    try {
      await sendEmail({ to: user.email, subject: body.split("\n")[0].slice(0, 120), body });
    } catch (err) {
      status = "failed";
      error = err instanceof Error ? err.message : "Could not send.";
    }
  }
  await write((d) => void d.messages.push({ id: newId(), userId, direction: "outbound", body, status, error, createdAt: now() }));
}
