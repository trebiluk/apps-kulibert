import { LEVELS } from "./levels";
import {
  ACCEL_AIR,
  ACCEL_GROUND,
  APEX_BAND,
  COYOTE,
  DJUMP_V,
  FRICTION,
  GRAV_APEX,
  GRAV_DOWN,
  GRAV_UP,
  JUMP_BUFFER,
  JUMP_V,
  MAX_FALL,
  PLAYER_H,
  PLAYER_W,
  RUN_SPEED,
  VIEW_H,
  VIEW_W,
  clamp,
  overlap,
  type GroundKind,
  type Input,
  type LaserHazard,
  type LiveMover,
  type MoverDef,
  type Rect,
  type Runner,
  type SawHazard,
  type SimEvent,
  type World,
} from "./types";

type Plat = Rect & { moverId: string | null };

export function moverAt(m: MoverDef, clock: number) {
  const t = Math.sin(((clock + m.phase) / m.period) * Math.PI * 2);
  return m.axis === "x"
    ? { x: m.baseX + t * m.amp, y: m.baseY }
    : { x: m.baseX, y: m.baseY + t * m.amp };
}

export function laserState(h: LaserHazard, clock: number) {
  const p = (((clock + h.phase) % h.period) + h.period) % h.period / h.period;
  const hotStart = 1 - h.duty;
  return {
    hot: p >= hotStart,
    warn: p >= hotStart - 0.18 && p < hotStart,
  };
}

export function sawAt(h: SawHazard, clock: number) {
  const t = Math.sin(((clock + h.phase) / h.period) * Math.PI * 2);
  return {
    x: h.x + (h.axis === "x" ? t * h.amp : 0),
    y: h.y + (h.axis === "y" ? t * h.amp : 0),
  };
}

function makeRunner(id: 0 | 1, spawn: { x: number; y: number }): Runner {
  return {
    id,
    x: spawn.x,
    y: spawn.y,
    w: PLAYER_W,
    h: PLAYER_H,
    vx: 0,
    vy: 0,
    facing: 1,
    grounded: true,
    groundKind: "solid",
    riding: null,
    airJumps: 1,
    coyote: COYOTE,
    buffer: 0,
    drop: 0,
    cut: false,
    coins: 0,
    checkpoint: -1,
    invuln: 0,
    respawn: 0,
    dead: false,
    finished: false,
    finishTime: 0,
    anim: id * 0.4,
    landPulse: 0,
  };
}

export function createWorld(levelIndex: number, skipCountdown: boolean): World {
  const level = LEVELS[levelIndex];
  const spawn = level.spawns[0];
  const movers: LiveMover[] = level.movers.map((m) => {
    const p = moverAt(m, 0);
    return { ...m, x: p.x, y: p.y, prevX: p.x, prevY: p.y };
  });
  const checks: [boolean[], boolean[]] = [
    level.checkpoints.map(() => false),
    level.checkpoints.map(() => false),
  ];
  return {
    level,
    levelIndex,
    clock: 0,
    time: 0,
    countdown: skipCountdown ? 0 : 3,
    goFlash: skipCountdown ? 0.45 : 0,
    phase: skipCountdown ? "race" : "countdown",
    runners: [makeRunner(0, level.spawns[0]), makeRunner(1, level.spawns[1])],
    coins: level.coins.map(() => false),
    movers,
    checks,
    camX: clamp(spawn.x - VIEW_W * 0.28, 0, Math.max(0, level.width - VIEW_W)),
    camY: clamp(spawn.y - VIEW_H * 0.58, 0, Math.max(0, level.height - VIEW_H)),
    shake: 0,
    winner: null,
    finishHold: 0,
    banners: [],
    reported: false,
  };
}

function syncMovers(world: World) {
  for (const m of world.movers) {
    m.prevX = m.x;
    m.prevY = m.y;
    const p = moverAt(m, world.clock);
    m.x = p.x;
    m.y = p.y;
  }
}

function platformsOf(world: World): Plat[] {
  const list: Plat[] = world.level.oneways.map((o) => ({ ...o, moverId: null }));
  for (const m of world.movers) {
    list.push({ x: m.x, y: m.y, w: m.w, h: m.h, moverId: m.id });
  }
  return list;
}

function resolveX(runner: Runner, y: number, solids: Rect[]) {
  const feet = y + runner.h;
  const head = y;
  for (const s of solids) {
    if (runner.x + runner.w <= s.x || runner.x >= s.x + s.w) continue;
    if (feet <= s.y + 1.5 || head >= s.y + s.h - 1.5) continue;
    const penLeft = runner.x + runner.w - s.x;
    const penRight = s.x + s.w - runner.x;
    if (penLeft < penRight) {
      runner.x -= penLeft;
      if (runner.vx > 0) runner.vx = 0;
    } else {
      runner.x += penRight;
      if (runner.vx < 0) runner.vx = 0;
    }
  }
}

function resolveY(runner: Runner, prevY: number, solids: Rect[], platforms: Plat[]) {
  const prevBottom = prevY + runner.h;
  for (const s of solids) {
    if (!overlap(runner, s)) continue;
    if (runner.vy >= 0 && prevBottom <= s.y + 6) {
      runner.y = s.y - runner.h;
      runner.vy = 0;
      runner.grounded = true;
      runner.groundKind = "solid";
      runner.riding = null;
    } else if (runner.vy <= 0 && prevY >= s.y + s.h - 6) {
      runner.y = s.y + s.h;
      runner.vy = 0;
    }
  }
  if (runner.drop > 0) return;
  for (const p of platforms) {
    if (runner.vy < 0) continue;
    if (prevBottom > p.y + 5) continue;
    if (!overlap(runner, p)) continue;
    const landY = p.y - runner.h;
    if (runner.grounded && landY > runner.y + 0.5) continue;
    runner.y = landY;
    runner.vy = 0;
    runner.grounded = true;
    runner.groundKind = (p.moverId ? "mover" : "oneway") as GroundKind;
    runner.riding = p.moverId;
  }
}

function groundJump(runner: Runner, events: SimEvent[]) {
  runner.vy = JUMP_V;
  runner.coyote = 0;
  runner.grounded = false;
  runner.cut = false;
  runner.riding = null;
  runner.groundKind = null;
  events.push({ type: "jump", id: runner.id, double: false });
}

function airJump(runner: Runner, events: SimEvent[]) {
  runner.airJumps -= 1;
  runner.vy = DJUMP_V;
  runner.cut = false;
  runner.grounded = false;
  runner.riding = null;
  events.push({ type: "jump", id: runner.id, double: true });
}

function kill(world: World, runner: Runner, events: SimEvent[]) {
  if (runner.dead || runner.invuln > 0 || world.winner != null) return;
  runner.dead = true;
  runner.respawn = 0.58;
  runner.vx = 0;
  runner.vy = 0;
  runner.riding = null;
  world.shake = Math.max(world.shake, 9);
  events.push({
    type: "die",
    id: runner.id,
    x: runner.x + runner.w / 2,
    y: runner.y + runner.h / 2,
  });
}

function updateRunner(world: World, runner: Runner, input: Input, dt: number, events: SimEvent[]) {
  if (runner.dead) {
    runner.respawn -= dt;
    runner.vx = 0;
    runner.vy = 0;
    if (runner.respawn <= 0) {
      const spawn =
        runner.checkpoint >= 0
          ? world.level.checkpoints[runner.checkpoint]
          : world.level.spawns[runner.id];
      runner.x = spawn.x;
      runner.y = spawn.y;
      runner.dead = false;
      runner.invuln = 0.9;
      runner.airJumps = 1;
      runner.coyote = COYOTE;
      runner.grounded = true;
      runner.groundKind = "solid";
      runner.buffer = 0;
      runner.drop = 0;
      runner.vy = 0;
      runner.vx = 0;
    }
    return;
  }

  const wasGrounded = runner.grounded;
  const prevKind = runner.groundKind;

  if (runner.riding) {
    const m = world.movers.find((mm) => mm.id === runner.riding);
    if (m) {
      runner.x += m.x - m.prevX;
      runner.y += m.y - m.prevY;
    }
  }

  if (!wasGrounded) runner.coyote = Math.max(0, runner.coyote - dt);
  if (runner.drop > 0) runner.drop = Math.max(0, runner.drop - dt);
  if (runner.invuln > 0) runner.invuln = Math.max(0, runner.invuln - dt);
  if (runner.landPulse > 0) runner.landPulse = Math.max(0, runner.landPulse - dt);
  runner.anim += dt;

  if (input.jump) runner.buffer = JUMP_BUFFER;
  else runner.buffer = Math.max(0, runner.buffer - dt);

  const canGround = wasGrounded || runner.coyote > 0;
  let jumped = false;
  if (runner.buffer > 0 && canGround) {
    groundJump(runner, events);
    runner.buffer = 0;
    jumped = true;
  } else if (input.jump && runner.airJumps > 0) {
    airJump(runner, events);
    runner.buffer = 0;
    jumped = true;
  } else if (input.down && wasGrounded && (prevKind === "oneway" || prevKind === "mover")) {
    runner.drop = 0.2;
    runner.grounded = false;
    runner.riding = null;
    runner.y += 3;
    runner.vy = 90;
  }

  if (!input.jumpHeld && runner.vy < 0 && !runner.cut) {
    runner.vy *= 0.5;
    runner.cut = true;
  }

  let dir = 0;
  if (input.left && !input.right) dir = -1;
  else if (input.right && !input.left) dir = 1;
  const accel = runner.grounded ? ACCEL_GROUND : ACCEL_AIR;
  if (dir !== 0) {
    runner.vx += dir * accel * dt;
    runner.facing = dir === -1 ? -1 : 1;
  } else {
    const fr = (runner.grounded ? FRICTION : FRICTION * 0.22) * dt;
    if (Math.abs(runner.vx) <= fr) runner.vx = 0;
    else runner.vx -= Math.sign(runner.vx) * fr;
  }
  runner.vx = clamp(runner.vx, -RUN_SPEED, RUN_SPEED);

  let g = GRAV_UP;
  if (runner.vy > 30) g = GRAV_DOWN;
  else if (Math.abs(runner.vy) < APEX_BAND) g = GRAV_APEX;
  runner.vy = Math.min(MAX_FALL, runner.vy + g * dt);

  runner.grounded = false;
  runner.groundKind = null;
  runner.riding = null;

  const solids = world.level.solids;
  const platforms = platformsOf(world);
  const dx = runner.vx * dt;
  const dy = runner.vy * dt;
  const n = Math.max(1, Math.ceil(Math.max(Math.abs(dx), Math.abs(dy)) / 8));
  for (let i = 0; i < n; i++) {
    const prevY = runner.y;
    runner.x += dx / n;
    resolveX(runner, prevY, solids);
    const y0 = runner.y;
    runner.y += dy / n;
    resolveY(runner, y0, solids, platforms);
  }

  if (runner.x < 0) {
    runner.x = 0;
    if (runner.vx < 0) runner.vx = 0;
  }
  const maxX = world.level.width - runner.w;
  if (runner.x > maxX) {
    runner.x = maxX;
    if (runner.vx > 0) runner.vx = 0;
  }

  if (runner.grounded) {
    runner.airJumps = 1;
    runner.coyote = COYOTE;
    if (!wasGrounded && !jumped) {
      runner.landPulse = 0.14;
      events.push({
        type: "land",
        id: runner.id,
        x: runner.x + runner.w / 2,
        y: runner.y + runner.h,
      });
    }
    if (runner.buffer > 0) {
      groundJump(runner, events);
      runner.buffer = 0;
    }
  }
}

function bump(a: Runner, b: Runner, prevA: { x: number; y: number }, prevB: { x: number; y: number }) {
  if (a.dead || b.dead) return;
  if (!overlap(a, b)) return;
  const aAbove = a.vy >= 0 && prevA.y + a.h <= b.y + 8 && a.y < b.y;
  const bAbove = b.vy >= 0 && prevB.y + b.h <= a.y + 8 && b.y < a.y;
  if (aAbove && !bAbove) {
    a.y = b.y - a.h;
    a.vy = 0;
    a.grounded = true;
    a.groundKind = "head";
    a.airJumps = 1;
    a.coyote = COYOTE;
    return;
  }
  if (bAbove && !aAbove) {
    b.y = a.y - b.h;
    b.vy = 0;
    b.grounded = true;
    b.groundKind = "head";
    b.airJumps = 1;
    b.coyote = COYOTE;
    return;
  }
  const left = Math.max(a.x, b.x);
  const right = Math.min(a.x + a.w, b.x + b.w);
  const pen = right - left;
  if (pen <= 0) return;
  const half = pen / 2 + 0.05;
  if (a.x < b.x) {
    a.x -= half;
    b.x += half;
  } else {
    a.x += half;
    b.x -= half;
  }
  const av = a.vx;
  a.vx = b.vx * 0.85;
  b.vx = av * 0.85;
}

function hitsCircle(box: Rect, cx: number, cy: number, rad: number) {
  const x = Math.max(box.x, Math.min(cx, box.x + box.w));
  const y = Math.max(box.y, Math.min(cy, box.y + box.h));
  const dx = x - cx;
  const dy = y - cy;
  return dx * dx + dy * dy < rad * rad;
}

function sensor(cp: { x: number; y: number }): Rect {
  return { x: cp.x - 20, y: cp.y - 10, w: PLAYER_W + 40, h: PLAYER_H + 18 };
}

function hazardsAndPickups(world: World, events: SimEvent[]) {
  const level = world.level;
  for (const runner of world.runners) {
    if (runner.dead) continue;
    if (runner.y > level.killY) {
      kill(world, runner, events);
      continue;
    }
    const box: Rect = {
      x: runner.x + 3,
      y: runner.y + 3,
      w: runner.w - 6,
      h: runner.h - 4,
    };
    if (runner.invuln <= 0) {
      for (const hz of level.hazards) {
        if (hz.kind === "spikes") {
          if (overlap(box, hz)) kill(world, runner, events);
        } else if (hz.kind === "saw") {
          const c = sawAt(hz, world.clock);
          if (hitsCircle(box, c.x, c.y, hz.r)) kill(world, runner, events);
        } else if (laserState(hz, world.clock).hot && overlap(box, hz)) {
          kill(world, runner, events);
        }
        if (runner.dead) break;
      }
    }
    if (runner.dead) continue;

    level.coins.forEach((coin, index) => {
      if (world.coins[index]) return;
      if (hitsCircle(runner, coin.x, coin.y, 14)) {
        world.coins[index] = true;
        runner.coins += 1;
        events.push({ type: "coin", id: runner.id, x: coin.x, y: coin.y });
      }
    });

    level.checkpoints.forEach((cp, index) => {
      if (runner.checkpoint >= index) return;
      if (!overlap(runner, sensor(cp))) return;
      runner.checkpoint = index;
      world.checks[runner.id][index] = true;
      world.banners.push({ text: runner.id === 0 ? "VEX CHECKPOINT" : "RIO CHECKPOINT", life: 0.85, id: runner.id });
      events.push({ type: "check", id: runner.id });
    });

    if (world.winner == null && overlap(runner, level.goal)) {
      runner.finished = true;
      runner.finishTime = world.time;
      world.winner = runner.id;
      world.finishHold = 1.15;
      events.push({ type: "win", id: runner.id });
    }
  }
}

function updateCamera(world: World, dt: number) {
  const pack = world.runners.filter((r) => !r.dead);
  const focus = pack.length ? pack : world.runners;
  const lead = Math.max(...focus.map((r) => r.x + r.w));
  const avgY = focus.reduce((sum, r) => sum + r.y, 0) / focus.length;
  const maxX = Math.max(0, world.level.width - VIEW_W);
  const maxY = Math.max(0, world.level.height - VIEW_H);
  const desiredX = clamp(lead - VIEW_W * 0.46, 0, maxX);
  const desiredY = clamp(avgY - VIEW_H * 0.6, 0, maxY);
  const k = 1 - Math.exp(-3.6 * dt);
  world.camX += (desiredX - world.camX) * k;
  world.camY += (desiredY - world.camY) * k;
  world.shake = Math.max(0, world.shake - dt * 16);
  world.banners = world.banners.filter((b) => {
    b.life -= dt;
    return b.life > 0;
  });
}

export function step(world: World, inputs: [Input, Input], dt: number): SimEvent[] {
  const events: SimEvent[] = [];
  world.clock += dt;
  syncMovers(world);

  if (world.phase === "countdown") {
    world.countdown -= dt;
    for (let i = 0; i < 2; i++) {
      const runner = world.runners[i];
      if (inputs[i].jump) runner.buffer = JUMP_BUFFER;
      else runner.buffer = Math.max(0, runner.buffer - dt);
    }
    if (world.countdown <= 0) {
      world.countdown = 0;
      world.phase = "race";
      world.goFlash = 0.55;
      events.push({ type: "go" });
    }
  } else if (world.phase === "race") {
    if (world.winner != null) {
      world.finishHold -= dt;
      if (world.finishHold <= 0) world.phase = "done";
    } else {
      world.time += dt;
      if (world.goFlash > 0) world.goFlash -= dt;
      const prev = world.runners.map((r) => ({ x: r.x, y: r.y }));
      updateRunner(world, world.runners[0], inputs[0], dt, events);
      updateRunner(world, world.runners[1], inputs[1], dt, events);
      bump(world.runners[0], world.runners[1], prev[0], prev[1]);
      resolveX(world.runners[0], world.runners[0].y, world.level.solids);
      resolveX(world.runners[1], world.runners[1].y, world.level.solids);
      hazardsAndPickups(world, events);
    }
  }

  updateCamera(world, dt);
  return events;
}

function nearestTop(world: World, x: number, feet: number) {
  let best: number | null = null;
  const rects: Rect[] = [
    ...world.level.solids,
    ...world.level.oneways,
    ...world.movers.map((m) => ({ x: m.x, y: m.y, w: m.w, h: m.h })),
  ];
  for (const rect of rects) {
    if (x < rect.x + 2 || x > rect.x + rect.w - 2) continue;
    if (rect.y < feet - 8) continue;
    if (best == null || rect.y < best) best = rect.y;
  }
  return best;
}

function gateBlocks(world: World, runner: Runner) {
  for (const hz of world.level.hazards) {
    if (hz.kind !== "laser" || hz.mode !== "gate") continue;
    const state = laserState(hz, world.clock);
    if (!state.hot && !state.warn) continue;
    const ahead = runner.x + runner.w + 6 > hz.x - 22 && runner.x < hz.x + hz.w;
    const vertical = runner.y < hz.y + hz.h && runner.y + runner.h > hz.y - 4;
    if (ahead && vertical) return true;
  }
  return false;
}

function hurdleAhead(world: World, runner: Runner) {
  const feet = runner.y + runner.h;
  for (const hz of world.level.hazards) {
    if (hz.kind === "spikes") {
      const near = hz.x < runner.x + runner.w + 64 && hz.x + hz.w > runner.x + 4;
      if (near && hz.y > feet - 28 && hz.y < feet + 6) return true;
    } else if (hz.kind === "saw") {
      const c = sawAt(hz, world.clock);
      if (Math.abs(c.x - (runner.x + runner.w)) < 72 && Math.abs(c.y - (feet - 12)) < 36) return true;
    } else if (hz.mode === "hurdle" && laserState(hz, world.clock).hot) {
      const near = hz.x < runner.x + runner.w + 56 && hz.x + hz.w > runner.x;
      if (near && hz.y < feet && hz.y + hz.h > feet - 26) return true;
    }
  }
  return false;
}

/** Offline heat used to prove a course is finishable. Not shown in the UI. */
export function practiceRun(levelIndex: number, seconds = 70) {
  const world = createWorld(levelIndex, true);
  world.runners[1].dead = true;
  world.runners[1].respawn = 999;
  const held: [boolean, boolean] = [false, false];
  let deaths = 0;
  const deathX: number[] = [];
  const maxX: [number, number] = [0, 0];
  const dt = 1 / 60;
  const frames = Math.round(seconds * 60);
  for (let frame = 0; frame < frames; frame++) {
    const inputs = [0, 1].map((id) => {
      const runner = world.runners[id as 0 | 1];
      const feet = runner.y + runner.h;
      const support = nearestTop(world, runner.x + runner.w + 52, feet - 4);
      const gap = support == null || support > feet + 22;
      const rise = support != null && support < feet - 28;
      const hurdle = hurdleAhead(world, runner);
      const gate = gateBlocks(world, runner);
      const obstacle = gap || rise || hurdle;
      const rising = !runner.grounded && held[id as 0 | 1] && runner.vy < 40;
      const want =
        !gate &&
        ((runner.grounded && obstacle) ||
          rising ||
          (!runner.grounded && runner.vy > 70 && runner.airJumps > 0 && obstacle));
      const jump = want && !held[id as 0 | 1];
      held[id as 0 | 1] = want;
      const input: Input = {
        left: false,
        right: !gate && !runner.dead,
        jump,
        jumpHeld: want,
        down: false,
      };
      return input;
    }) as [Input, Input];
    const events = step(world, inputs, dt);
    for (const event of events) {
      if (event.type === "die") {
        deaths += 1;
        if (deathX.length < 16) deathX.push(Math.round(event.x));
      }
    }
    maxX[0] = Math.max(maxX[0], world.runners[0].x);
    maxX[1] = Math.max(maxX[1], world.runners[1].x);
    if (world.phase === "done") break;
  }
  return {
    phase: world.phase,
    winner: world.winner,
    time: Number(world.time.toFixed(2)),
    x: world.runners.map((runner) => Math.round(runner.x)),
    maxX: maxX.map((value) => Math.round(value)),
    coins: world.runners.map((runner) => runner.coins),
    deaths,
    deathX,
    width: world.level.width,
  };
}
