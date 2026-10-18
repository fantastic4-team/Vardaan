import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATA_FILE = path.join(process.cwd(), "data", "waitlist.json");

type Entry = { email: string; joinedAt: string };

async function readList(): Promise<Entry[]> {
  try {
    return JSON.parse(await fs.readFile(DATA_FILE, "utf8"));
  } catch (err) {
    // Only a missing file means "empty list"; anything else must not be overwritten.
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw err;
  }
}

// Serialise read-modify-write so concurrent signups don't overwrite each other.
let queue: Promise<unknown> = Promise.resolve();
function addEmail(email: string) {
  const run = queue.then(async () => {
    const list = await readList();
    if (list.some((entry) => entry.email === email)) return;
    list.push({ email, joinedAt: new Date().toISOString() });
    await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
    await fs.writeFile(DATA_FILE, JSON.stringify(list, null, 2));
  });
  queue = run.catch(() => {});
  return run;
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";

  if (!EMAIL_RE.test(email) || email.length > 254) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  }

  // Local JSON store for development. Swap for a database or email provider in production,
  // since serverless hosts don't keep writes to disk.
  try {
    await addEmail(email);
  } catch (err) {
    console.error("waitlist write failed", err);
    return NextResponse.json({ error: "We couldn't save your email. Please try again later." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
