import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { startCall } from "@/lib/phone";

// POST /api/calls/request — request an outbound call with a specific reason or task.
// This is an idempotent endpoint: the response includes the call ID immediately.
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Please log in." }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const reason = typeof body?.reason === "string" ? body.reason.trim() : "Call me";
  const taskId = typeof body?.taskId === "string" ? body.taskId : undefined;

  try {
    const callId = await startCall(user.id, reason || "Call me", taskId);
    return NextResponse.json({ id: callId });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Could not place the call." }, { status: 400 });
  }
}
