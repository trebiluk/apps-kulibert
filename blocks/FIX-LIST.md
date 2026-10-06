# Bertopia FIX-LIST (live fix list for the Build chat)
Read this first on every Bertopia ship. In the same commit, tick `[x]` on each item you finished, and add your version to "Next up". Proof (Debugzy) updates "Live now" and the changelog. Docs only: no app code.
Updated Tue Oct 6 2026, 6:16 PM ET (Debugzy: 2.5.45 polish in Build; P1 touch-break fix inserted as 2.5.46 from Diego's phone; basics-1/2/3 renumbered to 2.5.47-2.5.49).

## 1. Live now
- **Bertopia 2.5.44** (`2e9fd8f`, Oct 6 1:03 PM ET). Held right click no longer opens doors, boxes or stations (Use needs a fresh, still press or one tap), and new grass has no loose wool.
- **Proof verdict: PASS (P2 watches)**, Oct 6 3:30 PM ET, `proof/bertopia-2.5.44/RESULT.md`. Smoke 74/74, exit 0, no `element.click()`. Sweep no use, door flips once, Box opens on a fresh right click, touch drag no use, tap opens on touch, 0 wool tops in a fresh 60x60 patch, a placed wool block survives save + reload. 0 console errors at 412/915/1366, rotate keeps state, teacher gate holds. Watches: Bag label clipped at 412, keys help line 2 lines and never fades, desktop place now happens on release.
- **Bertopia 2.5.43** (`a34e6af`): proof FAIL (P1, desktop smoke 65/68); 2.5.44 fixed it.
- **Bertopia 2.5.42** (`a0675ec`, Oct 5 10:49 AM ET). Its Oct 6 proof FAILed (P1) on the HUD, the teacher switch and the words; 2.5.43 fixed those.
- From Oct 4 7:40 AM to Oct 5 10:49 AM ET the Build chat shipped 28 cuts (2.5.15–2.5.42) with no proof between them. Most of core-1/core-2/core-3 and part of 2.6.0 landed this way:
  - 2.5.15–2.5.19: the 2.5.14 leftovers (Oven tiles, Fill/Walls words, Menú, Break contrast)
  - 2.5.20: Always day
  - 2.5.21: Arabic and Dari menu tap
  - 2.5.22: stick, walk/run/crouch, 1-block jump, hold to mine, 3rd person
  - 2.5.23: sky and a teal Berty
  - 2.5.24–2.5.25: drops never lost, Lost & Found
  - 2.5.26–2.5.28: craft groups, ×Max, shop only after you find it, Look speed
  - 2.5.29: cracks drain, Wide view
  - 2.5.30–2.5.31: place repeat, Use/F, crouch edge, Auto-climb, Pick chip
  - 2.5.32: Bag 9 + 6, Survival first, a device-only teacher switch
  - 2.5.33–2.5.36: bag and Survival polish, per-frame copies cut
  - 2.5.37: spawn town protected
  - 2.5.38–2.5.39: Box 18 and Wood/Stone Tools
  - 2.5.40–2.5.41: pointer fixes
  - 2.5.42: coal underground, wheat → flour, reeds → sugar, Wood Door, bunk sets home, gold path step
- Doors stay `/blocks/` and `/bertopia/`. Storage keys stay. Bertyville stays the starter world.

## 2. Open fixes (from proof/bertopia-2.5.44/RESULT.md) -> brief `briefs/fixq/bertopia-2545-polish.md` = **BT 2.5.45**, before basics-1
- [x] **Bag tile label (P2):** at 360/412 upright the 52 px slot cuts the label ("Bag" reads "Baq"). Fit icon + label in all 8 languages.
- [x] **Keys help line (P2):** fits on screen at 1366 and 915 (mouse) without clipping or covering the hotbar/chip/hint; fades after the first 3 movement key presses; no new storage key.
- [x] **Right-click place:** a non-interactive block places on pointerdown again. Doors, Box, Oven, Workbench, Vend, Bunk and Shop still open only on a fresh release. Held repeat still never opens them.
- [x] **2.5.44 done:** desktop smoke truth (right button, exit 0, no element.click), Use only on a fresh still press (`canUse`), no loose wool in new chunks (ids 13-16, Store wool, Bunk recipe kept).
- [x] **2.5.43 done:** touch HUD never covers itself (5 sizes), upright 9 slots + Bag, teacher gate via `HubStaffAuth.isUnlocked()`, tour/help/What's new words.

### Flags: built without a brief (GameMaster calls; leave as shipped, don't extend)
- **Wood Tool (5 Planks) and Stone Tool (3 Stone + 2 Planks) recipes.** core-1 said "Tool recipes are [PENDING GM]. Don't invent recipes." The hint says "A Wood/Stone Tool is faster", where the spec says "A Copper Tool is faster".
- **New world content:** wheat and reed plants (break into flour and sugar), wool blocks on the surface (1% per color; removed in 2.5.44), coal at y −3 to −28 (ORE-TABLE: most in B1, −1 to −16).
- **Spawn-town protection** (shop, road, pond, plot rings).
- **Matches the specs, though not briefed:** Box 8 Planks / 18 stacks (STORAGE-SPEC), Wood Door 6 Planks (BASICS-GM), Bag 9 + 6 (2.6.0).
- **Still missing from core-1/core-2/2.6.0:**
  - coyote 120 ms and jump buffer 150 ms
  - R rotate
  - Slow taps (800 ms) and "More time to connect"
  - the Overflow Box (Lost & Found stands in)
  - `/shared/kw-interact.*`
  - Build-world touch mine is 500 ms; the spec says instant tap

## 3. Next up (paste order; one version each, prove before the next)
| # | Version | Brief (`briefs/fixq/`) | Status |
|---|---|---|---|
| 0 | 2.5.43 | bertopia-2543.md: HUD fit + hotbar, teacher gate, words + real smoke | shipped, FAIL (P1) |
| 0b | 2.5.44 | bertopia-2544.md: desktop smoke truth (right button), Use only on a fresh still press, no loose wool | shipped, PASS |
| 0c | 2.5.45 | **bertopia-2545-polish.md:** Bag tile label fits on phones; keys help line fits and fades after 3 moves; right-click places on press | [x] |
| — | — | ~~bertopia-core-1/2/3.md (were 2.5.16–2.5.18)~~: mostly shipped by Build in 2.5.22–2.5.32. Don't paste. Leftovers are listed under Flags above. | superseded |
| 0d | 2.5.46 | **bertopia-2546-touchbreak.md (P1, Diego's phone 6:13 PM "Couldn't break the tree"):** touch hold-to-break uses straight drift under 24 px instead of summed jitter; ring at 150 ms + one-time holdToBreak tip + pathTreeTouch line; Pick renamed Copy (eyedropper), a hold still breaks while armed | [ ] |
| 1 | 2.5.47 | bertopia-basics-1.md: registry rows first, Lever, Push Button, the other doors + double + lock (doors never break from a hold), day/night + toggles, LED Lantern, palette-remap save safety (ores moved to world-1a) | [ ] |
| 2 | 2.5.48 | bertopia-basics-2.md: Glow Pebble T1, Glow Stick T2, Jumbo (makes 2), Cold Vial locked tile, Corn → Bioplastic → Tube, Paint dab from Berry, one-time gift of 8 Glow Moss | [ ] |
| 3 | 2.5.49 | bertopia-basics-3.md: Solar Panel (6-charge cell), Glow Strip, Copper Wire, powered sliding door, `power.js` (T5); Silicon at the Smelter | [ ] |
| 4 | 2.6.0 | bertopia-260.md: shared **kw-interact** module, 3 panel shapes, Slow taps, link timer (Flo GO; the Bag 9 + 6 itself is live since 2.5.32) | [ ] |
| 5 | 2.6.1 | bertopia-260b.md: search/tabs/keys, stacks + Oven/Stash/Market/Trash, saved arrangement | [ ] |
| 6 | 2.6.2 | bertopia-seasonal-early.md: one Seasonal & Holiday pile + one teacher switch (no dates), Autumn/Spooky props, String lights, pumpkin carving (12×12, steady amber); before Oct 31 | [ ] |
| 7 | 2.6.3 | bertopia-world-1a.md: ores by depth (natural stone only), Glow Moss clumps + first-find chip, locked tiles | [ ] |
| 8 | 2.6.4 | bertopia-world-1b.md: still water (lakes, river, Clay), one-thumb swimming, Pan + Bucket | [ ] |
| 9 | 2.6.5 | bertopia-world-2a.md: six biomes + old-save safety, Snow/Ice in Frostspire, biome chip + patterned minimap | [ ] |
| 10 | 2.6.6 | bertopia-world-2b.md: the sea, Salt + Salt Pan, biome ores/panning/crops, Boundary Clay | [ ] |
| 11 | 2.6.7 | bertopia-storage-1.md: Cotton + Cloth, wood Backpack, shelves, Box/Double Box, Desk/Cabinet, Glass Cabinet T3; Steel Locker + Expedition Pack T4 | [ ] |
| 12 | 2.6.8 | bertopia-storage-2.md: Paint Brush, palette, Blueprint colors, Interior Designer | [ ] |
| 13 | 2.6.9 | bertopia-bot-cargo.md: Bot H1 Cargo Bay (T5; steady amber low-battery ring, no blink) | [ ] |
| 14 | 2.6.10 | bertopia-storage-4.md: Item Tubes, Extractor, Powered/Filter Tube, Sorter | [ ] |
| 15 | 2.6.11 | bertopia-storage-5.md: Storage Network | [ ] |
| 16 | 2.6.12 | bertopia-storage-3.md: Teleport Pads + Delivery Drone/Dock | [ ] |
| 17 | 2.6.13 | bertopia-storage-6.md: Battery Box, Network Pad, Networked Dock | [ ] |
| 18 | 2.6.14 | bertopia-fun-1.md: Pet Rock, Gravity Hat + Spring Pad, Disco Floor | [ ] |
| 19 | 2.6.15 | bertopia-music-1.md: Tone Block, instruments, Jukebox + DJ Berty Discs | [ ] |
| 20 | 2.6.16 | bertopia-holidays-1.md: rest of the one pile (Winter group, 13 culture items ids 172–184, Marigold/Papel Picado), origin lines, Decorator badge |  [ ] |
| 21 | — | Furniture (storage-2b), Effects, Bertodex, mastery, machines: staged in docs/BERTOPIA-CODING-PLAN.md §S; briefs not written yet | [ ] |
| future | — | **World types and options** (Diego, Oct 6 12:32 PM): New World picker with Classic, Flat, Islands, Caves (more later); options for world size, trees, ores, starter town on/off; a shareable seed so a whole class gets one world. In docs/BERTOPIA-CODING-PLAN.md §S5 (world-2 stage, after world-2a). No brief yet (`bertopia-world-2c.md` when Diego says go). | [ ] |

All briefs were renumbered on Oct 6 (7:10 AM, then 10:04 AM for seasonal-early) to this table. Every brief's proof includes StudentTester's 915×412 sideways run + mid-play rotate; each one starts from the version in the row above. **Registry first:** every brief adds its rows to `docs/wiki/REGISTRY.json` before any code (CODING-PLAN §0).
Out of scope until Diego decides: Bobbleheads; the TechWorks server side of the Teacher flag.

## 4. Locked rules (read before building; use the numbers exactly)
- [BERTOPIA-GM-ANSWERS-2026-10-06.md](docs/BERTOPIA-GM-ANSWERS-2026-10-06.md): GameMaster's final answers (recipes, no tier gates, Silicon at the Smelter). **It wins over every older line.**
- [wiki/REGISTRY.json](docs/wiki/REGISTRY.json): the one list of every block, item, machine, ore, biome, recipe and effect (ids, names, verbs, recipes, stage, asset id, fact chip, Bertodex id). [wiki/README.md](docs/wiki/README.md) explains it.
- [BERTOPIA-CODING-PLAN.md](docs/BERTOPIA-CODING-PLAN.md): architecture, save versions, perf budgets, milestones, smoke harness, open questions.
- [BERTOPIA-WORLD-1.md](docs/BERTOPIA-WORLD-1.md), [BERTOPIA-WORLD-2.md](docs/BERTOPIA-WORLD-2.md), [BERTOPIA-DECOR-PACKS.md](docs/BERTOPIA-DECOR-PACKS.md): world-1/2 and decor (furniture, autumn, carving, string lights) source of truth.
- [BERTOPIA-CRAFTING-AND-MACHINE-UI.md](docs/BERTOPIA-CRAFTING-AND-MACHINE-UI.md): Build Tray + the one shared Machine Panel (`ui.machinePanel(spec)`, Run/Wires/Inside/Stats; built once in mach-1, reused by every machine).
- [BERTOPIA-CORE-MECHANICS.md](docs/BERTOPIA-CORE-MECHANICS.md): **read first.** The 10 verbs, movement/camera/mining numbers, the §0.3 gesture thresholds and the 23 live mismatches. It wins over any older brief.
- [BERTOPIA-WORLDS.md](docs/BERTOPIA-WORLDS.md): Game world (Bertyville) = Survival for everyone; Build world (the Workshop) = Creative, Teacher flag only. Separate Bags.
- [BERTOPIA-EFFECTS-SPEC.md](docs/BERTOPIA-EFFECTS-SPEC.md): Lab Bench effects, Levels I–III, cooldowns, chips, off zones.
- [BERTOPIA-ORE-TABLE.md](docs/BERTOPIA-ORE-TABLE.md): depth bands, biomes, ore table, refining chains, Bertodex (Game world only).
- [BERTOPIA-ELEMENT-ECONOMY.md](docs/BERTOPIA-ELEMENT-ECONOMY.md): the Cog metal ladder, Wallet, Trade Post (Copper Cogs only) and Patents. Game world only.
- **Abundance numbers (GM, 7:21 AM):** ranked or compared columns use mass ppm only (CRC, Rudnick & Gao). Atom counts (RSC) go only in a footnote labeled "atoms per million atoms".
- **Shared interaction module:** `briefs/style/INTERACTION-STYLE-v1.md` + `kw-interact-ref/` (reference, 122/122) ships inside the 2.6.0 Bag brief as a new opt-in `/shared/kw-interact.*`. Never edit `kulibert-bar.js`, `kulibert-prefs.js` or `kw-who.js`.
- [BERTOPIA-BASICS-GM-2026-10-04.md](docs/BERTOPIA-BASICS-GM-2026-10-04.md): A1–A4 economy, Lantern, Doors, Day/night, Glow tiers, Bot Cargo Bay.
- [BERTOPIA-STORAGE-SPEC.md](docs/BERTOPIA-STORAGE-SPEC.md): the single source of truth for Bag, Backpacks, furniture, Paint, Tubes, Network, Pads, Drone, Energy and Badges.
- [BERTOPIA-FUN-ITEMS-SPEC.md](docs/BERTOPIA-FUN-ITEMS-SPEC.md): Pet Rock, Gravity Hat, Disco Floor, Spring Pad (= Bounce Block), Music, Holiday packs (all 14 approved Oct 4). Bobbleheads stay out.
- [BERTOPIA-PROGRESSION-PLAN.md](docs/BERTOPIA-PROGRESSION-PLAN.md): Cogs, the 7-tier materials ladder, badges, dailies.
- **GameMaster gap answers (Oct 4, 7:03 AM ET), folded into the briefs:** Phase 1 is wood (Desk 6 Planks, Cabinet 7 Planks, Glass Cabinet + 1 Glass at T3, Backpack 6 Cloth + 2 Planks). Steel Locker, Expedition Pack and Steel (Iron Ingot + 1 Coal, Forge) are T4. Bot H1, Lantern, Charger and anything with a Battery Cell are T5. Copper Wire (T5) is placed with Place on any face and glows teal when powered. Solar Panel has a 6-charge cell (2 strips through the night). "Chest" = Box. A lit block = a placed permanent light on at night, own plot or published area, ≥3 blocks from another counted light (badges at 10/50/200). Class-mode music 25%. Overflow Box: private, at your spawn, take-only, never auto-deleted. The store sells a material for Cogs only as a Bronze restock of one you've found.
- **GameMaster final answers (7:21 AM ET):** Bronze = 8 Copper Ingot + 1 Tin Ingot → 9 Bronze Ingot ("about 9 parts copper to 1 part tin, like real tin bronze"); Tin from ORE-TABLE (Tin Ore → Tin Ingot at the Smelter). Salt is out of the glow recipe: Booster Dye = 1 Glow Moss + 1 Paint dab (Workbench); Jumbo Glow = Tube + 2 Glow Mix + 1 Booster Dye, radius 5, about 40 min. World press: lift before 500 ms without a break = Place/Use, cracks from 250 ms (reset with no loss), ≥500 ms = Mine, Slow taps 800 ms. Link timer restarts on keyboard focus/keys, Esc cancels, "More time to connect" turns it off, touch keeps 10 s. Bot low battery: steady amber ring + "Low battery" at 20%, "Battery empty, half speed" at 0%, no blinking.
- Still open with GameMaster: tool recipes; Smelter and Fabricator recipes; the Paint dab source (paint has no item today) and the Jumbo Glow count; Glow Stick (T2) needs a Plastic Tube (T4 Smelter); Silicon station (Smelter vs Fabricator); Water and the snow biome don't exist in live yet; wool/flour/sugar restock price; Leaves no longer "break on a tap" under the 500 ms rule.

## 5. Proof changelog
| Version | Commit | Proof verdict (ET) |
|---|---|---|
| 2.5.44 | 2e9fd8f | PASS (P2 watches): smoke 74/74 exit 0, no element.click; held right-click sweep opens nothing, fresh right click opens Box/flips door, tap opens on touch; 0 wool tops; placed wool kept (Oct 6, 3:30 PM) |
| 2.5.43 | a34e6af | FAIL (P1): HUD fit, rotate and HubStaffAuth gate PASS; smoke 65/68 exit 1 (desktop place/Box/Oven lines send a left click), old lines still element.click() (Oct 6, 1:15 PM) |
| docs (Oct 6, 10:30 AM) | (this commit) | Docs only: GM calls applied (Tone Block, Fusion Core nuclear line, teal Bot, Zapper removed), marigoldPatternTile key, US spelling + ×, 54 Machine Panel inside lines (unchecked), 278 entries checked |
| docs (Oct 6, 10:15 AM) | (this commit) | Docs only, no app change: one Seasonal & Holiday pile (no dates, one teacher switch, culture items ids 172–184 in), Diya cut, Pattern Floor Tile base decor, Fabricator Starter Kit, new seasonal-early at 2.6.2 (versions after it +1, holidays-1 → 2.6.16), rotate proof in every brief |
| 2.5.42 | a0675ec | FAIL (P1): HUD overlaps (path chip on the stick, hint on Crouch), any kid can flip the teacher switch, upright hotbar 4/9 off screen, stale tour/help/What's new, smoke has no gates (Oct 6, 6:30 AM) |
| 2.5.15–2.5.41 | 689aea9 … 417deb0 | not proven one at a time (27 Build cuts, Oct 4 7:40 AM – Oct 5 10:35 AM); covered by the 2.5.42 proof |
| 2.5.14 | d47a8d3 | FAIL: strip, recipe and chip fixed; tile pictures/fit, fillN/wallsN in 7 languages and smoke.mjs still open (Oct 4, 7:35 AM) |
| 2.5.13 | 6e2110b | FAIL: Oven strip wiped by the repaint, Flour → Cupcake, mode chip after reload, tour/tool words, smoke not updated (Oct 4, 6:45 AM) |
| 2.5.12 | 2cc31a5 | not proven alone (superseded by 2.5.13 within 33 min) |
| 2.5.11 | 7ccabe2 | FAIL (P1): Oven strip vanished, Copy removed, Survival Paste crash on air, reload booted Creative (Oct 4, 12:05 AM) |
| 2.5.10 | 7650ffa | FAIL (P1): money and Oven issues |
| 2.5.9 | 87000bf | FAIL (P1): bag refactor broke the Oven |
| 2.5.8 | 7129e6a | PASS (P2 watches) |
| 2.5.7 | 7023f69 | FAIL (P1) |
| 2.5.6 | fb26610 | FAIL (P1) |
| 2.5.5 | 0727d58 | FAIL (P1) |
| 2.5.4 | eea2dbb | FAIL (P1) |
| 2.5.3 | 17ba22f | FAIL (P1) |
| 2.5.2 | 00eec45 | FAIL (P1) |
| 2.5.1 | 1292aa5 | FAIL (P0) |
| Bloxbert 2.5.0 | dafd50c | FAIL (P1) |
| Bloxbert 2.4.0 / 2.3.0 / 2.2.0 | 5a5802b / 7ce7ed2 / 1951bb6 | FAIL |
| Bloxbert 2.1.0 | eb5dadf | 9 PASS · 4 FAIL (1 P1, 3 P2) |
