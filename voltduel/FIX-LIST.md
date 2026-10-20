# Volt Duel FIX-LIST
Stage: touch menu, honest rotate hook, no empty band. Version locked: VD 1.0.3.
Physics, race tip text, pad size, hold-to-run, and scoring were not changed.

## VD 1.0.3
- [x] **Item 1 Touch menu.** Live https://apps.kulibert.net/voltduel/ asset index-wiQrxBsr.js. 412×915 and 915×412 with touch: VEX and RIO cards read "◀ ▶ run · ⤒ jump", zero kbd chips on the page. 1366×768 keeps A D W S and the arrow chips. Plate and chip VD 1.0.3. Commit f86b79e.
- [ ] **Item 2 rotateCheck.** reset is measured (timer went backwards, or a runner who had left the start is back at the spawn with the timer near zero, or a restart was seen by the race watcher). Local 127.0.0.1 ?proof=1: mid-race 412×915 → 915×412 and back both returned {"timerKept":true,"coinsKept":true,"reset":false} while the timer climbed 1.20 → 1.65. After Restart, rotateCheck returned {"timerKept":true,"coinsKept":true,"reset":true} because the watcher saw the timer drop. Live check still open.
- [ ] **Item 3 Empty band.** Not started.
- [x] **Version strings.** Live chip, plate, title, and meta say VD 1.0.3 (seen with the Item 1 reload). What's new lines in shell.js are the eight VD 1.0.3 sentences.

## Kept from VD 1.0.2
- [x] Touch race tip, 7px track-to-pad gap at 412, pads 56px with icon and word, HUD whole, no KulibertI18n missing, runToFlag vex finished, proof hook absent without ?proof=1.
- [ ] Keyboard race all the way to the flag, then one Rematch tap, on the live door. Not re-seen this pass.
