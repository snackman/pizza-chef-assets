/**
 * Collision Mask Generator for Papa John Sprites
 *
 * Usage:
 *   cd pizza-chef-assets
 *   npm install jimp
 *   node scripts/generateMasks.js
 *
 * Outputs:
 *   sprites/masks/papa-john.json
 *   sprites/masks/papa-john-2.json
 *   ... etc
 */

const { Jimp } = require('jimp');
const fs = require('fs');
const path = require('path');

const RESOLUTION = 32; // 32x32 grid
const ALPHA_THRESHOLD = 128; // Pixels with alpha >= 128 are "solid"

const SPRITES = [
  'papa-john.png',
  'papa-john-2.png',
  'papa-john-3.png',
  'papa-john-4.png',
  'papa-john-5.png',
  'papa-john-6.png',
];

async function generateMask(spritePath, outputPath) {
  const image = await Jimp.read(spritePath);
  const width = image.width;
  const height = image.height;

  // Create downsampled mask
  const mask = {
    width: RESOLUTION,
    height: RESOLUTION,
    data: []
  };

  // Calculate how many pixels each mask cell covers
  const cellWidth = width / RESOLUTION;
  const cellHeight = height / RESOLUTION;

  for (let y = 0; y < RESOLUTION; y++) {
    const row = [];
    for (let x = 0; x < RESOLUTION; x++) {
      // Sample the center of each cell
      const sampleX = Math.floor((x + 0.5) * cellWidth);
      const sampleY = Math.floor((y + 0.5) * cellHeight);

      // Get pixel color (RGBA) - Jimp 1.x uses getPixelColor returning an object
      const color = image.getPixelColor(sampleX, sampleY);
      // In Jimp 1.x, getPixelColor returns a number, need to extract alpha
      // The format is 0xRRGGBBAA
      const alpha = color & 0xFF;

      // Check if pixel is solid (alpha above threshold)
      const isSolid = alpha >= ALPHA_THRESHOLD;
      row.push(isSolid);
    }
    mask.data.push(row);
  }

  // Write JSON file
  fs.writeFileSync(outputPath, JSON.stringify(mask, null, 2));
  console.log(`Generated: ${outputPath}`);

  // Print visual preview
  console.log('Preview:');
  for (const row of mask.data) {
    console.log(row.map(v => v ? '#' : '.').join(''));
  }
  console.log('');
}

async function main() {
  const spritesDir = path.join(__dirname, '..', 'sprites');
  const masksDir = path.join(spritesDir, 'masks');

  // Ensure masks directory exists
  if (!fs.existsSync(masksDir)) {
    fs.mkdirSync(masksDir, { recursive: true });
  }

  for (const sprite of SPRITES) {
    const spritePath = path.join(spritesDir, sprite);
    const maskName = sprite.replace('.png', '.json');
    const outputPath = path.join(masksDir, maskName);

    if (!fs.existsSync(spritePath)) {
      console.warn(`Warning: Sprite not found: ${spritePath}`);
      continue;
    }

    await generateMask(spritePath, outputPath);
  }

  console.log('Done! Mask files generated in sprites/masks/');
}

main().catch(console.error);
