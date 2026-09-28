/* Kulibert shop alias. Same Chromebook. No real names. Other apps can load /berty-run/kw-who.js */
(function (root) {
  var WHO = "kw-who-v1";
  var BAG = "kw-bag-v1";
  function clean(raw) {
    return String(raw || "").replace(/[^\p{L}\p{N} \-']/gu, "").replace(/\s+/g, " ").trim().slice(0, 16);
  }
  function codeOf(alias) {
    var s = alias.toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 8);
    if (!s) return "";
    var h = 2166136261;
    for (var i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    var chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    var n = (h >>> 0) % (chars.length * chars.length);
    return s.toUpperCase() + "-" + chars[Math.floor(n / chars.length)] + chars[n % chars.length];
  }
  function read() {
    try {
      var raw = JSON.parse(localStorage.getItem(WHO) || "null");
      var alias = clean(raw && raw.alias);
      var code = codeOf(alias);
      return alias && code ? { alias: alias, code: code } : null;
    } catch (e) {
      return null;
    }
  }
  function write(aliasRaw) {
    var alias = clean(aliasRaw);
    var code = codeOf(alias);
    if (!alias || !code) return null;
    try {
      localStorage.setItem(WHO, JSON.stringify({ v: 1, alias: alias, code: code }));
    } catch (e) {}
    return { alias: alias, code: code };
  }
  function saveApp(appId, data) {
    var who = read();
    if (!who || !appId) return null;
    var bag = { v: 1, kids: {} };
    try {
      var parsed = JSON.parse(localStorage.getItem(BAG) || "null");
      if (parsed && parsed.v === 1 && parsed.kids) bag = parsed;
    } catch (e) {}
    var kid = bag.kids[who.code] || { alias: who.alias, apps: {} };
    kid.alias = who.alias;
    var prev = kid.apps[appId] || {};
    kid.apps[appId] = Object.assign({}, prev, data || {}, { saved: new Date().toISOString() });
    bag.kids[who.code] = kid;
    try {
      localStorage.setItem(BAG, JSON.stringify(bag));
    } catch (e) {}
    return who;
  }
  function clipLine(raw) {
    return String(raw || "").replace(/\s+/g, " ").trim().slice(0, 32);
  }
  function loadBag() {
    var bag = { v: 1, kids: {} };
    try {
      var parsed = JSON.parse(localStorage.getItem(BAG) || "null");
      if (parsed && parsed.v === 1 && parsed.kids) bag = parsed;
    } catch (e) {}
    return bag;
  }
  function saveBag(bag) {
    try { localStorage.setItem(BAG, JSON.stringify(bag)); } catch (e) {}
  }
  function lineText(id, row) {
      if (!row) return "";
      if (row.line) return String(row.line);
      if (id === "berty-run" && row.stamps != null) return String(row.stamps) + " stamps";
      return "";
    }
    function lines() {
      var who = read();
      if (!who) return {};
      var kid = loadBag().kids[who.code];
      var apps = kid && kid.apps ? kid.apps : {};
      var out = {};
      Object.keys(apps).forEach(function (id) {
        var text = lineText(id, apps[id]);
        if (text) out[id] = text;
      });
      return out;
    }
  function pending() {
    try {
      var rows = JSON.parse(localStorage.getItem("kw-outbox-v1") || "[]");
      return Array.isArray(rows) ? rows : [];
    } catch (e) {
      return [];
    }
  }
  function writePending(rows) {
    try { localStorage.setItem("kw-outbox-v1", JSON.stringify(rows.slice(-40))); } catch (e) {}
  }
  function mark(appId, line) {
    var text = clipLine(line);
    var id = String(appId || "").slice(0, 24);
    if (!text || !id) return null;
    var who = saveApp(id, { line: text });
    if (!who) return null;
    var rows = pending().filter(function (row) {
      return !(row && row.code === who.code && row.app === id);
    });
    rows.push({ alias: who.alias, code: who.code, app: id, line: text, saved: new Date().toISOString() });
    writePending(rows);
    try { root.dispatchEvent(new Event("kw-mark")); } catch (e) {}
    return who;
  }
  function flush() {
    var rows = pending();
    if (!rows.length) return Promise.resolve(true);
    return fetch("https://tw.kulibert.net/api/marks", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ marks: rows })
    }).then(function (res) {
      if (res && res.ok) ack(rows);
      return !!(res && res.ok);
    }).catch(function () { return false; });
  }
  function ack(sent) {
    var done = {};
    (sent || []).forEach(function (row) {
      if (row && row.code && row.app) done[row.code + "\n" + row.app] = row.line;
    });
    writePending(pending().filter(function (row) {
      var key = row && row.code + "\n" + row.app;
      return !done[key] || done[key] !== row.line;
    }));
  }
  root.KulibertWho = { read: read, write: write, saveApp: saveApp, clean: clean, codeOf: codeOf, lines: lines, mark: mark, pending: pending, ack: ack, flush: flush };
})(typeof window !== "undefined" ? window : globalThis);
