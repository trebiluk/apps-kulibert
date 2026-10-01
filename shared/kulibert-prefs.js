/* One settings bag for every Tech Room app. No names. No libraries.
   Other origins read #kp= once. /api/prefs is used only after a real sign-in. */
(function (root) {
  var KEY = "kulibert-prefs-v1";
  var SCALE = { S: ".9", M: "1", L: "1.25", XL: "1.5" };
  var BRIDGE = ["sc-access-v1", "sl-access-v1", "br-access-v1", "ti-access-v1", "bz-access-v1", "kz-access-v1"];
  var fans = [];
  var cssOn = false;

  function classic() {
    try {
      if (new URLSearchParams(location.search).get("hub") === "classic") return true;
      if (localStorage.getItem("tech-room-hub") === "classic") return true;
    } catch (e) {}
    return false;
  }
  function blank() {
    var less = false;
    try { less = root.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) {}
    return { v: 1, size: "M", contrast: false, motion: less ? "less" : "full", sound: true, captions: true, read: false, lang: "en" };
  }
  function tidy(raw) {
    var p = blank();
    if (!raw || typeof raw !== "object") return p;
    if (raw.size === "S" || raw.size === "L" || raw.size === "XL" || raw.size === "M") p.size = raw.size;
    p.contrast = !!raw.contrast;
    p.motion = raw.motion === "less" ? "less" : "full";
    p.sound = raw.sound !== false;
    p.captions = raw.captions !== false;
    p.read = !!raw.read;
    p.lang = raw.lang === "ar" ? "ar" : "en";
    p.v = 1;
    return p;
  }
  function fromCode(text) {
    var b = String(text || "").split(".");
    if (b.length < 7) return null;
    return tidy({ size: b[0], contrast: b[1] === "1", motion: b[2] === "1" ? "less" : "full", sound: b[3] !== "0", captions: b[4] !== "0", read: b[5] === "1", lang: b[6] });
  }
  function codeOf(p) {
    return [p.size, p.contrast ? 1 : 0, p.motion === "less" ? 1 : 0, p.sound ? 1 : 0, p.captions ? 1 : 0, p.read ? 1 : 0, p.lang].join(".");
  }
  function stored() {
    try { return tidy(JSON.parse(localStorage.getItem(KEY) || "null")); } catch (e) { return blank(); }
  }
  function get() {
    if (classic()) return blank();
    var p = stored();
    try {
      var m = (location.hash || "").match(/(?:^#|&)kp=([^&]+)/);
      if (m) {
        var next = fromCode(decodeURIComponent(m[1]));
        if (next) { p = next; write(p); }
      }
    } catch (e2) {}
    return p;
  }
  function write(p) {
    try { localStorage.setItem(KEY, JSON.stringify(p)); } catch (e) {}
  }
  function bridge(p) {
    var shape = JSON.stringify({ lang: p.lang === "ar" ? "ar" : "en", speak: !!p.read, big: p.size === "L" || p.size === "XL", fewer: p.motion === "less", kp: 1 });
    BRIDGE.forEach(function (key) {
      try {
        var cur = localStorage.getItem(key);
        if (cur && cur !== "{}" && cur.indexOf('"kp":1') < 0 && cur.indexOf('"kp": 1') < 0) return;
        localStorage.setItem(key, shape);
      } catch (e) {}
    });
  }
  function css() {
    if (cssOn || !document.head) return;
    cssOn = true;
    var node = document.createElement("style");
    node.id = "kp-style";
    node.textContent = [
      "html[data-kp-size=S]{font-size:90%}",
      "html[data-kp-size=L] body{font-size:1.25rem !important}",
      "html[data-kp-size=XL] body{font-size:1.5rem !important}",
      "html[data-kp-motion=less],html[data-kp-motion=less] *{animation:none !important;transition:none !important;scroll-behavior:auto !important}",
      "html[data-kp-contrast='1'] body{background:#000 !important;color:#fff !important}",
      "html[data-kp-contrast='1'] button,html[data-kp-contrast='1'] a,html[data-kp-contrast='1'] input{background:#000 !important;color:#ffe14a !important;border-color:#ffe14a !important}",
      "#kp-live{position:fixed;left:8px;bottom:8px;z-index:80;max-width:min(28rem,92vw);padding:.35rem .7rem;border-radius:10px;background:#000;color:#ffe14a;font:650 14px/1.3 Outfit,system-ui,sans-serif}",
      "#kp-live[hidden]{display:none !important}",
      ":focus-visible{outline:3px solid #ffe14a;outline-offset:2px}"
    ].join("");
    document.head.appendChild(node);
  }
  function clearAttrs() {
    var el = document.documentElement;
    ["data-kp-size", "data-kp-contrast", "data-kp-motion", "data-kp-sound", "data-kp-lang", "data-kp-read", "data-kp-captions"].forEach(function (name) { el.removeAttribute(name); });
    el.style.removeProperty("--kp-scale");
  }
  function apply(p) {
    if (classic()) { clearAttrs(); return; }
    css();
    var el = document.documentElement;
    el.setAttribute("data-kp-size", p.size);
    el.setAttribute("data-kp-contrast", p.contrast ? "1" : "0");
    el.setAttribute("data-kp-motion", p.motion === "less" ? "less" : "full");
    el.setAttribute("data-kp-sound", p.sound ? "1" : "0");
    el.setAttribute("data-kp-lang", p.lang);
    el.setAttribute("data-kp-read", p.read ? "1" : "0");
    el.setAttribute("data-kp-captions", p.captions ? "1" : "0");
    el.style.setProperty("--kp-scale", SCALE[p.size] || "1");
    if (document.body) {
      document.body.style.fontSize = p.size === "XL" ? "1.5rem" : p.size === "L" ? "1.25rem" : p.size === "S" ? ".9rem" : "";
    }
    bridge(p);
    armMute();
  }
  function live() {
    var node = document.getElementById("kp-live");
    if (node) return node;
    node = document.createElement("p");
    node.id = "kp-live";
    node.setAttribute("role", "status");
    node.hidden = true;
    (document.body || document.documentElement).appendChild(node);
    return node;
  }
  function say(text) {
    var words = String(text || "").replace(/\s+/g, " ").trim().slice(0, 180);
    if (!words || classic()) return;
    var p = get();
    var line = live();
    line.hidden = false;
    line.textContent = words;
    if (!p.read || p.sound === false || !root.speechSynthesis) return;
    try {
      root.speechSynthesis.cancel();
      var u = new SpeechSynthesisUtterance(words);
      u.lang = p.lang === "ar" ? "ar" : "en";
      root.speechSynthesis.speak(u);
    } catch (e) {}
  }
  function cue(kind) {
    if (classic()) return;
    var words = kind === "pass" ? "Pass" : kind === "fail" ? "Try again" : String(kind || "Done");
    var line = live();
    line.hidden = false;
    line.textContent = words;
  }
  function armMute() {
    if (root.__kpMute) return;
    root.__kpMute = 1;
    var play = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function () {
      if (get().sound === false) { try { this.pause(); } catch (e) {} return Promise.resolve(); }
      return play.apply(this, arguments);
    };
    ["AudioContext", "webkitAudioContext"].forEach(function (name) {
      var Native = root[name];
      if (!Native) return;
      var Wrapped = function () {
        var ctx = new (Function.prototype.bind.apply(Native, [null].concat([].slice.call(arguments))))();
        try {
          var gain = ctx.createGain();
          gain.connect(ctx.destination);
          Object.defineProperty(ctx, "destination", { configurable: true, get: function () {
            gain.gain.value = get().sound === false ? 0 : 1;
            return gain;
          } });
        } catch (e) {}
        return ctx;
      };
      Wrapped.prototype = Native.prototype;
      root[name] = Wrapped;
    });
  }
  function pushRemote(p) {
    var who = root.KulibertWho && root.KulibertWho.read && root.KulibertWho.read();
    if (!who || !who.verified || !root.KulibertWho.active || !root.KulibertWho.active()) return;
    fetch("https://tw.kulibert.net/api/prefs", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ code: who.code, prefs: p })
    }).catch(function () {});
  }
  function pullRemote() {
    var who = root.KulibertWho && root.KulibertWho.read && root.KulibertWho.read();
    if (!who || !who.verified || !root.KulibertWho.active || !root.KulibertWho.active()) return;
    fetch("https://tw.kulibert.net/api/prefs?code=" + encodeURIComponent(who.code)).then(function (res) {
      if (!res.ok) return null;
      return res.json();
    }).then(function (pack) {
      if (!pack || !pack.prefs) return;
      var p = tidy(pack.prefs);
      write(p);
      apply(p);
      fans.forEach(function (fn) { try { fn(p); } catch (e) {} });
    }).catch(function () {});
  }
  function set(partial) {
    if (classic()) return get();
    var p = tidy(Object.assign(stored(), partial || {}));
    write(p);
    apply(p);
    fans.forEach(function (fn) { try { fn(p); } catch (e) {} });
    pushRemote(p);
    return p;
  }
  function on(fn) { if (typeof fn === "function") fans.push(fn); }
  root.KulibertPrefs = { get: get, set: set, on: on, say: say, cue: cue, code: function () { return codeOf(get()); } };
  if (!classic()) {
    apply(get());
    pullRemote();
    if (root.MutationObserver) {
      new MutationObserver(function () {
        var p = stored();
        if (document.documentElement.getAttribute("data-kp-size") !== p.size) apply(p);
      }).observe(document.documentElement, { attributes: true });
    }
    document.addEventListener("DOMContentLoaded", function () { apply(stored()); });
  } else {
    clearAttrs();
    BRIDGE.forEach(function (key) {
      try {
        var cur = localStorage.getItem(key);
        if (cur && cur.indexOf('"kp":1') >= 0) localStorage.removeItem(key);
      } catch (e) {}
    });
  }
})(typeof window !== "undefined" ? window : globalThis);
