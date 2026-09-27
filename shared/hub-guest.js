/* Tech Room guest. Does nothing when the app is the top window.
   Inside the Hub frame: hide the duplicate brand, and send Home or
   another app back to the shell instead of loading the Hub again. */
(function () {
  if (window.parent === window) return;
  var origin = location.origin;
  document.documentElement.classList.add("hub-guest");

  var style = document.createElement("style");
  style.textContent = [
    "html.hub-guest header.top .brand{display:none !important}",
    "html.hub-guest header.top:not(:has(.top-actions button, .top-actions a)){display:none !important}"
  ].join("");
  document.head.appendChild(style);

  function pathOf(href) {
    try {
      var url = new URL(href, location.href);
      if (url.origin !== origin) return null;
      return url.pathname + url.search + url.hash;
    } catch (e) {
      return null;
    }
  }

  function bare(path) {
    return String(path || "").split("?")[0].split("#")[0].replace(/\/$/, "") || "/";
  }

  document.addEventListener("click", function (event) {
    if (event.defaultPrevented || event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    var node = event.target;
    if (!node || !node.closest) return;
    var link = node.closest("a");
    if (!link) return;
    var href = link.getAttribute("href");
    if (!href || href.charAt(0) === "#") return;
    var path = pathOf(href);
    if (path == null) return;
    var next = bare(path);
    if (next === "/" || next === "/index.html") {
      event.preventDefault();
      window.parent.postMessage({ type: "tech-room-home" }, origin);
      return;
    }
    if (next === "/staff") return;
    if (next === bare(location.pathname)) return;
    event.preventDefault();
    window.parent.postMessage({ type: "tech-room-open", href: path }, origin);
  }, true);

  window.addEventListener("message", function (ev) {
    if (ev.origin !== origin || !ev.data || ev.data.type !== "tech-room-hello") return;
    window.__hubHello = {
      embed: true,
      announce: String(ev.data.announce || "").replace(/\s+/g, " ").trim().slice(0, 140)
    };
  });
})();
