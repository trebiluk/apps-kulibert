// Stage 1 tether. Spring band is a Bendy-style pattern rewritten here.
// No Bendy dist bundle. The spike fill is the bloob alt, and only when the
// tether is long. Grips are 44px across.

export const GRIP = 22;

export function drawJoint(ctx, x1, y1, x2, y2) {
  const dist = Math.hypot(x2 - x1, y2 - y1);
  ctx.save();
  ctx.lineCap = "round";
  ctx.strokeStyle = "#22d3ee";
  ctx.globalAlpha = 0.85;
  ctx.lineWidth = Math.max(3, 10 - dist / 40);
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  const sag = Math.min(18, dist * 0.1);
  ctx.quadraticCurveTo((x1 + x2) / 2, (y1 + y2) / 2 + sag, x2, y2);
  ctx.stroke();
  ctx.restore();
}

export function drawTether(ctx, x1, y1, x2, y2) {
  const dist = Math.hypot(x2 - x1, y2 - y1);
  const spike = dist > 110;
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = "#22d3ee";
  ctx.fillStyle = "#22d3ee";
  if (spike) {
    const ang = Math.atan2(y2 - y1, x2 - x1);
    const nx = Math.cos(ang + Math.PI / 2);
    const ny = Math.sin(ang + Math.PI / 2);
    ctx.globalAlpha = 0.9;
    ctx.beginPath();
    ctx.moveTo(x1 + nx * 14, y1 + ny * 14);
    ctx.lineTo(x2, y2);
    ctx.lineTo(x1 - nx * 14, y1 - ny * 14);
    ctx.closePath();
    ctx.fill();
  } else {
    ctx.lineWidth = Math.max(4, 16 - dist / 28);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    const sag = Math.min(26, dist * 0.12);
    ctx.quadraticCurveTo((x1 + x2) / 2, (y1 + y2) / 2 + sag, x2, y2);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  ctx.fillStyle = "#e8f7ff";
  ctx.strokeStyle = "#041018";
  ctx.lineWidth = 2;
  for (const [x, y] of [[x1, y1], [x2, y2]]) {
    ctx.beginPath();
    ctx.arc(x, y, GRIP, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
}
