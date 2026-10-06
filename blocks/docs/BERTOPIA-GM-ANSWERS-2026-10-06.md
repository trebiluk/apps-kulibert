# Bertopia: GameMaster answers to Debugzy's 8 open questions (2026-10-06, 6:50 AM ET)
These are final mechanics calls. They override any older line that disagrees. The affected specs carry a "GameMaster 2026-10-06" note that points here.

## 1. Paint dab source (urgent)
- **Paint dab is a material of its own. It is not made by the Paint Brush.** Recipe: 1 Berry → 2 Paint dab (Workbench, hand-speed). Berries already drop from Leaves (33%, a live rule), so it's available from day one.
- Alternate: 1 Flower → 2 Paint dab (flowers come with the biome pack).
- Card text: "People made the first paints from plants and berries. The colour comes from pigments."
- The Paint Brush stays free and looks-only. Painting never spends Paint dabs.
- Paint dabs are used by: Booster Dye (Jumbo Glow), Camo Cloak, and Pet Rock (optional).

## 2. Jumbo Glow yield
- **One craft makes 2.** The recipe is 1 Plastic Tube + 2 Glow Mix + 1 Booster Dye → 2 Jumbo Glow (Workbench).
- A spent Jumbo returns 1 Plastic Tube each, so 2 per craft.
- Correction: BASICS-GM said "returns 2 Tubes" per stick. It's 1 per stick.

## 3. Plastic Tube for the T2 Glow Stick (urgent)
- **The Plastic Tube is early. It never needs the Smelter.**
- Steps: Corn → **Bioplastic** (Oven: 2 Corn → 1 Bioplastic, 5 s; cornstarch is cooked into plastic) → **Plastic Tube** (Workbench: 1 Bioplastic → 2 Plastic Tube).
- Corn grows on wild grassland bushes and can be planted. Until the biome pack ships, Corn bushes spawn on Grass in today's terrain.
- **Glow Mix** stays as 1 Glow Moss + 1 Copper dust, or it's found in caves.
- **Before ores ship:** Glow Mix can also be made from 2 Glow Moss at the Workbench, so the T2 stick works with zero ores.
- Card text: "Some plastics are made from plants, like corn."

## 4. Silicon station
- **Silicon is made at the Smelter:** 1 Quartz + 1 Coal → 1 Silicon. The recipe is **unlocked by T5** (first Circuit Daily fix or the Fabricator unlock).
- The **Fabricator uses Silicon**; it doesn't make it.
- Card text: "Sand and quartz are silica. Heating them with carbon pulls out silicon."

## 5. Tools, Smelter and Fabricator recipes
**Tools** (Workbench unless noted)
- There's one tool per tier, called the **Pick**. It mines every block, so there's no axe or shovel split. That keeps it one-thumb and gives kids nothing to switch.
- Tools never wear out and never break.
- Sticks: 2 Planks → 4 Sticks.
- Wood Pick (×2): 3 Planks + 2 Sticks.
- Stone Pick (×3): 3 Stone + 2 Sticks.
- Copper Pick (×4): 3 Copper Ingot + 2 Sticks, on the Smelter's Forge tab.
- Steel Pick (×6): 3 Steel + 2 Sticks, on the Forge tab.
- Pan: 3 Planks (as in the ORE-TABLE).
- Bucket: 3 Iron Ingot (Forge tab). It scoops 1 water source and places it.
- **No tier gates** (CORE-MECHANICS §2 and ORE-TABLE §2 stay locked). Every ore breaks by hand, just slowly. The ORE-TABLE "Best tool" column is the tier where it feels right, about 1–1.5 s. (Correction 6:55 AM: this replaces an earlier line that listed min-tool gates.)

**Stations**
- Workbench, Oven: live, unchanged.
- **Smelter** (T4; unlocked by the Tested in HoldIt stamp or the T4 rung): 8 Brick + 1 Iron Ore + 1 Coal (Workbench).
  - Fuel: 1 Coal runs 4 smelts. A full fuel slot holds 16 Coal.
- **Fabricator** (T5): 4 Steel + 2 Copper Wire + 1 Glass + 1 Battery Cell (Forge tab).
  - It runs on charge, not coal: 1 charge per craft, from a wired Charger or Battery Box. With no charge it shows "Needs power ⚡" in words.

**Smelter, main tab** (4 s each)

| In | Out |
|---|---|
| Iron Ore | Iron Ingot |
| Raw Copper | Copper Ingot |
| Zinc Ore | Zinc Ingot |
| Tin Ore | Tin Ingot |
| Silver Ore | Silver Ingot |
| Gold Nugget | Gold Ingot |
| Bauxite | Alumina |
| Black Sand / Ilmenite | TiO₂ |
| Quartz + Coal | Silicon (T5) |
| Platinum Nugget | Platinum Ingot (needs the Embercore upgrade) |

**Forge tab** (Smelter)
- Iron Ingot + Coal → Steel
- 8 Copper Ingot + 1 Tin Ingot → 9 Bronze Ingot
- 1 Copper Ingot → 4 Copper Wire
- 1 Glass → 2 Glass Vial
- 1 Iron Ingot → 2 Wire Rope
- 1 Steel → 2 Spring
- Steel Beam and HS Steel Beam as in the PROGRESSION-PLAN
- Copper Pick and Steel Pick (above)
- Bucket (above)

**Fabricator** (1 charge each)
- 1 Copper Ingot + 1 Zinc Ingot → 2 Battery Cell
- 1 Silicon + 2 Copper Wire → 2 Logic Chip
- Solar Panel: 2 Glass + 1 Silicon + 1 Copper Wire
- Charger: 1 Steel + 1 Copper Wire
- LED Glow Strip: 1 Glass + 1 Copper Wire
- LED Lantern: 1 Glass + 1 Steel + 1 Battery Cell
- Sliding lab door
- Berty's Bot H1
- Alumina + 4 charge → Aluminum Ingot
- Network parts, Drives and Terminal (STORAGE-SPEC phase 3)

**Rule of thumb:**
- Wood, cloth, glass and food: Workbench and Oven.
- Ores to metal: Smelter.
- Metal shaping: Forge tab.
- Anything with a battery, silicon or a chip: Fabricator.

## 6. Restock prices (wool, flour, sugar)
- Prices are per stack of 16. They're in **Copper Cogs**; "Bronze" in older docs and live code is the same coin, 1:1.
- Wool (any colour) or Cloth: 2. Flour: 1. Sugar: 1.
- A restock is offered **only after the kid has had that item in their Bag once**, from any source including the starter kit. Before that, the tile shows "Find one first" with no Buy button.
- Existing caps still apply.

## 7. Leaves and the 500 ms rule
- **No. A quick tap never breaks anything in the Game world, Leaves included.** Mining is always a hold.
- Crack progress starts at 250 ms, so Leaves (0.2 s) break at about 0.45 s by hand, and at about 0.40 s at the 0.15 s tool floor.
- Because a block broke before release, that still counts as Mine.
- Any tap that ends before 500 ms with no block broken is Place/Use. With nothing placeable in hand, it does nothing. Same for every block, which keeps it predictable.
- The Build world keeps instant break on tap (Creative, CORE-MECHANICS §5).

## 8. Water and snow: in scope, and when (urgent)
**Yes, both are in scope.** The live game has **no ores either** (only coal in the palette). So nothing that needs Steel, Copper Wire or Plastic Tube (storage-2 onward, the Bot, the Fabricator) can be earned in the Game world until world generation ships.

Recommended order (Debugzy and Flo set the version numbers):
1. **world-1, right after 260b** (≈2.6.2):
   - Ores by depth only in today's terrain, using the ORE-TABLE depth bands and rarity, ignoring biomes for now.
   - **Static water:** lakes and one river. Water is a block that never flows or spreads, so a kid's build can never flood.
   - Swim, breath and safe landings per CORE-MECHANICS §8.
   - Pan and Bucket.
   - Clay near water.
2. **world-2** (≈2.6.3):
   - The biomes from the ORE-TABLE, including **Frostspire snow with Ice**, Rustflats Salt Crust, and the Tidewell sea with the Salt Pan.
   - Corn, Cotton and Flower bushes move to their real biomes.
   - Ore placement switches to biome rules.
3. Storage-2 and later then follow. Storage-1 (wood and cloth) doesn't need ores and can stay where it is.
4. **world-3** (with the economy pack, after holidays): ore regrowth, the Trade Post, the Periodic Table Wallet and the Bertodex.

**Until world-2:**
- The Cold Glow Vial and the Frost Vial show as locked tiles reading "Needs Ice (snow biome)".
- Salt Pan items are hidden.
- Nothing is missing silently.


## Added 7:12 AM (Debugzy's coding-plan questions)
- **G-Q19 Iron Nugget:** don't add it. Carving Scoop = 2 Sticks + 1 Stone; Spooky Bench = 3 Planks + 2 Sticks. Decor never waits on ores (DECOR-PACKS §5 updated).
- **G-Q2 Fabricator bootstrap:** the first time a player places a Fabricator, Berty puts a one-time **Starter Kit** in their Overflow Box: 1 Battery Cell + 1 Charger, with a card: "Maker parts to get you started. Now the Fabricator can make more." One per player per world (same pattern as the Glow Moss gift). Build world: both are free in the palette anyway. No Forge recipe for either, so the Fabricator stays the only maker.
