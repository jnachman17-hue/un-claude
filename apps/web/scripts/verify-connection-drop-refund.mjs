/**
 * WHEN THE CUSTOMER'S CONNECTION DROPS, DO THEIR CREDITS COME BACK? Lane B's
 * M-6, re-run by the route session, 24 August 2026.
 *
 *   cd apps/web && node scripts/verify-connection-drop-refund.mjs
 *   UC_SITE=https://un-claude.com node scripts/verify-connection-drop-refund.mjs
 *
 * THIS SCRIPT IS NEW, AND THAT IS WORTH SAYING. Lane B's write-up and the board
 * both describe re-running "a script that already exists". It does not exist in
 * this repository: there is no abort test in scripts/ and git has no record of
 * one being deleted. It was a throwaway. This is it, written down.
 *
 * WHAT IT COSTS: NOTHING. The job asks for the free layers only, so no model is
 * ever called. The credits it spends are minted onto a throwaway account by
 * this script and deleted with it.
 *
 * WHAT IT IS ACTUALLY ASKING. The route already refunds a job nobody received;
 * that code shipped on 24 August and did nothing, because Vercel request
 * cancellation is OPT-IN and this project declared nothing, so
 * `request.signal.aborted` was always false. The route session added
 * `supportsCancellation` for `app/api/tool/clean/route.ts` to vercel.json.
 *
 *   *** A PASS AGAINST A LOCAL DEV SERVER PROVES ONLY THAT THIS SCRIPT AND THE
 *   *** ROUTE'S OWN LOGIC WORK. It says NOTHING about Vercel, because a local
 *   *** Node server propagates a client disconnect on its own and needs no
 *   *** switch. The only run that answers the real question is one against
 *   *** production, AFTER Jon deploys.
 *
 * If the refund row appears on production, M-6 is closed and no new dependency
 * is needed. If it does not, the switch does not reach an App Router route, and
 * the next step is `waitUntil` from `@vercel/functions` — a new dependency, and
 * therefore Jon's call, not this session's.
 */
import { balanceOf, destroy, forgetAllLaneClaims } from './_lane-b-throwaway.mjs';
import { ledgerRows, signedIn, SITE } from './_route-session-harness.mjs';

/** 250,000 words of layer A work. Free to run, and slow enough to interrupt. */
const SENTENCE = 'The committee met and the minutes were circulated the following week. ';
const PASTE = SENTENCE.repeat(Math.ceil(250_000 / SENTENCE.trim().split(/\s+/).length));
const WORDS = PASTE.split(/\s+/).filter(Boolean).length;

const DROP_AT_MS = 3000;

let failures = 0;

function report(name, ok, detail) {
  if (!ok) failures += 1;
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${name}`);
  if (detail) console.log(`        ${detail}`);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function look(account, label) {
  const rows = await ledgerRows(account.id);
  const spends = rows.filter((r) => r.reason === 'spend').length;
  const refunds = rows.filter((r) => r.reason === 'operation_refund').length;

  console.log(
    `  ${label.padEnd(6)} balance ${String(await balanceOf(account.id)).padStart(4)}` +
      `  spend rows ${spends}  operation_refund rows ${refunds}`,
  );

  return { rows, spends, refunds };
}

async function run(account, { drop }) {
  const controller = new AbortController();
  let timer;

  if (drop) {
    timer = setTimeout(() => {
      console.log(`\n>>> connection dropped by the client at ${DROP_AT_MS}ms`);
      controller.abort();
    }, DROP_AT_MS);
  }

  const started = Date.now();

  try {
    const res = await fetch(`${SITE}/api/tool/clean`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', cookie: account.cookies },
      body: JSON.stringify({ file: Buffer.from(PASTE, 'utf8').toString('base64'), name: 'paste.txt', layer_b: false }),
      signal: controller.signal,
    });

    await res.text();
    console.log(`client saw: HTTP ${res.status} after ${Date.now() - started}ms`);
  } catch (err) {
    console.log(`client saw: ${err.name} after ${Date.now() - started}ms: ${err.message}`);
  } finally {
    clearTimeout(timer);
  }
}

console.log('\nDOES A DROPPED CONNECTION GET ITS CREDITS BACK?');
console.log('='.repeat(72));
console.log(`  site   ${SITE}`);
console.log(`  paste  ${WORDS.toLocaleString('en-US')} words, layer A only, no model call`);

if (!SITE.includes('un-claude.com')) {
  console.log('\n  NOTE: this is not production. A pass here says nothing about Vercel.');
}

const dropped = await signedIn('drop', 400);
console.log(`  account ${dropped.id.slice(0, 8)}`);

try {
  console.log('\n=== the connection DROPS at 3s. The credits must come back ===');
  await run(dropped, { drop: true });

  await sleep(8000);
  await look(dropped, '+8s');
  await sleep(67000);
  const late = await look(dropped, '+75s');

  console.log('\n--- the ledger ---');
  for (const r of late.rows) {
    console.log(
      '   ',
      String(r.delta > 0 ? '+' + r.delta : r.delta).padStart(5),
      String(r.reason).padEnd(18),
      String(r.words_in ?? '-').padStart(7),
      'words',
    );
  }
  console.log(`    SUM = ${late.rows.reduce((s, r) => s + r.delta, 0)}`);

  report(
    'a job nobody received was refunded',
    late.refunds >= 1,
    late.refunds >= 1
      ? undefined
      : 'no operation_refund row. request.signal.aborted was false, so the ' +
        'cancellation switch did not reach this route.',
  );
} finally {
  await destroy(dropped);
}

const connected = await signedIn('stay', 400);

try {
  console.log('\n=== the SAME job, connection kept open. There must be NO refund ===');
  console.log(`  account ${connected.id.slice(0, 8)}`);
  await run(connected, { drop: false });

  await sleep(8000);
  const after = await look(connected, '+8s');

  report(
    'a delivered job is charged and NOT refunded',
    after.spends === 1 && after.refunds === 0,
    `spend rows ${after.spends}, operation_refund rows ${after.refunds}`,
  );
} finally {
  await destroy(connected);
  const cleared = await forgetAllLaneClaims();
  console.log(`\n  throwaway accounts deleted; ${cleared} grant-claim row(s) cleared.`);
}

console.log('\n' + '='.repeat(72));
console.log(failures === 0 ? '  ALL PASS\n' : `  ${failures} FAILED\n`);
process.exit(failures === 0 ? 0 : 1);
