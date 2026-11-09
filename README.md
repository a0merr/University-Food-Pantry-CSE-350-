# Campus Food Pantry Platform

CSE 350, Group 15. Students request food from the campus pantry privately and pick a pickup time; pantry staff manage inventory, donations and pickups.

> **Status (Nov 9, 2026):** only the shared foundation is in the repo (database schema and helper modules). The server, API, pages and tests are being built this week. The Development Demo is due **Fri, Nov 13**.

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
3. For browser tests, install Chromium once: `npx playwright install chromium`

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
server.js            starts the web server and the reminder job
scripts/seed.js      demo accounts, items and pickup times
src/
  db.js              database schema, openDatabase(), transaction()      [done]
  lib/               errors.js, validate.js, time.js                      [done]
  auth/              passwords.js [done]; sessions, middleware, rate limit
  middleware/        security headers, CSRF check, error handler
  services/          the pantry rules: accounts, inventory, requests, slots, notifications, alerts, reports
  routes/            thin Express routers, one file per owner
  app.js             builds the Express app and mounts the routers
public/
  index.html         sign in and create account
  student.html       browse food, request items, choose a pickup time
  staff.html         inventory, donations, pickup queue, alerts, usage report
  css/styles.css
  js/                api.js and ui.js [done]; one script per page section
tests/
  unit/  integration/  e2e/  perf/
docs/
  AI_USAGE.md        AI-generated code disclosure
```

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

The assignment requires us to disclose AI-generated code, and we keep it at about 10% of the project. The seven foundation files are AI-generated. Each starts with the comment `AI-generated (Claude Code) - see docs/AI_USAGE.md`, and [docs/AI_USAGE.md](docs/AI_USAGE.md) lists them. Everything else is written by the team. Do not paste AI output into team files; if you do use AI for anything, log it in `docs/AI_USAGE.md`.

## License

MIT
