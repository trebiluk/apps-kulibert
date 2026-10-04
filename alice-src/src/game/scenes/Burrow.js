import GridSizer from "phaser3-rex-plugins/templates/ui/gridsizer/GridSizer.js";
import { t, rtl } from "../i18n.js";

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
    this.cast = this.add.container(0, 0);
    this.alice = this.add.sprite(0, 0, "alice", "alice-idle-0").play("alice-idle");
    this.wonder = this.add.sprite(0, 0, "alice", "wonder-idle-0").play("wonder-idle");
    this.hole = this.add.image(0, 0, "alice", "hole");
    this.cast.add([this.hole, this.alice, this.wonder]);
    this.tiles = TILES.map(([id, key, frame, live]) => this.makeTile(id, key, frame, live));
    this.grid = null;
    this.layout(this.scale.width, this.scale.height, rtl());
    this.scale.on("resize", (s) => this.layout(s.width, s.height, rtl()));
    window.addEventListener("ap-lang", () => this.layout(this.scale.width, this.scale.height, rtl()));
    const reduce = document.documentElement.getAttribute("data-kp-motion") === "less";
    if (!reduce) {
      this.tweens.add({ targets: this.alice, y: "-=6", duration: 700, yoyo: true, repeat: -1 });
      this.tweens.add({ targets: this.wonder, y: "-=8", duration: 800, yoyo: true, repeat: -1 });
    } else {
      this.alice.anims.stop();
      this.wonder.anims.stop();
    }
  }
  makeTile(id, key, frame, live) {
    const Phaser = window.Phaser;
    const box = this.add.container(0, 0);
    const bg = this.add.rectangle(0, 0, 140, 140, 0x0b1f3a).setStrokeStyle(3, live ? 0x14b8a6 : 0x1f4b66);
    const icon = this.add.image(0, -16, "alice", frame).setDisplaySize(96, 96);
    const label = this.add.text(0, 48, t(key), { fontFamily: "Atkinson Hyperlegible", fontSize: "18px", color: "#f8fafc" }).setOrigin(0.5);
    const soon = this.add.text(0, 66, live ? "" : t("soon"), { fontFamily: "Atkinson Hyperlegible", fontSize: "14px", color: "#fde68a" }).setOrigin(0.5);
    box.add([bg, icon, label, soon]);
    box.setSize(140, 140);
    bg.setInteractive({ useHandCursor: true });
    bg.on("pointerdown", () => {
      if (id === "lookout") this.scene.start("Lookout");
      else window.dispatchEvent(new CustomEvent("ap-soon"));
    });
    box.setData("label", label);
    box.setData("soon", soon);
    box.setData("key", key);
    box.setData("live", live);
    return box;
  }
  layout(w, h, isRtl) {
    const wide = w > h || w >= 900;
    const cols = wide ? 3 : 2;
    const rows = wide ? 2 : 3;
    if (this.grid) {
      this.tiles.forEach((tile) => { try { this.grid.remove(tile, false); } catch (e) {} });
      this.grid.destroy();
    }
    this.grid = new GridSizer(this, {
      x: w / 2, y: h * 0.62, width: Math.min(w - 24, 640), height: h * 0.5,
      column: cols, row: rows, columnProportions: 1, rowProportions: 1, space: { column: 8, row: 8 },
    });
    this.tiles.forEach((tile) => {
      tile.getData("label").setText(t(tile.getData("key")));
      tile.getData("soon").setText(tile.getData("live") ? "" : t("soon"));
      this.grid.add(tile);
    });
    this.grid.layout();
    this.hole.setPosition(w / 2, h * 0.22);
    this.alice.setPosition(isRtl ? w * 0.62 : w * 0.38, h * 0.16);
    this.wonder.setPosition(isRtl ? w * 0.38 : w * 0.62, h * 0.16);
    document.body.classList.remove("in-round");
  }
}
