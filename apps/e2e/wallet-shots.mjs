/**
 * LOOK AT THE WALLET AT PHONE WIDTH, which has never been done.
 *
 * Added 21 August 2026, session 10. /home renders nothing worth judging unless
 * a real account is signed in — signed out it is one sentence saying "sign in".
 * So this signs the test browser in the only way that involves no password:
 * the admin API mints a ONE-TIME magic-link token hash, and the browser hands
 * it to /auth/confirm, which is the same route the confirmation email uses.
 *
 *   node wallet-shots.mjs <outdir> [account-uuid]
 *
 * With no uuid it picks the most recently created real account. It never
 * prints an email address (CLAUDE.md section 3) and it writes nothing to the
 * database: minting a link and verifying it are auth operations, and the page
 * itself is read only.
 *
 * Same Chrome trick as mobile-shots.mjs: `channel: 'chrome'` drives the copy
 * already on the machine, so `npx playwright install` is not needed.
 *
 * It talks to the Supabase admin API over plain fetch rather than importing
 * @supabase/supabase-js, which is not a dependency of this package. Adding one
 * would need Jon under CLAUDE.md section 5, and two REST calls do not justify
 * it.
 */
import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const env = {};
for (const f of ['../web/.env', '../web/.env.local']) {
  const p = path.resolve(f);
  if (!fs.existsSync(p)) continue;
  for (const line of fs.readFileSync(p, 'utf8').split('\n')) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)$/.exec(line);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '').trim();
  }
}

const [outDir = 'shots/wallet', wantId] = process.argv.slice(2);
const AUTH = env.NEXT_PUBLIC_SUPABASE_URL + '/auth/v1';
const HEADERS = {
  apikey: env.SUPABASE_SERVICE_ROLE_KEY,
  Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
  'Content-Type': 'application/json',
};

const listRes = await fetch(`${AUTH}/admin/users?page=1&per_page=200`, { headers: HEADERS });
if (!listRes.ok) { console.error('listUsers failed:', listRes.status, await listRes.text()); process.exit(1); }
const list = await listRes.json();

const real = (list.users ?? [])
  .filter((u) => u.is_anonymous !== true && u.email)
  .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
const user = wantId ? real.find((u) => u.id.startsWith(wantId)) : real[0];
if (!user) { console.error('no matching real account'); process.exit(1); }

const linkRes = await fetch(`${AUTH}/admin/generate_link`, {
  method: 'POST',
  headers: HEADERS,
  body: JSON.stringify({ type: 'magiclink', email: user.email }),
});
if (!linkRes.ok) { console.error('generateLink failed:', linkRes.status, await linkRes.text()); process.exit(1); }
const link = await linkRes.json();

const tokenHash = link.hashed_token ?? link.properties?.hashed_token;
console.log(`signing in as account ${user.id.slice(0, 8)} via a one-time token (no password, no email printed)`);

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

const consoleMsgs = [];
page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) consoleMsgs.push(`${m.type()}: ${m.text()}`); });
page.on('pageerror', (e) => consoleMsgs.push(`pageerror: ${e.message}`));

await page.goto(`http://localhost:3000/auth/confirm?token_hash=${tokenHash}&type=magiclink`, {
  waitUntil: 'networkidle',
}).catch(() => {});
await page.waitForTimeout(1200);
console.log('landed on:', page.url());

await page.goto('http://localhost:3000/home', { waitUntil: 'networkidle' }).catch(() => {});
await page.waitForTimeout(1200);
await page.addStyleTag({
  content: '*,*::before,*::after{animation-duration:0.001ms!important;animation-delay:0ms!important;transition-duration:0.001ms!important}',
});
await page.waitForTimeout(300);

const probe = await page.evaluate(() => ({
  url: location.pathname,
  scrollHeight: document.documentElement.scrollHeight,
  clientWidth: document.documentElement.clientWidth,
  scrollWidth: document.documentElement.scrollWidth,
  sidewaysScroll: document.documentElement.scrollWidth - document.documentElement.clientWidth,
  signedOutMessage: document.body.innerText.includes('Sign in to see your credit balance'),
  text: document.body.innerText.slice(0, 1200),
}));

console.log(JSON.stringify({
  url: probe.url,
  scrollHeight: probe.scrollHeight,
  sidewaysScroll: probe.sidewaysScroll,
  signedOut: probe.signedOutMessage,
}, null, 1));
console.log('\n--- WHAT THE PAGE SAYS ---\n' + probe.text + '\n--- END ---');

fs.mkdirSync(outDir, { recursive: true });
const SLICE = 1500;
const files = [];
for (let y = 0, i = 1; y < probe.scrollHeight; y += SLICE, i++) {
  const height = Math.min(SLICE, probe.scrollHeight - y);
  const file = `${outDir}/wallet-${String(i).padStart(2, '0')}.png`;
  await page.screenshot({ path: file, clip: { x: 0, y, width: 390, height }, fullPage: true });
  files.push(file);
}
console.log('\nwrote:', files.join(', '));
console.log('\n--- CONSOLE (errors and warnings) ---');
console.log(consoleMsgs.length ? consoleMsgs.join('\n') : '(none)');
await browser.close();
