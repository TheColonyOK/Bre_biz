# Breanna Events & Bar demo

Approved scope: private event planning and mobile bartending concept demo; preserve all existing features, design, imagery and content. The business name is provisional. Do not invent business credentials, pricing, clients or completed events. No actual bookings, emails, payments or calendar actions.

Stack: Next.js 16 standalone on Node.js 24, Railway Dockerfile, better-sqlite3 + Drizzle using one persistent SQLite volume at `/data`. Railway is configured for one replica and a health check at `/api/health`. Keep SQLite WAL and busy timeout, initialize existing schema idempotently, and retain user isolation/version CAS. Do not scale multiple app replicas against SQLite.

Authentication: private demo access code and signed, unique per-browser HttpOnly SameSite cookie. Railway does not provide trusted OAI identity headers; never accept OAI identity headers. Require exact `APP_ORIGIN` for login and cross-origin writes. `DEMO_ACCESS_CODE` and `DEMO_SESSION_SECRET` are runtime-only env vars; never hardcode or commit them. Local insecure-cookie opt-in is allowed only for loopback tests. Protect page and mutations. `/api/health` returns minimal 200.

UI: oxblood, pale rose, ivory and muted olive; expressive serif headings; local generated editorial imagery. Demo disclosures must be clear. Respect reduced motion, keyboard navigation, validation, saving and error states.

No real messages/bookings/payments. `npm run build`, `npx tsc --noEmit --pretty false`, and `node scripts/verify-demo-api.mjs` are the local verification commands. Integration tests use only synthetic data and must refuse non-loopback URLs. Keep `.openai/hosting.json` identity metadata, but do not use Sites publishing for this Railway fork.
