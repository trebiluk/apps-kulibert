import { paintRun, RUN } from "../home-art.js";
import { loaderX, motionOff } from "../fx.js";
import { rtl } from "../i18n.js";

const TEX = "lookout";

function frames(prefix, n) {
  const list = [];
  for (let i = 0; i < n; i++) list.push({ key: TEX, frame: prefix + i });
  return list;
}

export class Preloader extends window.Phaser.Scene {
  constructor() { super("Preloader"); }
  preload() {
    this.cameras.main.roundPixels = true;
    this.loadP = 0;
    this.drawBar();
    this.load.on("progress", (p) => {
      this.loadP = p;
      this.paintProgress(p);
    });
    this.load.atlas(TEX, "assets/sprites/lookout-pixel.png", "assets/sprites/lookout-pixel.json");
    this.load.audioSprite("sfx", "assets/sfx.json", ["assets/sfx.ogg", "assets/sfx.m4a"]);
  }
  drawBar() {
    const w = this.scale.width;
    const h = this.scale.height;
    const barW = Math.max(140, Math.min(360, Math.floor(w * 0.62)));
    const barH = 16;
    this.barW = barW;
    this.barH = barH;
    this.barX = Math.round((w - barW) / 2);
    this.barY = Math.round(h * 0.58);
    this.track = this.add.graphics().setDepth(2);
    this.fill = this.add.graphics().setDepth(3);
    const tex = this.textures.createCanvas("alice-run-pix", 16 * RUN.length, 16);
    const ctx = tex.getContext();
    ctx.imageSmoothingEnabled = false;
    paintRun(ctx);
    tex.refresh();
    for (let i = 0; i < RUN.length; i++) tex.add(i, 0, i * 16, 0, 16, 16);
    this.anims.create({
      key: "loader-run",
      frames: RUN.map((_, i) => ({ key: "alice-run-pix", frame: i })),
      frameRate: 8,
      repeat: -1,
    });
    this.runner = this.add.sprite(this.barX, this.barY, "alice-run-pix", 0).setOrigin(0.5, 1).setScale(3).setDepth(4);
    if (motionOff()) this.runner.setFrame(0);
    else this.runner.play("loader-run");
    this.paintProgress(0);
    this.scale.on("resize", this.onResize, this);
    const note = () => this.noteLoader();
    this.loaderClock = window.setInterval(note, 50);
    note();
  }
  noteLoader() {
    const live = document.getElementById("live");
    if (!live || !this.runner) return;
    live.dataset.loader = "1";
    live.dataset.p = String(Math.round((this.loadP || 0) * 1000) / 1000);
    live.dataset.rx = String(Math.round(this.runner.x));
    live.dataset.run = this.runner.frame ? String(this.runner.frame.name) : "0";
  }
  onResize(s) {
    if (!this.track) return;
    const barW = Math.max(140, Math.min(360, Math.floor(s.width * 0.62)));
    this.barW = barW;
    this.barX = Math.round((s.width - barW) / 2);
    this.barY = Math.round(s.height * 0.58);
    this.paintProgress(this.loadP || 0);
  }
  paintProgress(p) {
    if (!this.track || !this.fill) return;
    const x = this.barX;
    const y = this.barY;
    const barW = this.barW;
    const barH = this.barH;
    this.track.clear();
    this.track.fillStyle(0x1c140f, 1);
    this.track.fillRect(x - 3, y - 3, barW + 6, barH + 6);
    this.track.fillStyle(0x1d6a30, 1);
    this.track.fillRect(x, y, barW, barH);
    const u = Math.max(0, Math.min(1, Number(p) || 0));
    this.fill.clear();
    this.fill.fillStyle(0xf5c446, 1);
    const span = Math.max(0, Math.round(barW * u));
    if (span > 0) {
      const rtlOn = rtl();
      this.fill.fillRect(rtlOn ? x + barW - span : x, y, span, barH);
    }
    if (this.runner) {
      this.runner.setPosition(loaderX(u, x, x + barW, rtl()), y + 2);
      this.runner.setFlipX(rtl());
    }
  }
  update() {}
  create() {
    if (this.loaderClock) window.clearInterval(this.loaderClock);
    this.scale.off("resize", this.onResize, this);
    const tex = this.textures.get(TEX);
    if (tex && tex.setFilter) tex.setFilter(window.Phaser.Textures.FilterMode.NEAREST);
    const add = (key, list, rate) => this.anims.create({ key, frames: list, frameRate: rate, repeat: -1 });
    add("alice-pop", frames("alice-pop-", 3), 6);
    add("alice-look", frames("alice-look-", 3), 4);
    add("alice-chirp", frames("alice-chirp-", 3), 6);
    add("alice-duck", frames("alice-duck-", 3), 6);
    add("alice-cheer", frames("alice-cheer-", 3), 6);
    add("alice-wave", frames("alice-wave-", 3), 6);
    add("alice-groom", frames("alice-groom-", 3), 4);
    add("alice-run", frames("alice-run-", 3), 8);
    add("pup-idle", frames("pup-idle-", 3), 4);
    add("pup-scurry", frames("pup-scurry-", 3), 8);
    add("wonder-idle", frames("wonder-idle-", 3), 4);
    add("wonder-hop", frames("wonder-hop-", 3), 6);
    add("wonder-wave", frames("wonder-wave-", 3), 6);
    add("wonder-ear", frames("wonder-ear-", 3), 3);
    add("hawk-fly", [{ key: TEX, frame: "hawk-flap-0" }, { key: TEX, frame: "hawk-flap-1" }, { key: TEX, frame: "hawk-swoop" }], 6);
    add("coyote-trot", frames("coyote-trot-", 4), 8);
    add("snake-slither", frames("snake-slither-", 3), 6);
    add("rabbit-hop", frames("rabbit-hop-", 3), 6);
    add("weed-roll", frames("weed-", 3), 6);
    add("butterfly", frames("butterfly-", 3), 6);
    add("hopper", frames("hopper-", 3), 6);
    add("grass-sway", frames("grass-", 3), 2);
    add("bird", [{ key: TEX, frame: "bird-0" }, { key: TEX, frame: "bird-1" }], 2);
    this.scene.start("Burrow");
    this.scene.launch("UI");
  }
}
