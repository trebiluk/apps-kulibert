import { useEffect, useRef, useState, type PointerEvent } from "react";
import { audio } from "@/game/audio";
import { renderAttract, renderWorld, tickParticles, type Particle, type SpriteSet } from "@/game/draw";
import { LEVELS } from "@/game/levels";
import { createWorld, practiceRun, step } from "@/game/sim";
import { considerBest, formatTime, loadSave, writeSave, type Save } from "@/game/save";
import { VIEW_H, VIEW_W, type Input, type World } from "@/game/types";
import { proofEnabled, registerProof, type ProofState } from "./proof";

type Screen =
  | { name: "menu" }
  | { name: "play"; level: number }
  | { name: "pause"; level: number }
  | { name: "results"; level: number; winner: 0 | 1; time: number; coins: [number, number] };

type Pad = { left: boolean; right: boolean; jump: boolean };

type Cmd = { op: "start" | "restart"; level: number } | { op: "clear" };

const MAPS = [
  { left: ["KeyA"], right: ["KeyD"], jump: ["KeyW"], down: ["KeyS"] },
  { left: ["ArrowLeft"], right: ["ArrowRight"], jump: ["ArrowUp"], down: ["ArrowDown"] },
] as const;

const GAME_CODES = new Set<string>(MAPS.flatMap((map) => [...map.left, ...map.right, ...map.jump, ...map.down]));

const NAMES = ["VEX", "RIO"] as const;
const KEY_TIP = "VEX uses WASD. RIO uses arrows. Jump again in the air.";
const TOUCH_TIP: Record<string, string> = {
  en: "Hold ◀ ▶ to run. Tap ⤒ to jump, tap again in the air.",
  uk: "Утримуй ◀ ▶, щоб бігти. Торкнись ⤒, щоб стрибнути, і ще раз у повітрі.",
  ru: "Удерживай ◀ ▶, чтобы бежать. Нажми ⤒, чтобы прыгнуть, и ещё раз в воздухе.",
  es: "Mantén ◀ ▶ para correr. Toca ⤒ para saltar y otra vez en el aire.",
  ar: "اضغط مطولًا \u2066◀ ▶\u2069 للركض. المس \u2066⤒\u2069 للقفز، ثم المس مرة أخرى في الهواء.",
  "fa-AF": "\u2066◀ ▶\u2069 را نگه دار تا بدوی. \u2066⤒\u2069 را بزن تا بپری، و بار دیگر در هوا.",
  rw: "Kanda ◀ ▶ ukomeze kugira ngo wiruke. Kanda ⤒ usimbuike, hanyuma ugaruke mu kirere.",
  ti: "◀ ▶ ጸቒጥካ ሓዝ ንምጉያይ። ⤒ ጠውቕ ንምዝላል፣ ኣብ ኣየር ድማ ደጊምካ ጠውቕ።",
};
const spriteUrl = (name: string) => `${import.meta.env.BASE_URL}sprites/${name}`;

declare global {
  interface Window {
    __controlsTest?: {
      getX: () => number;
      getY: () => number;
      getX2: () => number;
      getY2: () => number;
      getSpeed: () => number;
      getYaw: () => number;
      setKeys: (codes: string[]) => void;
      phase: () => string;
    };
    __simulate?: (level: number) => ReturnType<typeof practiceRun>;
    KulibertTest?: { on?: () => boolean };
    KulibertI18n?: {
      t?: (key: string, fallback?: string) => string;
      ready?: (lang: string | undefined, cb: () => void) => void;
    };
  }
}

function loadSprite(src: string) {
  return new Promise<HTMLImageElement | null>((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

export function VoltDuel() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const playfieldRef = useRef<HTMLDivElement>(null);
  const worldRef = useRef<World | null>(null);
  const screenRef = useRef<Screen>({ name: "menu" });
  const cmdRef = useRef<Cmd | null>(null);
  const keysRef = useRef(new Set<string>());
  const qaRef = useRef<Set<string> | null>(null);
  const jumpPrev = useRef<[boolean, boolean]>([false, false]);
  const pads = useRef<[Pad, Pad]>([
    { left: false, right: false, jump: false },
    { left: false, right: false, jump: false },
  ]);
  const holds = useRef(new Map<number, { id: 0 | 1; key: keyof Pad }>());
  const releaseRef = useRef<(pointerId: number) => void>(() => {});
  const padsRoot = useRef<HTMLDivElement>(null);
  const particles = useRef<Particle[]>([]);
  const sprites = useRef<[SpriteSet, SpriteSet]>([
    { run: null, jump: null },
    { run: null, jump: null },
  ]);
  const saveRef = useRef<Save>({ best: {}, muted: false });
  const qaMode = useRef(false);
  const reduced = useRef(false);
  const coinRefs = [useRef<HTMLElement>(null), useRef<HTMLElement>(null)];
  const cpRefs = [useRef<HTMLElement>(null), useRef<HTMLElement>(null)];
  const timeRef = useRef<HTMLElement>(null);
  const pipRefs = [useRef<HTMLElement>(null), useRef<HTMLElement>(null)];
  const flagRef = useRef<HTMLElement>(null);
  const liveRef = useRef<HTMLParagraphElement>(null);
  const liveGate = useRef({ at: 0, pending: "" });

  const [screen, setScreen] = useState<Screen>({ name: "menu" });
  const [save, setSave] = useState<Save>({ best: {}, muted: false });
  const [hint, setHint] = useState(false);
  const [padMode, setPadMode] = useState<"auto" | "on" | "off">("auto");

  saveRef.current = save;

  function testOn() {
    try { return !!(window.KulibertTest && window.KulibertTest.on && window.KulibertTest.on()); } catch { return false; }
  }
  function jumpWin() {
    show({ name: "results", level: screenRef.current.name === "play" || screenRef.current.name === "results" || screenRef.current.name === "pause" ? screenRef.current.level : 0, winner: 0, time: 12, coins: [3, 1] });
  }
  function jumpLose() {
    show({ name: "results", level: screenRef.current.name === "play" || screenRef.current.name === "results" || screenRef.current.name === "pause" ? screenRef.current.level : 0, winner: 1, time: 12, coins: [1, 3] });
  }

  function liveLine(key: string, fallback: string) {
    try {
      const value = window.KulibertI18n?.t?.(key, fallback);
      if (value && value !== key) return value;
    } catch {
      /* keep the English line */
    }
    return fallback;
  }

  function pushLive(text: string) {
    const gate = liveGate.current;
    const now = performance.now();
    if (gate.at && now - gate.at < 1000) {
      gate.pending = text;
      return;
    }
    if (!liveRef.current) {
      gate.pending = text;
      return;
    }
    gate.at = now;
    gate.pending = "";
    liveRef.current.textContent = text;
  }

  function show(next: Screen) {
    const prev = screenRef.current.name;
    screenRef.current = next;
    setScreen(next);
    if (next.name === "pause") pushLive(liveLine("vdLivePaused", "Paused"));
    else if (next.name === "play" && prev === "pause") pushLive(liveLine("vdLiveResumed", "Resumed"));
  }

  function launch(level: number, op: "start" | "restart" = "start") {
    audio.unlock();
    cmdRef.current = { op, level };
    show({ name: "play", level });
    setHint(true);
  }

  useEffect(() => {
    const loaded = loadSave();
    saveRef.current = loaded;
    setSave(loaded);
    audio.muted = loaded.muted;
    reduced.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    qaMode.current = new URLSearchParams(window.location.search).has("qa");
  }, []);

  useEffect(() => {
    if (!hint) return;
    const id = window.setTimeout(() => setHint(false), 4600);
    return () => window.clearTimeout(id);
  }, [hint]);

  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    let acc = 0;
    let spriteStamp = 0;
    let spokenCount = "";
    const hitTimers: [number, number] = [0, 0];
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const stopGesture = (event: Event) => {
      const node = event.target;
      if (!(node instanceof Element)) return;
      if (node.closest(".pads") || node.closest("canvas")) event.preventDefault();
    };
    canvas.addEventListener("contextmenu", stopGesture);
    document.addEventListener("contextmenu", stopGesture);
    document.addEventListener("selectstart", stopGesture);
    document.addEventListener("dragstart", stopGesture);

    const readInput = (id: 0 | 1): Input => {
      const map = MAPS[id];
      const qa = qaRef.current;
      const pad = pads.current[id];
      const down = (codes: readonly string[], touch = false) =>
        qa ? codes.some((code) => qa.has(code)) : codes.some((code) => keysRef.current.has(code)) || touch;
      const jumpHeld = down(map.jump, pad.jump);
      const jump = jumpHeld && !jumpPrev.current[id];
      jumpPrev.current[id] = jumpHeld;
      return {
        left: down(map.left, pad.left),
        right: down(map.right, pad.right),
        down: down(map.down),
        jump,
        jumpHeld,
      };
    };

    const burst = (x: number, y: number, color: string, count: number, speed: number) => {
      for (let i = 0; i < count && particles.current.length < 100; i++) {
        const angle = Math.random() * Math.PI * 2;
        const mag = speed * (0.35 + Math.random());
        particles.current.push({
          x,
          y,
          vx: Math.cos(angle) * mag,
          vy: Math.sin(angle) * mag - 30,
          life: 0.45,
          max: 0.45,
          color,
          size: 2 + Math.random() * 2,
        });
      }
    };

    const ensureSprites = (now: number) => {
      if (sprites.current[0].run && sprites.current[1].run) return;
      if (now - spriteStamp < 1200) return;
      spriteStamp = now;
      void Promise.all([
        loadSprite(spriteUrl("vex-run.png")),
        loadSprite(spriteUrl("vex-jump.png")),
        loadSprite(spriteUrl("rio-run.png")),
        loadSprite(spriteUrl("rio-jump.png")),
      ]).then(([vexRun, vexJump, rioRun, rioJump]) => {
        sprites.current = [
          { run: vexRun, jump: vexJump },
          { run: rioRun, jump: rioJump },
        ];
      });
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (GAME_CODES.has(event.code) || event.code === "Escape" || event.code === "KeyR") event.preventDefault();
      keysRef.current.add(event.code);
      if (event.repeat) return;
      const current = screenRef.current;
      if (event.code === "Escape") {
        if (current.name === "play") show({ name: "pause", level: current.level });
        else if (current.name === "pause") show({ name: "play", level: current.level });
      }
      if (event.code === "KeyR" && current.name !== "menu") {
        launch(worldRef.current?.levelIndex ?? current.level, "restart");
      }
    };
    const onKeyUp = (event: KeyboardEvent) => {
      keysRef.current.delete(event.code);
    };
    const onBlur = () => {
      keysRef.current.clear();
      jumpPrev.current = [false, false];
    };
    const onHide = () => {
      if (document.hidden && screenRef.current.name === "play") {
        show({ name: "pause", level: screenRef.current.level });
      }
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);
    document.addEventListener("visibilitychange", onHide);

    window.__controlsTest = {
      getX: () => worldRef.current?.runners[0].x ?? 0,
      getY: () => worldRef.current?.runners[0].y ?? 0,
      getX2: () => worldRef.current?.runners[1].x ?? 0,
      getY2: () => worldRef.current?.runners[1].y ?? 0,
      getSpeed: () => Math.abs(worldRef.current?.runners[0].vx ?? 0),
      getYaw: () => worldRef.current?.runners[0].facing ?? 1,
      setKeys: (codes: string[]) => {
        qaRef.current = codes.length ? new Set(codes) : null;
        if (!codes.length) jumpPrev.current = [false, false];
      },
      phase: () => worldRef.current?.phase ?? "menu",
    };
    window.__simulate = (level: number) => practiceRun(level, 75);

    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      ensureSprites(now);
      const command = cmdRef.current;
      if (command) {
        cmdRef.current = null;
        if (command.op === "clear") worldRef.current = null;
        else worldRef.current = createWorld(command.level, qaMode.current);
        particles.current = [];
        jumpPrev.current = [false, false];
        spokenCount = "";
      }

      const world = worldRef.current;
      if (world && screenRef.current.name === "play") {
        acc += dt;
        let steps = 0;
        while (acc >= 1 / 60 && steps < 5) {
          const events = step(world, [readInput(0), readInput(1)], 1 / 60);
          for (const event of events) {
            if (event.type === "jump") audio.play(event.double ? "djump" : "jump");
            if (event.type === "jump" && event.double) {
              const runner = world.runners[event.id];
              burst(runner.x + runner.w / 2, runner.y + runner.h, event.id === 0 ? "#2ee6c7" : "#ffb020", 8, 90);
            }
            if (event.type === "coin") {
              audio.play("coin");
              burst(event.x, event.y, "#ffb020", 10, 120);
            }
            if (event.type === "die") {
              audio.play("die");
              burst(event.x, event.y, "#ff4b4b", 14, 160);
              const pill = document.querySelector(event.id === 0 ? ".pill.vex" : ".pill.rio");
              if (pill) {
                pill.classList.add("hit");
                window.clearTimeout(hitTimers[event.id]);
                const ms = reduced.current ? 600 : 300;
                hitTimers[event.id] = window.setTimeout(() => pill.classList.remove("hit"), ms);
              }
              pushLive(
                event.id === 0
                  ? liveLine("vdLiveVexBack", "VEX back to checkpoint")
                  : liveLine("vdLiveRioBack", "RIO back to checkpoint"),
              );
            }
            if (event.type === "check") {
              audio.play("check");
              pushLive(
                event.id === 0
                  ? liveLine("vdLiveVexCheck", "VEX checkpoint")
                  : liveLine("vdLiveRioCheck", "RIO checkpoint"),
              );
            }
            if (event.type === "win") {
              audio.play("win");
              const runner = world.runners[event.id];
              const time = formatTime(runner.finishTime || world.time);
              const coins = String(runner.coins);
              const vex = event.id === 0;
              pushLive(
                liveLine(
                  vex ? "vdLiveVexWin" : "vdLiveRioWin",
                  vex
                    ? "VEX takes the flag, {time} seconds, {coins} coins"
                    : "RIO takes the flag, {time} seconds, {coins} coins",
                )
                  .replace("{time}", time)
                  .replace("{coins}", coins),
              );
            }
            if (event.type === "go") {
              audio.play("go");
              pushLive(liveLine("vdLiveGo", "Go"));
            }
            if (event.type === "land") burst(event.x, event.y, "#8b98a6", 4, 50);
          }
          acc -= 1 / 60;
          steps += 1;
        }
        if (world.phase === "countdown" && world.countdown > 0) {
          const n = String(Math.ceil(world.countdown));
          if (n !== spokenCount) {
            spokenCount = n;
            pushLive(liveLine(`vdLive${n}`, n));
          }
        }
        const gate = liveGate.current;
        if (gate.pending && liveRef.current && (!gate.at || performance.now() - gate.at >= 1000)) {
          gate.at = performance.now();
          const text = gate.pending;
          gate.pending = "";
          liveRef.current.textContent = text;
        }
        if (world.phase === "done" && !world.reported && world.winner != null) {
          world.reported = true;
          const winner = world.winner;
          const coins: [number, number] = [world.runners[0].coins, world.runners[1].coins];
          const nextSave = considerBest(
            saveRef.current,
            world.level.id,
            world.time,
            coins[winner],
            NAMES[winner],
          );
          saveRef.current = nextSave;
          writeSave(nextSave);
          setSave(nextSave);
          show({
            name: "results",
            level: world.levelIndex,
            winner,
            time: world.time,
            coins,
          });
        }
      } else {
        acc = 0;
      }

      tickParticles(particles.current, dt);
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const bw = Math.max(1, Math.floor(rect.width * dpr));
      const bh = Math.max(1, Math.floor(rect.height * dpr));
      if (canvas.width !== bw || canvas.height !== bh) {
        canvas.width = bw;
        canvas.height = bh;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = "#07090c";
      ctx.fillRect(0, 0, rect.width, rect.height);
      const contain = Math.min(rect.width / VIEW_W, rect.height / VIEW_H);
      const tall = rect.height > rect.width * (VIEW_H / VIEW_W) + 24;
      let scale = contain;
      let ox = (rect.width - VIEW_W * scale) / 2;
      let oy = 0;
      if (tall && world) {
        const feet = Math.max(...world.runners.map((runner) => runner.y + runner.h)) - world.camY;
        const span = Math.min(VIEW_H, Math.max(260, feet + 56));
        scale = Math.max(contain, Math.min(rect.height / span, rect.width / 260));
        const visibleW = rect.width / scale;
        const pack =
          world.runners.reduce((sum, runner) => sum + (runner.x - world.camX), 0) / world.runners.length;
        const left = Math.max(0, Math.min(Math.max(0, VIEW_W - visibleW), pack - visibleW * 0.32));
        ox = -left * scale;
        const visibleH = rect.height / scale;
        const viewTop = Math.max(0, Math.min(Math.max(0, VIEW_H - visibleH), feet + 28 - visibleH));
        oy = -viewTop * scale;
      }
      ctx.setTransform(dpr * scale, 0, 0, dpr * scale, ox * dpr, oy * dpr);
      ctx.imageSmoothingEnabled = true;
      if (world) {
        renderWorld(ctx, world, sprites.current, particles.current, reduced.current);
        coinRefs[0].current && (coinRefs[0].current.textContent = String(world.runners[0].coins));
        coinRefs[1].current && (coinRefs[1].current.textContent = String(world.runners[1].coins));
        cpRefs[0].current &&
          (cpRefs[0].current.textContent =
            world.runners[0].checkpoint < 0 ? "CP —" : `CP ${world.runners[0].checkpoint + 1}`);
        cpRefs[1].current &&
          (cpRefs[1].current.textContent =
            world.runners[1].checkpoint < 0 ? "CP —" : `CP ${world.runners[1].checkpoint + 1}`);
        if (timeRef.current) timeRef.current.textContent = formatTime(world.time);
        const width = world.level.width;
        if (pipRefs[0].current) pipRefs[0].current.style.left = `${(world.runners[0].x / width) * 100}%`;
        if (pipRefs[1].current) pipRefs[1].current.style.left = `${(world.runners[1].x / width) * 100}%`;
        if (flagRef.current) flagRef.current.style.left = `${(world.level.goal.x / width) * 100}%`;
      } else {
        renderAttract(ctx, now / 1000);
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
      document.removeEventListener("visibilitychange", onHide);
      canvas.removeEventListener("contextmenu", stopGesture);
      document.removeEventListener("contextmenu", stopGesture);
      document.removeEventListener("selectstart", stopGesture);
      document.removeEventListener("dragstart", stopGesture);
      delete window.__controlsTest;
      delete window.__simulate;
    };
    // The loop closes over stable setters and refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const wrap = playfieldRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    const fit = () => {
      const wrapW = wrap.clientWidth;
      const wrapH = wrap.clientHeight;
      if (wrapW < 2 || wrapH < 2) return;
      const scale = Math.min(wrapW / VIEW_W, wrapH / VIEW_H);
      canvas.dataset.vdScale = String(scale);
      canvas.style.width = "100%";
      canvas.style.height = "100%";
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(wrap);
    window.addEventListener("resize", fit);
    window.addEventListener("orientationchange", fit);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", fit);
      window.removeEventListener("orientationchange", fit);
    };
  }, []);

  const levelIndex = screen.name === "menu" ? 0 : screen.level;
  const level = LEVELS[levelIndex];
  const playing = screen.name === "play" || screen.name === "pause";

  const [helpOpen, setHelpOpen] = useState(false);
  const [helpRev, setHelpRev] = useState(0);

  useEffect(() => {
    if (!helpOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || event.repeat) return;
      event.preventDefault();
      event.stopPropagation();
      setHelpOpen(false);
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [helpOpen]);
  const [coarse, setCoarse] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches,
  );
  const [lang, setLang] = useState("en");

  useEffect(() => {
    const mq = window.matchMedia("(pointer: coarse)");
    const syncCoarse = () => setCoarse(mq.matches);
    syncCoarse();
    mq.addEventListener("change", syncCoarse);
    const onDown = (event: globalThis.PointerEvent) => {
      if (event.pointerType === "touch") setCoarse(true);
    };
    window.addEventListener("pointerdown", onDown, true);
    const readLang = () => {
      const code = document.documentElement.getAttribute("data-kp-lang") || "en";
      setLang(code === "simple" ? "en" : code);
      const api = window.KulibertI18n;
      if (api && api.ready) api.ready(code, () => setHelpRev((n) => n + 1));
      else setHelpRev((n) => n + 1);
    };
    readLang();
    window.addEventListener("kulibert-lang", readLang);
    const obs = new MutationObserver(readLang);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-kp-lang"] });
    return () => {
      mq.removeEventListener("change", syncCoarse);
      window.removeEventListener("pointerdown", onDown, true);
      window.removeEventListener("kulibert-lang", readLang);
      obs.disconnect();
    };
  }, []);

  const proofRef = useRef<{
    setHeld: (id: 0 | 1, key: keyof Pad, on: boolean) => void;
    state: () => ProofState;
    ensureRace: () => void;
  } | null>(null);

  useEffect(() => {
    if (!proofEnabled()) return;
    registerProof({
      state: () => proofRef.current?.state() ?? {
        level: "menu",
        timer: 0,
        running: false,
        vex: { x: 0, y: 0, coins: 0, done: false },
        rio: { x: 0, y: 0, coins: 0, done: false },
        orientation: window.innerHeight >= window.innerWidth ? "portrait" : "landscape",
      },
      setHeld: (id, key, on) => proofRef.current?.setHeld(id, key, on),
      ensureRace: () => proofRef.current?.ensureRace(),
    });
    return () => registerProof(null);
  }, []);

  const tipLang = TOUCH_TIP[lang] ? lang : "en";
  const tip = coarse ? TOUCH_TIP[tipLang] : KEY_TIP;
  const holdHelp = (() => {
    void helpRev;
    const fallback = "Hold Run and Jump to keep going. The buttons fit on every phone.";
    try {
      const value = window.KulibertI18n?.t?.("vdHoldHelp", fallback);
      if (value && value !== "vdHoldHelp") return value;
    } catch {
      /* keep the English line */
    }
    return fallback;
  })();
  const shapeHelp = (() => {
    void helpRev;
    const fallback = "VEX is a circle with V. RIO is a square with R. A sign tells you when someone goes back to a checkpoint.";
    try {
      const value = window.KulibertI18n?.t?.("vdShapeHelp", fallback);
      if (value && value !== "vdShapeHelp") return value;
    } catch {
      /* keep the English line */
    }
    return fallback;
  })();
  const heldPadHelp = (() => {
    void helpRev;
    const fallback = "Hold a pad to keep moving. A held pad lights up and shows its word.";
    try {
      const value = window.KulibertI18n?.t?.("vdHeldHelp", fallback);
      if (value && value !== "vdHeldHelp") return value;
    } catch {
      /* keep the English line */
    }
    return fallback;
  })();
  function onWord() {
    const fallback = "On";
    try {
      const value = window.KulibertI18n?.t?.("vdPadOn", fallback);
      if (value && value !== "vdPadOn") return value;
    } catch {
      /* keep the English word */
    }
    return fallback;
  }

  const syncHolds = () => {
    const next: [Pad, Pad] = [
      { left: false, right: false, jump: false },
      { left: false, right: false, jump: false },
    ];
    for (const hold of holds.current.values()) next[hold.id][hold.key] = true;
    pads.current = next;
    const root = padsRoot.current;
    if (!root) return;
    root.querySelectorAll<HTMLButtonElement>(".pad-btn").forEach((btn) => {
      const on = [...holds.current.values()].some(
        (hold) => String(hold.id) === btn.dataset.runner && hold.key === btn.dataset.act,
      );
      btn.classList.toggle("held", on);
      btn.setAttribute("aria-pressed", on ? "true" : "false");
      const ico = btn.querySelector(".pad-ico");
      if (ico) ico.textContent = on ? "●" : btn.dataset.ico || "";
      const mark = btn.querySelector(".pad-on");
      if (mark) mark.textContent = on ? onWord() : "";
    });
  };

  proofRef.current = {
    setHeld: (id, key, on) => {
      const slot = key === "left" ? 1 : key === "right" ? 2 : 3;
      const pointerId = -10 - id * 4 - slot;
      if (on) holds.current.set(pointerId, { id, key });
      else holds.current.delete(pointerId);
      syncHolds();
    },
    state: () => {
      const world = worldRef.current;
      const screenNow = screenRef.current;
      const one = (id: 0 | 1) => {
        const runner = world?.runners[id];
        return {
          x: runner?.x ?? 0,
          y: runner?.y ?? 0,
          coins: runner?.coins ?? 0,
          done: world?.winner === id,
        };
      };
      return {
        level: world?.level.id ?? "menu",
        timer: world?.time ?? 0,
        running: screenNow.name === "play" && (world?.phase === "race" || world?.phase === "countdown"),
        vex: one(0),
        rio: one(1),
        orientation: window.innerHeight >= window.innerWidth ? "portrait" : "landscape",
      };
    },
    ensureRace: () => {
      if (screenRef.current.name !== "play") launch(0);
    },
  };

  const releasePointer = (pointerId: number) => {
    if (!holds.current.delete(pointerId)) return;
    syncHolds();
  };
  releaseRef.current = releasePointer;

  useEffect(() => {
    const end = (event: globalThis.PointerEvent) => releaseRef.current(event.pointerId);
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", end);
    return () => {
      window.removeEventListener("pointerup", end);
      window.removeEventListener("pointercancel", end);
    };
  }, []);

  const press = (id: 0 | 1, key: keyof Pad) => ({
    onPointerDown: (event: PointerEvent<HTMLButtonElement>) => {
      if (event.pointerType === "mouse" && event.button !== 0) return;
      event.preventDefault();
      holds.current.set(event.pointerId, { id, key });
      syncHolds();
      audio.unlock();
    },
    onPointerUp: (event: PointerEvent<HTMLButtonElement>) => releasePointer(event.pointerId),
    onPointerCancel: (event: PointerEvent<HTMLButtonElement>) => releasePointer(event.pointerId),
    onContextMenu: (event: PointerEvent<HTMLButtonElement>) => event.preventDefault(),
  });

  return (
    <div className={`game-root${padMode === "on" ? " pads-on" : ""}${padMode === "off" ? " pads-off" : ""}`}>
      <div className="stage">
        {screen.name !== "menu" && (
          <p className="vd-live" role="status" aria-live="polite" ref={liveRef} />
        )}
        {playing && (
          <div className="hud">
            <div className="hud-row">
              <div className="pill vex">
                <strong>VEX</strong>
                <span className="gem" />
                <b className="score" ref={coinRefs[0]}>0</b>
                <span className="meta score">/{level.coins.length}</span>
                <span className="meta" ref={cpRefs[0]}>
                  CP —
                </span>
              </div>
              <div className="pill clock">
                <span className="meta heat-name">{level.name}</span>
                <b ref={timeRef}>0.00</b>
              </div>
              <div className="end">
                <div className="pill rio">
                  <strong>RIO</strong>
                  <span className="gem" />
                  <b className="score" ref={coinRefs[1]}>0</b>
                  <span className="meta score">/{level.coins.length}</span>
                  <span className="meta" ref={cpRefs[1]}>
                    CP —
                  </span>
                </div>
                <div className="hud-actions">
                  <button
                    type="button"
                    className="icon-btn"
                    aria-label={save.muted ? "Unmute" : "Mute"}
                    onClick={() => {
                      const next = { ...saveRef.current, muted: !saveRef.current.muted };
                      audio.muted = next.muted;
                      if (!next.muted) audio.unlock();
                      saveRef.current = next;
                      setSave(next);
                      writeSave(next);
                    }}
                  >
                    {save.muted ? "Sound on" : "Mute"}
                  </button>
                  {screen.name === "play" ? (
                    <button
                      type="button"
                      className="icon-btn"
                      aria-label="Pause"
                      onClick={() => show({ name: "pause", level: screen.level })}
                    >
                      Pause
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="icon-btn"
                      aria-label="Resume"
                      onClick={() => show({ name: "play", level: screen.level })}
                    >
                      Resume
                    </button>
                  )}
                  <button
                    type="button"
                    className="icon-btn"
                    aria-label="Restart heat"
                    onClick={() => launch(levelIndex, "restart")}
                  >
                    Restart
                  </button>
                </div>
              </div>
            </div>
            <div className="track" aria-hidden="true">
              <i ref={pipRefs[0]} className="vex">V</i>
              <i ref={pipRefs[1]} className="rio">R</i>
              <i ref={flagRef} className="flag" />
            </div>
            {hint && screen.name === "play" && (
              <p className="hint" lang={tipLang === "fa-AF" ? "fa" : tipLang} dir={tipLang === "ar" || tipLang === "fa-AF" ? "rtl" : "ltr"}>
                {tip}
              </p>
            )}
          </div>
        )}

        <div className="playfield" ref={playfieldRef}>
          <canvas ref={canvasRef} aria-label="Volt Duel arena" />
        </div>

        {screen.name === "menu" && (
          <div className="overlay">
            <div className="menu-card">
              <p className="kicker">Local circuit</p>
              <h1 className="wordmark">
                <span className="cyan">Volt</span> <span className="amber">Duel</span>
              </h1>
              <p className="tag">Two runners. One flag. First touch takes the heat.</p>
              <div className="levels">
                {LEVELS.map((entry, index) => {
                  const best = save.best[entry.id];
                  return (
                    <button key={entry.id} type="button" className="level-card" onClick={() => launch(index)}>
                      <span className="heat">{entry.heat}</span>
                      <h2>{entry.name}</h2>
                      <p>{entry.blurb}</p>
                      <span className="best">
                        {best ? `Best ${formatTime(best.time)} · ${best.name}` : "No time yet"}
                      </span>
                    </button>
                  );
                })}
              </div>
              <div className="controls-row">
                <div className="control-box vex">
                  <h3>VEX</h3>
                  {coarse ? (
                    <p dir="ltr">◀ ▶ run · ⤒ jump</p>
                  ) : (
                    <p>
                      <kbd>A</kbd> <kbd>D</kbd> run · <kbd>W</kbd> jump · <kbd>S</kbd> drop through
                    </p>
                  )}
                </div>
                <div className="control-box rio">
                  <h3>RIO</h3>
                  {coarse ? (
                    <p dir="ltr">◀ ▶ run · ⤒ jump</p>
                  ) : (
                    <p>
                      <kbd>←</kbd> <kbd>→</kbd> run · <kbd>↑</kbd> jump · <kbd>↓</kbd> drop through
                    </p>
                  )}
                </div>
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="text-btn"
                  aria-expanded={helpOpen}
                  aria-controls="vd-help-tip"
                  onClick={() => setHelpOpen((open) => !open)}
                >
                  <span aria-hidden="true">?</span> Help
                </button>
                <button
                  type="button"
                  className="text-btn"
                  onClick={() => setPadMode((mode) => (mode === "on" ? "off" : "on"))}
                >
                  {padMode === "on" ? "Hide pads" : "Touch pads"}
                </button>
                {testOn() && (
                  <>
                    <button type="button" className="text-btn" onClick={jumpWin} aria-label="Jump to win" style={{ minWidth: 44, minHeight: 44 }}>
                      <span aria-hidden="true">🏆</span> Jump to win
                    </button>
                    <button type="button" className="text-btn" onClick={jumpLose} aria-label="Jump to lose" style={{ minWidth: 44, minHeight: 44 }}>
                      <span aria-hidden="true">⚑</span> Jump to lose
                    </button>
                  </>
                )}
              </div>
              {helpOpen && (
                <div className="help-pop" id="vd-help-tip" role="dialog" aria-label="Help">
                  <p>
                    <span aria-hidden="true">⏵ </span>
                    <span data-i18n="vdHoldHelp">{holdHelp}</span>
                  </p>
                  <p>
                    <span aria-hidden="true">⬤ </span>
                    <span data-i18n="vdShapeHelp">{shapeHelp}</span>
                  </p>
                  <p>
                    <span aria-hidden="true">● </span>
                    <span data-i18n="vdHeldHelp">{heldPadHelp}</span>
                  </p>
                  <p>
                    Hazards send you back to your checkpoint. Restart resets the whole heat. Double-jump the wide gaps.
                  </p>
                  {testOn() && <p>⚑ Test mode (staff only): jump to the win or lose screen. Scores go to the TEST board.</p>}
                  <button type="button" className="text-btn" onClick={() => setHelpOpen(false)}>
                    Close
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {screen.name === "pause" && (
          <div className="overlay">
            <div className="modal-card">
              <p className="kicker">{level.heat}</p>
              <h2>Paused</h2>
              <p className="tag">{level.name} is frozen. Checkpoints stay put.</p>
              <div className="modal-actions">
                <button type="button" className="text-btn" onClick={() => show({ name: "play", level: screen.level })}>
                  Resume
                </button>
                <button type="button" className="text-btn" onClick={() => launch(screen.level, "restart")}>
                  Restart
                </button>
                <button
                  type="button"
                  className="text-btn"
                  onClick={() => {
                    cmdRef.current = { op: "clear" };
                    show({ name: "menu" });
                  }}
                >
                  Levels
                </button>
              </div>
            </div>
          </div>
        )}

        {screen.name === "results" && (
          <div className="overlay">
            <div className="modal-card">
              <p className="kicker">{LEVELS[screen.level].name}</p>
              <h2 className={screen.winner === 0 ? "vex" : "rio"}>{NAMES[screen.winner]} takes the flag</h2>
              <p className="tag">{formatTime(screen.time)}</p>
              <div className="score-grid">
                <div>
                  <strong className="vex">VEX</strong>
                  <span>{screen.coins[0]} coins</span>
                </div>
                <div>
                  <strong className="rio">RIO</strong>
                  <span>{screen.coins[1]} coins</span>
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="text-btn" onClick={() => launch(screen.level, "restart")}>
                  Rematch
                </button>
                {screen.level < LEVELS.length - 1 && (
                  <button type="button" className="text-btn" onClick={() => launch(screen.level + 1)}>
                    Next heat
                  </button>
                )}
                <button
                  type="button"
                  className="text-btn"
                  onClick={() => {
                    cmdRef.current = { op: "clear" };
                    show({ name: "menu" });
                  }}
                >
                  Levels
                </button>
              </div>
            </div>
          </div>
        )}

        {screen.name === "play" && (
          <div className="pads" ref={padsRoot}>
            <div className="pad-cluster vex">
              <span className="pad-label">VEX</span>
              <button type="button" className="pad-btn" data-runner="0" data-act="left" data-ico="◀" data-word="Left" aria-pressed="false" aria-label="VEX left" {...press(0, "left")}>
                <span className="pad-ico" aria-hidden="true">◀</span>
                <span className="pad-word">Left</span>
                <span className="pad-on"></span>
              </button>
              <button type="button" className="pad-btn" data-runner="0" data-act="right" data-ico="▶" data-word="Right" aria-pressed="false" aria-label="VEX right" {...press(0, "right")}>
                <span className="pad-ico" aria-hidden="true">▶</span>
                <span className="pad-word">Right</span>
                <span className="pad-on"></span>
              </button>
              <button type="button" className="pad-btn" data-runner="0" data-act="jump" data-ico="⤒" data-word="Jump" aria-pressed="false" aria-label="VEX jump" {...press(0, "jump")}>
                <span className="pad-ico" aria-hidden="true">⤒</span>
                <span className="pad-word">Jump</span>
                <span className="pad-on"></span>
              </button>
            </div>
            <div className="pad-cluster rio">
              <span className="pad-label">RIO</span>
              <button type="button" className="pad-btn" data-runner="1" data-act="left" data-ico="◀" data-word="Left" aria-pressed="false" aria-label="RIO left" {...press(1, "left")}>
                <span className="pad-ico" aria-hidden="true">◀</span>
                <span className="pad-word">Left</span>
                <span className="pad-on"></span>
              </button>
              <button type="button" className="pad-btn" data-runner="1" data-act="right" data-ico="▶" data-word="Right" aria-pressed="false" aria-label="RIO right" {...press(1, "right")}>
                <span className="pad-ico" aria-hidden="true">▶</span>
                <span className="pad-word">Right</span>
                <span className="pad-on"></span>
              </button>
              <button type="button" className="pad-btn" data-runner="1" data-act="jump" data-ico="⤒" data-word="Jump" aria-pressed="false" aria-label="RIO jump" {...press(1, "jump")}>
                <span className="pad-ico" aria-hidden="true">⤒</span>
                <span className="pad-word">Jump</span>
                <span className="pad-on"></span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
