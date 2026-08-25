/**
 * WHERE THE KEYS COME FROM, AND THE ONE RULE ABOUT THEM.
 *
 * Four sources need four credentials. This module is the only place that reads
 * them, so there is exactly one file to audit for the failure this whole job is
 * afraid of: a live Stripe key or a service-role database key ending up in an
 * HTML file that gets opened, mailed, or dropped in a folder that syncs.
 *
 * THE RULE: a value read here is used and never printed. Nothing in this
 * directory calls `console.log` on a credential, and `secretValues()` exists so
 * that `leak-check.mjs` can scan the finished HTML for these exact strings and
 * refuse to write the file if any of them survived. That check is mechanical
 * rather than careful, because careful is what fails at 1am.
 *
 * THE REAL ENVIRONMENT WINS OVER THE FILES, and that is deliberate. It lets a
 * key be supplied for a single command without ever being written to disk:
 *
 *     UC_DASHBOARD_STRIPE_KEY='sk_live_...' node scripts/dashboard/serve.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));

/**
 * Read in this order, later file wins. These are the same files the existing
 * scripts read (`read-ledger.mjs`, `read-stripe-receipt.mjs`), plus the engine's
 * own env file at the repository root, which is where the gateway key lives.
 */
const FILES = [
  path.resolve(HERE, '../../.env'), // apps/web/.env
  path.resolve(HERE, '../../.env.local'), // apps/web/.env.local
  path.resolve(HERE, '../../../../.env.engine.local'), // repo root
];

/**
 * Every name this dashboard will look for. Listed explicitly rather than copying
 * the whole environment, so a variable belonging to something else cannot be
 * pulled into a process that writes an HTML file.
 */
const NAMES = [
  /*
   * ★ THE DASHBOARD'S OWN STRIPE KEY, AND WHY IT HAS A SEPARATE NAME.
   *
   * `STRIPE_SECRET_KEY` in `apps/web/.env.local` is the key the WEBSITE uses
   * when it runs on this laptop, and it is deliberately a TEST key so that
   * local development cannot charge a real card. Putting a live key in that
   * variable to satisfy the dashboard would silently arm the local dev site
   * with real money — an actual card charge from a page being poked at during
   * development.
   *
   * So the dashboard reads its own name first. Setting `UC_DASHBOARD_STRIPE_KEY`
   * to the live key affects this dashboard and nothing else.
   */
  'UC_DASHBOARD_STRIPE_KEY',
  'STRIPE_SECRET_KEY',
  // The database: usage and the credit ledger.
  'NEXT_PUBLIC_SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  // The AI Gateway: the money going out.
  'AI_GATEWAY_API_KEY',
  // What the gateway cannot tell us and Jon must state: the cap on the key.
  'AI_GATEWAY_MONTHLY_LIMIT',
  // The model used for the liveness probe. Production is deepseek.
  'AI_GATEWAY_PROBE_MODEL',
  // PostHog: behaviour.
  'POSTHOG_PERSONAL_API_KEY',
  'POSTHOG_PROJECT_ID',
  'NEXT_PUBLIC_POSTHOG_HOST',
  // Optional tuning, all documented in the session note.
  'POSTHOG_EXCLUDE_IPS',
  // Where Jon works from. Traffic from these cities is counted as internal.
  'POSTHOG_EXCLUDE_CITIES',
  // The accounts that are Jon's own tests rather than customers.
  'UC_INTERNAL_EMAILS',
  'UC_SITE_HOST',
  'UC_DASHBOARD_PORT',
];

/** The secret ones. Only these are scanned for in the output. */
const SECRET_NAMES = [
  'UC_DASHBOARD_STRIPE_KEY',
  'STRIPE_SECRET_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'AI_GATEWAY_API_KEY',
  'POSTHOG_PERSONAL_API_KEY',
];

/**
 * The Stripe key the dashboard should use, and where it came from.
 *
 * Prefers the dashboard's own variable. Falls back to the website's key only so
 * that the panel can explain itself rather than appear broken — if that fallback
 * is a test key, the Payments panel refuses to show figures at all rather than
 * presenting sandbox money as though it were real.
 */
export function stripeKey(env) {
  if (env.UC_DASHBOARD_STRIPE_KEY) {
    return { key: env.UC_DASHBOARD_STRIPE_KEY, source: 'UC_DASHBOARD_STRIPE_KEY' };
  }

  if (env.STRIPE_SECRET_KEY) {
    return { key: env.STRIPE_SECRET_KEY, source: 'STRIPE_SECRET_KEY' };
  }

  return { key: null, source: null };
}

function readEnvFile(file) {
  const found = {};

  if (!fs.existsSync(file)) return found;

  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*)$/.exec(line);

    if (match) found[match[1]] = match[2].replace(/^["']|["']$/g, '').trim();
  }

  return found;
}

export function loadEnv() {
  const fromFiles = {};

  for (const file of FILES) Object.assign(fromFiles, readEnvFile(file));

  const env = {};

  for (const name of NAMES) {
    // The real environment first, the files second. See the header.
    const value = process.env[name] || fromFiles[name];

    if (value) env[name] = value;
  }

  return env;
}

/**
 * The secret strings, for the leak check and for nothing else.
 *
 * Short values are dropped: a two-character "secret" would match half the
 * document and turn the check into a permanent false alarm.
 */
export function secretValues(env) {
  return SECRET_NAMES.map((name) => env[name]).filter((value) => typeof value === 'string' && value.length >= 8);
}

/**
 * Which Stripe world a key belongs to, decided by its prefix rather than by
 * asking Stripe, so the answer is known before any call is made.
 *
 * `sk_live_` and `rk_live_` are real money. `sk_test_` and `rk_test_` are the
 * sandbox, where every payment is imaginary. Jon must never have to wonder which
 * one he is looking at, so this drives a banner rather than a footnote.
 */
export function stripeMode(key) {
  if (!key) return 'missing';
  if (key.startsWith('sk_live_') || key.startsWith('rk_live_')) return 'live';
  if (key.startsWith('sk_test_') || key.startsWith('rk_test_')) return 'test';

  return 'unknown';
}
