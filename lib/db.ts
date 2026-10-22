import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";

// A small JSON-file store for local development. Every write goes through one queue so
// concurrent requests never overwrite each other. Swap this module for a hosted database
// (Supabase, Neon or Turso all have free tiers) before deploying to a serverless host.

export type User = {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: string;
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
export type Reminder = { id: string; userId: string; title: string; dueAt?: string; createdAt: string };

type Data = { users: User[]; tasks: Task[]; memories: Memory[]; reminders: Reminder[] };

const FILE = path.join(process.cwd(), "data", "db.json");
const EMPTY: Data = { users: [], tasks: [], memories: [], reminders: [] };

async function load(): Promise<Data> {
  try {
    return { ...EMPTY, ...JSON.parse(await fs.readFile(FILE, "utf8")) };
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return structuredClone(EMPTY);
    throw err;
  }
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
    await fs.writeFile(tmp, JSON.stringify(data, null, 2));
    await fs.rename(tmp, FILE);
    return result;
  });
  queue = run.catch(() => {});
  return run;
}

export const newId = () => randomUUID();
export const now = () => new Date().toISOString();
