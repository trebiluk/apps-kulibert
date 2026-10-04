import Sizer from "phaser3-rex-plugins/templates/ui/sizer/Sizer.js";
import { t, rtl, say } from "../i18n.js";

export class UI extends window.Phaser.Scene {
  constructor() { super("UI"); }
  create() {
    this.card = null;
    this.debug = null;
    window.addEventListener("ap-menu", () => this.open("menu"));
    window.addEventListener("ap-news", () => this.open("news"));
    window.addEventListener("ap-soon", () => this.open("soon"));
    window.addEventListener("ap-pause", () => this.open("pause"));
    window.addEventListener("ap-end", (ev) => this.open("end", ev.detail));
    window.addEventListener("ap-lang", () => { if (this.card) this.open(this.mode, this.detail); });
    this.input.keyboard.on("keydown-ESC", () => this.close());
    this.scale.on("resize", () => { if (this.card) this.open(this.mode, this.detail); this.drawDebug(); });
    const obs = new MutationObserver(() => {
      const html = document.documentElement;
      html.dir = rtl() ? "rtl" : "ltr";
      html.lang = html.getAttribute("data-kp-lang") || "en";
      html.setAttribute("data-ap-theme", html.getAttribute("data-kp-contrast") === "1" ? "contrast" : "teal");
      window.dispatchEvent(new CustomEvent("ap-lang"));
    });
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-kp-lang", "data-kp-contrast", "data-kp-motion"] });
    this.drawDebug();
  }
  open(mode, detail) {
    this.mode = mode;
    this.detail = detail;
    if (this.card) this.card.destroy();
    const w = this.scale.width;
    const h = this.scale.height;
    const rows = this.rows(mode, detail);
    this.card = new Sizer(this, w / 2, h / 2, Math.min(420, w - 24), 40 + rows.length * 64, { orientation: 1, space: { item: 8, top: 12, bottom: 12, left: 12, right: 12 } });
    const bg = this.add.rectangle(0, 0, 420, 320, 0x0b1f3a).setStrokeStyle(3, 0x14b8a6);
    this.card.addBackground(bg);
    rows.forEach((row) => this.card.add(row, { expand: true }));
    this.card.layout();
    document.getElementById("game-menu").setAttribute("aria-expanded", mode === "menu" ? "true" : "false");
  }
  rows(mode, detail) {
    if (mode === "menu") return [this.btn(t("home"), () => this.home()), this.btn(t("whatsNew"), () => this.open("news")), this.btn(t("fullScreen"), () => document.getElementById("fs-btn").click()), this.btn(t("close"), () => this.close())];
    if (mode === "news") return [this.text(t("whatsNew")), this.text(t("news")), this.text(t("newsOld")), this.btn(t("close"), () => this.close(), true)];
    if (mode === "soon") return [this.text(t("comingSoon")), this.text(t("comingBody")), this.btn(t("close"), () => this.close(), true)];
    if (mode === "pause") return [this.text(t("pause")), this.btn(t("resume"), () => this.resume(), true), this.btn(t("home"), () => this.home())];
    const bank = detail || { score: 0, cleared: false };
    return [this.text(String(bank.score)), this.text(bank.cleared ? t("kindLine") : t("missLine")), this.btn(t("tryAgain"), () => this.again(), true), this.btn(t("home"), () => this.home())];
  }
  text(str) {
    return this.add.text(0, 0, str, { fontFamily: "Atkinson Hyperlegible", fontSize: "20px", color: "#f8fafc", wordWrap: { width: 360 } });
  }
  btn(word, fn, big) {
    const Phaser = window.Phaser;
    const box = this.add.container(0, 0);
    const bg = this.add.rectangle(0, 0, 320, big ? 64 : 48, big ? 0x14b8a6 : 0x12314d).setStrokeStyle(2, 0x67e8f9);
    const label = this.add.text(0, 0, word, { fontFamily: "Atkinson Hyperlegible", fontSize: big ? "24px" : "18px", color: big ? "#042f2e" : "#f8fafc" }).setOrigin(0.5);
    const ring = this.add.rectangle(0, 0, 320, big ? 64 : 48).setStrokeStyle(3, 0x22d3ee).setVisible(false);
    box.add([bg, label, ring]);
    box.setSize(320, big ? 64 : 48);
    box.setInteractive(new Phaser.Geom.Rectangle(-160, big ? -32 : -24, 320, big ? 64 : 48), Phaser.Geom.Rectangle.Contains);
    box.on("pointerdown", fn);
    box.on("pointerover", () => ring.setVisible(true));
    box.on("pointerout", () => ring.setVisible(false));
    return box;
  }
  close() {
    if (this.card) this.card.destroy();
    this.card = null;
    document.getElementById("game-menu").setAttribute("aria-expanded", "false");
    document.getElementById("game-menu").focus();
  }
  home() {
    this.close();
    if (this.scene.isActive("Lookout")) this.scene.stop("Lookout");
    this.scene.start("Burrow");
    document.body.classList.remove("in-round");
  }
  resume() {
    this.close();
    const look = this.scene.get("Lookout");
    if (look && look.resumeRound) look.resumeRound();
  }
  again() {
    this.close();
    this.scene.start("Lookout");
  }
  drawDebug() {
    const q = new URLSearchParams(location.search);
    const host = location.hostname;
    const allow = q.get("debug") === "1" && (host === "localhost" || host === "127.0.0.1" || host.includes("preview") || host.endsWith(".vercel.app"));
    if (!allow) return;
    if (this.debug) this.debug.destroy();
    this.debug = this.add.text(8, 80, "debug", { fontSize: "12px", color: "#fde68a" });
  }
}
