import { Round, keyCell } from "../../core/lookout-sim.js";
import { t, rtl, say } from "../i18n.js";
import { current, loadSave, saveSave, saveNow, seedsFor, settings, pushBoard } from "../save.js";
import { skyOf } from "../looks.js";
import { endlessLevel, titleKey } from "../modes.js";
import { bands, poseNow } from "../ui/bands.js";
import { fitButton, intScale, makeButton } from "../ui/widgets.js";
import { burst, lite, markGesture, motionOff, noteFrame, punch, shake, sound, takeSteps, tickBits } from "../fx.js";

const ANIM = { hawk: "hawk-fly", coyote: "coyote-trot", snake: "snake-slither", rabbit: "rabbit-hop", weed: "weed-roll", wonder: "wonder-hop" };
const STILL = { hawk: "hawk-flap-0", coyote: "coyote-trot-0", snake: "snake-slither-0", cloud: "cloud", rabbit: "rabbit-hop-0", weed: "weed-0", wonder: "wonder-hop-0" };
const CAP = { hawk: "capHawk", coyote: "capCoyote", snake: "capSnake", cloud: "capCloud", rabbit: "capRabbit", weed: "capWeed", wonder: "capWonder" };

export class Lookout extends window.Phaser.Scene {
  constructor() { super("Lookout"); }
  init(data) {
    this.playMode = (data && data.mode) || "class";
    this.endless = this.playMode === "endless";
    this.seed = data && data.seed != null ? data.seed : ((Date.now() ^ 7) >>> 0);
    this.wave = 1;
    this.carry = 0;
    this.level = this.endless ? endlessLevel(1) : data.level;
  }
  create() {
    loadSave();
    this.cameras.main.roundPixels = true;
    this.cameras.main.setBackgroundColor(skyOf(settings().look));
    this.bootRound();
    this.ground = this.add.tileSprite(0, 0, 32, 32, "lookout", "ground-0").setDepth(0);
    this.far = lite() ? null : this.add.tileSprite(0, 0, 32, 32, "lookout", "cloud").setDepth(0).setAlpha(0.4);
    this.tufts = [0, 1, 2].map((i) => this.add.sprite(0, 0, "lookout", "grass-" + i).play("grass-sway").setDepth(1));
    this.holes = [];
    for (let i = 0; i < (this.level.holes || 5); i++) this.holes.push(this.add.image(0, 0, "lookout", "hole").setDepth(1));
    this.nest = this.add.image(0, 0, "lookout", "mound").setDepth(2);
    this.pups = [];
    for (let i = 0; i < 6; i++) this.pups.push(this.add.sprite(0, 0, "lookout", "pup-idle-0").play("pup-idle").setDepth(3));
    this.alice = this.add.sprite(-200, -200, "lookout", "alice-pop-0").setVisible(false).setDepth(5);
    this.threat = this.add.sprite(-200, -200, "lookout", "hawk-flap-0").setVisible(false).setDepth(6);
    this.shadow = this.add.image(-200, -200, "lookout", "hawk-shadow").setVisible(false).setDepth(1);
    this.bits = [];
    const bitN = lite() ? 20 : 36;
    for (let i = 0; i < bitN; i++) this.bits.push(this.add.image(0, 0, "lookout", "star").setVisible(false).setDepth(7));
    this.goal = this.add.text(0, 0, "", { fontFamily: "Atkinson Hyperlegible", fontSize: "16px", color: "#042f2e", align: "left" }).setDepth(8).setVisible(false);
    this.cap = this.add.text(0, 0, "", { fontFamily: "Atkinson Hyperlegible", fontSize: "18px", color: "#042f2e", align: "center" }).setOrigin(0.5, 1).setDepth(8).setVisible(false);
    this.scoreT = this.add.text(0, 0, "", { fontFamily: "Atkinson Hyperlegible", fontSize: "14px", color: "#f8fafc" }).setDepth(8).setVisible(false);
    this.ring = this.add.text(0, 0, "", { fontFamily: "Atkinson Hyperlegible", fontSize: "18px", color: "#042f2e" }).setDepth(8).setVisible(false);
    this.prompt = this.add.text(0, 0, "", { fontFamily: "Atkinson Hyperlegible", fontSize: "16px", color: "#042f2e", wordWrap: { width: 220 } }).setDepth(8).setVisible(false);
    this.digits = [];
    for (let i = 0; i < 6; i++) this.digits.push(this.add.image(0, 0, "lookout", "dig-0").setDepth(8).setVisible(false));
    this.readBtn = makeButton(this, "read", () => { say(this.goal.text); sound(this, "chirp"); });
    this.helpBtn = makeButton(this, "help", () => window.dispatchEvent(new CustomEvent("ap-help")));
    this.pauseBtn = makeButton(this, "pause", () => this.pause());
    this.restartBtn = makeButton(this, "restart", () => window.dispatchEvent(new CustomEvent("ap-restart")));
    this.alarms = [
      makeButton(this, "alarm-sky", () => this.alarm(0)),
      makeButton(this, "alarm-ground", () => this.alarm(1)),
      makeButton(this, "alarm-snake", () => this.alarm(2)),
    ];
    [this.readBtn, this.helpBtn, this.pauseBtn, this.restartBtn, ...this.alarms].forEach((b) => b.setDepth(10));
    this.input.keyboard.on("keydown", (e) => {
      if (this.hideHeld) { this.releaseHide(); return; }
      if (e.key === "Escape" || e.key === "p" || e.key === "P") { this.togglePause(); return; }
      if (e.key === "r" || e.key === "R") { window.dispatchEvent(new CustomEvent("ap-restart")); return; }
      const cell = keyCell(e);
      if (cell >= 0) this.alarm(cell);
    });
    this.acc = 0;
    this.ended = false;
    this.hideHeld = false;
    this.hidePaused = false;
    this.teach = this.playMode === "class" && this.level && this.level.id === "lookout-L01" && !current.seen.teach;
    this.onResize = (s) => { if (this.scene.isActive()) this.layout(s.width, s.height); };
    this.onLook = () => { if (this.scene.isActive()) this.cameras.main.setBackgroundColor(skyOf(settings().look)); };
    this.onVis = () => { if (document.visibilityState !== "visible") this.holdHide(); };
    this.onBlur = () => this.holdHide();
    this.onPointer = () => this.releaseHide();
    document.addEventListener("visibilitychange", this.onVis);
    window.addEventListener("blur", this.onBlur);
    window.addEventListener("pointerdown", this.onPointer);
    this.layout(this.scale.width, this.scale.height);
    this.scale.on("resize", this.onResize);
    window.addEventListener("ap-look", this.onLook);
    this.events.on("shutdown", () => {
      this.scale.off("resize", this.onResize);
      window.removeEventListener("ap-look", this.onLook);
      document.removeEventListener("visibilitychange", this.onVis);
      window.removeEventListener("blur", this.onBlur);
      window.removeEventListener("pointerdown", this.onPointer);
    });
    document.body.classList.add("in-round");
    say(this.teach ? t("tapSky") : this.goalLine());
    const live = document.getElementById("live");
    if (live) live.textContent = this.goalLine();
    if (this.teach) {
      this.round.pause();
      this.banner(this.prompt, t("tapSky"), this.band.field.x + 8, this.band.field.y + 36, Math.max(80, this.band.field.w - 16));
    }
    if (motionOff()) this.anims.pauseAll();
  }
  holdHide() {
    if (this.hideHeld) return;
    this.hideHeld = true;
    this.acc = 0;
    if (this.round && this.round.state === "running") {
      this.round.pause();
      this.hidePaused = true;
    }
  }
  releaseHide() {
    if (!this.hideHeld) return;
    this.hideHeld = false;
    this.acc = 0;
    markGesture();
    if (this.hidePaused && this.round && this.round.state === "paused") this.round.resume();
    this.hidePaused = false;
  }
  bootRound() {
    this.round = new Round((this.seed ^ this.wave) >>> 0, this.level, settings().speed === "relaxed");
  }
  goalLine() {
    const extra = settings().speed === "relaxed" ? " · " + t("relaxed") : "";
    if (this.endless) return t("endless") + " · " + t("wave") + " " + this.wave + extra;
    if (this.playMode === "daily") return t("today") + " · " + this.level.goalScore + extra;
    return this.roundTitle() + " · " + t("goalPups") + " · " + this.level.goalScore + extra;
  }
  roundTitle() {
    if (this.endless) return t("endless");
    if (this.playMode === "daily") return t("today");
    const m = String((this.level && this.level.id) || "").match(/(\d+)$/);
    return t("l0" + (m ? String(Number(m[1])) : "1"));
  }
  banner(node, str, x, y, wrap) {
    if (!str) { node.setText(""); node.setVisible(false); return; }
    node.setVisible(true);
    node.setBackgroundColor("#fde68a");
    node.setColor("#042f2e");
    node.setPadding(4, 2, 4, 2);
    node.setPosition(x, y);
    if (wrap) node.setWordWrapWidth(wrap);
    node.setText(str);
  }
  layout(w, h) {
    const pose = poseNow(window.innerWidth || w, window.innerHeight || h);
    const b = bands(w, h, { rtl: rtl(), pose, viewW: window.innerWidth || w, viewH: window.innerHeight || h });
    this.band = b;
    fitButton(this.pauseBtn, b.pause, t("pause"), null);
    fitButton(this.restartBtn, b.restart, t("restart"), null);
    fitButton(this.readBtn, b.read, "", "speaker");
    fitButton(this.helpBtn, b.help, "", "help-q");
    const words = [t("sky"), t("ground"), t("snake")];
    const icons = ["alarm-sky", "alarm-ground", "alarm-snake"];
    this.alarms.forEach((btn, i) => fitButton(btn, b.alarms[i], words[i], icons[i]));
    this.banner(this.goal, this.goalLine(), b.goal.x, b.goal.y, Math.max(40, b.goal.w - 8));
    this.ground.setPosition(b.field.x + b.field.w / 2, b.field.y + b.field.h / 2).setSize(Math.max(32, b.field.w), Math.max(32, b.field.h));
    if (this.far) {
      const farH = Math.max(32, Math.floor(b.field.h * 0.45));
      this.far.setPosition(b.field.x + b.field.w / 2, b.field.y + farH / 2).setSize(Math.max(32, b.field.w), farH).setVisible(!lite());
    }
    this.holes.forEach((hole, i) => {
      intScale(hole, 40);
      hole.setPosition(b.field.x + (b.field.w * (i + 1)) / (this.holes.length + 1), b.field.y + b.field.h * 0.58);
    });
    intScale(this.nest, Math.min(96, Math.floor(b.field.w / 4)));
    this.nest.setPosition(b.field.x + b.field.w / 2, b.field.y + b.field.h * 0.78);
    const pupW = this.pups[0].frame.width;
    const pupScale = Math.max(1, Math.floor(28 / pupW));
    const dw = pupW * pupScale;
    const gap = 10;
    const total = this.pups.length * dw + (this.pups.length - 1) * gap;
    const start = this.nest.x - total / 2;
    this.pups.forEach((pup, i) => {
      pup.setScale(pupScale);
      pup.setPosition(start + i * (dw + gap) + dw / 2, this.nest.y - dw * 0.35);
    });
    this.tufts.forEach((tuft, i) => {
      intScale(tuft, 32);
      tuft.setPosition(b.field.x + 24 + i * Math.max(36, (b.field.w - 48) / 3), b.field.y + b.field.h - 20);
    });
    this.digits.forEach((d) => intScale(d, 22));
    this.paintScore((this.carry || 0) + (this.round ? this.round.read().score : 0));
    if (this.prompt.visible) this.banner(this.prompt, this.prompt.text, b.field.x + 8, b.field.y + 28, Math.max(80, b.field.w - 16));
    this.banner(this.cap, this.cap.visible ? this.cap.text : "", b.field.x + b.field.w / 2 - 80, b.field.y + b.field.h - 36, Math.max(80, b.field.w - 24));
  }
  paintScore(n) {
    const b = this.band;
    const s = String(Math.max(0, n | 0));
    const dw = this.digits[0].displayWidth || 16;
    this.digits.forEach((d, i) => {
      if (i >= s.length) { d.setVisible(false); return; }
      d.setFrame("dig-" + s[i]).setVisible(true);
      d.setPosition(b.field.x + 8 + dw / 2 + i * (dw + 2), b.field.y + 16);
    });
    this.scoreT.setVisible(false);
  }
  alarm(cell) {
    if (!this.round) return;
    if (this.hideHeld) this.releaseHide();
    if (this.teach) {
      if (cell !== 0) return;
      this.teach = false;
      current.seen.teach = true;
      saveSave();
      this.round.resume();
      this.prompt.setVisible(false);
    }
    if (this.round.state !== "running") return;
    const before = this.round.read();
    this.round.alarm(cell);
    const after = this.round.read();
    if (after.why && after.why !== before.why) say(t(after.why));
    if (after.score > before.score) { sound(this, "chirp"); punch(this, this.alice); burst(this, this.alice.x, this.alice.y); }
    if (after.pupsSafe < before.pupsSafe) {
      const i = 5 - after.pupsSafe;
      if (this.pups[i]) { this.pups[i].anims.stop(); this.pups[i].setFrame("pup-hide"); }
      say(t("pupScared"));
      sound(this, "miss");
      shake(this);
    }
    this.paintScore((this.carry || 0) + after.score);
    document.getElementById("live").textContent = String((this.carry || 0) + after.score);
    if (this.endless && after.pupsSafe < 6) this.finish();
  }
  pause() { if (this.round && this.round.state === "running") { this.round.pause(); window.dispatchEvent(new CustomEvent("ap-pause")); } }
  togglePause() { if (this.round.state === "paused" && !this.hideHeld) this.resumeRound(); else this.pause(); }
  resumeRound() { if (this.round && this.round.state === "paused") this.round.resume(); }
  restart() { this.scene.restart({ level: this.level, mode: this.playMode, seed: this.seed }); }
  nextWave() {
    const bank = this.round.read();
    this.carry += bank.score;
    this.wave += 1;
    this.level = endlessLevel(this.wave);
    this.bootRound();
    this.acc = 0;
    this.banner(this.goal, this.goalLine(), this.band.goal.x, this.band.goal.y, Math.max(40, this.band.goal.w - 8));
    say(t("wave") + " " + this.wave);
  }
  finish() {
    if (this.ended) return;
    this.ended = true;
    this.round.state = "ended";
    const bank = this.round.read();
    const total = (this.carry || 0) + bank.score;
    const pay = seedsFor(total, this.endless ? 0 : bank.stars);
    current.seeds = (current.seeds || 0) + pay;
    if (this.playMode === "class") {
      const prev = current.best[this.level.id] || {};
      current.best[this.level.id] = { score: Math.max(total, prev.score || 0), stars: Math.max(bank.stars, prev.stars || 0), cleared: bank.cleared || prev.cleared };
    }
    if (this.playMode === "daily") {
      const key = new Date().getFullYear() + "-" + String(new Date().getMonth() + 1).padStart(2, "0") + "-" + String(new Date().getDate()).padStart(2, "0");
      const prev = current.daily[key] || {};
      current.daily[key] = { score: Math.max(total, prev.score || 0), cleared: bank.cleared || prev.cleared };
    }
    const desk = pushBoard(this.playMode, total);
    saveSave();
    saveNow();
    window.dispatchEvent(new CustomEvent("ap-end", { detail: { score: total, cleared: this.endless ? false : bank.cleared, pay, why: bank.why, title: titleKey(this.playMode, this.level), desk } }));
  }
  showActor(sprite, name, x, y, target) {
    const still = STILL[name] || "hawk-flap-0";
    const anim = ANIM[name];
    if (!sprite.visible || sprite.getData("kind") !== name) {
      sprite.setVisible(true);
      sprite.setData("kind", name);
      if (anim && !motionOff()) sprite.play(anim);
      else { sprite.anims.stop(); sprite.setFrame(still); }
    }
    intScale(sprite, target);
    sprite.setPosition(Math.round(x), Math.round(y));
  }
  update() {
    tickBits(this);
    if (typeof document !== "undefined" && document.visibilityState === "hidden") this.holdHide();
    if (!this.round || this.ended) return;
    if (this.hideHeld || this.round.state !== "running") return;
    const raw = this.game && this.game.loop ? this.game.loop.rawDelta : 16;
    noteFrame(raw);
    const taken = takeSteps(raw, this.acc);
    this.acc = taken.acc;
    for (let i = 0; i < taken.steps; i++) this.round.advance();
    if (!motionOff()) {
      this.ground.tilePositionX += lite() ? 0 : 0.2;
      if (this.far && !lite()) this.far.tilePositionX += 0.45;
    }
    if (this.far) this.far.setVisible(!lite());
    const step = this.round.step;
    const active = this.round.spawns.find((s) => step >= s.step && step <= s.step + s.approachSteps);
    const b = this.band;
    if (active) {
      const p = (step - active.step) / active.approachSteps;
      const hole = this.holes[active.hole] || this.holes[0];
      this.showActor(this.alice, "hawk", hole.x, hole.y - 28, 48);
      this.alice.anims.stop();
      if (!motionOff()) this.alice.play("alice-pop", true);
      else this.alice.setFrame("alice-pop-0");
      this.alice.setVisible(true);
      const sx = b.field.x + 24 + active.edge * (b.field.w / 2);
      this.showActor(this.threat, active.kind, sx + (this.nest.x - sx) * p, b.field.y + 28 + (this.nest.y - b.field.y - 28) * p, active.kind === "snake" ? 72 : 64);
      if (active.kind === "hawk") {
        this.shadow.setVisible(true);
        intScale(this.shadow, 48);
        this.shadow.setPosition(this.threat.x, this.nest.y + 8);
      } else this.shadow.setVisible(false);
      const cap = settings().captions ? t(CAP[active.kind] || "capHawk") : "";
      this.banner(this.cap, cap, b.field.x + 8, b.field.y + b.field.h - 8, Math.max(80, b.field.w - 16));
      this.cap.setOrigin(0.5, 1);
      this.cap.setPosition(b.field.x + b.field.w / 2, b.field.y + b.field.h - 6);
    } else {
      this.alice.setVisible(false);
      this.threat.setVisible(false);
      this.shadow.setVisible(false);
      this.cap.setText("");
      this.cap.setVisible(false);
    }
    const left = this.level.seconds * 60 - step;
    const warn = left <= 600 && left > 0 ? t("ten") : "";
    this.banner(this.ring, warn, b.field.x + b.field.w - 72, b.field.y + 8, 70);
    const bank = this.round.read();
    this.paintScore((this.carry || 0) + bank.score);
    const capShown = this.cap.visible ? this.cap.text : "";
    document.getElementById("live").textContent = (this.level.id || "lookout") + " " + ((this.carry || 0) + bank.score) + " " + Math.max(0, Math.ceil(left / 60)) + (capShown ? " " + capShown : "");
    if (this.endless && bank.pupsSafe < 6) { this.finish(); return; }
    if (step >= this.level.seconds * 60) {
      if (this.endless && bank.pupsSafe >= 6) this.nextWave();
      else this.finish();
    }
  }
}
