/**
 * THE MONEY GOING OUT, AND HOW CLOSE WE ARE TO RUNNING OUT.
 *
 * The AI Gateway runs the paid rewrite, so it is where our costs are. Its
 * credits endpoint answers with two numbers and nothing else:
 *
 *     {"balance":"14.56...","total_used":"10.44..."}
 *
 * TWO SEPARATE THINGS CAN STOP THE REWRITE, and confusing them is what took the
 * site down on 24 August 2026 (`07`, "The gateway key has its OWN spend cap"):
 *
 *   1. RUNNING OUT OF LOADED MONEY. `balance` is real prepaid credit. At zero,
 *      everything stops. This is the number Jon asked to see.
 *   2. HITTING THE KEY'S SPEND CAP. A separate monthly limit set on the key
 *      itself. On 24 August it was $10, the key hit it, and every model started
 *      returning 402 WHILE `balance` STILL READ $14.99. Jon has since raised it
 *      to $100 a month.
 *
 * ★ THE CAP IS NOT REPORTED BY ANY API. It is only visible in the Vercel
 * dashboard. So it is supplied by Jon through `AI_GATEWAY_MONTHLY_LIMIT` and
 * the page says plainly that it is a figure he typed in, not one we read. If it
 * is ever changed in Vercel and not here, this page will be wrong — which is
 * why the live probe below exists and is trusted over any arithmetic.
 *
 * SPEND THIS MONTH IS MEASURED, NOT GUESSED. `total_used` is cumulative for all
 * time, so it cannot answer "how much of this month's $100 is gone". Every run
 * of the dashboard therefore appends the current reading to a small local file.
 * Once there is a reading from earlier in the month, the difference between then
 * and now is the real monthly spend, taken from the gateway's own figures rather
 * than inferred from ours. Before that history exists the page says so instead
 * of showing a number it cannot stand behind.
 *
 * THE PROBE IS THE ONLY RELIABLE ANSWER TO "IS IT UP". Since the cap is
 * invisible and the balance can mislead, the honest test is to ask the gateway
 * to do a tiny piece of real work on the model production actually uses.
 */
import { request } from './http.mjs';
import { readHistory, appendReading } from './history.mjs';

const CREDITS = 'https://ai-gateway.vercel.sh/v1/credits';
const COMPLETIONS = 'https://ai-gateway.vercel.sh/v1/chat/completions';

/**
 * The probe model. THIS MUST BE THE MODEL PRODUCTION USES, or the probe proves
 * nothing about whether a customer's rewrite would work: a cap or an outage can
 * hit one provider and not another. Production is `deepseek/deepseek-v3.2`,
 * chosen in `lane-a-engine.md` to replace `mistral/mistral-small`.
 */
const DEFAULT_PROBE_MODEL = 'deepseek/deepseek-v3.2';

/** Jon raised the cap from $10 to $100 a month on 24 August 2026. */
const DEFAULT_MONTHLY_LIMIT = 100;

export async function readGateway(env) {
  const key = env.AI_GATEWAY_API_KEY;

  if (!key) {
    return {
      ok: false,
      reason: 'No AI Gateway key was found.',
      fix: 'Add AI_GATEWAY_API_KEY to .env.engine.local in the un-claude folder.',
    };
  }

  const model = env.AI_GATEWAY_PROBE_MODEL || DEFAULT_PROBE_MODEL;
  const monthlyLimit = Number(env.AI_GATEWAY_MONTHLY_LIMIT || DEFAULT_MONTHLY_LIMIT);
  const headers = { Authorization: `Bearer ${key}` };

  const credits = await request(CREDITS, { method: 'GET', headers });

  // The probe runs whether or not the credits call worked. They fail
  // independently and the probe is the more important of the two.
  const probe = await request(COMPLETIONS, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: 'ok' }],
      max_tokens: 16,
    }),
    // A real generation, not a metadata lookup. Deepseek can take a while when
    // it is cold, and a timeout here would wrongly report the product as down.
    timeout: 40_000,
  });

  let serving;

  if (probe.ok) {
    serving = { state: 'serving', detail: `${model} answered normally.`, model };
  } else if (probe.status === 402) {
    serving = {
      state: 'refused',
      detail: probe.body?.error?.message || 'The gateway returned 402. The key has hit its spend cap.',
      model,
    };
  } else if (probe.status === 401 || probe.status === 403) {
    serving = { state: 'refused', detail: `The gateway rejected the key (HTTP ${probe.status}).`, model };
  } else if (probe.status === 0) {
    serving = { state: 'unknown', detail: `Could not reach the gateway: ${probe.error}.`, model };
  } else {
    serving = {
      state: 'unknown',
      detail: `The gateway answered HTTP ${probe.status}: ${probe.body?.error?.message || 'no message'}.`,
      model,
    };
  }

  if (!credits.ok) {
    return {
      ok: true,
      partial: true,
      reason: credits.error || `The credits endpoint answered HTTP ${credits.status}.`,
      loaded: null,
      totalUsed: null,
      monthlyLimit,
      serving,
    };
  }

  const totalUsed = Number(credits.body?.total_used);
  const loaded = Number(credits.body?.balance);

  // Record this reading, then look back. Writing before reading means the very
  // first run still establishes the baseline every later run measures against.
  appendReading({ totalUsed, loaded });

  const month = monthlySpend(totalUsed);
  const burn = dailyBurn(totalUsed);

  return {
    ok: true,
    partial: false,
    /** Real prepaid money on the account. At zero, everything stops. */
    loaded: Number.isFinite(loaded) ? loaded : null,
    totalUsed: Number.isFinite(totalUsed) ? totalUsed : null,
    monthlyLimit,
    limitIsDeclared: true,
    month,
    burn,
    /*
     * The binding constraint: whichever runs out first, the loaded money or
     * what is left of this month's cap. Null where it cannot be known.
     */
    headroom: computeHeadroom(loaded, monthlyLimit, month),
    serving,
  };
}

/**
 * How much has been spent since the first reading taken this calendar month.
 *
 * Returns `{ spent, since, readings }`, or `{ spent: null }` when there is no
 * earlier reading to compare against — which is the honest answer on the first
 * run of a new month, and is shown as such rather than as a zero.
 */
function monthlySpend(totalUsedNow) {
  const history = readHistory();
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const thisMonth = history.filter((r) => r.at >= monthStart && Number.isFinite(r.totalUsed));

  if (!thisMonth.length) return { spent: null, since: null, readings: 0 };

  const earliest = thisMonth.reduce((oldest, r) => (r.at < oldest.at ? r : oldest), thisMonth[0]);
  const ageHours = (Date.now() - new Date(earliest.at).getTime()) / 3_600_000;

  return {
    spent: Math.max(0, totalUsedNow - earliest.totalUsed),
    since: earliest.at,
    readings: thisMonth.length,
    /*
     * ★ HOW OLD THE BASELINE IS, WHICH DECIDES WHETHER THE NUMBER MEANS
     * ANYTHING YET.
     *
     * On the first day of measuring, "spent this month" is near zero simply
     * because measuring started minutes ago — not because nothing was spent.
     * Shown as "$0.00 of $100.00" beside a 0% meter, that reads as reassurance,
     * and reassurance is the single most dangerous thing this panel could get
     * wrong: the last time this project misread its gateway headroom, the site
     * went down. So under a day, the page says it is still measuring instead of
     * printing a figure that looks like good news.
     */
    ageHours,
    tooYoung: ageHours < 24,
    /*
     * The baseline is the first reading TAKEN, not the true start of the month.
     * Anything spent before the dashboard first ran this month is invisible to
     * it, so the figure is a floor. The page says so.
     */
    isFloor: true,
  };
}

/** Average spend per day over the last 7 days of readings, for a runway estimate. */
function dailyBurn(totalUsedNow) {
  const history = readHistory();
  const weekAgo = new Date(Date.now() - 7 * 86_400_000).toISOString();
  const recent = history.filter((r) => r.at >= weekAgo && Number.isFinite(r.totalUsed));

  if (recent.length < 2) return { perDay: null, days: 0 };

  const earliest = recent.reduce((oldest, r) => (r.at < oldest.at ? r : oldest), recent[0]);
  const days = (Date.now() - new Date(earliest.at).getTime()) / 86_400_000;

  // Under a few hours of history the divisor is tiny and the extrapolation is
  // nonsense. Better to say nothing than to print an invented burn rate.
  if (days < 0.5) return { perDay: null, days };

  return { perDay: Math.max(0, totalUsedNow - earliest.totalUsed) / days, days };
}

function computeHeadroom(loaded, monthlyLimit, month) {
  const capLeft = month.spent === null ? null : Math.max(0, monthlyLimit - month.spent);

  if (!Number.isFinite(loaded)) return { amount: capLeft, limitedBy: capLeft === null ? null : 'the monthly cap' };
  if (capLeft === null) return { amount: loaded, limitedBy: 'money loaded' };

  return capLeft < loaded
    ? { amount: capLeft, limitedBy: 'the monthly cap' }
    : { amount: loaded, limitedBy: 'money loaded' };
}
