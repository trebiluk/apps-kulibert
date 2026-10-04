# Bertopia FIX-LIST (live fix list for the Build chat)
Read this first on every Bertopia ship. In the same commit, tick `[x]` on each item you finished, and add your version to "Next up". Proof (Debugzy) updates "Live now" and the changelog. Docs only: no app code.
Updated Sun Oct 4 2026, 7:40 AM ET.

## 1. Live now
- **Bertopia 2.5.14**, commit `d47a8d3` ("the oven strip stays until a tile tap", 7:04 AM ET), at https://apps.kulibert.net/blocks/
- **Proof verdict: FAIL** (Oct 4, 7:12–7:35 AM ET; live app.js byte-identical to the d47a8d3 build). Proof: `proof/bertopia-2514/RESULT.md` (Debugzy's box).
- Now passing: the Oven strip stays past 3 s; a tile spends the whole recipe (Sand 2 → Glass, Flour 2 → Bread, Flour 1 shows no Bread tile); the chip reads Survival after reload; tour steps 1–6 in all 8 languages.
- Still passing: Copy/Paste (Creative and Survival, half-air), Fill/Walls + Undo/Redo, pickBlock toasts (en, ru), sale ⚙ 6 and Take till once, Pick up card, Save → reload keeps the world, 0 console errors, ☰ by touch, Esc 6/6, no test hooks on live. `#kp-live` isn't on `/blocks/` (prefs not loaded), so hotbar slot 1 is clear.

## 2. Open fixes (from proof/bertopia-2514/RESULT.md; goal numbers = NEXT-50)
Fix brief: `briefs/fixq/bertopia-2514b.md` → **BT 2.5.15**. It ships before anything in Next up.
- [x] **Goal 1 (Oven):** strip wiped by the 1 s repaint. Fixed in 2.5.14.
- [x] **Goal 1 (Oven):** `addInput` matched only `in[0]`. Fixed in 2.5.14 (Flour 2 → Bread).
- [x] **Goal 1 (Oven):** `#mode-chip` read "Creative" after reload. Fixed in 2.5.14.
- [x] **Goal 3 (words):** stray `tourMove` lines and English tour steps. Fixed in 2.5.14.
- [x] **Goal 1 (Oven):** every recipe tile has the same tan square instead of the input's picture; tiles show only `in[0]`.
- [x] **Goal 1 (Oven):** tiles overlap at 1366 (Flour on Sand) and the Bread tile is cut off at 412. No "Nothing to bake yet" line when nothing is payable.
- [x] **Goal 1 (Oven, P2):** the Output tile shows the raw key ("Output glass"), and Input reads "Input Input".
- [x] **Goal 2 (words):** `fillN`/`wallsN` exist only in en, so ru shows "Fill 32" and "Walls 24".
- [ ] **Goals 1–3 (DONE rule):** `tools/smoke.mjs` runs at 412 only, with `.click()` and `stations.paint`, has 3 checks, and dropped the old gates. Its own "1b sand spent" fails.
- [ ] **Goal 50 (P2, carried over):** Break text 3.6–3.7:1 over terrain at phone sizes; "Menu", "SETTINGS", "HELP" and "Creative" English in es; "Red brick" untranslated in ar and fa-AF.

## 3. Next up (paste order; one version each, prove before the next)
2.5.15 (`bertopia-2514b.md`, the 2.5.14 leftovers) goes first; the open fixes above are its checklist.

| # | Version | Brief (`briefs/fixq/`) | Goals | Status |
|---|---|---|---|---|
| 1 | 2.5.16 | **Core mechanics lock:** bertopia-core-1.md: one-thumb stick + Jump, FOV + touch 3rd person, walk/run/crouch + fixed 1.25 jump (no double jump), press < 500 ms = Place/Use, ≥ 500 ms = Mine (cracks from 250 ms) + tool multipliers, long-press never picks | 4 | [ ] |
| 2 | 2.5.17 | **Core mechanics lock:** bertopia-core-2.md: Creative/Build world for the Teacher flag only (UI-side), reach, drops never despawn + Lost & Found, E/Q/0 keys, never place inside a player, R rotate | 5 | [ ] |
| 3 | 2.5.18 | **Core mechanics lock:** bertopia-core-3.md: crafting groups (Can make now / Almost / Show all) + ×Max, store sells only found materials, Controls settings | 6 | [ ] |
| 4 | 2.5.19 | bertopia-basics-1.md: wood Phase 1, tier gates (T4/T5 gated), Stick/Lever/Button, 4 doors + double + lock, day/night + toggles + Light Up badges (lit-block rule), ores per ORE-TABLE (Iron, Copper, Zinc, Coal) | 7, 8 | [ ] |
| 5 | 2.5.20 | bertopia-basics-2.md: Glow Pebble T1, Glow Stick T2, Jumbo (Tube + 2 Glow Mix + 1 Booster Dye, no Salt), Cold Vial, colors, caps, minimap, lessons | 8 | [ ] |
| 6 | 2.5.21 | bertopia-basics-3.md: Solar Panel (6-charge cell), Glow Strip, Copper Wire placement, powered sliding door, `power.js` (T5) | 7, 8 | [ ] |
| 7 | 2.6.0 | bertopia-260.md: shared **kw-interact** module + small Bag (Hotbar 9 + Pockets 6 = 15), 3 shapes, tap first, Overflow Box, Slow taps, keyboard-friendly link timer, `#kp-live` clear of slot 1 | 9–11 | [ ] |
| 8 | 2.6.1 | bertopia-260b.md: search/tabs/keys, stacks + Oven/Stash/Market/Trash, saved arrangement | 12–14 | [ ] |
| 9 | 2.6.2 | bertopia-storage-1.md: Cotton + Cloth, wood Backpack (6 Cloth + 2 Planks), shelves, Box/Double Box, Desk/Cabinet, Glass Cabinet T3; Steel Locker + Expedition Pack T4 | 15 | [ ] |
| 10 | 2.6.3 | bertopia-storage-2.md: Paint Brush, palette, Blueprint colors, Interior Designer | 16 | [ ] |
| 11 | 2.6.4 | bertopia-bot-cargo.md: Berty's Bot H1 Cargo Bay (T5; Bays II/III need a Box; low battery = steady amber ring, no blink) | 17 | [ ] |
| 12 | 2.6.5 | bertopia-storage-4.md: Item Tubes, Extractor, Powered/Filter Tube, Sorter (Copper tier = T5 Fabricator) | 18 | [ ] |
| 13 | 2.6.6 | bertopia-storage-5.md: Storage Network (T5 complete; Silicon at Logic Gates; Drive L needs the Clean Bench, T7) | 19 | [ ] |
| 14 | 2.6.7 | bertopia-storage-3.md: Teleport Pads + Delivery Drone/Dock (T5; after a Network Core) | 20 | [ ] |
| 15 | 2.6.8 | bertopia-storage-6.md: Battery Box, Network Pad, Networked Dock "Deliver to me" (T5) | 21 | [ ] |
| 16 | 2.6.9 | bertopia-fun-1.md: Pet Rock, Gravity Hat + Spring Pad (T4; Boing! at a 6 bounce), Disco Floor | 22 | [ ] |
| 17 | 2.6.10 | bertopia-music-1.md: Note Block, instruments, Jukebox + DJ Berty Discs, class mode 25%, teacher mute | 23 | [ ] |
| 18 | 2.6.11 | bertopia-holidays-1.md: holidays.json calendar (14 approved packs), first 4 packs, culture cards | 24 | [ ] |
| 19 | — | Worlds/Workshop (BERTOPIA-WORLDS.md): Workshop Door, Publish + Undo Publish; needs TechWorks Teacher-flag wiring (Diego). Brief not written yet. | 25 | [ ] |
| 20 | — | Effects (BERTOPIA-EFFECTS-SPEC.md): Lab Bench, Levels I–III, chips, max 3, off zones. Brief not written yet. | 26 | [ ] |
| 21 | — | Bertodex + ores (BERTOPIA-ORE-TABLE.md + ELEMENT-ECONOMY.md): Tin → Bronze (8 Cu + 1 Sn → 9), mass-ppm columns only. Brief not written yet. | 27 | [ ] |
| 22 | — | NEXT-50 goals 28–50: Progress Core, Molten Chasm, Circuit Daily, Daily Board, Cross-app, Bot Blockly, Polish | 28–50 | [ ] |

Out of scope until Diego decides: Bobbleheads (inert until PvP arenas open; default nobody); the TechWorks server side of the Teacher flag. Holiday packs 5–14 come in holidays-2/3.

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
