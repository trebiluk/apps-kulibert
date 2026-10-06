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
