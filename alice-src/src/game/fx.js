import { saveSave, settings } from "./save.js";

let bound = false;
let slowSince = 0;
let lastShake = 0;
let lastBurst = 0;
let lastPunch = 0;
let music = null;
let unlocked = false;

export function wantsMotionOff({ setting, attr, media }) {
  if (setting === "less") return true;
  if (attr === "less" || attr === "reduce" || attr === "off") return true;
  return !!media;
}

export function wantsCanvas(s) {
  const mode = (s && s.lite) || "auto";
  if (mode === "on") return true;
  if (mode === "off") return false;
  return !!(s && s.liteAuto);
}

function readMotion() {
  const s = settings();
  let media = false;
  try { media = window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) {}
  const attr = typeof document !== "undefined" ? (document.documentElement.getAttribute("data-kp-motion") || "") : "";
  return wantsMotionOff({ setting: s.motion, attr, media });
}

function ping() {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.apMotion = readMotion() ? "less" : "full";
  document.documentElement.dataset.apLite = lite() ? "on" : "off";
}

function bind() {
  if (bound || typeof window === "undefined" || typeof document === "undefined") return;
  bound = true;
  try {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.addEventListener) mq.addEventListener("change", ping);
    else if (mq.addListener) mq.addListener(ping);
  } catch (e) {}
  try {
    new MutationObserver(ping).observe(document.documentElement, { attributes: true, attributeFilter: ["data-kp-motion"] });
  } catch (e) {}
  ping();
}

export function motionOff() {
  bind();
  return readMotion();
}

export function lite() {
  bind();
  return wantsCanvas(settings());
}

export function fxBlocked() {
  return motionOff() || lite();
}

export function noteFrame(ms) {
  const s = settings();
  if ((s.lite || "auto") !== "auto" || s.liteAuto) { slowSince = 0; return; }
  const now = typeof performance !== "undefined" ? performance.now() : Date.now();
  if (ms > 24) {
    if (!slowSince) slowSince = now;
    else if (now - slowSince >= 3000) {
      s.liteAuto = true;
      slowSince = 0;
      saveSave();
      ping();
    }
  } else slowSince = 0;
}

export function takeSteps(rawDelta, acc) {
  const raw = Number(rawDelta) || 0;
  if (raw >= 150) return { steps: 0, acc: 0, dropped: true };
  const step = 1000 / 60;
  let left = (Number(acc) || 0) + raw;
  let steps = 0;
  while (left >= step && steps < 6) { left -= step; steps += 1; }
  if (left >= step) left = 0;
  return { steps, acc: left, dropped: false };
}

export function shake(scene) {
  if (!scene || fxBlocked()) return;
  const now = performance.now();
  if (now - lastShake < 500) return;
  lastShake = now;
  try { scene.cameras.main.shake(120, 0.0025); } catch (e) {}
}

export function burst(scene, x, y) {
  if (!scene || motionOff()) return;
  const now = performance.now();
  if (now - lastBurst < 500) return;
  lastBurst = now;
  const pool = scene.bits || [];
  const cap = lite() ? Math.min(20, pool.length) : Math.min(pool.length, 36);
  for (let i = 0; i < cap; i++) {
    const bit = pool[i];
    if (!bit) continue;
    bit.setVisible(true);
    bit.setPosition(x, y);
    bit.setData("vx", (i - cap / 2) * 18);
    bit.setData("vy", -40 - (i % 5) * 12);
    bit.setData("life", 18);
  }
}

export function tickBits(scene) {
  const pool = scene.bits || [];
  const cap = lite() ? 20 : pool.length;
  pool.forEach((bit, i) => {
    if (i >= cap) { bit.setVisible(false); return; }
    if (!bit.visible) return;
    const life = (bit.getData("life") || 0) - 1;
    if (life <= 0 || motionOff()) { bit.setVisible(false); return; }
    bit.setData("life", life);
    bit.x += (bit.getData("vx") || 0) / 60;
    bit.y += (bit.getData("vy") || 0) / 60;
    bit.setData("vy", (bit.getData("vy") || 0) + 80 / 60);
  });
}

export function punch(scene, obj) {
  if (!scene || !obj || fxBlocked()) return;
  const now = performance.now();
  if (now - lastPunch < 500) return;
  lastPunch = now;
  const base = obj.scaleX || 1;
  try {
    scene.tweens.add({ targets: obj, scaleX: base + 0.15, scaleY: base + 0.15, yoyo: true, duration: 90, onComplete: () => obj.setScale(base) });
  } catch (e) {}
}

export function sound(scene, key) {
  if (!scene || fxBlocked()) return;
  if (settings().sound === false) return;
  try {
    if (scene.sound && scene.cache && scene.cache.audio && scene.cache.audio.exists("sfx")) scene.sound.playAudioSprite("sfx", key);
  } catch (e) {}
}

export function allowPost() {
  return !fxBlocked();
}

export function markGesture() {
  unlocked = true;
  syncMusic();
}

function stopMusic() {
  if (!music) return;
  try { music.osc.stop(); } catch (e) {}
  try { music.ctx.close(); } catch (e) {}
  music = null;
}

export function syncMusic() {
  const want = unlocked && settings().music === true && !fxBlocked();
  if (!want) { stopMusic(); return; }
  if (music) return;
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return;
  try {
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = 196;
    gain.gain.value = 0.012;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    music = { ctx, osc, gain };
  } catch (e) { music = null; }
}

export function decorOn() {
  if (motionOff()) return false;
  const mode = (settings().lite || "auto");
  if (mode === "on") return false;
  return true;
}

export function driftTile(sprite, speed) {
  if (!sprite || !decorOn()) return;
  sprite.tilePositionX = (sprite.tilePositionX || 0) + speed;
}

export function easeScroll(cam, target) {
  if (!cam || motionOff()) return;
  const next = cam.scrollX + ((target || 0) - cam.scrollX) * 0.04;
  if (Math.abs(next - cam.scrollX) < 0.02) return;
  cam.setScroll(next, 0);
}

export function flyPath(scene, sprite, x, y, reach, dur) {
  if (!sprite || !scene) return;
  const prev = sprite.getData("tw");
  if (prev) {
    try { prev.remove(); } catch (e) {}
    sprite.setData("tw", null);
  }
  sprite.setPosition(Math.round(x), Math.round(y));
  if (!decorOn()) return;
  try {
    const tw = scene.tweens.add({
      targets: sprite,
      x: x + reach,
      y: y - 16,
      duration: dur || 2400,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
    sprite.setData("tw", tw);
  } catch (e) {}
}

export function tickHoppers(hoppers, groundY) {
  if (!hoppers) return;
  const off = !decorOn();
  const now = typeof performance !== "undefined" ? performance.now() : 0;
  hoppers.forEach((h, i) => {
    if (!h || !h.body) return;
    if (off || !h.visible) {
      h.body.setVelocity(0, 0);
      h.body.allowGravity = false;
      h.body.enable = false;
      return;
    }
    h.body.enable = true;
    h.body.allowGravity = true;
    const down = !!(h.body.blocked && h.body.blocked.down) || !!(h.body.touching && h.body.touching.down) || h.y >= groundY - 2;
    if (down && now >= (h.getData("next") || 0)) {
      h.body.setVelocity(i % 2 ? 26 : -26, -140 - (i % 3) * 16);
      h.setData("next", now + 1700 + i * 380);
    }
  });
}

export function tickMotes(motes, kind, rect) {
  if (!motes) return 0;
  if (!decorOn() || !kind || kind === "Breezy") {
    motes.forEach((m) => m.setVisible(false));
    return 0;
  }
  const cap = kind === "Night" ? 6 : Math.min(36, motes.length);
  let n = 0;
  motes.forEach((m, i) => {
    if (i >= cap) { m.setVisible(false); return; }
    if (!m.visible) m.setVisible(true);
    n += 1;
    const phase = (m.getData("p") || 0) + (kind === "Snowy" ? 0.02 : 0.012);
    m.setData("p", phase);
    let vx = 0.15;
    let vy = -0.3;
    if (kind === "Drizzle") { vx = 1.15; vy = 6.4; }
    else if (kind === "Snowy") { vx = Math.sin(phase + i) * 0.45; vy = 0.65; }
    else if (kind === "Night") { vx = Math.sin(phase + i) * 0.22; vy = -0.12; }
    m.x += vx;
    m.y += vy;
    if (m.y > rect.y + rect.h + 4) m.y = rect.y - 2;
    if (m.y < rect.y - 8) m.y = rect.y + rect.h;
    if (m.x > rect.x + rect.w + 4) m.x = rect.x - 2;
    if (m.x < rect.x - 8) m.x = rect.x + rect.w;
  });
  return n;
}

export function tickPuddles(puddles, on) {
  if (!puddles) return;
  puddles.forEach((p) => {
    if (!on) { p.setVisible(false); return; }
    p.setVisible(true);
    if (!decorOn()) { p.setScale(p.getData("base") || 1); return; }
    const phase = (p.getData("p") || 0) + 0.02;
    p.setData("p", phase);
    const base = p.getData("base") || 1;
    p.setScale(base * (1 + Math.sin(phase) * 0.06));
  });
}

export function tickBirds(birds, rect, clock) {
  if (!birds) return;
  if (!decorOn()) {
    birds.forEach((b) => b.setVisible(false));
    if (clock) clock.on = false;
    return;
  }
  const now = typeof performance !== "undefined" ? performance.now() : 0;
  if (!clock.on && now - (clock.last || 0) > 8000) {
    clock.on = true;
    clock.last = now;
    birds.forEach((b, i) => {
      b.setVisible(true);
      b.setPosition(rect.x - 30 - i * 16, rect.y + 14 + (i % 2) * 8);
    });
  }
  if (!clock.on) return;
  let any = false;
  birds.forEach((b) => {
    if (!b.visible) return;
    b.x += 0.9;
    if (b.x < rect.x + rect.w + 24) any = true;
    else b.setVisible(false);
  });
  if (!any) clock.on = false;
}

export function tickGlow(lights, on, webgl) {
  if (!lights) return;
  lights.forEach((lamp, i) => {
    lamp.setVisible(!!on && !!webgl);
    if (!lamp.visible || !decorOn()) return;
    const phase = (lamp.getData("p") || (i * 0.7)) + 0.02;
    lamp.setData("p", phase);
    const pulse = 0.28 + (Math.sin(phase) * 0.5 + 0.5) * 0.22;
    if (lamp.intensity != null) lamp.intensity = pulse;
    else lamp.setAlpha(0.45 + pulse);
  });
}

export function puff(scene, x, y, n) {
  if (!scene || !decorOn()) return 0;
  const pool = scene.dust || [];
  const want = Math.max(1, n || 1);
  let spawned = 0;
  for (let i = 0; i < pool.length; i++) {
    const bit = pool[i];
    if (!bit || bit.visible) continue;
    bit.setVisible(true);
    bit.setPosition(x + (spawned - 1) * 5, y);
    bit.setData("vx", (spawned - (want - 1) / 2) * 28);
    bit.setData("vy", -36 - spawned * 10);
    bit.setData("life", 16);
    bit.setAlpha(1);
    spawned += 1;
    if (spawned >= want) break;
  }
  return spawned;
}

export function tickDust(scene) {
  const pool = scene.dust || [];
  if (!decorOn()) {
    pool.forEach((bit) => { if (bit) bit.setVisible(false); });
    return 0;
  }
  let n = 0;
  pool.forEach((bit) => {
    if (!bit || !bit.visible) return;
    const life = (bit.getData("life") || 0) - 1;
    if (life <= 0) { bit.setVisible(false); bit.setAlpha(1); return; }
    bit.setData("life", life);
    bit.x += (bit.getData("vx") || 0) / 60;
    bit.y += (bit.getData("vy") || 0) / 60;
    bit.setData("vy", (bit.getData("vy") || 0) + 70 / 60);
    bit.setAlpha(Math.max(0.2, life / 16));
    n += 1;
  });
  return n;
}

export function alicePop(elapsedMs, off) {
  const ms = Number(elapsedMs) || 0;
  if (off || ms >= 220) return { sx: 1, sy: 1, phase: "look", rise: 1 };
  const rise = Math.min(1, ms / 220);
  if (ms < 80) return { sx: 1.2, sy: 0.8, phase: "squash", rise };
  if (ms < 150) return { sx: 0.9, sy: 1.15, phase: "stretch", rise };
  const u = (ms - 150) / 70;
  return { sx: 0.9 + 0.1 * u, sy: 1.15 - 0.15 * u, phase: "settle", rise };
}

export function aliceDuck(elapsedMs, off) {
  if (off) return { sx: 1, sy: 1, phase: "hide", frame: "alice-duck-2", drop: 1 };
  const u = Math.min(1, Math.max(0, Number(elapsedMs) || 0) / 220);
  const frame = u < 0.34 ? "alice-duck-0" : u < 0.67 ? "alice-duck-1" : "alice-duck-2";
  return { sx: 1, sy: 1, phase: u >= 1 ? "hide" : "duck", frame, drop: u };
}

export function rideWeed(sprite, pose, on) {
  const body = sprite && sprite.body;
  if (!body || !pose) return;
  if (!on) {
    body.enable = false;
    body.allowGravity = false;
    body.setVelocity(0, 0);
    if (body.setAngularVelocity) body.setAngularVelocity(0);
    sprite.setRotation(0);
    sprite.setPosition(Math.round(pose.x), Math.round(pose.y));
    return;
  }
  body.enable = true;
  body.allowGravity = false;
  body.setBounce(0.72);
  const w = Math.max(8, sprite.displayWidth || 8);
  const h = Math.max(8, sprite.displayHeight || 8);
  if (body.setSize) body.setSize(w, h, true);
  const hw = body.halfWidth || w / 2;
  const hh = body.halfHeight || h / 2;
  body.x = pose.x - hw;
  body.y = pose.y - hh;
  const prev = sprite.getData("weedPrev");
  if (prev) body.setVelocity((pose.x - prev.x) * 60, (pose.y - prev.y) * 60);
  else body.setVelocity(0, 0);
  sprite.setData("weedPrev", { x: pose.x, y: pose.y });
  if (body.setAngularVelocity) body.setAngularVelocity((pose.rot || 0) >= 0 ? 200 : -200);
  sprite.setPosition(Math.round(pose.x), Math.round(pose.y));
  sprite.setRotation(pose.rot || 0);
}

export function backOut(t) {
  const v = Math.max(0, Math.min(1, Number(t) || 0)) - 1;
  const s = 1.70158;
  return v * v * ((s + 1) * v + s) + 1;
}

export function bounceIn(el, delayMs) {
  if (!el) return "still";
  el.style.transform = "";
  if (motionOff() || typeof el.animate !== "function") {
    el.dataset.bounce = "still";
    el.dataset.bounceDelay = "0";
    return "still";
  }
  const frames = [];
  const steps = 10;
  for (let i = 0; i <= steps; i++) {
    const s = 0.2 + 0.8 * backOut(i / steps);
    frames.push({ transform: "scale(" + s.toFixed(4) + ")", offset: i / steps });
  }
  try {
    el.animate(frames, { duration: 420, delay: Math.max(0, delayMs || 0), easing: "linear", fill: "none" });
  } catch (e) {
    el.dataset.bounce = "still";
    el.dataset.bounceDelay = "0";
    return "still";
  }
  el.dataset.bounce = "go";
  el.dataset.bounceDelay = String(delayMs || 0);
  return "go";
}

export function loaderX(p, x0, x1, rtlOn) {
  const u = Math.max(0, Math.min(1, Number(p) || 0));
  const along = rtlOn ? 1 - u : u;
  return Math.round(x0 + (x1 - x0) * along);
}

export function crossBug(scene, sprite, x0, x1, y, dur) {
  if (!sprite || !scene) return;
  const prev = sprite.getData("cross");
  if (prev) {
    try { prev.remove(); } catch (e) {}
    sprite.setData("cross", null);
  }
  sprite.setPosition(Math.round(x0), Math.round(y));
  if (!decorOn()) {
    sprite.setVisible(false);
    return;
  }
  sprite.setVisible(true);
  try {
    const tw = scene.tweens.add({
      targets: sprite,
      x: Math.round(x1),
      duration: dur || 3200,
      ease: "Sine.easeInOut",
      onComplete: () => {
        sprite.setData("cross", null);
        sprite.setVisible(false);
      },
    });
    sprite.setData("cross", tw);
  } catch (e) {
    sprite.setVisible(false);
  }
}


