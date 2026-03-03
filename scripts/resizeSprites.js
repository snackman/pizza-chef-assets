/**
 * Sprite Resizer — Phase 1 of perf-2
 *
 * Resizes all PNG sprites in sprites/ to fit within 256x256
 * while maintaining aspect ratio and preserving transparency.
 *
 * Usage:
 *   cd pizza-chef-assets
 *   npm install sharp
 *   node scripts/resizeSprites.js
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const SPRITES_DIR = path.join(__dirname, '..', 'sprites');
const MAX_DIMENSION = 256;

async function main() {
  const files = fs.readdirSync(SPRITES_DIR)
    .filter(f => f.endsWith('.png') && !fs.statSync(path.join(SPRITES_DIR, f)).isDirectory());

  console.log(`Found ${files.length} PNG sprites to resize`);
  console.log(`Max dimension: ${MAX_DIMENSION}px (maintaining aspect ratio)\n`);

  let totalBefore = 0;
  let totalAfter = 0;
  let resizedCount = 0;
  let skippedCount = 0;

  for (const file of files) {
    const filePath = path.join(SPRITES_DIR, file);
    const beforeSize = fs.statSync(filePath).size;
    totalBefore += beforeSize;

    // Read image metadata to check dimensions
    const metadata = await sharp(filePath).metadata();
    const { width, height } = metadata;

    // Skip if already within bounds
    if (width <= MAX_DIMENSION && height <= MAX_DIMENSION) {
      const afterSize = beforeSize;
      totalAfter += afterSize;
      skippedCount++;
      console.log(`  SKIP  ${file.padEnd(30)} ${width}x${height} — already within ${MAX_DIMENSION}px`);
      continue;
    }

    // Resize maintaining aspect ratio, fit inside MAX_DIMENSION x MAX_DIMENSION
    const resizedBuffer = await sharp(filePath)
      .resize(MAX_DIMENSION, MAX_DIMENSION, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .png({
        compressionLevel: 9,
        adaptiveFiltering: true,
      })
      .toBuffer();

    // Get new dimensions
    const newMeta = await sharp(resizedBuffer).metadata();

    // Overwrite original
    fs.writeFileSync(filePath, resizedBuffer);

    const afterSize = resizedBuffer.length;
    totalAfter += afterSize;
    resizedCount++;

    const reduction = ((1 - afterSize / beforeSize) * 100).toFixed(1);
    console.log(
      `  RESIZE ${file.padEnd(30)} ${width}x${height} -> ${newMeta.width}x${newMeta.height}  ` +
      `${formatBytes(beforeSize)} -> ${formatBytes(afterSize)} (-${reduction}%)`
    );
  }

  console.log('\n' + '='.repeat(80));
  console.log(`Total sprites: ${files.length}`);
  console.log(`  Resized: ${resizedCount}`);
  console.log(`  Skipped (already small): ${skippedCount}`);
  console.log(`\nTotal size before: ${formatBytes(totalBefore)}`);
  console.log(`Total size after:  ${formatBytes(totalAfter)}`);
  console.log(`Reduction:         ${formatBytes(totalBefore - totalAfter)} (-${((1 - totalAfter / totalBefore) * 100).toFixed(1)}%)`);
  console.log('='.repeat(80));
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
