// Prefer an explicit domain; on Vercel fall back to the project's production URL so canonical
// links never point at localhost in a real deployment.
const vercelUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL;

export const site = {
  name: "Vardaan",
  title: "Vardaan — Beta | Join the waitlist",
  description:
    "Vardaan is in private beta. Join the waitlist to get early access, help shape the product, and lock in founding-member pricing.",
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? (vercelUrl ? `https://${vercelUrl}` : "http://localhost:3000")).replace(/\/$/, ""),
};
