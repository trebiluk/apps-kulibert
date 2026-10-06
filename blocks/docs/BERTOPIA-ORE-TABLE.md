# Bertopia Ore Table + Bertodex (GameMaster, Oct 4 2026 ~7:10 AM ET)
GameMaster calls 2026-10-04 7:2x AM ET
Source: Diego 6:49–6:50 AM. Pairs with `BERTOPIA-ELEMENT-ECONOMY.md` (the Cog ladder, Wallet, Trade Post and Patents). Respects `BERTOPIA-CORE-MECHANICS.md` (verbs, mine times, tool multipliers, no tier gates), `BERTOPIA-WORLDS.md`, STORAGE, FUN-ITEMS, EFFECTS, `gamemaster/BERTOPIA-BASICS-GM` (Lantern, glow) and the Progression Plan ladder.
**Locked sourcing from the parent (kept exactly):** Iron Ore → Iron Ingot (Smelter, T4); Iron Ingot + Coal (Forge tab) → Steel. Copper Ore → Raw Copper → Copper Ingot; 1 Ingot → 4 Copper Wire; 1 Raw Copper → 2 Copper dust (Workbench). Zinc Ore → Zinc Ingot. Quartz (sand dunes, quartz veins) + Coal at the Smelter → Silicon (T5 Logic Gates rung, Fabricator). Coal Ore is shallow and common. Salt Crust is found in dry lake beds and desert flats, plus Salt Pan evaporation. Ice is in the snow biome. Cotton and Corn are crops (wild bushes in grassland). Bioplastic comes from Corn. Glow Moss grows in caves.
**World rule:** ore spawns, mining yield, Trade Post sales and Bertodex unlocks are **Game world only**. The Build world (Workshop, Creative rules) has every block in the palette, no ore generation, and a **view-all Bertodex** that unlocks nothing.
Facts are tagged [F#] → §8 Fact check for Curriculum Bot.

---

## 0. World depth (defined from the live code)
- **Live BT 2.5.x** (`genVoxel`): the surface sits around y = 1 to 6 (Bertyville town is at y = 4), dirt is 3 deep, stone runs down to y = −63, and an unbreakable **Coreplate** floor is at **y = −64**. The chunk size is **24** (`chunkSize: 24`).
- **Depth bands** (y is absolute; "sea level" = y 0):
  | Band | y range | Name | Stands for (real) |
  |---|---|---|---|
  | S | y ≥ 0 (top 3 blocks, rivers, beaches, dunes, flats) | Surface | soils, sediments, placers, evaporites |
  | B1 | −1 to −16 | Shallow | young sedimentary rock: coal, clay, iron, near-surface copper |
  | B2 | −17 to −32 | Middle | older rock with hydrothermal veins: zinc, silver, tin, quartz |
  | B3 | −33 to −48 | Deep | old hard rock: gold-quartz veins, ilmenite |
  | B4 | −49 to −63 | Bottom | the roots of volcanoes (Emberdeep, Undervault): platinum reef |
  | — | −64 | Coreplate | never breaks |
- **Scale note on the Bertodex Help card:** "Bertopia's underground is squished. Real mines can go kilometers down; here the whole world is 64 blocks deep."
- **Chunk volume:** 24 × 24 columns × 63 underground layers = **36,288 blocks**. "Per chunk" numbers below are expected ore **blocks** per chunk in the ore's home biome and band.
- **Ore regrowth ("Geology Night"):** ore is fixed by the world seed. Every **Sunday 00:00 ET**, ore and river placers regrow **only in chunks with no player-placed blocks and no claims**, so a class's supply is finite each week. That's what the Trade Post's supply-and-demand reads (ECONOMY §5). Panned and sifted blocks reset on the same night.

## 1. Biomes → real geology
| Biome (World Plan §1) | Real setting it stands for | Ores that favor it |
|---|---|---|
| Bertyville Commons | sedimentary lowland (ancient forests and marshes, buried and turned to rock) [F24] | Coal, Clay, Iron, a little Copper. **No ore inside the town box** (hand-built town). |
| Glasswood | granite hills with quartz | Quartz veins, Tin (granite), Gold-quartz veins (B3), gold placer in streams |
| Rustflats | dry lake bed / salt flat with desert ranges at the edges | **Salt Crust** (surface), Iron (red, rusty rock), Silver + Zinc veins in the edge hills (B2–B3) |
| Tidewell Cliffs | coastline | beach Sand, **Black Sand** (titanium heavy minerals), Clay, **Salt Pan** spot (seawater) |
| Hanging Isles | magnetic iron rock | Iron (magnetite: shows the "magnetic" chip), Floatstone (Verge) |
| Frostspire Highlands | snowy mountain belt | **Ice** and Snow, Tin, Gold-quartz veins, gold placer in mountain streams |
| Emberdeep | volcanic basalt, plus the deep "roots" of volcanoes | **Copper porphyry halo** at the edges (B1–B2), Ilmenite (B3), **Platinum Dark Reef** (B4), Platinum grains in its rivers |
| Undervault | deep, under everything | Graphite (B3–B4), Verge rares |
| **Red Soil patches** (inside warm Glasswood and Tidewell lowlands; uses the live `redSand` look) | soil weathered for a long time in a warm, wet climate (laterite) [F25] | **Bauxite** (S–B1) |
| **Boundary Clay layer** (1 block thick at **y = −24** in Commons, Rustflats and Tidewell; seen in cliffs, canyons and mine walls) | the worldwide iridium-rich clay layer from the asteroid impact | Iridium Specks by sifting only (§3) |

## 2. Ore and raw-material table
Hand time and tool follow CORE-MECHANICS §2 (Hand ×1 · Wood ×2 · Stone ×3 · Copper ×4 · Steel ×6, no tier gates). The **Best tool** column is the tier where it feels right (about 1–1.5 s); everything still breaks by hand, just slowly. CRC ppm is the whole-crust value [F1]. Ranked/comparison abundance columns use mass ppm only (CRC or Rudnick & Gao); RSC values are atoms per million atoms and belong only in a labeled footnote [F3].

| Material | Band | Biome | Vein size (blocks) | Per chunk (home) | Hand s · best tool | Drops → refine | Real facts (symbol · Z · CRC ppm · main uses) |
|---|---|---|---|---|---|---|---|
| **Coal Ore** (live `coal`) | S–B2 (most in B1) | all but town; most in Commons | 4–12 | **48** (6 veins) | 3.5 · Stone | Coal (fuel; Smelter fuel; Forge carbon for Steel; Silicon reductant) | carbon C · 6 · 200 · formed from plants in ancient forests and marshes that were buried and squeezed for millions of years [F24]; fuel and steelmaking [F16] |
| **Iron Ore** | B1–B3 | everywhere; ×1.5 in Rustflats and Hanging Isles | 4–12 | **40** (5 veins) | 5.0 · Copper | Iron Ore → **Iron Ingot** (Smelter, T4) → Iron Ingot + Coal (Forge) → **Steel** | Fe · 26 · 56,300 · 90% of all refined metal is iron; ores are haematite and magnetite; made in a blast furnace with coke [F16] |
| **Copper Ore** | B1–B2 | everywhere a little; **porphyry halo** at Emberdeep edges | 4–8 (porphyry: 12–20) | **18** (3 veins); porphyry chunks +16 | 4.5 · Stone | **Raw Copper** → **Copper Ingot** (Smelter); 1 Ingot → 4 Copper Wire; 1 Raw Copper → 2 Copper dust (Workbench) | Cu · 29 · 60 · wiring and motors [F12]; most mined copper (over 60%) comes from giant, low-grade porphyry deposits that form from magma under volcano chains [F22] |
| **Zinc Ore** | B2 | Rustflats edge hills, Commons | 3–7 | **10** (2 veins) | 4.5 · Stone | **Zinc Ingot** (Smelter). Battery Cell = 1 Copper + 1 Zinc (locked) | Zn · 30 · 70 · galvanizing steel, brass [F14] |
| **Tin Ore** (cassiterite) | B1–B2, + river placer | Glasswood, Frostspire (granite) | 2–6 | **4** (1 vein); placer: 1 in 40 pans | 4.5 · Stone | **Tin Ingot** (Smelter). **Bronze:** 8 Copper Ingot + 1 Tin Ingot → 9 Bronze Ingot (Forge; about 11% tin, inside the real 10–12% tin-bronze range [F35]) → Bell, Bronze Gear, Bronze Plaque (decor). Card: "about 9 parts copper to 1 part tin, like real tin bronze". Keeps Diego's bronze lesson now that Bronze isn't a Cog. | Sn · 50 · 2.3 · tin cans are tin-coated steel; solder; window glass floated on molten tin [F13]; panned in streams [F13] |
| **Bauxite** | S–B1 (a blanket 2–4 blocks thick) | Red Soil patches only | patch 8–16 | **24** per Red Soil chunk | 1.0 · Hand | **Alumina** (Smelter) → 1 Alumina + **4 charge** at Fabricator → **Aluminum Ingot**; 2 Ingot → Aluminum Beam (T6). Same ore count as the old "2 Alumite → 1 beam"; **Alumite is renamed Bauxite** (real). | aluminium Al · 13 · 82,300 · the most abundant metal in the crust, but needs electrolysis (Hall–Héroult) to free it [F15]; bauxite forms when rock weathers for a long time in warm, wet climates [F25]. Lesson: "Common, but it costs lots of electricity." |
| **Black Sand** (titanium) | S | Tidewell beaches | 1 in 10 beach sand blocks | ~30 per beach chunk | 0.5 · Hand | → **Titanium Dioxide** (Smelter) → TiO₂ + 1 Coal + 1 Salt (the chlorine comes from salt) + **8 charge** at the Clean Bench → **Titanium Ingot**; 3 Ingot → Titanium Frame (T6) | Ti · 22 · 5,650 · 9th most abundant element; as strong as steel but much less dense; aircraft and bikes [F4]; much of it comes from the minerals ilmenite and rutile in heavy black sand on beaches and dunes [F21]; Kroll process with chlorine and magnesium [F27]; chlorine is made from salt brine [F28]. Lesson: "**Titanium isn't rare. It's hard to refine.**" |
| **Ilmenite Ore** | B3 | Emberdeep | 3–6 | **5** | 6.0 · Steel | same as Black Sand (1 ore = 2 Black Sand worth) | as above |
| **Quartz** | S (dunes: 1 in 6 sand) + veins B1–B3 | dunes in Rustflats and Tidewell; veins in Glasswood and Frostspire | veins 4–8 | **12** (2 veins) | sand 0.5 · Hand; vein 4.5 · Stone | Quartz + Coal (Smelter) → **Silicon** (T5 Logic Gates rung, Fabricator, locked). Quartz Crystal block (decor). (Glass stays the live **2 Sand → 1 Glass**.) | silicon Si · 14 · 282,000 · 2nd most abundant element; sand and quartz are silica; made by reducing sand with carbon; computer chips [F17] |
| **Salt Crust** | S | Rustflats flats (30% of flat surface), desert dry lakes | sheet | ~170 per flats chunk | 0.8 · Hand | **Salt** (direct). **Salt Pan** (4 Planks + 1 Glass, place beside seawater): 1 Salt per 4 min of daylight, 0 at night | sodium chloride NaCl (Na 11 · 23,600; Cl 17 · 145) · salt beds where ancient seas dried up; food and road de-icing [F18] |
| **Sand / Red Sand / Gravel / Dirt / Stone / Slate** (live) | S / S / S, rivers / S / B1–B4 / B2–B4 | everywhere | — | — | per CORE-MECHANICS | themselves | sand is mostly quartz (silica) [F17] |
| **Clay** | S–B1 | riverbanks, lake beds, Tidewell | patch 6–12 | **16** near water | 0.7 · Hand | Clay → **Brick** (Oven) | clay is an aluminium silicate [F17] |
| **Silver Ore** | B2–B3 | Rustflats edge hills, Emberdeep edges (with zinc) | 2–4 | **1.5** (1 vein per 2 chunks) | 6.0 · Copper | **Silver Ingot** (Smelter) → **Mirror** block (light puzzles), Silver Wire (decor) | Ag · 47 · 0.075 · best reflector of visible light; mirrors [F10] |
| **Gold Ore** (gold-quartz vein) | B3 | Glasswood, Frostspire | 1–3 | **0.4** (1 vein per 5 chunks) | 7.0 · Steel | Gold Ore → Gold Nugget (Smelter) | Au · 79 · 0.004 · found in quartz veins in hard rock and in stream gravel [F8][F23] |
| **Gold Flakes** (placer) | S (river gravel; **more likely in the bottom gravel layer**) | Glasswood and Frostspire streams | — | 1 flake per 60 pans | Use **Pan** (§3) | 9 Flakes → 1 Gold Nugget; Nugget → **Gold Ingot** → **Gold Leaf** (1 → 16 decor coatings: the malleability lesson), Gold Contact (circuit decor), Gold Block | flakes and nuggets collect on or near bedrock in streams [F23] |
| **Platinum Ore** ("Dark Reef") | B4 | Emberdeep only | 1–2 | **0.1** (1 vein per 15 Emberdeep chunks) | 9.0 · Steel | Platinum Ore → Platinum Nugget (Smelter). Nugget → **Platinum Ingot needs the Smelter+ (Embercore)**: Pt melts at 1,768 °C. Ingot → **Catalyst Plate** (placed under a Smelter: smelts 25% faster and is **never used up**, the catalyst lesson) | Pt · 78 · 0.005 · catalytic converters (about 50% of demand); found native in river deposits; mostly from South Africa [F9]; almost all platinum-group metals come from a few giant layered bodies of cooled magma, like South Africa's Bushveld Complex [F20] |
| **Platinum Grains** (placer) | S | Emberdeep rivers | — | 1 per 400 pans | Pan | 9 Grains → 1 Platinum Nugget | native platinum in alluvial deposits [F9] |
| **Rhodium Speck** | — (by-product) | — | — | refining 1 Platinum Nugget at the Clean Bench: 1 in 5 chance | — | 4 Specks → **Rhodium Mirror** (never tarnishes; decor) | Rh · 45 · 0.001 · 80% in catalytic converters; mirror and headlight coatings; a by-product of copper and nickel refining [F7] |
| **Iridium Speck** (LEGENDARY) | B2 (Boundary Clay y −24) / S meteor craters / by-product | §1 Boundary Clay; meteor sites | — | sift: 1 per 250 Boundary Clay; crater: 1–2; Pt refining: 1 in 20 | sift via **Pan** (§3) | 10 Specks → **Iridium Nugget** → **Iridium Spark Tip** (a looks-only Spark Rod skin that never tarnishes; real spark plugs use iridium tips; EFFECTS-SPEC levels are unchanged) or **Meteorite Display** (decor). **Never sold.** First find unlocks the Bertodex entry and a world toast for you only. | Ir · 77 · 0.001 · most corrosion-resistant material known; spark plugs; worldwide impact layer; richer in meteorites [F5][F29]; recovered while refining nickel/PGMs [F6] |
| **Graphite** | B3–B4 | Undervault | 3–6 | **4** | 3.0 · Stone | → Nanocarbon → Nanotube line (World Plan) | carbon C · 6 · most natural graphite formed when heat and pressure changed rocks holding old plant and animal remains (metamorphism) [F26] |
| **Boundary Clay** | y −24 (1 thick) | Commons, Rustflats, Tidewell | continuous layer | ~576 per chunk (one layer) | 0.7 · Hand | breaks into Clay; **sifting with the Pan** is the only way to find Iridium | see Iridium [F5] |
| **Ice / Snow** | S | Frostspire (snow biome) | — | — | per CORE-MECHANICS | themselves (Ice → Cold Glow Vial, Frost Vial) | water ice |
| **Glow Moss** | B1–B3 cave walls | all caves | clumps 2–5 | **8** | 0.3 · Hand | Glow Moss → Glow Pebble ×8; + 1 Copper dust → Glow Mix; 1 Glow Moss + 1 Paint dab (Workbench) → Booster Dye | Verge-flavored (bioluminescent moss and fungi are real; "Glow Mix" chemistry is simplified, see the §8 flags) |
| **Cotton / Corn** (crops) | S | wild bushes in grassland (Commons, Glasswood edges) | bush clumps 3–6 | — | 0.2 · Hand | Cotton → Cloth (3 → 1); **Corn → Bioplastic → Plastic Tube** | crops |
| **Log / Leaves / Berry** (live) | S | forests | — | — | live | live | — |

**Rarity compression (why the numbers look like this):** real abundances span about 8 orders of magnitude (iron 56,300 ppm vs iridium 0.001). The game keeps the **same order** but squishes the gaps so every ore is findable. Each tier rarer in real rock is about 2–10× fewer blocks per chunk in game. Rare metals also add a **place** rule (gold B3 veins + streams, platinum only in Emberdeep B4, iridium only in the Boundary Clay layer and craters), because in the real world *where* matters as much as *how much*.

## 3. Special gathering (all existing verbs)
- **Pan** (3 Planks, Workbench; a wooden pan, like a batea [F34]). **Use** it while aiming at river gravel or sand that's touching water: 2 s swirl, then a result chip. One block can be panned **once** (it turns into "Panned Gravel" until Geology Night).
  - Gold flakes: 1 in 60 in Glasswood and Frostspire streams (×2 on the bottom gravel layer).
  - Tin: 1 in 40 (granite streams).
  - Platinum grains: 1 in 400 (Emberdeep rivers).
  - Otherwise you get the gravel or sand back.
- **Sifting Boundary Clay:** the same Pan, used on a Boundary Clay block (no water needed): 2 s, 1 in 250 gives an Iridium Speck. Each block can be sifted once. The Help card explains the real clue (§6 entry).
- **Meteor falls** (World Plan Starsteel event): about **1 per class Game world per 2 school weeks**, announced 60 s ahead with a sky streak. The crater (unclaimed land only, never on builds) holds 1–2 Iridium Specks and the World Plan's Starsteel. First-come; each kid can collect at most 1 Speck per meteor.
- **Salt Pan:** placed beside seawater, it makes Salt by evaporation in daylight (§2).
- **By-products:** refining at the Clean Bench rolls Rhodium (1 in 5 Platinum Nuggets) and Iridium (1 in 20). The roll is server-seeded per alias, so it can't be re-rolled by reloading.
- **Anti-farm:** placed ore blocks give their item back but never the `natural` flag (no Trade Post value, no Bertodex "found" credit). Ore found by the Bot's Sensor Pack counts as yours.

## 4. Refining chains (summary)
```
Coal Ore ─────────► Coal ──(fuel)──► Smelter / Forge
Iron Ore ─Smelter─► Iron Ingot ─Forge + Coal─► Steel
Copper Ore ─mine─► Raw Copper ─Smelter─► Copper Ingot ─► 4 Copper Wire
                   Raw Copper ─Workbench─► 2 Copper dust ─(+Glow Moss)─► Glow Mix
Zinc Ore ─Smelter─► Zinc Ingot ─(+Copper)─► Battery Cell
Tin Ore ─Smelter─► Tin Ingot ─(8 Cu + 1 Sn, Forge)─► 9 Bronze Ingot
Quartz ─Smelter + Coal─► Silicon (made at Smelter, unlocked by T5; used by Fabricator)
Bauxite ─Smelter─► Alumina ─Fabricator + 4 charge─► Aluminum Ingot ─2─► Aluminum Beam
Black Sand / Ilmenite ─Smelter─► TiO₂ ─Clean Bench + Coal + Salt + 8 charge─► Titanium Ingot ─3─► Titanium Frame
Silver Ore ─Smelter─► Silver Ingot ─► Mirror
Gold Ore / 9 Flakes ─► Gold Nugget ─Smelter─► Gold Ingot ─► 16 Gold Leaf
Platinum Ore / 9 Grains ─► Platinum Nugget ─Smelter+ (Embercore)─► Platinum Ingot ─► Catalyst Plate
                                         └─Clean Bench refine─► (1 in 5 Rhodium Speck, 1 in 20 Iridium Speck)
10 Iridium Specks ─► Iridium Nugget ─► Iridium Spark Tip (skin) / Meteorite Display
Corn ─Oven (2→1)─► Bioplastic ─Workbench (1→2)─► Plastic Tube        Cotton ─3─► Cloth        Clay ─Oven─► Brick
```

## 5. Verge rares (made-up; the Bertodex labels them)
Sunglass, Tidepearl, Floatstone, Frostite, Embercore, Voltamber, Starsteel, Kulite and Nanocarbon (World Plan §5) stay as **Verge materials**. Each Bertodex entry wears a purple **"Verge (made up)"** tag and a "Real idea:" line (for example, Sunglass = photovoltaic glass, Floatstone = permanent magnets), so no kid learns a fake element as real. **Kulite** remains the World Plan's fictional legend *material*; the **Iridium Cog** is the real legendary *currency*, and they never share a name or icon. (The World Plan's "Tidepearl + Copper → Battery Cell" is already superseded by Battery Cell = Copper + Zinc.)

---

## 6. The BERTODEX (Pokédex-style field guide that fills as you discover)

### 6.1 Open it (no new verb, no new key)
- Player Hub → **Bertodex** tab. Or long-press any item, block or critter → Options → **"Bertodex"** (Open). The same panel shapes as the 2.6.0 Bag apply: a sheet upright, a side panel sideways, centered on a Chromebook. ☰ stays top-left, and one step closes it.
- **Build world:** a Teacher sees **every entry fully open** ("Workshop view: all entries"). Nothing unlocks there and no badges move.

### 6.2 Categories (8) and v1 size
| # | Category | Example entries | v1 count (data-driven) |
|---|---|---|---|
| 1 | **Elements** | Cu, Ag, Au, Pt, Ir, Rh, Fe, Zn, Sn, Al, Ti, Si, C, Na, Cl (salt), O (in quartz) | 16 |
| 2 | **Ores & Rocks** | every §2 ore, Boundary Clay, Stone, Slate, Gravel, Sand, Clay | ~22 |
| 3 | **Materials** | ingots, Steel, Bronze, Copper Wire, Copper dust, Alumina, TiO₂, Silicon, Glass, Cloth, Bioplastic, Plastic Tube, Glow Mix, Booster Dye, Gold Leaf, Verge rares | ~30 |
| 4 | **Blocks** | live blocks, doors, furniture, Disco Floor, Bounce Block, Mirror, Catalyst Plate | ~40 |
| 5 | **Items & Machines** | tools, Pan, stations, Lantern, glow tiers, storage, tubes, network, pads, Bot, Drone, music | ~60 |
| 6 | **Plants & Critters** | Cotton, Corn, berry bush, trees, Glow Moss, fireflies, butterflies, songbirds, frogs, prairie dog, cat, Pet Rock | ~20 |
| 7 | **Effects** | Warp, Heal I–III, Spawn, Summon, Morph, Camo, Float, Wonder Lab ×5 | ~14 |
| 8 | **Places** | 8 regions + landmarks (Clock Gate, Prism Observatory…), the Boundary Clay cliff, a meteor crater | ~18 |
Entries live in `src/data/dex.js`. Percentages count **only entries available in the current build**, so adding content never takes a kid's 100% away; new entries show a "New!" ribbon instead.

### 6.3 Unlocking (Game world only)
| Stage | Trigger | What opens |
|---|---|---|
| **Silhouette** | not found yet | dark outline, category, and **one hint line** ("Look deep, near hot rock." / "Pan a mountain stream.") so kids know where to hunt |
| ★ **Found** | first mine, pick up, craft, or see (critters: within 6 blocks for 3 s; effects: first Use; places: first visit) | picture, name, What it is, Where found (biome chips + depth-band bar) |
| ★★ **Handled** | used in any recipe, or collected 10 | What it makes (recipe chips; tap to jump to that entry), the **Real-science fact** |
| ★★★ **Mastered** | used in a **saved Blueprint**, or passed that material's ladder "Try it" demo | the **Pro Build Tip** ("Aluminum Beams: about the same job as steel at about a third of the weight, so your Lift carries more.") |
- A gentle chime and a 1-line card ("New Bertodex entry: Bauxite!") shows with Speak, never covers controls, and closes in one tap.
- Placed-then-mined blocks and Creative items never count (`natural` / Game-world only).

### 6.4 Entry layout (every entry the same)
1. **Picture:** a slowly turning 3D icon (static with Reduced motion), plus the element symbol tile on element entries
2. **What it is:** one line, kid level
3. **Where found:** biome chips + a depth-band bar (S / B1–B4), with "Also: panning" or "Also: meteor" chips
4. **What it makes:** recipe chips
5. **Real science:** 1–2 lines, each tied to a Fact-check ID in the data file (`fact:"F9"`)
6. **Use it in builds:** the Pro tip (★★★)
7. **🔊 Speak / ⏹ Stop**
8. Tags: "Verge (made up)" (purple) or "Real element" (teal)

### 6.5 Talking Bertodex (TTS)
- **Reuse the existing Speak pattern:** 🔊 Speak + a visible ⏹ Stop, with the spoken line highlighted (fixq/bertopia-250 #23), through `KulibertPrefs.say()` / `voiceFor(lang)` (hub-i18n-7 #7).
- **Speak reads only unlocked fields**, in order: name → what it is → where found → real science → build tip. On a silhouette it reads "Not found yet. Hint: …".
- **Languages: the 8 the apps support, `en uk ru es ar fa-AF rw ti`** (NEXT-50 header; hub-i18n-7 #6).
  - Voices: en-US, uk-UA, ru-RU, es-US, ar; fa-AF → fa.
  - **rw and ti have no device voices** (and fa-AF may only find Persian). Per the existing rule, it **never speaks in another language's voice**: it shows the words in the live caption with the `noVoice` line.
  - All new rw, ti and fa-AF Dex strings go on `/shared/i18n/needs-check.json` for a native check.
- **Content flow:** Curriculum Bot writes and checks the en lines → i18n keys (`dex.<id>.what|where|fact|tip|hint`) → translations. Element names use each language's standard chemistry name. Arabic and Dari panels mirror; the depth bar does not.

### 6.6 Completion badges (Game world only; Silver and up wait for class time)
| Badge | Trigger | Pays |
|---|---|---|
| **Rockhound** | Ores & Rocks: all ★ | 10 Copper |
| **Element Hunter** | Elements: all ★ | 10 Copper |
| **Materials Maven** | Materials: all ★ | 10 Copper |
| **Block Expert** | Blocks: all ★ | 10 Copper |
| **Inventor's Index** | Items & Machines: all ★ | 10 Copper |
| **Field Naturalist** | Plants & Critters: all ★ | 10 Copper |
| **Effects Expert** | Effects: all ★ | 10 Copper |
| **Atlas Explorer** | Places: all ★ | 10 Copper |
| **Dex 25%** | 25% of entries ★ | 10 Copper |
| **Dex 50%** | 50% | 10 Copper + **Dex Shelf** decor block |
| **Dex 75%** | 75% | 1 Silver |
| **Dex 100%: Bertodex Master** | every entry ★ (this needs a real Iridium Speck find) | 1 Gold + **1 Iridium Cog** + **Golden Bertodex** trophy block |
| **Full Periodic Wallet** | all 16 Element entries ★ **and** you've held at least 1 Copper, Silver, Gold and Platinum Cog | **Periodic Table Wall** trophy (a placeable wall of the table with your found elements lit) |
| **Dex Scholar** | 25 entries at ★★★ Mastered | 1 Silver |
- Plus **Market Watcher** and the renamed **Patent Holder** (ECONOMY §5–6).
- These 15 are new; the 34 Progression badges are unchanged (Remix Star → Patent Holder is a rename).

### 6.7 Kid-safe
- **No free text anywhere in the Dex:** no notes, comments or ratings, and **no typing.** You browse with category chips, an A–Z scrubber, a "Not found yet" filter and a "Near me" filter (the biome you're in).
- No other player's progress is shown except on the alias-only class "Dex %" board, which is opt-in and covered by "Just for fun."
- Facts stay real and sourced; Verge items are clearly labeled.
- Tap-first; tiles are at least 44 px (48 on phones); it works one-thumb at 360×740 and at 1366.

---

## 7. Live game vs this spec (BT 2.5.x code, read-only)
1. **No ores generate.** `genVoxel` is grass/dirt/stone down to y −63; the Coal block (id 5) exists only in the palette and via `session.give('coal')`. Needs: ore placement by band and biome per §2.
2. **No biomes.** One sine-hill terrain plus the town box. §1 needs the World Plan biome cells first (Red Soil patches, the Boundary Clay layer, rivers for panning).
3. **No rivers or sea** for placers and the Salt Pan. The pond is ice.
4. **Matches:** the Coreplate at y −64; `chunkSize: 24`; `coal: base 0, sell:false` (so the Trade Post never buying coal fits); `glass` from 2 sand (Oven).
5. **Name clash:** the live block "Slate" (`greystone`) is fine. The Progression Plan's "Alumite ore" is **renamed Bauxite**.

---

## 8. Fact check for Curriculum Bot
Every factual claim in this file and in `BERTOPIA-ELEMENT-ECONOMY.md`. ✅ = I read the quoted text at the URL today. ⚠ = please confirm against the primary source (the number or wording comes from a secondary page, or the page blocks bots).

| ID | Claim(s) | Source URL | Status |
|---|---|---|---|
| F1 | CRC whole-crust abundance (mg/kg = ppm): O 461,000 · Si 282,000 · Al 82,300 · Fe 56,300 · Na 23,600 · Ti 5,650 · C 200 · Cl 145 · Zn 70 · Cu 60 · Sn 2.3 · Ag 0.075 · Pt 0.005 · Au 0.004 · Ir 0.001 · Rh 0.001. Ti is 9th by mass (after O, Si, Al, Fe, Ca, Na, Mg, K). | CRC Handbook of Chemistry & Physics, 85th ed., §14 "Abundance of Elements in the Earth's Crust and in the Sea," as tabulated at https://en.wikipedia.org/wiki/Abundances_of_the_elements_(data_page) (column C1) | ✅ keep. Reproduction cites CRC 97th ed. §14 p.17; print copy not checked (no authorized copy online). Curriculum 10-04 |
| F2 | Upper continental crust (recommended): Ag 53 ppb, Au 1.5 ppb, Pt 0.5 ppb, Ir 0.022 ppb; **Cu 28 ppm** | Rudnick & Gao 2003, Treatise on Geochemistry 3:1–64, Table 3, https://doi.org/10.1016/B0-08-043751-6/03016-4 (excerpt: https://www.researchgate.net/publication/234288836) | ✅ Curriculum 10-04: Table 3 read, Cu 28 ±4 µg/g. Note Pt 0.5 ±0.5 ng/g (95% uncertainty), so soften "3× rarer" (see "Curriculum fact-check 2026-10-04" below) |
| F3 | RSC/BGS "crustal abundance": Cu 27, Ag 0.055, Au 0.0013, Ti 4,136, Ir 0.000037. **Pt and Rh are also listed as 0.000037, identical to Ir, which looks like a data copy, so it's not used for ranking.** | https://periodic-table.rsc.org/element/77/iridium · /78/platinum · /45/rhodium · /79/gold · /29/copper · /47/silver · /22/titanium | ✅ Curriculum 10-04: RSC shows 0.000037 for Ir, Pt and Rh alike. RSC defines this as atoms per million atoms (not ppm by mass), so never mix it with CRC/R&G numbers. Reporting to RSC = Diego's call |
| F4 | "Titanium is the ninth most abundant element on Earth"; "as strong as steel but much less dense"; used in aircraft, spacecraft, bicycles | https://periodic-table.rsc.org/element/22/titanium | ✅ |
| F5 | Iridium: "the most corrosion-resistant material known"; density 22.56 g/cm³; mp 2446 °C; meteors and asteroids hold more Ir than the crust; a thin worldwide Ir layer thought to come from an impact "some scientists think" ended the dinosaurs (Alvarez 1980) | https://periodic-table.rsc.org/element/77/iridium ; Alvarez et al., Science 208:1095 (1980), https://doi.org/10.1126/science.208.4448.1095 | ✅ Curriculum 10-04: Alvarez 1980 abstract read (Europe PMC; says 65 Ma). Use "about 66 million years": ICS Chart 2024/12, base of Paleogene 66.00 Ma |
| F6 | Iridium is recovered commercially as a by-product of nickel refining; about 3 t produced a year; top producers South Africa, Russia, Zimbabwe; PGEs occur together and are mined in only a few places | RSC iridium page (as F5); USGS PP 1802-N https://pubs.usgs.gov/publication/pp1802N | ✅ RSC (the "3 t" is from an older podcast); ✅ USGS abstract |
| F7 | Rhodium: 80% goes to catalytic converters; coats mirrors and headlight reflectors; by-product of copper and nickel refining; ~30 t/yr | https://periodic-table.rsc.org/element/45/rhodium | ✅ |
| F8 | Gold: most malleable metal; 1 g → 1 m² sheet about 230 atoms thick; 1 g → 165 m of 20 µm wire; found in veins and alluvial deposits; mp 1064.18 °C | https://periodic-table.rsc.org/element/79/gold | ✅ |
| F9 | Platinum: main use catalytic converters (~50% of demand); also a chemical catalyst; mp 1768.2 °C; found uncombined in alluvial deposits; most comes from South Africa | https://periodic-table.rsc.org/element/78/platinum | ✅ |
| F10 | Silver "is the best reflector of visible light known" (mirrors); mp 961.78 °C | https://periodic-table.rsc.org/element/47/silver | ✅ |
| F11 | Silver conducts electricity better than copper (resistivity at 20 °C: Ag ≈ 1.59, Cu ≈ 1.68 µΩ·cm) | CRC Handbook, "Electrical Resistivity of Pure Metals" | ✅ Curriculum 10-04: NIST JPCRD 8:1147 (Matula 1979), 293 K: Ag 1.587, Cu 1.678 ×10⁻⁸ Ω·m (= µΩ·cm) |
| F12 | Copper was the first metal worked; tin hardens it into bronze, giving the Bronze Age its name; most copper goes into electrical wiring and motors because it conducts heat and electricity well; mp 1084.62 °C | https://periodic-table.rsc.org/element/29/copper | ✅ |
| F13 | Tin: ore cassiterite; "tin belt" China–Thailand–Indonesia; tin cans are tin-coated steel; solder, pewter, bronze; window glass floated on molten tin. Historic prospecting by panning. | https://periodic-table.rsc.org/element/50/tin ; USGS PP 1802-S https://pubs.usgs.gov/publication/pp1802S | ✅ |
| F14 | Zinc: galvanizing; brass | https://periodic-table.rsc.org/element/30/zinc | ✅ |
| F15 | Aluminium: most abundant metal in the crust (RSC says 8.1%); from bauxite; extracted by Hall–Héroult electrolysis | https://periodic-table.rsc.org/element/13/aluminium | ✅ |
| F16 | Iron: "90% of all metal that is refined today is iron"; ores haematite and magnetite; blast furnace with coke (carbon) | https://periodic-table.rsc.org/element/26/iron | ✅ |
| F17 | Silicon: 2nd most abundant element; sand and quartz are silica; produced by reducing sand with carbon; semiconductor chips; clay is an aluminium silicate; sand is glass's main ingredient | https://periodic-table.rsc.org/element/14/silicon | ✅ |
| F18 | Salt (NaCl): salt beds where ancient seas evaporated; used in food and for de-icing roads | https://periodic-table.rsc.org/element/11/sodium | ✅ |
| F19 | USGS 2024 estimated mine production: **Cu** 23 Mt (Chile 5.3, DR Congo 3.3, Peru 2.6) · **Ag** 25,000 t (Mexico 6,300) · **Au** 3,300 t (China 380, Russia 310, Australia 290) · **Pt** 170 t (South Africa 120) · ilmenite 8.9 Mt (China 3.3, Mozambique 1.9, S. Africa 1.3) · bauxite 450 Mt (Guinea 130, Australia 100) · iron ore 2.5 Gt (Australia 930 Mt) · tin 300,000 t (China 69,000, Indonesia 50,000) · zinc 12 Mt (China 4.0) · salt 280 Mt (China 55) | USGS Mineral Commodity Summaries 2025: https://pubs.usgs.gov/periodicals/mcs2025/mcs2025-copper.pdf · -silver.pdf · -gold.pdf · -platinum-group.pdf · -titanium-minerals.pdf · -bauxite-alumina.pdf · -iron-ore.pdf · -tin.pdf · -zinc.pdf · -salt.pdf | ✅ (pdftotext read; units differ per sheet, so check them) |
| F20 | PGEs come mainly from layered mafic–ultramafic intrusions such as South Africa's Bushveld Complex | USGS PP 1802-N https://pubs.usgs.gov/publication/pp1802N | ✅ Curriculum 10-04: PP 1802-N chapter PDF read (summary) |
| F21 | Titanium minerals ilmenite and rutile; heavy-mineral sands | USGS PP 1802-T https://pubs.usgs.gov/publication/pp1802T ; RSC titanium | ✅ Curriculum 10-04: PP 1802-T chapter PDF read (shoreline deposits section) |
| F22 | Porphyry copper deposits form around intrusions in volcanic settings and are large and low-grade | USGS SIR 2010-5070-B https://pubs.usgs.gov/sir/2010/5070/b/ | ✅ Fix wording. Curriculum 10-04: SIR 2010-5070-B summary read (magmatic arcs, low grade, >60% of world copper) |
| F23 | Gold forms lode (primary) and placer (secondary) deposits; freed gold travels downstream as dust, flakes, grains and nuggets, concentrated on or near bedrock | USGS "Prospecting for Gold in the United States" https://pubs.usgs.gov/gip/prospect1/goldgip.html | ✅ Curriculum 10-04: "gold-quartz veins" confirmed by USGS Bulletin 1693 model 36a (Low-sulfide Au-quartz veins) |
| F24 | Coal formed from plant material buried in ancient swamps | USGS FAQ https://www.usgs.gov/faqs/what-coal | ✅ Fix wording ("forests and marshes", not "swamps"). Curriculum 10-04: USGS FAQ read via curl |
| F25 | Bauxite forms by intense weathering in tropical climates (laterite) | USGS bauxite page https://www.usgs.gov/centers/national-minerals-information-center/bauxite-and-alumina-statistics-and-information | ✅ Fix wording ("warm, wet climates"). Curriculum 10-04: USGS Bulletin 1693 model 38b read |
| F26 | Graphite is carbon that forms in metamorphic rock | USGS PP 1802-J https://pubs.usgs.gov/publication/pp1802J | ✅ Fix wording. Curriculum 10-04: PP 1802-J chapter PDF read (summary + Natural Graphite) |
| F27 | Titanium is made by the Kroll process (TiCl₄ reduced with magnesium) | https://periodic-table.rsc.org/element/22/titanium | ✅ |
| F28 | Chlorine is made by electrolysis of brine (salt solution) | https://periodic-table.rsc.org/element/17/chlorine | ✅ |
| F29 | Platinum-iridium alloy in the old standard metre bar and kilogram; iridium in spark plugs | https://periodic-table.rsc.org/element/77/iridium | ✅ |
| F30 | "N× rarer" comparisons are arithmetic on F2: 28/0.053 ≈ 530; 0.053/0.0015 ≈ 35; 1.5/0.5 = 3; 0.5/0.022 ≈ 23; 28/0.000022 ≈ 1.27 million; gold:platinum mined ≈ 3,300/170 ≈ 19 ("about 20×") | derived | ✅ arithmetic |
| F31 | 1 ppm by mass = 1 g per tonne; a tonne is roughly a small car | definition | ✅ (the car comparison is approximate) |
| F32 | **Corrections to earlier docs:** (a) Progression Plan §1.2 "1 g of gold → ~2 km of wire" isn't supported by RSC (165 m of 20 µm wire), so it's replaced by the 1 m² sheet fact. (b) BASICS-GM Jumbo Glow no longer uses Salt: it uses Booster Dye (1 Glow Moss + 1 Paint dab at the Workbench), and its lesson is the exact glow-stick dye explanation. Salt is not a catalyst here. (c) Progression Plan §1.2 "Platinum melts at about 1,768 °C" ✅ matches RSC. | RSC gold page; glow-stick chemistry: RSC Education "The glow stick reaction" | ✅ (b) chemistry confirmed. GameMaster 2026-10-04 |
| F33 | Atomic numbers: C 6, O 8, Na 11, Al 13, Si 14, Cl 17, Ti 22, Fe 26, Cu 29, Zn 30, Rh 45, Ag 47, Sn 50, Ir 77, Pt 78, Au 79 | RSC periodic table pages above; Los Alamos https://periodic.lanl.gov/index.shtml | ✅ RSC |
| F34 | A wooden gold pan ("batea") is a real traditional tool | Powerhouse Museum (Sydney), object 1536 https://collection.powerhouse.com.au/object/1536 | ✅ keep "batea". Curriculum 10-04 |
| F35 | Real tin bronze is about 88–90% copper and 10–12% tin; the decided recipe is 8 Copper Ingot + 1 Tin Ingot → 9 Bronze Ingot (about 11% tin) | Copper Development Association https://copper.org/resource-library/copper-tin/ | ✅ GameMaster decision: use the 8:1 recipe and card text "about 9 parts copper to 1 part tin, like real tin bronze". Curriculum 10-04 |

---

## Curriculum fact-check 2026-10-04
Curriculum Bot, about 7:15 AM ET. I read every source below today. Quotes are trimmed, never reworded. Backups: `BERTOPIA-ORE-TABLE.md.bak-2026-10-04` and `BERTOPIA-ELEMENT-ECONOMY.md.bak-2026-10-04`. I changed only claim text and student fact lines. No drop rates, prices, recipes or ratios changed.

| ID | Verdict | Corrected student line (en, grade 5–6) | Primary source (what I read) |
|---|---|---|---|
| F1 | OK, keep | (no change) | Wikipedia data page reproduction citing CRC 97th ed. §14 p.17. I didn't check the print copy, because no authorized copy is online. |
| F2 | OK + soften Pt | Platinum card: "Platinum is hard to measure in rock … near the surface, platinum is probably about 3 times rarer." | Rudnick & Gao 2003, Table 3: Cu 28 ±4 µg/g; Ag 53, Au 1.5, Pt 0.5 ±0.5, Ir 0.022 ng/g. USGS PP 1802-N also says "Earth's upper crust contains only about 0.0005 part per million (ppm) platinum." |
| F3 | OK (the oddity is real) | (no change) | RSC pages 77/78/45 each show "Crustal abundance (ppm) 0.000037". RSC defines it as "The number of atoms of the element per 1 million atoms of the Earth's crust", so it's not by mass. |
| F5 | OK, keep "about 66 million years" | (no change) | ICS Chronostratigraphic Chart 2024/12 (stratigraphy.org): Danian base 66.00 Ma. Alvarez et al. 1980 abstract (Europe PMC): "iridium increases … at precisely the time of the Cretaceous-Tertiary extinctions, 65 million years ago." RSC: "Some scientists think that this could be the same meteor or asteroid impact that wiped out the dinosaurs." Also RSC: iridium "with osmium … one of the two densest of all the elements." |
| F11 | OK | Silver card: "Silver carries electricity even better than copper. But copper is far more common, so it costs less, and house wires use copper." | NIST JPCRD 8:1147 (Matula 1979), recommended values at 293 K: Ag 1.587, Cu 1.678 ×10⁻⁸ Ω·m. RSC copper: "it is the most common of the three and therefore the least valued." |
| F20 | OK | "Almost all platinum comes from a few giant layered bodies of cooled magma, like the Bushveld Complex in South Africa." | USGS PP 1802-N: "almost all the reported production and identified resources are associated with deposits in three geologic features—the Bushveld Complex, which is a layered mafic to ultramafic intrusion in South Africa; the Great Dyke … Zimbabwe; and … Noril'sk-Talnakh area of Russia." https://pubs.usgs.gov/pp/1802/n/pp1802n.pdf |
| F21 | OK | "Much of our titanium ore comes from heavy black sand on beaches and dunes. The sand holds the minerals ilmenite and rutile." | USGS PP 1802-T: "Much of the high-grade ilmenite and rutile used today is extracted from unconsolidated heavy minerals … in shoreline beach placers and concentrations in sand dunes." https://pubs.usgs.gov/pp/1802/t/pp1802t.pdf |
| F22 | Fix (wording) | "Most mined copper (over 60%) comes from giant 'porphyry' deposits. The rock holds only a little copper, but there is a huge amount of it. They form from magma under chains of volcanoes." | USGS SIR 2010-5070-B: "high tonnage (greater than 100 million tons), low to moderate grade (0.3–2.0 percent copper) ores … more than 60 percent of the annual world copper production … magmatic arcs along convergent plate margins." https://pubs.usgs.gov/sir/2010/5070/b/pdf/SIR10-5070B.pdf |
| F23 | OK ("gold-quartz veins" confirmed) | "Gold is found in quartz veins in hard rock, and as flakes and nuggets in stream gravel." | USGS Bulletin 1693, model 36a (Berger), "Low-sulfide Au-quartz veins": "Gold in massive persistent quartz veins mainly in regionally metamorphosed volcanic rocks." https://pubs.usgs.gov/bul/1693/report.pdf. USGS goldgip: particles "concentrated on or near bedrock." |
| F24 | Fix (swamps → forests and marshes) | "Coal formed from plants in ancient forests and marshes. They were buried and squeezed for millions of years." | USGS FAQ "What is coal?": "formed from plant remains that have been compacted, hardened, chemically altered, and metamorphosed by heat and pressure … where prehistoric forests and marshes existed before being buried and compressed over millions of years." https://www.usgs.gov/faqs/what-coal |
| F25 | Fix (tropical → warm, wet) | "Bauxite forms when rock weathers for a very long time in warm, wet places." | USGS Bulletin 1693, model 38b (Patterson), laterite type bauxite: "Weathered residual material in subsoil formed on any rock containing aluminum … Surficial weathering on well-drained plateaus in region with warm to hot and wet climates." |
| F26 | Fix (wording) | "Graphite is pure carbon. Most natural graphite formed when heat and pressure changed rocks that held old plant and animal remains." | USGS PP 1802-J: "Natural graphite typically forms as a result of metamorphism (regional or contact) of accumulations of organic matter in sedimentary rocks." https://pubs.usgs.gov/pp/1802/j/pp1802j.pdf |
| F32(b) | OK (chemistry) | Glow card: "A glow stick mixes two chemicals. The reaction gives its energy to a dye, and the dye glows. The dye picks the color." | RSC Education, "The glow stick reaction" (Fleming 2019): oxalate ester oxidized by hydrogen peroxide → 1,2-dioxetanedione → "a fluorescent dye can capture energy from the CO2 efficiently and release this in the form of visible light." The demo is "catalysed by a base such as sodium acetate". https://edu.rsc.org/exhibition-chemistry/the-glow-stick-reaction/3010386.article |
| F34 | OK, keep "batea" | Pan entry: "A batea is a wooden, cone-shaped pan. Swirl gravel and water in it. The light rock washes out, and the heavy gold stays in the middle." | Powerhouse Museum object 1536, "Gold-washing pan, 'batea', wood … Mexico, c. 1880"; label: "A conical shaped dish used by prospectors for gold washing. The pulverised rock is washed away, leaving the heavier particles of gold in the centre of the dish." https://collection.powerhouse.com.au/object/1536 |
| F35 | Fix (recipe + wording) | Bronze card: "about 9 parts copper to 1 part tin, like real tin bronze"; recipe: 8 Copper Ingot + 1 Tin Ingot → 9 Bronze Ingot (about 11% tin). | Copper Development Association, Copper Tin: C90700 tin bronze "Nominal Composition: Cu 88-90, Sn 10-12"; "Tin bronzes, with up 15.8% tin, retain the structure of alpha copper." https://copper.org/resource-library/copper-tin/ |

**Cut:** none. Everything above was verified on the first or second try.

### Flags for GameMaster (mechanics, decided 2026-10-04)
1. **Bronze recipe — decided by GameMaster.** Use 8 Copper Ingot + 1 Tin Ingot → 9 Bronze Ingot (Forge), about 11% tin and inside the real 10–12% tin-bronze range. Card text: "about 9 parts copper to 1 part tin, like real tin bronze".
2. **Platinum above gold on the Cog ladder — no action.** The order and "probably" wording stay as written.
3. **Jumbo Glow recipe — decided by GameMaster.** Remove Salt. Use 1 Glow Moss + 1 Paint dab → 1 Booster Dye (Workbench), then Tube + 2 Glow Mix + 1 Booster Dye for Jumbo Glow. Radius 5 and about 40 min stay. Lesson: "A glow stick mixes two chemicals. The reaction gives its energy to a dye, and the dye glows. The dye picks the color." Nothing calls salt a catalyst.
4. **Abundance-number rule — decided by GameMaster.** Ranked or compared abundance columns use mass ppm only (CRC, Rudnick & Gao). RSC values are atoms per million atoms, so they appear only in a footnote labeled that way; never mix them with mass-ppm columns.
5. **Iridium "one of the two densest elements" (economy §1.1).** It's verified on the RSC iridium page (podcast transcript: "with osmium it's one of the two densest of all the elements"). No change.


GameMaster 2026-10-06: open questions answered in BERTOPIA-GM-ANSWERS-2026-10-06.md (same folder) (Paint dab = Berry at Workbench; Plastic Tube via Oven, not Smelter; Silicon made at Smelter, used by Fabricator; one Pick per tier, no durability; quick tap never breaks blocks in the Game world; static water + ores = world-1 right after 260b, snow/biomes = world-2). That file overrides older lines here.
