# Bertopia world-1: ores by depth + still water (design brief, GameMaster, 2026-10-06)
**Slot:** right after 260b (≈2.6.2), approved by Flo at 6:48 AM.
**Source of truth:** this brief, `BERTOPIA-ORE-TABLE.md` §0, §2 and §3, `BERTOPIA-CORE-MECHANICS.md` §2 and §8, and `BERTOPIA-GM-ANSWERS-2026-10-06.md`.
**Scope:** Game world only. The Build world (Workshop) gets the new blocks in its palette but never generates ore.
**Goal for a kid:** "I dug down and found copper. I swam in the lake and panned for gold."

## 1. What ships
1. **Ore placement by depth.** It works in today's terrain, with no biomes yet.
2. **Still water.** Lakes, one river system, Clay banks and gravel beds.
3. **Swimming, breath and safe landings,** per CORE-MECHANICS §8.
4. **The Pan** (early) and **the Bucket** (T4).
5. **Glow Moss clumps underground.** This is the real source for the Glow Pebble and Glow Mix.
6. **New block art and names** (asset list in §7).

**Not in world-1** (these wait for world-2 or later):
- Biomes, snow, Ice, the sea, Salt Crust, the Salt Pan
- Bauxite, Black Sand, Ilmenite, Platinum, Graphite, the Boundary Clay layer
- Meteor falls, Geology Night regrowth, the Trade Post, the Wallet, the Bertodex
- Lava

## 2. Depth bands
The bands follow ORE-TABLE §0 exactly. The live surface is at about y 1–6, and the Coreplate at y −64 never breaks.

| Band | y | Ores in world-1 (expected ore blocks per 24×24 chunk) |
|---|---|---|
| S | ≥ 0 | Clay (16, only next to water), river gravel, sand |
| B1 | −1 to −16 | Coal 48 (most in B1, a few to B2), Iron 40 (B1–B3), Copper 18 (B1–B2), Tin 4 (B1–B2), Glow Moss 8 (B1–B3) |
| B2 | −17 to −32 | Zinc 10, Quartz veins 12 (B1–B3), Silver 1.5 (B2–B3) |
| B3 | −33 to −48 | Gold Ore 0.4 (1 vein per 5 chunks) |
| B4 | −49 to −63 | stone only in world-1. Platinum and graphite arrive in world-2 |

**Rules:**
- Vein sizes come from the ORE-TABLE.
- Placement is fixed by the world seed, so the same seed always gives the same ore. Unmined ore costs no save space.
- Ore only replaces **natural stone or dirt**. It never replaces a player-placed block.
- No ore inside the town box.
- Mining times follow CORE-MECHANICS §2: Hand ×1, Wood ×2, Stone ×3, Copper ×4, Steel ×6. There are **no tier gates**; everything breaks by hand, just slowly.
- Drops go straight into the Bag. They follow the ORE-TABLE "Drops" column, for example Copper Ore drops Raw Copper.
- Placed ore gives the item back but never counts as "found" (the anti-farm flag `natural:false`).
- **First find:** the first time a kid gets each ore, they see a one-time polite chip with one real fact. Example: "First Copper Ore! Copper carries electricity, so wires use it." It lasts 3 s, sits above the hotbar, never covers a control, and works in 8 languages.

## 3. Water rules
- **Water never flows or spreads.** Each water block stays exactly where it was made, so a kid's build can never flood, and there's no water simulation running each tick.
- **Generation:**
  - Lakes form in low ground: radius 4–8, depth 2–4, with a sand, gravel or clay rim.
  - There's one river system about 3–5 wide and 2–3 deep, with a gravel bottom.
  - There's **always a lake within 48 blocks of spawn**, outside the town box.
  - The live ice pond in town stays ice.
- **Existing worlds:** carving lakes and rivers **skips any chunk that has player-placed blocks or a claim**, and skips the town box. Ore still fills untouched natural stone everywhere.
- **Placing and breaking:**
  - Placing a block into water replaces that water block.
  - Breaking a block next to water leaves air; water never pours in.
  - Mining underwater works.
- **Look:**
  - Water is a soft blue-teal and see-through, with a 20% underwater tint. There's no dark fog and no flashing.
  - The minimap shows water in blue-teal with a wave pattern, so it isn't color-only.
- **Swimming** (CORE-MECHANICS §8):
  - Move at 2.2 b/s. Jump rises at 2.0 b/s, Crouch sinks at 1.0 b/s, and idle floats you up.
  - Breath only exists with Damage On, and water can never take the last heart.
  - Water at least 1 block deep is a safe landing.
  - Leaving the water: pressing Jump at the edge climbs a 1-block bank with one thumb.

## 4. Pan (early) and Bucket (T4)
**Pan:** 3 Planks at the Workbench.
- **Use** it while aiming at gravel or sand that touches water. A 2 s swirl ends in a result chip.
- World-1 odds, with no biomes yet:
  - Gold Flakes: 1 in 120, doubled on the bottom gravel layer.
  - Tin: 1 in 40.
  - Otherwise you get the gravel or sand back.
- Each block can be panned once. It becomes "Panned Gravel", and its chip says "Already panned".
- 9 Flakes make 1 Gold Nugget.

**Bucket:** 3 Iron Ingot on the Forge tab (T4).
- Use on a water block to scoop it; that block becomes air.
- Use on a face to place 1 still water block.
- Refused in the town box and on other kids' plots, with a chip that says "You can't place water here".
- A Bucket holds 1 block of water.
- The Concrete Strut recipe ("water bucket") uses a full Bucket and gives the empty Bucket back.

## 5. Glow Moss
- Glow Moss forms clumps of 2–5 inside B1–B3 stone. It glows faintly at radius 1 so kids can spot it while digging.
- It breaks by hand in 0.3 s.
- Recipes: Glow Pebble ×8, Glow Mix (with 1 Copper dust, or 2 Glow Moss before Copper), and Booster Dye.
- **Stopgap if basics ships glow items before world-1:** new and existing Game-world players get a one-time gift of 8 Glow Moss in the Overflow Box at spawn.

## 6. Locked-tile rule (starts here; world-2 uses it too)
- Every material carries an `availableFrom` field: `live`, `world-1` or `world-2`.
- A recipe that needs a material that isn't in this world yet stays visible under **Show all** as a locked tile. It has the picture, a 🔒 icon and the words "Not in this world yet", plus one line saying where the material will come from. Example: "Ice comes from snowy mountains."
- It's never hidden silently, never greyed out with no words, and never shown in Can make now.
- In world-1 this applies to the Cold Glow Vial and Frost Vial ("Needs Ice"), and to the Titanium, Aluminum and Platinum chains.
- The one exception is the Salt Pan. It stays fully hidden until world-2, because without the sea it would be a dead block.

## 7. Assets needed (Debugzy's asset pack)
- **Block textures,** 16×16 or 32×32, matching the live style. Each ore uses a **distinct shape pattern as well as a colour**, so no ore is told apart by colour alone:
  - Coal: black angular chunks
  - Iron: rusty round dots
  - Copper: orange-green streaks
  - Zinc: grey-blue flakes
  - Tin: dark brown squares
  - Quartz vein: white crystal spikes
  - Silver: bright thin lines
  - Gold: yellow wiggly vein
  - Glow Moss: teal dots with a soft glow
  - Clay: smooth grey-blue
  - Panned Gravel: flattened gravel
  - Water: see-through blue-teal
- **Item icons:** Raw Copper, Iron Ore, Zinc Ore, Tin Ore, Quartz, Silver Ore, Gold Ore, Gold Flake, Gold Nugget, Clay, Pan, Bucket (empty), Bucket (water).
- **Names** for every new block and item, in the 8 languages (en uk ru es ar fa-AF rw ti). Curriculum checks them.
- **Sounds,** always paired with a visual: a soft splash, a pan swirl, and a "first find" chime. The visual always shows too, so there's no sound-only success.

## 8. Acceptance tests
Run each test on a **phone 412×915 upright** and on a **Chromebook 1366×768**. Tests 6 and 11 also rotate the phone mid-test.
1. **Ore counts (headless):** across 20 seeded chunks, each ore's count per band is within ±25% of §2. There's zero ore above y 0 except Clay, zero ore in the town box, and zero ore in B4.
2. **Dig-down walk:** dig down by hand near spawn to y −20, and Coal and Iron are both seen on the way. Coal by hand takes 3.5 s ±10%, and with a Stone Pick about 1.2 s.
3. **Tap rule:** with a block in hand, a tap under 500 ms on Iron Ore places the block and breaks nothing.
4. **Lake near spawn:** there's a lake within 48 blocks in 5 out of 5 new seeds.
5. **Still water:** break the block beside a lake, and the water count is unchanged and nothing spills. Place a block in water, and that water block is gone.
6. **Swim with one thumb:** enter the lake, swim across, and climb out onto a 1-block bank. Rotate the phone mid-swim, and the controls stay usable with nothing stuck.
7. **Pan:** a 2 s swirl shows a result chip. Panning the same block again says "Already panned". Over 200 pans the gold rate is about 1/120, checked headless.
8. **Bucket:** scoop and place works. In the town box it's refused with words.
9. **Old save safe:** load a 2.6.1 save that has a build. The build is unchanged, there's no water inside it, and no placed block was replaced.
10. **Locked tile:** the Cold Glow Vial shows 🔒, "Not in this world yet" and "Ice comes from snowy mountains." It isn't in Can make now.
11. **Words and access:** each new block's name shows on the target chip in the chosen language. Ores are told apart by pattern, not color alone, and contrast is at least 4.5:1. The first-find chip never covers the hotbar or the stick, upright or sideways.
12. **Performance:** at 1366 with the CPU throttled 4×, looking across a lake holds 30 fps or better, and chunk generation is no more than 15% slower than 2.6.1.

**DONE rule:** say DONE only when every test above passes on the live site. Never fake a DONE.
