(() => {
  if (window.__BERTYBEATZ__ === "1.5.0") return;
  window.__BERTYBEATZ__ = "1.5.0";
  const STEP_COUNT = 16;
  const CHIP = "BZ 1.5.0";
  const STORAGE = "bertybeatz.v1";
  const LOOK_STORE = "bertybeatz.look";
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
  const LOOKS = (window.KulibertStage && window.KulibertStage.LOOKS) || [
    { id: "bars", label: "Bars" },
    { id: "kaleido", label: "Kaleidoscope" },
    { id: "clouds", label: "Clouds" },
    { id: "stars", label: "Stars" },
    { id: "code", label: "Code" },
  ];
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

  function packBits(arr) {
    let n = 0;
    for (let i = 0; i < STEP_COUNT; i++) if (arr[i]) n |= 1 << i;
    return n.toString(16).padStart(4, "0");
  }

  function cleanTitle(name) {
    return String(name || "Beat")
      .replace(/[~]/g, "-")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 24) || "Beat";
  }

  function packBeat() {
    const bits = TRACKS.map((t) => packBits(state.steps[t.id])).join("");
    return `BZ1~${cleanTitle(state.name)}~${state.bpm}~${state.swing}~${state.kit}~${state.mood}~${state.key}~${bits}`;
  }

  function unpackBeat(raw) {
    if (!raw) return null;
    let text = String(raw).trim();
    const fromUrl = text.match(/[?&]b=([^&\s]+)/i);
    if (fromUrl) text = fromUrl[1];
    try {
      text = decodeURIComponent(text);
    } catch {
      /* already decoded */
    }
    const parts = text.split("~");
    if (parts.length < 8 || parts[0] !== "BZ1") return null;
    const name = cleanTitle(parts[1]);
    const kit = parts[4];
    const mood = parts[5];
    const key = parts[6];
    const bits = parts[7];
    if (bits.length !== TRACKS.length * 4) return null;
    if (!KITS.some((k) => k.id === kit)) return null;
    if (!MOODS.some((m) => m.id === mood)) return null;
    if (!KEYS.includes(key)) return null;
    const steps = emptySteps();
    TRACKS.forEach((t, ti) => {
      const n = parseInt(bits.slice(ti * 4, ti * 4 + 4), 16);
      if (Number.isNaN(n)) return;
      for (let i = 0; i < STEP_COUNT; i++) steps[t.id][i] = Boolean(n & (1 << i));
    });
    return {
      name,
      bpm: Math.min(160, Math.max(70, Number(parts[2]) || 110)),
      swing: Math.min(60, Math.max(0, Number(parts[3]) || 0)),
      kit,
      mood,
      key,
      steps,
    };
  }

  function fileSlug(name) {
    return cleanTitle(name).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "beat";
  }
  function downloadFile(filename, text, mime) {
    const blob = new Blob([text], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1500);
  }
  function beatFile() {
    return {
      app: "bertybeatz",
      format: 1,
      name: cleanTitle(state.name),
      bpm: state.bpm,
      swing: state.swing,
      kit: state.kit,
      mood: state.mood,
      key: state.key,
      steps: cloneSteps(state.steps),
      code: packBeat(),
    };
  }
  function beatFromFileText(raw) {
    const trimmed = String(raw || "").trim();
    if (!trimmed) return null;
    if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
      let data;
      try {
        data = JSON.parse(trimmed);
      } catch {
        return null;
      }
      if (typeof data === "string") return unpackBeat(data);
      if (data && typeof data.code === "string" && !data.steps) return unpackBeat(data.code);
      if (!data || !data.steps || typeof data.steps !== "object") return null;
      const kit = data.kit;
      const mood = data.mood;
      const key = data.key;
      if (!KITS.some((k) => k.id === kit)) return null;
      if (!MOODS.some((m) => m.id === mood)) return null;
      if (!KEYS.includes(key)) return null;
      const steps = emptySteps();
      for (const t of TRACKS) {
        const row = data.steps[t.id];
        if (!Array.isArray(row) || row.length !== STEP_COUNT) return null;
        steps[t.id] = row.map((cell) => Boolean(cell));
      }
      return {
        name: cleanTitle(data.name),
        bpm: Math.min(160, Math.max(70, Number(data.bpm) || 110)),
        swing: Math.min(60, Math.max(0, Number(data.swing) || 0)),
        kit,
        mood,
        key,
        steps,
      };
    }
    return unpackBeat(trimmed);
  }
  function flash(msg) {
    const el = $("status-line");
    if (el) el.textContent = msg;
  }
  function doorUrl(code) {
    const u = new URL(window.location.href);
    u.hash = "";
    u.search = "";
    u.pathname = u.pathname.replace(/index\.html$/, "");
    u.searchParams.set("b", code);
    return u.toString();
  }

  async function copyText(value) {
    try {
      await navigator.clipboard.writeText(value);
      return true;
    } catch {
      const ta = document.createElement("textarea");
      ta.value = value;
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      ta.remove();
      return ok;
    }
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
    look: loadLook(),
  };

  function loadLibrary() {
    try {
      const raw = localStorage.getItem(STORAGE);
      if (!raw) return;
      const data = JSON.parse(raw);
      if (Array.isArray(data.library)) state.library = data.library;
      if (validNow(data.now)) pendingNow = data.now;
    } catch {
      /* ignore */
    }
  }
  function validNow(now) {
    if (!now || typeof now !== "object" || !now.steps) return false;
    if (!KITS.some((k) => k.id === now.kit)) return false;
    if (!MOODS.some((m) => m.id === now.mood)) return false;
    if (!KEYS.includes(now.key)) return false;
    for (const t of TRACKS) {
      const row = now.steps[t.id];
      if (!Array.isArray(row) || row.length !== STEP_COUNT) return false;
    }
    return true;
  }
  function snapshotNow() {
    return {
      name: cleanTitle(state.name),
      bpm: state.bpm,
      swing: state.swing,
      kit: state.kit,
      mood: state.mood,
      key: state.key,
      volume: state.volume,
      steps: cloneSteps(state.steps),
    };
  }
  function persistLibrary() {
    flushNow();
  }
  let saveTimer = 0;
  function remember() {
    window.clearTimeout(saveTimer);
    saveTimer = window.setTimeout(flushNow, 280);
  }
  function flushNow() {
    try {
      localStorage.setItem(
        STORAGE,
        JSON.stringify({ library: state.library, now: snapshotNow() }),
      );
    } catch {
      /* ignore */
    }
  }
  const undoStack = [];
  function pushUndo() {
    undoStack.push(snapshotNow());
    if (undoStack.length > 16) undoStack.shift();
    const btn = $("undo-btn");
    if (btn) btn.disabled = false;
  }
  function undo() {
    const prev = undoStack.pop();
    if (!prev) return;
    applyPreset(prev);
    if (typeof prev.volume === "number") {
      state.volume = Math.min(1, Math.max(0, prev.volume));
      const vol = $("vol");
      if (vol) vol.value = String(Math.round(state.volume * 100));
      engine.setVolume(state.volume);
    }
    const btn = $("undo-btn");
    if (btn) btn.disabled = undoStack.length === 0;
    flushNow();
  }
  let pendingNow = null;

  class Engine {
    constructor() {
      this.ctx = null;
      this.timer = 0;
      this.nextTime = 0;
      this.step = 0;
      this.lookahead = 0.12;
      this.interval = 25;
      this.master = null;
      this.volNode = null;
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
      this.master.gain.value = 1;
      this.volNode = ctx.createGain();
      this.volNode.gain.value = 0.7;
      this.comp = ctx.createDynamicsCompressor();
      this.comp.threshold.value = -14;
      this.comp.knee.value = 18;
      this.comp.ratio.value = 3.5;
      this.comp.attack.value = 0.003;
      this.comp.release.value = 0.14;
      this.analyser = ctx.createAnalyser();
      this.analyser.fftSize = 128;
      this.analyser.smoothingTimeConstant = 0.72;
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
      this.analyser.connect(this.volNode);
      this.volNode.connect(ctx.destination);
      const buf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
      this.noise = buf;
    }
    setVolume(v) {
      if (!this.volNode) return;
      const now = this.ctx.currentTime;
      this.volNode.gain.setTargetAtTime(Math.max(0.0001, v * v * 0.85), now, 0.03);
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
    if (!el) return;
    el.innerHTML = "";
    for (const item of items) {
      const id = typeof item === "string" ? item : item.id;
      const label = typeof item === "string" ? (id === "Bb" ? "B♭" : id) : item[labelKey];
      const b = document.createElement("button");
      b.type = "button";
      b.className = "btn" + (id === current ? " on" : "");
      b.textContent = label;
      b.setAttribute("aria-pressed", String(id === current));
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
    const lookName = LOOKS.find((l) => l.id === state.look)?.label || "Bars";
    const live = $("look-live");
    if (live) live.textContent = lookName;
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
    renderChips($("looks"), LOOKS, state.look, (id) => {
      state.look = id;
      persistLook(id);
      renderAll();
    });
    const recipe = $("code-look");
    if (recipe) {
      recipe.hidden = state.look !== "code";
      if (state.look === "code" && window.KulibertStage && window.KulibertStage.syncRecipe) {
        window.KulibertStage.syncRecipe(recipe);
      }
    }
    $("play-btn").classList.toggle("is-on", state.playing);
    $("play-btn").setAttribute("aria-label", state.playing ? "Pause" : "Play");
    document.body.classList.toggle("is-loop", state.playing);
    document.querySelectorAll("[data-bank]").forEach((b) => {
      b.classList.toggle("on", Number(b.dataset.bank) === state.bank);
    });
    renderGrid();
    remember();
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
    $("grid").querySelectorAll(".nums").forEach((el, i) => {
      el.classList.toggle("play", i === step);
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
    if (!paint) pushUndo();
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
    if (paint) remember();
    paint = null;
  });
  $("grid").addEventListener("pointercancel", () => {
    paint = null;
  });

  function safeUnlock() {
    try {
      engine.unlock();
    } catch {
      /* Chromebook audio can fail. Lights still run. */
    }
  }
  $("play-btn").addEventListener("click", () => {
    safeUnlock();
    try {
      if (state.playing) engine.stop();
      else engine.play();
    } catch {
      state.playing = false;
    }
    renderAll();
  });
  $("stop-btn").addEventListener("click", () => {
    engine.stop();
    renderAll();
  });
  $("bpm").addEventListener("input", (e) => {
    state.bpm = Number(e.target.value);
    $("lcd-bpm").textContent = `${state.bpm} BPM`;
    remember();
  });
  $("swing").addEventListener("input", (e) => {
    state.swing = Number(e.target.value);
    remember();
  });
  $("vol").addEventListener("input", (e) => {
    state.volume = Number(e.target.value) / 100;
    engine.setVolume(state.volume);
    remember();
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
    pushUndo();
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
    remember();
  });
  const undoBtn = $("undo-btn");
  if (undoBtn) undoBtn.addEventListener("click", () => undo());
  $("clear-btn").addEventListener("click", () => {
    openModal("Clear the grid?", "Undo brings the squares back. Saved beats stay.", () => {
      pushUndo();
      state.steps = emptySteps();
      state.name = "Blank page";
      renderAll();
      remember();
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
        pushUndo();
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
        pushUndo();
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

  $("pass-btn").addEventListener("click", () => {
    const code = packBeat();
    const link = doorUrl(code);
    modalBody.innerHTML = "";
    const codeBox = document.createElement("textarea");
    codeBox.readOnly = true;
    codeBox.value = code;
    codeBox.setAttribute("aria-label", "Pass code");
    codeBox.rows = 3;
    const copyCode = document.createElement("button");
    copyCode.type = "button";
    copyCode.className = "btn primary";
    copyCode.textContent = "Copy code";
    copyCode.addEventListener("click", async () => {
      const ok = await copyText(code);
      copyCode.textContent = ok ? "Copied" : "Copy failed";
    });
    const copyLink = document.createElement("button");
    copyLink.type = "button";
    copyLink.className = "btn";
    copyLink.textContent = "Copy door link";
    copyLink.addEventListener("click", async () => {
      const ok = await copyText(link);
      copyLink.textContent = ok ? "Link copied" : "Copy failed";
    });
    const paste = document.createElement("input");
    paste.id = "pass-paste";
    paste.placeholder = "Paste a code here";
    paste.setAttribute("aria-label", "Paste a pass code");
    const load = document.createElement("button");
    load.type = "button";
    load.className = "btn";
    load.textContent = "Load pasted code";
    load.addEventListener("click", () => {
      const beat = unpackBeat(paste.value);
      if (!beat) {
        paste.value = "";
        paste.placeholder = "That code did not load";
        return;
      }
      applyPreset(beat);
      remember();
      modal.close();
    });
    const row = document.createElement("div");
    row.className = "modal-actions";
    row.style.margin = "0 0 0.8rem";
    row.append(copyCode, copyLink);
    modalBody.append(codeBox, row, paste, load);
    openModal("Pass this beat", "No names. Copy the code or the door link. The next Chromebook pastes it, or opens the link.", null);
    $("modal-ok").hidden = true;
  });

  $("export-btn").addEventListener("click", () => {
    const file = beatFile();
    modalBody.innerHTML = "";
    const jsonBtn = document.createElement("button");
    jsonBtn.type = "button";
    jsonBtn.className = "btn primary";
    jsonBtn.textContent = "Download JSON";
    jsonBtn.addEventListener("click", () => {
      downloadFile(`${fileSlug(file.name)}.json`, JSON.stringify(file, null, 2), "application/json");
      flash(`Downloaded ${fileSlug(file.name)}.json`);
      modal.close();
    });
    const txtBtn = document.createElement("button");
    txtBtn.type = "button";
    txtBtn.className = "btn";
    txtBtn.textContent = "Download text";
    txtBtn.addEventListener("click", () => {
      downloadFile(`${fileSlug(file.name)}.txt`, file.code + "\n", "text/plain");
      flash(`Downloaded ${fileSlug(file.name)}.txt`);
      modal.close();
    });
    const row = document.createElement("div");
    row.className = "modal-actions";
    row.append(jsonBtn, txtBtn);
    modalBody.appendChild(row);
    openModal("Export this beat", "A file you can keep. No names. Save still stores it on this Chromebook.", null);
    $("modal-ok").hidden = true;
  });

  $("import-btn").addEventListener("click", () => {
    $("import-file").click();
  });
  $("import-file").addEventListener("change", () => {
    const input = $("import-file");
    const file = input.files && input.files[0];
    input.value = "";
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const beat = beatFromFileText(String(reader.result || ""));
      if (!beat) {
        flash("That file did not load.");
        return;
      }
      pushUndo();
      applyPreset(beat);
      remember();
      flash(`Imported ${beat.name}.`);
    };
    reader.onerror = () => flash("That file did not load.");
    reader.readAsText(file);
  });

  $("start-btn").addEventListener("click", () => {
    $("gate").hidden = true;
    safeUnlock();
    try {
      engine.play();
    } catch {
      state.playing = false;
    }
    renderAll();
  });

  document.addEventListener("keydown", (e) => {
    if (e.target.matches("input, textarea")) return;
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
      e.preventDefault();
      undo();
      return;
    }
    if (e.code === "Space") {
      e.preventDefault();
      if ($("gate").hidden === false) return;
      safeUnlock();
      try {
        if (state.playing) engine.stop();
        else engine.play();
      } catch {
        state.playing = false;
      }
      renderAll();
    }
    if (e.code === "Digit1") pickLook("bars");
    if (e.code === "Digit2") pickLook("kaleido");
    if (e.code === "Digit3") pickLook("clouds");
    if (e.code === "Digit4") pickLook("stars");
    if (e.code === "Digit5") pickLook("code");
  });
  function pickLook(id) {
    if ($("gate").hidden === false) return;
    state.look = id;
    persistLook(id);
    renderAll();
  }
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && engine.ctx) engine.ctx.resume();
  });

  const viz = $("viz");
  if (window.KulibertStage) {
    window.KulibertStage.mount(viz, () => {
      const step = engine.currentStep();
      if (step !== state.playhead) setPlayhead(step);
      const playhead = state.playhead;
      return {
        look: state.look,
        playing: state.playing,
        playhead,
        kick: playhead >= 0 && Boolean(state.steps.kick[playhead]),
        snare: playhead >= 0 && Boolean(state.steps.snare[playhead]),
        analyser: state.playing && engine.analyser ? engine.analyser : null,
        code: window.KulibertStage && window.KulibertStage.loadCode ? window.KulibertStage.loadCode() : null,
      };
    });
  }

  loadLibrary();
  const incoming = unpackBeat(new URLSearchParams(window.location.search).get("b") || "");
  if (incoming) applyPreset(incoming);
  else if (pendingNow) {
    applyPreset(pendingNow);
    if (typeof pendingNow.volume === "number") {
      state.volume = Math.min(1, Math.max(0, pendingNow.volume));
      const vol = $("vol");
      if (vol) vol.value = String(Math.round(state.volume * 100));
    }
  }
  window.addEventListener("pagehide", flushNow);
  ["gate-chip", "chip-label", "foot-chip"].forEach((id) => {
    const el = $(id);
    if (el) el.textContent = CHIP;
  });
  renderAll();
})();
