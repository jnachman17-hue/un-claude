/**
 * THROWAWAY ACCOUNTS FOR THE MONEY TESTS, and nothing else.
 *
 * Added 23 August 2026, lane B. Every script in this lane needs the same three
 * things — the project's own environment, an admin client, and a labelled
 * account it is allowed to write to — and getting any of them slightly
 * different in each script is how a test ends up touching a customer.
 *
 * THE LABEL IS THE SAFETY RULE. Every account this file creates is called
 * `lane-b-money-<something>@un-claude.com`, and `destroy()` refuses to delete
 * anything whose address does not start with that prefix. So no run of any
 * script in this lane can remove a real person's account even if it is handed
 * the wrong id.
 *
 * NO PURCHASE IS EVER MADE. Credits are put on a throwaway account by writing
 * the same append-only ledger rows a real grant or a real Stripe webhook
 * writes. Deleting the account cascades those rows away, so nothing this file
 * creates outlives the script that created it.
 */
import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs';
import path from 'node:path';

const HERE = path.dirname(new URL(import.meta.url).pathname);

/** The project's own .env / .env.local. Values are used, never printed. */
export const env = {};

for (const f of ['../.env', '../.env.local']) {
  const p = path.resolve(HERE, f);
  if (!fs.existsSync(p)) continue;
  for (const line of fs.readFileSync(p, 'utf8').split('\n')) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)$/.exec(line);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '').trim();
  }
}

export const db = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

/** Nothing outside this prefix may be created or destroyed by this lane. */
export const THROWAWAY_PREFIX = 'lane-b-money-';

/** A run tag, so two runs never collide on a unique index. */
export const RUN = `${Date.now().toString(36)}`;

/**
 * Create a confirmed throwaway account. `tag` becomes part of the address so
 * the ledger reads legibly while the test is running.
 */
/** Every address this process has created, so its litter can be swept. */
const created = new Set();

export async function throwaway(tag, fixedEmail) {
  const email = fixedEmail ?? `${THROWAWAY_PREFIX}${tag}-${RUN}@un-claude.com`;

  created.add(email);

  const { data, error } = await db.auth.admin.createUser({
    email,
    password: `LaneB-${RUN}-throwaway!`,
    email_confirm: true,
    user_metadata: { name: `LANE B THROWAWAY ${tag}` },
  });

  if (error) throw new Error(`could not create throwaway ${tag}: ${error.message}`);

  return { id: data.user.id, email };
}

/**
 * Delete a throwaway account and everything that cascades from it.
 *
 * REFUSES any address outside the lane's prefix. This is the guard that makes
 * it impossible for a mistake here to reach a customer.
 */
export async function destroy(account) {
  if (!account?.email?.startsWith(THROWAWAY_PREFIX)) {
    throw new Error(
      `destroy() refused: "${account?.email}" is not a lane-B throwaway address. ` +
        `Nothing was deleted.`,
    );
  }

  const { error } = await db.auth.admin.deleteUser(account.id);

  if (error) throw new Error(`could not delete ${account.email}: ${error.message}`);
}

/**
 * Remove the grant-claim rows a throwaway address left behind.
 *
 * `grant_claims` is DELIBERATELY not cascaded by account deletion — that is the
 * whole point of it, and the fix for f1-audit.md finding 0c. So a test that
 * creates throwaway addresses has to clear its own, or it leaves litter in a
 * table nothing else ever cleans. Refuses any address outside the lane prefix,
 * and does nothing at all before the migration that creates the table.
 */
export async function forgetGrantClaims(email) {
  if (!email?.startsWith(THROWAWAY_PREFIX)) {
    throw new Error(`forgetGrantClaims() refused: "${email}" is not a lane-B throwaway address.`);
  }

  const { data: hash, error: hashError } = await db.rpc('email_grant_hash', { raw: email });

  if (hashError) return null; // the migration has not been applied yet

  const { error } = await db.from('grant_claims').delete().eq('email_hash', hash);

  return error ? null : hash;
}

/**
 * Sweep the grant-claim rows every throwaway address in THIS RUN left behind.
 * Call it once, at the end of a script.
 *
 * WHY THIS IS NOT PART OF `destroy()`, WHICH IS WHERE IT LOOKS LIKE IT BELONGS.
 * A claim OUTLIVING the account is the entire point of `grant_claims`, and
 * `verify-grants-survive-deletion.mjs` proves it by deleting an account and
 * signing up again on the same address. If `destroy()` swept claims, that test
 * would hand out free credits every round and report the bug as fixed.
 *
 * So the sweep is deliberately a separate, end-of-script step. **A script that
 * signs a throwaway in to the live site and forgets to call this leaves rows in
 * `grant_claims` for ever** — that is how four of them got there on 24 August
 * 2026, and they had to be picked out of the table by timestamp afterwards.
 */
export async function forgetAllLaneClaims() {
  let cleared = 0;

  for (const email of created) {
    if (await forgetGrantClaims(email)) cleared += 1;
  }

  return cleared;
}

/** Insert a ledger row, treating "already there" as success. */
export async function ledgerRowIfMissing(accountId, row) {
  const { error } = await db
    .from('credit_ledger')
    .insert({ account_id: accountId, ...row });

  if (error && error.code !== '23505') {
    throw new Error(`ledger insert failed: ${error.message}`);
  }

  return !error;
}

/** Put a ledger row on a throwaway account, in the shape the real path uses. */
export async function ledgerRow(accountId, row) {
  const { error } = await db
    .from('credit_ledger')
    .insert({ account_id: accountId, ...row });

  if (error) throw new Error(`ledger insert failed: ${error.message}`);
}

export async function balanceOf(accountId) {
  const { data, error } = await db.rpc('credit_balance', { target_account: accountId });

  if (error) throw new Error(`credit_balance failed: ${error.message}`);

  return data ?? 0;
}

export async function ledgerOf(accountId) {
  const { data, error } = await db
    .from('credit_ledger')
    .select('id, delta, reason, stripe_payment_intent_id, price_cents, endpoint, words_in')
    .eq('account_id', accountId)
    .order('id', { ascending: true });

  if (error) throw new Error(`ledger read failed: ${error.message}`);

  return data ?? [];
}

/** Print a ledger the way the audit prints one, so the two can be compared. */
export function printLedger(rows) {
  console.log('      delta  reason            payment                  cents  words');
  for (const r of rows) {
    console.log(
      '   ',
      String(r.delta > 0 ? '+' + r.delta : r.delta).padStart(5),
      ' ' + String(r.reason).padEnd(17),
      String(r.stripe_payment_intent_id ?? '-').padEnd(24),
      String(r.price_cents ?? '-').padStart(5),
      String(r.words_in ?? '-').padStart(6),
    );
  }
  console.log('    SUM =', rows.reduce((s, r) => s + r.delta, 0));
}
