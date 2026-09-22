// Classroom span check. A pier holds only when every cell under that
// deck, down to the water, is filled. This is not a physics engine.

export function spanSpec(assist) {
  if (assist) return { cols: 5, pierDepth: 1, maxRun: 3 };
  return { cols: 7, pierDepth: 2, maxRun: 2 };
}

export function supportCols(spec, parts) {
  const cols = [0];
  for (let c = 1; c < spec.cols - 1; c++) {
    let filled = 0;
    for (let r = 1; r <= spec.pierDepth; r++) {
      if (parts.some((p) => p.kind === "pier" && p.c === c && p.r === r)) filled += 1;
    }
    if (spec.pierDepth > 0 && filled === spec.pierDepth) cols.push(c);
  }
  cols.push(spec.cols - 1);
  return cols;
}

export function judgeSpan(spec, parts) {
  const deck = new Map();
  for (const p of parts) {
    if (p.r === 0 && (p.kind === "deck" || p.kind === "beam")) deck.set(p.c, p.kind);
  }

  let missing = 0;
  for (let c = 1; c < spec.cols - 1; c++) {
    if (!deck.has(c)) missing += 1;
  }
  if (missing === spec.cols - 2) return { ok: false, reason: "empty" };
  if (missing > 0) return { ok: false, reason: "gap" };

  const mid = Math.floor(spec.cols / 2);
  if (deck.get(mid) !== "deck") return { ok: false, reason: "nodeck" };

  let partial = false;
  for (let c = 1; c < spec.cols - 1; c++) {
    let filled = 0;
    for (let r = 1; r <= spec.pierDepth; r++) {
      if (parts.some((p) => p.kind === "pier" && p.c === c && p.r === r)) filled += 1;
    }
    if (filled > 0 && filled < spec.pierDepth) partial = true;
  }

  const supports = supportCols(spec, parts);
  for (let i = 1; i < supports.length; i++) {
    const between = supports[i] - supports[i - 1] - 1;
    if (between > spec.maxRun) {
      return { ok: false, reason: partial ? "partial" : "long" };
    }
  }
  return { ok: true, reason: "pass" };
}
