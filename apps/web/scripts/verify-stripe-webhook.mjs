/**
 * PROVE THE WEBHOOK CANNOT BE FORGED.
 *
 * Added 21 August 2026, session 11. 04 entry 112.
 *
 * WHY THIS SCRIPT EXISTS. /api/stripe/webhook is a PUBLIC, UNAUTHENTICATED URL
 * that grants credits. Its entire defence is one signature check. If that check
 * is wrong — wrong secret handling, body parsed before verifying, a library
 * call that silently does nothing — then anyone who guesses the URL can POST
 * themselves a thousand credits, and NOTHING ELSE IN THE SYSTEM WOULD NOTICE,
 * because the resulting ledger row looks exactly like an honest sale.
 *
 * "The signature check works" is therefore the single claim in this whole
 * feature least acceptable as an assertion. CLAUDE.md section 4. So this runs
 * it, with real cryptography, and prints what happened.
 *
 *   cd apps/web && node scripts/verify-stripe-webhook.mjs
 *
 * WHAT IT PROVES: the mechanism. A genuine signature is accepted, and four
 * different ways of faking one are refused.
 *
 * WHAT IT DOES NOT PROVE, stated plainly rather than implied: that the running
 * route is wired to this mechanism correctly. That needs a real Stripe test key
 * and `stripe listen`, and it is the end-to-end test in stripe-setup.md. This
 * proves the lock works, not that the lock is on the door.
 *
 * No network, no database, no Stripe account, no keys. Exits non-zero if any
 * case behaves wrongly.
 */
import Stripe from 'stripe';

const stripe = new Stripe('sk_test_placeholder_not_a_real_key');

// A secret of the same shape Stripe issues, invented here. Never a real one.
const SECRET = 'whsec_verifyscript0000000000000000000000000';
const WRONG_SECRET = 'whsec_differentsecret0000000000000000000000';

const payload = JSON.stringify({
  id: 'evt_test_verification',
  object: 'event',
  type: 'checkout.session.completed',
  livemode: false,
  data: { object: { id: 'cs_test_123', payment_status: 'paid' } },
});

let failures = 0;

async function check(name, expectation, run) {
  let outcome;

  try {
    await run();
    outcome = 'accepted';
  } catch (err) {
    outcome = `rejected (${err.message.split('\n')[0].slice(0, 60)})`;
  }

  const ok = outcome.startsWith(expectation);

  if (!ok) failures += 1;

  console.log(`${ok ? '  PASS' : '  FAIL'}  ${name}`);
  console.log(`        expected ${expectation}, got ${outcome}`);
}

console.log('\nStripe webhook signature verification\n' + '─'.repeat(58));

// 1. The genuine article. A correctly signed payload must be accepted, or the
//    route would reject every real payment Stripe ever sends.
const goodHeader = stripe.webhooks.generateTestHeaderString({
  payload,
  secret: SECRET,
});

await check('a genuine Stripe signature', 'accepted', () =>
  stripe.webhooks.constructEventAsync(payload, goodHeader, SECRET),
);

// 2. No signature at all. The naive forgery: just POST some JSON.
await check('no signature header', 'rejected', () =>
  stripe.webhooks.constructEventAsync(payload, '', SECRET),
);

// 3. A made-up signature.
await check('an invented signature', 'rejected', () =>
  stripe.webhooks.constructEventAsync(
    payload,
    't=1,v1=0000000000000000000000000000000000000000000000000000000000000000',
    SECRET,
  ),
);

// 4. THE IMPORTANT ONE: a real signature over a DIFFERENT body. This is the
//    attack that a naive implementation lets through — verifying the signature,
//    then acting on a body that was swapped afterwards. Here the attacker takes
//    a legitimately signed $4.99 event and edits it to say 100 credits.
const tampered = payload.replace('cs_test_123', 'cs_test_ATTACKER');

await check('a valid signature over a TAMPERED body', 'rejected', () =>
  stripe.webhooks.constructEventAsync(tampered, goodHeader, SECRET),
);

// 5. Right payload, right shape, wrong secret. This is what a leaked-but-stale
//    secret, or the test secret in production, would look like.
await check('a signature made with the wrong secret', 'rejected', () =>
  stripe.webhooks.constructEventAsync(payload, goodHeader, WRONG_SECRET),
);

// 6. A replayed signature from outside the tolerance window. Stripe timestamps
//    every signature; an old one captured off the wire must not work for ever.
const oldHeader = stripe.webhooks.generateTestHeaderString({
  payload,
  secret: SECRET,
  timestamp: Math.floor(Date.now() / 1000) - 86_400,
});

await check('a signature replayed a day later', 'rejected', () =>
  stripe.webhooks.constructEventAsync(payload, oldHeader, SECRET, 300),
);

console.log('─'.repeat(58));

if (failures) {
  console.log(`\n${failures} CASE(S) BEHAVED WRONGLY. The webhook is not safe to expose.\n`);
  process.exit(1);
}

console.log('\nAll 6 cases behaved correctly.');
console.log('A forged, tampered, replayed or wrongly-signed request cannot');
console.log('reach the ledger. This proves the MECHANISM the route uses;');
console.log('the end-to-end test with a real key is in stripe-setup.md.\n');
