Bertopia 2.5.497 — Class server wiring, Part 1 of 9: the dark gate
Goal: a switch that is OFF in every build and makes the game do nothing about the class server: no code path, no request, no button.
Pull --rebase first, no force-push. Folder: bloxbert-src/.
VERSION STAMP: Debugzy locks 2.5.497; never pick or lower it. Stamp the sites the last Bertopia ship stamped. Internal changelog line only; no What's new (kids see nothing) unless a part says so.
RULES: nothing deploys; no Cloudflare calls; no secrets in code, commits, chat or docs; single player never opens a socket; the feature stays OFF until Diego says go.
OUT OF SCOPE: sockets, tickets, drawing, menus, strings. Other apps. server/class-room/.

FIX 1 — src/classnet/config.js (new, pure, no imports).
export const CLASS_SERVER = false, CLASS_WS_URL = '', CLASS_TICKET_URL = '', CLASS_STATUS_URL = '' (all four are build constants; the three URLs stay empty until Diego's go).
export function safeUrl(u, scheme): true only if the string parses, protocol is exactly scheme ('wss:' for the socket, 'https:' for ticket and status), host is kulibert.net or ends with '.kulibert.net', and there is no username, password, query or hash.
export function pick(cfg, loc, store): returns null or { ws, ticket, status }.
- Production: cfg.flag === true and all three URLs pass safeUrl: return them.
- Local rehearsal: loc.hostname is 'localhost' or '127.0.0.1' and store.getItem('bt-class-dev') === '1': return { ws:'ws://localhost:8787/rt/ws', ticket:'http://localhost:8788/ticket', status:'http://localhost:8788/status' }. The dev flag is ignored on any other host.
- Anything else, or any exception: null. pick never throws.
export function endpoints() { return pick({ flag: CLASS_SERVER, ws: CLASS_WS_URL, ticket: CLASS_TICKET_URL, status: CLASS_STATUS_URL }, location, localStorage) } inside try/catch returning null.

FIX 2 — tools/classnet-gate-check.mjs (new). Before importing config.js, replace globalThis.fetch, WebSocket, XMLHttpRequest, EventSource and navigator.sendBeacon with functions that record a call and throw. Then assert:
- pick with the real defaults returns null for apps.kulibert.net, for localhost without the dev flag, and for apps.kulibert.net WITH the dev flag.
- localhost with the dev flag returns the three local URLs.
- With flag true and good URLs (wss://class.kulibert.net/rt/ws, https://class.kulibert.net/ticket, https://class.kulibert.net/status) pick returns them; with flag false it returns null.
- safeUrl refuses: ws:// for the socket, http:// for ticket, wss://evil.example/rt/ws, wss://class.kulibert.net.evil.example/, wss://class.kulibert.net/rt/ws?x=1, wss://user:pw@rt.kulibert.net/, a non-string, empty string.
- Zero calls were recorded on the stubs. Print "classnet gate ok" and exit 0; any failure exits 1.

FIX 3 — tools/classnet-all.mjs (new runner) + package.json + FIX-LIST.md. The runner lists tools/classnet-*-check.mjs in sorted order, runs each with process.execPath via spawnSync, prints each name and result, and exits non-zero on the first failure. It must find at least 1 check or it fails. package.json: add `&& node tools/classnet-all.mjs` to the end of the "test" script (this is the ONLY package.json edit in the whole class-server work; later checks are picked up by name). blocks/FIX-LIST.md: tick [x] `cs-gate` with the version and sha.

ACCEPT
1. `node tools/classnet-gate-check.mjs` prints "classnet gate ok".
2. `npm test` passes with the classnet runner at the end. Add a throwaway tools/classnet-zz-check.mjs that exits 1: npm test fails. Delete it.
3. Build the test door, open it on a localhost server with DevTools network open for 60 s of play: 0 requests to any URL containing /rt/, /ticket or /status; 0 WebSocket connections.
4. `grep -rn "new WebSocket" src/` finds nothing yet (the socket arrives in Part 2).
5. Student door output (blocks/) contains no 'bt-class-dev' string outside config.js's own text and no button or string about a class world.

Commit author: trebiluk <6373031+trebiluk@users.noreply.github.com>
Push to GitHub main and reply with the commit sha
```

---

