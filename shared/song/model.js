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
    return String(value || "").replace(/[^\w .\-']/g, "").trim().slice(0, 24);
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
        { id: "start-b", label: "B", beats: ["G", null, "c", "E"] },
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
      chip: "BS 0.1.0",
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
    if (!data || data.family !== "kulibert.song" || !Array.isArray(data.measures)) return null;
    return normalize(data);
  }

  global.KulibertSong = {
    CHIP: "BS 0.1.0",
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
    pitchById: pitchById,
  };
})(typeof window !== "undefined" ? window : globalThis);
