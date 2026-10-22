import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { approveDraft, discardDraft } from "@/lib/drafts";

// Approve (optionally with edits) or discard a draft from the dashboard.
export async function POST(req: Request, { params }: { params: Promise<{ id: string; draftId: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Please log in." }, { status: 401 });
  const { id, draftId } = await params;
  const body = await req.json().catch(() => null);

  if (body?.action === "discard") {
    return (await discardDraft(user.id, id, draftId))
      ? NextResponse.json({ ok: true })
      : NextResponse.json({ error: "Draft not found." }, { status: 404 });
  }

  const edited = typeof body?.body === "string" ? body.body.trim() : undefined;
  const result = await approveDraft(user, id, draftId, edited);
  if ("notFound" in result) return NextResponse.json({ error: result.error }, { status: 404 });
  if (result.error) return NextResponse.json({ error: result.error }, { status: 502 });
  return NextResponse.json({ ok: true, link: result.link, status: result.status });
}
