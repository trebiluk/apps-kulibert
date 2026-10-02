(() => {
  const VERSION = "0.1.3";
  window.__DEBUGZY__ = VERSION;

  const STORAGE_KEY = "debugzy-v010";

  function tx(en) {
    try {
      if (window.DebugzyTx) return DebugzyTx(en);
    } catch (_) { /* english fallback */ }
    return en;
  }

  /** @typedef {{ id:string, title:string, lede:string, steps:string[], badIndex:number, changes:{label:string, ok:boolean, why:string}[], failWrongStep:string }} Puzzle */

  /** @type {Puzzle[]} */
  const PUZZLES = [
    {
      id: "fold-save",
      title: "Fold then save",
      lede: "A paper airplane fold sequence got scrambled. Find the bad step.",
      steps: [
        "Get a clean sheet of paper",
        "Fold in half the long way and crease",
        "Save the fold as a PDF on the Chromebook",
        "Unfold once and fold each long edge to the center crease",
        "Fold the plane in half and crease the wings"
      ],
      badIndex: 2,
      changes: [
        { label: "Drop the PDF save — keep folding paper", ok: true, why: "Paper folds do not need a PDF mid-fold. Save belongs after the plane is done, if at all." },
        { label: "Save as a PNG screenshot instead", ok: false, why: "Still a digital save in the middle of a hand-fold. Wrong kind of step." },
        { label: "Skip getting paper and start folding air", ok: false, why: "You still need paper. The bad step is the mid-fold save." }
      ],
      failWrongStep: "That step can stay. Look for a digital save stuck in a paper-fold run."
    },
    {
      id: "unit-mix",
      title: "Wrong unit",
      lede: "A laser-cut keychain should be 40 mm wide. One step uses the wrong unit.",
      steps: [
        "Open the keychain file in the design app",
        "Set width to 40 inches",
        "Set height to 25 mm",
        "Export SVG for the laser",
        "Send the job to the laser queue"
      ],
      badIndex: 1,
      changes: [
        { label: "Change width to 40 mm", ok: true, why: "40 inches is huge for a keychain. Matching mm keeps the size classroom-real." },
        { label: "Change height to 25 inches too", ok: false, why: "That makes both sides huge. Fix the wrong unit on width only." },
        { label: "Skip export and cut from the screen", ok: false, why: "The laser still needs a file. The bug is the inch width." }
      ],
      failWrongStep: "Most steps are fine. Find the measurement that does not match mm."
    },
    {
      id: "cable-power",
      title: "Cable and power",
      lede: "A Chromebook will not charge at the bench. Sequence the power check.",
      steps: [
        "Confirm the wall outlet works with another device",
        "Plug the USB-C tip into the Chromebook",
        "Leave the power brick unplugged from the wall",
        "Watch for the charging icon",
        "If no icon, try a known-good cable"
      ],
      badIndex: 2,
      changes: [
        { label: "Plug the brick into the wall before watching for charge", ok: true, why: "No wall power means no charge. Fix that one step, then try again." },
        { label: "Skip the outlet check forever", ok: false, why: "Outlet check is useful. The bad step is leaving the brick unplugged." },
        { label: "Unplug the Chromebook tip on purpose", ok: false, why: "That breaks the path more. Power needs the wall connected." }
      ],
      failWrongStep: "Look for a power path that never reaches the wall."
    },
    {
      id: "tiny-code",
      title: "One wrong line",
      lede: "A four-line LED blink list has one bad line. Point to it, then pick one fix.",
      steps: [
        "set pin 13 as OUTPUT",
        "turn pin 13 ON",
        "wait 5000 minutes",
        "turn pin 13 OFF"
      ],
      badIndex: 2,
      changes: [
        { label: "Change wait to 500 milliseconds", ok: true, why: "5000 minutes is not a blink. A short wait lets the LED toggle in class time." },
        { label: "Delete the OFF line", ok: false, why: "Without OFF it never blinks off. The wait unit is the bug." },
        { label: "Set pin 13 as INPUT instead", ok: false, why: "OUTPUT is correct for an LED. Fix the wait line only." }
      ],
      failWrongStep: "Three lines are sensible. Find the wait that is far too long."
    },
    {
      id: "export-path",
      title: "Save path / export",
      lede: "Finished CAD part must land in the class Shared drive folder. One step sends it elsewhere.",
      steps: [
        "Finish the 3D model and name it clearly",
        "Choose File, then Export, then STL",
        "Save into Downloads only and close the tab",
        "Open the class Shared drive, then Tech 7, then Prints",
        "Upload the STL and tell the teacher it is ready"
      ],
      badIndex: 2,
      changes: [
        { label: "After export, move or save the STL into the Shared drive folder", ok: true, why: "Downloads alone is not the class hand-in path. One change: get the file into Shared drive." },
        { label: "Skip naming the model", ok: false, why: "Clear names help. The bug is stopping in Downloads." },
        { label: "Export OBJ instead and still leave it in Downloads", ok: false, why: "A format swap does not fix the missing Shared drive step." }
      ],
      failWrongStep: "Export is fine. Find where the file stops short of Shared drive."
    }
  ];

  const els = {
    chip: document.getElementById("ver-chip"),
    progress: document.getElementById("progress"),
    title: document.getElementById("puzzle-title"),
    lede: document.getElementById("puzzle-lede"),
    stepsLabel: document.getElementById("steps-label"),
    steps: document.getElementById("steps"),
    stepHint: document.getElementById("step-hint"),
    changePanel: document.getElementById("change-panel"),
    changeLabel: document.getElementById("change-label"),
    choices: document.getElementById("choices"),
    changeHint: document.getElementById("change-hint"),
    result: document.getElementById("result"),
    tryBtn: document.getElementById("try-btn"),
    nextBtn: document.getElementById("next-btn"),
    skipBtn: document.getElementById("skip-btn"),
    doneBanner: document.getElementById("done-banner"),
    footPlace: document.getElementById("foot-place"),
    footSave: document.getElementById("foot-save")
  };

  let index = 0;
  let selectedStep = null;
  let selectedChange = null;
  let passed = false;
  let finished = false;

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw);
      if (typeof data.index === "number" && data.index >= 0 && data.index < PUZZLES.length) index = data.index;
    } catch (_) { /* ignore */ }
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ index }));
    } catch (_) { /* ignore */ }
  }

  function setResult(kind, html) {
    if (!els.result) return;
    els.result.hidden = false;
    els.result.className = "result " + kind;
    els.result.innerHTML = html;
  }

  function clearResult() {
    if (!els.result) return;
    els.result.hidden = true;
    els.result.textContent = "";
    els.result.className = "result";
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function labelOf(btn) {
    const span = btn && btn.querySelector("[data-tx]");
    return span || btn;
  }

  function paintChromeText() {
    if (els.chip) els.chip.textContent = "v" + VERSION;
    if (els.stepsLabel) els.stepsLabel.textContent = tx("Sequence · pick the bad step");
    if (els.changeLabel) els.changeLabel.textContent = tx("One change");
    if (els.footPlace) els.footPlace.textContent = tx("Solvay Tech 6–8 · Chromebook lab");
    if (els.footSave) els.footSave.textContent = tx("Sign in from the Hub to save");
    const tryLab = labelOf(els.tryBtn);
    const nextLab = labelOf(els.nextBtn);
    const skipLab = labelOf(els.skipBtn);
    if (tryLab) tryLab.textContent = tx("Try again");
    if (nextLab) nextLab.textContent = tx("Next");
    if (skipLab) skipLab.textContent = tx("Skip this one");
    if (els.doneBanner && !els.doneBanner.hidden) {
      els.doneBanner.textContent = tx("Lab complete. Point to a bad step · say your one change · show a pass run. Alias only on any paper ticket.");
    }
  }

  function renderSteps(puzzle) {
    els.steps.innerHTML = "";
    puzzle.steps.forEach((text, i) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "step";
      btn.setAttribute("role", "option");
      btn.setAttribute("aria-selected", selectedStep === i ? "true" : "false");
      if (selectedStep === i) btn.classList.add("is-selected");
      btn.dataset.index = String(i);
      btn.innerHTML = `<span class="step-num" dir="ltr" aria-hidden="true">${i + 1}</span><span class="step-text">${escapeHtml(tx(text))}</span>`;
      btn.addEventListener("click", () => selectStep(i));
      els.steps.appendChild(btn);
    });
  }

  function renderChanges(puzzle) {
    els.choices.innerHTML = "";
    puzzle.changes.forEach((ch, i) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "choice";
      btn.setAttribute("role", "option");
      const on = selectedChange === i;
      btn.setAttribute("aria-selected", on ? "true" : "false");
      if (on) btn.classList.add("is-selected");
      btn.dataset.index = String(i);
      btn.innerHTML = `<span class="choice-mark" aria-hidden="true">${on ? "●" : "○"}</span><span class="choice-text">${escapeHtml(tx(ch.label))}</span>`;
      btn.addEventListener("click", () => selectChange(i));
      els.choices.appendChild(btn);
    });
  }

  function selectStep(i) {
    if (passed) return;
    selectedStep = i;
    selectedChange = null;
    clearResult();
    els.nextBtn.hidden = true;
    els.tryBtn.hidden = false;
    els.tryBtn.disabled = true;
    renderSteps(PUZZLES[index]);
    els.changePanel.hidden = false;
    renderChanges(PUZZLES[index]);
    els.stepHint.textContent = tx("Bad step marked. Now pick one change.");
    els.changeHint.textContent = tx("Pick exactly one fix. Then press Try again.");
  }

  function selectChange(i) {
    if (passed) return;
    selectedChange = i;
    clearResult();
    els.nextBtn.hidden = true;
    els.tryBtn.hidden = false;
    renderChanges(PUZZLES[index]);
    els.tryBtn.disabled = false;
    els.changeHint.textContent = tx("One change ready. Press Try again.");
  }

  function tryAgain() {
    const puzzle = PUZZLES[index];
    if (selectedStep === null) {
      setResult("fail", "<strong>" + escapeHtml(tx("Fail")) + "</strong> · " + escapeHtml(tx("Point to a bad step first.")));
      return;
    }
    if (selectedChange === null) {
      setResult("fail", "<strong>" + escapeHtml(tx("Fail")) + "</strong> · " + escapeHtml(tx("Pick one change, then try again.")));
      return;
    }
    if (selectedStep !== puzzle.badIndex) {
      setResult("fail", "<strong>" + escapeHtml(tx("Fail")) + "</strong> · " + escapeHtml(tx(puzzle.failWrongStep)) + " " + escapeHtml(tx("Stay on this puzzle.")));
      return;
    }
    const change = puzzle.changes[selectedChange];
    if (!change.ok) {
      setResult("fail", "<strong>" + escapeHtml(tx("Fail")) + "</strong> · " + escapeHtml(tx(change.why)) + " " + escapeHtml(tx("Keep the same bad-step guess · try a different one change.")));
      return;
    }
    passed = true;
    try {
      if (window.KulibertWho && typeof KulibertWho.mark === "function") {
        KulibertWho.mark("debugzy", "Debugzy: puzzle " + (index + 1));
      }
    } catch (_) { /* helper already gates verified aliases */ }
    els.tryBtn.disabled = true;
    els.tryBtn.hidden = true;
    els.nextBtn.hidden = false;
    setResult("pass", "<strong>" + escapeHtml(tx("Pass")) + "</strong> · " + escapeHtml(tx(change.why)) + " " + escapeHtml(tx("Ready for Next when you can say the bad step and the one change.")));
  }

  function showPuzzle() {
    const puzzle = PUZZLES[index];
    passed = false;
    finished = false;
    selectedStep = null;
    selectedChange = null;
    paintChromeText();
    els.progress.textContent = tx("Puzzle {n} of {total}").replace("{n}", String(index + 1)).replace("{total}", String(PUZZLES.length));
    els.title.textContent = tx(puzzle.title);
    els.lede.textContent = tx(puzzle.lede);
    els.changePanel.hidden = true;
    els.choices.innerHTML = "";
    els.tryBtn.hidden = false;
    els.tryBtn.disabled = true;
    els.nextBtn.hidden = true;
    els.doneBanner.hidden = true;
    els.skipBtn.hidden = false;
    clearResult();
    renderSteps(puzzle);
    els.stepHint.textContent = tx("Tap the step that breaks the run.");
    saveState();
  }

  function nextPuzzle() {
    if (index < PUZZLES.length - 1) {
      index += 1;
      showPuzzle();
      return;
    }
    finishLab();
  }

  function finishLab() {
    passed = true;
    finished = true;
    els.progress.textContent = tx("Puzzle {n} of {total} · done").replace("{n}", String(PUZZLES.length)).replace("{total}", String(PUZZLES.length));
    els.tryBtn.hidden = true;
    els.nextBtn.hidden = true;
    els.skipBtn.hidden = true;
    els.changePanel.hidden = true;
    els.doneBanner.hidden = false;
    els.doneBanner.textContent = tx("Lab complete. Point to a bad step · say your one change · show a pass run. Alias only on any paper ticket.");
    setResult("pass", "<strong>" + escapeHtml(tx("Pass run complete")) + "</strong> · " + escapeHtml(tx("Prove talk: point to a bad step · say one change · show it worked.")));
    saveState();
  }

  function repaint() {
    paintChromeText();
    if (finished) {
      finishLab();
      return;
    }
    const puzzle = PUZZLES[index];
    els.progress.textContent = tx("Puzzle {n} of {total}").replace("{n}", String(index + 1)).replace("{total}", String(PUZZLES.length));
    els.title.textContent = tx(puzzle.title);
    els.lede.textContent = tx(puzzle.lede);
    renderSteps(puzzle);
    if (selectedStep !== null) {
      els.stepHint.textContent = tx("Bad step marked. Now pick one change.");
      renderChanges(puzzle);
      els.changeHint.textContent = selectedChange === null
        ? tx("Pick exactly one fix. Then press Try again.")
        : tx("One change ready. Press Try again.");
    } else {
      els.stepHint.textContent = tx("Tap the step that breaks the run.");
    }
  }

  if (els.chip) els.chip.textContent = "v" + VERSION;
  loadState();
  els.tryBtn.addEventListener("click", tryAgain);
  els.nextBtn.addEventListener("click", nextPuzzle);
  els.skipBtn.addEventListener("click", nextPuzzle);
  window.addEventListener("kulibert-lang", repaint);
  showPuzzle();
})();
