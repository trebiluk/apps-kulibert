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

function paintIntro(ol) {
    var latest = ol.querySelector(":scope > li[data-hi='1.1.23']");
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
    var found = ol.querySelector("li[data-hi='1.1.23']");
    if (found) {
      if (ol.firstElementChild !== found) ol.insertBefore(found, ol.firstElementChild);
    } else {
      ol.insertBefore(entry(), ol.firstElementChild);
    }
    dedupeNews(ol);
    paintIntro(ol);
  }

  var OLD_ROLE = "This is the design tool. SpanCraft and Spire Lab are the bridge and tower challenge games.";
  // rw, ti, fa-AF: draft translation
  var ROLE = {
    en: "This is the design tool. Span and Spire are its bridge and tower modes.",
    uk: "Це інструмент для проєктування. Span і Spire — його режими мосту й вежі.",
    ru: "Это инструмент для проектирования. Span и Spire — его режимы моста и башни.",
    es: "Esta es la herramienta de diseño. Span y Spire son sus modos de puente y torre.",
    ar: "هذه أداة التصميم. Span و Spire هما وضعا الجسر والبرج.",
    "fa-AF": "این ابزار طراحی است. Span و Spire حالت‌های پل و برج آن هستند.",
    rw: "Iki ni igikoresho cyo gushushanya. Span na Spire ni uburyo bwacyo bwo ku kiraro no ku munara.",
    ti: "እዚ መሳርሒ ንድፊ እዩ። Spanን Spireን ናይ ድልድልን ግምብን ኩነታቱ እዮም."
  };
  function roleLang() {
    var lang = "en";
    try {
      var q = new URLSearchParams(location.search).get("lang");
      if (q) lang = q;
      else if (document.documentElement.lang) lang = document.documentElement.lang;
    } catch (eLang) {}
    if (lang === "simple") lang = "en";
    if (lang === "fa" || lang === "faAF") lang = "fa-AF";
    return ROLE[lang] ? lang : "en";
  }
  function inHistory(node) {
    var el = node && node.parentElement;
    while (el) {
      if (el.matches && el.matches("ol.mt-10")) return true;
      el = el.parentElement;
    }
    return false;
  }
  function paintRole() {
    if (!document.body) return;
    var next = ROLE[roleLang()];
    var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    var node;
    while ((node = walker.nextNode())) {
      var value = node.nodeValue;
      if (!value || (value.indexOf("SpanCraft") === -1 && value.indexOf("Spire Lab") === -1)) continue;
      if (inHistory(node)) continue;
      if (value.indexOf("stays the bridge challenge") !== -1) continue;
      if (value.indexOf(OLD_ROLE) !== -1) node.nodeValue = value.split(OLD_ROLE).join(next);
      else node.nodeValue = value.replace(/SpanCraft/g, "Span").replace(/Spire Lab/g, "Spire");
    }
  }

  var busy = false;
  function pass() {
    if (busy) return;
    busy = true;
    try { paintChips(); paintNews(); paintRole(); } finally { busy = false; }
  }

  function arm() {
    pass();
    new MutationObserver(pass).observe(document.body, { childList: true, subtree: true });
  }
  if (document.body) arm();
  else document.addEventListener("DOMContentLoaded", arm);
})();
