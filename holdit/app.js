import { mountTruss } from "../spancraft/truss-play.js?v=1.0.2";
import { SPAN_LEVELS, SPAN_FREE } from "../spancraft/levels.js";
import { SPIRE_LEVELS, SPIRE_FREE } from "../spire-lab/levels.js";

const params = new URLSearchParams(location.search);
const part = params.get("part") === "tower" ? "tower" : "bridge";

function go(next) {
  if (next === part) return;
  location.assign("/holdit/?part=" + next);
}

const bridgeBtn = document.getElementById("part-bridge");
const towerBtn = document.getElementById("part-tower");
if (bridgeBtn) {
  bridgeBtn.setAttribute("aria-pressed", part === "bridge" ? "true" : "false");
  bridgeBtn.addEventListener("click", () => go("bridge"));
}
if (towerBtn) {
  towerBtn.setAttribute("aria-pressed", part === "tower" ? "true" : "false");
  towerBtn.addEventListener("click", () => go("tower"));
}

const bridge = part === "bridge";

document.body.classList.toggle("is-tower", part === "tower");

mountTruss({
  mode: bridge ? "span" : "spire",
  workshop: true,
  levels: bridge ? SPAN_LEVELS : SPIRE_LEVELS,
  freeLevel: bridge ? SPAN_FREE : SPIRE_FREE,
  version: "HI 1.0.2",
  helpTitle: "How to play · HoldIt",
  note: "What’s new: Challenge shows a lock and a reason. Assist draws the next bar. Help says Build, Test, Fix one bar.",
  engageKey: bridge ? "kulibert-holdit-bridge-v2" : "kulibert-holdit-tower-v2",
  seedKey: bridge ? "kulibert-spancraft-engage-v2" : "kulibert-spire-engage-v2",
  assistKey: "kulibert-holdit-assist-intro-v1",
  calmKey: "kulibert-calm-clear",
  firstLine: bridge
    ? "Bridge. Stretch two bars up to the top joint, then Test."
    : "Tower. Stretch two bars up to the top joint, then Test.",
  assistText: bridge
    ? "Stretch from a bank joint to the top joint. Then the other side. Press Test."
    : "Stretch from a base joint to the top joint. Then the other side. Press Test.",
  steps: [
    "This stretch board is not the design tool. The front door of HoldIt is where you design.",
    "Build → Test → Fix one bar.",
    "Ten levels on each. A pass opens the next one. Stars show this try. They are not a class grade.",
    "Finish Bridge and finish Tower. Then the Challenge is yours.",
  ],
});
