# Berty's Run FIX-LIST
Read this first on every Berty's Run ship. In the same commit, tick `[x]` on each item you finished, and put your version and sha next to it. Proof updates "Live now" and the changelog. Docs only: no app code.
Built Sun Oct 4 2026, 6:55 AM ET from Debugzy's fixq briefs and proof RESULTs; it may lag anything shipped after them.

## 1. Live now
- Live title: **Berty&#x27;s Run** (`/berty-run/` on apps.kulibert.net).
- Latest proof on file: `proof/bertysrun-1.12.17/RESULT.md`: PASS — BR 1.12.17

## 2. Open fixes (FAIL rows from the latest proof)
- [ ] 3 ☰ Close clear of the timer bar · PASS. The HUD header goes `visibility:hidden` while the drawer is open. Close is 76×44 ("✕ Close") at frame y8. Its centre, all 4 corners and all 44 rows hit Close, 

## 3. Next up: open briefs in version order (tick when shipped AND proven)
- [ ] `briefs/fixq/bertysrun-1217b.md`: Berty's Run BR 1.12.18: FIX FIRST, part 2: sideways cards fit, Full screen comes off Jump, and the after-par tip shows. Only these 3 items.
- [ ] `briefs/fixq/bertysrun-1217c.md`: Berty's Run BR 1.12.19: FIX FIRST, part 3 (the small P2 list): dead bits removed, every line translated, and phone fit and contrast. Only these 3 item…
- [ ] `briefs/fixq/bertysrun-1217d.md`: Berty's Run BR 1.12.20: Class sets from the teacher, skins that recolour Berty, and stickers and Teal/Cyan/Blue looks. Only these 3 items.
- [ ] `briefs/fixq/bertysrun-1217e.md`: Berty's Run BR 1.12.21: Three zones, part 1: each 2D board gets its zone's backdrop, board look and start banner. Only these 3 items.
- [ ] `briefs/fixq/bertysrun-1217f.md`: Berty's Run BR 1.12.22: Three zones, part 2: weather in each zone, night in Night Shift, and each zone's own music. Only these 3 items.
- [ ] `briefs/fixq/bertysrun-1217g.md`: Berty's Run BR 1.12.23: One combo meter, and real juice on pickups, boosts, hops and rings. Only these 3 items.
- [ ] `briefs/fixq/bertysrun-1217h.md`: Berty's Run BR 1.12.24: Gold chips to find, a cracked panel to break, and three power-ups. Only these 3 items.
- [ ] `briefs/fixq/bertysrun-1217i.md`: Berty's Run BR 1.12.25: A dust chase on each zone's last board, and 3 stars from 3 goals on every 2D board. Only these 3 items.
- [ ] `briefs/fixq/bertysrun-1226a.md`: Berty's Run BR 1.12.26: Level Maker 1/3: entry, 2D editor, 3D editor (E1–E3). Only these 3 items.
- [ ] `briefs/fixq/bertysrun-1226b.md`: Berty's Run BR 1.12.27: Level Maker, part 2 of 3: test and par, share by code, rules for made levels (E4–E6). Only these 3 items.
- [ ] `briefs/fixq/bertysrun-1226c.md`: Berty's Run BR 1.12.28: Level Maker, part 3 of 3: every Level Maker word in all 8 languages, the icon set and the Level Maker What's new (E7). Only th…
- [ ] `briefs/fixq/bertysrun-1229.md`: START NOTE: work in the trebiluk/berty-run repo. Build on BR 1.12.28 (bertysrun-1226a–1226c: the Level Maker, BR 1.12.26–1.12.28) and BR 1.12.20–1.12.…
- [ ] `briefs/fixq/bertysrun-1213-FRESH.md`: NEW CHAT NOTE: the previous Berty's Run Build chat ran out of room (couldn't summarize). This is a fresh start. Work in the trebiluk/berty-run repo, s…
- [ ] `briefs/fixq/hiscore-run.md`: PAUSED by Diego (7:46 PM, Bertopia first). Don't paste until Diego unpauses Berty's Run.
- [ ] `briefs/fixq/menu-berty-run.md`: Berty’s Run — same Hub menu

Already shipped (version at or below live):
- [x] `briefs/fixq/bertysrun-1215-music-bolt-tunnel.md`: START NOTE: work in the trebiluk/berty-run repo, starting from main at 17b1437 (BR 1.12.13, live and check.sh MATCH). If BR 1.12.14 ("picking your PC … (version ≤ live/proven 1.12.17)
- [x] `briefs/fixq/bertysrun-next.md`: Berty's Run BR 1.12.13: taps on phones press only what you tap, ☰ Menu opens the game menu, and the sideways and upright phone views are comfortable (… (version ≤ live/proven 1.12.17)
- [x] `briefs/fixq/bertysrun-1214-goal-continue.md`: Berty's Run BR 1.12.14: picking your PC takes you straight into the level (P1, one small fix, follow-up to 1.12.13). Please keep it to this item and d… (version ≤ live/proven 1.12.17)
- [x] `briefs/fixq/bertysrun-1214-title-crash.md`: Berty's Run BR 1.12.14: the classic look crashes the title screen ("Something went wrong · access is not defined"), and the What's new line shows ☀ in… (version ≤ live/proven 1.12.17)
- [x] `briefs/fixq/bertysrun-1216.md`: START NOTE: work in the trebiluk/berty-run repo. Build on BR 1.12.15 (source 9affb19; lightning-bolt exit, one audio engine with per-world loops, Bus … (version ≤ live/proven 1.12.17)
- [x] `briefs/fixq/bertysrun-1217a.md`: Berty's Run BR 1.12.17: FIX FIRST, part 1: a board touch no longer rolls Berty, he stands on the Bus Tube floor, and ☰ Close clears the timer bar. Onl… (version ≤ live/proven 1.12.17)

## 4. Rules
- Every brief: 8 languages (en, uk, ru, es, ar, fa-AF, rw, ti), taps ≥44 px, ☰ top-left, phones equal to Chromebooks, and DONE only when its Accept passes on a fresh page.
- Commit author: trebiluk <6373031+trebiluk@users.noreply.github.com>. Push to main and reply with the sha.

## 5. Proof changelog
- `bertysrun-1.12.17`: PASS — BR 1.12.17
- `bertysrun-1.12.16`: Verdict: FAIL (P1)
- `berty-run-1.12.15`: Verdict: FAIL
- `berty-run-1.12.13`: Verdict: FAIL (P0). The arcade look passes; the classic look crashes.
- `br1128`: BR 1.12.8 live proof: result
- `br1127`: | Landscape Stage Clear shows Practice 2D/3D, Bus Tube and Levels | PASS (scroll, as in 1.12.5) | PASS | WARN | FAIL | At 915x412 `.win-more` is shown (24 Levels items) in a `.win-rest` scroll strip 42px tall (scrollHeig
- `br1126`: | 11 | 1.12.5 still passes (gear height, Retry, results tiles, Esports heat, reward line, clean gear, Menu top-left) | PASS | PASS | FAIL | FAIL | not run |
- `br-sweep-2026-10-03`: Berty's Run full sweep, Sat Oct 3 2026, 7:30–8:20 AM ET
