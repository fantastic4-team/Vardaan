import { NextResponse, after } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { runTask } from "@/lib/agent";
import { now, write } from "@/lib/db";

// The user answers the agent's question; the agent picks the task back up.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Please log in." }, { status: 401 });
  const { id } = await params;
  const body = await req.json().catch(() => null);
  const answer = typeof body?.answer === "string" ? body.answer.trim().slice(0, 2000) : "";
  if (!answer) return NextResponse.json({ error: "Type or say your answer." }, { status: 400 });

  const ok = await write((d) => {
    const t = d.tasks.find((x) => x.id === id && x.userId === user.id);
    if (!t || t.status !== "needs_input") return false;
    t.answers.push({ question: t.question ?? "", answer });
    t.question = undefined;
    t.status = "planning";
    t.updatedAt = now();
    return true;
  });
  if (!ok) return NextResponse.json({ error: "This task isn't waiting for an answer." }, { status: 409 });
  after(() => runTask(id));
  return NextResponse.json({ ok: true });
}
