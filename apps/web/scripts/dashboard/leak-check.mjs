/**
 * THE CHECK THAT DECIDES WHETHER THE FILE IS ALLOWED TO EXIST.
 *
 * This dashboard reads a live Stripe key, a service-role database key that
 * bypasses every row-level security rule, and a gateway key with money behind
 * it. It then writes an HTML file. The failure this whole job is afraid of is
 * one of those keys ending up inside that file — and a file, unlike a terminal,
 * gets opened, mailed, synced and forgotten about.
 *
 * SO THE CHECK RUNS BEFORE THE FILE IS WRITTEN, NOT AFTER. Nothing reaches disk
 * until it has passed. A failure means no file at all and a non-zero exit, which
 * is the loud outcome: a dashboard that refuses to appear gets investigated,
 * whereas a warning printed under a working page gets scrolled past.
 *
 * TWO NETS, because each catches what the other misses:
 *
 *   1. THE EXACT VALUES of the keys actually loaded this run. Catches the real
 *      accident — a value interpolated into the page by mistake.
 *   2. KEY-SHAPED PATTERNS. Catches a credential this dashboard was never given
 *      but which arrived anyway inside an API response: a Stripe error that
 *      quotes a key back, a JWT in a payload, a gateway token in a debug field.
 *      Net 1 cannot see those, and they leak exactly as badly.
 *
 * A first-six-characters check is deliberately NOT the whole of net 1. `sk_test`
 * is the first seven characters of every Stripe test key in the world, so a
 * prefix match alone is a coin toss. The full value is what is searched for;
 * the prefixes are handled by net 2 as shapes with a length requirement.
 */

/**
 * Things that are credentials by their shape.
 *
 * Each needs enough trailing characters to be a real key rather than the prefix
 * appearing in prose — this file and the generated page both discuss `sk_live_`
 * in English, and that must not trip the alarm.
 */
const PATTERNS = [
  { name: 'Stripe secret or restricted key', re: /\b(?:sk|rk)_(?:live|test)_[A-Za-z0-9]{16,}/g },
  { name: 'Supabase or JWT bearer token', re: /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g },
  { name: 'Supabase publishable/secret key', re: /\bsb_(?:secret|publishable)_[A-Za-z0-9_-]{16,}/g },
  { name: 'Vercel AI Gateway key', re: /\bvck_[A-Za-z0-9_-]{16,}/g },
  { name: 'PostHog personal API key', re: /\bphx_[A-Za-z0-9_-]{16,}/g },
  { name: 'PostHog project key', re: /\bphc_[A-Za-z0-9_-]{16,}/g },
  /*
   * A PARTLY-MASKED KEY, which is how a real one nearly got into the file.
   *
   * Given a bad key, Stripe replies "Invalid API Key provided:
   * sk_test_*******************0000" — and this dashboard renders a failed
   * source's error message onto the page. The patterns above all missed it,
   * because an asterisk is not in `[A-Za-z0-9]`. Nothing was truly exposed (the
   * masking is Stripe's own, and it reveals only the last four characters), but
   * a page that prints fragments of a key is one upstream wording change away
   * from printing all of it.
   */
  { name: 'a masked key fragment quoted back by an API', re: /\b(?:sk|rk)_(?:live|test)_[A-Za-z0-9]*\*{3,}[A-Za-z0-9]*/g },
];

/**
 * Strip anything credential-shaped out of a string before it is shown.
 *
 * Applied to EVERY string that reaches the page, at the single point where all
 * of them pass through (`html.mjs`). The messages that need this are the ones
 * written by somebody else — an error from Stripe, PostHog or the gateway —
 * because those can quote a key back at us and this file cannot predict how.
 *
 * Deliberately broader than the detection patterns above: it accepts asterisks
 * and short tails, so a masked or truncated key is caught as readily as a whole
 * one. Redaction is cheap and a false positive costs nothing but a placeholder.
 */
const REDACTIONS = [
  /\b(?:sk|rk)_(?:live|test)_[A-Za-z0-9*_-]{4,}/g,
  /\beyJ[A-Za-z0-9_*-]{8,}\.[A-Za-z0-9_*.-]{8,}/g,
  /\b(?:vck|phx|phc)_[A-Za-z0-9*_-]{8,}/g,
  /\bsb_(?:secret|publishable)_[A-Za-z0-9*_-]{8,}/g,
];

export function redact(text) {
  let out = String(text ?? '');

  for (const re of REDACTIONS) out = out.replace(re, '[key hidden]');

  return out;
}

/**
 * Scan finished HTML for anything secret.
 *
 * Returns `{ clean, findings, checked }`. `findings` never contains the secret
 * itself — reporting a leak by printing it would be its own joke — only what was
 * found, and where.
 */
export function scan(html, secrets) {
  const findings = [];

  for (const secret of secrets) {
    let index = html.indexOf(secret);

    while (index !== -1) {
      findings.push({
        kind: 'exact value of a key this dashboard loaded',
        at: index,
        context: describe(html, index),
      });
      index = html.indexOf(secret, index + 1);
    }
  }

  for (const { name, re } of PATTERNS) {
    for (const match of html.matchAll(re)) {
      findings.push({ kind: name, at: match.index, context: describe(html, match.index) });
    }
  }

  return {
    clean: findings.length === 0,
    findings,
    checked: {
      exactValues: secrets.length,
      patterns: PATTERNS.length,
      bytes: html.length,
    },
  };
}

/** Where in the document a hit landed, with the secret itself masked out. */
function describe(html, index) {
  const before = html.slice(Math.max(0, index - 40), index).replace(/\s+/g, ' ');
  const line = html.slice(0, index).split('\n').length;

  return `line ${line}, after: ...${before}`;
}

/** A human summary of a passing check, for the terminal. */
export function report(result) {
  const lines = [
    `  exact key values searched for : ${result.checked.exactValues}`,
    `  credential shapes searched for: ${result.checked.patterns}`,
    `  bytes scanned                 : ${result.checked.bytes.toLocaleString()}`,
    `  matches found                 : ${result.findings.length}`,
  ];

  for (const finding of result.findings) {
    lines.push(`    ! ${finding.kind} at ${finding.context}`);
  }

  return lines.join('\n');
}
