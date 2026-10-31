# Bertopia class room server (Phase 0: presence only)

**Standalone. Not wired into the game. Not deployed.** Nothing in `bloxbert-src` changes. Design by Claude; Debugzy gates and builds.

One Cloudflare Durable Object per room. Up to 30 kids (plus up to 4 staff sockets). Each kid sees the others' **alias nameplates and positions at about 5 Hz**. No typed text, no names, no block edits, no inventory (those are Phase 1+).

## The rules this package enforces
1. **Single player is not a server world.** It never opens a socket. It saves to the kid's alias account and/or the Chromebook only. (Game-side rule, see section "Game-side requirements".) The server has no frame for saving or loading a world, so it cannot be used as a save slot.
2. **Opening a world file that is not in the system** shows the "I am responsible for this file" warning, which the kid must accept first. (Game-side. The server never receives world files.)
3. **No kid-hosted worlds.** Kids cannot create, host or invite friends to a world. No realms. **Only teachers/staff create server worlds, from the 7 configs:**

| id | World |
|---|---|
| `solvay` | all Solvay kids, school-wide, long-lived |
| `semester` | grade 6-8 groups, resets each semester |
| `period` | one per class period, teacher work assignments |
| `game` | kit rules, PvP opt-in |
| `loot` | loot and boss focus, cosmetic drops only |
| `contest` | creative flat, plots, contest tools (open/close, theme, judging, podium), strong grief prevention |
| `seed` | teacher-picked custom seed and preset |

Phase 0 only carries the config id (a ticket without one of these seven is refused). What each config does (kit rules, resets, contest tools) is later-phase game logic.

### What a kid cannot do (all proven by tests)
- Make a room: a room is closed to kids until a staff ticket (signed by TechWorks after a staff passkey sign-in) joins it, and closed again after a restart.
- Pick a room, a role or a config: all three come from the signed ticket. A client cannot send them.
- Create, host, invite, join by code, share, upload or save a world, or open a realm: there is **no message type** for any of it. Sending one closes the connection.
- Send text of any kind (chat, signs, names): same.
- Use staff powers (freeze, kick, open, close, rollback): the connection is closed and a strike recorded.

## Layout
```
src/protocol.js   constants, alias rules, strict frame parser, config ids, rate bucket (pure)
src/token.js      join ticket sign/verify (Web Crypto HMAC-SHA256)
src/rules.js      server authority checks: move (wired), reach/edit/inventory (ready for Phase 1)
src/guard.js      strike/kick/temp-ban ladder, failure log
src/essentials.js everyday commands: spawn, home, quick-chat, staff warps/mute/announce/kit (NOT WIRED)
src/claims.js     plots + protected zones, per-config edit policy (NOT WIRED)
src/editlog.js    edit log for rollback (NOT WIRED)
docs/ESSENTIALS-AND-CLAIMS.md  design, decisions needed, wiring plan
src/room.js       the Durable Object (one room)
src/worker.js     the door: TLS, origin, ticket, config, then the room
test/             unit + in-process simulation (fake sockets, fake clock)
tools/load30.mjs  30 fake clients, real WebSockets (needs `wrangler dev` + `ws`)
tools/abuse.mjs   the attack script, real WebSockets: every attack must be rejected
SECURITY.md       the security design, ticket contract for TechWorks, Cloudflare WAF suggestions
```

## Wire protocol (v0)
Client to server (all carry `"v":0`, exact keys, max 128 chars):
| Frame | Who |
|---|---|
| `{"v":0,"t":"p","q":17,"x":1.2,"y":64,"z":-3.4,"r":90,"f":0}` position; `q` must go up each time | everyone |
| `{"v":0,"t":"ping","n":7}` | everyone |
| `{"v":0,"t":"st","a":"kick","i":4}` / `"freeze","on":1` / `"open"` / `"close"` / `"rollback"` | teacher, admin only |

Server to client: `hello` (your id, role, the others), `join`, `leave`, `s` (snapshot: changed players only, never your own, full resync every 5 s), `pong`, `fix` (go back to this spot), `frz`, `ok`, `err`, `full`.
Close codes: 4001 full, 4002 replaced by a second tab, 4003 abuse (flood or repeated speed hacks), 4004 idle 45 s, 4005 bad/unknown/replayed/not-allowed frame, 4006 kicked by staff.
HTTP refusals before the socket opens: 401 bad or replayed ticket, 403 wrong origin / not https / room closed / wrong config / banned, 426 not a websocket, 429 too many joins from one address, 503 no secret configured.

## Privacy design
Aliases only. The opaque `ref` is never sent to clients and never logged. IPs are hashed in the Worker to a 16-hex tag used only for in-memory limits; the address is not forwarded. Nothing is stored (`ctx.storage` and alarms are never used). Failure log lines hold a code, an alias and a time. No analytics, no third-party scripts. The real name stays in TechWorks.
Still needed before any deploy: Diego's answer on Cloudflare (Q2), the district's written OK for alias-keyed data on this account, and the breach plan.

## Run locally
```
npm install                    # wrangler, ws
cp .dev.vars.example .dev.vars # local secret and origin only
npm test                       # unit + simulation, no network
npm run dev                    # terminal 1
ROOM_JOIN_SECRET=<value from .dev.vars> npm run test:load    # terminal 2
ROOM_JOIN_SECRET=<value from .dev.vars> npm run test:abuse
```

## Game-side requirements (specs for a later Build paste; NOT built; bloxbert-src untouched)
Words, not code. Every on-screen string in 8 languages + Simple; keyboard and touch; no meaning by color alone; no flashing; Reduced motion honored.

**A. Single player is not a server world.**
- Single player never opens a socket to `/rt/`. Its save goes to the kid's alias account (the existing `?sync=1` backup path, under the same district conditions) and/or the Chromebook (IndexedDB) only.
- The server-worlds list shows only staff-made worlds. Losing the connection drops the kid to single player and keeps their work.
- Countable check: play single player with the network blocked for 2 minutes; the page makes 0 requests to `/rt/` and the world still saves and reloads.

**B. "I am responsible for this file" warning.**
- Applies when a kid opens a world file that is not already in the system (not in their alias account's saves and not in this Chromebook's save list), by file picker, drag-and-drop or link.
- A dialog appears before any chunk is read into the game. Title: "Open this file?" Body (English): "This file did not come from Bertopia. I am responsible for this file. It may break your game." Buttons: "I am responsible for this file. Open it" and "Cancel". Simple version: "This file is not from Bertopia. It may break your game. You are responsible for it."
- Keyboard: focus goes to **Cancel** first, Tab cycles inside the dialog, Esc cancels. Touch targets at least 44 px. The warning uses an icon and words, never color alone. Role: alert dialog.
- Accepting opens the file as a **single-player local copy only**. It is never uploaded to a server world, never published, and never joins a class room. The file name is not sent anywhere.
- Open question for Debugzy: size limit and schema check before loading (suggested, not decided).
- Countable check: pick an unknown file; the dialog shows before anything loads; Cancel loads 0 chunks; accepting loads it as a local single-player world; a world already in the system opens with no dialog.

**C. No kid-hosted worlds.**
- For kids there is no Create, Host, Invite, Share-world, Realm or join-by-code control anywhere in the game, help text or menus. Only teachers/staff (staff passkey sign-in on TechWorks) create a server world and pick one of the 7 configs. Kids join a staff-made world from their class list.
- Countable check: search the kid build's strings and UI for host/invite/realm/create-world: 0 matches for the kid role. Server side: `npm run test:abuse` shows all world-making messages closed.

## Local dev (wrangler)
1. `cp .dev.vars.example .dev.vars` and fill in your own local values (never commit `.dev.vars`).
2. Run:
   ```
   npx wrangler dev --local --port 8787 --local-upstream 127.0.0.1:8787
   ```
   `--local-upstream` is required. Without it wrangler routes requests to the custom domain from `wrangler.toml`, so the origin check fails and every socket gets `403 origin`.
3. Load test (in a second terminal), with `ROOM_JOIN_SECRET` set to the same value as in your `.dev.vars`:
   ```
   ROOM_JOIN_SECRET=<same-as-.dev.vars> npm run test:load -- --seconds=60
   ```
