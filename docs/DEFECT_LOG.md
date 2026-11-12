# Defect log
| ID | Severity | Steps to reproduce | Expected | Actual | Owner | Status |
|---|---|---|---|---|---|---|
| GAP-01 | High | Visit aggregate report endpoint | Anonymous usage report | Not implemented in patch | TBD | **Fixed** — `GET /api/reports/usage` (staff only, counts only, no student identities) |
| GAP-02 | Medium | Load testing | Confirm NFR3 | Requires run and measurements | TBD | Open — run `npm run test:perf` |
| GAP-03 | Medium | Authenticated accessibility | Complete AA coverage | Manual review required | TBD | Open — axe only covers the login page today |
| BUG-01 | High | `npm install` / `npm test` in a fresh clone | Tests run | No `package.json`; both commands failed | TBD | Fixed — added `package.json` |
| BUG-02 | Medium | `node --test tests/unit tests/integration` on Node 22+ | Tests run | `Cannot find module ...\tests\unit` | TBD | Fixed — `npm test` uses `tests/unit/*.test.js` |
| BUG-03 | High | FR10 aggregate report | Staff can see usage totals | Endpoint missing | TBD | Fixed — `src/services/reports.js` + staff panel |
| BUG-04 | Medium | FR5 book a full slot | 409, no overbooking | Capacity check duplicated in service and route | TBD | Fixed — single `slots.book()` inside the transaction |
| BUG-05 | Medium | FR8 pickup after stock was reduced | Refuse, keep request `prepared` | `quantity`/`reserved` could go negative | TBD | Fixed — guarded update → 409 `stock_changed` |
| BUG-06 | Low | FR9 open alerts | One query in the service | SQL duplicated in `routes/alerts.js` | TBD | Fixed — `inventory.openAlerts()` |
| BUG-07 | Low | FR6 notification list | Unread filter, limit, mark-all-read | None of these existed | TBD | Fixed — `notifications.js` + route |
| BUG-08 | Medium | Deploy to Vercel | Data persists | SQLite file is read-only/ephemeral on Vercel | TBD | Open — see `docs/DEPLOYMENT.md` |
| BUG-09 | Low | Session cookie in production | `Secure` flag | Cookie has `HttpOnly; SameSite=Strict` only | TBD | Open |
