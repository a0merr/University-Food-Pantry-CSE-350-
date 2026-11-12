# AI Usage Disclosure

This file records the AI-generated or AI-assisted code currently present in this backup implementation branch. Recount the totals after the team finishes merging into the final submission branch.

## Current Count

Measured on November 12, 2026 after the stylesheet cleanup in this branch.

| Counted source | Lines | Share |
|---|---:|---:|
| Tracked `.js`, `.html`, and `.css` source files | 1,116 | 100.0% |
| AI-assisted implementation starter in this backup branch | 1,116 | 100.0% |

This branch is an AI-assisted implementation starter, so the branch-level AI share is counted as 100% until individual files are replaced, rewritten, or attributed to team-written work. Do not use this number for the final team repository without reconciling it against accepted merged code.

## Merge Note

The main branch history includes a correction that Andrew's FR5, FR6, FR8, FR9, FR10, and staff page work were hand-written. Preserve that correction when merging this backup branch into the team repository.

## Update (November 12, 2026)

Nothing from this branch has been merged into `main`. The changes below were made on this branch
after the November 12 backup commit (`0010845`). They are AI-generated, like the rest of the branch:

| Change | File | Nature |
|---|---|---|
| Stylesheet rewrite (layout, panels, chips, responsive rules) | `public/css/styles.css` (324 lines) | AI-generated |
| This disclosure and the README AI section | `docs/AI_USAGE.md`, `README.md` | AI-generated |
| Deck outline and test report updates | `docs/PRESENTATION.md`, `docs/TEST_REPORT.md`, `docs/TEST_CASES.md` | AI-generated |

The defect fixes BUG-01 to BUG-07 in `docs/TEST_REPORT.md` were already part of the starter when it
was first backed up (test report dated November 9, 2026). They are not later fixes.

**The 100% figure above is still the branch-level number and has not been reduced.** The team-written
work named in the Merge Note (Andrew's FR5, FR6, FR8, FR9, FR10 and staff page) is recorded in the
`main` branch history, not in this backup branch, so it cannot be subtracted from this branch's line
count without double-counting. Reconcile the two branches before quoting a final percentage.

Screenshots used for the deck live in `docs/screenshots/` and are excluded from the line count.

## What to Recount for Final Submission

Count only tracked `.js`, `.html`, and `.css` source files. Exclude `node_modules/`, `package-lock.json`, generated databases, screenshots, and documentation. If the team substantially rewrites an AI-assisted file by hand, record the final accepted ownership here instead of carrying over this starter-branch percentage.
