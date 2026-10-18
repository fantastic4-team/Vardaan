// Prefer an explicit domain; on Vercel fall back to the project's production URL so canonical
// links never point at localhost in a real deployment.
const vercelUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL;

export const site = {
  name: "Vardaan",
  title: "Vardaan — The AI agent you can call for anything",
  description:
    "Vardaan is a voice-first AI agent. Call, say what you need in your own language, and it gets done, in the background or live on the call. Join the beta waitlist.",
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? (vercelUrl ? `https://${vercelUrl}` : "http://localhost:3000")).replace(/\/$/, ""),
};
