# Bertopia mastery spec: sandbox vs mastery, stars, records, efficiency (GameMaster, 2026-10-06 7:10 AM ET)
Diego (Oct 6, 6:56 AM): "a full tech game disguised as a Minecraft clone and can be sandbox if wanted. It can also be obsessively mastered."
Plugs into the shared high-score core (`fixq/hiscore-PLAN.md`, core-1 to core-4). Contest module stays **off** until a teacher turns it on. `hiscore-bertopia.md` (Parkour crowns, `policy.boards:false`) is unchanged; this spec extends it.

## 1. Sandbox vs mastery: one world, two ways to play
| | Sandbox (default) | Mastery |
|---|---|---|
| Where | Game world (Bertyville), Build world | **Challenge cards** that open a short run in a Challenge World instance (WORLD-PLAN §E) |
| Rules | normal Survival / Creative | fixed seed, fixed kit, fixed goal, nothing carried in or out except stars and records |
| Timers, stars, boards | none, ever | yes |
| Rewards | everything the economy already gives | cosmetic only: stars, trophy blocks, plaques, name-colour chip, Bertodex badges. **Never** Cogs above the daily cap, never items or power |
| Focus mode | hides every challenge prompt | — |
- A kid never meets a timer unless they tap a Challenge card. Challenge cards live in the Player Hub (H) under **Challenges**, and as optional Challenge Pads a teacher can place in the world.
- Why separate: records must be fair (same kit, same seed) and checkable. Sandbox can't be verified, so sandbox stats stay **personal bests only** ("Deepest dig: y −51") on the kid's own device, never on a board.

## 2. Stars, crowns and the chase
Every challenge has the same three stars and one crown:
- ★ **Finish** — meet the goal at all.
- ★★ **Par** — finish within par on the main measure (time or materials).
- ★★★ **Engineer** — beat the efficiency target (fewest parts, least power, fewest bot instructions, most items per minute).
- 👑 **Crown** — the class record on that challenge's board (core-1). Dethroned! card when someone beats you (core-1/core-3).
- **Build Card:** every record shows the record holder's build in a read-only 3D viewer (blueprint, alias only). Studying the best build is the Paper Flight 2 hook: "how did they do that?" → try again.
- **Par rule:** par = the crew's own best playtest × 1.5, Engineer target = playtest best × 1.0. Debugzy sets the first numbers from the headless sim; I retune after a week of class data.
- **Totals:** each stage has 3 challenges = 9 stars. "Perfect" badge per stage for 9/9. Hall of Fame per season (core-3).

## 3. Measures (the only six)
| Measure | Better | Example |
|---|---|---|
| Time (s) | lower | escape the Undervault maze |
| Parts (blocks/items used) | lower | bridge that holds the cart |
| Power (energy units) | lower | light the village all night |
| Throughput (items/min) | higher | ore-to-ingot factory |
| Code (instructions) | lower | bot builds the wall |
| Score | higher | Parkour coins, Arena |
One main measure per board. Ties break by the second measure listed on the card, then by earlier time.

## 4. How a record is checked (keeps $0 hosting)
- **Movement challenges** (Parkour, mazes): input log replayed in fixed-step `move-sim.js` (as hiscore-bertopia).
- **Build challenges** (everything else): the claim sends the **final build** as a blueprint (≤4 KB) plus the claimed measure. The server re-runs that build headless for the challenge's fixed tick count (20 ticks/s, ≤60 s of game time) and recomputes the measure. "Prove it by rebuild."
- CPU target per claim ≤10 ms (core-1 budget). Challenge grids are small (≤24×24×24) so this holds; any challenge that can't re-sim in budget gets no board, only stars.
- Kit lock: the blueprint can only contain items in that challenge's kit; anything else = rejected with "That part isn't in this kit."

## 5. Stage table (what each stage measures)
Stages follow Debugzy's coding plan order (stage codes in CODING-PLAN §S). Each row: the real skill, the sandbox path, and 3 challenges with main measure.
| Stage | Real tech skill | Sandbox path | Challenges (main measure → Engineer target type) |
|---|---|---|---|
| Basics | tools, materials, crafting | gather, craft, build a shelter | Night One (shelter before dark: Time); Tool Run (Wood→Stone→Copper Pick: Time); Tiny Home (enclosed room with door + light: Parts) |
| Core (Bag, storage) | inventory systems, sorting | fill boxes, label them | Sort Rush (sort 64 mixed items into labelled boxes: Time); Pack It (fit a kit into fewest slots: Parts) ; Find It (fetch 5 named items from a messy base: Time) |
| World-1/2 (ores, water, biomes) | geology, density, phase change | explore, dig, swim, pan | Depth Dash (find 1 of each B1–B2 ore: Time); Gold Pan (pan 3 Flakes: Time); Biome Tour (visit 6 biomes, collect one sample each: Time) |
| Effects (Lab Bench) | chemistry: reagents, concentration | brew vials for fun | Brew Order (make 3 named vials: Parts = fewest reagents); Glow Up (light a dark room to a target lux: Parts); Freeze Frame (Ice chain: Time) |
| Circuits | series/parallel, logic gates | wire lamps, doors | Light Them All (every lamp lit: Parts); Truth Lock (AND/OR/NOT door from a truth table: Parts); Timer Gate (door open exactly 5 s: Parts) |
| Energy | generation, storage, voltage | solar roofs, batteries | Through the Night (power 10 lamps dusk to dawn: Power); Wind + Sun (meet load with 2 sources: Parts); No Burnout (step voltage down safely: Parts) |
| Machines (Tekkit set) | automation, throughput | build factories | Ore-to-Ingot (fully automatic: Throughput); Sorter Maze (route 4 item types: Parts); Quarry Clear (empty a 8×8×8 pit: Time) |
| Bots + Code Runtime | programming, loops, sensors | helper bots | Bot Wall (bot builds a 6×3 wall: Code); Farm Loop (bot harvests a 4×4 field: Code); Maze Bot (bot exits a maze: Code) |
| Structures (HoldIt tie) | loads, trusses, materials | bridges, towers | Span It (cart crosses: Parts); Spire (tallest tower that survives wind: Score = height); Budget Bridge (Cogs-priced parts: Parts) |
| Glideway (maglev) | magnetism, motion | build lines | On Time (train hits 3 stations within schedule: Time); Smooth Ride (fewest jolts: Score); Hill Climb (Power) |
| Economy (Trade Post, shops) | supply/demand, profit | run a shop | Profit Day (run a café round: Score = profit) — **stars only, no board** (avoid money leaderboards) |
| Music, holidays, furniture | — | pure sandbox | no challenges (art isn't scored) |
| Arena / Parkour | teamwork, movement | free runs | existing hiscore-bertopia + Arena GDD boards |

## 6. Daily and weekly
- **Daily Challenge:** one challenge from any unlocked stage with a daily seed (core-1 ET seeds). Same for the whole school. Counts for the weekday stamp (3 of 5 days, no penalty).
- **Weekly Remix:** a twist on a known challenge (half the kit, double the load, night only). About 1 weekday in 8 the surprise twist rule applies (existing).
- **Ghost:** after a run, the kid can watch their best or the record holder's build replay (Build Card).

## 7. Teacher controls (all existing core-3/core-4 toggles)
Boards on/off per class (`policy.boards`), scope class/school, Fair Kit is always on for challenges (no divisions in Bertopia), ⚑ Flag record, seasons, contest module per challenge (off by default; presets: best of N, window, measure).

## 8. Acceptance (phone 412×915 upright, phone 915×412 sideways, Chromebook 1366×768)
1. A kid who never opens Challenges sees no timer, star or board anywhere in 30 minutes of play.
2. Open Challenges → start Night One in ≤2 taps; finish → stars shown with words ("★★ Par: 2:41 / 3:00"), not colour only.
3. A claim with an out-of-kit part is rejected with the plain message.
4. Server re-sim of a recorded build matches the claimed measure; CPU per claim ≤10 ms (log it).
5. Beat the class record → crown moves, previous holder gets Dethroned! next session.
6. Build Card opens the record build read-only, rotates by drag, closes in 1 step; alias only.
7. Profit Day shows stars but has no board.
8. Rotate the phone mid-challenge: timer, kit, build and stars-so-far are all kept; no control hidden at 915×412.
DONE only when every test passes on the live site. Never fake a DONE.
