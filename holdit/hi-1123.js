/* HI 1.1.24 override. The built script's What's new list stops at 1.1.22,
   and its home chip still says HI 1.1.22. Also: Test must not sit under
   Sign in / Home, and Debug stays hidden unless ?debug. */
(function () {
  var LINE = "Test stays clear. Sign in and Home are in the menu. Debug stays off unless a teacher asks.";
  var CHIP = "HI 1.1.24";
  var NEWS = [
    { ver: "1.1.24", date: "2026-10-31", title: "Test stays clear", line: LINE },
    { ver: "1.1.23", date: "2026-10-30", title: "You can read the menu and the report", line: "Menus and Settings are readable. Locked jobs show \uD83D\uDD12 and the word Locked. The Member report is bigger. Every build button is at least 44 pixels." }
  ];

  function entry(item) {
    var li = document.createElement("li");
    li.setAttribute("data-hi", item.ver);
    var stamp = document.createElement("p");
    stamp.className = "font-mono text-[11px] uppercase tracking-[0.18em] text-primary";
    stamp.textContent = "HI " + item.ver + " \u00b7 " + item.date;
    var title = document.createElement("h2");
    title.className = "mt-2 text-xl font-medium";
    title.textContent = item.title;
    var list = document.createElement("ul");
    list.className = "mt-3 space-y-2";
    var bullet = document.createElement("li");
    bullet.className = "text-[15px] leading-relaxed text-muted-foreground";
    bullet.textContent = item.line;
    list.appendChild(bullet);
    li.appendChild(stamp);
    li.appendChild(title);
    li.appendChild(list);
    return li;
  }

  function paintChips() {
    var nodes = document.querySelectorAll(".hi-menu-bar p.font-mono, #hi-drawer p.font-mono");
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      if (el.textContent === CHIP) continue;
      if (/^HI 1\.1\./.test(el.textContent)) el.textContent = CHIP;
    }
  }

  function dedupeNews(ol) {
    var items = ol.querySelectorAll(":scope > li");
    for (var i = 0; i < items.length; i++) {
      var li = items[i];
      if (li.getAttribute("data-hi")) continue;
      var heading = li.querySelector("h2");
      var bullets = li.querySelectorAll("ul > li");
      if (!heading || bullets.length !== 1) continue;
      if (bullets[0].textContent.trim() !== heading.textContent.trim()) continue;
      if (!bullets[0].hidden) bullets[0].hidden = true;
    }
  }

  function paintIntro(ol) {
    var latest = ol.querySelector(":scope > li[data-hi='1.1.24']");
    if (!latest) return;
    var bullet = latest.querySelector("ul > li");
    var line = bullet ? bullet.textContent.trim() : "";
    if (!line) return;
    var root = ol.parentElement;
    var lead = root ? root.querySelector("header p.mt-3") : null;
    if (lead && lead.textContent !== line) lead.textContent = line;
    if (bullet && !bullet.hidden) bullet.hidden = true;
  }

  function paintNews() {
    var ol = document.querySelector("ol.mt-10");
    if (!ol) return;
    for (var i = NEWS.length - 1; i >= 0; i--) {
      var item = NEWS[i];
      var found = ol.querySelector("li[data-hi='" + item.ver + "']");
      if (found) {
        if (ol.firstElementChild !== found) ol.insertBefore(found, ol.firstElementChild);
      } else {
        ol.insertBefore(entry(item), ol.firstElementChild);
      }
    }
    dedupeNews(ol);
    paintIntro(ol);
  }

  function debugOn() {
    try {
      var q = new URLSearchParams(location.search);
      return q.has("debug") && q.get("debug") !== "0";
    } catch (e) {
      return false;
    }
  }

  function applyDebugFlag() {
    var root = document.documentElement;
    if (!root) return;
    root.classList.toggle("hi-debug", debugOn());
  }

  applyDebugFlag();

  function editorOn() {
    if (document.querySelector(".shop.shop-editor")) return true;
    return /\/play\//.test(location.pathname);
  }

  function row(tag, className, label) {
    var el = document.createElement(tag);
    if (tag === "button") el.type = "button";
    el.className = className;
    var icon = document.createElement("span");
    icon.setAttribute("aria-hidden", "true");
    icon.textContent = className === "hi-back-hub" ? "\u2302 " : "\u25CF ";
    var text = document.createElement("span");
    text.textContent = label;
    el.appendChild(icon);
    el.appendChild(text);
    return el;
  }

  function ensureDebugRow(box) {
    var row = box.querySelector("a.hi-debug-row");
    if (!debugOn()) {
      if (row) row.remove();
      return;
    }
    if (!row) {
      row = document.createElement("a");
      row.className = "hi-debug-row";
      row.href = "/holdit/debug";
      var icon = document.createElement("span");
      icon.setAttribute("aria-hidden", "true");
      icon.textContent = "\u2699 ";
      var text = document.createElement("span");
      text.textContent = "Debug";
      row.appendChild(icon);
      row.appendChild(text);
    }
    var sign = box.querySelector(".hi-sign-in");
    var hub = box.querySelector(".hi-back-hub");
    var home = box.querySelector(".kb-drawer-home");
    var anchor = sign || hub || home;
    if (anchor && anchor.nextElementSibling !== row) anchor.insertAdjacentElement("afterend", row);
    else if (!row.parentNode) box.appendChild(row);
  }

  function parkBar() {
    var on = editorOn();
    document.documentElement.classList.toggle("hi-editor", on);
    applyDebugFlag();
    var box = document.getElementById("kb-drawer");
    if (!box) return;
    var home = box.querySelector(".kb-drawer-home");
    if (!on) {
      var extra = box.querySelectorAll(".hi-back-hub, .hi-sign-in");
      for (var i = 0; i < extra.length; i++) extra[i].remove();
    } else {
      if (!box.querySelector(".hi-back-hub")) {
        var back = row("a", "hi-back-hub", "Back to Hub");
        back.href = "https://apps.kulibert.net/";
        back.target = "_top";
        if (home) home.insertAdjacentElement("afterend", back);
        else box.appendChild(back);
      }
      if (!box.querySelector(".hi-sign-in")) {
        var sign = row("button", "hi-sign-in", "Sign in");
        sign.addEventListener("click", function () {
          var alias = document.querySelector(".kb-alias");
          if (alias) alias.click();
        });
        var hub = box.querySelector(".hi-back-hub");
        if (hub) hub.insertAdjacentElement("afterend", sign);
      }
    }
    ensureDebugRow(box);
    applyDebugFlag();
  }

  var busy = false;
  var pending = false;
  function pass() {
    if (busy) { pending = true; return; }
    busy = true;
    try { applyDebugFlag(); paintChips(); paintNews(); parkBar(); }
    finally {
      busy = false;
      if (pending) { pending = false; pass(); }
    }
  }

  function arm() {
    pass();
    new MutationObserver(pass).observe(document.body, { childList: true, subtree: true });
  }
  if (document.body) arm();
  else document.addEventListener("DOMContentLoaded", arm);
  window.addEventListener("pageshow", applyDebugFlag);
})();
