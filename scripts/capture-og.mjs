import { chromium } from 'playwright';

const URL = process.env.OG_URL || 'http://localhost:5174/';
const OUT = process.env.OG_OUT || 'public/og-image.png';
const ZOOM = Number(process.env.OG_ZOOM || '0.6');

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 1200, height: 1400 }, // tall so Lenis lays content at top
  deviceScaleFactor: 2,                     // crisp 2x render
});

await page.goto(URL, { waitUntil: 'networkidle' });
// Let hero entrance animations settle
await page.waitForTimeout(3000);

// Scale the page down so the whole hero fits inside a 1200x630 frame
await page.evaluate((z) => { document.documentElement.style.zoom = String(z); }, ZOOM);
await page.waitForTimeout(400);

await page.screenshot({
  path: OUT,
  clip: { x: 0, y: 0, width: 1200, height: 630 },
});

await browser.close();
console.log(`Saved OG image to ${OUT} (zoom ${ZOOM})`);
