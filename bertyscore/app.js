(() => {
  const Song = window.KulibertSong;
  const CHIP = "BS 0.2.9";
  const HOW_KEY = "kulibert.bertyscore.howto";
  const SONG_KEY = "kulibert.bertyscore.now";
  if (!Song) return;

  const $ = (id) => document.getElementById(id);
  const steps = [
    ["Hear it", "Press Play. The word Now names the note. Mute is fine — the light still moves."],
    ["Change it", "Tap the staff where the note should sit. Higher on the lines is a higher note. Tap that note again for a rest."],
    ["Send it", "It saves on this Chromebook. Export keeps a file. Beats and Lights use the same song."],
  ];

  const params = new URLSearchParams(window.location.search);
  let arrival = "";
  let opening = Song.starter();
  try {
    const saved = Song.parse(localStorage.getItem(SONG_KEY) || "");
    if (saved) opening = saved;
  } catch (err) { /* a fresh score is fine */ }
  if (params.get("from") === "bridge" && Song.readBridge) {
    const bridge = Song.readBridge();
    if (bridge && bridge.song) {
      opening = bridge.song;
      arrival = bridge.from === "bertybeatz" || bridge.from === "visualizer"
        ? "Pitched notes came from the beat. Drums stay in Beats."
        : "Brought the song back.";
    }
  }
  const state = {
    song: opening,
    pitch: "E",
    focus: 0,
    beat: 0,
    playing: false,
    muted: false,
    how: 0,
    heard: false,
    timer: 0,
  };
  let synth = null;
  let reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function status(text) {
    $("status").textContent = text || "";
  }

  function sounding() {
    return Song.events(state.song).filter((ev) => ev.sound);
  }

  function renderStaff() {
    const host = $("staff");
    const abc = Song.toAbc(state.song);
    host.innerHTML = "";
    if (!window.ABCJS || typeof window.ABCJS.renderAbc !== "function") {
      host.textContent = abc;
      return;
    }
    try {
      window.ABCJS.renderAbc(host, abc, {
        responsive: "resize",
        add_classes: true,
        paddingleft: 4,
        paddingright: 4,
        staffwidth: Math.max(280, host.clientWidth - 8),
      });
    } catch (err) {
      host.textContent = abc;
      return;
    }
    const notes = host.querySelectorAll(".abcjs-note");
    const map = sounding();
    notes.forEach((node, i) => {
      const ev = map[i];
      if (!ev) return;
      node.tabIndex = 0;
      node.setAttribute("role", "button");
      node.setAttribute("aria-label", ev.label + " in measure " + (ev.measure + 1) + ". Tap the staff to move it.");
    });
    const svg = host.querySelector("svg");
    if (svg) svg.addEventListener("click", placeFromStaff);
  }

  function placeFromStaff(e) {
    const host = $("staff");
    const svg = host.querySelector("svg");
    const evs = Song.events(state.song);
    if (!svg || !evs.length) return;
    const marks = [...host.querySelectorAll(".abcjs-note, .abcjs-rest")];
    let index = 0;
    if (marks.length === evs.length) {
      let best = Infinity;
      marks.forEach((node, i) => {
        const rect = node.getBoundingClientRect();
        const dx = Math.abs(e.clientX - (rect.left + rect.width / 2));
        if (dx < best) {
          best = dx;
          index = i;
        }
      });
    } else {
      const box = svg.getBoundingClientRect();
      index = Math.round(((e.clientX - box.left) / Math.max(1, box.width)) * (evs.length - 1));
      index = Math.max(0, Math.min(evs.length - 1, index));
    }
    const ev = evs[index];
    const staff = host.querySelector(".abcjs-staff") || svg;
    const box = staff.getBoundingClientRect();
    const pitches = Song.PITCHES.map((p) => p.id);
    const top = box.top - box.height * 0.22;
    const bottom = box.bottom + box.height * 0.42;
    let pi = Math.round((1 - (e.clientY - top) / Math.max(1, bottom - top)) * (pitches.length - 1));
    pi = Math.max(0, Math.min(pitches.length - 1, pi));
    const pitch = pitches[pi];
    const next = ev.pitch === pitch ? null : pitch;
    Song.setBeat(state.song, ev.measure, ev.beat, next);
    state.focus = ev.measure;
    state.beat = ev.beat;
    state.pitch = pitch;
    const info = Song.pitchById(next);
    changed(info ? "Wrote " + info.label + " on the staff." : "That beat is a rest.");
  }

  function renderPitches() {
    const box = $("pitches");
    box.innerHTML = "";
    Song.PITCHES.forEach((p) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "btn" + (p.id === state.pitch ? " on" : "");
      b.textContent = p.label;
      b.setAttribute("aria-pressed", String(p.id === state.pitch));
      b.addEventListener("click", () => {
        state.pitch = p.id;
        renderPitches();
      });
      box.appendChild(b);
    });
  }

  function renderBeats() {
    const song = state.song;
    if (state.focus >= song.measures.length) state.focus = song.measures.length - 1;
    if (state.focus < 0) state.focus = 0;
    const measure = song.measures[state.focus];
    $("focus-name").textContent = "Measure " + measure.label;
    const box = $("beats");
    box.innerHTML = "";
    measure.beats.forEach((pitch, bi) => {
      const b = document.createElement("button");
      b.type = "button";
      const info = Song.pitchById(pitch);
      const now = state.playing && state._now && state._now.measure === state.focus && state._now.beat === bi;
      b.className = "beat" + (pitch ? " on" : "") + (now ? " now" : "");
      b.textContent = info ? info.label : "rest";
      b.setAttribute("aria-label", "Beat " + (bi + 1) + (info ? " " + info.label : " rest"));
      b.addEventListener("click", () => {
        const next = pitch === state.pitch ? null : state.pitch;
        Song.setBeat(song, state.focus, bi, next);
        state.beat = bi;
        const info = Song.pitchById(next);
        changed(info ? "You placed " + info.label + ". Press Play." : "That beat is a rest.");
      });
      box.appendChild(b);
    });
  }

  function renderSequence() {
    const box = $("sequence");
    box.innerHTML = "";
    state.song.measures.forEach((measure, mi) => {
      const card = document.createElement("article");
      const now = state.playing && state._now && state._now.measure === mi;
      card.className = "card" + (mi === state.focus ? " on" : "") + (now ? " now" : "");
      const head = document.createElement("header");
      const title = document.createElement("strong");
      title.textContent = "Measure " + measure.label;
      const pick = document.createElement("button");
      pick.type = "button";
      pick.className = "btn" + (mi === state.focus ? " on" : "");
      pick.textContent = mi === state.focus ? "Editing" : "Edit";
      pick.addEventListener("click", () => {
        state.focus = mi;
        renderBeats();
        renderSequence();
      });
      head.append(title, pick);
      const pips = document.createElement("div");
      pips.className = "pips";
      measure.beats.forEach((pitch, bi) => {
        const pip = document.createElement("button");
        pip.type = "button";
        const info = Song.pitchById(pitch);
        const lit = state.playing && state._now && state._now.measure === mi && state._now.beat === bi;
        pip.className = "pip" + (pitch ? " on" : "") + (lit ? " now" : "");
        pip.textContent = info ? info.label : "·";
        pip.setAttribute("aria-label", "Measure " + measure.label + " beat " + (bi + 1));
        pip.addEventListener("click", () => {
          Song.setBeat(state.song, mi, bi, pitch ? null : state.pitch);
          state.focus = mi;
          const placed = Song.pitchById(pitch ? null : state.pitch);
          changed(placed ? "You placed " + placed.label + ". Press Play." : "That beat is a rest.");
        });
        pips.appendChild(pip);
      });
      const actions = document.createElement("div");
      actions.className = "seq-actions";
      const earlier = document.createElement("button");
      earlier.type = "button";
      earlier.className = "btn";
      earlier.textContent = "Earlier";
      earlier.disabled = mi === 0;
      earlier.addEventListener("click", () => {
        Song.moveMeasure(state.song, mi, -1);
        state.focus = mi - 1;
        changed("Order updated the score.");
      });
      const later = document.createElement("button");
      later.type = "button";
      later.className = "btn";
      later.textContent = "Later";
      later.disabled = mi === state.song.measures.length - 1;
      later.addEventListener("click", () => {
        Song.moveMeasure(state.song, mi, 1);
        state.focus = mi + 1;
        changed("Order updated the score.");
      });
      const copy = document.createElement("button");
      copy.type = "button";
      copy.className = "btn";
      copy.textContent = "Copy";
      copy.addEventListener("click", () => {
        Song.duplicateMeasure(state.song, mi);
        state.focus = Math.min(state.song.measures.length - 1, mi + 1);
        changed("Copied a measure.");
      });
      const drop = document.createElement("button");
      drop.type = "button";
      drop.className = "btn";
      drop.textContent = "Remove";
      drop.disabled = state.song.measures.length < 2;
      drop.addEventListener("click", () => {
        Song.removeMeasure(state.song, mi);
        state.focus = Math.max(0, mi - 1);
        changed("Removed a measure.");
      });
      actions.append(earlier, later, copy, drop);
      card.append(head, pips, actions);
      box.appendChild(card);
    });
  }

  function writeNow(ev) {
    const el = $("now-line");
    if (!el) return;
    const off = state.muted ? "Sound is off. " : "";
    if (!state.playing) {
      el.textContent = "Press Play. The notes light up. Sound can stay off.";
      return;
    }
    if (!ev || !ev.pitch) {
      if (state.playing) state.sawRest = true;
      el.textContent = off + "Rest.";
      return;
    }
    state.sawNote = true;
    el.textContent = off + "Now: " + (ev.label || ev.pitch) + ".";
  }

  function showNow(ev) {
    state._now = ev;
    writeNow(ev);
    const notes = document.querySelectorAll("#staff .abcjs-note");
    notes.forEach((node, i) => node.classList.toggle("is-now", Boolean(ev) && ev.soundIndex === i));
    document.querySelectorAll(".beat, .pip, .card").forEach((node) => node.classList.remove("now"));
    if (!ev) return;
    const beat = $("beats").children[ev.beat];
    if (beat && ev.measure === state.focus) beat.classList.add("now");
    const card = $("sequence").children[ev.measure];
    if (card) {
      card.classList.add("now");
      const pip = card.querySelectorAll(".pip")[ev.beat];
      if (pip) pip.classList.add("now");
    }
  }

  function stopClock() {
    window.clearInterval(state.timer);
    state.timer = 0;
    if (window.Tone && window.Tone.Transport) {
      window.Tone.Transport.pause();
      window.Tone.Transport.cancel(0);
    }
  }

  function armTone() {
    const Tone = window.Tone;
    Tone.Transport.cancel(0);
    Tone.Transport.bpm.value = state.song.bpm;
    const beat = 60 / state.song.bpm;
    const evs = Song.events(state.song);
    evs.forEach((ev, i) => {
      Tone.Transport.schedule((time) => {
        if (ev.tone && !state.muted && synth) synth.triggerAttackRelease(ev.tone, "8n", time, 0.75);
      }, i * beat);
    });
    Tone.Transport.loop = true;
    Tone.Transport.loopStart = 0;
    Tone.Transport.loopEnd = Math.max(beat, evs.length * beat);
  }

  function armFallback() {
    const evs = Song.events(state.song);
    const beat = 60000 / state.song.bpm;
    window.clearInterval(state.timer);
    if (evs.length) showNow(evs[0]);
    let i = 1;
    state.timer = window.setInterval(() => {
      if (!state.playing) return;
      showNow(evs[i % evs.length]);
      i += 1;
    }, reduce ? beat : beat);
  }

  function celebrate() {
    if (state.heard) return;
    state.heard = true;
    status("That's your song.");
    const wrap = document.querySelector(".staff-wrap");
    if (!wrap) return;
    wrap.classList.add("did-it");
    window.setTimeout(() => wrap.classList.remove("did-it"), 1600);
  }

  async function play() {
    state.playing = true;
    paintPlay();
    armFallback();
    if (window.Tone) {
      try {
        await window.Tone.start();
        if (!synth) {
          synth = new window.Tone.PolySynth(window.Tone.Synth, {
            oscillator: { type: "triangle" },
            envelope: { attack: 0.01, decay: 0.12, sustain: 0.15, release: 0.18 },
          }).toDestination();
          synth.volume.value = -8;
        }
        armTone();
        if (window.Tone.Transport.state !== "started") window.Tone.Transport.start();
        armFallback();
      } catch (err) {
        status("Sound needs another tap. The score still lights up.");
      }
    }
    celebrate();
  }

  function stop() {
    state.playing = false;
    stopClock();
    showNow(null);
    paintPlay();
  }

  function paintPlay() {
    const btn = $("play-btn");
    btn.classList.toggle("is-on", state.playing);
    btn.setAttribute("aria-label", state.playing ? "Stop" : "Play");
  }

  function changed(message) {
    keep();
    renderStaff();
    renderBeats();
    renderSequence();
    if (state.playing && window.Tone && synth) armTone();
    else if (state.playing) armFallback();
    status(message);
  }

  function keep() {
    try { localStorage.setItem(SONG_KEY, Song.serialize(state.song)); } catch (err) { /* the file export still works */ }
    if (Song.writeBridge) Song.writeBridge("bertyscore", state.song, Song.toBeat(state.song));
  }

  function fileSlug() {
    const alias = state.song.alias.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    return (alias || "score") + ".bertysong.json";
  }

  function save() {
    const blob = new Blob([Song.serialize(state.song)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileSlug();
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1500);
    status("Exported " + a.download + ". It is already saved on this Chromebook.");
  }

  function paintHow() {
    const step = steps[state.how];
    $("how-step").textContent = String(state.how + 1);
    $("how-title").textContent = step[0];
    $("how-body").textContent = step[1];
    $("how-skip").hidden = state.how < 1;
    $("how-next").textContent = state.how === steps.length - 1 ? "Done" : "Next";
  }

  function finishHow() {
    try { localStorage.setItem(HOW_KEY, "1"); } catch (err) { /* ignore */ }
    const dialog = $("howto");
    if (dialog.open) dialog.close();
  }

  $("play-btn").addEventListener("click", () => {
    if (state.playing) stop();
    else play();
  });
  $("mute-btn").addEventListener("click", () => {
    state.muted = !state.muted;
    $("mute-btn").textContent = state.muted ? "Muted" : "Sound on";
    $("mute-btn").setAttribute("aria-pressed", String(state.muted));
    status(state.muted ? "Sound is off. The score still lights up." : "Sound is on.");
    writeNow(state._now);
  });
  function paintAlias() {
    const btn = $("alias");
    if (btn) btn.textContent = state.song.alias || "Tap a title";
  }
  $("alias").addEventListener("click", () => {
    const box = $("title-lists");
    const Titles = window.KulibertTitles;
    if (!box || !Titles) return;
    box.hidden = false;
    document.body.classList.add("menu-open");
    $("alias").setAttribute("aria-expanded", "true");
    const starting = Titles.partsOf(state.song.alias) ? state.song.alias : Titles.starterTitle();
    state.song.alias = starting;
    paintAlias();
    Titles.mount(box, starting, (title) => {
      state.song.alias = title;
      paintAlias();
      keep();
      renderStaff();
    });
    renderStaff();
  });
  $("tempo").addEventListener("input", (e) => {
    state.song.bpm = Number(e.target.value);
    state.song.tempo = state.song.bpm;
    $("tempo-read").textContent = String(state.song.bpm);
    keep();
    if (state.playing && window.Tone && synth) armTone();
  });
  $("save-btn").addEventListener("click", save);
  $("import-btn").addEventListener("click", () => $("import-file").click());
  $("import-file").addEventListener("change", () => {
    const file = $("import-file").files && $("import-file").files[0];
    $("import-file").value = "";
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const next = Song.parse(String(reader.result || ""));
      if (!next) {
        status("That file is not a BertyScore save. This score stayed put.");
        return;
      }
      stop();
      state.song = next;
      state.focus = 0;
      paintAlias();
      $("tempo").value = String(next.bpm);
      $("tempo-read").textContent = String(next.bpm);
      renderStaff();
      renderBeats();
      renderSequence();
      status(next.alias ? "Imported " + next.alias + "." : "Imported. Pick a class title.");
    };
    reader.readAsText(file);
  });
  $("add-measure").addEventListener("click", () => {
    const before = state.song.measures.length;
    Song.addMeasure(state.song);
    if (state.song.measures.length === before) {
      status("Eight measures is the class limit.");
      return;
    }
    state.focus = state.song.measures.length - 1;
    changed("Added a measure.");
  });
  function send(where) {
    Song.writeBridge("bertyscore", state.song, Song.toBeat(state.song));
    window.location.href = where;
  }
  $("beats-btn").addEventListener("click", () => send("/bertybeatz/?from=bridge"));
  $("lights-btn").addEventListener("click", () => send("/visualizer/?from=bridge"));
  const SCORE_LESSON = [
    {
      title: "Pitch",
      body: "Press Play. The word names a letter. That letter is the pitch. Sound can stay off. The note still lights.",
      check: () => state.playing || state.sawNote,
      miss: "Press Play and watch the word.",
      spot: "#play-btn",
    },
    {
      title: "Higher and lower",
      body: "Higher on the staff is a higher pitch. These notes are C, D, E, G, and A. Tap the staff to move one.",
      check: () => Song.serialize(state.song) !== state.opened,
      miss: "Tap the staff so one note moves.",
      spot: "#staff",
    },
    {
      title: "Rest",
      body: "Tap a note to turn it into a rest. A rest is silence on that beat. The word says Rest. The song still moves.",
      check: () => state.sawRest,
      miss: "Press Play, then tap a lit note until the word says Rest.",
      spot: "#staff",
    },
    {
      title: "On the beat",
      body: "Each note sits on a beat. Open Beats to put a kick on beat 1. Open Lights to watch that same song.",
      check: () => true,
      miss: "",
      spot: "#beats-btn",
    },
  ];
  function clearSpot() {
    document.querySelectorAll(".spot").forEach((el) => el.classList.remove("spot"));
  }
  function coachScore() {
    const box = $("lesson");
    if (!box || box.hidden) {
      clearSpot();
      return;
    }
    const step = SCORE_LESSON[state.lesson];
    if (!step) return;
    clearSpot();
    const el = step.spot && document.querySelector(step.spot);
    if (el) el.classList.add("spot");
    const ok = !step.check || step.check();
    $("lesson-next").classList.toggle("ready", ok);
    if (ok) $("lesson-miss").textContent = "Got it.";
  }
  function paintScoreLesson() {
    const box = $("lesson");
    if (!box) return;
    if (state.lesson == null || state.lesson >= SCORE_LESSON.length) {
      box.hidden = true;
      return;
    }
    const step = SCORE_LESSON[state.lesson];
    box.hidden = false;
    $("lesson-n").textContent = String(state.lesson + 1);
    const total = $("lesson-total");
    if (total) total.textContent = String(SCORE_LESSON.length);
    $("lesson-title").textContent = step.title;
    $("lesson-body").textContent = step.body;
    $("lesson-miss").textContent = "";
    $("lesson-next").classList.remove("ready");
    $("lesson-next").textContent = state.lesson === SCORE_LESSON.length - 1 ? "Done" : "I did this";
    $("lesson-skip").hidden = state.lesson < 1;
    coachScore();
  }
  function finishScoreLesson() {
    state.lesson = SCORE_LESSON.length;
    clearSpot();
    try { localStorage.setItem(HOW_KEY, "1"); } catch (err) { /* ignore */ }
    paintScoreLesson();
  }
  $("lesson-next").addEventListener("click", () => {
    const step = SCORE_LESSON[state.lesson];
    if (!step) return;
    if (step.check && !step.check()) {
      $("lesson-miss").textContent = step.miss;
      return;
    }
    state.lesson += 1;
    if (state.lesson >= SCORE_LESSON.length) finishScoreLesson();
    else paintScoreLesson();
  });
  $("lesson-skip").addEventListener("click", finishScoreLesson);

  $("help-btn").addEventListener("click", () => {
    state.lesson = 0;
    state.sawRest = false;
    state.opened = Song.serialize(state.song);
    paintScoreLesson();
    document.body.classList.remove("menu-open");
  });
  $("menu-btn").addEventListener("click", () => {
    const on = document.body.classList.toggle("menu-open");
    $("menu-btn").setAttribute("aria-expanded", String(on));
    if (on) $("alias").click();
  });
  $("scrim").addEventListener("click", () => {
    document.body.classList.remove("menu-open");
    $("menu-btn").setAttribute("aria-expanded", "false");
  });
  $("how-next").addEventListener("click", () => {
    if (state.how >= steps.length - 1) finishHow();
    else {
      state.how += 1;
      paintHow();
    }
  });
  $("how-skip").addEventListener("click", finishHow);
  document.addEventListener("keydown", (e) => {
    if (e.target.matches("input, textarea")) return;
    if (e.code === "Space") {
      e.preventDefault();
      if (state.playing) stop();
      else play();
    }
  });

  ["chip-label", "foot-chip"].forEach((id) => {
    const el = $(id);
    if (el) el.textContent = CHIP;
  });
  renderPitches();
  paintAlias();
  $("tempo").value = String(state.song.bpm);
  $("tempo-read").textContent = String(state.song.bpm);
  renderStaff();
  renderBeats();
  renderSequence();
  keep();
  if (arrival) status(arrival);
  let seen = false;
  try { seen = localStorage.getItem(HOW_KEY) === "1"; } catch (err) { seen = false; }
  state.opened = Song.serialize(state.song);
  state.lesson = seen ? SCORE_LESSON.length : 0;
  state.sawNote = false;
  state.sawRest = false;
  if (!seen) paintScoreLesson();
  if (!state.coachTimer) state.coachTimer = window.setInterval(coachScore, 400);
})();
