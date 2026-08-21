/**
 * READ AN ACTUAL RECEIPT, because reasoning about it is not evidence.
 *
 * Added 21 August 2026, session 11.
 *
 * THE QUESTION THIS ANSWERS. Jon asked whether his real name reaches customers.
 * Stripe's receipts documentation lists "Legal business name" among the things
 * always required on a receipt, and a SOLE PROPRIETOR HAS NO SEPARATE LEGAL
 * ENTITY — so the legal business name can default to the person. Everything
 * else a customer sees (the DBA, the statement descriptor, the support address)
 * carries the business name instead.
 *
 * So there is one plausible path by which a personal name lands on a stranger's
 * receipt. CLAUDE.md section 4: show the artefact, do not reason about it.
 * This fetches the newest real charge, follows its receipt URL, and prints what
 * the receipt actually says.
 *
 *   cd apps/web && node scripts/read-stripe-receipt.mjs
 *
 * READ ONLY. Retrieves charges and fetches a public receipt page. Charges
 * nothing, sends nothing, and changes nothing.
 */
import Stripe from 'stripe';
import fs from 'node:fs';
import path from 'node:path';

const HERE = path.dirname(new URL(import.meta.url).pathname);

const env = {};
for (const f of ['../.env', '../.env.local']) {
  const p = path.resolve(HERE, f);
  if (!fs.existsSync(p)) continue;
  for (const line of fs.readFileSync(p, 'utf8').split('\n')) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)$/.exec(line);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '').trim();
  }
}

if (!env.STRIPE_SECRET_KEY) {
  console.error('STRIPE_SECRET_KEY is not set.');
  process.exit(2);
}

const stripe = new Stripe(env.STRIPE_SECRET_KEY);

const charges = await stripe.charges.list({ limit: 5 });

if (!charges.data.length) {
  console.log('\nNo charges yet. Make a test purchase first.\n');
  process.exit(1);
}

const charge = charges.data[0];

console.log('\nTHE MOST RECENT CHARGE');
console.log('─'.repeat(64));
console.log('  id             ', charge.id);
console.log('  amount         ', `$${(charge.amount / 100).toFixed(2)} ${charge.currency.toUpperCase()}`);
console.log('  paid           ', charge.paid);
console.log('  livemode       ', charge.livemode, charge.livemode ? '<-- REAL MONEY' : '(test)');
console.log('  email          ', charge.billing_details?.email ?? charge.receipt_email ?? '—');
console.log('  descriptor     ', charge.calculated_statement_descriptor ?? '—');
console.log('  receipt_url    ', charge.receipt_url ? 'present' : 'MISSING');

/*
 * The statement descriptor is the OTHER thing a customer sees, on their card
 * statement rather than in their inbox, and it is the one Stripe's own guidance
 * calls a leading cause of disputes when unrecognisable.
 */
console.log('\nWHAT APPEARS ON THEIR CARD STATEMENT');
console.log('─'.repeat(64));
console.log('  ', charge.calculated_statement_descriptor ?? '(not set)');

if (!charge.receipt_url) {
  console.log('\nNo receipt URL on this charge — cannot read the receipt.\n');
  process.exit(1);
}

console.log('\nTHE RECEIPT ITSELF, fetched and stripped to its text');
console.log('─'.repeat(64));

const response = await fetch(charge.receipt_url);
const html = await response.text();

// Crude but adequate: strip tags, collapse whitespace, keep the visible words.
const text = html
  .replace(/<script[\s\S]*?<\/script>/gi, ' ')
  .replace(/<style[\s\S]*?<\/style>/gi, ' ')
  .replace(/<[^>]+>/g, '\n')
  .replace(/&amp;/g, '&')
  .replace(/&#x27;|&#39;/g, "'")
  .replace(/&quot;/g, '"')
  .replace(/&nbsp;/g, ' ')
  .split('\n')
  .map((l) => l.trim())
  .filter(Boolean);

// De-duplicate consecutive repeats, which the tag-stripping produces.
const lines = text.filter((l, i) => l !== text[i - 1]);

for (const line of lines.slice(0, 60)) console.log('  ' + line);

console.log('\n' + '─'.repeat(64));
console.log('READ THE ABOVE. The question is whether a PERSONAL name appears.');
console.log('Expected: the business name "Un-Claude", the support address, and');
console.log('the support email. If a personal legal name is there, the DBA is');
console.log('not set correctly — fix it in Settings > Business > Public details');
console.log('BEFORE going live.\n');
