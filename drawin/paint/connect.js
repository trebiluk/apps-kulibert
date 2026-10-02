/* Paint shop list. Klecks stays untouched. Sign-in stays the Hub widget. */
(function () {
  var pendingName = "";
  var timer = 0;
  var lastLine = "";
  var lastAt = 0;

  function who() {
    return window.KulibertWho || null;
  }

  function baseName(raw) {
    var name = String(raw || "").replace(/\s+/g, " ").trim();
    if (!name || name === "true") return "";
    name = name.split(/[/\\]/).pop();
    return name;
  }

  function remember(fileName) {
    var next = baseName(fileName);
    if (next) pendingName = next;
    else if (!pendingName) pendingName = "drawing";
  }

  function commit() {
    timer = 0;
    var api = who();
    if (!api || !api.mark) return;
    var line = "Paint: " + (pendingName || "drawing");
    pendingName = "";
    var now = Date.now();
    if (line === lastLine && now - lastAt < 1200) return;
    lastLine = line;
    lastAt = now;
    api.mark("drawin", line);
    if (api.record) {
      api.record({
        app: "drawin",
        version: "DS 0.3.1",
        event: "save",
        level: "paint",
        score: 1,
        max: 1,
        stars: 1,
        xp: 5,
        skill: "design",
        ms: 0
      });
    }
    if (api.flush) api.flush();
    if (api.read && api.read()) toast();
  }

  function queue(fileName, wait) {
    if (!who()) return;
    remember(fileName);
    clearTimeout(timer);
    timer = setTimeout(commit, wait);
  }

  function isSaveLabel(label) {
    var text = String(label || "").replace(/\s+/g, " ").trim();
    if (!text || /reminder/i.test(text)) return false;
    return /^(save|export)(\b|$)/i.test(text);
  }

  function onClick(e) {
    if (!who()) return;
    var node = e.target && e.target.nodeType === 1 ? e.target : e.target && e.target.parentElement;
    if (!node || !node.closest) return;
    var anchor = node.closest("a[download], a[href^='blob:']");
    if (anchor) {
      queue(anchor.getAttribute("download") || "", 60);
      return;
    }
    var btn = node.closest("button, .kl-button, .toolspace-row-button");
    if (!btn) return;
    var title = btn.getAttribute("title") || "";
    var text = (btn.innerText || btn.textContent || "").replace(/\s+/g, " ").trim();
    if (isSaveLabel(title) || isSaveLabel(text)) queue("", 500);
  }

  function onKey(e) {
    if (!who()) return;
    if (!(e.ctrlKey || e.metaKey) || e.shiftKey || e.altKey || e.repeat) return;
    if (e.key !== "s" && e.key !== "S") return;
    var t = e.target;
    if (t && (/^(input|textarea|select)$/i.test(t.tagName) || t.isContentEditable)) return;
    queue("", 500);
  }

  function toast() {
    var el = document.getElementById("drawin-shop-toast");
    if (!el) {
      el = document.createElement("div");
      el.id = "drawin-shop-toast";
      el.setAttribute("role", "status");
      el.style.cssText = "position:fixed;left:50%;bottom:18px;transform:translateX(-50%);z-index:100000;margin:0;padding:8px 14px;border-radius:999px;background:#161513;color:#f3efe6;font:600 13px/1.3 system-ui,sans-serif;pointer-events:none;box-shadow:0 8px 24px rgba(0,0,0,.35)";
      (document.body || document.documentElement).appendChild(el);
    }
    el.textContent = "Saved to your shop list";
    el.hidden = false;
    clearTimeout(el._hide);
    el._hide = setTimeout(function () { el.hidden = true; }, 2200);
  }

  document.addEventListener("click", onClick, true);
  document.addEventListener("keydown", onKey, true);
})();
