# Volt Duel FIX-LIST
Stage: touch menu, honest rotate hook, no empty band. Version locked: VD 1.0.3.
Physics, race tip text, pad size, hold-to-run, and scoring were not changed.

## VD 1.0.3
- [x] **Item 1 Touch menu.** Live https://apps.kulibert.net/voltduel/ asset index-wiQrxBsr.js. 412×915 and 915×412 with touch: VEX and RIO cards read "◀ ▶ run · ⤒ jump", zero kbd chips on the page. 1366×768 keeps A D W S and the arrow chips. Plate and chip VD 1.0.3. Commit f86b79e.
- [ ] **Item 2 rotateCheck.** reset is measured (timer went backwards, a runner who had left the start is back at the spawn with the timer near zero, or the race watcher saw a restart). Local ?proof=1: mid-race 412×915 → 915×412 and back both returned {"timerKept":true,"coinsKept":true,"reset":false}. After Restart, rotateCheck returned reset:true. Live check still open on the bundle that contains this hook.
- [ ] **Item 3 Empty band.** Local 412×915 touch: getBoundingClientRect of the lower of `.hud .track` / `.hint` bottom vs canvas top is 0px (607 and 607 with the tip showing; 607 and 607 after the tip hides). Floor (canvas top + height * 500/540) to `.pad-label` is 7px. Floor to `.pads` top is 0px. Pad buttons 56px. FULL, MUTE, PAUSE, RESTART do not intersect the canvas. 915×412: canvas top is above the progress bar (bar overlaps the track), so the empty band is 0px; raw canvas.top − progress.bottom = −224px. Live check still open.
- [x] **Version strings.** Chip, plate, title, meta, and the eight What's new lines say VD 1.0.3.

## Kept from VD 1.0.2
- [x] Touch race tip, pads 56px with icon and word, HUD whole, no KulibertI18n missing, runToFlag vex finished, proof hook absent without ?proof=1.
- [ ] Keyboard race all the way to the flag, then one Rematch tap, on the live door. Not re-seen this pass.
