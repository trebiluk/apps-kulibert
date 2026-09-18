import { APP_CHIP } from "./version.js";
import {
  PIECE_CAP,
  defaultDoc,
  defaultLevel,
  packDoc,
  unpackDoc,
  downloadDoc,
  readFile,
  sanitizeTitle,
} from "./io.js";

const NAVY = "#0b1f3a";
const ORANGE = "#e87722";
const PAPER = "#f4efe6";
const CRATE = "#c45c26";
const INK = "#1a1a1a";
const OK = "#2f6f4e";
const STEEL = "#5b6d7c";
const CONCRETE = "#24384c";
const YARD = "#f4efe6";
const PLY = "#eadcc3";

const WORLD_W = 28;
const WORLD_H = 16;
const WHEEL_R = 0.38;
const BAR_T = 0.11;
const CORE_S = 0.55;
const SNAP = 0.32;
const HIT = 0.16;
const DRAG_PX = 7;
const MAX_BAR = 4.2;
const MIN_BAR = 0.4;
const GRAVITY = -18;
const DT = 1 / 60;
const DRIVE_TORQUE = 11.5;
const MAX_OMEGA = 13;
const WIN_SECS = 1;

const CAT = { WORLD: 0x0001, STEEL: 0x0002, GHOST: 0x0004, WHEEL: 0x0008, CORE: 0x0010 };

const BUILTIN = [
  { id: "open", label: "Open Shop", url: null },
  { id: "roll", label: "Roll Out", url: "levels/roll-out.json" },
  { id: "curb", label: "Up the Curb", url: "levels/up-the-curb.json" },
  { id: "pit", label: "Mind the Pit", url: "levels/mind-the-pit.json" },
  { id: "wall", label: "The Wall", url: "levels/the-wall.json" },
  { id: "shelf", label: "High Shelf", url: "levels/high-shelf.json" },
  { id: "bend", label: "Around the Bend", url: "levels/around-the-bend.json" },
  { id: "pair", label: "Pair of Crates", url: "levels/pair-of-crates.json" },
];

const STEPS = ["ask", "imagine", "plan", "create", "test", "improve"];

const HOWTO = [
  {
    title: "Park the crate",
    body: "Job: Bot Core in the Drop Zone for one second. Watch the crate roll in.",
  },
  {
    title: "Parts do jobs",
    body: "Drive-R goes right. Drive-L goes left. Steel is a silver bar. Ghost is dashed — it misses the machine.",
  },
  {
    title: "Build, then Play",
    body: "Drag a wheel onto a hub. Then Play. Stop puts the shop back.",
  },
  {
    title: "Lean machines earn more",
    body: "Same job, fewer parts = more XP. Rank stays on this Chromebook. No names.",
  },
];

const RANKS = [
  { name: "Helper", at: 0 },
  { name: "Apprentice", at: 20 },
  { name: "Builder", at: 55 },
  { name: "Lead", at: 110 },
  { name: "Shop tech", at: 180 },
];

const PAR = { open: 5, roll: 4, curb: 7, pit: 8, wall: 9, shelf: 10, bend: 10, pair: 12 };

const GUIDE = {
  open: {
    ask: "Ask: park the Bot Core crate in the Drop Zone. That is the job.",
    imagine: "Imagine: Drive-R / Drive-L (energy), Roller, Steel (structure), Ghost (misses the machine).",
    plan: "Plan: build only on the Shop Floor. 48-part cap. Pair — builder places, observer watches the crate.",
    create: "Create: drag a wheel onto a hub. Steel pulls from a node. Starter cart is a pusher, not a finished design.",
    test: "Test: Play. Gravity and Drive are inputs. The orange trail is feedback. Stop restores the shop.",
    improve: "Improve: change one thing, test again. Save a course title only — no names in the file.",
    system: "Open Shop is a straight process path. Input energy on the floor, process through the machine, output the crate into the zone.",
  },
  roll: {
    ask: "Ask: Roll Out. Flat floor. Crate starts on the Shop Floor. Drop Zone is to the right.",
    imagine: "Imagine a low pusher: Roller + Steel + Drive-R. Energy in the Drive, structure in the Steel, payload is the crate.",
    plan: "Plan a machine that stays on the slab. Do not climb. Do not jump. Slide the crate.",
    create: "Create on the Shop Floor, then put the crate in front of the axle — not under it. Starter cart is legal here.",
    test: "Test: Play. Watch the trail. If the crate spins in place, the process is fighting itself.",
    improve: "Improve: one change (longer bar, extra Roller, less overlap). Then Test again.",
    system: "Roll Out — Input: Drive torque + gravity. Process: floor pusher. Output: crate slides right. Feedback: trail. Constraint: stay on the slab.",
  },
  curb: {
    ask: "Ask: Up the Curb. The Drop Zone sits on a higher slab. The crate has to gain height.",
    imagine: "Imagine a ramp, a lift, or a machine that climbs. A floor pusher is not a curb solution.",
    plan: "Plan the height change as part of the process. Measure the curb with your eye before you place parts.",
    create: "Create on the Shop Floor only. The curb is world, not a part. Ghost can touch world + crate.",
    test: "Test: if the crate slams the face of the curb, the output never reaches the zone. Slow-mo the fail.",
    improve: "Improve the process, not the goal. The Drop Zone does not move. Your machine does.",
    system: "Up the Curb — Input energy must lift the payload. The curb is a constraint in the process path. Output is up, not just right.",
  },
  pit: {
    ask: "Ask: Mind the Pit. There is a gap in the world. The crate cannot fall in.",
    imagine: "Imagine a bridge, a long reach, or a launch that clears the pit. Falling is a failed output.",
    plan: "Plan the path across the missing slab. Ghost can span world without snagging the machine.",
    create: "Create the crossing on the Shop Floor. Do not fill the pit by editing the course unless you are in Level layer.",
    test: "Test: Slow if it dives. Feedback is the trail disappearing into the gap.",
    improve: "Improve one subsystem: longer structure, different Drive side, or a Ghost rail.",
    system: "Mind the Pit — the world is a system with a missing process path. Input still works; output fails if the payload leaves the path.",
  },
  wall: {
    ask: "Ask: The Wall. A slab stands between Shop Floor and Drop Zone.",
    imagine: "Imagine going over, around, or through with Ghost. A floor pusher hits the wall and stops.",
    plan: "Plan which subsystem beats the wall: structure over it, or Ghost that ignores the machine.",
    create: "Create on the Shop Floor. The wall is a constraint, not a part you erase in Machine layer.",
    test: "Test: Slow the impact. If energy dies at the wall, the process path is blocked.",
    improve: "Improve the path, not the torque only. More Drive into a wall is still a wall.",
    system: "The Wall — a constraint in the process. Feedback is a dead stop. Output is on the far side.",
  },
  shelf: {
    ask: "Ask: High Shelf. The Drop Zone is up. Height is the job.",
    imagine: "Imagine stacking, climbing, or lifting. Starter cart stays on the floor.",
    plan: "Plan vertical process, not just horizontal push.",
    create: "Create within the Shop Floor. Reach out, then up.",
    test: "Test the lift. Slow the moment it falls off the shelf.",
    improve: "Improve support under the crate, not only speed.",
    system: "High Shelf — input energy vs gravity as competing inputs. Output is a raised crate that stays put.",
  },
  bend: {
    ask: "Ask: Around the Bend. The path is not a straight line.",
    imagine: "Imagine a machine that turns, or a sequence of pushes.",
    plan: "Plan the corner before the Drive. Observer calls the turn.",
    create: "Create a process that still fits the Shop Floor.",
    test: "Test: trail should bend with the world, not into a wall.",
    improve: "Improve timing and contact, not part count first.",
    system: "Around the Bend — process path has a direction change. Feedback is a trail that corners or a crate that wedges.",
  },
  pair: {
    ask: "Ask: Pair of Crates. Every Bot Core must stay in the Drop Zone — one crate is not enough.",
    imagine: "Imagine one machine that moves both, or two subsystems that do not fight.",
    plan: "Plan both payloads. Win = all crates inside for one second.",
    create: "Create without parking one crate on the other as a cheat you cannot explain.",
    test: "Test both. If one leaves, the system failed.",
    improve: "Improve the weaker crate’s path first.",
    system: "Pair of Crates — two payloads, one output rule. Subsystems can share Drive or split. Feedback is two trails.",
  },
};

function toast(msg) {
  const el = document.getElementById("toast");
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(toast._t);
  toast._t = setTimeout(() => el.classList.remove("show"), 2200);
}

function inRect(x, y, r) {
  return x >= r.x && y >= r.y && x <= r.x + r.w && y <= r.y + r.h;
}

function rectsOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function dist(a, b) {
  const dx = a.x - b.x, dy = a.y - b.y;
  return Math.hypot(dx, dy);
}

function partNodes(p) {
  if (p.type === "driveR" || p.type === "driveL" || p.type === "roller") {
    const n = [{ x: p.x, y: p.y, kind: "hub" }];
    for (let i = 0; i < 4; i++) {
      const a = (p.a || 0) + i * Math.PI / 2;
      n.push({ x: p.x + Math.cos(a) * WHEEL_R, y: p.y + Math.sin(a) * WHEEL_R, kind: "rim" });
    }
    return n;
  }
  if (p.type === "steel" || p.type === "ghost") {
    return [
      { x: p.x1, y: p.y1, kind: "end" },
      { x: p.x2, y: p.y2, kind: "end" },
    ];
  }
  if (p.type === "core") {
    const h = CORE_S / 2;
    return [
      { x: p.x, y: p.y, kind: "hub" },
      { x: p.x + h, y: p.y, kind: "side" },
      { x: p.x - h, y: p.y, kind: "side" },
      { x: p.x, y: p.y + h, kind: "side" },
      { x: p.x, y: p.y - h, kind: "side" },
    ];
  }
  return [];
}

function pieceCount(doc) {
  return (doc.machine.parts || []).length;
}

export function boot() {
  if (typeof planck === "undefined") {
    toast("Physics library missing (vendor/planck.min.js).");
    return;
  }

  const canvas = document.getElementById("c");
  const ctx = canvas.getContext("2d");
  const fileOpen = document.getElementById("file-open");
  const titleEl = document.getElementById("title");
  const chipEl = document.getElementById("chip");
  const countEl = document.getElementById("count");
  const modeEl = document.getElementById("mode");
  const winEl = document.getElementById("win");

  chipEl.textContent = APP_CHIP;

  const view = { scale: 36, ox: 0, oy: 0, dpr: 1, zoom: 1, panx: 0, pany: 0 };
  let doc = defaultDoc();
  let tool = "driveR";
  let layer = "machine"; // machine | level
  let playing = false;
  let slowMo = false;
  let acc = 0;
  let last = performance.now();
  let sim = null;
  let hover = null;
  let drag = null;
  let activePtr = null;
  let winT = 0;
  let won = false;
  let dirty = false;
  let history = [];
  let trail = [];
  let panning = null;
  let courseId = "open";
  let everTested = false;
  let pinnedStep = null;
  let guideOn = true;
  let howtoIndex = 0;
  let progress = { xp: 0, wins: {} };
  try {
    const raw = localStorage.getItem("bb-progress-v1");
    if (raw) {
      const p = JSON.parse(raw);
      if (p && typeof p.xp === "number") progress = { xp: p.xp, wins: p.wins || {} };
    }
  } catch (e) { /* private mode */ }

  titleEl.value = doc.title;

  function worldFromEvent(ev) {
    const r = canvas.getBoundingClientRect();
    const sx = (ev.clientX - r.left) * view.dpr;
    const sy = (ev.clientY - r.top) * view.dpr;
    return {
      x: (sx - view.ox) / view.scale,
      y: (canvas.height - sy - view.oy) / view.scale,
    };
  }

  function fit() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    view.dpr = dpr;
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.max(1, Math.round(rect.width * dpr));
    canvas.height = Math.max(1, Math.round(rect.height * dpr));
    const pad = 16 * dpr;
    const sx = (canvas.width - pad * 2) / WORLD_W;
    const sy = (canvas.height - pad * 2) / WORLD_H;
    view.scale = Math.min(sx, sy) * view.zoom;
    view.ox = (canvas.width - WORLD_W * view.scale) / 2 + view.panx;
    view.oy = (canvas.height - WORLD_H * view.scale) / 2 + view.pany;
  }

  function wx(x) { return Math.round(view.ox + x * view.scale); }
  function wy(y) { return Math.round(canvas.height - (view.oy + y * view.scale)); }
  function wr(n) { return n * view.scale; }

  function setTool(id) {
    tool = id;
    document.querySelectorAll("[data-tool]").forEach((b) => {
      b.classList.toggle("on", b.getAttribute("data-tool") === id);
    });
  }

  function setLayer(id) {
    layer = id;
    document.querySelectorAll("[data-layer]").forEach((b) => {
      b.classList.toggle("on", b.getAttribute("data-layer") === id);
    });
    document.getElementById("level-tools").hidden = id !== "level";
    const mt = document.getElementById("machine-tools");
    if (mt) mt.hidden = id !== "machine";
    if (id === "level" && playing) stopPlay();
    refreshGuide();
  }

  function autoStep() {
    if (playing) return "test";
    if (everTested) return "improve";
    if (pieceCount(doc) > 0) return "create";
    if (layer === "level") return "plan";
    return "ask";
  }

  function guideFor(step) {
    const pack = GUIDE[courseId] || GUIDE.open;
    return pack[step] || GUIDE.open.ask;
  }

  function refreshGuide() {
    const guideEl = document.getElementById("guide");
    const lineEl = document.getElementById("guide-line");
    const sysCourse = document.getElementById("systems-course");
    const hintEl = document.getElementById("status-hint");
    const guideBtn = document.getElementById("btn-guide");
    if (!guideEl || !lineEl) return;
    guideEl.classList.toggle("off", !guideOn);
    if (guideBtn) {
      guideBtn.textContent = guideOn ? "Guide on" : "Guide off";
      guideBtn.setAttribute("aria-pressed", guideOn ? "true" : "false");
    }
    const step = pinnedStep && STEPS.includes(pinnedStep) ? pinnedStep : autoStep();
    document.querySelectorAll(".step").forEach((b) => {
      const on = b.getAttribute("data-step") === step;
      b.classList.toggle("on", on);
      b.setAttribute("aria-selected", on ? "true" : "false");
    });
    const text = guideFor(step);
    lineEl.textContent = text;
    if (hintEl) hintEl.textContent = text;
    const pack = GUIDE[courseId] || GUIDE.open;
    if (sysCourse) sysCourse.textContent = pack.system;
  }

  function resetLoop(id) {
    if (id) courseId = id;
    everTested = false;
    pinnedStep = null;
    refreshGuide();
  }

  function showHowto(i) {
    howtoIndex = Math.max(0, i);
    const root = document.getElementById("howto");
    const title = document.getElementById("howto-title");
    const body = document.getElementById("howto-body");
    const next = document.getElementById("howto-next");
    if (!root || !title || !body) return;
    const card = HOWTO[howtoIndex] || HOWTO[0];
    title.textContent = card.title;
    body.textContent = card.body;
    if (next) next.textContent = howtoIndex >= HOWTO.length - 1 ? "Try Roll Out" : "Next";
    root.hidden = false;
  }

  function hideHowto() {
    const root = document.getElementById("howto");
    if (root) root.hidden = true;
    try { localStorage.setItem("bb-howto-v2", "1"); } catch (e) { /* private mode */ }
  }

  function rankAt(xp) {
    let cur = RANKS[0];
    for (const r of RANKS) if (xp >= r.at) cur = r;
    return cur;
  }

  function saveProgress() {
    try { localStorage.setItem("bb-progress-v1", JSON.stringify(progress)); } catch (e) { /* private mode */ }
  }

  function refreshRank() {
    const nameEl = document.getElementById("rank-name");
    const fill = document.getElementById("xp-fill");
    const nEl = document.getElementById("xp-n");
    const bar = document.getElementById("xp-bar");
    const rank = rankAt(progress.xp);
    const idx = RANKS.indexOf(rank);
    const next = RANKS[idx + 1];
    const span = next ? next.at - rank.at : 40;
    const into = next ? progress.xp - rank.at : span;
    const pct = Math.max(0, Math.min(100, (into / span) * 100));
    if (nameEl) nameEl.textContent = rank.name;
    if (fill) fill.style.width = `${pct}%`;
    if (nEl) nEl.textContent = `${progress.xp} XP`;
    if (bar) {
      bar.setAttribute("aria-valuenow", String(progress.xp));
      bar.setAttribute("aria-valuemax", String(next ? next.at : rank.at + span));
      bar.setAttribute("aria-label", `${rank.name}, ${progress.xp} XP`);
    }
  }

  function awardWin() {
    const parts = pieceCount(doc);
    const par = PAR[courseId] || 8;
    const lean = Math.max(0, par - parts);
    const rec = progress.wins[courseId];
    const first = !rec;
    const better = rec && parts < rec.bestParts;
    let gain = first ? 12 : 3;
    if (first || better) gain += 6 + lean * 3;
    else gain += Math.min(3, lean);
    const before = rankAt(progress.xp).name;
    progress.xp += gain;
    progress.wins[courseId] = {
      bestParts: Math.min(parts, rec ? rec.bestParts : parts),
      n: (rec && rec.n ? rec.n : 0) + 1,
    };
    saveProgress();
    refreshRank();
    const after = rankAt(progress.xp).name;
    if (after !== before) toast(`${after} rank. Lean machines earn more XP.`);
    else toast(`+${gain} XP · ${parts} parts${lean > 0 ? " · lean bonus" : ""}. In the zone.`);
  }

  function showSystems(on) {
    const root = document.getElementById("systems");
    if (!root) return;
    refreshGuide();
    root.hidden = !on;
  }

  function tightHud() {
    return window.matchMedia("(orientation: portrait) and (max-width: 900px)").matches
      || window.innerHeight < 500;
  }

  function showCrew(on) {
    const root = document.getElementById("crew");
    const btn = document.getElementById("btn-crew");
    if (!root) return;
    root.hidden = !on;
    if (btn) btn.setAttribute("aria-expanded", on ? "true" : "false");
    if (on) hideHowto();
  }

  function setPacket(on) {
    const d = document.getElementById("guide-drawer");
    const b = document.getElementById("btn-packet");
    if (!d) return;
    d.hidden = !on;
    if (b) b.setAttribute("aria-expanded", on ? "true" : "false");
    const rail = document.getElementById("rail");
    if (on && rail) rail.classList.add("open");
  }

  function tryWide() {
    const lock = screen.orientation && screen.orientation.lock
      ? screen.orientation.lock("landscape")
      : Promise.reject();
    lock.catch(() => toast("Flip the phone sideways — this shop is landscape."));
  }

  function refreshMeta() {
    titleEl.value = doc.title;
    countEl.textContent = `${pieceCount(doc)} / ${PIECE_CAP}`;
    modeEl.textContent = playing ? (slowMo ? "Slow" : "Play") : "Shop";
    const slowBtn = document.getElementById("btn-slow");
    if (slowBtn) slowBtn.classList.toggle("on", slowMo);
    refreshGuide();
    refreshRank();
  }

  function pushHist() {
    history.push(JSON.stringify(doc.machine.parts));
    if (history.length > 24) history.shift();
  }

  function undo() {
    if (playing) return;
    const prev = history.pop();
    if (!prev) { toast("Nothing to undo."); return; }
    doc.machine.parts = JSON.parse(prev);
    dirty = true;
    refreshMeta();
  }

  function allNodes() {
    const list = [];
    for (const p of doc.machine.parts) {
      partNodes(p).forEach((n, i) => list.push({ part: p, i, ...n }));
    }
    return list;
  }

  function nearestNode(pt, max = SNAP, skipPart) {
    let best = null, bd = max;
    for (const n of allNodes()) {
      if (skipPart && n.part === skipPart) continue;
      const d = dist(pt, n);
      if (d < bd) { bd = d; best = n; }
    }
    return best;
  }

  function snapPt(pt, skipPart) {
    const n = nearestNode(pt, SNAP * 1.55, skipPart);
    return n ? { x: n.x, y: n.y, node: n } : { x: pt.x, y: pt.y, node: null };
  }

  function translatePart(p, dx, dy) {
    if (p.x != null) { p.x += dx; p.y += dy; }
    if (p.x1 != null) {
      p.x1 += dx; p.y1 += dy;
      p.x2 += dx; p.y2 += dy;
    }
  }

  function snapPartToHub(p) {
    const nodes = partNodes(p);
    let best = null, bd = SNAP * 1.55;
    for (const n of nodes) {
      const hit = nearestNode(n, SNAP * 1.55, p);
      if (!hit) continue;
      const d = dist(n, hit);
      if (d < bd) { bd = d; best = { from: n, to: hit }; }
    }
    if (!best) return false;
    translatePart(p, best.to.x - best.from.x, best.to.y - best.from.y);
    return true;
  }

  function hitPart(pt) {
    for (let i = doc.machine.parts.length - 1; i >= 0; i--) {
      const p = doc.machine.parts[i];
      if (p.type === "driveR" || p.type === "driveL" || p.type === "roller") {
        if (dist(pt, p) <= WHEEL_R + HIT) return p;
      } else if (p.type === "core") {
        if (Math.abs(pt.x - p.x) <= CORE_S / 2 + HIT && Math.abs(pt.y - p.y) <= CORE_S / 2 + HIT) return p;
      } else if (p.type === "steel" || p.type === "ghost") {
        const d = pointSeg(pt, { x: p.x1, y: p.y1 }, { x: p.x2, y: p.y2 });
        if (d <= BAR_T + HIT) return p;
      }
    }
    return null;
  }

  function pointSeg(p, a, b) {
    const vx = b.x - a.x, vy = b.y - a.y;
    const len2 = vx * vx + vy * vy || 1e-8;
    let t = ((p.x - a.x) * vx + (p.y - a.y) * vy) / len2;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(p.x - (a.x + t * vx), p.y - (a.y + t * vy));
  }

  function hitSlab(pt) {
    const world = doc.level.world || [];
    for (let i = world.length - 1; i >= 0; i--) {
      const s = world[i];
      if (inRect(pt.x, pt.y, s)) return { kind: "slab", i, s };
    }
    for (let i = (doc.level.cores || []).length - 1; i >= 0; i--) {
      const c = doc.level.cores[i];
      if (Math.abs(pt.x - c.x) < 0.4 && Math.abs(pt.y - c.y) < 0.4) return { kind: "core", i, s: c };
    }
    return null;
  }

  function canPlaceWheel(pt) {
    return inRect(pt.x, pt.y, doc.level.shop);
  }

  function addPart(p) {
    if (pieceCount(doc) >= PIECE_CAP) {
      toast("Piece cap 48. Erase something first.");
      return false;
    }
    pushHist();
    doc.machine.parts.push(p);
    dirty = true;
    refreshMeta();
    return true;
  }

  function startPlay() {
    if (playing) return;
    try {
      sim = buildSim(doc);
    } catch (err) {
      toast(String(err.message || err));
      return;
    }
    playing = true;
    won = false;
    winT = 0;
    trail = [];
    everTested = true;
    pinnedStep = null;
    winEl.classList.remove("show");
    refreshMeta();
  }

  function stopPlay() {
    playing = false;
    sim = null;
    won = false;
    winT = 0;
    winEl.classList.remove("show");
    refreshMeta();
  }

  function buildSim(source) {
    const pl = planck;
    const world = pl.World(pl.Vec2(0, GRAVITY));
    const staticFix = { friction: 0.7, restitution: 0.05, filterCategoryBits: CAT.WORLD, filterMaskBits: 0xffff };

    for (const s of source.level.world || []) {
      const body = world.createBody();
      const hx = s.w / 2, hy = s.h / 2;
      body.createFixture(pl.Box(hx, hy, pl.Vec2(s.x + hx, s.y + hy), 0), staticFix);
    }

    const bodies = [];
    const cores = [];

    function filterFor(type) {
      if (type === "ghost") return { filterCategoryBits: CAT.GHOST, filterMaskBits: CAT.WORLD | CAT.CORE };
      if (type === "steel") return { filterCategoryBits: CAT.STEEL, filterMaskBits: CAT.WORLD | CAT.STEEL | CAT.WHEEL | CAT.CORE };
      if (type === "core") return { filterCategoryBits: CAT.CORE, filterMaskBits: CAT.WORLD | CAT.STEEL | CAT.GHOST | CAT.WHEEL | CAT.CORE };
      return { filterCategoryBits: CAT.WHEEL, filterMaskBits: CAT.WORLD | CAT.STEEL | CAT.WHEEL | CAT.CORE };
    }

    function addCircle(p, r, density, fric) {
      const b = world.createDynamicBody(pl.Vec2(p.x, p.y));
      b.setAngle(p.a || 0);
      b.createFixture(pl.Circle(r), { density, friction: fric, restitution: 0.05, ...filterFor(p.type) });
      b.setUserData({ type: p.type, part: p });
      return b;
    }

    function addBar(p) {
      const mx = (p.x1 + p.x2) / 2, my = (p.y1 + p.y2) / 2;
      const len = Math.max(MIN_BAR, dist({ x: p.x1, y: p.y1 }, { x: p.x2, y: p.y2 }));
      const ang = Math.atan2(p.y2 - p.y1, p.x2 - p.x1);
      const b = world.createDynamicBody();
      b.setPosition(pl.Vec2(mx, my));
      b.setAngle(ang);
      const dens = p.type === "ghost" ? 0.45 : 0.9;
      b.createFixture(pl.Box(len / 2, BAR_T / 2), {
        density: dens, friction: p.type === "ghost" ? 0.15 : 0.45, restitution: 0.02, ...filterFor(p.type),
      });
      b.setUserData({ type: p.type, part: p });
      return b;
    }

    function addCore(c, fromPart) {
      const b = world.createDynamicBody(pl.Vec2(c.x, c.y));
      b.createFixture(pl.Box(CORE_S / 2, CORE_S / 2), {
        density: 1.1, friction: 0.55, restitution: 0.08, ...filterFor("core"),
      });
      b.setUserData({ type: "core", part: fromPart || c });
      cores.push(b);
      return b;
    }

    const machineBodies = [];
    for (const p of source.machine.parts) {
      let b = null;
      if (p.type === "driveR" || p.type === "driveL" || p.type === "roller") b = addCircle(p, WHEEL_R, 1.0, 1.45);
      else if (p.type === "steel" || p.type === "ghost") b = addBar(p);
      else if (p.type === "core") b = addCore(p, p);
      if (b) {
        bodies.push({ part: p, body: b });
        machineBodies.push({ part: p, body: b });
      }
    }

    const placed = new Set();
    for (const c of source.level.cores || []) {
      const key = `${c.x.toFixed(2)},${c.y.toFixed(2)}`;
      const already = machineBodies.some((m) => m.part.type === "core" && dist(m.part, c) < 0.2);
      if (!already && !placed.has(key)) {
        const b = addCore(c);
        bodies.push({ part: { type: "core", x: c.x, y: c.y }, body: b });
        placed.add(key);
      }
    }

    const nodeList = [];
    for (const item of bodies) {
      const p = item.part;
      const b = item.body;
      if (p.type === "driveR" || p.type === "driveL" || p.type === "roller") {
        nodeList.push({ body: b, lx: 0, ly: 0, wx: () => b.getWorldPoint(pl.Vec2(0, 0)) });
        for (let i = 0; i < 4; i++) {
          const a = i * Math.PI / 2;
          const lx = Math.cos(a) * WHEEL_R, ly = Math.sin(a) * WHEEL_R;
          nodeList.push({ body: b, lx, ly, wx: () => b.getWorldPoint(pl.Vec2(lx, ly)) });
        }
      } else if (p.type === "steel" || p.type === "ghost") {
        const len = Math.max(MIN_BAR, dist({ x: p.x1, y: p.y1 }, { x: p.x2, y: p.y2 }));
        nodeList.push({ body: b, lx: -len / 2, ly: 0, wx: () => b.getWorldPoint(pl.Vec2(-len / 2, 0)) });
        nodeList.push({ body: b, lx: len / 2, ly: 0, wx: () => b.getWorldPoint(pl.Vec2(len / 2, 0)) });
      } else if (p.type === "core") {
        const h = CORE_S / 2;
        [[0, 0], [h, 0], [-h, 0], [0, h], [0, -h]].forEach(([lx, ly]) => {
          nodeList.push({ body: b, lx, ly, wx: () => b.getWorldPoint(pl.Vec2(lx, ly)) });
        });
      }
    }

    const joined = new Set();
    for (let i = 0; i < nodeList.length; i++) {
      const A = nodeList[i];
      const pa = A.wx();
      for (let j = i + 1; j < nodeList.length; j++) {
        const B = nodeList[j];
        if (A.body === B.body) continue;
        const pb = B.wx();
        if (Math.hypot(pa.x - pb.x, pa.y - pb.y) > SNAP) continue;
        const key = A.body === B.body ? "" : [i, j].join("-");
        if (joined.has(key)) continue;
        joined.add(key);
        const anchor = pl.Vec2((pa.x + pb.x) / 2, (pa.y + pb.y) / 2);
        world.createJoint(pl.RevoluteJoint({ collideConnected: false }, A.body, B.body, anchor));
      }
    }

    return { world, bodies, cores };
  }

  function stepSim(n) {
    if (!sim) return;
    for (let k = 0; k < n; k++) {
      for (const item of sim.bodies) {
        const t = item.part.type;
        if (t === "driveR" || t === "driveL") {
          const dir = t === "driveR" ? -1 : 1;
          const w = item.body.getAngularVelocity();
          if (Math.abs(w) < MAX_OMEGA) item.body.applyTorque(dir * DRIVE_TORQUE);
          else item.body.setAngularVelocity(Math.sign(w) * MAX_OMEGA);
        }
      }
      sim.world.step(DT, 8, 3);
    }
    if (sim.cores[0]) {
      const p = sim.cores[0].getPosition();
      trail.push({ x: p.x, y: p.y });
      if (trail.length > 90) trail.shift();
    }
    checkWin();
  }

  function checkWin() {
    if (!sim || won) return;
    const drop = doc.level.drop;
    let inside = 0;
    for (const b of sim.cores) {
      const p = b.getPosition();
      if (inRect(p.x, p.y, drop)) inside++;
    }
    if (sim.cores.length && inside === sim.cores.length) {
      winT += DT;
      if (winT >= WIN_SECS) {
        won = true;
        winEl.classList.add("show");
        slowMo = true;
        pinnedStep = "improve";
        awardWin();
        refreshMeta();
      }
    } else winT = 0;
  }

  function hatchRect(r, color, gapWorld) {
    const x = wx(r.x), y = wy(r.y + r.h), w = wr(r.w), h = wr(r.h);
    const step = Math.max(7, wr(gapWorld || 0.38));
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    for (let i = -h; i < w + h; i += step) {
      ctx.beginPath();
      ctx.moveTo(x + i, y);
      ctx.lineTo(x + i - h, y + h);
      ctx.stroke();
    }
    ctx.restore();
  }

  function plyRect(r, fill) {
    const x = wx(r.x), y = wy(r.y + r.h), w = wr(r.w), h = wr(r.h);
    ctx.fillStyle = fill;
    ctx.fillRect(x, y, w, h);
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();
    ctx.strokeStyle = "rgba(26,26,26,0.14)";
    ctx.lineWidth = 1;
    const g = Math.max(5, wr(0.22));
    for (let i = x + g; i < x + w; i += g) {
      ctx.beginPath();
      ctx.moveTo(i, y);
      ctx.lineTo(i, y + h);
      ctx.stroke();
    }
    ctx.restore();
  }

  function hazardFrame(r) {
    const x = wx(r.x), y = wy(r.y + r.h), w = wr(r.w), h = wr(r.h);
    const t = Math.max(5, wr(0.14));
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.rect(x + t, y + t, Math.max(1, w - 2 * t), Math.max(1, h - 2 * t));
    ctx.clip("evenodd");
    const step = Math.max(8, wr(0.28));
    for (let i = -h; i < w + h; i += step) {
      ctx.fillStyle = (Math.floor(i / step) % 2 === 0) ? ORANGE : INK;
      ctx.beginPath();
      ctx.moveTo(x + i, y);
      ctx.lineTo(x + i + step * 0.55, y);
      ctx.lineTo(x + i + step * 0.55 - h, y + h);
      ctx.lineTo(x + i - h, y + h);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, h);
    ctx.strokeRect(x + t, y + t, Math.max(1, w - 2 * t), Math.max(1, h - 2 * t));
  }

  function drawCapsule(x1, y1, x2, y2, fill, stroke, dash) {
    const ang = Math.atan2(y2 - y1, x2 - x1);
    const len = Math.hypot(x2 - x1, y2 - y1);
    const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
    ctx.save();
    ctx.translate(wx(mx), wy(my));
    ctx.rotate(-ang);
    const hw = wr(len / 2), hh = wr(BAR_T / 2);
    ctx.beginPath();
    const r = Math.abs(hh);
    ctx.moveTo(-hw + r, -hh);
    ctx.lineTo(hw - r, -hh);
    ctx.arc(hw - r, 0, r, -Math.PI / 2, Math.PI / 2);
    ctx.lineTo(-hw + r, hh);
    ctx.arc(-hw + r, 0, r, Math.PI / 2, -Math.PI / 2);
    ctx.closePath();
    if (dash) ctx.setLineDash([6, 5]);
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  function drawIBeam(x1, y1, x2, y2) {
    drawCapsule(x1, y1, x2, y2, STEEL, INK, false);
    const ang = Math.atan2(y2 - y1, x2 - x1);
    const len = Math.hypot(x2 - x1, y2 - y1);
    const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
    ctx.save();
    ctx.translate(wx(mx), wy(my));
    ctx.rotate(-ang);
    const hw = wr(len / 2) - 2;
    const hh = wr(BAR_T / 2);
    ctx.strokeStyle = "rgba(244,239,230,0.35)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-hw, -hh + 1);
    ctx.lineTo(hw, -hh + 1);
    ctx.moveTo(-hw, hh - 1);
    ctx.lineTo(hw, hh - 1);
    ctx.stroke();
    ctx.restore();
  }

  function drawCautionBar(x1, y1, x2, y2) {
    drawCapsule(x1, y1, x2, y2, "rgba(232,119,34,0.16)", ORANGE, true);
  }

  function drawWheel(x, y, a, type) {
    const r = wr(WHEEL_R);
    ctx.save();
    ctx.translate(wx(x), wy(y));
    ctx.rotate(-a);

    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fillStyle = "#241f1a";
    ctx.fill();

    const lugs = 12;
    const span = (Math.PI * 2) / lugs;
    const lugHalf = span * 0.32;
    for (let i = 0; i < lugs; i++) {
      const mid = i * span;
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.99, mid - lugHalf, mid + lugHalf);
      ctx.arc(0, 0, r * 0.78, mid + lugHalf, mid - lugHalf, true);
      ctx.closePath();
      ctx.fillStyle = i % 2 === 0 ? "#3d362e" : "#1a1714";
      ctx.fill();
    }

    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.strokeStyle = "#12100e";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(0, 0, r * 0.72, 0, Math.PI * 2);
    ctx.fillStyle = PAPER;
    ctx.fill();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(0, 0, r * 0.22, 0, Math.PI * 2);
    ctx.fillStyle = type === "roller" ? "#cfd6dc" : ORANGE;
    ctx.fill();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    if (type !== "roller") {
      ctx.strokeStyle = ORANGE;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(r * 0.62, 0);
      ctx.lineWidth = 3;
      ctx.stroke();
    }

    const letter = type === "driveR" ? "R" : type === "driveL" ? "L" : "O";
    ctx.fillStyle = INK;
    ctx.font = `800 ${Math.max(10, Math.round(r * 0.5))}px ${getComputedStyle(document.body).fontFamily}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.rotate(a);
    ctx.fillText(letter, 0, 1);
    if (type === "driveR" || type === "driveL") {
      const dir = type === "driveR" ? 1 : -1;
      const tip = dir * r * 0.68;
      const back = dir * r * 0.4;
      ctx.beginPath();
      ctx.moveTo(tip, 0);
      ctx.lineTo(back, -r * 0.2);
      ctx.lineTo(back, r * 0.2);
      ctx.closePath();
      ctx.fillStyle = "rgba(232,119,34,0.9)";
      ctx.fill();
      ctx.strokeStyle = "rgba(26,26,26,0.35)";
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawCrate(x, y, a) {
    const s = wr(CORE_S);
    ctx.save();
    ctx.translate(wx(x), wy(y));
    ctx.rotate(-a);
    ctx.fillStyle = "rgba(20,16,12,0.28)";
    ctx.beginPath();
    ctx.ellipse(2, s / 2 + 3, s * 0.52, s * 0.16, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = CRATE;
    ctx.fillRect(-s / 2, -s / 2, s, s);
    ctx.strokeStyle = "rgba(26,26,26,0.28)";
    ctx.lineWidth = 1;
    for (let i = -2; i <= 2; i++) {
      const px = (i / 2.4) * (s / 2);
      ctx.beginPath();
      ctx.moveTo(px, -s / 2);
      ctx.lineTo(px, s / 2);
      ctx.stroke();
    }
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2;
    ctx.strokeRect(-s / 2, -s / 2, s, s);
    ctx.beginPath();
    ctx.moveTo(-s / 2, 0);
    ctx.lineTo(s / 2, 0);
    ctx.stroke();
    const b = Math.max(3, s * 0.16);
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-s / 2, -s / 2 + b);
    ctx.lineTo(-s / 2, -s / 2);
    ctx.lineTo(-s / 2 + b, -s / 2);
    ctx.moveTo(s / 2, -s / 2 + b);
    ctx.lineTo(s / 2, -s / 2);
    ctx.lineTo(s / 2 - b, -s / 2);
    ctx.moveTo(-s / 2, s / 2 - b);
    ctx.lineTo(-s / 2, s / 2);
    ctx.lineTo(-s / 2 + b, s / 2);
    ctx.moveTo(s / 2, s / 2 - b);
    ctx.lineTo(s / 2, s / 2);
    ctx.lineTo(s / 2 - b, s / 2);
    ctx.stroke();
    ctx.restore();
  }

  function drawRectWorld(r, stroke, fill, dash) {
    ctx.save();
    if (dash) ctx.setLineDash([7, 6]);
    if (fill) {
      ctx.fillStyle = fill;
      ctx.fillRect(wx(r.x), wy(r.y + r.h), wr(r.w), wr(r.h));
    }
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 2;
    ctx.strokeRect(wx(r.x), wy(r.y + r.h), wr(r.w), wr(r.h));
    ctx.setLineDash([]);
    ctx.restore();
  }

  function stencil(text, x, y, color) {
    ctx.fillStyle = color;
    ctx.font = `700 ${Math.max(11, Math.round(12 * view.dpr))}px ${getComputedStyle(document.body).fontFamily}`;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(text, x, y);
  }

  function drawCone(x, y) {
    const b = wr(0.28), h = wr(0.7);
    const px = wx(x), py = wy(y);
    ctx.beginPath();
    ctx.moveTo(px, py - h);
    ctx.lineTo(px + b, py);
    ctx.lineTo(px - b, py);
    ctx.closePath();
    ctx.fillStyle = ORANGE;
    ctx.fill();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = PAPER;
    ctx.fillRect(px - b * 0.45, py - h * 0.45, b * 0.9, h * 0.12);
  }

  function drawPallet(x, y) {
    const w = wr(1.1), h = wr(0.22);
    const px = wx(x), py = wy(y) - h;
    ctx.fillStyle = "#8a5a2b";
    ctx.fillRect(px, py, w, h);
    ctx.strokeStyle = "#3a2410";
    ctx.strokeRect(px, py, w, h);
    ctx.fillStyle = "#c4893c";
    for (let i = 0; i < 4; i++) ctx.fillRect(px + 2, py + 2 + i * (h / 4), w - 4, h / 8);
  }

  function drawLamp(x, y, now) {
    const px = wx(x), py = wy(y);
    const swing = Math.sin(now / 1400 + x) * wr(0.08);
    ctx.strokeStyle = "#2a2e33";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(px, wy(WORLD_H - 0.15));
    ctx.lineTo(px + swing, py);
    ctx.stroke();
    const g = ctx.createRadialGradient(px + swing, py, 2, px + swing, py, wr(3.2));
    g.addColorStop(0, "rgba(245,196,0,0.28)");
    g.addColorStop(1, "rgba(245,196,0,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(px + swing, py, wr(3.2), 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(px + swing - wr(0.22), py);
    ctx.lineTo(px + swing + wr(0.22), py);
    ctx.lineTo(px + swing, py + wr(0.28));
    ctx.closePath();
    ctx.fillStyle = "#f5c400";
    ctx.fill();
    ctx.strokeStyle = "#2a2e33";
    ctx.stroke();
  }

  function drawDropBay(r) {
    const x = wx(r.x), y = wy(r.y + r.h), w = wr(r.w), h = wr(r.h);
    ctx.fillStyle = won ? "rgba(61,138,90,0.28)" : "rgba(232,119,34,0.16)";
    ctx.fillRect(x, y, w, h);
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();
    const step = Math.max(10, wr(0.38));
    for (let i = -h; i < w + h; i += step) {
      ctx.fillStyle = (Math.floor(i / step) % 2 === 0) ? "rgba(245,196,0,0.28)" : "rgba(232,119,34,0.12)";
      ctx.beginPath();
      ctx.moveTo(x + i, y + h);
      ctx.lineTo(x + i + step * 0.55, y + h);
      ctx.lineTo(x + i + step * 0.55 - h, y);
      ctx.lineTo(x + i - h, y);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
    ctx.setLineDash([8, 6]);
    ctx.strokeStyle = won ? OK : ORANGE;
    ctx.lineWidth = 3;
    ctx.strokeRect(x, y, w, h);
    ctx.setLineDash([]);
  }

  function drawShopSet(now) {
    const wall = ctx.createLinearGradient(0, 0, 0, canvas.height);
    wall.addColorStop(0, "#4a5560");
    wall.addColorStop(0.45, "#6a7380");
    wall.addColorStop(1, "#b7a78c");
    ctx.fillStyle = wall;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const brickH = wr(0.42), brickW = wr(0.9);
    ctx.strokeStyle = "rgba(30,34,40,0.18)";
    ctx.lineWidth = 1;
    for (let row = 0; row < 18; row++) {
      const yy = wy(WORLD_H - 0.2) + row * brickH;
      if (yy > wy(7)) break;
      const off = (row % 2) * brickW * 0.5;
      ctx.beginPath();
      ctx.moveTo(wx(0), yy);
      ctx.lineTo(wx(WORLD_W), yy);
      ctx.stroke();
      for (let col = -1; col < 40; col++) {
        const xx = wx(0) + col * brickW + off;
        ctx.beginPath();
        ctx.moveTo(xx, yy);
        ctx.lineTo(xx, yy + brickH);
        ctx.stroke();
      }
    }

    for (const wx0 of [4, 14, 24]) {
      const x = wx(wx0), y = wy(WORLD_H - 1.6), w = wr(3.2), h = wr(2.4);
      ctx.fillStyle = "rgba(210, 230, 245, 0.22)";
      ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = "rgba(255,255,255,0.25)";
      ctx.strokeRect(x, y, w, h);
      ctx.fillStyle = "rgba(245,196,0,0.07)";
      ctx.beginPath();
      ctx.moveTo(x, y + h);
      ctx.lineTo(x + w, y + h);
      ctx.lineTo(x + w + wr(1.4), wy(1.2));
      ctx.lineTo(x - wr(1.4), wy(1.2));
      ctx.closePath();
      ctx.fill();
    }

    ctx.fillStyle = "#5c6168";
    ctx.fillRect(wx(0), wy(WORLD_H - 0.12), wr(WORLD_W), wr(0.28));
    ctx.fillStyle = "#cfd6dc";
    ctx.fillRect(wx(0), wy(WORLD_H - 0.22), wr(WORLD_W), wr(0.08));

    drawLamp(5.5, WORLD_H - 1.1, now);
    drawLamp(14, WORLD_H - 1.1, now);
    drawLamp(22.5, WORLD_H - 1.1, now);

    drawPallet(0.35, 1.05);
    drawPallet(0.5, 1.28);
    drawCone(2.1, 1.05);
    drawCone(26.4, 1.05);
    drawCone(27.1, 1.05);

    ctx.fillStyle = "#3a4148";
    ctx.fillRect(wx(26.6), wy(3.1), wr(1.1), wr(2.05));
    ctx.fillStyle = "#f5c400";
    ctx.fillRect(wx(26.75), wy(2.7), wr(0.18), wr(0.08));
    ctx.fillRect(wx(27.15), wy(2.7), wr(0.18), wr(0.08));

    for (let i = 0; i < 22; i++) {
      const dx = (i * 5.37 + now * 0.00035) % WORLD_W;
      const dy = 3.2 + (i % 6) * 1.4 + Math.sin(now / 900 + i) * 0.35;
      ctx.fillStyle = "rgba(255,248,220,0.16)";
      ctx.beginPath();
      ctx.arc(wx(dx), wy(dy), Math.max(1.2, wr(0.035)), 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function draw() {
    const now = performance.now();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawShopSet(now);

    for (const s of doc.level.world || []) {
      drawRectWorld(s, "#1a1f24", "#3d4a56");
      hatchRect(s, "rgba(255,255,255,0.05)", 0.46);
      if (s.w > 8 && s.h < 2.2) {
        const stripeH = Math.min(s.h * 0.22, 0.18);
        const y = s.y + s.h - stripeH;
        const x = wx(s.x), yy = wy(y + stripeH), w = wr(s.w), h = wr(stripeH);
        ctx.save();
        ctx.beginPath();
        ctx.rect(x, yy, w, h);
        ctx.clip();
        const step = Math.max(8, wr(0.32));
        for (let i = -h; i < w + h; i += step) {
          ctx.fillStyle = (Math.floor(i / step) % 2 === 0) ? "#f5c400" : "#2a2e33";
          ctx.fillRect(x + i, yy, step * 0.62, h);
        }
        ctx.restore();
      }
    }

    plyRect(doc.level.shop, PLY);
    ctx.fillStyle = "rgba(26,26,26,0.18)";
    ctx.fillRect(wx(doc.level.shop.x) + 3, wy(doc.level.shop.y) + 2, wr(doc.level.shop.w), 4);
    ctx.setLineDash([8, 6]);
    ctx.strokeStyle = NAVY;
    ctx.lineWidth = 2;
    ctx.strokeRect(wx(doc.level.shop.x), wy(doc.level.shop.y + doc.level.shop.h), wr(doc.level.shop.w), wr(doc.level.shop.h));
    ctx.setLineDash([]);

    drawDropBay(doc.level.drop);

    stencil("Shop Floor", wx(doc.level.shop.x) + 6, wy(doc.level.shop.y + doc.level.shop.h) + 8, NAVY);
    stencil("Drop Zone", wx(doc.level.drop.x) + 8, wy(doc.level.drop.y + doc.level.drop.h) + 8, ORANGE);

    if (playing && trail.length > 1) {
      ctx.beginPath();
      ctx.strokeStyle = "rgba(232,119,34,0.7)";
      ctx.lineWidth = 2;
      trail.forEach((p, i) => {
        if (i === 0) ctx.moveTo(wx(p.x), wy(p.y));
        else ctx.lineTo(wx(p.x), wy(p.y));
      });
      ctx.stroke();
    }

    if (!playing) {
      for (const c of doc.level.cores || []) drawCrate(c.x, c.y, 0);
      for (const p of doc.machine.parts) {
        if (p.type === "steel") drawIBeam(p.x1, p.y1, p.x2, p.y2);
        if (p.type === "ghost") drawCautionBar(p.x1, p.y1, p.x2, p.y2);
      }
      for (const p of doc.machine.parts) {
        if (p.type === "driveR" || p.type === "driveL" || p.type === "roller") drawWheel(p.x, p.y, p.a || 0, p.type);
        if (p.type === "core") drawCrate(p.x, p.y, p.a || 0);
      }
      if (layer === "machine") {
        ctx.fillStyle = "#6a7a8a";
        for (const n of allNodes()) {
          ctx.beginPath();
          ctx.arc(wx(n.x), wy(n.y), Math.max(2.5, wr(0.055)), 0, Math.PI * 2);
          ctx.fill();
        }
      }
      if (drag && drag.kind === "bar") {
        const ghost = drag.type === "ghost";
        if (ghost) drawCautionBar(drag.x1, drag.y1, drag.x2, drag.y2);
        else drawIBeam(drag.x1, drag.y1, drag.x2, drag.y2);
        if (drag.snap) {
          ctx.beginPath();
          ctx.strokeStyle = ORANGE;
          ctx.lineWidth = 2;
          ctx.arc(wx(drag.x2), wy(drag.y2), Math.max(6, wr(0.16)), 0, Math.PI * 2);
          ctx.stroke();
        }
      }
      if (drag && drag.kind === "rect") {
        const r = normRect(drag.x1, drag.y1, drag.x2, drag.y2);
        drawRectWorld(r, tool === "drop" ? ORANGE : NAVY, "rgba(11,31,58,0.12)", true);
      }
      if (drag && drag.kind === "place" && drag.x != null) {
        const ok = inRect(drag.x, drag.y, doc.level.shop);
        ctx.globalAlpha = 0.7;
        drawWheel(drag.x, drag.y, 0, drag.type);
        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.strokeStyle = drag.snap ? ORANGE : (ok ? "#9db0c4" : "#b91c1c");
        ctx.lineWidth = 2;
        ctx.arc(wx(drag.x), wy(drag.y), Math.max(8, wr(WHEEL_R + 0.08)), 0, Math.PI * 2);
        ctx.stroke();
      }
      if (drag && drag.kind === "move" && drag.snapTo) {
        ctx.beginPath();
        ctx.strokeStyle = ORANGE;
        ctx.lineWidth = 2;
        ctx.arc(wx(drag.snapTo.x), wy(drag.snapTo.y), Math.max(6, wr(0.16)), 0, Math.PI * 2);
        ctx.stroke();
      }
    } else if (sim) {
      for (const item of sim.bodies) {
        const b = item.body;
        const p = b.getPosition();
        const a = b.getAngle();
        const t = item.part.type;
        if (t === "steel" || t === "ghost") {
          const len = item.part.type && (item.part.x1 != null)
            ? Math.max(MIN_BAR, dist({ x: item.part.x1, y: item.part.y1 }, { x: item.part.x2, y: item.part.y2 }))
            : 1;
          const x1 = p.x - Math.cos(a) * len / 2, y1 = p.y - Math.sin(a) * len / 2;
          const x2 = p.x + Math.cos(a) * len / 2, y2 = p.y + Math.sin(a) * len / 2;
          if (t === "steel") drawIBeam(x1, y1, x2, y2);
          else drawCautionBar(x1, y1, x2, y2);
        } else if (t === "core") drawCrate(p.x, p.y, a);
        else drawWheel(p.x, p.y, a, t);
      }
    }
  }

  function normRect(x1, y1, x2, y2) {
    const x = Math.min(x1, x2), y = Math.min(y1, y2);
    return { x, y, w: Math.abs(x2 - x1), h: Math.abs(y2 - y1) };
  }

  function endPan() { panning = null; }

  function finishDrag() {
    if (!drag) { activePtr = null; return; }
    const d = drag;
    drag = null;
    activePtr = null;
    if (d.kind === "bar") {
      const len = Math.hypot(d.x2 - d.x1, d.y2 - d.y1);
      if (len >= MIN_BAR && inRect(d.x1, d.y1, doc.level.shop)) {
        addPart({ type: d.type, x1: d.x1, y1: d.y1, x2: d.x2, y2: d.y2 });
      }
    } else if (d.kind === "rect") {
      const r = normRect(d.x1, d.y1, d.x2, d.y2);
      if (r.w > 0.4 && r.h > 0.3) {
        if (tool === "shop") {
          if (rectsOverlap(r, doc.level.drop)) toast("Shop Floor cannot overlap Drop Zone.");
          else { doc.level.shop = r; dirty = true; }
        } else if (tool === "drop") {
          if (rectsOverlap(r, doc.level.shop)) toast("Drop Zone cannot overlap Shop Floor.");
          else { doc.level.drop = r; dirty = true; }
        } else if (tool === "slab") {
          if ((doc.level.world || []).length >= 12) toast("Max 12 slabs.");
          else { doc.level.world.push({ type: "slab", ...r }); dirty = true; }
        }
      }
    } else if (d.kind === "move") {
      snapPartToHub(d.part);
      if (d.part.x != null && !inRect(d.part.x, d.part.y, doc.level.shop) && d.part.type !== "core") {
        Object.assign(d.part, d.orig);
        toast("Stay on the Shop Floor.");
      }
      dirty = true;
    } else if (d.kind === "place" && d.x != null) {
      const pt = { x: d.x, y: d.y };
      if (!canPlaceWheel(pt)) toast("Build on the Shop Floor.");
      else addPart({ type: d.type, x: pt.x, y: pt.y, a: 0 });
    }
  }

  function startPlace(type, ev) {
    if (playing) return;
    setTool(type);
    const onCanvas = ev.target === canvas;
    const pt = onCanvas ? worldFromEvent(ev) : null;
    const snapped = pt ? snapPt(pt) : { x: null, y: null, node: null };
    drag = {
      kind: "place",
      type,
      x: snapped.x,
      y: snapped.y,
      snap: !!(snapped.node),
      sx: ev.clientX,
      sy: ev.clientY,
    };
    activePtr = ev.pointerId;
    try { (onCanvas ? canvas : ev.currentTarget).setPointerCapture(ev.pointerId); } catch (e) {}
  }

  canvas.addEventListener("wheel", (ev) => {
    ev.preventDefault();
    const before = worldFromEvent(ev);
    view.zoom = Math.max(0.7, Math.min(2.2, view.zoom * (ev.deltaY > 0 ? 0.9 : 1.1)));
    fit();
    const after = worldFromEvent(ev);
    view.panx += (after.x - before.x) * view.scale;
    view.pany -= (after.y - before.y) * view.scale;
    fit();
  }, { passive: false });

  canvas.addEventListener("pointerdown", (ev) => {
    if (ev.button === 1 || ev.button === 2 || ev.altKey) {
      panning = { x: ev.clientX, y: ev.clientY, px: view.panx, py: view.pany };
      activePtr = ev.pointerId;
      try { canvas.setPointerCapture(ev.pointerId); } catch (e) {}
      return;
    }
    if (ev.button !== 0) return;
    if (playing) return;
    try { canvas.setPointerCapture(ev.pointerId); } catch (e) {}
    activePtr = ev.pointerId;
    const pt = worldFromEvent(ev);
    hover = pt;

    if (layer === "level") {
      if (tool === "erase") {
        const hit = hitSlab(pt);
        if (hit && hit.kind === "slab") {
          if ((doc.level.world || []).length <= 1) { toast("Leave at least one slab."); return; }
          doc.level.world.splice(hit.i, 1);
          dirty = true;
        } else if (hit && hit.kind === "core") {
          if (doc.level.cores.length <= 1) { toast("Need one Bot Core."); return; }
          doc.level.cores.splice(hit.i, 1);
          dirty = true;
        }
        return;
      }
      if (tool === "core") {
        if ((doc.level.cores || []).length >= 3) { toast("Max 3 cores."); return; }
        if (!inRect(pt.x, pt.y, doc.level.shop)) { toast("Core starts on the Shop Floor."); return; }
        doc.level.cores.push({ x: pt.x, y: pt.y });
        dirty = true;
        return;
      }
      if (tool === "shop" || tool === "drop" || tool === "slab") {
        drag = { kind: "rect", x1: pt.x, y1: pt.y, x2: pt.x, y2: pt.y, sx: ev.clientX, sy: ev.clientY };
      }
      return;
    }

    if (tool === "erase") {
      const p = hitPart(pt);
      if (p) {
        pushHist();
        doc.machine.parts = doc.machine.parts.filter((x) => x !== p);
        dirty = true;
        refreshMeta();
      }
      return;
    }

    const grabbed = hitPart(pt);
    const onNode = nearestNode(pt, SNAP * 1.2);
    const pullingBar = (tool === "steel" || tool === "ghost") && onNode;
    if (grabbed && !pullingBar) {
      pushHist();
      drag = {
        kind: "move",
        part: grabbed,
        x0: pt.x,
        y0: pt.y,
        orig: JSON.parse(JSON.stringify(grabbed)),
        snap: JSON.parse(JSON.stringify(grabbed)),
        snapTo: null,
      };
      return;
    }
    if (tool === "move") return;
    if (tool === "steel" || tool === "ghost") {
      const start = onNode ? { x: onNode.x, y: onNode.y } : pt;
      if (!inRect(start.x, start.y, doc.level.shop)) { toast("Build on the Shop Floor."); return; }
      drag = { kind: "bar", type: tool, x1: start.x, y1: start.y, x2: start.x, y2: start.y, snap: !!onNode, sx: ev.clientX, sy: ev.clientY };
      return;
    }
    if (tool === "driveR" || tool === "driveL" || tool === "roller") {
      startPlace(tool, ev);
    }
  });

  function onPtrMove(ev) {
    if (panning && (activePtr == null || ev.pointerId === activePtr)) {
      view.panx = panning.px + (ev.clientX - panning.x) * view.dpr;
      view.pany = panning.py + (ev.clientY - panning.y) * view.dpr;
      fit();
      return;
    }
    const over = ev.target === canvas || canvas.contains(ev.target);
    const pt = over ? worldFromEvent(ev) : hover;
    if (over) hover = pt;
    if (!drag || playing) return;
    if (drag.kind === "bar") {
      const n = nearestNode(pt, SNAP * 1.55);
      const end = n && (n.x !== drag.x1 || n.y !== drag.y1) ? { x: n.x, y: n.y } : pt;
      let x2 = end.x, y2 = end.y;
      const d = Math.hypot(x2 - drag.x1, y2 - drag.y1);
      if (d > MAX_BAR) {
        const k = MAX_BAR / d;
        x2 = drag.x1 + (x2 - drag.x1) * k;
        y2 = drag.y1 + (y2 - drag.y1) * k;
      }
      drag.x2 = x2; drag.y2 = y2; drag.snap = !!n;
    } else if (drag.kind === "rect") {
      drag.x2 = pt.x; drag.y2 = pt.y;
    } else if (drag.kind === "move") {
      const dx = pt.x - drag.x0, dy = pt.y - drag.y0;
      const p = drag.part;
      const s = drag.snap;
      if (p.x != null) { p.x = s.x + dx; p.y = s.y + dy; }
      if (p.x1 != null) {
        p.x1 = s.x1 + dx; p.y1 = s.y1 + dy;
        p.x2 = s.x2 + dx; p.y2 = s.y2 + dy;
      }
      const snapped = snapPartToHub(p);
      drag.snapTo = snapped ? { x: p.x != null ? p.x : (p.x1 + p.x2) / 2, y: p.y != null ? p.y : (p.y1 + p.y2) / 2 } : null;
    } else if (drag.kind === "place") {
      if (!over && drag.x == null && Math.hypot(ev.clientX - drag.sx, ev.clientY - drag.sy) < DRAG_PX) return;
      const use = over ? pt : worldFromEvent(ev);
      const s = snapPt(use);
      drag.x = s.x; drag.y = s.y; drag.snap = !!s.node;
    }
  }

  canvas.addEventListener("pointermove", onPtrMove);
  window.addEventListener("pointermove", (ev) => {
    if (drag && drag.kind === "place") onPtrMove(ev);
  });

  canvas.addEventListener("contextmenu", (ev) => ev.preventDefault());

  function onPtrUp(ev) {
    if (activePtr != null && ev.pointerId !== activePtr && ev.type !== "lostpointercapture") return;
    if (panning) { endPan(); activePtr = null; return; }
    finishDrag();
  }
  canvas.addEventListener("pointerup", onPtrUp);
  canvas.addEventListener("pointercancel", onPtrUp);
  canvas.addEventListener("lostpointercapture", (ev) => {
    if (drag || panning) onPtrUp(ev);
  });
  window.addEventListener("pointerup", (ev) => {
    if (drag && drag.kind === "place") onPtrUp(ev);
  });

  function starterCart() {
    if (playing) stopPlay();
    const s = doc.level.shop;
    const y = s.y + WHEEL_R + 0.04;
    const x1 = s.x + 1.2;
    const x2 = s.x + 2.7;
    if (!inRect(x1, y, s) || !inRect(x2, y, s)) {
      toast("Shop Floor is too small for a starter cart.");
      return;
    }
    if (pieceCount(doc) + 3 > PIECE_CAP) {
      toast("Not enough part slots.");
      return;
    }
    pushHist();
    doc.machine.parts.push({ type: "roller", x: x1, y, a: 0 });
    doc.machine.parts.push({ type: "driveR", x: x2, y, a: 0 });
    doc.machine.parts.push({ type: "steel", x1, y1: y, x2, y2: y });
    const nose = x2 + 1.15;
    (doc.level.cores || []).forEach((c) => {
      if (c.x > x1 - 0.6 && c.x < x2 + 0.6) c.x = Math.min(s.x + s.w - 0.4, nose);
    });
    dirty = true;
    refreshMeta();
    toast("Pusher cart. Crate sits in front — not under the axle.");
  }

  function resetView() {
    view.zoom = 1;
    view.panx = 0;
    view.pany = 0;
    fit();
  }

  function bind() {
    document.querySelectorAll("[data-tool]").forEach((b) => {
      const id = b.getAttribute("data-tool");
      b.addEventListener("click", () => setTool(id));
      if (id === "driveR" || id === "driveL" || id === "roller") {
        b.addEventListener("pointerdown", (ev) => {
          if (ev.button !== 0 || playing || layer !== "machine") return;
          ev.preventDefault();
          startPlace(id, ev);
        });
      }
    });
    document.querySelectorAll("[data-layer]").forEach((b) => {
      b.addEventListener("click", () => setLayer(b.getAttribute("data-layer")));
    });
    document.getElementById("btn-play").addEventListener("click", () => playing ? stopPlay() : startPlay());
    document.getElementById("btn-stop").addEventListener("click", stopPlay);
    const slowBtn = document.getElementById("btn-slow");
    if (slowBtn) slowBtn.addEventListener("click", () => {
      slowMo = !slowMo;
      refreshMeta();
      toast(slowMo ? "Slow-mo on" : "Full speed");
    });
    const cartBtn = document.getElementById("btn-cart");
    if (cartBtn) cartBtn.addEventListener("click", starterCart);
    const viewBtn = document.getElementById("btn-view");
    if (viewBtn) viewBtn.addEventListener("click", resetView);
    const undoBtn = document.getElementById("btn-undo");
    if (undoBtn) undoBtn.addEventListener("click", undo);
    document.getElementById("btn-clear").addEventListener("click", () => {
      if (playing) stopPlay();
      doc.machine.parts = [];
      dirty = true;
      everTested = false;
      pinnedStep = null;
      refreshMeta();
    });
    document.getElementById("btn-new").addEventListener("click", () => {
      if (playing) stopPlay();
      doc = defaultDoc();
      dirty = false;
      const pick = document.getElementById("level-pick");
      if (pick) pick.value = "open";
      resetLoop("open");
      refreshMeta();
    });
    document.getElementById("btn-save").addEventListener("click", () => {
      doc.title = sanitizeTitle(titleEl.value);
      downloadDoc(doc, doc.title);
      dirty = false;
      toast("Saved a local file. No names in it.");
    });
    document.getElementById("btn-open").addEventListener("click", () => fileOpen.click());
    fileOpen.addEventListener("change", async () => {
      const f = fileOpen.files && fileOpen.files[0];
      fileOpen.value = "";
      if (!f) return;
      try {
        if (playing) stopPlay();
        doc = await readFile(f);
        dirty = false;
        resetLoop("open");
        refreshMeta();
        toast("Opened " + doc.title);
      } catch (err) {
        toast("Could not open that file.");
      }
    });
    titleEl.addEventListener("change", () => {
      doc.title = sanitizeTitle(titleEl.value);
      titleEl.value = doc.title;
    });
    document.getElementById("level-pick").addEventListener("change", async (ev) => {
      const item = BUILTIN.find((x) => x.id === ev.target.value);
      if (!item) return;
      if (playing) stopPlay();
      if (!item.url) {
        doc = defaultDoc();
      } else {
        const res = await fetch(item.url);
        doc = unpackDoc(await res.json());
      }
      dirty = false;
      resetLoop(item.id);
      refreshMeta();
    });
    document.querySelectorAll(".step").forEach((b) => {
      b.addEventListener("click", () => {
        guideOn = true;
        pinnedStep = b.getAttribute("data-step");
        refreshGuide();
      });
    });
    const guideBtn = document.getElementById("btn-guide");
    if (guideBtn) {
      guideBtn.addEventListener("click", () => {
        guideOn = !guideOn;
        refreshGuide();
      });
    }
    const sysBtn = document.getElementById("btn-systems");
    if (sysBtn) sysBtn.addEventListener("click", () => showSystems(true));
    const sysClose = document.getElementById("systems-close");
    if (sysClose) sysClose.addEventListener("click", () => showSystems(false));
    const sysRoot = document.getElementById("systems");
    if (sysRoot) {
      sysRoot.addEventListener("click", (ev) => {
        if (ev.target === sysRoot) showSystems(false);
      });
    }
    const howtoBtn = document.getElementById("btn-howto");
    if (howtoBtn) howtoBtn.addEventListener("click", () => showHowto(0));
    const howtoSkip = document.getElementById("howto-skip");
    if (howtoSkip) howtoSkip.addEventListener("click", hideHowto);
    const howtoNext = document.getElementById("howto-next");
    if (howtoNext) {
      howtoNext.addEventListener("click", async () => {
        if (howtoIndex >= HOWTO.length - 1) {
          hideHowto();
          const pick = document.getElementById("level-pick");
          if (pick) pick.value = "roll";
          const res = await fetch("levels/roll-out.json");
          doc = unpackDoc(await res.json());
          dirty = false;
          resetLoop("roll");
          refreshMeta();
          toast("Tutorial course: Roll Out. Ask, then Create, then Play.");
          return;
        }
        showHowto(howtoIndex + 1);
      });
    }
    const howtoRoot = document.getElementById("howto");
    if (howtoRoot) {
      howtoRoot.addEventListener("click", (ev) => {
        if (ev.target === howtoRoot) hideHowto();
      });
    }
    const railBtn = document.getElementById("btn-rail");
    const rail = document.getElementById("rail");
    if (railBtn && rail) {
      railBtn.addEventListener("click", () => {
        const on = !rail.classList.contains("open");
        rail.classList.toggle("open", on);
        railBtn.setAttribute("aria-expanded", on ? "true" : "false");
      });
    }
    const crewBtn = document.getElementById("btn-crew");
    if (crewBtn) {
      crewBtn.addEventListener("click", () => {
        const root = document.getElementById("crew");
        showCrew(!!(root && root.hidden));
      });
    }
    const crewClose = document.getElementById("crew-close");
    if (crewClose) crewClose.addEventListener("click", () => showCrew(false));
    const crewRoot = document.getElementById("crew");
    if (crewRoot) {
      crewRoot.addEventListener("click", (ev) => {
        if (ev.target === crewRoot) showCrew(false);
      });
    }
    const packetBtn = document.getElementById("btn-packet");
    if (packetBtn) {
      packetBtn.addEventListener("click", () => {
        const d = document.getElementById("guide-drawer");
        setPacket(!!(d && d.hidden));
      });
    }
    const wideBtn = document.getElementById("btn-wide");
    if (wideBtn) wideBtn.addEventListener("click", tryWide);
    window.addEventListener("keydown", (ev) => {
      if (ev.target.matches("input, textarea")) return;
      if (ev.code === "Space") {
        ev.preventDefault();
        playing ? stopPlay() : startPlay();
      }
      if (ev.key === "1") setTool("driveR");
      if (ev.key === "2") setTool("driveL");
      if (ev.key === "3") setTool("roller");
      if (ev.key === "4") setTool("steel");
      if (ev.key === "5") setTool("ghost");
      if (ev.key === "e" || ev.key === "E") setTool("erase");
      if (ev.key === "m" || ev.key === "M") setTool("move");
      if (ev.key === "z" && (ev.ctrlKey || ev.metaKey)) { ev.preventDefault(); undo(); }
      if (ev.key === "z" && !ev.ctrlKey && !ev.metaKey) undo();
      if (ev.key === "s" || ev.key === "S") {
        if (!ev.ctrlKey && !ev.metaKey) { slowMo = !slowMo; refreshMeta(); }
      }
    });
  }

  function roundBar(g, x, y, bw, bh) {
    g.fillStyle = "#c5ccd3";
    g.beginPath();
    if (g.roundRect) g.roundRect(x, y, bw, bh, bh / 2);
    else g.rect(x, y, bw, bh);
    g.fill();
    g.strokeStyle = "#6a737c";
    g.stroke();
  }

  function drawHowtoDemo(now) {
    const root = document.getElementById("howto");
    const c = document.getElementById("howto-demo");
    if (!c || !root || root.hidden) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const cssW = c.clientWidth || 420;
    const cssH = c.clientHeight || 160;
    if (c.width !== Math.round(cssW * dpr) || c.height !== Math.round(cssH * dpr)) {
      c.width = Math.round(cssW * dpr);
      c.height = Math.round(cssH * dpr);
    }
    const g = c.getContext("2d");
    const w = c.width, h = c.height;
    const t = (now / 1000) % 4;
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.clearRect(0, 0, w, h);
    g.fillStyle = "#efe6d4";
    g.fillRect(0, 0, w, h);

    function crate(x, y, s) {
      g.fillStyle = CRATE;
      g.fillRect(x - s / 2, y - s / 2, s, s);
      g.strokeStyle = INK;
      g.lineWidth = 2 * dpr;
      g.strokeRect(x - s / 2, y - s / 2, s, s);
    }
    function wheel(x, y, r, letter, dir) {
      g.beginPath();
      g.arc(x, y, r, 0, Math.PI * 2);
      g.fillStyle = "#241f1a";
      g.fill();
      for (let i = 0; i < 10; i++) {
        const a0 = i * 0.63;
        g.beginPath();
        g.arc(x, y, r * 0.98, a0, a0 + 0.28);
        g.arc(x, y, r * 0.78, a0 + 0.28, a0, true);
        g.closePath();
        g.fillStyle = i % 2 ? "#3d362e" : "#1a1714";
        g.fill();
      }
      g.beginPath();
      g.arc(x, y, r * 0.7, 0, Math.PI * 2);
      g.fillStyle = PAPER;
      g.fill();
      g.fillStyle = ORANGE;
      g.beginPath();
      g.arc(x, y, r * 0.22, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = INK;
      g.font = `800 ${Math.round(r * 0.7)}px ${getComputedStyle(document.body).fontFamily}`;
      g.textAlign = "center";
      g.textBaseline = "middle";
      g.fillText(letter, x, y + 1);
      if (dir) {
        g.fillStyle = ORANGE;
        g.beginPath();
        g.moveTo(x + dir * r * 0.95, y);
        g.lineTo(x + dir * r * 0.55, y - r * 0.28);
        g.lineTo(x + dir * r * 0.55, y + r * 0.28);
        g.closePath();
        g.fill();
      }
    }
    function drop(x, y, bw, bh, ok) {
      g.setLineDash([7 * dpr, 6 * dpr]);
      g.strokeStyle = ok ? OK : ORANGE;
      g.fillStyle = ok ? "rgba(47,111,78,0.22)" : "rgba(232,119,34,0.12)";
      g.fillRect(x, y, bw, bh);
      g.lineWidth = 2 * dpr;
      g.strokeRect(x, y, bw, bh);
      g.setLineDash([]);
    }

    const floorY = h * 0.72;
    g.fillStyle = "#eadcc3";
    g.fillRect(w * 0.08, floorY, w * 0.84, h * 0.12);
    g.setLineDash([6 * dpr, 5 * dpr]);
    g.strokeStyle = NAVY;
    g.strokeRect(w * 0.08, floorY, w * 0.84, h * 0.12);
    g.setLineDash([]);

    const beat = howtoIndex;
    if (beat === 0) {
      const u = Math.min(1, t / 2.2);
      const x0 = w * 0.22, x1 = w * 0.68;
      const x = x0 + (x1 - x0) * u;
      drop(w * 0.58, floorY - h * 0.22, w * 0.28, h * 0.2, u > 0.85);
      crate(x, floorY - 18 * dpr, 28 * dpr);
      g.fillStyle = u > 0.85 ? OK : INK;
      g.font = `700 ${Math.round(13 * dpr)}px ${getComputedStyle(document.body).fontFamily}`;
      g.textAlign = "center";
      g.fillText(u > 0.85 ? "In the zone · 1 second" : "Crate → Drop Zone", w / 2, h * 0.18);
    } else if (beat === 1) {
      wheel(w * 0.2, floorY - 22 * dpr, 20 * dpr, "R", 1);
      wheel(w * 0.4, floorY - 22 * dpr, 20 * dpr, "L", -1);
      roundBar(g, w * 0.52, floorY - 26 * dpr, w * 0.18, 12 * dpr);
      g.setLineDash([5 * dpr, 4 * dpr]);
      g.strokeStyle = ORANGE;
      g.lineWidth = 3 * dpr;
      g.beginPath();
      if (g.roundRect) g.roundRect(w * 0.74, floorY - 32 * dpr, w * 0.14, 14 * dpr, 7 * dpr);
      else g.rect(w * 0.74, floorY - 32 * dpr, w * 0.14, 14 * dpr);
      g.stroke();
      g.setLineDash([]);
      g.fillStyle = INK;
      g.font = `700 ${Math.round(12 * dpr)}px ${getComputedStyle(document.body).fontFamily}`;
      g.textAlign = "center";
      g.fillText("Drive-R     Drive-L      Steel      Ghost", w / 2, h * 0.2);
    } else if (beat === 2) {
      const u = (t % 4) / 4;
      const hx = w * 0.55, hy = floorY - 24 * dpr;
      g.strokeStyle = ORANGE;
      g.lineWidth = 3 * dpr;
      g.beginPath();
      g.arc(hx, hy, 16 * dpr, 0, Math.PI * 2);
      g.stroke();
      const wx0 = w * 0.2 + (hx - w * 0.2) * Math.min(1, u / 0.55);
      wheel(wx0, hy, 18 * dpr, "R", 1);
      crate(w * 0.78, floorY - 18 * dpr, 24 * dpr);
      g.fillStyle = u > 0.6 ? OK : INK;
      g.font = `800 ${Math.round(14 * dpr)}px ${getComputedStyle(document.body).fontFamily}`;
      g.textAlign = "center";
      g.fillText(u > 0.6 ? "PLAY" : "Drag onto the hub", w / 2, h * 0.18);
    } else {
      const u = Math.min(1, t / 2);
      crate(w * 0.7, floorY - 18 * dpr, 26 * dpr);
      drop(w * 0.58, floorY - h * 0.22, w * 0.3, h * 0.2, true);
      wheel(w * 0.28, floorY - 22 * dpr, 18 * dpr, "R", 1);
      g.globalAlpha = 1 - u;
      roundBar(g, w * 0.4, floorY - 40 * dpr, w * 0.14, 10 * dpr);
      g.globalAlpha = 1;
      g.fillStyle = OK;
      g.font = `800 ${Math.round(18 * dpr)}px ${getComputedStyle(document.body).fontFamily}`;
      g.textAlign = "center";
      g.fillText(`+${Math.round(8 + u * 10)} XP`, w * 0.32, h * 0.28 - u * 12 * dpr);
      g.fillStyle = INK;
      g.font = `700 ${Math.round(12 * dpr)}px ${getComputedStyle(document.body).fontFamily}`;
      g.fillText("Fewer parts → more XP", w / 2, h * 0.16);
    }
  }

  function loop(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (playing && sim) {
      acc += dt;
      let steps = 0;
      const stepCost = slowMo ? DT / 0.35 : DT;
      while (acc >= stepCost && steps < 4) {
        stepSim(1);
        acc -= stepCost;
        steps++;
      }
      if (acc >= DT) acc = 0;
    }
    draw();
    drawHowtoDemo(now);
    requestAnimationFrame(loop);
  }

  window.addEventListener("resize", fit);
  fit();
  bind();
  setTool("driveR");
  setLayer("machine");
  refreshMeta();
  try {
    if (!localStorage.getItem("bb-howto-v2") && !tightHud()) showHowto(0);
  } catch (e) { /* ignore */ }
  requestAnimationFrame(loop);
}
