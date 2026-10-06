# Bertopia Progression Plan v2: Metal Cogs, the Materials Ladder, Badges, and Two Cross-App Dailies
> **Roles and worlds (6:56 AM):** "Teacher" means anyone Diego gives the TechWorks Teacher flag (staff, club officers, kid helpers), not a fixed staff list. "Creative" = the Build world (Teacher flag only) and "Survival" = the Game world (everyone). See BERTOPIA-WORLDS.md.


**For:** Diego Kulibert (Solvay Middle School Tech Ed, grades 6–8). **Builder:** Debugzy. **Author:** GameMaster.
**Date:** Sat Oct 3, 2026, about 11 PM ET. **App:** Bertopia BT 2.5.10 (https://apps.kulibert.net/blocks/, starter world Bertyville, saved builds are Blueprints).
**Status:** a design plan only. Nothing here is pushed, and no agent was messaged. Debugzy turns it into briefs.
**Replaces:** v1 of this file (kept as `BERTOPIA-PROGRESSION-PLAN-v1-superseded.md`). v1 was written before the call transcript and the World Plan synced, so it got the scale, the Cog metals, the HoldIt reveal rule and the inventory build wrong.

**Diego's 5 asks from the 9:52 PM call** (`/workspace/shared/gamemaster-calls/2026-10-03-bertopia-call.md`, 9:52–10:08 PM):
1. a Cog and materials ladder
2. badges and achievements
3. currency rules
4. a HoldIt Molten Chasm daily
5. a Debugzy circuit daily

He closed with: "Flesh it out and make it fun… send it to Debugzy, I trust you."

---

## 0. What Diego said on the call, and how this plan follows it

| Diego on the call | Where this plan follows it |
|---|---|
| No cash, ever. Earn only. "Earn by playing, spend on looks (wings, trails, arena skins), never on wins." → "I like that." | §1.1, §1.6. Cogs buy looks plus building stock, and never anything that changes a board, a Daily score or an Arena match. |
| Cogs alone aren't fun. Make **different kinds: bronze, silver, gold, then platinum and titanium**, to teach metallurgy, forging and material properties (**ductility, elasticity, opacity, transparency**). | §1.2 has five Cog metals, each teaching one property, each earned a different way. §2 is a materials ladder where every tier teaches one property, including elasticity, opacity and transparency. |
| Small build-and-do badges that celebrate what kids built (a bridge holds, mine 20 deep, survive a night, finish a parkour course). No grind tree. | §3 has 34 badges, mostly one-time "you did it" badges. Tiers exist only where repeating is the point (Dailies, crowns). There are no "place 25,000 blocks" counters. |
| Sessions run 15+ minutes, sometimes a full period, sometimes 3 hours at home. A quick-play mode plus a build mode. Saves go to the kid's TechWorks profile. The Daily is the spine, with assignments and tech club challenges on top. | §4 and §5 each fit in **17 minutes or less**, since a Daily is the quick play. The ladder and badges are the long build. §6.4 covers saves. |
| Chasm: "a chasm full of molten metal they cross with a bridge from that same app" (HoldIt). HoldIt is the tester, Bertopia reads the verdict and pays. Perfect it in HoldIt, then export. The bridge builds **from inventory** and won't build until they have enough. Kids can **swap to cheaper materials**. HoldIt materials map simply to Bertopia's, and the choice should matter. Doable in **17 minutes**. The prize is a rare **lucky block** or token, cosmetic only. | §4. |
| Circuit: it breaks, the kid fixes it in Debugzy and sees it work in Bertopia (door opens, lights on, elevator moves). Same puzzle: **Debugzy has the schematic, Bertopia has the machine**, and a kid can win in either. They can also fix it in Bertopia with parts choices. v1 is **one broken loop, one fault**, then series vs parallel, then logic, then voltage and amps. | §5. |

**Read and built on:**
- `fixq/bertopia-WORLD-PLAN.md`: §1 regions, §2 stations and recipes, §5 economy, §9A scale, §A circuits, §D2 Player Hub, §E Challenge Worlds, §H5 Koderized, §J hats, §K Glow Pools, §11 cuts
- `fixq/bloxbert-CURRICULUM.md`: §0 three kinds of points, §8 power, §9 economy, §10 City Sim, §14 remix
- `fixq/hiscore-PLAN.md`, `hiscore-bertopia.md`, `hiscore-holdit.md`
- `arena/bertopia-arena-GDD.md` §1 and §7
- `gamemaster/HIGHSCORE-CHASE-PLAN.md`, `gamemaster/HUB-DAILY-CHALLENGE-MAP.md`
- `fixq/GAMEMASTER-ANSWERS.md`, `bertopia-farm-loot-lore-CONCEPT.md`, `bertopia-chat-CONCEPT.md`, `QUEUE-NOTES.md`
- the live code (read-only) for BT 2.5.10 `econ/`, HoldIt's materials and jobs, and the Debugzy kid game DZ 0.1.3

Where this plan changes an earlier doc, §9 says so.

---

## 1. Currency rules (item 3, first because everything else depends on it)

### 1.1 The ruling (GameMaster's call, already sent to Debugzy)
1. **Each game keeps its own upgrade money**, so each economy stays balanced: Bertapult has **Candy Coins**, Bertopia has **Cogs**. A Bertapult upgrade price never has to account for a Bertopia income, or the other way round.
2. **Cogs are also the one hub-wide currency.** Finishing **any app's Daily** pays a **small fixed** number of Cogs **into Bertopia**. That's how "one currency across all apps" from the call works without breaking each game's balance.
3. **All of it is earned only.** It's separate from TechCash and TechWorks cash. It's **never bought with real money**, never traded between kids, and **never counts toward grades.**

**Why this settles the conflict.** The call wanted one currency for all apps. The earlier rule (Curriculum §0, Diego at 2:23 PM) says Bertopia progress stays inside Bertopia. Both hold: money flows **into** Bertopia from other apps' Dailies, and Cogs are spent **only** inside Bertopia. No other app's prices, scores or boards depend on Cogs, and nothing leaves for TechCash or grades.

### 1.2 Five Cog metals, each teaching one property
Diego wanted bronze, silver, gold, platinum and titanium, tied to metallurgy and properties. Each Cog metal has **one property**, **one way to earn it** and **one job**. The wallet shows the Cogs **spinning** (teal tick marks, a click when one lands), so the currency feels like a machine part rather than a number.

| Cog | Property it teaches (shown on its info card, 1–2 lines, with Speak) | How you earn it | What it's for |
|---|---|---|---|
| **Bronze Cog** | **Hardness / alloys.** Bronze is copper plus tin, and it's harder than either one alone. That's why old gears and bells were bronze. | Everyday play: Daily finishes in any app, town sales, Build Checks, Parkour runs, Tier I badges | stock, everyday looks, ladder tiers 1–5 |
| **Silver Cog** | **Conductivity.** Silver carries electricity better than any other metal. | Skill: ★★★ or par on a Daily (max 1 a day), the Weekly Build Brief, a "3 of 5" week, Tier II badges | arena skins and trails, top ladder tiers (6–7) |
| **Gold Cog** | **Malleability and ductility.** One gram of gold can be drawn into a wire about 2 km long, or hammered thinner than paper. | Rare: a **Weekly 👑** on any Bertopia-linked board, a Perfect Week (★★★ on 5 school days), a teacher tournament or Contest win, Tier III badges | wings and big looks |
| **Platinum Cog** | **Heat and corrosion resistance.** It doesn't rust and melts at about 1,768 °C, so it stays fine over the Molten Chasm. | Very rare, a **collector** Cog: Season Hall of Fame (top 3 on any Bertopia board), or 5 Weekly 👑 in one season | not spent. It goes in the **Cog Case** and unlocks the Platinum look set. |
| **Titanium Cog** | **Strength-to-weight.** As strong as many steels at a bit over half the weight, which is why it's used in planes and bike frames. | The flex, a **collector** Cog: **Master Maker** (the full ladder) or all Tier III badges in one badge family | not spent. It goes in the Cog Case and unlocks the Titanium Frame suit and wings. |

**My mechanics call: two changes from the quick on-call mapping, both for accuracy.**
- On the call I said silver = elasticity and gold = opacity. **Silver isn't notably elastic, and every metal is opaque**, so a kid who learned those would be learning something wrong.
- So the metals teach what's actually true of them (hardness, conductivity, ductility, heat resistance, strength-to-weight).
- **Elasticity, opacity and transparency move to the materials ladder** (§2), where kids can *see* them: steel springs back, glass is clear or tinted, stone blocks light.
- All four of Diego's named properties are still taught, plus four more.

**Rules:**
- **Metals never convert upward.** You can't grind 100 Bronze into Gold. Gold means you did something great. That's mastery over grind, which is what Diego asked for on the call.
- **Change-down only,** at the **Bertyville Bank** (a Tally's counter): 1 Gold → 10 Silver, 1 Silver → 10 Bronze. This is a one-way "break a big coin" lesson.
- **Bronze is the only metal that comes from repeating things.** Silver comes from skill, Gold from records or wins, and Platinum and Titanium from a season or the whole ladder.
- **Today's Cogs become Bronze.** The live BT 2.5.10 wallet (start 20, ledger, practice Cogs) maps 1:1 to Bronze, so no kid loses anything.

### 1.3 What exists today (BT 2.5.10, read-only code check)
- `ECON`: start 20. A sale pays `floor(base × 0.7 × (1 − 0.03 × soldToday))` with a floor of 0.5, and `dailyCap` is 20 per item. Townsfolk visit every 30 s.
- The wallet is an **append-only ledger**. "Try this" goals pay 5, 5, 5, 5 and 10. `mulberry32` is in `econ/vend.js`, `econ-check.mjs` exists, and "Send to teacher" has a local outbox.
- The World Plan §5 economy (town orders as the main faucet, rares ladder Brightcopper 5 → Kulite 600, the station line, 8 skills, jobs) is the target this plan prices against. **Placed blocks have no value and give no XP** (World Plan anti-farm rule), and this plan keeps that.

### 1.4 Earn rates inside Bertopia (exact; Bronze unless marked)
| Source | Pays | Cap |
|---|---|---|
| Start | 20 (already live) | once |
| Starter Quests (the 5 live "Try this" goals + 5 new, for example "Make a Timber Beam", "Visit the Glow Gorge") | 80 total | once. 60 can land on day 1, so **the first unlock is in session 1**. |
| Town sales and orders (live formula) | as live | **Town Purse 40/day** (all sales and orders combined) |
| Build Checks (the World Plan's "build a ___" checks: house, Foundation, Sunroom, Bridge…) | 20 each, 24 checks | one-time pool of 480 |
| Parkour or course finish (Paper Flight 2: every run pays a little) | 1 per finish, +3 on a new personal best | **30/day** |
| Bertopia's own Daily (Parkour Daily or Build of the Day entry) | 10 | once a day |
| Remix (a *different* classmate remixes your Blueprint, server-checked) | 2 each | 10/day |
| Weekly Build Brief (a class build theme, teacher or GameMaster set) | 25 Bronze + **1 Silver** | once a week |
| Badges | Tier I: 10 Bronze · Tier II: 1 Silver · Tier III: 1 Gold · single badges: 10 Bronze | per badge |
| **Hard cap** | | **150 Bronze per ET day**, with a soft limit of **60 per hour**. Above it, play goes on and the ledger notes "Full for today, come back tomorrow." |

### 1.5 Hub Daily payouts (into Bertopia, once per app per alias per ET day)
| App Daily | Finish | ★★★ / par |
|---|---|---|
| **HoldIt Molten Chasm** (§4, paid when the bridge is built in Bertopia) | 15 Bronze + 1 **Lucky Block** | +1 Silver |
| **Circuit Daily** (§5, Debugzy or Bertopia; the same puzzle pays once) | 15 Bronze + 1 **Lucky Block** | +1 Silver |
| Other scored Dailies (Bertapult Distance, Span/Spire of the Day, Koderized Puzzle, Botz Site, Berty's Run, Alice Lookout, Bertopia Parkour) | 10 Bronze | +1 Silver |
| Creative Dailies, unscored (Drawin' Prompt, LogoLab Sign, Visualizer Look, DJ Berty Remix, BertyCAD Shape) | 5 Bronze | — |
| **Daily Sweep** (3 different apps' Dailies in one day) | +10 Bronze | — |
| **Catch-up** (the 2 previous days' Dailies) | half pay, no Silver, no Lucky Block | — |

- **Silver from Dailies: max 1 per day**, whichever Daily is first at ★★★ or par.
- **Lucky Blocks: max 1 per day.** The first Chasm or Circuit finish gives it, so the prize kids expect is the same every day.
- **Hub Daily Cogs cap: 60 Bronze per day.** Bertapult's Candy Coins aren't touched: a Bertapult Daily pays Bronze **into Bertopia** and its usual Candy Coins **in Bertapult**, and the two economies never mix.
- Signed-out kids play every Daily as practice: local best, no board and no hub Cogs.

### 1.6 What Cogs buy (spend on looks and stock, never on wins)
| Shop | Item | Price |
|---|---|---|
| **Style Shop** (Tally's) | Berty suit colours (24 swatches, teal, cyan, blue and purple first) | 15 Bronze each |
| | Name glow colour (inside Bertopia only) | 20 Bronze |
| | Trails (Cog sparks, Foundry glow, Teal comet, Bubble line…) | 30–60 Bronze |
| | Arena skins (Arena §7) and building-site skins for the Gorge and Lab | 3–6 Silver |
| | **Wings** (Glider, Circuit, Molten Gold, Cog-wing) | 2–4 Gold |
| **Stock** (Tally's) | beams and parts for the Gorge and Survival (§4.6 table) | 1–6 Bronze each |
| **Ladder** | Blueprint Scrolls for new materials (§2) | 10–140 Bronze, plus Silver at the top |
| **Town Projects** (the class model: a crew pools Bronze toward a shared build, such as a Glideway station or a bandstand) | pooled; spent Bronze builds it for the whole class | the main **sink** past week 3 |

**Never for sale:** trophies, crowns, contest hats (World Plan §J), Fair Play, any badge, Lucky Blocks, anything that changes a score, a board, the Daily kit or an Arena match. **No trading between kids**, so nobody can pressure anyone for Cogs.

### 1.7 Anti-farming
- **Placed blocks have no value** (World Plan). Breaking your own build gives the blocks back, never Cogs.
- **Gorge and Lab blocks are site-locked:** you can break them, but they drop nothing.
- Caps are checked **by `src` group per ET day** (§7.4): Purse 40, runs 30, Dailies 60, total 150, 60 an hour.
- Runs pay only on a finish, with a minimum course time, and repeat finishes inside 10 s are ignored.
- Remix pay needs a **different** classmate and is checked by the server. Remixing yourself pays 0.
- HoldIt Tests and Circuit Tests **pay nothing**. Only a finished Daily pays, once.
- **Verified records only:** the client sends the design or the edit list, and the server re-sims it. There are **no PINs, codes or cheat switches** in any browser. Practice Cogs earned offline stay Bronze practice until a server row confirms them.
- **The teacher multiplier** (World Plan §5) can only set 0×, 0.5× or 1×, never more, so a teacher can slow things for a lesson but can't inflate them.

## 2. Cog and materials ladder (item 1)

### 2.1 Shape
- **7 tiers, 26 unlocks.** Each tier teaches **one material property**. Each unlock is a **Blueprint Scroll** (World Plan §2: recipes are found or earned as scrolls), read at a station.
- The station line is the World Plan's: **Workbench → Drafting Table → Smelter → Fabricator → Clean Bench.** Diego's "forging" is the Smelter's **Forge tab**, which shapes ingots into beams, rope and springs.
- **Three ways to get every tier, so there's no single dominant path:**
  1. **Buy** the scroll with Cogs at the Drafting Table.
  2. **Find** it in the world: scroll chests at landmarks (World Plan §1 regions), plus town orders that pay a scroll instead of Cogs.
  3. **Earn** it through an **alt route** (a Daily, a stamp, a Build Check or a badge).

  The sim (§2.4) shows that mixed play finishes first, and that every one-style player still finishes.
- **To open a tier, you need 2 unlocks from the tier below** (any 2), so kids can choose their order inside a tier.
- **Every HoldIt material has a Bertopia twin** (§2.3). The ladder **is** the HoldIt material list in block form, which is Diego's "easy correlation."

### 2.2 The ladder
Prices are in Bronze unless marked. Starter materials are free: dirt, stone, sand, logs, planks, plain glass, brick, wool, the live starter blocks, plus the **Timber Beam**, so the first Chasm can always be built in wood.

| Tier | Property (the one lesson) | Unlock | Price | Alt route (not Cogs) | Real tech-ed tie |
|---|---|---|---|---|---|
| **T1 Timber** | **Density:** wood is light and cheap, and it floats | Bamboo Pole (= HoldIt bamboo) | 10 | first Molten Chasm pass | bamboo scaffolds |
| | | Plywood | 15 | — | cross-grain layers |
| | | Stairs + Slabs | 20 | — | |
| | | Fence + Gate | 25 | — | |
| **T2 Masonry** | **Compression vs tension:** stone and concrete take a push but crack when pulled | Cut Stone | 35 | — | |
| | | Cinder Block | 40 | — | real CMU block sizes |
| | | Concrete Strut (= HoldIt concrete) | 50 | Build Check: Foundation | arches and piers |
| | | Roof Tile | 55 | — | |
| **T3 Glass + Light** | **Transparency, translucency, opacity:** clear glass lets light through, tinted lets some through, stone lets none | Tinted Glass (translucent) | 40 | — | |
| | | Frosted Glass | 45 | — | |
| | | Glass Pane | 50 | — | |
| | | **Sunglass** Panel (World Plan rare) | 60 | Build Check: Sunroom | solar glass |
| **T4 Iron + Steel** | **Elasticity:** steel springs back until it's pushed past its limit (yield) | **Smelter** (with the Forge tab) | 70 | **Tested in HoldIt** stamp | metal shop |
| | | Steel Beam (= HoldIt A36 steel) | 80 | — | I-beams |
| | | Wire Rope (= HoldIt cable, tension only) | 85 | — | suspension cables |
| | | **Spring Pad** (a bounce block: the higher you drop, the higher you go, until it "yields") | 90 | — | springs |
| **T5 Copper + Circuits** | **Conductivity:** copper and silver carry current, and plastic and wood don't | **Fabricator** | 65 | first Circuit Daily fix | electronics bench |
| | | Line Kit: Nanotube line, Battery Cell, Switch, Lamp (World Plan §A) | 75 | — | |
| | | Push Button + Door Motor + Lift | 85 | — | |
| | | Light Sensor | 95 | — | |
| | | Logic Gates (AND, OR, NOT, XOR, Latch) | 110 | **Koderized: If** badge | |
| **T6 Light alloys** | **Strength-to-weight:** same job, less weight | Aluminum Beam (= HoldIt aluminum 6061) | 100 + 2 Silver | — | bike frames |
| | | HS Steel Beam (= HoldIt high-strength steel) | 110 + 2 Silver | — | |
| | | Titanium Frame (Bertopia only for now; §9) | 130 + 3 Silver | — | aircraft |
| **T7 Composites** | **Stiffness:** carbon fibre bends very little for its weight | **Clean Bench** | 120 + 2 Silver | — | |
| | | Carbon Panel (= HoldIt CFRP; crafted from World Plan **Nanocarbon**, found, not bought) | 140 + 3 Silver | — | race cars |
| **Legend** | — | **Starsteel** Beam (World Plan rare, long spans) | **found only**, never sold | meteor sites | |
| **Trophy** | — | trophy blocks (§3) | **earned only** | — | |

**Totals:** 26 purchasable unlocks for **1,800 Bronze + 12 Silver**, plus Starsteel (found) and the trophies (earned).

**Each tier shows what it teaches by doing it:**
- **T2:** a Concrete Strut used as a hanging rod in a Build Check gets a "cracks when pulled" hint.
- **T3:** the Sunroom check measures how much light gets in.
- **T4:** the Spring Pad visibly bounces.
- **T5:** the Line Kit lights a Lamp.
- **T6:** the Lift carries more when the frame is lighter.
- **T7:** the Carbon Panel sags least.

Each scroll's card has one sentence on the property and a **Try it** button that opens a 30-second mini-demo in a test pocket (World Plan Challenge-world style).

### 2.3 HoldIt ↔ Bertopia material map (one row per HoldIt material; HoldIt's own values)
| HoldIt material (live `materials`) | Bertopia twin | Make it | Buy at Tally's (Bronze each) | What the choice means |
|---|---|---|---|---|
| Wood, Douglas fir (E 13 GPa, $0.85/kg) | **Timber Beam** | Workbench: 2 planks → 1 (1 log = 2 beams) | 1 | free if you chop, weaker |
| Bamboo (E 17 GPa, $0.55/kg) | **Bamboo Pole** | grows at the Gorge edge and on farms: 1 stalk → 1 | 1 | light, cheap, a hollow tube |
| Concrete (compression only, $0.18/kg) | **Concrete Strut** | Workbench: gravel + sand + water bucket | 2 | cheap, push-only |
| Steel A36 (E 200 GPa, $1.25/kg) | **Steel Beam** | Smelter: 2 iron ingots → 1 | 4 | strong, costs more |
| Cable, steel wire rope (tension only) | **Wire Rope** | Smelter Forge tab: 1 iron ingot → 2 | 3 | pull-only, very strong |
| HS steel ($2.15/kg) | **HS Steel Beam** | Smelter: Steel Beam + 1 Alloy Dust (a Smelter by-product) | 6 | stronger per beam |
| Aluminum 6061 ($3.40/kg) | **Aluminum Beam** | Smelter: 2 Alumite ore → 1 | 6 | light |
| CFRP ($28/kg) | **Carbon Panel** | Clean Bench: 2 Nanocarbon | not sold | best, rare |

**Counting rule (simple on purpose): 1 HoldIt member = 1 beam item, of that member's material, at any length.** The converter stretches or cuts it. A 13-member wood bridge needs 13 Timber Beams, which is 7 logs.

The trade-off is real: a design with **fewer, stronger members** needs fewer items, but each costs more. A design with **more, cheaper members** costs time to chop and craft. That's HoldIt's cost-vs-strength lesson again, in Bertopia's own money.

### 2.4 Pacing (checked with a sim)
`bertopia-progression-sim/sim.py` is deterministic, with output in `result.json`. It uses the §1.4–1.5 rates and caps, assumes **30% of earnings go to sinks** from day 4 (stock, looks, Town Projects), and applies the alt routes on typical days.

| Play style | First unlock | Full ladder at 4 sessions/week | Full ladder at 3 sessions/week |
|---|---|---|---|
| **Balanced** (a bit of everything) | **day 1** | **day 26** | day 38 |
| Builder (Build Checks) | day 1 | day 36 | day 52 |
| Daily-hopper (3 app Dailies a day) | day 1 | day 36 | day 40 |
| Runner (Parkour) | day 1 | day 37 | day 59 |
| Merchant (only sells) | day 1 | day 47 | day 57 |

- **The targets are met:** the first unlock lands in session 1 for every style, and the full ladder takes **about a month** of regular mixed play.
- **No dominant path:** mixed play finishes 10–20 days ahead of any one-trick style.
- **Selling alone is slowest,** because the Silver top tiers need skill (★★★ and par), not volume. That's on purpose: the Town Purse can't buy the top of the ladder.

---

## 3. Badges and achievements (item 2)

### 3.1 One system for every idea that already exists
Diego asked for "small build-and-do badges that celebrate what they built, no grind tree." Every idea Flo found becomes an entry in one `badges.js` table, as one of **three kinds**:
- **`alias`**: a badge you earn. It shows in the Player Hub, and you can pin it next to your alias.
- **`stamp`**: a mark on an object. **Tested in HoldIt** goes on bridges and turns into "(changed since)" after any edit. **Design Log** stamps (hiscore-bertopia item 3) and **Chasm YYYY-MM-DD** / **Fixed YYYY-MM-DD** go on Daily Blueprints.
- **`trophy`**: a badge that also drops a **placeable, earned-only block** (Arena §7.5, hiscore-bertopia item 3, `items.js` `earnedOnly:true`). The Guardian Core, crowns and the Hall of Fame Statue are this kind.

| Existing idea (where Flo found it) | Where it lands |
|---|---|
| Player Hub "Achievements" stub (World Plan §D2, cut row 2.3) | the panel in §3.3 |
| Koderized badges unlock bot commands (World Plan §H5, cut 3.4) | #28–30 |
| "Tested in HoldIt" badge (FeatureBot schematics and helper reports, quest B5) | a stamp, and #9 |
| Clear Writer (chat concept line 42, essentials map line 77) | #32, kept **private** with its raffle ticket |
| Fair Play from Good Sport votes (Arena §7.5–7.6) | #31, shown by the alias |
| City Sim role badges (Curriculum §10 C1) | #33, teacher-awarded |
| Trophy blocks, crowns, medals, Hall of Fame (Arena §7.5, hiscore-bertopia 3, HIGHSCORE plan) | #19–21 and #23 (crowns, Hall of Fame), #6 and #13 (trophy blocks), with medals kept separate (below) |
| Guardian Core (farm-loot concept line 139, farm-11) | #34 |

**Tiers I / II / III** use **teal, blue and Berty-purple** rings, which follows the colour rule. **Bronze, silver and gold medals stay reserved for record medals** (HIGHSCORE plan: a personal best +3 / 7 / 12%), and Cog metals are a currency, so a badge ring is never mistaken for either.

**Verification:**
- `local` badges work today with no server.
- `server` badges need verified events (Daily passes, boards, remixes, votes).
- **Only server-verified badges can be pinned to the alias.**

### 3.2 The list (34 badges; most are one-time "you did it" badges)
Pay rule: single badges and Tier I pay 10 Bronze, Tier II pays 1 Silver, Tier III pays 1 Gold (§1.4).

| # | id | Name | Kind | Tiers I / II / III | Trigger (what you built or did) | Verify | Extra reward |
|---|---|---|---|---|---|---|---|
| **Build** |||||||
| 1 | `home` | Home Sweet Home | alias | single | Build Check: a bed, door and roof, all enclosed | local | house sign |
| 2 | `trueScale` | True Scale | alias | single | Build Check with real sizes (a 2 m door is 4 blocks, a 3 m room is 6, per World Plan §9A) | local | tape-measure skin |
| 3 | `bigBuild` | Big Build | alias | single | save one Blueprint of 1,000+ blocks (it celebrates the build, not total blocks placed) | local | Blueprint frame |
| 4 | `remix` | Remix Star | alias | 1 / 5 / 20 classmates | different classmates remixed your Blueprint | server | III: a ★ on your Blueprints |
| 5 | `crew` | Crew Builder | alias | 1 / 3 / 10 builds | you placed 50+ blocks in a crew build | server | crew banner |
| 6 | `botd` | Build of the Day | trophy | 1 / 3 / 10 | the class vote picks your build | server | III: Hall of Fame Statue |
| **Materials (property badges: show the property)** |||||||
| 7 | `elastic` | Boing! (Elasticity) | alias | single | bounce 6+ blocks high on a Spring Pad | local | spring trail |
| 8 | `clear` | See-Through (Transparency) | alias | single | Sunroom Build Check: clear plus tinted glass, with light measured | local | glass tool skin |
| 9 | `heldUp` | It Held! (Compression and tension) | alias | single | your first bridge with the **Tested in HoldIt** stamp spans water or the Gorge | server | bridge plaque |
| 10 | `conductor` | Live Wire (Conductivity) | alias | single | light a Lamp from a Battery Cell through 10+ Nanotube line | local | wire glow |
| 11 | `lightStrong` | Light but Strong | alias | single | the Lift carries a full load on an Aluminum or Titanium frame | local | frame skin |
| 12 | `smelter` | Smelter | alias | single | smelt your first ingot and forge it into a beam | local | apron hat |
| 13 | `master` | Master Maker | trophy | single | all 26 ladder unlocks | local | **Golden Gear** block + **1 Titanium Cog** |
| **Explore and survive** (survival badges wait for the World Plan Danger cut, 🔜) |||||||
| 14 | `deep` | Deep Digger | alias | single | mine 20 blocks below the surface | local | lantern hat |
| 15 | `night` | Made It to Morning 🔜 | alias | single | survive one night in Survival | local | moon trail |
| 16 | `explorer` | Explorer | alias | single | visit all of the World Plan §1 regions in one world | local | map frame |
| 17 | `coolant` | Phase Change | alias | single | turn a Glow Pool into a Metal Slab with coolant (World Plan §K) | local | Metal Slab souvenir |
| **Chase** |||||||
| 18 | `parkour` | Course Clear | alias | 1 / 5 / 15 courses | finish a Parkour course (Gold time for II and III) | server | run trails |
| 19 | `crown` | Crown Holder | trophy | single | hold any Bertopia 👑 at midnight ET | server | crown hat (Arena §7.5) |
| 20 | `comeback` | Comeback | alias | 1 / 5 / 15 | take back a 👑 after **Dethroned! Rematch** | server | cartoon rematch flame trail |
| 21 | `hof` | Hall of Fame | trophy | single | season top 3 on any Bertopia board (kept after resets, Arena §7.1) | server | **Hall of Fame Statue** + **1 Platinum Cog** |
| **Dailies** |||||||
| 22 | `chasm` | Chasm Crosser | alias | 1 / 10 / 30 days | cross the Molten Chasm on your HoldIt-tested bridge (§4) | server | II: Foundry Glass block |
| 23 | `chasmCrown` | Chasm Crown | trophy | 1 / 5 / 15 | class 👑 on the Chasm at midnight ET | server | **Crown Pedestal** |
| 24 | `fixer` | Fixer | alias | 1 / 10 / 30 days | Circuit Daily fixed, in either app (§5) | server | Circuit Lens skins |
| 25 | `cleanFix` | Clean Fix | alias | 1 / 10 / 30 | Circuit Daily fixed **at par** with no wrong fixes | server | III: purple wire glow |
| 26 | `threeOfFive` | 3 of 5 | alias | 1 / 4 / 12 weeks | any Daily on 3 of 5 school days (**no streak penalty**) | server | calendar stamp |
| 27 | `sweep` | Daily Sweep | alias | 1 / 10 / 30 days | 3 different apps' Dailies in one day | server | Daily Board kiosk skins |
| **Code (Koderized, World Plan §H5)** |||||||
| 28 | `kzMoves` | Koderized: Moves | alias | single | Koderized move unit cleared | server | **unlocks the bot's Walk and Turn** |
| 29 | `kzLoops` | Koderized: Loops | alias | single | Koderized loop unit cleared | server | **unlocks the bot's Repeat** |
| 30 | `kzIf` | Koderized: If | alias | single | Koderized if unit cleared | server | **unlocks the bot's Sense/If**, plus the Logic Gates alt route (§2.2) |
| **People** |||||||
| 31 | `fairPlay` | Fair Play | alias | 5 / 25 / 100 | Good Sport votes from **different** classmates (Arena §7.5–7.6) | server | shown by the alias on every Bertopia board |
| 32 | `clearWriter` | Clear Writer | alias (**private**) | 5 / 20 / 60-message streak | clear chat lines (chat concept; keeps its raffle ticket) | server | **My Stats only, never on the alias** |
| 33 | `cityRole` | City Role: Mayor, Planner, Engineer, Shopkeeper or Banker | alias | single per role | **teacher-awarded** (Curriculum §10 C1; the printed version still works) | server | role title above the alias |
| **Adventure** |||||||
| 34 | `guardian` | Guardian Core | trophy | single | solve the Mechanoid Guardian puzzle (farm-loot concept) | local | **Guardian Core** block |

**Cut from v1 as grind** (Diego: no grind tree): Block Builder (25,000 placed), Shopkeeper (1,000 sold), Fair Price (400 sales), Baker counts and Green Thumb counts. **Open for Business** (first sale) and **Baker** (bake bread and a cupcake once) survive as Starter Quests, not badges.

### 3.3 Where badges show
1. **Player Hub (hotkey H) → Achievements** fills the §D2 stub and cut row 2.3:
   - a tile grid (2 columns upright on phones, 4 sideways, 4–6 at 1366), each tile with an icon, a 1–2 word name and a progress ring
   - a **"Next up"** row with the 3 nearest badges ("Bounce 6 high on a Spring Pad")
   - family filters
   - a **Cog Case** tab: your Bronze, Silver and Gold spinning in the case, plus Platinum and Titanium as collector pieces, each with its property card
2. **Next to the alias, inside Bertopia only** (the world nameplate, Bertopia boards, Arena boards, chat lines): **up to 3 pinned verified badges** plus a City Role title. Other apps' boards show only their own crowns, so Bertopia progress stays in Bertopia (Curriculum §0).
3. **Trophy blocks** are placeable and earned only. They can't be sold, crafted or turned back into items. Each has a plaque with the alias, the badge and the date.
4. **Badge moment:** a full-width card ("Badge! It Held!") with Speak and ⏹, a 1.5 s purple-ring burst, the Cog dropping into the wallet with a click, and a sound with a visual twin. It never covers controls and closes with one tap.
5. **Teacher panel:** class badge counts. **TechWorks reporting stays OFF** (`reportToTechWorks:false`) until Diego decides (Question 3).

---

## 4. HoldIt Molten Chasm Daily (item 4)

### 4.1 The idea in one line
Every day there's a new gap over a **chasm of glowing molten metal**. You design the bridge in **HoldIt's Span mode** and Test it until it holds the **Ingot Cart**. That sets your record. Then you **send it to Bertopia**, **build it from your own inventory** across the same chasm, and walk Berty over to collect the prize.

**HoldIt is the tester. Bertopia only reads HoldIt's verdict and pays out** (Diego on the call).

### 4.2 Kid-safe look (molten metal, never gore)
- **The molten metal** is a glowing orange-gold "foundry pour" with slow cartoon bubbles and a soft heat shimmer. It uses the World Plan §K Glow Pool art and the Emberdeep "Slagflow" style. There's no fire, no skulls, no burning and no hurt Berty.
- **The Daily world is a Challenge world, so Damage Off is locked** (World Plan §E). If Berty steps in, he **bounces back to the bank** and the screen does a soft **teal** fade ("Suit cool-down! Back to the bank"), never red, and nothing is lost.
- HoldIt shows a failing bridge sagging toward the glow with a cartoon *bloop*, and the cart floats back up on a bubble.
- The UI stays teal and cyan first. The metal colour is a kid setting (Gold, Copper or Cyan "plasma"), because kids customize everything.
- **The real lesson on the help card:** "Real molten metal is about 1,500 °C. Foundry workers wear heat suits and never cross it. This one's pretend."

### 4.3 Seed (the same everywhere, verified by the server)
```
dateET = YYYY-MM-DD, starting at midnight America/New_York (hiscore-core daily boundary; the weekly board starts Monday)
seed32 = fnv1a32("kulinet|holdit-chasm|" + dateET)
rng    = mulberry32(seed32)          // the same PRNG as bertopia econ/vend.js
```
| Param | Rule | HoldIt job field (live schema) |
|---|---|---|
| `gapM` | 12 + 2 × floor(rng × 7) → **12–24 m**, even. In Bertopia that's **24–48 blocks** (2 blocks per m, World Plan §9A), with a deck 5 blocks wide | span |
| `bankRiseM` | 0 m (50%), 1 m (35%) or 2 m (15%): the right bank is higher | joint layout |
| `glowLineM` | the heat line under the deck: **6 m** "calm pour" (20%, deep trusses OK), **3 m** (45%) or **1.5 m** "bubbly" (35%, so you build *above* the deck: a through-truss or arch) | `maxDeckSpacing` + no-joint zone |
| `island` | 25%: a cooled-slab island in the middle third, so a pier is allowed | fixed joint |
| `loadKN` (Ingot Cart) | by weekday, getting harder through the week: Mon 20 · Tue 30 · Wed 45 · Thu 60 · Fri 80 · Sat/Sun 45 | `payloadKN` |
| **Fair Kit** (today's materials, the same for everyone) | Mon wood + bamboo · Tue wood + cable · Wed wood + steel · Thu wood + concrete (arch day) · Fri wood + steel + cable + HS steel · weekend all 8. **Wood is always in.** | `allowedMaterials` |
| `heat` | members within 1 m of the glow line lose strength: wood and bamboo −25%, aluminum −20%, steel, HS steel and cable −5%, concrete 0 ("heat weakens materials, some more than others") | new `heatZone` field (§7.6) |
| `windKPa` | Fri 0.2, otherwise 0 | `windKPa` |
| `scoreMode` | **Mon/Wed/Fri/weekend = Cheapest (HoldIt $)** · **Tue/Thu = Fewest Beams** | — |
| `par` | GameMaster's solver pre-solves each seed. ★ = holds · ★★ ≤ 1.3 × par · ★★★ ≤ par | `stars{three,two}`, `budget = 1.6 × par$` |

**Generator guarantees:**
- **Every seed must be passable with wood alone** within the member budget, so most kids can always finish. If the solver can't find a wood-only pass, the seed is re-rolled with `+1`, and the server logs it.
- The server publishes the day in the day feed (`/api/kn/day`, tw-split-2).
- GameMaster or a teacher can override one day's params, and the server's copy wins.

### 4.4 The 17-minute run (Diego's target; GameMaster's split is about 12 minutes of building and 5 to export, test and claim)
| Step | Where | Target time |
|---|---|---|
| 1. Tap **Molten Chasm** on the Hub or the Bertyville **Daily Board** kiosk. HoldIt opens Span mode with `?daily=2026-10-05`, showing the gap, the banks, the glow line and the goal card: "Hold the 45 kN Ingot Cart. Today: Cheapest." | HoldIt | 0:30 |
| 2. Build and **Test**. Tests are free and unlimited, with instant retry, HoldIt's "watch it fail, then fix it" replay and member colour chips. | HoldIt | 8–12 min |
| 3. **A pass is submitted automatically** (your best pass is kept). The card shows It held!, your stars, your class rank and **Send to Bertopia**. | HoldIt | 0:20 |
| 4. Bertopia opens the **Molten Chasm** site with your bridge as a Blueprint ghost and a **materials list** (§4.6). | Bertopia | 0:20 |
| 5. Get the beams: bring them from your bag, chop the site woodlot, craft at the site Workbench or buy at the site stall. **Swap to cheaper** if you want. | Bertopia | 1–3 min |
| 6. **Fill from bag** places the whole bridge in one tap (a 10 s Buildbot animation), or place it by hand. | Bertopia | 0:15–2 min |
| 7. Walk Berty across. The **Ingot Cart** rolls behind you with HoldIt's real test load and the same sag colours. At the far bank: **prize**. | Bertopia | 0:30 |

**Build mode, for kids with a full period or 3 hours at home:**
- keep refining for a better rank (every new best re-submits)
- remix yesterday's best (§4.7)
- decorate your Chasm bridge (looks don't change the stamp)
- pour coolant on a side pool to make a **Metal Slab** souvenir (World Plan §K phase change, the Phase Change badge)

### 4.5 Score and board (HoldIt is the record keeper)
- **Score:**
  - Primary: today's mode, lowest HoldIt $ or fewest members.
  - Tie-break: the other measure, then the earlier verified pass time.
- **The board uses the Fair Kit only** (HIGHSCORE plan R5: upgrades are free play only, and Daily boards use a fixed kit). **A kid's Bertopia inventory never changes their rank.** It only changes how they build the bridge in Bertopia.
- **Tabs:** My Class (the default) and Week, aliases only. You see the top 10, plus **your own row, shown only to you**. There's no bottom list (Arena §7.1).
- **Reveal rule (hiscore-holdit):** today's record design stays hidden. A **silhouette** shows after 5 tries, and the full design shows once you beat it or at the weekly reset. So kids copy *ideas*, not bridges.
- **👑** goes to the class #1 at midnight ET. That earns the Chasm Crown badge and a Crown Pedestal trophy, and a Weekly 👑 earns **1 Gold Cog**.
- **Dethroned! Rematch:** when someone takes your #1 or pushes you out of the top 3, a quiet card waits in the Hub bell and the Bertopia mailbox: "Dethroned! NeonFox beat your Chasm by $40 · **Rematch**." The button deep-links to today's seed.
  - There are **no push notifications**, and a kid gets at most 3 cards per app per day (hiscore-core).
  - A teacher can turn cards off or limit them to class time.
- **Personal medals** use the HIGHSCORE plan's bronze/silver/gold at +3 / 7 / 12% better than your first pass of the day, so every kid can chase *their own* number.
- **Ties** go to the earlier verified pass.

### 4.6 Bertopia side: build it from inventory (Diego: "won't build until they have enough")
- **The site:** a small **Challenge chunk** reached from the Daily Board kiosk. It's rebuilt each day to `gapM`, `bankRiseM` and the glow line, so the main world is never edited.
- **Materials list:** one row per material from the HoldIt design, using the §2.3 counting rule (1 member = 1 beam item):

  ```
  Timber Beam   9 needed · 4 in bag      [Chop] [Craft] [Buy 1 ⚙ each]
  Steel Beam    4 needed · 0 in bag      [Buy 4 ⚙ each] [Swap → Timber]
  Deck          free (site planks, locked to the site)
  ```

- **Inventory:** the site uses your **Town Bag** (the Survival bag of your main Bertyville world). Creative worlds don't feed it, so the build always costs something real.
- **Always finishable for free:** the site woodlot has 6 trees that regrow daily and give **up to 10 logs a day** (20 Timber Beams). Combined with the generator's wood-only guarantee, every kid can finish without spending a Cog.
- **Swap to cheaper** (the refinement lesson): tap **Swap** on a row, for example Steel → Timber for these 4 members.
  - The ghost turns amber: **"Untested: re-test in HoldIt"**.
  - **Re-test in HoldIt** opens HoldIt with the swapped design. If it fails, the kid fixes it there, adding a member or changing the shape, and passes again.
  - Bertopia only builds a design whose `designHash` matches a **HoldIt pass for today's seed.** That's Diego's "perfect it in HoldIt, then export."
  - A swapped pass that scores better also improves your board row.
- **Built bridge:** stamped **Tested in HoldIt · Chasm 2026-10-05**. Site blocks are locked to the site: you can break them, but they drop nothing. Editing turns the stamp into "(changed since)" (the existing rule).
- **Blueprint gallery:** every day's bridge saves to your Blueprints as "Chasm 2026-10-05", so a kid's bridge history becomes a gallery.
- **Bridge Row (the class remixes the best):** **yesterday's** class top 3 stand as see-through Blueprint ghosts in lanes beside yours. These are fully revealed because the day is over. Tap one to **Remix**: save a copy to your Blueprints, or open it in HoldIt on yesterday's seed for practice.
- **Free play first:** the site is optional. Before your first pass, Bertyville shows a sign and a ghost bridge: "Cross the Molten Chasm with a HoldIt bridge!"

### 4.7 Rewards (paid at the far bank in Bertopia)
| Result | Prize |
|---|---|
| First crossing of the day | **15 Bronze** + **1 Lucky Block** |
| ★★★ (at or under par) | **+1 Silver** (max 1 Silver a day from any Daily) |
| First ever pass | the **Bamboo Pole** alt unlock (T1) and the **It Held!** badge. The **Tested in HoldIt** stamp opens the Smelter alt route (T4). |
| 10 / 30 days | Chasm Crosser II / III (II drops a **Foundry Glass** block) |
| Class 👑 at midnight | Chasm Crown + Crown Pedestal. A Weekly 👑 earns 1 Gold. |

**Lucky Block** (Diego's "rare lucky block or token," cosmetic only). It follows the farm-loot concept rules:
- **earned only, never sold or traded**, max **1 per day** (§1.5)
- opens with an **Odds tile on screen**: Common 70% · Rare 25% · Epic 5%. **There's no spinning reel**, just a 1-second pop.
- **pity rule:** an Epic is guaranteed by the 10th block without one
- **no duplicates** until a set is complete
- a ★★★ day gives a **Shiny Lucky Block** (Rare or better)
- **Contents are cosmetic and decor only:** Foundry set (Molten-gold trail, Ember Lamp, Foundry Banner), Circuit set (Lamp-string, Spark trail), Cog set (a Cog pet that spins beside Berty), and seasonal sets.
- It never contains Cogs, materials or anything that changes a score.

### 4.8 Teacher levels (second, after free play)
Any past seed can be assigned as a **class level** from Master Control 🎯 Assign, for example "Chasm 10-05, wood only, Cheapest". Results go to TechWorks only if Diego says yes to reporting (Question 3). Tech club can run a **Chasm Cup**, a fixed seed for one week, with the winner earning Gold.

---

## 5. Debugzy Circuit Daily (item 5)

### 5.1 The idea in one line
Each day **one machine in Bertopia is broken**: a workshop door won't open, the Night Market lights are out, or the Glideway lift is stuck. **The same puzzle is in both apps.** **Debugzy shows the schematic, and Bertopia shows the machine.** Find the one fault and fix it **in either app** in the fewest tries, then watch the machine come alive in Bertopia (Diego on the call).

### 5.2 Parts (World Plan §A names; never "redstone")
- **Parts:** Battery Cell, **Nanotube line** (the wire), Switch (stays on), Push Button (on only while held), Lamp, Door Motor, Lift, and from v3 Light Sensor, AND, OR and NOT.
- **The Circuit Lens** (free, unlimited): the World Plan overlay that shows **cyan current dots** flowing from the Battery Cell and **stopping at the break.** Looking is the skill, so probing never costs a try.
- **Sim:** `circuit-sim.js` is a pure function shared by the client and the server: `simulate(netlist, inputs) → {powered[], lit[], moving[]}`. v1 only needs connectivity: is there a closed loop through the load?
- **The Daily Lab supplies every part for that day**, so kids who haven't unlocked T5 can still play. Your first fix also unlocks the **Fabricator** (the T5 alt route).

### 5.3 The plan for circuit types (Diego's order)
| Stage | What breaks | The lesson | Starts |
|---|---|---|---|
| **v1 Loop** | **one broken loop, one fault** | a circuit must be a closed loop, and a switch opens or closes it | first build |
| v2 Series vs Parallel | a lamp out in a string | in series, one out means all out; in parallel, the rest stay on | once v1 is stable |
| v3 Logic | the wrong gate, or a sensor reversed | AND, OR, NOT ("door opens when it's dark AND the button is pressed") | after the T5 logic parts |
| v4 Volts and Amps | the wrong cell or too much load | Ohm's law on the World Plan's Challenge-world bench, with a meter readout | later |

### 5.4 Seed and generation (v1)
```
seed32   = fnv1a32("kulinet|circuit|" + dateET);  rng = mulberry32(seed32)
machine  = ["Workshop Door", "Night Market Lights", "Glideway Lift", "Clock Tower Bell"][floor(rng*4)]
layout   = LAYOUTS[machine][floor(rng*3)]      // 12 v1 templates; each loop has 5–8 parts in order
fault    = weighted pick, below; at = a random step on the loop
choices  = 3 fixes: 1 right + 2 believable wrong ones (from the fault's distractor list)
```
| v1 fault (exactly one a day) | Weight | The right fix | Example wrong choices |
|---|---|---|---|
| a gap in the Nanotube line | 30% | place one line | swap the Lamp · add a Battery Cell |
| a part turned the wrong way (its line doesn't touch) | 20% | rotate it | remove it · add a Switch |
| a Push Button where a Switch belongs (the door slams shut when you let go) | 15% | swap it for a Switch | add a second Button · rotate it |
| a dead Lamp or a stuck Door Motor | 15% | replace that part | add a line · flip the Switch |
| a flat Battery Cell | 10% | swap in a fresh cell | add a Lamp · rotate the Switch |
| the line runs back to the wrong side (no loop) | 10% | move one line to the cell's other end | add a cell · swap the Switch |

**The generator checks every seed:** the unbroken circuit works, the broken one doesn't, **exactly one** of the 3 choices fixes it, and par = **1 try**. Seeds that fail a check are re-rolled. Tests run over 365 seeds.

### 5.5 Two views of one puzzle
**Debugzy view (the schematic).** It uses the **DZ 0.1.3 puzzle shape as-is** (`steps[]`, `badIndex`, `changes[{label, ok, why}]`, `failWrongStep`), so the kid game needs only a new data source and an SVG schematic, with no new rules:
- The loop is drawn as a clean schematic (cell, switch, lamp or motor symbols), and each segment is a numbered **step**: "1. Battery Cell + → Switch", "2. Switch → Door Motor", …
- The kid taps the bad step (`badIndex`), then picks one of the **3 fixes** (`changes`). The `why` line explains it: "The line stops here, so current can't get round the loop."
- Picking a wrong step shows `failWrongStep` ("That part checks out, so follow the current") and counts as a try.
- **Fixed →** "See it work in Bertopia →" hands the fix over (same origin, `kn-handoff-v1`). The Bertopia Lab opens with the fix applied and runs: **the door swings open.**

**Bertopia view (the machine).**
- The machine sits in the **Daily Lab**, a small sealed Challenge chunk, so your world isn't touched. The goal card shows a picture and one line: "Make the Workshop Door open."
- Turn on the **Circuit Lens** to see where the cyan dots stop.
- Fix it with a **part choice:** the Lab's Parts Bin offers the **same 3 choices as Debugzy**, plus any matching parts already in your bag (using your own part is the "inventory choice" Diego asked for).
- Place, rotate, swap or remove, then **Run.**
- **Phones:** the machine wall is a 9 × 5 grid of cells with the camera locked facing it, so it reads like a 2D board. Cells are at least 44 px upright at 360 wide (48 on phones), and sideways the tools dock left.

**It counts once, from whichever app you use.** The same seed, the same score rule and the same board.

### 5.6 Score and board
- **Score = tries:** each fix you apply that doesn't make it work is +1, and the working fix counts too. **Par = 1** ("Fixed first try ✓"). Circuit Lens looks are free.
- **Tie-breaks:** fewer Runs, then faster time from opening the puzzle to working. Many kids will be at par, so the crown is a speed race, the Paper Flight 2 "short run, instant retry" feel.
- **Reset** puts the broken circuit back for practice. **The first finish is the one that counts** (one fault means a second run is just a replay). Practice after that is unscored.
- **Board:** My Class and Week tabs, aliases only, top 10 plus your own row. **👑** at midnight ET, the same **Dethroned! Rematch** cards as §4.5 (max 3 a day), and a Weekly 👑 earns 1 Gold.
- **Bug Rush** (v1.1, optional): after the Daily, a **3-minute rush** of extra seeded one-fault loops. Most fixes wins, each fix pays 1 Bronze (inside the 30 a day runs cap), with its own board and crown. This is the endlessly replayable chase.

### 5.7 Rewards (collected at the machine in Bertopia; they wait 2 days)
| Result | Prize |
|---|---|
| First fix of the day, in either app | **15 Bronze** + **1 Lucky Block** (if it's your first Lucky Block that day) |
| Par (first try) | **+1 Silver**: silver is the conductivity Cog (max 1 Silver a day) |
| First ever fix | the **Fabricator** alt unlock (T5), plus the **Fixed YYYY-MM-DD** Blueprint of the working machine |
| 10 / 30 days | Fixer II / III, and Clean Fix for par fixes |

**Safety line** (on the Lab's Help card): "Game batteries are pretend. Real batteries can get hot, so never connect + straight to −." Question 4 asks Diego to OK it.

---

## 6. Shared Daily system (every Daily, including Bertopia's own)

### 6.1 Seeds, the day feed and the kiosk
- **One seed rule:** `fnv1a32("kulinet|"+app+"|"+dateET)` → mulberry32, with the day starting at midnight ET and the weekly board on Monday (hiscore-core-1/2).
- **The infrastructure already in the hiscore briefs is reused, not reinvented:** `/api/kn/boards`, `/ghost`, `/inbox`, `/shared/kw-crown.js`. **Add `debugzy` and `holdit-chasm` to `APPS`.**
- **The Daily Board kiosk** in Bertyville shows today's Dailies as icon tiles with ✓, ★ and 👑 states. A tap opens the app on the same origin with `?daily=`.

### 6.2 Records and access
- **Free play is never blocked.** Signed-out kids play every Daily as practice: a local best, no board and no hub Cogs.
- **Records are server-verified only.** The client sends the design or the edit list, and the server re-sims it with the same pure function (the HoldIt solver, `circuit-sim.js`). There are no PINs, codes or cheat switches anywhere in the browser.
- Boards show **aliases only**. A kid can switch on **"Just for fun"**: they still get every prize, but their alias never appears on a board.

### 6.3 Pacing rules
- **No streak loss:** kids earn "3 of 5" stamps, and catch-up pays half for the 2 previous days.
- **Phones count as much as Chromebooks.** Every Daily screen fits 360×740, 412×915, 915×412 and 1366×768, re-fits on rotate, uses taps of at least 44 px (48 on phones), and keeps ☰ top-left.

### 6.4 Saves
- Everything saves to the kid's **TechWorks profile as storage**, as Diego asked, so a kid's Cogs, badges and Blueprints follow them from Chromebook to phone.
- **Storing is not reporting.** Teachers see results in TechWorks only if Diego says yes (Question 3).

---

## 7. Data shapes (JSON)

### 7.1 Wallet: metal Cogs on the existing ledger (`econ/wallet.js`; `metal` and `src` are new)
```json
{ "tx": "srv-20261005-holdit-chasm-NeonFox", "at": 1791240000000, "by": "server",
  "metal": "bronze", "n": 15, "src": "daily:holdit-chasm", "note": "cross", "day": "2026-10-05" }
```
- `metal` is one of `bronze | silver | gold | platinum | titanium`.
- Today's rows have no `metal`, so they read as Bronze, and no kid loses anything.
- `src` values: `start`, `quest:<id>`, `sale`, `town`, `check:<id>`, `run`, `remix`, `brief:week`, `badge:<id>:<tier>`, `daily:<app>`, `daily:sweep`, `catchup:<app>`, `bank:change`, `spend:unlock:<id>`, `spend:stock:<item>`, `spend:style:<item>`, `spend:project:<id>`, `send:teacher`.
- **Caps are checked by `src` group per ET day.** Balance = the sum of rows per metal, and platinum and titanium have no spend rows.

### 7.2 Badge definition (`src/data/badges.js`) and an earned badge
```json
{ "id": "chasm", "kind": "alias", "family": "dailies", "name": "chasmCrosser", "icon": "badge-chasm",
  "tiers": [ { "n": 1, "need": 1,  "pays": { "bronze": 10 } },
             { "n": 2, "need": 10, "pays": { "silver": 1 }, "drop": "foundryGlass" },
             { "n": 3, "need": 30, "pays": { "gold": 1 } } ],
  "trigger": { "event": "daily.cross", "where": { "app": "holdit-chasm" }, "count": "distinctDays" },
  "verify": "server", "pinnable": true, "private": false }
```
```json
{ "alias": "NeonFox", "badge": "chasm", "tier": 2, "progress": 11,
  "earnedAt": "2026-10-15T20:41:07-04:00", "verified": true, "src": "srv-8f3a…", "pinned": true }
```

### 7.3 Ladder unlock (`src/data/ladder.js`)
```json
{ "id": "steelBeam", "tier": 4, "property": "elasticity", "price": { "bronze": 80, "silver": 0 },
  "gives": ["recipe:steelBeam"], "station": "smelter", "gate": { "ownInTier": 3, "n": 2 },
  "alt": null, "found": ["scrollChest:ironworks"], "holditTwin": "steel" }
```
```json
{ "id": "aluminum", "tier": 6, "property": "strengthToWeight", "price": { "bronze": 100, "silver": 2 },
  "gives": ["recipe:aluminumBeam"], "station": "smelter", "gate": { "ownInTier": 5, "n": 2 }, "holditTwin": "aluminum" }
```

### 7.4 Material twin map (`src/data/holdit-twins.js`, shared with the converter)
```json
{ "wood": "timberBeam", "bamboo": "bambooPole", "concrete": "concreteStrut", "steel": "steelBeam",
  "cable": "wireRope", "hs-steel": "hsSteelBeam", "aluminum": "aluminumBeam", "cfrp": "carbonPanel",
  "rule": "1 member = 1 item, any length", "scale": { "blocksPerM": 2, "deckWidth": 5 } }
```

### 7.5 Day feed (`GET /api/kn/day`)
```json
{ "date": "2026-10-05", "tz": "America/New_York",
  "dailies": [
    { "app": "holdit-chasm", "seed": 2873345114, "scoreMode": "cost",
      "params": { "gapM": 18, "bankRiseM": 1, "glowLineM": 3, "island": false, "loadKN": 20,
                  "kit": ["wood", "bamboo"], "windKPa": 0,
                  "heatZone": { "m": 1, "wood": 0.75, "bamboo": 0.75, "aluminum": 0.8, "steel": 0.95, "concrete": 1 } },
      "par": { "cost": 610, "beams": 13 }, "pays": { "bronze": 15, "silverAtPar": 1, "lucky": 1 } },
    { "app": "circuit", "seed": 1189034417, "stage": "loop", "machine": "Workshop Door", "par": 1,
      "pays": { "bronze": 15, "silverAtPar": 1, "lucky": 1 } } ] }
```

### 7.6 Chasm: the HoldIt job built from the seed (live job schema plus `daily` and `heatZone`) and the submission
```json
{ "id": "chasm-2026-10-05", "daily": true, "deckKN": 0, "payloadKN": 20, "windKPa": 0, "seismicG": 0,
  "maxDeckSpacing": 3, "budget": 976, "stars": { "three": 610, "two": 793 },
  "allowedMaterials": ["wood", "bamboo"], "heatZone": { "yM": -3, "bandM": 1 } }
```
```json
{ "app": "holdit-chasm", "date": "2026-10-05", "seed": 2873345114, "alias": "NeonFox",
  "design": { "joints": [ { "x": 0, "y": 0, "fixed": true } ], "members": [ { "a": 0, "b": 1, "mat": "wood", "section": "2x4" } ] },
  "claim": { "held": true, "cost": 585, "beams": 12 }, "client": "HI 1.2.0" }
```
- The server re-sims and returns `{ok, cost, beams, stars, rank, crown, designHash}`.
- **The handoff to Bertopia** (IndexedDB `kn-handoff-v1`, same origin) is `{bloxschem v1, stamp:"testedInHoldIt", designHash, date, seed, bom:{timberBeam:9, steelBeam:4}}`.
- Bertopia pays out only when its built `designHash` matches a server-verified pass.

### 7.7 Circuit puzzle (one record, two views)
```json
{ "id": "circuit-2026-10-05", "stage": "loop", "machine": "Workshop Door", "wall": [9, 5],
  "netlist": [ { "id": "c1", "t": "cell", "at": [0, 2] }, { "id": "l1", "t": "line", "at": [1, 2], "rot": 0 },
               { "id": "s1", "t": "switch", "at": [2, 2] }, { "id": "m1", "t": "doorMotor", "at": [5, 2] } ],
  "fault": { "type": "gap", "at": [3, 2], "step": 2 },
  "debugzy": { "title": "Workshop Door", "lede": "The door won't open. Follow the current.",
               "steps": ["Battery Cell + → Switch", "Switch → line", "line → Door Motor", "Door Motor → Battery Cell −"],
               "badIndex": 1,
               "changes": [ { "label": "Add one Nanotube line", "ok": true, "why": "The line stops here, so current can't get round." },
                            { "label": "Swap the Door Motor", "ok": false, "why": "The motor's fine. No current reaches it." },
                            { "label": "Add a Battery Cell", "ok": false, "why": "More power can't jump a gap." } ],
               "failWrongStep": "That part checks out, so follow the current." },
  "par": 1 }
```
Submission: `{app:"circuit", date, alias, view:"debugzy"|"bertopia", edits:[…], tries, runs, ms}`. The server applies the edits to the seed netlist and checks that `simulate()` passes.

### 7.8 Board row, Dethroned card and Lucky Block
```json
{ "app": "holdit-chasm", "date": "2026-10-05", "scope": "class:7-3", "rank": 1, "alias": "NeonFox",
  "score": 585, "tie": 12, "stars": 3, "at": "2026-10-05T13:02:11-04:00", "badges": ["fairPlay:2", "chasm:2"] }
```
```json
{ "type": "dethroned", "app": "holdit-chasm", "date": "2026-10-05", "to": "NeonFox", "by": "SkyBolt",
  "margin": "$40", "deep": "/holdit/?daily=2026-10-05", "seenAt": null }
```
```json
{ "id": "lucky", "earnedOnly": true, "sellable": false, "tradable": false, "perDay": 1,
  "odds": { "common": 0.70, "rare": 0.25, "epic": 0.05 }, "pity": { "epicBy": 10 }, "noDupesUntilSetDone": true,
  "shinyOn": "stars3", "pool": ["set:foundry", "set:circuit", "set:cog", "set:season"], "contains": "cosmetic|decor only" }
```

---

## 8. First build: the top 3 for Debugzy
These come after the Bertopia 2.6.x bag line that's already queued, and they're ordered so each one ships alone, local-first and at **$0**.

1. **Metal Cogs + progress core (Bertopia, local):**
   - the wallet's `metal` and `src` tags on the existing ledger (old rows read as Bronze), the caps, and the Bertyville Bank change-down
   - `badges.js` with 34 definitions (turn on the `local` ones now; Survive the Night waits on the Danger cut), `ladder.js` with 26 unlocks, gates and alt routes, and `holdit-twins.js`
   - **Player Hub → Achievements** and the **Cog Case**
   - Starter Quests 6–10
   - the first Style Shop looks (suit colours and trails)
   - **Acceptance:** `econ-check` asserts the ladder totals (1,800 Bronze + 12 Silver), the caps (40 / 30 / 60 / 150 a day, 60 an hour), that metals never convert up, and that trophies, Lucky Blocks and crowns can't be sold. A parity test matches `sim.py`'s day-1 first unlock. Every new panel fits all 4 sizes, upright and sideways.
2. **Molten Chasm v1 (HoldIt + Bertopia):**
   - **HoldIt side:** the seeded Span-mode Daily job (§7.6) with the Fair Kit, glow line, `heatZone`, par and a wood-only guarantee check.
   - **Handoff:** pass → **Send to Bertopia** (`kn-handoff-v1`).
   - **Bertopia side:** the Molten Chasm site with the materials list from the Town Bag, the woodlot, **Swap → Re-test in HoldIt**, Fill from bag, the Ingot Cart crossing, the prize at the far bank and the Blueprint gallery.
   - Personal best only in v1. The class board arrives with step 4.
3. **Circuit Daily v1 (Bertopia + the Debugzy kid game):**
   - the minimum parts (Battery Cell, Nanotube line, Switch, Push Button, Lamp, Door Motor, Lift) and the Circuit Lens
   - `circuit-sim.js` (a pure function), 12 v1 loop templates and the one-fault generator
   - the Daily Lab
   - a **Daily Circuit** mode in the Debugzy app that uses the DZ 0.1.3 shape with an SVG schematic
   - the two-way handoff, so a fix in either app makes the machine come alive
   - **Acceptance:** over 365 seeds, every one has exactly one fault, exactly one right choice and par = 1, and none are already working or unfixable.

**Step 4 comes after hiscore-core-1/2 and tw-split-2's day feed:** the server day feed, re-sim verification for the Chasm and the Circuit, class boards, crowns, Dethroned! Rematch cards, hub Daily Cogs from every app, server-verified badges and Bug Rush.

**Depends on:** the World Plan cuts for circuits and Challenge Worlds (§11). Step 1 has no dependencies.

---

## 9. Where this builds on, or changes, earlier docs
| Earlier doc | What this plan does |
|---|---|
| **v1 of this plan** | **Replaced.** v1 used 1 block = 1 m (now 2 blocks per m, World Plan §9A), "Goo" (now molten metal, per Diego), one plain Cog (now metals), "tap a row to remix" (now the HoldIt reveal rule plus yesterday's top 3), and an instant bridge (now built from inventory). |
| **Arena GDD §1.9 and §7.5** ("cosmetics are never bought") | **Changed by Diego's call:** Cogs can buy looks (wings, trails, arena skins). **Kept:** trophies, crowns, season hats and contest hats stay earned only, and nothing bought changes a match. Arena `reportToTechWorks:false` and `whoCanOpenPvP:'nobody'` are untouched. |
| **Curriculum §0** (Diego, 2:23 PM: progress stays inside Bertopia; not TechCash or grades) | **Kept.** Other apps' Dailies only pay *in*, and Cogs are spent only in Bertopia. "Saves to the TechWorks profile" (the call) is read as **storage, not reporting** (Question 3). |
| **HUB-DAILY-CHALLENGE-MAP §3 (mine)** ("Dailies pay a trophy or decor only, no Cogs") | **Replaced** by the currency ruling. Dailies pay a little fixed Bronze, plus Silver at par and the Lucky Block. |
| **The call's quick mapping** (silver = elasticity, gold = opacity) | **Corrected** for accuracy (§1.2). Elasticity and opacity are taught by the steel and glass tiers instead. |
| **World Plan "no phones"** | That rule is about phone-shaped items *in the world*. The app itself is specced phones-first throughout. |
| **World Plan rares and stations** | Used as-is (Sunglass, Nanocarbon, Starsteel; Workbench → Clean Bench). **New items:** Spring Pad, Concrete Strut, Wire Rope, the Alumite ore vein, Alloy Dust and the Titanium Frame (there's no HoldIt titanium yet, so it could be added to HoldIt later). |
| **SpanCraft and Spire Lab** | Retired names. This plan uses HoldIt's Span mode only (Diego, 9:48 PM). |
| **"Practice Cogs"** (the 2.5.1 wording) | Offline Cogs stay practice Bronze. Verified Cogs arrive as `by:"server"` rows. |

---

## 10. Questions for Diego (money, safety and school policy only)
1. **Lucky Block:** is a chance-based prize OK for grades 6–8 if it's earned only, never sold, shows its odds, has a pity rule and gives no duplicates? The alternative is a fixed reward track with no chance at all. Default: **Lucky Block as specced.**
2. **Boards:** **class-only** (the default), or also a whole-school tab? Should kids be able to choose "Just for fun" (prizes, but off the boards)? Default: **class-only, with Just for fun allowed.**
3. **TechWorks:** saves go to the TechWorks profile as storage. Can **teachers also see** badges and Daily results there, for information only and never for grades? Default: **off.**
4. **Safety wording:** OK with the cartoon **molten metal** (Berty bounces back, never hurt, "real molten metal is about 1,500 °C, this one's pretend"), and the Lab line "Game batteries are pretend. Real batteries can get hot, so never connect + straight to −"?
5. **Home play:** should Dailies and Cogs count the same at home on phones, with the same daily caps? Default: **yes.**

*Money note (no decision needed):* everything here runs on the existing `kulinet` D1 and Pages routes for **$0**, and there's no real-money purchase anywhere.


GameMaster 2026-10-06: open questions answered in BERTOPIA-GM-ANSWERS-2026-10-06.md (same folder) (Paint dab = Berry at Workbench; Plastic Tube via Oven, not Smelter; Silicon made at Smelter, used by Fabricator; one Pick per tier, no durability; quick tap never breaks blocks in the Game world; static water + ores = world-1 right after 260b, snow/biomes = world-2). That file overrides older lines here.
