# Times Tables Challenge — setup guide

Files:
- **index.html** — the app the kids play (rename to `Multiplication.html` to match your repo)
- **dashboard.html** — the status page for you/coaches, with 3 tabs: All kids, One kid, Full log (rename to `MultiDashboard.html`)
- **Code.gs** — the Google Apps Script backend connecting both to a Sheet
- **manifest.json**, **dashboard-manifest.json**, **sw.js**, **icons/** — make both pages installable as home-screen apps

## How it works
- 20 levels × 30 questions = 600 questions, easiest tables first (1, 2, 10, 5...) up through the hardest (7, 8, 9, 12), then eight mixed-review levels.
- Levels are **not locked** — kids can play any level, in any order, as many times as they like. Higher levels are worth more points per correct answer (level number × 10), so points reward tackling harder levels, while time rewards speed.
- Kids answer by tapping a number pad (no on-screen keyboard needed) and pressing "Check" — they can change their answer freely before checking.
- After a full pass through a level's questions, if anything was missed, the app asks "want to try the ones you missed again?" — this repeats round after round until the kid says no or gets everything right.
- Once every one of the 20 levels has been played at least once, the app shows the combined total time and total points across all levels. Kids can keep replaying any level to improve their best time or points.
- **Names:** kids pick their name from a dropdown, or add themselves with "➕ Add my name" — that's saved to the Sheet's **Names** tab automatically, so it's there next time for everyone, on any device.
- **Progress sync:** each kid's best time/points per level is saved locally *and* synced to the Sheet. Logging in with the same name on a different device pulls that Sheet progress back down, so progress stays consistent across devices (merging the better of local vs. Sheet, never losing data).

## Step 1 — Google Sheet + Apps Script
1. Create a new Google Sheet (any name). You don't need to create any tabs — the script creates a **Log** tab and a **Names** tab automatically the first time they're needed.
2. Extensions → Apps Script. Delete the placeholder code, paste in everything from `Code.gs`.
3. Deploy → New deployment → type **Web app**.
   - Execute as: **Me**
   - Who has access: **Anyone**
4. Click Deploy, authorize when prompted, and copy the **Web app URL** it gives you.

**Whenever you update `Code.gs` later:** pasting new code into the editor is not enough — you must also go to **Deploy → Manage deployments → (pencil/edit icon) → Version: New version → Deploy**, or the live app keeps running the old code. This is the single most common thing to forget.

## Step 2 — wire up the two HTML files
1. Open `index.html`, find `const APPS_SCRIPT_URL = "";` near the top of the `<script>` and paste the Web app URL from Step 1 between the quotes.
2. Open `dashboard.html` and paste the **same** URL into its `const APPS_SCRIPT_URL = "";`.

You don't need to hardcode kid names anywhere — the roster builds itself as kids add themselves in the app.

## Step 3 — publish to GitHub Pages
1. Push **all** of these into your GitHub Pages repo, keeping the same folder layout:
   - `Multiplication.html` (index.html, renamed)
   - `MultiDashboard.html` (dashboard.html, renamed)
   - `manifest.json`
   - `dashboard-manifest.json`
   - `sw.js`
   - `icons/` folder (icon-192.png, icon-512.png, apple-touch-icon.png, favicon-32.png)
2. Share the `Multiplication.html` link with kids/parents, and keep `MultiDashboard.html` for yourself/coaches.

**If you rename the files again:** `manifest.json`'s `start_url` is set to `./Multiplication.html` and `dashboard-manifest.json`'s to `./MultiDashboard.html`, and `sw.js` lists both filenames in `PRECACHE_URLS`. Renaming means updating those three spots to match, or the "Add to Home Screen" install will point at a missing file.

## Step 4 — install it like an app (PWA)
Both pages are installable as home-screen apps with offline support for the app shell:
- **iPhone/iPad (Safari):** open the link → Share icon → **Add to Home Screen**.
- **Android (Chrome):** open the link → menu (⋮) → **Add to Home screen** / **Install app**.
- **Desktop (Chrome/Edge):** an install icon appears in the address bar.

Once installed, it opens full-screen with no browser bar, and the quiz still works without wifi. Note: offline answers aren't queued for background sync — if a kid plays fully offline, that session's results reach the Sheet the next time they open the app online, not automatically in the background.

## The three dashboard tabs
- **All kids** — one row per kid: status, current level, time/points so far, personal best, last active.
- **One kid** — pick a kid from the dropdown to see their 20-level grid (best time + points per level) plus their 15 most recent activity events.
- **Full log** — every raw event ever logged, newest first, filterable by kid name. This is your complete audit trail.

## Troubleshooting
If the dashboard ever shows a kid's name as **"undefined"** or a date as **"Invalid Date"**, the Log tab's header row (row 1) is missing or malformed. Fix it without retyping anything by hand:
1. In the Apps Script editor, use the function dropdown next to Run and select **resetLogHeaders**, then click ▶ Run (approve authorization if asked). This rewrites row 1 correctly across 9 separate columns.
2. Make sure you've also done the **New version → Deploy** step above — code changes don't take effect otherwise.

## Notes
- Every level completion and every full run writes one row to the **Log** tab — that's your raw data if you ever want extra reports later.
- Adding/removing kids happens entirely from within the app now — no code edits needed.
