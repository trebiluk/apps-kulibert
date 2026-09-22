// Spire Lab — one height-stand prove. Original draw. tower_game MIT math only.

import { GRIP, drawTether } from "../shared/stretch.js";

const KEY = "kulibert-spire-height-v1";
const SLAB_H = 26;
const BASE_W = 168;

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
  assist: true,
  phase: "ready",
  height: 0,
  best: 0,
  perfectCount: 0,
  slabs: [],
  mover: null,
  scraps: [],
  scale: 1,
  grab: null,
};

let cssW = 0;
let cssH = 0;
let last = 0;

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
  return blockX > lineX + calWidth * 0.8 && blockX < lineX + calWidth * 1.2;
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
  const base = state.assist ? 78 : 128;
  const climb = state.assist ? 7 : 18;
  const cap = state.assist ? 150 : 260;
  const v = base + state.height * climb;
  return (reduceMotion ? v * 0.6 : v) > cap ? cap : reduceMotion ? v * 0.6 : v;
}

function snapBand() {
  return state.assist ? 12 : 4.5;
}

function resetTower() {
  state.phase = "ready";
  state.height = 0;
  state.scraps = [];
  state.slabs = [{ x: -BASE_W / 2, y: 0, w: BASE_W, h: SLAB_H, base: true }];
  state.mover = {
    x: -BASE_W / 2 - 90,
    y: SLAB_H,
    w: BASE_W,
    h: SLAB_H,
    dir: 1,
  };
  heightN.textContent = "0";
  state.perfectCount = 0;
  showStreak();
  assistBtn.setAttribute("aria-pressed", state.assist ? "true" : "false");
  const best = state.best ? " Best " + state.best + "." : "";
  setStatus("Ready", "Drop the slab. Height is how many stay standing." + best, "");
}

function topSlab() {
  return state.slabs[state.slabs.length - 1];
}

function travel() {
  const top = topSlab();
  const pad = state.assist ? 64 : 110;
  return { lo: top.x - pad, hi: top.x + top.w + pad };
}

function dropSlab() {
  if (state.phase === "over") return;
  state.phase = "run";
  const top = topSlab();
  const mover = state.mover;
  const left = Math.max(mover.x, top.x);
  const right = Math.min(mover.x + mover.w, top.x + top.w);
  const overlap = right - left;
  if (overlap < 4) {
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
    heightN.textContent = String(state.height);
    setStatus("Miss", "The slab missed. Height " + state.height + ". Best " + state.best + ".", "fail");
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
  heightN.textContent = String(state.height);
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
  setStatus("Height", "Height " + state.height + ". Best " + state.best + "." + streakLine, "pass");
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
  ctx.strokeStyle = "#f8fafc";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(16, ground);
  ctx.lineTo(cssW - 16, ground);
  ctx.stroke();

  for (const slab of state.slabs) drawSlab(slab, 1);

  if (state.mover && state.phase !== "over") {
    drawSlab(state.mover, 1);
    const hook = { x: cssW / 2, y: 36 };
    const grip = worldToScreen(state.mover.x + state.mover.w / 2, state.mover.y + state.mover.h);
    drawTether(ctx, hook.x, hook.y, grip.x, grip.y);
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
  resetTower();
  draw();
}

dropBtn.addEventListener("click", dropSlab);
retryBtn.addEventListener("click", retry);
assistBtn.addEventListener("click", () => {
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
resetTower();
const edgeBtn = document.getElementById("edge-btn");
const edgeMenu = document.getElementById("edge-menu");
if (edgeBtn && edgeMenu) {
  edgeBtn.addEventListener("click", () => {
    const open = edgeMenu.hidden;
    edgeMenu.hidden = !open;
    edgeBtn.setAttribute("aria-expanded", open ? "true" : "false");
  });
}
resize();
window.addEventListener("resize", resize);
requestAnimationFrame(tick);
