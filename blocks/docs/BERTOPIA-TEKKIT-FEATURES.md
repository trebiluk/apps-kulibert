# Bertopia: tech-mod machines, our way (features list and crazy goals)
**Status: starter for GameMaster; GameMaster owns final ranking and goals.** (Flo routed this to GameMaster at 6:59 AM. Debugzy will not polish it further.)
Debugzy, 2026-10-06, 7:0x AM ET. Asked for by Diego at 6:56 AM ("features list of the best tekkit builds… crazy goals").
**Starts from:** `fixq/bertopia-WORLD-PLAN.md` §N (approved by Diego 10:36 AM Oct 3, except EE-style transmutation), `fixq/bloxbert-CURRICULUM.md` Strand M (M1–M5), and the locked ten verbs in `BERTOPIA-CORE-MECHANICS.md` §0.
**Linked from:** `BERTOPIA-CODING-PLAN.md` §T. Stage codes such as `mach-1` are defined in that plan's stage map (§S).

**House rules (they apply to every row):**
- No weapons and no gun shapes.
- No nuclear: the **Fusion Core** is the late-game plant.
- No real money.
- No explosives. A blast is always a timed, marked Quarry dig.
- Nothing hurts another player or their build without their accept.
- The **game never shows** Tekkit, Minecraft, or any mod or brand name. Mod names in this doc are *inspiration notes for the team only*. Every in-game name and texture is ours.
- Every powered block uses the shared Energy rules in STORAGE-SPEC (1 charge unit; Charger 5/min, Solar 2.5/min, Battery Box 40). **Out of power never loses items.**
- Machines only run in loaded chunks, plus a capped **catch-up** when the chunk loads again (time away × rate, max 8 game-hours). This keeps Chromebooks cool. See CODING-PLAN §S.mach.

The ten verbs: 1 Move · 2 Mine · 3 Place · 4 Use · 5 Open · 6 Connect · 7 Pair · 8 Move-item · 9 Craft · 10 Paint.

---

## 1. Ranked features list
Rank = how much kids loved it in the original × what it teaches × how cheap it is for us. "In plan?" means in the World Plan §N, STORAGE-SPEC, or another locked spec. ⚠ NEW ACTION marks a row that might not fit the ten verbs; those rows go to GameMaster (§3).

| # | Our name | Inspired by (doc only) | What it does | Verbs | Real tech skill | Stage | In plan? |
|---|---|---|---|---|---|---|---|
| 1 | **Item Tube, Filter Tube, Sorter** | BuildCraft pipes, RedPower tubes | Moves items between storage and machines. Filters and sorter outputs follow rules (By Item ≤6, Type, Color). | Place, Connect (tap end), Open (filter Options) | Logistics, sorting into categories, flow and jams | `storage-4` (2.6.x) | ✅ STORAGE-SPEC §2 |
| 2 | **Ore Grinder** | IndustrialCraft macerator | 1 ore → 2 dusts → 2 ingots, so it doubles yield. Powered: 1 charge per 4 ores. | Place, Open, Move-item, Connect | Yield %, ratio, process efficiency | `mach-1` | ✅ §N |
| 3 | **Electric Smelter** | IC2 electric furnace | Smelts with charge, not coal: 1 charge per 2 smelts. Twice as fast as the Smelter. | Place, Open, Move-item, Connect | Energy vs fuel, trade-offs | `mach-1` | ✅ §N |
| 4 | **Bot helpers (code-driven)** | ComputerCraft turtles | Your Bot runs a program (walk, turn, repeat, if, dig, place) from the shared Code Runtime. | Pair, Open (code panel), Use (Run/Step/Stop) | Coding: sequence, loops, conditionals, debugging | `bot-code-1` | ✅ §6a, §H2 |
| 5 | **Storage Network + Terminal** | Applied Energistics ME | Many storages become one searchable network. Drives teach "kinds vs amount". | Place, Connect, Open, Move-item | Networks, nodes and links, databases and search | `storage-5` | ✅ STORAGE-SPEC §3 |
| 6 | **Quarry Rig** | BuildCraft quarry | Mark a rectangle on your own land. A frame and gantry dig layer by layer into a Box or tube. A warning light and a 10 s countdown come first. | Place (markers, rig), Connect, Use (start/stop), Open (status) | Planning, area × depth = volume, site safety | `mach-3` | ✅ §N, M4 |
| 7 | **Solar + battery village grid** | IC2 solar, BatBox/MFE/MFSU | Solar Panels, Battery Box, then a **Capacitor Bank** (400). A grid meter shows made / stored / used. | Place, Connect, Open | Making, storing and using power; load balancing | `basics-3`, `storage-6`, `power-2` | ✅ STORAGE-SPEC energy, §B |
| 8 | **Transformers (Low / Med / High)** | IC2 transformers | Lines carry Low, Medium or High. Feeding High into a Low machine makes it **trip**: sparks, a "Too much voltage" chip, and the machine pauses until you fix it. No fire and no damage. | Place, Connect, Open | Voltage vs current, matching parts, protection | `power-2` | ✅ §N |
| 9 | **Wind Turbine, Water Wheel, Biofuel Generator** | IC2 generators, BuildCraft engines | More power makers. Wind is stronger up high. The wheel needs a **river** tag. Biofuel burns Corn Mash. | Place, Connect, Open, Move-item | Renewable vs fuel power, siting | `power-2` | ✅ §N (biofuel is new) |
| 10 | **Blueprint Builder and Area Filler** | BuildCraft filler, builder, architect | Area Filler: fill, clear or pattern a marked box. Builder: scan a build into a Blueprint and rebuild it from materials in a Box. | Place, Use, Open, Move-item | Blueprints, bill of materials, repeatability | `mach-3` | ✅ §N, §9A |
| 11 | **Logic gates, timer, counter, sensors** | RedPower logic, ComputerCraft redstone | AND, OR, NOT, timer, counter, Step Plate, Light Sensor, Item Detector. | Place, Connect, Open (settings) | Digital logic, truth tables, sensors | `circuits-1` (T5) | ✅ §A, Circuit Daily |
| 12 | **Block Breaker, Deployer, Item Detector** | RedPower breaker, deployer | On a signal, a Breaker mines the block in front, a Deployer places or uses the item, and a Detector counts. | Place, Connect, Open | Automation, sensors to actuators | `circuits-2` | ✅ §N |
| 13 | **Assembler (auto-craft)** | BuildCraft auto workbench, AE autocrafting | Holds one recipe and crafts whenever its inputs arrive by tube. | Place, Open (pick recipe), Connect | Automation, recipes as programs | `mach-2` | 🆕 |
| 14 | **Chassis (moving frames)** | RedPower frames and motors | Frames glued together slide 1 block per pulse: doors, lifts, drawbridges. | Place, Connect, Open (direction) | Mechanisms, linear motion | `mech-1` | ✅ (Chassis) |
| 15 | **Glideway maglev** | Railcraft | Track, stations and pods. Ride = Use on a pod. Moving or Jump gets you off. Speed and gradient limits apply. | Place, Connect, Use, Move | Transport, gradients, scheduling | `rail-1` | ✅ §C |
| 16 | **Glideway switches, boosters, detectors** | Railcraft switches and detectors | Route pods by sign rule, and count passes. | Place, Connect, Open | Routing, signals | `rail-2` | ✅ §C |
| 17 | **Auto-farm: Planter, Harvester, Sprinkler** | Forestry farms, BuildCraft | Plants, waters and harvests crops and trees in a marked plot. Output goes to a tube or Box. | Place, Connect, Open, Move-item | Agri-tech, cycles, throughput | `agri-1` | ✅ §N |
| 18 | **Pollinator bots and beehive-lite** | Forestry bees | Pollinator bots raise yield next to flowers. The Bertodex tells the pollinator story. | Place, Pair, Open | Ecology, pollination, systems | `agri-2` | ✅ §N |
| 19 | **Seed Lab (traits-lite)** | IC2 crop breeding, Forestry genetics | Cross 2 seeds and see which traits carry over (size, speed, color). No real genetics claims beyond "traits pass down". | Place, Open, Move-item | Science method, inheritance basics | `agri-2` | 🆕 (Curriculum check) |
| 20 | **Compressor and Extract Press** | IC2 compressor and extractor | The Compressor turns 9 dust into 1 dense plate (Beam parts). The Press gets Rubber-lite or Juice from plants. (Renamed so it doesn't clash with the storage **Extractor**.) | Place, Open, Move-item, Connect | Material processing, density | `mach-1` | ✅ §N (renamed) |
| 21 | **Recycler** | IC2 recycler | Surplus items become **Scrap**, and Scrap pays machine upkeep. No "anything into anything" (EE-style is skipped). | Place, Open, Move-item | Recycling, circular economy | `mach-2` | 🆕 |
| 22 | **Power Meter tool** | IC2 EU-reader | Tap any wire or machine to read charge/min in, out and stored. | Use (on a block) | Measurement, units | `power-1` | 🆕 |
| 23 | **Radio Link pair** | RedPower wireless, Wireless Redstone | Two paired blocks pass an on/off signal over distance on any of 8 colour channels. | Place, Pair, Open (channel) | Wireless signals, channels | `circuits-2` | 🆕 |
| 24 | **Ribbon Cable (4 signals in one)** | RedPower bundled cable | One cable carries 4 coloured signals, picked with Paint. | Place, Connect, Paint | Multiplexing, buses | `circuits-3` | 🆕 |
| 25 | **Brainbox + Wall Monitor** | ComputerCraft computer + monitor | A placeable microcontroller runs a Code Runtime program. A Monitor shows text or a number, like a score display. | Place, Connect, Open (code) | Coding I/O, displays | `code-2` | ✅ §H2 |
| 26 | **Mining Beam** | IC2 mining laser (not gun-shaped) | A wand/drill: hold to mine up to 6 blocks away in a straight line. 1 charge per 8 blocks. **Never hits players.** | Mine (hold, at range) | Energy cost vs speed | `gear-1` | ✅ §N |
| 27 | **Exo-Suit** | IC2 jetpack, nano and quantum armor | A worn suit with a battery: jump boost, safe fall, short glide. | Move-item (wear), Use (worn button), Move (hold Jump = glide) | Battery life, efficiency, mechanics | `gear-1` | ✅ §N · ⚠ glide = "hold Jump in air" uses the Gravity Hat pattern; confirm it's not a new action |
| 28 | **Autocraft requests from the Terminal** | AE crafting CPU | Ask the network for 16 Beams and it schedules Assemblers. | Open (Terminal), Use (Request) | Scheduling, dependency trees | `storage-7` | 🆕 |
| 29 | **Tunnel Bore bot** | Railcraft tunnel bore | A slow bot that bores a 3×3 tunnel and lays Glideway track. Big, costly, crew-sized. | Place, Pair, Use | Civil engineering, logistics | `rail-3` | 🆕 |
| 30 | **Fusion Core** | (replaces IC2/BigReactors reactors; **no nuclear**) | A multi-block village power plant. It needs coolant loops, magnets (copper coils), upkeep, and a crew. If cooling fails, it **shuts down the grid safely**, with no explosion. | Place, Connect, Open (control panel), Move-item | Systems engineering, feedback control, teamwork | `fusion-1` | ✅ §N |
| 31 | **Wonder Lab effects** | Thaumcraft research and wands (idea only) | Science-looks-like-magic effects I–III, made at the Lab Bench. | Craft, Use | Chemistry and physics ideas | `effects-1..3` | ✅ EFFECTS-SPEC |
| 32 | **Drafting Table research** | Thaumcraft research notes | Read Blueprint Scrolls to unlock materials (the T1–T7 ladder). | Open, Move-item | Research, documentation | `ladder-1` | ✅ PROGRESSION |
| 33 | **Teleport Pads (items) and Delivery Drone** | EnderStorage/AE P2P idea | Item transport over distance. Pads are instant but hungry, the drone is slow but cheap. | Place, Pair, Move-item, Use | Speed vs cost vs capacity | `storage-3` | ✅ STORAGE-SPEC §4 |
| 34 | **Chunk Keeper** | chunk loaders | Keeps 1 chunk of your machines ticking while you're nearby (radius 2). | Place, Open | Resource budgets | `mach-2` | 🆕 · could be cut (perf) |

**Skipped on purpose:**
- EE transmutation, UU-matter and "Philosopher's Stone" style items. They break the economy (Diego, 10:36 AM).
- Nukes, mining explosives, Tesla coils, mining lasers shaped like guns, and anything that damages players.
- Spatial IO, which moves world chunks. It's too heavy, and Blueprints cover the idea.
- Oil and fuel refineries. Biofuel from corn replaces them.

---

## 2. Crazy goals (mastery megabuilds)
**DRAFT, pending GameMaster mastery spec** (Flo routed the mastery measures to GameMaster at 6:56 AM). Every finish line is checkable by the game, and every board stat is a single number.
- Boards follow HIGHSCORE-CHASE-PLAN §2: class + school, **server-verified only**, aliases only, no PII, teacher can hide.
- Board stats never reward grinding time alone.
- No goal needs real money.
- Crew goals credit every contributor on the build's plaque.

**Tiers:**
- **P** = one class period (≤40 min)
- **W** = a week of play
- **M** = a month or marking period
- **L** = whole-semester class legend (crew or whole class)

| # | Tier | Goal | Measurable finish line | Board stat |
|---|---|---|---|---|
| 1 | P | **Bag to Power speedrun** | From an empty Bag in a fresh seeded world, power any Lantern from a Charger or Solar Panel. | fastest time (s) |
| 2 | P | **First tube line** | Move 64 items from Box A to Box B by tube with no jams. | items/min |
| 3 | P | **Three-way sort** | Sort a mixed 3-type chest with 0 wrong items. | fewest parts used |
| 4 | P | **Night light** | A light turns on by itself at dusk (Light Sensor + NOT) and off at dawn. | fewest blocks |
| 5 | P | **Truth-table lock** | A door opens only for the right 3-lever code, checked against all 8 combinations. | fewest gates |
| 6 | P | **Bot wall** | A Bot builds a 6×3 wall from one program. | shortest program (blocks of code) |
| 7 | P | **Glow budget** | Light a 6×6 room to "bright" for one night with the fewest charges. | charge used |
| 8 | W | **Ore-to-ingot factory** | Raw ore goes in one Box and ingots come out another, with no hand steps (Extractor → Grinder → Smelter → Box). | ingots/hour |
| 9 | W | **Double yield proof** | Run 64 ores through the Grinder line and get ≥120 ingots. | yield % |
| 10 | W | **Quarry a chunk** | Empty a 16×16 area down to y −20 on your own land, with warnings placed. | blocks/min |
| 11 | W | **Self-powered house** | A house with lights, doors and a Terminal runs through 3 full day-night cycles on solar + battery, with zero outages. | spare charge at dawn |
| 12 | W | **Farm that feeds** | An auto-farm delivers 128 Corn to a Box without a hand harvest. | Corn/hour |
| 13 | W | **Glideway commute** | A Glideway line from your plot to Bertyville with 2 stations, ridden end to end. | trip time |
| 14 | W | **Blueprint twin** | Scan a 200+ block build and rebuild it with the Builder in a new place, 100% match. | build time |
| 15 | W | **64-kind sorter** | One sorting system routes 64 different item types to the right places, with an overflow. | kinds handled ÷ parts |
| 16 | W | **Drone mail route** | 10 drone deliveries to 3 different targets in one day, 0 failed. | deliveries per charge |
| 17 | W | **Assembler chain** | Assemblers make 32 Battery Cells from raw ore with no hand crafting. | cells/hour |
| 18 | M | **Zero-waste factory** | A factory runs 1 game-week with no item left over: every by-product is used or recycled. | waste items (lower is better) |
| 19 | M | **Network admin** | 4 Drive Bays and 1,000+ items on one network, searchable, powered through every night. | items per charge/min |
| 20 | M | **Village grid** | 5+ houses from different players share one grid with transformers and no trips for a game-week. | grid uptime % |
| 21 | M | **Voltage pro** | Low, Medium and High lines in one build, each feeding the right machines, with 0 trips. | machines powered ÷ transformers |
| 22 | M | **Bot fleet builder** | 3 Bots build a 500-block Blueprint together with no hand placing. | build minutes |
| 23 | M | **Biome rail link** | Glideway stations in all six biomes (world-2), linked into one network. | total line length ÷ trip time |
| 24 | M | **Smart warehouse** | Terminal requests auto-craft 16 Steel Beams from raw ore. | request-to-done time |
| 25 | M | **Chasm engineer** | Cross the Molten Chasm 10 days on HoldIt-tested bridges, each cheaper than the last. | lowest HoldIt $ |
| 26 | M | **Circuit streak (no streak penalty)** | Fix 20 Circuit Dailies at par. | fixes at par |
| 27 | M | **Quiet factory** | A factory that makes 1,000 items at under half the class median charge per item. | charge per item |
| 28 | L | **Fusion Core (whole class)** | The class builds the Fusion Core, runs it for one school week at ≥95% uptime, and recovers safely from one cooling test. | class uptime %, contributor count |
| 29 | L | **Bertyville powered** | Every street lamp and public building runs on the class grid for a month. | lamp-hours on clean power |
| 30 | L | **Megafactory** | One crew factory makes every T5 part from raw ore, fully automated. | distinct parts automated |
| 31 | L | **The 200-tall tower** | A crew tower to y 200+ with a working lift (Chassis) and lights on every floor. | height × floors lit |
| 32 | L | **All-element wallet** | The class finds every Bertodex Elements v1 card (16). | days to complete |
| 33 | L | **Rail across the world** | A Glideway loop through all biomes plus a Tunnel Bore section, ridden by 10 classmates. | riders × length |
| 34 | L | **Automation legend** | A crew build runs a full chain (farm → biofuel → power → factory → Glideway delivery) for 2 weeks with no hand step. | chain length × uptime |
| 35 | L | **Hall of Engineers** | A semester top 3 on any 3 boards above. | count of boards placed |

---

## 3. Questions for GameMaster (from this list)
1. **Exo-Suit glide** (#27): is "hold Jump while in the air" OK under Move (the same pattern as the Gravity Hat), or is it a new action?
2. **Mining Beam** (#26): Mine at range (up to 6 blocks) changes reach. Is that a scoped form of Mine, or a new action?
3. **Glideway ride** (#15): CORE-MECHANICS says fold Ride/Sit into Use. The seat (Use = sit, Move = stand) uses the same rule. Is that confirmed for pods?
4. **Blueprint scan/mark** (#10, #6): marking a box uses the Publish pattern (Place-style corner taps). Is that OK for kids' machines, or should it be a tool's Use?
5. **Request from Terminal** (#28): is a "Request" button inside the Open panel enough?
6. **Seed Lab** (#19): Curriculum Bot needs to check the "traits" wording.
7. **Chunk Keeper** (#34): is it worth the performance cost, or is catch-up on load enough?
8. **Ore Grinder doubling** vs the ORE-TABLE economy: does doubling change Trade Post supply (raw ore only is bought, so probably not)?
9. **Board stats** and mastery tiers: the whole of §2 waits on the GameMaster mastery spec.

**Needs Diego (safety/policy):**
- The cross-class (school) boards on L-tier goals. Aliases only, as HIGHSCORE §2.8 says.
