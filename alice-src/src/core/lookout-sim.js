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
