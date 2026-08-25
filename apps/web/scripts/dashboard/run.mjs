/**
 * THE ONE-OFF FILE. Writes a snapshot you can keep or send yourself.
 *
 *     cd apps/web && node scripts/dashboard/run.mjs
 *
 * ★ FOR EVERYDAY USE, RUN `serve.mjs` INSTEAD. That gives a live page which
 * re-reads everything each time you refresh. This file exists for the cases a
 * server cannot cover: keeping a record of a particular moment, or looking at
 * the numbers somewhere the dashboard is not running.
 *
 * WHAT IT WILL NOT DO. Write the file if a credential appears in it — the check
 * runs before anything reaches disk, and a failure means no file at all.
 *
 * ★ THE PAGE CONTAINS CUSTOMER EMAIL ADDRESSES. The folder is git-ignored, and
 * the file should be treated like an export from Stripe. Nothing in this
 * terminal ever prints one: what is reported here is counts.
 *
 * OPTIONS
 *   --no-open        do not open the file in a browser afterwards
 *   --out <path>     write somewhere other than the default
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import { loadEnv, secretValues, stripeMode, stripeKey } from './env.mjs';
import { collect } from './http.mjs';
import { readStripe } from './stripe.mjs';
import { readGateway } from './gateway.mjs';
import { readDatabase } from './database.mjs';
import { readPostHog } from './posthog.mjs';
import { renderPage } from './html.mjs';
import { buildView } from './view.mjs';
import { scan, report } from './leak-check.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);

const outIndex = args.indexOf('--out');
const OUT = outIndex !== -1 && args[outIndex + 1] ? path.resolve(args[outIndex + 1]) : path.join(HERE, 'dashboard.html');
const OPEN = !args.includes('--no-open');

const env = loadEnv();
const { key, source } = stripeKey(env);
const mode = stripeMode(key);

console.log('\nun-claude — operator dashboard (one-off file)');
console.log('─'.repeat(66));
console.log('Reading four sources. Any that fail will degrade one panel only.\n');

const [stripe, gateway, database, posthog] = await Promise.all([
  collect('Stripe', () => readStripe(env, mode, key)),
  collect('The AI gateway', () => readGateway(env)),
  collect('The database', () => readDatabase(env)),
  collect('PostHog', () => readPostHog(env)),
]);

const state = (r) => (r.ok ? 'ok' : 'DEGRADED');

console.log(`  Stripe        ${state(stripe)}${stripe.ok ? `  (live, via ${source})` : `  ${stripe.reason}`}`);
console.log(`  AI gateway    ${state(gateway)}${gateway.ok ? `  (${gateway.serving.state} · ${gateway.serving.model})` : `  ${gateway.reason}`}`);
// Counts only. Never an email address: see the header.
console.log(
  `  Database      ${state(database)}` +
    (database.ok ? `  (${database.runs.total} jobs, ${database.accounts.withEmail} people)` : `  ${database.reason}`),
);
console.log(`  PostHog       ${state(posthog)}${posthog.ok ? '' : `  ${posthog.reason}`}`);

const view = buildView({ env, mode, keySource: source, stripe, gateway, database, posthog });
const html = renderPage({ ...view, live: false });

const result = scan(html, secretValues(env));

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

if (database.ok && database.accounts.withEmail > 0) {
  console.log(`  ★ contains ${database.accounts.withEmail} customer email addresses — treat it like a Stripe export`);
}

if (view.alerts.some((a) => a.level === 'critical')) {
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
