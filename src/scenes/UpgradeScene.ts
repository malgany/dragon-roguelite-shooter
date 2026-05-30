import Phaser from "phaser";
import type { PlayerState } from "./GameScene";
import type { Upgrade } from "../game/upgrades";

export class UpgradeScene extends Phaser.Scene {
  private choices: Upgrade[] = [];
  private level = 2;
  private playerState!: PlayerState;
  private score = 0;

  constructor() {
    super("UpgradeScene");
  }

  init(data: { choices: Upgrade[]; level: number; playerState: PlayerState; score: number }) {
    this.choices = data.choices;
    this.level = data.level;
    this.playerState = data.playerState;
    this.score = data.score;
  }

  create() {
    this.add.tileSprite(480, 270, 960, 540, "bg-mountains").setAlpha(0.6);
    this.add.rectangle(480, 270, 960, 540, 0x101820, 0.68);
    this.add
      .text(480, 68, "Escolha uma bênção dracônica", {
        fontFamily: "Georgia, serif",
        fontSize: "38px",
        color: "#ffe9a8",
        fontStyle: "bold"
      })
      .setOrigin(0.5);
    this.add
      .text(480, 112, `Fase ${this.level - 1} vencida`, {
        fontFamily: "Arial, sans-serif",
        fontSize: "20px",
        color: "#f6e6b6"
      })
      .setOrigin(0.5);

    this.choices.forEach((upgrade, index) => this.createCard(upgrade, 210 + index * 270, 305));
  }

  private createCard(upgrade: Upgrade, x: number, y: number) {
    const card = this.add.rectangle(x, y, 230, 285, 0x17222b, 0.96).setStrokeStyle(3, 0xd99b3d);
    const icon = this.add.sprite(x, y - 72, "icons", upgrade.iconFrame).setDisplaySize(78, 78);
    const title = this.add
      .text(x, y + 5, upgrade.name, {
        fontFamily: "Georgia, serif",
        fontSize: "24px",
        color: "#ffe9a8",
        fontStyle: "bold",
        align: "center",
        wordWrap: { width: 190 }
      })
      .setOrigin(0.5);
    const description = this.add
      .text(x, y + 72, upgrade.description, {
        fontFamily: "Arial, sans-serif",
        fontSize: "17px",
        color: "#f6e6b6",
        align: "center",
        wordWrap: { width: 185 }
      })
      .setOrigin(0.5);

    const hit = this.add.zone(x, y, 230, 285).setInteractive({ useHandCursor: true });
    hit.on("pointerover", () => card.setFillStyle(0x263343, 1));
    hit.on("pointerout", () => card.setFillStyle(0x17222b, 0.96));
    hit.on("pointerdown", () => {
      upgrade.apply({ playerState: this.playerState } as never);
      this.scene.start("GameScene", {
        level: this.level,
        playerState: this.playerState,
        score: this.score
      });
    });

    this.tweens.add({
      targets: [card, icon, title, description],
      y: "-=7",
      duration: 950,
      delay: (x - 210) * 1.5,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut"
    });
  }
}
