/* Screen bands for Alice's Prairie. Pure geometry: no Phaser, no DOM. */

export const TAP = 48;
export const ALARM_MIN = 64;

export function decidePose(w, h, prev) {
  const ratio = h / Math.max(1, w);
  if (ratio >= 1.06) return "upright";
  if (ratio <= 0.94) return "sideways";
  if (prev === "upright" || prev === "sideways") return prev;
  return ratio >= 1 ? "upright" : "sideways";
}

let remembered = null;
export function poseNow(w, h) {
  remembered = decidePose(w, h, remembered);
  return remembered;
}
export function resetPose(next = null) { remembered = next; }

export function overlaps(a, b) {
  if (!a || !b) return false;
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

export function inside(a, w, h) {
  return a.x >= 0 && a.y >= 0 && a.x + a.w <= w && a.y + a.h <= h && a.w >= TAP && a.h >= TAP;
}

function box(x, y, w, h) {
  return { x: Math.round(x), y: Math.round(y), w: Math.round(w), h: Math.round(h) };
}

function mirrorRect(a, w) {
  return box(w - a.x - a.w, a.y, a.w, a.h);
}

function chromeButtons(w, h) {
  const gap = 8;
  const side = 8;
  const bh = TAP;
  const y = h < 420 ? 0 : 4;
  const chromeH = y + bh + (h < 420 ? 0 : 4);
  let pauseW = 76;
  let restartW = 84;
  const icons = TAP * 3;
  const base = side * 2 + pauseW + restartW + icons + gap * 4;
  const extra = Math.max(0, w - base);
  const pauseAdd = Math.min(28, extra);
  pauseW += pauseAdd;
  restartW += Math.min(36, extra - pauseAdd);
  const pause = box(side, y, pauseW, bh);
  const fs = box(pause.x + pause.w + gap, y, TAP, bh);
  const restart = box(w - side - restartW, y, restartW, bh);
  const help = box(restart.x - gap - TAP, y, TAP, bh);
  const read = box(help.x - gap - TAP, y, TAP, bh);
  return { chrome: box(0, 0, w, chromeH), pause, fs, read, help, restart };
}

function plateBox(w, h) {
  return box(6, h - 6 - TAP, Math.min(120, Math.max(96, Math.floor(w * 0.28))), TAP);
}

function grid(area, count, cols, gap) {
  const rows = Math.ceil(count / cols);
  const cw = Math.floor((area.w - gap * (cols - 1)) / cols);
  const ch = Math.floor((area.h - gap * (rows - 1)) / rows);
  const rects = [];
  for (let i = 0; i < count; i++) {
    const c = i % cols;
    const row = Math.floor(i / cols);
    rects.push(box(area.x + c * (cw + gap), area.y + row * (ch + gap), cw, ch));
  }
  return rects;
}

function layoutUp(w, h) {
  const c = chromeButtons(w, h);
  const plate = plateBox(w, h);
  const goal = box(6, c.chrome.h + 2, w - 12, 48);
  const thumbH = 68;
  const thumbTop = plate.y - 4 - thumbH;
  const gap = 8;
  const aw = Math.floor((w - 12 - gap * 2) / 3);
  const ay = thumbTop + Math.floor((thumbH - ALARM_MIN) / 2);
  const alarms = [0, 1, 2].map((i) => box(6 + i * (aw + gap), ay, aw, ALARM_MIN));
  const used = alarms[2].x + alarms[2].w;
  if (used < w - 6) alarms[2] = box(alarms[2].x, alarms[2].y, w - 6 - alarms[2].x, ALARM_MIN);
  const fieldY = goal.y + goal.h + 4;
  const field = box(6, fieldY, w - 12, Math.max(TAP, thumbTop - 4 - fieldY));
  const below = box(6, c.chrome.h + 4, w - 12, Math.max(TAP, plate.y - 4 - (c.chrome.h + 4)));
  const castH = Math.min(112, Math.max(72, Math.floor(below.h * 0.22)));
  const cast = box(below.x, below.y, below.w, castH);
  const tileArea = box(below.x, cast.y + cast.h + 6, below.w, Math.max(TAP, below.y + below.h - (cast.y + cast.h + 6)));
  const cols = w >= 700 ? 3 : 2;
  const tiles = grid(tileArea, 6, cols, 8);
  const chipH = TAP;
  const chipsArea = box(below.x, below.y, below.w, chipH);
  const chips = grid(chipsArea, 3, 3, 6);
  const cardArea = box(below.x, chipsArea.y + chipH + 6, below.w, Math.max(TAP, below.y + below.h - (chipsArea.y + chipH + 6)));
  const cardCols = w >= 700 ? 3 : 2;
  const cards = grid(cardArea, 6, cardCols, 8);
  const go = box(
    below.x + Math.floor(below.w / 2) - Math.min(160, Math.floor(below.w / 2) - 6),
    cardArea.y + Math.floor(cardArea.h / 2) - 36,
    Math.min(320, cardArea.w),
    72,
  );
  return { ...c, plate, goal, field, alarms, below, cast, tiles, chips, cards, go };
}

function layoutSide(w, h) {
  const c = chromeButtons(w, h);
  const plate = plateBox(w, h);
  const gapGoal = c.read.x - (c.fs.x + c.fs.w) - 8;
  const goal = gapGoal >= 140
    ? box(c.fs.x + c.fs.w + 4, c.fs.y, gapGoal, TAP)
    : box(6, c.chrome.h + 2, w - 12, 44);
  const top = Math.max(c.chrome.h, goal.y + goal.h) + 4;
  const bottom = plate.y - 4;
  const railW = Math.max(76, Math.min(112, Math.floor(w * 0.11)));
  const railH = Math.max(ALARM_MIN, bottom - top);
  const oneH = Math.max(72, Math.min(140, railH));
  const twoH = Math.max(ALARM_MIN, Math.min(112, Math.floor((railH - 8) / 2)));
  const left = box(6, top + Math.floor((railH - oneH) / 2), railW, oneH);
  const stack = twoH * 2 + 8;
  const y0 = top + Math.floor((railH - stack) / 2);
  const rightA = box(w - 6 - railW, y0, railW, twoH);
  const rightB = box(w - 6 - railW, y0 + twoH + 8, railW, twoH);
  const alarms = [left, rightA, rightB];
  const field = box(6 + railW + 6, top, w - 12 - (railW + 6) * 2, Math.max(TAP, bottom - top));
  const below = box(6, top, w - 12, Math.max(TAP, plate.y - 4 - top));
  const castH = Math.min(72, Math.max(56, Math.floor(below.h * 0.24)));
  const cast = box(below.x, below.y, below.w, castH);
  const tileArea = box(below.x, cast.y + cast.h + 4, below.w, Math.max(TAP, below.y + below.h - (cast.y + cast.h + 4)));
  const tiles = grid(tileArea, 6, 3, 6);
  const chips = grid(box(below.x, below.y, below.w, TAP), 3, 3, 6);
  const cardArea = box(below.x, below.y + TAP + 4, below.w, Math.max(TAP, below.y + below.h - (below.y + TAP + 4)));
  const cards = grid(cardArea, 6, 3, 6);
  const goW = Math.min(320, cardArea.w);
  const go = box(below.x + Math.floor((below.w - goW) / 2), cardArea.y + Math.max(0, Math.floor((cardArea.h - 64) / 2)), goW, 64);
  return { ...c, plate, goal, field, alarms, below, cast, tiles, chips, cards, go };
}

function fitHome(layout, w, h, pose) {
  const wide = pose === "sideways" || w >= 1366;
  const frac = wide ? 0.45 : 0.40;
  const cols = wide ? 3 : 2;
  const rows = Math.ceil(6 / cols);
  const gap = 6;
  const bandGap = 6;
  const minTiles = rows * TAP + gap * (rows - 1);
  const plateTop = layout.plate.y - 4;
  const want = Math.ceil(h * frac);
  const underChip = 4 + TAP + 4;
  let top = underChip;
  let maxCast = plateTop - top - bandGap - minTiles;
  if (maxCast < want) {
    top = 4;
    maxCast = plateTop - top - bandGap - minTiles;
  }
  const castH = Math.max(1, Math.min(want, maxCast));
  const area = layout.below;
  const cast = box(area.x, top, area.w, castH);
  const tileTop = cast.y + cast.h + bandGap;
  const tileArea = box(area.x, tileTop, area.w, Math.max(minTiles, plateTop - tileTop));
  layout.cast = cast;
  layout.tiles = grid(tileArea, 6, cols, gap);
}

function seedChip(layout, w) {
  const chipH = TAP;
  let chipW = Math.min(188, Math.max(128, Math.floor(w * 0.36)));
  if (chipW > w - 88) chipW = Math.max(96, w - 88);
  const y = 4;
  const leftGuard = { x: 0, y: 0, w: 72, h: 60 };
  const avoid = [leftGuard, layout.fs, layout.plate, ...layout.tiles];
  const spots = [w - 8 - chipW, Math.floor((w - chipW) / 2), 80];
  for (let i = 0; i < spots.length; i++) {
    const x = Math.max(0, Math.min(w - chipW, spots[i]));
    const chip = box(x, y, chipW, chipH);
    let hit = false;
    for (let j = 0; j < avoid.length; j++) if (overlaps(chip, avoid[j])) hit = true;
    if (!hit) return chip;
  }
  return box(Math.max(0, w - 8 - chipW), y, chipW, chipH);
}

function mirrorLayout(layout, w) {
  const out = { pose: layout.pose, w: layout.w, h: layout.h };
  for (const [key, value] of Object.entries(layout)) {
    if (key === "pose" || key === "w" || key === "h") continue;
    if (Array.isArray(value)) out[key] = value.map((item) => mirrorRect(item, w));
    else if (value && typeof value.x === "number") out[key] = mirrorRect(value, w);
    else out[key] = value;
  }
  return out;
}

export function bands(w, h, opts = {}) {
  const pose = opts.pose || decidePose(opts.viewW || w, opts.viewH || h, opts.prev);
  const layout = pose === "sideways" ? layoutSide(w, h) : layoutUp(w, h);
  fitHome(layout, w, h, pose);
  layout.pose = pose;
  layout.w = w;
  layout.h = h;
  const out = opts.rtl ? mirrorLayout(layout, w) : layout;
  out.seeds = seedChip(out, w);
  return out;
}

export function lookoutControls(b) {
  return [b.fs, b.pause, b.read, b.help, b.restart, b.plate, b.goal, ...b.alarms];
}
export function homeControls(b) {
  return [b.fs, b.plate, b.seeds, ...b.tiles];
}
export function pickerControls(b) {
  return [b.fs, b.plate, ...b.chips, ...b.cards];
}
export function goControls(b) {
  return [b.fs, b.plate, ...b.chips, b.go];
}
