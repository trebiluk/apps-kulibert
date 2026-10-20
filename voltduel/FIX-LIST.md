# Volt Duel FIX-LIST
Stage: touch tip, closer race, missing text, proof hook. Version locked: VD 1.0.2.
Physics, levels, keyboard keys, pad size, and scoring were not changed.

## VD 1.0.2
- [x] **Item 1 Phone tip.** Live with touch on: 412×915 and 915×412 show "Hold ◀ ▶ to run. Tap ⤒ to jump, tap again in the air." at 14px, with no WASD and no arrows. Live 1366×768 without touch shows "VEX uses WASD. RIO uses arrows. Jump again in the air." at 14px. Plate reads VD 1.0.2.
- [x] **Item 2 Portrait gap.** Live 412×915 with touch on: the floor is 7px above the VEX/RIO labels. Pads are 59×56, "◀ LEFT". HUD shows whole "VEX 0 /10", the timer, and "RIO 0 /10". Mute, Pause, Restart, and Full do not cover the track. No page scroll.
- [x] **Item 3 blurbAlice.** The shared English table now has "Help Alice guard the pups". The eight language files already had Alice's line and were not reworded. Live Volt Duel hard load: 0 "KulibertI18n missing" lines, 0 errors, and no Volt Duel 404s in en, ar, and fa-AF. Arabic reads "ساعدي أليس على حراسة الصغار". Dari reads "به آلیس کمک کن از بچه‌ها نگهبانی کند".
- [x] **Item 4 Proof hook.** Without `?proof=1`, live `window.__VD_PROOF` is undefined. With `?proof=1&seed=1` the hook uses the pad input, not a teleport. Live: `runToFlag('vex')` finished in 19.38 and the card said "VEX takes the flag". `runToFlag('rio')` finished in 31.13 and the card said "RIO takes the flag". `rotateCheck()` both ways, 412×915 to 915×412 and back, returned timerKept, coinsKept, and reset false. No console errors and no failed responses.
- [x] **Version strings.** Live plate, meta, and chip say VD 1.0.2. What's new (en): "VD 1.0.2 — Phone tips talk touch, and the race sits closer to your buttons."

## VD 1.0.1 (kept)
- [x] Hold to run with no context menu. Run and jump can be held together.
- [ ] Two runners holding opposite directions. They still bump. Physics left alone.
- [x] Touch to the flag. Pads are 56px with icon and word. HUD "x/10" and the timer are whole. Help sentence is whole. Rotate mid-race keeps the timer and coins.
- [ ] Keyboard race all the way to the flag on the live door, then one Rematch tap.

## Carry forward
- [x] Chip and What's new say VD 1.0.2 on the live door.
- [ ] Keyboard race to the flag, then one Rematch tap, on the live door.
- [x] No page scroll at 412×915.
