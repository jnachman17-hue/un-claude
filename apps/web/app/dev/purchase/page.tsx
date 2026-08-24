import { Suspense } from 'react';

import { PurchaseBanner } from '~/home/_components/purchase-banner';

/**
 * THE POST-CHECKOUT BANNER, AT THE ONE MOMENT NOBODY CAN REACH LOCALLY. Added
 * 24 August 2026, and it is the same idea as /dev/wallet one folder over.
 *
 * `/home` needs a real, non-anonymous session against the hosted database, and
 * there is no local Supabase (06 row 11). So the banner — and the two purchase
 * events that now fire from it — could be written but not LOOKED AT, which by
 * `CLAUDE.md` section 4 is not finished. Reaching it for real would mean paying
 * with a live card on the live site.
 *
 * This renders the real component with the prop fabricated, at all four states:
 *
 *   ?purchase=success                 the webhook won the race, credits ready
 *   ?purchase=success&landed=0        the webhook lost, banner starts polling
 *   ?purchase=cancelled               they reached Stripe and backed out
 *   (no query)                        renders nothing, the ordinary visit
 *
 * WHAT IT CANNOT SHOW. `landed=0` polls by calling `router.refresh()`, which on
 * this page re-renders this fixture rather than a wallet, so the prop never
 * flips and it will always run to the give-up message after about fifteen
 * seconds. That is the correct behaviour for a webhook that never lands, and it
 * is also the only path this page can take. The happy re-render is a live test.
 *
 * Development builds only, the same guard as /dev/wallet and /dev/credits.
 */
export const metadata = { robots: { index: false, follow: false } };

/*
 * The shell renders immediately and the query-string read happens inside the
 * boundary, the same shape as /dev/wallet: under `cacheComponents` a segment
 * that awaits `searchParams` in its own body blocks the whole route from
 * prerendering, and Next says so in the console.
 */
export default function DevPurchase(props: {
  searchParams: Promise<{ purchase?: string; landed?: string }>;
}) {
  return (
    <Suspense fallback={null}>
      <Fixture searchParams={props.searchParams} />
    </Suspense>
  );
}

async function Fixture(props: {
  searchParams: Promise<{ purchase?: string; landed?: string }>;
}) {
  if (process.env.NODE_ENV !== 'development') {
    return (
      <main className={'mx-auto max-w-[640px] px-6 py-20'}>
        <p className={'text-muted-foreground text-[14px]'}>
          This page only renders on a development build.
        </p>
      </main>
    );
  }

  const query = await props.searchParams;

  // Defaults to true, because the common case is the webhook winning.
  const purchaseLanded = query.landed !== '0';

  return (
    <main className={'mx-auto flex max-w-[640px] flex-col gap-6 px-5 py-10'}>
      <div>
        <h1 className={'text-foreground mb-1 text-[22px] font-bold'}>
          Purchase banner
        </h1>
        <p className={'text-muted-foreground text-[12.5px]'}>
          The real component. Add <code>?purchase=success</code>,{' '}
          <code>?purchase=success&amp;landed=0</code> or{' '}
          <code>?purchase=cancelled</code>.
        </p>
      </div>

      <Suspense fallback={null}>
        <PurchaseBanner purchaseLanded={purchaseLanded} />
      </Suspense>
    </main>
  );
}
