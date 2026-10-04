import { Boot } from "./scenes/Boot.js";
import { Preloader } from "./scenes/Preloader.js";
import { Burrow } from "./scenes/Burrow.js";
import { Lookout } from "./scenes/Lookout.js";
import { UI } from "./scenes/UI.js";

export function startGame() {
  const Phaser = window.Phaser;
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: "stage",
    backgroundColor: "#14506a",
    scale: { mode: Phaser.Scale.RESIZE, width: 800, height: 600 },
    physics: { default: "arcade", arcade: { debug: false } },
    scene: [Boot, Preloader, Burrow, Lookout, UI],
    audio: { disableWebAudio: false },
  });
  return game;
}
