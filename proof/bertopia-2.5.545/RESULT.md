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

## Water shader (follow-up, Diego approved)
src/main.js bertWater fragment: colors deep/body/skin made deeper and bluer (top-face "skin" was a pale 0.42,0.68,0.78, now 0.14,0.40,0.66), alpha raised from 0.66/0.44 to 0.90/0.80. waterMat.alpha is unchanged. No white, no animation, brightest channel 0.66.
Screenshots in shots/ (before = built 2.5.544 page, old art and old shader; after = same page with the new tiles and the patched shader). Same camera, same test pond on a flat platform, headless Chromium (software GL). 1366x768 and 412x915 upright. 0 console errors in all four runs.
These shots come from a patched copy of the already-built page, not from `npm run build`. 915x412 sideways and FPS still not measured. The "before" is 2.5.544, not live 2.5.541.
