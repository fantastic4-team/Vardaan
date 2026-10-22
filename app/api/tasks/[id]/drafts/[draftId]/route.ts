import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { now, write } from "@/lib/db";
import { mailConfigured, sendEmail } from "@/lib/mail";

// Approve (optionally with edits) or discard a draft. Approved emails are sent over SMTP when
// it's configured. SMS and WhatsApp are handed back as links that open the user's own app with
// the message filled in, which is free and keeps the user in control of sending.
export async function POST(req: Request, { params }: { params: Promise<{ id: string; draftId: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Please log in." }, { status: 401 });
  const { id, draftId } = await params;
  const body = await req.json().catch(() => null);
  const action = body?.action === "discard" ? "discard" : "approve";
  const edited = typeof body?.body === "string" ? body.body.trim() : "";

  const draft = await write((d) => {
    const t = d.tasks.find((x) => x.id === id && x.userId === user.id);
    const dr = t?.drafts.find((x) => x.id === draftId);
    if (!t || !dr || dr.status !== "draft") return null;
    if (edited) dr.body = edited.slice(0, 8000);
    if (action === "discard") t.drafts = t.drafts.filter((x) => x.id !== draftId);
    return { ...dr };
  });
  if (!draft) return NextResponse.json({ error: "Draft not found." }, { status: 404 });

  let link: string | undefined;
  let status: "sent" | "approved" | "failed" = "sent";
  let error: string | undefined;

  if (action === "approve") {
    if (draft.channel !== "email" || !mailConfigured()) status = "approved";
    if (draft.channel === "email") {
      if (mailConfigured()) {
        try {
          await sendEmail({ to: draft.to, subject: draft.subject || "(no subject)", body: draft.body, replyTo: user.email });
        } catch (err) {
          status = "failed";
          error = err instanceof Error ? err.message : "Could not send.";
        }
      } else {
        link = `mailto:${encodeURIComponent(draft.to)}?subject=${encodeURIComponent(draft.subject || "")}&body=${encodeURIComponent(draft.body)}`;
      }
    } else if (draft.channel === "whatsapp") {
      link = `https://wa.me/${draft.to.replace(/[^\d]/g, "")}?text=${encodeURIComponent(draft.body)}`;
    } else {
      link = `sms:${draft.to.replace(/[^\d+]/g, "")}?body=${encodeURIComponent(draft.body)}`;
    }
  }

  await write((d) => {
    const t = d.tasks.find((x) => x.id === id && x.userId === user.id);
    if (!t) return;
    const dr = t.drafts.find((x) => x.id === draftId);
    if (dr && action === "approve") {
      dr.status = status;
      dr.error = error;
    }
    if (t.status === "needs_approval" && !t.drafts.some((x) => x.status === "draft")) t.status = "done";
    t.updatedAt = now();
  });

  if (error) return NextResponse.json({ error }, { status: 502 });
  return NextResponse.json({ ok: true, link });
}
