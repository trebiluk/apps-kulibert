# Bertopia fix briefs BN-21 to BN-28

Nov 1 2026, for ManagerBot and the Bertopia coder. These are the eight fixes from `claude/BERTOPIA-FULL-EVAL.md`, written up as briefs a coder can pick up. Every line number below was checked on main `eff87159`, the build that is live today. Plan only, no code. ManagerBot locks versions.

## Rules for every brief

- **Scope:** at most 3 fixes and about 5 files. Version files don't count.
- **Screens:** check every brief at 1366x768, 412x915 upright, 915x412 sideways and 360x640.
- **Controls:** 44 px targets, the visible focus ring, icon + text, keyboard and touch.
- **Light-sensitive safe:** no colour-only meaning, no sound-only cues, no neon, no glow, no strobe, no white flash. Reduced motion is honoured.
- **Strings:** new text goes in all 9 blocks (en, simple, uk, ru, es, ar, fa-AF, rw, ti), with English plus a request to WordBot. The coder never rewords existing strings.
- **Kids' data:** aliases only, no PII, no new network calls.
- **Proof in every PR:** source only, rebuild at ship, and screenshots at 1366 and 412 attached.

## Send order

| Order | ID | Fix | Risk | Diego GO? |
|---|---|---|---|---|
| 1 | BN-21 | Motion, contrast and sound settings actually work | M | no: makes existing settings and switches work |
| 2 | BN-22 | Robot warnings and the save chip in every language | L | no: WordBot writes the words |
| 3 | BN-23 | Messages stay up long enough to read | L | no |
| 4 | BN-26 | 12 px text floor | L | no |
| 5 | BN-27 | The first view shows the starter tree | L | no for the aim fix; yes for the new "turn to find a tree" line |
| 6 | BN-28 | Lazy changelog: a fifth off the download | M | no |
| 7 | BN-25 | Phone and sideways layout | M | **yes** (layout) |
| 8 | BN-24 | Word-list alias in the Hub | M | **yes** (Hub sign-in; Hub lane) |

---

## BN-21: Motion, contrast and sound settings actually work

**Why:** a light-sensitive kid who picks "less motion" in the Hub still gets full motion in Bertopia. Bertopia's own High Contrast and Gentle Mode switches look like they work but change nothing.

**What the code does today:**
- **Hub settings script not loaded.** Bertopia never loads `/shared/kulibert-prefs.js` (its scripts are `index.html:1438–1440`). It only reads the *language* from the stored settings (`main.js:652–656`, `kulibert-bar.js:552–557`). Alice and Catapult load the script in `<head>`.
- **Dead rules.** Nothing sets `data-kp-motion` or `data-kp-contrast`, so the 32 `data-kp-*` selectors in `index.html` (27) and `read.css` (5) never apply.
- **Motion read once.** `REDUCE` is read once at load (`main.js:175`) and used in 11 more places, so a change mid-game does nothing. `fx.js:2–6` already has a live `motionLess()` that reads `data-kp-motion`.
- **Shake with no guard.** The tree-chop shake (`shakeChop`, `main.js:2857`, CSS `index.html:261`) moves the whole 3D view ±3 px on every hit.
- **Rescue tint still shows.** `#poof` (`index.html:361`, shown at `main.js:8757`) becomes a flat tint under reduced motion (`index.html:368`); it should not show at all.
- **The in-game switches are dead.** In the Accessibility panel (`learn.js:433–478`), *High Contrast* sets `html[data-a11y=contrast]`, but no CSS rule uses that attribute. *Gentle Mode* saves `gentle: true` (`learn.js:358`), but nothing reads it. Neither tile shows whether it is on; only *Brighter nights* has a ✓.

**Check first:**
- `kulibert-prefs.js` also sets `<html lang>` and paints high contrast (black and yellow on buttons) with a yellow focus ring. Load it at 1366 and 412 with contrast on and off. Confirm it doesn't fight Bertopia's own language choice (`kidLanguage`) or make the HUD unreadable, and name anything that clashes.
- It wraps `AudioContext` to mute "sound off". Confirm Bertopia's 3 sound sources (`basics.js:125`, `hud-calm.js:126`, `stations.js:236`) are created after it loads, so they get muted.

**Fixes:**
1. **Load the Hub settings.** Add `<script src="/shared/kulibert-prefs.js">` before `app.js`, as Alice does. Hub *less motion*, *high contrast* and *sound off* then apply.
2. **One live motion check.** Replace the 11 `REDUCE` reads with `motionLess()` from `fx.js`, called live. Skip `shakeChop()` and `#poof` entirely when motion is less. Add `@media (prefers-reduced-motion: reduce)` and `html[data-kp-motion=less]` rules that turn off `.chop-shake`.
3. **Make the in-game switches real.**
   - *Gentle Mode* turns motion off in Bertopia: it sets the same "less motion" state for this game only, so the Hub setting is not changed behind the kid's back.
   - *High Contrast* turns on the same contrast styles as the Hub's high-contrast setting.
   - Both tiles show their state with a ✓ plus the words "On" or "Off", the same way *Brighter nights* does.

**Files:** `index.html`, `src/main.js`, `src/fx.js`, `src/learn.js`, `read.css`

**Strings:** `a11yOn` ("On") and `a11yOff` ("Off"), if not already present. Check with `rg "a11yOn|\bOn\b"`.

**Acceptance:**
- **Hub less motion.** In the Hub, set *less motion*, open Bertopia, and chop a tree 5 times at 1366 and 412: the view never moves. Fall into the void: no tint. Set the Hub back to *full* and switch tabs: the shake is back without a reload.
- **OS reduced motion.** With *full* in the Hub, turn on the OS reduced-motion setting mid-game: the shake stops at the next chop.
- **Gentle Mode.** At 412, turn on Gentle Mode in Bertopia's Accessibility panel: the tile shows ✓ On, and chopping does not shake. Reload: still on. The Hub's own setting is unchanged.
- **High Contrast.** At 1366, turn on High Contrast in Bertopia: the panels and buttons change to the contrast style, and the tile shows ✓ On. The 3D view is unchanged.
- **Hub sound off.** With *sound off* in the Hub, open a door, earn a "nice" chime and buy at the shop: nothing is heard, and each still shows its toast or visual.
- **Clean run.** 0 console errors. The language picked in Bertopia still wins over the Hub's.

---

## BN-22: Robot warnings and the save chip in every language

**Why:** a kid playing in Ukrainian, Arabic or Tigrinya gets the robot warnings in English. The save chip is English for everyone, and it explains itself with a browser `alert`: a bright white system dialog that also breaks full screen.

**What the code does today:**
- **Nine keys in English only.** These keys exist in English only (`strings-extra.js:10`) and are missing from all 7 other blocks: `rustbotNear` "Rustbot nearby, hit its back", `slam` "Slam!", `rebooted` "Rebooted!", `scrapperTook` "Scrapper took your item", `zap` "Zap!", `dexPage` "New Bertodex page", `badgeGot` "Badge", `select` "Select" and `option` "Option".
- **Where they show.** In use at `mobs.js:419, 520, 525`. `t()` falls back to English with only a console warning (`main.js:721–729`).
- **The save chip is English-only.** `src/save/sync-chip.js` (143 lines) holds all its words: chip labels (lines 136–140, 114–119), explanations (lines 38–42) and the retry `aria-label` (line 105). The explanation opens with `window.alert(msg)` (line 45).

**Fixes:**
1. **Translate the 9 keys.** WordBot writes them for uk, ru, es, ar, fa-AF, rw and ti, and Simple where it helps (the robot lines). The coder pastes them in, with no rewording.
2. **Save chip strings.** Move them into `strings-extra.js` under new `sync*` keys and read them through the game's `t()`. The chip gets `t` passed in (it's created from `main.js`), not a second copy of the strings.
3. **No more alert.** Replace `window.alert` with the game's own card: the dark panel with the 44 px Close and Escape to close, focus moved in and back out. The card is `role="dialog"` with a label.

**Files:** `src/strings-extra.js`, `src/save/sync-chip.js`, `src/main.js` (pass `t` and the card helper)

**Strings:** new `syncSaved`, `syncSaving`, `syncOffline`, `syncNoSign`, `syncFailed`, `syncTryAgain`, plus 5 explanation lines (`syncWhySaved` … `syncWhyFailed`). English from today's text, unchanged.

**Acceptance:**
- **No missing keys.** A small script shows 0 missing keys for every language against EN (the `STR`+`EXTRA` union), and there is no `missing string` warning in the console during the 5-minute robot check (`?debug=1&clock=night`).
- **Arabic and Ukrainian.** At 412 in Arabic (RTL) and Ukrainian, let a Rustbot come near: the warning shows in that language. Reboot it: "Rebooted!" shows in that language.
- **The card.** With sync on and signed out, tap the save chip at 1366 and 412: a dark in-game card explains, in the kid's language. No browser dialog opens. Escape and Close both work, and focus goes back to the chip. In full screen, the game stays full screen.
- **Retry.** The retry button's `aria-label` is in the kid's language.

---

## BN-23: Messages stay up long enough to read

**Why:** Deaf/HH kids rely on the text, and many kids read in their second language. A robot warning that disappears in 2.4 s is a sound-only cue in practice.

**What the code does today:**
- **One queue.** Every toast goes through one queue: `toast()` (`main.js:6596`) → `calm.say` → `show()` in `hud-calm.js:148–152`.
- **Timings.** `ms: job.nice ? 1500 : job.chip ? 2000 : (job.act ? 8000 : 2400)`.
- **Robot warnings.** They come from `mobs.js:419, 520, 525` as plain toasts.
- **Bonked card.** The "Bonked" card closes itself after 5 s (`main.js:603`), even before the kid has read it or pressed its button.

**Fixes:**
1. **Reading-time rule** in `show()`:
   - Plain toasts get `max(4000, 1000 + 300 × words)` ms, capped at 10 s.
   - Chips and "nice" toasts get at least 3000 ms.
   - Toasts with an action keep 8 s.
   - The queue must not pile up: a repeat of the text already showing just extends it, and the queue keeps the newest 4.
2. **Warnings stay until the danger passes.** Add a `warn` kind for robot warnings: `toast(text, null, { warn: true })` from `mobs.js`. A warning stays up until that robot is gone or rebooted, or for 12 s, whichever is first. It has a ⚠ icon, so it is not colour-only.
3. **Bonked waits.** Remove the 5 s auto-close on the Bonked card. It waits for its button, Enter or Escape, as it already allows.

**Files:** `src/hud-calm.js`, `src/main.js`, `src/mobs.js`, `src/tips.js` (only if `showToast` needs the `warn` style)

**Strings:** none new.

**Acceptance:**
- **Timing.** At 1366 and 412, a 6-word toast stays about 4 s, and a 16-word toast about 5.8 s. Five identical "Dropped." toasts in a row show once and extend; they don't queue for 20 s.
- **Robot warning.** With `?debug=1`, a Rustbot nearby shows the warning with ⚠, and it stays until the Rustbot is rebooted or leaves (no longer than 12 s). The screen reader announces it once (the live region already exists).
- **Bonked.** It stays until the kid presses Back to bed, Enter or Escape. Then the kid goes home, as now.
- **Clean run.** 0 console errors. `polish-check` and `flora-fix-check` lines about tips are no worse than main.

---

## BN-26: 12 px text floor

**Why:** low-vision kids can't read an 8 px crafting result. It pairs with BN-07 (the day clock target).

**What the code does today:** 13 CSS rules are under 12 px.
- `index.html`:
  - line 188, version tag: 10 px
  - line 414, crafting result label: **8 px**
  - line 566, need count: 11 px
  - line 713, wall caption: 11 px
  - lines 956–957, station labels: `max(10px…)` and 10 px
  - line 960, empty station slot label: **9 px**
  - lines 1112, 1116 and 1127, top-bar tool labels: 11 px
  - line 1158, touch Bag tile label: 10 px
- `read.css`:
  - line 2837: 11 px
  - line 3238: 11 px

**Check first:** for each rule, find the element and screenshot it before the change at 1366 and 412. The 8–10 px ones sit in fixed-size wells, so raising the size may need a 2-line clamp (already used at lines 414 and 960) or a slightly taller well.

**Fixes:**
1. **Raise the small labels.** Every label goes to at least 12 px. Item names (crafting result, Bag tile, station slots) go to at least 14 px wherever they are the only label of the thing.
2. **Fit the wells.** Where a label no longer fits, use the existing 2-line clamp plus `title` and `aria-label` with the full name, so nothing is lost when it is cut short. Don't shrink the icon below 24 px.
3. **A guard.** Add a short check to `topbar-check` or a new `text-floor-check` that fails on any visible text under 12 px at 1366 and 412, with an allow-list that starts empty.

**Files:** `index.html`, `read.css`, `tools/text-floor-check.mjs` (new)

**Strings:** none.

**Acceptance:**
- **Crafting panel.** At 1366 and 412, the crafting result, empty station slot and Bag tile names are readable, with no overlap and no clipping beyond the 2-line clamp.
- **Wells.** Wells stay on one row in the crafting panel at 412.
- **The guard.** `text-floor-check` passes at both sizes, and it fails if any 8 px rule is put back.
- **Arabic.** In Arabic (RTL), the same panels don't overflow.

---

## BN-27: The first view shows the starter tree

**Why:** the first goal is "Get Planks · 0/4", and the tip says to chop the tree *in front of you*. At 1366, in two runs out of two, a new player looks out over fog from a raised lawn, with the tree trunk only at the right edge of the screen. At 915x412 the same world starts with the trunk dead centre.

**What the code does today:**
- `faceFirstSpawn()` (`main.js:2580–2584`) already aims at the nearest spawn tree with `spawnTreeYaw(SPAWN…)` (`worldgen.js:119`) and pitch 0.18. So the design is already "face the tree"; at 1366 it misses.
- A `setLook(0, 0.18)` at `main.js:2585` runs at load. Find out whether it runs after `faceFirstSpawn`, or whether the aim uses `SPAWN` while the player actually stands elsewhere (`worldSpawn`, `main.js:1223`).

**Check first:** log the yaw and the player position at the first frame at 1366 and at 915x412, then name the line that makes them differ.

**Fixes:**
1. **Fix the aim.** Aim from the player's real position after the first chunk loads, not from `SPAWN`. Use the existing `nearestTree` and `faceTree` helpers (`main.js:2820–2832`). Keep the pitch low enough that the trunk and its leaves are both in view.
2. **"Turn to find a tree".** If no tree is in view when the goal shows, the goal line reads "Turn to find a tree 🌳" with the existing `aim-arrow` pointing to it (`showMoveCloser`, `main.js:2833`). It goes back to "Get Planks" once a tree is on screen. *This line is new text: Diego GO.*
3. **One version label.** The version shows once, in the shared bar, at 1366: today it appears both there and in the game's top-bar chip. Keep it inside the game for 412, where the shared bar hides it.

**Files:** `src/main.js`, `src/learn.js`, `src/strings-extra.js`, `index.html`

**Strings:** `findTree` ("Turn to find a tree").

**Acceptance:**
- **The aim.** On a fresh profile at 1366, 412, 915x412 and 360, the starter tree trunk is within the middle third of the screen at the first frame after load, in 3 runs each.
- **Turn-to-find line.** Turn away from the tree: "Turn to find a tree" with the arrow shows within 1 s. Turn back: "Get Planks · 0/4" returns.
- **Saved worlds.** A saved world reopens where the kid left it, facing where they faced: this fix is for a new world only.
- **Version.** At 1366 the version appears once.

---

## BN-28: Lazy changelog, a fifth off the download

**Why:** every kid downloads every changelog entry ever written, every time the game loads, on school Wi-Fi and Chromebooks.

**What the code does today:**
- **The bundle.** `app.js` is 3.18 MB, one file (`build.mjs:50–56`, esbuild, `format: 'iife'`).
- **What's in it, by esbuild's metafile:**
  - `src/changelog.js` is **563 KB, 18.1 %** of the bundle: 503 entries in 9 languages, imported at `main.js:72`.
  - `strings-extra.js` is another 352 KB (11.3 %), carrying 515 `whatsNewBody` copies.
- This is brief B12 (and B13) from the 50-brief plan, now measured.

**Fixes:**
1. **Keep only the newest 10 in the bundle.** The build writes the full list to `changelog.json` next to `app.js`. The panel fetches it when opened, and the service worker caches it.
2. **Offline.** The changelog panel shows the 10 bundled entries at once, then the rest when loaded. Offline it shows "More when online" with an icon and text, and never an error.
3. **What's new.** Keep one `whatsNewBody` per language, the newest, and drop the 514 older copies.

**Files:** `build.mjs`, `src/changelog.js` (or a new `src/changelog-recent.js`), `src/panels.js`, `src/strings-extra.js`, `sw.js`

**Strings:** `moreWhenOnline` ("More when online").

**Acceptance:**
- **Smaller bundle.** `app.js` is at least 550 KB smaller (raw), and the metafile shows `changelog.js` under 15 KB.
- **The panel.** Open the changelog panel at 1366 and 412: the newest 10 show at once and the rest within 1 s. Offline (DevTools) it shows the 10 plus "More when online".
- **Every language.** All 9 languages render, and `check-strings` passes.
- **Load time.** The page load in the eval's throttled test (4x CPU, 412) is at least 10 % faster than main's 3.5 s, measured three times each.

---

## BN-25: Phone and sideways layout (needs Diego's GO)

**Why:** on phones and small Chromebook windows the bars eat the game. Measured on main:

| Screen | Bars end at | Share of height | Notes |
|---|---|---|---|
| 1366x768 | 108 px | 14 % | fine |
| 412x915 | 211 px | 23 % | 4 rows; hotbar slots are 36 px wide on touch |
| 360x640 | 211 px | **33 %** | one hotbar slot is off-screen |
| 915x412 sideways | 170 px | **41 %** | Goals chip sits on the joystick; fullscreen crowds Jump |

The rows at 412 are: shared bar, practice chip, mode and clock, then Undo, Redo, Save and Back to the Hub. The held-item name ("Sapling") also takes a whole top-bar box at 1366 and 915.

**Fixes:**
1. **Top area at most 120 px at 412 and 915x412, in at most 2 rows.**
   - Undo, Redo, Save and Back to the Hub fold into one "⋯ More" chip (44 px, icon + text) that opens a small panel.
   - Survival and Creative become one mode chip that shows the current mode as icon + word.
   - The held-item name moves to the label already shown above the hotbar.
   - 1366 is unchanged.
2. **Hotbar on touch.** All 9 slots are at least 44x44 and on screen at 360, 412 and 915x412. At narrow widths, scroll or wrap the Bag (E) button, never the slots.
3. **Overlaps.** Goals and Suit stay clear of the joystick (`#stick-pad`) and Jump. Fullscreen is clear of Jump. Use the same "measure and move" approach as `craftBelowBar`, so later panels don't regress.

**Files:** `index.html`, `read.css`, `src/main.js` (layout), `tools/topbar-check.mjs`

**Strings:** `more` ("More"), if not already present.

**Acceptance:**
- **Bar height.** The top area ends at or above 120 px at 412 and 915x412, and the 1366 screenshot is pixel-identical outside the top bar.
- **Hotbar.** 9 hotbar slots, each at least 44x44, all fully on screen at 360, 412 and 915x412.
- **Overlaps.** No overlap between the Goals, Suit, joystick, Jump and fullscreen boxes at 412 and 915x412 (the check computes rectangles).
- **More panel.** Undo, Redo, Save and Back to the Hub are reachable in 2 taps and by keyboard. Escape closes the panel.

---

## BN-24: Word-list alias in the Hub (needs Diego's GO; Hub lane)

**Why:** a kid can type their real name as the alias, and it then travels with Bertopia drops and saves.

**What the code does today:**
- **Free text in the Hub.** The Hub (repo root `index.html:1933`) has a free-text "Your alias" box (`#who-alias`, max 16 characters). `KulibertWho.write` (`shared/kw-who.js:124–139`) keeps any letters and spaces.
- **TechWorks sign-in is fine.** The verified sign-in gets the alias **from TechWorks** (`kulibert-bar.js:492`), so it is teacher-controlled.
- **Boards are fine.** The Hub's boards already use a word list: Adjective + Animal + Number (`shared/kulibert-boards.js:21–23`).

**Fixes:**
1. **Picker, not free text.** The Hub's alias box becomes the boards' picker: 3 dropdowns, or the existing staff list. The same 8 × 8 × 4 words, so the alias reads, say, "Calm Otter 24".
2. **Old aliases.** A free-text alias already stored keeps working until the kid picks a new one. It is never shown on boards or sent with drops: `KulibertWho.read()` returns `unverified` plus a placeholder like "Player", and the picker opens on the next Hub visit.
3. **One source.** One shared word list, exported from `kulibert-boards.js` and used by both, so the two can't drift.

**Files:** repo-root `index.html` (Hub), `shared/kw-who.js`, `shared/kulibert-boards.js`

**Strings:** reuse the boards' picker labels.

**Acceptance:**
- **Picker only.** At 1366 and 412 in the Hub, there is no free-text alias box, and the picker is keyboard and touch usable at 44 px.
- **Old alias hidden.** An old free-text alias (a typed first and last name) is shown as "Player" in Bertopia drops and boards until a word alias is picked, then the word alias shows.
- **TechWorks unchanged.** Verified TechWorks sign-in still shows the TechWorks alias.

---

## Already found, not in these briefs

- **BN-07:** the day-clock target is 36 px at 1366 and 1024.
- **BN-15:** auto-climb is off by default for a fresh profile (`move-check`).
- **The `main.js` split** (15,074 lines) waits for green tests (BN-03, BN-06).
- **Powered and unpowered wire look:** check on screen whether they differ by more than colour. If not, add it to a later circuits brief.

## Questions for Diego

1. **BN-25:** GO for folding Undo, Redo, Save and Back to the Hub into one "More" chip on phones and sideways only? The 1366 layout stays as it is.
2. **BN-24:** GO for replacing the Hub's free-text alias box with the word-list picker? That is a Hub change, so it goes to the Hub lane.
3. **BN-27:** OK to add the new line "Turn to find a tree"?
4. **Simple language:** in the eval, should Simple cover the first hour of play, or only help and tips? BN-22 adds Simple versions of the robot lines either way.
