# Bertopia: worldgen, ore, resources and scarcity

Report only, no code. Read from `bloxbert-src` on main `f502b70e`, Oct 31 2026.
Files: `worldgen.js`, `data/recipes.js`, `data/items.js`, `data/econ.js`, `data/gates.js`, `feel.js`, `drops.js`, `stations.js`, `conveyor.js`, `econ/store.js`, `econ/vend.js`, `mobs.js`, `basics.js`, `session.js`, `packs/farm/pack.js`.

Design truth used: one shared 24/7 world for 20–30 kids, per-chunk saves, keep-inventory on, PvP off, locked shop prices, gifting by dropping, mid/low Chromebook floor, 40-minute sessions, goal is materials thinking without grind walls or rewards for hoarding.

## 0. What the code says in one paragraph

The world below the grass is three layers: 3 of dirt, then stone to bedrock at y = −64, with coal in hashed 6×6×4 pockets between y −3 and −28. Nothing else is in the ground. Trees are one per 9×9 cell at 18% odds (about one tree per 450 surface blocks) plus 7 fixed trees, a 19-block stone mound and 9 sand blocks by spawn. Mining has no tool gate at all: `toolEnough()` returns true and `gateDig()` never blocks, so every block is hand-mineable, just slower. Tools never wear (`TOOL_LIFE` is empty). The metal chain exists only as data: ore ids 44–46 are never generated, the T4/T5 gate only opens from a test hook, and the smelter/fabricator blocks have no panel. There is no iron, copper or steel tool recipe at all; `TOOL_X` has copper (4×) and steel (6×) speed tiers that nothing can reach. Progression therefore ends at the stone tool, in about 3 minutes. The oven, glass and bread loops still work after that. An iron tool does not.

## 1. Resource map

Rates are for one kid in a 40-minute session, with walking and a 2-second hand swing per block. "Max" assumes the kid does nothing else.

| Resource | Source | Rate / session | Consumed by | Status |
|---|---|---|---|---|
| **log** | trees: 7 starter (6 logs each) + wild 18% per 9×9 cell, 4–6 logs; saplings regrow in 8 min | 60–150 (max ~400) | planks, workbench, woodshop, sells 2 cogs | fine beyond the spawn lawn |
| **planks** | hand craft, 1 log → 4 | unlimited from logs | 17 recipes (`plankAny`), oven fuel (1 bake), sells 1 cog | fine |
| **stick** | bench, 2 planks → 4 | unlimited | wand, tools, hoe, lamps; mob drop (rustbot 4) | fine |
| **leaves** | tree crowns, 0.2 s | hundreds | nothing | orphan block (sapling roll 1/6 is its only value) |
| **sapling** | 1 in 6 leaf blocks. A login gift tops the bag up to 2 saplings once (`main.js`) | 5–20, plus the gift | plant → 4 logs after 8 min, if a 5×5×7 volume is clear | the only regrow. Wild trunks do not come back |
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
| **wool ×4** | **one** blue wool on the town post at `(2, 6, 2)`, not inside `keptCell`. Shop sells blue and red at 4 cogs. Green and tan are not placed by survival worldgen | one world block, then the shop | bunk (3 blue), chair, tape, rug (4 of one colour) | the post is a trophy steal, not a wall. Tan has no survival source |
| **berry** | wild berry bushes (1–2 on break, plus a sprout 1 in 4) and planted bushes (first fruit 10 min dry, regrow 6; wet is 2×). Tufts are not berries (1 seed in 8). Wild bushes refill in 3 min if left standing | 20–60 | cupcake, sells 1 cog | fine |
| **wheat / seeds / flour** | farm pack: hoe, farmland, grow | 10–40 wheat | flour → bread, cupcake | fine (bread is oven-only by design) |
| **sugar** | breaking a **reed (block 29) drops sugar** (`packs/farm/pack.js` drop row). Reeds grow on shores and do not refill. Shop also sells sugar at 3 cogs. No sugar recipe | finite patches, then the shop | cupcake | not shop-only; the shoreline strip is a one-time take |
| **ironOre / copperOre / zincOre** | **never generated**, no drop, not in shop | 0 | ingots | **dead end** (root of everything below) |
| **ironIngot** | smelter (gated T4) | 0 | sewing, tape, saw, hammer, woodshop, floor lamp, wall lamp, steel | **dead end**, 7 ungated recipes stall here |
| **copper / zinc ingot, steel, copperWire, batteryCell** | gated chain | 0 | fabricator, lantern, charger, sliding/metal doors, override key | dead end |
| **keeperCore** | Foundry keeper reboot (C5, alias-only) | 0 in the main world | overrideKey | dead end by design (cosmetic arena) |
| **pinecone** | flora pack | some | oven fuel (1) | fine |
| **woodTool / stoneTool / hoe / wand** | bench | 1 each | nothing (no wear) | **orphans after first craft**; nothing ever consumes a tool |

Orphans (can be obtained, nothing in the craft list spends them): dyes (flower → dye, then only a 1-cog sale), grey brick (placeable, no recipe input), clay, gravel. Tools don't wear (`TOOL_LIFE` is empty), so a second wood tool isn't needed. That is not a sink.

Dead ends (needed, never obtainable in Survival): slate, red sand, snow (so the ice recipe), red brick, wool tan and wool green, all three ores, and everything downstream (the T4/T5 chain, plus 7 ungated iron-ingot recipes and 4 ungated copper-ingot recipes). Keeper core drops from the C5 keeper only, and its only recipe is the T5 override key.

## 2. Scarcity in one shared world

What 25 kids on one map actually exhaust:

- **The spawn lawn, first session.** 7 starter trees (42 logs), the 19-block mound and the 9 sand blocks are deterministic. Saved chunks never call the generator again, so a chopped trunk stays air. By minute 10 of the first class the lawn is bare. Stone and sand exist past the lawn (the mound is a signpost, not the supply). Wood does not. A login gift of 2 saplings and an 8-minute grow (4 logs, needs a clear 5×5×7) is the only replant, and it does not feed 25 kids.
- **Wild, birch and pine, over the term.** About one wild oak per 450 columns (~60–70 inside a 100-block walk), once. 25 kids selling the daily log cap (20 logs × 2 cogs) is 500 logs a day, about 100 trees, before anyone builds. Next week's class inherits the clear-cut. This is the real shared-world shortage. Coal and stone are not.
- **Coal near spawn.** Pockets are 6×6×4 regions, about 42% of regions, about 70% of cells inside them, so ~30% of the y −3…−28 band is coal. A class cannot exhaust it. Don't copy that density onto metal.

What the design invites today:

- **Hoarding has no payoff but no cost.** Drops never despawn, the ground holds 256 piles then overflows to Lost & Found, boxes hold 18 stacks, keep-inventory is on. A kid can fill boxes with 64-stacks of stone forever; it harms nothing and gains nothing (stone is unsellable). Sellables are capped at 20 units per item per kid per day, which caps the only hoard that could matter.
- **Griefing vectors that exist:** stripping the spawn lawn (above), filling the drop cap with junk so other kids' drops go to Lost & Found (256 is per world), and building on top of other kids' chests/ovens outside the protect ring. The `protect` zone and "Bertyville is a safe zone" cover spawn; outside it there is no per-kid claim.
- **Griefing vectors that don't:** no fire, no TNT, no water buckets, PvP off, keep-inventory. Good.

Recommendations (regen and per-kid rules):

1. **Regrow the starter grove, not the whole forest.** If a starter trunk cell is air at dawn and a player did not build in the crown, put that tree back. Same spots as `SPAWN_TREES` (the comment says six; the array has seven). Wild forest stays finite so walking still matters. A shop-style lock on the grove teaches nothing. A personal log bundle gets dropped as a gift and becomes a second mine. **Design call (GameMaster):** dawn regrow vs lock vs bundle. Recommendation is regrow.
2. **Guaranteed sapling from those starter leaves** (not 1/6), so a class can replant on purpose during the period. Wild leaves keep the 1/6 roll. The 8-minute grow stays.
3. **Keep ore and ingots unsellable** when they exist. The log sale (2 cogs, cap 20) is already the strip incentive. Don't add a metal price. Drop-cap and claim-radius changes are real grief tools but they are a separate call; they don't put a tree back.

## 3. Ore plan

Goal: ore is a real sourcing decision (where, how deep, what it costs to get out) and the smelter is a real process (fuel, time, yield), without adding chunk-gen cost or save weight.

**Generation (no extra save, no vein list).** Stay a pure function of `(x, y, z)`, same shape as `coalHere`. Do not store a pocket list. Skip `townTrunk` (`x -20..36`, `z -18..28`) and the kept shop. Phone and Chromebook: the first iron is a short walk and a short dig, not a cave. Surface near spawn is about y = 3–6.

Do **not** reuse coal's fill (~30% of a 26-block band) and do not use 50% pockets. Metal at that density is a quarry one kid can empty. A 5×5×3 at 55% is ~40 ore, which is a class supply in one hole.

| Ore | Band | Shape | Why |
|---|---|---|---|
| **Iron** | From 3 below the surface down to y = −12. Not in town. | About **1 blob per 100 columns** (8×8 region hash under ~0.08, then a 2×2×2 thinned to **4–6 blocks**). | 25 kids × ~8 ore (one tool, a spare, a miss) ≈ 200 iron. A 50-block walk is a few thousand columns; 1% of those is ~30–40 veins. One each, a few left over. |
| Copper | y = −8 to −24, about half iron's rate. | Same 4–6 blob. | Wire is a second trip, still inside the period, not the same hole. |
| Zinc | y = −16 to −32, rarer. | Same function, lower region chance. | Batteries are T5. Don't sprinkle zinc until that tier is real. |
| Coal | Leave `coalHere`. | — | One coal already does 8 oven bakes. Thinning it is a later call. |

**Smelter as a process.** `stations.paint` only builds a woodshop or an oven panel. Clone the oven panel (fuel, input, output, a seconds bar, a belt hook). No new screen. That matters at 412 px wide. `SMELTER_FUEL_SLOT` and `COAL_RUNS` (4) in `gates.js` are already named and unused.

- Fuel: 1 coal = 4 ingots (`COAL_RUNS`). 1 log = 1 ingot. The oven can keep burning wood. The smelter prefers coal, and a log still works so a kid who hasn't dug yet isn't stuck.
- Time: 4 s per ingot, which the recipe already says. They watch it. Not an overnight job.
- Yield: **1 ore → 1 ingot**. Not 2-for-1. A 4–6 block blob is one saw plus a spare, which is the period's goal. Tailings can wait until the path exists.
- The smelter block recipe is `brickRed × 8 + ironOre + coal` at T4. Red sand never generates and the shop's red brick is inside `keptCell`, so that cost is unpayable even if T4 is forced open. **Design call (Diego):** drop red brick and pay the starter smelter in stone + coal, or add one red-sand pocket beside the starter sand. Not both as a surprise.
- **Do not open T4 to unlock this.** `setGate` is a test hook. Opening T4 also opens steel, wire, and the fabricator, and the panel still doesn't exist. A starter smelter recipe should be ungated or T1. Park steel and the fabricator on T4/T5 until that ladder is real. **Design call (GameMaster).**

**First iron tool.** It already exists: hand saw or hammer, 1 ingot, in `recipes.js`. They are ungated and currently a lie, because the ingot cannot be made. Don't add a 3-ingot pick in the same change. `TOOL_X` already names copper (×4) and steel (×6) and nothing outputs those tools. A later pick can use the copper slot. Hands already mine ore (`toolEnough` is always true, unknown blocks take 3 s). Leave that until the stone tool is normal, which it is a few minutes in. A 12-second hand swing is a grind wall on a phone.

**Save and gen cost.** One extra hash per stone cell, same as coal. No new save fields. Ids 44–46 are already in `blocks-list.js`.

**Design call (Diego, rates).** The 1-in-100 blob is a starting number, not a measurement. It is one hash, so a class can retune it after one period.

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

So the shortest honest path to a stone tool is under 3 minutes. The stall after that is four locks, not a timer:

1. **No ore**, and nothing drops it. Not a missing pick recipe. The hand saw and the hammer are already 1 ingot each. They look craftable. They are not.
2. **T4 never opens in play.** The only `setGate` call is the test hook in `main.js`.
3. **The smelter has no panel.** A spawned block 42 still wouldn't run.
4. **Red sand never generates**, so the smelter's 8 red brick cannot be crafted, and the shop walls cannot be mined.

There is no fifth lock on the dig. Hands would break the ore in 3 s.

**Target once the small path exists:** stone tool by ~3 min, a shallow 4–6 iron blob by ~8 min, 4-second smelts, saw or hammer in hand before the halfway mark. The rest of the period is building with it. A new 3-ingot pick, a 2-for-1 yield, or a 12-second hand swing pushes that past the period.

## 5. Economy check against locked prices

Rules in `econ.js`: a kid sells at `floor(base × 0.7 × dial × max(0.5, 1 − 0.03·soldToday))`, min 1; buys at `ceil(base × 1.1)`; **20 units per item per kid per day**; the store stocks only flour, sugar, woolBlue, woolRed; townsfolk visit vending counters every 30 s, buy with chance by markup, max 20 per counter per day.

| Loop | Cost | Return | Verdict |
|---|---|---|---|
| Buy wool 4 → sell wool | 4 | 2 | loss |
| Buy 2 flour 8 → bake bread → sell | 8 | 5 | loss |
| Buy flour 4 + sugar 3, forage 2 berries → 2 cupcakes | 7 | 8 (4 each, decaying) | +1 per batch if sugar is bought. Free reed-sugar makes it better until the shoreline is stripped. Cap 20. |
| Chop and sell logs | free | 2 each, cap 20 → 40 cogs | best reason to strip shared trees. Not a printer. Planks pay 1 each, so one log sold as planks is 4 cogs, but the plank cap is only 20 cogs. |
| Forage berries → sell | free | 1 each, cap 20 | ≤ 20 cogs/day |
| Vend counter at ≤ base price | items | 0.9 chance × 2 units per visit, 20/day/counter | ≤ 20 sales/day/counter |

Nothing runs away: every sellable is capped at 20 units/day/item and the 3% decay plus the 0.7 buy rate kill arbitrage. The soft spot is **multiple vending counters**: the townsfolk cap is per counter, so five counters are five caps. That matters only if cogs later buy something that matters. Logs, planks, glass, berries and dyes are sellable. Ore, ingots and the keeper core are `sell: false` or `base: 0`. Keep them that way. Gifting by drop moves items, not cogs.

## 6. Ranked fix list

Smallest first. "GM" = needs a GameMaster design call, "Diego" = needs Diego's OK. Each part is one PR of ≤ 3 fixes.

**Part A: stop showing work that cannot be done**
1. Hide, or mark "later", the seven ungated iron-ingot recipes and the four ungated copper-ingot recipes (tech line, switch, button, lens). Files: `src/data/recipes.js`, `src/packs/decor/pack.js`, `src/packs/tech/pack.js`, `src/stations.js` (woodshop lamp cards). **GameMaster:** hide them, or show a locked card. Don't leave the hammer looking craftable.
2. Stop treating red brick and the ice recipe as steps. Red sand and snow are never generated. File: `src/data/recipes.js`. **Diego:** drop red brick from the starter smelter cost, or add one red-sand pocket. Ice can wait.
3. Leave `setGate` as the test hook only (`src/main.js`, `src/data/gates.js`). Do not flip T4 to "unlock the smelter".

**Part B: the shared class**
1. Dawn regrow for the seven starter trunks when the cell is air and the crown isn't a build. Files: `src/worldgen.js` (`SPAWN_TREES`), `src/basics.js` (the sapling tick is the clock). **GameMaster:** regrow vs shop-style lock vs a personal bundle. Recommendation is regrow.
2. Guaranteed sapling from those starter leaves. Wild leaves keep 1/6. File: `src/data/items.js` `saplingRoll`, or a separate roll at the starter coordinates.
3. Keep the shop list and the sell flags. Ore, ingots, cores, and the saw stay `sell: false`. Files: `src/data/econ.js`, `src/data/items.js`.

**Part C: one real iron path (T4 stays shut)**
1. Iron blobs in `src/worldgen.js`, pure hash, outside town, shallow, about 1 blob of 4–6 per 100 columns. Copper and zinc can wait one change. **Diego:** confirm the rate after one class. Cheap to retune.
2. Smelter panel in `src/stations.js`, cloned from the oven panel. Fuel uses `COAL_RUNS` (coal × 4, log × 1). 1 ore → 1 ingot, 4 s. Wire the constants in `src/data/gates.js`.
3. Starter smelter recipe ungated or T1, paid in stone + coal (or stone + red sand if the pocket exists). First tool stays the hand saw or the hammer (1 ingot, already in `recipes.js`). **GameMaster:** T4 stays shut. Opening it is a different project.

Out of scope for these nine: thinning coal, zinc, the fabricator panel, T5, override keys, dye recipes, a new iron pick, tool wear, and the reed→sugar drop. That drop is surprising (block 29 is a reed, the bag gets sugar). Cupcakes depend on it. Don't "fix" it in the ore change.
