import { t, rtl, say } from "../i18n.js";
import { saveNow, settings } from "../save.js";
import { LOOK_IDS, applyLook } from "../looks.js";
import { bands, poseNow } from "../ui/bands.js";
import { hideCard, fitButton, makeButton, showCard } from "../ui/widgets.js";
import { lite, motionOff, syncMusic, wantsCanvas } from "../fx.js";

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
    document.documentElement.dir = rtl() ? "rtl" : "ltr";
    motionOff();
    lite();
  }
  open(mode, detail) {
    if (!mode) { this.close(); return; }
    this.mode = mode;
    this.detail = detail;
    this.clear();
    const look = this.scene.get("Lookout");
    if (look && look.holdForCard) look.holdForCard();
    const w = this.scale.width;
    const h = this.scale.height;
    const pose = poseNow(window.innerWidth || w, window.innerHeight || h);
    const b = bands(w, h, { rtl: rtl(), pose, viewW: window.innerWidth || w, viewH: window.innerHeight || h });
    const rows = this.rows(mode, detail);
    const area = b.below;
    const gap = 6;
    const rowh = 48;
    const need = (cols) => {
      const nRows = Math.ceil(rows.length / cols);
      return nRows * rowh + Math.max(0, nRows - 1) * gap;
    };
    let cols = 1;
    if (need(1) > area.h) cols = 2;
    if (need(cols) > area.h) cols = 3;
    const gridH = need(cols);
    const gridW = Math.min(area.w, cols === 1 ? Math.min(420, area.w) : area.w);
    const colW = Math.floor((gridW - gap * (cols - 1)) / cols);
    const ox = area.x + Math.floor((area.w - (cols * colW + (cols - 1) * gap)) / 2);
    const oy = area.y + Math.max(0, Math.min(area.h - gridH, Math.floor((area.h - gridH) / 2)));
    this.domRows = rows;
    rows.forEach((row, i) => {
      const c = i % cols;
      const r = Math.floor(i / cols);
      const rect = { x: ox + c * (colW + gap), y: oy + r * (rowh + gap), w: colW, h: rowh };
      fitButton(row, rect, row.getData("word"), row.getData("frame"));
      if (row.getData("plain")) row.getData("bg").setFillStyle();
    });
    const pad = 8;
    const top = Math.max(b.chrome.h, oy - pad);
    const panelW = Math.min(w - 8, cols * colW + (cols - 1) * gap + pad * 2);
    const panelH = Math.max(rowh, Math.min(b.plate.y - top - 4, gridH + pad * 2));
    showCard({ x: Math.max(4, ox - pad), y: top, w: panelW, h: panelH });
    const menu = document.getElementById("game-menu");
    if (menu) menu.setAttribute("aria-expanded", mode === "menu" ? "true" : "false");
    if (mode === "end") say(detail && detail.cleared ? t("highFive") : t("nextTime"));
    if (mode === "classup") say(t("classUp"));
    const live = document.getElementById("live");
    if (live) live.textContent = mode === "soon" ? (detail || "soon") : mode === "end" ? ((detail && detail.title) ? detail.title : "end") + " " + ((detail && detail.score) || 0) : mode === "restart" ? "restartAsk" : mode;
  }
  rows(mode, detail) {
    if (mode === "menu") return [this.btn(t("home"), () => this.home()), this.btn(t("settings"), () => this.open("settings")), this.btn(t("whatsNew"), () => this.open("news")), this.btn(t("help"), () => this.open("help")), this.btn(t("fullScreen"), () => document.getElementById("fs-btn").click()), this.btn(t("close"), () => this.close())];
    if (mode === "settings") return [
      this.btn(t("look") + ": " + t(LOOK_KEY[settings().look] || "lookTeal"), () => this.cycleLook()),
      this.btn(t("speed") + ": " + t(settings().speed === "relaxed" ? "relaxed" : "normal"), () => this.cycleSpeed()),
      this.btn(t("captions") + ": " + t(settings().captions === false ? "off" : "on"), () => this.cycleCaps()),
      this.btn(t("classTime") + ": " + this.classLabel(), () => this.cycleClass()),
      this.btn(t("lessMotion") + ": " + t(motionOff() ? "on" : "off"), () => this.cycleMotion(), false, "butterfly-0"),
      this.btn(t("lite") + ": " + this.liteLabel(), () => this.cycleLite(), false, "cloud"),
      this.btn(t("sound") + ": " + t(settings().sound === false ? "off" : "on"), () => this.cycleSound(), false, "speaker"),
      this.btn(t("music") + ": " + t(settings().music === true ? "on" : "off"), () => this.cycleMusic(), false, "star"),
      this.btn(t("close"), () => this.close(), true),
    ];
    if (mode === "news") return [this.line(t("news9")), this.line(t("news8")), this.line(t("news7")), this.line(t("news6")), this.line(t("news5")), this.line(t("news4")), this.line(t("news2")), this.btn(t("close"), () => this.close(), true)];
    if (mode === "soon") return [this.line(detail || t("comingSoon")), this.line(t("comingBody")), this.btn(t("close"), () => this.close(), true)];
    if (mode === "help") return [this.line(t("tapSky")), this.line(t("tapGround")), this.line(t("tapSnake")), this.btn(t("close"), () => this.close(), true)];
    if (mode === "pause") return [this.btn(t("resume"), () => this.resume(), true), this.btn(t("restart"), () => this.open("restart")), this.btn(t("help"), () => this.open("help")), this.btn(t("home"), () => this.home())];
    if (mode === "restart") return [this.line(t("restartAsk")), this.btn(t("restart"), () => this.doRestart(), true), this.btn(t("keep"), () => this.resume())];
    if (mode === "classup") return [this.line(t("classUp")), this.btn(t("close"), () => this.close(), true)];
    const bank = detail || { score: 0, cleared: false, pay: 0, why: "", title: "lookout", desk: 0 };
    const name = t(bank.title || "lookout");
    const rows = [this.line(name + " · " + bank.score), this.line(bank.cleared ? t("highFive") : t("nextTime"))];
    if (bank.why) rows.push(this.line(t(bank.why)));
    rows.push(this.line("+" + (bank.pay || 0) + " " + t("seeds") + " · " + t("thisDesk") + " " + (bank.desk || 0)));
    rows.push(this.btn(t("tryAgain"), () => this.again(), true));
    rows.push(this.btn(t("home"), () => this.home()));
    return rows;
  }
  liteLabel() {
    const mode = settings().lite || "auto";
    if (mode === "on") return t("on");
    if (mode === "off") return t("off");
    return t("auto");
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
  cycleMotion() {
    const s = settings();
    s.motion = s.motion === "less" ? "full" : "less";
    saveNow();
    motionOff();
    this.open("settings");
  }
  cycleLite() {
    const before = wantsCanvas(settings());
    const s = settings();
    const order = ["auto", "on", "off"];
    const i = Math.max(0, order.indexOf(s.lite || "auto"));
    s.lite = order[(i + 1) % order.length];
    if (s.lite !== "auto") s.liteAuto = false;
    saveNow();
    const after = wantsCanvas(settings());
    if (after !== before || s.lite === "on" || s.lite === "off") { location.reload(); return; }
    this.open("settings");
  }
  cycleSound() {
    const s = settings();
    s.sound = s.sound === false;
    saveNow();
    this.open("settings");
  }
  cycleMusic() {
    const s = settings();
    s.music = s.music !== true;
    saveNow();
    syncMusic();
    this.open("settings");
  }
  line(str) {
    const box = makeButton(this, "line", () => {}, { card: true });
    box.setData("word", str);
    box.setData("frame", null);
    box.setData("plain", true);
    return box;
  }
  btn(word, fn, big, frame) {
    const box = makeButton(this, "ui-" + word, fn, { card: true });
    box.setData("word", word);
    box.setData("frame", frame || null);
    box.setData("big", !!big);
    return box;
  }
  clear() {
    if (this.domRows) this.domRows.forEach((row) => row.destroy());
    this.domRows = null;
    if (this.card) this.card.destroy();
    if (this.blocker) this.blocker.destroy();
    this.card = null;
    this.blocker = null;
  }
  close() {
    this.clear();
    hideCard();
    this.mode = "";
    const look = this.scene.get("Lookout");
    if (look && look.releaseForCard) look.releaseForCard();
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
