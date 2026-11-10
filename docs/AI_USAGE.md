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
| ChatGPT-assisted, Andrew: pickup, slot, notification, reminder, alert and report services; pickup and staff routes; staff page and scripts; their tests; his 15 lines of `server.js` | 2,477 | 73.3% |
| **All AI-generated or AI-assisted** | **3,381** | **100%** |

The ChatGPT rows count each file in full. That makes 100% an upper bound, because only parts of `src/auth/routes.js` and `server.js` were AI-assisted. Recount after the student page, sign-in page, styles and seed script are merged.

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

## Additional AI Assistance — Pickups, Notifications, Alerts and Reports

- **Tool:** ChatGPT (OpenAI)
- **Date:** November 10, 2026
- **Developer:** Andrew Merritt
- **Features:** FR5 pickup times, FR6 cancellations, notifications and reminders, FR8 pickup fulfillment, FR9 low-stock alerts, FR10 usage report, and the staff page.

| File | AI-assisted contribution |
|---|---|
| `src/services/slots.js`, `src/services/pickups.js` | Pickup slots, booking with limits and stock reservation, cancel, prepare, complete |
| `src/services/notifications.js`, `src/services/reminders.js` | In-app notifications, email outbox, 24-hour reminders |
| `src/services/alerts.js`, `src/services/reports.js` | Low-stock alerts and the anonymous usage report |
| `src/routes/pickups.js`, `src/routes/staff.js` | Student and staff pickup API routes |
| `server.js` | Mounting the pickup and staff routers, static pages, hourly reminder job |
| `public/staff.html`, `public/js/staff-pickups.js`, `public/js/staff-reports.js`, `public/js/student-pickup.js` | Staff page and the staff and student pickup scripts |
| `tests/unit/` (alerts, notifications, pickup-routes, pickups, reminders, reports, slots, staff-reports-ui, staff-routes, staff-ui, student-pickup-ui), `tests/integration/staff-flow.test.js` | Unit and integration tests for the above |

These contributions were implemented with ChatGPT assistance and tested locally (`npm test`: 30 passing on Nov 10).

The AI-generated code percentage should be recalculated when the full project is complete.
