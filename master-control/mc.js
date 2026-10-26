(function () {
  var STATUSES = ["Live", "Building", "Blocked", "Waiting on Diego"];
  var rows = [];
  var editing = false;
  var gate = document.getElementById("gate");
  var tools = document.getElementById("tools");
  var board = document.getElementById("board");
  var miss = document.getElementById("miss");

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
    cards.forEach(function (card, i) {
      var row = rows[i];
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

  function render() {
    board.replaceChildren();
    rows.forEach(function (row) {
      var card = document.createElement("article");
      card.className = "card";
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
          + "</dl>";
      }
      board.appendChild(card);
    });
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
    tools.append(edit, save);
  }

  paintTools();
  window.addEventListener("storage", paintTools);
  window.addEventListener("pageshow", paintTools);

  fetch("board.json", { cache: "no-store" }).then(function (res) {
    if (!res.ok) throw new Error("board");
    return res.json();
  }).then(function (data) {
    rows = Array.isArray(data.rows) ? data.rows : [];
    miss.hidden = true;
    render();
  }).catch(function () {
    miss.hidden = false;
  });
})();
