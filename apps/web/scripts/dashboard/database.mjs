/**
 * USAGE, THE CREDIT LEDGER, AND WHAT EACH RUN ACTUALLY COST US.
 *
 * These are EXACT COUNTS. Every row is a thing that really happened, not a
 * sample and not an estimate, which is the whole difference between this panel
 * and the PostHog one. The page says so, because Jon needs to know which numbers
 * he can take to the bank and which are only a shape.
 *
 * READ-ONLY, ENFORCED BY THE PROTOCOL RATHER THAN BY CARE. Every call here is a
 * GET against PostgREST, and a GET is a SELECT. There is no INSERT, UPDATE or
 * DELETE anywhere in this file, and `http.mjs` refuses to send anything but a
 * GET to this host. That matters more here than anywhere else: the ledger is
 * append-only by design and Supabase's free plan takes no backups, so that
 * append-only discipline is the only protection the credit history has
 * (`20260823120300_record_run_cost.sql`).
 *
 * ★ THIS PANEL SEES REAL SALES THAT THE STRIPE PANEL CANNOT, and that is not a
 * quirk — on this machine it is the whole ballgame. The Stripe key in
 * `apps/web/.env.local` is a TEST key, so the Stripe panel is looking at a
 * sandbox. The ledger's `purchase` rows were written by the LIVE Stripe webhook
 * running on the deployed site, so they are real money by construction. Asked
 * about one of those payments, test-mode Stripe replies:
 *
 *     "No such payment_intent: 'pi_3U7zS5...'; a similar object exists in live
 *      mode, but a test mode key was used to make this request."
 *
 * So when Stripe is in test mode, THIS is the panel telling the truth about
 * money, and `run.mjs` takes the headline figure from here rather than from
 * Stripe. See the session note.
 *
 * TWO REASON CODES THAT LOOK ALIKE AND ARE NOT (`20260820210000_welcome_grant.sql`):
 *
 *   anon_grant    2 credits, given once to ANY account including an anonymous
 *                 guest that never signed up. Counting these as customers would
 *                 inflate the account number roughly fivefold.
 *   signup_grant  3 credits, given once to a REAL registered account.
 *
 * WHY ACCOUNTS ARE DATED FROM THE LEDGER AND NOT FROM `accounts.created_at`:
 * that column is nullable, has no default, and is NULL on all 46 rows in the
 * live database — measured, not assumed. It cannot answer "sign-ups over time".
 * The first grant an account receives is written at the moment the account is
 * created, so the ledger dates it exactly. The page says this is a stand-in.
 */
import { request } from './http.mjs';

/**
 * One read. `select` is a column list, `extra` carries filters and ordering.
 * `Prefer: count=exact` asks PostgREST to report the true total in the
 * `content-range` header, so a count does not require downloading every row.
 */
async function read(env, table, { select = '*', extra = '', limit = 5000 } = {}) {
  const base = env.NEXT_PUBLIC_SUPABASE_URL.replace(/\/$/, '');
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  const url = `${base}/rest/v1/${table}?select=${encodeURIComponent(select)}&limit=${limit}${extra}`;

  const response = await request(url, {
    method: 'GET',
    headers: { apikey: key, Authorization: `Bearer ${key}`, Prefer: 'count=exact' },
  });

  if (!response.ok) {
    throw new Error(`${table}: ${response.error || response.body?.message || `HTTP ${response.status}`}`);
  }

  return Array.isArray(response.body) ? response.body : [];
}

const DAY = 24 * 60 * 60 * 1000;

/**
 * The local calendar day a timestamp falls on.
 *
 * LOCAL, not UTC, and the difference is not pedantic. Jon is seven hours behind
 * UTC, so a run at 8pm his time is already tomorrow in UTC. Bucketing by UTC
 * would file this evening's work under tomorrow and make "today" look empty at
 * exactly the hour he is most likely to look.
 */
function localDay(iso) {
  const d = new Date(iso);
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60_000);

  return local.toISOString().slice(0, 10);
}

function startOfToday() {
  return new Date(new Date().setHours(0, 0, 0, 0));
}

/** Count per local day, oldest first, empty days kept as zero so gaps are visible. */
function countByDay(rows, days) {
  const buckets = new Map();
  const start = startOfToday().getTime() - (days - 1) * DAY;

  for (let i = 0; i < days; i++) buckets.set(localDay(new Date(start + i * DAY).toISOString()), 0);

  for (const row of rows) {
    const day = localDay(row.created_at);

    if (buckets.has(day)) buckets.set(day, buckets.get(day) + 1);
  }

  return [...buckets.entries()].map(([day, count]) => ({ day, count }));
}

export async function readDatabase(env) {
  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    return {
      ok: false,
      reason: 'No database address or service key was found.',
      fix: 'Add NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to apps/web/.env.local.',
    };
  }

  let accountRows;
  let ledger;
  let costs;

  try {
    // Only the timestamp is fetched. Counting sign-ups needs no email and no
    // name, and the less personal data this process holds the less there is to
    // leak into a file.
    accountRows = await read(env, 'accounts', { select: 'created_at' });
    ledger = await read(env, 'credit_ledger', {
      select: 'id,account_id,delta,reason,endpoint,input_kind,words_in,price_cents,created_at',
      extra: '&order=id.desc',
    });
    costs = await read(env, 'run_costs', {
      select: 'ledger_id,cost_usd,total_tokens,seconds,layer_b,model_calls,retries,created_at',
      extra: '&order=ledger_id.desc',
    });
  } catch (error) {
    return {
      ok: false,
      reason: `The database did not answer: ${error.message}`,
      fix: 'Check the network. If it persists, check the project is awake in the Supabase dashboard.',
    };
  }

  const todayIso = startOfToday().toISOString();
  const sinceIso = (days) => new Date(Date.now() - days * DAY).toISOString();
  const after = (rows, iso) => rows.filter((r) => r.created_at >= iso);

  // ---- Accounts -----------------------------------------------------------
  const firstGrants = ledger.filter((r) => r.reason === 'anon_grant' || r.reason === 'signup_grant');
  const registered = ledger.filter((r) => r.reason === 'signup_grant');
  const registeredIds = new Set(registered.map((r) => r.account_id));
  const guestOnly = new Set(
    firstGrants.filter((r) => r.reason === 'anon_grant' && !registeredIds.has(r.account_id)).map((r) => r.account_id),
  );

  // ---- Credits ------------------------------------------------------------
  // Grouped over whatever reasons actually appear rather than a list written
  // here. `anon_grant` was added after the original schema and a hardcoded list
  // would have silently dropped 38 rows.
  const byReason = {};

  for (const row of ledger) {
    const bucket = (byReason[row.reason] ||= { rows: 0, credits: 0 });

    bucket.rows += 1;
    bucket.credits += row.delta;
  }

  // ---- Money, as the ledger recorded it -----------------------------------
  // `price_cents` is what Stripe charged, copied in by the webhook. These rows
  // are live money whatever mode this dashboard's Stripe key is in.
  const purchases = ledger.filter((r) => r.reason === 'purchase');
  const moneyRefunds = ledger.filter((r) => r.reason === 'money_refund');
  const cents = (rows) => rows.reduce((total, r) => total + (r.price_cents || 0), 0);

  // ---- Runs ---------------------------------------------------------------
  const spends = ledger.filter((r) => r.reason === 'spend');
  const refundedRuns = ledger.filter((r) => r.reason === 'operation_refund');
  const paidRuns = costs.filter((c) => c.layer_b === true);
  const costOf = (rows) => rows.reduce((total, r) => total + Number(r.cost_usd || 0), 0);

  /*
   * THE COST-RECORD GAP, MEASURED HONESTLY.
   *
   * Every run should leave a cost row beside its ledger row. Comparing the two
   * totals outright reports a gap of 45, which is alarming and wrong: cost
   * recording only began on 24 August 2026, so every run before that has no cost
   * row and never will. The gap is only meaningful for runs since recording
   * started, and that is what is counted here.
   */
  const costingBegan = costs.length ? costs.reduce((oldest, c) => (c.created_at < oldest ? c.created_at : oldest), costs[0].created_at) : null;
  const spendsSinceCosting = costingBegan ? spends.filter((s) => s.created_at >= costingBegan) : [];

  return {
    ok: true,

    accounts: {
      // The table's own row count: the one exact total available.
      rowsInTable: accountRows.length,
      registered: registeredIds.size,
      guestsNeverRegistered: guestOnly.size,
      // Dated from the first credit grant. See the header.
      datedFromLedger: true,
      createdAtUsable: accountRows.some((r) => r.created_at),
      registeredToday: after(registered, todayIso).length,
      registered7: after(registered, sinceIso(7)).length,
      registered30: after(registered, sinceIso(30)).length,
      byDay: countByDay(registered, 14),
    },

    credits: { byReason },

    money: {
      purchaseCount: purchases.length,
      purchaseCents: cents(purchases),
      refundCount: moneyRefunds.length,
      refundCents: cents(moneyRefunds),
      netCents: cents(purchases) - cents(moneyRefunds),
      todayCents: cents(after(purchases, todayIso)) - cents(after(moneyRefunds, todayIso)),
      last7Cents: cents(after(purchases, sinceIso(7))) - cents(after(moneyRefunds, sinceIso(7))),
      creditsSold: purchases.reduce((t, r) => t + r.delta, 0),
      recent: purchases
        .slice()
        .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
        .slice(0, 6)
        .map((r) => ({ when: r.created_at, cents: r.price_cents || 0, credits: r.delta })),
    },

    runs: {
      total: spends.length,
      today: after(spends, todayIso).length,
      last7: after(spends, sinceIso(7)).length,
      refunded: refundedRuns.length,
      refundedToday: after(refundedRuns, todayIso).length,
      withCostRecorded: costs.length,
      paid: paidRuns.length,
      free: costs.length - paidRuns.length,
      byDay: countByDay(spends, 14),
      // What people actually put in, which decides where the engine work goes.
      byInput: tally(spends, 'input_kind'),
      byEndpoint: tally(spends, 'endpoint'),
      wordsTotal: spends.reduce((t, r) => t + (r.words_in || 0), 0),
    },

    cost: {
      allTime: costOf(costs),
      today: costOf(costs.filter((c) => c.created_at >= todayIso)),
      last7: costOf(costs.filter((c) => c.created_at >= sinceIso(7))),
      perPaidRun: paidRuns.length ? costOf(paidRuns) / paidRuns.length : null,
      slowestSeconds: costs.reduce((worst, c) => Math.max(worst, Number(c.seconds || 0)), 0),
      retriesTotal: costs.reduce((total, c) => total + Number(c.retries || 0), 0),
      costingBegan,
      gapSinceCosting: spendsSinceCosting.length - costs.length,
      spendsSinceCosting: spendsSinceCosting.length,
    },
  };
}

/** Count rows by one column's value, biggest first. Nulls become "not recorded". */
function tally(rows, column) {
  const counts = new Map();

  for (const row of rows) {
    const value = row[column] || 'not recorded';

    counts.set(value, (counts.get(value) || 0) + 1);
  }

  return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([name, count]) => ({ name, count }));
}
