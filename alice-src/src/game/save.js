const KEY = "alice.save.v1";
const fresh = () => ({ v: 1, seeds: 0, owned: [], worn: { alice: "", wonderland: "" }, burrow: { decor: [] }, best: {}, daily: {}, settings: {}, seen: {} });
export let current = fresh();
export function loadSave() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || "null");
    if (!raw || raw.v !== 1) current = fresh();
    else current = Object.assign(fresh(), raw, { best: raw.best || {}, seen: raw.seen || {}, worn: raw.worn || fresh().worn, burrow: raw.burrow || fresh().burrow });
  } catch (e) { current = fresh(); }
  return current;
}
let timer = 0;
export function saveSave() {
  clearTimeout(timer);
  timer = setTimeout(write, 300);
}
export function saveNow() { write(); }
function write() {
  try { localStorage.setItem(KEY, JSON.stringify(current)); } catch (e) {}
}
export function seedsFor(score, stars) {
  return Math.min(40, Math.floor(score / 100) + stars * 5);
}
if (typeof window !== "undefined") window.addEventListener("pagehide", () => write());
