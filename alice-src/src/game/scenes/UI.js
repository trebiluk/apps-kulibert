import Sizer from "phaser3-rex-plugins/templates/ui/sizer/Sizer.js";
import { t, rtl, say } from "../i18n.js";

export class UI extends window.Phaser.Scene {
  constructor() { super("UI"); }
  create() {
    this.card = null;
    this.blocker = null;
    window.addEventListener("ap-menu", () => this.open("menu"));
    window.addEventListener("ap-news", () => this.open("news"));
    window.addEventListener("ap-soon", (ev) => this.open("soon", ev.detail));
    window.addEventListener("ap-pause", () => this.open("pause"));
    window.addEventListener("ap-restart", () => this.open("restart"));
    window.addEventListener("ap-help", () => this.open("help"));
    window.addEventListener("ap-end", (ev) => this.open("end", ev.detail));
    this.input.keyboard.on("keydown-ESC", () => {
      if (this.mode === "pause") this.resume();
      else this.close();
    });
    this.scale.on("resize", () => { if (this.card) this.open(this.mode, this.detail); });
    const obs = new MutationObserver(() => {
      const html = document.documentElement;
      html.dir = rtl() ? "rtl" : "ltr";
      html.lang = html.getAttribute("data-kp-lang") || "en";
      window.dispatchEvent(new CustomEvent("ap-lang"));
    });
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-kp-lang", "data-kp-contrast", "data-kp-motion"] });
    const menu = document.getElementById("game-menu");
    if (menu) menu.addEventListener("click", () => this.open(this.mode === "menu" ? "" : "menu"));
    document.addEventListener("click", (ev) => {
      const hit = ev.target.closest && ev.target.closest(".kb-menu");
      if (hit) { ev.preventDefault(); this.open(this.mode === "menu" ? "" : "menu"); const d = document.getElementById("kb-drawer"); if (d) d.hidden = true; }
    });
  }
  open(mode, detail) {
    if (!mode) { this.close(); return; }
    this.mode = mode;
    this.detail = detail;
    if (this.card) this.card.destroy();
    if (this.blocker) this.blocker.destroy();
    const w = this.scale.width;
    const h = this.scale.height;
    this.blocker = this.add.rectangle(w / 2, h / 2, w, h, 0x06122b, 0.55).setInteractive();
    const rows = this.rows(mode, detail);
    const bg = this.add.rectangle(0, 0, 380, 40 + rows.length * 60, 0x0b1f3a).setStrokeStyle(3, 0x14b8a6);
    this.card = new Sizer(this, w / 2, h / 2, Math.min(380, w - 24), 40 + rows.length * 60, { orientation: 1, space: { item: 8, top: 12, bottom: 12 } });
    this.card.addBackground(bg);
    rows.forEach((row) => this.card.add(row));
    this.card.layout();
    const menu = document.getElementById("game-menu");
    if (menu) menu.setAttribute("aria-expanded", mode === "menu" ? "true" : "false");
    if (mode === "end") say(detail && detail.cleared ? t("highFive") : t("nextTime"));
  }
  rows(mode, detail) {
    if (mode === "menu") return [this.btn(t("home"), () => this.home()), this.btn(t("whatsNew"), () => this.open("news")), this.btn(t("help"), () => this.open("help")), this.btn(t("fullScreen"), () => document.getElementById("fs-btn").click()), this.btn(t("close"), () => this.close())];
    if (mode === "news") return [this.text(t("whatsNew")), this.text(t("news2")), this.text(t("news")), this.btn(t("close"), () => this.close(), true)];
    if (mode === "soon") return [this.text(detail || t("comingSoon")), this.text(t("comingBody")), this.btn(t("close"), () => this.close(), true)];
    if (mode === "help") return [this.text(t("what")), this.text(t("tapSky")), this.text(t("tapGround")), this.text(t("tapSnake")), this.btn(t("close"), () => this.close(), true)];
    if (mode === "pause") return [this.btn(t("resume"), () => this.resume(), true), this.btn(t("restart"), () => this.open("restart")), this.btn(t("help"), () => this.open("help")), this.btn(t("home"), () => this.home())];
    if (mode === "restart") return [this.text(t("restartAsk")), this.btn(t("restart"), () => this.doRestart(), true), this.btn(t("keep"), () => this.resume())];
    const bank = detail || { score: 0, cleared: false, pay: 0, why: "" };
    return [this.text(String(bank.score)), this.text(bank.cleared ? t("highFive") : t("nextTime")), this.text(bank.why ? t(bank.why) : ""), this.text("+" + (bank.pay || 0) + " " + t("seeds")), this.btn(t("tryAgain"), () => this.again(), true), this.btn(t("home"), () => this.home())];
  }
  text(str) { return this.add.text(0, 0, str, { fontFamily: "Atkinson Hyperlegible", fontSize: "18px", color: "#f8fafc", wordWrap: { width: 320 } }); }
  btn(word, fn, big) {
    const box = this.add.container(0, 0);
    const w = 300;
    const h = big ? 64 : 48;
    const bg = this.add.rectangle(0, 0, w, h, big ? 0x14b8a6 : 0x12314d).setStrokeStyle(2, 0x67e8f9);
    const label = this.add.text(0, 0, word, { fontFamily: "Atkinson Hyperlegible", fontSize: big ? "22px" : "18px", color: big ? "#042f2e" : "#f8fafc" }).setOrigin(0.5);
    box.add([bg, label]);
    box.setSize(w, h);
    bg.setInteractive({ useHandCursor: true });
    bg.on("pointerdown", fn);
    return box;
  }
  close() {
    if (this.card) this.card.destroy();
    if (this.blocker) this.blocker.destroy();
    this.card = null;
    this.blocker = null;
    this.mode = "";
    const menu = document.getElementById("game-menu");
    if (menu) { menu.setAttribute("aria-expanded", "false"); menu.focus(); }
  }
  home() {
    this.close();
    if (this.scene.isActive("Lookout")) this.scene.stop("Lookout");
    this.scene.start("Burrow");
    window.dispatchEvent(new CustomEvent("ap-home"));
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
