import { startGame } from "./game/main.js";
import { t } from "./game/i18n.js";

function boot() {
  if (!window.Phaser) { setTimeout(boot, 30); return; }
  startGame();
  wireChrome();
}
function wireChrome() {
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
