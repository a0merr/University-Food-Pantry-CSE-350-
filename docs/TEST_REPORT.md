# Test report

Execution date: 2026-11-09. Environment: Windows 11, Node v25.8.0, local SQLite (`node:sqlite`), fake seed data.
Command: `npm test` (`node --test tests/unit/*.test.js tests/integration/*.test.js`).

**Result: 22 tests, 22 passed, 0 failed** (unit + integration). Playwright (TC13–TC15) and the
autocannon load test (TC14) were **not run** in this pass — no Chromium installed and no
measurements taken. They are marked Blocked below, not passed.

## Test cases

| ID | Requirement | How it was checked | Result |
|---|---|---|---|
| TC01 | FR1 | `tests/integration/auth.test.js` (login sets session), `tests/unit/passwords.test.js` | Pass |
| TC02 | FR1/NFR1 | `auth.test.js`: unauthenticated `/api/items` → 401 JSON | Pass |
| TC03 | FR7 | `tests/integration/staff-flow.test.js`: staff adds item, it is listed | Pass |
| TC04 | FR2 | `tests/unit/inventory.test.js`: student view has `available`, no `quantity`/`reserved` | Pass |
| TC05 | FR3 | Not automated (UI filter in `public/js/student.js`); covered indirectly by `GET /items` tests | Blocked (manual) |
| TC06 | FR4 | `tests/unit/requests.test.js`: reserve increases `reserved` | Pass |
| TC07 | FR4 | `requests.test.js`: second open request → 409, no partial change | Pass |
| TC08 | FR5 | `slots-and-reports.test.js`: full slot hidden from students, re-booking own slot OK, moving slots releases the old place | Pass |
| TC09 | FR6 | `requests.test.js` (cancel releases stock) + `notifications.test.js` (cancel/schedule create notifications) | Pass |
| TC10 | FR8 | `fulfilment.test.js`: prepare → pickup decrements `quantity` and `reserved`; states cannot be skipped; pickup refused if stock changed | Pass |
| TC11 | FR9 | `fulfilment.test.js`: alert opens at threshold, resolves when stock returns | Pass |
| TC12 | FR10 | `reports.test.js` + `slots-and-reports.test.js`: counts, date range, staff-only, no emails in output | Pass (was "not implemented") |
| TC13 | NFR2 | axe + manual keyboard/screen-reader review | Blocked (not run) |
| TC14 | NFR3 | `npm run test:perf` (autocannon, 200 connections, 10 s) | Blocked (not run) |
| TC15 | NFR4 | Playwright student/staff specs | Blocked (not run) |

## Defects found and fixed in this pass

| ID | Severity | What | Fix |
|---|---|---|---|
| BUG-01 | High | No `package.json`, so `npm install` / `npm test` failed | Added `package.json` with scripts and deps |
| BUG-02 | Medium | README test command `node --test tests/unit tests/integration` fails on Node 22+ | `npm test` uses the glob form |
| BUG-03 | High | FR10 aggregate report missing | `src/services/reports.js`, `GET /api/reports/usage`, staff panel |
| BUG-04 | Medium | FR5 slot capacity check lived in `requests.js` and was duplicated in the route | Moved to `slots.book()`, one place, inside the transaction |
| BUG-05 | Medium | FR8 pickup could drive `quantity`/`reserved` negative if stock changed after preparing | Guarded `UPDATE ... WHERE quantity>=? AND reserved>=?` → 409 `stock_changed`; prepare also checks stock |
| BUG-06 | Low | FR9 alert query duplicated in the route | `inventory.openAlerts()` |
| BUG-07 | Low | FR6 notification list had no unread filter, no limit, no mark-all-read | Added to `notifications.js` + route |

## Still open

See `DEFECT_LOG.md` (GAP-02 load test, GAP-03 accessibility review, plus the deployment gaps in
`DEPLOYMENT.md`).
