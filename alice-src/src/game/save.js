const KEY = "alice.save.v1";
const baseSettings = () => ({ look: "teal", speed: "normal", captions: true, classMin: 0, classStart: 0, classRang: 0 });
const baseBoards = () => ({ class: [], daily: [], endless: [] });
const fresh = () => ({ v: 1, seeds: 0, owned: [], worn: { alice: "", wonderland: "" }, burrow: { decor: [] }, best: {}, daily: {}, settings: baseSettings(), seen: {}, boards: baseBoards() });
export let current = fresh();
export function loadSave() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || "null");
    if (!raw || raw.v !== 1) current = fresh();
    else current = Object.assign(fresh(), raw, {
      best: raw.best || {},
      seen: raw.seen || {},
      worn: raw.worn || fresh().worn,
      burrow: raw.burrow || fresh().burrow,
      daily: raw.daily || {},
      settings: Object.assign(baseSettings(), raw.settings || {}),
      boards: Object.assign(baseBoards(), raw.boards || {}),
    });
  } catch (e) { current = fresh(); }
  return current;
}
export function settings() {
  current.settings = Object.assign(baseSettings(), current.settings || {});
  return current.settings;
}
export function boardKey(mode) {
  return mode === "daily" ? "daily" : mode === "endless" ? "endless" : "class";
}
export function pushBoard(mode, score) {
  const key = boardKey(mode);
  const list = (current.boards[key] || []).concat([{ score, at: Date.now() }]);
  list.sort((a, b) => b.score - a.score);
  current.boards[key] = list.slice(0, 5);
  return current.boards[key][0] ? current.boards[key][0].score : score;
}
export function topScore(mode) {
  const row = (current.boards[boardKey(mode)] || [])[0];
  return row ? row.score : 0;
}
let timer = 0;
let dirty = false;
export function saveSave() {
  dirty = true;
  clearTimeout(timer);
  timer = setTimeout(write, 300);
}
export function saveNow() { dirty = true; write(); }
function write() {
  if (!dirty) return;
  try { localStorage.setItem(KEY, JSON.stringify(current)); dirty = false; } catch (e) {}
}
export function seedsFor(score, stars) {
  return Math.min(40, Math.floor(score / 100) + stars * 5);
}
export function classLeft() {
  const s = settings();
  if (!s.classMin || !s.classStart) return null;
  return s.classStart + s.classMin * 60000 - Date.now();
}
if (typeof window !== "undefined") window.addEventListener("pagehide", () => write());
