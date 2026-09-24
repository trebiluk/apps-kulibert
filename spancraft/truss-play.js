// Shared truss board for SpanCraft and Spire Lab.
// Stretch a member from joint to joint. Test is a pin-joint check, not a gradebook.

import { proveTruss } from "./truss-prove.js";
import {
  quietMode,
  readFlag,
  writeFlag,
  readJson,
  writeJson,
  runProveTheater,
  mountHelpOverlay,
  wireEdgeHelp,
} from "../shared/engage-help.js";

const PROVE = { stiffness: 0.99, load: 0.02, steps: 140, nudge: 0.0008 };

export function mountTruss(cfg) {
  const canvas = document.getElementById("board");
  const ctx = canvas.getContext("2d");
  const capWord = document.getElementById("cap-word");
  const capText = document.getElementById("cap-text");
  const capMark = document.getElementById("cap-mark");
  const caption = document.getElementById("caption");
  const retryBtn = document.getElementById("retry");
  const assistBtn = document.getElementById("assist");
  const levels = cfg.levels;
  const freeLevel = cfg.freeLevel;
  const catalog = levels.concat([freeLevel]);

  const state = {
    track: "levels",
    levelId: levels[0].id,
    joints: [],
    members: [],
    cleared: {},
    toys: [],
    tool: "joint",
    phase: "idle",
    bet: null,
    stretch: null,
    drag: null,
    view: null,
    bestStars: 0,
    challengeMet: false,
    scale: 1,
    origin: { x: 40, y: 40 },
  };

  const art = {};
  function knockOut(img) {
    const c = document.createElement("canvas");
    const w = img.naturalWidth || img.width;
    const h = img.naturalHeight || img.height;
    c.width = w;
    c.height = h;
    const g = c.getContext("2d");
    g.drawImage(img, 0, 0);
    try {
      const data = g.getImageData(0, 0, w, h);
      const d = data.data;
      for (let i = 0; i < d.length; i += 4) {
        if (d[i] + d[i + 1] + d[i + 2] < 78) d[i + 3] = 0;
      }
      g.putImageData(data, 0, 0);
    } catch (err) {
      return img;
    }
    return c;
  }
  if (cfg.workshop) {
    const names = [
      "world-sky", "world-water", "world-ground",
      "abutment-left", "abutment-right", "pier", "deck-panel", "steel-member",
      "gusset-joint", "tower-base-pad", "tower-block",
    ];
    for (const name of names) {
      const img = new Image();
      img.onload = () => {
        art[name] = name.indexOf("world-") === 0 ? img : knockOut(img);
        draw();
      };
      img.src = "/holdit/art/" + name + ".png";
    }
  }

  function jointHint() {
    const n = state.joints.length;
    if (!cfg.workshop) return cfg.assistText;
    if (n === 0) return "Tap the board to place a joint.";
    if (n === 1 || state.stretch) return "Tap or let go where the other end goes.";
    return "Let go on a joint to connect.";
  }
  function assistOn() {
    return !!(assistBtn && assistBtn.getAttribute("aria-pressed") === "true");
  }
  function faceName(level) {
    if (cfg.workshop && level.free) return "Your build";
    return level.name;
  }
  function faceJob(level) {
    if (!cfg.workshop || !level.free) return level.job;
    return cfg.mode === "spire"
      ? "Your tower. Test pushes from both sides."
      : "Your bridge across 40 m. Test tries the load at three joints.";
  }
  function syncAssistCue() {
    if (!cfg.workshop) return;
    const on = assistOn();
    const cue = document.getElementById("assist-cue");
    const text = jointHint();
    if (cue) {
      cue.hidden = !on;
      if (on) cue.removeAttribute("hidden");
      const span = cue.querySelector("span");
      if (span && span.textContent !== text) span.textContent = text;
    }
    const plate = document.getElementById("assist-plate");
    const plateText = document.getElementById("assist-plate-text");
    if (!plate) return;
    if (!on) {
      plate.classList.remove("show");
      plate.hidden = true;
      plate.setAttribute("hidden", "");
      return;
    }
    if (plateText && plateText.textContent !== text) plateText.textContent = text;
    plate.classList.add("show");
    plate.hidden = false;
    plate.removeAttribute("hidden");
    if (capWord && (capWord.textContent === "Ready" || capWord.textContent === "Assist")) {
      capWord.textContent = "Assist";
      capText.textContent = text;
    }
  }
  let cssW = 0;
  let cssH = 0;
  let plateTimer = 0;
  let theater = null;

  function levelById(id) {
    return catalog.find((l) => l.id === id) || levels[0];
  }
  function active() {
    return levelById(state.levelId);
  }
  function onFree() {
    return !!active().free || state.track === "challenge";
  }
  function pathClear() {
    return levels.every((l) => state.cleared[l.id]);
  }
  function cloneLevel(level) {
    const src = level.joints || [];
    state.joints = src.map((j) => ({ x: j.x, y: j.y, fixed: !!j.fixed }));
    state.members = (level.seed || []).map((m) => ({ a: m.a, b: m.b }));
    state.view = null;
    state.stretch = null;
    state.drag = null;
    state.bet = null;
  }

  function save() {
    writeJson(cfg.engageKey, {
      v: 2,
      levelId: state.levelId,
      cleared: state.cleared,
      track: state.track,
      challengeMet: state.challengeMet,
      bestStars: state.bestStars,
    });
    if (cfg.partFlag && pathClear()) {
      writeFlag(cfg.partFlag, true);
      if (cfg.pairFlag && cfg.retireFlag && readFlag(cfg.pairFlag)) writeFlag(cfg.retireFlag, true);
    }
  }
  function load() {
    let data = readJson(cfg.engageKey, null);
    if ((!data || data.v !== 2) && cfg.seedKey) {
      const old = readJson(cfg.seedKey, null);
      if (old && old.v === 2) data = old;
    }
    if (!data || data.v !== 2) return;
    state.cleared = data.cleared && typeof data.cleared === "object" ? data.cleared : {};
    state.levelId = catalog.some((l) => l.id === data.levelId) ? data.levelId : levels[0].id;
    state.track = data.track === "challenge" ? "challenge" : "levels";
    state.challengeMet = !!data.challengeMet;
    state.bestStars = data.bestStars || 0;
    if (state.track === "challenge" && !pathClear()) state.track = "levels";
    if (state.track !== "challenge" && active().free) state.levelId = levels[0].id;
    if (cfg.partFlag && pathClear()) save();
  }

  function setStatus(word, text, tone) {
    capWord.textContent = word;
    capText.textContent = text;
    if (capMark) capMark.textContent = tone === "pass" ? "✓" : tone === "fail" ? "✕" : "";
    caption.className = "caption" + (tone ? " " + tone : "");
  }
  function starPhrase(n) {
    if (!n) return "";
    return "★".repeat(n) + "☆".repeat(Math.max(0, 4 - n)) + " " + (n === 1 ? "1 star" : n + " stars");
  }
  function starsFor(ok, memberCount, budget, sag, limit) {
    if (!ok) return 0;
    let n = 1;
    if (memberCount <= budget + 2) n = 2;
    if (memberCount <= budget) n = 3;
    if (memberCount <= budget && sag <= limit * 0.9) n = 4;
    return n;
  }
  function showPlate(shout, captionText, mark) {
    const plate = document.getElementById("flash-plate");
    if (!plate) return;
    const shoutEl = document.getElementById("flash-shout");
    const capEl = document.getElementById("flash-caption");
    const markEl = document.getElementById("flash-mark");
    if (shoutEl) shoutEl.textContent = shout;
    if (capEl) capEl.textContent = captionText;
    if (markEl) markEl.textContent = mark || "";
    plate.hidden = false;
    plate.removeAttribute("hidden");
    window.clearTimeout(plateTimer);
    plateTimer = window.setTimeout(() => {
      plate.hidden = true;
      plate.setAttribute("hidden", "");
    }, quietMode() ? 700 : 1500);
  }
  function armRetry(on) {
    if (!retryBtn) return;
    retryBtn.classList.toggle("is-needed", !!on);
    retryBtn.hidden = false;
    retryBtn.disabled = false;
    const now = document.getElementById("retry-now");
    if (now) now.hidden = !on;
  }
  function paintReadout() {
    const level = active();
    const nEl = document.getElementById("budget-n");
    const spanEl = document.getElementById("span-m");
    if (nEl) nEl.textContent = String(state.members.length);
    if (spanEl) spanEl.textContent = (level.spanM || 0) + " m";
    const maxEl = document.getElementById("budget-max");
    if (maxEl) maxEl.textContent = String(level.budget);
    const goalN = document.getElementById("goal-n");
    const goalM = document.getElementById("goal-m");
    const heightN = document.getElementById("height-n");
    const h = heightM(state.joints);
    if (heightN) heightN.textContent = String(Math.round(h));
    if (goalN) goalN.textContent = String(level.goalM || 0);
    if (goalM) goalM.textContent = (level.goalM || 0) + " m";
    const chip = document.getElementById("mastery-chip");
    if (chip && state.bestStars) {
      chip.hidden = false;
      chip.textContent = "Best ★ " + state.bestStars + "/4";
    }
  }
  function heightM(joints) {
    const bases = joints.filter((j) => j.fixed);
    if (!bases.length || joints.length < 2) return 0;
    const baseY = Math.max(...bases.map((j) => j.y));
    const top = Math.min(...joints.map((j) => j.y));
    return Math.max(0, (baseY - top) / 15);
  }
  function coach() {
    const level = active();
    if (onFree()) {
      setStatus(
        state.challengeMet ? "CLEAR" : "Challenge",
        state.challengeMet ? (cfg.workshop ? "Your build passed the test. " : "Your truss passed the test. ") + faceJob(level) : faceJob(level),
        state.challengeMet ? "pass" : "",
      );
      return;
    }
    if (!state.cleared[levels[0].id] && level.id === levels[0].id && state.members.length === 0) {
      setStatus("Ready", cfg.firstLine, "");
      return;
    }
    if (state.members.length === 1 && level.n === 1) {
      setStatus("Job 1", "One side is in. Stretch the other joint up to the same top joint.", "");
      return;
    }
    setStatus("Job " + level.n, level.job, "");
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    cssW = Math.max(320, rect.width);
    cssH = Math.max(240, rect.height);
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    fit();
    draw();
  }
  function pointsForFit() {
    const level = active();
    const pts = (level.slots || level.joints || []).concat(state.joints);
    return pts.length ? pts : [{ x: 0, y: 0 }, { x: 200, y: 120 }];
  }
  function fit() {
    const pts = pointsForFit();
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const p of pts) {
      minX = Math.min(minX, p.x);
      minY = Math.min(minY, p.y);
      maxX = Math.max(maxX, p.x);
      maxY = Math.max(maxY, p.y);
    }
    const bw = Math.max(80, maxX - minX);
    const bh = Math.max(80, maxY - minY);
    const padX = 80;
    const padTop = 48;
    const padBot = 220;
    state.scale = Math.min((cssW - padX) / bw, (cssH - padTop - padBot) / bh);
    state.origin = {
      x: (cssW - bw * state.scale) / 2 - minX * state.scale,
      y: padTop + (cssH - padTop - padBot - bh * state.scale) / 2 - minY * state.scale,
    };
  }
  function toScreen(p) {
    return {
      x: state.origin.x + p.x * state.scale,
      y: state.origin.y + p.y * state.scale,
    };
  }
  function toModel(sx, sy) {
    return {
      x: (sx - state.origin.x) / state.scale,
      y: (sy - state.origin.y) / state.scale,
    };
  }
  function eventPoint(ev) {
    const rect = canvas.getBoundingClientRect();
    return { x: ev.clientX - rect.left, y: ev.clientY - rect.top };
  }
  function nearestJoint(sx, sy, radius) {
    const joints = state.view ? state.view.joints : state.joints;
    let best = -1;
    let bestD = radius == null ? 56 : radius;
    joints.forEach((j, i) => {
      const p = toScreen(j);
      const d = Math.hypot(p.x - sx, p.y - sy);
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    });
    return best;
  }
  function nearestSlot(model) {
    const slots = active().slots || [];
    let best = null;
    let bestD = 28 / state.scale;
    for (const s of slots) {
      const taken = state.joints.some((j) => Math.hypot(j.x - s.x, j.y - s.y) < 8);
      if (taken) continue;
      const d = Math.hypot(s.x - model.x, s.y - model.y);
      if (d < bestD) {
        bestD = d;
        best = s;
      }
    }
    return best;
  }
  function memberAt(sx, sy) {
    const joints = state.joints;
    let best = -1;
    let bestD = 16;
    state.members.forEach((m, i) => {
      const a = toScreen(joints[m.a]);
      const b = toScreen(joints[m.b]);
      if (!a || !b) return;
      const d = distToSeg(sx, sy, a.x, a.y, b.x, b.y);
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    });
    return best;
  }
  function distToSeg(px, py, ax, ay, bx, by) {
    const abx = bx - ax;
    const aby = by - ay;
    const t = Math.max(0, Math.min(1, ((px - ax) * abx + (py - ay) * aby) / (abx * abx + aby * aby || 1)));
    return Math.hypot(px - (ax + abx * t), py - (ay + aby * t));
  }
  function hasMember(a, b) {
    return state.members.some((m) => (m.a === a && m.b === b) || (m.a === b && m.b === a));
  }
  function addMember(a, b) {
    if (a === b || a < 0 || b < 0) return false;
    if (hasMember(a, b)) return false;
    const A = state.joints[a];
    const B = state.joints[b];
    if (!A || !B) return false;
    if (Math.hypot(A.x - B.x, A.y - B.y) > 175) {
      setStatus("Member", "That reach is too long. Connect nearby joints so you get a triangle.", "");
      return false;
    }
    state.members.push({ a, b });
    return true;
  }

  function paintWorld(joints) {
    const sky = art["world-sky"];
    if (sky) ctx.drawImage(sky, 0, 0, cssW, Math.max(80, cssH * 0.78));
    else {
      const g = ctx.createLinearGradient(0, 0, 0, cssH);
      g.addColorStop(0, "#b7c4ce");
      g.addColorStop(1, "#6d7f8c");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, cssW, cssH);
    }
    const bases = joints.filter((j) => j.fixed);
    const baseY = bases.length ? Math.max(...bases.map((j) => toScreen(j).y)) : cssH * 0.72;
    if (cfg.mode === "span") {
      const water = art["world-water"];
      if (water) ctx.drawImage(water, 0, baseY - 6, cssW, cssH - baseY + 6);
      else {
        ctx.fillStyle = "#3e5963";
        ctx.fillRect(0, baseY, cssW, cssH - baseY);
      }
      const fixed = bases.slice().sort((a, b) => a.x - b.x);
      if (fixed.length && art["abutment-left"]) {
        const p = toScreen(fixed[0]);
        ctx.drawImage(art["abutment-left"], p.x - 78, p.y - 28, 96, 96);
      }
      if (fixed.length > 1 && art["abutment-right"]) {
        const p = toScreen(fixed[fixed.length - 1]);
        ctx.drawImage(art["abutment-right"], p.x - 18, p.y - 28, 96, 96);
      }
      if (fixed.length > 1 && art["deck-panel"]) {
        const a = toScreen(fixed[0]);
        const b = toScreen(fixed[fixed.length - 1]);
        ctx.drawImage(art["deck-panel"], a.x, a.y - 16, Math.max(20, b.x - a.x), 24);
      }
      if (fixed.length > 1 && art["pier"]) {
        const mid = toScreen({
          x: (fixed[0].x + fixed[fixed.length - 1].x) / 2,
          y: fixed[0].y,
        });
        ctx.drawImage(art["pier"], mid.x - 16, mid.y - 8, 32, 78);
      }
    } else {
      const ground = art["world-ground"];
      if (ground) ctx.drawImage(ground, 0, baseY - 24, cssW, cssH - baseY + 24);
      else {
        ctx.fillStyle = "#6d655a";
        ctx.fillRect(0, baseY, cssW, cssH - baseY);
      }
      if (bases.length && art["tower-base-pad"]) {
        const xs = bases.map((j) => toScreen(j).x);
        const left = Math.min(...xs);
        const right = Math.max(...xs);
        ctx.drawImage(art["tower-base-pad"], left - 40, baseY - 16, Math.max(80, right - left + 80), 52);
        if (art["tower-block"]) {
          ctx.drawImage(art["tower-block"], (left + right) / 2 - 24, baseY - 62, 48, 48);
        }
      }
    }
  }

  function draw() {
    ctx.clearRect(0, 0, cssW, cssH);
    const level = active();
    const joints = state.view ? state.view.joints : state.joints;
    if (cfg.workshop) {
      paintWorld(joints);
    } else {
      ctx.fillStyle = "#07101f";
      ctx.fillRect(0, 0, cssW, cssH);
      if (cfg.mode === "span") {
        const base = toScreen({ x: 0, y: 250 });
        ctx.fillStyle = "#12324a";
        ctx.fillRect(0, base.y, cssW, cssH - base.y);
      }
    }
    for (const j of joints) {
      if (!j.fixed) continue;
      const p = toScreen(j);
      ctx.fillStyle = "#1e293b";
      ctx.fillRect(p.x - 36, p.y - 6, 72, 30);
      ctx.fillStyle = "#334155";
      ctx.fillRect(p.x - 36, p.y + 18, 72, 8);
    }
    const slots = level.slots || [];
    ctx.strokeStyle = "rgba(143,180,201,0.45)";
    ctx.lineWidth = 2;
    for (const s of slots) {
      const taken = state.joints.some((j) => Math.hypot(j.x - s.x, j.y - s.y) < 8);
      if (taken) continue;
      const p = toScreen(s);
      ctx.beginPath();
      ctx.arc(p.x, p.y, 12, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.lineCap = "butt";
    ctx.lineJoin = "round";
    for (const m of state.members) {
      const a = joints[m.a];
      const b = joints[m.b];
      if (!a || !b) continue;
      const pa = toScreen(a);
      const pb = toScreen(b);
      ctx.beginPath();
      ctx.moveTo(pa.x, pa.y);
      ctx.lineTo(pb.x, pb.y);
      ctx.strokeStyle = cfg.workshop ? "#3f4a55" : "#155e75";
      ctx.lineWidth = cfg.workshop ? 12 : 16;
      ctx.stroke();
      ctx.strokeStyle = cfg.workshop ? (cfg.mode === "spire" ? "#c4b5fd" : "#99f6e4") : "#a5f3fc";
      ctx.lineWidth = cfg.workshop ? 3 : 7;
      ctx.stroke();
    }
    if (cfg.workshop && assistOn() && !state.stretch && !state.view && joints.length >= 2) {
      let pair = null;
      const target = joints[level.loadIndex] ? level.loadIndex : 0;
      for (let i = 0; i < joints.length; i++) {
        if (i !== target && !hasMember(i, target)) {
          pair = [i, target];
          break;
        }
      }
      if (!pair) {
        for (let i = 0; i < joints.length && !pair; i++) {
          for (let j = i + 1; j < joints.length; j++) {
            if (!hasMember(i, j)) {
              pair = [i, j];
              break;
            }
          }
        }
      }
      if (pair) {
        const ga = toScreen(joints[pair[0]]);
        const gb = toScreen(joints[pair[1]]);
        ctx.save();
        ctx.globalAlpha = 0.5;
        ctx.setLineDash([12, 8]);
        ctx.lineCap = "round";
        ctx.strokeStyle = "#f8fafc";
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(ga.x, ga.y);
        ctx.lineTo(gb.x, gb.y);
        ctx.stroke();
        const ang = Math.atan2(gb.y - ga.y, gb.x - ga.x);
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.moveTo(gb.x, gb.y);
        ctx.lineTo(gb.x - 16 * Math.cos(ang - 0.45), gb.y - 16 * Math.sin(ang - 0.45));
        ctx.lineTo(gb.x - 16 * Math.cos(ang + 0.45), gb.y - 16 * Math.sin(ang + 0.45));
        ctx.closePath();
        ctx.fillStyle = "#f8fafc";
        ctx.fill();
        ctx.restore();
      }
    }
    if (state.stretch) {
      const a = toScreen(state.joints[state.stretch.from]);
      const aim = nearestJoint(state.stretch.sx, state.stretch.sy, 64);
      const end = aim >= 0 ? toScreen(state.joints[aim]) : { x: state.stretch.sx, y: state.stretch.sy };
      ctx.save();
      ctx.setLineDash(aim >= 0 ? [] : [8, 8]);
      ctx.strokeStyle = "#fbbf24";
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();
      ctx.restore();
      if (aim >= 0 && aim !== state.stretch.from) {
        ctx.beginPath();
        ctx.arc(end.x, end.y, 26, 0, Math.PI * 2);
        ctx.strokeStyle = "#fbbf24";
        ctx.lineWidth = 3;
        ctx.stroke();
      }
    }
    joints.forEach((j, i) => {
      const p = toScreen(j);
      if (cfg.workshop && art["gusset-joint"]) {
        ctx.drawImage(art["gusset-joint"], p.x - 16, p.y - 16, 32, 32);
      }
      ctx.beginPath();
      ctx.arc(p.x, p.y, cfg.workshop ? 11 : (j.fixed ? 18 : 16), 0, Math.PI * 2);
      ctx.fillStyle = j.fixed ? "#e2e8f0" : "#67e8f9";
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = "#0f172a";
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = "#0f172a";
      ctx.fill();
      if (!state.view && i === level.loadIndex && !level.free) {
        ctx.fillStyle = "#fbbf24";
        ctx.fillRect(p.x - 16, p.y + 16, 32, 14);
      }
    });
    if (state.view && state.view.weight) {
      const w = toScreen(state.view.weight);
      ctx.fillStyle = "#fbbf24";
      ctx.fillRect(w.x - 18, w.y - 12, 36, 20);
    }
    const meters = level.spanM || level.goalM;
    if (meters && !state.view) {
      ctx.fillStyle = "#cbd5e1";
      ctx.font = "700 18px sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(cfg.mode === "spire" ? meters + " m height" : meters + " m span", 16, 28);
    }
    paintReadout();
    syncAssistCue();
  }

  function syncTrack() {
    const levelsBtn = document.getElementById("track-levels");
    const chal = document.getElementById("track-challenge");
    const brief = document.getElementById("brief");
    const free = onFree();
    if (levelsBtn) levelsBtn.setAttribute("aria-pressed", free ? "false" : "true");
    if (chal) {
      chal.setAttribute("aria-pressed", free ? "true" : "false");
      const open = pathClear();
      chal.classList.toggle("is-locked", !open);
      chal.setAttribute("aria-disabled", open ? "false" : "true");
      if (cfg.workshop) {
        const label = chal.querySelector(".chal-label");
        if (label) label.textContent = open ? "Challenge" : "Clear Levels first";
      }
    }
    if (brief) {
      brief.hidden = !free;
      if (free) brief.textContent = faceJob(freeLevel);
    }
  }
  function syncTools() {
    for (const id of ["tool-add", "tool-move", "tool-delete"]) {
      const btn = document.getElementById(id);
      if (!btn) continue;
      const name = id === "tool-add" ? "joint" : id === "tool-move" ? "move" : "delete";
      btn.setAttribute("aria-pressed", state.tool === name ? "true" : "false");
    }
  }
  function busy() {
    return state.phase === "play" || state.phase === "theater";
  }

  function beginLevel(id) {
    state.levelId = id;
    if (levelById(id).free) state.track = "challenge";
    else state.track = "levels";
    cloneLevel(active());
    state.phase = "idle";
    armRetry(false);
    save();
    syncTrack();
    coach();
    resize();
  }

  function renderMap() {
    const grid = document.getElementById("isle-grid");
    if (!grid) return;
    grid.innerHTML = "";
    for (const level of catalog) {
      const locked = level.free ? !pathClear() : (level.n > 1 && !state.cleared[levels[level.n - 2].id] && !state.cleared[level.id]);
      const open = !locked;
      const st = state.cleared[level.id] ? "clear" : locked ? "locked" : "active";
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "isle-card";
      btn.dataset.state = st;
      btn.disabled = locked;
      const tag = state.cleared[level.id] ? "Done" : locked ? "Locked" : (level.id === state.levelId ? "Now" : "Open");
      const band = level.free ? "After the path" : (level.n + " · " + level.band);
      btn.innerHTML =
        '<span class="isle-tag">' + band + " · " + tag + "</span>" +
        "<h3>" + faceName(level) + "</h3>" +
        "<p>" + faceJob(level) + "</p>" +
        '<span class="isle-toy">Stars show this try</span>';
      btn.addEventListener("click", () => {
        if (!open) return;
        closeMap();
        beginLevel(level.id);
      });
      grid.appendChild(btn);
    }
  }
  function openMap() {
    const map = document.getElementById("isle-map");
    if (!map) return;
    renderMap();
    map.hidden = false;
    map.removeAttribute("hidden");
  }
  function closeMap() {
    const map = document.getElementById("isle-map");
    if (!map) return;
    map.hidden = true;
    map.setAttribute("hidden", "");
  }

  function failReason(result) {
    if (result.reason === "few") return "Stretch at least two members, then Test.";
    if (result.reason === "lean") return "It leaned. Add a diagonal, then Test.";
    if (result.reason === "short") return "It is short of the height goal. Add another story.";
    return "It sagged. Add a triangle, then Test.";
  }

  function runCheck() {
    const level = active();
    const opts = {
      ...PROVE,
      sagLimit: level.sagLimit,
      leanLimit: level.leanLimit,
      nudge: level.nudge || PROVE.nudge,
    };
    if (state.joints.length < 2 || state.members.length < 2) {
      return { ok: false, reason: "few", sag: 99, lean: 0, frames: [] };
    }
    if (cfg.mode === "spire") {
      const h = heightM(state.joints);
      if (h + 0.2 < (level.goalM || 0)) {
        return { ok: false, reason: "short", sag: 0, lean: 0, frames: [] };
      }
    }
    if (level.free && cfg.mode === "span") {
      const free = state.joints.map((j, i) => ({ j, i })).filter((x) => !x.j.fixed);
      if (free.length < 3) return { ok: false, reason: "few", sag: 99, lean: 0, frames: [] };
      free.sort((a, b) => a.j.x - b.j.x);
      const picks = [free[0].i, free[Math.floor(free.length / 2)].i, free[free.length - 1].i];
      let worst = null;
      for (const loadIndex of picks) {
        const r = proveTruss({ joints: state.joints, members: state.members, loadIndex }, opts);
        if (!r.ok) return r;
        if (!worst || r.sag > worst.sag) worst = r;
      }
      return worst;
    }
    if (level.free && cfg.mode === "spire") {
      let top = 0;
      state.joints.forEach((j, i) => {
        if (j.y < state.joints[top].y) top = i;
      });
      const a = proveTruss({ joints: state.joints, members: state.members, loadIndex: top }, { ...opts, nudgeSign: 1 });
      if (!a.ok) return a;
      const b = proveTruss({ joints: state.joints, members: state.members, loadIndex: top }, { ...opts, nudgeSign: -1 });
      return b.ok ? a : b;
    }
    return proveTruss({
      joints: state.joints,
      members: state.members,
      loadIndex: level.loadIndex,
    }, opts);
  }

  function finish(result) {
    state.phase = "idle";
    state.view = null;
    const level = active();
    const held = !!result.ok;
    const onBudget = state.members.length <= level.budget;
    const met = held && (!level.onBudget || onBudget);
    const stars = starsFor(held, state.members.length, level.budget, result.sag || 0, level.sagLimit || 30);
    if (stars > state.bestStars) state.bestStars = stars;
    let first = false;
    if (met) {
      first = !state.cleared[level.id] && level.id === levels[0].id;
      state.cleared[level.id] = true;
      if (level.free) state.challengeMet = true;
    }
    save();
    syncTrack();
    armRetry(!held);
    const chip = document.getElementById("mastery-chip");
    if (chip) {
      chip.hidden = stars === 0;
      if (stars) chip.textContent = "★ " + stars + "/4";
    }
    if (!held) {
      const line = failReason(result);
      setStatus("Fail", line, "fail");
      showPlate("Miss", line, "✕");
    } else if (!met) {
      const line = "It held. This job still needs fewer members than Budget.";
      setStatus("TEST PASS", line + " " + starPhrase(stars) + ".", "pass");
      showPlate("TEST PASS", line, "✓");
    } else {
      let line = level.job + " " + starPhrase(stars) + ".";
      if (first) line = "First clear. " + line;
      if (!level.free && level.id === levels[levels.length - 1].id && pathClear()) {
        line += " Path clear. This challenge stays yours.";
      } else if (!level.free && !pathClear()) {
        line += " Open Levels for the next job.";
      }
      setStatus("CLEAR", "Test pass. " + line, "pass");
      showPlate("CLEAR", line, "✓");
    }
    if (state.bet) {
      const saidHold = state.bet === "hold";
      const right = saidHold === held;
      const extra = right ? " Bet matched." : " Bet missed.";
      capText.textContent = capText.textContent + extra;
      state.bet = null;
      syncBet();
    }
    draw();
    showNext();
  }

  function playResult(result) {
    const frames = result.frames || [];
    if (quietMode() || frames.length < 2) {
      finish(result);
      return;
    }
    state.phase = "play";
    let i = 0;
    const step = () => {
      if (state.phase !== "play") return;
      state.view = frames[i];
      draw();
      i += 1;
      if (i < frames.length) requestAnimationFrame(step);
      else finish(result);
    };
    requestAnimationFrame(step);
  }

  function startTest() {
    if (busy()) return;
    state.stretch = null;
    state.drag = null;
    armRetry(false);
    const go = () => {
      theater = null;
      state.phase = "play";
      const result = runCheck();
      playResult(result);
    };
    const level = active();
    state.phase = "theater";
    theater = runProveTheater({
      setStatus,
      totalMs: cfg.mode === "span" ? 1500 : 1200,
      lines: cfg.mode === "span"
        ? [["Span", (level.spanM || 0) + " m."], ["Load", cfg.workshop ? "One load hangs on the bridge." : "One load hangs on the truss."], ["Watch", "Triangles stay. Squares fold."]]
        : [["Height", (level.goalM || 0) + " m goal."], ["Load", "A weight sits on the top."], ["Watch", "A diagonal keeps the story from folding."]],
      onDone: go,
    });
  }

  function retry() {
    if (theater && theater.cancel) theater.cancel();
    theater = null;
    state.phase = "idle";
    cloneLevel(active());
    armRetry(false);
    coach();
    draw();
  }

  function syncBet() {
    const bar = document.getElementById("bet-bar");
    if (!bar) return;
    bar.hidden = state.members.length === 0 || state.phase !== "idle";
    const label = bar.querySelector(".bet-label");
    if (label) label.textContent = cfg.workshop ? "Will it hold?" : "Will the truss hold?";
    for (const btn of bar.querySelectorAll(".bet-chip")) {
      btn.setAttribute("aria-pressed", btn.dataset.bet === state.bet ? "true" : "false");
    }
  }

  function placeEnd(from, sx, sy) {
    const A = state.joints[from];
    if (!A) return false;
    const m = toModel(sx, sy);
    const dx = m.x - A.x;
    const dy = m.y - A.y;
    const len = Math.hypot(dx, dy);
    if (len < 28) {
      setStatus("Stretch", "Tap or let go where the other end goes.", "");
      return false;
    }
    const cap = 175;
    const scale = len > cap ? cap / len : 1;
    state.joints.push({ x: A.x + dx * scale, y: A.y + dy * scale, fixed: false });
    state.members.push({ a: from, b: state.joints.length - 1 });
    return true;
  }
  function finishPointer(ev) {
    const s = eventPoint(ev);
    if (state.drag != null) {
      state.drag = null;
      draw();
      return;
    }
    if (!state.stretch) return;
    const from = state.stretch.from;
    state.stretch = null;
    const hit = nearestJoint(s.x, s.y, 64);
    if (hit < 0) {
      if (cfg.workshop && state.joints.length < 2) {
        if (placeEnd(from, s.x, s.y)) {
          syncBet();
          coach();
        }
      } else if (cfg.workshop || state.joints.length >= 2) {
        setStatus("Stretch", "Let go on a joint to connect.", "");
      } else {
        setStatus("Stretch", "Tap or let go where the other end goes.", "");
      }
    } else if (!addMember(from, hit)) {
      if (from !== hit && hasMember(from, hit)) {
        setStatus("Stretch", "That side is in. Stretch the other joint up to the top.", "");
      }
    } else {
      syncBet();
      coach();
    }
    draw();
  }
  canvas.addEventListener("pointerdown", (ev) => {
    if (busy()) return;
    if (canvas.setPointerCapture) canvas.setPointerCapture(ev.pointerId);
    const s = eventPoint(ev);
    const hit = nearestJoint(s.x, s.y, 56);
    if (state.tool === "delete") {
      if (hit >= 0 && !state.joints[hit].fixed) {
        state.joints.splice(hit, 1);
        state.members = state.members
          .filter((m) => m.a !== hit && m.b !== hit)
          .map((m) => ({
            a: m.a > hit ? m.a - 1 : m.a,
            b: m.b > hit ? m.b - 1 : m.b,
          }));
      } else {
        const mi = memberAt(s.x, s.y);
        if (mi >= 0) state.members.splice(mi, 1);
      }
      coach();
      draw();
      return;
    }
    if (state.tool === "move" && hit >= 0 && !state.joints[hit].fixed) {
      state.drag = hit;
      return;
    }
    if (hit >= 0) {
      state.stretch = { from: hit, sx: s.x, sy: s.y };
      if (cfg.workshop && state.joints.length < 2) {
        setStatus("Stretch", "Tap or let go where the other end goes.", "");
      }
      draw();
      return;
    }
    if (state.tool === "joint") {
      const model = toModel(s.x, s.y);
      const slot = nearestSlot(model);
      if (slot) {
        state.joints.push({ x: slot.x, y: slot.y, fixed: !!slot.fixed });
      } else if (cfg.workshop) {
        state.joints.push({ x: model.x, y: model.y, fixed: false });
      } else {
        return;
      }
      setStatus("Joint", state.joints.length < 2 ? "Tap or let go where the other end goes." : "Let go on a joint to connect.", "");
      if (!cfg.workshop) coach();
      draw();
    }
  });
  window.addEventListener("pointermove", (ev) => {
    if (!state.stretch && state.drag == null) return;
    const s = eventPoint(ev);
    if (state.drag != null) {
      const m = toModel(s.x, s.y);
      state.joints[state.drag].x = m.x;
      state.joints[state.drag].y = m.y;
      draw();
      return;
    }
    state.stretch.sx = s.x;
    state.stretch.sy = s.y;
    draw();
  });
  window.addEventListener("pointerup", finishPointer);
  window.addEventListener("pointercancel", finishPointer);

  function setTool(name) {
    if (busy()) return;
    state.tool = name;
    syncTools();
  }

  const helpApi = mountHelpOverlay({
    title: cfg.helpTitle,
    version: cfg.version,
    note: cfg.note,
    classHref: "./changelog.html",
    calmKey: cfg.calmKey,
    steps: cfg.steps,
    onReplayIntro: () => {
      writeFlag(cfg.assistKey, false);
      openAssist();
    },
  });
  wireEdgeHelp(document.getElementById("edge-btn"), document.getElementById("edge-menu"), helpApi.open);

  function openAssist() {
    const plate = document.getElementById("assist-plate");
    const text = document.getElementById("assist-plate-text");
    if (!plate || !text) return;
    text.textContent = cfg.assistText;
    plate.classList.add("show");
    plate.hidden = false;
    plate.removeAttribute("hidden");
  }
  function hideAssist() {
    const plate = document.getElementById("assist-plate");
    if (!plate) return;
    plate.classList.remove("show");
    plate.hidden = true;
    plate.setAttribute("hidden", "");
    writeFlag(cfg.assistKey, true);
    if (cfg.workshop && assistBtn) assistBtn.setAttribute("aria-pressed", "false");
    syncAssistCue();
  }

  function showNext() {
    const next = document.getElementById("next-door");
    if (!next || !cfg.nextDoor || !pathClear()) return;
    next.hidden = false;
    next.removeAttribute("hidden");
    next.href = cfg.nextDoor;
  }
  function stayHere() {
    return /(?:\?|&)stay=1(?:&|$)/.test(location.search);
  }

  load();
  if (cfg.retireTo && readFlag(cfg.retireFlag || "kulibert-holdit-clear-v1") && !stayHere()) {
    location.replace(cfg.retireTo);
    return;
  }
  showNext();
  if (readFlag(cfg.calmKey)) document.documentElement.classList.add("calm-clear");
  cloneLevel(active());
  syncTools();
  syncTrack();
  coach();
  resize();
  window.addEventListener("resize", resize);

  const addBtn = document.getElementById("tool-add");
  const moveBtn = document.getElementById("tool-move");
  const delBtn = document.getElementById("tool-delete");
  const testBtn = document.getElementById("tool-test");
  if (addBtn) addBtn.addEventListener("click", () => setTool("joint"));
  if (moveBtn) moveBtn.addEventListener("click", () => setTool("move"));
  if (delBtn) delBtn.addEventListener("click", () => setTool("delete"));
  if (testBtn) testBtn.addEventListener("click", startTest);
  if (retryBtn) retryBtn.addEventListener("click", retry);
  const retryNow = document.getElementById("retry-now");
  if (retryNow) retryNow.addEventListener("click", retry);
  const islesBtn = document.getElementById("isles-btn");
  if (islesBtn) islesBtn.addEventListener("click", openMap);
  const isleClose = document.getElementById("isle-close");
  if (isleClose) isleClose.addEventListener("click", closeMap);
  const isleMap = document.getElementById("isle-map");
  if (isleMap) isleMap.addEventListener("click", (ev) => { if (ev.target === isleMap) closeMap(); });
  const trackLevels = document.getElementById("track-levels");
  const trackChallenge = document.getElementById("track-challenge");
  if (trackLevels) trackLevels.addEventListener("click", () => {
    if (busy()) return;
    const current = active();
    beginLevel(current.free ? levels[0].id : current.id);
  });
  if (trackChallenge) trackChallenge.addEventListener("click", () => {
    if (busy()) return;
    if (!pathClear()) {
      setStatus("Path", cfg.workshop ? "Clear Levels first." : "Clear ten levels. Then make your own truss.", "");
      return;
    }
    beginLevel(freeLevel.id);
  });
  for (const btn of document.querySelectorAll(".bet-chip")) {
    btn.addEventListener("click", () => {
      state.bet = btn.dataset.bet;
      syncBet();
      setStatus("Bet", btn.dataset.bet === "hold"
        ? (cfg.workshop ? "You bet it will hold. Press Test." : "You bet the truss will hold. Press Test.")
        : (cfg.workshop ? "You bet it will fall. Press Test." : "You bet the truss will fold. Press Test."), "");
    });
  }
  const got = document.getElementById("assist-gotit");
  if (got) got.addEventListener("click", hideAssist);
  if (assistBtn) {
    assistBtn.addEventListener("click", () => {
      const on = assistBtn.getAttribute("aria-pressed") !== "true";
      assistBtn.setAttribute("aria-pressed", on ? "true" : "false");
      if (on) openAssist();
      else hideAssist();
      if (cfg.workshop) syncAssistCue();
    });
  }
  window.addEventListener("keydown", (ev) => {
    if (ev.key === "Enter") {
      if (ev.target && (ev.target.tagName === "BUTTON" || ev.target.tagName === "A")) return;
      ev.preventDefault();
      startTest();
    }
  });
  if (cfg.workshop) {
    if (!readFlag(cfg.assistKey)) {
      if (assistBtn) assistBtn.setAttribute("aria-pressed", "true");
      openAssist();
    } else if (assistBtn) {
      assistBtn.setAttribute("aria-pressed", "false");
    }
    syncAssistCue();
  } else if (!readFlag(cfg.assistKey)) openAssist();
  paintReadout();
  draw();
}
