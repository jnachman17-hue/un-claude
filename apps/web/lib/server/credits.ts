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

/**
 * The same idea one level up: "that FUNCTION does not exist (yet)". Postgres
 * says 42883; PostgREST says PGRST202 when the function is absent from its
 * schema cache. Both mean the migration has not been run.
 */
const UNDEFINED_FUNCTION = '42883';
const POSTGREST_FUNCTION_MISSING = 'PGRST202';

function isMissingFunction(code: string | undefined | null): boolean {
  return code === UNDEFINED_FUNCTION || code === POSTGREST_FUNCTION_MISSING;
}

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
   * True when this is a REAL account continuing a guest session. On a
   * conversion the welcome grant is skipped: the guest account was already
   * paid it and mergeGuestInto carries its leftover across. Paying it again is
   * finding 2's double grant (7 credits instead of the ratified 5).
   *
   * THE CALLER MUST DERIVE THIS FROM `hasConverted`, NOT FROM THE COOKIE
   * ALONE. The cookie is deleted by the same request that reads it, so it is
   * true exactly once and false for ever afterwards — which is how an account
   * came to be paid this grant 46 seconds after being correctly denied it.
   * guest-merge-double-runs.md, defect 2.
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
 * that just signed in on the same browser, EXACTLY ONCE.
 *
 * This function used to do the work itself: read the guest's balance, write a
 * negative row to the guest, write a positive row to the account. That is
 * three steps with no lock and no record that it had run, so two requests
 * arriving together both read the same balance and both performed the
 * transfer. It happened every single time, because two components each fetch
 * GET /api/credits on page load. See guest-merge-double-runs.md for the
 * ledger rows, and 20260821140000_guest_conversion_once.sql for the fix.
 *
 * All of it now lives in `merge_guest_credits`, for the same reason `spend`
 * lives in `spend_credits`: the check and the write have to be one indivisible
 * step under a lock, and no amount of care in TypeScript can make them one.
 * The hostile-cookie check moved down there too, so it cannot be bypassed by a
 * future caller that forgets it.
 *
 * Returns the number of credits carried across, or NULL meaning "did not run
 * at all" — see the migration-missing branch below. Null is not zero: zero is
 * a completed conversion that had nothing to move, and the caller must tell
 * them apart before it clears the guest cookie.
 */
export async function mergeGuestInto(
  guestId: string,
  accountId: string,
): Promise<number | null> {
  const { data, error } = await admin().rpc('merge_guest_credits', {
    guest_account: guestId,
    target_account: accountId,
  });

  if (!error) return (data as number) ?? 0;

  // The migration has not been run yet. Do NOTHING and say so, rather than
  // falling back to the old in-TypeScript transfer: the old path is the bug,
  // and a merge that has not happened is recoverable — the credits are still
  // sitting on the guest account and the caller keeps the cookie — whereas a
  // doubled one mints credits. Same reasoning as the grant_email fallback
  // above, landing on the opposite answer because the risks are not symmetric.
  if (isMissingFunction(error.code)) {
    console.error(
      'merge_guest_credits is missing — run migration ' +
        '20260821140000_guest_conversion_once.sql. The guest merge is ' +
        'INACTIVE until it lands; credits stay on the guest account.',
    );

    return null;
  }

  throw new Error(`guest merge failed: ${error.message}`);
}

/**
 * Has this account already carried credits over from a guest session?
 *
 * WHY THIS EXISTS. The welcome grant is withheld from an account that is
 * continuing a guest session, because the guest was already paid it. That
 * decision used to read the guest cookie — and the same request then DELETED
 * that cookie, so the next balance check no longer knew, and paid the grant
 * after all. The account reached 7 credits against a ratified 5, which is the
 * exact failure security-audit.md finding 2 was written to prevent.
 *
 * A cookie was the wrong place to keep a permanent fact. This reads the
 * conversion record instead, which is written once and never removed while the
 * account exists.
 */
export async function hasConverted(accountId: string): Promise<boolean> {
  const { data, error } = await admin().rpc('has_converted', {
    target_account: accountId,
  });

  if (!error) return data === true;

  // Before the migration lands there is no record to read, and the caller
  // falls back to the cookie exactly as it did before. Saying "true" here
  // would deny the welcome grant to every cold signup.
  if (isMissingFunction(error.code)) return false;

  // Any other failure: claim it IS a conversion, so the worst case is a missed
  // giveaway rather than a double one. Same rule as hasGrant above.
  console.warn(`has_converted failed, assuming converted: ${error.message}`);

  return true;
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

/**
 * -------------------------------------------------------
 * Paid credits. 04 entry 112, session 11.
 * -------------------------------------------------------
 *
 * These two are called ONLY by the Stripe webhook, never by a browser and
 * never by a page. They are here rather than in `stripe.ts` for the reason
 * stated at the top of this file: every credit decision the server makes lives
 * in one place, so the answer to "what can change a balance" is one file long.
 */

/**
 * Pay for a completed Stripe payment, exactly once.
 *
 * IDEMPOTENCY IS THE WHOLE JOB, and it is enforced by two database indexes
 * rather than by anything this function does. Stripe delivers every webhook AT
 * LEAST once, so a repeat delivery is a certainty:
 *
 *   - `credit_ledger_stripe_event_id_uniq` catches the SAME event arriving
 *     twice, which is what a Stripe retry is.
 *   - `credit_ledger_purchase_payment_intent_uniq` catches the same PAYMENT
 *     arriving under a different event id, which is what a second handler for a
 *     second event type would produce. See 20260821150000_stripe_purchases.sql.
 *
 * Either one firing means "already paid", which is a success, not a failure.
 * Returns whether this call was the one that actually granted the credits, so
 * the route can log the difference between a first delivery and a retry instead
 * of reporting both as new sales.
 */
export async function recordPurchase(params: {
  accountId: string;
  credits: number;
  eventId: string;
  paymentIntentId: string | null;
  priceCents: number;
}): Promise<{ granted: boolean }> {
  const { error } = await admin().from('credit_ledger').insert({
    account_id: params.accountId,
    delta: params.credits,
    reason: 'purchase',
    stripe_event_id: params.eventId,
    stripe_payment_intent_id: params.paymentIntentId,
    price_cents: params.priceCents,
  });

  if (!error) return { granted: true };

  // Already paid, by either index. The correct response to Stripe is 200: the
  // event WAS handled, just not by this delivery of it.
  if (error.code === UNIQUE_VIOLATION) return { granted: false };

  throw new Error(`recordPurchase failed: ${error.message}`);
}

/**
 * Take back the credits a refunded payment bought.
 *
 * The clamping, the locking and the reasoning all live in the database
 * function `refund_purchase`; see the migration for why a negative balance is
 * never an acceptable outcome. This wrapper exists to translate a missing
 * migration into a loud, actionable failure rather than a silent one, because
 * the consequence of this step not running is a customer holding both their
 * money and their credits.
 *
 * Returns the number of credits actually removed, which is LESS than asked
 * whenever the customer had already spent some of them.
 */
export async function refundPurchase(params: {
  accountId: string;
  /**
   * The TOTAL credits that should stand removed for this payment once this
   * call is done — NOT the number to remove now.
   *
   * This is the shape it is because Stripe's `charge.amount_refunded` is a
   * RUNNING TOTAL, and the first version of this treated it as the amount of
   * the current refund. Two $3 refunds against a $9.99 pack removed 8 credits
   * and then 16, for a total of 24 out of 25, against a correct total of 16.
   * See 20260821160000_refund_cumulative.sql.
   */
  targetTotal: number;
  paymentIntentId: string;
  eventId: string;
  refundCents: number | null;
}): Promise<number> {
  const { data, error } = await admin().rpc('refund_purchase', {
    target_account: params.accountId,
    target_total: params.targetTotal,
    payment_intent: params.paymentIntentId,
    event_id: params.eventId,
    refund_cents: params.refundCents,
  });

  if (!error) return (data as number) ?? 0;

  // A repeat delivery of the same refund event. Already handled.
  if (error.code === UNIQUE_VIOLATION) return 0;

  if (isMissingFunction(error.code)) {
    throw new Error(
      'refund_purchase (target_total signature) is missing — run migration ' +
        '20260821160000_refund_cumulative.sql. A refund was issued in Stripe ' +
        'and the credits it bought are STILL ON THE ACCOUNT.',
    );
  }

  throw new Error(`refundPurchase failed: ${error.message}`);
}

/**
 * The account a Stripe payment belongs to, read back off the purchase row.
 *
 * WHY THE REFUND PATH CANNOT JUST TRUST THE WEBHOOK. A `charge.refunded` event
 * describes a charge, not an account: Stripe has no idea what an un-claude
 * account is. The link between the two was written into the ledger at purchase
 * time, so this reads it back rather than trusting anything in the refund
 * event, and returns null when no purchase row exists — which is the correct
 * answer for a refund of something that never granted credits here.
 */
export async function purchaseByPaymentIntent(
  paymentIntentId: string,
): Promise<{ accountId: string; credits: number } | null> {
  const { data, error } = await admin()
    .from('credit_ledger')
    .select('account_id, delta')
    .eq('stripe_payment_intent_id', paymentIntentId)
    .eq('reason', 'purchase')
    .limit(1);

  if (error) throw new Error(`purchaseByPaymentIntent failed: ${error.message}`);

  const row = Array.isArray(data) ? data[0] : null;

  if (!row) return null;

  return { accountId: row.account_id as string, credits: row.delta as number };
}
