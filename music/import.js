/* Bring a file in as notes. MIDI, MusicXML, and ABC. No audio, no mic. */
(function (root) {
  var STEPS = { C: "C", D: "D", E: "E", F: "F", G: "G", A: "A", B: "B" };
  var METERS = { "2/4": 2, "3/4": 3, "4/4": 4, "6/8": 6 };

  function pitchOf(step, octave) {
    var s = String(step || "").replace(/[^A-Ga-g]/g, "").slice(0, 1).toUpperCase();
    if (!STEPS[s]) return null;
    if (s === "C" && Number(octave) >= 5) return "c";
    return s;
  }

  function measuresFrom(notes, per) {
    var n = METERS[per] ? METERS[per] : (per || 4);
    var measures = [];
    var i;
    var b;
    var beats;
    for (i = 0; i < notes.length && measures.length < 32; i += n) {
      beats = [];
      for (b = 0; b < n; b++) beats.push(notes[i + b] == null ? null : notes[i + b]);
      measures.push({ label: String(measures.length + 1), beats: beats });
    }
    if (!measures.length) measures.push({ label: "1", beats: [null, null, null, null] });
    return measures;
  }

  function abc(text) {
    var meter = "4/4";
    var key = "C";
    var bpm = 96;
    var body = [];
    String(text || "").split(/\r?\n/).forEach(function (line) {
      var head = line.match(/^([A-Za-z]):\s*(.*)$/);
      if (head) {
        var tag = head[1].toUpperCase();
        var val = head[2].trim();
        if (tag === "M" && METERS[val]) meter = val;
        if (tag === "K") {
          if (val.indexOf("Bb") === 0) key = "Bb";
          else if (val[0] === "G") key = "G";
          else if (val[0] === "D") key = "D";
          else if (val[0] === "F") key = "F";
          else key = "C";
        }
        if (tag === "Q") {
          var q = val.match(/(\d+)\s*$/);
          if (q) bpm = Math.max(60, Math.min(160, Number(q[1])));
        }
        return;
      }
      body.push(line);
    });
    var raw = body.join(" ").replace(/%[^\n]*/g, "").replace(/"[^"]*"/g, "");
    var notes = [];
    var i;
    for (i = 0; i < raw.length && notes.length < 128; i++) {
      var ch = raw[i];
      if (ch === "z" || ch === "Z" || ch === "x") notes.push(null);
      else if ("CDEFGAB".indexOf(ch) >= 0) notes.push(ch);
      else if (ch === "c") notes.push("c");
    }
    return { bpm: bpm, meter: meter, key: key, notes: notes };
  }

  function midiPitch(note) {
    var pc = ((note % 12) + 12) % 12;
    var near = [0, 0, 2, 2, 4, 5, 5, 7, 7, 9, 9, 11][pc];
    var name = { 0: "C", 2: "D", 4: "E", 5: "F", 7: "G", 9: "A", 11: "B" }[near];
    if ((name === "C") && note >= 72) return "c";
    return name || "C";
  }

  function vlen(u8, o) {
    var v = 0;
    var b = 0;
    var i = o;
    do {
      if (i >= u8.length) break;
      b = u8[i++];
      v = (v << 7) | (b & 127);
    } while (b & 128);
    return { v: v, o: i };
  }

  function midi(buffer) {
    var u8 = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
    var sig = String.fromCharCode(u8[0], u8[1], u8[2], u8[3]);
    if (sig !== "MThd" || u8.length < 14) throw new Error("not midi");
    var division = (u8[12] << 8) | u8[13];
    var tpq = division & 0x8000 ? 480 : (division || 480);
    var pos = 14;
    var bpm = 96;
    var meter = "4/4";
    var notes = [];
    while (pos + 8 <= u8.length) {
      var tag = String.fromCharCode(u8[pos], u8[pos + 1], u8[pos + 2], u8[pos + 3]);
      var len = ((u8[pos + 4] << 24) | (u8[pos + 5] << 16) | (u8[pos + 6] << 8) | u8[pos + 7]) >>> 0;
      var end = Math.min(u8.length, pos + 8 + len);
      if (tag !== "MTrk") { pos = end; continue; }
      var p = pos + 8;
      var tick = 0;
      var running = 0;
      while (p < end) {
        var delta = vlen(u8, p);
        p = delta.o;
        tick += delta.v;
        if (p >= end) break;
        var status = u8[p];
        if (status < 128) status = running;
        else { running = status; p++; }
        var kind = status & 0xf0;
        if (kind === 0x90 || kind === 0x80) {
          var note = u8[p++];
          var vel = u8[p++];
          if (kind === 0x90 && vel > 0) notes.push({ tick: tick, note: note });
        } else if (kind === 0xc0 || kind === 0xd0) {
          p += 1;
        } else if (status === 0xff) {
          var type = u8[p++];
          var size = vlen(u8, p);
          p = size.o;
          if (type === 0x51 && size.v >= 3) {
            var us = (u8[p] << 16) | (u8[p + 1] << 8) | u8[p + 2];
            if (us) bpm = Math.max(60, Math.min(160, Math.round(60000000 / us)));
          }
          if (type === 0x58 && size.v >= 2) {
            var num = u8[p];
            var den = 1 << u8[p + 1];
            var found = num + "/" + den;
            if (METERS[found]) meter = found;
          }
          p += size.v;
        } else if (kind === 0xa0 || kind === 0xb0 || kind === 0xe0) {
          p += 2;
        } else break;
      }
      pos = end;
    }
    notes.sort(function (a, b) { return a.tick - b.tick; });
    var seq = [];
    notes.forEach(function (item) {
      var beat = Math.round(item.tick / tpq);
      if (beat > 127 || beat < 0) return;
      while (seq.length < beat) seq.push(null);
      if (seq.length === beat) seq.push(midiPitch(item.note));
    });
    return { bpm: bpm, meter: meter, key: "C", notes: seq };
  }

  function xml(text) {
    var doc = new DOMParser().parseFromString(String(text || ""), "application/xml");
    if (!doc || doc.querySelector("parsererror")) throw new Error("not xml");
    var meter = "4/4";
    var beats = doc.querySelector("time > beats, beats");
    var beatType = doc.querySelector("time > beat-type, beat-type");
    if (beats && beatType) {
      var sig = String(beats.textContent).trim() + "/" + String(beatType.textContent).trim();
      if (METERS[sig]) meter = sig;
    }
    var per = METERS[meter];
    var fifthsEl = doc.querySelector("fifths");
    var fifths = fifthsEl ? Number(fifthsEl.textContent) : 0;
    var key = fifths >= 2 ? "D" : fifths === 1 ? "G" : fifths === -1 ? "F" : fifths <= -2 ? "Bb" : "C";
    var bpm = 96;
    var tempo = doc.querySelector("per-minute, sound[tempo]");
    if (tempo) {
      var n = Number(tempo.getAttribute("tempo") || tempo.textContent);
      if (n) bpm = Math.max(60, Math.min(160, Math.round(n)));
    }
    var notes = [];
    var measures = doc.querySelectorAll("measure");
    function take(node) {
      var got = [];
      node.querySelectorAll("note").forEach(function (note) {
        if (note.querySelector("chord")) return;
        if (note.querySelector("rest")) { got.push(null); return; }
        var step = note.querySelector("step");
        var oct = note.querySelector("octave");
        if (!step) return;
        got.push(pitchOf(step.textContent, oct && oct.textContent));
      });
      return got;
    }
    if (measures.length) {
      measures.forEach(function (measure) {
        var got = take(measure);
        while (got.length < per) got.push(null);
        notes = notes.concat(got.slice(0, per));
      });
    } else {
      notes = take(doc);
    }
    return { bpm: bpm, meter: meter, key: key, notes: notes };
  }

  root.KulibertImport = { abc: abc, midi: midi, xml: xml, measuresFrom: measuresFrom };
})(typeof window !== "undefined" ? window : globalThis);
