import { laserState, sawAt } from "./sim";
import { VIEW_H, VIEW_W, type Runner, type World } from "./types";

export type SpriteSet = {
  run: HTMLImageElement | null;
  jump: HTMLImageElement | null;
};

export type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  color: string;
  size: number;
};

const CYAN = "#2ee6c7";
const AMBER = "#ffb020";
const DANGER = "#ff4b4b";
const FG = "#e8eef4";
const MUTED = "#8b98a6";

const COLORS = [CYAN, AMBER] as const;
const NAMES = ["VEX", "RIO"] as const;

export function tickParticles(particles: Particle[], dt: number) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.life -= dt;
    if (p.life <= 0) {
      particles.splice(i, 1);
      continue;
    }
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 780 * dt;
  }
}

export function renderAttract(ctx: CanvasRenderingContext2D, time: number) {
  paintSky(ctx);
  paintTruss(ctx, time * 24, 40);
  ctx.save();
  ctx.globalAlpha = 0.55;
  spotlight(ctx, 280 + Math.sin(time * 0.6) * 30, CYAN);
  spotlight(ctx, 680 + Math.cos(time * 0.5) * 24, AMBER);
  ctx.restore();
}

export function renderWorld(
  ctx: CanvasRenderingContext2D,
  world: World,
  sprites: [SpriteSet, SpriteSet],
  particles: Particle[],
  reduced: boolean,
) {
  const shake = reduced ? 0 : world.shake;
  paintSky(ctx);
  paintTruss(ctx, world.camX * 0.35, world.camY * 0.2);
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, VIEW_W, VIEW_H);
  ctx.clip();
  ctx.translate(-Math.round(world.camX), -Math.round(world.camY));
  if (shake > 0.2) {
    ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);
  }
  for (const solid of world.level.solids) drawDeck(ctx, solid.x, solid.y, solid.w, solid.h);
  for (const rail of world.level.oneways) drawRail(ctx, rail.x, rail.y, rail.w);
  for (const mover of world.movers) drawMover(ctx, mover.x, mover.y, mover.w, mover.h, world.clock);
  for (const hz of world.level.hazards) {
    if (hz.kind === "spikes") drawSpikes(ctx, hz.x, hz.y, hz.w, hz.h);
    else if (hz.kind === "saw") {
      const c = sawAt(hz, world.clock);
      drawSaw(ctx, c.x, c.y, hz.r, world.clock);
    } else drawLaser(ctx, hz.x, hz.y, hz.w, hz.h, laserState(hz, world.clock), hz.mode);
  }
  world.level.coins.forEach((coin, index) => {
    if (!world.coins[index]) drawCoin(ctx, coin.x, coin.y, world.clock + index);
  });
  world.level.checkpoints.forEach((cp, index) => {
    drawCheckpoint(ctx, cp.x, cp.y, world.checks[0][index], world.checks[1][index]);
  });
  drawFlag(ctx, world.level.goal, world.clock);
  drawParticles(ctx, particles);
  for (const runner of world.runners) {
    if (runner.dead) continue;
    drawRunner(ctx, runner, sprites[runner.id], world.clock, reduced);
  }
  ctx.restore();

  if (world.phase === "countdown" && world.countdown > 0) {
    callout(ctx, String(Math.ceil(world.countdown)), FG);
  } else if (world.goFlash > 0) {
    callout(ctx, "GO", CYAN);
  } else if (world.winner != null) {
    callout(ctx, world.winner === 0 ? "VEX TAKES IT" : "RIO TAKES IT", COLORS[world.winner]);
  }
  const banner = world.banners[world.banners.length - 1];
  if (banner && world.winner == null && world.phase !== "countdown") {
    ctx.save();
    ctx.globalAlpha = Math.min(1, banner.life * 2);
    ctx.fillStyle = COLORS[banner.id];
    ctx.font = "600 22px Barlow, Outfit, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(banner.text, VIEW_W / 2, 92);
    ctx.restore();
  }

  for (const runner of world.runners) {
    if (runner.dead) continue;
    const sx = runner.x - world.camX;
    if (sx > 8 && sx < VIEW_W - 28) continue;
    const x = sx < 0 ? 22 : VIEW_W - 22;
    const y = clampView(runner.y - world.camY, 80, VIEW_H - 40);
    ctx.fillStyle = COLORS[runner.id];
    ctx.beginPath();
    ctx.arc(x, y, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#07090c";
    ctx.font = "600 11px Barlow, Outfit, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(NAMES[runner.id].slice(0, 1), x, y + 4);
  }
}

function clampView(v: number, a: number, b: number) {
  return Math.max(a, Math.min(b, v));
}

function paintSky(ctx: CanvasRenderingContext2D) {
  const g = ctx.createLinearGradient(0, 0, 0, VIEW_H);
  g.addColorStop(0, "#141c26");
  g.addColorStop(0.55, "#0c1218");
  g.addColorStop(1, "#07090c");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
}

function paintTruss(ctx: CanvasRenderingContext2D, parallax: number, yShift: number) {
  ctx.save();
  ctx.strokeStyle = "#1d2833";
  ctx.lineWidth = 1;
  const off = ((parallax % 80) + 80) % 80;
  for (let x = -off; x < VIEW_W; x += 80) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, VIEW_H);
    ctx.stroke();
  }
  ctx.strokeStyle = "#243140";
  for (let y = 70 - (yShift % 50); y < VIEW_H; y += 50) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(VIEW_W, y);
    ctx.stroke();
  }
  ctx.fillStyle = "#1a242e";
  ctx.fillRect(0, 0, VIEW_W, 18);
  for (let x = 20; x < VIEW_W; x += 46) {
    ctx.fillStyle = x % 92 === 20 ? CYAN : AMBER;
    ctx.globalAlpha = 0.35;
    ctx.fillRect(x, 6, 10, 4);
  }
  ctx.restore();
}

function spotlight(ctx: CanvasRenderingContext2D, x: number, color: string) {
  const g = ctx.createRadialGradient(x, 40, 10, x, 220, 260);
  g.addColorStop(0, color);
  g.addColorStop(1, "transparent");
  ctx.fillStyle = g;
  ctx.globalAlpha = 0.18;
  ctx.fillRect(x - 260, 0, 520, 420);
  ctx.globalAlpha = 1;
}

function drawDeck(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  ctx.fillStyle = "#172029";
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = "#243240";
  ctx.fillRect(x, y + 3, w, 18);
  ctx.fillStyle = CYAN;
  ctx.globalAlpha = 0.9;
  ctx.fillRect(x, y, w, 3);
  ctx.globalAlpha = 1;
  ctx.fillStyle = "#31404c";
  for (let bx = x + 14; bx < x + w - 8; bx += 32) {
    ctx.fillRect(bx, y + 10, 5, 5);
  }
}

function drawRail(ctx: CanvasRenderingContext2D, x: number, y: number, w: number) {
  ctx.fillStyle = "#101820";
  ctx.fillRect(x, y, w, 12);
  ctx.strokeStyle = CYAN;
  ctx.setLineDash([8, 6]);
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 1, y + 1, w - 2, 10);
  ctx.setLineDash([]);
}

function drawMover(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, time: number) {
  ctx.fillStyle = "#241c10";
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = AMBER;
  ctx.fillRect(x, y, w, 3);
  ctx.strokeStyle = AMBER;
  ctx.lineWidth = 2;
  ctx.beginPath();
  const shift = (time * 40) % 16;
  for (let px = x + 8 - shift; px < x + w - 8; px += 16) {
    ctx.moveTo(px, y + h - 4);
    ctx.lineTo(px + 6, y + 6);
    ctx.lineTo(px + 12, y + h - 4);
  }
  ctx.stroke();
}

function drawSpikes(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  ctx.fillStyle = DANGER;
  const n = Math.max(1, Math.floor(w / 16));
  const dw = w / n;
  ctx.beginPath();
  for (let i = 0; i < n; i++) {
    const sx = x + i * dw;
    ctx.moveTo(sx, y + h);
    ctx.lineTo(sx + dw / 2, y);
    ctx.lineTo(sx + dw, y + h);
  }
  ctx.fill();
}

function drawSaw(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, time: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(time * 6);
  ctx.fillStyle = "#3a2224";
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.55, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = DANGER;
  ctx.beginPath();
  const teeth = 8;
  for (let i = 0; i < teeth; i++) {
    const a = (i / teeth) * Math.PI * 2;
    ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    ctx.lineTo(Math.cos(a + 0.22) * r * 0.62, Math.sin(a + 0.22) * r * 0.62);
  }
  ctx.fill();
  ctx.restore();
}

function drawLaser(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  state: { hot: boolean; warn: boolean },
  mode: "hurdle" | "gate",
) {
  ctx.save();
  if (state.hot) {
    ctx.fillStyle = DANGER;
    ctx.globalAlpha = 0.9;
    ctx.fillRect(x, y, w, h);
    ctx.globalAlpha = 0.25;
    ctx.fillRect(x - 4, y - 3, w + 8, h + 6);
  } else if (state.warn) {
    ctx.strokeStyle = DANGER;
    ctx.globalAlpha = 0.85;
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, h);
  } else {
    ctx.fillStyle = MUTED;
    ctx.globalAlpha = 0.45;
    if (mode === "gate") {
      ctx.fillRect(x, y, w, 4);
      ctx.fillRect(x, y + h - 4, w, 4);
    } else {
      ctx.fillRect(x, y + h - 3, w, 3);
    }
  }
  ctx.restore();
}

function drawCoin(ctx: CanvasRenderingContext2D, x: number, y: number, time: number) {
  const bob = Math.sin(time * 4) * 3;
  ctx.save();
  ctx.translate(x, y + bob);
  ctx.rotate(Math.sin(time * 2) * 0.4);
  ctx.fillStyle = AMBER;
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 3) * i - Math.PI / 6;
    const px = Math.cos(a) * 9;
    const py = Math.sin(a) * 9;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#3a2a08";
  ctx.fillRect(-2, -4, 4, 8);
  ctx.restore();
}

function drawCheckpoint(ctx: CanvasRenderingContext2D, x: number, y: number, vex: boolean, rio: boolean) {
  const base = y + 44;
  ctx.fillStyle = "#1c2731";
  ctx.fillRect(x + 8, y + 8, 8, base - y - 8);
  ctx.fillStyle = vex ? CYAN : "#24303a";
  ctx.beginPath();
  ctx.arc(x + 8, y + 6, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = rio ? AMBER : "#24303a";
  ctx.beginPath();
  ctx.arc(x + 18, y + 6, 5, 0, Math.PI * 2);
  ctx.fill();
}

function drawFlag(ctx: CanvasRenderingContext2D, goal: { x: number; y: number; w: number; h: number }, time: number) {
  const poleX = goal.x + goal.w / 2;
  const top = goal.y + 8;
  const bottom = goal.y + goal.h;
  ctx.fillStyle = FG;
  ctx.fillRect(poleX - 2, top, 4, bottom - top);
  ctx.save();
  ctx.beginPath();
  const wave = Math.sin(time * 6) * 4;
  ctx.moveTo(poleX, top + 4);
  ctx.lineTo(poleX + 36, top + 14 + wave);
  ctx.lineTo(poleX, top + 28);
  ctx.closePath();
  ctx.clip();
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 5; col++) {
      ctx.fillStyle = (row + col) % 2 === 0 ? FG : "#12171e";
      ctx.fillRect(poleX + col * 8, top + 4 + row * 6, 8, 6);
    }
  }
  ctx.restore();
  ctx.fillStyle = AMBER;
  ctx.beginPath();
  ctx.arc(poleX, top, 5, 0, Math.PI * 2);
  ctx.fill();
}

function drawRunner(
  ctx: CanvasRenderingContext2D,
  runner: Runner,
  sprites: SpriteSet,
  time: number,
  reduced: boolean,
) {
  const color = COLORS[runner.id];
  ctx.save();
  if (runner.invuln > 0 && reduced) ctx.globalAlpha = 0.82;
  else if (runner.invuln > 0 && Math.sin(time * 28) > 0) ctx.globalAlpha = 0.45;
  const feet = runner.y + runner.h;
  const cx = runner.x + runner.w / 2;
  ctx.fillStyle = "rgba(0,0,0,0.35)";
  ctx.beginPath();
  ctx.ellipse(cx, feet + 2, 12, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  const pose = poseOf(runner);
  const sheet = pose.sheet === "jump" ? sprites.jump ?? sprites.run : sprites.run;
  const frame = pose.sheet === "jump" && !sprites.jump ? 0 : pose.frame;
  if (sheet && sheet.complete && sheet.naturalWidth > 0) {
    const cols = 2;
    const rows = 2;
    const sw = sheet.naturalWidth / cols;
    const sh = sheet.naturalHeight / rows;
    const sx = (frame % cols) * sw;
    const sy = Math.floor(frame / cols) * sh;
    const drawH = 78 * (runner.landPulse > 0 ? 0.9 : 1);
    const drawW = drawH * (sw / sh);
    ctx.translate(cx, feet + 4);
    ctx.scale(runner.facing, 1);
    ctx.drawImage(sheet, sx, sy, sw, sh, -drawW / 2, -drawH, drawW, drawH);
  } else {
    drawVector(ctx, runner, color);
  }
  ctx.restore();

  ctx.fillStyle = color;
  ctx.beginPath();
  if (runner.id === 0) {
    ctx.moveTo(cx - 34, runner.y - 12);
    ctx.lineTo(cx - 26, runner.y - 20);
    ctx.lineTo(cx - 18, runner.y - 12);
    ctx.lineTo(cx - 26, runner.y - 4);
  } else {
    ctx.moveTo(cx - 34, runner.y - 4);
    ctx.lineTo(cx - 26, runner.y - 20);
    ctx.lineTo(cx - 18, runner.y - 4);
  }
  ctx.closePath();
  ctx.fill();
  ctx.font = "600 12px Barlow, Outfit, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(NAMES[runner.id], cx + 8, runner.y - 8);
}

function poseOf(runner: Runner): { sheet: "run" | "jump"; frame: number } {
  if (!runner.grounded) {
    if (runner.vy < -160) return { sheet: "jump", frame: 1 };
    if (runner.vy < 140) return { sheet: "jump", frame: 2 };
    return { sheet: "jump", frame: 3 };
  }
  if (Math.abs(runner.vx) < 22) return { sheet: "run", frame: 1 };
  return { sheet: "run", frame: Math.floor(runner.anim * 11) % 4 };
}

function drawVector(ctx: CanvasRenderingContext2D, runner: Runner, color: string) {
  const feet = runner.y + runner.h;
  const cx = runner.x + runner.w / 2;
  ctx.save();
  ctx.translate(cx, feet);
  ctx.scale(runner.facing, 1);
  const run = runner.grounded && Math.abs(runner.vx) > 22;
  const swing = run ? Math.sin(runner.anim * 14) * 8 : runner.grounded ? 0 : -6;
  ctx.strokeStyle = "#0d1216";
  ctx.lineWidth = 6;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-2, -22);
  ctx.lineTo(-6 - swing, -4);
  ctx.moveTo(2, -22);
  ctx.lineTo(7 + swing, -2);
  ctx.stroke();
  ctx.fillStyle = color;
  if (runner.id === 0) {
    ctx.beginPath();
    ctx.moveTo(0, -52);
    ctx.lineTo(11, -40);
    ctx.lineTo(0, -28);
    ctx.lineTo(-11, -40);
    ctx.closePath();
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.moveTo(0, -54);
    ctx.lineTo(12, -30);
    ctx.lineTo(-12, -30);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = "#07090c";
  ctx.fillRect(3, -51, 9, 4);
  ctx.restore();
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
  ctx.fill();
}

function drawParticles(ctx: CanvasRenderingContext2D, particles: Particle[]) {
  for (const p of particles) {
    ctx.globalAlpha = Math.max(0, p.life / p.max);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function callout(ctx: CanvasRenderingContext2D, text: string, color: string) {
  ctx.save();
  ctx.textAlign = "center";
  ctx.font = "700 72px Barlow, Outfit, sans-serif";
  ctx.fillStyle = "#07090c";
  ctx.fillText(text, VIEW_W / 2 + 3, VIEW_H / 2 + 3);
  ctx.fillStyle = color;
  ctx.fillText(text, VIEW_W / 2, VIEW_H / 2);
  ctx.restore();
}
