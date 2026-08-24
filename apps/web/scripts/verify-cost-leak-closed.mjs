/**
 * DO WE STILL SEND OUR OWN UNIT ECONOMICS TO THE CUSTOMER'S BROWSER, AND DOES
 * THE RUN-COST WRITER STILL GET THEM? Lane A's E-12. Route session, 24 Aug 2026.
 *
 *   cd apps/web && node scripts/verify-cost-leak-closed.mjs
 *
 * THE TWO HALVES ARE ONE QUESTION, WHICH IS THE WHOLE POINT. Stripping the
 * figures is four lines; stripping them in the wrong place breaks a live
 * feature. `recordRunCost` reads `report.layer_b.usage` server side and writes
 * the `run_costs` row that makes the privacy policy's promise to record "what
 * the run cost us" true. So this asks BOTH:
 *
 *   1. the browser's copy of the reply carries no cost and no token counts
 *   2. a run_costs row is STILL written, for the SAME run, with real numbers
 *
 * Either one alone proves nothing. Passing the first by stripping earlier would
 * fail the second, and that is exactly the mistake this test exists to catch.
 *
 * WHAT IS REAL HERE AND WHAT IS NOT. The route, the credits code, the database,
 * the Python engine, its chunker and its usage accounting are all the real
 * thing. The model at the far end is `_stand-in-gateway.mjs`, because no
 * gateway key exists on this machine. It answers with the token counts and cost
 * from the real production run Lane A captured, so the figures being hunted for
 * are the figures that actually leaked.
 */
import {
  b64,
  everyKey,
  ledgerRows,
  MONEY_KEYS,
  postClean,
  runCostsFor,
  signedIn,
  SITE,
} from './_route-session-harness.mjs';
import { destroy, forgetAllLaneClaims } from './_lane-b-throwaway.mjs';

const PASTE = [
  'The committee met on 14 March 1946 to consider the proposal. Delegates from',
  'eleven countries attended, and the vote was carried by a margin of three.',
  'Orwell wrote that political language is designed to make lies sound truthful.',
  'The minutes were circulated the following week and no objection was recorded.',
  'A second session was scheduled for the autumn, though it never took place.',
].join(' ');

let failures = 0;

function report(name, ok, detail) {
  if (!ok) failures += 1;
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${name}`);
  if (detail) console.log(`        ${detail}`);
}

console.log('\nDOES A REWRITE STILL TELL THE BROWSER WHAT IT COST US?');
console.log('='.repeat(72));
console.log(`  site   ${SITE}`);

const account = await signedIn('cost', 50);

console.log(`  account ${account.id.slice(0, 8)}`);

try {
  const { status, body } = await postClean(account.cookies, {
    file: b64(PASTE),
    name: 'paste.txt',
    layer_b: true,
  });

  console.log(`\n--- HTTP ${status} --- the response body the browser receives, in full`);
  console.log(
    JSON.stringify(
      { ...body, cleaned: `<${(body.cleaned ?? '').length} base64 characters>` },
      null,
      2,
    ),
  );

  const keys = everyKey(body);
  const leaked = MONEY_KEYS.filter((k) => keys.has(k));

  console.log('\n--- report.layer_b.usage, as the browser now sees it ---');
  console.log(JSON.stringify(body.report?.layer_b?.usage, null, 2));

  report(
    'the browser is sent no cost figure and no token counts',
    leaked.length === 0,
    leaked.length ? `still present anywhere in the body: ${leaked.join(', ')}` : undefined,
  );

  report(
    'the operational counts it does not pay for are still there',
    !!body.report?.layer_b?.usage &&
      ['chunks', 'attempts', 'retries'].every(
        (k) => typeof body.report.layer_b.usage[k] === 'number',
      ),
    undefined,
  );

  const rows = await ledgerRows(account.id);
  const spend = rows.filter((r) => r.reason === 'spend');

  console.log('\n--- the ledger for this account ---');
  for (const r of rows) {
    console.log(
      '   ',
      String(r.delta > 0 ? '+' + r.delta : r.delta).padStart(5),
      String(r.reason).padEnd(18),
      String(r.endpoint ?? '-').padEnd(8),
      String(r.words_in ?? '-').padStart(6),
      'words',
      ` (ledger id ${r.id})`,
    );
  }

  const costs = await runCostsFor(spend.map((r) => r.id));

  console.log('\n--- run_costs, written SERVER SIDE for that same spend ---');
  console.log(JSON.stringify(costs, null, 2));

  const row = costs[0];

  report(
    'a run_costs row was still written for this run',
    !!row,
    row ? undefined : 'no row: the strip happened before the writer could read the figures',
  );

  report(
    'and it holds the real numbers, not nulls',
    !!row && row.total_tokens === 862 && Number(row.cost_usd) === 9.6e-5 && row.model_calls === 1,
    row
      ? `model_calls=${row.model_calls} total_tokens=${row.total_tokens} cost_usd=${row.cost_usd}`
      : undefined,
  );
} finally {
  await destroy(account);
  const cleared = await forgetAllLaneClaims();
  console.log(`\n  throwaway account deleted; ${cleared} grant-claim row(s) cleared.`);
}

console.log('\n' + '='.repeat(72));
console.log(failures === 0 ? '  ALL PASS\n' : `  ${failures} FAILED\n`);
process.exit(failures === 0 ? 0 : 1);
