import levels from "../../levels/lookout.json";
import { t, rtl } from "../i18n.js";
import { loadSave, classLeft, topScore, saveNow } from "../save.js";
import { skyOf } from "../looks.js";
import { dailyLevel, dailySeed, endlessLevel } from "../modes.js";

const TILES = [
  ["lookout", "lookout", "alice-idle-0", true],
  ["dress", "dressUp", "wonder-idle-0", false],
  ["burrow", "burrow", "mound", false],
  ["signals", "signals", "key-j", false],
  ["dash", "dash", "wonder-hop-0", false],
  ["dig", "dig", "hole", false],
];

export class Burrow extends window.Phaser.Scene {
  constructor() { super("Burrow"); }
  create() {
    this.save = loadSave();
    this.mode = "home";
    this.playMode = "class";
    this.cameras.main.setBackgroundColor(skyOf(this.save.settings.look));
    this.alice = this.add.sprite(0, 0, "alice", "alice-idle-0").play("alice-idle");
    this.wonder = this.add.sprite(0, 0, "alice", "wonder-idle-0").play("wonder-idle");
    this.hole = this.add.image(0, 0, "alice", "hole");
    this.seedText = this.add.text(16, 0, "", { fontFamily: "Atkinson Hyperlegible", fontSize: "20px", color: "#f5c446" });
    this.classText = this.add.text(16, 0, "", { fontFamily: "Atkinson Hyperlegible", fontSize: "18px", color: "#fde68a" });
    this.tiles = TILES.map((row) => this.makeTile(...row));
    this.levels = levels.levels.map((lv, i) => this.makeLevel(lv, i));
    this.modeBtns = ["class", "daily", "endless"].map((id) => this.makeChip(id));
    this.dailyGo = this.makeGo("daily");
    this.endlessGo = this.makeGo("endless");
    this.onResize = (s) => { if (this.scene.isActive()) this.layout(s.width, s.height); };
    this.onLang = () => this.layout(this.scale.width, this.scale.height);
    this.onHome = () => { this.mode = "home"; this.save = loadSave(); this.layout(this.scale.width, this.scale.height); };
    this.onLook = () => { this.cameras.main.setBackgroundColor(skyOf(loadSave().settings.look)); };
    this.layout(this.scale.width, this.scale.height);
    this.scale.on("resize", this.onResize);
    window.addEventListener("ap-lang", this.onLang);
    window.addEventListener("ap-home", this.onHome);
    window.addEventListener("ap-look", this.onLook);
    this.clock = window.setInterval(() => this.tickClass(), 1000);
    this.events.on("shutdown", () => {
      this.scale.off("resize", this.onResize);
      window.removeEventListener("ap-lang", this.onLang);
      window.removeEventListener("ap-home", this.onHome);
      window.removeEventListener("ap-look", this.onLook);
      window.clearInterval(this.clock);
    });
  }
  makeTile(id, key, frame, live) {
    const box = this.add.container(0, 0);
    const bg = this.add.rectangle(0, 0, 148, 132, 0x0b1f3a).setStrokeStyle(4, live ? 0xfde68a : 0x67e8f9);
    const icon = this.add.image(0, -22, "alice", frame).setDisplaySize(72, 72);
    const lock = this.add.image(48, -40, "alice", "lock").setDisplaySize(28, 28).setVisible(!live);
    const label = this.add.text(0, 32, t(key), { fontFamily: "Atkinson Hyperlegible", fontSize: "18px", color: "#f8fafc" }).setOrigin(0.5);
    const soon = this.add.text(0, 52, live ? "" : t("soon"), { fontFamily: "Atkinson Hyperlegible", fontSize: "14px", color: "#fde68a" }).setOrigin(0.5);
    box.add([bg, icon, lock, label, soon]);
    box.setSize(148, 132);
    bg.setInteractive(new window.Phaser.Geom.Rectangle(-74, -66, 148, 132), window.Phaser.Geom.Rectangle.Contains);
    bg.on("pointerdown", () => {
      if (id === "lookout") { this.mode = "picker"; this.playMode = "class"; this.layout(this.scale.width, this.scale.height); }
      else window.dispatchEvent(new CustomEvent("ap-soon"));
    });
    box.setData("label", label);
    box.setData("soon", soon);
    box.setData("key", key);
    return box;
  }
  makeLevel(lv, i) {
    const box = this.add.container(0, 0);
    const bg = this.add.rectangle(0, 0, 148, 132, 0x0b1f3a).setStrokeStyle(4, 0xfde68a);
    const icon = this.add.image(0, -24, "alice", "hawk-glide-0").setDisplaySize(72, 72);
    const lock = this.add.image(48, -40, "alice", "lock").setDisplaySize(28, 28);
    const num = this.add.text(0, 24, "L0" + (i + 1), { fontFamily: "Atkinson Hyperlegible", fontSize: "18px", color: "#f8fafc" }).setOrigin(0.5);
    const label = this.add.text(0, 46, t("l0" + (i + 1)), { fontFamily: "Atkinson Hyperlegible", fontSize: "16px", color: "#fde68a" }).setOrigin(0.5);
    box.add([bg, icon, lock, num, label]);
    box.setSize(148, 132);
    bg.setInteractive(new window.Phaser.Geom.Rectangle(-74, -66, 148, 132), window.Phaser.Geom.Rectangle.Contains);
    bg.on("pointerdown", () => this.pick(i));
    box.setData("label", label);
    box.setData("lock", lock);
    box.setData("i", i);
    return box;
  }
  makeChip(id) {
    const box = this.add.container(0, 0);
    const bg = this.add.rectangle(0, 0, 96, 48, 0x0b1f3a).setStrokeStyle(3, 0x67e8f9);
    const label = this.add.text(0, 0, "", { fontFamily: "Atkinson Hyperlegible", fontSize: "14px", color: "#f8fafc", align: "center", wordWrap: { width: 88 } }).setOrigin(0.5);
    box.add([bg, label]);
    box.setSize(96, 48);
    bg.setInteractive(new window.Phaser.Geom.Rectangle(-48, -24, 96, 48), window.Phaser.Geom.Rectangle.Contains);
    bg.on("pointerdown", () => { this.playMode = id; this.layout(this.scale.width, this.scale.height); });
    box.setData("label", label);
    box.setData("bg", bg);
    box.setData("id", id);
    return box;
  }
  makeGo(kind) {
    const box = this.add.container(0, 0);
    const bg = this.add.rectangle(0, 0, 280, 72, 0xfde68a).setStrokeStyle(4, 0x67e8f9);
    const label = this.add.text(0, 0, "", { fontFamily: "Atkinson Hyperlegible", fontSize: "22px", color: "#042f2e", align: "center", wordWrap: { width: 250 } }).setOrigin(0.5);
    box.add([bg, label]);
    box.setSize(280, 72);
    bg.setInteractive(new window.Phaser.Geom.Rectangle(-140, -36, 280, 72), window.Phaser.Geom.Rectangle.Contains);
    bg.on("pointerdown", () => { if (kind === "daily") this.startDaily(); else this.startEndless(); });
    box.setData("label", label);
    return box;
  }
  open(i) {
    return i === 0 || !!(this.save.best[levels.levels[i - 1].id] && this.save.best[levels.levels[i - 1].id].cleared);
  }
  pick(i) {
    this.save = loadSave();
    if (!this.open(i)) {
      window.dispatchEvent(new CustomEvent("ap-soon", { detail: t("locked").replace("{n}", String(i)) }));
      return;
    }
    this.scene.start("Lookout", { level: levels.levels[i], mode: "class" });
  }
  startDaily() {
    this.scene.start("Lookout", { level: dailyLevel(), mode: "daily", seed: dailySeed() });
  }
  startEndless() {
    this.scene.start("Lookout", { level: endlessLevel(1), mode: "endless", seed: (Date.now() ^ 3) >>> 0 });
  }
  tickClass() {
    if (!this.scene.isActive()) return;
    if (this.mode !== "home") { this.classText.setText(""); return; }
    const left = classLeft();
    if (left == null) { this.classText.setText(""); return; }
    if (left <= 0) {
      this.classText.setText(t("classUp"));
      const s = loadSave().settings;
      if (s.classStart && s.classRang !== s.classStart) {
        s.classRang = s.classStart;
        saveNow();
        window.dispatchEvent(new CustomEvent("ap-classup"));
      }
      return;
    }
    const m = Math.floor(left / 60000);
    const sec = Math.floor((left % 60000) / 1000);
    this.classText.setText(t("classTime") + " " + m + ":" + String(sec).padStart(2, "0"));
  }
  chipWord(id) {
    if (id === "class") return t("classMode");
    return t(id);
  }
  goWord(kind) {
    const best = topScore(kind);
    const name = kind === "daily" ? t("today") : t("endless");
    return best ? name + " · " + best : name;
  }
  layout(w, h) {
    this.save = loadSave();
    const items = this.mode === "picker" && this.playMode === "class" ? this.levels : this.mode === "home" ? this.tiles : [];
    const hide = this.mode === "home" ? this.levels : this.tiles;
    hide.forEach((n) => { n.setVisible(false); if (n.list[0]) n.list[0].disableInteractive(); });
    if (this.mode !== "picker" || this.playMode !== "class") {
      this.levels.forEach((n) => { n.setVisible(false); if (n.list[0]) n.list[0].disableInteractive(); });
    }
    const cols = w >= 700 ? 3 : 2;
    const gapX = 156;
    const gapY = 140;
    const gridW = cols * gapX;
    const top = this.mode === "picker" ? 176 : Math.max(150, h * 0.28);
    items.forEach((tile, n) => {
      tile.setVisible(true);
      if (tile.list[0]) tile.list[0].setInteractive(new window.Phaser.Geom.Rectangle(-74, -66, 148, 132), window.Phaser.Geom.Rectangle.Contains);
      tile.setPosition(w / 2 - gridW / 2 + gapX / 2 + (n % cols) * gapX, top + Math.floor(n / cols) * gapY);
      if (tile.getData("key")) {
        const label = tile.getData("label");
        const soon = tile.getData("soon");
        if (label && label.setText) label.setText(t(tile.getData("key")));
        if (soon && soon.setText) soon.setText(tile.getData("key") === "lookout" ? "" : t("soon"));
      } else {
        const i = tile.getData("i");
        const label = tile.getData("label");
        const lock = tile.getData("lock");
        if (label && label.setText) label.setText(t("l0" + (i + 1)));
        if (lock && lock.setVisible) lock.setVisible(!this.open(i));
      }
    });
    const picking = this.mode === "picker";
    const order = rtl() ? ["endless", "daily", "class"] : ["class", "daily", "endless"];
    this.modeBtns.forEach((btn) => {
      const id = btn.getData("id");
      const show = picking;
      btn.setVisible(show);
      const bg = btn.getData("bg");
      if (bg) bg.setStrokeStyle(3, id === this.playMode ? 0xfde68a : 0x67e8f9);
      if (show) bg.setInteractive(new window.Phaser.Geom.Rectangle(-48, -24, 96, 48), window.Phaser.Geom.Rectangle.Contains);
      else bg.disableInteractive();
      const label = btn.getData("label");
      if (label) label.setText(this.chipWord(id));
      const slot = order.indexOf(id);
      const gap = w < 380 ? 100 : 124;
      btn.setPosition(w / 2 - gap + slot * gap, 52);
    });
    const showDaily = picking && this.playMode === "daily";
    const showEndless = picking && this.playMode === "endless";
    this.dailyGo.setVisible(showDaily).setPosition(w / 2, Math.max(240, h * 0.42));
    this.endlessGo.setVisible(showEndless).setPosition(w / 2, Math.max(240, h * 0.42));
    this.dailyGo.getData("label").setText(this.goWord("daily"));
    this.endlessGo.getData("label").setText(this.goWord("endless"));
    const dailyBg = this.dailyGo.list[0];
    const endlessBg = this.endlessGo.list[0];
    if (showDaily) dailyBg.setInteractive(new window.Phaser.Geom.Rectangle(-140, -36, 280, 72), window.Phaser.Geom.Rectangle.Contains);
    else dailyBg.disableInteractive();
    if (showEndless) endlessBg.setInteractive(new window.Phaser.Geom.Rectangle(-140, -36, 280, 72), window.Phaser.Geom.Rectangle.Contains);
    else endlessBg.disableInteractive();
    const showCast = this.mode === "home";
    this.hole.setPosition(w / 2, 108).setVisible(showCast);
    this.alice.setPosition(rtl() ? w * 0.64 : w * 0.30, 92).setVisible(showCast);
    this.wonder.setPosition(rtl() ? w * 0.30 : w * 0.68, 96).setVisible(showCast);
    this.seedText.setText(t("seeds") + " " + (this.save.seeds || 0)).setPosition(rtl() ? w - 200 : 120, h - 36);
    this.classText.setPosition(rtl() ? 16 : w - 240, h - 36);
    this.tickClass();
    document.body.classList.remove("in-round");
    const live = this.mode === "picker" ? (this.playMode === "class" ? t("classMode") : t(this.playMode)) : t("home");
    document.getElementById("live").textContent = live;
  }
}
