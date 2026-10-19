window.MU_VERSION = "MU 2.36.2";
(function () {
  var v = window.MU_VERSION;
  document.title = document.title.indexOf("Teacher") >= 0
    ? "DJ Berty — Teacher · " + v
    : "DJ Berty · " + v;
  if (document.getElementById("transport") && !document.querySelector("script[src*='kulibert-bar.js']")) {
    document.write('<script src="/shared/kulibert-bar.js?v=2026-10-05-plate" data-app="musiclab" data-name="DJ Berty" data-rtl="1" data-menu="#menu-btn" data-version="' + v + '"><\/script>');
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
  }
  paint();
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", paint);
})();