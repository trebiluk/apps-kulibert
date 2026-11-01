# Bertopia local host (non-school use)

Run the Bertopia class-room server on your own PC so family or friends on the same Wi-Fi can share one world.
It is the **same server code** the school uses (`src/`), with `host/runtime.mjs` standing in for Cloudflare.
No TechWorks sign-in: the host picks nicknames and hands out join codes. Nothing is installed and no internet is needed.

**Part 1 (this):** server, host menu, join page. **Part 2 (next):** the game itself connects, so blocks and avatars
are shared live. Until then the join page proves a device can get in and the host sees it online.

## Start (Windows)
Double-click `host/start-topia-host.cmd`. It needs Node 22 or newer (https://nodejs.org).
The host menu opens in your browser; keep the black window open while people play, close it to stop.
Worlds and backups go to `Documents\Bertopia Local`.

Any OS: `npm run host` in `server/class-room` (add `--data <folder>` or `--port <n>` after `--`).

## Host menu (this PC only)
- **Join address**: what players type on their phone, tablet or Chromebook (needs `--lan`, which the .cmd uses).
- **Worlds**: create (8+ letters, digits, `-`, `_`), open, back up, restore, close. One world is open at a time.
- **Players**: add a nickname (no real names) as *player* or *host*; each gets a 6-character join code. Kick, remove.
- **Live**: who is online, the last edits, and "who built this" for any block (7-day log, nicknames only).
- **Rules**: the same seven configs as school. `contest` (default) gives each player a plot and refuses edits on others'.
- **Locked**: only *host* players can join.

The menu works only from the host PC (`localhost`) and needs the key in its URL (printed at start, kept in `host.json`).

## How players join
Open the join address, type the code, press Join. A *host* player must be in the world before players can join
(same rule as school: a staff seat opens the world). Codes are keys: anyone with a code plays as that nickname.

## What is kept on disk (`--data`)
`host.json` (secret, host key, nicknames, refs, join codes, settings), `worlds/<name>.sqlite`, `backups/`.
No names, emails, IPs or device ids anywhere; the 7-day edit log holds hashed refs, shown as nicknames in the menu.

## Tests
`npm run test:host` starts a real host on a free port and drives it over HTTP and WebSockets (part of `npm test`).
