const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const bgDir = path.join(__dirname, '..', 'backgrounds');

async function convert() {
  // 1. Pizza shop background: max width 2560px, quality 75
  const shopInput = path.join(bgDir, 'pizza-shop-background.png');
  const shopOutput = path.join(bgDir, 'pizza-shop-background.webp');

  const shopInfo = fs.statSync(shopInput);
  console.log(`Pizza shop background input: ${(shopInfo.size / 1024 / 1024).toFixed(2)} MB`);

  await sharp(shopInput)
    .resize({ width: 2560, withoutEnlargement: true })
    .webp({ quality: 75 })
    .toFile(shopOutput);

  const shopOutInfo = fs.statSync(shopOutput);
  console.log(`Pizza shop background output: ${(shopOutInfo.size / 1024).toFixed(0)} KB (${((1 - shopOutInfo.size / shopInfo.size) * 100).toFixed(1)}% reduction)`);

  // 2. Counter: quality 80
  const counterInput = path.join(bgDir, 'counter.png');
  const counterOutput = path.join(bgDir, 'counter.webp');

  const counterInfo = fs.statSync(counterInput);
  console.log(`\nCounter input: ${(counterInfo.size / 1024).toFixed(0)} KB`);

  await sharp(counterInput)
    .webp({ quality: 80 })
    .toFile(counterOutput);

  const counterOutInfo = fs.statSync(counterOutput);
  console.log(`Counter output: ${(counterOutInfo.size / 1024).toFixed(0)} KB (${((1 - counterOutInfo.size / counterInfo.size) * 100).toFixed(1)}% reduction)`);

  // 3. Also convert landscape-no-red-bar.png for the landscape game board
  const landscapeInput = path.join(bgDir, 'landscape-no-red-bar.png');
  const landscapeOutput = path.join(bgDir, 'landscape-no-red-bar.webp');

  if (fs.existsSync(landscapeInput)) {
    const landscapeInfo = fs.statSync(landscapeInput);
    console.log(`\nLandscape input: ${(landscapeInfo.size / 1024 / 1024).toFixed(2)} MB`);

    await sharp(landscapeInput)
      .resize({ width: 2560, withoutEnlargement: true })
      .webp({ quality: 75 })
      .toFile(landscapeOutput);

    const landscapeOutInfo = fs.statSync(landscapeOutput);
    console.log(`Landscape output: ${(landscapeOutInfo.size / 1024).toFixed(0)} KB (${((1 - landscapeOutInfo.size / landscapeInfo.size) * 100).toFixed(1)}% reduction)`);
  }

  console.log('\nDone!');
}

convert().catch(console.error);
