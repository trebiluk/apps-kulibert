export class Preloader extends window.Phaser.Scene {
  constructor() { super("Preloader"); }
  preload() {
    this.load.atlas("alice", "assets/sprites/alice.png", "assets/sprites/alice.json");
    this.load.audioSprite("sfx", "assets/sfx.json", ["assets/sfx.ogg", "assets/sfx.m4a"]);
  }
  create() {
    this.anims.create({ key: "alice-idle", frames: [{ key: "alice", frame: "alice-idle-0" }, { key: "alice", frame: "alice-idle-1" }, { key: "alice", frame: "alice-idle-2" }], frameRate: 3, repeat: -1 });
    this.anims.create({ key: "wonder-idle", frames: [{ key: "alice", frame: "wonder-idle-0" }, { key: "alice", frame: "wonder-idle-1" }], frameRate: 3, repeat: -1 });
    this.anims.create({ key: "hawk-glide", frames: [{ key: "alice", frame: "hawk-glide-0" }, { key: "alice", frame: "hawk-glide-1" }], frameRate: 6, repeat: -1 });
    this.anims.create({ key: "pup-idle", frames: [{ key: "alice", frame: "pup-idle-0" }, { key: "alice", frame: "pup-idle-1" }], frameRate: 3, repeat: -1 });
    this.scene.start("Burrow");
    this.scene.launch("UI");
  }
}
