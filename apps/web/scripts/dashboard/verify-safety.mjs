/**
 * PROVE THE TWO SAFETY PROMISES, RATHER THAN ASSERTING THEM.
 *
 *     cd apps/web && node scripts/dashboard/verify-safety.mjs
 *
 * The dashboard promises two things: no key ever lands in the generated file,
 * and nothing is ever written to Stripe or to the database. This script tries to
 * break both and shows them refusing.
 *
 * `run.mjs` prints "CLEAN" every time it works, and a check that has only ever
 * printed CLEAN is indistinguishable from a check that returns CLEAN
 * unconditionally. `CLAUDE.md` section 4: the assertion is worth nothing, so
 * here is the check failing on purpose, on demand.
 *
 * WHAT IT DOES, IN SIX PARTS.
 *
 *   1-2. Takes the real keys off this machine, plants each into a pretend page
 *        IN MEMORY, and confirms the scanner finds it — then does the same with
 *        credential shapes belonging to nobody.
 *   3.   Re-scans ordinary prose that merely mentions key prefixes, to confirm
 *        the check is not simply shouting at everything. A check that flags
 *        everything is as useless as one that flags nothing.
 *   4.   Confirms redaction replaces a key rather than passing it through.
 *   5-6. Attempts the six writes that would actually be dangerous — creating a
 *        charge, issuing a refund, cancelling a payment, and inserting,
 *        updating or deleting a ledger row — and confirms every one is refused
 *        before a request leaves this machine. Then confirms the two
 *        read-shaped POSTs the dashboard legitimately needs still get through.
 *
 * NOTHING IS WRITTEN TO DISK BY THIS FILE, no request in part 5 ever reaches
 * Stripe or the database, and nothing it prints contains a key: the report says
 * which key was planted by NAME and whether it was caught, never what it was.
 */
import { loadEnv } from './env.mjs';
import { request } from './http.mjs';
import { scan, redact } from './leak-check.mjs';

const env = loadEnv();

const NAMES = ['STRIPE_SECRET_KEY', 'SUPABASE_SERVICE_ROLE_KEY', 'AI_GATEWAY_API_KEY', 'POSTHOG_PERSONAL_API_KEY'];
const secrets = NAMES.map((n) => env[n]).filter((v) => typeof v === 'string' && v.length >= 8);

console.log('\nDoes the secret check actually catch a secret?');
console.log('═'.repeat(66));

let failures = 0;

const check = (label, actual, expected, words = ['caught', 'not caught']) => {
  const pass = actual === expected;

  if (!pass) failures++;

  console.log(`  ${pass ? 'PASS' : 'FAIL'}  ${label.padEnd(52)} ${actual ? words[0] : words[1]}`);
};

// ---- 1. The real keys on this machine ------------------------------------
console.log('\n1. Real keys from this machine, planted into a pretend page');
console.log('─'.repeat(66));

for (const name of NAMES) {
  const value = env[name];

  if (!value) {
    console.log(`  SKIP  ${name.padEnd(52)} not set on this machine`);
    continue;
  }

  const page = `<p>Everything looks fine here ${value} and here.</p>`;

  check(name, !scan(page, secrets).clean, true);
}

// ---- 2. Credentials belonging to nobody ----------------------------------
/*
 * These are invented. They matter because they test the SHAPE half of the
 * check — the half that catches a credential this dashboard was never given but
 * which arrived inside somebody else's error message.
 */
console.log('\n2. Invented credentials this dashboard was never given');
console.log('─'.repeat(66));

const SHAPES = [
  ['a Stripe live key', 'sk_live_51QwErTyUiOpAsDfGhJkLzXcVbNm0'],
  ['a Stripe test key', 'sk_test_51QwErTyUiOpAsDfGhJkLzXcVbNm0'],
  ['a JWT / Supabase token', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIn0.abcdefghijklmnop'],
  ['a Vercel gateway key', 'vck_9aBcDeFgHiJkLmNoPqRsTuVwXyZ0123456'],
  ['a PostHog personal key', 'phx_9aBcDeFgHiJkLmNoPqRsTuVwXyZ0123456'],
  ['a Supabase secret key', 'sb_secret_9aBcDeFgHiJkLmNoPqRsTuVwXyZ'],
  ['a MASKED Stripe key, as Stripe quotes it back', 'sk_test_*******************0000'],
];

for (const [label, planted] of SHAPES) {
  check(label, !scan(`<p>error: ${planted}</p>`, secrets).clean, true);
}

// ---- 3. A page that is genuinely clean ------------------------------------
/*
 * The other half of a useful check. One that flags everything is as useless as
 * one that flags nothing, and this page's own prose discusses `sk_live_` and
 * `phx_` in English — that must not trip it.
 */
console.log('\n3. Ordinary text that merely talks about keys');
console.log('─'.repeat(66));

const innocent = `<p>Add STRIPE_SECRET_KEY to your env file. A live key starts with sk_live_ and a
  test key starts with sk_test_. PostHog keys begin phx_. Money in: $4.99. Spent: $10.44.</p>`;

check('prose mentioning key prefixes is NOT flagged', !scan(innocent, secrets).clean, false);

// ---- 4. Redaction ---------------------------------------------------------
console.log('\n4. Redaction replaces a key rather than passing it through');
console.log('─'.repeat(66));

for (const [label, planted] of SHAPES) {
  const cleaned = redact(`error: ${planted}`);

  check(`redacted: ${label}`, !cleaned.includes(planted) && cleaned.includes('[key hidden]'), true, ['hidden', 'STILL VISIBLE']);
}

// ---- 5. The read-only guarantee -------------------------------------------
/*
 * The other promise this dashboard makes: it never writes anything, anywhere.
 * Proved the same way — by trying to break it and showing that it refuses.
 *
 * `request()` throws on any method other than GET unless the URL is one of the
 * two documented read-shaped POSTs. So the test is: attempt the writes that
 * would actually be dangerous, and confirm each one is refused BEFORE a request
 * is made. Nothing here reaches Stripe or the database — the guard fires first,
 * which is the whole point.
 */
console.log('\n5. Attempts to write are refused before any request is sent');
console.log('─'.repeat(66));

const WRITES = [
  ['create a charge at Stripe', 'https://api.stripe.com/v1/charges', 'POST'],
  ['issue a refund at Stripe', 'https://api.stripe.com/v1/refunds', 'POST'],
  ['cancel a payment at Stripe', 'https://api.stripe.com/v1/payment_intents/pi_x/cancel', 'POST'],
  ['insert a row in the credit ledger', 'https://example.supabase.co/rest/v1/credit_ledger', 'POST'],
  ['update a row in the credit ledger', 'https://example.supabase.co/rest/v1/credit_ledger', 'PATCH'],
  ['delete a row from the credit ledger', 'https://example.supabase.co/rest/v1/credit_ledger', 'DELETE'],
];

for (const [label, url, method] of WRITES) {
  let refused = false;

  try {
    await request(url, { method, body: '{}' });
  } catch (error) {
    refused = String(error.message).includes('READ-ONLY VIOLATION');
  }

  check(label, refused, true, ['REFUSED', 'went through']);
}

/*
 * And the two POSTs that ARE allowed must still be allowed, or the guard would
 * be protecting us by breaking the product. These are called with a URL only —
 * they will fail on the network or on auth, and that is fine: what is being
 * tested is that the guard let them through rather than what the far end said.
 */
console.log('\n6. The two read-shaped POSTs are still permitted');
console.log('─'.repeat(66));

for (const [label, url] of [
  ['the AI gateway liveness probe', 'https://ai-gateway.vercel.sh/v1/chat/completions'],
  ['a PostHog HogQL read', 'https://us.posthog.com/api/projects/1/query/'],
]) {
  let blocked = false;

  try {
    await request(url, { method: 'POST', headers: { Authorization: 'Bearer not-a-key' }, body: '{}' });
  } catch (error) {
    blocked = String(error.message).includes('READ-ONLY VIOLATION');
  }

  check(label, blocked, false, ['refused', 'allowed through']);
}

console.log('\n' + '═'.repeat(66));

if (failures) {
  console.error(`${failures} CHECK(S) FAILED. Do not use the dashboard until this passes.\n`);
  process.exit(1);
}

console.log('All checks passed.');
console.log('  Secrets  : real keys caught, key shapes caught, ordinary prose ignored,');
console.log('             and anything credential-shaped is redacted rather than printed.');
console.log('  Read-only: every write to Stripe and to the database is refused by the');
console.log('             guard before a request leaves this machine.\n');
