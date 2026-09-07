import { Suspense } from 'react';

import Link from 'next/link';
import { connection } from 'next/server';

import { PageBody, PageHeader } from '@kit/ui/page';

import { CreditHistory, type LedgerRow } from './_components/credit-history';
import { PurchaseBanner } from './_components/purchase-banner';
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

/**
 * HOW MANY ROWS ONE PAGE OF THE HISTORY SHOWS.
 *
 * THE OLD `.limit(50)` WAS NOT A PAGE SIZE, IT WAS A SILENT TRUNCATION. There
 * was no second page, no "load more" and no sentence anywhere saying that
 * anything had been left out: an account with more than fifty entries simply
 * stopped having a history, on the page that IS its financial record. The
 * audit's own account had 82 rows.
 *
 * And it was not solving the problem it looked like it was solving. The audit
 * measured that page at 210,693 bytes and the same growth is still ahead of
 * us: fifty rows of a customer with hundreds is still fifty rows, and a phone
 * still has to parse all of them. Twenty-five is a screen and a bit at phone
 * width, which is the size of a thing a person actually reads before deciding
 * whether to look further.
 */
const PAGE_SIZE = 25;

export default async function HomePage(props: {
  searchParams: Promise<{ page?: string }>;
}) {
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
      <Main>
        <PageHeader description={'Your account'} />
        <PageBody>
          <p className={'text-muted-foreground text-sm'}>
            Sign in to see your credit balance and history.
          </p>
        </PageBody>
      </Main>
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  /*
   * The page number, from the address bar, floored at 1. Anything that is not
   * a number — a hand-typed `?page=banana`, a truncated link — is page one
   * rather than an error, because there is nothing here worth erroring about.
   */
  const asked = Number((await props.searchParams).page);
  const page = Number.isFinite(asked) && asked > 1 ? Math.floor(asked) : 1;
  const from = (page - 1) * PAGE_SIZE;

  /*
   * ONE ROW MORE THAN THE PAGE SHOWS, WHICH IS THE WHOLE PAGINATION.
   *
   * Asking the database for a total count as well would be a second query on
   * every wallet load, for ever, to render a number nobody needs: the only
   * question this page has to answer is "is there anything older than this".
   * Twenty-six rows come back, twenty-five are shown, and the twenty-sixth is
   * the answer to that question and is then thrown away.
   */
  const [{ data: balanceData }, { data: rows }] = await Promise.all([
    db.rpc('credit_balance'),
    db
      .from('credit_ledger')
      .select('id, delta, reason, endpoint, input_kind, words_in, price_cents, created_at')
      .order('created_at', { ascending: false })
      .range(from, from + PAGE_SIZE),
  ]);

  const balance = (balanceData as number) ?? 0;
  const fetched = (rows ?? []) as LedgerRow[];
  const hasOlder = fetched.length > PAGE_SIZE;
  const history = fetched.slice(0, PAGE_SIZE);

  /*
   * Has a purchase landed recently? This is the ONLY reliable signal the
   * post-checkout banner can use, and working it out here rather than in the
   * browser is what makes it reliable: the server can see the ledger, and the
   * browser cannot see what the balance was before the purchase it just made.
   *
   * The 15 minute window scopes it to "the purchase they have just returned
   * from" rather than any purchase they have ever made. It is a heuristic, and
   * the alternative — threading the Stripe session id through the redirect and
   * storing it on the ledger row — is a schema change for a banner. If a
   * customer somehow reaches /home?purchase=success within 15 minutes of an
   * unrelated purchase, the worst outcome is a correct message at a slightly
   * odd moment.
   */
  const RECENT_MS = 15 * 60 * 1000;
  const latestPurchase = history.find((row) => row.reason === 'purchase');
  const purchaseLanded =
    !!latestPurchase &&
    Date.now() - new Date(latestPurchase.created_at).getTime() < RECENT_MS;

  /**
   * WHAT THE SALE WAS WORTH, for the advertising conversion. 6 September 2026.
   *
   * Google's own snippet hardcodes `'value': 1.0` and an empty
   * `transaction_id`. Pasted as written it would report every purchase as one
   * dollar, so a $24.99 Pro pack and a $4.99 Starter would look identical, and
   * cost-per-sale would be meaningless the moment there is more than one pack.
   *
   * The real figure is on the ledger row that was just written, so it is read
   * here, server side, where the row already is. `id` rides along as the
   * transaction id: refreshing `/home?purchase=success` renders this page
   * again, and without something to deduplicate on, one sale would be counted
   * every time somebody pressed reload.
   */
  const purchase =
    purchaseLanded && latestPurchase
      ? {
          id: String(latestPurchase.id),
          value: (latestPurchase.price_cents ?? 0) / 100,
        }
      : null;

  return (
    <Main>
      <PageHeader description={'Your credits'} />

      <PageBody>
        <div className={'flex max-w-[640px] flex-col gap-6'}>
          {/*
            The post-checkout confirmation. Suspense because PurchaseBanner
            reads the query string with useSearchParams, which Next requires be
            wrapped so the rest of the wallet can render without waiting on it.
            It renders nothing at all unless `?purchase=` is present, so on an
            ordinary visit this boundary costs nothing.
          */}
          <Suspense fallback={null}>
            <PurchaseBanner purchaseLanded={purchaseLanded} purchase={purchase} />
          </Suspense>

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

          <CreditHistory
            rows={history}
            from={from}
            page={page}
            hasOlder={hasOlder}
          />
        </div>
      </PageBody>
    </Main>
  );
}

/**
 * The landmark this page did not have.
 *
 * The F1 audit found no `main` on any of the ten pages it checked, so a screen
 * reader user has to walk the sidebar every time rather than jumping to the
 * thing they came for. Here that thing is their money.
 *
 * IT CARRIES THE FLEX CLASSES ON PURPOSE. `PageBody` is `flex-1` and expects a
 * flex column parent; dropping a plain block element in between would take its
 * height away. This replaces that parent exactly rather than adding a level to
 * the chain.
 *
 * The skip link that should point at it belongs in the layout above, which is
 * shared kit code rather than this product's. Recorded as a handoff in
 * docs/session-notes/lane-c-workbench.md.
 */
function Main({ children }: React.PropsWithChildren) {
  return (
    <main id={'main'} className={'flex min-w-0 flex-1 flex-col'}>
      {children}
    </main>
  );
}
