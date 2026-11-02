# Bertopia: menus and style evaluation

Nov 1 2026, for Diego and ManagerBot. This was checked on the live game at apps.kulibert.net/bertopia, at 1366x768 (Chromebook) and 412x915 (phone), with a fresh save.

- I opened every tile in the Menu and took a screenshot of what it opened.
- I measured every tile, button and text size. I traced odd strings back to the source.

No code changed for this review. It builds on `claude/BERTOPIA-FULL-EVAL.md`, and nothing already briefed there (BN-21 to BN-28) is repeated here. Where a finding overlaps with one of those briefs, it says which.

## Verdict

**What already works.** The menu bones are good:
- **Main menu:** one Menu with four labelled groups (Play, World, Make, Settings).
- **Tiles:** every tile is an icon plus a word and at least 64 px tall.
- **Fonts and slots:** the fonts are readable (Atkinson Hyperlegible for body text), and the bag uses dashed empty slots.
- **My Look:** a strong screen. Every colour chip has its name, the picked item has a ✓, and a "✓ Saved" chip confirms the change.

**What holds it back** is consistency, not missing features. The menus were built one at a time, and it shows:
- **Panels:** they open in four different ways.
- **Bars:** the game's top bar sometimes covers a panel and sometimes doesn't.
- **"Menu":** the word appears up to four times on screen at once.
- **Repeats:** two tiles open the same page.
- **Labels:** some tiles say something that means nothing to a kid ("Normal rules", "Start Cogs · 7:37 PM", "Turn off for sharper.").
- **Phone:** crafting is a scroll box inside a scroll box.

None of this is risky to fix, and most of it is deleting or merging.

## Scorecard

| Area | Grade | Why |
|---|---|---|
| Menu structure | **Good** | Four named groups, 20 tiles, Resume is the biggest button. But 20 tiles is a lot, and two of them are duplicates. |
| Panel consistency | **Weak** | Panels open as a sheet, a sheet under the top bar, a centred card, or just a toast. Each has its own size and layering. |
| Labels and wording | **Mixed** | Mostly plain. A handful are developer words or say nothing ("Normal rules", "Start Cogs", "Override"). Title Case and sentence case are mixed. |
| Visual style | **Mixed** | Three fonts plus emoji, two accent colours, three corner shapes, and decorative "tabs" that look clickable. |
| Targets and text size | **Good** | Tiles 64 px, sheet buttons 56 px. Three gaps: crafting Search is 36 px tall, Exit is squeezed to 44 px wide on a phone, and the touch key line in Help is 11 px. |
| On/off states | **Weak** | Accessibility tiles never show on or off (known, BN-21). Settings mixes three on/off patterns. |
| Phone (412) | **Weak** | The top bar shows above some panels and under others. Crafting needs two scroll areas. Half the main menu sits below the fold. |
| Light-sensitive safety | **Good** | Panels are dark (`#121a2b`). Nothing in the menus flashes. Screen brightness stayed at 54–129 out of 255, with under 1 % near-white pixels. |

## Findings

### 1. Panels open in four different ways

| Tile | What opens | Top bar |
|---|---|---|
| Inventory, Crafting, Notebook, Goals, Badges, Help, My Builds, World, Shop, Wallet, Accessibility, My Look, Changelog | Sheet with "☰ Menu" (back), a title and "✕ Close" | Hidden, but on tall sheets a **black slab** is left where the bar was (Notebook, Help) |
| Settings | Same sheet, but it sits **under** the top bar, which stays visible with Undo, Redo, Save and Back to the Hub | Shown |
| World Rules | A centred card with one line ("Normal rules") and "Got it". The game, Click to play and the goal pill stay lit behind it. | Shown |
| Build Wand (if you don't have one yet) | The menu closes and a toast says "Craft a Build Wand at the Workbench." | Shown |

**Why it matters:**
- A kid can't predict what a tile will do.
- The black slab looks broken.
- With Settings, Back to the Hub sits 40 px above the panel, which invites a mis-tap that leaves the game.

**Fix:** every tile opens the same sheet, at the same layer, above the top bar. A tile for something you don't have yet stays in the menu, shows a 🔒 icon plus the word "Locked", and says how to get it.

### 2. "Menu" is on screen up to four times

At 1366 with a sheet open, you can see:
1. the Hub bar's "☰ Menu" pill (top left);
2. the sheet's own "☰ Menu" back button;
3. the game's Menu button (when no sheet is open);
4. the touch "Menu" chip at 412.

The Hub one and the sheet one sit 60 px apart on a phone and do different things: one opens the Hub drawer, the other goes back to the Bertopia menu.

**Fix:**
- Rename the sheet's back button **"◀ Back"**. It goes back to the Bertopia menu.
- While a sheet is open, hide the Hub bar's Menu, or point it at the same Bertopia menu.

The Hub bar is Hub-owned (`shared/`). Hiding it while a sheet is open can be done from Bertopia's own CSS, the way TechWorks hides it on room screens.

### 3. Duplicates and dead ends in the menu

- **Notebook and Goals open the same page:** Today's Daily, the week's stars and the goal list. Keep one tile and call it **Goals**, the word the in-game "Goals" chip already uses.
- **Save and Mode are both in the Menu and in the top bar** (Save chip; Survival and Creative chips). Drop the two Menu tiles on desktop. Keep them on phone, where the top bar folds, or move Save into World next to Load and Export.
- **World Rules** shows only "Normal rules / Got it". It should say what the rules are, for example "Robots: on · Night: on · Others can build: off". If there's nothing to change, the tile belongs inside World, not on its own.
- **Changelog** gets a full Settings tile. Kids rarely need it. Move it to a small "What's new" link at the bottom of Help. This also pairs with BN-28 (lazy changelog).
- **Result:** 20 tiles become 15 on a laptop (17 on a phone, which keeps Save and Mode).

### 4. Wording a kid can't use

| Where | Now | Suggest |
|---|---|---|
| Settings, first line | "Turn off for sharper." | This is the hint for the Small textures switch, shown on its own above the Look section. Put it under that switch. |
| Wallet | "Start Cogs · 7:37 PM" | A teacher-side field shown to kids. **Decided: hide it from kids.** |
| Wallet | "Send To Teacher" | "Send to teacher" (sentence case like the rest), and say what it sends. |
| Shop | Sell, Buy, Prices, **Stick, Sapling, Berry · Sell ⚙ 1** in one grid | Actions and items are mixed. Put the three actions on top as tabs, and items in a list below, each with its price. |
| Crafting | "Override" (with an "Ok" icon), "Door (2 blocks…" | Check "Override" is meant to be kid-facing. Allow two lines for names so "Door (2 blocks tall)" fits. |
| My Look | Big heading "No hat" | The heading repeats the picked item. Use "My Look", or the part being edited ("Head"). |
| Help on a phone | "Press Esc any time to get your mouse back", "Press ? to see the keys again" | These are keyboard tips shown on touch. Show touch tips on touch, and keys on keyboard. |
| Help | 15 tips of equal weight in one column | Group them as Moving, Building, Crafting, Saving. The key line goes at the top as a key list, not one 11 px run-on line. |

### 5. Visual style

- **Fonts:** three fonts plus emoji.
  - Atkinson Hyperlegible is used for body text and tiles.
  - IBM Plex Mono is used for section heads ("Look", "Hotbar", "Goals") and My Look's values.
  - A pixel font is used for the BERTOPIA logo.
  - Emoji 🌐 and ⚙ sit beside the pixel icons. The cog is a pixel icon in the top bar but the ⚙ emoji in the Wallet and Shop.
  - **Suggest:** Atkinson for all text. Keep mono only for numbers that tick (clock, counts). Replace the emoji with the pixel icons the game already has.
- **Two accents.**
  - Orange is used for borders, the selected item and decorative tabs.
  - Teal is used for focus, the Search box, Today's Daily and the sheet edge on Crafting.
  - Both mean "selected" in different places: Look uses orange, My Look uses teal.
  - **Suggest:** orange means "selected / on", and teal means "keyboard focus" only.
- **Three corner shapes.**
  - Pills: Got it, Click to play, Change, OFF.
  - Rounded rectangles: tiles.
  - Near-square boxes: slots and top-bar chips.
  - **Suggest:** pills for single actions and rounded rectangles for tiles and panels. Slots stay square.
- **Decorative tabs.** Two short orange bars sit on top of every sheet, and "Hotbar" and "Pockets" sit in tab shapes. They look clickable but aren't. Remove the bars, and show Hotbar and Pockets as plain headings.
- **Settings Look row.** Classic Topia and Mystical Topia sit at opposite edges at 1366. Put them side by side, the same width.

### 6. On/off states

Settings uses three patterns for on/off:
- an orange outline (Mystical Topia, Small textures);
- a pill reading "OFF" (All caps, Dyslexia font);
- a ✓ on the right (Graphics).

Accessibility tiles show no state at all (BN-21 fixes the switches themselves).

**Suggest one pattern everywhere:** a switch row with the word **On** or **Off** and an icon (✓ or ○). The row is outlined when on, in whatever colour BN-35 settles on. Never use colour alone.

Also, Accessibility and Settings split one job between them. Dyslexia font and All caps are in Settings, while High Contrast, Gentle Mode and Brighter nights are in Accessibility. **Suggest:**
- One **Settings** sheet with sections: Language, Text and reading, Comfort (contrast, gentle, brighter nights, less motion), Look, Graphics, Controls.
- Keep the Accessibility tile as a shortcut that opens Settings at Comfort.

### 7. Phone (412)

- **Settings and World Rules sit under the game top bar.** The clock, hearts, Undo, Redo, Save and Back to the Hub stay visible above the panel and overlap its top edge (same root as finding 1).
- **Crafting is a scroll box inside a scroll box.** The recipe grid gets about two rows (the third is cut mid-label), and the detail pane scrolls below it.
  - **Suggest:** one column. Tap a recipe and the detail slides in as its own view with "◀ Recipes". Keep the category chips and Search fixed on top.
- **Main menu:** Exit is squeezed to 44x64 beside the logo. Make and Settings start below the fold. Put Exit on its own row with Close, and drop the logo row on phone (the top bar already says Bertopia). That brings Make into view.
- **Bag:** an empty slot is outlined in orange (the selected hotbar slot) with no word. Add "Holding" under the selected slot, or mark it with ▲ like the hotbar does.

### 8. Small things

- **Crafting Search** is 36 px tall. Make it 44.
- **Station marks on recipe tiles.** Each recipe tile carries a workbench or oven icon over the corner of the item icon, which hides part of the item. Put the station as a small labelled chip under the name ("Workbench").
- **Make vs Make all.** "Make" is greyed but "Make all" looks active when you can't make any. Grey both, and say why: "Need 1 Log".
- **Badges.** Each row shows "0 / 5" with no hint of how to earn it. Add one line each.

## Briefs

These continue after BN-28. Each brief does at most 3 fixes and follows the standing rules: 9 language blocks (EN + Simple + 7), icon plus text, 44 px, keyboard and touch, no flash, no meaning by colour alone. New words go to WordBot.

| # | ID | What | Diego GO? |
|---|---|---|---|
| 1 | **BN-29** | **One panel type.** Fix 1: every tile opens the sheet above the top bar (Settings and World Rules included), and the black slab goes. Fix 2: tiles for things you don't have show 🔒 "Locked" plus how to get it, instead of closing the menu. Fix 3: the sheet's back button says "◀ Back". | no |
| 2 | **BN-30** ✓ GO | **Trim the menu to 15 tiles.** Fix 1: merge Notebook into Goals. Fix 2: drop the Save and Mode tiles from the Menu on desktop (they stay in the top bar). Fix 3: move Changelog to a "What's new" link in Help, and fold World Rules into World with real rule lines. | **GO** (Nov 1) |
| 3 | **BN-31** ✓ GO | **One Settings.** Fix 1: Settings sections are Language, Text and reading, Comfort, Look, Graphics and Controls. Fix 2: the Accessibility tile opens Settings at Comfort. Fix 3: one on/off switch pattern (word plus icon plus outline) everywhere. Pairs with BN-21. | **GO** (Nov 1) |
| 4 | **BN-32** | **Wording pass.** Fix 1: the texture hint goes under its switch. Fix 2: Wallet's "Start Cogs" line is hidden from kids (teacher view only), and "Send to teacher" says what it sends. Fix 3: My Look's heading and the "Override" recipe name are checked and fixed. | no |
| 5 | **BN-33** | **Help by device.** Fix 1: touch players see touch tips, and keyboard players see keys. Fix 2: tips are grouped (Moving, Building, Crafting, Saving). Fix 3: the key line becomes a list at 14 px or larger. | no |
| 6 | **BN-34** | **Crafting on a phone.** Fix 1: one column, and a tapped recipe opens its own view with "◀ Recipes". Fix 2: the Search box is 44 px. Fix 3: the station shows as a labelled chip, not an icon over the item, and Make all greys out with a reason. | no |
| 7 | **BN-35** ⏸ ON HOLD | **Style tokens.** Fix 1: Atkinson for all text, with mono only for ticking numbers. Fix 2: emoji 🌐 and ⚙ become the game's pixel icons. Fix 3: orange means selected and teal means focus, and the decorative top bars and fake tabs go. | **On hold:** Diego said no to the orange-selected / teal-focus split. Fixes 1 and 2 (one font, pixel icons) can still go; fix 3 waits for his colour rule. |
| 8 | **BN-36** | **Shop and main menu on a phone.** Fix 1: Shop actions become tabs, and items become a priced list. Fix 2: on phone the menu drops the logo row and Exit joins Close, so Make is visible. Fix 3: the selected bag slot says "Holding". | no |

**Order:** BN-29 first, because it removes the mis-tap risk next to Back to the Hub. BN-31 lands with or after BN-21. BN-35 goes last, after the layout settles, so the look is only reworked once.

## Questions for Diego (answered below)

1. **BN-30:** OK to merge Notebook into Goals and drop the Save, Mode and Changelog tiles from the Menu?
2. **BN-31:** OK to put Accessibility inside Settings, with the Accessibility tile kept as a shortcut?
3. **BN-35:** Orange for "selected", teal only for focus. Does that match how you want the hub family to look?
4. **Wallet:** is "Start Cogs" meant for kids to see at all?

## Decisions (Nov 1)

1. **BN-30: GO.** Notebook merges into Goals. Save, Mode and Changelog leave the Menu.
2. **BN-31: GO.** Accessibility moves into Settings. The Accessibility tile stays as a shortcut to Comfort.
3. **BN-35 colour rule: no.** Orange for "selected" and teal for focus is not the look Diego wants. Fix 3 of BN-35 is on hold until he names the rule. Fixes 1 and 2 (one font, pixel icons instead of emoji) are not colour changes and can go.
4. **Start Cogs: kids don't see it.** BN-32 hides the line from kids. It stays in the teacher view.
