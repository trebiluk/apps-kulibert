# Bertopia: full evaluation

Nov 1 2026, for Diego and ManagerBot. Checked against main `eff87159`, the build that is live today. This is an evaluation and a priority list; no code changed for it. (Closing three PRs that had already shipped was done under the Nov 1 OK.)

**How this was checked:**
- every check in `tools/` on a freshly built bundle;
- string coverage in all 9 language blocks;
- a full accessibility and kid-safety read of the source, with every top finding re-checked line by line;
- load, memory and main-thread cost at 1366 and 412, with and without 4x CPU throttle;
- screenshots of the first screen a kid sees;
- content counts;
- the state of every open Bertopia PR.

## Verdict

Bertopia is a real game now. It has 55 recipes, 96 items, five robot kinds, farming, belts, ovens and circuits, a woodshop, Maker Pages, and saves that survive a closed tab. Much of the kid-safety work is already done well:
- no white flashes;
- no colour-only states;
- no sound-only cues;
- no chat;
- 44–48 px controls in the top bar;
- a real focus ring.

**Three things now hold it back more than missing features:**
1. **The light-sensitive and motion settings kids set in the Hub never reach Bertopia.** Only the OS "reduce motion" switch works.
2. **The game is heavy for a Chromebook.** It is one 3.1 MB script (937 KB zipped), with 503 changelog entries shipped inside it. Under 4x CPU throttle the page logs about 200 main-thread stalls over 50 ms in its first seconds; the worst is 2.1 s.
3. **The phone layout and the first minute need care.** At 412 the bars take the top quarter of the screen and hotbar slot 9 is clipped. At 1366 the first goal says "chop the tree in front of you" while the camera faces open fog.

The test suite can't yet tell a real bug from a stale check: main passes 21 of 47. BN-01 and BN-02 (#140, #141) are the start of fixing that.

## Scorecard

| Area | Grade | Why |
|---|---|---|
| Content and depth | **Strong** | 55 recipes (3 by hand, 36 at the bench, 4 at the oven, 12 at smelter, forge and fabricator), 96 items, 5 robot kinds, 4 packs (decor, farm, flora, tech). |
| Story and lore | **Started** | 6 of 20 Maker Pages are wired to real first-time moments. Worldgen has 2 biomes, both near trees. No landmark yet. |
| Light-sensitive safety | **Good, one gap** | No white overlays, no strobe, no lightning, no hit flash. The gaps: the tree-chop shake ignores reduced motion, and the Hub "less motion" choice is ignored. |
| Motion, contrast and sound settings | **Weak** | The Hub settings script is never loaded, so the Hub's motion, contrast and sound choices do nothing here. |
| Deaf/HH and no sound-only cues | **Good, one gap** | Only 3 synthesized sounds, each with a visible partner. The gap: warning toasts last 1.5–2.4 s, too short for slow readers. |
| Colour-only meaning | **Good** | The place ghost has ✓/✕ plus a word. The suit and boss bars show numbers. The sync chip has an icon and text. |
| Targets, focus and keyboard | **Good** | 3 px focus ring, Tab kept inside panels, Escape closes, aria-labels on icon buttons. The day clock is 36 px (BN-07). |
| Text size | **Mixed** | Labels at 8 px (craft result) and 9 px (empty station slot), several at 10–11 px. |
| Languages | **Mixed** | 1,096 keys. 7 languages each lack the same 9 keys, including the robot warnings. The sync chip is English-only. Simple covers 232 keys. |
| Kid data | **Good, one gap** | No chat, the class server is off, sync is opt-in with a verified sign-in, and fallback aliases are random. The gap: the sign-in alias is free text, so a real name fits. |
| Performance on Chromebooks | **Weak** | One 3.1 MB bundle, 275 KB of CSS, 15,074-line `main.js`. Heavy main-thread stalls under throttle (details below). |
| Phone layout (412) | **Mixed** | Bars take about 23 % of the height in 4 rows. Hotbar slot 9 is clipped. The Suit chip sits on the joystick. Survival and Creative show icons only. |
| Tests | **Weak, improving** | 21/47 pass. About half the reds are the harness or stale expectations (BN-01 to BN-06). |
| Ship pipeline | **Mixed** | Work ships through backlog branches and the PRs it carried stay open: 19 were open after shipping on Nov 1, now closed. |

## Findings by area

### 1. Light-sensitive safety and motion
- **Hub settings are never applied (root issue).**
  - Bertopia never loads `/shared/kulibert-prefs.js`. Only the language is read from the stored prefs: `main.js:652–656` and `kulibert-bar.js:552–557`.
  - So nothing sets `data-kp-motion`, `data-kp-contrast` or `data-kp-sound`. Every `html[data-kp-motion="less"]` and `data-kp-contrast` rule in `index.html` and `read.css` is dead code here.
  - A light-sensitive kid who picked "less motion" in the Hub gets full motion in Bertopia unless their OS is also set.
- **The tree-chop shake moves the whole 3D view.** It runs ±3 px for 180 ms on every hit (`main.js:2857`, `index.html:261`). It has no reduced-motion guard.
- **Reduced motion is read once at load** (`main.js:175`). Changing the OS setting mid-game does nothing, and there is no in-game motion switch.
- **The void-rescue `#poof`** is a 240 ms teal wash at .45 alpha. Under reduced motion it becomes a flat tint (`index.html:361–368`); hide it instead.
- **Done well:** walk bob, camera auto-turn, the pick ring, drop spin, the low-suit pulse, lever tilt and crafting effects all honour reduced motion. Teal glows are flattened by `read.css:116–172`.
- **Brightness:** the first view is pale fog, but not near-white. Mean brightness is 130/255, and under 3 % of pixels are near white. That's fine.

### 2. Deaf/HH, reading time and colour
- Every sound has a visible partner: the door and lever click with a state change and toast, the "nice" chime with a toast, the shop tone with a pop. Robot warnings are text ("Rustbot nearby", "Sparkbugs!") with a live region.
- **Toasts are short:** 1.5 s for "nice", 2.4 s for plain ones, 2 s for chips (`hud-calm.js:152`). A Deaf/HH kid who depends on the text, or a kid reading in a second language, can miss a robot warning.
- **The "Bonked" card closes itself after 5 s** (`main.js:603`). It should wait for the button.
- Colour never carries meaning alone in the states checked. One thing can't be told from the source: whether powered and unpowered wires differ by more than colour. Check this on screen.

### 3. Text and targets
- **Too small:** the crafting result label is 8 px (`index.html:414`) and the empty station slot label is 9 px (`index.html:960`). The touch bag label and version tag are 10 px. Tool labels, the need count and the wall caption are 11 px.
- **Too short:** the day clock is a 36 px button at 1366 and 1024 (`index.html:105`). At 915 the Undo label is clipped (BN-07).
- **Fine:** contrast. The muted text (`#9fb0c6` on `#0B1220`) is about 8:1.

### 4. Languages
- **Missing:** 9 keys are absent in uk, ru, es, ar, fa-AF, rw and ti alike, so those players see English: `rustbotNear`, `slam`, `zap`, `rebooted`, `scrapperTook`, `badgeGot`, `dexPage`, `select` and `option`. The first five are the robot moments.
- **Silent fallback:** `t()` falls back to English with only a console warning (`main.js:721–729`).
- **English-only sync chip:** the whole sync chip is English and skips `t()`: "Saved to school", "Not saved" and "Try again". It also uses `window.alert` for its explanations (`sync-chip.js:36–45, 105`).
- **Simple** has 232 of 1,096 keys and falls back to plain English for the rest. Is that the intent? See question 1.

### 5. Kid data and safety
- **No chat in the source.** The class server is off (`classnet/config.js:1`). Sync runs only with `?sync=1` and a verified sign-in. localStorage holds prefs, hints and world ids, and fallback aliases are random.
- **Gap:** the sign-in alias is free text (`shared/kw-who.js:11`): any letters, up to 16 characters. A kid can type a full real name, and it then travels with drops and world saves. The score boards already use a word-list alias (Adjective + Animal + Number); the sign-in alias should too.

### 6. Performance on Chromebooks
This container draws WebGL in software, so its frame rates are not a Chromebook's. Load time, memory, script size and main-thread stalls do carry over.

| | 1366, CPU x1 | 1366, CPU x4 | 412, CPU x1 | 412, CPU x4 |
|---|---|---|---|---|
| Page load | 1.4 s | 3.7 s | 0.8 s | 3.5 s |
| Main-thread stalls > 50 ms (first ~11 s) | 13 | 200 | 11 | 203 |
| Worst stall | 0.6 s | 2.1 s | 0.4 s | 2.1 s |
| JS heap | 23 MB | 23 MB | 30 MB | 30 MB |

- **Script size:**
  - `app.js` is 3.1 MB, or 937 KB zipped, as one file.
  - `index.html` is 149 KB, mostly inline CSS, and `read.css` is 126 KB.
  - `changelog.js` (5,492 lines, 503 entries) is in the bundle on every load; B12 (a lazy changelog) is still open.
- **Source size:** 99 files and 52,951 lines. `main.js` alone is 15,074 lines, which makes every change risky and every review slow.
- **What we can't measure here:** real frame rate. The `?fps=1` frame budget panel has landed; one run on a low Chromebook at the Foundry and in town would give the real numbers for B47–B50.

### 7. The first minute and the phone layout
- **First screen at 1366:** the kid spawns facing open fog with "Get Planks · 0/4" and "Click to play". The tip says to chop the tree *in front of you*, but no tree is in view.
- **The top bar at 1366** shows the version twice ("Bertopia · …" in the shared bar and again in the game chip), plus two rows of controls before play.
- **At 412** (screenshot):
  - The bars take about 210 of 915 px in 4 rows: shared bar, practice chip, mode and clock, then Undo, Redo, Save and Back.
  - Survival and Creative lose their words and show icons only.
  - The Suit chip sits on top of the joystick ring.
  - The hotbar wraps the Bag (E) onto a second row, and slot 9 is cut off at the right edge.

### 8. Content and story
- **Strong systems:**
  - 55 recipes at hand, bench, oven, smelter, forge and fabricator;
  - 96 items;
  - 5 robot kinds: Rustbot, Keeper, Scrapper, Sparkbug and Foundry Overseer. Robots are rebooted, never killed, which fits the lore.
- **Gating is light:** 40 of 55 recipes have no tier gate, 7 sit at T4 and 6 at T5.
- **Thin world:**
  - `biomeAt` returns only `forest` (1–6 blocks from a tree trunk) or `plains`, so there are no named places yet.
  - 6 of 20 Maker Pages are wired (pages 1, 2, 3, 4, 5 and 10).
  - Landmarks, biome names and the Coreplate line are the lore track (BN-16 to BN-19 and L07).

### 9. Tests and the ship pipeline
- **Tests:** main passes 21 of 47 checks. #140 and #141 fix the harness and the check-code bugs. BN-03 (the click-into-play helper) is next, then BN-06 (a runner that only flags new reds).
- **Ship flow:** work ships inside backlog integration branches, and the PRs it carries stay open. 19 such PRs were open after shipping on Nov 1, and all are closed now with pointers. Suggestion: each ship PR's body lists `Closes #N` for every PR it carries, so GitHub closes them on merge.
- **Open lanes, untouched here:**
  - personal host, adults only: #122–#127, #132, #133, #136;
  - class-room server and item transport: #102, #107, #109, #111, #113, #119, #120;
  - Bridge Rush prototype #91;
  - parked look #103;
  - #62, which needs ManagerBot's look.

## Priorities

Ranked by harm to kids, then cost. Items 1–8 are new briefs. Each brief does at most 3 fixes and follows the standing rules: 9 languages (EN + Simple + 7), icon + text, 44 px, keyboard and touch, no flash.

| # | New ID | What | Why first | Diego GO? |
|---|---|---|---|---|
| 1 | **BN-21** | **Hub settings reach Bertopia.** Fix 1: load `kulibert-prefs.js`, so Hub motion, contrast and sound apply. Fix 2: read reduced motion live, not once at load. Fix 3: the chop shake and `#poof` are skipped under less motion. | Light-sensitive kids lose the setting they chose. | no (makes existing settings work) |
| 2 | **BN-22** | **The 9 missing keys and the sync chip in all languages.** Fix 1: the 9 keys go to WordBot for 7 languages. Fix 2: the sync chip strings go through `t()`. Fix 3: its `alert` becomes an in-game card. | Robot warnings show in English to non-English kids. | no (WordBot writes the words) |
| 3 | **BN-23** | **Reading time.** Fix 1: warning and robot toasts last at least 4 s, or until the kid acts. Fix 2: other toasts last at least 3 s. Fix 3: Bonked waits for its button. | Deaf/HH kids and second-language readers miss warnings. | no |
| 4 | **BN-24** | **Word-list alias at sign-in.** The same Adjective + Animal + Number picker the boards use, in place of free text. Existing free-text aliases keep working until the kid picks one. | A real name can ride along in saves and drops. | **yes** (sign-in change, shared bar) |
| 5 | **BN-25** | **Phone layout at 412.** Fix 1: the top area is at most about 140 px, in at most 3 rows (fold Undo, Redo and Save into one menu chip). Fix 2: all 9 hotbar slots are visible, with nothing clipped. Fix 3: the Suit chip is clear of the joystick. Survival and Creative keep a short word. | Phones and small Chromebooks lose a quarter of the screen and slot 9. | **yes** (layout) |
| 6 | **BN-26** | **12 px text floor.** Every label is at least 12 px, and item names at least 14 px. Re-check the 8, 9, 10 and 11 px rules at 1366 and 412. Pairs with BN-07. | Low-vision kids can't read the craft result. | no |
| 7 | **BN-27** | **First minute faces the tree.** Spawn the camera facing the starter tree. "Get Planks" shows only once a tree is in view, otherwise "Turn to find a tree". The version is shown once. | The first goal points at nothing. | **yes** (first-run change) |
| 8 | **BN-28** | **Lazy changelog and the first split.** This is B12 now: keep the last 10 entries, fetch the rest when the panel opens, and target at least 350 KB off the bundle. Then measure with `?fps=1` on a real low Chromebook. | Every kid downloads 503 changelog entries on every load. | no |
| 9 | BN-03, BN-06 | Click-into-play helper, then the new-reds-only runner. | Until then, ShipCheck reds can't be trusted. | no |
| 10 | — | **Ship PRs list `Closes #N`.** A process change for ManagerBot. | Stops shipped PRs piling up again. | no |

**After these:** the lore track (BN-16 to BN-19, with GO), worldgen biomes (L07) and the `main.js` split. The split pays back every later brief, but it needs green tests first.

## Questions for Diego

1. **Simple language:** 232 of 1,096 keys have a Simple version, and the rest show plain English. Should Simple cover everything a kid reads in the first hour, or only the help and tips?
2. **BN-24:** OK to replace the free-text sign-in alias with the word-list picker?
3. **BN-25 and BN-27:** GO for the phone top-area change and for "spawn facing the tree"?
4. **Real Chromebook numbers:** can one class Chromebook run `?fps=1` for two minutes, in town and at the Foundry, and send the panel's numbers?

## Added later on Nov 1 (while writing the fix briefs)

The full briefs are in `claude/BERTOPIA-FIX-BRIEFS-BN21-28.md`.

- **The in-game High Contrast and Gentle Mode switches do nothing.**
  - High Contrast sets `html[data-a11y=contrast]`, but no CSS uses it.
  - Gentle saves `gentle: true` (`learn.js:358`), but nothing reads it.
  - Neither tile shows on or off.
  - Fixed in BN-21.
- **The save chip explains itself with `window.alert`,** a bright white system dialog that also breaks full screen. Fixed in BN-22.
- **Bars by screen, measured:** 14 % of the height at 1366, 23 % at 412, **33 % at 360 (one hotbar slot off-screen)** and **41 % on a sideways phone (915x412)**. Hotbar slots on touch are 36 px wide. Fixed in BN-25.
- **Where the free-text alias comes from:** the Hub's own "Your alias" box. The TechWorks sign-in alias comes from TechWorks and is fine. BN-24 is a Hub-lane change.
- **The first view already tries to face the tree** (`faceFirstSpawn`) and misses at 1366, so BN-27 is a bug fix.
- **What's in the bundle:** `changelog.js` is 563 KB (18 %) of `app.js`, and `strings-extra.js` is 352 KB with 515 old "What's new" copies (BN-28).
