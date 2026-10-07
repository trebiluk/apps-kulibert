import levels from "../../levels/lookout.json";
import { t, rtl } from "../i18n.js";
import { loadSave, classLeft, topScore, saveNow } from "../save.js";
import { skyOf } from "../looks.js";
import { dailyLevel, dailySeed, endlessLevel } from "../modes.js";
import { createPrairie, dailyWeather } from "../world.js";
import { bands, poseNow } from "../ui/bands.js";
import { fitButton, hideButton, intScale, makeButton } from "../ui/widgets.js";
import { bounceIn, crossBug, decorOn, lite, motionOff } from "../fx.js";

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
    this.mound = this.add.image(0, 0, "lookout", "mound").setDepth(4);
    this.hole = this.add.image(0, 0, "lookout", "hole").setDepth(5);
    this.alice = this.add.sprite(0, 0, "lookout", "alice-groom-0").play("alice-groom").setDepth(8);
    this.wonder = this.add.sprite(0, 0, "lookout", "wonder-ear-0").play("wonder-ear").setDepth(8);
    this.cast = ["hawk-flap-0", "coyote-trot-0", "snake-slither-0", "rabbit-hop-0", "cloud", "weed-0"].map((frame) => this.add.image(0, 0, "lookout", frame).setDepth(6).setVisible(false));
    this.butter = this.add.sprite(0, 0, "lookout", "butterfly-0").play("butterfly").setDepth(9).setVisible(false);
    this.hopper = this.add.sprite(0, 0, "lookout", "hopper-0").play("hopper").setDepth(3);
    this.seedText = this.add.text(0, 0, "", { fontFamily: "Atkinson Hyperlegible", fontSize: "16px", color: "#f5c446" }).setDepth(4).setVisible(false);
    this.classText = this.add.text(0, 0, "", { fontFamily: "Atkinson Hyperlegible", fontSize: "16px", color: "#fde68a" }).setDepth(12);
    this.seedChip = makeButton(this, "seeds", () => {});
    this.seedChip.btn.classList.add("ap-seed");
    this.tiles = TILES.map((row, i) => this.makeTile(row[0], row[1], row[2], row[3], i));
    this.levels = levels.levels.map((lv, i) => this.makeLevel(lv, i));
    this.modeBtns = ["class", "daily", "endless"].map((id) => this.makeChip(id));
    this.dailyGo = this.makeGo("daily");
    this.endlessGo = this.makeGo("endless");
    this.onResize = (s) => { if (this.scene.isActive()) this.layout(s.width, s.height); };
    this.onLang = () => this.layout(this.scale.width, this.scale.height);
    this.onHome = () => { this.mode = "home"; this.wantBounce = true; this.save = loadSave(); this.layout(this.scale.width, this.scale.height); };
    this.onLook = () => {
      this.cameras.main.setBackgroundColor(skyOf(loadSave().settings.look));
      if (this.scene.isActive()) this.layout(this.scale.width, this.scale.height);
    };
    this.wantBounce = true;
    this.bugNext = 400;
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
    this.alice.play("alice-groom");
    this.wonder.play("wonder-ear");
    if (motionOff()) this.anims.pauseAll();
  }
  update(time) {
    if (this.prairie && this.mode === "home") this.prairie.tick(this.hole);
    this.tickBug(time || 0);
    this.publish();
  }
  tickBug(time) {
    if (!this.butter) return;
    if (this.mode !== "home" || !decorOn()) {
      const prev = this.butter.getData("cross");
      if (prev) {
        try { prev.remove(); } catch (e) {}
        this.butter.setData("cross", null);
      }
      this.butter.setVisible(false);
      return;
    }
    if (this.butter.getData("cross")) return;
    if (time < (this.bugNext || 0)) return;
    const w = this.scale.width;
    const y = Math.round((this.prairie && this.prairie.field ? this.prairie.field.y : 40) + Math.min(36, (this.prairie.field.h || 80) * 0.28));
    const flip = rtl();
    this.butter.setFlipX(flip);
    crossBug(this, this.butter, flip ? w + 18 : -18, flip ? -18 : w + 18, y, 3600);
    this.bugNext = time + 5200;
  }
  publish() {
    const now = (this.time && this.time.now) || 0;
    if (now < (this.pubAt || 0)) return;
    this.pubAt = now + 250;
    const live = document.getElementById("live");
    if (!live || !this.alice) return;
    const name = (spr) => (spr && spr.frame && spr.frame.name) || "";
    live.dataset.loader = "0";
    live.dataset.groom = name(this.alice);
    live.dataset.ear = name(this.wonder);
    live.dataset.bug = this.butter && this.butter.visible ? String(Math.round(this.butter.x)) : "";
    live.dataset.layers = this.prairie ? String(this.prairie.layers()) : "0";
    live.dataset.parts = this.prairie ? String(this.prairie.parts()) : "0";
    live.dataset.objs = String(this.children && this.children.list ? this.children.list.length : 0);
    const loop = this.game && this.game.loop;
    live.dataset.fps = String(Math.round((loop && loop.actualFps) || 0));
    const renderer = this.game && this.game.renderer;
    live.dataset.renderer = renderer && renderer.type === 1 ? "canvas" : "webgl";
    const band = this.homeBand;
    if (band && band.cast) {
      live.dataset.cast = [band.cast.x, band.cast.y, band.cast.w, band.cast.h].join(",");
      live.dataset.castPct = ((band.cast.h / Math.max(1, band.h)) * 100).toFixed(1);
      live.dataset.tileRects = (band.tiles || []).map((r) => [r.x, r.y, r.w, r.h].join(",")).join(";");
      live.dataset.seedRect = band.seeds ? [band.seeds.x, band.seeds.y, band.seeds.w, band.seeds.h].join(",") : "";
    }
    live.dataset.door = this.hole && this.hole.visible ? String(Math.round(this.hole.displayWidth)) : "0";
    live.dataset.icons = String((this.cast || []).filter((spr) => spr.visible).length);
    live.dataset.home = this.mode === "home" ? "1" : "0";
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
    this.homeBand = home ? b : this.homeBand;
    this.mound.setVisible(showCast);
    this.hole.setVisible(showCast);
    this.alice.setVisible(showCast);
    this.wonder.setVisible(showCast);
    if (!(showCast && this.butter.getData("cross"))) this.butter.setVisible(false);
    this.hopper.setVisible(showCast && !lite());
    this.cast.forEach((spr) => spr.setVisible(false));
    this.seedText.setVisible(false);
    if (showCast) {
      const holePx = Math.max(64, Math.min(Math.floor(b.cast.h * 0.42), Math.floor(b.cast.w * 0.28)));
      intScale(this.hole, holePx);
      intScale(this.mound, Math.round(this.hole.displayWidth * 1.75));
      const body = Math.max(48, Math.min(Math.floor(b.cast.h * 0.34), this.hole.displayHeight + 8));
      intScale(this.alice, body);
      intScale(this.wonder, Math.max(48, body - 8));
      const doorX = Math.round(b.cast.x + b.cast.w * 0.5);
      const doorY = Math.round(b.cast.y + b.cast.h * 0.72);
      this.mound.setPosition(doorX, doorY);
      this.hole.setPosition(doorX, doorY - Math.round(this.mound.displayHeight * 0.04));
      const lip = this.hole.y + Math.round(this.hole.displayHeight * 0.18);
      const aliceSide = rtl() ? 1 : -1;
      this.alice.setPosition(doorX + aliceSide * Math.round(this.hole.displayWidth * 0.42), lip - Math.round(this.alice.displayHeight * 0.36));
      this.wonder.setPosition(doorX - aliceSide * Math.round(this.hole.displayWidth * 0.7), lip - Math.round(this.wonder.displayHeight * 0.36));
      this.alice.setFlipX(!!rtl());
      this.wonder.setFlipX(!rtl());
      intScale(this.butter, 22);
      intScale(this.hopper, 22);
      const edge = rtl() ? b.cast.x + 28 : b.cast.x + b.cast.w - 28;
      this.hopper.setPosition(edge, Math.round(b.cast.y + b.cast.h - 16));
      this.classText.setPosition(rtl() ? b.cast.x + b.cast.w - 168 : b.cast.x + 8, b.cast.y + 8);
      fitButton(this.seedChip, b.seeds, t("seeds") + " " + (this.save.seeds || 0), "seed");
    } else {
      hideButton(this.seedChip);
      this.classText.setVisible(false);
    }
    const field = home
      ? { x: 0, y: b.cast.y, w: w, h: Math.max(64, b.cast.h) }
      : { x: 0, y: Math.round(h * 0.22), w: w, h: Math.max(80, h - Math.round(h * 0.22)) };
    const mound = showCast ? { x: this.hole.x, y: this.hole.y } : { x: w * 0.5, y: field.y + field.h * 0.62 };
    if (this.prairie) this.prairie.layout(w, h, field, [mound], dailyWeather(), 11);
    this.tiles.forEach((tile, n) => {
      if (!home) { hideButton(tile); return; }
      const row = TILES[n];
      const word = t(row[1]) + (row[3] ? "" : "\n" + t("soon"));
      this.place(tile, b.tiles[n], word, row[3] ? row[2] : "lock");
    });
    if (home && this.wantBounce) {
      this.wantBounce = false;
      const gen = (this.bounceGen = (this.bounceGen || 0) + 1);
      window.setTimeout(() => {
        if (gen !== this.bounceGen || this.mode !== "home") return;
        this.tiles.forEach((tile, n) => bounceIn(tile.btn, n * 40));
      }, 50);
    }
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
