# Spire FIX-LIST
Read this first on every Spire ship. In the same commit, tick `[x]` on each item you finished, and put your version and sha next to it. Proof updates "Live now" and the changelog. Docs only: no app code.
Built Sun Oct 4 2026, 6:55 AM ET from Debugzy's fixq briefs and proof RESULTs; it may lag anything shipped after them.

## 1. Live now
- Live title: **Spire - HoldIt - SL 1.3.35** (`/spire-lab/` on apps.kulibert.net).
- Latest proof on file: `proof/spanspire-cut03/RESULT.md`: Overall: PASS, with one sideways-phone gap. Everything cut 03 adds works live in both apps, standalone and in the Hub, in en, ar and fa-AF, at 1366x768, 1024x768 and 412x915:

## 2. Open fixes (FAIL rows from the latest proof)
- None recorded in the latest proof. If it says FAIL, read that RESULT.md.

## 3. Next up: open briefs in version order (tick when shipped AND proven)
- [ ] `briefs/fixq/menu-spire-lab.md`: Spire Lab — same Hub menu
- [x] `briefs/fixq/spanspire-1-jobs.md`: Span + Spire jobs SC 1.3.36 / SL 1.3.35: the SpanCraft and Spire Lab pages become the Span and Spire jobs inside HoldIt. Text and one link only. Only …
- [ ] `briefs/fixq/spanspire-2-holdit.md`: HoldIt HI [NEXT]: Bridges becomes Span and Towers becomes Spire, the address picks the mode, and each mode opens its jobs. Only these 3 items. Diego 9…
- [ ] `briefs/fixq/spanspire-3-doors.md`: Span + Spire doors: `/spancraft/` and `/spire-lab/` open HoldIt in the matching mode, and the docs use the new names. Only these 3 items. Diego 9:48 P…
- [ ] `briefs/fixq/spanspire-4-hub.md`: Hub rev 2026-10-13-spanspire: the SpanCraft and Spire Lab tiles go, and HoldIt carries Span and Spire. Text and list edits only. Only these 3 items. D…
- [ ] `briefs/fixq/spanspire-game-redesign.md`: SpanCraft + Spire Lab as a build-to-cross platformer (game plan, not a brief yet)

## 4. Rules
- Every brief: 8 languages (en, uk, ru, es, ar, fa-AF, rw, ti), taps ≥44 px, ☰ top-left, phones equal to Chromebooks, and DONE only when its Accept passes on a fresh page.
- Commit author: trebiluk <6373031+trebiluk@users.noreply.github.com>. Push to main and reply with the sha.

## 5. Proof changelog
- `spanspire-cut03`: Overall: PASS, with one sideways-phone gap. Everything cut 03 adds works live in both apps, standalone and in the Hub, in en, ar and fa-AF, at 1366x768, 1024x768 and 412x915:
- `spanspire-cut02`: Overall: PASS. The bet row no longer moves the board. At every size, in every language, standalone and in the Hub, the "Will the truss hold?" / "Will the tower stand?" row now holds its space from the start, and the seco
- `spanspire-cut01b`: Overall: PASS. All 10 checks in cut-01b-esc-close-caption.md pass live, and the cut 01 checks still pass (nothing regressed that a kid would see). 4 new small bugs: 1 caused by this cut (a keyboard focus slip) and 3 olde
- `spanspire-cut01`: Overall: FAIL (most of it works; 4 new bugs). Next level, the Levels toggle, the list under the bar, the drawer Close, RTL, Job 10 → Challenge, version and What's new, and 0 console errors all pass. Two things fail insid
