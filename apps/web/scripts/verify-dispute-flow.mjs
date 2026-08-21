/**
 * A LOST DISPUTE MUST TAKE THE CREDITS BACK.
 *
 * Added 21 August 2026, session 11. 04 entry 114.
 *
 * WHY THIS IS THE MOST IMPORTANT REVERSAL TO GET RIGHT. A dispute is the single
 * most expensive event in this business: the sale is gone, Stripe charges about
 * $15, and if the credits are ALSO left on the account the customer keeps the
 * product too. On a $24.99 Pro pack that is roughly $40 of loss on a $24.99
 * sale — the revenue of eight Starter packs, destroyed by one chargeback.
 *
 * THE BUG THIS TESTS FOR WAS CAUSED BY A CONFIDENT COMMENT. The original code
 * deliberately left the ledger alone on `charge.dispute.created`, reasoning
 * that "Stripe will send charge.refunded if it is eventually lost". IT DOES
 * NOT. A lost dispute arrives as `charge.dispute.closed` with status `lost`.
 * Because the comment was believed rather than checked, nothing removed the
 * credits at all, and nothing failed loudly enough to notice.
 *
 * WHAT IT DOES. Finds the newest purchase paid with Stripe's dispute test card,
 * confirms a dispute opened, confirms the credits are still intact at that
 * point (a dispute is an argument, not a verdict), then CLOSES the dispute —
 * which in test mode resolves it as lost — and confirms the credits come off.
 *
 *   cd apps/web && node scripts/verify-dispute-flow.mjs
 *
 * REQUIRES the dev server and `stripe listen` running. TEST KEY ONLY.
 */
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
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

if (!env.STRIPE_SECRET_KEY?.startsWith('sk_test_')) {
  console.error('REFUSING TO RUN: needs a TEST key (sk_test_). Closing a live dispute is irreversible.');
  process.exit(2);
}

const stripe = new Stripe(env.STRIPE_SECRET_KEY);
const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

let failures = 0;
const report = (name, ok, detail) => {
  if (!ok) failures += 1;
  console.log(`${ok ? '  PASS' : '  FAIL'}  ${name}`);
  if (detail) console.log(`        ${detail}`);
};
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const balanceOf = async (id) => (await db.rpc('credit_balance', { target_account: id })).data ?? 0;

const { data: purchases } = await db
  .from('credit_ledger')
  .select('account_id, delta, price_cents, stripe_payment_intent_id')
  .eq('reason', 'purchase')
  .order('id', { ascending: false })
  .limit(1);

const purchase = purchases?.[0];

if (!purchase?.stripe_payment_intent_id) {
  console.error('\nNo purchase found. Run: TEST_CARD=4000000000000259 node stripe-purchase.mjs starter\n');
  process.exit(1);
}

const account = purchase.account_id;
const pi = purchase.stripe_payment_intent_id;

console.log('\nDISPUTE FLOW, against a real test charge');
console.log('='.repeat(66));
console.log(`  account   ${account.slice(0, 8)}`);
console.log(`  payment   ${pi}`);
console.log(`  purchased ${purchase.delta} credits for ${purchase.price_cents}c`);

const beforeBalance = await balanceOf(account);
console.log(`  balance   ${beforeBalance}`);

// The dispute test card opens the dispute within a few seconds of the charge.
console.log('\n--- waiting for the dispute to open ---');

let dispute = null;

for (let attempt = 0; attempt < 10 && !dispute; attempt += 1) {
  const list = await stripe.disputes.list({ limit: 10 });

  dispute = list.data.find((d) => {
    const c = d.payment_intent;

    return (typeof c === 'string' ? c : c?.id) === pi;
  });

  if (!dispute) await wait(3000);
}

if (!dispute) {
  console.error('\nNo dispute opened for this payment. Was it paid with 4000000000000259?\n');
  process.exit(1);
}

console.log(`  dispute ${dispute.id}, reason "${dispute.reason}", status "${dispute.status}"`);

/*
 * A DISPUTE IS AN ARGUMENT, NOT A VERDICT. It can be won, and the most common
 * cause on a small digital purchase is a stolen card — punishing the account
 * holder at this point would be punishing the victim. So the credits must
 * still be there.
 */
await wait(4000);

const duringBalance = await balanceOf(account);

report(
  'an OPEN dispute leaves the credits alone',
  duringBalance === beforeBalance,
  duringBalance !== beforeBalance
    ? `balance moved from ${beforeBalance} to ${duringBalance} before the dispute was decided`
    : `balance still ${duringBalance}`,
);

console.log('\n--- closing the dispute (test mode resolves this as LOST) ---');

await stripe.disputes.close(dispute.id);

// Give the webhook time to arrive and the handler to write.
await wait(9000);

const afterBalance = await balanceOf(account);

const { data: reversals } = await db
  .from('credit_ledger')
  .select('delta, reason')
  .eq('stripe_payment_intent_id', pi)
  .eq('reason', 'money_refund');

const removed = (reversals ?? []).reduce((sum, r) => sum + Math.abs(r.delta), 0);

console.log(`  reversal rows: ${(reversals ?? []).map((r) => r.delta).join(', ') || '(none)'}`);
console.log(`  balance now: ${afterBalance}`);

report(
  `a LOST dispute removes all ${purchase.delta} credits it bought`,
  removed === purchase.delta,
  removed !== purchase.delta
    ? `expected ${purchase.delta} removed, got ${removed} — the customer keeps the money AND the credits`
    : undefined,
);

report(
  `the balance fell to ${beforeBalance - purchase.delta}`,
  afterBalance === beforeBalance - purchase.delta,
  afterBalance !== beforeBalance - purchase.delta
    ? `expected ${beforeBalance - purchase.delta}, got ${afterBalance}`
    : undefined,
);

console.log('\n' + '='.repeat(66));

if (failures) {
  console.log(`\n${failures} CHECK(S) FAILED.\n`);
  process.exit(1);
}

console.log('\nA lost dispute correctly reclaims the credits.\n');
