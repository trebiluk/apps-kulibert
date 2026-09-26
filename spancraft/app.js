import { mountTruss } from "./truss-play.js?v=20260926b";
import { SPAN_LEVELS, SPAN_FREE } from "./levels.js";

mountTruss({
  mode: "span",
  levels: SPAN_LEVELS,
  freeLevel: SPAN_FREE,
  version: "SC 1.3.26",
  accessKey: "sc-access-v1",
  helpTitle: "How to play · SpanCraft",
  note: "What’s new: on a phone the joints stay clear. A miss stays on that job. The loose joint stays marked.",
  engageKey: "kulibert-spancraft-engage-v2",
  assistKey: "kulibert-spancraft-assist-intro-v2",
  calmKey: "kulibert-calm-clear",
  firstLine: "Stretch two members up to the top joint, then Test. That is the first clear.",
  assistText: "Stretch from a bank joint to the top joint. Then the other side. Press Test.",
  steps: [
    "A truss is triangles. Stretch a member from joint to joint.",
    "Ten jobs. A Clear opens the next one. Stars belong to that job. They are not a class grade.",
    "Later jobs: the truck stops in every bay. Your truss does that too.",
    "If it folds, the line says the one fix. Change that member, then Test. Retry starts over.",
  ],
});