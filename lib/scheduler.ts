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

export function startScheduler() {
  const g = globalThis as unknown as { __vardaanScheduler?: NodeJS.Timeout };
  if (g.__vardaanScheduler) return;
  g.__vardaanScheduler = setInterval(() => void callDueReminders().catch(() => {}), EVERY_MS);
  void read(() => null); // warm the store
}
