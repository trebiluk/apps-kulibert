# Bertopia lore: what's in the game, and what's next

Nov 1 2026, from BERTOPIA MAIN CODER. Checked against main `fe9b8e96` (2.5.595). This is a report and a plan; the L01 build ships in the same PR.

## Verdict
The lore bible (`BERTOPIA-LORE.md`, Oct 6) is strong. It is short and kind, it has real science under every strange thing, and Curriculum's fact-check passed its tone. **Almost none of it is in the game.**

A kid playing today meets:
- Berty and Bertyville
- Rustbots and Keepers ("Rebooted!")
- the Coreplate
- a Bertodex card
- a Notebook that holds farm tips

They never hear of the Verge or the Makers, and they never find a Maker Page. There are no landmarks or named biomes either: worldgen has only `forest` and `plains`. The story has a bible but no delivery.

## Canon vs game

| Canon item (LORE.md) | In game? | Notes |
|---|---|---|
| Tone rules (no menace, no medieval, no MC words, seasons not holidays) | ✅ | A scan of the strings and the mob, station and learn files found no forbidden words. |
| Berty, Bertyville | ✅ | Spawn town, "Poof! Back at Bertyville." |
| Verge Engineer (the player) | ❌ | Never named. |
| **The Verge** (the land) | ❌ | 0 hits in source. |
| **The Makers** | ❌ | 0 hits. `maker.js` is the World Maker tool, which is a different thing. |
| Berty's Bot (teal, beeps) | ⚠️ | A bot exists (`src/bot`). Check the colour against canon. |
| Rogue robots, "lost not angry" | ✅ | Rustbot, Keeper and Overseer are *rebooted*, not killed. The first reboot opens a Bertodex card. |
| Rustbot / Keeper / Overseer names | ⚠️ | Not in the glossary. The canon lists Hawkbots. **Add Rustbot, Keeper and Foundry Overseer to §7.** |
| Verge creatures (Shiver, Purrlet…) | ❌ | None in game. |
| 8 biomes with lore lines | ❌ | Only forest and plains. No biome chip. |
| 8 landmarks (Clock Gate, Prism Observatory…) | ❌ | The C5 Foundry arena and Console are the closest thing ("Sleeping Foundry"). |
| **Maker Pages 1–20** | ❌ | The core story delivery is missing. |
| Engineering Notebook | ⚠️ | A Notebook panel exists with farm notes, crew badges and a Bertodex line. That is the right home for Maker Pages. |
| Site Cards, Field Scanner | ❌ | |
| Coreplate (y −64) | ✅ | The floor exists. No lore line is shown. |
| Boundary Clay, Geology Night | ❌ | Waits on worldgen part B (WORLDGEN-EVAL). |
| Fusion Core (Legend goal) | ❌ | Endgame. |
| Bertodex | ✅ | Opens on the first reboot. Only the Rustbot and Keeper facts exist. |

## What works in our favour
- **The Notebook and `learn.addNote` already persist one-time notes per kid.** Maker Pages can reuse them with no new save format.
- **Reboots are already a "first time" moment.** Page 10 ("Our robots forgot their instructions… They're lost.") fits the first Rustbot reboot word for word.
- **The path goals** (`pathTool`, `pathBench`, `pathHome`…) give honest early triggers for pages 1–3. No new world content is needed.

## Plan: lore track L01–L12
The standing rules apply to every item:
- max 3 fixes per brief
- 8 languages + Simple, with rw, ti and fa-AF flagged as machine drafts
- icon + text, no sound-only cues, 44 px targets
- Curriculum checks every science line

| ID | Goal | Trigger / where | Risk | Depends |
|---|---|---|---|---|
| **L01** | **Maker Pages core:** a page list in the Notebook ("📜 Maker Pages 3/20"), a found card, and pages 1, 4 and 10 | Page 1 at the first tool made; page 10 at the first Rustbot reboot; page 4 at the first Keeper reboot | L | none (**this PR**) |
| L02 | Pages 2, 3 and 5 on existing moments | Page 2 the first night slept in a bed ("keep it turning"); page 3 the first glass baked (light bends); page 5 the first water source placed | L | L01 |
| L03 | Name the land: one-time welcome card "Welcome to the Verge, Engineer" plus the glossary words in the Help panel | First world load | L | L01 |
| L04 | Sleeping Foundry as the first landmark: a Site Card when a kid reaches the Console, and Page 9 on the first Overseer reboot | foundry.js | M | L01 |
| L05 | Coreplate line: the first time a kid stands on the Coreplate, show its lore line and science line | Depth check in the existing 10 Hz tick | L | L01 |
| L06 | Bertodex fill-in: real-science facts for every rebootable bot plus blocks seen (glass, iron, coal), from the wiki entry pattern §8 | learn.js openDex | M | Curriculum fact pass |
| L07 | Biome chip v1: name the two biomes that exist ("Bertyville Commons", "Glasswood edge" for forest), shown once on entry with icon + text | worldgen biomeAt + HUD chip | M | L03 |
| L08 | ✅ Done (Diego, Nov 1): Rustbot, Keeper and Foundry Overseer are canon in LORE §3/§7 and the wiki; Hawkbot retired | docs only | L | — |
| L09 | Hidden pages 11–19: one page per machine family, dropped by the machine's first use (belt, oven, quarry…) | stations.js, conveyor.js | M | L02 |
| L10 | Clock Gate in Bertyville: a small working gear landmark (gear ratios), Site Card, Page 2 moves here from L02 | town.js | H | GO from Diego |
| L11 | Boundary Clay stripe and Geology Night | worldgen part B | H | WORLDGEN-EVAL B-series |
| L12 | Page 20 and the Fusion Core class goal | Class server | H | Phase 2 server |

**Order:** L01 → L02 → L03 → L05 → L04 → L06 → L08 → L07 → L09. L10–L12 need a GO and other lanes first.

## Questions for Diego / GameMaster
1. ~~Rustbot vs Hawkbot~~ Decided Nov 1: Rustbot, Keeper and Foundry Overseer are canon; Hawkbot is retired.
2. Can page text appear before the Archive Door order? Pages are found in any order by design, so yes; L01 assumes this.
