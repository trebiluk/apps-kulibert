# Bertopia personal host (adults 18+, non-school)

**This server is for adults, 18 and over.** It is a way for grown-ups to share a Bertopia world with people they know,
and to test the current build. It is not the school class server and has nothing to do with student accounts:
no sign-in, no TechWorks, no school tickets. Design: `docs/bertopia/HOME-HOST.md`.

## Start
```
cd bloxbert-src && npm ci && npm run build:home     # once per game version: builds ../bertopia-home
cd ../server/class-room
npm run home            # owner page opens in your browser (this PC only)
```
Options after `--`: `--port 8890`, `--data <folder>`, `--lan` (let other computers on your network join),
`--game <folder>` (a home build somewhere else).
Data (worlds, backups, `home.json`) lives in `Documents/Bertopia Home` unless `--data` says otherwise.
Needs Node 22 or newer. The host itself installs nothing and needs no internet. Without a home build, `/` shows a
plain join page instead of the game.

## Windows package (double-click, nothing to install)
```
cd bloxbert-src && npm ci && npm run build:home       # the game, once per version
cd ../server/class-room && npm run pack:windows       # -> dist/Bertopia-Home-Windows-<version>.zip
```
The zip carries the host, the home game build, an official portable Node (win-x64, SHA-256 checked against
nodejs.org) and a launcher. On the Windows PC: unpack it, double-click **Bertopia Home.cmd**; the owner page opens.
**Create desktop shortcut.cmd** adds an icon; **Open data folder.cmd** opens `Documents\Bertopia Home`. Your data never
lives in the package folder, so a newer package replaces the old folder and keeps your worlds. Options:
`--no-node` (use an installed Node 22.13+), `--node 22.x.y`, `--game <folder>`, `--out <folder>`. Without a home
game build the zip is marked `host-only` (players get the plain join page).

## First run
The owner page asks you to choose a **PIN** (6 to 12 digits). It is stored hashed and never shown or logged.
You need it every time you open the owner page. Five wrong tries lock it for ten minutes.

## A session
1. Create or open a world (8 to 40 letters, digits, `-`, `_`).
2. Pick rules (Same as school, Survival, Creative, Peaceful, PvP on, Hardcore) and, if you like, a password.
3. **Start session**. You get an 8-character **session code**. Copy it for your players; hide it when you are done.
   Codes use no 0/O/1/I/L, are never reused, and stop working when you end the session, rotate the code, or
   after 24 hours with nobody in.
4. Press **Play as owner** so the world opens, then players join at the address shown with the code and a display
   name (2 to 20 letters, digits, space, `_`, `-`; no "owner"/"host" lookalikes). There is no word filter.
   Every player confirms once that they are 18 or older. Nothing about age is stored.

Owner tools: kick, ban (name + address, this session only), freeze building, undo the last N minutes (everyone or one
player), mute (one player or everyone), rotate code, end session. Rules change live: pick another preset on the owner
page, or change single rules in the game (Play as owner → Rules). Everyone gets a short "Rules changed" note and the
server enforces the new rules at once. "Same as school" locks the game rules to the student defaults; world chat
and keep inventory can still be switched under it.

The host's own pages and messages are in English only. The game keeps all its languages.

## World chat
Regular server chat, **on** in every preset: everyone in the world sees every message, with the sender's display
name. There is **no word filter** (this server is for adults). Turn it off or on with **World chat** on the owner page
or the 💬 rule in the game. What stays, because it is about spam and safety rather than words:
- at most 200 characters; 5 messages at once, then 1 a second per player (a player who goes faster is told to wait);
- invisible characters that hide or flip text are removed;
- the owner can mute one player or everyone; muted players are told so;
- messages are passed on to the people in the world and **never written to disk or to the log**.

## Keep inventory
**On** in every preset. Two switches on the owner page:
- **Keep inventory** (Session): the whole world.
- **Keep stuff** (Players): one player, *Keep* or *Lose*, until you press **Use world** or the session ends. A player's
  own setting stays when you change the world's.

Each player's game is told its own value. Note: today nothing in Bertopia takes items away (running out of energy only
slows you down), so *Lose* has no effect yet; it is ready for when a faint or drop rule exists.

## Decay (survival)
Things age while you play survival (not while the game is closed or hidden; never in creative):
- **Food rots.** Berries go stale after about 10 minutes of play and rot after 20; cupcakes after 20/40; bread after
  30/60. Stale food gives half the energy (the bag shows a freshness bar and says *stale*). Fresh food added to a stack
  freshens it a little (the stack's age is the average).
- **Rotten food** can be eaten (a gamble: nothing, +1 energy, or −1 energy and slower for 20 s), thrown out (Drop),
  or used on a crop or bush as compost (it grows a quarter of the way at once).
- **The bag wears**: about 20% an hour with a full bag (10+ slots used), about 6% an hour with a light one. Every 20%
  tears one pocket slot (✂, and the slot says so); the 9 hotbar slots never tear. A torn slot keeps what is in it, but
  nothing new goes in. The Bag title shows wear and usable slots. A **Bag patch** (1 tan wool, craft list) mends 20%.

## Boss fights
Creatures run in each player's own game. When someone starts a Foundry Overseer fight, everyone else gets a note
("… started a Foundry Overseer fight. Come help!"), and another when it is over. One fight per world at a time. It ends
for everyone when the player who started it leaves, and is forgotten after 15 minutes with no news.

## World files
- **Download** (Worlds list) saves a world as one `.bertopia-world` file, the same copy a backup makes.
- **Import a world file** turns such a file into a **new** world. It never replaces a world that exists. A file must be
  a Bertopia world (the right tables, SQLite's own integrity check) and at most 256 MB; anything else is refused and
  deleted.
- In the game, Menu → World → **Export world file / Import world file** still moves your own single-player world
  between browsers, as at school. Worlds saved on apps.kulibert.net do not appear here by themselves: browsers keep
  each site's saves apart.

## Letting other computers join
Off by default: the server binds `127.0.0.1`. Turn on **Let other computers join** and restart; the owner page then
shows the address for your network (`http://192.168.x.x:8890/`). Plain `ws://` is accepted only for this PC and home
network addresses (192.168.x.x, 10.x.x.x, 172.16–31.x.x).

**Do not open this port to the internet.** If you ever must reach it from outside your home, put a TLS reverse proxy
on the **same PC** in front of it, keep port 8890 closed on the router, and add the public address to `origins` in
`home.json` (for example `"origins": ["https://bertopia.example.com"]`). The host trusts `X-Forwarded-For` and
`X-Forwarded-Proto` **only from this PC**, so limits, bans and `wss://` work through the proxy. The host does no
tunnelling of its own. Caddy:
```
bertopia.example.com {
  reverse_proxy 127.0.0.1:8890
}
```
nginx (inside a TLS `server` block):
```
location / {
  proxy_pass http://127.0.0.1:8890;
  proxy_http_version 1.1;
  proxy_set_header Upgrade $http_upgrade;
  proxy_set_header Connection "upgrade";
  proxy_set_header Host $host;
  proxy_set_header X-Forwarded-For $remote_addr;
  proxy_set_header X-Forwarded-Proto https;
}
```
The owner page answers only on this PC, never through the proxy's public address.

## Limits (all on by default)
5 join tries a minute per address, then 10 minutes' wait · owner PIN 5 tries, then 10 minutes · 3 connections per
address · 16 players · the school's own limits on edits and messages · world chat as above · 4 boss notes per 10 s per
player · request bodies 16 KB (world files 256 MB).

## What is kept, what is not
- Kept on disk: `home.json` (the home secret, your PIN hash, settings, the hashes of past codes), worlds, backups.
- Never kept: display names of players (they live for the session), addresses (hashed, in memory, for bans and
  limits only), codes in clear, PINs, tokens, chat messages.
- The school's secret and tickets are never read, used or accepted here; home tickets are refused at school.

## Checks
`npm run test:home` (in `server/class-room`) runs:
- `home-page-check`: the owner and join pages parse, and the owner sign-in is labelled and keyboard-ready;
- `home-join-check`: codes, names (format and lookalikes; no word filter), limits, bans, PIN, school/home separation;
- `home-owner-check`: a real host (first run, session, players, owner tools, restart);
- `home-rules-check`: presets, live switching, server enforcement;
- `home-fuzz-check`: junk requests and frames (no 5xx, the host stays up);
- `home-spam-check`: every limit above trips and then recovers; world chat; keep inventory (world and per player);
  boss notes; world files; the TLS proxy reply;
- in `bloxbert-src`, `npm run test:home`: the leak and build checks and `home-decay-check` (decay rules, the real bag
  with and without the home flag, and the home vs student game compile);
- `home-play-check`: two browser clients at 1366 and 412 (join, build, see each other, rules note, chat, keep inventory, boss notes,
  Update card, 44 px targets, focus rings). It runs the full game too when `bertopia-home/` has been built. It needs
  esbuild (`npm ci` in `bloxbert-src`) and Playwright, and says SKIP when they are missing.
