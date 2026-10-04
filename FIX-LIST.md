# The Tech Room Hub FIX-LIST
Read this first on every The Tech Room Hub ship. In the same commit, tick `[x]` on each item you finished, and put your version and sha next to it. Proof updates "Live now" and the changelog. Docs only: no app code.
Built Sun Oct 4 2026, 6:55 AM ET from Debugzy's fixq briefs and proof RESULTs; it may lag anything shipped after them.

## 1. Live now
- Live title: **The Tech Room · apps.kulibert.net** (https://apps.kulibert.net/).
- Hub rev: **2026-10-13-rename**. Tile, cut line, and version chip say Bertapult. Path stays `/catapult/`.
- Latest Hub proofs: `proof/hub-swipe/RESULT.md` (PASS with P2s; Arabic 1024x768 cold load 8 px too wide on 3 of 14 loads → brief 12c) and `proof/menu-audit/RESULT.md` (same-menu sweep across apps).

## 2. Open fixes (FAIL rows from the latest proof)
- [ ] Arabic 1024x768 first load is 8 px too wide on 3 of 14 cold loads (hub-swipe item 2, NOT DONE) → `briefs/fixq/12c-hub-ar-refit.md`.

## 3. Next up: open briefs in version order (tick when shipped AND proven)
- [ ] `briefs/fixq/12c-hub-ar-refit.md`: Hub fix 12c of the click-test queue (P2, the part of 12b that didn't land). One fix only, please; don't change anything else.
- [x] `briefs/fixq/hub-launchpad-rename.md`: Hub rev 2026-10-13-rename: the ThrowIt listing becomes Bertapult. Text only, only these 3 items. No icon art, layout or order change. Shipped in this commit (tile, cut line, version chip).
- [x] `briefs/fixq/hub-tron-default.md`: Hub: Tron glow is the default look again (Room theme). Shipped 2026-10-13-tron-default (01d103a).
- [ ] `briefs/fixq/shared-bar-plate-clip.md`: Shared bar: the version plate is clipped on narrow phones (all apps, shared/kulibert-bar.js). Shared note from StyleBot, Sat Oct 3, 2026. Out of scope…

Already shipped (from proofs):
- [x] `briefs/fixq/hub-01-sideways-tiles.md`: Hub fix 1 of the click-test queue (P0). One fix only, please; don't change anything else. (proof hub-sideways PASS)
- [x] `briefs/fixq/hub-02-drawer-close.md`: Hub fix 2 of the click-test queue (P2, but it hits every app that uses the shared Menu). One fix only, please; don't change anything else. (proof fixq-02-hub-close PASS)
- [x] `briefs/fixq/12b-hub-ribbon-swipe.md`: Hub fix 12b of the click-test queue (P1, a regression from fix 12). One fix only, please; don't change anything else. (proof hub-swipe PASS with P2s; leftover → 12c)
- [x] `briefs/fixq/hub-disclaimers.md`: Hub: add a Disclaimers area (⚖️ "The Fine Print"), 3 items (proof hub-fineprint PASS)

Plans and reference:
- `briefs/fixq/hub-02-plan.md`: Hub next fix plan (after fix 1 sideways PASS, rev 2026-10-10-sideways) — WAITING FOR DIEGO'S GO
- `briefs/fixq/hub-disclaimers-TEXT-FINAL.md`: KuliNet Hub: Disclaimers (FINAL page text)
- `briefs/fixq/hub-disclaimers-TEXT.md`: KuliNet Hub: Disclaimers (page text)

## 4. Rules
- Every brief: 8 languages (en, uk, ru, es, ar, fa-AF, rw, ti), taps ≥44 px, ☰ top-left, phones equal to Chromebooks, and DONE only when its Accept passes on a fresh page.
- Commit author: trebiluk <6373031+trebiluk@users.noreply.github.com>. Push to main and reply with the sha.

## 5. Proof changelog
- `menu-audit`: Same menu sweep — live audit
- `hub-swipe`: Verdict: PASS with P2s — Hub 2026-10-13-swipe (a09cf0e): the phone ribbon swipes again (P1 fixed), but fix item 2 is NOT DONE: Arabic 1024x768 first load still comes up 8 px too wide on 3 of 14 cold loads (brief acceptan
- `hub-strip`: Verdict: FAIL (P1) — Hub 2026-10-13-strip (81cea34): the Chromebook strip fix works, but it killed the phone ribbon swipe (acceptance #4 "phone ribbon behaves as today" fails).
- `hub-sideways`: Overall: PASS (all acceptance checks pass; 0 console errors; check.sh exit 1, no LIVE AHEAD).
- `hub-icons-strip`: hubstrip-live.log: 13/13 PASS. Hub, ThrowIt door and Berty's Run door × en/ti × 1366 desktop/412 phone: 21 strip icons, 0 visible names, 0 under 44px, all have aria-label + title, and the big tiles keep their labels. ?do
- `hub-fineprint`: PASS
- `fixq-03-hub-one-menu`: Overall: the Hub fix 3 code is PASS on every Hub-side check. Check #1 for Baboo FAILED with the Hub fix alone (Baboo 2.13.8). It passes now only because Baboo 2.13.9 (c9a0d06, Baboo repo) shipped during the prove. I fixe
- `fixq-02-hub-close`: Overall: PASS. The automatic judge flagged 7 of the 72 runs. All 7 are test artifacts or match the layout from before this fix; the re-tests are listed under "Judge flags explained".
