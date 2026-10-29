import { createHmac, timingSafeEqual } from "crypto";

// Real phone calls and SMS through Twilio's REST API and TwiML, without the SDK.
// Twilio's trial account includes free credit; it can call and text numbers you've verified.
//
// How a call works: we ask Twilio to dial the user (or the user dials our Twilio number); Twilio
// fetches instructions (TwiML) from our webhooks. Each instruction speaks a line and listens for
// speech; Twilio transcribes what the user said and posts it back, and we reply with the next line.

export function twilioConfigured() {
  const e = process.env;
  return Boolean(e.TWILIO_ACCOUNT_SID && e.TWILIO_AUTH_TOKEN && e.TWILIO_PHONE_NUMBER && publicUrl());
}

/** The public https address Twilio uses to reach this app (an ngrok URL while testing locally). */
export function publicUrl() {
  return (process.env.PUBLIC_URL || "").replace(/\/$/, "");
}

const API = () => (process.env.TWILIO_API_BASE || "https://api.twilio.com").replace(/\/$/, "");

async function twilio(path: string, params: Record<string, string>) {
  const sid = process.env.TWILIO_ACCOUNT_SID!;
  const res = await fetch(`${API()}/2010-04-01/Accounts/${sid}/${path}`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${sid}:${process.env.TWILIO_AUTH_TOKEN}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams(params),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message ? `Twilio: ${data.message}` : `Twilio request failed (${res.status})`);
  return data as { sid: string; status?: string };
}

/** Ask Twilio to ring `to`; when answered, Twilio fetches TwiML from `answerPath`. */
export function createCall(to: string, answerPath: string, statusPath: string) {
  const params: Record<string, string> = {
    To: to,
    From: process.env.TWILIO_PHONE_NUMBER!,
    Url: publicUrl() + answerPath,
  };
  if (statusPath) {
    params.StatusCallback = publicUrl() + statusPath;
  }
  return twilio("Calls.json", params);
}

export function sendSms(to: string, body: string) {
  return twilio("Messages.json", { To: to, From: process.env.TWILIO_PHONE_NUMBER!, Body: body.slice(0, 1500) });
}

/**
 * Check X-Twilio-Signature so only Twilio can drive the webhooks. The signature is an HMAC-SHA1,
 * keyed with the auth token, of the full public URL followed by every POST field (sorted by name).
 */
export function validTwilioRequest(req: Request, params: URLSearchParams) {
  const token = process.env.TWILIO_AUTH_TOKEN;
  const signature = req.headers.get("x-twilio-signature");
  if (!token || !signature) return false;

  // Never skip this check, even in development: `npm run phone` exposes the dev server through a
  // public tunnel, and an unchecked webhook would let anyone approve drafts or talk as the user.
  // Tunnels can rewrite the host, so accept a signature over either the forwarded URL or PUBLIC_URL.
  const u = new URL(req.url);
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "";
  const proto = req.headers.get("x-forwarded-proto") || "https";
  const proxyUrl = host ? `${proto}://${host}${u.pathname}${u.search}` : "";
  const configuredUrl = publicUrl() ? `${publicUrl()}${u.pathname}${u.search}` : "";

  for (const url of [proxyUrl, configuredUrl].filter(Boolean)) {
    const data = [...params.keys()].sort().reduce((acc, k) => acc + k + (params.get(k) ?? ""), url);
    const expected = Buffer.from(createHmac("sha1", token).update(data).digest("base64"));
    const given = Buffer.from(signature);
    if (expected.length === given.length && timingSafeEqual(expected, given)) {
      return true;
    }
  }

  return false;
}

/** Read a Twilio webhook: its form fields, or null if the signature doesn't check out. */
export async function readTwilioWebhook(req: Request) {
  const params = new URLSearchParams(await req.text());
  return validTwilioRequest(req, params) ? params : null;
}

// ---- TwiML ---------------------------------------------------------------------------------

const esc = (s: string) => s.replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[c]!);

/** Languages Twilio can both listen to and speak, with a natural voice for each. */
const VOICES: Record<string, string> = {
  "en-IN": "Polly.Aditi",
  "hi-IN": "Polly.Aditi",
  "bn-IN": "Google.bn-IN-Standard-A",
  "ta-IN": "Google.ta-IN-Standard-A",
  "te-IN": "Google.te-IN-Standard-A",
  "mr-IN": "Google.mr-IN-Standard-A",
  "gu-IN": "Google.gu-IN-Standard-A",
  "kn-IN": "Google.kn-IN-Standard-A",
  "ml-IN": "Google.ml-IN-Standard-A",
  "pa-IN": "Google.pa-IN-Standard-A",
  "en-US": "Polly.Joanna",
};

export const PHONE_LANGUAGES = Object.keys(VOICES);

function say(text: string, lang: string) {
  const l = VOICES[lang] ? lang : "en-IN";
  return `<Say voice="${VOICES[l]}" language="${l}">${esc(text)}</Say>`;
}

export function twiml(body: string) {
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><Response>${body}</Response>`, {
    headers: { "Content-Type": "text/xml; charset=utf-8" },
  });
}

/** Speak `text`, then listen for the user's reply and post it to `actionPath`. */
export function sayAndListen(text: string, lang: string, actionPath: string) {
  const l = VOICES[lang] ? lang : "en-IN";
  const action = esc(publicUrl() + actionPath);
  return twiml(
    `<Gather input="speech" language="${l}" speechTimeout="auto" actionOnEmptyResult="true" action="${action}" method="POST">${say(text, l)}</Gather>` +
      // If Gather times out without posting (rare), keep the call going.
      `<Redirect method="POST">${action}</Redirect>`,
  );
}

export function sayAndHangUp(text: string, lang = "en-IN") {
  return twiml(`${say(text, lang)}<Hangup/>`);
}

/** Normalise an Indian or international number to E.164 (+919876543210), or null if invalid. */
export function normalisePhone(input: string) {
  const digits = input.replace(/[^\d+]/g, "");
  if (/^\+\d{8,15}$/.test(digits)) return digits;
  const plain = digits.replace(/\D/g, "");
  if (/^[6-9]\d{9}$/.test(plain)) return `+91${plain}`;
  if (/^0[6-9]\d{9}$/.test(plain)) return `+91${plain.slice(1)}`;
  if (/^91[6-9]\d{9}$/.test(plain)) return `+${plain}`;
  return null;
}
