import { now, read, write } from "@/lib/db";
import { startCall } from "@/lib/phone";
import { sarvamCallsConfigured } from "@/lib/sarvam-calls";

// Background loop on the server: when a reminder comes due, Vardaan phones the user about it.
// Runs inside the long-lived Node server (npm run dev / npm start). Serverless hosts need a cron
// job calling the same check instead.

const EVERY_MS = 30_000;

export async function callDueReminders() {
  if (!sarvamCallsConfigured()) return;
  const due = await write((d) => {
    const list = d.reminders.filter((r) => r.dueAt && !r.calledAt && Date.parse(r.dueAt) <= Date.now());
    const withPhone = list.filter((r) => d.users.find((u) => u.id === r.userId)?.phone);
    withPhone.forEach((r) => (r.calledAt = now()));
    return withPhone.map((r) => ({ userId: r.userId, title: r.title }));
  });
  for (const r of due) {
    await startCall(r.userId, `Reminder: ${r.title}`).catch((err) => console.error("reminder call failed", err));
  }
}

/**
 * Close calls whose end-of-call webhook never arrived (usually because the tunnel was down), so
 * they don't sit at "ringing" forever and keep the agent looking busy.
 */
export async function expireStuckCalls() {
  const t = Date.now();
  await write((d) => {
    for (const c of d.calls) {
      const age = t - Date.parse(c.startedAt);
      const stuckRinging = (c.status === "queued" || c.status === "ringing") && age > 10 * 60_000;
      const stuckLive = c.status === "in-progress" && age > 60 * 60_000;
      if (!stuckRinging && !stuckLive) continue;
      c.status = c.turns.length > 1 ? "completed" : "failed";
      c.endedAt ??= now();
      c.error ??= "No call result from Sarvam. Is `npm run tunnel` running?";
    }
  });
}

export function startScheduler() {
  const g = globalThis as unknown as { __vardaanScheduler?: NodeJS.Timeout };
  if (g.__vardaanScheduler) return;
  g.__vardaanScheduler = setInterval(() => {
    void callDueReminders().catch(() => {});
    void expireStuckCalls().catch(() => {});
  }, EVERY_MS);
  void read(() => null); // warm the store
}
