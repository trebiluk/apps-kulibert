export class Boot extends window.Phaser.Scene {
  constructor() { super("Boot"); }
  create() {
    this.cameras.main.roundPixels = true;
    this.scene.start("Preloader");
  }
}
