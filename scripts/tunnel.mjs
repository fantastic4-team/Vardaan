// `npm run tunnel`: puts this app (localhost:3000) online at your fixed PUBLIC_URL using ngrok's
// Node SDK, so Sarvam can reach it. Needs NGROK_AUTHTOKEN and PUBLIC_URL (your free ngrok static
// domain) in .env.local. Uses the SDK instead of ngrok.exe, which some Windows setups block.

import { existsSync, readFileSync } from "node:fs";
import ngrok from "@ngrok/ngrok";

const file = existsSync(".env.local") ? readFileSync(".env.local", "utf8") : "";
const env = { ...Object.fromEntries(file.split(/\r?\n/).filter((l) => /^\s*[A-Z_]+\s*=/.test(l)).map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()])), ...process.env };

const domain = (env.PUBLIC_URL || "").replace(/^https?:\/\//, "").replace(/\/.*$/, "");
const port = Number(env.PORT || 3000);
if (!env.NGROK_AUTHTOKEN) throw new Error("Add NGROK_AUTHTOKEN to .env.local (dashboard.ngrok.com > Your Authtoken).");
if (!domain) throw new Error("Set PUBLIC_URL in .env.local to your ngrok static domain, e.g. https://your-name.ngrok-free.dev");

const listener = await ngrok.forward({ addr: port, authtoken: env.NGROK_AUTHTOKEN, domain });
console.log(`Tunnel up: ${listener.url()} → http://localhost:${port}`);
console.log("Keep this window open. Run `npm run dev` in another terminal. Ctrl+C to stop.");
// Stay running until Ctrl+C (works with or without a terminal attached).
setInterval(() => {}, 1 << 30);
