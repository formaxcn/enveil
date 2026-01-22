import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const iconDir = path.join(process.cwd(), 'public', 'icon');
const iconSizes = [16, 32, 48, 96, 128];

async function createGrayIcons() {
  for (const size of iconSizes) {
    const inputPath = path.join(iconDir, `${size}.png`);
    const outputPath = path.join(iconDir, `${size}-gray.png`);

    try {
      await sharp(inputPath)
        .grayscale()
        .toFile(outputPath);
      console.log(`Created ${size}-gray.png`);
    } catch (error) {
      console.error(`Failed to create ${size}-gray.png:`, error);
    }
  }
}

createGrayIcons().then(() => {
  console.log('All gray icons created successfully!');
  process.exit(0);
}).catch((error) => {
  console.error('Error creating gray icons:', error);
  process.exit(1);
});
