// Load prove. Matter.js (npm matter-js 0.20.0) decides if the load stays up.
// The page loads ./vendor/matter.min.js before this module. Coach hints stay in logic.js.
// If the vendor script fails, the classroom check still returns a word so Help and Test stay up.

import { judgeSpan } from "./logic.js";

function matterNs() {
  const M = globalThis.Matter;
  if (!M || !M.Engine || !M.Bodies || !M.Composite || !M.Constraint) return null;
  return M;
}

export function proveLoad(spec, parts) {
  const M = matterNs();
  if (!M) {
    const coach = judgeSpan(spec, parts);
    return { ok: coach.ok, reason: coach.reason, sag: coach.ok ? 0 : 99 };
  }
  const { Engine, Bodies, Composite, Constraint } = M;
  const CELL = 64;
  const DECK_H = 16;
  const DECK_Y = 120;

  function pierFull(spec, parts, c) {
    if (spec.pierDepth <= 0) return false;
    for (let r = 1; r <= spec.pierDepth; r++) {
      if (!parts.some((p) => p.kind === "pier" && p.c === c && p.r === r)) return false;
    }
    return true;
  }

  function link(bodyA, pointA, bodyB, pointB, stiffness) {
    const ax = bodyA.position.x + pointA.x;
    const ay = bodyA.position.y + pointA.y;
    const bx = bodyB.position.x + pointB.x;
    const by = bodyB.position.y + pointB.y;
    return Constraint.create({
      bodyA,
      pointA,
      bodyB,
      pointB,
      length: Math.hypot(ax - bx, ay - by),
      stiffness,
      damping: 0.45,
    });
  }

  const deck = new Map();
  const beam = new Set();
  let partial = false;
  for (const p of parts) {
    if (p.r === 0 && p.kind === "deck") deck.set(p.c, true);
    if (p.r === 0 && p.kind === "beam") beam.add(p.c);
  }
  for (let c = 1; c < spec.cols - 1; c++) {
    let filled = 0;
    for (let r = 1; r <= spec.pierDepth; r++) {
      if (parts.some((p) => p.kind === "pier" && p.c === c && p.r === r)) filled += 1;
    }
    if (filled > 0 && filled < spec.pierDepth) partial = true;
  }

  let missing = 0;
  for (let c = 1; c < spec.cols - 1; c++) {
    if (!deck.has(c) && !beam.has(c)) missing += 1;
  }
  const mid = Math.floor(spec.cols / 2);

  const engine = Engine.create({ enableSleeping: false });
  engine.gravity.y = 1.15;
  engine.positionIterations = 12;
  engine.velocityIterations = 8;
  const world = engine.world;

  const bankW = CELL * 0.92;
  const bankH = spec.pierDepth * CELL + CELL;
  const bankY = DECK_Y + bankH / 2 - DECK_H;
  const leftBank = Bodies.rectangle(CELL * 0.5, bankY, bankW, bankH, {
    isStatic: true,
    friction: 1,
    collisionFilter: { category: 0x0001, mask: 0xffff },
  });
  const rightBank = Bodies.rectangle((spec.cols - 0.5) * CELL, bankY, bankW, bankH, {
    isStatic: true,
    friction: 1,
    collisionFilter: { category: 0x0001, mask: 0xffff },
  });
  Composite.add(world, [leftBank, rightBank]);

  const members = new Map();
  for (let c = 1; c < spec.cols - 1; c++) {
    const hasDeck = deck.has(c);
    const hasBeam = beam.has(c);
    if (!hasDeck && !hasBeam) continue;
    const supported = hasDeck && pierFull(spec, parts, c);
    const body = Bodies.rectangle((c + 0.5) * CELL, DECK_Y, CELL * 0.9, hasDeck ? DECK_H : 7, {
      isStatic: supported,
      friction: 0.98,
      frictionStatic: 1,
      restitution: 0,
      density: hasDeck ? 0.0016 : 0.0003,
      collisionFilter: hasDeck
        ? { category: 0x0001, mask: 0xffff }
        : { category: 0x0002, mask: 0x0002 },
    });
    members.set(c, body);
    Composite.add(world, body);
    if (supported) {
      Composite.add(
        world,
        Bodies.rectangle(
          (c + 0.5) * CELL,
          DECK_Y + (spec.pierDepth * CELL) / 2 + 8,
          CELL * 0.42,
          spec.pierDepth * CELL,
          { isStatic: true, friction: 1 },
        ),
      );
    }
  }

  const cols = [...members.keys()].sort((a, b) => a - b);
  for (let i = 0; i < cols.length - 1; i++) {
    const a = cols[i];
    const b = cols[i + 1];
    if (b !== a + 1) continue;
    const bodyA = members.get(a);
    const bodyB = members.get(b);
    if (bodyA.isStatic && bodyB.isStatic) continue;
    const floppy = !deck.has(a) || !deck.has(b);
    const stiff = beam.has(a) || beam.has(b) ? 0.88 : 0.22;
    Composite.add(
      world,
      link(bodyA, { x: CELL * 0.38, y: 0 }, bodyB, { x: -CELL * 0.38, y: 0 }, floppy ? 0.12 : stiff),
    );
  }

  function pin(col, bank, side) {
    const body = members.get(col);
    if (!body || body.isStatic) return;
    const edge = side < 0 ? bankW / 2 - 2 : -bankW / 2 + 2;
    Composite.add(
      world,
      link(
        bank,
        { x: edge, y: DECK_Y - bank.position.y },
        body,
        { x: side < 0 ? -CELL * 0.36 : CELL * 0.36, y: 0 },
        0.86,
      ),
    );
  }
  pin(1, leftBank, -1);
  pin(spec.cols - 2, rightBank, 1);

  const load = Bodies.rectangle((mid + 0.5) * CELL, DECK_Y - 90, CELL * 0.62, 24, {
    density: 0.01,
    friction: 0.9,
    restitution: 0,
    collisionFilter: { category: 0x0004, mask: 0x0001 },
  });
  Composite.add(world, load);

  const dt = 1000 / 60;
  for (let i = 0; i < 220; i++) Engine.update(engine, dt);

  const waterY = DECK_Y + spec.pierDepth * CELL + 36;
  const fell = load.position.y > waterY || load.position.y > DECK_Y + CELL * 0.85;
  const resting = load.position.y < DECK_Y + 28 && Math.abs(load.velocity.y) < 0.8;
  const midDeck = members.get(mid);
  const deckHeld =
    midDeck &&
    deck.has(mid) &&
    midDeck.position.y < DECK_Y + CELL * 0.42 &&
    Math.abs(load.position.x - midDeck.position.x) < CELL * 0.7;

  let reason = "pass";
  let ok = resting && deckHeld && !fell;
  if (!ok) {
    if (missing === spec.cols - 2) reason = "empty";
    else if (missing > 0) reason = "gap";
    else if (!deck.has(mid)) reason = "nodeck";
    else if (partial) reason = "partial";
    else reason = "long";
    ok = false;
  }

  const sag = midDeck ? Math.max(0, midDeck.position.y - DECK_Y) : CELL;
  return { ok, reason, sag };
}
