# BUILD PASTE: Bertopia chip lane, Part 1a of 1c

Bertopia, `bloxbert-src`. Version: NEXT FREE 2.5.x (see PULL-LIST). Files: main.js, read.css, index.html, tips.js. Pull first, no force-push, no other Build in `blocks/`. Match by selector or function name; line numbers drift. 1b (path, inspect, held) and 1c (earnChip, crew badge) follow, each shipping alone.

## Fix 1: the lane and `layoutLane()`
- One `#chip-lane`, appended to `body`: fixed, no `transform`, `filter` or `contain` (docked children must stay fixed to the screen). One z-index, below `#sheet`, above the world. No `aria-live` on the lane; each chip keeps its own `role="status"`.
- `--lane-top` = (48px if `html[data-kb-bar]:not(.kb-framed)`, else 0) + `var(--top-h)` + 8px. This replaces the formula copied across the patches below.
- `layoutLane()` in main.js: left edge clears `#game-menu` (+8), right edge clears `#pause-btn` and `#fs-btn` (-8); fallback 76px and 12px; RTL swaps sides. Chips are centered, gap 6px. Run it on resize, `orientationchange` and kb-bar change.
- `laneAdd(el, prio)` puts a chip in the lane in priority order. Chips keep toggling their own `hidden`. One `MutationObserver` (`attributeFilter: ['hidden']`, lane children only) re-runs the cap below.

## Fix 2: priority, cap and size rule
**Fixed order, top first:** 1 boss bar, 2 goal chip, 3 inspect chip, 4 earn chips, 5 saved chip, 6 held name, 7 safe-zone chip, 8 update chip. In this part only 1, 5, 7 and 8 join; the rest keep their current place until 1b and 1c.
**Cap:** 3 visible when the viewport is under 520 wide or under 520 tall, else 4. Extra lower-priority chips get `data-wait` (CSS `display:none`) and appear the same frame a slot frees. Sticky chips are deferred, never dropped.
**Sheet open:** `body:has(#sheet:not([hidden])) #chip-lane > :not(#update-chip) { display: none }`. The update chip keeps its dock above the hotbar.
**Motion:** reduced motion = instant. Otherwise a 120 ms opacity fade only, no slide, no flash.
**Size rule for every lane chip:** text 14px or more (the update chip is 13px; raise it); status chips 32px tall or more; tappable chips 44 by 44 or more; text wraps to 3 lines at most and is never cut off; contrast 4.5:1 or better on the chip's own solid background; every chip keeps its icon or word, never color alone.

## Fix 3: move 4 chips in, remove only their patches
Delete placement declarations only (`position`, `top`, `bottom`, `left`, `right`, `transform`, `z-index`). Keep colors, fonts, padding.

| Chip | Add to lane | Remove |
|---|---|---|
| boss bar | `ensureBossBar()` appends to lane, prio 1 | read.css boss-bar top rules (~1756, ~1758); the position part of its inline `cssText`; the `bar.style.top` and `maxWidth` block (~10767 to 10771) |
| saved chip | at boot, `laneAdd($('save-chip'), 5)` | `#save-chip` from the shared `#save-chip, #toast.nice-chip` rule in read.css (~641 to 648; the `#toast.nice-chip` half stays for 1c) |
| safe-zone chip | `ensureSafeChip()` appends to lane, prio 7 | read.css safe-chip top rules: base (~1748), short-wide (~1752), narrow (~1763), under-update (~1768); the hidden-under-sheet rule (~1749, now the lane's sheet rule); the position part of its inline `cssText` |
| update chip | `showUpdateChip()` appends to lane, prio 8 | index.html `#update-chip` base (~58) and kb-bar variant (~93). Keep the sheet dock (~94) |

**Temporary bridge (delete in 1b):** the goal chip is not in the lane yet, so turn the old under-goal-chip safe-chip rule (~1772) into `body:has(#path-chip:not([hidden]):not(.path-out)) { --lane-top: calc(var(--kb-h, 48px) + var(--top-h, 56px) + 74px) }` and drop its `#safe-chip` selector.
**tips.js:** in the `pinAboveBar()` crowd list, drop `'#safe-chip'` and add `'#chip-lane'`.
**Leave alone for 1b:** `flashHeld()` dodge of the safe chip, and every `#path-chip`, `#inspect-chip` and `#held-chip` rule.

## Accept checks
1. 360x740, 915x412, 1366x768, kb-bar on and off, LTR and RTL: with boss, saved, safe and update forced on, no two chips overlap, none touches the top bar, `#game-menu`, `#pause-btn`, `#fs-btn` or the hotbar, none leaves the screen, and only 3 (or 4) show.
2. Size rule measured on all four, including the longest strings (Spanish, Tigrinya): no cut-off text.
3. Hide the boss bar: the next chip appears the same frame. Open Menu: only the update chip stays, above the hotbar.
4. Goal chip showing: the safe-zone chip sits below it, as before.
5. `node tools/check-strings.mjs` passes. `npm run build` stays under 1 MB gzip.

## Report back
sha, files changed, which patches above were removed, what to test by hand. The rig can't do a sideways phone, so mark that check BLOCKED-rig.

