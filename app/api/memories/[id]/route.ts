import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { write } from "@/lib/db";

// Let the user make Vardaan forget something.
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Please log in." }, { status: 401 });
  const { id } = await params;
  await write((d) => {
    d.memories = d.memories.filter((m) => !(m.id === id && m.userId === user.id));
  });
  return NextResponse.json({ ok: true });
}
