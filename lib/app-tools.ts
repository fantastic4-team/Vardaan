import type { ToolSpec } from "@/lib/llm";
import { createEvent, googleConfigured, googleLinkFor, listEvents, readEmail, searchEmails, TIME_ZONE } from "@/lib/google";
import { emergencyContact, sendEmergencyAlert } from "@/lib/emergency";
import { getWeather } from "@/lib/weather";

// Third-party app tools for the agent: live weather (always), and Google Calendar + Gmail (once the
// user has connected Google in Settings). Shared by calls (talk) and background tasks (runTask).

const tool = (name: string, description: string, properties: Record<string, unknown>, required: string[]): ToolSpec => ({
  type: "function",
  function: { name, description, parameters: { type: "object", properties, required } },
});

// Kept short on purpose: these descriptions are sent with every model call.
const WEATHER = tool(
  "get_weather",
  "Live weather and forecast for a city.",
  { place: { type: "string" }, days: { type: "number", description: "1-7, default 2" } },
  ["place"],
);

const CALENDAR = [
  tool(
    "list_calendar_events",
    `The user's Google Calendar events in a time range (also to check if they're free). Times in ${TIME_ZONE}.`,
    {
      from: { type: "string", description: "ISO 8601, default start of today" },
      to: { type: "string", description: "ISO 8601, default from + 24h" },
      query: { type: "string" },
    },
    [],
  ),
  tool(
    "create_calendar_event",
    "Book a Google Calendar event; Google emails invites to guests. Only after the user confirms the details.",
    {
      title: { type: "string" },
      start: { type: "string", description: "ISO 8601" },
      duration_minutes: { type: "number", description: "default 30" },
      attendees: { type: "array", items: { type: "string" }, description: "emails; never guess" },
      location: { type: "string" },
      google_meet: { type: "boolean" },
    },
    ["title", "start"],
  ),
];

const GMAIL = [
  tool(
    "search_emails",
    "Search the user's Gmail (read-only) with Gmail syntax, e.g. is:unread newer_than:1d, from:amazon.",
    { query: { type: "string" }, max: { type: "number", description: "1-10, default 5" } },
    [],
  ),
  tool("read_email", "Read one email's text by id from search_emails.", { id: { type: "string" } }, ["id"]),
];

const emergencyTool = (who: string) =>
  tool(
    "send_emergency_alert",
    `Email the user's emergency contact (${who}) IMMEDIATELY. Use whenever the user asks to alert, inform or message their emergency contact, or says they're in danger or need help urgently. Do not ask for confirmation or more details: send their words at once.`,
    { message: { type: "string", description: "The user's message, in their words" } },
    ["message"],
  );

/** The app tools available to this user right now. */
export async function appTools(userId: string): Promise<ToolSpec[]> {
  const link = googleConfigured() ? await googleLinkFor(userId) : null;
  const has = (scope: string) => Boolean(link?.scopes.some((s) => s.includes(scope)));
  const contact = await emergencyContact(userId);
  return [
    WEATHER,
    ...(has("calendar") ? CALENDAR : []),
    ...(has("gmail") ? GMAIL : []),
    ...(contact ? [emergencyTool(contact.name || contact.email)] : []),
  ];
}

/** One line for the system prompt saying which apps are connected. */
export async function appsSummary(userId: string) {
  const link = googleConfigured() ? await googleLinkFor(userId) : null;
  const contact = await emergencyContact(userId);
  const apps = link
    ? `Apps: weather, Google Calendar and Gmail (${link.email}).`
    : "Apps: weather only. For calendar or email, ask them to connect Google in Settings.";
  return contact
    ? `${apps}
Emergency contact: ${contact.name ? `${contact.name} ` : ""}<${contact.email}>. send_emergency_alert sends at once with no confirmation; in real danger also tell them to call 112.`
    : apps;
}

const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : undefined);

/** Run an app tool. Returns null if `name` isn't an app tool. Never throws: errors become text. */
export async function runAppTool(userId: string, name: string, args: Record<string, unknown>): Promise<string | null> {
  try {
    switch (name) {
      case "get_weather":
        return await getWeather(str(args.place), num(args.days) ?? 2);
      case "list_calendar_events":
        return await listEvents(userId, { from: str(args.from) || undefined, to: str(args.to) || undefined, query: str(args.query) || undefined });
      case "create_calendar_event":
        return await createEvent(userId, {
          title: str(args.title),
          start: str(args.start),
          end: str(args.end) || undefined,
          durationMinutes: num(args.duration_minutes),
          attendees: Array.isArray(args.attendees) ? args.attendees.map(String) : [],
          description: str(args.description) || undefined,
          location: str(args.location) || undefined,
          meet: args.google_meet === true,
        });
      case "search_emails":
        return await searchEmails(userId, str(args.query), num(args.max) ?? 5);
      case "read_email":
        return await readEmail(userId, str(args.id));
      case "send_emergency_alert":
        return await sendEmergencyAlert(userId, str(args.message));
      default:
        return null;
    }
  } catch (err) {
    return `That didn't work: ${err instanceof Error ? err.message : "unknown error"}`;
  }
}
