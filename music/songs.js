/* DJ Berty songs with real notation (MU 2.36.63): key, time, pickup and note lengths.
   Each note is  pitch + length in eighths:  C2 = quarter, C4 = half, C3 = dotted quarter, C6 = dotted half, C8 = whole, C1 = eighth.  z4 = half rest.
   Pitches: C D E F G A B  c (high C)  d (high D)  G, (low G).  The key signature does the sharps and flats (Happy Birthday in F: B is B flat).
   A bar string is one bar. "pickup" is the number of eighths in the short first bar; the last bar holds what is left of a full bar.
   These tunes are public domain. Sources are in the PR description and in `source` below.
   MU 2.36.63 wrote the first six. MU 2.36.64 adds Sakura, Frere Jacques, La Cucaracha, Simple Gifts and Amazing Grace. The songs not listed here still use beat cells. */
(function (root) {
  var SONGS = {
    "Twinkle": {
      place: "many places", key: "C", meter: "4/4", bpm: 96, pickup: 0,
      source: "Ah! vous dirai-je, maman (French tune, 1761), the theme of Mozart's Variations K. 265 (IMSLP). Checked against the note-name line and the musicaviva ABC listing.",
      bars: ["C2 C2 G2 G2", "A2 A2 G4", "F2 F2 E2 E2", "D2 D2 C4", "G2 G2 F2 F2", "E2 E2 D4", "G2 G2 F2 F2", "E2 E2 D4", "C2 C2 G2 G2", "A2 A2 G4", "F2 F2 E2 E2", "D2 D2 C4"]
    },
    "Little Lamb": {
      place: "United States", key: "C", meter: "4/4", bpm: 96, pickup: 0,
      source: "Mary Had a Little Lamb, words by Sarah Josepha Hale (1830), tune as printed with Lowell Mason's 1830 setting (public domain). Checked against the note-name sequence E D C D E E E2, D D D2, E G G2.",
      bars: ["E2 D2 C2 D2", "E2 E2 E4", "D2 D2 D4", "E2 G2 G4", "E2 D2 C2 D2", "E2 E2 E2 E2", "D2 D2 E2 D2", "C8"]
    },
    "Ode to Joy": {
      place: "Germany", key: "C", meter: "4/4", bpm: 104, pickup: 0,
      source: "Beethoven, Symphony No. 9, 4th movement (1824), the Ode to Joy theme (IMSLP), written here in C major. Checked against an independent ABC transcription (dotted quarter + eighth in bars 4, 8, 16; low G in bar 12).",
      bars: ["E2 E2 F2 G2", "G2 F2 E2 D2", "C2 C2 D2 E2", "E3 D1 D4", "E2 E2 F2 G2", "G2 F2 E2 D2", "C2 C2 D2 E2", "D3 C1 C4", "D2 D2 E2 C2", "D2 E1 F1 E2 C2", "D2 E1 F1 E2 D2", "C2 D2 G,4", "E2 E2 F2 G2", "G2 F2 E2 D2", "C2 C2 D2 E2", "D3 C1 C4"]
    },
    "Happy Birthday": {
      place: "United States", key: "F", meter: "3/4", bpm: 90, pickup: 2,
      source: "Good Morning to All, Patty and Mildred J. Hill, Song Stories for the Kindergarten (1893), public domain; the Happy Birthday tune. Checked against the LilyPond transcription on Wikipedia. The two pickup notes are two even eighths (the printed rhythm is a dotted eighth and a sixteenth).",
      bars: ["C1 C1", "D2 C2 F2", "E4 C1 C1", "D2 C2 G2", "F4 C1 C1", "c2 A2 F2", "E2 D2 B1 B1", "A2 F2 G2", "F4"]
    },
    "Jingle Bells": {
      place: "United States", key: "G", meter: "4/4", bpm: 120, pickup: 0,
      source: "J. Pierpont, The One Horse Open Sleigh (1857), the chorus (public domain). Checked against two independent transcriptions (an easy-piano ABC and a LilyPond score): B B B2, B d G3 A, c c c3 c, c B B B/B/, d d c A, G4.",
      bars: ["B2 B2 B4", "B2 B2 B4", "B2 d2 G3 A1", "B8", "c2 c2 c3 c1", "c2 B2 B2 B1 B1", "B2 A2 A2 B2", "A4 d4", "B2 B2 B4", "B2 B2 B4", "B2 d2 G3 A1", "B8", "c2 c2 c3 c1", "c2 B2 B2 B1 B1", "d2 d2 c2 A2", "G8"]
    },
    "Sa Re Ga Ma": {
      place: "India", key: "C", meter: "4/4", bpm: 86, pickup: 0,
      source: "A new warm-up written for DJ Berty on the sargam scale: Sa Re Ga Ma Pa Dha Ni Sa = C D E F G A B c. No source tune; the half rests are the echo.",
      bars: ["C2 D2 E2 F2", "G4 z4", "G2 A2 B2 c2", "c4 z4", "c2 B2 A2 G2", "F4 z4", "F2 E2 D2 C2", "C4 z4"]
    }
    ,"Sakura": {
      place: "Japan", key: "C", meter: "4/4", bpm: 80, pickup: 0,
      source: "Sakura Sakura, Japanese folk song (earliest English-language print: Izawa, Collection of Japanese Koto Music, 1888, per Flutopedia). Notes from the Musica Viva transcription (Frank Nordberg) and John Chambers' Japan/Sakura_Am file, which agree; the Essen Folksong Collection tune I0001 has the same pitches. The tune is in A minor and needs no sharps or flats, so it is written with the C key. The last phrase (E F B A F E) follows Chambers and Essen; Musica Viva adds a D before it.",
      bars: ["A2 A2 B4", "A2 A2 B4", "A2 B2 c2 B2", "A2 B1 A1 F4", "E2 C2 E2 F2", "E2 E1 C1 B,4", "A2 B2 c2 B2", "A2 B1 A1 F4", "E2 C2 E2 F2", "E2 E1 C1 B,4", "A2 A2 B4", "A2 A2 B4", "E2 F2 B1 A1 F2", "E4 z4"]
    }
    ,"Frere Jacques": {
      place: "France", key: "C", meter: "4/4", bpm: 96, pickup: 0,
      source: "Frere Jacques, traditional French round. Notes from the Musica Viva transcription (Frank Nordberg, in D) moved to C. It matches the Digital Tradition ABC (in C) and the BBC Singing Together, Summer 1951 (in G, listed at folkinfo.org). G, is the low G under the staff.",
      bars: ["C2 D2 E2 C2", "C2 D2 E2 C2", "E2 F2 G4", "E2 F2 G4", "G1 A1 G1 F1 E2 C2", "G1 A1 G1 F1 E2 C2", "C2 G,2 C4", "C2 G,2 C4"]
    }
    ,"La Cucaracha": {
      place: "Mexico", key: "F", meter: "4/4", bpm: 116, pickup: 0,
      source: "La Cucaracha, Mexican folk song of the late 1800s. Tune only, no words. Notes from Jack Campin's Nine-Note Tunebook (ABC, in F), checked against Johan Ronstrom's FolkWiki transcription and the Musica Viva transcription (Frank Nordberg), both in D: the same pitches. The printed tune starts and ends with half-bar rests that join up, so here they close bar 16 and every bar adds up to a full bar. B is B flat in the F key.",
      bars: ["z1 C2 C1 F1 F1 A1 A1", "c3 A1- A2 z2", "z1 c2 d1 c1 B1 A1 c1", "B2 G2 z4", "z1 C2 C1 E1 E1 G1 G1", "B3 G1- G2 z2", "z1 c2 d1 c1 B1 A1 G1", "F4 z1 C1 C1 C1", "F3 A1 z1 C1 C1 C1", "F3 A1 z4", "z1 F1 F1 F1 E1 E1 D1 D1", "C4 z1 C1 C1 C1", "E3 G1 z1 C1 C1 C1", "E3 G1 z4", "z1 c2 d1 c1 B1 A1 G1", "F4 z4"]
    }
    ,"Simple Gifts": {
      place: "United States", key: "G", meter: "4/4", bpm: 96, pickup: 4,
      source: "Simple Gifts, Shaker dance song by Elder Joseph Brackett, 1848. Notes from the manuscript of Mary Hazzard (New Lebanon Shaker community), as transcribed by John Chambers for the Traditional Tune Archive (in C). The same 16 bars are the 'original C major form' on The Session. Moved from C down to G so every note fits the DJ Berty range (D to high D). F is F sharp in the G key. The first two notes are the 4-eighth pickup.",
      bars: ["D2 D2", "G2 G1 A1 B1 G1 B1 c1", "d2 d1 d1 B2 A1 G1", "A2 A2 A2 A2", "A1 B1 A1 F1 D2 D2", "G1 F1 G1 A1 B2 A1 A1", "B2 c2 d3 d1", "A2 A1 B1 A2 G1 G1", "A2 G1 F1 G4", "d4 B3 A1", "B1 c1 B1 A1 G3 A1", "B2 B1 c1 d2 B2", "A2 A1 B1 A3 D1", "G4 G3 A1", "B2 B1 c1 d2 d1 d1", "A2 A2 B2 B1 A1", "G2 G2 G4"]
    }
    ,"Amazing Grace": {
      place: "many places", key: "G", meter: "3/4", bpm: 72, pickup: 2,
      source: "Amazing Grace, the tune New Britain / Harmony Grove (first printed in The Columbian Harmony, 1829, per Flutopedia). Melody only, no words. Notes follow the John Chambers collection file Amazing_Grace_1.abc (credited to Carrell and Clayton, The Virginia Harmony, 1831). The pitches agree with the Musica Viva transcription (Frank Nordberg), Nigel Gatherer's tune book (tb15) and Soodlum's Irish Tin Whistle Book. The little three-note ornament in some copies is left out. The first note is a one-beat pickup; the last bar is the short bar that completes it.",
      bars: ["D2", "G4 B1 G1", "B4 A2", "G4 E2", "D4 D2", "G4 B1 G1", "B4 A1 B1", "d6-", "d2 z2 B2", "d4 B1 G1", "B4 A2", "G4 E2", "D4 D2", "G4 B1 G1", "B4 A2", "G6-", "G4"]
    }
  };

  var TOKEN = /^(z|G,|A,|B,|[A-G]|[c-e])([1-8])(-?)$/;

  function parseBar(text) {
    return String(text).trim().split(/\s+/).map(function (tok) {
      var m = TOKEN.exec(tok);
      if (!m) throw new Error("DJ Berty songs: bad note '" + tok + "'");
      return { p: m[1] === "z" ? null : m[1], d: Number(m[2]), tie: m[3] === "-" };
    });
  }

  // The measures the song model reads: one measure per bar string.
  function measuresOf(entry, name) {
    return entry.bars.map(function (bar, i) {
      return { id: "n" + i, label: String(i + 1), notes: parseBar(bar) };
    });
  }

  var out = {};
  Object.keys(SONGS).forEach(function (name) {
    var e = SONGS[name];
    out[name] = {
      name: name, place: e.place, key: e.key, meter: e.meter, bpm: e.bpm, pickup: e.pickup, source: e.source,
      measures: measuresOf(e, name),
    };
  });
  root.MU_SONGS = out;
})(window);
