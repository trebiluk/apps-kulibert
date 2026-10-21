# Volt Duel FIX-LIST
Stage: VD 1.0.18. Version locked: VD 1.0.18.
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

## VD 1.0.8
- [x] **Item 1 Score chips.** VEX chip is a circle with V. RIO chip is a square with R. Same shapes as the track. Not color alone.
- [x] **Item 2 Start labels.** Each runner's circle or square and name sit above that runner. At the start, RIO no longer covers the VEX name.
- [x] **Item 3 Staff test.** With the staff test switch on: Jump to win (VEX), Jump to win (RIO), and Jump to pit. A pit shows the back-to-checkpoint sign and that runner's score outline. Rematch was already a real button. Test results stay on the TEST board. Kids do not get these buttons.

## VD 1.0.9
- [x] **Item 1 Chip help.** Already in every language pack. Live console does not warn about vdChipHelp.
- [x] **Item 2 Lobby language.** The lobby reads the hub language at load. Heats, blurbs, Help, and the pad words follow that language.
- [x] **Item 3 Test script.** The hub bar adds kw-test.js only after a staff unlock. A kid page has no script tag and no KulibertTest global.
- [x] **Item 4 Staff hooks.** In Test mode, jumpToCheckpoint() shows the checkpoint sign. forceEnd("win") and forceEnd("lose") open the end screen. Rematch starts that heat over. Scores stay on the TEST board.

## VD 1.0.10
- [x] **Item 1 Missing keys.** The 18 lobby keys were already in every language pack and in the English fallback. Live es and en consoles show 0 missing-key warnings.
- [x] **Item 2 Spanish lobby, help, and buttons.** The lobby was already Spanish. The last help lines, Close, and in-play Mute, Pause, Restart, Left, Right, and Jump follow the hub language, including their aria-labels.
- [x] **Item 3 Checkpoint and Rematch.** Already reachable in staff Test mode. jumpToCheckpoint shows the checkpoint sign. Rematch after a win starts a new round. Scores stay on the TEST board. Kids do not get the hook.

## VD 1.0.11
- [x] **Item 1 Test script.** kw-test.js loads only when the staff unlock and the Test switch are both on. If a tag leaked in, it is removed. A kid page has no script tag and no KulibertTest or KWTest global.
- [x] **Item 2 Help.** The circle-and-square fact is said once. The sign line no longer repeats it. Help icons are drawn, not a missing-font box.

## VD 1.0.12
- [x] **Item 1 Rematch.** Already one tap. After "VEX takes the flag" (12.00, 3 coins and 1 coin) one Rematch starts Qualifier again: clock 0.00, both coins 0, countdown 3.
- [x] **Item 2 Hit and win.** A hit shakes for 150ms and sparks in that runner's color. The circle V and square R stay readable. Reduced motion adds no shake class. The win screen shows calm confetti, or only the banner when motion is reduced.
- [x] **Item 3 Lobby.** Each runner shows a circle V or a square R, and each key has its own word. The last real match shows under the tag. Arabic mirrors.

## Feature ideas (VD 1.0.12 investigate)
No app code in this item. Each idea says why, size, and risk.

1. **One-tap rematch — already shipped.** After the flag, one Rematch tap starts that same heat over with scores at 0. Live on VD 1.0.12. Why: the open row was never pressed in an old proof. Size: none left. Risk: none. Do not add a CPU mode.
2. **Hit spark — already shipped (this version).** A hit shakes at most 150 ms and sparks in that runner's color. The circle V and square R stay readable. Reduced motion keeps the banner and skips the shake and confetti. Why: a hit should feel like a hit without a flash. Size: done. Risk: do not lengthen the shake or change scoring.
3. **Lobby shape and letter — already shipped (this version).** The lobby shows a circle V and a square R, one word per key, and the last real match. Why: the lobby was plain. Size: done. Risk: do not change the save format `volt-duel-v1`. Last match stays in session only (`vd-last-match-v1`).
4. **Best of 3 — new, needs a later version.** A 12-year-old will ask to play the same heat until someone wins two flags. Why: one flag feels short in class. Size: medium (a small series counter, not a new physics world). Risk: must not change coin scoring, the save shape, or write test wins into the real bests. Keep it off the kid TEST board.
5. **Focus after Rematch — shipped in VD 1.0.13. Sideways lobby — shipped in VD 1.0.16.** One Rematch or Next heat puts the keyboard on the arena. A still cyan ring shows where you are. Tab can leave it. At 915×412 and 924×412, Help and Touch stay on screen, at least 4px above the bottom, with no scroll.

## VD 1.0.13
- [x] **Focus after Rematch.** Rematch and Next heat move focus to the arena (`tabindex="-1"`, label "Volt Duel arena"). The ring is a still 3px cyan line. Tab reaches Mute. Scores reset to 0. Save format `volt-duel-v1` unchanged.

## VD 1.0.14
- [x] **Winner screen language.** The banner, coin line, Rematch, Next heat, and the spoken result follow the hub language, including Spanish and Arabic.

## VD 1.0.15
- [x] **Winner line once.** The flag announces the winner one time. A language change on that screen updates the line once. It does not write the live region a second time on the way in.

## VD 1.0.16
- [x] **Sideways lobby.** At 915×412 and 924×412, Help and Touch end at least 4px above the bottom. Buttons stay at least 44px. The lobby does not scroll. Upright 412×915 and 1366×768 are unchanged.

## VD 1.0.17
- [x] **Pause menu language.** Paused, Resume, Restart, and Levels follow the hub language, including Spanish and Arabic. The arena label does too. Jump to win and Jump to pit stay behind the staff Test switch.

## VD 1.0.18
- [x] **vd-fs-translated.** The full-screen button name and word follow the hub language. In full screen the name says Exit. The button stays at least 44px and the word wraps instead of clipping.

