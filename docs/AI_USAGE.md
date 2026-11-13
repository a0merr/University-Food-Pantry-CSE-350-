# AI-Generated Code Disclosure

The assignment requires at least 10% AI-generated code and asks us to say where it is. This file lists every AI-generated source file in the project.

- **Tool:** Claude Code (Anthropic), model Claude Opus 5.5
- **Date generated:** November 9, 2026
- **Marker:** every AI-generated file starts with the comment `AI-generated (Claude Code) - see docs/AI_USAGE.md`. Additional ChatGPT-assisted changes are documented below.

## AI-generated files (shared foundation)

| File | Lines | Purpose |
|---|---:|---|
| `src/db.js` | 129 | SQLite schema (users, sessions, items, donations, pickup slots, requests, notifications, alerts, settings), plus `openDatabase()` and `transaction()` helpers |
| `src/lib/errors.js` | 17 | `AppError` class and shortcuts (`badRequest`, `notFound`, `conflict`, ...) for HTTP error responses |
| `src/lib/time.js` | 41 | Local-time ISO helpers and pickup-time formatting ("Tue, Nov 10 at 1:30 PM") |
| `src/lib/validate.js` | 26 | Input checks: required strings, whole numbers, IDs |
| `src/auth/passwords.js` | 27 | Salted scrypt password hashing and SHA-256 helper (NFR1) |
| `public/js/api.js` | 28 | Browser `fetch` wrapper: JSON bodies, request header, error messages |
| `public/js/ui.js` | 92 | Browser DOM helpers: safe element builder, status messages, date formatting, status chips |
| **Total** | **360** | |

## Team-written code

Other project code includes team-written and separately disclosed AI-assisted contributions: every feature for FR1–FR10, the server and routes, the pages, and the tests.

## AI share

Update this when implementation is finished:

```
AI share = 360 / (total lines of source code) x 100%
```

Count only `.js`, `.html` and `.css` source files, not `node_modules/` or `package-lock.json`. The assignment requires at least 10%. If the team edits an AI-generated file substantially, note the change here.

### Current count (Nov 10, 2026, after PR #8 and the cancel-route fix)

Tracked `.js`, `.html` and `.css` files total 3,381 lines.

| What is counted | Lines | Share |
|---|---:|---:|
| Claude Code foundation files | 360 | 10.6% |
| ChatGPT-assisted, Abdullah: inventory route, inventory service, inventory tests, `src/auth/routes.js`, his 75 lines of `server.js` | 544 | 16.1% |
| **All AI-generated or AI-assisted** | **904** | **26.7%** |

The Claude Code files alone meet the at-least-10% requirement. The ChatGPT row counts each file in full. That makes 26.7% an upper bound, because only parts of `src/auth/routes.js` and `server.js` were AI-assisted. Recount after the student page, sign-in page, styles and seed script are merged.

**Correction (Nov 10, 2026):** an earlier version of this file listed Andrew's pickup, notification, alert and report code (FR5, FR6, FR8–FR10) and the staff page as ChatGPT-assisted. Andrew wrote that code by hand, so that entry was removed and the share recounted.

### Recount (Nov 12, 2026, after PRs #21, #22 and #23)

Tracked `.js`, `.html` and `.css` files total 7,756 lines, including the tests (after Gavin's QA tests, PR #21; Mohamed's student page, PR #22; and Andrew's fixes).

| What is counted | Lines | Share |
|---|---:|---:|
| Claude Code foundation files | 360 | 4.6% |
| Claude Code, Andrew, Nov 12: bug fixes, stylesheet, staff cancel button, sign-out link, staff account check, QA bug fixes (table below) | 436 | 5.6% |
| Claude Code, Gavin, Nov 12: QA tests (section below) | 3,700 | 47.7% |
| ChatGPT-assisted, Abdullah (same files as above) | 544 | 7.0% |
| **All AI-generated or AI-assisted** | **5,040** | **65.0%** |

Claude Code code in total is 4,496 lines (58.0%), so the at-least-10% requirement is met. The ChatGPT row counts whole files, so the total is an upper bound. Counted as team-written: Abdullah's `public/index.html` and `scripts/seed.js` (PR #14) and Mohamed's student page, `public/js/student-filter.js`, his changes to `public/js/student-pickup.js` and `tests/unit/student-filter.test.js` (PR #22); their commits carry no AI attribution. Abdullah and Mohamed: if AI helped, add a section below and move the lines.

### Recount (Nov 13, 2026, after PR #28)

Tracked `.js`, `.html` and `.css` files total 8,153 lines. PR #28 (Gavin's student-page browser tests) added 400 lines and removed 3, all in `tests/e2e/`: the new `student.spec.js` (279 lines) and additions to `accessibility.spec.js`, `mobile.spec.js` and `support.js`. Its commit carries a `Co-Authored-By: Claude Opus 5.5` trailer. No application code changed.

| What is counted | Lines | Share |
|---|---:|---:|
| Claude Code foundation files | 360 | 4.4% |
| Claude Code, Andrew, Nov 12 (table below) | 436 | 5.3% |
| Claude Code, Gavin, Nov 12: QA tests, PRs #21 and #28 (section below) | 4,097 | 50.3% |
| ChatGPT-assisted, Abdullah (same files as above) | 544 | 6.7% |
| **All AI-generated or AI-assisted** | **5,437** | **66.7%** |

Claude Code code in total is 4,893 lines (60.0%). Without the tests, the application code is unchanged: 1,110 of 2,898 lines (38.3%). Gavin's row is the line count of his files (section below) minus the 15 lines Andrew changed in them, which are counted in Andrew's row. Mohamed used AI only for ideas and troubleshooting (section below), so his files stay counted as team-written.

## Claude Code changes, November 12, 2026

- **Tool:** Claude Code (Anthropic), model Claude Opus 5.5
- **Requested by:** Andrew Merritt
- **How the bugs were found:** an end-to-end check of the running server (book, cancel, prepare, complete, report, delete slot, login behind an HTTPS proxy) and a headless-browser check of `staff.html` with axe

| File | Lines (added / changed) | What changed |
|---|---:|---|
| `public/css/styles.css` | 138 new | Shared stylesheet. Its first 121 lines are Andrew's hand-written styles, moved unchanged from the inline `<style>` in `staff.html`; the comment header and the "Part 2" section (status chips, report metrics, focus outlines, student item cards, pickup-time buttons, notification list, sign-in form helpers) are AI-generated |
| `public/staff.html` | 1 | Inline `<style>` replaced with a link to `/css/styles.css` |
| `public/js/staff-reports.js` | 2 | Report status table shows readable labels ("Picked up" instead of `picked_up`) |
| `src/services/reports.js` | 3 | FR10 fix: top items no longer count cancelled requests |
| `src/services/slots.js` | 11 | Fixes: deleting a slot with past or cancelled pickups returned 500 (now 409 with a clear message); editing a slot could move it into the past (now 400) |
| `server.js` | 23 | Creates `data/` on start; trusts Render's HTTPS proxy so the Origin check and login rate limit work when deployed; sends due reminders once at startup; answers malformed JSON with 400 instead of 500 |
| `public/js/staff-pickups.js` | 13 | FR6: Cancel button in the staff pickup queue (uses the existing cancel endpoint; the student is notified and the stock released) |
| `tests/unit/reports.test.js`, `tests/unit/slots.test.js` | 73 | One unit test for each of the three service fixes |
| `public/js/signout.js`, `public/staff.html` | 14 | Sign-out link in the staff page header; any page can reuse `signout.js` with an `id="sign-out"` link. `signout.js` starts with the AI-generated marker comment |
| `tests/unit/signout-ui.test.js` | 22 | Checks the staff page's sign-out link and account check |
| `public/js/staff-guard.js`, `public/staff.html` | 42 | Issue #19: the staff page re-checks the signed-in account on load and when the tab comes back into view, and explains when the browser is now signed in as a student (all tabs share one sign-in). Starts with the AI-generated marker comment |
| `server.js`, `scripts/seed.js`, `src/lib/time.js`, `src/services/pickups.js` | 24 | Known bugs from Gavin's QA tests: the server and seed script default to the pantry's time zone (`America/New_York`; Render runs in UTC, which put pickup-time checks, reminders and report dates 5 hours off); unknown `/api` routes answer with a JSON 404; request bodies over 100 KB get 413 instead of 500; a pickup time skipped by daylight saving is rejected; the queue's date filter includes 23:59:59 |
| `tests/unit/time-and-queue.test.js` | 51 new | Tests for the queue date filter and the daylight-saving check |
| `public/css/styles.css` | 2 | Student page: the form holding the item grid stacks, so the item cards fill the width instead of one narrow column |
| `public/js/signout.js` | 2 | Catch a failed logout instead of leaving an unhandled rejection (found by Gavin's tests) |
| `tests/unit/frontend-pages.test.js`, `tests/unit/edge-and-security.test.js`, `tests/integration/server-edge.test.js`, `tests/e2e/auth.spec.js` | 15 | After PRs #21 and #22 merged: the student-page tests use the real `student.html` and its new messages; the sign-out test expects no leaked error; five known-bug tests that now pass lose their `todo`; the DST tests pin the US Eastern time zone |

## Claude Code: QA tests (Gavin Marvelle, November 12, 2026)

- **Tool:** Claude Code (Anthropic), model Claude Opus 5.5. Both commits in PR #21 (`b3ee47a`, `8b02c1e`) carry a `Co-Authored-By: Claude Opus 5.5` trailer.
- **Developer:** Gavin Marvelle (QA lead)
- **Files (3,700 lines):** `playwright.config.js`, `tests/helpers.js`, `tests/server-harness.js`, `tests/e2e/` (accessibility, auth, mobile, staff, `serve.js`, `support.js`), `tests/integration/server.test.js`, `tests/integration/server-edge.test.js`, `tests/perf/load-test.js`, and in `tests/unit/`: `api-routes`, `auth-routes`, `db-and-passwords`, `edge-and-security`, `frontend-core`, `frontend-pages`, `inventory-routes`, `lib`, `services-edge-cases`.
- **PR #28 (397 more lines):** the new `tests/e2e/student.spec.js`, plus additions to `tests/e2e/accessibility.spec.js`, `tests/e2e/mobile.spec.js` and `tests/e2e/support.js`. Commit `c5e6745` carries a `Co-Authored-By: Claude Opus 5.5` trailer.
- **What Gavin did himself:** TO ADD (Gavin): e.g. chose what to test, set the load-test targets, reviewed and ran the tests, logged the issues.

## AI assistance: Mohamed Muse (student page, PR #22, November 12, 2026)

- **Developer:** Mohamed Muse
- **Files:** `public/student.html`, `public/js/student-filter.js`, his changes to `public/js/student-pickup.js`, and `tests/unit/student-filter.test.js`
- **How AI was used:** for ideas and troubleshooting only. No AI-generated code was added, so these files are counted as team-written and the AI share does not change.

## Additional AI Assistance — Inventory and Security

- **Tool:** ChatGPT (OpenAI)
- **Date:** November 10, 2026
- **Developer:** Abdullah Saadawi
- **Features:** FR7 Inventory and Donations, FR1 authentication improvements, and NFR1 security.

| File | AI-assisted contribution |
|---|---|
| `src/routes/inventory.js` | Inventory and donation API routes with staff authorization |
| `src/services/inventory.js` | Inventory management and donation logic |
| `tests/unit/inventory.test.js` | Inventory unit tests |
| `server.js` | Inventory route integration and request security middleware |
| `src/auth/routes.js` | Login email normalization and login rate limiting |

These contributions were implemented with ChatGPT assistance and tested locally. The existing shared foundation files were generated with Claude Code.

The AI-generated code percentage should be recalculated when the full project is complete.

## Demo documents drafted with Claude Code (November 12, 2026)

These are documents, not source code, so they are not part of the code share above.

| File | What Claude Code did |
|---|---|
| `docs/presentation/CSE350_Demo_Deck_DRAFT.pptx` | Drafted the slide deck from the code on `main`, with screenshots of the running app |
| `docs/report/REPORT_DRAFT.md`, `docs/report/CSE350_Written_Report_DRAFT.docx` | Drafted the written report; sections marked TO ADD are for each teammate to write |
| `docs/presentation/RECORDING_GUIDE.md`, `docs/presentation/CSE350_Recording_Guide.docx` | Drafted the recording plan |
| `docs/presentation/README.md` | Index of the demo materials and the remaining to-do list |
| `docs/presentation/screenshots/` | Screenshots taken in a headless browser from `main` with the seed data |

On November 13 (PR #29), Claude Code also updated the deck, the report and the README at Andrew's request: the team's lessons learned, the test counts and AI share after PR #28, and the speaker notes for Andrew's slides.
