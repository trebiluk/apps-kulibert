# Volt Duel FIX-LIST
Stage: touch menu, honest rotate hook, no empty band. Version locked: VD 1.0.3.
Physics, race tip text, pad size, hold-to-run, and scoring were not changed.

## VD 1.0.3
- [x] **Item 1 Touch menu.** Live https://apps.kulibert.net/voltduel/ (bundle index-88Jn_fJM.js, also checked on index-wiQrxBsr.js). 412×915 and 915×412 with touch: VEX and RIO cards read "◀ ▶ run · ⤒ jump", zero kbd chips. 1366×768 keeps A D W S and the arrow chips. Heat blurbs unchanged. Commit f86b79e.
- [x] **Item 2 rotateCheck.** Live ?proof=1&seed=1. Mid-race 412×915 → 915×412 returned {"timerKept":true,"coinsKept":true,"reset":false} (timer 3.52 → 3.75). Back to 412×915 returned {"timerKept":true,"coinsKept":true,"reset":false} (timer 3.97). After Restart, positions were back at the spawns and rotateCheck returned {"timerKept":true,"coinsKept":true,"reset":true}. Without ?proof=1, window.__VD_PROOF is undefined. Commit f0c2146.
- [x] **Item 3 Empty band.** Live 412×915 touch: canvas top 607.42 and the progress bar bottom 607.42, so the empty band is 0px (getBoundingClientRect). Floor (canvas top + height * 500/540) to the pad label is 7px. Pad buttons are 56px. FULL, MUTE, PAUSE, and RESTART do not intersect the canvas and are not clipped. Live 915×412: canvas top 48, progress bar bottom 272.34, delta −224.34px, so the empty band is 0px (the bar sits on the track). Commit 514ea67.
- [x] **Version strings.** Live chip, plate, and What's new say VD 1.0.3. en, ar, and fa-AF hard reloads: 0 console errors, 0 "KulibertI18n missing", no 404s.

## Kept from VD 1.0.2
- [x] Touch race tip, pads 56px with icon and word, HUD whole, no KulibertI18n missing, proof hook absent without ?proof=1.
- [ ] Keyboard race all the way to the flag, then one Rematch tap, on the live door. Not re-seen this pass.
