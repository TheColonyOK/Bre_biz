# Breanna Events & Bar

A private, interactive concept demo for event planning and mobile bartending. The name is provisional, the event imagery and content are illustrative, and the demo does not create real bookings or send messages.

## Demo walkthrough

1. Open `/demo-access` and enter the owner-provided access code.
2. Explore the home page, services, sample booking flow, event planner and owner studio.
3. Add sample inquiries and edit planning, journal and gallery content. Each browser session receives its own isolated workspace.

The slideshow supports manual controls, pause and reduced motion. Forms validate inputs, mutations use optimistic version checks, and state is persisted in SQLite. No email, SMS, payment, external calendar or real reservation is triggered.

The sun/moon button on the access page and site header switches between light and dark mode. The initial theme follows the device setting; a manual selection is saved in that browser. The planner's printed report stays light.

## Railway deployment

This fork runs as a standard Node.js 24 Next.js standalone server. Railway builds the included Dockerfile and starts `node server.js` on `0.0.0.0:$PORT`. `railway.toml` configures one replica, `/api/health`, and bounded restart attempts.

Create a Railway volume mounted at `/data` and configure these service variables:

- `DATABASE_PATH=/data/demo.sqlite`
- `APP_ORIGIN=https://your-exact-public-hostname`
- `DEMO_ACCESS_CODE=<long private passcode, at least 12 characters>`
- `DEMO_SESSION_SECRET=<random secret, at least 32 bytes>`
- `NEXT_TELEMETRY_DISABLED=1`

Keep the volume attached to the single replica. SQLite is configured for WAL and a 5 second busy timeout; table creation is idempotent. Changing replicas above one is unsupported because a local SQLite file cannot coordinate across instances. Railway Serverless/App Sleep is a dashboard setting; enable it in the service's Deploy settings if desired. A sleeping service can have a cold-start delay.

Do not commit `.env`, secrets, SQLite state, or logs containing access codes. `/api/health` returns only a minimal 200 for platform health checks. The session cookie is HttpOnly, SameSite=Lax, signed with HMAC, unique per browser and expires after seven days. In production it is Secure. OAI identity headers are ignored.

## Local development and verification

Use Node.js 24. Install with `npm ci`, then set local-only environment values in the current shell:

```powershell
$env:APP_ORIGIN = 'http://127.0.0.1:8877'
$env:DEMO_ACCESS_CODE = 'local-test-code-change-me'
$env:DEMO_SESSION_SECRET = 'local-only-secret-at-least-32-bytes-long'
$env:DEMO_INSECURE_COOKIES = 'true'
$env:DATABASE_PATH = '.data/qa.sqlite'
$env:PORT = '8877'
npm run dev -- --webpack --port 8877
```

`DEMO_INSECURE_COOKIES=true` works only outside production and when `APP_ORIGIN` is loopback. Production always uses Secure cookies. For API verification, set the same `APP_ORIGIN`, `DEMO_ACCESS_CODE` and `DEMO_SESSION_SECRET` in another PowerShell window, then run `node scripts/verify-demo-api.mjs`. The integration script refuses non-loopback origins, performs a real code login, exercises the authenticated API, checks forged/tampered identity rejection and isolates two browser sessions. Its Node client carries the session cookie explicitly, so production Secure-cookie behavior can be tested over local HTTP without weakening that setting. Use a disposable DB path; the test writes synthetic QA content.

`npx tsc --noEmit --pretty false` performs the TypeScript check. `npm run lint` runs ESLint.

## Project identity and assets

`.openai/hosting.json` is retained as project identity metadata only; this fork is deployed through Railway and must not be published through Sites. Generated concept photographs are local optimized WebP. DM Sans and Gloock are local fonts with Open Font Licenses.

## Production follow-up

Before using for real clients, confirm actual brand/domain/service areas, package scope, approved imagery/copy, operational permissions and business details; define staff/client access roles; connect booking/calendar and notification providers; agree reservation and payment terms; complete production security, accessibility and browser/device acceptance checks. None of those integrations are represented as enabled by this demo.
