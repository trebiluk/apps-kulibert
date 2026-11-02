# Bertopia: the next 20 dev briefs (plan only)

Written 2026-11-01 for ManagerBot. Plan only, no code; ManagerBot locks the version for each brief.

These briefs come from running every check in `bloxbert-src/tools` on current main (`d1280540`, with the Maker Pages and decor pickup work in). Each check ran against a freshly built bundle. The new IDs are **BN-01 to BN-20**, so they don't clash with B01–B50 (`claude/BERTOPIA-NEXT-50-BRIEFS.md`) or L01–L12 (`claude/BERTOPIA-LORE-EVAL.md`).

**Main passes 21 of 47 checks today.** About half of the 26 reds are the harness or stale expectations, not the game. Until those are fixed, a red from ShipCheck can't tell a real bug from a broken check. So Phase 1 makes the checks tell the truth, and Phase 2 fixes what is still red after that.

**Every brief follows these rules.** Each brief does at most 3 fixes and touches about 5 files.
- **Screens:** must work at 1366x768, 412 upright and 915x412 sideways.
- **Controls:** 44 px targets, a visible focus ring, icon plus text, keyboard and touch.
- **No colour-only or sound-only cues:** colour never carries meaning alone, and every sound has a visual.
- **Light-sensitive safe:** reduced motion is honoured. No neon, glow, strobe or white flash (Diego is light-sensitive).
- **Strings:** any new string goes in all 9 blocks (EN, Simple, uk, ru, es, ar, fa-AF, rw, ti). WordBot owns the wording; non-English strings are drafts.
- **Kids' data:** aliases only, no PII.
- **Built bundles:** a brief changes source; the bundles are rebuilt at ship time.

## Phase 1: make the checks tell the truth

| ID | Goal | Files | Risk | Depends on | Diego GO? |
|---|---|---|---|---|---|
| BN-01 | **Harness boot.** Fix 1: every browser check takes `CHROME_PATH` first; `move-check` only knows two fixed Chrome paths and fails with "no chrome". Fix 2: `fresh-check` and `reload-check` start their own static server like the other checks; today they need one already running on 8873/8875. Fix 3: `gfx4-check` writes `/tmp/gfx4-baseline.json` on its first run instead of crashing when the file is missing. | tools/move-check.mjs, fresh-check.mjs, reload-check.mjs, gfx4-check.mjs, new tools/lib/browser.mjs | L | none | no (test-only) |
| BN-02 | **Check code bugs.** Fix 1: `furniture-tap-check.mjs:495` has an unclosed string, so the check never runs. Fix 2: `rules-check` and `session-check` crash on Node 22 with `ERR_IMPORT_ATTRIBUTE_MISSING`, because `src/icons.js` imports `sheet.json` without an import attribute. Bundle them through esbuild the way the game build does, and leave the game's imports alone. Fix 3: `circuits-check` reads the expected version from `package.json`, not a hard-coded number. | tools/furniture-tap-check.mjs, rules-check.mjs, session-check.mjs, circuits-check.mjs | L | none | no (test-only) |
| BN-03 | **One "click into play" helper.** Since `df9a1a61`, a desktop kid's first click only grabs the mouse. #112 taught `decor-check` that, and it went green. Five more checks never learned it, so their place, break and hoe calls return 0: `interact`, `flora-fix`, `circuits`, `pack-save` and `qol`. Fix 1: move `enterPlay()` into `tools/lib/play.mjs`. Fix 2: use it in those five checks. Fix 3: list what is *still* red afterwards; those reds are the real bugs for Phase 2. | tools/lib/play.mjs (new), interact-check, flora-fix-check, circuits-check, pack-save-check, qol-check | L | none | no (test-only) |
| BN-04 | **Stale expectations, plus Diego's wheat rule.** Fix 1: `craft-check` wants a cupcake in "Show all", but `craft.js:88` puts it in "almost" on purpose; update the check. Fix 2: **wheat drops wheat only when it is mature** (Diego, Nov 1). Harvesting already checks ripeness (`main.js` `isRipe` / `CROP[3]`). Make plain *breaking* follow the same rule. Ripe gives wheat plus seeds, as harvest does today. Unripe gives no wheat; the proposal is the planted seed back, so nothing is lost. `path-check` then expects wheat for the ripe block (not flour) and no wheat for the sprout, leafy and tall stages. Fix 3: `hand-hints-check` pins an old copy of the `pathTree` tip. Check instead that all 9 languages exist, are non-empty and differ from EN, so WordBot can reword freely. | tools/craft-check.mjs, path-check.mjs, hand-hints-check.mjs, src/data/items.js (dropOf for crop stages), src/main.js | L | none | ✅ GO (wheat rule); "seed back on unripe" is the proposal, flag it in the PR |
| BN-05 | **Worldgen goldens.** `gen-g3`, `gen-g4`, `flora-p1` and `flora-p2` all fail on the same chunk 0,0 hash (`dc24732d…`). Fix 1: regenerate at #94's parent and at #94 to confirm the snow and red sand worldgen is the only cause. Fix 2: re-baseline with a script that prints old → new and the reason. Fix 3: chunk generation time per chunk stays within 5 %. | tools/gen-g3-check.mjs, gen-g4-check.mjs, flora-p1-check.mjs, flora-p2-check.mjs, tools/rebaseline-gen.mjs (new) | L | none | no (test-only) |
| BN-06 | **One runner that reports the change.** `node tools/run-checks.mjs` runs every check one after another (they share fixed ports). It prints a PASS/FAIL table and compares it with a committed `tools/known-fails.json`. It exits non-zero only on a **new** red, and ShipCheck pastes that table into the PR. This replaces the hand comparisons done for #108, #110 and #112. | tools/run-checks.mjs (new), tools/known-fails.json (new), README section | M | BN-01, BN-02 | no (test-only) |

## Phase 2: kid-facing fixes the checks found

"Check first" means re-run the check after BN-03. If it goes green, the brief is closed with a note; if it stays red, fix it.

| ID | Goal | Files | Risk | Depends on | Diego GO? |
|---|---|---|---|---|---|
| BN-07 | **Top bar targets.** Fix 1: the day clock is a button, but it is 36 px tall at 1366 and 1024. The 36 px chip rule is `index.html:105`, and only the narrow-screen rule lifts it to 48; make it at least 44. Fix 2: at 915 the Undo label is clipped to 34 px. Fix 3: at 915 the top bar breaks onto two rows; keep it on one row, or allow two rows and update the check. | index.html, src/read.css, tools/topbar-check.mjs | L | none | no (meets the 44 px rule) |
| BN-08 | **The `#top` dead lookups.** No element has `id="top"`; the HUD is `header.top`. Three places look for `#top` and so do nothing: `main.js:539`, `panels.js:136` (the World-panel-on-phones rule from #110) and `tips.js:198`. Point each one at `header.top` or delete it. At 412, no panel title, Close or tip sits under the HUD. | src/main.js, src/panels.js, src/tips.js | L | #110 lands | no (makes the existing rule work) |
| BN-09 | **Path tip sticks.** The checks see "Get Planks · 0/4" stay up: it never fades, and the next tip never comes. Closing the tip with X on touch is not remembered after a reload. Check first. | src/tips.js, src/learn.js, tools/polish-check.mjs | L | BN-03 | no |
| BN-10 | **Flowers and ferns.** A daisy or fern gives no drop when broken, and the flower's hit box sits low. Check first. If it is real, fix `packDrop` for the flora pack and the flower hit box. | src/data/items.js, src/gfx/packs.js, src/main.js (aim box) | M | BN-03 | no |
| BN-11 | **Farming in a pack world.** The hoe makes no farmland, and seeds say "You cannot place that." Mid-task the player is sent home ("Poof! Back at Bertyville."). Check first, and find out why the send-home fires during normal farming. | src/session.js, src/main.js, tools/pack-save-check.mjs | M | BN-03 | no |
| BN-12 | **Tool and item durability you can see** (Diego: yes, Nov 1). The wear bar exists (`slots-bridge.js:730`, `session.js:3012`), but it is only drawn when the item-facts tooltip (`fillFacts`) is absent. Since item facts arrived, it never shows: that is the regression `qol-check` catches. Fix 1: the tooltip always shows the bar *and* the words "12 of 40 uses left", so it's not colour alone. Fix 2: every item with uses (pickaxes, axe, hoe, shears and any other item `toolLife` covers) shows a thin wear bar on its hotbar and Bag slot once worn. Near the end, the slot gets a crack icon at 25 % left, not a colour change. Fix 3: when a tool wears out, a calm toast "Wood Pickaxe wore out" (icon + text, no sound-only cue), and the slot empties. Shift+click from the Bag to the hotbar is checked after BN-03 and fixed only if it is still broken. | src/slots-bridge.js, src/session.js, src/main.js (toolLife), index.html (wear styles), src/strings-extra.js, tools/qol-check.mjs | M | BN-03 | ✅ GO |
| BN-13 | **Lamp glow.** On the lamp, both the body and the shade glow; only the shade should. Fix the lamp materials, and dimmer is the safe direction. | src/stations.js (lamp), src/gfx/*, tools/polish-check.mjs | L | none | no (restores the approved look) |
| BN-14 | **Blank icons on touch.** This is B38 with evidence: flat bread draws 0 % pixels in the touch hand, the berry hotbar icon scores 0.227 on the readability check, and the door block icon misses its fill. `drawPackIcon` waits for the sheet before drawing, and empty icons get a placeholder outline (shape, not colour). | src/icons.js, src/gfx/packs.js, src/hands.js, tools/hands-check.mjs, archive-check.mjs | M | none | no |
| BN-15 | **Step up 1-block hills.** The walk test sees no climb on a 1-block step, and walking on a hill slows to 0.22. Check first with `move-check` (which runs once BN-01 lands). If auto-step is broken, find the line and fix it. | src/main.js (movement), tools/move-check.mjs | M | BN-01 | no |

## Phase 3: the next story pieces (lore track)

These follow the order in `claude/BERTOPIA-LORE-EVAL.md`. L01 and L02 are in.

**Diego's GO (Nov 1) is for "appropriate lore".** Each piece must keep LORE.md's tone rules: no menace, nothing medieval, no borrowed words from other block games, and seasons, not holidays. Robots are "lost, not angry". Each science line is real and checked by Curriculum before merge. A line that fails either test is cut, not reworded in the PR.

| ID | Goal | Files | Risk | Depends on | Diego GO? |
|---|---|---|---|---|---|
| BN-16 | **L03: name the land.** A one-time welcome card on a kid's first world load, "Welcome to the Verge, Engineer": icon + text, a 44 px close button, remembered per kid. The glossary words go in the Help panel. | src/learn.js, src/panels.js, src/strings-extra.js | L | none | ✅ GO (appropriate lore) |
| BN-17 | **L05: the Coreplate line.** The first time a kid stands on the Coreplate, show its lore line and its science line, once. Use the existing 10 Hz check; add no new tick. | src/learn.js, src/main.js, src/strings-extra.js | L | none | ✅ GO (appropriate lore) |
| BN-18 | **L04: Sleeping Foundry.** A Site Card when a kid first reaches the Console, and Maker Page 9 on the first Overseer reboot. | src/foundry.js, src/learn.js, src/strings-extra.js | M | none | ✅ GO (appropriate lore) |
| BN-19 | **L06: Bertodex fill-in.** Real-science facts for every rebootable bot, plus blocks seen (glass, iron, coal). Use the wiki entry pattern. | src/learn.js (openDex), src/strings-extra.js | M | Curriculum fact pass | ✅ GO (appropriate lore) |

## Phase 4: crew work

| ID | Goal | Files | Risk | Depends on | Diego GO? |
|---|---|---|---|---|---|
| BN-20 | **Open PR backlog.** About 25 Bertopia PRs are open, and many are superseded by later merges (for example #84, #87, #89, #97, #98 and #100). Make one table on the crew board, with one row per PR and one of three outcomes: *done elsewhere* (close with a pointer), *still wanted* (refresh like #108 and #110) or *parked* (#103 stays). #108 and #110 are already refreshed and wait on a rebuild. | crew board only | L | none | ✅ GO (Diego, Nov 1); started the same day, see the table below |

**Not in these 20, on purpose:**
- **Personal host lane (#122–#136).** It has its own lane and design (adults 18+, non-school).
- **Item transport on the server (#107, #109, #111).** That is the server lane.
- **B-series Phase 2 server work (B16–B25).** It waits on the server tick.
- **Biome chip (L07) and hidden pages (L09).** They come after L03–L06.

## Send first: BN-01, BN-02, BN-03, BN-06, BN-07, BN-08

These six are cheap and turn ShipCheck's reds into real signal. They also fix the two layout faults already confirmed in the source.

### Acceptance checks

Every brief in this section also needs these:
- 0 app console errors in every run.
- Checks run one at a time (fixed ports). Each PR carries the before/after PASS/FAIL table against main `d1280540`: 21/47.
- Test-only briefs change no file under `src/`, `index.html` or the built bundles.

**BN-01: harness boot**
- With only `CHROME_PATH` set, `move-check` launches.
- `fresh-check` and `reload-check` pass or fail on their own merits with no server started first.
- `gfx4-check` run twice: the first run writes the baseline, and the second compares against it.

**BN-02: check code bugs**
- `node --check tools/furniture-tap-check.mjs` passes, and the check runs to its own PASS/FAIL lines.
- `rules-check` and `session-check` run on Node 22 with no import error, and `src/icons.js` is unchanged.
- `circuits-check` no longer fails on "version".

**BN-03: click into play**
- The five checks call `enterPlay()` from `tools/lib/play.mjs`, and `decor-check` uses the same helper and stays green.
- The PR lists, for each of the five, which lines turned green and which stayed red. The ones that stay red open BN-09 to BN-12.

**BN-06: one runner**
- `node tools/run-checks.mjs` on main prints 47 rows and exits 0 against `known-fails.json`.
- Break one passing check on purpose: the runner exits 1 and names it.
- A check that leaves `known-fails.json` (turns green) is reported as "fixed", not as a failure.

**BN-07: top bar targets**
- At 1366 and 1024, `#day-clock` is at least 44 px tall and keeps its focus ring.
- At 915, Undo shows its full label, and the bar is one row (or the check is updated to two rows, with the reason).
- At 412 the top bar is unchanged: pixel-identical except the clock.
- `topbar-check` passes. The "navy bar" colour line is checked against the current theme and updated if the theme changed on purpose.

**BN-08: `#top` dead lookups**
- `grep -n "getElementById('top')" src` returns nothing.
- At 412, open World, Menu, Settings and Notebook in turn. No title or Close is under the HUD or the shared bar, and resizing with a panel open re-measures it.
- At 1366, nothing moves compared with main.
- A path tip at 412 never sits under the HUD.

## Diego's answers (Nov 1)

1. **Wheat:** breaking wheat drops wheat only when it is mature, which goes into BN-04. Giving the seed back for an unripe crop is still a proposal.
2. **Durability:** yes, tool and item durability, which goes into BN-12 with GO.
3. **Lore:** GO on appropriate lore, which covers BN-16 to BN-19 under the tone rules above.
4. **PRs:** yes, close the superseded ones, which is BN-20.

## BN-20 status (done Nov 1)

**Closed: 16 PRs already in main.** Each PR's head commit is in main's history (`git merge-base --is-ancestor` is true). Each one landed through the Bertopia backlog branch, and each got a comment naming the merge commit:

> #64, #67, #69, #72, #74, #75, #76, #77, #82, #84, #87, #89, #95, #97, #98, #100.

Three of them were briefs in the next-50 plan, so those briefs are done: B10 (drop cap, #97), B46 (frame budget panel, #100) and the hotbar fit for small phones (#98).

**Left open:**

| PR | Why | Next |
|---|---|---|
| #62 (backoff) | All its own commits are in main, but its refresh merge adds about 1,000 lines that main doesn't have. It can't be proven done. | ManagerBot reviews the merge diff, then closes it or refreshes it. |
| #91 (Bridge Rush prototype) | 9 commits not in main. This is B07. | Keep. Refresh when B07 is scheduled. |
| #103 (Mystical default look) | Parked by Diego. | Leave. |
| #108, #110 | Refreshed against main and waiting on a rebuild. | Ship. |
| #128 (water flows, painter, phone polish) | Recent ship branch. | Ship lane. |
| Personal host PRs (#122–#127, #132, #133, #136) and class-room server PRs (#102, #107, #109, #111, #113, #119, #120) | Other lanes. | Not touched. |

## Build status

- **BN-01:** PR #140, test-only. `move-check`, `fresh-check`, `reload-check` and `furniture-tap-check` now run with only `CHROME_PATH` set and no server started first. `gfx4-check` writes its own baseline.
- **BN-02:** PR #141, test-only.
  - `furniture-tap-check` parses again.
  - `session-check` passes.
  - `rules-check` runs to its own verdicts. Two stale expectations are left for review: the Building group now includes `tech.circuits`, and the World Rules tile has no ⚑.
  - `circuits-check` reads the version from `package.json`.
- **New evidence for BN-15:** with BN-01, `move-check` runs again. It reports `fresh climb default false` and `1-block ledge … on:false`, so auto-step looks off for a fresh profile. Confirm whether that's on purpose before fixing it.
