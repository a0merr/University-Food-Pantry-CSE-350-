# Campus Food Pantry Platform

CSE 350, Group 15. Students request food from the campus pantry privately and pick a pickup time; pantry staff manage inventory, donations and pickups.

> **Status (Nov 12, 2026):** merged into `main` so far:
> - Accounts and security (FR1, NFR1), with the sign-in page and demo seed data (`npm run seed`)
> - Student page: browse, search and filter, request food and book a pickup (FR2–FR4)
> - Inventory and donations (FR7)
> - Pickup times, cancellations and notifications (FR5, FR6)
> - Pickup fulfillment, low-stock alerts and the usage report (FR8–FR10), with the staff page
> - Shared stylesheet (`public/css/styles.css`); the server creates `data/` itself; sign-out link on the staff page
>
> **Live site:** https://university-food-pantry-cse-350.onrender.com (deployed on Render; demo accounts are created by `scripts/seed.js`)
>
> Tests: `npm test` runs 221 unit and integration tests (218 pass; 3 are `todo` tests for known FR7 gaps). `npm run test:e2e` runs 34 browser and accessibility tests, all passing.
>
> Still to come:
> - Screens for adding items and logging donations (FR7 is API-only so far)
> - FR7 API gaps: set a low-stock threshold, per-visit limit or dietary tags when adding an item; retire an item
>
> The Development Demo is due **Fri, Nov 13**.

## Team

| Member | Role | Owns |
| --- | --- | --- |
| Abdullah Saadawi | Developer | FR1 accounts and roles, FR7 inventory and donations, NFR1 security, server setup, Render deploy |
| Mohamed Muse | Developer | FR2 browse, FR3 search and filters, FR4 food requests, student page |
| Andrew Merritt | Developer + PM | FR5 pickup times, FR6 cancellations and notifications, FR8 pickup fulfillment, FR9 low-stock alerts, FR10 usage report, staff page, deck and report |
| Gavin Marvelle | QA lead | Test plan, test cases, browser, accessibility and load tests, bug tracking, test report |

## Tech stack

- **Server:** [Express 5](https://expressjs.com/) on Node.js 22.13 or newer
- **Database:** Node's built-in SQLite (`node:sqlite`), a single file at `data/pantry.db`; tests use an in-memory database
- **Front end:** plain HTML, CSS and JavaScript modules (no framework, no build step)
- **Tests:** `node:test` (unit and integration), Playwright with axe-core (browser and accessibility), autocannon (load)
- **Hosting:** Render
- **Bug tracking:** GitHub Issues

## Getting started

1. Install [Node.js](https://nodejs.org/) 22.13 or newer. Check with `node --version`.
2. Clone the repo and install dependencies:
   ```
   git clone https://github.com/a0merr/University-Food-Pantry-CSE-350-.git
   cd University-Food-Pantry-CSE-350-
   npm install
   ```
3. Run `npm install` before `npm test` on a fresh clone; the tests need the installed packages.
4. For browser tests, install Chromium once: `npx playwright install chromium`

The server creates the `data/` folder on first start. Every page should link the shared stylesheet with `<link rel="stylesheet" href="/css/styles.css">`. Use `<main class="narrow">` and `<form class="stack">` for a narrow, stacked form such as sign-in.

**Deploying:** Render ends HTTPS at a proxy. The server trusts that proxy when the `RENDER` environment variable is set (Render sets it automatically), so the Origin check and login rate limit see the real protocol and client IP. On another host behind a proxy, set `TRUST_PROXY=1`.

Node may print an `ExperimentalWarning` for `node:sqlite`. That is expected.

## Scripts

These are defined in `package.json`. Each one works as soon as the file it runs has been added.

| Command | What it does | Needs |
| --- | --- | --- |
| `npm start` | Starts the site at http://localhost:3000 | `server.js` |
| `npm run seed` | Resets the database and loads demo data | `scripts/seed.js` |
| `npm test` | Runs unit and integration tests | `tests/unit/`, `tests/integration/` |
| `npm run test:unit` | Unit tests only | `tests/unit/` |
| `npm run test:integration` | Integration tests only | `tests/integration/` |
| `npm run test:coverage` | Tests with a coverage report for `src/` | as above |
| `npm run test:e2e` | Browser and accessibility tests | `playwright.config.js`, `tests/e2e/` |
| `npm run test:perf` | Load test | `tests/perf/load-test.js` |
| `npm run test:all` | All of the above | everything |

## Project structure

```
server.js              Express app: JSON, static pages, CSRF check, routers, error handler, hourly reminder job
src/
  db.js                database schema, openDatabase(), transaction()
  lib/                 errors.js, validate.js, time.js
  auth/                passwords.js (hashing); routes.js (register, login with rate limit, logout, /me)
  routes/              inventory.js (Abdullah); pickups.js and staff.js (Andrew)
  services/            inventory, slots, pickups, notifications, reminders, alerts, reports
public/
  index.html           sign-in page; sends staff and students to their page
  staff.html           pickup queue, pickup times, low-stock alerts, usage report
  student.html         student portal: browse, search and filter, request food, book a pickup, notifications
  css/styles.css       shared stylesheet for every page
  js/                  api.js, ui.js, signout.js, staff-guard.js, staff-pickups.js, staff-reports.js, student-filter.js, student-pickup.js
tests/
  unit/                one test file per service, router or page script
  integration/         staff flow, the real server with seed data, server edge cases
  e2e/                 Playwright browser and accessibility tests (desktop and phone)
  perf/                autocannon load test
docs/
  AI_USAGE.md          AI-generated code disclosure
  presentation/        demo deck, recording guide, screenshots, and the team's to-do list
  report/              written report draft
```


## API

Every route is under `/api`. A `POST`, `PATCH` or `DELETE` needs the `X-Requested-With: fetch` header, which `api()` adds.

| Method and path | Who | What it does | Owner |
| --- | --- | --- | --- |
| `GET /health` | anyone | Server check | Abdullah |
| `POST /auth/register`, `POST /auth/login`, `POST /auth/logout`, `GET /auth/me` | anyone / signed in | Accounts and sessions | Abdullah |
| `GET /items` | anyone | Item list with stock | Abdullah |
| `POST /items`, `PATCH /items/:id`, `POST /donations` | staff | Add items, change quantity, log donations | Abdullah |
| `GET /pickup-slots` | signed in | Pickup times with open spots | Andrew |
| `POST /pickups` | student | Body `{ slot_id, items: [{ item_id, quantity }] }`. Checks the visit and per-item limits, reserves stock, books the time and sends a "scheduled" notification | Andrew |
| `GET /pickups/:id`, `POST /pickups/:id/cancel` | owner or staff | View or cancel a pickup; cancel releases reserved stock | Andrew |
| `GET /notifications`, `PATCH /notifications/:id/read` | signed in | Own notifications; `?unread=true` filters | Andrew |
| `GET /staff/pickups` | staff | Pickup queue; `?date=YYYY-MM-DD`, `?status=` | Andrew |
| `POST /staff/pickups/:id/prepare`, `POST /staff/pickups/:id/complete` | staff | Mark ready (sends "ready"), mark picked up | Andrew |
| `GET /staff/slots`, `POST /staff/slots`, `PATCH /staff/slots/:id`, `DELETE /staff/slots/:id` | staff | Manage pickup times | Andrew |
| `GET /staff/alerts`, `POST /staff/alerts/check` | staff | Open low-stock alerts; re-check stock now | Andrew |
| `GET /staff/reports` | staff | Usage totals, no student names; `?from=` and `?to=` dates | Andrew |

## How we work

- **Branches:** one branch per feature (for example `abdullah/auth`). Open a pull request into `main` and get one teammate's review before merging.
- **Modules:** the project uses ES modules (`"type": "module"`), so write `import`/`export`, never `require`.
- **Services** take `ctx = { db, clock }` as their first argument, so tests can pass an in-memory database and a fake clock.
- **Times** are stored as local ISO text from `toLocalIso()` in `src/lib/time.js`. Don't use `toISOString()`: it is UTC and shifts evening pickups to the next day.
- **Errors:** throw the helpers in `src/lib/errors.js`. The API always answers errors as `{ "error": { "code", "message" } }`, which `public/js/api.js` reads.
- **Pages** build the DOM with `el()` from `public/js/ui.js` (never `innerHTML` with data) and send every request through `api()`, which adds the CSRF header.
- **Tests:** everyone writes unit tests for their own code in `tests/unit/`.
- **Bugs** go in GitHub Issues with steps to reproduce, expected result and actual result.
- **Never commit** `data/`, `.env`, `node_modules/` or real student information.

## AI-generated code

The assignment requires at least 10% AI-generated code and asks us to say where it is. The seven foundation files are AI-generated by Claude Code, and each starts with the comment `AI-generated (Claude Code) - see docs/AI_USAGE.md`. The inventory and security code was written with ChatGPT's help. [docs/AI_USAGE.md](docs/AI_USAGE.md) lists every file and the current AI share. If you use AI for anything, log it there.

## License

MIT
