# Bertopia world-2: biomes, snow and Ice, salt flats, the sea (design brief, GameMaster, 2026-10-06)
**Slot:** right after world-1 (≈2.6.3) and before storage-2, approved by Flo at 6:48 AM.
**Source of truth:** this brief, `BERTOPIA-ORE-TABLE.md` §1–§3, `BERTOPIA-WORLD-1.md` (water rules and the locked-tile rule are unchanged), and `BERTOPIA-GM-ANSWERS-2026-10-06.md`.
**Scope:** Game world only. The Build world gets every new block in its palette.
**Goal for a kid:** "I walked out of town and found snowy mountains, a salt desert and a beach. Each one has different stuff."

## 1. What ships
1. **Six surface biomes plus one deep layer.** Hanging Isles (floating islands) is **out of scope** and moves to a later pack.
2. **The sea** on the Tidewell side, made of still water tagged `sea`.
3. **Snow and Ice** in Frostspire.
4. **Salt Crust** and the **Salt Pan.**
5. **Biome ore rules.** World-1's depth-only rates switch to the ORE-TABLE §2 per-biome table. This brings Bauxite (Red Soil), Black Sand, Ilmenite, Platinum Dark Reef, Graphite, and the Boundary Clay layer at y −24.
6. **Crops and flowers in their real biomes.**
7. **A biome name chip.**
8. **Locked tiles unlock:** Ice and Salt items move from "Not in this world yet" to normal recipes.

**Not in world-2:** Hanging Isles, lava and magma pools, meteor falls, Geology Night regrowth, the Trade Post, the Wallet, the Bertodex. The last five come in world-3 with the economy pack.

## 2. Layout
- **Bertyville Commons** is **today's terrain.** It covers spawn out to at least 3 chunks (72 blocks) from the town box, so every existing kid build near town stays exactly as it is.
- The other biomes form big noise cells, each about 4–8 chunks across, in a ring beyond the Commons. Edges blend over 8 blocks: height, surface block and trees.
- **Every new seed must have all six biomes within 12 chunks of spawn.** Tidewell sits on one side, with the sea beyond it.
- **Existing worlds:** new biome terrain only applies to chunks with **no player-placed blocks and no claims.** An edited chunk keeps its current terrain, and the blend zone smooths the seam. Ore re-placement follows the same rule: natural stone only, never a placed block.

| Biome | Surface and look | Height | What's special |
|---|---|---|---|
| **Bertyville Commons** | grass, oak, today's look | today's | Coal, Clay, Iron, a little Copper. No ore in the town box. Cotton and Corn bushes, flowers |
| **Glasswood** | pale granite hills, birch-like trees, quartz crystal clusters (decor) | y 4–18 | Quartz veins, Tin, Gold-quartz veins (B3), gold streams. **Red Soil patches** in warm lowlands contain Bauxite. Flowers |
| **Rustflats** | flat dry lake bed, off-white **Salt Crust** on 30% of the flats, red-brown edge hills | y 1–3 flats, hills to y 14 | Salt Crust, Iron ×1.5, Silver and Zinc veins in the edge hills (B2–B3), quartz dunes |
| **Tidewell Cliffs** | beaches, cliffs, **the sea** | cliffs to y 12, beach y 0–2 | beach sand, **Black Sand** (1 in 10 beach sand), Clay, Red Soil patches, the Salt Pan beside the sea |
| **Frostspire Highlands** | snowy mountains, spruce-like trees, frozen lakes | y 10–32 | **Snow** on top, **Ice** on lake tops (1 block thick over water), Tin, Gold-quartz veins, gold streams |
| **Emberdeep** | dark basalt hills, no lava in world-2 | y 4–20 | Copper porphyry halo at the edges (B1–B2), Ilmenite (B3), **Platinum Dark Reef** (B4), platinum grains in its rivers |
| **Undervault** (deep layer, under every biome) | darker stone in B3–B4 | — | Graphite (B3–B4) |
| **Boundary Clay layer** | a 1-block clay stripe at **y −24** under Commons, Rustflats and Tidewell, visible in cliffs and mine walls | — | breaks into Clay. Sifting it for Iridium is world-3 |

## 3. The sea
- In Tidewell, terrain below y 0 fills with still water up to y 0, at most 8 deep.
- It's the same still water as world-1: it never flows or spreads. Sea water carries a `sea` tag, so the Salt Pan only works beside it.
- Swimming and safe landings follow world-1.
- The world edge on the sea side is a gentle invisible wall at the end of the sea. The chip reads "That's as far as the sea goes."

## 4. Snow and Ice
- **Snow block:** breaks in 0.3 s and drops Snow. It halves fall damage, as CORE-MECHANICS already says.
- **Ice block:** breaks in 0.5 s and drops Ice. Lake tops in Frostspire are 1 block of Ice over still water. Breaking it opens the water.
- **No slipping.** Ice walks like stone, which keeps one-thumb control predictable.
- **Light snowfall** shows in Frostspire only. It turns off when Motion is off and never flashes.
- **Colours are glare-safe** (Diego is light-sensitive): snow `#EEF3F7`, Salt Crust `#E8E4DA`, ice a pale cyan. There's no pure #FFFFFF surface anywhere.
- **Recipes that unlock:** Cold Glow Vial (1 Glass Vial + 3 Glow Mix + 1 Ice) and Frost Vial (1 Glass Vial + 1 Ice).

## 5. Salt
- **Salt Crust** breaks by hand in 0.8 s and drops Salt.
- **Salt Pan:** 4 Planks + 1 Glass. It only works when placed touching `sea` water. It makes 1 Salt per 4 minutes of daylight and nothing at night.
- **Lesson card:** "Sun dries seawater. The salt stays behind."
- If it's placed away from the sea, it shows a "Needs seawater" chip and nothing happens.

## 6. Ores, panning and crops by biome
- Ore per chunk switches to the ORE-TABLE §2 "Per chunk (home)" numbers, using the biome column.
  - Iron, Coal and a little Copper exist everywhere at the listed base rate.
  - Each ore's home biome gets the full rate, and other biomes get 25% of it.
  - Rare metals keep their **place rules**: gold in B3 veins and streams in Glasswood and Frostspire, platinum only in Emberdeep B4.
- Pan odds follow ORE-TABLE §3. Gold is 1 in 60 in Glasswood and Frostspire streams, tin is 1 in 40 in granite streams, and platinum grains are 1 in 400 in Emberdeep rivers. Anywhere else, gold drops to 1 in 240 and tin to 1 in 80.
- **Crops:**
  - Cotton and Corn bushes grow in Commons grassland and at the edges of Glasswood.
  - Flowers grow in Commons and Glasswood meadows. 1 Flower makes 2 Paint dabs.
  - Berries still drop from Leaves.

## 7. Biome name chip and minimap
- When a kid first enters a biome in a session, a chip shows its name and one line. Example: "Frostspire Highlands: snowy mountains. Look for Ice and tin."
- It's polite, lasts 3 s, sits above the hotbar, never covers a control, and works in 8 languages. It shows once per biome per session.
- **Minimap:** each biome has its own colour **and** its own pattern (dots, stripes, waves, crosshatch), plus a legend in the map sheet. Nothing is colour-only.

## 8. Assets needed
- **Blocks:** Snow, Ice, Salt Crust, Basalt, Granite, Red Soil, Bauxite, Black Sand, Ilmenite Ore, Platinum Ore, Graphite, Boundary Clay, Quartz Crystal (decor), Sea water (same texture as water).
- **Trees:** birch-like and spruce-like.
- **Bushes:** Cotton, Corn and 3 Flower colours.
- **Item icons:** Snow, Ice, Salt, Salt Pan, Bauxite, Black Sand, Ilmenite, Platinum Nugget, Platinum Grain, Graphite, Flower, Cotton, Corn.
- **Minimap pattern tiles,** one per biome.
- **Names** for every block, item and biome in the 8 languages, checked by Curriculum.
- **Sounds,** each paired with a visual: wind in Frostspire (quiet, off in class mode), waves at the sea, footsteps on snow.

## 9. Acceptance tests
Run each test on a **phone 412×915 upright** and on a **Chromebook 1366×768**. Test 9 also rotates the phone.
1. **All biomes near spawn (headless):** in 5 out of 5 new seeds, all six biomes are within 12 chunks of spawn, and Tidewell borders the sea.
2. **Old save safe:** load a world-1 save with builds near town and one build 4 chunks out. Both builds are unchanged, and edited chunks keep their old terrain with a smooth seam.
3. **Snow walk:** walk from spawn to Frostspire. The biome chip shows once. Mining Snow takes 0.3 s and Ice 0.5 s. Ice doesn't slide.
4. **Cold Glow Vial unlocks:** with Ice in the Bag, the Cold Glow Vial moves from the locked tile to Can make now, then crafts and places.
5. **Sea and Salt:** a Salt Pan touching the sea makes 1 Salt in 4 minutes of daylight. Placed away from the sea it shows "Needs seawater". Salt Crust drops Salt.
6. **Biome ore (headless):** over 20 chunks per biome, home-ore counts are within ±25% of ORE-TABLE §2. Platinum appears only in Emberdeep B4, Bauxite only in Red Soil, and Black Sand only on Tidewell beaches.
7. **Boundary Clay:** a clay stripe at y −24 shows in a Tidewell cliff and is missing under Frostspire.
8. **Glare-safe colours:** no surface pixel is pure #FFFFFF. Text chips keep at least 4.5:1 contrast over snow and salt.
9. **One-thumb and rotate:** climb a Frostspire slope and swim the sea edge at 412 upright. Rotate mid-climb, and the controls stay usable with nothing stuck. The biome chip never covers the hotbar or the stick.
10. **Minimap:** each biome is recognisable with colour turned off (pattern check on a greyscale screenshot).
11. **Performance:** at 1366 with the CPU throttled 4×, looking over Frostspire with snowfall on holds 30 fps or better. With Motion off, there's no snowfall. Chunk generation is no more than 20% slower than 2.6.1.

**DONE rule:** say DONE only when every test above passes on the live site. Never fake a DONE.
