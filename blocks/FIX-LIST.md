# Bertopia FIX-LIST (live fix list for the Build chat)
Read this first on every Bertopia ship. In the same commit, tick `[x]` on each item you finished, and add your version to "Next up". Proof (Debugzy) updates "Live now" and the changelog. Docs only: no app code.
Updated Tue Oct 6 2026, 6:45 AM ET (Debugzy audit of 2.5.15–2.5.42; full report: proof/AUDIT-2026-10-06.md on Debugzy's box).

## 1. Live now
- **Bertopia 2.5.42** (`a0675ec`, Oct 5 10:49 AM ET). Live = main; `npm run build` reproduces `blocks/app.js` byte for byte.
- **Proof verdict: FAIL (P1)**, Oct 6 6:30 AM ET, `proof/bertopia-2.5.42/RESULT.md`. 0 console errors at 412/915/1366, ☰ by touch, the 26 repo-smoke lines and every `tools/*-check.mjs` pass. The failures are below.
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

## 2. Open fixes (from proof/bertopia-2.5.42/RESULT.md) → brief `briefs/fixq/bertopia-2543.md` = **BT 2.5.43**, before anything in Next up
- [ ] **Touch HUD:**
  - The gold `#path-chip` covers the stick at 412 and 915, and the keys line at 1366. It's 35 px tall.
  - "Tap ☰ for menu" covers Crouch at 915x412, and Crouch sits under the header.
  - Upright, 4 of 9 hotbar slots are off screen and there's no Bag tile.
- [ ] **Teacher gate:** any student can flip ☰ → Teacher → "This device can build", which unlocks Creative, the town helper, the price dial and Reset wallet. Gate it with the existing `HubStaffAuth.isUnlocked()`.
- [ ] **Words:** tour step 1 still says "Move with the pads". The Settings help says "double-tap to fly". What's new still shows the 2.5.32 line.
- [ ] **Smoke (carried over from 2.5.15 item 3):** `tools/smoke.mjs` still uses `element.click()` and has no 2.5.22–2.5.42 gates. It needs ≥30 real-input lines at 412 and 1366.
- [x] 2.5.14 leftovers: Oven tile pictures and fit, Nothing to bake yet, Output: Glass, fillN/wallsN in 8 languages, Menú, Break contrast (2.5.15–2.5.19; smoke lines pass).

### Flags: built without a brief (GameMaster calls; leave as shipped, don't extend)
- **Wood Tool (5 Planks) and Stone Tool (3 Stone + 2 Planks) recipes.** core-1 said "Tool recipes are [PENDING GM]. Don't invent recipes." The hint says "A Wood/Stone Tool is faster", where the spec says "A Copper Tool is faster".
- **New world content:** wheat and reed plants (break into flour and sugar), wool blocks on the surface (1% per color), coal at y −3 to −28 (ORE-TABLE: most in B1, −1 to −16).
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
| 0 | 2.5.43 | **bertopia-2543.md:** HUD fit + hotbar, teacher gate, words + real smoke | [ ] |
| — | — | ~~bertopia-core-1/2/3.md (were 2.5.16–2.5.18)~~: mostly shipped by Build in 2.5.22–2.5.32. Don't paste. Leftovers are listed under Flags above. | superseded |
| 1 | 2.5.44 | bertopia-basics-1.md: Lever, Push Button, the other doors + double + lock, day/night + toggles, Light Up badges, ores per ORE-TABLE (the Wood Door from 2.5.42 stays) | [ ] |
| 2 | 2.5.45 | bertopia-basics-2.md: Glow Pebble T1, Glow Stick T2, Jumbo (Tube + 2 Glow Mix + 1 Booster Dye, no Salt), Cold Vial, colors, caps, minimap, lessons | [ ] |
| 3 | 2.5.46 | bertopia-basics-3.md: Solar Panel (6-charge cell), Glow Strip, Copper Wire, powered sliding door, `power.js` (T5) | [ ] |
| 4 | 2.6.0 | bertopia-260.md: shared **kw-interact** module, 3 panel shapes, Slow taps, link timer, Overflow Box (the Bag 9 + 6 itself is live since 2.5.32) | [ ] |
| 5 | 2.6.1 | bertopia-260b.md: search/tabs/keys, stacks + Oven/Stash/Market/Trash, saved arrangement | [ ] |
| 6 | 2.6.2 | bertopia-storage-1.md: Cotton + Cloth, wood Backpack, shelves, Box/Double Box (Box exists), Desk/Cabinet, Glass Cabinet T3; Steel Locker + Expedition Pack T4 | [ ] |
| 7 | 2.6.3 | bertopia-storage-2.md: Paint Brush, palette, Blueprint colors, Interior Designer | [ ] |
| 8 | 2.6.4 | bertopia-bot-cargo.md: Bot H1 Cargo Bay (T5; steady amber low-battery ring, no blink) | [ ] |
| 9 | 2.6.5 | bertopia-storage-4.md: Item Tubes, Extractor, Powered/Filter Tube, Sorter | [ ] |
| 10 | 2.6.6 | bertopia-storage-5.md: Storage Network | [ ] |
| 11 | 2.6.7 | bertopia-storage-3.md: Teleport Pads + Delivery Drone/Dock | [ ] |
| 12 | 2.6.8 | bertopia-storage-6.md: Battery Box, Network Pad, Networked Dock | [ ] |
| 13 | 2.6.9 | bertopia-fun-1.md: Pet Rock, Gravity Hat + Spring Pad, Disco Floor | [ ] |
| 14 | 2.6.10 | bertopia-music-1.md: Note Block, instruments, Jukebox + DJ Berty Discs | [ ] |
| 15 | 2.6.11 | bertopia-holidays-1.md: holidays.json calendar, first 4 packs | [ ] |
| 16 | — | Worlds/Workshop, Effects, Bertodex + ores (Tin → Bronze 8:1), NEXT-50 goals 28–50: briefs not written yet | [ ] |

The basics/storage/fun briefs still name older "keep passing" versions in their bodies. The START line is what counts: each one starts from the version in the row above.
Out of scope until Diego decides: Bobbleheads; the TechWorks server side of the Teacher flag.

## 4. Locked rules (read before building; use the numbers exactly)
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
