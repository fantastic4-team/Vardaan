import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { newId, now, write } from "@/lib/db";

// Create a reminder. When it is due, the dashboard rings like an incoming call.
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Please log in." }, { status: 401 });
  const body = await req.json().catch(() => null);
  const title = typeof body?.title === "string" ? body.title.trim().slice(0, 200) : "";
  const dueAt =
    typeof body?.dueAt === "string" && !Number.isNaN(Date.parse(body.dueAt)) ? new Date(body.dueAt).toISOString() : undefined;
  if (!title) return NextResponse.json({ error: "What should Vardaan remind you about?" }, { status: 400 });
  const reminder = { id: newId(), userId: user.id, title, dueAt, createdAt: now() };
  await write((d) => void d.reminders.push(reminder));
  return NextResponse.json(reminder);
}
