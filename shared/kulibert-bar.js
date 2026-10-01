/* One Tech Room bar. Inside the Hub it stays quiet and talks to the strip.
   Standalone, it draws Home, the app plate, the alias, and Help.
   A deferred script has no currentScript, and a cross-origin app
   (baboo.kulibert.net) cannot load /shared from its own origin. */
(function (root) {
  function barScript() {
    var current = document.currentScript;
    if (current && current.src && current.src.indexOf("kulibert-bar.js") !== -1) return current;
    var nodes = document.querySelectorAll("script[src*='kulibert-bar.js']");
    return nodes.length ? nodes[nodes.length - 1] : current;
  }
  var script = barScript();
  var app = (script && script.getAttribute("data-app")) || "";
  var version = (script && script.getAttribute("data-version")) || "";
  var helpSel = (script && script.getAttribute("data-help")) || "";
  var helpFn = null;
  var toastTimer = 0;
  var assetOrigin = "https://apps.kulibert.net";
  try {
    if (script && script.src) assetOrigin = new URL(script.src, location.href).origin;
  } catch (eOrigin) {}
  function asset(path) { return assetOrigin + path; }

  function classic() {
    try { return localStorage.getItem("tech-room-hub") === "classic"; } catch (e) { return false; }
  }
  function framed() {
    try { return root.parent !== root; } catch (e) { return false; }
  }
  function schoolOrigin(origin) {
    try {
      var host = new URL(origin).hostname;
      return host === "kulibert.net" || host.slice(-13) === ".kulibert.net" || origin === location.origin;
    } catch (e) { return false; }
  }
  function ensureCss() {
    if (document.querySelector("link[data-kb-css]")) return;
    var link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = asset("/shared/kulibert-bar.css?v=2026-10-01-job");
    link.setAttribute("data-kb-css", "1");
    (document.head || document.documentElement).appendChild(link);
  }
  function ensureWho(done) {
    if (root.KulibertWho) { done(); return; }
    var s = document.createElement("script");
    s.src = asset("/shared/kw-who.js?v=2026-10-01-job");
    s.onload = function () { done(); };
    s.onerror = function () { done(); };
    (document.head || document.documentElement).appendChild(s);
  }
  function postUp(msg) {
    if (!framed()) return;
    try { root.parent.postMessage(msg, "*"); } catch (e) {}
  }
  function paintAlias(node) {
    if (!node) return;
    var who = root.KulibertWho && root.KulibertWho.read && root.KulibertWho.read();
    var on = root.KulibertWho && root.KulibertWho.active && root.KulibertWho.active();
    node.textContent = on && who ? who.alias : "Sign in";
  }
  function toast(text) {
    ensureCss();
    var el = document.getElementById("kb-toast");
    if (!el) {
      el = document.createElement("p");
      el.id = "kb-toast";
      el.className = "kb-toast";
      el.setAttribute("role", "status");
      document.body.appendChild(el);
    }
    el.hidden = false;
    el.textContent = String(text || "").slice(0, 80);
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.hidden = true; }, 2800);
  }
  function openHelp() {
    if (typeof helpFn === "function") { helpFn(); return; }
    if (helpSel) {
      var el = document.querySelector(helpSel);
      if (el && el.click) el.click();
    }
  }
  root.addEventListener("message", function (ev) {
    var data = ev.data;
    if (!data || !data.type) return;
    if (!schoolOrigin(ev.origin)) return;
    if (data.type === "kb-help") { openHelp(); return; }
    if (data.type !== "kw-who") return;
    ensureWho(function () {
      var api = root.KulibertWho;
      if (!api) return;
      if (data.on === false) {
        if (api.forget) api.forget();
        try { sessionStorage.removeItem("kw-session-v1"); } catch (e) {}
      } else if (data.alias && data.code && api.write) {
        api.write(data.alias, data.code);
        try { sessionStorage.setItem("kw-session-v1", "1"); } catch (e2) {}
      }
      paintAlias(document.querySelector(".kb-alias"));
    });
  });

  root.KulibertBar = {
    setHelp: function (fn) { helpFn = fn; },
    toast: toast
  };

  if (classic()) {
    if (!document.getElementById("tw-session-boot")) {
      var shim = document.createElement("script");
      shim.id = "tw-session-boot";
      shim.src = asset("/shared/tw-session.js?v=2026-10-01-job");
      (document.head || document.documentElement).appendChild(shim);
    }
    return;
  }

  document.documentElement.setAttribute("data-kb-bar", "1");
  if (framed()) {
    document.documentElement.classList.add("kb-framed");
    ensureCss();
    postUp({ type: "kb-app", app: app, version: version, help: !!helpSel || true });
    return;
  }

  function draw() {
    if (document.querySelector(".kb-bar")) return;
    ensureCss();
    var bar = document.createElement("div");
    bar.className = "kb-bar";
    bar.innerHTML = [
      '<a class="kb-home" href="https://apps.kulibert.net/" target="_top">\u2302 Home</a>',
      '<span class="kb-plate"></span>',
      '<button type="button" class="kb-settings" hidden aria-label="My settings">\u2699</button>',
      '<span class="kb-alias">Sign in</span>',
      '<button type="button" class="kb-help" aria-label="Help">?</button>'
    ].join("");
    document.body.insertBefore(bar, document.body.firstChild);
    document.body.classList.add("kb-on");
    var plate = bar.querySelector(".kb-plate");
    plate.textContent = [app, version].filter(Boolean).join(" \u00b7 ");
    bar.querySelector(".kb-help").addEventListener("click", openHelp);
    ensureWho(function () { paintAlias(bar.querySelector(".kb-alias")); });
    root.addEventListener("storage", function () { paintAlias(bar.querySelector(".kb-alias")); });
  }
  if (document.body) draw();
  else document.addEventListener("DOMContentLoaded", draw);
})(typeof window !== "undefined" ? window : globalThis);
