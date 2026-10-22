import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { newId, now, write } from "@/lib/db";

// Teach Vardaan something directly from the dashboard.
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Please log in." }, { status: 401 });
  const body = await req.json().catch(() => null);
  const fact = typeof body?.fact === "string" ? body.fact.trim().slice(0, 300) : "";
  if (!fact) return NextResponse.json({ error: "Write something for Vardaan to remember." }, { status: 400 });
  const memory = { id: newId(), userId: user.id, fact, createdAt: now() };
  await write((d) => void d.memories.push(memory));
  return NextResponse.json(memory);
}
