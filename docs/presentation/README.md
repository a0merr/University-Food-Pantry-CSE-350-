# Development Demo materials

Everything we hand in on **Friday, November 13**, apart from the code itself. The deck and the written report both follow the assignment rubric, sections 1 to 10. Anything marked **TO ADD** is waiting on someone.

| File | What it is |
|---|---|
| [CSE350_Demo_Deck_DRAFT.pptx](CSE350_Demo_Deck_DRAFT.pptx) | The presentation: 25 slides in rubric order. Each slide is labelled with its rubric section, and the speaker notes name the presenter |
| [RECORDING_GUIDE.md](RECORDING_GUIDE.md) (also [.docx](CSE350_Recording_Guide.docx)) | Who records which slides, what to show on the live site, how to record, and how the clips get combined |
| [../report/REPORT_DRAFT.md](../report/REPORT_DRAFT.md) (also [.docx](../report/CSE350_Written_Report_DRAFT.docx)) | The written report, in `docs/report/` |
| [screenshots/](screenshots/) | Sign-in page, staff page and student page (desktop and phone), taken from `main` with the seed data |

The live site is https://university-food-pantry-cse-350.onrender.com. Demo accounts come from `npm run seed`; the passwords are in Abdullah's message in the team chat.

## How the deck maps to the rubric

| Rubric section | Points | Slides | Presenter |
|---|---:|---|---|
| 1 Title slide | 0.5 | 1 | Andrew |
| 2 Project overview | 0.5 | 2 | Andrew |
| 3 Present project status | 2 | 3 | Andrew |
| 4 Test plan (approach, acceptance criteria, environment, test data, test cases, resources, defect management) | 3 | 4–7 | Gavin |
| 5 Software implementation (plan, language, resources, code and output, AI code, bugs resolved, GitHub) | 3 | 8–17 | Andrew, Abdullah, Mohamed |
| 6 Test scripts | 2 | 18–20 | Gavin |
| 7 Test report | 1 | 21 | Gavin |
| 8 Implementation milestones | 1 | 22 | Andrew |
| 9 Team assignments and responsibilities | 1 | 23 | Andrew |
| 10 Ethical guidelines | 1 | 24 | Andrew |
| Wrap-up and lessons learned | | 25 | Andrew |

## Still to do

**Everyone**
- Record your part and send it in the team chat by **Friday 6 PM** (see the recording guide).
- Send Andrew one line on the biggest thing you learned (slide 25, report section 9).

**Abdullah**
- Slides 9–10: check the bullets and the code match what you built.
- Report section 5.4 (accounts, security, inventory) in your own words, and section 5.7: the Render deploy steps you used.
- If AI helped with `public/index.html` or `scripts/seed.js`, add them to `docs/AI_USAGE.md`.

**Mohamed**
- Slides 11–12: check the code slide matches what you built.
- Report section 5.4 (student page) in your own words.
- If AI helped with the student page, add it to `docs/AI_USAGE.md`.

**Gavin**
- Slides 4–7 and 18–21, and report sections 4, 6 and 7: these were drafted from your tests and today's runs. Check them, adjust the acceptance criteria and defect severities if you disagree, and make them your own.
- `docs/AI_USAGE.md`: fill in "What Gavin did himself" in the QA tests section.

**Andrew**
- Fill in the recording link, add everyone's lessons learned (slide 25, report section 9), and combine the clips.

## Editing

Edit the `.pptx` and `.docx` files directly and push them back in a pull request, or send your text to Andrew in the chat. The `.md` copies are for reading on GitHub; Andrew keeps them in sync.

These documents were drafted with Claude Code at Andrew's request and are listed in `docs/AI_USAGE.md`.
