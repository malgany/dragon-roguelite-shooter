import Phaser from "phaser";
import "./style.css";
import { BootScene } from "./scenes/BootScene";
import { GameScene } from "./scenes/GameScene";
import { MenuScene } from "./scenes/MenuScene";
import { UpgradeScene } from "./scenes/UpgradeScene";
import { getViewportSize } from "./game/immersive";

const initialSize = getViewportSize();

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: "app",
  backgroundColor: "#101820",
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: initialSize.width,
    height: initialSize.height,
    fullscreenTarget: "app"
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

const resizeGame = () => {
  const { width, height } = getViewportSize();
  game.scale.resize(width, height);
  game.scale.refresh();
};

window.addEventListener("resize", resizeGame);
window.visualViewport?.addEventListener("resize", resizeGame);
document.addEventListener("fullscreenchange", resizeGame);
window.addEventListener("orientationchange", () => setTimeout(resizeGame, 250));
