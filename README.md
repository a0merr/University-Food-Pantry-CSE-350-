# Campus Food Pantry — CSE 350

## Requirements
Node.js 22.13+ (uses built-in `node:sqlite`; some versions show experimental warnings). `npm install` installs everything from `package.json` (express, plus `@playwright/test`, `@axe-core/playwright` and `autocannon` for the tests); then run `npx playwright install chromium` once for the browser tests.

## Setup (local-only sample data)
1. `npm install`
2. `node scripts/seed.js --reset`
3. `node server.js`
4. Go to http://localhost:3000

Demo staff: `staff@pantry.test` / `DemoPass123!`. Demo students: `student1@pantry.test`, `student2@pantry.test`, `student3@pantry.test` / `DemoPass123!`.

## Tests
- `npm test` — unit + integration (`node --test tests/unit/*.test.js tests/integration/*.test.js`). The glob form works in PowerShell too; `node --test tests/unit tests/integration` no longer does on Node 22+.
- `npm run test:e2e` — Playwright student/staff/a11y specs (requires Chromium).
- `npm run test:perf` — autocannon load test (NFR3).

## API (beyond the original routes)
- `GET /api/notifications?unread=1&limit=50` → `{ items, unread }`; `POST /api/notifications/read-all`; `POST /api/notifications/:id/read` (a response-shape change from the old bare array).
- `GET /api/reports/usage?from=YYYY-MM-DDTHH:mm&to=...` → FR10 usage totals (staff only, counts only).
- `GET /api/alerts` → open low-stock alerts; `GET /api/slots` returns every upcoming slot to staff and only open ones to students.

## Deployment
See `docs/DEPLOYMENT.md` (Vercel config is `vercel.json`; SQLite does not persist on Vercel).

## IMPORTANT integration notes
This patch preserves all previously shown repository source files. Because original `src/db.js` and original `package.json` were not provided, a separate `src/db-adapter.js` is used. Before merging with your existing database module, compare schema, transactions and foreign keys. Original `public/js/api.js` and `ui.js` are not overwritten; this prototype's new page scripts use their own fetch helpers. **This is a class-project starter, not a production-ready site**: security, accessibility, time zone handling, concurrency and notification delivery must be reviewed. University SSO is not implemented. Email delivery is simulated in `email_outbox`.

The npm scripts live in `package.json`: `start`, `seed`, `test`, `test:e2e`, `test:perf`; Node engine is set to >=22.13.

Do not commit `data/`, `node_modules/`, `.env`, or real student data. See `docs/INTEGRATION_CHECKLIST.md`.
