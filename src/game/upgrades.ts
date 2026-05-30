import type { GameScene } from "../scenes/GameScene";
import Phaser from "phaser";

export type UpgradeId =
  | "triple_fire"
  | "ember_orb"
  | "scale_guard"
  | "swift_wings"
  | "phoenix_heart"
  | "piercing_beam"
  | "meteor_burst"
  | "gold_ember"
  | "storm_breath";

export type Upgrade = {
  id: UpgradeId;
  name: string;
  description: string;
  iconFrame: number;
  apply: (scene: GameScene) => void;
};

export const upgrades: Upgrade[] = [
  {
    id: "triple_fire",
    name: "Fogo Triplo",
    description: "Dispara duas chamas extras em diagonal.",
    iconFrame: 0,
    apply: (scene) => {
      scene.playerState.spread += 1;
    }
  },
  {
    id: "scale_guard",
    name: "Escama Guardiã",
    description: "Ganha um escudo que absorve um golpe.",
    iconFrame: 1,
    apply: (scene) => {
      scene.playerState.shields += 1;
    }
  },
  {
    id: "phoenix_heart",
    name: "Coração Fênix",
    description: "Recupera vida e aumenta o máximo.",
    iconFrame: 2,
    apply: (scene) => {
      scene.playerState.maxHealth += 1;
      scene.playerState.health = Math.min(scene.playerState.maxHealth, scene.playerState.health + 2);
    }
  },
  {
    id: "piercing_beam",
    name: "Raio Perfurante",
    description: "Chamas atravessam mais inimigos.",
    iconFrame: 3,
    apply: (scene) => {
      scene.playerState.piercing += 1;
    }
  },
  {
    id: "ember_orb",
    name: "Orbe Flamejante",
    description: "Um orbe aliado dispara perto do dragão.",
    iconFrame: 4,
    apply: (scene) => {
      scene.playerState.orbs += 1;
    }
  },
  {
    id: "swift_wings",
    name: "Asas Velozes",
    description: "Move mais rápido e recarrega tiros melhor.",
    iconFrame: 5,
    apply: (scene) => {
      scene.playerState.speed += 35;
      scene.playerState.fireDelay = Math.max(110, scene.playerState.fireDelay - 35);
    }
  },
  {
    id: "meteor_burst",
    name: "Chuva Meteórica",
    description: "Eliminações podem explodir inimigos próximos.",
    iconFrame: 6,
    apply: (scene) => {
      scene.playerState.explosive += 1;
    }
  },
  {
    id: "gold_ember",
    name: "Brasa Dourada",
    description: "Aumenta o dano das chamas.",
    iconFrame: 7,
    apply: (scene) => {
      scene.playerState.damage += 1;
    }
  },
  {
    id: "storm_breath",
    name: "Sopro da Tempestade",
    description: "Tiros ficam mais rápidos e derrubam projéteis.",
    iconFrame: 8,
    apply: (scene) => {
      scene.playerState.projectileSpeed += 80;
      scene.playerState.storm += 1;
    }
  }
];

export function pickUpgrades(count = 3): Upgrade[] {
  return Phaser.Utils.Array.Shuffle([...upgrades]).slice(0, count);
}
