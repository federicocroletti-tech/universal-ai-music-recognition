// Generates PNG icons, favicon.ico, and the Open Graph image from public/favicon.svg.
// Run with: node scripts/generate-images.mjs (uses Playwright's Chromium).
import { chromium } from '@playwright/test';
import { readFile, writeFile } from 'node:fs/promises';

const logo = await readFile('public/favicon.svg', 'utf8');
const sizedLogo = (size) => logo.replace('<svg ', `<svg width="${size}" height="${size}" `);
const browser = await chromium.launch();
const page = await browser.newPage();

async function render(html, width, height, path) {
  await page.setViewportSize({ width, height });
  await page.setContent(`<!doctype html><html><body style="margin:0;background:transparent">${html}</body></html>`);
  return page.screenshot({ path, omitBackground: true, clip: { x: 0, y: 0, width, height } });
}

for (const [size, file] of [[192, 'icon-192.png'], [512, 'icon-512.png'], [180, 'apple-touch-icon.png']]) {
  await render(sizedLogo(size), size, size, `public/${file}`);
}

// favicon.ico containing a single 32x32 PNG image.
const png = await render(sizedLogo(32), 32, 32);
const header = Buffer.alloc(22);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(1, 4);
header.writeUInt8(32, 6);
header.writeUInt8(32, 7);
header.writeUInt16LE(1, 10);
header.writeUInt16LE(32, 12);
header.writeUInt32LE(png.length, 14);
header.writeUInt32LE(22, 18);
await writeFile('public/favicon.ico', Buffer.concat([header, png]));

await render(
  `<div style="width:1200px;height:630px;box-sizing:border-box;padding:0 96px;display:flex;flex-direction:column;justify-content:center;
    background:radial-gradient(900px 450px at 0% 0%,#6d3df555,transparent),radial-gradient(800px 450px at 100% 100%,#e0457b44,transparent),#0f0d1a;
    color:#f1eefc;font-family:'Segoe UI',system-ui,sans-serif">
    <div style="display:flex;align-items:center;gap:28px">${sizedLogo(104)}<span style="font-size:72px;font-weight:700">Hum Finder</span></div>
    <p style="font-size:48px;line-height:1.25;margin:44px 0 0;max-width:960px">Canticchia una melodia: provo a riconoscerla.</p>
    <p style="font-size:30px;color:#b3acd3;margin:28px 0 0">Prototipo gratuito · l’audio resta sul tuo dispositivo</p>
  </div>`,
  1200,
  630,
  'public/og-image.png',
);

await browser.close();
