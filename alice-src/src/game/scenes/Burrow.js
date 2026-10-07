import levels from "../../levels/lookout.json";
import { t, rtl } from "../i18n.js";
import { loadSave, classLeft, topScore, saveNow } from "../save.js";
import { skyOf } from "../looks.js";
import { dailyLevel, dailySeed, endlessLevel } from "../modes.js";
import { createPrairie, dailyWeather } from "../world.js";
import { bands, poseNow } from "../ui/bands.js";
import { fitButton, hideButton, intScale, makeButton } from "../ui/widgets.js";
import { flyPath, lite, motionOff } from "../fx.js";

const TILES = [
  ["lookout", "lookout", "alice-wave-0", true],
  ["dress", "dressUp", "wonder-wave-0", false],
  ["burrow", "burrow", "mound", false],
  ["signals", "signals", "alarm-sky", false],
  ["dash", "dash", "wonder-hop-0", false],
  ["dig", "dig", "hole", false],
];

export class Burrow extends window.Phaser.Scene {
  constructor() { super("Burrow"); }
  create() {
    this.save = loadSave();
    this.mode = "home";
    this.playMode = "class";
    this.cameras.main.roundPixels = true;
    this.cameras.main.setBackgroundColor(skyOf(this.save.settings.look));
    this.cameras.main.setScroll(0, 0);
    this.prairie = createPrairie(this);
    this.hole = this.add.image(0, 0, "lookout", "hole").setDepth(2);
    this.alice = this.add.sprite(0, 0, "lookout", "alice-look-0").play("alice-look").setDepth(2);
    this.wonder = this.add.sprite(0, 0, "lookout", "wonder-idle-0").play("wonder-idle").setDepth(2);
    this.cast = ["hawk-flap-0", "coyote-trot-0", "snake-slither-0", "rabbit-hop-0", "cloud", "weed-0"].map((frame) => this.add.image(0, 0, "lookout", frame).setDepth(2));
    this.butter = this.add.sprite(0, 0, "lookout", "butterfly-0").play("butterfly").setDepth(3);
    this.hopper = this.add.sprite(0, 0, "lookout", "hopper-0").play("hopper").setDepth(3);
    this.seedText = this.add.text(0, 0, "", { fontFamily: "Atkinson Hyperlegible", fontSize: "16px", color: "#f5c446" }).setDepth(4);
    this.classText = this.add.text(0, 0, "", { fontFamily: "Atkinson Hyperlegible", fontSize: "16px", color: "#fde68a" }).setDepth(4);
    this.tiles = TILES.map((row, i) => this.makeTile(row[0], row[1], row[2], row[3], i));
    this.levels = levels.levels.map((lv, i) => this.makeLevel(lv, i));
    this.modeBtns = ["class", "daily", "endless"].map((id) => this.makeChip(id));
    this.dailyGo = this.makeGo("daily");
    this.endlessGo = this.makeGo("endless");
    this.onResize = (s) => { if (this.scene.isActive()) this.layout(s.width, s.height); };
    this.onLang = () => this.layout(this.scale.width, this.scale.height);
    this.onHome = () => { this.mode = "home"; this.save = loadSave(); this.layout(this.scale.width, this.scale.height); };
    this.onLook = () => {
      this.cameras.main.setBackgroundColor(skyOf(loadSave().settings.look));
      if (this.scene.isActive()) this.layout(this.scale.width, this.scale.height);
    };
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
    if (motionOff()) this.anims.pauseAll();
  }
  update() {
    if (this.prairie && this.mode === "home") this.prairie.tick(this.hole);
  }
  makeTile(id, key, frame, live, index) {
    const box = makeButton(this, "tile-" + id, () => {
      if (id === "lookout") { this.mode = "picker"; this.playMode = "class"; this.layout(this.scale.width, this.scale.height); }
      else window.dispatchEvent(new CustomEvent("ap-soon"));
    });
    box.setData("key", key);
    box.setData("frame", frame);
    box.setData("live", live);
    box.setData("index", index);
    return box;
  }
  makeLevel(lv, i) {
    const box = makeButton(this, "L0" + (i + 1), () => this.pick(i));
    box.setData("i", i);
    return box;
  }
  makeChip(id) {
    const box = makeButton(this, "mode-" + id, () => { this.playMode = id; this.layout(this.scale.width, this.scale.height); });
    box.setData("id", id);
    return box;
  }
  makeGo(kind) {
    const box = makeButton(this, "go-" + kind, () => { if (kind === "daily") this.startDaily(); else this.startEndless(); });
    box.setData("kind", kind);
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
  startDaily() { this.scene.start("Lookout", { level: dailyLevel(), mode: "daily", seed: dailySeed() }); }
  startEndless() { this.scene.start("Lookout", { level: endlessLevel(1), mode: "endless", seed: (Date.now() ^ 3) >>> 0 }); }
  tickClass() {
    if (!this.scene.isActive() || this.mode !== "home") { this.classText.setText(""); this.classText.setVisible(false); return; }
    const left = classLeft();
    if (left == null) { this.classText.setText(""); this.classText.setVisible(false); return; }
    this.classText.setVisible(true);
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
  chipWord(id) { return id === "class" ? t("classMode") : t(id); }
  goWord(kind) {
    const best = topScore(kind);
    const name = kind === "daily" ? t("today") : t("endless");
    return best ? name + " · " + best : name;
  }
  place(box, rect, word, frame) {
    if (!rect) { hideButton(box); return; }
    fitButton(box, rect, word, frame);
    const bg = box.getData("bg");
    if (bg) bg.setStrokeStyle(3, 0xfde68a);
  }
  layout(w, h) {
    this.save = loadSave();
    const pose = poseNow(window.innerWidth || w, window.innerHeight || h);
    const b = bands(w, h, { rtl: rtl(), pose, viewW: window.innerWidth || w, viewH: window.innerHeight || h });
    const home = this.mode === "home";
    const picking = this.mode === "picker";
    const showCards = picking && this.playMode === "class";
    const showCast = home;
    this.hole.setVisible(showCast);
    this.alice.setVisible(showCast);
    this.wonder.setVisible(showCast);
    this.butter.setVisible(showCast);
    this.hopper.setVisible(showCast && !lite());
    this.cast.forEach((spr) => spr.setVisible(showCast));
    if (showCast) {
      intScale(this.hole, 36);
      intScale(this.alice, Math.min(64, b.cast.h - 8));
      intScale(this.wonder, Math.min(64, b.cast.h - 8));
      const mid = b.cast.y + b.cast.h * 0.62;
      this.hole.setPosition(b.cast.x + b.cast.w * 0.5, mid + 8);
      this.alice.setPosition(b.cast.x + b.cast.w * (rtl() ? 0.62 : 0.28), mid - 8);
      this.wonder.setPosition(b.cast.x + b.cast.w * (rtl() ? 0.28 : 0.62), mid - 4);
      const step = Math.max(28, Math.floor(b.cast.w / (this.cast.length + 1)));
      this.cast.forEach((spr, i) => {
        intScale(spr, 28);
        spr.setPosition(b.cast.x + 16 + step * i, b.cast.y + 18);
      });
      intScale(this.butter, 24);
      intScale(this.hopper, 24);
      this.butter.setPosition(b.cast.x + b.cast.w - 24, b.cast.y + 16);
      this.hopper.setPosition(b.cast.x + 20, b.cast.y + b.cast.h - 16);
      flyPath(this, this.butter, this.butter.x, this.butter.y - 6, 22, 2100);
      const seeds = t("seeds") + " " + (this.save.seeds || 0);
      this.seedText.setText(seeds).setVisible(true);
      this.seedText.setPosition(rtl() ? b.cast.x + b.cast.w - this.seedText.width - 8 : b.cast.x + 8, b.cast.y + b.cast.h - 22);
      this.classText.setPosition(rtl() ? b.cast.x + 8 : b.cast.x + b.cast.w - 160, b.cast.y + b.cast.h - 22);
    } else {
      this.seedText.setVisible(false);
      this.classText.setVisible(false);
    }
    const field = { x: 0, y: Math.round(h * 0.22), w: w, h: Math.max(80, h - Math.round(h * 0.22)) };
    const mound = showCast ? { x: this.hole.x, y: this.hole.y } : { x: w * 0.5, y: field.y + field.h * 0.62 };
    if (this.prairie) this.prairie.layout(w, h, field, [mound], dailyWeather(), 11);
    this.tiles.forEach((tile, n) => {
      if (!home) { hideButton(tile); return; }
      const row = TILES[n];
      const word = t(row[1]) + (row[3] ? "" : "\n" + t("soon"));
      this.place(tile, b.tiles[n], word, row[3] ? row[2] : "lock");
    });
    this.levels.forEach((tile, n) => {
      if (!showCards) { hideButton(tile); return; }
      const rect = b.cards[n];
      const locked = !this.open(n);
      this.place(tile, rect, "L0" + (n + 1) + "\n" + t("l0" + (n + 1)), locked ? "lock" : "hawk-flap-0");
    });
    this.modeBtns.forEach((btn, i) => {
      if (!picking) { hideButton(btn); return; }
      const id = btn.getData("id");
      this.place(btn, b.chips[i], this.chipWord(id), null);
      const bg = btn.getData("bg");
      if (bg) bg.setStrokeStyle(4, id === this.playMode ? 0xfde68a : 0x67e8f9);
    });
    const showDaily = picking && this.playMode === "daily";
    const showEndless = picking && this.playMode === "endless";
    if (showDaily) this.place(this.dailyGo, b.go, this.goWord("daily"), null);
    else hideButton(this.dailyGo);
    if (showEndless) this.place(this.endlessGo, b.go, this.goWord("endless"), null);
    else hideButton(this.endlessGo);
    this.tickClass();
    document.body.classList.remove("in-round");
    const live = picking ? (this.playMode === "class" ? t("classMode") : t(this.playMode)) : t("home");
    document.getElementById("live").textContent = live;
  }
}
