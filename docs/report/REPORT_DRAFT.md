---
title: "Campus Food Pantry Platform: Development Demo Report"
subtitle: "CSE 350, Group 15 · November 13, 2026 · DRAFT"
author: "Abdullah Saadawi, Mohamed Muse, Andrew Merritt, Gavin Marvelle"
---

> **Draft status.** This draft reflects the `main` branch on November 12, 2026 (through pull request #24). Sections marked **TO ADD** need input from the named teammate. Remove this note and every TO ADD before submitting.

# 1. Introduction

The Campus Food Pantry Platform lets students request food from the campus pantry privately and choose a pickup time, and lets pantry staff manage inventory, donations and pickups. This report covers what we built for the Development Demo, how we tested it, how it is deployed, and how AI-generated code was used and disclosed.

**Repository:** https://github.com/a0merr/University-Food-Pantry-CSE-350-

**Live site:** https://university-food-pantry-cse-350.onrender.com

**Recording:** TO ADD (Andrew): recording link

# 2. Team and roles

| Member | Role | Responsible for |
|---|---|---|
| Abdullah Saadawi | Developer | FR1 accounts and roles, FR7 inventory and donations, NFR1 security, server setup, Render deploy |
| Mohamed Muse | Developer | FR2 browse, FR3 search and filters, FR4 food requests, student page |
| Andrew Merritt | Developer and PM | FR5 pickup times, FR6 cancellations and notifications, FR8 pickup fulfillment, FR9 low-stock alerts, FR10 usage report, staff page, deck and report |
| Gavin Marvelle | QA lead | Test plan, test cases, browser, accessibility and load tests, bug tracking, test report |

# 3. System overview

## 3.1 Technology stack

- **Server:** Express 5 on Node.js 22.13 or newer, written as ES modules.
- **Database:** Node's built-in SQLite driver (`node:sqlite`), stored in one file, `data/pantry.db`. Tests use an in-memory database.
- **Front end:** plain HTML, CSS and JavaScript modules, with no framework and no build step. All pages share `public/css/styles.css`.
- **Tests:** `node:test` for unit and integration tests, Playwright with axe-core for browser and accessibility tests, autocannon for load tests.
- **Hosting:** Render. **Bug tracking:** GitHub Issues.

The team first proposed React, Supabase and Vercel, then moved to Express with built-in SQLite so that everyone could run the project with only Node installed.

## 3.2 Architecture

Requests flow through four layers:

1. **Pages** (`public/`) build the page with a safe DOM helper that never uses `innerHTML` with data, and send every request through one `api()` helper.
2. **API routes** (`src/routes/`, `src/auth/`) check the session and role. Every `POST`, `PATCH` and `DELETE` must carry the `X-Requested-With: fetch` header and, when the browser sends one, a same-site `Origin`, which blocks cross-site request forgery.
3. **Services** (`src/services/`) hold the business rules. Each takes a context `{ db, clock }`, so tests can pass an in-memory database and a fixed clock.
4. **Database** (`src/db.js`) defines the tables: users, sessions, items, donations, pickup slots, requests, request items, notifications, an email outbox, low-stock alerts and settings. Changes to stock run inside transactions.

Errors are always returned as `{ "error": { "code", "message" } }`.

# 4. Implementation by requirement

| Req | Feature | Owner | Status (Nov 12) |
|---|---|---|---|
| FR1 | Accounts and roles | Abdullah | Done (sign-in page and seed data in PR #14; sign-out link in PR #15) |
| FR2 | Browse available items | Mohamed | Done (PR #22) |
| FR3 | Search and filter | Mohamed | Done (PR #22) |
| FR4 | Food requests | Mohamed | Done (PR #22) |
| FR5 | Pickup times | Andrew | Done |
| FR6 | Cancellations and notifications | Andrew | Done |
| FR7 | Inventory and donations | Abdullah | API done; no staff screen yet |
| FR8 | Pickup fulfillment | Andrew | Done |
| FR9 | Low-stock alerts | Andrew | Done |
| FR10 | Usage report | Andrew | Done |
| NFR1 | Security | Abdullah | Done |

## 4.1 Accounts, roles and security (FR1, NFR1)

Abdullah's sign-in page (`public/index.html`) signs in through `POST /api/auth/login` and sends staff to the staff page and students to the student page. The seed script (`scripts/seed.js`) creates one staff and three student demo accounts, ten items with low-stock thresholds, and five pickup times. A shared sign-out link (`public/js/signout.js`, added with Claude Code, section 7) ends the session. TO ADD (Abdullah): registration and login, how sessions work, and the security measures in your words. From the code: passwords are hashed with salted scrypt; only a SHA-256 hash of each session token is stored; session cookies are `HttpOnly` and `SameSite=Lax` (and `Secure` in production); login is rate-limited to 5 failed attempts per 15 minutes; and changes require the `X-Requested-With` header and a matching `Origin`. Known limitation: the login rate limit is per IP address, so on a shared campus network, five wrong passwords from anyone can lock everyone on that network out for 15 minutes.

## 4.2 Browse, search and requests (FR2 to FR4)

The student page (`public/student.html`) lists only active items that are in stock, with a search box (item name or category) and a category filter (`public/js/student-filter.js`). A student enters quantities, picks an open pickup time and submits; the page sends `POST /api/pickups` and shows the "scheduled" notification, which can be marked read. Quantities are checked against what is available before sending. TO ADD (Mohamed): describe the page and your design choices in your own words.

## 4.3 Pickup times (FR5)

Staff create pickup times with a capacity. A student books one by sending the chosen items and time. Before booking, the server checks, inside one transaction, that:

- the student has no other open request;
- the pickup time is in the future and not full;
- no item exceeds its per-visit limit, and the number of different items stays within the visit limit (8 by default);
- enough of each item is available.

If every check passes, the request is saved and each item's `reserved` count goes up. Because the checks and the reservation run in one transaction, two students cannot both take the last unit. The student page shows `quantity - reserved` as the amount available.

## 4.4 Cancellations and notifications (FR6)

A student can cancel their own open pickup, and staff can cancel any open pickup. Cancelling gives the reserved stock back. Students get in-app notifications when a pickup is scheduled, ready or cancelled. An hourly job, which also runs once at startup, sends a reminder for pickups in the next 24 hours. Every notification is also written to an `email_outbox` table, which stands in for real email in this project. Staff can cancel from the pickup queue with the **Cancel** button. TO ADD (Andrew/Mohamed): where students see and cancel their own pickup (no page or endpoint for this yet).

## 4.5 Pickup fulfillment (FR8)

The staff page shows a queue of open pickups with the time, student, items and status. Staff mark a pickup **ready**, which notifies the student, and then **picked up**, which removes the items from the shelf (`quantity` and `reserved` both go down). Pickups cannot skip a step.

## 4.6 Low-stock alerts (FR9)

After every booking, cancellation and completed pickup, the server compares each item's available stock with its low-stock threshold. It opens an alert when stock is at or below the threshold and resolves it when the item is restocked. Staff can also press **Check Stock**. *Known gap:* the add-item API does not yet accept a threshold, so thresholds have to be set in the seed data.

## 4.7 Usage report (FR10)

Staff can run a report for any date range: pickups by status, the top ten items requested (cancelled requests excluded), and available stock by category. The report contains counts only, never student names or emails, and a unit test checks this.

## 4.8 Inventory and donations (FR7)

TO ADD (Abdullah): adding items, changing quantities and logging donations. These are available through the API (`POST /api/items`, `PATCH /api/items/:id`, `POST /api/donations`) but there is no staff screen for them yet.

# 5. Testing

## 5.1 Approach

Each developer wrote unit tests for their own code. Services are tested against an in-memory database with a fixed clock, so results do not depend on the time of day. Gavin's QA suite (PR #21) adds unit and integration tests for every route and service, front-end tests that run the page scripts in jsdom, Playwright browser tests on desktop and phone with axe accessibility scans, an integration test that runs the real server and seed script in a temporary folder, and an autocannon load test. Known bugs were written as `todo` tests so they were reported without failing the run, and turned into normal tests once fixed.

TO ADD (Gavin): test plan summary, how you chose what to test, and the load-test targets.

## 5.2 Results

| Check | Result |
|---|---|
| Unit and integration tests (`npm test`) | 221 tests: 218 pass, 0 fail, 3 `todo` (known FR7 gaps in the inventory API) |
| Browser and accessibility tests (`npm run test:e2e`, Playwright, desktop and phone) | 34 of 34 pass |
| axe accessibility scans, WCAG 2.1 A and AA | 0 violations on every page |
| End-to-end API run against a running server | 27 of 27 checks pass: login, booking, full slot, second open request, out of stock, notifications, alerts, prepare, complete, stock totals, cancel, permissions, report contents, slot deletion, login behind an HTTPS proxy |
| Edge-case API run against a running server | 33 of 33 pass: malformed and missing input, limits, past pickup times, other users' pickups and notifications, skipped steps, logout, duplicate registration, login rate limit |
| Load test (`npm run test:perf`) | TO ADD (Gavin): results from your run |

## 5.3 Defects found and fixed

| Defect | Effect | Fix |
|---|---|---|
| Usage report counted cancelled requests | "Top items" overstated usage | Cancelled requests are excluded (unit test added) |
| Deleting a pickup time that had past or cancelled pickups | 500 error from a foreign key | Returns 409 with a clear message (unit test added) |
| Login on Render | Behind Render's HTTPS proxy, every `POST`, including login, was rejected with 403, and all users shared one IP for rate limiting | Server trusts one proxy hop when `RENDER` or `TRUST_PROXY` is set |
| Fresh clone | `npm start` crashed because `data/` did not exist | Server creates the folder |
| Reminders after a restart | The first reminder run waited an hour | Also runs once at startup |
| Malformed JSON in a request | 500 error | 400 with a clear message |
| Editing a pickup time | Could move it into the past | 400, like creating one (unit test added) |
| Issue #11 | Home page returned 404 | Sign-in page (PR #14) |
| Issue #18 | Students who signed in were sent to a page that did not exist (404) | Student page (PR #22) |
| Issue #19 | After a student signed in on another tab, the staff page's Check Stock and Run Report failed with "You do not have access" | All tabs share one sign-in; the staff page now notices and says so (PR #20) |
| Live site clock | Render runs in UTC, so pickup-time checks, reminders and report dates were 5 hours off | Server and seed default to Eastern time (PR #23) |
| Unknown API route; body over 100 KB | HTML 404 page; 500 error | JSON 404; 413 (PR #23) |
| Daylight saving; last second of the day | 2:30 AM on spring-forward day saved as 3:30; queue left out a 23:59:59 pickup | Rejected; included (PR #23) |
| Failed sign-out | Left an unhandled error in the browser | Caught (PR #24) |
| QA tests and student page together | 8 student-page tests failed once both were merged | Tests use the real page (PR #24) |

Issues #11, #18 and #19 were logged by Gavin on GitHub. The remaining known gaps are in the FR7 inventory API: new items cannot get a low-stock threshold, per-visit limit or dietary tags, and items cannot be retired.

# 6. Deployment

The app is deployed on Render as a Node web service (`npm install`, then `npm start`). Render sets the `RENDER` environment variable, which makes the server trust Render's HTTPS proxy so that the Origin check and the login rate limit see the real protocol and client IP.

Limitation: the database is a SQLite file on the server's disk. On Render, that disk is reset by default on each deploy or restart unless a persistent disk is attached, so the demo relies on seed data loaded at start.

The live site is https://university-food-pantry-cse-350.onrender.com. Its first load after a quiet period can take 30 to 60 seconds while Render wakes the service. TO ADD (Abdullah): the deploy steps you used and whether the seed script runs on start.

# 7. AI-generated code

The assignment requires at least 10% AI-generated code and asks us to say where it is. Every AI-generated or AI-assisted file and change is listed in `docs/AI_USAGE.md`, and every Claude Code starter file begins with a marker comment.

| Source | Lines | Share |
|---|---:|---:|
| Claude Code starter files (database schema, helpers, password hashing, browser helpers) | 360 | 4.6% |
| Claude Code, Andrew: bug fixes, shared stylesheet, staff cancel button, sign-out link, staff account check, QA bug fixes | 436 | 5.6% |
| Claude Code, Gavin: QA test suite (both commits co-authored by Claude Opus 5.5) | 3,700 | 47.7% |
| ChatGPT-assisted, Abdullah (inventory and security code; whole files counted) | 544 | 7.0% |
| **All AI-generated or AI-assisted** | **5,040** | **65.0%** |

Counted over 7,756 lines of `.js`, `.html` and `.css`, including tests. Because the ChatGPT row counts whole files that were only partly AI-assisted, 65.0% is an upper bound. Most of the AI share is the QA test suite. Abdullah's sign-in page and seed script and Mohamed's student page carry no AI attribution and are counted as team-written.

# 8. Project management

We planned the work on November 2 and chose the stack on November 4, a day behind plan. Each feature went into `main` through a pull request with one reviewer. Because testing was originally planned after the demo, we tested and built at the same time.

TO ADD (team): what went well, what we would change, and one lesson per person.

# Appendix A. Running the project

1. Install Node.js 22.13 or newer.
2. `git clone https://github.com/a0merr/University-Food-Pantry-CSE-350-.git`, then `npm install`.
3. `npm run seed` to load demo data, then `npm start` and open http://localhost:3000. Demo accounts: `staff@pantry.demo` and `student1@pantry.demo` to `student3@pantry.demo` (passwords are printed by the seed script).
4. `npm test` runs unit and integration tests; `npm run test:e2e` and `npm run test:perf` run the browser and load tests.
