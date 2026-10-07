/* Paths for one approach. p is 0 at the warning and 1 at the nest. Layout units only. */

function clamp(n) {
  const x = Number(n) || 0;
  if (x < 0) return 0;
  if (x > 1) return 1;
  return x;
}

function lerp(a, b, t) { return a + (b - a) * t; }

function entry(edge, field) {
  if (edge === 1) return { x: field.x + field.w * 1.08, dir: -1 };
  if (edge === 2) return { x: field.x + field.w * 0.18, dir: 1, high: true };
  return { x: field.x - field.w * 0.08, dir: 1 };
}

function frameAt(list, cycle) {
  if (!list || !list.length) return "";
  const i = Math.floor(Math.abs(Number(cycle) || 0)) % list.length;
  return list[i];
}

export function poseOf(kind, p, layout) {
  const t = clamp(p);
  const field = layout.field || { x: 0, y: 0, w: 100, h: 100 };
  const nest = layout.nest || { x: field.x + field.w / 2, y: field.y + field.h * 0.7 };
  const hole = layout.hole || nest;
  const groundY = layout.groundY || (field.y + field.h * 0.82);
  const start = entry(layout.edge | 0, field);
  const skyY = field.y + field.h * 0.08;
  const body = Math.max(14, field.h * 0.055);
  const faceNest = nest.x < start.x;
  const out = {
    x: lerp(start.x, nest.x, t),
    y: groundY - body,
    flip: faceNest,
    depth: 6,
    frame: "",
    frames: null,
    cycle: 0,
    anim: "",
    still: "",
    show: true,
    shadow: false,
    shadowFrame: "hawk-shadow",
    shadowX: 0,
    shadowY: groundY,
    shadowPx: 48,
    shadowAlpha: 0.9,
    crop: 0,
    rot: 0,
    dust: false,
    weed: false,
  };
  if (kind === "hawk") {
    const warn = 0.4;
    if (t <= warn) {
      const u = t / warn;
      out.show = false;
      out.shadow = true;
      out.shadowPx = Math.round(18 + u * 46);
      out.shadowX = lerp(start.x, nest.x, u);
      out.shadowY = groundY + 4;
      out.x = out.shadowX;
      out.y = skyY;
      out.still = "hawk-flap-0";
    } else {
      const s = (t - warn) / (1 - warn);
      const arc = Math.sin(s * Math.PI) * field.w * 0.1 * (start.dir || 1);
      out.x = lerp(start.high ? field.x + field.w * 0.5 : start.x, nest.x, s) + arc;
      out.y = lerp(skyY, nest.y - body, s * s);
      out.show = true;
      out.anim = "hawk-fly";
      out.still = "hawk-flap-0";
      out.frames = ["hawk-flap-0", "hawk-flap-1", "hawk-swoop", "hawk-flap-1"];
      out.cycle = s * 8;
      out.shadow = true;
      out.shadowX = out.x;
      out.shadowY = groundY + 4;
      out.shadowPx = Math.round(56 + s * 22);
      out.flip = nest.x < out.x;
    }
    return out;
  }
  if (kind === "cloud") {
    const from = start.dir < 0 ? field.x + field.w * 1.06 : field.x - field.w * 0.08;
    const to = start.dir < 0 ? field.x - field.w * 0.08 : field.x + field.w * 1.06;
    out.x = lerp(from, to, t);
    out.y = skyY + field.h * 0.04;
    out.frame = "cloud";
    out.show = true;
    out.shadow = true;
    out.shadowFrame = "cloud-shadow";
    out.shadowX = out.x;
    out.shadowY = groundY + 2;
    out.shadowPx = Math.round(Math.max(40, field.w * 0.12));
    out.shadowAlpha = 0.55;
    out.depth = 5;
    out.flip = false;
    return out;
  }
  if (kind === "coyote") {
    out.x = lerp(start.x, nest.x, t);
    out.y = groundY - body;
    out.frames = ["coyote-trot-0", "coyote-trot-1", "coyote-trot-2", "coyote-trot-3"];
    out.cycle = t * 10;
    out.dust = true;
    out.flip = faceNest;
    return out;
  }
  if (kind === "snake") {
    const grass = field.y + field.h - Math.max(12, field.h * 0.04);
    out.x = lerp(start.x, nest.x, t);
    out.y = grass + Math.sin(t * Math.PI * 4) * Math.max(10, field.h * 0.035);
    out.depth = 1;
    out.frames = ["snake-slither-0", "snake-slither-1", "snake-slither-2"];
    out.cycle = t * 8;
    out.crop = 0.5;
    out.flip = faceNest;
    return out;
  }
  if (kind === "rabbit") {
    const hops = 4;
    const u = (t * hops) % 1;
    const hop = Math.sin(u * Math.PI) * Math.max(28, field.h * 0.1);
    out.x = lerp(start.x, lerp(start.x, nest.x, 0.82), t);
    out.y = groundY - body - hop;
    out.frames = ["rabbit-hop-0", "rabbit-hop-1", "rabbit-hop-2"];
    out.cycle = u < 0.22 ? 0 : u < 0.72 ? 1 : 2;
    out.flip = nest.x < start.x;
    return out;
  }
  if (kind === "weed") {
    const hops = 4;
    const u = (t * hops) % 1;
    const hop = Math.abs(Math.sin(u * Math.PI)) * Math.max(34, field.h * 0.12);
    out.x = lerp(start.x, nest.x, t);
    out.y = groundY - body * 0.8 - hop;
    out.frames = ["weed-0", "weed-1", "weed-2"];
    out.cycle = t * 8;
    out.rot = t * Math.PI * 4 * (start.dir || 1);
    out.weed = true;
    out.flip = false;
    return out;
  }
  if (kind === "wonder") {
    const hopUntil = 0.62;
    const dest = hole.x + (start.dir > 0 ? field.w * 0.08 : -field.w * 0.08);
    out.x = lerp(start.x, dest, Math.min(1, t / hopUntil));
    if (t < hopUntil) {
      const u = ((t / hopUntil) * 3) % 1;
      const hop = Math.sin(u * Math.PI) * Math.max(14, field.h * 0.06);
      out.y = groundY - body - hop;
      out.frames = ["wonder-hop-0", "wonder-hop-1", "wonder-hop-2"];
      out.cycle = u < 0.28 ? 0 : u < 0.7 ? 1 : 2;
    } else {
      out.y = groundY - body;
      out.x = dest;
      out.frames = ["wonder-wave-0", "wonder-wave-1", "wonder-wave-2"];
      out.cycle = (t - hopUntil) * 8;
    }
    out.flip = dest < start.x;
    return out;
  }
  out.still = "hawk-flap-0";
  return out;
}

export function frameOf(pose, locked) {
  if (!pose) return "";
  if (locked) return pose.still || (pose.frames && pose.frames[0]) || pose.frame || "";
  if (pose.frame) return pose.frame;
  return frameAt(pose.frames, pose.cycle) || pose.still || "";
}
