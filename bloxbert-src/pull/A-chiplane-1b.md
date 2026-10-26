Bertopia NEXT FREE 2.5.x (see PULL-LIST) — chip lane Part 1b

Bertopia, `bloxbert-src`. Builds on 1a (`#chip-lane`, `layoutLane()`, `laneAdd()`, priority cap). Files: main.js, learn.js, index.html, read.css. Pull first, no force-push, no other Build in `blocks/`. Match by selector or function name; line numbers drift. Out of scope: earnChip and the crew badge (1c), the bottom and centre chips, and anything outside the lane.

**Found while reading:** the goal chip only sits at the top on big screens (wider than 980 and taller than 520). On phones and short screens `placePath()` docks it at the bottom (`--goal-bottom`), and the read.css rules inside `@media (max-width: 980px), (max-height: 520px)` place it there. Those stay as they are. The lane takes the goal chip only in the big-screen case. The corner branch lower in `placePath()` is unreachable; leave it.

## Fix 1: goal chip into the lane (prio 2), and delete the 1a bridge
- `placePath()` big-screen branch: replace the block that measures `#pause-btn` / `#fs-btn` and sets `maxWidth` with `laneAdd(el, 2)`. `layoutLane()` already clears those buttons.
- `placePath()` phone branch: call a new `laneRelease(el)` (move the chip back to `body`, same node, never a copy) before it clears its inline styles. Resizing across 980 or 520 must move it in or out without a flicker or a duplicate.
- The lane cap ignores `#path-chip.path-out` (its 0.4 s fade-out) so the fading chip frees its slot at once.
- Delete the 1a temporary bridge: the `body:has(#path-chip:not([hidden]):not(.path-out)) { --lane-top: ... }` rule.
- Remove placement only, keeping colors, fonts and padding: index.html `#path-chip` base (~286: `position`, `left`, `top`, `z-index`; change `max-width` to `100%`) and its kb-bar variant (~313); read.css `html body #path-chip` `z-index: 48` (~720 to 727). Keep every rule inside the phone media block (~605 to 615, ~809 to 816) and `#path-chip[hidden]`.
- Keep `'#path-chip'` in the `pinAboveBar()` crowd list in tips.js: on phones it is still outside the lane.

## Fix 2: inspect chip into the lane (prio 3)
- At boot, `laneAdd($('inspect-chip'), 3)`. `setInspect()` keeps toggling `hidden`; nothing else changes.
- Remove placement only: index.html `#inspect-chip` base (~240: `position`, `top`, `left`, `z-index`) and kb-bar variant (~241). Keep `min-height: 44px`, border, colors. (`body.hud-calm #inspect-chip` stays hidden, unchanged.)

## Fix 3: held name into the lane (prio 6), after one check
**Check first** (calm mode off, so Creative, or `hud-calm` removed): call `flashHeld()` at all 3 viewports and report the chip's rect. Today index.html puts it at the top, but read.css (~2296, shared stack "hotbar → label → tool bar") sets `bottom !important`, so it may be docked above the hotbar.
- **If it renders at the top:** join the lane with `laneAdd($('held-chip'), 6)`; remove its placement from index.html (~247, ~628, `#held-chip.kd-tip` ~1046 to 1048, kb-bar variant ~1056) and drop `#held-chip` from the read.css ~2296 selector (wand and use pills stay). Raise its text to 14px or more; let `.brief-more` wrap (3 lines at most) instead of the ellipsis.
- **If it renders above the hotbar:** do not move it. Delete only its stale `top` declarations, keep ~2296, and say so in the commit message.
- **Either way:** delete the safe-chip dodge in `flashHeld()` (the `safe` rect check and both `chip.style.top` lines, including the reset in the `setTimeout`). Keep `syncHudBusy()` and the 1.5 s timer.

## Accept checks
Each at 360x740, 915x412, 1366x768, kb-bar on and off, LTR and RTL, with the longest strings (Spanish and Tigrinya goal text, the longest item name):
1. **1366x768:** goal chip is a lane child at prio 2. Force boss, goal, inspect, safe, saved and update on: only 4 show, in priority order, none overlap or touch `#game-menu`, `#pause-btn`, `#fs-btn` or the hotbar.
2. **360x740 and 915x412:** goal chip is not in the lane and docks at the bottom as before, clear of the stick, Jump and hotbar. Resize across 980 and 520: one node, no flicker.
3. **Inspect on:** chip sits right under the goal chip (or the boss bar), 44px tap target; off, the gap closes. Cap is 3 at 360x740 and 915x412.
4. **Held:** the check result is in the commit message. If it joined the lane, 14px or more, no cut-off text, never overlapping the safe chip (the old dodge is gone).
5. Size rule on goal, inspect and held: text 14px or more, tappable 44x44, contrast 4.5:1, not color alone.
6. `node tools/check-strings.mjs` passes. `npm run build` stays under 1 MB gzip. The sideways-phone check is BLOCKED-rig; say so.

