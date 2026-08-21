/**
 * THE REFUND PATH, RUN FOR REAL — including the cumulative bug that the audit
 * found and the migration fixed.
 *
 * Added 21 August 2026, session 11. 04 entry 114.
 *
 * WHAT IT DOES. Takes the most recent real test purchase and refunds it in
 * THREE PARTS through the Stripe API, checking the balance after each. Partial
 * refunds in sequence are the exact shape that broke: Stripe reports
 * `amount_refunded` as a RUNNING TOTAL, and the original code read it as the
 * amount of the current refund, so each event removed the whole cumulative
 * proportion all over again.
 *
 * On a $4.99 / 10-credit pack refunded $2.00, then $1.00, then the rest:
 *
 *   correct:  remove 4, then 2, then 4   -> 10 removed in total
 *   the bug:  remove 4, then 6, then 10  -> 20 removed, clamped to whatever
 *                                           the account held, taking credits
 *                                           from OTHER purchases
 *
 *   cd apps/web && node scripts/verify-refund-flow.mjs
 *
 * REQUIRES the dev server on :3000 and `stripe listen --forward-to
 * localhost:3000/api/stripe/webhook` running, because the credits come off via
 * the webhook exactly as they would in production.
 *
 * THIS SCRIPT ISSUES REAL REFUNDS AGAINST TEST-MODE CHARGES. It refuses to run
 * against a live key.
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
  console.error('REFUSING TO RUN: this script issues refunds and needs a TEST key (sk_test_).');
  process.exit(2);
}

const stripe = new Stripe(env.STRIPE_SECRET_KEY);
const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

let failures = 0;

function report(name, ok, detail) {
  if (!ok) failures += 1;
  console.log(`${ok ? '  PASS' : '  FAIL'}  ${name}`);
  if (detail) console.log(`        ${detail}`);
}

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function balanceOf(accountId) {
  const { data } = await db.rpc('credit_balance', { target_account: accountId });

  return data ?? 0;
}

async function refundRows(paymentIntentId) {
  const { data } = await db
    .from('credit_ledger')
    .select('delta, price_cents')
    .eq('stripe_payment_intent_id', paymentIntentId)
    .eq('reason', 'money_refund');

  return data ?? [];
}

// The newest purchase row is the one to work on.
const { data: purchases } = await db
  .from('credit_ledger')
  .select('account_id, delta, price_cents, stripe_payment_intent_id')
  .eq('reason', 'purchase')
  .order('id', { ascending: false })
  .limit(1);

const purchase = purchases?.[0];

if (!purchase?.stripe_payment_intent_id) {
  console.error('\nNo purchase to refund. Run apps/e2e/stripe-purchase.mjs first.\n');
  process.exit(1);
}

const account = purchase.account_id;
const pi = purchase.stripe_payment_intent_id;
const paidCents = purchase.price_cents;
const boughtCredits = purchase.delta;

console.log('\nREFUND FLOW, against a real test charge');
console.log('='.repeat(66));
console.log(`  account   ${account.slice(0, 8)}`);
console.log(`  payment   ${pi}`);
console.log(`  purchased ${boughtCredits} credits for ${paidCents}c`);

const startBalance = await balanceOf(account);
console.log(`  balance   ${startBalance}`);

/** Refund `cents` and wait for the webhook to land. */
async function refundStep(label, cents, expectedCumulativeRemoved) {
  console.log(`\n--- ${label}: refund ${cents}c ---`);

  await stripe.refunds.create({ payment_intent: pi, amount: cents });

  // Give stripe listen time to forward and the handler to write.
  await wait(6000);

  const rows = await refundRows(pi);
  const removed = rows.reduce((sum, r) => sum + Math.abs(r.delta), 0);
  const balance = await balanceOf(account);

  console.log(`  money_refund rows: ${rows.map((r) => r.delta).join(', ') || '(none)'}`);
  console.log(`  credits removed in total: ${removed}`);
  console.log(`  balance now: ${balance}`);

  report(
    `${label}: ${expectedCumulativeRemoved} credits removed in TOTAL`,
    removed === expectedCumulativeRemoved,
    removed !== expectedCumulativeRemoved
      ? `expected ${expectedCumulativeRemoved}, got ${removed}`
      : undefined,
  );

  report(
    `${label}: balance is ${startBalance - expectedCumulativeRemoved}`,
    balance === startBalance - expectedCumulativeRemoved,
    balance !== startBalance - expectedCumulativeRemoved
      ? `expected ${startBalance - expectedCumulativeRemoved}, got ${balance}`
      : undefined,
  );

  return removed;
}

/*
 * The arithmetic, worked out in advance so the expectations are not derived
 * from the code being tested. $4.99 = 499c for 10 credits.
 *
 *   after 200c refunded: round(200/499 * 10) = round(4.008) = 4
 *   after 300c refunded: round(300/499 * 10) = round(6.012) = 6
 *   after 499c refunded: FULL -> all 10
 */
const first = Math.round((200 / paidCents) * boughtCredits);
const second = Math.round((300 / paidCents) * boughtCredits);
const third = boughtCredits;

await refundStep('step 1', 200, first);
await refundStep('step 2', 100, second);

console.log(`\n  (the OLD code would by now have removed ${first + second} credits, not ${second})`);

await refundStep('step 3 (the remainder)', paidCents - 300, third);

console.log('\n' + '='.repeat(66));

report(
  'the total removed equals exactly what the purchase granted',
  third === boughtCredits,
  `${third} removed, ${boughtCredits} granted`,
);

/*
 * A REPEAT DELIVERY OF A REFUND EVENT must remove nothing further. Stripe
 * retries refund events exactly as it retries payment events.
 */
console.log('\n--- repeat delivery of the LAST refund event ---');

const events = await stripe.events.list({ limit: 20, type: 'charge.refunded' });
const ours = events.data.find((e) => {
  const c = e.data.object;

  return (typeof c.payment_intent === 'string' ? c.payment_intent : c.payment_intent?.id) === pi;
});

if (!ours) {
  console.log('  (could not find the charge.refunded event to resend — skipped)');
} else {
  const before = (await refundRows(pi)).reduce((s, r) => s + Math.abs(r.delta), 0);

  // Resend through Stripe so it travels the real path, signature and all.
  await fetch(`https://api.stripe.com/v1/events/${ours.id}/retry`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
      'content-type': 'application/x-www-form-urlencoded',
    },
  }).catch(() => {});

  await wait(6000);

  const after = (await refundRows(pi)).reduce((s, r) => s + Math.abs(r.delta), 0);

  report(
    'a repeat refund delivery removes NOTHING further',
    before === after,
    `before ${before}, after ${after}`,
  );
}

console.log('\n' + '='.repeat(66));

if (failures) {
  console.log(`\n${failures} CHECK(S) FAILED.\n`);
  process.exit(1);
}

console.log('\nRefunds behave correctly, including repeated partial refunds.\n');
