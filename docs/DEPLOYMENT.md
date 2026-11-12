# Deployment (Vercel)

## What is in the repo

- `vercel.json` — builds `server.js` with `@vercel/node` and sends every path to it.
- `server.js` — already reads `process.env.PORT` and `process.env.DB_FILE`, so it runs unchanged on Vercel.
- `package.json` — `engines.node >= 22.13` (needed for the built-in `node:sqlite`).

## The blocker: the database

The app stores everything in a local SQLite file (`data/pantry.db`). On Vercel the filesystem is
read-only except `/tmp`, and `/tmp` is per-instance and wiped on every cold start. So a deploy
with the default `DB_FILE` will start, but **data will not persist** and two instances will not
see each other's data.

Pick one before the demo:

1. **Demo-only (fastest):** set `DB_FILE=/tmp/pantry.db` and run the seed on first boot.
   Fine for a 10-minute demo on one instance; say in the report that it is not persistent.
2. **Persistent (recommended for the report):** move the data to a hosted Postgres
   (Supabase/Neon) and replace `src/db-adapter.js` with a Postgres adapter. The services only
   use `prepare().get()/all()/run()` and `db.transaction()`, so the adapter is the only file
   that has to change. This is the same work as the "Supabase project" item in the plan.

## Steps

```powershell
npm i -g vercel          # once
vercel login
vercel link              # create/link the project
vercel env add DB_FILE production   # e.g. /tmp/pantry.db for the demo-only option
vercel --prod
```

Then open the deployment URL, sign in with a seeded demo account, and check:

- `/` loads and the CSP header is present (`X-Content-Type-Options`, `Content-Security-Policy`).
- `POST /api/auth/login` sets the `sid` cookie. **Note:** `sessions.setCookie` does not set
  `Secure`, which is fine over HTTPS but should be added for production.
- `/api/reports/usage` returns JSON for staff (FR10).

## Known gaps for a real deployment

- No `Secure` flag on the session cookie (see above).
- No rate limit on `/api/auth/register`.
- Email is written to `email_outbox`, not sent (by design for the course).
- `data/` must stay out of git (`.gitignore` already covers it).
