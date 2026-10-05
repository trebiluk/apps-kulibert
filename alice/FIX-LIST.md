# Alice's Prairie FIX-LIST
Read this first on every Alice's Prairie ship. In the same commit, tick `[x]` on each item you finished, and put your version and sha next to it. Proof updates "Live now" and the changelog. Docs only: no app code.
Updated Mon Oct 5 2026 from the AP 1.0.5 ship. The Oct 4 queue lagged the 1.0.3 and 1.0.4 bugfix commits.

## 1. Live now
- Live title: **Alice's Prairie** (`/alice/` on apps.kulibert.net).
- Chip: **AP 1.0.5**. Settings, six looks, captions, Relaxed speed, Class / Daily / Endless, desk high scores, and class time.
- 1.0.4 on the chip before this cut was the seed and Home-card bugfix, not the settings brief.
- Latest proof on file is still `proof/alice-1.0.2/RESULT.md`: FAIL. AP 1.0.5 has a local smoke only (menu, settings, picker, Daily start). Not a full proof.

## 2. Open fixes (FAIL rows from the latest proof)
- None recorded in the latest proof. If it says FAIL, read that RESULT.md.

## 3. Next up: open briefs in version order (tick when shipped AND proven)
- [x] `briefs/fixq/alice-100b3.md`: Alice's Prairie AP 1.0.3: rotate, cards, one menu, Pause/Esc, strip, levels. Shipped 9b69a82. Home-card and seed pay followed as AP 1.0.4 (9d42dc2, 9ffe8eb).
- [x] `briefs/fixq/alice-100c.md`: Settings and six looks, arcade Lookout (captions, Relaxed), Daily, Endless, desk high scores, class time. Shipped as **AP 1.0.5** (1.0.4 was already the chip).
- [ ] `briefs/fixq/alice-100d.md`: Alice Dress Up: the wardrobe, the photo booth, and outfit codes. Only these 3 items. Next. The queue called this 1.0.5; the chip is already 1.0.5, so the next cut is 1.0.6.
- [ ] `briefs/fixq/alice-100e.md`: Alice's Prairie AP 1.0.6 in the old queue: TechWorks marks, offline, launch safety. Renumber when it ships.
- [ ] `briefs/fixq/alice-110a.md`: Prairie Dash: the run, the 16-bit look, and six class levels.
- [ ] `briefs/fixq/alice-110b.md`: Prairie Dash: two players, Course Maker, share cards.
- [ ] `briefs/fixq/alice-110c.md`: Burrow Builder.
- [ ] `briefs/fixq/alice-110d.md`: Burrow co-op, Sandbox, new Dress Up items.
- [ ] `briefs/fixq/alice-110e.md`: Dig Physics.
- [ ] `briefs/fixq/alice-110f.md`: Colony Signals.
- [ ] `briefs/fixq/hiscore-alice.md`: Crown Chase pilot. Desk top 5 shipped in 1.0.5. Class boards are still this brief.
- [ ] `briefs/fixq/menu-alice.md`: Alice — same Hub menu

Already shipped (version at or below live):
- [x] `briefs/fixq/alice-100a.md`: AP 1.0.0 door, First Watch, Hub tile.
- [x] `briefs/fixq/alice-100a2.md`: AP 1.0.1 Phaser rebuild.
- [x] `briefs/fixq/alice-100b.md`: AP 1.0.2 six Lookout levels.
- [x] `briefs/fixq/alice-100b2.md`: AP 1.0.2b upright phones.

Plans and reference:
- `briefs/fixq/alice-BACKLOG.md`: backlog after AP 1.1.5

## 4. Rules
- Every brief: 8 languages (en, uk, ru, es, ar, fa-AF, rw, ti), taps ≥44 px, ☰ top-left, phones equal to Chromebooks, and DONE only when its Accept passes on a fresh page.
- Commit author: trebiluk <6373031+trebiluk@users.noreply.github.com>. Push to main and reply with the sha.

## 5. Proof changelog
- `alice-1.0.5`: shipped, local smoke only. One ☰ when the Tech Room bar is up. Settings: six looks, Normal/Relaxed, captions, class time 10/20/40. Lookout picker: Class, Daily, Endless. Results name the round and this desk's best.
- `alice-1.0.2`: FAIL
- `alice-1.0.1`: FAIL: rotating mid-round crashes the game, every card is blank, and Resume/Esc can't un-pause (plus Pause hidden under Snake sideways, and a layout ratchet).
