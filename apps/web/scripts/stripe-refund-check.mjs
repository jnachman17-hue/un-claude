/**
 * BEFORE YOU REFUND SOMEBODY, RUN THIS.
 *
 * Added 21 August 2026, session 11. 04 entry 113.
 * CORRECTED 23 August 2026, lane B, after f1-audit.md caught it telling Jon to
 * refund money on a payment that was already refunded in full. See "WHAT WAS
 * WRONG" below.
 *
 * THE POLICY IS "UNSPENT CREDITS", AND STRIPE CANNOT SEE WHETHER THEY ARE
 * UNSPENT. The refund button lives in the Stripe dashboard, which knows about
 * money and knows nothing about credits. So the one fact you need in order to
 * apply the policy correctly is the one fact that screen cannot show you.
 *
 * This prints it: what that payment bought, how much of it has already been
 * refunded, how much of it the customer has since spent, and therefore how much
 * of it is actually left to take back.
 *
 *   cd apps/web && node scripts/stripe-refund-check.mjs pi_3abc...
 *   cd apps/web && node scripts/stripe-refund-check.mjs someone@example.com
 *
 * READ ONLY. This script makes no writes of any kind, touches nothing in
 * Stripe, and refunds nothing. It only tells you what you are about to do.
 *
 * ---------------------------------------------------------------------------
 * WHAT WAS WRONG, because this is the tool that stands between Jon and a
 * mistake with real money and it was wrong in the direction of paying out too
 * much.
 *
 * Run against the only real purchase the site had ever taken — a $4.99 pack
 * bought and then refunded IN FULL — it printed:
 *
 *     ALREADY REFUNDED 10 credits
 *     >> REFUNDABLE    1 of 10 credits
 *     >> THAT IS       $0.50 of $4.99
 *
 * Two separate errors, both in the same line of arithmetic:
 *
 *   1. It worked out what was refundable from THE ACCOUNT BALANCE, and never
 *      subtracted what had already been refunded. A payment refunded in full
 *      still looked refundable.
 *   2. The balance it used includes FREE GRANT CREDITS. The 1 credit it was
 *      offering to hand 50 cents back for was a signup gift the customer had
 *      never paid for.
 *
 * IT NOW ASKS THE SAME QUESTION THE DATABASE ASKS. `refund_purchase` was fixed
 * on the same day to clamp against what remains of THAT PAYMENT rather than
 * against the account balance (20260823120000_refund_attribution.sql), and this
 * script uses the identical rule, so the number printed here is the number that
 * will actually come back. Credits are attributed OLDEST FIRST: the free grants
 * arrive first and are used up first, and a purchase is only eaten into once
 * everything granted before it has gone.
 * ---------------------------------------------------------------------------
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
const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

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
    .in(
      'account_id',
      accounts.map((a) => a.id),
    )
    .eq('reason', 'purchase');

  if (error) throw new Error(error.message);

  return data ?? [];
}

/**
 * How much of ONE payment is still there to be taken back.
 *
 * The identical rule the database uses in `refund_purchase`. Credits are spent
 * oldest first, so:
 *
 *   still stands for  = what the payment bought, less what has already been
 *                       refunded against it
 *   queue ahead       = everything granted before it, less refunds already
 *                       taken against those earlier payments
 *   used from this    = spending beyond the queue ahead, capped at what the
 *                       payment still stands for
 *
 * Refunds are NOT counted as spending: they are already accounted for against
 * their own payment, and counting them twice would make an earlier refund eat a
 * later purchase.
 */
function leftOfThisPayment(purchase, rows) {
  const pi = purchase.stripe_payment_intent_id;

  const refundsFor = (paymentIntent) =>
    rows
      .filter((r) => r.reason === 'money_refund' && r.stripe_payment_intent_id === paymentIntent)
      .reduce((sum, r) => sum + Math.abs(r.delta), 0);

  const alreadyRefunded = refundsFor(pi);
  const stillStandsFor = Math.max(purchase.delta - alreadyRefunded, 0);

  const earlierPurchaseIntents = new Set(
    rows
      .filter((r) => r.reason === 'purchase' && r.id < purchase.id && r.stripe_payment_intent_id)
      .map((r) => r.stripe_payment_intent_id),
  );

  const earlierGranted = rows
    .filter((r) => r.delta > 0 && r.id < purchase.id)
    .reduce((sum, r) => sum + r.delta, 0);

  const earlierRefunded = [...earlierPurchaseIntents].reduce(
    (sum, intent) => sum + refundsFor(intent),
    0,
  );

  const queueAhead = Math.max(earlierGranted - earlierRefunded, 0);

  const totalSpent = rows
    .filter((r) => r.delta < 0 && r.reason !== 'money_refund')
    .reduce((sum, r) => sum + Math.abs(r.delta), 0);

  const usedFromThis = Math.min(Math.max(totalSpent - queueAhead, 0), stillStandsFor);

  return {
    alreadyRefunded,
    usedFromThis,
    left: Math.max(stillStandsFor - usedFromThis, 0),
  };
}

const purchases = await findPurchases();

if (!purchases.length) {
  console.log(`\nNo purchase found for "${arg}".`);
  console.log('Nothing to refund against the ledger. Check the id or the address.\n');
  process.exit(1);
}

for (const purchase of purchases) {
  const account = purchase.account_id;

  // Everything that has ever happened to this account, so the figure below can
  // be justified rather than asserted.
  const { data: rows, error } = await db
    .from('credit_ledger')
    .select('id, delta, reason, stripe_payment_intent_id, created_at')
    .eq('account_id', account)
    .order('id', { ascending: true });

  if (error) throw new Error(error.message);

  const balance = rows.reduce((sum, r) => sum + r.delta, 0);
  const spentLifetime = rows
    .filter((r) => r.reason === 'spend')
    .reduce((sum, r) => sum + Math.abs(r.delta), 0);

  const { alreadyRefunded, usedFromThis, left } = leftOfThisPayment(purchase, rows);

  const perCredit = purchase.price_cents ? purchase.price_cents / purchase.delta : 0;
  const refundableCents = Math.round(left * perCredit);

  const purchasedAt = new Date(purchase.created_at);
  const days = Math.floor((Date.now() - purchasedAt.getTime()) / 86_400_000);

  console.log('\n' + '─'.repeat(64));
  console.log(`ACCOUNT          ${account}`);
  console.log(`PAYMENT          ${purchase.stripe_payment_intent_id ?? '—'}`);
  console.log(`PURCHASED        ${purchase.delta} credits for ${money(purchase.price_cents)}`);
  console.log(`                 ${purchasedAt.toISOString().slice(0, 10)}  (${days} days ago)`);
  console.log('');
  console.log('THIS PAYMENT');
  console.log(`  bought                 ${String(purchase.delta).padStart(3)} credits`);
  console.log(`  already refunded       ${String(alreadyRefunded).padStart(3)} credits`);
  console.log(`  since spent            ${String(usedFromThis).padStart(3)} credits`);
  console.log(`  ------------------------------`);
  console.log(`>> STILL THERE TO TAKE BACK  ${left} of ${purchase.delta} credits`);
  console.log(`>> SO REFUND AT MOST         ${money(refundableCents)} of ${money(purchase.price_cents)}`);
  console.log('');
  console.log(`the account as a whole: balance ${plural(balance, 'credit')}, ` +
    `${plural(spentLifetime, 'credit')} spent in its lifetime`);
  console.log('(the balance includes free grant credits, which were never paid for');
  console.log(' and are never refundable — that is why it is not the figure above)');
  console.log('');

  // The things that make this a decision rather than a number.
  if (alreadyRefunded >= purchase.delta) {
    console.log('!! THIS PAYMENT HAS ALREADY BEEN REFUNDED IN FULL. There is nothing');
    console.log('   left to give back. Refunding again would be a second payment out');
    console.log('   of your pocket for the same sale. Check Stripe before doing');
    console.log('   anything at all.');
  } else if (alreadyRefunded > 0) {
    console.log(`!! ${money(Math.round(alreadyRefunded * perCredit))} of this payment has already been refunded.`);
    console.log(`   The figure above is what is left on top of that, not the whole sale.`);
  }

  if (days > 30) {
    console.log('!! OUTSIDE THE 30 DAY WINDOW the terms promise. Refunding is');
    console.log('   still your call, but it is now a goodwill decision.');
  }

  if (alreadyRefunded < purchase.delta && usedFromThis > 0) {
    const lostCents = Math.round(usedFromThis * perCredit);
    console.log(`!! THEY HAVE SPENT ${plural(usedFromThis, 'credit')} OF THIS PAYMENT. Refunding the`);
    console.log(`   full ${money(purchase.price_cents)} in Stripe will take back only ${plural(left, 'credit')},`);
    console.log(`   because the rest is work that has already been done. About`);
    console.log(`   ${money(lostCents)} of that refund is money you will not get back in`);
    console.log(`   credits, and it will be written to refund_shortfalls when the`);
    console.log(`   webhook lands.`);
  }

  if (alreadyRefunded === 0 && left === purchase.delta && days <= 30) {
    console.log('OK: fully unspent, nothing refunded yet, and inside the window.');
    console.log(`    A full ${money(purchase.price_cents)} refund in Stripe matches the policy exactly.`);
  }
}

console.log('\n' + '─'.repeat(64));
console.log('Refund in the Stripe dashboard. The charge.refunded webhook removes');
console.log('the credits automatically — do not remove them by hand.\n');
