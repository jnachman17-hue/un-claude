/**
 * EVERY NETWORK CALL THIS DASHBOARD MAKES GOES THROUGH HERE, AND THAT IS THE
 * POINT.
 *
 * The brief's hard requirement is read-only: never create, modify, refund or
 * cancel anything at Stripe, and never write a row in the database. A promise to
 * be careful is not worth anything (`CLAUDE.md` section 4), so the guarantee is
 * enforced by this file instead of asserted by a comment.
 *
 * HOW IT IS ENFORCED. `request()` refuses any method other than GET unless the
 * URL matches one of the two entries in `ALLOWED_POSTS` below. There are exactly
 * two, both are reads despite being POSTs, and both are named here with the
 * reason they must be POSTs at all:
 *
 *   1. The AI Gateway liveness probe. Asking "are you serving or are you
 *      refusing?" means actually asking for a completion, which is a POST. It
 *      creates no resource, buys nothing, and costs a fraction of a cent.
 *   2. PostHog's query endpoint. HogQL is a SELECT sent in a request body, which
 *      PostHog exposes as a POST. It reads events and writes nothing.
 *
 * So: no Stripe write endpoint is reachable from this code, because no function
 * here can issue a POST to api.stripe.com — `request()` would throw first. And
 * the database is read over PostgREST with GET, which is a SELECT and has no
 * write form.
 *
 * EVERY CALL ALSO HAS A TIMEOUT AND CANNOT THROW UPWARDS UNCAUGHT. One source
 * being down must degrade one panel, never take the page with it, so failures
 * come back as values (`{ ok: false }`) rather than as exceptions.
 */

/**
 * The only two non-GET requests permitted, matched against the full URL.
 * Adding to this list is a decision, not a detail.
 */
const ALLOWED_POSTS = [
  'https://ai-gateway.vercel.sh/v1/chat/completions',
  /^https:\/\/[a-z0-9.-]+\/api\/projects\/[^/]+\/query\/?$/,
];

function postIsAllowed(url) {
  return ALLOWED_POSTS.some((rule) => (typeof rule === 'string' ? rule === url : rule.test(url)));
}

/**
 * Fifteen seconds for an ordinary read.
 *
 * The gateway probe overrides this and asks for much longer. It is not a metadata
 * lookup — it makes a real model generate real tokens, and deepseek (the model
 * production uses) regularly takes longer than ten seconds when it is cold.
 * At the old ten-second limit the probe timed out intermittently and the page
 * reported the AI service as "Unclear" while it was in fact working perfectly.
 * A false alarm on the one line that means "the product is down" is worse than
 * waiting.
 */
const TIMEOUT_MS = 15_000;

/**
 * One HTTP call, guarded.
 *
 * Returns `{ ok, status, body, error }` and never throws. `body` is parsed JSON
 * when the response is JSON and the raw text otherwise, because an API having a
 * bad day tends to answer in HTML and a parse error would hide the real status.
 */
export async function request(url, { method = 'GET', headers = {}, body, timeout = TIMEOUT_MS } = {}) {
  if (method !== 'GET' && !postIsAllowed(url)) {
    // Deliberately a throw and not a returned failure. This is a programming
    // mistake in this directory, not a source being unreachable, and it must be
    // impossible to ignore.
    throw new Error(`READ-ONLY VIOLATION: ${method} to ${url} is not on the allow-list in http.mjs`);
  }

  try {
    const response = await fetch(url, {
      method,
      headers,
      body,
      signal: AbortSignal.timeout(timeout),
    });

    const text = await response.text();
    const type = response.headers.get('content-type') || '';

    let parsed = text;

    if (type.includes('json')) {
      try {
        parsed = JSON.parse(text);
      } catch {
        parsed = text;
      }
    }

    return { ok: response.ok, status: response.status, body: parsed };
  } catch (error) {
    // A timeout, a DNS failure, no network at all. All of them are "this source
    // is unreachable", which is a panel that degrades rather than a crash.
    const reason = error?.name === 'TimeoutError' ? `no answer within ${timeout / 1000}s` : String(error?.message || error);

    return { ok: false, status: 0, body: null, error: reason };
  }
}

/**
 * Run a source and guarantee it returns a value.
 *
 * Every panel is wrapped in this. If a source throws for a reason nobody
 * predicted — a shape change at the far end, a null where an array was assumed —
 * the panel reports itself broken and the other three still render. This is the
 * mechanism behind the brief's "one dead API must degrade one panel, never the
 * page".
 */
export async function collect(name, fn) {
  try {
    return await fn();
  } catch (error) {
    return {
      ok: false,
      reason: `${name} could not be read: ${String(error?.message || error)}`,
      fix: 'This is a bug in the dashboard rather than a problem with the source. The message above says what went wrong.',
    };
  }
}
