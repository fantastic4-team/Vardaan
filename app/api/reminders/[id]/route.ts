import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { write } from "@/lib/db";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Please log in." }, { status: 401 });
  const { id } = await params;
  await write((d) => {
    d.reminders = d.reminders.filter((r) => !(r.id === id && r.userId === user.id));
  });
  return NextResponse.json({ ok: true });
}
