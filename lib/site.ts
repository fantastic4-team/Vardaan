export const site = {
  name: "Vardaan",
  title: "Vardaan — Beta | Join the waitlist",
  description:
    "Vardaan is in private beta. Join the waitlist to get early access, help shape the product, and lock in founding-member pricing.",
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, ""),
};
