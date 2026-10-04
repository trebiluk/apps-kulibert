import GridSizer from "phaser3-rex-plugins/templates/ui/gridsizer/GridSizer.js";
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
    this.cast = this.add.container(0, 0);
    this.alice = this.add.sprite(0, 0, "alice", "alice-idle-0").play("alice-idle");
    this.wonder = this.add.sprite(0, 0, "alice", "wonder-idle-0").play("wonder-idle");
    this.hole = this.add.image(0, 0, "alice", "hole");
    this.cast.add([this.hole, this.alice, this.wonder]);
    this.seedText = this.add.text(0, 0, "", { fontFamily: "Atkinson Hyperlegible", fontSize: "18px", color: "#f5c446" });
    this.tiles = TILES.map(([id, key, frame, live]) => this.makeTile(id, key, frame, live));
    this.levels = levels.levels.map((lv, i) => this.makeLevel(lv, i));
    this.grid = null;
    this.layout(this.scale.width, this.scale.height, rtl());
    this.scale.on("resize", (s) => this.layout(s.width, s.height, rtl()));
    window.addEventListener("ap-lang", () => this.layout(this.scale.width, this.scale.height, rtl()));
    window.addEventListener("ap-home", () => { this.mode = "home"; this.save = loadSave(); this.layout(this.scale.width, this.scale.height, rtl()); });
  }
  makeTile(id, key, frame, live) {
    const box = this.add.container(0, 0);
    const bg = this.add.rectangle(0, 0, 120, 120, 0x0b1f3a).setStrokeStyle(3, live ? 0x14b8a6 : 0x1f4b66);
    const icon = this.add.image(0, -18, "alice", frame).setDisplaySize(72, 72);
    const lock = this.add.image(28, -28, "alice", "lock").setDisplaySize(28, 28).setVisible(!live);
    const label = this.add.text(0, 36, t(key), { fontFamily: "Atkinson Hyperlegible", fontSize: "16px", color: "#f8fafc" }).setOrigin(0.5);
    const soon = this.add.text(0, 52, live ? "" : t("soon"), { fontFamily: "Atkinson Hyperlegible", fontSize: "13px", color: "#fde68a" }).setOrigin(0.5);
    box.add([bg, icon, lock, label, soon]);
    box.setSize(120, 120);
    bg.setInteractive({ useHandCursor: true });
    bg.on("pointerdown", () => {
      if (id === "lookout") { this.mode = "picker"; this.layout(this.scale.width, this.scale.height, rtl()); }
      else window.dispatchEvent(new CustomEvent("ap-soon"));
    });
    box.setData("label", label);
    box.setData("soon", soon);
    box.setData("key", key);
    return box;
  }
  makeLevel(lv, i) {
    const box = this.add.container(0, 0);
    const bg = this.add.rectangle(0, 0, 120, 120, 0x0b1f3a).setStrokeStyle(3, 0xfde68a);
    const icon = this.add.image(0, -16, "alice", "hawk-glide-0").setDisplaySize(64, 64);
    const lock = this.add.image(28, -28, "alice", "lock").setDisplaySize(28, 28);
    const num = this.add.text(0, 28, "L0" + (i + 1), { fontFamily: "Atkinson Hyperlegible", fontSize: "16px", color: "#f8fafc" }).setOrigin(0.5);
    const label = this.add.text(0, 46, t("l0" + (i + 1)), { fontFamily: "Atkinson Hyperlegible", fontSize: "14px", color: "#f8fafc" }).setOrigin(0.5);
    box.add([bg, icon, lock, num, label]);
    box.setSize(120, 120);
    bg.setInteractive({ useHandCursor: true });
    bg.on("pointerdown", () => this.pick(i));
    box.setData("label", label);
    box.setData("lock", lock);
    box.setData("i", i);
    return box;
  }
  pick(i) {
    const save = loadSave();
    const open = i === 0 || (save.best[levels.levels[i - 1].id] && save.best[levels.levels[i - 1].id].cleared);
    if (!open) { window.dispatchEvent(new CustomEvent("ap-soon", { detail: t("locked").replace("{n}", String(i)) })); return; }
    this.scene.start("Lookout", { level: levels.levels[i] });
  }
  layout(w, h, isRtl) {
    const wide = w > h || w >= 900;
    const items = this.mode === "picker" ? this.levels : this.tiles;
    const hide = this.mode === "picker" ? this.tiles : this.levels;
    hide.forEach((n) => n.setVisible(false));
    items.forEach((n) => n.setVisible(true));
    if (this.grid) {
      items.concat(hide).forEach((n) => { try { this.grid.remove(n, false); } catch (e) {} });
      this.grid.destroy();
    }
    const cols = wide ? 3 : 2;
    const rows = Math.ceil(items.length / cols);
    this.grid = new GridSizer(this, {
      x: w / 2, y: h * 0.62, width: Math.min(w - 16, wide ? 700 : 360), height: Math.min(h * 0.55, rows * 130),
      column: cols, row: rows, columnProportions: 1, rowProportions: 1, space: { column: 8, row: 8 },
    });
    items.forEach((tile) => {
      tile.setSize(120, 120);
      if (tile.getData("key")) {
        tile.getData("label").setText(t(tile.getData("key")));
        tile.getData("soon").setText(t("soon"));
      } else {
        const i = tile.getData("i");
        tile.getData("label").setText(t("l0" + (i + 1)));
        const open = i === 0 || (this.save.best[levels.levels[i - 1].id] && this.save.best[levels.levels[i - 1].id].cleared);
        tile.getData("lock").setVisible(!open);
      }
      this.grid.add(tile);
    });
    this.grid.layout();
    this.hole.setPosition(w / 2, Math.min(150, h * 0.2));
    this.alice.setPosition(isRtl ? w * 0.62 : w * 0.32, Math.min(120, h * 0.16)).setVisible(this.mode === "home");
    this.wonder.setPosition(isRtl ? w * 0.32 : w * 0.68, Math.min(120, h * 0.16)).setVisible(this.mode === "home");
    this.hole.setVisible(this.mode === "home");
    this.seedText.setText(t("seeds") + " " + (this.save.seeds || 0));
    this.seedText.setPosition(12, h - 36);
    document.body.classList.remove("in-round");
  }
}
