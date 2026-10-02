(() => {
  const Song = window.KulibertSong;
  const KEY = "kulibert.music.now";
  const LEARN = ["C", "D", "E", "G", "A"];
  const ROWS = [
    ["kick", "Kick"],
    ["snare", "Snare"],
    ["hat", "Hat"],
    ["clap", "Clap"],
    ["tom", "Tom"],
    ["shaker", "Shaker"],
    ["rim", "Rim"],
    ["bell", "Bell"],
    ["tamb", "Tamb"],
    ["crash", "Crash"],
  ];
  function picture(look, color, wall, frame, rgb, look2, color2) {
    return {
      layers: [
        { look: look, color: color },
        { look: look2 || "off", color: color2 || color },
        { look: "off", color: "ice" },
      ],
      wall: wall,
      frame: frame || "glow",
      rgb: !!rgb,
    };
  }
  const PICTURES = {
    "Kye Kye Kule": picture("tiles", "lime", "candy", "glow", false, "rings", "amber"),
    "Banuwa": picture("bloom", "violet", "dusk", "glow", false, "ribbon", "rose"),
    "Shosholoza": picture("tunnel", "amber", "night", "rgb", true, "bars", "rose"),
    "Sakura": picture("bloom", "rose", "dusk", "glow", false, "rain", "ice"),
    "Arirang": picture("ribbon", "ice", "night", "line", false, "stars", "violet"),
    "Jasmine Flower": picture("bloom", "lime", "aurora", "glow", false, "clouds", "ice"),
    "Chanda Mama": picture("stars", "ice", "night", "glow", false, "orbit", "violet"),
    "Ode to Joy": picture("fireworks", "amber", "sunset", "glow", false, "rings", "rose"),
    "Korobeiniki": picture("orbit", "cyan", "night", "rgb", true, "tiles", "violet"),
    "Frere Jacques": picture("rings", "violet", "dusk", "glow", false, "stars", "amber"),
    "Scarborough Fair": picture("rain", "ice", "sea", "line", false, "clouds", "cyan"),
    "The Saints": picture("fireworks", "rose", "sunset", "glow", false, "bars", "amber"),
    "La Cucaracha": picture("fireworks", "lime", "candy", "rgb", true, "tiles", "rose"),
    "Cielito Lindo": picture("ribbon", "rose", "sunset", "glow", false, "bloom", "amber"),
    "Simple Gifts": picture("bloom", "amber", "dusk", "line", false, "clouds", "rose"),
    "Aloha Oe": picture("ribbon", "cyan", "sea", "glow", false, "rain", "ice"),
    "Tumbalalaika": picture("stars", "violet", "night", "glow", false, "orbit", "ice"),
    "Zum Gali Gali": picture("tiles", "amber", "sunset", "glow", false, "bars", "rose"),
    "Dona Nobis": picture("bloom", "ice", "dusk", "glow", false, "rings", "violet"),
    "Twinkle": picture("stars", "amber", "night", "glow", false, "orbit", "cyan"),
    "Little Lamb": picture("clouds", "ice", "dusk", "line", false, "bloom", "rose"),
    "Amazing Grace": picture("ribbon", "violet", "night", "glow", false, "stars", "ice"),
    "Jingle Bells": picture("fireworks", "ice", "night", "rgb", true, "stars", "cyan"),
    "Happy Birthday": picture("bloom", "rose", "sunset", "glow", false, "stars", "amber"),
  };
  const VIZ_BANK = [
    { id: "song", name: "Its picture" },
    { id: "storm", name: "Storm", viz: picture("rain", "ice", "sea", "glow", false, "tunnel", "cyan") },
    { id: "neon", name: "Neon", viz: picture("fireworks", "rose", "candy", "rgb", true, "rings", "lime") },
    { id: "soft", name: "Soft", viz: picture("bloom", "violet", "dusk", "glow", false, "ribbon", "ice") },
    { id: "space", name: "Space", viz: picture("stars", "ice", "night", "glow", true, "orbit", "cyan") },
    { id: "fire", name: "Fire", viz: picture("fireworks", "amber", "sunset", "glow", false, "bloom", "rose") },
    { id: "ocean", name: "Ocean", viz: picture("rain", "cyan", "sea", "glow", false, "ribbon", "ice") },
  ];
  const VIZ_MAP = "kulibert.music.vizmap";
  let songCatalog = [];
  let openTune = function () {};
  let libraryFilter = "all";
  let makeFeel = "bright";
  let makeInst = "piano";
  const REASONS = [
    ["home", "It is the home note."],
    ["line", "It sits on a line."],
    ["space", "It sits in a space."],
    ["higher", "It is higher than the one before."],
    ["lower", "It is lower than the one before."],
    ["rest", "It is a rest. We still count."],
    ["beat", "It lands on a strong beat."],
    ["again", "It repeats the note before."],
    ["returns", "It comes back home."],
  ];
  const LOOKS = [
    ["bars", "Bars"],
    ["ribbon", "Ribbon"],
    ["rings", "Rings"],
    ["rain", "Rain"],
  ];
  if (!Song) return;
  const $ = (id) => document.getElementById(id);
  function mu(key, vars) {
    const api = window.MuI18n;
    return api && api.t ? api.t(key, vars) : "";
  }
  function playWordText(on) {
    if (on) return mu("stop") || "Stop";
    const shared = window.KulibertI18n && window.KulibertI18n.t && window.KulibertI18n.t("play");
    return shared || "Play";
  }
  function setBdi(node, text) {
    if (!node) return;
    let bdi = node.querySelector(":scope > bdi");
    if (!bdi) {
      node.textContent = "";
      bdi = document.createElement("bdi");
      node.appendChild(bdi);
    }
    bdi.textContent = text;
  }

  const GRID = 16;
  function to16(arr) {
    const src = Array.isArray(arr) ? arr : [];
    const out = Array(GRID).fill(false);
    if (src.length >= GRID) {
      for (let i = 0; i < GRID; i++) out[i] = !!src[i];
    } else if (src.length === 8) {
      for (let i = 0; i < 8; i++) out[i * 2] = !!src[i];
    } else {
      for (let i = 0; i < src.length && i < GRID; i++) out[i] = !!src[i];
    }
    return out;
  }
  function blankDrums() {
    const drums = {};
    ROWS.forEach(([id]) => { drums[id] = Array(GRID).fill(false); });
    drums.kick[0] = true;
    drums.kick[8] = true;
    drums.snare[4] = true;
    drums.snare[12] = true;
    drums.hat[0] = true;
    drums.hat[2] = true;
    drums.hat[4] = true;
    drums.hat[6] = true;
    drums.hat[8] = true;
    drums.hat[10] = true;
    drums.hat[12] = true;
    drums.hat[14] = true;
    return drums;
  }

  const state = {
    song: Song.starter(),
    drums: blankDrums(),
    look: "ribbon",
    layers: [
      { look: "ribbon", color: "cyan" },
      { look: "rings", color: "violet" },
      { look: "off", color: "amber" },
    ],
    rgb: false,
    wall: "dusk",
    frame: "glow",
    mix: { kick: 100, snare: 90, hat: 70, clap: 80, tom: 75, shaker: 60, rim: 55, bell: 65, tamb: 50, crash: 70 },
    swing: 0,
    click: false,
    along: false,
    blend: 50,
    expert: false,
    ink: "C",
    pen: "quarter",
    cursor: 0,
    showing: false,
    counting: false,
    once: false,
    bass: false,
    orch: "beep",
    dyn: "mf",
    conducting: false,
    miss: 0,
    gear: { zoom: 110, spin: 60, glow: 90, thick: 4, count: 24, tint: 10, trail: 22, bounce: 100, scope: 100, smooth: 0, wild: 55 },
    band: "trumpet",
    fx: "plain",
    wave: "triangle",
    bright: 5200,
    noteLen: 0.28,
    echo: 0,
    wobble: 0,
    hip: 40,
    delay: 0,
    feedback: 0,
    playing: false,
    muted: false,
    seenGrid: -1,
    step: -1,
    timer: 0,
    bins: new Uint8Array(64),
    kick: false,
    snare: false,
    mode: "notes",
    recording: false,
    grid: 0,
    parts: { drums: true, bass: false, chords: false, melody: true },
    plan: [],
    raf: 0,
    confettiDone: false,
    sentScore: 0,
    finishStamp: "",
    made: 0,
    armBeats: 0,
    turn: "",
    turnLeft: 0,
    held: {},
    lastStamp: 0,
    writeStep: 0,
    lock: null,
  };
  const FREQ = { C: 261.6, D: 293.7, E: 329.6, G: 392, A: 440 };

  const BACKUP = KEY + ".bak";
  function applySaved(saved) {
    if (!saved || typeof saved !== "object" || !saved.song) return false;
    const song = Song.parse(typeof saved.song === "string" ? saved.song : JSON.stringify(saved.song));
    if (!song) return false;
    state.song = song;
    if (saved.drums) {
      ROWS.forEach(([id]) => {
        if (Array.isArray(saved.drums[id])) state.drums[id] = to16(saved.drums[id]);
      });
    }
    if (saved.look) state.look = saved.look;
    if (saved.mix && typeof saved.mix === "object") state.mix = Object.assign(state.mix, saved.mix);
    if (typeof saved.swing === "number") state.swing = saved.swing;
    if (typeof saved.along === "boolean") state.along = saved.along;
    if (typeof saved.blend === "number") state.blend = saved.blend;
    if (saved.expert) state.expert = true;
    if (typeof saved.bass === "boolean") state.bass = saved.bass;
    if (saved.gear && typeof saved.gear === "object") state.gear = Object.assign(state.gear, saved.gear);
    if (saved.fx) state.fx = saved.fx;
    if (saved.wave) state.wave = saved.wave;
    if (typeof saved.bright === "number") state.bright = saved.bright;
    if (typeof saved.noteLen === "number") state.noteLen = saved.noteLen;
    if (typeof saved.echo === "number") state.echo = saved.echo;
    if (typeof saved.wobble === "number") state.wobble = saved.wobble;
    if (typeof saved.hip === "number") state.hip = saved.hip;
    if (typeof saved.delay === "number") state.delay = saved.delay;
    if (typeof saved.feedback === "number") state.feedback = saved.feedback;
    if (saved.bpm) state.song.bpm = saved.bpm;
    return true;
  }
  function readBox(key) {
    try { return JSON.parse(localStorage.getItem(key) || "null"); } catch (err) { return null; }
  }
  const openedMain = applySaved(readBox(KEY));
  const openedBak = openedMain ? false : applySaved(readBox(BACKUP));
  state.restored = openedBak;

  const FX = [
    { id: "plain", name: "Plain", wave: "triangle", bright: 5200, noteLen: 0.28, echo: 0, wobble: 0, hip: 40, delay: 0, feedback: 0 },
    { id: "soft", name: "Soft", wave: "sine", bright: 900, noteLen: 0.4, echo: 0.12, wobble: 0, hip: 40, delay: 0.08, feedback: 0.15 },
    { id: "bright", name: "Bright", wave: "square", bright: 7000, noteLen: 0.18, echo: 0, wobble: 0, hip: 80, delay: 0, feedback: 0 },
    { id: "echo", name: "Echo", wave: "triangle", bright: 4200, noteLen: 0.22, echo: 0.45, wobble: 0, hip: 40, delay: 0.26, feedback: 0.38 },
    { id: "room", name: "Room", wave: "triangle", bright: 3600, noteLen: 0.32, echo: 0.28, wobble: 0, hip: 40, delay: 0.07, feedback: 0.25 },
    { id: "hall", name: "Hall", wave: "sine", bright: 2800, noteLen: 0.5, echo: 0.55, wobble: 0, hip: 40, delay: 0.19, feedback: 0.48 },
    { id: "robot", name: "Robot", wave: "square", bright: 1600, noteLen: 0.2, echo: 0.16, wobble: 10, hip: 180, delay: 0.08, feedback: 0.2 },
    { id: "radio", name: "Radio", wave: "square", bright: 1400, noteLen: 0.16, echo: 0.08, wobble: 0, hip: 500, delay: 0.05, feedback: 0.1 },
    { id: "space", name: "Space", wave: "sawtooth", bright: 3000, noteLen: 0.45, echo: 0.62, wobble: 2, hip: 40, delay: 0.36, feedback: 0.52 },
    { id: "deep", name: "Deep", wave: "sine", bright: 480, noteLen: 0.55, echo: 0.22, wobble: 3, hip: 30, delay: 0.2, feedback: 0.35 },
  ];
  const WAVES = [
    ["sine", "Round"],
    ["triangle", "Soft"],
    ["square", "Bright"],
    ["sawtooth", "Buzz"],
  ];
  let ctx = null;
  let master = null;
  let stageApi = null;
  let bus = null;
  let filter = null;
  let hip = null;
  let delayNode = null;
  let fb = null;
  let wet = null;
  let lfo = null;
  let lfoGain = null;
  function applyFx() {
    if (!filter) return;
    filter.frequency.value = state.bright;
    filter.Q.value = state.fx === "radio" ? 6 : 0.7;
    hip.frequency.value = state.hip;
    delayNode.delayTime.value = state.delay;
    fb.gain.value = state.feedback;
    wet.gain.value = state.echo;
    lfo.frequency.value = Math.max(0.1, state.wobble || 0.1);
    lfoGain.gain.value = state.wobble > 0 ? 0.45 : 0;
  }
  function arm() {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    if (!ctx) {
      ctx = new AC();
      master = ctx.createGain();
      master.connect(ctx.destination);
      bus = ctx.createGain();
      hip = ctx.createBiquadFilter();
      hip.type = "highpass";
      filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      const trem = ctx.createGain();
      trem.gain.value = 1;
      const dry = ctx.createGain();
      delayNode = ctx.createDelay(1.2);
      fb = ctx.createGain();
      wet = ctx.createGain();
      lfo = ctx.createOscillator();
      lfoGain = ctx.createGain();
      lfo.connect(lfoGain);
      lfoGain.connect(trem.gain);
      lfo.start();
      bus.connect(hip);
      hip.connect(filter);
      filter.connect(trem);
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -16;
      comp.knee.value = 8;
      comp.ratio.value = 3.5;
      comp.attack.value = 0.004;
      comp.release.value = 0.18;
      const limiter = ctx.createDynamicsCompressor();
      limiter.threshold.value = -3;
      limiter.knee.value = 0;
      limiter.ratio.value = 20;
      limiter.attack.value = 0.001;
      limiter.release.value = 0.08;
      trem.connect(comp);
      filter.connect(delayNode);
      delayNode.connect(fb);
      fb.connect(delayNode);
      delayNode.connect(wet);
      wet.connect(comp);
      comp.connect(limiter);
      limiter.connect(master);
      applyFx();
    }
    if (ctx.state === "suspended") ctx.resume();
    master.gain.value = state.muted ? 0 : 0.95;
    applyFx();
    resyncBus();
  }
  function resyncBus() {
    if (!ctx || !master) return;
    try { master.disconnect(); } catch (err) { /* reconnect below */ }
    try { master.connect(ctx.destination); } catch (err) { /* bus stays */ }
    master.gain.value = state.muted ? 0 : 0.95;
  }
  function atTime(when) {
    return typeof when === "number" ? when : ctx.currentTime;
  }
  function tone(freq, dur, type, level, when) {
    if (!ctx || state.muted || !freq) return;
    const t = atTime(when);
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    state.made += 2;
    osc.type = type || state.wave || "triangle";
    osc.frequency.setValueAtTime(freq, t);
    const length = dur || state.noteLen || 0.28;
    gain.gain.setValueAtTime(Math.max(0.001, level || 0.2), t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + length);
    osc.connect(gain);
    gain.connect(bus);
    osc.start(t);
    osc.stop(t + length + 0.02);
  }
  const DYN_GAIN = { pp: 0.1, p: 0.2, mf: 0.36, f: 0.55, ff: 0.78 };
  const DYN_WORD = { pp: "very soft", p: "soft", mf: "medium", f: "loud", ff: "very loud" };
  function sectionTone(freq, dur, section, dyn, when) {
    arm();
    if (!ctx || state.muted || !freq) return;
    const now = atTime(when);
    const amount = DYN_GAIN[dyn] || DYN_GAIN.mf;
    const loud = dyn === "f" || dyn === "ff";
    const out = ctx.createGain();
    const toneFilter = ctx.createBiquadFilter();
    toneFilter.type = "lowpass";
    toneFilter.connect(out);
    out.connect(bus);
    let voices = [[freq, "triangle", 0.6]];
    if (section === "strings") {
      toneFilter.frequency.setValueAtTime(loud ? 2600 : 980, now);
      voices = [[freq, "sawtooth", 0.42], [freq * 1.006, "sawtooth", 0.28], [freq / 2, "triangle", 0.32]];
      out.gain.setValueAtTime(0.0001, now);
      out.gain.exponentialRampToValueAtTime(amount, now + 0.1);
    } else if (section === "brass") {
      toneFilter.frequency.setValueAtTime(loud ? 3200 : 760, now);
      voices = [[freq, "sawtooth", 0.48], [freq * 2, "square", 0.1]];
      out.gain.setValueAtTime(0.0001, now);
      out.gain.exponentialRampToValueAtTime(amount, now + 0.03);
    } else {
      toneFilter.frequency.setValueAtTime(loud ? 2200 : 1400, now);
      voices = [[freq, "triangle", 0.5], [freq * 1.004, "sine", 0.28]];
      out.gain.setValueAtTime(0.0001, now);
      out.gain.exponentialRampToValueAtTime(amount * 0.85, now + 0.06);
    }
    const length = Math.max(0.22, dur || 0.4);
    out.gain.exponentialRampToValueAtTime(0.0001, now + length + 0.18);
    voices.forEach(([f, type, mix]) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      state.made += 2;
      osc.type = type;
      osc.frequency.value = f;
      gain.gain.value = mix;
      osc.connect(gain);
      gain.connect(toneFilter);
      osc.start(now);
      osc.stop(now + length + 0.2);
    });
  }
  function noise(dur, level, when, hipHz) {
    if (!ctx || state.muted) return;
    const t = atTime(when);
    const buffer = ctx.createBuffer(1, Math.max(1, ctx.sampleRate * dur), ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    const gain = ctx.createGain();
    state.made += 2;
    src.buffer = buffer;
    let node = src;
    if (hipHz) {
      const hp = ctx.createBiquadFilter();
      hp.type = "highpass";
      hp.frequency.value = hipHz;
      src.connect(hp);
      node = hp;
      state.made += 1;
    }
    gain.gain.setValueAtTime(Math.max(0.001, level), t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
    node.connect(gain);
    gain.connect(bus);
    src.start(t);
    src.stop(t + dur + 0.02);
  }

  function paintSaved(ok) {
    const line = $("saved-line");
    if (!line) return;
    line.classList.toggle("bad", !ok);
    line.textContent = ok ? "Saved" : "Not saved. Open the menu and tap Save a file.";
  }
  function keep() {
    const body = JSON.stringify({
      song: JSON.parse(Song.serialize(state.song)),
      drums: state.drums,
      look: state.look,
      band: state.band,
      fx: state.fx,
      wave: state.wave,
      bright: state.bright,
      noteLen: state.noteLen,
      echo: state.echo,
      wobble: state.wobble,
      hip: state.hip,
      delay: state.delay,
      feedback: state.feedback,
      bpm: state.song.bpm,
      mix: state.mix,
      swing: state.swing,
      click: state.click,
      along: state.along,
      blend: state.blend,
      expert: state.expert,
      bass: state.bass,
      gear: state.gear,
    });
    let ok = false;
    try {
      const prev = localStorage.getItem(KEY);
      if (prev && prev !== body) localStorage.setItem(BACKUP, prev);
      localStorage.setItem(KEY, body);
      ok = true;
    } catch (err) {
      ok = false;
    }
    paintSaved(ok);
    paintCount();
    paintSongBar();
    const beat = Song.toBeat(state.song);
    ROWS.forEach(([id]) => { beat.steps[id] = to16(state.drums[id]); });
    if (Song.writeBridge) Song.writeBridge("music", state.song, beat);
  }

  const TEACH = {
    C: "C hangs under the staff. It is the home note.",
    D: "D sits just under the staff.",
    E: "E sits on the bottom line.",
    F: "F sits in the first space.",
    G: "G sits on the second line.",
    A: "A sits in the second space.",
    B: "B sits on the middle line.",
    c: "High C sits in the third space.",
  };
  function songLen() {
    return Math.max(1, Song.events(state.song).length);
  }
  function paintMeters() {
    const box = $("meters");
    if (!box) return;
    box.innerHTML = "";
    ["2/4", "3/4", "4/4", "6/8"].forEach((meter) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "btn" + (state.song.meter === meter ? " on" : "");
      b.textContent = meter;
      b.addEventListener("click", () => {
        Song.setMeter(state.song, meter);
        state.cursor = 0;
        keep();
        renderStaff();
        paintMeters();
        paintCount();
      });
      box.appendChild(b);
    });
    const expert = $("expert-btn");
    if (expert) {
      expert.classList.toggle("on", state.expert);
      expert.setAttribute("aria-pressed", String(state.expert));
      expert.textContent = state.expert ? "Show the buttons" : "Just the staff";
    }
  }
  function paintInks() {
    const box = $("inks");
    if (!box || !Song.PITCHES) return;
    box.innerHTML = "";
    Song.PITCHES.forEach((pitch) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "btn" + (state.ink === pitch.id ? " on" : "");
      b.textContent = pitch.label;
      b.addEventListener("click", () => writePitch(pitch.id));
      box.appendChild(b);
    });
  }
  function writeAt(ev, pitch) {
    if (!ev) return;
    const pen = state.pen || "quarter";
    if (pen === "eighth" && Song.setEighths) Song.setEighths(state.song, ev.measure, ev.beat, pitch);
    else if (pen === "tie" && Song.toggleTie) Song.toggleTie(state.song, ev.measure, ev.beat);
    else if (pen === "rest") Song.setBeat(state.song, ev.measure, ev.beat, null);
    else if (pen === "chord" && Song.addChord) {
      if (!ev.pitch) Song.setBeat(state.song, ev.measure, ev.beat, pitch);
      else Song.addChord(state.song, ev.measure, ev.beat, pitch);
    } else if ((pen === "staccato" || pen === "accent" || pen === "tenuto") && Song.setArt) Song.setArt(state.song, ev.measure, ev.beat, pen);
    else Song.setBeat(state.song, ev.measure, ev.beat, ev.pitch === pitch ? null : pitch);
    keep();
    renderStaff();
    paintInks();
    paintKeypad();
  }
  function writePitch(pitch) {
    if (state.along) {
      $("lesson").textContent = "Play along is on. Turn it off to write the note.";
      return;
    }
    state.ink = pitch;
    const evs = Song.events(state.song);
    const step = state.playing && state.step >= 0 ? state.step : state.cursor;
    const ev = evs[step] || evs[0];
    writeAt(ev, pitch);
    const words = {
      quarter: "A quarter note. It is saved.",
      eighth: "Two eighth notes share this beat. It is saved.",
      tie: "Tied notes sound as one longer note. It is saved.",
      rest: "A rest. Count it. It is saved.",
      chord: "A chord stacks notes on this beat. It is saved.",
      staccato: "Staccato is short. It is saved.",
      accent: "An accent is louder. It is saved.",
      tenuto: "Tenuto holds the full beat. It is saved.",
    };
    const teach = $("teach");
    if (teach && !state.expert) teach.textContent = (TEACH[pitch] || "") + " " + (words[state.pen] || "It is saved.");
    $("lesson").textContent = words[state.pen] || "The note is saved.";
  }
  function paintKeypad() {
    const pen = $("pen");
    const box = $("keypad");
    if (pen && !pen.childElementCount) {
      [["quarter", "pen_quarter"], ["eighth", "pen_eighth"], ["tie", "pen_tie"], ["rest", "pen_rest"]].forEach(([id, key]) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "btn";
        b.dataset.pen = id;
        b.textContent = mu(key) || id;
        b.addEventListener("click", () => {
          state.pen = id;
          paintKeypad();
          const help = {
            quarter: "1 beat. Tap a letter.",
            eighth: "Fast. Tap a letter twice for two quick notes.",
            tie: "Longer. Tap the letter that is already on this beat.",
            rest: "Rest. Tap a letter to leave a silence.",
          };
          $("lesson").textContent = help[id];
        });
        pen.appendChild(b);
      });
    }
    if (box && !box.childElementCount) {
      [["chord", "Chord"], ["staccato", "Short"], ["accent", "Louder hit"], ["tenuto", "Full hold"]].forEach(([id, label]) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "btn";
        b.dataset.pen = id;
        b.textContent = label;
        b.addEventListener("click", () => {
          state.pen = id;
          paintKeypad();
          $("lesson").textContent = label + ". Then tap a letter.";
        });
        box.appendChild(b);
      });
      (Song.KEYS || ["C"]).forEach((key) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "btn";
        b.dataset.key = key;
        b.textContent = "Key " + key;
        b.addEventListener("click", () => {
          if (Song.setKey) Song.setKey(state.song, key);
          keep();
          renderStaff();
          paintKeypad();
          $("lesson").textContent = "Key of " + key + ". The staff shows that signature.";
        });
        box.appendChild(b);
      });
      [["pp", "Very soft"], ["p", "Soft"], ["mf", "Medium"], ["f", "Loud"], ["ff", "Very loud"]].forEach(([dyn, label]) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "btn";
        b.dataset.dyn = dyn;
        b.textContent = label;
        b.addEventListener("click", () => {
          const evs = Song.events(state.song);
          const ev = evs[state.cursor] || evs[0];
          if (ev && Song.setDyn) Song.setDyn(state.song, ev.measure, ev.beat, dyn);
          state.dyn = dyn;
          keep();
          renderStaff();
          $("lesson").textContent = label + " is written on this beat.";
        });
        box.appendChild(b);
      });
    }
    if (pen) {
      [...pen.children].forEach((btn) => {
        if (!btn.dataset.pen) return;
        const word = mu("pen_" + btn.dataset.pen);
        if (word) btn.textContent = word;
      });
    }
    [pen, box].forEach((host) => {
      if (!host) return;
      [...host.children].forEach((btn) => {
        if (btn.dataset.pen) btn.classList.toggle("on", btn.dataset.pen === state.pen);
        if (btn.dataset.key) btn.classList.toggle("on", btn.dataset.key === state.song.key);
      });
    });
  }

  function renderStaff() {
    const host = $("staff");
    if (!host) return;
    host.innerHTML = "";
    let abc = Song.toAbc(state.song);
    if (window.innerHeight < 520) abc = abc.replace(/^T:.*\n/m, "");
    if (!window.ABCJS || typeof window.ABCJS.renderAbc !== "function") {
      host.textContent = abc;
      nameLooseSvgs();
      return;
    }
    try {
      const pane = host.closest("#notes-pane") || host.parentElement || host;
      const wide = Math.max(280, (pane.clientWidth || host.clientWidth || 640) - 12);
      window.ABCJS.renderAbc(host, abc, {
        responsive: "resize",
        add_classes: true,
        staffwidth: wide,
        wrap: { minSpacing: 1.6, maxSpacing: 2.4, preferredMeasuresPerLine: wide < 420 ? 2 : 4 },
        paddingleft: 8,
        paddingright: 8,
      });
    } catch (err) {
      host.textContent = abc;
    }
    const svg = host.querySelector("svg");
    if (svg) {
      svg.setAttribute("role", "img");
      svg.setAttribute("aria-label", "Staff for this song");
      svg.style.width = "100%";
      svg.style.maxWidth = "none";
      svg.removeAttribute("height");
      svg.addEventListener("pointerdown", placeNote);
    }
    nameLooseSvgs();
  }


  function nameLooseSvgs() {
    document.querySelectorAll("svg[role='img']").forEach((svg) => {
      if (svg.getAttribute("aria-label") || svg.getAttribute("aria-labelledby")) return;
      if (svg.getAttribute("aria-hidden") === "true") return;
      svg.setAttribute("aria-hidden", "true");
    });
  }
  function placeNote(e) {
    const host = $("staff");
    const evs = Song.events(state.song);
    const svg = host.querySelector("svg");
    if (!svg || !evs.length) return;
    const marks = [...host.querySelectorAll(".abcjs-note, .abcjs-rest")];
    let glyph = 0;
    if (marks.length) {
      let best = Infinity;
      marks.forEach((node, i) => {
        const rect = node.getBoundingClientRect();
        const dx = Math.abs(e.clientX - (rect.left + rect.width / 2));
        if (dx < best) { best = dx; glyph = i; }
      });
    }
    const ev = evs.find((item) => item.glyph === glyph) || evs[Math.min(glyph, evs.length - 1)];
    const box = (host.querySelector(".abcjs-staff") || svg).getBoundingClientRect();
    const top = box.top - box.height * 0.15;
    const span = Math.max(1, box.height * 1.5);
    let pi = Math.round((1 - (e.clientY - top) / span) * (LEARN.length - 1));
    pi = Math.max(0, Math.min(LEARN.length - 1, pi));
    const pitch = LEARN[pi];
    state.cursor = evs.indexOf(ev);
    state.ink = pitch;
    writeAt(ev, pitch);
    $("lesson").textContent = "Higher on the staff is a higher note.";
  }

  function renderDrums() {
    const box = $("drums");
    box.innerHTML = "";
    const icons = {
      kick: '<svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="3"/><circle cx="12" cy="12" r="2" fill="currentColor"/></svg>',
      snare: '<svg aria-hidden="true" viewBox="0 0 24 24"><rect x="4" y="7" width="16" height="10" rx="2" fill="none" stroke="currentColor" stroke-width="3"/><path d="M6 12h12" stroke="currentColor" stroke-width="2"/></svg>',
      hat: '<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M3 9h18M4 15h16" fill="none" stroke="currentColor" stroke-width="3"/></svg>',
      clap: '<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M8 16c2 3 6 3 8 0M7 12V7M12 12V5M17 12V7" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>',
    };
    ROWS.forEach(([id], index) => {
      const label = mu("drum_" + id) || id;
      const row = document.createElement("div");
      row.className = "drum-row" + (index > 3 ? " is-extra" : "");
      const name = document.createElement("b");
      name.innerHTML = (icons[id] || "") + "<span>" + label + "</span>";
      row.appendChild(name);
      for (let i = 0; i < GRID; i++) {
        const on = !!state.drums[id][i];
        const cell = document.createElement("button");
        cell.type = "button";
        cell.className = "cell" + (on ? " on" : "") + (state.grid === i ? " now" : "");
        cell.setAttribute("aria-pressed", on ? "true" : "false");
        cell.setAttribute("aria-label", label + " beat " + (i + 1) + (on ? ", on" : ", off"));
        cell.dataset.track = id;
        cell.dataset.step = String(i);
        cell.addEventListener("click", () => {
          state.drums[id][i] = !state.drums[id][i];
          keep();
          renderDrums();
          if (id === "kick" && i === 0 && state.drums.kick[0]) {
            $("lesson").textContent = mu("kickPulse");
          }
        });
        row.appendChild(cell);
      }
      box.appendChild(row);
    });
  }

  function paintLooks() {
    const box = $("looks");
    box.innerHTML = "";
    LOOKS.forEach(([id, label]) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "btn" + (state.look === id ? " on" : "");
      b.textContent = mu("look_" + id) || label;
      b.addEventListener("click", () => {
        state.look = id;
        if (state.layers[0]) state.layers[0].look = id;
        const layer = $("layer-0");
        if (layer) layer.value = id;
        saveSkin();
        keep();
        paintLooks();
      });
      box.appendChild(b);
    });
  }
  function syncSynth() {
    $("s-bright").value = String(state.bright);
    $("n-bright").textContent = String(state.bright);
    $("s-len").value = String(Math.round(state.noteLen * 100));
    $("n-len").textContent = String(Math.round(state.noteLen * 100));
    $("s-echo").value = String(Math.round(state.echo * 100));
    $("n-echo").textContent = String(Math.round(state.echo * 100));
    $("s-wob").value = String(state.wobble);
    $("n-wob").textContent = String(state.wobble);
  }
  function paintFx() {
    const box = $("fx");
    box.innerHTML = "";
    FX.forEach((fx) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "btn" + (state.fx === fx.id ? " on" : "");
      b.textContent = mu("fx_" + fx.id) || fx.name;
      b.addEventListener("click", () => {
        state.fx = fx.id;
        state.wave = fx.wave;
        state.bright = fx.bright;
        state.noteLen = fx.noteLen;
        state.echo = fx.echo;
        state.wobble = fx.wobble;
        state.hip = fx.hip;
        state.delay = fx.delay;
        state.feedback = fx.feedback;
        applyFx();
        syncSynth();
        paintFx();
        paintWaves();
        keep();
        arm();
        tone(392, state.noteLen, state.wave, 0.2);
        $("lesson").textContent = mu("fxOn", { name: mu("fx_" + fx.id) || fx.name });
      });
      box.appendChild(b);
    });
  }
  function paintWaves() {
    const box = $("waves");
    box.innerHTML = "";
    WAVES.forEach(([id, label]) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "btn" + (state.wave === id ? " on" : "");
      b.textContent = mu("wave_" + id) || label;
      b.addEventListener("click", () => {
        state.wave = id;
        paintWaves();
        keep();
        arm();
        tone(392, state.noteLen, state.wave, 0.2);
        $("lesson").textContent = mu("waveOn", { name: mu("wave_" + id) || label });
      });
      box.appendChild(b);
    });
  }

  function paintRec() {
    const btn = $("rec-btn");
    if (!btn) return;
    btn.classList.toggle("on", state.recording);
    btn.textContent = state.recording ? (mu("recording") || "Recording") : (mu("record") || "Record");
    btn.setAttribute("aria-pressed", String(state.recording));
  }
  function canStamp() {
    return state.recording && state.armBeats === 0 && state.playing && state.step >= 0;
  }
  function writeHit(id, step) {
    if (step < 0 || step > 15) return;
    if (FREQ[id]) {
      const ev = Song.events(state.song)[step];
      if (!ev || ev.pitch === id) return;
      Song.setBeat(state.song, ev.measure, ev.beat, id);
      renderStaff();
    } else if (state.drums[id]) {
      state.drums[id][step] = true;
      const cell = document.querySelector('.cell[data-track="' + id + '"][data-step="' + step + '"]');
      if (cell) cell.classList.add("on");
    } else return;
    keep();
    paintCount();
  }
  function placeStep() {
    if (state.armBeats > 0) return -1;
    if (state.playing && state.step >= 0) return state.step;
    const now = Date.now();
    if (now - state.lastStamp < 400) return state.writeStep;
    if (state.lock != null) {
      state.writeStep = state.lock;
      state.step = state.lock;
      state.lastStamp = now;
      paintCount();
      return state.lock;
    }
    state.writeStep = state.step < 0 ? 0 : (state.step + 1) % GRID;
    state.step = state.writeStep;
    state.lastStamp = now;
    paintCount();
    return state.writeStep;
  }
  function side(which) {
    const blend = Math.max(0, Math.min(100, state.blend == null ? 50 : state.blend));
    const amt = which === "notes" ? blend : 100 - blend;
    return Math.min(1.15, amt / 70);
  }
  function blendWord(n) {
    if (n < 35) return mu("drumsWord");
    if (n > 65) return mu("score");
    return mu("both");
  }
  function paintFeel(text, kind) {
    const el = $("feel");
    if (!el) return;
    el.textContent = text;
    el.className = "feel" + (kind ? " " + kind : "");
  }
  function vol(id, base) {
    const n = state.mix && typeof state.mix[id] === "number" ? state.mix[id] : 100;
    return base * Math.max(0, Math.min(100, n)) / 100 * side("drums");
  }
  function hitSound(id, when) {
    if (state.muted || !ctx) return;
    const t = atTime(when);
    if (id === "kick") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      state.made += 2;
      osc.type = "sine";
      osc.frequency.setValueAtTime(164, t);
      osc.frequency.exponentialRampToValueAtTime(42, t + 0.14);
      gain.gain.setValueAtTime(Math.max(0.001, vol("kick", 0.9)), t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.42);
      osc.connect(gain);
      gain.connect(bus);
      osc.start(t);
      osc.stop(t + 0.46);
    } else if (id === "snare") {
      tone(188, 0.16, "triangle", vol("snare", 0.35), t);
      noise(0.16, vol("snare", 0.42), t, 900);
    } else if (id === "clap") {
      noise(0.04, vol("clap", 0.34), t, 1200);
      noise(0.04, vol("clap", 0.28), t + 0.012, 1200);
      noise(0.07, vol("clap", 0.22), t + 0.026, 1000);
    } else if (id === "hat") noise(0.035, vol("hat", 0.18), t, 7000);
    else if (id === "tom") tone(148, 0.2, "triangle", vol("tom", 0.55), t);
    else if (id === "shaker") noise(0.05, vol("shaker", 0.14), t, 5000);
    else if (id === "rim") tone(740, 0.04, "square", vol("rim", 0.22), t);
    else if (id === "bell") tone(540, 0.16, "square", vol("bell", 0.18), t);
    else if (id === "tamb") noise(0.08, vol("tamb", 0.16), t, 4000);
    else if (id === "crash") noise(0.35, vol("crash", 0.22), t, 3500);
    else if (FREQ[id]) tone(FREQ[id], state.noteLen, state.wave, 0.24 * side("notes"), t);
  }
  function strike(id, el) {
    arm();
    if (el) {
      el.classList.add("hit");
      window.setTimeout(() => el.classList.remove("hit"), 140);
    }
    if (id === "kick") { state.kick = true; state.bins[2] = 255; }
    else if (id === "snare" || id === "clap") { state.snare = true; state.bins[10] = 220; }
    else if (id === "hat") state.bins[42] = 210;
    else if (FREQ[id]) state.bins[24] = 230;
    if (!state.muted) hitSound(id);
    if (navigator.vibrate) navigator.vibrate(12);
    if (state.along) {
      if (!state.playing) play();
      const gap = Math.max(1, gapAfter(Math.max(0, state.step)));
      const age = performance.now() - (state.beatAt || performance.now());
      const ratio = age / gap;
      let word = "On it";
      let kind = "on";
      if (ratio > 0.42 && ratio < 0.75) { word = "Late"; kind = "late"; }
      else if (ratio >= 0.75) { word = "Early"; kind = "early"; }
      const beat = state.step >= 0 ? state.step + 1 : 1;
      paintFeel(word, kind);
      $("lesson").textContent = word + " on beat " + beat + ". The score stayed the same.";
      return;
    }
    const step = placeStep();
    if (step >= 0) writeHit(id, step);
    if (!state.playing) window.setTimeout(() => { state.kick = false; state.snare = false; }, 160);
    $("lesson").textContent = step < 0
      ? "Wait for the count. Then each tap stays."
      : "Beat " + (step + 1) + " is saved.";
  }
  function bindPad(el, id) {
    el.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      state.held[id] = true;
      try { el.setPointerCapture(e.pointerId); } catch (err) { /* a tap still counts */ }
      strike(id, el);
    });
    const up = () => { state.held[id] = false; };
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
  }
  function buildKit() {
    const box = $("kit");
    ROWS.forEach(([id, label]) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "pad " + id;
      b.textContent = label;
      b.setAttribute("aria-label", label);
      bindPad(b, id);
      box.appendChild(b);
    });
    const extra = $("more-kit");
    ["rim", "bell", "tamb", "crash"].forEach((id) => {
      const pad = box.querySelector(".pad." + id);
      if (pad && extra) extra.appendChild(pad);
    });
    const keys = document.createElement("div");
    keys.className = "keys";
    LEARN.forEach((id) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "key";
      b.textContent = id;
      b.setAttribute("aria-label", "Note " + id);
      bindPad(b, id);
      keys.appendChild(b);
    });
    box.appendChild(keys);
  }

  function namesAt(step) {
    const evs = Song.events(state.song);
    const ev = evs[step];
    const names = [];
    ROWS.forEach(([id, label]) => { if (state.drums[id][step]) names.push(label); });
    if (ev && ev.label) names.push(ev.label);
    if (!names.length) names.push("Rest");
    return names;
  }

  function chooseBeat(i) {
    state.lock = i;
    state.step = i;
    state.writeStep = i;
    state.lastStamp = Date.now();
    paintCount();
    $("lesson").textContent = "Beat " + (i + 1) + " is picked. Tap a pad. It stays there.";
  }
  function paintCount() {
    const box = $("lane");
    if (!box) return;
    const evs = Song.events(state.song);
    const step = state.step < 0 ? state.cursor : state.step;
    const here = evs[Math.max(0, step)] || evs[0];
    const bar = here ? here.measure : 0;
    const start = evs.findIndex((ev) => ev.measure === bar);
    const beats = evs.filter((ev) => ev.measure === bar);
    if (box.children.length !== beats.length || box.dataset.bar !== String(bar)) {
      box.dataset.bar = String(bar);
      box.innerHTML = "";
      beats.forEach((ev, i) => {
        const col = document.createElement("button");
        col.type = "button";
        col.className = "col";
        col.addEventListener("click", () => {
          state.cursor = start + i;
          if (!state.playing) state.step = state.cursor;
          paintCount();
          $("lesson").textContent = "Bar " + (bar + 1) + ", beat " + (i + 1) + " is picked. Tap a note. It stays.";
        });
        const n = document.createElement("b");
        n.textContent = String(i + 1);
        const marks = document.createElement("span");
        marks.className = "marks";
        col.append(n, marks);
        box.appendChild(col);
      });
    }
    const local = here ? here.beat : 0;
    [...box.children].forEach((col, i) => {
      col.classList.toggle("on", i === local);
      const ev = beats[i];
      const bits = [];
      if (ev && ev.label) bits.push("<em>" + ev.label + "</em>");
      col.querySelector(".marks").innerHTML = bits.join("");
      col.setAttribute("aria-label", "Bar " + (bar + 1) + " beat " + (i + 1) + (ev && ev.label ? ". " + ev.label : ". Rest"));
    });
    const title = $("song-title");
    if (title) title.textContent = (state.song.alias || "Your song") + " · " + (state.song.meter || "4/4") + " · " + state.song.measures.length + " bars";
    paintWhy();
  }
  function markAt(step) {
    const evs = Song.events(state.song);
    return evs[Math.max(0, step)] || evs[0];
  }
  function paintWhy() {
    const ask = $("why-ask");
    const progress = $("why-progress");
    if (!ask || !progress) return;
    const evs = Song.events(state.song);
    const why = state.song.why || {};
    let done = 0;
    evs.forEach((ev) => { if (why[ev.measure + "-" + ev.beat]) done += 1; });
    progress.textContent = done === evs.length
      ? "You can defend every mark on this score."
      : done + " of " + evs.length + " marks have a reason.";
    const step = state.playing && state.step >= 0 ? state.step : state.cursor;
    const ev = markAt(step);
    if (!ev) return;
    const fact = ev.pitch ? (TEACH[ev.pitch] || ev.label) : "Rest. Count it. Nothing plays.";
    const said = why[ev.measure + "-" + ev.beat];
    const sentence = said ? (REASONS.find((pair) => pair[0] === said) || ["", ""])[1] : "Why is it here?";
    ask.textContent = "Bar " + (ev.measure + 1) + ", beat " + (ev.beat + 1) + ". " + fact + " " + sentence;
    document.querySelectorAll("#why-reasons .btn").forEach((btn) => {
      btn.classList.toggle("on", btn.dataset.why === said);
    });
  }
  function pulse(step, opts) {
    opts = opts || {};
    state.beatAt = performance.now();
    if (!opts.audioOnly) state.step = opts.event != null ? opts.event : step;
    paintCount();
    const drum = typeof opts.grid === "number" ? opts.grid : (step % GRID);
    state.kick = !!state.drums.kick[drum];
    state.snare = !!state.drums.snare[drum];
    const evs = Song.events(state.song);
    const ev = evs[step];
    const bins = state.bins;
    for (let i = 0; i < bins.length; i++) bins[i] = 24;
    if (state.kick) bins[2] = 230;
    if (state.snare) bins[10] = 180;
    if (state.drums.hat[drum]) bins[40] = 140;
    if (state.drums.tom && state.drums.tom[drum]) bins[12] = 170;
    if (state.drums.shaker && state.drums.shaker[drum]) bins[50] = 130;
    if (ev && ev.tone) bins[22] = 200;
    let counting = false;
    if (state.armBeats > 0) {
      counting = true;
      const count = (state.armTotal || 4) - state.armBeats + 1;
      state.armBeats -= 1;
      $("now-line").textContent = "Count " + count + ". Then tap.";
      if (!state.muted) tone(880, 0.06, "square", 0.15);
    }
    if (state.recording && state.armBeats === 0) {
      Object.keys(state.held).forEach((id) => {
        if (state.held[id]) writeHit(id, step);
      });
    }
    if (state.turn === "listen" || state.turn === "answer") {
      state.turnLeft -= 1;
      if (state.turn === "listen" && state.turnLeft <= 0) {
        state.turn = "answer";
        state.turnLeft = 8;
        state.recording = true;
        state.armBeats = 0;
        paintRec();
        $("lesson").textContent = "Your turn. Tap the pads. The beats you tap stay in the song.";
      } else if (state.turn === "answer" && state.turnLeft <= 0) {
        state.turn = "";
        state.recording = false;
        paintRec();
        $("lesson").textContent = "The class can hear your turn. Press Play to hear it again.";
      }
    }
    const off = state.muted ? "Sound is off. " : "";
    const lead = state.turn === "listen" ? "Listen. " : state.turn === "answer" ? "Your turn. " : "";
    if (!counting) {
      const note = ev && ev.label ? ev.label : "Rest";
      const bar = ev ? ev.measure + 1 : 1;
      const beat = ev ? ev.beat + 1 : step + 1;
      $("now-line").textContent = lead + off + "Bar " + bar + ", beat " + beat + ". Now: " + namesAt(drum).join(" and ") + ".";
      if (!state.along) paintFeel(note, note === "Rest" ? "" : "on");
      const teach = $("teach");
      if (teach) {
        teach.textContent = state.expert
          ? "Bar " + bar + " of " + state.song.measures.length + "."
          : (ev && ev.pitch ? TEACH[ev.pitch] || note : "Rest. Count it. Nothing plays.");
      }
    }
    if (state.showing) {
      const bar = $("show-bar");
      if (bar) bar.style.width = Math.round(((step + 1) / songLen()) * 100) + "%";
    }
    const marks = document.querySelectorAll("#staff .abcjs-note, #staff .abcjs-rest");
    const evNow = evs[step];
    marks.forEach((node, i) => node.classList.toggle("now", !!(evNow && i === evNow.glyph)));
    document.querySelectorAll(".cell").forEach((cell) => cell.classList.remove("now"));
    document.querySelectorAll(".drum-row").forEach((row) => {
      const cells = row.querySelectorAll(".cell");
      if (cells[drum]) cells[drum].classList.add("now");
    });
    const when = typeof opts.when === "number" ? opts.when : (ctx ? ctx.currentTime : 0);
    if (opts.visualOnly) return;
    if (state.muted && !(state.recording && state.mode === "notes")) return;
    if (state.click || (state.recording && state.mode === "notes")) tone(1400, 0.03, "square", 0.07, when);
    if (state.muted) return;
    if (state.parts.drums !== false) {
      ROWS.forEach(([id]) => { if (state.drums[id] && state.drums[id][drum]) hitSound(id, when); });
    }
    const playWritten = (freq, beats, art, dyn, at) => {
      if (!freq || state.parts.melody === false) return;
      const steps = ["pp", "p", "mf", "f", "ff"];
      let use = dyn || state.dyn || "mf";
      if (art === "accent") {
        const i = steps.indexOf(use);
        use = steps[Math.min(4, Math.max(0, i) + 1)] || "f";
      }
      let hold = (60 / Math.max(70, state.song.bpm || 96)) * Math.max(0.35, beats || 1);
      if (state.song.meter === "6/8") hold *= 0.5;
      if (art === "staccato") hold *= 0.4;
      if (state.orch !== "beep") sectionTone(freq, hold, state.orch, use, at);
      else tone(freq, hold, state.wave, (art === "accent" ? 0.32 : 0.22) * side("notes"), at);
    };
    const melodyOn = opts.melody !== false;
    if (melodyOn && ev && ev.eighths && !ev.tiedFrom) {
      if (ev.dyn) state.dyn = ev.dyn;
      playWritten(Song.freqOf ? Song.freqOf(ev.eighths[0], state.song.key) : ev.freq, 0.5, ev.art, ev.dyn || state.dyn, when);
      const half = (typeof opts.when === "number" ? (60 / Math.max(70, state.song.bpm || 96)) / 4 : gapAfter(step) / 2000);
      if (typeof opts.when === "number") {
        playWritten(Song.freqOf ? Song.freqOf(ev.eighths[1], state.song.key) : null, 0.5, "", ev.dyn || state.dyn, when + half * 2);
      } else {
        window.clearTimeout(state.eighthTimer);
        state.eighthTimer = window.setTimeout(() => {
          playWritten(Song.freqOf ? Song.freqOf(ev.eighths[1], state.song.key) : null, 0.5, "", ev.dyn || state.dyn);
        }, gapAfter(step) / 2);
      }
    } else if (melodyOn && ev && !ev.tiedFrom && (ev.freq || ev.pitch)) {
      if (ev.dyn) state.dyn = ev.dyn;
      const freq = ev.freq || (Song.freqOf ? Song.freqOf(ev.pitch, state.song.key) : null);
      playWritten(freq, ev.durBeats || 1, ev.art, ev.dyn || state.dyn, when);
      (ev.chord || []).forEach((id) => playWritten(Song.freqOf(id, state.song.key), ev.durBeats || 1, ev.art, ev.dyn || state.dyn, when));
    }
    if ((state.bass || state.parts.bass) && state.drums.kick && state.drums.kick[drum]) {
      const root = ({ C: 65.41, G: 98, D: 73.42, F: 87.31, Bb: 58.27 })[state.song.key] || 65.41;
      tone(root, 0.36, "sine", 0.42 * side("notes"), when);
    }
    if (state.parts.chords && drum % 8 === 0) {
      const root = ({ C: 130.81, G: 196, D: 146.83, F: 174.61, Bb: 116.54 })[state.song.key] || 130.81;
      tone(root, 0.28, "triangle", 0.12, when);
      tone(root * 1.2599, 0.28, "triangle", 0.1, when);
      tone(root * 1.4983, 0.28, "triangle", 0.1, when);
    }
  }

  function gapAfter(step) {
    const unit = state.song.meter === "6/8" ? 2 : 1;
    const base = 60000 / Math.max(70, state.song.bpm || 96) / unit;
    const lean = Math.max(0, Math.min(60, state.swing || 0)) / 100;
    return Math.round(base * (step % 2 === 0 ? 1 + lean * 0.45 : 1 - lean * 0.45));
  }
  function stepSeconds(grid) {
    const bpm = Math.max(70, state.song.bpm || 96);
    const base = (60 / bpm) / 4;
    const lean = Math.max(0, Math.min(60, state.swing || 0)) / 100;
    return base * (grid % 2 === 0 ? 1 + lean * 0.45 : 1 - lean * 0.45);
  }
  function stepsPerEvent() {
    return state.song.meter === "6/8" ? 2 : 4;
  }
  function scheduleHit(grid, eventIndex, when, melody) {
    if (!ctx || state.muted) return;
    if (state.parts.drums !== false) {
      ROWS.forEach(([id]) => { if (state.drums[id] && state.drums[id][grid]) hitSound(id, when); });
    }
    if (melody && state.parts.melody !== false) {
      const ev = Song.events(state.song)[eventIndex];
      if (ev && !ev.tiedFrom && (ev.freq || ev.pitch)) {
        const freq = ev.freq || (Song.freqOf ? Song.freqOf(ev.pitch, state.song.key) : null);
        const hold = (60 / Math.max(70, state.song.bpm || 96)) * Math.max(0.35, ev.durBeats || 1);
        if (state.orch !== "beep") sectionTone(freq, hold, state.orch, ev.dyn || state.dyn, when);
        else tone(freq, Math.min(0.45, hold), state.wave, 0.22 * side("notes"), when);
      }
    }
    if ((state.bass || state.parts.bass) && state.drums.kick && state.drums.kick[grid]) {
      const root = ({ C: 65.41, G: 98, D: 73.42, F: 87.31, Bb: 58.27 })[state.song.key] || 65.41;
      tone(root, 0.38, "sine", 0.46, when);
    }
    if (state.parts.chords && grid % 8 === 0) {
      const root = ({ C: 130.81, G: 196, D: 146.83, F: 174.61, Bb: 116.54 })[state.song.key] || 130.81;
      tone(root, 0.26, "triangle", 0.12, when);
      tone(root * 1.2599, 0.26, "triangle", 0.09, when);
      tone(root * 1.4983, 0.26, "triangle", 0.09, when);
    }
  }
  function paintMute() {
    const btn = $("mute-btn");
    if (!btn) return;
    btn.replaceChildren();
    const ico = document.createElement("span");
    ico.setAttribute("aria-hidden", "true");
    ico.textContent = state.muted ? "🔇" : "🔊";
    btn.append(ico, document.createTextNode(" " + (state.muted ? (mu("soundOff") || "Sound off") : (mu("soundOn") || "Sound on"))));
    btn.setAttribute("aria-pressed", String(!!state.muted));
    btn.setAttribute("aria-label", state.muted ? (mu("soundOff") || "Sound off") : (mu("soundOn") || "Sound on"));
    const banner = $("sound-banner");
    if (banner) banner.hidden = !state.muted;
  }
  function advanceTurn() {
    if (state.turn !== "listen" && state.turn !== "answer") return;
    state.turnLeft -= 1;
    if (state.turn === "listen" && state.turnLeft <= 0) {
      state.turn = "answer";
      state.turnLeft = GRID;
      state.recording = true;
      paintRec();
      state.turnNote = mu("yourTurn");
      if ($("lesson")) $("lesson").textContent = mu("yourTurnLesson");
    } else if (state.turn === "answer" && state.turnLeft <= 0) {
      state.turn = "";
      state.recording = false;
      paintRec();
      state.turnNote = mu("tapsStayed");
      if ($("lesson")) $("lesson").textContent = mu("hearAgain");
    }
  }
  function paintBeat(grid) {
    const names = [];
    document.querySelectorAll(".drum-row").forEach((row) => {
      row.querySelectorAll(".cell").forEach((cell) => {
        const here = Number(cell.dataset.step) === grid;
        cell.classList.toggle("now", here);
        const sounding = here && cell.classList.contains("on");
        cell.classList.toggle("flash", sounding);
        const shown = row.offsetParent !== null;
        if (sounding && shown) {
          const word = row.querySelector("b span");
          if (word && names.indexOf(word.textContent) < 0) names.push(word.textContent);
        }
      });
    });
    const line = $("beat-line");
    if (!line) return;
    if (state.turnNote) {
      line.textContent = state.turnNote;
      state.turnNote = "";
      return;
    }
    const heard = names.length ? names.join(" · ") : (mu("rest") || "Rest");
    line.textContent = mu("beatLine", { n: grid + 1, heard: heard });
  }
  function beatScore() {
    const voices = ["kick", "snare", "hat", "clap"];
    let on = 0;
    let used = 0;
    voices.forEach((id) => {
      const steps = to16(state.drums && state.drums[id]);
      const hit = steps.reduce((n, step) => n + (step ? 1 : 0), 0);
      if (hit) used += 1;
      on += hit;
    });
    const stars = used >= 3 ? 3 : used >= 2 ? 2 : used >= 1 ? 1 : 0;
    return { on: on, stars: stars };
  }
  function wireScore(level, score, max, stars, xp) {
    const api = window.KulibertWho;
    if (!api || !signedKid()) return;
    const id = String(level || "beat").replace(/\s+/g, " ").trim().slice(0, 40) || "beat";
    const line = (id + " " + score).slice(0, 32);
    if (api.saveApp) api.saveApp("musiclab", { line: line });
    const star = Math.max(0, Math.min(3, Number(stars) || 0));
    const ms = state.playAt ? Math.max(0, Date.now() - state.playAt) : 0;
    if (typeof api.record === "function") {
      api.record({
        app: "musiclab",
        version: "MU 2.35.2",
        event: "score",
        level: id,
        score: score,
        max: max,
        stars: star,
        xp: xp,
        skill: "music",
        ms: ms
      });
      return;
    }
    if (api.mark) api.mark("musiclab", line);
  }
  function finishSong(level) {
    if (!signedKid()) return;
    const heard = beatScore();
    const title = state.song && (state.song.title || state.song.name) ? String(state.song.title || state.song.name) : "";
    const stamp = title + ":" + heard.on + ":" + heard.stars;
    if (state.finishStamp === stamp) return;
    state.finishStamp = stamp;
    wireScore(level, heard.on || 1, 64, heard.stars, Math.max(5, heard.stars * 5));
  }
  function shopPrefs() {
    const who = window.KulibertWho;
    return who && who.prefs ? who.prefs : null;
  }
  function play(opts) {
    window.clearTimeout(state.timer);
    window.cancelAnimationFrame(state.raf);
    arm();
    if (ctx && ctx.state === "suspended") ctx.resume();
    resyncBus();
    const banner = $("sound-banner");
    if (banner) banner.hidden = document.documentElement.getAttribute("data-kp-sound") !== "0";
    state.once = !!(opts && opts.once);
    state.playing = true;
    state.playAt = Date.now();
    state.confettiDone = false;
    document.body.classList.add("playing");
    sayHow(state.mode);
    state.counting = false;
    $("play-btn").classList.add("on");
    $("play-btn").setAttribute("aria-label", playWordText(true));
    const playWord = $("play-word");
    if (playWord) playWord.textContent = playWordText(true);
    if (!ctx) return;
    const spe = stepsPerEvent();
    const start = ctx.currentTime + 0.04;
    let grid = 0;
    let ev = 0;
    let next = start;
    let eventCount = 0;
    const songN = songLen();
    state.plan = [];
    const schedule = () => {
      if (!state.playing || !ctx) return;
      const horizon = ctx.currentTime + 0.12;
      while (next < horizon) {
        const melody = grid % spe === 0;
        scheduleHit(grid, ev, next, melody);
        state.plan.push({ when: next, grid: grid, event: ev });
        if (state.plan.length > 48) state.plan.shift();
        if (melody) {
          eventCount += 1;
          if (state.once && eventCount >= songN) {
            const endAt = next + stepSeconds(grid);
            state.timer = window.setTimeout(() => {
              stop();
              if (state.showing) bow();
            }, Math.max(20, (endAt - ctx.currentTime) * 1000));
            return;
          }
          ev = (ev + 1) % songN;
        }
        next += stepSeconds(grid);
        grid = (grid + 1) % GRID;
      }
      state.timer = window.setTimeout(schedule, 25);
    };
    schedule();
    const follow = () => {
      if (!state.playing || !ctx) return;
      const now = ctx.currentTime;
      let hit = null;
      state.plan.forEach((item) => { if (item.when <= now) hit = item; });
      if (hit) {
        state.grid = hit.grid;
        state.step = hit.event;
        document.querySelectorAll(".cell").forEach((cell) => {
          cell.classList.toggle("now", Number(cell.dataset.step) === hit.grid);
        });
        const bob = $("berty-bob");
        const less = document.documentElement.getAttribute("data-kp-motion") === "less"
          || document.body.classList.contains("pref-less-motion")
          || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        if (bob) {
          if (less) bob.classList.remove("on");
          else bob.classList.toggle("on", hit.grid % 2 === 0);
        }
        if (hit.grid !== state.seenGrid) {
          state.seenGrid = hit.grid;
          advanceTurn();
          paintBeat(hit.grid);
        }
        if (hit.grid === 0 && now - start > 0.2 && !state.confettiDone) {
          state.confettiDone = true;
          popConfetti();
        }
        if (state.bins) {
          state.bins[2] = state.drums.kick && state.drums.kick[hit.grid] ? 230 : 40;
          state.bins[10] = state.drums.snare && state.drums.snare[hit.grid] ? 200 : 30;
          state.bins[40] = state.drums.hat && state.drums.hat[hit.grid] ? 160 : 24;
        }
      }
      state.raf = window.requestAnimationFrame(follow);
    };
    state.raf = window.requestAnimationFrame(follow);
  }
  function stop() {
    state.playing = false;
    document.body.classList.remove("playing");
    sayHow(state.mode);
    window.clearTimeout(state.timer);
    window.clearTimeout(state.eighthTimer);
    window.cancelAnimationFrame(state.raf);
    $("play-btn").classList.remove("on");
    $("play-btn").setAttribute("aria-label", playWordText(false));
    const playWord = $("play-word");
    if (playWord) playWord.textContent = playWordText(false);
    state.recording = false;
    state.armBeats = 0;
    state.turn = "";
    state.held = {};
    paintRec();
    const bob = $("berty-bob");
    if (bob) bob.classList.remove("on");
    $("now-line").textContent = state.showing ? (mu("ready") || "Ready") : (mu("pressPlay") || "Press Play. You can leave the sound off.");
  }

  function showCurtain() {
    const curtain = $("curtain");
    const bow = $("bow");
    if (bow) bow.hidden = true;
    if (!curtain) return;
    curtain.hidden = false;
    setBdi($("curtain-title"), state.song.alias || mu("yourSong") || "Your song");
    const bars = state.song.measures ? state.song.measures.length : 1;
    $("curtain-meta").textContent = bars + " " + (mu("bars") || "bars") + " · " + (state.song.meter || "4/4") + " · " + state.song.bpm;
    $("feel").textContent = mu("ready") || "Ready";
    $("feel").className = "feel";
    const bar = $("show-bar");
    if (bar) bar.style.width = "0%";
  }
  function openShow() {
    if (state.playing) stop();
    window.clearTimeout(state.timer);
    state.showing = true;
    state.counting = false;
    state.showBackup = { rgb: state.rgb, wild: state.gear.wild, frame: state.frame };
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!reduce) {
      state.rgb = true;
      state.gear.wild = Math.max(78, state.gear.wild);
    }
    if (state.frame === "none") state.frame = "glow";
    document.body.classList.add("show");
    fitViz();
    showCurtain();
    $("now-line").textContent = "One song. The picture follows. Sound can stay off.";
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        if (stageApi && stageApi.resize) stageApi.resize();
      });
    });
  }
  function closeShow() {
    state.counting = false;
    state.once = false;
    if (state.playing) stop();
    window.clearTimeout(state.timer);
    state.showing = false;
    if (state.showBackup) {
      state.rgb = state.showBackup.rgb;
      state.gear.wild = state.showBackup.wild;
      state.frame = state.showBackup.frame;
      state.showBackup = null;
    }
    document.body.classList.remove("show");
    fitViz();
    if ($("curtain")) $("curtain").hidden = true;
    if ($("bow")) $("bow").hidden = true;
    $("feel").textContent = mu("ready") || "Ready";
    $("now-line").textContent = mu("pressPlay");
  }
  function bow() {
    if (!state.showing) return;
    if ($("curtain")) $("curtain").hidden = true;
    const card = $("bow");
    if (card) card.hidden = false;
    setBdi($("bow-title"), state.song.alias || mu("yourSong") || "Your song");
    $("feel").textContent = mu("ready") || "Ready";
    $("feel").className = "feel on";
    $("now-line").textContent = mu("thatsSong");
    const bar = $("show-bar");
    if (bar) bar.style.width = "100%";
    state.kick = true;
    state.snare = true;
    state.bins[2] = 255;
    state.bins[10] = 220;
    state.bins[22] = 240;
  }
  function beginShow() {
    if (!state.showing) openShow();
    window.clearTimeout(state.timer);
    if ($("curtain")) $("curtain").hidden = true;
    if ($("bow")) $("bow").hidden = true;
    state.counting = true;
    let left = 4;
    const gap = Math.round(60000 / Math.max(70, state.song.bpm || 96));
    const tick = () => {
      if (!state.showing || !state.counting) return;
      $("feel").textContent = String(left);
      $("feel").className = "feel on";
      $("now-line").textContent = "Count " + left + ".";
      if (!state.muted) tone(880, 0.05, "square", 0.1);
      left -= 1;
      if (left < 1) {
        state.timer = window.setTimeout(() => play({ once: true }), gap);
        return;
      }
      state.timer = window.setTimeout(tick, gap);
    };
    tick();
  }

  const BAND = [
    { id: "flute", family: "Woodwind", name: "Flute", start: "Blow across the hole, like a bottle. Keep the air steady.", concert: "You read concert pitch. Your B-flat is the band's B-flat.", notes: [
      { name: "Bb", how: "Thumb and first finger, plus the B-flat thumb key.", freq: 466.2 },
      { name: "C", how: "Left thumb and first finger.", freq: 523.3 },
      { name: "D", how: "Left thumb and three fingers. Right three fingers.", freq: 587.3 },
      { name: "Eb", how: "Lift the left first finger. The other fingers stay down.", freq: 622.3 },
      { name: "F", how: "Left three fingers, right first finger, and the right pinky.", freq: 698.5 },
    ]},
    { id: "oboe", family: "Woodwind", name: "Oboe", start: "Both lips on the reed. Small air. Sit tall.", concert: "You read concert pitch. Your B-flat is the band's B-flat.", notes: [
      { name: "B", how: "Left thumb and first finger.", freq: 493.9 },
      { name: "C", how: "Add the left second finger.", freq: 523.3 },
      { name: "D", how: "Left thumb and three fingers.", freq: 587.3 },
      { name: "E", how: "Add the right first finger.", freq: 659.3 },
      { name: "F", how: "Add the right second finger.", freq: 698.5 },
    ]},
    { id: "clarinet", family: "Woodwind", name: "Clarinet", start: "Flat chin. Firm corners. Soft air into the mouthpiece.", concert: "You read B-flat. Your written C is the band's B-flat.", notes: [
      { name: "C", how: "Thumb, and three fingers on each hand.", freq: 466.2 },
      { name: "D", how: "Lift the right pinky. Keep the other fingers down.", freq: 523.3 },
      { name: "E", how: "Lift the right ring finger too.", freq: 587.3 },
      { name: "F", how: "Lift the right middle finger too.", freq: 622.3 },
      { name: "G", how: "Left hand only. Thumb and three fingers.", freq: 698.5 },
    ]},
    { id: "basscl", family: "Woodwind", name: "Bass clarinet", start: "The peg or strap holds it. Flat chin. Soft air.", concert: "You read B-flat, one octave lower. Your written C is the band's low B-flat.", notes: [
      { name: "C", how: "Thumb, and three fingers on each hand.", freq: 233.1 },
      { name: "D", how: "Lift the right pinky. Keep the other fingers down.", freq: 261.6 },
      { name: "E", how: "Lift the right ring finger too.", freq: 293.7 },
      { name: "F", how: "Lift the right middle finger too.", freq: 311.1 },
      { name: "G", how: "Left hand only. Thumb and three fingers.", freq: 349.2 },
    ]},
    { id: "alto", family: "Woodwind", name: "Alto sax", start: "Relaxed mouth. Even air. The neck strap holds the weight.", concert: "You read E-flat. Your written G is the band's B-flat.", notes: [
      { name: "G", how: "Three fingers on the left hand.", freq: 466.2 },
      { name: "A", how: "Two fingers on the left hand.", freq: 523.3 },
      { name: "B", how: "One finger on the left hand.", freq: 587.3 },
      { name: "C", how: "No fingers down.", freq: 622.3 },
      { name: "D", how: "Octave key, and three fingers on the left.", freq: 698.5 },
    ]},
    { id: "tenor", family: "Woodwind", name: "Tenor sax", start: "The strap holds it. Relaxed mouth. Even air.", concert: "You read B-flat. Your written C is the band's B-flat.", notes: [
      { name: "C", how: "No fingers down. This is the band's B-flat.", freq: 466.2 },
      { name: "D", how: "Octave key, and three fingers on the left.", freq: 523.3 },
      { name: "E", how: "Octave key, and two fingers on the left.", freq: 587.3 },
      { name: "F", how: "Octave key, and one finger on the left.", freq: 622.3 },
      { name: "G", how: "Octave key. No fingers down.", freq: 698.5 },
    ]},
    { id: "bari", family: "Woodwind", name: "Bari sax", start: "The strap holds it. Even air. Relaxed mouth.", concert: "You read E-flat. Your written G is the band's low B-flat.", notes: [
      { name: "G", how: "Three fingers on the left hand.", freq: 233.1 },
      { name: "A", how: "Two fingers on the left hand.", freq: 261.6 },
      { name: "B", how: "One finger on the left hand.", freq: 293.7 },
      { name: "C", how: "No fingers down.", freq: 311.1 },
      { name: "D", how: "Octave key, and three fingers on the left.", freq: 349.2 },
    ]},
    { id: "bassoon", family: "Woodwind", name: "Bassoon", start: "Seat strap on. Both lips on the reed. Soft air.", concert: "You read concert pitch, bass clef. Your B-flat is the band's B-flat.", notes: [
      { name: "Bb", how: "Whisper key, and the B-flat fingering on your chart.", freq: 233.1 },
      { name: "C", how: "Use the C on your fingering chart.", freq: 261.6 },
      { name: "D", how: "Use the D on your fingering chart.", freq: 293.7 },
      { name: "Eb", how: "Use the E-flat on your fingering chart.", freq: 311.1 },
      { name: "F", how: "Use the F on your fingering chart.", freq: 349.2 },
    ]},
    { id: "trumpet", family: "Brass", name: "Trumpet", start: "Buzz in the mouthpiece. Corners firm. Soft air.", concert: "You read B-flat. Your written C is the band's B-flat.", notes: [
      { name: "C", how: "Open. No valves.", freq: 466.2 },
      { name: "D", how: "Valves 1 and 3.", freq: 523.3 },
      { name: "E", how: "Valves 1 and 2.", freq: 587.3 },
      { name: "F", how: "Valve 1.", freq: 622.3 },
      { name: "G", how: "Open. No valves.", freq: 698.5 },
    ]},
    { id: "horn", family: "Brass", name: "Horn", start: "Right hand in the bell. Buzz softly. The notes sit close together.", concert: "You read in F. Your written C is the band's F. Check the chart on your stand.", notes: [
      { name: "C", how: "Open. No valves.", freq: 349.2 },
      { name: "D", how: "Valve 1.", freq: 392.0 },
      { name: "E", how: "Open, with a little more air.", freq: 440.0 },
      { name: "F", how: "Valve 1.", freq: 466.2 },
      { name: "G", how: "Open.", freq: 523.3 },
    ]},
    { id: "trombone", family: "Brass", name: "Trombone", start: "Buzz in the mouthpiece. Move the slide straight.", concert: "You read concert pitch. Your B-flat is the band's B-flat.", notes: [
      { name: "Bb", how: "Position 1. Slide all the way in.", freq: 466.2 },
      { name: "C", how: "Position 6.", freq: 523.3 },
      { name: "D", how: "Position 4.", freq: 587.3 },
      { name: "Eb", how: "Position 3.", freq: 622.3 },
      { name: "F", how: "Position 1.", freq: 698.5 },
    ]},
    { id: "baritone", family: "Brass", name: "Baritone", start: "Buzz in the mouthpiece. The valves match the trumpet if you read treble clef.", concert: "Treble clef: your written C is the band's B-flat. Bass clef readers, use the same valves an octave lower.", notes: [
      { name: "C", how: "Open. No valves.", freq: 233.1 },
      { name: "D", how: "Valves 1 and 3.", freq: 261.6 },
      { name: "E", how: "Valves 1 and 2.", freq: 293.7 },
      { name: "F", how: "Valve 1.", freq: 311.1 },
      { name: "G", how: "Open. No valves.", freq: 349.2 },
    ]},
    { id: "tuba", family: "Brass", name: "Tuba", start: "Big air. Loose buzz. Let the low note bloom.", concert: "You read concert pitch. Your B-flat is the band's B-flat.", notes: [
      { name: "Bb", how: "Open. No valves.", freq: 116.5 },
      { name: "C", how: "Valves 1 and 3.", freq: 130.8 },
      { name: "D", how: "Valves 1 and 2.", freq: 146.8 },
      { name: "Eb", how: "Valve 1.", freq: 155.6 },
      { name: "F", how: "Open. No valves.", freq: 174.6 },
    ]},
    { id: "percussion", family: "Percussion", name: "Snare and bass", start: "Sticks in the center of the head. Soft wrists.", concert: "You play the beat. Your count matches the band.", notes: [
      { name: "Bass", how: "Bass drum on the beat. Let it ring.", drum: "kick" },
      { name: "Snare", how: "Snare in the center.", drum: "snare" },
      { name: "Tap", how: "A quiet tap on the rim.", drum: "hat" },
      { name: "Both", how: "Bass and snare together.", drum: "both" },
      { name: "Rest", how: "Hands still. Count the beat anyway.", drum: "rest" },
    ]},
    { id: "bells", family: "Percussion", name: "Bells", start: "Mallet in the center of the bar. Let it ring.", concert: "You read concert pitch. Your B-flat is the band's B-flat.", notes: [
      { name: "Bb", how: "The B-flat bar.", freq: 466.2 },
      { name: "C", how: "The C bar.", freq: 523.3 },
      { name: "D", how: "The D bar.", freq: 587.3 },
      { name: "Eb", how: "The E-flat bar.", freq: 622.3 },
      { name: "F", how: "The F bar.", freq: 698.5 },
    ]},
    { id: "violin", family: "Strings", name: "Violin", start: "Bow between the bridge and the fingerboard. Elbow loose.", concert: "You read concert pitch. These notes start on the D string.", notes: [
      { name: "D", how: "Open D string. No fingers.", freq: 293.7 },
      { name: "E", how: "First finger on the D string.", freq: 329.6 },
      { name: "F", how: "Second finger, low, close to the first.", freq: 349.2 },
      { name: "G", how: "Third finger on the D string.", freq: 392.0 },
      { name: "A", how: "Open A string.", freq: 440.0 },
    ]},
    { id: "viola", family: "Strings", name: "Viola", start: "Same bow as violin, on a bigger instrument. Read alto clef.", concert: "You read concert pitch. These notes start on the G string.", notes: [
      { name: "G", how: "Open G string.", freq: 196.0 },
      { name: "A", how: "First finger on the G string.", freq: 220.0 },
      { name: "B", how: "Second finger on the G string.", freq: 246.9 },
      { name: "C", how: "Third finger on the G string.", freq: 261.6 },
      { name: "D", how: "Open D string.", freq: 293.7 },
    ]},
    { id: "cello", family: "Strings", name: "Cello", start: "Endpin on the floor. Bow straight across the string.", concert: "You read concert pitch, bass clef. These notes start on the D string.", notes: [
      { name: "D", how: "Open D string.", freq: 146.8 },
      { name: "E", how: "First finger on the D string.", freq: 164.8 },
      { name: "F", how: "Second finger, low.", freq: 174.6 },
      { name: "G", how: "Third finger on the D string.", freq: 196.0 },
      { name: "A", how: "Open A string.", freq: 220.0 },
    ]},
    { id: "guitar", family: "Strings", name: "Guitar", start: "Left hand on the fretboard. Press just behind the fret.", concert: "These notes are on the high E string. You read concert pitch.", notes: [
      { name: "E", how: "High E string, open. No fingers.", freq: 329.6 },
      { name: "F", how: "First fret.", freq: 349.2 },
      { name: "G", how: "Third fret.", freq: 392.0 },
      { name: "A", how: "Fifth fret.", freq: 440.0 },
      { name: "B", how: "Seventh fret.", freq: 493.9 },
    ]},
    { id: "piano", family: "Keyboard", name: "Piano", start: "Find the two black keys. C is the white key just to the left.", concert: "You read concert pitch. Your C is the band's C.", notes: [
      { name: "C", how: "White key just left of the two black keys.", freq: 261.6 },
      { name: "D", how: "The next white key up.", freq: 293.7 },
      { name: "E", how: "The next white key up.", freq: 329.6 },
      { name: "F", how: "White key just left of the three black keys.", freq: 349.2 },
      { name: "G", how: "The next white key up.", freq: 392.0 },
    ]},
  ];
  const WRITTEN = { C: "C", D: "D", E: "E", F: "F", G: "G", A: "A", B: "B" };
  function bandNow() {
    return BAND.find((item) => item.id === state.band) || BAND[3];
  }
  function playBand(note, step) {
    arm();
    $("band-finger").textContent = note.name + ". " + note.how;
    if (note.drum === "rest") {
      $("lesson").textContent = "Rest. Count it. Hands still.";
      return;
    }
    if (!state.muted) {
      if (note.drum === "kick" || note.drum === "both") tone(140, 0.18, "sine", 0.9);
      if (note.drum === "snare" || note.drum === "both") noise(0.12, 0.35);
      if (note.drum === "hat") noise(0.04, 0.18);
      if (note.freq) tone(note.freq, Math.max(0.4, state.noteLen), "triangle", 0.22);
    }
    const at = step == null ? placeStep() : step;
    if (at < 0) return;
    if (note.drum === "kick" || note.drum === "both") writeHit("kick", at);
    if (note.drum === "snare" || note.drum === "both") writeHit("snare", at);
    if (note.drum === "hat") writeHit("hat", at);
    const pitch = WRITTEN[note.name];
    if (pitch) {
      const ev = Song.events(state.song)[at];
      if (ev && ev.pitch !== pitch) {
        Song.setBeat(state.song, ev.measure, ev.beat, pitch);
        renderStaff();
        keep();
      }
    }
    state.step = at;
    paintCount();
    $("lesson").textContent = note.name + " on beat " + (at + 1) + ". Saved.";
  }
  let warmTimer = [];
  function paintBand() {
    const inst = bandNow();
    const now = $("inst-now");
    if (now) now.textContent = inst.name;
    const picks = $("band-picks");
    picks.innerHTML = "";
    let family = "";
    BAND.forEach((item) => {
      if (item.family !== family) {
        family = item.family;
        const head = document.createElement("div");
        head.className = "family";
        head.textContent = family;
        picks.appendChild(head);
      }
      const b = document.createElement("button");
      b.type = "button";
      b.className = "btn" + (item.id === inst.id ? " on" : "");
      b.textContent = item.name;
      b.addEventListener("click", () => {
        state.band = item.id;
        const sound = { Woodwind: "winds", Brass: "brass", Strings: "strings", Keyboard: "winds", Percussion: "beep" }[item.family];
        if (sound) state.orch = sound;
        keep();
        picks.hidden = true;
        paintBand();
        $("lesson").textContent = item.name + ". " + item.start;
      });
      picks.appendChild(b);
    });
    $("band-start").textContent = inst.start;
    $("band-concert").textContent = inst.concert;
    const notes = $("band-notes");
    notes.innerHTML = "";
    inst.notes.forEach((note) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "key";
      b.textContent = note.name;
      b.setAttribute("aria-label", note.name + ". " + note.how);
      b.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        playBand(note);
      });
      notes.appendChild(b);
    });
  }
  const instNow = $("inst-now");
  if (instNow) instNow.addEventListener("click", () => {
    const picks = $("band-picks");
    picks.hidden = !picks.hidden;
  });
  function warmUp() {
    warmTimer.forEach((id) => window.clearTimeout(id));
    warmTimer = [];
    const inst = bandNow();
    const beat = Math.round(60000 / Math.max(70, state.song.bpm || 96));
    $("lesson").textContent = "Warm-up. Five sounds. Count 1 2 3 4 5.";
    inst.notes.forEach((note, i) => {
      warmTimer.push(window.setTimeout(() => playBand(note, i), i * beat));
    });
  }

  const INKS = [["cyan", "Cyan"], ["amber", "Amber"], ["violet", "Violet"], ["rose", "Rose"], ["lime", "Lime"], ["ice", "Ice"]];
  function saveSkin() {
    try {
      localStorage.setItem("kulibert.viz.skin", JSON.stringify({
        layers: state.layers, rgb: state.rgb, wall: state.wall, frame: state.frame,
      }));
    } catch (err) { /* the picture still changes */ }
  }
  function loadSkin() {
    try {
      const raw = JSON.parse(localStorage.getItem("kulibert.viz.skin") || "null");
      if (!raw || !Array.isArray(raw.layers)) return;
      state.layers = raw.layers.slice(0, 3);
      while (state.layers.length < 3) state.layers.push({ look: "off", color: "cyan" });
      state.rgb = !!raw.rgb;
      if (raw.wall) state.wall = raw.wall;
      if (raw.frame) state.frame = raw.frame;
      if (state.layers[0] && state.layers[0].look && state.layers[0].look !== "off") state.look = state.layers[0].look;
    } catch (err) { /* starter layers stay */ }
  }
  function paintLights() {
    const stageLooks = (window.KulibertStage && window.KulibertStage.LOOKS) || LOOKS.map(([id, label]) => ({ id: id, label: label }));
    const rgb = $("rgb-btn");
    if (rgb) {
      rgb.classList.toggle("on", state.rgb);
      rgb.setAttribute("aria-pressed", String(state.rgb));
    }
    document.body.classList.toggle("is-lights", state.mode === "lights");
    const stage = document.querySelector(".stage-wrap");
    if (stage) {
      ["night", "dusk", "sunset", "sea", "aurora", "candy"].forEach((id) => stage.classList.remove("wall-" + id));
      ["none", "line", "glow", "double", "rgb"].forEach((id) => stage.classList.remove("frame-" + id));
      stage.classList.add("wall-" + (state.wall || "night"));
      stage.classList.add("frame-" + (state.frame || "none"));
      stage.classList.toggle("is-rgb", !!state.rgb);
    }
  }
  function applyViz(viz) {
    if (!viz || !viz.layers) return;
    state.layers = viz.layers.map((layer) => ({ look: layer.look, color: layer.color }));
    while (state.layers.length < 3) state.layers.push({ look: "off", color: "cyan" });
    if (state.layers[0].look && state.layers[0].look !== "off") state.look = state.layers[0].look;
    state.wall = viz.wall || state.wall;
    state.frame = viz.frame || state.frame;
    state.rgb = !!viz.rgb;
    for (let i = 0; i < 3; i++) {
      const look = $("layer-" + i);
      const ink = $("ink-" + i);
      if (look && state.layers[i]) look.value = state.layers[i].look;
      if (ink && state.layers[i]) ink.value = state.layers[i].color;
    }
    if ($("wall")) $("wall").value = state.wall;
    if ($("frame")) $("frame").value = state.frame;
    paintLights();
    const now = $("viz-now");
    if (now) now.textContent = "Picture: " + (state.layers[0].look || "bars") + ". It is saved on the song.";
  }
  function snapshotViz() {
    state.song.viz = {
      layers: state.layers.map((layer) => ({ look: layer.look, color: layer.color })),
      wall: state.wall,
      frame: state.frame,
      rgb: !!state.rgb,
    };
    state.song = Song.parse(Song.serialize(state.song));
  }
  function fromLine(song) {
    const from = (song && song.from) || [];
    if (!from.length) return "No remix yet";
    const root = from[0];
    const n = from.filter((name) => name === "Remix").length;
    if (!n) return root;
    if (n === 1) return "Remix of " + root;
    return "Remix of a remix of " + root;
  }
  function fillLights() {
    if (!$("layer-0")) return;
    const stageLooks = (window.KulibertStage && window.KulibertStage.LOOKS) || [];
    for (let i = 0; i < 3; i++) {
      const look = $("layer-" + i);
      const ink = $("ink-" + i);
      const options = (i === 0 ? [] : [{ id: "off", label: "Off" }]).concat(stageLooks);
      look.innerHTML = options.map((item) => `<option value="${item.id}">${item.label}</option>`).join("");
      ink.innerHTML = INKS.map((pair) => `<option value="${pair[0]}">${pair[1]}</option>`).join("");
      look.value = state.layers[i].look;
      ink.value = state.layers[i].color;
      look.addEventListener("change", () => {
        state.layers[i].look = look.value;
        if (i === 0 && look.value !== "off") {
          state.look = look.value;
          paintLooks();
        }
        saveSkin();
        keep();
      });
      ink.addEventListener("change", () => {
        state.layers[i].color = ink.value;
        saveSkin();
      });
    }
    const walls = [["night", "Night"], ["dusk", "Dusk"], ["sunset", "Sunset"], ["sea", "Sea"], ["aurora", "Aurora"], ["candy", "Candy"]];
    const frames = [["none", "None"], ["line", "Line"], ["glow", "Glow"], ["double", "Double"], ["rgb", "RGB"]];
    $("wall").innerHTML = walls.map((pair) => `<option value="${pair[0]}">${pair[1]}</option>`).join("");
    $("frame").innerHTML = frames.map((pair) => `<option value="${pair[0]}">${pair[1]}</option>`).join("");
    $("wall").value = state.wall;
    $("frame").value = state.frame;
    $("wall").addEventListener("change", () => { state.wall = $("wall").value; saveSkin(); paintLights(); });
    $("frame").addEventListener("change", () => { state.frame = $("frame").value; saveSkin(); paintLights(); });
    $("rgb-btn").addEventListener("click", () => { state.rgb = !state.rgb; saveSkin(); paintLights(); });
  }

  function sayHow(mode) {
    const line = $("beat-line") || $("how");
    if (!line) return;
    const text = {
      both: mu("howBoth"),
      notes: mu("howNotes"),
      beat: mu("howBeat"),
      drums: mu("howDrums"),
      lights: mu("howLights"),
      band: mu("howBand"),
      sound: mu("howSound"),
    };
    line.textContent = state.playing ? mu("pressStop") : (text[mode] || text.both);
  }
  const WS_KEY = "kulibert.music.workspace";
  const WS_MODES = ["beat", "both", "notes", "drums", "lights", "band", "sound"];
  function readWorkspace() {
    try {
      const data = JSON.parse(localStorage.getItem(WS_KEY) || "");
      const preset = WS_MODES.indexOf(data.preset) >= 0 ? data.preset : "both";
      let score = Number(data.score);
      if (!Number.isFinite(score)) score = 58;
      score = Math.max(28, Math.min(72, Math.round(score)));
      return { preset: preset, score: score };
    } catch (err) {
      return { preset: "both", score: 58 };
    }
  }
  function writeWorkspace(preset, score) {
    const safe = WS_MODES.indexOf(preset) >= 0 ? preset : "both";
    const width = Math.max(28, Math.min(72, Math.round(Number(score) || 58)));
    try { localStorage.setItem(WS_KEY, JSON.stringify({ preset: safe, score: width })); } catch (err) { /* layout only */ }
    return { preset: safe, score: width };
  }
  function applySplit(score) {
    const width = Math.max(28, Math.min(72, Math.round(Number(score) || 58)));
    const work = $("work");
    if (work) work.style.setProperty("--ws-score", width + "%");
    const split = $("ws-split");
    if (split) split.setAttribute("aria-valuenow", String(width));
    return width;
  }
  function setMode(mode) {
    if (WS_MODES.indexOf(mode) < 0) mode = "both";
    state.mode = mode;
    resetScroll();
    document.body.classList.remove("is-home", "is-make", "is-library");
    const work = $("work");
    WS_MODES.forEach((name) => {
      if (work) work.classList.toggle("is-" + name, mode === name);
    });
    WS_MODES.forEach((name) => {
      const btn = $("mode-" + name);
      if (!btn) return;
      btn.classList.toggle("on", mode === name);
      btn.setAttribute("aria-pressed", String(mode === name));
    });
    document.body.classList.toggle("is-both", mode === "both");
    document.body.classList.toggle("is-beat", mode === "beat");
    document.body.classList.toggle("is-score", mode === "notes");
    document.body.classList.toggle("is-drums", mode === "drums");
    document.body.classList.toggle("expert", mode === "notes" && state.expert);
    document.body.classList.toggle("is-lights", mode === "lights");
    document.body.classList.toggle("is-sound", mode === "sound");
    fitViz();
    const split = $("ws-split");
    if (split) split.hidden = true;
    if (mode === "both" || mode === "notes" || mode === "beat") {
      requestAnimationFrame(() => {
        renderStaff();
        requestAnimationFrame(() => renderStaff());
      });
    }
    sayHow(mode);
    if (!state.playing) {
      const hints = {
        beat: mu("hintBeat"),
        both: mu("hintBoth"),
        notes: mu("hintNotes"),
        drums: state.along ? mu("hintAlong") : mu("hintDrums"),
        lights: mu("hintLights"),
        band: mu("hintBand"),
        sound: mu("hintSound"),
      };
      $("lesson").textContent = hints[mode] || $("lesson").textContent;
    }
    if (mode === "band") paintBand();
    paintLights();
    if (mode === "both" || mode === "notes" || mode === "beat") {
      window.requestAnimationFrame(() => {
        if (state.mode === mode) renderStaff();
      });
    }
    window.requestAnimationFrame(() => { if (stageApi && stageApi.resize) stageApi.resize(); });
  }
  function chooseWorkspace(mode) {
    const cur = readWorkspace();
    writeWorkspace(mode, cur.score);
    setMode(mode);
  }

  function paintAlong() {
    const btn = $("along-btn");
    if (!btn) return;
    btn.classList.toggle("on", state.along);
    btn.setAttribute("aria-pressed", String(state.along));
    btn.textContent = state.along ? (mu("playingAlong") || "Playing along") : (mu("playAlong") || "Play along");
  }
  $("along-btn").addEventListener("click", () => {
    state.along = !state.along;
    paintAlong();
    keep();
    $("lesson").textContent = state.along
      ? "Play along is on. Your taps do not change the song. Match the flash."
      : "Play along is off. Your taps are saved on the beat.";
  });
  $("play-btn").addEventListener("click", () => {
    if (state.showing) {
      if (state.playing || state.counting) {
        state.counting = false;
        stop();
        showCurtain();
      } else beginShow();
      return;
    }
    if (state.playing) stop();
    else play();
  });
  $("show-btn").addEventListener("click", openShow);
  $("curtain-start").addEventListener("click", beginShow);
  $("show-again").addEventListener("click", beginShow);
  $("curtain-exit").addEventListener("click", closeShow);
  $("bow-exit").addEventListener("click", closeShow);
  $("mute-btn").addEventListener("click", () => {
    state.muted = !state.muted;
    if (window.KulibertPrefs && window.KulibertPrefs.set) window.KulibertPrefs.set({ sound: !state.muted });
    paintMute();
    resyncBus();
    if (ctx && ctx.state === "suspended") ctx.resume();
    const banner = $("sound-banner");
    if (banner && !state.muted) banner.hidden = true;
    const shop = shopPrefs();
    if (shop && shop.set && signedKid() && window.KulibertPrefs && window.KulibertPrefs.get) {
      shop.set("musiclab", window.KulibertPrefs.get());
    }
    $("lesson").textContent = state.muted ? mu("soundOffMove") : mu("soundOnWord");
  });
  const bannerOn = $("sound-banner-on");
  if (bannerOn) bannerOn.addEventListener("click", () => {
    if (state.muted && $("mute-btn")) $("mute-btn").click();
  });
  $("turn-btn").addEventListener("click", () => {
    state.turn = "listen";
    state.turnLeft = GRID;
    state.seenGrid = -1;
    state.recording = false;
    state.armBeats = 0;
    paintRec();
    if (!state.playing) play();
    $("lesson").textContent = mu("listenOnce");
    const beat = $("beat-line");
    if (beat) beat.textContent = mu("listenOff");
  });
  $("rec-btn").addEventListener("click", () => {
    if (state.recording) {
      state.recording = false;
      state.armBeats = 0;
      state.turn = "";
      paintRec();
      $("lesson").textContent = "That count is off. Taps still play. They are saved when Play along is off.";
      return;
    }
    state.turn = "";
    state.recording = true;
    const per = Song.beatsFor ? Song.beatsFor(state.song.meter) : 4;
    state.armTotal = per;
    state.armBeats = per;
    state.click = true;
    paintRec();
    if (!state.playing) play();
    $("lesson").textContent = "Count " + per + ". Then tap a note. The click is the metronome. It saves.";
  });
  let clearArm = 0;
  let drumUndo = null;
  $("clear-btn").addEventListener("click", () => {
    if (Date.now() > clearArm) {
      clearArm = Date.now() + 5000;
      $("clear-btn").textContent = mu("tapAgain");
      $("lesson").textContent = mu("clearAsk");
      return;
    }
    clearArm = 0;
    drumUndo = JSON.parse(JSON.stringify(state.drums));
    ROWS.forEach(([id]) => { state.drums[id] = Array(GRID).fill(false); });
    keep();
    renderDrums();
    $("clear-btn").textContent = mu("clearDrums");
    $("undo-clear").hidden = false;
    $("lesson").textContent = mu("drumsClear");
  });
  $("undo-clear").addEventListener("click", () => {
    if (!drumUndo) return;
    state.drums = drumUndo;
    drumUndo = null;
    $("undo-clear").hidden = true;
    keep();
    renderDrums();
    $("lesson").textContent = mu("drumsBack");
  });
  ["beat", "both", "notes", "drums", "band", "lights", "sound"].forEach((name) => {
    const btn = $("mode-" + name);
    if (btn) btn.addEventListener("click", () => chooseWorkspace(name));
  });
  const wsSplit = $("ws-split");
  if (wsSplit) {
    wsSplit.addEventListener("pointerdown", (event) => {
      if (state.mode !== "both") return;
      event.preventDefault();
      const work = $("work");
      if (!work) return;
      wsSplit.setPointerCapture(event.pointerId);
      const move = (ev) => {
        const rect = work.getBoundingClientRect();
        if (rect.width < 80) return;
        const next = applySplit(((ev.clientX - rect.left) / rect.width) * 100);
        writeWorkspace("both", next);
      };
      const up = () => {
        wsSplit.removeEventListener("pointermove", move);
        wsSplit.removeEventListener("pointerup", up);
        wsSplit.removeEventListener("pointercancel", up);
      };
      wsSplit.addEventListener("pointermove", move);
      wsSplit.addEventListener("pointerup", up);
      wsSplit.addEventListener("pointercancel", up);
    });
    wsSplit.addEventListener("keydown", (event) => {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      event.preventDefault();
      const cur = readWorkspace();
      const next = applySplit(cur.score + (event.key === "ArrowRight" ? 4 : -4));
      writeWorkspace("both", next);
      setMode("both");
    });
  }
  $("band-warm").addEventListener("click", () => warmUp());
  const DYN_STEPS = ["pp", "p", "mf", "f", "ff"];
  function wanted(beat) {
    const patterns = {
      "2/4": ["down", "up"],
      "3/4": ["down", "out", "up"],
      "4/4": ["down", "in", "out", "up"],
      "6/8": ["down", "in", "out", "up", "out", "up"],
    };
    const pat = patterns[state.song.meter] || patterns["4/4"];
    return pat[beat % pat.length];
  }
  function gestureWord(id) {
    return { down: "Down", in: "In", out: "Out", up: "Up", big: "Bigger", small: "Smaller" }[id] || id;
  }
  function paintAvatar(gesture) {
    const avatar = $("avatar");
    if (!avatar) return;
    avatar.className = "avatar " + (gesture || "idle") + " dyn-" + (state.dyn || "mf");
  }
  function paintOrch() {
    document.querySelectorAll("#orch .btn").forEach((btn) => btn.classList.toggle("on", btn.dataset.orch === state.orch));
    document.querySelectorAll("#dyn .btn").forEach((btn) => btn.classList.toggle("on", btn.dataset.dyn === state.dyn));
    paintAvatar(state.conducting ? wanted((markAt(state.cursor) || { beat: 0 }).beat) : "idle");
  }
  function askConduct() {
    const ev = markAt(state.cursor);
    const beat = ev ? ev.beat : 0;
    const ask = $("conduct-ask");
    if (ask) ask.textContent = "Beat " + (beat + 1) + " wants " + gestureWord(wanted(beat)) + ".";
  }
  function shiftDyn(dir) {
    let i = DYN_STEPS.indexOf(state.dyn);
    if (i < 0) i = 2;
    i = Math.max(0, Math.min(DYN_STEPS.length - 1, i + dir));
    state.dyn = DYN_STEPS[i];
    paintOrch();
    $("lesson").textContent = dir > 0 ? "A bigger gesture. The band is " + DYN_WORD[state.dyn] + "." : "A smaller gesture. The band is " + DYN_WORD[state.dyn] + ".";
  }
  function give(gesture) {
    if (gesture === "big" || gesture === "small") {
      shiftDyn(gesture === "big" ? 1 : -1);
      paintAvatar(gesture === "big" ? "out" : "in");
      return;
    }
    const ev = markAt(state.cursor);
    const beat = ev ? ev.beat : 0;
    const want = wanted(beat);
    if (!state.conducting) {
      paintAvatar(gesture);
      $("lesson").textContent = gestureWord(gesture) + " is a beat shape. Conduct the band when you want them to follow.";
      return;
    }
    paintAvatar(want);
    if (gesture !== want) {
      state.miss += 1;
      $("conduct-ask").textContent = "Not yet. Beat " + (beat + 1) + " wants " + gestureWord(want) + ".";
      $("lesson").textContent = "The avatar shows " + gestureWord(want) + ". Try that one.";
      if (state.miss < 2) return;
      $("lesson").textContent = gestureWord(want) + ". The band will play this beat.";
    }
    state.miss = 0;
    arm();
    pulse(state.cursor);
    const evs = Song.events(state.song);
    if (state.cursor + 1 >= evs.length) {
      state.conducting = false;
      $("conduct-btn").textContent = "Conduct the band";
      $("conduct-ask").textContent = "The band finished your song.";
      $("lesson").textContent = "That was the last mark. You can conduct it again.";
      return;
    }
    state.cursor += 1;
    askConduct();
    $("band-finger").textContent = gestureWord(want) + ". The band follows you.";
  }
  function startConduct() {
    if (state.playing) stop();
    if (state.orch === "beep") state.orch = "strings";
    state.conducting = true;
    state.cursor = 0;
    state.miss = 0;
    setMode("band");
    paintOrch();
    askConduct();
    $("conduct-btn").textContent = "Stop conducting";
    $("lesson").textContent = "Give the gesture. The band plays your song one beat at a time.";
  }
  const orchHost = $("orch");
  if (orchHost) {
    [["strings", "Strings"], ["brass", "Brass"], ["winds", "Winds"], ["beep", "Beep"]].forEach(([id, label]) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "btn";
      b.dataset.orch = id;
      b.textContent = label;
      b.addEventListener("click", () => {
        state.orch = id;
        paintOrch();
        keep();
        $("lesson").textContent = label === "Beep"
          ? "The plain sound is back."
          : label + " play the notes. Louder moves are brighter.";
      });
      orchHost.appendChild(b);
    });
  }
  const dynHost = $("dyn");
  if (dynHost) {
    DYN_STEPS.forEach((id) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "btn";
      b.dataset.dyn = id;
      b.textContent = id + " " + DYN_WORD[id];
      b.addEventListener("click", () => {
        state.dyn = id;
        paintOrch();
        $("lesson").textContent = id + " means " + DYN_WORD[id] + ".";
      });
      dynHost.appendChild(b);
    });
  }
  const gestureHost = $("gestures");
  if (gestureHost) {
    ["down", "in", "out", "up", "big", "small"].forEach((id) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "btn";
      b.textContent = gestureWord(id);
      b.addEventListener("click", () => give(id));
      gestureHost.appendChild(b);
    });
  }
  const baton = $("baton");
  if (baton) {
    let start = null;
    baton.addEventListener("pointerdown", (e) => {
      start = { x: e.clientX, y: e.clientY };
      baton.setPointerCapture(e.pointerId);
    });
    baton.addEventListener("pointerup", (e) => {
      if (!start) return;
      const dx = e.clientX - start.x;
      const dy = e.clientY - start.y;
      start = null;
      if (Math.hypot(dx, dy) < 18) return;
      if (Math.abs(dx) > Math.abs(dy)) give(dx > 0 ? "out" : "in");
      else give(dy > 0 ? "down" : "up");
    });
  }
  if ($("conduct-btn")) {
    $("conduct-btn").addEventListener("click", () => {
      if (state.conducting) {
        state.conducting = false;
        $("conduct-btn").textContent = "Conduct the band";
        $("conduct-ask").textContent = "The band is waiting.";
        paintAvatar("idle");
        return;
      }
      startConduct();
    });
  }
  paintOrch();
  function resetScroll() {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }
  function fitViz() {
    const canvas = $("viz");
    const wrap = canvas && canvas.parentElement;
    const show = document.body.classList.contains("show");
    const strip = !show && (document.body.classList.contains("is-beat") || document.body.classList.contains("is-both"));
    if (canvas) {
      canvas.style.height = show ? "100%" : strip ? "84px" : "";
      canvas.style.maxHeight = show ? "none" : strip ? "84px" : "";
      canvas.style.aspectRatio = show || strip ? "auto" : "";
    }
    if (wrap) {
      wrap.style.height = strip ? "92px" : "";
      wrap.style.maxHeight = strip ? "92px" : "";
      wrap.style.overflow = show || strip ? "hidden" : "";
      if (show || strip) {
        wrap.style.setProperty("contain", "paint", "important");
        wrap.style.setProperty("clip-path", "inset(0)", "important");
        wrap.style.setProperty("transform", "translateZ(0)", "important");
      } else {
        wrap.style.contain = "";
        wrap.style.clipPath = "";
        wrap.style.transform = "";
      }
    }
  }
  function closeMenu() {
    document.body.classList.remove("menu-open");
    const btn = $("menu-btn");
    if (btn) btn.setAttribute("aria-expanded", "false");
  }
  function popConfetti() {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (document.documentElement.getAttribute("data-kp-motion") === "less") return;
    if (document.body.classList.contains("pref-less-motion")) return;
    const canvas = $("confetti");
    if (!canvas) return;
    canvas.hidden = false;
    const g = canvas.getContext("2d");
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(window.innerWidth * dpr);
    canvas.height = Math.round(window.innerHeight * dpr);
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    const bits = Array.from({ length: 42 }, () => ({
      x: window.innerWidth * 0.5,
      y: window.innerHeight * 0.4,
      vx: (Math.random() - 0.5) * 14,
      vy: -6 - Math.random() * 8,
      c: ["#22d3ee", "#e8f7ff", "#10203f", "#e24b4b", "#3d7a4a"][Math.floor(Math.random() * 5)],
    }));
    let frame = 0;
    const tick = () => {
      g.clearRect(0, 0, window.innerWidth, window.innerHeight);
      bits.forEach((bit) => {
        bit.x += bit.vx;
        bit.y += bit.vy;
        bit.vy += 0.35;
        g.fillStyle = bit.c;
        g.fillRect(bit.x, bit.y, 8, 8);
      });
      frame += 1;
      if (frame < 36) requestAnimationFrame(tick);
      else canvas.hidden = true;
    };
    tick();
  }
  const PACKS = {
    Trap: { bpm: 140, bass: true, drums: { kick: [1,0,0,0,0,0,1,0,0,0,1,0,0,0,0,0], snare: [0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,1], clap: [0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0], hat: [1,1,1,1,1,1,1,0,1,1,1,1,1,1,1,1] } },
    "Lo-fi": { bpm: 84, bass: true, drums: { kick: [1,0,0,0,0,0,0,1,0,0,1,0,0,0,0,0], snare: [0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0], hat: [0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0] } },
    Rock: { bpm: 124, bass: true, drums: { kick: [1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0], snare: [0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0], hat: [1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0], crash: [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0] } },
    Marching: { bpm: 112, bass: false, drums: { kick: [1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0], snare: [1,0,1,1,1,0,1,0,1,0,1,1,1,0,1,0], rim: [0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0] } },
  };
  function applyPack(name) {
    const pack = PACKS[name];
    if (!pack) return;
    ROWS.forEach(([id]) => { state.drums[id] = to16(pack.drums[id] || []); });
    state.song.bpm = pack.bpm;
    state.song.tempo = pack.bpm;
    state.bass = !!pack.bass;
    state.parts.bass = !!pack.bass;
    state.parts.drums = true;
    if ($("tempo")) {
      $("tempo").value = String(pack.bpm);
      $("tempo-read").textContent = String(pack.bpm);
    }
    renderDrums();
    keep();
    document.querySelectorAll("#style-row button").forEach((btn) => btn.classList.toggle("on", btn.dataset.pack === name));
  }
  function paintLayers() {
    const cast = $("cast");
    const row = $("style-row");
    if (cast && !cast.childElementCount) {
      [["drums", "Drums"], ["bass", "Bass"], ["chords", "Chords"], ["melody", "Melody"]].forEach(([id, label]) => {
        const b = document.createElement("button");
        b.type = "button";
        b.textContent = label;
        b.className = state.parts[id] ? "on" : "";
        b.addEventListener("click", () => {
          state.parts[id] = !state.parts[id];
          if (id === "bass") state.bass = state.parts.bass;
          b.classList.toggle("on", state.parts[id]);
          if (!state.playing) {
            arm();
            if (id === "drums") hitSound("kick");
            else if (id === "bass") hitSound("kick");
            else tone(id === "melody" ? 392 : 261, 0.2, "triangle", 0.2);
          }
        });
        cast.appendChild(b);
      });
    }
    if (row && !row.childElementCount) {
      Object.keys(PACKS).forEach((name) => {
        const b = document.createElement("button");
        b.type = "button";
        b.dataset.pack = name;
        const styleKey = { Trap: "style_trap", "Lo-fi": "style_lofi", Rock: "style_rock", Marching: "style_marching" }[name];
        b.textContent = styleKey ? (mu(styleKey) || name) : name;
        b.addEventListener("click", () => applyPack(name));
        row.appendChild(b);
      });
    }
  }
  function makeBeat() {
    closeMenu();
    resetScroll();
    state.parts = { drums: true, bass: true, chords: true, melody: true };
    applyPack("Rock");
    state.song.bpm = 104;
    state.song.tempo = 104;
    if ($("tempo")) {
      $("tempo").value = "104";
      $("tempo-read").textContent = "104";
    }
    document.body.classList.remove("is-home", "is-make", "is-library");
    if ($("home")) $("home").hidden = true;
    setMode("beat");
    const grid = $("drums");
    const box = grid && grid.closest("details");
    if (box) box.open = true;
    arm();
    play();
  }
  const CLASS_KEY = "kulibert.music.class.v1";
  function readClass() {
    try {
      const list = JSON.parse(localStorage.getItem(CLASS_KEY) || "[]");
      return Array.isArray(list) ? list : [];
    } catch (err) {
      return [];
    }
  }
  function shareSong() {
    const who = window.KulibertWho && window.KulibertWho.read && window.KulibertWho.read();
    const code = who && who.verified && who.code ? String(who.code) : "";
    const id = Math.random().toString(36).slice(2, 8);
    const pack = {
      id: id,
      at: Date.now(),
      code: code,
      song: JSON.parse(Song.serialize(state.song)),
      drums: state.drums,
    };
    const list = readClass();
    list.unshift(pack);
    try { localStorage.setItem(CLASS_KEY, JSON.stringify(list.slice(0, 40))); } catch (err) { /* still on screen */ }
    const link = location.origin + "/music/?class=" + id;
    const line = $("share-line");
    if (line) {
      line.hidden = false;
      line.textContent = (code ? mu("sharedFor", { code: code }) : mu("sharedBox")) + " " + link;
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(link).catch(() => {});
    }
    $("lesson").textContent = code ? mu("sharedClass") : mu("sharedSign");
    paintSongShelf();
    finishSong("share");
  }
  function encodeWav(audioBuffer) {
    const channels = audioBuffer.numberOfChannels;
    const rate = audioBuffer.sampleRate;
    const samples = audioBuffer.length;
    const bytes = samples * channels * 2;
    const buffer = new ArrayBuffer(44 + bytes);
    const view = new DataView(buffer);
    function write(off, text) { for (let i = 0; i < text.length; i++) view.setUint8(off + i, text.charCodeAt(i)); }
    write(0, "RIFF");
    view.setUint32(4, 36 + bytes, true);
    write(8, "WAVE");
    write(12, "fmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, channels, true);
    view.setUint32(24, rate, true);
    view.setUint32(28, rate * channels * 2, true);
    view.setUint16(32, channels * 2, true);
    view.setUint16(34, 16, true);
    write(36, "data");
    view.setUint32(40, bytes, true);
    let offset = 44;
    const data = [];
    for (let c = 0; c < channels; c++) data.push(audioBuffer.getChannelData(c));
    for (let i = 0; i < samples; i++) {
      for (let c = 0; c < channels; c++) {
        const s = Math.max(-1, Math.min(1, data[c][i]));
        view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
        offset += 2;
      }
    }
    return buffer;
  }
  async function saveWav() {
    arm();
    const rate = 44100;
    const bpm = Math.max(70, state.song.bpm || 96);
    const sec = (60 / bpm) / 4;
    const dur = sec * GRID + 0.4;
    const off = new OfflineAudioContext(2, Math.ceil(rate * dur), rate);
    const live = ctx;
    const oldBus = bus;
    const made = state.made;
    try {
      ctx = off;
      const dest = off.createGain();
      dest.gain.value = 1;
      const comp = off.createDynamicsCompressor();
      comp.threshold.value = -16;
      comp.knee.value = 8;
      comp.ratio.value = 3.5;
      comp.attack.value = 0.003;
      comp.release.value = 0.12;
      const limiter = off.createDynamicsCompressor();
      limiter.threshold.value = -1.5;
      limiter.knee.value = 0;
      limiter.ratio.value = 20;
      limiter.attack.value = 0.001;
      limiter.release.value = 0.05;
      bus = dest;
      dest.connect(comp);
      comp.connect(limiter);
      limiter.connect(off.destination);
      for (let i = 0; i < GRID; i++) scheduleHit(i, Math.floor(i / stepsPerEvent()) % songLen(), 0.05 + sec * i, i % stepsPerEvent() === 0);
    } finally {
      ctx = live;
      bus = oldBus;
      state.made = made;
    }
    const audio = await off.startRendering();
    const wav = encodeWav(audio);
    window.__djWav = wav;
    const blob = new Blob([wav], { type: "audio/wav" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "dj-berty.wav";
    a.click();
    const player = new Audio(url);
    player.play().catch(() => {});
    $("lesson").textContent = "Saved as sound. The file is a WAV of this loop.";
  }
  function vlq(n) {
    const bytes = [n & 127];
    n >>= 7;
    while (n > 0) {
      bytes.unshift((n & 127) | 128);
      n >>= 7;
    }
    return bytes;
  }
  function saveMidi() {
    const tpq = 480;
    const bpm = Math.max(70, Math.min(160, state.song.bpm || 96));
    const us = Math.round(60000000 / bpm);
    const events = [];
    events.push([0, 0xff, 0x51, 0x03, (us >> 16) & 255, (us >> 8) & 255, us & 255]);
    const evs = Song.events(state.song);
    const pitch = { C: 60, D: 62, E: 64, F: 65, G: 67, A: 69, B: 71, c: 72 };
    evs.forEach((ev, i) => {
      if (!ev || !ev.pitch || !pitch[ev.pitch]) return;
      const tick = i * tpq;
      events.push([tick, 0x90, pitch[ev.pitch], 90]);
      events.push([tick + Math.round(tpq * 0.8), 0x80, pitch[ev.pitch], 0]);
    });
    events.sort((a, b) => a[0] - b[0]);
    const track = [];
    let last = 0;
    events.forEach((ev) => {
      vlq(Math.max(0, ev[0] - last)).forEach((b) => track.push(b));
      last = ev[0];
      for (let i = 1; i < ev.length; i++) track.push(ev[i]);
    });
    vlq(0).forEach((b) => track.push(b));
    track.push(0xff, 0x2f, 0x00);
    const header = [0x4d, 0x54, 0x68, 0x64, 0, 0, 0, 6, 0, 0, 0, 1, (tpq >> 8) & 255, tpq & 255];
    const len = track.length;
    const out = header.concat([0x4d, 0x54, 0x72, 0x6b, (len >>> 24) & 255, (len >>> 16) & 255, (len >>> 8) & 255, len & 255], track);
    const bytes = new Uint8Array(out);
    window.__djMidi = bytes;
    const blob = new Blob([bytes], { type: "audio/midi" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "dj-berty.mid";
    a.click();
    $("lesson").textContent = mu("midiSaved");
  }
  function openClass(id) {
    const item = readClass().find((row) => row.id === id);
    if (!item) return;
    loadPack(item);
    document.body.classList.remove("is-home");
    if ($("home")) $("home").hidden = true;
    setMode("beat");
  }
  paintLayers();
  if (window.KulibertPrefs && window.KulibertPrefs.get) {
    const prefs = window.KulibertPrefs.get();
    if (prefs.sound === false) state.muted = true;
    paintMute();
    if (window.KulibertPrefs.on) {
      window.KulibertPrefs.on((next) => {
        state.muted = !next || next.sound === false;
        paintMute();
        resyncBus();
        const banner = $("sound-banner");
        if (banner && !state.muted) banner.hidden = true;
      });
    }
  }
  const shop = shopPrefs();
  if (shop && shop.get && signedKid()) {
    shop.get("musiclab").then((pack) => {
      if (!pack || !pack.prefs || typeof pack.prefs !== "object") return;
      if (!Object.keys(pack.prefs).length) return;
      if (window.KulibertPrefs && window.KulibertPrefs.set) window.KulibertPrefs.set(pack.prefs);
    }).catch(() => {});
  }
  if ($("read-lesson")) {
    $("read-lesson").addEventListener("click", () => {
      const line = $("beat-line");
      const lesson = $("lesson");
      const text = (line && line.textContent) || (lesson && lesson.textContent) || mu("pressPlay");
      if (window.KulibertPrefs && window.KulibertPrefs.say) {
        window.KulibertPrefs.say(text);
        return;
      }
      const live = document.getElementById("kp-live");
      if (live) {
        live.hidden = false;
        live.textContent = text;
      }
    });
  }
  if ($("make-beat")) $("make-beat").addEventListener("click", makeBeat);
  if ($("my-songs")) $("my-songs").addEventListener("click", () => {
    resetScroll();
    if ($("home")) $("home").hidden = false;
    if ($("shelf-extra")) $("shelf-extra").hidden = false;
    document.body.classList.add("is-home");
    const box = $("my-saves");
    if (box) box.scrollIntoView({ block: "start" });
  });
  if ($("save-dock")) $("save-dock").addEventListener("click", () => { if ($("save-btn")) $("save-btn").click(); });
  if ($("share-btn")) $("share-btn").addEventListener("click", shareSong);
  if ($("wav-btn")) $("wav-btn").addEventListener("click", () => { saveWav().catch(() => { $("lesson").textContent = mu("wavFail"); }); });
  if ($("midi-out")) $("midi-out").addEventListener("click", saveMidi);
  [["menu-songs", () => { if ($("shelf-extra")) $("shelf-extra").hidden = false; showHome(); if ($("shelf-extra")) $("shelf-extra").hidden = false; }],
    ["menu-blank", () => { if ($("start-blank")) $("start-blank").click(); }],
    ["menu-key", () => { if ($("shelf-extra")) $("shelf-extra").hidden = false; showHome(); if ($("shelf-extra")) $("shelf-extra").hidden = false; if ($("start-key")) $("start-key").click(); }],
    ["menu-import", () => { if ($("shelf-extra")) $("shelf-extra").hidden = false; showHome(); if ($("shelf-extra")) $("shelf-extra").hidden = false; }],
    ["menu-score", () => setMode("both")],
    ["menu-band", () => setMode("band")],
    ["menu-sound", () => setMode("sound")],
    ["menu-lights", () => setMode("lights")],
    ["menu-show", () => { if ($("show-btn")) $("show-btn").click(); }],
    ["menu-library", () => { if (typeof showLibrary === "function") showLibrary(); }],
  ].forEach(([id, go]) => {
    const btn = $(id);
    if (!btn) return;
    btn.addEventListener("click", () => { closeMenu(); go(); });
  });
  const classId = new URLSearchParams(location.search).get("class");
  if (classId) window.setTimeout(() => openClass(classId), 0);
  window.__dj = {
    nodes: () => state.made,
    ctx: () => (ctx ? ctx.state : "none"),
    grid: () => state.grid,
    classes: () => readClass(),
  };
  $("menu-btn").addEventListener("click", () => {
    const on = document.body.classList.toggle("menu-open");
    $("menu-btn").setAttribute("aria-expanded", String(on));
  });
  $("scrim").addEventListener("click", () => {
    document.body.classList.remove("menu-open");
    $("menu-btn").setAttribute("aria-expanded", "false");
  });
  $("menu-close").addEventListener("click", () => {
    document.body.classList.remove("menu-open");
    $("menu-btn").setAttribute("aria-expanded", "false");
  });
  $("tempo").addEventListener("input", (e) => {
    state.song.bpm = Number(e.target.value);
    $("tempo-read").textContent = String(state.song.bpm);
    keep();
    if (state.playing) { stop(); play(); }
    $("lesson").textContent = "Tempo is the speed. The count is still 1, 2, 3, 4.";
  });
  $("blend").addEventListener("input", (e) => {
    state.blend = Number(e.target.value);
    $("blend-read").textContent = blendWord(state.blend);
    keep();
  });
  function tweak(key, read) {
    return () => {
      read();
      applyFx();
      keep();
      arm();
    };
  }
  $("s-bright").addEventListener("input", tweak("bright", () => {
    state.bright = Number($("s-bright").value);
    $("n-bright").textContent = $("s-bright").value;
    $("lesson").textContent = "Brightness is how sharp the sound is.";
  }));
  $("s-len").addEventListener("input", tweak("len", () => {
    state.noteLen = Number($("s-len").value) / 100;
    $("n-len").textContent = $("s-len").value;
    $("lesson").textContent = "Length is how long a note holds.";
  }));
  $("s-echo").addEventListener("input", tweak("echo", () => {
    state.echo = Number($("s-echo").value) / 100;
    $("n-echo").textContent = $("s-echo").value;
    $("lesson").textContent = "Echo repeats the sound.";
  }));
  $("s-wob").addEventListener("input", tweak("wob", () => {
    state.wobble = Number($("s-wob").value);
    $("n-wob").textContent = $("s-wob").value;
    $("lesson").textContent = "Wobble moves the sound up and down.";
  }));
  $("save-btn").addEventListener("click", () => {
    snapshotViz();
    const blob = new Blob([JSON.stringify({ family: "kulibert.music", song: JSON.parse(Song.serialize(state.song)), drums: state.drums }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "class-song.bertysong.json";
    a.click();
    URL.revokeObjectURL(url);
    finishSong("save");
    $("lesson").textContent = "The file has the notes, the picture, and the reasons.";
  });
  const SHELF = "kulibert.music.shelf";
  function readShelf() {
    try {
      const list = JSON.parse(localStorage.getItem(SHELF) || "[]");
      return Array.isArray(list) ? list : [];
    } catch (err) {
      return [];
    }
  }
  function paintShelf() {
    const box = $("shelf");
    if (!box) return;
    box.innerHTML = "";
    readShelf().forEach((item) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "btn";
      b.textContent = fromLine(item.song || {});
      b.addEventListener("click", () => loadPack(item));
      box.appendChild(b);
    });
  }
  function rememberPack() {
    const list = readShelf();
    list.unshift({
      song: JSON.parse(Song.serialize(state.song)),
      drums: state.drums,
      pub: false,
      maker: (window.KulibertWho && window.KulibertWho.read() && window.KulibertWho.read().alias) || "You",
      instrument: state.band || "",
    });
    try {
      localStorage.setItem(SHELF, JSON.stringify(list.slice(0, 12)));
    } catch (err) {
      paintSaved(false);
    }
    paintShelf();
  }
  function loadPack(data) {
    const raw = data && data.song ? data.song : data;
    const song = Song.parse(JSON.stringify(raw || {}));
    if (!song) {
      $("lesson").textContent = "That file is not a song.";
      return;
    }
    state.song = song;
    if (data && data.drums) {
      ROWS.forEach(([id]) => {
        if (Array.isArray(data.drums[id])) state.drums[id] = to16(data.drums[id]);
      });
    }
    state.cursor = 0;
    state.step = 0;
    if (song.viz) applyViz(song.viz);
    if ($("tempo")) {
      $("tempo").value = String(song.bpm);
      $("tempo-read").textContent = String(song.bpm);
    }
    renderStaff();
    renderDrums();
    paintMeters();
    paintCount();
    keep();
    $("lesson").textContent = song.viz
      ? fromLine(song) + " is loaded. The picture came with it. Saved."
      : "This song has no picture yet. Open This song's picture and pick one.";
  }
  function remixSong() {
    snapshotViz();
    const from = (state.song.from || []).slice();
    if (!from.length) from.push(state.song.alias || "Class song");
    if (from[from.length - 1] !== "Remix") from.push("Remix");
    state.song.from = from.slice(0, 4);
    state.song.why = {};
    state.song = Song.parse(Song.serialize(state.song));
    rememberPack();
    keep();
    paintWhy();
    $("lesson").textContent = fromLine(state.song) + ". Change the notes, then defend them. Saved.";
  }
  const reasons = $("why-reasons");
  if (reasons && !reasons.childElementCount) {
    REASONS.forEach(([id, sentence]) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "btn";
      b.dataset.why = id;
      b.textContent = sentence.replace(/\.$/, "");
      b.addEventListener("click", () => {
        const ev = markAt(state.playing && state.step >= 0 ? state.step : state.cursor);
        if (!ev) return;
        state.song.why = Object.assign({}, state.song.why || {});
        state.song.why[ev.measure + "-" + ev.beat] = id;
        state.song = Song.parse(Song.serialize(state.song));
        keep();
        paintWhy();
        $("lesson").textContent = sentence + " Saved.";
      });
      reasons.appendChild(b);
    });
  }
  if ($("why-next")) {
    $("why-next").addEventListener("click", () => {
      const evs = Song.events(state.song);
      const step = state.playing && state.step >= 0 ? state.step : state.cursor;
      state.cursor = (step + 1) % Math.max(1, evs.length);
      if (!state.playing) state.step = state.cursor;
      paintCount();
      paintWhy();
    });
  }
  const picks = $("viz-picks");
  if (picks && !picks.childElementCount && window.KulibertStage) {
    window.KulibertStage.LOOKS.forEach((item) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "btn";
      b.textContent = item.label;
      b.addEventListener("click", () => {
        state.layers[0].look = item.id;
        state.look = item.id;
        const look = $("layer-0");
        if (look) look.value = item.id;
        snapshotViz();
        applyViz(state.song.viz);
        keep();
        $("lesson").textContent = item.label + " is this song's picture. Saved.";
      });
      picks.appendChild(b);
    });
  }
  if ($("viz-use")) {
    $("viz-use").addEventListener("click", () => {
      snapshotViz();
      applyViz(state.song.viz);
      keep();
      $("lesson").textContent = "This picture stays with the song. Saved.";
    });
  }
  if ($("remix-btn")) $("remix-btn").addEventListener("click", remixSong);
  paintShelf();
  if ($("open-btn") && $("open-file")) {
    $("open-btn").addEventListener("click", () => $("open-file").click());
    $("open-file").addEventListener("change", () => {
      const file = $("open-file").files && $("open-file").files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        let data = null;
        try { data = JSON.parse(String(reader.result || "")); } catch (err) { data = null; }
        if (data && data.family === "kulibert.music") loadPack(data);
        else if (data) loadPack({ song: data });
        else $("lesson").textContent = "That file is not a song.";
      };
      reader.readAsText(file);
    });
  }

  let micStream = null;
  let micRec = null;
  let micUrl = "";
  let micTimer = 0;
  let micWatch = 0;
  let micAudio = null;
  function releaseMic() {
    window.clearTimeout(micTimer);
    window.cancelAnimationFrame(micWatch);
    if (micStream) {
      micStream.getTracks().forEach((track) => track.stop());
      micStream = null;
    }
    const meter = $("mic-meter");
    if (meter) meter.hidden = true;
  }
  function forgetClip() {
    if (micAudio) {
      micAudio.pause();
      micAudio = null;
    }
    if (micUrl) URL.revokeObjectURL(micUrl);
    micUrl = "";
    ["mic-hear", "mic-down", "mic-del"].forEach((id) => {
      const el = $(id);
      if (el) el.hidden = true;
    });
  }
  function showClip(blob) {
    forgetClip();
    if (!blob || blob.size < 1) {
      $("mic-status").textContent = "Nothing was kept. The pads still work.";
      return;
    }
    micUrl = URL.createObjectURL(blob);
    ["mic-hear", "mic-down", "mic-del"].forEach((id) => { $(id).hidden = false; });
    $("mic-status").textContent = "One loop is ready. It is not saved here unless you download it.";
  }
  function watchLevel(stream) {
    arm();
    if (!ctx) return;
    const source = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);
    const data = new Uint8Array(analyser.fftSize);
    const tick = () => {
      if (!micStream) return;
      analyser.getByteTimeDomainData(data);
      let peak = 0;
      for (let i = 0; i < data.length; i++) peak = Math.max(peak, Math.abs(data[i] - 128));
      $("mic-level").style.width = Math.min(100, Math.round(peak * 1.5)) + "%";
      $("mic-meter").hidden = false;
      micWatch = window.requestAnimationFrame(tick);
    };
    tick();
  }
  async function startMicLoop() {
    $("mic-ask-box").hidden = true;
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || typeof MediaRecorder === "undefined") {
      $("mic-status").textContent = "This Chromebook cannot open the mic here. The pads still work.";
      return;
    }
    forgetClip();
    try {
      micStream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, channelCount: 1 },
        video: false,
      });
    } catch (err) {
      releaseMic();
      $("mic-status").textContent = "The mic stayed off. That's fine. The pads still work.";
      return;
    }
    const ms = Math.min(8000, Math.round(60000 / Math.max(70, state.song.bpm || 96)) * 8);
    let recorder;
    try {
      const mime = window.MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "";
      recorder = mime ? new MediaRecorder(micStream, { mimeType: mime }) : new MediaRecorder(micStream);
    } catch (err) {
      releaseMic();
      $("mic-status").textContent = "The mic stayed off. The pads still work.";
      return;
    }
    micRec = recorder;
    const chunks = [];
    recorder.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data); };
    recorder.onstop = () => {
      const type = recorder.mimeType || "audio/webm";
      releaseMic();
      showClip(new Blob(chunks, { type: type }));
    };
    recorder.start();
    watchLevel(micStream);
    if (!state.playing) play();
    $("mic-status").textContent = "Listening for one loop. Then the mic turns off.";
    $("lesson").textContent = "The mic is on for this loop only. Tap the pads or play along.";
    micTimer = window.setTimeout(() => {
      if (recorder.state === "recording") recorder.stop();
    }, ms);
  }
  $("mic-ask").addEventListener("click", () => {
    $("mic-ask-box").hidden = false;
    $("mic-status").textContent = "";
  });
  $("mic-yes").addEventListener("click", () => { startMicLoop(); });
  $("mic-no").addEventListener("click", () => {
    $("mic-ask-box").hidden = true;
    releaseMic();
    $("mic-status").textContent = "Not now. The pads still work.";
  });
  $("mic-hear").addEventListener("click", () => {
    if (!micUrl) return;
    if (micAudio) micAudio.pause();
    micAudio = new Audio(micUrl);
    micAudio.play().catch(() => {
      $("mic-status").textContent = "Press Hear the loop again.";
    });
  });
  $("mic-down").addEventListener("click", () => {
    if (!micUrl) return;
    const a = document.createElement("a");
    a.href = micUrl;
    a.download = "class-loop.webm";
    a.click();
  });
  $("mic-del").addEventListener("click", () => {
    forgetClip();
    releaseMic();
    $("mic-status").textContent = "Deleted. Nothing was kept.";
  });
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeMenu();
      return;
    }
    const tag = e.target && e.target.tagName;
    if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA") return;
    if (e.code === "Space") {
      e.preventDefault();
      $("play-btn").click();
    }
  });
  window.addEventListener("pagehide", () => { keep(); releaseMic(); forgetClip(); });

  const Titles = window.KulibertTitles;
  if (Titles && $("title-lists")) {
    const starting = Titles.partsOf(state.song.alias) ? state.song.alias : Titles.starterTitle();
    state.song.alias = starting;
    Titles.mount($("title-lists"), starting, (title) => {
      state.song.alias = title;
      keep();
    });
  }
  $("tempo").value = String(state.song.bpm || 96);
  $("tempo-read").textContent = String(state.song.bpm || 96);
  $("blend").value = String(state.blend);
  $("blend-read").textContent = blendWord(state.blend);
  fillLights();
  if (state.song.viz) applyViz(state.song.viz);
  else loadSkin();
  paintAlong();
  paintMeters();
  paintInks();
  paintKeypad();
  $("add-bar").addEventListener("click", () => {
    const before = state.song.measures.length;
    Song.addMeasure(state.song);
    keep();
    renderStaff();
    paintCount();
    $("lesson").textContent = state.song.measures.length === before
      ? "That is 32 bars. That is a long song."
      : "A new bar is on the score. It is saved.";
  });
  $("expert-btn").addEventListener("click", () => {
    state.expert = !state.expert;
    keep();
    paintMeters();
    setMode(state.mode);
  });
  function readVizMap() {
    try {
      const raw = JSON.parse(localStorage.getItem(VIZ_MAP) || "{}");
      return raw && typeof raw === "object" ? raw : {};
    } catch (err) {
      return {};
    }
  }
  function songViz(name, own) {
    const id = readVizMap()[name];
    if (id && id !== "song") {
      const bank = VIZ_BANK.find((item) => item.id === id);
      if (bank && bank.viz) return bank.viz;
    }
    return own || PICTURES[name] || null;
  }
  function saveVizChoice(name, id) {
    const map = readVizMap();
    map[name] = id;
    try { localStorage.setItem(VIZ_MAP, JSON.stringify(map)); } catch (err) { /* the picture still shows */ }
  }
  function songTitle(song) {
    const from = (song && song.from || []).filter((name) => name && name !== "Remix" && name !== "Trap remix");
    const source = from[0];
    const alias = song && song.alias;
    if (source && alias && source !== alias) return alias + " · " + source;
    return source || alias || "New song";
  }
  function paintSongBar() {
    const song = state.song || {};
    const name = $("songbar-name");
    const meta = $("songbar-meta");
    const cover = $("song-cover");
    if (name) setBdi(name, songTitle(song) === "New song" ? (mu("newSong") || "New song") : songTitle(song));
    if (meta) meta.textContent = (song.bpm || 96) + " · " + (song.key || "C") + " · " + (song.meter || "4/4");
    if (cover) {
      const ink = { cyan: "#22d3ee", amber: "#fbbf24", violet: "#a78bfa", rose: "#fb7185", lime: "#a3e635", ice: "#bae6fd" };
      const color = song.viz && song.viz.layers && song.viz.layers[0] && ink[song.viz.layers[0].color];
      cover.style.background = "linear-gradient(145deg, " + (color || "#22d3ee") + ", #10203f)";
    }
  }
  const BIRTHDAY = ["F", "F", "G", "F", "B", "c", "F", "F", "G", "F", "c", "B", "F", "F", "F", "D", "B", "A", "G", "c", "c", "B", "G", "A", "F", null, null];
  function placeSong(opts) {
    const meter = opts.meter || "4/4";
    const per = { "2/4": 2, "3/4": 3, "4/4": 4, "6/8": 6 }[meter] || 4;
    const notes = opts.notes || [];
    const measures = [];
    for (let i = 0; notes.length ? i < notes.length && measures.length < 32 : measures.length < 1; i += per) {
      const beats = [];
      for (let b = 0; b < per; b++) beats.push(notes[i + b] == null ? null : notes[i + b]);
      measures.push({ id: "in-" + measures.length, label: String(measures.length + 1), beats: beats });
      if (!notes.length) break;
    }
    const TitlesNow = window.KulibertTitles;
    const alias = opts.alias || (TitlesNow && TitlesNow.partsOf(state.song.alias) ? state.song.alias : (TitlesNow ? TitlesNow.starterTitle() : ""));
    state.song = Song.normalize({
      alias: alias,
      bpm: opts.bpm || 96,
      meter: meter,
      key: opts.key || "C",
      measures: measures,
      viz: opts.viz || null,
      why: {},
      from: opts.from || [],
    });
    state.cursor = 0;
    state.step = 0;
    if (opts.drums) {
      ROWS.forEach(([id]) => {
        if (Array.isArray(opts.drums[id])) state.drums[id] = to16(opts.drums[id]);
      });
    }
    if (state.song.viz) applyViz(state.song.viz);
    if ($("tempo")) {
      $("tempo").value = String(state.song.bpm);
      $("tempo-read").textContent = String(state.song.bpm);
    }
    renderStaff();
    renderDrums();
    paintMeters();
    paintCount();
    paintSongBar();
    keep();
  }
  function layTrap() {
    const trap = {
      kick: [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0],
      snare: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1],
      clap: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
      hat: [1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1],
    };
    ROWS.forEach(([id]) => { state.drums[id] = to16(trap[id] || []); });
    state.song.bpm = 100;
    state.song.tempo = 100;
    state.bass = true;
    state.parts.bass = true;
    state.parts.drums = true;
    state.parts.melody = true;
    state.blend = 32;
    if ($("tempo")) {
      $("tempo").value = "100";
      $("tempo-read").textContent = "100";
    }
  }
  function openShelfSong(item, remix) {
    placeSong({
      notes: item.notes,
      bpm: item.bpm,
      meter: item.meter || "4/4",
      key: item.key || "C",
      viz: PICTURES[item.name] || null,
      from: [item.name],
      drums: item.drums,
      alias: remix && window.KulibertTitles ? window.KulibertTitles.pickTitle() : undefined,
    });
    if (remix) {
      if (item.name === "Happy Birthday") layTrap();
      state.song.from = [item.name, item.name === "Happy Birthday" ? "Trap remix" : "Remix"];
      state.song = Song.parse(Song.serialize(state.song));
      renderDrums();
      renderStaff();
      paintSongBar();
      keep();
    }
    document.body.classList.remove("is-home", "is-make", "is-library");
    if ($("home")) $("home").hidden = true;
    setMode(remix && item.name === "Happy Birthday" ? "both" : readWorkspace().preset);
    if (remix && item.name === "Happy Birthday") {
      const grid = $("drums");
      const box = grid && grid.closest("details");
      if (box) box.open = true;
    }
    $("how").textContent = remix
      ? (item.name === "Happy Birthday" ? "Happy Birthday, with trap drums. Press Play." : "A copy. Change it. The first song stays in the list.")
      : item.name + " is the song. Press Play.";
    rememberPack();
  }
  function paintSongShelf() {
    const openBox = $("open-songs");
    const saveBox = $("my-saves");
    if (openBox) {
      openBox.innerHTML = "";
      const rows = [{ name: "Happy Birthday", from: "public domain", notes: BIRTHDAY, bpm: 90, meter: "3/4", key: "F", feel: "bright" }].concat(songCatalog.filter((item) => item.name !== "Happy Birthday"));
      rows.slice(0, 28).forEach((item) => {
        const row = document.createElement("div");
        row.className = "song-row";
        const text = document.createElement("div");
        const strong = document.createElement("strong");
        setBdi(strong, item.name);
        const span = document.createElement("span");
        span.textContent = (item.from || mu("classWord") || "class") + " · " + (item.meter || "4/4");
        text.append(strong, span);
        const open = document.createElement("button");
        open.type = "button";
        open.className = "btn";
        open.textContent = mu("openBtn") || "Open";
        open.addEventListener("click", () => openShelfSong(item, false));
        const remix = document.createElement("button");
        remix.type = "button";
        remix.className = "btn";
        remix.textContent = item.name === "Happy Birthday" ? (mu("trapRemix") || "Trap remix") : (mu("remix") || "Remix");
        remix.addEventListener("click", () => openShelfSong(item, true));
        row.append(text, open, remix);
        openBox.appendChild(row);
      });
    }
    if (saveBox) {
      saveBox.innerHTML = "";
      const saved = readShelf();
      if (!saved.length) {
        const empty = document.createElement("p");
        empty.className = "hint";
        empty.textContent = mu("nothingSaved") || "Nothing saved on this Chromebook yet.";
        saveBox.appendChild(empty);
      }
      saved.forEach((item) => {
        const song = item.song || {};
        const row = document.createElement("div");
        row.className = "song-row";
        const text = document.createElement("div");
        const strong = document.createElement("strong");
        setBdi(strong, songTitle(song) === "New song" ? (mu("newSong") || "New song") : songTitle(song));
        const span = document.createElement("span");
        span.textContent = item.pub ? (mu("classWord") || "Class") : (mu("onlyHere") || "Only this Chromebook");
        text.append(strong, span);
        const open = document.createElement("button");
        open.type = "button";
        open.className = "btn";
        open.textContent = mu("openBtn") || "Open";
        open.addEventListener("click", () => {
          loadPack(item);
          paintSongBar();
          document.body.classList.remove("is-home");
          $("home").hidden = true;
          setMode(readWorkspace().preset);
        });
        const remix = document.createElement("button");
        remix.type = "button";
        remix.className = "btn";
        remix.textContent = mu("remix") || "Remix";
        remix.addEventListener("click", () => {
          loadPack(item);
          const TitlesNow = window.KulibertTitles;
          if (TitlesNow) state.song.alias = TitlesNow.pickTitle();
          const source = (song.from && song.from[0]) || song.alias || "Your song";
          state.song.from = [source, "Remix"];
          state.song.why = {};
          state.song = Song.parse(Song.serialize(state.song));
          paintSongBar();
          keep();
          document.body.classList.remove("is-home");
          $("home").hidden = true;
          setMode(readWorkspace().preset);
          $("how").textContent = "A copy of your save. Change it.";
          rememberPack();
        });
        row.append(text, open, remix);
        saveBox.appendChild(row);
      });
      readClass().forEach((item) => {
        const row = document.createElement("div");
        row.className = "song-row";
        const text = document.createElement("div");
        const strong = document.createElement("strong");
        setBdi(strong, (item.song && item.song.alias) || mu("yourSong") || "Class song");
        const span = document.createElement("span");
        span.textContent = item.code ? ((mu("classWord") || "Class") + " " + item.code) : (mu("onlyHere") || "Class on this Chromebook");
        text.append(strong, span);
        const open = document.createElement("button");
        open.type = "button";
        open.className = "btn";
        open.textContent = mu("openBtn") || "Open";
        open.addEventListener("click", () => openClass(item.id));
        row.append(text, open);
        saveBox.appendChild(row);
      });
    }
  }
  function showHome() {
    state.mode = "home";
    document.body.classList.add("is-home");
    document.body.classList.remove("is-score", "is-drums", "is-lights", "is-band", "is-sound", "is-both", "is-beat", "is-make", "is-library", "viz-full", "expert");
    ["both", "notes", "drums", "band", "lights", "sound"].forEach((name) => {
      const btn = $("mode-" + name);
      if (btn) btn.classList.remove("on");
    });
    if ($("home")) $("home").hidden = false;
    if ($("shelf-extra")) $("shelf-extra").hidden = true;
    if ($("make")) $("make").hidden = true;
    if ($("library")) $("library").hidden = true;
    paintSongBar();
    paintSongShelf();
    resetScroll();
  }
  function showMake() {
    document.body.classList.remove("is-home", "is-library");
    document.body.classList.add("is-make");
    $("home").hidden = true;
    $("make").hidden = false;
  }
  function showLibrary() {
    document.body.classList.remove("is-home", "is-make");
    document.body.classList.add("is-library");
    $("home").hidden = true;
    $("library").hidden = false;
    paintLibrary();
  }
  function paintLibrary() {
    const list = $("library-list");
    if (!list) return;
    const q = ($("library-find") && $("library-find").value || "").trim().toLowerCase();
    const map = readVizMap();
    list.innerHTML = "";
    const rows = [];
    songCatalog.forEach((item) => {
      rows.push({
        kind: "class",
        name: item.name,
        who: item.from,
        feel: item.feel,
        instrument: "",
        open: () => {
          openTune(item.name, item.from, item.notes, item.bpm);
          const viz = songViz(item.name, PICTURES[item.name]);
          if (viz) applyViz(viz);
          document.body.classList.remove("is-library");
          $("library").hidden = true;
          setMode(readWorkspace().preset);
        },
      });
    });
    readShelf().forEach((item, index) => {
      const song = item.song || {};
      rows.push({
        kind: item.pub ? "class" : "mine",
        name: song.alias || "Your song",
        who: item.maker || "You",
        feel: (song.bpm || 96) < 90 ? "calm" : (song.bpm || 96) > 110 ? "drive" : "bright",
        instrument: item.instrument || "",
        shelf: index,
        open: () => {
          loadPack(item);
          document.body.classList.remove("is-library");
          $("library").hidden = true;
          setMode(readWorkspace().preset);
        },
      });
    });
    rows.filter((row) => {
      if (libraryFilter === "class" && row.kind !== "class") return false;
      if (libraryFilter === "mine" && row.kind !== "mine") return false;
      const hay = (row.name + " " + row.who + " " + row.feel + " " + row.instrument).toLowerCase();
      return !q || hay.indexOf(q) !== -1;
    }).forEach((row) => {
      const card = document.createElement("article");
      card.className = "lib-song";
      const title = document.createElement("h2");
      title.textContent = row.name;
      const meta = document.createElement("p");
      meta.textContent = row.who + " · " + row.feel + (row.instrument ? " · " + row.instrument : "") + (row.kind === "class" ? " · class" : " · private");
      const chips = document.createElement("div");
      chips.className = "viz-row";
      const key = row.name;
      VIZ_BANK.forEach((bank) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "btn" + ((map[key] || "song") === bank.id ? " on" : "");
        b.textContent = bank.id === "song" ? "This song" : bank.name;
        b.addEventListener("click", () => {
          saveVizChoice(key, bank.id);
          const viz = bank.viz || songViz(key, PICTURES[key]);
          if (viz) {
            applyViz(viz);
            if (row.shelf != null) {
              const shelf = readShelf();
              if (shelf[row.shelf] && shelf[row.shelf].song) {
                shelf[row.shelf].song.viz = viz;
                try { localStorage.setItem(SHELF, JSON.stringify(shelf)); } catch (err) { /* still on screen */ }
              }
            }
          }
          document.body.classList.remove("is-library");
          $("library").hidden = true;
          document.body.classList.add("viz-full");
          setMode("lights");
          const label = bank.id === "song" ? "This song" : bank.name;
          $("how").textContent = label + " is now the picture. Home takes you back.";
        });
        chips.appendChild(b);
      });
      const open = document.createElement("button");
      open.type = "button";
      open.className = "btn open-song";
      open.textContent = "Open this song";
      open.addEventListener("click", row.open);
      if (row.shelf != null) {
        const pub = document.createElement("button");
        pub.type = "button";
        pub.className = "btn";
        const shelf = readShelf();
        const isPub = !!(shelf[row.shelf] && shelf[row.shelf].pub);
        pub.textContent = isPub ? "Class can see it" : "Only you";
        pub.addEventListener("click", () => {
          const next = readShelf();
          if (!next[row.shelf]) return;
          next[row.shelf].pub = !next[row.shelf].pub;
          try { localStorage.setItem(SHELF, JSON.stringify(next)); } catch (err) { /* still on screen */ }
          paintLibrary();
        });
        card.appendChild(title);
        card.appendChild(meta);
        card.appendChild(chips);
        card.appendChild(open);
        card.appendChild(pub);
      } else {
        card.appendChild(title);
        card.appendChild(meta);
        card.appendChild(chips);
        card.appendChild(open);
      }
      list.appendChild(card);
    });
  }
  function bootHome() {
    const cards = $("do-cards");
    if (!cards || cards.childElementCount) return;
    const jobs = [
      ["Make a song", "Pick a feel and a speed. Then the staff.", showMake],
      ["Tap a score", "Tap a letter. It lands on the next beat.", () => { setMode("notes"); $("how").textContent = "Tap a letter. It goes on the next beat."; }],
      ["Write a score", "Change any note on the staff.", () => setMode("notes")],
      ["Tap along", "Hit the pads when they flash.", () => { state.along = true; if (typeof paintAlong === "function") paintAlong(); setMode("drums"); }],
      ["See the picture", "The song fills the screen.", () => { document.body.classList.add("viz-full"); setMode("lights"); }],
      ["Remix a song", "Start from a song in the library.", showLibrary],
      ["Change the picture", "Pick a look for this song.", () => setMode("lights")],
      ["Band", "Fingerings for your instrument.", () => setMode("band")],
    ];
    jobs.forEach(([title, line, go]) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "do-card";
      const strong = document.createElement("strong");
      strong.textContent = title;
      const span = document.createElement("span");
      span.textContent = line;
      b.appendChild(strong);
      b.appendChild(span);
      b.addEventListener("click", () => {
        document.body.classList.remove("is-home", "viz-full");
        if ($("home")) $("home").hidden = true;
        go();
      });
      cards.appendChild(b);
    });
    const feels = [["calm", "Calm"], ["bright", "Bright"], ["drive", "Drive"]];
    const feelBox = $("make-feels");
    feels.forEach(([id, label]) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "do-card" + (id === makeFeel ? " on" : "");
      b.textContent = label;
      b.addEventListener("click", () => {
        makeFeel = id;
        feelBox.querySelectorAll(".do-card").forEach((el) => el.classList.toggle("on", el === b));
        const tempo = id === "calm" ? 80 : id === "drive" ? 124 : 104;
        $("make-tempo").value = String(tempo);
        $("make-tempo-read").textContent = String(tempo);
      });
      feelBox.appendChild(b);
    });
    $("make-tempo").addEventListener("input", () => {
      $("make-tempo-read").textContent = $("make-tempo").value;
    });
    [["piano", "Piano"], ["flute", "Flute"], ["trumpet", "Trumpet"], ["violin", "Violin"], ["percussion", "Drums"]].forEach(([id, label]) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "do-card" + (id === makeInst ? " on" : "");
      b.textContent = label;
      b.addEventListener("click", () => {
        makeInst = id;
        $("make-inst").querySelectorAll(".do-card").forEach((el) => el.classList.toggle("on", el === b));
      });
      $("make-inst").appendChild(b);
    });
    $("make-go").addEventListener("click", () => {
      const tempo = Number($("make-tempo").value) || 96;
      state.song.bpm = tempo;
      state.song.tempo = tempo;
      if ($("tempo")) {
        $("tempo").value = String(tempo);
        $("tempo-read").textContent = String(tempo);
      }
      state.band = makeInst === "percussion" ? "percussion" : makeInst;
      const sound = { piano: "winds", flute: "winds", trumpet: "brass", violin: "strings", percussion: "beep" }[makeInst];
      if (sound) state.orch = sound;
      ROWS.forEach(([id]) => { state.drums[id] = Array(GRID).fill(false); });
      state.drums.kick[0] = true;
      if (makeFeel !== "calm") state.drums.snare[4] = true;
      if (makeFeel === "drive") {
        state.drums.hat[0] = true;
        state.drums.hat[2] = true;
        state.drums.hat[4] = true;
        state.drums.hat[6] = true;
      }
      const look = makeFeel === "calm" ? "soft" : makeFeel === "drive" ? "storm" : "fire";
      const bank = VIZ_BANK.find((item) => item.id === look);
      if (bank && bank.viz) applyViz(bank.viz);
      document.body.classList.remove("is-make");
      $("make").hidden = true;
      setMode(readWorkspace().preset);
      $("how").textContent = "The feel is set. Tap a letter or a pad. Then press Play.";
      keep();
      renderDrums();
    });
    [["all", "All"], ["class", "Class"], ["mine", "Mine"]].forEach(([id, label]) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "btn" + (id === "all" ? " on" : "");
      b.textContent = label;
      b.addEventListener("click", () => {
        libraryFilter = id;
        $("library-filters").querySelectorAll(".btn").forEach((el) => el.classList.toggle("on", el === b));
        paintLibrary();
      });
      $("library-filters").appendChild(b);
    });
    $("library-find").addEventListener("input", paintLibrary);
    if ($("songs-btn")) $("songs-btn").addEventListener("click", showHome);
    if ($("dock-songs")) $("dock-songs").addEventListener("click", showHome);
    if ($("dock-library")) $("dock-library").addEventListener("click", () => { if (typeof showLibrary === "function") showLibrary(); });
    if ($("dock-import")) $("dock-import").addEventListener("click", () => {
      if ($("shelf-extra")) $("shelf-extra").hidden = false;
      showHome();
      const box = $("import-file");
      if (box && box.parentElement) box.parentElement.scrollIntoView({ block: "start" });
    });
    const moreTools = $("more-tools");
    if (moreTools) moreTools.addEventListener("click", () => {
      const pop = $("more-pop");
      if (!pop) return;
      const open = pop.hidden;
      pop.hidden = !open;
      moreTools.setAttribute("aria-expanded", String(open));
    });
    $("song-cover").addEventListener("click", showHome);
    $("start-blank").addEventListener("click", () => {
      const TitlesNow = window.KulibertTitles;
      placeSong({
        notes: [null, null, null, null],
        bpm: 96,
        meter: "4/4",
        key: "C",
        from: [],
        alias: TitlesNow ? TitlesNow.pickTitle() : "",
      });
      document.body.classList.remove("is-home");
      $("home").hidden = true;
      setMode(readWorkspace().preset);
      $("how").textContent = "Empty staff. Tap a letter to place a note.";
      rememberPack();
    });
    let pickKey = "C";
    let pickMeter = "4/4";
    $("start-key").addEventListener("click", () => {
      $("key-pick").hidden = !$("key-pick").hidden;
    });
    [["C", "C"], ["G", "G"], ["D", "D"], ["F", "F"], ["Bb", "B flat"]].forEach(([id, label]) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "do-card" + (id === "C" ? " on" : "");
      b.textContent = label;
      b.addEventListener("click", () => {
        pickKey = id;
        $("key-keys").querySelectorAll(".do-card").forEach((el) => el.classList.toggle("on", el === b));
      });
      $("key-keys").appendChild(b);
    });
    ["4/4", "3/4", "2/4", "6/8"].forEach((id) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "do-card" + (id === "4/4" ? " on" : "");
      b.textContent = id;
      b.addEventListener("click", () => {
        pickMeter = id;
        $("key-meters").querySelectorAll(".do-card").forEach((el) => el.classList.toggle("on", el === b));
      });
      $("key-meters").appendChild(b);
    });
    $("key-tempo").addEventListener("input", () => {
      $("key-tempo-read").textContent = $("key-tempo").value;
    });
    $("key-go").addEventListener("click", () => {
      const per = { "2/4": 2, "3/4": 3, "4/4": 4, "6/8": 6 }[pickMeter] || 4;
      const TitlesNow = window.KulibertTitles;
      placeSong({
        notes: Array(per).fill(null),
        bpm: Number($("key-tempo").value) || 96,
        meter: pickMeter,
        key: pickKey,
        from: [],
        alias: TitlesNow ? TitlesNow.pickTitle() : "",
      });
      document.body.classList.remove("is-home");
      $("home").hidden = true;
      setMode(readWorkspace().preset);
      $("how").textContent = pickMeter + " in " + pickKey + ". Tap a letter.";
      rememberPack();
    });
    let importKind = "lab";
    function beginImport(kind) {
      importKind = kind;
      const input = $("import-file");
      input.accept = kind === "midi" ? ".mid,.midi,audio/midi" : kind === "abc" ? ".abc,.txt" : kind === "xml" ? ".xml,.musicxml" : ".json";
      input.value = "";
      input.click();
    }
    $("import-lab").addEventListener("click", () => beginImport("lab"));
    $("import-abc").addEventListener("click", () => beginImport("abc"));
    $("import-midi").addEventListener("click", () => beginImport("midi"));
    $("import-xml").addEventListener("click", () => beginImport("xml"));
    $("import-file").addEventListener("change", () => {
      const input = $("import-file");
      const file = input.files && input.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const Import = window.KulibertImport;
          let got = null;
          if (importKind === "lab") {
            const data = JSON.parse(String(reader.result || ""));
            loadPack(data && data.song ? data : { song: data });
          } else if (importKind === "abc") {
            got = Import.abc(String(reader.result || ""));
          } else if (importKind === "xml") {
            got = Import.xml(String(reader.result || ""));
          } else {
            got = Import.midi(reader.result);
          }
          if (got) {
            placeSong({
              notes: got.notes,
              bpm: got.bpm,
              meter: got.meter,
              key: got.key,
              from: [file.name.replace(/\.[^.]+$/, "")],
            });
          }
          document.body.classList.remove("is-home");
          $("home").hidden = true;
          setMode(readWorkspace().preset);
          paintSongBar();
          rememberPack();
          $("how").textContent = "That file is the song now. Press Play.";
        } catch (err) {
          $("how").textContent = "That file did not open. Try ABC, MIDI, MusicXML, or a DJ Berty file.";
        }
      };
      if (importKind === "midi") reader.readAsArrayBuffer(file);
      else reader.readAsText(file);
    });
  }
  bootHome();

  paintMix();
  const startBoard = (() => {
    const board = new URLSearchParams(window.location.search).get("board");
    if (board === "beats" || board === "drums") return "drums";
    if (board === "lights") return "lights";
    if (board === "band") return "band";
    if (board === "sound") return "sound";
    if (board === "notes" || board === "score") return "notes";
    return "";
  })();
  if (startBoard) setMode(startBoard);
  else showHome();
  buildKit();
  renderStaff();
  nameLooseSvgs();
  window.addEventListener("resize", () => {
    if (state.mode === "both" || state.mode === "notes" || state.mode === "beat") renderStaff();
  });
  renderDrums();
  paintLooks();
  paintFx();
  paintWaves();
  syncSynth();
  paintCount();
  if (state.restored) $("lesson").textContent = "Brought back the last song we could open.";
  keep();

  function paintMix() {
    const box = $("mix");
    if (!box || box.childElementCount) return;
    ROWS.forEach(([id, label]) => {
      const row = document.createElement("label");
      const name = document.createElement("span");
      name.textContent = label;
      const slider = document.createElement("input");
      slider.type = "range";
      slider.min = "0";
      slider.max = "100";
      slider.value = String(state.mix[id] || 0);
      slider.setAttribute("aria-label", label + " loudness");
      const read = document.createElement("b");
      read.textContent = slider.value;
      slider.addEventListener("input", () => {
        state.mix[id] = Number(slider.value);
        read.textContent = slider.value;
        keep();
      });
      row.append(name, slider, read);
      box.appendChild(row);
    });
    const swing = $("swing");
    if (swing) {
      swing.value = String(state.swing || 0);
      $("swing-read").textContent = swing.value;
      swing.addEventListener("input", () => {
        state.swing = Number(swing.value);
        $("swing-read").textContent = swing.value;
        keep();
      });
    }
    const click = $("click-btn");
    if (click) {
      click.classList.toggle("on", state.click);
      click.setAttribute("aria-pressed", String(state.click));
      click.addEventListener("click", () => {
        state.click = !state.click;
        click.classList.toggle("on", state.click);
        click.setAttribute("aria-pressed", String(state.click));
        click.textContent = state.click ? "Click is on" : "Add a click";
        keep();
      });
    }
    const patterns = {
      "Kicks": { kick: [1, 0, 1, 0, 1, 0, 1, 0] },
      "Backbeat": { snare: [0, 0, 0, 0, 1, 0, 0, 0], clap: [0, 0, 0, 0, 1, 0, 0, 0] },
      "Hats": { hat: [1, 0, 1, 0, 1, 0, 1, 0] },
      "Shaker": { shaker: [1, 1, 1, 1, 1, 1, 1, 1] },
      "Toms": { tom: [0, 1, 0, 1, 0, 0, 1, 0] },
      "Disco": { kick: [1, 0, 1, 0, 1, 0, 1, 0], hat: [0, 1, 0, 1, 0, 1, 0, 1] },
      "Reggae": { kick: [0, 0, 1, 0, 0, 0, 1, 0], hat: [0, 0, 1, 0, 0, 0, 1, 0], rim: [0, 0, 1, 0, 0, 0, 1, 0] },
      "Rock": { kick: [1, 0, 0, 1, 0, 0, 1, 0], snare: [0, 0, 0, 0, 1, 0, 0, 0], hat: [1, 1, 1, 1, 1, 1, 1, 1] },
      "Fill": { snare: [0, 0, 0, 0, 1, 1, 1, 1], tom: [0, 0, 1, 0, 1, 0, 1, 1], crash: [0, 0, 0, 0, 0, 0, 0, 1] },
      "Bells": { bell: [1, 0, 0, 1, 0, 0, 1, 0] },
      "Clave": { rim: [1, 0, 0, 1, 0, 0, 1, 0], bell: [1, 0, 0, 1, 0, 1, 0, 0] },
      "Half": { kick: [1, 0, 0, 0, 0, 0, 0, 0], snare: [0, 0, 0, 0, 1, 0, 0, 0] },
      "Offbeats": { hat: [0, 1, 0, 1, 0, 1, 0, 1], shaker: [0, 1, 0, 1, 0, 1, 0, 1] },
    };
    const host = $("patterns");
    if (host) {
      Object.keys(patterns).forEach((name) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "btn";
        b.textContent = name;
        b.addEventListener("click", () => {
          const spec = patterns[name];
          Object.keys(spec).forEach((id) => {
            spec[id].forEach((on, i) => { if (on) state.drums[id][i] = true; });
          });
          renderDrums();
          keep();
          $("lesson").textContent = name + " added. Saved.";
        });
        host.appendChild(b);
      });
      const surprise = document.createElement("button");
      surprise.type = "button";
      surprise.className = "btn";
      surprise.textContent = "Surprise";
      surprise.addEventListener("click", () => {
        drumUndo = JSON.parse(JSON.stringify(state.drums));
        $("undo-clear").hidden = false;
        ROWS.forEach(([id]) => {
          if (id === "crash") return;
          for (let i = 0; i < GRID; i++) state.drums[id][i] = Math.random() < (id === "kick" ? 0.22 : 0.16);
        });
        state.drums.kick[0] = true;
        renderDrums();
        keep();
        $("lesson").textContent = "Surprise beat. Bring it back puts the old drums back.";
      });
      host.appendChild(surprise);
    }
    const chords = $("chords");
    if (chords && !chords.childElementCount) {
      const sets = [
        ["C", ["C", "E", "G", "C"]],
        ["F", ["F", "A", "C", "F"]],
        ["G", ["G", "B", "D", "G"]],
        ["Am", ["A", "C", "E", "A"]],
      ];
      sets.forEach(([name, notes]) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "btn";
        b.textContent = name;
        b.addEventListener("click", () => {
          const evs = Song.events(state.song);
          notes.forEach((pitch, i) => {
            const ev = evs[i];
            if (ev) Song.setBeat(state.song, ev.measure, ev.beat, pitch);
          });
          renderStaff();
          keep();
          $("lesson").textContent = name + " is on beats 1 to 4. Saved.";
        });
        chords.appendChild(b);
      });
    }
    const ideas = $("melodies");
    if (ideas && !ideas.childElementCount) {
      const writeLine = (name, notes) => {
        const evs = Song.events(state.song);
        notes.forEach((pitch, i) => {
          const ev = evs[i];
          if (ev) Song.setBeat(state.song, ev.measure, ev.beat, pitch);
        });
        renderStaff();
        keep();
        $("lesson").textContent = name + " is on the staff. Saved.";
      };
      const lines = [
        ["Walk", ["C", "D", "E", "F", "G", "A", "B", "c"]],
        ["Pop", ["C", "C", "G", "G", "A", "A", "F", "F"]],
        ["Home", ["C", "E", "G", "c", "C", "E", "G", "c"]],
        ["Question", ["C", "D", "E", "G", "E", "D", "C", "C"]],
      ];
      lines.forEach(([name, notes]) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "btn";
        b.textContent = name;
        b.addEventListener("click", () => writeLine(name, notes));
        ideas.appendChild(b);
      });
      const again = document.createElement("button");
      again.type = "button";
      again.className = "btn";
      again.textContent = "Again";
      again.addEventListener("click", () => {
        const evs = Song.events(state.song);
        for (let i = 0; i < 4; i++) {
          if (evs[i] && evs[i + 4]) Song.setBeat(state.song, evs[i + 4].measure, evs[i + 4].beat, evs[i].pitch);
        }
        renderStaff();
        keep();
        $("lesson").textContent = "The first four notes play again. Saved.";
      });
      const shift = (dir, word) => {
        const ids = (Song.PITCHES || []).map((p) => p.id);
        Song.events(state.song).forEach((ev) => {
          if (!ev.pitch) return;
          let i = ids.indexOf(ev.pitch) + dir;
          if (i < 0) i = 0;
          if (i >= ids.length) i = ids.length - 1;
          Song.setBeat(state.song, ev.measure, ev.beat, ids[i]);
        });
        renderStaff();
        keep();
        $("lesson").textContent = "The tune moved " + word + ". Saved.";
      };
      [["Up", 1, "up"], ["Down", -1, "down"]].forEach(([name, dir, word]) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "btn";
        b.textContent = name;
        b.addEventListener("click", () => shift(dir, word));
        ideas.appendChild(b);
      });
      ideas.appendChild(again);
    }
    const classics = $("classics");
    if (classics && !classics.childElementCount) {
      const loadTune = (name, place, notes, bpm) => {
        const measures = [];
        const bars = Math.ceil(notes.length / 4);
        for (let i = 0; i < bars; i++) {
          measures.push({
            id: "tune-" + i,
            label: String(i + 1),
            beats: [0, 1, 2, 3].map((b) => notes[i * 4 + b] || null),
          });
        }
        state.song = Song.normalize({
          alias: state.song.alias,
          bpm: bpm || 96,
          meter: "4/4",
          measures: measures,
          viz: PICTURES[name] || null,
          why: {},
          from: [name],
        });
        state.cursor = 0;
        state.step = 0;
        if (state.song.viz) applyViz(state.song.viz);
        if ($("tempo")) {
          $("tempo").value = String(state.song.bpm);
          $("tempo-read").textContent = String(state.song.bpm);
        }
        renderStaff();
        paintMeters();
        paintCount();
        keep();
        $("lesson").textContent = name + " from " + place + ". White-key version. Change any note. Saved.";
        const teach = $("teach");
        if (teach && !state.expert) teach.textContent = name + ". Press Play. The line names each note.";
      };
      const z = [0, 0, 0, 0, 0, 0, 0, 0];
      const styles = {
        Trap: { bpm: 74, bass: true, blend: 32, swing: 0, wave: "sine", len: 0.42, drums: { kick: [1, 0, 0, 0, 0, 0, 1, 0], snare: [0, 0, 0, 0, 1, 0, 0, 0], clap: [0, 0, 0, 0, 1, 0, 0, 1], hat: [1, 0, 1, 1, 1, 0, 1, 1], shaker: [0, 1, 0, 1, 0, 1, 0, 1] } },
        "Hip-hop": { bpm: 92, bass: true, blend: 36, swing: 8, wave: "sine", len: 0.34, drums: { kick: [1, 0, 0, 1, 0, 0, 1, 0], snare: [0, 0, 0, 0, 1, 0, 0, 0], hat: [1, 0, 1, 0, 1, 0, 1, 0] } },
        Rock: { bpm: 124, bass: true, blend: 40, swing: 0, wave: "square", len: 0.22, drums: { kick: [1, 0, 0, 1, 0, 0, 1, 0], snare: [0, 0, 1, 0, 0, 0, 1, 0], hat: [1, 1, 1, 1, 1, 1, 1, 1], crash: [1, 0, 0, 0, 0, 0, 0, 0] } },
        Funk: { bpm: 104, bass: true, blend: 34, swing: 12, wave: "square", len: 0.16, drums: { kick: [1, 0, 0, 1, 0, 1, 0, 0], snare: [0, 0, 1, 0, 0, 0, 1, 0], hat: [0, 1, 0, 1, 0, 1, 0, 1] } },
        Disco: { bpm: 118, bass: true, blend: 38, swing: 0, wave: "sawtooth", len: 0.2, drums: { kick: [1, 0, 1, 0, 1, 0, 1, 0], hat: [0, 1, 0, 1, 0, 1, 0, 1], clap: [0, 0, 1, 0, 0, 0, 1, 0] } },
        Reggae: { bpm: 78, bass: true, blend: 30, swing: 0, wave: "sine", len: 0.36, drums: { kick: [0, 0, 1, 0, 0, 0, 1, 0], hat: [0, 0, 1, 0, 0, 0, 1, 0], rim: [0, 0, 1, 0, 0, 0, 1, 0] } },
        Jazz: { bpm: 138, bass: true, blend: 48, swing: 50, wave: "triangle", len: 0.24, drums: { kick: [1, 0, 0, 0, 0, 0, 1, 0], snare: [0, 0, 0, 0, 1, 0, 0, 0], bell: [1, 0, 1, 1, 1, 0, 1, 1] } },
        Blues: { bpm: 84, bass: true, blend: 42, swing: 36, wave: "triangle", len: 0.3, drums: { kick: [1, 0, 0, 1, 0, 0, 1, 0], snare: [0, 0, 1, 0, 0, 0, 1, 1], hat: [1, 0, 1, 0, 1, 0, 1, 0] } },
        March: { bpm: 112, bass: false, blend: 45, swing: 0, wave: "square", len: 0.18, drums: { kick: [1, 0, 1, 0, 1, 0, 1, 0], snare: [1, 1, 1, 1, 1, 1, 1, 1], crash: [1, 0, 0, 0, 1, 0, 0, 0] } },
        Latin: { bpm: 108, bass: true, blend: 40, swing: 0, wave: "triangle", len: 0.22, drums: { kick: [1, 0, 0, 1, 0, 0, 1, 0], tom: [0, 0, 1, 0, 0, 1, 0, 1], clap: [0, 0, 0, 1, 0, 0, 1, 0], shaker: [1, 0, 1, 0, 1, 0, 1, 0] } },
        Afrobeat: { bpm: 112, bass: true, blend: 34, swing: 0, wave: "square", len: 0.18, drums: { kick: [1, 0, 1, 0, 1, 0, 0, 1], snare: [0, 0, 0, 1, 0, 0, 1, 0], hat: [0, 1, 0, 1, 0, 1, 0, 1], bell: [1, 0, 1, 0, 1, 1, 0, 1] } },
        Samba: { bpm: 104, bass: false, blend: 36, swing: 0, wave: "triangle", len: 0.16, drums: { kick: [1, 0, 0, 0, 1, 0, 0, 0], snare: [0, 0, 1, 0, 0, 1, 1, 0], shaker: [1, 1, 1, 1, 1, 1, 1, 1], tamb: [0, 1, 0, 1, 0, 1, 0, 1] } },
        Bossa: { bpm: 128, bass: true, blend: 55, swing: 6, wave: "sine", len: 0.3, drums: { kick: [1, 0, 0, 1, 0, 0, 1, 0], rim: [0, 0, 1, 0, 0, 0, 1, 0], shaker: [1, 0, 1, 0, 1, 0, 1, 0] } },
        Country: { bpm: 110, bass: true, blend: 46, swing: 10, wave: "triangle", len: 0.24, drums: { kick: [1, 0, 0, 0, 1, 0, 0, 0], snare: [0, 0, 1, 0, 0, 0, 1, 0], hat: [1, 0, 1, 0, 1, 0, 1, 0] } },
        Dance: { bpm: 128, bass: true, blend: 30, swing: 0, wave: "sawtooth", len: 0.16, drums: { kick: [1, 0, 0, 0, 1, 0, 0, 0], clap: [0, 0, 0, 0, 1, 0, 0, 0], hat: [1, 1, 1, 1, 1, 1, 1, 1] } },
        Lullaby: { bpm: 66, bass: false, blend: 72, swing: 0, wave: "sine", len: 0.62, drums: { kick: [1, 0, 0, 0, 0, 0, 0, 0], bell: [1, 0, 0, 1, 0, 0, 1, 0] } },
        Folk: { bpm: 96, bass: false, blend: 62, swing: 0, wave: "triangle", len: 0.32, drums: { kick: [1, 0, 0, 0, 1, 0, 0, 0], shaker: [1, 0, 1, 0, 1, 0, 1, 0] } },
        Jig: { bpm: 126, bass: false, blend: 44, swing: 18, wave: "triangle", len: 0.18, drums: { kick: [1, 0, 0, 1, 0, 0, 1, 0], snare: [0, 0, 1, 0, 0, 1, 0, 0], bell: [1, 0, 1, 0, 1, 0, 1, 0] } },
        Drumline: { bpm: 132, bass: false, blend: 28, swing: 0, wave: "square", len: 0.12, drums: { kick: [1, 0, 0, 0, 1, 0, 0, 0], snare: [1, 0, 1, 1, 1, 0, 1, 0], rim: [0, 0, 1, 0, 0, 0, 1, 1] } },
        Claps: { bpm: 100, bass: false, blend: 40, swing: 0, wave: "triangle", len: 0.28, drums: { kick: [1, 0, 0, 0, 1, 0, 0, 0], clap: [1, 0, 1, 0, 1, 0, 1, 0] } },
      };
      const applyStyle = (name) => {
        const style = styles[name];
        if (!style) return;
        ROWS.forEach(([id]) => {
          state.drums[id] = to16(style.drums[id] || z);
        });
        state.song.bpm = style.bpm;
        state.song.tempo = style.bpm;
        state.bass = !!style.bass;
        state.blend = style.blend;
        state.swing = style.swing || 0;
        state.wave = style.wave || "triangle";
        state.noteLen = style.len || 0.28;
        const bassBtn = $("bass-btn");
        if (bassBtn) {
          bassBtn.classList.toggle("on", state.bass);
          bassBtn.setAttribute("aria-pressed", String(state.bass));
          bassBtn.textContent = state.bass ? "Bass is on" : "Bass follows the kick";
        }
        if ($("tempo")) {
          $("tempo").value = String(style.bpm);
          $("tempo-read").textContent = String(style.bpm);
        }
        if ($("blend")) {
          $("blend").value = String(style.blend);
          $("blend-read").textContent = blendWord(style.blend);
        }
        if ($("swing")) {
          $("swing").value = String(state.swing);
          $("swing-read").textContent = String(state.swing);
        }
        document.querySelectorAll("#styles .btn").forEach((btn) => {
          btn.classList.toggle("on", btn.textContent === name);
        });
        renderDrums();
        keep();
        if (state.playing) { stop(); play(); }
        $("lesson").textContent = name + " under the same notes. Saved.";
      };
      const trapIt = () => applyStyle("Trap");
      let odeNotes = null;
      const catalog = [];
      const shelves = [
        ["Africa", [
          ["Kye Kye Kule", "Ghana", ["C", "E", "G", "G", "A", "G", "E", "C", "C", "E", "G", "G", "A", "G", "E", "C"], 104],
          ["Banuwa", "Liberia", ["C", "E", "G", "A", "G", "E", "C", null, "D", "E", "D", "C", "E", "G", "E", "C"], 92],
          ["Shosholoza", "Southern Africa", ["C", "E", "E", "E", "G", "G", "E", "D", "C", "E", "E", "E", "G", "E", "D", "C"], 108],
        ]],
        ["East Asia", [
          ["Sakura", "Japan", ["A", "A", "B", "A", "A", "B", "A", "G", "E", "E", "G", "A", "G", "E", "D", "C", "A", "A", "B", "A", "A", "B", "A", "G", "E", "E", "G", "A", "G", "E", "C", null], 80],
          ["Arirang", "Korea", ["G", "A", "c", "A", "G", "E", "E", "D", "E", "G", "A", "G", "E", "D", "C", null], 88],
          ["Jasmine Flower", "China", ["E", "G", "A", "G", "E", "D", "C", null, "D", "E", "G", "A", "G", "E", "D", "C"], 84],
        ]],
        ["South Asia", [
          ["Chanda Mama", "India", ["C", "E", "G", "A", "G", "E", "C", null, "D", "F", "E", "D", "C", null, null, null], 86],
        ]],
        ["Europe", [
          ["Ode to Joy", "Germany", ["E", "E", "F", "G", "G", "F", "E", "D", "C", "C", "D", "E", "E", "D", "D", null, "E", "E", "F", "G", "G", "F", "E", "D", "C", "C", "D", "E", "D", "C", "C", null], 104],
          ["Korobeiniki", "Russia", ["E", "G", "A", "c", "A", "G", "F", "E", "D", "F", "G", "B", "G", "F", "E", "D", "C", "E", "F", "A", "G", "F", "E", "D", "C", null, null, null], 120],
          ["Frere Jacques", "France", ["C", "D", "E", "C", "C", "D", "E", "C", "E", "F", "G", null, "E", "F", "G", null, "G", "A", "G", "F", "E", "C", null, null, "C", "G", "C", null], 96],
          ["Scarborough Fair", "England", ["A", "A", "E", "F", "E", "D", "C", null, "D", "E", "F", "E", "D", "A", "A", null], 76],
        ]],
        ["Americas", [
          ["The Saints", "United States", ["C", "E", "F", "G", "C", "E", "F", "G", "C", "E", "F", "G", "E", "C", "E", "D", "C", null, null, null], 112],
          ["La Cucaracha", "Mexico", ["C", "C", "C", "F", "A", "A", "A", null, "F", "F", "F", "A", "c", "c", "c", null, "G", "G", "G", "B", "c", "A", "F", null], 116],
          ["Cielito Lindo", "Mexico", ["C", "E", "G", "G", "A", "G", "E", "C", "D", "E", "F", "E", "D", "C", null, null], 100],
          ["Simple Gifts", "United States", ["C", "C", "D", "E", "G", "E", null, null, "D", "E", "F", "E", "D", "C", null, null, "C", "C", "D", "E", "G", "E", "D", "C", "D", "E", "C", null], 96],
        ]],
        ["Islands and more", [
          ["Aloha Oe", "Hawaiʻi", ["C", "E", "G", "A", "G", "E", "C", null, "E", "G", "A", "G", "E", "D", "C", null], 84],
          ["Tumbalalaika", "Yiddish folk", ["E", "G", "A", "B", "c", "A", "G", "E", "D", "G", "A", "B", "A", "G", "E", null], 92],
          ["Zum Gali Gali", "Israel", ["C", "C", "C", "G", "A", "G", "E", "C", "C", "C", "C", "G", "A", "G", "E", "C"], 108],
          ["Dona Nobis", "a round", ["C", "D", "E", "G", "A", "G", "E", "C", "E", "F", "G", "c", "B", "A", "G", "E", "G", "A", "c", "B", "A", "G", "E", "C"], 80],
        ]],
        ["Lullabies", [
          ["Twinkle", "many places", ["C", "C", "G", "G", "A", "A", "G", null, "F", "F", "E", "E", "D", "D", "C", null, "G", "G", "F", "F", "E", "E", "D", null, "C", "C", "G", "G", "A", "A", "G", null, "F", "F", "E", "E", "D", "D", "C", null], 96],
          ["Little Lamb", "United States", ["E", "D", "C", "D", "E", "E", "E", null, "D", "D", "D", null, "E", "G", "G", null, "E", "D", "C", "D", "E", "E", "E", "E", "D", "D", "E", "D", "C", null, null, null], 96],
          ["Amazing Grace", "many places", ["G", "C", "E", "C", "E", "D", "C", null, "G", "C", "E", "C", "E", "D", null, null, "C", "E", "G", "A", "G", "E", "C", null, "E", "D", "C", null], 72],
          ["Jingle Bells", "United States", ["E", "E", "E", null, "E", "E", "E", null, "E", "G", "C", "D", "E", null, null, null, "F", "F", "F", "F", "F", "E", "E", "E", "E", "D", "D", "E", "D", "G", null, null], 120],
        ]],
      ];
      shelves.forEach(([place, songs]) => {
        const h = document.createElement("p");
        h.className = "shelf";
        h.textContent = place;
        classics.appendChild(h);
        const grid = document.createElement("div");
        grid.className = "shelf-songs";
        songs.forEach(([name, from, notes, bpm]) => {
          if (name === "Ode to Joy") odeNotes = notes;
          catalog.push({ name: name, from: from, notes: notes, bpm: bpm, feel: bpm < 90 ? "calm" : bpm > 110 ? "drive" : "bright" });
          const b = document.createElement("button");
          b.type = "button";
          b.className = "btn";
          b.textContent = name;
          b.addEventListener("click", () => loadTune(name, from, notes, bpm));
          grid.appendChild(b);
        });
        classics.appendChild(grid);
      });
      const joyTrap = document.createElement("button");
      joyTrap.type = "button";
      joyTrap.className = "btn";
      joyTrap.textContent = "Ode, but trap";
      joyTrap.addEventListener("click", () => {
        if (!odeNotes) return;
        loadTune("Ode to Joy", "Germany", odeNotes, 74);
        trapIt();
      });
      classics.appendChild(joyTrap);
      const trap = $("styles");
      if (trap && !trap.childElementCount) {
        Object.keys(styles).forEach((name) => {
          const b = document.createElement("button");
          b.type = "button";
          b.className = "btn";
          b.textContent = name;
          b.addEventListener("click", () => applyStyle(name));
          trap.appendChild(b);
        });
      }
      songCatalog = catalog;
      openTune = loadTune;
      paintSongShelf();
    }
    const bass = $("bass-btn");
    if (bass && !bass.dataset.ready) {
      bass.dataset.ready = "1";
      bass.classList.toggle("on", state.bass);
      bass.setAttribute("aria-pressed", String(state.bass));
      bass.textContent = state.bass ? "Bass is on" : "Bass follows the kick";
      bass.addEventListener("click", () => {
        state.bass = !state.bass;
        bass.classList.toggle("on", state.bass);
        bass.setAttribute("aria-pressed", String(state.bass));
        bass.textContent = state.bass ? "Bass is on" : "Bass follows the kick";
        keep();
      });
    }
    const scenes = $("scenes");
    if (scenes && !scenes.childElementCount) {
      const packs = {
        Storm: { wall: "sea", rgb: false, layers: [{ look: "rain", color: "ice" }, { look: "tunnel", color: "cyan" }, { look: "off", color: "ice" }], gear: { count: 32, wild: 80, glow: 100, spin: 85, trail: 24, zoom: 120, thick: 2, bounce: 80 } },
        Neon: { wall: "candy", rgb: true, layers: [{ look: "fireworks", color: "rose" }, { look: "rings", color: "lime" }, { look: "orbit", color: "violet" }], gear: { wild: 90, glow: 100, count: 28, thick: 6, trail: 30, zoom: 140, spin: 70, bounce: 60 } },
        Soft: { wall: "dusk", rgb: false, layers: [{ look: "bloom", color: "violet" }, { look: "ribbon", color: "ice" }, { look: "off", color: "cyan" }], gear: { wild: 15, glow: 55, count: 12, thick: 3, trail: 40, zoom: 90, spin: 20, bounce: 100 } },
        Space: { wall: "night", rgb: true, layers: [{ look: "stars", color: "ice" }, { look: "tunnel", color: "violet" }, { look: "orbit", color: "cyan" }], gear: { wild: 70, glow: 90, count: 26, thick: 2, trail: 50, zoom: 130, spin: 40, bounce: 100 } },
        Fire: { wall: "sunset", rgb: false, layers: [{ look: "fireworks", color: "amber" }, { look: "bloom", color: "rose" }, { look: "off", color: "amber" }], gear: { wild: 100, glow: 100, count: 30, thick: 7, trail: 18, zoom: 150, spin: 80, bounce: 40 } },
        Ocean: { wall: "sea", rgb: false, layers: [{ look: "rain", color: "cyan" }, { look: "ribbon", color: "ice" }, { look: "rings", color: "violet" }], gear: { wild: 35, glow: 70, count: 20, thick: 3, trail: 45, zoom: 100, spin: 30, bounce: 90 } },
      };
      Object.keys(packs).forEach((name) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "btn";
        b.dataset.scene = name;
        b.dataset.wall = packs[name].wall;
        b.textContent = mu("scene_" + name.toLowerCase()) || name;
        b.setAttribute("aria-pressed", "false");
        b.addEventListener("click", () => {
          const pack = packs[name];
          state.wall = pack.wall;
          state.rgb = pack.rgb;
          state.layers = pack.layers.map((layer) => Object.assign({}, layer));
          state.look = state.layers[0].look;
          Object.assign(state.gear, pack.gear);
          ["zoom", "spin", "glow", "thick", "count", "trail", "bounce", "wild"].forEach((key) => {
            const slider = $("g-" + key);
            const read = $("n-" + key);
            if (slider && state.gear[key] != null) slider.value = String(state.gear[key]);
            if (read && state.gear[key] != null) read.textContent = String(state.gear[key]);
          });
          for (let i = 0; i < 3; i++) {
            const look = $("layer-" + i);
            const ink = $("ink-" + i);
            if (look) look.value = state.layers[i].look;
            if (ink) ink.value = state.layers[i].color;
          }
          if ($("wall")) $("wall").value = state.wall;
          saveSkin();
          paintLights();
          paintLooks();
          keep();
          markScene(b);
          $("lesson").textContent = name + " is on. Saved.";
        });
        scenes.appendChild(b);
      });
      function markScene(active) {
        scenes.querySelectorAll(".btn").forEach((btn) => {
          const on = btn === active;
          btn.classList.toggle("on", on);
          btn.setAttribute("aria-pressed", on ? "true" : "false");
          const label = mu("scene_" + String(btn.dataset.scene || "").toLowerCase()) || (btn.dataset.scene || "");
          btn.textContent = on ? label + " ✓" : label;
        });
      }
      const look0 = state.layers && state.layers[0] && state.layers[0].look;
      const pick = [...scenes.querySelectorAll(".btn")].find((btn) => {
        const pack = packs[btn.dataset.scene];
        return pack && pack.wall === (state.wall || "night") && pack.layers[0].look === look0;
      }) || scenes.querySelector('[data-wall="' + (state.wall || "night") + '"]') || scenes.querySelector(".btn");
      if (pick) markScene(pick);
    }
    ["zoom", "spin", "glow", "thick", "count", "trail", "bounce", "wild"].forEach((key) => {
      const slider = $("g-" + key);
      const read = $("n-" + key);
      if (!slider || !read) return;
      slider.value = String(state.gear[key]);
      read.textContent = slider.value;
      slider.addEventListener("input", () => {
        state.gear[key] = Number(slider.value);
        read.textContent = slider.value;
        try { localStorage.setItem("kulibert.viz.gear", JSON.stringify(state.gear)); } catch (err) { /* ignore */ }
        keep();
      });
    });
    const crazy = $("crazy-btn");
    if (crazy) {
      crazy.addEventListener("click", () => {
        const roll = (min, max) => min + Math.floor(Math.random() * (max - min + 1));
        state.gear.zoom = roll(70, 160);
        state.gear.spin = roll(0, 100);
        state.gear.glow = roll(60, 100);
        state.gear.thick = roll(2, 12);
        state.gear.count = roll(8, 32);
        state.gear.trail = roll(0, 55);
        state.gear.bounce = roll(20, 100);
        state.gear.wild = roll(40, 100);
        state.rgb = true;
        const walls = ["dusk", "sunset", "sea", "aurora", "candy"];
        state.wall = walls[roll(0, walls.length - 1)];
        ["zoom", "spin", "glow", "thick", "count", "trail", "bounce", "wild"].forEach((key) => {
          const slider = $("g-" + key);
          const read = $("n-" + key);
          if (slider) slider.value = String(state.gear[key]);
          if (read) read.textContent = String(state.gear[key]);
        });
        if ($("wall")) $("wall").value = state.wall;
        saveSkin();
        paintLights();
        keep();
        $("lesson").textContent = "Surprise me mixed the lights. Press it again for another mix.";
      });
    }
  }

  const TASKS = {
    five: "Hear the five notes",
    read: "Read each fingering",
    save: "Play the five notes into the song",
  };
  const ASSIGN_KEY = "kulibert.music.assign.v1";
  function whoApi() { return window.KulibertWho || null; }
  function cleanAlias(raw) {
    const api = whoApi();
    if (api && api.clean) return api.clean(raw);
    return String(raw || "").trim().slice(0, 16);
  }
  function signedKid() {
    const api = whoApi();
    if (!api || !api.read || !api.active || !api.active()) return null;
    const who = api.read();
    if (!who || !who.verified || String(who.code || "").length !== 5) return null;
    return who;
  }
  function mine() {
    const who = signedKid();
    if (!who) return null;
    return loadAssign().find((item) => item.code === who.code && !item.done) || null;
  }
  function paintPractice() {
    const box = $("practice");
    const line = $("practice-line");
    const who = signedKid();
    const code = $("who-code");
    if (code) code.textContent = who ? who.alias : "Sign in to keep a mark. You can still play.";
    const job = mine();
    if (!box || !line) return;
    if (!who || !job) { box.hidden = true; return; }
    box.hidden = false;
    line.textContent = who.alias + " · " + instName(job.instrument) + ". " + taskName(job.task) + ".";
  }
  function loadAssign() {
    try {
      const raw = JSON.parse(localStorage.getItem(ASSIGN_KEY) || "null");
      return raw && Array.isArray(raw.items) ? raw.items : [];
    } catch (err) {
      return [];
    }
  }
  function saveAssign(items) {
    try { localStorage.setItem(ASSIGN_KEY, JSON.stringify({ v: 1, items: items })); } catch (err) { /* still on screen */ }
  }
  function taskName(id) { return TASKS[id] || TASKS.five; }
  function instName(id) {
    const item = BAND.find((row) => row.id === id);
    return item ? item.name : "Trumpet";
  }
  function startPractice() {
    const job = mine();
    if (!job) return;
    state.band = job.instrument;
    const sound = { Woodwind: "winds", Brass: "brass", Strings: "strings", Keyboard: "winds", Percussion: "beep" };
    const inst = bandNow();
    if (inst && sound[inst.family]) state.orch = sound[inst.family];
    setMode("band");
    paintBand();
    if (job.task === "five") warmUp();
    else if (job.task === "save") $("lesson").textContent = "Tap each note. It is saved on a beat.";
    else $("lesson").textContent = "Tap each note. Read the fingering.";
  }
  function finishPractice() {
    const who = signedKid();
    if (!who) return;
    const items = loadAssign();
    const job = items.find((item) => item.code === who.code && !item.done);
    if (job) job.done = true;
    saveAssign(items);
    paintPractice();
    paintAssign();
    $("lesson").textContent = "Practice is marked done on this Chromebook.";
  }
  function paintAssign() {
    const list = $("assign-list");
    const inst = $("assign-inst");
    if (inst && !inst.childElementCount) {
      BAND.forEach((item) => {
        const opt = document.createElement("option");
        opt.value = item.id;
        opt.textContent = item.name;
        inst.appendChild(opt);
      });
      inst.value = "trumpet";
    }
    if (!list) return;
    list.innerHTML = "";
    loadAssign().forEach((item, index) => {
      const row = document.createElement("div");
      row.className = "assign-row";
      const text = document.createElement("span");
      text.textContent = item.alias + " · " + instName(item.instrument) + " · " + taskName(item.task) + (item.done ? " · done" : "");
      const drop = document.createElement("button");
      drop.type = "button";
      drop.className = "btn";
      drop.textContent = "Remove";
      drop.addEventListener("click", () => {
        const items = loadAssign();
        items.splice(index, 1);
        saveAssign(items);
        paintAssign();
        paintPractice();
      });
      row.appendChild(text);
      row.appendChild(drop);
      list.appendChild(row);
    });
  }
  const assignAdd = $("assign-add");
  if (assignAdd) assignAdd.addEventListener("click", () => {
    const who = signedKid();
    if (!who) {
      $("lesson").textContent = "Sign in first. The name comes from TechWorks. You can still play.";
      return;
    }
    const items = loadAssign().filter((item) => !(item.code === who.code && item.task === $("assign-task").value && !item.done));
    items.unshift({
      alias: who.alias,
      code: who.code,
      instrument: $("assign-inst").value || "trumpet",
      task: $("assign-task").value || "five",
      done: false,
    });
    saveAssign(items.slice(0, 40));
    paintAssign();
    paintPractice();
    $("lesson").textContent = who.alias + " has practice on this Chromebook.";
  });
  const assignFile = $("assign-file");
  if (assignFile) assignFile.addEventListener("click", () => {
    const blob = new Blob([JSON.stringify({ v: 1, kind: "kulibert.music.practice", items: loadAssign() }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "music-practice.json";
    a.click();
    URL.revokeObjectURL(url);
  });
  const assignOpen = $("assign-open");
  const assignIn = $("assign-file-in");
  if (assignOpen && assignIn) {
    assignOpen.addEventListener("click", () => assignIn.click());
    assignIn.addEventListener("change", () => {
      const file = assignIn.files && assignIn.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const raw = JSON.parse(String(reader.result || ""));
          const incoming = Array.isArray(raw.items) ? raw.items : [];
          const items = loadAssign();
          incoming.forEach((item) => {
            const alias = cleanAlias(item.alias);
            const code = String(item.code || "").toUpperCase().replace(/[^A-Z2-9]/g, "").slice(0, 5);
            if (!alias || code.length !== 5) return;
            if (items.some((row) => row.code === code && row.task === item.task && row.done === !!item.done)) return;
            items.unshift({
              alias: alias,
              code: code,
              instrument: BAND.some((row) => row.id === item.instrument) ? item.instrument : "trumpet",
              task: TASKS[item.task] ? item.task : "five",
              done: !!item.done,
            });
          });
          saveAssign(items.slice(0, 40));
          paintAssign();
          paintPractice();
          $("lesson").textContent = "Class file opened. Aliases only.";
        } catch (err) {
          $("lesson").textContent = "That file is not a class practice list.";
        }
      };
      reader.readAsText(file);
    });
  }
  const practiceGo = $("practice-go");
  if (practiceGo) practiceGo.addEventListener("click", startPractice);
  const practiceDone = $("practice-done");
  if (practiceDone) practiceDone.addEventListener("click", finishPractice);
  paintAssign();
  paintPractice();

  const lab = { freq: 261.63, shape: "smooth", partials: [true, false, false, false, false], len: 100, chord: "major" };
  const SHAPES = { smooth: "sine", bright: "sawtooth", buzz: "square", hollow: "triangle" };
  function waveAt(shape, p) {
    const x = (p % 1) * Math.PI * 2;
    if (shape === "buzz") return Math.sign(Math.sin(x)) || 0;
    if (shape === "bright") return ((p % 1) * 2) - 1;
    if (shape === "hollow") return Math.asin(Math.sin(x)) / (Math.PI / 2);
    return Math.sin(x);
  }
  function drawTeachWave() {
    const canvas = $("wave-view");
    if (!canvas) return;
    const g = canvas.getContext("2d");
    const w = canvas.width;
    const h = canvas.height;
    g.clearRect(0, 0, w, h);
    g.strokeStyle = "#8fb4c9";
    g.lineWidth = 2;
    const cycles = 100 / lab.len;
    g.beginPath();
    for (let x = 0; x < w; x++) {
      const p = (x / w) * 3 * cycles;
      let y = 0;
      let weight = 0;
      lab.partials.forEach((on, i) => {
        if (!on) return;
        const amp = 1 / (i + 1);
        y += waveAt(i === 0 ? lab.shape : "smooth", p * (i + 1)) * amp;
        weight += amp;
      });
      const py = h * 0.42 - (y / (weight || 1)) * (h * 0.28);
      if (x === 0) g.moveTo(x, py);
      else g.lineTo(x, py);
    }
    g.stroke();
    const span = Math.max(40, (lab.len / 100) * (w - 48));
    g.strokeStyle = "#22d3ee";
    g.lineWidth = 3;
    g.beginPath();
    g.moveTo(24, h - 28);
    g.lineTo(24 + span, h - 28);
    g.stroke();
  }
  function addPartials(freq, dur) {
    lab.partials.forEach((on, i) => {
      if (on && i > 0) tone(freq * (i + 1), dur, "sine", 0.06);
    });
  }
  function playLab(freq, dur) {
    arm();
    lab.freq = freq;
    drawTeachWave();
    tone(freq, dur || 0.45, SHAPES[lab.shape] || "sine", 0.22);
    addPartials(freq, dur || 0.45);
    const how = $("how");
    if (how && state.mode === "sound") how.textContent = "That line is the shape of the sound. It still moves if the sound is off.";
  }
  function playLabChord(arp) {
    arm();
    const steps = lab.chord === "minor" ? [0, 3, 7] : [0, 4, 7];
    steps.forEach((semi, i) => {
      const freq = lab.freq * Math.pow(2, semi / 12);
      window.setTimeout(() => {
        tone(freq, arp ? 0.3 : 0.7, SHAPES[lab.shape] || "sine", 0.16);
        addPartials(freq, arp ? 0.3 : 0.7);
      }, arp ? i * 200 : 0);
    });
    drawTeachWave();
    const how = $("how");
    if (how && state.mode === "sound") {
      how.textContent = arp
        ? "One by one. Those are the notes of the chord."
        : (lab.chord === "minor" ? "Minor. The middle note is one step lower." : "Major. Three notes at once.");
    }
  }
  function bootSound() {
    const notes = $("sound-notes");
    const shapes = $("sound-shapes");
    const partials = $("sound-partials");
    if (!notes || notes.childElementCount) return;
    [["C", 261.63], ["D", 293.66], ["E", 329.63], ["F", 349.23], ["G", 392.0], ["A", 440], ["B", 493.88], ["Hi C", 523.25]].forEach(([name, freq]) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "key";
      b.textContent = name;
      b.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        playLab(freq, 0.5);
      });
      notes.appendChild(b);
    });
    [["smooth", "Smooth"], ["bright", "Bright"], ["buzz", "Buzz"], ["hollow", "Hollow"]].forEach(([id, label]) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "btn" + (id === "smooth" ? " on" : "");
      b.textContent = label;
      b.addEventListener("click", () => {
        lab.shape = id;
        state.wave = SHAPES[id];
        shapes.querySelectorAll(".btn").forEach((btn) => btn.classList.toggle("on", btn === b));
        drawTeachWave();
        playLab(lab.freq, 0.4);
      });
      shapes.appendChild(b);
    });
    [1, 2, 3, 4, 5].forEach((n, i) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "btn" + (i === 0 ? " on" : "");
      b.textContent = String(n);
      b.addEventListener("click", () => {
        if (i === 0) return;
        lab.partials[i] = !lab.partials[i];
        b.classList.toggle("on", lab.partials[i]);
        drawTeachWave();
        playLab(lab.freq, 0.55);
      });
      partials.appendChild(b);
    });
    $("chord-major").addEventListener("click", () => {
      lab.chord = "major";
      $("chord-major").classList.add("on");
      $("chord-minor").classList.remove("on");
      playLabChord(false);
    });
    $("chord-minor").addEventListener("click", () => {
      lab.chord = "minor";
      $("chord-minor").classList.add("on");
      $("chord-major").classList.remove("on");
      playLabChord(false);
    });
    $("chord-arp").addEventListener("click", () => playLabChord(true));
    const slider = $("string-len");
    const read = $("string-read");
    slider.addEventListener("input", () => {
      lab.len = Number(slider.value);
      read.textContent = lab.len > 70 ? "Long" : lab.len > 40 ? "Medium" : "Short";
      drawTeachWave();
    });
    $("string-hear").addEventListener("click", () => playLab(261.63 * (100 / lab.len), 0.6));
    drawTeachWave();
  }
  bootSound();

  window.MuPaintLive = function () {
    paintMute();
    paintRec();
    const playWord = $("play-word");
    if (playWord) playWord.textContent = playWordText(!!state.playing);
    const playBtn = $("play-btn");
    if (playBtn) playBtn.setAttribute("aria-label", playWordText(!!state.playing));
    if ($("drums")) renderDrums();
    paintKeypad();
    document.querySelectorAll("#style-row [data-pack]").forEach((btn) => {
      const map = { Trap: "style_trap", "Lo-fi": "style_lofi", Rock: "style_rock", Marching: "style_marching" };
      const key = map[btn.dataset.pack];
      if (!key) return;
      const word = mu(key);
      if (word) btn.textContent = word;
    });
    document.querySelectorAll("#scenes [data-scene]").forEach((btn) => {
      const label = mu("scene_" + String(btn.dataset.scene || "").toLowerCase());
      if (!label) return;
      btn.textContent = btn.classList.contains("on") ? label + " ✓" : label;
    });
    paintAlong();
    if ($("looks")) paintLooks();
    if ($("fx")) paintFx();
    if ($("waves")) paintWaves();
    const blend = $("blend-read");
    if (blend) blend.textContent = blendWord(state.blend);
    paintSongBar();
    paintSongShelf();
    if (!state.playing && !document.body.classList.contains("is-home")) sayHow(state.mode);
    const clearBtn = $("clear-btn");
    if (clearBtn && Date.now() > clearArm) clearBtn.textContent = mu("clearDrums") || clearBtn.textContent;
  };
  if (window.MuI18n && window.MuI18n.paint) window.MuI18n.paint();

  const canvas = $("viz");
  if (window.KulibertStage) {
    stageApi = window.KulibertStage.mount(canvas, () => ({
      playing: state.playing,
      look: state.look,
      layers: state.layers,
      rgb: state.rgb,
      wall: state.wall,
      gear: Object.assign({}, state.gear),
      bins: state.bins,
      kick: state.kick,
      snare: state.snare,
      playhead: state.step,
    }));
  }
})();
