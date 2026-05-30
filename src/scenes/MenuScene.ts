import Phaser from "phaser";

export class MenuScene extends Phaser.Scene {
  constructor() {
    super("MenuScene");
  }

  create() {
    this.add.image(480, 270, "title").setDisplaySize(960, 540);

    const panel = this.add.rectangle(480, 428, 340, 76, 0x171c24, 0.82).setStrokeStyle(3, 0xf4bd4a);
    const label = this.add
      .text(480, 428, "JOGAR", {
        fontFamily: "Georgia, serif",
        fontSize: "34px",
        color: "#ffe9a8",
        fontStyle: "bold"
      })
      .setOrigin(0.5);

    const button = this.add.zone(480, 428, 340, 76).setInteractive({ useHandCursor: true });
    button.on("pointerover", () => panel.setFillStyle(0x263343, 0.92));
    button.on("pointerout", () => panel.setFillStyle(0x171c24, 0.82));
    button.on("pointerdown", async () => {
      if (!this.scale.isFullscreen) {
        this.scale.startFullscreen();
      }
      const orientation = screen.orientation as ScreenOrientation & { lock?: (orientation: string) => Promise<void> };
      await orientation.lock?.("landscape").catch(() => undefined);
      this.scene.start("GameScene", { fresh: true });
    });

    this.add
      .text(480, 502, "Vire o celular na horizontal para jogar em tela cheia", {
        fontFamily: "Arial, sans-serif",
        fontSize: "18px",
        color: "#f6e6b6"
      })
      .setOrigin(0.5);

    this.tweens.add({
      targets: [panel, label],
      scale: 1.04,
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut"
    });
  }
}
