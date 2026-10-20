/* Hub-wide boards. Alias and class code only. No real names, no free-text names.
   Kids pick an alias from the same word list as the staff dropdown.
   Scores live on this Chromebook and try the TechWorks board API. */
(function (root) {
  var KEY = "kulibert-boards-v1";
  var ALIAS = "kulibert-boards-alias";
  var CLASS = "kulibert-boards-class";
  var HIDE = "kulibert-boards-hide";
  var SCHOOL = "kulibert-boards-school";
  var NOTES = "kulibert-boards-notes";
  var API = "https://tw.kulibert.net/api/boards";
  var MAX = 400;

  var ADJ = ["Swift", "Bright", "Calm", "Keen", "Bold", "Quiet", "Rapid", "Solid"];
  var ANIMAL = ["Otter", "Robin", "Panda", "Fox", "Whale", "Heron", "Gopher", "Beetle"];
  var NUM = ["12", "24", "36", "42"];

  var GAMES = [
    { id: "rampfill", name: "Ramp & Fill", href: "/rampfill/", boards: [{ id: "pieces", name: "Fewest pieces", unit: "", higher: false, min: 1, max: 500 }] },
    { id: "holdit", name: "HoldIt", href: "/holdit/", boards: [
      { id: "span", name: "Span", unit: "m", higher: true, min: 0.1, max: 200 },
      { id: "spire", name: "Spire", unit: "m", higher: true, min: 0.1, max: 200 }
    ] },
    { id: "berty-run", name: "Berty's Run", href: "/berty-run/", boards: [{ id: "time", name: "Level time", unit: "s", higher: false, min: 1, max: 3600 }] },
    { id: "catapult", name: "Bertapult", href: "/catapult/", boards: [{ id: "distance", name: "Distance", unit: "m", higher: true, min: 0.1, max: 500 }] }
  ];

  function words() {
    var out = [];
    ADJ.forEach(function (a) {
      ANIMAL.forEach(function (n) {
        NUM.forEach(function (k) { out.push(a + " " + n + " " + k); });
      });
    });
    return out;
  }

  function allowed() {
    var set = {};
    words().forEach(function (name) { set[name.toLowerCase()] = name; });
    return set;
  }

  function cleanAlias(raw) {
    var name = String(raw || "").replace(/\s+/g, " ").trim();
    return allowed()[name.toLowerCase()] || "";
  }

  function readBag() {
    try {
      var data = JSON.parse(localStorage.getItem(KEY) || "null");
      if (data && data.v === 1 && Array.isArray(data.rows)) return data;
    } catch (e) {}
    return { v: 1, rows: [] };
  }

  function writeBag(bag) {
    bag.rows = bag.rows.slice(-MAX);
    try { localStorage.setItem(KEY, JSON.stringify(bag)); } catch (e) {}
  }

  function alias() {
    var who = "";
    try {
      var row = root.KulibertWho && root.KulibertWho.read && root.KulibertWho.read();
      who = cleanAlias(row && row.alias);
    } catch (e) {}
    if (who) return who;
    try { return cleanAlias(localStorage.getItem(ALIAS)); } catch (e2) { return ""; }
  }

  function setAlias(name) {
    var ok = cleanAlias(name);
    if (!ok) return "";
    try { localStorage.setItem(ALIAS, ok); } catch (e) {}
    return ok;
  }

  function classCode() {
    try {
      var stored = String(localStorage.getItem(CLASS) || "").replace(/[^A-Za-z0-9]/g, "").slice(0, 8);
      if (stored) return stored.toUpperCase();
    } catch (e) {}
    try {
      var who = root.KulibertWho && root.KulibertWho.read && root.KulibertWho.read();
      var code = String(who && who.code || "").replace(/[^A-Za-z0-9]/g, "").slice(0, 8);
      if (code) return code.toUpperCase();
    } catch (e2) {}
    return "SMS";
  }

  function setClass(code) {
    var clean = String(code || "").replace(/[^A-Za-z0-9]/g, "").slice(0, 8).toUpperCase();
    if (!clean) return classCode();
    try { localStorage.setItem(CLASS, clean); } catch (e) {}
    return clean;
  }

  function hidden() {
    try {
      var list = JSON.parse(localStorage.getItem(HIDE) || "[]");
      return Array.isArray(list) ? list.map(function (n) { return String(n).toLowerCase(); }) : [];
    } catch (e) { return []; }
  }

  function hideAlias(name) {
    var ok = cleanAlias(name);
    if (!ok) return hidden();
    var list = hidden();
    if (list.indexOf(ok.toLowerCase()) < 0) list.push(ok.toLowerCase());
    try { localStorage.setItem(HIDE, JSON.stringify(list)); } catch (e) {}
    return list;
  }

  function schoolOn() {
    try { return localStorage.getItem(SCHOOL) !== "0"; } catch (e) { return true; }
  }

  function setSchool(on) {
    try { localStorage.setItem(SCHOOL, on ? "1" : "0"); } catch (e) {}
    return schoolOn();
  }

  function notes() {
    try {
      var data = JSON.parse(localStorage.getItem(NOTES) || "null");
      if (data && data.v === 1) return data;
    } catch (e) {}
    return { v: 1, took: {}, taken: {} };
  }

  function writeNotes(data) {
    try { localStorage.setItem(NOTES, JSON.stringify(data)); } catch (e) {}
  }

  function gameOf(id) {
    for (var i = 0; i < GAMES.length; i++) if (GAMES[i].id === id) return GAMES[i];
    return null;
  }

  function boardOf(game, id) {
    if (!game) return null;
    for (var i = 0; i < game.boards.length; i++) if (game.boards[i].id === id) return game.boards[i];
    return null;
  }

  function inBounds(board, value) {
    if (!board || !Number.isFinite(value)) return false;
    return value >= board.min && value <= board.max;
  }

  function better(board, a, b) {
    if (a == null) return false;
    if (b == null) return true;
    return board.higher ? a > b : a < b;
  }

  function weekStart() {
    var now = new Date();
    var parts = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/New_York", weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23"
    }).formatToParts(now);
    var map = {};
    parts.forEach(function (p) { map[p.type] = p.value; });
    var days = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    var day = days[map.weekday] || 0;
    var back = (day + 6) % 7;
    var ms = now.getTime() - back * 86400000;
    var et = new Date(ms);
    var ymd = new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit" }).format(et);
    return Date.parse(ymd + "T00:00:00-04:00") || (now.getTime() - back * 86400000);
  }

  function rows() {
    return readBag().rows.filter(function (row) {
      return row && cleanAlias(row.alias) && hidden().indexOf(String(row.alias).toLowerCase()) < 0;
    });
  }

  function bestOf(list, board) {
    var best = null;
    list.forEach(function (row) {
      if (!best || better(board, row.value, best.value)) best = row;
    });
    return best;
  }

  function rankOf(list, board, name) {
    var byAlias = {};
    list.forEach(function (row) {
      var cur = byAlias[row.alias];
      if (!cur || better(board, row.value, cur.value)) byAlias[row.alias] = row;
    });
    var ranked = Object.keys(byAlias).map(function (k) { return byAlias[k]; });
    ranked.sort(function (a, b) { return better(board, a.value, b.value) ? -1 : 1; });
    var mine = -1;
    for (var i = 0; i < ranked.length; i++) if (ranked[i].alias === name) { mine = i + 1; break; }
    return { ranked: ranked, mine: mine };
  }

  function post(event) {
    var game = gameOf(event && event.game);
    var board = boardOf(game, event && event.board);
    var name = cleanAlias((event && event.alias) || alias());
    var value = Number(event && event.value);
    if (!game || !board || !name || !inBounds(board, value)) return null;
    var cls = String((event && event.classCode) || classCode()).replace(/[^A-Za-z0-9]/g, "").slice(0, 8).toUpperCase() || "SMS";
    var before = rankOf(rows().filter(function (row) {
      return row.game === game.id && row.board === board.id && row.classCode === cls;
    }), board, name);
    var oldTop = before.ranked[0] || null;
    var row = {
      alias: name,
      classCode: cls,
      game: game.id,
      board: board.id,
      value: Math.round(value * 100) / 100,
      unit: board.unit,
      higher: board.higher,
      kit: String(event && event.kit || "").slice(0, 16),
      version: String(event && event.version || "").slice(0, 16),
      ts: Date.now(),
      verified: true
    };
    var bag = readBag();
    bag.rows.push(row);
    writeBag(bag);
    var after = rankOf(rows().filter(function (item) {
      return item.game === game.id && item.board === board.id && item.classCode === cls;
    }), board, name);
    if (after.mine === 1 && oldTop && oldTop.alias !== name) {
      var pack = notes();
      pack.took[name] = { game: game.id, board: board.id, at: row.ts };
      pack.taken[oldTop.alias] = { game: game.id, board: board.id, by: name, at: row.ts };
      writeNotes(pack);
    }
    try { root.dispatchEvent(new CustomEvent("kulibert-boards", { detail: row })); } catch (e) {}
    try {
      fetch(API, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(row)
      }).catch(function () {});
    } catch (e2) {}
    return row;
  }

  function view(tab, gameId, boardId) {
    var game = gameOf(gameId) || GAMES[0];
    var board = boardOf(game, boardId) || game.boards[0];
    var name = alias();
    var cls = classCode();
    var list = rows().filter(function (row) { return row.game === game.id && row.board === board.id; });
    if (tab === "class") list = list.filter(function (row) { return row.classCode === cls; });
    if (tab === "week") {
      var start = weekStart();
      list = list.filter(function (row) { return row.ts >= start && row.classCode === cls; });
    }
    if (tab === "my") list = list.filter(function (row) { return row.alias === name; });
    var ranked = rankOf(list, board, name);
    return {
      game: game,
      board: board,
      rows: ranked.ranked.slice(0, 10),
      mine: ranked.mine,
      me: ranked.ranked.filter(function (row) { return row.alias === name; })[0] || null
    };
  }

  function myBest(gameId, boardId) {
    var game = gameOf(gameId);
    var board = boardOf(game, boardId);
    if (!board) return null;
    var name = alias();
    return bestOf(rows().filter(function (row) {
      return row.game === gameId && row.board === boardId && row.alias === name;
    }), board);
  }

  function classRecord(gameId, boardId) {
    var game = gameOf(gameId);
    var board = boardOf(game, boardId);
    if (!board) return null;
    var cls = classCode();
    return bestOf(rows().filter(function (row) {
      return row.game === gameId && row.board === boardId && row.classCode === cls;
    }), board);
  }

  function recordsHeld() {
    var name = alias();
    var n = 0;
    GAMES.forEach(function (game) {
      game.boards.forEach(function (board) {
        var top = classRecord(game.id, board.id);
        if (top && top.alias === name) n += 1;
      });
    });
    return n;
  }

  function rankNote(name) {
    var pack = notes();
    var who = name || alias();
    return { took: pack.took[who] || null, taken: pack.taken[who] || null };
  }

  function resetBoard(gameId, boardId) {
    var bag = readBag();
    bag.rows = bag.rows.filter(function (row) { return !(row.game === gameId && row.board === boardId); });
    writeBag(bag);
    return bag.rows.length;
  }

  function pull() {
    var cls = classCode();
    return fetch(API + "?class=" + encodeURIComponent(cls)).then(function (res) {
      if (!res.ok) return null;
      return res.json();
    }).then(function (pack) {
      if (!pack || !Array.isArray(pack.rows)) return null;
      var bag = readBag();
      var seen = {};
      bag.rows.forEach(function (row) { seen[row.alias + "|" + row.game + "|" + row.board + "|" + row.ts] = true; });
      pack.rows.forEach(function (row) {
        var name = cleanAlias(row && row.alias);
        var game = gameOf(row && row.game);
        var board = boardOf(game, row && row.board);
        var value = Number(row && row.value);
        if (!name || !board || !inBounds(board, value)) return;
        var key = name + "|" + game.id + "|" + board.id + "|" + row.ts;
        if (seen[key]) return;
        bag.rows.push({
          alias: name, classCode: String(row.classCode || cls).slice(0, 8),
          game: game.id, board: board.id, value: value, unit: board.unit, higher: board.higher,
          kit: String(row.kit || "").slice(0, 16), version: String(row.version || "").slice(0, 16),
          ts: Number(row.ts) || Date.now(), verified: true
        });
      });
      writeBag(bag);
      return bag.rows.length;
    }).catch(function () { return null; });
  }

  root.KulibertBoards = {
    post: post,
    view: view,
    myBest: myBest,
    classRecord: classRecord,
    recordsHeld: recordsHeld,
    rankNote: rankNote,
    games: function () { return GAMES; },
    words: words,
    alias: alias,
    setAlias: setAlias,
    classCode: classCode,
    setClass: setClass,
    hideAlias: hideAlias,
    schoolOn: schoolOn,
    setSchool: setSchool,
    resetBoard: resetBoard,
    pull: pull
  };
})(window);
