# Bertopia 2.5.545 — texpack look fix (lane Topia 1)

Columns in tiles-before-after-64-and-32.png: old 64, new 64, old at 32px (box average, shown 2x), new at 32px.
Rows: Classic grass, Classic sand, water (old = ice tile, new = water tile), Mystical grass, Mystical sand.

## Findings
- Fog/sky/light: unchanged vs main 56ec4f4 (0 fog lines in the diff of src/main.js and src/gfx/quality.js). The dullness was texture value, so the tiles were redrawn with stronger mid-tone contrast. No fog change made.
- In-world water is drawn by the bertWater shader in src/main.js, not by a pack tile, and that shader is the same as 2.5.541. The pack's "water" entry used the pale ice tile. It now has its own deep blue water tile. If in-world water still looks pale in a screenshot, the shader alpha (0.44-0.66) is the lever, and that is outside this lane's scope.

## Art changes (tools/gen64.py)
- Grass top: flat green + 3 greens, 2x2-cell blade clumps, no per-pixel static. Mystical keeps purple base and teal flecks (12 pairs).
- Sand: flat tan + soft ripple lines and grain pairs. Mystical sand: lavender with ripples and 6 small crystal facets.
- Water: new layer `water` (appended at the end of the strip, existing indices unchanged). Matte blue, darker ripple bands, no white.
- All shapes sit on 2x2 cells, so the 32px view is an exact copy of the 64px art.

## Checks run
- tools/gen64.py regenerates; unchanged tiles are byte-identical to the branch.
- node tools/pack-check.mjs: pass (94 keys x 2 packs).
- Max channel values stay under the #EEF3F7 cap (cap_master).

## Not run (npm registry blocked in this cloud session)
- npm ci / npm run build, full npm test, live screenshots (1366x768, 412x915, 915x412), live 2.5.541 side by side, FPS.
- bertopia/ and blocks-test/ built copies are NOT rebuilt. Someone with registry access must run `npm run build:test` (and build for bertopia/) before this can be looked at in a browser.
