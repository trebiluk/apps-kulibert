DJ Berty MU NEXT FREE 2.36.x — click restore + auto-off (music/app.js only). Exact edits, apply in order:

1) applySaved: after
    if (typeof saved.swing === "number") state.swing = saved.swing;
add
    if (typeof saved.click === "boolean") state.click = saved.click;

2a) state init: after `click: false,` add `clickAuto: false,`
2b) Insert just above `function paintMixLabels() {`:
  function paintClick() {
    const btn = $("click-btn");
    if (!btn) return;
    btn.classList.toggle("on", state.click);
    btn.setAttribute("aria-pressed", String(state.click));
  }
  function endAutoClick() {
    if (!state.clickAuto) return;
    state.clickAuto = false;
    state.click = false;
    paintClick();
    keep();
  }
2c) In paintMix `if (click) {` block, replace the two lines
      click.classList.toggle("on", state.click);
      click.setAttribute("aria-pressed", String(state.click));
with
      paintClick();
(leave the click handler untouched)

3a) Record: after `state.armBeats = per;` insert `state.clickAuto = !state.click;` before `state.click = true;`
3b) Tap-write: after `tapOn = true;` insert `state.clickAuto = !state.click;` before `state.click = true;`

4a) after `snack("snackStop");` / `state.recording = false;` add `endAutoClick();`
4b) after `$("lesson").textContent = mu("recOff");` add `endAutoClick();`
4c) in `function stopTapWrite() {` after `tapOn = false;` add `endAutoClick();`

Out of scope: click label text, keep(), saved-field list, other tabs.
Stamp MU NEXT FREE 2.36.x in version.js, the 4 ?v=mu refs in index.html, strings.js 9 blocks, CHANGELOG.md, FIX-LIST.md. Rebase right before commit; if main is already >= NEXT FREE 2.36.x, stop and report.
Accept: hand-on click + reload = still on; Record, Stop, reload = off; hand-on, record, Stop = still on; old save without click = off, no console error.

