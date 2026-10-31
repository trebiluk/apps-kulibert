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
    { id: "c", abc: "c", tone: "C5", label: "Hi C" },
  ];
  var METERS = { "2/4": 2, "3/4": 3, "4/4": 4, "6/8": 6 };
  var BEATS = 4;
  var LETTERS = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  var MAX = 32;

  // BS 0.5.0: notes outside the C4 to C5 palette. PITCHES (the palette other apps draw) is not changed.
  var PITCHES_EXT = [
    { id: "G,", abc: "G,", tone: "G3", label: "Low G" },
    { id: "A,", abc: "A,", tone: "A3", label: "Low A" },
    { id: "B,", abc: "B,", tone: "B3", label: "Low B" },
    { id: "d", abc: "d", tone: "D5", label: "Hi D" },
    { id: "e", abc: "e", tone: "E5", label: "Hi E" },
  ];

  function pitchById(id) {
    var i;
    for (i = 0; i < PITCHES.length; i++) if (PITCHES[i].id === id) return PITCHES[i];
    for (i = 0; i < PITCHES_EXT.length; i++) if (PITCHES_EXT[i].id === id) return PITCHES_EXT[i];
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
  var SEMI = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11, c: 12, d: 14, e: 16, "G,": -5, "A,": -3, "B,": -1 };
  var SEMI_EXT = { d: 1, e: 1, "G,": 1, "A,": 1, "B,": 1 };
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

  // BS 0.5.0: real note lengths. A "rich" measure holds notes [{ p, d, tie, art, dyn }] where d counts eighths:
  // 1 eighth, 2 quarter, 3 dotted quarter, 4 half, 6 dotted half, 8 whole. p null is a rest. A song may start with a pickup bar
  // (song.pickup = eighths in that first bar). Songs without notes keep the old beat cells and the old output, byte for byte.
  var LENGTHS = [1, 2, 3, 4, 6, 8];
  var BAR_EIGHTHS = { "2/4": 4, "3/4": 6, "4/4": 8, "6/8": 6 };

  function barEighths(meter) {
    return BAR_EIGHTHS[meter] || 8;
  }

  function cleanLength(d) {
    var n = Math.round(Number(d)) || 2;
    var best = 1;
    var i;
    for (i = 0; i < LENGTHS.length; i++) if (LENGTHS[i] <= n) best = LENGTHS[i];
    return best;
  }

  function cleanNotes(list) {
    var out = [];
    var i;
    for (i = 0; i < list.length && out.length < 64; i++) {
      var raw = list[i] || {};
      var p = pitchById(raw.p) ? raw.p : null;
      out.push({
        p: p,
        d: cleanLength(raw.d),
        tie: !!raw.tie && !!p,
        art: raw.art && ART[raw.art] ? raw.art : "",
        dyn: raw.dyn && DYN[raw.dyn] ? raw.dyn : "",
      });
    }
    return out;
  }

  function beatsToNotes(beats, meter) {
    var unit = meter === "6/8" ? 1 : 2;
    var out = [];
    (beats || []).forEach(function (raw) {
      var c = cellFrom(raw);
      if (c.eighths && unit === 2) {
        out.push({ p: c.eighths[0] || null, d: 1, tie: false, art: c.art, dyn: c.dyn });
        out.push({ p: c.eighths[1] || null, d: 1, tie: false, art: "", dyn: "" });
      } else {
        out.push({ p: c.p || null, d: unit, tie: !!c.tie && !!c.p, art: c.art, dyn: c.dyn });
      }
    });
    return out;
  }

  function richMeasure(label, notes, id, count) {
    var m = measure(label, [], id, count);
    m.notes = cleanNotes(notes);
    return m;
  }

  function isRich(song) {
    var i;
    for (i = 0; song && song.measures && i < song.measures.length; i++) if (song.measures[i] && song.measures[i].notes) return true;
    return false;
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
      var label = src.label || LETTERS[measures.length] || String(measures.length + 1);
      var mid = src.id ? String(src.id).slice(0, 16) : "";
      if (Array.isArray(src.notes) && src.notes.length) measures.push(richMeasure(label, src.notes, mid, count));
      else measures.push(measure(label, src.beats, mid, count));
    }
    var rich = isRich({ measures: measures });
    if (rich) {
      measures.forEach(function (m) {
        if (!m.notes) m.notes = cleanNotes(beatsToNotes(m.beats, meter));
      });
    }
    var pickup = rich ? Math.max(0, Math.min(barEighths(meter) - 1, Math.round(Number(raw && raw.pickup)) || 0)) : 0;
    if (!measures.length) {
      measures.push(measure("A", ["C", null, "E", null], "start-a"));
    }
    var bpm = Math.max(60, Math.min(160, Math.round(Number(raw && (raw.bpm || raw.tempo)) || 96)));
    var out = {
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
    if (pickup) out.pickup = pickup;
    return out;
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
    var table = KEY_ALT[KEYS[key] ? key : "C"] || {};
    var alt = table[id] || 0;
    if (!alt && SEMI_EXT[id]) alt = table[id.replace(",", "").toUpperCase()] || 0;
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

  function engraveRich(s) {
    var barLen = barEighths(s.meter);
    var unit = s.meter === "6/8" ? 1 : 2;
    var pk = s.pickup || 0;
    var flat = [];
    s.measures.forEach(function (m, mi) {
      m.notes.forEach(function (n, k) { flat.push({ mi: mi, k: k, n: n }); });
    });
    // tie chains: the first note holds the whole chain, the notes after it are heard as held
    var tiedFrom = [];
    var hold = [];
    flat.forEach(function (it, i) {
      tiedFrom[i] = i > 0 && !!flat[i - 1].n.tie && !!it.n.p && flat[i - 1].n.p === it.n.p;
    });
    flat.forEach(function (it, i) {
      var d = it.n.d;
      var j = i;
      while (flat[j].n.tie && flat[j + 1] && tiedFrom[j + 1]) { d += flat[j + 1].n.d; j += 1; }
      hold[i] = d;
    });
    var events = [];
    var lines = [];
    var line = [];
    var at = 0;
    var gi = 0;
    var mi;
    for (mi = 0; mi < s.measures.length; mi++) {
      var notes = s.measures[mi].notes;
      var isPickup = pk > 0 && mi === 0;
      var pos = isPickup ? barLen - pk : 0;
      var toks = [];
      var k;
      for (k = 0; k < notes.length; k++) {
        var n = notes[k];
        var p = pitchById(n.p);
        var dyn = n.dyn ? "!" + n.dyn + "!" : "";
        var art = n.art === "staccato" ? "." : n.art === "accent" ? "!accent!" : n.art === "tenuto" ? "!tenuto!" : "";
        var text = dyn + art + (p ? p.abc : "z") + (n.d > 1 ? String(n.d) : "") + (tiedFrom[gi + 1] ? "-" : "");
        toks.push({ text: text, d: n.d, pos: pos });
        var tf = tiedFrom[gi];
        events.push({
          measure: mi,
          beat: Math.floor(pos / unit),
          pitch: p ? p.id : null,
          tone: p ? p.tone : null,
          label: p ? p.label : "",
          sound: Boolean(p) && !tf,
          tiedFrom: tf,
          durBeats: tf ? 0 : hold[gi] / unit,
          eighths: null,
          art: n.art || "",
          dyn: n.dyn || "",
          chord: [],
          freq: p ? freqOf(p.id, s.key) : null,
          glyph: gi,
          at: at,
          dur: n.d,
          bar: pk > 0 ? mi : mi + 1,
          pos: pos,
          rest: !p,
        });
        pos += n.d;
        at += n.d;
        gi += 1;
      }
      var text2 = "";
      toks.forEach(function (t, i) {
        var next = toks[i + 1];
        text2 += t.text + (next && t.d === 1 && next.d === 1 && t.pos % 2 === 0 ? "" : (next ? " " : ""));
      });
      line.push(text2);
      if (line.length === 4 || mi === s.measures.length - 1) {
        lines.push(line.join(" | "));
        line = [];
      }
    }
    var abc = [
      "X:1",
      "T:" + (s.alias || "Score"),
      "M:" + s.meter,
      "L:1/8",
      "Q:1/4=" + s.bpm,
      "K:" + s.key,
      lines.join(" |\n") + " |",
    ].join("\n");
    return { abc: abc, events: events };
  }

  function engrave(song) {
    var s = normalize(song);
    if (isRich(s)) return engraveRich(s);
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

  // BS 0.5.0: on a song with real note lengths, tapping a note changes its pitch and keeps its length. Length edits come later.
  function setPitchAt(song, mi, bi, pitch) {
    var m = song.measures[mi];
    var s = normalize(song);
    var unit = s.meter === "6/8" ? 1 : 2;
    var pk = s.pickup || 0;
    var pos = mi === 0 && pk > 0 ? barEighths(s.meter) - pk : 0;
    var target = bi * unit;
    var k;
    for (k = 0; k < m.notes.length; k++) {
      var d = cleanLength(m.notes[k].d);
      if (target >= pos && target < pos + d) {
        m.notes[k].p = pitchById(pitch) ? pitch : null;
        if (!m.notes[k].p) m.notes[k].tie = false;
        return stamp(song);
      }
      pos += d;
    }
    return song;
  }

  function setBeat(song, mi, bi, pitch) {
    if (song.measures[mi] && song.measures[mi].notes) return setPitchAt(song, mi, bi, pitch);
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
    if (song.measures[mi] && song.measures[mi].notes) return song;
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
    if (song.measures[mi] && song.measures[mi].notes) return song;
    var cell = cellAt(song, mi, bi);
    var m = song.measures[mi];
    if (!cell || !cell.p || cell.eighths) return song;
    cell.tie = !cell.tie;
    if (cell.tie && m.beats[bi + 1] && !m.beats[bi + 1].p && !m.beats[bi + 1].eighths) m.beats[bi + 1].p = cell.p;
    return stamp(song);
  }

  function setArt(song, mi, bi, art) {
    if (song.measures[mi] && song.measures[mi].notes) return song;
    var cell = cellAt(song, mi, bi);
    if (!cell) return song;
    cell.art = cell.art === art ? "" : (ART[art] ? art : "");
    return stamp(song);
  }

  function addChord(song, mi, bi, pitch) {
    if (song.measures[mi] && song.measures[mi].notes) return song;
    var cell = cellAt(song, mi, bi);
    if (!cell || !cell.p || !pitchById(pitch) || pitch === cell.p) return song;
    var i = cell.chord.indexOf(pitch);
    if (i >= 0) cell.chord.splice(i, 1);
    else if (cell.chord.length < 3) cell.chord.push(pitch);
    return stamp(song);
  }

  function setDyn(song, mi, bi, dyn) {
    if (song.measures[mi] && song.measures[mi].notes) return song;
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
    if (!METERS[meter] || isRich(song)) return song;
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
    var copy = measure(nextLabel(song), m.beats.slice(), "", m.beats.length);
    if (m.notes) copy.notes = cleanNotes(m.notes);
    song.measures.splice(mi + 1, 0, copy);
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

  // Does every bar add up? The pickup bar holds song.pickup eighths and the last bar holds what is left of a full bar.
  function barsAdd(song) {
    var s = normalize(song);
    var len = barEighths(s.meter);
    var pk = s.pickup || 0;
    return s.measures.map(function (m, i) {
      var notes = m.notes || beatsToNotes(m.beats, s.meter);
      var sum = 0;
      notes.forEach(function (n) { sum += n.d; });
      var expect = len;
      if (pk > 0 && i === 0) expect = pk;
      else if (pk > 0 && i === s.measures.length - 1) expect = len - pk;
      return { bar: pk > 0 ? i : i + 1, eighths: sum, expect: expect, ok: sum === expect };
    });
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
    CHIP: "BS 0.5.0",
    PITCHES: PITCHES,
    PITCHES_EXT: PITCHES_EXT,
    barEighths: barEighths,
    barsAdd: barsAdd,
    isRich: isRich,
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
