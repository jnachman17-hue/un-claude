/**
 * FREE CREDITS MUST NOT BE MINTABLE BY DELETING YOUR ACCOUNT AND SIGNING UP
 * AGAIN. This proves whether they are, on the live database.
 *
 * Added 23 August 2026, lane B, for f1-audit.md finding 0c.
 *
 *   cd apps/web && node scripts/verify-grants-survive-deletion.mjs
 *
 * WHAT WAS WRONG. The record that stops one inbox collecting the signup grant
 * twice was a column on the CREDIT LEDGER — and deleting an account cascades
 * its ledger rows away. So the guard was deleted along with the thing it was
 * guarding against, and the product ships a "Delete your Account" button. Five
 * credits, again and again, from one address.
 *
 * WHAT THIS SCRIPT DOES. Creates a throwaway account, gives it the grants the
 * server gives, reads the balance, deletes the account, and does the whole
 * thing again on THE SAME ADDRESS, three times over. It then says how many
 * credits that address collected in total.
 *
 *   BEFORE the fix: 5, 5, 5.
 *   AFTER  the fix: 5, 0, 0.
 *
 * It calls `claim_grant` if that function exists, and falls back to the plain
 * ledger inserts the server makes today if it does not — so it exercises
 * whichever path is actually live.
 *
 * NO MONEY IS INVOLVED. The address begins `lane-b-money-`, the account is
 * deleted at the end of every round, and the grant-claim rows it leaves behind
 * are cleared at the end.
 */
import {
  balanceOf,
  db,
  destroy,
  forgetGrantClaims,
  ledgerOf,
  ledgerRowIfMissing,
  printLedger,
  RUN,
  throwaway,
} from './_lane-b-throwaway.mjs';

const EMAIL = `lane-b-money-mint-${RUN}@un-claude.com`;
const WELCOME_CREDITS = 2;
const SIGNUP_CREDITS = 3;

let failures = 0;

function report(name, ok, detail) {
  if (!ok) failures += 1;
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${name}`);
  if (detail) console.log(`        ${detail}`);
}

/** The same email normalisation the server does, for the fallback path only. */
function normalizeEmail(email) {
  const trimmed = email.trim().toLowerCase();
  const at = trimmed.lastIndexOf('@');
  let local = trimmed.slice(0, at);
  let domain = trimmed.slice(at + 1);
  const plus = local.indexOf('+');
  if (plus !== -1) local = local.slice(0, plus);
  if (domain === 'gmail.com' || domain === 'googlemail.com') {
    local = local.replace(/\./g, '');
    domain = 'gmail.com';
  }
  return `${local}@${domain}`;
}

let usingClaims = null;

/**
 * Hand this account the grants a real, non-anonymous account is entitled to,
 * by the same route the server uses.
 */
async function applyGrants(accountId, email) {
  const viaClaim = async (reason, credits) => {
    const { data, error } = await db.rpc('claim_grant', {
      target_account: accountId,
      raw_email: email,
      grant_reason: reason,
      credits,
    });

    if (error) return { supported: false };

    return { supported: true, granted: data === true };
  };

  const anon = await viaClaim('anon_grant', WELCOME_CREDITS);

  if (anon.supported) {
    usingClaims = true;
    await viaClaim('signup_grant', SIGNUP_CREDITS);
    return;
  }

  usingClaims = false;

  // The live path today: two plain inserts, idempotent by unique index.
  await ledgerRowIfMissing(accountId, { delta: WELCOME_CREDITS, reason: 'anon_grant' });
  await ledgerRowIfMissing(accountId, {
    delta: SIGNUP_CREDITS,
    reason: 'signup_grant',
    grant_email: normalizeEmail(email),
  });
}

console.log('\nCAN ONE ADDRESS COLLECT FREE CREDITS TWICE?');
console.log('='.repeat(70));
console.log(`  address ${EMAIL}`);

const collected = [];

for (let round = 1; round <= 3; round += 1) {
  const acct = await throwaway('mint', EMAIL);

  await applyGrants(acct.id, EMAIL);

  const balance = await balanceOf(acct.id);
  const rows = await ledgerOf(acct.id);

  collected.push(balance);

  console.log(`\nround ${round}: account ${acct.id.slice(0, 8)}  balance ${balance}`);
  printLedger(rows);

  await destroy(acct);
  console.log(`  account deleted.`);
}

console.log('\n' + '='.repeat(70));
console.log(
  `  the grant path in use: ${usingClaims ? 'claim_grant (migration applied)' : 'plain ledger inserts (migration NOT applied)'}`,
);
console.log(`  credits collected per round: ${collected.join(', ')}`);
console.log(`  total free credits minted from ONE address: ${collected.reduce((a, b) => a + b, 0)}`);
console.log('');

report(
  'the first signup earns the full 5 free credits',
  collected[0] === WELCOME_CREDITS + SIGNUP_CREDITS,
  collected[0] === WELCOME_CREDITS + SIGNUP_CREDITS
    ? undefined
    : `round 1 gave ${collected[0]}, expected ${WELCOME_CREDITS + SIGNUP_CREDITS}`,
);

const closed = collected[1] === 0 && collected[2] === 0;

report(
  'deleting the account and signing up again earns NOTHING',
  closed,
  closed
    ? undefined
    : `rounds 2 and 3 gave ${collected[1]} and ${collected[2]} credits — the ` +
      `same address can mint free credits without limit`,
);

const cleared = await forgetGrantClaims(EMAIL);
console.log(
  cleared
    ? `\n  grant_claims rows for this address cleared.`
    : `\n  (no grant_claims table yet — nothing to clear.)`,
);

console.log('\n' + '='.repeat(70));

if (failures) {
  console.log(`\n${failures} CHECK(S) FAILED.\n`);
  process.exit(1);
}

console.log('\nOne inbox, one set of free credits, however many times it signs up.\n');
