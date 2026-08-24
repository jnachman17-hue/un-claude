/**
 * THE SAME QUESTION AS verify-grants-survive-deletion.mjs, ASKED OF THE LIVE
 * SITE RATHER THAN OF THE DATABASE.
 *
 * Added 24 August 2026, lane B.
 *
 *   cd apps/web && node scripts/verify-grants-through-the-site.mjs
 *
 * WHY BOTH SCRIPTS EXIST. The other one calls `claim_grant` directly, so it
 * proves the DATABASE refuses a second helping of free credits. That is only
 * half the fix. The credits a real customer receives are handed out by the
 * SITE, through `GET /api/credits`, and that code is deployed separately — so
 * between the migration landing and the deploy, the database refused and the
 * site minted them anyway.
 *
 * This one drives the real route on un-claude.com with a real session, so the
 * answer covers the path an actual person walks: sign up, get credits, delete
 * the account, sign up again on the same address.
 *
 *   BEFORE the deploy: 5, 5, 5.
 *   AFTER  the deploy: 5, 0, 0.
 *
 * NO MONEY IS INVOLVED and nothing is cleaned, scanned or rewritten. The
 * address begins `lane-b-money-`, the account is deleted at the end of every
 * round, and the grant-claim rows it leaves are cleared at the end.
 */
import {
  balanceOf,
  db,
  destroy,
  forgetGrantClaims,
  ledgerOf,
  printLedger,
  RUN,
  throwaway,
} from './_lane-b-throwaway.mjs';

const SITE = process.env.UC_SITE ?? 'https://un-claude.com';
const EMAIL = `lane-b-money-site-${RUN}@un-claude.com`;

let failures = 0;

function report(name, ok, detail) {
  if (!ok) failures += 1;
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${name}`);
  if (detail) console.log(`        ${detail}`);
}

/**
 * A session on the live site, through the product's own confirmation route,
 * using an admin-issued one-time token. Turnstile correctly refuses an
 * automated sign-in form — that is the captcha working, not a gap in it.
 */
async function sessionFor(email) {
  const { data: link, error } = await db.auth.admin.generateLink({
    type: 'magiclink',
    email,
  });

  if (error) throw new Error(`generateLink failed: ${error.message}`);

  const res = await fetch(
    `${SITE}/auth/confirm?token_hash=${link.properties.hashed_token}&type=magiclink`,
    { redirect: 'manual' },
  );

  const cookies = (res.headers.getSetCookie?.() ?? [])
    .map((c) => c.split(';')[0])
    .join('; ');

  if (!cookies) throw new Error(`no session cookie from /auth/confirm (HTTP ${res.status})`);

  return cookies;
}

console.log('\nCAN ONE ADDRESS COLLECT FREE CREDITS TWICE, THROUGH THE LIVE SITE?');
console.log('='.repeat(70));
console.log(`  site    ${SITE}`);
console.log(`  address ${EMAIL}`);

const collected = [];

for (let round = 1; round <= 3; round += 1) {
  const acct = await throwaway('site', EMAIL);

  const cookies = await sessionFor(EMAIL);

  // The one route that hands out free credits to a signed-in customer.
  const res = await fetch(`${SITE}/api/credits`, { headers: { cookie: cookies } });
  const said = await res.json();

  const balance = await balanceOf(acct.id);

  collected.push(balance);

  console.log(`\nround ${round}: account ${acct.id.slice(0, 8)}`);
  console.log(`  GET /api/credits -> HTTP ${res.status} ${JSON.stringify(said)}`);
  console.log(`  balance on the ledger: ${balance}`);
  printLedger(await ledgerOf(acct.id));

  await destroy(acct);
  console.log('  account deleted.');
}

console.log('\n' + '='.repeat(70));
console.log(`  credits collected per round: ${collected.join(', ')}`);
console.log(`  total free credits minted from ONE address: ${collected.reduce((a, b) => a + b, 0)}`);
console.log('');

report(
  'the first signup earns the full 5 free credits through the real route',
  collected[0] === 5,
  collected[0] === 5 ? undefined : `round 1 gave ${collected[0]}, expected 5`,
);

const closed = collected[1] === 0 && collected[2] === 0;

report(
  'deleting the account and signing up again earns NOTHING from the site',
  closed,
  closed
    ? undefined
    : `rounds 2 and 3 gave ${collected[1]} and ${collected[2]} credits — the ` +
      `site is still minting them, which means the deploy has not landed`,
);

const cleared = await forgetGrantClaims(EMAIL);
console.log(cleared ? '\n  grant_claims rows for this address cleared.' : '\n  (nothing to clear.)');

console.log('\n' + '='.repeat(70));

if (failures) {
  console.log(`\n${failures} CHECK(S) FAILED.\n`);
  process.exit(1);
}

console.log('\nOne inbox, one set of free credits — through the site, not just the database.\n');
