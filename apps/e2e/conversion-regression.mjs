/**
 * THE CONVERSION DOUBLE-GRANT, TESTED THROUGH THE REAL ROUTE.
 *
 * Session 11. 04 entry 114.
 *
 * THE BUG: /api/tool/clean decided "is this a converted guest?" from the
 * uc-guest cookie alone — and /api/credits DELETES that cookie the moment the
 * merge completes. So the next sanitise saw no cookie, concluded "brand new
 * visitor", and paid the +2 welcome grant the account had just been correctly
 * denied. Every converting user minted 2 free credits.
 *
 * THE SETUP MIRRORS THE MOMENT THE BUG FIRED: an account that HAS a conversion
 * record, and a browser with NO guest cookie. Under the old code this produced
 * an anon_grant. Under the fix it must not, because the route now reads the
 * durable record instead of the vanished cookie.
 */
import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const HERE = path.dirname(new URL(import.meta.url).pathname);
const env = {};
for (const f of ['../web/.env', '../web/.env.local']) {
  const p = path.resolve(HERE, f);
  if (!fs.existsSync(p)) continue;
  for (const line of fs.readFileSync(p, 'utf8').split('\n')) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)$/.exec(line);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '').trim();
  }
}

const EMAIL = 'stripe-e2e-buyer@un-claude.com';

const link = await (async () => {
  const r = await fetch(`${env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/admin/generate_link`, {
    method: 'POST',
    headers: {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({ type: 'magiclink', email: EMAIL, redirect_to: 'http://localhost:3000/home' }),
  });
  const b = await r.json();
  if (!r.ok) throw new Error('generate_link failed: ' + JSON.stringify(b));
  const h = b.properties?.hashed_token ?? b.hashed_token;
  console.log('hashed_token:', h ? h.slice(0, 12) + '…' : 'MISSING', JSON.stringify(Object.keys(b.properties ?? b)));
  return h;
})();

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage();

await page.goto(`http://localhost:3000/auth/confirm?token_hash=${encodeURIComponent(link)}&type=magiclink`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(3000);
console.log('after /auth/confirm, landed on:', page.url());

// Land on the app so the fetch below runs from the right origin with the
// session cookies attached.
await page.goto('http://localhost:3000/home', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(2500);

const authCookie = (await page.context().cookies()).find((c) => /^sb-.*-auth-token/.test(c.name));
console.log('supabase auth cookie present:', !!authCookie, '<- must be true');
console.log('on page:', page.url());

// THE CRITICAL PRECONDITION: no guest cookie, exactly as after /api/credits
// deleted it. Cleared explicitly so the test cannot pass by accident.
const cookies = await page.context().cookies();
const guestCookie = cookies.find((c) => c.name === 'uc-guest');
console.log('uc-guest cookie present before the sanitise:', !!guestCookie, '<- must be false');

const payload = Buffer.from('This paragraph contains a zero width space​ and is being sanitised by a converted account to see whether a welcome grant is wrongly paid.').toString('base64');

const result = await page.evaluate(async (file) => {
  const r = await fetch('/api/tool/clean', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ file, name: 'paste.txt', layer_b: false }),
  });
  return { status: r.status, body: (await r.text()).slice(0, 200) };
}, payload);

console.log('clean route:', result.status, result.body.slice(0, 120));

await browser.close();
