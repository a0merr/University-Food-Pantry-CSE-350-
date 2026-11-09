# AI-Generated Code Disclosure

The assignment requires at least 10% AI-generated code and asks us to say where it is. This file lists every AI-generated source file in the project.

- **Tool:** Claude Code (Anthropic), model Claude Opus 5.5
- **Date generated:** November 9, 2026
- **Marker:** every AI-generated file starts with the comment `AI-generated (Claude Code) - see docs/AI_USAGE.md`. Files without that comment were written by the team.

## AI-generated files (shared foundation)

| File | Lines | Purpose |
|---|---:|---|
| `src/db.js` | 129 | SQLite schema (users, sessions, items, donations, pickup slots, requests, notifications, alerts, settings), plus `openDatabase()` and `transaction()` helpers |
| `src/lib/errors.js` | 17 | `AppError` class and shortcuts (`badRequest`, `notFound`, `conflict`, ...) for HTTP error responses |
| `src/lib/time.js` | 41 | Local-time ISO helpers and pickup-time formatting ("Tue, Nov 10 at 1:30 PM") |
| `src/lib/validate.js` | 26 | Input checks: required strings, whole numbers, IDs |
| `src/auth/passwords.js` | 27 | Salted scrypt password hashing and SHA-256 helper (NFR1) |
| `public/js/api.js` | 28 | Browser `fetch` wrapper: JSON bodies, CSRF header, error messages |
| `public/js/ui.js` | 92 | Browser DOM helpers: safe element builder, status messages, date formatting, status chips |
| **Total** | **360** | |

## Team-written code

Everything else in `src/`, `public/`, `tests/` and `server.js` is written by the team: every feature for FR1–FR10, the server and routes, the pages, and the tests.

## AI share

Update this when implementation is finished:

```
AI share = 360 / (total lines of source code) x 100%
```

Count only `.js`, `.html` and `.css` source files, not `node_modules/` or `package-lock.json`. To stay at about 10%, the team-written code should come to roughly 3,000+ lines. If the team edits an AI-generated file substantially, note the change here.
