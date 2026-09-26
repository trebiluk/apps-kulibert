// Pin-joint truss check. Matter.js. A triangle stays. A square folds.
// Not a full analysis. The word on screen is still the grade.

export function matterNs() {
  const M = globalThis.Matter;
  if (!M || !M.Engine || !M.Bodies) return null;
  return M;
}

export function proveTruss(model, opts = {}) {
  const M = matterNs();
  if (!M) return { ok: false, reason: "nophysics", sag: 99, lean: 0 };
  const { Engine, Bodies, Composite, Constraint } = M;
  const joints = model.joints || [];
  const members = model.members || [];
  if (joints.length < 2 || members.length < 2) {
    return { ok: false, reason: "few", sag: 99, lean: 0 };
  }
  const engine = Engine.create({ enableSleeping: false });
  engine.gravity.y = opts.gravity == null ? 1 : opts.gravity;
  engine.positionIterations = 14;
  engine.velocityIterations = 10;
  engine.constraintIterations = 12;
  const world = engine.world;
  const bodies = joints.map((j) => Bodies.circle(j.x, j.y, 10, {
    isStatic: !!j.fixed,
    density: j.fixed ? 0.01 : 0.002,
    friction: 0.05,
    frictionAir: 0.015,
    restitution: 0,
  }));
  Composite.add(world, bodies);
  const rests = [];
  for (const m of members) {
    const a = bodies[m.a];
    const b = bodies[m.b];
    if (!a || !b) continue;
    const length = Math.hypot(a.position.x - b.position.x, a.position.y - b.position.y);
    rests.push(length);
    Composite.add(world, Constraint.create({
      bodyA: a,
      bodyB: b,
      length,
      stiffness: opts.stiffness == null ? 0.99 : opts.stiffness,
      damping: 0.35,
    }));
  }
  const loadIndex = model.loadIndex;
  const loadJoint = bodies[loadIndex];
  let weight = null;
  if (loadJoint && !loadJoint.isStatic) {
    weight = Bodies.circle(loadJoint.position.x, loadJoint.position.y + 28, 14, {
      density: opts.load == null ? 0.02 : opts.load,
      frictionAir: 0.01,
    });
    Composite.add(world, weight);
    Composite.add(world, Constraint.create({
      bodyA: loadJoint,
      bodyB: weight,
      length: 34,
      stiffness: 0.95,
      damping: 0.4,
    }));
  }
  const startY = bodies.map((b) => b.position.y);
  const steps = opts.steps || 160;
  const nudge = opts.nudge == null ? 0.0008 : opts.nudge;
  const gust = !!opts.gust;
  const linked = new Set();
  if (gust) {
    const adj = bodies.map(() => []);
    for (const m of members) {
      if (!bodies[m.a] || !bodies[m.b]) continue;
      adj[m.a].push(m.b);
      adj[m.b].push(m.a);
    }
    const q = [];
    bodies.forEach((b, i) => {
      if (b.isStatic) {
        linked.add(i);
        q.push(i);
      }
    });
    while (q.length) {
      const i = q.pop();
      for (const k of adj[i]) {
        if (linked.has(k)) continue;
        linked.add(k);
        q.push(k);
      }
    }
  }
  let gustTop = Infinity;
  if (gust) {
    for (let i = 0; i < bodies.length; i++) {
      if (!linked.has(i) || bodies[i].isStatic) continue;
      gustTop = Math.min(gustTop, startY[i]);
    }
  }
  const frames = [];
  const snap = () => {
    frames.push({
      joints: bodies.map((b) => ({ x: b.position.x, y: b.position.y })),
      weight: weight ? { x: weight.position.x, y: weight.position.y } : null,
    });
  };
  snap();
  for (let i = 0; i < steps; i++) {
    if (nudge) {
      const sign = opts.nudgeSign || 1;
      for (let bi = 0; bi < bodies.length; bi++) {
        const b = bodies[bi];
        if (b.isStatic) continue;
        if (gust && (!linked.has(bi) || startY[bi] > gustTop + 30)) continue;
        b.force.x += nudge * sign * b.mass;
      }
    }
    Engine.update(engine, 1000 / 60);
    if (i % 8 === 7) snap();
  }
  let sag = 0;
  let lean = 0;
  let hot = -1;
  let hotScore = -1;
  for (let i = 0; i < bodies.length; i++) {
    if (bodies[i].isStatic) continue;
    const drop = bodies[i].position.y - startY[i];
    const side = Math.abs(bodies[i].position.x - joints[i].x);
    sag = Math.max(sag, drop);
    lean = Math.max(lean, side);
    const score = drop + side;
    if (score > hotScore) {
      hotScore = score;
      hot = i;
    }
  }
  if (weight && loadJoint) sag = Math.max(sag, weight.position.y - (startY[loadIndex] + 34));
  const sagLimit = opts.sagLimit == null ? 48 : opts.sagLimit;
  const leanLimit = opts.leanLimit == null ? 70 : opts.leanLimit;
  const ok = sag <= sagLimit && lean <= leanLimit;
  let reason = "pass";
  if (joints.length < 2 || members.length < 2) reason = "few";
  else if (!ok && sag > sagLimit) reason = "sag";
  else if (!ok) reason = "lean";
  try {
    if (M.World && M.World.clear) M.World.clear(world, false);
    if (M.Engine && M.Engine.clear) M.Engine.clear(engine);
  } catch (err) {
    /* the grade is already on the table */
  }
  return { ok, reason, sag: Math.round(sag), lean: Math.round(lean), hot, frames };
}
