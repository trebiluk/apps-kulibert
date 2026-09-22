import { cellsOf, HOLD_SECONDS, judgeSpire, spireSpec } from "./logic.js";

const KEY = "kulibert-spire-lab-mvp";
const KINDS = ["block", "column"];

const COACH = {
  empty: ["Ready", "Stack blocks up to the stand line. Then press Test."],
  float: ["Build", "Set each part on the ground or on another part."],
  short: ["Build", "Stack higher, up to the stand line."],
  tip: ["Build", "Make the base wider so a tall stack will stand."],
  pass: ["Ready", "Looks ready. Press Test. It needs to stand for 5 seconds."],
};

const PROVE = {
  empty: ["Fail", "Too short. Stack up to the line."],
  short: ["Fail", "Too short. Stack up to the line."],
  float: ["Fail", "A block is not sitting on anything."],
  tip: ["Fail", "It tipped. Make the base wider."],
  pass: ["Pass", "It stood for 5 seconds."],
};

const canvas = document.getElementById("board");
const ctx = canvas.getContext("2d");
const caption = document.getElementById("caption");
const capWord = document.getElementById("cap-word");
const capText = document.getElementById("cap-text");
const kindsEl = document.getElementById("kinds");
const assistBtn = document.getElementById("assist");
const retryBtn = document.getElementById("retry");
const kindButtons = [...kindsEl.querySelectorAll("button")];
const toolButtons = {
  add: document.getElementById("tool-add"),
  move: document.getElementById("tool-move"),
  delete: document.getElementById("tool-delete"),
};
const testBtn = document.getElementById("tool-test");

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const state = {
  assist: false,
  tool: "add",
  kind: "block",
  parts: [],
  cursor: 0,
  hover: null,
  drag: null,
  phase: "idle",
  verdict: null,
  animU: 0,
  holdN: 0,
};

let nextId = 1;
let cssW = 0;
let cssH = 0;
let animToken = 0;
let holdTimer = 0;

function spec() {
  return spireSpec(state.assist);
}

function setStatus(word, text, tone) {
  capWord.textContent = word;
  capText.textContent = text;
  caption.className = "caption" + (tone ? " " + tone : "");
  caption.setAttribute("aria-live", tone === "pass" || tone === "fail" ? "assertive" : "polite");
}

function showCoach() {
  const reason = judgeSpire(spec(), state.parts).reason;
  const line = COACH[reason] || COACH.empty;
  setStatus(line[0], line[1], "");
}

function busy() {
  return state.phase === "hold" || state.phase === "drop";
}

function syncControls() {
  const lock = busy();
  for (const btn of Object.values(toolButtons)) btn.disabled = lock;
  testBtn.disabled = lock;
  for (const btn of kindButtons) btn.disabled = lock;
  for (const [name, btn] of Object.entries(toolButtons)) {
    btn.setAttribute("aria-pressed", name === state.tool ? "true" : "false");
  }
  for (const btn of kindButtons) {
    btn.setAttribute("aria-checked", btn.dataset.kind === state.kind ? "true" : "false");
  }
  kindsEl.hidden = state.tool !== "add";
  assistBtn.setAttribute("aria-pressed", state.assist ? "true" : "false");
  document.body.dataset.phase = state.phase;
}

function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify({
      v: 1,
      assist: state.assist,
      tool: state.tool,
      kind: state.kind,
      parts: state.parts.map((p) => ({ c: p.c, r: p.r, kind: p.kind })),
    }));
  } catch {
    /* private mode or full storage — play continues */
  }
}

function occupied(parts, c, r, ignoreId) {
  return parts.some((p) => p.id !== ignoreId && cellsOf(p).some(([cc, rr]) => cc === c && rr === r));
}

function landingRow(specNow, kind, c, parts, ignoreId) {
  const span = kind === "column" ? 2 : 1;
  if (c < 0 || c >= specNow.cols) return -1;
  for (let r = 0; r + span <= specNow.rows; r++) {
    let blocked = false;
    for (let i = 0; i < span; i++) {
      if (occupied(parts, c, r + i, ignoreId)) blocked = true;
    }
    if (blocked) continue;
    const supported = r === 0 || occupied(parts, c, r - 1, ignoreId);
    if (supported) return r;
  }
  return -1;
}

function topPart(col) {
  let best = null;
  let bestTop = -1;
  for (const p of state.parts) {
    if (p.c !== col) continue;
    const top = p.kind === "column" ? p.r + 1 : p.r;
    if (top >= bestTop) {
      bestTop = top;
      best = p;
    }
  }
  return best;
}

function fits(specNow, part, parts) {
  if (!KINDS.includes(part.kind)) return false;
  if (!Number.isInteger(part.c) || !Number.isInteger(part.r)) return false;
  const span = part.kind === "column" ? 2 : 1;
  if (part.c < 0 || part.c >= specNow.cols || part.r < 0 || part.r + span > specNow.rows) return false;
  for (let i = 0; i < span; i++) {
    if (occupied(parts, part.c, part.r + i, null)) return false;
  }
  return true;
}

function sanitize(parts) {
  const specNow = spec();
  const kept = [];
  for (const p of parts || []) {
    const part = { id: nextId++, c: p.c, r: p.r, kind: p.kind };
    if (!fits(specNow, part, kept)) continue;
    kept.push(part);
  }
  return kept;
}

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return false;
    const data = JSON.parse(raw);
    if (!data || data.v !== 1) return false;
    state.assist = !!data.assist;
    state.tool = data.tool === "move" || data.tool === "delete" ? data.tool : "add";
    state.kind = KINDS.includes(data.kind) ? data.kind : "block";
    state.parts = sanitize(data.parts);
    state.cursor = Math.min(state.cursor, spec().cols - 1);
    return state.parts.length > 0;
  } catch {
    return false;
  }
}

function cancelAnim() {
  animToken += 1;
}

function cancelHold() {
  clearInterval(holdTimer);
  holdTimer = 0;
}

function wake() {
  if (state.phase === "pass" || state.phase === "fail") {
    state.phase = "idle";
    state.verdict = null;
    state.animU = 0;
    state.holdN = 0;
  }
}

function layout() {
  const s = spec();
  const marginX = 24;
  const marginTop = 56;
  const marginBot = 22;
  const fitW = Math.floor((cssW - marginX * 2) / s.cols);
  const fitH = Math.floor((cssH - marginTop - marginBot) / s.rows);
  const cell = Math.max(8, Math.min(fitW, fitH));
  const gridW = cell * s.cols;
  const gridH = cell * s.rows;
  const x0 = Math.round((cssW - gridW) / 2);
  const extra = Math.max(0, cssH - marginTop - marginBot - gridH);
  const groundY = Math.round(cssH - marginBot - extra * 0.35);
  return { cell, x0, groundY };
}

function partRect(g, c, r, span) {
  return {
    x: g.x0 + c * g.cell,
    y: g.groundY - (r + span) * g.cell,
    w: g.cell,
    h: g.cell * span,
  };
}

function roundRect(x, y, w, h, r) {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}

function drawPart(kind, box, alpha) {
  ctx.save();
  ctx.globalAlpha = alpha;
  const inset = kind === "column" ? 0.2 : 0.1;
  const x = box.x + box.w * inset;
  const w = box.w * (1 - inset * 2);
  const y = box.y + 4;
  const h = box.h - 8;
  roundRect(x, y, w, h, 10);
  ctx.fillStyle = kind === "column" ? "#e9d5ff" : "#c4b5fd";
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = kind === "column" ? "#7c6bb5" : "#8b7fd0";
  ctx.stroke();
  ctx.restore();
}

function paintBanner() {
  let word = "";
  if (state.phase === "hold") word = "Holding " + state.holdN + " / " + HOLD_SECONDS;
  else if (state.phase === "pass") word = "Pass";
  else if (state.phase === "fail") word = "Fail";
  else if (state.phase === "drop") word = "Test";
  if (!word) return;
  ctx.font = "800 28px Outfit, system-ui, sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillStyle = word === "Pass" ? "#5eead4" : word === "Fail" ? "#ffb4c0" : "#e8f7ff";
  ctx.fillText(word, 16, 28);
}

function draw() {
  if (cssW < 2 || cssH < 2) return;
  const s = spec();
  const g = layout();
  canvas.dataset.x0 = String(g.x0);
  canvas.dataset.ground = String(g.groundY);
  canvas.dataset.cell = String(g.cell);
  canvas.dataset.cols = String(s.cols);
  canvas.dataset.goal = String(s.goal);

  ctx.clearRect(0, 0, cssW, cssH);
  ctx.fillStyle = "#050814";
  ctx.fillRect(0, 0, cssW, cssH);

  const lineY = g.groundY - s.goal * g.cell;
  ctx.save();
  ctx.setLineDash([8, 8]);
  ctx.strokeStyle = "#c4b5fd";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(g.x0 - 8, lineY);
  ctx.lineTo(g.x0 + s.cols * g.cell + 8, lineY);
  ctx.stroke();
  ctx.restore();
  ctx.fillStyle = "#c4b5fd";
  ctx.font = "700 16px Outfit, system-ui, sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillText("Stand line", g.x0, lineY - 8);

  roundRect(g.x0 - 12, g.groundY, s.cols * g.cell + 24, Math.max(18, cssH - g.groundY - 8), 8);
  ctx.fillStyle = "#10203f";
  ctx.fill();
  ctx.strokeStyle = "#f8fafc";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(g.x0 - 12, g.groundY);
  ctx.lineTo(g.x0 + s.cols * g.cell + 12, g.groundY);
  ctx.stroke();

  const tip = state.verdict === "tip" && (state.phase === "fail" || state.phase === "drop");
  const shift = tip ? (reduceMotion ? 1 : state.animU) * Math.min(36, g.cell * 0.45) : 0;

  const draggingId = state.drag && state.drag.id ? state.drag.id : null;
  for (const p of state.parts) {
    if (p.id === draggingId && state.hover !== null && state.hover !== p.c) continue;
    const span = p.kind === "column" ? 2 : 1;
    const box = partRect(g, p.c, p.r, span);
    ctx.save();
    if (shift) {
      ctx.translate(shift, shift * 0.65);
    }
    drawPart(p.kind, box, 1);
    ctx.restore();
  }

  if (!busy() && state.hover !== null && state.tool === "add") {
    const row = landingRow(s, state.kind, state.hover, state.parts, null);
    if (row >= 0) {
      const span = state.kind === "column" ? 2 : 1;
      drawPart(state.kind, partRect(g, state.hover, row, span), 0.45);
    }
  } else if (!busy() && state.drag && state.drag.id && state.hover !== null) {
    const part = state.parts.find((p) => p.id === state.drag.id);
    if (part) {
      const row = landingRow(s, part.kind, state.hover, state.parts, part.id);
      if (row >= 0) {
        const span = part.kind === "column" ? 2 : 1;
        drawPart(part.kind, partRect(g, state.hover, row, span), 0.55);
      }
    }
  } else if (!busy() && state.hover !== null) {
    const x = g.x0 + state.hover * g.cell;
    ctx.strokeStyle = "#c4b5fd";
    ctx.lineWidth = 2;
    roundRect(x + 3, g.groundY - s.rows * g.cell, g.cell - 6, s.rows * g.cell, 8);
    ctx.stroke();
  }

  if (document.activeElement === canvas && canvas.matches(":focus-visible")) {
    const x = g.x0 + state.cursor * g.cell;
    ctx.strokeStyle = "#e8f7ff";
    ctx.lineWidth = 3;
    roundRect(x + 2, g.groundY - s.rows * g.cell, g.cell - 4, s.rows * g.cell, 8);
    ctx.stroke();
  }

  paintBanner();
}

function resize() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  if (w < 2 || h < 2) return;
  cssW = w;
  cssH = h;
  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  draw();
}

function pickCol(x) {
  const s = spec();
  const g = layout();
  const slop = state.assist ? g.cell * 0.45 : 0;
  let best = null;
  let bestD = Infinity;
  for (let c = 0; c < s.cols; c++) {
    const left = g.x0 + c * g.cell;
    if (x < left - slop || x >= left + g.cell + slop) continue;
    const d = Math.abs(x - (left + g.cell / 2));
    if (d < bestD) {
      bestD = d;
      best = c;
    }
  }
  return best;
}

function eventX(ev) {
  const rect = canvas.getBoundingClientRect();
  return ev.clientX - rect.left;
}

function placeCol(col) {
  const row = landingRow(spec(), state.kind, col, state.parts, null);
  if (row < 0) {
    setStatus("Look", "That stack is full.", "");
    return;
  }
  wake();
  state.parts.push({ id: nextId++, c: col, r: row, kind: state.kind });
  save();
  showCoach();
  draw();
}

function deleteCol(col) {
  const part = topPart(col);
  if (!part) {
    setStatus("Look", "Nothing there to remove.", "");
    return;
  }
  wake();
  state.parts = state.parts.filter((p) => p.id !== part.id);
  save();
  showCoach();
  draw();
}

function movePart(id, col) {
  const part = state.parts.find((p) => p.id === id);
  if (!part) return;
  const row = landingRow(spec(), part.kind, col, state.parts, id);
  if (row < 0) {
    setStatus("Look", "That stack is full.", "");
    draw();
    return;
  }
  if (part.c === col && part.r === row) {
    showCoach();
    draw();
    return;
  }
  wake();
  part.c = col;
  part.r = row;
  save();
  showCoach();
  draw();
}

function actCol(col) {
  if (busy() || col === null || col === undefined) return;
  state.cursor = col;
  if (state.tool === "add") placeCol(col);
  else if (state.tool === "delete") deleteCol(col);
  else {
    if (!state.drag) {
      const part = topPart(col);
      if (!part) {
        setStatus("Look", "Tap a part, then a new column.", "");
        draw();
        return;
      }
      state.drag = { id: part.id, fromKey: true };
      setStatus("Move", "Pick a new column.", "");
      draw();
      return;
    }
    const id = state.drag.id;
    state.drag = null;
    movePart(id, col);
  }
}

function animate(ms, done) {
  const token = ++animToken;
  const t0 = performance.now();
  const step = (now) => {
    if (token !== animToken) return;
    const u = ms <= 0 ? 1 : Math.min(1, (now - t0) / ms);
    state.animU = 1 - (1 - u) * (1 - u);
    draw();
    if (u < 1) requestAnimationFrame(step);
    else done();
  };
  requestAnimationFrame(step);
}

function finishFail(reason) {
  const prove = PROVE[reason];
  state.verdict = reason;
  state.phase = "drop";
  state.animU = 0;
  syncControls();
  setStatus(prove[0], prove[1], "fail");
  animate(reduceMotion ? 0 : 500, () => {
    state.phase = "fail";
    state.animU = 1;
    syncControls();
    draw();
  });
}

function startHold() {
  cancelHold();
  state.phase = "hold";
  state.verdict = "pass";
  state.holdN = 1;
  syncControls();
  setStatus("Holding", "1 of " + HOLD_SECONDS + " seconds.", "");
  draw();
  holdTimer = setInterval(() => {
    state.holdN += 1;
    if (state.holdN > HOLD_SECONDS) {
      cancelHold();
      state.phase = "pass";
      state.holdN = HOLD_SECONDS;
      syncControls();
      setStatus("Pass", "It stood for " + HOLD_SECONDS + " seconds.", "pass");
      draw();
      return;
    }
    setStatus("Holding", state.holdN + " of " + HOLD_SECONDS + " seconds.", "");
    draw();
  }, 1000);
}

function startTest() {
  if (busy()) return;
  state.drag = null;
  const verdict = judgeSpire(spec(), state.parts);
  if (!verdict.ok) {
    finishFail(verdict.reason);
    return;
  }
  startHold();
}

function retry() {
  cancelAnim();
  cancelHold();
  state.drag = null;
  state.phase = "idle";
  state.verdict = null;
  state.animU = 0;
  state.holdN = 0;
  syncControls();
  if (state.parts.length) setStatus("Ready", "Test cleared. Your build is still here.", "");
  else showCoach();
  draw();
}

function setTool(tool) {
  if (busy()) return;
  state.tool = tool;
  state.drag = null;
  syncControls();
  save();
  draw();
}

function setKind(kind) {
  if (busy()) return;
  state.kind = kind;
  state.tool = "add";
  syncControls();
  save();
  draw();
}

function toggleAssist() {
  cancelAnim();
  cancelHold();
  state.drag = null;
  state.assist = !state.assist;
  state.phase = "idle";
  state.verdict = null;
  state.animU = 0;
  state.holdN = 0;
  const before = state.parts.length;
  state.parts = sanitize(state.parts.map((p) => ({ c: p.c, r: p.r, kind: p.kind })));
  const dropped = before - state.parts.length;
  state.cursor = Math.min(state.cursor, spec().cols - 1);
  syncControls();
  save();
  const lead = state.assist
    ? "Assist on. Fewer parts and a wider snap."
    : "Assist off. Full tower.";
  const extra = dropped ? " Some parts came off." : "";
  setStatus(state.assist ? "Assist" : "Ready", lead + extra, "");
  draw();
}

canvas.addEventListener("pointerdown", (ev) => {
  if (busy()) return;
  canvas.focus();
  const col = pickCol(eventX(ev));
  if (col === null) return;
  state.cursor = col;
  state.hover = col;
  if (state.tool === "move") {
    const part = topPart(col);
    if (part) {
      state.drag = { id: part.id, pointerId: ev.pointerId };
      canvas.setPointerCapture(ev.pointerId);
      draw();
      return;
    }
  }
  canvas.setPointerCapture(ev.pointerId);
  state.drag = state.drag && state.drag.fromKey ? state.drag : { pointerId: ev.pointerId };
});

canvas.addEventListener("pointermove", (ev) => {
  const col = pickCol(eventX(ev));
  if (col === state.hover && !state.drag) return;
  state.hover = col;
  draw();
});

canvas.addEventListener("pointerup", (ev) => {
  if (busy()) return;
  const col = pickCol(eventX(ev));
  if (state.drag && state.drag.id && !state.drag.fromKey) {
    const id = state.drag.id;
    state.drag = null;
    if (col === null) {
      setStatus("Look", "Kept the part where it was.", "");
      draw();
      return;
    }
    movePart(id, col);
    return;
  }
  const keepKey = state.drag && state.drag.fromKey;
  if (!keepKey) state.drag = null;
  if (col === null) return;
  actCol(col);
});

canvas.addEventListener("pointerleave", () => {
  if (state.drag && state.drag.id && !state.drag.fromKey) return;
  state.hover = null;
  draw();
});

canvas.addEventListener("contextmenu", (ev) => ev.preventDefault());

canvas.addEventListener("keydown", (ev) => {
  const s = spec();
  if (ev.key === "Escape") {
    state.drag = null;
    showCoach();
    draw();
    return;
  }
  if (ev.key === "ArrowLeft" || ev.key === "ArrowRight") {
    ev.preventDefault();
    const dir = ev.key === "ArrowLeft" ? -1 : 1;
    state.cursor = Math.min(s.cols - 1, Math.max(0, state.cursor + dir));
    state.hover = state.cursor;
    draw();
    return;
  }
  if (ev.key === "Enter" || ev.key === " ") {
    ev.preventDefault();
    actCol(state.cursor);
  }
});

for (const [name, btn] of Object.entries(toolButtons)) {
  btn.addEventListener("click", () => setTool(name));
}
kindButtons.forEach((btn) => btn.addEventListener("click", () => setKind(btn.dataset.kind)));
testBtn.addEventListener("click", startTest);
retryBtn.addEventListener("click", retry);
assistBtn.addEventListener("click", toggleAssist);

const restored = load();
syncControls();
if (restored) setStatus("Ready", "Build restored on this Chromebook.", "");
else showCoach();

if (typeof ResizeObserver === "function") {
  const observer = new ResizeObserver(() => resize());
  observer.observe(canvas.parentElement);
}
window.addEventListener("resize", resize);
if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => draw());
requestAnimationFrame(resize);
