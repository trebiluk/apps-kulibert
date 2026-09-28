/* One sign-in widget for the Tech Room.
   The shell mounts the controls. A framed app only shows the save light.
   Fullscreen apps hide both. A teacher is the only one who can reset the PIN. */
(function (root) {
  var PIN_KEY = "kw-pin-v1";
  var SESSION = "kw-session-v1";
  var STAFF = "tech-room-hub-staff";
  var styleId = "tw-session-style";

  function whoApi() { return root.KulibertWho || null; }
  function teacher() {
    try { return localStorage.getItem(STAFF) === "1"; } catch (e) { return false; }
  }
  function framed() { return root.parent !== root; }
  function pinRec() {
    try {
      var raw = JSON.parse(localStorage.getItem(PIN_KEY) || "null");
      return raw && raw.hash ? raw : null;
    } catch (e) { return null; }
  }
  function on() {
    try { return sessionStorage.getItem(SESSION) === "1"; } catch (e) { return false; }
  }
  function sha(text) {
    var bytes = new TextEncoder().encode(String(text || ""));
    return crypto.subtle.digest("SHA-256", bytes).then(function (buf) {
      return Array.from(new Uint8Array(buf)).map(function (x) {
        return x.toString(16).padStart(2, "0");
      }).join("");
    });
  }
  function digits(raw) {
    var pin = String(raw || "").replace(/\D/g, "").slice(0, 4);
    return pin.length === 4 ? pin : "";
  }
  function appFromPath() {
    var path = location.pathname.replace(/\/$/, "");
    var bit = path.split("/").filter(Boolean)[0] || "";
    if (bit === "music") return "musiclab";
    return bit;
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
      ".tw-name{display:inline-flex;align-items:center;gap:.35rem;max-width:9rem;overflow:hidden;text-overflow:ellipsis}",
      ".tw-dot{width:8px;height:8px;border-radius:99px;background:#c45b4a;flex:0 0 auto}",
      ".tw-session[data-state=saved] .tw-dot{background:#3ecf8e}",
      ".tw-session[data-state=sending] .tw-dot,.tw-session[data-state=waiting] .tw-dot{background:#e3b341}",
      ".tw-pop{position:absolute;top:calc(100% + 6px);left:0;z-index:40;width:15rem;padding:.7rem;border-radius:12px;background:#071018;color:#e8f7ff;border:1px solid #24506d;box-shadow:0 10px 30px rgba(0,0,0,.35)}",
      ".tw-pop[hidden]{display:none !important}",
      ".tw-pop label{display:block;font-size:.75rem;font-weight:700;margin:.35rem 0}",
      ".tw-pop input{width:100%;height:36px;border-radius:8px;border:1px solid #24506d;background:#0b152c;color:#e8f7ff;padding:0 .5rem;font:inherit}",
      ".tw-pop .tw-row{display:flex;gap:.35rem;margin-top:.45rem}",
      ".tw-note{margin:.4rem 0 0;font-size:.72rem;color:#9fd0e2}",
      ".tw-app-status{position:fixed;top:.45rem;left:.45rem;z-index:30;display:inline-flex;align-items:center;gap:.35rem;height:28px;padding:0 .6rem;border-radius:999px;background:#071018;color:#e8f7ff;border:1px solid #24506d;font:650 .75rem/1 system-ui,sans-serif}",
      ".tw-app-status[hidden]{display:none !important}",
      ".tw-app-status .tw-dot{width:8px;height:8px;border-radius:99px;background:#c45b4a}",
      ".tw-app-status[data-state=saved] .tw-dot{background:#3ecf8e}",
      ".tw-app-status[data-state=sending] .tw-dot,.tw-app-status[data-state=waiting] .tw-dot{background:#e3b341}",
      "html.tw-session-hide .tw-app-status{display:none !important}"
    ].join("");
    document.head.appendChild(node);
  }
  function paintShell(host) {
    var api = whoApi();
    var who = api && api.read();
    var rec = pinRec();
    var signed = on() && !!who;
    var appId = host.getAttribute("data-app") || "";
    var state = light(appId);
    host.dataset.state = signed ? state : "out";
    var name = host.querySelector(".tw-alias-label");
    var save = host.querySelector(".tw-save");
    var out = host.querySelector(".tw-out");
    var offBtn = host.querySelector(".tw-off");
    var reconnect = host.querySelector(".tw-reconnect");
    var reset = host.querySelector(".tw-reset");
    if (name) name.textContent = signed ? who.alias : (who ? who.alias : "Not signed in");
    if (save) save.hidden = !signed;
    if (save) save.textContent = words(state);
    if (out) out.hidden = signed;
    if (offBtn) offBtn.hidden = !signed;
    if (reconnect) reconnect.hidden = !(signed && (state === "sending" || state === "waiting"));
    if (reset) reset.hidden = !teacher();
    var aliasIn = host.querySelector(".tw-alias");
    if (aliasIn && who && document.activeElement !== aliasIn) aliasIn.value = who.alias;
    if (aliasIn) aliasIn.readOnly = !!(rec && who);
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
      '<button type="button" class="tw-reset" hidden>Reset PIN</button>',
      '<div class="tw-pop" hidden>',
      '<form>',
      '<label>Alias <input class="tw-alias" maxlength="16" autocomplete="off" spellcheck="false" placeholder="Spark"/></label>',
      '<label>PIN <input class="tw-pin" inputmode="numeric" maxlength="4" autocomplete="off" placeholder="4 digits"/></label>',
      '<div class="tw-row"><button type="submit" class="tw-keep">Keep</button></div>',
      '<p class="tw-note">No real names. Only a teacher can reset the PIN.</p>',
      '</form></div>'
    ].join("");
    var pop = host.querySelector(".tw-pop");
    var off = host.querySelector(".tw-off");
    function openPop() {
      pop.hidden = false;
      var bar = host.closest(".shell-header");
      if (bar) bar.style.overflow = "visible";
    }
    host.querySelector(".tw-out").addEventListener("click", openPop);
    host.querySelector(".tw-name").addEventListener("click", function () { if (!on()) openPop(); });
    off.addEventListener("click", function () {
      try { sessionStorage.removeItem(SESSION); } catch (e) {}
      pop.hidden = true;
      paintShell(host);
      tell();
    });
    host.querySelector(".tw-reconnect").addEventListener("click", function () {
      var api = whoApi();
      if (!api || !api.flush) return;
      api.flush().then(function () { paintShell(host); tell(); });
    });
    host.querySelector(".tw-reset").addEventListener("click", function () {
      if (!resetPin()) return;
      pop.hidden = false;
      paintShell(host);
    });
    host.querySelector("form").addEventListener("submit", function (event) {
      event.preventDefault();
      var alias = host.querySelector(".tw-alias").value;
      var pin = digits(host.querySelector(".tw-pin").value);
      var note = host.querySelector(".tw-note");
      var api = whoApi();
      if (!api) return;
      if (!pin) { if (note) note.textContent = "The PIN is 4 digits."; return; }
      var rec = pinRec();
      var who = api.read();
      if (rec && who) {
        sha(who.alias + ":" + pin).then(function (hash) {
          if (hash !== rec.hash) { if (note) note.textContent = "Wrong PIN. Ask a teacher to reset it."; return; }
          try { sessionStorage.setItem(SESSION, "1"); } catch (e) {}
          pop.hidden = true;
          host.querySelector(".tw-pin").value = "";
          paintShell(host);
          tell();
        });
        return;
      }
      who = api.write(alias);
      if (!who) { if (note) note.textContent = "Type an alias. No real names."; return; }
      sha(who.alias + ":" + pin).then(function (hash) {
        try { localStorage.setItem(PIN_KEY, JSON.stringify({ alias: who.alias, hash: hash })); } catch (e) {}
        try { sessionStorage.setItem(SESSION, "1"); } catch (e2) {}
        pop.hidden = true;
        host.querySelector(".tw-pin").value = "";
        paintShell(host);
        if (api.flush) api.flush();
        tell();
      });
    });
    root.addEventListener("kw-mark", function () { paintShell(host); });
    root.addEventListener("storage", function () { paintShell(host); });
    paintShell(host);
    host.__paint = function (appId) {
      if (appId) host.setAttribute("data-app", appId);
      var signed = on();
      off.hidden = !signed;
      paintShell(host);
    };
  }
  function tell() {
    var api = whoApi();
    var who = api && api.read();
    var msg = { type: "tw-session", on: on(), alias: who ? who.alias : "", state: light(appFromPath()) };
    try { if (framed()) root.parent.postMessage(msg, location.origin); } catch (e) {}
  }
  function mountApp() {
    css();
    if (document.querySelector(".tw-app-status")) return;
    var pill = document.createElement("div");
    pill.className = "tw-app-status";
    pill.innerHTML = '<i class="tw-dot"></i><span></span>';
    document.body.appendChild(pill);
    function paint() {
      var api = whoApi();
      var who = api && api.read();
      var signed = on() && !!who;
      var state = signed ? light(appFromPath()) : "out";
      pill.dataset.state = state;
      pill.querySelector("span").textContent = signed ? who.alias + " · " + words(state) : "Not signed in";
      pill.hidden = document.documentElement.classList.contains("tw-session-hide") || !!document.fullscreenElement;
    }
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
  function resetPin() {
    if (!teacher()) return false;
    try { localStorage.removeItem(PIN_KEY); } catch (e) {}
    try { sessionStorage.removeItem(SESSION); } catch (e2) {}
    try { root.dispatchEvent(new Event("kw-mark")); } catch (e3) {}
    return true;
  }
  function boot() {
    var slot = document.getElementById("tw-session-slot");
    if (slot) mountShell(slot);
    else if (framed()) mountApp();
  }
  root.TwSession = { boot: boot, resetPin: resetPin, light: light };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})(window);
