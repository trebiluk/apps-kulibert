// Alice betav1 — Room 1 "The Gate and the Ledge". Vanilla JS, 2D canvas, no network.
(function () {
'use strict';
const W = 960, H = 540, FLOOR = 460, G = 1400;
const C = { paper:'#E8DCC0', parch:'#D4C29A', tea:'#B8955E', rust:'#A4482A', ochre:'#C8932E', teal:'#1F5A5E',
  olive:'#6B6B2E', ink:'#2B2824', ember:'#D9692A', gold:'#D8B46A', goldB:'#EAD4A0', chest:'#6B3A22', chestB:'#9A6A48' };
const I18N = window.ALICE_I18N;
const cv = document.getElementById('game'), ctx = cv.getContext('2d');
const reduced = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
let lang = 'en';
try { const s = localStorage.getItem('alice-lang'); if (s && I18N[s]) lang = s; } catch (e) {}
const T = k => (I18N[lang] && I18N[lang][k]) || I18N.en[k];

// ---------- seeded random so layers look the same every load ----------
let seed = 7;
const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };

// ---------- paper helpers (used only when building cached layers) ----------
function tornPath(g, pts, jag) {
  g.beginPath();
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i], b = pts[(i + 1) % pts.length];
    const n = Math.max(1, Math.floor(Math.hypot(b[0] - a[0], b[1] - a[1]) / 9));
    for (let k = 0; k < n; k++) {
      const t = k / n, x = a[0] + (b[0] - a[0]) * t + (rnd() - .5) * jag, y = a[1] + (b[1] - a[1]) * t + (rnd() - .5) * jag;
      if (i === 0 && k === 0) g.moveTo(x, y); else g.lineTo(x, y);
    }
  }
  g.closePath();
}
function paperShape(g, pts, fill, jag, sh) {
  const s0 = seed;
  g.save(); g.translate(sh, sh); g.fillStyle = 'rgba(43,40,36,.35)'; tornPath(g, pts, jag); g.fill(); g.restore();
  seed = s0; g.fillStyle = fill; tornPath(g, pts, jag); g.fill();
  g.save(); g.clip();
  for (let i = 0; i < 160; i++) { g.fillStyle = rnd() < .5 ? 'rgba(43,40,36,.05)' : 'rgba(232,220,192,.07)'; g.fillRect(rnd() * W, rnd() * H, 2, 2); }
  g.restore();
}
const rect = (x, y, w, h) => [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
function layer(fn) { const c = document.createElement('canvas'); c.width = W + 80; c.height = H; const g = c.getContext('2d'); g.translate(40, 0); fn(g); return c; }

// ---------- level ----------
const STATIC = [
  { x: -40, y: FLOOR, w: W + 80, h: 80 },        // floor
  { x: -40, y: 0, w: 40, h: H }, { x: W, y: 0, w: 40, h: H }, // walls
  { x: 200, y: 420, w: 40, h: 40 }, { x: 240, y: 380, w: 40, h: 80 }, // crate steps
  { x: 330, y: 300, w: 80, h: 18 }, { x: 450, y: 300, w: 120, h: 18 } // ledge with a gap
];
const GATE = { x: 620, w: 24 }, LEVER = { x: 545, y: 300 }, EXIT = { x: 880, w: 70 };
let S;
function reset() {
  S = {
    t: 0, won: false, bubbles: [],
    p: [mk(0, 60, 'Alice', 26, 42, 150, 392), mk(1, 172, 'Wonderland', 24, 50, 200, 567)],
    crate: { x: 380, y: 420, w: 40, h: 40 },
    gate: { o: 0, timer: 0 }, lever: false,
    plank: { up: true, fall: 0, x: 800, y: 300, w: 16, h: 160 }
  };
  hideBanner();
}
function mk(id, x, name, w, h, sp, jv) { return { id, name, x, y: FLOOR - h, w, h, vx: 0, vy: 0, sp, jv, ground: true, face: 1, keys: {}, prevUse: false, prevCall: false, step: 0 }; }
function gateRect() { const bottom = FLOOR - S.gate.o * 160; return { x: GATE.x, y: 0, w: GATE.w, h: bottom }; }
function solids(excludeCrate) {
  const s = STATIC.slice(); s.push(gateRect());
  if (S.plank.up) s.push(S.plank);
  if (!excludeCrate) s.push(S.crate);
  return s;
}
const hit = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

function moveX(p, dx) {
  p.x += dx;
  for (const s of solids(false)) {
    if (!hit(p, s)) continue;
    if (s === S.crate && p.id === 0 && p.ground && !S.crate.stuck) { // only Alice can push the crate
      const old = S.crate.x; S.crate.x += dx;
      let ok = true; for (const t of solids(true)) if (hit(S.crate, t)) ok = false;
      for (const q of S.p) if (q !== p && hit(S.crate, q)) ok = false;
      if (ok) continue; S.crate.x = old;
    }
    p.x = dx > 0 ? s.x - p.w : s.x + s.w;
  }
}
function moveY(p, dy) {
  p.y += dy; p.ground = false;
  for (const s of solids(false)) {
    if (!hit(p, s)) continue;
    if (dy > 0) { p.y = s.y - p.h; p.ground = true; } else p.y = s.y + s.h;
    p.vy = 0;
  }
}
function say(p, key) { S.bubbles.push({ p, text: T(key), t: 1.6 }); }

function update(dt) {
  if (S.won) return;
  S.t += dt;
  for (const p of S.p) {
    const k = p.keys;
    const dir = (k.right ? 1 : 0) - (k.left ? 1 : 0);
    p.vx = dir * p.sp; if (dir) { p.face = dir; p.step += dt * 10; }
    if (k.jump && p.ground) { p.vy = -p.jv; p.ground = false; }
    p.vy = Math.min(p.vy + G * dt, 900);
    moveX(p, p.vx * dt); moveY(p, p.vy * dt);
    if (k.use && !p.prevUse) interact(p);
    if (k.call && !p.prevCall) say(p, 'call');
    p.prevUse = !!k.use; p.prevCall = !!k.call;
  }
  // gate: lifts when the lever is pulled, falls after the timer unless something is under it
  const g = S.gate;
  if (g.timer > 0) g.timer -= dt;
  let target = g.timer > 0 ? 1 : 0;
  const cc = S.crate.x + S.crate.w / 2;
  if (!S.crate.stuck && g.o > 0.3 && Math.abs(cc - (GATE.x + GATE.w / 2)) < 8) { S.crate.stuck = true; say(S.p[0], 'hauled'); } // wedged: braces the gate
  const lane = { x: GATE.x, y: FLOOR - 160, w: GATE.w, h: 160 };
  const blocked = hit(lane, S.crate) || S.p.some(p => hit(lane, p));
  if (target === 0 && blocked && g.o > 0.05) target = g.o; // braced: stays where it is
  g.o += Math.sign(target - g.o) * Math.min(Math.abs(target - g.o), dt * 2.5);
  if (g.timer <= 0 && S.lever && !blocked && g.o < 0.02) S.lever = false;
  if (!S.plank.up && S.plank.fall < 1) S.plank.fall = Math.min(1, S.plank.fall + dt * 2);
  S.bubbles = S.bubbles.filter(b => (b.t -= dt) > 0);
  if (S.p.every(p => p.x >= EXIT.x && p.x + p.w <= EXIT.x + EXIT.w + 6 && p.ground && p.y + p.h >= FLOOR - 1)) { S.won = true; showBanner(T('cleared')); }
}
function interact(p) {
  const cx = p.x + p.w / 2, feet = p.y + p.h;
  if (Math.abs(cx - LEVER.x) < 34 && Math.abs(feet - LEVER.y) < 6) { S.lever = true; S.gate.timer = 2.2; say(p, 'lever'); return; }
  if (S.plank.up && Math.abs(cx - (S.plank.x + 8)) < 40 && feet >= FLOOR - 1) {
    if (p.id === 0) { S.plank.up = false; say(p, 'hauled'); } else say(p, 'heavy');
  }
}

// ---------- cached layers ----------
let L = null;
function buildLayers() {
  seed = 7;
  const far = layer(g => {
    g.fillStyle = C.parch; g.fillRect(-40, 0, W + 80, H);
    for (let i = 0; i < 14; i++) { const r = 30 + rnd() * 90; g.fillStyle = 'rgba(184,149,94,' + (0.08 + rnd() * .1) + ')'; g.beginPath(); g.arc(rnd() * W, rnd() * H, r, 0, 7); g.fill(); }
    for (let i = 0; i < 90; i++) { g.fillStyle = 'rgba(164,72,42,.18)'; g.beginPath(); g.arc(rnd() * W, rnd() * H, 1 + rnd() * 2.5, 0, 7); g.fill(); } // foxing
    paperShape(g, [[-40, 260], [120, 170], [260, 230], [420, 140], [600, 220], [760, 150], [1000, 240], [1000, 540], [-40, 540]], '#7E9A8C', 10, 5);
  });
  const mid = layer(g => {
    paperShape(g, [[-40, 330], [100, 270], [230, 320], [380, 250], [520, 310], [700, 240], [860, 300], [1000, 260], [1000, 540], [-40, 540]], C.teal, 8, 6);
    paperShape(g, [[-40, 400], [160, 360], [340, 395], [560, 350], [780, 390], [1000, 355], [1000, 540], [-40, 540]], C.olive, 8, 6);
    g.fillStyle = 'rgba(217,105,42,.25)'; g.beginPath(); g.arc(760, 110, 46, 0, 7); g.fill(); // low sun
  });
  const play = layer(g => {
    paperShape(g, rect(-40, FLOOR, W + 80, 80), C.rust, 6, 6);
    paperShape(g, rect(200, 420, 40, 40), C.ochre, 4, 4); paperShape(g, rect(240, 380, 40, 80), C.ochre, 4, 4);
    g.strokeStyle = C.ink; g.lineWidth = 2; g.strokeRect(204, 424, 32, 32); g.strokeRect(244, 384, 32, 72);
    paperShape(g, rect(330, 300, 80, 18), C.chestB, 4, 5); paperShape(g, rect(450, 300, 120, 18), C.chestB, 4, 5);
    // brambles in the gap below the ledge (danger, decorative)
    g.strokeStyle = C.ink; g.lineWidth = 3;
    for (let i = 0; i < 9; i++) { const x = 300 + i * 30; g.beginPath(); g.moveTo(x, FLOOR); g.quadraticCurveTo(x + 20, FLOOR - 50 - rnd() * 30, x + 34, FLOOR - 10); g.stroke(); }
    // stone arch over the gate
    paperShape(g, rect(600, 0, 64, FLOOR - 165), '#5E5A50', 6, 6);
    // exit door
    paperShape(g, [[880, FLOOR], [880, 360], [915, 330], [950, 360], [950, FLOOR]], C.ink, 4, 5);
    g.fillStyle = 'rgba(217,105,42,.6)'; g.fillRect(890, 372, 50, 86);
  });
  const fore = layer(g => {
    g.fillStyle = C.ink;
    seed = 99; tornPath(g, [[-40, -10], [1000, -10], [1000, 22], [-40, 30]], 14); g.fill();
    tornPath(g, [[-40, 520], [1000, 515], [1000, 560], [-40, 560]], 14); g.fill();
    tornPath(g, [[-40, -10], [18, -10], [10, 560], [-40, 560]], 14); g.fill();
    tornPath(g, [[945, -10], [1000, -10], [1000, 560], [952, 560]], 14); g.fill();
  });
  L = { far, mid, play, fore };
}

// ---------- characters (cheap paths, cut-paper look) ----------
function cut(fn, x, y) { ctx.save(); ctx.translate(x + 3, y + 3); ctx.globalAlpha = .35; fn('#2B2824'); ctx.restore(); ctx.save(); ctx.translate(x, y); fn(null); ctx.restore(); }
function drawAlice(p) {
  const bob = p.ground && p.vx ? Math.sin(p.step) * 1.5 : 0;
  cut(c => {
    const f = col => c || col; ctx.scale(p.face, 1);
    ctx.fillStyle = f(C.gold); ctx.beginPath(); ctx.ellipse(-12, 37, 6, 3, -.4, 0, 7); ctx.fill(); // short stubby tail
    ctx.beginPath(); ctx.ellipse(0, 26, 11, 17, 0, 0, 7); ctx.fill(); // slim upright body
    ctx.fillStyle = f(C.goldB); ctx.beginPath(); ctx.ellipse(3, 28, 6, 11, 0, 0, 7); ctx.fill();
    ctx.fillStyle = f(C.gold); ctx.beginPath(); ctx.ellipse(1, 6, 10, 9, 0, 0, 7); ctx.fill(); // head
    ctx.beginPath(); ctx.arc(-5, -1, 3, 0, 7); ctx.arc(6, -1, 3, 0, 7); ctx.fill(); // small round ears
    ctx.fillStyle = f(C.ink); ctx.beginPath(); ctx.arc(5, 5, 2.6, 0, 7); ctx.fill(); // big dark eye
    ctx.beginPath(); ctx.arc(10, 9, 1.4, 0, 7); ctx.fill();
    ctx.fillStyle = f(C.gold); ctx.fillRect(6, 20, 6, 3); // tiny hands
    ctx.fillRect(-6, 40, 5, 3); ctx.fillRect(2, 40, 5, 3);
  }, p.x + p.w / 2, p.y + bob);
}
function drawHare(p) {
  const st = p.ground && p.vx ? Math.sin(p.step) * 4 : 0;
  cut(c => {
    const f = col => c || col; ctx.scale(p.face, 1);
    ctx.fillStyle = f(C.chest);
    ctx.save(); ctx.translate(2, 6); ctx.rotate(-.2); ctx.beginPath(); ctx.ellipse(0, -4, 3.5, 13, 0, 0, 7); ctx.fill(); ctx.restore(); // long ears
    ctx.save(); ctx.translate(8, 6); ctx.rotate(.15); ctx.beginPath(); ctx.ellipse(0, -4, 3.5, 13, 0, 0, 7); ctx.fill(); ctx.restore();
    ctx.beginPath(); ctx.ellipse(6, 16, 8, 7, 0, 0, 7); ctx.fill(); // head
    ctx.beginPath(); ctx.ellipse(-2, 32, 11, 10, -.3, 0, 7); ctx.fill(); // lean body
    ctx.fillRect(-10 + st, 38, 4, 12); ctx.fillRect(4 - st, 38, 4, 12); // long legs
    ctx.fillStyle = f(C.chestB); ctx.beginPath(); ctx.arc(-13, 30, 3, 0, 7); ctx.fill();
    ctx.fillStyle = f(C.ink); ctx.beginPath(); ctx.arc(9, 14, 2, 0, 7); ctx.fill();
  }, p.x + p.w / 2, p.y);
}

function draw() {
  const mx = reduced ? 0 : ((S.p[0].x + S.p[1].x) / 2 - W / 2) / (W / 2) * 20;
  ctx.drawImage(L.far, -40 - mx * .1, 0); ctx.drawImage(L.mid, -40 - mx * .3, 0); ctx.drawImage(L.play, -40, 0);
  // hawk shadow passing (kid-safe danger, harmless)
  if (!reduced) { const hx = ((S.t * 90) % 1800) - 300; ctx.fillStyle = 'rgba(43,40,36,.18)'; ctx.beginPath(); ctx.ellipse(hx, 200, 40, 8, 0, 0, 7); ctx.ellipse(hx + 10, 200, 12, 22, 0, 0, 7); ctx.fill(); }
  // lever
  ctx.strokeStyle = C.ink; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(LEVER.x, LEVER.y); ctx.lineTo(LEVER.x + (S.lever ? 14 : -14), LEVER.y - 26); ctx.stroke();
  ctx.fillStyle = C.ember; ctx.beginPath(); ctx.arc(LEVER.x + (S.lever ? 14 : -14), LEVER.y - 26, 5, 0, 7); ctx.fill();
  // gate (iron bars)
  const gr = gateRect(); const gy = FLOOR - 165 - 0; ctx.fillStyle = 'rgba(43,40,36,.35)'; ctx.fillRect(gr.x + 4, gy + 4, gr.w, gr.h - gy);
  ctx.fillStyle = C.ink; for (let i = 0; i < 3; i++) ctx.fillRect(gr.x + i * 9, gy, 5, gr.h - gy); ctx.fillRect(gr.x - 2, gr.h - 8, gr.w + 4, 8);
  // crate
  const cr = S.crate; ctx.fillStyle = 'rgba(43,40,36,.35)'; ctx.fillRect(cr.x + 4, cr.y + 4, cr.w, cr.h);
  ctx.fillStyle = C.ochre; ctx.fillRect(cr.x, cr.y, cr.w, cr.h); ctx.strokeStyle = C.ink; ctx.lineWidth = 2; ctx.strokeRect(cr.x + 3, cr.y + 3, cr.w - 6, cr.h - 6);
  ctx.beginPath(); ctx.moveTo(cr.x + 3, cr.y + 3); ctx.lineTo(cr.x + cr.w - 3, cr.y + cr.h - 3); ctx.stroke();
  // plank
  const pk = S.plank; ctx.save(); ctx.translate(pk.x, FLOOR); ctx.rotate(-pk.fall * Math.PI / 2 * -1);
  ctx.fillStyle = 'rgba(43,40,36,.35)'; ctx.fillRect(4, -pk.h + 4, pk.w, pk.h); ctx.fillStyle = C.chestB; ctx.fillRect(0, -pk.h, pk.w, pk.h); ctx.restore();
  drawAlice(S.p[0]); drawHare(S.p[1]);
  ctx.font = '15px Georgia, serif'; ctx.textAlign = 'center';
  for (const b of S.bubbles) { const x = b.p.x + b.p.w / 2, y = b.p.y - 26, w = ctx.measureText(b.text).width + 14;
    ctx.fillStyle = C.paper; ctx.fillRect(x - w / 2, y - 16, w, 22); ctx.strokeStyle = C.ink; ctx.lineWidth = 1.5; ctx.strokeRect(x - w / 2, y - 16, w, 22); ctx.fillStyle = C.ink; ctx.fillText(b.text, x, y); }
  if (S.t < 6 && !S.won) { ctx.fillStyle = 'rgba(232,220,192,.92)'; const w = ctx.measureText(T('hint')).width + 20; ctx.fillRect(W / 2 - w / 2, 40, w, 28); ctx.fillStyle = C.ink; ctx.fillText(T('hint'), W / 2, 59); }
  ctx.drawImage(L.fore, -40, 0);
}

// ---------- input ----------
const KEYMAP = { KeyA: [0, 'left'], KeyD: [0, 'right'], KeyW: [0, 'jump'], KeyS: [0, 'down'], KeyQ: [0, 'use'], KeyE: [0, 'call'],
  ArrowLeft: [1, 'left'], ArrowRight: [1, 'right'], ArrowUp: [1, 'jump'], ArrowDown: [1, 'down'], Comma: [1, 'use'], Period: [1, 'call'] };
function key(e, v) { const m = KEYMAP[e.code]; if (!m) return; e.preventDefault(); S.p[m[0]].keys[m[1]] = v; }
addEventListener('keydown', e => key(e, true)); addEventListener('keyup', e => key(e, false));
addEventListener('blur', () => S.p.forEach(p => p.keys = {}));
if ('ontouchstart' in window || navigator.maxTouchPoints > 0 || /[?&]touch=1/.test(location.search)) document.body.classList.add('touch');
document.querySelectorAll('#touch .zone').forEach(z => {
  const pi = +z.dataset.p;
  z.querySelectorAll('button').forEach(b => {
    const set = v => e => { e.preventDefault(); S.p[pi].keys[b.dataset.k] = v; b.classList.toggle('on', v); };
    b.addEventListener('pointerdown', set(true)); b.addEventListener('pointerup', set(false));
    b.addEventListener('pointercancel', set(false)); b.addEventListener('pointerleave', set(false));
  });
});

// ---------- UI ----------
const $ = id => document.getElementById(id);
function showBanner(t) { const b = $('banner'); b.textContent = t; b.hidden = false; }
function hideBanner() { $('banner').hidden = true; }
function applyLang() {
  const d = I18N[lang]; document.documentElement.lang = lang === 'simple' ? 'en' : lang;
  $('title').textContent = d.title; $('btnReset').textContent = T('reset');
  $('helpBody').innerHTML = ''; $('helpBody').dir = d.rtl ? 'rtl' : 'ltr';
  d.help.forEach((t, i) => { const el = document.createElement(i ? 'p' : 'h2'); el.textContent = t; $('helpBody').appendChild(el); });
  if (S && S.won) showBanner(T('cleared'));
}
for (const k in I18N) { const o = document.createElement('option'); o.value = k; o.textContent = I18N[k].name; $('lang').appendChild(o); }
$('lang').value = lang;
$('lang').onchange = () => { lang = $('lang').value; try { localStorage.setItem('alice-lang', lang); } catch (e) {} applyLang(); };
$('btnReset').onclick = () => reset();
$('btnHelp').onclick = () => { $('help').hidden = false; };
$('helpClose').onclick = () => { $('help').hidden = true; };

// ---------- loop (fixed step) ----------
reset(); buildLayers(); applyLang();
let last = performance.now(), acc = 0;
const api = { manual: false, state: () => S, step: n => { for (let i = 0; i < n; i++) update(1 / 60); draw(); }, reset };
window.__alice = api;
function frame(now) {
  acc += Math.min(0.1, (now - last) / 1000); last = now;
  if (!api.manual) while (acc >= 1 / 60) { update(1 / 60); acc -= 1 / 60; } else acc = 0;
  draw(); requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
})();
