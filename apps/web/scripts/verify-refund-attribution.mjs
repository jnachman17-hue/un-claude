/**
 * A REFUND MUST TAKE BACK THE CREDITS OF THE PAYMENT BEING REFUNDED, AND
 * NOTHING ELSE. This proves it, in both directions, on the live database.
 *
 * Added 23 August 2026, lane B, for f1-audit.md finding 0a.
 *
 *   cd apps/web && node scripts/verify-refund-attribution.mjs
 *
 * WHAT WAS WRONG. `refund_purchase` decided how many credits it was allowed to
 * take back by looking at THE WHOLE ACCOUNT BALANCE. That is wrong twice over,
 * and the two failures cost money in opposite directions:
 *
 *   DIRECTION ONE — it takes credits the customer paid for and did not ask to
 *   have refunded. Buy pack A, spend it, buy pack B, refund pack A: A's credits
 *   are gone, so the balance clamp finds B's and removes those instead. The
 *   customer paid for B, never used it, and ends with nothing.
 *
 *   DIRECTION TWO — it hands back the whole payment and recovers almost
 *   nothing. Buy 10, spend 14, refund the lot: one credit comes back, the
 *   customer keeps nine credits' worth of work they were refunded for, and no
 *   record anywhere says so.
 *
 * WHAT THIS SCRIPT DOES. Builds both situations on throwaway accounts whose
 * addresses begin `lane-b-money-`, calls the real `refund_purchase` the Stripe
 * webhook calls, prints every ledger row, and checks the outcome. It deletes
 * the accounts afterwards whether it passes or fails.
 *
 * NO PURCHASE IS MADE AND NO MONEY MOVES. Credits are placed by writing the
 * same ledger rows the real grant and the real webhook write. Nothing outside
 * the two accounts it creates is read, written or deleted.
 */
import {
  balanceOf,
  db,
  destroy,
  forgetGrantClaims,
  ledgerOf,
  ledgerRow,
  ledgerRowIfMissing,
  printLedger,
  RUN,
  throwaway,
} from './_lane-b-throwaway.mjs';

let failures = 0;

function report(name, ok, detail) {
  if (!ok) failures += 1;
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${name}`);
  if (detail) console.log(`        ${detail}`);
}

/**
 * The five credits every real account starts with, written the same way.
 *
 * IF ONE IS ALREADY THERE, LEAVE IT. Since
 * 20260823120200_mint_signup_grant_at_signup.sql the database pays the signup
 * grant itself the moment an account is confirmed, so by the time this runs the
 * +3 row already exists. Inserting it again hits the once-per-account index and
 * throws — which is exactly how this script broke the first time it was run
 * after that migration landed. The account still ends on 5 either way.
 */
async function freeGrants(id) {
  await ledgerRowIfMissing(id, { delta: 2, reason: 'anon_grant' });
  await ledgerRowIfMissing(id, { delta: 3, reason: 'signup_grant' });

  const balance = await balanceOf(id);

  if (balance !== 5) {
    throw new Error(`expected the usual 5 free credits before buying, got ${balance}`);
  }
}

async function purchase(id, tag, credits, cents) {
  const pi = `pi_LANEB_${tag}_${RUN}`;

  await ledgerRow(id, {
    delta: credits,
    reason: 'purchase',
    stripe_event_id: `evt_LANEB_buy_${tag}_${RUN}`,
    stripe_payment_intent_id: pi,
    price_cents: cents,
  });

  return pi;
}

async function spendCredits(id, amount, words) {
  const { error } = await db.rpc('spend_credits', {
    target_account: id,
    amount,
    job_endpoint: 'clean',
    job_input_kind: 'text',
    job_words_in: words,
  });

  if (error) throw new Error(`spend_credits failed: ${error.message}`);
}

async function refundPayment(id, pi, tag, targetTotal, cents) {
  const { data, error } = await db.rpc('refund_purchase', {
    target_account: id,
    target_total: targetTotal,
    payment_intent: pi,
    event_id: `evt_LANEB_refund_${tag}_${RUN}`,
    refund_cents: cents,
  });

  if (error) throw new Error(`refund_purchase failed: ${error.message}`);

  return data ?? 0;
}

/**
 * The shortfall record: what a refund gave back that it could not recover.
 * Returns null when the table does not exist yet, which is how this script
 * tells "the migration has not been applied" from "the fix does not work".
 */
async function shortfallsFor(pi) {
  const { data, error } = await db
    .from('refund_shortfalls')
    .select('stripe_payment_intent_id, target_credits, removed_credits, shortfall_credits, shortfall_cents, refund_cents')
    .eq('stripe_payment_intent_id', pi);

  if (error) return null;

  return data ?? [];
}

console.log('\nREFUND ATTRIBUTION, run against the live database');
console.log('='.repeat(70));

let migrationApplied = null;

// ---------------------------------------------------------------------------
// DIRECTION ONE. Buy, spend it, buy again, refund the FIRST one.
// ---------------------------------------------------------------------------
{
  const acct = await throwaway('dir1');

  console.log(`\nDIRECTION ONE — refunding pack A must not touch pack B`);
  console.log('-'.repeat(70));
  console.log(`  account ${acct.id.slice(0, 8)}  ${acct.email}`);

  try {
    await freeGrants(acct.id);
    const packA = await purchase(acct.id, 'A', 10, 499);
    await spendCredits(acct.id, 15, 15_000);
    const packB = await purchase(acct.id, 'B', 10, 499);

    console.log(`\n  before the refund: balance ${await balanceOf(acct.id)}`);
    printLedger(await ledgerOf(acct.id));

    const removed = await refundPayment(acct.id, packA, 'A', 10, 499);
    const after = await balanceOf(acct.id);
    const shortfalls = await shortfallsFor(packA);

    migrationApplied = shortfalls !== null;

    console.log(`\n  Stripe refunds pack A in full ($4.99).`);
    console.log(`  credits removed by that refund: ${removed}`);
    console.log(`  balance after: ${after}`);
    printLedger(await ledgerOf(acct.id));

    console.log('');
    report(
      "pack B's 10 credits are still there",
      after === 10,
      after === 10
        ? undefined
        : `balance is ${after}, not 10 — the refund of pack A took ${10 - after} ` +
          `credits the customer paid for in pack B and never used`,
    );

    report(
      "the refund of pack A removes nothing, because pack A was already spent",
      removed === 0,
      removed === 0 ? undefined : `removed ${removed}, expected 0`,
    );

    if (shortfalls === null) {
      report(
        'the shortfall is written down',
        false,
        'table public.refund_shortfalls does not exist — migration ' +
          '20260823120000_refund_attribution.sql has NOT been applied',
      );
    } else {
      const row = shortfalls[0];
      console.log(`  shortfall rows for pack A: ${JSON.stringify(shortfalls)}`);
      report(
        'the shortfall is written down: $4.99 given back, 10 credits not recovered',
        !!row && row.shortfall_credits === 10,
        row ? `shortfall_credits=${row.shortfall_credits}` : 'no shortfall row written',
      );
    }
  } finally {
    await destroy(acct);
    await forgetGrantClaims(acct.email);
    console.log(`\n  throwaway account deleted.`);
  }
}

// ---------------------------------------------------------------------------
// DIRECTION TWO. Buy 10, spend 14, refund the whole payment.
// ---------------------------------------------------------------------------
{
  const acct = await throwaway('dir2');

  console.log(`\nDIRECTION TWO — a full refund of credits already spent must be recorded`);
  console.log('-'.repeat(70));
  console.log(`  account ${acct.id.slice(0, 8)}  ${acct.email}`);

  try {
    await freeGrants(acct.id);
    const pack = await purchase(acct.id, 'C', 10, 499);
    await spendCredits(acct.id, 14, 14_000);

    console.log(`\n  before the refund: balance ${await balanceOf(acct.id)}`);
    printLedger(await ledgerOf(acct.id));

    const removed = await refundPayment(acct.id, pack, 'C', 10, 499);
    const after = await balanceOf(acct.id);
    const shortfalls = await shortfallsFor(pack);

    console.log(`\n  Stripe refunds the whole $4.99.`);
    console.log(`  credits removed by that refund: ${removed}`);
    console.log(`  balance after: ${after}`);
    printLedger(await ledgerOf(acct.id));

    console.log('');
    report(
      'only the 1 credit that was left can come back',
      removed === 1,
      removed === 1 ? undefined : `removed ${removed}, expected 1`,
    );

    if (shortfalls === null) {
      report(
        'the 9-credit shortfall is written down',
        false,
        'table public.refund_shortfalls does not exist — migration ' +
          '20260823120000_refund_attribution.sql has NOT been applied. ' +
          'The customer keeps 9 credits of work they were refunded for and ' +
          'NOTHING RECORDS IT.',
      );
    } else {
      const row = shortfalls[0];
      console.log(`  shortfall rows for this payment: ${JSON.stringify(shortfalls)}`);
      report(
        'the 9-credit shortfall is written down, with what it was worth',
        !!row && row.shortfall_credits === 9 && row.shortfall_cents === 449,
        row
          ? `shortfall_credits=${row.shortfall_credits}, shortfall_cents=${row.shortfall_cents} (expected 9 and 449)`
          : 'no shortfall row written',
      );
    }
  } finally {
    await destroy(acct);
    await forgetGrantClaims(acct.email);
    console.log(`\n  throwaway account deleted.`);
  }
}

console.log('\n' + '='.repeat(70));

if (migrationApplied === false) {
  console.log(
    '\nThe migration 20260823120000_refund_attribution.sql has NOT been applied.\n' +
      'Everything above is the CURRENT live behaviour: both directions lose money.\n',
  );
}

if (failures) {
  console.log(`${failures} CHECK(S) FAILED.\n`);
  process.exit(1);
}

console.log('\nBoth directions are closed: a refund takes back only what that payment');
console.log('still has left, and what it could not recover is written down.');
console.log('\nTwo rows are left in refund_shortfalls, one per direction, against the');
console.log('throwaway payments above. That table is insert-only on purpose, so they');
console.log('cannot be tidied away — read-refund-shortfalls.mjs skips them by name.\n');
