# Bertopia personal host (adults 18+, non-school)

**This server is for adults, 18 and over.** It is a way for grown-ups to share a Bertopia world with people they know,
and to test the current build. It is not the school class server and has nothing to do with student accounts:
no sign-in, no TechWorks, no school tickets. Design: `docs/bertopia/HOME-HOST.md`.

## Start
```
cd server/class-room
npm run home            # owner page opens in your browser (this PC only)
```
Options after `--`: `--port 8890`, `--data <folder>`, `--lan` (let other computers on your network join).
Data (worlds, backups, `home.json`) lives in `Documents/Bertopia Home` unless `--data` says otherwise.
Needs Node 22 or newer. Nothing is installed; no internet is needed.

## First run
The owner page asks you to choose a **PIN** (6 to 12 digits). It is stored hashed and never shown or logged.
You need it every time you open the owner page; five wrong tries lock it for ten minutes.

## A session
1. Create or open a world (8 to 40 letters, digits, `-`, `_`).
2. Pick rules (Same as school, Survival, Creative, Peaceful, PvP on, Hardcore) and, if you like, a password.
3. **Start session**. You get an 8-character **session code**. Copy it for your players; hide it when you are done.
   Codes use no 0/O/1/I/L, are never reused, and stop working when you end the session, rotate the code, or
   after 24 hours with nobody in.
4. Press **Play as owner** so the world opens, then players join at the address shown with the code and a display
   name (2 to 20 letters, digits, space, `_`, `-`; no "owner"/"host" lookalikes; a word filter applies).
   Every player confirms once that they are 18 or older. Nothing about age is stored.

Owner tools: kick, ban (name + address, this session only), freeze building, undo the last N minutes (everyone or one
player), mute (takes effect when chat lands), rotate code, end session, change rules (live switching comes in part 3).

## Letting other computers join
Off by default: the server binds `127.0.0.1`. Turn on **Let other computers join** and restart; the owner page then
shows the address for your network. **Do not expose this port to the internet.** If you ever must, put a TLS reverse
proxy (Caddy, nginx) in front and keep the port closed on the router; the host does no tunnelling of its own.

## What is kept, what is not
- Kept on disk: `home.json` (the home secret, your PIN hash, settings, the hashes of past codes), worlds, backups.
- Never kept: display names of players (they live for the session), addresses (hashed, in memory, for bans and
  limits only), codes in clear, PINs, tokens, chat.
- The school's secret and tickets are never read, used or accepted here; home tickets are refused at school.

## Checks
`npm run test:home` runs the pure join check (codes, names, limits, bans, PIN, school/home separation) and the live
check (a real host over HTTP and WebSockets: first run, session, players, owner tools, restart).
