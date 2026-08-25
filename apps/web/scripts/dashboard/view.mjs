/**
 * WHAT THE NUMBERS MEAN AND WHAT COUNTS AS A PROBLEM.
 *
 * Shared by both ways of running the dashboard — the live server (`serve.mjs`)
 * and the one-off file (`run.mjs`) — so the two can never drift into disagreeing
 * about whether something is wrong.
 *
 * Two jobs: pick the six numbers that go at the top, and decide what deserves a
 * coloured strip above them.
 */

/**
 * ★ WHICH SOURCE TELLS THE TRUTH ABOUT MONEY.
 *
 * Stripe is the authority when it is live. When it is not — no key, or a test
 * key — the Payments panel refuses to show anything, and the money figure comes
 * from the database instead.
 *
 * That fallback is not a consolation prize. The `purchase` rows in the credit
 * ledger were written by the LIVE Stripe webhook running on the deployed site,
 * so they are real money by construction, whatever key this dashboard holds.
 * They are how Jon's first sale showed up at all.
 *
 * What the database CANNOT see is a payment that Stripe took but whose webhook
 * never arrived. That is exactly the failure worth knowing about, and it is the
 * reason the live key is still worth adding.
 */
function chooseMoneyIn({ stripe, database, mode }) {
  if (stripe.ok && mode === 'live') {
    return {
      cents: stripe.money.netAll,
      today: stripe.money.netToday,
      from: 'Stripe, live',
      real: true,
      authoritative: true,
    };
  }

  if (database.ok) {
    return {
      cents: database.money.netCents,
      today: database.money.todayCents,
      from: 'our database — add the live Stripe key to confirm it',
      real: true,
      authoritative: false,
    };
  }

  return { cents: null, today: null, from: null, real: false, authoritative: false };
}

export function buildView({ env, mode, keySource, stripe, gateway, database, posthog }) {
  const alerts = [];
  const moneyIn = chooseMoneyIn({ stripe, database, mode });

  // ---- Problems, in the order they should be worried about ----------------

  if (gateway.ok && gateway.serving.state === 'refused') {
    alerts.push({
      level: 'critical',
      title: 'The paid rewrite is DOWN.',
      detail: 'The AI gateway is refusing work. Check the spending limit on the key in the Vercel dashboard.',
    });
  }

  /*
   * RUNNING OUT OF LOADED MONEY. Two tests, because either can bite first: an
   * absolute floor for "this is nearly empty", and a burn-rate test for "this
   * will be empty before you look again". The burn test only fires once there
   * is enough history to mean anything.
   */
  if (gateway.ok && gateway.loaded !== null) {
    const daysLeft = gateway.burn?.perDay > 0 ? gateway.loaded / gateway.burn.perDay : null;

    if (gateway.loaded < 5) {
      alerts.push({
        level: 'critical',
        title: `Only ${money(gateway.loaded)} of credit is loaded on the AI gateway.`,
        detail: 'When this reaches zero the paid rewrite stops for everyone. Top it up in the Vercel dashboard.',
      });
    } else if (daysLeft !== null && daysLeft < 14) {
      alerts.push({
        level: 'warning',
        title: `The AI gateway has about ${Math.floor(daysLeft)} days of credit left.`,
        detail: `${money(gateway.loaded)} loaded, spending roughly ${money(gateway.burn.perDay)} a day at the recent rate.`,
      });
    }
  }

  // Approaching the monthly cap — the thing that actually took the site down.
  if (gateway.ok && gateway.month?.spent !== null && gateway.monthlyLimit) {
    const used = gateway.month.spent / gateway.monthlyLimit;

    if (used >= 0.8) {
      alerts.push({
        level: used >= 0.95 ? 'critical' : 'warning',
        title: `${Math.round(used * 100)}% of this month's AI budget is gone.`,
        detail: `At least ${money(gateway.month.spent)} spent against your ${money(gateway.monthlyLimit)} monthly limit. At the limit, everything stops.`,
      });
    }
  }

  if (stripe.ok && stripe.disputesOpen > 0) {
    alerts.push({
      level: 'critical',
      title: `${stripe.disputesOpen} dispute${stripe.disputesOpen === 1 ? '' : 's'} still open.`,
      detail: 'These have a reply deadline and cost $15 each. Answer them in Stripe.',
    });
  }

  if (database.ok && database.runs.refundedToday > 0) {
    const n = database.runs.refundedToday;

    alerts.push({
      level: 'warning',
      title: n === 1 ? '1 job failed today.' : `${n} jobs failed today.`,
      detail: 'Someone tried to use the product and it did not work. The credits were returned.',
    });
  }

  if (database.ok && database.cost.gapSinceCosting > 0) {
    const n = database.cost.gapSinceCosting;

    alerts.push({
      level: 'warning',
      title: n === 1 ? '1 recent job has no cost recorded.' : `${n} recent jobs have no cost recorded.`,
      detail: 'The cost figures further down are lower than reality.',
    });
  }

  // Sources that could not be read at all.
  for (const [name, result] of [
    ['The AI gateway', gateway],
    ['The database', database],
  ]) {
    if (!result.ok) {
      alerts.push({ level: 'critical', title: `${name} could not be read.`, detail: result.reason });
    }
  }

  if (!stripe.ok) {
    alerts.push({
      level: stripe.needsLiveKey ? 'warning' : 'critical',
      title: stripe.needsLiveKey ? 'Payments needs your live Stripe key.' : 'Stripe could not be read.',
      detail: stripe.needsLiveKey
        ? 'Until it is added, the money figures come from our own database instead.'
        : stripe.reason,
    });
  }

  if (!posthog.ok) {
    alerts.push({
      level: 'info',
      title: posthog.configured ? 'The behaviour numbers are missing.' : 'Free scans and page views are not being counted yet.',
      detail: 'PostHog is the only place a free scan is recorded. The Behaviour panel says how to switch it on.',
    });
  }

  // ---- The numbers at the top ---------------------------------------------

  const servingWord = !gateway.ok
    ? 'Unknown'
    : gateway.serving.state === 'serving'
      ? 'Working'
      : gateway.serving.state === 'refused'
        ? 'REFUSED'
        : 'Unclear';

  const loadedTone =
    !gateway.ok || gateway.loaded === null ? 'plain' : gateway.loaded < 5 ? 'bad' : gateway.loaded < 20 ? 'warn' : 'good';

  const headline = [
    {
      label: 'Money in',
      value: dollarsFromCents(moneyIn.cents),
      sub: moneyIn.from ? `all time, after refunds · ${moneyIn.from}` : 'no source could be read',
      tone: moneyIn.cents ? 'good' : 'plain',
    },
    {
      label: 'Money out',
      value: gateway.ok && gateway.totalUsed !== null ? money(gateway.totalUsed) : '—',
      sub: 'spent on AI since the account opened',
      tone: 'plain',
    },
    {
      label: 'Credit loaded',
      value: gateway.ok && gateway.loaded !== null ? money(gateway.loaded) : '—',
      sub:
        gateway.ok && gateway.burn?.perDay > 0
          ? `about ${Math.floor(gateway.loaded / gateway.burn.perDay)} days left at the recent rate`
          : 'money sitting on the AI account · at zero, the rewrite stops',
      tone: loadedTone,
    },
    {
      label: 'AI service',
      value: servingWord,
      sub:
        gateway.ok && gateway.serving.state === 'serving'
          ? `checked just now on ${gateway.serving.model}`
          : 'the paid rewrite depends on this',
      tone: servingWord === 'Working' ? 'good' : servingWord === 'REFUSED' ? 'bad' : 'warn',
    },
    {
      label: 'Jobs run',
      value: database.ok ? database.runs.total.toLocaleString() : '—',
      sub: database.ok ? `${database.runs.today} today · ${database.runs.last7} in the last 7 days` : 'the database could not be read',
      tone: 'plain',
    },
    {
      label: 'Failed jobs',
      value: database.ok ? database.runs.refunded.toLocaleString() : '—',
      sub: database.ok ? `${database.runs.refundedToday} today · credits were returned each time` : 'the database could not be read',
      tone: database.ok && database.runs.refundedToday > 0 ? 'warn' : 'plain',
    },
  ];

  return {
    generatedAt: new Date().toISOString(),
    alerts,
    headline,
    moneyIn,
    mode,
    keySource,
    stripe,
    gateway,
    database,
    posthog,
  };
}

function money(value) {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) return '—';

  return `$${Number(value).toFixed(2)}`;
}

function dollarsFromCents(cents) {
  return cents === null || cents === undefined ? '—' : `$${(cents / 100).toFixed(2)}`;
}
