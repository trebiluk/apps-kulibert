(() => {
  if (window.__BERTYBEATZ__ === "1.9.3") return;
  window.__BERTYBEATZ__ = "1.9.3";
  const STEP_COUNT = 16;
  const CHIP = "BZ 1.9.3";
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
  const METERS = [
    { id: "4/4", label: "4/4", steps: 16, every: 4, accent: 16 },
    { id: "3/4", label: "3/4", steps: 12, every: 4, accent: 12 },
    { id: "2/4", label: "2/4", steps: 8, every: 4, accent: 8 },
    { id: "6/8", label: "6/8", steps: 12, every: 2, accent: 6 },
  ];
  const KEYS = ["C", "D", "E", "F", "G", "A", "Bb"];
  function meterNow() {
    return METERS.find((m) => m.id === state.meter) || METERS[0];
  }
  function loopLength() {
    return meterNow().steps;
  }
  function beatName(step) {
    return String(Math.floor(step / meterNow().every) + 1);
  }
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
  const PATTERN_IDS = ["A", "B", "C", "D"];
  function emptyBank() {
    const bank = {};
    for (const id of PATTERN_IDS) bank[id] = emptySteps();
    return bank;
  }
  function freshBank(steps) {
    const bank = emptyBank();
    bank.A = cloneSteps(steps);
    return bank;
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

  function funName() {
    return window.KulibertTitles ? window.KulibertTitles.pickTitle(state && state.name) : "Class beat";
  }

  function cleanTitle(name) {
    return window.KulibertTitles ? window.KulibertTitles.safeTitle(name, "Class beat") : "Class beat";
  }

  function packBits(arr) {
    let n = 0;
    for (let i = 0; i < STEP_COUNT; i++) if (arr[i]) n |= 1 << i;
    return n.toString(16).padStart(4, "0");
  }

  function packMix() {
    return TRACKS.map((t) => Math.round(state.mix[t.id] ?? 100).toString(16).padStart(2, "0")).join("");
  }
  function unpackMix(raw) {
    const mix = Object.fromEntries(TRACKS.map((t) => [t.id, 100]));
    if (!raw || raw.length < TRACKS.length * 2) return mix;
    TRACKS.forEach((t, i) => {
      const n = parseInt(raw.slice(i * 2, i * 2 + 2), 16);
      mix[t.id] = Number.isNaN(n) ? 100 : Math.min(100, Math.max(0, n));
    });
    return mix;
  }
  function packBank(bank) {
    return PATTERN_IDS.map((id) => TRACKS.map((t) => packBits(bank[id][t.id])).join("")).join(".");
  }
  function unpackBank(raw) {
    const bank = emptyBank();
    const chunks = String(raw || "").split(".");
    PATTERN_IDS.forEach((id, pi) => {
      const bits = chunks[pi] || "";
      if (bits.length !== TRACKS.length * 4) return;
      TRACKS.forEach((t, ti) => {
        const n = parseInt(bits.slice(ti * 4, ti * 4 + 4), 16);
        if (Number.isNaN(n)) return;
        for (let i = 0; i < STEP_COUNT; i++) bank[id][t.id][i] = Boolean(n & (1 << i));
      });
    });
    return bank;
  }
  function packBeat() {
    const bits = TRACKS.map((t) => packBits(state.steps[t.id])).join("");
    const song = (state.song || ["A"]).join("");
    return `BZ1~${cleanTitle(state.name)}~${state.bpm}~${state.swing}~${state.kit}~${state.mood}~${state.key}~${bits}~${state.humanize || 0}~${state.pattern}~${song}~${packMix()}~${packBank(state.patterns)}~${state.songOn ? 1 : 0}`;
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
    const beat = {
      name,
      bpm: Math.min(160, Math.max(70, Number(parts[2]) || 110)),
      swing: Math.min(60, Math.max(0, Number(parts[3]) || 0)),
      kit,
      mood,
      key,
      steps,
    };
    if (parts.length > 8 && parts[8] !== "") {
      beat.humanize = Math.min(40, Math.max(0, Number(parts[8]) || 0));
    }
    if (PATTERN_IDS.includes(parts[9])) beat.pattern = parts[9];
    if (parts[10]) {
      const song = parts[10].split("").filter((c) => PATTERN_IDS.includes(c)).slice(0, 8);
      if (song.length) beat.song = song;
    }
    if (parts[11]) beat.mix = unpackMix(parts[11]);
    if (parts[12] && parts[12].includes(".")) beat.patterns = unpackBank(parts[12]);
    if (parts[13] === "1") beat.songOn = true;
    return beat;
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
      humanize: state.humanize || 0,
      kit: state.kit,
      mood: state.mood,
      key: state.key,
      steps: cloneSteps(state.steps),
      patterns: state.patterns,
      pattern: state.pattern,
      song: state.song.slice(),
      songOn: Boolean(state.songOn),
      mix: { ...state.mix },
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
      const beat = {
        name: cleanTitle(data.name),
        bpm: Math.min(160, Math.max(70, Number(data.bpm) || 110)),
        swing: Math.min(60, Math.max(0, Number(data.swing) || 0)),
        humanize: Math.min(40, Math.max(0, Number(data.humanize) || 0)),
        kit,
        mood,
        key,
        steps,
      };
      if (data.patterns) beat.patterns = data.patterns;
      if (PATTERN_IDS.includes(data.pattern)) beat.pattern = data.pattern;
      if (Array.isArray(data.song)) beat.song = data.song;
      if (data.songOn) beat.songOn = true;
      if (data.mix && typeof data.mix === "object") beat.mix = data.mix;
      return beat;
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
    solo: Object.fromEntries(TRACKS.map((t) => [t.id, false])),
    tone: Object.fromEntries(TRACKS.map((t) => [t.id, "norm"])),
    mix: Object.fromEntries(TRACKS.map((t) => [t.id, 100])),
    pattern: "A",
    patterns: null,
    song: ["A", "A", "A", "A"],
    songOn: false,
    songPos: 0,
    humanize: 0,
    meter: "4/4",
    click: true,
    record: false,
    volume: 0.8,
    playing: false,
    playhead: -1,
    bank: 0,
    library: [],
    look: loadLook(),
    arrived: null,
  };
  state.patterns = freshBank(state.steps);
  state.steps = state.patterns.A;

  function bindSteps(steps) {
    state.patterns[state.pattern] = steps;
    state.steps = steps;
  }
  function readMix(raw) {
    const mix = Object.fromEntries(TRACKS.map((t) => [t.id, 100]));
    if (!raw || typeof raw !== "object") return mix;
    for (const t of TRACKS) {
      const n = Number(raw[t.id]);
      if (!Number.isNaN(n)) mix[t.id] = Math.min(100, Math.max(0, n));
    }
    return mix;
  }

  function loadLibrary() {
    try {
      const raw = localStorage.getItem(STORAGE);
      if (!raw) return;
      const data = JSON.parse(raw);
      if (Array.isArray(data.library)) {
        state.library = data.library.map((item) => ({ ...item, name: cleanTitle(item && item.name) }));
      }
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
      humanize: state.humanize,
      kit: state.kit,
      mood: state.mood,
      key: state.key,
      volume: state.volume,
      steps: cloneSteps(state.steps),
      pattern: state.pattern,
      patterns: {
        A: cloneSteps(state.patterns.A),
        B: cloneSteps(state.patterns.B),
        C: cloneSteps(state.patterns.C),
        D: cloneSteps(state.patterns.D),
      },
      song: state.song.slice(),
      songOn: state.songOn,
      songPos: state.songPos,
      meter: state.meter,
      click: state.click,
      mix: { ...state.mix },
      muted: { ...state.muted },
      solo: { ...state.solo },
      tone: { ...state.tone },
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
    trigger(id, t, kit, key, mood, level = 1, tone = "norm") {
      const dest = this.master;
      const lv = Math.max(0.001, Math.min(1, level));
      const soften = tone === "soft" ? 0.62 : 1;
      const P = (peak) => Math.max(0.001, peak * lv * soften);
      if (tone === "bright") this.osc(dest, t, "triangle", 1600, 700, 0.035, P(0.07), 0.001);
      const k = kit;
      if (id === "kick") {
        if (k === "boom") {
          this.osc(dest, t, "sine", 90, 38, 0.7, P(1.05), 0.002);
        } else if (k === "arcade") {
          this.osc(dest, t, "square", 140, 48, 0.14, P(0.35), 0.001);
        } else {
          this.osc(dest, t, "sine", 170, 42, 0.32, P(0.95), 0.002);
          this.osc(dest, t, "triangle", 80, 40, 0.08, P(0.2), 0.001);
        }
        return;
      }
      if (id === "snare") {
        this.noiseBurst(dest, t, k === "boom" ? 0.22 : 0.14, "bandpass", 1800, 0.9, P(0.55));
        this.osc(dest, t, "triangle", 210, 140, 0.12, P(0.28));
        return;
      }
      if (id === "hat") {
        const dur = k === "dream" ? 0.12 : k === "arcade" ? 0.03 : 0.045;
        this.noiseBurst(dest, t, dur, "highpass", 7000, 0.6, P(0.28));
        return;
      }
      if (id === "clap") {
        this.noiseBurst(dest, t, 0.04, "bandpass", 1200, 1.2, P(0.5));
        this.noiseBurst(dest, t + 0.018, 0.05, "bandpass", 1400, 1, P(0.38));
        this.noiseBurst(dest, t + 0.038, 0.08, "highpass", 900, 0.7, P(0.22));
        return;
      }
      const track = TRACKS.find((tr) => tr.id === id);
      if (!track || track.kind !== "note") return;
      const hz = midiHz(noteMidi(track.degree, key, mood));
      const isBass = track.degree <= 1;
      if (k === "arcade") {
        this.osc(dest, t, "square", hz, hz, isBass ? 0.22 : 0.12, P(isBass ? 0.28 : 0.2));
      } else if (k === "dream") {
        this.osc(dest, t, "sine", hz, hz, 0.7, P(0.28), 0.02);
        this.osc(dest, t, "triangle", hz * 1.004, hz * 1.004, 0.55, P(0.12), 0.02);
      } else if (k === "boom") {
        this.osc(dest, t, "sine", hz / (isBass ? 1 : 1), hz, isBass ? 0.45 : 0.22, P(0.32));
      } else {
        this.osc(dest, t, "sawtooth", hz, hz, isBass ? 0.32 : 0.2, P(isBass ? 0.22 : 0.16), 0.008);
        this.osc(dest, t, "triangle", hz * 1.006, hz * 1.006, isBass ? 0.28 : 0.18, P(0.12), 0.008);
      }
    }
    preview(id) {
      this.unlock();
      this.trigger(id, this.ctx.currentTime + 0.01, state.kit, state.key, state.mood);
    }
    clickAt(when, accent) {
      if (!state.click || state.soundOff || !this.ctx) return;
      this.osc(this.master, when, "square", accent ? 1600 : 1040, accent ? 800 : 640, 0.03, accent ? 0.11 : 0.05, 0.001);
    }
    scheduler = () => {
      if (!this.ctx || !state.playing) return;
      const ctx = this.ctx;
      while (this.nextTime < ctx.currentTime + this.lookahead) {
        const step = this.step;
        const wobble = [0, 3, -2, 4, -3, 2, -4, 1, 2, -1, 4, -2, 3, -3, 1, -4][step] || 0;
        const hum = (state.humanize / 40) * 0.012;
        const when = this.nextTime + wobble * hum;
        this.queued.push({ step, when });
        const humLevel = 1 - (state.humanize / 40) * 0.18 * (Math.abs(wobble) / 4);
        const meter = meterNow();
        if (state.click && step % meter.every === 0) this.clickAt(when, step % meter.accent === 0);
        const anySolo = TRACKS.some((t) => state.solo[t.id]);
        for (const t of TRACKS) {
          if (state.muted[t.id]) continue;
          if (anySolo && !state.solo[t.id]) continue;
          if (!state.steps[t.id][step]) continue;
          const level = ((state.mix[t.id] ?? 100) / 100) * humLevel;
          if (level <= 0.02) continue;
          this.trigger(t.id, when, state.kit, state.key, state.mood, level, state.tone[t.id] || "norm");
        }
        const sixteenth = 60 / state.bpm / 4;
        const swingAmt = (state.swing / 100) * 0.55;
        if (step % 2 === 0) this.nextTime += sixteenth * (1 + swingAmt);
        else this.nextTime += sixteenth * (1 - swingAmt);
        this.step += 1;
        if (this.step >= loopLength()) {
          this.step = 0;
          this.advanceSong();
        }
      }
    };
    advanceSong() {
      if (!state.songOn || !state.song || state.song.length < 2) return;
      state.songPos = (state.songPos + 1) % state.song.length;
      const nextId = state.song[state.songPos];
      if (nextId !== state.pattern && state.patterns[nextId]) {
        state.pattern = nextId;
        state.steps = state.patterns[nextId];
        state._songDirty = true;
      }
    }
    play() {
      if (state.playing) return;
      state.playing = true;
      if (state.songOn && state.song.length) {
        state.songPos = 0;
        state.pattern = state.song[0];
        state.steps = state.patterns[state.pattern];
        state._songDirty = true;
      }
      this.step = 0;
      this.queued = [];
      this.visualStart = performance.now();
      this.visualBar = 0;
      try {
        this.unlock();
        this.nextTime = this.ctx.currentTime + 0.06;
        this.setVolume(state.soundOff ? 0 : state.volume);
        this.setKit(state.kit);
        this.scheduler();
        this.timer = window.setInterval(this.scheduler, this.interval);
      } catch {
        /* The column and the word Now still run. */
      }
    }
    stop() {
      state.playing = false;
      state.playhead = -1;
      if (this.timer) {
        clearInterval(this.timer);
        this.timer = 0;
      }
      this.queued = [];
      writeNow(-1);
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
    noteAudioBar() {
      const sixteenth = 60000 / Math.max(1, state.bpm) / 4;
      const elapsed = performance.now() - (this.visualStart || performance.now());
      this.visualBar = Math.floor(Math.max(0, elapsed) / sixteenth / loopLength());
    }
    visualStep() {
      if (!state.playing) return -1;
      const sixteenth = 60000 / Math.max(1, state.bpm) / 4;
      const elapsed = performance.now() - (this.visualStart || performance.now());
      const index = Math.floor(Math.max(0, elapsed) / sixteenth);
      const span = loopLength();
      const bar = Math.floor(index / span);
      if (this.visualBar == null) this.visualBar = bar;
      if (bar > this.visualBar) {
        const jumped = bar - this.visualBar;
        this.visualBar = bar;
        for (let i = 0; i < jumped; i++) this.advanceSong();
      }
      return index % span;
    }
  }

  const engine = new Engine();

  function applyPreset(p) {
    state.name = cleanTitle(p.name);
    state.bpm = p.bpm;
    state.swing = p.swing;
    state.humanize = Math.min(40, Math.max(0, Number(p.humanize) || 0));
    state.kit = p.kit;
    state.mood = p.mood;
    state.key = p.key;
    if (p.patterns && p.patterns.A) {
      state.patterns = {
        A: cloneSteps(p.patterns.A),
        B: cloneSteps(p.patterns.B || emptySteps()),
        C: cloneSteps(p.patterns.C || emptySteps()),
        D: cloneSteps(p.patterns.D || emptySteps()),
      };
    } else {
      state.patterns = freshBank(p.steps);
    }
    state.pattern = PATTERN_IDS.includes(p.pattern) ? p.pattern : "A";
    state.steps = state.patterns[state.pattern];
    state.song = Array.isArray(p.song) && p.song.length
      ? p.song.filter((id) => PATTERN_IDS.includes(id)).slice(0, 8)
      : ["A", "A", "A", "A"];
    if (!state.song.length) state.song = ["A", "A", "A", "A"];
    state.songOn = Boolean(p.songOn);
    state.songPos = 0;
    state.meter = METERS.some((m) => m.id === p.meter) ? p.meter : "4/4";
    if (typeof p.click === "boolean") state.click = p.click;
    if (p.mix) state.mix = readMix(p.mix);
    else state.mix = Object.fromEntries(TRACKS.map((t) => [t.id, 100]));
    if (p.muted) {
      for (const t of TRACKS) state.muted[t.id] = Boolean(p.muted[t.id]);
    }
    state.solo = Object.fromEntries(TRACKS.map((t) => [t.id, false]));
    if (p.solo) {
      for (const t of TRACKS) state.solo[t.id] = Boolean(p.solo[t.id]);
    }
    state.tone = Object.fromEntries(TRACKS.map((t) => [t.id, "norm"]));
    if (p.tone) {
      for (const t of TRACKS) {
        const tone = p.tone[t.id];
        state.tone[t.id] = tone === "soft" || tone === "bright" ? tone : "norm";
      }
    }
    $("bpm").value = String(p.bpm);
    $("swing").value = String(p.swing);
    const human = $("human");
    if (human) human.value = String(state.humanize);
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
      head.push(`<div class="nums ${bank}${i >= loopLength() ? " quiet" : ""}">${i + 1}</div>`);
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
        const quiet = i >= loopLength() ? " quiet" : "";
        const bank = i < 8 ? "bank0" : "bank1";
        const arrived = state.arrived && state.arrived.has(t.id + ":" + i) ? " arrived" : "";
        rows.push(
          `<button type="button" class="cell${beat}${on ? " on" : ""}${play}${arrived}${quiet} ${bank}" data-track="${t.id}" data-step="${i}" aria-pressed="${on}" aria-label="${label} step ${i + 1}"></button>`,
        );
      }
    }
    grid.innerHTML = head.join("") + rows.join("");
  }

  function renderPads() {
    const box = $("pads");
    if (!box || box.childElementCount) return;
    TRACKS.filter((t) => t.kind === "drum").forEach((t) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "pad";
      b.dataset.pad = t.id;
      b.textContent = t.label;
      b.addEventListener("pointerdown", (e) => {
        if (e.button != null && e.button !== 0) return;
        e.preventDefault();
        stampPad(t.id);
      });
      box.appendChild(b);
    });
  }
  function stampPad(id) {
    try { engine.preview(id); } catch (err) { /* the pad still lights */ }
    const pad = document.querySelector(`.pad[data-pad="${id}"]`);
    if (pad) {
      pad.classList.add("hit");
      window.setTimeout(() => {
        if (state.playhead < 0 || !state.steps[id][state.playhead]) pad.classList.remove("hit");
      }, 140);
    }
    if (!state.record) return;
    if (!state.playing) {
      try { engine.play(); } catch (err) { state.playing = true; }
      $("play-btn").classList.add("is-on");
    }
    const step = state.playhead >= 0 ? state.playhead : 0;
    if (step >= loopLength() || state.steps[id][step]) return;
    pushUndo();
    state.steps[id][step] = true;
    const cell = document.querySelector(`#grid [data-track="${id}"][data-step="${step}"]`);
    if (cell) {
      cell.classList.add("on");
      cell.setAttribute("aria-pressed", "true");
    }
    remember();
  }

  function renderSong() {
    const box = $("song");
    if (!box) return;
    box.innerHTML = "";
    state.song.forEach((id, index) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "btn" + (state.songOn && index === state.songPos ? " on" : "");
      b.textContent = id;
      b.setAttribute("aria-label", `Song slot ${index + 1}, pattern ${id}`);
      b.addEventListener("click", () => {
        pushUndo();
        const next = PATTERN_IDS[(PATTERN_IDS.indexOf(id) + 1) % PATTERN_IDS.length];
        state.song[index] = next;
        remember();
        renderSong();
      });
      box.appendChild(b);
    });
  }
  function renderMix() {
    const box = $("mix");
    if (!box) return;
    const tones = [
      { id: "soft", label: "Soft" },
      { id: "norm", label: "Norm" },
      { id: "bright", label: "Bright" },
    ];
    if (!box.querySelector(".mix-row")) {
      for (const t of TRACKS) {
        const row = document.createElement("div");
        row.className = "mix-row";
        row.dataset.track = t.id;
        const name = document.createElement("button");
        name.type = "button";
        name.className = "btn mix-name";
        name.dataset.mix = t.id;
        name.addEventListener("click", () => {
          state.muted[t.id] = !state.muted[t.id];
          remember();
          renderMix();
        });
        const solo = document.createElement("button");
        solo.type = "button";
        solo.className = "btn mix-solo";
        solo.dataset.solo = t.id;
        solo.textContent = "Solo";
        solo.addEventListener("click", () => {
          state.solo[t.id] = !state.solo[t.id];
          remember();
          renderMix();
        });
        const toneBox = document.createElement("div");
        toneBox.className = "mix-tones";
        tones.forEach((tone) => {
          const b = document.createElement("button");
          b.type = "button";
          b.className = "btn";
          b.dataset.tone = tone.id;
          b.textContent = tone.label;
          b.addEventListener("click", () => {
            state.tone[t.id] = tone.id;
            remember();
            renderMix();
          });
          toneBox.appendChild(b);
        });
        const range = document.createElement("input");
        range.type = "range";
        range.min = "0";
        range.max = "100";
        range.dataset.mix = t.id;
        range.addEventListener("input", () => {
          state.mix[t.id] = Number(range.value);
          remember();
        });
        row.append(name, solo, toneBox, range);
        box.appendChild(row);
      }
    }
    for (const t of TRACKS) {
      const row = box.querySelector(`.mix-row[data-track="${t.id}"]`);
      if (!row) continue;
      const label = t.kind === "note" ? noteLabel(t.degree, state.key, state.mood) : t.label;
      const name = row.querySelector(".mix-name");
      const solo = row.querySelector(".mix-solo");
      const range = row.querySelector("input");
      name.textContent = state.muted[t.id] ? `${label} off` : label;
      name.classList.toggle("on", state.muted[t.id]);
      name.setAttribute("aria-pressed", String(state.muted[t.id]));
      name.setAttribute("aria-label", `${label} off`);
      solo.classList.toggle("on", state.solo[t.id]);
      solo.setAttribute("aria-pressed", String(state.solo[t.id]));
      solo.setAttribute("aria-label", `${label} solo`);
      row.querySelectorAll(".mix-tones .btn").forEach((b) => {
        const on = b.dataset.tone === (state.tone[t.id] || "norm");
        b.classList.toggle("on", on);
        b.setAttribute("aria-pressed", String(on));
      });
      if (document.activeElement !== range) {
        range.value = String(state.mix[t.id] ?? 100);
        range.setAttribute("aria-label", `${label} volume`);
      }
    }
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
    renderChips($("meters"), METERS, state.meter, (id) => {
      state.meter = id;
      if (engine.step >= loopLength()) engine.step = 0;
      renderAll();
    });
    const clickBtn = $("click-btn");
    if (clickBtn) {
      clickBtn.textContent = state.click ? "Click on" : "Click off";
      clickBtn.classList.toggle("on", state.click);
      clickBtn.setAttribute("aria-pressed", String(state.click));
    }
    const recBtn = $("record-btn");
    if (recBtn) {
      recBtn.textContent = state.record ? "Recording" : "Record";
      recBtn.classList.toggle("on", state.record);
      recBtn.setAttribute("aria-pressed", String(state.record));
    }
    renderPads();
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
    renderChips($("patterns"), PATTERN_IDS, state.pattern, (id) => {
      if (id === state.pattern) return;
      pushUndo();
      state.pattern = id;
      state.steps = state.patterns[id];
      renderAll();
    });
    const songOn = $("song-on");
    if (songOn) {
      songOn.classList.toggle("on", state.songOn);
      songOn.textContent = state.songOn ? "Song" : "Loop";
      songOn.setAttribute("aria-pressed", String(state.songOn));
    }
    renderSong();
    renderMix();
    $("play-btn").classList.toggle("is-on", state.playing);
    $("play-btn").setAttribute("aria-label", state.playing ? "Pause" : "Play");
    document.body.classList.toggle("is-loop", state.playing);
    document.querySelectorAll("[data-bank]").forEach((b) => {
      b.classList.toggle("on", Number(b.dataset.bank) === state.bank);
    });
    renderGrid();
    remember();
  }

  function writeNow(step) {
    const el = $("now-line");
    if (!el) return;
    if (!state.playing) {
      el.textContent = "Press Play. Watch the column. Sound can stay off.";
      return;
    }
    if (step < 0) {
      el.textContent = (state.soundOff ? "Sound is off. " : "") + "Playing. Watch the column.";
      return;
    }
    const names = [];
    for (const t of TRACKS) {
      if (!state.steps[t.id] || !state.steps[t.id][step]) continue;
      names.push(t.kind === "note" ? noteLabel(t.degree, state.key, state.mood) : t.label);
    }
    const off = state.soundOff ? "Sound is off. " : "";
    const beat = "Beat " + beatName(step);
    el.textContent = names.length ? off + beat + " · " + names.join(", ") + "." : off + beat + " · rest.";
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
      $("lcd-pos").textContent = state.meter + " · " + beatName(step);
      if (step === 0) state.sawDownbeat = true;
    }
    $("grid").querySelectorAll("[data-step]").forEach((el) => {
      const s = Number(el.dataset.step);
      el.classList.toggle("play", s === step);
    });
    $("grid").querySelectorAll(".nums").forEach((el, i) => {
      el.classList.toggle("play", i === step);
    });
    writeNow(step);
    document.querySelectorAll(".pad").forEach((pad) => {
      const id = pad.dataset.pad;
      pad.classList.toggle("hit", step >= 0 && Boolean(state.steps[id] && state.steps[id][step]));
    });
    if (state._songDirty) {
      state._songDirty = false;
      renderGrid();
      const box = $("patterns");
      if (box) {
        box.querySelectorAll("button").forEach((b) => {
          const on = b.textContent === state.pattern;
          b.classList.toggle("on", on);
          b.setAttribute("aria-pressed", String(on));
        });
      }
    }
  }

  let paint = null;
  function paintCell(cell) {
    if (!cell || !paint) return;
    const track = cell.dataset.track;
    const step = Number(cell.dataset.step);
    if (!track || !state.steps[track] || step >= loopLength()) return;
    state.steps[track][step] = paint.value;
    cell.classList.toggle("on", paint.value);
    cell.setAttribute("aria-pressed", String(paint.value));
  }
  $("grid").addEventListener("pointerdown", (e) => {
    const preview = e.target.closest("[data-preview]");
    if (preview) {
      engine.preview(preview.dataset.preview);
      return;
    }
    const cell = e.target.closest("[data-track]");
    if (!cell) return;
    e.preventDefault();
    if (!paint) pushUndo();
    const track = cell.dataset.track;
    const step = Number(cell.dataset.step);
    const next = !state.steps[track][step];
    state.steps[track][step] = next;
    cell.classList.toggle("on", next);
    cell.setAttribute("aria-pressed", String(next));
    paint = { value: next, pointerId: e.pointerId };
    try { $("grid").setPointerCapture(e.pointerId); } catch { /* already captured */ }
  });
  $("grid").addEventListener("pointermove", (e) => {
    if (!paint || e.pointerId !== paint.pointerId) return;
    const hit = document.elementFromPoint(e.clientX, e.clientY);
    const cell = hit && hit.closest ? hit.closest("[data-track]") : null;
    if (!cell || !$("grid").contains(cell)) return;
    paintCell(cell);
  });
  $("grid").addEventListener("pointerup", () => {
    if (paint) remember();
    paint = null;
  });
  $("grid").addEventListener("pointercancel", () => {
    paint = null;
  });

  const DAY_KEY = "kulibert.beatz.played";
  function markDay() {
    try { localStorage.setItem(DAY_KEY, "1"); } catch { /* ignore */ }
    document.body.classList.remove("is-day");
    const more = $("more-btn");
    if (more) more.hidden = false;
  }
  function syncDay() {
    let seen = false;
    try { seen = localStorage.getItem(DAY_KEY) === "1"; } catch { seen = false; }
    document.body.classList.toggle("is-day", !seen);
    const more = $("more-btn");
    if (more) more.hidden = !seen;
  }
  syncDay();
  const moreBtn = $("more-btn");
  if (moreBtn) moreBtn.addEventListener("click", () => {
    const on = document.body.classList.toggle("show-more");
    moreBtn.setAttribute("aria-expanded", String(on));
    moreBtn.textContent = on ? "Less" : "More";
  });
  $("menu-btn").addEventListener("click", () => {
    const on = document.body.classList.toggle("menu-open");
    $("menu-btn").setAttribute("aria-expanded", String(on));
  });
  $("scrim").addEventListener("click", () => {
    document.body.classList.remove("menu-open");
    $("menu-btn").setAttribute("aria-expanded", "false");
  });
  $("mute-btn").addEventListener("click", () => {
    state.soundOff = !state.soundOff;
    $("mute-btn").textContent = state.soundOff ? "Muted" : "Sound on";
    $("mute-btn").setAttribute("aria-pressed", String(Boolean(state.soundOff)));
    engine.setVolume(state.soundOff ? 0 : state.volume);
    writeNow(state.playhead);
  });
  $("click-btn").addEventListener("click", () => {
    state.click = !state.click;
    remember();
    renderAll();
  });
  $("record-btn").addEventListener("click", () => {
    state.record = !state.record;
    renderAll();
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
      else {
        state.arrived = null;
        const arrive = $("arrive");
        if (arrive) arrive.hidden = true;
        engine.play();
        markDay();
        writeNow(state.playhead);
      }
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
  $("human").addEventListener("input", (e) => {
    state.humanize = Number(e.target.value);
    remember();
  });
  $("song-on").addEventListener("click", () => {
    state.songOn = !state.songOn;
    state.songPos = 0;
    if (state.songOn) {
      state.pattern = state.song[0];
      state.steps = state.patterns[state.pattern];
    }
    renderAll();
    remember();
  });
  $("vol").addEventListener("input", (e) => {
    state.volume = Number(e.target.value) / 100;
    engine.setVolume(state.volume);
    if (state.soundOff) engine.setVolume(0);
    remember();
  });
  document.querySelectorAll("[data-bank]").forEach((b) => {
    b.addEventListener("click", () => {
      state.bank = Number(b.dataset.bank);
      renderAll();
    });
  });
  const LESSON_KEY = "kulibert.beatz.lesson";
  const LESSON = [
    {
      title: "The beat",
      body: "Press Play. Count the word: Beat 1, Beat 2, Beat 3, Beat 4. That steady count is the beat. Sound can stay off.",
      check: () => state.playing || state.sawDownbeat,
      miss: "Press Play, then watch the word.",
      spot: "#play-btn",
    },
    {
      title: "The strong beat",
      body: "Beat 1 is the strong beat. It is the one you tap your foot on. Wait until the word says Beat 1.",
      check: () => state.sawDownbeat,
      miss: "Keep it playing until the word says Beat 1.",
      spot: "#now-line",
    },
    {
      title: "The pulse",
      body: "Light the first Kick square. A kick on beat 1 is the pulse. The other drums sit around it.",
      check: () => Boolean(state.steps.kick && state.steps.kick[0]),
      miss: "Tap the first Kick square so it turns on.",
      spot: "#grid [data-track='kick'][data-step='0']",
    },
    {
      title: "Time",
      body: "4/4 means four beats, then it starts over. Tap 3/4. Count 1, 2, 3. The bottom rows are notes: C, D, E, G, and A.",
      check: () => state.meter === "3/4",
      miss: "Tap 3/4 in the Time row.",
      spot: "#meters",
    },
    {
      title: "Tempo",
      body: "Move Tempo. Faster or slower is the tempo. You still count the same beats. Tempo is speed. Time is how many beats.",
      check: () => state.bpm !== state.lessonBpm,
      miss: "Move the Tempo slider.",
      spot: "#bpm",
    },
  ];
  function clearSpot() {
    document.querySelectorAll(".spot").forEach((el) => el.classList.remove("spot"));
  }
  function coachLesson() {
    const box = $("lesson");
    if (!box || box.hidden) {
      clearSpot();
      return;
    }
    const step = LESSON[state.lesson];
    if (!step) return;
    clearSpot();
    const el = step.spot && document.querySelector(step.spot);
    if (el) el.classList.add("spot");
    const ok = !step.check || step.check();
    $("lesson-next").classList.toggle("ready", ok);
    if (ok) $("lesson-miss").textContent = "Got it.";
  }
  function lessonDone() {
    try { return localStorage.getItem(LESSON_KEY) === "done"; } catch (err) { return false; }
  }
  function paintLesson() {
    const box = $("lesson");
    if (!box) return;
    if (state.lesson == null || state.lesson >= LESSON.length) {
      box.hidden = true;
      return;
    }
    const step = LESSON[state.lesson];
    box.hidden = false;
    $("lesson-n").textContent = String(state.lesson + 1);
    const total = $("lesson-total");
    if (total) total.textContent = String(LESSON.length);
    $("lesson-title").textContent = step.title;
    $("lesson-body").textContent = step.body;
    $("lesson-miss").textContent = "";
    $("lesson-next").classList.remove("ready");
    $("lesson-next").textContent = state.lesson === LESSON.length - 1 ? "Done" : "I did this";
    $("lesson-skip").hidden = state.lesson < 1;
    coachLesson();
  }
  function finishLesson() {
    state.lesson = LESSON.length;
    clearSpot();
    try { localStorage.setItem(LESSON_KEY, "done"); } catch (err) { /* the card can still close */ }
    paintLesson();
  }
  $("lesson-next").addEventListener("click", () => {
    const step = LESSON[state.lesson];
    if (!step) return;
    if (step.check && !step.check()) {
      $("lesson-miss").textContent = step.miss;
      return;
    }
    state.lesson += 1;
    if (state.lesson >= LESSON.length) finishLesson();
    else paintLesson();
  });
  $("lesson-skip").addEventListener("click", finishLesson);
  state.lesson = lessonDone() ? LESSON.length : 0;
  state.lessonBpm = state.bpm;
  if (!state.coachTimer) state.coachTimer = window.setInterval(coachLesson, 400);

  $("help-btn").addEventListener("click", () => {
    state.lesson = 0;
    state.sawDownbeat = false;
    state.lessonBpm = state.bpm;
    paintLesson();
    document.body.classList.remove("menu-open");
    $("help-btn").setAttribute("aria-expanded", "true");
  });
  $("surprise-btn").addEventListener("click", () => {
    pushUndo();
    if (Math.random() > 0.55) state.kit = KITS[Math.floor(Math.random() * KITS.length)].id;
    if (Math.random() > 0.6) state.mood = Math.random() > 0.5 ? "bright" : "moody";
    state.bpm = 88 + Math.floor(Math.random() * 36);
    state.swing = Math.floor(Math.random() * 28);
    $("bpm").value = String(state.bpm);
    $("swing").value = String(state.swing);
    bindSteps(randomize(state.mood));
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
      bindSteps(emptySteps());
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

  $("song-name").addEventListener("click", () => {
    const box = $("title-lists");
    const Titles = window.KulibertTitles;
    if (!box || !Titles) return;
    const opening = true;
    box.hidden = false;
    document.body.classList.add("menu-open");
    $("song-name").setAttribute("aria-expanded", "true");
    if (!opening) return;
    const starting = Titles.partsOf(state.name) ? state.name : Titles.starterTitle();
    Titles.mount(box, starting, (title) => {
      state.name = title;
      $("song-name").textContent = title;
      remember();
    });
  });
  $("save-btn").addEventListener("click", () => {
    modalBody.innerHTML = "";
    const Titles = window.KulibertTitles;
    let chosen = Titles && Titles.partsOf(state.name) ? state.name : (Titles ? Titles.starterTitle() : "Class beat");
    const live = document.createElement("p");
    live.className = "title-live";
    live.textContent = chosen;
    const box = document.createElement("div");
    modalBody.append(live, box);
    if (Titles) {
      Titles.mount(box, chosen, (title) => {
        chosen = title;
        live.textContent = title;
      });
    }
    openModal("Save this beat", "Tap one word from each list.", () => {
      const name = chosen;
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

  function sendSong(where) {
    const Song = window.KulibertSong;
    if (!Song) {
      window.location.href = where;
      return;
    }
    const song = Song.fromBeat({ name: state.name, bpm: state.bpm, steps: state.steps });
    Song.writeBridge("bertybeatz", song, { name: state.name, bpm: state.bpm, steps: state.steps });
    window.location.href = where;
  }
  $("score-btn").addEventListener("click", () => sendSong("/bertyscore/?from=bridge"));
  $("lights-btn").addEventListener("click", () => sendSong("/visualizer/?from=bridge"));

  function songLine(fitted) {
    return fitted
      ? "That's the song. Press Play. F, B, and high C moved to the nearest note. Drums stayed."
      : "That's the song. Press Play. Drums stayed.";
  }
  function showSong(beat) {
    const keys = [];
    ["n0", "n1", "n2", "n3", "n4"].forEach((id) => {
      (beat.steps[id] || []).forEach((on, i) => {
        if (on) keys.push(id + ":" + i);
      });
    });
    state.arrived = new Set(keys);
    const early = keys.some((key) => Number(key.split(":")[1]) < 8);
    if (!early && keys.length) state.bank = 1;
    const line = songLine(beat.fitted);
    const arrive = $("arrive");
    if (arrive) {
      arrive.hidden = false;
      arrive.textContent = line;
    }
    const gateLede = $("gate-lede");
    const gate = $("gate");
    if (gateLede && gate && !gate.hidden) gateLede.textContent = "That's the song. Tap to start, then press Play.";
    flash(line);
  }
  function takeScore() {
    const Song = window.KulibertSong;
    if (!Song) return false;
    if (new URLSearchParams(window.location.search).get("from") !== "bridge") return false;
    const bridge = Song.readBridge();
    if (!bridge || !bridge.song) return false;
    const beat = Song.toBeat(bridge.song);
    const steps = cloneSteps(state.steps);
    ["n0", "n1", "n2", "n3", "n4"].forEach((id) => {
      if (beat.steps[id]) steps[id] = beat.steps[id].map(Boolean);
    });
    state.name = beat.name || state.name;
    state.bpm = Math.min(160, Math.max(70, beat.bpm || state.bpm));
    const bpm = $("bpm");
    if (bpm) bpm.value = String(state.bpm);
    bindSteps(steps);
    showSong(beat);
    return true;
  }
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
      const text = String(reader.result || "");
      let song = null;
      try {
        const data = JSON.parse(text);
        if (data && data.family === "kulibert.song" && window.KulibertSong) song = window.KulibertSong.parse(text);
      } catch { /* a beat file, not a score */ }
      if (song && window.KulibertSong) {
        const beat = window.KulibertSong.toBeat(song);
        const steps = cloneSteps(state.steps);
        ["n0", "n1", "n2", "n3", "n4"].forEach((id) => {
          if (beat.steps[id]) steps[id] = beat.steps[id].map(Boolean);
        });
        pushUndo();
        state.name = beat.name || state.name;
        state.bpm = Math.min(160, Math.max(70, beat.bpm || state.bpm));
        $("bpm").value = String(state.bpm);
        bindSteps(steps);
        showSong(beat);
        renderAll();
        remember();
        return;
      }
      const beat = beatFromFileText(text);
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
    writeNow(state.playhead);
    renderAll();
    paintLesson();
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
      let step = engine.currentStep();
      if (step < 0) step = engine.visualStep();
      else engine.noteAudioBar();
      if (step !== state.playhead) setPlayhead(step);
      if (engine.analyser) {
        if (!engine.wave) engine.wave = new Uint8Array(engine.analyser.fftSize);
        engine.analyser.getByteTimeDomainData(engine.wave);
      }
      const playhead = state.playhead;
      return {
        look: state.look,
        playing: state.playing,
        playhead,
        kick: playhead >= 0 && Boolean(state.steps.kick[playhead]),
        snare: playhead >= 0 && Boolean(state.steps.snare[playhead]),
        analyser: state.playing && engine.analyser ? engine.analyser : null,
        wave: engine.analyser ? engine.wave : null,
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
  takeScore();
  window.addEventListener("pagehide", flushNow);
  ["gate-chip", "chip-label", "foot-chip"].forEach((id) => {
    const el = $(id);
    if (el) el.textContent = CHIP;
  });
  renderAll();
})();
