(() => {
  const Song = window.KulibertSong;
  const KEY = "kulibert.music.now";
  const LEARN = ["C", "D", "E", "G", "A"];
  const ROWS = [
    ["kick", "Kick"],
    ["snare", "Snare"],
    ["hat", "Hat"],
    ["clap", "Clap"],
  ];
  const LOOKS = [
    ["bars", "Bars"],
    ["ribbon", "Ribbon"],
    ["rings", "Rings"],
    ["rain", "Rain"],
  ];
  if (!Song) return;
  const $ = (id) => document.getElementById(id);

  function blankDrums() {
    const drums = {};
    ROWS.forEach(([id]) => {
      drums[id] = Array(8).fill(false);
    });
    drums.kick[0] = true;
    drums.snare[4] = true;
    return drums;
  }

  const state = {
    song: Song.starter(),
    drums: blankDrums(),
    look: "ribbon",
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
    step: -1,
    timer: 0,
    bins: new Uint8Array(64),
    kick: false,
    snare: false,
    mode: "notes",
    recording: false,
    armBeats: 0,
    turn: "",
    turnLeft: 0,
    held: {},
    lastStamp: 0,
    writeStep: 0,
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
        if (Array.isArray(saved.drums[id])) state.drums[id] = saved.drums[id].slice(0, 8);
      });
    }
    if (saved.look) state.look = saved.look;
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
      trem.connect(dry);
      dry.connect(master);
      filter.connect(delayNode);
      delayNode.connect(fb);
      fb.connect(delayNode);
      delayNode.connect(wet);
      wet.connect(master);
      applyFx();
    }
    if (ctx.state === "suspended") ctx.resume();
    master.gain.value = state.muted ? 0 : 0.75;
    applyFx();
  }
  function tone(freq, dur, type, level) {
    if (!ctx || state.muted) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type || state.wave || "triangle";
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    const length = dur || state.noteLen || 0.28;
    gain.gain.setValueAtTime(level || 0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + length);
    osc.connect(gain);
    gain.connect(bus);
    osc.start();
    osc.stop(ctx.currentTime + length + 0.02);
  }
  function noise(dur, level) {
    if (!ctx || state.muted) return;
    const buffer = ctx.createBuffer(1, Math.max(1, ctx.sampleRate * dur), ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    const gain = ctx.createGain();
    src.buffer = buffer;
    gain.gain.setValueAtTime(level, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    src.connect(gain);
    gain.connect(bus);
    src.start();
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
    const beat = Song.toBeat(state.song);
    ROWS.forEach(([id]) => { beat.steps[id] = state.drums[id].concat(Array(8).fill(false)); });
    if (Song.writeBridge) Song.writeBridge("music", state.song, beat);
  }

  function renderStaff() {
    const host = $("staff");
    host.innerHTML = "";
    const abc = Song.toAbc(state.song);
    if (!window.ABCJS || typeof window.ABCJS.renderAbc !== "function") {
      host.textContent = abc;
      return;
    }
    try {
      window.ABCJS.renderAbc(host, abc, {
        responsive: "resize",
        add_classes: true,
        staffwidth: Math.max(260, host.clientWidth - 12),
      });
    } catch (err) {
      host.textContent = abc;
    }
    const svg = host.querySelector("svg");
    if (svg) svg.addEventListener("pointerdown", placeNote);
  }

  function placeNote(e) {
    const host = $("staff");
    const evs = Song.events(state.song).slice(0, 8);
    const svg = host.querySelector("svg");
    if (!svg || !evs.length) return;
    const marks = [...host.querySelectorAll(".abcjs-note, .abcjs-rest")];
    let index = 0;
    if (marks.length >= evs.length) {
      let best = Infinity;
      marks.forEach((node, i) => {
        if (i >= evs.length) return;
        const rect = node.getBoundingClientRect();
        const dx = Math.abs(e.clientX - (rect.left + rect.width / 2));
        if (dx < best) { best = dx; index = i; }
      });
    }
    const ev = evs[index];
    const box = (host.querySelector(".abcjs-staff") || svg).getBoundingClientRect();
    const top = box.top - box.height * 0.15;
    const span = Math.max(1, box.height * 1.5);
    let pi = Math.round((1 - (e.clientY - top) / span) * (LEARN.length - 1));
    pi = Math.max(0, Math.min(LEARN.length - 1, pi));
    const pitch = LEARN[pi];
    Song.setBeat(state.song, ev.measure, ev.beat, ev.pitch === pitch ? null : pitch);
    keep();
    renderStaff();
    $("lesson").textContent = "Higher on the staff is a higher note. Tap the same spot for a rest.";
  }

  function renderDrums() {
    const box = $("drums");
    box.innerHTML = "";
    ROWS.forEach(([id, label]) => {
      const row = document.createElement("div");
      row.className = "drum-row";
      const name = document.createElement("b");
      name.textContent = label;
      row.appendChild(name);
      for (let i = 0; i < 8; i++) {
        const cell = document.createElement("button");
        cell.type = "button";
        cell.className = "cell" + (state.drums[id][i] ? " on" : "") + (state.step === i ? " now" : "");
        cell.setAttribute("aria-label", label + " beat " + (i + 1));
        cell.dataset.track = id;
        cell.dataset.step = String(i);
        cell.addEventListener("click", () => {
          state.drums[id][i] = !state.drums[id][i];
          keep();
          renderDrums();
          if (id === "kick" && i === 0 && state.drums.kick[0]) {
            $("lesson").textContent = "A kick on beat 1 is the pulse. The picture jumps with it.";
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
      b.textContent = label;
      b.addEventListener("click", () => {
        state.look = id;
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
      b.textContent = fx.name;
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
        $("lesson").textContent = fx.name + " is on. The pads use it. Move a synth slider to tweak it.";
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
      b.textContent = label;
      b.addEventListener("click", () => {
        state.wave = id;
        paintWaves();
        keep();
        arm();
        tone(392, state.noteLen, state.wave, 0.2);
        $("lesson").textContent = label + " is the note shape. The drums stay drums.";
      });
      box.appendChild(b);
    });
  }

  function paintRec() {
    const btn = $("rec-btn");
    if (!btn) return;
    btn.classList.toggle("on", state.recording);
    btn.textContent = state.recording ? "Recording" : "Record";
    btn.setAttribute("aria-pressed", String(state.recording));
  }
  function canStamp() {
    return state.recording && state.armBeats === 0 && state.playing && state.step >= 0;
  }
  function writeHit(id, step) {
    if (step < 0 || step > 7) return;
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
  }
  function placeStep() {
    if (state.armBeats > 0) return -1;
    if (state.playing && state.step >= 0) return state.step;
    const now = Date.now();
    if (now - state.lastStamp < 400) return state.writeStep;
    state.writeStep = state.step < 0 ? 0 : (state.step + 1) % 8;
    state.step = state.writeStep;
    state.lastStamp = now;
    paintCount();
    return state.writeStep;
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
    if (!state.muted) {
      if (id === "kick") tone(140, 0.18, "sine", 0.9);
      else if (id === "snare" || id === "clap") noise(0.12, 0.35);
      else if (id === "hat") noise(0.04, 0.18);
      else if (FREQ[id]) tone(FREQ[id], state.noteLen, state.wave, 0.24);
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

  function paintCount() {
    const box = $("count");
    if (!box) return;
    if (!box.children.length) {
      for (let i = 0; i < 8; i++) {
        const mark = document.createElement("i");
        mark.textContent = String(i + 1);
        box.appendChild(mark);
      }
    }
    [...box.children].forEach((el, i) => el.classList.toggle("on", i === state.step));
  }
  function pulse(step) {
    state.step = step;
    paintCount();
    state.kick = !!state.drums.kick[step];
    state.snare = !!state.drums.snare[step];
    const evs = Song.events(state.song);
    const ev = evs[step];
    const bins = state.bins;
    for (let i = 0; i < bins.length; i++) bins[i] = 24;
    if (state.kick) bins[2] = 230;
    if (state.snare) bins[10] = 180;
    if (state.drums.hat[step]) bins[40] = 140;
    if (ev && ev.tone) bins[22] = 200;
    let counting = false;
    if (state.armBeats > 0) {
      counting = true;
      const count = 5 - state.armBeats;
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
    if (!counting) $("now-line").textContent = lead + off + "Beat " + (step + 1) + ". Now: " + namesAt(step).join(" and ") + ".";
    if (state.playing && step === 0 && !state.recording && !state.turn) {
      $("lesson").textContent = "Beat 1 is the strong beat. Tap a pad on the flash.";
    }
    document.querySelectorAll("#staff .abcjs-note, #staff .abcjs-rest").forEach((node, i) => {
      node.classList.toggle("now", i === step);
    });
    document.querySelectorAll(".cell").forEach((cell) => cell.classList.remove("now"));
    document.querySelectorAll(".drum-row").forEach((row) => {
      const cells = row.querySelectorAll(".cell");
      if (cells[step]) cells[step].classList.add("now");
    });
    if (state.muted) return;
    if (state.kick) tone(140, 0.18, "sine", 0.9);
    if (state.snare || state.drums.clap[step]) noise(0.12, 0.35);
    if (state.drums.hat[step]) noise(0.04, 0.18);
    if (ev && ev.tone) {
      const freq = { C4: 261.6, D4: 293.7, E4: 329.6, F4: 349.2, G4: 392, A4: 440, B4: 493.9, C5: 523.3 }[ev.tone];
      if (freq) tone(freq, state.noteLen, state.wave, 0.22);
    }
  }

  function play() {
    arm();
    state.playing = true;
    $("play-btn").classList.add("on");
    $("play-btn").setAttribute("aria-label", "Stop");
    let step = 0;
    pulse(0);
    state.timer = window.setInterval(() => {
      step = (step + 1) % 8;
      pulse(step);
    }, Math.round(60000 / Math.max(70, state.song.bpm || 96)));
  }
  function stop() {
    state.playing = false;
    window.clearInterval(state.timer);
    $("play-btn").classList.remove("on");
    $("play-btn").setAttribute("aria-label", "Play");
    state.recording = false;
    state.armBeats = 0;
    state.turn = "";
    state.held = {};
    paintRec();
    $("now-line").textContent = "Press Play. Read the word. Sound can stay off.";
  }

  function setMode(mode) {
    state.mode = mode;
    $("work").classList.toggle("is-notes", mode === "notes");
    $("work").classList.toggle("is-drums", mode === "drums");
    $("mode-notes").classList.toggle("on", mode === "notes");
    $("mode-drums").classList.toggle("on", mode === "drums");
    $("mode-notes").setAttribute("aria-pressed", String(mode === "notes"));
    $("mode-drums").setAttribute("aria-pressed", String(mode === "drums"));
  }

  $("play-btn").addEventListener("click", () => {
    if (state.playing) stop();
    else play();
  });
  $("mute-btn").addEventListener("click", () => {
    state.muted = !state.muted;
    $("mute-btn").textContent = state.muted ? "Muted" : "Sound on";
    $("mute-btn").setAttribute("aria-pressed", String(state.muted));
    if (master) master.gain.value = state.muted ? 0 : 0.8;
    $("lesson").textContent = state.muted ? "Sound is off. The word and the picture still move." : "Sound is on. The word still names the beat.";
  });
  $("turn-btn").addEventListener("click", () => {
    state.turn = "listen";
    state.turnLeft = 8;
    state.recording = false;
    state.armBeats = 0;
    paintRec();
    if (!state.playing) play();
    $("lesson").textContent = "Listen once. Then it says Your turn, and your taps stay in the song.";
  });
  $("rec-btn").addEventListener("click", () => {
    if (state.recording) {
      state.recording = false;
      state.armBeats = 0;
      state.turn = "";
      paintRec();
      $("lesson").textContent = "Record is off. Taps still play. They do not write.";
      return;
    }
    state.turn = "";
    state.recording = true;
    state.armBeats = 4;
    paintRec();
    if (!state.playing) play();
    $("lesson").textContent = "Count four. Then tap the pads with the flash.";
  });
  let clearArm = 0;
  let drumUndo = null;
  $("clear-btn").addEventListener("click", () => {
    if (Date.now() > clearArm) {
      clearArm = Date.now() + 5000;
      $("clear-btn").textContent = "Tap again to clear";
      $("lesson").textContent = "Tap clear one more time. Bring it back puts the drums back.";
      return;
    }
    clearArm = 0;
    drumUndo = JSON.parse(JSON.stringify(state.drums));
    ROWS.forEach(([id]) => { state.drums[id] = Array(8).fill(false); });
    keep();
    renderDrums();
    $("clear-btn").textContent = "Clear the drums";
    $("undo-clear").hidden = false;
    $("lesson").textContent = "The drums are clear. Bring it back is under the beat.";
  });
  $("undo-clear").addEventListener("click", () => {
    if (!drumUndo) return;
    state.drums = drumUndo;
    drumUndo = null;
    $("undo-clear").hidden = true;
    keep();
    renderDrums();
    $("lesson").textContent = "The drums are back. Saved.";
  });
  $("mode-notes").addEventListener("click", () => setMode("notes"));
  $("mode-drums").addEventListener("click", () => setMode("drums"));
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
    const blob = new Blob([Song.serialize(state.song)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "class-song.bertysong.json";
    a.click();
    URL.revokeObjectURL(url);
  });

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
  setMode("notes");
  buildKit();
  renderStaff();
  renderDrums();
  paintLooks();
  paintFx();
  paintWaves();
  syncSynth();
  paintCount();
  if (state.restored) $("lesson").textContent = "Brought back the last song we could open.";
  keep();

  const canvas = $("viz");
  if (window.KulibertStage) {
    window.KulibertStage.mount(canvas, () => ({
      playing: state.playing,
      look: state.look,
      bins: state.bins,
      kick: state.kick,
      snare: state.snare,
      playhead: state.step,
    }));
  }
})();
