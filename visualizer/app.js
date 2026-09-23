(() => {
  if (window.__VISUALIZER__ === "0.1.0") return;
  window.__VISUALIZER__ = "0.1.0";
  const stageApi = window.KulibertStage;
  const CHIP = stageApi ? stageApi.CHIP : "Viz 0.1.0";
  const LOOKS = stageApi
    ? stageApi.LOOKS
    : [
        { id: "bars", label: "Bars" },
        { id: "kaleido", label: "Kaleidoscope" },
        { id: "clouds", label: "Clouds" },
        { id: "stars", label: "Stars" },
      ];
  const LOOK_STORE = "visualizer.look";
  const BPM = 108;
  const DEMO = {
    kick: [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0],
    snare: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
    hat: [1, 0, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 1, 0],
    note: [1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1],
  };
  const bins = new Uint8Array(64);
  const $ = (id) => document.getElementById(id);

  function loadLook() {
    try {
      const raw = localStorage.getItem(LOOK_STORE);
      if (LOOKS.some((l) => l.id === raw)) return raw;
    } catch {
      /* ignore */
    }
    return "bars";
  }
  function persistLook(id) {
    try {
      localStorage.setItem(LOOK_STORE, id);
    } catch {
      /* ignore */
    }
  }

  const state = {
    look: loadLook(),
    playing: true,
    startedAt: performance.now(),
    playhead: 0,
  };

  function stepNow() {
    if (!state.playing) return -1;
    const sixteenth = 60000 / BPM / 4;
    return Math.floor((performance.now() - state.startedAt) / sixteenth) % 16;
  }

  function paintDemo(step) {
    const sixteenth = 60 / BPM / 4;
    const into = (performance.now() - state.startedAt) / 1000;
    const local = (into / sixteenth) % 1;
    const decay = Math.exp(-local * 3.4);
    const kick = DEMO.kick[step] ? decay : 0.06;
    const snare = DEMO.snare[step] ? decay : 0;
    const hat = DEMO.hat[step] ? decay : 0.04;
    const note = DEMO.note[step] ? decay * 0.85 : 0.05;
    const t = performance.now() / 1000;
    for (let i = 0; i < bins.length; i++) {
      let v = 16 + 8 * Math.sin(t * 1.6 + i * 0.22);
      if (i < 6) v += kick * 230;
      else if (i < 16) v += (snare * 0.85 + note * 0.7) * 210;
      else if (i < 32) v += (note * 0.55 + hat * 0.4) * 180;
      else v += hat * 150;
      bins[i] = Math.max(0, Math.min(255, v));
    }
  }

  function renderChrome() {
    const lookName = LOOKS.find((l) => l.id === state.look)?.label || "Bars";
    $("look-live").textContent = lookName;
    $("mode-name").textContent = state.playing ? "Demo" : "Idle";
    const step = state.playing ? state.playhead : -1;
    $("lcd-pos").textContent = step >= 0 ? `${Math.floor(step / 4) + 1}.${(step % 4) + 1}` : "—";
    document.body.classList.toggle("is-loop", state.playing);
    const play = $("play-btn");
    play.classList.toggle("is-on", state.playing);
    play.setAttribute("aria-label", state.playing ? "Pause" : "Play");
    const box = $("looks");
    box.innerHTML = "";
    for (const item of LOOKS) {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "btn" + (item.id === state.look ? " on" : "");
      b.textContent = item.label;
      b.setAttribute("aria-pressed", String(item.id === state.look));
      b.addEventListener("click", () => pickLook(item.id));
      box.appendChild(b);
    }
  }

  function pickLook(id) {
    state.look = id;
    persistLook(id);
    renderChrome();
  }

  function play() {
    if (state.playing) return;
    state.playing = true;
    state.startedAt = performance.now();
    state.playhead = 0;
    renderChrome();
  }
  function stop() {
    state.playing = false;
    state.playhead = -1;
    renderChrome();
  }

  $("play-btn").addEventListener("click", () => {
    if (state.playing) stop();
    else play();
  });
  $("stop-btn").addEventListener("click", stop);
  $("help-btn").addEventListener("click", () => {
    const box = $("help");
    box.hidden = !box.hidden;
    $("help-btn").setAttribute("aria-expanded", String(!box.hidden));
  });
  document.addEventListener("keydown", (e) => {
    if (e.target.matches("input, textarea")) return;
    if (e.code === "Space") {
      e.preventDefault();
      if (state.playing) stop();
      else play();
    }
    if (e.code === "Digit1") pickLook("bars");
    if (e.code === "Digit2") pickLook("kaleido");
    if (e.code === "Digit3") pickLook("clouds");
    if (e.code === "Digit4") pickLook("stars");
  });

  ["chip-label", "chip-live", "foot-chip"].forEach((id) => {
    const el = $(id);
    if (el) el.textContent = CHIP;
  });
  renderChrome();

  const canvas = $("viz");
  if (stageApi) {
    stageApi.mount(canvas, () => {
      const step = stepNow();
      if (step !== state.playhead) {
        state.playhead = step;
        if (step >= 0) $("lcd-pos").textContent = `${Math.floor(step / 4) + 1}.${(step % 4) + 1}`;
      }
      if (state.playing) paintDemo(step < 0 ? 0 : step);
      const on = state.playing && step >= 0;
      return {
        look: state.look,
        playing: state.playing,
        playhead: on ? step : -1,
        kick: on && DEMO.kick[step] === 1,
        snare: on && DEMO.snare[step] === 1,
        bins: state.playing ? bins : null,
      };
    });
  }
})();
