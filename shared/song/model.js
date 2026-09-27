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
  var METERS = { "2/4": 2, "3/4": 3, "4/4": 4, "6/8": 6 };
  var BEATS = 4;
  var LETTERS = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  var MAX = 32;

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

  function beatsFor(meter) {
    return METERS[meter] || 4;
  }

  var ART = { staccato: 1, accent: 1, tenuto: 1 };
  var DYN = { pp: 1, p: 1, mf: 1, f: 1, ff: 1 };
  var KEYS = { C: "C", G: "G", D: "D", F: "F", Bb: "Bb" };
  var SEMI = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11, c: 12 };
  var KEY_ALT = { C: {}, G: { F: 1 }, D: { F: 1, C: 1 }, F: { B: -1 }, Bb: { B: -1, E: -1 } };

  function cellFrom(raw) {
    var eighths = null;
    var chord = [];
    var i;
    if (raw && Array.isArray(raw.eighths) && raw.eighths.length === 2) {
      eighths = [
        pitchById(raw.eighths[0]) ? raw.eighths[0] : null,
        pitchById(raw.eighths[1]) ? raw.eighths[1] : null,
      ];
    }
    if (raw && Array.isArray(raw.chord)) {
      for (i = 0; i < raw.chord.length && chord.length < 3; i++) {
        if (pitchById(raw.chord[i])) chord.push(raw.chord[i]);
      }
    }
    var p = null;
    if (typeof raw === "string") p = pitchById(raw) ? raw : null;
    else if (raw && (raw.p || raw.pitch)) p = pitchById(raw.p || raw.pitch) ? (raw.p || raw.pitch) : null;
    return {
      p: eighths ? null : p,
      tie: !!(raw && typeof raw === "object" && raw.tie) && !eighths,
      art: raw && ART[raw.art] ? raw.art : "",
      chord: eighths ? [] : chord,
      eighths: eighths,
      dyn: raw && DYN[raw.dyn] ? raw.dyn : "",
    };
  }

  function measure(label, beats, id, count) {
    var n = count || BEATS;
    var row = [];
    var i;
    for (i = 0; i < n; i++) row[i] = cellFrom(beats && beats[i]);
    return { id: id || uid(), label: String(label || "A").slice(0, 3), beats: row };
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
    var meter = METERS[raw && raw.meter] ? raw.meter : "4/4";
    var count = beatsFor(meter);
    var list = raw && Array.isArray(raw.measures) ? raw.measures : [];
    var measures = [];
    var i;
    for (i = 0; i < list.length && measures.length < MAX; i++) {
      var src = list[i] || {};
      measures.push(measure(src.label || LETTERS[measures.length] || String(measures.length + 1), src.beats, src.id ? String(src.id).slice(0, 16) : "", count));
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
      key: KEYS[raw && raw.key] ? raw.key : "C",
      meter: meter,
      measures: measures,
      pattern: measures[0].label,
      song: measures.map(function (m) { return m.label; }).join(""),
      publish: raw && raw.publish ? raw.publish : null,
      perform: raw && raw.perform ? raw.perform : null,
      viz: cleanViz(raw && raw.viz),
      why: cleanWhy(raw && raw.why),
      from: cleanFrom(raw && raw.from),
    };
  }

  function stamp(song) {
    song.family = "kulibert.song";
    song.rev = 1;
    song.bpm = Math.max(60, Math.min(160, Math.round(Number(song.bpm) || 96)));
    song.tempo = song.bpm;
    if (!METERS[song.meter]) song.meter = "4/4";
    if (!KEYS[song.key]) song.key = "C";
    song.pattern = song.measures[0] ? song.measures[0].label : "A";
    song.song = song.measures.map(function (m) { return m.label; }).join("");
    song.publish = song.publish || null;
    song.perform = song.perform || null;
    song.viz = cleanViz(song.viz);
    song.why = cleanWhy(song.why);
    song.from = cleanFrom(song.from);
    return song;
  }

  var WHY = { home: 1, line: 1, space: 1, higher: 1, lower: 1, rest: 1, beat: 1, again: 1, returns: 1 };
  var WALLS = { night: 1, dusk: 1, sunset: 1, sea: 1, aurora: 1, candy: 1 };
  var FRAMES = { none: 1, line: 1, glow: 1, double: 1, rgb: 1 };
  var COLORS = { cyan: 1, amber: 1, violet: 1, rose: 1, lime: 1, ice: 1 };
  var LOOKS = { bars: 1, kaleido: 1, clouds: 1, stars: 1, code: 1, rings: 1, ripple: 1, tiles: 1, orbit: 1, rain: 1, tunnel: 1, ribbon: 1, bloom: 1, fireworks: 1, off: 1 };

  function cleanViz(raw) {
    if (!raw || typeof raw !== "object" || !Array.isArray(raw.layers)) return null;
    var layers = [];
    var i;
    for (i = 0; i < raw.layers.length && layers.length < 3; i++) {
      var layer = raw.layers[i] || {};
      layers.push({
        look: LOOKS[layer.look] ? layer.look : "off",
        color: COLORS[layer.color] ? layer.color : "cyan",
      });
    }
    if (!layers.length) return null;
    return {
      layers: layers,
      wall: WALLS[raw.wall] ? raw.wall : "dusk",
      frame: FRAMES[raw.frame] ? raw.frame : "glow",
      rgb: !!raw.rgb,
    };
  }

  function cleanWhy(raw) {
    var out = {};
    var keys;
    var i;
    if (!raw || typeof raw !== "object") return out;
    keys = Object.keys(raw);
    for (i = 0; i < keys.length && i < 240; i++) {
      if (!/^\d+-\d+$/.test(keys[i])) continue;
      if (WHY[raw[keys[i]]]) out[keys[i]] = raw[keys[i]];
    }
    return out;
  }

  function cleanFrom(raw) {
    var out = [];
    var i;
    var name;
    if (!Array.isArray(raw)) return out;
    for (i = 0; i < raw.length && out.length < 4; i++) {
      name = String(raw[i] || "").replace(/[\u0000-\u001f]/g, "").trim().slice(0, 40);
      if (name) out.push(name);
    }
    return out;
  }

  function freqOf(id, key) {
    if (!SEMI.hasOwnProperty(id)) return null;
    var alt = (KEY_ALT[KEYS[key] ? key : "C"] || {})[id] || 0;
    return Math.round(261.63 * Math.pow(2, (SEMI[id] + alt) / 12) * 100) / 100;
  }

  function spell(cell, len) {
    var dyn = cell.dyn ? "!" + cell.dyn + "!" : "";
    var art = cell.art === "staccato" ? "." : cell.art === "accent" ? "!accent!" : cell.art === "tenuto" ? "!tenuto!" : "";
    var suf = len > 1 ? String(len) : "";
    if (cell.eighths) {
      var a = pitchById(cell.eighths[0]);
      var b = pitchById(cell.eighths[1]);
      return dyn + art + (a ? a.abc : "z") + "/2" + (b ? b.abc : "z") + "/2";
    }
    var p = pitchById(cell.p);
    var head = p ? p.abc : "z";
    if (p && cell.chord && cell.chord.length) {
      var notes = [head];
      cell.chord.forEach(function (id) {
        var extra = pitchById(id);
        if (extra && id !== cell.p) notes.push(extra.abc);
      });
      head = "[" + notes.join("") + "]";
    }
    return dyn + art + head + suf;
  }

  function engrave(song) {
    var s = normalize(song);
    var events = [];
    var glyph = 0;
    var lines = [];
    var mi;
    var line = [];
    for (mi = 0; mi < s.measures.length; mi++) {
      var beats = s.measures[mi].beats;
      var parts = [];
      var i = 0;
      while (i < beats.length) {
        var cell = beats[i];
        var len = 1;
        if (!cell.eighths && cell.p && cell.tie) {
          var j = i;
          while (beats[j] && beats[j].tie && j + 1 < beats.length && beats[j + 1].p === cell.p && !beats[j + 1].eighths) {
            len += 1;
            j += 1;
          }
        }
        parts.push(spell(cell, len));
        var k;
        for (k = 0; k < len; k++) {
          var here = beats[i + k];
          var p = pitchById(here.p);
          var tiedFrom = k > 0;
          events.push({
            measure: mi,
            beat: i + k,
            pitch: p ? p.id : (here.eighths && pitchById(here.eighths[0]) ? here.eighths[0] : null),
            tone: p ? p.tone : null,
            label: p ? p.label : "",
            sound: Boolean(p || here.eighths) && !tiedFrom,
            tiedFrom: tiedFrom,
            durBeats: here.eighths ? 0.5 : (tiedFrom ? 0 : len),
            eighths: here.eighths || null,
            art: here.art || "",
            dyn: here.dyn || "",
            chord: tiedFrom ? [] : (here.chord || []),
            freq: p ? freqOf(p.id, s.key) : (here.eighths && here.eighths[0] ? freqOf(here.eighths[0], s.key) : null),
            glyph: glyph,
          });
        }
        glyph += 1;
        i += len;
      }
      line.push(parts.join(""));
      if (line.length === 4 || mi === s.measures.length - 1) {
        lines.push(line.join(" | "));
        line = [];
      }
    }
    var unit = s.meter === "6/8" ? "1/8" : "1/4";
    var abc = [
      "X:1",
      "T:" + (s.alias || "Score"),
      "M:" + s.meter,
      "L:" + unit,
      "Q:1/4=" + s.bpm,
      "K:" + s.key,
      lines.join(" |\n") + " |",
    ].join("\n");
    return { abc: abc, events: events };
  }

  function toAbc(song) {
    return engrave(song).abc;
  }

  function events(song) {
    return engrave(song).events;
  }

  function cellAt(song, mi, bi) {
    var m = song.measures[mi];
    if (!m || bi < 0 || bi >= m.beats.length) return null;
    if (!m.beats[bi] || typeof m.beats[bi] !== "object") m.beats[bi] = cellFrom(m.beats[bi]);
    return m.beats[bi];
  }

  function setBeat(song, mi, bi, pitch) {
    var cell = cellAt(song, mi, bi);
    if (!cell) return song;
    cell.p = pitchById(pitch) ? pitch : null;
    cell.eighths = null;
    if (!cell.p) {
      cell.tie = false;
      cell.chord = [];
      cell.art = "";
    }
    return stamp(song);
  }

  function setEighths(song, mi, bi, pitch) {
    var cell = cellAt(song, mi, bi);
    if (!cell || !pitchById(pitch)) return song;
    if (!cell.eighths) cell.eighths = [pitch, null];
    else if (!cell.eighths[1]) cell.eighths[1] = pitch;
    else cell.eighths = [pitch, cell.eighths[1] === pitch ? null : pitch];
    cell.p = null;
    cell.tie = false;
    cell.chord = [];
    return stamp(song);
  }

  function toggleTie(song, mi, bi) {
    var cell = cellAt(song, mi, bi);
    var m = song.measures[mi];
    if (!cell || !cell.p || cell.eighths) return song;
    cell.tie = !cell.tie;
    if (cell.tie && m.beats[bi + 1] && !m.beats[bi + 1].p && !m.beats[bi + 1].eighths) m.beats[bi + 1].p = cell.p;
    return stamp(song);
  }

  function setArt(song, mi, bi, art) {
    var cell = cellAt(song, mi, bi);
    if (!cell) return song;
    cell.art = cell.art === art ? "" : (ART[art] ? art : "");
    return stamp(song);
  }

  function addChord(song, mi, bi, pitch) {
    var cell = cellAt(song, mi, bi);
    if (!cell || !cell.p || !pitchById(pitch) || pitch === cell.p) return song;
    var i = cell.chord.indexOf(pitch);
    if (i >= 0) cell.chord.splice(i, 1);
    else if (cell.chord.length < 3) cell.chord.push(pitch);
    return stamp(song);
  }

  function setDyn(song, mi, bi, dyn) {
    var cell = cellAt(song, mi, bi);
    if (!cell || !DYN[dyn]) return song;
    cell.dyn = cell.dyn === dyn ? "" : dyn;
    return stamp(song);
  }

  function setKey(song, key) {
    if (!KEYS[key]) return song;
    song.key = key;
    return stamp(song);
  }

  function setMeter(song, meter) {
    if (!METERS[meter]) return song;
    var n = METERS[meter];
    song.meter = meter;
    song.measures.forEach(function (m) {
      var next = [];
      var i;
      for (i = 0; i < n; i++) next[i] = cellFrom(m.beats[i]);
      m.beats = next;
    });
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
    song.measures.push(measure(nextLabel(song), [], "", beatsFor(song.meter)));
    return stamp(song);
  }

  function duplicateMeasure(song, mi) {
    var m = song.measures[mi];
    if (!m || song.measures.length >= MAX) return song;
    song.measures.splice(mi + 1, 0, measure(nextLabel(song), m.beats.slice(), "", m.beats.length));
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
    CHIP: "BS 0.4.0",
    PITCHES: PITCHES,
    BEATS: BEATS,
    METERS: METERS,
    KEYS: ["C", "G", "D", "F", "Bb"],
    beatsFor: beatsFor,
    setMeter: setMeter,
    setKey: setKey,
    freqOf: freqOf,
    starter: starter,
    normalize: normalize,
    toAbc: toAbc,
    events: events,
    setBeat: setBeat,
    setEighths: setEighths,
    toggleTie: toggleTie,
    setArt: setArt,
    addChord: addChord,
    setDyn: setDyn,
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
