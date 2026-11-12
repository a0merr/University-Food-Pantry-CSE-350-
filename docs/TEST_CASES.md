# Test cases
| ID | Requirement | Steps | Expected |
|---|---|---|---|
| TC01 | FR1 | Register student, sign in | Student role; session cookie set |
| TC02 | FR1/NFR1 | Unauthenticated `/api/items` | 401 JSON error |
| TC03 | FR7 | Staff adds item | Stock listed |
| TC04 | FR2 | Student lists items | Available only; no raw quantities |
| TC05 | FR3 | Search/category/tag UI | Results filtered |
| TC06 | FR4 | Submit valid request | Reserved counts increase |
| TC07 | FR4 | Submit above limit | 400; no partial changes |
| TC08 | FR5 | Book full slot | 409; no overbooking |
| TC09 | FR6 | Cancel pickup | Stock released; notification created |
| TC10 | FR8 | Prepare and pickup | State changes; quantity decreases |
| TC11 | FR9 | Fall below threshold | Alert opens |
| TC12 | FR10 | Aggregate report | Staff-only counts for pickups, units, students served, donations and category totals; no student identities |
| TC13 | NFR2 | axe + manual keyboard/screenreader | WCAG 2.1 AA review |
| TC14 | NFR3 | 200 concurrent users | Pages load within 3s |
| TC15 | NFR4 | Desktop/mobile browsers | Functional in browsers |
