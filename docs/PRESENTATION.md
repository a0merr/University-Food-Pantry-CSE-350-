# Demo deck outline (10 slides, ~8 minutes)

Numbers below are the ones actually measured on 2026-11-09 (`npm test` → 22/22). Anything not
measured is marked **not run** — do not put a number on it in the slides.

1. **Title** — Campus Food Pantry, CSE 350. Team names.
2. **Problem** — students need food privately and quickly; staff need stock, pickup slots and
   a record of what went out. One sentence per stakeholder.
3. **Architecture** — browser (vanilla JS pages) → Express API (`src/routes`) → services
   (`src/services`) → SQLite (`src/db-adapter.js`). One box per layer; note that the DB adapter
   is the only file that changes for Postgres.
4. **Requirements map** — FR1–FR10 in a table with the file that implements each one.
   Highlight FR10 (usage report) as the one that was missing and is now built.
5. **Student flow (demo)** — sign in → filter items → request → pick a slot → notification.
   Screenshot of `student.html` with the unread badge.
6. **Staff flow (demo)** — queue → prepare → picked up; inventory, donations, slots, alerts.
   Screenshot of `staff.html`.
7. **FR10 usage report** — screenshot of the report panel: pickups, units, students served,
   units by category. Say explicitly: counts only, no student identities.
8. **Testing** — 22 automated tests, 22 pass. Table: unit vs integration, which FR each covers.
   Say what is **not** covered: Playwright (TC13/TC15) and the 200-user load test (TC14) were
   not run.
9. **Defects** — the 7 fixed in this pass (BUG-01…07) and the 2 open (BUG-08 Vercel storage,
   BUG-09 cookie `Secure`). One line each.
10. **Deployment + next steps** — `vercel.json` is in the repo; the blocker is SQLite on Vercel
    (read-only/ephemeral), so the next step is a Postgres adapter. Then: run the load test,
    extend axe to the authenticated pages.

## Speaker notes to prepare

- Why one open request per student (the partial unique index) — prevents double-booking stock.
- Why capacity is checked inside `BEGIN IMMEDIATE` — two students, one last place.
- Why the report has no emails — privacy requirement, and it is asserted in a test.
