# Bertopia FIX-LIST (live fix list for the Build chat)
Read this first on every Bertopia ship. In the same commit, tick `[x]` on each item you finished, and add your version to "Next up". Proof (Debugzy) updates "Live now" and the changelog. Docs only: no app code.
Updated Sun Oct 4 2026, 6:50 AM ET.

## 1. Live now
- **Bertopia 2.5.13**, commit `6e2110b` ("Pick up shows the counter, and tool words are translated"), at https://apps.kulibert.net/blocks/
- **Proof verdict: FAIL** (Oct 4, 6:28–6:45 AM ET; live app.js byte-identical to the 6e2110b build). Proof: `proof/bertopia-2513/RESULT.md` (Debugzy's box).
- Still passing in 2.5.13: Copy/Paste (Creative and Survival, half-air clip), Fill/Walls with the held block, size chip hides, hotbar repaints on spend and Undo, pickBlock/tapCorner toasts (en, ru), sale ⚙ 6 and Take till once, Pick up card, Save → reload keeps the Survival world, oven, fuel and Glass, 0 console errors, ☰ by touch, no test hooks on live.

## 2. Open fixes (from proof/bertopia-2513/RESULT.md; goal numbers = NEXT-50)
Fix brief: `briefs/fixq/bertopia-2513b.md` → **BT 2.5.14**.
- [x] **Goal 1 (Oven):** the Input strip is wiped by the 1 s `paint.timer` repaint (gone by 1.25 s; the 1366 tap missed).
- [ ] **Goal 1 (Oven):** strip tiles show raw keys ("sand", "flour") with the whole `atlas.png` as the picture, and show even when the bag can't pay.
- [ ] **Goal 1 (Oven):** `addInput` matches only `in[0]`, so Flour 1 bakes a Cupcake. It must use the whole `in` list (Flour 2 → Bread).
- [ ] **Goal 1 (Oven):** after a reload into the Survival world, `#mode-chip` reads "Creative".
- [ ] **Goal 2 (Survival tools):** the size chip and Walls toast are raw English ("fill 12", "walls 16"). Needs `fillN`/`wallsN` in 8 languages.
- [ ] **Goal 3 (words):** 5 stray `changelog/tourMove: 'Move with the pads'` lines remain in `strings-extra.js` (lines 55, 72, 89, 106, 123).
- [ ] **Goal 3 (words):** tour steps 2–6 are English in es, ar, fa-AF, rw and ti (uk and ru OK).
- [ ] **Goals 1–3 (DONE rule):** `tools/smoke.mjs` was untouched in 2cc31a5 and 6e2110b. It must run every Accept through real taps at 412x915 and 1366x768.
- [ ] **Goal 50 (P2, carried over):** Break/Place text 3.2–3.7:1 over terrain at phone sizes; the Bag tile covers hotbar slots 5–6 at 412; "Menu", "SETTINGS", "HELP" and "Creative" headers in English in es.

## 3. Next up (paste order; one version each, prove before the next)
| # | Version | Brief (`briefs/fixq/`) | Goals | Status |
|---|---|---|---|---|
| 1 | 2.5.14 | bertopia-2513b.md | 1–3 fixes | [x] strip stays |
| 2 | 2.5.15 | bertopia-basics-1.md: LED Lantern + Battery Cell + Charger, 4 doors + double + lock, day/night + toggles + Light Up badges | 4, 5 | [ ] |
| 3 | 2.5.16 | bertopia-basics-2.md: Glow tiers T1–T4, colors, caps, minimap, lessons | 5 | [ ] |
| 4 | 2.5.17 | bertopia-basics-3.md: Solar Panel, Glow Strip, Copper Wire links, powered sliding door, `power.js` | 4, 5 | [ ] |
| 5 | 2.6.0 | bertopia-260.md: small Bag (Hotbar 9 + Pockets 6 = 15), 3 panel shapes, tabs, tap first, drag extra | 6–8 | [ ] |
| 6 | 2.6.1 | bertopia-260b.md: search/tabs/keys, stacks + Oven/Stash/Market/Trash, saved arrangement | 9–11 | [ ] |
| 7 | 2.6.2 | bertopia-storage-1.md: Cloth, 3 Backpacks, shelves, Box/Double Box, Locker, furniture | 12 | [ ] |
| 8 | 2.6.3 | bertopia-storage-2.md: Paint Brush, palette, Blueprint colors, Interior Designer | 13 | [ ] |
| 9 | 2.6.4 | bertopia-bot-cargo.md: Berty's Bot H1 Cargo Bay | 14 | [ ] |
| 10 | 2.6.5 | bertopia-storage-4.md: Item Tubes, Extractor, Powered/Filter Tube, Sorter (Copper tier) | 15 | [ ] |
| 11 | 2.6.6 | bertopia-storage-5.md: Storage Network: Core, Bays, Drives, Link, Terminal (Silicon tier) | 16 | [ ] |
| 12 | 2.6.7 | bertopia-storage-3.md: Teleport Pads + Delivery Drone/Dock (gated after a Network Core) | 17 | [ ] |
| 13 | 2.6.8 | bertopia-storage-6.md: Battery Box, Network Pad, Networked Dock "Deliver to me" | 18 | [ ] |
| 14 | 2.6.9 | bertopia-fun-1.md: Pet Rock, Gravity Hat + Bounce Block, Disco Floor | 19 | [ ] |
| 15 | 2.6.10 | bertopia-music-1.md: Note Block, instruments, Jukebox + DJ Berty Discs, volume + teacher mute | 20 | [ ] |
| 16 | 2.6.11 | bertopia-holidays-1.md: holidays.json calendar (14 approved packs), first 4 packs, culture cards | 21 | [ ] |
| 17 | — | NEXT-50 goals 22–50: Progress Core, Molten Chasm, Circuit Daily, Daily Board, Cross-app, Bot Blockly, Polish | 22–50 | [ ] |

Out of scope until Diego decides: Bobbleheads (inert until PvP arenas open; default nobody). Holiday packs 5–14 come in holidays-2/3.

## 4. Locked rules (read before building; use the numbers exactly)
- [BERTOPIA-BASICS-GM-2026-10-04.md](docs/BERTOPIA-BASICS-GM-2026-10-04.md): A1–A4 economy, Lantern, Doors, Day/night, Glow tiers (they supersede the single stick), Bot Cargo Bay.
- [BERTOPIA-STORAGE-SPEC.md](docs/BERTOPIA-STORAGE-SPEC.md): the single source of truth for Bag, Backpacks, furniture, Paint, Tubes, Network, Pads, Drone, Energy and Badges.
- [BERTOPIA-FUN-ITEMS-SPEC.md](docs/BERTOPIA-FUN-ITEMS-SPEC.md): Pet Rock, Gravity Hat, Disco Floor, Bounce Block, Music, Holiday packs (all 14 approved Oct 4). Bobbleheads stay out.
- [BERTOPIA-PROGRESSION-PLAN.md](docs/BERTOPIA-PROGRESSION-PLAN.md): Cogs, the 7-tier materials ladder, badges, dailies. Copper tier = T5 Copper + Circuits (Fabricator). Silicon tier = T5 Logic Gates (GM to confirm).
- Open GM questions: Survival sources for Steel, Copper, Zinc, Silicon, Cotton, Plastic Tube, Salt, Glass Vial, Ice and Copper dust; Lever/Push Button recipes; wire placement style; panel "lit all night" vs solar 0 at night; "Chest" = Box?; Bounce Block vs ladder Spring Pad; "lit blocks" meaning.

## 5. Proof changelog
| Version | Commit | Proof verdict (ET) |
|---|---|---|
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
