# Alice's Prairie FIX-LIST
Read this first on every Alice's Prairie ship. In the same commit, tick `[x]` on each item you finished, and put your version and sha next to it. Proof updates "Live now" and the changelog. Docs only: no app code.
Updated Tue Oct 6 2026 from the AP 1.0.6 overhaul. The Oct 5 list still said the chip was AP 1.0.5.

## 1. Live now
- Live title: **Alice's Prairie** (`/alice/` on apps.kulibert.net).
- Chip: **AP 1.0.6**. Every screen fits. Pixel lookout art. Less motion, Lite, Sound, and Music in Settings. Steady round clock. Six looks, captions, Relaxed speed, Class / Daily / Endless, desk high scores, and class time.
- 1.0.5 was settings and the six looks. 1.0.4 was the seed and Home-card bugfix.
- Latest proof: `proof/alice-1.0.6/RESULT.md`.

## 2. Open fixes (FAIL rows from the latest proof)
- None from the AP 1.0.6 accept. Older `proof/alice-1.0.2/RESULT.md` is still FAIL and was not this ship.

## 3. Next up: open briefs in version order (tick when shipped AND proven)
- [x] `briefs/fixq/alice-100b3.md`: Alice's Prairie AP 1.0.3: rotate, cards, one menu, Pause/Esc, strip, levels. Shipped 9b69a82. Home-card and seed pay followed as AP 1.0.4 (9d42dc2, 9ffe8eb).
- [x] `briefs/fixq/alice-100c.md`: Settings and six looks, arcade Lookout (captions, Relaxed), Daily, Endless, desk high scores, class time. Shipped as **AP 1.0.5**.
- [x] AP 1.0.6 overhaul (not a queued brief number): every screen fits, one motion/Lite gate and a steady clock, pixel art from code. **AP 1.0.6**.
  - [x] 1a–1c Every screen fits (bands, slots, bar before kw-who).
  - [x] 2 Motion, Lite, Sound, Music, and the 60 Hz clock.
  - [x] 3 Pixel atlas from `tools/pixels.mjs`.
- [ ] `briefs/fixq/alice-100d.md`: Alice Dress Up: the wardrobe, the photo booth, and outfit codes. Still next. The queue called this 1.0.5; the chip is now 1.0.6.
- [ ] `briefs/fixq/alice-100e.md`: The old queue's AP 1.0.6 (TechWorks marks, offline, launch safety). Renumber when it ships. Not this cut.
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
- `alice-1.0.6`: every screen fits (en and ar, five sizes), Less motion and Lite, steady clock, pixel cast. Plate AP 1.0.6.
- `alice-1.0.5`: shipped, local smoke only. One ☰ when the Tech Room bar is up. Settings: six looks, Normal/Relaxed, captions, class time 10/20/40. Lookout picker: Class, Daily, Endless. Results name the round and this desk's best.
- `alice-1.0.2`: FAIL
- `alice-1.0.1`: FAIL: rotating mid-round crashes the game, every card is blank, and Resume/Esc can't un-pause (plus Pause hidden under Snake sideways, and a layout ratchet).
