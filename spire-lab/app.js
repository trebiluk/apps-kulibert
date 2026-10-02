import { mountTruss } from "../spancraft/truss-play.js?v=20261002-sc132";
import { SPIRE_LEVELS, SPIRE_FREE } from "./levels.js";

mountTruss({
  mode: "spire",
  levels: SPIRE_LEVELS,
  freeLevel: SPIRE_FREE,
  version: "SL 1.3.31",
  accessKey: "sl-access-v1",
  helpTitle: "How to play · Spire Lab",
  note: "What’s new: After a clear, Next level takes you to the next job. Levels opens the job list. The Menu has a Close button, and Esc closes it.",
  engageKey: "kulibert-spire-engage-v2",
  twApp: "spire-lab",
  assistKey: "kulibert-spire-assist-intro-v2",
  calmKey: "kulibert-calm-clear",
  firstLine: "Stretch two members up to the top joint, then Test. That is the first clear.",
  assistText: "Stretch from a base joint to the top joint. Then the other side. Press Test.",
  steps: [
    "A truss is triangles. Stretch a member from joint to joint.",
    "Ten jobs. A Clear opens the next one. Stars belong to that job. They are not a class grade.",
    "Height counts only the joints your bars reach. Later jobs push the top.",
    "If it folds, the line says the one fix. Change that member, then Test. Retry starts over.",
  ],
});