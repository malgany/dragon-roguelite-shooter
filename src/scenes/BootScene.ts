import Phaser from "phaser";

export class BootScene extends Phaser.Scene {
  constructor() {
    super("BootScene");
  }

  preload() {
    this.load.image("title", "assets/title.png");
    this.load.image("bg-sky", "assets/bg-sky.png");
    this.load.image("bg-mountains", "assets/bg-mountains.png");
    this.load.image("bg-forest", "assets/bg-forest.png");
    this.load.spritesheet("dragon", "assets/dragon.png", { frameWidth: 543, frameHeight: 724 });
    this.load.spritesheet("enemies", "assets/enemies.png", { frameWidth: 512, frameHeight: 512 });
    this.load.spritesheet("icons", "assets/icons.png", { frameWidth: 418, frameHeight: 418 });
    this.load.image("boss", "assets/boss.png");
  }

  create() {
    this.makeProjectileTextures();
    this.anims.create({
      key: "dragon-fly",
      frames: this.anims.generateFrameNumbers("dragon", { start: 0, end: 3 }),
      frameRate: 8,
      repeat: -1
    });
    this.scene.start("MenuScene");
  }

  private makeProjectileTextures() {
    const flame = this.add.graphics();
    flame.fillStyle(0xffd35a, 1);
    flame.fillEllipse(16, 8, 30, 14);
    flame.fillStyle(0xff5a2a, 1);
    flame.fillEllipse(9, 8, 15, 9);
    flame.generateTexture("flame", 32, 16);
    flame.destroy();

    const bolt = this.add.graphics();
    bolt.fillStyle(0x9bd7ff, 1);
    bolt.fillCircle(8, 8, 8);
    bolt.generateTexture("enemy-bolt", 16, 16);
    bolt.destroy();
  }
}
