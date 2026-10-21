/* Staff-locked test gate. ?test=1 alone does nothing.
   On only when the desk switch is on, this device is unlocked, and this tab asked. */
(function (root) {
  var PACK = "kulibert-test-pack";
  var TAB = "kulibert-test-tab";
  var API = "https://tw.kulibert.net/api/door-links";
  var chip = null;

  function asked() {
    try {
      if (new URLSearchParams(location.search).get("test") === "1") return true;
    } catch (e) {}
    try { return sessionStorage.getItem(TAB) === "1"; } catch (e2) { return false; }
  }

  function packOn() {
    try {
      var raw = JSON.parse(sessionStorage.getItem(PACK) || "null");
      return !!(raw && raw.testMode === true);
    } catch (e) { return false; }
  }

  function staff() {
    try { return !!(root.KulibertStaffAuth && root.KulibertStaffAuth.isUnlocked && root.KulibertStaffAuth.isUnlocked()); }
    catch (e) { return false; }
  }

  function deskOn() {
    return packOn();
  }

  function on() {
    return packOn() && staff() && asked();
  }

  function paint() {
    if (!on()) {
      if (chip && chip.parentNode) chip.parentNode.removeChild(chip);
      return;
    }
    if (!chip) {
      chip = document.createElement("div");
      chip.id = "kw-test-chip";
      chip.setAttribute("role", "status");
      chip.setAttribute("aria-label", "Test mode on");
      chip.textContent = "⚑ TEST";
      chip.style.cssText = "position:fixed;top:8px;right:8px;z-index:90;min-width:44px;min-height:44px;display:inline-flex;align-items:center;justify-content:center;padding:0 .7rem;border-radius:999px;border:1px solid #ffe14a;background:#1a120c;color:#ffe14a;font:750 .9rem/1 Outfit,system-ui,sans-serif";
    }
    if (!chip.parentNode && document.body) document.body.appendChild(chip);
  }

  function pull() {
    return fetch(API, { credentials: "omit" }).then(function (res) {
      return res.ok ? res.json() : null;
    }).then(function (pack) {
      try { sessionStorage.setItem(PACK, JSON.stringify({ testMode: !!(pack && pack.testMode === true) })); } catch (e) {}
      paint();
      return on();
    }).catch(function () { paint(); return on(); });
  }

  function arm() {
    try { sessionStorage.setItem(TAB, "1"); } catch (e) {}
    paint();
    return on();
  }

  function disarm() {
    try { sessionStorage.removeItem(TAB); } catch (e) {}
    paint();
    return on();
  }

  root.KulibertTest = { on: on, deskOn: deskOn, pull: pull, arm: arm, disarm: disarm, paint: paint };
  pull();
})(window);
