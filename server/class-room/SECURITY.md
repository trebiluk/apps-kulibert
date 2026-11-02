# Room server: security design (Phase 0, standalone)

Status: **not deployed, not wired into the game.** Debugzy gates it. Nothing here is a district approval.

## 1. Transport
- **WSS only**, through Cloudflare. TLS is Cloudflare's. This package has **no custom crypto and no homemade encryption**. The only crypto is HMAC-SHA256 from Web Crypto (`crypto.subtle`), used to verify the join ticket, and SHA-256 to make a one-way IP tag.
- The Worker refuses a socket that did not arrive over https/wss (`REQUIRE_TLS`, default on; only `.dev.vars` turns it off for local `ws://` tests).
- Browser `Origin` must be exactly `https://apps.kulibert.net`.
- The ticket rides in the `Sec-WebSocket-Protocol` header, never in the URL, so it is not in URL logs.

## 2. Messages
Small typed JSON, version number on every client message (`"v":0`). Exact key sets per type (`protocol.js`).
Anything malformed, oversized (>128 chars), binary, unknown type, extra key, wrong version, out-of-order sequence, or not allowed for the sender's role **gets one short error code and the connection is closed (4005)** and one strike is recorded.
A compact binary format is not built: JSON at 5 Hz is about 3.6 KB/s per kid (measured in-process), well inside the 8 KB/s budget. Revisit only if the Chromebook test says otherwise.

There is **no message** for: text, creating a world, hosting, inviting, joining by code, uploading or saving a world file, or realms. A kid who sends one is dropped. The test lists below prove this.

## 3. Who can do what
| Who | Ticket role | Can |
|---|---|---|
| Kid | `kid` | send position and ping. Join only a room that staff already opened, with the same config id. |
| Teacher | `teacher` | everything a kid can, plus **kick** (kids only), **freeze**, **open**, **close** in the room named by their ticket. Does not count toward the 30 (up to 4 staff sockets). |
| Admin | `admin` | teacher powers, plus kick staff and **rollback** (refused in Phase 0: nothing is stored, so there is nothing to roll back). |

- **Only staff create server worlds**, from the 7 configs: `solvay`, `semester`, `period`, `game`, `loot`, `contest`, `seed`. A room is closed to kids until a staff ticket joins, and is closed again after a restart (fails closed). A ticket whose `cfg` is not one of the seven is refused at the Worker.
- **Staff use the existing passkeys.** TechWorks verifies the passkey sign-in and only then mints a staff ticket with `amr:["passkey"]`. The Worker refuses a staff ticket without it. There are no passwords on the wire, anywhere.
- **Per-world role check:** the role, room id and config are inside the same signature, so a ticket cannot be moved to another world or promoted. The room checks the role again on every staff command.

## 4. Join ticket (issued by TechWorks, standard HMAC, keys in Cloudflare secrets only)
`base64url(JSON claims) . base64url(HMAC-SHA256(secret, first part))`
Claims (any other claim name is refused, so no name or email can ride along):

| Claim | Meaning |
|---|---|
| `v` | 1 |
| `ref` | opaque random kid id (never the alias, never an email). Never sent to other clients, never logged. |
| `room` | opaque room id |
| `alias` | the Hub alias (picked or generated) |
| `exp` | unix seconds. Kid tickets: at most **120 s** ahead. Staff: at most **300 s**. |
| `jti` | opaque one-time id. The room refuses a ticket it has already seen. |
| `role` | `kid` / `teacher` / `admin` |
| `amr` | staff only: must include `"passkey"` |
| `cfg` | one of the 7 config ids |

TechWorks must: check the kid is on the roster for that world; mint a new ticket for every connection (reconnect = new ticket); never put a real name or email in any claim; keep the secret only in its own secret store.
Secrets: `wrangler secret put ROOM_JOIN_SECRET` (32+ random bytes). Rotation: put the old value in `ROOM_JOIN_SECRET_PREV`, deploy the new one to both sides, wait 10 minutes, delete `PREV`. Secrets shorter than 16 characters are rejected. No secret in code, git, chat or docs.

## 4b. Master Control's staff controls (part 2, Nov 1)
`apps.kulibert.net/master-control/` drives the class server over JSON POSTs from an allowed origin:
- `POST /rt/staff/login {pass}` → the password's SHA-256 is compared (constant time) to the `STAFF_PASS_HASH` secret;
  5 wrong tries per address tag then a 10-minute wait; success mints a **control ticket**: the same HMAC ticket as
  §4 with `role admin`, `amr ["passkey"]`, `room "mc-control-room"` (no Room has that id), alias "Master Control",
  **300 s**. It is kept in the page's memory only.
- `POST /rt/control/<action>` with `Authorization: Bearer <control ticket>`: `state` (switches + live rooms),
  `open {on}` (multiplayer: off = kid sockets refused 503 at the Worker, staff still get in), `chat {on}`,
  `freeze {room,on}`, `kick {room,alias}`, `rollback {room,minutes}` (the room's whole world, through the World's
  undo). A staff *game* ticket is not a control ticket (wrong room id) and is refused.
- The `Control` Durable Object (one, `main`) keeps: the two switches, the live-room registry (room id, world id,
  kid and staff **counts**, frozen flag, last report time — rooms report on join/leave/freeze and are dropped after
  10 quiet minutes), and the login counters by address tag. No aliases, refs, addresses or text are ever stored.
- CORS: only the allowed origins; preflight answered; bodies capped at 4 KB.

## 5. The server is the boss
| Check | Phase 0 | Rule |
|---|---|---|
| Move | **wired** | speed (20 b/s horizontal, 14 up, 80 down, plus 4 blocks slack), world bounds, height -128..512. A bad move is not applied; the client gets `{"t":"fix"}` and must go back. 5 bad moves in 10 s = kick. |
| Reach | written + tested, **not wired** | block must be within 6 (+0.5) blocks of the server's own copy of the player position |
| Block edit | written + tested, **not wired** | shape, bounds, known block id, reach |
| Inventory | written + tested, **not wired** | the server holds the inventory; the client only asks; no negative counts, stack cap, known ids |

Phase 0 has no edits or inventory, so those three are ready for Phase 1, not live. All numbers are first guesses to tune from play data. Known gap for Phase 1: respawn, portals and any scripted teleport need a server-owned teleport event; until then they would be snapped back.

## 6. Rate limits, kicks, bans
- Per socket: 12 messages/s token bucket. Excess frames are thrown away; 30 refused frames in a 10 s window = kick (4003).
- Per IP (hashed tag, memory only): 400 messages/s over all sockets from that address, and 60 join attempts burst + 1/s. A whole class shares one school IP (30 kids x 12 = 360 < 400), so IP limits **slow, they never ban**.
- Ladder: a hard offence drops the connection and records a strike on the kid's opaque ref. **3 strikes in 10 minutes = temporary ban** (10 min, then 1 h at most on repeat). Bans are per kid, never per IP.
- Strikes, bans, used ticket ids and the open flag are in memory only (nothing is stored). If the room object is evicted (empty room), they are forgotten. A replayed ticket after an eviction is limited by the 120 s lifetime. Cloudflare's rate limiting (below) is the second layer.

## 7. Failure log
Each failure writes one line: `{"ev":"fail","code":"replay","alias":"Test Pup 01","ts":1792954746}` (fixed code, alias or null, unix seconds). Never an IP, ref, ticket, message body or name. Tickets that fail before the alias is trusted log `alias:null`.
**Persistence is off** (`[observability] enabled = false`): lines only show in `wrangler tail`. Keeping them is alias-keyed student data, so it needs Diego's yes and the district's written OK first. If turned on, also set `invocation_logs = false` (request logs carry IPs).

## 8. Cloudflare in front (account settings, not code, nothing is applied by this package)
Suggested for Debugzy/Diego to set when Q2 and the district OK are done. Plan features vary; check what the account has.
1. **WAF custom rule, block:** `http.request.uri.path starts_with "/rt/" and not (http.request.method eq "GET")`
2. **WAF custom rule, block:** `http.request.uri.path eq "/rt/ws" and not (http.request.headers["origin"][0] eq "https://apps.kulibert.net")`
3. **Rate limiting rule** on `/rt/ws`: per IP, generous (a class shares one IP; start near 100 requests per 10 s), action block for 1 minute. Tune from the first real class.
4. **Bot rules:** block "definitely automated" on `/rt/*`. Do **not** use interactive challenges on `/rt/ws`; a WebSocket cannot solve them.
5. Always Use HTTPS, TLS 1.2 minimum, HSTS on the zone.

## 9. Tests (all fake data, no student data)
| Command | Proves | Run here? |
|---|---|---|
| `npm run test:unit` | frame parser, tickets, rules, ladder, log shape (23 tests) | yes, pass |
| `npm run test:sim` | the real Room and Worker with fake sockets and a fake clock (31 tests) | yes, pass |
| `npm run test:load` | 30 fake clients over real WebSockets against `wrangler dev` | **no** (npm registry blocked here); ran only through an in-process stand-in for `ws` |
| `npm run test:abuse` | fake tickets (20 kinds), replayed ticket, replayed messages, 22 bad/unknown/world-making messages, staff powers from a kid, speed hacks, floods, repeat offender ban, connection hammering | **no** against `wrangler dev`; ran through the same in-process stand-in: all attacks rejected. Five deliberate bugs (no replay check, no sequence check, no role check, no speed check, no origin check) were each caught. |
