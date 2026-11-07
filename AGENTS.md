# Breanna Events & Bar demo

Approved scope: event planning and mobile bartending marketing site; animated hero; booking inquiries; client planner; highlights; blog; owner studio; real persistent database. Brand name is provisional. Source brief is the user's screenshot; do not invent business credentials, pricing, clients, or completed events.

Stack: Sites Vinext/React/TypeScript with Cloudflare D1. Preserve `.openai/hosting.json` project identity and private access. Each authenticated visitor owns an isolated demonstration workspace. No actual bookings, emails, payments, or third-party calendar actions.

Commands: `npm run dev`, `npx tsc --noEmit`, `npm run db:generate`; build/publish through the installed Sites skill. Local D1 migrations use the generated dist/server/wrangler.json and .wrangler/state. Never overwrite applied migrations.

UI: oxblood, pale rose, ivory, muted olive; expressive serif headings; local generated editorial imagery. Demo disclosures must be clear. Respect reduced motion, keyboard navigation, validation, saving and error states.

Verify inquiry -> owner view -> planner persistence, publishing blog/highlight changes, date/slot conflicts, per-user isolation, mobile layout, keyboard use and reduced motion. Keep source credentials and runtime state out of Git.
