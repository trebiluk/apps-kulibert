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
      ".tw-pill{position:relative;display:inline-flex;align-items:center;gap:.35rem;height:28px;max-width:9.5rem;padding:0 .5rem 0 .28rem;border-radius:999px;border:1px solid #24506d;background:#0b152c;color:#e8f7ff;font:650 .75rem/1 system-ui,sans-serif;cursor:pointer;white-space:nowrap}",
      ".tw-pill[hidden],.tw-face[hidden],.tw-dot[hidden],.tw-menu[hidden]{display:none !important}",
      ".tw-pop button{height:36px;border-radius:999px;border:1px solid #24506d;background:#0b152c;color:#e8f7ff;font:650 .75rem/1 system-ui,sans-serif;padding:0 .6rem;cursor:pointer}",
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
      "@media (max-width:700px){.tw-who .tw-alias-label,.tw-app-status.is-in .tw-alias-label{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0)}.tw-who,.tw-app-status.is-in{max-width:none;padding:0 .35rem 0 .22rem}}",
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
      ".tw-app-bar{position:fixed !important;top:max(8px, env(safe-area-inset-top));right:max(8px, env(safe-area-inset-right));left:auto;bottom:auto;z-index:40;display:flex;align-items:center;gap:.3rem;width:max-content !important;height:auto !important;max-width:calc(100vw - 16px) !important;pointer-events:none}",
      ".tw-app-bar .tw-pill,.tw-app-bar .tw-back,.tw-app-bar .tw-pop,.tw-app-bar .tw-menu{pointer-events:auto}",
      ".tw-app-bar .tw-pill,.tw-app-bar .tw-back{height:26px;font-size:.7rem;background:rgba(7,16,24,.62);border-color:rgba(180,210,230,.35);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)}",
      ".tw-app-bar .tw-back{padding:0 .5rem;border-radius:999px;border:1px solid rgba(180,210,230,.35);color:#e8f7ff;font:650 .7rem/1 system-ui,sans-serif;cursor:pointer}",
      ".tw-app-bar .tw-pop{position:absolute;right:0;left:auto;top:calc(100% + 6px);bottom:auto}",
      ".tw-app-bar.is-low .tw-pop{top:auto;bottom:calc(100% + 6px)}",
      "html.tw-session-hide .tw-app-status,html.tw-session-hide .tw-pop,html.tw-session-hide .tw-app-bar,html.tw-session-hide .tw-back,html.tw-session-hide .tw-menu{display:none !important}"
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
          rememberFace(person.avatar || "");
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
      if (!armLock(pop)) host.querySelector(".tw-alias").focus();
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
  function doorOverlap(a, b) {
    var w = Math.min(a.right, b.right) - Math.max(a.left, b.left);
    var h = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
    return w > 1 && h > 1 ? w * h : 0;
  }
  function doorInk(n) {
    var r = n.getBoundingClientRect();
    var tag = n.tagName;
    var textual = tag === "P" || tag === "H1" || tag === "H2" || n.classList.contains("brand") || n.classList.contains("caption");
    if (!textual || r.width < root.innerWidth * 0.45) return r;
    try {
      var range = document.createRange();
      range.selectNodeContents(n);
      var tr = range.getBoundingClientRect();
      if (tr.width >= 8 && tr.height >= 8 && tr.width < r.width - 4) return tr;
    } catch (e) {}
    return r;
  }
  function doorControl(n) {
    var tag = n.tagName;
    if (tag === "BUTTON" || tag === "A" || tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA" || tag === "SUMMARY" || tag === "NAV") return true;
    if (n.getAttribute("role") === "button") return true;
    if (n.classList.contains("assist-plate") || n.classList.contains("caption")) return true;
    return false;
  }
  function doorBlocks(bar) {
    var nodes = document.querySelectorAll("a, button, input, select, textarea, summary, [role='button'], .assist-plate, nav, .brand, .caption, h1, h2, p, [role='status']");
    var rects = [];
    var i;
    for (i = 0; i < nodes.length; i++) {
      var n = nodes[i];
      if (bar.contains(n)) continue;
      if (n.closest && n.closest(".tw-app-bar")) continue;
      if (n.hidden) continue;
      var cs = getComputedStyle(n);
      if (cs.display === "none" || cs.visibility === "hidden") continue;
      var r = doorInk(n);
      if (r.width < 12 || r.height < 12) continue;
      if (r.width > root.innerWidth * 0.92 && r.height > root.innerHeight * 0.45) continue;
      rects.push({ r: r, control: doorControl(n) });
    }
    return rects;
  }
  function placeDoor(bar) {
    if (!bar || bar.hidden) return;
    var safeT = "max(8px, env(safe-area-inset-top))";
    var safeR = "max(8px, env(safe-area-inset-right))";
    var safeL = "max(8px, env(safe-area-inset-left))";
    var spots = [
      { top: safeT, right: safeR, bottom: "auto", left: "auto", low: false },
      { top: safeT, left: safeL, bottom: "auto", right: "auto", low: false }
    ];
    var head = document.querySelector("header, .topbar");
    if (head) {
      var hr = head.getBoundingClientRect();
      if (hr.height > 24 && hr.height < root.innerHeight * 0.4 && hr.bottom > 0) {
        var below = Math.round(hr.bottom + 8) + "px";
        spots.push({ top: below, right: safeR, bottom: "auto", left: "auto", low: false });
        spots.push({ top: below, left: safeL, bottom: "auto", right: "auto", low: false });
      }
    }
    var status = document.querySelector(".caption, [role='status']");
    if (status) {
      var sr = status.getBoundingClientRect();
      if (sr.height > 16 && sr.bottom > 0 && sr.bottom < root.innerHeight * 0.7) {
        var under = Math.round(sr.bottom + 8) + "px";
        spots.push({ top: under, right: safeR, bottom: "auto", left: "auto", low: false });
        spots.push({ top: under, left: safeL, bottom: "auto", right: "auto", low: false });
      }
    }
    var foot = document.querySelector("footer, .status");
    if (foot && !bar.contains(foot)) {
      var ftr = foot.getBoundingClientRect();
      if (ftr.height > 16 && ftr.top > root.innerHeight * 0.5) {
        var aboveFoot = Math.round(root.innerHeight - ftr.top + 8) + "px";
        spots.push({ top: "auto", bottom: aboveFoot, right: safeR, left: "auto", low: true });
        spots.push({ top: "auto", bottom: aboveFoot, left: safeL, right: "auto", low: true });
      }
    }
    spots.push({ top: "42%", right: safeR, bottom: "auto", left: "auto", low: false });
    spots.push({ top: "42%", left: safeL, bottom: "auto", right: "auto", low: false });
    function liftSpot(topEdge) {
      if (topEdge < root.innerHeight * 0.45) return;
      var lift = Math.round(root.innerHeight - topEdge + 8) + "px";
      spots.push({ top: "auto", bottom: lift, right: safeR, left: "auto", low: true });
      spots.push({ top: "auto", bottom: lift, left: safeL, right: "auto", low: true });
    }
    var plates = document.querySelectorAll(".assist-plate");
    var p;
    for (p = 0; p < plates.length; p++) {
      var pcs = getComputedStyle(plates[p]);
      if (pcs.display === "none" || pcs.visibility === "hidden") continue;
      var pr = plates[p].getBoundingClientRect();
      if (pr.height < 20) continue;
      liftSpot(pr.top);
    }
    var fixed = document.querySelectorAll("nav, footer, .transport");
    var f;
    for (f = 0; f < fixed.length; f++) {
      var el = fixed[f];
      if (bar.contains(el)) continue;
      var fcs = getComputedStyle(el);
      if (fcs.position !== "fixed" && fcs.position !== "sticky") continue;
      var fr = el.getBoundingClientRect();
      if (fr.height < 24 || fr.width < root.innerWidth * 0.4) continue;
      liftSpot(fr.top);
    }
    var blocks = doorBlocks(bar);
    bar.style.top = spots[0].top;
    bar.style.right = spots[0].right;
    bar.style.bottom = spots[0].bottom;
    bar.style.left = spots[0].left;
    var sized = bar.getBoundingClientRect();
    var barW = sized.width || 160;
    var barH = sized.height || 28;
    function laneGaps(x0, x1) {
      var vh = root.innerHeight;
      var spans = [];
      var i;
      for (i = 0; i < blocks.length; i++) {
        var r = blocks[i].r;
        if (r.right <= x0 + 1 || r.left >= x1 - 1) continue;
        var top = Math.max(0, r.top);
        var bot = Math.min(vh, r.bottom);
        if (bot - top > 1) spans.push([top, bot]);
      }
      spans.sort(function (a, b) { return a[0] - b[0]; });
      var merged = [];
      for (i = 0; i < spans.length; i++) {
        if (!merged.length || spans[i][0] > merged[merged.length - 1][1]) merged.push([spans[i][0], spans[i][1]]);
        else if (spans[i][1] > merged[merged.length - 1][1]) merged[merged.length - 1][1] = spans[i][1];
      }
      var gaps = [];
      var cursor = 8;
      var need = barH + 10;
      for (i = 0; i < merged.length; i++) {
        if (merged[i][0] - cursor >= need) gaps.push(Math.round(cursor));
        cursor = Math.max(cursor, merged[i][1] + 8);
      }
      if (vh - 8 - cursor >= barH) gaps.push(Math.round(cursor));
      return gaps;
    }
    var rightX0 = Math.max(8, root.innerWidth - barW - 8);
    var gapList = laneGaps(rightX0, root.innerWidth - 8);
    var gi;
    for (gi = 0; gi < gapList.length; gi++) {
      spots.push({ top: gapList[gi] + "px", right: safeR, bottom: "auto", left: "auto", low: false });
    }
    gapList = laneGaps(8, Math.min(root.innerWidth - 8, 8 + barW));
    for (gi = 0; gi < gapList.length; gi++) {
      spots.push({ top: gapList[gi] + "px", left: safeL, bottom: "auto", right: "auto", low: false });
    }
    var best = spots[0];
    var bestHit = Infinity;
    var s;
    for (s = 0; s < spots.length; s++) {
      var spot = spots[s];
      bar.style.top = spot.top;
      bar.style.right = spot.right;
      bar.style.bottom = spot.bottom;
      bar.style.left = spot.left;
      var br = bar.getBoundingClientRect();
      var hit = 0;
      var b;
      for (b = 0; b < blocks.length; b++) {
        var area = doorOverlap(br, blocks[b].r);
        if (!area) continue;
        hit += blocks[b].control ? area * 1000 : area;
      }
      if (hit < bestHit) { bestHit = hit; best = spot; }
      if (hit === 0) { best = spot; break; }
    }
    bar.style.top = best.top;
    bar.style.right = best.right;
    bar.style.bottom = best.bottom;
    bar.style.left = best.left;
    bar.classList.toggle("is-low", !!best.low);
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
      placeDoor(bar);
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
        var alias = pop.querySelector(".tw-alias");
        if (alias) alias.focus();
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
    var parkWait = 0;
    function schedulePark() {
      root.clearTimeout(parkWait);
      parkWait = root.setTimeout(function () { placeDoor(bar); }, 80);
    }
    root.addEventListener("resize", schedulePark);
    if (root.MutationObserver) {
      var watcher = new MutationObserver(function (recs) {
        var i;
        for (i = 0; i < recs.length; i++) {
          var t = recs[i].target;
          if (t === bar || (bar.contains && bar.contains(t))) continue;
          schedulePark();
          return;
        }
      });
      watcher.observe(document.body, { attributes: true, subtree: true, attributeFilter: ["class", "hidden"] });
    }
    root.setTimeout(schedulePark, 400);
    root.setTimeout(schedulePark, 1400);
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
