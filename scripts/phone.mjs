// `npm run phone`: talk to Vardaan on your real phone, from your own computer.
//
// 1. Asks once for the keys it needs and saves them to .env.local.
// 2. Opens a free public https tunnel (Cloudflare quick tunnel, no account) to this computer.
// 3. Points your Twilio number's call and SMS webhooks at that tunnel.
// 4. Starts the app, then rings your phone whenever you press Enter, and prints the conversation live.

import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import { existsSync, readFileSync, appendFileSync } from "node:fs";
import net from "node:net";
import { createInterface } from "node:readline/promises";
import { bin, install } from "cloudflared";

const PORT = Number(process.env.PORT || 3000);
const ENV_FILE = ".env.local";
const dim = (s) => `\x1b[2m${s}\x1b[0m`;
const bold = (s) => `\x1b[1m${s}\x1b[0m`;
const blue = (s) => `\x1b[38;5;117m${s}\x1b[0m`;
const green = (s) => `\x1b[38;5;149m${s}\x1b[0m`;
const red = (s) => `\x1b[38;5;210m${s}\x1b[0m`;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const children = [];
let stopping = false;

// On Windows, kill() leaves grandchildren (Next's workers) running, so end the whole tree.
function stopAll() {
  stopping = true;
  for (const c of children) {
    if (process.platform === "win32" && c.pid) spawn("taskkill", ["/PID", String(c.pid), "/T", "/F"], { stdio: "ignore" });
    else c.kill();
  }
}

function fail(msg) {
  console.error(`\n${red("✗")} ${msg}\n`);
  stopAll();
  process.exit(1);
}

process.on("SIGINT", () => {
  stopAll();
  process.exit(0);
});

// ---- 1. Keys ----------------------------------------------------------------------------------

function readEnvFile() {
  if (!existsSync(ENV_FILE)) return {};
  return Object.fromEntries(
    readFileSync(ENV_FILE, "utf8")
      .split(/\r?\n/)
      .filter((l) => /^\s*[A-Z_]+\s*=/.test(l))
      .map((l) => {
        const i = l.indexOf("=");
        return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, "")];
      }),
  );
}

const env = { ...readEnvFile(), ...process.env };
const rl = createInterface({ input: process.stdin, output: process.stdout });

async function ask(key, question, help, check = (v) => v.length > 0) {
  if (env[key]) return env[key];
  if (help) console.log(dim(`  ${help}`));
  for (;;) {
    const v = (await rl.question(`  ${question}: `)).trim();
    if (check(v)) {
      appendFileSync(ENV_FILE, `${existsSync(ENV_FILE) && !readFileSync(ENV_FILE, "utf8").endsWith("\n") ? "\n" : ""}${key}=${v}\n`);
      env[key] = v;
      return v;
    }
    console.log(red("  That doesn't look right, try again."));
  }
}

console.log(`\n${bold("VARDAAN")} ${dim("phone line")}\n`);

if (!env.GROQ_API_KEY && !env.GEMINI_API_KEY && !(env.LLM_BASE_URL && env.LLM_MODEL)) {
  console.log("The AI needs a free key.");
  await ask("GROQ_API_KEY", "Groq API key", "Free at https://console.groq.com/keys (sign in, Create API Key).", (v) => v.startsWith("gsk_"));
}
const missingTwilio = !env.TWILIO_ACCOUNT_SID || !env.TWILIO_AUTH_TOKEN || !env.TWILIO_PHONE_NUMBER;
if (missingTwilio) console.log("\nTwilio places the real calls. Free trial at https://www.twilio.com/try-twilio (verify your mobile there).");
const sid = await ask("TWILIO_ACCOUNT_SID", "Twilio Account SID", "On the console.twilio.com home page, starts with AC.", (v) => /^AC[0-9a-f]{32}$/i.test(v));
const token = await ask("TWILIO_AUTH_TOKEN", "Twilio Auth Token", "Right below the Account SID.", (v) => /^[0-9a-f]{32}$/i.test(v));
const twilioNumber = await ask("TWILIO_PHONE_NUMBER", "Your Twilio phone number (with +country code)", "Console > Phone Numbers > Active numbers, e.g. +15551234567.", (v) => /^\+\d{8,15}$/.test(v));
console.log("");
const rawPhone = await ask("MY_PHONE", "Your mobile number (Vardaan calls this)", "", (v) => v.replace(/\D/g, "").length >= 10);
// Same rule as the app: a 10-digit Indian mobile gets +91.
const digits = rawPhone.replace(/\D/g, "");
const myPhone = rawPhone.trim().startsWith("+") ? `+${digits}` : /^0?[6-9]\d{9}$/.test(digits) ? `+91${digits.slice(-10)}` : `+${digits}`;
const myEmail = await ask("MY_EMAIL", "Email of your Vardaan account", "The one you signed up with at localhost:3000/signup.", (v) => /^\S+@\S+\.\S+$/.test(v));

// ---- 2. Check Twilio and the port --------------------------------------------------------------

const auth = `Basic ${Buffer.from(`${sid}:${token}`).toString("base64")}`;
const twilioApi = `${(env.TWILIO_API_BASE || "https://api.twilio.com").replace(/\/$/, "")}/2010-04-01/Accounts/${sid}`;

process.stdout.write(dim("\nChecking your Twilio account… "));
const numbers = await fetch(`${twilioApi}/IncomingPhoneNumbers.json?PhoneNumber=${encodeURIComponent(twilioNumber)}`, { headers: { Authorization: auth } })
  .then(async (r) => (r.ok ? r.json() : fail(`Twilio rejected the keys (${r.status}). Check TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN in ${ENV_FILE}.`)))
  .catch((e) => fail(`Couldn't reach Twilio: ${e.message}`));
const number = numbers.incoming_phone_numbers?.[0];
if (!number) {
  console.log(green("ok") + dim(` (voice sender ${twilioNumber})`));
} else {
  console.log(green("ok"));
}

const portFree = await new Promise((r) => {
  const s = net.createServer().once("error", () => r(false)).once("listening", () => s.close(() => r(true))).listen(PORT);
});
if (!portFree) fail(`Port ${PORT} is busy, probably your \`npm run dev\`. Stop it (Ctrl+C in that terminal) and run \`npm run phone\` again.`);

// ---- 3. Tunnel ---------------------------------------------------------------------------------

process.stdout.write(dim("Opening a public tunnel… "));
if (!existsSync(bin)) await install(bin);
const tunnel = spawn(bin, ["tunnel", "--no-autoupdate", "--url", `http://localhost:${PORT}`]);
children.push(tunnel);
const publicUrl = await new Promise((resolve) => {
  const timer = setTimeout(() => fail("The tunnel didn't start within 40 seconds. Check your internet and try again."), 40000);
  const find = (chunk) => {
    const m = String(chunk).match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/);
    if (m) {
      clearTimeout(timer);
      resolve(m[0]);
    }
  };
  tunnel.stdout.on("data", find);
  tunnel.stderr.on("data", find);
});
console.log(green(publicUrl));

// ---- 4. App ------------------------------------------------------------------------------------

process.stdout.write(dim("Starting Vardaan… "));
const cliToken = randomBytes(32).toString("hex");
const app = spawn(process.execPath, ["node_modules/next/dist/bin/next", "dev", "-p", String(PORT)], {
  env: { ...process.env, PUBLIC_URL: publicUrl, VARDAAN_CLI_TOKEN: cliToken },
});
children.push(app);
app.stderr.on("data", (d) => {
  const s = String(d).trim();
  if (s && !/warn|deprecat/i.test(s)) console.error(red(s));
});
app.on("exit", (code) => code && !stopping && fail(`The app stopped (exit ${code}).`));

const local = `http://localhost:${PORT}`;
for (let i = 0; ; i++) {
  if (await fetch(local).then(() => true, () => false)) break;
  if (i > 120) fail("The app didn't start within 2 minutes.");
  await wait(1000);
}
// Compile the phone routes now, so Twilio's first request isn't slowed by the dev compiler.
await Promise.all(
  ["voice/answer", "voice/turn", "voice/status", "voice/incoming", "sms/incoming", "voice/call-me"].map((p) =>
    fetch(`${local}/api/${p}`, { method: "POST" }).catch(() => {}),
  ),
);
console.log(green("ok"));

if (number) {
  process.stdout.write(dim("Connecting your Twilio number… "));
  const set = await fetch(`${twilioApi}/IncomingPhoneNumbers/${number.sid}.json`, {
    method: "POST",
    headers: { Authorization: auth, "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      VoiceUrl: `${publicUrl}/api/voice/incoming`,
      VoiceMethod: "POST",
      SmsUrl: `${publicUrl}/api/sms/incoming`,
      SmsMethod: "POST",
    }),
  });
  if (!set.ok) fail(`Couldn't set the webhooks on ${twilioNumber} (${set.status}).`);
  console.log(green("ok"));
}

// The tunnel's address can take a few seconds to resolve worldwide.
for (let i = 0; i < 30; i++) {
  if (await fetch(publicUrl).then((r) => r.status < 500, () => false)) break;
  await wait(1000);
}

console.log(`
${green("●")} ${bold("Vardaan is live on your phone line.")}

  ${bold("Enter")}    Vardaan calls you on ${blue(myPhone)}
  ${bold("q")}        quit

  You can also call ${blue(twilioNumber)} from ${myPhone}, or use the dashboard at ${blue(`${local}/app`)}.
  ${dim("Trial accounts play a short Twilio notice first: press any key on the phone and Vardaan starts.")}
`);

// ---- 5. Live conversation ----------------------------------------------------------------------

const seen = new Map();
setInterval(() => {
  let calls;
  try {
    calls = JSON.parse(readFileSync("data/db.json", "utf8")).calls;
  } catch {
    return;
  }
  for (const c of calls) {
    const prev = seen.get(c.id);
    if (!prev) {
      seen.set(c.id, { turns: c.turns.length, status: c.status });
      continue;
    }
    for (const t of c.turns.slice(prev.turns)) console.log(t.role === "user" ? `  ${blue("You")}      ${t.content}` : `  ${green("Vardaan")}  ${t.content}`);
    if (c.status !== prev.status) {
      const label = { ringing: "Ringing…", "in-progress": "Connected. Say something.", completed: "Call ended.", busy: "Busy.", "no-answer": "No answer.", failed: `Call failed${c.error ? `: ${c.error}` : "."}`, canceled: "Cancelled." }[c.status];
      if (label) console.log(dim(`  · ${label}`));
    }
    seen.set(c.id, { turns: c.turns.length, status: c.status });
  }
}, 800);

for (;;) {
  const line = (await rl.question("")).trim().toLowerCase();
  if (line === "q" || line === "quit") break;
  const res = await fetch(`${local}/api/voice/call-me`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-vardaan-cli": cliToken },
    body: JSON.stringify({ phone: myPhone, email: myEmail }),
  });
  const body = await res.json().catch(() => ({}));
  if (res.ok) console.log(dim(`  · Calling ${myPhone}… pick up.`));
  else if (res.status === 401) console.log(red(`  No Vardaan account with ${myEmail}. Sign up at ${local}/signup, then press Enter again.`));
  else {
    console.log(red(`  ${body.error || "Couldn't place the call."}`));
    if (/permission|geo/i.test(body.error || "")) console.log(dim("  Enable your country in Twilio: Console > Voice > Settings > Geo permissions."));
    if (/unverified|verified/i.test(body.error || "")) console.log(dim("  Trial accounts can only call verified numbers: Console > Phone Numbers > Verified Caller IDs."));
  }
}

stopAll();
await wait(500);
process.exit(0);
