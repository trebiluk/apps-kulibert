import Sizer from "phaser3-rex-plugins/templates/ui/sizer/Sizer.js";
import { Round, keyCell } from "../../core/lookout-sim.js";
import { t, rtl, say } from "../i18n.js";
import { current, saveSave, seedsFor } from "../save.js";

const FRAME = { hawk: "hawk-glide-0", coyote: "coyote", snake: "snake-th", cloud: "cloud", rabbit: "rabbit", weed: "weed", wonder: "wonder-hop-0" };

export class Lookout extends window.Phaser.Scene {
  constructor() { super("Lookout"); }
  create(data) {
    this.level = data.level;
    this.round = new Round((Date.now() ^ 7) >>> 0, this.level, false);
    this.field = this.add.container(0, 0);
    this.grass = this.add.tileSprite(0, 0, 10, 10, "alice", "grass");
    this.field.add(this.grass);
    this.holes = [];
    for (let i = 0; i < (this.level.holes || 5); i++) {
      const hole = this.add.image(0, 0, "alice", "hole");
      this.holes.push(hole);
      this.field.add(hole);
    }
    this.nest = this.add.image(0, 0, "alice", "nest");
    this.pups = [];
    for (let i = 0; i < 6; i++) this.pups.push(this.add.sprite(0, 0, "alice", "pup-idle-0"));
    this.field.add(this.pups);
    this.field.add(this.nest);
    this.alice = this.add.sprite(0, 0, "alice", "alice-pop-0");
    this.threat = this.add.sprite(0, 0, "alice", "hawk-glide-0");
    this.field.add([this.alice, this.threat]);
    this.goal = this.add.text(0, 0, "", { fontFamily: "Atkinson Hyperlegible", fontSize: "16px", color: "#f8fafc", backgroundColor: "#0b1f3a" }).setPadding(6);
    this.readBtn = this.makeBtn("key-j", t("read"), 64, 48, () => say(this.goal.text));
    this.helpBtn = this.makeBtn("key-j", t("what"), 64, 48, () => window.dispatchEvent(new CustomEvent("ap-help")));
    this.pauseBtn = this.makeBtn("pause", t("pause"), 88, 48, () => this.pause());
    this.restartBtn = this.makeBtn("lock", t("restart"), 88, 48, () => window.dispatchEvent(new CustomEvent("ap-restart")));
    this.alarms = [
      this.makeBtn("btn-sky", t("sky"), 110, 96, () => this.alarm(0)),
      this.makeBtn("btn-ground", t("ground"), 110, 96, () => this.alarm(1)),
      this.makeBtn("btn-snake", t("snake"), 110, 96, () => this.alarm(2)),
    ];
    this.leftDock = new Sizer(this, 0, 0, 120, 200, { orientation: 1 });
    this.rightDock = new Sizer(this, 0, 0, 120, 200, { orientation: 1 });
    this.bottomDock = new Sizer(this, 0, 0, 300, 110, { orientation: 0 });
    this.scoreT = this.add.text(0, 0, "0", { fontFamily: "Atkinson Hyperlegible", fontSize: "20px", color: "#f8fafc" });
    this.ring = this.add.text(0, 0, "", { fontFamily: "Atkinson Hyperlegible", fontSize: "22px", color: "#fde68a" });
    this.prompt = this.add.text(0, 0, "", { fontFamily: "Atkinson Hyperlegible", fontSize: "18px", color: "#042f2e", backgroundColor: "#fde68a" }).setPadding(6).setVisible(false);
    this.input.keyboard.on("keydown", (e) => {
      if (e.key === "Escape" || e.key === "p" || e.key === "P") { this.togglePause(); return; }
      if (e.key === "r" || e.key === "R") { window.dispatchEvent(new CustomEvent("ap-restart")); return; }
      const cell = keyCell(e);
      if (cell >= 0) this.alarm(cell);
    });
    this.acc = 0;
    this.teach = !current.seen.teach;
    this.layout(this.scale.width, this.scale.height, rtl());
    this.scale.on("resize", (s) => this.layout(s.width, s.height, rtl()));
    document.body.classList.add("in-round");
    say(t("goalPups") + " · " + this.level.goalScore);
    if (this.teach) { this.round.pause(); this.prompt.setText(t("tapSky")).setVisible(true); say(t("tapSky")); }
  }
  makeBtn(frame, word, w, h, fn) {
    const Phaser = window.Phaser;
    const box = this.add.container(0, 0);
    const bg = this.add.rectangle(0, 0, w, h, 0x12314d).setStrokeStyle(3, 0x67e8f9);
    const icon = this.add.image(0, -12, "alice", frame).setDisplaySize(36, 36);
    const label = this.add.text(0, h / 2 - 16, word, { fontFamily: "Atkinson Hyperlegible", fontSize: "14px", color: "#f8fafc" }).setOrigin(0.5);
    const ring = this.add.rectangle(0, 0, w, h).setStrokeStyle(3, 0x22d3ee).setVisible(false);
    box.add([bg, icon, label, ring]);
    box.setSize(w, h);
    bg.setInteractive({ useHandCursor: true });
    bg.on("pointerdown", fn);
    bg.on("pointerover", () => ring.setVisible(true));
    bg.on("pointerout", () => ring.setVisible(false));
    box.setData("label", label);
    box.setData("word", word);
    box.setData("bg", bg);
    return box;
  }
  layout(w, h, isRtl) {
    const wide = w > h || w >= 900;
    const top = 72;
    const dock = 120;
    const narrow = w < 420;
    [this.pauseBtn, this.restartBtn, this.helpBtn, this.readBtn].concat(this.alarms).forEach((b) => {
      b.setSize(b.width, b.height);
      const label = b.getData("label");
      if (label) label.setVisible(!narrow);
    });
    this.goal.setText(t("goalPups") + " · " + this.level.goalScore);
    this.goal.setPosition(Math.max(64, w / 2 - this.goal.width / 2), 8);
    this.readBtn.setPosition(this.goal.x + this.goal.width + 36, 28);
    this.helpBtn.setPosition(this.readBtn.x + 70, 28);
    this.pauseBtn.setPosition(w - 56, 28);
    this.restartBtn.setPosition(w - 150, 28);
    const left = isRtl ? [this.alarms[2]] : [this.alarms[0], this.alarms[1]];
    const right = isRtl ? [this.alarms[0], this.alarms[1]] : [this.alarms[2]];
    const clear = (dock) => { this.alarms.forEach((b) => { try { dock.remove(b, false); } catch (e) {} }); };
    clear(this.leftDock); clear(this.rightDock); clear(this.bottomDock);
    if (wide) {
      left.forEach((b) => this.leftDock.add(b, { padding: { bottom: 8 } }));
      right.forEach((b) => this.rightDock.add(b, { padding: { bottom: 8 } }));
      this.leftDock.setPosition(dock / 2, top + (h - top) / 2).setMinSize(dock, h - top - 24);
      this.rightDock.setPosition(w - dock / 2, top + (h - top) / 2).setMinSize(dock, h - top - 24);
      this.leftDock.layout();
      this.rightDock.layout();
      this.bottomDock.setVisible(false);
      this.leftDock.setVisible(true);
      this.rightDock.setVisible(true);
      this.fieldX = dock; this.fieldW = w - dock * 2; this.fieldH = h - top - 16;
    } else {
      [this.alarms[0], this.alarms[1], this.alarms[2]].forEach((b) => this.bottomDock.add(b, { padding: { right: 6 } }));
      this.bottomDock.setPosition(w / 2, h - 60).setMinSize(w - 16, 110);
      this.bottomDock.layout();
      this.bottomDock.setVisible(true);
      this.leftDock.setVisible(false);
      this.rightDock.setVisible(false);
      this.fieldX = 8; this.fieldW = w - 16; this.fieldH = h - top - 120;
    }
    this.fieldY = top;
    this.grass.setPosition(this.fieldX + this.fieldW / 2, this.fieldY + this.fieldH / 2).setSize(this.fieldW, this.fieldH);
    this.holes.forEach((hole, i) => hole.setPosition(this.fieldX + (this.fieldW * (i + 1)) / (this.holes.length + 1), this.fieldY + this.fieldH * 0.46));
    this.nest.setPosition(this.fieldX + this.fieldW / 2, this.fieldY + this.fieldH * 0.78);
    this.pups.forEach((pup, i) => pup.setPosition(this.nest.x - 50 + i * 18, this.nest.y - 8));
    this.scoreT.setPosition(this.fieldX + 8, this.fieldY + 4);
    this.ring.setPosition(w / 2, this.fieldY + 8);
    this.prompt.setPosition(w / 2 - 80, this.fieldY + 36);
  }
  alarm(cell) {
    if (!this.round || this.round.state !== "running") {
      if (this.teach && cell === 0) { this.teach = false; current.seen.teach = true; saveSave(); this.round.resume(); this.prompt.setVisible(false); }
      else return;
    }
    const before = this.round.read();
    this.round.alarm(cell);
    const after = this.round.read();
    if (after.why && after.why !== before.why) say(t(after.why));
    if (after.pupsSafe < before.pupsSafe) {
      const i = 5 - after.pupsSafe;
      if (this.pups[i]) this.pups[i].setFrame("pup-hide");
      say(t("pupScared"));
    }
    this.scoreT.setText(String(after.score));
  }
  pause() { this.round.pause(); window.dispatchEvent(new CustomEvent("ap-pause")); }
  togglePause() { if (this.round.state === "paused") this.resumeRound(); else this.pause(); }
  resumeRound() { this.round.resume(); }
  restart() { this.scene.restart({ level: this.level }); }
  update(_t, dt) {
    if (!this.round || this.round.state !== "running") return;
    this.acc += dt;
    while (this.acc >= 1000 / 60) { this.round.advance(); this.acc -= 1000 / 60; }
    const step = this.round.step;
    const active = this.round.spawns.find((s) => step >= s.step && step <= s.step + s.approachSteps);
    if (active) {
      const p = (step - active.step) / active.approachSteps;
      const hole = this.holes[active.hole] || this.holes[0];
      this.alice.setPosition(hole.x, hole.y - 36);
      const sx = this.fieldX + 20 + active.edge * (this.fieldW / 2);
      this.threat.setFrame(FRAME[active.kind] || "hawk-glide-0");
      this.threat.setPosition(sx + (this.nest.x - sx) * p, this.fieldY + 16 + (this.nest.y - this.fieldY) * p);
    }
    const left = this.level.seconds * 60 - step;
    this.ring.setText(left <= 600 ? t("ten") : "");
    this.scoreT.setText(String(this.round.read().score));
    if (step >= this.level.seconds * 60) {
      this.round.state = "ended";
      const bank = this.round.read();
      const pay = seedsFor(bank.score, bank.stars);
      current.seeds = (current.seeds || 0) + pay;
      current.best[this.level.id] = { score: Math.max(bank.score, (current.best[this.level.id] || {}).score || 0), stars: Math.max(bank.stars, (current.best[this.level.id] || {}).stars || 0), cleared: bank.cleared || (current.best[this.level.id] || {}).cleared };
      saveSave();
      window.dispatchEvent(new CustomEvent("ap-end", { detail: Object.assign(bank, { pay, why: bank.why }) }));
    }
  }
}
