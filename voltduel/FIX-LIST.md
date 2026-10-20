# Volt Duel FIX-LIST
Stage: one-column race, honest restart check. Version locked: VD 1.0.4.
Physics, hints, pads, and scoring were not changed.

## VD 1.0.4
- [x] **Item 1 One column.** Live `?proof=1` bundle `index-qthYkp2t.js`. 412×915 touch: `[[".stage",48,915,867],[".hud",48,284.1,236.1],["canvas",284.1,820,535.9],[".pads",820,915,95]]`. band = hud.top−stage.top = 0. canvas.top−hud.bottom = 0. pad gap = pads.top−canvas.bottom = 0. 915×412 touch: `[[".stage",48,412,364],[".hud",48,148.8,100.8],["canvas",148.8,317,168.2],[".pads",317,412,95]]`. band 0, canvas gap 0, pad gap 0. After 412→915→412 the 412 rects matched again. HUD is relative, canvas and pads are static, no top offset. Pads 56px. FULL, MUTE, PAUSE, RESTART not on the canvas and not clipped. No page scroll.
- [x] **Item 2 rotateCheck.** Mid-race rotate both ways: `{"timerKept":true,"coinsKept":true,"reset":false}`. After RESTART: `{"timerKept":false,"coinsKept":false,"reset":true}`. Without `?proof=1`, `window.__VD_PROOF` is undefined.

## Kept from VD 1.0.3
- [x] Touch menu shows pad words and no key chips. 1366 keeps the keyboard chips.
- [ ] Keyboard race all the way to the flag, then one Rematch tap, was not re-run.
