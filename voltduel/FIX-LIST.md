# Volt Duel FIX-LIST
Stage: one-column race, honest restart check. Version locked: VD 1.0.4.
Physics, hints, pads, and scoring were not changed.

## VD 1.0.4
- [ ] **Item 1 One column.** Stage is HUD, then canvas, then pads. No absolute offset on those three. Local 412×915: stage 48–915, hud 48–284.1, canvas 284.1–820, pads 820–915. band 0 and 0, pad gap 0. Local 915×412: hud under the stage top, canvas under the hud, pad gap 0. Live check still open.
- [ ] **Item 2 rotateCheck.** Local mid-race rotate both ways returned `{"timerKept":true,"coinsKept":true,"reset":false}`. After RESTART: `{"timerKept":false,"coinsKept":false,"reset":true}`. Live check still open.

## Kept from VD 1.0.3
- [x] Touch menu shows pad words and no key chips. 1366 keeps the keyboard chips.
- [ ] Keyboard race all the way to the flag, then one Rematch tap, was not re-run.
