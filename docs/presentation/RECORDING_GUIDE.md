---
title: "Demo Recording Guide"
subtitle: "CSE 350 Group 15 · Development Demo · due Friday, November 13"
---

Everyone records their own part. Andrew puts the parts together Friday night and submits the link.

**Send your clip in the team chat by Friday 6 PM.** Name it like `03-Mohamed-student-flow.mp4`.

# Who records what

The slide numbers match the deck Andrew sends out (`CSE350_Demo_Deck`).

| # | Who | Slides | Length | Show live on the site | Say |
|---|---|---|---|---|---|
| 1 | Andrew | 1–4 | ~2 min | Nothing (slides only) | Team and roles; the problem; how it's built; where each requirement stands |
| 2 | Abdullah | 5 | ~2 min | Open the site, sign in as staff (you land on the staff desk), sign out, sign in as a student | Two roles; security (hashed passwords and sessions, rate limit, CSRF and Origin checks); inventory and donations API; seed data; deployed on Render |
| 3 | Mohamed | 6 | 2–3 min | Sign in as `student1@pantry.demo`, browse, search for an item, request two items, pick a pickup time, show the "scheduled" notification | Browse (FR2), search and filter (FR3), requests (FR4); what you built and how it talks to the API |
| 4 | Andrew | 7–9 | 2–3 min | Sign in as staff: prepare one pickup, complete another, cancel one; click **Check Stock**; run the report | Pickup times and limits (FR5), notifications and cancelling (FR6), fulfillment (FR8), low-stock alerts (FR9), usage report with no names (FR10) |
| 5 | Gavin | 10–11 | ~2 min | Optional: an Issue on GitHub | Test plan and test cases; results (only numbers from real runs); bugs found and fixed |
| 6 | Andrew | 12–13 | ~1 min | Nothing | AI-generated code and how it's disclosed; what we built; one lesson learned from each person |

Total: about 12 minutes. If the assignment sets a time limit, trim the slides-only parts first.

**Each person:** send Andrew one line on the biggest thing you learned, for slide 13.

# The live site

- **Site:** https://university-food-pantry-cse-350.onrender.com
- **Demo accounts:** `staff@pantry.demo` and `student1@pantry.demo` to `student3@pantry.demo`. The passwords are in Abdullah's message in the team chat.
- **Open the site a minute before you record.** If nobody has used it for a while, Render takes 30–60 seconds to wake it up.
- **Do your whole demo in one take.** The demo data can reset when the site restarts, so don't rely on anything someone else booked.
- **Andrew (part 4):** right before recording, sign in as two or three students and book pickups, so the staff queue has something to prepare, complete and cancel.

# How to record

1. **Pick a tool**
   - **PowerPoint:** open the deck, go to the Record tab, and record your slides. Then use File, Export, Create a Video at 1080p. For the live demo, record your screen separately (below).
   - **Windows 11:** open Snipping Tool, choose Record (or press Win+Shift+R), select the screen, and turn on the microphone.
   - **Mac:** press Cmd+Shift+5, choose Record Entire Screen, and set Options to your microphone.
   - **Zoom or Teams:** start a meeting with just yourself, share your screen, and record.
2. **Settings:** 1080p (1920×1080), MP4, landscape.
3. **Before you hit record:** turn off notifications (Focus or Do Not Disturb), close other tabs, set the browser zoom to 110–125% so text is readable, and do a 10-second microphone test.
4. **While recording:** say your name and what you built in the first sentence. Talk to the slide or the screen, not about the recording. If you stumble, keep going or redo the take; Andrew can cut the start and end.
5. **After recording:** watch it once, check the sound, rename the file, and send it in the chat.

# Combining the clips (Andrew, Friday night)

1. Open **Clipchamp** (built into Windows 11), choose Create a new video, and set 16:9.
2. Import all six clips and drag them onto the timeline in order 1 to 6.
3. Add a 3-second title card: "Campus Food Pantry · CSE 350 Group 15 · Development Demo".
4. Trim dead air at the start and end of each clip. Optionally add a short fade between parts.
5. Export at 1080p.
6. Upload to YouTube as **Unlisted** (or OneDrive with "Anyone with the link can view").
7. Open the link in a private browser window to check it plays without signing in.
8. Put the link in the written report and the submission.

**Leave time:** exporting and uploading a 12-minute 1080p video can take 30–60 minutes. Start combining by 8 PM if the deadline is 11:59 PM.

**If a clip is missing by 6 PM:** Andrew records that part from the deck's speaker notes.
