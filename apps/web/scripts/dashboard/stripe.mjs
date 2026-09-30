/**
 * THE MONEY THAT CAME IN.
 *
 * Stripe over its REST API. There is one function that talks to Stripe in this
 * file — `get()` — and it hardcodes the method. No function here can create a
 * charge, issue a refund, or cancel anything, because no such function exists
 * and `http.mjs` would refuse the request even if one were written.
 *
 * WHAT "REVENUE" MEANS HERE, because there are three defensible answers and
 * picking silently would be the dishonest one:
 *
 *   gross    every successful payment, added up
 *   refunded what was given back, whether we chose to or a dispute took it
 *   net      gross minus refunded. THE NUMBER SHOWN BIG.
 *
 * Net is the one on the page because it is the money Jon actually still has.
 * Gross flatters and Jon is the only reader, so flattering him is pointless.
 *
 * DISPUTES ARE COUNTED SEPARATELY AND SHOWN EVEN WHEN THEY ARE ZERO. A dispute
 * costs $15 on top of the amount (`04` entry 66) and it has a deadline, so it is
 * the one number on this page that is urgent rather than merely interesting.
 */
import { request } from './http.mjs';

const API = 'https://api.stripe.com/v1/';

/**
 * The only door to Stripe in this codebase. GET, always.
 *
 * `limit=100` is Stripe's maximum page size. `starting_after` walks backwards
 * through history; the page cap stops a runaway loop if Stripe ever returns
 * `has_more: true` for ever.
 */
async function get(key, resource, query = {}) {
  const params = new URLSearchParams({ limit: '100', ...query });
  const url = `${API}${resource}?${params}`;

  const response = await request(url, {
    method: 'GET',
    headers: { Authorization: `Bearer ${key}` },
  });

  return response;
}

/** Walk every page of a list endpoint, newest first. */
async function listAll(key, resource, query = {}) {
  const items = [];
  let startingAfter;

  for (let page = 0; page < 25; page++) {
    const extra = startingAfter ? { ...query, starting_after: startingAfter } : query;
    const response = await get(key, resource, extra);

    if (!response.ok) {
      const message = response.error || response.body?.error?.message || `HTTP ${response.status}`;

      throw new Error(message);
    }

    const data = response.body?.data || [];

    items.push(...data);

    if (!response.body?.has_more || data.length === 0) break;

    startingAfter = data[data.length - 1].id;
  }

  return items;
}

const DAY = 24 * 60 * 60 * 1000;

/** Sum of `amount` for the charges inside a window, in cents. */
function within(charges, since, pick) {
  return charges.filter((c) => c.created * 1000 >= since).reduce((total, c) => total + pick(c), 0);
}

export async function readStripe(env, mode, key) {
  if (!key) {
    return {
      ok: false,
      needsLiveKey: true,
      reason: 'No Stripe key was found, so there are no payment figures.',
      fix: 'Add UC_DASHBOARD_STRIPE_KEY to apps/web/.env.local with your live key from Stripe → Developers → API keys.',
    };
  }

  /*
   * ★ REAL PAYMENTS ONLY. A TEST KEY GETS NO PANEL.
   *
   * Jon's instruction, 25 August 2026: "I only want a real payments section."
   *
   * A test key can only see Stripe's sandbox, where every payment is invented.
   * The previous version rendered those figures behind a warning banner, which
   * was worse than useless: it filled the panel with numbers that look exactly
   * like revenue and are not, and it made the page longer without making it
   * more true. There is no arrangement of warnings that makes a fake revenue
   * figure worth showing to the person trying to run the business.
   *
   * So the panel refuses, and says what to do instead. The real money is still
   * on the page — it comes from the database, which recorded the live payments
   * as they happened.
   */
  if (mode !== 'live') {
    return {
      ok: false,
      needsLiveKey: true,
      reason:
        mode === 'test'
          ? 'The Stripe key on this machine is a test key, so it can only see practice payments. Those are not shown, because a fake revenue figure is worse than none.'
          : 'The Stripe key is not recognisable as a live key.',
      fix: 'Add UC_DASHBOARD_STRIPE_KEY to apps/web/.env.local with your live key from Stripe → Developers → API keys (with Test mode switched OFF).',
    };
  }

  let charges;
  let refunds;
  let disputes;

  try {
    charges = await listAll(key, 'charges');
  } catch (error) {
    return {
      ok: false,
      reason: `Stripe did not answer: ${error.message}`,
      fix: 'Check the network, then check the key is still valid in the Stripe dashboard.',
    };
  }

  // A failure on either of these two is survivable: the payment figures are
  // still true, so the panel reports what it has and says what it is missing.
  try {
    refunds = await listAll(key, 'refunds');
  } catch {
    refunds = null;
  }

  try {
    disputes = await listAll(key, 'disputes');
  } catch {
    disputes = null;
  }

  const paid = charges.filter((c) => c.status === 'succeeded');
  const failed = charges.filter((c) => c.status === 'failed');

  const now = Date.now();
  // Midnight this morning in the machine's own timezone. Jon reads this at 7am
  // on his own clock, so "today" means his day, not UTC's.
  const midnight = new Date().setHours(0, 0, 0, 0);

  const amount = (c) => c.amount;
  const refundedOf = (c) => c.amount_refunded || 0;

  const grossAll = paid.reduce((t, c) => t + c.amount, 0);
  const refundedAll = paid.reduce((t, c) => t + (c.amount_refunded || 0), 0);

  const currencies = [...new Set(paid.map((c) => c.currency))];

  return {
    ok: true,
    mode,
    // Every charge Stripe told us about carries its own `livemode` flag. If they
    // disagree with the key prefix, something is very wrong and Jon should see it.
    livemodeSeen: [...new Set(charges.map((c) => c.livemode))],
    currency: currencies[0] || 'usd',
    mixedCurrency: currencies.length > 1,

    counts: {
      paid: paid.length,
      failed: failed.length,
      refunds: refunds ? refunds.length : null,
      disputes: disputes ? disputes.length : null,
      /*
       * COUNTS, NOT AMOUNTS, IN THE SAME 30 DAY WINDOW THE BEHAVIOUR PANEL USES.
       * Added 30 September 2026 so the funnel's last step can be a real number
       * from Stripe rather than PostHog's `purchase_completed`, which is known
       * broken: its persistence is `memory`, so the visitor id that started
       * checkout does not survive the round trip through Stripe's own domain
       * and the event arrives as an orphan.
       */
      paid30: paid.filter((c) => c.created * 1000 >= now - 30 * DAY).length,
      paid7: paid.filter((c) => c.created * 1000 >= now - 7 * DAY).length,
    },

    money: {
      grossAll,
      refundedAll,
      netAll: grossAll - refundedAll,
      grossToday: within(paid, midnight, amount),
      netToday: within(paid, midnight, amount) - within(paid, midnight, refundedOf),
      gross7: within(paid, now - 7 * DAY, amount),
      net7: within(paid, now - 7 * DAY, amount) - within(paid, now - 7 * DAY, refundedOf),
      gross30: within(paid, now - 30 * DAY, amount),
      net30: within(paid, now - 30 * DAY, amount) - within(paid, now - 30 * DAY, refundedOf),
      disputedTotal: disputes ? disputes.reduce((t, d) => t + (d.amount || 0), 0) : null,
    },

    // Open disputes are the urgent ones: they have a reply deadline and they are
    // the only thing on this page with a clock running on it.
    disputesOpen: disputes ? disputes.filter((d) => d.status !== 'won' && d.status !== 'lost').length : null,

    recent: paid.slice(0, 6).map((c) => ({
      when: new Date(c.created * 1000).toISOString(),
      amount: c.amount,
      currency: c.currency,
      refunded: (c.amount_refunded || 0) > 0,
      disputed: Boolean(c.disputed),
      live: Boolean(c.livemode),
    })),

    // What could not be fetched, so the page can say so rather than show a zero
    // that looks like good news.
    missing: [refunds === null ? 'refunds' : null, disputes === null ? 'disputes' : null].filter(Boolean),
  };
}
