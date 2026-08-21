/**
 * PHONE WIDTH MEASUREMENT, because the preview pane cannot do this.
 *
 * Added 21 August 2026, session 10. Setting the Browser preview pane to any
 * width below 768px turns on its mobile device emulation, and in that mode
 * this site's landing page never finishes hydrating: every section reports
 * offsetHeight 0, the document measures 1100px instead of 4142px, and the
 * screenshot comes back as a hero over a blank sheet. It reads as a
 * catastrophic layout bug and it is not one. At 768px and above the identical
 * page is fine.
 *
 * So mobile work on this site is done here instead.
 *
 *   node mobile-probe.mjs / /how-it-works        heights and side scroll
 *   node mobile-shots.mjs /how-it-works <outdir>  full page slices as PNGs
 *
 * `npx playwright install` is NOT needed and should not be run: it downloads
 * browsers, which needs Jon under CLAUDE.md section 5. `channel: 'chrome'`
 * drives the copy of Chrome already installed on the machine. That single
 * option is the whole trick.
 *
 * The dev server must already be running on port 3000.
 */
import { chromium } from '@playwright/test';
import fs from 'node:fs';

const [path, outDir, sliceArg] = process.argv.slice(2);
const SLICE = +(sliceArg || 1500);
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
await page.goto('http://localhost:3000' + path, { waitUntil: 'networkidle' }).catch(() => {});
await page.waitForTimeout(1500);
// Kill entrance animations so nothing is caught mid-fade.
await page.addStyleTag({ content: '*,*::before,*::after{animation-duration:0.001ms!important;animation-delay:0ms!important;transition-duration:0.001ms!important}' });
await page.waitForTimeout(400);
const h = await page.evaluate(() => document.documentElement.scrollHeight);
const name = (path === '/' ? 'home' : path.replace(/\//g, '-').replace(/^-/, ''));
fs.mkdirSync(outDir, { recursive: true });
const files = [];
for (let y = 0, i = 1; y < h; y += SLICE, i++) {
  const height = Math.min(SLICE, h - y);
  const file = `${outDir}/${name}-${String(i).padStart(2, '0')}.png`;
  await page.screenshot({ path: file, clip: { x: 0, y, width: 390, height }, fullPage: true });
  files.push(file);
}
console.log(JSON.stringify({ path, h, screens: +(h / 844).toFixed(1), files }, null, 1));
await browser.close();
