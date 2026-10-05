import { t, rtl, say } from "../i18n.js";
import { saveNow, settings } from "../save.js";
import { LOOK_IDS, applyLook } from "../looks.js";

const LOOK_KEY = { teal: "lookTeal", dawn: "lookDawn", dusk: "lookDusk", night: "lookNight", gold: "lookGold", snow: "lookSnow" };

export class UI extends window.Phaser.Scene {
  constructor() { super("UI"); }
  create() {
    this.card = null;
    this.blocker = null;
    this.mode = "";
    window.addEventListener("ap-menu", () => this.open(this.mode === "menu" ? "" : "menu"));
    window.addEventListener("ap-news", () => this.open("news"));
    window.addEventListener("ap-soon", (ev) => this.open("soon", ev.detail));
    window.addEventListener("ap-pause", () => this.open("pause"));
    window.addEventListener("ap-restart", () => this.open("restart"));
    window.addEventListener("ap-help", () => this.open("help"));
    window.addEventListener("ap-end", (ev) => this.open("end", ev.detail));
    window.addEventListener("ap-classup", () => {
      if (this.scene.isActive("Lookout")) say(t("classUp"));
      else this.open("classup");
    });
    this.input.keyboard.on("keydown-ESC", () => { if (this.mode === "pause") this.resume(); else if (this.mode) this.close(); });
    this.scale.on("resize", () => { if (this.mode) this.open(this.mode, this.detail); });
    const menu = document.getElementById("game-menu");
    if (menu) menu.addEventListener("click", () => window.dispatchEvent(new CustomEvent("ap-menu")));
    document.addEventListener("click", (ev) => {
      const hit = ev.target.closest && ev.target.closest(".kb-bar .kb-menu");
      if (!hit) return;
      window.dispatchEvent(new CustomEvent("ap-menu"));
      const drawer = document.getElementById("kb-drawer");
      if (drawer) drawer.hidden = true;
      const back = document.getElementById("kb-drawer-backdrop");
      if (back) back.hidden = true;
    });
    new MutationObserver(() => {
      const drawer = document.getElementById("kb-drawer");
      if (drawer && !drawer.hidden) drawer.hidden = true;
    }).observe(document.body, { childList: true, subtree: true, attributes: true });
    const obs = new MutationObserver(() => {
      document.documentElement.dir = rtl() ? "rtl" : "ltr";
      window.dispatchEvent(new CustomEvent("ap-lang"));
    });
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-kp-lang", "data-kp-contrast", "data-kp-motion"] });
  }
  open(mode, detail) {
    if (!mode) { this.close(); return; }
    this.mode = mode;
    this.detail = detail;
    this.clear();
    const w = this.scale.width;
    const h = this.scale.height;
    this.blocker = this.add.rectangle(w / 2, h / 2, w, h, 0x06122b, 0.62).setInteractive();
    const rows = this.rows(mode, detail);
    const cardW = Math.min(360, w - 24);
    const cardH = Math.min(h - 24, 36 + rows.length * 62);
    this.card = this.add.container(w / 2, h / 2);
    const bg = this.add.rectangle(0, 0, cardW, cardH, 0x0b1f3a).setStrokeStyle(4, 0xfde68a);
    this.card.add(bg);
    rows.forEach((row, i) => {
      row.setPosition(0, -cardH / 2 + 40 + i * 62);
      this.card.add(row);
    });
    this.card.setDepth(20);
    this.blocker.setDepth(19);
    const menu = document.getElementById("game-menu");
    if (menu) menu.setAttribute("aria-expanded", mode === "menu" ? "true" : "false");
    if (mode === "end") say(detail && detail.cleared ? t("highFive") : t("nextTime"));
    if (mode === "classup") say(t("classUp"));
    document.getElementById("live").textContent = mode === "soon" ? (detail || "soon") : mode === "end" ? ((detail && detail.title) ? detail.title : "end") + " " + ((detail && detail.score) || 0) : mode === "restart" ? "restartAsk" : mode;
  }
  rows(mode, detail) {
    if (mode === "menu") return [this.btn(t("home"), () => this.home()), this.btn(t("settings"), () => this.open("settings")), this.btn(t("whatsNew"), () => this.open("news")), this.btn(t("help"), () => this.open("help")), this.btn(t("fullScreen"), () => document.getElementById("fs-btn").click()), this.btn(t("close"), () => this.close())];
    if (mode === "settings") return [this.btn(t("look") + ": " + t(LOOK_KEY[settings().look] || "lookTeal"), () => this.cycleLook()), this.btn(t("speed") + ": " + t(settings().speed === "relaxed" ? "relaxed" : "normal"), () => this.cycleSpeed()), this.btn(t("captions") + ": " + t(settings().captions === false ? "off" : "on"), () => this.cycleCaps()), this.btn(t("classTime") + ": " + this.classLabel(), () => this.cycleClass()), this.btn(t("close"), () => this.close(), true)];
    if (mode === "news") return [this.line(t("news5")), this.line(t("news4")), this.line(t("news2")), this.btn(t("close"), () => this.close(), true)];
    if (mode === "soon") return [this.line(detail || t("comingSoon")), this.line(t("comingBody")), this.btn(t("close"), () => this.close(), true)];
    if (mode === "help") return [this.line(t("tapSky")), this.line(t("tapGround")), this.line(t("tapSnake")), this.btn(t("close"), () => this.close(), true)];
    if (mode === "pause") return [this.btn(t("resume"), () => this.resume(), true), this.btn(t("restart"), () => this.open("restart")), this.btn(t("help"), () => this.open("help")), this.btn(t("home"), () => this.home())];
    if (mode === "restart") return [this.line(t("restartAsk")), this.btn(t("restart"), () => this.doRestart(), true), this.btn(t("keep"), () => this.resume())];
    if (mode === "classup") return [this.line(t("classUp")), this.btn(t("close"), () => this.close(), true)];
    const bank = detail || { score: 0, cleared: false, pay: 0, why: "", title: "lookout", desk: 0 };
    const name = t(bank.title || "lookout");
    return [this.line(name + " · " + bank.score), this.line(bank.cleared ? t("highFive") : t("nextTime")), this.line(bank.why ? t(bank.why) : t("nextTime")), this.line("+" + (bank.pay || 0) + " " + t("seeds") + " · " + t("thisDesk") + " " + (bank.desk || 0)), this.btn(t("tryAgain"), () => this.again(), true), this.btn(t("home"), () => this.home())];
  }
  classLabel() {
    const n = settings().classMin || 0;
    return n ? n + " min" : t("classOff");
  }
  cycleLook() {
    const s = settings();
    const i = LOOK_IDS.indexOf(s.look);
    s.look = LOOK_IDS[(i + 1) % LOOK_IDS.length];
    saveNow();
    applyLook(s.look);
    window.dispatchEvent(new CustomEvent("ap-look"));
    this.open("settings");
  }
  cycleSpeed() {
    const s = settings();
    s.speed = s.speed === "relaxed" ? "normal" : "relaxed";
    saveNow();
    this.open("settings");
  }
  cycleCaps() {
    const s = settings();
    s.captions = s.captions === false;
    saveNow();
    this.open("settings");
  }
  cycleClass() {
    const s = settings();
    const steps = [0, 10, 20, 40];
    const i = steps.indexOf(s.classMin || 0);
    s.classMin = steps[(i + 1) % steps.length];
    s.classStart = s.classMin ? Date.now() : 0;
    s.classRang = 0;
    saveNow();
    window.dispatchEvent(new CustomEvent("ap-home"));
    this.open("settings");
  }
  line(str) { return this.add.text(0, 0, str, { fontFamily: "Atkinson Hyperlegible", fontSize: "18px", color: "#f8fafc", wordWrap: { width: 300 }, align: "center" }).setOrigin(0.5); }
  btn(word, fn, big) {
    const Phaser = window.Phaser;
    const box = this.add.container(0, 0);
    const w = 300;
    const h = big ? 56 : 48;
    const bg = this.add.rectangle(0, 0, w, h, big ? 0xfde68a : 0x12314d).setStrokeStyle(3, 0x67e8f9);
    const label = this.add.text(0, 0, word, { fontFamily: "Atkinson Hyperlegible", fontSize: "18px", color: big ? "#042f2e" : "#f8fafc", align: "center", wordWrap: { width: 280 } }).setOrigin(0.5);
    box.add([bg, label]);
    box.setSize(w, h);
    bg.setInteractive(new Phaser.Geom.Rectangle(-w / 2, -h / 2, w, h), Phaser.Geom.Rectangle.Contains);
    bg.on("pointerdown", fn);
    return box;
  }
  clear() {
    if (this.card) this.card.destroy();
    if (this.blocker) this.blocker.destroy();
    this.card = null;
    this.blocker = null;
  }
  close() {
    this.clear();
    this.mode = "";
    const menu = document.getElementById("game-menu");
    if (menu) menu.setAttribute("aria-expanded", "false");
  }
  home() {
    this.close();
    if (this.scene.isActive("Lookout")) this.scene.stop("Lookout");
    if (!this.scene.isActive("Burrow")) this.scene.start("Burrow");
    else window.dispatchEvent(new CustomEvent("ap-home"));
    document.body.classList.remove("in-round");
  }
  resume() {
    this.close();
    const look = this.scene.get("Lookout");
    if (look && look.resumeRound) look.resumeRound();
  }
  doRestart() {
    this.close();
    const look = this.scene.get("Lookout");
    if (look && look.restart) look.restart();
  }
  again() { this.doRestart(); }
}
