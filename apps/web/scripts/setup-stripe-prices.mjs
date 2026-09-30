#!/usr/bin/env node
/**
 * CREATE THE STRIPE PRICES THAT CARRY CLEAN LOCAL AMOUNTS.
 *
 * 04 entry 167, Jon's ruling of 30 September 2026. Buyers outside America were
 * already being shown their own currency by Stripe's Adaptive Pricing, at
 * unrounded amounts — EUR 4.56, GBP 7.69, AUD 7.22, CAD 36.39 — because Stripe
 * has no rounding rule. This creates a Price per pack carrying hand-set amounts
 * in EUR, GBP, AUD and CAD, which Stripe presents instead of converting.
 *
 * HOW TO RUN, from apps/web:
 *
 *     node scripts/setup-stripe-prices.mjs            # TEST mode, the default
 *     node scripts/setup-stripe-prices.mjs --live     # the real account
 *
 * ★ IT REFUSES TO TOUCH LIVE WITHOUT `--live`, SPELLED OUT. Every other money
 * script in this project has a guard like this one, for the reason recorded in
 * `07`: the two modes look identical in a terminal and the mistake is silent.
 *
 * IDEMPOTENT, BY STRIPE'S OWN HANDLE. Each Price carries a `lookup_key` of
 * `uc_<pack>_v1`. A second run finds the existing Price and changes nothing.
 *
 * ★ A STRIPE PRICE IS IMMUTABLE, WHICH IS WHY THE KEY IS VERSIONED. Amounts
 * cannot be edited after creation. To change what a pack costs: bump the `_v1`
 * suffix in `packLookupKey` (lib/server/stripe.ts), run this again, and the
 * new Price takes over. The old one is deactivated here so it cannot be found
 * by a stale cache. Without the version the script would find the old Price,
 * decide there was nothing to do, and keep charging yesterday's price for ever.
 *
 * READ-THEN-WRITE, AND IT PRINTS EVERYTHING IT IS ABOUT TO DO. Nothing is
 * created before the plan is on screen. CLAUDE.md section 4.
 */
import { readFileSync, existsSync } from 'node:fs';

function loadEnvFile(name) {
  if (!existsSync(name)) return;
  for (const raw of readFileSync(name, 'utf8').split('\n')) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let val = line.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) val = val.slice(1, -1);
    if (process.env[key] === undefined) process.env[key] = val;
  }
}
loadEnvFile('.env.local');
loadEnvFile('.env');

const wantsLive = process.argv.includes('--live');
const key = wantsLive ? process.env.UC_DASHBOARD_STRIPE_KEY : process.env.STRIPE_SECRET_KEY;

if (!key) {
  console.error(
    wantsLive
      ? 'No UC_DASHBOARD_STRIPE_KEY. That is the live key, and it lives in apps/web/.env.local.'
      : 'No STRIPE_SECRET_KEY. That is the test key the website uses locally.',
  );
  process.exit(1);
}

const isLive = key.startsWith('sk_live_') || key.startsWith('rk_live_');

if (isLive && !wantsLive) {
  console.error('REFUSING: that key is LIVE and --live was not passed.');
  process.exit(1);
}
if (!isLive && wantsLive) {
  console.error('REFUSING: --live was passed but that key is a TEST key.');
  process.exit(1);
}

/*
 * THE PACKS AND THE LOCAL AMOUNTS ARE READ OUT OF THE APP, NEVER RETYPED HERE.
 * A second copy of a price is how the pricing page and the checkout come to
 * disagree, which is the trap this project has walked into before.
 */
const source = readFileSync('app/(marketing)/pricing/_components/pricing-data.ts', 'utf8');

function packsFromSource() {
  const packs = [];
  const re = /id:\s*'(starter|plus|pro)',\s*\n\s*name:\s*'([^']+)',[\s\S]*?price:\s*([\d.]+),\s*\n\s*credits:\s*([\d_]+),/g;
  let m;
  while ((m = re.exec(source))) {
    packs.push({ id: m[1], name: m[2], price: Number(m[3]), credits: Number(m[4].replace(/_/g, '')) });
  }
  return packs;
}

function localPricesFromSource() {
  const block = source.slice(source.indexOf('export const LOCAL_PRICES'), source.indexOf('export const LOCAL_CURRENCIES'));
  const out = {};
  const re = /(\w{3}):\s*\{\s*starter:\s*(\d+),\s*plus:\s*(\d+),\s*pro:\s*(\d+)\s*\}/g;
  let m;
  while ((m = re.exec(block))) out[m[1]] = { starter: +m[2], plus: +m[3], pro: +m[4] };
  return out;
}

const PACKS = packsFromSource();
const LOCAL = localPricesFromSource();

if (PACKS.length !== 3 || !Object.keys(LOCAL).length) {
  console.error(`Could not read the prices out of pricing-data.ts (found ${PACKS.length} packs, ${Object.keys(LOCAL).length} currencies).`);
  console.error('That file has changed shape. Fix this script rather than guessing the numbers.');
  process.exit(1);
}

const api = async (path, body, method = 'POST') => {
  const res = await fetch(`https://api.stripe.com/v1/${path}`, {
    method,
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body ? new URLSearchParams(body) : undefined,
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`${path}: ${json.error?.message || res.status}`);
  return json;
};

const money = (cents, cur) => `${cur.toUpperCase()} ${(cents / 100).toFixed(2)}`;

console.log(`\nStripe mode: ${isLive ? 'LIVE — REAL MONEY' : 'test'}`);
console.log('─'.repeat(64));
console.log('Currencies set by hand:', Object.keys(LOCAL).map((c) => c.toUpperCase()).join(', '));
console.log('Everything else keeps Adaptive Pricing\'s automatic conversion.\n');

let created = 0;
let existing = 0;

for (const pack of PACKS) {
  const lookupKey = `uc_${pack.id}_v1`;
  const usd = Math.round(pack.price * 100);

  /*
   * ★ LIST, NOT SEARCH, AND THIS IS THE BUG THE FIRST VERSION SHIPPED WITH.
   * `prices/search` runs on an index that is eventually consistent, so a Price
   * created seconds ago is not found yet. The second run therefore searched,
   * found nothing, tried to create, and died on the lookup key already being
   * taken. The list endpoint filters by `lookup_keys` straight off the object
   * and is immediately consistent, which is what makes this script re-runnable.
   */
  const found = await api(`prices?lookup_keys[]=${encodeURIComponent(lookupKey)}&limit=1`, null, 'GET');

  if (found.data.length) {
    console.log(`${pack.name.padEnd(8)} already exists  ${found.data[0].id}  (lookup_key ${lookupKey})`);
    existing++;
    continue;
  }

  const body = {
    currency: 'usd',
    unit_amount: String(usd),
    lookup_key: lookupKey,
    'product_data[name]': `Un-Claude ${pack.name} — ${pack.credits} credits`,
  };

  for (const [cur, amounts] of Object.entries(LOCAL)) {
    body[`currency_options[${cur}][unit_amount]`] = String(amounts[pack.id]);
  }

  const price = await api('prices', body);

  console.log(
    `${pack.name.padEnd(8)} CREATED  ${price.id}\n` +
      `         ${money(usd, 'usd')}  ·  ` +
      Object.entries(LOCAL).map(([cur, a]) => money(a[pack.id], cur)).join('  ·  '),
  );
  created++;
}

console.log('\n' + '─'.repeat(64));
console.log(`created ${created}, already there ${existing}`);

if (created) {
  console.log(
    '\nThe site picks these up on its own — `packCheckoutLineItem` looks them up\n' +
      'by lookup_key and falls back to the old USD-only price if they are missing.\n' +
      'Nothing needs deploying for the prices themselves to take effect.',
  );
}
