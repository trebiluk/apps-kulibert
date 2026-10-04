import Sizer from "phaser3-rex-plugins/templates/ui/sizer/Sizer.js";
import level from "../../levels/lookout.json";
import { Round, keyCell } from "../../core/lookout-sim.js";
import { t, rtl, say } from "../i18n.js";

export class Lookout extends window.Phaser.Scene {
  constructor() { super("Lookout"); }
  create() {
    const Phaser = window.Phaser;
    this.round = new Round((Date.now() ^ 42) >>> 0, level, false);
    this.field = this.add.container(0, 0);
    this.grass = this.add.tileSprite(0, 0, 10, 10, "alice", "grass");
    this.field.add(this.grass);
    this.holes = [];
    for (let i = 0; i < 5; i++) {
      const hole = this.add.image(0, 0, "alice", "hole");
      this.holes.push(hole);
      this.field.add(hole);
    }
    this.nest = this.add.image(0, 0, "alice", "nest");
    this.pups = [];
    for (let i = 0; i < 6; i++) {
      const pup = this.add.sprite(0, 0, "alice", "pup-idle-0").play("pup-idle");
      this.pups.push(pup);
      this.field.add(pup);
    }
    this.field.add(this.nest);
    this.alice = this.add.sprite(0, 0, "alice", "alice-pop-0");
    this.shadow = this.add.image(0, 0, "alice", "hawk-shadow");
    this.hawk = this.add.sprite(0, 0, "alice", "hawk-glide-0").play("hawk-glide");
    this.field.add([this.alice, this.shadow, this.hawk]);
    this.goal = this.add.text(0, 0, t("scoreGoal"), { fontFamily: "Atkinson Hyperlegible", fontSize: "20px", color: "#f8fafc", backgroundColor: "#0b1f3a" }).setPadding(8);
    this.scoreT = this.add.text(0, 0, "0", { fontFamily: "Atkinson Hyperlegible", fontSize: "22px", color: "#f8fafc" });
    this.comboT = this.add.text(0, 0, "×0", { fontFamily: "Atkinson Hyperlegible", fontSize: "22px", color: "#7dd3fc" });
    this.pauseBtn = this.makeBtn("pause", t("pause"), 88, 56, () => this.pause());
    this.alarms = [
      this.makeBtn("btn-sky", t("sky"), 120, 96, () => this.alarm(0)),
      this.makeBtn("btn-ground", t("ground"), 120, 96, () => this.alarm(1)),
      this.makeBtn("btn-snake", t("snake"), 120, 96, () => this.alarm(2)),
    ];
    this.dust = this.add.particles(0, 0, "alice", { frame: "grass", lifespan: 400, speed: { min: 20, max: 60 }, scale: { start: 0.2, end: 0 }, quantity: 1, frequency: 180, emitting: false });
    this.keys = this.input.keyboard.on("keydown", (e) => {
      if (e.key === "Escape" || e.key === "p" || e.key === "P") { this.pause(); return; }
      const cell = keyCell(e);
      if (cell >= 0) this.alarm(cell);
    });
    this.acc = 0;
    this.last = 0;
    this.layout(this.scale.width, this.scale.height, rtl());
    this.scale.on("resize", (s) => this.layout(s.width, s.height, rtl()));
    document.body.classList.add("in-round");
    say(t("scoreGoal"));
    this.reduce = document.documentElement.getAttribute("data-kp-motion") === "less";
  }
  makeBtn(frame, word, w, h, fn) {
    const Phaser = window.Phaser;
    const box = this.add.container(0, 0);
    const icon = this.add.image(0, -10, "alice", frame).setDisplaySize(Math.min(w - 8, 72), Math.min(h - 28, 56));
    const label = this.add.text(0, h / 2 - 16, word, { fontFamily: "Atkinson Hyperlegible", fontSize: "16px", color: "#f8fafc" }).setOrigin(0.5);
    const ring = this.add.rectangle(0, 0, w, h).setStrokeStyle(3, 0x22d3ee).setVisible(false);
    box.add([icon, label, ring]);
    box.setSize(w, h);
    box.setInteractive(new Phaser.Geom.Rectangle(-w / 2, -h / 2, w, h), Phaser.Geom.Rectangle.Contains);
    box.on("pointerdown", fn);
    box.on("pointerover", () => ring.setVisible(true));
    box.on("pointerout", () => ring.setVisible(false));
    box.setData("label", label);
    box.setData("ring", ring);
    return box;
  }
  layout(w, h, isRtl) {
    const wide = w > h || w >= 900;
    const top = 64;
    const dock = 128;
    this.goal.setText(t("scoreGoal"));
    this.goal.setPosition(w / 2 - this.goal.width / 2, top);
    this.pauseBtn.setPosition(isRtl ? 70 : w - 70, top + 8);
    this.pauseBtn.getData("label").setText(t("pause"));
    const detach = (dock) => {
      if (!dock) return;
      this.alarms.forEach((b) => { try { dock.remove(b, false); } catch (e) {} });
      dock.destroy();
    };
    detach(this.leftDock);
    detach(this.rightDock);
    const left = isRtl ? [this.alarms[2]] : [this.alarms[0], this.alarms[1]];
    const right = isRtl ? [this.alarms[0], this.alarms[1]] : [this.alarms[2]];
    if (wide) {
      this.leftDock = new Sizer(this, dock / 2, h / 2, dock, h - top - 16, { orientation: 1 });
      left.forEach((b) => this.leftDock.add(b, { padding: { bottom: 8 } }));
      this.rightDock = new Sizer(this, w - dock / 2, h / 2, dock, h - top - 16, { orientation: 1 });
      right.forEach((b) => this.rightDock.add(b, { padding: { bottom: 8 } }));
      this.leftDock.layout();
      this.rightDock.layout();
      this.fieldX = dock;
      this.fieldW = w - dock * 2;
    } else {
      this.leftDock = new Sizer(this, w / 2, h - 70, w - 16, 110, { orientation: 0 });
      [this.alarms[0], this.alarms[1], this.alarms[2]].forEach((b) => this.leftDock.add(b, { padding: { right: 8 } }));
      this.leftDock.layout();
      this.rightDock = null;
      this.fieldX = 8;
      this.fieldW = w - 16;
    }
    this.fieldY = top + 36;
    this.fieldH = wide ? h - this.fieldY - 16 : h - this.fieldY - 120;
    this.grass.setPosition(this.fieldX + this.fieldW / 2, this.fieldY + this.fieldH / 2);
    this.grass.setSize(this.fieldW, this.fieldH);
    this.holes.forEach((hole, i) => hole.setPosition(this.fieldX + (this.fieldW * (i + 1)) / 6, this.fieldY + this.fieldH * 0.45));
    this.nest.setPosition(this.fieldX + this.fieldW / 2, this.fieldY + this.fieldH * 0.78);
    this.pups.forEach((pup, i) => pup.setPosition(this.nest.x - 50 + i * 18, this.nest.y - 8));
    this.scoreT.setPosition(this.fieldX + 8, this.fieldY + 4);
    this.comboT.setPosition(this.fieldX + this.fieldW - 48, this.fieldY + 4);
    const words = [t("sky"), t("ground"), t("snake")];
    this.alarms.forEach((b, i) => b.getData("label").setText(words[i]));
    this.registry.set("fieldShare", this.fieldH / Math.max(1, h - top));
  }
  alarm(cell) {
    if (!this.round || this.round.state !== "running") return;
    const before = this.round.read();
    this.round.alarm(cell);
    const after = this.round.read();
    if (cell === 0) {
      this.playSfx("chirp");
      this.tweens.add({ targets: this.hawk, y: this.hawk.y - 40, duration: this.reduce ? 0 : 280 });
    } else {
      this.playSfx("miss");
      say(cell === 1 ? t("reasonGround") : t("reasonSnake"));
      this.pups.forEach((p, i) => this.tweens.add({ targets: p, x: p.x + (i - 2.5) * 8, duration: 180, yoyo: true }));
    }
    if (after.pupsSafe < before.pupsSafe) {
      const i = 5 - after.pupsSafe;
      if (this.pups[i]) this.pups[i].setFrame("pup-hide");
      say(t("pupScared"));
      this.playSfx("miss");
    }
    this.paintHud();
  }
  playSfx(name) {
    try { if (document.documentElement.getAttribute("data-kp-sound") !== "0") this.sound.playAudioSprite("sfx", name); } catch (e) {}
  }
  paintHud() {
    const bank = this.round.read();
    this.scoreT.setText(String(bank.score));
    this.comboT.setText("×" + bank.combo);
  }
  pause() {
    this.round.pause();
    window.dispatchEvent(new CustomEvent("ap-pause"));
  }
  resumeRound() { this.round.resume(); }
  update(_t, dt) {
    if (!this.round || this.round.state !== "running") return;
    this.acc += dt;
    while (this.acc >= 1000 / 60) {
      this.round.advance();
      this.acc -= 1000 / 60;
    }
    const step = this.round.step;
    const active = this.round.spawns.find((s) => step >= s.step && step <= s.step + s.approachSteps);
    if (active) {
      const p = (step - active.step) / active.approachSteps;
      const hole = this.holes[active.hole];
      this.alice.setPosition(hole.x, hole.y - 40);
      if (!this.reduce) this.alice.setFrame(step % 20 < 10 ? "alice-pop-0" : "alice-pop-1");
      const edges = [this.fieldX + 30, this.fieldX + this.fieldW / 2, this.fieldX + this.fieldW - 30];
      const sx = edges[active.edge];
      const sy = this.fieldY + 20;
      this.hawk.setPosition(sx + (this.nest.x - sx) * p, sy + (this.nest.y - sy) * p);
      this.shadow.setPosition(this.hawk.x, this.hawk.y + 18);
      if (!this.reduce) this.dust.emitParticleAt(this.hawk.x, this.hawk.y, 1);
    }
    this.paintHud();
    if (step >= level.seconds * 60) {
      this.round.state = "ended";
      this.playSfx("cheer");
      const bank = this.round.read();
      say(bank.cleared ? t("kindLine") : t("missLine"));
      window.dispatchEvent(new CustomEvent("ap-end", { detail: bank }));
    }
  }
}
