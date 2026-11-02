    (function () {
      var KEY = "tech-room-opened";
      var CUT_KEY = "tech-room-shortcuts";
      var MAX = 18;
      var POLL = 40000;
      var appBoard = document.getElementById("app-groups");
      var hubAliasesOn = true;
      /* Scored doors call KulibertWho.record (mark is the line shim). Classic keeps the old list. */
      var TW_OLD = { visualizer: 1, bertybots: 1, spancraft: 1, "spire-lab": 1, ginger: 1, drawin: 1, musiclab: 1, bertybeatz: 1, debugzy: 1 };
      var TW_READ = { visualizer: 1, bertybots: 1, spancraft: 1, "spire-lab": 1, drawin: 1, musiclab: 1, bertybeatz: 1, debugzy: 1, "berty-run": 1, holdit: 1 };
      function paintAliasGate() {
        document.documentElement.classList.toggle("hub-alias-off", !hubAliasesOn);
        var slot = document.getElementById("tw-session-slot");
        if (slot) slot.hidden = !hubAliasesOn;
        var bar = document.getElementById("who-bar");
        if (bar) bar.hidden = !hubAliasesOn;
        var alias = document.getElementById("who-alias");
        if (alias) alias.hidden = !hubAliasesOn;
        syncFrameSession();
      }
      function syncFrameSession() {
        var frame = document.getElementById("app-frame");
        if (!frame || !frame.contentWindow) return;
        try {
          frame.contentWindow.postMessage({ type: "tw-hide", hide: true }, location.origin);
        } catch (eSync) {}
      }
      function paintTw() {
        if (!appBoard) return;
        var badgeSet = hubClassic ? TW_OLD : TW_READ;
        var lines = window.KulibertWho && KulibertWho.lines ? KulibertWho.lines() : {};
        appBoard.querySelectorAll("a.tile[data-id]").forEach(function (tile) {
          var id = tile.getAttribute("data-id");
          var mark = tile.querySelector(".tw-on");
          if (!badgeSet[id]) {
            if (mark && mark.parentNode) mark.parentNode.removeChild(mark);
            return;
          }
          if (!mark) {
            mark = document.createElement("span");
            mark.className = "tw-on";
            mark.innerHTML = '<img src="/icons/icon-tw-mark.svg" alt="" width="14" height="14"/><span class="tw-line"></span>';
            tile.appendChild(mark);
          }
          var line = mark.querySelector(".tw-line");
          if (!line) {
            mark.innerHTML = '<img src="/icons/icon-tw-mark.svg" alt="" width="14" height="14"/><span class="tw-line"></span>';
            line = mark.querySelector(".tw-line");
          }
          var text = lines[id] || ((window.KulibertI18n && KulibertI18n.t("twConnected")) || "TW Connected");
          line.textContent = text;
          if (lines[id]) line.removeAttribute("data-i18n");
          else line.setAttribute("data-i18n", "twConnected");
          mark.title = hubClassic
            ? "In the Tech Room. Scores and settings stay on this Chromebook."
            : "Your scores go to TechWorks";
        });
      }
      paintTw();
      window.addEventListener("kulibert-lang", function () { paintTw(); });
      function paintWho() {
        var bar = document.getElementById("who-bar");
        var input = document.getElementById("who-alias");
        var code = document.getElementById("who-code");
        var keep = document.getElementById("who-keep");
        if (!bar || !window.KulibertWho) return;
        var who = KulibertWho.read();
        if (who && input && document.activeElement !== input) input.value = who.alias;
        if (code) code.textContent = who ? who.alias + " · " + who.code + ". TechWorks keeps this code." : "No real names. This code is what TechWorks keeps.";
        if (keep) keep.textContent = who ? "Change" : "Keep";
      }
      function flushMarks() {
        var who = window.KulibertWho;
        if (!who || !who.flush) return;
        who.flush();
      }
      var whoBar = document.getElementById("who-bar");
      if (whoBar) whoBar.addEventListener("submit", function (event) {
        event.preventDefault();
        if (!hubAliasesOn) return;
        var input = document.getElementById("who-alias");
        if (!window.KulibertWho || !input) return;
        var who = KulibertWho.write(input.value);
        if (!who) return;
        paintWho();
        paintTw();
        flushMarks();
      });
      paintWho();
      window.addEventListener("storage", function () { paintTw(); paintWho(); });
      var hubSort = "alpha";
      var hubFilter = "all";
      var hubClassic = false;
      try {
        var hubParam = new URL(location.href).searchParams.get("hub");
        if (hubParam === "classic") {
          hubClassic = true;
          localStorage.setItem("tech-room-hub", "classic");
        } else if (hubParam === "new") {
          localStorage.removeItem("tech-room-hub");
        } else if (localStorage.getItem("tech-room-hub") === "classic") {
          hubClassic = true;
        }
      } catch (eClassic) {}
      document.body.classList.toggle("hub-classic", hubClassic);
      function readDockNames() {
        if (hubClassic) return true;
        try {
          var dockParam = new URL(location.href).searchParams.get("dock");
          if (dockParam === "names") localStorage.setItem("tech-room-dock-names", "1");
          else if (dockParam === "icons") localStorage.removeItem("tech-room-dock-names");
          return localStorage.getItem("tech-room-dock-names") === "1";
        } catch (eDock) { return false; }
      }
      document.body.classList.toggle("dock-names", readDockNames());
      try {
        var savedSort = localStorage.getItem("tech-room-sort");
        hubSort = savedSort === "za" ? "za" : "alpha";
        localStorage.setItem("tech-room-sort", hubSort);
      } catch (eSort) {}
      Array.prototype.forEach.call(appBoard.querySelectorAll(".group"), function (group) {
        var g = group.getAttribute("data-group");
        if (!g || g === "alpha") return;
        var home = group.querySelector(".board");
        if (!home) return;
        var n = 0;
        Array.prototype.forEach.call(home.children, function (tile) {
          if (!tile.classList || !tile.classList.contains("tile")) return;
          tile.setAttribute("data-group", g);
          tile.setAttribute("data-order", String(n));
          n += 1;
        });
      });
      var input = document.getElementById("q");
      var opened = document.getElementById("opened");
      var list = document.getElementById("opened-list");
      var board = document.getElementById("cut-board");
      var modal = document.getElementById("cut-modal");
      var form = document.getElementById("cut-form");
      var nameEl = document.getElementById("cut-name");
      var urlEl = document.getElementById("cut-url");
      var errEl = document.getElementById("cut-error");
      var titleEl = document.getElementById("cut-title");
      var removeEl = document.getElementById("cut-remove");
      var iconBox = document.getElementById("cut-icons");
      var schoolBoard = document.getElementById("school-board");
      var schoolWrap = document.getElementById("school-wrap");
      var schoolNoteEl = document.getElementById("school-note");
      var editingId = null;
      var picked = "link";
      var schoolRows = [];
      var schoolNote = "";
      var schoolSig = "";
      var roomHidden = [];
      var roomAllowCuts = true;
      var roomAllowPaste = true;
      var roomMax = 18;
      var roomStaffEdit = true;
      var roomHotkeys = true;
      var roomNewTab = true;
      var roomOutsideShell = [];
      var roomShowNote = true;
      var tileOrder = appTiles().map(function (t) { return t.getAttribute("data-id"); });
      var ICONS = {
        link: '<path d="M9 17H7A5 5 0 0 1 7 7h2"/><path d="M15 7h2a5 5 0 1 1 0 10h-2"/><line x1="8" x2="16" y1="12" y2="12"/>',
        globe: '<circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>',
        bookmark: '<path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>',
        video: '<path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5"/><rect x="2" y="6" width="14" height="12" rx="2"/>',
        file: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/>',
        game: '<line x1="6" x2="10" y1="11" y2="11"/><line x1="8" x2="8" y1="9" y2="13"/><line x1="15" x2="15.01" y1="12" y2="12"/><line x1="18" x2="18.01" y1="10" y2="10"/><path d="M17.32 5H6.68a4 4 0 0 0-3.978 3.59c-.006.052-.01.101-.017.152C2.604 9.416 2 14.456 2 16a3 3 0 0 0 3 3c1 0 1.5-.5 2-1l1.414-1.414A2 2 0 0 1 9.828 16h4.344a2 2 0 0 1 1.414.586L17 18c.5.5 1 1 2 1a3 3 0 0 0 3-3c0-1.545-.604-6.584-.685-7.258-.007-.05-.011-.1-.017-.151A4 4 0 0 0 17.32 5z"/>',
        music: '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
        calc: '<rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" x2="16" y1="6" y2="6"/><line x1="16" x2="16" y1="14" y2="18"/><path d="M16 10h.01"/><path d="M12 10h.01"/><path d="M8 10h.01"/><path d="M12 14h.01"/><path d="M8 14h.01"/><path d="M12 18h.01"/><path d="M8 18h.01"/>',
        news: '<path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/><path d="M18 14h-8"/><path d="M15 18h-5"/><path d="M10 6h8v4h-8V6Z"/>',
        school: '<path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.839l8.57 3.908a2 2 0 0 0 1.66 0z"/><path d="M22 10v6"/><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/>'
      };


      /* Search, slash keys, and result grouping follow Homer (Apache-2.0).
         Copyright 2018 Bastien Wirtz. See /NOTICE. Subsequence match is added
         so a short Chromebook query still hits. */
      function matchScore(hay, needle) {
        hay = String(hay || "").toLowerCase();
        needle = String(needle || "").toLowerCase().trim();
        if (!needle) return 0;
        var at = hay.indexOf(needle);
        if (at === 0) return 0;
        if (at > 0) return 1;
        var words = hay.split(/[^a-z0-9]+/).filter(Boolean);
        var initials = words.map(function (word) { return word.charAt(0); }).join("");
        if (initials.indexOf(needle) !== -1) return 2;
        return 99;
      }
      function fuzzyHit(hay, needle) {
        return matchScore(hay, needle) < 99;
      }
      function tileBlob(tile) {
        var label = tile.querySelector(".label");
        return (label ? label.textContent : "") + " " + (tile.getAttribute("data-keywords") || "") + " " + (tile.getAttribute("href") || "");
      }
      function bestTile() {
        var q = (input.value || "").trim();
        var tiles = launchTiles();
        if (!q) return tiles[0] || null;
        var best = null;
        var bestScore = 99;
        tiles.forEach(function (tile) {
          var score = matchScore(tileBlob(tile), q);
          if (score < bestScore) { bestScore = score; best = tile; }
        });
        return best;
      }

      function svg(inner) {
        return '<svg viewBox="0 0 24 24" aria-hidden="true">' + inner + "</svg>";
      }

      function appTiles() {
        return Array.prototype.slice.call(appBoard.querySelectorAll("a.tile:not(#keep-going)"));
      }

      function launchTiles() {
        var apps = appTiles().filter(function (tile) { return !tile.classList.contains("is-hidden") && !tile.classList.contains("is-room-hidden"); });
        var school = Array.prototype.slice.call(schoolBoard.querySelectorAll("a.tile"));
        var cuts = Array.prototype.slice.call(board.querySelectorAll("a.tile"));
        return apps.concat(school).concat(cuts);
      }

      function looksLikeUrl(raw) {
        var value = (raw || "").trim();
        if (!value || /\s/.test(value)) return false;
        if (/^https?:\/\//i.test(value)) return true;
        return /^[\w.-]+\.[a-z]{2,}([/:?#].*)?$/i.test(value);
      }

      function nameFromHost(raw) {
        var url = cleanUrl(raw);
        if (url.error) return "";
        try { return new URL(url.href).hostname.replace(/^www\./i, "").slice(0, 24); }
        catch (e) { return ""; }
      }

      function hrefKey(href) {
        try {
          var url = new URL(href);
          var path = url.pathname.replace(/\/+$/, "");
          return (url.protocol + "//" + url.host.toLowerCase() + path + url.search).toLowerCase();
        } catch (e) {
          return String(href || "").replace(/\/+$/, "").toLowerCase();
        }
      }

      function read() {
        try {
          var parsed = JSON.parse(localStorage.getItem(KEY) || "[]");
          if (!Array.isArray(parsed)) return [];
          return parsed.map(function (item) {
            if (typeof item === "string") {
              var tile = appTiles().filter(function (t) { return t.getAttribute("data-id") === item; })[0];
              if (!tile) return null;
              return { id: item, name: tile.querySelector(".label").textContent, href: tile.getAttribute("href") };
            }
            if (item && item.href && item.name) {
              return { id: String(item.id || ""), name: String(item.name).slice(0, 24), href: String(item.href) };
            }
            return null;
          }).filter(Boolean).slice(0, 6);
        } catch (e) {
          return [];
        }
      }

      function write(rows) {
        try { localStorage.setItem(KEY, JSON.stringify(rows.slice(0, 6))); } catch (e) {}
      }

      function readCuts() {
        try {
          var parsed = JSON.parse(localStorage.getItem(CUT_KEY) || "[]");
          return Array.isArray(parsed) ? parsed.filter(function (row) {
            return row && typeof row.id === "string" && typeof row.name === "string" && typeof row.href === "string";
          }) : [];
        } catch (e) {
          return [];
        }
      }

      function writeCuts(rows) {
        try { localStorage.setItem(CUT_KEY, JSON.stringify(rows.slice(0, roomMax || MAX))); } catch (e) {}
      }

      function cleanUrl(raw) {
        var value = (raw || "").trim();
        if (!value) return { error: "Paste a web address." };
        if (!/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(value)) value = "https://" + value;
        var url;
        try { url = new URL(value); } catch (e) { return { error: "That address is not a valid link." }; }
        if (url.protocol !== "http:" && url.protocol !== "https:") return { error: "Only http and https links." };
        if (url.username || url.password) return { error: "Links cannot include a username or password." };
        if (url.href.length > 2048) return { error: "That link is too long." };
        var door = schoolHref(url.href);
        if (!door) return { error: "That site is blocked at school. Use the Tech Room door." };
        return { href: door };
      }

      function paint() {
        var rows = read();
        list.innerHTML = "";
        rows.forEach(function (row) {
          var li = document.createElement("li");
          var a = document.createElement("a");
          var door = schoolHref(row.href);
          if (!door) return;
          a.href = door;
          a.rel = "noopener noreferrer";
          a.textContent = row.name;
          a.addEventListener("click", function () { remember(row); });
          li.appendChild(a);
          list.appendChild(li);
        });
        opened.hidden = rows.length === 0;
      }

      function remember(entry) {
        var href = entry.href;
        var rows = read().filter(function (item) { return item.href !== href; });
        rows.unshift({ id: entry.id || "", name: entry.name, href: href });
        write(rows);
        paint();
      }

      function entryFromTile(tile) {
        return {
          id: tile.getAttribute("data-id") || "",
          name: tile.querySelector(".label").textContent,
          href: tile.getAttribute("href")
        };
      }

      function paintSchool() {
        if (!schoolBoard) return;
        var q = (input.value || "").trim().toLowerCase();
        schoolBoard.innerHTML = "";
        var n = 0;
        if (schoolNoteEl) {
          schoolNoteEl.textContent = schoolNote;
          schoolNoteEl.hidden = !schoolNote || !roomShowNote;
        }
        schoolRows.forEach(function (row) {
          var hit = fuzzyHit(row.name + " " + row.href, q);
          if (!hit) return;
          var a = document.createElement("a");
          a.className = "tile";
          var door = schoolHref(row.href);
          if (!door) return;
          a.href = door;
          a.rel = "noopener noreferrer";
          a.innerHTML = svg(ICONS[row.icon] || ICONS.school || ICONS.link) + '<span class="label"></span>';
          a.querySelector(".label").textContent = row.name;
          if (roomNewTab && isExternalHref(door)) { a.target = "_blank"; a.rel = "noopener noreferrer"; }
          a.addEventListener("click", function () { remember(row); });
          schoolBoard.appendChild(a);
          n += 1;
        });
        if (schoolWrap) schoolWrap.hidden = schoolRows.length === 0 && !(roomShowNote && schoolNote);
        paintDock();
      }

      function boardNorm(value) {
        return String(value || "").replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
      }

      var BOARD_NAMES = ["SpanCraft","HoldIt","Spire Lab","Bertapult","Berty Run","Drift","PaperLab","BertyBeatz","Visualizer","Debugzy"];

      function canonBoard(value) {
        var raw = boardNorm(value).slice(0, 24);
        var key = raw.toLowerCase().replace(/[^a-z0-9]/g, "");
        var i;
        for (i = 0; i < BOARD_NAMES.length; i++) {
          if (BOARD_NAMES[i].toLowerCase().replace(/[^a-z0-9]/g, "") === key) return BOARD_NAMES[i];
        }
        return raw;
      }

      function scoreNum(score) {
        var n = parseFloat(String(score || "").replace(/,/g, ""));
        return isNaN(n) ? null : n;
      }

      function dedupeBoards(rows) {
        var seen = {};
        var out = [];
        (Array.isArray(rows) ? rows : []).forEach(function (row) {
          if (!row) return;
          var board = canonBoard(row.board);
          var name = boardNorm(row.name).slice(0, 24);
          var score = boardNorm(row.score).slice(0, 12);
          if (!board || !name || !score) return;
          var key = board.toLowerCase() + "\0" + name.toLowerCase();
          if (seen[key]) return;
          seen[key] = 1;
          out.push({ board: board, name: name, score: score });
        });
        return out.slice(0, 24);
      }

      function rankBoards(rows) {
        return dedupeBoards(rows).slice().sort(function (a, b) {
          var byBoard = a.board.localeCompare(b.board);
          if (byBoard) return byBoard;
          var na = scoreNum(a.score);
          var nb = scoreNum(b.score);
          if (na != null && nb != null && na !== nb) return nb - na;
          return a.name.localeCompare(b.name);
        });
      }

      function doorTop(rows) {
        var counts = {};
        var out = [];
        rankBoards(rows).forEach(function (row) {
          counts[row.board] = (counts[row.board] || 0) + 1;
          if (counts[row.board] <= 3) out.push(row);
        });
        return out;
      }

      function marqueeLine(rows) {
        var ranked = doorTop(rows);
        var groups = [];
        var current = "";
        var parts = [];
        ranked.forEach(function (row) {
          if (row.board !== current) {
            if (parts.length) groups.push(current + "  " + parts.join("  "));
            current = row.board;
            parts = [];
          }
          parts.push((parts.length + 1) + ". " + row.name + " " + row.score);
        });
        if (parts.length) groups.push(current + "  " + parts.join("  "));
        return groups.join("   ·   ");
      }

      function boardsFromHref(href) {
        var raw = String(href || "");
        var hash = raw.indexOf("#");
        if (hash < 0) return [];
        try { return dedupeBoards(JSON.parse(decodeURIComponent(raw.slice(hash + 1)))); }
        catch (e) { return []; }
      }

      function readPackBoards(pack) {
        var field = dedupeBoards(pack && pack.boards);
        var linked = [];
        var links = Array.isArray(pack && pack.links) ? pack.links : [];
        links.forEach(function (row) {
          if (row && row.id === "lbpack-live") linked = linked.concat(boardsFromHref(row.href));
        });
        return dedupeBoards(field.concat(linked));
      }

      function paintMarquee(rows, on) {
        var bars = document.querySelectorAll("#shell-marquee");
        for (var i = 1; i < bars.length; i++) {
          if (bars[i].parentNode) bars[i].parentNode.removeChild(bars[i]);
        }
        var bar = document.getElementById("shell-marquee");
        var track = document.getElementById("shell-marquee-track");
        if (!bar || !track) return;
        rows = doorTop(rows);
        if (!on || !rows.length) {
          bar.hidden = true;
          bar.classList.remove("is-scrolling");
          track.textContent = "";
          track.classList.remove("is-scrolling");
          return;
        }
        var text = marqueeLine(rows);
        if (track.getAttribute("data-line") !== text) {
          track.setAttribute("data-line", text);
          track.textContent = "";
          var last = "";
          var place = 0;
          rows.forEach(function (row) {
            if (row.board !== last) {
              if (last) {
                var gap = document.createElement("span");
                gap.className = "mq-gap";
                gap.textContent = "·";
                track.appendChild(gap);
              }
              var board = document.createElement("span");
              board.className = "mq-board";
              board.textContent = row.board;
              track.appendChild(board);
              last = row.board;
              place = 0;
            }
            place += 1;
            var bit = document.createElement("span");
            bit.className = "mq-bit";
            bit.appendChild(document.createTextNode(place + ". " + row.name + " "));
            var score = document.createElement("span");
            score.className = "mq-score";
            score.textContent = row.score;
            bit.appendChild(score);
            track.appendChild(bit);
          });
        }
        bar.hidden = false;
        requestAnimationFrame(fitMarquee);
      }

      function fitMarquee() {
        var bar = document.getElementById("shell-marquee");
        var track = document.getElementById("shell-marquee-track");
        if (!bar || !track || bar.hidden) return;
        var quiet = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        var overflow = track.scrollWidth > bar.clientWidth + 8;
        track.style.animationDuration = Math.max(16, Math.round(track.scrollWidth / 36)) + "s";
        var scroll = !!(overflow && !quiet);
        track.classList.toggle("is-scrolling", scroll);
        bar.classList.toggle("is-scrolling", scroll);
      }

      function applySchool(pack) {
        var note = String(pack && pack.note ? pack.note : "").replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim().slice(0, 80);
        var rows = [];
        var seen = {};
        var listRows = (Array.isArray(pack && pack.links) ? pack.links : []).filter(function (row) {
          return row && row.id !== "lbpack-live";
        });
        var boardRows = readPackBoards(pack);
        var boardsOn = !(pack && pack.boardsOn === false);
        listRows.forEach(function (row) {
          if (!row) return;
          var name = String(row.name || "").replace(/\s+/g, " ").trim().slice(0, 24);
          var url = cleanUrl(String(row.href || ""));
          if (!name || url.error) return;
          var key = hrefKey(url.href);
          if (seen[key]) return;
          seen[key] = 1;
          rows.push({
            id: typeof row.id === "string" && row.id.indexOf("cut-") === 0 ? row.id.slice(0, 24) : "cut-s" + (rows.length + 1),
            name: name,
            href: url.href,
            icon: ICONS[row.icon] ? row.icon : "school"
          });
        });
        var hidden = Array.isArray(pack && pack.hidden) ? pack.hidden.map(function (id) {
          id = String(id);
          if (id === "bearcat-den") return "den";
          if (id === "bearcat-bistro") return "bistro";
          return id;
        }) : [];
        var focus = String(pack && pack.focus || "");
        if (focus === "bearcat-den") focus = "den";
        if (focus === "bearcat-bistro") focus = "bistro";
        var sig = String(pack && pack.updated || "") + "\0" + note + "\0" + (pack && pack.closed ? "1" : "0") + "\0" + hidden.join(",") + "\0" + focus + "\0" + (pack && pack.density) + "\0" + rows.map(function (r) { return r.href; }).join("|") + "\0" + (boardsOn ? "1" : "0") + "\0" + boardRows.map(function (r) { return r.board + r.name + r.score; }).join("|") + "\0" + String(pack && pack.announce || "") + "\0" + (Array.isArray(pack && pack.sticky) ? pack.sticky.join(",") : "") + "\0" + (pack && pack.hubAliases === false ? "0" : "1");
        if (sig === schoolSig) return;
        schoolSig = sig;
        schoolRows = rows;
        schoolNote = note;
        roomHidden = hidden;
        roomAllowCuts = pack && pack.shortcuts === false ? false : true;
        roomAllowPaste = pack && pack.paste === false ? false : true;
        roomMax = Math.min(18, Math.max(1, Number(pack && pack.maxCuts) || 18));
        roomStaffEdit = pack && pack.staffEdit === false ? false : true;
        roomHotkeys = pack && pack.hotkeys === false ? false : true;
        roomNewTab = pack && pack.newTab === false ? false : true;
        roomOutsideShell = hubClassic
          ? (Array.isArray(pack && pack.outsideShell) ? pack.outsideShell.map(function (id) { return String(id); }).filter(Boolean) : ["baboo", "ginger", "den", "bistro"])
          : [];
        roomShowNote = pack && pack.showNote === false ? false : true;
        var closedEl = document.getElementById("closed-banner");
        if (closedEl) {
          var closed = !!(pack && pack.closed);
          closedEl.hidden = !closed;
          closedEl.textContent = closed ? String(pack.closedMsg || "Doors closed this period.").replace(/<[^>]*>/g, "").slice(0, 80) : "";
        }
        var staffEl = document.getElementById("staff-edit");
        var pocket = document.getElementById("edge-pocket");
        if (staffEl) staffEl.hidden = !roomStaffEdit;
        if (pocket) {
          pocket.hidden = !roomStaffEdit;
          if (!roomStaffEdit) {
            var pocketMenu = document.getElementById("edge-pocket-menu");
            var pocketBtn = document.getElementById("edge-pocket-btn");
            if (pocketMenu) pocketMenu.hidden = true;
            if (pocketBtn) pocketBtn.setAttribute("aria-expanded", "false");
          }
        }
        if (pack && pack.search) input.setAttribute("placeholder", String(pack.search).slice(0, 40));
        var foot = document.getElementById("room-footer");
        if (foot && pack && pack.footer) foot.textContent = String(pack.footer).slice(0, 80);
        var welcome = document.getElementById("welcome-line");
        if (welcome) {
          var w = pack && pack.welcome ? String(pack.welcome).replace(/<[^>]*>/g, "").slice(0, 60) : "";
          welcome.textContent = w;
          welcome.hidden = !w;
          if (typeof fitPhoneTiles === "function") fitPhoneTiles();
        }
        paintStickies(pack);
        var meta = document.getElementById("room-meta");
        if (meta) {
          var bits = [];
          if (pack && pack.period) bits.push(String(pack.period).replace(/<[^>]*>/g, "").slice(0, 24));
          if (pack && pack.club) bits.push(String(pack.club).replace(/<[^>]*>/g, "").slice(0, 80));
          if (pack && pack.doors) bits.push("Doors " + String(pack.doors).slice(0, 24));
          if (pack && pack.lastBell) bits.push("Last bell " + String(pack.lastBell).slice(0, 24));
          meta.textContent = bits.join(" · ");
          meta.hidden = !bits.length || pack && pack.bellsOn === false;
        }
        var poster = document.querySelector(".poster");
        if (poster) {
          poster.classList.toggle("is-lockup-off", pack && pack.lockup === false);
          poster.classList.toggle("is-no-search", pack && pack.searchOn === false);
        }
        document.body.classList.toggle("room-compact", pack && pack.density === "compact");
        document.body.classList.toggle("is-no-recents", pack && pack.recents === false);
        document.body.classList.toggle("is-no-chips", pack && pack.chips === false);
        document.body.classList.toggle("is-no-cuts", pack && pack.shortcuts === false);
        hubAliasesOn = true;
        try { localStorage.setItem("kw-hub-aliases", "1"); } catch (eAlias) {}
        paintAliasGate();
        paintTw();
        flushMarks();
        paintMarquee(boardRows, boardsOn);
        tileOrder.forEach(function (id) {
          var tile = appBoard.querySelector('[data-id="' + id + '"]');
          if (tile && tile.parentElement) tile.parentElement.appendChild(tile);
        });
        if (focus) {
          var spotlight = appBoard.querySelector('[data-id="' + focus + '"]');
          if (spotlight && spotlight.parentElement) {
            spotlight.parentElement.insertBefore(spotlight, spotlight.parentElement.firstChild);
            var group = spotlight.closest(".group");
            if (group && group.parentElement) group.parentElement.insertBefore(group, group.parentElement.firstChild);
          }
        }
        appTiles().forEach(function (tile) {
          var id = tile.getAttribute("data-id") || "";
          tile.classList.toggle("is-room-hidden", roomHidden.indexOf(id) !== -1);
          var href = tile.getAttribute("href");
          var leave = roomOutsideShell.indexOf(id) !== -1 || (isExternalHref(href) && !isSameOriginDoor(href));
          if (leave) tile.setAttribute("data-outside-shell", "1");
          else tile.removeAttribute("data-outside-shell");
          if (leave && roomNewTab) {
            tile.setAttribute("target", "_blank");
            tile.setAttribute("rel", "noopener noreferrer");
          } else {
            tile.removeAttribute("target");
            if (!isExternalHref(tile.getAttribute("href"))) tile.removeAttribute("rel");
          }
        });
        paint();
        applyView();
      }

      function fetchJson(url, ms) {
        return new Promise(function (resolve, reject) {
          var done = false;
          var t = setTimeout(function () {
            if (done) return;
            done = true;
            reject(new Error("timeout"));
          }, ms);
          fetch(url).then(function (res) {
            if (done) return;
            done = true;
            clearTimeout(t);
            resolve(res);
          }, function (err) {
            if (done) return;
            done = true;
            clearTimeout(t);
            reject(err);
          });
        });
      }

      function loadSchool() {
        if (document.visibilityState === "hidden") return;
        fetchJson("https://tw.kulibert.net/api/door-links", 4000)
          .then(function (res) { return res.ok ? res.json() : Promise.reject(); })
          .then(applySchool)
          .catch(function () {
            fetchJson("/included.json", 3000)
              .then(function (res) { return res.ok ? res.json() : { links: [] }; })
              .then(applySchool)
              .catch(function () { applySchool({ links: [], note: "" }); });
          });
      }

      function paintStickies(pack) {
        var bar = document.getElementById("stickies");
        var box = document.getElementById("sticky-icons");
        var note = document.getElementById("announce");
        if (!bar || !box || !note) return;
        var ids = Array.isArray(pack && pack.sticky) ? pack.sticky.slice(0, 3) : [];
        box.innerHTML = "";
        ids.forEach(function (id) {
          id = String(id || "");
          if (!id || !appBoard) return;
          var tile = appBoard.querySelector('a.tile[data-id="' + id + '"]');
          if (!tile) return;
          var link = document.createElement("a");
          link.className = "sticky-icon";
          link.href = tile.getAttribute("href") || "#";
          link.setAttribute("data-id", id);
          var img = tile.querySelector("img");
          if (img) link.appendChild(img.cloneNode(true));
          var name = tile.querySelector(".label");
          var label = document.createElement("span");
          label.className = "label";
          label.textContent = name ? name.textContent : id;
          link.appendChild(label);
          box.appendChild(link);
        });
        var text = pack && pack.announce ? String(pack.announce).replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim().slice(0, 140) : "";
        note.textContent = text;
        note.hidden = !text;
        bar.setAttribute("aria-label", "Today");
        bar.hidden = !box.children.length && !text;
      }

      function paintCuts() {
        var q = (input.value || "").trim().toLowerCase();
        var rows = readCuts();
        board.innerHTML = "";
        rows.forEach(function (row) {
          var hit = fuzzyHit(row.name + " " + row.href, q);
          if (!hit) return;
          var wrap = document.createElement("div");
          wrap.className = "cut-wrap";
          var href = String(row.href).replace(/"/g, "");
          wrap.innerHTML =
            '<a class="tile" href="' + href + '" rel="noopener noreferrer">' +
              svg(ICONS[row.icon] || ICONS.link) +
              '<span class="label"></span>' +
            "</a>" +
            '<button type="button" class="edit" aria-label="Edit">' +
              svg('<path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .622.624l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/>') +
            "</button>";
          wrap.querySelector(".label").textContent = row.name;
          wrap.querySelector("a.tile").addEventListener("click", function () { remember(row); });
          wrap.querySelector(".edit").addEventListener("click", function (event) {
            event.preventDefault();
            openModal(row);
          });
          board.appendChild(wrap);
        });
        if (!q && roomAllowCuts) {
          var add = document.createElement("button");
          add.type = "button";
          add.className = "tile add";
          add.innerHTML = svg('<path d="M5 12h14"/><path d="M12 5v14"/>') + '<span class="label">Add</span>';
          add.addEventListener("click", function () { openModal(null); });
          board.appendChild(add);
        }
        var cutsSec = document.querySelector("section.cuts");
        if (cutsSec) cutsSec.hidden = !roomAllowCuts && board.children.length === 0;
        paintDock();
      }

      function syncGroups() {
        if (!appBoard) return;
        Array.prototype.forEach.call(appBoard.querySelectorAll(".group"), function (group) {
          var any = false;
          Array.prototype.forEach.call(group.querySelectorAll("a.tile"), function (tile) {
            if (!tile.classList.contains("is-hidden") && !tile.classList.contains("is-room-hidden")) any = true;
          });
          group.classList.toggle("is-empty", !any);
          var count = group.querySelector(".drawer-count");
          if (count) {
            var n = 0;
            Array.prototype.forEach.call(group.querySelectorAll("a.tile"), function (tile) {
              if (!tile.classList.contains("is-hidden") && !tile.classList.contains("is-room-hidden")) n += 1;
            });
            count.textContent = String(n);
          }
          var query = (input && input.value || "").trim();
          var named = hubFilter !== "all" && group.getAttribute("data-group") === hubFilter;
          if (any && hubSort === "group" && (query || named)) {
            group.classList.add("is-open");
            var openBtn = group.querySelector(".drawer");
            if (openBtn) openBtn.setAttribute("aria-expanded", "true");
          }
        });
        sizeBoards();
      }

      function markFirst() {
        document.querySelectorAll("a.tile.is-first").forEach(function (el) { el.classList.remove("is-first"); });
        var q = (input.value || "").trim();
        if (!q) return;
        var tile = bestTile();
        if (tile) tile.classList.add("is-first");
      }

      function filter() {
        var q = (input.value || "").trim().toLowerCase();
        var shown = 0;
        appTiles().forEach(function (tile) {
          if (!hubClassic && tile.getAttribute("data-staff") === "1") {
            tile.classList.add("is-hidden");
            return;
          }
          var label = tile.querySelector(".label").textContent;
          var keys = tile.getAttribute("data-keywords") || "";
          var groupOk = hubFilter === "all" || tile.getAttribute("data-group") === hubFilter;
          var hit = groupOk && fuzzyHit(label + " " + keys + " " + (tile.getAttribute("data-id") || ""), q);
          tile.classList.toggle("is-hidden", !hit);
          if (hit && !tile.classList.contains("is-room-hidden")) shown += 1;
        });
        paintCuts();
        paintSchool();
        syncGroups();
        var schoolHits = schoolRows.filter(function (row) {
          return fuzzyHit(row.name + " " + row.href, q);
        }).length;
        var cutHits = readCuts().filter(function (row) {
          return fuzzyHit(row.name + " " + row.href, q);
        }).length;
        markFirst();
        var empty = document.getElementById("empty-filter");
        if (!shown && !schoolHits && !cutHits && q) {
          if (!empty) {
            empty = document.createElement("p");
            empty.id = "empty-filter";
            empty.className = "empty";
            empty.textContent = (window.KulibertI18n && KulibertI18n.t("nothingMatches")) || "Nothing matches. Paste a link and press Enter to pin it here.";
            empty.setAttribute("data-i18n", "nothingMatches");
            appBoard.after(empty);
          }
        } else if (empty) {
          empty.remove();
        }
      }


      function tileName(tile) {
        var lab = tile.querySelector(".label");
        return (lab ? lab.textContent : "").replace(/\s+/g, " ").trim();
      }

      function appSortTiles() {
        var out = [];
        Array.prototype.forEach.call(appBoard.querySelectorAll("a.tile"), function (tile) {
          var g = tile.getAttribute("data-group");
          if (!g || g === "alpha") return;
          if (!hubClassic && tile.getAttribute("data-staff") === "1") return;
          out.push(tile);
        });
        return out;
      }

      function sizeBoards() {
        if (!appBoard) return;
        Array.prototype.forEach.call(appBoard.querySelectorAll(".group .board"), function (board) {
          if (board.id === "alpha-board") return;
          var n = 0;
          Array.prototype.forEach.call(board.querySelectorAll(":scope > a.tile"), function (tile) {
            if (tile.classList.contains("is-hidden") || tile.classList.contains("is-room-hidden")) return;
            n += 1;
          });
          board.setAttribute("data-n", String(n < 1 ? 1 : Math.min(n, 6)));
        });
      }

      function applyView() {
        var tiles = appSortTiles();
        var alpha = document.getElementById("alpha-group");
        var alphaBoard = document.getElementById("alpha-board");
        var alphaTitle = document.getElementById("alpha-title");
        if (hubSort === "group") {
          tiles.sort(function (a, b) {
            return Number(a.getAttribute("data-order")) - Number(b.getAttribute("data-order"));
          });
          tiles.forEach(function (tile) {
            var home = appBoard.querySelector('.group[data-group="' + tile.getAttribute("data-group") + '"] .board');
            if (home) home.appendChild(tile);
          });
          if (alpha) alpha.hidden = true;
        } else {
          tiles.sort(function (a, b) {
            return tileName(a).localeCompare(tileName(b), "en", { sensitivity: "base", numeric: true });
          });
          if (hubSort === "za") tiles.reverse();
          tiles.forEach(function (tile) { alphaBoard.appendChild(tile); });
          if (alphaTitle) {
            var azWord = window.KulibertI18n ? KulibertI18n.t(hubSort === "za" ? "sortZa" : "sortAz") : (hubSort === "za" ? "Z–A" : "A–Z");
            alphaTitle.textContent = azWord || (hubSort === "za" ? "Z–A" : "A–Z");
          }
          if (alpha) alpha.hidden = false;
        }
        sizeBoards();
        Array.prototype.forEach.call(document.querySelectorAll("#hub-tools [data-sort]"), function (btn) {
          var on = btn.getAttribute("data-sort") === hubSort;
          btn.classList.toggle("is-on", on);
          btn.setAttribute("aria-pressed", on ? "true" : "false");
        });
        try {
          localStorage.setItem("tech-room-sort", hubSort);
          localStorage.setItem("tech-room-filter", hubFilter);
        } catch (eSave) {}
        filter();
        fitPhoneTiles();
        paintStaffDrawer();
        paintKeep();
      }

      function openFirst(blank) {
        var tile = bestTile();
        if (!tile) return false;
        var href = schoolHref(tile.getAttribute("href"));
        if (!href) return false;
        remember(entryFromTile(tile));
        if (isSameOriginDoor(href)) { openFrame(href, tileName(tile)); return true; }
        if (blank) window.open(href, "_blank", "noopener,noreferrer");
        else window.location.href = href;
        return true;
      }

      function openModal(row, seed) {
        editingId = row ? row.id : null;
        picked = row && ICONS[row.icon] ? row.icon : "link";
        nameEl.value = row ? row.name : (seed && seed.name ? seed.name : "");
        urlEl.value = row ? row.href : (seed && seed.href ? seed.href : "");
        errEl.textContent = "";
        titleEl.textContent = row ? "Edit shortcut" : "Add shortcut";
        removeEl.hidden = !row;
        paintIcons();
        modal.hidden = false;
        nameEl.focus();
      }

      function closeModal() {
        modal.hidden = true;
        editingId = null;
      }

      function paintIcons() {
        iconBox.innerHTML = "";
        Object.keys(ICONS).forEach(function (id) {
          var btn = document.createElement("button");
          btn.type = "button";
          btn.setAttribute("aria-pressed", id === picked ? "true" : "false");
          btn.setAttribute("aria-label", id);
          btn.innerHTML = svg(ICONS[id]);
          btn.addEventListener("click", function () {
            picked = id;
            paintIcons();
          });
          iconBox.appendChild(btn);
        });
      }

      form.addEventListener("submit", function (event) {
        event.preventDefault();
        var name = (nameEl.value || "").replace(/\s+/g, " ").trim().slice(0, 24);
        if (!name) { errEl.textContent = "Give the shortcut a name."; return; }
        var url = cleanUrl(urlEl.value);
        if (url.error) { errEl.textContent = url.error; return; }
        var rows = readCuts();
        var key = hrefKey(url.href);
        var dup = rows.some(function (row) {
          return row.id !== editingId && hrefKey(row.href) === key;
        });
        if (dup) { errEl.textContent = "Already on this Chromebook."; return; }
        if (editingId) {
          rows = rows.map(function (row) {
            if (row.id !== editingId) return row;
            return { id: row.id, name: name, href: url.href, icon: picked };
          });
        } else {
          if (rows.length >= MAX) { errEl.textContent = "This Chromebook can keep " + MAX + " shortcuts."; return; }
          rows.push({
            id: "cut-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
            name: name,
            href: url.href,
            icon: picked
          });
        }
        writeCuts(rows);
        closeModal();
        paintCuts();
      });

      urlEl.addEventListener("blur", function () {
        if ((nameEl.value || "").trim()) return;
        var guessed = nameFromHost(urlEl.value);
        if (guessed) nameEl.value = guessed;
      });

      removeEl.addEventListener("click", function () {
        if (!editingId) return;
        writeCuts(readCuts().filter(function (row) { return row.id !== editingId; }));
        closeModal();
        paintCuts();
      });

      document.getElementById("cut-cancel").addEventListener("click", closeModal);
      modal.addEventListener("click", function (event) {
        if (event.target === modal) closeModal();
      });

      appTiles().forEach(function (tile) {
        tile.addEventListener("click", function () {
          remember(entryFromTile(tile));
        });
      });

      var hubTools = document.getElementById("hub-tools");
      if (hubTools) hubTools.addEventListener("click", function (event) {
        var btn = event.target && event.target.closest ? event.target.closest("button") : null;
        if (!btn || !hubTools.contains(btn) || btn.id === "hub-rev") return;
        if (btn.hasAttribute("data-sort")) hubSort = btn.getAttribute("data-sort");
        applyView();
      });
      applyView();
      if (appBoard) appBoard.addEventListener("click", function (event) {
        var btn = event.target && event.target.closest ? event.target.closest(".drawer") : null;
        if (!btn || !appBoard.contains(btn)) return;
        var group = btn.closest(".group");
        if (!group) return;
        var willOpen = !group.classList.contains("is-open");
        Array.prototype.forEach.call(appBoard.querySelectorAll(".group.is-open"), function (open) {
          open.classList.remove("is-open");
          var b = open.querySelector(".drawer");
          if (b) b.setAttribute("aria-expanded", "false");
        });
        if (willOpen) {
          group.classList.add("is-open");
          btn.setAttribute("aria-expanded", "true");
        }
      });

      var HUB_THEMES = ["room", "graph", "miami", "spa", "nature", "peaks", "city", "space", "berty"];
      var HUB_THEME_NAMES = { room: "Room", graph: "Graph", miami: "Miami", spa: "Spa", nature: "Nature", peaks: "Peaks", city: "City", space: "Space", berty: "Berty" };
      var HUB_THEME_COLORS = { room: "#050814", graph: "#efeae0", miami: "#14061f", spa: "#f3efe8", nature: "#e7f4d8", peaks: "#e8eef4", city: "#12151c", space: "#070b16", berty: "#1a120c" };
      function paintThemeButton() {
        var theme = document.documentElement.getAttribute("data-hub-theme") || "room";
        if (HUB_THEMES.indexOf(theme) < 0) theme = "room";
        Array.prototype.forEach.call(document.querySelectorAll(".style-swatch"), function (swatch) {
          var on = swatch.getAttribute("data-style") === theme;
          swatch.classList.toggle("is-on", on);
          swatch.setAttribute("aria-pressed", on ? "true" : "false");
        });
        var bar = document.getElementById("theme-color");
        if (bar) bar.setAttribute("content", HUB_THEME_COLORS[theme]);
      }
      paintThemeButton();
      var styleTickCtx = null;
      function styleTick() {
        try {
          if (!styleTickCtx) styleTickCtx = new (window.AudioContext || window.webkitAudioContext)();
          var o = styleTickCtx.createOscillator();
          var g = styleTickCtx.createGain();
          o.frequency.value = 620;
          g.gain.value = 0.03;
          o.connect(g);
          g.connect(styleTickCtx.destination);
          o.start();
          g.gain.exponentialRampToValueAtTime(0.0001, styleTickCtx.currentTime + 0.07);
          o.stop(styleTickCtx.currentTime + 0.08);
        } catch (eTick) {}
      }
      var styleRow = document.getElementById("style-row");
      if (styleRow) styleRow.addEventListener("click", function (event) {
        var swatch = event.target && event.target.closest ? event.target.closest(".style-swatch") : null;
        if (!swatch) return;
        event.stopPropagation();
        var next = swatch.getAttribute("data-style");
        if (HUB_THEMES.indexOf(next) < 0) return;
        document.documentElement.setAttribute("data-hub-theme", next);
        try { localStorage.setItem("tech-room-theme", next); } catch (eTheme) {}
        paintThemeButton();
        styleTick();
        var note = document.getElementById("style-note");
        if (note) {
          note.hidden = false;
          note.textContent = HUB_THEME_NAMES[next] + " saved on this Chromebook.";
        }
      });

      function fitPhoneTiles() {
        var tiles = document.querySelectorAll("#app-groups .board a.tile");
        Array.prototype.forEach.call(tiles, function (tile) {
          tile.style.height = "";
          tile.style.aspectRatio = "";
        });
      }
      fitPhoneTiles();
      window.addEventListener("resize", fitPhoneTiles);
      requestAnimationFrame(function () { fitPhoneTiles(); });
      window.addEventListener("resize", fitMarquee);

      
      var hubStaff = false;
      try {
        hubStaff = (window.HubStaffAuth && HubStaffAuth.isUnlocked) ? !!HubStaffAuth.isUnlocked() : (localStorage.getItem("tech-room-hub-staff") === "1");
      } catch (e) {}
      if (hubStaff) document.body.classList.add("staff-on");

      var hubRevBtn = document.getElementById("hub-rev");
      var hubMeta = document.querySelector('meta[name="tech-room-rev"]');
      var hubName = hubMeta && hubMeta.content ? hubMeta.content : "chip";
      if (hubRevBtn) {
        hubRevBtn.textContent = hubStaff ? ("Hub · " + hubName) : "Hub";
        hubRevBtn.addEventListener("click", function () {
          var next = new URL(location.href);
          next.searchParams.set("hub", String(Date.now()));
          location.replace(next.pathname + next.search);
        });
      }
      document.querySelectorAll(".rev").forEach(function (el) {
        if (hubStaff) {
          el.textContent = "rev " + hubName;
          el.hidden = false;
        } else {
          el.textContent = "";
          el.hidden = true;
        }
      });

      input.addEventListener("input", filter);
      input.addEventListener("keydown", function (event) {
        if (event.key !== "Enter") return;
        var pasted = (input.value || "").trim();
        if (!event.altKey && roomAllowPaste && roomAllowCuts && looksLikeUrl(pasted)) {
          event.preventDefault();
          openModal(null, { name: nameFromHost(pasted), href: pasted });
          return;
        }
        if (!pasted) return;
        event.preventDefault();
        openFirst(event.altKey || roomNewTab);
      });

      document.addEventListener("keydown", function (event) {
        var typing = event.target && (event.target.tagName === "INPUT" || event.target.tagName === "TEXTAREA");
        var staffGate = document.getElementById("staff-gate");
        if (event.key === "Escape") {
          if (staffGate && !staffGate.hidden) { event.preventDefault(); closeStaffGate(); return; }
          if (!modal.hidden) { event.preventDefault(); closeModal(); return; }
          var pocketMenu = document.getElementById("edge-pocket-menu");
          if (pocketMenu && !pocketMenu.hidden) { event.preventDefault(); setPocket(false); return; }
          if (document.activeElement === input) {
            event.preventDefault();
            if (input.value) { input.value = ""; filter(); }
            input.blur();
            return;
          }
          var kpOpen = document.getElementById("kp-panel");
          if (kpOpen && !kpOpen.hidden) {
            event.preventDefault();
            var kpClose = document.getElementById("kp-close");
            if (kpClose) kpClose.click();
            return;
          }
          var hubOpen = document.getElementById("hub-drawer");
          if (hubOpen && !hubOpen.hidden && !document.body.classList.contains("hub-classic")) {
            event.preventDefault();
            closeHubDrawer();
            return;
          }
          if (document.body.classList.contains("is-framed")) {
            event.preventDefault();
            if (frameMenuOpen && plateState && plateState.menu && !document.body.classList.contains("hub-classic")) {
              frameMenuOpen = false;
              var menuBtnEsc = document.getElementById("kb-menu");
              if (menuBtnEsc) menuBtnEsc.setAttribute("aria-expanded", "false");
              var appFrameEsc = document.getElementById("app-frame");
              if (appFrameEsc && appFrameEsc.contentWindow) {
                try { appFrameEsc.contentWindow.postMessage({ type: "kb-menu" }, "*"); } catch (eMenuEsc) {}
              }
              return;
            }
            closeFrame();
          }
          return;
        }
        if (staffGate && !staffGate.hidden) return;
        if ((event.key === "/" || ((event.key === "k") && (event.metaKey || event.ctrlKey))) && !typing) {
          if (document.querySelector(".poster.is-no-search")) return;
          event.preventDefault();
          input.focus();
          return;
        }
        if (typing) return;
        if (!roomHotkeys) return;
        var n = Number(event.key);
        if (n >= 1 && n <= 9) {
          var tile = launchTiles()[n - 1];
          if (tile) {
            event.preventDefault();
            remember(entryFromTile(tile));
            var door = schoolHref(tile.getAttribute("href"));
            if (!door) return;
            if (isSameOriginDoor(door)) { openFrame(door, tileName(tile)); return; }
            if (roomNewTab) window.open(door, "_blank", "noopener,noreferrer");
            else window.location.href = door;
          }
        }
      });

      var pocketBtn = document.getElementById("edge-pocket-btn");
      var pocketMenu = document.getElementById("edge-pocket-menu");
      function placePocket() {
        if (!pocketBtn || !pocketMenu || pocketMenu.hidden) return;
        var rect = pocketBtn.getBoundingClientRect();
        pocketMenu.style.top = Math.round(rect.bottom + 6) + "px";
        pocketMenu.style.right = Math.round(Math.max(8, window.innerWidth - rect.right)) + "px";
        pocketMenu.style.left = "auto";
      }
      function setPocket(open) {
        if (!pocketBtn || !pocketMenu) return;
        pocketMenu.hidden = !open;
        pocketBtn.setAttribute("aria-expanded", open ? "true" : "false");
        if (!open) {
          var drawer = document.getElementById("staff-drawer");
          var staffAppsBtn = document.getElementById("staff-apps-btn");
          if (drawer) drawer.hidden = true;
          if (staffAppsBtn) staffAppsBtn.setAttribute("aria-expanded", "false");
        }
        if (open) placePocket();
      }
      if (pocketBtn) {
        pocketBtn.addEventListener("click", function () {
          setPocket(pocketMenu.hidden);
        });
      }
      function paintStaffDrawer() {
        var btn = document.getElementById("staff-apps-btn");
        var box = document.getElementById("staff-drawer");
        if (!btn || !box) return;
        if (hubClassic) {
          btn.hidden = true;
          box.hidden = true;
          return;
        }
        btn.hidden = false;
        box.innerHTML = "";
        ["housekit", "bistro", "den"].forEach(function (id) {
          var tile = appBoard.querySelector('a.tile[data-id="' + id + '"]');
          if (!tile) return;
          var a = document.createElement("a");
          a.className = "staff-app";
          a.href = tile.getAttribute("href");
          a.setAttribute("data-id", id);
          a.setAttribute("role", "menuitem");
          var img = tile.querySelector("img.mark");
          if (img) {
            var copy = document.createElement("img");
            copy.src = img.getAttribute("src");
            copy.alt = "";
            copy.width = 28;
            copy.height = 28;
            a.appendChild(copy);
          }
          var span = document.createElement("span");
          span.className = "label";
          span.textContent = tileName(tile);
          a.appendChild(span);
          box.appendChild(a);
        });
        var also = document.getElementById("hub-drawer-staff");
        if (also) also.innerHTML = box.innerHTML;
      }
      var staffAppsBtn = document.getElementById("staff-apps-btn");
      if (staffAppsBtn) {
        staffAppsBtn.addEventListener("click", function (event) {
          event.preventDefault();
          event.stopPropagation();
          var box = document.getElementById("staff-drawer");
          if (!box) return;
          var open = box.hidden;
          box.hidden = !open;
          staffAppsBtn.setAttribute("aria-expanded", open ? "true" : "false");
          placePocket();
        });
      }
      document.addEventListener("mousedown", function (event) {
        if (!pocketMenu || pocketMenu.hidden) return;
        var pocket = document.getElementById("edge-pocket");
        if (pocket && pocket.contains(event.target)) return;
        if (pocketMenu.contains(event.target)) return;
        setPocket(false);
      });
      window.addEventListener("resize", placePocket);

      var staffEdit = document.getElementById("staff-edit");
      var staffSignOut = document.getElementById("staff-sign-out");
      var staffGate = document.getElementById("staff-gate");
      var staffPass = document.getElementById("staff-pass");
      function paintStaffLock() {
        var on = window.HubStaffAuth && HubStaffAuth.isUnlocked();
        if (staffSignOut) staffSignOut.hidden = !on;
      }
      function closeStaffGate() {
        if (!staffGate) return;
        staffGate.hidden = true;
        var err = document.getElementById("staff-gate-error");
        if (err) err.textContent = "";
        if (staffPass) staffPass.removeAttribute("aria-invalid");
        if (staffEdit) staffEdit.focus();
      }
      function openStaffGate() {
        setPocket(false);
        if (!staffGate) return;
        var err = document.getElementById("staff-gate-error");
        if (err) err.textContent = "";
        if (staffPass) {
          staffPass.value = "";
          staffPass.removeAttribute("aria-invalid");
          staffPass.type = "password";
        }
        var toggle = document.getElementById("staff-pass-toggle");
        if (toggle) {
          toggle.textContent = "Show";
          toggle.setAttribute("aria-pressed", "false");
        }
        staffGate.hidden = false;
        if (staffPass) staffPass.focus();
      }
      if (staffEdit) {
        staffEdit.addEventListener("click", function (event) {
          if (window.HubStaffAuth && HubStaffAuth.isUnlocked()) return;
          event.preventDefault();
          openStaffGate();
        });
        staffEdit.addEventListener("auxclick", function (event) {
          if (window.HubStaffAuth && HubStaffAuth.isUnlocked()) return;
          event.preventDefault();
        });
      }
      if (staffSignOut) {
        staffSignOut.addEventListener("click", function () {
          if (window.HubStaffAuth) HubStaffAuth.signOut();
          paintStaffLock();
          setPocket(false);
        });
      }
      if (window.HubStaffAuth) {
        HubStaffAuth.mount({
          form: document.getElementById("staff-gate-form"),
          input: staffPass,
          toggle: document.getElementById("staff-pass-toggle"),
          unlock: document.getElementById("staff-gate-unlock"),
          error: document.getElementById("staff-gate-error"),
          onUnlock: function () {
            if (staffGate) staffGate.hidden = true;
            paintStaffLock();
            window.location.assign("/staff/");
          }
        });
      }
      var staffCancel = document.getElementById("staff-gate-cancel");
      if (staffCancel) staffCancel.addEventListener("click", closeStaffGate);
      if (staffGate) {
        staffGate.addEventListener("click", function (event) {
          if (event.target === staffGate) closeStaffGate();
        });
        staffGate.addEventListener("keydown", function (event) {
          if (event.key !== "Tab" || staffGate.hidden) return;
          var nodes = staffGate.querySelectorAll("input, button");
          var list = Array.prototype.filter.call(nodes, function (el) {
            return !el.disabled && !el.hidden;
          });
          if (!list.length) return;
          var first = list[0];
          var last = list[list.length - 1];
          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
          }
        });
      }
      paintStaffLock();

      var plate = document.getElementById("hub-plate");
      var moreBtn = document.getElementById("hub-more");
      function syncPlate() {
        if (!plate || !moreBtn) return;
        var open = plate.classList.contains("is-open");
        plate.classList.toggle("is-clamped", !open);
        moreBtn.hidden = false;
        moreBtn.textContent = open ? "Less" : "Expand";
        moreBtn.setAttribute("aria-expanded", open ? "true" : "false");
      }
      if (moreBtn) {
        moreBtn.addEventListener("click", function () {
          plate.classList.toggle("is-open");
          syncPlate();
        });
      }
      syncPlate();


      var pwaTip = document.getElementById("pwa-tip");
      var pwaDismiss = document.getElementById("pwa-tip-dismiss");
      var pwaStandalone = false;
      try {
        pwaStandalone = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
      } catch (e) {}
      try {
        if (pwaTip && !pwaStandalone && localStorage.getItem("tech-room-pwa-tip") !== "1") pwaTip.hidden = false;
      } catch (e2) {}
      if (pwaDismiss) {
        pwaDismiss.addEventListener("click", function () {
          if (pwaTip) pwaTip.hidden = true;
          try { localStorage.setItem("tech-room-pwa-tip", "1"); } catch (e3) {}
          document.documentElement.setAttribute("data-pwa-tip", "off");
        });
      }


      function schoolHref(href) {
        var url;
        try { url = new URL(href, location.href); } catch (e) { return ""; }
        var host = url.hostname.replace(/^www\./, "").toLowerCase();
        if (host === location.hostname || host === "kulibert.net" || host.slice(-13) === ".kulibert.net") return url.href;
        var doors = {
          "logolab-rho.vercel.app": "/logolab/",
          "paperlab-one.vercel.app": "/paperlab/",
          "bertycad.vercel.app": "/bertycad/",
          "kidcad.vercel.app": "/bertycad/",
          "kidcad-phi.vercel.app": "/bertycad/",
          "bearcat-den-weld.vercel.app": "/den/",
          "bearcat-den.vercel.app": "/den/",
          "bearcat-bistro.vercel.app": "/bistro/",
          "drift-psi-two.vercel.app": "/drift/"
        };
        if (doors[host]) return new URL(doors[host] + url.search + url.hash, location.href).href;
        if (host === "vercel.com" || host.slice(-11) === ".vercel.app" || host.slice(-12) === ".vercel.com" || host === "grok.com" || host.slice(-9) === ".grok.com") return "";
        return url.href;
      }
      function isExternalHref(href) {
        try { return new URL(href, location.href).origin !== location.origin; }
        catch (e) { return true; }
      }
      function isSameOriginDoor(href) {
        var url;
        try { url = new URL(href, location.href); } catch (e) { return false; }
        var host = url.hostname;
        var school = host === location.hostname || host === "kulibert.net" || host.slice(-13) === ".kulibert.net";
        if (!school) return false;
        if (host !== location.hostname && url.protocol !== "https:") return false;
        var path = url.pathname || "/";
        if (host === location.hostname && (path === "/" || path === "/index.html")) return false;
        if (path === "/staff" || path === "/staff/" || path.indexOf("/staff/") === 0) return false;
        return true;
      }

      var frameHref = "";


      function parkHomeForFrame(framed) {
        var home = document.getElementById("shell-home");
        var header = document.getElementById("shell-header");
        var pocket = document.getElementById("edge-pocket");
        if (!home || !header) return;
        if (!framed) return;
        if (pocket && pocket.parentNode === header) header.insertBefore(home, pocket);
        else header.appendChild(home);
        home.hidden = false;
      }
      function ensureSingleChrome() {
        var headers = document.querySelectorAll("header.shell-header, #shell-header");
        for (var hi = 1; hi < headers.length; hi++) {
          try { headers[hi].parentNode.removeChild(headers[hi]); } catch (eH) {}
        }
        var keepDock = document.querySelector("#shell-header #app-dock") || document.getElementById("app-dock");
        document.querySelectorAll("nav.app-dock, #app-dock").forEach(function (d) {
          if (keepDock && d !== keepDock) {
            try { d.parentNode.removeChild(d); } catch (eD) {}
          }
        });
        document.querySelectorAll(".shell-mid > .app-dock").forEach(function (d) {
          try { d.parentNode.removeChild(d); } catch (eM) {}
        });
        var header = document.getElementById("shell-header");
        if (!header) return;
        if (document.body.classList.contains("is-framed")) {
          header.style.height = "48px";
          header.style.maxHeight = "48px";
          header.style.minHeight = "0";
          header.style.overflow = "clip";
          header.style.flexWrap = "nowrap";
          header.style.position = "relative";
        } else {
          header.style.height = "";
          header.style.maxHeight = "";
          header.style.minHeight = "";
          header.style.overflow = "";
          header.style.flexWrap = "";
          header.style.position = "";
        }
      }

      function paintDock() {
        ensureSingleChrome();
        var dock = document.getElementById("app-dock");
        if (!dock) return;
        dock.hidden = false;
        var seen = {};
        dock.innerHTML = "";
        function add(href, name, imgSrc, target) {
          if (!href || !name || seen[href]) return;
          seen[href] = 1;
          var a = document.createElement("a");
          a.className = "app-dock-item";
          a.href = href;
          if (target) {
            a.target = target;
            a.rel = "noopener noreferrer";
          }
          if (imgSrc) {
            var img = document.createElement("img");
            img.src = imgSrc;
            img.alt = "";
            img.width = 22;
            img.height = 22;
            a.appendChild(img);
          }
          else {
            var mono = document.createElement("b");
            mono.className = "dock-mono";
            mono.setAttribute("aria-hidden", "true");
            mono.textContent = name.charAt(0).toUpperCase();
            a.appendChild(mono);
          }
          a.setAttribute("aria-label", name);
          a.title = name;
          var span = document.createElement("span");
          span.textContent = name;
          a.appendChild(span);
          if (frameHref && a.href === frameHref) a.classList.add("is-open");
          dock.appendChild(a);
        }
        document.querySelectorAll("#app-groups a.tile").forEach(function (tile) {
          if (tile.id === "keep-going") return;
          if (tile.classList.contains("is-room-hidden")) return;
          if (!hubClassic && tile.getAttribute("data-staff") === "1") return;
          var label = tile.querySelector(".label");
          var img = tile.querySelector("img.mark");
          var tileName = label ? label.textContent.replace(/\s+/g, " ").trim() : "";
          var dockCount = dock.childElementCount;
          add(tile.getAttribute("href"), tileName, img ? img.getAttribute("src") : "", tile.getAttribute("target") || "");
          if (label && label.getAttribute("translate") === "no" && dock.childElementCount > dockCount) {
            dock.lastElementChild.setAttribute("translate", "no");
          }
        });
        if (typeof schoolRows !== "undefined" && schoolRows && schoolRows.forEach) {
          schoolRows.forEach(function (row) { add(row.href, row.name, "", ""); });
        }
        if (typeof readCuts === "function") {
          readCuts().forEach(function (row) { add(row.href, row.name, "", ""); });
        }
        fitDock();
      }

      function fitDock() {
        var dock = document.getElementById("app-dock");
        var menu = document.getElementById("edge-pocket-menu");
        var pocket = document.getElementById("edge-pocket");
        if (!dock || !menu) return;
        var old = menu.querySelector(".more-apps");
        if (old && old.parentNode) old.parentNode.removeChild(old);
        var badge = pocket ? pocket.querySelector(".more-count") : null;
        if (badge) badge.hidden = true;
        var nodes = dock.querySelectorAll(".app-dock-item");
        for (var i = 0; i < nodes.length; i++) nodes[i].classList.remove("is-tucked");
        var phone = window.matchMedia("(max-width: 700px)").matches || window.matchMedia("(max-height: 500px)").matches;
        var wayback = document.documentElement.getAttribute("data-wayback") === "classic" || document.body.classList.contains("hub-classic");
        var skip = phone || document.body.classList.contains("is-framed") || wayback;
        if (skip || !nodes.length) return;
        var guard = 0;
        while (dock.scrollWidth > dock.clientWidth + 1 && guard < nodes.length) {
          var last = null;
          for (var j = nodes.length - 1; j >= 0; j--) {
            if (!nodes[j].classList.contains("is-tucked")) { last = nodes[j]; break; }
          }
          if (!last) break;
          last.classList.add("is-tucked");
          guard += 1;
        }
        var tucked = [];
        for (var k = 0; k < nodes.length; k++) if (nodes[k].classList.contains("is-tucked")) tucked.push(nodes[k]);
        if (!tucked.length) return;
        var box = document.createElement("div");
        box.className = "more-apps";
        var head = document.createElement("p");
        head.className = "more-apps-heading";
        head.setAttribute("data-i18n", "moreApps");
        var label = "More apps";
        try { if (window.KulibertI18n && KulibertI18n.t) label = KulibertI18n.t("moreApps", "More apps"); } catch (eT) {}
        head.textContent = label || "More apps";
        box.appendChild(head);
        tucked.forEach(function (src) {
          var a = document.createElement("a");
          a.className = "edge-pocket-item more-app-row";
          a.setAttribute("role", "menuitem");
          a.href = src.getAttribute("href") || "#";
          var name = src.getAttribute("aria-label") || src.title || "";
          a.setAttribute("aria-label", name);
          if (src.getAttribute("target")) {
            a.target = src.getAttribute("target");
            a.rel = "noopener noreferrer";
          }
          var img = src.querySelector("img");
          var mono = src.querySelector(".dock-mono");
          if (img) {
            var copy = document.createElement("img");
            copy.src = img.getAttribute("src");
            copy.alt = "";
            copy.width = 22;
            copy.height = 22;
            a.appendChild(copy);
          } else if (mono) {
            var mark = document.createElement("b");
            mark.className = "dock-mono";
            mark.setAttribute("aria-hidden", "true");
            mark.textContent = mono.textContent;
            a.appendChild(mark);
          }
          var span = document.createElement("span");
          span.textContent = name;
          a.appendChild(span);
          box.appendChild(a);
        });
        menu.insertBefore(box, menu.firstChild);
        if (!badge && pocket) {
          badge = document.createElement("span");
          badge.className = "more-count";
          badge.setAttribute("aria-hidden", "true");
          pocket.appendChild(badge);
        }
        if (badge) {
          badge.hidden = false;
          badge.textContent = "+" + tucked.length;
        }
      }

      function postWho(frame) {
        if (!frame || !frame.contentWindow) return;
        var api = window.KulibertWho;
        var who = api && api.read ? api.read() : null;
        var on = !!(who && who.verified && api.active && api.active());
        var msg = on ? { type: "kw-who", alias: who.alias, code: who.code, at: who.at || Date.now(), on: true } : { type: "kw-who", on: false };
        var origin = "";
        try {
          var url = new URL(frame.getAttribute("src") || frame.src || "", location.href);
          var host = url.hostname;
          if (!(host === location.hostname || host === "kulibert.net" || host.slice(-13) === ".kulibert.net")) return;
          origin = url.origin;
        } catch (eWho) { return; }
        try { frame.contentWindow.postMessage(msg, origin); } catch (ePost) {}
      }
      function postLang(frame) {
        if (!frame || !frame.contentWindow || hubClassic || !window.KulibertPrefs) return;
        var origin = "";
        try {
          var url = new URL(frame.getAttribute("src") || frame.src || "", location.href);
          var host = url.hostname;
          if (!(host === location.hostname || host === "kulibert.net" || host.slice(-13) === ".kulibert.net")) return;
          origin = url.origin;
        } catch (eLang) { return; }
        if (!origin || origin === "null") return;
        try {
          frame.contentWindow.postMessage({ type: "kp-lang", lang: KulibertPrefs.lang, dir: KulibertPrefs.dir }, origin);
        } catch (ePostLang) {}
      }
      var plateState = null;
      var frameMenuOpen = false;
      function tileNameFor(app) {
        var key = String(app || "").toLowerCase();
        if (!key) return "";
        var alias = { musiclab: "music", music: "music", throwit: "catapult", catapult: "catapult" };
        var want = alias[key] || key;
        var tiles = document.querySelectorAll("#app-groups a.tile");
        for (var i = 0; i < tiles.length; i++) {
          var tile = tiles[i];
          var id = (tile.getAttribute("data-id") || "").toLowerCase();
          var labelEl = tile.querySelector(".label");
          var label = labelEl ? labelEl.textContent.replace(/\s+/g, " ").trim() : "";
          if (!label) continue;
          if (id === want || id === key) return label;
          var href = tile.getAttribute("href") || "";
          var path = "";
          try { path = new URL(href, location.href).pathname.toLowerCase(); } catch (ePath) {}
          if (path === "/" + want || path === "/" + key || path.indexOf("/" + want + "/") === 0 || path.indexOf("/" + key + "/") === 0) return label;
        }
        return "";
      }
      function showPlate(name, version, menu, help, appId) {
        plateState = { name: name || "", version: version || "", menu: !!menu, help: !!help, app: appId || "" };
        var plate = document.getElementById("kb-plate");
        var helpBtn = document.getElementById("kb-help");
        var menuBtn = document.getElementById("kb-menu");
        var gear = document.getElementById("kb-settings");
        var framed = document.body.classList.contains("is-framed");
        if (hubClassic || !framed) {
          if (plate) plate.hidden = true;
          if (helpBtn) helpBtn.hidden = true;
          if (menuBtn) {
            menuBtn.hidden = !!hubClassic;
            if (hubClassic) menuBtn.setAttribute("aria-expanded", "false");
          }
          if (gear) gear.hidden = true;
          return;
        }
        var shown = name || "";
        var slug = String(appId || name || "").toLowerCase();
        var fromTile = tileNameFor(appId || name);
        var own = "";
        try {
          var frameDoc = document.getElementById("app-frame");
          own = frameDoc && frameDoc.contentDocument && frameDoc.contentDocument.title
            ? String(frameDoc.contentDocument.title).replace(/\s+/g, " ").trim() : "";
        } catch (eOwn) { own = ""; }
        function plateNorm(s) {
          return String(s || "").toLowerCase().replace(/['\u2019]s\b/g, "").replace(/[^a-z0-9]+/g, "");
        }
        var postedSlug = !shown || shown.toLowerCase() === slug;
        if (postedSlug && own && plateNorm(own) === plateNorm(slug) && own.length > slug.length) shown = own;
        else if (fromTile && postedSlug) shown = fromTile;
        var narrow = false;
        try { narrow = window.matchMedia("(max-width: 800px)").matches; } catch (eNarrow) {}
        if (plate) {
          plate.hidden = !shown;
          plate.textContent = (!narrow && version) ? shown + " \u00b7 " + version : shown;
        }
        if (helpBtn) helpBtn.hidden = !help;
        if (menuBtn) menuBtn.hidden = false;
        if (gear) gear.hidden = String(appId || name || "").toLowerCase() !== "drawin";
      }
      function openHubSignIn() {
        if (hubClassic) return;
        var slot = document.getElementById("tw-session-slot");
        if (!slot) return;
        slot.hidden = false;
        var out = slot.querySelector(".tw-out");
        var pop = slot.querySelector(".tw-pop");
        if (out && !out.hidden) { out.click(); return; }
        if (pop) {
          pop.hidden = false;
          var code = pop.querySelector(".tw-code");
          if (code) code.focus();
        }
      }
      function fitDockSoon() {
        if (typeof fitDock !== "function") return;
        fitDock();
        if (window.requestAnimationFrame) requestAnimationFrame(function () { fitDock(); });
      }
      /* 2026-10-20-staff-proof-gate: a cold Arabic or Dari load paints the menu word after the first fit.
         That word, and its font, can leave the strip 8px too wide. Refit when they change. */
      function armDockFit() {
        if (armDockFit.armed) return;
        armDockFit.armed = 1;
        var seen = "";
        function snap() {
          var menu = document.getElementById("kb-menu");
          var more = document.getElementById("edge-pocket-btn");
          var clip = document.querySelector(".dock-clip");
          function w(el) { return el ? el.offsetWidth + "x" + el.offsetHeight : ""; }
          return w(menu) + "|" + w(more) + "|" + (clip ? clip.clientWidth : "");
        }
        function kick() {
          var now = snap();
          if (now === seen) return;
          seen = now;
          fitDockSoon();
        }
        if (typeof ResizeObserver === "function") {
          var obs = new ResizeObserver(function () { kick(); });
          var menu = document.getElementById("kb-menu");
          var more = document.getElementById("edge-pocket-btn");
          var clip = document.querySelector(".dock-clip");
          if (menu) obs.observe(menu);
          if (more) obs.observe(more);
          if (clip) obs.observe(clip);
        }
        if (document.fonts && document.fonts.addEventListener) {
          document.fonts.addEventListener("loadingdone", function () { fitDockSoon(); });
        }
        document.addEventListener("DOMContentLoaded", function () {
          if (window.KulibertI18n && KulibertI18n.ready) KulibertI18n.ready(undefined, fitDockSoon);
        });
      }
      window.addEventListener("resize", function () { fitDockSoon(); });
      window.addEventListener("kulibert-lang", function () {
        fitDockSoon();
        if (window.KulibertI18n && KulibertI18n.ready) KulibertI18n.ready(undefined, fitDockSoon);
      });
      if (document.fonts && document.fonts.ready && document.fonts.ready.then) {
        document.fonts.ready.then(function () { fitDockSoon(); });
      }
      armDockFit();
      window.addEventListener("resize", function () {
        if (!plateState || !document.body.classList.contains("is-framed")) return;
        showPlate(plateState.name, plateState.version, plateState.menu, plateState.help, plateState.app);
      });
      function openFrame(href, title, fromPop, replace) {
        href = schoolHref(href);
        if (!href) return;
        if (!hubClassic && window.KulibertPrefs) {
          try {
            var door = new URL(href, location.href);
            if (/^baboo\.kulibert\.net$|^tw\.kulibert\.net$/.test(door.hostname)) {
              door.hash = "kp=" + KulibertPrefs.code();
            }
            door.searchParams.set("lang", KulibertPrefs.lang || "en");
            door.searchParams.set("dir", KulibertPrefs.dir || "ltr");
            href = door.href;
          } catch (eKp) {}
        }
        var frame = document.getElementById("app-frame");
        var home = document.getElementById("shell-home");
        if (!frame) return;
        ensureSingleChrome();
        frame.title = title || "App";
        frame.hidden = false;
        var already = "";
        try { already = frame.contentWindow.location.href; } catch (eHere) {}
        if (frame.getAttribute("src") !== href && already !== href) frame.setAttribute("src", href);
        document.body.classList.add("is-framed");
        parkHomeForFrame(true);
        frameHref = href;
        if (home) home.hidden = false;
        if (typeof setPocket === "function") setPocket(false);
        if (!fromPop) {
          try {
            var abs = new URL(href, location.href);
            var openPath = abs.origin === location.origin ? (abs.pathname + abs.search + abs.hash) : abs.href;
            var u = new URL(location.href);
            if (u.searchParams.get("open") !== openPath) {
              u.searchParams.set("open", openPath);
              var next = u.pathname + u.search + u.hash;
              if (replace) history.replaceState({ techRoomFrame: 1, href: abs.href }, "", next);
              else history.pushState({ techRoomFrame: 1, href: abs.href }, "", next);
            }
          } catch (ePush) {}
        }
        paintDock();
        showPlate(title || "App", "");
        postWho(frame);
        postLang(frame);
      }

      function closeFrame(fromPop) {
        var frame = document.getElementById("app-frame");
        var home = document.getElementById("shell-home");
        document.body.classList.remove("is-framed");
        document.body.classList.remove("shell-gone");
        parkHomeForFrame(false);
        frameHref = "";
        frameMenuOpen = false;
        if (frame) {
          frame.hidden = true;
          frame.setAttribute("src", "about:blank");
        }
        if (home) home.hidden = true;
        showPlate("", "");
        ensureSingleChrome();
        paintDock();
        if (!fromPop) {
          try {
            var u = new URL(location.href);
            if (u.searchParams.has("open")) {
              u.searchParams.delete("open");
              history.replaceState({}, "", u.pathname + u.search + u.hash);
            }
          } catch (eClear) {}
        }
      }

document.addEventListener("click", function (event) {
        if (event.defaultPrevented || event.button !== 0) return;
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        var node = event.target;
        if (!node || !node.closest) return;
        var link = node.closest("a");
        if (!link || link.id === "staff-edit") return;
        var hrefAttr = schoolHref(link.getAttribute("href"));
        if (!hrefAttr) { event.preventDefault(); return; }
        if (!isSameOriginDoor(hrefAttr)) return;
        if (link.getAttribute("data-outside-shell") === "1") return;
        var target = (link.getAttribute("target") || "").toLowerCase();
        if (target === "_blank") return;
        var tileId = link.getAttribute("data-id") || "";
        if (tileId && roomOutsideShell.indexOf(tileId) !== -1) return;
        event.preventDefault();
        var label = (link.querySelector(".label") || link).textContent || "App";
        openFrame(new URL(hrefAttr, location.href).href, label.replace(/\s+/g, " ").trim().slice(0, 80));
      }, true);
      var shellHome = document.getElementById("shell-home");
      if (shellHome) shellHome.addEventListener("click", function () {
        var frame = document.getElementById("app-frame");
        var jobs = [];
        try { if (document.fullscreenElement && document.exitFullscreen) jobs.push(document.exitFullscreen()); } catch (eFs) {}
        try {
          var doc = frame && frame.contentDocument;
          if (doc && doc.fullscreenElement && doc.exitFullscreen) jobs.push(doc.exitFullscreen());
        } catch (eDoc) {}
        Promise.all(jobs.map(function (job) { return Promise.resolve(job).catch(function () {}); })).then(function () { closeFrame(); });
      });

      function helloFrame() {
        var frame = document.getElementById("app-frame");
        if (!frame || frame.hidden) return;
        var src = frame.getAttribute("src") || "";
        if (!src || src === "about:blank") return;
        var note = document.getElementById("announce");
        var text = note && !note.hidden ? String(note.textContent || "").replace(/\s+/g, " ").trim().slice(0, 140) : "";
        try {
          frame.contentWindow.postMessage({ type: "tech-room-hello", embed: true, announce: text }, location.origin);
        } catch (eHello) {}
      }
      var frameEl = document.getElementById("app-frame");
      if (frameEl) frameEl.addEventListener("load", function () {
        if (document.body.classList.contains("is-framed")) helloFrame();
        try {
          syncFrameSession();
          var slot = document.getElementById("tw-session-slot");
          if (slot && slot.__paint) {
            var bit = new URL(frameEl.src, location.href).pathname.split("/").filter(Boolean)[0] || "";
            slot.__paint(bit === "music" ? "musiclab" : bit);
          }
        } catch (eBoot) {}
      });

      function rememberDesk(data) {
        var alias = data && typeof data.alias === "string" ? data.alias.replace(/[<>]/g, "").slice(0, 16) : "";
        var code = data && typeof data.code === "string" ? data.code.replace(/[^A-Z0-9-]/g, "").slice(0, 16) : "";
        var chip = document.getElementById("desk-chip");
        var bar = document.getElementById("stickies");
        var labels = document.querySelectorAll('a.tile[data-id="catapult"] .label');
        if (!alias || !code) {
          if (data && data.type === "tech-room-progress") {
            try { localStorage.removeItem("tech-room-progress"); } catch (eClear) {}
          }
          if (chip) { chip.hidden = true; chip.textContent = ""; }
          for (var i = 0; i < labels.length; i++) labels[i].textContent = "Bertapult";
          var note = document.getElementById("announce");
          if (bar && note && note.hidden) bar.hidden = true;
          return;
        }
        try { localStorage.setItem("tech-room-progress", JSON.stringify({ type: "tech-room-progress", app: "throwit", alias: alias, code: code })); } catch (eSave) {}
        if (bar) bar.hidden = false;
        if (chip) { chip.hidden = false; chip.textContent = "Bertapult · " + alias + " · " + code; }
        for (var j = 0; j < labels.length; j++) labels[j].textContent = "Bertapult · " + code;
      }
      try { rememberDesk(JSON.parse(localStorage.getItem("tech-room-progress") || "null")); } catch (eDesk) {}
      window.addEventListener("message", function (ev) {
        if (ev.origin !== location.origin) return;
        var data = ev.data;
        if (!data) return;
        if (data.type === "tech-room-progress" && data.app === "throwit") { rememberDesk(data); return; }
        if (data.type === "kw-shell") {
          document.body.classList.toggle("shell-gone", !!data.hide);
          try {
            var live = document.getElementById("app-frame");
            if (live && live.contentWindow) live.contentWindow.postMessage({ type: "tw-hide", hide: !!data.hide }, location.origin);
          } catch (eHide) {}
          return;
        }
        if (data.type === "tech-room-open" && typeof data.href === "string" && isSameOriginDoor(data.href)) {
          try { openFrame(new URL(data.href, location.href).href, "App", false, !!data.replace); } catch (eOpen) {}
          return;
        }
        if (data.type === "kw-orient") {
          window.__brWide = !!data.landscape;
          if (!data.landscape) {
            try { screen.orientation && screen.orientation.unlock && screen.orientation.unlock(); } catch (eOff) {}
            return;
          }
          var frame = document.getElementById("app-frame");
          var host = frame || document.documentElement;
          var go = Promise.resolve();
          if (!document.fullscreenElement && host.requestFullscreen) {
            go = host.requestFullscreen().catch(function () {});
          }
          go.then(function () {
            if (!window.__brWide || !screen.orientation || !screen.orientation.lock) return;
            screen.orientation.lock("landscape").catch(function () {
              return screen.orientation.lock("landscape-primary");
            }).catch(function () {});
          });
          return;
        }
        if (data.type !== "tech-room-home") return;
        if (document.body.classList.contains("is-framed")) {
          var jobs = [];
          try { if (document.fullscreenElement && document.exitFullscreen) jobs.push(document.exitFullscreen()); } catch (eFs2) {}
          try {
            var live = document.getElementById("app-frame");
            var doc = live && live.contentDocument;
            if (doc && doc.fullscreenElement && doc.exitFullscreen) jobs.push(doc.exitFullscreen());
          } catch (eDoc2) {}
          Promise.all(jobs.map(function (job) { return Promise.resolve(job).catch(function () {}); })).then(function () { closeFrame(); });
        }
      });
      window.addEventListener("orientationchange", function () {
        if (!window.__brWide || !screen.orientation || !screen.orientation.lock) return;
        screen.orientation.lock("landscape").catch(function () {});
      });
      function newestPlay() {
        var rows = [];
        try { rows = window.KulibertWho && KulibertWho.records ? KulibertWho.records() : []; } catch (eRec) { rows = []; }
        rows = (rows || []).filter(function (row) { return row && row.app && row.event !== "line"; });
        if (rows.length) return rows[rows.length - 1];
        try {
          var opened = JSON.parse(localStorage.getItem("tech-room-opened") || "[]");
          if (opened && opened[0] && opened[0].href) return { app: "", href: opened[0].href, name: opened[0].name || "" };
        } catch (eOpen) {}
        return null;
      }
      function paintKeep() {
        var old = document.getElementById("keep-going");
        if (old && old.parentNode) old.parentNode.removeChild(old);
        if (hubClassic) return;
        var row = newestPlay();
        if (!row) return;
        var board = document.getElementById("alpha-board");
        if (!board) return;
        var id = row.app === "music" ? "musiclab" : row.app;
        var tile = id ? appBoard.querySelector('a.tile[data-id="' + id + '"]') : null;
        var href = row.href || (tile ? tile.getAttribute("href") : "");
        if (!href) return;
        if (row.level) {
          var join = href.indexOf("?") >= 0 ? "&" : "?";
          if (href.indexOf("level=") < 0) href += join + "level=" + encodeURIComponent(row.level);
        }
        var name = tile ? tileName(tile) : (row.name || row.app || "that app");
        var a = document.createElement("a");
        a.id = "keep-going";
        a.className = "tile keep-going";
        a.href = href;
        var img = tile && tile.querySelector("img.mark");
        if (img) a.appendChild(img.cloneNode(true));
        var label = document.createElement("span");
        label.className = "label";
        label.textContent = "Keep going: " + name + (row.level ? " · level " + row.level : "");
        a.appendChild(label);
        board.insertBefore(a, board.firstChild);
      }
      function paintProgress() {
        var box = document.getElementById("progress");
        var btn = document.getElementById("my-progress-btn");
        if (btn) btn.hidden = !!hubClassic;
        if (!box || hubClassic) { if (box) box.hidden = true; return; }
        var api = window.KulibertWho;
        var who = api && api.read ? api.read() : null;
        var on = !!(who && who.verified && api.active && api.active());
        if (!on) {
          box.innerHTML = '<h2>My progress</h2><p>Sign in to see your progress.</p><button type="button" class="btn btn-secondary" id="progress-sign">Sign in</button>';
          var sign = document.getElementById("progress-sign");
          if (sign) sign.addEventListener("click", function () {
            var out = document.querySelector(".tw-out");
            if (out) out.click();
          });
          return;
        }
        var rows = api.records ? api.records().filter(function (row) { return row && row.code === who.code && row.event !== "line"; }) : [];
        var xp = 0;
        var by = {};
        rows.forEach(function (row) {
          xp += Number(row.xp) || 0;
          var key = row.app;
          var cur = by[key] || { app: key, score: null, max: null, stars: 0, ts: 0, skill: "" };
          if (row.score != null && (cur.score == null || row.score > cur.score)) { cur.score = row.score; cur.max = row.max; }
          if ((row.stars || 0) > cur.stars) cur.stars = row.stars;
          if ((row.ts || 0) > cur.ts) cur.ts = row.ts;
          if (row.skill) cur.skill = row.skill;
          by[key] = cur;
        });
        var level = Math.floor(xp / 50) + 1;
        var html = '<h2>' + who.alias + ' · ' + xp + ' XP · Level ' + level + '</h2>';
        Object.keys(by).forEach(function (key) {
          var row = by[key];
          var id = key === "music" ? "musiclab" : key;
          var tile = appBoard.querySelector('a.tile[data-id="' + id + '"]');
          var name = tile ? tileName(tile) : key;
          var src = tile && tile.querySelector("img") ? tile.querySelector("img").getAttribute("src") : "";
          var when = row.ts ? new Date(row.ts).toLocaleDateString("en", { weekday: "short" }) : "";
          var score = row.score == null ? "" : (row.score + (row.max != null ? "/" + row.max : ""));
          html += '<div class="progress-row"><img alt="" src="' + src + '"/><span><strong>' + name + '</strong> ' + (row.stars ? "★".repeat(Math.min(3, row.stars)) + " " : "") + score + ' ' + when + (row.skill ? ' <em>' + row.skill + '</em>' : '') + '</span><button type="button" data-play="' + id + '">Play</button></div>';
        });
        html += '<p class="progress-note">Saved on this Chromebook</p>';
        box.innerHTML = html;
        box.querySelectorAll("[data-play]").forEach(function (btn) {
          btn.addEventListener("click", function () {
            var id = btn.getAttribute("data-play");
            var tile = appBoard.querySelector('a.tile[data-id="' + id + '"]');
            if (!tile) return;
            box.hidden = true;
            openFrame(tile.getAttribute("href"), tileName(tile));
          });
        });
        if (who.code) {
          fetch("https://tw.kulibert.net/api/marks?code=" + encodeURIComponent(who.code)).then(function (res) {
            if (!res.ok) return;
            var note = box.querySelector(".progress-note");
            if (note) note.textContent = "Saved to TechWorks";
          }).catch(function () {});
        }
      }
      var progressBtn = document.getElementById("my-progress-btn");
      if (progressBtn) progressBtn.addEventListener("click", function () {
        var box = document.getElementById("progress");
        if (!box) return;
        paintProgress();
        box.hidden = !box.hidden;
        if (typeof setPocket === "function") setPocket(false);
      });
      var kbHelp = document.getElementById("kb-help");
      if (kbHelp) kbHelp.addEventListener("click", function () {
        var frame = document.getElementById("app-frame");
        if (!frame || !frame.contentWindow) return;
        try { frame.contentWindow.postMessage({ type: "kb-help" }, "*"); } catch (eHelp) {}
      });
      var kpReturnFocus = null;
      function paintCloseLabels() {
        var lang = "en";
        var dir = "ltr";
        try {
          if (window.KulibertPrefs && KulibertPrefs.get) {
            var p = KulibertPrefs.get();
            lang = (p && p.lang) || "en";
            dir = p && p.dir === "rtl" ? "rtl" : "ltr";
          }
        } catch (eCloseLang) {}
        if (lang === "simple") lang = "en";
        document.querySelectorAll(".hub-close-label").forEach(function (el) {
          el.lang = lang;
          el.dir = dir;
        });
      }
      function syncHubBackdrop() {
        var back = document.getElementById("hub-drawer-backdrop");
        if (!back) return;
        var classic = document.body.classList.contains("hub-classic");
        var drawer = document.getElementById("hub-drawer");
        var panel = document.getElementById("kp-panel");
        var open = !classic && ((drawer && !drawer.hidden) || (panel && !panel.hidden));
        back.hidden = !open;
        document.body.classList.toggle("hub-settings-open", !!(panel && !panel.hidden && !classic));
      }
      function hubDrawer(open, opts) {
        var box = document.getElementById("hub-drawer");
        var btn = document.getElementById("kb-menu");
        if (!box || !btn || document.body.classList.contains("hub-classic")) return;
        var next = open == null ? box.hidden : !!open;
        box.hidden = !next;
        btn.setAttribute("aria-expanded", next ? "true" : "false");
        syncHubBackdrop();
        if (next) {
          if (window.KulibertI18n) KulibertI18n.paint();
          paintCloseLabels();
          var closeBtn = document.getElementById("hub-drawer-close");
          if (closeBtn) closeBtn.focus();
        } else if (!(opts && opts.keepFocus)) {
          btn.focus();
        }
      }
      var kbMenu = document.getElementById("kb-menu");
      if (kbMenu) kbMenu.addEventListener("click", function () {
        if (!document.body.classList.contains("hub-classic") && document.body.classList.contains("is-framed") && plateState && plateState.menu) {
          var frame = document.getElementById("app-frame");
          if (frame && frame.contentWindow) {
            var opening = kbMenu.getAttribute("aria-expanded") !== "true";
            frameMenuOpen = opening;
            if (!opening) kbMenu.setAttribute("aria-expanded", "false");
            try { frame.contentWindow.postMessage({ type: "kb-menu" }, "*"); } catch (eMenu) {}
            return;
          }
        }
        hubDrawer();
      });
      function closeHubDrawer(opts) { hubDrawer(false, opts); }
      var hubDrawerClose = document.getElementById("hub-drawer-close");
      if (hubDrawerClose) hubDrawerClose.addEventListener("click", function () { closeHubDrawer(); });
      var hubBackdrop = document.getElementById("hub-drawer-backdrop");
      if (hubBackdrop) hubBackdrop.addEventListener("click", function (event) {
        event.preventDefault();
        event.stopPropagation();
        var panel = document.getElementById("kp-panel");
        if (panel && !panel.hidden) {
          var settingsClose = document.getElementById("kp-close");
          if (settingsClose) settingsClose.click();
          return;
        }
        closeHubDrawer();
      });
      var drawerSettings = document.getElementById("drawer-settings");
      if (drawerSettings) drawerSettings.addEventListener("click", function () {
        kpReturnFocus = document.getElementById("kb-menu");
        closeHubDrawer({ keepFocus: true });
        var btn = document.getElementById("my-settings");
        if (btn) btn.click();
      });
      var drawerSign = document.getElementById("drawer-signin");
      if (drawerSign) drawerSign.addEventListener("click", function () {
        closeHubDrawer();
        openHubSignIn();
      });
      var drawerProgress = document.getElementById("drawer-progress");
      if (drawerProgress) drawerProgress.addEventListener("click", function () {
        closeHubDrawer();
        var btn = document.getElementById("my-progress-btn");
        if (btn) btn.click();
      });
      var drawerStaff = document.getElementById("drawer-staff");
      if (drawerStaff) drawerStaff.addEventListener("click", function () {
        var box = document.getElementById("hub-drawer-staff");
        if (!box) return;
        paintStaffDrawer();
        var open = box.hidden;
        box.hidden = !open;
        drawerStaff.setAttribute("aria-expanded", open ? "true" : "false");
      });
      var kbSettings = document.getElementById("kb-settings");
      if (kbSettings) kbSettings.addEventListener("click", function () {
        var frame = document.getElementById("app-frame");
        if (!frame || !frame.contentWindow) return;
        try { frame.contentWindow.postMessage({ type: "kb-settings" }, "*"); } catch (eSet) {}
      });
      var appFrame = document.getElementById("app-frame");
      if (appFrame) appFrame.addEventListener("load", function () { postWho(appFrame); postLang(appFrame); });
      window.addEventListener("message", function (ev) {
        var data = ev.data;
        if (!data || !data.type) return;
        var host = "";
        try { host = new URL(ev.origin).hostname; } catch (eHost) { return; }
        if (!(host === location.hostname || host === "kulibert.net" || host.slice(-13) === ".kulibert.net")) return;
        if (data.type === "kb-app") {
          var nextApp = data.app || "";
          if (!plateState || plateState.app !== nextApp) frameMenuOpen = false;
          showPlate(data.name || data.app || "App", data.version || "", !!data.menu, !!data.help, data.app || "");
          var liveFrame = document.getElementById("app-frame");
          if (liveFrame && ev.source && liveFrame.contentWindow === ev.source) postWho(liveFrame);
        }
        if (data.type === "kb-menu-state") {
          frameMenuOpen = !!data.open;
          var menuBtn = document.getElementById("kb-menu");
          if (menuBtn) menuBtn.setAttribute("aria-expanded", data.open ? "true" : "false");
        }
        if (data.type === "kb-esc") {
          var liveEsc = document.getElementById("app-frame");
          if (!liveEsc || !ev.source || liveEsc.contentWindow !== ev.source) return;
          if (!document.body.classList.contains("is-framed") || document.body.classList.contains("hub-classic")) return;
          var staffEsc = document.getElementById("staff-gate");
          if (staffEsc && !staffEsc.hidden) return;
          if (modal && !modal.hidden) return;
          var kpEsc = document.getElementById("kp-panel");
          if (kpEsc && !kpEsc.hidden) return;
          var hubEsc = document.getElementById("hub-drawer");
          if (hubEsc && !hubEsc.hidden) return;
          if (frameMenuOpen && plateState && plateState.menu) {
            frameMenuOpen = false;
            var menuEsc2 = document.getElementById("kb-menu");
            if (menuEsc2) menuEsc2.setAttribute("aria-expanded", "false");
            try { liveEsc.contentWindow.postMessage({ type: "kb-menu" }, "*"); } catch (eEsc2) {}
            return;
          }
          closeFrame();
        }
        if (data.type === "tw-session-open") openHubSignIn();
        if (data.type === "kw-record") {
          if (data.row && data.row.v === 2 && data.row.app) {
            try {
              var kept = JSON.parse(localStorage.getItem("kw-records-v1") || "[]");
              if (!Array.isArray(kept)) kept = [];
              var seen = kept.some(function (item) {
                return item && item.app === data.row.app && item.level === data.row.level && item.ts === data.row.ts;
              });
              if (!seen) localStorage.setItem("kw-records-v1", JSON.stringify(kept.concat([data.row]).slice(-300)));
            } catch (eKeep) {}
          }
          paintKeep();
          paintProgress();
        }
      });
      try {
        if (new URLSearchParams(location.search).get("view") === "progress" && !hubClassic) {
          var box = document.getElementById("progress");
          if (box) { paintProgress(); box.hidden = false; }
        } else paintProgress();
      } catch (eView) {}
      try {
        if (localStorage.getItem("tech-room-pwa-tip") === "1") document.documentElement.setAttribute("data-pwa-tip", "off");
      } catch (ePwa) {}

      (function captureDoor() {
        var open;
        try { open = new URLSearchParams(location.search).get("open"); } catch (e) { return; }
        if (!open || !isSameOriginDoor(open)) return;
        var url;
        try { url = new URL(open, location.href); } catch (e2) { return; }
        if (url.origin !== location.origin) {
          var host = url.hostname;
          if (!(host === "kulibert.net" || host.slice(-13) === ".kulibert.net")) return;
        }
        var title = "App";
        var tiles = document.querySelectorAll("a.tile");
        for (var i = 0; i < tiles.length; i++) {
          var href = tiles[i].getAttribute("href") || "";
          try {
            if (new URL(href, location.href).pathname.replace(/\/$/, "") === url.pathname.replace(/\/$/, "")) {
              var label = tiles[i].querySelector(".label");
              if (label) title = label.textContent.replace(/\s+/g, " ").trim().slice(0, 80);
              break;
            }
          } catch (e3) {}
        }
        openFrame(url.href, title);
      })();

      window.addEventListener("popstate", function () {
        ensureSingleChrome();
        var openParam = null;
        try { openParam = new URLSearchParams(location.search).get("open"); } catch (ePop) {}
        if (openParam && isSameOriginDoor(openParam)) {
          try {
            openFrame(new URL(openParam, location.href).href, "App", true);
          } catch (eOpen) {
            closeFrame(true);
          }
        } else {
          closeFrame(true);
        }
      });
      window.addEventListener("pageshow", function () {
        ensureSingleChrome();
      });

      paint();
      paintCuts();
      (function wireSettings() {
        var btn = document.getElementById("my-settings");
        var panel = document.getElementById("kp-panel");
        var help = document.getElementById("kp-help");
        if (!btn || !panel || !window.KulibertPrefs) return;
        var HELP = {
          en: "Pick a size. Your apps can use it."
        };
        function prefs() { return KulibertPrefs.get(); }
        function syncHubLang() {
          if (hubClassic) {
            document.documentElement.lang = "en";
            document.documentElement.dir = "ltr";
            return;
          }
          var p = prefs();
          document.documentElement.lang = p.lang === "simple" ? "en" : p.lang;
          document.documentElement.dir = p.dir === "rtl" ? "rtl" : "ltr";
        }
        function paintSettings() {
          var p = prefs();
          panel.querySelectorAll("[data-size]").forEach(function (b) {
            b.setAttribute("aria-pressed", b.getAttribute("data-size") === p.size ? "true" : "false");
          });
          document.getElementById("kp-contrast").setAttribute("aria-pressed", p.contrast ? "true" : "false");
          document.getElementById("kp-motion").setAttribute("aria-pressed", p.motion === "less" ? "true" : "false");
          document.getElementById("kp-sound").setAttribute("aria-pressed", p.sound ? "true" : "false");
          document.getElementById("kp-captions").setAttribute("aria-pressed", p.captions ? "true" : "false");
          document.getElementById("kp-read").setAttribute("aria-pressed", p.read ? "true" : "false");
          var namesBtn = document.getElementById("kp-names");
          if (namesBtn) namesBtn.setAttribute("aria-pressed", document.body.classList.contains("dock-names") ? "true" : "false");
          panel.querySelectorAll("[data-lang]").forEach(function (b) {
            b.setAttribute("aria-pressed", b.getAttribute("data-lang") === p.lang ? "true" : "false");
          });
          var group = document.getElementById("kp-lang");
          if (group && window.KulibertI18n) {
            var name = KulibertI18n.t("language");
            if (name) group.setAttribute("aria-label", name);
          }
          var note = document.getElementById("kp-lang-note");
          if (note) {
            note.lang = p.lang === "simple" ? "en" : p.lang;
            note.dir = p.dir === "rtl" ? "rtl" : "ltr";
          }
          if (window.KulibertI18n) KulibertI18n.paint();
          if (help) {
            var sizeLine = window.KulibertI18n ? KulibertI18n.t("pickSize") : "";
            help.textContent = sizeLine || "Pick a size. Your apps can use it.";
            help.lang = p.lang === "simple" ? "en" : p.lang;
            help.dir = p.dir === "rtl" ? "rtl" : "ltr";
          }
          document.querySelectorAll("a.tile").forEach(function (a) {
            var href = a.getAttribute("href") || "";
            if (!/baboo\.kulibert\.net|tw\.kulibert\.net/.test(href)) return;
            a.setAttribute("href", href.split("#")[0] + "#kp=" + KulibertPrefs.code());
          });
          document.querySelectorAll(".tile .label").forEach(function (el) {
            el.setAttribute("dir", "ltr");
            if (!el.querySelector("bdi")) {
              var bdi = document.createElement("bdi");
              while (el.firstChild) bdi.appendChild(el.firstChild);
              el.appendChild(bdi);
            }
          });
        }
        function shut() {
          panel.hidden = true;
          btn.setAttribute("aria-expanded", "false");
          var backTo = kpReturnFocus || btn;
          kpReturnFocus = null;
          if (typeof syncHubBackdrop === "function") syncHubBackdrop();
          if (backTo && backTo.focus) backTo.focus();
        }
        btn.addEventListener("click", function () {
          if (!panel.hidden) { shut(); return; }
          if (!kpReturnFocus) kpReturnFocus = btn;
          panel.hidden = false;
          btn.setAttribute("aria-expanded", "true");
          if (typeof syncHubBackdrop === "function") syncHubBackdrop();
          if (typeof paintCloseLabels === "function") paintCloseLabels();
          var closeBtn = document.getElementById("kp-close");
          if (closeBtn) closeBtn.focus();
        });
        panel.addEventListener("click", function (event) {
          var t = event.target.closest("button");
          if (!t) return;
          if (t.id === "kp-close") { shut(); return; }
          if (t.hasAttribute("data-size")) KulibertPrefs.set({ size: t.getAttribute("data-size") });
          if (t.id === "kp-contrast") KulibertPrefs.set({ contrast: t.getAttribute("aria-pressed") !== "true" });
          if (t.id === "kp-motion") KulibertPrefs.set({ motion: t.getAttribute("aria-pressed") === "true" ? "full" : "less" });
          if (t.id === "kp-sound") KulibertPrefs.set({ sound: t.getAttribute("aria-pressed") !== "true" });
          if (t.id === "kp-captions") KulibertPrefs.set({ captions: t.getAttribute("aria-pressed") !== "true" });
          if (t.id === "kp-read") {
            var on = t.getAttribute("aria-pressed") !== "true";
            KulibertPrefs.set({ read: on });
            if (on) KulibertPrefs.say(help.textContent);
          }
          if (t.hasAttribute("data-lang")) KulibertPrefs.set({ lang: t.getAttribute("data-lang") });
          if (t.id === "kp-names") {
            var showNames = !document.body.classList.contains("dock-names");
            document.body.classList.toggle("dock-names", showNames);
            try {
              if (showNames) localStorage.setItem("tech-room-dock-names", "1");
              else localStorage.removeItem("tech-room-dock-names");
            } catch (eNames) {}
          }
          paintSettings();
          if (typeof paintCloseLabels === "function") paintCloseLabels();
        });
        paintSettings();
        syncHubLang();
        if (typeof fitDockSoon === "function") fitDockSoon();
        window.addEventListener("kulibert-lang", function () {
          syncHubLang();
          paintSettings();
          if (typeof paintCloseLabels === "function") paintCloseLabels();
          if (typeof fitDockSoon === "function") fitDockSoon();
          var frame = document.getElementById("app-frame");
          if (frame && document.body.classList.contains("is-framed")) postLang(frame);
        });
      })();
      loadSchool();
      setInterval(loadSchool, POLL);
      document.addEventListener("visibilitychange", function () {
        if (document.visibilityState === "visible") loadSchool();
      });
      var helpBtn = document.getElementById("drawer-help");
      var helpBox = document.getElementById("hub-help");
      var helpClose = document.getElementById("hub-help-close");
      if (helpBtn && helpBox) helpBtn.addEventListener("click", function () {
        helpBox.hidden = false;
        if (helpClose) helpClose.focus();
      });
      if (helpClose && helpBox) helpClose.addEventListener("click", function () { helpBox.hidden = true; });
      document.addEventListener("keydown", function (ev) {
        if (ev.key === "Escape" && helpBox && !helpBox.hidden) helpBox.hidden = true;
      });
    })();
  
