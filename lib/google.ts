import { randomUUID } from "crypto";
import { read, write, type GoogleLink } from "@/lib/db";

// Google Calendar and Gmail for the agent, over plain REST (no SDK).
// The user links their Google account once from Settings (OAuth, /api/google/connect). Vardaan can
// then read their calendar, book events (Google emails the invites), and read their Gmail.
// Setup (free): docs/GOOGLE_SETUP.md. Needs GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.

export const GOOGLE_SCOPES = [
  "openid",
  "email",
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/gmail.readonly",
  // Only used for emergency alerts to the contact the user saved in Settings (lib/emergency.ts).
  "https://www.googleapis.com/auth/gmail.send",
];

/** Can Vardaan send email from this Google account? (Accounts linked before gmail.send was added can't.) */
export const canSendGmail = (link: GoogleLink | null) => Boolean(link?.scopes.some((s) => s.endsWith("/gmail.send")));

/** Time zone for reading and booking events (the user's, not the server's). */
export const TIME_ZONE = process.env.APP_TIMEZONE || "Asia/Kolkata";

export function googleConfigured() {
  return Boolean(process.env.GOOGLE_CLIENT_ID?.trim() && process.env.GOOGLE_CLIENT_SECRET?.trim());
}

/** The OAuth callback URL. Must be listed exactly under "Authorized redirect URIs" in Google Cloud. */
export function redirectUri(origin: string) {
  return process.env.GOOGLE_REDIRECT_URI?.trim() || `${origin.replace(/\/$/, "")}/api/google/callback`;
}

export function authUrl(state: string, redirect: string) {
  const q = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!.trim(),
    redirect_uri: redirect,
    response_type: "code",
    scope: GOOGLE_SCOPES.join(" "),
    access_type: "offline", // so we get a refresh token and keep working after an hour
    prompt: "consent",
    include_granted_scopes: "true",
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${q}`;
}

type TokenResponse = { access_token: string; refresh_token?: string; expires_in: number; scope?: string; error?: string; error_description?: string };

async function tokenRequest(params: Record<string, string>) {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: process.env.GOOGLE_CLIENT_ID!.trim(), client_secret: process.env.GOOGLE_CLIENT_SECRET!.trim(), ...params }),
  });
  const data = (await res.json().catch(() => ({}))) as TokenResponse;
  if (!res.ok || !data.access_token) throw new GoogleError(data.error_description || data.error || `Google sign-in failed (${res.status})`, data.error);
  return data;
}

class GoogleError extends Error {
  constructor(message: string, readonly code?: string) {
    super(message);
  }
}

/** Finish sign-in: swap the one-time code for tokens and save them on the user. */
export async function linkGoogle(userId: string, code: string, redirect: string) {
  const t = await tokenRequest({ code, redirect_uri: redirect, grant_type: "authorization_code" });
  if (!t.refresh_token) throw new Error("Google didn't grant offline access. Remove Vardaan at myaccount.google.com/permissions and connect again.");
  const info = (await (await fetch("https://www.googleapis.com/oauth2/v3/userinfo", { headers: { Authorization: `Bearer ${t.access_token}` } })).json()) as { email?: string };
  const link: GoogleLink = {
    email: info.email ?? "",
    accessToken: t.access_token,
    refreshToken: t.refresh_token,
    expiresAt: Date.now() + t.expires_in * 1000,
    scopes: (t.scope ?? "").split(" ").filter(Boolean),
    connectedAt: new Date().toISOString(),
  };
  await write((d) => {
    const u = d.users.find((x) => x.id === userId);
    if (u) u.google = link;
  });
  return link.email;
}

export async function unlinkGoogle(userId: string) {
  const link = await read((d) => d.users.find((u) => u.id === userId)?.google);
  if (link) await fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(link.refreshToken)}`, { method: "POST" }).catch(() => {});
  await write((d) => {
    const u = d.users.find((x) => x.id === userId);
    if (u) delete u.google;
  });
}

export async function googleLinkFor(userId: string) {
  return read((d) => d.users.find((u) => u.id === userId)?.google ?? null);
}

/** A valid access token for the user, refreshed if it's about to expire. Null if not linked. */
async function accessToken(userId: string) {
  const link = await googleLinkFor(userId);
  if (!link) return null;
  if (link.expiresAt > Date.now() + 60_000) return link.accessToken;
  try {
    const t = await tokenRequest({ refresh_token: link.refreshToken, grant_type: "refresh_token" });
    await write((d) => {
      const g = d.users.find((u) => u.id === userId)?.google;
      if (g) {
        g.accessToken = t.access_token;
        g.expiresAt = Date.now() + t.expires_in * 1000;
      }
    });
    return t.access_token;
  } catch (err) {
    // Revoked, or a test-mode grant that expired after 7 days: the user has to connect again.
    if (err instanceof GoogleError && err.code === "invalid_grant") await write((d) => void delete d.users.find((u) => u.id === userId)?.google);
    throw new Error("Google access has expired. Ask the user to reconnect Google in Vardaan's Settings.");
  }
}

async function api<T>(userId: string, url: string, init: RequestInit = {}): Promise<T> {
  const token = await accessToken(userId);
  if (!token) throw new Error("Google isn't connected. Ask the user to connect Google in Vardaan's Settings.");
  const res = await fetch(url, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...(init.headers ?? {}) },
    signal: AbortSignal.timeout(15_000),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Google: ${(data as { error?: { message?: string } }).error?.message || `request failed (${res.status})`}`);
  return data as T;
}

// ---- Calendar ------------------------------------------------------------------------------

const CAL = "https://www.googleapis.com/calendar/v3/calendars/primary/events";

type GEvent = {
  id: string;
  summary?: string;
  location?: string;
  htmlLink?: string;
  hangoutLink?: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
  attendees?: { email: string; responseStatus?: string }[];
};

const fmtDay = (d: Date) => d.toLocaleDateString("en-IN", { timeZone: TIME_ZONE, weekday: "short", day: "numeric", month: "short" });
const fmtTime = (d: Date) => d.toLocaleTimeString("en-IN", { timeZone: TIME_ZONE, hour: "numeric", minute: "2-digit" });

function describeEvent(e: GEvent) {
  const title = e.summary || "(no title)";
  const where = e.location ? ` at ${e.location}` : "";
  if (e.start.date) return `${fmtDay(new Date(`${e.start.date}T12:00:00`))}, all day: ${title}${where}`;
  const s = new Date(e.start.dateTime!);
  const en = new Date(e.end.dateTime!);
  const guests = e.attendees?.length ? ` (with ${e.attendees.map((a) => a.email).join(", ")})` : "";
  return `${fmtDay(s)}, ${fmtTime(s)}–${fmtTime(en)}: ${title}${where}${guests}`;
}

/** Midnight today in the user's time zone, as a Date. */
function startOfToday() {
  const ymd = new Date().toLocaleDateString("en-CA", { timeZone: TIME_ZONE }); // YYYY-MM-DD
  return zoned(`${ymd}T00:00:00`);
}

/** Interpret a date-time without an offset as local time in TIME_ZONE. */
function zoned(value: string) {
  if (/[zZ]|[+-]\d\d:?\d\d$/.test(value)) return new Date(value);
  const guess = new Date(`${value}Z`);
  const local = new Date(guess.toLocaleString("en-US", { timeZone: TIME_ZONE }));
  const utc = new Date(guess.toLocaleString("en-US", { timeZone: "UTC" }));
  return new Date(guess.getTime() - (local.getTime() - utc.getTime()));
}

export async function listEvents(userId: string, opts: { from?: string; to?: string; query?: string }) {
  const from = opts.from ? zoned(opts.from) : startOfToday();
  const to = opts.to ? zoned(opts.to) : new Date(from.getTime() + 24 * 3600_000);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) return "Give the dates as ISO 8601, e.g. 2026-11-02T00:00:00.";
  const q = new URLSearchParams({ timeMin: from.toISOString(), timeMax: to.toISOString(), singleEvents: "true", orderBy: "startTime", maxResults: "25" });
  if (opts.query) q.set("q", opts.query);
  const data = await api<{ items?: GEvent[] }>(userId, `${CAL}?${q}`);
  const items = data.items ?? [];
  const range = `${fmtDay(from)} ${fmtTime(from)} to ${fmtDay(to)} ${fmtTime(to)} (${TIME_ZONE})`;
  if (!items.length) return `No events between ${range}. The user is free then.`;
  return [`${items.length} event(s) between ${range}:`, ...items.map((e) => `- ${describeEvent(e)}`)].join("\n");
}

export async function createEvent(
  userId: string,
  e: { title: string; start: string; end?: string; durationMinutes?: number; attendees?: string[]; description?: string; location?: string; meet?: boolean },
) {
  if (!e.title || !e.start) return "A title and a start time are needed.";
  const start = zoned(e.start);
  if (Number.isNaN(start.getTime())) return "The start time isn't a valid ISO 8601 date-time.";
  const end = e.end ? zoned(e.end) : new Date(start.getTime() + (e.durationMinutes || 30) * 60_000);
  if (end <= start) return "The end time must be after the start time.";
  const attendees = (e.attendees ?? []).map((a) => a.trim()).filter((a) => /^\S+@\S+\.\S+$/.test(a));

  const created = await api<GEvent>(userId, `${CAL}?sendUpdates=all&conferenceDataVersion=1`, {
    method: "POST",
    body: JSON.stringify({
      summary: e.title,
      description: [e.description, "Booked by Vardaan, your AI assistant."].filter(Boolean).join("\n\n"),
      location: e.location || undefined,
      start: { dateTime: start.toISOString(), timeZone: TIME_ZONE },
      end: { dateTime: end.toISOString(), timeZone: TIME_ZONE },
      attendees: attendees.map((email) => ({ email })),
      ...(e.meet ? { conferenceData: { createRequest: { requestId: randomUUID(), conferenceSolutionKey: { type: "hangoutsMeet" } } } } : {}),
    }),
  });
  return [
    `Booked: ${describeEvent(created)}.`,
    attendees.length ? `Google emailed invites to ${attendees.join(", ")}.` : "",
    created.hangoutLink ? `Google Meet link: ${created.hangoutLink}` : "",
  ]
    .filter(Boolean)
    .join(" ");
}

// ---- Gmail (read-only) ---------------------------------------------------------------------

const GMAIL = "https://gmail.googleapis.com/gmail/v1/users/me/messages";

type GMessage = {
  id: string;
  snippet?: string;
  payload?: GPart & { headers?: { name: string; value: string }[] };
};
type GPart = { mimeType?: string; body?: { data?: string }; parts?: GPart[] };

const header = (m: GMessage, name: string) => m.payload?.headers?.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value ?? "";
const decode = (data = "") => Buffer.from(data.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");

export async function searchEmails(userId: string, query: string, max = 5) {
  const q = new URLSearchParams({ q: query || "in:inbox", maxResults: String(Math.min(10, Math.max(1, max))) });
  const list = await api<{ messages?: { id: string }[] }>(userId, `${GMAIL}?${q}`);
  if (!list.messages?.length) return `No emails match "${query || "in:inbox"}".`;
  const meta = "format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date";
  const msgs = await Promise.all(list.messages.map((m) => api<GMessage>(userId, `${GMAIL}/${m.id}?${meta}`)));
  return msgs
    .map((m) => `- [id ${m.id}] From ${header(m, "From")} | ${header(m, "Subject") || "(no subject)"} | ${header(m, "Date")}\n  ${m.snippet ?? ""}`)
    .join("\n");
}

function plainText(part: GPart | undefined): string {
  if (!part) return "";
  if (part.mimeType === "text/plain" && part.body?.data) return decode(part.body.data);
  for (const p of part.parts ?? []) {
    const t = plainText(p);
    if (t) return t;
  }
  if (part.mimeType === "text/html" && part.body?.data) {
    return decode(part.body.data).replace(/<style[\s\S]*?<\/style>|<script[\s\S]*?<\/script>/gi, "").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ");
  }
  return "";
}

export async function readEmail(userId: string, id: string) {
  if (!id) return "Give the email id from search_emails.";
  const m = await api<GMessage>(userId, `${GMAIL}/${encodeURIComponent(id)}?format=full`);
  const body = plainText(m.payload).trim().slice(0, 4000) || m.snippet || "(empty)";
  return `From: ${header(m, "From")}\nSubject: ${header(m, "Subject")}\nDate: ${header(m, "Date")}\n\n${body}`;
}

/** Send a plain-text email from the user's own Gmail. Only used for emergency alerts. */
export async function sendGmail(userId: string, mail: { to: string; subject: string; body: string; replyTo?: string }) {
  const link = await googleLinkFor(userId);
  if (!canSendGmail(link)) throw new Error("Google isn't allowed to send email yet. Press Connect Google in Settings again.");
  // RFC 2822 message; the subject is encoded so non-English text arrives intact.
  const subject = `=?UTF-8?B?${Buffer.from(mail.subject, "utf8").toString("base64")}?=`;
  const raw = [
    `To: ${mail.to}`,
    `Subject: ${subject}`,
    ...(mail.replyTo ? [`Reply-To: ${mail.replyTo}`] : []),
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: base64",
    "",
    Buffer.from(mail.body, "utf8").toString("base64"),
  ].join("\r\n");
  await api(userId, `${GMAIL}/send`, { method: "POST", body: JSON.stringify({ raw: Buffer.from(raw).toString("base64url") }) });
}
