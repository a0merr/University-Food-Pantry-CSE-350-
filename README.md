# Campus Food Pantry - CSE 350

> **This branch (`backup/local-implementation`) is an AI-generated implementation starter, kept only as a backup.** It is not the team's submission and is not merged into `main`. The team's code is on [`main`](https://github.com/a0merr/University-Food-Pantry-CSE-350-/tree/main). See `docs/AI_USAGE.md` on this branch for the disclosure.

Campus Food Pantry is a local Express/SQLite prototype for a CSE 350 implementation demo. Students can sign in, browse available pantry items, request food, choose pickup slots, and receive notifications. Staff can manage inventory, donations, pickup slots, fulfillment, low-stock alerts, and aggregate usage reporting.

## Requirements
Node.js 22.13+ (uses built-in `node:sqlite`; some versions show experimental warnings). `npm install` installs everything from `package.json` (express, plus `@playwright/test`, `@axe-core/playwright` and `autocannon` for the tests); then run `npx playwright install chromium` once for the browser tests.

## Setup (local-only sample data)
1. `npm install`
2. `node scripts/seed.js --reset`
3. `node server.js`
4. Go to http://localhost:3000

Demo staff: `staff@pantry.test` / `DemoPass123!`. Demo students: `student1@pantry.test`, `student2@pantry.test`, `student3@pantry.test` / `DemoPass123!`.

## Tests
- `npm test` - unit + integration (`node --test tests/unit/*.test.js tests/integration/*.test.js`). The glob form works in PowerShell too; `node --test tests/unit tests/integration` no longer does on Node 22+.
- `npm run test:e2e` - Playwright student/staff/a11y specs (requires Chromium).
- `npm run test:perf` - autocannon load test (NFR3).

Latest local verification: `npm.cmd test` on November 12, 2026: 22 tests passed, 0 failed.

## API (beyond the original routes)
- `GET /api/notifications?unread=1&limit=50` -> `{ items, unread }`; `POST /api/notifications/read-all`; `POST /api/notifications/:id/read` (a response-shape change from the old bare array).
- `GET /api/reports/usage?from=YYYY-MM-DDTHH:mm&to=...` -> FR10 usage totals (staff only, counts only).
- `GET /api/alerts` -> open low-stock alerts; `GET /api/slots` returns every upcoming slot to staff and only open ones to students.

## Deployment
See `docs/DEPLOYMENT.md` (Vercel config is `vercel.json`; SQLite does not persist on Vercel).

## IMPORTANT integration notes
This patch preserves all previously shown repository source files. Because original `src/db.js` and original `package.json` were not provided, a separate `src/db-adapter.js` is used. Before merging with your existing database module, compare schema, transactions and foreign keys. Original `public/js/api.js` and `ui.js` are not overwritten; this prototype's new page scripts use their own fetch helpers. **This is a class-project starter, not a production-ready site**: security, accessibility, time zone handling, concurrency and notification delivery must be reviewed. University SSO is not implemented. Email delivery is simulated in `email_outbox`.

The npm scripts live in `package.json`: `start`, `seed`, `test`, `test:e2e`, `test:perf`; Node engine is set to >=22.13.

Do not commit `data/`, `node_modules/`, `.env`, or real student data. See `docs/INTEGRATION_CHECKLIST.md`.

## AI usage

See `docs/AI_USAGE.md` for the branch-level disclosure and recount instructions. This backup branch is an AI-assisted implementation starter. After the merges, the stylesheet rewrite, the BUG-01 to BUG-07 fixes and the documentation updates were also AI-assisted and are listed in the post-merge section of that file. The team-written work in `main` (Andrew's FR5, FR6, FR8, FR9, FR10 and staff page) is recorded there and must be reconciled before quoting a final percentage.

Deck screenshots are in `docs/screenshots/` (login, student, student with a request, staff, staff on mobile).
