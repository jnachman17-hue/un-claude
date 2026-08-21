/**
 * PROVE THE GUEST MERGE, so "the credits followed me" is a fact and not a claim.
 *
 * Added 21 August 2026, session 10, with the fix in
 * 20260821140000_guest_conversion_once.sql. CLAUDE.md section 4: Jon cannot
 * check this by reading code, so this prints the actual rows and the actual
 * arithmetic and lets him read the answer himself.
 *
 *   cd apps/web/scripts && node verify-guest-merge.mjs
 *
 * READ ONLY. It makes no writes of any kind. Reads the project's own .env for
 * the Supabase URL and service key, uses them, and never prints them.
 *
 * It checks the four invariants the fix is supposed to guarantee, and exits
 * non-zero if any of them is broken:
 *
 *   1. No account holds more than one transfer in either direction.
 *      (The double-merge. This is the bug that started it.)
 *   2. No account holds a negative balance.
 *      (The other end of the same bug: the guest was drained twice.)
 *   3. Every account that received a transfer has a conversion record.
 *      (Without one it can collect a welcome grant it already had as a guest.)
 *   4. No converted account holds a welcome grant.
 *      (7 credits against a ratified 5 — security-audit.md finding 2.)
 */
import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs';
import path from 'node:path';

const env = {};
for (const f of ['../.env', '../.env.local']) {
  const p = path.resolve(f);
  if (!fs.existsSync(p)) continue;
  for (const line of fs.readFileSync(p, 'utf8').split('\n')) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)$/.exec(line);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '').trim();
  }
}

const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const short = (id) => (id ? id.slice(0, 8) : '-'.repeat(8));

const { data: rows, error } = await db
  .from('credit_ledger')
  .select('id, account_id, delta, reason, endpoint, input_kind, words_in, created_at')
  .order('id', { ascending: true });

if (error) {
  console.error('LEDGER READ FAILED:', error.message);
  process.exit(1);
}

const { data: conversions, error: cErr } = await db
  .from('guest_conversions')
  .select('guest_id, account_id, credits_moved, created_at')
  .order('created_at', { ascending: true });

if (cErr) {
  console.error('\nguest_conversions READ FAILED:', cErr.message);
  console.error(
    '\nIf this says the table does not exist, migration\n' +
      '20260821140000_guest_conversion_once.sql has not been run yet.',
  );
  process.exit(1);
}

const balances = new Map();
for (const r of rows) balances.set(r.account_id, (balances.get(r.account_id) ?? 0) + r.delta);

// ---------------------------------------------------------------------------
console.log('=== CONVERSIONS ON RECORD ===\n');

if (!conversions.length) {
  console.log('  (none yet — no guest has signed up)\n');
}

for (const c of conversions) {
  const guestRows = rows.filter((r) => r.account_id === c.guest_id);
  const acctRows = rows.filter((r) => r.account_id === c.account_id);

  console.log(`  guest ${short(c.guest_id)}  ->  account ${short(c.account_id)}   carried ${c.credits_moved}`);
  console.log(`  ${c.created_at}`);
  console.log('');
  console.log(`    the guest's whole life:`);
  for (const r of guestRows) {
    const what = r.reason === 'spend' ? `${r.reason} (${r.input_kind}, ${r.words_in} words)` : (r.endpoint ?? r.reason);
    console.log(`      ${String(r.id).padStart(5)}  ${String(r.delta > 0 ? '+' + r.delta : r.delta).padStart(3)}  ${r.reason.padEnd(14)} ${what}`);
  }
  console.log(`      ${' '.repeat(5)}  ${String(balances.get(c.guest_id) ?? 0).padStart(3)}  = guest balance now`);
  console.log('');
  console.log(`    the account's whole life:`);
  for (const r of acctRows) {
    const what = r.reason === 'spend' ? `${r.reason} (${r.input_kind}, ${r.words_in} words)` : (r.endpoint ?? r.reason);
    console.log(`      ${String(r.id).padStart(5)}  ${String(r.delta > 0 ? '+' + r.delta : r.delta).padStart(3)}  ${r.reason.padEnd(14)} ${what}`);
  }
  console.log(`      ${' '.repeat(5)}  ${String(balances.get(c.account_id) ?? 0).padStart(3)}  = ACCOUNT BALANCE NOW`);
  console.log('');
}

// ---------------------------------------------------------------------------
console.log('=== THE FOUR INVARIANTS ===\n');

const failures = [];

// 1. one transfer per account per direction
const seen = new Map();
for (const r of rows) {
  if (r.reason !== 'adjustment' || !['transfer_in', 'transfer_out'].includes(r.endpoint)) continue;
  const k = `${r.account_id}|${r.endpoint}`;
  seen.set(k, (seen.get(k) ?? 0) + 1);
}
const dupes = [...seen].filter(([, n]) => n > 1);
if (dupes.length) failures.push(`${dupes.length} account/direction pair(s) hold more than one transfer: ` + dupes.map(([k, n]) => `${short(k.split('|')[0])} ${k.split('|')[1]} x${n}`).join(', '));
console.log(`  1. no doubled transfers            ${dupes.length === 0 ? 'PASS' : 'FAIL'}`);

// 2. no negative balances
const negatives = [...balances].filter(([, v]) => v < 0);
if (negatives.length) failures.push('negative balances: ' + negatives.map(([a, v]) => `${short(a)}=${v}`).join(', '));
console.log(`  2. no negative balances            ${negatives.length === 0 ? 'PASS' : 'FAIL'}`);

// 3. every transferred-into account has a conversion record
const recorded = new Set(conversions.map((c) => c.account_id));
const transferredInto = [...new Set(rows.filter((r) => r.reason === 'adjustment' && r.endpoint === 'transfer_in').map((r) => r.account_id))];
const unrecorded = transferredInto.filter((a) => !recorded.has(a));
if (unrecorded.length) failures.push('accounts received a transfer with no conversion record: ' + unrecorded.map(short).join(', '));
console.log(`  3. every transfer has a record     ${unrecorded.length === 0 ? 'PASS' : 'FAIL'}`);

// 4. no converted account holds a welcome grant
const wrongGrant = rows.filter((r) => r.reason === 'anon_grant' && recorded.has(r.account_id));
if (wrongGrant.length) failures.push('welcome grant paid to converted account(s): ' + wrongGrant.map((r) => `row ${r.id} / ${short(r.account_id)}`).join(', '));
console.log(`  4. no welcome grant after convert  ${wrongGrant.length === 0 ? 'PASS' : 'FAIL'}`);

console.log('');

if (failures.length) {
  console.log('BROKEN:');
  for (const f of failures) console.log(`  - ${f}`);
  process.exit(1);
}

console.log(`All four hold. ${rows.length} ledger rows, ${conversions.length} conversion(s) on record.`);
