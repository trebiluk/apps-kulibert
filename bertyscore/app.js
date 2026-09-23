(() => {
  const Song = window.KulibertSong;
  const CHIP = "BS 0.2.0";
  const HOW_KEY = "kulibert.bertyscore.howto";
  if (!Song) return;

  const $ = (id) => document.getElementById(id);
  const steps = [
    ["Place a note", "Tap a pitch on the left, then tap a beat. The staff draws that note."],
    ["Hear it", "Press Play. The note lights up on the staff. Mute is fine — the light still moves."],
    ["Save it", "Save downloads a score file. Import opens that same file on this Chromebook."],
  ];

  const params = new URLSearchParams(window.location.search);
  let arrival = "";
  let opening = Song.starter();
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
      node.setAttribute("aria-label", ev.label + " in measure " + (ev.measure + 1));
      const pick = () => {
        state.focus = ev.measure;
        state.beat = ev.beat;
        renderBeats();
        renderSequence();
      };
      node.addEventListener("click", pick);
      node.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          pick();
        }
      });
    });
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
        changed("Score updated.");
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
          changed("Sequence updated the score.");
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

  function showNow(ev) {
    state._now = ev;
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
        if (Tone.Draw) Tone.Draw.schedule(() => showNow(ev), time);
        else showNow(ev);
      }, i * beat);
    });
    Tone.Transport.loop = true;
    Tone.Transport.loopStart = 0;
    Tone.Transport.loopEnd = Math.max(beat, evs.length * beat);
  }

  function armFallback() {
    const evs = Song.events(state.song);
    const beat = 60000 / state.song.bpm;
    let i = 0;
    window.clearInterval(state.timer);
    state.timer = window.setInterval(() => {
      if (!state.playing) return;
      showNow(evs[i % evs.length]);
      i += 1;
    }, reduce ? beat : beat);
  }

  async function play() {
    state.playing = true;
    paintPlay();
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
        return;
      } catch (err) {
        status("Sound needs another tap. The score still lights up.");
      }
    }
    armFallback();
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
    renderStaff();
    renderBeats();
    renderSequence();
    if (state.playing && window.Tone && synth) armTone();
    else if (state.playing) armFallback();
    status(message);
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
    status("Saved " + a.download + " on this Chromebook.");
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
  });
  $("alias").addEventListener("input", (e) => {
    state.song.alias = e.target.value.replace(/[^\w .\-']/g, "").slice(0, 24);
    if (e.target.value !== state.song.alias) e.target.value = state.song.alias;
    renderStaff();
  });
  $("tempo").addEventListener("input", (e) => {
    state.song.bpm = Number(e.target.value);
    state.song.tempo = state.song.bpm;
    $("tempo-read").textContent = String(state.song.bpm);
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
      $("alias").value = next.alias;
      $("tempo").value = String(next.bpm);
      $("tempo-read").textContent = String(next.bpm);
      renderStaff();
      renderBeats();
      renderSequence();
      status(next.alias ? "Imported " + next.alias + "." : "Imported. Pitched notes are on the staff.");
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
  $("help-btn").addEventListener("click", () => {
    state.how = 0;
    paintHow();
    $("howto").showModal();
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
  $("alias").value = state.song.alias || "";
  $("tempo").value = String(state.song.bpm);
  $("tempo-read").textContent = String(state.song.bpm);
  renderStaff();
  renderBeats();
  renderSequence();
  if (arrival) status(arrival);
  let seen = false;
  try { seen = localStorage.getItem(HOW_KEY) === "1"; } catch (err) { seen = false; }
  if (!seen) {
    paintHow();
    $("howto").showModal();
  }
})();
