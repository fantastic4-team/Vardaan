# Vardaan

Landing page and waitlist for the Vardaan beta, built with Next.js and Tailwind CSS.

```bash
npm install
npm run dev
```

Set `NEXT_PUBLIC_SITE_URL` (see `.env.example`) to the production domain so canonical URLs, the sitemap and Open Graph tags resolve correctly.

Waitlist signups are stored in `data/waitlist.json` for local development. Connect `app/api/waitlist/route.ts` to a database or email provider before deploying.
