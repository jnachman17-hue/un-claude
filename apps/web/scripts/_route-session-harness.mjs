/**
 * SHARED PLUMBING FOR THE ROUTE SESSION'S TWO VERIFICATIONS, 24 August 2026.
 *
 *   node scripts/verify-cost-leak-closed.mjs
 *   node scripts/verify-cjk-refusal.mjs
 *
 * Both drive the REAL /api/tool/clean route with a REAL signed-in session and
 * the REAL credits code, against the real database. The throwaway account
 * machinery is lane B's, reused rather than re-written, because its `destroy()`
 * refuses any address outside the `lane-b-money-` prefix and that guard is what
 * makes it impossible for a mistake here to touch a customer.
 *
 * UC_SITE defaults to a LOCAL dev server. Nothing here should ever be pointed
 * at production: it spends credits.
 */
import { db, RUN, throwaway } from './_lane-b-throwaway.mjs';

export const SITE = process.env.UC_SITE ?? 'http://localhost:3200';

/**
 * A session on the site, through the product's own confirmation route, using an
 * admin-issued one-time token. Lane B's method, unchanged: Turnstile correctly
 * refuses an automated sign-in form, which is the captcha working.
 */
export async function sessionFor(email) {
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

/** A throwaway account, signed in, with credits on it. */
export async function signedIn(tag, credits = 50) {
  const email = `lane-b-money-route-${tag}-${RUN}@un-claude.com`;
  const account = await throwaway(tag, email);

  const { error } = await db
    .from('credit_ledger')
    .insert({ account_id: account.id, delta: credits, reason: 'adjustment' });

  if (error) throw new Error(`could not fund throwaway: ${error.message}`);

  return { ...account, cookies: await sessionFor(email) };
}

export const b64 = (text) => Buffer.from(text, 'utf8').toString('base64');

export async function postClean(cookies, body) {
  const res = await fetch(`${SITE}/api/tool/clean`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', cookie: cookies },
    body: JSON.stringify(body),
  });

  return { status: res.status, body: await res.json() };
}

export async function postScan(body) {
  const res = await fetch(`${SITE}/api/tool/scan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  return { status: res.status, body: await res.json() };
}

export async function ledgerRows(accountId) {
  const { data, error } = await db
    .from('credit_ledger')
    .select('id, delta, reason, endpoint, words_in')
    .eq('account_id', accountId)
    .order('id', { ascending: true });

  if (error) throw new Error(`ledger read failed: ${error.message}`);

  return data ?? [];
}

export async function runCostsFor(ledgerIds) {
  if (!ledgerIds.length) return [];

  const { data, error } = await db
    .from('run_costs')
    .select('ledger_id, model_calls, retries, total_tokens, cost_usd, seconds, layer_b')
    .in('ledger_id', ledgerIds);

  if (error) throw new Error(`run_costs read failed: ${error.message}`);

  return data ?? [];
}

/** Every key anywhere in an object, so a leak cannot hide one level deeper. */
export function everyKey(value, found = new Set()) {
  if (Array.isArray(value)) {
    for (const item of value) everyKey(item, found);
  } else if (value && typeof value === 'object') {
    for (const [key, item] of Object.entries(value)) {
      found.add(key);
      everyKey(item, found);
    }
  }

  return found;
}

export const MONEY_KEYS = [
  'cost_usd',
  'cost',
  'prompt_tokens',
  'completion_tokens',
  'total_tokens',
  'model_calls',
  'calls_without_usage',
];
