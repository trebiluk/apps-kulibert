/* Collapse the 271px Klecks panel when it would leave a sliver of canvas.
   The panel's own toggle still opens it; this only runs until the painter chooses. */
(function () {
  var userChose = false;
  var fromUs = false;
  var armed = false;

  function panel() {
    return document.querySelector(".kl-toolspace");
  }
  function toggle() {
    return document.querySelector(".kl-toolspace-toggle");
  }
  function eatingCanvas() {
    var el = panel();
    if (!el) return false;
    var box = el.getBoundingClientRect();
    if (box.width < 80) return false;
    if (getComputedStyle(el).display === "none") return false;
    var room = window.innerWidth - box.width;
    return room < 180 || box.width > window.innerWidth * 0.45;
  }
  function arm() {
    var btn = toggle();
    if (!btn || armed) return !!btn;
    armed = true;
    btn.addEventListener("click", function () {
      if (!fromUs) userChose = true;
    }, true);
    return true;
  }
  function maybeCollapse() {
    if (userChose) return;
    if (!arm()) return;
    if (!eatingCanvas()) return;
    fromUs = true;
    toggle().click();
    fromUs = false;
  }
  var timer = setInterval(function () {
    maybeCollapse();
  }, 250);
  window.addEventListener("resize", maybeCollapse);
  setTimeout(function () { clearInterval(timer); }, 12000);

  function labelTools() {
    var nodes = document.querySelectorAll(".toolspace-row-button");
    for (var i = 0; i < nodes.length; i++) {
      var btn = nodes[i];
      if (btn.querySelector(".ds-name")) continue;
      var name = btn.getAttribute("title") || btn.getAttribute("aria-label") || "";
      name = name.replace(/\s*\(.*$/, "").trim();
      if (!name || name.length > 18) continue;
      if ((btn.textContent || "").replace(/\s+/g, "")) continue;
      var s = document.createElement("span");
      s.className = "ds-name";
      s.textContent = name;
      btn.appendChild(s);
    }
  }
  var labelTimer = setInterval(labelTools, 700);
  setTimeout(function () { clearInterval(labelTimer); }, 15000);
})();
