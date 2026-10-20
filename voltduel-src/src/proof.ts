/** Live proof helper. It stays off unless the URL has ?proof=1. */

export type ProofRunner = { x: number; y: number; coins: number; done: boolean };
export type ProofState = {
  level: string;
  timer: number;
  running: boolean;
  vex: ProofRunner;
  rio: ProofRunner;
  orientation: "portrait" | "landscape";
};

type PadKey = "left" | "right" | "jump";

export type ProofDriver = {
  state: () => ProofState;
  setHeld: (id: 0 | 1, key: PadKey, on: boolean) => void;
  ensureRace: () => void;
};

type ProofApi = {
  state: () => ProofState;
  hold: (player: string, dir: string, ms: number) => Promise<void>;
  jump: (player: string) => Promise<void>;
  runToFlag: (player: string) => Promise<{ finished: boolean; time: number }>;
  rotateCheck: () => Promise<{ timerKept: boolean; coinsKept: boolean; reset: boolean }>;
};

declare global {
  interface Window {
    __VD_PROOF?: ProofApi;
  }
}

const EMPTY: ProofState = {
  level: "menu",
  timer: 0,
  running: false,
  vex: { x: 0, y: 0, coins: 0, done: false },
  rio: { x: 0, y: 0, coins: 0, done: false },
  orientation: "portrait",
};

let driver: ProofDriver | null = null;

export function proofEnabled() {
  try {
    return new URLSearchParams(window.location.search).get("proof") === "1";
  } catch {
    return false;
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function seedRandom() {
  const raw = new URLSearchParams(window.location.search).get("seed");
  let s = Number(raw == null || raw === "" ? "1" : raw);
  if (!Number.isFinite(s)) s = 1;
  let n = (Math.abs(Math.floor(s)) || 1) >>> 0;
  Math.random = () => {
    n = (Math.imul(1664525, n) + 1013904223) >>> 0;
    return n / 4294967296;
  };
}

function who(player: string): 0 | 1 {
  const name = String(player || "").toLowerCase();
  return name === "rio" || name === "1" ? 1 : 0;
}

function dirOf(dir: string): PadKey {
  const name = String(dir || "").toLowerCase();
  if (name === "left" || name === "l") return "left";
  if (name === "jump" || name === "up") return "jump";
  return "right";
}

function runnerOf(state: ProofState, id: 0 | 1) {
  return id === 0 ? state.vex : state.rio;
}

async function runToFlag(player: string) {
  const d = driver;
  if (!d) return { finished: false, time: 0 };
  d.ensureRace();
  const id = who(player);
  const start = performance.now();
  while (performance.now() - start < 5000) {
    const s = d.state();
    if (s.running && s.timer > 0.02) break;
    await sleep(40);
  }
  const other = (id === 0 ? 1 : 0) as 0 | 1;
  d.setHeld(other, "jump", true);
  await sleep(60);
  d.setHeld(id, "right", true);
  await sleep(420);
  d.setHeld(other, "jump", false);
  let last = -1;
  let still = 0;
  let time = 0;
  let finished = false;
  let nextMark = 0;
  const marks = [560, 1120, 1360, 1540, 1880, 2200, 2500, 2840, 3180];
  const hop = async () => {
    d.setHeld(id, "jump", true);
    await sleep(380);
    d.setHeld(id, "jump", false);
    await sleep(40);
  };
  try {
    while (performance.now() - start < 40000) {
      const s = d.state();
      const r = runnerOf(s, id);
      time = s.timer;
      if (r.done) {
        finished = true;
        break;
      }
      if (r.x <= last + 1) still += 1;
      else still = 0;
      if (r.x < last - 40) {
        const back = marks.findIndex((mark) => mark > r.x - 20);
        nextMark = back < 0 ? marks.length : back;
      }
      last = r.x;
      const mark = marks[nextMark];
      const falling = r.y > 490;
      const hazard =
        r.y >= 440 &&
        ((r.x > 1900 && r.x < 2060) ||
          (r.x > 2220 && r.x < 2400) ||
          (r.x > 2500 && r.x < 2680) ||
          (r.x > 2860 && r.x < 3040));
      if ((mark != null && r.x >= mark) || still >= 4 || falling || hazard) {
        if (mark != null && r.x >= mark) nextMark += 1;
        await hop();
        const mid = runnerOf(d.state(), id);
        if (mid.y > 490 || (mid.x > 1400 && mid.x < 1700) || (mid.x > 2680 && mid.x < 3200)) await hop();
        still = 0;
      } else {
        await sleep(50);
      }
    }
    const waitCard = performance.now();
    while (finished && performance.now() - waitCard < 2500) {
      const card = document.querySelector(".modal-card h2");
      if (card && /flag/i.test(card.textContent || "")) break;
      await sleep(40);
    }
  } finally {
    d.setHeld(id, "right", false);
    d.setHeld(id, "jump", false);
    d.setHeld(id, "left", false);
    d.setHeld(other, "left", false);
    d.setHeld(other, "jump", false);
  }
  return { finished, time: Number(time.toFixed(2)) };
}

async function rotateCheck() {
  const d = driver;
  if (!d) return { timerKept: false, coinsKept: false, reset: true };
  const before = d.state();
  const portrait = window.innerHeight >= window.innerWidth;
  const target = portrait ? { w: 915, h: 412 } : { w: 412, h: 915 };
  try {
    window.resizeTo(target.w, target.h);
  } catch {
    /* the host viewport is what actually changes size */
  }
  const began = performance.now();
  let flipped = false;
  while (performance.now() - began < 4000) {
    if (Math.abs(window.innerWidth - target.w) < 24 && Math.abs(window.innerHeight - target.h) < 24) {
      flipped = true;
      break;
    }
    await sleep(40);
  }
  await sleep(120);
  const after = d.state();
  const timerKept = after.timer + 0.05 >= before.timer;
  const coinsKept = after.vex.coins === before.vex.coins && after.rio.coins === before.rio.coins;
  const reset = !flipped || !timerKept || after.level !== before.level;
  return { timerKept, coinsKept, reset };
}

export function armProof() {
  if (!proofEnabled()) return;
  seedRandom();
  const api: ProofApi = {
    state: () => (driver ? driver.state() : EMPTY),
    hold: async (player, dir, ms) => {
      if (!driver) return;
      const id = who(player);
      const key = dirOf(dir);
      driver.setHeld(id, key, true);
      await sleep(Math.max(0, Number(ms) || 0));
      driver.setHeld(id, key, false);
    },
    jump: async (player) => {
      if (!driver) return;
      const id = who(player);
      driver.setHeld(id, "jump", true);
      await sleep(260);
      driver.setHeld(id, "jump", false);
    },
    runToFlag,
    rotateCheck,
  };
  window.__VD_PROOF = api;
}

export function registerProof(next: ProofDriver | null) {
  if (!proofEnabled()) return;
  driver = next;
}
