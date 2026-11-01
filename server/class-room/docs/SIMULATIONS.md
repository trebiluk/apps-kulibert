# Class simulations (class-room server)

Whole classes on the **real** Room and World code, in one process, with chaos. No network, no npm, no secrets.
Fake refs and aliases only ("Sim Pup NN").

## Run

```
cd server/class-room
npm test                                                        # includes the scenarios and a short soak
node --import ./test/shim/register.mjs --test test/sim.scenarios.test.mjs
node --import ./test/shim/register.mjs --test test/sim.soak.test.mjs
```

Long soaks (not in `npm test`):

```
SOAK_SEEDS=1-200 SOAK_STEPS=600 SOAK_KIDS=30 node --import ./test/shim/register.mjs --test test/sim.soak.test.mjs
SOAK_EVICT=1 ...            # also evict Room objects at random (exposes FINDING 2 below)
```

A failure prints its seed and step. `SIM_SEED=<n>` (scenarios) or `SOAK_SEEDS=<n>` (soak) replays it exactly:
every random choice (who does what, RPC order, lost and repeated deliveries) comes from that one seed.

## What is real and what is simulated

| Real (the shipped code) | Simulated |
|---|---|
| `Room` (joins, limits, reach, rate, fan-in), `makeHub`/`makeWorld` (claims, apply, ops, save), fan-out and inbox, items/ovens when the build has them | sockets (`FakeSocket`), time (node:test mock `Date` + `setInterval`), the World RPC hop (random 0..N ticks of delay, so calls from different kids interleave), lost and repeated World->Room deliveries, a Room rebuilt from its sockets, a World restarted from its saved db |

The fake client (`test/sim/harness.mjs`) behaves like the game: it keeps its own copy of the chunks it watches,
applies ops newer than each chunk, sends edits with the block **it sees** as `b` (so it can be stale), reloads on
`rs` or on a hole in the op stream, and asks again for chunks the server dropped over the limit.

## Invariants checked

- **Convergence:** every connected client's copy of every chunk it watches equals the World's.
- **Stream:** no client got an op twice, and none had a hole outside a reload.
- **Durability:** a fresh World from the saved db has the same chunks and head as the live one.
- **Conservation (items):** put minus taken equals what is in the box, live and after a reload.
- A self-check scenario breaks a room on purpose (drops one op, repeats one) and corrupts a client copy,
  and asserts the checks report all three.

## Scenarios (`test/sim.scenarios.test.mjs`)

class of 30 building at once · two rooms (34 kids) · chaos (lost/repeated deliveries, random RPC order, 3 seeds) ·
same-cell races with stale views · Room evicted and rebuilt · reconnect with a new ticket · flood (40-edit bursts) ·
grief rules under load · shared box under chaos (items builds) · self-check · two **todo** findings below.

## Findings (2026-11-01)

1. **World restart loses its memory.** The hub keeps plot owners, the open flag, room seats and the fan-out links
   in memory only. If the World object restarts while Rooms keep their sockets, every edit is refused `closed` and
   no op reaches any room until each kid rejoins. (todo scenario; it turns green when fixed)
2. **Room relink skips in-flight ops.** A rebuilt Room relinks at the World's head, so ops accepted while the old
   object went away never reach its clients, and they are not told to reload (`rs`). A client that checks op
   numbers sees the hole and reloads; one that does not keeps a stale view. With `SOAK_EVICT=1`, 7 of 100 seeds
   end with a client still behind at a checkpoint. (todo scenario)
3. **Over-limit chunk and sync requests get no answer.** `cget`/`sync` beyond 4/s (burst 8) are dropped silently.
   After a reload a client watching more than 8 chunks must keep asking until every chunk is fresh, or it keeps
   stale chunks. (The sim client does; the game client should be checked.)
4. A 40-edit burst is cut to the per-socket budget mostly without a `no` reply, so a fast-tapping client can lose
   taps without a sign (the room is built that way; noted for the client).
