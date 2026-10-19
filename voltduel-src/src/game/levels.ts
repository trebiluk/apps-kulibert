import { PLAYER_H, type Checkpoint, type Hazard, type Level, type MoverDef, type Rect } from "./types";

const DECK = 240;

function deck(x: number, top: number, w: number): Rect {
  return { x, y: top, w, h: DECK };
}

function stand(x: number, top: number): Checkpoint {
  return { x, y: top - PLAYER_H };
}

function qualifier(): Level {
  const T = 500;
  const solids = [
    deck(0, T, 640),
    deck(730, T, 470),
    deck(1200, T - 48, 280),
    deck(1580, T, 2080),
  ];
  const movers: MoverDef[] = [
    {
      id: "q-shuttle",
      w: 160,
      h: 16,
      baseX: 1420,
      baseY: T - 16,
      axis: "x",
      amp: 70,
      period: 3.2,
      phase: 0.4,
    },
  ];
  const hazards: Hazard[] = [
    { kind: "spikes", x: 646, y: T + 78, w: 76, h: 32 },
    { kind: "spikes", x: 1470, y: T + 84, w: 200, h: 32 },
    { kind: "spikes", x: 1960, y: T - 20, w: 64, h: 20 },
    { kind: "spikes", x: 2280, y: T - 20, w: 72, h: 20 },
    { kind: "spikes", x: 2920, y: T - 20, w: 80, h: 20 },
    {
      kind: "saw",
      x: 2580,
      y: T - 22,
      r: 16,
      axis: "x",
      amp: 54,
      period: 2.4,
      phase: 0.3,
    },
  ];
  return {
    id: "qualifier",
    name: "Qualifier",
    heat: "Heat 1",
    blurb: "A clean opener. One shuttle over the pit, then saws and spikes to the flag.",
    width: 3660,
    height: 760,
    killY: T + 170,
    solids,
    oneways: [{ x: 1860, y: T - 112, w: 170, h: 12 }],
    movers,
    hazards,
    coins: [
      { x: 700, y: T - 76 },
      { x: 920, y: T - 50 },
      { x: 1300, y: T - 120 },
      { x: 1490, y: T - 72 },
      { x: 1920, y: T - 148 },
      { x: 2140, y: T - 48 },
      { x: 2460, y: T - 70 },
      { x: 2740, y: T - 48 },
      { x: 3100, y: T - 72 },
      { x: 3440, y: T - 56 },
    ],
    checkpoints: [stand(1760, T), stand(2680, T)],
    spawns: [stand(36, T), stand(80, T)],
    goal: { x: 3500, y: T - 180, w: 34, h: 180 },
  };
}

function overpass(): Level {
  const T = 520;
  const solids = [
    deck(0, T, 560),
    deck(660, T, 1040),
    deck(1840, T - 24, 340),
    deck(2280, T - 78, 280),
    deck(2660, T, 1300),
  ];
  const movers: MoverDef[] = [
    {
      id: "o-shuttle",
      w: 150,
      h: 16,
      baseX: 1688,
      baseY: T - 16,
      axis: "x",
      amp: 36,
      period: 3,
      phase: 0.2,
    },
    {
      id: "o-lift",
      w: 100,
      h: 16,
      baseX: 2560,
      baseY: T - 18,
      axis: "y",
      amp: 36,
      period: 3.3,
      phase: 0.6,
    },
  ];
  const hazards: Hazard[] = [
    { kind: "spikes", x: 568, y: T + 80, w: 84, h: 30 },
    { kind: "spikes", x: 1710, y: T + 82, w: 160, h: 30 },
    {
      kind: "laser",
      mode: "hurdle",
      x: 980,
      y: T - 18,
      w: 42,
      h: 18,
      period: 1.8,
      duty: 0.38,
      phase: 0,
    },
    {
      kind: "laser",
      mode: "hurdle",
      x: 1240,
      y: T - 18,
      w: 42,
      h: 18,
      period: 1.55,
      duty: 0.36,
      phase: 0.7,
    },
    {
      kind: "saw",
      x: 3180,
      y: T - 20,
      r: 16,
      axis: "x",
      amp: 60,
      period: 2.2,
      phase: 0.2,
    },
    { kind: "spikes", x: 3520, y: T - 20, w: 56, h: 20 },
  ];
  return {
    id: "overpass",
    name: "Overpass",
    heat: "Heat 2",
    blurb: "Laser trips, a moving lift, and a raised lane before the flag.",
    width: 3960,
    height: 780,
    killY: T + 180,
    solids,
    oneways: [{ x: 1960, y: T - 140, w: 150, h: 12 }],
    movers,
    hazards,
    coins: [
      { x: 640, y: T - 78 },
      { x: 860, y: T - 48 },
      { x: 1100, y: T - 80 },
      { x: 1360, y: T - 48 },
      { x: 1740, y: T - 70 },
      { x: 2020, y: T - 176 },
      { x: 2420, y: T - 190 },
      { x: 2488, y: T - 130 },
      { x: 2860, y: T - 48 },
      { x: 3180, y: T - 78 },
      { x: 3480, y: T - 70 },
      { x: 3760, y: T - 52 },
    ],
    checkpoints: [stand(1280, T), stand(2760, T)],
    spawns: [stand(36, T), stand(82, T)],
    goal: { x: 3820, y: T - 180, w: 34, h: 180 },
  };
}

function finals(): Level {
  const T = 500;
  const solids = [
    deck(0, T, 680),
    deck(1480, T, 1360),
    deck(2900, T, 820),
  ];
  const movers: MoverDef[] = [
    {
      id: "f1",
      w: 200,
      h: 16,
      baseX: 760,
      baseY: T - 16,
      axis: "x",
      amp: 18,
      period: 2.8,
      phase: 0,
    },
    {
      id: "f2",
      w: 200,
      h: 16,
      baseX: 1040,
      baseY: T - 16,
      axis: "x",
      amp: 18,
      period: 2.9,
      phase: 1.5,
    },
    {
      id: "f3",
      w: 210,
      h: 16,
      baseX: 1340,
      baseY: T - 16,
      axis: "x",
      amp: 20,
      period: 3,
      phase: 0.7,
    },
  ];
  const hazards: Hazard[] = [
    { kind: "spikes", x: 690, y: T + 86, w: 850, h: 34 },
    {
      kind: "laser",
      mode: "gate",
      x: 1960,
      y: T - 188,
      w: 16,
      h: 188,
      period: 2.2,
      duty: 0.4,
      phase: 0.15,
    },
    {
      kind: "saw",
      x: 2320,
      y: T - 22,
      r: 18,
      axis: "x",
      amp: 50,
      period: 2.15,
      phase: 0,
    },
    { kind: "spikes", x: 3100, y: T - 18, w: 42, h: 18 },
    { kind: "spikes", x: 3400, y: T - 18, w: 46, h: 18 },
  ];
  return {
    id: "finals",
    name: "Finals",
    heat: "Heat 3",
    blurb: "Three shuttles, a laser gate, and a saw on the closing straight.",
    width: 3720,
    height: 760,
    killY: T + 180,
    solids,
    oneways: [{ x: 1680, y: T - 118, w: 150, h: 12 }],
    movers,
    hazards,
    coins: [
      { x: 520, y: T - 52 },
      { x: 840, y: T - 68 },
      { x: 1100, y: T - 68 },
      { x: 1400, y: T - 68 },
      { x: 1740, y: T - 156 },
      { x: 1880, y: T - 48 },
      { x: 2140, y: T - 80 },
      { x: 2460, y: T - 48 },
      { x: 2700, y: T - 48 },
      { x: 3080, y: T - 70 },
      { x: 3260, y: T - 78 },
      { x: 3520, y: T - 52 },
    ],
    checkpoints: [stand(1660, T), stand(2100, T)],
    spawns: [stand(40, T), stand(86, T)],
    goal: { x: 3560, y: T - 184, w: 36, h: 184 },
  };
}

export const LEVELS: Level[] = [qualifier(), overpass(), finals()];