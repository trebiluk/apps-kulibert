import { Boot } from "./scenes/Boot.js";
import { Preloader } from "./scenes/Preloader.js";
import { Burrow } from "./scenes/Burrow.js";
import { Lookout } from "./scenes/Lookout.js";
import { UI } from "./scenes/UI.js";
import { loadSave, settings } from "./save.js";
import { applyLook, skyOf } from "./looks.js";
import { lite, markGesture, noteFrame } from "./fx.js";

export function startGame() {
  loadSave();
  applyLook(settings().look);
  const Phaser = window.Phaser;
  const game = new Phaser.Game({
    type: lite() ? Phaser.CANVAS : Phaser.AUTO,
    parent: "stage",
    backgroundColor: skyOf(settings().look),
    scale: { mode: Phaser.Scale.RESIZE, width: 800, height: 600 },
    render: { pixelArt: true, roundPixels: true, antialias: false, antialiasGL: false },
    physics: { default: "arcade", arcade: { debug: false } },
    scene: [Boot, Preloader, Burrow, Lookout, UI],
    audio: { disableWebAudio: false },
    fps: { target: 60 },
  });
  game.events.on("prestep", () => noteFrame(game.loop.rawDelta || 0));
  window.addEventListener("pointerdown", () => markGesture());
  return game;
}
