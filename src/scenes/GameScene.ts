import Phaser from "phaser";
import { pickUpgrades, type Upgrade } from "../game/upgrades";

type Enemy = Phaser.Physics.Arcade.Sprite & { hp: number; score: number };
type Boss = Phaser.Physics.Arcade.Image & { hp: number; maxHp: number; nextShot: number };
type Flame = Phaser.Physics.Arcade.Image & { damage: number; pierce: number };

export type PlayerState = {
  health: number;
  maxHealth: number;
  shields: number;
  speed: number;
  spread: number;
  damage: number;
  piercing: number;
  orbs: number;
  explosive: number;
  fireDelay: number;
  projectileSpeed: number;
  storm: number;
};

const defaultPlayerState = (): PlayerState => ({
  health: 4,
  maxHealth: 4,
  shields: 0,
  speed: 290,
  spread: 0,
  damage: 1,
  piercing: 0,
  orbs: 0,
  explosive: 0,
  fireDelay: 210,
  projectileSpeed: 520,
  storm: 0
});

export class GameScene extends Phaser.Scene {
  playerState: PlayerState = defaultPlayerState();
  private player!: Phaser.Physics.Arcade.Sprite;
  private flames!: Phaser.Physics.Arcade.Group;
  private enemies!: Phaser.Physics.Arcade.Group;
  private enemyBolts!: Phaser.Physics.Arcade.Group;
  private boss?: Boss;
  private level = 1;
  private score = 0;
  private lastFire = 0;
  private lastOrbFire = 0;
  private nextWave = 0;
  private elapsed = 0;
  private bossSpawned = false;
  private invulnerableUntil = 0;
  private target = new Phaser.Math.Vector2(170, 270);
  private sky!: Phaser.GameObjects.TileSprite;
  private mountains!: Phaser.GameObjects.TileSprite;
  private midforest!: Phaser.GameObjects.TileSprite;
  private foreground!: Phaser.GameObjects.TileSprite;
  private hpText!: Phaser.GameObjects.Text;
  private scoreText!: Phaser.GameObjects.Text;
  private levelText!: Phaser.GameObjects.Text;
  private bossBar!: Phaser.GameObjects.Rectangle;

  constructor() {
    super("GameScene");
  }

  init(data: { fresh?: boolean; level?: number; playerState?: PlayerState; score?: number }) {
    this.playerState = data.fresh ? defaultPlayerState() : data.playerState ?? defaultPlayerState();
    this.level = data.level ?? 1;
    this.score = data.score ?? 0;
    this.elapsed = 0;
    this.bossSpawned = false;
    this.boss = undefined;
  }

  create() {
    this.createWorld();
    this.createActors();
    this.createHud();
    this.input.on("pointermove", (pointer: Phaser.Input.Pointer) => {
      if (pointer.isDown) this.target.set(pointer.x, pointer.y);
    });
    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => this.target.set(pointer.x, pointer.y));
  }

  update(time: number, delta: number) {
    this.elapsed += delta;
    this.scrollBackground(delta);
    this.movePlayer(delta);
    this.autoFire(time);
    this.spawnWaves(time);
    this.updateEnemies(time);
    this.updateBoss(time);
    this.cleanup();
    this.updateHud();
  }

  private createWorld() {
    const width = this.scale.width;
    const height = this.scale.height;
    const centerX = width / 2;
    const centerY = height / 2;

    this.physics.world.setBounds(0, 0, width, height);
    this.cameras.main.setBounds(0, 0, width, height);

    this.sky = this.add.tileSprite(centerX, centerY, width, height, "bg-sky").setDisplaySize(width, height);
    this.mountains = this.add.tileSprite(centerX, centerY + height * 0.08, width, height, "bg-mountains").setDisplaySize(width, height);
    this.midforest = this.add.tileSprite(centerX, centerY + height * 0.15, width, height, "bg-midforest").setDisplaySize(width, height);
    this.foreground = this.add.tileSprite(centerX, centerY + height * 0.18, width, height, "bg-foreground").setDisplaySize(width, height);
    this.add.rectangle(centerX, height - 18, width, 36, 0x101820, 0.36);
  }

  private createActors() {
    this.flames = this.physics.add.group();
    this.enemies = this.physics.add.group();
    this.enemyBolts = this.physics.add.group();
    this.player = this.physics.add
      .sprite(Math.min(150, this.scale.width * 0.18), this.scale.height * 0.5, "dragon", 0)
      .setScale(0.14)
      .play("dragon-fly");
    this.player.body?.setSize(230, 210).setOffset(150, 260);
    this.player.setCollideWorldBounds(true);

    this.physics.add.overlap(this.flames, this.enemies, (flame, enemy) => this.hitEnemy(flame as Flame, enemy as Enemy));
    this.physics.add.overlap(this.player, this.enemies, () => this.damagePlayer());
    this.physics.add.overlap(this.player, this.enemyBolts, (_player, bolt) => {
      bolt.destroy();
      this.damagePlayer();
    });
    this.physics.add.overlap(this.flames, this.enemyBolts, (flame, bolt) => {
      if (this.playerState.storm > 0) {
        flame.destroy();
        bolt.destroy();
      }
    });
  }

  private createHud() {
    const width = this.scale.width;
    const textStyle = { fontFamily: "Arial, sans-serif", fontSize: "20px", color: "#ffe9a8" };
    this.hpText = this.add.text(18, 14, "", textStyle).setScrollFactor(0);
    this.scoreText = this.add.text(width / 2, 14, "", textStyle).setOrigin(0.5, 0).setScrollFactor(0);
    this.levelText = this.add.text(width - 18, 14, "", textStyle).setOrigin(1, 0).setScrollFactor(0);
    this.add.rectangle(width / 2, 50, 360, 12, 0x331717, 0.82).setScrollFactor(0);
    this.bossBar = this.add.rectangle(width / 2 - 180, 50, 0, 12, 0xff684a, 0.95).setOrigin(0, 0.5).setScrollFactor(0);
  }

  private scrollBackground(delta: number) {
    this.sky.tilePositionX += delta * 0.012;
    this.mountains.tilePositionX += delta * 0.035;
    this.midforest.tilePositionX += delta * 0.06;
    this.foreground.tilePositionX += delta * 0.105;
  }

  private movePlayer(delta: number) {
    const maxX = Math.min(this.scale.width * 0.48, 455);
    this.target.x = Phaser.Math.Clamp(this.target.x, 38, maxX);
    this.target.y = Phaser.Math.Clamp(this.target.y, 30, this.scale.height - 30);
    const t = 1 - Math.pow(0.001, delta / 1000);
    this.player.x = Phaser.Math.Linear(this.player.x, this.target.x, t * (this.playerState.speed / 260));
    this.player.y = Phaser.Math.Linear(this.player.y, this.target.y, t * (this.playerState.speed / 260));
  }

  private autoFire(time: number) {
    if (time < this.lastFire + this.playerState.fireDelay) return;
    this.lastFire = time;
    this.fireAt(this.player.x + 62, this.player.y, 0);
    if (this.playerState.spread > 0) {
      this.fireAt(this.player.x + 52, this.player.y - 20, -120);
      this.fireAt(this.player.x + 52, this.player.y + 20, 120);
    }
    if (this.playerState.spread > 1) {
      this.fireAt(this.player.x + 42, this.player.y - 34, -210);
      this.fireAt(this.player.x + 42, this.player.y + 34, 210);
    }
    if (this.playerState.orbs > 0 && time > this.lastOrbFire + 430) {
      this.lastOrbFire = time;
      this.fireAt(this.player.x + 20, this.player.y - 58, -40);
      if (this.playerState.orbs > 1) this.fireAt(this.player.x + 20, this.player.y + 58, 40);
    }
  }

  private fireAt(x: number, y: number, vy: number) {
    const flame = this.flames.create(x, y, "flame") as Flame;
    flame.damage = this.playerState.damage;
    flame.pierce = this.playerState.piercing;
    flame.setVelocity(this.playerState.projectileSpeed, vy);
    flame.setScale(1 + this.playerState.damage * 0.08);
  }

  private spawnWaves(time: number) {
    if (this.bossSpawned) return;
    if (this.elapsed > 36_000 + this.level * 2500) {
      this.spawnBoss();
      return;
    }
    if (time < this.nextWave) return;
    this.nextWave = time + Math.max(760, 1550 - this.level * 90);
    const count = Phaser.Math.Between(2, Math.min(6, 3 + this.level));
    const pattern = Phaser.Math.Between(0, 2);
    for (let i = 0; i < count; i++) {
      const y = pattern === 0 ? 70 + i * 62 : Phaser.Math.Between(55, this.scale.height - 55);
      this.spawnEnemy(this.scale.width + 80 + i * 58, y, Phaser.Math.Between(0, 5));
    }
  }

  private spawnEnemy(x: number, y: number, frame: number) {
    const enemy = this.enemies.create(x, y, "enemies", frame) as Enemy;
    enemy.hp = 1 + Math.floor(this.level / 2) + (frame === 5 ? 2 : 0);
    enemy.score = 80 + frame * 12;
    enemy.setScale(frame === 5 ? 0.19 : 0.13);
    enemy.setVelocity(-150 - this.level * 12 - frame * 5, Math.sin(x) * 35);
    enemy.body?.setSize(250, 250).setOffset(130, 130);
  }

  private updateEnemies(time: number) {
    this.enemies.children.each((child) => {
      const enemy = child as Enemy;
      enemy.y += Math.sin((time + enemy.x * 7) / 430) * 0.7;
      if (Phaser.Math.Between(0, 1000) < 5 + this.level) {
        const bolt = this.enemyBolts.create(enemy.x - 42, enemy.y, "enemy-bolt") as Phaser.Physics.Arcade.Image;
        bolt.setVelocity(-260 - this.level * 12, Phaser.Math.Between(-70, 70));
      }
      return true;
    });
  }

  private spawnBoss() {
    this.bossSpawned = true;
    this.boss = this.physics.add.image(this.scale.width + 140, this.scale.height / 2, "boss").setScale(0.28) as Boss;
    this.boss.hp = 18 + this.level * 9;
    this.boss.maxHp = this.boss.hp;
    this.boss.nextShot = 0;
    this.boss.setVelocityX(-80);
    this.boss.body?.setSize(760, 520).setOffset(390, 260);
    this.physics.add.overlap(this.flames, this.boss, (flame, boss) => this.hitBoss(flame as Flame, boss as Boss));
    this.physics.add.overlap(this.player, this.boss, () => this.damagePlayer());
  }

  private updateBoss(time: number) {
    if (!this.boss?.active) return;
    if (this.boss.x > this.scale.width - 180) this.boss.setVelocityX(-70);
    else {
      this.boss.setVelocityX(0);
      this.boss.y = this.scale.height / 2 + Math.sin(time / 600) * Math.min(110, this.scale.height * 0.23);
    }
    if (time > this.boss.nextShot) {
      this.boss.nextShot = time + Math.max(520, 1100 - this.level * 65);
      [-85, -30, 30, 85].forEach((vy) => {
        const bolt = this.enemyBolts.create(this.boss!.x - 132, this.boss!.y, "enemy-bolt") as Phaser.Physics.Arcade.Image;
        bolt.setVelocity(-320 - this.level * 10, vy);
        bolt.setScale(1.25);
      });
    }
  }

  private hitEnemy(flame: Flame, enemy: Enemy) {
    enemy.hp -= flame.damage;
    if (flame.pierce > 0) flame.pierce -= 1;
    else flame.destroy();
    if (enemy.hp > 0) return;
    const x = enemy.x;
    const y = enemy.y;
    this.score += enemy.score;
    enemy.destroy();
    if (this.playerState.explosive > 0) {
      this.addExplosion(x, y);
      this.enemies.children.each((child) => {
        const other = child as Enemy;
        if (Phaser.Math.Distance.Between(x, y, other.x, other.y) < 120 + this.playerState.explosive * 35) {
          other.hp -= this.playerState.damage;
          if (other.hp <= 0) other.destroy();
        }
        return true;
      });
    }
  }

  private hitBoss(flame: Flame, boss: Boss) {
    boss.hp -= flame.damage;
    if (flame.pierce > 0) flame.pierce -= 1;
    else flame.destroy();
    if (boss.hp <= 0) {
      this.score += 2500 + this.level * 500;
      this.addExplosion(boss.x, boss.y, 2);
      boss.destroy();
      this.time.delayedCall(700, () => this.openUpgradeChoices());
    }
  }

  private damagePlayer() {
    const now = this.time.now;
    if (now < this.invulnerableUntil) return;
    this.invulnerableUntil = now + 1050;
    if (this.playerState.shields > 0) this.playerState.shields -= 1;
    else this.playerState.health -= 1;
    this.cameras.main.shake(160, 0.01);
    this.tweens.add({ targets: this.player, alpha: 0.25, duration: 90, yoyo: true, repeat: 5 });
    if (this.playerState.health <= 0) this.gameOver();
  }

  private openUpgradeChoices() {
    const choices = pickUpgrades(3);
    this.scene.start("UpgradeScene", {
      choices,
      level: this.level + 1,
      playerState: this.playerState,
      score: this.score
    });
  }

  private gameOver() {
    this.physics.pause();
    const width = this.scale.width;
    const height = this.scale.height;
    this.add.rectangle(width / 2, height / 2, width, height, 0x090b10, 0.76);
    this.add.text(width / 2, height * 0.38, "FIM DA JORNADA", { fontSize: "44px", color: "#ffe9a8", fontStyle: "bold" }).setOrigin(0.5);
    this.add.text(width / 2, height * 0.5, `Pontuacao: ${this.score}`, { fontSize: "26px", color: "#f6e6b6" }).setOrigin(0.5);
    const restart = this.add
      .text(width / 2, height * 0.65, "TOCAR PARA RECOMECAR", { fontSize: "28px", color: "#ffcf63", fontStyle: "bold" })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    restart.on("pointerdown", () => this.scene.start("GameScene", { fresh: true }));
  }

  private addExplosion(x: number, y: number, scale = 1) {
    const burst = this.add.circle(x, y, 24 * scale, 0xffb347, 0.75);
    this.tweens.add({
      targets: burst,
      scale: 4,
      alpha: 0,
      duration: 260,
      onComplete: () => burst.destroy()
    });
  }

  private cleanup() {
    [this.flames, this.enemies, this.enemyBolts].forEach((group) => {
      group.children.each((child) => {
        const obj = child as Phaser.GameObjects.GameObject & { x: number; y: number; destroy: () => void };
        if (obj.x < -180 || obj.x > this.scale.width + 220 || obj.y < -160 || obj.y > this.scale.height + 180) obj.destroy();
        return true;
      });
    });
  }

  private updateHud() {
    this.hpText.setText(`HP ${this.playerState.health}/${this.playerState.maxHealth}  ESC ${this.playerState.shields}`);
    this.scoreText.setText(`${this.score}`);
    this.levelText.setText(`Fase ${this.level}`);
    if (this.boss?.active) this.bossBar.width = 360 * Math.max(0, this.boss.hp / this.boss.maxHp);
    else this.bossBar.width = 0;
  }
}
