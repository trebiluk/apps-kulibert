# Bertopia briefs: the list (BN-01 to BN-36)

**Start here.** This is the one list of open Bertopia work, for any chat or crew member picking up a brief. Each brief's full text (what the code does today with file:line, what to check first, fixes, files, strings and acceptance) is in the doc named in the **Doc** column. Line numbers were checked on main `eff87159` (Nov 1 2026). Re-check them before you start; main moves.

| Doc | What it holds |
|---|---|
| [NEXT-20-BRIEFS.md](NEXT-20-BRIEFS.md) | BN-01 to BN-20, plus Diego's answers and the PR cleanup log |
| [FULL-EVAL.md](FULL-EVAL.md) | The whole-game evaluation behind BN-21 to BN-28 |
| [FIX-BRIEFS-BN21-28.md](FIX-BRIEFS-BN21-28.md) | BN-21 to BN-28 in full |
| [MENUS-AND-STYLE-EVAL.md](MENUS-AND-STYLE-EVAL.md) | The menus and style evaluation, plus BN-29 to BN-36 |

These docs also live in the Kulibert claude.ai project under `claude/BERTOPIA-*.md`; links there to `claude/…` mean these files. Older series: B01–B50 (`claude/BERTOPIA-NEXT-50-BRIEFS.md`, project only) and the lore track L01–L12 ([blocks/docs/BERTOPIA-LORE-EVAL.md](../../blocks/docs/BERTOPIA-LORE-EVAL.md)).

## Rules for every brief

- **Scope:** at most 3 fixes and about 5 files per PR. Version files don't count.
- **Versions:** don't stamp one. ManagerBot locks it.
- **Branches:** never push to main.
- **Screens:** check at 1366x768, 412x915, 915x412 sideways and 360x640.
- **Controls:** 44 px targets, the visible focus ring, icon + text, keyboard and touch.
- **Light-sensitive safe:** no colour-only meaning, no sound-only cues, no neon or glow, no white flash. Reduced motion is honoured (Diego is light-sensitive).
- **Strings:** new strings go in all 9 blocks (en, simple, uk, ru, es, ar, fa-AF, rw, ti). WordBot writes the words, and nobody rewords existing strings.
- **Kids' data:** aliases only, no PII, no new network calls without a GO.
- **Bundles:** source only in the PR. Built bundles are rebuilt at ship time. Say "rebuild pending" in the PR.
- **Proof:** screenshots at 1366 and 412 in the PR. Run the checks in `bloxbert-src/tools` and report a before/after pass count against main.
- **Diego GO:** a brief marked **GO needed** waits for Diego. One marked **GO** has it.

## The list

Status key: **open** (nobody has it), **PR #n** (in review), **done**, **hold**.

### Phase 1: make the checks tell the truth (test-only)

| ID | Brief | Status | Diego GO | Doc |
|---|---|---|---|---|
| BN-01 | Harness boot: `CHROME_PATH` first, checks serve themselves, gfx4 writes its baseline | **PR #140** | not needed | NEXT-20 |
| BN-02 | Check code bugs: furniture-tap string, Node 22 JSON imports, circuits version | **PR #141** | not needed | NEXT-20 |
| BN-03 | One click-into-play helper for the place/break checks | open (next) | not needed | NEXT-20 |
| BN-04 | Stale expectations + wheat drops wheat only when mature | open | **GO** (wheat rule) | NEXT-20 |
| BN-05 | Worldgen goldens re-baselined after snow and red sand | open | not needed | NEXT-20 |
| BN-06 | One check runner that flags only new reds | open | not needed | NEXT-20 |

### Phase 2: kid-facing fixes the checks found

| ID | Brief | Status | Diego GO | Doc |
|---|---|---|---|---|
| BN-07 | Top bar targets: day clock to 44 px, Undo label at 915 | open | not needed | NEXT-20 |
| BN-08 | `#top` dead lookups (`main.js`, `panels.js`, `tips.js`) | open | not needed | NEXT-20 |
| BN-09 | Path tip sticks; X dismiss not remembered | open (check after BN-03) | not needed | NEXT-20 |
| BN-10 | Flowers and ferns: no drop, low hit box | open (check after BN-03) | not needed | NEXT-20 |
| BN-11 | Farming in a pack world; send-home mid-task | open (check after BN-03) | not needed | NEXT-20 |
| BN-12 | Tool and item durability you can see | open | **GO** | NEXT-20 |
| BN-13 | Lamp glow: only the shade glows | open | not needed | NEXT-20 |
| BN-14 | Blank hand and hotbar icons on touch | open | not needed | NEXT-20 |
| BN-15 | Step up 1-block hills (auto-climb off for a fresh profile?) | open | not needed | NEXT-20 |

### Phase 3: story (lore track)

| ID | Brief | Status | Diego GO | Doc |
|---|---|---|---|---|
| BN-16 | L03: "Welcome to the Verge" card + Help glossary | open | **GO** (appropriate lore) | NEXT-20 |
| BN-17 | L05: Coreplate line | open | **GO** (appropriate lore) | NEXT-20 |
| BN-18 | L04: Sleeping Foundry Site Card + Page 9 | open | **GO** (appropriate lore) | NEXT-20 |
| BN-19 | L06: Bertodex fill-in (after Curriculum fact pass) | open | **GO** (appropriate lore) | NEXT-20 |

### Phase 4: crew

| ID | Brief | Status | Diego GO | Doc |
|---|---|---|---|---|
| BN-20 | Close PRs that already shipped | **done** (19 closed Nov 1); #62 needs a look | **GO** | NEXT-20 |

### From the full evaluation

| ID | Brief | Status | Diego GO | Doc |
|---|---|---|---|---|
| BN-21 | Hub motion, contrast and sound settings work in Bertopia; in-game Gentle and High Contrast become real | open (**send first**) | not needed | FIX-BRIEFS |
| BN-22 | Robot warnings and the save chip in every language; no browser alert | open | not needed | FIX-BRIEFS |
| BN-23 | Messages stay up long enough to read; Bonked waits | open | not needed | FIX-BRIEFS |
| BN-24 | Word-list alias in the Hub (Hub lane) | open | **GO needed** | FIX-BRIEFS |
| BN-25 | Phone and sideways layout (bars 41 % on a sideways phone) | open | **GO needed** | FIX-BRIEFS |
| BN-26 | 12 px text floor (13 rules) | open | not needed | FIX-BRIEFS |
| BN-27 | First view shows the starter tree | open | aim fix not needed; "Turn to find a tree" line **GO needed** | FIX-BRIEFS |
| BN-28 | Lazy changelog (563 KB, 18 % of the bundle) | open | not needed | FIX-BRIEFS |

### From the menus and style evaluation

| ID | Brief | Status | Diego GO | Doc |
|---|---|---|---|---|
| BN-29 | One panel type, Locked tiles, "◀ Back" | open (first of these) | not needed | MENUS |
| BN-30 | Trim the menu to 15 tiles | open | **GO** | MENUS |
| BN-31 | One Settings (Accessibility inside it) | open (with or after BN-21) | **GO** | MENUS |
| BN-32 | Wording pass (hide Start Cogs from kids) | open | not needed | MENUS |
| BN-33 | Help by device, grouped tips | open | not needed | MENUS |
| BN-34 | Crafting on a phone | open | not needed | MENUS |
| BN-35 | Style tokens | **hold** (fix 3); fixes 1–2 can go | colour rule **not approved** | MENUS |
| BN-36 | Shop and main menu on a phone | open | not needed | MENUS |

## Suggested order

1. **Checks first:** BN-03 → BN-06. Merge #140 and #141 first.
2. **Kid safety:** BN-21 → BN-22 → BN-23 → BN-26.
3. **Fixes and speed:** BN-29 → BN-27 → BN-28 → BN-07 → BN-08.
4. **The GO'd features:** BN-12, BN-30, BN-31 (with BN-21), BN-04.
5. **Re-check after BN-03:** run the check-first briefs BN-09 to BN-11 and BN-15 again.
6. **Waiting on a GO:** BN-24, BN-25 and BN-27's new line.
7. **Story:** BN-16 → BN-17 → BN-18 → BN-19.
8. **Last:** BN-35, once the layout settles.

## Open questions for Diego

1. **BN-24:** replace the Hub's free-text alias box with the word-list picker?
2. **BN-25:** fold Undo, Redo, Save and Back to the Hub into one "More" chip on phones and sideways?
3. **BN-27:** OK to add the "Turn to find a tree" line?
4. **BN-35:** what colour rule do you want for "selected" and "focus"?
5. **Simple language:** should Simple cover the first hour of play, or only help and tips?
6. **Real numbers:** can one class Chromebook run `?fps=1` in town and at the Foundry?

## Keeping this list current

When you pick up a brief, set its status to your PR number in this file, in the same PR. When it merges, set it to **done**. Add new briefs at the end as BN-37 and up, with the doc that holds their full text.
