const TEX = "lookout";

function frames(prefix, n) {
  const list = [];
  for (let i = 0; i < n; i++) list.push({ key: TEX, frame: prefix + i });
  return list;
}

export class Preloader extends window.Phaser.Scene {
  constructor() { super("Preloader"); }
  preload() {
    this.load.atlas(TEX, "assets/sprites/lookout-pixel.png", "assets/sprites/lookout-pixel.json");
    this.load.audioSprite("sfx", "assets/sfx.json", ["assets/sfx.ogg", "assets/sfx.m4a"]);
  }
  create() {
    const tex = this.textures.get(TEX);
    if (tex && tex.setFilter) tex.setFilter(window.Phaser.Textures.FilterMode.NEAREST);
    const add = (key, list, rate) => this.anims.create({ key, frames: list, frameRate: rate, repeat: -1 });
    add("alice-pop", frames("alice-pop-", 3), 6);
    add("alice-look", frames("alice-look-", 3), 4);
    add("alice-chirp", frames("alice-chirp-", 3), 6);
    add("alice-duck", frames("alice-duck-", 3), 6);
    add("alice-cheer", frames("alice-cheer-", 3), 6);
    add("alice-wave", frames("alice-wave-", 3), 6);
    add("pup-idle", frames("pup-idle-", 3), 4);
    add("pup-scurry", frames("pup-scurry-", 3), 8);
    add("wonder-idle", frames("wonder-idle-", 3), 4);
    add("wonder-hop", frames("wonder-hop-", 3), 6);
    add("wonder-wave", frames("wonder-wave-", 3), 6);
    add("hawk-fly", [{ key: TEX, frame: "hawk-flap-0" }, { key: TEX, frame: "hawk-flap-1" }, { key: TEX, frame: "hawk-swoop" }], 6);
    add("coyote-trot", frames("coyote-trot-", 4), 8);
    add("snake-slither", frames("snake-slither-", 3), 6);
    add("rabbit-hop", frames("rabbit-hop-", 3), 6);
    add("weed-roll", frames("weed-", 3), 6);
    add("butterfly", frames("butterfly-", 3), 6);
    add("hopper", frames("hopper-", 3), 6);
    add("grass-sway", frames("grass-", 3), 2);
    this.scene.start("Burrow");
    this.scene.launch("UI");
  }
}
