/* Ginger 1.0.0 — original planner. Patterns inspired by cvdlab/react-planner (MIT), not a port. */
(function () {
  const VER = "1.0.0";
  const KEY = "ginger.plan.v1";
  const PX = 24;
  const SNAP = 12;
  const $ = (id) => document.getElementById(id);
  const plan = $("plan");
  const ctx = plan.getContext("2d");
  const peek = $("peek");
  const pctx = peek.getContext("2d");
  let tool = "select";
  let lab = false;
  let theme = "paper";
  let draft = null;
  let selected = null;
  let hist = [];
  let future = [];
  const state = load() || seed();
  function uid(p) { return p + Math.random().toString(36).slice(2, 8); }
  function clone(s) { return JSON.parse(JSON.stringify(s)); }
  function snap(n) { return Math.round(n / SNAP) * SNAP; }
  function len(a, b) { return Math.hypot(b.x - a.x, b.y - a.y); }
  function ft(px) { return (px / PX).toFixed(1); }
  function pushHist() { hist.push(clone(state)); if (hist.length > 40) hist.shift(); future = []; }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify({ ver: VER, ...state })); } catch (_) {}
    draw(); schedules(); props(); if (lab) drawPeek();
  }
  function load() {
    try {
      const raw = localStorage.getItem(KEY); if (!raw) return null;
      const d = JSON.parse(raw);
      return { name: d.name || "Studio plan", walls: d.walls || [], rooms: d.rooms || [], doors: d.doors || [], windows: d.windows || [] };
    } catch (_) { return null; }
  }
  function seed() {
    return {
      name: "Studio plan",
      walls: [
        { id: "w1", a: { x: 120, y: 120 }, b: { x: 600, y: 120 }, th: 6 },
        { id: "w2", a: { x: 600, y: 120 }, b: { x: 600, y: 420 }, th: 6 },
        { id: "w3", a: { x: 600, y: 420 }, b: { x: 120, y: 420 }, th: 6 },
        { id: "w4", a: { x: 120, y: 420 }, b: { x: 120, y: 120 }, th: 6 }
      ],
      rooms: [{ id: "r1", name: "Studio", x: 140, y: 140, w: 440, h: 260 }],
      doors: [{ id: "d1", wall: "w3", t: 0.45, width: 36, type: "Swing" }],
      windows: [{ id: "n1", wall: "w1", t: 0.5, width: 48, type: "Fixed" }]
    };
  }
  function ptOnWall(w, t) { return { x: w.a.x + (w.b.x - w.a.x) * t, y: w.a.y + (w.b.y - w.a.y) * t }; }
  function nearestWall(p) {
    let best = null, bd = 18;
    for (const w of state.walls) {
      const d = distSeg(p, w.a, w.b);
      if (d.dist < bd) { bd = d.dist; best = { w, t: d.t, dist: d.dist }; }
    }
    return best;
  }
  function distSeg(p, a, b) {
    const vx = b.x - a.x, vy = b.y - a.y;
    const l2 = vx * vx + vy * vy || 1;
    let t = ((p.x - a.x) * vx + (p.y - a.y) * vy) / l2;
    t = Math.max(0, Math.min(1, t));
    const x = a.x + t * vx, y = a.y + t * vy;
    return { t, dist: Math.hypot(p.x - x, p.y - y) };
  }
  function eventPt(ev) {
    const r = plan.getBoundingClientRect();
    const x = ((ev.clientX - r.left) / r.width) * plan.width;
    const y = ((ev.clientY - r.top) / r.height) * plan.height;
    return { x: snap(x), y: snap(y), rawX: x, rawY: y };
  }
  function hit(p) {
    for (const rm of state.rooms) {
      if (p.rawX > rm.x && p.rawX < rm.x + rm.w && p.rawY > rm.y && p.rawY < rm.y + rm.h) return { kind: "room", id: rm.id };
    }
    const nw = nearestWall(p);
    if (nw && nw.dist < 10) {
      const d = state.doors.find((x) => x.wall === nw.w.id && Math.abs(x.t - nw.t) < 0.08);
      if (d) return { kind: "door", id: d.id };
      const w = state.windows.find((x) => x.wall === nw.w.id && Math.abs(x.t - nw.t) < 0.08);
      if (w) return { kind: "window", id: w.id };
      return { kind: "wall", id: nw.w.id };
    }
    return null;
  }
  function draw() {
    const cs = getComputedStyle(document.body);
    ctx.clearRect(0, 0, plan.width, plan.height);
    ctx.fillStyle = cs.getPropertyValue("--sheet");
    ctx.fillRect(0, 0, plan.width, plan.height);
    ctx.strokeStyle = cs.getPropertyValue("--grid");
    ctx.lineWidth = 1;
    for (let x = 0; x < plan.width; x += PX) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, plan.height); ctx.stroke(); }
    for (let y = 0; y < plan.height; y += PX) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(plan.width, y); ctx.stroke(); }
    ctx.fillStyle = cs.getPropertyValue("--room");
    for (const rm of state.rooms) {
      ctx.fillRect(rm.x, rm.y, rm.w, rm.h);
      ctx.fillStyle = cs.getPropertyValue("--ink");
      ctx.font = "14px sans-serif";
      ctx.fillText(rm.name + "  " + ((rm.w * rm.h) / (PX * PX)).toFixed(0) + " sf", rm.x + 10, rm.y + 22);
      ctx.fillStyle = cs.getPropertyValue("--room");
    }
    for (const w of state.walls) {
      ctx.strokeStyle = selected && selected.kind === "wall" && selected.id === w.id ? cs.getPropertyValue("--flash") : cs.getPropertyValue("--wall");
      ctx.lineWidth = w.th || 6;
      ctx.lineCap = "square";
      ctx.beginPath(); ctx.moveTo(w.a.x, w.a.y); ctx.lineTo(w.b.x, w.b.y); ctx.stroke();
    }
    for (const d of state.doors) {
      const w = state.walls.find((x) => x.id === d.wall); if (!w) continue;
      const c = ptOnWall(w, d.t);
      ctx.strokeStyle = cs.getPropertyValue("--door"); ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(c.x, c.y, 14, 0, Math.PI / 2); ctx.stroke();
      ctx.fillStyle = cs.getPropertyValue("--door"); ctx.fillRect(c.x - 3, c.y - 3, 6, 6);
    }
    for (const n of state.windows) {
      const w = state.walls.find((x) => x.id === n.wall); if (!w) continue;
      const c = ptOnWall(w, n.t);
      ctx.strokeStyle = cs.getPropertyValue("--win"); ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(c.x - 12, c.y - 12); ctx.lineTo(c.x + 12, c.y + 12); ctx.stroke();
    }
    if (draft) {
      ctx.strokeStyle = cs.getPropertyValue("--flash"); ctx.setLineDash([6, 4]); ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(draft.x, draft.y); ctx.lineTo(draft.mx, draft.my); ctx.stroke(); ctx.setLineDash([]);
    }
  }
  function drawPeek() {
    const cs = getComputedStyle(document.body);
    pctx.fillStyle = cs.getPropertyValue("--sheet"); pctx.fillRect(0, 0, peek.width, peek.height);
    const iso = (x, y, z) => ({ x: peek.width / 2 + (x - y) * 0.45, y: 40 + (x + y) * 0.25 - z * 0.5 });
    pctx.strokeStyle = cs.getPropertyValue("--wall"); pctx.lineWidth = 2;
    for (const w of state.walls) {
      const h = 48;
      const a0 = iso(w.a.x / 3, w.a.y / 3, 0), b0 = iso(w.b.x / 3, w.b.y / 3, 0);
      const a1 = iso(w.a.x / 3, w.a.y / 3, h), b1 = iso(w.b.x / 3, w.b.y / 3, h);
      pctx.beginPath(); pctx.moveTo(a0.x, a0.y); pctx.lineTo(b0.x, b0.y); pctx.lineTo(b1.x, b1.y); pctx.lineTo(a1.x, a1.y); pctx.closePath(); pctx.stroke();
    }
  }
  function schedules() {
    $("rooms").tBodies[0].innerHTML = state.rooms.map((r, i) => `<tr><td>R${i + 1}</td><td>${esc(r.name)}</td><td>${((r.w * r.h) / (PX * PX)).toFixed(0)}</td></tr>`).join("") || `<tr><td colspan=\"3\">None</td></tr>`;
    $("doors").tBodies[0].innerHTML = state.doors.map((d, i) => `<tr><td>D${i + 1}</td><td>${d.width}\"</td><td>${esc(d.type)}</td></tr>`).join("") || `<tr><td colspan=\"3\">None</td></tr>`;
    $("wins").tBodies[0].innerHTML = state.windows.map((n, i) => `<tr><td>W${i + 1}</td><td>${n.width}\"</td><td>${esc(n.type)}</td></tr>`).join("") || `<tr><td colspan=\"3\">None</td></tr>`;
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])); }
  function props() {
    const box = $("props");
    if (!selected) {
      box.innerHTML = `<p class=\"hint\">Project: ${esc(state.name)} · ${state.walls.length} walls.</p><label>Plan name</label><input id=\"pname\" value=\"${esc(state.name)}\" />`;
      $("pname").onchange = (e) => { pushHist(); state.name = e.target.value; save(); };
      return;
    }
    if (selected.kind === "wall") {
      const w = state.walls.find((x) => x.id === selected.id);
      box.innerHTML = `<p>Wall ${esc(w.id)} · ${ft(len(w.a, w.b))} ft</p><label>Thickness (px)</label><input id=\"th\" type=\"number\" min=\"2\" max=\"16\" value=\"${w.th || 6}\" /><button type=\"button\" id=\"del\">Delete wall</button>`;
      $("th").onchange = (e) => { pushHist(); w.th = +e.target.value; save(); };
      $("del").onclick = () => { pushHist(); state.walls = state.walls.filter((x) => x.id !== w.id); state.doors = state.doors.filter((x) => x.wall !== w.id); state.windows = state.windows.filter((x) => x.wall !== w.id); selected = null; save(); };
    }
    if (selected.kind === "room") {
      const r = state.rooms.find((x) => x.id === selected.id);
      box.innerHTML = `<label>Room name</label><input id=\"rn\" value=\"${esc(r.name)}\" /><p>${((r.w * r.h) / (PX * PX)).toFixed(0)} sf</p><button type=\"button\" id=\"del\">Delete room</button>`;
      $("rn").onchange = (e) => { pushHist(); r.name = e.target.value; save(); };
      $("del").onclick = () => { pushHist(); state.rooms = state.rooms.filter((x) => x.id !== r.id); selected = null; save(); };
    }
    if (selected.kind === "door" || selected.kind === "window") {
      const list = selected.kind === "door" ? state.doors : state.windows;
      const it = list.find((x) => x.id === selected.id);
      box.innerHTML = `<label>Width (in)</label><input id=\"wd\" type=\"number\" min=\"12\" max=\"96\" value=\"${it.width}\" /><label>Type</label><input id=\"tp\" value=\"${esc(it.type)}\" /><button type=\"button\" id=\"del\">Delete</button>`;
      $("wd").onchange = (e) => { pushHist(); it.width = +e.target.value; save(); };
      $("tp").onchange = (e) => { pushHist(); it.type = e.target.value; save(); };
      $("del").onclick = () => { pushHist(); if (selected.kind === "door") state.doors = state.doors.filter((x) => x.id !== it.id); else state.windows = state.windows.filter((x) => x.id !== it.id); selected = null; save(); };
    }
  }
  plan.addEventListener("pointerdown", (ev) => {
    plan.setPointerCapture(ev.pointerId);
    const p = eventPt(ev);
    if (tool === "select") { selected = hit(p); props(); draw(); return; }
    if (tool === "wall") {
      if (!draft) draft = { x: p.x, y: p.y, mx: p.x, my: p.y };
      else { pushHist(); state.walls.push({ id: uid("w"), a: { x: draft.x, y: draft.y }, b: { x: p.x, y: p.y }, th: 6 }); draft = null; save(); }
      return;
    }
    if (tool === "room") { draft = { kind: "room", x: p.x, y: p.y, mx: p.x, my: p.y }; return; }
    if (tool === "door" || tool === "window") {
      const nw = nearestWall(p);
      if (!nw) { $("status").textContent = "Hang that on a wall."; return; }
      pushHist();
      const item = { id: uid(tool[0]), wall: nw.w.id, t: nw.t, width: tool === "door" ? 36 : 48, type: tool === "door" ? "Swing" : "Fixed" };
      if (tool === "door") state.doors.push(item); else state.windows.push(item);
      selected = { kind: tool, id: item.id }; save();
    }
  });
  plan.addEventListener("pointermove", (ev) => { if (!draft) return; const p = eventPt(ev); draft.mx = p.x; draft.my = p.y; draw(); });
  plan.addEventListener("pointerup", (ev) => {
    if (draft && draft.kind === "room") {
      const p = eventPt(ev);
      const x = Math.min(draft.x, p.x), y = Math.min(draft.y, p.y);
      const w = Math.abs(p.x - draft.x), h = Math.abs(p.y - draft.y);
      draft = null;
      if (w > 24 && h > 24) { pushHist(); state.rooms.push({ id: uid("r"), name: "Room", x, y, w, h }); save(); } else draw();
    }
  });
  document.querySelectorAll("[data-tool]").forEach((btn) => {
    btn.addEventListener("click", () => {
      tool = btn.dataset.tool;
      document.querySelectorAll("[data-tool]").forEach((b) => b.setAttribute("aria-pressed", b === btn ? "true" : "false"));
      draft = null;
    });
  });
  $("undo").onclick = () => { if (!hist.length) return; future.push(clone(state)); Object.assign(state, hist.pop()); save(); };
  $("redo").onclick = () => { if (!future.length) return; hist.push(clone(state)); Object.assign(state, future.pop()); save(); };
  $("theme").onclick = () => { theme = theme === "paper" ? "night" : "paper"; document.body.setAttribute("data-theme", theme); $("theme").textContent = theme === "paper" ? "Night CAD" : "Paper CAD"; draw(); if (lab) drawPeek(); };
  $("lab3d").onclick = () => { lab = !lab; $("peekWrap").classList.toggle("on", lab); if (lab) drawPeek(); };
  $("export").onclick = () => { const blob = new Blob([JSON.stringify({ app: "ginger", ver: VER, ...state }, null, 2)], { type: "application/json" }); const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = (state.name || "plan").replace(/\s+/g, "-") + ".ginger.json"; a.click(); };
  $("imp").onclick = () => $("file").click();
  $("file").onchange = (e) => {
    const f = e.target.files[0]; if (!f) return;
    const rd = new FileReader();
    rd.onload = () => { try { const d = JSON.parse(rd.result); pushHist(); state.name = d.name || state.name; state.walls = d.walls || []; state.rooms = d.rooms || []; state.doors = d.doors || []; state.windows = d.windows || []; save(); } catch (err) { $("status").textContent = "Could not read that file."; } };
    rd.readAsText(f);
  };
  $("chip").textContent = "v" + VER;
  save();
})();
