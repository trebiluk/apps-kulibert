import { mountTruss } from "./truss-play.js?v=20260925b";
import { SPAN_LEVELS, SPAN_FREE } from "./levels.js";

mountTruss({
  mode: "span",
  levels: SPAN_LEVELS,
  freeLevel: SPAN_FREE,
  version: "SC 1.3.24",
  accessKey: "sc-access-v1",
  helpTitle: "How to play · SpanCraft",
  note: "What’s new: Settings has Read aloud. It stays off until you turn it on. Read speaks the line.",
  engageKey: "kulibert-spancraft-engage-v2",
  assistKey: "kulibert-spancraft-assist-intro-v2",
  calmKey: "kulibert-calm-clear",
  firstLine: "Stretch two members up to the top joint, then Test. That is the first clear.",
  assistText: "Stretch from a bank joint to the top joint. Then the other side. Press Test.",
  steps: [
    "A truss is triangles. Stretch a member from joint to joint.",
    "Ten levels. A Clear opens the next one. Stars show this try. They are not a class grade.",
    "After the path, Your truss is yours. Test hangs the truck on three joints.",
    "If it folds, the line says the one fix. Change that member, then Test. Retry starts over.",
  ],
});
