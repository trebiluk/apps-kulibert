# Volt Duel FIX-LIST
Stage: touch proof and phone text. Version locked: VD 1.0.1.
Physics, levels, keyboard keys, and scoring were not changed.

## VD 1.0.1
- [x] **Item 0 Hold to run.** A finger held on a pad runs the same way a held key does. Pointer id is tracked, so two pads can be held at once. Pad area blocks the long-press menu, selection, and drag. Press feedback is a dark pad with a soft ring, not a white flash. Seen on the built page with touch on: VEX Right held 2s moved steadily (about 14px each quarter second) with no context menu and no selection; RIO Right held 2s moved 492px the same way; VEX Right and RIO Left held together both moved.
- [x] **Item 0 Touch to the flag.** One player reached the flag by touch only. Seen: VEX, 412×915, "VEX TAKES THE FLAG" at 14.55. RIO, 915×412, "RIO TAKES THE FLAG" at 12.63.
- [x] **Item 1 Icon + word, 56px pads.** Every pad shows ◀/▶/⤒ plus Left, Right, or Jump. VEX and RIO names stay. Measured on the built page: 59×56 at 412×915, 143×56 at 915×412, 214×56 at 1366×768. Gap 8px. Pads do not sit under the full-screen button or the HUD.
- [x] **Item 2 HUD at 412.** Timer is on its own row. Level name hides when the screen is narrow. Both scores show the whole "x/10". Seen at 412×915 and 915×412: chips whole, not overlapping, not cut. No page scroll.
- [x] **Item 3 Menu tip.** The restart / double-jump sentence sits behind a "? Help" button. Opened at 412×915, 915×412, and 1366×768: the full sentence is on screen and the page does not scroll. Closed menu lines are whole at those three sizes too.
- [x] **Version strings.** Chip, plate, meta, and What's new say VD 1.0.1 in en, uk, ru, es, ar, fa-AF, rw, and ti. Plate reads "VD 1.0.1" at 412, 915, and 1366.
- [x] **Rotate mid-race.** 412×915 turned to 915×412 while VEX Right was held. Phase stayed race, coins stayed 0/10 and 0/10, timer kept counting (0.92 to 2.03), and VEX kept moving.
- [x] **Keyboard still works.** At 1366×768, WASD and arrows raced Qualifier to the flag ("RIO TAKES THE FLAG"). One tap on Rematch started a new race (timer 0.45, VEX back at the spawn).
- [x] **Console.** Built page: 0 console errors, 0 warnings, no failed responses, at 412×915, 915×412, and 1366×768.

## Carry forward (re-check on the live door)
- [ ] Keyboard race on https://apps.kulibert.net/voltduel/
- [ ] Touch race, including a 2 second hold with no browser menu
- [ ] Rotate mid-race
- [ ] No page scroll
- [ ] No console errors and no 404s
- [ ] Chip and What's new say VD 1.0.1

Live ticks get marked only after the real door shows them.
