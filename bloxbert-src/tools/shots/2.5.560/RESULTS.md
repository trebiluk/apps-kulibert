# 2.5.560 phone HUD: what was measured

Run with `tools/hud-matrix.cjs` and `tools/hud-accept.cjs` (Playwright, Chromium with swiftshader, static server over the repo root, student door `/bertopia/`).
"Overlap" means two HUD pieces whose boxes cross by more than 3px both ways. "Bad" means a control that is off screen, under 44px, or whose centre point belongs to something else.

## Before (2.5.553, b439a509) -> After (this branch)

| Size | Mode | Pairs of HUD pieces overlapping before | After | Console errors after |
|---|---|---|---|---|
| 1366x768 | Survival | 0 | 0 | 0 |
| 1366x768 | Creative | 0 | 0 | 0 |
| 412x915 upright | Survival | 4 (the stick and the hotbar, 3 pairs; "Tap to play" over Suit) | 0 | 0 |
| 412x915 upright | Creative | 3 (the stick under the hotbar) | 0 | 0 |
| 915x412 sideways | Survival | 10 (Goals over the stick; the header over Crouch and Jump; Pause and Full screen over Crouch and Jump) | 0 | 0 |
| 915x412 sideways | Creative | 12 (the same, plus Copy over Pause) | 0 | 0 |
| 740x360 | Survival | 18 | 1 ("Tap to play" beside the quest card, 10px, one-time chip) | 0 |
| 740x360 | Creative | 16 | 0 | 0 |
| 915x240 | Survival | 35 | 7 (Suit and "Tap to play" against the hotbar; the world strip is 36px tall) | 0 |
| 915x240 | Creative | 38 | 11 (Goals, Copy and Suit against the hotbar) | 0 |

The full pair lists are in `pairs.json` next to this file.

Languages checked after, no overlaps, no bad controls: English, Russian, Arabic (right to left), Tigrinya, Spanish at 412x915 and 915x412.

## Settings and panels on short windows (Close reachable)

Before, at 915x240 and 915x412 the Bag, Crafting, Goals, Help, World and Accessibility panels started at y=0, under the shared bar (the Bag's Close sat at y=-3..41). Settings started at y=116, but the header spans 48..170 there, so Settings' title and Close (Close at 127..171) were under the header and the tap landed on the header.
After, seven panels (Bag, Crafting, Goals, Help, World, Settings, Accessibility) at 412x915, 412x740, 915x412 and 915x240: every panel starts below the bars that are showing, its title and Close are inside the panel, the centre of Close belongs to Close, the panel bottom is inside the window, and the body scrolls.

## What's new

Before: `en` showed 2.5.553 but uk, ru, es, ar, fa-AF, rw and ti all showed the 2.5.550 line (the WN5xx chain in main.js only changes the languages each release lists).
After: all eight languages and Simple show the 2.5.560 line (the running version's own CHANGELOG entry). uk, ru, es, ar are drafts to review; rw, ti, fa-AF are machine drafts.

## Limits, said plainly

* 915x240 and smaller is a window with room for the bars, the hotbar and nothing else. Panels work there. The chip lane is hidden under 330px tall so it cannot cover hotbar slots, and Suit and "Tap to play" still touch the hotbar.
* 360x640 upright was not made clean: the hotbar needs three rows at 360 wide, which pushes the stick and Suit up into the quest card.
* I could not reproduce "Goals covers Undo/Redo/Save" at 412x915 on the 2.5.553 build in a clean session. What I found instead is in the PR body.
