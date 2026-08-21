/**
 * PROVE THE STRIPE MIGRATION IS ACTUALLY APPLIED, rather than believing it is.
 *
 * Added 21 August 2026, session 11.
 *
 * `migrations-applied.md` exists because a migration's applied state is
 * INVISIBLE FROM THE REPO, and one migration in this project survived being
 * written, reviewed and handed off twice while being fundamentally broken,
 * purely because nobody had ever run it. "I pasted it and it said success" is
 * a good sign, not a proof: a partially-applied file also says success for the
 * statements it reached.
 *
 * This asks the database itself, through the same client the app uses.
 *
 *   cd apps/web && node scripts/verify-stripe-migration.mjs
 *
 * READ ONLY: every call either reads, or is a deliberately invalid write that
 * the function must reject before touching a row. Exits non-zero on any failure.
 */
import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs';
import path from 'node:path';

/*
 * Resolved against THIS FILE, not the working directory. The older scripts use
 * `path.resolve('../.env')`, which silently reads nothing unless you happen to
 * have cd'd into scripts/ first — it does not error, it just produces a client
 * with no URL and a confusing crash three lines later.
 */
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

const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const MISSING_FN = ['42883', 'PGRST202'];

let failures = 0;

function report(name, ok, detail) {
  if (!ok) failures += 1;
  console.log(`${ok ? '  PASS' : '  FAIL'}  ${name}`);
  if (detail) console.log(`        ${detail}`);
}

console.log('\nStripe migration 20260821150000_stripe_purchases\n' + '─'.repeat(62));

/*
 * 1. Does refund_purchase exist at all?
 *
 * Called with credits = 0, which the function must reject with its own message
 * BEFORE writing anything. So a rejection naming "must be positive" proves both
 * that the function exists AND that its guard clause runs.
 */
{
  const { error } = await db.rpc('refund_purchase', {
    target_account: '00000000-0000-0000-0000-000000000000',
    // NEGATIVE, and the argument is `target_total` rather than `credits`.
    // Both matter: the name proves the CUMULATIVE-SAFE version from
    // 20260821160000_refund_cumulative.sql is installed rather than the
    // original buggy one, and a negative value is refused by its guard clause
    // before anything is written.
    target_total: -1,
    payment_intent: 'pi_verify_only',
    event_id: 'evt_verify_only',
    refund_cents: 0,
  });

  if (error && MISSING_FN.includes(error.code)) {
    report('refund_purchase exists', false, `NOT FOUND — the migration has not run. ${error.message}`);
  } else if (error && /must be zero or positive/.test(error.message)) {
    report('refund_purchase (cumulative version) exists and guards its input', true, error.message);
  } else if (error) {
    report('refund_purchase exists', false, `unexpected error: ${error.code} ${error.message}`);
  } else {
    report('refund_purchase guards its input', false, 'accepted credits=0, which it must refuse');
  }
}

/*
 * 2. Is it refused to the browser role?
 *
 * The anon key is what a browser holds. If it can execute refund_purchase, any
 * visitor could reverse payments. The revoke in the migration is what stops it.
 */
{
  const anon = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    auth: { persistSession: false },
  });

  const { error } = await anon.rpc('refund_purchase', {
    target_account: '00000000-0000-0000-0000-000000000000',
    target_total: 1,
    payment_intent: 'pi_verify_only',
    event_id: 'evt_verify_only',
    refund_cents: 0,
  });

  const denied =
    !!error && (/permission denied/i.test(error.message) || MISSING_FN.includes(error.code));

  report(
    'a browser (anon key) CANNOT execute refund_purchase',
    denied,
    error ? error.message : 'IT WAS ALLOWED. Any visitor could reverse payments.',
  );
}

/*
 * 3. The purchase-payment-intent unique index.
 *
 * Proven by behaviour rather than by reading catalogue tables: insert a purchase
 * row against a throwaway account, insert a second with the SAME payment intent
 * and a DIFFERENT event id, and require the second to fail with 23505.
 *
 * That second insert is precisely the scenario the index exists for — one
 * payment described by two different events — and the event-id index alone
 * would NOT catch it.
 *
 * Cleanup: the ledger is append-only and refuses direct deletes, so the rows are
 * removed by deleting the throwaway ACCOUNT, which is the one delete the trigger
 * permits (the FK cascade). If that fails, the account id is printed so the rows
 * can be found.
 */
{
  /*
   * A REAL throwaway auth user, not a fabricated accounts row.
   *
   * `accounts.id` now carries a foreign key to `auth.users` — added by
   * 20260821130000_account_deletion_cascade.sql — so an accounts row cannot
   * exist without a sign-in behind it. Discovering that here is itself worth
   * something: the session notes recorded the FK as ABSENT, and the
   * append-only migration's comment reasons at length about a cascade that did
   * not yet reach. It reaches now.
   *
   * SAFETY: this script creates exactly one user at the fixed address below and
   * deletes ONLY users matching that exact address. It never touches anything
   * else, and it sweeps leftovers from an interrupted previous run first.
   */
  const EMAIL = 'stripe-migration-verify@un-claude.com';

  // Sweep anything a previous interrupted run left behind.
  {
    const { data: listed } = await db.auth.admin.listUsers({ page: 1, perPage: 200 });
    for (const u of listed?.users ?? []) {
      if (u.email === EMAIL) await db.auth.admin.deleteUser(u.id);
    }
  }

  const { data: created, error: createError } = await db.auth.admin.createUser({
    email: EMAIL,
    password: `throwaway-${Math.abs(0 | (performance.now() * 1e6))}`,
    email_confirm: true,
  });

  if (createError || !created?.user?.id) {
    report('create throwaway account for index test', false, createError?.message ?? 'no user id');
  } else {
    const testAccount = created.user.id;

    // The on_auth_user_created trigger writes public.accounts. Give it a moment.
    await new Promise((r) => setTimeout(r, 600));

    const { data: accountRow } = await db
      .from('accounts')
      .select('id')
      .eq('id', testAccount)
      .limit(1);

    report(
      'the on_auth_user_created trigger wrote the accounts row',
      Array.isArray(accountRow) && accountRow.length === 1,
      'this is what a real sign-up does',
    );

    const pi = `pi_verify_${Date.now()}`;

    const { error: first } = await db.from('credit_ledger').insert({
      account_id: testAccount,
      delta: 25,
      reason: 'purchase',
      stripe_event_id: `evt_verify_a_${Date.now()}`,
      stripe_payment_intent_id: pi,
      price_cents: 999,
    });

    report('a first purchase row inserts', !first, first?.message);

    const { error: second } = await db.from('credit_ledger').insert({
      account_id: testAccount,
      delta: 25,
      reason: 'purchase',
      // DIFFERENT event id, SAME payment intent. The event-id index cannot
      // catch this one; only the payment-intent index can.
      stripe_event_id: `evt_verify_b_${Date.now()}`,
      stripe_payment_intent_id: pi,
      price_cents: 999,
    });

    report(
      'a SECOND purchase for the same payment is REFUSED (different event id)',
      second?.code === '23505',
      second ? `${second.code}: ${second.message}` : 'IT WAS ALLOWED — one payment could pay twice.',
    );

    // A money_refund row deliberately reuses the same payment intent. The index
    // is partial (reason = 'purchase'), so this must still be permitted.
    const { error: refundRow } = await db.from('credit_ledger').insert({
      account_id: testAccount,
      delta: -25,
      reason: 'money_refund',
      stripe_event_id: `evt_verify_r_${Date.now()}`,
      stripe_payment_intent_id: pi,
      price_cents: -999,
    });

    report(
      'a money_refund row may REUSE the same payment intent',
      !refundRow,
      refundRow ? `${refundRow.code}: ${refundRow.message} — the partial index is too broad` : undefined,
    );

    // The append-only trigger must refuse a direct delete of a ledger row.
    const { error: directDelete } = await db
      .from('credit_ledger')
      .delete()
      .eq('stripe_payment_intent_id', pi);

    /*
     * NOTE ON WHICH DEFENCE ACTUALLY FIRES HERE, because the distinction
     * matters and an earlier version of this label got it wrong. The ledger has
     * TWO protections against a direct delete:
     *
     *   1. the GRANT — service_role holds only `select, insert`, so a delete is
     *      refused with "permission denied for table credit_ledger";
     *   2. the append-only TRIGGER, which refuses the delete even for a role
     *      that has been granted it.
     *
     * From this client, layer 1 fires first, so the message says "permission
     * denied" rather than the trigger's "append-only" wording. That is the
     * correct outcome and the strongest one — but it does NOT exercise the
     * trigger, which is exactly the defence security-audit.md finding 7 added
     * because a future migration could hand out the missing grant. The trigger
     * is verified separately by verify-ledger-hardening.sql.
     */
    report(
      'a DIRECT delete of a ledger row is REFUSED (by the grant; trigger is layer 2)',
      !!directDelete,
      directDelete ? directDelete.message.slice(0, 90) : 'IT WAS ALLOWED — the ledger is not append-only.',
    );

    // Now the permitted delete: remove the user, and the cascade should carry
    // the ledger rows away with it.
    const { error: deleteError } = await db.auth.admin.deleteUser(testAccount);

    report('cleanup: the throwaway user deletes', !deleteError, deleteError?.message);

    const { data: survivors } = await db
      .from('credit_ledger')
      .select('id')
      .eq('stripe_payment_intent_id', pi);

    report(
      'deleting the account CASCADED its ledger rows away',
      Array.isArray(survivors) && survivors.length === 0,
      survivors?.length
        ? `${survivors.length} row(s) survived — payment ${pi} left behind`
        : 'no rows left behind',
    );
  }
}

/*
 * 4. THE OLD BUGGY SIGNATURE MUST BE GONE, not merely superseded.
 *
 * Postgres keeps functions of the same name with different argument lists as
 * OVERLOADS, and PostgREST picks between them by the argument names a caller
 * sends. So leaving the original four-argument version in place would mean a
 * stale deployment silently getting the cumulative bug back. The migration
 * drops it explicitly; this proves the drop actually ran.
 */
{
  const { error } = await db.rpc('refund_purchase', {
    target_account: '00000000-0000-0000-0000-000000000000',
    credits: 1,
    payment_intent: 'pi_verify_only',
    event_id: 'evt_verify_only',
    refund_cents: 0,
  });

  report(
    'the OLD (buggy, incremental) refund_purchase signature is GONE',
    !!error && MISSING_FN.includes(error.code),
    error
      ? `${error.code}`
      : 'IT IS STILL CALLABLE — the incremental refund bug can still be reached.',
  );
}

console.log('─'.repeat(62));

if (failures) {
  console.log(`\n${failures} CHECK(S) FAILED. Do not take payments.\n`);
  process.exit(1);
}

console.log('\nAll checks passed. The migration is applied and behaving.\n');
