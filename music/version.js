window.MU_VERSION = "MU 2.36.66";
(function () {
  var v = window.MU_VERSION;
  document.title = document.title.indexOf("Teacher") >= 0
    ? "DJ Berty — Teacher · " + v
    : "DJ Berty · " + v;
  if (document.getElementById("transport") && !document.querySelector("script[src*='kulibert-bar.js']")) {
    document.write('<script src="/shared/kulibert-bar.js?v=mu23666" data-app="musiclab" data-name="DJ Berty" data-rtl="1" data-menu="#menu-btn" data-version="' + v + '"><\/script>');
  }
  var bar = document.querySelector("script[src*='kulibert-bar.js']");
  if (bar) bar.setAttribute("data-version", v);
  function paint() {
    var chip = document.getElementById("chip");
    if (chip) chip.textContent = v;
    var foot = document.getElementById("foot-chip");
    if (foot) foot.textContent = v;
    var teacher = document.getElementById("teacher-chip");
    if (teacher) teacher.textContent = "DJ Berty · " + v;
    document.querySelectorAll(".kb-plate").forEach(function (plate) {
      plate.setAttribute("data-ver", v);
      if ((plate.textContent || "").indexOf(v) < 0) plate.textContent = "DJ Berty · " + v;
    });
    var chip = document.getElementById("mu-chip");
    if (chip) chip.textContent = v;
  }
  paint();
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", paint);
})();
(function () {
  var errors = 0;
  var oldErr = window.onerror;
  window.onerror = function () {
    errors++;
    if (typeof oldErr === "function") return oldErr.apply(this, arguments);
  };
  window.addEventListener("unhandledrejection", function () { errors++; });
  function shown(el) {
    if (!el) return false;
    var cs = getComputedStyle(el);
    if (cs.display === "none") return false;
    var r = el.getBoundingClientRect();
    return r.width > 8 && r.height > 8 && r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth;
  }
  function measure() {
    var tiles = [].slice.call(document.querySelectorAll("#dock-left button[data-tab]")).filter(shown);
    var withWords = tiles.filter(function (el) {
      var span = el.querySelector("span");
      if (!span || !shown(span)) return false;
      return (span.textContent || "").trim().length > 0;
    });
    var performs = [].slice.call(document.querySelectorAll("[data-mu='perform']")).filter(shown);
    var chip = document.getElementById("mu-chip");
    window.__DJ_PROOF = {
      version: window.MU_VERSION,
      w: innerWidth,
      h: innerHeight,
      navTiles: tiles.length,
      navTilesWithWords: withWords.length,
      performCount: performs.length,
      chipVisible: shown(chip),
      errors: errors
    };
    var box = document.getElementById("dj-proof");
    var pre = box && box.querySelector("pre");
    if (pre) pre.textContent = JSON.stringify(window.__DJ_PROOF, null, 2);
  }
  window.__djMeasure = measure;
  window.addEventListener("resize", measure);
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", measure);
  else measure();
  var proof = false;
  try { proof = new URLSearchParams(location.search).get("proof") === "1"; } catch (err) {}
  if (!proof) return;
  var shortSide = false;
  try { shortSide = window.matchMedia("(orientation: landscape) and (max-height: 500px)").matches; } catch (err2) {}
  if (!shortSide) document.documentElement.classList.add("dj-proof-open");
  document.documentElement.classList.add("dj-proof-on");
  function mount() {
    if (document.getElementById("dj-proof")) return;
    var box = document.createElement("div");
    box.id = "dj-proof";
    box.className = shortSide ? "" : "is-open";
    box.setAttribute("role", "dialog");
    box.innerHTML = '<div class="dj-proof-bar"><button type="button" id="dj-proof-toggle" aria-expanded="true">▾ Hide</button><button type="button" id="dj-proof-x" aria-label="Close">Close ✕</button></div><pre></pre>';
    var pre = box.querySelector("pre");
    var toggle = box.querySelector("#dj-proof-toggle");
    function setOpen(open) {
      box.classList.toggle("is-open", open);
      pre.hidden = !open;
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.textContent = open ? "▾ Hide" : "▸ Show";
      document.documentElement.classList.toggle("dj-proof-open", open);
    }
    if (shortSide) setOpen(false);
    toggle.addEventListener("click", function () { setOpen(!box.classList.contains("is-open")); });
    box.querySelector("#dj-proof-x").addEventListener("click", function () {
      box.hidden = true;
      document.documentElement.classList.remove("dj-proof-on", "dj-proof-open");
    });
    document.body.appendChild(box);
    measure();
  }
  if (document.body) mount();
  else document.addEventListener("DOMContentLoaded", mount);
})();