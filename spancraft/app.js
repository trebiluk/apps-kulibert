import { judgeSpan, spanSpec, supportCols } from "./logic.js";
import { proveLoad } from "./physics.js";
import { GRIP, drawTether } from "../shared/stretch.js";
import {
  quietMode,
  quietToast,
  hideQuietToast,
  readFlag,
  writeFlag,
  readJson,
  writeJson,
  runProveTheater,
  mountHelpOverlay,
  wireEdgeHelp,
} from "../shared/engage-help.js";

const KEY = "kulibert-spancraft-mvp";
const MASTER = "kulibert-spancraft-mastery-v1";
const ENGAGE = "kulibert-spancraft-engage-v1";
const ASSIST_SEEN = "kulibert-spancraft-assist-intro-v1";
const CALM_KEY = "kulibert-calm-clear";
const KINDS = ["deck", "beam", "pier"];

const ISLES = [
  { id: "first", name: "First Gap", job: "Short span · snap a joint", toy: "Sticky joint", unlock: null },
  { id: "long", name: "Long Gap", job: "Longer · fewer parts", toy: "Longer beam", unlock: "first" },
  { id: "wind", name: "Wind Gap", job: "Hold against the breeze", toy: "Soft spring", unlock: "long" },
  { id: "offset", name: "Offset Gap", job: "Load off-center · fix one", toy: "Offset pad", unlock: "wind" },
  { id: "open", name: "Open Span", job: "Your bridge · one load", toy: "Edge pocket bonus", unlock: "offset" },
];

const COACH = {
  empty: ["Ready", "Drag a Deck onto the middle. It stretches, then drops. Then press Test."],
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
const capMark = document.getElementById("cap-mark");
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
  assist: true,
  tool: "add",
  kind: "deck",
  parts: [],
  cursor: { c: 1, r: 0 },
  hover: null,
  drag: null,
  stretch: null,
  bestStars: 0,
  ghost: null,
  phase: "idle",
  verdict: null,
  animU: 0,
  bet: null,
  isleId: "first",
  cleared: {},
  toys: [],
  theater: null,
  firstSnap: true,
};

let nextId = 1;
let cssW = 0;
let cssH = 0;
let animToken = 0;

function spec() {
  return spanSpec(state.assist);
}

function budgetOf(s) {
  return s.cols - 2 + s.pierDepth;
}

function starPhrase(n) {
  if (!n) return "";
  const marks = "★".repeat(n) + "☆".repeat(3 - n);
  const word = n === 1 ? "1 star" : n + " stars";
  return marks + " " + word;
}

function loadMaster() {
  try {
    const data = JSON.parse(localStorage.getItem(MASTER) || "null");
    if (!data || data.v !== 1) return;
    state.bestStars = data.bestStars || 0;
    state.ghost = Array.isArray(data.ghost) ? data.ghost : null;
  } catch {
    /* keep playing */
  }
}

function saveMaster() {
  try {
    localStorage.setItem(MASTER, JSON.stringify({
      v: 1,
      bestStars: state.bestStars,
      ghost: state.ghost,
    }));
  } catch {
    /* private mode */
  }
}


function pierUnder(s, parts, c) {
  if (s.pierDepth <= 0) return false;
  for (let r = 1; r <= s.pierDepth; r++) {
    if (!parts.some((p) => p.kind === "pier" && p.c === c && p.r === r)) return false;
  }
  return true;
}

function scoreStars(s, verdict) {
  if (!verdict.ok) return 0;
  let n = 1;
  if (state.parts.length <= budgetOf(s)) n = 2;
  const mid = Math.floor(s.cols / 2);
  if (n === 2 && verdict.sag < 10 && pierUnder(s, state.parts, mid)) n = 3;
  return n;
}


/* Shop Prove Flash plates */
let flashTimer = 0;
function paintPlate(shout, caption, mark) {
  const plate = document.getElementById("flash-plate");
  const s = document.getElementById("flash-shout");
  const c = document.getElementById("flash-caption");
  const m = document.getElementById("flash-mark");
  if (!plate || !s || !c) return;
  s.textContent = shout;
  c.textContent = caption || "";
  if (m) m.textContent = mark || "";
  plate.hidden = false;
  plate.removeAttribute("hidden");
  plate.classList.add("show");
}
function hidePlate() {
  const plate = document.getElementById("flash-plate");
  if (!plate) return;
  plate.classList.remove("show");
  plate.hidden = true;
  plate.setAttribute("hidden", "");
}
function showFlash(shout, caption, mark) {
  window.clearTimeout(flashTimer);
  if (quietMode()) {
    hidePlate();
    quietToast(shout + (caption ? ". " + caption : ""));
    return;
  }
  hideQuietToast();
  paintPlate(shout, caption, mark);
  flashTimer = window.setTimeout(hidePlate, 1500);
}
function playBeats(beats) {
  window.clearTimeout(flashTimer);
  const list = (beats || []).filter(Boolean);
  if (!list.length) {
    hidePlate();
    hideQuietToast();
    return;
  }
  if (quietMode()) {
    hidePlate();
    const last = list[list.length - 1];
    quietToast(last.shout + (last.caption ? ". " + last.caption : ""));
    return;
  }
  hideQuietToast();
  const run = list;
  let i = 0;
  const step = () => {
    const beat = run[i];
    paintPlate(beat.shout, beat.caption, beat.mark);
    i += 1;
    flashTimer = window.setTimeout(i < run.length ? step : hidePlate, 1400);
  };
  step();
}
function hideAssistPlate() {
  const plate = document.getElementById("assist-plate");
  if (!plate) return;
  plate.classList.remove("show", "sticky");
  plate.hidden = true;
  plate.setAttribute("hidden", "");
}
function showAssistPlate(text, sticky) {
  const plate = document.getElementById("assist-plate");
  const p = document.getElementById("assist-plate-text");
  if (!plate || !p) return;
  p.textContent = text;
  plate.hidden = false;
  plate.removeAttribute("hidden");
  plate.classList.add("show");
  if (sticky) plate.classList.add("sticky");
  else plate.classList.remove("sticky");
  if (!sticky) {
    window.setTimeout(() => {
      if (plate.classList.contains("sticky")) return;
      plate.classList.remove("show");
      plate.hidden = true;
      plate.setAttribute("hidden", "");
    }, 3200);
  }
}
function openFirstAssist() {
  state.assist = true;
  if (assistBtn) assistBtn.setAttribute("aria-pressed", "true");
  showAssistPlate("Assist is on.\nSnap the first Deck on the glow.", true);
  updateSnapHint();
}
function dismissFirstAssist() {
  writeFlag(ASSIST_SEEN, true);
  hideAssistPlate();
  setStatus("Ready", state.cleared.first
    ? "Add a Deck in the middle, then fill bank to bank. Press Test when ready."
    : "Place three Decks across the gap, then Test. That is the first clear.", "");
}
function loadEngage() {
  const data = readJson(ENGAGE, null);
  if (!data || data.v !== 1) return;
  state.cleared = data.cleared && typeof data.cleared === "object" ? data.cleared : {};
  state.toys = Array.isArray(data.toys) ? data.toys : [];
  state.isleId = typeof data.isleId === "string" ? data.isleId : "first";
  state.firstSnap = data.firstSnap !== false;
}
function saveEngage() {
  writeJson(ENGAGE, {
    v: 1,
    cleared: state.cleared,
    toys: state.toys,
    isleId: state.isleId,
    firstSnap: state.firstSnap,
  });
  syncToysChip();
}
function syncToysChip() {
  const chip = document.getElementById("toys-chip");
  if (!chip) return;
  const n = state.toys.length;
  if (!n) {
    chip.hidden = true;
    chip.textContent = "Toys 0";
    return;
  }
  chip.hidden = false;
  chip.textContent = n === 1 ? state.toys[0] : "Toys " + n;
  chip.title = state.toys.join(" · ");
}
function updateSnapHint(g, s) {
  const hint = document.getElementById("snap-hint");
  if (!hint) return;
  const show = state.firstSnap && state.parts.length === 0 && state.phase === "idle";
  hint.hidden = !show;
  if (!show || !g || !s) return;
  const mid = Math.floor(s.cols / 2);
  hint.style.left = (g.x0 + (mid + 0.5) * g.cell) + "px";
  hint.style.top = (g.y0 + g.cell * 0.5) + "px";
}
function syncBetBar() {
  const bar = document.getElementById("bet-bar");
  if (!bar) return;
  // Show bet when build has parts and not busy
  const show = state.parts.length > 0 && state.phase === "idle";
  bar.hidden = !show;
  for (const btn of bar.querySelectorAll(".bet-chip")) {
    btn.setAttribute("aria-pressed", btn.dataset.bet === state.bet ? "true" : "false");
  }
}
function unlockToyForIsle(isleId) {
  const isle = ISLES.find((i) => i.id === isleId);
  if (!isle || !isle.toy) return null;
  if (state.toys.includes(isle.toy)) return null;
  state.toys.push(isle.toy);
  return isle.toy;
}
function markIsleClear() {
  const id = state.isleId || "first";
  state.cleared[id] = true;
  const toy = unlockToyForIsle(id);
  // unlock next isle as active
  const idx = ISLES.findIndex((i) => i.id === id);
  if (idx >= 0 && idx < ISLES.length - 1) {
    const next = ISLES[idx + 1];
    if (!state.cleared[next.id]) state.isleId = next.id;
  }
  saveEngage();
  return toy;
}
function isleState(isle) {
  if (state.cleared[isle.id]) return "clear";
  if (isle.id === state.isleId) return "active";
  if (!isle.unlock) return "active";
  if (state.cleared[isle.unlock]) return "open";
  return "locked";
}
function renderIsleMap() {
  const grid = document.getElementById("isle-grid");
  if (!grid) return;
  grid.innerHTML = "";
  for (const isle of ISLES) {
    const st = isleState(isle);
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "isle-card";
    btn.dataset.state = st === "open" ? "active" : st;
    btn.disabled = st === "locked";
    const tag = st === "clear" ? "Done" : st === "locked" ? "Locked" : (isle.id === state.isleId ? "Now" : "Open");
    const owned = state.toys.includes(isle.toy);
    btn.innerHTML =
      '<span class="isle-tag">' + tag + "</span>" +
      "<h3>" + isle.name + "</h3>" +
      "<p>" + isle.job + "</p>" +
      '<span class="isle-toy">' + (st === "locked" ? "Next toy · " + isle.toy : owned ? "Yours · " + isle.toy : "Toy · " + isle.toy) + "</span>";
    btn.addEventListener("click", () => {
      if (st === "locked") return;
      state.isleId = isle.id;
      saveEngage();
      closeIsleMap();
      setStatus("Isle", isle.name + " — " + isle.job, "");
      renderIsleMap();
    });
    grid.appendChild(btn);
  }
}
function openIsleMap() {
  const map = document.getElementById("isle-map");
  if (!map) return;
  renderIsleMap();
  map.hidden = false;
  map.removeAttribute("hidden");
}
function closeIsleMap() {
  const map = document.getElementById("isle-map");
  if (!map) return;
  map.hidden = true;
  map.setAttribute("hidden", "");
}
function setMasteryChip(text) {
  const chip = document.getElementById("mastery-chip");
  if (!chip) return;
  if (!text) {
    chip.hidden = true;
    chip.textContent = "";
    return;
  }
  chip.hidden = false;
  chip.textContent = text;
}

function setStatus(word, text, tone) {
  capWord.textContent = word;
  capText.textContent = text;
  if (capMark) {
    capMark.textContent = tone === "pass" ? "✓" : tone === "fail" ? "✕" : "";
  }
  caption.className = "caption" + (tone ? " " + tone : "");
  caption.setAttribute("aria-live", tone === "pass" || tone === "fail" ? "assertive" : "polite");
}

function showCoach() {
  if (!state.cleared.first && state.parts.length === 0) {
    setStatus("Ready", "Place three Decks across the gap, then Test. That is the first clear.", "");
    return;
  }
  const reason = judgeSpan(spec(), state.parts).reason;
  const [word, text] = COACH[reason] || COACH.empty;
  setStatus(word, text, "");
}

function armFailRetry(on) {
  if (retryBtn) {
    retryBtn.classList.toggle("is-needed", !!on);
    retryBtn.disabled = false;
    retryBtn.hidden = false;
  }
  const now = document.getElementById("retry-now");
  if (now) now.hidden = !on;
}
function busy() {
  return state.phase === "drop" || state.phase === "theater";
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
  kindsEl.hidden = state.tool !== "add" && state.tool !== "move";
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
  // Caption + flash plate own the shout — keep canvas mark-free for clarity.
  if (state.phase !== "fail" && state.phase !== "drop") return;
  if (state.phase === "fail") {
    ctx.font = "800 22px Outfit, system-ui, sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#ffb4c0";
    ctx.fillText("✕", 16, 26);
  }
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
  if (state.ghost && state.ghost.length && state.phase === "idle" && !state.stretch) {
    ctx.save();
    ctx.globalAlpha = 0.28;
    ctx.setLineDash([5, 6]);
    for (const p of state.ghost) {
      const box = cellRect(g, p.c, p.r);
      ctx.strokeStyle = "#e8f7ff";
      ctx.lineWidth = 2;
      roundRect(box.x + 8, box.y + 8, box.w - 16, box.h - 16, 8);
      ctx.stroke();
    }
    ctx.restore();
  }
  for (const p of state.parts) {
    if (p.id && (p.id === draggingId || (state.stretch && p.id === state.stretch.id))) continue;
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


  if (state.stretch) {
    const part = state.parts.find((p) => p.id === state.stretch.id);
    if (part) {
      const home = cellRect(g, part.c, part.r);
      drawTether(ctx, home.x + home.w / 2, home.y + home.h / 2, state.stretch.x, state.stretch.y);
    }
  } else if (state.phase === "idle") {
    ctx.save();
    ctx.strokeStyle = "#8fb4c9";
    ctx.lineWidth = 2;
    for (const p of state.parts) {
      const box = cellRect(g, p.c, p.r);
      ctx.beginPath();
      ctx.arc(box.x + box.w / 2, box.y + box.h / 2, GRIP, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  paintLoad(g, s);
  paintBanner();
  updateSnapHint(g, s);
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
  const slop = Math.max(GRIP, g.cell * (state.assist ? 0.45 : 0.2));
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
  if (state.firstSnap) {
    state.firstSnap = false;
    saveEngage();
  }
  updateSnapHint();
  showFlash("SNAP", "Joint set", "✓");
  save();
  showCoach();
  syncBetBar();
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

function finishProve(verdict, stars, s, prove, started) {
  state.phase = verdict.ok ? "pass" : "fail";
  state.animU = 1;
  if (stars > state.bestStars) state.bestStars = stars;
  // Ghost You: faint best CLEAR outline (any pass, prefer 3★)
  if (verdict.ok && (stars === 3 || !state.ghost)) {
    state.ghost = state.parts.map((p) => ({ c: p.c, r: p.r, kind: p.kind }));
  }
  if (stars > 0) saveMaster();
  let extra = "";
  if (stars) extra += " " + starPhrase(stars) + ".";
  if (state.bestStars >= 1) extra += " Parts " + state.parts.length + " of " + budgetOf(s) + ".";
  if (state.bet) {
    const held = !!verdict.ok;
    const right = (state.bet === "hold" && held) || (state.bet === "fall" && !held);
    extra += right
      ? " Bet matched — nice read."
      : " Bet missed — try one fix, then Test again.";
  }
  const firstClear = verdict.ok && !state.cleared.first;
  const toy = verdict.ok ? markIsleClear() : null;
  if (toy) extra += " Toy: " + toy + ".";
  syncControls();
  setStatus(prove[0], prove[1] + extra, verdict.ok ? "pass" : "fail");
  if (retryBtn) retryBtn.classList.toggle("is-needed", !verdict.ok);
  armFailRetry(!verdict.ok);
  const beats = [];
  if (verdict.ok) {
    if (firstClear) {
      beats.push({ shout: "First clear", caption: (toy ? toy + " is yours. " : "") + "Three decks held.", mark: "✓" });
    } else {
      beats.push({ shout: "Held", caption: "The load stayed up.", mark: "✓" });
    }
    if (stars > 0) {
      setMasteryChip("★ " + stars + "/3");
      beats.push({ shout: stars + (stars === 1 ? " star" : " stars"), caption: starPhrase(stars) + ".", mark: "★".repeat(stars) });
    }
    if (toy && !firstClear) beats.push({ shout: "Toy", caption: toy + " is yours.", mark: "✓" });
  } else {
    setMasteryChip("");
    setStatus("Fail", prove[1] + " Tap Retry — change one thing.", "fail");
    beats.push({ shout: "Miss", caption: "Tap Retry and change one thing.", mark: "✕" });
  }
  playBeats(beats);
  state.bet = null;
  syncBetBar();
  if (performance.now() - started > 2000) {
    setStatus(prove[0], prove[1] + extra, verdict.ok ? "pass" : "fail");
  }
  draw();
}

function startTest() {
  if (busy()) return;
  state.drag = null;
  state.stretch = null;
  if (retryBtn) retryBtn.classList.remove("is-needed");
  armFailRetry(false);
  const s = spec();
  // Bet optional (P1) — show chips, never block first CLEAR
  if (state.parts.length) syncBetBar();
  const verdict = proveLoad(s, state.parts);
  const stars = scoreStars(s, verdict);
  state.verdict = verdict.reason;
  const prove = PROVE[verdict.reason] || PROVE.long;
  const started = performance.now();
  const runDrop = () => {
    state.phase = "drop";
    state.animU = 0;
    syncControls();
    setStatus("Test", "The load is hanging.", "");
    animate(quietMode() || reduceMotion ? 0 : 420, () => {
      finishProve(verdict, stars, s, prove, started);
    });
  };
  window.clearTimeout(flashTimer);
  hideQuietToast();
  hidePlate();
  if (state.theater && state.theater.cancel) state.theater.cancel();
  state.phase = "theater";
  syncControls();
  state.theater = runProveTheater({
    setStatus,
    totalMs: 1500,
    lines: [
      ["Hanging", "The load is coming on."],
      ["Watch", "Look at the span."],
      ["Drop", "The load is on it."],
    ],
    onDone: runDrop,
  });
}

function retry() {
  cancelAnim();
  hideQuietToast();
  if (state.theater && state.theater.cancel) state.theater.cancel();
  state.theater = null;
  state.drag = null;
  state.stretch = null;
  state.phase = "idle";
  state.verdict = null;
  state.animU = 0;
  state.bet = null;
  if (retryBtn) retryBtn.classList.remove("is-needed");
  armFailRetry(false);
  syncControls();
  syncBetBar();
  updateSnapHint();
  if (state.parts.length) setStatus("Ready", "Test cleared. Your build is still here. Change one thing, then Test.", "");
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
  if (!state.cleared.first) {
    state.assist = true;
    syncControls();
    setStatus("Assist", "Assist stays on until the first clear.", "");
    return;
  }
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
  const part = partAt(cell.c, cell.r);
  if (part && state.tool !== "delete") {
    state.stretch = { id: part.id, x: pt.x, y: pt.y };
    canvas.setPointerCapture(ev.pointerId);
    draw();
    return;
  }
  if (state.tool === "move") {
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
  if (state.stretch) {
    state.stretch.x = pt.x;
    state.stretch.y = pt.y;
    draw();
    return;
  }
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
  if (state.stretch) {
    const id = state.stretch.id;
    state.stretch = null;
    if (cell) moveTo(id, cell.c, cell.r);
    else {
      setStatus("Look", "It sprang back. Try an open spot.", "");
      draw();
    }
    return;
  }
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
    state.stretch = null;
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
document.getElementById("retry-now").addEventListener("click", retry);
assistBtn.addEventListener("click", toggleAssist);
const edgeBtn = document.getElementById("edge-btn");
const edgeMenu = document.getElementById("edge-menu");
if (edgeMenu) edgeMenu.hidden = true;

loadMaster();
loadEngage();
if (readFlag(CALM_KEY)) document.documentElement.classList.add("calm-clear");
const restored = load();
syncControls();
syncToysChip();
syncBetBar();
updateSnapHint();
if (restored) setStatus("Ready", "Build restored on this Chromebook.", "");
else showCoach();

const helpApi = mountHelpOverlay({
  title: "How to play · SpanCraft",
  version: "SC 1.3.10",
  note: "What’s new: Help is one screen, with the version.",
  classHref: "./changelog.html",
  calmKey: CALM_KEY,
  steps: [
    "Place three Decks across the gap, then Test. That is the first clear.",
    "Press Test. The word says if it held.",
    "If it misses, tap Retry and change one thing.",
  ],
  onReplayIntro: () => {
    writeFlag(ASSIST_SEEN, false);
    openFirstAssist();
  },
});
wireEdgeHelp(document.getElementById("edge-btn"), document.getElementById("edge-menu"), helpApi.open);

const assistGot = document.getElementById("assist-gotit");
if (assistGot) assistGot.addEventListener("click", dismissFirstAssist);

const islesBtn = document.getElementById("isles-btn");
if (islesBtn) islesBtn.addEventListener("click", openIsleMap);
const isleClose = document.getElementById("isle-close");
if (isleClose) isleClose.addEventListener("click", closeIsleMap);
const isleMap = document.getElementById("isle-map");
if (isleMap) isleMap.addEventListener("click", (ev) => { if (ev.target === isleMap) closeIsleMap(); });

for (const btn of document.querySelectorAll(".bet-chip")) {
  btn.addEventListener("click", () => {
    state.bet = btn.dataset.bet;
    syncBetBar();
    setStatus("Bet", btn.dataset.bet === "hold" ? "You bet it’ll hold. Press Test." : "You bet it’ll fall. Press Test.", "");
  });
}

if (!readFlag(ASSIST_SEEN)) {
  openFirstAssist();
} else if (!restored) {
  setStatus("Ready", "Drag a Deck onto the middle. It stretches, then drops. Then press Test.", "");
}

const stage = canvas.parentElement;
if (typeof ResizeObserver === "function") {
  const observer = new ResizeObserver(() => resize());
  observer.observe(stage);
}
window.addEventListener("resize", resize);
if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => draw());
requestAnimationFrame(resize);
