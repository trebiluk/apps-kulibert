# Bertopia personal host (adults 18+, non-school) — design

Status: **design, waiting for GO before code.** Author: SERVERBOT. Brief: Diego, 2026-11-01 ("Bertopia personal host").
Branch for this doc: `feat/bertopia-home-host-design`. No code in this PR.

A self-hosted Bertopia multiplayer server for adults, for fun and for testing the current Topia build. It is **not** the
school class server and must never change school behaviour. Every student feature must work at home.

Everything below is a proposal. Where a choice was mine, it is marked **(choice)** so it can be overruled before code.

---

## 1. Architecture

```
 Player PC / phone (home build only)                 Owner PC
 ┌───────────────────────────────┐                  ┌───────────────────────────────────────────────┐
 │ bertopia-home/  (HOME_HOST)   │   ws://host:8890  │  node host/home.mjs            (plain Node 22+) │
 │  game client + join screen    │ ─────────────────▶│  ┌─────────┐  ┌───────────┐  ┌──────────────┐ │
 │  homeOwnerOn() owner tools    │ ◀───────────────  │  │ door    │─▶│ Room(s)   │─▶│ World        │ │
 └───────────────────────────────┘   hello / ops     │  │ session │  │ room.js   │  │ world-do.js  │ │
                                                     │  │ code,PIN│  │ guard.js  │  │ hub/world/*  │ │
 Owner browser (localhost only) ─── /owner ─────────▶│  │ limits  │  │ rules     │  │ editlog.js   │ │
                                                     │  └─────────┘  └───────────┘  └──────┬───────┘ │
                                                     │        host/runtime.mjs (WebSocket, sockets,   │
                                                     │        SQLite ctx, alarm)            worlds/*.sqlite
                                                     └───────────────────────────────────────────────┘
```

**Runtime (choice): plain Node, not wrangler/Miniflare.** The server modules are reused as they are
(`src/room.js`, `src/world-do.js`, `src/world/*`, `src/protocol.js`, `src/guard.js`, `src/rules.js`, `src/editlog.js`,
`src/token.js`); `host/runtime.mjs` (built and tested in PR #122) stands in for Cloudflare: WebSocket over TCP,
Room ctx with hibernation-style sockets, World ctx on `node:sqlite` (WAL, transactions, one alarm), RPC by structured
clone. Reasons: one process, one SQLite file per world, no Miniflare persistence quirks, restart-safe (proven in #122's
test: world, players and key survive a stop/start), and the owner tools can call the hub directly.
What is **not** reused from Cloudflare: `src/worker.js` (the school door). The home door is a new, smaller module
(`host/door.mjs`) because the join contract is different (session code + name, not a TechWorks ticket).

**Two doors, one Room/World.** The home door checks session code, name, 18+ confirm, limits and the owner PIN, then
mints a *home ticket* with `src/token.js` and hands the socket to the same `Room.fetch` the school uses. From there
every rule is the school's: one-use tickets, reach, rate, claims, grief strikes, chunk/sync limits, fan-out.

**Data on disk** (`--data`, default `~/Documents/Bertopia Home`): `home.json` (home secret, owner PIN hash, config),
`worlds/<id>.sqlite`, `backups/`. Nothing else. No names other than display names, no emails, no IPs (bans live in
memory for the session only), no codes, PINs or tokens in any log.

**Ports (choice):** default **8890**, configurable. Never 8787/8788 (wrangler dev) or 8877/8879/8881 (game checks).

## 2. Hard separation from school

| Rule in the brief | How |
|---|---|
| Separate build target, flag default off | `build.mjs --home` sets esbuild `define __HOME_HOST__: true` (the file already defines `__BLOX_STUDENT__`, `__BLOX_DOOR__`, `PKG_VERSION`) and outputs to **`bertopia-home/`**. `npm run build` / `build:test` never set it, so `bertopia/` and `blocks/` are byte-identical to today. Home-only code sits in `if (__HOME_HOST__) { … }` blocks and in files imported only from there, so esbuild drops it from the school bundle. |
| School bundle leak check | `tools/home-leak-check.mjs`: scans `bertopia/app.js`, `blocks/app.js`, `blocks-test/app.js` for `join code`, `session code`, `homeOwner`, `home-host`, the owner-UI i18n keys (`hostOwner*`, `sessionCode*`), `ws://`, `127.0.0.1`, `localhost:8890`, and any `http(s)://` or `wss://` host that is not `*.kulibert.net`. Fails the build/test if any is found. Also asserts `bertopia-home/` is **not** under `vercel.json` routes. |
| Own secret | Generated on first run (`crypto.randomBytes(32)`), stored in `home.json` only, never printed. `.gitignore` covers the data folder. The school secret is never read. |
| Tickets can't cross | Home tickets carry `iss: 'home'` and a cfg from the **home set** (`home-survival`, `home-creative`, …; see §5). The school Worker's `verifyToken` refuses them twice over: unknown `cfg` (not one of the 7) and, once added, `iss !== undefined`. The home door refuses school tickets because they have no `iss: 'home'` and a school cfg. (`token.js` change: accept an optional `iss` claim; default stays school.) |
| Never patch `staffOn()`/`HubStaffAuth`/`teacherOn()` | Untouched. The home build adds `homeOwnerOn()` = "this socket's hello said role `owner`", compiled only under `__HOME_HOST__`. Call sites that today read `teacherOn() || staffOn()` for the rules card get `|| (__HOME_HOST__ && homeOwnerOn())`, which esbuild folds to the old expression at school. |
| server-sync, hub sign-in, kw-test OFF | Under `__HOME_HOST__`: `classnet/config.js` returns the home endpoints from the join screen; `server-sync.js` is not imported (its `maybePush/maybePull` calls are behind the flag); the Tech Room bar is loaded without `data-signin`; the kw-test script tag is not emitted by the home `index.html`. The save chip paints from the local save and the home server's ack only; there is no cross-origin fetch, so no "Not saved" from CORS. |

## 3. Join flow (session code)

1. Owner presses **Start session** (owner page, localhost only, PIN). The server makes a **session code**: 8 chars from
   `23456789ABCDEFGHJKMNPQRSTUVWXYZ` (no 0/O/1/I/L), `crypto.randomInt` per char (≈ 2.4 × 10¹¹ codes). Never reused
   (hash of every past code kept in `home.json`). Shown once with a Copy button; stored only as a hash.
2. Player opens `http://<host>:8890/` (home build's join screen): **server address** (prefilled with the page's own
   origin), **session code**, **display name**, one-time **18+ confirm** checkbox ("This server is for adults 18+").
   Nothing about age is stored; the confirm is a `sessionStorage` flag so it is asked once per browser session.
3. `POST /join {code, name, pw?}` → the door checks, in this order: per-IP join limiter → session live → code hash
   match (constant-time) → optional owner password → name rules → max players → mints a home ticket (60 s, one use).
   Wrong code **counts** against the IP limiter. Reply: `{ticket, ws, world, version, rules}` or an error key.
4. Client opens `ws://…/rt/ws` with `['bt-room.v0', ticket]` — the unchanged school socket contract.
5. **Name rules:** trim; 2–20 chars; letters (any script), digits, space, `_`, `-`; no leading/trailing space; not a
   reserved word (`owner`, `host`, `admin`, `server`, `bertopia`, `teacher`, `staff` and their lookalikes with
   digits/underscores); passes the existing chat word filter (reused from the moderation work); unique in the session
   (case-insensitive) — a duplicate gets a clear "name taken".
6. **Lifetime:** until **End session**, or **24 h with nobody connected**. **Rotate code**: new code at once; the old
   one fails from that moment; connected players stay (their socket is already accepted).
7. **Optional owner password** (off by default): a second field on the join screen; checked with the same limiter.
8. Version handshake: the join reply carries the server's game version (from `PKG_VERSION`); a client with a different
   version shows an **Update** card (icon + text, 9 languages) and does not connect.

Join errors (keys, shown as icon + text in 9 languages): `code`, `ended`, `password`, `name`, `name-taken`, `full`,
`slow-down` (backoff seconds), `version`, `adults` (confirm missing).

## 4. Owner flow

- **First run** (owner page on localhost): set a **PIN** (6+ digits). Stored as `scrypt(pin, salt)` (`node:crypto`,
  N=2¹⁵), never logged. The owner page is `http://127.0.0.1:8890/owner`, refused from any other address, and asks the
  PIN per browser session (cookie-less: a short-lived owner token in `sessionStorage`, limiter 5 tries / 10 min).
- The owner also **plays**: joining from the owner page mints a ticket with role **`owner`** (a home-only role, mapped
  to the Room's staff path so `staffCommand` and the claims "staff may edit anywhere" rule apply; see §5 on `cfg`).
- **Owner tools** (page + in-game, all through the Room's per-message role check `isStaff(role)` — no new bypass):

| Tool | Where | Reuses |
|---|---|---|
| Kick | page / in-game | `staffCommand kick` (exists) |
| Ban (this session) | page | new door list: `{ref, ipTag}` in memory; join and socket refused with `banned`; cleared at end of session |
| Freeze building | page / in-game | `staffCommand freeze` (exists) |
| Rollback by minutes | page | `undo.js` plan over the world's ops (`hub.undo({since, until})`) — the durable 7-day log, not the in-memory `makeEditLog` |
| Mute quick chat | page | `essentials.js` mute (exists, staff-only) |
| End session | page | invalidates the code, closes sockets `4006`, saves |
| Rotate code | page | §3 |
| Change ruleset | page / in-game rules card | §5 |
| Start / stop server, worlds, backups | page | PR #122 host menu |

## 5. Ruleset switcher

**What exists:** `bloxbert-src/src/rules.js` is a registry of 10 rules with 8-language labels/descriptions:
`core.break`, `core.place`, `core.craft`, `core.station.open`, `core.fly` (bool), `station.bench`, `station.oven`,
`station.woodshop` (bool), `survival.daynight` (cycle/day/night), `survival.energy` (off/calm/normal/fast). PvP today is a
**local preference** (`bloxbert-pvp` in localStorage, `paintPvpSettings`), and game mode (survival/creative) is per
session. The teacher editor `rules-editor.js` (`paintRules`) is gated by `teacherOn()`.

**Home rules are server-authoritative.** The server holds the active ruleset; `hello` carries it (`rules: {…}`); a
change is broadcast as `{t:'rules', r:{…}}` and every client shows a calm toast (icon + text: "Rules changed: Creative").
The server enforces what it can see: `core.break`/`core.place` on edits (refusal `rule`), `core.craft` and the
station rules on craft/station frames (home build sends them; today crafting is client-side, so part 3 adds a
server-checked `craft` frame under `__HOME_HOST__` only), PvP on hit frames, mode on fly/damage. The client still
applies the same rules locally for instant feedback, but the server's answer wins.

**Presets** (owner picks one, then may edit any rule in the existing editor):

| Preset | mode | break/place/craft/stations | fly | daynight | energy | PvP | keep stuff on death | home cfg id |
|---|---|---|---|---|---|---|---|---|
| **Same as school** | survival | all on | on | cycle | normal | off | yes | `home-school` |
| **Survival** (student default) | survival | all on | on | cycle | normal | off | yes | `home-survival` |
| **Creative** | creative | all on | on | day | off | off | yes | `home-creative` |
| **Peaceful** | survival | all on | on | cycle | calm | off | yes | `home-peaceful` |
| **PvP on** | survival | all on | on | cycle | normal | **on** | yes | `home-pvp` |
| **Hardcore** | survival | all on | on | cycle | fast | on | **no** | `home-hardcore` |

Two rules are **new** and home-only: `combat.pvp` (bool, def false) and `survival.keep` (bool, def true). They register
in `rules.js` under `__HOME_HOST__` with 8-language labels drafted for WordBot to review. "Same as school" is the
literal student defaults with the editor locked, so it is a true control for testing.

**Config ids:** the home set above is disjoint from the 7 school ids, so `isConfigId` at school refuses every home
ticket, and the home `claims.js` policy table gets its own rows (plots **off**, wild **on** by default — a home world
is shared, no plots; the owner can turn plots on).

## 6. Security and spam

| Area | Setting | Default | Where |
|---|---|---|---|
| Bind | `listen` address | `127.0.0.1` | `home.json`; "Let other computers join" switch = `0.0.0.0` with LAN notice |
| Beyond LAN | — | not offered | README: put a TLS reverse proxy in front; no auto-tunnelling |
| Origin | allowlist, exact strings, no wildcard | the host's own `http://<addr>:<port>` entries | `home.json`, checked on every upgrade |
| WS messages | `protocol.js` typing: version, exact keys, size cap, unknown type dropped | as school | unchanged |
| Join attempts | 5 / min per IP, then 10-min backoff; wrong code counts | | door limiter (`newBucket`) |
| Owner PIN | 5 tries / 10 min | | door |
| Connections per IP | 3 | | door (Room's own per-IP connect bucket stays) |
| Edits per player | `LIMITS`/`EDITS_PER_SEC` | as school | Room |
| Quick chat | 1 per 2 s, burst 3 | | Room (`essentials.js`) |
| Typed chat | **off**; if on: ≤200 chars, 1 per 2 s, word filter, owner mute, never written to disk | off | Room, home-only frame |
| Max players | 16 per session | | door; Room cap 30 stays above it |
| Logs | failure codes only; no codes/PINs/tokens/IPs | | `guard.js logFailure` unchanged; the door logs the same shape |
| Accounts | none; no emails | | |
| Version | join reply + hello carry the game version; mismatch → Update card | | door, client |
| Ban list | `{ref, ipTag}` in memory, per session | | door |

## 7. Feature parity

The home build is the student build plus the join screen and owner tools; nothing is removed. Survival/creative,
crafting, stations, conveyors, Woodshop and decor, Maker Pages, Bertodex, block painter and Default block, Bridge
Rush, mobs and reboots, saves, 8 languages + Simple, and every inclusion rule (44 px targets, focus rings, icon +
text, no colour-only meaning, reduced motion, no neon or white flash) stay as they are because they are the same
code. The 2-client play check (part 4) runs the student smoke checks against the home build at 1366 and 412.

Multiplayer scope follows the class-server plan: block edits server-authoritative (ops), positions ~5 Hz
(snapshots), mobs local, boss events synced (home-only `event` frame in part 4, same shape the class plan names).

## 8. Known couplings (from the 2.5.596 review) and what is done about each

| Coupling | Home handling |
|---|---|
| `classnet/config.js` `safeUrl` allows only `*.kulibert.net` (wss/https); localhost only with `bt-class-dev` | Under `__HOME_HOST__` `endpoints()` returns `{ws, join}` from the join screen; `ws://` accepted only for `127.0.0.1`, `localhost` and RFC 1918 addresses; `wss://` for anything else. School path unchanged. |
| Worker `originAllowed` / `REQUIRE_TLS` | The home door reads `origins` and `tls` from `home.json`, not `.dev.vars`. |
| Storage is per origin (worlds on apps.kulibert.net don't appear at home) | **World export/import** as a file through the existing save path (`backups.js` already exports a world; import is the "Load my saved world" path with a file picker, home-only). Server-side worlds are separate SQLite files. |
| Ports | 8890 default; the forbidden list above is rejected by the config loader. |
| Runtime | plain Node (§1); persistence is SQLite with WAL, checkpointed on close. |
| `sw.js` | The home `index.html` is served with the game version stamped into `sw.js`'s cache name and `app.js?v=`; the server sends `Cache-Control: no-store` for `index.html`. |

## 9. Reused vs new

| Reused unchanged (school) | New (home only) |
|---|---|
| `src/room.js`, `src/world-do.js`, `src/world/*` (hub, world, chunks, fanout, alloc, undo, sim, items) | `host/home.mjs` (process, config, owner page API, session), `host/door.mjs` (join, codes, PIN, limiters, bans) |
| `src/protocol.js`, `src/guard.js`, `src/rules.js`, `src/editlog.js`, `src/claims.js` (+ home policy rows) | `host/runtime.mjs` (from #122), `host/owner.html`, home `index.html` |
| `src/token.js` (+ optional `iss`) | client: join screen, `homeOwnerOn()`, rules sync, Update card, export/import, `tools/home-leak-check.mjs` |
| `src/essentials.js` (mute, quick chat) | 2 new rules, home presets, home cfg ids |

PR #122 (local host part 1) is the runtime and the owner-page skeleton; its player codes, port and school cfg ids
are replaced by this design. Suggest: keep #122 open as the base branch for part 1 below, or close it once part 1
lands (ManagerBot's call).

## 10. Build parts (max 3 fixes each, each with a check script)

| Part | Fixes | Check script | main.js touches (for BERTOPIA MAIN CODER) |
|---|---|---|---|
| **1. Door + session** | (1) `host/door.mjs`: session code, name rules, 18+, limiters, bans, home ticket (`iss`); (2) `token.js` optional `iss`, home cfg ids + claims rows; (3) `host/home.mjs` owner page: PIN, start/end/rotate, players, kick/ban/freeze/mute | `tools/home-join-check.mjs`: codes unique over 10⁵ draws, alphabet, expiry on end and 24 h idle, rotate (old fails, connected stay), brute force → backoff, school ticket refused at home, home ticket refused by `verifyToken` | none |
| **2. Home build + client join** | (1) `build.mjs --home` + `__HOME_HOST__`, home `index.html`, `sw.js` stamp; (2) join screen + `classnet/config.js` home endpoints, `server-sync`/sign-in/kw-test off, save chip; (3) `homeOwnerOn()` + owner tools in game, Update card | `tools/home-leak-check.mjs` (school bundles clean) + `tools/home-build-check.mjs` (home bundle joins a local door, hello received) | `main.js`: `classnet` endpoint read, `teacherOn()\|\|staffOn()` rules-card gate `+ homeOwnerOn()`, save-chip source, boot (join screen before world load), all under `__HOME_HOST__` — listed line by line in the PR |
| **3. Rulesets** | (1) server-held ruleset, `hello.rules`, `rules` broadcast, toast; (2) server enforcement (edits, craft/station frame, PvP hit, fly/damage); (3) presets + 2 new rules + owner editor via `paintRules` | `tools/home-rules-check.mjs`: each preset's enforcement on a fake client that ignores rules; mid-session switch reaches 2 clients; "Same as school" equals student defaults | `main.js`: apply `hello.rules`, `rules` frame handler, PvP/keep hooks — under `__HOME_HOST__` |
| **4. Spam + play** | (1) typed chat (off) + limits + filter; (2) boss `event` frame, export/import; (3) README (18+, LAN, TLS note) | `tools/home-spam-check.mjs` (every limit in §6 trips and recovers) + `tools/home-play-check.mjs` (2 real clients at 1366 and 412: join, build, see each other, rules toast, Update card, inclusion checks) | `main.js`: chat input (home), event frame, import picker — under `__HOME_HOST__` |

Each part: its own branch (`feat/bertopia-home-host-p1` …), merge main in, no rebase, no version stamp unless
ManagerBot locks one, PR report in the body, `npm test` green plus the part's check script.

## 11. Open questions (answer in the GO)

1. **Doc folder:** this doc is at `docs/bertopia/HOME-HOST.md` as the brief says; the other Bertopia docs live in
   `blocks/docs/`. Keep here, or move?
2. The brief cites `blocks/docs/BERTOPIA-HOME-HOSTING-RISKS.md`; it is not on `main`. If it is on a branch, name it
   and I will fold anything missing into §8.
3. `survival.keep` (keep stuff on death) is a new rule the game does not have a hook for yet; Hardcore depends on it.
   OK to add the hook in part 3, or make Hardcore "fast energy + PvP" only until the hook exists?
4. Owner in-game role maps to the Room's staff path (so kick/freeze/mute work with zero new server code). Confirm
   that is acceptable, or ask for a distinct `owner` branch in `staffCommand`.
5. Max players 16, port 8890, data in `~/Documents/Bertopia Home`: confirm or change.
