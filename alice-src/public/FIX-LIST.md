# Alice's Prairie FIX-LIST
Read this first on every Alice's Prairie ship. In the same commit, tick `[x]` on each item you finished, and put your version and sha next to it. Proof updates "Live now" and the changelog. Docs only: no app code.
Updated Wed Oct 7 2026 from the AP 1.0.8 prairie cut. Clouds drift, grass sways, and the weather changes.


## 1. Live now
- Live title: **Alice's Prairie** (`/alice/` on apps.kulibert.net).
- Chip: **AP 1.0.8**. The prairie is alive: clouds drift, grass sways, and the weather changes. Menus and cards cover the game and pause the round. Help and the speaker are light ink. A cleared round says High five only. Pixel lookout art. Less motion, Lite, Sound, and Music. Steady round clock. Six looks, captions, Relaxed speed, Class / Daily / Endless, desk high scores, and class time.
- 1.0.6 was the fit and the pixel look. Its live proof failed on cards. 1.0.5 was settings and the six looks.
- Hub chip AP 1.0.8. Builder accept: `proof/alice-1.0.8/RESULT.md`.

- **Proof verdict: FAIL (P1)**, Oct 6 2026, 7:40 PM ET, `proof/alice-1.0.6/RESULT.md` on Debugzy's box. The fit holds on home, picker and Lookout at 5 sizes in en and ar, with 0 errors. Rotate, Less motion, Lite, the clock and the pixels all pass. Cards fail: they don't cover the controls or pause the round. The repo's `proof/alice-1.0.6/RESULT.md` is the builder's self-check, and it never opened a card.

## 2. Open fixes (FAIL rows from the latest proof)
- [x] **P1 A card doesn't own the screen.** Fixed in AP 1.0.7. An open card hides the tiles and alarms, the panel is DOM, and plain lines block taps.
- [x] **P1 A card doesn't pause the round.** Fixed in AP 1.0.7. Help, Menu, Settings and Restart hold the step, and Close or Keep starts it again.
- [x] P2 Help "?" and the speaker were dark ink. A cleared round also said "We'll get it next time!". Alice's pop was stuck on frame 0. Goal, prompt and caption were not RTL. Fixed in AP 1.0.7.
- Watch (not Alice's lane): in ar at 412, the shared bar's "Sign in" is cut off at the right edge. The rebuild re-encodes `sfx.m4a`/`.ogg` with different bytes. The build copies `alice-src/public/FIX-LIST.md` over this file, so keep the two in sync.
- Still open for ov4 (AP 1.0.10): L05 can't be cleared (0% of 2,000 seeds), and half of each round is empty.

## 3. Next up: open briefs in version order (tick when shipped AND proven)
- **PAUSED (Diego, Oct 6 2026, 9:59 PM ET: "Just Topia after this one").** ov3 and everything below stay ON HOLD. AP 1.0.8 was already in this build chat, so it shipped.
- [x] `briefs/fixq/alice-100b3.md`: Alice's Prairie AP 1.0.3: rotate, cards, one menu, Pause/Esc, strip, levels. Shipped 9b69a82. Home-card and seed pay followed as AP 1.0.4 (9d42dc2, 9ffe8eb).
- [x] `briefs/fixq/alice-100c.md`: Settings and six looks, arcade Lookout (captions, Relaxed), Daily, Endless, desk high scores, class time. Shipped as **AP 1.0.5**.
- [x] `briefs/fixq/alice-ov1-stage.md`: AP 1.0.6 overhaul, `42404d9`. Proof FAIL on cards only.
  - [x] 1a–1c Every screen fits, including cards and results. Proven in the AP 1.0.7 accept (5 sizes, en and ar).
  - [x] 2 Motion, Lite, Sound, Music, and the 60 Hz clock. Proven: reduced motion → Less motion: On; Lite On + reload = Canvas; a hidden tab for 5 s holds the clock.
  - [x] 3 Pixel atlas from `tools/pixels.mjs`. Proven: the PNG rebuilds byte for byte, 83 frames, every silhouette is different, 7 captions.
- [x] `briefs/fixq/alice-107-fix.md`: **AP 1.0.7**. A card owns the screen, a card pauses the round, icon contrast, results words, Alice's pop, and RTL text.
- [x] `briefs/fixq/alice-ov2-world.md`: **AP 1.0.8**. Parallax layers, life, and weather. Home uses the same prairie.
- [ ] ON HOLD: `briefs/fixq/alice-ov3-juice.md`: AP 1.0.9. Squash, particles and shake (off with Less motion), sound with picture twins, and results that pay off.
- [ ] ON HOLD: `briefs/fixq/alice-ov4-loop.md`: AP 1.0.10. Sim lookout-2 (a full round, every level clearable), badges, fields and hats, and the first 30 seconds.
- [ ] `briefs/fixq/alice-100d.md`: Alice Dress Up: the wardrobe, the photo booth, and outfit codes. AP 1.0.11, after the overhaul.
- [ ] `briefs/fixq/alice-100e.md`: TechWorks marks, offline, launch safety. AP 1.0.12.
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
- `briefs/alice/ALICE-OVERHAUL.md`: the overhaul plan (ov1 → ov4).
- `briefs/fixq/alice-BACKLOG.md`: backlog after AP 1.1.5
- Retired: alice-106-fit.md (folded into ov1; the 100b2/100b3 leftovers went to ov1 and ov4).

## 4. Rules
- Every brief: 8 languages (en, uk, ru, es, ar, fa-AF, rw, ti), taps ≥44 px, ☰ top-left, phones equal to Chromebooks, and DONE only when its Accept passes on a fresh page.
- Commit author: trebiluk <6373031+trebiluk@users.noreply.github.com>. Push to main and reply with the sha.

## 5. Proof changelog
- `alice-1.0.8`: sky, far hills, near hills, a tilemap field, and foreground grass. Tufts sway, butterflies fly, grasshoppers hop, and a bird line passes. Sunny, Breezy, Drizzle, Snowy, and Night. Motion-off holds still outside the threat. Sim hash stays `0f5b63db7039`.
- `alice-1.0.7`: cards cover the controls and pause the round. Help and the speaker measure 15.79:1 and 14.12:1 on the navy button. A cleared round says High five, not both. Alice's pop plays three frames. Arabic goal text is RTL. The 1.0.6 fit, rotate, Less motion, Lite, clock, and pixel hash still pass.
- `alice-1.0.6`: **FAIL (P1)**, Oct 6, 7:40 PM ET (Debugzy, live, real taps). Cards don't cover the controls behind them or pause the round. Pass: the fit on home, picker and Lookout (5 sizes, en and ar, 0 errors), rotating 915 → 412 → 915 mid-round, Less motion, Lite → Canvas, the hidden-tab clock, the pixel rebuild, bands-check, and sim-check `0f5b63db7039`. All of 1.0.5's fit P1s are fixed.
- `alice-1.0.6` (ship note): every screen fits (en and ar, five sizes), Less motion and Lite, steady clock, pixel cast. Plate AP 1.0.6.
- `alice-1.0.5`: shipped, local smoke only. One ☰ when the Tech Room bar is up. Settings: six looks, Normal/Relaxed, captions, class time 10/20/40. Lookout picker: Class, Daily, Endless. Results name the round and this desk's best.
- `alice-1.0.2`: FAIL
- `alice-1.0.1`: FAIL: rotating mid-round crashes the game, every card is blank, and Resume/Esc can't un-pause (plus Pause hidden under Snake sideways, and a layout ratchet).
