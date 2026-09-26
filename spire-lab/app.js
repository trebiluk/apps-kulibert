import { mountTruss } from "../spancraft/truss-play.js?v=20260925b";
import { SPIRE_LEVELS, SPIRE_FREE } from "./levels.js";

mountTruss({
  mode: "spire",
  levels: SPIRE_LEVELS,
  freeLevel: SPIRE_FREE,
  version: "SL 1.3.23",
  accessKey: "sl-access-v1",
  helpTitle: "How to play · Spire Lab",
  note: "What’s new: Settings has Read aloud. It stays off until you turn it on. Read speaks the line.",
  engageKey: "kulibert-spire-engage-v2",
  assistKey: "kulibert-spire-assist-intro-v2",
  calmKey: "kulibert-calm-clear",
  firstLine: "Stretch two members up to the top joint, then Test. That is the first clear.",
  assistText: "Stretch from a base joint to the top joint. Then the other side. Press Test.",
  steps: [
    "A truss is triangles. Stretch a member from joint to joint.",
    "Ten levels. A Clear opens the next one. Stars show this try. They are not a class grade.",
    "After the path, Your truss is yours. Test pushes the tower from both sides.",
    "If it folds, the line says the one fix. Change that member, then Test. Retry starts over.",
  ],
});
