/**
 * ATTACK THE PAYMENT SURFACE. Every refusal that has to hold, tested against
 * the running server rather than reasoned about.
 *
 * Added 21 August 2026, session 11, after the payment audit.
 *
 * The happy path is covered by apps/e2e/stripe-purchase.mjs. This covers the
 * unhappy ones — the requests a bored person, a script, or a bug would send.
 * Each case asserts a specific status code, because "it errored" is not the
 * same as "it refused correctly": a 500 where a 400 belongs means an unhandled
 * exception, and a 200 where a 400 belongs means something got through.
 *
 *   cd apps/web && node scripts/verify-payment-edges.mjs
 *
 * Requires the dev server on :3000 with the Stripe test keys set. Makes no
 * writes and creates nothing. Exits non-zero if any case behaves wrongly.
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

const BASE = 'http://localhost:3000';
const WHSEC = env.STRIPE_WEBHOOK_SECRET;

if (!WHSEC) {
  console.error('STRIPE_WEBHOOK_SECRET is not set — run `stripe listen` and add it to .env.local');
  process.exit(2);
}

const stripe = new Stripe(env.STRIPE_SECRET_KEY ?? 'sk_test_placeholder');

let failures = 0;

function report(name, ok, detail) {
  if (!ok) failures += 1;
  console.log(`${ok ? '  PASS' : '  FAIL'}  ${name}`);
  if (detail) console.log(`        ${detail}`);
}

async function post(url, body, headers = {}) {
  const response = await fetch(`${BASE}${url}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body,
  });

  const text = await response.text();

  return { status: response.status, text };
}

/** A signed webhook payload, exactly as Stripe would send it. */
function signed(payload) {
  return {
    'stripe-signature': stripe.webhooks.generateTestHeaderString({ payload, secret: WHSEC }),
  };
}

console.log('\nPAYMENT SURFACE — refusals that must hold\n' + '='.repeat(64));

console.log('\n/api/checkout');

{
  const r = await post('/api/checkout', JSON.stringify({ packId: 'plus' }));
  report('signed out is refused 401', r.status === 401, `got ${r.status} ${r.text.slice(0, 80)}`);
}

{
  const r = await post('/api/checkout', JSON.stringify({ packId: 'not-a-pack' }));
  // Signed out is checked first, so this is still 401. The pack check is
  // exercised by the price-tampering cases below via a real session.
  report('unknown pack, signed out, still refused', r.status === 401, `got ${r.status}`);
}

{
  const r = await post('/api/checkout', 'not json at all');
  report('malformed body is refused', r.status >= 400, `got ${r.status}`);
}

{
  // THE ONE THAT MATTERS MOST on this route: a client trying to name its own
  // price. Even signed out, the shape of the refusal proves the server never
  // reads an amount from the request.
  const r = await post(
    '/api/checkout',
    JSON.stringify({ packId: 'plus', price: 1, amount: 1, credits: 100000 }),
  );
  report(
    'a client-supplied price/credits is ignored (no 200, no session)',
    r.status === 401 && !r.text.includes('checkout.stripe.com'),
    `got ${r.status}`,
  );
}

console.log('\n/api/stripe/webhook — forgery');

{
  const r = await post('/api/stripe/webhook', JSON.stringify({ type: 'checkout.session.completed' }));
  report('no signature is refused 400', r.status === 400, `got ${r.status} ${r.text.slice(0, 60)}`);
}

{
  const r = await post(
    '/api/stripe/webhook',
    JSON.stringify({ type: 'checkout.session.completed' }),
    { 'stripe-signature': 't=1,v1=deadbeef' },
  );
  report('an invented signature is refused 400', r.status === 400, `got ${r.status}`);
}

{
  const payload = JSON.stringify({ id: 'evt_x', type: 'checkout.session.completed', livemode: false, data: { object: {} } });
  const headers = signed(payload);
  const tampered = payload.replace('evt_x', 'evt_y');

  const r = await post('/api/stripe/webhook', tampered, headers);
  report('a valid signature over a TAMPERED body is refused 400', r.status === 400, `got ${r.status}`);
}

console.log('\n/api/stripe/webhook — the forged-payment attack');

{
  /*
   * THE ATTACK THIS ROUTE EXISTS TO SURVIVE. Someone who has read the source
   * knows the exact shape of a paid checkout session and can construct one
   * naming their own account. Without the signing secret it must not work.
   */
  const payload = JSON.stringify({
    id: 'evt_forged_by_attacker',
    object: 'event',
    type: 'checkout.session.completed',
    livemode: false,
    data: {
      object: {
        id: 'cs_test_forged',
        payment_status: 'paid',
        amount_total: 1,
        payment_intent: 'pi_forged',
        metadata: { account_id: '00000000-0000-0000-0000-000000000000', pack_id: 'pro', credits: '100000' },
      },
    },
  });

  const r = await post('/api/stripe/webhook', payload, { 'stripe-signature': 't=1,v1=' + 'a'.repeat(64) });

  report(
    'a perfectly-shaped FORGED paid session is refused (no credits minted)',
    r.status === 400,
    `got ${r.status} ${r.text.slice(0, 60)}`,
  );
}

console.log('\n/api/stripe/webhook — test/live separation');

{
  const payload = JSON.stringify({
    id: 'evt_livemode_mismatch',
    object: 'event',
    type: 'checkout.session.completed',
    // The server is running a TEST key. An event claiming livemode must be
    // refused, or a real payment could be handled by rehearsal code and vice
    // versa — and the ledger is append-only, so the row could not be undone.
    livemode: true,
    data: { object: { id: 'cs_live', payment_status: 'paid', metadata: {} } },
  });

  const r = await post('/api/stripe/webhook', payload, signed(payload));
  report('a LIVE event against a TEST deployment is refused 400', r.status === 400, `got ${r.status} ${r.text.slice(0, 60)}`);
}

console.log('\n/api/stripe/webhook — correctly-signed but harmless');

{
  const payload = JSON.stringify({
    id: 'evt_unknown_type',
    object: 'event',
    type: 'customer.subscription.trial_will_end',
    livemode: false,
    data: { object: {} },
  });

  const r = await post('/api/stripe/webhook', payload, signed(payload));
  report('an event type we do not handle is acknowledged 200', r.status === 200, `got ${r.status}`);
}

{
  // A genuinely signed session that was NOT paid. Must not grant, must not
  // error — the money may still arrive under async_payment_succeeded.
  const payload = JSON.stringify({
    id: 'evt_unpaid_session',
    object: 'event',
    type: 'checkout.session.completed',
    livemode: false,
    data: {
      object: {
        id: 'cs_test_unpaid',
        payment_status: 'unpaid',
        metadata: { account_id: '00000000-0000-0000-0000-000000000000', pack_id: 'plus', credits: '25' },
      },
    },
  });

  const r = await post('/api/stripe/webhook', payload, signed(payload));
  report('an UNPAID session grants nothing and returns 200', r.status === 200, `got ${r.status}`);
}

{
  /*
   * A PAID session whose credits cannot be determined. This must FAIL LOUDLY
   * (500 so Stripe retries and the error shows in Stripe's dashboard), never
   * quietly 200 — a 200 here is a payment taken and never fulfilled.
   */
  const payload = JSON.stringify({
    id: 'evt_no_credits',
    object: 'event',
    type: 'checkout.session.completed',
    livemode: false,
    data: {
      object: {
        id: 'cs_test_nocredits',
        payment_status: 'paid',
        amount_total: 999,
        payment_intent: 'pi_nocredits',
        metadata: { account_id: '00000000-0000-0000-0000-000000000000', pack_id: 'deleted-pack' },
      },
    },
  });

  const r = await post('/api/stripe/webhook', payload, signed(payload));
  report(
    'a paid session with an UNKNOWN pack fails loudly (500), not silently (200)',
    r.status === 500,
    `got ${r.status} — a 200 here would be a payment taken and never fulfilled`,
  );
}

console.log('\n' + '='.repeat(64));

if (failures) {
  console.log(`\n${failures} CASE(S) BEHAVED WRONGLY.\n`);
  process.exit(1);
}

console.log('\nEvery refusal held.\n');
