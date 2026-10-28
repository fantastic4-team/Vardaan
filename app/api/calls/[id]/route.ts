import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { read } from "@/lib/db";

// GET /api/calls/:id — fetch one call record owned by the current user.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Please log in." }, { status: 401 });
  const { id } = await params;
  const call = await read((d) => d.calls.find((c) => c.id === id && c.userId === user.id));
  if (!call) return NextResponse.json({ error: "Call not found." }, { status: 404 });
  return NextResponse.json(call);
}
