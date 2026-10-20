# Volt Duel FIX-LIST
Stage: one-column race. Version locked: VD 1.0.4.
Physics, hints, pads, and scoring were not changed.

## VD 1.0.4
- [ ] **Item 1 One column.** Stage is a flex column: HUD, canvas, pads. No absolute offset on those three. Local 412×915 touch: stage 48–915, hud 48–284.1, canvas 284.1–820, pads 820–915. band hud 0, canvas−hud 0, pad gap 0. Local 915×412 touch: stage 48–412, hud 48–148.8, canvas 148.8–317, pads 317–412. band 0, gap 0. Positions: hud relative, canvas static, pads static. Live check still open.
- [ ] **Item 2 rotateCheck after RESTART.** Not started. Today a restart still reports timerKept true next to reset true.

## Kept from VD 1.0.3
- [x] Touch menu shows pad words and no key chips. 1366 keeps the keyboard chips.
- [ ] Keyboard race all the way to the flag, then one Rematch tap, was not re-run.
