import { Round, keyCell } from "../../core/lookout-sim.js";
import { t, rtl, say } from "../i18n.js";
import { current, loadSave, saveSave, saveNow, seedsFor } from "../save.js";

const FRAME = { hawk: "hawk-glide-0", coyote: "coyote", snake: "snake-th", cloud: "cloud", rabbit: "rabbit", weed: "weed", wonder: "wonder-hop-0" };

export class Lookout extends window.Phaser.Scene {
  constructor() { super("Lookout"); }
  init(data) { this.level = data.level; }
  create() {
    loadSave();
    this.round = new Round((Date.now() ^ 7) >>> 0, this.level, false);
    this.grass = this.add.tileSprite(0, 0, 10, 10, "alice", "grass");
    this.holes = [];
    for (let i = 0; i < (this.level.holes || 5); i++) this.holes.push(this.add.image(0, 0, "alice", "hole"));
    this.nest = this.add.image(0, 0, "alice", "nest");
    this.pups = [];
    for (let i = 0; i < 6; i++) this.pups.push(this.add.image(0, 0, "alice", "pup-idle-0"));
    this.alice = this.add.sprite(0, 0, "alice", "alice-pop-0");
    this.threat = this.add.sprite(0, 0, "alice", "hawk-glide-0");
    this.goal = this.add.text(0, 0, "", { fontFamily: "Atkinson Hyperlegible", fontSize: "16px", color: "#042f2e", backgroundColor: "#fde68a" }).setPadding(6, 4, 6, 4);
    this.readBtn = this.makeBtn("key-j", t("read"), 64, 48, () => say(this.goal.text));
    this.helpBtn = this.makeBtn("key-j", t("what"), 64, 48, () => window.dispatchEvent(new CustomEvent("ap-help")));
    this.pauseBtn = this.makeBtn("pause", t("pause"), 96, 48, () => this.pause());
    this.restartBtn = this.makeBtn("lock", t("restart"), 96, 48, () => window.dispatchEvent(new CustomEvent("ap-restart")));
    this.alarms = [
      this.makeBtn("btn-sky", t("sky"), 120, 72, () => this.alarm(0)),
      this.makeBtn("btn-ground", t("ground"), 120, 72, () => this.alarm(1)),
      this.makeBtn("btn-snake", t("snake"), 120, 72, () => this.alarm(2)),
    ];
    this.scoreT = this.add.text(0, 0, "0", { fontFamily: "Atkinson Hyperlegible", fontSize: "22px", color: "#f8fafc", backgroundColor: "#0b1f3a" }).setPadding(6, 2, 6, 2);
    this.ring = this.add.text(0, 0, "", { fontFamily: "Atkinson Hyperlegible", fontSize: "22px", color: "#042f2e", backgroundColor: "#fde68a" }).setPadding(6, 2, 6, 2);
    this.prompt = this.add.text(0, 0, "", { fontFamily: "Atkinson Hyperlegible", fontSize: "18px", color: "#042f2e", backgroundColor: "#fde68a" }).setPadding(8, 6, 8, 6).setVisible(false);
    this.input.keyboard.on("keydown", (e) => {
      if (e.key === "Escape" || e.key === "p" || e.key === "P") { this.togglePause(); return; }
      if (e.key === "r" || e.key === "R") { window.dispatchEvent(new CustomEvent("ap-restart")); return; }
      const cell = keyCell(e);
      if (cell >= 0) this.alarm(cell);
    });
    this.acc = 0;
    this.ended = false;
    this.teach = !current.seen.teach;
    this.onResize = (s) => { if (this.scene.isActive()) this.layout(s.width, s.height); };
    this.layout(this.scale.width, this.scale.height);
    this.scale.on("resize", this.onResize);
    this.events.on("shutdown", () => this.scale.off("resize", this.onResize));
    document.body.classList.add("in-round");
    say(t("goalPups") + " · " + this.level.goalScore);
    if (this.teach) {
      this.round.pause();
      this.prompt.setText(t("tapSky")).setVisible(true);
      say(t("tapSky"));
    }
  }
  makeBtn(frame, word, w, h, fn) {
    const Phaser = window.Phaser;
    const box = this.add.container(0, 0);
    const bg = this.add.rectangle(0, 0, w, h, 0x0b1f3a).setStrokeStyle(3, 0xfde68a);
    const icon = this.add.image(-8, 0, "alice", frame).setDisplaySize(36, 36);
    const label = this.add.text(16, 0, word, { fontFamily: "Atkinson Hyperlegible", fontSize: "16px", color: "#f8fafc" }).setOrigin(0, 0.5);
    box.add([bg, icon, label]);
    box.setSize(w, h);
    bg.setInteractive(new Phaser.Geom.Rectangle(-w / 2, -h / 2, w, h), Phaser.Geom.Rectangle.Contains);
    bg.on("pointerdown", fn);
    box.setData("label", label);
    box.setData("word", word);
    return box;
  }
  layout(w, h) {
    const wide = w > h;
    const top = 78;
    const narrow = w < 420;
    [this.pauseBtn, this.restartBtn, this.helpBtn, this.readBtn].concat(this.alarms).forEach((b) => {
      const label = b.getData("label");
      if (label) label.setVisible(!narrow);
    });
    this.goal.setText(t("goalPups") + " · " + this.level.goalScore);
    this.goal.setPosition(72, 8);
    this.readBtn.setPosition(Math.min(w - 230, 72 + this.goal.width + 40), 30);
    this.helpBtn.setPosition(this.readBtn.x + 70, 30);
    this.pauseBtn.setPosition(w - 58, 30);
    this.restartBtn.setPosition(w - 58, 88);
    this.pauseBtn.setDepth(8);
    this.restartBtn.setDepth(8);
    const dock = 90;
    if (wide) {
      const side = rtl() ? [2, 1, 0] : [0, 1, 2];
      this.alarms[side[0]].setPosition(dock / 2 + 8, top + 70);
      this.alarms[side[1]].setPosition(dock / 2 + 8, top + 160);
      this.alarms[side[2]].setPosition(w - dock / 2 - 8, top + 110);
      this.fieldX = dock + 8;
      this.fieldW = w - dock * 2 - 16;
      this.fieldH = h - top - 12;
    } else {
      this.alarms[0].setPosition(w * 0.2, h - 52);
      this.alarms[1].setPosition(w * 0.5, h - 52);
      this.alarms[2].setPosition(w * 0.8, h - 52);
      this.fieldX = 8;
      this.fieldW = w - 16;
      this.fieldH = h - top - 100;
    }
    this.fieldY = top;
    this.grass.setPosition(this.fieldX + this.fieldW / 2, this.fieldY + this.fieldH / 2).setSize(Math.max(20, this.fieldW), Math.max(20, this.fieldH));
    this.holes.forEach((hole, i) => hole.setPosition(this.fieldX + (this.fieldW * (i + 1)) / (this.holes.length + 1), this.fieldY + this.fieldH * 0.5));
    this.nest.setPosition(this.fieldX + this.fieldW / 2, this.fieldY + this.fieldH * 0.78);
    this.pups.forEach((pup, i) => pup.setPosition(this.nest.x - 50 + i * 18, this.nest.y - 6));
    this.scoreT.setPosition(this.fieldX + 8, this.fieldY + 6);
    this.ring.setPosition(this.fieldX + this.fieldW - 70, this.fieldY + 6);
    this.prompt.setPosition(this.fieldX + 8, this.fieldY + 40);
  }
  alarm(cell) {
    if (!this.round) return;
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
    if (after.pupsSafe < before.pupsSafe) {
      const i = 5 - after.pupsSafe;
      if (this.pups[i]) this.pups[i].setFrame("pup-hide");
      say(t("pupScared"));
    }
    this.scoreT.setText(String(after.score));
    document.getElementById("live").textContent = String(after.score);
  }
  pause() { if (this.round.state === "running") { this.round.pause(); window.dispatchEvent(new CustomEvent("ap-pause")); } }
  togglePause() { if (this.round.state === "paused") this.resumeRound(); else this.pause(); }
  resumeRound() { if (this.round.state === "paused") this.round.resume(); }
  restart() { this.scene.restart({ level: this.level }); }
  finish() {
    if (this.ended) return;
    this.ended = true;
    this.round.state = "ended";
    const bank = this.round.read();
    const pay = seedsFor(bank.score, bank.stars);
    current.seeds = (current.seeds || 0) + pay;
    const prev = current.best[this.level.id] || {};
    current.best[this.level.id] = { score: Math.max(bank.score, prev.score || 0), stars: Math.max(bank.stars, prev.stars || 0), cleared: bank.cleared || prev.cleared };
    saveSave();
    saveNow();
    window.dispatchEvent(new CustomEvent("ap-end", { detail: Object.assign({}, bank, { pay, why: bank.why }) }));
  }
  update(_t, dt) {
    if (!this.round || this.round.state !== "running" || this.ended) return;
    this.acc += dt;
    while (this.acc >= 1000 / 60) { this.round.advance(); this.acc -= 1000 / 60; }
    const step = this.round.step;
    const active = this.round.spawns.find((s) => step >= s.step && step <= s.step + s.approachSteps);
    if (active) {
      const p = (step - active.step) / active.approachSteps;
      const hole = this.holes[active.hole] || this.holes[0];
      this.alice.setPosition(hole.x, hole.y - 36).setVisible(true);
      const sx = this.fieldX + 20 + active.edge * (this.fieldW / 2);
      this.threat.setFrame(FRAME[active.kind] || "hawk-glide-0").setVisible(true);
      this.threat.setPosition(sx + (this.nest.x - sx) * p, this.fieldY + 20 + (this.nest.y - this.fieldY - 20) * p);
    }
    const left = this.level.seconds * 60 - step;
    this.ring.setText(left <= 600 && left > 0 ? t("ten") : "");
    const bank = this.round.read();
    this.scoreT.setText(String(bank.score));
    document.getElementById("live").textContent = this.level.id + " " + bank.score + " " + Math.max(0, Math.ceil(left / 60));
    if (step >= this.level.seconds * 60) this.finish();
  }
}
