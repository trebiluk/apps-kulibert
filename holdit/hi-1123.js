/* HI 1.1.23 override. The built script's What's new list stops at 1.1.22,
   and its home chip still says HI 1.1.22. */
(function () {
  var LINE = "Menus and Settings are readable. Locked jobs show \uD83D\uDD12 and the word Locked. The Member report is bigger. Every build button is at least 44 pixels.";
  var LINE25 = "Language, Read aloud, and Larger type in the menu now change the page, and Hub Menu is the last row.";
  var LINE26 = "The menu settings scroll with the list. Close and Settings are translated for Spanish, Arabic, and Dari (machine draft).";
  var CHIP = "HI 1.1.26";

  function entry26() {
    var li = document.createElement("li");
    li.setAttribute("data-hi", "1.1.26");
    var stamp = document.createElement("p");
    stamp.className = "font-mono text-[11px] uppercase tracking-[0.18em] text-primary";
    stamp.textContent = "HI 1.1.26 \u00b7 2026-10-30";
    var title = document.createElement("h2");
    title.className = "mt-2 text-xl font-medium";
    title.textContent = "The menu scrolls cleanly";
    var list = document.createElement("ul");
    list.className = "mt-3 space-y-2";
    var item = document.createElement("li");
    item.className = "text-[15px] leading-relaxed text-muted-foreground";
    item.textContent = LINE26;
    list.appendChild(item);
    li.appendChild(stamp);
    li.appendChild(title);
    li.appendChild(list);
    return li;
  }

  function entry25() {
    var li = document.createElement("li");
    li.setAttribute("data-hi", "1.1.25");
    var stamp = document.createElement("p");
    stamp.className = "font-mono text-[11px] uppercase tracking-[0.18em] text-primary";
    stamp.textContent = "HI 1.1.25 \u00b7 2026-10-30";
    var title = document.createElement("h2");
    title.className = "mt-2 text-xl font-medium";
    title.textContent = "The menu settings apply";
    var list = document.createElement("ul");
    list.className = "mt-3 space-y-2";
    var item = document.createElement("li");
    item.className = "text-[15px] leading-relaxed text-muted-foreground";
    item.textContent = LINE25;
    list.appendChild(item);
    li.appendChild(stamp);
    li.appendChild(title);
    li.appendChild(list);
    return li;
  }

  function entry24() {
    var li = document.createElement("li");
    li.setAttribute("data-hi", "1.1.24");
    var stamp = document.createElement("p");
    stamp.className = "font-mono text-[11px] uppercase tracking-[0.18em] text-primary";
    stamp.textContent = "HI 1.1.24 \u00b7 2026-10-30";
    var title = document.createElement("h2");
    title.className = "mt-2 text-xl font-medium";
    title.textContent = "Challenge of the Day";
    var list = document.createElement("ul");
    list.className = "mt-3 space-y-2";
    var item = document.createElement("li");
    item.className = "text-[15px] leading-relaxed text-muted-foreground";
    item.textContent = "The home page is one Challenge of the Day. Span and Spire are the doors. Language, Read aloud, and Larger type are in the menu.";
    list.appendChild(item);
    li.appendChild(stamp);
    li.appendChild(title);
    li.appendChild(list);
    return li;
  }

  function entry() {
    var li = document.createElement("li");
    li.setAttribute("data-hi", "1.1.23");
    var stamp = document.createElement("p");
    stamp.className = "font-mono text-[11px] uppercase tracking-[0.18em] text-primary";
    stamp.textContent = "HI 1.1.23 \u00b7 2026-10-30";
    var title = document.createElement("h2");
    title.className = "mt-2 text-xl font-medium";
    title.textContent = "You can read the menu and the report";
    var list = document.createElement("ul");
    list.className = "mt-3 space-y-2";
    var item = document.createElement("li");
    item.className = "text-[15px] leading-relaxed text-muted-foreground";
    item.textContent = LINE;
    list.appendChild(item);
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
      el.textContent = CHIP;
    }
  }

  function dedupeNews(ol) {
  var items = ol.querySelectorAll(":scope > li");
  for (var i = 0; i < items.length; i++) {
    var li = items[i];
    if (li.getAttribute("data-hi") === "1.1.23") continue;
    var heading = li.querySelector("h2");
    var bullets = li.querySelectorAll("ul > li");
    if (!heading || bullets.length !== 1) continue;
    if (bullets[0].textContent.trim() !== heading.textContent.trim()) continue;
    if (!bullets[0].hidden) bullets[0].hidden = true;
  }
}

function paintIntro(ol) {
    var latest = ol.querySelector(":scope > li");
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
    if (!ol.querySelector("li[data-hi='1.1.23']")) {
      var after24 = ol.querySelector("li[data-hi='1.1.24']");
      if (after24) after24.after(entry());
      else ol.insertBefore(entry(), ol.firstElementChild);
    }
    if (!ol.querySelector("li[data-hi='1.1.24']")) {
      var after25 = ol.querySelector("li[data-hi='1.1.25']");
      if (after25) after25.after(entry24());
      else ol.insertBefore(entry24(), ol.firstElementChild);
    }
    if (!ol.querySelector("li[data-hi='1.1.25']")) {
      var after26 = ol.querySelector("li[data-hi='1.1.26']");
      if (after26) after26.after(entry25());
      else ol.insertBefore(entry25(), ol.firstElementChild);
    }
    var top = ol.querySelector("li[data-hi='1.1.26']");
    if (!top) ol.insertBefore(entry26(), ol.firstElementChild);
    else if (ol.firstElementChild !== top) ol.insertBefore(top, ol.firstElementChild);
    dedupeNews(ol);
    paintIntro(ol);
  }

  var busy = false;
  function pass() {
    if (busy) return;
    busy = true;
    try { paintChips(); paintNews(); } finally { busy = false; }
  }

  function arm() {
    pass();
    new MutationObserver(pass).observe(document.body, { childList: true, subtree: true });
  }
  if (document.body) arm();
  else document.addEventListener("DOMContentLoaded", arm);
})();
