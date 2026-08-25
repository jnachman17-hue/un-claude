/**
 * THE OPERATOR DASHBOARD. One command, four sources, one HTML file.
 *
 *     cd apps/web && node scripts/dashboard/run.mjs
 *
 * It answers five questions: how much money came in, how much is going out, how
 * many people used it, what broke, and how much room is left on the AI gateway.
 *
 * WHY IT IS A FILE ON THIS MACHINE AND NOT A WEB PAGE. It reads the live Stripe
 * key, the database service-role key (which bypasses every access rule in the
 * database) and the gateway key. Those must never reach a browser other than
 * Jon's own, and hosting them behind a login would be a bigger job with a far
 * worse failure mode. So: a file, generated locally, uploaded nowhere.
 *
 * FOUR THINGS THIS FILE IS RESPONSIBLE FOR:
 *
 *   1. Reading the four sources IN PARALLEL, each one unable to break the others.
 *   2. Choosing which source gives the honest headline for money — see
 *      `chooseMoneyIn`, which is the most important decision in this directory.
 *   3. Deciding what counts as a problem worth putting at the top of the page.
 *   4. Refusing to write the file at all if a key appears in it.
 *
 * OPTIONS
 *   --no-open        do not open the file in a browser afterwards
 *   --out <path>     write somewhere other than the default
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import { loadEnv, secretValues, stripeMode } from './env.mjs';
import { collect } from './http.mjs';
import { readStripe } from './stripe.mjs';
import { readGateway } from './gateway.mjs';
import { readDatabase } from './database.mjs';
import { readPostHog } from './posthog.mjs';
import { renderPage } from './html.mjs';
import { scan, report } from './leak-check.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);

const outIndex = args.indexOf('--out');
const OUT = outIndex !== -1 && args[outIndex + 1] ? path.resolve(args[outIndex + 1]) : path.join(HERE, 'dashboard.html');
const OPEN = !args.includes('--no-open');

const env = loadEnv();
const mode = stripeMode(env.STRIPE_SECRET_KEY);

console.log('\nun-claude — operator dashboard');
console.log('─'.repeat(66));
console.log('Reading four sources. Any that fail will degrade one panel only.\n');

/*
 * All four at once. `collect` guarantees each returns a value rather than
 * throwing, and `Promise.all` over guarded promises therefore cannot reject —
 * which is the mechanism behind "one dead source must never take the page".
 */
const [stripe, gateway, database, posthog] = await Promise.all([
  collect('Stripe', () => readStripe(env, mode)),
  collect('The AI gateway', () => readGateway(env)),
  collect('The database', () => readDatabase(env)),
  collect('PostHog', () => readPostHog(env)),
]);

const state = (r) => (r.ok ? 'ok' : 'DEGRADED');

console.log(`  Stripe        ${state(stripe)}${stripe.ok ? `  (${mode} mode)` : `  ${stripe.reason}`}`);
console.log(`  AI gateway    ${state(gateway)}${gateway.ok ? `  (${gateway.serving.state})` : `  ${gateway.reason}`}`);
console.log(`  Database      ${state(database)}${database.ok ? `  (${database.runs.total} jobs)` : `  ${database.reason}`}`);
console.log(`  PostHog       ${state(posthog)}${posthog.ok ? '' : `  ${posthog.reason}`}`);

/**
 * ★ WHICH SOURCE TELLS THE TRUTH ABOUT MONEY.
 *
 * Stripe is the authority on money — but only when the key is a LIVE one. The
 * key on this machine is a TEST key, which can see nothing but Stripe's sandbox.
 * Asked about a real payment, it answers "a similar object exists in live mode,
 * but a test mode key was used to make this request".
 *
 * The database's `purchase` rows, however, were written by the LIVE payment
 * webhook running on the deployed site. They are real money regardless of which
 * key this dashboard happens to be holding.
 *
 * So the headline follows the live source: Stripe when it is live, the database
 * otherwise. It always says which one it used, because a money figure whose
 * origin is unclear is worse than no figure.
 */
function chooseMoneyIn() {
  if (stripe.ok && mode === 'live') {
    return { cents: stripe.money.netAll, from: 'Stripe, live', today: stripe.money.netToday, real: true };
  }

  if (database.ok) {
    return {
      cents: database.money.netCents,
      from: mode === 'test' ? 'the database — Stripe is in practice mode' : 'the database',
      today: database.money.todayCents,
      real: true,
    };
  }

  // Last resort: the only source left is a test-mode Stripe key, so this figure
  // is imaginary. It is still shown, because a blank tells Jon nothing — but it
  // is marked as not real and coloured as a warning rather than as good news.
  if (stripe.ok) {
    return {
      cents: stripe.money.netAll,
      from: `Stripe, ${mode} mode — NOT real money`,
      today: stripe.money.netToday,
      real: false,
    };
  }

  return { cents: null, from: null, today: null, real: false };
}

const moneyIn = chooseMoneyIn();

// ---------------------------------------------------------------------------
// What is wrong, in the order it should be worried about
// ---------------------------------------------------------------------------
const alerts = [];

/*
 * ALERTS ARE HEADLINES, NOT EXPLANATIONS.
 *
 * Each one is a short sentence and a short clause. The full story lives in the
 * panel it points at. Written long, four alerts filled an entire phone screen
 * and pushed the five numbers — the actual point of the page — below the fold,
 * which is the opposite of "visible at a glance".
 */
if (gateway.ok && gateway.serving.state === 'refused') {
  alerts.push({
    level: 'critical',
    title: 'The paid rewrite is DOWN.',
    detail: 'The AI gateway is refusing work. Check the spending limit on the key in the Vercel dashboard.',
  });
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

// Only worth saying when the Payments panel actually rendered something. If
// Stripe could not be read at all, "it is showing practice money" is false —
// it is showing nothing, and the failure alert below covers it.
if (mode === 'test' && stripe.ok) {
  alerts.push({
    level: 'warning',
    title: 'Payments is showing practice money.',
    detail: 'Real sales are under “Money taken”, further down. See the session note to switch this panel to live.',
  });
}

for (const [name, result] of [
  ['Stripe', stripe],
  ['The AI gateway', gateway],
  ['The database', database],
]) {
  if (!result.ok) {
    alerts.push({ level: 'critical', title: `${name} could not be read.`, detail: result.reason });
  }
}

if (!posthog.ok) {
  alerts.push({
    level: 'info',
    title: posthog.configured ? 'The behaviour numbers are missing.' : 'The behaviour panel is not set up yet.',
    detail: 'Everything else on this page works without it. The panel itself says how to switch it on.',
  });
}

// ---------------------------------------------------------------------------
// The five numbers that go at the top
// ---------------------------------------------------------------------------
const dollars = (cents) => (cents === null ? '—' : `$${(cents / 100).toFixed(2)}`);

const servingWord = !gateway.ok
  ? 'Unknown'
  : gateway.serving.state === 'serving'
    ? 'Working'
    : gateway.serving.state === 'refused'
      ? 'REFUSED'
      : 'Unclear';

const headline = [
  {
    label: 'Money in',
    value: dollars(moneyIn.cents),
    sub: moneyIn.from ? `all time, after refunds · from ${moneyIn.from}` : 'no source could be read',
    // Green only when the figure is real money. A fake number in the colour of
    // good news is worse than no number at all.
    tone: !moneyIn.real ? 'warn' : moneyIn.cents ? 'good' : 'plain',
  },
  {
    label: 'Money out',
    value: gateway.ok && gateway.totalUsed !== null ? `$${gateway.totalUsed.toFixed(2)}` : '—',
    sub: 'spent on AI, all time · the limit is not visible here',
    tone: 'plain',
  },
  {
    label: 'AI service',
    value: servingWord,
    sub: gateway.ok && gateway.serving.state === 'serving' ? 'checked just now, with a real request' : 'the paid rewrite depends on this',
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

// ---------------------------------------------------------------------------
// Build, check, and only then write
// ---------------------------------------------------------------------------
const generatedAt = new Date().toISOString();
const html = renderPage({ generatedAt, alerts, headline, stripe, gateway, database, posthog });

const secrets = secretValues(env);
const result = scan(html, secrets);

console.log('\nSecret check on the generated page');
console.log('─'.repeat(66));
console.log(report(result));

if (!result.clean) {
  console.error('\n★ REFUSING TO WRITE THE FILE. A credential appeared in the output.');
  console.error('  Nothing has been written to disk. Fix the leak above and run again.\n');
  process.exit(1);
}

console.log('  RESULT                        : CLEAN — no key or token is in the file');

fs.writeFileSync(OUT, html, 'utf8');

console.log('\nWritten');
console.log('─'.repeat(66));
console.log(`  ${OUT}`);
console.log(`  ${(html.length / 1024).toFixed(1)} KB, self-contained, nothing loaded from the internet`);

if (alerts.some((a) => a.level === 'critical')) {
  console.log('\n★ There is at least one CRITICAL problem. It is at the top of the page.');
}

if (OPEN) {
  execFile('open', [OUT], (error) => {
    if (error) console.log(`\n  Could not open it automatically. Open this file yourself:\n  ${OUT}`);
  });
} else {
  console.log(`\n  Open it with:  open ${path.relative(process.cwd(), OUT)}`);
}

console.log('');
