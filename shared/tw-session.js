/* One sign-in widget for every Tech Room app.
   Type an alias, pick the avatar, then the 5-character code and the teacher PIN. */
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
        note.textContent = "Pick your name from the picture. The code and the PIN come from your teacher.";
      }
    }, wait + 40);
    return true;
  }
  function signOut() {
    try { sessionStorage.removeItem(SESSION); } catch (e) {}
    try { localStorage.removeItem("kw-shop-v1"); } catch (e2) {}
    var api = whoApi();
    if (api && api.forget) api.forget();
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
  function css() {
    if (document.getElementById(styleId)) return;
    var node = document.createElement("style");
    node.id = styleId;
    node.textContent = [
      ".tw-session{display:flex;align-items:center;gap:.35rem;min-width:0;position:relative;flex:0 0 auto}",
      ".tw-session button,.tw-name{height:28px;border-radius:999px;border:1px solid #24506d;background:#0b152c;color:#e8f7ff;font:650 .75rem/1 system-ui,sans-serif;padding:0 .6rem;white-space:nowrap}",
      ".tw-session button{cursor:pointer}",
      ".tw-name{display:inline-flex;align-items:center;gap:.35rem;max-width:11rem;overflow:hidden}",
      ".tw-dot{width:8px;height:8px;border-radius:99px;background:#c45b4a;flex:0 0 auto}",
      ".tw-session[data-state=saved] .tw-dot,.tw-app-status[data-state=saved] .tw-dot{background:#3ecf8e}",
      ".tw-session[data-state=sending] .tw-dot,.tw-session[data-state=waiting] .tw-dot,.tw-app-status[data-state=sending] .tw-dot,.tw-app-status[data-state=waiting] .tw-dot{background:#e3b341}",
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
      ".tw-app-status{position:fixed;top:.45rem;left:.45rem;z-index:30;display:inline-flex;align-items:center;gap:.35rem;height:28px;padding:0 .6rem;border-radius:999px;background:#071018;color:#e8f7ff;border:1px solid #24506d;font:650 .75rem/1 system-ui,sans-serif;cursor:pointer}",
      ".tw-app-status[hidden]{display:none !important}",
      ".tw-app-bar{position:fixed;top:.45rem;left:.45rem;z-index:40;display:flex;align-items:center;gap:.35rem}",
      ".tw-app-bar .tw-app-status{position:static}",
      ".tw-app-bar .tw-pop{top:calc(100% + 6px);left:0}",
      ".tw-back{height:28px;padding:0 .6rem;border-radius:999px;border:1px solid #24506d;background:#0b152c;color:#e8f7ff;font:650 .75rem/1 system-ui,sans-serif;cursor:pointer}",
      "html.tw-session-hide .tw-app-status,html.tw-session-hide .tw-pop,html.tw-session-hide .tw-app-bar,html.tw-session-hide .tw-back{display:none !important}"
    ].join("");
    document.head.appendChild(node);
  }
  function formHtml() {
    return [
      '<form>',
      '<label>Alias <input class="tw-alias" maxlength="16" autocomplete="off" spellcheck="false" placeholder="Start typing"/></label>',
      '<div class="tw-hits"></div>',
      '<p class="tw-pick" hidden></p>',
      '<label>Code <input class="tw-code" maxlength="5" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="5 characters"/></label>',
      '<label>PIN <input class="tw-pin" maxlength="4" inputmode="numeric" autocomplete="off" placeholder="From your teacher"/></label>',
      '<div class="tw-row"><button type="submit" class="tw-keep">Sign in</button></div>',
      '<p class="tw-note">Pick your name from the picture. The code and the PIN come from your teacher.</p>',
      '</form>'
    ].join("");
  }
  function bindForm(pop, done) {
    var input = pop.querySelector(".tw-alias");
    var hits = pop.querySelector(".tw-hits");
    var pick = pop.querySelector(".tw-pick");
    var note = pop.querySelector(".tw-note");
    var wait = 0;
    function showHits(people) {
      hits.innerHTML = "";
      (people || []).forEach(function (person) {
        var btn = document.createElement("button");
        btn.type = "button";
        btn.textContent = (person.avatar || "🐾") + "  " + person.alias;
        btn.addEventListener("click", function () {
          picked = person.alias;
          input.value = person.alias;
          pick.hidden = false;
          pick.textContent = (person.avatar || "🐾") + "  " + person.alias;
          hits.innerHTML = "";
          var code = pop.querySelector(".tw-code");
          if (code) code.focus();
        });
        hits.appendChild(btn);
      });
    }
    input.addEventListener("input", function () {
      picked = "";
      pick.hidden = true;
      var q = input.value.trim();
      root.clearTimeout(wait);
      if (q.length < 2) { hits.innerHTML = ""; return; }
      wait = root.setTimeout(function () {
        fetch(WHO + "?q=" + encodeURIComponent(q)).then(function (res) { return res.json(); }).then(function (pack) {
          var people = pack && pack.people || [];
          showHits(people);
          if (note && !people.length) note.textContent = "No saved name like that yet. Your teacher publishes names from TechWorks.";
        }).catch(function () {
          if (note) note.textContent = "TechWorks did not answer. Try again on the school network.";
        });
      }, 180);
    });
    pop.querySelector("form").addEventListener("submit", function (event) {
      event.preventDefault();
      if (armLock(pop)) return;
      var alias = (picked || input.value || "").trim();
      var code = String(pop.querySelector(".tw-code").value || "").toUpperCase().replace(/[^A-Z2-9]/g, "").slice(0, 5);
      var pinEl = pop.querySelector(".tw-pin");
      var pin = String(pinEl && pinEl.value || "").replace(/\D/g, "").slice(0, 4);
      if (pinEl) pinEl.value = "";
      if (!alias || code.length !== 5 || pin.length !== 4) {
        note.textContent = "Pick your name, then the 5-character code and the 4-digit PIN.";
        return;
      }
      fetch(WHO, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ alias: alias, code: code, pin: pin })
      }).then(function (res) { return res.json(); }).then(function (pack) {
        if (!pack || !pack.ok) {
          bumpFail();
          note.textContent = lockedNow() ? "Wait a moment, then try again." : "That code or PIN does not match.";
          armLock(pop);
          return;
        }
        clearLock();
        var api = whoApi();
        var kept = pack.alias || alias;
        var twCode = pack.code || code;
        if (api && api.write) api.write(kept, twCode);
        try { sessionStorage.setItem(SESSION, "1"); } catch (e) {}
        try { localStorage.setItem("kw-shop-v1", twCode); } catch (e2) {}
        if (pinEl) pinEl.value = "";
        pop.hidden = true;
        if (api && api.flush) api.flush();
        done();
      }).catch(function () {
        note.textContent = "TechWorks did not answer. Try again on the school network.";
      });
    });
    armLock(pop);
  }
  function paintShell(host) {
    var api = whoApi();
    var who = api && api.read();
    var signed = on() && !!who;
    var state = light(host.getAttribute("data-app") || "");
    host.dataset.state = signed ? state : "out";
    var name = host.querySelector(".tw-alias-label");
    if (name) name.textContent = signed ? who.alias : "Not signed in";
    var save = host.querySelector(".tw-save");
    if (save) { save.hidden = !signed; save.textContent = words(state); }
    var out = host.querySelector(".tw-out");
    if (out) out.hidden = signed;
    var offBtn = host.querySelector(".tw-off");
    if (offBtn) offBtn.hidden = !signed;
    var reconnect = host.querySelector(".tw-reconnect");
    if (reconnect) reconnect.hidden = !(signed && (state === "sending" || state === "waiting"));
  }
  function mountShell(host) {
    css();
    host.className = "tw-session";
    host.innerHTML = [
      '<span class="tw-name"><i class="tw-dot"></i><span class="tw-alias-label">Not signed in</span></span>',
      '<span class="tw-save" hidden>Saved</span>',
      '<button type="button" class="tw-out">Sign in</button>',
      '<button type="button" class="tw-off" hidden>Log out</button>',
      '<button type="button" class="tw-reconnect" hidden>Reconnect</button>',
      '<div class="tw-pop" hidden>', formHtml(), '</div>'
    ].join("");
    var pop = host.querySelector(".tw-pop");
    function paint() { paintShell(host); tell(); }
    bindForm(pop, paint);
    host.querySelector(".tw-out").addEventListener("click", function () {
      pop.hidden = false;
      var bar = host.closest(".shell-header");
      if (bar) bar.style.overflow = "visible";
      if (!armLock(pop)) host.querySelector(".tw-alias").focus();
    });
    host.querySelector(".tw-off").addEventListener("click", function () {
      signOut();
      var pinEl = pop.querySelector(".tw-pin");
      if (pinEl) pinEl.value = "";
      pop.hidden = true;
      paint();
    });
    host.querySelector(".tw-reconnect").addEventListener("click", function () {
      var api = whoApi();
      if (!api || !api.flush) return;
      api.flush().then(paint);
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
      '<button type="button" class="tw-app-status" data-state="out"><i class="tw-dot"></i><span class="tw-alias-label">Not signed in</span></button>',
      '<button type="button" class="tw-back">Back to the Hub</button>',
      '<div class="tw-pop" hidden>', formHtml(), '</div>'
    ].join("");
    document.body.appendChild(bar);
    var pill = bar.querySelector(".tw-app-status");
    var pop = bar.querySelector(".tw-pop");
    function paint() {
      var api = whoApi();
      var who = api && api.read();
      var signed = on() && !!who;
      var state = signed ? light(appFromPath()) : "out";
      pill.dataset.state = state;
      var label = pill.querySelector(".tw-alias-label");
      if (label) label.textContent = signed ? who.alias : "Not signed in";
      var covered = document.documentElement.classList.contains("tw-session-hide") || !!document.fullscreenElement;
      pill.hidden = covered || aliasesOff();
      if (pill.hidden) pop.hidden = true;
      bar.hidden = covered;
    }
    bindForm(pop, function () { paint(); tell(); returnToHub(); });
    pill.addEventListener("click", function () {
      if (on() || aliasesOff()) return;
      pop.hidden = false;
      if (!armLock(pop)) {
        var alias = pop.querySelector(".tw-alias");
        if (alias) alias.focus();
      }
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
    mountApp();
  }
  root.TwSession = { boot: boot, light: light };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})(window);
