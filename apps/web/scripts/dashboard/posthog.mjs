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
  { event: 'scan_completed', label: 'Scanned their own document', note: 'the built-in example is counted separately' },
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
    // HogQL runs a real query over the event store. Fifteen seconds was not
    // enough once four of them were being asked, and the panel reported PostHog
    // as broken when it was merely working.
    timeout: 30_000,
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
/**
 * ★ WHAT COUNTS AS A REAL VISITOR, AND WHAT IS US.
 *
 * Measured 25 August 2026, over thirty days on un-claude.com:
 *
 *     everything                       494 pageviews   420 visitors
 *     from Jon's city                  324 pageviews   284 visitors   (66%)
 *     from the Claude desktop app      ...  192 events, inside that set
 *     REAL OUTSIDE TRAFFIC             170 pageviews   137 visitors
 *
 * Two thirds of the traffic was Jon's own machine and the coding agents running
 * on it. Presented as one number it made the site look four times more visited
 * than it is, and it is exactly why the funnel looked strange.
 *
 * THREE FILTERS, and each is stated on the page rather than applied quietly:
 *
 *   1. HOST. Only `un-claude.com`. Removes local development and every Vercel
 *      preview URL.
 *   2. AUTOMATION. Any user agent carrying `Claude/`, `Electron/`, `Headless`,
 *      `bot`, `spider` or `crawl`. The Claude desktop app identifies itself as
 *      `Claude/1.34493.1 ... Electron/42.9.2`, so agent visits are removable
 *      exactly rather than guessed at.
 *   3. PLACE. Cities named in `POSTHOG_EXCLUDE_CITIES`, plus any IPs in
 *      `POSTHOG_EXCLUDE_IPS`. A city is the more useful of the two: a home IP
 *      changes, a home town does not, and PostHog resolves the city itself.
 *
 * THE COST, NAMED: excluding a city excludes real customers who live there. Jon
 * is in Hermosa Beach; a genuine buyer from Hermosa Beach would be invisible in
 * the behaviour panel. That is the right trade while he is the majority of his
 * own traffic, and it is the wrong trade later — the page prints what was
 * excluded so the moment to revisit is obvious.
 */
function scope(env, { includeInternal = false } = {}) {
  const host = siteHost(env).replace(/'/g, '');
  const list = (name) =>
    (env[name] || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

  let clause = `timestamp > now() - INTERVAL 30 DAY AND (properties.$host = '${host}' OR properties.$host = 'www.${host}')`;

  if (includeInternal) return clause;

  clause += ` AND NOT (${AUTOMATION})`;

  const cities = list('POSTHOG_EXCLUDE_CITIES');

  if (cities.length) {
    const names = cities.map((c) => `'${c.replace(/'/g, '')}'`).join(', ');

    clause += ` AND (properties.$geoip_city_name IS NULL OR properties.$geoip_city_name NOT IN (${names}))`;
  }

  const ips = list('POSTHOG_EXCLUDE_IPS');

  if (ips.length) {
    const addresses = ips.map((ip) => `'${ip.replace(/'/g, '')}'`).join(', ');

    clause += ` AND (properties.$ip IS NULL OR properties.$ip NOT IN (${addresses}))`;
  }

  return clause;
}

/** Anything that is a program rather than a person. */
const AUTOMATION = `properties.$raw_user_agent LIKE '%Claude/%'
  OR properties.$raw_user_agent LIKE '%Electron/%'
  OR properties.$raw_user_agent LIKE '%Headless%'
  OR properties.$raw_user_agent LIKE '%bot%'
  OR properties.$raw_user_agent LIKE '%spider%'
  OR properties.$raw_user_agent LIKE '%crawl%'`;

/**
 * Find the project, so Jon only has to create a key and paste nothing else.
 *
 * ★ IT ASKS FOR `@current` AND NOT FOR A LIST, and that distinction is the whole
 * of a bug found on 25 August 2026.
 *
 * A personal API key can be SCOPED TO ONE PROJECT, which is the safer thing to
 * do and what Jon did. Such a key cannot list projects at all — `/api/projects/`
 * answers:
 *
 *     403 "API keys with scoped projects are only supported on project-based
 *          endpoints."
 *
 * That is a permission error, so the obvious reading is "the key needs another
 * scope", and adding scopes would never have fixed it. The key was correct; the
 * question was wrong. `/api/projects/@current/` IS a project-based endpoint, so
 * it answers for a scoped key, and it also answers for an unscoped one — which
 * makes it strictly better than the listing for both.
 */
async function findProject(env) {
  if (env.POSTHOG_PROJECT_ID) return { id: env.POSTHOG_PROJECT_ID, discovered: false };

  const headers = { Authorization: `Bearer ${env.POSTHOG_PERSONAL_API_KEY}` };
  const current = await request(`${apiHost(env)}/api/projects/@current/`, { method: 'GET', headers });

  if (current.ok && current.body?.id) {
    return { id: current.body.id, discovered: true, name: current.body.name };
  }

  // A key with no project scoping at all may still prefer the listing. Kept as
  // a fallback so both kinds of key work without Jon having to know which he made.
  const list = await request(`${apiHost(env)}/api/projects/`, { method: 'GET', headers });
  const first = list.ok ? list.body?.results?.[0] : null;

  if (first) return { id: first.id, discovered: true, name: first.name };

  const detail = current.body?.detail || list.body?.detail || `HTTP ${current.status}`;

  throw new Error(
    `the project could not be identified (${String(detail).slice(0, 120)}). Set POSTHOG_PROJECT_ID to the number in your PostHog URL`,
  );
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
  const whereAll = scope(env, { includeInternal: true });

  try {
    /*
     * All four questions at once. Asked one after another they took long enough
     * that the whole panel timed out and reported PostHog as broken; asked
     * together the panel costs about as long as its slowest single query.
     * They are still separate queries so each stays readable on its own.
     */
    const [steps, pages, checkoutFailures, scans, totals, paidMoment, sources] = await Promise.all([
      hogql(
        env,
        project.id,
        `SELECT event, count() AS total, count(DISTINCT distinct_id) AS people
         FROM events WHERE ${where} GROUP BY event ORDER BY total DESC`,
      ),
      hogql(
        env,
        project.id,
        `SELECT properties.$pathname AS path, count() AS views
         FROM events WHERE ${where} AND event = '$pageview'
         GROUP BY path ORDER BY views DESC LIMIT 12`,
      ),
      hogql(
        env,
        project.id,
        `SELECT properties.reason AS reason, count() AS total
         FROM events WHERE ${where} AND event = 'checkout_failed'
         GROUP BY reason ORDER BY total DESC LIMIT 10`,
      ),
      /*
       * ★ SCANS ARE SPLIT BY WHETHER THEY WERE THE DEMO, AND THE FUNNEL BREAKS
       * WITHOUT THIS. The workbench loads with example text and scans it
       * automatically, so `scan_completed` fires for practically every visitor
       * whether or not they did anything. Counted whole it read: 487 visited,
       * 14 pasted their own text, 119 got a scan result — a funnel that grows in
       * the middle, which looks like a broken chart and is really the demo being
       * counted as a customer action. `is_sample` already tells them apart.
       */
      hogql(
        env,
        project.id,
        `SELECT properties.is_sample AS sample, count() AS total, count(DISTINCT distinct_id) AS people
         FROM events WHERE ${where} AND event = 'scan_completed'
         GROUP BY sample`,
      ),
      /*
       * How much was filtered out. Reported on the page so the exclusion is a
       * visible decision rather than a silent one — and so Jon can see at a
       * glance when his own traffic stops being the majority of it.
       */
      hogql(
        env,
        project.id,
        `SELECT countIf(event = '$pageview'), count(DISTINCT distinct_id) FROM events WHERE ${whereAll}`,
      ),
      /*
       * ★ "HIT A PAID MOMENT" HAS TO BE ONE DEDUPED NUMBER, NOT A SUM.
       *
       * A visitor can meet the limit two ways: the paywall, when a job costs
       * more than they hold, and the empty-balance panel, when they reach
       * nought. Plenty of people see both, so adding the two event counts
       * double-counts exactly the people who matter most. `count(DISTINCT
       * distinct_id)` over both events at once is the only honest version and
       * it cannot be derived from the per-event counts above.
       */
      hogql(
        env,
        project.id,
        `SELECT count(DISTINCT distinct_id) FROM events
         WHERE ${where} AND event IN ('paywall_shown', 'out_of_credits_shown')`,
      ),
      /*
       * WHERE THE TRAFFIC COMES FROM. Added 30 September 2026 after Jon asked
       * and the answer took a one-off script to get. It belongs on the page.
       *
       * THE THREE ROUND TRIPS ARE EXCLUDED BY NAME. `accounts.google.com` is
       * somebody coming back from Google sign-in, `checkout.stripe.com` is
       * somebody coming back from paying, and the site's own domain is
       * ordinary navigation. All three are the visitor returning, not arriving,
       * and counted as sources they crowd out the real ones.
       */
      hogql(
        env,
        project.id,
        `SELECT multiIf(properties.$referring_domain IS NULL, 'typed in or no referrer',
                        properties.$referring_domain = '', 'typed in or no referrer',
                        properties.$referring_domain = '$direct', 'typed in or no referrer',
                        properties.$referring_domain) AS src,
                count(DISTINCT distinct_id) AS people
         FROM events
         WHERE ${where} AND event = '$pageview'
           AND coalesce(properties.$referring_domain, '') NOT IN
               ('accounts.google.com', 'checkout.stripe.com', 'un-claude.com', 'www.un-claude.com')
         GROUP BY src ORDER BY people DESC LIMIT 10`,
      ),
    ]);

    const [[allPageviews, allVisitors] = [0, 0]] = totals;
    const sampleRow = scans.find(([x]) => x === true || x === 'true');
    const ownRow = scans.find(([x]) => x === false || x === 'false');
    const scanSplit = {
      own: { total: ownRow?.[1] || 0, people: ownRow?.[2] || 0 },
      sample: { total: sampleRow?.[1] || 0, people: sampleRow?.[2] || 0 },
    };

    const counts = new Map(steps.map(([event, total, people]) => [event, { total, people }]));

    const funnel = FUNNEL.filter((s) => !s.merge).map((step) => {
      const own = counts.get(step.event) || { total: 0, people: 0 };
      const merged = FUNNEL.filter((s) => s.merge === step.event).reduce(
        (extra, s) => extra + (counts.get(s.event)?.total || 0),
        0,
      );

      // The scan step counts scans of the visitor's OWN text. See scanSplit above.
      const isScan = step.event === 'scan_completed';

      return {
        label: step.label,
        note: step.note,
        event: step.event,
        total: isScan ? scanSplit.own.total : own.total + merged,
        people: isScan ? scanSplit.own.people : own.people,
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
      scanSplit,
      /** Deduped: one person who saw both the wall and the empty panel counts once. */
      paidMomentPeople: paidMoment?.[0]?.[0] || 0,
      /** Arrivals only. Sign-in, checkout and internal returns are filtered out above. */
      sources: (sources || []).map(([src, people]) => ({ src: src || '(direct)', people })),
      traffic: {
        realPageviews: counts.get('$pageview')?.total || 0,
        realVisitors: counts.get('$pageview')?.people || 0,
        allPageviews,
        allVisitors,
        internalPageviews: Math.max(0, allPageviews - (counts.get('$pageview')?.total || 0)),
      },
      excludedCities: (env.POSTHOG_EXCLUDE_CITIES || '').split(',').map((s) => s.trim()).filter(Boolean),
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
