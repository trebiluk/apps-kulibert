Scratch evidence for PR #51 (2.5.552 horizon). Not part of any release.
How these were made: #51's real sky block (src/main.js sky shader + hills + sun/moon + applySky, and src/gfx/horizon.js)
was spliced into a copy of the prebuilt test bundle (the real build is not possible in the sandbox) and run in headless
Chromium (software GL). `scratchClock` stands in for basics.clockMs(). Times: dawn 19.6 min, noon 7, dusk 15.2, night 17.8.
- horizon-1366-*.png, horizon-412-*.png: spawn view at each time, as #51 is today.
- h51-grid-*.png: the four times together. h51-sun-1366.png: looking toward the sun at dawn and dusk (shows the white sun disc).
- h51fix-grid.png: the same with horizon-51-proposed-fixes.patch applied (soft pale sun, calmer dusk and dawn).
