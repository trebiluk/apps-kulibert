// Spire Lab — one height-stand prove. Original draw. tower_game MIT math only.

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

const KEY = "kulibert-spire-height-v1";
const ENGAGE = "kulibert-spire-engage-v1";
const ASSIST_SEEN = "kulibert-spire-assist-intro-v1";
const CALM_KEY = "kulibert-calm-clear";
const GHOST_KEY = "kulibert-spire-ghost-v1";
const SLAB_H = 26;
const BASE_W = 168;
const GOAL_FLOORS = 10; // classroom clear target — dashed line on board

const ISLES = [
  { id: "first", name: "First Stack", job: "Short stack · wide base", toy: "Sticky joint", unlock: null },
  { id: "tall", name: "Tall Peak", job: "Go taller · keep balance", toy: "Soft spring", unlock: "first" },
  { id: "wind", name: "Wind Peak", job: "Stand in a wobble", toy: "Wind fan", unlock: "tall" },
  { id: "offset", name: "Offset Peak", job: "Offset stack · fix one", toy: "Offset pad", unlock: "wind" },
  { id: "open", name: "Open Spire", job: "Your tower · stand check", toy: "Longer beam", unlock: "offset" },
];

const canvas = document.getElementById("board");
const ctx = canvas.getContext("2d");
const caption = document.getElementById("caption");
const capWord = document.getElementById("cap-word");
const capText = document.getElementById("cap-text");
const heightN = document.getElementById("height-n");
const streakChip = document.getElementById("streak");
const streakN = document.getElementById("streak-n");
const assistBtn = document.getElementById("assist");
const retryBtn = document.getElementById("retry");
const dropBtn = document.getElementById("tool-test");

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const state = {
  assist: false,
  phase: "ready",
  height: 0,
  best: 0,
  perfectCount: 0,
  slabs: [],
  mover: null,
  scraps: [],
  scale: 1,
  grab: null,
  bet: null,
  isleId: "first",
  cleared: {},
  toys: [],
  theater: null,
  ghostBest: 0,
  pendingDrop: false,
};

let cssW = 0;
let cssH = 0;
let last = 0;


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
function updateDropCue() {
  const cue = document.getElementById("drop-cue");
  if (!cue) return;
  const show = !state.cleared.first && state.height === 0 && state.phase !== "over";
  cue.hidden = !show;
}
function openFirstAssist() {
  // Intro opens Assist ON once for first clear; default remains OFF after dismiss for harder stack
  state.assist = true;
  if (assistBtn) assistBtn.setAttribute("aria-pressed", "true");
  showAssistPlate("Assist is on.\nDrop when the slab crosses the center.", true);
  updateDropCue();
}
function dismissFirstAssist() {
  writeFlag(ASSIST_SEEN, true);
  hideAssistPlate();
  if (!state.cleared.first) {
    state.assist = true;
    if (assistBtn) assistBtn.setAttribute("aria-pressed", "true");
    setStatus("Ready", "Drop three slabs that stay. That is the first clear.", "");
    return;
  }
  state.assist = false;
  if (assistBtn) assistBtn.setAttribute("aria-pressed", "false");
  setStatus("Ready", "Hang the slab over the tower, then Drop. Climb to Goal " + GOAL_FLOORS + ".", "");
}
function loadEngage() {
  const data = readJson(ENGAGE, null);
  if (!data || data.v !== 1) return;
  state.cleared = data.cleared && typeof data.cleared === "object" ? data.cleared : {};
  state.toys = Array.isArray(data.toys) ? data.toys : [];
  state.isleId = typeof data.isleId === "string" ? data.isleId : "first";
  try {
    const g = Number(localStorage.getItem(GHOST_KEY));
    state.ghostBest = Number.isFinite(g) && g > 0 ? Math.floor(g) : 0;
  } catch {
    state.ghostBest = 0;
  }
}
function saveEngage() {
  writeJson(ENGAGE, {
    v: 1,
    cleared: state.cleared,
    toys: state.toys,
    isleId: state.isleId,
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
  chip.textContent = "Toys " + n;
  chip.title = state.toys.join(" · ");
  chip.setAttribute("aria-label", "Toys " + n + ". " + state.toys.join(", "));
}
function syncBetBar() {
  const bar = document.getElementById("bet-bar");
  if (!bar) return;
  const show = state.phase === "ready" || state.phase === "run";
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
      setStatus("Peak", isle.name + " — " + isle.job, "");
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
  const mark = document.getElementById("cap-mark");
  if (mark) mark.textContent = tone === "pass" ? "✓" : tone === "fail" ? "✕" : "";
  caption.className = "caption" + (tone ? " " + tone : "");
}

function showStreak() {
  if (!streakChip || !streakN) return;
  if (state.perfectCount > 0) {
    streakChip.hidden = false;
    streakN.textContent = String(state.perfectCount);
  } else {
    streakChip.hidden = true;
    streakN.textContent = "0";
  }
}

function towerPerfect(moverLeft, topLeft, width) {
  const calWidth = width / 2;
  const lineX = topLeft;
  const blockX = moverLeft + calWidth;
  // Tight even window — streak has to be earned.
  return blockX > lineX + calWidth * 0.92 && blockX < lineX + calWidth * 1.08;
}

function readBest() {
  try {
    const n = Number(localStorage.getItem(KEY));
    state.best = Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
  } catch {
    state.best = 0;
  }
}

function writeBest() {
  if (state.height <= state.best) return;
  state.best = state.height;
  try {
    localStorage.setItem(KEY, String(state.best));
  } catch {
    /* private mode */
  }
}

function speed() {
  if (!state.cleared.first) return 64;
  const base = state.assist ? 110 : 156;
  const climb = state.assist ? 14 : 28;
  const cap = state.assist ? 230 : 360;
  const v = base + state.height * climb;
  const out = reduceMotion ? v * 0.7 : v;
  return out > cap ? cap : out;
}

function snapBand() {
  if (!state.cleared.first) return 28;
  return state.assist ? 5 : 2.2;
}


function paintHeightRead() {
  if (heightN) heightN.textContent = String(state.height);
  const goalEl = document.getElementById("goal-n");
  if (goalEl) goalEl.textContent = String(GOAL_FLOORS);
  const wrap = document.getElementById("height-read");
  if (wrap) wrap.setAttribute("data-goal-met", state.height >= GOAL_FLOORS ? "1" : "0");
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
function resetTower() {
  armFailRetry(false);
  state.phase = "ready";
  state.height = 0;
  state.scraps = [];
  state.slabs = [{ x: -BASE_W / 2, y: 0, w: BASE_W, h: SLAB_H, base: true }];
  state.mover = {
    x: -BASE_W / 2 - 48,
    y: SLAB_H,
    w: BASE_W,
    h: SLAB_H,
    dir: 1,
  };
  paintHeightRead();
  state.perfectCount = 0;
  showStreak();
  assistBtn.setAttribute("aria-pressed", state.assist ? "true" : "false");
  const best = state.best ? " Best " + state.best + "." : "";
  const line = state.cleared.first
    ? "Hang the slab over the tower, then Drop. Climb to the Goal line (" + GOAL_FLOORS + ")." + best
    : "Drop three slabs that stay. That is the first clear." + best;
  setStatus("Ready", line, "");
}

function topSlab() {
  return state.slabs[state.slabs.length - 1];
}

function travel() {
  const top = topSlab();
  const pad = !state.cleared.first ? 90 : state.assist ? 36 : 58;
  return { lo: top.x - pad, hi: top.x + top.w + pad };
}

function doDropSlab() {
  if (state.phase === "over") return;
  state.phase = "run";
  const top = topSlab();
  const mover = state.mover;
  const left = Math.max(mover.x, top.x);
  const right = Math.min(mover.x + mover.w, top.x + top.w);
  const overlap = right - left;
  if (overlap < Math.max(10, top.w * 0.12)) {
    state.perfectCount = 0;
    showStreak();
    state.scraps.push({
      x: mover.x,
      y: mover.y,
      w: mover.w,
      h: mover.h,
      vy: 40,
      rot: 0,
      spin: mover.dir * 2.2,
    });
    state.mover = null;
    state.phase = "over";
    writeBest();
    paintHeightRead();
    let betLine = "";
    if (state.bet === "fall") betLine = " Bet matched — it fell.";
    else if (state.bet === "hold") betLine = " Bet missed — try center, then Drop again.";
    state.bet = null;
    syncBetBar();
    const miss = state.cleared.first
      ? "Missed the stack. Tap Retry — hang a new slab. Goal is the dashed line at " + GOAL_FLOORS + ". Best " + state.best + "." + betLine
      : "Missed the stack. Tap Retry. Three drops that stay is the first clear. Best " + state.best + "." + betLine;
    setStatus("Miss", miss, "fail");
    if (retryBtn) retryBtn.classList.add("is-needed");
    armFailRetry(true);
    setMasteryChip("");
    playBeats([{ shout: "Miss", caption: "Tap Retry and drop closer to center.", mark: "✕" }]);
    return;
  }
  const even = towerPerfect(mover.x, top.x, top.w);
  const aligned = even || Math.abs(mover.x - top.x) <= snapBand();
  let piece;
  if (aligned) {
    piece = { x: top.x, y: top.y + top.h, w: top.w, h: SLAB_H };
  } else {
    piece = { x: left, y: top.y + top.h, w: overlap, h: SLAB_H };
    if (mover.x < top.x) {
      state.scraps.push({
        x: mover.x,
        y: mover.y,
        w: top.x - mover.x,
        h: SLAB_H,
        vy: 20,
        rot: 0,
        spin: -1.6,
      });
    }
    if (mover.x + mover.w > top.x + top.w) {
      state.scraps.push({
        x: top.x + top.w,
        y: mover.y,
        w: mover.x + mover.w - (top.x + top.w),
        h: SLAB_H,
        vy: 20,
        rot: 0,
        spin: 1.6,
      });
    }
  }
  state.slabs.push(piece);
  state.height += 1;
  paintHeightRead();
  writeBest();
  state.perfectCount = even ? state.perfectCount + 1 : 0;
  showStreak();
  const span = travel();
  state.mover = {
    x: span.lo,
    y: piece.y + piece.h,
    w: piece.w,
    h: SLAB_H,
    dir: 1,
  };
  const streakLine = state.perfectCount ? " Even. Streak " + state.perfectCount + "." : "";
  let betLine = "";
  if (state.bet === "hold") betLine = " Bet matched — it held.";
  else if (state.bet === "fall") betLine = " Bet missed — it stood anyway.";
  state.bet = null;
  syncBetBar();
  if (state.height > state.ghostBest) {
    state.ghostBest = state.height;
    try { localStorage.setItem(GHOST_KEY, String(state.ghostBest)); } catch { /* private */ }
  }
  let toy = null;
  const firstClear = state.height === 3 && !state.cleared.first;
  if (firstClear) toy = markIsleClear();
  if (state.height === GOAL_FLOORS) toy = markIsleClear() || toy;
  const toyLine = toy ? " Toy: " + toy + "." : "";
  setStatus("STAND", "It stood. Height " + state.height + ". Best " + state.best + "." + streakLine + betLine + toyLine, "pass");
  armFailRetry(false);
  const beats = [];
  if (firstClear) {
    beats.push({ shout: "First clear", caption: (toy ? toy + " is yours. " : "") + "Three drops stayed.", mark: "✓" });
  } else {
    beats.push({ shout: "Stood", caption: "Height " + state.height + ". It stayed up.", mark: "✓" });
  }
  if (state.perfectCount > 0) {
    setMasteryChip("Streak " + state.perfectCount);
    beats.push({ shout: "Streak", caption: state.perfectCount + " even in a row.", mark: "★" });
  } else {
    setMasteryChip("");
  }
  if (toy && !firstClear) beats.push({ shout: "Toy", caption: toy + " is yours.", mark: "✓" });
  playBeats(beats);
}

function dropSlab() {
  if (state.phase === "over") return;
  if (state.phase === "theater") return;
  // Bet optional (P1) — chips visible, never block first CLEAR
  syncBetBar();
  if (retryBtn) retryBtn.classList.remove("is-needed");
  armFailRetry(false);
  const run = () => {
    state.theater = null;
    doDropSlab();
  };
  window.clearTimeout(flashTimer);
  hideQuietToast();
  hidePlate();
  if (state.theater && state.theater.cancel) state.theater.cancel();
  state.phase = "theater";
  state.theater = runProveTheater({
    setStatus,
    totalMs: 1200,
    lines: [
      ["Watch", "Look at the stack."],
      ["Drop", "Let it land."],
    ],
    onDone: run,
  });
}

function targetScale() {
  const tower = (state.slabs.length + 1) * SLAB_H + 120;
  const fit = (cssH - 72) / tower;
  return Math.max(0.42, Math.min(1.7, fit));
}

function roundRect(x, y, w, h, r) {
  const rad = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}

function worldToScreen(x, y) {
  const ground = cssH - 28;
  return {
    x: cssW / 2 + x * state.scale,
    y: ground - y * state.scale,
  };
}

function drawSlab(slab, alpha) {
  const a = worldToScreen(slab.x, slab.y + slab.h);
  const b = worldToScreen(slab.x + slab.w, slab.y);
  const x = a.x;
  const y = a.y;
  const w = b.x - a.x;
  const h = b.y - a.y;
  ctx.save();
  ctx.globalAlpha = alpha;
  roundRect(x, y, w, h, 8 * state.scale);
  ctx.fillStyle = slab.base ? "#10203f" : "#c4b5fd";
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = slab.base ? "#f8fafc" : "#7c6bb5";
  ctx.stroke();
  ctx.restore();
}

function draw() {
  if (cssW < 2 || cssH < 2) return;
  ctx.clearRect(0, 0, cssW, cssH);
  ctx.fillStyle = "#050814";
  ctx.fillRect(0, 0, cssW, cssH);

  const ground = cssH - 28;
  // crane rail (cheap realism)
  ctx.strokeStyle = "rgba(248,250,252,0.35)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(20, 28);
  ctx.lineTo(cssW - 20, 28);
  ctx.stroke();
  ctx.fillStyle = "rgba(248,250,252,0.5)";
  ctx.fillRect(cssW / 2 - 10, 18, 20, 12);

  ctx.strokeStyle = "#f8fafc";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(16, ground);
  ctx.lineTo(cssW - 16, ground);
  ctx.stroke();

  // Goal line — classroom target height
  const goalY = worldToScreen(0, GOAL_FLOORS * SLAB_H).y;
  ctx.save();
  ctx.setLineDash([10, 8]);
  ctx.strokeStyle = state.height >= GOAL_FLOORS ? "#34d399" : "#a78bfa";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(24, goalY);
  ctx.lineTo(cssW - 24, goalY);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = state.height >= GOAL_FLOORS ? "#34d399" : "#c4b5fd";
  ctx.font = "700 13px Outfit, system-ui, sans-serif";
  ctx.fillText(state.height >= GOAL_FLOORS ? "Goal " + GOAL_FLOORS + " · done" : "Goal " + GOAL_FLOORS, 28, goalY - 8);
  if (state.ghostBest > 0) {
    const gy = worldToScreen(0, state.ghostBest * SLAB_H).y;
    ctx.setLineDash([4, 6]);
    ctx.strokeStyle = "rgba(248,250,252,0.35)";
    ctx.beginPath();
    ctx.moveTo(24, gy);
    ctx.lineTo(cssW - 24, gy);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "rgba(248,250,252,0.55)";
    ctx.font = "600 12px Outfit, system-ui, sans-serif";
    ctx.fillText("Ghost You " + state.ghostBest, cssW - 120, gy - 6);
  }
  ctx.restore();

  // Ghost landing pad on top slab so Drop target is obvious
  if (state.phase !== "over" && state.slabs.length) {
    const top = state.slabs[state.slabs.length - 1];
    const ghost = { x: top.x, y: top.y + top.h, w: top.w, h: SLAB_H };
    const a = worldToScreen(ghost.x, ghost.y + ghost.h);
    const b = worldToScreen(ghost.x + ghost.w, ghost.y);
    ctx.save();
    ctx.setLineDash([6, 5]);
    ctx.strokeStyle = "rgba(167,139,250,0.85)";
    ctx.lineWidth = 2;
    roundRect(a.x, a.y, b.x - a.x, b.y - a.y, 6 * state.scale);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  for (const slab of state.slabs) drawSlab(slab, 1);

  if (state.mover && state.phase !== "over") {
    drawSlab(state.mover, 1);
    const hook = { x: cssW / 2, y: 28 };
    const grip = worldToScreen(state.mover.x + state.mover.w / 2, state.mover.y + state.mover.h);
    // P2: quieter guide line (less "broken teal beam"), goal line stays loud
    ctx.save();
    ctx.globalAlpha = 0.55;
    drawTether(ctx, hook.x, hook.y, grip.x, grip.y);
    ctx.restore();
  } else if (state.phase === "over") {
    // After miss: big Retry cue on canvas so kids aren't stuck staring at a dead tower
    ctx.save();
    ctx.fillStyle = "rgba(5,8,20,0.55)";
    ctx.fillRect(0, 0, cssW, cssH);
    ctx.fillStyle = "#f8fafc";
    ctx.font = "800 22px Outfit, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Tap Retry", cssW / 2, cssH * 0.42);
    ctx.font = "600 15px Outfit, system-ui, sans-serif";
    ctx.fillStyle = "#c4b5fd";
    ctx.fillText("Goal is the dashed line at " + GOAL_FLOORS, cssW / 2, cssH * 0.42 + 28);
    ctx.textAlign = "left";
    ctx.restore();
  }

  for (const scrap of state.scraps) {
    const p = worldToScreen(scrap.x + scrap.w / 2, scrap.y + scrap.h / 2);
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(scrap.rot);
    ctx.globalAlpha = 0.85;
    const w = scrap.w * state.scale;
    const h = scrap.h * state.scale;
    roundRect(-w / 2, -h / 2, w, h, 6);
    ctx.fillStyle = "#8b7fd0";
    ctx.fill();
    ctx.restore();
  }
  updateDropCue();
}

function tick(now) {
  const dt = Math.min(0.05, last ? (now - last) / 1000 : 0.016);
  last = now;
  if (state.phase !== "over" && state.mover && !state.grab) {
    const limit = travel();
    state.mover.x += state.mover.dir * speed() * dt;
    if (state.mover.x < limit.lo) {
      state.mover.x = limit.lo;
      state.mover.dir = 1;
    } else if (state.mover.x + state.mover.w > limit.hi) {
      state.mover.x = limit.hi - state.mover.w;
      state.mover.dir = -1;
    }
  }
  for (const scrap of state.scraps) {
    scrap.vy += 980 * dt;
    scrap.y -= scrap.vy * dt;
    scrap.rot += scrap.spin * dt;
  }
  state.scraps = state.scraps.filter((s) => s.y > -400);
  const aim = targetScale();
  state.scale += (aim - state.scale) * Math.min(1, dt * 5);
  draw();
  requestAnimationFrame(tick);
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

function retry() {
  hideQuietToast();
  if (state.theater && state.theater.cancel) state.theater.cancel();
  state.theater = null;
  state.bet = null;
  if (retryBtn) retryBtn.classList.remove("is-needed");
  resetTower();
  syncBetBar();
  draw();
}

dropBtn.addEventListener("click", dropSlab);
retryBtn.addEventListener("click", retry);
document.getElementById("retry-now").addEventListener("click", retry);
assistBtn.addEventListener("click", () => {
  if (!state.cleared.first) {
    state.assist = true;
    assistBtn.setAttribute("aria-pressed", "true");
    setStatus("Assist", "Assist stays on until the first clear.", "");
    return;
  }
  state.assist = !state.assist;
  assistBtn.setAttribute("aria-pressed", state.assist ? "true" : "false");
  if (state.phase !== "over") {
    setStatus(
      state.assist ? "Assist" : "Ready",
      state.assist ? "Assist on. The slab moves slower." : "Assist off.",
      "",
    );
  }
});

canvas.addEventListener("pointerdown", (ev) => {
  canvas.focus();
  if (!state.mover || state.phase === "over") {
    if (ev.target === canvas) dropSlab();
    return;
  }
  const pt = eventPoint(ev);
  const grip = worldToScreen(state.mover.x + state.mover.w / 2, state.mover.y + state.mover.h);
  const near = Math.hypot(pt.x - grip.x, pt.y - grip.y) <= GRIP + 10;
  if (near) {
    state.grab = true;
    state.phase = "run";
    canvas.setPointerCapture(ev.pointerId);
    return;
  }
  if (ev.target === canvas) dropSlab();
});

canvas.addEventListener("pointermove", (ev) => {
  if (!state.grab || !state.mover) return;
  const pt = eventPoint(ev);
  const limit = travel();
  let x = (pt.x - cssW / 2) / state.scale - state.mover.w / 2;
  x = Math.max(limit.lo, Math.min(limit.hi - state.mover.w, x));
  state.mover.x = x;
});

canvas.addEventListener("pointerup", () => {
  if (!state.grab) return;
  state.grab = false;
  dropSlab();
});

function eventPoint(ev) {
  const rect = canvas.getBoundingClientRect();
  return { x: ev.clientX - rect.left, y: ev.clientY - rect.top };
}

window.addEventListener("keydown", (ev) => {
  if (ev.key === " " || ev.key === "Enter") {
    if (ev.target && (ev.target.tagName === "BUTTON" || ev.target.tagName === "A")) return;
    ev.preventDefault();
    dropSlab();
  }
});

readBest();
loadEngage();
if (readFlag(CALM_KEY)) document.documentElement.classList.add("calm-clear");
resetTower();
if (!state.cleared.first) {
  state.assist = true;
  if (assistBtn) assistBtn.setAttribute("aria-pressed", "true");
}
syncToysChip();
syncBetBar();

const helpApi = mountHelpOverlay({
  title: "How to play · Spire Lab",
  version: "SL 1.3.10",
  note: "What’s new: the chip says Toys n. Ghost You is the faint line.",
  classHref: "./changelog.html",
  calmKey: CALM_KEY,
  steps: [
    "Drop three slabs that stay. That is the first clear.",
    "Goal is the dashed line after that.",
    "If it misses, tap Retry.",
  ],
  onReplayIntro: () => {
    writeFlag(ASSIST_SEEN, false);
    openFirstAssist();
  },
});
wireEdgeHelp(document.getElementById("edge-btn"), document.getElementById("edge-menu"), helpApi.open);

const edgeBtn = document.getElementById("edge-btn");
const edgeMenu = document.getElementById("edge-menu");
if (edgeMenu) edgeMenu.hidden = true;

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
    setStatus("Bet", btn.dataset.bet === "hold" ? "You bet it’ll hold. Press Drop." : "You bet it’ll fall. Press Drop.", "");
  });
}

if (!readFlag(ASSIST_SEEN)) openFirstAssist();

resize();
window.addEventListener("resize", resize);
requestAnimationFrame(tick);
