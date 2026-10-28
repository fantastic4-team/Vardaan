import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { read, write, now } from "@/lib/db";

// GET /api/tasks/:id — fetch one task (owned by the current user).
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Please log in." }, { status: 401 });
  const { id } = await params;
  const task = await read((d) => d.tasks.find((t) => t.id === id && t.userId === user.id));
  if (!task) return NextResponse.json({ error: "Task not found." }, { status: 404 });
  return NextResponse.json(task);
}

// DELETE /api/tasks/:id — cancel a pending or in-progress task.
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Please log in." }, { status: 401 });
  const { id } = await params;
  const updated = await write((d) => {
    const t = d.tasks.find((x) => x.id === id && x.userId === user.id);
    if (!t) return null;
    if (t.status === "done" || t.status === "failed") return null; // Cannot cancel completed tasks.
    t.status = "failed";
    t.error = "Cancelled by user.";
    t.updatedAt = now();
    return { ...t };
  });
  if (!updated) return NextResponse.json({ error: "Task not found or already completed." }, { status: 404 });
  return NextResponse.json(updated);
}
