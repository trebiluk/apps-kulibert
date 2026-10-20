# Volt Duel FIX-LIST
Stage: touch proof and phone text. Version locked: VD 1.0.1.
Physics, levels, keyboard keys, and scoring were not changed.

## VD 1.0.1
- [x] **Item 0 Hold to run.** A finger held on a pad runs the same way a held key does. Each finger is tracked on its own. A browser cancel does not drop a finger that is still down, so run and jump can be held together. The pad area blocks the long-press menu, selection, and drag. Press feedback is a dark pad with a soft ring, not a white flash. Live at 412×915 with touch on: VEX Right held 2s moved 76, 98, 113, 127, 142, 155, 169, 184 with no context menu and no selection. RIO Right held 2s moved 492px the same way. VEX Right and VEX Jump held together ran and jumped (x 74 to 358 while y rose).
- [ ] **Item 0 Two runners at once.** VEX Right and RIO Left both receive the hold (pads stay lit, no menu), but the runners meet and the existing side bump shoves them back. Physics is out of scope for VD 1.0.1, so this was not changed. Seen live: both x stayed near 45 and 71 for 2s.
- [x] **Item 0 Touch to the flag.** One player reached the flag by touch only. Live: VEX at 412×915, "VEX TAKES THE FLAG" at 13.90. RIO at 915×412, "RIO TAKES THE FLAG" at 13.82.
- [x] **Item 1 Icon + word, 56px pads.** Every pad shows ◀, ▶, or ⤒ plus Left, Right, or Jump. VEX and RIO names stay. Live sizes: 59×56 at 412×915, 143×56 at 915×412, 218×56 at 1366×768. Gap 8px. Pads do not sit under the full-screen button or the HUD.
- [x] **Item 2 HUD.** Timer is on its own row when the screen is narrow. Level name hides there. Both scores show the whole "x/10". Live at 412×915 and 915×412: "VEX 0 /10", the timer, and "RIO 0 /10" are whole, apart, and not cut. No page scroll. At 1366×768 the row reads "VEX 0 /10", "QUALIFIER 0.33", "RIO 0 /10".
- [x] **Item 3 Menu tip.** The restart / double-jump sentence sits behind a "? Help" button. Opened live at 412×915, 915×412, and 1366×768: the full sentence is on screen and the page does not scroll. Closed menu lines are whole at those three sizes.
- [x] **Version strings.** Chip, plate, and What's new say VD 1.0.1. Live plate reads "VD 1.0.1". Live What's new (en): "VD 1.0.1 — Hold a button to run on phones, and the score fits the screen." The other seven languages are in the menu script.
- [x] **Rotate mid-race.** Live, 915×412 turned to 412×915 while the race was running. Phase stayed race, coins stayed 0/10 and 0/10, timer kept counting (0.03 to 1.27), and VEX kept moving (36 to 138).
- [ ] **Keyboard re-check on the live door.** Keys still move both runners. Live, holding D walked VEX from the spawn through the first pit to the far deck (past x 1900) before a mistimed jump hit the spikes. One Rematch tap was seen on the built files ("RIO TAKES THE FLAG" 16.25, Rematch back to a race at 0.45). The live door did not show the flag card in this pass, so this stays open.
- [x] **Console.** Live page: 0 console errors and no failed responses at 412×915, 915×412, and 1366×768.

## Carry forward
- [x] Touch race to the flag, including a 2 second hold with no browser menu.
- [x] Rotate mid-race keeps the timer and the coins.
- [x] No page scroll.
- [x] No console errors and no 404s.
- [x] Chip and What's new say VD 1.0.1.
- [ ] Two runners holding opposite directions at the same time. They block each other. Left as-is because bump physics is out of scope.
- [ ] Keyboard race all the way to the flag on the live door, then one Rematch tap. D walks and W jumps. The flag card was not seen live in this pass.
