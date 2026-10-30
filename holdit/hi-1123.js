/* HI 1.1.23 override. The built script's What's new list stops at 1.1.22,
   and its home chip still says HI 1.1.22. */
(function () {
  var LINE = "Menus and Settings are readable. Locked jobs show \uD83D\uDD12 and the word Locked. The Member report is bigger. Every build button is at least 44 pixels.";
  var CHIP = "HI 1.1.23";

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

function paintNews() {
    var ol = document.querySelector("ol.mt-10");
    if (!ol) return;
    var found = ol.querySelector("li[data-hi='1.1.23']");
    if (found) {
      if (ol.firstElementChild !== found) ol.insertBefore(found, ol.firstElementChild);
      dedupeNews(ol);
      return;
    }
    ol.insertBefore(entry(), ol.firstElementChild);
    dedupeNews(ol);
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
