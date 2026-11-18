::: {custom-style="Cover Kicker"}
CSE 350 · Introduction to Software Engineering · Fall 2026
:::

::: {custom-style="Cover Title"}
Campus Food Pantry Platform
:::

::: {custom-style="Cover Subtitle"}
Final Team Documentation
:::

::: {custom-style="Cover Text"}
A web application that lets students request food from the campus pantry privately and book a pickup time, and gives pantry staff one place to run inventory, donations, pickups and anonymous usage reports.
:::

::: {custom-style="Cover Label"}
Group 15 · Team members
:::

::: {custom-style="Cover Member"}
Andrew Merritt — Project manager and developer
:::

::: {custom-style="Cover Member"}
Abdullah Saadawi — Developer
:::

::: {custom-style="Cover Member"}
Mohamed Muse — Developer
:::

::: {custom-style="Cover Member"}
Gavin Marvelle — QA lead
:::

::: {custom-style="Cover Label"}
Date
:::

::: {custom-style="Cover Member"}
November 15, 2026
:::

::: {custom-style="Cover Label"}
Course
:::

::: {custom-style="Cover Member"}
University of Louisville · Instructor: Dr. Sai Nethra Betgeri
:::

::: {custom-style="Cover Label"}
Links
:::

::: {custom-style="Cover Small"}
Source code: https://github.com/a0merr/University-Food-Pantry-CSE-350-
:::

::: {custom-style="Cover Small"}
Live site: https://university-food-pantry-cse-350.onrender.com
:::

```{=openxml}
<w:p><w:r><w:br w:type="page"/></w:r></w:p>
```

::: {custom-style="TOC Heading"}
Table of Contents
:::

```{=openxml}
<w:p><w:r><w:fldChar w:fldCharType="begin" w:dirty="true"/></w:r><w:r><w:instrText xml:space="preserve"> TOC \o "1-3" \h \z \u </w:instrText></w:r><w:r><w:fldChar w:fldCharType="separate"/></w:r><w:r><w:t>Open in Word and press F9 to build the table of contents.</w:t></w:r><w:r><w:fldChar w:fldCharType="end"/></w:r></w:p>
```

# Brief Overview of the Project

## The problem

Many college students do not have reliable access to enough food, yet campus pantries are often underused. A Fall 2021 survey of 529 students at Texas Woman's University found that 49.2% were food insecure, but 89.8% had never used the campus pantries and 47.8% did not know the pantries existed. The barriers students named most often were lack of time, lack of transportation, limited pantry hours and social stigma [1]. A U.S. Government Accountability Office review of 31 studies found campus food insecurity rates ranging from 9% to well over 50% [2].

Walking into a pantry during posted hours, signing a paper sheet and waiting in a visible line is exactly the experience that keeps many students away. Pantry staff, for their part, often track stock by hand or in a spreadsheet and tally visits manually when the university asks how the pantry is used.

## Our solution

The **Campus Food Pantry Platform** is a web application with two kinds of users:

- **Students** sign in, see what is in stock, search the shelves and filter them by category or dietary need (vegan, vegetarian, gluten-free and so on), choose quantities within the pantry's limits and book a pickup time. They see their booked pickup on their page and can cancel it, which returns the food to the shelf. They are notified when the order is scheduled, when it is ready and when it is cancelled, and they get a reminder within 24 hours of the pickup. Nobody else sees the request except the staff who fill it.
- **Pantry staff** run a pickup queue (prepare, complete or cancel each order), manage pickup times and their capacity, manage the inventory (add, edit and retire items, set low-stock thresholds, per-visit limits and dietary tags, log donations), get low-stock alerts, and run a usage report for the university that contains counts only and never a student's name or email.

The topic meets the course requirement that the project relate to public health and welfare: it lowers the practical and social cost of asking for food.

## Users and stakeholders

| Stakeholder | What they need from the system | Where the system meets it |
|---|---|---|
| Students | Privacy, a quick way to see what is available, a pickup time that fits their schedule, and confirmation that the order is ready | Student portal (FR2–FR6), NFR1 privacy |
| Pantry staff and volunteers | One place to see orders in pickup order, keep stock accurate, know what is running low and answer the university's questions | Staff pickup desk (FR5, FR7–FR10) |
| University administration | Evidence of how the pantry is used, without information that identifies any student | Usage report with counts only (FR10, NFR1) |
| Course instructor and team | A working, tested, documented system built by a four-person team in one semester | This document, the repository and the test suites |

## Scope

**In scope:** ten functional requirements (FR1–FR10) and four non-functional requirements (NFR1–NFR4), listed in Section 2. **Out of scope**, by decision in Sprint 1 to control scope creep: university single sign-on, real email or text-message delivery, smart lockers, delivery, multi-campus support and barcode scanning.

## Final status at a glance

| Requirement | Title | Status at delivery |
|---|---|---|
| FR1 | Account registration and login | Done: email and password accounts with student and staff roles (no university single sign-on) |
| FR2 | Browse available inventory | Done |
| FR3 | Search and filter inventory | Done: search by name or category, a category filter and a dietary filter |
| FR4 | Submit an item request | Done: per-visit limits and stock checks are enforced on the server |
| FR5 | Schedule a pickup time | Done: full and past times cannot be booked |
| FR6 | Pickup notifications and cancellation | Done: scheduled, ready, reminder and cancelled notifications; students cancel from their page, staff from the queue |
| FR7 | Manage inventory and donations | Done: staff inventory screen to add, edit and retire items and log donations |
| FR8 | Fulfill requests | Done |
| FR9 | Low-stock alerts | Done |
| FR10 | Anonymous usage reports | Done: counts by status, top items and stock by category |
| NFR1 | Student privacy and security | Done |
| NFR2 | Accessibility (WCAG 2.1 AA) | Done for automated scans and keyboard-only use |
| NFR3 | Performance (3 s with 200 users) | Met on the server: every page and data request answered within 94 ms (p99) with 200 users |
| NFR4 | Device compatibility | Done: browser tests pass in Chromium, Firefox and WebKit (Safari's engine) and on a phone-sized screen |

**By the numbers:** 3,405 lines of application code; 315 automated tests (249 unit and integration, 66 browser), with the desktop browser tests also passing in Firefox and WebKit, plus 9 load scenarios; 100% line coverage of the server code; 26 pull requests merged by the Development Demo plus the final-fixes branch; 20 defects found and all 20 fixed. The site is deployed on Render and redeploys automatically when the `main` branch changes.

## Links

- **Source code:** https://github.com/a0merr/University-Food-Pantry-CSE-350-
- **Live site:** https://university-food-pantry-cse-350.onrender.com (free hosting; if it is asleep or unavailable, run it locally as described in Section 16)
- **Development Demo recording:** https://drive.google.com/file/d/1eYzJMOtO-ii8ReUGqOwY2UhufdKQ50EF/view?usp=sharing

## How this document is organized

The sections follow the order of the assignment. Sections 2 to 8 cover what we set out to build and why (requirements, plan, method, need, design, risks and ethics). Sections 9 to 13 cover what we built and how we know it works (implementation, screenshots, test plan, test scripts and test report). Sections 14 to 17 cover the team, ethical guidance, the repository and the references, including every piece of AI-generated code used in the project.

# Requirements

## How the requirements were gathered

Requirements were written and prioritized in Sprint 1 (September 14–22, 2026) by Andrew Merritt, using Gavin Marvelle's review of existing pantry systems and the need analysis in Section 5. Each requirement has an ID, a title, a description and the requirements it depends on. They were presented at the Mid-Semester Demo on September 25, 2026 and did not change in wording afterwards; Section 2.7 records how the delivered system differs from them.

## Functional requirements

| ID | Title | Description | Depends on |
|---|---|---|---|
| FR1 | Account registration and login | Students and pantry staff should be able to create an account and log in using their university credentials. The system should distinguish between student and staff roles and show each role only the features available to it. | None |
| FR2 | Browse available inventory | A logged-in student should be able to view all items currently in stock at the pantry, including the item name, category and quantity available. | FR1 |
| FR3 | Search and filter inventory | A student should be able to search inventory by item name and filter by category (canned goods, produce, hygiene, etc.) and dietary tag (vegetarian, halal, gluten-free, etc.). | FR2 |
| FR4 | Submit an item request | A student should be able to select items and quantities and submit them as a single request. The system should enforce the pantry's per-visit limits and prevent requesting more than is in stock. | FR2 |
| FR5 | Schedule a pickup time | After submitting a request, a student should be able to choose a pickup time from the slots the pantry has made available. Full slots should not be selectable. | FR4 |
| FR6 | Pickup notifications | A student should be notified when their request is ready for pickup and receive a reminder before their scheduled pickup time. A student should be able to cancel a pickup, which returns the items to inventory. | FR5 |
| FR7 | Manage inventory | Pantry staff should be able to add new items, edit item details and quantities, and remove items from inventory, including logging incoming donations. | FR1 |
| FR8 | Fulfill requests | Pantry staff should be able to view all pending requests in pickup-time order, mark a request as prepared, and mark it as picked up. Completed requests should automatically reduce inventory quantities. | FR4, FR7 |
| FR9 | Low-stock alerts | Pantry staff should be alerted when an item's quantity falls below a threshold that staff set for that item. | FR7 |
| FR10 | Anonymous usage reports | Pantry staff should be able to generate usage reports (visits per week, most-requested items, busiest pickup times) for the university. Reports should contain only aggregate totals and never identify individual students. | FR8 |

## Non-functional requirements

| ID | Title | Description | Depends on |
|---|---|---|---|
| NFR1 | Student privacy | A student's identity and request history should be visible only to authorized pantry staff, and only as needed to fulfill a request. No student-identifying information should appear in any report or be shared outside the pantry. | None |
| NFR2 | Accessibility | The system should meet WCAG 2.1 AA accessibility standards so it can be used with screen readers, keyboard-only navigation and high-contrast settings. | None |
| NFR3 | Performance | Pages should load within 3 seconds under normal use, with up to 200 users active at the same time. | None |
| NFR4 | Device compatibility | The system should work in current versions of major desktop and mobile web browsers without requiring the user to install an application. | None |

## Priority of requirements

Requirements were ranked so that the order follows the dependencies: staff must be able to stock inventory (FR7) before students can browse it, and privacy (NFR1) ranks second because it shapes how login and data storage are built. If time ran short, the lowest-ranked items were the first candidates to cut, so a cut would never remove a core feature.

| Rank | ID | Title | Type | Reason for its rank |
|---:|---|---|---|---|
| 1 | FR1 | Account registration and login | Functional | Every other feature needs to know who the user is and their role |
| 2 | NFR1 | Student privacy | Non-functional | Shapes how accounts, sessions and data are stored from the start |
| 3 | FR7 | Manage inventory | Functional | There is nothing to browse or request until stock exists |
| 4 | FR2 | Browse available inventory | Functional | The first student-facing step |
| 5 | FR4 | Submit an item request | Functional | The core student action |
| 6 | FR8 | Fulfill requests | Functional | Closes the loop for staff and updates stock |
| 7 | FR5 | Schedule a pickup time | Functional | Needed for a real pickup, builds on FR4 |
| 8 | NFR4 | Device compatibility | Non-functional | Most students will use a phone |
| 9 | FR3 | Search and filter inventory | Functional | Convenience on top of FR2 |
| 10 | NFR2 | Accessibility | Non-functional | Required for equal access; checked continuously |
| 11 | FR6 | Pickup notifications | Functional | Improves the experience once FR5 works |
| 12 | FR9 | Low-stock alerts | Functional | Staff convenience on top of FR7 |
| 13 | NFR3 | Performance | Non-functional | Load is small for one campus |
| 14 | FR10 | Anonymous usage reports | Functional | Valuable, but depends on everything above |

## Use cases

Figure 1 shows who uses each part of the system. The university never signs in; it only receives the counts-only report that staff produce.

![Figure 1. Use case diagram: students, pantry staff and the university administration](images/diagrams/dia-01-use-case.png){width=6.50in}

## Acceptance criteria

Each requirement was turned into testable acceptance criteria in Given–When–Then form. These criteria are what the test scripts in Section 12 check.

| ID | Given | When | Then |
|---|---|---|---|
| FR1 | A registered user with a role | They sign in with the right email and password | They land on the page for their role; a wrong password shows "Incorrect email or password." and a student cannot load staff data |
| FR2 | A signed-in student | The student page loads | Every active item with stock above zero is listed with its name, category and amount available; items with no stock or that are inactive are hidden |
| FR3 | The item list is shown | The student types in Search or picks a category | Only matching items are shown, without caring about upper or lower case |
| FR4 | A student with no open request | They submit items and quantities | The request is saved only if every item is in stock, within its per-visit limit and the request has 8 or fewer different items |
| FR5 | Pickup times exist | The student books one | Only future times with open spots can be booked; a full or past time is refused |
| FR6 | A booked pickup | It is scheduled, prepared, cancelled, or 24 hours away | The student gets the matching notification; cancelling returns the reserved stock |
| FR7 | A staff member is signed in | They add an item, change a quantity or log a donation | Stock changes and the donation is recorded against that staff member; students are refused |
| FR8 | Scheduled pickups exist | Staff mark one prepared, then picked up | Statuses change in that order only, and completing removes the items from stock |
| FR9 | An item has a low-stock threshold | Its available amount reaches the threshold | An alert opens for staff, and it closes when the item is restocked |
| FR10 | Pickups exist | Staff run the report for a date range | Totals are shown with no student names or emails |
| NFR1 | Any user | They use the system | Passwords and session tokens are stored only as hashes, and only staff can see who requested what |
| NFR2 | Any page state | It is scanned with axe-core and used with the keyboard only | No WCAG 2.1 A or AA violations, and every task can be done without a mouse |
| NFR3 | 200 users at once | They load pages and data | Responses arrive well within 3 seconds |
| NFR4 | A desktop browser or a phone | A user opens any page | The page works, with no sideways scrolling on a phone and nothing to install |

## Changes to the requirements during implementation

The wording of the requirements did not change, but the delivered system differs from them in the ways below. Each change was a deliberate decision, recorded here so the grader can see what was and was not built.

| Requirement | Change | Reason |
|---|---|---|
| FR1 | Email and password accounts instead of university credentials (single sign-on) | Campus single sign-on is not available to a class project. This was risk 2 in our risk analysis; the plan was to use test accounts and keep login in its own module so single sign-on can replace it later |
| FR1 | Students can register through the API, but there is no registration page; demo accounts come from the seed script | Time. The demo uses seeded accounts |
| FR6 | Notifications are shown in the app and written to an email outbox table; no real email is sent | A real mail provider was out of scope for a class project. The outbox shows exactly what would be sent |
| FR7 | Items are retired (hidden from students) rather than deleted | Deleting an item would break the history of pickups and donations that refer to it, and the usage report needs that history |
| FR10 | The report shows pickups by status, requests per day (API), top ten items and stock by category; "busiest pickup times" is not included | Time. All figures are counts only, as required |
| FR4 | The limit of 8 different items per visit is a database setting; staff cannot change it on screen. Per-item limits can be set on screen | Cut for time |

Three gaps listed at the Development Demo were closed on November 15, 2026, before this document: the FR7 staff inventory screen with item thresholds, limits, dietary tags and retiring (defects D-17 to D-19), the FR3 dietary filter, and the FR6 student cancel button. Section 9.5 describes them.

## Requirements traceability

| Requirement | Design element (Section 6) | Main code | Test cases (Section 12) | Status |
|---|---|---|---|---|
| FR1 | Login sequence, sessions table | `src/auth/routes.js`, `public/index.html` | TC_01, TC_02, TC_03 | Done (changed) |
| FR2 | Student portal, items table | `public/student.html`, `public/js/student-filter.js` | TC_04 | Done |
| FR3 | Student portal | `public/js/student-filter.js` | TC_05, TC_23 | Done |
| FR4 | Booking sequence, requests and request_items | `src/services/pickups.js` `schedule()` | TC_06, TC_20 | Done |
| FR5 | Pickup slots, booking sequence | `src/services/slots.js`, `schedule()` | TC_07, TC_17 | Done |
| FR6 | Notifications, reminders, state diagram | `src/services/notifications.js`, `reminders.js`, `cancel()`, `public/js/student-mypickup.js` | TC_08, TC_18, TC_22 | Done (changed) |
| FR7 | Inventory service, donations table | `src/routes/inventory.js`, `src/services/inventory.js`, `public/js/staff-inventory.js` | TC_09, TC_21 | Done (changed) |
| FR8 | Fulfillment sequence, state diagram | `prepare()`, `complete()`, `public/js/staff-pickups.js` | TC_10 | Done |
| FR9 | Alerts service | `src/services/alerts.js` | TC_11 | Done |
| FR10 | Reports service | `src/services/reports.js`, `public/js/staff-reports.js` | TC_12 | Done (changed) |
| NFR1 | Security design | `server.js`, `src/auth/*`, all routers | TC_13, TC_14, TC_19 | Done |
| NFR2 | UI design | `public/*`, `public/css/styles.css` | TC_15 | Done |
| NFR3 | Architecture, indexes | whole server | TC_16 | Met |
| NFR4 | Responsive layout | `public/css/styles.css` | TC_15, TC_24 | Done |

# Initial Implementation Milestones

## Initial development plan (September 25, 2026)

At the Mid-Semester Demo the team committed to the plan below: five Agile sprints, each with an owner and a priority, ending on the final documentation date.

| Sprint | Task | Priority | Owner | Start | End |
|---|---|---|---|---|---|
| 1 · Requirement analysis | Write and prioritize requirements | High | Andrew | Sep 14 | Sep 22 |
| 1 · Requirement analysis | Review existing pantry systems | Medium | Gavin | Sep 21 | Sep 24 |
| 2 · Design | Front-end wireframes for each requirement | High | Mohamed | Sep 22 | Oct 9 |
| 2 · Design | Back-end diagrams and system architecture | High | Abdullah | Sep 22 | Oct 9 |
| 3 · Implementation | Login, roles and inventory (FR1, FR7, NFR1) | High | Abdullah | Oct 12 | Oct 23 |
| 3 · Implementation | Browse, search and requests (FR2–FR4) | High | Mohamed | Oct 19 | Oct 30 |
| 3 · Implementation | Pickups, fulfillment, alerts, reports (FR5, FR6, FR8–FR10) | Medium | Andrew | Nov 2 | Nov 13 |
| 4 · Testing | Functional testing of every requirement | High | Gavin | Nov 16 | Nov 20 |
| 4 · Testing | Accessibility and performance testing (NFR2–NFR4) | Medium | Gavin | Nov 16 | Nov 25 |
| 5 · Final documentation | Write final report and user guide | High | Andrew | Nov 30 | Dec 3 |
| 5 · Final documentation | Final review and submission | High | All | Dec 4 | Dec 4 |

![Figure 2. Initial development plan as a Gantt chart](images/diagrams/dia-09-gantt-plan.png){width=6.50in}

## Implementation milestones for the Development Demo

Early in November the plan was tightened to fit the Development Demo due on Friday, November 13. The table compares that plan with what happened, taken from the pull request history.

| Milestone | Planned | Actual | Status |
|---|---|---|---|
| Tech stack chosen | Tue, Nov 3 | Wed, Nov 4; changed to Express and SQLite on Nov 9 | 1 day late |
| Repository and starter code | Tue, Nov 3 | Mon, Nov 9 | 6 days late |
| Core features merged (FR1, FR5–FR10, FR7 API) | Mon, Nov 9 | Tue, Nov 10 (pull requests #1–#10) | 1 day late |
| Sign-in and student pages | Mon, Nov 9 | Thu, Nov 12 (pull requests #14 and #22) | 3 days late |
| Testing and bug fixes | Tue–Wed, Nov 10–11 | Thu, Nov 12 (pull requests #12, #20, #21, #23, #24) | 1 day late |
| Deployed live on Render | Not in the plan | Thu, Nov 12 | Done |
| Slides and recording | Wed–Thu, Nov 11–12 | Thu–Fri, Nov 12–13 | 1 day late |
| Development Demo submitted | Fri, Nov 13 | Fri, Nov 13 | On time |
| Student page browser tests | Not in the plan | Fri, Nov 13 (pull request #28) | Done |
| Final fixes: FR7 staff screen, FR3 dietary filter, FR6 student cancel, defects D-17 to D-20, Firefox and WebKit tests | Not in the plan | Sat–Sun, Nov 14–15 (branch `andrew/final-fixes`) | Done |
| Final documentation | Nov 30 – Dec 4 | Started Nov 14; this document | On track for Nov 30 |

![Figure 3. Actual implementation, testing and documentation timeline](images/diagrams/dia-10-gantt-actual.png){width=6.50in}

## Variance from the plan and how we recovered

The design sprint finished on time, but implementation started about four weeks later than the initial plan: the repository went up on November 9 instead of in mid-October. Two things let the team still deliver every requirement at least in part by November 13:

1. **Working in parallel.** Once the shared foundation existed (database schema, error and validation helpers, password hashing and browser helpers), each developer built their requirements on their own branch at the same time, and the QA lead wrote tests against the same API instead of waiting for the code to be finished.
2. **Priorities held.** The highest-ranked requirements (FR1, NFR1, FR7, FR2, FR4, FR8, FR5) were built first. What was cut for the Development Demo came from the bottom of the list or was polish on top of a working feature: the FR7 staff screen, the dietary filter and the student cancel button. All three were finished on November 15, in time for this document.

Testing (Sprint 4) ran alongside implementation rather than after it. That moved testing earlier than planned, which is why 16 of the 20 defects were found and fixed before the Development Demo instead of in late November, and the last four by November 15.

# Methodology Used for the Project

## Agile, in five sprints

We used an **Agile** process with five sprints, each ending in something we could show: requirements, designs, working code, test results and this document. Agile suited the project for three reasons:

- **Fixed dates, flexible scope.** The demo dates were fixed by the course. Ranking the requirements (Section 2.4) let us decide what to cut without endangering core features, which is what happened in Sprint 3.
- **A small team with overlapping skills.** Four people meant everyone wrote code or tests, and short feedback loops (pull request reviews, test runs) mattered more than heavy documents handed between phases.
- **Learning as we went.** Several important problems only appeared once real code ran on the real host, such as the HTTPS proxy and the server clock (Section 7.3). An iterative process let us fix them within days.

A strict waterfall process would have put all testing in Sprint 4 (from November 16) and found these problems after the Development Demo.

| Sprint | Goal | Deliverable | Outcome |
|---|---|---|---|
| 1 · Requirement analysis | Understand the need and write testable requirements | FR1–FR10, NFR1–NFR4, priority table, existing-systems review | Presented at the Mid-Semester Demo, Sep 25 |
| 2 · Design | Design every screen and back-end flow before coding | Wireframes and back-end flow for each FR; architecture diagram; risk and ethics analysis | Presented at the Mid-Semester Demo, Sep 25 |
| 3 · Implementation | Build the requirements in priority order | Working site on Render; 26 pull requests merged | All FRs at least partly delivered by Nov 13; the last three gaps closed Nov 15 |
| 4 · Testing | Verify every requirement and the NFRs | 315 automated tests, 9 load scenarios, 24 test cases, defect log | Run alongside Sprint 3; re-run in three browsers for this report on Nov 15 |
| 5 · Final documentation | Document the project for hand-over | This document, source zip, repository | Due Nov 30 |

## Roles

| Role | Person | Responsibilities |
|---|---|---|
| Project manager (also a developer) | Andrew Merritt | Sprint plan and timeline, coordinating the team, reviewing and merging pull requests, assembling the demo deck and reports |
| Developer | Abdullah Saadawi | Server setup, accounts and security, inventory API, deployment |
| Developer | Mohamed Muse | Front-end design and the student portal |
| QA lead | Gavin Marvelle | Test plan, test cases, automated test suites, defect tracking, test report |

## Engineering practices

- **One branch per feature, merged by pull request.** Each change went on its own branch (for example `andrew/pickups` or `qa/unit-tests`) and was merged into `main` through a pull request after a teammate looked at it. All 26 merges are visible on GitHub.
- **A shared, documented API.** The README lists every endpoint with who may call it and who owns it, so the front end and back end could be built at the same time.
- **Testable code by design.** Every service takes a context object, `ctx = { db, clock }`, as its first argument. Tests pass an in-memory database and a fake clock, so time-based rules (reminders, "is this pickup in the future?") can be tested exactly.
- **Tests written with the code.** Each developer wrote unit tests for their own services; the QA lead added integration, browser, accessibility and load tests, and the whole suite was re-run after every fix (regression testing).
- **Defects in GitHub Issues.** Each defect was logged with steps to reproduce, the expected result and the actual result, then fixed in a pull request.
- **Continuous deployment.** Render redeploys the live site whenever `main` changes, so the deployed site always matched the reviewed code.
- **Declared AI use.** Every AI-generated or AI-assisted file is listed in `docs/AI_USAGE.md` and marked in the code (Section 17.2).

![Figure 4. Development workflow from requirement to deployed code](images/diagrams/dia-11-workflow.png){width=6.50in}

## Tools

| Purpose | Tool |
|---|---|
| Version control and code review | Git and GitHub (branches, pull requests) |
| Defect tracking | GitHub Issues |
| Editor | Visual Studio Code |
| Runtime and package manager | Node.js 22.13 or newer, npm |
| Unit and integration tests | `node:test` (built into Node.js), jsdom for page scripts |
| Browser and accessibility tests | Playwright with Chromium, Firefox and WebKit; axe-core |
| Load tests | autocannon |
| Hosting | Render (web service) |
| AI assistance | Claude Code and ChatGPT, as a writing and coding aid; every use is declared in `docs/AI_USAGE.md` |
| Diagrams and slides | PowerPoint for the demos; Mermaid for the diagrams in this document |

## Definition of done

A requirement counted as done when: (1) its code was merged into `main` through a reviewed pull request; (2) its unit tests passed with `npm test`; (3) it worked on the deployed site; (4) at least one test case in Section 12 verified it; and (5) any AI involvement was recorded in `docs/AI_USAGE.md`.

# Need Analysis

## Evidence that the need is real

| Finding | Source |
|---|---|
| 49.2% of 529 surveyed students were food insecure | Brito-Silva et al., *Nutrients*, 2022 [1] |
| 89.8% of them had never used the campus food pantries | [1] |
| 47.8% did not know the pantries existed | [1] |
| The barriers named most often were lack of time, lack of transportation, limited pantry hours and social stigma | [1] |
| 31 U.S. studies found campus food insecurity rates from 9% to well over 50% | U.S. GAO, GAO-19-95, 2018 [2] |
| Nearly 2 million at-risk students who were potentially eligible did not receive SNAP benefits | [2] |

The pattern is clear: a large share of students need food, help exists on campus, and students still do not use it. The barriers are practical (time, hours, getting there) and social (being seen asking for help). A tool that lets a student order privately, at any hour, and pick up at a time that suits them addresses both.

## Stakeholder needs

| Stakeholder | Need | Requirement that answers it |
|---|---|---|
| Student | Ask for food without being seen asking | FR4, NFR1 |
| Student | Know what is available before making the trip | FR2, FR3 |
| Student | Pick up at a time that fits classes and work | FR5 |
| Student | Know when the order is ready, and be reminded | FR6 |
| Student | Use a phone, a screen reader or the keyboard | NFR2, NFR4 |
| Pantry staff | See what to prepare, in pickup order | FR8 |
| Pantry staff | Keep stock and donations accurate | FR7 |
| Pantry staff | Know before an item runs out | FR9 |
| University | Usage figures that never identify a student | FR10, NFR1 |

## Review of existing systems

In Sprint 1, Gavin Marvelle reviewed how existing pantry systems work and which of their practices our platform should adopt. The review below reflects what we found in September 2026.

| | PantrySoft (campus pantry software) | Link2Feed (food bank software) | Walk-in pantry with forms (common campus setup) |
|---|---|---|---|
| How it works | Students register and shop online from any device; pickup appointments with text or email reminders | Client case management and household intake | Students visit in person during posted hours |
| Notable features | Single sign-on and eligibility checks; barcode inventory and usage reports; smart-locker pickup after hours | Handles duplicate and shared households; compliance reporting for TEFAP and CSFP programs; inventory across pantry sites; simple enough for volunteers | Paper sign-in sheet or an online request form; stock counted by hand or in a spreadsheet; visit totals tallied manually |
| Cost and fit | Single sign-on needs a custom-priced enterprise tier; the student portal is an add-on | Built for agencies, not students | No cost beyond staff time |
| What we took from it | A proven model: order online, pick up at a set time | Keep records strong but simple enough for volunteers | Keep it free and simple, but private and not limited to open hours |

## Gap analysis

| Gap in existing options | How our platform closes it | Requirements |
|---|---|---|
| Campus features cost extra | Built for one campus, with login included | FR1 |
| Built for agencies, not students | A short student flow: browse, request, pick a time | FR2–FR5 |
| Visiting in person is public | Discreet online requests, seen only by the staff filling them | FR4, NFR1 |
| Limited hours | Bookable pickup times, ready alerts and reminders | FR5, FR6 |
| Reports can expose students | Aggregate-only reports by design | FR10, NFR1 |
| Manual stock counts | Stock that updates on every booking, cancellation and pickup, with low-stock alerts | FR7–FR9 |

## How well the final system meets the need

The delivered system addresses the barriers that software can address. A student can browse and book from a phone at any hour; only staff see the request; the student is told when the order is ready; and staff get an accurate, automatically updated count of stock with alerts. Two parts of the need remain. **Awareness** (47.8% did not know the pantry existed) cannot be fixed by software alone and needs campus outreach. **Transportation** is outside the system's reach; offering pickup times spread across the day is the system's contribution.

# Software Design

## Design goals

The design follows from the requirements and the risks:

1. **Privacy by design (NFR1).** Store the least data possible, hash every secret, check the role on every request, and make reports aggregate-only at the query level so no screen can leak a name by accident.
2. **Correct stock under concurrency (FR4, FR5, FR8).** Two students must never both get the last unit or the last spot. Every change to stock or bookings runs inside one database transaction.
3. **Simple to run and to learn.** No front-end framework, no build step and an embedded database, so any teammate can clone the project and run it with `npm install` and `npm start`.
4. **Testable.** Business rules live in services that take their database and clock as parameters, so they can be tested without a server and with a fixed time.
5. **Accessible and phone-friendly (NFR2, NFR4).** Plain semantic HTML, labelled controls, live regions for messages, and a layout that turns tables into stacked cards on narrow screens.

## Original design from Sprint 2

In Sprint 2 the team designed every functional requirement twice: a front-end wireframe of the screen (Mohamed Muse) and a back-end flow of the steps the server takes (Abdullah Saadawi), plus a high-level architecture (Abdullah Saadawi). These designs were presented at the Mid-Semester Demo and guided the implementation. Figures 5 to 15 reproduce them; Section 6.4 lists where the final system differs.

![Figure 5. Original high-level architecture (Sprint 2, Abdullah Saadawi)](images/midsem/architecture-original.png){width=6.50in}

![Figure 6. FR1 account registration and login: wireframe and back-end flow (Sprint 2)](images/midsem/fr1-design.png){width=6.50in}

![Figure 7. FR2 browse available inventory: wireframe and back-end flow (Sprint 2)](images/midsem/fr2-design.png){width=6.50in}

![Figure 8. FR3 search and filter inventory: wireframe and back-end flow (Sprint 2)](images/midsem/fr3-design.png){width=6.50in}

![Figure 9. FR4 submit an item request: wireframe and back-end flow (Sprint 2)](images/midsem/fr4-design.png){width=6.50in}

![Figure 10. FR5 schedule a pickup time: wireframe and back-end flow (Sprint 2)](images/midsem/fr5-design.png){width=6.50in}

![Figure 11. FR6 pickup notifications: wireframe and back-end flow (Sprint 2)](images/midsem/fr6-design.png){width=6.50in}

![Figure 12. FR7 manage inventory: wireframe and back-end flow (Sprint 2)](images/midsem/fr7-design.png){width=6.50in}

![Figure 13. FR8 fulfill requests: wireframe and back-end flow (Sprint 2)](images/midsem/fr8-design.png){width=6.50in}

![Figure 14. FR9 low-stock alerts: wireframe and back-end flow (Sprint 2)](images/midsem/fr9-design.png){width=6.50in}

![Figure 15. FR10 anonymous usage reports: wireframe and back-end flow (Sprint 2)](images/midsem/fr10-design.png){width=6.50in}

## Final architecture

The delivered system is a single Node.js web application with five layers (Figure 16). A request from the browser passes down through the layers and the answer passes back up; no layer skips the one below it.

![Figure 16. Final layered architecture](images/diagrams/dia-02-architecture.png){width=6.50in}

| Layer | Responsibility | Files |
|---|---|---|
| 1. Presentation | Three pages and their scripts. Build every element with a safe helper (`el()`), never `innerHTML` with data, and send every request through `api()`, which adds the CSRF header and turns error answers into readable messages | `public/` |
| 2. Web | Serve the pages, parse JSON bodies (100 KB limit), refuse cross-site writes, run the hourly reminder job, and turn every error into `{ "error": { "code", "message" } }` | `server.js` |
| 3. API routers | Map URLs to services; look up the session from the cookie; check the role (student or staff) | `src/auth/routes.js`, `src/routes/*.js` |
| 4. Services | All business rules: limits, capacity, stock reservations, status changes, notifications, alerts and reports | `src/services/*.js`, `src/lib/*.js` |
| 5. Data | SQLite database with foreign keys, CHECK constraints and indexes; a `transaction()` helper | `src/db.js` |

## How the final design differs from the Sprint 2 design

| Sprint 2 design | Final design | Why |
|---|---|---|
| "Relational database" | SQLite through Node's built-in `node:sqlite` module, one file | No database server to install or host; enough for one campus; transactions and constraints still available |
| Login with university credentials | Email and password, roles stored per account | Campus single sign-on is not available to a class project (risk 2) |
| Separate notification service using email or campus messaging | Notifications stored in the app, plus an `email_outbox` table that records each email that would be sent | No mail provider in scope; the outbox keeps the design ready for one |
| Logging and monitoring service | Console logs, visible in Render's log viewer | Enough for the demo; listed as future work |
| Background jobs for reminders and low-stock checks | Reminders run at startup and every hour; low-stock checks run after every booking, cancellation and completed pickup, and on demand | Checking stock right after it changes is simpler and never misses a change |
| Separate "View Cart" and "Confirm Pickup Time" screens (FR2, FR5 wireframes) | One student page: quantities next to each item, then the pickup times and one submit button | Fewer steps for the student; one request saves both the items and the time |
| Category and dietary filters (FR3 wireframe) | Search box (name or category), a category menu and a dietary menu | As designed; staff set the tags on the inventory screen |
| A separate staff inventory screen with "+ Add Item" (FR7 wireframe) | An Inventory panel on the staff desk: an add and edit form, a donation form, and an item table with Edit and Retire | Staff do all their work on one page |
| "Cancel Pickup" on a pickup status screen (FR6 wireframe) | A "Your pickup" panel on the student page with a two-step Cancel | No extra page; the second step prevents accidental cancels |
| Report with visits, most-requested item, busiest pickup time (FR10 wireframe) | Report with inventory totals, pickups by status, top ten items and stock by category | Time; all counts, as designed |

## Module design

Figure 17 shows the server modules and how they depend on each other. Routers depend on services; services depend on the database helper; nothing depends on a router. The reminder service reuses the notification service rather than writing notifications itself.

![Figure 17. Server modules and their public functions](images/diagrams/dia-03-modules.png){width=4.54in}

| Module | Responsibility | Owner | Lines |
|---|---|---|---:|
| `server.js` | Express app, middleware, CSRF guard, error handler, reminder job | Abdullah (Andrew: proxy, time zone and error fixes) | 129 |
| `src/db.js` | Schema, `openDatabase()`, `transaction()` | AI-generated foundation | 129 |
| `src/auth/routes.js` | Register, login with rate limit, logout, current user | Abdullah (Andrew: async hashing, Nov 15) | 212 |
| `src/auth/passwords.js` | scrypt hashing (sync and async), SHA-256, constant-time compare | AI-generated foundation | 47 |
| `src/lib/` (errors, validate, time) | Error types, input checks, local-time helpers | AI-generated foundation | 86 |
| `src/routes/inventory.js` | Item and donation endpoints (staff only for writes); re-check low stock after changes | Abdullah | 81 |
| `src/routes/pickups.js` | Pickup times, booking, a student's own pickups, viewing, cancelling, notifications | Andrew | 109 |
| `src/routes/staff.js` | Queue, prepare, complete, pickup times, alerts, reports | Andrew | 99 |
| `src/services/inventory.js` | Items, details (threshold, limit, dietary tags), retiring, donations | Abdullah (Andrew: item details, Nov 15) | 199 |
| `src/services/slots.js` | Pickup times and capacity | Andrew | 157 |
| `src/services/pickups.js` | Booking, cancel, queue, a student's own pickups, prepare, complete | Andrew | 337 |
| `src/services/notifications.js` | In-app notifications and the email outbox | Andrew | 125 |
| `src/services/reminders.js` | Reminders for pickups in the next 24 hours | Andrew | 48 |
| `src/services/alerts.js` | Open and resolve low-stock alerts | Andrew | 83 |
| `src/services/reports.js` | Counts-only usage and inventory reports | Andrew | 108 |
| `public/index.html` | Sign-in page | Abdullah | 59 |
| `public/student.html`, `student-filter.js`, `student-pickup.js` | Student portal: browse, filter, request and book | Mohamed (`student-pickup.js` shared with Andrew; dietary filter added Nov 15) | 261 |
| `public/js/student-mypickup.js` | "Your pickup" panel with Cancel | Andrew (Claude Code, Nov 15) | 68 |
| `public/staff.html`, `staff-pickups.js`, `staff-reports.js` | Staff pickup desk | Andrew | 342 |
| `public/js/staff-inventory.js` | Staff inventory panel | Andrew (Claude Code, Nov 15) | 171 |
| `public/js/api.js`, `ui.js` | Fetch wrapper, safe DOM helpers | AI-generated foundation | 120 |
| `public/css/styles.css` | Shared styles and phone layout | Andrew (part AI-generated) | 288 |
| `scripts/seed.js` | Demo accounts, items (with dietary tags and limits) and pickup times | Abdullah | 92 |

## Data design

Figure 18 shows the database. Ten tables hold the data, plus a `settings` table for the visit limit. Full columns are in `src/db.js`, which is listed in Section 17.2.

![Figure 18. Entity-relationship diagram (keys and the most important columns)](images/diagrams/dia-04-erd.png){width=6.50in}

| Table | Purpose | Important rules |
|---|---|---|
| `users` | Students and staff | Email is unique regardless of case; `role` must be `student` or `staff`; only a scrypt hash of the password is kept |
| `sessions` | Signed-in sessions | The primary key is the SHA-256 hash of the session token, so a copy of the database cannot be used to sign in; deleted with the user |
| `items` | Pantry items | `quantity` is what is on the shelf and `reserved` is what is held for open requests; students see `quantity − reserved`. CHECK constraints keep both at zero or more and `reserved ≤ quantity`, so stock can never go negative even if code has a bug. `dietary_tags` holds lower-case tags separated by commas; `active = 0` retires an item |
| `donations` | Incoming donations | Linked to the item and to the staff member who logged it |
| `pickup_slots` | Pickup times | `starts_at` is unique and stored as local time text; `capacity` must be positive |
| `requests` | A student's order | `status` is one of `submitted`, `scheduled`, `prepared`, `picked_up`, `cancelled`; timestamps record each step; indexed by student and by slot |
| `request_items` | Items in an order | One row per item per request; quantity must be positive |
| `notifications` | Messages shown to a student | Type is `scheduled`, `ready`, `reminder` or `cancelled`; `read_at` marks it read |
| `email_outbox` | Emails that would be sent | Stands in for a mail provider during development |
| `low_stock_alerts` | Alerts for staff | An alert is open until `resolved_at` is set |
| `settings` | Pantry-wide settings | `visit_item_limit` defaults to 8 |

**Why `reserved` is separate from `quantity`.** When a student books, the food is still on the shelf until the pickup. Reserving it, rather than removing it, means a cancellation simply releases the hold, a completed pickup removes it from both columns, and other students can never book food that is already promised.

**Why times are stored as local text.** Pickup times are stored as `2026-11-16T14:00:00` in the pantry's time zone, which sorts and compares correctly as text. Storing UTC would have shifted evening pickups to the next day in the queue's date filter; this rule is written down in the README for every developer.

## API design

Every endpoint is under `/api` and answers in JSON. Every `POST`, `PATCH` and `DELETE` must carry the header `X-Requested-With: fetch`, which the page helper `api()` adds. Errors always have the same shape: `{ "error": { "code": "conflict", "message": "Pickup slot is full." } }`.

| Method and path | Who may call it | What it does | Main error answers |
|---|---|---|---|
| `GET /health` | anyone | Server check | — |
| `POST /auth/register` | anyone | Creates a student account and signs in | 400 invalid input, 409 email taken |
| `POST /auth/login` | anyone | Signs in; sets the session cookie | 400, 401 wrong email or password, 429 too many attempts |
| `POST /auth/logout` | anyone | Ends the session | — |
| `GET /auth/me` | signed in | Returns the current user | 401 |
| `GET /items` | anyone | Lists items with available stock | — |
| `POST /items` | staff | Adds an item with its low-stock threshold, per-visit limit and dietary tags; re-checks low stock | 400, 401, 403 |
| `PATCH /items/:id` | staff | Changes any of an item's details (only the fields sent), or retires or restores it with `active`; re-checks low stock | 400 invalid value or below reserved, 404 |
| `POST /donations` | staff | Logs a donation and adds it to stock; re-checks low stock | 400, 404 |
| `GET /pickup-slots` | signed in | Lists future pickup times with open spots | 401 |
| `GET /pickups` | student | Lists the student's own open pickups, soonest first | 401, 403 |
| `POST /pickups` | student | Books items and a pickup time; sends a "scheduled" notification | 400 past time or over a limit, 404, 409 full time, not enough stock, or already has an open request |
| `GET /pickups/:id` | owner or staff | Shows one pickup | 403, 404 |
| `POST /pickups/:id/cancel` | owner or staff | Cancels; releases stock; notifies the student | 403, 404, 409 not open |
| `GET /notifications` | signed in | Own notifications; `?unread=true` filters | — |
| `PATCH /notifications/:id/read` | owner | Marks one read | 403, 404 |
| `GET /staff/pickups` | staff | Open pickups in pickup-time order; `?date=` and `?status=` filters | 401, 403 |
| `POST /staff/pickups/:id/prepare` | staff | Marks ready; sends a "ready" notification | 409 wrong status |
| `POST /staff/pickups/:id/complete` | staff | Marks picked up; removes stock | 409 wrong status |
| `GET`, `POST /staff/slots`; `PATCH`, `DELETE /staff/slots/:id` | staff | Manage pickup times | 400 past or invalid time, 409 duplicate time, capacity below bookings, or a time with pickups |
| `GET /staff/alerts`; `POST /staff/alerts/check` | staff | List open low-stock alerts; re-check stock now | — |
| `GET /staff/reports` | staff | Counts-only report; `?from=` and `?to=` dates | 400 invalid date |

## Dynamic behavior

### Signing in

![Figure 19. Sequence diagram: signing in (FR1, NFR1)](images/diagrams/dia-05-seq-login.png){width=6.50in}

The login route checks the rate limit before anything else, so a password-guessing script is stopped after five failures in fifteen minutes. When the email is unknown, the server still runs the slow password check against a dummy hash, so an attacker cannot tell from the response time which emails have accounts.

### Booking a pickup

![Figure 20. Sequence diagram: a student requests food and books a pickup (FR4, FR5, FR6, FR9)](images/diagrams/dia-06-seq-booking.png){width=6.50in}

All checks and writes for a booking happen inside one `BEGIN IMMEDIATE` transaction. SQLite then allows only one writer at a time, so two students racing for the last spot or the last can of soup are handled one after the other, and the second one gets a clear "full" or "not enough stock" answer. The notification and the low-stock check run after the booking has been committed.

### Fulfilling a pickup

![Figure 21. Sequence diagram: staff prepare and complete a pickup (FR8, FR6, FR9)](images/diagrams/dia-07-seq-fulfillment.png){width=6.50in}

### Life cycle of a request

![Figure 22. State diagram of a pickup request](images/diagrams/dia-08-state.png){width=6.50in}

A request can only move along the arrows in Figure 22. The server refuses any other move with `409 Conflict`, for example completing a pickup that was never prepared or cancelling one that was already picked up. The `submitted` status exists in the schema for a future "request now, choose a time later" flow, but the current flow creates requests directly as `scheduled`.

## Security design (NFR1)

| Threat | Control in the design | Where |
|---|---|---|
| Stolen database reveals passwords | Passwords hashed with salted scrypt (N = 16384, r = 8, p = 1); compared in constant time | `src/auth/passwords.js` |
| Stolen database lets someone sign in | Only the SHA-256 hash of each session token is stored | `sessions` table, `src/auth/routes.js` |
| Session theft through page scripts | Session cookie is `HttpOnly`, `SameSite=Lax`, and `Secure` in production | `startSession()` |
| Password guessing | Five failed logins per IP address in 15 minutes, then `429` | `checkLoginLimit()` |
| Finding out which emails have accounts | Same message and the same work for unknown emails and wrong passwords | login route, `DUMMY_HASH` |
| Cross-site request forgery | Every write needs `X-Requested-With: fetch` (a header other sites cannot send without permission) and, when present, a same-site `Origin` | `server.js` middleware |
| A student using staff features | Every staff endpoint checks the role on the server; the page also warns when the browser has switched to a student account | `requireStaff()`, `staff-guard.js` |
| A student seeing another student's pickup | Viewing and cancelling check that the user owns the pickup or is staff | `routes/pickups.js` |
| Script injection through names | Pages set `textContent`, never `innerHTML` with data; a browser test stores HTML in names and checks it is shown as text | `public/js/ui.js` |
| Oversized or malformed requests | 100 KB body limit (`413`), invalid JSON (`400`), strict input validation | `server.js`, `src/lib/validate.js` |
| Reports identifying students | Report queries select counts only; a unit test checks no name or email appears | `src/services/reports.js` |
| Real data in the repository | Only demo accounts; `data/` and `.env` are in `.gitignore` | `.gitignore`, `scripts/seed.js` |

## User interface design

The interface has three pages. The **sign-in page** sends each user to the page for their role. The **student portal** has four parts on one page, linked from the header: browse and request food (with search, category and dietary filters), choose a pickup time, your pickup (with Cancel), and notifications. The **staff pickup desk** has five panels: the pickup queue, pickup times, low-stock alerts, inventory and donations, and the usage report. Screenshots of every page are in Section 10.2.

Accessibility and phone use were designed in rather than added later:

- Every input has a visible `<label>`; buttons say what they do ("Request items and book pickup", not "Submit").
- Success messages are announced with `role="status"` and errors with `role="alert"`, so screen-reader users hear the result of every action.
- Every page has a language, a title and one `<main>` landmark; focused controls show a visible outline.
- The selected pickup time is a button with `aria-pressed="true"`, not just a color change.
- Cancelling a pickup takes two clicks, done inside the page rather than with a browser pop-up; the explanation next to the button is a live region, so screen readers announce it.
- Dietary tags and per-visit limits are written out on each item card, and quantity fields stop at the per-visit limit.
- Below 760 pixels wide, tables become stacked cards and each cell shows its column name (from a `data-label` attribute), so nothing scrolls sideways on a phone.

## Deployment design

![Figure 23. Deployment: GitHub, Render and the browser](images/diagrams/dia-12-deployment.png){width=6.50in}

The application runs as one Render web service built from the GitHub repository. Render ends HTTPS at its proxy and forwards plain HTTP to the server; because Render sets the `RENDER` environment variable, the server trusts exactly one proxy hop, so it sees the real protocol (needed for the `Origin` check) and the real client address (needed for the login rate limit). The server sets its time zone to the pantry's (`America/New_York`) because Render's machines run on UTC.

## Design decisions and trade-offs

| Decision | Alternatives considered | Why we chose it | Consequence |
|---|---|---|---|
| Express 5 on Node.js | Django, Spring Boot | One language (JavaScript) on the server and in the browser; the whole team could read all the code | No type checking; mitigated with input validation and tests |
| SQLite (`node:sqlite`) | PostgreSQL, MongoDB | No separate database server; real transactions and constraints; built into Node 22, so no native build step on Windows | One server process; Render's disk is reset on redeploy (risk R-10) |
| No front-end framework | React | No build step; three small pages; less to learn in a short sprint | Some repeated DOM code; kept small with the `el()` helper |
| Services take `ctx = { db, clock }` | Global database and `Date.now()` | Tests can use an in-memory database and a fixed time | Every call passes the context |
| Reserve stock at booking | Remove stock at booking | Food stays on the shelf until it is collected; cancelling is trivial | Two columns to keep in step, enforced by a CHECK constraint |
| Low-stock check after each change | Scheduled background job | Never misses a change; simpler | A little extra work per request; measured as negligible |
| Notifications in the app plus an email outbox | Real email provider | No cost, nothing to configure; same records a provider would need | Students must open the site to see notifications |
| Retire items instead of deleting them | Delete the row | Pickup and donation history keeps pointing at the item, so reports stay correct | Retired items stay in the staff table, marked "Retired" |
| Hash passwords asynchronously at login | `scryptSync` | Hashing runs on Node's thread pool, so a burst of sign-ins no longer blocks other requests (D-20) | Sync helpers kept for the seed script and tests |

# Risk Analysis

## Approach

Each risk was rated for **likelihood** and **impact** (Low, Medium or High), and given a plan to reduce it before it happened. The original register was written in Sprint 2 by Gavin Marvelle. Below, each original risk is followed by what actually happened, then by the new risks we discovered while building and deploying the system, and finally by the risks that remain if the system were used for real.

## Original risk register and outcomes

| ID | Risk | Why it could happen | Likelihood | Impact | Planned response | What happened |
|---|---|---|---|---|---|---|
| R-01 | Schedule slips | Five sprints alongside other classes and exams | Medium | High | Weekly check-ins; build high-priority requirements first so a cut never removes core features | **Occurred.** Implementation started on November 9 instead of October 12. The priority order held: every high-priority requirement was delivered, and the cuts were the FR7 staff screen, the dietary filter and the student cancel button (Section 3.3); all three were finished on November 15 |
| R-02 | No access to university login | Campus single sign-on may not be available to a class project | High | Medium | Keep login in its own module; demo with test accounts and switch to single sign-on later | **Occurred, handled as planned.** Email and password accounts; all login code is in `src/auth/`, and the seed script creates demo accounts |
| R-03 | Student data exposed | A leak would reveal who uses the pantry | Low | High | Role-based access, hashed passwords, HTTPS, store the minimum data | **Did not occur.** All planned controls were built and tested (Section 6.9); no real student data was ever stored |
| R-04 | Front end and back end do not fit | Developers build separately | Medium | Medium | Agree on the API early and integrate every week | **Partly occurred.** The API itself fit, because it was documented in the README and every page used `api()`. But the sign-in and student pages arrived last, so for a day signing in led to a missing page (GitHub Issues #11 and #18). Fixed by pull requests #14 and #22 |
| R-05 | Scope creep | Extra ideas like lockers, delivery or text messages | Medium | Medium | Anything outside FR1–FR10 goes to a backlog | **Controlled.** Nothing outside FR1–FR10 was built |
| R-06 | Accessibility or speed problems found late | Problems caught only in Sprint 4 | Medium | Medium | Run accessibility and speed checks every sprint | **Avoided.** Automated axe-core scans and load tests ran with the rest of the suite from November 12. Result: zero accessibility violations and one slowdown (D-20), fixed on November 15 |
| R-07 | Team member unavailable | Illness or conflicts during a sprint | Low | High | Shared repository and notes; each area has a backup | **Did not occur** for any long period. The shared repository, README and AI usage log kept everyone's work visible |

## Risks discovered during implementation

| ID | Risk | Likelihood | Impact | What happened and how we handled it |
|---|---|---|---|---|
| R-08 | The hosting proxy breaks the security checks | High | High | **Occurred (D-01, critical).** On Render, HTTPS ends at a proxy, so the server thought requests were plain HTTP and the `Origin` check rejected every sign-in. Fixed by trusting one proxy hop only when `RENDER` or `TRUST_PROXY` is set; an integration test covers it |
| R-09 | The server clock is in the wrong time zone | High | High | **Occurred (D-02).** Render runs on UTC, five hours ahead of the pantry, which shifted "is this pickup in the future?", reminders and report dates. Fixed by setting the server and seed script to `America/New_York`; tests pin the time zone |
| R-10 | Data is lost when the site redeploys | High | Medium | **Accepted for the demo.** Render's free web service resets its disk on each deploy, which deletes the SQLite file. The demo relies on the seed data. A real deployment needs a persistent disk or a hosted database |
| R-11 | Password hashing slows other requests during a burst of sign-ins | Medium | Low | **Fixed (D-20, November 15).** scrypt ran on the main thread, so while 10 people signed in at once, browsing slowed to about 550 ms (p99). Login now uses the asynchronous `crypto.scrypt`, which runs on Node's thread pool; the same load test now measures 69 ms |
| R-12 | Two students book the last spot or the last units at the same moment | Medium | High | **Prevented by design.** Every booking runs in a `BEGIN IMMEDIATE` transaction; three tests race two bookings and check that exactly one succeeds and stock never goes negative |
| R-13 | AI-generated code hides mistakes | Medium | Medium | **Mitigated.** Every AI-generated file was read, tested and reviewed in a pull request like any other code, and is listed in `docs/AI_USAGE.md`. Line coverage of the server code is 100% |
| R-14 | Free hosting is asleep, suspended or blocked when the grader visits | Medium | Medium | **Occurred.** When checked on November 15 the Render service answered "This service has been suspended by its owner." The README and Section 16 explain how to run the project locally in four commands; Chrome once showed a Safe Browsing false positive for the free subdomain |

## Remaining risks for a real deployment

| Risk | Likelihood | Impact | Recommended response |
|---|---|---|---|
| Data loss on redeploy (R-10) | High | High | Persistent disk or managed database; nightly backups |
| No university single sign-on | High | Medium | Replace `src/auth/` with the campus identity provider; keep roles in the app |
| Students miss notifications because none are emailed | Medium | Medium | Connect the `email_outbox` table to a mail provider |
| The hosted site is suspended or asleep (R-14) | Medium | Medium | Keep the Render service active while the project is graded; a paid instance does not sleep |
| No registration page for new students | Medium | Low | Add a sign-up page on top of the existing `POST /api/auth/register` |

## Risk matrix

The matrix places every risk by likelihood and impact after our responses. Risks in the top-right cells were the ones we handled first.

| Likelihood ↓ / Impact → | Low | Medium | High |
|---|---|---|---|
| **High** | — | R-02, R-10 | R-08 (fixed), R-09 (fixed) |
| **Medium** | R-11 (fixed) | R-04, R-05, R-06, R-13, R-14 | R-01, R-12 |
| **Low** | — | — | R-03, R-07 |

# Potential Ethical Issues and How They Are Mitigated

## Approach

The people this system serves are students who may be embarrassed to need food help, so the main ethical question throughout was: *what could this system do to a student who trusts it?* Gavin Marvelle identified six issues in Sprint 2; we added three more during implementation. For each one, the table shows the planned mitigation and what the delivered system actually does.

| Issue | Why it matters | Mitigation planned | What the delivered system does |
|---|---|---|---|
| **Privacy:** who uses the pantry is sensitive | A list of pantry users could embarrass or harm students if seen by others | Only staff filling a request see the student; store the minimum data (NFR1) | Only staff can load the queue (tested); students see only their own pickups; reports have counts only; passwords and session tokens are hashed; no real student data was ever stored |
| **Dual use:** data could be used against students | Request history could be used to profile students or affect aid decisions | Reports are aggregate only; no data shared outside the pantry (FR10) | The report queries return counts by status, item and category only; a unit test checks that no name or email appears |
| **Dark patterns:** pressure in the interface | Guilt messages, hidden limits or donation prompts could push students away | Plain wording, limits shown up front, easy cancel (FR4, FR6) | Neutral wording ("Your pantry pickup is ready."); the server explains any limit in plain words ("Rice is limited to 2 per visit"); no donation prompts to students. students cancel with two clicks from "Your pickup", and each item card states its per-visit limit |
| **Unauthorized use** of code and assets | Copying code, icons or images without permission | Use open-source code with compatible licenses; keep a credits list | All dependencies are open source (MIT, Apache-2.0, MPL-2.0; Section 15); no third-party images or icons are used in the app |
| **Accessibility:** leaving some students out | Students using screen readers or older phones could be shut out | Meet WCAG 2.1 AA; run in any browser with no app install (NFR2, NFR4) | Zero axe-core violations on ten page states; sign-in, booking and staff tasks tested with the keyboard alone; phone layout tested; browser tests pass in Chromium, Firefox and WebKit |
| **Fairness:** first-come pickup times favor some students | Students with jobs or packed schedules may get the worst times | Per-visit limits and pickup times spread across the day (FR4, FR5) | Limit of 8 different items per visit and per-item limits; one open request per student, so nobody can hold several times; staff choose when pickup times are offered |
| **AI-generated code** (added) | Code nobody on the team wrote could be wrong or could be presented as the team's own work | — | Every AI-generated file is marked and listed with its tool and author in `docs/AI_USAGE.md`, reviewed and tested like the rest of the code, and shown in full in Section 17.2 |
| **Insider misuse by staff** (added) | Staff can see which students use the pantry | — | Staff see a student's name and email only in the queue, where they need it to hand over the order; there is no staff screen that lists a student's history. A real deployment should add training and an access policy |
| **Notifications revealing pantry use** (added) | A message seen on a shared screen could reveal that a student uses the pantry | — | Notifications are inside the signed-in student page only; email subjects in the outbox are neutral ("Pickup scheduled", "Pickup ready") |

## Remaining ethical considerations

Two issues cannot be solved by software alone. First, **retention**: the system keeps request history indefinitely so reports can count it; a real pantry should set a retention period and delete or anonymize old requests. Second, **access**: a student without a phone or internet access still needs the walk-in option, so the platform should add to the pantry's existing service, not replace it.

# Software Implementation

## Technology stack

| Layer | Technology | Version | Why we chose it |
|---|---|---|---|
| Runtime | Node.js | 22.13 or newer (tested on 25.8) | One language across the stack; built-in SQLite and test runner |
| Web framework | Express | 5.3.0 | Small, well documented, familiar to the team |
| Database | SQLite through `node:sqlite` | built into Node.js | No server to install; transactions and constraints; no native build step |
| Front end | HTML, CSS, JavaScript modules | — | No build step; runs in any current browser |
| Unit and integration tests | `node:test`, jsdom | built in; jsdom 26.1.0 | No extra test framework; jsdom runs page scripts without a browser |
| Browser and accessibility tests | Playwright, axe-core | 1.64.1; 4.14.0 | Chromium, Firefox and WebKit (Safari's engine) on desktop, Chromium at phone size; industry-standard accessibility rules |
| Load tests | autocannon | 8.0.0 | Simple HTTP load generator with latency percentiles |
| Hosting | Render | — | Free web service that redeploys from GitHub |

## Programming languages

- **JavaScript** (ES modules, `"type": "module"`): the server, the page scripts and all tests.
- **HTML and CSS**: the three pages and one shared stylesheet.
- **SQL**: the schema and every query, written as prepared statements with `?` parameters so input is never pasted into SQL text.

## Resources needed

- **Hardware:** the team's laptops (Windows 11 and macOS). No special hardware.
- **Software:** Node.js 22.13 or newer with npm; Git; a code editor; Chromium, Firefox and WebKit (installed once with `npx playwright install`) and Microsoft Edge for manual checks.
- **Services:** a public GitHub repository with write access for all four members; a Render account with deploy access (Abdullah Saadawi).
- **Access levels in the application:** one staff and three student demo accounts, created by `npm run seed`.

## Project structure

```text
server.js              Express app: JSON, static pages, CSRF check, routers, error handler, reminder job
src/
  db.js                database schema, openDatabase(), transaction()
  lib/                 errors.js, validate.js, time.js
  auth/                passwords.js (hashing); routes.js (register, login with rate limit, logout, me)
  routes/              inventory.js, pickups.js, staff.js
  services/            inventory, slots, pickups, notifications, reminders, alerts, reports
public/
  index.html           sign-in page
  student.html         student portal
  staff.html           staff pickup desk
  css/styles.css       shared stylesheet
  js/                  api.js, ui.js, signout.js, staff-guard.js, staff-pickups.js, staff-inventory.js,
                       staff-reports.js, student-filter.js, student-pickup.js, student-mypickup.js
scripts/seed.js        demo accounts, items and pickup times
tests/
  unit/                27 files: one per service, router or page script, plus edge cases
  integration/         3 files: real server with seed data, staff flow, edge cases
  e2e/                 Playwright: accessibility, sign-in, inventory, staff, student, phone
  perf/                autocannon load test
docs/                  AI usage log, demo deck, reports, this document
```

| Area | Files | Lines |
|---|---:|---:|
| Server (`server.js`, `src/`) | 17 | 1,949 |
| Pages, scripts and styles (`public/`) | 14 | 1,364 |
| Seed script (`scripts/`) | 1 | 92 |
| **Application code** | **32** | **3,405** |
| Unit tests | 27 | 4,071 |
| Integration tests | 3 | 388 |
| Browser and accessibility tests, test harness and configuration | 12 | 1,361 |
| Load test | 1 | 162 |
| **Total** | **75** | **9,387** |

Lines are counted in tracked `.js`, `.html` and `.css` files.

## Implementation by requirement

### Accounts, roles and security (FR1, NFR1) · Abdullah Saadawi

The sign-in page (`public/index.html`) posts the email and password to `POST /api/auth/login` and sends staff to the staff page and students to the student page. Emails are trimmed and lower-cased, so `Student1@Pantry.demo ` signs in the same account. Passwords are hashed with salted scrypt, and only a SHA-256 hash of each session token is stored. The session cookie is `HttpOnly` and `SameSite=Lax`, and `Secure` in production. Login is limited to five failed attempts per IP address in 15 minutes. Every change to data must carry the `X-Requested-With: fetch` header and a matching `Origin`. A sign-out link on both pages ends the session on the server. Since November 15, registration and login hash passwords with the asynchronous `crypto.scrypt`, so a burst of sign-ins no longer holds up other requests (D-20). The seed script creates the demo accounts, ten items and five pickup times. Code: Figures 24–27.

### Browse, search and request food (FR2–FR4) · Mohamed Muse

In Mohamed's words: "For FR2–FR4, I developed the student-facing page using HTML and JavaScript, integrating it with the existing backend APIs. The browsing functionality retrieves available pantry items and displays their names, categories, and available quantities. I implemented search and category filtering in JavaScript so students can quickly find specific items without having to scroll through the entire inventory. For food requests, I connected item quantity selection to the existing pickup scheduling system, allowing students to select food, choose a pickup time, and receive confirmation through the notification system. I tested my functionality using six unit tests covering inventory availability, searching, and filtering. All project tests passed with no failures, and I also tested the student flow in the browser by successfully scheduling a pickup and verifying the confirmation notification."

The filtering helpers (`public/js/student-filter.js`) are pure functions, which is why they can be unit tested without a browser: `availableItems()` keeps active items with stock, `categoriesFor()` builds the sorted category menu, and `filterItems()` combines the search text, the category and, since November 15, a dietary tag. That day Andrew added (with Claude Code) a **Dietary** menu built by `dietaryTagsFor()` from the tags of the items in stock; each item card now lists its tags and per-visit limit, and its quantity field stops at that limit. Code: Figures 39 and 40.

### Pickup times (FR5) · Andrew Merritt

Staff create pickup times with a capacity from 1 to 100. A time must be in the future, must not duplicate another time, and cannot be moved into the past or given a capacity below its bookings. A time that has pickups (even past or cancelled ones) cannot be deleted, so the pickup history stays intact. Students see only future times with open spots, and the server checks again at booking time. Code: Figures 29 and 30.

### Requesting food and booking (FR4, FR5) · Andrew Merritt, server side

`schedule()` in `src/services/pickups.js` runs every check and write in one transaction: the user is a student with no other open request; the time exists, is in the future and is not full; there are between 1 and 8 different items; each item is active, within its per-visit limit, listed once and has enough available stock. Only then does it save the request and its items and add each quantity to `reserved`. The route then sends the "scheduled" notification and runs the low-stock check. Code: Figures 29–31.

### Cancellations and notifications (FR6) · Andrew Merritt

`cancel()` checks that the user owns the pickup or is staff and that the pickup is still open, gives the reserved stock back and marks it cancelled; the route notifies the student. Notifications are created when a pickup is scheduled, ready or cancelled, and a reminder is created for every open pickup starting in the next 24 hours. The reminder job runs once when the server starts and then every hour, and sets `reminder_sent` so a student gets one reminder per pickup. Each notification is also written to the `email_outbox` table with a subject and body. Staff cancel from the queue with a Cancel button. Students cancel from the **Your pickup** panel (`public/js/student-mypickup.js`, added November 15), which lists their open pickup from `GET /api/pickups` (`listForStudent()`); Cancel takes two clicks so a stray tap cannot cancel an order, and the booking form then reloads the stock and pickup times. Code: Figures 32, 36 and 47.

### Pickup fulfillment (FR8) · Andrew Merritt

The staff queue lists open pickups in pickup-time order with the time, the student, the items and a status chip, and can be filtered by status or date. **Prepare** moves a scheduled pickup to prepared and notifies the student that it is ready; **Complete** moves a prepared pickup to picked up and removes the items from both `quantity` and `reserved`. A pickup cannot skip a step. Code: Figures 33 and 41.

### Low-stock alerts (FR9) · Andrew Merritt

`checkLowStock()` runs after every booking, cancellation and completed pickup, and when staff click **Check Stock**. In one transaction it opens an alert for each active item whose available stock is at or below its threshold, updates the numbers on alerts that are already open, and resolves alerts for items that have been restocked or retired. Code: Figure 34.

### Usage report (FR10) · Andrew Merritt

For an optional date range, `staffReport()` returns pickups by status, requests per day, the ten most-requested items (cancelled requests excluded, because their stock was returned) and, for inventory, totals and stock by category. Every query uses `COUNT` or `SUM`; no query in the report selects a name or email. Code: Figure 35.

### Inventory and donations (FR7) · Abdullah Saadawi

`POST /api/items`, `PATCH /api/items/:id` and `POST /api/donations` add items, change them and log donations; only staff may call them. A quantity cannot be set below what is already reserved for students, and a donation adds to the stock and is recorded against the staff member who logged it, in one transaction. On November 15 Andrew finished FR7 with Claude Code: new items take a low-stock threshold, a per-visit limit and dietary tags (D-17, D-18); `PATCH` changes only the fields it is sent and can retire or restore an item with `active` (D-19); and every change re-runs the low-stock check, so a donation clears its alert at once. The **Inventory** panel on the staff page (`public/js/staff-inventory.js`) lists every item with its stock, threshold, limit, tags and status, and has an add and edit form, Retire and Restore buttons, and a donation form. Code: Figures 37, 44, 45 and 46.

### Accessibility, performance and devices (NFR2–NFR4)

Accessibility was built into the pages as described in Section 6.10 and checked by Gavin Marvelle's automated axe-core and keyboard tests. Performance comes from keeping the work per request small: prepared statements, indexes on `requests(student_id, status)` and `requests(slot_id, status)`, and no extra round trips. The pages use only standard HTML, CSS and JavaScript, so they run in any current browser on a computer or a phone.

## Cross-cutting implementation

- **Errors.** Services throw typed errors (`badRequest`, `notFound`, `conflict`, ...) from `src/lib/errors.js`. One error handler in `server.js` turns them into `{ error: { code, message } }` with the right HTTP status; anything unexpected is logged and answered with a generic `500` that reveals nothing.
- **Validation.** `requireString`, `requireInt` and `requireId` check every input's type and range before it reaches the database.
- **Transactions.** `transaction(db, fn)` wraps a function in `BEGIN IMMEDIATE ... COMMIT` and rolls back on any error, so a failed booking leaves no partial rows.
- **Time.** All stored times are local ISO text produced by `toLocalIso()`; `parseLocalIso()` rejects impossible dates and times skipped by daylight saving.
- **Safe pages.** `el()` builds elements and sets text with `textContent`; `api()` adds the security header, sends cookies only to the same site and sends the user to the sign-in page when the session has expired.

## AI-generated code

The course requires at least 10% AI-generated code and asks teams to say where it is. Every AI-generated or AI-assisted file is listed in `docs/AI_USAGE.md`, marked in the file itself, and shown in Section 17.2.

| Source | Lines | Share of all code |
|---|---:|---:|
| Claude Code foundation files (schema, helpers, password hashing, browser helpers) | 360 | 3.8% |
| Claude Code, requested by Andrew, Nov 12: bug fixes, shared stylesheet, staff cancel button, sign-out link, staff account check | 436 | 4.6% |
| Claude Code, used by Gavin: QA test suites (pull requests #21 and #28) | 4,097 | 43.6% |
| Claude Code, requested by Andrew, Nov 15: FR7 screen and item details, dietary filter, student cancel, async hashing, their tests | 1,285 | 13.7% |
| ChatGPT-assisted, Abdullah: inventory and security code (whole files counted) | 544 | 5.8% |
| **All AI-generated or AI-assisted** | **6,722** | **71.6%** |

The share is counted over 9,387 lines including tests. In the application code alone (3,405 lines), 1,659 lines (48.7%) are AI-generated or AI-assisted. Both figures are upper bounds: the ChatGPT row counts whole files even where only parts were AI-assisted, and the November 15 row counts every added or changed line. Mohamed Muse used ChatGPT for ideas and troubleshooting only, so his files are counted as team-written.

## Defects found and fixed

Defects are numbered D-01 to D-20 in our defect log. Three of them were also GitHub Issues (#11, #18 and #19). "QA" means found by Gavin's tests or Issues; "E2E" means found by end-to-end runs against a running server.

| ID | Defect | Found by | Severity | How we fixed it |
|---|---|---|---|---|
| D-01 | On Render, every `POST` was rejected with 403 behind the HTTPS proxy, so nobody could sign in | E2E | Critical | Trust one proxy hop on Render (PR #12) |
| D-02 | The live site ran on UTC: pickup-time checks, reminders and report dates were five hours off | QA | High | Server and seed default to Eastern time (PR #23) |
| D-03 | Issue #11: the home page returned 404 | QA | High | Sign-in page added (PR #14) |
| D-04 | Issue #18: student sign-in led to a 404 | QA | High | Student page added (PR #22) |
| D-05 | On a fresh clone, `npm start` crashed because there was no `data/` folder | E2E | High | The server creates the folder (PR #12) |
| D-06 | Issue #19: after a student signed in on another tab, staff actions failed without explanation | QA | Medium | The staff page notices the account switch and says so (PR #20) |
| D-07 | The usage report counted cancelled requests among top items | E2E | Medium | Cancelled requests excluded, with a test (PR #12) |
| D-08 | Deleting a pickup time with past pickups returned 500 | E2E | Medium | Returns 409 with a clear message, with a test (PR #12) |
| D-09 | A pickup time could be edited into the past | E2E | Medium | Rejected with 400, with a test (PR #12) |
| D-10 | Reminders waited an hour after a restart | E2E | Low | Also sent at startup (PR #12) |
| D-11 | Malformed JSON returned 500 | E2E | Low | Returns 400 (PR #12) |
| D-12 | Unknown API routes returned an HTML page | QA | Low | JSON 404 (PR #23) |
| D-13 | A request body over 100 KB returned 500 | QA | Low | Returns 413 (PR #23) |
| D-14 | 2:30 AM on the spring daylight-saving day was saved as 3:30 | QA | Low | Rejected, with a test (PR #23) |
| D-15 | The queue's date filter left out a pickup at 23:59:59 | QA | Low | Included, with a test (PR #23) |
| D-16 | A failed sign-out left an unhandled error in the browser | QA | Low | Error caught (PR #24) |
| D-17 | New items could not be given a low-stock threshold through the API, so they only alerted at zero | QA (`todo` test) | Medium | Threshold accepted on create and edit (Nov 15) |
| D-18 | New items could not be given a per-visit limit or dietary tags | QA (`todo` test) | Medium | Limit and tags accepted on create and edit (Nov 15) |
| D-19 | Items could not be retired (hidden from students) | QA (`todo` test) | Medium | `active` can be set on edit; Retire and Restore buttons (Nov 15) |
| D-20 | Browsing slowed to about 550 ms (p99) while 10 people signed in at once | QA (load test) | Low | Asynchronous password hashing (Nov 15) |

All 20 defects are closed. D-17 to D-20 were still open at the Development Demo and were fixed on November 15 on the branch `andrew/final-fixes`.

## Deployment

The site runs as a Render web service connected to the GitHub repository. Whenever `main` changes, Render pulls the code, installs the dependencies and starts `server.js`. Render sets the `RENDER` environment variable, which makes the server trust Render's HTTPS proxy; on any other host behind a proxy, set `TRUST_PROXY=1`. The SQLite file lives on the service's own disk, which Render resets on every deploy, so the live demo relies on the seed data (risk R-10).

## Known limitations and future work

1. Connect the email outbox to a real mail provider, so students are notified without opening the site.
2. Use a persistent database in production and add backups (risk R-10).
3. Replace email and password sign-in with the university's single sign-on.
4. Add a registration page on top of the existing `POST /api/auth/register`.
5. Let staff change the 8-items-per-visit limit on screen, and add "busiest pickup times" to the usage report.
6. Test with a real screen reader and on real Safari and phone browsers, not only their automated equivalents.

# Screenshots of Code and Outputs

## Code

The screenshots below are taken from the `main` branch as submitted. Line numbers match the files in the repository. Each caption says who wrote the code and whether AI was involved; Section 17.2 has the full AI disclosure.

![Figure 24. Request security middleware: every write needs the security header and a same-site Origin (NFR1). server.js, Abdullah Saadawi, ChatGPT-assisted](images/code/code-01-security-middleware.png){width=6.50in}

![Figure 25. Login rate limit and session cookie (FR1, NFR1). src/auth/routes.js, Abdullah Saadawi, ChatGPT-assisted](images/code/code-02-login-rate-limit.png){width=6.50in}

![Figure 26. Login route: same answer for an unknown email and a wrong password; the password check is asynchronous since November 15 (FR1, NFR1, D-20). src/auth/routes.js, Abdullah Saadawi, ChatGPT-assisted; async change by Andrew with Claude Code](images/code/code-03-login-route.png){width=6.50in}

![Figure 27. Password hashing with salted scrypt, synchronous for the seed script and asynchronous for login, and SHA-256 for session tokens (NFR1, D-20). src/auth/passwords.js, AI-generated by Claude Code](images/code/code-04-passwords.png){width=6.50in}

![Figure 28. Database schema for items, donations, pickup times and requests, with CHECK constraints. src/db.js, AI-generated by Claude Code](images/code/code-05-schema.png){width=6.50in}

![Figure 29. Booking, part 1: one transaction checks the student, open requests, the pickup time and its capacity (FR4, FR5). src/services/pickups.js, Andrew Merritt](images/code/code-06-schedule-a.png){width=6.50in}

![Figure 30. Booking, part 2: save the request and reserve the stock (FR4, FR5). src/services/pickups.js, Andrew Merritt](images/code/code-07-schedule-b.png){width=6.50in}

![Figure 31. Per-visit limits and stock checks for each requested item (FR4). src/services/pickups.js, Andrew Merritt](images/code/code-08-visit-limits.png){width=6.50in}

![Figure 32. Cancelling a pickup releases the reserved stock (FR6). src/services/pickups.js, Andrew Merritt](images/code/code-09-cancel.png){width=6.50in}

![Figure 33. Prepare and complete: a pickup cannot skip a step, and completing removes the stock (FR8). src/services/pickups.js, Andrew Merritt](images/code/code-10-complete.png){width=6.50in}

![Figure 34. Low-stock alerts are opened, refreshed and resolved in one transaction (FR9). src/services/alerts.js, Andrew Merritt](images/code/code-11-alerts.png){width=6.50in}

![Figure 35. Usage report: counts only, cancelled requests excluded from top items (FR10, NFR1). src/services/reports.js, Andrew Merritt; the cancelled-request filter was a Claude Code fix (D-07)](images/code/code-12-reports.png){width=6.50in}

![Figure 36. Reminders for pickups in the next 24 hours, sent once per pickup (FR6). src/services/reminders.js, Andrew Merritt](images/code/code-13-reminders.png){width=6.50in}

![Figure 37. Logging a donation adds stock and records the staff member in one transaction (FR7). src/services/inventory.js, Abdullah Saadawi, ChatGPT-assisted](images/code/code-14-donation.png){width=6.50in}

![Figure 38. Pickup routes, including a student's own open pickups: role checks, then the service, then the notification and low-stock check (FR4–FR6). src/routes/pickups.js, Andrew Merritt](images/code/code-15-pickup-routes.png){width=6.50in}

![Figure 39. Search, category and dietary filters for the student page (FR2, FR3). public/js/student-filter.js, Mohamed Muse; dietary helpers added by Andrew with Claude Code on November 15](images/code/code-16-student-filter.png){width=6.50in}

![Figure 40. Submitting a request and pickup time, then telling the "Your pickup" panel (FR4–FR6). public/js/student-pickup.js, Mohamed Muse and Andrew Merritt](images/code/code-17-student-submit.png){width=6.50in}

![Figure 41. Staff pickup queue with Prepare, Complete and Cancel (FR8, FR6). public/js/staff-pickups.js, Andrew Merritt; the Cancel handler (lines 63–72) was added with Claude Code](images/code/code-18-staff-queue.png){width=6.50in}

![Figure 42. Concurrency tests: two students race for the last spot and the last units (FR4, FR5). tests/unit/edge-and-security.test.js, Gavin Marvelle with Claude Code](images/code/code-19-race-test.png){width=6.50in}

![Figure 43. Browser test of the full student flow, checked again from the staff queue. tests/e2e/student.spec.js, Gavin Marvelle with Claude Code](images/code/code-20-e2e-test.png){width=6.50in}

![Figure 44. Item details: dietary tags are cleaned up and the threshold and per-visit limit are validated (FR7, D-17, D-18). src/services/inventory.js, Andrew Merritt with Claude Code, November 15](images/code/code-21-item-details.png){width=6.50in}

![Figure 45. updateItem changes only the fields it is sent and can retire or restore an item (FR7, D-19). src/services/inventory.js, Andrew Merritt with Claude Code, November 15](images/code/code-22-update-item.png){width=6.42in}

![Figure 46. Staff inventory panel: saving an item, and retiring or restoring one (FR7). public/js/staff-inventory.js, AI-generated by Claude Code, November 15](images/code/code-23-staff-inventory.png){width=6.50in}

![Figure 47. "Your pickup" panel with a two-step Cancel (FR6). public/js/student-mypickup.js, AI-generated by Claude Code, November 15](images/code/code-24-my-pickup.png){width=6.50in}

## Outputs

All application screenshots were taken on November 15, 2026 from the `main` branch, running locally on a freshly seeded database (demo accounts only). The desktop window is 1280 × 860 pixels; phone screenshots use a Pixel 7 screen size.

### Sign-in

![Figure 48. Sign-in page (FR1)](images/app/app-01-sign-in.png){width=6.50in}

![Figure 49. A wrong password shows an error and stays on the sign-in page (FR1, TC_03)](images/app/app-02-sign-in-error.png){width=6.50in}

### Student portal

![Figure 50. Student portal after sign-in: every in-stock item with its category, amount, dietary tags and per-visit limit, the pickup times, "Your pickup" and notifications (FR2–FR6)](images/app/app-03-student-portal.png){width=6.50in}

![Figure 51. Search for "can" matches item names and the "Canned Goods" category (FR3, TC_05)](images/app/app-04-student-search.png){width=6.50in}

![Figure 52. Category filter set to Breakfast (FR3)](images/app/app-05-student-category.png){width=6.50in}

![Figure 53. Dietary filter set to Vegan; each card lists its dietary tags and any per-visit limit (FR3, FR4, TC_23)](images/app/app-05b-student-dietary.png){width=6.50in}

![Figure 54. Quantities entered and a pickup time selected before submitting (FR4, FR5)](images/app/app-06-student-filled.png){width=6.50in}

![Figure 55. After submitting: "Pickup scheduled", stock reduced, the booking shown under "Your pickup", and a notification with the pickup time (FR4–FR6, TC_06)](images/app/app-07-student-booked.png){width=6.50in}

![Figure 56. A second booking while one is open is refused with a clear message (FR4, TC_07)](images/app/app-08-student-second-booking-refused.png){width=6.50in}

![Figure 57. The student's notifications after staff prepared the order: scheduled and ready (FR6, TC_10)](images/app/app-15-student-notifications.png){width=6.50in}

![Figure 58. "Your pickup" after the first click on Cancel: the button asks for confirmation and explains what will happen (FR6, TC_22)](images/app/app-23-student-cancel-confirm.png){width=6.50in}

![Figure 59. After "Confirm cancel": the pickup is cancelled and the items go back to the pantry (FR6, TC_22)](images/app/app-24-student-cancelled.png){width=6.50in}

### Staff pickup desk

![Figure 60. Staff pickup desk with three bookings: the pickup queue and the first pickup times (FR5, FR8)](images/app/app-09-staff-desk.png){width=6.50in}

![Figure 61. After Prepare: Student One's pickup shows "Ready for pickup" and offers Complete (FR8, TC_10)](images/app/app-10-staff-prepared.png){width=6.50in}

![Figure 62. After Cancel: Student Two's pickup leaves the queue and the student is notified (FR6, TC_08)](images/app/app-11-staff-cancelled.png){width=6.50in}

![Figure 63. Pickup times after adding a new one, with booked and open spots (FR5, TC_17)](images/app/app-12-staff-slots.png){width=6.50in}

![Figure 64. Check Stock lists the items at or below their threshold (FR9, TC_11)](images/app/app-13-staff-alerts.png){width=6.50in}

![Figure 65. Usage report after one pickup was completed and one cancelled: counts only, no names (FR10, TC_12)](images/app/app-14-staff-report.png){width=6.50in}

![Figure 66. A student who opens the staff page sees access errors and a warning, never staff data (NFR1, TC_13)](images/app/app-16-student-blocked-from-staff.png){width=6.50in}

### Staff inventory

![Figure 67. Inventory panel after adding Lentils with a threshold, a per-visit limit and dietary tags: the add form, the donation form and the item table with Edit and Retire (FR7, TC_21)](images/app/app-19-staff-inventory.png){width=6.50in}

![Figure 68. Editing Peanut Butter: the form fills in and the button becomes Save Changes (FR7, TC_21)](images/app/app-20-staff-edit-item.png){width=6.50in}

![Figure 69. Logging a donation of 10 Canned Soup from a campus food drive (FR7, TC_09)](images/app/app-21-staff-donation.png){width=6.50in}

![Figure 70. After the donation, Canned Soup's low-stock alert is resolved; only Granola Bars is still low (FR9)](images/app/app-22-staff-alerts-after-donation.png){width=6.50in}

### Phone screens

![Figure 71. Student portal on a phone-sized screen (NFR4)](images/app/app-17-mobile-student.png){width=3.05in}

![Figure 72. Staff queue on a phone-sized screen: table rows become labelled cards (NFR4)](images/app/app-18-mobile-staff.png){width=3.05in}

### Test runs

These are the real outputs of the test commands, run on November 15, 2026 on a Windows 11 laptop with Node.js 25.8. Long lists of passing tests are shortened where marked; the complete results are summarized in Section 13.

![Figure 73. npm test: 249 unit and integration tests, all passed](images/code/term-01-npm-test.png){width=6.50in}

![Figure 74. npm run test:coverage: 100% of lines and functions and 98.17% of branches in src/ are covered](images/code/term-02-coverage.png){width=6.50in}

![Figure 75. npm run test:e2e: 66 browser and accessibility tests passed on desktop and phone (Chromium)](images/code/term-03-e2e.png){width=6.50in}

![Figure 76. npm run test:perf with 50 users: all 9 scenarios pass, including browsing during a burst of sign-ins (D-20 fixed)](images/code/term-04-perf50.png){width=6.50in}

![Figure 77. npm run test:perf with 200 users (NFR3): every page and data request answers within 94 ms at p99](images/code/term-04-perf200.png){width=6.50in}

![Figure 78. npm run test:e2e:browsers in Firefox: all 61 desktop browser tests passed (NFR4, TC_24)](images/code/term-05-firefox.png){width=6.50in}

![Figure 79. npm run test:e2e:browsers in WebKit, the engine behind Safari: all 61 desktop browser tests passed (NFR4, TC_24)](images/code/term-05-webkit.png){width=6.50in}

# Test Plan

## Objectives and scope

The goal of testing was to show, with evidence, that every requirement in Section 2 works as specified, and to find defects before users did. Gavin Marvelle (QA lead) owned the test plan and the automated suites; each developer wrote unit tests for their own code.

- **In scope:** FR1–FR10 and NFR1–NFR4; the API, the three pages, the database rules, security controls, accessibility, phone layout and performance under load.
- **Out of scope:** Render's own infrastructure, real email delivery (there is none), Safari and phone browsers on real devices (WebKit and a phone-sized Chromium stand in for them), and manual testing with a screen reader.

## Test levels and approach

| Level | What it checks | Tool | Owner |
|---|---|---|---|
| Unit | Every service, router and page script in isolation, with an in-memory database and a fake clock | `node:test`, jsdom | Each developer; QA added edge cases |
| Integration | The real server and seed script in a temporary folder, end to end through the API, including a full student-to-staff pickup | `node:test` with a server harness | Gavin |
| Browser (end-to-end) | The real pages in Chromium on desktop and phone sizes, driven like a user | Playwright | Gavin |
| Cross-browser | The desktop browser tests again in Firefox and in WebKit, the engine behind Safari | Playwright (`npm run test:e2e:browsers`) | Andrew |
| Accessibility | Every page state scanned against WCAG 2.1 A and AA; keyboard-only flows; focus indicator; live regions | axe-core in Playwright | Gavin |
| Performance (load) | Requests per second and response times with 50 and 200 users at once | autocannon | Gavin |
| Security | CSRF guard, role checks, rate limiting, forged cookies, HTML in names, oversized and malformed input | `node:test`, Playwright | Gavin and Abdullah |
| Regression | The full suite re-run after every fix and before every merge | all of the above | Everyone |
| Exploratory and end-to-end checks | Booking, cancelling, preparing, completing, reports and pickup-time changes on a running server, including the deployed site | browser, `curl` | Andrew |

## Test environment

- **Hardware:** team laptops running Windows 11 and macOS.
- **Runtime:** Node.js 22.13 or newer (the November 15 run used Node.js 25.8.0), npm.
- **Application:** Express 5, SQLite through `node:sqlite`, plain HTML, CSS and JavaScript.
- **Test tools:** `node:test`, jsdom 26.1.0, Playwright 1.64.1 with Chromium (desktop and Pixel 7 profiles), Firefox and WebKit, axe-core 4.14.0, autocannon 8.0.0; Microsoft Edge for manual checks.
- **Live environment:** a Render web service; code and issues on GitHub.

## Test data

- **Seed data** (`npm run seed`): one staff and three student demo accounts; ten items in seven categories, with dietary tags on nine of them, per-visit limits on Peanut Butter (2) and Bottled Water (6), and Canned Soup (4) and Granola Bars (3) starting below their low-stock threshold of 5; five pickup times at 2:00 PM on each of the next five days, each with capacity 10.
- **Unit tests:** an in-memory database and a fixed clock, with users, items and pickup times created in each test.
- **Edge cases:** malformed JSON, 200 KB request bodies, HTML in names, daylight-saving dates, full or past pickup times, forged cookies and races between two bookings.
- **Browser and load tests:** a freshly seeded server in a temporary folder, so they never touch a real database. New students are registered per test so each one starts with no open pickup.
- Demo passwords are printed by the seed script and are deliberately not repeated in this document.

## Entry and exit criteria

**Entry:** the feature is merged into `main` (or is on a branch under review), `npm install` succeeds and the server starts.

**Exit (to move from testing to deployment):**

| Criterion | Target |
|---|---|
| Open defects | No critical or high-severity defects open |
| Critical test cases | 100% of the test cases in Section 12 pass |
| Automated tests | At least 95% of all automated tests pass |
| Coverage of requirements | Every requirement is verified by at least one test case |
| Accessibility | 0 WCAG 2.1 A or AA violations reported by axe-core |
| Performance | Read requests answer within 500 ms (p99) with 50 users; pages within 3 seconds with 200 users (NFR3) |

## Requirements to test cases

| Requirement | Test cases | Main automated tests (number of tests) |
|---|---|---|
| FR1 Accounts and roles | TC_01, TC_02, TC_03 | Sign-in API (14), browser sign-in (9) |
| FR2 Browse items | TC_04 | Student filter (6), student page script (8), browser student page (21) |
| FR3 Search and filter | TC_05, TC_23 | Student filter (6), final-features page scripts (13), browser student page (21), browser inventory (4) |
| FR4 Food requests | TC_06, TC_20 | Booking edge cases (31), real-server integration (12), browser student page (21) |
| FR5 Pickup times | TC_07, TC_17 | Pickup times (6), booking edge cases (31), browser staff desk (12) |
| FR6 Cancel and notify | TC_08, TC_18, TC_22 | Notifications (3), reminders (2), final-features page scripts (13), browser staff desk (12), browser inventory (4) |
| FR7 Inventory and donations | TC_09, TC_21 | Inventory API (8), inventory service (3), inventory details (10), final-features page scripts (13), browser inventory (4) |
| FR8 Pickup fulfillment | TC_10 | Pickups (4), browser staff desk (12) |
| FR9 Low-stock alerts | TC_11 | Alerts (3), browser staff desk (12) |
| FR10 Usage report | TC_12 | Reports (3), browser staff desk (12) |
| NFR1 Privacy and security | TC_13, TC_14, TC_19 | Security edge cases (20), server edge cases (8) |
| NFR2, NFR4 Accessibility, phones and browsers | TC_15, TC_24 | Accessibility (15), browser inventory (4, including 2 axe scans), phone layout (5), Firefox and WebKit runs (61 each) |
| NFR3 Performance | TC_16 | Load scenarios (9) |

Counts are the number of tests in each test file; some files cover more than one requirement.

## Schedule and resources

| Activity | When | Who |
|---|---|---|
| Test plan and test cases | Nov 10–12 | Gavin Marvelle |
| Developer unit tests | With each feature, Nov 10–12 | Abdullah, Mohamed, Andrew |
| QA suites: unit edge cases, integration, browser, accessibility, load | Nov 12 (PR #21) and Nov 13 (PR #28) | Gavin Marvelle |
| End-to-end checks against a running server and the deployed site | Nov 12 | Andrew Merritt |
| Regression runs | After every fix | Everyone |
| Final fixes (D-17 to D-20, FR3, FR6, FR7) and their tests | Nov 14–15 | Andrew Merritt (with Claude Code) |
| Final full run for this report, in Chromium, Firefox and WebKit | Nov 15 | Andrew Merritt |

## Defect management

Defects are logged as GitHub Issues (or in the defect log for defects found and fixed the same day) with steps to reproduce, the expected and actual results, and a screenshot where useful. Each defect is assigned to the owner of the requirement and given a severity:

| Severity | Meaning | Example |
|---|---|---|
| Critical | The system cannot be used | Nobody could sign in on the live site (D-01) |
| High | A main feature is wrong or unreachable | Pickup times five hours off (D-02) |
| Medium | A feature works but gives a wrong or unclear result | Report counted cancelled requests (D-07) |
| Low | A minor or edge-case problem with an easy workaround | Malformed JSON answered with 500 instead of 400 (D-11) |

The workflow is **New → Open → In progress → Fixed → Verified → Closed**. A fix goes in through a pull request that names the issue; the tests are re-run and the flow is re-checked before the issue is closed. Known defects that cannot be fixed yet are written as `todo` tests, so they stay visible in every run without failing it.

# Test Script

## How to read the test cases

Each test case lists the requirement it verifies, the preconditions, the test data, the automated tests that perform the same steps, and a step-by-step table with the expected and actual results. "Actual" records the result of the November 15, 2026 run on `main`. Accounts are the seeded demo accounts; their passwords come from `npm run seed` and are not printed here.

### TC_01 · FR1: Staff sign-in

**Preconditions:** server running with seed data; signed out. **Test data:** `staff@pantry.demo` and its password. **Automated by:** browser test "staff sign in and land on the staff page". **Result:** Pass.

| Step | Action | Expected result | Actual result |
|---:|---|---|---|
| 1 | Open the site | The sign-in page shows labelled Email and Password fields | As expected |
| 2 | Enter `staff@pantry.demo` | The Email field accepts the address | As expected |
| 3 | Enter the password | The password is shown as dots | As expected |
| 4 | Click **Sign In** | The Staff Pickup Desk (`/staff.html`) opens with the queue, pickup times, alerts, inventory and report | As expected (top of the page in Figure 60) |

### TC_02 · FR1: Student sign-in

**Preconditions:** seed data; signed out. **Test data:** `student1@pantry.demo`. **Automated by:** browser test "students sign in and land on a working student page". **Result:** Pass.

| Step | Action | Expected result | Actual result |
|---:|---|---|---|
| 1 | Enter the student's email and password | Both fields accept the input | As expected |
| 2 | Click **Sign In** | The Student Portal (`/student.html`) opens and lists items | As expected (Figure 50) |
| 3 | Type the email in capitals with a trailing space and sign in again | Signs in to the same account | As expected ("email is not case sensitive and spaces are trimmed") |

### TC_03 · FR1: Wrong password

**Preconditions:** signed out. **Test data:** `student1@pantry.demo` with a wrong password; an unknown email. **Automated by:** browser test "a wrong password shows an error and stays on the page"; unit test "login rejects a wrong password and an unknown email with the same message". **Result:** Pass.

| Step | Action | Expected result | Actual result |
|---:|---|---|---|
| 1 | Enter the email and a wrong password; click **Sign In** | "Incorrect email or password." appears; the sign-in page stays open | As expected (Figure 49) |
| 2 | Enter an email that has no account | The same message, so nobody can tell which emails exist | As expected |

### TC_04 · FR2: Only in-stock items are listed

**Preconditions:** signed in as a student. **Test data:** seed items, plus one item with no stock left and one inactive item. **Automated by:** unit test "FR2 lists only active items with stock"; browser tests "lists every in-stock item with its category and stock" and "items with no stock left are hidden". **Result:** Pass.

| Step | Action | Expected result | Actual result |
|---:|---|---|---|
| 1 | Open the student page | Each active item with stock above 0 is shown with its category and amount available | As expected: 10 items (Figure 50) |
| 2 | Look for the item with no stock and the inactive item | Neither is listed | As expected |
| 3 | Read the count above the list | "10 available items shown" | As expected |

### TC_05 · FR3: Search and filter

**Preconditions:** signed in as a student. **Test data:** seed items. **Automated by:** five FR3 unit tests and browser tests "search matches item names without caring about case", "search also matches category names" and "the category filter shows only that category, and combines with search". **Result:** Pass.

| Step | Action | Expected result | Actual result |
|---:|---|---|---|
| 1 | Type `RICE` in Search | Only Rice is listed | As expected |
| 2 | Type `can` | Canned Beans and Canned Soup are listed | As expected (Figure 51) |
| 3 | Clear Search; choose **Breakfast** | Only Cereal and Oatmeal are listed | As expected (Figure 52) |
| 4 | Type `zzz` | "No matching pantry items available." | As expected |

### TC_06 · FR4, FR5: Request food and book a pickup

**Preconditions:** signed in as a student with no open pickup. **Test data:** Rice 2, Oatmeal 1, Granola Bars 1; the first open pickup time. **Automated by:** browser test "a student requests items, books a time, and is notified" (Figure 43); real-server integration test. **Result:** Pass.

| Step | Action | Expected result | Actual result |
|---:|---|---|---|
| 1 | Enter 2 for Rice, 1 for Oatmeal and 1 for Granola Bars | The quantities are kept | As expected |
| 2 | Click the first pickup time | That time is highlighted and marked pressed; no other time is | As expected (Figure 54) |
| 3 | Click **Request items and book pickup** | "Pickup scheduled. Check your notifications for confirmation." | As expected (Figure 55) |
| 4 | Read the item list | Rice shows 2 fewer available; quantities reset to 0 | As expected (28 available) |
| 5 | Read Notifications | "Your pantry pickup is scheduled for Mon, Nov 16 at 2:00 PM." | As expected |
| 6 | Sign in as staff | The request appears in the queue with the student and items | As expected (Figure 60) |

### TC_07 · FR4, FR5: Invalid bookings are refused

**Preconditions:** signed in as a student. **Test data:** a pickup time in the past; a pickup time at capacity; a student who already has an open pickup; a quantity above the per-visit limit; 9 different items. **Automated by:** unit tests "schedule rejects past slots", "schedule rejects full slots and unavailable inventory", "schedule allows only one open request per student", "schedule enforces the visit item limit from settings"; browser test "a student with an open request cannot book a second one". **Result:** Pass.

| Step | Action | Expected result | Actual result |
|---:|---|---|---|
| 1 | Book a time that has passed | Refused: "Pickup slot must be in the future." | As expected |
| 2 | Book a time that is full | Refused: "Pickup slot is full." | As expected |
| 3 | Book again while a pickup is open | Refused: "You already have an open pickup request." | As expected (Figure 56) |
| 4 | Ask for more than an item's per-visit limit | Refused: "[Item] is limited to [n] per visit." | As expected |
| 5 | Ask for 9 different items | Refused: "Choose 8 items or fewer per visit." | As expected |
| 6 | Ask for more than the available stock | Refused: "[Item] does not have enough available stock." | As expected |

### TC_08 · FR6: Cancelling releases stock and notifies the student

**Preconditions:** a booked pickup; signed in as staff. **Test data:** Student Two's pickup (2 × Canned Beans, 1 × Pasta). **Automated by:** browser tests "staff cancel a pickup; stock is released and the student is notified" and "a staff cancellation shows up for the student"; unit test "students can cancel their own pickup, which releases stock and notifies them". **Result:** Pass.

| Step | Action | Expected result | Actual result |
|---:|---|---|---|
| 1 | Click **Cancel** on the pickup | "Pickup cancelled. The student was notified." The pickup leaves the queue | As expected (Figure 62) |
| 2 | Check Canned Beans and Pasta | The reserved units are available again | As expected |
| 3 | Sign in as that student | "Your pantry pickup was cancelled." is shown | As expected |
| 4 | Try to cancel a pickup that was already picked up | Refused: "Only open pickup requests can be cancelled." | As expected |

### TC_09 · FR7: Staff manage inventory and donations

**Preconditions:** signed in as staff (API). **Test data:** a new item; a donation of 10 units. **Automated by:** inventory API unit tests (8), e.g. "staff can create an item", "staff can update an item quantity", "staff can log a donation, recorded against their user", "item creation is refused without a session or for students". **Result:** Pass.

| Step | Action | Expected result | Actual result |
|---:|---|---|---|
| 1 | `POST /api/items` with a name, category and quantity | 201; the item is listed | As expected |
| 2 | `PATCH /api/items/:id` with a new quantity | The quantity is saved; a quantity below what is reserved is refused | As expected |
| 3 | `POST /api/donations` for the item | Stock rises by the donation; the donation records the staff member | As expected |
| 4 | Repeat steps 1–3 as a student, and signed out | Refused with 403 and 401 | As expected |

### TC_10 · FR8, FR6: Prepare, then complete a pickup

**Preconditions:** a booked pickup; signed in as staff. **Test data:** Student One's pickup. **Automated by:** browser test "staff prepare then complete a pickup; the student is notified"; unit test "prepare sends a ready notification; out-of-order transitions conflict". **Result:** Pass.

| Step | Action | Expected result | Actual result |
|---:|---|---|---|
| 1 | Click **Prepare** | "Pickup marked ready." Status shows "Ready for pickup" and the button becomes **Complete** | As expected (Figure 61) |
| 2 | Sign in as the student | "Your pantry pickup is ready." is shown | As expected (Figure 57) |
| 3 | As staff, click **Complete** | "Pickup completed." The pickup leaves the open queue | As expected |
| 4 | Check the items' stock | Quantity and reserved both drop by the amounts picked up | As expected |
| 5 | Try to complete a pickup that was never prepared | Refused: "Only prepared pickup requests can be completed." | As expected |

### TC_11 · FR9: Low-stock alerts

**Preconditions:** seed data (Canned Soup 4 and Granola Bars 3, threshold 5). **Automated by:** browser test "Check Stock lists the seeded low-stock items"; unit tests "checkLowStock opens one alert for an item at or below threshold", "checkLowStock does not duplicate an open alert", "checkLowStock resolves alerts when available stock recovers". **Result:** Pass.

| Step | Action | Expected result | Actual result |
|---:|---|---|---|
| 1 | As staff, click **Check Stock** | "Low stock alerts refreshed." Canned Soup and Granola Bars are listed with their available amount and threshold | As expected (Figure 64) |
| 2 | Click **Check Stock** again | No duplicate alerts | As expected |
| 3 | Restock an item above its threshold, then check | Its alert is resolved and disappears | As expected |

### TC_12 · FR10: Anonymous usage report

**Preconditions:** bookings exist, one completed and one cancelled. **Automated by:** browser test "the usage report shows inventory totals and runs for a date range"; unit tests "staffReport summarizes pickup statuses, top items, and inventory" and "staffReport top items leave out cancelled requests". **Result:** Pass.

| Step | Action | Expected result | Actual result |
|---:|---|---|---|
| 1 | As staff, click **Run Report** | Totals, pickups by status, top items and stock by category are shown | As expected (Figure 65) |
| 2 | Compare the top items with the bookings | The cancelled request's items are not counted | As expected |
| 3 | Choose From and To dates and run it | Only requests in that range are counted | As expected |
| 4 | Search the report for any name or email | None appears | As expected |

### TC_13 · NFR1: Students cannot see staff data

**Preconditions:** signed in as a student. **Automated by:** browser test "a student who opens the staff page sees access errors, not staff data"; integration test "every staff endpoint rejects anonymous users and students". **Result:** Pass.

| Step | Action | Expected result | Actual result |
|---:|---|---|---|
| 1 | Open `/staff.html` | No staff data loads; each panel shows "You do not have access to this feature."; a banner explains the browser is signed in as a student | As expected (Figure 66) |
| 2 | Call each `/api/staff/*` endpoint as the student and signed out | 403 and 401 | As expected |
| 3 | Open another student's pickup (`GET /api/pickups/:id`) | 403 | As expected |

### TC_14 · NFR1: Cross-site requests are refused

**Preconditions:** server running. **Automated by:** integration tests "API writes without the X-Requested-With header are refused (CSRF guard)" and "cross-origin and malformed Origin headers are refused". **Result:** Pass.

| Step | Action | Expected result | Actual result |
|---:|---|---|---|
| 1 | Send a booking without the `X-Requested-With` header | 403 "Missing security header." | As expected |
| 2 | Send a booking with another site's `Origin` | 403 "Request origin not allowed." | As expected |
| 3 | Send a `GET` without the header | Allowed (reads are safe) | As expected |

### TC_15 · NFR2, NFR4: Accessibility and phone screens

**Preconditions:** server running with seed data. **Automated by:** 15 accessibility tests and 5 phone tests. **Result:** Pass.

| Step | Action | Expected result | Actual result |
|---:|---|---|---|
| 1 | Scan 8 page states with axe-core (WCAG 2.1 A and AA) | 0 violations | 0 violations |
| 2 | Sign in, book a pickup and prepare a pickup using only the keyboard | All three work, with a visible focus indicator | As expected |
| 3 | Check message areas and page structure | Success uses `role="status"`, errors use `role="alert"`; each page has a language, a title and one main landmark | As expected |
| 4 | Open the sign-in, student and staff pages at Pixel 7 size | No sideways scrolling; buttons can be tapped; a student can book by tap | As expected (Figures 71, 72) |

### TC_16 · NFR3: Performance with 200 users

**Preconditions:** a freshly seeded server on the test laptop. **Test data:** 200 simultaneous connections for 5 seconds per scenario. **Automated by:** `LOAD_CONNECTIONS=200 npm run test:perf`. **Result:** Pass.

| Step | Action | Expected result | Actual result |
|---:|---|---|---|
| 1 | Load the item list with 200 users | p99 well under 3 seconds | p99 41 ms, 8,070 requests/s |
| 2 | Load the sign-in page with 200 users | p99 well under 3 seconds | p99 94 ms |
| 3 | Load the staff queue, pickup times and report with 200 users | p99 well under 3 seconds | p99 45, 50 and 81 ms |
| 4 | Check for errors and timeouts | None | None |

### TC_17 · FR5: Staff manage pickup times

**Preconditions:** signed in as staff. **Automated by:** browser tests "staff add and delete a pickup slot", "adding a slot at a time that is already taken shows an error", "a slot with a booking cannot be deleted"; unit tests in `slots.test.js`. **Result:** Pass.

| Step | Action | Expected result | Actual result |
|---:|---|---|---|
| 1 | Enter a future date and time and capacity 6; click **Add Slot** | "Pickup slot added." The time is listed with 0/6 booked | As expected (Figure 63) |
| 2 | Add another time at exactly the same moment | Refused: "A pickup slot already exists at that time." | As expected |
| 3 | Delete a time that has a booking | Refused: "Cannot delete a slot with scheduled pickups." | As expected |
| 4 | Delete an empty time | "Pickup slot deleted." | As expected |

### TC_18 · FR6: Reminder within 24 hours

**Preconditions:** a pickup booked for a time within the next 24 hours. **Automated by:** unit tests "sendDueReminders sends one reminder for upcoming pickups", "reminders: exactly 24h ahead is included, exactly now is not"; integration test "server sends due reminders as soon as it starts". **Result:** Pass.

| Step | Action | Expected result | Actual result |
|---:|---|---|---|
| 1 | Run the reminder job (or start the server) | One "Reminder: your pantry pickup is …" notification and one outbox email | As expected |
| 2 | Run the job again | No second reminder for the same pickup | As expected |
| 3 | A pickup more than 24 hours away, or cancelled | No reminder | As expected |

### TC_19 · NFR1: Login rate limit

**Preconditions:** signed out. **Automated by:** unit tests "login is rate limited after 5 failed attempts", "login lockout lifts after the 15-minute window", "one locked-out IP does not block other IPs". **Result:** Pass.

| Step | Action | Expected result | Actual result |
|---:|---|---|---|
| 1 | Enter a wrong password five times | Each attempt answers "Incorrect email or password." | As expected |
| 2 | Try a sixth time, even with the right password | 429 "Too many login attempts. Try again in 15 minutes." | As expected |
| 3 | Sign in from another IP address | Not affected | As expected |

### TC_20 · FR4, FR5: Two students race for the last spot

**Preconditions:** a pickup time with one open spot; an item with few units. **Automated by:** unit tests "two students racing for the last spot: exactly one gets it", "racing for the last units of an item: stock never goes negative", "one student double-submitting gets one booking" (Figure 42). **Result:** Pass.

| Step | Action | Expected result | Actual result |
|---:|---|---|---|
| 1 | Two students book the last spot at the same moment | Exactly one booking succeeds; the other gets "Pickup slot is full." | As expected |
| 2 | Two students request the last units of an item | Stock never goes below zero | As expected |
| 3 | One student submits the same booking twice quickly | Exactly one booking | As expected |

### TC_21 · FR7: Staff manage the inventory on screen

**Preconditions:** signed in as staff. **Test data:** a new item "Lentils" (12 on the shelf, threshold 3, limit 2, tags "vegan, gluten-free"). **Automated by:** browser tests "staff add an item with tags and a limit; students can filter by diet; retiring hides it" and "staff edit an item and log a donation; restocking clears its low-stock alert"; inventory unit tests (10) and page-script tests. **Result:** Pass.

| Step | Action | Expected result | Actual result |
|---:|---|---|---|
| 1 | Fill in the Add an item form and click **Add Item** | "Item added." The item is listed with its tags, threshold, limit and status Active | As expected (Figure 67) |
| 2 | Click **Edit** on an item, change the threshold, click **Save Changes** | "Item updated." The form returns to Add an item | As expected (Figure 68) |
| 3 | Log a donation of 10 for an item that is low on stock | "Donation logged. Stock updated." On shelf rises by 10 and the item's low-stock alert closes | As expected (Figures 69, 70) |
| 4 | Click **Retire** on the new item | "… retired. Students no longer see it." Status shows Retired and students can no longer see or book it | As expected |
| 5 | Send a per-visit limit of 0 or a negative threshold | Refused with a clear message | As expected |

### TC_22 · FR6: A student cancels their own pickup

**Preconditions:** a student with one booked pickup. **Automated by:** browser test "a student cancels their own pickup from \"Your pickup\" and the stock comes back"; page-script tests for `student-mypickup.js`; unit tests for `GET /api/pickups`. **Result:** Pass.

| Step | Action | Expected result | Actual result |
|---:|---|---|---|
| 1 | Book a pickup | "Your pickup" lists the time, the items and the status Scheduled | As expected (Figure 55) |
| 2 | Click **Cancel pickup** once | Nothing is cancelled yet; the button reads **Confirm cancel** and explains what will happen | As expected (Figure 58) |
| 3 | Click **Confirm cancel** | "Pickup cancelled. The items were returned to the pantry." The panel shows "You have no pickup booked." | As expected (Figure 59) |
| 4 | Check the item list and notifications | The stock is back; "Your pantry pickup was cancelled." is shown; a new pickup can be booked | As expected |
| 5 | Call `GET /api/pickups` as staff and signed out | 403 and 401 | As expected |

### TC_23 · FR3, FR4: Dietary filter and per-visit limits on the student page

**Preconditions:** signed in as a student; seed data. **Automated by:** FR3 unit tests and page-script tests; browser test "staff add an item with tags and a limit; students can filter by diet; retiring hides it". **Result:** Pass.

| Step | Action | Expected result | Actual result |
|---:|---|---|---|
| 1 | Open the **Dietary** menu | It lists each tag on the items in stock once, in order: Gluten-free, Vegan, Vegetarian | As expected |
| 2 | Choose **Vegan** | Only vegan items are listed, and it combines with search and category | As expected (Figure 53) |
| 3 | Read the Peanut Butter card | "Limit 2 per visit" is shown and its quantity field stops at 2 | As expected |

### TC_24 · NFR4: Firefox and WebKit

**Preconditions:** `npx playwright install firefox webkit` done once. **Automated by:** `npm run test:e2e:browsers`. **Result:** Pass.

| Step | Action | Expected result | Actual result |
|---:|---|---|---|
| 1 | Run the 61 desktop browser tests in Firefox | All pass | 61 of 61 (Figure 78) |
| 2 | Run them in WebKit, the engine behind Safari | All pass | 61 of 61 (Figure 79) |

# Test Report

## Summary

The full test suite was run on the final code on **November 15, 2026**, on a Windows 11 laptop with Node.js 25.8.0 and Playwright 1.64.1. All 24 test cases pass. All 249 unit and integration tests pass, all 66 browser and accessibility tests pass in Chromium, and the 61 desktop browser tests also pass in Firefox and in WebKit (Safari's engine). All 9 load scenarios pass with 50 and with 200 users. Every exit criterion in Section 11.5 is met, and all 20 defects found during the project are closed.

## Planned versus executed

| Test set | Planned | Executed | Passed | Failed | Notes |
|---|---:|---:|---:|---:|---|
| Test cases (Section 12) | 24 | 24 | 24 | 0 | |
| Unit and integration tests (`npm test`) | 249 | 249 | 249 | 0 | The 3 former `todo` tests for D-17 to D-19 now pass as normal tests |
| Browser and accessibility tests, Chromium (`npm run test:e2e`) | 66 | 66 | 66 | 0 | Desktop and phone |
| Desktop browser tests, Firefox (`npm run test:e2e:browsers`) | 61 | 61 | 61 | 0 | |
| Desktop browser tests, WebKit | 61 | 61 | 61 | 0 | |
| Load scenarios, 50 users (`npm run test:perf`) | 9 | 9 | 9 | 0 | D-20 fixed |
| Load scenarios, 200 users | 9 | 9 | 9 | 0 | |

## Unit and integration tests

249 tests in 30 files ran in 5.3 seconds: 249 passed, 0 failed, none skipped or marked `todo` (Figure 73). Coverage of the server code (`src/`) is shown below (Figure 74).

| File | Lines | Branches | Functions |
|---|---:|---:|---:|
| `auth/passwords.js` | 100% | 100% | 100% |
| `auth/routes.js` | 100% | 96.36% | 100% |
| `db.js` | 100% | 100% | 100% |
| `lib/errors.js`, `lib/time.js`, `lib/validate.js` | 100% | 100% | 100% |
| `routes/inventory.js` | 100% | 90.48% | 100% |
| `routes/pickups.js` | 100% | 100% | 100% |
| `routes/staff.js` | 100% | 96.67% | 100% |
| `services/alerts.js`, `inventory.js`, `reports.js`, `slots.js` | 100% | 100% | 100% |
| `services/notifications.js` | 100% | 93.10% | 100% |
| `services/pickups.js` | 100% | 98.86% | 100% |
| `services/reminders.js` | 100% | 80.00% | 100% |
| **All files** | **100%** | **98.17%** | **100%** |

## Browser and accessibility tests

| Test file | Tests | Chromium | Firefox | WebKit | What it covers |
|---|---:|---:|---:|---:|---|
| `accessibility.spec.js` | 15 | 15 | 15 | 15 | 8 axe-core scans, 4 keyboard-only flows, 3 screen-reader announcement checks |
| `auth.spec.js` | 9 | 9 | 9 | 9 | Sign-in form, wrong password, role redirects, protected pages, sign-out |
| `inventory.spec.js` | 4 | 4 | 4 | 4 | Staff inventory screen, dietary filter, retiring, donations, student cancel, 2 axe scans |
| `staff.spec.js` | 12 | 12 | 12 | 12 | Queue, prepare, complete, cancel, filter, pickup times, alerts, report, HTML safety, no console errors |
| `student.spec.js` | 21 | 21 | 21 | 21 | Browsing, search and filter, requesting and booking, notifications, access and safety |
| `mobile.spec.js` | 5 | 5 | — | — | Sign-in, student and staff pages at Pixel 7 size; booking and queue actions by tap |
| **Total** | **66** | **66** | **61** | **61** | |

Two existing browser tests needed small changes for the final features, and we record them for honesty. The test that checks the request button is disabled while a booking is sent intercepted every request to `/api/pickups`; the student page now also reads `/api/pickups` to show "Your pickup", so the check now applies only to the booking POST. And Firefox answers a page reload from its cache with `304 Not Modified`, so the test that reloads the student page now accepts 200 or 304. Neither change weakens what the test checks.

## Load and performance tests

Each scenario runs for 5 seconds. Targets: no errors or timeouts; p99 under 500 ms for reads and staff actions; p99 under 2,000 ms for sign-in.

| Scenario | 50 users: req/s | p50 ms | p99 ms | 200 users: req/s | p50 ms | p99 ms | Result |
|---|---:|---:|---:|---:|---:|---:|---|
| Health check | 21,659 | 2 | 3 | 20,200 | 9 | 19 | Pass |
| Browse items (public) | 9,446 | 5 | 9 | 8,070 | 23 | 41 | Pass |
| Static sign-in page | 3,593 | 13 | 20 | 3,329 | 58 | 94 | Pass |
| Staff pickup queue | 7,612 | 6 | 10 | 6,880 | 27 | 45 | Pass |
| Staff pickup times | 6,248 | 7 | 12 | 5,739 | 33 | 50 | Pass |
| Staff usage report | 4,248 | 11 | 18 | 3,619 | 52 | 81 | Pass |
| Staff low-stock check (write, 20 users) | 5,813 | 3 | 12 | 5,441 | 3 | 12 | Pass |
| Sign in (10 users) | 134 | 74 | 92 | 125 | 80 | 100 | Pass |
| Browse items during 10 sign-ins at once (60 / 210 users) | 920 | 54 | 69 | 3,387 | 59 | 91 | Pass |

**NFR3 is met at the server level.** With 200 users at once, every page and data request answered within 94 ms at p99, far inside the 3-second target. These are server response times measured on a laptop, not full page loads over the internet, and the free Render instance is smaller than the laptop.

**D-20 is fixed.** Before November 15, password hashing blocked the server: browsing during a burst of 10 sign-ins measured 551 ms at p99 on an idle machine (and up to 3,200 ms on a busy one), and sign-in managed 38 requests per second. With asynchronous hashing, browsing during the same burst measures 69 ms, and sign-in handles 134 requests per second.

## Defects

Twenty defects were found and **all 20 are closed.** The table in Section 9.8 lists each one and its fix.

| Severity | Found | Closed | Open |
|---|---:|---:|---:|
| Critical | 1 | 1 | 0 |
| High | 4 | 4 | 0 |
| Medium | 7 | 7 | 0 |
| Low | 8 | 8 | 0 |
| **Total** | **20** | **20** | **0** |

| Found by | Defects |
|---|---|
| QA tests and GitHub Issues (Gavin Marvelle) | 13: D-02, D-03, D-04, D-06, D-12 to D-20 |
| End-to-end checks on a running server (Andrew Merritt) | 7: D-01, D-05, D-07 to D-11 |

D-17 to D-20 were open at the Development Demo. They were fixed on November 15 and their tests now pass: the three former `todo` tests for D-17 to D-19, and the load test's mixed scenario for D-20.

## Test case results

| Test case | Requirement | Result |
|---|---|---|
| TC_01 Staff sign-in | FR1 | Pass |
| TC_02 Student sign-in | FR1 | Pass |
| TC_03 Wrong password | FR1 | Pass |
| TC_04 Only in-stock items listed | FR2 | Pass |
| TC_05 Search and filter | FR3 | Pass |
| TC_06 Request food and book | FR4, FR5 | Pass |
| TC_07 Invalid bookings refused | FR4, FR5 | Pass |
| TC_08 Cancel releases stock and notifies | FR6 | Pass |
| TC_09 Inventory and donations (API) | FR7 | Pass |
| TC_10 Prepare, then complete | FR8, FR6 | Pass |
| TC_11 Low-stock alerts | FR9 | Pass |
| TC_12 Anonymous usage report | FR10 | Pass |
| TC_13 Students cannot see staff data | NFR1 | Pass |
| TC_14 Cross-site requests refused | NFR1 | Pass |
| TC_15 Accessibility and phones | NFR2, NFR4 | Pass |
| TC_16 Performance with 200 users | NFR3 | Pass |
| TC_17 Staff manage pickup times | FR5 | Pass |
| TC_18 Reminder within 24 hours | FR6 | Pass |
| TC_19 Login rate limit | NFR1 | Pass |
| TC_20 Race for the last spot | FR4, FR5 | Pass |
| TC_21 Inventory screen | FR7 | Pass |
| TC_22 Student cancels own pickup | FR6 | Pass |
| TC_23 Dietary filter and limits | FR3, FR4 | Pass |
| TC_24 Firefox and WebKit | NFR4 | Pass |

## Exit criteria

| Criterion | Target | Result | Met? |
|---|---|---|---|
| Open defects | No critical or high open | None open | Yes |
| Critical test cases | 100% pass | 24 of 24 | Yes |
| Automated tests | At least 95% pass | 315 of 315 (249 unit and integration, 66 browser in Chromium), plus 61 of 61 in each of Firefox and WebKit | Yes |
| Coverage of requirements | Every requirement has a test case | FR1–FR10 and NFR1–NFR4 all covered | Yes |
| Accessibility | 0 axe-core violations | 0 on 10 page states | Yes |
| Performance | 500 ms p99 reads at 50 users; 3 s at 200 users | 20 ms and 94 ms worst read; 69 ms during a burst of sign-ins | Yes |

## Conclusion

Testing gives strong evidence that every requirement works as specified, in three browser engines, and that the system handles bad input, races and unauthorized users correctly. What testing did not cover is stated plainly: no manual screen-reader test, no tests on real Apple or Android devices, and no load test against the hosted Render instance. The most valuable lesson for testing came from the two worst defects (D-01 and D-02): both appeared only on the deployed site, which is why the test plan includes checks against the live environment.

# Team Assignments and Responsibilities

## Team and roles

| Member | Role | Owns |
|---|---|---|
| Andrew Merritt | Project manager and developer | Sprint plan and timeline; FR5 pickup times, FR6 cancellations and notifications, FR8 fulfillment, FR9 low-stock alerts, FR10 usage report; the staff page and shared styles; the final fixes (FR7 inventory screen, FR3 dietary filter, FR6 student cancel, async login hashing); reviews and merges; demo deck and reports |
| Abdullah Saadawi | Developer | Server setup; FR1 accounts and roles; NFR1 security; FR7 inventory and donations API; sign-in page and seed data; Render deployment |
| Mohamed Muse | Developer | Front-end wireframes; FR2 browse, FR3 search and filter, FR4 requests: the student portal |
| Gavin Marvelle | QA lead | Existing-systems review, need, risk and ethics analysis; test plan and test cases; unit, integration, browser, accessibility and load test suites; GitHub Issues; test report |

## Responsibilities by phase

| Phase | Andrew Merritt | Abdullah Saadawi | Mohamed Muse | Gavin Marvelle |
|---|---|---|---|---|
| Mid-Semester Demo (Sep 25): requirements, plan and design | Requirements and priority table; development plan; title and overview; assembled the deck | Back-end design for each functional requirement; system architecture diagram | Front-end wireframe for each functional requirement | Review of existing systems (process management); need analysis; risk analysis; ethical issues |
| Development Demo (Nov 13): implementation and testing | FR5, FR6, FR8–FR10 and the staff page; bug fixes from end-to-end checks; reviews and merges; deck, report and recording | Express server; FR1 and NFR1; FR7 API; sign-in page; seed data; Render deployment | Student portal (FR2–FR4); filter unit tests | Test plan; 15 test cases; 240 of the 283 automated tests plus the load test; Issues #11, #18, #19; test report |
| Final documentation (Nov 30) | Finished the last gaps (FR7 screen, FR3, FR6, D-17 to D-20) and assembled this document from the team's deliverables, the code and a fresh test run, both with Claude Code (Sections 17.2.4, 17.2.6 and 17.2.7) | Source of Sections 6.2 (back-end designs), 9.5 (FR1, FR7) and 9.9 | Source of Sections 6.2 (wireframes) and 9.5 (FR2–FR4, his own words) | Source of Sections 5.3, 7.2 and 8, and of the test plan, test cases and test report in Sections 11–13 |

## Contributions in the repository

Every change reached `main` through a pull request. The table lists the merged pull requests by author.

| Member | Merged pull requests | What they contain |
|---|---|---|
| Abdullah Saadawi | #1, #2, #3, #4, #14 | Express server and health check; login; inventory and donations with tests; authentication security and CSRF protection; sign-in page and demo seed data |
| Andrew Merritt | #5–#10, #12, #15–#17, #20, #23–#27, #29–#31, and the branch `andrew/final-fixes` | Pickups, notifications, alerts, reports and the staff page; low-stock triggers; bug fixes and shared stylesheet; sign-out; staff account check (Issue #19); time-zone and QA bug fixes; demo deck, report and README updates |
| Mohamed Muse | #22 | Student portal: browse, search and filter, request and book (FR2–FR4) |
| Gavin Marvelle | #21, #28 | Unit, integration, browser, accessibility and load tests; browser tests for the student page. Also logged GitHub Issues #11, #18 and #19 |

The number of pull requests reflects how each person worked, not how much effort they put in; for example, Gavin's two pull requests contain 240 tests. Individual effort is recorded in each member's effort log, as the syllabus requires.

## How the team worked together

The project manager kept the sprint plan, posted what was due in the team chat, reviewed pull requests and merged them once tests passed. The API table in the README was the contract between the front end and the back end. The QA lead reported defects as GitHub Issues with steps to reproduce, and the owner of the requirement fixed them. For the Development Demo each member recorded their own part, and the parts were combined into one video.

## Lessons learned

In each member's own words:

- **Andrew Merritt:** "Deploy and test on the live site early. Our two worst bugs, login being blocked on Render and the server clock running five hours off, only showed up once the site was deployed."
- **Abdullah Saadawi:** "The biggest thing I learned was how important it is to test the login system and backend together because even when the code works locally, issues can still come up once everything is deployed."
- **Mohamed Muse:** "The biggest thing I learned was how important it is to test features as you build them, since working on the student portal and its filter tests showed me how small issues can affect the overall functionality and user experience."
- **Gavin Marvelle:** "The biggest lesson I learned is that effective testing requires more than unit tests; it also takes extensive manual testing, load testing, and close collaboration with developers."

# Ethical Guidance

We followed the ACM Code of Ethics and Professional Conduct [3] and the course's guidelines for ethical computing practice. The table shows how each principle shaped the work.

| Principle | How we applied it |
|---|---|
| **Contribute to society and human well-being** (ACM 1.1) | The project exists to make food help easier to reach for students who need it |
| **Avoid harm** (ACM 1.2) | Privacy by design (Section 6.9); no real student data was ever used; neutral wording that does not shame or pressure students |
| **Be honest and trustworthy** (ACM 1.3) | This document reports what was not built (Section 2.7), every defect we found and how it was fixed (Sections 9.8 and 13.6), and the changes we had to make to two tests (Section 13.4), not only successes |
| **Be fair and take action not to discriminate** (ACM 1.4) | Accessibility to WCAG 2.1 AA; phone support; per-visit limits and one open request per student so pickup times are shared fairly |
| **Respect the work required to produce new ideas and creative works** (ACM 1.5) | Every open-source package is used under its license (table below); AI-generated code is credited by tool; the existing systems we learned from are cited |
| **Respect privacy** (ACM 1.6) and **honor confidentiality** (ACM 1.7) | Passwords and session tokens stored only as hashes; reports with counts only; demo accounts only; the database file and `.env` are kept out of Git; demo passwords are not printed in this document |
| **Strive for high quality** (ACM 2.1) | Code review on every pull request; 315 automated tests, run in three browser engines; 100% line coverage of the server code |
| **Give thorough evaluations, including risks** (ACM 2.5) | Risk analysis kept up to date through implementation (Section 7); remaining risks listed for anyone who deploys the system |
| **Design systems that are robustly and usably secure** (ACM 2.9) | Security controls in Section 6.9, each verified by a test |

## Respect for ownership: licenses of the software we used

| Package | Version | License | Used for |
|---|---|---|---|
| Express | 5.3.0 | MIT | Web server |
| Playwright (`@playwright/test`) | 1.64.1 | Apache-2.0 | Browser tests |
| axe-core and `@axe-core/playwright` | 4.14.0 | MPL-2.0 | Accessibility tests |
| autocannon | 8.0.0 | MIT | Load tests |
| jsdom | 26.1.0 | MIT | Page-script unit tests |
| Node.js (including `node:sqlite` and `node:test`) | 22.13 or newer | MIT | Runtime, database driver, test runner |

All of these licenses allow use in our project. Our own code is released under the MIT license, in the `LICENSE` file at the top of the repository. No third-party images, icons or fonts are used in the application. All text in this document was written by the team; AI tools were used as described in Section 15.2 and Section 17.2.

## Avoiding plagiarism: declared AI use

The course allows AI with declared use. Every AI-generated or AI-assisted file is listed by tool, date and developer in `docs/AI_USAGE.md`, and the Claude Code foundation files start with the comment `AI-generated (Claude Code) - see docs/AI_USAGE.md`. Section 17.2 shows that code. The AI tools were used as a coding and writing aid under the team's direction; no file was merged without a team member reading, testing and reviewing it, and the analysis, decisions and conclusions in this document are the team's own. Each team member remains responsible for every line they merged, AI-generated or not.

## Confidentiality

The repository holds demo accounts only. Real student data was never entered into any copy of the system. The usage report and this document contain no student-identifying information.

## Diversity and equity

Requests are private, which reduces the stigma of asking for food. Dietary tags (for example vegan, halal or gluten-free) and a dietary filter help students with dietary or religious needs find food they can eat. Every page passes automated WCAG 2.1 AA scans with zero violations, the main tasks were tested with the keyboard alone, and the pages work on phones as well as laptops, so students without a computer are not left out.

# GitHub Repository Link

| | |
|---|---|
| **Repository** | **https://github.com/a0merr/University-Food-Pantry-CSE-350-** |
| Live site | https://university-food-pantry-cse-350.onrender.com |
| Development Demo recording | https://drive.google.com/file/d/1eYzJMOtO-ii8ReUGqOwY2UhufdKQ50EF/view?usp=sharing |
| Visibility | Public |
| Main branch | `main` |
| History | 86 commits, 26 merged pull requests and 3 closed issues as of November 13, 2026; the November 15 final fixes (branch `andrew/final-fixes`) were merged into `main` in pull request #32 |
| AI usage log | `docs/AI_USAGE.md` |
| This document | `docs/final/` |

![Figure 80. The repository on GitHub](images/web/web-01-github-repo.png){width=6.50in}

![Figure 81. Pull requests on GitHub: every change reached main through a reviewed pull request](images/web/web-02-github-prs.png){width=6.50in}

![Figure 82. GitHub Issues used for defect tracking](images/web/web-03-github-issues.png){width=6.50in}

## Source code archive

The file **CSE350_Group15_Source.zip**, submitted with this document, contains all of the project's source files: the application (`server.js`, `src/`, `public/`, `scripts/`), all tests (`tests/`), the configuration (`package.json`, `package-lock.json`, `playwright.config.js`, `.gitignore`) and the documentation (`README.md`, `docs/`, including the source text and images of this document). It leaves out `node_modules/` (recreated by `npm install`), the local database in `data/` (recreated by `npm run seed`), and the PDF and Word copies of this document, which are submitted separately.

## Running the project

1. Install Node.js 22.13 or newer and check with `node --version`.
2. Clone and install:
   ```text
   git clone https://github.com/a0merr/University-Food-Pantry-CSE-350-.git
   cd University-Food-Pantry-CSE-350-
   npm install
   ```
   Or unzip `CSE350_Group15_Source.zip` and run `npm install` in that folder.
3. Load the demo data with `npm run seed`. It prints the demo sign-in details.
4. Start the site with `npm start` and open http://localhost:3000.
5. Run the tests: `npm test` (unit and integration); `npx playwright install chromium` once, then `npm run test:e2e` (browser and accessibility); `npx playwright install firefox webkit` once, then `npm run test:e2e:browsers` (Firefox and WebKit); `npm run test:perf` (load).

Node.js may print an `ExperimentalWarning` for `node:sqlite`; that is expected.

# References

## Sources

[1] F. K. Brito-Silva, W. Wang, C. E. Moore, C. Warren, D. C. Miketinas, W. J. Tucker, and K. E. Davis, "College Campus Food Pantry Program Evaluation: What Barriers Do Students Face to Access On-Campus Food Pantries?" *Nutrients*, vol. 14, no. 14, art. 2807, 2022. doi:10.3390/nu14142807.

[2] U.S. Government Accountability Office, "Food Insecurity: Better Information Could Help Eligible College Students Access Federal Food Assistance Benefits," GAO-19-95, Dec. 2018. https://www.gao.gov/products/gao-19-95

[3] Association for Computing Machinery, "ACM Code of Ethics and Professional Conduct," 2018. https://www.acm.org/code-of-ethics

[4] World Wide Web Consortium (W3C), "Web Content Accessibility Guidelines (WCAG) 2.1," W3C Recommendation. https://www.w3.org/TR/WCAG21/

[5] E. J. Braude and M. E. Bernstein, *Software Engineering: Modern Approaches*, 2nd ed. Wiley, 2011.

[6] OWASP Foundation, "Cross-Site Request Forgery Prevention Cheat Sheet." https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html

[7] PantrySoft, campus and food pantry software. https://www.pantrysoft.com

[8] Link2Feed, client management software for food banks and pantries. https://www.link2feed.com

[9] Express 5 documentation. https://expressjs.com/

[10] Node.js documentation: `node:sqlite`, `node:test` and `crypto.scrypt`. https://nodejs.org/docs/latest/api/

[11] Playwright documentation. https://playwright.dev/

[12] Deque Systems, axe-core. https://github.com/dequelabs/axe-core

[13] autocannon. https://github.com/mcollina/autocannon

[14] jsdom. https://github.com/jsdom/jsdom

[15] Render documentation. https://render.com/docs

[16] Mermaid, used to draw the diagrams in this document. https://mermaid.js.org/

[17] Pygments, used to color the code screenshots in this document. https://pygments.org/

[18] Anthropic, Claude Code (model Claude Opus 5.5). https://claude.com/claude-code

[19] OpenAI, ChatGPT. https://chatgpt.com/

## AI-generated code used in the project

This section shows the AI-generated code in the project, as the assignment requires. The code was produced with AI tools under the direction of the team member named in each row, who reviewed and tested it. The source of truth is `docs/AI_USAGE.md` in the repository.

### Summary

| Tool | Developer | Date | Files | Lines | How it is marked |
|---|---|---|---|---:|---|
| Claude Code (Anthropic), Claude Opus 5.5 | Shared foundation, requested by Andrew Merritt | Nov 9, 2026 | `src/db.js`, `src/lib/errors.js`, `src/lib/time.js`, `src/lib/validate.js`, `src/auth/passwords.js`, `public/js/api.js`, `public/js/ui.js` | 360 | Marker comment at the top of each file |
| Claude Code, Claude Opus 5.5 | Andrew Merritt | Nov 12, 2026 | Bug fixes, part of `public/css/styles.css`, staff cancel button, `public/js/signout.js`, `public/js/staff-guard.js` (Section 17.2.3) | 436 | Listed in `docs/AI_USAGE.md`; the two new scripts carry the marker comment |
| Claude Code, Claude Opus 5.5 | Gavin Marvelle | Nov 12–13, 2026 | QA test suites in pull requests #21 and #28 (Section 17.2.5) | 4,097 | `Co-Authored-By: Claude Opus 5.5` trailer on each commit |
| ChatGPT (OpenAI) | Abdullah Saadawi | Nov 10, 2026 | `src/routes/inventory.js`, `src/services/inventory.js`, `tests/unit/inventory.test.js`, `src/auth/routes.js`, parts of `server.js` | 544 | Listed in `docs/AI_USAGE.md` |
| ChatGPT (OpenAI) | Mohamed Muse | Nov 12, 2026 | Ideas and troubleshooting only; no AI-generated code | 0 | Listed in `docs/AI_USAGE.md` |
| Claude Code, Claude Opus 5.5 | Andrew Merritt | Nov 15, 2026 | FR7 inventory screen and item details, FR3 dietary filter, FR6 student cancel, async login hashing, and their tests (Section 17.2.4) | 1,285 | Listed in `docs/AI_USAGE.md`; every new file carries the marker comment |
| **Total** | | | | **6,722 of 9,387 (71.6%)** | |

### Claude Code foundation files

These seven files were generated by Claude Code on November 9, 2026 as the shared starting point, then reviewed and tested by the team. They are reproduced in full exactly as they are on `main`. `src/lib/time.js` has since been changed by the team to reject times skipped by daylight saving (defect D-14); the listing shows the current file.

#### src/db.js

*src/db.js · 129 lines*

```javascript
// SQLite database (Node's built-in node:sqlite driver, no native build step).
// AI-generated (Claude Code) - see docs/AI_USAGE.md
import { DatabaseSync } from 'node:sqlite';

export const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE COLLATE NOCASE,
  name          TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL CHECK (role IN ('student', 'staff')),
  created_at    TEXT NOT NULL
);

-- Only a SHA-256 hash of each session token is stored (NFR1).
CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL
);

-- quantity = units on the shelf; reserved = units held for open requests.
-- Students see quantity - reserved.
CREATE TABLE IF NOT EXISTS items (
  id                  INTEGER PRIMARY KEY,
  name                TEXT NOT NULL,
  category            TEXT NOT NULL,
  dietary_tags        TEXT NOT NULL DEFAULT '',
  quantity            INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  reserved            INTEGER NOT NULL DEFAULT 0 CHECK (reserved >= 0),
  per_visit_limit     INTEGER CHECK (per_visit_limit IS NULL OR per_visit_limit > 0),
  low_stock_threshold INTEGER NOT NULL DEFAULT 0 CHECK (low_stock_threshold >= 0),
  active              INTEGER NOT NULL DEFAULT 1,
  created_at          TEXT NOT NULL,
  updated_at          TEXT NOT NULL,
  CHECK (reserved <= quantity)
);

CREATE TABLE IF NOT EXISTS donations (
  id          INTEGER PRIMARY KEY,
  item_id     INTEGER NOT NULL REFERENCES items(id),
  quantity    INTEGER NOT NULL CHECK (quantity > 0),
  source      TEXT NOT NULL DEFAULT '',
  logged_by   INTEGER REFERENCES users(id),
  received_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS pickup_slots (
  id        INTEGER PRIMARY KEY,
  starts_at TEXT NOT NULL UNIQUE,
  capacity  INTEGER NOT NULL CHECK (capacity > 0)
);

CREATE TABLE IF NOT EXISTS requests (
  id            INTEGER PRIMARY KEY,
  student_id    INTEGER NOT NULL REFERENCES users(id),
  status        TEXT NOT NULL CHECK (status IN ('submitted', 'scheduled', 'prepared', 'picked_up', 'cancelled')),
  slot_id       INTEGER REFERENCES pickup_slots(id),
  reminder_sent INTEGER NOT NULL DEFAULT 0,
  created_at    TEXT NOT NULL,
  prepared_at   TEXT,
  picked_up_at  TEXT,
  cancelled_at  TEXT
);
CREATE INDEX IF NOT EXISTS idx_requests_student ON requests(student_id, status);
CREATE INDEX IF NOT EXISTS idx_requests_slot ON requests(slot_id, status);

CREATE TABLE IF NOT EXISTS request_items (
  request_id INTEGER NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
  item_id    INTEGER NOT NULL REFERENCES items(id),
  quantity   INTEGER NOT NULL CHECK (quantity > 0),
  PRIMARY KEY (request_id, item_id)
);

CREATE TABLE IF NOT EXISTS notifications (
  id         INTEGER PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  request_id INTEGER REFERENCES requests(id),
  type       TEXT NOT NULL CHECK (type IN ('scheduled', 'ready', 'reminder', 'cancelled')),
  message    TEXT NOT NULL,
  created_at TEXT NOT NULL,
  read_at    TEXT
);

-- Development email provider: messages land here instead of an SMTP server.
CREATE TABLE IF NOT EXISTS email_outbox (
  id         INTEGER PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject    TEXT NOT NULL,
  body       TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS low_stock_alerts (
  id          INTEGER PRIMARY KEY,
  item_id     INTEGER NOT NULL REFERENCES items(id),
  available   INTEGER NOT NULL,
  threshold   INTEGER NOT NULL,
  created_at  TEXT NOT NULL,
  resolved_at TEXT
);

CREATE TABLE IF NOT EXISTS settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
INSERT OR IGNORE INTO settings (key, value) VALUES ('visit_item_limit', '8');
`;

export function openDatabase(file = ':memory:') {
  const db = new DatabaseSync(file);
  db.exec('PRAGMA foreign_keys = ON;');
  if (file !== ':memory:') db.exec('PRAGMA journal_mode = WAL;');
  db.exec(SCHEMA);
  return db;
}

/** Runs fn inside a transaction; rolls back if it throws. */
export function transaction(db, fn) {
  db.exec('BEGIN IMMEDIATE');
  try {
    const result = fn();
    db.exec('COMMIT');
    return result;
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}
```

#### src/lib/errors.js

*src/lib/errors.js · 17 lines*

```javascript
// Typed application errors. The error handler turns these into JSON responses.
// AI-generated (Claude Code) - see docs/AI_USAGE.md

export class AppError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export const badRequest = (message) => new AppError(400, 'bad_request', message);
export const unauthorized = (message = 'Please sign in.') => new AppError(401, 'unauthorized', message);
export const forbidden = (message = 'You do not have access to this feature.') => new AppError(403, 'forbidden', message);
export const notFound = (message = 'Not found.') => new AppError(404, 'not_found', message);
export const conflict = (message) => new AppError(409, 'conflict', message);
export const tooManyRequests = (message) => new AppError(429, 'too_many_requests', message);
```

#### src/lib/time.js

*src/lib/time.js · 43 lines*

```javascript
// Time helpers. The pantry runs in one time zone, so timestamps are stored as
// local ISO strings ("2026-11-09T13:30:00"), which sort and compare as text.
// AI-generated (Claude Code) - see docs/AI_USAGE.md

const pad = (n) => String(n).padStart(2, '0');

export function toLocalIso(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

export function toLocalDate(date) {
  return toLocalIso(date).slice(0, 10);
}

/** Parses "YYYY-MM-DDTHH:MM[:SS]" as local time. Returns null when invalid. */
export function parseLocalIso(text) {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(String(text ?? ''));
  if (!m) return null;
  const [, y, mo, d, h, mi, s] = m.map(Number);
  if (h > 23 || mi > 59 || (s || 0) > 59) return null;
  const date = new Date(y, mo - 1, d, h, mi, s || 0);
  if (date.getFullYear() !== y || date.getMonth() !== mo - 1 || date.getDate() !== d) return null;
  // A time skipped by daylight saving (e.g. 2:30 AM on spring-forward day) rolls forward; reject it.
  if (date.getHours() !== h || date.getMinutes() !== mi) return null;
  return date;
}

/** Parses "YYYY-MM-DD". Returns null when invalid. */
export function parseLocalDate(text) {
  return parseLocalIso(`${text}T00:00`);
}

/** "Fri, Sep 25 at 1:30 PM" */
export function formatSlot(startsAt) {
  const d = parseLocalIso(startsAt);
  if (!d) return String(startsAt);
  const day = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  return `${day} at ${time}`;
}

export const systemClock = { now: () => new Date() };
```

#### src/lib/validate.js

*src/lib/validate.js · 26 lines*

```javascript
// Input validation helpers shared by the services.
// AI-generated (Claude Code) - see docs/AI_USAGE.md
import { badRequest } from './errors.js';

export function requireString(value, label, { max = 200 } = {}) {
  if (typeof value !== 'string' || value.trim() === '') throw badRequest(`${label} is required.`);
  const trimmed = value.trim();
  if (trimmed.length > max) throw badRequest(`${label} must be ${max} characters or fewer.`);
  return trimmed;
}

export function requireInt(value, label, { min = 0, max = 100000 } = {}) {
  const n = typeof value === 'string' && value.trim() !== '' ? Number(value) : value;
  if (!Number.isInteger(n)) throw badRequest(`${label} must be a whole number.`);
  if (n < min || n > max) throw badRequest(`${label} must be between ${min} and ${max}.`);
  return n;
}

export function optionalInt(value, label, opts) {
  if (value === undefined || value === null || value === '') return null;
  return requireInt(value, label, opts);
}

export function requireId(value, label = 'ID') {
  return requireInt(value, label, { min: 1, max: Number.MAX_SAFE_INTEGER });
}
```

#### src/auth/passwords.js

*src/auth/passwords.js · 47 lines*

```javascript
// Password hashing with scrypt (salted, memory-hard). Plain-text passwords are never stored (NFR1).
// AI-generated (Claude Code) - see docs/AI_USAGE.md
import { scrypt, scryptSync, randomBytes, timingSafeEqual, createHash } from 'node:crypto';
import { promisify } from 'node:util';

const KEY_LENGTH = 64;
const PARAMS = { N: 16384, r: 8, p: 1 };
const scryptAsync = promisify(scrypt);

export function hashPassword(password) {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, KEY_LENGTH, PARAMS);
  return `scrypt$${salt.toString('hex')}$${hash.toString('hex')}`;
}

export function verifyPassword(password, stored) {
  const [algorithm, saltHex, hashHex] = String(stored ?? '').split('$');
  if (algorithm !== 'scrypt' || !saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, 'hex');
  const actual = scryptSync(String(password), Buffer.from(saltHex, 'hex'), expected.length, PARAMS);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

// Async versions for request handlers (D-20). scryptSync blocks the whole server while it
// hashes (about 50 ms), so a burst of sign-ins slowed every other request. crypto.scrypt runs
// on libuv's thread pool instead, so other requests keep being answered. Same format and
// parameters as the sync versions, which the seed script and tests still use.
export async function hashPasswordAsync(password) {
  const salt = randomBytes(16);
  const hash = await scryptAsync(password, salt, KEY_LENGTH, PARAMS);
  return `scrypt$${salt.toString('hex')}$${hash.toString('hex')}`;
}

export async function verifyPasswordAsync(password, stored) {
  const [algorithm, saltHex, hashHex] = String(stored ?? '').split('$');
  if (algorithm !== 'scrypt' || !saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, 'hex');
  const actual = await scryptAsync(String(password), Buffer.from(saltHex, 'hex'), expected.length, PARAMS);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export function sha256(text) {
  return createHash('sha256').update(text).digest('hex');
}

// Used when an email is unknown so a failed login takes the same time either way.
export const DUMMY_HASH = hashPassword('not-a-real-password');
```

#### public/js/api.js

*public/js/api.js · 28 lines*

```javascript
// Small fetch wrapper used by every page.
// AI-generated (Claude Code) - see docs/AI_USAGE.md

export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export async function api(path, { method = 'GET', body } = {}) {
  const headers = { 'X-Requested-With': 'fetch' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const res = await fetch(path, {
    method,
    headers,
    credentials: 'same-origin',
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (res.status === 401 && !path.startsWith('/api/auth/login')) {
    window.location.assign('/');
    throw new ApiError(401, 'Please sign in.');
  }
  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, data?.error?.message ?? 'Something went wrong. Please try again.');
  return data;
}
```

#### public/js/ui.js

*public/js/ui.js · 92 lines*

```javascript
// DOM helpers shared by the pages. Text is always set with textContent, never innerHTML,
// so data from the server cannot inject markup.
// AI-generated (Claude Code) - see docs/AI_USAGE.md

/** el('p', { class: 'x', text: 'hi' }, child1, child2) */
export function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (value === undefined || value === null || value === false) continue;
    if (key === 'text') node.textContent = value;
    else if (key === 'class') node.className = value;
    else if (key.startsWith('on') && typeof value === 'function') node.addEventListener(key.slice(2), value);
    else if (value === true) node.setAttribute(key, '');
    else node.setAttribute(key, value);
  }
  for (const child of children.flat()) {
    if (child === null || child === undefined || child === false) continue;
    node.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
  return node;
}

/** Shows a message in a live region so screen readers announce it (NFR2). */
export function showMessage(target, text, kind = 'ok') {
  const box = typeof target === 'string' ? document.querySelector(target) : target;
  box.replaceChildren();
  if (!text) return;
  box.append(el('div', { class: `message ${kind}`, role: kind === 'error' ? 'alert' : 'status' }, text));
}

const pad = (n) => String(n).padStart(2, '0');
export function localDate(d = new Date()) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function parseLocal(iso) {
  const [date, time = '00:00'] = iso.split('T');
  const [y, m, d] = date.split('-').map(Number);
  const [h, mi] = time.split(':').map(Number);
  return new Date(y, m - 1, d, h, mi);
}

export function formatDay(iso) {
  return parseLocal(iso).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
}

export function formatTime(iso) {
  return parseLocal(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

export function formatDateTime(iso) {
  return `${parseLocal(iso).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} at ${formatTime(iso)}`;
}

export const STATUS_LABELS = {
  submitted: 'Needs pickup time',
  scheduled: 'Scheduled',
  prepared: 'Ready for pickup',
  picked_up: 'Picked up',
  cancelled: 'Cancelled',
};

export function statusChip(status) {
  return el('span', { class: `chip ${status}`, text: STATUS_LABELS[status] ?? status });
}

/** Two-step confirm inside the page (no browser confirm() dialogs). */
export function confirmButton(button, { prompt, confirmLabel, onConfirm }) {
  const original = button.textContent;
  let armed = false;
  let timer;
  button.addEventListener('click', async () => {
    if (!armed) {
      armed = true;
      button.textContent = confirmLabel;
      button.setAttribute('aria-describedby', button.id + '-prompt');
      const hint = document.getElementById(button.id + '-prompt');
      if (hint) hint.textContent = prompt;
      timer = setTimeout(reset, 6000);
      return;
    }
    clearTimeout(timer);
    reset();
    await onConfirm();
  });
  function reset() {
    armed = false;
    button.textContent = original;
    const hint = document.getElementById(button.id + '-prompt');
    if (hint) hint.textContent = '';
  }
}
```

### Claude Code changes requested by Andrew Merritt

On November 12, 2026, Andrew Merritt used Claude Code to find and fix bugs through an end-to-end check of the running server and a headless-browser check of the staff page.

| File | Lines added or changed | What changed |
|---|---:|---|
| `public/css/styles.css` | 138 new | Shared stylesheet. The first 121 lines are Andrew's hand-written styles moved from `staff.html`; the header comment and "Part 2" (status chips, report metrics, focus outlines, student item cards, pickup-time buttons, notification list, sign-in helpers) are AI-generated |
| `public/staff.html` | 1 | Inline styles replaced with a link to the stylesheet |
| `public/js/staff-reports.js` | 2 | Readable status labels in the report |
| `src/services/reports.js` | 3 | D-07: top items no longer count cancelled requests |
| `src/services/slots.js` | 11 | D-08 and D-09: clear errors when deleting a pickup time with history or moving one into the past |
| `server.js` | 23 | D-01, D-05, D-10, D-11: create `data/`, trust Render's proxy, send reminders at startup, answer malformed JSON with 400 |
| `public/js/staff-pickups.js` | 13 | Cancel button in the staff queue |
| `tests/unit/reports.test.js`, `tests/unit/slots.test.js` | 73 | One test for each of the three service fixes |
| `public/js/signout.js`, `public/staff.html` | 14 | Sign-out link (listed below) |
| `tests/unit/signout-ui.test.js` | 22 | Tests for the sign-out link and the account check |
| `public/js/staff-guard.js`, `public/staff.html` | 42 | D-06 (Issue #19): the staff page re-checks the signed-in account (listed below) |
| `server.js`, `scripts/seed.js`, `src/lib/time.js`, `src/services/pickups.js` | 24 | D-02, D-12 to D-15: Eastern time zone, JSON 404, 413 for large bodies, daylight-saving check, end-of-day filter |
| `tests/unit/time-and-queue.test.js` | 51 new | Tests for the queue date filter and the daylight-saving check |
| `public/css/styles.css` | 2 | Student item cards fill the width |
| `public/js/signout.js` | 2 | D-16: catch a failed logout |
| Four test files | 15 | Test updates after pull requests #21 and #22 merged |

#### public/js/signout.js

*public/js/signout.js · 14 lines*

```javascript
// Sign-out link for any page: <a href="/" id="sign-out">Sign out</a>
// AI-generated (Claude Code) - see docs/AI_USAGE.md
import { api } from './api.js';

document.querySelector('#sign-out')?.addEventListener('click', async (event) => {
  event.preventDefault();
  try {
    await api('/api/auth/logout', { method: 'POST' });
  } catch {
    // Go to the sign-in page anyway; the session cookie expires on its own.
  } finally {
    window.location.assign('/');
  }
});
```

#### public/js/staff-guard.js

*public/js/staff-guard.js · 41 lines*

```javascript
// Staff page guard (Issue #19). Every tab in a browser shares one sign-in, so signing in as a
// student in another tab turns this page's session into a student session and every staff
// action fails. Check the account on load and whenever this tab comes back into view.
// AI-generated (Claude Code) - see docs/AI_USAGE.md
import { el } from './ui.js';

const banner = el('div', { class: 'message error', role: 'alert', id: 'role-warning', hidden: true });
document.querySelector('main')?.prepend(banner);

async function checkRole() {
  let user = null;
  try {
    const res = await fetch('/api/auth/me', { credentials: 'same-origin' });
    if (res.ok) ({ user } = await res.json());
  } catch {
    return; // Network error: leave the page as it is.
  }

  if (!user) {
    window.location.assign('/');
    return;
  }

  if (user.role === 'staff') {
    banner.hidden = true;
    return;
  }

  banner.replaceChildren(
    `This browser is now signed in as ${user.name} (a ${user.role} account), so staff actions are blocked. `,
    el('a', { href: '/', text: 'Sign in as staff again' }),
    '.'
  );
  banner.hidden = false;
}

checkRole();
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') checkRole();
});
window.addEventListener('focus', checkRole);
```

### Claude Code final fixes (Andrew Merritt, November 15)

On November 15, 2026, Andrew Merritt used Claude Code to close the gaps left at the Development Demo. Every change was tested (Section 13) and is listed in `docs/AI_USAGE.md`.

| File | Lines added (removed) | What changed |
|---|---:|---|
| `src/services/inventory.js` | 91 (13) | D-17 to D-19: threshold, per-visit limit and dietary tags on new items; partial updates; retire and restore |
| `src/routes/inventory.js` | 5 | Re-check low stock after adding, editing or donating |
| `src/auth/passwords.js`, `src/auth/routes.js` | 36 (7) | D-20: asynchronous password hashing for register and login; register re-checks the email after hashing |
| `src/services/pickups.js`, `src/routes/pickups.js` | 23 (1) | `listForStudent()` and `GET /api/pickups` |
| `public/js/staff-inventory.js` | 171 new | Staff inventory panel (listed below) |
| `public/js/student-mypickup.js` | 68 new | "Your pickup" panel with Cancel (listed below) |
| `public/js/student-filter.js`, `public/js/student-pickup.js` | 56 (6) | Dietary menu; tags and limits on item cards; quantity capped at the limit |
| `public/staff.html`, `public/student.html`, `public/js/staff-pickups.js`, `public/css/styles.css` | 84 (1) | New sections, menu, nav link and styles; alerts refresh after inventory changes |
| `scripts/seed.js` | 15 (14) | Dietary tags and two per-visit limits in the demo data |
| Three new unit test files, `tests/e2e/inventory.spec.js`, `playwright.browsers.config.js` | 724 new | 28 unit tests, 4 browser tests, and the Firefox and WebKit configuration |
| Four existing test files | 12 (9) | Former `todo` tests made real; two browser tests adjusted (Section 13.4); load-test comments |
| **Total** | **1,285** | |

#### public/js/staff-inventory.js

*public/js/staff-inventory.js · 171 lines*

```javascript
// FR7: staff inventory screen. Add and edit items (quantity, low-stock threshold, per-visit
// limit, dietary tags), retire or restore an item, and log donations.
// AI-generated (Claude Code) - see docs/AI_USAGE.md
import { api } from './api.js';
import { el, showMessage } from './ui.js';

const itemForm = document.querySelector('#item-form');
const formTitle = document.querySelector('#item-form-title');
const submitButton = document.querySelector('#item-submit');
const cancelEdit = document.querySelector('#item-cancel-edit');
const itemMessage = document.querySelector('#item-message');
const donationForm = document.querySelector('#donation-form');
const donationItem = document.querySelector('#donation-item');
const donationMessage = document.querySelector('#donation-message');
const itemList = document.querySelector('#item-list');
const field = (id) => document.querySelector(`#${id}`);

let editingId = null;

function inventoryChanged() {
  // Lets the low-stock alerts panel (staff-pickups.js) refresh.
  document.dispatchEvent(new Event('inventory-changed'));
}

function startEdit(item) {
  editingId = item.id;
  field('item-name').value = item.name;
  field('item-category').value = item.category;
  field('item-quantity').value = String(item.quantity);
  field('item-quantity').min = String(item.reserved);
  field('item-threshold').value = String(item.low_stock_threshold);
  field('item-limit').value = item.per_visit_limit ? String(item.per_visit_limit) : '';
  field('item-tags').value = item.dietary_tags ?? '';
  formTitle.textContent = `Edit ${item.name}`;
  submitButton.textContent = 'Save Changes';
  cancelEdit.hidden = false;
  showMessage(itemMessage, '');
  field('item-name').focus();
}

function resetForm() {
  editingId = null;
  itemForm.reset();
  field('item-quantity').min = '0';
  formTitle.textContent = 'Add an item';
  submitButton.textContent = 'Add Item';
  cancelEdit.hidden = true;
}

function itemRow(item) {
  const retired = item.active !== 1;
  return el('tr', { class: retired ? 'retired' : null },
    el('td', { 'data-label': 'Item', text: item.name }),
    el('td', { 'data-label': 'Category', text: item.category }),
    el('td', { 'data-label': 'Dietary tags', text: item.dietary_tags || '—' }),
    el('td', { 'data-label': 'On shelf', text: item.quantity }),
    el('td', { 'data-label': 'Reserved', text: item.reserved }),
    el('td', { 'data-label': 'Available', text: item.available }),
    el('td', { 'data-label': 'Threshold', text: item.low_stock_threshold }),
    el('td', { 'data-label': 'Limit', text: item.per_visit_limit ?? '—' }),
    el('td', { 'data-label': 'Status', text: retired ? 'Retired' : 'Active' }),
    el('td', { 'data-label': 'Actions' },
      el('div', { class: 'actions' },
        el('button', {
          type: 'button', class: 'secondary', text: 'Edit',
          'aria-label': `Edit ${item.name}`, onclick: () => startEdit(item)
        }),
        el('button', {
          type: 'button', class: retired ? 'secondary' : 'danger', text: retired ? 'Restore' : 'Retire',
          'aria-label': `${retired ? 'Restore' : 'Retire'} ${item.name}`, onclick: () => setActive(item, retired)
        })
      )
    )
  );
}

async function loadItems() {
  try {
    const { items } = await api('/api/items');
    const previous = donationItem.value;
    donationItem.replaceChildren(...items.map(item => el('option', {
      value: String(item.id),
      text: item.active === 1 ? item.name : `${item.name} (retired)`
    })));
    if (items.some(item => String(item.id) === previous)) donationItem.value = previous;

    if (!items.length) {
      itemList.replaceChildren(el('p', { class: 'empty', text: 'No items yet. Add the first one above.' }));
      return;
    }
    itemList.replaceChildren(el('table', {},
      el('thead', {}, el('tr', {}, ['Item', 'Category', 'Dietary tags', 'On shelf', 'Reserved', 'Available',
        'Threshold', 'Limit', 'Status', 'Actions'].map(label => el('th', { text: label })))),
      el('tbody', {}, items.map(itemRow))
    ));
  } catch (err) {
    showMessage(itemMessage, err.message, 'error');
  }
}

async function saveItem(event) {
  event.preventDefault();
  const limit = field('item-limit').value.trim();
  const body = {
    name: field('item-name').value,
    category: field('item-category').value,
    quantity: Number(field('item-quantity').value),
    low_stock_threshold: Number(field('item-threshold').value),
    per_visit_limit: limit === '' ? null : Number(limit),
    dietary_tags: field('item-tags').value
  };
  try {
    if (editingId) {
      await api(`/api/items/${editingId}`, { method: 'PATCH', body });
    } else {
      await api('/api/items', { method: 'POST', body });
    }
    const verb = editingId ? 'updated' : 'added';
    resetForm();
    await loadItems();
    showMessage(itemMessage, `Item ${verb}.`);
    inventoryChanged();
  } catch (err) {
    showMessage(itemMessage, err.message, 'error');
  }
}

async function setActive(item, active) {
  try {
    await api(`/api/items/${item.id}`, { method: 'PATCH', body: { active } });
    if (editingId === item.id) resetForm();
    await loadItems();
    showMessage(itemMessage, active
      ? `${item.name} restored. Students can request it again.`
      : `${item.name} retired. Students no longer see it.`);
    inventoryChanged();
  } catch (err) {
    showMessage(itemMessage, err.message, 'error');
  }
}

async function logDonation(event) {
  event.preventDefault();
  try {
    await api('/api/donations', {
      method: 'POST',
      body: {
        item_id: Number(donationItem.value),
        quantity: Number(field('donation-quantity').value),
        source: field('donation-source').value.trim()
      }
    });
    const itemId = donationItem.value;
    donationForm.reset();
    await loadItems();
    donationItem.value = itemId;
    showMessage(donationMessage, 'Donation logged. Stock updated.');
    inventoryChanged();
  } catch (err) {
    showMessage(donationMessage, err.message, 'error');
  }
}

itemForm.addEventListener('submit', saveItem);
cancelEdit.addEventListener('click', () => {
  resetForm();
  showMessage(itemMessage, '');
});
donationForm.addEventListener('submit', logDonation);

await loadItems();
```

#### public/js/student-mypickup.js

*public/js/student-mypickup.js · 68 lines*

```javascript
// FR6: the student's own open pickup, with a Cancel button that returns the items to the pantry.
// AI-generated (Claude Code) - see docs/AI_USAGE.md
import { api } from './api.js';
import { confirmButton, el, formatDateTime, showMessage, statusChip } from './ui.js';

const list = document.querySelector('#my-pickup-list');
const message = document.querySelector('#my-pickup-message');

function itemSummary(items = []) {
  return items.map(item => `${item.quantity} x ${item.name}`).join(', ');
}

function pickupCard(pickup) {
  const id = `cancel-pickup-${pickup.id}`;
  const button = el('button', { type: 'button', class: 'secondary', id, text: 'Cancel pickup' });
  // Two clicks, so a stray tap does not cancel the order.
  confirmButton(button, {
    prompt: 'Press "Confirm cancel" to cancel this pickup and return the items to the pantry.',
    confirmLabel: 'Confirm cancel',
    onConfirm: () => cancelPickup(pickup.id)
  });
  return el('article', { class: 'my-pickup' },
    el('div', {},
      el('h3', { text: pickup.starts_at ? formatDateTime(pickup.starts_at) : 'No pickup time yet' }),
      el('p', { text: itemSummary(pickup.items) }),
      statusChip(pickup.status)
    ),
    el('div', { class: 'actions' },
      button,
      el('p', { id: `${id}-prompt`, class: 'hint', 'aria-live': 'polite' })
    )
  );
}

async function loadMyPickups() {
  const { pickups } = await api('/api/pickups');
  list.replaceChildren(...pickups.map(pickupCard));
  if (!pickups.length) {
    list.replaceChildren(el('p', { class: 'empty', text: 'You have no pickup booked.' }));
  }
}

async function cancelPickup(id) {
  try {
    await api(`/api/pickups/${id}/cancel`, { method: 'POST' });
    await loadMyPickups();
    showMessage(message, 'Pickup cancelled. The items were returned to the pantry.');
    // Lets the booking form (student-pickup.js) refresh stock, times and notifications.
    document.dispatchEvent(new Event('pickup-cancelled'));
  } catch (err) {
    showMessage(message, err.message, 'error');
  }
}

document.addEventListener('pickup-booked', async () => {
  showMessage(message, '');
  try {
    await loadMyPickups();
  } catch (err) {
    showMessage(message, err.message, 'error');
  }
});

try {
  await loadMyPickups();
} catch (err) {
  showMessage(message, err.message, 'error');
}
```

### Claude Code QA tests (Gavin Marvelle)

Gavin Marvelle used Claude Code for the QA test suites in pull requests #21 and #28. Every commit in both carries a `Co-Authored-By: Claude Opus 5.5` trailer. In his words: "AI was used to check over test cases and to strengthen any code that was written by myself to make sure that all ends were covered when testing took place."

| Files | Lines |
|---|---:|
| `playwright.config.js`, `tests/helpers.js`, `tests/server-harness.js` | 306 |
| `tests/e2e/`: `accessibility.spec.js`, `auth.spec.js`, `mobile.spec.js`, `staff.spec.js`, `student.spec.js`, `serve.js`, `support.js` | 900 |
| `tests/integration/server.test.js`, `tests/integration/server-edge.test.js` | part of 388 |
| `tests/perf/load-test.js` | 161 |
| `tests/unit/`: `api-routes`, `auth-routes`, `db-and-passwords`, `edge-and-security`, `frontend-core`, `frontend-pages`, `inventory-routes`, `lib`, `services-edge-cases` | most of 3,500 |
| **Total counted as AI-assisted** | **4,097** |

At about 4,100 lines, these tests are too long to print here; they are in the repository and in the source archive. Figures 42 and 43 show two representative excerpts.

### ChatGPT-assisted code (Abdullah Saadawi)

Abdullah Saadawi used ChatGPT on November 10, 2026 for the inventory and security work (FR7, FR1 improvements and NFR1): the inventory and donation routes with staff authorization, the inventory and donation logic, the inventory unit tests, login email normalization and rate limiting in `src/auth/routes.js`, and the request security middleware in `server.js`. The code was implemented with ChatGPT's help and tested locally. Representative excerpts are shown in Figures 24, 25, 26 and 37; the full files are in the repository.

### AI use in preparing this document

This document was written by the team on November 15, 2026, after the final fixes in Section 17.2.4, and Andrew Merritt assembled it. It draws on the team's Mid-Semester Demo and Development Demo deliverables, the README, `docs/AI_USAGE.md`, the source code and the git history. Claude Code was used as a writing aid to help organize and edit the team's material, in the same way it was used on the code. It did not decide what the document says: the analysis, the design and the conclusions are the team's, and quotations attributed to team members are their own words from the Development Demo report. The test results in Sections 12 and 13 come from running the full test suite on the final code; the diagrams (Mermaid) and the code, application and test screenshots were produced during assembly. This documentation is not source code, so it is not counted in the AI share in Section 17.2.
