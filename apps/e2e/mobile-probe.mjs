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
const paths = process.argv.slice(2);
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
const out = [];
for (const p of paths) {
  await page.goto('http://localhost:3000' + p, { waitUntil: 'networkidle' }).catch(()=>{});
  await page.waitForTimeout(1200);
  const m = await page.evaluate(() => ({
    h: document.documentElement.scrollHeight,
    side: document.documentElement.scrollWidth - window.innerWidth,
    offenders: [...document.querySelectorAll('body *')]
      .filter(e => e.getBoundingClientRect().right > window.innerWidth + 1)
      .slice(0, 5)
      .map(e => e.tagName + '.' + String(e.className).slice(0, 50)),
  }));
  out.push({ p, ...m, screens: +(m.h / 844).toFixed(1) });
}
console.log(JSON.stringify(out, null, 1));
await browser.close();
