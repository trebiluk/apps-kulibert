/* Class titles only. Kids pick from this list. They do not type one. */
(function (global) {
  var TITLES = [
    "First Beat",
    "Clap Class",
    "Recess",
    "Night Walk",
    "Locker Boom",
    "Blank page",
    "Hallway Loop",
    "Late Bell",
    "Comet Pulse",
    "Pixel Sketch",
    "Pocket Jam",
    "Skyline Beat",
    "Paper Loop",
    "Demo",
    "March",
    "Skip",
    "Class beat",
    "Warm Up",
    "Drum Line",
    "Soft Grid",
    "Bright Loop",
    "Quiet Step",
    "Room Tone",
    "Last Bell",
    "Written",
    "Score",
  ];

  function safeTitle(value, fallback) {
    var text = String(value || "").replace(/[~<>]/g, " ").replace(/\s+/g, " ").trim();
    var i;
    for (i = 0; i < TITLES.length; i++) {
      if (TITLES[i].toLowerCase() === text.toLowerCase()) return TITLES[i];
    }
    return fallback == null ? "Class beat" : fallback;
  }

  function pickTitle(except) {
    var pool = [];
    var i;
    for (i = 0; i < TITLES.length; i++) {
      if (TITLES[i] === "Blank page" || TITLES[i] === except) continue;
      pool.push(TITLES[i]);
    }
    return pool[Math.floor(Math.random() * pool.length)] || "Class beat";
  }

  function choices(count, current) {
    var out = [];
    var safe = safeTitle(current, "");
    var guard = 0;
    if (safe) out.push(safe);
    while (out.length < count && guard < 60) {
      var next = pickTitle("");
      if (out.indexOf(next) < 0) out.push(next);
      guard += 1;
    }
    return out;
  }

  function nextTitle(current) {
    var safe = safeTitle(current, "");
    var start = TITLES.indexOf(safe);
    var i = start < 0 ? 0 : (start + 1) % TITLES.length;
    if (TITLES[i] === "Blank page") i = (i + 1) % TITLES.length;
    return TITLES[i];
  }

  global.KulibertTitles = {
    TITLES: TITLES,
    safeTitle: safeTitle,
    pickTitle: pickTitle,
    choices: choices,
    nextTitle: nextTitle,
  };
})(window);
