/* One live version. Title, plates, and chips read this. Do not copy it elsewhere. */
window.MU_VERSION = "MU 2.35.16";
(function () {
  var v = window.MU_VERSION;
  document.title = document.title.indexOf("Teacher") >= 0
    ? "DJ Berty — Teacher · " + v
    : "DJ Berty · " + v;
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
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", paint);
  else paint();
})();
