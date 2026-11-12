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

### Recount (Nov 12, 2026, after the bug-fix and stylesheet PR)

Tracked `.js`, `.html` and `.css` files total 3,598 lines.

| What is counted | Lines | Share |
|---|---:|---:|
| Claude Code foundation files | 360 | 10.0% |
| Claude Code, Nov 12 bug fixes and stylesheet (table below) | 224 | 6.2% |
| ChatGPT-assisted, Abdullah (same files as above) | 544 | 15.1% |
| **All AI-generated or AI-assisted** | **1,128** | **31.4%** |

Same upper-bound caveat as above for the ChatGPT row. Recount again after the student page, sign-in page and seed script are merged.

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
| `src/services/slots.js` | 7 | Fix: deleting a slot with past or cancelled pickups returned 500; now 409 with a clear message |
| `server.js` | 17 | Creates `data/` on start; trusts Render's HTTPS proxy so the Origin check and login rate limit work when deployed; sends due reminders once at startup |
| `tests/unit/reports.test.js`, `tests/unit/slots.test.js` | 57 | One unit test for each of the two fixes |

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
