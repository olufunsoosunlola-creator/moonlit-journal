# Moonlit Journal 🌙

A quiet, private place for reflection, prayer, dreams, focus and saving. It's built for your phone and you can install it on your home screen. **Everything stays on your device.** There are no accounts, no servers, no cloud and no notifications.

The look comes from three images: a glowing pink lily on dusty mauve, pink foxtail grass with daisies, and pastel meadow hills at dawn. By day the app sits on warm cream paper. After 6pm it turns to a soft mauve glow.

---

## What it does

| Section | What you can do |
| --- | --- |
| **Home** | Greets you by time of day. **Morning:** "Record a dream" while it's fresh. **Afternoon:** your 45-minute focus timer, ready to start. **Night:** tonight's prompt with "Begin tonight's entry". It shows a soft banner on paydays and a warm "welcome back" after a few quiet days. Quick capture lets you log *just a mood*, *one line*, or a *rest day*. |
| **Journal** | Write, edit and delete dated entries. Tag each one with a mood and your own tags, and filter by tag. |
| **Mood** | A monthly calendar where each day takes the color of its mood. Days with no entry stay softly blank; nothing is ever marked as missed. Tap a day to open its entry, or mark it as a rest day. You also see your most common mood and how it compares with last month. |
| **Dreams** | Record dreams with a date, title, description, feelings (peaceful, vivid, unsettling, lucid, recurring) and symbols or people. "Patterns in the night" gathers symbols that come back again and again. |
| **Prompts** | 150 contemplative prompts in six themes: Mysticism, Theology as wonder, Spirit & intuition, Manifestation & intention, Prayer as conversation, and Poetic reflection. You get a daily prompt and a "new prompt" button, can filter by theme, save favorites with a daisy, and start a journal entry from any prompt. |
| **Study** | A focus timer shown as a glowing ring over swaying grass. Focus lasts 45, 50, 60, 75 or 90 minutes, with a 10 or 15 minute rest. Sessions are labeled by subject and saved automatically. Soft hill-shaped charts show your time by day, week and subject, and keepsakes (petals, daisies, moons, lilies) mark milestones. |
| **Savings** | Paydays fall every other Friday, starting October 16, 2026. You get a countdown, a payday calendar and a note for months that hold three paydays. Log each deposit by hand with an amount, date and note. A meadow hill fills as you reach your monthly goal, a chart shows each month, and a bloom of petals celebrates reaching the goal. |
| **Settings** (⚙ on Home) | Choose Auto, Day or Night light. Turn on reduced motion. Set an optional 4-digit passcode for your journal, mood and dream pages. Export a backup, import a backup, and clear (or reload) the sample month. |

**Gentle by design:** there are no streaks and no guilt. Progress is counted as *days journaled this month*, rest days are welcome, and missing a day never resets anything.

### Sample data
The first time you open the app it shows a month of realistic sample pages (Sept–Oct 2026), so you can explore every screen. When you're ready to begin for real, go to **Settings → Sample month → Clear sample data**. Only the sample rows are removed; anything you wrote yourself stays.

### Backup & restore
- **Export backup** downloads a `.json` file with all your data (but never your passcode).
- **Import backup** restores from that file and replaces what's on the device.

Your data lives in this browser on this phone. If you clear the browser's site data, or uninstall the app, the data is erased. **Export a backup now and then.**

---

## Install it on your phone

1. Open the live link in your phone's browser.
2. **iPhone (Safari):** tap **Share** → **Add to Home Screen**.
   **Android (Chrome):** tap the **⋮** menu → **Install app** (or use the button in Settings).
3. Open it from your home screen. It runs full-screen and works offline.

---

## How the data is structured

Everything is saved under one localStorage key, `moonlit-journal.v1`, as JSON. The data is split into separate **tables**. Each table is a list of rows, and every row has an `id` and a `date` (`YYYY-MM-DD`), so it can move into a SQL database later.

```text
journal_entries   id, date, time, title, body, mood, tags[], prompt, created_at, updated_at
moods             id, date, mood, entry_id → journal_entries.id (or null), source ('entry' | 'quick')
rest_days         id, date, note
dreams            id, date, title, description, feelings[], symbols[], created_at, updated_at
study_sessions    id, date, start_time, minutes, subject
savings_deposits  id, date, amount, note, created_at
favorite_prompts  id, prompt_id (e.g. "mysticism-21"), saved_at
settings          theme, reduced_motion, lock_enabled, passcode, monthly_goal,
                  study_focus, study_break, study_subject, subjects[]
```

Notes:
- **Moods** has its own table. Each journal entry with a mood adds one row (`source: 'entry'`), and a quick check-in adds one with `source: 'quick'`. The calendar shows one mood per day, and the entry's mood wins.
- **Sample rows** carry `"sample": true`, which is how "Clear sample data" finds them.
- Arrays like `tags[]` would become their own linking tables in SQL (for example `entry_tags(entry_id, tag)`).
- A backup file looks like `{ "app": "moonlit-journal", "version": 1, "exported_at": "...", "tables": { ... }, "settings": { ... } }`.

---

## How the code is organised

It's plain HTML, CSS and JavaScript, with no frameworks and no build step. Open `index.html` through any web server and it runs.

```text
index.html            the page shell: app area, bottom nav, overlays
manifest.webmanifest  name, icons and colors for "Add to Home Screen"
sw.js                 service worker: saves the files so the app works offline
css/styles.css        all styling; day/night palettes are CSS variables
js/data.js            moods, the 150 prompts, sample month, date & payday helpers
js/storage.js         load/save to localStorage, export & import backups
js/icons.js           the line icons as SVG
js/screens.js         one function per screen that turns state into HTML, plus render()
js/app.js             the state, the actions buttons trigger, the timer, event wiring
assets/               lily, grass and meadow images, plus the fonts (offline-ready)
icons/                app icons
```

**The core idea:** all app data lives in one `state` object. `render()` draws the current screen from `state`. Each button has a `data-action="…"` that matches a function in `actions` (in `app.js`), which updates `state` and calls `render()` again.

### Run it locally
```bash
cd moonlit-journal
python3 -m http.server 8000
# then open http://localhost:8000
```

### Updating the live app
After changing files, bump `CACHE_VERSION` in `sw.js` (for example `moonlit-v2`) so phones pick up the new version.

---

Fonts: Cormorant Garamond and Nunito Sans, under the SIL Open Font License (see `assets/fonts/`). Icons are adapted from [Lucide](https://lucide.dev).
