/**
 * THE PAGE JON ACTUALLY OPENS.
 *
 * Written for the person described in `CLAUDE.md` section 1 and section 8: not a
 * programmer, possibly on a phone, possibly at 7am, wanting five answers before
 * he has finished his first coffee. Every rule below comes from that.
 *
 *   NO JARGON SURVIVES. Not `total_used`, not `run_costs`, not `p50`. Where a
 *   technical word cannot be avoided it is explained in the panel it appears in,
 *   the first time it appears.
 *
 *   ANYTHING WRONG IS VISIBLE WITHOUT READING. Problems are a coloured strip at
 *   the top of the page, above everything, before any number. Colour and
 *   position do the work, so a glance is enough and a bad day cannot hide at the
 *   bottom of a table.
 *
 *   EVERY PANEL SAYS WHERE ITS NUMBER CAME FROM, and how much to trust it.
 *   "Exact" and "a shape, not a count" are different claims and the page makes
 *   the difference obvious, because the whole point of this project is not
 *   overstating what is known.
 *
 *   NOTHING IS FETCHED. No script, no font, no image, no stylesheet from
 *   anywhere. The file works with the network off, opens straight from disk, and
 *   cannot phone home. Charts are hand-drawn SVG for the same reason a charting
 *   library was refused: it would be a new dependency.
 */

import { redact } from './leak-check.mjs';

const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

/**
 * THE ONE GATE EVERY STRING ON THIS PAGE PASSES THROUGH. It does two jobs.
 *
 * ESCAPE. A gateway error message, a PostHog page path and a Stripe failure
 * reason all arrive from outside and all end up in this document; any one of
 * them containing a `<` would break the layout or worse.
 *
 * REDACT. An upstream error can quote a credential back at us — Stripe answers a
 * bad key with "Invalid API Key provided: sk_test_*******************0000", and
 * this page renders a failed source's message. Doing the redaction here rather
 * than at each call site is the same reasoning as the read-only guard in
 * `http.mjs`: one choke point that cannot be forgotten beats a rule everybody
 * has to remember.
 */
function e(value) {
  return redact(value).replace(/[&<>"']/g, (c) => ESCAPES[c]);
}

/** Money, from cents, the way a person writes it. */
function money(cents, currency = 'usd') {
  const symbol = currency.toLowerCase() === 'usd' ? '$' : '';

  return `${symbol}${(cents / 100).toFixed(2)}`;
}

/** Money, from dollars, for the gateway which reports fractions of a cent. */
function usd(value, places = 2) {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) return '—';

  return `$${Number(value).toFixed(places)}`;
}

function num(value) {
  if (value === null || value === undefined) return '—';

  return Number(value).toLocaleString();
}

/**
 * "1 job has" against "3 jobs have".
 *
 * Trivial, and it earns its place: this page tells Jon that something is wrong,
 * and a sentence reading "1 recent jobs have no cost recorded" makes the whole
 * page read as generated rather than written, which is exactly the "text slob"
 * failure `CLAUDE.md` section 8 exists to prevent.
 */
function plural(count, one, many) {
  return `${num(count)} ${count === 1 ? one : many}`;
}

/** A date a person can read, in the reader's own timezone. */
function when(iso) {
  const d = new Date(iso);

  return d.toLocaleString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * A bar chart, drawn by hand.
 *
 * Fourteen days across. Empty days are drawn as a faint baseline rather than
 * omitted, because a gap in activity is information and a chart that silently
 * skips quiet days lies about the trend.
 */
function bars(series, { colour = '#1f6feb', height = 64 } = {}) {
  if (!series?.length) return '<p class="none">Nothing recorded yet.</p>';

  const max = Math.max(1, ...series.map((d) => d.count));
  const width = 100 / series.length;

  const rects = series
    .map((d, i) => {
      const h = d.count ? Math.max(6, (d.count / max) * height) : 1.5;
      const x = i * width;
      const label = `${d.day}: ${d.count}`;

      return `<rect x="${(x + width * 0.15).toFixed(2)}" y="${(height - h).toFixed(2)}" width="${(width * 0.7).toFixed(2)}" height="${h.toFixed(2)}" rx="1" fill="${d.count ? colour : '#d8dee4'}"><title>${e(label)}</title></rect>`;
    })
    .join('');

  const first = series[0].day.slice(5);
  const last = series[series.length - 1].day.slice(5);

  return `<svg class="bars" viewBox="0 0 100 ${height}" preserveAspectRatio="none" role="img" aria-label="Daily counts for the last ${series.length} days">${rects}</svg>
    <div class="axis"><span>${e(first)}</span><span>peak ${max}</span><span>${e(last)}</span></div>`;
}

/** One of the five headline numbers. */
function headlineCard({ label, value, sub, tone = 'plain' }) {
  return `<div class="big ${tone}">
    <div class="big-label">${e(label)}</div>
    <div class="big-value">${value}</div>
    <div class="big-sub">${sub || ''}</div>
  </div>`;
}

/** A panel that could not be read. Says what happened and the one line that fixes it. */
function brokenPanel(title, source, result) {
  return panel(
    title,
    source,
    `<div class="degraded">
      <p class="degraded-why">${e(result.reason)}</p>
      ${result.fix ? `<p class="degraded-fix"><strong>To fix it:</strong> ${e(result.fix)}</p>` : ''}
      <p class="degraded-note">The rest of this page is unaffected — only this panel is missing.</p>
    </div>`,
  );
}

function panel(title, source, body, tone = '') {
  return `<section class="panel ${tone}">
    <header class="panel-head">
      <h2>${e(title)}</h2>
      <span class="source">${e(source)}</span>
    </header>
    ${body}
  </section>`;
}

function rows(pairs) {
  return `<dl class="rows">${pairs
    .map(([k, v, note]) => `<div class="row"><dt>${e(k)}${note ? `<span class="hint">${e(note)}</span>` : ''}</dt><dd>${v}</dd></div>`)
    .join('')}</dl>`;
}

// ---------------------------------------------------------------------------
// The panels
// ---------------------------------------------------------------------------

function stripePanel(s) {
  if (!s.ok) return brokenPanel('Payments', 'Stripe', s);

  const mode = s.mode;
  const isTest = mode === 'test';
  const cur = s.currency;

  const modeBanner = isTest
    ? `<div class="banner warn">
         <strong>These are practice payments, not real ones.</strong>
         This dashboard is using a <em>test</em> Stripe key, which can only see Stripe's sandbox.
         Every figure in this panel is imaginary money. Your real sales are not here —
         look at <strong>Money taken</strong> in the Usage panel below, which is real.
       </div>`
    : `<div class="banner live"><strong>Live mode. This is real money.</strong></div>`;

  const recent = s.recent.length
    ? `<table class="table"><thead><tr><th>When</th><th>Amount</th><th></th></tr></thead><tbody>${s.recent
        .map(
          (r) =>
            `<tr><td>${e(when(r.when))}</td><td class="numeric">${e(money(r.amount, r.currency))}</td><td>${
              r.disputed ? '<span class="tag bad">disputed</span>' : r.refunded ? '<span class="tag warn">refunded</span>' : ''
            }</td></tr>`,
        )
        .join('')}</tbody></table>`
    : '<p class="none">No successful payments in this mode.</p>';

  return panel(
    isTest ? 'Payments (practice mode)' : 'Payments',
    `Stripe, ${mode} mode`,
    `${modeBanner}
     ${rows([
       ['Kept, all time', `<strong>${e(money(s.money.netAll, cur))}</strong>`, 'after refunds'],
       ['Charged, all time', e(money(s.money.grossAll, cur)), 'before refunds'],
       ['Today', e(money(s.money.netToday, cur))],
       ['Last 7 days', e(money(s.money.net7, cur))],
       ['Last 30 days', e(money(s.money.net30, cur))],
       ['Payments that worked', num(s.counts.paid)],
       ['Payments that were declined', num(s.counts.failed), "the customer's card said no"],
       ['Refunds given', s.counts.refunds === null ? '—' : `${num(s.counts.refunds)} · ${e(money(s.money.refundedAll, cur))}`],
       [
         'Disputes',
         s.counts.disputes === null
           ? '—'
           : `${num(s.counts.disputes)} · ${e(money(s.money.disputedTotal || 0, cur))}${s.disputesOpen ? ` <span class="tag bad">${s.disputesOpen} still open</span>` : ''}`,
         'a customer told their bank they did not authorise it',
       ],
     ])}
     <h3>The most recent payments</h3>
     ${recent}
     ${s.missing.length ? `<p class="footnote">Could not read: ${e(s.missing.join(', '))}. Those figures show as —.</p>` : ''}`,
    isTest ? 'muted' : '',
  );
}

function gatewayPanel(g) {
  if (!g.ok) return brokenPanel('What the AI costs us', 'Vercel AI Gateway', g);

  const state = g.serving.state;
  const tone = state === 'serving' ? 'ok' : state === 'refused' ? 'bad' : 'warn';
  const word = state === 'serving' ? 'Working normally' : state === 'refused' ? 'REFUSING WORK' : 'Could not tell';

  return panel(
    'What the AI costs us',
    'Vercel AI Gateway, live check',
    `<div class="banner ${tone === 'ok' ? 'live' : tone === 'bad' ? 'bad' : 'warn'}">
       <strong>${e(word)}.</strong> ${e(g.serving.detail)}
     </div>
     <p class="explain">The gateway is the service that runs the paid rewrite. If it stops, the part of
     the product people pay for stops with it — so this page asks it to do a tiny piece of real work
     every time it is generated, rather than trusting a status number.</p>
     ${
       g.partial
         ? `<p class="footnote">The spending figures could not be read this time (${e(g.reason)}), but the check above still ran.</p>`
         : rows([
             ['Spent on this key, all time', `<strong>${e(usd(g.totalUsed))}</strong>`, 'this is the number that matters'],
             ['Prepaid credit sitting on the account', e(usd(g.balance)), 'NOT your remaining headroom — see below'],
           ])
     }
     <div class="banner warn">
       <strong>The spending limit cannot be shown here, and this has bitten before.</strong>
       There is a separate cap set on this key. No API reports it, so this page cannot show how much
       room is left. On 24 August the key hit its cap and the paid rewrite went down while the
       "prepaid credit" figure still read $14.99 — that money existed and none of it was spendable.
       <br><br>
       To see the actual limit: Vercel dashboard → AI Gateway → API keys → this key.
       The <strong>Working normally</strong> line above is the reliable answer to "is it up right now".
     </div>`,
  );
}

function databasePanel(d) {
  if (!d.ok) return brokenPanel('Usage and credits', 'Our own database', d);

  const reasonNames = {
    anon_grant: 'Free credits for a visitor who never signed up',
    signup_grant: 'Free credits for creating an account',
    purchase: 'Credits bought',
    spend: 'Credits used up',
    operation_refund: 'Credits given back after a job failed',
    money_refund: 'Credits taken back after a refund',
    adjustment: 'Manual corrections',
  };

  const creditRows = Object.entries(d.credits.byReason)
    .sort((a, b) => b[1].rows - a[1].rows)
    .map(([reason, v]) => [
      reasonNames[reason] || reason,
      `${v.credits > 0 ? '+' : ''}${num(v.credits)} <span class="hint-inline">over ${num(v.rows)} entries</span>`,
    ]);

  const purchases = d.money.recent.length
    ? `<table class="table"><thead><tr><th>When</th><th>Amount</th><th>Credits</th></tr></thead><tbody>${d.money.recent
        .map(
          (p) =>
            `<tr><td>${e(when(p.when))}</td><td class="numeric">${e(money(p.cents))}</td><td class="numeric">${num(p.credits)}</td></tr>`,
        )
        .join('')}</tbody></table>`
    : '<p class="none">No purchases recorded.</p>';

  const perRun = d.cost.perPaidRun;
  // One credit is one thousand words (04 entry 67). Revenue per credit comes
  // from what was actually charged rather than from the price list, so a
  // discount or a changed price cannot make this figure stale.
  const perCredit = d.money.creditsSold ? d.money.purchaseCents / 100 / d.money.creditsSold : null;

  return panel(
    'Usage and credits',
    'Our own database — exact counts',
    `<p class="explain"><strong>Everything here is an exact count.</strong> These are rows in our own
     database: each one is a thing that really happened. Nothing on this panel is sampled, estimated
     or guessed, which is what separates it from the Behaviour panel further down.</p>

     <h3>Money taken</h3>
     <div class="banner live">
       <strong>This is real money, whatever mode the Payments panel is in.</strong>
       These rows were written by the live payment system running on the real website.
     </div>
     ${rows([
       ['Kept, all time', `<strong>${e(money(d.money.netCents))}</strong>`, 'after refunds'],
       ['Purchases', num(d.money.purchaseCount)],
       ['Refunds', `${num(d.money.refundCount)} · ${e(money(d.money.refundCents))}`],
       ['Today', e(money(d.money.todayCents))],
       ['Credits sold', num(d.money.creditsSold)],
     ])}
     ${purchases}

     <h3>People</h3>
     ${rows([
       ['Accounts of every kind', num(d.accounts.rowsInTable), 'includes anonymous visitors'],
       ['Real accounts, signed up', `<strong>${num(d.accounts.registered)}</strong>`],
       ['Visitors who never signed up', num(d.accounts.guestsNeverRegistered), 'given free credits on arrival'],
       ['Signed up in the last 7 days', num(d.accounts.registered7)],
     ])}
     ${
       !d.accounts.createdAtUsable
         ? `<p class="footnote"><strong>Note on the dates.</strong> The accounts table has a "created" column
            and it is empty on every row, so it cannot say when anyone joined. The chart below instead uses
            the moment each account received its first free credits, which happens the instant the account is
            made. The count is exact; only the column it comes from is a stand-in.</p>`
         : ''
     }
     <div class="chart"><h4>New accounts, last 14 days</h4>${bars(d.accounts.byDay, { colour: '#8250df' })}</div>

     <h3>Work done</h3>
     ${rows([
       ['Jobs run, all time', `<strong>${num(d.runs.total)}</strong>`],
       ['Today', num(d.runs.today)],
       ['Last 7 days', num(d.runs.last7)],
       ['Jobs that failed and were refunded', `${num(d.runs.refunded)}${d.runs.refundedToday ? ` <span class="tag warn">${d.runs.refundedToday} today</span>` : ''}`, 'the credit was returned'],
       ['Words processed', num(d.runs.wordsTotal)],
     ])}
     <div class="chart"><h4>Jobs run, last 14 days</h4>${bars(d.runs.byDay, { colour: '#1f6feb' })}</div>

     <h3>Credits, by what caused them</h3>
     ${rows(creditRows)}

     <h3>What it costs us to serve</h3>
     <p class="explain">Only the paid rewrites cost anything. Stripping hidden characters and file
     metadata makes no AI call and is free to run.</p>
     ${rows([
       ['Total spent running jobs', e(usd(d.cost.allTime, 4))],
       ['What we charge for one credit', perCredit === null ? '—' : `<strong>${e(usd(perCredit, 2))}</strong>`, 'averaged over what was actually charged, not the price list'],
       ['What one paid rewrite costs us', perRun === null ? '—' : `<strong>${e(usd(perRun, 4))}</strong>`, 'averaged over the paid rewrites so far'],
       [
         'Cost as a share of the price',
         perRun === null || perCredit === null || !perCredit
           ? '—'
           : `${((perRun / perCredit) * 100).toFixed(1)}%`,
         'assumes one rewrite per credit — a longer document uses several credits and costs us proportionally more',
       ],
       ['Longest a job has taken', `${e(String(d.cost.slowestSeconds))}s`],
       ['Retries', num(d.cost.retriesTotal), 'the AI was asked again after a bad answer'],
     ])}
     ${
       d.cost.gapSinceCosting > 0
         ? `<p class="footnote warnish"><strong>${plural(d.cost.gapSinceCosting, 'recent job has', 'recent jobs have')} no cost recorded against ${d.cost.gapSinceCosting === 1 ? 'it' : 'them'}.</strong>
            Since cost recording began on ${e(when(d.cost.costingBegan))}, ${num(d.cost.spendsSinceCosting)} jobs ran and
            ${num(d.runs.withCostRecorded)} costs were written. A growing gap means the step that records what a job cost is
            failing quietly, and the cost figures above would then be too low.</p>`
         : `<p class="footnote">Cost recording began ${e(when(d.cost.costingBegan))}. Jobs before then have no cost recorded
            and never will, so "total spent running jobs" covers only the period since.</p>`
     }`,
  );
}

function posthogPanel(p) {
  if (!p.ok) {
    return panel(
      'Behaviour',
      p.configured ? 'PostHog — not answering' : 'PostHog — not set up yet',
      `<div class="degraded">
        <p class="degraded-why">${e(p.reason)}</p>
        <p class="degraded-fix"><strong>To fix it:</strong> ${e(p.fix)}</p>
        <p class="degraded-note">Everything else on this page works without it. The Payments and Usage
        panels are the ones that carry real numbers; this panel only adds the shape of how people move
        through the site.</p>
      </div>`,
      'muted',
    );
  }

  const top = p.funnel[0]?.total || 0;

  const funnel = p.funnel
    .map((step) => {
      const width = top ? Math.max(1.5, (step.total / top) * 100) : 1.5;

      return `<div class="funnel-step">
        <div class="funnel-label">${e(step.label)}${step.note ? `<span class="hint"> ${e(step.note)}</span>` : ''}${
          step.broken ? '<span class="tag warn">cannot be linked to the step above</span>' : ''
        }</div>
        <div class="funnel-bar"><span style="width:${width.toFixed(1)}%"></span><b>${num(step.total)}</b></div>
      </div>`;
    })
    .join('');

  const pages = p.pages.length
    ? `<table class="table"><thead><tr><th>Page</th><th>Views</th></tr></thead><tbody>${p.pages
        .map((x) => `<tr><td>${e(x.path)}</td><td class="numeric">${num(x.views)}</td></tr>`)
        .join('')}</tbody></table>`
    : '<p class="none">No pages recorded in this window.</p>';

  const failureNames = {
    scan_failed: 'A scan failed',
    sanitise_failed: 'A clean-up failed',
    checkout_failed: 'A checkout could not start',
  };

  return panel(
    'Behaviour',
    `PostHog, last ${p.windowDays} days — see the caveat`,
    `<div class="banner warn">
       <strong>Treat these as a shape, not a count.</strong>
       This site deliberately stores nothing on a visitor's device, so it cannot tell a returning
       visitor from a new one — everybody looks new every time. Two things follow, and both matter:
       <br><br>
       <strong>1.</strong> The visitor numbers are higher than the number of real people.
       <br>
       <strong>2.</strong> <em>Came back having paid</em> cannot be joined to <em>Pressed a pack button</em>.
       Someone who pays leaves for Stripe and returns as a stranger. Both numbers are honest on their
       own; the percentage between them would be fiction.
       <br><br>
       <strong>For what actually happened, read the Payments and Usage panels.</strong> They are exact.
     </div>
     <p class="explain"><strong>Whose visits are counted.</strong> Only visits to ${e(p.host)}, which
     leaves out this laptop and every preview copy of the site.
     ${
       p.excludedIps
         ? `${p.excludedIps} address${p.excludedIps === 1 ? '' : 'es'} you named are also excluded.`
         : `<strong>Your own visits to the live site are still counted</strong> — PostHog's own "internal user" setting does not apply to this page. To leave yourself out, see the session note.`
     }</p>
     <h3>The journey</h3>
     <div class="funnel">${funnel}</div>
     <h3>Things going wrong</h3>
     ${rows(p.failures.map((f) => [failureNames[f.event] || f.event, num(f.total)]))}
     ${
       p.checkoutFailures.length
         ? `<h4>Why checkouts could not start</h4>${rows(p.checkoutFailures.map((c) => [c.reason, num(c.total)]))}`
         : ''
     }
     <h3>Most visited pages</h3>
     ${pages}
     <p class="footnote">Project ${e(p.projectName || p.projectId)}${p.discovered ? ' (found automatically)' : ''}.</p>`,
  );
}

// ---------------------------------------------------------------------------
// The whole document
// ---------------------------------------------------------------------------

export function renderPage({ generatedAt, alerts, headline, stripe, gateway, database, posthog }) {
  const alertStrip = alerts.length
    ? `<div class="alerts">${alerts
        .map(
          (a) =>
            `<div class="alert ${a.level}"><span class="alert-dot"></span><div><strong>${e(a.title)}</strong> ${e(a.detail)}</div></div>`,
        )
        .join('')}</div>`
    : `<div class="alerts"><div class="alert good"><span class="alert-dot"></span><div><strong>Nothing is broken.</strong> Every source answered and no problem was found.</div></div></div>`;

  return `<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>un-claude — how the business is doing</title>
<style>
  :root {
    --ink: #1c2128; --dim: #57606a; --faint: #8c959f;
    --line: #d8dee4; --bg: #ffffff; --panel: #f6f8fa;
    --blue: #1f6feb; --green: #1a7f37; --amber: #9a6700; --red: #cf222e;
    --amber-bg: #fff8c5; --red-bg: #ffebe9; --green-bg: #dafbe1; --blue-bg: #ddf4ff;
  }
  * { box-sizing: border-box; }
  body {
    margin: 0; padding: 0 16px 64px;
    font: 16px/1.55 -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
    color: var(--ink); background: var(--bg);
    -webkit-text-size-adjust: 100%;
  }
  .wrap { max-width: 940px; margin: 0 auto; }

  header.top { padding: 28px 0 12px; }
  header.top h1 { margin: 0 0 4px; font-size: clamp(22px, 5vw, 30px); letter-spacing: -0.02em; }
  header.top .stamp { color: var(--dim); font-size: 14px; }
  header.top .stamp b { color: var(--ink); font-weight: 600; }

  /* Problems first, above every number. */
  .alerts { margin: 16px 0 24px; display: grid; gap: 8px; }
  .alert { display: flex; gap: 10px; align-items: flex-start; padding: 12px 14px; border-radius: 8px; font-size: 15px; border: 1px solid; }
  .alert-dot { width: 9px; height: 9px; border-radius: 50%; margin-top: 7px; flex: none; }
  .alert.critical { background: var(--red-bg); border-color: #ffcecb; }
  .alert.critical .alert-dot { background: var(--red); }
  .alert.warning { background: var(--amber-bg); border-color: #f0e2a3; }
  .alert.warning .alert-dot { background: var(--amber); }
  .alert.info { background: var(--blue-bg); border-color: #b6e3ff; }
  .alert.info .alert-dot { background: var(--blue); }
  .alert.good { background: var(--green-bg); border-color: #b4e5c1; }
  .alert.good .alert-dot { background: var(--green); }

  .bigs { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; margin-bottom: 28px; }
  .big { border: 1px solid var(--line); border-radius: 10px; padding: 14px; background: var(--panel); }
  .big-label { font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; color: var(--dim); font-weight: 600; }
  .big-value { font-size: clamp(24px, 6vw, 32px); font-weight: 650; letter-spacing: -0.02em; margin: 6px 0 2px; }
  .big-sub { font-size: 13px; color: var(--dim); }
  .big.good .big-value { color: var(--green); }
  .big.bad { background: var(--red-bg); border-color: #ffcecb; }
  .big.bad .big-value { color: var(--red); }
  .big.warn { background: var(--amber-bg); border-color: #f0e2a3; }
  .big.warn .big-value { color: var(--amber); }

  .panel { border: 1px solid var(--line); border-radius: 10px; padding: 18px; margin-bottom: 18px; }
  .panel.muted { background: #fcfcfd; }
  .panel-head { display: flex; flex-wrap: wrap; gap: 6px 12px; align-items: baseline; justify-content: space-between; margin-bottom: 12px; border-bottom: 1px solid var(--line); padding-bottom: 10px; }
  .panel-head h2 { margin: 0; font-size: 19px; letter-spacing: -0.01em; }
  .source { font-size: 12px; color: var(--dim); background: var(--panel); border: 1px solid var(--line); padding: 2px 8px; border-radius: 20px; white-space: nowrap; }
  .panel h3 { font-size: 15px; margin: 22px 0 8px; text-transform: uppercase; letter-spacing: 0.04em; color: var(--dim); }
  .panel h4 { font-size: 14px; margin: 16px 0 6px; color: var(--dim); }

  .banner { padding: 12px 14px; border-radius: 8px; font-size: 14.5px; margin: 12px 0; border: 1px solid; }
  .banner.warn { background: var(--amber-bg); border-color: #f0e2a3; }
  .banner.bad { background: var(--red-bg); border-color: #ffcecb; }
  .banner.live { background: var(--green-bg); border-color: #b4e5c1; }

  .explain { font-size: 14.5px; color: var(--dim); margin: 8px 0 12px; }

  .rows { margin: 0; }
  .row { display: flex; justify-content: space-between; gap: 16px; padding: 8px 0; border-bottom: 1px solid #eef1f4; align-items: baseline; }
  .row:last-child { border-bottom: 0; }
  .row dt { color: var(--dim); font-size: 14.5px; }
  .row dd { margin: 0; text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
  .hint { display: block; font-size: 12.5px; color: var(--faint); }
  .hint-inline { font-size: 12.5px; color: var(--faint); font-weight: 400; }

  .table { width: 100%; border-collapse: collapse; font-size: 14.5px; margin-top: 8px; }
  .table th { text-align: left; font-size: 12px; text-transform: uppercase; letter-spacing: 0.04em; color: var(--dim); border-bottom: 1px solid var(--line); padding: 6px 8px 6px 0; }
  .table td { padding: 7px 8px 7px 0; border-bottom: 1px solid #eef1f4; }
  .table .numeric { text-align: right; font-variant-numeric: tabular-nums; }

  .tag { display: inline-block; font-size: 11.5px; padding: 1px 7px; border-radius: 20px; margin-left: 6px; white-space: nowrap; }
  .tag.bad { background: var(--red-bg); color: var(--red); }
  .tag.warn { background: var(--amber-bg); color: var(--amber); }

  .chart { margin: 14px 0 6px; }
  .chart h4 { margin: 0 0 6px; }
  .bars { width: 100%; height: 64px; display: block; }
  .axis { display: flex; justify-content: space-between; font-size: 11.5px; color: var(--faint); margin-top: 4px; }

  .funnel { display: grid; gap: 10px; }
  .funnel-label { font-size: 14px; margin-bottom: 3px; }
  .funnel-bar { position: relative; background: var(--panel); border-radius: 5px; height: 26px; display: flex; align-items: center; }
  .funnel-bar span { position: absolute; left: 0; top: 0; bottom: 0; background: var(--blue); opacity: 0.85; border-radius: 5px; }
  .funnel-bar b { position: relative; padding-left: 9px; font-size: 13px; font-variant-numeric: tabular-nums; color: var(--ink); mix-blend-mode: normal; }

  .degraded { background: var(--panel); border-radius: 8px; padding: 14px; }
  .degraded-why { margin: 0 0 8px; font-weight: 600; }
  .degraded-fix { margin: 0 0 8px; font-size: 14.5px; }
  .degraded-note { margin: 0; font-size: 13.5px; color: var(--dim); }

  .none { color: var(--faint); font-size: 14px; font-style: italic; }
  .footnote { font-size: 13px; color: var(--dim); margin-top: 12px; padding-top: 10px; border-top: 1px solid #eef1f4; }
  .footnote.warnish { background: var(--amber-bg); border: 1px solid #f0e2a3; border-radius: 8px; padding: 10px 12px; color: var(--ink); }

  footer { color: var(--faint); font-size: 13px; margin-top: 28px; text-align: center; }

  @media (max-width: 520px) {
    .row { flex-direction: column; gap: 2px; }
    .row dd { text-align: left; }

    /* The five numbers are the point of the page and must survive the fold.
       Written at desktop sizes the alert strip alone filled a phone screen. */
    body { padding: 0 12px 48px; }
    header.top { padding: 18px 0 6px; }
    .alerts { margin: 12px 0 16px; gap: 6px; }
    .alert { padding: 9px 11px; font-size: 13.5px; line-height: 1.45; gap: 8px; }
    .alert-dot { margin-top: 5px; width: 7px; height: 7px; }
    .bigs { gap: 8px; }
    .big { padding: 11px 12px; }
    .panel { padding: 14px; }
  }
</style>
<div class="wrap">
  <header class="top">
    <h1>How the business is doing</h1>
    <p class="stamp">A snapshot taken <b>${e(when(generatedAt))}</b>. Nothing here updates on its own —
    run the command again for fresh numbers.</p>
  </header>

  ${alertStrip}

  <div class="bigs">${headline.map(headlineCard).join('')}</div>

  ${stripePanel(stripe)}
  ${gatewayPanel(gateway)}
  ${databasePanel(database)}
  ${posthogPanel(posthog)}

  <footer>Generated on this machine and never uploaded. Contains no keys or passwords.</footer>
</div>`;
}
