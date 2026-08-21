/**
 * BEFORE YOU REFUND SOMEBODY, RUN THIS.
 *
 * Added 21 August 2026, session 11. 04 entry 113.
 *
 * THE POLICY IS "UNSPENT CREDITS", AND STRIPE CANNOT SEE WHETHER THEY ARE
 * UNSPENT. The refund button lives in the Stripe dashboard, which knows about
 * money and knows nothing about credits. So the one fact you need in order to
 * apply the policy correctly is the one fact that screen cannot show you.
 *
 * This prints it: what they bought, what they have spent since, and therefore
 * how much of the purchase is actually refundable under the terms.
 *
 *   cd apps/web && node scripts/stripe-refund-check.mjs pi_3abc...
 *   cd apps/web && node scripts/stripe-refund-check.mjs someone@example.com
 *
 * READ ONLY. This script makes no writes of any kind, touches nothing in
 * Stripe, and refunds nothing. It only tells you what you are about to do.
 *
 * Reads the project's own .env / .env.local for the Supabase URL and service
 * key. It uses those values and never prints them.
 */
import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs';
import path from 'node:path';

/*
 * Resolved against THIS FILE, not the working directory. The older scripts use
 * `path.resolve('../.env')`, which silently reads nothing unless you happen to
 * have cd'd into scripts/ first — it does not error, it just produces a client
 * with no URL and a confusing crash three lines later.
 */
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

const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const arg = process.argv[2];

if (!arg) {
  console.error('Usage: node scripts/stripe-refund-check.mjs <payment_intent_id | email>');
  process.exit(2);
}

const money = (cents) => (cents == null ? '—' : `$${(cents / 100).toFixed(2)}`);

/** Resolve the argument to a set of purchase rows. */
async function findPurchases() {
  if (arg.startsWith('pi_')) {
    const { data, error } = await db
      .from('credit_ledger')
      .select('id, account_id, delta, price_cents, stripe_payment_intent_id, created_at')
      .eq('stripe_payment_intent_id', arg)
      .eq('reason', 'purchase');

    if (error) throw new Error(error.message);

    return data ?? [];
  }

  // An email. Find the account, then its purchases.
  const { data: accounts, error: accountError } = await db
    .from('accounts')
    .select('id, email')
    .ilike('email', arg);

  if (accountError) throw new Error(accountError.message);

  if (!accounts?.length) return [];

  const { data, error } = await db
    .from('credit_ledger')
    .select('id, account_id, delta, price_cents, stripe_payment_intent_id, created_at')
    .in('account_id', accounts.map((a) => a.id))
    .eq('reason', 'purchase');

  if (error) throw new Error(error.message);

  return data ?? [];
}

const purchases = await findPurchases();

if (!purchases.length) {
  console.log(`\nNo purchase found for "${arg}".`);
  console.log('Nothing to refund against the ledger. Check the id or the address.\n');
  process.exit(1);
}

for (const purchase of purchases) {
  const account = purchase.account_id;

  // The balance, and everything that has happened to this account, so the
  // "unspent" figure below can be justified rather than asserted.
  const { data: rows, error } = await db
    .from('credit_ledger')
    .select('delta, reason, created_at')
    .eq('account_id', account);

  if (error) throw new Error(error.message);

  const balance = rows.reduce((sum, r) => sum + r.delta, 0);
  const spent = rows
    .filter((r) => r.reason === 'spend')
    .reduce((sum, r) => sum + Math.abs(r.delta), 0);
  const alreadyRefunded = rows
    .filter((r) => r.reason === 'money_refund')
    .reduce((sum, r) => sum + Math.abs(r.delta), 0);

  /*
   * REFUNDABLE IS CAPPED BY THE BALANCE, NOT ONLY BY THE PURCHASE. If they
   * bought 25 and have 4 left, only 4 can come back, whatever they paid. That
   * clamp is enforced in the database by refund_purchase; this is the same
   * arithmetic shown in advance so the decision is made with it rather than
   * discovered afterwards.
   */
  const refundableCredits = Math.min(purchase.delta, Math.max(balance, 0));

  const perCredit = purchase.price_cents ? purchase.price_cents / purchase.delta : 0;
  const refundableCents = Math.round(refundableCredits * perCredit);

  const purchasedAt = new Date(purchase.created_at);
  const days = Math.floor((Date.now() - purchasedAt.getTime()) / 86_400_000);

  console.log('\n' + '─'.repeat(64));
  console.log(`ACCOUNT          ${account}`);
  console.log(`PAYMENT          ${purchase.stripe_payment_intent_id ?? '—'}`);
  console.log(`PURCHASED        ${purchase.delta} credits for ${money(purchase.price_cents)}`);
  console.log(`                 ${purchasedAt.toISOString().slice(0, 10)}  (${days} days ago)`);
  console.log('');
  console.log(`BALANCE NOW      ${balance} credits`);
  console.log(`SPENT (lifetime) ${spent} credits`);
  if (alreadyRefunded) console.log(`ALREADY REFUNDED ${alreadyRefunded} credits`);
  console.log('');
  console.log(`>> REFUNDABLE    ${refundableCredits} of ${purchase.delta} credits`);
  console.log(`>> THAT IS       ${money(refundableCents)} of ${money(purchase.price_cents)}`);
  console.log('');

  // The two things that make this a decision rather than a number.
  if (days > 30) {
    console.log('!! OUTSIDE THE 30 DAY WINDOW the terms promise. Refunding is');
    console.log('   still your call, but it is now a goodwill decision.');
  }

  if (refundableCredits < purchase.delta) {
    console.log(`!! THEY HAVE SPENT SOME. Refunding the full ${money(purchase.price_cents)} in`);
    console.log(`   Stripe will take back only ${refundableCredits} credits, because the`);
    console.log('   balance is clamped at zero. The difference is work already');
    console.log('   done and paid for by you.');
  }

  if (refundableCredits === purchase.delta && days <= 30) {
    console.log('OK: fully unspent and inside the window. A full refund in Stripe');
    console.log('    matches the policy exactly.');
  }
}

console.log('\n' + '─'.repeat(64));
console.log('Refund in the Stripe dashboard. The charge.refunded webhook removes');
console.log('the credits automatically — do not remove them by hand.\n');
