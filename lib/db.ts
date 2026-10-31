import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { DEMO_USER_ID, demoData } from "@/lib/demo";

// A small JSON-file store for local development. Every write goes through one queue so
// concurrent requests never overwrite each other. Swap this module for a hosted database
// (Supabase, Neon or Turso all have free tiers) before deploying to a serverless host.

export type User = {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  /** Mobile number in E.164 format (+919876543210). Vardaan calls and texts this number. */
  phone?: string;
  /** Language for phone calls, e.g. "en-IN" or "hi-IN". */
  lang?: string;
  /** Emergency contact. Vardaan emails them at once, without asking, when the user says so. */
  emergencyName?: string;
  emergencyEmail?: string;
  /** Google account linked for Calendar and Gmail. Server-side only: never send to the browser. */
  google?: GoogleLink;
  createdAt: string;
};

export type GoogleLink = {
  email: string;
  accessToken: string;
  refreshToken: string;
  /** When accessToken expires (ms since epoch). */
  expiresAt: number;
  scopes: string[];
  connectedAt: string;
};

export type TaskStatus = "planning" | "working" | "needs_input" | "needs_approval" | "done" | "failed";

export type Draft = {
  id: string;
  channel: "email" | "sms" | "whatsapp";
  to: string;
  subject?: string;
  body: string;
  /** sent: emailed by Vardaan over SMTP. approved: handed to the user's own app to send. */
  status: "draft" | "sent" | "approved" | "failed";
  error?: string;
};

export type Task = {
  id: string;
  userId: string;
  request: string;
  status: TaskStatus;
  steps: string[];
  question?: string;
  answers: { question: string; answer: string }[];
  drafts: Draft[];
  summary?: string;
  error?: string;
  createdAt: string;
  updatedAt: string;
};

export type Memory = { id: string; userId: string; fact: string; createdAt: string };
export type Reminder = {
  id: string;
  userId: string;
  title: string;
  dueAt?: string;
  /** When Vardaan phoned the user about this reminder. */
  calledAt?: string;
  createdAt: string;
};

export type CallTurn = { role: "user" | "assistant"; content: string; at: string };

/** A phone call between Vardaan and a user, kept as a log with its transcript. */
export type CallLog = {
  id: string;
  userId: string;
  direction: "outbound" | "inbound";
  /** Why Vardaan called: "Call me" from the dashboard, or a reminder. */
  reason: string;
  phone: string;
  status: "queued" | "ringing" | "in-progress" | "completed" | "busy" | "no-answer" | "failed" | "canceled";
  /** Sarvam Voice Agents ids: the outbound attempt, and the conversation (set once it connects). */
  sarvamAttemptId?: string;
  sarvamInteractionId?: string;
  turns: CallTurn[];
  silences: number;
  taskIds: string[];
  error?: string;
  startedAt: string;
  answeredAt?: string;
  endedAt?: string;
  durationSec?: number;
};

/** A text message sent to or received from the user. */
export type MessageLog = {
  id: string;
  userId: string;
  direction: "outbound" | "inbound";
  body: string;
  status: "sent" | "failed" | "received";
  error?: string;
  createdAt: string;
};

type Data = {
  users: User[];
  tasks: Task[];
  memories: Memory[];
  reminders: Reminder[];
  calls: CallLog[];
  messages: MessageLog[];
};

const FILE = path.join(process.cwd(), "data", "db.json");
const EMPTY: Data = { users: [], tasks: [], memories: [], reminders: [], calls: [], messages: [] };

async function loadFile(): Promise<Data> {
  try {
    return { ...EMPTY, ...JSON.parse(await fs.readFile(FILE, "utf8")) };
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return structuredClone(EMPTY);
    throw err;
  }
}

/** The stored data plus the read-only demo account, which lives only in memory. */
async function load(): Promise<Data> {
  const data = await loadFile();
  const demo = demoData();
  return {
    users: [...data.users, demo.user],
    tasks: [...data.tasks, ...demo.tasks],
    memories: [...data.memories, ...demo.memories],
    reminders: [...data.reminders, ...demo.reminders],
    calls: [...data.calls, ...demo.calls],
    messages: [...data.messages, ...demo.messages],
  };
}

/** Drop the demo account before saving, so it's never written to disk. */
function withoutDemo(data: Data): Data {
  const keep = <T extends { userId: string }>(rows: T[]) => rows.filter((r) => r.userId !== DEMO_USER_ID);
  return {
    users: data.users.filter((u) => u.id !== DEMO_USER_ID),
    tasks: keep(data.tasks),
    memories: keep(data.memories),
    reminders: keep(data.reminders),
    calls: keep(data.calls),
    messages: keep(data.messages),
  };
}

let queue: Promise<unknown> = Promise.resolve();

/** Read the store. */
export async function read<T>(fn: (data: Data) => T): Promise<T> {
  await queue;
  return fn(await load());
}

/** Read-modify-write the store atomically with respect to other writes. */
export function write<T>(fn: (data: Data) => T): Promise<T> {
  const run = queue.then(async () => {
    const data = await load();
    const result = fn(data);
    await fs.mkdir(path.dirname(FILE), { recursive: true });
    const tmp = `${FILE}.${process.pid}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(withoutDemo(data), null, 2));
    await fs.rename(tmp, FILE);
    return result;
  });
  queue = run.catch(() => {});
  return run;
}

export const newId = () => randomUUID();
export const now = () => new Date().toISOString();
