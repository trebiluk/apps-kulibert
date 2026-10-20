/* Hub board tiles and tabs. Reads KulibertBoards. No free-text names. */
(function () {
  var tab = "class";
  var openGame = "";
  var openBoard = "";

  function t(key, fallback) {
    try {
      if (window.KulibertI18n && typeof window.KulibertI18n.t === "function") {
        var word = window.KulibertI18n.t(key);
        if (word && word !== key) return word;
      }
    } catch (e) {}
    return fallback;
  }

  function fmt(row, board) {
    if (!row) return "—";
    var n = row.value;
    var text = Number.isInteger(n) ? String(n) : String(Math.round(n * 10) / 10);
    return board && board.unit ? text + " " + board.unit : text;
  }

  function paintAlias(sel) {
    var api = window.KulibertBoards;
    if (!sel || !api) return;
    var current = api.alias();
    sel.replaceChildren();
    var blank = document.createElement("option");
    blank.value = "";
    blank.textContent = t("lbPickAlias", "Pick an alias");
    sel.appendChild(blank);
    api.words().forEach(function (name) {
      var opt = document.createElement("option");
      opt.value = name;
      opt.textContent = name;
      if (name === current) opt.selected = true;
      sel.appendChild(opt);
    });
  }

  function line(rank, alias, score) {
    var row = document.createElement("li");
    row.className = "lb-row";
    var r = document.createElement("span");
    r.className = "lb-rank";
    r.textContent = rank ? "#" + rank : "";
    var a = document.createElement("span");
    a.className = "lb-alias";
    a.textContent = alias || "";
    var s = document.createElement("span");
    s.className = "lb-score";
    s.textContent = score || "";
    row.appendChild(r);
    row.appendChild(a);
    row.appendChild(s);
    row.setAttribute("aria-label", (rank ? "Rank " + rank + ", " : "") + (alias || "") + ", " + (score || ""));
    return row;
  }

  function paint() {
    var api = window.KulibertBoards;
    var root = document.getElementById("boards");
    if (!api || !root) return;
    var badge = document.getElementById("boards-held");
    if (badge) {
      var held = api.recordsHeld();
      badge.textContent = held ? t("lbHeld", "records held") + " " + held : "";
      badge.hidden = !held;
    }
    var schoolBtn = document.querySelector('[data-lb-tab="school"]');
    if (schoolBtn) schoolBtn.hidden = !api.schoolOn();
    if (tab === "school" && !api.schoolOn()) tab = "class";
    document.querySelectorAll("[data-lb-tab]").forEach(function (btn) {
      btn.setAttribute("aria-pressed", btn.getAttribute("data-lb-tab") === tab ? "true" : "false");
    });
    var tiles = document.getElementById("board-tiles");
    if (tiles) {
      tiles.replaceChildren();
      api.games().forEach(function (game) {
        game.boards.forEach(function (board) {
          var mine = api.myBest(game.id, board.id);
          var top = api.classRecord(game.id, board.id);
          var note = api.rankNote();
          var card = document.createElement("article");
          card.className = "lb-tile";
          var h = document.createElement("h3");
          h.textContent = game.name + " · " + board.name;
          card.appendChild(h);
          var mineP = document.createElement("p");
          mineP.textContent = t("lbMyBest", "My best") + ": " + fmt(mine, board);
          card.appendChild(mineP);
          var topP = document.createElement("p");
          topP.textContent = t("lbClassRecord", "Class record") + ": " + (top ? top.alias + " " + fmt(top, board) : "—");
          card.appendChild(topP);
          if (note.took && note.took.game === game.id && note.took.board === board.id) {
            var win = document.createElement("p");
            win.className = "lb-note";
            win.textContent = "🏆 " + t("lbTook", "You took #1");
            card.appendChild(win);
          }
          if (note.taken && note.taken.game === game.id && note.taken.board === board.id) {
            var lost = document.createElement("p");
            lost.className = "lb-note";
            lost.textContent = "⚑ " + t("lbTaken", "Your record was taken");
            card.appendChild(lost);
          }
          var beat = document.createElement("button");
          beat.type = "button";
          beat.className = "lb-beat";
          beat.textContent = t("lbBeat", "Beat it");
          beat.setAttribute("aria-label", t("lbBeat", "Beat it") + " " + game.name + " " + board.name);
          beat.addEventListener("click", function () {
            openGame = game.id;
            openBoard = board.id;
            tab = "class";
            paint();
            var panel = document.getElementById("board-panel");
            if (panel) panel.focus();
          });
          card.appendChild(beat);
          tiles.appendChild(card);
        });
      });
    }
    var panel = document.getElementById("board-panel");
    var list = document.getElementById("board-list");
    if (!panel || !list) return;
    var game = api.games().filter(function (g) { return g.id === openGame; })[0] || api.games()[0];
    var board = game.boards.filter(function (b) { return b.id === openBoard; })[0] || game.boards[0];
    openGame = game.id;
    openBoard = board.id;
    var view = api.view(tab, game.id, board.id);
    var title = document.getElementById("board-title");
    if (title) title.textContent = game.name + " · " + board.name + " · " + t(tab === "my" ? "lbTabMy" : tab === "class" ? "lbTabClass" : tab === "school" ? "lbTabSchool" : "lbTabWeek", tab);
    list.replaceChildren();
    view.rows.forEach(function (row, i) {
      list.appendChild(line(i + 1, row.alias, fmt(row, board)));
    });
    var me = document.getElementById("board-me");
    if (me) {
      me.textContent = view.mine > 0
        ? t("lbMyRank", "My rank") + " #" + view.mine + (view.me ? " · " + fmt(view.me, board) : "")
        : t("lbMyRank", "My rank") + " —";
    }
  }

  function boot() {
    var api = window.KulibertBoards;
    if (!api || !document.getElementById("boards")) return;
    var sel = document.getElementById("lb-alias");
    paintAlias(sel);
    if (sel) sel.addEventListener("change", function () {
      api.setAlias(sel.value);
      paint();
    });
    document.querySelectorAll("[data-lb-tab]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        tab = btn.getAttribute("data-lb-tab") || "class";
        paint();
      });
    });
    document.addEventListener("kulibert-boards", paint);
    window.addEventListener("storage", paint);
    window.addEventListener("focus", function () { api.pull && api.pull().then(paint); });
    if (api.pull) api.pull().then(paint);
    paint();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
