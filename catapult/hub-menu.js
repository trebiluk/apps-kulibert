/* Hub Menu row. Copy this file with hub-menu.css.
   The shared bar does not export its drawer rows, so this snippet
   builds Close, What's new, Home, My settings, and Help from LINKS. */
(function (root) {
  var HOME = "https://apps.kulibert.net/";
  var LINKS = [
    { id: "close", key: "close", icon: "\u2715", action: "close" },
    { id: "whats", key: "whatsNew", action: "whats" },
    { id: "home", key: "home", icon: "\u2302", href: HOME },
    { id: "settings", key: "mySettings", icon: "\u2699", action: "settings" },
    { id: "help", key: "help", icon: "?", action: "help" }
  ];
  var LANGS = ["en", "uk", "ru", "es", "ar", "fa-AF", "rw", "ti"];
  var LANG_NAMES = {
    en: "English",
    uk: "\u0423\u043a\u0440\u0430\u0457\u043d\u0441\u044c\u043a\u0430",
    ru: "\u0420\u0443\u0441\u0441\u043a\u0438\u0439",
    es: "Espa\u00f1ol",
    ar: "\u0627\u0644\u0639\u0631\u0628\u064a\u0629",
    "fa-AF": "\u062f\u0631\u06cc",
    rw: "Ikinyarwanda",
    ti: "\u1275\u130d\u122d\u129b"
  };
  var COPY = {
    en: {
      hubMenu: "Hub Menu",
      close: "Close",
      whatsNew: "What's new",
      home: "Home",
      mySettings: "My settings",
      help: "Help",
      line: "\u2630 opens Bertapult's menu. Hub Menu at the bottom opens Close, What's new, Home, My settings, and Help."
    },
    uk: {
      hubMenu: "\u041c\u0435\u043d\u044e Hub",
      close: "\u0417\u0430\u043a\u0440\u0438\u0442\u0438",
      whatsNew: "\u0429\u043e \u043d\u043e\u0432\u043e\u0433\u043e",
      home: "\u0413\u043e\u043b\u043e\u0432\u043d\u0430",
      mySettings: "\u041c\u043e\u0457 \u043d\u0430\u043b\u0430\u0448\u0442\u0443\u0432\u0430\u043d\u043d\u044f",
      help: "\u0414\u043e\u043f\u043e\u043c\u043e\u0433\u0430",
      line: "\u2630 \u0432\u0456\u0434\u043a\u0440\u0438\u0432\u0430\u0454 \u043c\u0435\u043d\u044e Bertapult. \u00ab\u041c\u0435\u043d\u044e Hub\u00bb \u0432\u043d\u0438\u0437\u0443 \u0432\u0456\u0434\u043a\u0440\u0438\u0432\u0430\u0454 \u0417\u0430\u043a\u0440\u0438\u0442\u0438, \u0429\u043e \u043d\u043e\u0432\u043e\u0433\u043e, \u0413\u043e\u043b\u043e\u0432\u043d\u0430, \u041c\u043e\u0457 \u043d\u0430\u043b\u0430\u0448\u0442\u0443\u0432\u0430\u043d\u043d\u044f \u0442\u0430 \u0414\u043e\u043f\u043e\u043c\u043e\u0433\u0430."
    },
    ru: {
      hubMenu: "\u041c\u0435\u043d\u044e Hub",
      close: "\u0417\u0430\u043a\u0440\u044b\u0442\u044c",
      whatsNew: "\u0427\u0442\u043e \u043d\u043e\u0432\u043e\u0433\u043e",
      home: "\u0413\u043b\u0430\u0432\u043d\u0430\u044f",
      mySettings: "\u041c\u043e\u0438 \u043d\u0430\u0441\u0442\u0440\u043e\u0439\u043a\u0438",
      help: "\u041f\u043e\u043c\u043e\u0449\u044c",
      line: "\u2630 \u043e\u0442\u043a\u0440\u044b\u0432\u0430\u0435\u0442 \u043c\u0435\u043d\u044e Bertapult. \u00ab\u041c\u0435\u043d\u044e Hub\u00bb \u0432\u043d\u0438\u0437\u0443 \u043e\u0442\u043a\u0440\u044b\u0432\u0430\u0435\u0442 \u0417\u0430\u043a\u0440\u044b\u0442\u044c, \u0427\u0442\u043e \u043d\u043e\u0432\u043e\u0433\u043e, \u0413\u043b\u0430\u0432\u043d\u0430\u044f, \u041c\u043e\u0438 \u043d\u0430\u0441\u0442\u0440\u043e\u0439\u043a\u0438 \u0438 \u041f\u043e\u043c\u043e\u0449\u044c."
    },
    es: {
      hubMenu: "Men\u00fa del Hub",
      close: "Cerrar",
      whatsNew: "Novedades",
      home: "Inicio",
      mySettings: "Mis ajustes",
      help: "Ayuda",
      line: "\u2630 abre el men\u00fa de Bertapult. Men\u00fa del Hub, al final, abre Cerrar, Novedades, Inicio, Mis ajustes y Ayuda."
    },
    ar: {
      hubMenu: "\u0642\u0627\u0626\u0645\u0629 \u0627\u0644\u0647\u0627\u0628",
      close: "\u0625\u063a\u0644\u0627\u0642",
      whatsNew: "\u0645\u0627 \u0627\u0644\u062c\u062f\u064a\u062f",
      home: "\u0627\u0644\u0631\u0626\u064a\u0633\u064a\u0629",
      mySettings: "\u0625\u0639\u062f\u0627\u062f\u0627\u062a\u064a",
      help: "\u0645\u0633\u0627\u0639\u062f\u0629",
      line: "\u2630 \u064a\u0641\u062a\u062d \u0642\u0627\u0626\u0645\u0629 Bertapult. \u00ab\u0642\u0627\u0626\u0645\u0629 \u0627\u0644\u0647\u0627\u0628\u00bb \u0641\u064a \u0627\u0644\u0623\u0633\u0641\u0644 \u062a\u0641\u062a\u062d \u0625\u063a\u0644\u0627\u0642\u060c \u0648\u0645\u0627 \u0627\u0644\u062c\u062f\u064a\u062f\u060c \u0648\u0627\u0644\u0631\u0626\u064a\u0633\u064a\u0629\u060c \u0648\u0625\u0639\u062f\u0627\u062f\u0627\u062a\u064a\u060c \u0648\u0645\u0633\u0627\u0639\u062f\u0629."
    },
    "fa-AF": {
      hubMenu: "\u0641\u0647\u0631\u0633\u062a \u0647\u0627\u0628",
      close: "\u0628\u0633\u062a\u0646",
      whatsNew: "\u062a\u0627\u0632\u0647\u200c\u0647\u0627",
      home: "\u062e\u0627\u0646\u0647",
      mySettings: "\u062a\u0646\u0638\u06cc\u0645\u0627\u062a \u0645\u0646",
      help: "\u06a9\u0645\u06a9",
      line: "\u2630 \u0641\u0647\u0631\u0633\u062a Bertapult \u0631\u0627 \u0628\u0627\u0632 \u0645\u06cc\u200c\u06a9\u0646\u062f. \u00ab\u0641\u0647\u0631\u0633\u062a \u0647\u0627\u0628\u00bb \u062f\u0631 \u067e\u0627\u06cc\u06cc\u0646\u060c \u0628\u0633\u062a\u0646\u060c \u062a\u0627\u0632\u0647\u200c\u0647\u0627\u060c \u062e\u0627\u0646\u0647\u060c \u062a\u0646\u0638\u06cc\u0645\u0627\u062a \u0645\u0646 \u0648 \u06a9\u0645\u06a9 \u0631\u0627 \u0628\u0627\u0632 \u0645\u06cc\u200c\u06a9\u0646\u062f."
    },
    rw: {
      hubMenu: "Menyu ya Hub",
      close: "Funga",
      whatsNew: "Ibishya",
      home: "Ahabanza",
      mySettings: "Igenamiterere ryanjye",
      help: "Ubufasha",
      line: "\u2630 ifungura menyu ya Bertapult. Menyu ya Hub hepfo ifungura Funga, Ibishya, Ahabanza, Igenamiterere ryanjye, na Ubufasha."
    },
    ti: {
      hubMenu: "\u12dd\u122d\u12dd\u122d Hub",
      close: "\u12d5\u1338\u12cd",
      whatsNew: "\u12a5\u1295\u1273\u12ed \u1213\u12f5\u123d \u12a3\u120e",
      home: "\u1218\u1260\u1308\u1232",
      mySettings: "\u1293\u1270\u12ed \u1245\u1325\u12d3\u1273\u1275",
      help: "\u1213\u1308\u12dd",
      line: "\u2630 \u12dd\u122d\u12dd\u122d Bertapult \u12ed\u12b8\u134d\u1275\u1362 \u00ab\u12dd\u122d\u12dd\u122d Hub\u00bb \u12a3\u1265 \u1273\u1215\u1272 \u12d5\u1338\u12cd\u1361 \u12a5\u1295\u1273\u12ed \u1213\u12f5\u123d \u12a3\u120e\u1361 \u1218\u1260\u1308\u1232\u1361 \u1293\u1270\u12ed \u1245\u1325\u12d3\u1273\u1275\u1361 \u12a8\u121d\u12a1\u0027\u12cd\u1295 \u1213\u1308\u12dd \u12ed\u12b8\u134d\u1275\u1362"
    }
  };
  var seq = 0;
  var placing = false;

  function pageLang() {
    var lang = "";
    try {
      if (root.KulibertPrefs && root.KulibertPrefs.lang) lang = root.KulibertPrefs.lang;
    } catch (e) {}
    if (!lang) lang = document.documentElement.getAttribute("data-kp-lang") || document.documentElement.lang || "en";
    if (lang === "simple") lang = "en";
    if (!COPY[lang]) lang = "en";
    return lang;
  }

  function dirOf(lang) {
    return lang === "ar" || lang === "fa-AF" ? "rtl" : "ltr";
  }

  function pack() {
    return COPY[pageLang()] || COPY.en;
  }

  function barTag() {
    var nodes = document.querySelectorAll("script[src*='kulibert-bar']");
    if (nodes.length) return nodes[nodes.length - 1];
    return document.querySelector("script[data-menu]") || document.querySelector("script[data-whats-new]");
  }

  function whatsLine() {
    var script = barTag();
    var attr = script && script.getAttribute("data-whats-new");
    if (attr) return attr;
    var line = pack().line;
    return line || COPY.en.line;
  }

  function el(tag, className) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    return node;
  }

  function glyph(text) {
    var node = el("span", "hub-menu-glyph");
    node.setAttribute("aria-hidden", "true");
    node.textContent = text;
    return node;
  }

  function waffle() {
    var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", "hub-menu-icon");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("width", "20");
    svg.setAttribute("height", "20");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("focusable", "false");
    var g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute("fill", "currentColor");
    [[5, 5], [12, 5], [19, 5], [5, 12], [12, 12], [19, 12], [5, 19], [12, 19], [19, 19]].forEach(function (xy) {
      var c = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      c.setAttribute("cx", String(xy[0]));
      c.setAttribute("cy", String(xy[1]));
      c.setAttribute("r", "1.7");
      g.appendChild(c);
    });
    svg.appendChild(g);
    return svg;
  }

  function setExpanded(block, open) {
    var row = block.querySelector(".hub-menu-row");
    var panel = block.querySelector(".hub-menu-panel");
    if (!row || !panel) return;
    row.setAttribute("aria-expanded", open ? "true" : "false");
    if (open) panel.removeAttribute("hidden");
    else panel.setAttribute("hidden", "");
  }

  function menuButtons() {
    var script = barTag();
    var sel = script && script.getAttribute("data-menu");
    if (!sel) return [];
    try { return document.querySelectorAll(sel); } catch (eSel) { return []; }
  }

  function controlOpen(btn) {
    if (!btn) return false;
    if (btn.getAttribute("aria-expanded") === "true") return true;
    var id = btn.getAttribute("aria-controls");
    if (!id) return false;
    var box = document.getElementById(id);
    if (!box || box.hidden) return false;
    var view = getComputedStyle(box);
    if (view.display === "none" || view.visibility === "hidden") return false;
    var rect = box.getBoundingClientRect();
    return rect.width >= 8 && rect.height >= 8;
  }

  function dockStillOpen() {
    var dock = document.querySelector(".ti-dock");
    if (!dock || dock.hidden) return null;
    var view = getComputedStyle(dock);
    if (view.display === "none" || view.visibility === "hidden") return null;
    var rect = dock.getBoundingClientRect();
    if (rect.width < 8 || rect.height < 8) return null;
    return dock;
  }

  function closeDock(dock) {
    if (!dock) return false;
    var buttons = dock.querySelectorAll("button");
    for (var i = 0; i < buttons.length; i++) {
      var cls = buttons[i].className;
      if (typeof cls === "string" && cls.indexOf("inset-0") !== -1 && buttons[i].click) {
        buttons[i].click();
        return true;
      }
    }
    return false;
  }

  function sendEscape(block) {
    var target = block.querySelector(".hub-menu-row") || document.body;
    try {
      target.dispatchEvent(new KeyboardEvent("keydown", {
        key: "Escape",
        code: "Escape",
        bubbles: true,
        cancelable: true
      }));
    } catch (eEsc) {}
  }

  function closeAppMenu(block) {
    setExpanded(block, false);
    var buttons = menuButtons();
    var opener = null;
    for (var i = 0; i < buttons.length; i++) {
      if (!controlOpen(buttons[i]) || typeof buttons[i].click !== "function") continue;
      opener = buttons[i];
      opener.click();
      break;
    }
    if (opener) {
      if (opener.focus) opener.focus();
    } else {
      sendEscape(block);
    }
    closeDock(dockStillOpen());
  }

  function openHelp(block) {
    var script = document.querySelector("script[data-help]");
    var sel = script && script.getAttribute("data-help");
    var target = null;
    if (sel) {
      try { target = document.querySelector(sel); } catch (e) { target = null; }
    }
    if (!target) target = document.querySelector(".kb-bar .kb-help");
    if (target && !target.hidden && target.click) {
      target.click();
      return;
    }
    var line = block.querySelector(".hub-menu-line");
    if (line) {
      line.setAttribute("tabindex", "-1");
      line.focus();
    }
  }

  function paint(block) {
    var lang = pageLang();
    var text = pack();
    block.dir = dirOf(lang);
    block.lang = lang === "fa-AF" ? "fa" : lang;
    var label = block.querySelector(".hub-menu-label");
    if (label) label.textContent = text.hubMenu;
    var row = block.querySelector(".hub-menu-row");
    if (row) row.setAttribute("aria-label", text.hubMenu);
    LINKS.forEach(function (item) {
      var node = block.querySelector('[data-hub-key="' + item.key + '"]');
      if (!node) return;
      var word = node.querySelector(".hub-menu-text");
      if (word) word.textContent = text[item.key];
      if (item.action === "whats") {
        var line = node.querySelector(".hub-menu-line");
        if (line) line.textContent = whatsLine();
      }
    });
    var names = block.querySelectorAll(".hub-menu-langs button");
    for (var i = 0; i < names.length; i++) {
      var code = names[i].getAttribute("data-lang");
      var on = code === lang;
      names[i].setAttribute("aria-pressed", on ? "true" : "false");
      var mark = names[i].querySelector(".hub-menu-mark");
      if (mark) mark.textContent = on ? "\u2713 " : "";
    }
    block.setAttribute("data-hub-lang", lang);
  }

  function createBlock() {
    seq += 1;
    var id = "hub-menu-panel-" + seq;
    var langsId = "hub-menu-langs-" + seq;
    var block = el("div", "hub-menu-block");
    var row = el("button", "hub-menu-row");
    row.type = "button";
    row.setAttribute("aria-expanded", "false");
    row.setAttribute("aria-controls", id);
    row.appendChild(waffle());
    var label = el("span", "hub-menu-label");
    label.textContent = COPY.en.hubMenu;
    row.appendChild(label);
    var chev = el("span", "hub-menu-chevron");
    chev.setAttribute("aria-hidden", "true");
    chev.textContent = "\u25b8";
    row.appendChild(chev);
    block.appendChild(row);

    var panel = el("div", "hub-menu-panel");
    panel.id = id;
    panel.hidden = true;

    LINKS.forEach(function (item) {
      if (item.action === "whats") {
        var news = el("p", "hub-menu-news");
        news.setAttribute("data-hub-key", item.key);
        news.setAttribute("data-hub-action", "whats");
        var kicker = el("strong", "hub-menu-kicker hub-menu-text");
        kicker.textContent = COPY.en.whatsNew;
        news.appendChild(kicker);
        news.appendChild(document.createTextNode(" "));
        var line = el("span", "hub-menu-line");
        line.textContent = COPY.en.line;
        news.appendChild(line);
        panel.appendChild(news);
        return;
      }
      var node = item.href ? el("a", "hub-menu-link") : el("button", "hub-menu-link");
      node.setAttribute("data-hub-key", item.key);
      node.setAttribute("data-hub-action", item.action || "link");
      if (item.href) {
        node.href = item.href;
        node.target = "_top";
      } else {
        node.type = "button";
      }
      if (item.icon) node.appendChild(glyph(item.icon));
      var word = el("span", "hub-menu-text");
      word.textContent = COPY.en[item.key];
      node.appendChild(word);
      if (item.action === "settings") {
        node.setAttribute("aria-expanded", "false");
        node.setAttribute("aria-controls", langsId);
      }
      panel.appendChild(node);
      if (item.action === "settings") {
        var langs = el("div", "hub-menu-langs");
        langs.id = langsId;
        langs.hidden = true;
        LANGS.forEach(function (code) {
          var b = el("button");
          b.type = "button";
          b.setAttribute("data-lang", code);
          b.setAttribute("lang", code === "fa-AF" ? "fa" : code);
          if (code === "ar" || code === "fa-AF") b.dir = "rtl";
          b.setAttribute("aria-pressed", "false");
          var mark = el("span", "hub-menu-mark");
          mark.setAttribute("aria-hidden", "true");
          b.appendChild(mark);
          var name = el("span");
          name.textContent = LANG_NAMES[code];
          b.appendChild(name);
          b.addEventListener("click", function (ev) {
            ev.preventDefault();
            ev.stopPropagation();
            if (root.KulibertPrefs && root.KulibertPrefs.acceptLang) root.KulibertPrefs.acceptLang(code);
            paint(block);
          });
          langs.appendChild(b);
        });
        panel.appendChild(langs);
      }
    });
    block.appendChild(panel);

    row.addEventListener("click", function (ev) {
      ev.preventDefault();
      ev.stopPropagation();
      var open = row.getAttribute("aria-expanded") !== "true";
      setExpanded(block, open);
      if (open) {
        var first = panel.querySelector("button, a");
        if (first) first.focus();
      }
    });
    panel.addEventListener("click", function (ev) {
      var hit = ev.target.closest ? ev.target.closest("[data-hub-action]") : null;
      if (!hit || !panel.contains(hit)) return;
      var action = hit.getAttribute("data-hub-action");
      if (action === "close") {
        ev.preventDefault();
        ev.stopPropagation();
        closeAppMenu(block);
      } else if (action === "settings") {
        ev.preventDefault();
        ev.stopPropagation();
        var langsBox = block.querySelector(".hub-menu-langs");
        var willOpen = langsBox && langsBox.hidden;
        if (langsBox) {
          if (willOpen) langsBox.hidden = false;
          else langsBox.hidden = true;
        }
        hit.setAttribute("aria-expanded", willOpen ? "true" : "false");
      } else if (action === "help") {
        ev.preventDefault();
        ev.stopPropagation();
        openHelp(block);
      }
    });
    block.addEventListener("keydown", function (ev) {
      if (!ev || ev.key !== "Escape" || row.getAttribute("aria-expanded") !== "true") return;
      setExpanded(block, false);
      row.focus();
    });
    paint(block);
    return block;
  }

  function findHosts() {
    var hosts = [];
    function add(node) {
      if (!node || hosts.indexOf(node) !== -1) return;
      if (node.closest && (node.closest(".kb-bar") || node.closest("#kb-drawer") || node.closest(".hub-menu-block"))) return;
      hosts.push(node);
    }
    var marked = document.querySelectorAll("[data-hub-menu-host]");
    for (var m = 0; m < marked.length; m++) add(marked[m]);
    var scripts = document.querySelectorAll("script[data-menu]");
    for (var s = 0; s < scripts.length; s++) {
      var sel = scripts[s].getAttribute("data-menu");
      if (!sel) continue;
      var buttons = [];
      try { buttons = document.querySelectorAll(sel); } catch (eSel) { buttons = []; }
      for (var b = 0; b < buttons.length; b++) {
        var cid = buttons[b].getAttribute("aria-controls");
        if (cid) add(document.getElementById(cid));
      }
    }
    var settings = document.querySelectorAll("[data-ti='settings']");
    for (var i = 0; i < settings.length; i++) {
      var col = settings[i].parentElement;
      while (col && col !== document.body) {
        if (col.classList && col.classList.contains("flex-col") && col.classList.contains("h-full")) {
          add(col);
          break;
        }
        col = col.parentElement;
      }
    }
    return hosts;
  }

  function trustAppMenu() {
    var scripts = document.querySelectorAll("script[data-menu]");
    for (var s = 0; s < scripts.length; s++) {
      var sel = scripts[s].getAttribute("data-menu");
      if (!sel) continue;
      var buttons = [];
      try { buttons = document.querySelectorAll(sel); } catch (eSel) { continue; }
      for (var i = 0; i < buttons.length; i++) {
        if (buttons[i].getAttribute("data-kb-was-shown") !== "1") buttons[i].setAttribute("data-kb-was-shown", "1");
      }
    }
  }

  function scan() {
    if (placing) return;
    placing = true;
    try {
      trustAppMenu();
      var hosts = findHosts();
      for (var i = 0; i < hosts.length; i++) {
        var host = hosts[i];
        var block = host.querySelector(":scope > .hub-menu-block");
        if (!block) {
          block = createBlock();
          host.appendChild(block);
        } else if (host.lastElementChild !== block) {
          host.appendChild(block);
        }
        var shown = block.querySelector(".hub-menu-line");
        var nextLine = whatsLine();
        if (block.getAttribute("data-hub-lang") !== pageLang() || (shown && shown.textContent !== nextLine)) paint(block);
      }
    } finally {
      placing = false;
    }
  }

  var queued = false;
  function queue() {
    if (queued) return;
    queued = true;
    Promise.resolve().then(function () {
      queued = false;
      scan();
    });
  }

  function boot() {
    scan();
    if (root.MutationObserver && document.body) {
      new MutationObserver(function (records) {
        for (var i = 0; i < records.length; i++) {
          var target = records[i].target;
          if (target && target.closest && target.closest(".hub-menu-block")) continue;
          queue();
          return;
        }
      }).observe(document.body, { childList: true, subtree: true });
    }
    root.addEventListener("kulibert-lang", function () { scan(); });
  }

  if (document.body) boot();
  else document.addEventListener("DOMContentLoaded", boot);

  root.HubMenu = { links: LINKS, scan: scan };
})(typeof window !== "undefined" ? window : globalThis);
