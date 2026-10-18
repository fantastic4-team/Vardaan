import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATA_FILE = path.join(process.cwd(), "data", "waitlist.json");

async function readList(): Promise<{ email: string; joinedAt: string }[]> {
  try {
    return JSON.parse(await fs.readFile(DATA_FILE, "utf8"));
  } catch {
    return [];
  }
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";

  if (!EMAIL_RE.test(email) || email.length > 254) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  }

  // Local JSON store for development. Swap for a database or email provider in production,
  // since serverless hosts don't keep writes to disk.
  const list = await readList();
  if (!list.some((entry) => entry.email === email)) {
    list.push({ email, joinedAt: new Date().toISOString() });
    await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
    await fs.writeFile(DATA_FILE, JSON.stringify(list, null, 2));
  }

  return NextResponse.json({ ok: true });
}
