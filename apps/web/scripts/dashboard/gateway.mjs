/**
 * THE MONEY GOING OUT, AND THE TRAP THAT ALREADY COST THIS PROJECT A DAY.
 *
 * The AI Gateway is where the paid rewrite (layer B) actually runs, so it is
 * where our costs are. Its credits endpoint answers with two numbers:
 *
 *     {"balance":"14.60...","total_used":"10.39..."}
 *
 * ★ `balance` IS NOT HEADROOM, AND READING IT AS HEADROOM TOOK LAYER B DOWN ON
 * THE LIVE SITE ON 24 AUGUST 2026 (`07`, "The gateway key has its OWN spend cap").
 * On that day every model returned HTTP 402 — "API key budget exceeded. Current
 * spend: $10.00, limit: $10.00" — while `balance` still read $14.99. There was
 * $14.99 of prepaid credit on the account and not a cent of it was spendable,
 * because THE CAP IS ON THE KEY and this endpoint does not report the cap.
 *
 * Three consequences, and all three are visible on the page rather than buried
 * in this comment:
 *
 *   1. `total_used` is the number that matters, so it is the one shown big.
 *   2. `balance` is labelled "prepaid credit on the account" and explicitly told
 *      not to be read as headroom.
 *   3. THE CAP CANNOT BE READ FROM ANY API WE HAVE. It is only visible in the
 *      Vercel AI Gateway dashboard, on the key itself. The page says that in
 *      plain words rather than leaving a gap where a number should be.
 *
 * THE PROBE IS THE REAL ANSWER. Since the cap is invisible, the only honest way
 * to know whether the gateway will serve a paying customer right now is to ask
 * it for something and see what it says. One cheap call, sixteen tokens, on the
 * same small model the engine uses. "Serving" or "REFUSED (402)" is the single
 * line that would have caught the outage the moment it started.
 */
import { request } from './http.mjs';

const CREDITS = 'https://ai-gateway.vercel.sh/v1/credits';
const COMPLETIONS = 'https://ai-gateway.vercel.sh/v1/chat/completions';

/**
 * The probe model. `mistral/mistral-small` is the cheapest model this project
 * actually uses in anger, so a refusal here is a refusal that would hit a real
 * customer. Sixteen tokens is the gateway's own minimum.
 */
const PROBE_MODEL = 'mistral/mistral-small';

export async function readGateway(env) {
  const key = env.AI_GATEWAY_API_KEY;

  if (!key) {
    return {
      ok: false,
      reason: 'No AI Gateway key was found.',
      fix: 'Add AI_GATEWAY_API_KEY to .env.engine.local in the un-claude folder.',
    };
  }

  const headers = { Authorization: `Bearer ${key}` };

  const credits = await request(CREDITS, { method: 'GET', headers });

  // The probe runs whether or not the credits call worked. They fail
  // independently, and the probe is the more important of the two.
  const probe = await request(COMPLETIONS, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: PROBE_MODEL,
      messages: [{ role: 'user', content: 'ok' }],
      max_tokens: 16,
    }),
  });

  let serving;

  if (probe.ok) {
    serving = { state: 'serving', detail: `${PROBE_MODEL} answered normally.` };
  } else if (probe.status === 402) {
    serving = {
      state: 'refused',
      detail:
        probe.body?.error?.message ||
        'The gateway returned 402. The key has hit its spend cap and the paid rewrite is down.',
    };
  } else if (probe.status === 401 || probe.status === 403) {
    serving = { state: 'refused', detail: `The gateway rejected the key (HTTP ${probe.status}).` };
  } else if (probe.status === 0) {
    serving = { state: 'unknown', detail: `Could not reach the gateway: ${probe.error}.` };
  } else {
    serving = {
      state: 'unknown',
      detail: `The gateway answered HTTP ${probe.status}: ${probe.body?.error?.message || 'no message'}.`,
    };
  }

  if (!credits.ok) {
    // The spend figures are gone but the probe still answered, and the probe is
    // the line that matters. Return what we have.
    return {
      ok: true,
      partial: true,
      reason: credits.error || `The credits endpoint answered HTTP ${credits.status}.`,
      totalUsed: null,
      balance: null,
      serving,
    };
  }

  const totalUsed = Number(credits.body?.total_used);
  const balance = Number(credits.body?.balance);

  return {
    ok: true,
    partial: false,
    totalUsed: Number.isFinite(totalUsed) ? totalUsed : null,
    balance: Number.isFinite(balance) ? balance : null,
    serving,
  };
}
