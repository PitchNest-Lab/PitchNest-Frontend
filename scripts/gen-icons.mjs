// Rasterizes public/icon-maskable.svg into the maskable PNG icons referenced by
// manifest.json. The SVG is full-bleed (no transparent corners) so the output
// PNGs render cleanly under any launcher/splash mask. Run: node scripts/gen-icons.mjs
import { chromium } from "playwright";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.resolve(__dirname, "..", "public");
const svg = fs.readFileSync(path.join(publicDir, "icon-maskable.svg"), "utf8");

const targets = [
  { size: 512, out: "logo-maskable-512.png" },
  { size: 192, out: "logo-maskable-192.png" },
];

const browser = await chromium.launch();
try {
  for (const { size, out } of targets) {
    const page = await browser.newPage({
      viewport: { width: size, height: size },
      deviceScaleFactor: 1,
    });
    // No transparent page background — the SVG already fills every pixel, but we
    // set the page to the gradient's mid-tone as a belt-and-suspenders guard
    // against any sub-pixel edge bleed.
    const html = `<!doctype html><meta charset="utf-8"><style>
      html,body{margin:0;padding:0;background:#0ea5e9}
      svg{display:block;width:${size}px;height:${size}px}
    </style>${svg}`;
    await page.setContent(html, { waitUntil: "networkidle" });
    await page.locator("svg").screenshot({
      path: path.join(publicDir, out),
      omitBackground: false,
    });
    await page.close();
    console.log(`Wrote ${out} (${size}x${size})`);
  }
} finally {
  await browser.close();
}
