import { now, write } from "@/lib/db";
import { mailConfigured, sendEmail } from "@/lib/mail";

type Who = { id: string; email: string };

/**
 * Approve a draft (optionally with an edited body). Emails go out over SMTP when it is set up;
 * otherwise, and for SMS and WhatsApp, the user gets a link that opens their own app with the
 * message filled in.
 */
export async function approveDraft(user: Who, taskId: string, draftId: string, editedBody?: string) {
  const draft = await write((d) => {
    const t = d.tasks.find((x) => x.id === taskId && x.userId === user.id);
    const dr = t?.drafts.find((x) => x.id === draftId);
    if (!dr || dr.status !== "draft") return null;
    if (editedBody) dr.body = editedBody.slice(0, 8000);
    return { ...dr };
  });
  if (!draft) return { error: "Draft not found.", notFound: true as const };

  let status: "sent" | "approved" | "failed" = "approved";
  let link: string | undefined;
  let error: string | undefined;

  try {
    if (draft.channel === "email" && mailConfigured()) {
      await sendEmail({ to: draft.to, subject: draft.subject || "(no subject)", body: draft.body, replyTo: user.email });
      status = "sent";
    } else if (draft.channel === "email") {
      link = `mailto:${encodeURIComponent(draft.to)}?subject=${encodeURIComponent(draft.subject || "")}&body=${encodeURIComponent(draft.body)}`;
    } else if (draft.channel === "whatsapp") {
      link = `https://wa.me/${draft.to.replace(/[^\d]/g, "")}?text=${encodeURIComponent(draft.body)}`;
    } else {
      link = `sms:${draft.to.replace(/[^\d+]/g, "")}?body=${encodeURIComponent(draft.body)}`;
    }
  } catch (err) {
    status = "failed";
    error = err instanceof Error ? err.message : "Could not send.";
  }

  await write((d) => {
    const t = d.tasks.find((x) => x.id === taskId && x.userId === user.id);
    const dr = t?.drafts.find((x) => x.id === draftId);
    if (!t || !dr) return;
    dr.status = status;
    dr.error = error;
    if (t.status === "needs_approval" && !t.drafts.some((x) => x.status === "draft")) t.status = "done";
    t.updatedAt = now();
  });

  return { status, link, error };
}

export async function discardDraft(userId: string, taskId: string, draftId: string) {
  return write((d) => {
    const t = d.tasks.find((x) => x.id === taskId && x.userId === userId);
    if (!t || !t.drafts.some((x) => x.id === draftId && x.status === "draft")) return false;
    t.drafts = t.drafts.filter((x) => x.id !== draftId);
    if (t.status === "needs_approval" && !t.drafts.some((x) => x.status === "draft")) t.status = "done";
    t.updatedAt = now();
    return true;
  });
}
