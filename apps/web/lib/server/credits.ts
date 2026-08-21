import 'server-only';

import { getSupabaseServerAdminClient } from '@kit/supabase/server-admin-client';

import { rateLimit } from './rate-limit';

/**
 * Every credit decision the server makes, in one file. 04 entry 97.
 *
 * THE MODEL, in one paragraph. A balance is never stored: it is the sum of
 * the ledger's deltas, computed by the database. Anyone who touches the tool
 * gets a browser-held anonymous account and a one-time welcome grant of
 * WELCOME_CREDITS. Creating a real account earns SIGNUP_CREDITS once, and any
 * credits left on the browser's guest account move over. Spending happens
 * through the database's `spend_credits`, which locks, checks and debits in
 * one statement, so two racing requests cannot both spend the last credit.
 *
 * WHY EVERY WRITE HERE USES THE ADMIN CLIENT: the ledger's row level security
 * deliberately gives browsers read-only access to their own rows and nothing
 * else. Credits are granted and spent by this file or by Stripe's webhook,
 * never by anything a visitor can call with their own token.
 *
 * THE GRANTS ARE IDEMPOTENT BY INDEX, NOT BY CARE. Each grant is a plain
 * insert; a partial unique index on (account_id) for that reason makes the
 * second attempt fail with 23505, which is caught and ignored. Running any
 * grant twice is therefore harmless, which is what lets ensureGrants run on
 * every request without bookkeeping.
 *
 * PRICING (04 entry 67, amounts revised by entry 97): one credit buys 1,000
 * words, a file with no prose is one flat credit, every job rounds up.
 */
export const WELCOME_CREDITS = 2;
export const SIGNUP_CREDITS = 3;
export const WORDS_PER_CREDIT = 1_000;

/**
 * How many NEW anonymous welcome grants one IP may collect per hour.
 * security-audit.md findings 2 and 4, and the docs' recorded working position
 * of "a per-IP cap on anonymous grants" — implemented here as ONE mechanism
 * shared with the API rate limiter, not a second competing one.
 *
 * WHY 60 AND NOT THE AUDIT'S 5, stated plainly because it is a deliberate
 * departure. The audit derived 5/hour/IP before it was confirmed that
 * Cloudflare Turnstile is actually enforced on anonymous sign-in — verified
 * this session: signInAnonymously() returns
 * `captcha_failed: captcha protection: request disallowed`. So each anonymous
 * account already costs a human solving a captcha; this is not scriptable, and
 * the cap is a backstop against industrial farming rather than a quota.
 *
 * Against that, this product's core audience is students, and a university
 * campus, a school, an office or a mobile carrier is ONE IP for hundreds of
 * real people. A cap of 5/hour would lock out a lecture hall of genuine
 * first-time users — the exact failure the audit itself warns about. 60/hour
 * serves a full lecture hall arriving at once while still stopping anyone
 * minting thousands.
 *
 * IT COUNTS GRANTS ACTUALLY PAID, NOT REQUESTS. ensureGrants runs on every
 * request; charging the IP on each one would exhaust the budget on ordinary
 * repeat visitors. Only a genuinely new anonymous account consumes a slot.
 *
 * WHAT HAPPENS AT THE CAP is the softest failure available: the account still
 * works, it simply does not receive free welcome credits. The free scan needs
 * no credits at all, and signing up earns credits on its own. Nobody is locked
 * out of the product; they are only declined a giveaway.
 */
export const ANON_GRANTS_PER_HOUR_PER_IP = 60;

/** The 23505 unique-violation code that makes the grants idempotent. */
const UNIQUE_VIOLATION = '23505';

/**
 * The generated database types predate the ledger, so the admin client is
 * used untyped here. The shapes are pinned by the migration files instead.
 */
function admin() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return getSupabaseServerAdminClient<any>();
}

export function creditsForWords(wordCount: number): number {
  return Math.max(1, Math.ceil(wordCount / WORDS_PER_CREDIT));
}

/** The same tokeniser the receipt uses, so the price and the receipt agree. */
export function countWords(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

/**
 * Reduce an email address to the INBOX it actually reaches, so plus-addressed
 * variants of one inbox count as one person. security-audit.md finding 1.
 *
 *   - lower-cased (addresses are case-insensitive in practice)
 *   - everything from the first `+` in the local part is dropped
 *     (student+1@gmail.com and student+2@gmail.com -> student@gmail.com)
 *   - for Gmail only, dots in the local part are removed and googlemail.com is
 *     folded to gmail.com, because Gmail ignores both. Dot-stripping is NOT
 *     applied to other providers, where dots can distinguish real inboxes.
 *
 * Returns null for a missing/blank/garbage address, which the callers treat as
 * "no inbox to dedupe on".
 */
export function normalizeEmail(email?: string | null): string | null {
  if (!email) return null;
  const trimmed = email.trim().toLowerCase();
  const at = trimmed.lastIndexOf('@');
  if (at <= 0 || at === trimmed.length - 1) return null;

  let local = trimmed.slice(0, at);
  let domain = trimmed.slice(at + 1);

  const plus = local.indexOf('+');
  if (plus !== -1) local = local.slice(0, plus);

  if (domain === 'gmail.com' || domain === 'googlemail.com') {
    local = local.replace(/\./g, '');
    domain = 'gmail.com';
  }

  if (!local) return null;
  return `${local}@${domain}`;
}

export async function getBalance(accountId: string): Promise<number> {
  const { data, error } = await admin().rpc('credit_balance', {
    target_account: accountId,
  });

  if (error) throw new Error(`credit_balance failed: ${error.message}`);

  return (data as number) ?? 0;
}

/**
 * Postgres/PostgREST codes for "that column does not exist (yet)". They matter
 * because this file can be deployed before its migration has been run: without
 * this fallback, an unmigrated database would fail EVERY grant, which is
 * exactly the outage the welcome-grant migration note records. See
 * security-fixes.md.
 */
const UNDEFINED_COLUMN = '42703';
const POSTGREST_SCHEMA_CACHE_MISS = 'PGRST204';

async function grantOnce(
  accountId: string,
  delta: number,
  reason: 'anon_grant' | 'signup_grant',
  extra?: Record<string, unknown>,
): Promise<void> {
  const row = { account_id: accountId, delta, reason, ...extra };

  const { error } = await admin().from('credit_ledger').insert(row);

  if (!error) return;

  // 23505 is the unique-violation that makes every grant idempotent. For the
  // signup grant it now fires on EITHER the per-account index OR the
  // per-inbox index (grant_email), so a plus-addressed second signup from the
  // same inbox is discarded here exactly like a repeated grant. Both are the
  // intended "already paid, do nothing" outcome.
  if (error.code === UNIQUE_VIOLATION) return;

  // The grant_email column is missing, so the migration has not been run yet.
  // Fall back to the pre-migration shape rather than denying a real person
  // their credits. The per-account guard still applies; only the per-inbox
  // dedupe is inactive until the migration lands.
  if (
    extra &&
    'grant_email' in extra &&
    (error.code === UNDEFINED_COLUMN ||
      error.code === POSTGREST_SCHEMA_CACHE_MISS)
  ) {
    console.warn(
      'credit_ledger.grant_email is missing — run migration ' +
        '20260821120300_signup_grant_email_dedupe.sql. Granting without the ' +
        'per-inbox dedupe for now.',
    );

    const { error: retryError } = await admin()
      .from('credit_ledger')
      .insert({ account_id: accountId, delta, reason });

    if (retryError && retryError.code !== UNIQUE_VIOLATION) {
      throw new Error(`grant ${reason} failed: ${retryError.message}`);
    }

    return;
  }

  throw new Error(`grant ${reason} failed: ${error.message}`);
}

/**
 * Make sure this account holds every grant it is entitled to. Safe to call on
 * every request. An anonymous account gets the welcome; a real account gets
 * the welcome AND the signup grant, which keeps the two arrival paths equal:
 * sign up cold and you hold 5, use the tool as a guest first and your leftover
 * welcome credits follow you to the same 5. The double-welcome ceiling for
 * someone who games the split is 2 credits of the layers that cost us nothing.
 */
/** Does this account already hold a grant of this reason? */
async function hasGrant(
  accountId: string,
  reason: 'anon_grant' | 'signup_grant',
): Promise<boolean> {
  const { data, error } = await admin()
    .from('credit_ledger')
    .select('id')
    .eq('account_id', accountId)
    .eq('reason', reason)
    .limit(1);

  // On error, claim it IS granted: the worst case is a missed giveaway, never a
  // double one, and the unique index is still the real guarantee.
  if (error) return true;

  return Array.isArray(data) && data.length > 0;
}

export async function ensureGrants(user: {
  id: string;
  isAnonymous: boolean;
  /** The account's email, used to key the signup grant to an inbox. */
  email?: string | null;
  /**
   * The caller's IP, used only to cap how many NEW anonymous welcome grants one
   * network can collect per hour. Omitted (or 'unknown') means no cap is
   * applied — a missing header must never cost a real visitor their credits.
   */
  ip?: string | null;
  /**
   * True when this is a REAL account continuing a guest session already held by
   * this browser (the guest cookie is present). On a conversion the welcome
   * grant is skipped: the guest account was already paid it and mergeGuestInto
   * carries its leftover across. Paying it again is finding 2's double grant
   * (7 credits instead of the ratified 5).
   */
  isConversion?: boolean;
}): Promise<void> {
  const isConversion = user.isConversion === true && !user.isAnonymous;

  if (!isConversion) {
    // The per-IP cap applies ONLY to anonymous accounts. A real account has
    // already cleared email confirmation, a captcha, and the per-inbox signup
    // dedupe, so throttling its welcome grant by network would punish shared
    // IPs for nothing.
    if (user.isAnonymous && user.ip && user.ip !== 'unknown') {
      // Only a genuinely new grant consumes a slot; repeat visitors do not.
      if (await hasGrant(user.id, 'anon_grant')) {
        // Already paid. Nothing to do, nothing to charge.
      } else if (
        await rateLimit(
          `anon_grant:ip:${user.ip}`,
          ANON_GRANTS_PER_HOUR_PER_IP,
          3600,
        )
      ) {
        await grantOnce(user.id, WELCOME_CREDITS, 'anon_grant');
      } else {
        // Over the cap. The account still works; it just goes without the
        // giveaway. Logged so a genuinely throttled network is visible.
        console.warn(
          `anon_grant declined: IP over ${ANON_GRANTS_PER_HOUR_PER_IP}/hour cap`,
        );
      }
    } else {
      await grantOnce(user.id, WELCOME_CREDITS, 'anon_grant');
    }
  }

  if (!user.isAnonymous) {
    // grant_email makes the signup grant once-per-inbox, closing the
    // plus-address vector (finding 1). Null email falls back to the existing
    // per-account guard alone.
    await grantOnce(user.id, SIGNUP_CREDITS, 'signup_grant', {
      grant_email: normalizeEmail(user.email),
    });
  }
}

/**
 * Spend, atomically, via the database function that locks the account row.
 * Returns the new balance, or the shortfall so the interface can say
 * "this needs 3 and you have 2" with real numbers.
 */
export async function spend(
  accountId: string,
  amount: number,
  job: { endpoint: string; inputKind: string; wordsIn: number },
): Promise<
  | { ok: true; balance: number }
  | { ok: false; needed: number; have: number }
> {
  const { data, error } = await admin().rpc('spend_credits', {
    target_account: accountId,
    amount,
    job_endpoint: job.endpoint,
    job_input_kind: job.inputKind,
    job_words_in: job.wordsIn,
  });

  if (error) {
    if (error.message.includes('insufficient_credits')) {
      return { ok: false, needed: amount, have: await getBalance(accountId) };
    }

    throw new Error(`spend_credits failed: ${error.message}`);
  }

  return { ok: true, balance: (data as number) ?? 0 };
}

/**
 * Give a failed operation's credits back. "A failed operation costs nothing"
 * is on the pricing page; this row is what makes it true, and the reason
 * makes it visible in the wallet's history.
 */
export async function refund(accountId: string, amount: number): Promise<void> {
  const { error } = await admin()
    .from('credit_ledger')
    .insert({
      account_id: accountId,
      delta: amount,
      reason: 'operation_refund',
    });

  if (error) throw new Error(`refund failed: ${error.message}`);
}

/**
 * Move whatever is left on a browser's guest account onto the real account
 * that just signed in on the same browser. Two adjustment rows, marked as a
 * transfer in the endpoint column so the wallet history can say what happened.
 *
 * The guest id arrives from a cookie, which a hostile visitor could set to a
 * guessed value; the checks below make that worth at most another welcome
 * grant of the free layers: the source must be a real anonymous account, and
 * only a positive remainder moves.
 */
export async function mergeGuestInto(
  guestId: string,
  accountId: string,
): Promise<number> {
  if (guestId === accountId) return 0;

  const { data: guestUser } = await admin().auth.admin.getUserById(guestId);

  if (!guestUser?.user || guestUser.user.is_anonymous !== true) return 0;

  const remaining = await getBalance(guestId);

  if (remaining <= 0) return 0;

  const { error: outError } = await admin().from('credit_ledger').insert({
    account_id: guestId,
    delta: -remaining,
    reason: 'adjustment',
    endpoint: 'transfer_out',
  });

  if (outError) throw new Error(`transfer out failed: ${outError.message}`);

  const { error: inError } = await admin().from('credit_ledger').insert({
    account_id: accountId,
    delta: remaining,
    reason: 'adjustment',
    endpoint: 'transfer_in',
  });

  if (inError) throw new Error(`transfer in failed: ${inError.message}`);

  return remaining;
}

/**
 * The development bypass, so Jon can test the interface without burning
 * through balances. Dev builds only: the header is ignored the moment this
 * runs on Vercel, whatever a request claims.
 */
export function devBypass(request: Request): boolean {
  return (
    process.env.NODE_ENV === 'development' &&
    request.headers.get('x-uc-dev') === '1'
  );
}
