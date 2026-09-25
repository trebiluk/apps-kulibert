/* Kulibert song family — one JSON shape for BertyScore.
   Beatz keeps its own file. This model does not rewrite that door.
   Later paths (publish, perform) stay on the object and off the screen. */
(function (global) {
  var PITCHES = [
    { id: "C", abc: "C", tone: "C4", label: "C" },
    { id: "D", abc: "D", tone: "D4", label: "D" },
    { id: "E", abc: "E", tone: "E4", label: "E" },
    { id: "F", abc: "F", tone: "F4", label: "F" },
    { id: "G", abc: "G", tone: "G4", label: "G" },
    { id: "A", abc: "A", tone: "A4", label: "A" },
    { id: "B", abc: "B", tone: "B4", label: "B" },
    { id: "c", abc: "c", tone: "C5", label: "C high" },
  ];
  var BEATS = 4;
  var LETTERS = "ABCDEFGH";
  var MAX = 8;

  function pitchById(id) {
    var i;
    for (i = 0; i < PITCHES.length; i++) if (PITCHES[i].id === id) return PITCHES[i];
    return null;
  }

  function uid() {
    return "m" + Math.random().toString(36).slice(2, 8);
  }

  function cleanAlias(value) {
    if (global.KulibertTitles) return global.KulibertTitles.safeTitle(value, "");
    return "";
  }

  function measure(label, beats, id) {
    var row = [null, null, null, null];
    var i;
    if (beats && beats.length) {
      for (i = 0; i < BEATS; i++) row[i] = pitchById(beats[i]) ? beats[i] : null;
    }
    return { id: id || uid(), label: String(label || "A").slice(0, 2), beats: row };
  }

  function starter() {
    return normalize({
      alias: "",
      bpm: 96,
      measures: [
        { id: "start-a", label: "A", beats: ["C", null, "E", null] },
        { id: "start-b", label: "B", beats: ["G", null, "A", "E"] },
      ],
    });
  }

  function normalize(raw) {
    var list = raw && Array.isArray(raw.measures) ? raw.measures : [];
    var measures = [];
    var i;
    for (i = 0; i < list.length && measures.length < MAX; i++) {
      var src = list[i] || {};
      measures.push(measure(src.label || LETTERS[measures.length] || "A", src.beats, src.id ? String(src.id).slice(0, 16) : ""));
    }
    if (!measures.length) {
      measures.push(measure("A", ["C", null, "E", null], "start-a"));
    }
    var bpm = Math.max(60, Math.min(160, Math.round(Number(raw && (raw.bpm || raw.tempo)) || 96)));
    return {
      family: "kulibert.song",
      rev: 1,
      app: "bertyscore",
      chip: "BS 0.2.1",
      alias: cleanAlias(raw && (raw.alias || raw.name)),
      bpm: bpm,
      tempo: bpm,
      key: "C",
      meter: "4/4",
      measures: measures,
      pattern: measures[0].label,
      song: measures.map(function (m) { return m.label; }).join(""),
      publish: raw && raw.publish ? raw.publish : null,
      perform: raw && raw.perform ? raw.perform : null,
    };
  }

  function stamp(song) {
    song.family = "kulibert.song";
    song.rev = 1;
    song.bpm = Math.max(60, Math.min(160, Math.round(Number(song.bpm) || 96)));
    song.tempo = song.bpm;
    song.pattern = song.measures[0] ? song.measures[0].label : "A";
    song.song = song.measures.map(function (m) { return m.label; }).join("");
    song.publish = song.publish || null;
    song.perform = song.perform || null;
    return song;
  }

  function toAbc(song) {
    var s = normalize(song);
    var body = s.measures.map(function (m) {
      return m.beats.map(function (b) {
        var p = pitchById(b);
        return p ? p.abc : "z";
      }).join("");
    }).join(" | ");
    return [
      "X:1",
      "T:" + (s.alias || "Score"),
      "M:4/4",
      "L:1/4",
      "Q:1/4=" + s.bpm,
      "K:C",
      body + " |",
    ].join("\n");
  }

  function events(song) {
    var s = normalize(song);
    var out = [];
    var sound = 0;
    s.measures.forEach(function (m, mi) {
      m.beats.forEach(function (b, bi) {
        var p = pitchById(b);
        out.push({
          measure: mi,
          beat: bi,
          pitch: p ? p.id : null,
          tone: p ? p.tone : null,
          label: p ? p.label : "",
          sound: Boolean(p),
          soundIndex: p ? sound : -1,
        });
        if (p) sound += 1;
      });
    });
    return out;
  }

  function setBeat(song, mi, bi, pitch) {
    var m = song.measures[mi];
    if (!m || bi < 0 || bi >= BEATS) return song;
    m.beats[bi] = pitchById(pitch) ? pitch : null;
    return stamp(song);
  }

  function nextLabel(song) {
    var used = {};
    var i;
    song.measures.forEach(function (m) { used[m.label] = true; });
    for (i = 0; i < LETTERS.length; i++) if (!used[LETTERS[i]]) return LETTERS[i];
    return String(song.measures.length + 1);
  }

  function addMeasure(song) {
    if (song.measures.length >= MAX) return song;
    song.measures.push(measure(nextLabel(song), [null, null, null, null]));
    return stamp(song);
  }

  function duplicateMeasure(song, mi) {
    var m = song.measures[mi];
    if (!m || song.measures.length >= MAX) return song;
    song.measures.splice(mi + 1, 0, measure(nextLabel(song), m.beats.slice()));
    return stamp(song);
  }

  function removeMeasure(song, mi) {
    if (song.measures.length < 2) return song;
    song.measures.splice(mi, 1);
    return stamp(song);
  }

  function moveMeasure(song, mi, dir) {
    var next = mi + dir;
    if (next < 0 || next >= song.measures.length) return song;
    var item = song.measures[mi];
    song.measures[mi] = song.measures[next];
    song.measures[next] = item;
    return stamp(song);
  }

  function serialize(song) {
    return JSON.stringify(normalize(song), null, 2);
  }

  function parse(text) {
    var data;
    try {
      data = JSON.parse(String(text || ""));
    } catch (err) {
      return null;
    }
    if (!data || typeof data !== "object") return null;
    if (data.family === "kulibert.song" && Array.isArray(data.measures)) return normalize(data);
    if (data.steps && typeof data.steps === "object") return fromBeat(data);
    return null;
  }

  var ROW_PITCH = [
    { row: "n4", pitch: "A" },
    { row: "n3", pitch: "G" },
    { row: "n2", pitch: "E" },
    { row: "n1", pitch: "D" },
    { row: "n0", pitch: "C" },
  ];
  var PITCH_ROW = { C: "n0", D: "n1", E: "n2", F: "n2", G: "n3", A: "n4", B: "n4", c: "n4" };
  var BRIDGE = "kulibert.song.bridge";

  function cellOn(row, index) {
    if (!row || index < 0 || index >= row.length) return false;
    return row[index] === true || row[index] === 1;
  }

  function fromBeat(beat) {
    var steps = (beat && beat.steps) || {};
    var labels = "ABCD";
    var measures = [];
    var m, b, step, r, pitch;
    for (m = 0; m < 4; m++) {
      var beats = [null, null, null, null];
      for (b = 0; b < 4; b++) {
        step = m * 4 + b;
        pitch = null;
        for (r = 0; r < ROW_PITCH.length; r++) {
          if (cellOn(steps[ROW_PITCH[r].row], step)) {
            pitch = ROW_PITCH[r].pitch;
            break;
          }
        }
        beats[b] = pitch;
      }
      measures.push({ id: "beat-" + m, label: labels[m], beats: beats });
    }
    return normalize({
      alias: beat && (beat.alias || beat.name) || "",
      bpm: beat && (beat.bpm || beat.tempo),
      measures: measures,
    });
  }

  function toBeat(song) {
    var s = normalize(song);
    var ids = ["kick", "snare", "hat", "clap", "n4", "n3", "n2", "n1", "n0"];
    var steps = {};
    var i;
    ids.forEach(function (id) {
      steps[id] = [];
      for (i = 0; i < 16; i++) steps[id][i] = false;
    });
    var fitted = 0;
    events(s).forEach(function (ev, index) {
      if (index >= 16 || !ev.pitch) return;
      var row = PITCH_ROW[ev.pitch];
      if (!row) return;
      steps[row][index] = true;
      if (ev.pitch === "F" || ev.pitch === "B" || ev.pitch === "c") fitted += 1;
    });
    return {
      name: s.alias || "Score",
      bpm: Math.max(70, Math.min(160, s.bpm)),
      steps: steps,
      fitted: fitted,
    };
  }

  function writeBridge(from, song, beat) {
    try {
      localStorage.setItem(BRIDGE, JSON.stringify({
        from: from || "bertyscore",
        at: Date.now(),
        song: normalize(song),
        beat: beat || null,
      }));
      return true;
    } catch (err) {
      return false;
    }
  }

  function readBridge() {
    try {
      var data = JSON.parse(localStorage.getItem(BRIDGE) || "null");
      if (!data || !data.song) return null;
      data.song = normalize(data.song);
      return data;
    } catch (err) {
      return null;
    }
  }

  global.KulibertSong = {
    CHIP: "BS 0.2.1",
    PITCHES: PITCHES,
    BEATS: BEATS,
    starter: starter,
    normalize: normalize,
    toAbc: toAbc,
    events: events,
    setBeat: setBeat,
    addMeasure: addMeasure,
    duplicateMeasure: duplicateMeasure,
    removeMeasure: removeMeasure,
    moveMeasure: moveMeasure,
    serialize: serialize,
    parse: parse,
    fromBeat: fromBeat,
    toBeat: toBeat,
    writeBridge: writeBridge,
    readBridge: readBridge,
    pitchById: pitchById,
  };
})(typeof window !== "undefined" ? window : globalThis);
