# Bertopia PULL LIST — until Tue Oct 27 6 AM ET (Debugzy)
Slow mode: one item per turn. Finish, ship, verify live, then pull your next.

Each item: `git pull` → read the file in `bloxbert-src/pull/` → if already done on main, check it off here and skip → else ship it.
Version: use ONLY the version written on your item; if none, post EMPTY and stop. Next free 2.5.x after the newest on main (git log). Never reuse/lower. No force-push.
Limit: ≤3 fixes, ≤5 files. Two failed tries = stop, write BLOCKED + why under your item.
Out of scope: deleting saves, save format, server deploy, chat, TechWorks.
DONE only when seen live on /bertopia/. Check your box here in the same commit.

## BILL
- [x] Commit your uncommitted menu polish as 2.5.488 (rebase on main first) — already shipped in 2.5.478 (148c895). Live /bertopia/ 2.5.487 still has menu-fit in read.css and app.js. Skipped a new version.
- [x] door-part4.md (menu dim, Entrar/Deshacer wrap, keys tip) — 2.5.495. Flat gray scrim, no blur. Entrar and Deshacer wrap at 412 (no overlap). Keys tip hides on first move or 8s, stays hidden, never on touch-only. Help says press ? .

## BOOBS
- [x] A-chiplane-1a.md (chip lane + priority/cap) — 2.5.489. Boss, saved, safe, and update share #chip-lane. Sideways phone check BLOCKED-rig.
- [x] A-chiplane-1b.md (only after 1a is live) — 2.5.491. Goal joins #chip-lane on big screens (prio 2); phones keep the bottom dock. Inspect prio 3. Held name was at the top (360 y=158, 915 y=68, 1366 y=68), so it joins prio 6. Sideways phone check BLOCKED-rig.
- [x] A-chiplane-1c.md (only after 1b is live, which it is: 2.5.491) — 2.5.496. Crew badges save in the world. The pop-up and Notebook list use your language.
- [ ] bertopia-berry-badge.md (berry bush empties on pick, wild bushes count, Berry Picker badge; What's new in all 8 languages, rw/ti/fa-AF machine drafts) — 2.5.498

## BASSFISH
- [x] door-part2.md (one-box held-item ghost) — 2.5.490
- [x] master-control-part1.md (staff Master Control page, view-only for all) — /master-control/ MC 1. No Bertopia game bump: 2.5.493 was already past (game is 2.5.495) and this brief does not change game files.
- [ ] classnet-part1.md (class server Part 1 of 9: the dark gate, CLASS_SERVER=false, no deploy, no Cloudflare) — 2.5.497

## BALLER
- [x] door-part3.md (Bed text, ×n, wood tip timing)
- [x] rampfill-pourlines-part3.md (Ramp & Fill, not Bertopia) — RF 1.0.22. Bump the Ramp & Fill version, not 2.5.x. (shipped ac12014)
- [ ] rampfill-pourlines-part4.md (stars, saves, Solve; Ramp & Fill, not Bertopia) — RF 1.0.25. Re-locked from RF 1.0.23: RF 1.0.24 (157a945) shipped first without this work, so 1.0.23 would be a lower version.

## BOB
- [x] door-part5.md (sticky item tip, update toast once) — 2.5.494
- [x] door-part6.md (What's new + Badges tile — likely already shipped; verify, then skip) — shipped. Changelog 2.5.472 is the badges line. Menu tile `bdgTitle` opens the badges card (2.5.476, c7a2039). What's new has moved on; the 472 line stays in the log. No new version.
- [ ] bertopia-2.5.499-chips-pill-count.md (chip overlap, update pill into chip lane, held card name × count; only after 2.5.498 is live) — 2.5.499

## Nobody yet (needs Debugzy/Fixzy after Tue)
Room server claims add-on, chat (needs compliance), Botz cutting.
