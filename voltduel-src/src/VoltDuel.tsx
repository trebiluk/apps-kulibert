import { useEffect, useRef, useState, type PointerEvent } from "react";
import { audio } from "@/game/audio";
import { renderAttract, renderWorld, tickParticles, type Particle, type SpriteSet } from "@/game/draw";
import { LEVELS } from "@/game/levels";
import { createWorld, practiceRun, step } from "@/game/sim";
import { considerBest, formatTime, loadSave, writeSave, type Save } from "@/game/save";
import { VIEW_H, VIEW_W, type Input, type World } from "@/game/types";

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

  const [screen, setScreen] = useState<Screen>({ name: "menu" });
  const [save, setSave] = useState<Save>({ best: {}, muted: false });
  const [hint, setHint] = useState(false);
  const [padMode, setPadMode] = useState<"auto" | "on" | "off">("auto");

  saveRef.current = save;

  function show(next: Screen) {
    screenRef.current = next;
    setScreen(next);
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
            }
            if (event.type === "check") audio.play("check");
            if (event.type === "win") audio.play("win");
            if (event.type === "go") audio.play("go");
            if (event.type === "land") burst(event.x, event.y, "#8b98a6", 4, 50);
          }
          acc -= 1 / 60;
          steps += 1;
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
      const scale = Math.min(rect.width / VIEW_W, rect.height / VIEW_H);
      const ox = (rect.width - VIEW_W * scale) / 2;
      const oy = (rect.height - VIEW_H * scale) / 2;
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

  const levelIndex = screen.name === "menu" ? 0 : screen.level;
  const level = LEVELS[levelIndex];
  const playing = screen.name === "play" || screen.name === "pause";

  const [helpOpen, setHelpOpen] = useState(false);

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
    });
  };

  const releasePointer = (pointerId: number) => {
    if (!holds.current.delete(pointerId)) return;
    syncHolds();
  };

  const press = (id: 0 | 1, key: keyof Pad) => ({
    onPointerDown: (event: PointerEvent<HTMLButtonElement>) => {
      if (event.pointerType === "mouse" && event.button !== 0) return;
      event.preventDefault();
      holds.current.set(event.pointerId, { id, key });
      syncHolds();
      try {
        event.currentTarget.setPointerCapture(event.pointerId);
      } catch {
        /* synthetic presses still hold via the pointer map */
      }
      audio.unlock();
    },
    onPointerUp: (event: PointerEvent<HTMLButtonElement>) => releasePointer(event.pointerId),
    onPointerCancel: (event: PointerEvent<HTMLButtonElement>) => releasePointer(event.pointerId),
    onLostPointerCapture: (event: PointerEvent<HTMLButtonElement>) => {
      if (event.buttons !== 0) {
        try {
          event.currentTarget.setPointerCapture(event.pointerId);
        } catch {
          /* finger is still down; the pointer map keeps the run going */
        }
        return;
      }
      releasePointer(event.pointerId);
    },
    onContextMenu: (event: PointerEvent<HTMLButtonElement>) => event.preventDefault(),
  });

  return (
    <div className={`game-root${padMode === "on" ? " pads-on" : ""}${padMode === "off" ? " pads-off" : ""}`}>
      <div className="stage">
        <canvas ref={canvasRef} aria-label="Volt Duel arena" />
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
              <i ref={pipRefs[0]} className="vex" />
              <i ref={pipRefs[1]} className="rio" />
              <i ref={flagRef} className="flag" />
            </div>
            {hint && screen.name === "play" && (
              <p className="hint">VEX uses WASD. RIO uses arrows. Jump again in the air.</p>
            )}
          </div>
        )}

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
                  <p>
                    <kbd>A</kbd> <kbd>D</kbd> run · <kbd>W</kbd> jump · <kbd>S</kbd> drop through
                  </p>
                </div>
                <div className="control-box rio">
                  <h3>RIO</h3>
                  <p>
                    <kbd>←</kbd> <kbd>→</kbd> run · <kbd>↑</kbd> jump · <kbd>↓</kbd> drop through
                  </p>
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
              </div>
              {helpOpen && (
                <div className="help-pop" id="vd-help-tip" role="dialog" aria-label="Help">
                  <p>
                    Hazards send you back to your checkpoint. Restart resets the whole heat. Double-jump the wide gaps.
                  </p>
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
      </div>

      {screen.name === "play" && (
        <div className="pads" ref={padsRoot}>
          <div className="pad-cluster vex">
            <span className="pad-label">VEX</span>
            <button type="button" className="pad-btn" data-runner="0" data-act="left" aria-label="VEX left" {...press(0, "left")}>
              <span className="pad-ico" aria-hidden="true">◀</span>
              <span className="pad-word">Left</span>
            </button>
            <button type="button" className="pad-btn" data-runner="0" data-act="right" aria-label="VEX right" {...press(0, "right")}>
              <span className="pad-ico" aria-hidden="true">▶</span>
              <span className="pad-word">Right</span>
            </button>
            <button type="button" className="pad-btn" data-runner="0" data-act="jump" aria-label="VEX jump" {...press(0, "jump")}>
              <span className="pad-ico" aria-hidden="true">⤒</span>
              <span className="pad-word">Jump</span>
            </button>
          </div>
          <div className="pad-cluster rio">
            <span className="pad-label">RIO</span>
            <button type="button" className="pad-btn" data-runner="1" data-act="left" aria-label="RIO left" {...press(1, "left")}>
              <span className="pad-ico" aria-hidden="true">◀</span>
              <span className="pad-word">Left</span>
            </button>
            <button type="button" className="pad-btn" data-runner="1" data-act="right" aria-label="RIO right" {...press(1, "right")}>
              <span className="pad-ico" aria-hidden="true">▶</span>
              <span className="pad-word">Right</span>
            </button>
            <button type="button" className="pad-btn" data-runner="1" data-act="jump" aria-label="RIO jump" {...press(1, "jump")}>
              <span className="pad-ico" aria-hidden="true">⤒</span>
              <span className="pad-word">Jump</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
