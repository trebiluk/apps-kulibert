(() => {
  if (window.__VISUALIZER__ === "0.5.1") return;
  window.__VISUALIZER__ = "0.5.1";
  const stageApi = window.KulibertStage;
  const CHIP = stageApi ? stageApi.CHIP : "Viz 0.5.1";
  const LOOKS = stageApi
    ? stageApi.LOOKS
    : [
        { id: "bars", label: "Bars" },
        { id: "kaleido", label: "Kaleidoscope" },
        { id: "clouds", label: "Clouds" },
        { id: "stars", label: "Stars" },
        { id: "code", label: "Code" },
      ];
  const LOOK_STORE = "visualizer.look";
  const DAY_KEY = "kulibert.viz.played";
  const FEED_KEY = "kulibert.viz.feed";
  const BEATZ_KEY = "bertybeatz.v1";
  const TRACKS = ["kick", "snare", "hat", "clap", "n4", "n3", "n2", "n1", "n0"];
  const $ = (id) => document.getElementById(id);

  function row(pattern) {
    return TRACKS.map((id) => (pattern[id] ? 1 : 0));
  }
  function stepsOf(on) {
    const steps = {};
    TRACKS.forEach((id, i) => {
      steps[id] = on[i] || Array(16).fill(0);
    });
    return steps;
  }
  const BUILTIN = [
    {
      id: "demo",
      name: "Demo",
      bpm: 108,
      steps: stepsOf([
        [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0],
        [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
        [1, 0, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 1, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0],
        [0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
      ]),
    },
    {
      id: "march",
      name: "March",
      bpm: 100,
      steps: stepsOf([
        [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
        [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        Array(16).fill(0),
        Array(16).fill(0),
        [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
        [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
        Array(16).fill(0),
        Array(16).fill(0),
      ]),
    },
    {
      id: "skip",
      name: "Skip",
      bpm: 124,
      steps: stepsOf([
        [1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0],
        [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1],
        [0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1],
        Array(16).fill(0),
        [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0],
        Array(16).fill(0),
        Array(16).fill(0),
        [0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
        Array(16).fill(0),
      ]),
    },
  ];

  function boolRow(row) {
    const out = Array(16).fill(false);
    if (!Array.isArray(row)) return out;
    for (let i = 0; i < 16; i++) out[i] = row[i] === true || row[i] === 1;
    return out;
  }
  function normalizeSteps(raw) {
    const steps = {};
    TRACKS.forEach((id) => {
      steps[id] = boolRow(raw && raw[id]);
    });
    return steps;
  }
  function beatFromParts(parts) {
    if (!parts || parts.length < 8 || parts[0] !== "BZ1") return null;
    const bits = parts[7];
    if (!bits || bits.length < TRACKS.length * 4) return null;
    const steps = {};
    TRACKS.forEach((id, ti) => {
      const n = parseInt(bits.slice(ti * 4, ti * 4 + 4), 16);
      const row = Array(16).fill(false);
      if (!Number.isNaN(n)) {
        for (let i = 0; i < 16; i++) row[i] = Boolean(n & (1 << i));
      }
      steps[id] = row;
    });
    return {
      id: "code-" + bits.slice(0, 6),
      name: String(parts[1] || "Pass").slice(0, 32),
      bpm: Math.min(160, Math.max(70, Number(parts[2]) || 110)),
      steps,
    };
  }
  function beatFromText(text) {
    const raw = String(text || "").trim();
    if (!raw) return null;
    if (raw.startsWith("BZ1~")) return beatFromParts(raw.split("~"));
    if (window.KulibertSong && raw.includes("kulibert.song")) {
      const song = window.KulibertSong.parse(raw);
      if (song) {
        const beat = window.KulibertSong.toBeat(song);
        return {
          id: "file-" + Date.now(),
          name: beat.name || "Score",
          bpm: beat.bpm,
          steps: normalizeSteps(beat.steps),
        };
      }
    }
    let data;
    try { data = JSON.parse(raw); } catch { return null; }
    if (typeof data === "string") return beatFromText(data);
    if (data && typeof data.code === "string") {
      const fromCode = beatFromText(data.code);
      if (fromCode && !data.steps) return fromCode;
    }
    if (data && data.steps) {
      return {
        id: "file-" + Date.now(),
        name: String(data.name || "Imported").slice(0, 32),
        bpm: Math.min(160, Math.max(60, Number(data.bpm) || 110)),
        steps: normalizeSteps(data.steps),
      };
    }
    return null;
  }
  function localBeats() {
    const out = [];
    try {
      const raw = localStorage.getItem(BEATZ_KEY);
      if (!raw) return out;
      const data = JSON.parse(raw);
      if (data && data.now && data.now.steps) {
        out.push({
          id: "now",
          name: data.now.name || "Open beat",
          bpm: data.now.bpm || 110,
          steps: normalizeSteps(data.now.steps),
        });
      }
      if (data && Array.isArray(data.library)) {
        data.library.forEach((item) => {
          if (!item || !item.steps) return;
          out.push({
            id: "lib-" + item.id,
            name: item.name || "Saved beat",
            bpm: item.bpm || 110,
            steps: normalizeSteps(item.steps),
          });
        });
      }
    } catch { /* ignore */ }
    return out;
  }
  function loadImported() {
    try {
      const raw = localStorage.getItem(FEED_KEY);
      const list = raw ? JSON.parse(raw) : [];
      return Array.isArray(list) ? list.map((item) => ({
        id: item.id,
        name: item.name,
        bpm: item.bpm,
        steps: normalizeSteps(item.steps),
      })) : [];
    } catch {
      return [];
    }
  }

  const bins = new Uint8Array(64);
  const wave = new Uint8Array(64);
  const state = {
    look: "bars",
    playing: false,
    muted: false,
    source: "library",
    beatId: "",
    imported: loadImported(),
    startedAt: performance.now(),
    playhead: -1,
    status: "",
  };
  let audioCtx = null;
  let master = null;
  let micStream = null;
  let micCtx = null;
  let micAnalyser = null;

  function loadLook() {
    try {
      const raw = localStorage.getItem(LOOK_STORE);
      if (LOOKS.some((l) => l.id === raw)) return raw;
    } catch { /* ignore */ }
    return "bars";
  }
  state.look = loadLook();

  function scoreBeat() {
    const Song = window.KulibertSong;
    if (!Song || !Song.readBridge) return [];
    const bridge = Song.readBridge();
    if (!bridge || !bridge.song) return [];
    const beat = Song.toBeat(bridge.song);
    return [{
      id: "score",
      name: "Written",
      bpm: beat.bpm,
      steps: normalizeSteps(beat.steps),
    }];
  }
  function catalog() {
    return scoreBeat().concat(localBeats()).concat(BUILTIN).concat(state.imported);
  }
  function currentBeat() {
    const list = catalog();
    return list.find((b) => b.id === state.beatId) || list[0];
  }
  function ensureBeat() {
    const list = catalog();
    if (!list.some((b) => b.id === state.beatId)) state.beatId = list[0] ? list[0].id : "demo";
  }

  function hit(kind, when) {
    if (state.muted || !audioCtx || !master) return;
    const t = when || audioCtx.currentTime;
    if (kind === "kick") {
      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      o.frequency.setValueAtTime(150, t);
      o.frequency.exponentialRampToValueAtTime(46, t + 0.12);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.7, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
      o.connect(g);
      g.connect(master);
      o.start(t);
      o.stop(t + 0.24);
      return;
    }
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = kind === "hat" ? "square" : "triangle";
    o.frequency.value = kind === "hat" ? 1800 : kind === "snare" ? 220 : 440;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(kind === "hat" ? 0.12 : 0.28, t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t + (kind === "hat" ? 0.05 : 0.16));
    o.connect(g);
    g.connect(master);
    o.start(t);
    o.stop(t + 0.2);
  }
  function playStep(step) {
    const beat = currentBeat();
    if (!beat) return;
    const steps = beat.steps;
    if (steps.kick[step]) hit("kick");
    if (steps.snare[step] || steps.clap[step]) hit("snare");
    if (steps.hat[step]) hit("hat");
    if (steps.n0[step] || steps.n1[step] || steps.n2[step] || steps.n3[step] || steps.n4[step]) hit("note");
  }
  function unlock() {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    if (!audioCtx) {
      audioCtx = new AC();
      master = audioCtx.createGain();
      master.gain.value = 0.8;
      master.connect(audioCtx.destination);
    }
    if (audioCtx.state === "suspended") audioCtx.resume();
  }

  function paintBeat(step) {
    const beat = currentBeat();
    const steps = beat ? beat.steps : BUILTIN[0].steps;
    const bpm = beat ? beat.bpm : 108;
    const sixteenth = 60 / bpm / 4;
    const into = (performance.now() - state.startedAt) / 1000;
    const local = (into / sixteenth) % 1;
    const decay = Math.exp(-local * 3.4);
    const kick = steps.kick[step] ? decay : 0.05;
    const snare = (steps.snare[step] || steps.clap[step]) ? decay : 0;
    const hat = steps.hat[step] ? decay : 0.04;
    const note = (steps.n2[step] || steps.n3[step] || steps.n4[step] || steps.n0[step] || steps.n1[step]) ? decay * 0.85 : 0.04;
    const t = performance.now() / 1000;
    for (let i = 0; i < bins.length; i++) {
      let v = 16 + 8 * Math.sin(t * 1.6 + i * 0.22);
      if (i < 6) v += kick * 230;
      else if (i < 16) v += (snare * 0.85 + note * 0.7) * 210;
      else if (i < 32) v += (note * 0.55 + hat * 0.4) * 180;
      else v += hat * 150;
      bins[i] = Math.max(0, Math.min(255, v));
    }
    for (let w = 0; w < wave.length; w++) {
      const wobble = Math.sin(t * 6 + w * 0.35) * (kick * 70 + snare * 40 + hat * 24);
      wave[w] = Math.max(0, Math.min(255, 128 + wobble));
    }
  }

  function stepNow() {
    if (!state.playing || state.source !== "library") return -1;
    const beat = currentBeat();
    const bpm = beat ? beat.bpm : 108;
    const sixteenth = 60000 / bpm / 4;
    return Math.floor((performance.now() - state.startedAt) / sixteenth) % 16;
  }

  function renderFeed() {
    ensureBeat();
    const box = $("feed");
    if (!box) return;
    box.innerHTML = "";
    catalog().forEach((item) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "btn" + (item.id === state.beatId ? " on" : "");
      b.textContent = item.name;
      b.setAttribute("aria-pressed", String(item.id === state.beatId));
      b.addEventListener("click", () => {
        stopDevice();
        state.source = "library";
        state.beatId = item.id;
        state.startedAt = performance.now();
        state.playhead = -1;
        state.status = "";
        renderChrome();
      });
      box.appendChild(b);
    });
  }

  function writeNow(step) {
    const el = $("now-line");
    if (!el) return;
    if (state.source === "device" && state.playing) {
      el.textContent = state.muted ? "Sound is off. Now: this device." : "Now: this device.";
      return;
    }
    if (!state.playing || step < 0) {
      el.textContent = "Press Play. Read the word. Sound can stay off.";
      return;
    }
    const beat = currentBeat();
    const steps = beat && beat.steps;
    const names = [];
    if (steps) {
      if (steps.kick && steps.kick[step]) names.push("Kick");
      if (steps.snare && steps.snare[step]) names.push("Snare");
      if (steps.clap && steps.clap[step]) names.push("Clap");
      if (steps.hat && steps.hat[step]) names.push("Hat");
      if (["n0", "n1", "n2", "n3", "n4"].some((id) => steps[id] && steps[id][step])) names.push("Note");
    }
    const off = state.muted ? "Sound is off. " : "";
    el.textContent = names.length ? off + "Now: " + names.join(", ") + "." : off + "Rest. The lights still move.";
  }

  function renderChrome() {
    const lookName = LOOKS.find((l) => l.id === state.look)?.label || "Bars";
    const beat = currentBeat();
    $("look-live").textContent = lookName;
    $("mode-name").textContent = state.source === "device" ? "Device" : (beat ? beat.name : "Beat");
    const step = state.playing ? state.playhead : -1;
    $("lcd-pos").textContent = step >= 0 ? `${Math.floor(step / 4) + 1}.${(step % 4) + 1}` : "—";
    document.body.classList.toggle("is-loop", state.playing);
    const play = $("play-btn");
    play.classList.toggle("is-on", state.playing);
    play.setAttribute("aria-label", state.playing ? "Pause" : "Play");
    const mute = $("mute-btn");
    if (mute) {
      mute.textContent = state.muted ? "Muted" : "Sound on";
      mute.setAttribute("aria-pressed", String(state.muted));
    }
    writeNow(state.playing ? state.playhead : -1);
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
    const recipe = $("code-look");
    if (recipe) {
      recipe.hidden = state.look !== "code";
      if (state.look === "code" && stageApi && stageApi.syncRecipe) stageApi.syncRecipe(recipe);
    }
    const status = $("status-line");
    if (status) status.textContent = state.status;
    renderFeed();
  }

  function pickLook(id) {
    state.look = id;
    try { localStorage.setItem(LOOK_STORE, id); } catch { /* ignore */ }
    renderChrome();
  }
  function markDay() {
    try { localStorage.setItem(DAY_KEY, "1"); } catch { /* ignore */ }
    document.body.classList.remove("is-day");
    const more = $("more-btn");
    if (more) more.hidden = false;
  }
  function play() {
    unlock();
    state.playing = true;
    state.startedAt = performance.now();
    state.playhead = -1;
    markDay();
    renderChrome();
  }
  function stop() {
    state.playing = false;
    state.playhead = -1;
    renderChrome();
  }
  function stopDevice() {
    if (micStream) micStream.getTracks().forEach((track) => track.stop());
    micStream = null;
    if (micCtx) micCtx.close();
    micCtx = null;
    micAnalyser = null;
    if (state.source === "device") state.source = "library";
  }
  async function useDevice() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      state.status = "This Chromebook has no sound input. The library still runs.";
      state.source = "library";
      renderChrome();
      return;
    }
    try {
      micStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    } catch (err) {
      state.status = "Sound stayed off. The library still runs.";
      state.source = "library";
      renderChrome();
      return;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    micCtx = new AC();
    micAnalyser = micCtx.createAnalyser();
    micAnalyser.fftSize = 128;
    micAnalyser.smoothingTimeConstant = 0.72;
    micCtx.createMediaStreamSource(micStream).connect(micAnalyser);
    state.source = "device";
    state.playing = true;
    state.status = "Lights follow this device. Speakers stay on the library beat only.";
    markDay();
    renderChrome();
  }

  $("score-btn").addEventListener("click", () => {
    const Song = window.KulibertSong;
    const beat = currentBeat();
    if (!Song || !beat) {
      window.location.href = "/bertyscore/";
      return;
    }
    Song.writeBridge("visualizer", Song.fromBeat(beat), beat);
    window.location.href = "/bertyscore/?from=bridge";
  });
  $("play-btn").addEventListener("click", () => {
    if (state.playing && state.source !== "device") stop();
    else if (state.source === "device" && state.playing) {
      state.playing = false;
      renderChrome();
    } else play();
  });
  $("stop-btn").addEventListener("click", () => {
    stopDevice();
    stop();
  });
  $("mute-btn").addEventListener("click", () => {
    state.muted = !state.muted;
    if (master) master.gain.value = state.muted ? 0 : 0.8;
    renderChrome();
  });
  $("help-btn").addEventListener("click", () => {
    const box = $("help");
    box.hidden = !box.hidden;
    $("help-btn").setAttribute("aria-expanded", String(!box.hidden));
  });
  $("more-btn").addEventListener("click", () => {
    const on = document.body.classList.toggle("show-more");
    $("more-btn").setAttribute("aria-expanded", String(on));
    $("more-btn").textContent = on ? "Less" : "More";
  });
  $("device-btn").addEventListener("click", () => useDevice());
  $("library-src").addEventListener("click", () => {
    stopDevice();
    state.status = "Library beat.";
    state.source = "library";
    renderChrome();
  });
  $("import-btn").addEventListener("click", () => $("import-file").click());
  $("import-file").addEventListener("change", () => {
    const file = $("import-file").files && $("import-file").files[0];
    $("import-file").value = "";
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const beat = beatFromText(reader.result);
      if (!beat) {
        state.status = "That file is not a beat. The library stayed put.";
        renderChrome();
        return;
      }
      state.imported.unshift(beat);
      state.imported = state.imported.slice(0, 12);
      try { localStorage.setItem(FEED_KEY, JSON.stringify(state.imported)); } catch { /* ignore */ }
      state.beatId = beat.id;
      state.source = "library";
      stopDevice();
      state.status = "Imported " + beat.name + ".";
      renderChrome();
    };
    reader.readAsText(file);
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
    if (e.code === "Digit5") pickLook("code");
  });

  ["chip-label", "chip-live", "foot-chip"].forEach((id) => {
    const el = $(id);
    if (el) el.textContent = CHIP;
  });
  let seen = false;
  try { seen = localStorage.getItem(DAY_KEY) === "1"; } catch { seen = false; }
  document.body.classList.toggle("is-day", !seen);
  $("more-btn").hidden = !seen;
  ensureBeat();
  if (new URLSearchParams(window.location.search).get("from") === "bridge") {
    state.beatId = "score";
    state.source = "library";
    state.playing = true;
    state.startedAt = performance.now();
    markDay();
  }
  renderChrome();

  const canvas = $("viz");
  if (stageApi) {
    stageApi.mount(canvas, () => {
      const step = stepNow();
      if (state.source === "library" && state.playing && step !== state.playhead && step >= 0) {
        state.playhead = step;
        playStep(step);
        $("lcd-pos").textContent = `${Math.floor(step / 4) + 1}.${(step % 4) + 1}`;
        writeNow(step);
      } else if (state.source === "device") {
        state.playhead = -1;
      }
      if (state.source === "library" && state.playing && step >= 0) paintBeat(step);
      const on = state.playing && step >= 0 && state.source === "library";
      const beat = currentBeat();
      return {
        look: state.look,
        playing: state.playing,
        playhead: on ? step : -1,
        kick: on && beat ? Boolean(beat.steps.kick[step]) : false,
        snare: on && beat ? Boolean(beat.steps.snare[step] || beat.steps.clap[step]) : false,
        bins: state.source === "device" ? null : (state.playing ? bins : null),
        wave: state.source === "device" ? null : (state.playing ? wave : null),
        analyser: state.source === "device" && state.playing ? micAnalyser : null,
        code: stageApi.loadCode ? stageApi.loadCode() : null,
      };
    });
  }
})();
