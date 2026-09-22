import { judgeSpan, spanSpec, supportCols } from "./logic.js";
import { proveLoad } from "./physics.js";

const KEY = "kulibert-spancraft-mvp";
const KINDS = ["deck", "beam", "pier"];

const COACH = {
  empty: ["Ready", "Place decks from bank to bank. Then press Test."],
  gap: ["Build", "Fill every spot on the deck line, bank to bank."],
  nodeck: ["Build", "Put a deck in the middle. The load sits on a deck."],
  partial: ["Build", "Finish the pier down to the water."],
  long: ["Build", "Add a pier under the middle, down to the water."],
  pass: ["Ready", "Looks ready. Press Test."],
};

const PROVE = {
  empty: ["Fail", "The span does not reach both banks."],
  gap: ["Fail", "The span does not reach both banks."],
  nodeck: ["Fail", "The load needs a deck in the middle."],
  partial: ["Fail", "Finish the pier down to the water."],
  long: ["Fail", "Add a pier. The middle is too long."],
  pass: ["Pass", "The load stayed up."],
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
  kind: "deck",
  parts: [],
  cursor: { c: 1, r: 0 },
  hover: null,
  drag: null,
  phase: "idle",
  verdict: null,
  animU: 0,
};

let nextId = 1;
let cssW = 0;
let cssH = 0;
let animToken = 0;

function spec() {
  return spanSpec(state.assist);
}

function setStatus(word, text, tone) {
  capWord.textContent = word;
  capText.textContent = text;
  caption.className = "caption" + (tone ? " " + tone : "");
  caption.setAttribute("aria-live", tone === "pass" || tone === "fail" ? "assertive" : "polite");
}

function showCoach() {
  const reason = judgeSpan(spec(), state.parts).reason;
  const [word, text] = COACH[reason] || COACH.empty;
  setStatus(word, text, "");
}

function busy() {
  return state.phase === "drop";
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
      parts: state.parts.map((p) => ({ id: p.id, c: p.c, r: p.r, kind: p.kind })),
    }));
  } catch {
    /* private mode or full storage — play continues */
  }
}

function canOccupy(specNow, kind, c, r, parts, ignoreId) {
  if (c <= 0 || c >= specNow.cols - 1) return { ok: false, msg: "The banks are already there." };
  if (kind === "pier") {
    if (r < 1 || r > specNow.pierDepth) return { ok: false, msg: "Piers go under the deck, down to the water." };
  } else if (r !== 0) {
    return { ok: false, msg: "Beams and decks go on the deck line." };
  }
  if (parts.some((p) => p.id !== ignoreId && p.c === c && p.r === r)) {
    return { ok: false, msg: "That spot is full." };
  }
  return { ok: true };
}

function sanitize(parts) {
  const specNow = spec();
  const kept = [];
  for (const p of parts || []) {
    if (!KINDS.includes(p.kind)) continue;
    if (!Number.isInteger(p.c) || !Number.isInteger(p.r)) continue;
    if (!canOccupy(specNow, p.kind, p.c, p.r, kept, null).ok) continue;
    kept.push({ id: nextId++, c: p.c, r: p.r, kind: p.kind });
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
    state.kind = KINDS.includes(data.kind) ? data.kind : "deck";
    state.parts = sanitize(data.parts);
    const s = spec();
    state.cursor = { c: Math.min(Math.max(1, state.cursor.c), s.cols - 2), r: 0 };
    return state.parts.length > 0;
  } catch {
    return false;
  }
}

function wake() {
  if (state.phase === "pass" || state.phase === "fail" || state.phase === "drop") {
    cancelAnim();
    state.phase = "idle";
    state.verdict = null;
    state.animU = 0;
  }
}

function layout() {
  const s = spec();
  const marginX = 16;
  const marginTop = 52;
  const marginBot = 28;
  const rows = 1 + s.pierDepth;
  const fitW = Math.floor((cssW - marginX * 2) / s.cols);
  const fitH = Math.floor((cssH - marginTop - marginBot) / (rows + 0.85));
  const cell = Math.max(8, Math.min(fitW, fitH));
  const gridW = cell * s.cols;
  const gridH = cell * rows;
  const x0 = Math.round((cssW - gridW) / 2);
  const y0 = Math.round(marginTop + Math.max(0, (cssH - marginTop - marginBot - gridH) * 0.42));
  return { cell, x0, y0, rows };
}

function cellRect(g, c, r) {
  return { x: g.x0 + c * g.cell, y: g.y0 + r * g.cell, w: g.cell, h: g.cell };
}

function sagAmount(g, s, c) {
  if (state.phase === "idle" || !state.verdict) return 0;
  if (state.verdict !== "pass" && state.verdict !== "long" && state.verdict !== "partial") return 0;
  const supports = supportCols(s, state.parts);
  let left = supports[0];
  let right = supports[supports.length - 1];
  for (let i = 0; i < supports.length - 1; i++) {
    if (c >= supports[i] && c <= supports[i + 1]) {
      left = supports[i];
      right = supports[i + 1];
      break;
    }
  }
  const span = right - left;
  const t = span <= 0 ? 0 : (c - left) / span;
  const wave = Math.sin(t * Math.PI);
  const u = state.phase === "drop" ? state.animU : 1;
  const peak = state.verdict === "pass" ? g.cell * 0.08 : g.cell * 0.42;
  return wave * peak * u;
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

function drawPart(kind, box, alpha, dy) {
  ctx.save();
  ctx.globalAlpha = alpha;
  const y = box.y + dy;
  if (kind === "deck") {
    const h = Math.max(18, box.h * 0.42);
    const x = box.x + box.w * 0.08;
    const w = box.w * 0.84;
    const top = y + (box.h - h) / 2;
    roundRect(x, top, w, h, 8);
    ctx.fillStyle = "#f8fafc";
    ctx.fill();
  } else if (kind === "beam") {
    const h = Math.max(12, box.h * 0.22);
    const x = box.x + box.w * 0.08;
    const w = box.w * 0.84;
    const top = y + box.h * 0.4;
    roundRect(x, top, w, h, 6);
    ctx.fillStyle = "#22d3ee";
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x, top + h);
    ctx.quadraticCurveTo(x + w / 2, top + h + box.h * 0.28, x + w, top + h);
    ctx.strokeStyle = "#22d3ee";
    ctx.lineWidth = 3;
    ctx.stroke();
  } else {
    const w = Math.max(18, box.w * 0.46);
    const x = box.x + (box.w - w) / 2;
    roundRect(x, y + 3, w, box.h - 4, 6);
    ctx.fillStyle = "#5eead4";
    ctx.fill();
  }
  ctx.restore();
}

function paintBanner() {
  if (state.phase !== "pass" && state.phase !== "fail" && state.phase !== "drop") return;
  const prove = PROVE[state.verdict] || PROVE.gap;
  const word = state.phase === "drop" ? "Test" : prove[0];
  ctx.font = "800 28px Outfit, system-ui, sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillStyle = word === "Pass" ? "#5eead4" : word === "Fail" ? "#ffb4c0" : "#e8f7ff";
  ctx.fillText(word, 16, 26);
}

function draw() {
  if (cssW < 2 || cssH < 2) return;
  const s = spec();
  const g = layout();
  canvas.dataset.x0 = String(g.x0);
  canvas.dataset.y0 = String(g.y0);
  canvas.dataset.cell = String(g.cell);
  canvas.dataset.cols = String(s.cols);
  canvas.dataset.depth = String(s.pierDepth);

  ctx.clearRect(0, 0, cssW, cssH);
  ctx.fillStyle = "#050814";
  ctx.fillRect(0, 0, cssW, cssH);

  const waterTop = g.y0 + g.cell * 0.72;
  ctx.fillStyle = "#072433";
  ctx.fillRect(0, waterTop, cssW, cssH - waterTop);

  for (const c of [0, s.cols - 1]) {
    const box = cellRect(g, c, 0);
    roundRect(box.x + 4, g.y0 + 8, box.w - 8, g.cell * g.rows - 4, 10);
    ctx.fillStyle = "#10203f";
    ctx.fill();
    ctx.strokeStyle = "#5eead4";
    ctx.lineWidth = 2;
    ctx.stroke();
    if (g.cell >= 52) {
      ctx.fillStyle = "#8fb4c9";
      ctx.font = "700 16px Outfit, system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("Bank", box.x + box.w / 2, g.y0 + g.cell * 0.5);
    }
  }

  ctx.save();
  ctx.setLineDash([6, 7]);
  ctx.strokeStyle = "#16324f";
  ctx.lineWidth = 2;
  for (let c = 1; c < s.cols - 1; c++) {
    const box = cellRect(g, c, 0);
    const h = Math.max(18, box.h * 0.42);
    roundRect(box.x + box.w * 0.08, box.y + (box.h - h) / 2, box.w * 0.84, h, 8);
    ctx.stroke();
  }
  ctx.restore();

  ctx.fillStyle = "#8fb4c9";
  ctx.font = "700 16px Outfit, system-ui, sans-serif";
  ctx.textBaseline = "middle";
  if (state.phase === "idle") {
    ctx.textAlign = "left";
    ctx.fillText("Deck line", 16, 26);
  }
  ctx.textAlign = "right";
  ctx.fillText("Water", cssW - 16, cssH - 16);

  const draggingId = state.drag && state.hover ? state.drag.id : null;
  for (const p of state.parts) {
    if (p.id && p.id === draggingId) continue;
    drawPart(p.kind, cellRect(g, p.c, p.r), 1, sagAmount(g, s, p.c));
  }

  if (state.hover && !busy()) {
    const ghostKind = state.tool === "add" ? state.kind : (state.parts.find((p) => p.id === draggingId)?.kind);
    if (state.tool === "add") {
      const check = canOccupy(s, state.kind, state.hover.c, state.hover.r, state.parts, null);
      drawPart(state.kind, cellRect(g, state.hover.c, state.hover.r), check.ok ? 0.45 : 0.2, 0);
    } else if (ghostKind && state.drag) {
      const check = canOccupy(s, ghostKind, state.hover.c, state.hover.r, state.parts, draggingId);
      drawPart(ghostKind, cellRect(g, state.hover.c, state.hover.r), check.ok ? 0.55 : 0.25, 0);
    } else {
      const box = cellRect(g, state.hover.c, state.hover.r);
      ctx.strokeStyle = "#22d3ee";
      ctx.lineWidth = 2;
      roundRect(box.x + 3, box.y + 3, box.w - 6, box.h - 6, 8);
      ctx.stroke();
    }
  }

  if (document.activeElement === canvas && canvas.matches(":focus-visible")) {
    const box = cellRect(g, state.cursor.c, state.cursor.r);
    ctx.strokeStyle = "#e8f7ff";
    ctx.lineWidth = 3;
    roundRect(box.x + 2, box.y + 2, box.w - 4, box.h - 4, 8);
    ctx.stroke();
  }

  paintLoad(g, s);
  paintBanner();
}

function paintLoad(g, s) {
  if (state.phase === "idle" || !state.verdict) return;
  const mid = Math.floor(s.cols / 2);
  const deck = cellRect(g, mid, 0);
  const size = Math.min(56, Math.max(36, g.cell * 0.55));
  const x = deck.x + (deck.w - size) / 2;
  const sag = sagAmount(g, s, mid);
  const slabH = Math.max(18, deck.h * 0.42);
  const slabTop = deck.y + (deck.h - slabH) / 2 + sag;
  const rest = slabTop - size + 8;
  const water = cssH - size - 16;
  const top = 6;
  const end = state.verdict === "pass" ? rest : water;
  const u = state.phase === "drop" ? state.animU : 1;
  const y = top + (end - top) * u;
  ctx.strokeStyle = "#f4b942";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x + size / 2, 0);
  ctx.lineTo(x + size / 2, y);
  ctx.stroke();
  roundRect(x, y, size, size, 8);
  ctx.fillStyle = "#f4b942";
  ctx.fill();
  ctx.fillStyle = "#041018";
  ctx.font = "800 16px Outfit, system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("Load", x + size / 2, y + size / 2);
}

function resize() {
  const dpr = Math.min(window.devicePixelRatio || 1, 1.25);
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

function pickCell(x, y) {
  const s = spec();
  const g = layout();
  const slop = state.assist ? g.cell * 0.45 : 0;
  let best = null;
  let bestD = Infinity;
  for (let r = 0; r <= s.pierDepth; r++) {
    for (let c = 1; c < s.cols - 1; c++) {
      const box = cellRect(g, c, r);
      if (x < box.x - slop || x >= box.x + box.w + slop || y < box.y - slop || y >= box.y + box.h + slop) continue;
      const dx = x - (box.x + box.w / 2);
      const dy = y - (box.y + box.h / 2);
      const d = dx * dx + dy * dy;
      if (d < bestD) {
        bestD = d;
        best = { c, r };
      }
    }
  }
  return best;
}

function eventPoint(ev) {
  const rect = canvas.getBoundingClientRect();
  return { x: ev.clientX - rect.left, y: ev.clientY - rect.top };
}

function partAt(c, r) {
  return state.parts.find((p) => p.c === c && p.r === r) || null;
}

function placeAt(c, r) {
  const check = canOccupy(spec(), state.kind, c, r, state.parts, null);
  if (!check.ok) {
    setStatus("Look", check.msg, "");
    return;
  }
  wake();
  state.parts.push({ id: nextId++, c, r, kind: state.kind });
  save();
  showCoach();
  draw();
}

function deleteAt(c, r) {
  const part = partAt(c, r);
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

function moveTo(id, c, r) {
  const part = state.parts.find((p) => p.id === id);
  if (!part) return;
  const check = canOccupy(spec(), part.kind, c, r, state.parts, id);
  if (!check.ok) {
    setStatus("Look", check.msg, "");
    draw();
    return;
  }
  if (part.c === c && part.r === r) {
    showCoach();
    draw();
    return;
  }
  wake();
  part.c = c;
  part.r = r;
  save();
  showCoach();
  draw();
}

function actAt(c, r) {
  if (busy()) return;
  state.cursor = { c, r };
  if (state.tool === "add") placeAt(c, r);
  else if (state.tool === "delete") deleteAt(c, r);
  else {
    const part = partAt(c, r);
    if (!state.drag) {
      if (!part) {
        setStatus("Look", "Tap a part, then a new spot.", "");
        draw();
        return;
      }
      state.drag = { id: part.id, fromKey: true };
      setStatus("Move", "Pick a new spot.", "");
      draw();
      return;
    }
    const id = state.drag.id;
    state.drag = null;
    moveTo(id, c, r);
  }
}

function cancelAnim() {
  animToken += 1;
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

function startTest() {
  if (busy()) return;
  state.drag = null;
  const verdict = proveLoad(spec(), state.parts);
  state.verdict = verdict.reason;
  state.phase = "drop";
  state.animU = 0;
  syncControls();
  const prove = PROVE[verdict.reason] || PROVE.long;
  setStatus("Test", "The load is hanging.", "");
  animate(reduceMotion ? 0 : 700, () => {
    state.phase = verdict.ok ? "pass" : "fail";
    state.animU = 1;
    syncControls();
    setStatus(prove[0], prove[1], verdict.ok ? "pass" : "fail");
    draw();
  });
}

function retry() {
  cancelAnim();
  state.drag = null;
  state.phase = "idle";
  state.verdict = null;
  state.animU = 0;
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
  state.drag = null;
  state.assist = !state.assist;
  state.phase = "idle";
  state.verdict = null;
  state.animU = 0;
  const before = state.parts.length;
  state.parts = sanitize(state.parts.map((p) => ({ ...p })));
  const dropped = before - state.parts.length;
  const s = spec();
  state.cursor.c = Math.min(Math.max(1, state.cursor.c), s.cols - 2);
  state.cursor.r = Math.min(state.cursor.r, s.pierDepth);
  syncControls();
  save();
  const lead = state.assist
    ? "Assist on. Fewer parts and a wider snap."
    : "Assist off. Full span.";
  const extra = dropped ? " Some parts came off the shorter span." : "";
  setStatus(state.assist ? "Assist" : "Ready", lead + extra, "");
  draw();
}

canvas.addEventListener("pointerdown", (ev) => {
  if (busy()) return;
  canvas.focus();
  const pt = eventPoint(ev);
  const cell = pickCell(pt.x, pt.y);
  if (!cell) return;
  state.cursor = cell;
  if (state.tool === "move") {
    const part = partAt(cell.c, cell.r);
    if (part) {
      state.drag = { id: part.id, pointerId: ev.pointerId };
      canvas.setPointerCapture(ev.pointerId);
      draw();
      return;
    }
  }
  canvas.setPointerCapture(ev.pointerId);
  state.drag = state.drag && state.drag.fromKey ? state.drag : { pointerId: ev.pointerId, pending: cell };
});

canvas.addEventListener("pointermove", (ev) => {
  const pt = eventPoint(ev);
  const cell = pickCell(pt.x, pt.y);
  const prev = state.hover ? state.hover.c + "," + state.hover.r : "";
  state.hover = cell;
  const next = cell ? cell.c + "," + cell.r : "";
  if (prev !== next || state.drag) draw();
});

canvas.addEventListener("pointerup", (ev) => {
  if (busy()) return;
  const pt = eventPoint(ev);
  const cell = pickCell(pt.x, pt.y);
  if (state.drag && state.drag.id && !state.drag.fromKey) {
    const id = state.drag.id;
    state.drag = null;
    if (cell) moveTo(id, cell.c, cell.r);
    else {
      setStatus("Look", "Kept the part where it was.", "");
      draw();
    }
    return;
  }
  const keepKey = state.drag && state.drag.fromKey;
  if (!keepKey) state.drag = null;
  if (!cell) return;
  actAt(cell.c, cell.r);
});

canvas.addEventListener("pointerleave", () => {
  if (state.drag && !state.drag.fromKey) return;
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
  const step = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
  if (step[ev.key]) {
    ev.preventDefault();
    const [dc, dr] = step[ev.key];
    state.cursor.c = Math.min(s.cols - 2, Math.max(1, state.cursor.c + dc));
    state.cursor.r = Math.min(s.pierDepth, Math.max(0, state.cursor.r + dr));
    state.hover = { ...state.cursor };
    draw();
    return;
  }
  if (ev.key === "Enter" || ev.key === " ") {
    ev.preventDefault();
    actAt(state.cursor.c, state.cursor.r);
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

const stage = canvas.parentElement;
if (typeof ResizeObserver === "function") {
  const observer = new ResizeObserver(() => resize());
  observer.observe(stage);
}
window.addEventListener("resize", resize);
if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => draw());
requestAnimationFrame(resize);
