/**
 * Sprite Sheet Generator — Phase 2 of perf-2
 *
 * Combines individual sprites into 4 sprite sheets + JSON manifests.
 * Output: sprites/sheets/{name}.png + sprites/sheets/{name}.json
 *
 * Usage:
 *   cd pizza-chef-assets
 *   node scripts/generateSpriteSheets.js
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const SPRITES_DIR = path.join(__dirname, '..', 'sprites');
const OUTPUT_DIR = path.join(SPRITES_DIR, 'sheets');
const CELL_SIZE = 256; // All sprites fit within 256x256

// Sprite sheet groupings
const SHEETS = {
  core: [
    'chef.png', 'sad-chef.png', 'cheesed-chef.png', 'chef-smoking.png',
    'drool-face.png', 'yum-face.png', 'frozen-face.png', 'woozy-face.png',
    'spicy-face.png', 'critic.png', 'slice-plate.png', 'paperplate.png',
    'health-inspector.png', 'intern.png',
  ],
  powerups: [
    'beer.png', 'hot-honey.png', 'sundae.png', 'doge.png', 'nyan-cat.png',
    'molto-benny.png', 'star.png', 'pepe.png', 'doge-power-up-alert.png',
    'nyan-chef.png', 'rainbow.png', 'rainbow-brian.png', 'gotchi.png',
  ],
  food: [
    '1slicepizzapan.png', '2slicepizzapan.png', '3slicepizzapan.png',
    '4slicepizzapan.png', '5slicepizzapan.png', '6slicepizzapan.png',
    '7slicepizzapan.png', '8slicepizzapan.png', 'fullpizza.png', 'pizzapan.png',
  ],
  special: [
    'bad-luck-brian.png', 'bad-luck-brian-puke.png', 'scumbag-steve.png',
    'pizza-mafia.png', 'dominos-boss.png', 'papa-john.png', 'papa-john-2.png',
    'papa-john-3.png', 'papa-john-4.png', 'papa-john-5.png', 'papa-john-6.png',
    'franco-pepe.png', 'frank-pepe.png', 'chuck-e-cheese.png', 'pizza-the-hut.png',
    'cheese-slime.png', 'kid-1.png', 'kid-2.png', 'kid-3.png', 'kid-4.png',
    'kid-5.png', 'kid-6.png', 'luigi-primo.png', 'DogeBackup.png',
  ],
};

async function generateSheet(name, spriteNames) {
  console.log(`\nGenerating ${name}.png (${spriteNames.length} sprites)...`);

  // Calculate grid dimensions
  const cols = Math.ceil(Math.sqrt(spriteNames.length));
  const rows = Math.ceil(spriteNames.length / cols);
  const sheetWidth = cols * CELL_SIZE;
  const sheetHeight = rows * CELL_SIZE;

  // Get metadata for each sprite
  const sprites = [];
  for (let i = 0; i < spriteNames.length; i++) {
    const spriteName = spriteNames[i];
    const filePath = path.join(SPRITES_DIR, spriteName);
    if (!fs.existsSync(filePath)) {
      console.warn(`  WARNING: ${spriteName} not found, skipping`);
      continue;
    }
    const meta = await sharp(filePath).metadata();
    const col = i % cols;
    const row = Math.floor(i / cols);
    sprites.push({
      name: spriteName,
      filePath,
      x: col * CELL_SIZE,
      y: row * CELL_SIZE,
      width: meta.width,
      height: meta.height,
    });
  }

  // Create composite image
  const composites = await Promise.all(sprites.map(async (s) => {
    const buffer = await sharp(s.filePath).toBuffer();
    return {
      input: buffer,
      left: s.x,
      top: s.y,
    };
  }));

  // Create transparent base and composite all sprites
  await sharp({
    create: {
      width: sheetWidth,
      height: sheetHeight,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite(composites)
    .png({ compressionLevel: 9 })
    .toFile(path.join(OUTPUT_DIR, `${name}.png`));

  // Generate manifest
  const manifest = {};
  for (const s of sprites) {
    manifest[s.name] = { x: s.x, y: s.y, width: s.width, height: s.height };
  }
  fs.writeFileSync(
    path.join(OUTPUT_DIR, `${name}.json`),
    JSON.stringify(manifest, null, 2)
  );

  const sheetSize = fs.statSync(path.join(OUTPUT_DIR, `${name}.png`)).size;
  console.log(`  ${cols}x${rows} grid (${sheetWidth}x${sheetHeight}px)`);
  console.log(`  ${sprites.length} sprites → ${(sheetSize / 1024).toFixed(1)} KB`);

  return { name, sprites: sprites.length, size: sheetSize };
}

async function main() {
  // Create output directory
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const results = [];
  for (const [name, sprites] of Object.entries(SHEETS)) {
    results.push(await generateSheet(name, sprites));
  }

  console.log('\n' + '='.repeat(60));
  console.log('Sprite Sheet Summary:');
  let totalSize = 0;
  for (const r of results) {
    console.log(`  ${r.name}.png: ${r.sprites} sprites, ${(r.size / 1024).toFixed(1)} KB`);
    totalSize += r.size;
  }
  console.log(`\nTotal: ${results.reduce((s, r) => s + r.sprites, 0)} sprites in ${results.length} sheets`);
  console.log(`Total size: ${(totalSize / 1024).toFixed(1)} KB`);
  console.log('='.repeat(60));
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
