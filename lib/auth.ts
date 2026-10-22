import { createHmac, randomBytes, scrypt as scryptCb, timingSafeEqual } from "crypto";
import { mkdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";
import { promisify } from "util";
import { cookies } from "next/headers";
import { read, type User } from "@/lib/db";

const scrypt = promisify(scryptCb) as (password: string, salt: Buffer, keylen: number) => Promise<Buffer>;

export const SESSION_COOKIE = "vardaan_session";
const SESSION_DAYS = 30;

// The signing secret comes from AUTH_SECRET. Running locally without one, a random secret is
// generated once and kept in data/auth-secret so sessions survive restarts. Hosted
// deployments (Vercel) must set AUTH_SECRET.
let cachedSecret: string | undefined;
function secret() {
  if (process.env.AUTH_SECRET) return process.env.AUTH_SECRET;
  if (cachedSecret) return cachedSecret;
  if (process.env.VERCEL) throw new Error("AUTH_SECRET is not set");
  const file = path.join(process.cwd(), "data", "auth-secret");
  try {
    cachedSecret = readFileSync(file, "utf8").trim();
  } catch {
    cachedSecret = randomBytes(32).toString("hex");
    mkdirSync(path.dirname(file), { recursive: true });
    writeFileSync(file, cachedSecret);
  }
  return cachedSecret;
}

// Passwords: scrypt with a random 16-byte salt, stored as "salt:hash" in hex.
export async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const hash = await scrypt(password, salt, 64);
  return `${salt.toString("hex")}:${hash.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string) {
  const [saltHex, hashHex] = stored.split(":");
  if (!saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, "hex");
  const actual = await scrypt(password, Buffer.from(saltHex, "hex"), expected.length);
  return timingSafeEqual(actual, expected);
}

// Sessions: a stateless cookie "userId.expiry.signature", signed with HMAC-SHA256.
function sign(payload: string) {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

export function createSessionToken(userId: string) {
  const expires = Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000;
  const payload = `${userId}.${expires}`;
  return { token: `${payload}.${sign(payload)}`, expires: new Date(expires) };
}

function readSessionToken(token: string | undefined) {
  if (!token) return null;
  const [userId, expires, signature] = token.split(".");
  if (!userId || !expires || !signature) return null;
  const expected = Buffer.from(sign(`${userId}.${expires}`));
  const given = Buffer.from(signature);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  if (Number(expires) < Date.now()) return null;
  return userId;
}

/** Cookie settings; `secure` follows the actual connection so http://localhost works too. */
export const sessionCookieOptions = (req: Request, expires: Date) => ({
  httpOnly: true,
  sameSite: "lax" as const,
  secure: new URL(req.url).protocol === "https:" || req.headers.get("x-forwarded-proto") === "https",
  path: "/",
  expires,
});

export type PublicUser = Pick<User, "id" | "name" | "email">;

/** The signed-in user, or null. Use in server components and route handlers. */
export async function getCurrentUser(): Promise<PublicUser | null> {
  const userId = readSessionToken((await cookies()).get(SESSION_COOKIE)?.value);
  if (!userId) return null;
  const user = await read((d) => d.users.find((u) => u.id === userId));
  return user ? { id: user.id, name: user.name, email: user.email } : null;
}

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
