/* Hub staff gate for The Tech Room.
   Compare SHA-256 hex of the UTF-8 password (no salt) to the embedded digest.
   The TechWorks desk key is a different lock and must not set this flag. */
(function (root) {
  var HASH = "abc6527e3cdc04042defe8da629326e01441d61c356f939c1a3236a967cffbf1";
  var FLAG = "tech-room-hub-staff";
  var WRONG = "Wrong password — try again";
  var memory = false;

  function sameHex(a, b) {
    if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) return false;
    var diff = 0;
    var i;
    for (i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
    return diff === 0;
  }

  function sha256Hex(text) {
    var bytes = new TextEncoder().encode(text == null ? "" : String(text));
    return crypto.subtle.digest("SHA-256", bytes).then(function (buf) {
      return Array.from(new Uint8Array(buf)).map(function (x) {
        return x.toString(16).padStart(2, "0");
      }).join("");
    });
  }

  function readFlag() {
    try { if (localStorage.getItem(FLAG) === "1") return true; } catch (e) {}
    try { if (sessionStorage.getItem(FLAG) === "1") return true; } catch (e) {}
    return false;
  }

  function writeFlag() {
    memory = true;
    try { localStorage.setItem(FLAG, "1"); } catch (e) {}
    try { sessionStorage.setItem(FLAG, "1"); } catch (e) {}
  }

  function isUnlocked() {
    return memory || readFlag();
  }

  function signOut() {
    memory = false;
    try { localStorage.removeItem(FLAG); } catch (e) {}
    try { sessionStorage.removeItem(FLAG); } catch (e) {}
  }

  function tryPassword(password) {
    return sha256Hex(password == null ? "" : String(password)).then(function (digest) {
      if (!sameHex(digest, HASH)) return false;
      writeFlag();
      return true;
    });
  }

  function mount(opts) {
    var form = opts.form;
    var input = opts.input;
    var toggle = opts.toggle;
    var error = opts.error;
    var busy = false;
    if (!form || !input) return;

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      if (busy) return;
      busy = true;
      tryPassword(input.value).then(function (ok) {
        busy = false;
        if (!ok) {
          if (error) error.textContent = WRONG;
          input.setAttribute("aria-invalid", "true");
          input.focus();
          return;
        }
        input.value = "";
        if (error) error.textContent = "";
        input.removeAttribute("aria-invalid");
        if (typeof opts.onUnlock === "function") opts.onUnlock();
      }, function () {
        busy = false;
        if (error) error.textContent = WRONG;
        input.focus();
      });
    });

    input.addEventListener("input", function () {
      if (error && error.textContent) error.textContent = "";
      input.removeAttribute("aria-invalid");
    });

    if (toggle) {
      toggle.addEventListener("click", function () {
        var show = input.type === "password";
        input.type = show ? "text" : "password";
        toggle.textContent = show ? "Hide" : "Show";
        toggle.setAttribute("aria-pressed", show ? "true" : "false");
        input.focus();
      });
    }
  }

  var api = {
    FLAG: FLAG,
    WRONG: WRONG,
    isUnlocked: isUnlocked,
    signOut: signOut,
    tryPassword: tryPassword,
    mount: mount,
    sameHex: sameHex,
    sha256Hex: sha256Hex
  };
  root.HubStaffAuth = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
