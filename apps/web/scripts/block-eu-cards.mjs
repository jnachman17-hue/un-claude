/**
 * Put the EU/EEA/UK card countries on Stripe's built-in card_country_blocklist.
 *
 * MODE IS AN ARGUMENT AND THERE IS NO DEFAULT, on purpose. Radar value lists are
 * per-mode: populating test proves nothing about live, and populating live is a
 * change to real payment behaviour.
 *
 *   node block-eu.mjs test        (safe, proves the mechanism)
 *   node block-eu.mjs live        (changes what real cards can do)
 */
import fs from 'node:fs';
import Stripe from 'stripe';

const mode = process.argv[2];
if (mode !== 'test' && mode !== 'live') {
  console.error('usage: node block-eu.mjs <test|live>');
  process.exit(1);
}

const env = fs.readFileSync('.env.local', 'utf8');
const key = new RegExp(`sk_${mode}[A-Za-z0-9_]*`).exec(env)?.[0];
if (!key) { console.error(`no sk_${mode} key found`); process.exit(1); }

const stripe = new Stripe(key);

/**
 * EU 27, plus the three EEA states that apply the same consumer directive, plus
 * the UK, which left the EU but kept the 14 day right in CCR 2013.
 *
 * THE UK IS IN HERE DELIBERATELY. It is not in the EU and it is not in EU VAT,
 * but the 14 day right of withdrawal is the reason this list exists and the UK
 * has it. Leaving GB out would block the tax problem and leave the consumer one.
 */
const EU = 'AT BE BG HR CY CZ DK EE FI FR DE GR HU IE IT LV LT LU MT NL PL PT RO SK SI ES SE'.split(' ');
const EEA = 'IS LI NO'.split(' ');
const UK = ['GB'];
const BLOCK = [...EU, ...EEA, ...UK];

const lists = await stripe.radar.valueLists.list({ limit: 100 });
const list = lists.data.find((l) => l.alias === 'card_country_blocklist');
if (!list) { console.error('card_country_blocklist not found'); process.exit(1); }

const existing = new Set();
for await (const item of stripe.radar.valueListItems.list({ value_list: list.id, limit: 100 })) {
  existing.add(item.value);
}

console.log(`mode: ${mode}`);
console.log(`list: ${list.id} (${list.alias})`);
console.log(`already on it: ${existing.size ? [...existing].join(' ') : '(empty)'}`);

let added = 0;
for (const country of BLOCK) {
  if (existing.has(country)) continue;
  await stripe.radar.valueListItems.create({ value_list: list.id, value: country });
  added++;
}

const after = [];
for await (const item of stripe.radar.valueListItems.list({ value_list: list.id, limit: 100 })) {
  after.push(item.value);
}
after.sort();
console.log(`added: ${added}`);
console.log(`list now holds ${after.length}: ${after.join(' ')}`);
