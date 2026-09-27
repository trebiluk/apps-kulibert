/* When a door is open inside The Tech Room, keep the address bar on that door. */
(function () {
  if (window.parent === window) return;
  function tell(href, replace) {
    try {
      window.parent.postMessage({ type: "tech-room-open", href: href, replace: !!replace }, window.location.origin);
    } catch (err) { /* the door still works on its own */ }
  }
  tell(window.location.pathname + window.location.search + window.location.hash, true);
  document.addEventListener("click", function (event) {
    var node = event.target;
    if (!node || !node.closest) return;
    var link = node.closest("a[href]");
    if (!link || link.getAttribute("target") === "_blank") return;
    var url;
    try { url = new URL(link.getAttribute("href"), window.location.href); } catch (err) { return; }
    if (url.origin !== window.location.origin) return;
    if (url.pathname === "/" || url.pathname === "/index.html") {
      event.preventDefault();
      try { window.parent.postMessage({ type: "tech-room-home" }, window.location.origin); } catch (err) {}
      return;
    }
    if (url.pathname.indexOf("/staff") === 0) return;
    event.preventDefault();
    tell(url.pathname + url.search + url.hash, false);
  }, true);
})();
