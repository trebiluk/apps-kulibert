(() => {
  const STEP_COUNT = 16;
  const STORAGE = "bertybeatz.v1";
  const TRACKS = [
    { id: "kick", kind: "drum", label: "Kick" },
    { id: "snare", kind: "drum", label: "Snare" },
    { id: "hat", kind: "drum", label: "Hats" },
    { id: "clap", kind: "drum", label: "Clap" },
    { id: "n4", kind: "note", degree: 4 },
    { id: "n3", kind: "note", degree: 3 },
    { id: "n2", kind: "note", degree: 2 },
    { id: "n1", kind: "note", degree: 1 },
    { id: "n0", kind: "note", degree: 0 },
  ];
  const KITS = [
    { id: "studio", label: "Studio" },
    { id: "arcade", label: "Arcade" },
    { id: "dream", label: "Dream" },
    { id: "boom", label: "Boom" },
  ];
  const MOODS = [
    { id: "bright", label: "Bright" },
    { id: "moody", label: "Moody" },
  ];
  const KEYS = ["C", "D", "E", "F", "G", "A", "Bb"];
  const KEY_PC = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, Bb: 10 };
  const MAJOR_PENT = [0, 2, 4, 7, 9];
  const MINOR_PENT = [0, 3, 5, 7, 10];
  const NAMES_SHARP = ["C", "C♯", "D", "D♯", "E", "F", "F♯", "G", "G♯", "A", "A♯", "B"];
  const NAMES_FLAT = ["C", "D♭", "D", "E♭", "E", "F", "G♭", "G", "A♭", "A", "B♭", "B"];

  const $ = (id) => document.getElementById(id);

  function emptySteps() {
    const steps = {};
    for (const t of TRACKS) steps[t.id] = Array(STEP_COUNT).fill(false);
    return steps;
  }
  function cloneSteps(steps) {
    const out = {};
    for (const t of TRACKS) out[t.id] = steps[t.id].slice();
    return out;
  }
  function pat(str) {
    return str.replace(/\s+/g, "").split("").map((c) => c === "x");
  }
  function midiHz(midi) {
    return 440 * Math.pow(2, (midi - 69) / 12);
  }
  function noteMidi(degree, key, mood) {
    const scale = mood === "bright" ? MAJOR_PENT : MINOR_PENT;
    return 60 + KEY_PC[key] + scale[degree];
  }
  function noteLabel(degree, key, mood) {
    const midi = noteMidi(degree, key, mood);
    const names = key === "Bb" || mood === "moody" ? NAMES_FLAT : NAMES_SHARP;
    return names[((midi % 12) + 12) % 12];
  }

  const PRESETS = {
    first: {
      name: "First Beat",
      bpm: 110,
      swing: 8,
      kit: "studio",
      mood: "bright",
      key: "C",
      steps: {
        kick: pat("x... x... x... x..."),
        snare: pat(".... x... .... x..."),
        hat: pat("x.x. x.x. x.x. x.x."),
        clap: pat(".... .... .... ...."),
        n4: pat(".... .... .... ...."),
        n3: pat(".... .... .... x..."),
        n2: pat(".... .... x... ...."),
        n1: pat(".... .... .... ...."),
        n0: pat("x... .... x... ...."),
      },
    },
    clap: {
      name: "Clap Class",
      bpm: 100,
      swing: 18,
      kit: "studio",
      mood: "bright",
      key: "G",
      steps: {
        kick: pat("x... .... x... ...."),
        snare: pat(".... x... .... x..."),
        hat: pat("xxxx x.x. xxxx x.x."),
        clap: pat(".... x... .... x.x."),
        n4: pat(".... .... .... x..."),
        n3: pat(".... x... .... ...."),
        n2: pat(".... .... x... ...."),
        n1: pat(".... .... .... ...."),
        n0: pat("x....... x......."),
      },
    },
    recess: {
      name: "Recess",
      bpm: 118,
      swing: 6,
      kit: "arcade",
      mood: "bright",
      key: "D",
      steps: {
        kick: pat("x..x ..x. x... x.x."),
        snare: pat(".... x... ..x. x..."),
        hat: pat("x.x. x.xx x.x. x.x."),
        clap: pat(".... .... .... x..."),
        n4: pat("..x. .... ..x. ...."),
        n3: pat(".... x... .... x..."),
        n2: pat("x... .... x... ...."),
        n1: pat(".... ..x. .... ...."),
        n0: pat("x... .... .... x..."),
      },
    },
    night: {
      name: "Night Walk",
      bpm: 92,
      swing: 22,
      kit: "dream",
      mood: "moody",
      key: "A",
      steps: {
        kick: pat("x... .... x... ...."),
        snare: pat(".... .... .... x..."),
        hat: pat("..x. ..x. ..x. ..x."),
        clap: pat(".... .... .... ...."),
        n4: pat(".... .... .... ...."),
        n3: pat(".... .... x... ...."),
        n2: pat(".... x... .... x..."),
        n1: pat(".... .... .... ...."),
        n0: pat("x....... .... x..."),
      },
    },
    boom: {
      name: "Locker Boom",
      bpm: 88,
      swing: 12,
      kit: "boom",
      mood: "moody",
      key: "C",
      steps: {
        kick: pat("x... .... x... .x.."),
        snare: pat(".... x... .... x..."),
        hat: pat("x... x... x... x.x."),
        clap: pat(".... x... .... ...."),
        n4: pat(".... .... .... ...."),
        n3: pat(".... .... .... x..."),
        n2: pat(".... .... x... ...."),
        n1: pat(".... x... .... ...."),
        n0: pat("x... .... x... ...."),
      },
    },
    blank: {
      name: "Blank page",
      bpm: 110,
      swing: 0,
      kit: "studio",
      mood: "bright",
      key: "C",
      steps: emptySteps(),
    },
  };

  function randomize(mood) {
    const steps = emptySteps();
    steps.kick[0] = steps.kick[8] = true;
    if (Math.random() > 0.35) steps.kick[4] = true;
    if (Math.random() > 0.55) steps.kick[10] = true;
    if (Math.random() > 0.7) steps.kick[14] = true;
    if (Math.random() > 0.8) steps.kick[6] = true;
    steps.snare[4] = steps.snare[12] = true;
    if (Math.random() > 0.65) steps.snare[7] = true;
    if (Math.random() > 0.8) steps.snare[15] = true;
    const hatStyle = Math.random();
    if (hatStyle < 0.34) {
      for (let i = 0; i < 16; i += 2) steps.hat[i] = true;
    } else if (hatStyle < 0.7) {
      for (let i = 0; i < 16; i++) steps.hat[i] = Math.random() > 0.28;
    } else {
      for (let i = 1; i < 16; i += 2) steps.hat[i] = true;
    }
    if (Math.random() > 0.45) {
      steps.clap[4] = steps.clap[12] = true;
    }
    if (Math.random() > 0.75) steps.clap[14] = true;
    const motif = Array.from({ length: 3 + Math.floor(Math.random() * 2) }, () =>
      Math.floor(Math.random() * 5),
    );
    const start = Math.random() > 0.5 ? 0 : 2;
    const spacing = Math.random() > 0.45 ? 4 : 2;
    let mi = 0;
    for (let i = start; i < 16; i += spacing) {
      if (Math.random() > 0.18) {
        steps[`n${motif[mi % motif.length]}`][i] = true;
        mi += 1;
      }
    }
    if (mood === "moody") {
      for (let i = 1; i < 16; i += 2) if (Math.random() > 0.7) steps.hat[i] = false;
    }
    return steps;
  }

  const NAMES = [
    "Locker", "Hallway", "Late Bell", "Comet", "Pixel", "Pocket", "Skyline", "Paper",
  ];
  const NOUNS = ["Beat", "Loop", "Jam", "Pulse", "Drop", "Sketch"];
  function funName() {
    return `${NAMES[Math.floor(Math.random() * NAMES.length)]} ${NOUNS[Math.floor(Math.random() * NOUNS.length)]}`;
  }

  const state = {
    name: PRESETS.first.name,
    bpm: PRESETS.first.bpm,
    swing: PRESETS.first.swing,
    kit: PRESETS.first.kit,
    mood: PRESETS.first.mood,
    key: PRESETS.first.key,
    steps: cloneSteps(PRESETS.first.steps),
    muted: Object.fromEntries(TRACKS.map((t) => [t.id, false])),
    volume: 0.8,
    playing: false,
    playhead: -1,
    bank: 0,
    library: [],
  };

  function loadLibrary() {
    try {
      const raw = localStorage.getItem(STORAGE);
      if (!raw) return;
      const data = JSON.parse(raw);
      if (Array.isArray(data.library)) state.library = data.library;
    } catch {
      /* ignore */
    }
  }
  function persistLibrary() {
    try {
      localStorage.setItem(STORAGE, JSON.stringify({ library: state.library }));
    } catch {
      /* ignore */
    }
  }

  class Engine {
    constructor() {
      this.ctx = null;
      this.timer = 0;
      this.nextTime = 0;
      this.step = 0;
      this.lookahead = 0.12;
      this.interval = 25;
      this.master = null;
      this.comp = null;
      this.analyser = null;
      this.delay = null;
      this.delayGain = null;
      this.noise = null;
      this.queued = [];
    }
    unlock() {
      if (!this.ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AC({ latencyHint: "interactive" });
        this.buildGraph();
      }
      if (this.ctx.state === "suspended") this.ctx.resume();
    }
    buildGraph() {
      const ctx = this.ctx;
      this.master = ctx.createGain();
      this.master.gain.value = 0.7;
      this.comp = ctx.createDynamicsCompressor();
      this.comp.threshold.value = -14;
      this.comp.knee.value = 18;
      this.comp.ratio.value = 3.5;
      this.comp.attack.value = 0.003;
      this.comp.release.value = 0.14;
      this.analyser = ctx.createAnalyser();
      this.analyser.fftSize = 64;
      this.delay = ctx.createDelay(0.5);
      this.delay.delayTime.value = 0.22;
      const fb = ctx.createGain();
      fb.gain.value = 0.22;
      this.delayGain = ctx.createGain();
      this.delayGain.gain.value = 0;
      this.delay.connect(fb);
      fb.connect(this.delay);
      this.delay.connect(this.delayGain);
      this.delayGain.connect(this.comp);
      this.master.connect(this.comp);
      this.master.connect(this.delay);
      this.comp.connect(this.analyser);
      this.analyser.connect(ctx.destination);
      const buf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
      this.noise = buf;
    }
    setVolume(v) {
      if (!this.master) return;
      const now = this.ctx.currentTime;
      this.master.gain.setTargetAtTime(Math.max(0.0001, v * v * 0.85), now, 0.03);
    }
    setKit(kit) {
      if (!this.delayGain) return;
      const wet = kit === "dream" ? 0.22 : kit === "arcade" ? 0.04 : 0;
      this.delayGain.gain.setTargetAtTime(wet, this.ctx.currentTime, 0.05);
    }
    env(gain, t, peak, dur, attack = 0.004) {
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(Math.max(0.001, peak), t + attack);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    }
    noiseBurst(dest, t, dur, filterType, freq, q, peak) {
      const src = this.ctx.createBufferSource();
      src.buffer = this.noise;
      const filt = this.ctx.createBiquadFilter();
      filt.type = filterType;
      filt.frequency.setValueAtTime(freq, t);
      filt.Q.value = q;
      const g = this.ctx.createGain();
      this.env(g, t, peak, dur, 0.002);
      src.connect(filt);
      filt.connect(g);
      g.connect(dest);
      src.start(t);
      src.stop(t + dur + 0.02);
    }
    osc(dest, t, type, startF, endF, dur, peak, attack = 0.005) {
      const o = this.ctx.createOscillator();
      o.type = type;
      o.frequency.setValueAtTime(startF, t);
      if (endF && endF !== startF) o.frequency.exponentialRampToValueAtTime(endF, t + Math.min(dur, 0.12));
      const g = this.ctx.createGain();
      this.env(g, t, peak, dur, attack);
      o.connect(g);
      g.connect(dest);
      o.start(t);
      o.stop(t + dur + 0.03);
    }
    trigger(id, t, kit, key, mood) {
      const dest = this.master;
      const k = kit;
      if (id === "kick") {
        if (k === "boom") {
          this.osc(dest, t, "sine", 90, 38, 0.7, 1.05, 0.002);
        } else if (k === "arcade") {
          this.osc(dest, t, "square", 140, 48, 0.14, 0.35, 0.001);
        } else {
          this.osc(dest, t, "sine", 170, 42, 0.32, 0.95, 0.002);
          this.osc(dest, t, "triangle", 80, 40, 0.08, 0.2, 0.001);
        }
        return;
      }
      if (id === "snare") {
        this.noiseBurst(dest, t, k === "boom" ? 0.22 : 0.14, "bandpass", 1800, 0.9, 0.55);
        this.osc(dest, t, "triangle", 210, 140, 0.12, 0.28);
        return;
      }
      if (id === "hat") {
        const dur = k === "dream" ? 0.12 : k === "arcade" ? 0.03 : 0.045;
        this.noiseBurst(dest, t, dur, "highpass", 7000, 0.6, 0.28);
        return;
      }
      if (id === "clap") {
        this.noiseBurst(dest, t, 0.04, "bandpass", 1200, 1.2, 0.5);
        this.noiseBurst(dest, t + 0.018, 0.05, "bandpass", 1400, 1, 0.38);
        this.noiseBurst(dest, t + 0.038, 0.08, "highpass", 900, 0.7, 0.22);
        return;
      }
      const track = TRACKS.find((tr) => tr.id === id);
      if (!track || track.kind !== "note") return;
      const hz = midiHz(noteMidi(track.degree, key, mood));
      const isBass = track.degree <= 1;
      if (k === "arcade") {
        this.osc(dest, t, "square", hz, hz, isBass ? 0.22 : 0.12, isBass ? 0.28 : 0.2);
      } else if (k === "dream") {
        this.osc(dest, t, "sine", hz, hz, 0.7, 0.28, 0.02);
        this.osc(dest, t, "triangle", hz * 1.004, hz * 1.004, 0.55, 0.12, 0.02);
      } else if (k === "boom") {
        this.osc(dest, t, "sine", hz / (isBass ? 1 : 1), hz, isBass ? 0.45 : 0.22, 0.32);
      } else {
        this.osc(dest, t, "sawtooth", hz, hz, isBass ? 0.32 : 0.2, isBass ? 0.22 : 0.16, 0.008);
        this.osc(dest, t, "triangle", hz * 1.006, hz * 1.006, isBass ? 0.28 : 0.18, 0.12, 0.008);
      }
    }
    preview(id) {
      this.unlock();
      this.trigger(id, this.ctx.currentTime + 0.01, state.kit, state.key, state.mood);
    }
    scheduler = () => {
      if (!this.ctx || !state.playing) return;
      const ctx = this.ctx;
      while (this.nextTime < ctx.currentTime + this.lookahead) {
        const step = this.step;
        const when = this.nextTime;
        this.queued.push({ step, when });
        for (const t of TRACKS) {
          if (state.muted[t.id]) continue;
          if (state.steps[t.id][step]) this.trigger(t.id, when, state.kit, state.key, state.mood);
        }
        const sixteenth = 60 / state.bpm / 4;
        const swingAmt = (state.swing / 100) * 0.55;
        if (step % 2 === 0) this.nextTime += sixteenth * (1 + swingAmt);
        else this.nextTime += sixteenth * (1 - swingAmt);
        this.step = (this.step + 1) % STEP_COUNT;
      }
    };
    play() {
      this.unlock();
      if (state.playing) return;
      state.playing = true;
      this.step = 0;
      this.nextTime = this.ctx.currentTime + 0.06;
      this.queued = [];
      this.setVolume(state.volume);
      this.setKit(state.kit);
      this.scheduler();
      this.timer = window.setInterval(this.scheduler, this.interval);
    }
    stop() {
      state.playing = false;
      state.playhead = -1;
      if (this.timer) {
        clearInterval(this.timer);
        this.timer = 0;
      }
      this.queued = [];
    }
    currentStep() {
      if (!this.ctx || !state.playing) return -1;
      const now = this.ctx.currentTime;
      let step = -1;
      this.queued = this.queued.filter((q) => q.when > now - 0.5);
      for (const q of this.queued) {
        if (q.when <= now) step = q.step;
      }
      return step;
    }
  }

  const engine = new Engine();

  function applyPreset(p) {
    state.name = p.name;
    state.bpm = p.bpm;
    state.swing = p.swing;
    state.kit = p.kit;
    state.mood = p.mood;
    state.key = p.key;
    state.steps = cloneSteps(p.steps);
    $("bpm").value = String(p.bpm);
    $("swing").value = String(p.swing);
    renderAll();
  }

  function renderChips(el, items, current, onPick, labelKey = "label") {
    el.innerHTML = "";
    for (const item of items) {
      const id = typeof item === "string" ? item : item.id;
      const label = typeof item === "string" ? (id === "Bb" ? "B♭" : id) : item[labelKey];
      const b = document.createElement("button");
      b.type = "button";
      b.className = "btn" + (id === current ? " on" : "");
      b.textContent = label;
      b.addEventListener("click", () => onPick(id));
      el.appendChild(b);
    }
  }

  function renderGrid() {
    const grid = $("grid");
    grid.classList.toggle("is-b0", state.bank === 0);
    grid.classList.toggle("is-b1", state.bank === 1);
    const head = ['<div></div>'];
    for (let i = 0; i < STEP_COUNT; i++) {
      const bank = i < 8 ? "bank0" : "bank1";
      head.push(`<div class="nums ${bank}">${i + 1}</div>`);
    }
    const rows = [];
    for (const t of TRACKS) {
      const label = t.kind === "note" ? noteLabel(t.degree, state.key, state.mood) : t.label;
      const muted = state.muted[t.id] ? " muted" : "";
      rows.push(
        `<button type="button" class="lab${muted}" data-preview="${t.id}" title="Hear ${label}">${label}</button>`,
      );
      for (let i = 0; i < STEP_COUNT; i++) {
        const on = state.steps[t.id][i];
        const beat = i % 4 === 0 ? " beat" : "";
        const play = state.playhead === i ? " play" : "";
        const bank = i < 8 ? "bank0" : "bank1";
        rows.push(
          `<button type="button" class="cell${beat}${on ? " on" : ""}${play} ${bank}" data-track="${t.id}" data-step="${i}" aria-pressed="${on}" aria-label="${label} step ${i + 1}"></button>`,
        );
      }
    }
    grid.innerHTML = head.join("") + rows.join("");
  }

  function renderAll() {
    $("song-name").textContent = state.name;
    $("lcd-bpm").textContent = `${state.bpm} BPM`;
    $("lcd-kit").textContent = KITS.find((k) => k.id === state.kit).label;
    $("lcd-key").textContent = `${state.key === "Bb" ? "B♭" : state.key} ${state.mood === "bright" ? "Bright" : "Moody"}`;
    renderChips($("kits"), KITS, state.kit, (id) => {
      state.kit = id;
      engine.setKit(id);
      renderAll();
    });
    renderChips($("moods"), MOODS, state.mood, (id) => {
      state.mood = id;
      renderAll();
    });
    renderChips($("keys"), KEYS, state.key, (id) => {
      state.key = id;
      renderAll();
    });
    $("play-btn").classList.toggle("is-on", state.playing);
    $("play-btn").setAttribute("aria-label", state.playing ? "Pause" : "Play");
    document.querySelectorAll("[data-bank]").forEach((b) => {
      b.classList.toggle("on", Number(b.dataset.bank) === state.bank);
    });
    renderGrid();
  }

  function setPlayhead(step) {
    if (step === state.playhead) return;
    state.playhead = step;
    if (step >= 0) {
      const nextBank = step < 8 ? 0 : 1;
      if (nextBank !== state.bank && window.matchMedia("(max-width: 760px)").matches) {
        state.bank = nextBank;
        $("grid").classList.toggle("is-b0", state.bank === 0);
        $("grid").classList.toggle("is-b1", state.bank === 1);
        document.querySelectorAll("[data-bank]").forEach((b) => {
          b.classList.toggle("on", Number(b.dataset.bank) === state.bank);
        });
      }
      $("lcd-pos").textContent = `${Math.floor(step / 4) + 1}.${(step % 4) + 1}`;
    }
    $("grid").querySelectorAll("[data-step]").forEach((el) => {
      const s = Number(el.dataset.step);
      el.classList.toggle("play", s === step);
    });
  }

  let paint = null;
  $("grid").addEventListener("pointerdown", (e) => {
    const preview = e.target.closest("[data-preview]");
    if (preview) {
      engine.preview(preview.dataset.preview);
      return;
    }
    const cell = e.target.closest("[data-track]");
    if (!cell) return;
    const track = cell.dataset.track;
    const step = Number(cell.dataset.step);
    const next = !state.steps[track][step];
    state.steps[track][step] = next;
    cell.classList.toggle("on", next);
    cell.setAttribute("aria-pressed", String(next));
    paint = { value: next, pointerId: e.pointerId };
    if (e.pointerType === "mouse" || e.pointerType === "pen") {
      cell.setPointerCapture(e.pointerId);
    }
  });
  $("grid").addEventListener("pointerenter", (e) => {
    if (!paint || e.pointerType === "touch") return;
    const cell = e.target.closest("[data-track]");
    if (!cell) return;
    const track = cell.dataset.track;
    const step = Number(cell.dataset.step);
    state.steps[track][step] = paint.value;
    cell.classList.toggle("on", paint.value);
    cell.setAttribute("aria-pressed", String(paint.value));
  }, true);
  $("grid").addEventListener("pointerup", () => {
    paint = null;
  });
  $("grid").addEventListener("pointercancel", () => {
    paint = null;
  });

  $("play-btn").addEventListener("click", () => {
    engine.unlock();
    if (state.playing) engine.stop();
    else engine.play();
    renderAll();
  });
  $("stop-btn").addEventListener("click", () => {
    engine.stop();
    renderAll();
  });
  $("bpm").addEventListener("input", (e) => {
    state.bpm = Number(e.target.value);
    $("lcd-bpm").textContent = `${state.bpm} BPM`;
  });
  $("swing").addEventListener("input", (e) => {
    state.swing = Number(e.target.value);
  });
  $("vol").addEventListener("input", (e) => {
    state.volume = Number(e.target.value) / 100;
    engine.setVolume(state.volume);
  });
  document.querySelectorAll("[data-bank]").forEach((b) => {
    b.addEventListener("click", () => {
      state.bank = Number(b.dataset.bank);
      renderAll();
    });
  });
  $("help-btn").addEventListener("click", () => {
    const box = $("help");
    box.hidden = !box.hidden;
    $("help-btn").setAttribute("aria-expanded", String(!box.hidden));
  });
  $("surprise-btn").addEventListener("click", () => {
    if (Math.random() > 0.55) state.kit = KITS[Math.floor(Math.random() * KITS.length)].id;
    if (Math.random() > 0.6) state.mood = Math.random() > 0.5 ? "bright" : "moody";
    state.bpm = 88 + Math.floor(Math.random() * 36);
    state.swing = Math.floor(Math.random() * 28);
    $("bpm").value = String(state.bpm);
    $("swing").value = String(state.swing);
    state.steps = randomize(state.mood);
    state.name = funName();
    engine.setKit(state.kit);
    renderAll();
  });
  $("clear-btn").addEventListener("click", () => {
    openModal("Clear the grid?", "This wipes the squares. Saved beats stay.", () => {
      state.steps = emptySteps();
      state.name = "Blank page";
      renderAll();
      $("modal").close();
    }, "Clear");
  });

  const modal = $("modal");
  const modalBody = $("modal-body");
  let modalAction = null;
  function openModal(title, desc, onOk, okLabel) {
    $("modal-title").textContent = title;
    $("modal-desc").textContent = desc;
    $("modal-ok").textContent = okLabel || "OK";
    $("modal-ok").hidden = !onOk;
    modalAction = onOk;
    modal.showModal();
  }
  $("modal-cancel").addEventListener("click", () => modal.close());
  $("modal-form").addEventListener("submit", (e) => {
    e.preventDefault();
    if (modalAction) modalAction();
    else modal.close();
  });

  $("preset-btn").addEventListener("click", () => {
    modalBody.innerHTML = "";
    const list = document.createElement("ul");
    list.className = "saved-list";
    for (const p of Object.values(PRESETS)) {
      const li = document.createElement("li");
      const b = document.createElement("button");
      b.type = "button";
      b.className = "btn";
      b.textContent = p.name;
      b.addEventListener("click", () => {
        applyPreset(p);
        modal.close();
      });
      li.appendChild(b);
      list.appendChild(li);
    }
    modalBody.appendChild(list);
    openModal("Starter beats", "Pick a pattern that already grooves.", null, "OK");
    $("modal-ok").hidden = true;
  });

  $("save-btn").addEventListener("click", () => {
    modalBody.innerHTML = "";
    const input = document.createElement("input");
    input.id = "save-name";
    input.maxLength = 32;
    input.value = state.name === "Blank page" ? funName() : state.name;
    input.setAttribute("aria-label", "Beat name");
    modalBody.appendChild(input);
    openModal("Save this beat", "Stored on this Chromebook only.", () => {
      const name = input.value.trim() || funName();
      state.name = name;
      state.library.unshift({
        id: String(Date.now()),
        name,
        bpm: state.bpm,
        swing: state.swing,
        kit: state.kit,
        mood: state.mood,
        key: state.key,
        steps: cloneSteps(state.steps),
        savedAt: Date.now(),
      });
      state.library = state.library.slice(0, 18);
      persistLibrary();
      renderAll();
      modal.close();
    }, "Save");
    setTimeout(() => input.focus(), 50);
  });

  $("library-btn").addEventListener("click", () => {
    modalBody.innerHTML = "";
    if (!state.library.length) {
      openModal("My beats", "Nothing saved yet. Make a loop, then hit Save.", null);
      $("modal-ok").hidden = true;
      return;
    }
    const list = document.createElement("ul");
    list.className = "saved-list";
    for (const item of state.library) {
      const li = document.createElement("li");
      const load = document.createElement("button");
      load.type = "button";
      load.className = "btn";
      load.textContent = item.name;
      load.addEventListener("click", () => {
        applyPreset(item);
        modal.close();
      });
      const del = document.createElement("button");
      del.type = "button";
      del.className = "btn danger";
      del.textContent = "Remove";
      del.addEventListener("click", () => {
        state.library = state.library.filter((x) => x.id !== item.id);
        persistLibrary();
        $("library-btn").click();
      });
      li.append(load, del);
      list.appendChild(li);
    }
    modalBody.appendChild(list);
    openModal("My beats", "Load a saved loop from this Chromebook.", null);
    $("modal-ok").hidden = true;
  });

  $("start-btn").addEventListener("click", () => {
    engine.unlock();
    $("gate").hidden = true;
    engine.play();
    renderAll();
  });

  document.addEventListener("keydown", (e) => {
    if (e.target.matches("input, textarea")) return;
    if (e.code === "Space") {
      e.preventDefault();
      if ($("gate").hidden === false) return;
      engine.unlock();
      if (state.playing) engine.stop();
      else engine.play();
      renderAll();
    }
  });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && engine.ctx) engine.ctx.resume();
  });

  const viz = $("viz");
  const vctx = viz.getContext("2d");
  const bins = new Uint8Array(32);
  function drawViz() {
    requestAnimationFrame(drawViz);
    const step = engine.currentStep();
    if (step !== state.playhead) setPlayhead(step);
    vctx.clearRect(0, 0, viz.width, viz.height);
    if (!engine.analyser) {
      vctx.fillStyle = "#16324f";
      for (let i = 0; i < 16; i++) {
        const h = 8 + (i % 4) * 4;
        vctx.fillRect(8 + i * 16, viz.height - h - 8, 10, h);
      }
      return;
    }
    engine.analyser.getByteFrequencyData(bins);
    const n = 16;
    const w = viz.width / n;
    for (let i = 0; i < n; i++) {
      const v = bins[i] / 255;
      const h = Math.max(4, v * (viz.height - 10));
      vctx.fillStyle = i === state.playhead ? "#e8f7ff" : "#14b8a6";
      vctx.fillRect(i * w + 3, viz.height - h - 4, w - 6, h);
    }
  }

  loadLibrary();
  renderAll();
  drawViz();
})();
