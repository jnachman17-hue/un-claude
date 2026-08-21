import Link from 'next/link';
import { connection } from 'next/server';

import { PageBody, PageHeader } from '@kit/ui/page';
import { getSupabaseServerClient } from '@kit/supabase/server-client';

/**
 * The wallet. 04 entry 97, shaped by 03-pricing.md section 11b: the balance
 * with the word count beside it, the full history with its reasons, "credits
 * never expire" said plainly, and no dead Buy button while Stripe is not
 * connected: a link to the pricing page instead.
 *
 * Reads happen with the visitor's own session: the ledger's row level
 * security serves an account its own rows and nothing else, so this page
 * needs no service key and cannot leak anyone else's history.
 */

/** The ledger reasons, translated into wallet language. */
const REASON_LABEL: Record<string, string> = {
  anon_grant: 'Welcome credits',
  signup_grant: 'Account credits',
  purchase: 'Purchase',
  spend: 'Sanitise',
  operation_refund: 'Refund: the operation failed',
  money_refund: 'Refund',
  adjustment: 'Adjustment',
};

/**
 * What a row is called, in words the person reading it has not had to learn.
 *
 * `adjustment` USED TO SAY "Transfer", AND NOBODY HAD EVER SEEN IT. The guest
 * merge had never once run against the real database, so no wallet had ever
 * contained one of these rows. It ran for the first time on 21 August 2026,
 * and now it is the FIRST ROW most new accounts will ever see, sitting above
 * their signup credits saying "Transfer +1" — a transfer from what, to what,
 * by whom.
 *
 * CLAUDE.md section 8: teach the term before using it, and read it as the
 * visitor. The visitor here used the tool before making an account and has no
 * idea that a "guest session" was ever a thing that existed, so the sentence
 * cannot mention one. It says what happened in their words: they had credits
 * before they signed up, and they still have them.
 */
function labelFor(row: LedgerRow): string {
  if (row.reason === 'adjustment') {
    if (row.endpoint === 'transfer_in') return 'Credits from before you signed up';
    if (row.endpoint === 'transfer_out') return 'Moved to your account';
  }

  return REASON_LABEL[row.reason] ?? row.reason;
}

interface LedgerRow {
  id: number;
  delta: number;
  reason: string;
  endpoint: string | null;
  input_kind: string | null;
  words_in: number | null;
  created_at: string;
}

export default async function HomePage() {
  /*
   * THIS PAGE CAN NEVER BE PRERENDERED, AND HAD NOT SAID SO. 21 August 2026.
   *
   * next.config has `cacheComponents: true`, under which every route is a
   * prerender candidate unless it declares a request-time dependency. This one
   * reads the visitor's own session, so a prerendered copy is meaningless by
   * definition — and Supabase's auth client calls Date.now() while loading that
   * session, which the prerender refuses:
   *
   *   Route "/home": Next.js encountered the unstable value `Date.now()`
   *   while prerendering.
   *
   * Found by looking at the page at phone width and chasing the "1 Issue"
   * badge in the corner, which is the only place it was visible.
   *
   * `connection()` is the declaration: it says this render waits for a real
   * request. Nothing else in the page changes.
   */
  await connection();

  const supabase = getSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.is_anonymous === true) {
    return (
      <>
        <PageHeader description={'Your account'} />
        <PageBody>
          <p className={'text-muted-foreground text-sm'}>
            Sign in to see your credit balance and history.
          </p>
        </PageBody>
      </>
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const [{ data: balanceData }, { data: rows }] = await Promise.all([
    db.rpc('credit_balance'),
    db
      .from('credit_ledger')
      .select('id, delta, reason, endpoint, input_kind, words_in, created_at')
      .order('created_at', { ascending: false })
      .limit(50),
  ]);

  const balance = (balanceData as number) ?? 0;
  const history = (rows ?? []) as LedgerRow[];

  return (
    <>
      <PageHeader description={'Your credits'} />

      <PageBody>
        <div className={'flex max-w-[640px] flex-col gap-6'}>
          <div
            className={
              'border-border/70 flex flex-col gap-4 rounded-[16px] border p-6 sm:flex-row sm:items-center sm:justify-between'
            }
          >
            <div>
              <p className={'text-foreground text-[34px] leading-none font-bold tracking-[-0.02em] tabular-nums'}>
                {balance}{' '}
                <span className={'text-muted-foreground text-[15px] font-medium tracking-normal'}>
                  {balance === 1 ? 'credit' : 'credits'}
                </span>
              </p>
              <p className={'text-muted-foreground mt-2 text-[13px]'}>
                About {(balance * 1000).toLocaleString('en-US')} words of
                sanitising. Credits never expire.
              </p>
            </div>

            <Link
              href={'/pricing'}
              className={
                'bg-foreground text-background shrink-0 rounded-[10px] px-4 py-2.5 text-center text-[13.5px] font-semibold transition-transform active:scale-[0.98]'
              }
            >
              Get credits
            </Link>
          </div>

          <div>
            <h2 className={'text-foreground text-[15px] font-semibold tracking-[-0.01em]'}>
              History
            </h2>

            {history.length === 0 ? (
              <p className={'text-muted-foreground mt-2 text-[13.5px]'}>
                Nothing yet. Your first sanitise will show up here.
              </p>
            ) : (
              <ul className={'divide-border/70 mt-2 divide-y'}>
                {history.map((row) => (
                  <li
                    key={row.id}
                    className={'flex items-baseline justify-between gap-4 py-2.5'}
                  >
                    <div className={'min-w-0'}>
                      <p className={'text-foreground text-[13.5px] font-medium'}>
                        {labelFor(row)}
                        {row.reason === 'spend' && row.words_in ? (
                          <span className={'text-muted-foreground font-normal'}>
                            {' '}
                            · {row.words_in.toLocaleString('en-US')} words
                          </span>
                        ) : row.reason === 'spend' && row.input_kind === 'file' ? (
                          <span className={'text-muted-foreground font-normal'}>
                            {' '}
                            · file
                          </span>
                        ) : null}
                      </p>
                      <p className={'text-muted-foreground text-[11.5px]'}>
                        {new Date(row.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                    </div>

                    <span
                      className={[
                        'shrink-0 font-mono text-[13px] font-medium tabular-nums',
                        row.delta > 0 ? 'text-emerald-700' : 'text-foreground',
                      ].join(' ')}
                    >
                      {row.delta > 0 ? `+${row.delta}` : row.delta}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </PageBody>
    </>
  );
}
