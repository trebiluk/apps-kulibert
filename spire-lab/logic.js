// Classroom stand check. A stack tips when it is taller than twice its
// base. This is not a physics engine.

export const HOLD_SECONDS = 5;

export function spireSpec(assist) {
  if (assist) return { cols: 3, rows: 4, goal: 2 };
  return { cols: 5, rows: 6, goal: 3 };
}

export function cellsOf(part) {
  if (part.kind === "column") return [[part.c, part.r], [part.c, part.r + 1]];
  return [[part.c, part.r]];
}

export function judgeSpire(spec, parts) {
  const occ = new Map();
  for (const p of parts) {
    for (const [c, r] of cellsOf(p)) {
      if (c < 0 || r < 0 || c >= spec.cols || r >= spec.rows) {
        return { ok: false, reason: "float" };
      }
      const key = c + "," + r;
      if (occ.has(key)) return { ok: false, reason: "float" };
      occ.set(key, p.id);
    }
  }
  if (occ.size === 0) return { ok: false, reason: "empty" };

  for (const key of occ.keys()) {
    const [c, r] = key.split(",").map(Number);
    if (r > 0 && !occ.has(c + "," + (r - 1))) return { ok: false, reason: "float" };
  }

  const seen = new Set();
  let stableTall = false;
  let tippedTall = false;
  let anyShort = false;

  for (const start of occ.keys()) {
    if (seen.has(start)) continue;
    const stack = [start];
    const comp = [];
    seen.add(start);
    while (stack.length) {
      const key = stack.pop();
      comp.push(key);
      const [c, r] = key.split(",").map(Number);
      const neighbors = [[c - 1, r], [c + 1, r], [c, r - 1], [c, r + 1]];
      for (const [nc, nr] of neighbors) {
        const next = nc + "," + nr;
        if (occ.has(next) && !seen.has(next)) {
          seen.add(next);
          stack.push(next);
        }
      }
    }

    let height = 0;
    const base = new Set();
    for (const key of comp) {
      const [c, r] = key.split(",").map(Number);
      height = Math.max(height, r + 1);
      if (r === 0) base.add(c);
    }
    if (height < spec.goal) {
      anyShort = true;
      continue;
    }
    if (height > base.size * 2) tippedTall = true;
    else stableTall = true;
  }

  if (stableTall) return { ok: true, reason: "pass" };
  if (tippedTall) return { ok: false, reason: "tip" };
  if (anyShort) return { ok: false, reason: "short" };
  return { ok: false, reason: "short" };
}
