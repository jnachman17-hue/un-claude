/**
 * WHAT REFUNDS HAVE COST YOU BEYOND THE MONEY, as a number.
 *
 * Added 23 August 2026, lane B, with 20260823120000_refund_attribution.sql.
 *
 *   cd apps/web && node scripts/read-refund-shortfalls.mjs
 *
 * A refund hands back money. It can only take back the credits that payment
 * still has left — anything the customer already spent is work that was done,
 * paid for by you, and refunded anyway. Until today that difference existed
 * nowhere at all, so nobody could count it. This prints it.
 *
 * READ ONLY. Makes no writes of any kind.
 */
import { db } from './_lane-b-throwaway.mjs';

const money = (cents) => (cents == null ? '—' : `$${(cents / 100).toFixed(2)}`);

/*
 * Rows whose payment id begins `pi_LANEB_` were written by
 * verify-refund-attribution.mjs against throwaway accounts. They are real rows
 * describing money that never existed, and they cannot be tidied away: this
 * table is insert-only, so the reader skips them instead. It says how many.
 */
const TEST_PREFIX = 'pi_LANEB_';

const { data: all, error } = await db
  .from('refund_shortfalls')
  .select('*')
  .order('id', { ascending: true });

const data = (all ?? []).filter(
  (r) => !r.stripe_payment_intent_id?.startsWith(TEST_PREFIX),
);
const skipped = (all ?? []).length - data.length;

if (error) {
  console.error(`\nCannot read refund_shortfalls: ${error.message}`);
  console.error('Run migration 20260823120000_refund_attribution.sql first.\n');
  process.exit(1);
}

if (skipped) {
  console.log(`\n(${skipped} row(s) from verify-refund-attribution.mjs skipped — throwaway accounts.)`);
}

if (!data.length) {
  console.log('\nNo refund has ever given back more than it recovered. Nothing to report.\n');
  process.exit(0);
}

console.log('\nREFUNDS THAT GAVE BACK MORE THAN THEY RECOVERED');
console.log('='.repeat(72));

for (const r of data) {
  console.log(`\n  ${r.created_at.slice(0, 10)}  ${r.stripe_payment_intent_id}`);
  console.log(`    account            ${r.account_id ?? '(deleted)'}`);
  console.log(`    that payment sold  ${r.purchase_credits} credits for ${money(r.purchase_cents)}`);
  console.log(`    refund handed back ${money(r.refund_cents)}`);
  console.log(`    credits recovered  ${r.removed_credits} of ${r.target_credits}`);
  console.log(`>>  NOT RECOVERED      ${r.shortfall_credits} credits, worth ${money(r.shortfall_cents)}`);
}

const credits = data.reduce((s, r) => s + r.shortfall_credits, 0);
const cents = data.reduce((s, r) => s + (r.shortfall_cents ?? 0), 0);

console.log('\n' + '='.repeat(72));
console.log(`  ${data.length} refund(s) left a shortfall.`);
console.log(`  TOTAL: ${credits} credits of work refunded and not recovered, worth ${money(cents)}.`);
console.log('\n  Run scripts/stripe-refund-check.mjs BEFORE the next refund and this');
console.log('  figure is visible in advance instead of afterwards.\n');
