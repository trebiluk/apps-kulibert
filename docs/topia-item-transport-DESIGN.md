# Bertopia item transport on the live server: design

Design only (Diego, Oct 31). No code. Server: `server/class-room` (the World object, `world/sim.js`, `world/world.js`). Builds on 2.5.569 (P4: machines as time counters, 7.5 s sim, 60-min catch-up, offline ovens) and 2.5.591 (lagcost + high-tick budgets). Aliases and game data only.

Today the server stores block ids per chunk plus a counter per oven/belt. There are no items on the server: a kid's bag and box contents live on the client. This design puts **items inside machines and containers on the server** and moves them with tubes, hoppers and sorters, so a factory keeps running on the server for every kid in the room.

---

## 1. Item model

**Where items live.** A *container cell* is any placed block of a container kind: box (27), oven (23), hopper (new id), sorter (new id). Tubes (new id) and belts (74) hold items *in transit* (see 1.2). Each container cell has **slots**: `[{id, n}]` with `n ≤ 64` (the same stack rule as the client's `box.js`, `putInSlots(slots, item, n, cap = 64)`). Slot counts: box 27, oven 3 (in, fuel, out), hopper 5, sorter 5 + 1 filter slot. Item ids are the game's block/item ids (numbers), never names.

**Storage.** Items ride in the chunk save, next to machine counters, as a new chunk field `i` (`chunks.js` allows added fields; older chunks read as "no items"):
```
i: [[idx, [[id, n], ...]], ...]     // one row per container cell with anything in it; empty cells have no row
```
Transit items on tubes/belts are rows too (`idx` of the tube cell, at most 4 stacks on a tube, 8 on a belt cell). Per-chunk saves stay the unit of persistence: a chunk is written as a whole by `flush()` as today, so **the server copy wins** and nothing is written half.

**Ownership.** Nothing. Items in a world container belong to the world, not a kid (the game already treats a placed box that way). The edit log (`ops`) records block edits only; item moves are not logged (see risks).

### 1.1 Machines that make items
The P4 counters stay the clock. An oven with input `id` and fuel converts **per completed bake** (every `OVEN_MS` = 20 s of granted time): take 1 from in, 1 fuel per 4 bakes, add 1 output to out. The recipe table is the game's (shared file in `bloxbert-src/src/craft.js`, imported by the server as data). `done` from P4 becomes "bakes performed", and when input or fuel runs out the counter stops advancing (so catch-up cannot bake from nothing).

### 1.2 Moving items per tick
The sim step (every 7.5 s while players are on; one catch-up step on wake) runs **transport** after machines, per chunk, in a fixed order (cells by `idx`), so two kids see the same result. One "tick" below means one sim step unless stated.

| Block | Moves | Per sim step (7.5 s) | Where to |
|---|---|---|---|
| **Hopper** | pulls from the container above (or a belt/tube ending on it), pushes down or in the facing direction | **8 items** in, **8** out | one target cell only (its facing) |
| **Tube** | carries stacks along connected tubes | **1 stack hop per cell**, up to **4 stacks** on a cell | the next tube in the line, or the container at the end |
| **Belt** | as the client belt, but counted on the server | advances `step` (P4); items on a belt cell move 1 cell per `BELT_MS` of granted time, capped at **8 stacks** per cell | the next belt cell, or a container the belt ends on |
| **Sorter** | a hopper with a filter slot | **one batch of 8** matching items per step; non-matching items are passed straight on | match → its facing output; no match → the side output |
| **Box / oven** | passive | — | accept until full |

A move is only ever: **source → the single connected target**. If the target is full, the items stay (no overflow, no spill). Sorter rates are exposed as data in the chunk's `i` rows (the client shows "8× sorted" for a sorter and "1× slow" for a hopper; no server UI).

### 1.3 Connection = adjacency + facing, computed, not stored
Two cells are connected when one *faces* the other (hopper/sorter/tube facing is a block variant id, as levers have on/off variants) **and** both are container/transport kinds. A graph is rebuilt per chunk when its edits change (cheap: at most a few hundred transport cells per chunk, bounded by the high-tick cap for hoppers/sorters, see section 3). Tubes crossing a chunk border connect through the neighbour chunk's graph; a step handles up to `STEP_CHUNKS` = 64 chunks, so a long tube line is simply continued next step (one hop per step per cell keeps that honest).

---

## 2. "Loaded" versus the 0068 offline-ovens rule

0068 (decided): machines advance by elapsed time, ovens finish for offline kids, catch-up capped at 60 minutes. Transport must fit that without making unloaded factories cost CPU.

**Option A: no load rule; everything simulates, capped by catch-up.** Transport runs for every machine chunk every step while anyone is on, exactly like ovens today. Offline: one catch-up step grants up to 60 min to every chunk. Simple, one rule, matches 0068 literally. Cost: a world with many factories steps them all every 7.5 s even when nobody is near them; bounded by the 64-chunk cap and the high-tick budget (10 hoppers/sorters per 3×3 chunks), not by distance.

**Option B: "loaded" = within 2 chunks of a linked player's last position; unloaded transport pauses as a unit, counters keep time.** Ovens and belts keep advancing by elapsed time everywhere (0068 stands: an oven finishes for an offline kid). **Transport** (hopper, tube, sorter moves) runs only in loaded chunks. An unloaded contraption pauses *as one unit*: its chunks are marked by the graph, and none of them moves items. On load (a player arrives, or the world wakes), the paused chunks get **one capped catch-up of transport**: the number of steps they missed, capped at 60 min ÷ 7.5 s = 480 steps, run as an *estimate*, not a replay: each hopper moves `min(missed × 8, what it could have)` items in one go, each oven converts `min(bakes done, inputs)`. No half-ticking: a contraption is either loaded (all its chunks step together) or not.

**Pick: Option B.** It keeps 0068 (ovens finish, 60-min cap) and keeps the room tick steady under 20–30 kids: only factories near kids move items every step. The catch-up estimate is deterministic (counts, not timing), so two kids arriving see the same result. Rooms already know player positions (`room.js`), so "loaded" is a set of chunk keys the World gets from each room on link/touch (one small RPC per room per step, not per player).

---

## 3. Caps and no-leak rules (the server decides)

- **Per machine/tube cap per step:** hopper 8 in / 8 out; sorter one batch of 8; tube 1 hop per cell, 4 stacks per cell; belt 8 stacks per cell. Constants in `sim.js`.
- **Sorter batches:** a sorter moves 8 matching items at once and then nothing until the next step; if fewer than 8 match, it moves what matches. Exposed in `i` rows as `rate: 8` (sorter) / `1` (hopper), data only.
- **No leaking:** output goes **only to the one connected target** (facing). Never into a diagonal, never into a container that is merely adjacent, never into a kid's bag. A box next to an unconnected machine never fills. Full target → items wait.
- **Budgets (from #102) still apply:** hoppers and sorters join the high-tick list (ids TBD when added to `ids.js`): at most 10 of belt/oven/hopper/sorter per 3×3 chunks and 10 per player; tubes count as `circuit` class for lagcost (weight 5), so a huge tube maze is refused by lagcost before it is built. Staff exempt from the per-player cap only, as decided.
- **Per-step work cap:** at most `MOVES_PER_CHUNK` = 64 item moves per chunk per step; the rest wait. With 64 chunks per step that is 4096 moves at most, each a few map operations.

---

## 4. Build order (parts of ≤3 fixes, ~5 files each)

**Part 1: items in containers (no movement).** (1) `i` field in `chunks.js` + decode/encode; (2) `world/items.js`: slots, `put/take` with the 64 stack rule, container slot counts; (3) a `{t:'inv', cells:[...]}` read for a chunk and `{t:'take'/'put'}` edits via the existing edit path (rev/stale rules apply). Files: `chunks.js`, `world/items.js` (new), `world/world.js`, `room.js` (relay), `test/items.test.mjs`. Tests: round trip through a save, stack cap, full container refuses, older chunk loads with no items.

**Part 2: ovens convert, catch-up stops at empty.** (1) oven recipe step in `sim.js` using the shared recipe data; (2) counter stops when input/fuel is empty; (3) catch-up converts `min(bakes, inputs)`. Files: `sim.js`, `world/items.js`, shared recipe import, `test/oven-items.test.mjs`. Tests: bake with inputs, no inputs → no output and no `done` growth, offline 60-min catch-up never makes more than inputs allow, equals a never-slept run.

**Part 3: hoppers and tubes.** (1) new ids + facing variants (needs WordBot/ids lane for names: the server only needs the numbers); (2) graph per chunk, hopper 8/8, tube 1 hop, no-leak rule; (3) high-tick list gains hopper, tube = circuit for lagcost. Files: `sim.js`, `world/transport.js` (new), `world/budget.js`, `world/world.js`, `test/transport.test.mjs`. Tests: 20-hopper chain moves at the cap with steady step cost, unconnected box never fills, full target waits, cross-chunk tube continues next step, budget refuses the 11th hopper.

**Part 4: sorter + load rule (Option B).** (1) sorter filter slot and batch of 8; (2) loaded-chunk set from rooms, pause-as-a-unit, capped estimate on load; (3) `rate` data in `i` rows. Files: `world/transport.js`, `world-do.js`, `room.js` (loaded set RPC), `test/sorter.test.mjs`, `test/loaded.test.mjs`. Tests: sorter moves 8 matching and passes others, walk away → whole contraption stops (no half-tick), come back → estimate applied once and capped, two players arriving see the same state.

**Part 5 (client, other lane):** show inventories, rates and refusals. Not in this doc.

---

## 5. Risks

- **CPU with 20–30 kids:** the 64-chunk, 64-moves-per-chunk, 10-machines-per-area caps bound a step at roughly 4k map operations, well inside the 7.5 s budget; Option B keeps far factories idle. The risk is many kids each with a loaded 3×3 area: 30 kids × 9 chunks = 270 chunks > 64 per step, so loaded chunks round-robin and a factory may step every 2–5 cycles (15–37 s). Acceptable for 7.5 s hoppers; say so in the client ("factories run every few seconds").
- **Save size:** `i` rows add about 10 bytes per stack; a full 27-slot box is ~300 bytes; 10 containers per area is a few KB per chunk, within the per-chunk JSON. A chunk is still one row, written whole.
- **Determinism:** fixed cell order and count-based catch-up make two kids see the same result; any use of wall time inside a step would break that (none planned).
- **Item loss:** no item is ever destroyed by the server (full = wait). But item moves are not in the 7-day edit log, so a grief that empties a box cannot be rolled back by block history; a later part could log container deltas.
- **Format migration:** none; `i` is an added field, older chunks load empty. A world saved by this version read by an older server drops `i` on its next write (older code never writes `i`). Deploy order matters: server first, then client.
- **New ids** (hopper, tube, sorter, facing variants) need the ids lane and WordBot strings; the server design does not depend on the numbers.
