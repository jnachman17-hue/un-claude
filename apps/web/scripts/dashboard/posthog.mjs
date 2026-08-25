/**
 * BEHAVIOUR: WHERE PEOPLE GO AND WHERE THEY STOP.
 *
 * ★ THIS PANEL IS THE SHAPE, NOT THE TRUTH. Stripe and the database are the
 * truth. Two facts about how this product is built make PostHog's numbers
 * structurally softer, and both are deliberate decisions rather than bugs, so
 * neither will ever be "fixed":
 *
 *   1. NOBODY IS COUNTED TWICE THE SAME WAY. PostHog is configured with
 *      `persistence: 'memory'` (`04` entry 68), which the live cookie policy
 *      promises. The visitor's id lives in memory and dies with the page, so a
 *      person who comes back tomorrow is a new person, and a visitor who leaves
 *      for stripe.com and returns is a new person. Visitor counts are therefore
 *      INFLATED against real humans.
 *   2. THE FUNNEL IS CUT IN HALF AT CHECKOUT. `checkout_started` fires on this
 *      site; `purchase_completed` fires after the browser has been to Stripe and
 *      come back through a fresh page load. The id that fired the first is gone
 *      before the second happens. They are two trustworthy COUNTS that DO NOT
 *      JOIN. A conversion rate computed across that boundary is fiction.
 *
 * Both are printed next to the funnel on the page, in plain English, because a
 * caveat that lives only in this comment protects nobody.
 *
 * INTERNAL TRAFFIC. The brief requires that Jon's own visits are excluded and
 * that the page says so. PostHog's own "internal user" filter is a setting
 * applied inside PostHog's UI and is NOT applied to queries made through the
 * API, so it would have no effect here. What this file does instead:
 *
 *   - counts only events whose `$host` is the real site, which removes local
 *     development and every Vercel preview URL;
 *   - optionally removes named IP addresses, via `POSTHOG_EXCLUDE_IPS`.
 *
 * That is the honest equivalent and it is stated exactly on the page, including
 * the part it cannot do: without setting that variable, Jon's own visits to the
 * live site are still counted.
 */
import { request } from './http.mjs';

/**
 * The API host, worked out from the ingestion host the site already uses.
 * Events go to `us.i.posthog.com`; the query API lives on `us.posthog.com`.
 */
function apiHost(env) {
  const ingest = env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com';

  return ingest.replace('//us.i.', '//us.').replace('//eu.i.', '//eu.').replace(/\/$/, '');
}

/** The site whose traffic counts. Everything else is development or a preview. */
function siteHost(env) {
  return env.UC_SITE_HOST || 'un-claude.com';
}

/**
 * The events that make up the journey, in order, with the plain-English name
 * shown on the page. Taken from `apps/web/lib/analytics/events.ts`.
 */
const FUNNEL = [
  { event: '$pageview', label: 'Visited the site' },
  { event: 'own_text_entered', label: 'Pasted their own text', note: 'or uploaded a file' },
  { event: 'file_uploaded', label: 'Uploaded a file', merge: 'own_text_entered' },
  { event: 'scan_completed', label: 'Got a scan result' },
  { event: 'paywall_shown', label: 'Hit the paywall' },
  { event: 'checkout_started', label: 'Pressed a pack button' },
  { event: 'purchase_completed', label: 'Came back having paid', broken: true },
];

/** Counted separately: these are the things going wrong. */
const FAILURES = ['scan_failed', 'sanitise_failed', 'checkout_failed'];

async function hogql(env, projectId, query) {
  const url = `${apiHost(env)}/api/projects/${projectId}/query/`;

  const response = await request(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.POSTHOG_PERSONAL_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: { kind: 'HogQLQuery', query } }),
  });

  if (!response.ok) {
    const detail = response.error || response.body?.detail || response.body?.error?.message || `HTTP ${response.status}`;

    throw new Error(String(detail).slice(0, 200));
  }

  return response.body?.results || [];
}

/**
 * The WHERE clause every query shares: real site only, last 30 days, minus any
 * excluded IPs. Written once so no query can quietly forget it.
 */
function scope(env) {
  const host = siteHost(env).replace(/'/g, '');
  const ips = (env.POSTHOG_EXCLUDE_IPS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  let clause = `timestamp > now() - INTERVAL 30 DAY AND (properties.$host = '${host}' OR properties.$host = 'www.${host}')`;

  if (ips.length) {
    const list = ips.map((ip) => `'${ip.replace(/'/g, '')}'`).join(', ');

    clause += ` AND (properties.$ip IS NULL OR properties.$ip NOT IN (${list}))`;
  }

  return clause;
}

/** Find the project id, so Jon only has to create one key and paste nothing else. */
async function findProject(env) {
  if (env.POSTHOG_PROJECT_ID) return { id: env.POSTHOG_PROJECT_ID, discovered: false };

  const response = await request(`${apiHost(env)}/api/projects/`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${env.POSTHOG_PERSONAL_API_KEY}` },
  });

  if (!response.ok) {
    throw new Error(
      `could not list projects (HTTP ${response.status}). Either add the "Project" read scope to the key, or set POSTHOG_PROJECT_ID`,
    );
  }

  const first = response.body?.results?.[0];

  if (!first) throw new Error('the key is valid but can see no projects');

  return { id: first.id, discovered: true, name: first.name };
}

export async function readPostHog(env) {
  if (!env.POSTHOG_PERSONAL_API_KEY) {
    return {
      ok: false,
      configured: false,
      reason: 'No PostHog key has been created yet, so there are no behaviour numbers.',
      fix: 'In PostHog: Settings → Personal API keys → Create key. Give it read access to Query and Project. Then run the dashboard with POSTHOG_PERSONAL_API_KEY set. The session note has the exact line.',
    };
  }

  let project;

  try {
    project = await findProject(env);
  } catch (error) {
    return {
      ok: false,
      configured: true,
      reason: `PostHog answered, but ${error.message}.`,
      fix: 'Add the "Project" read scope to the key in PostHog, or set POSTHOG_PROJECT_ID to the number in your PostHog URL.',
    };
  }

  const where = scope(env);

  try {
    // One query per question. Kept separate so a single failing query cannot
    // take the whole panel with it, and so each is readable on its own.
    const steps = await hogql(
      env,
      project.id,
      `SELECT event, count() AS total, count(DISTINCT distinct_id) AS people
       FROM events WHERE ${where} GROUP BY event ORDER BY total DESC`,
    );

    const pages = await hogql(
      env,
      project.id,
      `SELECT properties.$pathname AS path, count() AS views
       FROM events WHERE ${where} AND event = '$pageview'
       GROUP BY path ORDER BY views DESC LIMIT 12`,
    );

    const checkoutFailures = await hogql(
      env,
      project.id,
      `SELECT properties.reason AS reason, count() AS total
       FROM events WHERE ${where} AND event = 'checkout_failed'
       GROUP BY reason ORDER BY total DESC LIMIT 10`,
    );

    const counts = new Map(steps.map(([event, total, people]) => [event, { total, people }]));

    const funnel = FUNNEL.filter((s) => !s.merge).map((step) => {
      const own = counts.get(step.event) || { total: 0, people: 0 };
      const merged = FUNNEL.filter((s) => s.merge === step.event).reduce(
        (extra, s) => extra + (counts.get(s.event)?.total || 0),
        0,
      );

      return {
        label: step.label,
        note: step.note,
        event: step.event,
        total: own.total + merged,
        people: own.people,
        broken: Boolean(step.broken),
      };
    });

    return {
      ok: true,
      configured: true,
      projectId: String(project.id),
      projectName: project.name,
      discovered: project.discovered,
      host: siteHost(env),
      excludedIps: (env.POSTHOG_EXCLUDE_IPS || '').split(',').map((s) => s.trim()).filter(Boolean).length,
      windowDays: 30,
      funnel,
      pages: pages.map(([path, views]) => ({ path: path || '(none)', views })),
      failures: FAILURES.map((event) => ({ event, total: counts.get(event)?.total || 0 })),
      checkoutFailures: checkoutFailures.map(([reason, total]) => ({ reason: reason || 'not recorded', total })),
      allEvents: steps.map(([event, total, people]) => ({ event, total, people })),
    };
  } catch (error) {
    return {
      ok: false,
      configured: true,
      reason: `PostHog refused the query: ${error.message}`,
      fix: 'Check the key has read access to Query. If it was just created, give it a minute.',
    };
  }
}
