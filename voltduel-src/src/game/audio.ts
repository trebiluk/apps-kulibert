type Kind = "jump" | "djump" | "coin" | "die" | "check" | "win" | "go";

let ctx: AudioContext | null = null;

export const audio = {
  muted: false,
  unlock() {
    if (audio.muted) return;
    const Ctx = window.AudioContext;
    if (!Ctx) return;
    if (!ctx) ctx = new Ctx();
    if (ctx.state === "suspended") void ctx.resume();
  },
  play(kind: Kind) {
    if (audio.muted || !ctx || ctx.state !== "running") return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    const specs: Record<Kind, { f: number; t: OscillatorType; d: number; g: number; slide?: number }> = {
      jump: { f: 480, t: "square", d: 0.07, g: 0.035, slide: 720 },
      djump: { f: 640, t: "square", d: 0.09, g: 0.04, slide: 920 },
      coin: { f: 880, t: "sine", d: 0.08, g: 0.05, slide: 1320 },
      die: { f: 180, t: "sawtooth", d: 0.18, g: 0.04, slide: 60 },
      check: { f: 440, t: "triangle", d: 0.1, g: 0.04, slide: 660 },
      win: { f: 523, t: "triangle", d: 0.28, g: 0.05, slide: 784 },
      go: { f: 220, t: "square", d: 0.12, g: 0.04, slide: 440 },
    };
    const s = specs[kind];
    osc.type = s.t;
    osc.frequency.setValueAtTime(s.f, now);
    if (s.slide) osc.frequency.exponentialRampToValueAtTime(Math.max(40, s.slide), now + s.d);
    gain.gain.setValueAtTime(s.g, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + s.d + 0.02);
    osc.start(now);
    osc.stop(now + s.d + 0.03);
  },
};
