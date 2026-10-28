import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { read } from "@/lib/db";

// GET /api/calls — list all calls for the current user (most recent first).
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Please log in." }, { status: 401 });
  const calls = await read((d) =>
    d.calls
      .filter((c) => c.userId === user.id)
      .sort((a, b) => b.startedAt.localeCompare(a.startedAt))
  );
  return NextResponse.json(calls);
}
