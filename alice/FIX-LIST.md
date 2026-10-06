# Alice's Prairie FIX-LIST
Read this first on every Alice's Prairie ship. In the same commit, tick `[x]` on each item you finished, and put your version and sha next to it. Proof updates "Live now" and the changelog. Docs only: no app code.
Updated Tue Oct 6 2026, 7:45 PM ET from the AP 1.0.6 live proof (Debugzy). AP 1.0.7 is now a fix cut, so the overhaul queue moves up one version.

## 1. Live now
- Live title: **Alice's Prairie** (`/alice/` on apps.kulibert.net).
- Chip: **AP 1.0.6**. Every screen fits. Pixel lookout art. Less motion, Lite, Sound, and Music in Settings. Steady round clock. Six looks, captions, Relaxed speed, Class / Daily / Endless, desk high scores, and class time.
- 1.0.5 was settings and the six looks. 1.0.4 was the seed and Home-card bugfix.
- Live = main: commit `42404d9`, and all 22 `alice/` files are byte-identical live. Hub chip AP 1.0.6.
- **Proof verdict: FAIL (P1)**, Oct 6 2026, 7:40 PM ET, `proof/alice-1.0.6/RESULT.md` on Debugzy's box. The fit holds on home, picker and Lookout at 5 sizes in en and ar, with 0 errors. Rotate, Less motion, Lite, the clock and the pixels all pass. Cards fail: they don't cover the controls or pause the round. The repo's `proof/alice-1.0.6/RESULT.md` is the builder's self-check, and it never opened a card.

## 2. Open fixes (FAIL rows from the latest proof)
- [ ] **P1 A card doesn't own the screen.** The DOM tiles and alarms stay live and visible around Menu, Settings and results. At home, a tap on the Dig edge opens "Coming soon". At 915x412 and 844x390 the alarm rails poke through the results card, and a tap with Settings open fires an alarm. Plain lines are click-through. → 1.0.7 item 1.
- [ ] **P1 A card doesn't pause the round.** Help, Menu, Settings and Restart open over a running round (Help for 3 s: step 139 → 319). → 1.0.7 item 2.
- [ ] P2 The Help "?" and speaker icons are dark ink on navy (about 1.1:1). A cleared round shows "High five!" and "We'll get it next time!". Alice's pop is stuck on frame 0. The Phaser texts aren't RTL in ar. → 1.0.7 item 3.
- Watch (not Alice's lane): in ar at 412, the shared bar's "Sign in" is cut off at the right edge. The rebuild re-encodes `sfx.m4a`/`.ogg` with different bytes. The build copies `alice-src/public/FIX-LIST.md` over this file, so keep the two in sync.
- Still open for ov4 (AP 1.0.10): L05 can't be cleared (0% of 2,000 seeds), and half of each round is empty.

## 3. Next up: open briefs in version order (tick when shipped AND proven)
- [x] `briefs/fixq/alice-100b3.md`: Alice's Prairie AP 1.0.3: rotate, cards, one menu, Pause/Esc, strip, levels. Shipped 9b69a82. Home-card and seed pay followed as AP 1.0.4 (9d42dc2, 9ffe8eb).
- [x] `briefs/fixq/alice-100c.md`: Settings and six looks, arcade Lookout (captions, Relaxed), Daily, Endless, desk high scores, class time. Shipped as **AP 1.0.5**.
- [x] `briefs/fixq/alice-ov1-stage.md`: AP 1.0.6 overhaul, `42404d9`. Proof FAIL on cards only.
  - [ ] 1a–1c Every screen fits. Home, picker and Lookout pass (the bar plate, the full screen slot, all 6 cards sideways, Pause/Restart at 1366, the goal whole, no slivers, no stray Alice). Cards and results fail → 1.0.7.
  - [x] 2 Motion, Lite, Sound, Music, and the 60 Hz clock. Proven: reduced motion → Less motion: On; Lite On + reload = Canvas; a hidden tab for 5 s holds the clock.
  - [x] 3 Pixel atlas from `tools/pixels.mjs`. Proven: the PNG rebuilds byte for byte, 83 frames, every silhouette is different, 7 captions.
- [ ] `briefs/fixq/alice-107-fix.md`: **AP 1.0.7 fix, in Build next.** A card owns the screen, a card pauses the round, plus the icon contrast, the results words, the Alice pop and RTL text.
- [ ] `briefs/fixq/alice-ov2-world.md`: AP 1.0.8 (was 1.0.7). Parallax layers and weather, animals that move, a living home.
- [ ] `briefs/fixq/alice-ov3-juice.md`: AP 1.0.9. Squash, particles and shake (off with Less motion), sound with picture twins, and results that pay off.
- [ ] `briefs/fixq/alice-ov4-loop.md`: AP 1.0.10. Sim lookout-2 (a full round, every level clearable), badges, fields and hats, and the first 30 seconds.
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
- `alice-1.0.6`: **FAIL (P1)**, Oct 6, 7:40 PM ET (Debugzy, live, real taps). Cards don't cover the controls behind them or pause the round. Pass: the fit on home, picker and Lookout (5 sizes, en and ar, 0 errors), rotating 915 → 412 → 915 mid-round, Less motion, Lite → Canvas, the hidden-tab clock, the pixel rebuild, bands-check, and sim-check `0f5b63db7039`. All of 1.0.5's fit P1s are fixed.
- `alice-1.0.6` (ship note): every screen fits (en and ar, five sizes), Less motion and Lite, steady clock, pixel cast. Plate AP 1.0.6.
- `alice-1.0.5`: shipped, local smoke only. One ☰ when the Tech Room bar is up. Settings: six looks, Normal/Relaxed, captions, class time 10/20/40. Lookout picker: Class, Daily, Endless. Results name the round and this desk's best.
- `alice-1.0.2`: FAIL
- `alice-1.0.1`: FAIL: rotating mid-round crashes the game, every card is blank, and Resume/Esc can't un-pause (plus Pause hidden under Snake sideways, and a layout ratchet).
