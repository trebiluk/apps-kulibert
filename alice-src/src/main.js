import { startGame } from "./game/main.js";
import { rtl, t } from "./game/i18n.js";
import { bands, poseNow } from "./game/ui/bands.js";

function boot() {
  if (!window.Phaser) { setTimeout(boot, 30); return; }
  const go = () => {
    document.documentElement.dir = rtl() ? "rtl" : "ltr";
    const game = startGame();
    wireChrome(game);
  };
  if (document.readyState === "complete") go();
  else window.addEventListener("load", go, { once: true });
}
function wireChrome(game) {
  const menu = document.getElementById("game-menu");
  const fs = document.getElementById("fs-btn");
  const plate = document.getElementById("plate");
  const hint = document.getElementById("hint");
  menu.addEventListener("click", () => window.dispatchEvent(new CustomEvent("ap-menu")));
  plate.addEventListener("click", () => window.dispatchEvent(new CustomEvent("ap-news")));
  fs.addEventListener("click", toggleFs);
  document.getElementById("hint-x").addEventListener("click", () => { hint.hidden = true; });
  document.addEventListener("fullscreenchange", paintFs);
  paintFs();
  remember();
  oneMenu();
  const fit = () => {
    const stage = document.getElementById("stage");
    if (stage && game) {
      const w = Math.round(stage.clientWidth);
      const h = Math.round(stage.clientHeight);
      if (w > 40 && h > 40 && (Math.round(game.scale.width) !== w || Math.round(game.scale.height) !== h)) game.scale.resize(w, h);
    }
    placeChrome();
  };
  fit();
  window.addEventListener("resize", fit);
  const stage = document.getElementById("stage");
  if (stage && window.ResizeObserver) new ResizeObserver(fit).observe(stage);
  window.addEventListener("ap-lang", () => { document.documentElement.dir = rtl() ? "rtl" : "ltr"; fit(); });
  new MutationObserver(fit).observe(document.documentElement, { attributes: true, attributeFilter: ["data-kb-bar", "dir", "class"] });
}
function placeChrome() {
  const stage = document.getElementById("stage");
  const fs = document.getElementById("fs-btn");
  const plate = document.getElementById("plate");
  if (!stage || !fs || !plate) return;
  const rec = stage.getBoundingClientRect();
  if (rec.width < 40 || rec.height < 40) return;
  const pose = poseNow(window.innerWidth, window.innerHeight);
  const b = bands(Math.round(rec.width), Math.round(rec.height), { rtl: rtl(), pose, viewW: window.innerWidth, viewH: window.innerHeight });
  fs.style.left = Math.round(rec.left + b.fs.x) + "px";
  fs.style.top = Math.round(rec.top + b.fs.y) + "px";
  fs.style.width = b.fs.w + "px";
  fs.style.height = b.fs.h + "px";
  fs.style.right = "auto";
  fs.style.bottom = "auto";
  plate.style.left = Math.round(rec.left + b.plate.x) + "px";
  plate.style.top = Math.round(rec.top + b.plate.y) + "px";
  plate.style.width = b.plate.w + "px";
  plate.style.height = b.plate.h + "px";
  plate.style.right = "auto";
  plate.style.bottom = "auto";
}
function paintFs() {
  const fs = document.getElementById("fs-btn");
  const on = document.fullscreenElement;
  fs.textContent = on ? "↙" : "⛶";
  fs.setAttribute("aria-label", on ? t("exitFull") : t("fullScreen"));
  document.getElementById("hint-text").textContent = t("iphoneHint");
}
function toggleFs() {
  if (document.fullscreenElement) {
    try { localStorage.setItem("kulibert-fullscreen", "off"); } catch (e) {}
    document.exitFullscreen();
    return;
  }
  try { localStorage.setItem("kulibert-fullscreen", "on"); } catch (e) {}
  const req = document.documentElement.requestFullscreen;
  if (req) req.call(document.documentElement).catch(maybeIphone);
  else maybeIphone();
}
function maybeIphone() {
  if (/iPhone|iPad/.test(navigator.userAgent || "")) document.getElementById("hint").hidden = false;
}
function oneMenu() {
  const menu = document.getElementById("game-menu");
  if (!menu || !document.body) return;
  const hide = () => {
    if (document.querySelector(".kb-bar")) menu.style.setProperty("display", "none", "important");
  };
  hide();
  new MutationObserver(hide).observe(document.body, { childList: true, subtree: true });
}
function remember() {
  let want = null;
  try { want = localStorage.getItem("kulibert-fullscreen"); } catch (e) {}
  if (want !== "on") return;
  const once = () => { toggleFs(); window.removeEventListener("pointerdown", once); };
  window.addEventListener("pointerdown", once);
}
boot();
