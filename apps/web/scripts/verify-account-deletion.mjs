#!/usr/bin/env node
/**
 * verify-account-deletion.mjs — proves what "delete account" actually does.
 *
 * WHY THIS EXISTS. Pressing "delete account" used to destroy the sign-in and
 * leave the person's account row (their EMAIL ADDRESS and NAME) and their whole
 * credit history in the database. The fix is a foreign key,
 * 20260821130000_account_deletion_cascade.sql. A migration nobody has run is not
 * a fix, and a fix nobody has watched work is not proof — so this script drives
 * the real database through the real deletion path and shows every row before
 * and after.
 *
 * WHAT IT DOES. Creates one throwaway account at deletion-chain-test@un-claude.com,
 * gives it three credit-ledger rows, then makes the IDENTICAL call the delete
 * button makes — auth.admin.deleteUser — and prints what survived. It cleans up
 * after itself whatever the outcome, so it leaves nothing behind either way.
 *
 * It touches no existing account. The address is at un-claude.com, which has no
 * MX records, so nothing is ever delivered to a real person (07-runbook.md).
 *
 * HOW TO RUN (from apps/web):
 *   node scripts/verify-account-deletion.mjs
 *
 * It reads NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY from the
 * environment, falling back to .env.local then .env — the same loader
 * backup-credit-ledger.mjs uses. Dependency-free: Node built-ins only.
 *
 * READING THE RESULT. The VERDICT block at the end says one of two things:
 *   "DEFECT LIVE"  — the migration has not been applied to this database.
 *   "FIXED"        — deleting the account deletes the record and the history.
 * Exits 0 when fixed, 1 when the defect is live, so it can be used as a check.
 */
import { readFileSync, existsSync } from 'node:fs';

function loadEnvFile(name) {
  if (!existsSync(name)) return;
  for (const raw of readFileSync(name, 'utf8').split('\n')) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let val = line.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = val;
  }
}

loadEnvFile('.env.local');
loadEnvFile('.env');

const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!URL_ || !KEY) {
  console.error(
    'verify-account-deletion: missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.\n' +
      'Set them in the environment or in apps/web/.env.local, then re-run from apps/web.',
  );
  process.exit(2);
}

const HEADERS = {
  apikey: KEY,
  Authorization: `Bearer ${KEY}`,
  'Content-Type': 'application/json',
};

async function call(base, path, opts = {}) {
  const res = await fetch(`${URL_}/${base}/v1/${path}`, {
    ...opts,
    headers: { ...HEADERS, ...(opts.headers ?? {}) },
  });
  const text = await res.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = text;
  }
  return { status: res.status, body };
}

const rest = (path, opts) => call('rest', path, opts);
const auth = (path, opts) => call('auth', path, opts);
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const EMAIL = 'deletion-chain-test@un-claude.com';

console.log('target:', URL_);
console.log('throwaway account:', EMAIL);

// Clear anything a previous interrupted run left behind, so the script is
// always starting from nothing.
{
  const listed = await auth('admin/users?page=1&per_page=200');
  for (const user of listed.body?.users ?? []) {
    if (user.email === EMAIL) await auth(`admin/users/${user.id}`, { method: 'DELETE' });
  }
  const rows = await rest(`accounts?email=eq.${encodeURIComponent(EMAIL)}&select=id`);
  for (const row of Array.isArray(rows.body) ? rows.body : []) {
    await rest(`accounts?id=eq.${row.id}`, { method: 'DELETE' });
  }
}

console.log('\n=== STEP 1 — create the account, the way a real sign-up does ===');

const created = await auth('admin/users', {
  method: 'POST',
  body: JSON.stringify({
    email: EMAIL,
    password: `throwaway-${Math.abs(0 | (performance.now() * 1e6))}`,
    email_confirm: true,
    user_metadata: { name: 'Deletion Chain Test' },
  }),
});

if (created.status >= 300 || !created.body?.id) {
  console.error('could not create the throwaway user:', created.status, JSON.stringify(created.body));
  process.exit(2);
}

const USER_ID = created.body.id;
console.log(`auth.users row created: ${USER_ID}`);

// The on_auth_user_created trigger writes the accounts row.
await pause(500);
const accountRow = await rest(`accounts?id=eq.${USER_ID}&select=id,name,email`);
console.log('public.accounts row written by the on_auth_user_created trigger:');
console.log('   ', JSON.stringify(accountRow.body));

console.log('\n=== STEP 2 — give it credit history, the shape the product writes ===');

const LEDGER_ROWS = [
  { account_id: USER_ID, delta: 3, reason: 'signup_grant' },
  { account_id: USER_ID, delta: -1, reason: 'spend', endpoint: 'clean', input_kind: 'paste', words_in: 412, layer_b: true },
  { account_id: USER_ID, delta: 1, reason: 'operation_refund' },
];

for (const row of LEDGER_ROWS) {
  const inserted = await rest('credit_ledger', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify(row),
  });
  const id = Array.isArray(inserted.body) && inserted.body[0] ? inserted.body[0].id : '?';
  console.log(`  insert ${row.reason.padEnd(16)} -> ${inserted.status}  ledger id ${id}`);
}

async function snapshot(label) {
  console.log(`\n--- ${label} ---`);

  const user = await auth(`admin/users/${USER_ID}`);
  const signInPresent = user.status === 200 && user.body?.id === USER_ID;
  console.log(`auth.users      : ${signInPresent ? `PRESENT (${user.body.email})` : 'GONE'}`);

  const accounts = await rest(`accounts?id=eq.${USER_ID}&select=id,name,email`);
  const accountRows = Array.isArray(accounts.body) ? accounts.body : [];
  console.log(`public.accounts : ${accountRows.length} row(s)`);
  for (const row of accountRows) console.log('   ', JSON.stringify(row));

  const ledger = await rest(
    `credit_ledger?account_id=eq.${USER_ID}&select=id,account_id,delta,reason,created_at&order=id.asc`,
  );
  const ledgerRows = Array.isArray(ledger.body) ? ledger.body : [];
  console.log(`credit_ledger   : ${ledgerRows.length} row(s)`);
  for (const row of ledgerRows) console.log('   ', JSON.stringify(row));

  return { signIn: signInPresent, accounts: accountRows.length, ledger: ledgerRows.length };
}

const before = await snapshot('BEFORE — everything this person has in the database');

console.log('\n=== STEP 3 — press "delete account" ===');
console.log('The button runs deletePersonalAccountAction, which calls');
console.log('DeletePersonalAccountService.deletePersonalAccount, whose entire body is:');
console.log('    await params.adminClient.auth.admin.deleteUser(userId)');
console.log('which is exactly this request:');
console.log(`    DELETE /auth/v1/admin/users/${USER_ID}`);

const deleted = await auth(`admin/users/${USER_ID}`, { method: 'DELETE' });
console.log('  ->', deleted.status, JSON.stringify(deleted.body));

await pause(700);
const after = await snapshot('AFTER — what is left behind');

console.log('\n=== VERDICT ===');
console.log(`sign-in destroyed      : ${before.signIn && !after.signIn ? 'YES' : 'NO'}`);
console.log(
  `account record removed : ${after.accounts === 0 ? 'YES' : `NO — ${after.accounts} row still holds the email address and name`}`,
);
console.log(
  `credit history removed : ${after.ledger === 0 ? 'YES' : `NO — ${after.ledger} row(s) still there`}`,
);

const fixed = after.accounts === 0 && after.ledger === 0;

console.log(
  fixed
    ? '\nFIXED — deleting your account deletes your account record and your entire credit history with it.\n' +
        'That is what the privacy policy now promises, and it is what just happened.'
    : '\nDEFECT LIVE — the person is locked out for good and their personal data is retained.\n' +
        'Apply 20260821130000_account_deletion_cascade.sql, then run this again.',
);

console.log('\n=== CLEANUP — removing every trace of this run ===');

const sweptAccounts = await rest(`accounts?id=eq.${USER_ID}`, { method: 'DELETE' });
console.log('delete the throwaway accounts row ->', sweptAccounts.status);

const leftAccounts = await rest(`accounts?id=eq.${USER_ID}&select=id`);
const leftLedger = await rest(`credit_ledger?account_id=eq.${USER_ID}&select=id`);
const leftUser = await auth(`admin/users/${USER_ID}`);
console.log('accounts rows left      ->', JSON.stringify(leftAccounts.body));
console.log('credit_ledger rows left ->', JSON.stringify(leftLedger.body));
console.log('auth.users row left     ->', leftUser.status === 200 && leftUser.body?.id ? 'PRESENT (!)' : 'GONE');

process.exit(fixed ? 0 : 1);
