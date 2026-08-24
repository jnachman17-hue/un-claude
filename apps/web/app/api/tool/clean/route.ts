/**
 * POST /api/tool/clean
 *
 * The browser's only way to reach the engine's clean. Adds the shared key
 * server side. See the scan route for why this is not at /api/clean.
 *
 * CREDITS ARE ENFORCED HERE, 04 entry 97, and here rather than in the
 * interface because the interface is a suggestion. Until this session,
 * anyone with curl could run rewrites on our bill; now the order of events
 * on every request is:
 *
 *   1. A session, or 401. The browser creates an anonymous session on first
 *      use and retries; curl without cookies gets nothing.
 *   2. Grants, idempotent, so a first-time guest is holding their welcome
 *      credits by the time the price is checked.
 *   3. The rewrite needs a real account: anonymous + layer_b is 403. The
 *      free guest credits deliberately only reach the layers that cost us
 *      nothing to run.
 *   4. The price, computed HERE from the payload, never trusted from the
 *      client: a file is one credit, prose is one per 1,000 words rounded
 *      up, and anything being rewritten is priced by its words even if it
 *      arrived wearing a file name.
 *   5. spend_credits, atomic in the database, or 402 with the exact numbers
 *      ("needed 3, have 2") for the interface to show.
 *   6. The engine. If it fails after the spend, the credits go straight
 *      back: "a failed operation costs nothing" is a pricing page promise.
 *
 * The scan route stays free and sessionless on purpose: scanning is the
 * hook, and it costs us nothing.
 */
import { cookies } from 'next/headers';

import { getSupabaseServerClient } from '@kit/supabase/server-client';

import { clean } from '~/lib/engine/client';
import { buildReceipt } from '~/lib/engine/receipt';
import {
  countWords,
  creditsForWords,
  devBypass,
  ensureGrants,
  hasConverted,
  recordRunCost,
  refund,
  spend,
} from '~/lib/server/credits';
import { clientIp, rateLimit } from '~/lib/server/rate-limit';

/**
 * Layer that costs credits: ~10 requests per minute per account. Keyed on the
 * account, not the IP, so a shared campus or office network (hundreds of real
 * students behind one IP — this product's core audience) is never throttled as
 * a group. security-audit.md finding 4.
 */
const CLEAN_PER_MINUTE = 10;

/** Where the signed-out browser remembers which guest account is its. */
const GUEST_COOKIE = 'uc-guest';

/*
 * WHICH FILES THE ENGINE TREATS AS TEXT, and therefore which ones the paid
 * rewrite actually runs on.
 *
 * THIS LIST MUST MIRROR `TEXT_EXTS` IN engine/format_dispatch.py. When it did
 * not, the price and the work disagreed in BOTH directions, and both were
 * found by the payment audit on 21 August 2026:
 *
 *   - The route recognised only .txt/.md/.markdown/.text. The engine also
 *     treats .csv .json .js .py .rs .go .css .yaml .yml .toml as text. So a
 *     100,000-word essay saved as `essay.csv` was priced as "a file, one flat
 *     credit" while the engine ran the full rewrite on it: a 100x undercharge
 *     on the only operation that costs us real money.
 *
 *   - In the other direction, .md and .markdown are CONTAINERS to the engine
 *     (CONTAINER_EXTS), and the container path never runs layer B at all. The
 *     route charged per 1,000 words for a rewrite that was silently not
 *     performed — the customer paying and not receiving.
 *
 * `.mdx` is in the engine's container set too and was never in this route's
 * list, so it was already priced correctly as a flat file.
 */
const ENGINE_TEXT_EXTS = [
  '.txt',
  '.text',
  '.css',
  '.js',
  '.py',
  '.rs',
  '.go',
  '.json',
  '.yaml',
  '.yml',
  '.toml',
  '.csv',
];

function isEngineText(name: string): boolean {
  const lower = name.toLowerCase();

  return ENGINE_TEXT_EXTS.some((ext) => lower.endsWith(ext));
}

/** Cookie lifetime: a year. The guest's credits should outlive a holiday. */
const GUEST_COOKIE_SECONDS = 60 * 60 * 24 * 365;

/**
 * Layer B costs real money on every single run. It stays flag-gated in
 * production so deploying this file cannot start a bill on its own.
 */
function layerBAllowed(): boolean {
  // Trimmed and lowercased. A value set from a shell without care arrives as
  // "true\n", which does not equal "true", and the flag would silently do the
  // opposite of what was intended with nothing to show why. Same failure that
  // broke the engine key, so it is closed here before it happens.
  const flag = (process.env.UC_ENABLE_LAYER_B ?? '').trim().toLowerCase();
  if (flag === 'true') return true;
  if (flag === 'false') return false;
  return process.env.VERCEL_ENV !== 'production';
}

function fail(code: string, message: string, status = 400, extra?: object) {
  return Response.json({ ok: false, code, message, ...extra }, { status });
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return fail('bad_json', 'That request could not be read. Please try again.');
  }

  const { file, name, layer_b } = (body ?? {}) as {
    file?: string;
    name?: string;
    layer_b?: boolean;
  };

  if (typeof file !== 'string' || file.length === 0) {
    return fail('no_file', 'Nothing was sent. Paste some text or choose a file.');
  }

  // The engine caps uploads at 5 MB; this refuses anything over that cap
  // before it costs a network round trip, memory, or money. Base64 inflates
  // by 4/3, so 7.5M characters is ~5.5 MB.
  if (file.length > 7_500_000) {
    return fail(
      'too_large',
      'That file is over the 5 MB limit. Try a smaller one.',
      413,
    );
  }

  const wantsRewrite = layer_b === true;

  if (wantsRewrite && !layerBAllowed()) {
    return fail(
      'layer_b_unavailable',
      'The rewrite is not switched on yet. Everything else ran.',
      503,
    );
  }

  const inputName = typeof name === 'string' ? name : 'paste.txt';
  const isFile = inputName !== 'paste.txt';
  const bypass = devBypass(request);

  const supabase = getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let charged = 0;
  let balance: number | null = null;
  /** The ledger row this job's credit came off, so its cost can be attached. */
  let ledgerId: number | null = null;

  if (!bypass) {
    if (!user) {
      return fail(
        'no_session',
        'Your session expired. Please try again.',
        401,
      );
    }

    const isAnonymous = user.is_anonymous === true;

    // Per-account rate limit on the credit-spending path. Before any grant or
    // spend, so a hammering account is turned away cheaply. Keyed on the
    // account so shared IPs are unaffected. security-audit.md finding 4.
    if (!(await rateLimit(`clean:acct:${user.id}`, CLEAN_PER_MINUTE, 60))) {
      return fail(
        'rate_limited',
        'You are going a little fast. Wait a moment and try again.',
        429,
      );
    }

    /*
     * IS THIS A REAL ACCOUNT CONTINUING A GUEST SESSION? If so the welcome
     * grant is withheld, because the guest account was already paid it.
     *
     * THIS USED TO READ THE COOKIE ALONE, AND THAT WAS THE BUG — the same one
     * `guest-merge-double-runs.md` records as defect 2, fixed in /api/credits
     * and missed here. `/api/credits` DELETES `uc-guest` the moment the merge
     * completes, so by the time anyone sanitises, the cookie is gone, this
     * route concluded "not a conversion", and `ensureGrants` paid the +2
     * welcome the account had just been correctly denied. Every converting
     * user collected 2 free credits, spendable on the rewrite, which is the
     * only layer that costs real money. Found by the payment audit,
     * 21 August 2026; `ensureGrants`' own docblock warns against exactly this.
     *
     * The durable `guest_conversions` record is the source of truth. The cookie
     * survives only as the pre-migration fallback, matching /api/credits.
     */
    const cookieStore = await cookies();
    const guestId = cookieStore.get(GUEST_COOKIE)?.value;
    const cookieSaysConversion =
      !!guestId && /^[0-9a-f-]{36}$/.test(guestId) && guestId !== user.id;

    const isConversion =
      !isAnonymous && (cookieSaysConversion || (await hasConverted(user.id)));

    await ensureGrants({
      id: user.id,
      isAnonymous,
      email: user.email,
      isConversion,
      ip: clientIp(request),
    });

    if (isAnonymous) {
      // The coat-check ticket: this cookie is how the guest's credits find
      // them again on the next visit, and how they follow them into a real
      // account later. HttpOnly because no script has any business reading it.
      cookieStore.set(GUEST_COOKIE, user.id, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge: GUEST_COOKIE_SECONDS,
        path: '/',
      });

      /*
       * THE REWRITE IS NO LONGER WALLED OFF FROM GUESTS, and this reverses
       * both entry 67's "signed out: no rewrite" and this session's own
       * first cut of it. 04 entry 98.
       *
       * Jon hit the collision immediately: the box said "2 free credits",
       * he pasted 700 words, and the only thing he could do with those
       * credits was be told to make an account. Pasted text always carries
       * prose, so a guest's credits could never buy anything they came for.
       * A promise of credits that cannot be spent is worse than no promise.
       *
       * The cost of opening it is genuinely small: the rewrite runs at
       * about 0.06 cents per 1,000 words, so a guest's entire welcome
       * allowance is roughly a tenth of a cent, and Turnstile now guards
       * anonymous sign-in against scripted farming. Against that, the
       * product's main event becomes experienceable before signup, which is
       * the antidote to Jon's own worry that nobody will pay for a rewrite
       * they have never seen work.
       */
    }

    /**
     * The price, from the payload itself, matching what the engine will
     * actually do. The engine runs the rewrite only on text-kind inputs,
     * measured in server.py (06 row 74): containers and images silently skip
     * layer B whatever the request says. So:
     *
     *   prose, and any text-like file the rewrite WILL run on:
     *     one credit per 1,000 words, rounded up. Pricing by words here is
     *     also what stops a 40,000 word paste renamed "essay.txt" from
     *     buying a 40 credit rewrite for 1.
     *   every other file (docx, png, jpg): one flat credit, 04 entry 71,
     *     because the work done on it costs us nothing either way.
     */
    const textLike = !isFile || isEngineText(inputName);

    let wordsIn = 0;

    if (textLike) {
      try {
        wordsIn = countWords(Buffer.from(file, 'base64').toString('utf8'));
      } catch {
        wordsIn = 0;
      }
    }

    const cost =
      textLike && wantsRewrite ? creditsForWords(wordsIn) : isFile ? 1 : creditsForWords(wordsIn);

    const spent = await spend(user.id, cost, {
      endpoint: 'clean',
      inputKind: isFile ? 'file' : 'text',
      wordsIn,
    });

    if (!spent.ok) {
      return fail(
        'insufficient_credits',
        `This needs ${spent.needed} ${spent.needed === 1 ? 'credit' : 'credits'} and you have ${spent.have}.`,
        402,
        { needed: spent.needed, have: spent.have, isAnonymous },
      );
    }

    charged = cost;
    balance = spent.balance;
    ledgerId = spent.ledgerId;
  }

  const result = await clean(
    { file, name: inputName },
    { layer_b: wantsRewrite },
  );

  if (!result.ok) {
    // The promise on the pricing page: a failed operation costs nothing.
    if (!bypass && user && charged > 0) {
      await refund(user.id, charged);
      balance = balance === null ? null : balance + charged;
    }

    return Response.json(result, { status: 400 });
  }

  /*
   * WHAT THIS RUN COST US, written down beside the credit it charged.
   *
   * The privacy policy tells every customer their credit history records "what
   * the run cost us to perform", and until 23 August 2026 nothing wrote it: the
   * column was on the ledger, the ledger refuses every UPDATE, and the cost is
   * not known until after the credit has been spent. f1-audit.md finding Q.
   *
   * It never throws and it never fails the request — see recordRunCost.
   */
  if (ledgerId !== null) {
    await recordRunCost(ledgerId, result);
  }

  /*
   * DID ANYBODY ACTUALLY RECEIVE THIS? f1-audit.md, "THE CONNECTION-DROP CASE".
   *
   * The student on a train, the phone that locks, the tab closed by accident.
   * With jobs running for minutes that window is wide, and until now it cost
   * the customer their credits: they were charged, the work ran, and the answer
   * was handed to a browser that had gone. Watched for eight minutes against a
   * known three-minute refund window, no refund ever came.
   *
   * WHERE THE DEPENDENCY WAS, because it is not where it looks. The refund does
   * NOT die with the connection — measured on the live site on 23 August 2026:
   * a job whose client dropped at 3 seconds still wrote its refund row a second
   * later, so this handler keeps running after the socket closes. What depended
   * on the client was the DEFINITION OF FAILURE. The only thing that triggered a
   * refund was `!result.ok`, meaning the ENGINE said no. Nothing ever asked
   * whether the answer reached anybody. A dropped connection is a delivery
   * failure and not an engine failure, so it took the success path and the
   * credit stayed spent.
   *
   * Reproduced, same site, same day: a 250,000 word layer A job with the client
   * dropped at 3 seconds took 250 credits and wrote no refund row.
   *
   * THE COST ROW IS WRITTEN FIRST, DELIBERATELY. If the rewrite ran we really
   * did pay for it, and giving the credit back does not make that spend
   * disappear. Recording it above and refunding here is what makes the loss
   * countable instead of invisible.
   */
  if (!bypass && user && charged > 0 && request.signal.aborted) {
    await refund(user.id, charged);
    balance = balance === null ? null : balance + charged;

    console.warn(
      `CLIENT GONE: ${charged} credit(s) refunded to ${user.id.slice(0, 8)} — ` +
        `the job finished but the connection had already closed, so nothing ` +
        `was delivered. The run itself was still paid for at the gateway.`,
    );

    /*
     * Nobody is listening, so this response is discarded. It is written out
     * anyway rather than left to chance: a body that says what happened is
     * what a log, a proxy or a future retry will see.
     */
    return Response.json(
      {
        ok: false,
        code: 'client_gone',
        message: 'The connection closed before this finished. Nothing was charged.',
      },
      { status: 499 },
    );
  }

  /**
   * The receipt is computed here rather than in the engine, because it is a
   * comparison of two texts we already hold and it needs no model call, no
   * network and no cost. It describes what the rewrite DID. It is never a
   * measure of whether the watermark went, because nobody can measure that.
   */
  if (wantsRewrite && result.report?.layer_b) {
    try {
      const before = Buffer.from(file, 'base64').toString('utf8');
      const after = Buffer.from(result.cleaned, 'base64').toString('utf8');

      (result.report as Record<string, unknown>).receipt = buildReceipt(
        before,
        after,
        result.report.layer_b.figures_to_check ?? [],
      );
    } catch {
      // A missing receipt is a missing receipt. It must never fail the request
      // for work the engine already did and the user is waiting on.
    }
  }

  return Response.json(
    { ...result, credits: { charged, balance } },
    { status: 200 },
  );
}
