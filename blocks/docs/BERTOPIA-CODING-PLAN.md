# Bertopia coding plan: from 2.5.42 to the whole vision
Debugzy (owner), 2026-10-06, written 6:45–7:30 AM ET. It starts from the **true live version, 2.5.42** (`blocks/app.js?v=2.5.42`, audit FAIL P1 in `/workspace/proof/bertopia-2.5.42/RESULT.md`).

> **North star (Diego, 6:55 AM):** *"This is a full tech game disguised as a Minecraft clone and can be sandbox if wanted. It can also be obsessively mastered."*
>
> So every stage in this plan names three things:
> 1. **the real tech skill** it teaches by playing (circuits, logistics and automation, materials and elements, structures, coding)
> 2. **a sandbox path:** play with no pressure (Build world, or free play on your own plot with no timers or scores)
> 3. **a mastery path:** depth, optimisation, records and high-score boards, stars and badges, and speed or efficiency challenges
>
> Diego, 6:55 AM: "Robust everything eventually, might as well prepare for the dream with details." The near-term queue (§E) is **unchanged** by the long-range detail (§S). The detail only tells Build where today's code has to leave room.

**Companion files:**
- Asset pack: `/workspace/shared/bertopia-assets/`, committed to **apps-kulibert branch `bertopia-assets`** at `bloxbert-src/assets/pack/`. Not deployed. Branch commits: a5891408 (v1) → 6283b9a5 (REGISTRY + builders) → **9e252042** (decor aligned to DECOR-PACKS). Docs on main: **0706ecb6**.
- Single source of truth for names, recipes and facts: `blocks/docs/wiki/REGISTRY.json`, plus the wiki (§0).
- Tech-machine starter list and crazy goals: [`BERTOPIA-TEKKIT-FEATURES.md`](BERTOPIA-TEKKIT-FEATURES.md). It's a starter for GameMaster, who owns the final ranking and goals.
- Specs (newest wins; **GM-ANSWERS-2026-10-06 wins over all older lines**): CORE-MECHANICS, WORLDS, WORLD-1, WORLD-2, ORE-TABLE, ELEMENT-ECONOMY, STORAGE-SPEC, EFFECTS-SPEC, FUN-ITEMS-SPEC, PROGRESSION-PLAN, and HIGHSCORE-CHASE-PLAN.
- Build briefs: `/workspace/briefs/fixq/bertopia-*.md`, pasted in the order in §E.

**Contents:**
- §0 Phase 0 (registry first)
- §A Current architecture
- §B Target modules
- §C Data model and save
- §D Perf budgets
- §E Near-term milestones (paste order)
- §S Whole-vision stage map
- §F Test harness
- §G Risks and open questions
- §H Brief conflicts found and patched
- §T Tech machines (link)

---

## §0 Phase 0: the registry comes first (before any new content brief)
Diego, 6:59 AM: "Design all the wiki and documentation early so we can follow the plan and lore to keep it real feeling."

**What exists now** (docs-only commit to `blocks/docs/wiki/`):
- `REGISTRY.json` has 305 entries plus 96 recipes:
  - 100 blocks, 17 ores, 54 machines and devices, and 93 items
  - 9 critters and bots, 8 biomes, 16 elements, and 8 effects
- Each entry carries:
  - `id` (block ids 1–31 are frozen live ids)
  - `key` and `name.en`
  - `desc` (in-game "what it is", grade 5–6)
  - `verbs` (from the locked ten)
  - `recipes` (`r:<key>` → the `recipes[]` table with station, inputs, seconds, gate and source)
  - `stage` and `availableFrom` (the locked-tile rule)
  - `assetId` (the id in `MANIFEST.csv`)
  - `fact` (the real-science chip)
  - `dexId` and `dexCat`
  - `handS`
  - `textStatus` (draft until Curriculum Bot checks it)
- It was built from GM-ANSWERS, ORE-TABLE, ELEMENT-ECONOMY, WORLD-1, WORLD-2, STORAGE-SPEC, the basics briefs and live `src/data/recipes.js`.
- Generator: `bloxbert-src/assets/pack/tools/build_registry.py`. Wiki pages: `tools/build_wiki.py`.
- The wiki: a `README.md` index, generated pages (blocks, ores, machines, items, recipes, verbs, biomes, critters, elements, effects), `LORE.md` (skeleton; every section reads "lore content: GameMaster"), `STYLE-GUIDE.md` (plain words, our own names only), and `topics/*.md` stubs.

**Rules from now on:**
1. **Every future brief adds its registry rows first.** Item 1 of any brief that adds content says: "Add rows to REGISTRY.json via build_registry.py, regenerate `src/data/registry.js` and the wiki." The brief's other items then read names from the registry.
2. The game reads names, descriptions, fact chips and Dex text **only** from `src/data/registry.js`. That file is generated from REGISTRY.json at build time by a new `tools/registry-gen.mjs` step in `build.mjs`. Hard-coded kid-facing names in `main.js`, `strings*.js` or `data/items.js` are moved out over time (`check-strings.mjs` fails on new ones).
3. The Bertodex reads the same file. Names and facts never drift.
4. Translations: en is the source. es, uk, ru, rw and ti are filled by Build per brief. ar and fa-AF follow INTERACTION-STYLE §7. Curriculum Bot checks them later. They're stored as `name.<lang>` and `desc.<lang>` in the registry.
5. A brief that changes a recipe changes **the registry row**, never only code. `econ-check.mjs` and a new `registry-check.mjs` compare `src/data/recipes.js` with the registry.

**Phase 0 Build work** (slotted into 2.5.43 as hygiene, or the first content brief, basics-1):
- Add the `tools/registry-gen.mjs` + `registry-check.mjs` build steps.
- Generate `src/data/registry.js` (names, `desc`, `fact`, `dexId`, `availableFrom`).
- Keep `BLOCKS` ids and order identical.
- basics-1 item 1 now opens with "registry rows first" (see §H).

---

## §A Current architecture (2.5.42, `apps-kulibert/bloxbert-src`, HEAD 4a151a1)
| Area | Where | How it works today | Notes for the plan |
|---|---|---|---|
| Engine | `noa-engine` pinned `github:fenomas/noa#8a74866` (MIT, no local edits) + `@babylonjs/core` 6.49.0 (Apache-2.0) | noa owns chunks, meshing, physics, input bindings and the camera. Babylon renders. | Never patch noa in place. Wrap it in `src/engine/*`. |
| Build | `build.mjs` → esbuild IIFE `src/main.js` → `../blocks/app.js` (~1.5 MB raw); `build:test` → `../blocks-test` | Runs `make-tiles.mjs`, `check-strings.mjs` and `econ-check.mjs` | First-load budget **< 1 MB gzip**. New big features load lazily (§D). |
| Main | `src/main.js` (84 KB) | `VERSION`, Engine config, the `BLOCKS` array (31 entries: `[id, name, material, short, icon]`), `townVoxel`/`genVoxel`, IDB save/load, pointer input, `feelTick`, perf meter, `window.__smoke` (line ~1837) | Too much in one file. Split it as each feature touches it (§B). |
| Blocks and atlas | `assets/atlas.png` + `atlas.json` (21 names, 32 px vertical strip, from `tools/make-atlas.py` on the Kenney Voxel Pack, CC0); station tiles `assets/tile-*.png` (`make-tiles.mjs`) | `registerMaterial` per name; glass is separate | The pack's `atlas/terrain.png` keeps indices 0–20 identical (drop-in). |
| World gen | `src/worldgen.js` (`hash`, `coalHere` y −3…−28, `plantHere`: reeds, 1% wool per colour, wheat), `src/town.js` (FLOOR 4, STATIONS, plots, `keptCell`) | `worldDataNeeded` fills each chunk from `saved` or `genVoxel`. **Chunks with y > 24 are air.** Coreplate at y −64; void below y −72 respawns you. | WORLD-1 adds depth bands and water. Height target is y 255 for 200-tall builds (§D). |
| Chunks | chunkSize 24; `saved` Map `"i,j,k"` → `Uint16Array(24³)` for edited chunks only | Only edited chunks are stored. Generation is deterministic (seed 1). | Uint16 is fine past 255 ids. |
| Save | IndexedDB `kuliblocks` (test: `kuliblocks-test`), store `worlds`, key `bertyville-survival` or `bertyville`. `src/save.js` (`emptyPlayer` bag 15, `toV2`, `fromDoc`) | Doc: `{format:'kuliblocks', v:2, appVersion, id, title, ownerRef, seed:1, spawn, chunkSize:24, palette:['air',…names], chunks:{k: gzip-base64}, updatedAt, player, econ, meta, stations}`. Autosave every 20 s and on `visibilitychange`. Export/Import file is 2 MB max. Change log is IDB `bloxlog` (14 days, 5 MB). | **Hazard:** `readDoc` rejects ids > `BLOCKS.length` and **never remaps by palette**. Fix this before the first new id (§C). **There is no server copy at all.** |
| Prefs | localStorage: `bloxbert-quality`, `-town`, `-teacher`, `-last-world`, `-menu-hint`, `-fps`, `-text`, `-look`, `-stick`, `-learn`; `kulibert-prefs-v1` (lang, via `/shared/kulibert-prefs.js`) | | Settings move under one `prefs` reader (§B settings). Never edit `kulibert-bar.js`, `kulibert-prefs.js` or `kw-who.js`. |
| Input | Canvas pointer events. Touch: `rayAt` → `dig` state with `mineMs`. Pointerup < 8 px, held < 500 ms and nothing broken → `placeBlock`. Keys: E Bag, Q drop, F use, C craft, B tool strip, 1–9, Ctrl+Z/Y, I inspect, Space jump. Esc is caught in the capture phase. Stick pad plus `data-hold` buttons (jump, crouch). | `feel.js` locked numbers: GRAV_MULT 3.2, JUMP_V 8.94, walk/run/crouch 4.3/5.6/1.3, HAND_S table, TOOL_X hand1/wood2/stone3/copper4/steel6, 150 ms floor, Build-world touch mine 500 ms. **Coyote 120 ms and jump buffer 150 ms are implemented** in `feelTick`. | 260 moves gestures to kw-interact (`KWI.GESTURE`, tap 250/8 px, hold 250, longPress 500, `worldPress` 500 / Slow taps 800). |
| Loop | noa `tick` (`feelTick`: drops, gravity, jump, speed, reach, autoStep) + `beforeRender` (outline, sky shader) + a separate rAF perf meter | Quality presets `QP`: auto (add [1.5,1], rem [2.5,2]), lite (scale 1.75), full (aa, add [2,1.5], rem [3,2.5]). Auto drops resolution when fps < 30 for 3 s. | Sims (power, tubes, machines) go on a **fixed 10 Hz sim tick** with catch-up (§B). |
| Items and crafting | `src/items.js` (BAG_N 15), `src/data/items.js`, `src/data/recipes.js` (15 recipes), `src/craft.js`, `src/stations.js`, `src/tools.js`, `src/box.js` (BOX_SLOTS 18), `src/drops.js` (DROP_CAP 256) | | Recipes move to registry-driven data (§0). |
| Economy | `src/data/econ.js` (storeSells flour, sugar, woolBlue, woolRed; `ceil(base*1.1)`), `src/econ/{store,vend,wallet}.js`, `src/session.js` | | GM-ANSWERS §6 per-16 restock prices replace the multiplier (§H). |
| UI | `src/panels.js`, `src/icons.js`, `src/learn.js`, `src/changelog.js` (What's new), `src/strings.js`, `src/strings-extra.js` | | 260 moves panels to kw-interact `openPanel`. |
| Edits | `src/world-edit.js` (one edit path, `applyEdit`), `src/change-log.js` | Undo and redo go through one path | All new block changes (machines, quarry, bots) **must** go through `applyEdit` so Undo, the change log and protection rules hold. |
| Teacher | localStorage flag today; 2.5.43 gates it with `HubStaffAuth.isUnlocked()` (`/shared/hub-staff-auth.js`, flag `tech-room-hub-staff=1`) | | The server Teacher flag from TechWorks waits for Diego's OK (WORLDS). |
| Tests | `tools/smoke.mjs` (puppeteer-core 23.11.1, `/usr/bin/chromium` swiftshader; ~26 checks, uses `element.click()`), `*-check.mjs` (box, craft, drops, econ, feel, path, session, town, strings), `func12.mjs`, `measure.mjs`, `nogl.mjs` | | §F replaces click-based checks with real input and maps every Accept to a check. |

## §B Target module boundaries
Rule (World Plan §H1): each module has **one interface**, and features plug in through registries, never into another module's insides. Files are moved out of `main.js` **only when a brief touches that area**, so there's no big-bang refactor.

| Module | Files (target) | Owns | Interface (others call only this) |
|---|---|---|---|
| **registry** | `src/data/registry.js` (generated from REGISTRY.json), `src/data/recipes.js`, `src/data/gates.js` | ids, names, faces, `handS`, drops, stack sizes, recipes, `availableFrom`, Dex text | `reg.block(id|key)`, `reg.item(key)`, `reg.recipesAt(station)`, `reg.available(key, world)` |
| **engine** | `src/engine/noa-setup.js`, `src/engine/materials.js` (atlas strips → noa materials), `src/engine/chunks.js` (`worldDataNeeded`, `saved` Map, height range) | noa config, atlas, chunk fill and store | `engine.setBlock(x,y,z,id)` (only through `world-edit`), `engine.getBlock`, `engine.onChunk(fn)` |
| **world-edit** | `src/world-edit.js`, `src/change-log.js` | every block change: protection (`keptCell`, plots, claims), Undo/Redo, change log | `applyEdit({x,y,z,from,to,by,cause})`. Machines, quarry, bots and Publish all call this. |
| **worldgen** | `src/worldgen.js` → `src/world/gen/{terrain.js, bands.js, ores.js, water.js, biomes.js, plants.js}` | deterministic voxel for (x,y,z,seed); `natural:true` flag for ore rules | `genVoxel(x,y,z)`, `biomeAt(x,z)`, `isNatural(x,y,z)` |
| **input (10 verbs)** | `src/input/verbs.js` (one dispatcher implementing CORE-MECHANICS §0.1 priority), `src/input/gestures.js` (kw-interact `KWI.GESTURE`), `src/feel.js` | the gesture → verb mapping; **no feature registers its own control** | Features register `onUse(key, fn)`, `onOpen(key, fn)`, `onConnect`, `onPair`. The dispatcher picks the verb. |
| **inventory** | `src/items.js` (Bag 15), `src/box.js`, `src/inventory/{slots.js, containers.js, backpack.js}` | stacks, containers, worn slots (back, head, suit), Move-item | `inv.move(from, to, n)`, `inv.container(id)`, `inv.add(key, n)` → overflow to the Overflow Box |
| **crafting and stations** | `src/craft.js`, `src/stations.js`, `src/stations/{smelter.js, forge.js, fabricator.js, labbench.js}` | recipe lists per station, timers, fuel and charge use, locked tiles ("Needs T5 · Fabricator", "Not in this world yet", "Find one first") | `craft.open(station)`, `craft.make(recipeId, n)` |
| **power and lights** | `src/power/grid.js` (graph of makers, stores, users and wires; 10 Hz sim), `src/lights/lights.js` (light budget §D, glow tiers, lanterns, day/night) | charge units, wire graph, light sources | `power.node(pos, {make, store, use, volt})`, `lights.add(pos, radius, color, steady|twinkle)` |
| **logistics** | `src/logistics/{tubes.js, filters.js, network.js, terminal.js, pads.js, drone.js}` | items in transit, tube groups (max 64 in transit, 512 tubes/player), network index | `logi.connect(a, b)`, `logi.request(key, n, to)` |
| **bots** | `src/bot/{bot.js, cargo.js, fob.js, path.js, program.js}` | Bot H1 follow and park, cargo 9/18/27, the low-battery ring, the shared Code Runtime (later) | `bot.pair(fob)`, `bot.cargo`, `bot.run(program)` |
| **effects** | `src/fx/{effects.js, chips.js}` | durations, cooldowns, max 3 active, off zones, rate limits | `fx.use(key, level)`, `fx.active()`, `fx.endAll(reason)` |
| **worlds** | `src/worlds.js` | Game world (Survival) vs Build world (Workshop), the Teacher gate, Publish (later, server) | `worlds.current()`, `worlds.rules()` (energy, limits, instant break) |
| **dex and progression** | `src/dex/bertodex.js`, `src/progress/{ladder.js, badges.js, stamps.js}`, `src/dailies/{board.js, chasm.js, circuit.js}` | first finds, categories, T1–T7, badges, Dailies, boards client | `dex.find(key)`, `progress.award(id)`, `daily.submit(run)` |
| **music** | `src/music/{noteblock.js, instruments.js, jukebox.js}` | the note sampler (C4 samples, pitch shift), discs, volume, teacher mute | `music.play(inst, pitch)` |
| **seasonal** | `src/seasonal/{packs.js, calendar.json, carve.js}` | pack windows, the teacher toggle per pack, carve faces | `season.enabled(pack)` |
| **furniture** | `src/furniture/{seat.js, table.js}` | sit = Use, stand = Move, palettes via Paint | `seat.sit(player, pos)` |
| **settings** | `src/settings/prefs.js` | `kulibert-prefs-v1` (lang), Motion (reduced motion), **Slow taps** (`worldPress` 800 ms), **More time to connect** (link 10 s → 20 s), Always day, Brighter nights, quality | `prefs.get(k)`, `prefs.on(k, fn)`. Every feature asks Motion before animating. |
| **save** | `src/save.js` → `src/save/{schema.js, migrate.js, local-idb.js, server-sync.js}` | doc format, versioned migrations, palette remap, server copy | `save.load(worldId)`, `save.write(doc)`, `save.migrate(doc)` |
| **ui** | `src/panels.js` → kw-interact `openPanel` / `enableTapToSlot` / `enableDrag` / `startConnectMode` / `linkChip` / `showNetwork` | panels, chips, toasts | `ui.panel(spec)`, `ui.chip(text, {polite})` |

**Sim tick:** one fixed 10 Hz `sim.tick(dt)` is driven from noa `tick`. Power, tubes, machines, glow timers and bots register `sim.on(fn, {hz})`. When a chunk loads, `sim.catchUp(chunk, elapsed)` runs capped math (up to 8 game-hours), never a frame-by-frame replay. Out of power never loses items.

---

## §C Data model and save schema
### C.1 Registry (static)
`REGISTRY.json` (§0) is the data. `src/data/registry.js` is generated from it, and nothing else holds names or recipes.

### C.2 World doc v3 (local IDB + server copy)
```json
{ "format": "kuliblocks", "v": 3, "appVersion": "2.6.2", "id": "bertyville-survival", "world": "game|build",
  "seed": 1, "gen": { "terrain": 1, "ores": 1, "water": 1, "biomes": 0 },
  "chunkSize": 24, "palette": ["air", "grass", "…by key…"],
  "chunks": { "i,j,k": "gzip-base64 Uint16Array(24^3), ids index into palette" },
  "chunkMeta": { "i,j,k": { "edited": true, "genV": { "ores": 1, "water": 1 }, "claims": ["alias"] } },
  "blockState": { "x,y,z": { "k": "glowStick", "placedAt": 1728212345, "litUntil": 1728212945, "color": "pink", "face": "16x16 1-bit base64 (carved pumpkin)", "owner": "alias" } },
  "machines": { "x,y,z": { "k": "smelter", "in": [["ironOre", 5]], "fuel": 12, "out": [], "t": 2.1 } },
  "power": { "nets": [{ "id": 1, "stored": 31, "cap": 40 }] },
  "logistics": { "tubes": { "x,y,z": { "items": [["coal", 1, 0.4]] } }, "network": { "core": "x,y,z", "drives": [] }, "pads": [] },
  "player": { "bag": [], "pockets": [], "worn": { "back": null, "head": null, "suit": null }, "pos": [0, 5, 0], "spawn": [0, 5, 0], "found": ["coal"], "dex": {}, "fx": [] },
  "bots": [{ "id": "b1", "pos": [], "cargo": [], "battery": 0.8, "fob": "f1" }],
  "econ": { "wallet": { "copper": 0 }, "restocksSeen": ["flour"] },
  "progress": { "ladder": [], "badges": [], "stamps": [], "dailies": {} },
  "gifts": { "glowMoss8": "2026-10-xx" },
  "meta": { "updatedAt": "ISO-8601 with offset", "device": "cb|phone", "syncRev": 0 } }
```

### C.3 Migrations (`src/save/migrate.js`)
Each migration is pure: `(doc) => doc`. They run in order when loading, are tested in `tools/migrate-check.mjs` with fixture saves from every live version, and **never drop data**.

| From → to | Ships in | What |
|---|---|---|
| v2 → v2.1 | **2.5.44 (basics-1), before the first new id** | **Palette remap:** on load, map each saved chunk id through `doc.palette[id]` → current `reg.block(key).id`. An unknown key becomes `air`, and an item copy of it goes to the Overflow Box (2.6.0) or a gift Box (before 2.6.0), never silently dropped. `readDoc` stops rejecting ids > `BLOCKS.length`. |
| v2.1 → v2.2 | 2.5.44 | Picks: `woodTool` and `stoneTool` keep their keys (names "Wood Pick" and "Stone Pick"). Owned picks stay. New recipe = 3 + 2 Sticks. |
| v2.2 → v2.3 | 2.5.45 | `blockState` for glow timers; one-time `gifts.glowMoss8` (8 Glow Moss into the Lost & Found / Overflow Box) if glow ships before world-1. |
| v2.3 → v2.4 | 2.6.0 | Bag panel tabs; `worn` slots; the Overflow Box (id 144) holds anything that didn't fit. |
| v2.4 → v3 | 2.6.2 (world-1a) | Adds `gen` and `chunkMeta`. **Existing unedited chunks regenerate** with ores and water. Edited or claimed chunks keep their blocks, and ore is re-placed only into `natural` stone (WORLD-1). |
| v3 → v3.1 | 2.6.4 (world-2a) | `gen.biomes = 1`; the same edited-chunk rule; a blend seam. |
| later | per stage | Additive only: `machines`, `logistics`, `bots`, `progress`, `econ.wallet` metals (legacyRead `bronze` → `copper`). |

`schema.js` exports `CURRENT_V` and a `validate(doc)` used by Import (2 MB cap stays), by the server sync, and by `migrate-check`.

### C.4 Server copy (Chromebooks wipe local data). **NEEDS DIEGO + Curriculum compliance check**
- **Today there is none.** TechWorks (`trebiluk/TechWorks`: Cloudflare Pages, KV `TW_DESK`, D1 `KN_DB`) has only `/api/prefs` (one KV key `tw-prefs-v1`, an 8 KB per-app cap, read-modify-write), plus who, marks, desk and door-links. A world doc is 50 KB to 2 MB, so it **can't** go in prefs.
- **Proposal:**
  - New `POST/GET /api/bertopia/world` on TechWorks with D1 table `bt_worlds(alias_ref TEXT, world TEXT, rev INT, doc BLOB gzip, updated_at TEXT, PRIMARY KEY(alias_ref, world))`.
  - Plus `bt_world_revs` keeping the last 5 revisions for restore.
  - Size cap 2 MB per world. Rate limit of 1 write per 20 s.
- **Client:** `src/save/server-sync.js`.
  - Writes after a local autosave when online, with an `If-Match: rev` header.
  - Loads the newer of local and server, judged by `meta.syncRev` and `updatedAt`.
  - On a conflict it keeps both, takes the server copy and offers "Use this device's copy".
- **Identity:** the TechWorks alias ref only (`kw-who`). No PII.
- **Needs a decision:** Diego's OK for the endpoint, plus Curriculum Bot's FERPA / NY Ed Law 2-d check (student work stored on our Cloudflare account, retention, and deletion on request). PROGRESSION-PLAN §6.4 assumes "everything saves to the TechWorks profile". This is the piece that makes that true.
- **Slot:** a separate small brief, `bertopia-save-1`, after Diego's OK. It's **not** in the near-term queue, because it needs a TechWorks deploy. Until it ships, every What's new line keeps the "Export your world" tip.

### C.5 Save keys (local)
| Key | Store | What |
|---|---|---|
| `kuliblocks` / `kuliblocks-test` | IDB `worlds` | world docs (Game `bertyville-survival`, Build `bertyville`) |
| `bloxlog` | IDB | change log (14 days, 5 MB) |
| `kulibert-prefs-v1` | localStorage (shared module) | lang and shared prefs (Motion, Slow taps, More time to connect via kw-interact) |
| `bloxbert-*` | localStorage | quality, fps, look, stick, text, learn, menu-hint, last-world. They're folded into `prefs.js`, keeping old keys as read fallbacks. |
| `bertopia-season-v1` | localStorage | pack toggles seen (the teacher toggle is server-side later) |

---

## §D Performance budgets (mid/low Chromebook and phone)
Reference devices: a low Chromebook (Celeron N4500 class, 4 GB, 1366×768) and a mid Android phone (412×915 CSS px, DPR 2.6). Measured with `tools/measure.mjs` plus a new `perf-check.mjs` (§F).

| Budget | Chromebook (Auto) | Phone (Auto/Lite) | Notes |
|---|---|---|---|
| Frame rate | **60 fps target**, ≥30 floor (Auto drops resolution after 3 s under 30) | 60 target, ≥30 floor | WORLD-2 test 11: 1366 with CPU 4× throttle and snowfall ≥ 30 fps |
| Draw calls | ≤ 250 | ≤ 150 | merged chunk meshes; one material per atlas strip |
| Chunk radius (add/remove) | auto [1.5,1]/[2.5,2]; full [2,1.5]/[3,2.5] | lite: auto radius, scale 1.75 | **Unchanged.** Height grows instead. |
| World height | y −64 (coreplate) to **y 255**, chunked at 24 → 14 chunk layers | same | Today y > 24 is air. Generate up to y 32 (Frostspire peaks); **above that it stays air with no generation cost**, and only edited chunks are stored. 200-tall builds = up to 9 edited layers. |
| Atlas | terrain ≤ 256 layers × 32 px (now 115); alpha strip separate (now 45); items grid 16 cols | same | 32 px tiles; mipmaps on; no 64 px |
| Texture memory | ≤ 48 MB GPU | ≤ 32 MB | |
| JS heap | ≤ 250 MB | ≤ 180 MB | chunk Uint16 24³ = 27.6 KB; 400 loaded chunks ≈ 11 MB |
| Real point lights | **4 nearest** (Babylon `maxSimultaneousLights` default 4) | **2** (Lite) | basics-1 3d and basics-2 1c ask for 8, which is too costly. All other lights are emissive or glow sprites with a baked radius in the vertex light pass (noa AO + `lights.js` light field). §H patch. |
| Glow objects | 128 T1 + 64 T2–T4 per player (basics-2) | same | |
| Sim tick | 10 Hz, ≤ 2 ms per tick | ≤ 3 ms | tubes ≤ 64 items in transit per group, 512 tube blocks per player |
| Save | autosave ≤ 30 ms main thread (gzip in a worker or `CompressionStream`) | same | |
| First load | < 1 MB gzip; lazy chunks for: carve panel (fabric 7.4.0), music samples, effects, Terminal | same | |
| Particles | ≤ 200 live; zero when Motion is off | ≤ 100 | |

## §E Near-term milestones: the paste order (unchanged by §S)
**Order** (Flo's approval 6:48 AM; GM-ANSWERS "queue order"):
- 2.5.43 → basics-1/2/3 → 260 → 260b
- **world-1 right after 260b, then world-2**
- then storage-1 → storage-2 → bot-cargo → storage-4 → storage-5 → storage-3 → storage-6 → fun-1 → music-1 → holidays-1

**Storage-1:** GM-ANSWERS says it "doesn't need ores and can stay where it is". Debugzy reads that as staying directly before storage-2 (its old neighbour). The other reading, storage-1 at 2.6.2 before world-1, is open question G-Q1. If GM picks it, swap the two version numbers; nothing else changes.

**Every brief follows the format** (`bertopia-2543.md` is the reference):
- 3 items, at most 6.5k characters
- real-input DONE / NOT DONE rules
- a version bump plus a What's new line plus the Hub chip
- the two exact closing lines

**Proof for every milestone:**
1. `npm run build:test` → `node tools/smoke.mjs <test url>` (the full Accept map, §F) must PASS.
2. Screenshots at **phone 412×915 upright, phone 915×412 sideways, Chromebook 1366×768** go in `/workspace/proof/bertopia-<ver>/` with a `RESULT.md`.
3. Live check: `curl -s https://apps.kulibert.net/blocks/ | grep app.js?v=<ver>`, then the audit executor re-runs smoke against the live URL.
4. Build replies with the commit sha. Debugzy checks that the commit author is trebiluk.

| # | Ver | Brief | Scope (3 items) | Files touched (main) | Key Accepts (the full list is in the brief) |
|---|---|---|---|---|---|
| 0 | **2.5.43** | `bertopia-2543.md` | 1. Touch HUD never covers itself. 2. Teacher-only = `HubStaffAuth.isUnlocked()`. 3. Words + smoke catch up. | `main.js` (HUD layout, teacher gate), `panels.js`, `strings*.js`, `changelog.js`, `tools/smoke.mjs` | No HUD overlap at 412 upright/sideways/1366; the teacher tile is hidden without the hub flag; smoke ≥ the 2.5.42 count plus the new checks. **Plus phase 0** (§0) as hygiene if it fits; otherwise it goes in basics-1 item 1. |
| 1 | **2.5.44** | `bertopia-basics-1.md` | 1. Doors (wood, glass, metal, sliding), Lever, Push Button, builder lock. 2. Day/night, Always day, Brighter nights, Light Up badges. 3. LED Lantern, Battery Cell, Charger (T5, gated). **Patched:** registry rows first; palette-remap migration; Stick 2 → 4; Smelter/Fabricator recipes from GM; **no ore generation here** (moved to world-1a); 4 real lights. | `data/registry.js`, `data/recipes.js`, `data/gates.js` (new), `save/migrate.js` (new), `main.js` (BLOCKS 32–48), `lights/lights.js` (new), `stations.js`, `tools/smoke.mjs` | Old 2.5.42 save loads with every block intact after new ids are added (migrate-check); a door opens by tap and **never breaks on a hold** (interactive blocks); night luminance ≥ 40% (≥ 60% Brighter); the Lantern shows "Needs T5 · Fabricator" with gates closed and cycles Low → Med → High with `__smoke.gate('T5')`. |
| 2 | **2.5.45** | `bertopia-basics-2.md` | 1. Four glow tiers. 2. Colours, caps, minimap breadcrumb. 3. Lessons. **Patched:** Plastic Tube = Oven + Workbench; Paint dab = Berry; Jumbo ×2 and returns 1 Tube each; Glow Mix also 2 Moss; Cold Glow Vial locked tile "Needs Ice (snow biome)"; **one-time gift of 8 Glow Moss** in the Lost & Found (becomes the Overflow Box in 2.6.0); Corn bushes on Grass. | `data/registry.js`, `data/recipes.js`, `lights/lights.js`, `save/migrate.js` (gift), `worldgen.js` (Corn on Grass), `learn.js` | Each tier's radius and timer by fake clock; caps 128/64; the timer survives reload; the gift arrives once per Game-world player and never twice. |
| 3 | **2.5.46** | `bertopia-basics-3.md` | 1. Solar Panel + LED Glow Strip. 2. Copper Wire you can see. 3. Powered sliding door + lesson. **Patched:** Silicon at the Smelter (1 Quartz + 1 Coal, T5). | `power/grid.js` (new), `lights/lights.js`, `data/*`, `main.js` | A panel, wire and 2 strips stay r3 all night; a broken wire turns the far side gray; a lever opens a metal door through wire. |
| 4 | **2.6.0** | `bertopia-260.md` | 1. kw-interact in; one Bag panel in 3 shapes. 2. 15 slots and tabs Hotbar / Pockets / Backpack / Bot. 3. Drag plus press, link and timing rules. **Patched:** Flo GO; Build fills es/uk/ru/rw/ti labels (Curriculum checks later), ar and fa-AF from INTERACTION-STYLE §7; overflow keeps using Lost & Found (the Overflow Box block, id 144, is a later rename). | `input/gestures.js` (new, `KWI.GESTURE.worldPress` 500 / Slow taps 800), `panels.js` → kw-interact, `items.js`, `inventory/*` | 20 mixed moves with Bag totals unchanged; tap-to-slot works one-thumb at 412; Slow taps lengthens the world press to 800 ms. |
| 5 | **2.6.1** | `bertopia-260b.md` | 1. Search, tabs, Recent and Saved, keys. 2. Move stacks without losing a block. 3. Save the arrangement; rotation and RTL. | `panels.js`, `inventory/*`, `strings*.js` | Search finds by name in all 8 languages; the arrangement survives reload and rotation; RTL mirrors correctly. |
| 6 | **2.6.2** | **`bertopia-world-1a.md`** (new) | 1. Registry rows + v3 save + ore bands (S, B1–B4) with natural-only placement. 2. Glow Moss clumps + first-find chip (Clay moves to world-1b with water). 3. Locked-tile rule `availableFrom`. | `world/gen/{bands,ores}.js` (new), `worldgen.js`, `save/migrate.js` (v3), `data/registry.js`, `dex/bertodex.js` (first-find chip only), `tools/ore-check.mjs` (new, headless) | Headless 20-chunk ore counts within ±25% of WORLD-1; no ore in the town box; edited chunks unchanged; "Not in this world yet" tiles. |
| 7 | **2.6.3** | **`bertopia-world-1b.md`** (new) | 1. Still water: lakes, one river, a lake within 48 of spawn, carving rules. 2. Swim, breath, safe landings. 3. Pan + Bucket (+ Panned Gravel, Flakes → Nugget). | `world/gen/water.js` (new), `feel.js` (swim 2.2 b/s), `main.js`, `data/*`, `tools/water-check.mjs` | Water never spreads after 10 min of placing and breaking; a lake within 48 blocks in 5/5 seeds; pan odds within ±25% over 1,200 pans (headless). |
| 8 | **2.6.4** | **`bertopia-world-2a.md`** (new) | 1. Six biomes + blend + old-save safety. 2. Biome name chip + minimap patterns. 3. Snow, Ice (no slip), glare-safe colours, snowfall (Motion off = none). | `world/gen/biomes.js` (new), `worldgen.js`, `save/migrate.js` (v3.1), `ui` chip, minimap, `lights` (snow) | All six biomes within 12 chunks in 5/5 seeds; an old world-1 save near town is unchanged; no #FFFFFF pixel; minimap readable in greyscale. |
| 9 | **2.6.5** | **`bertopia-world-2b.md`** (new) | 1. The sea (`sea` tag, still water, edge wall). 2. Salt Crust + Salt Pan + unlocks (Cold Glow Vial, Frost Vial). 3. Biome ore rules + crops in biomes + Boundary Clay. | `world/gen/{water,ores,plants}.js`, `stations` (Salt Pan), `data/*`, `tools/ore-check.mjs` | Salt Pan makes 1 Salt per 4 daylight minutes beside the sea and shows "Needs seawater" elsewhere; platinum only in Emberdeep B4; Boundary Clay at y −24 under Tidewell, not under Frostspire. |
| 10 | 2.6.6 | `bertopia-storage-1.md` | Backpacks; shelves, Box, Double Box, Locker; furniture. | `inventory/*`, `data/*` | as in the brief |
| 11 | 2.6.7 | `bertopia-storage-2.md` | Paint Brush and palette; Blueprint colours; Interior Designer. **Plus (noted, not yet in brief text): seats and tables** (Chair, Stool, Bench, Table; sit = Use, stand = Move; furniture palette). This lands as **storage-2b** if it doesn't fit 6.5k. Pending GameMaster's furniture brief. | `furniture/*` (new) | as in the brief |
| 12 | 2.6.8 | `bertopia-bot-cargo.md` | Bot, fob, pairing; Cargo Bay; battery, terrain, badge. **Patched:** steady amber Low battery ring; water now exists (world-1); lava Accepts removed. | `bot/*` (new) | as in the brief |
| 13 | 2.6.9 | `bertopia-storage-4.md` | Item Tube, Extractor; Filter Tube, Sorter; jams, lessons, badges. | `logistics/{tubes,filters}.js`, `sim` | as in the brief |
| 14 | 2.6.10 | `bertopia-storage-5.md` | Cable, Core, Drive Bays, Drives; Storage Link, Terminal; no power, access. | `logistics/{network,terminal}.js` | as in the brief |
| 15 | 2.6.11 | `bertopia-storage-3.md` | Teleport Pads (items only); Delivery Drone + Dock; lessons. | `logistics/{pads,drone}.js` | as in the brief |
| 16 | 2.6.12 | `bertopia-storage-6.md` | Battery Box + shared charge unit; Network Pad + "Deliver to me"; badges. | `power/grid.js`, `logistics/*` | as in the brief |
| 17 | 2.6.13 | `bertopia-fun-1.md` | Pet Rock; Gravity Hat + Bounce Block; Disco Floor. **Patched:** no lava or Chasm Accepts. | `fun/*` | as in the brief |
| 18 | 2.6.14 | `bertopia-music-1.md` | Note Block; instruments + Jukebox (DJ Berty discs); volume, class mode, teacher mute. **Patched:** Teacher = HubStaffAuth gate, not a PIN. | `music/*` | as in the brief |
| 19 | 2.6.15 | `bertopia-holidays-1.md` | Calendar + teacher toggles; first 4 autumn packs; About cards + badge. **Patched:** Teacher = HubStaffAuth; autumn decor set; Jack-o'-lantern carving draft. Pending GameMaster, StyleBot and Curriculum specs. | `seasonal/*` (new) | as in the brief. **Timing risk:** at 2.6.15 it probably ships **after Oct 31** (G-Q12). |

## §S Whole-vision stage map (after 2.6.15; order proposed, GameMaster owns it)
Each stage lists:
- **Skill:** the real tech skill
- **Sandbox:** the no-pressure path
- **Mastery:** depth, records, boards and badges
- **Data:** data shapes
- **Save:** save keys (in the v3 doc, §C.2)
- **Engine:** engine pieces
- **Assets:** MANIFEST ids; ✅ = drawn in the pack, ◻ = `planned` row
- **Verbs:** the ten-verb mapping
- **Accepts:** acceptance tests (they become brief Accepts and smoke checks)
- **Slots:** Build brief slots in order

"Sandbox" for kids means free play on their own plot or in a teacher-enabled Build session. The Build world itself is Teacher-flag only (WORLDS), so a kid creative plot is open question G-Q4.

### S1 Bag, storage and furniture (260, 260b, storage-1, storage-2, furniture-2)
- **Skill:** organisation, categories, capacity planning. **Sandbox:** decorate a room, with Build-world palette rules. **Mastery:** Pack Rat and Interior Designer badges; "fewest Bag trips" for a build (board stat `trips`).
- **Data:** `inv = {bag:[[key,n]x9], pockets:[x6], worn:{back,head,suit}}`, `container = {id, k, slots:[], lock:{owner,crew}}`. Furniture `seat = {k:'chair', palette:'teal', facing}`.
- **Save:** `player.bag/pockets/worn`, `blockState[pos].slots`, `blockState[pos].palette`.
- **Engine:** kw-interact panels; container registry; Overflow Box. Seat: on Use, snap the camera to seat height and freeze Move until the stick or keys move (= stand). No new control.
- **Assets:** ✅ wallShelf, shelf, sideTable, desk, cabinet, glassCabinet, steelLocker, box, overflowBox, satchel/backpack/expeditionPack, chair, stool, bench, table (+ 8 palette variants each), `ui:bag`, `ui:chest`, `ui:shelf`, `ui:chair`, `ui:paint`, `sit` sound. ◻ sofa, bed, lamp, rug, pictureFrame, plantPot.
- **Verbs:** Open, Move-item, Place, Paint, Use (sit), Move (stand).
- **Accepts:** 20 mixed moves keep Bag totals; a Box beside a Box merges to 36; breaking storage drops its contents into the Bag, then the Overflow Box; sit on a chair by Use and stand by moving the stick at 412 upright; a seat never traps you (Jump also stands).
- **Slots:** 260 → 260b → storage-1 → storage-2 (+2b seats) → furniture-2 (sofa, bed, lamp, rug; pending GameMaster's furniture brief).

### S2 Power and lights (basics-1…3, storage-6, power-1, power-2)
- **Skill:** circuits: making, storing and using power; series and parallel; voltage. **Sandbox:** "Always day" plus Build-world free power. **Mastery:** Night Shift; "spare charge at dawn"; the village grid uptime board.
- **Data:** `node = {pos, kind:'make|store|use|wire|xfmr', rate, cap, volt:'L|M|H'}`, `net = {id, nodes:[], stored, cap}`.
- **Save:** `power.nets`, `blockState[pos].charge`.
- **Engine:** `power/grid.js` union-find nets, recomputed on `applyEdit`; 10 Hz flow; catch-up; teal glow on powered wire (Motion off = steady); `lights.js` budget of 4 (2 Lite) real lights.
- **Assets:** ✅ charger, solarPanel, batteryBox, copperWireBlock, glowStrip, lantern, lever, pushButton, doors, `power_on/off`, `low_battery`, `charge_tick`, `ui:power`, `ui:battery_*`, `ui:wire`, `ui:light`. ◻ windTurbine, waterWheel, biofuelGen, capacitorBank, transformers, powerMeter (Tekkit #7–9, 22).
- **Verbs:** Place, Connect, Open (info), Use (lever, lantern).
- **Accepts:** basics-1/2/3 Accepts; overvolting a Low machine trips it (chip "Too much voltage", paused, no damage); out of power never loses items.
- **Slots:** basics-1 → basics-3 → storage-6 → power-1 (Power Meter, Capacitor Bank) → power-2 (generators, transformers).

### S3 Logistics (storage-4, storage-5, storage-3, storage-6, storage-7)
- **Skill:** logistics and automation: conveyors, sorting, networks, search, delivery trade-offs. **Sandbox:** Build-world tubes with no energy cost. **Mastery:** Tube Tycoon, Sort It Out, Supply Chain; the 64-kind sorter; items/min boards.
- **Data:** `tubeGroup = {id, tubes:[pos], inTransit:[[key,n,pos,t]] (≤64)}`, `filter = {mode:'item|type|color', keys:[≤6]}`, `network = {core:pos, bays:[pos], drives:[{size:'S|M|L', kinds:{key:n}}], links:[pos]}`, `pad = {pos, pair, tray:[9], charge}`, `drone = {dock, pos, route, payload:[4], charge}`.
- **Save:** `logistics.*`.
- **Engine:** tube pathing (BFS on the group graph, cached until an edit); one rendered item per tube block; network index (Map key → locations); Terminal search via registry names in the current language; drone straight-line flight 3 blocks above the tallest block (heightmap per chunk).
- **Assets:** ✅ itemTube, poweredTube, filterTube, extractor, sorter, networkCable, networkCore, driveBay, terminal, storageLink, teleportPad, droneDock, networkPad, drives, deliveryDrone, `tube_whoosh`, `teleport`, `drone_hum`, `ui:tube`, `ui:filter`, `ui:network`, `ui:search`, `ui:sort`, `ui:teleport`, `ui:drone`. ◻ autocraft request UI.
- **Verbs:** Place, Connect, Pair, Open, Move-item, Use (send, Show Network, Deliver to me).
- **Accepts:** the STORAGE-SPEC phase Accepts; a jam backs up and never pops items; ≤ 2 ms per sim tick with 512 tubes and 64 items in transit (perf-check).
- **Slots:** storage-4 → storage-5 → storage-3 → storage-6 → storage-7 (autocraft requests; Tekkit #28).

### S4 Bots: cargo, then code (bot-cargo, bot-code-1, code-2)
- **Skill:** coding (sequence, loops, if, debug); radio signal strength. **Sandbox:** a bot in Build-world missions. **Mastery:** shortest-program boards, the Bot fleet goal.
- **Data:** `bot = {id, pos, battery, cargo:[], fob, access, program?}`, `program = {v:1, steps:[{op:'walk|turn|repeat|if|dig|place', n, body}]}` (the shared Code Runtime, World Plan §H2/H5; Koderized badges unlock ops).
- **Save:** `bots[]`.
- **Engine:** `bot/path.js` (A* on walkable voxels, catch-up hop after 3 s); steady amber Low battery ring plus the `low_battery` tone; the program runner steps at 2 Hz, with Stop working within one action and Undo of a whole run as one change set.
- **Assets:** ✅ bot sprite, fob, `bot_beep`, `bot_stuck`, `ui:bot`, `ui:warning_amber`. ◻ looksBotPaint, Tunnel Bore.
- **Verbs:** Craft, Place, Pair, Open (Cargo, code panel), Use (Run/Step/Stop).
- **Accepts:** bot-cargo Accepts; the M3 missions (flag, path of 8, 6×3 wall); Stop within one action; Undo run restores every block.
- **Slots:** bot-cargo → bot-code-1 (missions M1–M3) → code-2 (Brainbox + Monitor, Tekkit #25).

### S5 Worlds and biomes (world-1a/b, world-2a/b, world-3, world-4)
- **Skill:** materials and elements; geology (depth, rarity, real abundance); water and phase change. **Sandbox:** explore and swim with no timers. **Mastery:** Explorer, Deep Digger, the all-element wallet, first-find counts.
- **Data:** `gen = {terrain, ores, water, biomes, regrow}` versions, `chunkMeta`, `biomeAt(x,z) = {k, blend}`.
- **Save:** `gen`, `chunkMeta`.
- **Engine:** deterministic gen per chunk in a worker (`world/gen/*`); edited-chunk protection; carving skips claims and the town; heightmap.
- **Assets:** ✅ every world-1/2 block, ore pattern, item icon, minimap tile and sound listed in WORLD-1 §7 and WORLD-2 §8 (splash, pan_swirl, first_find, wind_loop, waves_loop, step_snow, salt_ding). ◻ lava/magma (world-3), meteorite, iridiumOre, rhodiumOre, hangingIsle*, cloudBlock (world-4).
- **Verbs:** Move (swim), Mine, Use (Pan, Bucket).
- **Accepts:** WORLD-1 §8 and WORLD-2 §9 in full (in the world briefs).
- **Slots:** world-1a → world-1b → world-2a → world-2b → (later) world-3a/b with economy → world-4 (Hanging Isles).

### S6 Game world vs Workshop (worlds-1, then Publish with the server)
- **Skill:** design review and publishing; the difference between a sandbox and production. **Sandbox:** the Workshop itself (Teacher flag). **Mastery:** Builder badges.
- **Data:** `worlds.rules = {energy, limits, instantBreak, alwaysDay}`, `publish = {area, rev, by, at}` (last 5).
- **Save:** separate docs per world; Bags never cross worlds.
- **Engine:** a `worlds.js` rules switch; the Workshop Door (id 126) is visible only with the Teacher flag (HubStaffAuth until the TechWorks flag); Publish needs the server (S19).
- **Assets:** ✅ workshopDoor, `ui:workshop`, `ui:teacher`.
- **Verbs:** Open (door), Use (Publish / Undo Publish).
- **Accepts:** a non-teacher never sees the door; Bag contents never cross worlds; Publish skips claimed plots.
- **Slots:** worlds-1 (door + rules) → publish-1 (after save-1).

### S7 Tech machines (mach-1…3, circuits-1…3, mech-1, rail-1…3, farm-1…2, gear-1, fusion-1)
- **Skill:** automation, processing, logic, mechanisms, transport, agri-tech, systems engineering.
- **Sandbox:** Build world. **Mastery:** BERTOPIA-TEKKIT-FEATURES §2 crazy goals (draft, pending the GameMaster mastery spec).
- Data, engine and assets per machine are in TEKKIT-FEATURES §1. Shared engine pieces:
  - the `machine` record (C.2)
  - the 10 Hz sim with catch-up
  - all block changes through `applyEdit`, with the owner's claim checked
  - a marked-area tool that reuses the Publish corner taps (G-Q8)
- **Slots (proposed):** mach-1 (Grinder, Electric Smelter, Compressor, Extract Press) → circuits-1 (gates, timer, sensors; aligns with the Circuit Daily) → mach-2 (Assembler, Recycler) → circuits-2 (Breaker, Deployer, Detector, Radio Link) → mech-1 (Chassis) → mach-3 (Quarry Rig, Area Filler/Builder) → rail-1/2 (Glideway) → agri-1/2 → gear-1 (Mining Beam, Exo-Suit) → rail-3 (Tunnel Bore) → fusion-1 (class megaproject).

### S8 Effects I–III (effects-1, effects-2, effects-3)
- **Skill:** chemistry and physics ideas ("more or stronger reagent = bigger or longer effect"). **Sandbox:** an "Effects Party" arena (teacher). **Mastery:** effect badges; Hide-and-Seek wins.
- **Data:** `fx = {k, level:1|2|3, until, cooldownUntil}`, max 3 active, same effect refreshes.
- **Save:** `player.fx`.
- **Engine:** `fx/effects.js` (off zones end effects on entry; rate limit; never changes another player or their build without an accept); HUD chips with a timer ring (Motion off = static icon).
- **Assets:** ✅ labBench, warpPad, sleepingBag, crewBanner, gameZoneFlag, warpKey, bandage, herbTonic, medKit, whistleBell, critterJar, morphVial, camoCloak, magnetWand, lightWand, fizzVial, frostVial, sparkRod, critter sprites, `warp`, `effect_on/off`. ◻ tier II/III items, effectRingTimer, effectParticles.
- **Verbs:** Craft (Lab Bench), Use, Place.
- **Accepts:** EFFECTS-SPEC shared rules: a 4th effect is refused politely; effects end on entering a Daily zone; Damage is off by default.
- **Slots:** effects-1 (Warp, Heal, Summon, Wonder Lab I) → effects-2 (Morph, Camo, Hide-and-Seek, level II) → effects-3 (level III).

### S9 Element economy and Cogs (world-3a/b)
- **Skill:** supply and demand, rarity, real abundance data, credit for inventors (Patents). **Sandbox:** view the Wallet in the Workshop. **Mastery:** the all-element wallet; Patent Holder.
- **Data:** ELEMENT-ECONOMY §7 shapes (`tradePost`, ledger rows with `src`, `cogMetals`, `legacyRead`).
- **Save:** `econ.wallet` (copper/silver/gold/platinum/iridium), `econ.restocksSeen`; server ledger later.
- **Engine:** Trade Post (raw ore only, ±20% nightly drift per class, server-side); Periodic Table Wallet panel; Patents need the server.
- **Assets:** ✅ cogs ×5, element entries, `coins`. ◻ tradePost, walletPanel, embercoreUpgrade.
- **Verbs:** Open, Move-item, Use (Sell).
- **Accepts:** a Trade Post price moves at most ±20% a day; home play earns Copper only; `bronze` → `copper` read on load.
- **Slots:** world-3a (regrowth, lava/magma bounce, Geology Night) → world-3b (Trade Post, Wallet, Bertodex full); Patents after save-1.
- **Needs Diego:** only the optional `wallet.showCountries` default (ELEMENT-ECONOMY §8).

### S10 Progression, achievements and the looks shop (ladder-1, achieve-1, looks-1)
- **Skill:** planning and budgeting (Cogs ladder); materials knowledge (T1–T7 = real shop materials). **Sandbox:** the Workshop sees everything unlocked. **Mastery:** Master Maker, Hall of Fame, tiered badges I/II/III (teal, blue, Berty purple).
- **Data:** PROGRESSION-PLAN §7 shapes (badge def, earned badge, ladder unlock, ledger row).
- **Save:** `progress.ladder/badges/stamps`.
- **Engine:** `progress/*`; `gates.js` replaced by `ladder.js`; local badges work offline, and only server-verified badges can be pinned.
- **Assets:** ✅ draftingTable, blueprintScroll, ladder materials (bamboo … glassPane), `sting_level`, `sting_milestone`, `ui:star`, `ui:trophy`. ◻ tierBadge1-7, achievementFrame, star icons, looks sets.
- **Verbs:** Open, Craft, Use (buy with Cogs).
- **Accepts:** each rung's alternate route works (for example, the Tested in HoldIt stamp opens the Forge); the looks shop sells **cosmetics only**, never power.
- **Slots:** ladder-1 → achieve-1 → looks-1.
- **Needs Diego (money/policy):** the looks shop must stay Cog-only with no real money. Confirm no TechCash link.

### S11 Dailies and boards (daily-1, circuit-1, chasm-1, boards-1)
- **Skill:** structures (Chasm bridges from HoldIt); circuit troubleshooting (Circuit Daily); efficiency. **Sandbox:** Build mode on yesterday's course; practice runs. **Mastery:** crowns, ghosts, Dethroned! rematch, personal-best fanfare (HIGHSCORE-CHASE-PLAN §2).
- **Data:** PROGRESSION-PLAN §4–6 seeds, `daily = {app, day, seed, run, score, verified}`; board rows aliases only.
- **Save:** `progress.dailies`; the server is the record keeper.
- **Engine:** `dailies/board.js` (Daily Board station), `chasm.js` (Glow Gorge side), `circuit.js` (DZ 0.1.3 step shape). Effects auto-end in Daily zones.
- **Assets:** ◻ chasmGate, chasmPlatform, chasmCheckpoint, circuitBoardTile, logic gate faces, dailyBoard, scoreBoardBlock, medals; ✅ `sting_daily_done`, `ui:daily`, `ui:scoreboard`.
- **Verbs:** Open (Board), Use (start), Move, Connect (circuit), Place.
- **Accepts:** the same seed for everyone, verified by the server; no streak penalty (3 of 5); boards hide on the teacher toggle.
- **Slots:** daily-1 → circuit-1 → chasm-1 → boards-1.
- **Needs Diego:** cross-class/school boards (HIGHSCORE §2.9).

### S12 Music (music-1, music-2)
- **Skill:** sound and pitch (frequency), sequencing; a link to DJ Berty. **Sandbox:** play freely. **Mastery:** a note-block song shared as a Blueprint; class mode.
- **Data:** `noteBlock = {pitch:0..24, inst by block below}`, `disc = {id, title, djBertyRef}`.
- **Save:** `blockState`.
- **Engine:** `music/*`; C4 samples pitch-shifted with WebAudio `playbackRate`; lazy-loaded; teacher mute.
- **Assets:** ✅ noteBlock, keyboardBlock, drumKit, guitar, jukebox, musicDisc, 9 `inst_*` samples, `ui:music`, `ui:note_block`, `ui:jukebox`. ◻ harp, xylophone, djBertyLinkDisc. The DJ Berty mixes stay in DJ Berty, not in the pack.
- **Verbs:** Place, Use (Note Block), Open (8-pad panel, Jukebox), Connect, Move-item (disc).
- **Accepts:** the music-1 Accepts; nothing autoplays above the class-mode volume.
- **Slots:** music-1 → music-2.

### S13 Holiday and seasonal packs (holidays-1, holidays-2, holidays-3…)
**Now specified by GameMaster in [BERTOPIA-DECOR-PACKS.md](BERTOPIA-DECOR-PACKS.md) (7:05 AM) and checked by Curriculum ([CURRICULUM-HOLIDAY-AND-TEKKIT-CHECK-2026-10-06.md](CURRICULUM-HOLIDAY-AND-TEKKIT-CHECK-2026-10-06.md)); look set by StyleBot ([STYLEBOT-HOLIDAY-LIGHTS-LOOK-2026-10-06.md](STYLEBOT-HOLIDAY-LIGHTS-LOOK-2026-10-06.md)).** Those files win over this section.
**Packs (resolved 7:20 AM, G-Q12/D7 naming → season names):** Autumn, Spooky, Winter and String lights (strings show as "Winter lights" in the Winter pack). Dropped: Harvest/Spooky-Cute names, Diwali, crescent-and-star lanterns, sugar-skull tiles.
- **Look rules (StyleBot):** every light capped at `#FFF1D6`, never `#FFFFFF`; halos use normal alpha blend, never additive; lit pumpkins steady (no flicker); twinkle = 70–100% brightness over a 4–7 s cycle, no flash; Motion off = all lights steady. **Caps within 32 blocks:** 48 animated bulbs, 6 ghost lights, 160 halos (beyond the cap, render steady / no halo).
- **Stamps:** round eye, triangle eye, smile, **Wide grin** (open smile, no teeth), star, **full moon**; Moon Lantern is a full round moon.

Defaults: every pack is optional with a teacher toggle (Hub row per pack: On / Off / Auto by date); lights are named "String lights" / **"Winter lights"**, never "Christmas lights"; no religious symbols; placed items never vanish when a pack turns off.
- **Skill:** light and energy (LED strings wired in parallel on the power rules); design and pattern (carving, pattern tiles); cultural awareness (About cards). **Sandbox:** decorate any time once unlocked (packs are kept forever). **Mastery:** none on boards (art isn't scored); teacher Carve-off through the contest module, off by default.
- **Autumn set** (DECOR-PACKS §2), all placed with Place: Hay Bale (seat), Pumpkin, Gourd Pile, Corn Stalks, Apple Crate, Leaf Pile, Scarecrow; Spooky: Friendly Ghost Light, Cobweb, Bat Bunting, Black Cat Statue, Moon Lantern, Pumpkin Stool and Spooky Bench (seats). **No skeletons or tombstones**, so the Spooky Sign (id 166) was redrawn as a wooden sign with a bat cut-out.
- **Pumpkin carving** (DECOR-PACKS §3): hold the **Carving Scoop** and Use a Pumpkin → Carve panel. 12×12 grid (Big Cells 8×8), Mirror on by default, 6 stamps, Undo 20, Clear, Done; My Carvings keeps the last 12. Face = 144-bit mask (18 bytes) per side, up to 4 sides, in `blockState[pos].faces[side]` and inside Blueprints. Lit = Jack-o'-Lantern, radius 6, warm amber, steady (no flicker).
  - It reuses **LogoLab's Mark Builder grid and stamps**. LogoLab is a separate repo, `trebiluk/logolab` (React + `fabric` ^7.4.0, MIT per its NOTICE; LogoLab itself is "classroom software, Copyright Solvay MS Tech Ed"). Bertopia is vanilla JS, so port the grid/stamp logic (same owner, same school) and keep fabric's MIT notice if any fabric code is lazy-loaded; a 12×12 grid needs no fabric at all.
- **String lights** (DECOR-PACKS §4): 2-tap place with sag; built-in battery until circuits, then Connect; Steady / Twinkle (70–100%, 4–7 s) / Slow Chase with fade, all per StyleBot (Motion off = Steady); one glow per string, no per-bulb lights; cap 64 strings × 12 bulbs per plot.
- **Furniture seats** are base game (S1, storage-2b): Chair, Stool, Bench, Table, Long Table; sit = Use, Move or Jump stands; "Taken" chip; Table displays 1 item.
- **Data:** `calendar.json [{pack, window, items}]` (school-editable); `season = {pack: {unlockedAt, teacherOn}}`.
- **Save:** `bertopia-season-v1` and the server teacher toggle later; `blockState[pos].faces/mode`; `carvings.recent[12]`.
- **Engine:** `seasonal/packs.js` (unlock on date, kept forever), `carve.js`; lights through `lights.js` (twinkle = brightness ramp, Motion-aware).
- **Assets:** ✅ pumpkin, jackOLantern, carvedPumpkin, cornStalks, leafPile, appleCrate, ghostLight, cobweb, marigold, papelPicado, skullPatternTile (now Marigold Pattern Tile), diyaLight/rangoliTile (Diwali dropped; unassigned), stringLights, hayBale, gourds, scarecrow, batsDeco, spookySign, harvestLantern (now "Autumn Lantern"), carvingTool, winterLights, wreath, giftBox, snowPal, ornamentTile, stripeBlock, `carve`, `lights_on`, `sting_holiday`, `ui:pumpkin`, `ui:carve`, `ui:string_lights`, `ui:gift`. ◻ winterLightsPattern, icicleDeco, snowGlobe, lanternFestival, springBlossom, heartGarland, newYearBanner, carvePanelStencils.
- **Verbs:** Place, Use (carve; light mode), Open (carve panel), Connect (lights), Paint.
- **Accepts:** a pack is off when the teacher toggle is off; a carved face survives reload and shows lit at night; twinkle has no flash and is steady with Motion off; no pixel above #FFF1D6 and 0 #FFFFFF; halo/bulb/ghost caps hold within 32 blocks; About cards exist for every pack.
- **Slots:** holidays-1 (autumn packs + carving) → holidays-2 (Winter Lights, Dec) → holidays-3+ (the rest of the FUN-ITEMS §7 calendar).

### S14 Bertodex (first-find chip in world-1a; full dex in world-3b)
- **Skill:** classification, real science facts, the periodic table. **Sandbox:** read freely; the Workshop shows the full Dex. **Mastery:** Dex completion; Dex Shelf trophy at half.
- **Data:** REGISTRY `dexId`/`dexCat`/`fact`; `player.dex = {key: {foundAt, count}}`.
- **Engine:** `dex/bertodex.js` reads `registry.js` only.
- **Assets:** ✅ dex text (`dex/bertodex-en.json`), `book_open`, `book_flip`, `sting_dex_new`, `first_find`, `ui:dex`, dexShelf.
- **Verbs:** Open.
- **Accepts:** every registry entry with a `dexId` renders a card; the fact chip text equals the registry text.
- **Slots:** world-1a (chip) → world-3b (full).

### S15 Settings and accessibility (continuous, in every brief)
- `kulibert-prefs-v1`
- **Motion off** (no snowfall, no twinkle, no particles, static effect icons)
- **Slow taps** (`worldPress` 800 ms)
- **More time to connect** (link window 10 s → 20 s)
- Always day, Brighter nights, text size, and the quality preset

Every brief's Accepts include one Motion-off check and one Slow-taps check where it adds gestures.

### S16 Server save (save-1). NEEDS DIEGO + Curriculum (§C.4)
- **Skill:** none for kids. It's trust: your work is never lost.
- **Slot:** as soon as approved; it can jump the queue (it touches TechWorks, not game content).

## §F Test harness: a real smoke that covers every Accept
**Problem:** Build chats have shrunk smoke to about 3 checks, and `smoke.mjs` drives the UI with `element.click()`, which skips the real gesture path (kw-interact timing, `worldPress`, the stick). **Fix:** smoke becomes a data-driven Accept map with real input, and the number of checks can only go up.

**Layout** (`bloxbert-src/tools/smoke/`):
| File | What |
|---|---|
| `run.mjs` | Runner (puppeteer-core 23.11.1, `/usr/bin/chromium --use-angle=swiftshader`). Runs every check at **412×915 touch, 915×412 touch, 1366×768 mouse**. Writes `RESULT.json`, screenshots and a short `RESULT.md` into `--proof <dir>`. |
| `input.mjs` | Real input only. `tap(x,y)` = CDP `Input.dispatchTouchEvent` touchStart → touchEnd after 60 ms. `hold(x,y,ms)` holds for that long. `drag(from,to,ms)`. `stick(dx,dy,ms)` drags on `#stick`. `key(k)` and `mouse(x,y,button,ms)` go through `page.keyboard` / `page.mouse`. `rotate()` = swap the viewport. **`element.click()` is banned** for gameplay checks; a lint step greps for it outside `setup()`. |
| `world.mjs` | Helpers on the `?smoke=1` test page via `window.__smoke`: `seed()`, `clock(+min)`, `gate('T5')`, `give(key,n)`, `tp(x,y,z)`, `look(yaw,pitch)`, `blockAt()`, `bag()`, `fps()`. On the student URL `__smoke` must be `undefined`. |
| `accept-map.json` | `{ "2.5.43": [{"id":"2543-1a", "brief":"bertopia-2543.md#1", "text":"…Accept line…", "check":"hud.noOverlap", "viewports":["412","915","1366"]}], … }`. **One row per Accept line in every brief.** |
| `checks/*.mjs` | Check functions by area (hud, teacher, doors, lights, glow, power, bag, ores, water, biomes, storage, bot, music, seasonal, perf). |
| `headless/*.mjs` | Node-only checks that import `src/world/gen/*` directly: `ore-check` (20 chunks per band or biome, ±25%), `water-check` (no spread, lake within 48 in 5 seeds), `biome-check` (all six within 12 chunks in 5 seeds), `migrate-check` (fixture saves from 2.5.10, 2.5.42, 2.6.1, 2.6.3 load with every block kept), `registry-check` (recipes.js = REGISTRY.json). |
| `perf.mjs` | 1366, CPU throttle 4× (`Emulation.setCPUThrottlingRate`): 30 s walk, report p5 fps, draw calls (`scene.getActiveMeshes` / engine counters), heap. Phone preset uses Lite. |
| `BASELINE.json` | Count of checks per version. **`run.mjs` fails if this version's check count is lower than the last one** or if any Accept row of the target brief has no check. |

**DONE rule** (goes in every brief): DONE only if `node tools/smoke/run.mjs --brief <file> --url <test> --proof /workspace/proof/bertopia-<ver>` prints `PASS n/n`. `n` must be at least `BASELINE[prev] + new Accept rows`. Then the live run uses `--url https://apps.kulibert.net/blocks/` (student URL: setup only, no `__smoke`).

**First fill:**
- The 2.5.43 brief adds the runner plus the rows for 2543 and 2.5.42 regressions (today's ~26 checks, converted to real input).
- Each later brief adds its own rows in the same commit.
- Debugzy keeps a master `accept-map.json` draft for all queued briefs in `/workspace/briefs/fixq/smoke-accept-map.json`. That's a follow-up; the briefs already list their Accepts line by line.

**Real-input snippet** (the reference for Build):
```js
export async function hold(page, x, y, ms) {
  const c = await page.target().createCDPSession()
  const pt = [{ x, y, id: 1, radiusX: 4, radiusY: 4, force: 1 }]
  await c.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: pt })
  await new Promise((r) => setTimeout(r, ms))
  await c.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
}
export const tap = (page, x, y) => hold(page, x, y, 60)   // < 250 ms and < 8 px = tap
// Game-world rules: tap(…) on a block must NOT break it; hold(…, 700) on Leaves must break it (GM-ANSWERS §7)
```

---

## §G Risks and open questions
### Risks
| Risk | Effect | Mitigation |
|---|---|---|
| **No server save** (Chromebooks wipe local data) | Kids lose worlds; Diego's "3 hours at home" promise breaks | §C.4 `save-1` as soon as Diego OKs it; meanwhile keep the Export tip in What's new |
| Palette not remapped on load | The first new block id corrupts old saves | Migration v2 → v2.1 in basics-1 (item 1), with migrate-check fixtures |
| `main.js` monolith (84 KB) | Merge conflicts, regressions | Split only the touched areas (§B), one module per brief |
| Lights cost | fps under 30 on low Chromebooks | 4 (Lite 2) real lights; emissive rest (§D) |
| World-1 regeneration of unedited chunks | A kid's "found" ore spot changes | Only unedited, unclaimed chunks; ore only in natural stone; announced in What's new |
| Sims on Chromebooks | Heat and battery drain | 10 Hz, catch-up math, loaded chunks only |
| Concurrent edits to briefs and specs (GameMaster, audit executor) | Lost edits | Check mtime before patching; `.bak` copies; docs commits rebase on origin/main |
| Holiday timing | holidays-1 at 2.6.15 likely lands after Oct 31 | G-Q12 |
| Build chats faking DONE / shrinking smoke | False passes | §F baseline guard + the audit executor's live re-run |

### Open questions for GameMaster
1. **G-Q1 Storage-1 slot:** directly before storage-2 (Debugzy's reading, 2.6.6) or at 2.6.2 before world-1 ("stays where it is")?
2. **G-Q2 Fabricator bootstrap loops:**
   - The Fabricator needs a Battery Cell, which is made only at the Fabricator.
   - It needs charge from a Charger, which is also made only at the Fabricator.
   - Proposal: allow **one** Battery Cell and **one** Charger at the Forge tab (slower, T4), or have the first Fabricator come with 1 charge-pack.
3. **G-Q3** Smelter "8 Brick": red, grey or either? The registry uses "either" for now.
4. **G-Q4 Kid sandbox path:** the Build world is Teacher-flag only. Should kids get a no-pressure creative plot, or does "sandbox" mean free play on their Survival plot plus teacher-run Build sessions?
5. **G-Q5** Wood and Stone Pick recipes change from live (5 Planks; 3 Stone + 2 Planks) to 3 + 2 Sticks. Owned picks are kept; OK?
6. **G-Q6** (answered by the basics-1 brief, 1c): Metal Door = 6 Steel, T4. GameMaster only needs to confirm; the registry matches.
7. **G-Q7** Restock: GM §6 per-16 prices replace live `ceil(base*1.1)`. Confirm the old multiplier is removed.
8. **G-Q8** Marking an area (Quarry, Area Filler, Publish): are Place-style corner taps with a marker item fine for kids?
9. **G-Q9** The Bucket: GM-ANSWERS gives 3 Iron Ingot. Does anything other than water use it (concrete mixing in the ladder)?
10. **G-Q10** (answered by DECOR-PACKS §3): a 12×12 grid with Mirror and 6 stamps, 18 bytes per face. Remaining: confirm no fabric dependency is wanted.
11. **G-Q11** New-action checks:
    - Carving, seats and String-lights placing are answered by DECOR-PACKS (Use with the Scoop; Use = sit; 2-tap place). Remaining: the String-lights 2-tap place needs a "pending first point" state in Use; confirm it's not a new verb.
    - Exo-Suit glide (hold Jump in air) and Mining Beam reach 6: see TEKKIT §3.
12. **G-Q12 Holiday timing:** (pack naming part RESOLVED 2026-10-06: season names.) Timing still open: holidays-1 (autumn and carving) is #19, so it probably misses Oct 31. Options: (a) keep the queue (Diego said the near-term order stays); (b) a tiny "autumn decor only" brief after 260b. Diego decides, because it changes the queue.
13. **G-Q13** Doors break by hold today (`HAND_S` 1.5). CORE-MECHANICS says interactive blocks don't break on hold. Is removal through long-press Options → "Pick up" (like the Charger)?
14. **G-Q14** Glow Moss gift before the Overflow Box exists (basics-2 ships before 260): basics-2 puts it in Lost & Found. OK?
15. **G-Q15** Lights: 4 real lights (2 in Lite) instead of 8 (basics-1 3d, basics-2 1c).
16. **G-Q16** Water Wheel (Tekkit #9) needs flow, but water never flows. Use the world-1 river's direction tag instead?
17. **G-Q17** The FIX-LIST audit says coyote time is missing. It's implemented (`feelTick`: coyote 120 ms, buffer 150 ms). Ask the audit to recheck rather than brief it.
18. **G-Q18** Diego asked for a "gravestone-style sign" (6:54); DECOR-PACKS bans tombstones. The pack now has a wooden bat sign; confirm with Diego.
19. **G-Q19** Iron Nugget (Carving Scoop, Spooky Bench) isn't in the registry or GM-ANSWERS. Add it (9 per Ingot?) or use the stand-ins?

### Needs Diego (money, safety, policy)
1. **D1 Server world save** (§C.4): a new TechWorks endpoint and D1 table, plus the FERPA / NY Ed Law 2-d check by Curriculum Bot.
2. **D2** Cross-class or school-wide boards for L-tier goals (aliases only).
3. **D3** Looks shop: confirm it's Cogs only, never TechCash or real money.
4. **D4** The Teacher flag from TechWorks (WORLDS): the server wiring waits for his OK. HubStaffAuth is the stopgap.
5. **D5** Review the holiday calendar before holidays-1 ships (FUN-ITEMS §7 says "for Diego's review"), plus the culture check by Curriculum.
6. **D6** `wallet.showCountries` default (ELEMENT-ECONOMY §8).
7. **D7 Holiday policy: RESOLVED 2026-10-06 → season names (Autumn, Spooky, Winter, String lights), per GameMaster's change notes.** History: Curriculum recommends seasons first (Autumn, Spooky, Winter) with no holiday-named default packs; holidays-1 still lists the Oct 4 packs (Harvest, Spooky-Cute, Día de los Muertos, Diwali). Pick one before holidays-1 is pasted; renaming is JSON-only. Curriculum also suggests checking the district's holiday-observance policy.

---

## §H Brief conflicts found and patched (2026-10-06)
| Brief | Conflict | Fix (patched in `/workspace/briefs/fixq/`) |
|---|---|---|
| all except 2543 | no What's new line or Hub chip bump; old version numbers | Added a What's new line + Hub chip; renumbered to §E |
| basics-1/2/3, bot-cargo | linked box paths `briefs/gamemaster/…` that Build can't read | point at `blocks/docs/…` (synced in the docs commit) |
| basics-1 | Stick 1 → 4; Smelter/Fabricator "PENDING GM"; "8 nearest lights"; ore generation overlapping world-1; no palette remap | Stick 2 → 4; GM recipes; 4 lights; ores moved to world-1a; registry rows + palette-remap migration first |
| basics-2 | Plastic Tube via Smelter/Forge; Paint dab pending; Jumbo count pending; Glow Moss generated at the coal rate | Oven + Workbench; Berry → 2 dabs; Jumbo ×2 and returns 1 Tube each; Glow Mix also 2 Moss; Glow Moss gift of 8 (world-1 generates moss); Cold Vial locked tile "Needs Ice (snow biome)" |
| basics-3 | Silicon at the Fabricator | Smelter (1 Quartz + 1 Coal, T5) |
| 260 | GO pending; labels | Flo GO; Build fills es/uk/ru/rw/ti, ar and fa-AF from INTERACTION-STYLE §7 |
| bot-cargo | water and lava Accepts impossible before world-1/2; lava isn't in world-1 | water Accepts kept (world-1 ships first), lava removed; steady amber Low battery ring |
| fun-1 | lava and Chasm Accepts impossible | replaced with flat-ground and still-water versions |
| music-1, holidays-1 | "Teacher panel (PIN)" | HubStaffAuth Teacher gate |
| holidays-1 | timing; Diego's autumn decor and carving ideas | autumn decor set + carving draft (pending GameMaster/StyleBot/Curriculum); the timing question is G-Q12 |
| FIX-LIST "Next up" | old order | renumbered in the docs commit |

## §T Tech machines
See [`BERTOPIA-TEKKIT-FEATURES.md`](BERTOPIA-TEKKIT-FEATURES.md) (starter for GameMaster; GameMaster owns the final ranking and goals). Stage codes there map to §S7.
