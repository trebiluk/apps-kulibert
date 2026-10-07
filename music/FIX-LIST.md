# DJ Berty FIX-LIST
Read this first on every DJ Berty ship. In the same commit, tick `[x]` on each item you finished, and put your version and sha next to it. Proof updates "Live now" and the changelog. Docs only: no app code.
Built Sun Oct 4 2026, 6:55 AM ET from Debugzy's fixq briefs and proof RESULTs; it may lag anything shipped after them.

## 1. Live now
- Live title follows `music/version.js` (`/music/` on apps.kulibert.net).
- Latest proof on file: `proof/djb-2358a/RESULT.md`: Verdict: PASS (with P2s) — DJ Berty MU 2.35.8 (8cc6b80 + 473d454): all 3 FIX FIRST items work live; the leftover issues are P2 and already sit in later cuts or are new P2 notes.

## 2. Open fixes (FAIL rows from the latest proof)
- None recorded in the latest proof. If it says FAIL, read that RESULT.md.

## 3. Next up: open briefs in version order (tick when shipped AND proven)
- [x] Lane B: one version source for every plate, and a resize keeps the open view.
- [x] Lane B MU 2.35.14: the closed menu stays off the screen in Arabic and Dari.
- [x] Lane B MU 2.35.13: drum rows stay above the player, and the player fits at 412 px.
- [x] Lane B MU 2.35.12: language menu above the scrim (8 languages), and sideways piano keys at least 64 tall.
- [x] Lane B MU 2.35.11: What's new list (newest first, 8 languages, including 2.35.10) and piano keys at least 44×64 on a phone 480 wide or less.
- [ ] `briefs/fixq/djberty-2359b.md`: DJ Berty MU 2.35.10: show the whole Score staff, make Viz walls and sideways Viz controls work, and open ☰ above its backdrop
- [x] `briefs/fixq/djberty-2358c.md`: DJ Berty MU 2.35.13: keep drum rows above the player, fit the player, and fix RTL side-panel placement
- [ ] `briefs/fixq/djberty-2358d.md`: DJ Berty MU 2.35.14: replace the flat piano, instrument list, and giant Songs blocks with picture-first controls
- [ ] `briefs/fixq/djberty-2358e.md`: DJ Berty: finish the icon, waveform, language, contrast, version, and responsive integration sweep
- [ ] `briefs/fixq/djberty-3.0-cut2.md`: DJ Berty MU 2.36.0: Remix in one tap and a real mixing desk (DJ Berty 3.0 cut 2 of 5, one pass).
- [ ] `briefs/fixq/djberty-3.0-cut3.md`: DJ Berty MU 2.37.0: a real piano, play along on keys or drums, held notes, a pipe organ, and notes that light up as they play (DJ Berty 3.0 cut 3 of 5…
- [ ] `briefs/fixq/djberty-3.0-cut4.md`: DJ Berty MU 2.38.0: a band you can set up yourself, and live picture tiles that stay inside the stage (DJ Berty 3.0 cut 4 of 5, one pass).
- [ ] `briefs/fixq/djberty-3.0-cut5.md`: DJ Berty MU 3.0.0: record everything you do as takes, then play the song back with or without them (DJ Berty 3.0 cut 5 of 5, one pass).
- [ ] `briefs/fixq/menu-dj-berty.md`: DJ Berty — same Hub menu

Already shipped (version at or below live):
- [x] `briefs/fixq/djberty-2354-sideways-gui.md`: DJ Berty MU 2.35.5: lists you can read, a tip that stays off the buttons, and a sideways phone that uses the whole screen (P2, one layout pass, follow… (version ≤ live/proven 2.35.9)
- [x] `briefs/fixq/djberty-2356.md`: DJ Berty MU 2.35.6: every word readable, menus and popups that close, Perform that fits, and nothing hidden under the bar (P1, one pass, follow-up to … (version ≤ live/proven 2.35.9)
- [x] `briefs/fixq/djberty-2357.md`: DJ Berty MU 2.35.7: tabs on the left, your song in a player at the bottom, and no more getting stuck (DJ Berty 3.0 cut 1 of 5, P1, one pass). (version ≤ live/proven 2.35.9)
- [x] `briefs/fixq/djberty-3.0-cut1.md`: DJ Berty MU 2.35.7: tabs on the left, your song in a player at the bottom, and no more getting stuck (DJ Berty 3.0 cut 1 of 5, P1, one pass). (version ≤ live/proven 2.35.9)
- [x] `briefs/fixq/djberty-2358a.md`: DJ Berty MU 2.35.8: FIX FIRST: remove dev-only UI, make song changes single-owner, and put all tabs on phones (version ≤ live/proven 2.35.9)
- [x] `briefs/fixq/djberty-2358b.md`: DJ Berty MU 2.35.9: make Viz real, remove Exit from the rail, and make Score plus drums fit (version ≤ live/proven 2.35.9)

Plans and reference:
- `briefs/fixq/djberty-3.0-SUMMARY.md`: DJ Berty 3.0, the short version (for Diego)
- `briefs/fixq/djberty-3.0-PLAN.md`: DJ Berty 3.0 plan, from Diego's notes Sat Oct 3, 9:12–9:28 AM ET (Diego: "You have permission to get DJ Berty 3.0 ready.")
- `briefs/fixq/djberty-IA-PLAN.md`: Renamed: see djberty-3.0-PLAN.md

## 4. Rules
- Every brief: 8 languages (en, uk, ru, es, ar, fa-AF, rw, ti), taps ≥44 px, ☰ top-left, phones equal to Chromebooks, and DONE only when its Accept passes on a fresh page.
- Commit author: trebiluk <6373031+trebiluk@users.noreply.github.com>. Push to main and reply with the sha.

## 5. Proof changelog
- `djb-2358a`: Verdict: PASS (with P2s) — DJ Berty MU 2.35.8 (8cc6b80 + 473d454): all 3 FIX FIRST items work live; the leftover issues are P2 and already sit in later cuts or are new P2 notes.
- `djb-2357`: Verdict: FAIL (P1). The new shape is half there: the player bar and contained confetti work, but phone tabs are off-screen, Viz/Dusk has no stage, and RTL shows the hidden side panel over the stage.
- `djb-2356`: Totals: 8/8 brief items PASS by their own tests. Scrutiny list 1–23: 16 PASS, 6 FAIL (4, 10, 19, 20, 22, 23), 1 partial (11).
- `djb-2355`: DJ Berty MU 2.35.4 → 2.35.5 prove: FAIL
- `music2353`: PASS
