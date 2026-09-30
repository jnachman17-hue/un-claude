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

  /*
   * ★ FOUR NUMBERS, AND THE TWO THAT CAME OFF. Jon's instruction, 30 September
   * 2026: "We should have a Gross money in, net money in, credit loaded and
   * working tab up top and maybe failed jobs. I don't need a money out or jobs
   * run banner."
   *
   * WHAT WENT: "Money out" (what we have spent at the AI gateway, all time) and
   * "Jobs run". Both are real and neither is a decision. Money out is $1.87
   * against $164 of revenue and has never once been the thing to act on; jobs
   * run is a vanity total that moves with traffic and tells you nothing you
   * cannot read off the funnel. Cost has not been deleted, it has moved to the
   * bottom of the page where a number you check monthly belongs.
   *
   * WHAT ARRIVED: gross and net split apart, because they answer different
   * questions — gross is whether the product sells, net is what is left after
   * refunds — and a single "Money in" tile was quietly reporting net while
   * being read as gross. "Credit loaded" and "AI service" merged into one
   * tile, because the amount only matters together with whether it is serving.
   */
  const grossCents = stripe.ok && mode === 'live' ? stripe.money.grossAll : database.ok ? database.money.purchaseCents : null;
  const netCents = moneyIn.cents;

  const headline = [
    {
      label: 'Gross money in',
      value: dollarsFromCents(grossCents),
      sub: moneyIn.from ? `all time, before refunds · ${moneyIn.from}` : 'no source could be read',
      tone: grossCents ? 'good' : 'plain',
    },
    {
      label: 'Net money in',
      value: dollarsFromCents(netCents),
      sub:
        grossCents !== null && netCents !== null && grossCents !== netCents
          ? `after ${dollarsFromCents(grossCents - netCents)} of refunds`
          : 'after refunds · nothing has been refunded',
      tone: netCents ? 'good' : 'plain',
    },
    {
      /*
       * THE ONE TILE THAT IS ABOUT SOMETHING BREAKING. If this reaches zero the
       * paid rewrite stops for everybody, so the amount and the live serving
       * check belong in the same place rather than two tiles apart.
       */
      label: 'AI credit loaded',
      value: gateway.ok && gateway.loaded !== null ? money(gateway.loaded) : '—',
      sub:
        !gateway.ok
          ? 'the gateway could not be read'
          : servingWord === 'Working'
            ? gateway.burn?.perDay > 0
              ? `working · about ${Math.floor(gateway.loaded / gateway.burn.perDay)} days left`
              : `working · checked just now on ${gateway.serving.model}`
            : servingWord === 'REFUSED'
              ? 'REFUSING requests · the paid rewrite is down'
              : 'serving state unclear',
      tone: servingWord === 'REFUSED' ? 'bad' : loadedTone === 'bad' ? 'bad' : loadedTone === 'warn' ? 'warn' : servingWord === 'Working' ? 'good' : 'warn',
    },
    {
      label: 'Failed jobs',
      value: database.ok ? database.runs.refunded.toLocaleString() : '—',
      sub: database.ok
        ? `${database.runs.refundedToday} today · of ${num(database.runs.total)} ever · credits returned each time`
        : 'the database could not be read',
      tone: database.ok && database.runs.refundedToday > 0 ? 'warn' : 'plain',
    },
  ];

  /*
   * ★ THE FUNNEL, IN PEOPLE, WITH EVERY STEP AS A SHARE OF VISITORS.
   *
   * Jon's instruction: "I want true unique visitors, sanitised something, hit a
   * paid moment, started checkout, purchased, gave an email with percentages
   * all laid out." Six steps, one denominator, three sources — and the sources
   * are named on the page because they are not equally trustworthy.
   *
   * WHY PURCHASES COME FROM STRIPE AND NOT POSTHOG. `purchase_completed` is
   * broken by design: PostHog's persistence here is `memory`, so the visitor id
   * that fired `checkout_started` does not survive the round trip to Stripe's
   * domain and back. Stripe's own count is the only honest last step.
   *
   * WHY "GAVE AN EMAIL" COMES FROM THE DATABASE. PostHog has `signup_started`,
   * which is somebody beginning the form. An account row with an address on it
   * is somebody who finished. Since 04 entry 166 an account is only made at
   * checkout or by choice, so this is now a much smaller and more meaningful
   * number than it was.
   *
   * THE STEPS DO NOT NEST AND THE PAGE SAYS SO. Somebody can hit a paid moment
   * without having sanitised anything (they arrive on an empty balance from a
   * previous visit), and the last two steps are counted over a different window
   * than the first four. Presenting this as a strictly narrowing funnel would
   * be a lie about how people actually move.
   */
  const events = posthog.ok ? new Map(posthog.allEvents.map((x) => [x.event, x.people])) : new Map();
  const visitors = posthog.ok ? posthog.traffic.realVisitors : null;
  const share = (n) => (visitors && n !== null && n !== undefined ? (100 * n) / visitors : null);

  const funnelSteps = posthog.ok
    ? [
        { label: 'Unique visitors', people: visitors, source: 'PostHog', note: 'real people, 30 days, our own traffic excluded' },
        { label: 'Sanitised something', people: events.get('sanitise_completed') || 0, source: 'PostHog', note: 'a finished job, not just a scan' },
        { label: 'Hit a paid moment', people: posthog.paidMomentPeople || 0, source: 'PostHog', note: 'saw the paywall or ran out of credits · counted once each' },
        { label: 'Started checkout', people: events.get('checkout_started') || 0, source: 'PostHog', note: 'pressed a pack button' },
        {
          label: 'Purchased',
          people: stripe.ok && mode === 'live' ? stripe.counts.paid30 : null,
          source: 'Stripe',
          note: 'paid for real · Stripe, because PostHog cannot see the return trip',
        },
        {
          label: 'Gave an email',
          people: database.ok ? database.accounts.registered30 : null,
          source: 'Database',
          note: 'finished making an account · since entry 166 that mostly means a buyer',
        },
      ].map((step) => ({ ...step, pct: share(step.people) }))
    : [];

  return {
    generatedAt: new Date().toISOString(),
    alerts,
    headline,
    funnelSteps,
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

/** A readable integer, or an em dash when there is nothing to show. */
function num(value) {
  return value === null || value === undefined ? '—' : Number(value).toLocaleString();
}
