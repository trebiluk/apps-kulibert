(function () {
  var STATUSES = ["Live", "Building", "Blocked", "Waiting on Diego"];
  var rows = [];
  var editing = false;
  var gate = document.getElementById("gate");
  var tools = document.getElementById("tools");
  var board = document.getElementById("board");
  var miss = document.getElementById("miss");
  // MC 2: live versions read from the hub's version list, status filter chips, search, board age.
  var hub = {};
  var hubLoaded = false;
  var filterStatus = "All";
  var query = "";
  var updated = "";
  var summary = document.getElementById("summary");
  function norm(v) { return text(v).toLowerCase().replace(/&amp;/g, "&").replace(/[^a-z0-9&]+/g, " ").trim(); }
  function bare(v) { return text(v).replace(/^[a-z ]*?(?=\d)/i, "").trim(); }
  function hubFor(row) { return hub[norm(row.app)] || null; }
  function nums(v) { return bare(v).split(/[^0-9]+/).filter(Boolean).map(Number); }
  function newer(a, b) { var x = nums(a), y = nums(b), i; for (i = 0; i < Math.max(x.length, y.length); i++) { if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) > (y[i] || 0); } return false; }
  function hubNewer(row) { var h = hubFor(row); return !!(h && newer(h.version, row.version)); }
  function differs(row) { var h = hubFor(row); return !!(h && bare(h.version) !== bare(row.version)); }
  function visible(row) {
    if (filterStatus === "Out of date") { if (!hubNewer(row)) return false; }
    else if (filterStatus !== "All" && row.status !== filterStatus) return false;
    if (!query) return true;
    return norm([row.app, row.lane, row.note, row.version].join(" ")).indexOf(norm(query)) !== -1;
  }
  function paintSummary() {
    if (!summary) return;
    summary.replaceChildren();
    var age = "";
    if (updated) {
      var days = Math.floor((Date.now() - new Date(updated + "T12:00:00").getTime()) / 86400000);
      age = "Board updated " + updated + (days > 0 ? " (" + days + (days === 1 ? " day" : " days") + " ago)" : " (today)");
    }
    var p = document.createElement("p");
    p.className = "age";
    p.textContent = age + (hubLoaded ? " · Hub versions checked now" : "");
    var chips = document.createElement("div");
    chips.className = "chips";
    chips.setAttribute("role", "group");
    chips.setAttribute("aria-label", "Show");
    ["All"].concat(STATUSES, ["Out of date"]).forEach(function (name) {
      var n = name === "All" ? rows.length : name === "Out of date" ? rows.filter(hubNewer).length : rows.filter(function (r) { return r.status === name; }).length;
      if (!n && name !== "All" && name !== filterStatus) return;
      var b = document.createElement("button");
      b.type = "button";
      b.className = "chip";
      b.setAttribute("aria-pressed", name === filterStatus ? "true" : "false");
      b.innerHTML = (name === "All" || name === "Out of date" ? "" : mark(name)) + "<span>" + escapeText(name) + "</span> <strong>" + n + "</strong>";
      b.addEventListener("click", function () { readEdits(); filterStatus = name; render(); });
      chips.appendChild(b);
    });
    var lab = document.createElement("label");
    lab.className = "find";
    lab.innerHTML = '<span>Find</span><input type="search" id="mc-find" autocomplete="off" placeholder="App, lane or note">';
    var inp = lab.querySelector("input");
    inp.value = query;
    inp.addEventListener("input", function () { readEdits(); query = inp.value; render(true); });
    summary.append(p, chips, lab);
  }

  function staff() {
    return !!(window.HubStaffAuth && HubStaffAuth.isUnlocked && HubStaffAuth.isUnlocked());
  }

  function mark(status) {
    var path = {
      Live: '<path d="M5 12 l4 4 10-10" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
      Building: '<path d="M4 16 l6-6 2 2-6 6z M13 7 l4-4 4 4-4 4z" fill="currentColor"/>',
      Blocked: '<path d="M7 7 l10 10 M17 7 L7 17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
      "Waiting on Diego": '<circle cx="12" cy="12" r="7" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 8 v5 l3 2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'
    };
    var d = path[status] || path["Waiting on Diego"];
    return '<svg class="mark" viewBox="0 0 24 24" aria-hidden="true">' + d + "</svg>";
  }

  function text(value) {
    return value == null ? "" : String(value);
  }

  function readEdits() {
    if (!editing) return;
    var cards = board.querySelectorAll(".card");
    cards.forEach(function (card) {
      var row = rows[+card.dataset.idx];
      if (!row) return;
      row.app = text(card.querySelector('[data-field="app"]').value).trim();
      row.version = text(card.querySelector('[data-field="version"]').value).trim();
      row.lane = text(card.querySelector('[data-field="lane"]').value).trim();
      row.status = card.querySelector('[data-field="status"]').value;
      row.note = text(card.querySelector('[data-field="note"]').value).trim();
    });
  }

  function field(row, key, label) {
    var id = row.id + "-" + key;
    if (key === "status") {
      var options = STATUSES.map(function (name) {
        var on = name === row.status ? " selected" : "";
        return "<option" + on + ">" + name + "</option>";
      }).join("");
      return '<label for="' + id + '"><span>' + label + '</span><select id="' + id + '" data-field="status">' + options + "</select></label>";
    }
    if (key === "note") {
      return '<label for="' + id + '"><span>' + label + '</span><textarea id="' + id + '" data-field="note">' + escapeText(row.note) + "</textarea></label>";
    }
    return '<label for="' + id + '"><span>' + label + '</span><input id="' + id + '" data-field="' + key + '" value="' + escapeAttr(row[key]) + '"></label>';
  }

  function escapeText(value) {
    var amp = "\u0026";
    return text(value).replace(/&/g, amp + "amp;").replace(/</g, amp + "lt;").replace(/>/g, amp + "gt;");
  }

  function escapeAttr(value) {
    return escapeText(value).replace(/"/g, "\u0026quot;");
  }

  function render(keepSummary) {
    if (!keepSummary) paintSummary();
    board.replaceChildren();
    var shown = 0;
    rows.forEach(function (row, idx) {
      if (!visible(row)) return;
      shown++;
      var card = document.createElement("article");
      card.className = "card";
      card.dataset.idx = idx;
      var h = hubFor(row);
      var hubLine = h ? (differs(row)
        ? '<div class="drift"><dt>Hub</dt><dd><a href="' + escapeAttr(h.door) + '">' + escapeText(h.version) + "</a> <em>" + (hubNewer(row) ? "is newer than the board" : "is older than the board (hub list is behind)") + "</em></dd></div>"
        : '<div><dt>Hub</dt><dd><a href="' + escapeAttr(h.door) + '">' + escapeText(h.version) + "</a> matches</dd></div>") : "";
      if (editing) {
        card.innerHTML = "<h2>" + escapeText(row.app || "Untitled") + "</h2>"
          + field(row, "app", "App")
          + field(row, "version", "Version")
          + field(row, "lane", "Lane")
          + field(row, "status", "Status")
          + field(row, "note", "Note");
      } else {
        card.innerHTML = '<header><h2>' + escapeText(row.app || "Untitled") + "</h2></header>"
          + '<dl class="meta">'
          + "<div><dt>Version</dt><dd>" + escapeText(row.version) + "</dd></div>"
          + "<div><dt>Lane</dt><dd>" + escapeText(row.lane) + "</dd></div>"
          + '<div><dt>Status</dt><dd class="status" data-status="' + escapeAttr(row.status) + '">' + mark(row.status) + "<span>" + escapeText(row.status) + "</span></dd></div>"
          + "<div><dt>Note</dt><dd>" + escapeText(row.note) + "</dd></div>"
          + hubLine
          + "</dl>";
      }
      board.appendChild(card);
    });
    if (!shown) {
      var none = document.createElement("p");
      none.className = "none";
      none.textContent = "No apps match.";
      board.appendChild(none);
    }
  }

  function exportBoard() {
    readEdits();
    var blob = new Blob([JSON.stringify({ updated: new Date().toISOString().slice(0, 10), rows: rows }, null, 2) + "\n"], { type: "application/json" });
    var link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "board.json";
    link.click();
    setTimeout(function () { URL.revokeObjectURL(link.href); }, 1000);
  }

  function paintTools() {
    var on = staff();
    gate.hidden = on;
    gate.textContent = on ? "" : "View only";
    tools.replaceChildren();
    if (!on) {
      if (editing) {
        editing = false;
        render();
      }
      return;
    }
    var edit = document.createElement("button");
    edit.type = "button";
    edit.setAttribute("aria-pressed", editing ? "true" : "false");
    var pencil = '<svg class="mark" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 16 l8-8 4 4-8 8H4z M13 7 l4-4 4 4-4 4z" fill="currentColor"/></svg>';
    edit.innerHTML = pencil + "<span>" + (editing ? "Editing" : "Edit") + "</span>";
    edit.addEventListener("click", function () {
      if (editing) readEdits();
      editing = !editing;
      render();
      paintTools();
      var next = tools.querySelector("button");
      if (next) next.focus();
    });
    var save = document.createElement("button");
    save.type = "button";
    save.innerHTML = '<svg class="mark" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4 v10 M8 10 l4 4 4-4 M5 19 h14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg><span>Export board.json</span>';
    save.addEventListener("click", exportBoard);
    var sync = document.createElement("button");
    sync.type = "button";
    sync.innerHTML = '<svg class="mark" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12 a7 7 0 0 1 12-5 l2 2 M19 4 v5 h-5 M19 12 a7 7 0 0 1-12 5 l-2-2 M5 20 v-5 h5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg><span>Take newer hub versions</span>';
    sync.disabled = !hubLoaded;
    sync.addEventListener("click", function () {
      readEdits();
      var n = 0;
      rows.forEach(function (r) { var hh = hubFor(r); if (hh && hubNewer(r)) { r.version = hh.version; n++; } });
      var known = {};
      rows.forEach(function (r) { known[norm(r.app)] = 1; });
      var added = 0;
      Object.keys(hub).forEach(function (k) {
        if (known[k]) return;
        var hh = hub[k];
        rows.push({ id: hh.door.replace(/\//g, ""), app: hh.name, version: hh.version, lane: "", status: "Live", note: "" });
        added++;
      });
      updated = new Date().toISOString().slice(0, 10);
      render();
      gate.hidden = false;
      gate.textContent = n + " versions updated, " + added + " apps added from the hub. Export board.json to keep them.";
    });
    tools.append(edit, sync, save);
  }

  paintTools();
  window.addEventListener("storage", paintTools);
  window.addEventListener("pageshow", paintTools);

  fetch("/", { cache: "no-store" }).then(function (res) { return res.ok ? res.text() : ""; }).then(function (html) {
    if (!html) return;
    var doc = new DOMParser().parseFromString(html, "text/html");
    doc.querySelectorAll("li[data-door]").forEach(function (li) {
      var a = li.querySelector("a"), v = li.querySelector("strong");
      if (!a || !v) return;
      var name = text(a.textContent).replace(v.textContent, "").trim();
      hub[norm(name)] = { name: name, version: text(v.textContent).trim(), door: li.getAttribute("data-door") };
    });
    hubLoaded = Object.keys(hub).length > 0;
    render();
    paintTools();
  }).catch(function () {});

  fetch("board.json", { cache: "no-store" }).then(function (res) {
    if (!res.ok) throw new Error("board");
    return res.json();
  }).then(function (data) {
    rows = Array.isArray(data.rows) ? data.rows : [];
    updated = text(data.updated);
    miss.hidden = true;
    render();
  }).catch(function () {
    miss.hidden = false;
  });
})();
