import { copyFile, mkdir, rm } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const sourceDir = path.join(
  process.env.USERPROFILE ?? "",
  ".codex",
  "generated_images",
  "019e7a83-4175-7ad0-b43e-ad636d879d56"
);

const files = [
  ["dragon-source.png", "ig_0d6fd400fcb1b67b016a1b480819c48191bdfae301cd900aff.png"],
  ["enemies-source.png", "ig_0d6fd400fcb1b67b016a1b482c2dc48191b5127f5c5fc5460f.png"],
  ["boss-source.png", "ig_0d6fd400fcb1b67b016a1b485e519c8191af4891405673a9e7.png"],
  ["icons-source.png", "ig_0d6fd400fcb1b67b016a1b4899db24819189775be67053b1b2.png"],
  ["title.png", "ig_0d6fd400fcb1b67b016a1b48ed211c8191844d87384e7772bc.png"],
  ["parallax.png", "ig_0d6fd400fcb1b67b016a1b492820388191b62016995e72b592.png"]
];

const outDir = path.join(root, "public", "assets");
await mkdir(outDir, { recursive: true });

for (const [target, source] of files) {
  await copyFile(path.join(sourceDir, source), path.join(outDir, target));
}

async function chromaToAlpha(input, output) {
  const image = sharp(path.join(outDir, input)).ensureAlpha().raw();
  const { data, info } = await image.toBuffer({ resolveWithObject: true });
  const channels = info.channels;

  for (let i = 0; i < data.length; i += channels) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const distance = Math.sqrt((r - 255) ** 2 + g ** 2 + (b - 255) ** 2);
    if (distance < 95) {
      data[i + 3] = 0;
    }
  }

  await sharp(data, {
    raw: {
      width: info.width,
      height: info.height,
      channels
    }
  })
    .png()
    .toFile(path.join(outDir, output));
}

await chromaToAlpha("dragon-source.png", "dragon.png");
await chromaToAlpha("enemies-source.png", "enemies.png");
await chromaToAlpha("boss-source.png", "boss.png");
await chromaToAlpha("icons-source.png", "icons.png");

const parallaxMeta = await sharp(path.join(outDir, "parallax.png")).metadata();
const layerHeight = Math.floor((parallaxMeta.height ?? 724) / 3);
await sharp(path.join(outDir, "parallax.png"))
  .extract({ left: 0, top: 0, width: parallaxMeta.width ?? 2172, height: layerHeight })
  .png()
  .toFile(path.join(outDir, "bg-sky.png"));
await sharp(path.join(outDir, "parallax.png"))
  .extract({ left: 0, top: layerHeight, width: parallaxMeta.width ?? 2172, height: layerHeight })
  .png()
  .toFile(path.join(outDir, "bg-mountains.png"));
await sharp(path.join(outDir, "parallax.png"))
  .extract({
    left: 0,
    top: layerHeight * 2,
    width: parallaxMeta.width ?? 2172,
    height: (parallaxMeta.height ?? 724) - layerHeight * 2
  })
  .png()
  .toFile(path.join(outDir, "bg-forest.png"));

for (const intermediate of [
  "dragon-source.png",
  "enemies-source.png",
  "boss-source.png",
  "icons-source.png",
  "parallax.png"
]) {
  await rm(path.join(outDir, intermediate), { force: true });
}

console.log("Assets processed in public/assets");
