/**
 * Put the EU/EEA/UK card countries on Stripe's built-in card_country_blocklist.
 *
 * MODE IS AN ARGUMENT AND THERE IS NO DEFAULT, on purpose. Radar value lists are
 * per-mode: populating test proves nothing about live, and populating live is a
 * change to real payment behaviour.
 *
 *   node apps/web/scripts/block-eu-cards.mjs test   (safe, proves the mechanism)
 *   node apps/web/scripts/block-eu-cards.mjs live   (changes what real cards do)
 *
 * RUN IT FROM ANYWHERE. The keys are resolved against this file's own location
 * rather than the working directory, because the first person to run it stood
 * at the repo root, was given a path relative to apps/web, and got
 * MODULE_NOT_FOUND. A script that only works from one directory is a script
 * that fails the one time it matters.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Stripe from 'stripe';

const HERE = path.dirname(fileURLToPath(import.meta.url));

const mode = process.argv[2];
if (mode !== 'test' && mode !== 'live') {
  console.error('usage: node block-eu.mjs <test|live>');
  process.exit(1);
}

let env = '';
for (const name of ['../.env.local', '../.env']) {
  const file = path.resolve(HERE, name);
  if (fs.existsSync(file)) env += fs.readFileSync(file, 'utf8') + '\n';
}

const key = new RegExp(`sk_${mode}[A-Za-z0-9_]*`).exec(env)?.[0];

if (!key) {
  console.error(`No sk_${mode} key found in apps/web/.env.local or apps/web/.env.`);
  process.exit(1);
}

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

/*
 * CASE MATTERS HERE AND IT IS THE BUG THIS SCRIPT SHIPPED WITH.
 *
 * Stripe stores country codes on the list LOWERCASED, whatever case you send.
 * The first version held the codes uppercase and compared them raw, so
 * `existing.has('AT')` was false against a stored 'at', every re-run tried to
 * add all 31 again, and Stripe threw "This item already exists in this
 * case-insensitive list" on the first one. It was described as idempotent. It
 * was not, and the second run is the one that found out.
 */
const existing = new Set();
for await (const item of stripe.radar.valueListItems.list({ value_list: list.id, limit: 100 })) {
  existing.add(item.value.toUpperCase());
}

console.log(`mode:  ${mode}`);
console.log(`list:  ${list.id} (${list.alias})`);
console.log(`before: ${existing.size} ${existing.size ? [...existing].sort().join(' ') : '(empty)'}`);

let added = 0;
let already = 0;

for (const country of BLOCK) {
  if (existing.has(country)) { already++; continue; }

  try {
    await stripe.radar.valueListItems.create({ value_list: list.id, value: country });
    added++;
  } catch (error) {
    // Belt and braces behind the case fix above: a duplicate is the desired
    // end state, not a failure, so never let it abort a partial run.
    if (error?.raw?.message?.includes('already exists')) { already++; continue; }
    throw error;
  }
}

const after = [];
for await (const item of stripe.radar.valueListItems.list({ value_list: list.id, limit: 100 })) {
  after.push(item.value.toUpperCase());
}
after.sort();

console.log(`added:  ${added}`);
console.log(`already present: ${already}`);
console.log(`after:  ${after.length} ${after.join(' ')}`);

const missing = BLOCK.filter((c) => !after.includes(c));
console.log(missing.length ? `MISSING: ${missing.join(' ')}` : 'All 31 present. Done.');
