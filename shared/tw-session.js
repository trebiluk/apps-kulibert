/* One sign-in widget for every Tech Room app.
   The kid enters the TechWorks code and PIN. The alias comes back from TechWorks. */
(function (root) {
  var SESSION = "kw-session-v1";
  var WHO = "https://tw.kulibert.net/api/who";
  var LOCK = "kw-who-lock";
  var styleId = "tw-session-style";
  var picked = "";

  function whoApi() { return root.KulibertWho || null; }
  function framed() { return root.parent !== root; }
  function on() {
    var api = whoApi();
    if (api && api.active) return !!api.active();
    try { return sessionStorage.getItem(SESSION) === "1"; } catch (e) { return false; }
  }
  function lockState() {
    try {
      var raw = JSON.parse(localStorage.getItem(LOCK) || "null");
      if (!raw || typeof raw !== "object") return { n: 0, until: 0 };
      return { n: Number(raw.n) || 0, until: Number(raw.until) || 0 };
    } catch (e) { return { n: 0, until: 0 }; }
  }
  function saveLock(state) {
    try { localStorage.setItem(LOCK, JSON.stringify({ n: state.n || 0, until: state.until || 0 })); } catch (e) {}
  }
  function clearLock() {
    try { localStorage.removeItem(LOCK); } catch (e) {}
  }
  function lockedNow() {
    var state = lockState();
    return !!(state.until && Date.now() < state.until);
  }
  function bumpFail() {
    var state = lockState();
    if (state.until && Date.now() >= state.until) state = { n: 0, until: 0 };
    state.n += 1;
    if (state.n >= 5) {
      state.n = 0;
      state.until = Date.now() + 30000;
    }
    saveLock(state);
    return state;
  }
  function armLock(pop) {
    var note = pop.querySelector(".tw-note");
    var btn = pop.querySelector(".tw-keep");
    if (!lockedNow()) {
      if (btn) btn.disabled = false;
      return false;
    }
    if (note) note.textContent = "Wait a moment, then try again.";
    if (btn) btn.disabled = true;
    var wait = Math.max(0, lockState().until - Date.now());
    root.setTimeout(function () {
      if (lockedNow()) return;
      if (btn) btn.disabled = false;
      if (note && note.textContent === "Wait a moment, then try again.") {
        note.textContent = "The code and the PIN come from your teacher.";
      }
    }, wait + 40);
    return true;
  }
  function signOut() {
    try { sessionStorage.removeItem(SESSION); } catch (e) {}
    try { localStorage.removeItem("kw-shop-v1"); } catch (e2) {}
    var api = whoApi();
    if (api && api.forget) api.forget();
    var bye = { type: "kw-who", on: false };
    try { if (root.parent && root.parent !== root) root.parent.postMessage(bye, "*"); } catch (e3) {}
    try {
      var frame = document.getElementById("app-frame");
      if (frame && frame.contentWindow) {
        var origin = "*";
        try { origin = new URL(frame.src, location.href).origin; } catch (e4) {}
        frame.contentWindow.postMessage(bye, origin);
      }
    } catch (e5) {}
  }
  function appFromPath() {
    var bit = location.pathname.replace(/\/$/, "").split("/").filter(Boolean)[0] || "";
    return bit === "music" ? "musiclab" : bit;
  }
  function light(appId) {
    var api = whoApi();
    var who = api && api.read();
    if (!who || !on()) return "out";
    var waiting = api.pending && api.pending().some(function (row) {
      return row && row.code === who.code && (!appId || row.app === appId);
    });
    if (waiting) return "sending";
    var lines = api.lines ? api.lines() : {};
    if (appId && lines[appId]) return "saved";
    if (!appId && Object.keys(lines).length) return "saved";
    return "waiting";
  }
  function words(state) {
    if (state === "saved") return "Saved";
    if (state === "sending") return "Sending";
    if (state === "waiting") return "Not saved yet";
    return "Not signed in";
  }
  function faceOf(alias) {
    try {
      var saved = sessionStorage.getItem("kw-session-face") || "";
      if (saved) return saved;
    } catch (e) {}
    var letter = String(alias || "").trim().charAt(0).toUpperCase();
    return letter || "?";
  }
  function rememberFace(avatar) {
    try {
      if (avatar) sessionStorage.setItem("kw-session-face", avatar);
      else sessionStorage.removeItem("kw-session-face");
    } catch (e) {}
  }
  function placeMenu(menu, anchor) {
    var r = anchor.getBoundingClientRect();
    menu.style.position = "fixed";
    menu.style.zIndex = "80";
    menu.style.left = Math.max(8, Math.min(r.left, root.innerWidth - 150)) + "px";
    if (r.top > root.innerHeight * 0.55) {
      menu.style.top = "auto";
      menu.style.bottom = (root.innerHeight - r.top + 6) + "px";
    } else {
      menu.style.bottom = "auto";
      menu.style.top = (r.bottom + 6) + "px";
    }
    var bar = anchor.closest && anchor.closest(".shell-header");
    if (bar) {
      bar.style.overflow = "visible";
      bar.style.contain = "none";
    }
  }
  function css() {
    if (document.getElementById(styleId)) return;
    var node = document.createElement("style");
    node.id = styleId;
    node.textContent = [
      ".tw-session{display:flex;align-items:center;min-width:0;position:relative;flex:0 0 auto}",
      ".tw-pill{position:relative;display:inline-flex;align-items:center;gap:.35rem;height:44px;min-height:44px;max-width:14rem;padding:0 .7rem 0 .35rem;border-radius:999px;border:1px solid #24506d;background:#0b152c;color:#e8f7ff;font:650 .8rem/1 Outfit,system-ui,sans-serif;cursor:pointer;white-space:nowrap}",
      ".tw-pill[hidden],.tw-face[hidden],.tw-dot[hidden],.tw-menu[hidden]{display:none !important}",
      ".tw-pop button{height:44px;min-width:44px;border-radius:999px;border:1px solid #24506d;background:#0b152c;color:#e8f7ff;font:650 .8rem/1 Outfit,system-ui,sans-serif;padding:0 .8rem;cursor:pointer}",
      ".tw-face{width:20px;height:20px;border-radius:99px;display:inline-flex;align-items:center;justify-content:center;background:#123049;font-size:.8rem;line-height:1;flex:0 0 auto}",
      ".tw-alias-label{overflow:hidden;text-overflow:ellipsis;min-width:0}",
      ".tw-dot{width:8px;height:8px;border-radius:99px;background:#c45b4a;flex:0 0 auto}",
      ".tw-session[data-state=saved] .tw-dot,.tw-app-status[data-state=saved] .tw-dot{background:#3ecf8e}",
      ".tw-session[data-state=sending] .tw-dot,.tw-session[data-state=waiting] .tw-dot,.tw-app-status[data-state=sending] .tw-dot,.tw-app-status[data-state=waiting] .tw-dot{background:#e3b341}",
      ".tw-session[data-state=out] .tw-dot,.tw-app-status[data-state=out] .tw-dot{background:#c45b4a}",
      ".tw-menu{min-width:8.75rem;padding:.3rem;border-radius:12px;background:#071018;color:#e8f7ff;border:1px solid #24506d;box-shadow:0 10px 30px rgba(0,0,0,.35);display:flex;flex-direction:column;gap:.15rem}",
      ".tw-menu[hidden]{display:none !important}",
      ".tw-menu button{height:36px;border:0;border-radius:8px;background:transparent;color:inherit;text-align:left;padding:0 .65rem;font:650 .8rem/1 system-ui,sans-serif;cursor:pointer}",
      ".tw-menu button:hover,.tw-menu button:focus-visible{background:#123049}",
      "@media (max-width:700px){.tw-who,.tw-app-status.is-in{max-width:11rem}}",
      "html[data-hub-theme=graph] .tw-pill,html[data-hub-theme=spa] .tw-pill,html[data-hub-theme=nature] .tw-pill,html[data-hub-theme=peaks] .tw-pill,html[data-hub-theme=graph] .tw-menu,html[data-hub-theme=spa] .tw-menu,html[data-hub-theme=nature] .tw-menu,html[data-hub-theme=peaks] .tw-menu{background:#fffdf8;color:#1c1915;border-color:#2c2824}",
      "html[data-hub-theme=graph] .tw-face,html[data-hub-theme=spa] .tw-face,html[data-hub-theme=nature] .tw-face,html[data-hub-theme=peaks] .tw-face{background:#efeae0}",
      "html[data-hub-theme=graph] .tw-menu button:hover,html[data-hub-theme=spa] .tw-menu button:hover,html[data-hub-theme=nature] .tw-menu button:hover,html[data-hub-theme=peaks] .tw-menu button:hover{background:#efeae0}",
      ".tw-pop{position:absolute;top:calc(100% + 6px);left:0;z-index:50;width:16.5rem;padding:.7rem;border-radius:12px;background:#071018;color:#e8f7ff;border:1px solid #24506d;box-shadow:0 10px 30px rgba(0,0,0,.35)}",
      ".tw-pop[hidden]{display:none !important}",
      ".tw-pop label{display:block;font-size:.75rem;font-weight:700;margin:.35rem 0}",
      ".tw-pop input{width:100%;height:36px;border-radius:8px;border:1px solid #24506d;background:#0b152c;color:#e8f7ff;padding:0 .5rem;font:inherit}",
      ".tw-pop .tw-row{display:flex;gap:.35rem;margin-top:.45rem}",
      ".tw-note{margin:.4rem 0 0;font-size:.72rem;color:#9fd0e2}",
      ".tw-hits{display:flex;flex-direction:column;gap:.25rem;margin-top:.35rem}",
      ".tw-hits button{display:flex;align-items:center;justify-content:flex-start;gap:.4rem;width:100%;height:36px}",
      ".tw-pick{margin:.35rem 0 0;font-size:1rem;font-weight:750}",
      ".tw-pick[hidden]{display:none !important}",
      ".tw-app-status{position:static}",
      ".tw-app-status[hidden]{display:none !important}",
      ".tw-app-bar{position:fixed;right:.5rem;top:.45rem;left:auto;bottom:auto;z-index:40;display:flex;align-items:center;gap:.3rem;max-width:calc(100vw - 1rem)}",
      ".tw-app-bar .tw-pill,.tw-app-bar .tw-back{height:26px;font-size:.7rem;background:rgba(7,16,24,.62);border-color:rgba(180,210,230,.35);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)}",
      ".tw-app-bar .tw-back{padding:0 .5rem;border-radius:999px;border:1px solid rgba(180,210,230,.35);color:#e8f7ff;font:650 .7rem/1 system-ui,sans-serif;cursor:pointer}",
      ".tw-app-bar .tw-pop{position:absolute;right:0;left:auto;top:calc(100% + 6px);bottom:auto}",
      "html.tw-session-hide .tw-app-status,html.tw-session-hide .tw-pop,html.tw-session-hide .tw-app-bar,html.tw-session-hide .tw-back,html.tw-session-hide .tw-menu{display:none !important}"
    ].join("");
    document.head.appendChild(node);
  }
  function formHtml() {
    return [
      '<form>',
      '<label>Code <input class="tw-code" maxlength="5" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="5 characters"/></label>',
      '<label>PIN <input class="tw-pin" type="password" inputmode="numeric" maxlength="4" autocomplete="off" placeholder="From your teacher"/></label>',
      '<div class="tw-row"><button type="submit" class="tw-keep">Sign in</button><button type="button" class="tw-close">Close</button></div>',
      '<p class="tw-note">The code and the PIN come from your teacher. Your name shows after they match.</p>',
      '</form>'
    ].join("");
  }
  function bindForm(pop, done) {
    var note = pop.querySelector(".tw-note");
    pop.querySelector("form").addEventListener("submit", function (event) {
      event.preventDefault();
      if (armLock(pop)) return;
      var code = String(pop.querySelector(".tw-code").value || "").toUpperCase().replace(/[^A-Z2-9]/g, "").slice(0, 5);
      var pinEl = pop.querySelector(".tw-pin");
      var pin = String(pinEl && pinEl.value || "").replace(/\D/g, "").slice(0, 4);
      if (pinEl) pinEl.value = "";
      if (code.length !== 5 || pin.length !== 4) {
        note.textContent = "Enter the 5-character code and the 4-digit PIN.";
        return;
      }
      fetch(WHO, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ code: code, pin: pin })
      }).then(function (res) { return res.json(); }).then(function (pack) {
        if (!pack || !pack.ok || !pack.alias) {
          bumpFail();
          note.textContent = lockedNow() ? "Wait a moment, then try again." : (pack && pack.error) || "That code or PIN does not match.";
          armLock(pop);
          return;
        }
        clearLock();
        var api = whoApi();
        var twCode = pack.code || code;
        if (api && api.write) api.write(pack.alias, twCode);
        try { sessionStorage.setItem(SESSION, "1"); } catch (e) {}
        try { localStorage.setItem("kw-shop-v1", twCode); } catch (e2) {}
        if (pack.avatar) rememberFace(pack.avatar);
        if (pinEl) pinEl.value = "";
        pop.hidden = true;
        if (api && api.flush) api.flush();
        done();
      }).catch(function () {
        note.textContent = "TechWorks did not answer. Try again on the school network.";
      });
    });
    var closeBtn = pop.querySelector(".tw-close");
    if (closeBtn) closeBtn.addEventListener("click", function () { pop.hidden = true; });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && pop && !pop.hidden) pop.hidden = true;
    });
    document.addEventListener("mousedown", function (event) {
      if (!pop || pop.hidden) return;
      if (pop.contains(event.target)) return;
      pop.hidden = true;
    });
    armLock(pop);
  }
  function paintShell(host) {
    var api = whoApi();
    var who = api && api.read();
    var signed = on() && !!who;
    var state = light(host.getAttribute("data-app") || "");
    host.dataset.state = signed ? state : "out";
    var whoBtn = host.querySelector(".tw-who");
    var out = host.querySelector(".tw-out");
    var menu = host.querySelector(".tw-menu");
    var face = host.querySelector(".tw-face");
    var name = host.querySelector(".tw-alias-label");
    if (whoBtn) whoBtn.hidden = !signed;
    if (out) out.hidden = signed;
    if (!signed && menu) menu.hidden = true;
    if (face) face.textContent = signed ? faceOf(who.alias) : "";
    if (name) name.textContent = signed ? who.alias : "";
    var tip = signed ? who.alias + ", " + words(state) : "Sign in";
    if (whoBtn) {
      whoBtn.title = tip;
      whoBtn.setAttribute("aria-label", tip);
      if (menu && menu.hidden) whoBtn.setAttribute("aria-expanded", "false");
    }
    if (out) out.setAttribute("aria-label", "Sign in");
  }
  function mountShell(host) {
    css();
    host.className = "tw-session";
    host.innerHTML = [
      '<button type="button" class="tw-pill tw-who" hidden aria-haspopup="menu" aria-expanded="false">',
      '<span class="tw-face" aria-hidden="true"></span><span class="tw-alias-label"></span><i class="tw-dot" aria-hidden="true"></i>',
      '</button>',
      '<button type="button" class="tw-pill tw-out">Sign in</button>',
      '<div class="tw-menu" hidden role="menu">',
      '<button type="button" class="tw-off" role="menuitem">Log out</button>',
      '<button type="button" class="tw-reconnect" role="menuitem">Reconnect</button>',
      '</div>',
      '<div class="tw-pop" hidden>', formHtml(), '</div>'
    ].join("");
    var pop = host.querySelector(".tw-pop");
    var menu = host.querySelector(".tw-menu");
    var whoBtn = host.querySelector(".tw-who");
    function paint() { paintShell(host); tell(); }
    function closeMenu() {
      menu.hidden = true;
      whoBtn.setAttribute("aria-expanded", "false");
    }
    bindForm(pop, paint);
    whoBtn.addEventListener("click", function (event) {
      event.stopPropagation();
      pop.hidden = true;
      menu.hidden = !menu.hidden;
      whoBtn.setAttribute("aria-expanded", menu.hidden ? "false" : "true");
      if (!menu.hidden) placeMenu(menu, whoBtn);
    });
    host.querySelector(".tw-out").addEventListener("click", function () {
      closeMenu();
      pop.hidden = false;
      var bar = host.closest(".shell-header");
      if (bar) { bar.style.overflow = "visible"; bar.style.contain = "none"; }
      if (!armLock(pop)) {
        var code = host.querySelector(".tw-code");
        if (code) code.focus();
      }
    });
    host.querySelector(".tw-off").addEventListener("click", function () {
      rememberFace("");
      signOut();
      var pinEl = pop.querySelector(".tw-pin");
      if (pinEl) pinEl.value = "";
      pop.hidden = true;
      closeMenu();
      paint();
    });
    host.querySelector(".tw-reconnect").addEventListener("click", function () {
      var api = whoApi();
      closeMenu();
      if (!api || !api.flush) return;
      api.flush().then(paint);
    });
    document.addEventListener("click", function (event) {
      if (menu.hidden) return;
      if (host.contains(event.target)) return;
      closeMenu();
    });
    root.addEventListener("kw-mark", function () { paintShell(host); });
    root.addEventListener("storage", function () { paintShell(host); });
    root.addEventListener("message", function (ev) {
      if (!ev.data || ev.data.type !== "tw-session") return;
      paintShell(host);
    });
    paintShell(host);
    host.__paint = function (appId) {
      if (appId) host.setAttribute("data-app", appId);
      paintShell(host);
    };
  }
  function tell() {
    var api = whoApi();
    var who = api && api.read();
    var msg = { type: "tw-session", on: on(), alias: who ? who.alias : "", state: light(appFromPath()) };
    try { if (framed()) root.parent.postMessage(msg, location.origin); } catch (e) {}
  }
  function solo() {
    try { return new URLSearchParams(location.search).get("solo") === "1"; } catch (e) { return false; }
  }
  function hubPage() {
    var path = (location.pathname || "/").replace(/\/+$/, "") || "/";
    if (path === "/index.html") path = "/";
    return path === "/" || path === "/staff" || path === "/staff/index.html";
  }
  function aliasesOff() {
    try { return localStorage.getItem("kw-hub-aliases") === "0"; } catch (e) { return false; }
  }
  function returnToHub() {
    if (framed() || solo() || hubPage()) return;
    location.replace("/?open=" + encodeURIComponent(location.pathname + location.search));
  }
  function mountApp() {
    css();
    if (document.querySelector(".tw-app-bar")) return;
    var bar = document.createElement("div");
    bar.className = "tw-app-bar";
    bar.innerHTML = [
      '<button type="button" class="tw-pill tw-app-status" data-state="out" aria-haspopup="menu" aria-expanded="false">',
      '<span class="tw-face" aria-hidden="true"></span><span class="tw-alias-label">Sign in</span><i class="tw-dot" hidden aria-hidden="true"></i>',
      '</button>',
      '<button type="button" class="tw-back">Back to the Hub</button>',
      '<div class="tw-menu" hidden role="menu">',
      '<button type="button" class="tw-off" role="menuitem">Log out</button>',
      '<button type="button" class="tw-reconnect" role="menuitem">Reconnect</button>',
      '</div>',
      '<div class="tw-pop" hidden>', formHtml(), '</div>'
    ].join("");
    document.body.appendChild(bar);
    var pill = bar.querySelector(".tw-app-status");
    var pop = bar.querySelector(".tw-pop");
    var menu = bar.querySelector(".tw-menu");
    function paint() {
      var api = whoApi();
      var who = api && api.read();
      var signed = on() && !!who;
      var state = signed ? light(appFromPath()) : "out";
      pill.dataset.state = state;
      pill.classList.toggle("is-in", signed);
      var face = pill.querySelector(".tw-face");
      var label = pill.querySelector(".tw-alias-label");
      var dot = pill.querySelector(".tw-dot");
      if (face) { face.hidden = !signed; face.textContent = signed ? faceOf(who.alias) : ""; }
      if (dot) dot.hidden = !signed;
      if (label) label.textContent = signed ? who.alias : "Sign in";
      var tip = signed ? who.alias + ", " + words(state) : "Sign in";
      pill.title = tip;
      pill.setAttribute("aria-label", tip);
      var covered = document.documentElement.classList.contains("tw-session-hide") || !!document.fullscreenElement;
      pill.hidden = covered || aliasesOff();
      if (pill.hidden) { pop.hidden = true; menu.hidden = true; }
      bar.hidden = covered;
    }
    bindForm(pop, function () { paint(); tell(); returnToHub(); });
    pill.addEventListener("click", function () {
      if (aliasesOff()) return;
      if (on()) {
        pop.hidden = true;
        menu.hidden = !menu.hidden;
        pill.setAttribute("aria-expanded", menu.hidden ? "false" : "true");
        if (!menu.hidden) placeMenu(menu, pill);
        return;
      }
      menu.hidden = true;
      pop.hidden = false;
      if (!armLock(pop)) {
        var codeBox = pop.querySelector(".tw-code");
        if (codeBox) codeBox.focus();
      }
    });
    bar.querySelector(".tw-off").addEventListener("click", function () {
      rememberFace("");
      signOut();
      var pinEl = pop.querySelector(".tw-pin");
      if (pinEl) pinEl.value = "";
      pop.hidden = true;
      menu.hidden = true;
      paint();
      tell();
    });
    bar.querySelector(".tw-reconnect").addEventListener("click", function () {
      var api = whoApi();
      menu.hidden = true;
      if (!api || !api.flush) return;
      api.flush().then(function () { paint(); tell(); });
    });
    bar.querySelector(".tw-back").addEventListener("click", returnToHub);
    root.addEventListener("kw-mark", paint);
    root.addEventListener("storage", paint);
    document.addEventListener("fullscreenchange", paint);
    root.addEventListener("message", function (ev) {
      if (ev.origin !== location.origin || !ev.data || ev.data.type !== "tw-hide") return;
      document.documentElement.classList.toggle("tw-session-hide", !!ev.data.hide);
      paint();
    });
    paint();
    tell();
  }
  var booted = false;
  function boot() {
    if (booted) return;
    booted = true;
    var slot = document.getElementById("tw-session-slot");
    if (slot) { mountShell(slot); return; }
    if (framed() || hubPage()) return;
    if (document.documentElement.getAttribute("data-kb-bar") === "1") return;
    if (document.querySelector(".kb-bar")) return;
    mountApp();
  }
  root.TwSession = { boot: boot, light: light };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})(window);
