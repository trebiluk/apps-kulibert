DJ Berty MU NEXT FREE 2.36.x — list songs with no drums play just the tune (Happy Birthday wrong tempo + loud drum)

Stamp MU NEXT FREE 2.36.x in version.js, the 4 ?v=mu refs in index.html, strings.js 9 blocks, CHANGELOG.md, FIX-LIST.md. Rebase right before commit; if main is already >= NEXT FREE 2.36.x, stop and report.

Cause: placeSong keeps the previous beat and mix when a list song has no drums, so a 4/4 grid (or trap remix, blend 32) plays over Happy Birthday's 3/4 tune.

Fix (music/app.js, placeSong):
Anchor:
    if (opts.drums) {
Insert ABOVE it:
    if (!opts.drums) {
      ROWS.forEach(([id]) => { state.drums[id] = to16([]); });
      state.blend = 50;
      if ($("blend")) { $("blend").value = "50"; $("blend-read").textContent = blendWord(50); }
    }
(layTrap runs after placeSong for the trap remix, so the remix still gets its drums.)

Out of scope: trap remix, style packs, song data, mix sliders.
Accept:
1. Load any 4/4 beat, then open Happy Birthday from the list and press Play: the tune plays at 90, no drums.
2. Trap remix still lays trap drums.
3. A list song that has its own drums still plays them.
4. Saved songs open unchanged; no console error at 1366 and on a 412 phone.

