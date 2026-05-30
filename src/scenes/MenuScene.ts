import Phaser from "phaser";
import { enterImmersiveMode, getViewportSize } from "../game/immersive";

export class MenuScene extends Phaser.Scene {
  constructor() {
    super("MenuScene");
  }

  create() {
    const { width, height } = this.scale;
    const centerX = width / 2;
    const centerY = height / 2;

    this.add.image(centerX, centerY, "title").setDisplaySize(width, height);

    const playButton = document.getElementById("play-button") as HTMLButtonElement | null;
    const startGame = async () => {
      if (playButton) {
        playButton.style.display = "none";
      }
      await enterImmersiveMode();
      const size = getViewportSize();
      this.scale.resize(size.width, size.height);
      this.scale.refresh();
      this.scene.start("GameScene", { fresh: true });
    };

    playButton?.addEventListener("click", startGame, { once: true });
    if (playButton) {
      playButton.style.display = "block";
    }

    this.add
      .text(centerX, height - 34, "Vire o celular na horizontal para jogar em tela cheia", {
        fontFamily: "Arial, sans-serif",
        fontSize: "18px",
        color: "#f6e6b6"
      })
      .setOrigin(0.5);
  }
}
