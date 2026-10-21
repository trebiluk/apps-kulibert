# Volt Duel FIX-LIST
Stage: VD 1.0.7. Version locked: VD 1.0.7.
Physics and scoring were not changed.

## VD 1.0.5
- [x] **Item 1 Pads.** Already fully visible. Live `index-FGwm0gA0.js`: every pad is 56px tall and fully inside the viewport at 412×924, 412×915, and 915×412 (and at 1366×768).
- [x] **Item 2 What's new.** Chip, plate, and data-version say VD 1.0.5. English and Arabic (rtl) lines match the lock. Simple: "VD 1.0.5: Hold Run and Jump. Buttons fit."
- [x] **Item 3 Log.** c90db75 and 96864bb are folded into VD 1.0.5.
- [x] **Help.** "Hold Run and Jump to keep going. The buttons fit on every phone." Icon plus words, eight languages plus Simple. Esc closes Help.

## Folded in
- c90db75 — On a phone, run and jump keep going until the finger lifts.
- 96864bb — Tick for that phone hold. Live again on VD 1.0.5: hold Right moved VEX x 36 → 107 and the button stayed held. Jump moved y 456 → 395. A rotate mid-race kept x 109 and phase race.

## Seen live
- Hand-played Qualifier at 915×412: keyboard run and jumps, "VEX takes the flag" at 20.97. Console 0 errors.

## Still open
- [x] Rematch. One tap after the flag starts a fresh heat. Mouse at 1366, touch at 915×412 and 412×915, Enter and Space. Timer 0.00, both coins 0, countdown 3, runners back at the start. Console 0.

## VD 1.0.6
- [x] **Item 1 Shape and letter.** VEX lamp and off-screen mark are a circle with V. RIO is a square with R. Unlit lamps stay that shape in gray. HUD pips match. Checkpoint banner says VEX CHECKPOINT or RIO CHECKPOINT.
- [x] **Item 2 Screen reader.** A hidden status line says 3, 2, 1, Go, who reached a checkpoint, who went back, and who took the flag. At most one update a second. Coins are not announced. Esc says Paused, then Resumed.
- [x] **Item 3 Hazard sign.** A hit sends the runner back and shows "VEX — BACK TO CHECKPOINT" or "RIO — BACK TO CHECKPOINT". That runner's score pill gets a 2px outline for 0.3s (0.6s and still, if motion is reduced). No white flash.
- [x] **Item 4 Rematch.** Already worked. No race code changed. After "VEX takes the flag" (13.05, 6 coins) one Rematch tap starts countdown at 0.00 with 0 coins.

## VD 1.0.7
- [x] **Item 1 Pads.** Already inside the screen on live VD 1.0.6. At 412×924 each pad is 59×56 and ends at y 916 (viewport 924). In the hub iframe they end at y 868 of 876.
- [x] **Item 2 Menu and Home.** Already clear on live VD 1.0.6. At 412, Menu is 62×44 and Sign in is 104×44 with a gap between them. At 915×412, RESTART is 80×48 just under the bar, Home is 44px tall, and Sign in does not cover them.
- [x] **Item 3 Held pad.** A held pad changes its icon to a dot and shows the word On. The border gets thicker. Reduced motion stays still. Not color alone.

