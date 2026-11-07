# Breanna Events & Bar

An interactive concept demo for an event planning and mobile bartending business. The name is provisional; the source brief is Breanna's message describing the two services and a purchased domain.

## Demo walkthrough

1. **Home**: explore the three-scene animated hero, service paths and sample inspiration. The slideshow has manual controls, pause, and reduced-motion support.
2. **Booking**: choose a service, future date, sample start time, guests and venue; enter sample contact details; review and create a demo inquiry. A matching event plan is created in the same save.
3. **My event**: edit overview details; add/check/delete checklist tasks; edit the timeline; track estimated versus actual costs; compose a bar menu. Save explicitly and reload to check persistence. Print generates a full report.
4. **Owner studio**: search/filter inquiries, change status, open linked plans and export CSV. Edit/publish/unpublish/delete journal entries and manage gallery highlights.
5. **Journal and highlights**: published content and saved gallery edits appear immediately in the same visitor's website experience.

## Data model and boundaries

Cloudflare D1 stores each signed-in visitor's independent demo workspace. Every state mutation is authenticated, validated and version-checked. Booking and linked event creation are atomic. Changes to a linked event's date/location/guests update its inquiry; sample availability conflicts are rejected.

This is a demo, not an operational booking service. No external calendar, email, SMS, payment or real reservation is triggered. Gallery imagery is generated concept photography; sample events, people, venues, editorial and budgets are fictional. The client and owner screens demonstrate roles within one authenticated demo workspace; they are not production staff/client authorization roles. New hosting is owner-private; sharing must be explicitly configured before Breanna can visit.

## Local development

Node.js 22.13+; tested with Node 24.21.0. Install through the Sites skill's `install-dependencies.mjs`. Use `npm run dev` on loopback. The supplied development sign-in endpoint is `/signin-with-chatgpt?return_to=/`; this local mock never ships in the production build.

Checks: `npx tsc --noEmit --pretty false` and `git diff --check`.

Build using `node <sites-plugin-root>/scripts/build-site.mjs`. Generate schema changes with `npm run db:generate`; apply each pending local migration once using Wrangler D1 with `dist/server/wrangler.json` and `.wrangler/state`.

`npm start -- --port 8787` runs the built Worker locally. `scripts/verify-demo-api.mjs` uses synthetic upstream identity headers for the built local Worker only, simulating the identity supplied by Sites. It refuses non-loopback URLs. Do not run it on a hosted production service. The development server intentionally strips spoofed identity headers and uses its local mock sign-in cookie instead.

Do not run two Worker runtimes against one local SQLite state directory simultaneously. Synthetic QA users can use a separate `.wrangler/qa-state` directory.

## Hosting

The Site identity is in `.openai/hosting.json`. Reuse it. Publish via Sites' source helper and private deployment tools. Never put repository tokens in files or command arguments. Never deploy the local SQLite state, credentials or runtime directories.

## Assets

Three generated concept photographs are stored locally as optimized WebP. DM Sans and Gloock are stored locally with their Open Font Licenses. No third-party font request is required at runtime.

## Production follow-up

Before using for real clients: confirm actual brand/domain/service areas, package scope, approved imagery/copy, operational permissions and business details; define staff/client access roles; connect booking/calendar and notification providers; agree reservation and payment terms; complete production security, accessibility and browser/device acceptance checks. None of these are represented as enabled by the demo.
