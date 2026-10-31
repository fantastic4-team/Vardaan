import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { unlinkGoogle } from "@/lib/google";

// POST /api/google/disconnect: forget the user's Google tokens and revoke Vardaan's access.
export async function POST() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Please log in." }, { status: 401 });
  await unlinkGoogle(user.id);
  return NextResponse.json({ ok: true });
}
