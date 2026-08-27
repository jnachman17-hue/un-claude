/**
 * Every chapter account, what is left on it, and whether anyone has used it.
 *
 * Added 26 August 2026 alongside `make-chapter-account.mjs`.
 *
 *   node scripts/list-chapter-accounts.mjs
 *
 * READ-ONLY. Selects and nothing else.
 *
 * The last column is the one worth looking at. A chapter that has spent
 * nothing has not used the account, and that is the campaign's real conversion
 * number — an activated login sitting untouched is a chapter that said yes to
 * a free thing and never opened it, which is a different problem from a
 * chapter that never replied.
 */
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

if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env / .env.local');
  process.exit(1);
}

const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

/*
 * Chapter accounts are found by their ledger rows rather than by their email
 * prefix. The reason is the record; the address is only a convention, and a
 * convention that changes later should not make old chapters invisible here.
 */
const { data: grants, error } = await db
  .from('credit_ledger')
  .select('account_id, delta, created_at')
  .eq('reason', 'chapter_grant')
  .order('created_at', { ascending: true });

if (error) {
  console.error(`FAILED: ${error.message}`);
  if (/does not exist|invalid input value/.test(error.message)) {
    console.error('The database may not have the chapter_grant reason yet.');
    console.error('Apply supabase/migrations/20260826233000_chapter_grant.sql first.');
  }
  process.exit(1);
}

if (!grants?.length) {
  console.log('\nNo chapter accounts yet.\n');
  process.exit(0);
}

const byAccount = new Map();
for (const g of grants) {
  const row = byAccount.get(g.account_id) ?? { granted: 0, grants: 0, first: g.created_at };
  row.granted += g.delta;
  row.grants += 1;
  byAccount.set(g.account_id, row);
}

/*
 * One pass over auth to learn which accounts are still locked. Chapter
 * accounts are created BANNED and stay that way until Jon has the screenshot,
 * so "locked" is the normal state for a chapter that has been emailed but has
 * not replied — that is the funnel, and it is the column worth reading.
 */
const lockState = new Map();
for (let page = 1; page <= 20; page++) {
  const { data } = await db.auth.admin.listUsers({ page, perPage: 200 });
  const users = data?.users ?? [];
  for (const u of users) {
    const until = u.banned_until ?? null;
    lockState.set(u.id, Boolean(until && new Date(until) > new Date()));
  }
  if (users.length < 200) break;
}

const rows = [];
for (const [accountId, agg] of byAccount) {
  const { data: account } = await db
    .from('accounts')
    .select('name, email')
    .eq('id', accountId)
    .maybeSingle();

  const { data: balance } = await db.rpc('credit_balance', { target_account: accountId });

  const { data: spends } = await db
    .from('credit_ledger')
    .select('delta')
    .eq('account_id', accountId)
    .eq('reason', 'spend');

  const spent = (spends ?? []).reduce((n, r) => n + Math.abs(r.delta), 0);

  rows.push({
    name: account?.name ?? '(account row missing)',
    email: account?.email ?? '—',
    granted: agg.granted,
    grants: agg.grants,
    balance: balance ?? 0,
    spent,
    locked: lockState.get(accountId) ?? false,
    since: agg.first.slice(0, 10),
  });
}

rows.sort((a, b) => a.name.localeCompare(b.name));

const w = (s, n) => String(s).padEnd(n).slice(0, n);
const r = (s, n) => String(s).padStart(n);

console.log('');
console.log(
  `${w('CHAPTER', 28)} ${w('LOGIN', 34)} ${w('STATUS', 8)} ${r('GRANT', 6)} ${r('BAL', 6)} ${r('USED', 6)} ${w('SINCE', 10)}`,
);
console.log('-'.repeat(102));
for (const row of rows) {
  console.log(
    `${w(row.name, 28)} ${w(row.email, 34)} ${w(row.locked ? 'LOCKED' : 'active', 8)} ${r(row.granted, 6)} ${r(row.balance, 6)} ${r(row.spent, 6)} ${w(row.since, 10)}`,
  );
}
console.log('-'.repeat(102));

const totalGranted = rows.reduce((n, x) => n + x.granted, 0);
const totalSpent = rows.reduce((n, x) => n + x.spent, 0);
const untouched = rows.filter((x) => x.spent === 0).length;

const lockedCount = rows.filter((x) => x.locked).length;
console.log(
  `${rows.length} chapters · ${lockedCount} awaiting activation · ${totalGranted} credits granted · ` +
    `${totalSpent} used · ${untouched} never opened`,
);
console.log('');
