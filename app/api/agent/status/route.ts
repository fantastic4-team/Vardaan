import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { read } from "@/lib/db";
import { provider } from "@/lib/llm";
import { sarvamCallsConfigured } from "@/lib/sarvam-calls";

// GET /api/agent/status — the agent's current disposition for the signed-in user.
// Returns whether the agent is idle, actively working on tasks, or on a call.
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Please log in." }, { status: 401 });

  const { activeTasks, activeCalls } = await read((d) => ({
    activeTasks: d.tasks.filter((t) => t.userId === user.id && (t.status === "planning" || t.status === "working")),
    activeCalls: d.calls.filter(
      (c) => c.userId === user.id && (c.status === "queued" || c.status === "ringing" || c.status === "in-progress"),
    ),
  }));

  let agentStatus: string;
  if (!provider()) {
    agentStatus = "Offline";
  } else if (activeCalls.length > 0) {
    const call = activeCalls[0];
    if (call.status === "queued" || call.status === "ringing") {
      agentStatus = "Preparing Call";
    } else {
      agentStatus = "On Call";
    }
  } else if (activeTasks.length > 0) {
    agentStatus = "Executing Task";
  } else {
    agentStatus = "Idle";
  }

  return NextResponse.json({
    status: agentStatus,
    ai: provider()?.name ?? null,
    phone: sarvamCallsConfigured(),
    activeTasks: activeTasks.length,
    activeCalls: activeCalls.length,
  });
}
