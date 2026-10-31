import type { ToolSpec } from "@/lib/llm";
import { createEvent, googleConfigured, googleLinkFor, listEvents, readEmail, searchEmails, TIME_ZONE } from "@/lib/google";
import { getWeather } from "@/lib/weather";

// Third-party app tools for the agent: live weather (always), and Google Calendar + Gmail (once the
// user has connected Google in Settings). Shared by calls (talk) and background tasks (runTask).

const tool = (name: string, description: string, properties: Record<string, unknown>, required: string[]): ToolSpec => ({
  type: "function",
  function: { name, description, parameters: { type: "object", properties, required } },
});

const WEATHER = tool(
  "get_weather",
  "Get live weather and a forecast for a city. Use for any question about weather, rain, temperature, or what to wear or carry.",
  {
    place: { type: "string", description: "City or place, e.g. Bengaluru or Connaught Place, Delhi." },
    days: { type: "number", description: "Forecast days, 1-7. Default 3." },
  },
  ["place"],
);

const CALENDAR = [
  tool(
    "list_calendar_events",
    `Read the user's Google Calendar: what's on today, tomorrow, this week, or whether they are free at a time. Times are in ${TIME_ZONE}.`,
    {
      from: { type: "string", description: "ISO 8601 start, e.g. 2026-11-02T00:00:00. Default: start of today." },
      to: { type: "string", description: "ISO 8601 end. Default: 24 hours after from." },
      query: { type: "string", description: "Optional text to match, e.g. a person or meeting name." },
    },
    [],
  ),
  tool(
    "create_calendar_event",
    `Book an event in the user's Google Calendar. Google emails invites to any guests. Only call this after the user has confirmed the title, date, time and guests; on a call, read them back and get a yes first. Check list_calendar_events for clashes first. Times are in ${TIME_ZONE}.`,
    {
      title: { type: "string" },
      start: { type: "string", description: "ISO 8601 start, e.g. 2026-11-02T16:00:00." },
      end: { type: "string", description: "ISO 8601 end. Omit to use duration_minutes." },
      duration_minutes: { type: "number", description: "Default 30." },
      attendees: { type: "array", items: { type: "string" }, description: "Guest email addresses. Never guess an address: ask." },
      description: { type: "string" },
      location: { type: "string" },
      google_meet: { type: "boolean", description: "Add a Google Meet video link." },
    },
    ["title", "start"],
  ),
];

const GMAIL = [
  tool(
    "search_emails",
    "Search the user's Gmail (read-only). Uses Gmail search syntax, e.g. 'is:unread', 'from:professor newer_than:7d', 'subject:invoice'. Returns sender, subject, date and a preview with each email's id.",
    {
      query: { type: "string", description: "Gmail search query. Default: in:inbox." },
      max: { type: "number", description: "How many, 1-10. Default 5." },
    },
    [],
  ),
  tool("read_email", "Read the full text of one email found with search_emails.", { id: { type: "string" } }, ["id"]),
];

/** The app tools available to this user right now. */
export async function appTools(userId: string): Promise<ToolSpec[]> {
  const link = googleConfigured() ? await googleLinkFor(userId) : null;
  const has = (scope: string) => Boolean(link?.scopes.some((s) => s.includes(scope)));
  return [WEATHER, ...(has("calendar") ? CALENDAR : []), ...(has("gmail") ? GMAIL : [])];
}

/** One line for the system prompt saying which apps are connected. */
export async function appsSummary(userId: string) {
  const link = googleConfigured() ? await googleLinkFor(userId) : null;
  return link
    ? `Connected apps: Google Calendar and Gmail (${link.email}). Use them for schedules, bookings and email questions.`
    : "Connected apps: none besides live weather. If asked about their calendar or email, tell them to connect Google in Vardaan's Settings.";
}

const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : undefined);

/** Run an app tool. Returns null if `name` isn't an app tool. Never throws: errors become text. */
export async function runAppTool(userId: string, name: string, args: Record<string, unknown>): Promise<string | null> {
  try {
    switch (name) {
      case "get_weather":
        return await getWeather(str(args.place), num(args.days) ?? 3);
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
      default:
        return null;
    }
  } catch (err) {
    return `That didn't work: ${err instanceof Error ? err.message : "unknown error"}`;
  }
}
