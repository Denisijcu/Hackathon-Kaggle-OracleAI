const sharp = require('sharp');
const fs = require('fs');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const inputFile = 'icon-512.png';

if (!fs.existsSync('src/assets/icons')) {
  fs.mkdirSync('src/assets/icons', { recursive: true });
}

sizes.forEach(size => {
  sharp(inputFile)
    .resize(size, size)
    .toFile(`src/assets/icons/icon-${size}x${size}.png`)
    .then(() => console.log(`✅ Generado icon-${size}x${size}.png`))
    .catch(err => console.error(`❌ Error con ${size}:`, err));
});