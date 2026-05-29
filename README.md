# 💍 Wedding Countdown Widget

An iPhone home-screen & lock-screen widget that counts **down** to your wedding
day — then automatically flips to counting **up** ("days married") the moment
the date passes. Built for the free **Scriptable** app, so it runs on your
iPhone with no Mac, no Apple Developer account, and no App Store review.

---

## Part 1 — Get it on YOUR phone (≈ 3 minutes)

1. **Install Scriptable** — free on the App Store: https://apps.apple.com/app/scriptable/id1405459188
2. **Add the script**
   - Open Scriptable → tap the **＋** (top-right).
   - Delete the empty template, then **paste the entire contents of
     `WeddingCountdown.js`**.
   - Tap the title at the top, rename it to **Wedding Countdown**, tap **Done**.
3. **Set your date — no code editing needed.** In Scriptable, just **tap the
   script to run it**. An editor pops up where you type:
   - **Date** — `2026-10-17 16:00` (YYYY-MM-DD HH:MM, 24-hour, your local time)
   - **Couple names** — e.g. `N & T`
   - **Theme** — `rose` / `sunset` / `midnight` / `sage` / `gold`

   - **Photo darkness 0-100** — how dark the scrim over your photo is (higher
     = more readable text over busy photos; default 45)

   Tap **Save** and it's stored to a settings file (synced via iCloud). The
   Home Screen widget reads from there, so **when the date or details change you
   never touch the code** — just run the script again and edit. The values in
   the `CONFIG` block at the top are only the first-run defaults.

   **To use a photo as the background:** run the script and choose
   **"Save & set a photo for a size…"**, then pick **which widget size** the
   photo is for (Small / Medium / Large) — the iOS photo picker opens and the
   image is saved for that size. A dark scrim is drawn over it so the white text
   stays readable.

   **Why per size?** Small widgets are ≈ square; Medium/Large are wide. iOS crops
   to fill, so a photo that looks great on the Large widget gets badly cropped on
   the Small one. Set a separately-framed photo for each size you actually use.
   Choose **"Remove a photo…"** → a size (or **All sizes**) to clear them and fall
   back to the theme gradient. (First time, iOS asks Scriptable for Photos
   permission — allow it.)
4. **Add the widget to your Home Screen**
   - Long-press an empty area of the Home Screen → tap **＋** (top-left).
   - Search **Scriptable** → choose **Small**, **Medium**, or **Large** → **Add Widget**.
   - Long-press the new widget → **Edit Widget** →
     - **Script:** `Wedding Countdown`
     - **When Interacting:** Run Script (or Do Nothing)
     - *(optional)* **Parameter:** a date like `2026-09-12 16:00` — this
       overrides the config, so you can reuse the same script for several
       widgets/dates.
5. Done. 🎉 It refreshes itself (iOS decides exactly how often, ~ once an hour).

### Lock-screen / StandBy version
When adding a **Lock Screen** widget (long-press lock screen → Customize →
Lock Screen → add widget), pick Scriptable too. The script auto-detects the
small accessory sizes and shows a compact `💍 142d to go`.

---

## Part 2 — "Publishing" it so others can use it

Scriptable widgets aren't published to the App Store — they're **shared as a
script**. From easiest to most public:

### A. Share privately (friends & family) — instant
- In Scriptable, tap the script → **Share** (or the share icon) → AirDrop /
  Messages / Mail. The recipient taps it and it opens straight into Scriptable.
- Or share the `.scriptable`/`.js` file via iCloud Drive, Google Drive, etc.

### B. Share a link via GitHub Gist — good for a "paste this" link
1. Create a GitHub account (free) and make a new **Gist**
   (https://gist.github.com) containing `WeddingCountdown.js`.
2. Anyone can open the raw link, copy the code, and paste it into a new
   Scriptable script (same as Part 1, step 2).
3. Bonus: Scriptable can **import from a URL** — share the raw gist URL and tell
   people to use Scriptable's *Import Script* if they have it set up.

### C. Publish to RoutineHub — the real "app store" for Scriptable/Shortcuts
[RoutineHub](https://routinehub.co) is the community directory where Scriptable
scripts and Shortcuts are listed, versioned, and downloadable by anyone.
1. Sign up at https://routinehub.co (free).
2. **Create → Add Scriptable script**, give it a title, description, screenshot,
   and paste/upload the code.
3. You get a public page + a one-tap **Download** link with update tracking and
   a download counter. This is the closest thing to "publishing" a Scriptable
   widget.

### D. If you later want a true App Store app
That requires the **native** route (Swift/SwiftUI + WidgetKit), which needs:
- a **Mac with Xcode**,
- an **Apple Developer Program** membership (**$99/year**),
- and passing **App Store review**.
The Scriptable version above does everything a personal wedding widget needs
without any of that — switch to native only if you want to sell/list a polished
app. (Ask and I'll generate the full Xcode project + submission checklist.)

---

## Customizing
- **Date / names / theme / photo:** run the script in the Scriptable app and use
  the built-in editor — **no code change required.** Priority order is:
  widget **Parameter** field  ▸  saved settings  ▸  `CONFIG` defaults.
- **Background photo (per size):** choose one per widget size via the editor;
  each is stored as `wedding-countdown-bg-<size>.jpg` in Scriptable's folder and
  darkened automatically. Tune the **Photo darkness** value if text is hard to read.
- **New colors:** edit the `THEMES` map to add your own palette (hex values).
- **Wording:** "days to go" / "days married 💛" / "Today! 🎉" live in
  `buildWidget()`.

## How the count works
- Before the date → counts **down** (`N days to go`, with hours/minutes in the
  final day).
- The whole wedding day → shows **"Today! 🎉"** (regardless of ceremony time).
- After the date → counts **up** (`N days married 💛`).

Tested across the boundary cases (100 days out, morning vs. evening of the day,
the day after, and a year later) so the down→up flip is always correct.
