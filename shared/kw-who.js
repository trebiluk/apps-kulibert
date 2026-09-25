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
  root.KulibertWho = { read: read, write: write, saveApp: saveApp };
})(typeof window !== "undefined" ? window : globalThis);
