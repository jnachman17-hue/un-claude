/**
 * THE LIVE DASHBOARD. Start it once, leave it open, refresh whenever.
 *
 *     cd apps/web && node scripts/dashboard/serve.mjs
 *
 * Every page load re-reads all four sources, so the numbers are as fresh as the
 * moment you pressed refresh. Stop it with Ctrl-C.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * WHY THIS IS SAFE, WHEN A HOSTED DASHBOARD WOULD NOT BE.
 *
 * The original brief called for a file rather than a page, for a good reason:
 * this process holds the live Stripe key, the database master key and the
 * gateway key, and those must never reach anybody else's browser. That reasoning
 * rules out HOSTING it. It does not rule out a server that only this machine can
 * reach, which is what this is. Jon's instruction, 25 August 2026: a snapshot he
 * cannot refresh is useless.
 *
 * FOUR THINGS KEEP IT LOCAL, and the last two matter more than they look:
 *
 *   1. IT BINDS TO 127.0.0.1 ONLY. Not `0.0.0.0`. Nothing on the coffee-shop
 *      wifi can reach it, because the socket is not listening on the network.
 *   2. NO KEY IS EVER SENT TO THE BROWSER. The page is numbers and text. The
 *      same leak check that guarded the file guards every response, and a
 *      response that fails it is replaced by an error page rather than sent.
 *   3. THE URL CARRIES A SECRET TOKEN, regenerated each start. Any other page
 *      open in the browser can make requests to `localhost` — that is normal web
 *      behaviour and not a bug — so without a token, any website could quietly
 *      read this business's revenue and customer list. Requests without it get a
 *      flat 404.
 *   4. THE `Host` HEADER IS CHECKED. A hostile site can point a domain it owns
 *      at 127.0.0.1 (this is called DNS rebinding) and then read the response,
 *      because to the browser it is same-origin. Requiring the Host to be
 *      literally localhost defeats it.
 *
 * ★ THE PAGE CONTAINS CUSTOMER EMAIL ADDRESSES. Treat the browser tab the way
 * you would treat the Stripe dashboard.
 */
import http from 'node:http';
import crypto from 'node:crypto';
import { execFile } from 'node:child_process';

import { loadEnv, secretValues, stripeMode, stripeKey } from './env.mjs';
import { collect } from './http.mjs';
import { readStripe } from './stripe.mjs';
import { readGateway } from './gateway.mjs';
import { readDatabase } from './database.mjs';
import { readPostHog } from './posthog.mjs';
import { renderPage } from './html.mjs';
import { scan } from './leak-check.mjs';
import { buildView } from './view.mjs';

const args = process.argv.slice(2);
const OPEN = !args.includes('--no-open');

/*
 * ★ THE ENVIRONMENT IS RE-READ ON EVERY REQUEST, NOT ONCE AT STARTUP.
 *
 * This was a real bug, found by Jon on 25 August 2026. He added his live Stripe
 * key and his PostHog key to `.env.local` exactly as instructed, refreshed, and
 * the page still told him the key was a test key — because the server had read
 * the file once when it started and never looked again. Both keys were correct
 * the whole time.
 *
 * It is a nasty failure because it looks like the instructions are wrong rather
 * than the program: the file plainly contains the right key, and the page
 * plainly says it does not. Nothing about it suggests "restart the server".
 *
 * So `buildHtml` loads the environment itself. Adding a key while the dashboard
 * is running now works on the next refresh, which is what the documentation
 * always said. The cost is reading two small files per page load.
 */
const PORT = Number(loadEnv().UC_DASHBOARD_PORT || 4477);

/** New every start, so a link copied yesterday is dead today. */
const TOKEN = crypto.randomBytes(16).toString('hex');

/** Only these Host values are accepted. See point 4 in the header. */
const ALLOWED_HOSTS = new Set([`localhost:${PORT}`, `127.0.0.1:${PORT}`, `[::1]:${PORT}`]);

async function buildHtml() {
  // Fresh every time. See the note above the PORT constant.
  const env = loadEnv();
  const { key, source } = stripeKey(env);
  const mode = stripeMode(key);

  const [stripe, gateway, database, posthog] = await Promise.all([
    collect('Stripe', () => readStripe(env, mode, key)),
    collect('The AI gateway', () => readGateway(env)),
    collect('The database', () => readDatabase(env)),
    collect('PostHog', () => readPostHog(env)),
  ]);

  const view = buildView({ env, mode, keySource: source, stripe, gateway, database, posthog });
  const html = renderPage({ ...view, live: true, token: TOKEN });

  // `env` goes back with it so the leak check scans for the keys THIS build
  // actually used, rather than a set captured when the server started.
  return { html, view, env, mode };
}

const server = http.createServer(async (req, res) => {
  const host = req.headers.host || '';

  if (!ALLOWED_HOSTS.has(host)) {
    res.writeHead(404).end('Not found');
    return;
  }

  const url = new URL(req.url, `http://${host}`);

  if (url.searchParams.get('t') !== TOKEN) {
    res.writeHead(404).end('Not found');
    return;
  }

  if (req.method !== 'GET') {
    res.writeHead(405).end('This dashboard only reads.');
    return;
  }

  try {
    const started = Date.now();
    const { html, view, env } = await buildHtml();

    // The same guard the written file gets. A response that would carry a key
    // is never sent; the browser gets an error page instead.
    const result = scan(html, secretValues(env));

    if (!result.clean) {
      console.error('\n★ REFUSED TO SERVE: a credential appeared in the page. Nothing was sent.');
      res.writeHead(500, { 'content-type': 'text/html; charset=utf-8' })
        .end('<h1>Refused to render</h1><p>A credential appeared in the page, so it was not sent. Check the terminal.</p>');
      return;
    }

    res.writeHead(200, {
      'content-type': 'text/html; charset=utf-8',
      // A dashboard of live figures must never be served from cache.
      'cache-control': 'no-store, no-cache, must-revalidate',
      // It is private business data: no other origin, no indexer, no referrer.
      'x-robots-tag': 'noindex, nofollow',
      'referrer-policy': 'no-referrer',
      'x-content-type-options': 'nosniff',
    }).end(html);

    const problems = view.alerts.filter((a) => a.level === 'critical').length;

    console.log(
      `  refreshed in ${((Date.now() - started) / 1000).toFixed(1)}s` +
        `  ${new Date().toLocaleTimeString()}` +
        (problems ? `  — ${problems} CRITICAL` : ''),
    );
  } catch (error) {
    console.error('  failed to build the page:', error.message);
    res.writeHead(500, { 'content-type': 'text/html; charset=utf-8' })
      .end(`<h1>Could not build the dashboard</h1><pre>${String(error.message).replace(/[<>&]/g, '')}</pre>`);
  }
});

server.listen(PORT, '127.0.0.1', () => {
  const address = `http://localhost:${PORT}/?t=${TOKEN}`;

  console.log('\nun-claude — live operator dashboard');
  console.log('─'.repeat(66));
  console.log('  Running. Every refresh re-reads Stripe, the gateway, the database');
  console.log('  and PostHog. Press Ctrl-C here to stop it.\n');
  console.log(`  ${address}\n`);
  console.log('  Only this computer can open that address, and the code after "t="');
  console.log('  changes every time you start it.');
  console.log('  ★ The page lists customer email addresses. Treat it like Stripe.\n');

  if (OPEN) execFile('open', [address], () => {});
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`\nPort ${PORT} is already in use — the dashboard may already be running.`);
    console.error(`Either use that window, or start this one on another port:\n`);
    console.error(`  UC_DASHBOARD_PORT=4478 node scripts/dashboard/serve.mjs\n`);
    process.exit(1);
  }

  console.error('\nCould not start the dashboard:', error.message, '\n');
  process.exit(1);
});
