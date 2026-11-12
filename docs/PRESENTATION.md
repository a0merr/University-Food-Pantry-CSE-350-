# Demo deck outline (10 slides, about 8 minutes)

> **Not the team deck.** This outline, its numbers and the screenshots in `docs/screenshots/` describe
> the AI-generated starter on this backup branch, not the team's code on `main`. Build the real deck
> from `main`.

Numbers below are the ones actually measured on 2026-11-12 (`npm.cmd test`: 22/22). Anything not
measured is marked **not run**. Do not put a number on it in the slides.

1. **Title** - Campus Food Pantry, CSE 350. Team names.
2. **Problem** - students need food privately and quickly; staff need stock, pickup slots and
   a record of what went out. One sentence per stakeholder.
3. **Architecture** - browser (vanilla JS pages) to Express API (`src/routes`) to services
   (`src/services`) to SQLite (`src/db-adapter.js`). One box per layer; note that the DB adapter
   is the only file that changes for Postgres.
4. **Requirements map** - FR1-FR10 in a table with the file that implements each one.
   Highlight FR10 (usage report) as the one that was missing and is now built.
5. **Student flow (demo)** - sign in, filter items, request food, pick a slot, receive notification.
   Screenshot: `docs/screenshots/02-student.png` (item list) and `03-student-requested.png`
   (request created, unread notification).
6. **Staff flow (demo)** - queue, prepare, mark picked up; inventory, donations, slots, alerts.
   Screenshot: `docs/screenshots/04-staff.png`; mobile layout in `05-staff-mobile.png`.
7. **FR10 usage report** - screenshot of the report panel: pickups, units, students served,
   units by category. Say explicitly: counts only, no student identities.
   (The report panel is the last section of `04-staff.png`.)
8. **Testing** - 22 automated tests, 22 pass. Table: unit vs integration, which FR each covers.
   Say what is **not** covered: authenticated accessibility checks, Playwright browser flows and
   the 200-user load test were not run.
9. **Defects** - the 7 fixed in this pass (BUG-01 to BUG-07) and the 2 open (BUG-08 Vercel storage,
   BUG-09 cookie `Secure`). One line each.
10. **Deployment and next steps** - `vercel.json` is in the repo; the blocker is SQLite on Vercel
    (read-only/ephemeral), so the next step is a Postgres adapter. Then: run the load test,
    extend axe to the authenticated pages.

## Speaker notes to prepare

- Why one open request per student (the partial unique index): prevents double-booking stock.
- Why capacity is checked inside `BEGIN IMMEDIATE`: two students, one last place.
- Why the report has no emails: privacy requirement, and it is asserted in a test.
