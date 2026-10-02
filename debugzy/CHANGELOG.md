# Debugzy changelog

**Chip: v0.1.3** · 2026-10-02 · channel **playable**
Source of truth: `app.js` `VERSION` + this file.

## Version law

| Kind | Looks like | Where it goes |
| --- | --- | --- |
| Playable lab | `v0.1.3` | https://apps.kulibert.net/debugzy/ |

## Current train

### 0.1.3 — Arabic and Dari phones — 2026-10-02

- What’s new: Fixed the blank screen in Arabic and Dari on phones.
- `.skip` uses `inset-inline-start` instead of `left: -9999px`, so RTL pages no longer get 10,000px wide on phones.

### 0.1.2 — Puzzles load again — 2026-10-02

- What’s new: Fixed a glitch that stopped puzzles from loading.
- `escapeHtml` in `app.js` has its `&amp;` `&lt;` `&gt;` `&quot;` back, so the script parses and the puzzles show.

### 0.1.1 — Hub language and Menu — 2026-10-02

- What’s new: Debugzy speaks your language, and Menu is at the top left.
- Eight Hub languages, including the five puzzles. Arabic and Dari read right to left. Steps stay 1 through 5 from top to bottom.
- Hub Menu (`data-menu="#dz-nav"`) opens a left drawer: What’s new, Help, Settings (language), Tech Room.
- Footer: Sign in from the Hub to save.

### 0.1.0 — Playable lab — 2026-09-23

- 5 puzzles: fold/save · unit · cable/power · wrong code line · export path.
- Loop: pick bad step · one change · **Try again** · calm Pass/Fail · Puzzle N of M.
- Alias optional · localStorage only · no legal names · skip one puzzle OK.
