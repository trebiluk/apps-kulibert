/* Berty's Botz BB 0.19.30 — bundled for any http(s) host */
/* One string. Chip, changelog header, vercel header, About — all read this. */
const APP_NAME = "Berty's Botz";
const APP_PREFIX = "BB";
const APP_VERSION = "0.19.30";
const APP_CHANNEL = "live";
const APP_CHIP = "BB 0.19.30";
const APP_BUILT = "2026-09-26";

const FORMAT = 1;
const PIECE_CAP = 48;

function blankMachine() {
  return { parts: [] };
}

function defaultLevel() {
  return {
    shop: { x: 1.2, y: 1.2, w: 8.2, h: 4.6 },
    drop: { x: 20.2, y: 1.2, w: 4.6, h: 3.4 },
    world: [
      { type: "slab", x: 0, y: 0, w: 28, h: 1.2 },
      { type: "slab", x: 0, y: 1.2, w: 0.4, h: 10 },
      { type: "slab", x: 27.6, y: 1.2, w: 0.4, h: 10 },
    ],
    cores: [{ x: 6.4, y: 1.48 }],
    tools: ["driveR", "driveL", "roller", "steel", "ghost"],
  };
}

function defaultDoc() {
  return {
    app: "bertybots",
    format: FORMAT,
    title: "Open Shop",
    appVersion: APP_CHIP,
    level: defaultLevel(),
    machine: blankMachine(),
  };
}

function sanitizeTitle(raw) {
  const t = String(raw || "").replace(/\s+/g, " ").trim().slice(0, 48);
  return t || "Open Shop";
}

function packDoc(doc) {
  return {
    app: "bertybots",
    format: FORMAT,
    title: sanitizeTitle(doc.title),
    appVersion: APP_VERSION,
    level: {
      shop: { ...doc.level.shop },
      drop: { ...doc.level.drop },
      world: (doc.level.world || []).map((w) => ({ ...w })),
      cores: (doc.level.cores || []).map((c) => ({ x: c.x, y: c.y })),
      tools: [...(doc.level.tools || defaultLevel().tools)],
    },
    machine: {
      parts: (doc.machine.parts || []).map((p) => ({ ...p })),
    },
  };
}

function unpackDoc(raw) {
  const base = defaultDoc();
  if (!raw || raw.app !== "bertybots") throw new Error("Not a Berty's Botz file.");
  const level = raw.level || {};
  const shop = { ...base.level.shop, ...(level.shop || {}) };
  const drop = { ...base.level.drop, ...(level.drop || {}) };
  const world = Array.isArray(level.world) ? level.world.map((w) => ({ ...w })) : base.level.world;
  const cores = Array.isArray(level.cores) && level.cores.length
    ? level.cores.slice(0, 3).map((c) => ({ x: +c.x, y: +c.y }))
    : base.level.cores;
  const gates = Array.isArray(level.gates)
    ? level.gates.slice(0, 6).map((g) => ({ x: +g.x, y: +g.y, w: +g.w, h: +g.h }))
    : [];
  const tools = Array.isArray(level.tools) && level.tools.length ? level.tools : base.level.tools;
  const parts = raw.machine && Array.isArray(raw.machine.parts) ? raw.machine.parts.map((p) => ({ ...p })) : [];
  return {
    app: "bertybots",
    format: FORMAT,
    title: sanitizeTitle(raw.title),
    level: { shop, drop, world, cores, tools, gates },
    machine: { parts },
  };
}

function downloadDoc(doc, filename) {
  const blob = new Blob([JSON.stringify(packDoc(doc), null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  const safe = (filename || sanitizeTitle(doc.title) || "shop").replace(/[^\w.-]+/g, "-").toLowerCase();
  a.href = URL.createObjectURL(blob);
  a.download = safe.endsWith(".bertybots.json") ? safe : `${safe}.bertybots.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1500);
}

function downloadLevel(doc) {
  const packed = packDoc(doc);
  packed.kind = "botzlevel";
  const blob = new Blob([JSON.stringify(packed, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  const alias = sanitizeTitle(doc.title).replace(/[^\w.-]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").toLowerCase() || "level";
  a.href = URL.createObjectURL(blob);
  a.download = `${alias}.botzlevel.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1500);
}

function readFile(file) {
  return file.text().then((text) => unpackDoc(JSON.parse(text)));
}

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
  { id: "sprint", label: "Sprint", url: "levels/sprint.json" },
  { id: "gates", label: "Gates", url: "levels/gates.json" },
  { id: "lap", label: "Long Lap", url: "levels/long-lap.json" },
];

const RACES = [
  { id: "sprint", label: "Sprint", mark: "S" },
  { id: "gates", label: "Gates", mark: "G" },
  { id: "lap", label: "Long Lap", mark: "L" },
];

const JOBS = [
  { id: "open", label: "Fix it" },
  { id: "roll", label: "Roll Out" },
  { id: "curb", label: "Up the Curb" },
  { id: "pit", label: "Mind the Pit" },
  { id: "wall", label: "The Wall" },
  { id: "shelf", label: "High Shelf" },
  { id: "pair", label: "Pair of Crates" },
];

const STEPS = ["ask", "imagine", "plan", "create", "test", "improve"];
const CURR_KEY = "bb-curriculum-v1";
const CURR_LINE = {
  ask: "Ask what the crate has to do.",
  imagine: "Imagine more than one way.",
  plan: "Plan the wheel before you drop it.",
  create: "Create it on the shop floor.",
  test: "Test it. Press Play.",
  improve: "Improve one thing, then test again.",
};

const ACCESS_KEY = "bz-access-v1";
const ACCESS_COPY = {
  en: {
    settings: "Settings", lang: "Language", read: "Read", close: "Close",
    speak: "Read aloud", big: "Big text", fewer: "Fewer answers",
    on: "On", off: "Off", speakOn: "Read aloud is on.",
    english: "English.", simple: "Simple words.", es: "Español.",
  },
  simple: {
    settings: "Settings", lang: "Language", read: "Read", close: "Close",
    speak: "Read aloud", big: "Big text", fewer: "Fewer answers",
    on: "On", off: "Off", speakOn: "Read aloud is on.",
    english: "English.", simple: "Simple words.", es: "Español.",
  },
  es: {
    settings: "Ajustes", lang: "Idioma", read: "Leer", close: "Cerrar",
    speak: "Leer en voz alta", big: "Texto grande", fewer: "Menos respuestas",
    on: "Sí", off: "No", speakOn: "Lectura activada.",
    english: "English.", simple: "Palabras simples.", es: "Español.",
  },
};
const HOWTO_SHORT = {
  simple: [
    { title: "The shop", body: "Build a machine. Park the crate in the orange box." },
    { title: "The job", body: "The crate stays in the orange box for one second." },
    { title: "The parts", body: "Drive-R goes right. Drive-L goes left. Steel is the bar." },
    { title: "Then Play", body: "Drag a wheel. Tap Play. Tap Stop to go back." },
  ],
  es: [
    { title: "La tienda", body: "Armas una máquina. Deja la caja en la zona naranja." },
    { title: "El trabajo", body: "La caja queda en la zona naranja un segundo." },
    { title: "Las piezas", body: "Drive-R va a la derecha. Drive-L va a la izquierda." },
    { title: "Luego Play", body: "Arrastra una rueda. Toca Play. Toca Stop para volver." },
  ],
};

function readAccess() {
  try {
    const raw = JSON.parse(localStorage.getItem(ACCESS_KEY) || "{}");
    const lang = raw.lang === "simple" || raw.lang === "es" ? raw.lang : "en";
    return { lang, speak: !!raw.speak, big: !!raw.big, fewer: !!raw.fewer };
  } catch (e) {
    return { lang: "en", speak: false, big: false, fewer: false };
  }
}

function writeAccess(next) {
  try { localStorage.setItem(ACCESS_KEY, JSON.stringify(next)); } catch (e) { /* private mode */ }
  document.documentElement.dataset.big = next.big ? "1" : "0";
  document.documentElement.dataset.lang = next.lang;
  window.dispatchEvent(new Event("bz-access"));
}

function say(text, lang) {
  if (!window.speechSynthesis || !text) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang === "es" ? "es-US" : "en-US";
  u.rate = lang === "simple" ? 0.85 : 0.95;
  window.speechSynthesis.speak(u);
}

function stopSay() {
  if (window.speechSynthesis) window.speechSynthesis.cancel();
}

let access = readAccess();
writeAccess(access);
const HOWTO = [
  {
    title: "Right wheel",
    body: "The orange wheel rolls to the right. Put it behind the crate so it can push.",
  },
  {
    title: "The other parts",
    body: "The left wheel rolls the other way. A silver bar connects. A dashed bar misses the machine.",
  },
  {
    title: "Then Play",
    body: "Play runs the test. Stop puts the shop back. On the next job, you place the wheel yourself.",
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
    plan: "Plan: build only on the Shop Floor. 48-part cap. Builder places the parts.",
    create: "Create: drag a wheel onto a hub. Steel pulls from a node. Starter cart is a pusher, not a finished design.",
    test: "Test: Play. Gravity and Drive are inputs. The orange trail is feedback. Stop restores the shop.",
    improve: "Improve: change one thing, then test again.",
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
    ask: "Ask: the wheel falls in. Lay a silver bar across the hole.",
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
  sprint: {
    ask: "Ask: Sprint. Build a pusher, then Play. The clock starts.",
    imagine: "Imagine the shortest machine that still reaches the stripes.",
    plan: "Plan a straight push. Extra parts cost time.",
    create: "Create on the shop floor. Orange wheel behind the crate.",
    test: "Test: Play. The board is your time.",
    improve: "Improve one thing and run it again. Best time stays on this Chromebook.",
    system: "Sprint — Input: Drive. Process: a short push. Output: crate in the stripes. Feedback: the clock.",
  },
  gates: {
    ask: "Ask: Gates. Pass gate 1, then gate 2, then park. Order counts.",
    imagine: "Imagine a machine that stays on the floor through both banners.",
    plan: "Plan the line. Missing a gate does not stop the clock.",
    create: "Create the pusher, then send it through the banners.",
    test: "Test: the banner turns green when the crate passes.",
    improve: "Improve the line, not just the speed.",
    system: "Gates — a course. Feedback is the banner and the clock. Output is the stripes after every gate.",
  },
  lap: {
    ask: "Ask: Long Lap. Three gates, then the stripes. One clock.",
    imagine: "Imagine a machine that holds together for the whole floor.",
    plan: "Plan a straight run. A wobble at gate 3 still counts.",
    create: "Create on the shop floor. The course is the world.",
    test: "Test the full lap. Stop and change one thing.",
    improve: "Improve for a cleaner lap, then Run again.",
    system: "Long Lap — same system as Sprint, longer process path. The clock is the feedback.",
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

function coreInDropAt(x, y, drop) {
  if (!drop) return false;
  if (inRect(x, y, drop)) return true;
  const box = { x: x - CORE_S / 2, y: y - CORE_S / 2, w: CORE_S, h: CORE_S };
  if (!rectsOverlap(box, drop)) return false;
  const x0 = Math.max(box.x, drop.x);
  const y0 = Math.max(box.y, drop.y);
  const x1 = Math.min(box.x + box.w, drop.x + drop.w);
  const y1 = Math.min(box.y + box.h, drop.y + drop.h);
  return (x1 - x0) * (y1 - y0) >= CORE_S * CORE_S * 0.5;
}

function isWheelPart(p) {
  return !!p && (p.type === "driveR" || p.type === "driveL" || p.type === "roller");
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

function boot() {
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
      toast("Parked count is back to 0.");
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
  let lastMiss = null;
  let lastReadout = "";
  let debugOn = false;
  let frames = 0;
  let fps = 0;
  let fpsT = 0;
  let lastDraw = 0;
  let panning = null;
  let goalCue = null;
  let courseId = "open";
  let everTested = false;
  let pinnedStep = null;
  let guideOn = true;
  let curriculumOn = false;
  try { curriculumOn = localStorage.getItem(CURR_KEY) === "1"; } catch (e) { curriculumOn = false; }
  let howtoIndex = 0;
  let tapeA = null;
  let tapeB = null;
  let measureDone = {};
  let forceDone = {};
  let playAge = 0;
  let gateN = 0;
  let progress = { xp: 0, wins: {} };
  try {
    const raw = localStorage.getItem("bb-progress-v1");
    if (raw) {
      const p = JSON.parse(raw);
      if (p && typeof p.xp === "number") progress = { xp: p.xp, wins: p.wins || {}, tried: p.tried || {}, bests: p.bests || {} };
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
    let x0 = s.x;
    let y0 = 0.05;
    let x1 = s.x + s.w;
    let y1 = 3.2;
    if (d) {
      const gapR = d.x - (s.x + s.w);
      const gapL = s.x - (d.x + d.w);
      const near = gapR < 5.5 || (gapL >= -0.4 && gapL < 8);
      if (near) {
        x0 = Math.min(x0, d.x);
        x1 = Math.max(x1, d.x + d.w);
        y0 = Math.min(y0, d.y);
        y1 = Math.max(y1, d.y + Math.min(d.h, 2.4));
      }
    }
    for (const p of doc.machine.parts || []) {
      const xs = p.x != null ? [p.x] : [p.x1, p.x2];
      const ys = p.y != null ? [p.y] : [p.y1, p.y2];
      for (const x of xs) { x0 = Math.min(x0, x - 0.5); x1 = Math.max(x1, x + 0.5); }
      for (const y of ys) { y0 = Math.min(y0, y - 0.35); y1 = Math.max(y1, y + 0.7); }
    }
    for (const c of doc.level.cores || []) {
      x0 = Math.min(x0, c.x - 0.6);
      y0 = Math.min(y0, c.y - 0.45);
      x1 = Math.max(x1, c.x + 0.7);
      y1 = Math.max(y1, c.y + 0.9);
    }
    x0 -= 0.55;
    x1 += 0.7;
    y1 += 0.35;
    return { x: x0, y: Math.max(-0.15, y0), w: Math.max(4.2, x1 - x0), h: Math.max(2.8, y1 - y0) };
  }

  function focusTarget() {
    if (typeof isMeasure === "function" && isMeasure()) return { x: WORLD_W / 2, y: 5.2 };
    if (won && sim && sim.cores[0]) {
      const p = sim.cores[0].getPosition();
      return { x: p.x, y: Math.max(2.2, p.y) };
    }
    if (playing && sim && sim.cores[0]) {
      const p = sim.cores[0].getPosition();
      const drop = doc.level.drop;
      const look = drop ? p.x * 0.7 + (drop.x + drop.w / 2) * 0.3 : p.x;
      return { x: look, y: Math.max(2.5, p.y + 1.35) };
    }
    const b = jobBounds();
    const core = (doc.level.cores || [])[0];
    if (core) return { x: core.x + 0.15, y: core.y + 0.45 };
    return { x: b.x + b.w * 0.5, y: b.y + b.h * 0.45 };
  }

  function frameSpan() {
    if (typeof isMeasure === "function" && isMeasure()) return { w: WORLD_W, h: 11 };
    const phone = window.innerHeight < 540 || window.innerWidth < 920;
    if (won) return { w: phone ? 8.5 : 10, h: phone ? 5.2 : 6 };
    return { w: phone ? 6.8 : 7.6, h: phone ? 3.6 : 4.1 };
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
    view.zoom = Math.max(0.55, Math.min(2.4, view.zoom));
    view.scale = Math.max(8, Math.min(sx, sy) * view.zoom);
    view.ox = canvas.width * 0.45 - view.fx * view.scale + view.panx;
    view.oy = canvas.height * 0.46 - view.fy * view.scale + view.pany;
    clampLook();
  }

  function jobReach() {
    const s = doc.level && doc.level.shop;
    const d = doc.level && doc.level.drop;
    let x0 = s ? s.x : 0;
    let y0 = s ? s.y : 0;
    let x1 = s ? s.x + s.w : 10;
    let y1 = s ? s.y + s.h : 4;
    if (d) {
      x0 = Math.min(x0, d.x);
      y0 = Math.min(y0, d.y);
      x1 = Math.max(x1, d.x + d.w);
      y1 = Math.max(y1, d.y + d.h);
    }
    return { x0: x0 - 2.4, y0: Math.max(-0.6, y0 - 0.8), x1: x1 + 2.4, y1: y1 + 1.8 };
  }

  function clampLook() {
    const s = doc.level && doc.level.shop;
    if (!s || !view.scale) return;
    const b = jobReach();
    const scale = view.scale;
    const left = -view.ox / scale;
    const right = (canvas.width - view.ox) / scale;
    const bottom = -view.oy / scale;
    const top = (canvas.height - view.oy) / scale;
    let shiftX = 0;
    let shiftY = 0;
    if (right - left >= b.x1 - b.x0) shiftX = (b.x0 + b.x1) / 2 - (left + right) / 2;
    else if (left < b.x0) shiftX = b.x0 - left;
    else if (right > b.x1) shiftX = b.x1 - right;
    if (top - bottom >= b.y1 - b.y0) shiftY = (b.y0 + b.y1) / 2 - (bottom + top) / 2;
    else if (bottom < b.y0) shiftY = b.y0 - bottom;
    else if (top > b.y1) shiftY = b.y1 - top;
    if (!shiftX && !shiftY) return;
    view.panx -= shiftX * scale;
    view.pany -= shiftY * scale;
    view.ox = canvas.width * 0.45 - view.fx * view.scale + view.panx;
    view.oy = canvas.height * 0.46 - view.fy * view.scale + view.pany;
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
      const id = b.getAttribute("data-step");
      const on = id === step;
      b.classList.toggle("on", on);
      b.setAttribute("aria-selected", on ? "true" : "false");
      if (access.fewer) {
        const i = STEPS.indexOf(id);
        const cur = STEPS.indexOf(step);
        b.hidden = !(i === cur || i === Math.min(STEPS.length - 1, cur + 1));
      } else b.hidden = false;
    });
    const text = guideFor(step);
    lineEl.textContent = text;
    const menuGuide = document.getElementById("menu-guide");
    if (menuGuide) menuGuide.textContent = text;
    if (hintEl) hintEl.textContent = statusLine();
    const pack = GUIDE[courseId] || GUIDE.open;
    if (sysCourse) sysCourse.textContent = pack.system;
    paintCurriculum();
  }

  function setCurriculum(on) {
    curriculumOn = !!on;
    try { localStorage.setItem(CURR_KEY, curriculumOn ? "1" : "0"); } catch (e) { /* private */ }
    document.body.dataset.curriculum = curriculumOn ? "1" : "0";
    const btn = document.getElementById("btn-curriculum");
    if (btn) {
      btn.textContent = curriculumOn ? "Curriculum: On" : "Curriculum: Off";
      btn.setAttribute("aria-pressed", curriculumOn ? "true" : "false");
      btn.classList.toggle("on", curriculumOn);
    }
    paintCurriculum();
  }

  function paintCurriculum() {
    const bar = document.getElementById("curr-bar");
    if (bar) bar.hidden = !curriculumOn;
    const steps = document.getElementById("curr-steps");
    if (steps && !steps.childElementCount) {
      STEPS.forEach((id) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "step";
        b.dataset.step = id;
        b.textContent = id.charAt(0).toUpperCase() + id.slice(1);
        steps.append(b);
      });
    }
    const line = document.getElementById("curr-line");
    if (!line || !curriculumOn) return;
    const step = pinnedStep && STEPS.includes(pinnedStep) ? pinnedStep : autoStep();
    if (courseId === "measure") line.textContent = "Count squares. 1 square = 1 unit.";
    else if (courseId === "forces") line.textContent = "Gravity down. The wheel turns. Unbalanced force moves the crate.";
    else line.textContent = CURR_LINE[step] || CURR_LINE.ask;
  }

  function resetLoop(id) {
    if (id) courseId = id;
    everTested = false;
    pinnedStep = null;
    tapeA = null;
    tapeB = null;
    lastTrail = [];
    lastMiss = null;
    lastReadout = "";
    view.zoom = 1;
    view.panx = 0;
    view.pany = 0;
    gateN = 0;
    playAge = 0;
    if (courseId !== "measure") measureDone = {};
    else measureDone = (progress.wins.measure && progress.wins.measure.jobs) ? { ...progress.wins.measure.jobs } : {};
    if (courseId !== "forces") forceDone = {};
    else forceDone = (progress.wins.forces && progress.wins.forces.jobs) ? { ...progress.wins.forces.jobs } : {};
    refreshGuide();
    refreshLesson();
  }

  function howtoCard(i) {
    const en = HOWTO[i] || HOWTO[0];
    if (access.lang === "en") return { card: en, canSpeak: true };
    const alt = (HOWTO_SHORT[access.lang] || [])[i];
    if (!alt) return { card: en, canSpeak: false };
    return { card: alt, canSpeak: true };
  }

  function showHowto(i, speakNow) {
    howtoIndex = Math.max(0, i);
    const root = document.getElementById("howto");
    const title = document.getElementById("howto-title");
    const body = document.getElementById("howto-body");
    const next = document.getElementById("howto-next");
    const read = document.getElementById("howto-read");
    if (!root || !title || !body) return;
    const picked = howtoCard(howtoIndex);
    title.textContent = picked.card.title;
    body.textContent = picked.card.body;
    const copy = ACCESS_COPY[access.lang] || ACCESS_COPY.en;
    if (next) next.textContent = howtoIndex >= HOWTO.length - 1 ? (access.lang === "es" ? "Armar" : "Build") : (access.lang === "es" ? "Siguiente" : "Next");
    if (read) read.textContent = copy.read;
    root.hidden = false;
    if (speakNow && access.speak && picked.canSpeak) say(`${picked.card.title}. ${picked.card.body}`, access.lang);
  }

  function hideHowto() {
    stopSay();
    const root = document.getElementById("howto");
    if (root) root.hidden = true;
  }

  function paintAccess() {
    const copy = ACCESS_COPY[access.lang] || ACCESS_COPY.en;
    const gear = document.getElementById("btn-settings");
    if (gear) {
      const lbl = gear.querySelector(".lbl");
      if (lbl) lbl.textContent = copy.settings;
      gear.setAttribute("aria-label", copy.settings);
    }
    const title = document.getElementById("access-title");
    if (title) title.textContent = copy.settings;
    const langLabel = document.getElementById("access-lang-label");
    if (langLabel) langLabel.textContent = copy.lang;
    const close = document.getElementById("access-close");
    if (close) close.textContent = copy.close;
    const speakBtn = document.getElementById("access-speak");
    if (speakBtn) {
      speakBtn.textContent = `${copy.speak}: ${access.speak ? copy.on : copy.off}`;
      speakBtn.classList.toggle("on", access.speak);
      speakBtn.setAttribute("aria-pressed", access.speak ? "true" : "false");
    }
    const bigBtn = document.getElementById("access-big");
    if (bigBtn) {
      bigBtn.textContent = `${copy.big}: ${access.big ? copy.on : copy.off}`;
      bigBtn.classList.toggle("on", access.big);
      bigBtn.setAttribute("aria-pressed", access.big ? "true" : "false");
    }
    const fewerBtn = document.getElementById("access-fewer");
    if (fewerBtn) {
      fewerBtn.textContent = `${copy.fewer}: ${access.fewer ? copy.on : copy.off}`;
      fewerBtn.classList.toggle("on", access.fewer);
      fewerBtn.setAttribute("aria-pressed", access.fewer ? "true" : "false");
    }
    document.querySelectorAll("[data-lang]").forEach((b) => {
      const on = b.getAttribute("data-lang") === access.lang;
      b.classList.toggle("on", on);
      b.setAttribute("aria-pressed", on ? "true" : "false");
    });
  }

  function rankAt(xp) {
    let cur = RANKS[0];
    for (const r of RANKS) if (xp >= r.at) cur = r;
    return cur;
  }

  function saveProgress() {
    try { localStorage.setItem("bb-progress-v1", JSON.stringify(progress)); } catch (e) { /* private mode */ }
    try {
      if (window.KulibertWho) KulibertWho.mark("bertybots", rankAt(progress.xp || 0).name || "Shop");
    } catch (e2) {}
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
    refreshPath();
  }

  function classJobs() {
    try {
      const raw = JSON.parse(localStorage.getItem("bb-class-jobs-v1") || "[]");
      if (!Array.isArray(raw)) return [];
      return raw.filter((j) => j && j.id && j.alias && j.doc && j.doc.app === "bertybots").slice(0, 8);
    } catch (e) { return []; }
  }

  function allClear() {
    return JOBS.every((job) => levelDone(job.id));
  }

  function jobUnlocked(id) {
    if (levelDone(id)) return true;
    if (id === "measure" || id === "forces") return true;
    if (RACES.some((race) => race.id === id)) return true;
    if (id === "editor" || classJobs().some((job) => job.id === id)) return allClear();
    const i = JOBS.findIndex((job) => job.id === id);
    if (i < 0) return false;
    if (i === 0) return true;
    return levelDone(JOBS[i - 1].id);
  }

  function plateState(id) {
    if (levelDone(id)) return "clear";
    if (progress.tried && progress.tried[id]) return "test";
    if (!jobUnlocked(id)) return "lock";
    return "now";
  }
  function levelDone(id) {
    const rec = progress.wins[id];
    return !!(rec && rec.n > 0);
  }

  let clearBeat = 0;
  let clearTour = false;

  function wheelPose() {
    const c = (doc.level.cores || [])[0];
    const spot = behindSpot();
    if (!c || !spot) return "none";
    const wheels = (doc.machine.parts || []).filter((p) => p.x != null && (p.type === "driveR" || p.type === "driveL" || p.type === "roller"));
    if (!wheels.length) return "none";
    let best = "front";
    for (const p of wheels) {
      if (p.type === "driveL" && Math.hypot(p.x - spot.x, p.y - spot.y) < 0.55) return "left";
      if (p.type !== "driveR") continue;
      if (Math.hypot(p.x - spot.x, p.y - spot.y) < 0.2) return "ready";
      if (p.x < spot.x - 0.35) best = "far";
      else if (p.x < c.x - 0.15 && best === "front") best = "close";
    }
    return best;
  }

  function behindSpot() {
    const s = doc.level.shop;
    const c = (doc.level.cores || [])[0];
    if (!s || !c) return null;
    return { x: c.x - 0.8, y: s.y + WHEEL_R + 0.04 };
  }

  function stickBehind(part) {
    if (!part || part.type !== "driveR" || part.x == null) return false;
    const guiding = ["open", "roll", "curb", "pit", "shelf", "pair"].includes(courseId) && !levelDone(courseId);
    if (!guiding) return false;
    const spot = behindSpot();
    const c = (doc.level.cores || [])[0];
    if (!spot || !c || part.x > c.x - 0.15) return false;
    if (Math.hypot(part.x - spot.x, part.y - spot.y) > 1.4) return false;
    part.x = spot.x;
    part.y = spot.y;
    part.a = 0;
    return true;
  }

  function otherSpot() {
    const s = doc.level.shop;
    const c = (doc.level.cores || [])[0];
    if (!s || !c) return null;
    return { x: c.x + 0.8, y: s.y + WHEEL_R + 0.04 };
  }

  function stickOther(part) {
    if (courseId !== "wall" || levelDone("wall") || !part || part.type !== "driveL" || part.x == null) return false;
    const spot = otherSpot();
    const c = (doc.level.cores || [])[0];
    if (!spot || !c || part.x < c.x + 0.15) return false;
    if (Math.hypot(part.x - spot.x, part.y - spot.y) > 1.4) return false;
    part.x = spot.x;
    part.y = spot.y;
    part.a = 0;
    return true;
  }

  function wallReady() {
    const spot = otherSpot();
    const c = (doc.level.cores || [])[0];
    if (!spot || !c) return false;
    const blue = (doc.machine.parts || []).some((p) => p.type === "driveL" && Math.hypot(p.x - spot.x, p.y - spot.y) < 0.28);
    const orangeFighting = (doc.machine.parts || []).some((p) => p.type === "driveR" && p.x < c.x);
    return blue && !orangeFighting;
  }

  function laneBlocked() {
    return (doc.machine.parts || []).some((p) => p.type === "roller" && p.x > 5.7 && p.x < 8.6 && p.y < 2.6);
  }

  function pitBridged() {
    return (doc.machine.parts || []).some((p) => {
      if (p.type !== "steel" || p.x1 == null) return false;
      const mid = (p.x1 + p.x2) / 2;
      const len = Math.hypot(p.x2 - p.x1, p.y2 - p.y1);
      return mid > 6.3 && mid < 8.8 && len > 2.4;
    });
  }

  function stickPitBar(part) {
    if (courseId !== "pit" || levelDone("pit") || !part || part.type !== "steel") return false;
    const xL = Math.min(part.x1, part.x2);
    const xR = Math.max(part.x1, part.x2);
    const mid = (part.x1 + part.x2) / 2;
    const len = Math.hypot(part.x2 - part.x1, part.y2 - part.y1);
    const crosses = xL < 6.6 && xR > 8.2 && len > 1.6;
    const over = mid > 6.2 && mid < 8.8 && len > 2.0;
    if (!crosses && !over) return false;
    part.x1 = 5.6;
    part.y1 = 1.35;
    part.x2 = 9.2;
    part.y2 = 1.35;
    return true;
  }

  function pairLinked() {
    const cores = doc.level.cores || [];
    if (cores.length < 2) return false;
    return (doc.machine.parts || []).some((p) => {
      if (p.type !== "steel" || p.x1 == null) return false;
      const mid = (p.x1 + p.x2) / 2;
      const gap = (cores[0].x + cores[1].x) / 2;
      return Math.abs(mid - gap) < 0.45 && Math.abs(((p.y1 + p.y2) / 2) - 1.55) < 0.25;
    });
  }

  function stickPairBar(part) {
    if (courseId !== "pair" || levelDone("pair") || !part || part.type !== "steel") return false;
    const cores = doc.level.cores || [];
    if (cores.length < 2) return false;
    const mid = { x: (part.x1 + part.x2) / 2, y: (part.y1 + part.y2) / 2 };
    const gap = { x: (cores[0].x + cores[1].x) / 2, y: 1.55 };
    if (Math.hypot(mid.x - gap.x, mid.y - gap.y) > 1.35) return false;
    if (Math.hypot(part.x2 - part.x1, part.y2 - part.y1) < 0.6) return false;
    part.x1 = cores[0].x + 0.15;
    part.y1 = 1.55;
    part.x2 = cores[1].x + 0.5;
    part.y2 = 1.55;
    return true;
  }

  function seedFix() {
    if (levelDone(courseId)) return;
    if (doc.machine.parts && doc.machine.parts.length) return;
    const s = doc.level.shop;
    const c = (doc.level.cores || [])[0];
    if (!s || !c) return;
    const y = s.y + WHEEL_R + 0.04;
    const spot = behindSpot();
    if (courseId === "open") {
      const x = Math.min(s.x + s.w - WHEEL_R - 0.3, c.x + 1.2);
      if (!inRect(x, y, s)) return;
      doc.machine.parts = [{ type: "driveR", x, y, a: 0 }];
      doc.title = "Fix it";
    } else if (courseId === "roll") {
      const x = s.x + 1.15;
      if (inRect(x, y, s)) doc.machine.parts = [{ type: "roller", x, y, a: 0 }];
    } else if (courseId === "curb") {
      const x = Math.min(s.x + s.w - WHEEL_R - 0.25, c.x - 0.8);
      if (inRect(x, y, s)) doc.machine.parts = [{ type: "driveL", x, y, a: 0 }];
    } else if (courseId === "pit" && spot && inRect(spot.x, spot.y, s)) {
      doc.machine.parts = [{ type: "driveR", x: spot.x, y: spot.y, a: 0 }];
    } else if (courseId === "wall" && spot && inRect(spot.x, spot.y, s)) {
      doc.machine.parts = [{ type: "driveR", x: spot.x, y: spot.y, a: 0 }];
    } else if (courseId === "shelf" && spot && inRect(spot.x, spot.y, s)) {
      const roller = { type: "roller", x: 6.55, y, a: 0 };
      doc.machine.parts = [{ type: "driveR", x: spot.x, y: spot.y, a: 0 }];
      if (inRect(roller.x, roller.y, s)) doc.machine.parts.push(roller);
    }
  }

  function coachLine() {
    const job = JOBS.some((j) => j.id === courseId);
    if (!job || levelDone(courseId)) return "";
    const pose = wheelPose();
    if (courseId === "open") {
      if (playing && pose !== "ready") return "That wheel is in front.";
      if (pose === "ready") return "Press Play.";
      if (pose === "far") return "Closer. Just behind the crate.";
      if (pose === "close") return "A little further back.";
      if (pose === "left") return "That wheel rolls left. Use the orange one.";
      if (pose === "none") return "Drag the orange wheel behind the crate.";
      return "Drag the wheel behind the crate.";
    }
    if (courseId === "roll") {
      return pose === "ready"
        ? "Press Play."
        : "The loose wheel doesn't push. Use the orange one.";
    }
    if (courseId === "curb") {
      if (pose === "ready") return "Press Play.";
      if (pose === "left") return "Blue wheel rolls the wrong way. Use the orange one.";
      return "Put the orange wheel in the circle.";
    }
    if (courseId === "pit") {
      return pitBridged()
        ? "Press Play."
        : "That wheel falls in. Bridge the hole.";
    }
    if (courseId === "wall") {
      const blueOn = (doc.machine.parts || []).some((p) => p.type === "driveL");
      if (wallReady()) return "Press Play.";
      if (blueOn) return "Drag the orange wheel off.";
      return "Orange hits the wall. Blue goes the other way.";
    }
    if (courseId === "shelf") {
      if (laneBlocked()) return "Drag the loose wheel off the step.";
      if (pose === "ready") return "Press Play.";
      return "Orange wheel in the circle. Keep the step clear.";
    }
    if (courseId === "pair") {
      if (!pairLinked()) return "Lay a silver bar between the crates.";
      return pose === "ready" ? "Press Play." : "Orange wheel behind the first crate.";
    }
    return "";
  }

  function statusLine() {
    if (winEl && winEl.classList.contains("show")) return "Parked.";
    if (isRace()) {
      const gates = raceGates();
      if (!playing) return "Build a pusher. Play starts the clock.";
      if (gates.length && gateN < gates.length) return `Gate ${gateN + 1} of ${gates.length}.`;
      return "Park it. The clock stops in the stripes.";
    }
    if (lastReadout) return lastReadout;
    const line = coachLine();
    if (line) return line;
    if (JOBS.some((j) => j.id === courseId) && levelDone(courseId)) return "Clear.";
    if (JOBS.some((j) => j.id === courseId)) return "Build on the shop floor.";
    return guideFor(autoStep());
  }

  function applyCoach() {
    const showingWin = winEl && winEl.classList.contains("show");
    const building = JOBS.some((j) => j.id === courseId) && (!levelDone(courseId) || showingWin);
    document.body.dataset.coach = building ? "1" : "0";
    const hint = document.getElementById("status-hint");
    if (hint) hint.textContent = statusLine();
    const pip = document.getElementById("coach-play");
    const pose = wheelPose();
    let ready = pose === "ready";
    if (courseId === "wall") ready = wallReady();
    if (courseId === "shelf") ready = !laneBlocked() && pose === "ready";
    if (courseId === "pit") ready = pitBridged();
    if (courseId === "pair") ready = pairLinked() && pose === "ready";
    const showPip = building && !playing && ready;
    if (pip) pip.hidden = !showPip;
    const play = document.getElementById("btn-play");
    if (play) play.classList.toggle("nudge", showPip);
  }

  function clearCopy() {
    const i = JOBS.findIndex((job) => job.id === courseId);
    const n = i >= 0 ? i + 1 : 1;
    const label = i >= 0 ? JOBS[i].label : "Clear";
    if (clearTour) {
      return { k: "Job 1 clear", t: "The crate parked", b: "The wheel was behind it." };
    }
    if (isRace()) {
      const t = formatTime(playAge);
      const best = progress.bests && progress.bests[courseId];
      const race = RACES.find((item) => item.id === courseId);
      const fresh = best != null && playAge <= best + 0.05;
      return {
        k: fresh ? "New best" : "Finish",
        t,
        b: best != null ? `${race ? race.label : "Race"} · best ${formatTime(best)}` : "First finish on this Chromebook.",
      };
    }
    const nxt = JOBS[i + 1];
    const said = {
      roll: "The orange wheel pushes. The loose one doesn't.",
      curb: "Orange wheel. The blue one was rolling the wrong way.",
      pit: "The bar crossed the hole. The wheel alone falls in.",
      wall: "Blue wheel. The wall stops the orange one.",
      shelf: "The loose wheel was sitting on the step.",
      pair: "The bar made the two crates one load.",
    };
    return {
      k: `Job ${n} clear`,
      t: label,
      b: said[courseId] || (nxt ? `${nxt.label} is open.` : "That was the last build job."),
    };
  }

  function paintClear() {
    const c = clearCopy();
    const k = document.getElementById("win-kicker");
    const t = document.getElementById("win-title");
    const b = document.getElementById("win-body");
    const next = document.getElementById("win-next");
    const skip = document.getElementById("win-skip");
    if (k) k.textContent = c.k;
    if (t) t.textContent = c.t;
    if (b) b.textContent = c.b;
    if (next) next.textContent = isRace() ? "Run again" : "Next job";
    if (skip) skip.hidden = true;
    if (winEl) winEl.classList.add("show");
  }

  function presentClear() {
    let seen = false;
    try { seen = !!localStorage.getItem("bb-parts-v1"); } catch (e) { seen = true; }
    clearTour = courseId === "open" && !seen;
    clearBeat = 0;
    paintClear();
  }

  async function goNextJob() {
    try { localStorage.setItem("bb-parts-v1", "1"); } catch (e) { /* private */ }
    clearTour = false;
    if (winEl) winEl.classList.remove("show");
    const i = JOBS.findIndex((job) => job.id === courseId);
    const nxt = JOBS[i + 1];
    if (nxt) await loadBuiltin(nxt.id);
  }

  function refreshPath() {
    const list = document.getElementById("path-done");
    const nextBtn = document.getElementById("path-next");
    const strip = document.getElementById("job-strip");
    const pick = document.getElementById("level-pick");
    const exportBtn = document.getElementById("btn-export");
    const done = JOBS.filter((level) => levelDone(level.id));
    if (list && nextBtn) {
      list.replaceChildren();
      if (!done.length) {
        const li = document.createElement("li");
        li.className = "path-empty";
        li.textContent = "None yet.";
        list.append(li);
      } else {
        for (const level of done) {
          const li = document.createElement("li");
          const btn = document.createElement("button");
          btn.type = "button";
          btn.className = "path-link";
          btn.dataset.course = level.id;
          const n = JOBS.findIndex((job) => job.id === level.id) + 1;
          btn.textContent = `Job ${n} · ${level.label}`;
          li.append(btn);
          list.append(li);
        }
      }
      const upcoming = JOBS.find((level) => !levelDone(level.id));
      if (upcoming) {
        const n = JOBS.findIndex((job) => job.id === upcoming.id) + 1;
        nextBtn.textContent = `Job ${n} · ${upcoming.label}`;
        nextBtn.dataset.course = upcoming.id;
      } else {
        nextBtn.textContent = "Design a level";
        nextBtn.dataset.course = "editor";
      }
    }
    if (strip) {
      strip.replaceChildren();
      JOBS.forEach((job, i) => {
        const btn = document.createElement("button");
        const state = plateState(job.id);
        btn.type = "button";
        btn.className = `job-plate ${state}${job.id === courseId ? " here" : ""}`;
        btn.dataset.course = job.id;
        btn.disabled = state === "lock";
        btn.title = `${i + 1}. ${job.label}`;
        btn.setAttribute("aria-label", `Job ${i + 1}, ${job.label}`);
        const num = document.createElement("b");
        num.textContent = String(i + 1);
        const mark = document.createElement("span");
        mark.textContent = state === "clear" ? "CLEAR" : state === "test" ? "TEST PASS" : state === "lock" ? "LOCKED" : "NEXT";
        btn.append(num, mark);
        strip.append(btn);
      });
      const name = document.createElement("span");
      name.className = "job-name";
      const curJob = JOBS.find((job) => job.id === courseId) || RACES.find((job) => job.id === courseId);
      name.textContent = curJob ? curJob.label : (courseId === "editor" ? "Design" : "");
      strip.append(name);
      if (allClear()) {
        const design = document.createElement("button");
        design.type = "button";
        design.className = "job-plate now";
        design.dataset.course = "editor";
        design.title = "Design a level";
        design.innerHTML = "<b>D</b><span>DESIGN</span>";
        strip.append(design);
      }
      for (const job of classJobs()) {
        const btn = document.createElement("button");
        const state = !allClear() ? "lock" : (levelDone(job.id) ? "clear" : "now");
        btn.type = "button";
        btn.className = `job-plate ${state}`;
        btn.dataset.course = job.id;
        btn.disabled = !allClear();
        btn.title = job.alias;
        const num = document.createElement("b");
        num.textContent = "C";
        const mark = document.createElement("span");
        mark.textContent = state === "clear" ? "CLEAR" : "CLASS";
        btn.append(num, mark);
        strip.append(btn);
      }
      const raceTag = document.createElement("span");
      raceTag.className = "race-k";
      raceTag.textContent = "Race";
      strip.append(raceTag);
      RACES.forEach((race) => {
        const btn = document.createElement("button");
        const best = progress.bests && progress.bests[race.id];
        btn.type = "button";
        btn.className = `job-plate race${race.id === courseId ? " here" : ""}`;
        btn.dataset.course = race.id;
        btn.title = best != null ? `${race.label} · ${formatTime(best)}` : `${race.label}. Clock starts on Play.`;
        btn.setAttribute("aria-label", best != null ? `${race.label}, best ${formatTime(best)}` : race.label);
        const num = document.createElement("b");
        num.textContent = race.mark;
        const mark = document.createElement("span");
        mark.textContent = best != null ? formatTime(best) : "RACE";
        btn.append(num, mark);
        strip.append(btn);
      });
      if (allClear() && courseId === "editor") {
        const ex = document.createElement("button");
        ex.type = "button";
        ex.className = "job-plate now";
        ex.id = "btn-export-live";
        ex.title = "Export .botzlevel.json";
        const num = document.createElement("b");
        num.textContent = "↓";
        const mark = document.createElement("span");
        mark.textContent = "EXPORT";
        ex.append(num, mark);
        strip.append(ex);
      }
    }
    if (pick) {
      const cur = courseId;
      pick.replaceChildren();
      JOBS.forEach((job, i) => {
        const opt = document.createElement("option");
        opt.value = job.id;
        opt.textContent = `Job ${i + 1} · ${job.label}`;
        opt.disabled = !jobUnlocked(job.id);
        pick.append(opt);
      });
      if (allClear()) {
        const opt = document.createElement("option");
        opt.value = "editor";
        opt.textContent = "Design a level";
        pick.append(opt);
      }
      RACES.forEach((race) => {
        const opt = document.createElement("option");
        opt.value = race.id;
        const best = progress.bests && progress.bests[race.id];
        opt.textContent = best != null ? `Race · ${race.label} · ${formatTime(best)}` : `Race · ${race.label}`;
        pick.append(opt);
      });
      for (const job of classJobs()) {
        const opt = document.createElement("option");
        opt.value = job.id;
        opt.textContent = `Class · ${job.alias}`;
        opt.disabled = !allClear();
        pick.append(opt);
      }
      if ([...pick.options].some((opt) => opt.value === cur)) pick.value = cur;
    }
    if (exportBtn) exportBtn.hidden = !(allClear() && courseId === "editor");
    const designBlock = document.getElementById("designer-block");
    if (designBlock) designBlock.hidden = !allClear();
  }

  function isMeasure() { return courseId === "measure"; }
  function isForces() { return courseId === "forces"; }
  function isRace() { return RACES.some((race) => race.id === courseId); }
  function raceGates() { return (doc.level && doc.level.gates) || []; }
  function formatTime(sec) {
    const s = Math.max(0, Number(sec) || 0);
    const m = Math.floor(s / 60);
    const rem = s - m * 60;
    const whole = Math.floor(rem);
    const tenth = Math.floor((rem - whole) * 10);
    return `${m}:${String(whole).padStart(2, "0")}.${tenth}`;
  }

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
    progress.xp += gain;
    progress.wins[courseId] = {
      bestParts: Math.min(parts, rec ? rec.bestParts : parts),
      n: (rec && rec.n ? rec.n : 0) + 1,
    };
    if (isRace()) {
      progress.bests = progress.bests || {};
      const prev = progress.bests[courseId];
      if (prev == null || playAge < prev) progress.bests[courseId] = Math.round(playAge * 10) / 10;
    }
    saveProgress();
    refreshRank();
    parkHeat();
    presentClear();
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
  }

  function clearWalls() {
    hideHowto();
    showSystems(false);
    showCrew(false);
  }

  function setPacket(on) {
    const d = document.getElementById("guide-drawer");
    const b = document.getElementById("btn-packet");
    if (!d) return;
    d.hidden = !on;
    if (b) b.setAttribute("aria-expanded", on ? "true" : "false");
  }

  function lockLandscape() {
    try {
      if (screen.orientation && typeof screen.orientation.lock === "function") {
        const pending = screen.orientation.lock("landscape");
        if (pending && typeof pending.catch === "function") pending.catch(() => {});
      }
    } catch (e) {}
  }

  function tryWide() {
    const root = document.documentElement;
    try {
      if (!document.fullscreenElement && root.requestFullscreen) {
        const pending = root.requestFullscreen();
        if (pending && typeof pending.then === "function") {
          pending.then(lockLandscape).catch(lockLandscape);
          return;
        }
      } else if (!document.fullscreenElement && root.webkitRequestFullscreen) {
        root.webkitRequestFullscreen();
      }
    } catch (e) {}
    lockLandscape();
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
    applyCoach();
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
    const wheel = wheelSnap(pt, skipPart);
    if (wheel) return wheel;
    let best = null, bd = max;
    for (const n of allNodes()) {
      if (skipPart && n.part === skipPart) continue;
      if (isWheelPart(n.part)) continue;
      const d = dist(pt, n);
      if (d < bd) { bd = d; best = n; }
    }
    return best;
  }

  function wheelSnap(pt, skipPart) {
    let hub = null, hubD = WHEEL_R + 0.2;
    for (const n of allNodes()) {
      if (skipPart && n.part === skipPart) continue;
      if (n.kind !== "hub" || !isWheelPart(n.part)) continue;
      const d = dist(pt, n);
      if (d < hubD) { hubD = d; hub = n; }
    }
    if (!hub) return null;
    const dx = pt.x - hub.x, dy = pt.y - hub.y;
    const d = Math.hypot(dx, dy);
    if (d > WHEEL_R * 0.96) {
      const a = Math.round(Math.atan2(dy, dx) / (Math.PI / 2)) * (Math.PI / 2);
      const rim = {
        x: hub.x + Math.cos(a) * WHEEL_R,
        y: hub.y + Math.sin(a) * WHEEL_R,
        kind: "rim",
        part: hub.part,
      };
      if (dist(pt, rim) <= 0.24) return rim;
    }
    return d <= WHEEL_R + 0.2 ? hub : null;
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
    const hubs = nodes.filter((n) => n.kind === "hub");
    const rest = nodes.filter((n) => n.kind !== "hub");
    let best = null, bd = Infinity;
    const consider = (n, limit) => {
      const hit = nearestNode(n, limit, p);
      if (!hit) return;
      const d = dist(n, hit);
      if (d < bd) { bd = d; best = { from: n, to: hit }; }
    };
    for (const n of hubs) consider(n, WHEEL_R + 0.2);
    if (!best) {
      for (const n of rest) consider(n, n.kind === "rim" ? 0.24 : SNAP * 1.55);
    }
    if (!best) return null;
    translatePart(p, best.to.x - best.from.x, best.to.y - best.from.y);
    return best.to;
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
    if (!doc.machine.parts.length) {
      const line = "Add a part first.";
      lastReadout = line;
      const hint = document.getElementById("status-hint");
      if (hint) hint.textContent = line;
      toast(line);
      return;
    }
    try {
      sim = buildSim(doc);
    } catch (err) {
      toast(String(err.message || err));
      return;
    }
    playing = true;
    won = false;
    winT = 0;
    view.panx = 0;
    view.pany = 0;
    trail = [];
    lastTrail = [];
    lastMiss = null;
    lastReadout = "";
    playAge = 0;
    gateN = 0;
    everTested = true;
    pinnedStep = null;
    winEl.classList.remove("show");
    showCalmFail("");
    if (coarsePointer()) collapseRail();
    refreshMeta();
  }

  function crateReadout() {
    if (won) return "Parked.";
    if (courseId === "open" && wheelPose() !== "ready") {
      return "Drag the wheel behind the crate.";
    }
    if (!trail.length) return "No trail. Test needs a crate in motion.";
    const last = trail[trail.length - 1];
    const drop = doc.level.drop;
    const shop = doc.level.shop;
    if (last.y < -0.2) return "It fell in. Bridge the hole with a silver bar.";
    if (drop && coreInDropAt(last.x, last.y, drop)) return "Almost. It has to sit in the stripes for a second.";
    const xs = trail.slice(-24).map((p) => p.x);
    const span = xs.length ? Math.max(...xs) - Math.min(...xs) : 0;
    if (shop && last.x >= shop.x - 0.2 && last.x <= shop.x + shop.w + 0.2 && span < 0.55) {
      return "It didn't move. The orange wheel has to be behind the crate.";
    }
    if (trail.length < 18 && span < 0.45) return "It barely moved.";
    if (span < 0.4 && last.x < (drop ? drop.x : 20)) return "It stopped. Something is in the way.";
    if (drop && last.x > drop.x + drop.w + 0.4) return "Too fast. It rolled past the stripes.";
    return "It missed the stripes. Look at where it stopped.";
  }

  function stopPlay() {
    if (playing && won) {
      playing = false;
      sim = null;
      refreshMeta();
      return;
    }
    if (playing && !won && JOBS.some((job) => job.id === courseId) && !levelDone(courseId)) {
      progress.tried = progress.tried || {};
      progress.tried[courseId] = true;
      saveProgress();
    }
    if (playing && !won) lastReadout = crateReadout();
    else if (won) lastReadout = "Parked.";
    const missed = playing && !won;
    lastTrail = trail.slice();
    if (missed && trail.length) {
      let end = trail[trail.length - 1];
      if (end.y < 0.4) {
        for (let i = trail.length - 1; i >= 0; i--) {
          if (trail[i].y > 0.7) { end = trail[i]; break; }
        }
      }
      lastMiss = { x: end.x, y: Math.max(1.05, end.y) };
    }
    playing = false;
    sim = null;
    won = false;
    winT = 0;
    winEl.classList.remove("show");
    const hint = document.getElementById("status-hint");
    if (hint && lastReadout) hint.textContent = lastReadout;
    showCalmFail(missed ? lastReadout : "");
    refreshMeta();
  }

  function showCalmFail(line) {
    const box = document.getElementById("calm-fail");
    const text = document.getElementById("calm-fail-line");
    if (!box) return;
    if (!line) { box.hidden = true; return; }
    if (text) text.textContent = line;
    box.hidden = false;
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
    tickGates();
    sampleForces();
    checkWin(DT * n);
  }

  function tickGates() {
    const gates = raceGates();
    if (!sim || !sim.cores[0] || gateN >= gates.length) return;
    const p = sim.cores[0].getPosition();
    if (inRect(p.x, p.y, gates[gateN])) gateN += 1;
  }

  function checkWin(dtAcc) {
    if (!sim || won || isMeasure() || isForces()) return;
    if (isRace() && gateN < raceGates().length) {
      winT = 0;
      return;
    }
    const drop = doc.level.drop;
    let inside = 0;
    for (const b of sim.cores) {
      const p = b.getPosition();
      if (coreInDropAt(p.x, p.y, drop)) inside++;
    }
    if (sim.cores.length && inside === sim.cores.length) {
      winT += dtAcc;
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
    ctx.fillStyle = won ? "#1f6b45" : "#c2410c";
    ctx.font = `800 ${Math.max(22, wr(0.72))}px ${getComputedStyle(document.body).fontFamily}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("PARK", x + w / 2, y + h / 2);
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

    const floors = (doc.level.world || []).filter((s) => s.h <= 2.6 && s.y <= 0.05).sort((a, b) => a.x - b.x);
    for (let i = 0; i < floors.length - 1; i++) {
      const gap = floors[i + 1].x - (floors[i].x + floors[i].w);
      if (gap < 0.45) continue;
      const x0 = floors[i].x + floors[i].w;
      ctx.fillStyle = "#2a2118";
      ctx.fillRect(wx(x0), wy(1.15), wr(gap), wr(2.4));
      ctx.fillStyle = "rgba(0,0,0,0.28)";
      ctx.fillRect(wx(x0), wy(0.35), wr(gap), wr(0.7));
    }

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
    drawGates();

    stencil("Shop Floor", wx(doc.level.shop.x) + 6, wy(doc.level.shop.y + doc.level.shop.h) + 8, NAVY);
    if (canEditSite() && doc.level.drop) {
      const d = doc.level.drop;
      const cx = wx(d.x + d.w / 2);
      const cy = wy(d.y + d.h / 2);
      ctx.fillStyle = "rgba(243,238,228,0.94)";
      ctx.fillRect(cx - 40, cy - 11, 80, 22);
      ctx.fillStyle = "#1e2226";
      ctx.font = `700 ${Math.max(12, Math.round(12 * view.dpr))}px ${getComputedStyle(document.body).fontFamily}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("drag goal", cx, cy);
    }
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
    if (!playing && lastMiss && !(winEl && winEl.classList.contains("show"))) {
      ctx.save();
      ctx.strokeStyle = "#c2410c";
      ctx.lineWidth = 3;
      ctx.setLineDash([6, 5]);
      const s = Math.max(16, wr(CORE_S));
      ctx.strokeRect(wx(lastMiss.x) - s / 2, wy(lastMiss.y) - s / 2, s, s);
      ctx.setLineDash([]);
      ctx.font = `800 ${Math.max(14, Math.round(14 * view.dpr))}px ${getComputedStyle(document.body).fontFamily}`;
      ctx.fillStyle = "#c2410c";
      ctx.textAlign = "center";
      ctx.fillText("Stopped", wx(lastMiss.x), wy(lastMiss.y) - s / 2 - 8);
      ctx.restore();
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
        if (drag.snap) drawSnapCoach(drag.x2, drag.y2, drag.snapKind);
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
        if (drag.snap) drawSnapCoach(drag.x, drag.y, drag.snapKind);
        else {
          ctx.beginPath();
          ctx.strokeStyle = ok ? "#9db0c4" : "#b91c1c";
          ctx.lineWidth = 2;
          ctx.arc(wx(drag.x), wy(drag.y), Math.max(8, wr(WHEEL_R + 0.08)), 0, Math.PI * 2);
          ctx.stroke();
        }
      }
      if (drag && drag.kind === "move" && drag.snapTo) {
        drawSnapCoach(drag.snapTo.x, drag.snapTo.y, drag.snapKind);
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
    drawGoalCue();
    drawRaceBoard();
    drawCoach();
    drawBerty(now);
  }

  function raceAim() {
    const gates = raceGates();
    if (isRace() && gateN < gates.length) {
      const g = gates[gateN];
      return { x: g.x + g.w / 2, y: g.y + g.h * 0.45, label: "GATE" };
    }
    const drop = doc.level && doc.level.drop;
    if (!drop) return null;
    return { x: drop.x + drop.w / 2, y: drop.y + Math.min(drop.h, 1.4) * 0.45, label: "GOAL" };
  }

  function drawGoalCue() {
    goalCue = null;
    const aim = raceAim();
    if (!aim || (winEl && winEl.classList.contains("show"))) return;
    const sx = wx(aim.x);
    const sy = wy(aim.y);
    const dpr = view.dpr || 1;
    const pad = 28 * dpr;
    if (sx >= pad && sx <= canvas.width - pad && sy >= pad && sy <= canvas.height - pad) return;
    const w = 104 * dpr;
    const h = 40 * dpr;
    const edge = 12 * dpr;
    const ax = Math.max(edge, Math.min(canvas.width - w - edge, sx > canvas.width * 0.5 ? canvas.width - w - edge : edge));
    const ay = Math.max(edge, Math.min(canvas.height - h - edge, sy - h / 2));
    goalCue = { x: ax, y: ay, w, h };
    ctx.save();
    roundBubble(ax, ay, w, h, 12 * dpr);
    ctx.fillStyle = "#f0c000";
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#1a1400";
    ctx.stroke();
    const pointingRight = sx > canvas.width * 0.5;
    ctx.fillStyle = "#1a1400";
    ctx.beginPath();
    if (pointingRight) {
      ctx.moveTo(ax + w - 16 * dpr, ay + h / 2);
      ctx.lineTo(ax + w - 28 * dpr, ay + 12 * dpr);
      ctx.lineTo(ax + w - 28 * dpr, ay + h - 12 * dpr);
    } else {
      ctx.moveTo(ax + 16 * dpr, ay + h / 2);
      ctx.lineTo(ax + 28 * dpr, ay + 12 * dpr);
      ctx.lineTo(ax + 28 * dpr, ay + h - 12 * dpr);
    }
    ctx.closePath();
    ctx.fill();
    ctx.font = `800 ${Math.round(15 * dpr)}px ${getComputedStyle(document.body).fontFamily}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(aim.label, ax + w / 2 + (pointingRight ? -8 : 8) * dpr, ay + h / 2 + 1);
    ctx.restore();
  }

  function hitGoalCue(ev) {
    if (!goalCue) return false;
    const r = canvas.getBoundingClientRect();
    const x = (ev.clientX - r.left) * (canvas.width / Math.max(1, r.width));
    const y = (ev.clientY - r.top) * (canvas.height / Math.max(1, r.height));
    return x >= goalCue.x && x <= goalCue.x + goalCue.w && y >= goalCue.y && y <= goalCue.y + goalCue.h;
  }

  function lookAtDrop() {
    const aim = raceAim();
    if (!aim || !view.scale) return;
    view.panx = canvas.width * 0.08 + (view.fx - aim.x) * view.scale;
    view.pany = (view.fy - aim.y) * view.scale;
    applyCam(false);
  }

  function drawGates() {
    const gates = raceGates();
    if (!gates.length) return;
    const dpr = view.dpr || 1;
    gates.forEach((g, i) => {
      const done = i < gateN;
      const x = wx(g.x);
      const y = wy(g.y + g.h);
      const w = wr(g.w);
      const h = wr(g.h);
      ctx.save();
      ctx.fillStyle = done ? "#2f6f4e" : "#1a1400";
      const post = Math.max(5, 6 * dpr);
      ctx.fillRect(x, y, post, h);
      ctx.fillRect(x + w - post, y, post, h);
      const banner = Math.max(16, 22 * dpr);
      ctx.fillStyle = done ? "#3a7d54" : "#f0c000";
      ctx.fillRect(x, y, w, banner);
      ctx.fillStyle = "#f7f4ee";
      ctx.beginPath();
      ctx.arc(x + w / 2, y + banner / 2, banner * 0.38, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#1a1400";
      ctx.font = `800 ${Math.round(13 * dpr)}px ${getComputedStyle(document.body).fontFamily}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(String(i + 1), x + w / 2, y + banner / 2 + 1);
      ctx.restore();
    });
  }

  function drawRaceBoard() {
    if (!isRace()) return;
    const dpr = view.dpr || 1;
    const time = formatTime(playing || won ? playAge : (playAge || 0));
    const best = progress.bests && progress.bests[courseId];
    const sub = best != null ? `BEST ${formatTime(best)}` : "BEST —";
    const w = 132 * dpr;
    const h = 52 * dpr;
    const x = (canvas.width - w) / 2;
    const y = 10 * dpr;
    ctx.save();
    roundBubble(x, y, w, h, 12 * dpr);
    ctx.fillStyle = "#1a1400";
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#f0c000";
    ctx.stroke();
    ctx.fillStyle = "#f0c000";
    ctx.font = `800 ${Math.round(26 * dpr)}px ${getComputedStyle(document.body).fontFamily}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(time, x + w / 2, y + 22 * dpr);
    ctx.font = `700 ${Math.round(12 * dpr)}px ${getComputedStyle(document.body).fontFamily}`;
    ctx.fillStyle = "#f4efe6";
    ctx.fillText(sub, x + w / 2, y + 44 * dpr);
    ctx.restore();
  }

  function normRect(x1, y1, x2, y2) {
    const x = Math.min(x1, x2), y = Math.min(y1, y2);
    return { x, y, w: Math.abs(x2 - x1), h: Math.abs(y2 - y1) };
  }

  function endPan() { panning = null; }

  function drawSnapCoach(x, y, kind) {
    ctx.save();
    ctx.lineWidth = 3;
    ctx.strokeStyle = ORANGE;
    ctx.beginPath();
    ctx.arc(wx(x), wy(y), Math.max(9, wr(kind === "hub" ? 0.13 : 0.09)), 0, Math.PI * 2);
    ctx.stroke();
    if (kind === "hub") {
      ctx.fillStyle = "#f0c000";
      for (let i = 0; i < 4; i++) {
        const a = i * Math.PI / 2;
        ctx.beginPath();
        ctx.arc(wx(x + Math.cos(a) * WHEEL_R), wy(y + Math.sin(a) * WHEEL_R), Math.max(5, wr(0.075)), 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  function finishDrag() {
    if (!drag) { activePtr = null; return; }
    const d = drag;
    drag = null;
    activePtr = null;
    if (d.kind === "bar") {
      const len = Math.hypot(d.x2 - d.x1, d.y2 - d.y1);
      if (len >= MIN_BAR && inRect(d.x1, d.y1, doc.level.shop)) {
        const part = { type: d.type, x1: d.x1, y1: d.y1, x2: d.x2, y2: d.y2 };
        stickPairBar(part);
        stickPitBar(part);
        addPart(part);
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
      const hit = snapPartToHub(d.part);
      if (!hit) {
        stickBehind(d.part);
        stickOther(d.part);
      }
      if (d.part.x != null && !inRect(d.part.x, d.part.y, doc.level.shop) && d.part.type !== "core") {
        Object.assign(d.part, d.orig);
        toast("Stay on the Shop Floor.");
      }
      dirty = true;
    } else if (d.kind === "goal") {
      dirty = true;
    } else if (d.kind === "place" && d.x != null) {
      const pt = { x: d.x, y: d.y };
      if (!canPlaceWheel(pt)) toast("Build on the Shop Floor.");
      else {
        const part = { type: d.type, x: pt.x, y: pt.y, a: 0 };
        if (!d.snap) {
          stickBehind(part);
          stickOther(part);
        }
        addPart(part);
      }
    }
    lastReadout = "";
    showCalmFail("");
    refreshMeta();
  }

  function drawPointer(x, y, tx, ty, label) {
    const x0 = wx(x), y0 = wy(y), x1 = wx(tx), y1 = wy(ty);
    const ang = Math.atan2(y1 - y0, x1 - x0);
    const pulse = 0.72 + 0.28 * Math.sin(performance.now() / 160);
    ctx.save();
    ctx.globalAlpha = pulse;
    ctx.strokeStyle = "#f0c000";
    ctx.fillStyle = "#f0c000";
    ctx.lineWidth = Math.max(5, wr(0.09));
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();
    const ah = Math.max(16, wr(0.32));
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x1 - ah * Math.cos(ang - 0.42), y1 - ah * Math.sin(ang - 0.42));
    ctx.lineTo(x1 - ah * Math.cos(ang + 0.42), y1 - ah * Math.sin(ang + 0.42));
    ctx.closePath();
    ctx.fill();
    ctx.font = `800 ${Math.max(16, Math.round(16 * view.dpr))}px ${getComputedStyle(document.body).fontFamily}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    ctx.lineWidth = 5;
    ctx.strokeStyle = "#1a1400";
    ctx.strokeText(label, x0, y0 - 8);
    ctx.fillStyle = "#f0c000";
    ctx.fillText(label, x0, y0 - 8);
    ctx.restore();
  }

  const bertyFly = { x: 0, y: 0, ready: false };

  function wrapLines(text, maxW) {
    const words = String(text || "").split(/\s+/);
    const lines = [];
    let cur = "";
    for (const w of words) {
      const next = cur ? `${cur} ${w}` : w;
      if (cur && ctx.measureText(next).width > maxW) {
        lines.push(cur);
        cur = w;
      } else cur = next;
    }
    if (cur) lines.push(cur);
    return lines.slice(0, 3);
  }

  function roundBubble(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function bertyTarget() {
    if (courseId === "wall" && !wallReady()) {
      const right = otherSpot();
      if (right) return right;
    }
    if (courseId === "pit" && !pitBridged()) return { x: 7.4, y: 1.7 };
    if (courseId === "pair" && !pairLinked()) {
      const cores = doc.level.cores || [];
      if (cores.length > 1) return { x: (cores[0].x + cores[1].x) / 2, y: cores[0].y + 0.5 };
    }
    if (courseId === "shelf" && laneBlocked()) {
      const roller = (doc.machine.parts || []).find((p) => p.type === "roller" && p.x > 5.7);
      if (roller) return { x: roller.x, y: roller.y };
    }
    const spot = behindSpot();
    return spot || (doc.level.cores || [])[0] || { x: 4, y: 2 };
  }

  function drawCrew(x, y, u) {
    ctx.fillStyle = "rgba(26,20,0,0.16)";
    ctx.beginPath();
    ctx.ellipse(x + 28 * u, y + 92 * u, 20 * u, 5 * u, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#123049";
    ctx.fillRect(x + 16 * u, y + 64 * u, 10 * u, 20 * u);
    ctx.fillRect(x + 30 * u, y + 64 * u, 10 * u, 20 * u);
    ctx.fillStyle = "#2a2e33";
    ctx.fillRect(x + 13 * u, y + 82 * u, 15 * u, 7 * u);
    ctx.fillRect(x + 28 * u, y + 82 * u, 15 * u, 7 * u);
    ctx.fillStyle = "#e87722";
    ctx.fillRect(x + 12 * u, y + 38 * u, 32 * u, 28 * u);
    ctx.fillStyle = "#f0c000";
    ctx.fillRect(x + 12 * u, y + 48 * u, 32 * u, 5 * u);
    ctx.strokeStyle = "#f3d2b0";
    ctx.lineWidth = 6 * u;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(x + 42 * u, y + 48 * u);
    ctx.lineTo(x + 56 * u, y + 62 * u);
    ctx.stroke();
    ctx.fillStyle = "#f3d2b0";
    ctx.beginPath();
    ctx.arc(x + 28 * u, y + 30 * u, 14 * u, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#f0c000";
    ctx.fillRect(x + 14 * u, y + 10 * u, 28 * u, 12 * u);
    ctx.beginPath();
    ctx.ellipse(x + 28 * u, y + 20 * u, 18 * u, 6 * u, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#1a1400";
    ctx.beginPath();
    ctx.arc(x + 23 * u, y + 30 * u, 1.8 * u, 0, Math.PI * 2);
    ctx.arc(x + 33 * u, y + 30 * u, 1.8 * u, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#1a1400";
    ctx.lineWidth = 1.6 * u;
    ctx.beginPath();
    ctx.arc(x + 28 * u, y + 33 * u, 4.2 * u, 0.2, Math.PI - 0.2);
    ctx.stroke();
  }

  function drawBerty(now) {
    const line = coachLine();
    if (!line) return;
    if (winEl && winEl.classList.contains("show")) return;
    const dpr = view.dpr || 1;
    const cssW = canvas.width / dpr;
    const cssH = canvas.height / dpr;
    const phone = cssW < 860 || cssH < 480;
    const short = cssH < 360;
    const u = (short ? 0.52 : phone ? 0.72 : 1.05) * dpr;
    const aim = bertyTarget();
    const ax = wx(aim.x);
    const ay = wy(aim.y);
    ctx.save();
    const fontPx = Math.round((short ? 18 : phone ? 20 : 28) * dpr);
    ctx.font = `800 ${fontPx}px ${getComputedStyle(document.body).fontFamily}`;
    const bubbleMax = Math.min(canvas.width - (short ? 78 : 96) * u, (short ? 520 : phone ? 250 : 420) * dpr);
    const lines = wrapLines(line, Math.max(80 * dpr, bubbleMax - 28 * dpr));
    const lineH = Math.round(fontPx * 1.15);
    const bubbleW = Math.min(canvas.width - 24 * dpr, Math.max(80 * dpr, ...lines.map((t) => ctx.measureText(t).width)) + 28 * dpr);
    const bubbleH = lines.length * lineH + 16 * dpr;
    if (short) {
      const x = 8 * dpr;
      const y = 6 * dpr;
      drawCrew(x, y, u);
      const bx = x + 58 * u;
      const by = y;
      roundBubble(bx, by, bubbleW, bubbleH, 12 * dpr);
      ctx.fillStyle = "#f7f1e6";
      ctx.fill();
      ctx.lineWidth = Math.max(2, 2 * dpr);
      ctx.strokeStyle = "#1a1400";
      ctx.stroke();
      ctx.fillStyle = "#1a1400";
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.font = `800 ${fontPx}px ${getComputedStyle(document.body).fontFamily}`;
      lines.forEach((t, i) => ctx.fillText(t, bx + 12 * dpr, by + 8 * dpr + i * lineH));
      ctx.restore();
      return;
    }
    const figW = 70 * u;
    let tx = ax - figW * 0.35;
    const block = figW + 10 * dpr + bubbleW;
    tx = Math.max(12 * dpr, Math.min(canvas.width - block - 12 * dpr, tx));
    let ty = 14 * dpr;
    if (!bertyFly.ready) {
      bertyFly.x = tx;
      bertyFly.y = ty;
      bertyFly.ready = true;
    }
    bertyFly.x += (tx - bertyFly.x) * 0.14;
    bertyFly.y += (ty - bertyFly.y) * 0.14;
    const x = bertyFly.x;
    const y = bertyFly.y + Math.sin(now / 260) * 6 * u;
    const handX = x + 54 * u;
    const handY = y + 62 * u;
    if (Math.hypot(ax - handX, ay - handY) > 70 * u) {
      ctx.strokeStyle = "#f0c000";
      ctx.fillStyle = "#f0c000";
      ctx.lineWidth = Math.max(4 * dpr, 5 * u);
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(handX, handY);
      ctx.lineTo(ax, ay);
      ctx.stroke();
      const ang = Math.atan2(ay - handY, ax - handX);
      const ah = 16 * u;
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(ax - ah * Math.cos(ang - 0.42), ay - ah * Math.sin(ang - 0.42));
      ctx.lineTo(ax - ah * Math.cos(ang + 0.42), ay - ah * Math.sin(ang + 0.42));
      ctx.closePath();
      ctx.fill();
    }
    drawCrew(x, y, u);
    const bx = Math.min(x + 64 * u, canvas.width - bubbleW - 8 * dpr);
    const by = Math.max(8 * dpr, y - 6 * u);
    roundBubble(bx, by, bubbleW, bubbleH, 14 * dpr);
    ctx.fillStyle = "#f7f1e6";
    ctx.fill();
    ctx.lineWidth = Math.max(2, 2.5 * dpr);
    ctx.strokeStyle = "#1a1400";
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(bx + 16 * dpr, by + bubbleH);
    ctx.lineTo(x + 34 * u, y + 22 * u);
    ctx.lineTo(bx + 40 * dpr, by + bubbleH);
    ctx.closePath();
    ctx.fillStyle = "#f7f1e6";
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#1a1400";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.font = `800 ${fontPx}px ${getComputedStyle(document.body).fontFamily}`;
    lines.forEach((t, i) => ctx.fillText(t, bx + 14 * dpr, by + 8 * dpr + i * lineH));
    ctx.restore();
  }

  function drawCoach() {
    const spot = behindSpot();
    if (!spot || playing || levelDone(courseId)) return;
    if (!JOBS.some((job) => job.id === courseId)) return;
    if (winEl && winEl.classList.contains("show")) return;
    const pose = wheelPose();
    const needWheel = courseId !== "wall" && pose !== "ready" && !(courseId === "pair" && !pairLinked());
    if (courseId !== "wall" && (pose !== "ready" || courseId === "pair")) {
      ctx.save();
      ctx.setLineDash([7, 6]);
      ctx.strokeStyle = "#f0c000";
      ctx.lineWidth = 3;
      if (needWheel || courseId !== "pair") {
        ctx.beginPath();
        ctx.arc(wx(spot.x), wy(spot.y), Math.max(18, wr(WHEEL_R + 0.12)), 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.setLineDash([]);
      ctx.restore();
    }
    if (courseId === "pair" && !pairLinked()) {
      const cores = doc.level.cores || [];
      if (cores.length > 1) drawPointer(cores[0].x, cores[0].y + 1.5, (cores[0].x + cores[1].x) / 2, cores[0].y + 0.35, "Bar");
    }
    if (courseId === "pit" && !pitBridged()) {
      drawPointer(4.4, 2.7, 7.4, 1.55, "Bar");
    }
    if (courseId === "curb" && pose === "left") {
      const blue = (doc.machine.parts || []).find((p) => p.type === "driveL");
      if (blue) drawPointer(blue.x, blue.y + 1.15, spot.x, spot.y + 0.5, "Orange");
      return;
    }
    if (courseId === "wall" && !wallReady()) {
      const right = otherSpot();
      if (right) {
        ctx.save();
        ctx.setLineDash([7, 6]);
        ctx.strokeStyle = "#f0c000";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(wx(right.x), wy(right.y), Math.max(18, wr(WHEEL_R + 0.12)), 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
        drawPointer(right.x, right.y + 1.6, right.x, right.y + 0.5, "Blue");
      }
      return;
    }
    if (courseId === "shelf" && laneBlocked()) {
      const roller = (doc.machine.parts || []).find((p) => p.type === "roller" && p.x > 5.7);
      if (roller) drawPointer(roller.x, roller.y + 1.25, roller.x - 1.5, roller.y, "Off");
      return;
    }
    const wheel = (doc.machine.parts || []).find((p) => (p.type === "driveR" || p.type === "roller") && p.x != null);
    if (wheel && pose !== "ready" && courseId !== "wall") {
      drawPointer(wheel.x, wheel.y + 1.15, spot.x, spot.y + 0.55, courseId === "roll" && wheel.type === "roller" ? "Not this" : "Behind");
    } else if (pose !== "ready" && courseId !== "wall" && courseId !== "pair") {
      drawPointer(spot.x - 0.1, spot.y + 1.7, spot.x, spot.y + 0.55, "Wheel");
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
      snapKind: snapped.node ? snapped.node.kind : "",
      sx: ev.clientX,
      sy: ev.clientY,
    };
    activePtr = ev.pointerId;
    try { (onCanvas ? canvas : ev.currentTarget).setPointerCapture(ev.pointerId); } catch (e) {}
  }

  canvas.addEventListener("wheel", (ev) => {
    ev.preventDefault();
    if (ev.ctrlKey || ev.metaKey) {
      const before = worldFromEvent(ev);
      view.zoom = Math.max(0.55, Math.min(2.4, view.zoom * (ev.deltaY > 0 ? 0.9 : 1.1)));
      fit();
      const after = worldFromEvent(ev);
      view.panx += (after.x - before.x) * view.scale;
      view.pany -= (after.y - before.y) * view.scale;
      fit();
      return;
    }
    const unit = (ev.deltaMode === 1 ? 16 : ev.deltaMode === 2 ? 400 : 1) * (view.dpr || 1);
    const dx = ev.deltaX * unit;
    const dy = ev.deltaY * unit;
    if (ev.shiftKey) view.pany -= dy;
    else if (Math.abs(dx) > Math.abs(dy)) view.panx -= dx;
    else view.panx -= dy;
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

    if (hitGoalCue(ev)) {
      lookAtDrop();
      return;
    }

    if (tool === "tape") {
      if (!tapeA || tapeB) { tapeA = { x: pt.x, y: pt.y }; tapeB = null; }
      else { tapeB = { x: pt.x, y: pt.y }; scoreTape(); }
      return;
    }

    if (canEditSite() && doc.level.drop && inRect(pt.x, pt.y, doc.level.drop) && !hitPart(pt) && tool !== "erase") {
      const drop = doc.level.drop;
      drag = { kind: "goal", x0: pt.x, y0: pt.y, ox: drop.x, oy: drop.y };
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
    if (tool === "move") {
      if (!grabbed) {
        panning = { x: ev.clientX, y: ev.clientY, px: view.panx, py: view.pany };
      }
      return;
    }
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
    if (over) {
      hover = pt;
      if (hitGoalCue(ev)) canvas.style.cursor = "pointer";
      else if (canEditSite() && doc.level.drop && inRect(pt.x, pt.y, doc.level.drop) && !playing) canvas.style.cursor = "grab";
      else if (!drag) canvas.style.cursor = "crosshair";
    }
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
      drag.x2 = x2; drag.y2 = y2; drag.snap = !!n; drag.snapKind = n ? n.kind : "";
    } else if (drag.kind === "rect") {
      drag.x2 = pt.x; drag.y2 = pt.y;
    } else if (drag.kind === "goal") {
      const drop = doc.level.drop;
      let x = drag.ox + (pt.x - drag.x0);
      let y = drag.oy + (pt.y - drag.y0);
      x = Math.max(0.3, Math.min(WORLD_W - drop.w - 0.3, x));
      y = Math.max(0.3, Math.min(10, y));
      const next = { x, y, w: drop.w, h: drop.h };
      if (!rectsOverlap(next, doc.level.shop)) {
        drop.x = x;
        drop.y = y;
      }
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
      drag.snapKind = snapped ? snapped.kind : "";
      drag.snapTo = snapped ? { x: snapped.x, y: snapped.y } : null;
    } else if (drag.kind === "place") {
      if (!over && drag.x == null && Math.hypot(ev.clientX - drag.sx, ev.clientY - drag.sy) < DRAG_PX) return;
      const use = over ? pt : worldFromEvent(ev);
      const s = snapPt(use);
      drag.x = s.x; drag.y = s.y; drag.snap = !!s.node; drag.snapKind = s.node ? s.node.kind : "";
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

  async function fillOpenShop() {
    hideHowto();
    showSystems(false);
    showCrew(false);
    if (courseId !== "open") await loadBuiltin("open");
    if (playing) stopPlay();
    if (doc.machine.parts.some((p) => p.type === "driveR")) {
      toast("Drive-R is already on the floor.");
      return;
    }
    const s = doc.level.shop;
    const core = (doc.level.cores && doc.level.cores[0]) || { x: s.x + 2 };
    const y = s.y + WHEEL_R + 0.04;
    const x = Math.max(s.x + WHEEL_R + 0.2, core.x - 1.7);
    if (!inRect(x, y, s)) {
      toast("Shop Floor is too small.");
      return;
    }
    if (!addPart({ type: "driveR", x, y, a: 0 })) return;
    toast("Drive-R on the floor.");
  }

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
    if (!jobUnlocked(id)) {
      toast(id === "editor" ? "Design unlocks after the build jobs are clear." : "Clear the job before this one.");
      refreshPath();
      return;
    }
    if (winEl) winEl.classList.remove("show");
    clearTour = false;
    const custom = classJobs().find((job) => job.id === id);
    if (custom) {
      if (playing) stopPlay();
      doc = unpackDoc(custom.doc);
      dirty = false;
      resetLoop(id);
      setLayer("machine");
      setTool("driveR");
      applyCam(true);
      refreshMeta();
      return;
    }
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
    seedFix();
    if (item.id === "open" && !levelDone("open")) doc.title = "Fix it";
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
    const lessonMeasure = document.getElementById("btn-lesson-measure");
    const lessonForces = document.getElementById("btn-lesson-forces");
    if (lessonMeasure) lessonMeasure.addEventListener("click", () => { showCrew(false); loadBuiltin("measure"); });
    if (lessonForces) lessonForces.addEventListener("click", () => { showCrew(false); loadBuiltin("forces"); });
    const currBtn = document.getElementById("btn-curriculum");
    if (currBtn) currBtn.addEventListener("click", () => setCurriculum(!curriculumOn));
    const currSteps = document.getElementById("curr-steps");
    if (currSteps) {
      currSteps.addEventListener("click", (ev) => {
        const b = ev.target.closest("[data-step]");
        if (!b) return;
        guideOn = true;
        pinnedStep = b.getAttribute("data-step");
        refreshGuide();
      });
    }
    const currMeasure = document.getElementById("btn-curr-measure");
    const currForces = document.getElementById("btn-curr-forces");
    const currSystems = document.getElementById("btn-curr-systems");
    if (currMeasure) currMeasure.addEventListener("click", () => loadBuiltin("measure"));
    if (currForces) currForces.addEventListener("click", () => loadBuiltin("forces"));
    if (currSystems) currSystems.addEventListener("click", () => showSystems(true));
    const raceSprint = document.getElementById("btn-race-sprint");
    const raceGatesBtn = document.getElementById("btn-race-gates");
    const raceLap = document.getElementById("btn-race-lap");
    if (raceSprint) raceSprint.addEventListener("click", () => { showCrew(false); loadBuiltin("sprint"); });
    if (raceGatesBtn) raceGatesBtn.addEventListener("click", () => { showCrew(false); loadBuiltin("gates"); });
    if (raceLap) raceLap.addEventListener("click", () => { showCrew(false); loadBuiltin("lap"); });
    const winNext = document.getElementById("win-next");
    const winSkip = document.getElementById("win-skip");
    if (winNext) {
      winNext.addEventListener("click", async () => {
        if (isRace()) {
          playing = false;
          sim = null;
          won = false;
          winT = 0;
          gateN = 0;
          playAge = 0;
          if (winEl) winEl.classList.remove("show");
          refreshMeta();
          return;
        }
        await goNextJob();
      });
    }
    if (winSkip) winSkip.addEventListener("click", () => { goNextJob(); });
    document.getElementById("btn-play").addEventListener("click", () => playing ? stopPlay() : startPlay());
    const fillBtn = document.getElementById("btn-fill");
    if (fillBtn) fillBtn.addEventListener("click", () => { fillOpenShop(); });
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
    if (sysClose) sysClose.addEventListener("click", () => clearWalls());
    const sysRoot = document.getElementById("systems");
    if (sysRoot) {
      sysRoot.addEventListener("click", (ev) => {
        if (ev.target === sysRoot) showSystems(false);
      });
    }
    const howtoBtn = document.getElementById("btn-howto");
    if (howtoBtn) howtoBtn.addEventListener("click", () => showHowto(0, true));
    const howtoSkip = document.getElementById("howto-skip");
    if (howtoSkip) howtoSkip.addEventListener("click", clearWalls);
    const howtoRead = document.getElementById("howto-read");
    if (howtoRead) {
      howtoRead.addEventListener("click", () => {
        const picked = howtoCard(howtoIndex);
        if (picked.canSpeak) say(`${picked.card.title}. ${picked.card.body}`, access.lang);
      });
    }
    const howtoNext = document.getElementById("howto-next");
    if (howtoNext) {
      howtoNext.addEventListener("click", () => {
        if (howtoIndex >= HOWTO.length - 1) {
          hideHowto();
          return;
        }
        showHowto(howtoIndex + 1, true);
      });
    }
    const settingsBtn = document.getElementById("btn-settings");
    const accessSheet = document.getElementById("access");
    function showAccess(on) {
      if (!accessSheet) return;
      accessSheet.hidden = !on;
      paintAccess();
    }
    if (settingsBtn) settingsBtn.addEventListener("click", () => showAccess(true));
    const accessClose = document.getElementById("access-close");
    if (accessClose) accessClose.addEventListener("click", () => showAccess(false));
    if (accessSheet) {
      accessSheet.addEventListener("click", (ev) => {
        if (ev.target === accessSheet) showAccess(false);
      });
      accessSheet.querySelectorAll("[data-lang]").forEach((b) => {
        b.addEventListener("click", () => {
          const lang = b.getAttribute("data-lang");
          if (lang !== "en" && lang !== "simple" && lang !== "es") return;
          access = { ...access, lang };
          writeAccess(access);
          paintAccess();
          if (!document.getElementById("howto").hidden) showHowto(howtoIndex, false);
          const copy = ACCESS_COPY[lang];
          say(lang === "es" ? copy.es : lang === "simple" ? copy.simple : copy.english, lang);
          refreshGuide();
        });
      });
    }
    const speakBtn = document.getElementById("access-speak");
    if (speakBtn) {
      speakBtn.addEventListener("click", () => {
        access = { ...access, speak: !access.speak };
        writeAccess(access);
        paintAccess();
        if (access.speak) say((ACCESS_COPY[access.lang] || ACCESS_COPY.en).speakOn, access.lang);
        else stopSay();
      });
    }
    const bigBtn = document.getElementById("access-big");
    if (bigBtn) {
      bigBtn.addEventListener("click", () => {
        access = { ...access, big: !access.big };
        writeAccess(access);
        paintAccess();
      });
    }
    const fewerBtn = document.getElementById("access-fewer");
    if (fewerBtn) {
      fewerBtn.addEventListener("click", () => {
        access = { ...access, fewer: !access.fewer };
        writeAccess(access);
        paintAccess();
        refreshGuide();
      });
    }
    paintAccess();
    const strip = document.getElementById("job-strip");
    if (strip) {
      strip.addEventListener("click", (ev) => {
        const live = ev.target.closest("#btn-export-live");
        if (live) {
          doc.title = sanitizeTitle(document.getElementById("title").value || doc.title);
          downloadLevel(doc);
          toast("Saved an alias file. Not permanent.");
          return;
        }
        const hit = ev.target.closest("[data-course]");
        if (!hit || hit.disabled) return;
        if (hit.dataset.course === courseId) {
          resetView();
          return;
        }
        loadBuiltin(hit.dataset.course);
      });
    }
    const retryBtn = document.getElementById("btn-retry");
    if (retryBtn) {
      retryBtn.addEventListener("click", () => {
        showCalmFail("");
        if (!playing) startPlay();
      });
    }
    const exportBtn = document.getElementById("btn-export");
    if (exportBtn) {
      exportBtn.addEventListener("click", () => {
        if (!allClear() || courseId !== "editor") {
          toast("Export unlocks in Design, after the last build job.");
          return;
        }
        doc.title = sanitizeTitle(document.getElementById("title").value || doc.title);
        downloadLevel(doc);
        toast("Saved an alias file. Not permanent.");
      });
    }
    const goalBtn = document.getElementById("btn-goal");
    if (goalBtn) {
      goalBtn.addEventListener("click", async () => {
        hideHowto();
        showCrew(false);
        if (courseId !== "editor") await loadBuiltin("editor");
        setLayer("level");
        setTool("move");
        toast("Drag the Drop Zone. Challenges keep the goal locked.");
      });
    }
    const moreBtn = document.getElementById("btn-more");
    const more = document.getElementById("menu-more");
    if (moreBtn && more) {
      moreBtn.addEventListener("click", () => {
        const open = more.hidden;
        more.hidden = !open;
        moreBtn.setAttribute("aria-expanded", open ? "true" : "false");
        moreBtn.textContent = open ? "Less" : "More";
      });
    }
    const menuCard = document.querySelector(".menu-card");
    if (menuCard) {
      menuCard.addEventListener("click", async (ev) => {
        const hit = ev.target.closest("[data-course]");
        if (!hit || !hit.dataset.course) return;
        hideHowto();
        showCrew(false);
        await loadBuiltin(hit.dataset.course);
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
    if (crewClose) crewClose.addEventListener("click", () => clearWalls());
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
    const wideGate = document.getElementById("rotate-gate");
    if (wideGate) wideGate.addEventListener("click", tryWide);
    document.addEventListener("fullscreenchange", () => {
      if (document.fullscreenElement) lockLandscape();
    });
    document.addEventListener("webkitfullscreenchange", () => {
      if (document.webkitFullscreenElement) lockLandscape();
    });
    window.addEventListener("keydown", (ev) => {
      if (ev.metaKey || ev.ctrlKey || ev.altKey) {
        if ((ev.key === "z" || ev.key === "Z") && (ev.ctrlKey || ev.metaKey) && !ev.altKey) {
          ev.preventDefault();
          undo();
        }
        return;
      }
      const el = ev.target;
      if (el && el.closest && el.closest("input, textarea, select")) return;
      const key = ev.key.length === 1 ? ev.key.toLowerCase() : ev.key;
      if (ev.code === "Space") {
        ev.preventDefault();
        if (won) return;
        playing ? stopPlay() : startPlay();
        return;
      }
      const toolKey = { "1": "driveR", "2": "driveL", "3": "roller", "4": "steel", "5": "ghost", e: "erase", m: "move" };
      if (toolKey[key]) {
        setLayer("machine");
        setTool(toolKey[key]);
        return;
      }
      if (key === "s") {
        ev.preventDefault();
        slowMo = !slowMo;
        refreshMeta();
        return;
      }
      if (key === "g") { lookAtDrop(); return; }
      if (key === "h") { resetView(); return; }
      if (key === "z") { undo(); return; }
      if (key === "t" && isMeasure()) setTool("tape");
      if (ev.key === "Escape") {
        if (playing) stopPlay();
        showCrew(false);
        showSystems(false);
        hideHowto();
        debugOn = false;
        return;
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
    const winOpen = winEl && winEl.classList.contains("show");
    applyCoach();
    const coaching = document.body.dataset.coach === "1" || (courseId === "roll" && !levelDone("roll"));
    const busy = playing || drag || howtoOpen || debugOn || winOpen || coaching;
    if (!busy && now - lastDraw < 50) {
      requestAnimationFrame(loop);
      return;
    }
    lastDraw = now;
    if (playing && sim && !won) {
      acc += dt;
      let steps = 0;
      const stepCost = slowMo ? DT / 0.35 : DT;
      while (acc >= stepCost && steps < 4) {
        stepSim(1);
        acc -= stepCost;
        steps++;
      }
      if (acc >= DT) acc = 0;
      if (playing && !won && sim && sim.cores[0]) {
        const p = sim.cores[0].getPosition();
        const ago = trail.length > 45 ? trail[trail.length - 45] : null;
        const stuck = playAge > 3.2 && ago && Math.hypot(p.x - ago.x, p.y - ago.y) < 0.22;
        if (p.y < -0.4 || playAge > 12 || stuck) stopPlay();
      }
    }
    applyCam(false);
    draw();
    drawHowtoDemo(now);
    requestAnimationFrame(loop);
  }

  window.addEventListener("resize", fit);
  if (window.ResizeObserver) {
    const stageBox = document.querySelector(".stage-fit");
    if (stageBox) new ResizeObserver(() => fit()).observe(stageBox);
  }
  fit();
  bind();
  setTool("driveR");
  setLayer("machine");
  refreshMeta();
  const assigned = new URLSearchParams(location.search).get("course");
  const currQ = new URLSearchParams(location.search).get("curriculum");
  debugOn = new URLSearchParams(location.search).get("debug") === "1";
  let embed = new URLSearchParams(location.search).get("embed") === "1"
    || new URLSearchParams(location.search).get("tw") === "1";
  try { if (window.self !== window.top) embed = true; } catch (e) { embed = true; }
  document.body.dataset.embed = embed ? "1" : "0";
  document.body.dataset.tw = embed ? "1" : "0";
  if (assigned && BUILTIN.some((x) => x.id === assigned)) {
    loadBuiltin(assigned);
  } else {
    seedFix();
    doc.title = "Fix it";
    if (titleEl) titleEl.value = doc.title;
  }
  showCrew(false);
  showSystems(false);
  hideHowto();
  if (currQ === "1" || currQ === "on") setCurriculum(true);
  else if (currQ === "0" || currQ === "off") setCurriculum(false);
  else setCurriculum(curriculumOn);
  applyCoach();
  requestAnimationFrame(loop);
}

boot();
