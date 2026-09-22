import {
  CATALOG,
  VER,
  addHole,
  addWall,
  clone,
  deleteHole,
  deleteItem,
  deleteLine,
  hitItem,
  itemRect,
  lineEnds,
  lineLength,
  nameRoom,
  nearestLine,
  pointInPoly,
  roomsOf,
  roundFt,
  seed,
} from "./model.js";

const KEY = "ginger.plan.v2";
const $ = (id) => document.getElementById(id);
const planCanvas = $("plan");
const ctx = planCanvas.getContext("2d");
const peek = $("peek");
const pctx = peek.getContext("2d");
const view = { ox: 28, oy: 28, s: 32 };

let tool = "select";
let itemKind = "table";
let lab = false;
let theme = "paper";
let draft = null;
let selected = null;
let drag = null;
let hist = [];
let future = [];
const plan = load() || seed();

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const d = JSON.parse(raw);
    if (!Array.isArray(d.vertices) || !Array.isArray(d.lines)) return null;
    return {
      name: d.name || "Studio plan",
      level: d.level || "Level 1",
      ceilingFt: d.ceilingFt || 9,
      vertices: d.vertices,
      lines: d.lines,
      holes: d.holes || [],
      areas: d.areas || [],
      items: d.items || [],
    };
  } catch {
    return null;
  }
}

function pushHist() {
  hist.push(clone(plan));
  if (hist.length > 40) hist.shift();
  future = [];
}

function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify({ app: "ginger", ver: VER, ...plan }));
  } catch {
    /* private mode */
  }
  try {
    draw();
    schedules();
    props();
    if (lab) drawPeek();
  } catch (err) {
    $("status").textContent = "Draw error: " + (err && err.message ? err.message : err);
  }
}

function cssVar(name) {
  return getComputedStyle(document.body).getPropertyValue(name).trim();
}

function toPx(x, y) {
  return { x: view.ox + x * view.s, y: view.oy + y * view.s };
}

function eventFt(ev) {
  const r = planCanvas.getBoundingClientRect();
  const x = ((ev.clientX - r.left) / r.width) * planCanvas.width;
  const y = ((ev.clientY - r.top) / r.height) * planCanvas.height;
  return { x: (x - view.ox) / view.s, y: (y - view.oy) / view.s };
}

function esc(s) {
  return String(s).replace(/[&<>"]/g, (c) => {
    if (c === "&") return "&" + "amp;";
    if (c === "<") return "&" + "lt;";
    if (c === ">") return "&" + "gt;";
    return "&" + "quot;";
  });
}

function ftIn(ft) {
  const inches = Math.round(Number(ft) * 12);
  const f = Math.floor(inches / 12);
  const i = inches % 12;
  return f + "'-" + i + '"';
}

function vertexAt(p) {
  let best = null;
  let bd = 0.45;
  for (const v of plan.vertices) {
    const d = Math.hypot(v.x - p.x, v.y - p.y);
    if (d < bd) {
      bd = d;
      best = v;
    }
  }
  return best;
}

function holeAt(p) {
  const hit = nearestLine(plan, p, 0.85);
  if (!hit) return null;
  for (const h of plan.holes) {
    if (h.line !== hit.line.id) continue;
    const len = lineLength(plan, hit.line);
    const along = Math.abs(h.t - hit.t) * len;
    if (along <= h.widthFt / 2 + 0.35) return h;
  }
  return null;
}

function hit(p) {
  const v = vertexAt(p);
  if (v) return { kind: "vertex", id: v.id };
  const h = holeAt(p);
  if (h) return { kind: h.kind, id: h.id };
  const it = hitItem(plan, p);
  if (it) return { kind: "item", id: it.id };
  const line = nearestLine(plan, p, 0.45);
  if (line) return { kind: "line", id: line.line.id };
  const room = roomsOf(plan).find((r) => pointInPoly(p, r.pts));
  if (room) return { kind: "room", id: room.key };
  return null;
}

function draw() {
  ctx.clearRect(0, 0, planCanvas.width, planCanvas.height);
  ctx.fillStyle = cssVar("--aw-bg");
  ctx.fillRect(0, 0, planCanvas.width, planCanvas.height);
  ctx.strokeStyle = cssVar("--aw-grid");
  ctx.lineWidth = 1;
  for (let x = view.ox; x < planCanvas.width; x += view.s) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, planCanvas.height);
    ctx.stroke();
  }
  for (let y = view.oy; y < planCanvas.height; y += view.s) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(planCanvas.width, y);
    ctx.stroke();
  }
  const rooms = roomsOf(plan);
  for (const room of rooms) {
    ctx.beginPath();
    room.pts.forEach((pt, i) => {
      const q = toPx(pt.x, pt.y);
      if (i === 0) ctx.moveTo(q.x, q.y);
      else ctx.lineTo(q.x, q.y);
    });
    ctx.closePath();
    ctx.fillStyle = selected && selected.kind === "room" && selected.id === room.key ? "rgba(110,114,245,0.22)" : cssVar("--aw-room");
    ctx.fill();
    const top = room.pts.reduce((m, p) => Math.min(m, p.y), 1e9);
    const c = toPx(room.cx, top + 1.15);
    ctx.fillStyle = cssVar("--aw-fg");
    ctx.font = "600 15px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(room.name, c.x, c.y);
    ctx.font = "13px sans-serif";
    ctx.fillStyle = cssVar("--aw-muted");
    ctx.fillText(Math.round(room.area) + " sf", c.x, c.y + 18);
    ctx.textAlign = "left";
  }
  for (const line of plan.lines) {
    const e = lineEnds(plan, line);
    if (!e) continue;
    const a = toPx(e.a.x, e.a.y);
    const b = toPx(e.b.x, e.b.y);
    const on = selected && selected.kind === "line" && selected.id === line.id;
    ctx.strokeStyle = on ? cssVar("--aw-accent") : cssVar("--aw-wall");
    ctx.lineWidth = Math.max(4, ((line.thickIn || 6) / 12) * view.s);
    ctx.lineCap = "square";
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
    for (const h of plan.holes.filter((x) => x.line === line.id)) drawHole(line, e, h);
  }
  for (const v of plan.vertices) {
    const q = toPx(v.x, v.y);
    const on = selected && selected.kind === "vertex" && selected.id === v.id;
    ctx.fillStyle = on ? cssVar("--aw-accent") : cssVar("--aw-fg");
    ctx.beginPath();
    ctx.arc(q.x, q.y, on ? 6 : 3.5, 0, Math.PI * 2);
    ctx.fill();
  }
  for (const it of plan.items) drawItem(it);
  if (draft && tool === "wall") {
    const a = toPx(draft.x, draft.y);
    const b = toPx(draft.mx, draft.my);
    ctx.strokeStyle = cssVar("--aw-accent");
    ctx.setLineDash([6, 4]);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
    ctx.setLineDash([]);
    const feet = Math.hypot(draft.mx - draft.x, draft.my - draft.y);
    $("status").textContent = "Wall " + feet.toFixed(1) + " ft — tap the end.";
  }
}

function drawHole(line, e, h) {
  const dx = e.b.x - e.a.x;
  const dy = e.b.y - e.a.y;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const cx = e.a.x + dx * h.t;
  const cy = e.a.y + dy * h.t;
  const half = h.widthFt / 2;
  const p0 = toPx(cx - ux * half, cy - uy * half);
  const p1 = toPx(cx + ux * half, cy + uy * half);
  const c = toPx(cx, cy);
  ctx.strokeStyle = cssVar("--aw-bg");
  ctx.lineWidth = Math.max(6, ((line.thickIn || 6) / 12) * view.s + 2);
  ctx.beginPath();
  ctx.moveTo(p0.x, p0.y);
  ctx.lineTo(p1.x, p1.y);
  ctx.stroke();
  const on = selected && (selected.kind === "door" || selected.kind === "window") && selected.id === h.id;
  ctx.strokeStyle = on ? cssVar("--aw-accent") : h.kind === "door" ? cssVar("--aw-door") : cssVar("--aw-win");
  ctx.lineWidth = 2;
  if (h.kind === "door") {
    const px = -uy * h.swing;
    const py = ux * h.swing;
    const hinge = toPx(cx - ux * half, cy - uy * half);
    const leaf = toPx(cx - ux * half + px * h.widthFt, cy - uy * half + py * h.widthFt);
    ctx.beginPath();
    ctx.moveTo(hinge.x, hinge.y);
    ctx.lineTo(leaf.x, leaf.y);
    ctx.stroke();
    const a0 = Math.atan2(leaf.y - hinge.y, leaf.x - hinge.x);
    const a1 = Math.atan2(p1.y - hinge.y, p1.x - hinge.x);
    let sweep = a1 - a0;
    while (sweep > Math.PI) sweep -= Math.PI * 2;
    while (sweep < -Math.PI) sweep += Math.PI * 2;
    ctx.beginPath();
    ctx.arc(hinge.x, hinge.y, h.widthFt * view.s, a0, a0 + sweep, sweep < 0);
    ctx.stroke();
  } else {
    const nx = -uy * 0.15;
    const ny = ux * 0.15;
    const g0 = toPx(cx - ux * half + nx, cy - uy * half + ny);
    const g1 = toPx(cx + ux * half + nx, cy + uy * half + ny);
    ctx.beginPath();
    ctx.moveTo(p0.x, p0.y);
    ctx.lineTo(p1.x, p1.y);
    ctx.moveTo(g0.x, g0.y);
    ctx.lineTo(g1.x, g1.y);
    ctx.stroke();
  }
  ctx.fillStyle = cssVar("--aw-muted");
  ctx.font = "11px sans-serif";
  ctx.fillText(h.kind === "door" ? "D" : "W", c.x + 4, c.y - 6);
}

function drawItem(it) {
  const { w, d } = itemRect(it);
  const cat = CATALOG[it.kind] || CATALOG.table;
  const c = toPx(it.x, it.y);
  ctx.save();
  ctx.translate(c.x, c.y);
  ctx.rotate(it.rot || 0);
  const on = selected && selected.kind === "item" && selected.id === it.id;
  ctx.fillStyle = on ? "rgba(110,114,245,0.28)" : "rgba(255,255,255,0.8)";
  ctx.strokeStyle = on ? cssVar("--aw-accent") : cssVar("--aw-fg");
  ctx.lineWidth = 1.5;
  ctx.fillRect((-w / 2) * view.s, (-d / 2) * view.s, w * view.s, d * view.s);
  ctx.strokeRect((-w / 2) * view.s, (-d / 2) * view.s, w * view.s, d * view.s);
  ctx.fillStyle = cssVar("--aw-fg");
  ctx.font = "12px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(cat.label, 0, 4);
  ctx.restore();
}

function drawPeek() {
  pctx.fillStyle = cssVar("--aw-bg");
  pctx.fillRect(0, 0, peek.width, peek.height);
  const iso = (x, y, z) => ({ x: 220 + (x - y) * 8, y: 210 + (x + y) * 4 - z * 7 });
  const h = plan.ceilingFt || 9;
  pctx.lineWidth = 1.5;
  for (const line of plan.lines) {
    const e = lineEnds(plan, line);
    if (!e) continue;
    const a0 = iso(e.a.x, e.a.y, 0);
    const b0 = iso(e.b.x, e.b.y, 0);
    const a1 = iso(e.a.x, e.a.y, h);
    const b1 = iso(e.b.x, e.b.y, h);
    pctx.fillStyle = "rgba(110,114,245,0.16)";
    pctx.strokeStyle = cssVar("--aw-wall");
    pctx.beginPath();
    pctx.moveTo(a0.x, a0.y);
    pctx.lineTo(b0.x, b0.y);
    pctx.lineTo(b1.x, b1.y);
    pctx.lineTo(a1.x, a1.y);
    pctx.closePath();
    pctx.fill();
    pctx.stroke();
  }
  pctx.fillStyle = cssVar("--aw-muted");
  pctx.font = "12px sans-serif";
  pctx.fillText(plan.level + " · " + h + " ft ceiling", 12, 22);
}

function schedules() {
  const rooms = roomsOf(plan);
  $("rooms").tBodies[0].innerHTML =
    rooms.map((r) => `<tr><td>${r.mark}</td><td>${esc(r.name)}</td><td>${Math.round(r.area)}</td></tr>`).join("") ||
    `<tr><td colspan="3">Close the walls to make a room.</td></tr>`;
  const doors = plan.holes.filter((h) => h.kind === "door");
  const wins = plan.holes.filter((h) => h.kind === "window");
  $("doors").tBodies[0].innerHTML =
    doors.map((d, i) => `<tr><td>D${i + 1}</td><td>${ftIn(d.widthFt)}</td><td>${esc(d.type)}</td></tr>`).join("") ||
    `<tr><td colspan="3">None</td></tr>`;
  $("wins").tBodies[0].innerHTML =
    wins.map((n, i) => `<tr><td>W${i + 1}</td><td>${ftIn(n.widthFt)}</td><td>${esc(n.type)}</td></tr>`).join("") ||
    `<tr><td colspan="3">None</td></tr>`;
}

function props() {
  const box = $("props");
  if (!selected) {
    box.innerHTML = `<p class="hint">${esc(plan.level)} · ${plan.lines.length} walls · ${roomsOf(plan).length} rooms</p><label>Plan name</label><input id="pname" value="${esc(plan.name)}" /><label>Ceiling (ft)</label><input id="ceil" type="number" min="8" max="12" step="1" value="${plan.ceilingFt}" />`;
    $("pname").onchange = (e) => {
      pushHist();
      plan.name = e.target.value.slice(0, 40);
      save();
    };
    $("ceil").onchange = (e) => {
      pushHist();
      plan.ceilingFt = Math.min(12, Math.max(8, Number(e.target.value) || 9));
      save();
    };
    return;
  }
  if (selected.kind === "line") {
    const line = plan.lines.find((l) => l.id === selected.id);
    box.innerHTML = `<p>Wall · ${lineLength(plan, line).toFixed(1)} ft</p><label>Thickness</label><select id="th"><option value="4">4 in</option><option value="6">6 in</option><option value="8">8 in</option></select><button type="button" id="del">Delete wall</button>`;
    $("th").value = String(line.thickIn || 6);
    $("th").onchange = (e) => {
      pushHist();
      line.thickIn = Number(e.target.value);
      save();
    };
    $("del").onclick = () => {
      pushHist();
      deleteLine(plan, line.id);
      selected = null;
      save();
    };
  }
  if (selected.kind === "room") {
    const room = roomsOf(plan).find((r) => r.key === selected.id);
    if (!room) {
      selected = null;
      props();
      return;
    }
    box.innerHTML = `<label>Room name</label><input id="rn" value="${esc(room.name)}" /><p>${Math.round(room.area)} sf · from the closed walls</p>`;
    $("rn").onchange = (e) => {
      pushHist();
      nameRoom(plan, room.key, e.target.value.slice(0, 32) || "Room");
      save();
    };
  }
  if (selected.kind === "door" || selected.kind === "window") {
    const h = plan.holes.find((x) => x.id === selected.id);
    const types = h.kind === "door" ? ["Swing", "Pocket", "Bifold"] : ["Fixed", "Slider", "Awning"];
    box.innerHTML = `<label>Width (ft)</label><input id="wd" type="number" min="1" max="12" step="0.5" value="${h.widthFt}" /><label>Type</label><select id="tp">${types.map((t) => `<option>${t}</option>`).join("")}</select>${h.kind === "door" ? `<button type="button" id="flip">Flip swing</button>` : ""}<button type="button" id="del">Delete</button>`;
    $("tp").value = types.includes(h.type) ? h.type : types[0];
    $("wd").onchange = (e) => {
      pushHist();
      h.widthFt = Math.min(12, Math.max(1, Number(e.target.value) || 3));
      save();
    };
    $("tp").onchange = (e) => {
      pushHist();
      h.type = e.target.value;
      save();
    };
    $("del").onclick = () => {
      pushHist();
      deleteHole(plan, h.id);
      selected = null;
      save();
    };
    const flip = $("flip");
    if (flip)
      flip.onclick = () => {
        pushHist();
        h.swing = h.swing === 1 ? -1 : 1;
        save();
      };
  }
  if (selected.kind === "item") {
    const it = plan.items.find((x) => x.id === selected.id);
    box.innerHTML = `<p>${esc((CATALOG[it.kind] || CATALOG.table).label)}</p><button type="button" id="rot">Turn 90°</button><button type="button" id="del">Delete</button>`;
    $("rot").onclick = () => {
      pushHist();
      it.rot = ((it.rot || 0) + Math.PI / 2) % (Math.PI * 2);
      save();
    };
    $("del").onclick = () => {
      pushHist();
      deleteItem(plan, it.id);
      selected = null;
      save();
    };
  }
  if (selected.kind === "vertex") {
    const v = plan.vertices.find((x) => x.id === selected.id);
    box.innerHTML = `<p>Corner ${v.x.toFixed(1)} ft, ${v.y.toFixed(1)} ft</p><p class="hint">Drag the corner on the plan.</p>`;
  }
}

function setTool(next) {
  tool = next;
  draft = null;
  document.querySelectorAll("[data-tool]").forEach((b) => b.setAttribute("aria-pressed", b.dataset.tool === tool ? "true" : "false"));
  const hints = {
    select: "Select a wall, door, window, room, or corner.",
    wall: "Wall: tap the start, then the end. Grid is 1 ft.",
    door: "Door: tap a wall. It hangs on that wall.",
    window: "Window: tap a wall.",
    room: "Room: tap inside closed walls, then name it.",
    item: "Item: pick a symbol, then tap the floor.",
  };
  $("status").textContent = hints[tool];
}

planCanvas.addEventListener("pointerdown", (ev) => {
  planCanvas.setPointerCapture(ev.pointerId);
  const p = eventFt(ev);
  if (tool === "select") {
    selected = hit(p);
    const v = selected && selected.kind === "vertex" ? plan.vertices.find((x) => x.id === selected.id) : null;
    const it = selected && selected.kind === "item" ? plan.items.find((x) => x.id === selected.id) : null;
    if (v || it) {
      drag = { kind: v ? "vertex" : "item", id: (v || it).id, dx: p.x - (v || it).x, dy: p.y - (v || it).y, moved: false };
    }
    props();
    draw();
    return;
  }
  if (tool === "wall") {
    const s = { x: roundFt(p.x), y: roundFt(p.y) };
    if (!draft) draft = { x: s.x, y: s.y, mx: s.x, my: s.y };
    else {
      pushHist();
      const line = addWall(plan, draft.x, draft.y, s.x, s.y);
      draft = null;
      if (!line) hist.pop();
      save();
      if (line) $("status").textContent = "Wall is in. Tap a new start, or pick Select.";
    }
    return;
  }
  if (tool === "door" || tool === "window") {
    const nw = nearestLine(plan, p, 0.8);
    if (!nw) {
      $("status").textContent = "Tap a wall so the opening has a host.";
      return;
    }
    pushHist();
    const hole = addHole(plan, nw.line.id, nw.t, tool);
    selected = hole ? { kind: tool, id: hole.id } : null;
    save();
    return;
  }
  if (tool === "room") {
    const room = roomsOf(plan).find((r) => pointInPoly(p, r.pts));
    if (!room) {
      $("status").textContent = "No closed room there. Finish the walls first.";
      return;
    }
    selected = { kind: "room", id: room.key };
    if (!plan.areas.some((a) => a.key === room.key)) nameRoom(plan, room.key, "Room");
    save();
    const input = $("rn");
    if (input) input.focus();
    return;
  }
  if (tool === "item") {
    pushHist();
    const cat = CATALOG[itemKind];
    const it = { id: "i" + Math.random().toString(36).slice(2, 8), kind: itemKind, x: roundFt(p.x), y: roundFt(p.y), rot: 0, w: cat.w, d: cat.d };
    plan.items.push(it);
    selected = { kind: "item", id: it.id };
    save();
  }
});

planCanvas.addEventListener("pointermove", (ev) => {
  const p = eventFt(ev);
  if (drag) {
    if (!drag.moved) {
      pushHist();
      drag.moved = true;
    }
    const x = roundFt(p.x - drag.dx);
    const y = roundFt(p.y - drag.dy);
    if (drag.kind === "vertex") {
      const v = plan.vertices.find((q) => q.id === drag.id);
      if (v) {
        v.x = x;
        v.y = y;
      }
    } else {
      const it = plan.items.find((q) => q.id === drag.id);
      if (it) {
        it.x = x;
        it.y = y;
      }
    }
    draw();
    schedules();
    return;
  }
  if (draft && tool === "wall") {
    draft.mx = roundFt(p.x);
    draft.my = roundFt(p.y);
    draw();
  }
});

planCanvas.addEventListener("pointerup", () => {
  if (drag) {
    drag = null;
    save();
  }
});

document.querySelectorAll("[data-tool]").forEach((btn) => btn.addEventListener("click", () => setTool(btn.dataset.tool)));
document.querySelectorAll("[data-item]").forEach((btn) =>
  btn.addEventListener("click", () => {
    itemKind = btn.dataset.item;
    setTool("item");
    document.querySelectorAll("[data-item]").forEach((b) => b.setAttribute("aria-pressed", b === btn ? "true" : "false"));
  }),
);

$("undo").onclick = () => {
  if (!hist.length) return;
  future.push(clone(plan));
  Object.assign(plan, hist.pop());
  selected = null;
  save();
};
$("redo").onclick = () => {
  if (!future.length) return;
  hist.push(clone(plan));
  Object.assign(plan, future.pop());
  selected = null;
  save();
};
$("theme").onclick = () => {
  theme = theme === "paper" ? "night" : "paper";
  document.body.setAttribute("data-theme", theme);
  $("theme").textContent = theme === "paper" ? "Night" : "Paper";
  draw();
  if (lab) drawPeek();
};
$("lab3d").onclick = () => {
  lab = !lab;
  $("lab3d").setAttribute("aria-pressed", lab ? "true" : "false");
  $("peekWrap").classList.toggle("on", lab);
  if (lab) drawPeek();
};
$("export").onclick = () => {
  const blob = new Blob([JSON.stringify({ app: "ginger", ver: VER, units: "ft", ...plan }, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = (plan.name || "plan").replace(/\s+/g, "-") + ".ginger.json";
  a.click();
};
$("imp").onclick = () => $("file").click();
$("file").onchange = (e) => {
  const f = e.target.files && e.target.files[0];
  if (!f) return;
  const rd = new FileReader();
  rd.onload = () => {
    try {
      const d = JSON.parse(String(rd.result));
      if (!Array.isArray(d.vertices) || !Array.isArray(d.lines)) throw new Error("shape");
      pushHist();
      plan.name = d.name || plan.name;
      plan.level = d.level || "Level 1";
      plan.ceilingFt = d.ceilingFt || 9;
      plan.vertices = d.vertices;
      plan.lines = d.lines;
      plan.holes = d.holes || [];
      plan.areas = d.areas || [];
      plan.items = d.items || [];
      selected = null;
      save();
    } catch {
      $("status").textContent = "That file is not a Ginger plan.";
    }
  };
  rd.readAsText(f);
};

document.addEventListener("keydown", (ev) => {
  const typing = ev.target && (ev.target.tagName === "INPUT" || ev.target.tagName === "SELECT" || ev.target.tagName === "TEXTAREA");
  if ((ev.metaKey || ev.ctrlKey) && ev.key.toLowerCase() === "z") {
    ev.preventDefault();
    if (ev.shiftKey) $("redo").click();
    else $("undo").click();
    return;
  }
  if (typing) return;
  const k = ev.key.toLowerCase();
  if (k === "v") setTool("select");
  if (k === "w") setTool("wall");
  if (k === "d") setTool("door");
  if (k === "n") setTool("window");
  if (k === "r") setTool("room");
  if (k === "i") setTool("item");
  if ((k === "delete" || k === "backspace") && selected) {
    ev.preventDefault();
    pushHist();
    if (selected.kind === "line") deleteLine(plan, selected.id);
    else if (selected.kind === "door" || selected.kind === "window") deleteHole(plan, selected.id);
    else if (selected.kind === "item") deleteItem(plan, selected.id);
    else {
      hist.pop();
      return;
    }
    selected = null;
    save();
  }
});

$("chip").textContent = "v" + VER;
$("chip").title = "Ginger " + VER;
setTool("select");
save();
