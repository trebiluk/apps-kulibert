# Bertopia: worldgen, ore, resources and scarcity

Report only, no code. Read from `bloxbert-src` on main `f502b70e`, Oct 31 2026.
Files: `worldgen.js`, `data/recipes.js`, `data/items.js`, `data/econ.js`, `data/gates.js`, `feel.js`, `drops.js`, `stations.js`, `conveyor.js`, `econ/store.js`, `econ/vend.js`, `mobs.js`, `basics.js`, `session.js`, `packs/farm/pack.js`.

Design truth used: one shared 24/7 world for 20–30 kids, per-chunk saves, keep-inventory on, PvP off, locked shop prices, gifting by dropping, mid/low Chromebook floor, 40-minute sessions, goal is materials thinking without grind walls or rewards for hoarding.

## 0. What the code says in one paragraph

The world below the grass is three layers: 3 of dirt, then stone to bedrock at y = −64, with coal in hashed 6×6×4 pockets between y −3 and −28. Nothing else is in the ground. Trees are one per 9×9 cell at 18% odds (about one tree per 450 surface blocks) plus 7 fixed trees, a 19-block stone mound and 9 sand blocks by spawn. Mining has no tool gate at all: `toolEnough()` returns true and `gateDig()` never blocks, so every block is hand-mineable, just slower. Tools never wear (`TOOL_LIFE` is empty). The metal chain exists only as data: ore ids 44–46 are never generated, the T4/T5 gate only opens from a test hook, and the smelter/fabricator blocks have no panel. There is no iron, copper or steel tool recipe at all; `TOOL_X` has copper (4×) and steel (6×) speed tiers that nothing can reach. Progression therefore ends at the stone tool, about 8 minutes in.

## 1. Resource map

Rates are for one kid in a 40-minute session, with walking and a 2-second hand swing per block. "Max" assumes the kid does nothing else.

| Resource | Source | Rate / session | Consumed by | Status |
|---|---|---|---|---|
| **log** | trees: 7 starter (6 logs each) + wild 18% per 9×9 cell, 4–6 logs; saplings regrow in 8 min | 60–150 (max ~400) | planks, workbench, woodshop, sells 2 cogs | fine beyond the spawn lawn |
| **planks** | hand craft, 1 log → 4 | unlimited from logs | 17 recipes (`plankAny`), oven fuel (1 bake), sells 1 cog | fine |
| **stick** | bench, 2 planks → 4 | unlimited | wand, tools, hoe, lamps; mob drop (rustbot 4) | fine |
| **leaves** | tree crowns, 0.2 s | hundreds | nothing | orphan block (sapling roll 1/6 is its only value) |
| **sapling** | 1 in 6 leaf blocks; `give` tops a kid up to 2 at a hook | 5–20 | plant → tree in 8 min | fine, but only if kids plant |
| **stone** | everything below dirt, 3 s hand / 1.5 s wood / 1 s stone | 100–300 (max ~700) | oven, bricks, tools, lever, conveyor, `stoneAny` | effectively infinite |
| **coal** | pockets y −3…−28, ~29% of voxels inside a pocket, 3.5 s | 20–80 once a kid digs down | oven fuel (8 bakes), smelter recipe, steel | plentiful; no reason to dig past −30 |
| **slate** | generated? no (`stoneAny` alias only) | 0 | `stoneAny` | **dead end**: id 4 exists, worldgen never places it |
| **dirt / grass / gravel / clay** | surface, banks, pond beds | hundreds | nothing crafts from them | fine as building blocks; clay is an orphan |
| **sand** | 9 starter + beaches, lake bands, pond beds | 20–100 | glass (2 → 1) | fine |
| **redSand** | not generated | 0 | brickRed → smelter | **dead end** |
| **snow / ice** | snow: not generated. ice: the town pond's surface (16 blocks, y = 4) | 0 snow; ice is a fixed 16 | the `ice` recipe (4 snow → 1) | snow is a **dead end**, so the recipe is unreachable; ice itself is only the pond skin |
| **glass** | oven, 2 sand, 5 s | ~40 at one oven | vend, wand, glasses, glass door, fabricator | fine |
| **brickGrey** | bench, 2 stone → 2 | unlimited | building | fine |
| **brickRed** | oven, 2 redSand | 0 | smelter (8) | **dead end** |
| **wool ×4** | shop sells blue and red at 4 cogs; green only as the parkour finish pads (Maker worlds); tan from nowhere | shop only | bunk, chair, tape, rug (4) | tan is a **dead end**, green is a quirk; blue/red shop-gated |
| **berry** | foraged tufts, 2–3 per tuft, bushes regrow | 20–60 | cupcake, sells 1 cog | fine |
| **wheat / seeds / flour** | farm pack: hoe, farmland, grow | 10–40 wheat | flour → bread, cupcake | fine (bread is oven-only by design) |
| **sugar** | shop only, 3 cogs | shop | cupcake | shop-gated |
| **ironOre / copperOre / zincOre** | **never generated**, no drop, not in shop | 0 | ingots | **dead end** (root of everything below) |
| **ironIngot** | smelter (gated T4) | 0 | sewing, tape, saw, hammer, woodshop, floor lamp, wall lamp, steel | **dead end**, 7 ungated recipes stall here |
| **copper / zinc ingot, steel, copperWire, batteryCell** | gated chain | 0 | fabricator, lantern, charger, sliding/metal doors, override key | dead end |
| **keeperCore** | Foundry keeper reboot (C5, alias-only) | 0 in the main world | overrideKey | dead end by design (cosmetic arena) |
| **pinecone** | flora pack | some | oven fuel (1) | fine |
| **woodTool / stoneTool / hoe / wand** | bench | 1 each | nothing (no wear) | **orphans after first craft**; nothing ever consumes a tool |

Orphans (made, never used): leaves, clay, gravel, grass, brickGrey beyond decoration, every tool after the first one, `charger` (a craftable block with no behaviour), `lantern` light aside.

Dead ends (needed, never obtainable in Survival): slate, redSand, snow (so the ice recipe), brickRed, woolTan, all three ores and everything downstream (12 gated recipes + 7 ungated ones + 2 woodshop decor items).

## 2. Scarcity in one shared world

What 25 kids on one map actually exhaust:

- **The spawn lawn, first session.** 7 starter trees (42 logs), the 19-block mound and the 9 sand blocks are deterministic and never come back (only saplings regrow, and only if planted). By minute 10 of the first class the lawn is bare. That is not a supply problem (wild trees are ~70 within 100 blocks, stone is infinite) but it is a **first-impression and first-timer problem**: a kid who joins in week two sees a stripped lawn and has to walk before the tutorial loop ("chop, make a tool, mine stone…") works.
- **Coal near spawn.** Pockets are 6×6×4 regions at 42% occupancy; under the town box there are dozens. Fine for a class.
- **Nothing else is scarce.** Stone, dirt and sand are effectively infinite; wood regrows; berries and wheat regrow.

What the design invites today:

- **Hoarding has no payoff but no cost.** Drops never despawn, the ground holds 256 piles then overflows to Lost & Found, boxes hold 18 stacks, keep-inventory is on. A kid can fill boxes with 64-stacks of stone forever; it harms nothing and gains nothing (stone is unsellable). Sellables are capped at 20 units per item per kid per day, which caps the only hoard that could matter.
- **Griefing vectors that exist:** stripping the spawn lawn (above), filling the drop cap with junk so other kids' drops go to Lost & Found (256 is per world), and building on top of other kids' chests/ovens outside the protect ring. The `protect` zone and "Bertyville is a safe zone" cover spawn; outside it there is no per-kid claim.
- **Griefing vectors that don't:** no fire, no TNT, no water buckets, PvP off, keep-inventory. Good.

Recommendations (regen and per-kid rules):

1. **Regrow the spawn lawn on a timer, not on saplings.** Treat the 7 starter trees, the mound and the sand patch like the farm's bushes: if the block is air and the spot has been empty for N minutes (say 20, half a session), put it back. Cheap: it's the same `starterWood/Stone/Sand` test the generator already runs, re-applied by `basics.js` on its existing sapling timer. This keeps the tutorial loop working for every newcomer and removes the only true scarcity.
2. **Make the drop cap per kid, not per world.** `DROP_CAP = 256` shared across the class means one kid's junk evicts everyone's drops. 32 per kid, with the oldest of *that kid's* piles going to Lost & Found, removes the grief and keeps Chromebook load the same (≤ 25 × 32 = 800 piles is too many to render; keep the world render cap at 256 but evict per owner).
3. **A soft claim radius around a placed box or oven** (not a protect ring): other kids can't break blocks within 2 of it unless the owner is absent for a week. GameMaster call; it trades co-op freedom for safety.
4. **Don't add decay or tool wear as the scarcity lever.** With no tool gate and 40-minute sessions, wear is a grind wall. The scarcity worth designing is *ore* (below), because it creates a reason to go somewhere, process something and share it.

## 3. Ore plan

Goal: ore is a real sourcing decision (where, how deep, what it costs to get out) and the smelter is a real process (fuel, time, yield), without adding chunk-gen cost or save weight.

**Generation (zero added cost).** `coalHere()` already pays one region hash and one voxel hash for every stone voxel below `h − 3`. Replace the single `coal` branch with one lookup that returns coal, iron, copper or zinc from the *same* two hashes, split by depth and a third of the region value. No new noise, no new passes, no change to chunk size or save format (ore is just another block id in the chunk).

| Ore | Depth (y) | Pocket | Odds | Where it shows on the surface |
|---|---|---|---|---|
| coal | −3 … −28 | 6×6×4, 70% fill | as now | cave mouths (existing `caveDef`) |
| **iron** | −6 … −34 | 5×5×3, 55% fill | 1 pocket per ~14 regions | **rock outcrops** (`rockDef`): 2–4 iron blocks in the outcrop's top layer, so a kid *sees* ore before digging |
| **copper** | −14 … −44 | 4×4×3, 50% fill | 1 per ~18 regions | cave walls below −10 |
| **zinc** | −24 … −56 | 3×3×3, 45% fill | 1 per ~24 regions | none; it is the "go deep" ore |

Biome tie: iron favours hills (`hillsAt ≥ 2`), copper favours river/lake banks (the gen-5/6 water columns), zinc is depth-only. All three are already computed per column, so the bias is one comparison.

**Why this shape.** Depth ordering is the lesson (iron is shallow and common, zinc is deep and rare, that's why zinc batteries cost more). Outcrop iron gives a visible first find within a short walk. Pockets are small enough that a class *shares* a pocket and empties it, which is the co-op nudge: "the iron on the hill is gone, who found the next one?"

**Tool gate, soft.** `toolNeed()` already says ore wants a stone tool; `toolEnough()` ignores it. Enforce it only for `*Ore` blocks and only as *time*: hand = 12 s per ore block, wood tool = 6 s, stone tool = 3 s. No "you can't" wall, just a clear reason to make the tool first.

**Smelter as a process.** Reuse the oven's station record (`stations.js` already has fuel, staged recipe, `until`, `left`):

- Fuel: coal only (8 runs per lump), planks and logs do not work ("wood doesn't get hot enough" is the materials lesson; the oven keeps wood).
- Time: 4 s per ingot (recipes already say `secs: 4`), 8 s for steel.
- Yield: **2 ore → 1 ingot** (tailings), so a 5×5×3 iron pocket (~40 ore) is ~20 ingots, enough for one class to each make one iron thing with some left over. Steel = 1 ingot + 1 coal, as now.
- The smelter block needs 8 red brick; redSand is never generated, so either generate a red-sand band (riverbanks already pick `sand|gravel`; add `redSand` as the deep-bank option) or change the recipe to `brickGrey` 8 + `coal` 2. The second is the smaller change; the first is better materials teaching (red = iron oxide, which is also why rustbots rust). GameMaster call.
- Belts: `conveyor.js` only knows oven/bench/box. Add `smelter` as a machine kind (push ore + coal in, pull ingots out) so the belt tutorial hint "Belt the Smelter to the Box" becomes true.

**First iron tool.** Add one recipe: `ironTool` at bench, `ironIngot` 3 + `stick` 2, tool tier `copper` renamed `iron` in `TOOL_X` (4×). Without it the whole chain produces decor and doors but never changes how the kid mines, which is the payoff kids expect.

**Save and gen cost.** None beyond today: same voxel count, same hash count, four more block ids in `blocks-list.js` (already there). Outcrop ore adds one `rockDef` field. Per-chunk saves are unchanged.

## 4. Progression: punch-a-tree to the first iron tool

Honest path today (Survival, new world, hand swings 2 s for log, 3 s for stone, walking included):

| Step | What | Time | Cumulative |
|---|---|---|---|
| 1 | Walk to a starter tree, break 4 logs | 0:45 | 0:45 |
| 2 | Hand-craft planks (1 log → 4) | 0:05 | 0:50 |
| 3 | Workbench (4 planks, 2 s) and place it | 0:20 | 1:10 |
| 4 | Sticks, then woodTool (5 planks) | 0:20 | 1:30 |
| 5 | Walk to the stone mound (24 blocks), mine 3 stone at 1.5 s | 1:00 | 2:30 |
| 6 | stoneTool (3 stone + 2 planks) | 0:10 | **2:40** |
| 7 | Dig down to −6 for coal, make an oven (8 stone), glass | 4–6 min | ~8:00 |
| 8 | **Iron tool** | — | **does not exist** |

So the shortest honest path to a stone tool is under 3 minutes, and the first session's remaining 37 minutes have no next tool to aim for. Where it stalls:

1. **No iron tool recipe.** Even with ore and a smelter, the chain ends in sewing machines and doors.
2. **No ore.** Nothing to find below the coal layer.
3. **No tool gate.** Since the hand mines everything, the wood and stone tools are a speed bonus, not a key; a kid who skips them loses nothing visible. The soft time gate on ore (section 3) fixes that only for ore, which is the right place.
4. **Seven recipes that look reachable and aren't** (the `ironIngot` dead ends). The Crafting panel sorts them as "almost".

With the section-3 plan the path becomes: stone tool at ~3 min → walk to the hill outcrop, see iron (~5 min) → 6 ore at 3 s each → coal from the first pocket → smelter needs bricks (oven, 8 stone, 2 coal) → 2 ore per ingot, 4 s each → iron tool at **roughly 15–18 minutes**, leaving half a session to use it. That fits a 40-minute class and needs a second kid's coal or ore to go faster, which is the co-op hook.

## 5. Economy check against locked prices

Rules in `econ.js`: a kid sells at `floor(base × 0.7 × dial × max(0.5, 1 − 0.03·soldToday))`, min 1; buys at `ceil(base × 1.1)`; **20 units per item per kid per day**; the store stocks only flour, sugar, woolBlue, woolRed; townsfolk visit vending counters every 30 s, buy with chance by markup, max 20 per counter per day.

| Loop | Cost | Return | Verdict |
|---|---|---|---|
| Buy wool 4 → sell wool | 4 | 2 | loss |
| Buy 2 flour 8 → bake bread → sell | 8 | 5 | loss |
| Buy flour 4 + sugar 3, forage 2 berries → 2 cupcakes | 7 | 8 (4 each, decaying) | +1 per batch, 20/day cap → ≤ 10 cogs/day |
| Chop log 2 → 4 planks → sell | free | 4 vs 2 | planking doubles value; cap 20 planks = 20 cogs/day |
| Forage berries → sell | free | 1 each, cap 20 | ≤ 20 cogs/day |
| Vend counter at ≤ base price | items | 0.9 chance × 2 units per visit, 20/day/counter | ≤ 20 sales/day/counter |

Nothing runs away: every sellable is capped at 20 units/day/item and the 3% decay plus the 0.7 buy rate kill arbitrage. The only soft spot is **multiple vending counters**: the 20/day cap is per counter, so a kid with 5 counters gets 100 townsfolk sales/day. Make it per kid (one more key in `wallet.state`) if cogs ever buy anything that matters. Also note `start: 20` cogs and nothing in the ground is sellable, so the economy is food and wool only; ore and ingots are `sell: false`, which is right (gifting by dropping covers trade).

## 6. Ranked fix list

Smallest first. "GM" = needs a GameMaster design call, "Diego" = needs Diego's OK. Each part is one PR of ≤ 3 fixes.

**Part A: honest UI and dead ends (no design call)**
1. `craft.js` `craftStatus`: mark a recipe `gated` when any input is itself only makeable behind a closed gate (walk `RECIPES` once at load to find `ironIngot`'s gate). Kids stop seeing Hammer as "almost". Files: `src/craft.js`.
2. Remove or hide the four unreachable recipes whose inputs are never generated: `ice`, `brickRed`, and the woolGreen/woolTan `woolAny` branches show fine, so just `ice` and `brickRed` (or generate snow and redSand, see Part C). Files: `src/data/recipes.js`.
3. `conveyor.js` `beltRecipeOk`: honour `plankAny/stoneAny/woolAny` by reusing `anyList` from `craft.js`. Files: `src/conveyor.js`, `src/craft.js` (export).

**Part B: shared-world fairness (Diego OK on the lawn timer; GM on claims)**
1. Spawn lawn regrow: re-apply `starterWood/starterStone/starterSand` after 20 min of air, on the sapling timer in `basics.js`. Files: `src/basics.js`, `src/worldgen.js` (export the three tests). **Diego.**
2. Drop cap per owner: tag drops with the breaking kid's id, evict oldest-of-owner at 32, keep the world render cap. Files: `src/drops.js`, `src/session.js`.
3. Vending cap per kid instead of per counter. Files: `src/session.js`, `src/data/econ.js`. **GM** (changes the econ lesson).

**Part C: ore and the smelter (GM owns the numbers; Diego GO on T4 opening)**
1. Ore generation inside `coalHere`'s hash (iron/copper/zinc by depth, outcrop iron via `rockDef`) + four block ids already present. Files: `src/worldgen.js`. **GM** for depths and odds (table in section 3 is a proposal).
2. Smelter as a station: `machineKind` 42 → `'smelter'`, panel via the oven record with coal-only fuel, 2 ore → 1 ingot, 4 s; belt kind `smelter`; T4 opens when a kid first picks up ore (`setGate('T4')` from the pickup path) instead of goal 32. Files: `src/main.js`, `src/stations.js`, `src/conveyor.js`, `src/data/gates.js`. **Diego** on opening T4 this way.
3. First iron tool + soft ore tool gate: `ironTool` recipe (3 ingots + 2 sticks), `TOOL_X.copper` renamed `iron`, `toolEnough` enforced as time only for `*Ore`. Files: `src/data/recipes.js`, `src/data/items.js`, `src/feel.js`. **GM** on the recipe cost.

Part C also needs `smelter`'s red-brick input resolved (generate redSand on deep banks, or switch to grey brick + coal). That is a one-line recipe change either way; the design call is which lesson to keep.

Not proposed: tool wear, hunger, block decay, or any timer that takes things away. The brief's goals (sourcing, processing, tradeoffs) are all served by ore depth, smelter fuel and the 2:1 yield, none of them by attrition.
