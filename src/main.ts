import Phaser from "phaser";
import "./style.css";
import { BootScene } from "./scenes/BootScene";
import { GameScene } from "./scenes/GameScene";
import { MenuScene } from "./scenes/MenuScene";
import { UpgradeScene } from "./scenes/UpgradeScene";

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: "app",
  backgroundColor: "#101820",
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 960,
    height: 540
  },
  physics: {
    default: "arcade",
    arcade: {
      debug: false
    }
  },
  input: {
    activePointers: 3
  },
  scene: [BootScene, MenuScene, GameScene, UpgradeScene]
});

window.addEventListener("orientationchange", () => {
  setTimeout(() => game.scale.refresh(), 250);
});
