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

const ALARM = { hawk: 0, coyote: 1, snake: 2 };
const REASON = { rabbit: "whyRabbit", cloud: "whyCloud", weed: "whyWeed", wonder: "whyWonder", hawk: "whyHawk", coyote: "whyCoyote", snake: "whySnake" };

export function schedule(seed, level, relaxed) {
  const lv = level || {};
  const rng = mulberry32(Number(seed) || 1);
  const holes = lv.holes || 5;
  const seconds = lv.seconds || 60;
  const duration = seconds * 60;
  const speed = lv.speed || 1;
  const kinds = lv.kinds || ["hawk"];
  const decoys = lv.decoys || [];
  const pool = kinds.concat(decoys);
  const hawks = lv.hawks || 8;
  const spawns = [];
  let step = 80;
  while (spawns.length < hawks && step + 80 < duration - 30) {
    const third = step < duration / 3 ? 1 : step < (2 * duration) / 3 ? 0.85 : 0.7;
    const approach = Math.max(50, Math.round((relaxed ? 150 : 100) * third / speed));
    const kind = pool[Math.floor(rng() * pool.length)];
    spawns.push({
      step,
      kind,
      hole: Math.floor(rng() * holes),
      edge: Math.floor(rng() * 3),
      approachSteps: approach,
      alarm: ALARM[kind] == null ? -1 : ALARM[kind],
    });
    step += approach + (relaxed ? 170 : 120) + Math.floor(rng() * 30);
  }
  return spawns;
}

function starsFor(score, marks) {
  let stars = 0;
  for (const n of marks || [300, 500, 800]) if (score >= n) stars += 1;
  return stars;
}

export function score(spawns, events) {
  return scoreRound(spawns, events, { goalScore: 500, stars: [300, 500, 800], pupsMin: 0 });
}

export function scoreRound(spawns, events, level) {
  const lv = level || {};
  const list = Array.isArray(spawns) ? spawns : [];
  const ev = (events || []).slice().sort((a, b) => a[0] - b[0]);
  const used = new Set();
  let points = 0;
  let combo = 0;
  let bestCombo = 0;
  let pupsSafe = 6;
  let falseAlarms = 0;
  let why = "";
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
    const decoy = spawn.alarm == null || spawn.alarm < 0;
    if (decoy) {
      if (hit != null) { combo = 0; falseAlarms += 1; why = REASON[spawn.kind] || "whyCloud"; }
      continue;
    }
    if (hit === spawn.alarm) {
      combo += 1;
      bestCombo = Math.max(bestCombo, combo);
      points += 100 * combo;
    } else if (hit != null) {
      combo = 0;
      why = REASON[spawn.kind] || "whyHawk";
    } else {
      combo = 0;
      pupsSafe = Math.max(0, pupsSafe - 1);
      why = REASON[spawn.kind] || "whyHawk";
    }
  }
  const marks = lv.stars || [300, 500, 800];
  const goalScore = lv.goalScore || 500;
  const pupsMin = lv.pupsMin || 0;
  const needCombo = lv.combo || 0;
  const scoreOk = points >= goalScore;
  const pupsOk = pupsSafe >= pupsMin;
  const comboOk = bestCombo >= needCombo;
  const falseOk = !lv.noFalse || falseAlarms === 0;
  const cleared = scoreOk && pupsOk && comboOk && falseOk;
  return {
    score: points,
    combo,
    bestCombo,
    pupsSafe,
    falseAlarms,
    stars: cleared ? starsFor(points, marks) : 0,
    cleared,
    why,
    goal: goalScore,
  };
}

export function view(spawns, events, step, level) {
  const closed = (spawns || []).filter((s) => step >= s.step + s.approachSteps || (events || []).some((e) => e[0] >= s.step && e[0] <= s.step + s.approachSteps && e[0] <= step));
  const out = scoreRound(closed, (events || []).filter((e) => e[0] <= step), level);
  const active = (spawns || []).find((s) => step >= s.step && step <= s.step + s.approachSteps);
  return Object.assign(out, { active: active || null });
}

const editable = (target) => target?.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target?.tagName || "");
const modified = (e) => e.repeat || e.isComposing || e.ctrlKey || e.altKey || e.metaKey;
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

export class Round {
  constructor(seed, level, relaxed) {
    this.level = level;
    this.spawns = schedule(seed, level, relaxed);
    this.events = [];
    this.step = 0;
    this.state = "running";
  }
  advance() { if (this.state === "running") this.step += 1; }
  alarm(cell) {
    if (this.state !== "running") return null;
    if (!Number.isInteger(cell) || cell < 0 || cell > 2) return null;
    this.events.push([this.step, cell]);
    return this.read();
  }
  pause() { if (this.state === "running") this.state = "paused"; }
  resume() { if (this.state === "paused") this.state = "running"; }
  read() { return view(this.spawns, this.events, this.step, this.level); }
}
