import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { startCall } from "@/lib/phone";

// "Call me" from the dashboard: Vardaan rings the user's phone.
export async function POST() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Please log in." }, { status: 401 });
  try {
    return NextResponse.json({ id: await startCall(user.id, "Call me") });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Could not call." }, { status: 400 });
  }
}
