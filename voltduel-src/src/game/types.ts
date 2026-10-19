export const PLAYER_W = 26;
export const PLAYER_H = 44;
export const VIEW_W = 960;
export const VIEW_H = 540;

export const RUN_SPEED = 280;
export const ACCEL_GROUND = 3800;
export const ACCEL_AIR = 1900;
export const FRICTION = 2800;
export const JUMP_V = -505;
export const DJUMP_V = -450;
export const GRAV_UP = 1700;
export const GRAV_APEX = 1180;
export const GRAV_DOWN = 3500;
export const APEX_BAND = 64;
export const MAX_FALL = 860;
export const COYOTE = 0.11;
export const JUMP_BUFFER = 0.13;

export type Rect = { x: number; y: number; w: number; h: number };

export type MoverDef = {
  id: string;
  w: number;
  h: number;
  baseX: number;
  baseY: number;
  axis: "x" | "y";
  amp: number;
  period: number;
  phase: number;
};

export type SpikeHazard = { kind: "spikes"; x: number; y: number; w: number; h: number };
export type SawHazard = {
  kind: "saw";
  x: number;
  y: number;
  r: number;
  axis: "x" | "y";
  amp: number;
  period: number;
  phase: number;
};
export type LaserHazard = {
  kind: "laser";
  mode: "hurdle" | "gate";
  x: number;
  y: number;
  w: number;
  h: number;
  period: number;
  duty: number;
  phase: number;
};
export type Hazard = SpikeHazard | SawHazard | LaserHazard;

export type Checkpoint = { x: number; y: number };

export type Level = {
  id: string;
  name: string;
  heat: string;
  blurb: string;
  width: number;
  height: number;
  killY: number;
  solids: Rect[];
  oneways: Rect[];
  movers: MoverDef[];
  hazards: Hazard[];
  coins: { x: number; y: number }[];
  checkpoints: Checkpoint[];
  spawns: [{ x: number; y: number }, { x: number; y: number }];
  goal: Rect;
};

export type GroundKind = "solid" | "oneway" | "mover" | "head";

export type Runner = {
  id: 0 | 1;
  x: number;
  y: number;
  w: number;
  h: number;
  vx: number;
  vy: number;
  facing: 1 | -1;
  grounded: boolean;
  groundKind: GroundKind | null;
  riding: string | null;
  airJumps: number;
  coyote: number;
  buffer: number;
  drop: number;
  cut: boolean;
  coins: number;
  checkpoint: number;
  invuln: number;
  respawn: number;
  dead: boolean;
  finished: boolean;
  finishTime: number;
  anim: number;
  landPulse: number;
};

export type LiveMover = MoverDef & { x: number; y: number; prevX: number; prevY: number };

export type Banner = { text: string; life: number; id: 0 | 1 };

export type Phase = "countdown" | "race" | "paused" | "done";

export type World = {
  level: Level;
  levelIndex: number;
  clock: number;
  time: number;
  countdown: number;
  goFlash: number;
  phase: Phase;
  runners: [Runner, Runner];
  coins: boolean[];
  movers: LiveMover[];
  checks: [boolean[], boolean[]];
  camX: number;
  camY: number;
  shake: number;
  winner: 0 | 1 | null;
  finishHold: number;
  banners: Banner[];
  reported: boolean;
};

export type Input = {
  left: boolean;
  right: boolean;
  jump: boolean;
  jumpHeld: boolean;
  down: boolean;
};

export type SimEvent =
  | { type: "jump"; id: 0 | 1; double: boolean }
  | { type: "coin"; id: 0 | 1; x: number; y: number }
  | { type: "die"; id: 0 | 1; x: number; y: number }
  | { type: "check"; id: 0 | 1 }
  | { type: "win"; id: 0 | 1 }
  | { type: "land"; id: 0 | 1; x: number; y: number }
  | { type: "go" };

export const IDLE_INPUT: Input = {
  left: false,
  right: false,
  jump: false,
  jumpHeld: false,
  down: false,
};

export function clamp(v: number, a: number, b: number) {
  return Math.max(a, Math.min(b, v));
}

export function overlap(a: Rect, b: Rect) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}
