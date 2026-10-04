export class Boot extends window.Phaser.Scene {
  constructor() { super("Boot"); }
  create() { this.scene.start("Preloader"); }
}
