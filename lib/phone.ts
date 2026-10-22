import { newId, now, read, write, type CallLog } from "@/lib/db";
import { createCall, sendSms, twilioConfigured } from "@/lib/twilio";

// Phone features on top of Twilio: placing calls to a user, and texting them updates.
// Every call and message is logged so the dashboard can show the full history.

export async function startCall(userId: string, reason: string) {
  if (!twilioConfigured()) throw new Error("Phone calls aren't set up yet. Add your Twilio keys and PUBLIC_URL to .env.local.");
  const user = await read((d) => d.users.find((u) => u.id === userId));
  if (!user?.phone) throw new Error("Add your phone number in Settings first.");

  const call: CallLog = {
    id: newId(),
    userId,
    direction: "outbound",
    reason,
    phone: user.phone,
    status: "queued",
    turns: [],
    silences: 0,
    taskIds: [],
    startedAt: now(),
  };
  await write((d) => void d.calls.push(call));

  try {
    const { sid } = await createCall(user.phone, `/api/voice/answer?call=${call.id}`, `/api/voice/status?call=${call.id}`);
    await updateCall(call.id, { twilioSid: sid });
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

/** Text the user, if phone features are set up and they have a number. Never throws. */
export async function notifyUser(userId: string, body: string) {
  if (!twilioConfigured()) return;
  const user = await read((d) => d.users.find((u) => u.id === userId));
  if (!user?.phone) return;
  let status: "sent" | "failed" = "sent";
  let error: string | undefined;
  try {
    await sendSms(user.phone, body);
  } catch (err) {
    status = "failed";
    error = err instanceof Error ? err.message : "Could not send.";
  }
  await write((d) => void d.messages.push({ id: newId(), userId, direction: "outbound", body, status, error, createdAt: now() }));
}
