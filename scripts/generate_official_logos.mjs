import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { PNG } = require('pngjs');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const SOURCE_IMAGE_PATH = 'C:/Users/ADMIN/.gemini/antigravity/brain/7dd4b73b-a80a-48fc-b132-617c87deccd1/.user_uploaded/media_1792176173368_2303e794.png';

if (!fs.existsSync(SOURCE_IMAGE_PATH)) {
  console.error('Source image not found:', SOURCE_IMAGE_PATH);
  process.exit(1);
}

const srcBuffer = fs.readFileSync(SOURCE_IMAGE_PATH);
const srcPng = PNG.sync.read(srcBuffer);
console.log(`Source Image Loaded: ${srcPng.width}x${srcPng.height}, size: ${srcBuffer.length} bytes`);

/**
 * Resizes a PNG image using Bilinear Interpolation with optional canvas padding and background color.
 */
function createProcessedPNG(srcPng, targetSize, innerSize, bgColor = null) {
  const dst = new PNG({ width: targetSize, height: targetSize });
  
  // Fill background if specified (e.g. for maskable icons or iOS apple-touch-icon)
  if (bgColor) {
    for (let i = 0; i < dst.data.length; i += 4) {
      dst.data[i] = bgColor[0];
      dst.data[i + 1] = bgColor[1];
      dst.data[i + 2] = bgColor[2];
      dst.data[i + 3] = bgColor[3] ?? 255;
    }
  } else {
    dst.data.fill(0);
  }

  const offset = Math.round((targetSize - innerSize) / 2);
  const srcW = srcPng.width;
  const srcH = srcPng.height;

  for (let dy = 0; dy < innerSize; dy++) {
    for (let dx = 0; dx < innerSize; dx++) {
      const targetX = offset + dx;
      const targetY = offset + dy;
      if (targetX < 0 || targetX >= targetSize || targetY < 0 || targetY >= targetSize) continue;

      const dstIdx = (targetSize * targetY + targetX) << 2;

      // Source fractional coordinate
      const gx = (dx + 0.5) * (srcW / innerSize) - 0.5;
      const gy = (dy + 0.5) * (srcH / innerSize) - 0.5;

      const gxi = Math.floor(gx);
      const gyi = Math.floor(gy);

      const fracX = gx - gxi;
      const fracY = gy - gyi;

      let r = 0, g = 0, b = 0, a = 0;

      for (let cy = 0; cy <= 1; cy++) {
        for (let cx = 0; cx <= 1; cx++) {
          const sx = Math.min(Math.max(gxi + cx, 0), srcW - 1);
          const sy = Math.min(Math.max(gyi + cy, 0), srcH - 1);
          const srcIdx = (srcW * sy + sx) << 2;

          const weight = (cx === 0 ? 1 - fracX : fracX) * (cy === 0 ? 1 - fracY : fracY);
          r += srcPng.data[srcIdx] * weight;
          g += srcPng.data[srcIdx + 1] * weight;
          b += srcPng.data[srcIdx + 2] * weight;
          a += srcPng.data[srcIdx + 3] * weight;
        }
      }

      if (bgColor) {
        const alphaFrac = a / 255;
        const bgR = dst.data[dstIdx];
        const bgG = dst.data[dstIdx + 1];
        const bgB = dst.data[dstIdx + 2];

        dst.data[dstIdx] = Math.round(r * alphaFrac + bgR * (1 - alphaFrac));
        dst.data[dstIdx + 1] = Math.round(g * alphaFrac + bgG * (1 - alphaFrac));
        dst.data[dstIdx + 2] = Math.round(b * alphaFrac + bgB * (1 - alphaFrac));
        dst.data[dstIdx + 3] = 255;
      } else {
        dst.data[dstIdx] = Math.round(r);
        dst.data[dstIdx + 1] = Math.round(g);
        dst.data[dstIdx + 2] = Math.round(b);
        dst.data[dstIdx + 3] = Math.round(a);
      }
    }
  }

  return dst;
}

// 1. Direct copy of original Image 2 to public/school-logo.png
const schoolLogoPath = path.join(rootDir, 'public', 'school-logo.png');
fs.writeFileSync(schoolLogoPath, srcBuffer);
console.log(`Saved: ${schoolLogoPath}`);

// 2. Overwrite all legacy mock school logos across public/
const legacyTargetFiles = [
  path.join(rootDir, 'public', 'images', 'teacher', 'school_logo.png'),
  path.join(rootDir, 'public', 'images', 'banners', 'school-logo.png'),
  path.join(rootDir, 'public', 'images', 'admin', 'school_emblem.png'),
  path.join(rootDir, 'public', 'images', 'admin', 'school_logo_crest.png'),
];

for (const targetFile of legacyTargetFiles) {
  const dir = path.dirname(targetFile);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(targetFile, srcBuffer);
  console.log(`Overwritten legacy logo with official Image 2: ${targetFile}`);
}

// 3. Generate PWA 192x192 transparent icon (with 4px safe margin = 184px inner)
const pwa192 = createProcessedPNG(srcPng, 192, 184, null);
const pwa192Buf = PNG.sync.write(pwa192);
fs.writeFileSync(path.join(rootDir, 'public', 'pwa-192x192.png'), pwa192Buf);
console.log('Generated: public/pwa-192x192.png');

// 4. Generate PWA 512x512 transparent icon (with 12px safe margin = 488px inner)
const pwa512 = createProcessedPNG(srcPng, 512, 488, null);
const pwa512Buf = PNG.sync.write(pwa512);
fs.writeFileSync(path.join(rootDir, 'public', 'pwa-512x512.png'), pwa512Buf);
console.log('Generated: public/pwa-512x512.png');

// 5. Generate PWA Maskable 512x512 icon (80% safe zone = 410px inner, pure white #FFFFFF background)
// This completely prevents Android Chrome from ever putting a black or dark squircle behind the emblem!
const pwaMaskable = createProcessedPNG(srcPng, 512, 410, [255, 255, 255, 255]);
const pwaMaskableBuf = PNG.sync.write(pwaMaskable);
fs.writeFileSync(path.join(rootDir, 'public', 'pwa-maskable-512x512.png'), pwaMaskableBuf);
console.log('Generated: public/pwa-maskable-512x512.png (Zero-black-border safe zone)');

// 6. Generate Apple Touch Icon 192x192 on white #FFFFFF background
const appleTouchIcon = createProcessedPNG(srcPng, 192, 170, [255, 255, 255, 255]);
const appleTouchBuf = PNG.sync.write(appleTouchIcon);
fs.writeFileSync(path.join(rootDir, 'public', 'apple-touch-icon.png'), appleTouchBuf);
console.log('Generated: public/apple-touch-icon.png');

// 7. Generate Favicon PNG 64x64
const faviconPng = createProcessedPNG(srcPng, 64, 60, null);
const faviconBuf = PNG.sync.write(faviconPng);
fs.writeFileSync(path.join(rootDir, 'public', 'favicon.png'), faviconBuf);
console.log('Generated: public/favicon.png');

// 8. Update public/school-logo.svg and public/favicon.svg with embedded Image 2 base64
// This guarantees that any request for SVG logo serves official Image 2
const base64Data = srcBuffer.toString('base64');
const embeddedSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" width="500" height="500">
  <image href="data:image/png;base64,${base64Data}" width="500" height="500" />
</svg>
`;
fs.writeFileSync(path.join(rootDir, 'public', 'school-logo.svg'), embeddedSvg, 'utf-8');
fs.writeFileSync(path.join(rootDir, 'public', 'favicon.svg'), embeddedSvg, 'utf-8');
console.log('Generated: public/school-logo.svg and public/favicon.svg (embedded Image 2)');

console.log('✅ All official school logos successfully generated and synchronized!');
