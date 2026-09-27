import {
  closestOnCubic,
  ellipseSubs,
  node as gnode,
  offsetPoly,
  parsePath,
  polygonSubs,
  rectSubs,
  segmentControls,
  spiralSubs,
  splitCubic,
  starSubs,
  subsBBox,
  subsToD,
  unionBBox,
} from "./geom.js";

const paper = window.paper;
const opentype = window.opentype;

const $ = (id) => document.getElementById(id);
const svg = $("svg");
const world = $("world");
const pageG = $("page");
const contentG = $("content");
const overlay = $("overlay");
const defs = $("defs");
const stage = $("stage");
const emptyEl = $("empty");
const hintEl = $("hint");
const coordsEl = $("coords");
const menusEl = $("menus");
const toolsEl = $("tools");
const menuEl = $("menu");
const inspector = $("inspector");
const docName = $("doc-name");
const dialog = $("dialog");
const dialogForm = $("dialog-form");
const dialogTitle = $("dialog-title");
const dialogBody = $("dialog-body");
const dialogOk = $("dialog-ok");
const dialogCancel = $("dialog-cancel");

const SAVE_KEY = "drawin-vector-v1";
const paint = { fill: "#1c1915", stroke: "#1c1915", sw: 3, dash: "" };
const state = {
  doc: null,
  tool: "select",
  sel: new Set(),
  nodeSel: [],
  view: { x: 48, y: 48, z: 1 },
  undo: [],
  redo: [],
  before: null,
  gesture: null,
  pen: null,
  guides: [],
  space: false,
  clip: null,
  toolOpts: { sides: 6, starPoints: 5, inner: 0.45, turns: 3 },
};
let seq = 1;
let saveTimer = 0;
let fontP = null;

const HINTS = {
  select: "Drag to move. Shift adds. Corner handles scale, the brass knob rotates. Alt-drag copies.",
  node: "Drag nodes and handles. Double-click a segment to add a node. Delete removes nodes.",
  pen: "Click corners, drag curves. Click the start node to close. Enter finishes, Esc cancels.",
  pencil: "Draw freehand. The line simplifies into curves when you let go.",
  rect: "Drag a rectangle. Shift locks a square. Alt grows from the center.",
  ellipse: "Drag an ellipse. Shift locks a circle. Alt grows from the center.",
  polygon: "Drag a polygon. Change sides in the panel.",
  star: "Drag a star. Points and inner radius are in the panel.",
  spiral: "Drag a spiral from the center.",
  text: "Click to place text, then edit it in the panel.",
  zoom: "Click to zoom in. Alt-click zooms out. The wheel always zooms toward the cursor.",
  hand: "Drag to pan. Space-drag pans from any tool.",
  gradient: "Select a path, then drag the brass stop to aim the gradient.",
  dropper: "Click any fill to pick it up.",
};

const TOOLS = [
  ["select", "V", "Select", "M5 3l5.2 16 2.2-6.2L18 10.5z"],
  ["node", "N", "Node", "M4 16h4M16 8h4M8 16c3 0 5-8 8-8M8 16a2 2 0 1 1-4 0 2 2 0 0 1 4 0M20 8a2 2 0 1 1-4 0 2 2 0 0 1 4 0"],
  ["pen", "B", "Pen", "M4 18l8-12 4 3-8 12zM12 6l2-2 4 3-2 2"],
  ["pencil", "P", "Pencil", "M4 16c3-1 4-6 8-6s5 5 8 4"],
  ["rect", "R", "Rectangle", "M5 6h14v12H5z"],
  ["ellipse", "E", "Ellipse", "M12 6a8 6 0 1 0 0.1 0"],
  ["polygon", "Y", "Polygon", "M12 4l7 6-3 8H8L5 10z"],
  ["star", "*", "Star", "M12 3l2.4 5.6L20 9.2l-4 3.8.9 6-4.9-2.8L7.1 19l.9-6-4-3.8 5.6-.6z"],
  ["spiral", "L", "Spiral", "M12 12c2 0 3 2 2 3s-3 1-4-1-1-5 3-5 6 4 5 7"],
  ["text", "T", "Text", "M6 6h12M12 6v12"],
  ["gradient", "G", "Gradient", "M5 16c2-6 12-6 14 0"],
  ["dropper", "I", "Dropper", "M14 4l4 4-6 6-2 4-4-1 1-4z"],
  ["zoom", "Z", "Zoom", "M10 10a4 4 0 1 0 0.1 0M14 14l4 4"],
  ["hand", "H", "Hand", "M8 11V6M12 11V4M16 11V6M8 11c0 5 2 8 4 8s6-3 6-7v-1"],
];

const SWATCHES = ["#1c1915", "#f4f0e6", "#d08a2d", "#8f4a32", "#3d5a4c", "#24344c", "#a33b32", "#e7d7b1"];

function uid() {
  return "i" + (seq++).toString(36);
}
function toast(msg) {
  hintEl.textContent = msg;
}
function activeLayer() {
  return state.doc.layers.find((l) => l.id === state.doc.active) || state.doc.layers[0];
}
function blankDoc(w = 960, h = 640) {
  const id = uid();
  return {
    name: "Untitled",
    w, h,
    bg: "#f4f0e6",
    grid: 20,
    showGrid: true,
    snap: true,
    active: id,
    layers: [{ id, name: "Layer 1", visible: true, locked: false, items: [] }],
  };
}
function nextName(prefix) {
  let n = 1;
  const names = new Set();
  walk((it) => names.add(it.name));
  while (names.has(`${prefix} ${n}`)) n += 1;
  return `${prefix} ${n}`;
}
function walk(fn, items) {
  const list = items || state.doc.layers.flatMap((l) => l.items);
  for (const it of list) {
    fn(it);
    if (it.kind === "group") walk(fn, it.children);
  }
}
function countItems() {
  let n = 0;
  walk(() => { n += 1; });
  return n;
}
function locate(id, items) {
  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    if (it.id === id) return { item: it, parent: items, index: i };
    if (it.kind === "group") {
      const hit = locate(id, it.children);
      if (hit) return hit;
    }
  }
  return null;
}
function locateAnywhere(id) {
  for (const layer of state.doc.layers) {
    const hit = locate(id, layer.items);
    if (hit) return { ...hit, layer };
  }
  return null;
}
function selectedItems() {
  const out = [];
  for (const id of state.sel) {
    const loc = locateAnywhere(id);
    if (loc) out.push(loc.item);
  }
  return out;
}
function itemBBox(it) {
  if (!it) return { x: 0, y: 0, w: 0, h: 0 };
  if (it.kind === "group") return unionBBox(it.children.map(itemBBox));
  if (it.kind === "text") {
    const size = it.size || 32;
    const w = Math.max(12, (it.text || "").length * size * 0.55);
    let x = it.x;
    if (it.anchor === "middle") x -= w / 2;
    if (it.anchor === "end") x -= w;
    return { x, y: it.y - size * 0.82, w, h: size };
  }
  return subsBBox(it.subs);
}
function mapSubs(subs, fn) {
  for (const sub of subs || []) {
    for (const n of sub.nodes) {
      const p = fn(n.x, n.y);
      n.x = p.x;
      n.y = p.y;
      if (n.inx != null) {
        const h = fn(n.inx, n.iny);
        n.inx = h.x;
        n.iny = h.y;
      }
      if (n.outx != null) {
        const h = fn(n.outx, n.outy);
        n.outx = h.x;
        n.outy = h.y;
      }
    }
  }
}
function translateItem(it, dx, dy) {
  if (!dx && !dy) return;
  if (it.kind === "group") it.children.forEach((c) => translateItem(c, dx, dy));
  else if (it.kind === "text") {
    it.x += dx;
    it.y += dy;
    if (it.onPath) {
      const subs = parsePath(it.onPath);
      mapSubs(subs, (x, y) => ({ x: x + dx, y: y + dy }));
      it.onPath = subsToD(subs);
    }
  } else mapSubs(it.subs, (x, y) => ({ x: x + dx, y: y + dy }));
}
function copyGeom(src, dst) {
  if (src.subs) dst.subs = structuredClone(src.subs);
  if (src.kind === "text") {
    dst.x = src.x;
    dst.y = src.y;
    dst.rot = src.rot;
    dst.size = src.size;
    dst.onPath = src.onPath;
  }
  if (src.kind === "group") {
    for (let i = 0; i < src.children.length; i++) copyGeom(src.children[i], dst.children[i]);
  }
}
function snapshot() {
  return JSON.stringify({ doc: state.doc, guides: state.guides, seq });
}
function restore(raw) {
  const data = JSON.parse(raw);
  state.doc = data.doc;
  state.guides = data.guides || [];
  seq = data.seq || seq;
  state.sel.clear();
  state.nodeSel = [];
  state.pen = null;
  docName.value = state.doc.name;
  renderAll();
  renderInspector();
}
function mutate(fn) {
  const before = snapshot();
  try {
    fn();
  } catch (err) {
    console.error(err);
    restore(before);
    toast("That edit failed.");
    return;
  }
  if (snapshot() !== before) {
    state.undo.push(before);
    if (state.undo.length > 80) state.undo.shift();
    state.redo.length = 0;
    saveSoon();
  }
  renderAll();
  if (!inspector.contains(document.activeElement)) renderInspector();
}
function beginChange() {
  if (!state.before) state.before = snapshot();
}
function endChange() {
  if (state.before && state.before !== snapshot()) {
    state.undo.push(state.before);
    if (state.undo.length > 80) state.undo.shift();
    state.redo.length = 0;
    saveSoon();
  }
  state.before = null;
}
function undo() {
  if (!state.undo.length) return;
  state.redo.push(snapshot());
  restore(state.undo.pop());
}
function redo() {
  if (!state.redo.length) return;
  state.undo.push(snapshot());
  restore(state.redo.pop());
}
function saveSoon() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      localStorage.setItem(SAVE_KEY, snapshot());
    } catch { /* ignore quota */ }
  }, 250);
}
function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => {
    const amp = String.fromCharCode(38);
    if (c === "&") return amp + "amp;";
    if (c === "<") return amp + "lt;";
    if (c === ">") return amp + "gt;";
    if (c === '"') return amp + "quot;";
    return amp + "#39;";
  });
}
function paintOf(v) {
  if (!v || v === "none") return "none";
  if (typeof v === "string") return v;
  return null;
}
function gradMarkup(item) {
  let html = "";
  for (const key of ["fill", "stroke"]) {
    const v = item[key];
    if (!v || typeof v === "string") continue;
    const stops = (v.stops || []).map((s) => `<stop offset="${s.o}" stop-color="${esc(s.c)}"/>`).join("");
    if (v.type === "radial") {
      html += `<radialGradient id="${key}-${item.id}" gradientUnits="objectBoundingBox" cx="${v.cx ?? 0.5}" cy="${v.cy ?? 0.5}" r="${v.r ?? 0.7}">${stops}</radialGradient>`;
    } else {
      html += `<linearGradient id="${key}-${item.id}" gradientUnits="objectBoundingBox" x1="${v.x1 ?? 0}" y1="${v.y1 ?? 0}" x2="${v.x2 ?? 1}" y2="${v.y2 ?? 0}">${stops}</linearGradient>`;
    }
  }
  return html;
}
function paintAttr(item, key) {
  const v = item[key];
  if (!v || v === "none") return "none";
  if (typeof v === "string") return v;
  return `url(#${key}-${item.id})`;
}
function dashAttr(item) {
  return item.dash ? ` stroke-dasharray="${esc(item.dash)}"` : "";
}
function itemMarkup(it) {
  const op = it.opacity == null ? "" : ` opacity="${it.opacity}"`;
  if (it.kind === "group") {
    return `<g data-id="${it.id}"${op}>${it.children.map(itemMarkup).join("")}</g>`;
  }
  if (it.kind === "text") {
    const anchor = it.anchor || "start";
    const rot = it.rot ? ` transform="rotate(${it.rot} ${it.x} ${it.y})"` : "";
    const common = `data-id="${it.id}" fill="${esc(paintAttr(it, "fill"))}" font-size="${it.size || 32}" font-family="Drawin Sans, sans-serif" font-weight="${it.weight || 600}" text-anchor="${anchor}"${op}${rot}`;
    if (it.onPath) {
      return `<g>${`<path id="tp-${it.id}" d="${esc(it.onPath)}" fill="none"/>`}<text ${common}><textPath href="#tp-${it.id}">${esc(it.text || "")}</textPath></text></g>`;
    }
    return `<text ${common} x="${it.x}" y="${it.y}">${esc(it.text || "")}</text>`;
  }
  const d = subsToD(it.subs);
  return `<path data-id="${it.id}" d="${esc(d)}" fill="${esc(paintAttr(it, "fill"))}" stroke="${esc(paintAttr(it, "stroke"))}" stroke-width="${it.sw ?? 0}" stroke-linecap="${it.cap || "butt"}" stroke-linejoin="${it.join || "miter"}"${dashAttr(it)}${op}/>`;
}
function applyView() {
  world.setAttribute("transform", `translate(${state.view.x} ${state.view.y}) scale(${state.view.z})`);
}
function clientToDoc(e) {
  const pt = svg.createSVGPoint();
  pt.x = e.clientX;
  pt.y = e.clientY;
  const ctm = world.getScreenCTM();
  if (!ctm) return { x: 0, y: 0 };
  const p = pt.matrixTransform(ctm.inverse());
  return { x: p.x, y: p.y };
}
function snap(p) {
  const doc = state.doc;
  if (!doc.snap) return { ...p };
  const tol = 8 / state.view.z;
  let x = p.x;
  let y = p.y;
  let best = tol;
  let hit = null;
  if (doc.snap !== false) {
    walk((it) => {
      if (state.sel.has(it.id) || !it.subs) return;
      for (const sub of it.subs) {
        for (const n of sub.nodes) {
          const d = Math.hypot(n.x - p.x, n.y - p.y);
          if (d < best) {
            best = d;
            hit = { x: n.x, y: n.y };
          }
        }
      }
    });
    for (const g of state.guides) {
      if (g.axis === "x" && Math.abs(g.at - p.x) < best) {
        best = Math.abs(g.at - p.x);
        hit = { x: g.at, y: p.y };
      }
      if (g.axis === "y" && Math.abs(g.at - p.y) < best) {
        best = Math.abs(g.at - p.y);
        hit = { x: p.x, y: g.at };
      }
    }
  }
  if (hit) return hit;
  if (doc.grid) {
    const gx = Math.round(x / doc.grid) * doc.grid;
    const gy = Math.round(y / doc.grid) * doc.grid;
    if (Math.abs(gx - x) <= tol) x = gx;
    if (Math.abs(gy - y) <= tol) y = gy;
  }
  for (const v of [0, doc.w / 2, doc.w]) if (Math.abs(v - x) <= tol) x = v;
  for (const v of [0, doc.h / 2, doc.h]) if (Math.abs(v - y) <= tol) y = v;
  return { x, y };
}
function renderGrid() {
  const d = state.doc;
  const sw = 1 / state.view.z;
  const step = d.grid || 20;
  defs.innerHTML =
    (d.showGrid
      ? `<pattern id="grid" width="${step}" height="${step}" patternUnits="userSpaceOnUse"><path d="M ${step} 0 L 0 0 0 ${step}" fill="none" stroke="#d9d2c3" stroke-width="${sw}"/></pattern>`
      : "") + state.doc.layers.map((l) => l.items.map(gradMarkup).join("")).join("");
  // gradients live with items; rebuild below more carefully
}
function allGrads() {
  let html = "";
  walk((it) => { html += gradMarkup(it); });
  return html;
}
function renderPage() {
  const d = state.doc;
  const step = d.grid || 20;
  const sw = 1 / state.view.z;
  defs.innerHTML =
    (d.showGrid
      ? `<pattern id="grid" width="${step}" height="${step}" patternUnits="userSpaceOnUse"><path d="M ${step} 0 L 0 0 0 ${step}" fill="none" stroke="#d9d2c3" stroke-width="${sw}"/></pattern>`
      : "") + allGrads();
  pageG.innerHTML = `<rect class="sheet" data-page="1" x="0" y="0" width="${d.w}" height="${d.h}" fill="${esc(d.bg)}"/>${
    d.showGrid ? `<rect x="0" y="0" width="${d.w}" height="${d.h}" fill="url(#grid)" pointer-events="none"/>` : ""
  }`;
}
function renderContent() {
  contentG.innerHTML = state.doc.layers
    .filter((l) => l.visible)
    .map((l) => `<g data-layer="${l.id}">${l.items.map(itemMarkup).join("")}</g>`)
    .join("");
}
function handlesFor(b) {
  const k = 4 / state.view.z;
  const pts = [
    [b.x, b.y, "nw", "nwse-resize"],
    [b.x + b.w / 2, b.y, "n", "ns-resize"],
    [b.x + b.w, b.y, "ne", "nesw-resize"],
    [b.x + b.w, b.y + b.h / 2, "e", "ew-resize"],
    [b.x + b.w, b.y + b.h, "se", "nwse-resize"],
    [b.x + b.w / 2, b.y + b.h, "s", "ns-resize"],
    [b.x, b.y + b.h, "sw", "nesw-resize"],
    [b.x, b.y + b.h / 2, "w", "ew-resize"],
  ];
  return pts.map(([x, y, name, cursor]) => ({ x, y, name, cursor, k }));
}
function renderOverlay() {
  const k = 1 / state.view.z;
  const parts = [];
  const g = state.gesture;
  state.guides.forEach((g, i) => {
    const sw = 10 * k;
    if (g.axis === "x") {
      parts.push(`<line data-guide="${i}" class="guide" x1="${g.at}" y1="-8000" x2="${g.at}" y2="8000" stroke-width="${sw}"/>`);
    } else {
      parts.push(`<line data-guide="${i}" class="guide" x1="-8000" y1="${g.at}" x2="8000" y2="${g.at}" stroke-width="${sw}"/>`);
    }
  });
  if (state.pen) {
    const d = subsToD([{ closed: false, nodes: state.pen.nodes }]);
    parts.push(`<path class="penprev" d="${esc(d)}" stroke-width="${2 * k}" fill="none"/>`);
    const last = state.pen.nodes[state.pen.nodes.length - 1];
    if (state.pen.hover && last && !state.pen.dragging) {
      parts.push(`<line class="penprev" x1="${last.x}" y1="${last.y}" x2="${state.pen.hover.x}" y2="${state.pen.hover.y}" stroke-width="${1.5 * k}"/>`);
    }
    for (const n of state.pen.nodes) {
      parts.push(`<circle class="node" cx="${n.x}" cy="${n.y}" r="${4 * k}"/>`);
    }
  }
  if (g?.type === "pencil" && g.pts?.length > 1) {
    const d = g.pts.map((pt, i) => `${i ? "L" : "M"}${pt.x} ${pt.y}`).join(" ");
    parts.push(`<path class="penprev" d="${d}" stroke-width="${2 * k}" fill="none"/>`);
  }
  if (g?.type === "marquee") {
    const x = Math.min(g.x, g.cur.x);
    const y = Math.min(g.y, g.cur.y);
    parts.push(`<rect class="selbox" x="${x}" y="${y}" width="${Math.abs(g.cur.x - g.x)}" height="${Math.abs(g.cur.y - g.y)}" stroke-width="${k}"/>`);
  }
  const items = selectedItems();
  if (items.length && state.tool === "select") {
    const b = unionBBox(items.map(itemBBox));
    if (b.w || b.h) {
      parts.push(`<rect class="selbox" x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" stroke-width="${1.4 * k}"/>`);
      for (const h of handlesFor(b)) {
        parts.push(`<rect data-handle="${h.name}" class="handle" x="${h.x - h.k}" y="${h.y - h.k}" width="${h.k * 2}" height="${h.k * 2}" style="cursor:${h.cursor}"/>`);
      }
      const rx = b.x + b.w / 2;
      const ry = b.y - 22 * k;
      parts.push(`<line x1="${rx}" y1="${b.y}" x2="${rx}" y2="${ry}" stroke="#d08a2d" stroke-width="${k}"/>`);
      parts.push(`<circle data-handle="rot" class="handle rot" cx="${rx}" cy="${ry}" r="${5.5 * k}" style="cursor:grab"/>`);
    }
  }
  if (state.tool === "node") {
    for (const it of items) {
      if (!it.subs) continue;
      it.subs.forEach((sub, si) => {
        sub.nodes.forEach((n, ni) => {
          const on = state.nodeSel.some((s) => s.id === it.id && s.si === si && s.ni === ni);
          if (n.inx != null) {
            parts.push(`<line x1="${n.x}" y1="${n.y}" x2="${n.inx}" y2="${n.iny}" stroke="#24344c" stroke-width="${k}"/>`);
            parts.push(`<circle data-node="${it.id}:${si}:${ni}" data-which="in" class="node" cx="${n.inx}" cy="${n.iny}" r="${3.5 * k}"/>`);
          }
          if (n.outx != null) {
            parts.push(`<line x1="${n.x}" y1="${n.y}" x2="${n.outx}" y2="${n.outy}" stroke="#24344c" stroke-width="${k}"/>`);
            parts.push(`<circle data-node="${it.id}:${si}:${ni}" data-which="out" class="node" cx="${n.outx}" cy="${n.outy}" r="${3.5 * k}"/>`);
          }
          parts.push(`<rect data-node="${it.id}:${si}:${ni}" data-which="pt" class="node${on ? " on" : ""}" x="${n.x - 4 * k}" y="${n.y - 4 * k}" width="${8 * k}" height="${8 * k}"/>`);
        });
      });
    }
  }
  if (state.tool === "gradient") {
    for (const it of items) {
      if (!it.fill || typeof it.fill === "string" || !it.subs) continue;
      const b = itemBBox(it);
      const x1 = b.x + (it.fill.x1 ?? 0) * b.w;
      const y1 = b.y + (it.fill.y1 ?? 0) * b.h;
      const x2 = b.x + (it.fill.x2 ?? 1) * b.w;
      const y2 = b.y + (it.fill.y2 ?? 0) * b.h;
      parts.push(`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#d08a2d" stroke-width="${k}"/>`);
      parts.push(`<circle data-gstop="2" data-gid="${it.id}" class="gstop handle rot" cx="${x2}" cy="${y2}" r="${5 * k}"/>`);
    }
  }
  overlay.innerHTML = parts.join("");
  emptyEl.hidden = countItems() > 0 || !!state.pen;
}
function renderAll() {
  applyView();
  renderPage();
  renderContent();
  renderOverlay();
  drawRulers();
  const b = selectedItems();
  const box = b.length ? unionBBox(b.map(itemBBox)) : null;
  coordsEl.textContent = box
    ? `${Math.round(state.view.z * 100)}%  ·  ${Math.round(box.w)} × ${Math.round(box.h)}`
    : `${Math.round(state.view.z * 100)}%`;
}
function drawRulers() {
  const rx = $("ruler-x");
  const ry = $("ruler-y");
  const dpr = window.devicePixelRatio || 1;
  const rw = rx.clientWidth;
  const rh = ry.clientHeight;
  rx.width = Math.max(1, rw * dpr);
  rx.height = 22 * dpr;
  ry.width = 22 * dpr;
  ry.height = Math.max(1, rh * dpr);
  const cx = rx.getContext("2d");
  const cy = ry.getContext("2d");
  cx.setTransform(dpr, 0, 0, dpr, 0, 0);
  cy.setTransform(dpr, 0, 0, dpr, 0, 0);
  cx.clearRect(0, 0, rw, 22);
  cy.clearRect(0, 0, 22, rh);
  cx.fillStyle = "#a39c90";
  cy.fillStyle = "#a39c90";
  cx.font = "10px Drawin Sans, sans-serif";
  cy.font = "10px Drawin Sans, sans-serif";
  const z = state.view.z;
  const step = niceStep(80 / z);
  const stageRect = stage.getBoundingClientRect();
  const svgRect = svg.getBoundingClientRect();
  const x0 = (svgRect.left - stageRect.left - state.view.x) / z;
  const x1 = x0 + rw / z;
  const y0 = (0 - state.view.y) / z;
  const y1 = y0 + rh / z;
  cx.strokeStyle = "#454037";
  cy.strokeStyle = "#454037";
  for (let x = Math.floor(x0 / step) * step; x < x1; x += step) {
    const sx = state.view.x + x * z;
    cx.beginPath();
    cx.moveTo(sx, 22);
    cx.lineTo(sx, 12);
    cx.stroke();
    cx.fillText(String(Math.round(x)), sx + 2, 10);
  }
  for (let y = Math.floor(y0 / step) * step; y < y1; y += step) {
    const sy = state.view.y + y * z;
    cy.beginPath();
    cy.moveTo(22, sy);
    cy.lineTo(12, sy);
    cy.stroke();
    cy.save();
    cy.translate(10, sy + 2);
    cy.rotate(-Math.PI / 2);
    cy.fillText(String(Math.round(y)), 0, 0);
    cy.restore();
  }
}
function niceStep(unit) {
  const pow = Math.pow(10, Math.floor(Math.log10(unit)));
  const n = unit / pow;
  const m = n < 1.5 ? 1 : n < 3.5 ? 2 : n < 7.5 ? 5 : 10;
  return m * pow;
}
function fitPage() {
  const rect = stage.getBoundingClientRect();
  if (rect.width < 20) return;
  const z = Math.min((rect.width - 64) / state.doc.w, (rect.height - 64) / state.doc.h);
  state.view.z = Math.max(0.05, Math.min(8, z));
  state.view.x = (rect.width - state.doc.w * state.view.z) / 2;
  state.view.y = (rect.height - state.doc.h * state.view.z) / 2;
  renderAll();
}
function fitSel() {
  const items = selectedItems();
  if (!items.length) return fitPage();
  const b = unionBBox(items.map(itemBBox));
  const rect = stage.getBoundingClientRect();
  const z = Math.min((rect.width - 80) / Math.max(b.w, 1), (rect.height - 80) / Math.max(b.h, 1));
  state.view.z = Math.max(0.05, Math.min(32, z));
  state.view.x = rect.width / 2 - (b.x + b.w / 2) * state.view.z;
  state.view.y = rect.height / 2 - (b.y + b.h / 2) * state.view.z;
  renderAll();
}
function zoomAt(client, factor) {
  const before = clientToDoc(client);
  state.view.z = Math.max(0.05, Math.min(64, state.view.z * factor));
  const rect = svg.getBoundingClientRect();
  state.view.x = client.clientX - rect.left - before.x * state.view.z;
  state.view.y = client.clientY - rect.top - before.y * state.view.z;
  renderAll();
}
function paperReady() {
  if (!paper.project) {
    const c = document.createElement("canvas");
    paper.setup(c);
  }
  return paper;
}
function paperToSubs(item) {
  const paths = [];
  const visit = (it) => {
    if (!it) return;
    if (it.className === "Path" && it.segments?.length) paths.push(it);
    else if (it.children?.length) [...it.children].forEach(visit);
    else if (it.segments?.length) paths.push(it);
  };
  visit(item);
  return paths
    .map((p) => ({
      closed: !!p.closed,
      nodes: p.segments.map((s) => {
        const hi = s.handleIn;
        const ho = s.handleOut;
        const hasIn = Math.hypot(hi.x, hi.y) > 0.05;
        const hasOut = Math.hypot(ho.x, ho.y) > 0.05;
        return gnode(s.point.x, s.point.y, {
          inx: hasIn ? s.point.x + hi.x : null,
          iny: hasIn ? s.point.y + hi.y : null,
          outx: hasOut ? s.point.x + ho.x : null,
          outy: hasOut ? s.point.y + ho.y : null,
          kind: hasIn || hasOut ? "smooth" : "corner",
        });
      }),
    }))
    .filter((s) => s.nodes.length);
}
function makePath(subs, from) {
  return {
    id: uid(),
    kind: "path",
    name: nextName("Path"),
    subs,
    fill: from?.fill ?? "none",
    stroke: from?.stroke ?? paint.stroke,
    sw: from?.sw ?? paint.sw,
    dash: from?.dash ?? paint.dash,
    opacity: from?.opacity ?? 1,
    cap: from?.cap || "round",
    join: from?.join || "round",
  };
}
function addItem(it) {
  const layer = activeLayer();
  if (layer.locked) return toast("That layer is locked.");
  layer.items.push(it);
  state.sel = new Set([it.id]);
  state.nodeSel = [];
}
function shapeSubs(kind, x0, y0, x1, y1, shift, alt) {
  let x = Math.min(x0, x1);
  let y = Math.min(y0, y1);
  let w = Math.abs(x1 - x0);
  let h = Math.abs(y1 - y0);
  if (alt) {
    w *= 2;
    h *= 2;
    x = x0 - w / 2;
    y = y0 - h / 2;
  }
  if (shift) {
    const s = Math.max(w, h);
    if (!alt) {
      x = x1 < x0 ? x0 - s : x0;
      y = y1 < y0 ? y0 - s : y0;
    } else {
      x = x0 - s;
      y = y0 - s;
    }
    w = h = s;
  }
  w = Math.max(w, 1);
  h = Math.max(h, 1);
  const cx = x + w / 2;
  const cy = y + h / 2;
  if (kind === "ellipse") return ellipseSubs(cx, cy, w / 2, h / 2);
  if (kind === "polygon") return polygonSubs(cx, cy, Math.max(w, h) / 2, state.toolOpts.sides);
  if (kind === "star") return starSubs(cx, cy, Math.max(w, h) / 2, state.toolOpts.starPoints, state.toolOpts.inner);
  if (kind === "spiral") return spiralSubs(x0, y0, Math.hypot(x1 - x0, y1 - y0), state.toolOpts.turns);
  return rectSubs(x, y, w, h);
}
function filledStyle() {
  return { fill: paint.fill, stroke: "none", sw: paint.sw, dash: "" };
}
function hitInfo(e) {
  const stack = document.elementsFromPoint(e.clientX, e.clientY);
  for (const el of stack) {
    if (el.dataset?.handle) return { handle: el.dataset.handle };
    if (el.dataset?.gstop) return { gstop: el.dataset.gid };
    if (el.dataset?.which) return { node: el.dataset.node, which: el.dataset.which };
    if (el.dataset?.guide != null) return { guide: Number(el.dataset.guide) };
    const host = el.closest?.("[data-id]");
    if (host) {
      let top = host.dataset.id;
      let node = host;
      while (node && node !== contentG) {
        if (node.dataset?.id) top = node.dataset.id;
        node = node.parentElement;
      }
      const loc = locateAnywhere(top);
      if (loc && loc.layer.visible && !loc.layer.locked) return { id: top };
    }
    if (el.dataset?.page) return { page: true };
  }
  return {};
}
function onPointerDown(e) {
  if (e.button === 2) return;
  menuEl.hidden = true;
  if (e.button === 1 || state.tool === "hand" || state.space) {
    state.gesture = { type: "pan", cx: e.clientX, cy: e.clientY };
    stage.classList.add("panning");
    svg.setPointerCapture?.(e.pointerId);
    return;
  }
  const p = snap(clientToDoc(e));
  const hit = hitInfo(e);
  if (hit.handle && state.tool === "select") return startHandle(e, hit.handle);
  if (hit.gstop) {
    state.gesture = { type: "grad", id: hit.gstop };
    svg.setPointerCapture?.(e.pointerId);
    return;
  }
  if (hit.guide != null) {
    state.gesture = { type: "guide", index: hit.guide };
    beginChange();
    svg.setPointerCapture?.(e.pointerId);
    return;
  }
  if (state.tool === "select") return selectDown(e, p, hit);
  if (state.tool === "node") return nodeDown(e, p, hit);
  if (state.tool === "pen") return penDown(e, p);
  if (state.tool === "pencil") {
    state.gesture = { type: "pencil", pts: [p] };
    svg.setPointerCapture?.(e.pointerId);
    return;
  }
  if (["rect", "ellipse", "polygon", "star", "spiral"].includes(state.tool)) {
    beginChange();
    const it = makePath(shapeSubs(state.tool, p.x, p.y, p.x + 1, p.y + 1, e.shiftKey, e.altKey), filledStyle());
    if (state.tool === "spiral") it.subs = spiralSubs(p.x, p.y, 1, state.toolOpts.turns);
    addItem(it);
    state.gesture = { type: "shape", id: it.id, x0: clientToDoc(e).x, y0: clientToDoc(e).y };
    svg.setPointerCapture?.(e.pointerId);
    renderAll();
    return;
  }
  if (state.tool === "text") return placeText(p);
  if (state.tool === "zoom") return zoomAt(e, e.altKey ? 1 / 1.25 : 1.25);
  if (state.tool === "gradient") return gradientDown(hit);
  if (state.tool === "dropper") return dropColor(hit);
}
function selectDown(e, p, hit) {
  if (hit.id) {
    if (e.shiftKey) {
      if (state.sel.has(hit.id)) state.sel.delete(hit.id);
      else state.sel.add(hit.id);
    } else if (!state.sel.has(hit.id)) state.sel = new Set([hit.id]);
    state.gesture = { type: "move", last: p, alt: e.altKey, copied: false };
    beginChange();
  } else {
    if (!e.shiftKey) state.sel.clear();
    state.gesture = { type: "marquee", x: p.x, y: p.y, cur: p, add: e.shiftKey, base: new Set(state.sel) };
  }
  svg.setPointerCapture?.(e.pointerId);
  renderAll();
  renderInspector();
}
function nodeDown(e, p, hit) {
  const items = selectedItems().filter((it) => it.subs);
  if (hit.node) {
    const [id, si, ni] = hit.node.split(":");
    const loc = locateAnywhere(id);
    if (!loc) return;
    if (!state.sel.has(id)) state.sel = new Set([id]);
    state.nodeSel = [{ id, si: +si, ni: +ni }];
    state.gesture = { type: "node", id, si: +si, ni: +ni, which: hit.which, alt: e.altKey };
    beginChange();
    svg.setPointerCapture?.(e.pointerId);
    renderOverlay();
    renderInspector();
    return;
  }
  if (hit.id && locateAnywhere(hit.id)?.item.subs) {
    state.sel = new Set([hit.id]);
    state.nodeSel = [];
    renderAll();
    renderInspector();
    return;
  }
  if (!items.length && hit.id) {
    const it = locateAnywhere(hit.id)?.item;
    if (it?.kind === "text") return toast("Text stays text until Text → Text to path.");
  }
  toast("Select a path, then drag its nodes.");
}
function penDown(e, p) {
  if (!state.pen) {
    state.pen = { nodes: [gnode(p.x, p.y)], dragging: true };
    beginChange();
  } else {
    const first = state.pen.nodes[0];
    if (state.pen.nodes.length > 2 && Math.hypot(p.x - first.x, p.y - first.y) < 12 / state.view.z) {
      finishPen(true);
      return;
    }
    state.pen.nodes.push(gnode(p.x, p.y));
    state.pen.dragging = true;
  }
  svg.setPointerCapture?.(e.pointerId);
  renderOverlay();
}
function finishPen(close) {
  if (!state.pen || state.pen.nodes.length < 2) {
    state.pen = null;
    endChange();
    renderAll();
    return;
  }
  const sub = { closed: !!close, nodes: state.pen.nodes };
  state.pen = null;
  addItem(makePath([sub], { fill: close ? paint.fill : "none", stroke: paint.stroke, sw: paint.sw }));
  endChange();
  renderAll();
  renderInspector();
}
function placeText(p) {
  mutate(() => {
    addItem({
      id: uid(),
      kind: "text",
      name: nextName("Text"),
      text: "Text",
      x: p.x,
      y: p.y,
      size: 48,
      weight: 600,
      anchor: "start",
      fill: paint.fill,
      rot: 0,
      opacity: 1,
    });
  });
  setTool("select");
  requestAnimationFrame(() => inspector.querySelector("[data-field=text]")?.focus());
}
function gradientDown(hit) {
  const items = selectedItems().filter((it) => it.subs);
  if (!items.length) return toast("Select a path first.");
  mutate(() => {
    for (const it of items) {
      if (!it.fill || typeof it.fill === "string") {
        it.fill = {
          type: "linear",
          x1: 0, y1: 0.5, x2: 1, y2: 0.5,
          stops: [{ o: 0, c: typeof it.fill === "string" && it.fill !== "none" ? it.fill : paint.fill }, { o: 1, c: "#f4f0e6" }],
        };
      }
    }
  });
  if (hit.id) state.gesture = { type: "grad", id: hit.id };
}
function dropColor(hit) {
  let color = state.doc.bg;
  if (hit.id) {
    const it = locateAnywhere(hit.id)?.item;
    if (it) color = typeof it.fill === "string" ? it.fill : it.fill?.stops?.[0]?.c || color;
  }
  if (!color || color === "none") color = state.doc.bg;
  paint.fill = color;
  if (state.sel.size) mutate(() => selectedItems().forEach((it) => { it.fill = color; }));
  else renderInspector();
  toast(`Fill ${color}`);
}
function startHandle(e, name) {
  const items = selectedItems();
  if (!items.length) return;
  const b = unionBBox(items.map(itemBBox));
  const origin = handleOrigin(name, b);
  const p = clientToDoc(e);
  state.gesture = {
    type: name === "rot" ? "rot" : "scale",
    name,
    origin,
    b,
    start: p,
    angle: Math.atan2(p.y - (b.y + b.h / 2), p.x - (b.x + b.w / 2)),
    snap: structuredClone(items),
    live: items,
  };
  beginChange();
  svg.setPointerCapture?.(e.pointerId);
}
function handleOrigin(name, b) {
  const cx = b.x + b.w / 2;
  const cy = b.y + b.h / 2;
  const map = {
    nw: { x: b.x + b.w, y: b.y + b.h },
    n: { x: cx, y: b.y + b.h },
    ne: { x: b.x, y: b.y + b.h },
    e: { x: b.x, y: cy },
    se: { x: b.x, y: b.y },
    s: { x: cx, y: b.y },
    sw: { x: b.x + b.w, y: b.y },
    w: { x: b.x + b.w, y: cy },
  };
  return map[name] || { x: cx, y: cy };
}
function onPointerMove(e) {
  const raw = clientToDoc(e);
  const p = snap(raw);
  coordsEl.textContent = `${Math.round(raw.x)}, ${Math.round(raw.y)}  ·  ${Math.round(state.view.z * 100)}%`;
  if (state.pen?.dragging) {
    const n = state.pen.nodes[state.pen.nodes.length - 1];
    n.outx = p.x;
    n.outy = p.y;
    n.inx = n.x - (p.x - n.x);
    n.iny = n.y - (p.y - n.y);
    n.kind = "symmetric";
    renderOverlay();
    return;
  }
  const g = state.gesture;
  if (!g) {
    if (state.pen && !state.pen.dragging) {
      state.pen.hover = p;
      renderOverlay();
    }
    return;
  }
  if (g.type === "pan") {
    state.view.x += e.clientX - g.cx;
    state.view.y += e.clientY - g.cy;
    g.cx = e.clientX;
    g.cy = e.clientY;
    applyView();
    renderPage();
    drawRulers();
    return;
  }
  if (g.type === "move") {
    if (g.alt && !g.copied && (Math.hypot(p.x - g.last.x, p.y - g.last.y) > 2)) {
      const copies = duplicateItems(selectedItems(), 0, 0);
      state.sel = new Set(copies.map((c) => c.id));
      g.copied = true;
    }
    const dx = p.x - g.last.x;
    const dy = p.y - g.last.y;
    if (dx || dy) selectedItems().forEach((it) => translateItem(it, dx, dy));
    g.last = p;
    renderAll();
    return;
  }
  if (g.type === "marquee") {
    g.cur = raw;
    renderOverlay();
    return;
  }
  if (g.type === "shape") {
    const it = locateAnywhere(g.id)?.item;
    if (!it) return;
    it.subs = shapeSubs(state.tool, g.x0, g.y0, raw.x, raw.y, e.shiftKey, e.altKey);
    renderAll();
    return;
  }
  if (g.type === "pencil") {
    const last = g.pts[g.pts.length - 1];
    if (Math.hypot(raw.x - last.x, raw.y - last.y) > 1.5) {
      g.pts.push(raw);
      renderOverlay();
    }
    return;
  }
  if (g.type === "node") {
    const it = locateAnywhere(g.id)?.item;
    const n = it?.subs?.[g.si]?.nodes?.[g.ni];
    if (!n) return;
    if (g.which === "pt") {
      const dx = p.x - n.x;
      const dy = p.y - n.y;
      n.x = p.x;
      n.y = p.y;
      if (n.inx != null) { n.inx += dx; n.iny += dy; }
      if (n.outx != null) { n.outx += dx; n.outy += dy; }
    } else {
      if (e.altKey) n.kind = "corner";
      setHandle(n, g.which, p.x, p.y);
    }
    renderAll();
    return;
  }
  if (g.type === "scale") {
    applyScaleGesture(g, raw, e.shiftKey);
    renderAll();
    return;
  }
  if (g.type === "rot") {
    const c = { x: g.b.x + g.b.w / 2, y: g.b.y + g.b.h / 2 };
    let a = Math.atan2(raw.y - c.y, raw.x - c.x) - g.angle;
    if (e.shiftKey) a = Math.round(a / (Math.PI / 12)) * (Math.PI / 12);
    g.live.forEach((it, i) => copyGeom(g.snap[i], it));
    g.live.forEach((it) => rotateItem(it, c.x, c.y, a));
    renderAll();
    return;
  }
  if (g.type === "grad") {
    const it = locateAnywhere(g.id)?.item;
    if (!it?.fill || typeof it.fill === "string") return;
    const b = itemBBox(it);
    it.fill.x2 = b.w ? (raw.x - b.x) / b.w : 1;
    it.fill.y2 = b.h ? (raw.y - b.y) / b.h : 0;
    renderAll();
    return;
  }
  if (g.type === "guide") {
    const guide = state.guides[g.index];
    if (!guide) return;
    if (guide.axis === "x") guide.at = raw.x;
    else guide.at = raw.y;
    renderOverlay();
  }
}
function setHandle(n, which, x, y) {
  if (which === "out") { n.outx = x; n.outy = y; }
  else { n.inx = x; n.iny = y; }
  const dx = x - n.x;
  const dy = y - n.y;
  const other = which === "out" ? "in" : "out";
  if (n.kind === "corner") return;
  if (n.kind === "symmetric") {
    n[other + "x"] = n.x - dx;
    n[other + "y"] = n.y - dy;
    return;
  }
  const ox = n[other + "x"];
  const oy = n[other + "y"];
  const len = ox == null ? Math.hypot(dx, dy) : Math.hypot(ox - n.x, oy - n.y);
  const l = Math.hypot(dx, dy) || 1;
  n[other + "x"] = n.x - (dx / l) * len;
  n[other + "y"] = n.y - (dy / l) * len;
}
function applyScaleGesture(g, raw, shift) {
  const o = g.origin;
  let sx = (raw.x - o.x) / ((g.start.x - o.x) || 1);
  let sy = (raw.y - o.y) / ((g.start.y - o.y) || 1);
  if (g.name === "n" || g.name === "s") sx = 1;
  if (g.name === "e" || g.name === "w") sy = 1;
  if (shift) {
    const s = Math.max(Math.abs(sx), Math.abs(sy)) || 1;
    sx = Math.sign(sx || 1) * s;
    sy = Math.sign(sy || 1) * s;
    if (g.name === "n" || g.name === "s") sx = sy;
    if (g.name === "e" || g.name === "w") sy = sx;
  }
  g.live.forEach((it, i) => copyGeom(g.snap[i], it));
  g.live.forEach((it) => scaleItem(it, o, sx, sy));
}
function scaleItem(it, o, sx, sy) {
  const fn = (x, y) => ({ x: o.x + (x - o.x) * sx, y: o.y + (y - o.y) * sy });
  if (it.kind === "group") it.children.forEach((c) => scaleItem(c, o, sx, sy));
  else if (it.kind === "text") {
    const p = fn(it.x, it.y);
    it.x = p.x;
    it.y = p.y;
    it.size = Math.max(1, (it.size || 32) * Math.abs(sy));
  } else mapSubs(it.subs, fn);
}
function rotateItem(it, cx, cy, a) {
  const fn = (x, y) => {
    const dx = x - cx;
    const dy = y - cy;
    const c = Math.cos(a);
    const s = Math.sin(a);
    return { x: cx + dx * c - dy * s, y: cy + dx * s + dy * c };
  };
  if (it.kind === "group") it.children.forEach((c) => rotateItem(c, cx, cy, a));
  else if (it.kind === "text") {
    const p = fn(it.x, it.y);
    it.x = p.x;
    it.y = p.y;
    it.rot = (it.rot || 0) + (a * 180) / Math.PI;
  } else mapSubs(it.subs, fn);
}
function onPointerUp(e) {
  const g = state.gesture;
  stage.classList.remove("panning");
  if (state.pen) {
    state.pen.dragging = false;
    const n = state.pen.nodes[state.pen.nodes.length - 1];
    if (n && n.outx != null && Math.hypot(n.outx - n.x, n.outy - n.y) < 2) {
      n.outx = n.outy = n.inx = n.iny = null;
      n.kind = "corner";
    }
    renderOverlay();
  }
  if (!g) return;
  if (g.type === "marquee") {
    const x = Math.min(g.x, g.cur.x);
    const y = Math.min(g.y, g.cur.y);
    const w = Math.abs(g.cur.x - g.x);
    const h = Math.abs(g.cur.y - g.y);
    const next = g.add ? new Set(g.base) : new Set();
    if (w > 3 || h > 3) {
      for (const it of activeLayer().items) {
        if (!activeLayer().visible || activeLayer().locked) break;
        const b = itemBBox(it);
        if (b.x < x + w && b.x + b.w > x && b.y < y + h && b.y + b.h > y) next.add(it.id);
      }
    }
    state.sel = next;
  }
  if (g.type === "pencil" && g.pts.length > 1) {
    paperReady();
    const path = new paper.Path({ segments: g.pts.map((pt) => [pt.x, pt.y]), insert: true });
    path.simplify(3);
    const subs = paperToSubs(path);
    path.remove();
    if (subs.length && subs[0].nodes.length > 1) {
      beginChange();
      addItem(makePath(subs, { fill: "none", stroke: paint.stroke, sw: paint.sw, cap: "round", join: "round" }));
    }
  }
  if (g.type === "guide") {
    const guide = state.guides[g.index];
    const rect = stage.getBoundingClientRect();
    if (guide && (e.clientX < rect.left || e.clientY < rect.top)) state.guides.splice(g.index, 1);
  }
  state.gesture = null;
  endChange();
  renderAll();
  renderInspector();
}
function onDoubleClick(e) {
  if (state.tool !== "node") return;
  const p = clientToDoc(e);
  const items = selectedItems().filter((it) => it.subs);
  let best = null;
  for (const it of items) {
    it.subs.forEach((sub, si) => {
      const n = sub.nodes.length;
      const last = sub.closed ? n : n - 1;
      for (let i = 0; i < last; i++) {
        const a = sub.nodes[i];
        const b = sub.nodes[(i + 1) % n];
        const c = segmentControls(a, b);
        const hit = closestOnCubic(c[0], c[1], c[2], c[3], p);
        if (!best || hit.dist < best.hit.dist) best = { it, si, i, hit, a, b, n, closed: sub.closed };
      }
    });
  }
  if (!best || best.hit.dist > 10 / state.view.z) return;
  mutate(() => {
    const sp = splitCubic(
      segmentControls(best.a, best.b)[0],
      segmentControls(best.a, best.b)[1],
      segmentControls(best.a, best.b)[2],
      segmentControls(best.a, best.b)[3],
      best.hit.t,
    );
    const left = sp.left;
    const right = sp.right;
    best.a.outx = Math.hypot(left[1].x - best.a.x, left[1].y - best.a.y) < 0.2 ? null : left[1].x;
    best.a.outy = best.a.outx == null ? null : left[1].y;
    const mid = gnode(left[3].x, left[3].y, {
      inx: Math.hypot(left[2].x - left[3].x, left[2].y - left[3].y) < 0.2 ? null : left[2].x,
      iny: null,
      outx: Math.hypot(right[1].x - right[0].x, right[1].y - right[0].y) < 0.2 ? null : right[1].x,
      outy: null,
      kind: "smooth",
    });
    if (mid.inx != null) mid.iny = left[2].y;
    if (mid.outx != null) mid.outy = right[1].y;
    best.b.inx = Math.hypot(right[2].x - best.b.x, right[2].y - best.b.y) < 0.2 ? null : right[2].x;
    best.b.iny = best.b.inx == null ? null : right[2].y;
    const sub = best.it.subs[best.si];
    const next = (best.i + 1) % sub.nodes.length;
    if (best.closed && next === 0) sub.nodes.push(mid);
    else sub.nodes.splice(next, 0, mid);
  });
}
function duplicateItems(items, dx, dy) {
  const copies = [];
  for (const it of items) {
    const loc = locateAnywhere(it.id);
    if (!loc) continue;
    const copy = structuredClone(it);
    reId(copy);
    translateItem(copy, dx, dy);
    loc.parent.splice(loc.index + 1, 0, copy);
    copies.push(copy);
  }
  return copies;
}
function reId(it) {
  it.id = uid();
  if (it.kind === "group") it.children.forEach(reId);
}
function del() {
  if (state.tool === "node" && state.nodeSel.length) {
    mutate(() => {
      for (const ref of state.nodeSel) {
        const it = locateAnywhere(ref.id)?.item;
        const sub = it?.subs?.[ref.si];
        if (!sub) continue;
        sub.nodes.splice(ref.ni, 1);
        if (sub.nodes.length < 2) it.subs.splice(ref.si, 1);
        if (!it.subs.length) {
          const loc = locateAnywhere(it.id);
          loc?.parent.splice(loc.index, 1);
          state.sel.delete(it.id);
        }
      }
      state.nodeSel = [];
    });
    return;
  }
  mutate(() => {
    for (const id of [...state.sel]) {
      const loc = locateAnywhere(id);
      if (loc) loc.parent.splice(loc.index, 1);
    }
    state.sel.clear();
  });
}
function duplicate() {
  mutate(() => {
    const copies = duplicateItems(selectedItems(), 16, 16);
    state.sel = new Set(copies.map((c) => c.id));
  });
}
function group() {
  const items = selectedItems();
  if (items.length < 2) return toast("Select two or more objects.");
  const loc0 = locateAnywhere(items[0].id);
  if (!items.every((it) => locateAnywhere(it.id)?.parent === loc0.parent)) return toast("Group objects on the same layer.");
  mutate(() => {
    const parent = loc0.parent;
    const indexes = items.map((it) => parent.indexOf(it)).sort((a, b) => a - b);
    const kids = indexes.map((i) => parent[i]);
    for (let i = indexes.length - 1; i >= 0; i--) parent.splice(indexes[i], 1);
    const g = { id: uid(), kind: "group", name: nextName("Group"), opacity: 1, children: kids };
    parent.splice(indexes[0], 0, g);
    state.sel = new Set([g.id]);
  });
}
function ungroup() {
  mutate(() => {
    const next = new Set();
    for (const it of selectedItems()) {
      if (it.kind !== "group") continue;
      const loc = locateAnywhere(it.id);
      loc.parent.splice(loc.index, 1, ...it.children);
      it.children.forEach((c) => next.add(c.id));
    }
    if (next.size) state.sel = next;
  });
}
function orderZ(mode) {
  mutate(() => {
    const grouped = new Map();
    for (const it of selectedItems()) {
      const loc = locateAnywhere(it.id);
      if (!loc) continue;
      if (!grouped.has(loc.parent)) grouped.set(loc.parent, []);
      grouped.get(loc.parent).push(loc);
    }
    for (const [parent, locs] of grouped) {
      const idxs = locs.map((l) => l.index).sort((a, b) => a - b);
      const items = idxs.map((i) => parent[i]);
      for (let i = idxs.length - 1; i >= 0; i--) parent.splice(idxs[i], 1);
      if (mode === "front") parent.push(...items);
      else if (mode === "back") parent.unshift(...items);
      else if (mode === "raise") {
        const at = Math.min(parent.length, idxs[0] + 1);
        parent.splice(at, 0, ...items);
      } else {
        const at = Math.max(0, idxs[0] - 1);
        parent.splice(at, 0, ...items);
      }
    }
  });
}
function align(mode) {
  const items = selectedItems();
  const page = mode.startsWith("page-");
  const key = page ? mode.slice(5) : mode;
  if (!items.length) return;
  if (!page && items.length < 2) return toast("Select two or more objects.");
  mutate(() => {
    const boxes = items.map(itemBBox);
    const u = page ? { x: 0, y: 0, w: state.doc.w, h: state.doc.h } : unionBBox(boxes);
    items.forEach((it, i) => {
      const b = boxes[i];
      let dx = 0;
      let dy = 0;
      if (key === "left") dx = u.x - b.x;
      if (key === "cx") dx = u.x + u.w / 2 - (b.x + b.w / 2);
      if (key === "right") dx = u.x + u.w - (b.x + b.w);
      if (key === "top") dy = u.y - b.y;
      if (key === "cy") dy = u.y + u.h / 2 - (b.y + b.h / 2);
      if (key === "bottom") dy = u.y + u.h - (b.y + b.h);
      translateItem(it, dx, dy);
    });
  });
}
function distribute(axis) {
  const items = selectedItems();
  if (items.length < 3) return toast("Select three or more objects.");
  mutate(() => {
    const rows = items.map((it) => ({ it, b: itemBBox(it) }));
    rows.sort((a, b) => (axis === "x" ? a.b.x - b.b.x : a.b.y - b.b.y));
    const first = rows[0].b;
    const last = rows[rows.length - 1].b;
    const span = axis === "x" ? last.x + last.w - first.x : last.y + last.h - first.y;
    const size = rows.reduce((s, r) => s + (axis === "x" ? r.b.w : r.b.h), 0);
    const gap = (span - size) / (rows.length - 1);
    let cursor = axis === "x" ? first.x : first.y;
    for (const r of rows) {
      const pos = axis === "x" ? r.b.x : r.b.y;
      const delta = cursor - pos;
      translateItem(r.it, axis === "x" ? delta : 0, axis === "y" ? delta : 0);
      cursor += (axis === "x" ? r.b.w : r.b.h) + gap;
    }
  });
}
function compoundFrom(d) {
  paperReady();
  const item = new paper.CompoundPath(d);
  item.fillColor = "black";
  return item;
}
function boolOp(name) {
  const items = selectedItems().filter((it) => it.subs);
  if (items.length < 2) return toast("Select two or more paths.");
  mutate(() => {
    const ordered = items
      .map((it) => ({ it, z: locateAnywhere(it.id)?.index ?? 0 }))
      .sort((a, b) => a.z - b.z)
      .map((r) => r.it);
    let list = ordered;
    if (name === "subtract" || name === "divide") list = [ordered[ordered.length - 1], ...ordered.slice(0, -1)];
    let acc = compoundFrom(subsToD(list[0].subs));
    for (let i = 1; i < list.length; i++) {
      const other = compoundFrom(subsToD(list[i].subs));
      const next = acc[name](other);
      if (!next) {
        acc.remove();
        other.remove();
        toast("Those paths do not overlap.");
        return;
      }
      if (acc !== next) acc.remove();
      other.remove();
      acc = next;
    }
    const subs = paperToSubs(acc);
    acc.remove();
    if (!subs.length) return toast("That boolean left nothing.");
    const loc = locateAnywhere(list[list.length - 1].id);
    for (const it of list) {
      const hit = locateAnywhere(it.id);
      if (hit) hit.parent.splice(hit.index, 1);
    }
    const made = name === "divide"
      ? subs.map((sub) => makePath([sub], list[0]))
      : [makePath(subs, list[0])];
    made.forEach((m) => {
      m.fill = list[0].fill;
      m.stroke = list[0].stroke;
    });
    loc.parent.splice(Math.min(loc.index, loc.parent.length), 0, ...made);
    state.sel = new Set(made.map((m) => m.id));
  });
}
function flipSel(axis) {
  const items = selectedItems();
  if (!items.length) return toast("Select an object.");
  const b = unionBBox(items.map(itemBBox));
  const o = { x: b.x + b.w / 2, y: b.y + b.h / 2 };
  mutate(() => items.forEach((it) => scaleItem(it, o, axis === "h" ? -1 : 1, axis === "v" ? -1 : 1)));
}
function combineSel() {
  const items = selectedItems().filter((it) => it.subs);
  if (items.length < 2) return toast("Select two or more paths.");
  mutate(() => {
    const subs = items.flatMap((it) => structuredClone(it.subs));
    const loc = locateAnywhere(items[items.length - 1].id);
    for (const it of items) {
      const hit = locateAnywhere(it.id);
      if (hit) hit.parent.splice(hit.index, 1);
    }
    const made = makePath(subs, items[0]);
    loc.parent.splice(Math.min(loc.index, loc.parent.length), 0, made);
    state.sel = new Set([made.id]);
  });
}
function breakApart() {
  const items = selectedItems().filter((it) => it.subs && it.subs.length > 1);
  if (!items.length) return toast("Select a path with more than one subpath.");
  mutate(() => {
    const next = new Set();
    for (const it of [...items]) {
      const loc = locateAnywhere(it.id);
      if (!loc) continue;
      const parts = it.subs.map((sub) => makePath([structuredClone(sub)], it));
      loc.parent.splice(loc.index, 1, ...parts);
      parts.forEach((p) => next.add(p.id));
    }
    state.sel = next;
  });
}
function closeSel() {
  const items = selectedItems().filter((it) => it.subs);
  if (!items.length) return toast("Select an open path.");
  mutate(() => {
    for (const it of items) {
      for (const sub of it.subs) if (!sub.closed && sub.nodes.length > 2) sub.closed = true;
    }
  });
}
async function offsetAsk(sign) {
  const data = await ask({
    title: sign > 0 ? "Outset" : "Inset",
    body: `<label>Distance <input name="d" type="number" min="0.5" step="0.5" value="8"></label>`,
    ok: sign > 0 ? "Outset" : "Inset",
  });
  if (!data) return;
  offsetSel(sign * Math.max(0.5, Math.abs(num(data.d, 8))));
}
function offsetSel(delta) {
  const items = selectedItems().filter((it) => it.subs);
  if (!items.length) return toast("Select a path.");
  mutate(() => {
    paperReady();
    for (const it of items) {
      const compound = new paper.CompoundPath(subsToD(it.subs));
      compound.fillColor = "black";
      compound.flatten(1.25);
      const children = compound.children?.length ? [...compound.children] : [compound];
      const subs = [];
      for (const c of children) {
        const pts = c.segments.map((s) => ({ x: s.point.x, y: s.point.y }));
        if (pts.length < 2) continue;
        const off = offsetPoly(pts, delta, !!c.closed);
        subs.push({ closed: !!c.closed, nodes: off.map((pt) => gnode(pt.x, pt.y)) });
      }
      compound.remove();
      if (subs.length) it.subs = subs;
    }
  });
}
function strokeToPath() {
  const items = selectedItems().filter((it) => it.subs && (it.sw || 0) > 0 && it.stroke && it.stroke !== "none");
  if (!items.length) return toast("Select a stroked path.");
  mutate(() => {
    paperReady();
    for (const it of items) {
      const sw = it.sw || 1;
      const compound = new paper.CompoundPath(subsToD(it.subs));
      compound.flatten(1);
      const children = compound.children?.length ? [...compound.children] : [compound];
      const subs = [];
      for (const c of children) {
        const pts = c.segments.map((s) => ({ x: s.point.x, y: s.point.y }));
        const a = offsetPoly(pts, sw / 2, false);
        const b = offsetPoly(pts, -sw / 2, false).reverse();
        if (c.closed) {
          subs.push({ closed: true, nodes: offsetPoly(pts, sw / 2, true).map((p) => gnode(p.x, p.y)) });
          subs.push({ closed: true, nodes: offsetPoly(pts, -sw / 2, true).reverse().map((p) => gnode(p.x, p.y)) });
        } else {
          subs.push({ closed: true, nodes: [...a, ...b].map((p) => gnode(p.x, p.y)) });
        }
      }
      compound.remove();
      it.subs = subs;
      it.fill = it.stroke;
      it.stroke = "none";
      it.sw = 0;
    }
  });
}
function simplifySel() {
  mutate(() => {
    paperReady();
    for (const it of selectedItems()) {
      if (!it.subs) continue;
      const path = new paper.CompoundPath(subsToD(it.subs));
      path.simplify(2.5);
      const subs = paperToSubs(path);
      path.remove();
      if (subs.length) it.subs = subs;
    }
  });
}
function reverseSel() {
  mutate(() => {
    for (const it of selectedItems()) {
      if (!it.subs) continue;
      for (const sub of it.subs) {
        sub.nodes.reverse();
        for (const n of sub.nodes) {
          const ix = n.inx, iy = n.iny;
          n.inx = n.outx;
          n.iny = n.outy;
          n.outx = ix;
          n.outy = iy;
        }
      }
    }
  });
}
function reversedNodes(nodes) {
  return nodes.map((n) => {
    const c = structuredClone(n);
    const ix = c.inx;
    const iy = c.iny;
    c.inx = c.outx;
    c.iny = c.outy;
    c.outx = ix;
    c.outy = iy;
    return c;
  }).reverse();
}
function joinSel() {
  const open = [];
  for (const it of selectedItems()) {
    if (!it.subs) continue;
    for (const sub of it.subs) if (!sub.closed && sub.nodes.length > 1) open.push({ it, sub });
  }
  if (open.length < 2) return toast("Select two open paths.");
  mutate(() => {
    const a = open[0];
    const b = open[1];
    const dist = (p, q) => Math.hypot(p.x - q.x, p.y - q.y);
    const a0 = a.sub.nodes[0];
    const a1 = a.sub.nodes[a.sub.nodes.length - 1];
    const b0 = b.sub.nodes[0];
    const b1 = b.sub.nodes[b.sub.nodes.length - 1];
    const pairs = [
      [dist(a1, b0), false, false],
      [dist(a1, b1), false, true],
      [dist(a0, b0), true, false],
      [dist(a0, b1), true, true],
    ].sort((p, q) => p[0] - q[0]);
    const flipA = pairs[0][1];
    const flipB = pairs[0][2];
    let na = flipA ? reversedNodes(a.sub.nodes) : a.sub.nodes.map((n) => structuredClone(n));
    let nb = flipB ? reversedNodes(b.sub.nodes) : b.sub.nodes.map((n) => structuredClone(n));
    const end = na[na.length - 1];
    const start = nb[0];
    if (Math.hypot(end.x - start.x, end.y - start.y) < 0.75) {
      if (start.outx != null) {
        end.outx = start.outx;
        end.outy = start.outy;
      }
      nb = nb.slice(1);
    }
    a.sub.nodes = na.concat(nb);
    if (a.sub !== b.sub) b.it.subs = b.it.subs.filter((s) => s !== b.sub);
    if (!b.it.subs.length && a.it !== b.it) {
      const loc = locateAnywhere(b.it.id);
      loc?.parent.splice(loc.index, 1);
      state.sel.delete(b.it.id);
    }
  });
}
function breakSel() {
  if (!state.nodeSel.length) return toast("Select a node on an open or closed path.");
  mutate(() => {
    const ref = state.nodeSel[0];
    const it = locateAnywhere(ref.id)?.item;
    const sub = it?.subs?.[ref.si];
    if (!sub || sub.nodes.length < 3) return;
    const nodes = sub.nodes;
    if (sub.closed) {
      const spun = nodes.slice(ref.ni).concat(nodes.slice(0, ref.ni));
      sub.closed = false;
      sub.nodes = spun;
      return;
    }
    if (ref.ni === 0 || ref.ni === nodes.length - 1) return toast("Pick a node between the ends.");
    const right = { closed: false, nodes: nodes.slice(ref.ni).map((n) => structuredClone(n)) };
    sub.nodes = nodes.slice(0, ref.ni + 1);
    it.subs.push(right);
  });
}
function setNodeKind(kind) {
  mutate(() => {
    for (const ref of state.nodeSel) {
      const n = locateAnywhere(ref.id)?.item?.subs?.[ref.si]?.nodes?.[ref.ni];
      if (!n) continue;
      n.kind = kind;
      if (kind === "corner") continue;
      if (n.outx == null && n.inx == null) {
        n.outx = n.x + 24;
        n.outy = n.y;
        n.inx = n.x - 24;
        n.iny = n.y;
      } else if (n.outx == null) {
        n.outx = n.x - (n.inx - n.x);
        n.outy = n.y - (n.iny - n.y);
      } else if (n.inx == null) {
        n.inx = n.x - (n.outx - n.x);
        n.iny = n.y - (n.outy - n.y);
      }
      if (kind === "symmetric" && n.outx != null) {
        n.inx = n.x - (n.outx - n.x);
        n.iny = n.y - (n.outy - n.y);
      }
    }
  });
}
async function textToPath() {
  const texts = selectedItems().filter((it) => it.kind === "text");
  if (!texts.length) return toast("Select some text.");
  toast("Converting text…");
  if (!fontP) fontP = opentype.load(new URL("./fonts/source-sans-3-400.ttf", import.meta.url).href);
  const font = await fontP;
  mutate(() => {
    for (const t of texts) {
      const path = font.getPath(t.text || "", 0, 0, t.size || 32);
      const subs = parsePath(path.toPathData(2));
      const rad = ((t.rot || 0) * Math.PI) / 180;
      mapSubs(subs, (x, y) => {
        const c = Math.cos(rad);
        const s = Math.sin(rad);
        return { x: t.x + x * c - y * s, y: t.y + x * s + y * c };
      });
      const loc = locateAnywhere(t.id);
      const made = makePath(subs, { fill: t.fill, stroke: "none", sw: 0, opacity: t.opacity });
      made.name = t.name;
      loc.parent.splice(loc.index, 1, made);
      state.sel.delete(t.id);
      state.sel.add(made.id);
    }
  });
}
function putOnPath() {
  const texts = selectedItems().filter((it) => it.kind === "text");
  const paths = selectedItems().filter((it) => it.subs);
  if (texts.length !== 1 || paths.length !== 1) return toast("Select one text object and one path.");
  mutate(() => { texts[0].onPath = subsToD(paths[0].subs); });
}
function takeOffPath() {
  mutate(() => selectedItems().forEach((it) => { if (it.kind === "text") it.onPath = ""; }));
}
function applyStyle(patch) {
  const items = selectedItems();
  if (!items.length) {
    Object.assign(paint, patch);
    renderInspector();
    return;
  }
  mutate(() => items.forEach((it) => Object.assign(it, patch)));
}
function toSvg() {
  const d = state.doc;
  const body = d.layers.filter((l) => l.visible).map((l) => l.items.map(itemMarkup).join("")).join("");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="${d.w}" height="${d.h}" viewBox="0 0 ${d.w} ${d.h}">\n<rect width="100%" height="100%" fill="${esc(d.bg)}"/>\n${defs.innerHTML}\n${body}\n</svg>\n`;
}
function fileBase() {
  return (state.doc.name || "drawing").replace(/[^\w\- ]+/g, "").trim() || "drawing";
}
function download(name, blob) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1500);
}
function saveSvg() {
  download(`${fileBase()}.svg`, new Blob([toSvg()], { type: "image/svg+xml" }));
}
function exportPng() {
  const xml = toSvg();
  const url = URL.createObjectURL(new Blob([xml], { type: "image/svg+xml" }));
  const img = new Image();
  img.onload = () => {
    const scale = 2;
    const c = document.createElement("canvas");
    c.width = Math.round(state.doc.w * scale);
    c.height = Math.round(state.doc.h * scale);
    const ctx = c.getContext("2d");
    ctx.fillStyle = state.doc.bg;
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.drawImage(img, 0, 0, c.width, c.height);
    c.toBlob((blob) => {
      if (blob) download(`${fileBase()}.png`, blob);
      URL.revokeObjectURL(url);
    });
  };
  img.onerror = () => toast("Could not rasterize this page.");
  img.src = url;
}
function identity() { return [1, 0, 0, 1, 0, 0]; }
function mul(a, b) {
  return [
    a[0] * b[0] + a[2] * b[1],
    a[1] * b[0] + a[3] * b[1],
    a[0] * b[2] + a[2] * b[3],
    a[1] * b[2] + a[3] * b[3],
    a[0] * b[4] + a[2] * b[5] + a[4],
    a[1] * b[4] + a[3] * b[5] + a[5],
  ];
}
function parseXf(str) {
  let m = identity();
  if (!str) return m;
  const re = /(matrix|translate|scale|rotate)\s*\(([^)]*)\)/g;
  let mm;
  while ((mm = re.exec(str))) {
    const nums = mm[2].split(/[\s,]+/).filter(Boolean).map(Number);
    let t = identity();
    if (mm[1] === "matrix" && nums.length >= 6) t = nums.slice(0, 6);
    else if (mm[1] === "translate") t = [1, 0, 0, 1, nums[0] || 0, nums[1] || 0];
    else if (mm[1] === "scale") t = [nums[0] || 1, 0, 0, nums.length > 1 ? nums[1] : nums[0] || 1, 0, 0];
    else if (mm[1] === "rotate") {
      const a = ((nums[0] || 0) * Math.PI) / 180;
      const c = Math.cos(a);
      const s = Math.sin(a);
      const cx = nums[1] || 0;
      const cy = nums[2] || 0;
      const rot = [c, s, -s, c, 0, 0];
      t = mul(mul([1, 0, 0, 1, cx, cy], rot), [1, 0, 0, 1, -cx, -cy]);
    }
    m = mul(t, m);
  }
  return m;
}
function applyMat(m, x, y) {
  return { x: m[0] * x + m[2] * y + m[4], y: m[1] * x + m[3] * y + m[5] };
}
function readPres(el) {
  const fill = el.getAttribute("fill");
  const stroke = el.getAttribute("stroke");
  const sw = parseFloat(el.getAttribute("stroke-width") || "");
  return {
    fill: fill == null ? "#111111" : fill,
    stroke: stroke == null ? "none" : stroke,
    sw: Number.isFinite(sw) ? sw : 1,
    dash: el.getAttribute("stroke-dasharray") || "",
    opacity: parseFloat(el.getAttribute("opacity") || "1") || 1,
  };
}
function importElement(el, m, bucket) {
  if (el.nodeType !== 1) return;
  const tag = el.localName;
  const next = mul(parseXf(el.getAttribute("transform")), m);
  if (tag === "g" || tag === "svg" || tag === "a") {
    [...el.children].forEach((c) => importElement(c, next, bucket));
    return;
  }
  const pres = readPres(el);
  const push = (subs, extra) => {
    if (!subs?.length) return;
    mapSubs(subs, (x, y) => applyMat(next, x, y));
    bucket.push(makePath(subs, { ...pres, ...extra }));
  };
  if (tag === "path") push(parsePath(el.getAttribute("d") || ""));
  else if (tag === "rect") {
    const x = +el.getAttribute("x") || 0;
    const y = +el.getAttribute("y") || 0;
    push(rectSubs(x, y, +el.getAttribute("width") || 0, +el.getAttribute("height") || 0));
  } else if (tag === "ellipse" || tag === "circle") {
    const rx = tag === "circle" ? +el.getAttribute("r") || 0 : +el.getAttribute("rx") || 0;
    const ry = tag === "circle" ? rx : +el.getAttribute("ry") || 0;
    push(ellipseSubs(+el.getAttribute("cx") || 0, +el.getAttribute("cy") || 0, rx, ry));
  } else if (tag === "polygon" || tag === "polyline") {
    const nums = (el.getAttribute("points") || "").trim().split(/[\s,]+/).map(Number);
    const nodes = [];
    for (let i = 0; i + 1 < nums.length; i += 2) nodes.push(gnode(nums[i], nums[i + 1]));
    push([{ closed: tag === "polygon", nodes }]);
  } else if (tag === "line") {
    push([{
      closed: false,
      nodes: [gnode(+el.getAttribute("x1") || 0, +el.getAttribute("y1") || 0), gnode(+el.getAttribute("x2") || 0, +el.getAttribute("y2") || 0)],
    }]);
  } else if (tag === "text") {
    const p = applyMat(next, +el.getAttribute("x") || 0, +el.getAttribute("y") || 0);
    bucket.push({
      id: uid(),
      kind: "text",
      name: nextName("Text"),
      text: (el.textContent || "Text").trim() || "Text",
      x: p.x,
      y: p.y,
      size: parseFloat(el.getAttribute("font-size") || "32") || 32,
      weight: 600,
      anchor: el.getAttribute("text-anchor") || "start",
      fill: pres.fill,
      rot: 0,
      opacity: pres.opacity,
    });
  }
}
function importSvgText(text) {
  const doc = new DOMParser().parseFromString(text, "image/svg+xml");
  if (doc.querySelector("parsererror")) return toast("That file is not SVG.");
  const svgEl = doc.querySelector("svg");
  if (!svgEl) return toast("No SVG root.");
  const bucket = [];
  importElement(svgEl, identity(), bucket);
  if (!bucket.length) return toast("Nothing importable in that SVG.");
  mutate(() => {
    bucket.forEach(addItem);
    state.sel = new Set(bucket.map((b) => b.id));
  });
  toast(`Imported ${bucket.length} object${bucket.length === 1 ? "" : "s"}.`);
}
function openSvg() {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".svg,image/svg+xml";
  input.onchange = () => {
    const file = input.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => importSvgText(String(reader.result || ""));
    reader.readAsText(file);
  };
  input.click();
}
function copy() {
  state.clip = selectedItems().map((it) => structuredClone(it));
  try { navigator.clipboard?.writeText(toSvg()); } catch { /* ignore */ }
  toast(state.clip.length ? "Copied." : "Nothing selected.");
}
function cut() {
  copy();
  del();
}
function paste() {
  if (!state.clip?.length) return toast("Clipboard is empty.");
  mutate(() => {
    const copies = state.clip.map((it) => {
      const copy = structuredClone(it);
      reId(copy);
      translateItem(copy, 16, 16);
      return copy;
    });
    state.clip = structuredClone(copies);
    copies.forEach((c) => activeLayer().items.push(c));
    state.sel = new Set(copies.map((c) => c.id));
  });
}
function ask(opts) {
  dialog.hidden = false;
  dialogTitle.textContent = opts.title;
  dialogBody.innerHTML = opts.body;
  dialogOk.textContent = opts.ok || "OK";
  dialogCancel.hidden = !!opts.hideCancel;
  return new Promise((resolve) => {
    const cleanup = () => {
      dialogForm.removeEventListener("submit", onSubmit);
      dialogCancel.removeEventListener("click", onCancel);
      dialog.hidden = true;
    };
    const onSubmit = (e) => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(dialogForm).entries());
      cleanup();
      resolve(data);
    };
    const onCancel = () => { cleanup(); resolve(null); };
    dialogForm.addEventListener("submit", onSubmit);
    dialogCancel.addEventListener("click", onCancel);
    dialogBody.querySelector("input")?.focus();
  });
}
async function newDoc() {
  if (countItems()) {
    const ok = await ask({ title: "New page", body: "<p>Replace the drawing on this page?</p>", ok: "Replace" });
    if (!ok) return;
  }
  const size = await ask({
    title: "Page size",
    body: `<label>Width <input name="w" type="number" min="32" value="960"></label><label>Height <input name="h" type="number" min="32" value="640"></label>`,
    ok: "Create",
  });
  if (!size) return;
  state.doc = blankDoc(Math.max(32, Number(size.w) || 960), Math.max(32, Number(size.h) || 640));
  state.sel.clear();
  state.guides = [];
  state.undo = [];
  state.redo = [];
  docName.value = state.doc.name;
  fitPage();
  renderInspector();
  saveSoon();
}
function selectAll() {
  state.sel = new Set(activeLayer().items.map((it) => it.id));
  renderAll();
  renderInspector();
}
function setTool(id) {
  if (state.pen) finishPen(false);
  state.tool = id;
  stage.classList.toggle("tool-select", id === "select");
  stage.classList.toggle("tool-hand", id === "hand");
  for (const btn of toolsEl.querySelectorAll(".tool")) btn.setAttribute("aria-pressed", btn.dataset.tool === id ? "true" : "false");
  hintEl.textContent = HINTS[id] || "";
  renderOverlay();
  renderInspector();
}
function renderChrome() {
  menusEl.innerHTML = "";
  const menus = {
    File: [["New page", newDoc], ["Open SVG…", openSvg], ["Save SVG", saveSvg], ["Export PNG", exportPng]],
    Edit: [["Undo", undo], ["Redo", redo], ["Cut", cut], ["Copy", copy], ["Paste", paste], ["Duplicate", duplicate], ["Delete", del], ["Select all", selectAll]],
    Object: [["Group", group], ["Ungroup", ungroup], ["Flip horizontal", () => flipSel("h")], ["Flip vertical", () => flipSel("v")], ["Raise", () => orderZ("raise")], ["Lower", () => orderZ("lower")], ["To front", () => orderZ("front")], ["To back", () => orderZ("back")]],
    Path: [
      ["Union", () => boolOp("unite")],
      ["Difference", () => boolOp("subtract")],
      ["Intersection", () => boolOp("intersect")],
      ["Exclusion", () => boolOp("exclude")],
      ["Division", () => boolOp("divide")],
      ["Combine", combineSel],
      ["Break apart", breakApart],
      ["Close", closeSel],
      ["Outset…", () => offsetAsk(1)],
      ["Inset…", () => offsetAsk(-1)],
      ["Stroke to path", strokeToPath],
      ["Simplify", simplifySel],
      ["Reverse", reverseSel],
      ["Join ends", joinSel],
      ["Break at node", breakSel],
    ],
    Text: [["Text to path", textToPath], ["Put on path", putOnPath], ["Take off path", takeOffPath]],
    View: [["Zoom in", () => zoomAt({ clientX: innerWidth / 2, clientY: innerHeight / 2 }, 1.2)], ["Zoom out", () => zoomAt({ clientX: innerWidth / 2, clientY: innerHeight / 2 }, 1 / 1.2)], ["Fit page", fitPage], ["Fit selection", fitSel], ["Grid", () => mutate(() => { state.doc.showGrid = !state.doc.showGrid; })], ["Snap", () => { state.doc.snap = !state.doc.snap; toast(state.doc.snap ? "Snap on" : "Snap off"); renderInspector(); }]],
  };
  for (const [name, items] of Object.entries(menus)) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "menu-btn";
    btn.textContent = name;
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const rect = btn.getBoundingClientRect();
      menuEl.innerHTML = items.map((item, i) => `<button type="button" data-i="${i}">${item[0]}</button>`).join("");
      menuEl.style.left = `${rect.left}px`;
      menuEl.style.top = `${rect.bottom + 4}px`;
      menuEl.hidden = false;
      menuEl.onclick = (ev) => {
        const b = ev.target.closest("button");
        if (!b) return;
        menuEl.hidden = true;
        items[+b.dataset.i][1]();
      };
    });
    menusEl.appendChild(btn);
  }
  toolsEl.innerHTML = TOOLS.map(([id, key, label, d]) =>
    `<button type="button" class="tool" data-tool="${id}" aria-pressed="${id === state.tool}" title="${label} (${key})" aria-label="${label}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="${d}"/></svg></button>`,
  ).join("");
  toolsEl.onclick = (e) => {
    const btn = e.target.closest(".tool");
    if (btn) setTool(btn.dataset.tool);
  };
}
function num(v, fallback) {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : fallback;
}
function objectRows() {
  const rows = [];
  const visit = (items, depth) => {
    for (let i = items.length - 1; i >= 0; i--) {
      const it = items[i];
      rows.push({ it, depth });
      if (it.kind === "group") visit(it.children, depth + 1);
    }
  };
  visit(activeLayer().items, 0);
  return rows;
}
function renderInspector() {
  const items = selectedItems();
  const one = items.length === 1 ? items[0] : null;
  const fill = one ? one.fill : paint.fill;
  const stroke = one ? one.stroke : paint.stroke;
  const fillSolid = typeof fill === "string" ? fill : fill?.stops?.[0]?.c || "#1c1915";
  const strokeSolid = typeof stroke === "string" ? stroke : "#1c1915";
  const sw = one?.sw ?? paint.sw;
  const b = items.length ? unionBBox(items.map(itemBBox)) : null;
  inspector.innerHTML = `
    <h3>${items.length ? `${items.length} selected` : "Style"}</h3>
    <div class="swatches">${SWATCHES.map((c) => `<button type="button" class="swatch" data-swatch="${c}" style="background:${c}" aria-label="${c}"></button>`).join("")}</div>
    <div class="row">
      <label>Fill <input data-field="fill" type="color" value="${esc(fillSolid && fillSolid !== "none" ? fillSolid : "#1c1915")}"></label>
      <button type="button" class="mini" data-act="no-fill">None</button>
    </div>
    <div class="row">
      <label>Stroke <input data-field="stroke" type="color" value="${esc(strokeSolid && strokeSolid !== "none" ? strokeSolid : "#1c1915")}"></label>
      <button type="button" class="mini" data-act="no-stroke">None</button>
    </div>
    <div class="row">
      <label>Width <input data-field="sw" type="number" min="0" step="0.5" value="${sw}"></label>
      <label>Opacity <input data-field="opacity" type="number" min="0" max="1" step="0.05" value="${one?.opacity ?? 1}"></label>
    </div>
    <div class="row">
      <label>Dash
        <select data-field="dash">
          <option value="" ${!one?.dash ? "selected" : ""}>Solid</option>
          <option value="8 5" ${one?.dash === "8 5" ? "selected" : ""}>Dash</option>
          <option value="1.5 5" ${one?.dash === "1.5 5" ? "selected" : ""}>Dots</option>
        </select>
      </label>
      <label>Cap
        <select data-field="cap">
          <option value="butt" ${(one?.cap || "butt") === "butt" ? "selected" : ""}>Butt</option>
          <option value="round" ${one?.cap === "round" ? "selected" : ""}>Round</option>
          <option value="square" ${one?.cap === "square" ? "selected" : ""}>Square</option>
        </select>
      </label>
      <label>Join
        <select data-field="join">
          <option value="miter" ${(one?.join || "miter") === "miter" ? "selected" : ""}>Miter</option>
          <option value="round" ${one?.join === "round" ? "selected" : ""}>Round</option>
          <option value="bevel" ${one?.join === "bevel" ? "selected" : ""}>Bevel</option>
        </select>
      </label>
    </div>
    ${one?.kind === "text" ? `<div class="row"><label>Text <input data-field="text" type="text" value="${esc(one.text)}"></label></div>
      <div class="row"><label>Size <input data-field="size" type="number" min="1" value="${one.size}"></label>
      <label>Align <select data-field="anchor"><option value="start" ${one.anchor === "start" ? "selected" : ""}>Left</option><option value="middle" ${one.anchor === "middle" ? "selected" : ""}>Center</option><option value="end" ${one.anchor === "end" ? "selected" : ""}>Right</option></select></label></div>` : ""}
    ${state.tool === "polygon" || state.tool === "star" || state.tool === "spiral" ? `<div class="row">
      ${state.tool !== "spiral" ? `<label>Sides <input data-opt="sides" type="number" min="3" max="40" value="${state.tool === "star" ? state.toolOpts.starPoints : state.toolOpts.sides}"></label>` : ""}
      ${state.tool === "star" ? `<label>Inner <input data-opt="inner" type="number" min="0.05" max="0.95" step="0.05" value="${state.toolOpts.inner}"></label>` : ""}
      ${state.tool === "spiral" ? `<label>Turns <input data-opt="turns" type="number" min="0.5" max="20" step="0.5" value="${state.toolOpts.turns}"></label>` : ""}
    </div>` : ""}
    ${state.tool === "node" ? `<div class="row"><button type="button" class="mini" data-act="corner">Corner</button><button type="button" class="mini" data-act="smooth">Smooth</button><button type="button" class="mini" data-act="symmetric">Symmetric</button></div>` : ""}
    ${b ? `<div class="row">
      <label>X <input data-field="x" type="number" step="1" value="${Math.round(b.x)}" ${items.length !== 1 ? "disabled" : ""}></label>
      <label>Y <input data-field="y" type="number" step="1" value="${Math.round(b.y)}" ${items.length !== 1 ? "disabled" : ""}></label>
    </div>
    <div class="row">
      <label>W <input data-field="w" type="number" min="1" step="1" value="${Math.round(b.w)}" ${items.length !== 1 ? "disabled" : ""}></label>
      <label>H <input data-field="h" type="number" min="1" step="1" value="${Math.round(b.h)}" ${items.length !== 1 ? "disabled" : ""}></label>
    </div>` : ""}
    <h3>Arrange</h3>
    <div class="row">
      <button type="button" class="mini" data-align="left">Left</button>
      <button type="button" class="mini" data-align="cx">Center</button>
      <button type="button" class="mini" data-align="right">Right</button>
    </div>
    <div class="row">
      <button type="button" class="mini" data-align="top">Top</button>
      <button type="button" class="mini" data-align="cy">Middle</button>
      <button type="button" class="mini" data-align="bottom">Bottom</button>
    </div>
    <div class="row">
      <button type="button" class="mini" data-dist="x">Distribute H</button>
      <button type="button" class="mini" data-dist="y">Distribute V</button>
    </div>
    <div class="row">
      <button type="button" class="mini" data-align="page-left">Page left</button>
      <button type="button" class="mini" data-align="page-cx">Page center</button>
      <button type="button" class="mini" data-align="page-right">Page right</button>
    </div>
    ${b ? `<p class="check">${Math.round(b.x)}, ${Math.round(b.y)} · ${Math.round(b.w)} × ${Math.round(b.h)}</p>` : ""}
    <h3>Page</h3>
    <div class="row">
      <label>W <input data-page="w" type="number" min="32" value="${state.doc.w}"></label>
      <label>H <input data-page="h" type="number" min="32" value="${state.doc.h}"></label>
      <label>Paper <input data-page="bg" type="color" value="${esc(state.doc.bg)}"></label>
    </div>
    <label class="check"><input data-page="grid" type="checkbox" ${state.doc.showGrid ? "checked" : ""}> Grid</label>
    <label class="check"><input data-page="snap" type="checkbox" ${state.doc.snap ? "checked" : ""}> Snap to grid, nodes, guides</label>
    <h3>Layers</h3>
    ${state.doc.layers.map((l) => `<div class="layer ${l.id === state.doc.active ? "on" : ""}">
      <button type="button" class="layer-btn" data-layer-eye="${l.id}" aria-label="Show">${l.visible ? "●" : "○"}</button>
      <button type="button" class="layer-btn" data-layer-lock="${l.id}" aria-label="Lock">${l.locked ? "▮" : "▯"}</button>
      <button type="button" class="layer-btn" data-layer-pick="${l.id}">${esc(l.name)}</button>
      <button type="button" class="layer-btn" data-layer-up="${l.id}" aria-label="Raise layer">↑</button>
    </div>`).join("")}
    <div class="row">
      <button type="button" class="mini" data-act="add-layer">Add layer</button>
      <button type="button" class="mini" data-act="del-layer">Delete</button>
    </div>
    <h3>Objects</h3>
    <div class="objs">${objectRows().map(({ it, depth }) => `<button type="button" class="obj${state.sel.has(it.id) ? " on" : ""}" data-pick="${it.id}" style="padding-left:${8 + depth * 12}px">${esc(it.name || it.kind)}</button>`).join("") || `<p class="check">Nothing on this layer.</p>`}</div>
    ${one?.subs ? `<h3>Path data</h3><textarea data-field="d">${esc(subsToD(one.subs))}</textarea>` : ""}
  `;
  docName.value = state.doc.name;
}
function onInspector(e) {
  const t = e.target;
  if (t.dataset?.swatch) {
    applyStyle({ fill: t.dataset.swatch });
    paint.fill = t.dataset.swatch;
    return;
  }
  if (t.dataset?.align) return align(t.dataset.align);
  if (t.dataset?.dist) return distribute(t.dataset.dist);
  if (t.dataset?.act === "no-fill") return applyStyle({ fill: "none" });
  if (t.dataset?.act === "no-stroke") return applyStyle({ stroke: "none" });
  if (t.dataset?.act === "corner") return setNodeKind("corner");
  if (t.dataset?.act === "smooth") return setNodeKind("smooth");
  if (t.dataset?.act === "symmetric") return setNodeKind("symmetric");
  if (t.dataset?.act === "add-layer") {
    return mutate(() => {
      const id = uid();
      state.doc.layers.push({ id, name: `Layer ${state.doc.layers.length + 1}`, visible: true, locked: false, items: [] });
      state.doc.active = id;
    });
  }
  if (t.dataset?.act === "del-layer") {
    if (state.doc.layers.length < 2) return;
    return mutate(() => {
      state.doc.layers = state.doc.layers.filter((l) => l.id !== state.doc.active);
      state.doc.active = state.doc.layers[0].id;
      state.sel.clear();
    });
  }
  if (t.dataset?.pick) {
    const id = t.dataset.pick;
    if (!locateAnywhere(id)) return;
    if (e.shiftKey) {
      if (state.sel.has(id)) state.sel.delete(id);
      else state.sel.add(id);
    } else state.sel = new Set([id]);
    state.nodeSel = [];
    renderAll();
    if (e.detail > 1 && locateAnywhere(id)?.item.subs) setTool("node");
    else renderInspector();
    return;
  }
  if (t.dataset?.layerPick || t.dataset?.layerEye || t.dataset?.layerLock || t.dataset?.layerUp) {
    const id = t.dataset.layerPick || t.dataset.layerEye || t.dataset.layerLock || t.dataset.layerUp;
    const layer = state.doc.layers.find((l) => l.id === id);
    if (!layer) return;
    if (t.dataset.layerPick) state.doc.active = id;
    if (t.dataset.layerEye) layer.visible = !layer.visible;
    if (t.dataset.layerLock) layer.locked = !layer.locked;
    if (t.dataset.layerUp) {
      const i = state.doc.layers.indexOf(layer);
      if (i < state.doc.layers.length - 1) {
        const [row] = state.doc.layers.splice(i, 1);
        state.doc.layers.splice(i + 1, 0, row);
      }
    }
    renderAll();
    renderInspector();
    saveSoon();
    return;
  }
  if (t.dataset?.field) {
    const field = t.dataset.field;
    const items = selectedItems();
    if (field === "fill" || field === "stroke") {
      paint[field] = t.value;
      if (items.length) mutate(() => items.forEach((it) => {
        if (it[field] && typeof it[field] === "object") it[field].stops[0].c = t.value;
        else it[field] = t.value;
      }));
      return;
    }
    if (field === "sw" || field === "dash" || field === "cap" || field === "join" || field === "opacity") {
      const value = field === "sw" ? num(t.value, 0) : field === "opacity" ? Math.min(1, Math.max(0, num(t.value, 1))) : t.value;
      if (field === "sw") paint.sw = value;
      if (items.length) mutate(() => items.forEach((it) => { it[field] = value; }));
      return;
    }
    if (field === "x" || field === "y" || field === "w" || field === "h") {
      const one = items[0];
      if (!one || items.length !== 1) return;
      const box = itemBBox(one);
      const v = num(t.value, field === "w" || field === "h" ? 1 : 0);
      mutate(() => {
        if (field === "x") translateItem(one, v - box.x, 0);
        if (field === "y") translateItem(one, 0, v - box.y);
        if (field === "w" && box.w > 0) scaleItem(one, { x: box.x, y: box.y }, v / box.w, 1);
        if (field === "h" && box.h > 0) scaleItem(one, { x: box.x, y: box.y }, 1, v / box.h);
      });
      return;
    }
    if (field === "text" || field === "size" || field === "anchor") {
      const one = items[0];
      if (!one || one.kind !== "text") return;
      mutate(() => {
        if (field === "text") one.text = t.value;
        if (field === "size") one.size = Math.max(1, num(t.value, one.size));
        if (field === "anchor") one.anchor = t.value;
      });
      return;
    }
    if (field === "d" && items[0]?.subs) {
      mutate(() => { items[0].subs = parsePath(t.value); });
    }
  }
  if (t.dataset?.opt) {
    const v = num(t.value, 0);
    if (t.dataset.opt === "sides") {
      if (state.tool === "star") state.toolOpts.starPoints = Math.max(3, v);
      else state.toolOpts.sides = Math.max(3, v);
    }
    if (t.dataset.opt === "inner") state.toolOpts.inner = Math.min(0.95, Math.max(0.05, v));
    if (t.dataset.opt === "turns") state.toolOpts.turns = Math.max(0.5, v);
  }
  if (t.dataset?.page) {
    mutate(() => {
      if (t.dataset.page === "w") state.doc.w = Math.max(32, num(t.value, state.doc.w));
      if (t.dataset.page === "h") state.doc.h = Math.max(32, num(t.value, state.doc.h));
      if (t.dataset.page === "bg") state.doc.bg = t.value;
      if (t.dataset.page === "grid") state.doc.showGrid = t.checked;
      if (t.dataset.page === "snap") state.doc.snap = t.checked;
    });
  }
}
function onKey(e) {
  const typing = /input|textarea/i.test(document.activeElement?.tagName || "");
  if (e.code === "Space" && !typing) {
    state.space = e.type !== "keyup";
    if (e.type === "keydown") e.preventDefault();
    return;
  }
  if (e.type !== "keydown") return;
  const meta = e.metaKey || e.ctrlKey;
  const k = e.key.toLowerCase();
  if (meta && k === "z") { e.preventDefault(); e.shiftKey ? redo() : undo(); return; }
  if (meta && k === "y") { e.preventDefault(); redo(); return; }
  if (meta && k === "s") { e.preventDefault(); saveSvg(); return; }
  if (meta && k === "o") { e.preventDefault(); openSvg(); return; }
  if (meta && k === "e") { e.preventDefault(); exportPng(); return; }
  if (meta && k === "a") { e.preventDefault(); selectAll(); return; }
  if (meta && k === "d") { e.preventDefault(); duplicate(); return; }
  if (meta && k === "c") { e.preventDefault(); copy(); return; }
  if (meta && k === "x") { e.preventDefault(); cut(); return; }
  if (meta && k === "v") { e.preventDefault(); paste(); return; }
  if (meta && k === "g") { e.preventDefault(); e.shiftKey ? ungroup() : group(); return; }
  if (typing) return;
  if (e.key === "Delete" || e.key === "Backspace") { e.preventDefault(); del(); return; }
  if (e.key === "Enter" && state.pen) { e.preventDefault(); finishPen(false); return; }
  if (e.key === "Escape") {
    if (state.pen) finishPen(false);
    else { state.sel.clear(); state.nodeSel = []; renderAll(); renderInspector(); }
    return;
  }
  if (e.key === "[") return orderZ(e.shiftKey ? "back" : "lower");
  if (e.key === "]") return orderZ(e.shiftKey ? "front" : "raise");
  const map = { v: "select", s: "select", n: "node", b: "pen", p: "pencil", r: "rect", e: "ellipse", y: "polygon", l: "spiral", t: "text", g: "gradient", i: "dropper", z: "zoom", h: "hand" };
  if (k === "*" || e.key === "*") return setTool("star");
  if (!meta && map[k] && k !== "g") setTool(map[k]);
  if (!meta && k === "g" && !e.repeat) setTool("gradient");
  const nudge = e.shiftKey ? 10 : 1;
  if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) {
    e.preventDefault();
    const dx = e.key === "ArrowLeft" ? -nudge : e.key === "ArrowRight" ? nudge : 0;
    const dy = e.key === "ArrowUp" ? -nudge : e.key === "ArrowDown" ? nudge : 0;
    mutate(() => selectedItems().forEach((it) => translateItem(it, dx, dy)));
  }
}
function rulerDown(axis, e) {
  const p = clientToDoc(e);
  beginChange();
  state.guides.push({ axis, at: axis === "x" ? p.x : p.y });
  state.gesture = { type: "guide", index: state.guides.length - 1 };
  renderOverlay();
}
function boot() {
  let loaded = null;
  try { loaded = JSON.parse(localStorage.getItem(SAVE_KEY) || "null"); } catch { loaded = null; }
  if (loaded?.doc?.layers) {
    state.doc = loaded.doc;
    state.guides = loaded.guides || [];
    seq = loaded.seq || 1;
  } else state.doc = blankDoc();
  if (new URLSearchParams(location.search).get("hub") === "1") $("paint-link").hidden = false;
  docName.value = state.doc.name;
  docName.addEventListener("change", () => { state.doc.name = docName.value || "Untitled"; saveSoon(); });
  renderChrome();
  setTool("select");
  inspector.addEventListener("input", onInspector);
  inspector.addEventListener("change", onInspector);
  inspector.addEventListener("click", onInspector);
  svg.addEventListener("pointerdown", onPointerDown);
  window.addEventListener("pointermove", onPointerMove);
  window.addEventListener("pointerup", onPointerUp);
  svg.addEventListener("dblclick", onDoubleClick);
  window.addEventListener("keydown", onKey);
  window.addEventListener("keyup", onKey);
  stage.addEventListener("wheel", (e) => { e.preventDefault(); zoomAt(e, e.deltaY < 0 ? 1.08 : 1 / 1.08); }, { passive: false });
  $("ruler-x").addEventListener("pointerdown", (e) => rulerDown("y", e));
  $("ruler-y").addEventListener("pointerdown", (e) => rulerDown("x", e));
  window.addEventListener("pointerdown", (e) => {
    if (!menuEl.contains(e.target) && !e.target.closest?.(".menu-btn")) menuEl.hidden = true;
  });
  window.addEventListener("dragover", (e) => e.preventDefault());
  window.addEventListener("drop", (e) => {
    e.preventDefault();
    const file = e.dataTransfer?.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => importSvgText(String(reader.result || ""));
    reader.readAsText(file);
  });
  window.addEventListener("resize", () => { drawRulers(); });
  requestAnimationFrame(() => fitPage());
  renderInspector();
  hintEl.textContent = HINTS.select;
}

boot();
