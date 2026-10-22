import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { talk, type TalkTurn } from "@/lib/agent";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Please log in." }, { status: 401 });

  const body = await req.json().catch(() => null);
  const history: TalkTurn[] = Array.isArray(body?.history)
    ? body.history
        .filter((t: TalkTurn) => (t?.role === "user" || t?.role === "assistant") && typeof t.content === "string")
        .map((t: TalkTurn) => ({ role: t.role, content: t.content.slice(0, 4000) }))
    : [];
  if (!history.length || history[history.length - 1].role !== "user")
    return NextResponse.json({ error: "Say something first." }, { status: 400 });

  try {
    return NextResponse.json(await talk(user.id, history));
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "The agent ran into a problem." }, { status: 502 });
  }
}
