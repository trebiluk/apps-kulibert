# Bertopia FIX-LIST (live fix list for the Build chat)
Read this first on every Bertopia ship. In the same commit, tick `[x]` on each item you finished, and add your version to "Next up". Proof (Debugzy) updates "Live now" and the changelog. Docs only: no app code.
Updated Wed Oct 7 2026 (Build: 2.5.65 Make bar and oven bread).

## 1. Live now
- **Bertopia 2.5.48** (`a88f823`, Oct 6 10:11 PM ET). Doors with levers and buttons, day and night, and the LED Lantern.
- **Proof verdict: FAIL (P1)**, Oct 6 10:38 PM ET, `proof/bertopia-2.5.48/RESULT.md`. Works by real input: double wood door opens with 1 tap, 3 s auto-close, a tap on a Metal door says "Needs a button or lever", a Lever opens it, a Button opens it 1.5 s, a locked door refuses another player and the Teacher stub opens it, a 3 s hold doesn't break a door, all survives Save + reload, the 2.5.42 save loads with every block. Lantern shows "Needs T5 - Fabricator" with gates closed, crafts with T5 open, 3 taps -> High (r10), +2.5 min -> r1, Charger +2 min / daylight +4 min -> full, Light Up badge once at 3 b and none at 2 b. P1: night only darkens the sky and fog (ambient and noa light never change, grass at night = 100% of day), and 20 High lanterns in view drop 1366 from ~58 to ~28 FPS (smoke "lantern fps" plants them out of view). Smoke 148/1 (door flips once) and 149/0 (exit 0), 0 console errors at 412/915/1366, rotate keeps state, teacher gate holds, live = main byte for byte.
- **Bertopia 2.5.47** (`416ee4b`, Oct 6 8:29 PM ET). Your finger breaks the block it is on, and the hotbar shows what you picked up right away.
- **Proof verdict: PASS (P2 watches)**, Oct 6 9:10 PM ET, `proof/bertopia-2.5.47/RESULT.md`. Off-aim finger chop works on live: aim on the road (1,4,0), finger on the starter log (2,5,2), 2300 ms jitter hold -> log 0, bag log 1 at 915x412 and 360x740. First slot L / 1 and "Log" 2-3 ms after the chop with no slot tap. Finger on a town road -> "The town stays", nothing breaks. Tap on grass places the log on that face. 1366 mouse hold breaks the crosshair block (D / Dirt). Bag label 16/16 now pass, door flips once pass. Smoke 119/1 and 117/3 (exit 1), instrumented run 3 120/0 (exit 0); 0 console errors at 360/412/915/1366, rotate keeps state, teacher gate holds, live = main byte for byte. Watches: smoke "hold toast once" fails 2 of 3 (the ring press before it is a short tap that can use up the one-time tip, or tap 1 comes while Berty is still settling after stand()); old centre "jitter chop 915x412" 1 of 3 (8/8 alone); "Make a Wood Tool" shows twice at once (path chip + toast).
- **Bertopia 2.5.46** (`a10199e`, Oct 6 6:53 PM ET). Holding your finger on a block breaks it even if your finger wiggles a little, a tip shows you how, and the Pick button is now Copy.
- **Proof verdict: FAIL (P1)**, Oct 6 7:24 PM ET, `proof/bertopia-2.5.46/RESULT.md`. Drift fix, ring at ~205 ms, holdToBreak toast once, pathTreeTouch line (touch only, gone after the first log, never at 1366), Copy button (87x48 + eyedropper at 915 and 360) and Copy-armed hold all work. But on live a finger held on the starter log digs the block under the aim outline instead (town road -> "The town stays", log stays): `rayAt()` uses `scene.pick`, noa terrain is not pickable, so it is always null and falls back to `targetHit()`. Only when the outline is already on the log does the hold chop it. Also the HUD hotbar stays "Empty slot" after the chop (Bag shows Log 1) until a slot tap. Smoke 96/17 and 97/16 (16 = bag label 1 px, +1 hold toast once flaky). 0 console errors at 360/412/915/1366, rotate keeps state, teacher gate holds.
- **Bertopia 2.5.45** (`73a477b`, Oct 6 6:12 PM ET). The Bag tile label fits on a phone, the keys help line fits on one line and fades after your first steps, and right click places right away again.
- **Proof verdict: PASS (P2 watches)**, Oct 6 6:35 PM ET, `proof/bertopia-2.5.45/RESULT.md`. "Bag" reads right at 412 (g shows); keys fit en/ru/ar/fa-AF at 1366/915, fade 1->0; place on press 64->63; sweep no use, Box/Oven open on a fresh press, touch drag no use. 0 console errors at 412/915/1366, rotate keeps state, teacher gate holds. Watches: smoke "bag label" fails 16/16 by 1 px on other fonts (scrollHeight 13 > 12, not visible), "door flips once" flaky (1 of 2 runs).
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

## 2. Open fixes (from proof/bertopia-2.5.48/RESULT.md) -> `briefs/fixq/bertopia-2549-fix.md` = **BT 2.5.49**
- [ ] **Night darkens the world (P1, 2.5.48 proof):** syncGlow (main.js ~1858) sets only the sky `uLum` and fog. Scale `scene.ambientColor` and `noa.rendering.light` by `basics.lum()`; grass at night 40-70% of day, Brighter nights >= 60%, Always day / Build world unchanged.
- [ ] **Lantern lights are cheap (P1, 2.5.48 proof):** 1366 with 20 High lanterns in view 28 FPS vs 58 on 2.5.47 (1 High 45, 4 High 33). Limit the 4 PointLights' cost; smoke "lantern fps" must put the lanterns in view and want >= 90% of no lanterns.
- [ ] **"door flips once 1366x768" (P2):** failed 1 of 2 runs again (30).
- [ ] **"Needs T5 - Fabricator" after T5 opens (P2, cosmetic):** the station line still says it; it means "make it at a Fabricator".
- [x] **2.5.48 done (basics-1):** doors (wood/glass/metal/sliding, double, auto-close, lock, hold-safe), Lever, Push Button, palette-remap save safety, day/night + Always day + Brighter nights, Light Up badges, LED Lantern / Battery Cell / Charger behind T5, Starter Kit. Smoke "hold toast once" and "jitter chop 915x412" now pass (own page, steady aim).

### Earlier open fixes (from proof/bertopia-2.5.47/RESULT.md)
- [x] **Smoke "hold toast once 915x412" (P2, 2.5.47 proof):** fails 2 of 3 runs, the game is right. The "crack ring early" press just before it (touchStart 200 ms touchEnd, smoke.mjs ~870) is a short tap and can use up the one-time holdToBreak tip; other times tap 1 lands while Berty settles after `__smoke.stand()` and `canUse` refuses it. Move it to its own fresh page, wait for grounded + steady aim, make the ring press a > 500 ms hold.
- [x] **Smoke "jitter chop 915x412" (P2, 2.5.47 proof):** the old centre-hold line failed 1 of 3 runs (8/8 alone). Wait for grounded + steady aim before the press.
- [ ] **"Make a Wood Tool" twice (P2, cosmetic):** after the first log the path chip and a toast show the same words at once for ~2.4 s.
- [x] **Night darkens the blocks (P1, 2.5.48 proof):** the day light now scales world ambient and the sun, so grass follows the night. Always day and the Build world stay fully lit. Lantern glow stays bright.
- [x] **Lantern lights stay cheap (P1, 2.5.48 proof):** the 4 nearest lanterns (2 on Lite) light a ground pool and do not light every chunk. They are off by day. Smoke times 20 High lanterns in view against none on the same page.
- [x] **2.5.52 Survival / Creative switch (Diego Oct 7, 6:16 AM):** one on-screen Survival | Creative pill for everyone (`MODE_SWITCH_ALL`), live in the same world (no load, same blocks, place and look), separate bags that both survive reload, old bag stays the Survival bag, creative reach 10 / instant break / no tool wear / gates open.
- [x] **2.5.53 StudentTester proof of 2.5.52:** a lever or button touching a door, including diagonal-below, toggles it. A lever stays. A button opens for 1.5 s then closes. A fresh tap on touch uses a lever, button, or door, with a click and a flipped handle or a pressed button. An open door is a thin panel swung aside and you can walk through it. A shut door is a full solid panel. Lanterns are about half a block, you can walk through them, and a click on one does not stack another on top. The Survival/Creative switch sits in the top bar next to the menu. The Bag tile does not cover the item strip. The lantern bar says Light.
- [x] **2.5.54 Energy and food (Diego Oct 7):** 10 bolts in the Game world, one bolt every 4 minutes of play (paused when the tab is hidden or a panel is open). At 0, walk is 70% and mining is 1.5× slower, one toast, nobody faints. Creative has no bar. Teacher switch Energy on/off, default on. Berry +1, Bread +4, Cupcake +3. A full bar keeps the food and says "You're full". 1 in 4 grass tufts near trees also drop a Berry. Wheat becomes Flour at the Workbench (1 → 1). Bread stays at the Oven.
- [x] **2.5.56 Build Tray and oven crate:** Crafting is one crate with a recipe book and a tray. Parts slide into the wells, Make squashes, the result pops, and a missing part shakes with a dashed “short” label. The oven and workbench use the same crate: input, an arrow that fills while it cooks, output, and a fuel flame under the input.
- [x] **2.5.58 Berry tufts:** breaking a wheat tuft near a tree drops a berry again. The 2.5.56 import swap had dropped `berryTuft`.
- [x] **2.5.57 Bag and item strip (lane A2):** the Bag is a centred workshop crate of square wells (9 across on a wide screen, 6 on a phone) with counts, and the item strip is the same crate: 9 wells, a Bag keycap, and a pickup that flies into its well.
- [x] **2.5.59 Door card and lever:** door options are a readable crate (Auto-close, Padlock, Pick up, and an X). Escape and a tap outside close it. A new door starts shut and says so. A lever turned on opens its door; a button opens, then shuts after 1.5 s.
- [x] **2.5.61 Bag:** the Bag is easier to read, and you can tap or drag to move things around.
- [x] **2.5.62 Build Tray hand place:** ingredient wells start empty (ghost plus 0/need). Drag or tap a Bag stack into a slot, or tap Fill. Make lights only when every slot is full. X, Escape, and a recipe change put the parts back.
- [x] **2.5.65 Make bar and oven bread:** the Make bar does not cover recipe cards. Bread shows Bake in Oven and bakes in the oven. Planks, a log, or coal feed the oven.
- [x] **2.5.50 tools and saplings (Diego Oct 7):** Stone, Slate, Coal, Brick and every Ore need a Wood Tool. Ores need a Stone Tool. A bare hand shows a crack that never finishes and one toast. A Wood Tool lasts 60 breaks, a Stone Tool 150, then it becomes 1 Stick. Leaves drop a Sapling 1 in 6. A sapling on grass or dirt grows the starter tree after 8 minutes if the space is clear. 2 Saplings wait in Lost & Found once.
- [x] **2.5.51 design rule:** tools never wear out and show no wear bar. Bare hands still break stone and ore on the timed mine. A pick only mines faster. Saplings still grow the starter tree.
- [x] **2.5.47 done:** touch hold/tap/Copy use a voxel raycast through the finger (reach 6, no aim fallback on touch), hotbar + chip repaint after break/pickup/Box spill/Lost & Found, smoke off-aim finger/road/places/HUD lines, bag label headroom, door wait, toast wait.
- [x] **Touch target (P1, 2.5.46 proof):** touch hold and tap act on the aim-outline block, not the block under the finger. `rayAt()` (main.js ~883) uses `scene.pick` on non-pickable noa terrain, so it is always null and falls back to `targetHit()`. Raycast voxels from the camera through the touch point instead.
- [x] **Hotbar repaint (P1, 2.5.46 proof):** `session.onBreak` adds the drop to the bag but never repaints the hotbar or the chip; the slot shows the log only after a slot tap.
- [x] **2.5.46 done:** straight drift under 24 px, ring at 150 ms, holdToBreak tip once, pathTreeTouch line, Pick -> Copy (eyedropper), hold breaks while Copy is armed.
- [x] **Smoke truth (P2, carried into the 2.5.47 brief):** bag label line needs 1-2 px line-height headroom so smoke passes on any font set (scrollHeight 13 > 12 on Debugzy's headless Chrome); "door flips once 1366x768" flaky (passed 2 of 2 on 2.5.46), wait for aim on the door before the press; new: "hold toast once 915x412" flaky 1 of 2 runs (first sample empty), wait for the toast before reading it. Smoke chop lines plant the log at the aim and hold at screen centre, so they can't see the touch-target bug: add an off-aim finger line.
- [x] **2.5.45 done:** Bag label fits, keys help line fits + fades, right click places on press.
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
| 0c | 2.5.45 | bertopia-2545-polish.md: Bag tile label fits on phones; keys help line fits and fades after 3 moves; right-click places on press | shipped, PASS |
| — | — | ~~bertopia-core-1/2/3.md (were 2.5.16–2.5.18)~~: mostly shipped by Build in 2.5.22–2.5.32. Don't paste. Leftovers are listed under Flags above. | superseded |
| 0d | 2.5.46 | **bertopia-2546-touchbreak.md (P1, Diego's phone 6:13 PM "Couldn't break the tree"):** touch hold-to-break uses straight drift under 24 px instead of summed jitter; ring at 150 ms + one-time holdToBreak tip + pathTreeTouch line; Pick renamed Copy (eyedropper), a hold still breaks while armed Pasted Oct 6 ~6:19 PM | shipped, FAIL (P1) |
| 0e | 2.5.47 | **bertopia-2547-fix.md (P1, 2.5.46 proof):** touch hold/tap act on the block under the finger (voxel raycast through the touch point, reach 6); hotbar + chip repaint after every break/pickup; smoke off-aim finger chop + HUD slot line; smoke truth (bag label headroom, toast wait) | shipped, PASS |
| 1 | 2.5.48 | bertopia-basics-1.md: registry rows first, Lever, Push Button, the other doors + double + lock (doors never break from a hold), day/night + toggles, LED Lantern, palette-remap save safety (ores moved to world-1a) | shipped, FAIL (P1) |
| 1b | 2.5.49 | **bertopia-2549-fix.md (P1, 2.5.48 proof):** night darkens the world (ambient + noa light follow `lum()`), lantern lights cost under 10% at 1366 with 20 in view, smoke lantern fps in view | shipped |
| 1c | 2.5.50 | tools gate hard blocks, and saplings grow back (Diego Oct 7; not the glow brief) | shipped |
| 1d | 2.5.51 | design rule: drop tool wear and the stone gate; bare hands still break stone and ore, slower; a pick only mines faster; saplings stay | shipped |
| 1e | 2.5.52 | on-screen Survival / Creative switch, live in one world, separate bags (Diego Oct 7 6:16 AM) | shipped |
| 1f | 2.5.53 | StudentTester proof of 2.5.52: doors with levers and buttons, small see-through lanterns, mode switch in the top bar | shipped |
| 1g | 2.5.54 | Energy bar and food that fills it (Berry +1, Bread +4, Cupcake +3); wheat → flour at the workbench | shipped |
| 1h | 2.5.56 | Build Tray crafting and the oven crate (parts slide in, flame and progress) | shipped |
| 1i | 2.5.57 | Bag and item strip as a workshop crate: square wells, counts, pickup flies into the strip | shipped |
| 1j | 2.5.58 | Berry tufts drop berries again (restore the berryTuft import lost in 2.5.56) | shipped |
| 1k | 2.5.59 | Door options are easy to read, and a lever turned on now opens its door | shipped |
| 1l | 2.5.61 | Bag is easier to read; tap or drag to move things | shipped |
| 1m | 2.5.62 | Build Tray: drag or tap each part into its slot, or tap Fill | shipped |
| 1n | 2.5.65 | Make bar stays clear of recipes; bread bakes in the oven on wood or coal | shipped |
| 2a | 2.5.50 | bertopia-basics-2a.md: glow tiers T1-T4 (Pebble, Stick, Jumbo, Cold Vial locked tile), recipes and timers, Corn -> Bioplastic -> Tube, Paint dab, one-time gift of 8 Glow Moss | [ ] |
| 2b | 2.5.51 | bertopia-basics-2b.md: glow colors, caps (128 / 64), minimap breadcrumbs, Notebook "Glow" page | [ ] |
| 3a | 2.5.52 | bertopia-basics-3a.md: `power.js`, Solar Panel (6-charge cell), LED Glow Strip, plain Copper Wire that connects (T5); Silicon at the Smelter | [ ] |
| 3b | 2.5.53 | bertopia-basics-3b.md: Copper Wire rings, tap to connect, Show power, 512 limit | [ ] |
| 3c | 2.5.54 | bertopia-basics-3c.md: powered sliding door, wired Lever/Button opens a Metal door, power lesson card | [ ] |
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

All briefs were renumbered on Oct 6 (7:10 AM, then 10:04 AM for seasonal-early) to this table. Oct 6 10:05 PM (Diego 9:56 PM "Smaller chunks"): basics-2 and basics-3 split into five one- or two-item briefs, 2.5.49-2.5.53 (originals in `briefs/fixq/_bak-split-1006/`); 2.6.0 and later keep their numbers. Every brief's proof includes StudentTester's 915×412 sideways run + mid-play rotate; each one starts from the version in the row above. **Registry first:** every brief adds its rows to `docs/wiki/REGISTRY.json` before any code (CODING-PLAN §0).
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
| 2.5.47 | 416ee4b | PASS (P2 watches): off-aim finger chop (aim road 1,4,0, finger on log 2,5,2) breaks the log at 915 and 360 on live, first slot L / 1 + "Log" 2-3 ms after with no slot tap, road finger toast + nothing breaks, tap on grass places, 1366 mouse crosshair hold; bag label 16/16 + door flip PASS; smoke 119/1 and 117/3 exit 1 (hold toast once 2 of 3 = test sequence; centre jitter chop 915 1 of 3), instrumented run 3 120/0 exit 0; all checks ok, 0 console errors, rotate OK, gate holds (Oct 6, 9:10 PM) |
| 2.5.46 | a10199e | FAIL (P1): drift, ring 150 ms, hold tip, pathTreeTouch, Copy all PASS; a finger on an off-aim log digs the aim block instead (rayAt always null, falls back to targetHit), hotbar not repainted after a break; smoke 96 PASS / 17 FAIL and 97 / 16 (bag label 1 px + hold toast flaky), all checks ok, 0 console errors, rotate OK (Oct 6, 7:24 PM) |
| 2.5.45 | 73a477b | PASS (P2 watches): Bag label reads right at 412, keys line fits + fades, place on press; smoke 86 PASS / 16 FAIL (all = bag label 1 px scrollHeight on box fonts; door flip flaky 1 of 2 runs), all checks ok, 0 console errors, rotate OK (Oct 6, 6:35 PM) |
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
