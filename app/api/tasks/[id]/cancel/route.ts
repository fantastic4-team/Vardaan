import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { write, now } from "@/lib/db";

// POST /api/tasks/:id/cancel — explicit cancel endpoint (alias for DELETE on the task route).
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Please log in." }, { status: 401 });
  const { id } = await params;
  const updated = await write((d) => {
    const t = d.tasks.find((x) => x.id === id && x.userId === user.id);
    if (!t) return null;
    if (t.status === "done" || t.status === "failed") return null;
    t.status = "failed";
    t.error = "Cancelled by user.";
    t.updatedAt = now();
    return { ...t };
  });
  if (!updated) return NextResponse.json({ error: "Task not found or already completed." }, { status: 404 });
  return NextResponse.json(updated);
}
