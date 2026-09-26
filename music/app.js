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
    playing: false,
    muted: false,
    step: -1,
    timer: 0,
    bins: new Uint8Array(64),
    kick: false,
    snare: false,
    mode: "notes",
  };

  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || "null");
    const raw = saved && (saved.song || saved);
    const song = raw && Song.parse(typeof raw === "string" ? raw : JSON.stringify(raw));
    if (song) state.song = song;
    if (saved && saved.drums) {
      ROWS.forEach(([id]) => {
        if (Array.isArray(saved.drums[id])) state.drums[id] = saved.drums[id].slice(0, 8);
      });
    }
    if (saved && saved.look) state.look = saved.look;
    if (saved && saved.bpm) state.song.bpm = saved.bpm;
  } catch (err) { /* a fresh song is fine */ }

  let ctx = null;
  let master = null;
  function arm() {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    if (!ctx) {
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.8;
      master.connect(ctx.destination);
    }
    if (ctx.state === "suspended") ctx.resume();
    master.gain.value = state.muted ? 0 : 0.8;
  }
  function tone(freq, dur, type, level) {
    if (!ctx || state.muted) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type || "triangle";
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(level || 0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    osc.connect(gain);
    gain.connect(master);
    osc.start();
    osc.stop(ctx.currentTime + dur);
  }
  function noise(dur, level) {
    if (!ctx || state.muted) return;
    const buffer = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    const gain = ctx.createGain();
    src.buffer = buffer;
    gain.gain.setValueAtTime(level, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    src.connect(gain);
    gain.connect(master);
    src.start();
  }

  function keep() {
    try {
      localStorage.setItem(KEY, JSON.stringify({
        song: JSON.parse(Song.serialize(state.song)),
        drums: state.drums,
        look: state.look,
        bpm: state.song.bpm,
      }));
    } catch (err) { /* the file save still works */ }
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

  function namesAt(step) {
    const evs = Song.events(state.song);
    const ev = evs[step];
    const names = [];
    ROWS.forEach(([id, label]) => { if (state.drums[id][step]) names.push(label); });
    if (ev && ev.label) names.push(ev.label);
    if (!names.length) names.push("Rest");
    return names;
  }

  function pulse(step) {
    state.step = step;
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
    const off = state.muted ? "Sound is off. " : "";
    $("now-line").textContent = off + "Beat " + (step + 1) + ". Now: " + namesAt(step).join(" and ") + ".";
    if (state.playing && step === 0) $("lesson").textContent = "Beat 1 is the strong beat. Count along. Sound can stay off.";
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
      if (freq) tone(freq, 0.28, "triangle", 0.22);
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
  $("tempo").addEventListener("input", (e) => {
    state.song.bpm = Number(e.target.value);
    $("tempo-read").textContent = String(state.song.bpm);
    keep();
    if (state.playing) { stop(); play(); }
    $("lesson").textContent = "Tempo is the speed. The count is still 1, 2, 3, 4.";
  });
  $("save-btn").addEventListener("click", () => {
    const blob = new Blob([Song.serialize(state.song)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "class-song.bertysong.json";
    a.click();
    URL.revokeObjectURL(url);
  });

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
  renderStaff();
  renderDrums();
  paintLooks();
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
