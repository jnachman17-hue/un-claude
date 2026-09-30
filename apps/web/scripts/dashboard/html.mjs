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
  /*
   * NO LIVE KEY MEANS NO NUMBERS, ON PURPOSE.
   *
   * Jon's instruction, 25 August 2026: "I only want a real payments section."
   * Rather than a broken-looking panel, this is the one place on the page that
   * asks him to do something, with the exact steps.
   */
  if (!s.ok && s.needsLiveKey) {
    return panel(
      'Payments',
      'Stripe — needs your live key',
      `<div class="setup">
        <p class="setup-why">${e(s.reason)}</p>
        <p class="explain">Meanwhile the money figures on this page come from our own database, which
        recorded each payment as it happened. Those are real. Adding the live key gets you the detail
        Stripe holds and nothing else does: declined cards, refunds and disputes.</p>
        <h4>To switch it on, once</h4>
        <ol class="steps">
          <li>Open the <strong>Stripe dashboard</strong> and make sure the <strong>Test mode</strong>
              switch at the top right is <strong>OFF</strong>.</li>
          <li>Go to <strong>Developers → API keys</strong>.</li>
          <li>Next to <strong>Secret key</strong>, press <strong>Reveal</strong> and copy it.
              It starts with <code>sk_live_</code>.</li>
          <li>Open <code>apps/web/.env.local</code> and add one line:
              <code class="block">UC_DASHBOARD_STRIPE_KEY=sk_live_your_key_here</code></li>
          <li>Refresh this page.</li>
        </ol>
        <p class="footnote"><strong>Why that name and not <code>STRIPE_SECRET_KEY</code>.</strong>
        That other variable is the key the website itself uses when it runs on this laptop, and it is a
        test key on purpose so development cannot charge a real card. Putting a live key there would arm
        the local site with real money. This name is used by the dashboard and nothing else.</p>
      </div>`,
    );
  }

  if (!s.ok) return brokenPanel('Payments', 'Stripe', s);

  const cur = s.currency;
  const modeBanner = `<div class="banner live"><strong>Live mode. This is real money.</strong></div>`;

  return panel(
    'Payments',
    'Stripe, live mode',
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
     ${/*
        THE RECENT-PAYMENTS TABLE CAME OFF, 30 September 2026, on Jon's
        instruction ("Don't need list of most recent payments"). It was six
        rows of when-and-how-much that the Stripe dashboard shows better, it
        named no customer so it could not be acted on, and it pushed the
        totals above it off a phone screen.
     */ ''}
     ${s.missing.length ? `<p class="footnote">Could not read: ${e(s.missing.join(', '))}. Those figures show as —.</p>` : ''}`,
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
         : `
     <h3>How much is left</h3>
     <p class="explain">Two separate things can stop the rewrite, and they run out independently.
     Whichever empties first is the one that matters.</p>
     ${rows([
       [
         'Money loaded on the account',
         `<strong>${e(usd(g.loaded))}</strong>`,
         'real prepaid credit — at zero, the rewrite stops for everyone',
       ],
       [
         'Your monthly spending limit',
         e(usd(g.monthlyLimit)),
         'a figure you set in Vercel and typed into this dashboard — not read from any API',
       ],
       [
         'Spent so far this month',
         g.month.spent === null || g.month.tooYoung
           ? '<span class="hint-inline">still measuring — see below</span>'
           : `${e(usd(g.month.spent))} <span class="hint-inline">of ${e(usd(g.monthlyLimit))}</span>`,
         g.month.spent === null || g.month.tooYoung ? undefined : 'at least this much — see the note below',
       ],
       [
         'Spending rate',
         g.burn?.perDay > 0
           ? `${e(usd(g.burn.perDay, 4))} <span class="hint-inline">a day</span>`
           : '<span class="hint-inline">not enough history yet</span>',
         g.burn?.perDay > 0 ? `measured over the last ${g.burn.days.toFixed(1)} days` : undefined,
       ],
       [
         'At that rate, the loaded credit lasts',
         g.burn?.perDay > 0 && g.loaded !== null
           ? `<strong>about ${Math.floor(g.loaded / g.burn.perDay)} days</strong>`
           : '<span class="hint-inline">not enough history yet</span>',
       ],
     ])}
     ${g.month.tooYoung ? '' : bar(g.loaded, g.monthlyLimit, g.month.spent)}
     ${rows([['Spent since the account opened', e(usd(g.totalUsed)), 'all time, not this month']])}
     ${
       g.month.spent === null || g.month.tooYoung
         ? `<p class="footnote"><strong>Why "spent this month" is not a number yet.</strong> The gateway only reports a
            total for all time, never a monthly figure, so the only way to know this month's spend is to
            compare readings. This dashboard writes down what the gateway says every time you run it, and it
            only started doing that ${g.month.since ? e(when(g.month.since)) : 'just now'}. Showing the difference so far
            would read as "nothing spent this month", which is not what it means.
            <strong>Leave it a day and a real figure appears.</strong></p>`
         : `<p class="footnote"><strong>Why "at least".</strong> The monthly figure is the difference between
            now and the first reading taken this month${g.month.since ? ` (${e(when(g.month.since))})` : ''}. Anything
            spent before that first reading is not counted, so the true figure is that much or more. Running
            the dashboard regularly makes it tighter.</p>`
     }`
     }
     <div class="banner warn">
       <strong>The limit above is a number you typed in, not one we can read.</strong>
       No API reports the cap on a gateway key — it exists only in the Vercel dashboard, under
       AI Gateway → API keys → this key. <strong>If you change it there, change it here too</strong>, or this
       page will be confidently wrong.
       <br><br>
       This caught the site out on 24 August: the key hit its $10 cap and the paid rewrite went down while
       the loaded-credit figure still read $14.99. The money was real and none of it was spendable.
       <strong>The “${e(g.serving.state === 'serving' ? 'Working normally' : 'status')}” line at the top of this panel is the
       reliable answer to “is it up right now”</strong>, because it asks rather than calculates.
     </div>`,
  );
}

/**
 * A two-part meter: how much money is loaded, and how much of the monthly cap is
 * gone. Drawn rather than tabulated because "am I close to running out" is a
 * question about proportion, and a bar answers it before the number is read.
 */
function bar(loaded, limit, spentThisMonth) {
  if (spentThisMonth === null || !limit) return '';

  const used = Math.min(100, (spentThisMonth / limit) * 100);
  const colour = used >= 95 ? '#cf222e' : used >= 80 ? '#9a6700' : '#1a7f37';

  return `<div class="chart">
    <h4>This month's budget</h4>
    <div class="meter"><span style="width:${used.toFixed(1)}%;background:${colour}"></span></div>
    <div class="axis"><span>${e(usd(spentThisMonth))} spent</span><span>${Math.round(used)}%</span><span>${e(usd(limit))} limit</span></div>
  </div>`;
}

/**
 * THE CUSTOMER LIST. Everyone who has signed up, newest first.
 *
 * ★ THIS IS PERSONAL DATA and it is the reason the page carries a warning at the
 * top and the folder is git-ignored. It is here because Jon asked for it on
 * 25 August 2026, and because a list of nine people is a different kind of
 * useful from the number nine: it is who to email.
 *
 * Every column beside the address is computed from that person's own ledger
 * rows, so nothing here can disagree with the balance they see when they log in.
 */
function peopleTable(people, title, emptyMessage, internal = false) {
  if (!people?.length) return emptyMessage ? `<h4>${e(title)}</h4><p class="none">${e(emptyMessage)}</p>` : '';

  return `<h4>${e(title)}</h4>
    <div class="scroller"><table class="table"><thead><tr>
      <th>Email</th><th>${internal ? 'Why excluded' : 'Joined'}</th><th class="numeric">Credits</th><th class="numeric">Jobs</th><th class="numeric">Paid</th>
    </tr></thead><tbody>${people
      .map(
        (p) => `<tr>
          <td>${e(p.email)}${!internal && p.purchases > 0 ? '<span class="tag good">customer</span>' : ''}</td>
          <td>${internal ? `<span class="hint-inline">${e(p.internalWhy || 'internal')}</span>` : p.joined ? e(when(p.joined)) : '<span class="hint-inline">unknown</span>'}</td>
          <td class="numeric">${num(p.balance)}</td>
          <td class="numeric">${num(p.jobs)}</td>
          <td class="numeric">${p.paidCents ? e(money(p.paidCents)) : '—'}</td>
        </tr>`,
      )
      .join('')}</tbody></table></div>
    ${
      internal
        ? `<p class="footnote">These are excluded because they are named in <code>UC_INTERNAL_EMAILS</code>, use the
           un-claude.com domain, or are a plus-address alias. <strong>If one of these is actually a customer</strong>,
           remove it from <code>UC_INTERNAL_EMAILS</code> in <code>apps/web/.env.local</code> and refresh.</p>`
        : `<p class="footnote"><strong>Credits</strong> is what they have left to spend. <strong>Jobs</strong> is how
           many documents they have cleaned. <strong>Joined</strong> comes from their first free credits, because the
           accounts table does not record a join date.</p>`
    }`;
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
     ${
       d.money.internalPurchaseCount
         ? `<p class="footnote">${plural(d.money.internalPurchaseCount, 'purchase was', 'purchases were')} made by your own
            test accounts and ${d.money.internalPurchaseCount === 1 ? 'is' : 'are'} left out of the figures above
            (${e(money(d.money.internalPurchaseCents))} charged, ${e(money(d.money.internalRefundCents))} refunded).
            Counting a test purchase as revenue is how a business talks itself into a number it does not have.</p>`
         : ''
     }
     ${purchases}

     <h3>People</h3>
     ${rows([
       ['Real customers signed up', `<strong>${num(d.accounts.customerCount)}</strong>`, 'excludes your own test accounts'],
       [
         'Of those, have ever paid',
         `${num(d.accounts.buyers)}${d.accounts.customerCount ? ` <span class="hint-inline">${Math.round((d.accounts.buyers / d.accounts.customerCount) * 100)}%</span>` : ''}`,
       ],
       ['Your own test accounts', num(d.accounts.internalCount), 'listed separately below, and left out of every figure above'],
       ['Accounts of every kind', num(d.accounts.rowsInTable), 'includes anonymous visitors who never signed up'],
       ['Visitors who never signed up', num(d.accounts.guestsNeverRegistered), 'given free credits on arrival'],
     ])}
     ${peopleTable(d.accounts.customers, 'Real customers', 'Nobody outside the team has signed up yet.')}
     ${
       d.accounts.internalCount
         ? peopleTable(
             d.accounts.internal,
             'Your own accounts (not counted as customers)',
             '',
             true,
           )
         : ''
     }
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
       ['Jobs run, all time', `<strong>${num(d.runs.total)}</strong>`, 'a paid clean-up — the thing that costs a credit'],
       ['Today', num(d.runs.today)],
       ['Last 7 days', num(d.runs.last7)],
       ['Jobs that failed and were refunded', `${num(d.runs.refunded)}${d.runs.refundedToday ? ` <span class="tag warn">${d.runs.refundedToday} today</span>` : ''}`, 'the credit was returned'],
       ['Words processed', num(d.runs.wordsTotal)],
     ])}
     ${
       d.runs.freeScansRecorded
         ? ''
         : `<p class="footnote warnish"><strong>Free scans are not counted here, and cannot be.</strong>
            A scan costs no credit, so it writes nothing to this database — every one of the ${num(d.runs.total)} rows
            above is a paid clean-up. <strong>The only place a free scan is recorded is PostHog</strong>, as the
            <code>scan_completed</code> event, which is why the Behaviour panel below is worth switching on:
            it is the only way to see how many people try the product without buying.</p>`
     }
     <div class="chart"><h4>Jobs run, last 14 days</h4>${bars(d.runs.byDay, { colour: '#1f6feb' })}</div>

     <h3>Credits, by what caused them</h3>
     ${rows(creditRows)}
     ${rows([
       [
         'Credits people hold and have not spent',
         `<strong>${num(d.credits.outstanding)}</strong>`,
         'work already paid for or given away that we still owe',
       ],
     ])}

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

  /*
   * ★ A STEP SMALLER THAN A LATER ONE IS MARKED, NOT QUIETLY DRAWN.
   *
   * A funnel that grows in the middle looks like a broken chart, and the reader's
   * first instinct is to distrust the whole panel. It usually means one step is
   * recorded less often than the traffic reaching it — measured 25 August 2026,
   * "pasted their own text" showed 14 while 53 different people went on to scan
   * a document that was not the built-in example.
   *
   * The dashboard cannot fix that (the event lives in the website's code), and it
   * must not hide it either. So the step is labelled as a floor, which tells Jon
   * the true number is higher and stops him reading it as a collapse in interest.
   */
  const funnel = p.funnel
    .map((step, index) => {
      const width = top ? Math.max(1.5, (step.total / top) * 100) : 1.5;
      const laterMax = Math.max(0, ...p.funnel.slice(index + 1).map((s) => s.total));
      const undercounted = step.total < laterMax;

      return `<div class="funnel-step">
        <div class="funnel-label">${e(step.label)}${step.note ? `<span class="hint"> ${e(step.note)}</span>` : ''}${
          step.broken ? '<span class="tag warn">cannot be linked to the step above</span>' : ''
        }${undercounted ? '<span class="tag warn">at least this many — under-recorded</span>' : ''}</div>
        <div class="funnel-bar"><span style="width:${width.toFixed(1)}%"></span><b>${num(step.total)}</b></div>
      </div>`;
    })
    .join('');

  const anyUndercounted = p.funnel.some((s, i) => s.total < Math.max(0, ...p.funnel.slice(i + 1).map((x) => x.total)));

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
     <div class="banner ${p.traffic && p.traffic.internalPageviews > p.traffic.realPageviews ? 'warn' : ''}">
       <strong>Whose visits are counted.</strong> Only real people visiting ${e(p.host)}. Left out: this
       laptop, every preview copy of the site, anything identifying itself as a coding agent or a bot, and
       ${p.excludedCities?.length ? `visits from ${e(p.excludedCities.join(', '))}` : 'nowhere by location'}${p.excludedIps ? `, plus ${p.excludedIps} address${p.excludedIps === 1 ? '' : 'es'} you named` : ''}.
       ${
         p.traffic
           ? `<br><br><strong>${num(p.traffic.realPageviews)} of ${num(p.traffic.allPageviews)} page views were real</strong> —
              ${num(p.traffic.internalPageviews)} were yours or an agent's. Everything in this panel counts only the
              ${num(p.traffic.realPageviews)}.`
           : ''
       }
     </div>
     ${
       p.excludedCities?.length
         ? `<p class="footnote">Excluding a city also excludes any genuine customer who lives there. That is the right
            trade while most of the traffic is your own, and the wrong one later — worth revisiting once real visits
            clearly outnumber yours.</p>`
         : ''
     }
     <h3>The journey</h3>
     <div class="funnel">${funnel}</div>
     ${
       anyUndercounted
         ? `<p class="footnote warnish"><strong>One step above is smaller than a step below it.</strong>
            That is not a mistake in the chart — it means the website records that action less often than
            people actually do it, so the real number is higher. Read it as a floor. Fixing it means
            changing where the event fires on the site.</p>`
         : ''
     }
     ${
       p.scanSplit
         ? rows([
             [
               'Scans of their own document',
               `<strong>${num(p.scanSplit.own.total)}</strong> <span class="hint-inline">by ${num(p.scanSplit.own.people)} visitors</span>`,
               'somebody actually trying it on their own work',
             ],
             [
               'Scans of the built-in example',
               `${num(p.scanSplit.sample.total)} <span class="hint-inline">by ${num(p.scanSplit.sample.people)} visitors</span>`,
               'the demo runs by itself when the page loads, so this is closer to "looked at it"',
             ],
           ])
         : ''
     }
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

/**
 * ★ THE FUNNEL. Jon's instruction, 30 September 2026: the page should be
 * something he can look at and glean a real insight from, and this is the part
 * that carries that weight.
 *
 * ONE DENOMINATOR, NAMED ONCE. Every bar is a share of unique visitors, so the
 * bars are comparable to each other rather than each being a share of the step
 * above. A step-over-step funnel hides the thing that actually matters here,
 * which is how few people get out the far end of a very wide top.
 *
 * THE SOURCE IS PRINTED ON EVERY ROW because the three do not deserve equal
 * trust: PostHog is a sample of browsers with ad blockers missing from it,
 * Stripe is money and is exact, the database is exact. A page that mixed them
 * silently would be inviting a wrong conclusion.
 */
function funnelPanel(steps, posthog) {
  if (!steps.length) return '';

  const top = steps[0]?.people || 0;
  const width = (n) => (top && n ? Math.max(0.6, (100 * n) / top) : 0);

  const body = steps
    .map((st) => {
      const known = st.people !== null && st.people !== undefined;
      const pct = st.pct === null || st.pct === undefined ? null : st.pct;
      // Under one percent needs two decimals or every late step reads "0%".
      const pctText = pct === null ? '—' : pct >= 10 ? `${pct.toFixed(0)}%` : pct >= 1 ? `${pct.toFixed(1)}%` : `${pct.toFixed(2)}%`;

      return `<div class="fstep">
        <div class="fname">${e(st.label)}<small>${e(st.note)} · ${e(st.source)}</small></div>
        <div class="ftrack"><div class="ffill${pct !== null && pct < 5 ? ' thin' : ''}" style="width:${width(st.people).toFixed(2)}%"></div></div>
        <div class="fnums"><b>${known ? num(st.people) : '—'}</b><span>${pctText}</span></div>
      </div>`;
    })
    .join('');

  const sources = posthog.ok && posthog.sources?.length
    ? (() => {
        const most = posthog.sources[0].people || 1;
        return `<h3>Where they arrived from</h3>
          <p class="explain">Returns from Google sign-in, from Stripe checkout and from the site's own
          pages are excluded, because those are the same visitor coming back rather than a new one.</p>
          <div class="srcs">${posthog.sources
            .map(
              (r) => `<div class="src">
                <div>${e(r.src)}</div>
                <div class="t"><div class="f" style="width:${((100 * r.people) / most).toFixed(1)}%"></div></div>
                <div class="n">${num(r.people)}</div>
              </div>`,
            )
            .join('')}</div>`;
      })()
    : '';

  return panel(
    'The funnel',
    'PostHog, Stripe and our database · last 30 days',
    `<p class="explain">Every bar is a share of <strong>unique visitors</strong>, not of the step above it.
     The steps do not nest perfectly and are not meant to: somebody can hit a paid moment without
     sanitising anything, by arriving on a balance they emptied last week.</p>
     <div class="funnel">${body}</div>
     ${sources}`,
  );
}

export function renderPage({ generatedAt, alerts, headline, funnelSteps = [], stripe, gateway, database, posthog, live, token }) {
  const people = database.ok ? database.accounts.withEmail : 0;

  /*
   * LIVE MODE GETS A REFRESH CONTROL AND A HONEST TIMESTAMP.
   *
   * When served by `serve.mjs`, every load re-reads all four sources, so the
   * page is genuinely current and the button simply reloads it. When written to
   * a file by `run.mjs` it is frozen, and says so — the difference must be
   * obvious, because acting on a stale revenue figure is exactly the mistake
   * this page exists to prevent.
   */
  const freshness = live
    ? `<p class="stamp">Live. Read <b>${e(when(generatedAt))}</b> — every refresh fetches everything again.
       <button class="refresh" onclick="location.reload()">Refresh now</button>
       <label class="auto"><input type="checkbox" id="auto"> refresh every minute</label></p>`
    : `<p class="stamp">A frozen snapshot taken <b>${e(when(generatedAt))}</b>. It will never change —
       run the command again for fresh numbers.</p>`;

  const autoScript = live
    ? `<script>
        // Opt-in only, and remembered for the session so a refresh does not
        // switch it off. Sixty seconds is slow enough not to hammer four APIs.
        var box = document.getElementById('auto');
        if (sessionStorage.getItem('auto') === '1') box.checked = true;
        var timer = box.checked ? setTimeout(function(){ location.reload(); }, 60000) : null;
        box.addEventListener('change', function () {
          sessionStorage.setItem('auto', box.checked ? '1' : '0');
          if (box.checked) { timer = setTimeout(function(){ location.reload(); }, 60000); }
          else { clearTimeout(timer); }
        });
      </script>`
    : '';

  const privacyNote = people
    ? `<div class="alert privacy"><span class="alert-dot"></span><div><strong>This page lists ${people}
       customer email address${people === 1 ? '' : 'es'}.</strong> Treat it like the Stripe dashboard —
       ${live ? 'it is served only to this computer' : 'the file is kept out of version control'}, and it should not
       be shared or emailed.</div></div>`
    : '';
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

  /* Four numbers since 30 September 2026 (was six). Four across on a desktop,
     two by two on a phone, so no card is ever stranded alone on a row. */
  .bigs { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 28px; }
  @media (max-width: 900px) { .bigs { grid-template-columns: repeat(2, 1fr); } }
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

  .alert.privacy { background: #f6f0ff; border-color: #e0d0f7; margin-bottom: 24px; font-size: 14px; }
  .alert.privacy .alert-dot { background: #8250df; }

  .refresh {
    font: inherit; font-size: 13px; font-weight: 600; margin-left: 10px; padding: 4px 12px;
    border: 1px solid var(--line); border-radius: 6px; background: var(--panel); color: var(--ink); cursor: pointer;
  }
  .refresh:hover { background: #eaeef2; }
  .auto { font-size: 13px; color: var(--dim); margin-left: 10px; white-space: nowrap; }
  .auto input { vertical-align: middle; }

  /* The monthly budget meter. */
  .meter { background: var(--panel); border: 1px solid var(--line); border-radius: 6px; height: 20px; overflow: hidden; }
  .meter span { display: block; height: 100%; border-radius: 5px 0 0 5px; }

  /* The customer list can outgrow a phone. Let the table scroll, not the page. */
  .scroller { overflow-x: auto; -webkit-overflow-scrolling: touch; }
  .scroller .table { min-width: 460px; }

  .tag.good { background: var(--green-bg); color: var(--green); }

  .setup { background: var(--blue-bg); border: 1px solid #b6e3ff; border-radius: 8px; padding: 16px; }
  .setup-why { margin: 0 0 10px; font-weight: 600; }
  .steps { margin: 6px 0 0; padding-left: 22px; font-size: 14.5px; }
  .steps li { margin-bottom: 8px; }
  code { background: #eef1f4; border-radius: 4px; padding: 1px 5px; font-size: 13px; }
  code.block { display: block; margin-top: 5px; padding: 8px 10px; overflow-x: auto; white-space: nowrap; }

  .none { color: var(--faint); font-size: 14px; font-style: italic; }
  .footnote { font-size: 13px; color: var(--dim); margin-top: 12px; padding-top: 10px; border-top: 1px solid #eef1f4; }
  .footnote.warnish { background: var(--amber-bg); border: 1px solid #f0e2a3; border-radius: 8px; padding: 10px 12px; color: var(--ink); }

  /* THE FUNNEL. A number, a bar and a percentage on one line, so the shape is
     readable at a glance and the exact figures are still there to be read. */
  .funnel { display: grid; gap: 2px; margin: 4px 0 0; }
  .fstep { display: grid; grid-template-columns: 190px 1fr 86px; gap: 12px; align-items: center; padding: 9px 0; border-bottom: 1px solid var(--line); }
  .fstep:last-child { border-bottom: 0; }
  .fname { font-weight: 600; font-size: 14.5px; }
  .fname small { display: block; font-weight: 400; color: var(--faint); font-size: 12px; line-height: 1.35; margin-top: 1px; }
  .ftrack { background: var(--panel); border-radius: 4px; height: 22px; position: relative; overflow: hidden; border: 1px solid var(--line); }
  .ffill { position: absolute; inset: 0 auto 0 0; background: var(--blue); opacity: 0.82; border-radius: 3px; min-width: 2px; }
  .ffill.thin { background: var(--green); }
  .fnums { text-align: right; font-variant-numeric: tabular-nums; }
  .fnums b { font-size: 17px; }
  .fnums span { display: block; color: var(--dim); font-size: 12.5px; }
  @media (max-width: 620px) {
    .fstep { grid-template-columns: 1fr 78px; }
    .ftrack { grid-column: 1 / -1; order: 3; height: 14px; }
  }
  .srcs { display: grid; gap: 1px; }
  .src { display: grid; grid-template-columns: 1fr 120px 60px; gap: 10px; align-items: center; padding: 6px 0; border-bottom: 1px solid var(--line); font-size: 14px; }
  .src:last-child { border-bottom: 0; }
  .src .t { background: var(--panel); height: 10px; border-radius: 3px; position: relative; overflow: hidden; border: 1px solid var(--line); }
  .src .f { position: absolute; inset: 0 auto 0 0; background: var(--dim); border-radius: 2px; }
  .src .n { text-align: right; font-variant-numeric: tabular-nums; color: var(--dim); }

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
    ${freshness}
  </header>

  ${alertStrip}
  ${privacyNote}

  <div class="bigs">${headline.map(headlineCard).join('')}</div>

  ${/*
     ORDER CHANGED 30 SEPTEMBER 2026, and the order IS the argument. It used to
     run Stripe, gateway, database, PostHog — which is the order the four
     sources were built in, not the order anybody reads them in. Now it runs
     from the question Jon actually opens this page with ("is it working and
     where does it leak?") down to the one he checks monthly ("what does the AI
     cost?"). The gateway panel is last because it is a cost, and a cost of
     under two dollars all time has no business above the funnel.
  */ ''}
  ${funnelPanel(funnelSteps, posthog)}
  ${stripePanel(stripe)}
  ${databasePanel(database)}
  ${posthogPanel(posthog)}
  ${gatewayPanel(gateway)}

  <footer>Generated on this machine and never uploaded. Contains no keys or passwords.</footer>
</div>
${autoScript}`;
}
