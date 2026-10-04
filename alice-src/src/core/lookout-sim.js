/* Pop-Up Lookout sim. DOM-free. Fixed 60 Hz steps. */
export const SIM_VERSION = "lookout-1";

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function rand() {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const STARS = [300, 500, 800];
const GOAL = 500;

/** schedule(seed, level, relaxed) → spawns */
export function schedule(seed, level, relaxed) {
  const lv = level || {};
  const rng = mulberry32(Number(seed) || 1);
  const holes = lv.holes || 5;
  const seconds = lv.seconds || 60;
  const duration = seconds * 60;
  const approach = relaxed ? 150 : 100;
  const gap = relaxed ? 170 : 120;
  const hawks = lv.hawks || 8;
  const spawns = [];
  let step = 80;
  while (spawns.length < hawks && step + approach < duration - 30) {
    spawns.push({
      step,
      kind: "hawk",
      hole: Math.floor(rng() * holes),
      edge: Math.floor(rng() * 3),
      approachSteps: approach,
    });
    step += approach + gap + Math.floor(rng() * 30);
  }
  return spawns;
}

function starsFor(score) {
  let stars = 0;
  for (const n of STARS) if (score >= n) stars += 1;
  return stars;
}

/**
 * score(schedule, events) → {score, combo, pupsSafe, stars, cleared}
 * events are [step, alarm] with alarm 0 Sky, 1 Ground, 2 Snake.
 * Hawk is a sky threat. First alarm inside the approach window counts.
 * Score only goes up.
 */
export function score(spawns, events) {
  const list = Array.isArray(spawns) ? spawns : [];
  const ev = (events || []).slice().sort((a, b) => a[0] - b[0]);
  const used = new Set();
  let points = 0;
  let combo = 0;
  let pupsSafe = 6;
  for (const spawn of list) {
    const end = spawn.step + spawn.approachSteps;
    let hit = null;
    for (let i = 0; i < ev.length; i++) {
      if (used.has(i)) continue;
      const step = ev[i][0];
      if (step < spawn.step || step > end) continue;
      used.add(i);
      hit = ev[i][1];
      break;
    }
    const sky = hit === 0;
    if (sky && spawn.kind === "hawk") {
      combo += 1;
      points += 100 * combo;
    } else if (hit != null) {
      combo = 0;
    } else {
      combo = 0;
      pupsSafe = Math.max(0, pupsSafe - 1);
    }
  }
  return {
    score: points,
    combo,
    pupsSafe,
    stars: starsFor(points),
    cleared: points >= GOAL,
  };
}

/** Live read for rendering. Only closed or answered windows affect the bank. */
export function view(spawns, events, step) {
  const closed = (spawns || []).filter((s) => {
    if (step >= s.step + s.approachSteps) return true;
    return (events || []).some((e) => e[0] >= s.step && e[0] <= s.step + s.approachSteps && e[0] <= step);
  });
  const out = score(closed, (events || []).filter((e) => e[0] <= step));
  const active = (spawns || []).find((s) => step >= s.step && step <= s.step + s.approachSteps);
  return Object.assign(out, { active: active || null, goal: GOAL, starMarks: STARS });
}

const editable = (target) => target?.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target?.tagName || "");
const modified = (e) => e.repeat || e.isComposing || e.ctrlKey || e.altKey || e.metaKey;

/** keyCell guard lifted from ai-bonk core.js, mapped to Sky/Ground/Snake. */
export function keyCell(e) {
  if (!e || modified(e) || editable(e.target)) return -1;
  const code = e.code || "";
  if (code === "KeyJ" || code === "Digit1" || code === "Numpad1") return 0;
  if (code === "KeyK" || code === "Digit2" || code === "Numpad2") return 1;
  if (code === "KeyL" || code === "Digit3" || code === "Numpad3") return 2;
  const key = (e.key || "").toLowerCase();
  if (key === "j" || key === "1") return 0;
  if (key === "k" || key === "2") return 1;
  if (key === "l" || key === "3") return 2;
  return -1;
}

/** Round spawn/expire/combo flow on 60 Hz steps. Scoring stays score(). */
export class Round {
  constructor(seed, level, relaxed) {
    this.spawns = schedule(seed, level, relaxed);
    this.events = [];
    this.step = 0;
    this.state = "running";
    this.pausedAt = 0;
  }
  advance() {
    if (this.state !== "running") return;
    this.step += 1;
  }
  alarm(cell) {
    if (this.state !== "running") return null;
    if (!Number.isInteger(cell) || cell < 0 || cell > 2) return null;
    this.events.push([this.step, cell]);
    return view(this.spawns, this.events, this.step);
  }
  pause() { if (this.state === "running") { this.state = "paused"; this.pausedAt = this.step; } }
  resume() { if (this.state === "paused") this.state = "running"; }
  read() { return view(this.spawns, this.events, this.step); }
}
