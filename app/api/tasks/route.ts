import { NextResponse, after } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { runTask } from "@/lib/agent";
import { newId, now, read, write } from "@/lib/db";

// Everything the console needs for the signed-in user.
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Please log in." }, { status: 401 });
  const data = await read((d) => ({
    tasks: d.tasks.filter((t) => t.userId === user.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    memories: d.memories.filter((m) => m.userId === user.id),
    reminders: d.reminders.filter((r) => r.userId === user.id),
    calls: d.calls.filter((c) => c.userId === user.id).sort((a, b) => b.startedAt.localeCompare(a.startedAt)),
    messages: d.messages.filter((m) => m.userId === user.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  }));
  return NextResponse.json(data);
}

// Call & Cut: create a task and let the agent work on it after the response is sent.
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Please log in." }, { status: 401 });
  const body = await req.json().catch(() => null);
  const request = typeof body?.request === "string" ? body.request.trim().slice(0, 4000) : "";
  if (!request) return NextResponse.json({ error: "Tell Vardaan what you need." }, { status: 400 });

  const id = newId();
  await write((d) => {
    d.tasks.push({ id, userId: user.id, request, status: "planning", steps: [], answers: [], drafts: [], createdAt: now(), updatedAt: now() });
  });
  after(() => runTask(id));
  return NextResponse.json({ id });
}
