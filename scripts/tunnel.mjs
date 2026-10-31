// `npm run tunnel`: puts this app (localhost:3000) online at your fixed PUBLIC_URL using ngrok's
// Node SDK, so Sarvam can reach it. Needs NGROK_AUTHTOKEN and PUBLIC_URL (your free ngrok static
// domain) in .env.local. Uses the SDK instead of ngrok.exe, which some Windows setups block.
//
// The tunnel can drop silently (Wi-Fi blip, laptop sleep, ngrok closing the session) while this
// process keeps running, so it checks itself every 20 seconds and reconnects when it's down.

import { existsSync, readFileSync } from "node:fs";
import ngrok from "@ngrok/ngrok";

const file = existsSync(".env.local") ? readFileSync(".env.local", "utf8") : "";
const env = {
  ...Object.fromEntries(file.split(/\r?\n/).filter((l) => /^\s*[A-Z_]+\s*=/.test(l)).map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()])),
  ...process.env,
};

const domain = (env.PUBLIC_URL || "").replace(/^https?:\/\//, "").replace(/\/.*$/, "");
const port = Number(env.PORT || 3000);
if (!env.NGROK_AUTHTOKEN) throw new Error("Add NGROK_AUTHTOKEN to .env.local (dashboard.ngrok.com > Your Authtoken).");
if (!domain) throw new Error("Set PUBLIC_URL in .env.local to your ngrok static domain, e.g. https://your-name.ngrok-free.dev");

const url = `https://${domain}`;
const time = () => new Date().toLocaleTimeString();
let listener = null;

async function connect() {
  try {
    if (listener) await listener.close().catch(() => {});
    await ngrok.disconnect().catch(() => {});
    listener = await ngrok.forward({ addr: port, authtoken: env.NGROK_AUTHTOKEN, domain });
    console.log(`[${time()}] Tunnel up: ${listener.url()} → http://localhost:${port}`);
    return true;
  } catch (err) {
    // ERR_NGROK_334: this domain is already online somewhere else (another `npm run tunnel`).
    console.error(`[${time()}] Couldn't open the tunnel: ${err.message}`);
    return false;
  }
}

/** Is the public URL reaching *this* computer? (The app answering, or at least ngrok passing it through.) */
async function online() {
  try {
    const res = await fetch(`${url}/api/health`, { signal: AbortSignal.timeout(10_000), headers: { "ngrok-skip-browser-warning": "1" } });
    // ngrok's own "endpoint offline" page is a 404 HTML page; the app's health check is JSON.
    if (res.headers.get("ngrok-error-code")) return false;
    return res.ok || res.status === 502; // 502 = tunnel fine, app (npm run dev) not running
  } catch {
    return false;
  }
}

await connect();
console.log("Keep this window open. Run `npm run dev` in another terminal. Ctrl+C to stop.");

let failures = 0;
let appWarned = false;
setInterval(async () => {
  const ok = await online();
  if (ok) {
    failures = 0;
    // Tell the user once if the tunnel is fine but the app isn't running.
    const app = await fetch(`http://localhost:${port}/api/health`, { signal: AbortSignal.timeout(5_000) }).then((r) => r.ok, () => false);
    if (!app && !appWarned) console.warn(`[${time()}] Tunnel is up, but the app isn't running on port ${port}. Start it with \`npm run dev\`.`);
    appWarned = !app;
    return;
  }
  failures += 1;
  if (failures >= 2) {
    console.warn(`[${time()}] Tunnel looks down. Reconnecting…`);
    if (await connect()) failures = 0;
  }
}, 20_000);

process.on("SIGINT", async () => {
  await ngrok.disconnect().catch(() => {});
  process.exit(0);
});
