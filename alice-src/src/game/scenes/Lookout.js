import { Round, keyCell } from "../../core/lookout-sim.js";
import { t, rtl, say } from "../i18n.js";
import { current, loadSave, saveSave, saveNow, seedsFor, settings, pushBoard } from "../save.js";
import { skyOf } from "../looks.js";
import { endlessLevel, titleKey } from "../modes.js";
import { createPrairie, weatherFor } from "../world.js";
import { poseOf, frameOf } from "../actors.js";
import { bands, poseNow } from "../ui/bands.js";
import { fitButton, intScale, makeButton } from "../ui/widgets.js";
import { aliceDuck, alicePop, burst, lite, markGesture, motionOff, noteFrame, puff, punch, rideWeed, shake, sound, takeSteps, tickBits, tickDust } from "../fx.js";

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
    this.cameras.main.setScroll(0, 0);
    this.bootRound();
    this.weather = weatherFor(this.level);
    this.holes = [];
    for (let i = 0; i < (this.level.holes || 5); i++) this.holes.push(this.add.image(0, 0, "lookout", "hole").setDepth(2).setScrollFactor(1));
    this.nest = this.add.image(0, 0, "lookout", "mound").setDepth(2).setScrollFactor(1);
    this.pups = [];
    for (let i = 0; i < 6; i++) this.pups.push(this.add.sprite(0, 0, "lookout", "pup-idle-0").play("pup-idle").setDepth(3).setScrollFactor(1));
    this.alice = this.add.sprite(-200, -200, "lookout", "alice-pop-0").setVisible(false).setDepth(5).setScrollFactor(1);
    this.threat = this.add.sprite(-200, -200, "lookout", "hawk-flap-0").setVisible(false).setDepth(6).setScrollFactor(1);
    this.shadow = this.add.image(-200, -200, "lookout", "hawk-shadow").setVisible(false).setDepth(1).setScrollFactor(1);
    this.bits = [];
    const bitN = lite() ? 12 : 18;
    for (let i = 0; i < bitN; i++) this.bits.push(this.add.image(0, 0, "lookout", "star").setVisible(false).setDepth(7).setScrollFactor(1));
    this.dust = [];
    for (let i = 0; i < 6; i++) this.dust.push(this.add.image(0, 0, "lookout", "dust").setVisible(false).setDepth(6).setScrollFactor(1));
    this.capIcon = this.add.image(-200, -200, "lookout", "hawk-flap-0").setVisible(false).setDepth(9).setScrollFactor(1);
    this.prairie = createPrairie(this);
    this.physics.add.existing(this.threat);
    this.threat.body.setAllowGravity(false);
    this.threat.body.enable = false;
    this.threat.body.setBounce(0.72);
    this.weedGround = this.prairie.groundLine;
    if (!this.weedGround) {
      this.weedGround = this.add.rectangle(0, 0, 8, 8, 0x000000, 0).setVisible(false).setDepth(1);
      this.physics.add.existing(this.weedGround, true);
    }
    this.physics.add.collider(this.threat, this.weedGround);
    if (this.physics.world) this.physics.world.gravity.y = 860;
    this.actorStat = { kind: "", p: "", cap: "", icon: "", pop: "hide", tx: "", ty: "", sh: "" };
    this.dustLive = 0;
    this.weedPose = null;
    this.spawnId = "";
    this.duckFrom = 0;
    this.duckHole = null;
    this.puffed = false;
    this.sys.events.on("postupdate", () => {
      const pose = this.weedPose;
      if (!pose || !this.threat) return;
      this.threat.setPosition(Math.round(pose.x), Math.round(pose.y));
      this.threat.setRotation(motionOff() ? 0 : (pose.rot || 0));
      const body = this.threat.body;
      if (body && body.enable) {
        body.x = pose.x - (body.halfWidth || 1);
        body.y = pose.y - (body.halfHeight || 1);
      }
    });
    this.goal = this.add.text(0, 0, "", { fontFamily: "Atkinson Hyperlegible", fontSize: "16px", color: "#042f2e", align: "left" }).setDepth(8).setVisible(false).setScrollFactor(0);
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
      if (document.body.classList.contains("ap-card")) {
        if (e.key === "Escape") return;
        if (e.key === "p" || e.key === "P") { this.togglePause(); return; }
        if (e.key === "r" || e.key === "R") { window.dispatchEvent(new CustomEvent("ap-restart")); return; }
        return;
      }
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
    this.cardHeld = false;
    this.teach = this.playMode === "class" && this.level && this.level.id === "lookout-L01" && !current.seen.teach;
    this.onResize = (s) => { if (this.scene.isActive()) this.layout(s.width, s.height); };
    this.onLook = () => {
      if (!this.scene.isActive()) return;
      this.cameras.main.setBackgroundColor(skyOf(settings().look));
      if (this.prairie && this.band) this.prairie.layout(this.scale.width, this.scale.height, this.band.field, this.holes, this.weather, this.salt());
    };
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
    if (this.cardHeld) return;
    if (this.hidePaused && this.round && this.round.state === "paused") this.round.resume();
    this.hidePaused = false;
  }
  holdForCard() {
    if (this.cardHeld || !this.round || this.round.state !== "running") return;
    this.round.pause();
    this.cardHeld = true;
    this.acc = 0;
  }
  releaseForCard() {
    if (!this.cardHeld) return;
    this.cardHeld = false;
    this.acc = 0;
    if (this.hideHeld) {
      this.hidePaused = !!(this.round && this.round.state === "paused");
      return;
    }
    if (this.round && this.round.state === "paused") this.round.resume();
  }
  salt() {
    const id = (this.level && this.level.id) || "lookout";
    let h = 2166136261;
    for (let i = 0; i < id.length; i++) h = Math.imul(h ^ id.charCodeAt(i), 16777619);
    return h >>> 0;
  }
  bootRound() {
    this.round = new Round((this.seed ^ this.wave) >>> 0, this.level, settings().speed === "relaxed");
    this.weather = weatherFor(this.level);
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
    const flip = rtl();
    const centered = node === this.cap;
    node.setVisible(true);
    node.setBackgroundColor("#fde68a");
    node.setColor("#042f2e");
    node.setPadding(4, 2, 4, 2);
    node.setStyle({
      fontFamily: "Atkinson Hyperlegible",
      fontSize: centered || node === this.ring ? "18px" : "16px",
      color: "#042f2e",
      align: centered ? "center" : (flip ? "right" : "left"),
      rtl: flip,
    });
    if (wrap) node.setWordWrapWidth(wrap);
    node.setText(str);
    if (!centered) {
      node.setOrigin(0, 0);
      node.setPosition(x, y);
    }
    const live = document.getElementById("live");
    if (live) live.dataset.rtl = flip ? "1" : "0";
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
    if (this.prairie) this.prairie.layout(w, h, b.field, this.holes, this.weather, this.salt());
    const groundY = (this.prairie && this.prairie.groundY) || Math.round(b.field.y + b.field.h * 0.82);
    if (this.weedGround && (!this.prairie || this.weedGround !== this.prairie.groundLine)) {
      this.weedGround.setPosition(b.field.x + b.field.w / 2, groundY);
      this.weedGround.setSize(Math.max(8, b.field.w), 14);
      if (this.weedGround.refreshBody) this.weedGround.refreshBody();
    }
    this.ring.setScrollFactor(0);
    this.digits.forEach((d) => intScale(d, 22));
    this.paintScore((this.carry || 0) + (this.round ? this.round.read().score : 0));
    if (this.prompt.visible) this.banner(this.prompt, this.prompt.text, b.field.x + 8, b.field.y + 28, Math.max(80, b.field.w - 16));
    this.banner(this.cap, this.cap.visible ? this.cap.text : "", b.field.x + b.field.w / 2 - 80, b.field.y + b.field.h - 36, Math.max(80, b.field.w - 24));
    this.publish();
  }
  boxOf(sprite) {
    if (!sprite || !sprite.visible || !sprite.getBounds) return "";
    const b = sprite.getBounds();
    const cam = this.cameras.main;
    return [Math.round(b.x - cam.scrollX), Math.round(b.y - cam.scrollY), Math.round(b.width), Math.round(b.height)].join(",");
  }
  publish(live) {
    const node = live || document.getElementById("live");
    if (!node) return;
    let parts = this.prairie ? this.prairie.parts() : 0;
    (this.bits || []).forEach((bit) => { if (bit.visible) parts += 1; });
    (this.dust || []).forEach((bit) => { if (bit.visible) parts += 1; });
    const stat = this.actorStat || {};
    node.dataset.weather = this.weather || "";
    node.dataset.objs = String(this.children.list.length);
    node.dataset.parts = String(parts);
    node.dataset.layers = String(this.prairie ? this.prairie.layers() : 0);
    node.dataset.renderer = this.game && this.game.renderer && this.game.renderer.type === 2 ? "webgl" : "canvas";
    node.dataset.mask = [this.boxOf(this.threat), this.boxOf(this.alice), this.boxOf(this.shadow), this.boxOf(this.cap)].filter(Boolean).join(";");
    node.dataset.kind = stat.kind || "";
    node.dataset.p = stat.p || "";
    node.dataset.cap = stat.cap || "";
    node.dataset.icon = stat.icon || "";
    node.dataset.pop = stat.pop || "";
    node.dataset.tx = stat.tx || "";
    node.dataset.ty = stat.ty || "";
    node.dataset.sh = stat.sh || "";
    node.dataset.sid = stat.sid || "";
    node.dataset.seed = String(this.seed == null ? "" : this.seed);
    const now = typeof performance !== "undefined" ? performance.now() : 0;
    if (!this.fpsClock) this.fpsClock = { n: 0, t: now };
    this.fpsClock.n += 1;
    if (now - this.fpsClock.t >= 1000) {
      node.dataset.fps = String(Math.round(this.fpsClock.n * 1000 / (now - this.fpsClock.t)));
      this.fpsClock.n = 0;
      this.fpsClock.t = now;
    }
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
  parkThreat() {
    this.weedPose = null;
    this.threat.setVisible(false);
    this.threat.setRotation(0);
    this.shadow.setVisible(false);
    const body = this.threat.body;
    if (body) {
      body.enable = false;
      body.allowGravity = false;
      body.setVelocity(0, 0);
      if (body.setAngularVelocity) body.setAngularVelocity(0);
    }
  }
  applyThreat(pose, kind, locked) {
    const sprite = this.threat;
    const frame = frameOf(pose, locked);
    if (frame) {
      if (sprite.anims && sprite.anims.isPlaying) sprite.anims.stop();
      sprite.setFrame(frame);
    }
    const target = kind === "snake" ? 72 : kind === "cloud" ? 56 : kind === "wonder" ? 52 : 64;
    intScale(sprite, target);
    sprite.setVisible(!!pose.show);
    sprite.setDepth(pose.depth || 6);
    sprite.setFlipX(!!pose.flip);
    sprite.setAlpha(1);
    if (pose.crop && sprite.frame) {
      const fr = sprite.frame;
      sprite.setCrop(0, 0, fr.width, Math.max(1, Math.floor(fr.height * pose.crop)));
    } else if (sprite.setCrop) sprite.setCrop();
    if (pose.weed) {
      this.weedPose = pose;
      rideWeed(sprite, pose, !locked);
    } else {
      this.weedPose = null;
      sprite.setData("weedPrev", null);
      if (sprite.body) {
        sprite.body.enable = false;
        sprite.body.allowGravity = false;
        sprite.body.setVelocity(0, 0);
        if (sprite.body.setAngularVelocity) sprite.body.setAngularVelocity(0);
      }
      sprite.setRotation(locked ? 0 : (pose.rot || 0));
      sprite.setPosition(Math.round(pose.x), Math.round(pose.y));
    }
    if (pose.shadow) {
      this.shadow.setVisible(true);
      this.shadow.setFrame(pose.shadowFrame || "hawk-shadow");
      intScale(this.shadow, pose.shadowPx || 48);
      this.shadow.setPosition(Math.round(pose.shadowX), Math.round(pose.shadowY));
      this.shadow.setAlpha(pose.shadowAlpha == null ? 0.9 : pose.shadowAlpha);
      this.shadow.setDepth(1);
    } else this.shadow.setVisible(false);
    if (pose.dust && !locked) puff(this, pose.x, pose.y + 6, 1);
  }
  placeAlice(hole, pose, step, active) {
    const off = motionOff();
    const elapsed = (step - active.step) * (1000 / 60);
    const pop = alicePop(elapsed, off);
    const base = intScale(this.alice, 48);
    this.alice.setVisible(true);
    this.alice.setDepth(5);
    this.alice.setScale(base * pop.sx, base * pop.sy);
    this.alice.setPosition(Math.round(hole.x), Math.round(hole.y - 28 * pop.rise));
    this.alice.setFlipX(pose.x < hole.x);
    let frame = "alice-look-0";
    if (!off && pop.phase === "squash") frame = "alice-pop-0";
    else if (!off && pop.phase === "stretch") frame = "alice-pop-1";
    else if (!off && pop.phase === "settle") frame = "alice-pop-2";
    if (this.alice.anims && this.alice.anims.isPlaying) this.alice.anims.stop();
    this.alice.setFrame(frame);
    if (!this.puffed && !off && pop.phase === "squash") {
      puff(this, hole.x, hole.y - 4, 4);
      this.puffed = true;
    }
    this.actorStat.pop = off ? "settle" : pop.phase;
    this.duckHole = hole;
  }
  duckAlice(step) {
    const off = motionOff();
    if (!this.duckFrom) this.duckFrom = step;
    const duck = aliceDuck((step - this.duckFrom) * (1000 / 60), off);
    if (duck.phase === "hide") {
      this.alice.setVisible(false);
      this.actorStat.pop = "hide";
      return;
    }
    const hole = this.duckHole || { x: this.alice.x, y: this.alice.y + 28 };
    const base = intScale(this.alice, 48);
    this.alice.setVisible(true);
    this.alice.setScale(base * duck.sx, base * duck.sy);
    this.alice.setPosition(Math.round(hole.x), Math.round(hole.y - 28 * (1 - duck.drop)));
    if (this.alice.anims && this.alice.anims.isPlaying) this.alice.anims.stop();
    this.alice.setFrame(duck.frame);
    this.actorStat.pop = "duck";
  }
  placeCaption(kind) {
    const cap = settings().captions ? t(CAP[kind] || "capHawk") : "";
    const b = this.band;
    this.banner(this.cap, cap, b.field.x + 8, b.field.y + b.field.h - 8, Math.max(80, b.field.w - 16));
    this.cap.setOrigin(0.5, 1);
    this.cap.setPosition(b.field.x + b.field.w / 2, b.field.y + b.field.h - 6);
    const icon = STILL[kind] || "hawk-flap-0";
    if (cap) {
      intScale(this.capIcon, 32);
      this.capIcon.setFrame(icon);
      this.capIcon.setVisible(true);
      this.capIcon.setPosition(Math.round(this.cap.x), Math.round(this.cap.y - (this.cap.height || 18) - 16));
    } else this.capIcon.setVisible(false);
    this.actorStat.cap = cap;
    this.actorStat.icon = cap ? icon : "";
  }
  update() {
    tickBits(this);
    if (typeof document !== "undefined" && document.visibilityState === "hidden") this.holdHide();
    if (!this.round || this.ended) return;
    const liveNow = document.getElementById("live");
    if (liveNow) liveNow.dataset.step = String(this.round.step);
    if (this.hideHeld || this.round.state !== "running") return;
    this.dustLive = tickDust(this);
    const raw = this.game && this.game.loop ? this.game.loop.rawDelta : 16;
    noteFrame(raw);
    const taken = takeSteps(raw, this.acc);
    this.acc = taken.acc;
    for (let i = 0; i < taken.steps; i++) this.round.advance();
    const step = this.round.step;
    const active = this.round.spawns.find((s) => step >= s.step && step <= s.step + s.approachSteps);
    const b = this.band;
    const holeNow = active ? (this.holes[active.hole] || this.holes[0]) : null;
    if (this.prairie) this.prairie.tick(holeNow);
    if (motionOff()) {
      this.pups.forEach((pup) => {
        if (!pup.getData("held") && pup.frame) pup.setData("held", pup.frame.name);
        const held = pup.getData("held");
        if (held) pup.setFrame(held);
      });
    }
    if (active && holeNow) {
      const p = (step - active.step) / Math.max(1, active.approachSteps);
      const groundY = (this.prairie && this.prairie.groundY) || Math.round(b.field.y + b.field.h * 0.82);
      const pose = poseOf(active.kind, p, { field: b.field, nest: this.nest, hole: holeNow, groundY, edge: active.edge });
      const id = active.step + ":" + active.kind;
      if (this.spawnId !== id) {
        this.spawnId = id;
        this.puffed = false;
        this.duckFrom = 0;
        this.threat.setData("weedPrev", null);
      }
      this.placeAlice(holeNow, pose, step, active);
      this.applyThreat(pose, active.kind, motionOff());
      this.placeCaption(active.kind);
      this.actorStat.kind = active.kind;
      this.actorStat.p = p.toFixed(3);
      this.actorStat.tx = String(Math.round(pose.x));
      this.actorStat.ty = String(Math.round(pose.y));
      this.actorStat.sh = pose.shadow ? (pose.shadowFrame || "hawk-shadow") : "";
      this.actorStat.sid = String(active.step);
    } else {
      this.parkThreat();
      this.duckAlice(step);
      this.cap.setText("");
      this.cap.setVisible(false);
      this.capIcon.setVisible(false);
      this.actorStat.kind = "";
      this.actorStat.p = "";
      this.actorStat.cap = "";
      this.actorStat.icon = "";
      this.actorStat.tx = "";
      this.actorStat.ty = "";
      this.actorStat.sh = "";
      this.actorStat.sid = "";
    }
    const left = this.level.seconds * 60 - step;
    const warn = left <= 600 && left > 0 ? t("ten") : "";
    this.banner(this.ring, warn, b.field.x + b.field.w - 72, b.field.y + 8, 70);
    const bank = this.round.read();
    this.paintScore((this.carry || 0) + bank.score);
    const capShown = this.cap.visible ? this.cap.text : "";
    const live = document.getElementById("live");
    if (live) {
      live.dataset.step = String(this.round.step);
      live.dataset.why = bank.why || "";
      live.dataset.score = String((this.carry || 0) + bank.score);
      live.dataset.pups = String(bank.pupsSafe);
      if (this.alice.visible && this.alice.frame) live.dataset.frame = this.alice.frame.name;
      this.publish(live);
      if (!document.body.classList.contains("ap-card")) {
        live.textContent = (this.level.id || "lookout") + " " + ((this.carry || 0) + bank.score) + " " + Math.max(0, Math.ceil(left / 60)) + (capShown ? " " + capShown : "");
      }
    }
    if (this.endless && bank.pupsSafe < 6) { this.finish(); return; }
    if (step >= this.level.seconds * 60) {
      if (this.endless && bank.pupsSafe >= 6) this.nextWave();
      else this.finish();
    }
  }
}
