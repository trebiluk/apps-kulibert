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
  { id: "editor", label: "Site Editor", url: null },
  { id: "measure", label: "Measure", url: "levels/measure.json" },
  { id: "forces", label: "Forces", url: "levels/forces.json" },
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

const PAR = { open: 5, editor: 8, roll: 4, curb: 7, pit: 8, wall: 9, shelf: 10, bend: 10, pair: 12, measure: 4, forces: 5 };

const MEASURE_JOBS = [
  { id: "shop", label: "Shop Floor width", get: (d) => d.level.shop.w },
  { id: "drop", label: "Drop Zone width", get: (d) => d.level.drop.w },
  { id: "gap", label: "Gap from Shop Floor to Drop Zone", get: (d) => d.level.drop.x - (d.level.shop.x + d.level.shop.w) },
];

const FORCE_JOBS = [
  { id: "gravity", label: "Gravity pulls the crate down" },
  { id: "torque", label: "Drive torque turns a wheel-and-axle" },
  { id: "motion", label: "Unbalanced force — the crate translates" },
];

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
  editor: {
    ask: "Ask: design a fair job. Shop Floor, Drop Zone, slabs, and one crate. The class will solve the course you make.",
    imagine: "Imagine a gap, a curb, or a wall — one constraint, not a maze.",
    plan: "Plan: Level tab. Draw Shop Floor, then Drop Zone. They cannot overlap. Save a course title only.",
    create: "Create the site first. Machine tools are for a test cart, not the challenge solution.",
    test: "Test: Play a cart. If it parks in two seconds with no thought, the job is too easy.",
    improve: "Improve one constraint. Save. Assign the file — no names.",
    system: "Site Editor — Input: a job idea. Process: floor, drop, slabs. Output: a course file. Feedback: Play. Constraint: fair for a period.",
  },
  measure: {
    ask: "Ask: how wide is the Shop Floor, the Drop Zone, and the gap between them? Count squares. 1 square = 1 unit.",
    imagine: "Imagine a tape along a grid line — not a diagonal unless the job is a diagonal.",
    plan: "Plan: Tape tool. Click two corners. Log all three lengths.",
    create: "Create is not the job today. Measuring is. You may still build after the three logs.",
    test: "Test your count: if the tape says 8.0, you counted 8 squares.",
    improve: "Improve: re-tape if you were off. Corners, not middles.",
    system: "Measure — Input: grid. Process: tape two points. Output: three lengths. Feedback: the readout. Constraint: 1 square = 1 unit.",
  },
  forces: {
    ask: "Ask: what forces move the crate? Gravity down. Drive torque at the axle. Unbalanced force means it translates.",
    imagine: "Imagine a wheel-and-axle (Drive) linked with Steel. Rollers are free wheels. Ghost misses the machine.",
    plan: "Plan a tiny pusher. Play. Watch the yellow g arrow and the torque on Drive.",
    create: "Create on the Shop Floor. Hub snap glows when a wheel will join.",
    test: "Test: Play. Logs tick when you see gravity, torque, then motion.",
    improve: "Improve: one change to the linkage. Same job, fewer parts.",
    system: "Forces — Input: gravity + Drive torque. Process: wheel-and-axle + linkage. Output: crate translation. Feedback: arrows and trail. Constraint: unbalanced force needed to move.",
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
  if (!el || !msg) return;
  const now = performance.now();
  if (msg === toast._m && now - (toast._at || 0) < 900) return;
  toast._m = msg;
  toast._at = now;
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(toast._t);
  toast._t = setTimeout(() => el.classList.remove("show"), 2400);
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

  const HEAT_CH = "bb-heat-v1";
  const HEAT_KEY = "bb-heat-period-v1";
  const ROLE_KEY = "bb-role-v1";
  let heat = { parked: 0, ids: {} };
  try {
    const raw = localStorage.getItem(HEAT_KEY);
    if (raw) heat = JSON.parse(raw) || heat;
    if (typeof heat.parked !== "number") heat = { parked: 0, ids: {} };
    if (!heat.ids || typeof heat.ids !== "object") heat.ids = {};
  } catch (e) { heat = { parked: 0, ids: {} }; }
  let heatCh = null;
  try { heatCh = new BroadcastChannel(HEAT_CH); } catch (e) { heatCh = null; }

  function persistHeat() {
    const keys = Object.keys(heat.ids || {});
    if (keys.length > 240) {
      const keep = {};
      for (const k of keys.slice(-120)) keep[k] = 1;
      heat.ids = keep;
    }
    try { localStorage.setItem(HEAT_KEY, JSON.stringify({ parked: heat.parked, ids: heat.ids })); } catch (e) { /* private mode */ }
  }
  function renderHeat() {
    const n = document.getElementById("heat-n");
    if (n) n.textContent = String(heat.parked);
  }
  function notePark(id) {
    if (!id || heat.ids[id]) return;
    heat.ids[id] = 1;
    heat.parked += 1;
    persistHeat();
    renderHeat();
  }
  function parkHeat() {
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    notePark(id);
    try { if (heatCh) heatCh.postMessage({ t: "park", id }); } catch (e) { /* ignore */ }
  }
  function resetHeat(fromRemote) {
    heat = { parked: 0, ids: {} };
    persistHeat();
    renderHeat();
    if (!fromRemote) {
      try { if (heatCh) heatCh.postMessage({ t: "reset" }); } catch (e) { /* ignore */ }
      toast("New period. Heat is 0 parked.");
    }
  }
  if (heatCh) {
    heatCh.onmessage = (ev) => {
      const m = ev.data || {};
      if (m.t === "park") notePark(m.id);
      if (m.t === "reset") resetHeat(true);
    };
  }
  renderHeat();

  function setRole(role, quiet) {
    const r = role === "observer" ? "observer" : "builder";
    try { sessionStorage.setItem(ROLE_KEY, r); } catch (e) { /* private mode */ }
    document.body.dataset.role = r;
    document.querySelectorAll("[data-role]").forEach((b) => {
      const on = b.getAttribute("data-role") === r;
      b.classList.toggle("on", on);
      b.setAttribute("aria-pressed", on ? "true" : "false");
    });
    if (!quiet) toast(r === "observer" ? "Observer: watch the crate." : "Builder: place parts.");
  }
  try { setRole(sessionStorage.getItem(ROLE_KEY) || "builder", true); } catch (e) { setRole("builder", true); }


  const view = { scale: 36, ox: 0, oy: 0, dpr: 1, zoom: 1, panx: 0, pany: 0, fx: 8, fy: 3.2 };
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
  let lastTrail = [];
  let lastReadout = "";
  let debugOn = false;
  let frames = 0;
  let fps = 0;
  let fpsT = 0;
  let lastDraw = 0;
  let panning = null;
  let courseId = "open";
  let everTested = false;
  let pinnedStep = null;
  let guideOn = true;
  let howtoIndex = 0;
  let tapeA = null;
  let tapeB = null;
  let measureDone = {};
  let forceDone = {};
  let playAge = 0;
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

  function jobBounds() {
    const s = doc.level.shop;
    const d = doc.level.drop;
    let x0 = s.x, y0 = Math.min(s.y, 0.2), x1 = s.x + s.w, y1 = s.y + s.h;
    if (d) {
      x0 = Math.min(x0, d.x);
      y0 = Math.min(y0, d.y);
      x1 = Math.max(x1, d.x + d.w);
      y1 = Math.max(y1, d.y + d.h);
    }
    for (const c of doc.level.cores || []) {
      x0 = Math.min(x0, c.x - 0.5);
      y0 = Math.min(y0, c.y - 0.5);
      x1 = Math.max(x1, c.x + 0.5);
      y1 = Math.max(y1, c.y + 0.8);
    }
    x0 -= 1.0;
    y0 -= 0.25;
    x1 += 1.2;
    y1 += 0.7;
    return { x: x0, y: Math.max(-0.2, y0), w: x1 - x0, h: y1 - y0 };
  }

  function focusTarget() {
    if (typeof isMeasure === "function" && isMeasure()) return { x: WORLD_W / 2, y: 5.2 };
    if (playing && sim && sim.cores[0]) {
      const p = sim.cores[0].getPosition();
      const drop = doc.level.drop;
      const look = drop ? p.x * 0.7 + (drop.x + drop.w / 2) * 0.3 : p.x;
      return { x: look, y: Math.max(2.5, p.y + 1.35) };
    }
    const b = jobBounds();
    return { x: b.x + b.w * 0.46, y: b.y + b.h * 0.42 };
  }

  function frameSpan() {
    if (typeof isMeasure === "function" && isMeasure()) return { w: WORLD_W, h: 11 };
    const phone = window.innerHeight < 540 || window.innerWidth < 920;
    const b = jobBounds();
    const minW = phone ? 12.2 : 14.0;
    const minH = phone ? 6.5 : 7.2;
    const maxW = phone ? 18.5 : 23.5;
    const maxH = phone ? 9.2 : 11.4;
    return {
      w: Math.max(minW, Math.min(maxW, b.w)),
      h: Math.max(minH, Math.min(maxH, b.h)),
    };
  }

  function applyCam(snap) {
    const t = focusTarget();
    const k = snap ? 1 : (playing ? 0.1 : 0.22);
    view.fx += (t.x - view.fx) * k;
    view.fy += (t.y - view.fy) * k;
    const sp = frameSpan();
    const pad = 8 * view.dpr;
    const sx = (canvas.width - pad * 2) / sp.w;
    const sy = (canvas.height - pad * 2) / sp.h;
    view.scale = Math.max(8, Math.min(sx, sy) * view.zoom);
    view.ox = canvas.width * 0.45 - view.fx * view.scale + view.panx;
    view.oy = canvas.height * 0.38 - view.fy * view.scale + view.pany;
  }

  function fit() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    view.dpr = dpr;
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.max(1, Math.round(rect.width * dpr));
    canvas.height = Math.max(1, Math.round(rect.height * dpr));
    applyCam(true);
  }

  function wx(x) { return Math.round(view.ox + x * view.scale); }
  function wy(y) { return Math.round(canvas.height - (view.oy + y * view.scale)); }
  function wr(n) { return n * view.scale; }

  function canEditSite() {
    if (courseId === "editor") return true;
    try { return new URLSearchParams(location.search).get("edit") === "1"; } catch (e) { return false; }
  }

  function setTool(id) {
    tool = id;
    document.querySelectorAll("[data-tool]").forEach((b) => {
      b.classList.toggle("on", b.getAttribute("data-tool") === id);
    });
  }

  function setLayer(id) {
    if (id === "level" && !canEditSite()) {
      toast("Challenges lock the site. Use Site Editor to move floors.");
      id = "machine";
    }
    layer = id;
    document.body.dataset.site = canEditSite() ? "1" : "0";
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
    if (hintEl) hintEl.textContent = lastReadout || text;
    const pack = GUIDE[courseId] || GUIDE.open;
    if (sysCourse) sysCourse.textContent = pack.system;
  }

  function resetLoop(id) {
    if (id) courseId = id;
    everTested = false;
    pinnedStep = null;
    tapeA = null;
    tapeB = null;
    lastTrail = [];
    lastReadout = "";
    if (courseId !== "measure") measureDone = {};
    else measureDone = (progress.wins.measure && progress.wins.measure.jobs) ? { ...progress.wins.measure.jobs } : {};
    if (courseId !== "forces") forceDone = {};
    else forceDone = (progress.wins.forces && progress.wins.forces.jobs) ? { ...progress.wins.forces.jobs } : {};
    refreshGuide();
    refreshLesson();
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
    const menuRank = document.getElementById("rank-menu");
    if (menuRank) menuRank.textContent = `${rank.name} · ${progress.xp} XP`;
    if (bar) {
      bar.setAttribute("aria-valuenow", String(progress.xp));
      bar.setAttribute("aria-valuemax", String(next ? next.at : rank.at + span));
      bar.setAttribute("aria-label", `${rank.name}, ${progress.xp} XP`);
    }
  }

  function isMeasure() { return courseId === "measure"; }
  function isForces() { return courseId === "forces"; }

  function refreshLesson() {
    const card = document.getElementById("lesson");
    const tapeBtn = document.getElementById("tape-tool");
    const kicker = document.getElementById("lesson-kicker");
    const measureOl = document.getElementById("measure-jobs");
    const forceOl = document.getElementById("force-jobs");
    if (tapeBtn) tapeBtn.hidden = !isMeasure();
    if (!card) return;
    const on = isMeasure() || isForces();
    card.hidden = !on;
    if (!on) return;
    if (kicker) kicker.textContent = isForces() ? "Lesson · Forces" : "Lesson · Measure";
    if (measureOl) measureOl.hidden = !isMeasure();
    if (forceOl) forceOl.hidden = !isForces();
    if (isMeasure()) {
      card.querySelectorAll("#measure-jobs [data-job]").forEach((li) => {
        li.classList.toggle("ok", !!measureDone[li.getAttribute("data-job")]);
      });
      const read = document.getElementById("tape-readout");
      if (read) {
        const n = MEASURE_JOBS.filter((j) => measureDone[j.id]).length;
        read.textContent = n >= 3
          ? "Three logs in. You can still build."
          : "Tape: click two corners on a grid line. 1 square = 1 unit.";
      }
    } else {
      card.querySelectorAll("#force-jobs [data-job]").forEach((li) => {
        li.classList.toggle("ok", !!forceDone[li.getAttribute("data-job")]);
      });
      const read = document.getElementById("tape-readout");
      if (read) {
        const n = FORCE_JOBS.filter((j) => forceDone[j.id]).length;
        read.textContent = n >= 3
          ? "Three logs in. Gravity, torque, motion."
          : "Play a pusher. Watch g, torque, then the crate move.";
      }
    }
  }

  function noteForce(id) {
    if (!isForces() || forceDone[id]) return;
    forceDone[id] = true;
    const n = FORCE_JOBS.filter((j) => forceDone[j.id]).length;
    const rec = progress.wins.forces || { bestParts: 99, n: 0, jobs: {} };
    rec.jobs = { ...forceDone };
    progress.wins.forces = rec;
    if (n >= 3 && !rec.complete) {
      rec.complete = true;
      rec.n = (rec.n || 0) + 1;
      progress.xp += 18;
      saveProgress();
      refreshRank();
      toast("Forces lesson done. +18 XP. Gravity, torque, motion.");
    } else {
      saveProgress();
      const hit = FORCE_JOBS.find((j) => j.id === id);
      toast(`${hit ? hit.label : id}. Logged ${n} / 3.`);
    }
    refreshLesson();
  }

  function sampleForces() {
    if (!isForces() || !sim) return;
    if (playAge > 0.45) noteForce("gravity");
    if (sim.cores[0]) {
      const v = sim.cores[0].getLinearVelocity();
      if (Math.hypot(v.x, v.y) > 0.6) noteForce("motion");
    }
    for (const item of sim.bodies) {
      const t = item.part.type;
      if ((t === "driveR" || t === "driveL") && Math.abs(item.body.getAngularVelocity()) > 1.2) {
        noteForce("torque");
      }
    }
  }

  function tapeLength(a, b) {
    const dx = Math.abs(b.x - a.x);
    const dy = Math.abs(b.y - a.y);
    if (dy < 0.35) return dx;
    if (dx < 0.35) return dy;
    return Math.hypot(dx, dy);
  }

  function scoreTape() {
    if (!tapeA || !tapeB || !isMeasure()) return;
    const len = tapeLength(tapeA, tapeB);
    const readout = document.getElementById("tape-readout");
    if (readout) readout.textContent = `${len.toFixed(1)} units`;
    let hit = null;
    for (const job of MEASURE_JOBS) {
      if (measureDone[job.id]) continue;
      const target = job.get(doc);
      if (Math.abs(len - target) <= 0.35) hit = job;
    }
    if (!hit) {
      toast(`${len.toFixed(1)} units. Not a job yet — try a width or the gap.`);
      return;
    }
    measureDone[hit.id] = true;
    const n = MEASURE_JOBS.filter((j) => measureDone[j.id]).length;
    const rec = progress.wins.measure || { bestParts: 99, n: 0, jobs: {} };
    rec.jobs = { ...measureDone };
    progress.wins.measure = rec;
    if (n >= 3 && !rec.complete) {
      rec.complete = true;
      rec.n = (rec.n || 0) + 1;
      progress.xp += 18;
      saveProgress();
      refreshRank();
      toast("Measure lesson done. +18 XP. Three lengths logged.");
    } else {
      saveProgress();
      toast(`${hit.label}: ${len.toFixed(1)} units. Logged ${n} / 3.`);
    }
    refreshLesson();
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
    parkHeat();
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

  function coarsePointer() {
    return window.matchMedia("(hover: none)").matches || window.innerWidth < 900;
  }

  function collapseRail() {
    const rail = document.getElementById("rail");
    const btn = document.getElementById("btn-rail");
    if (!rail) return;
    rail.classList.remove("open");
    if (btn) btn.setAttribute("aria-expanded", "false");
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
    document.body.dataset.play = playing ? "1" : "0";
    const slowBtn = document.getElementById("btn-slow");
    if (slowBtn) slowBtn.classList.toggle("on", slowMo);
    const slowMenu = document.getElementById("btn-slow-menu");
    if (slowMenu) {
      slowMenu.classList.toggle("on", slowMo);
      slowMenu.textContent = slowMo ? "Slow on" : "Slow";
    }
    refreshGuide();
    refreshRank();
    refreshLesson();
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
    lastTrail = [];
    lastReadout = "";
    playAge = 0;
    everTested = true;
    pinnedStep = null;
    winEl.classList.remove("show");
    if (coarsePointer()) collapseRail();
    refreshMeta();
  }

  function crateReadout() {
    if (won) return "Parked. Output reached the Drop Zone.";
    if (!trail.length) return "No trail. Test needs a crate in motion.";
    const last = trail[trail.length - 1];
    const drop = doc.level.drop;
    const shop = doc.level.shop;
    if (last.y < -0.8) return "Crate left the world. Failed output.";
    if (drop && inRect(last.x, last.y, drop)) return "Close. In the zone, but not for a full second.";
    const xs = trail.slice(-24).map((p) => p.x);
    const span = xs.length ? Math.max(...xs) - Math.min(...xs) : 0;
    if (shop && last.x >= shop.x - 0.2 && last.x <= shop.x + shop.w + 0.2 && span < 0.55) {
      return "Crate sat still. Add Drive on a hub, then Play.";
    }
    if (trail.length < 18 && span < 0.45) return "Crate barely moved. Check Drive on a hub.";
    if (shop && drop && last.x > shop.x + shop.w && last.x < drop.x && last.y < 0.85) {
      return "Crate fell in a gap. Process path broke.";
    }
    if (span < 0.4 && last.x < (drop ? drop.x : 20)) return "Crate stalled. A wall or friction ate the process.";
    if (drop && last.x > drop.x + drop.w + 0.4) return "Crate overshot the Drop Zone.";
    return "Crate missed the Drop Zone. The trail is feedback — Improve one thing.";
  }

  function stopPlay() {
    if (playing && !won) lastReadout = crateReadout();
    else if (won) lastReadout = "Parked. Output reached the Drop Zone.";
    lastTrail = trail.slice();
    playing = false;
    sim = null;
    won = false;
    winT = 0;
    winEl.classList.remove("show");
    const hint = document.getElementById("status-hint");
    if (hint && lastReadout) hint.textContent = lastReadout;
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
    playAge += DT * n;
    sampleForces();
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
    if (s > 22) {
      ctx.fillStyle = "rgba(26,26,26,0.55)";
      ctx.font = `800 ${Math.max(9, Math.round(s * 0.28))}px ${getComputedStyle(document.body).fontFamily}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("BOT", 0, 0);
    }
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
    ctx.save();
    ctx.font = `700 ${Math.max(12, Math.round(13 * view.dpr))}px ${getComputedStyle(document.body).fontFamily}`;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    const w = ctx.measureText(text).width;
    const h = Math.max(16, Math.round(16 * view.dpr));
    ctx.fillStyle = "rgba(243,238,228,0.94)";
    ctx.fillRect(x - 5, y - 3, w + 10, h + 2);
    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
    ctx.restore();
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
    const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const swing = reduce ? 0 : Math.sin(now / 1400 + x) * wr(0.08);
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
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, h);
    ctx.setLineDash([]);
  }

  function drawWorldArrow(x, y, dx, dy, label, color) {
    const x0 = wx(x), y0 = wy(y);
    const x1 = wx(x + dx), y1 = wy(y + dy);
    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();
    const ang = Math.atan2(y1 - y0, x1 - x0);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x1 - Math.cos(ang - 0.45) * 8, y1 - Math.sin(ang - 0.45) * 8);
    ctx.lineTo(x1 - Math.cos(ang + 0.45) * 8, y1 - Math.sin(ang + 0.45) * 8);
    ctx.closePath();
    ctx.fill();
    if (label) {
      ctx.font = `700 ${Math.max(10, Math.round(11 * view.dpr))}px ${getComputedStyle(document.body).fontFamily}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";
      ctx.lineWidth = 3;
      ctx.strokeStyle = "rgba(26,26,26,0.7)";
      ctx.strokeText(label, x1, y1 - 4);
      ctx.fillStyle = color;
      ctx.fillText(label, x1, y1 - 4);
    }
    ctx.restore();
  }

  function drawForceMarks() {
    if (!playing || !sim) return;
    const loud = isForces();
    for (const b of sim.cores) {
      const p = b.getPosition();
      const v = b.getLinearVelocity();
      drawWorldArrow(p.x, p.y, 0, -0.72, "g", "#f0c000");
      if (Math.hypot(v.x, v.y) > 0.35) {
        const s = 0.5 / Math.max(0.5, Math.hypot(v.x, v.y));
        drawWorldArrow(p.x + 0.38, p.y + 0.12, v.x * s, v.y * s, "v", ORANGE);
      }
    }
    if (loud) {
      for (const item of sim.bodies) {
        const t = item.part.type;
        if (t !== "driveR" && t !== "driveL") continue;
        const p = item.body.getPosition();
        ctx.save();
        ctx.strokeStyle = ORANGE;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(wx(p.x), wy(p.y), wr(WHEEL_R + 0.18), t === "driveR" ? 0.2 : Math.PI - 0.2, t === "driveR" ? 1.4 : Math.PI - 1.4);
        ctx.stroke();
        ctx.restore();
      }
    }
  }

  function drawShopSet(now) {
    const wall = ctx.createLinearGradient(0, 0, 0, canvas.height);
    wall.addColorStop(0, "#3a434c");
    wall.addColorStop(0.5, "#6a7380");
    wall.addColorStop(1, "#c4b496");
    ctx.fillStyle = wall;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const dpr = view.dpr;
    const brickH = 16 * dpr, brickW = 34 * dpr;
    const wallBottom = canvas.height * 0.58;
    ctx.strokeStyle = "rgba(30,34,40,0.22)";
    ctx.lineWidth = 1;
    for (let row = 0; row * brickH < wallBottom; row++) {
      const yy = row * brickH;
      const off = (row % 2) * brickW * 0.5;
      ctx.beginPath();
      ctx.moveTo(0, yy);
      ctx.lineTo(canvas.width, yy);
      ctx.stroke();
      for (let col = -1; col * brickW < canvas.width + brickW; col++) {
        const xx = col * brickW + off;
        ctx.beginPath();
        ctx.moveTo(xx, yy);
        ctx.lineTo(xx, yy + brickH);
        ctx.stroke();
      }
    }

    for (const t of [0.2, 0.5, 0.8]) {
      const x = canvas.width * t - 36 * dpr;
      const y = 12 * dpr;
      const w = 70 * dpr, h = 48 * dpr;
      ctx.fillStyle = "rgba(210,230,245,0.28)";
      ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = "rgba(255,255,255,0.3)";
      ctx.strokeRect(x, y, w, h);
      ctx.fillStyle = "rgba(245,196,0,0.09)";
      ctx.beginPath();
      ctx.moveTo(x, y + h);
      ctx.lineTo(x + w, y + h);
      ctx.lineTo(x + w + 50 * dpr, canvas.height);
      ctx.lineTo(x - 50 * dpr, canvas.height);
      ctx.closePath();
      ctx.fill();
    }

    if (playing) {
      for (let i = 0; i < 18; i++) {
        const x = ((i * 97 + now * 0.02) % canvas.width);
        const y = 40 * dpr + (i * 53 % (canvas.height * 0.55));
        ctx.fillStyle = "rgba(255,248,220,0.14)";
        ctx.beginPath();
        ctx.arc(x, y, 1.3 * dpr, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    for (const t of [0.24, 0.5, 0.76]) {
      const px = canvas.width * t;
      const py = 10 * dpr;
      const swing = Math.sin(now / 1400 + t * 8) * 6 * dpr;
      ctx.strokeStyle = "#2a2e33";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(px, 0);
      ctx.lineTo(px + swing, py + 18 * dpr);
      ctx.stroke();
      const g = ctx.createRadialGradient(px + swing, py + 20 * dpr, 4, px + swing, py + 20 * dpr, 120 * dpr);
      g.addColorStop(0, "rgba(245,196,0,0.32)");
      g.addColorStop(1, "rgba(245,196,0,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(px + swing, py + 20 * dpr, 120 * dpr, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(px + swing - 8 * dpr, py + 16 * dpr);
      ctx.lineTo(px + swing + 8 * dpr, py + 16 * dpr);
      ctx.lineTo(px + swing, py + 28 * dpr);
      ctx.closePath();
      ctx.fillStyle = "#f5c400";
      ctx.fill();
      ctx.strokeStyle = "#2a2e33";
      ctx.stroke();
    }

    const shop = doc.level.shop;
    if (shop) {
      drawPallet(shop.x - 1.35, 1.05);
      drawCone(shop.x - 0.5, 1.05);
    }
    const drop = doc.level.drop;
    if (drop) drawCone(drop.x + drop.w + 0.55, 1.05);
  }

  function drawGraphPaper() {
    ctx.save();
    ctx.beginPath();
    ctx.rect(wx(0), wy(WORLD_H), wr(WORLD_W), wr(WORLD_H));
    ctx.clip();
    for (let x = 0; x <= WORLD_W; x++) {
      ctx.strokeStyle = x % 5 === 0 ? "rgba(18,48,73,0.38)" : "rgba(18,48,73,0.14)";
      ctx.lineWidth = x % 5 === 0 ? 1.6 : 1;
      ctx.beginPath();
      ctx.moveTo(wx(x) + 0.5, wy(0));
      ctx.lineTo(wx(x) + 0.5, wy(WORLD_H));
      ctx.stroke();
    }
    for (let y = 0; y <= WORLD_H; y++) {
      ctx.strokeStyle = y % 5 === 0 ? "rgba(18,48,73,0.38)" : "rgba(18,48,73,0.14)";
      ctx.lineWidth = y % 5 === 0 ? 1.6 : 1;
      ctx.beginPath();
      ctx.moveTo(wx(0), wy(y) + 0.5);
      ctx.lineTo(wx(WORLD_W), wy(y) + 0.5);
      ctx.stroke();
    }
    ctx.fillStyle = "rgba(18,48,73,0.78)";
    ctx.font = `700 ${Math.max(10, Math.round(11 * view.dpr))}px ${getComputedStyle(document.body).fontFamily}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    for (let x = 0; x <= WORLD_W; x += 2) {
      ctx.fillText(String(x), wx(x), wy(1.2) + 4);
    }
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    for (let y = 2; y <= 12; y += 2) {
      ctx.fillText(String(y), wx(0.45), wy(y));
    }
    ctx.restore();
    ctx.fillStyle = "rgba(42,46,51,0.82)";
    ctx.fillRect(wx(0.4), wy(WORLD_H - 0.35), wr(6.6), wr(0.7));
    ctx.fillStyle = "#f5c400";
    ctx.font = `800 ${Math.max(11, Math.round(12 * view.dpr))}px ${getComputedStyle(document.body).fontFamily}`;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText("1 square = 1 unit", wx(0.55), wy(WORLD_H - 0.7));
  }

  function drawTape() {
    const a = tapeA;
    const b = tapeB || (tool === "tape" ? hover : null);
    if (!a) return;
    const bx = b ? b.x : a.x;
    const by = b ? b.y : a.y;
    ctx.save();
    ctx.strokeStyle = "#f5c400";
    ctx.lineWidth = 3;
    ctx.setLineDash([7, 4]);
    ctx.beginPath();
    ctx.moveTo(wx(a.x), wy(a.y));
    ctx.lineTo(wx(bx), wy(by));
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "#f5c400";
    ctx.beginPath();
    ctx.arc(wx(a.x), wy(a.y), 5, 0, Math.PI * 2);
    ctx.fill();
    if (b) {
      ctx.beginPath();
      ctx.arc(wx(bx), wy(by), 5, 0, Math.PI * 2);
      ctx.fill();
      const len = tapeLength(a, b);
      const mx = wx((a.x + bx) / 2);
      const my = wy((a.y + by) / 2) - 10;
      ctx.fillStyle = "#2a2e33";
      ctx.fillRect(mx - 28, my - 10, 56, 18);
      ctx.fillStyle = "#f5c400";
      ctx.font = `800 ${Math.max(11, Math.round(12 * view.dpr))}px ${getComputedStyle(document.body).fontFamily}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`${len.toFixed(1)} u`, mx, my);
    }
    ctx.restore();
  }

  function draw() {
    const now = performance.now();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawShopSet(now);
    if (isMeasure()) drawGraphPaper();

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
    const kick = Math.max(4, wr(0.1));
    const floorX = wx(doc.level.shop.x);
    const floorY = wy(doc.level.shop.y);
    ctx.fillStyle = "#1e2226";
    ctx.fillRect(floorX, floorY - kick - 2, wr(doc.level.shop.w), 2);
    ctx.fillStyle = "#f0c000";
    ctx.fillRect(floorX, floorY - kick, wr(doc.level.shop.w), kick);

    drawDropBay(doc.level.drop);

    stencil("Shop Floor", wx(doc.level.shop.x) + 6, wy(doc.level.shop.y + doc.level.shop.h) + 8, NAVY);
    stencil("Drop Zone", wx(doc.level.drop.x) + 8, wy(doc.level.drop.y + doc.level.drop.h) + 8, ORANGE);
    if (isMeasure()) drawTape();

    if ((playing && trail.length > 1) || (!playing && lastTrail.length > 1)) {
      const path = playing ? trail : lastTrail;
      ctx.beginPath();
      ctx.strokeStyle = playing ? "rgba(232,119,34,0.7)" : "rgba(232,119,34,0.32)";
      ctx.lineWidth = playing ? 2 : 2;
      ctx.setLineDash(playing ? [] : [5, 6]);
      path.forEach((p, i) => {
        if (i === 0) ctx.moveTo(wx(p.x), wy(p.y));
        else ctx.lineTo(wx(p.x), wy(p.y));
      });
      ctx.stroke();
      ctx.setLineDash([]);
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
        const pt = { x: drag.x, y: drag.y };
        for (const n of allNodes()) {
          if (dist(n, pt) < SNAP * 1.8) {
            ctx.beginPath();
            ctx.strokeStyle = "rgba(245,196,0,0.95)";
            ctx.lineWidth = 2.5;
            ctx.arc(wx(n.x), wy(n.y), Math.max(7, wr(0.18)), 0, Math.PI * 2);
            ctx.stroke();
          }
        }
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
        } else if (t === "core") {
          drawCrate(p.x, p.y, a);
          if (document.body.dataset.role === "observer") {
            ctx.beginPath();
            ctx.strokeStyle = "rgba(245,196,0,0.9)";
            ctx.lineWidth = 2.5;
            ctx.arc(wx(p.x), wy(p.y), wr(CORE_S * 0.9), 0, Math.PI * 2);
            ctx.stroke();
          }
        }
        else drawWheel(p.x, p.y, a, t);
      }
      drawForceMarks();
    }

    if (debugOn) {
      frames += 1;
      if (now - fpsT >= 500) {
        fps = Math.round(frames * 1000 / Math.max(1, now - fpsT));
        frames = 0;
        fpsT = now;
      }
      ctx.fillStyle = "rgba(26,26,26,0.72)";
      ctx.fillRect(8, 8, 220, 52);
      ctx.fillStyle = "#f5c400";
      ctx.font = `700 ${Math.max(11, Math.round(11 * view.dpr))}px ${getComputedStyle(document.body).fontFamily}`;
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText(`${APP_CHIP} · ${fps} fps · ${pieceCount(doc)} parts`, 14, 14);
      ctx.fillStyle = "#f4efe6";
      ctx.fillText(lastReadout || (playing ? "test" : "shop"), 14, 32);
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
      if (!canEditSite()) return;
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

    if (tool === "tape") {
      if (!tapeA || tapeB) { tapeA = { x: pt.x, y: pt.y }; tapeB = null; }
      else { tapeB = { x: pt.x, y: pt.y }; scoreTape(); }
      return;
    }

    if (layer === "level") {
      if (!canEditSite()) { setLayer("machine"); return; }
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
    applyCam(true);
  }

  async function loadBuiltin(id) {
    const item = BUILTIN.find((x) => x.id === id);
    if (!item) return;
    if (playing) stopPlay();
    if (!item.url) {
      doc = defaultDoc();
      if (item.id === "editor") doc.title = "Site Editor";
    } else {
      const res = await fetch(item.url);
      doc = unpackDoc(await res.json());
    }
    dirty = false;
    resetLoop(item.id);
    const pick = document.getElementById("level-pick");
    if (pick) pick.value = item.id;
    setLayer("machine");
    setTool(item.id === "measure" ? "tape" : "driveR");
    applyCam(true);
    refreshMeta();
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
    const periodBtn = document.getElementById("btn-period");
    if (periodBtn) periodBtn.addEventListener("click", () => resetHeat(false));
    document.querySelectorAll("[data-role]").forEach((b) => {
      b.addEventListener("click", () => setRole(b.getAttribute("data-role")));
    });
    document.getElementById("btn-play").addEventListener("click", () => playing ? stopPlay() : startPlay());
    document.getElementById("btn-stop").addEventListener("click", stopPlay);
    const toggleSlow = () => {
      slowMo = !slowMo;
      refreshMeta();
      toast(slowMo ? "Slow-mo on" : "Full speed");
    };
    const slowBtn = document.getElementById("btn-slow");
    if (slowBtn) slowBtn.addEventListener("click", toggleSlow);
    const slowMenu = document.getElementById("btn-slow-menu");
    if (slowMenu) slowMenu.addEventListener("click", toggleSlow);
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
      setTool("driveR");
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
      await loadBuiltin(ev.target.value);
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
      if (ev.key === "t" || ev.key === "T") { if (isMeasure()) setTool("tape"); }
      if (ev.key === "Escape") {
        showCrew(false);
        showSystems(false);
        hideHowto();
        debugOn = false;
      }
      if (ev.key === "`") debugOn = !debugOn;
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
    const howtoOpen = document.getElementById("howto") && !document.getElementById("howto").hidden;
    const busy = playing || drag || howtoOpen || debugOn;
    if (!busy && now - lastDraw < 50) {
      requestAnimationFrame(loop);
      return;
    }
    lastDraw = now;
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
    applyCam(false);
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
  const assigned = new URLSearchParams(location.search).get("course");
  debugOn = new URLSearchParams(location.search).get("debug") === "1";
  let embed = new URLSearchParams(location.search).get("embed") === "1"
    || new URLSearchParams(location.search).get("tw") === "1";
  try { if (window.self !== window.top) embed = true; } catch (e) { embed = true; }
  document.body.dataset.embed = embed ? "1" : "0";
  document.body.dataset.tw = embed ? "1" : "0";
  if (assigned && BUILTIN.some((x) => x.id === assigned)) {
    loadBuiltin(assigned);
  } else {
    try {
      if (!embed && !localStorage.getItem("bb-howto-v2") && !tightHud()) showHowto(0);
    } catch (e) { /* ignore */ }
  }
  requestAnimationFrame(loop);
}
