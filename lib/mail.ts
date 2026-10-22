import nodemailer from "nodemailer";

// Sends email over SMTP. Free with a Gmail account and an app password
// (Google Account → Security → App passwords). Without SMTP settings, drafts stay drafts.

export function mailConfigured() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

export async function sendEmail({ to, subject, body, replyTo }: { to: string; subject: string; body: string; replyTo?: string }) {
  if (!mailConfigured()) throw new Error("Email sending isn't set up yet. Add SMTP settings to .env.local.");
  const port = Number(process.env.SMTP_PORT || 465);
  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  await transport.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject,
    text: body,
    replyTo,
  });
}
