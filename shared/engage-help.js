// First Clear Rescue + Prove Theater helpers (SpanCraft / Spire Lab).
// Caption-safe · mute-safe · Chromebook mid. No FEA / party-fail.

export function quietMode() {
  return (
    window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
    document.documentElement.classList.contains("calm-clear")
  );
}

export function quietToast(text) {
  let el = document.getElementById("quiet-toast");
  if (!el) {
    el = document.createElement("p");
    el.id = "quiet-toast";
    el.className = "quiet-toast";
    el.setAttribute("role", "status");
    el.setAttribute("aria-live", "polite");
    const stage = document.querySelector(".stage");
    (stage || document.body).appendChild(el);
  }
  el.textContent = text;
  el.hidden = false;
  el.removeAttribute("hidden");
}

export function hideQuietToast() {
  const el = document.getElementById("quiet-toast");
  if (!el) return;
  el.hidden = true;
  el.setAttribute("hidden", "");
}

export function readFlag(key) {
  try {
    return localStorage.getItem(key) === "1";
  } catch {
    return false;
  }
}

export function writeFlag(key, on) {
  try {
    if (on) localStorage.setItem(key, "1");
    else localStorage.removeItem(key);
  } catch {
    /* private mode */
  }
}

export function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function writeJson(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    /* private mode */
  }
}

/** Prove Theater ≤2s caption build-up, then callback. Quiet = skip motion. */
export function runProveTheater(opts) {
  const { setStatus, lines, onDone, onBeat, totalMs = 1600 } = opts;
  const quiet = quietMode();
  if (quiet || !lines || !lines.length) {
    onDone();
    return { cancel() {} };
  }
  let cancelled = false;
  const budget = Math.min(2000, totalMs || 1600);
  let step = Math.floor(budget / lines.length);
  if (step * lines.length > 2000) step = Math.floor(2000 / lines.length);
  if (step < 200) step = 200;
  let i = 0;
  const paint = (line) => {
    setStatus(line[0], line[1], "");
    if (onBeat) onBeat(line);
  };
  paint(lines[0]);
  const timer = window.setInterval(() => {
    if (cancelled) return;
    i += 1;
    if (i >= lines.length) {
      window.clearInterval(timer);
      onDone();
      return;
    }
    paint(lines[i]);
  }, step);
  return {
    cancel() {
      cancelled = true;
      window.clearInterval(timer);
    },
  };
}

export function mountHelpOverlay(cfg) {
  const {
    title,
    steps,
    version,
    onReplayIntro,
    onCalmToggle,
  } = cfg;
  let root = document.getElementById("help-overlay");
  if (!root) {
    root = document.createElement("div");
    root.id = "help-overlay";
    root.className = "help-overlay";
    root.hidden = true;
    root.setAttribute("role", "dialog");
    root.setAttribute("aria-modal", "true");
    root.setAttribute("aria-labelledby", "help-title");
    document.body.appendChild(root);
  }
  const calmOn = document.documentElement.classList.contains("calm-clear");
  root.innerHTML =
    '<div class="help-card">' +
    '<header><h2 id="help-title">' +
    title +
    "</h2><p class=\"help-rev\">" +
    (version || "") +
    "</p></header>" +
    (cfg.note ? '<p class="help-note">' + cfg.note + "</p>" : "") +
    "<ol class=\"help-steps\">" +
    steps.map((s) => "<li>" + s + "</li>").join("") +
    "</ol>" +
    '<div class="help-actions">' +
    '<button type="button" class="fat" data-help="close">Got it</button>' +
    (onReplayIntro
      ? '<button type="button" data-help="replay">Replay intro</button>'
      : "") +
    '<button type="button" data-help="calm" aria-pressed="' +
    (calmOn ? "true" : "false") +
    '">' +
    (calmOn ? "Calm Clear on" : "Calm Clear") +
    "</button>" +
    "</div></div>";

  function close() {
    root.hidden = true;
    root.setAttribute("hidden", "");
  }
  function open() {
    root.hidden = false;
    root.removeAttribute("hidden");
    const btn = root.querySelector("[data-help=close]");
    if (btn) btn.focus();
  }
  root.onclick = (ev) => {
    if (ev.target === root) close();
  };
  root.querySelectorAll("[data-help]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const act = btn.getAttribute("data-help");
      if (act === "close") close();
      if (act === "replay" && onReplayIntro) {
        close();
        onReplayIntro();
      }
      if (act === "calm") {
        const next = !document.documentElement.classList.contains("calm-clear");
        document.documentElement.classList.toggle("calm-clear", next);
        writeFlag(cfg.calmKey || "kulibert-calm-clear", next);
        btn.setAttribute("aria-pressed", next ? "true" : "false");
        btn.textContent = next ? "Calm Clear on" : "Calm Clear";
        if (onCalmToggle) onCalmToggle(next);
      }
    });
  });
  return { open, close, root };
}

export function wireEdgeHelp(edgeBtn, edgeMenu, openHelp) {
  if (!edgeBtn || !edgeMenu) return;
  edgeBtn.textContent = "Help";
  edgeBtn.setAttribute("aria-label", "Help");
  // Keep Room + class links; prepend Help how-to
  let how = edgeMenu.querySelector("[data-edge=howto]");
  if (!how) {
    how = document.createElement("button");
    how.type = "button";
    how.setAttribute("data-edge", "howto");
    how.textContent = "How to play";
    edgeMenu.insertBefore(how, edgeMenu.firstChild);
  }
  how.onclick = () => {
    edgeMenu.hidden = true;
    edgeBtn.setAttribute("aria-expanded", "false");
    openHelp();
  };
}
