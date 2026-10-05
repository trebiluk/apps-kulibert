import levels from "../../levels/lookout.json";
import { t, rtl } from "../i18n.js";
import { loadSave } from "../save.js";

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
    this.alice = this.add.sprite(0, 0, "alice", "alice-idle-0").play("alice-idle");
    this.wonder = this.add.sprite(0, 0, "alice", "wonder-idle-0").play("wonder-idle");
    this.hole = this.add.image(0, 0, "alice", "hole");
    this.seedText = this.add.text(16, 0, "", { fontFamily: "Atkinson Hyperlegible", fontSize: "20px", color: "#f5c446" });
    this.tiles = TILES.map((row) => this.makeTile(...row));
    this.levels = levels.levels.map((lv, i) => this.makeLevel(lv, i));
    this.onResize = (s) => { if (this.scene.isActive()) this.layout(s.width, s.height); };
    this.layout(this.scale.width, this.scale.height);
    this.scale.on("resize", this.onResize);
    this.events.on("shutdown", () => this.scale.off("resize", this.onResize));
    window.addEventListener("ap-lang", () => this.layout(this.scale.width, this.scale.height));
    window.addEventListener("ap-home", () => { this.mode = "home"; this.save = loadSave(); this.layout(this.scale.width, this.scale.height); });
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
      if (id === "lookout") { this.mode = "picker"; this.layout(this.scale.width, this.scale.height); }
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
  open(i) {
    return i === 0 || !!(this.save.best[levels.levels[i - 1].id] && this.save.best[levels.levels[i - 1].id].cleared);
  }
  pick(i) {
    this.save = loadSave();
    if (!this.open(i)) {
      window.dispatchEvent(new CustomEvent("ap-soon", { detail: t("locked").replace("{n}", String(i)) }));
      return;
    }
    this.scene.start("Lookout", { level: levels.levels[i] });
  }
  layout(w, h) {
    const items = this.mode === "picker" ? this.levels : this.tiles;
    const hide = this.mode === "picker" ? this.tiles : this.levels;
    hide.forEach((n) => { n.setVisible(false); if (n.list[0]) n.list[0].disableInteractive(); });
    const cols = w >= 700 ? 3 : 2;
    const gapX = 156;
    const gapY = 140;
    const rows = Math.ceil(items.length / cols);
    const gridW = cols * gapX;
    const top = Math.max(150, h * 0.28);
    items.forEach((tile, n) => {
      tile.setVisible(true);
      if (tile.list[0]) tile.list[0].setInteractive(new window.Phaser.Geom.Rectangle(-74, -66, 148, 132), window.Phaser.Geom.Rectangle.Contains);
      tile.setPosition(w / 2 - gridW / 2 + gapX / 2 + (n % cols) * gapX, top + Math.floor(n / cols) * gapY);
      if (tile.getData("key")) {
        const label = tile.getData("label");
        const soon = tile.getData("soon");
        if (label && label.setText) label.setText(t(tile.getData("key")));
        if (soon && soon.setText) soon.setText(t("soon"));
      } else {
        const i = tile.getData("i");
        const label = tile.getData("label");
        const lock = tile.getData("lock");
        if (label && label.setText) label.setText(t("l0" + (i + 1)));
        if (lock && lock.setVisible) lock.setVisible(!this.open(i));
      }
    });
    const showCast = this.mode === "home";
    this.hole.setPosition(w / 2, 108).setVisible(showCast);
    this.alice.setPosition(rtl() ? w * 0.64 : w * 0.30, 92).setVisible(showCast);
    this.wonder.setPosition(rtl() ? w * 0.30 : w * 0.68, 96).setVisible(showCast);
    this.seedText.setText(t("seeds") + " " + (this.save.seeds || 0)).setPosition(16, h - 40);
    document.body.classList.remove("in-round");
    document.getElementById("live").textContent = this.mode === "picker" ? t("lookout") : t("home");
  }
}
