import level from "./levels/lookout.json";
import { schedule, view } from "./core/lookout-sim.js";
import en from "./i18n/en.json";
import uk from "./i18n/uk.json";
import ru from "./i18n/ru.json";
import es from "./i18n/es.json";
import ar from "./i18n/ar.json";
import fa from "./i18n/fa-AF.json";
import rw from "./i18n/rw.json";
import ti from "./i18n/ti.json";

const PACKS = { en, uk, ru, es, ar, "fa-AF": fa, rw, ti };
const RTL = { ar: 1, "fa-AF": 1 };

const ICO = {
  lookout: '<svg viewBox="0 0 64 64" aria-hidden="true"><rect x="28" y="18" width="8" height="28" fill="#22d3ee"/><circle cx="32" cy="16" r="10" fill="#7dd3fc" stroke="#0369a1" stroke-width="3"/><path d="M18 50h28l-4 8H22z" fill="#14b8a6"/></svg>',
  hanger: '<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M32 10a6 6 0 0 1 6 6c0 3-2 5-6 7-4-2-6-4-6-7a6 6 0 0 1 6-6z" fill="#e9c6f2"/><path d="M10 40l22-12 22 12v6H10z" fill="#c04bd8"/></svg>',
  tunnel: '<svg viewBox="0 0 64 64" aria-hidden="true"><ellipse cx="32" cy="40" rx="22" ry="14" fill="#8a5a32"/><ellipse cx="32" cy="40" rx="12" ry="8" fill="#1a120c"/></svg>',
  shovel: '<svg viewBox="0 0 64 64" aria-hidden="true"><rect x="30" y="8" width="4" height="34" fill="#d6e4f0"/><path d="M20 40h24l-4 16H24z" fill="#14b8a6"/></svg>',
  radio: '<svg viewBox="0 0 64 64" aria-hidden="true"><rect x="12" y="22" width="40" height="28" rx="6" fill="#3b82f6"/><circle cx="24" cy="36" r="6" fill="#7dd3fc"/><path d="M40 28c4 4 4 12 0 16" fill="none" stroke="#fff" stroke-width="3"/><path d="M46 24c7 6 7 18 0 24" fill="none" stroke="#fff" stroke-width="3"/></svg>',
  boots: '<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M14 16h12v22l16 4v10H10z" fill="#c04bd8"/><path d="M36 18h12v20l-12 4z" fill="#7dd3fc"/></svg>',
  home: '<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M8 30 L32 12 L56 30 V54 H8Z" fill="#14b8a6"/></svg>',
  news: '<svg viewBox="0 0 64 64" aria-hidden="true"><rect x="12" y="12" width="40" height="40" rx="4" fill="#22d3ee"/><path d="M20 24h24M20 32h24M20 40h16" stroke="#06122b" stroke-width="3"/></svg>',
  full: '<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M12 24V12h12M40 12h12v12M52 40v12H40M24 52H12V40" fill="none" stroke="#22d3ee" stroke-width="4"/></svg>',
  wing: '<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M8 36c16-20 32-20 48 0-16 4-32 4-48 0z" fill="#7dd3fc"/></svg>',
  paw: '<svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="20" cy="22" r="6" fill="#f59e0b"/><circle cx="32" cy="16" r="6" fill="#f59e0b"/><circle cx="44" cy="22" r="6" fill="#f59e0b"/><ellipse cx="32" cy="38" rx="12" ry="10" fill="#f59e0b"/></svg>',
  snake: '<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M10 40c8-16 16 8 24-8s16 8 20-4" fill="none" stroke="#34d399" stroke-width="6"/><circle cx="48" cy="24" r="4" fill="#34d399"/></svg>',
  pause: '<svg viewBox="0 0 64 64" aria-hidden="true"><rect x="16" y="12" width="10" height="40" fill="#fff"/><rect x="38" y="12" width="10" height="40" fill="#fff"/></svg>',
  lock: '<svg viewBox="0 0 64 64" aria-hidden="true"><rect x="16" y="28" width="32" height="24" rx="4" fill="#fde68a"/><path d="M22 28v-6a10 10 0 0 1 20 0v6" fill="none" stroke="#fde68a" stroke-width="4"/></svg>',
  close: '<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M16 16l32 32M48 16L16 48" stroke="#fff" stroke-width="6"/></svg>'
};

function t(key) {
  const lang = document.documentElement.getAttribute("data-kp-lang") || "en";
  const pack = PACKS[lang] || en;
  return pack[key] || en[key] || key;
}

function applyPrefs() {
  const html = document.documentElement;
  const lang = html.getAttribute("data-kp-lang") || "en";
  html.lang = lang === "fa-AF" ? "fa-AF" : lang;
  html.dir = RTL[lang] ? "rtl" : "ltr";
  html.setAttribute("data-ap-theme", html.getAttribute("data-kp-contrast") === "1" ? "contrast" : "teal");
}

const app = document.getElementById("app");
const menuBtn = document.getElementById("game-menu");
const fsBtn = document.getElementById("fs-btn");
const plate = document.getElementById("plate");
const hint = document.getElementById("hint");

let screen = "home";
let round = null;
let panel = null;
let toastText = "";
let toastUntil = 0;
let raf = 0;
let last = 0;
let acc = 0;

function goHome() {
  try { parent.postMessage({ type: "go-home" }, "*"); } catch (e) {}
  try { parent.postMessage({ type: "tech-room-home" }, "*"); } catch (e) {}
  if (window.top === window) location.href = "/";
}

function openPanel(name) {
  panel = name;
  paint();
  const first = document.querySelector(".card button, .card .menu-row");
  if (first) first.focus();
}
function closePanel() {
  panel = null;
  paint();
  menuBtn.focus();
}

function paintChrome() {
  menuBtn.innerHTML = ICO.full.replace("full", "") ? `☰` : "☰";
  menuBtn.innerHTML = '<span aria-hidden="true">☰</span>';
  menuBtn.setAttribute("aria-label", t("menu"));
  menuBtn.setAttribute("aria-expanded", panel === "menu" ? "true" : "false");
  fsBtn.innerHTML = ICO.full + "<span>" + (document.fullscreenElement ? t("exitFull") : t("fullScreen")) + "</span>";
  fsBtn.setAttribute("aria-label", document.fullscreenElement ? t("exitFull") : t("fullScreen"));
  plate.textContent = "AP 1.0.0";
  document.getElementById("hint-text").textContent = t("iphoneHint");
  document.getElementById("hint-x").setAttribute("aria-label", t("close"));
}

function tile(id, key, icon, live) {
  return `<button type="button" class="tile${live ? " live" : ""}" data-tile="${id}">${ICO[icon]}<span>${t(key)}</span>${live ? "" : `<span class="soon">${ICO.lock ? "" : ""}${t("soon")}</span>`}</button>`;
}

function homeHtml() {
  return `<section class="screen">
    <div class="burrow" aria-hidden="true">
      <div class="sky-wash"></div>
      <div class="cast p1">${aliceSprite()}</div>
      <div class="cast p2">${hareSprite()}</div>
      <div class="mound"></div>
      <div class="hole"></div>
    </div>
    <div class="who">
      <span class="chip alice">${faceAlice()}<span>P1 ${t("alice")}</span></span>
      <span class="chip wonder">${faceHare()}<span>P2 ${t("wonderland")}</span></span>
    </div>
    <div class="tiles">
      <button type="button" class="tile live" data-tile="lookout">${ICO.lookout}<span>${t("lookout")}</span></button>
      <button type="button" class="tile" data-tile="dress">${ICO.hanger}<span>${t("dressUp")}</span><span class="soon">${t("soon")}</span></button>
      <button type="button" class="tile" data-tile="burrow">${ICO.tunnel}<span>${t("burrow")}</span><span class="soon">${t("soon")}</span></button>
      <button type="button" class="tile" data-tile="signals">${ICO.radio}<span>${t("signals")}</span><span class="soon">${t("soon")}</span></button>
      <button type="button" class="tile" data-tile="dash">${ICO.boots}<span>${t("dash")}</span><span class="soon">${t("soon")}</span></button>
      <button type="button" class="tile" data-tile="dig">${ICO.shovel}<span>${t("dig")}</span><span class="soon">${t("soon")}</span></button>
    </div>
  </section>${panelHtml()}`;
}

function faceAlice() {
  return `<svg class="face" viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="34" r="20" fill="#c4a574"/><ellipse cx="32" cy="40" rx="12" ry="10" fill="#f3e6cf"/><circle cx="24" cy="30" r="3" fill="#1a120c"/><circle cx="40" cy="30" r="3" fill="#1a120c"/><path d="M16 36h32l-4 8H20z" fill="#c04bd8"/></svg>`;
}
function faceHare() {
  return `<svg class="face" viewBox="0 0 64 64" aria-hidden="true"><path d="M22 28 L18 6 L28 24Z" fill="#8a5a3a"/><path d="M42 28 L46 6 L36 24Z" fill="#8a5a3a"/><circle cx="32" cy="38" r="16" fill="#8a5a3a"/><ellipse cx="32" cy="42" rx="8" ry="7" fill="#f3e6cf"/><circle cx="26" cy="36" r="2.5" fill="#1a120c"/><circle cx="38" cy="36" r="2.5" fill="#1a120c"/><path d="M18 40h28l-3 7H21z" fill="#7dd3fc"/></svg>`;
}
function aliceSprite() {
  return `<svg viewBox="0 0 92 120" aria-hidden="true"><ellipse cx="46" cy="78" rx="28" ry="32" fill="#c4a574"/><ellipse cx="46" cy="84" rx="16" ry="20" fill="#f3e6cf"/><circle cx="46" cy="40" r="20" fill="#c4a574"/><circle cx="38" cy="38" r="3" fill="#1a120c"/><circle cx="54" cy="38" r="3" fill="#1a120c"/><path d="M24 48h44l-6 10H30z" fill="#c04bd8"/><path d="M30 108h10l-2 8H32z" fill="#8a5a32"/><path d="M52 108h10l-2 8H54z" fill="#8a5a32"/><path d="M18 70c-10 8-8 16 2 14" fill="none" stroke="#8a5a32" stroke-width="4"/></svg>`;
}
function hareSprite() {
  return `<svg viewBox="0 0 92 120" aria-hidden="true"><path d="M34 36 L28 4 L42 30Z" fill="#8a5a3a"/><path d="M58 36 L64 4 L50 30Z" fill="#8a5a3a"/><ellipse cx="46" cy="78" rx="22" ry="30" fill="#8a5a3a"/><ellipse cx="46" cy="84" rx="12" ry="16" fill="#f3e6cf"/><circle cx="46" cy="42" r="16" fill="#8a5a3a"/><circle cx="40" cy="40" r="2.5" fill="#1a120c"/><circle cx="52" cy="40" r="2.5" fill="#1a120c"/><path d="M28 48h36l-4 8H32z" fill="#7dd3fc"/><path d="M34 106h8v10h-8z" fill="#6b4423"/><path d="M50 106h8v10h-8z" fill="#6b4423"/></svg>`;
}

function panelHtml() {
  if (panel === "menu") {
    return `<div class="panel" role="dialog"><div class="card">
      <button type="button" class="menu-row" data-act="home">${ICO.home}<span>${t("home")}</span></button>
      <button type="button" class="menu-row" data-act="news">${ICO.news}<span>${t("whatsNew")}</span></button>
      <button type="button" class="menu-row" data-act="fs">${ICO.full}<span>${t("fullScreen")}</span></button>
      <button type="button" class="menu-row" data-act="close">${ICO.close}<span>${t("close")}</span></button>
    </div></div>`;
  }
  if (panel === "news") {
    return `<div class="panel" role="dialog"><div class="card"><h2>${t("whatsNew")}</h2><p>${t("news")}</p><button type="button" class="big" data-act="close">${t("close")}</button></div></div>`;
  }
  if (panel === "soon") {
    return `<div class="panel" role="dialog"><div class="card"><h2>${t("comingSoon")}</h2><p>${t("comingBody")}</p><button type="button" class="big" data-act="close">${t("close")}</button></div></div>`;
  }
  if (panel === "pause") {
    return `<div class="panel" role="dialog"><div class="card"><h2>${t("pause")}</h2>
      <button type="button" class="big" data-act="resume">${t("resume")}</button>
      <button type="button" data-act="home">${t("home")}</button>
    </div></div>`;
  }
  if (panel === "end" && round) {
    const line = round.bank.cleared ? t("kindLine") : t("missLine");
    return `<div class="panel" role="dialog"><div class="card"><h2>${round.bank.score}</h2><p>${line}</p>
      <button type="button" class="big" data-act="again">${t("tryAgain")}</button>
      <button type="button" data-act="home">${t("home")}</button>
    </div></div>`;
  }
  return "";
}

function startRound() {
  const seed = (Date.now() ^ (Math.floor(Math.random() * 1e9))) >>> 0;
  round = {
    seed,
    spawns: schedule(seed, level, false),
    events: [],
    step: 0,
    running: true,
    pups: [1, 1, 1, 1, 1, 1],
    scatter: 0,
    reason: "",
    bank: view([], [], 0),
    scaredAt: 0
  };
  screen = "look";
  panel = null;
  paint();
  loop(performance.now());
}

function alarm(code) {
  if (!round || !round.running || panel) return;
  round.events.push([round.step, code]);
  const active = round.spawns.find((s) => round.step >= s.step && round.step <= s.step + s.approachSteps);
  if (active && code !== 0) {
    round.scatter = 40;
    round.reason = code === 1 ? t("reasonGround") : t("reasonSnake");
    toastText = round.reason;
    toastUntil = performance.now() + 1600;
  }
  round.bank = view(round.spawns, round.events, round.step);
}

function stepRound() {
  if (!round || !round.running || panel) return;
  round.step += 1;
  if (round.scatter > 0) round.scatter -= 1;
  const bank = view(round.spawns, round.events, round.step);
  if (bank.pupsSafe < round.bank.pupsSafe) {
    const i = 6 - bank.pupsSafe - 1;
    if (round.pups[i]) round.pups[i] = 0;
    round.scaredAt = round.step;
    toastText = t("pupScared");
    toastUntil = performance.now() + 1400;
  }
  round.bank = bank;
  if (round.step >= level.seconds * 60) {
    round.running = false;
    panel = "end";
  }
}

function loop(now) {
  if (screen !== "look") return;
  const dt = Math.min(50, now - last || 16);
  last = now;
  acc += dt;
  while (acc >= 1000 / 60) {
    stepRound();
    acc -= 1000 / 60;
  }
  paintField();
  const toast = document.getElementById("toast");
  if (toast) toast.hidden = performance.now() > toastUntil;
  raf = requestAnimationFrame(loop);
}

function paintField() {
  const canvas = document.getElementById("field");
  if (!canvas || !round) return;
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  if (canvas.width !== Math.floor(w * dpr)) {
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
  }
  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = "#14506a";
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = "#7dd3fc";
  ctx.globalAlpha = 0.25;
  ctx.beginPath();
  ctx.arc(w * 0.5, 20, 80, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  const holes = 5;
  const active = round.spawns.find((s) => round.step >= s.step && round.step <= s.step + s.approachSteps);
  for (let i = 0; i < holes; i++) {
    const x = (w * (i + 1)) / (holes + 1);
    const y = h * 0.42;
    ctx.fillStyle = "#8a5a32";
    ctx.beginPath();
    ctx.ellipse(x, y + 10, 28, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#1a120c";
    ctx.beginPath();
    ctx.ellipse(x, y + 10, 14, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    if (active && active.hole === i) {
      ctx.save();
      ctx.translate(x - 20, y - 52);
      ctx.fillStyle = "#c4a574";
      ctx.beginPath();
      ctx.ellipse(20, 28, 16, 22, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#f3e6cf";
      ctx.beginPath();
      ctx.ellipse(20, 32, 9, 12, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#c04bd8";
      ctx.fillRect(6, 18, 28, 6);
      ctx.restore();
    }
  }
  if (active) {
    const p = (round.step - active.step) / active.approachSteps;
    const nestX = w * 0.5;
    const nestY = h * 0.78;
    const edges = [0.08 * w, w * 0.5, 0.92 * w];
    const sx = edges[active.edge] || w * 0.5;
    const sy = 16;
    const answered = round.events.some((e) => e[0] >= active.step && e[0] <= active.step + active.approachSteps && e[1] === 0);
    const x = answered ? sx + (w * 0.5 - sx) * 0.3 : sx + (nestX - sx) * p;
    const y = answered ? 8 : sy + (nestY - sy) * p;
    ctx.fillStyle = "rgba(6,18,43,.45)";
    ctx.beginPath();
    ctx.ellipse(x, y, 36, 14, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#0f172a";
    ctx.beginPath();
    ctx.moveTo(x - 28, y);
    ctx.quadraticCurveTo(x, y - 22, x + 28, y);
    ctx.fill();
  }
  const scoreEl = document.getElementById("score");
  const comboEl = document.getElementById("combo");
  if (scoreEl) scoreEl.textContent = String(round.bank.score);
  if (comboEl) comboEl.textContent = "×" + round.bank.combo;
  document.querySelectorAll(".pup").forEach((el, i) => {
    el.classList.toggle("hide", !round.pups[i]);
    if (round.scatter > 0) el.style.transform = `translateX(${(i - 2.5) * 6}px)`;
    else el.style.transform = "";
  });
}

function lookHtml() {
  const pups = round.pups.map((on) => `<span class="pup${on ? "" : " hide"}" aria-hidden="true">${faceAlice()}</span>`).join("");
  return `<section class="screen look">
    <div class="goal">${ICO.lookout}<span>${t("scoreGoal")}</span></div>
    <button type="button" class="pause-btn" data-act="pause">${ICO.pause}<span>${t("pause")}</span></button>
    <div class="alarms side-a">
      <button type="button" class="alarm sky" data-alarm="0">${ICO.wing}<span class="shape" aria-hidden="true">▲</span><span>${t("sky")}</span></button>
      <button type="button" class="alarm ground" data-alarm="1">${ICO.paw}<span class="shape" aria-hidden="true">■</span><span>${t("ground")}</span></button>
    </div>
    <div class="field">
      <canvas id="field" class="play" width="640" height="360"></canvas>
      <div class="nest" aria-hidden="true">${pups}</div>
      <div class="hud"><span id="score">${round.bank.score}</span><span id="combo">×${round.bank.combo}</span></div>
    </div>
    <div class="alarms side-b">
      <button type="button" class="alarm snake" data-alarm="2">${ICO.snake}<span class="shape" aria-hidden="true">●</span><span>${t("snake")}</span></button>
    </div>
    <p id="toast" class="toast" role="status" ${performance.now() > toastUntil ? "hidden" : ""}>${toastText}</p>
  </section>${panelHtml()}`;
}

function paint() {
  applyPrefs();
  paintChrome();
  app.innerHTML = screen === "look" && round ? lookHtml() : homeHtml();
  if (screen === "look") paintField();
}

app.addEventListener("click", (ev) => {
  const tileBtn = ev.target.closest("[data-tile]");
  if (tileBtn) {
    if (tileBtn.getAttribute("data-tile") === "lookout") startRound();
    else openPanel("soon");
    return;
  }
  const alarmBtn = ev.target.closest("[data-alarm]");
  if (alarmBtn) alarm(Number(alarmBtn.getAttribute("data-alarm")));
  const act = ev.target.closest("[data-act]");
  if (!act) return;
  const name = act.getAttribute("data-act");
  if (name === "home") { screen = "home"; round = null; panel = null; goHome(); paint(); }
  else if (name === "news") openPanel("news");
  else if (name === "fs") toggleFs();
  else if (name === "close") closePanel();
  else if (name === "pause") { if (round) round.running = false; openPanel("pause"); }
  else if (name === "resume") { panel = null; if (round) round.running = true; paint(); menuBtn.focus(); }
  else if (name === "again") startRound();
});

menuBtn.addEventListener("click", () => {
  if (panel === "menu") closePanel();
  else openPanel("menu");
});
plate.addEventListener("click", () => openPanel("news"));
fsBtn.addEventListener("click", toggleFs);
document.getElementById("hint-x").addEventListener("click", () => { hint.hidden = true; });

function toggleFs() {
  const on = document.fullscreenElement || document.webkitFullscreenElement;
  if (on) {
    try { localStorage.setItem("kulibert-fullscreen", "off"); } catch (e) {}
    const exit = document.exitFullscreen || document.webkitExitFullscreen;
    if (exit) exit.call(document);
    return;
  }
  try { localStorage.setItem("kulibert-fullscreen", "on"); } catch (e) {}
  const req = document.documentElement.requestFullscreen || document.documentElement.webkitRequestFullscreen;
  if (req) {
    Promise.resolve(req.call(document.documentElement)).catch(() => maybeIphone());
  } else maybeIphone();
}
function maybeIphone() {
  const ua = navigator.userAgent || "";
  if (/iPhone|iPad/.test(ua)) hint.hidden = false;
}
function rememberFs() {
  let want = null;
  try { want = localStorage.getItem("kulibert-fullscreen"); } catch (e) {}
  if (want === "on" && !document.fullscreenElement) {
    const req = document.documentElement.requestFullscreen || document.documentElement.webkitRequestFullscreen;
    if (req) Promise.resolve(req.call(document.documentElement)).catch(() => {});
  }
}

document.addEventListener("keydown", (ev) => {
  if (ev.key === "Escape") {
    if (panel) { ev.preventDefault(); closePanel(); return; }
    if (screen === "look" && round && round.running) { round.running = false; openPanel("pause"); }
    return;
  }
  if (ev.key === "p" || ev.key === "P") {
    if (screen === "look" && round && !panel) { round.running = false; openPanel("pause"); }
    return;
  }
  const map = { j: 0, J: 0, "1": 0, k: 1, K: 1, "2": 1, l: 2, L: 2, "3": 2 };
  if (map[ev.key] != null) alarm(map[ev.key]);
});

document.addEventListener("fullscreenchange", paintChrome);
new MutationObserver(applyPrefs).observe(document.documentElement, { attributes: true, attributeFilter: ["data-kp-lang", "data-kp-contrast", "data-kp-motion", "data-kp-size", "data-kp-sound", "data-kp-read", "data-kp-captions"] });
try { if (window.KulibertPrefs && KulibertPrefs.lang) applyPrefs(); } catch (e) {}
paint();
rememberFs();
window.addEventListener("resize", () => { if (screen === "look") paintField(); });
