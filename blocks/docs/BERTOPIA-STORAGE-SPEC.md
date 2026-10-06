# Bertopia Storage & Logistics Spec (GameMaster, Oct 4 2026 6:38 AM ET)
> **Roles and worlds (6:56 AM):** "Teacher" means anyone Diego gives the TechWorks Teacher flag (staff, club officers, kid helpers), not a fixed staff list. "Creative" = the Build world (Teacher flag only) and "Survival" = the Game world (everyone). See BERTOPIA-WORLDS.md.

Single source of truth. Supersedes the 6:35 / 6:36 / 6:37 chat replies.
Rules for everything: crafted only, never bought with Cogs, items are NEVER lost. Kid-readable, tap-first, works on phone portrait/landscape and Chromebook.
New materials: Cloth (3 Cotton, grown). Uses existing Steel, Glass, Planks, Copper Wire, Battery Cell (Copper+Zinc), Plastic Tube, Silicon, Charger, Solar Panel.

## Build phases (ship in this order; same order as in-game unlocks)
| Phase | Ships | In-game unlock |
|---|---|---|
| 1 Basics | Bag, Backpacks, Shelf/Wall Shelf/Box/Locker, Furniture, Paint Brush, Bot Cargo Bay | Start (Wood/Cloth) |
| 2 Tubes | Item Tube, Extractor, Filter Tube, Sorter, Powered Tube, Battery Box | Copper tier |
| 3 Network | Cable, Network Core, Drive Bay, Drives, Terminal, Storage Link | Silicon tier |
| 4 Long range | Teleport Pads, Delivery Drone, Network Pad/Dock links | after Network Core built |
Debugzy maps "Copper tier"/"Silicon tier" to the exact rungs in BERTOPIA-PROGRESSION-PLAN.md.

## Energy (shared by every powered block)
Unit = 1 charge.
- Charger (wall-outlet style): supplies 5 charge/min, always.
- Solar Panel: 2.5 charge/min in daylight, 0 at night (dusk/dawn half).
- Battery Box: 4 Battery Cell + 1 Steel; stores 40 charges; fills from Charger/Solar, drains at night.
- Lesson card: "Making power, storing power, using power."
- Out of power never loses items: blocks just pause or slow.

## Phase 1 — Basics
**Bag:** Hotbar 9 + Pockets 6 = 15 (vs Steve 36). 2.6.0 panel tabs: Hotbar | Pockets | Backpack (if worn) | Bot (within 8 blocks). Tap item → tap slot/tab; drag also works. Keeps contents on respawn.
**Backpacks** (one worn, back slot; swap keeps contents in the pack; no speed penalty; max carry 33):
- Satchel 3 Cloth: +6 · Backpack 6 Cloth + 1 Steel: +12 · Expedition Pack 8 Cloth + 2 Steel + 1 Box: +18
**Storage & furniture** (tap to open; drawers slide / doors swing 0.2 s with soft sound; instant with reduced motion; breaking drops contents into Bag, overflow into a dropped Box):
| Block | Recipe | Slots | Shows items |
|---|---|---|---|
| Wall Shelf (wall mount) | 2 Planks | 3 | all 3 |
| Shelf (freestanding) | 3 Planks | 4 | all 4 |
| Side Table | 3 Planks | 6 (1 drawer) | no |
| Desk | 5 Planks + 1 Steel | 12 (2 drawers) | 1 on top |
| Box | 8 Planks | 18; two side by side merge to Double Box 36 | no (Sign label) |
| Cabinet | 6 Planks + 1 Steel | 24, lockable | no |
| Glass Cabinet | Cabinet + 1 Glass | 24, lockable | top 4 |
| Steel Locker | 6 Steel + 1 Box | 36, lockable | no |
Locks follow door rules (owner + crew; teacher override; off in arenas).
**Berty's Bot H1 Cargo Bay:** 9 / 18 / 27 (see bot spec).
**Paint (free, looks only):** Paint Brush 1 Planks + 1 Cloth (craft once; in Creative palette). 24 swatches, first row = HUD tokens teal, cyan, blue, Berty purple; then brights, pastels, neutrals, woods; Custom picker + 8 saved slots. Per block; furniture two-tone (body/trim); Fill connected same-color up to 64; Eyedropper; Undo 20. Own builds or crew builds that allow it; teacher override. Style Shop stays avatar/HUD only. Blueprints keep colors; on import "Keep their colors" (default) or "Use my palette"; card shows 4-color strip.

## Phase 2 — Item Tubes, Filters, Sorters
- **Item Tube:** 1 Glass + 1 Copper Wire → 4. Clear glass; items visibly slide through (render max 1 item per tube block). Passive speed 2 blocks/s, no power. Auto-connects to neighbors; tap a tube end to connect/disconnect (cyan ring = connected, gray = open).
- **Extractor:** 1 Steel + 1 Copper Wire + 1 Plastic Tube. Snaps onto any storage block; pulls 1 stack every 2 s into the tube. Costs 1 charge per 10 stacks moved. Tap to set: "Pull everything" or "Pull only…" (same filter picker).
- **Powered Tube:** Item Tube + 1 Copper Wire. 6 blocks/s; 1 charge per minute while items are moving.
- **Filter Tube:** Item Tube + 1 Steel. Tap to set a rule: By Item (pick up to 6), By Type (Wood, Stone, Metal, Glass, Plant, Food, Tools, Light, Machines, Decor), or By Color (paint color). Matching items enter; non-matching skip past it.
- **Sorter:** 2 Steel + 1 Copper Wire + 1 Glass. Junction with up to 4 outputs; each output gets a rule chip; one output can be "Everything else."
- **Destination full / no route:** items stop and wait in the tube (red pulse on the jam), Extractor pauses; nothing pops out. Breaking a tube with items inside sends them to the nearest connected storage, else to the Bag.
- Limits: 512 tube blocks per player per world; max 64 items in transit per connected tube group.
- Lesson cards: "Conveyors move goods." "Sorting = putting things into groups (categories)." "A jam backs up the whole line."

## Phase 3 — Storage Network (AE-style, kid-readable)
- **Network Cable:** 1 Copper Wire + 1 Plastic Tube → 8. Thin cable; tap ends to connect like tubes.
- **Network Core:** 4 Steel + 2 Glass + 2 Copper Wire + 2 Battery Cell. 1 per player per world. Uses 1 charge/min + 1 charge/min per Drive Bay.
- **Drive Bay:** 4 Steel + 1 Copper Wire. Holds 4 Drives. Max 16 bays per network.
- **Drives** (teach "how many kinds" vs "how many items"):
  - Drive S: 1 Steel + 1 Glass + 1 Copper Wire → 8 kinds, 512 items
  - Drive M: 2 Drive S + 1 Silicon → 32 kinds, 2,048 items
  - Drive L: 2 Drive M + 2 Silicon + 1 Battery Cell → 64 kinds, 8,192 items
  - A pulled Drive is an item that keeps its contents (open it like a Box).
- **Storage Link:** 1 Copper Wire + 1 Steel. Snaps onto any Box/furniture/Locker so the network can see and use it.
- **Terminal:** 2 Glass + 1 Steel + 1 Copper Wire. Search box, chips for Type/Color, sort by Count / A–Z / Recent; tap an item to take a stack to the Bag; tap a Bag item to store it (network picks a Drive or linked Box with room).
- **Show Network:** button highlights all connected parts in cyan with flowing dots (nodes and links lesson).
- **No power:** Terminal dims to "Low Power: search off"; you can still withdraw by tapping items in the list (slow, 1 stack/2 s) or pull Drives by hand. Nothing lost.
- Access: Private (default) / Crew can take / Crew can take + store. Teacher view always.
- Lesson cards: "A network connects many places into one." "The Terminal is like a search engine for your stuff." "Kinds vs amount: a drive fills up either way."

## Phase 4 — Teleport Pads and Delivery Drone
**Teleport Pads (items only, never players):** 2 Steel + 2 Copper Wire + 1 Glass + 1 Battery Cell → pre-paired pair (shared glyph); re-pair by tapping one with the other in hand; 4 pairs per player. Drop/tap a stack on a pad → arrives in partner's 9-slot tray. 10 stored charges; send costs 1 (≤64 blocks), 2 (≤256), 3 (beyond). Recharge from the Energy rules (full in 2 min next to Charger, 4 min Solar in daylight, else 1/min). Cooldown 3 s, whole-world range. Full tray or no charge → item stays on sender. Access: Private / Crew send / Crew send + take. **Network Pad:** a pad with a Storage Link sends into / pulls from the network.
**Delivery Drone (1 per player):** 2 Steel + 4 Copper Wire + 2 Battery Cell + 1 Glass + 4 Plastic Tube. Dock = 1 Charger + 2 Planks (full charge 2 min). Payload 4 slots, 8 blocks/s, 3 min flight per charge. Targets: owned Dock, storage, furniture, you, or your Bot. Flies 3 blocks above the tallest block on the route, straight line, shown on map. Blocked → climbs to reroute, after 10 s returns home. Low battery → lands on nearest safe block (never water/lava), beacon, waits; Battery Cell or walking it home recovers. Target full → leftovers fly back. **Networked Dock:** Terminal gets a "Deliver to me" button that sends up to 4 stacks by drone.
Lesson: "Every delivery trades speed, cost, and how much it carries." Pads = instant but energy-hungry; Drone = slow, cheap, visible; Tubes = steady and free for short runs.

## Creative vs Survival
Creative: all blocks in the palette, no energy costs, Bag shows the palette. Survival: everything above.

## Badges
Pack Rat (first Backpack) · Interior Designer (paint 50 blocks) · Tube Tycoon (first tube delivery) · Sort It Out (sort 100 items) · Network Admin (4 storage blocks on one network) · Night Shift (network runs through a night on a Battery Box) · Beam It (first pad send) · Air Mail (first drone delivery) · Supply Chain (move items by Bot, tube, pad and drone in one day)


GameMaster 2026-10-06: open questions answered in BERTOPIA-GM-ANSWERS-2026-10-06.md (same folder) (Paint dab = Berry at Workbench; Plastic Tube via Oven, not Smelter; Silicon made at Smelter, used by Fabricator; one Pick per tier, no durability; quick tap never breaks blocks in the Game world; static water + ores = world-1 right after 260b, snow/biomes = world-2). That file overrides older lines here.
