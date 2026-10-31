import { newId, now, read, write } from "@/lib/db";
import { DEMO_USER_ID } from "@/lib/demo";
import { canSendGmail, googleLinkFor, sendGmail, TIME_ZONE } from "@/lib/google";
import { mailConfigured, sendEmail } from "@/lib/mail";

// Emergency alerts: the one thing Vardaan sends without asking. When the user tells it to alert
// their emergency contact (saved in Settings), the message is emailed straight away, through SMTP if
// that's set up, otherwise from the user's own Gmail. Every alert is logged on the Messages page.

export async function emergencyContact(userId: string) {
  const u = await read((d) => d.users.find((x) => x.id === userId));
  return u?.emergencyEmail ? { name: u.emergencyName || "", email: u.emergencyEmail } : null;
}

/** How alerts would be sent for this user right now, or null if they can't be. */
export async function alertChannel(userId: string): Promise<"smtp" | "gmail" | null> {
  if (mailConfigured()) return "smtp";
  return canSendGmail(await googleLinkFor(userId)) ? "gmail" : null;
}

/** Email the emergency contact now. Returns a sentence for the agent; never throws. */
export async function sendEmergencyAlert(userId: string, message: string) {
  if (userId === DEMO_USER_ID) return "The demo account can't send emergency alerts.";
  const user = await read((d) => d.users.find((u) => u.id === userId));
  if (!user) return "User not found.";
  if (!user.emergencyEmail) return "No emergency contact is saved. Ask the user to add one in Vardaan's Settings.";
  const text = message.trim() || "I need help. Please contact me as soon as you can.";

  const channel = await alertChannel(userId);
  const to = user.emergencyEmail;
  const contact = user.emergencyName ? `${user.emergencyName} (${to})` : to;
  const when = new Date().toLocaleString("en-IN", { timeZone: TIME_ZONE, dateStyle: "medium", timeStyle: "short" });
  const mail = {
    to,
    subject: `URGENT: message from ${user.name} via Vardaan`,
    body: [
      `${user.name} asked Vardaan, their AI assistant, to send you this message right away:`,
      "",
      `"${text}"`,
      "",
      `Sent: ${when}`,
      user.phone ? `Call ${user.name.split(" ")[0]}: ${user.phone}` : "",
      `Email: ${user.email}`,
      "",
      "You're receiving this because you're saved as their emergency contact in Vardaan.",
    ]
      .filter((l) => l !== null)
      .join("\n"),
    replyTo: user.email,
  };

  let status: "sent" | "failed" = "sent";
  let error: string | undefined;
  try {
    if (channel === "smtp") await sendEmail(mail);
    else if (channel === "gmail") await sendGmail(userId, mail);
    else throw new Error("Email sending isn't set up. In Settings, press Connect Google (or add SMTP settings).");
  } catch (err) {
    status = "failed";
    error = err instanceof Error ? err.message : "Could not send.";
  }

  await write((d) => void d.messages.push({ id: newId(), userId, direction: "outbound", body: `🚨 Emergency email to ${contact}: ${text}`, status, error, createdAt: now() }));
  console.log(`Emergency alert to ${to}: ${status}${error ? ` (${error})` : ""}`);
  return status === "sent"
    ? `Emergency email sent to ${contact}. Tell the user it's sent. If they are in danger, also tell them to call 112.`
    : `The emergency email could NOT be sent: ${error} Tell the user plainly, and if they are in danger, to call 112 now.`;
}
