'use client';

import { useEffect, useRef, useState } from 'react';

import { useRouter, useSearchParams } from 'next/navigation';

import * as track from '~/lib/analytics/events';

/**
 * "Your payment went through", shown on the wallet after Stripe sends the buyer
 * back. 04 entry 112.
 *
 * THE PROBLEM THIS EXISTS TO SOLVE IS A RACE, and it is a race we cannot remove
 * — only cover. Stripe redirects the buyer here the moment the card clears, and
 * separately POSTs the webhook that actually grants the credits. Those are two
 * independent journeys across the internet and there is NO GUARANTEE the
 * webhook wins. Usually it lands within a second. Sometimes it does not.
 *
 * So a buyer can arrive at their wallet, having just paid, and see their OLD
 * balance. That is the worst possible moment for this product to look broken:
 * they have just handed over money to a site they found twenty minutes ago, and
 * the number that was supposed to go up has not.
 *
 * WHY NOT JUST GRANT THE CREDITS ON THIS PAGE AND AVOID THE RACE. Because the
 * redirect is a hint and not a fact. It is a URL: it can be opened twice,
 * bookmarked, shared, or reached by typing it. Granting credits from it would
 * mean anyone could grant themselves credits by visiting a link. The webhook is
 * the only thing that can prove a payment happened, which is why it is the only
 * thing that pays. See the webhook route's header.
 *
 * ---
 *
 * HOW IT KNOWS THE CREDITS ARRIVED, and the first version of this got it wrong
 * in a way only the live test caught.
 *
 * That version compared the balance now against the balance when the component
 * mounted. But the component only mounts AFTER the purchase, so it has no idea
 * what the balance was before it — and in the COMMON case, where the webhook
 * wins the race, the credits are already in the number it captures as its
 * baseline. It then waited for a rise that had already happened, sat on
 * "Adding your credits now…" for fifteen seconds, and finished by telling a
 * customer whose credits were sitting right there that something had gone
 * wrong. Verified in the end-to-end run: balance 30, banner still claiming to
 * be working on it.
 *
 * It now asks a question with an actual answer: DOES A RECENT PURCHASE ROW
 * EXIST? The server knows, because it renders the wallet history anyway. No
 * baseline, no guessing, and it is correct whichever way the race went.
 */

/** How many times to re-ask the server before giving up. */
const MAX_ATTEMPTS = 10;

/** Gap between attempts. 10 x 1.5s covers about 15 seconds. */
const INTERVAL_MS = 1_500;

export function PurchaseBanner({ purchaseLanded }: { purchaseLanded: boolean }) {
  const params = useSearchParams();
  const router = useRouter();

  const status = params.get('purchase');

  const [gaveUp, setGaveUp] = useState(false);
  const attempts = useRef(0);

  /*
   * THE OUTCOME OF THE CHECKOUT, RECORDED ONCE. 24 August 2026.
   *
   * This component is the only place on the site that knows how a checkout
   * ended, because it is where Stripe sends the buyer back. Before this the
   * funnel stopped at the paywall: the product could not answer how many of the
   * people who ran out of credits actually bought.
   *
   * IT FIRES ON ARRIVAL, NOT ON THE CREDITS LANDING. Stripe only redirects to
   * `?purchase=success` once the card has cleared, so the payment is a fact by
   * the time this renders. Waiting for `purchaseLanded` would turn a purchase
   * count into a measurement of webhook latency, and would lose every purchase
   * whose webhook was slow — which is precisely the population that matters.
   * The race itself rides along as `credits_ready` instead.
   *
   * ONCE, AND THE REF IS WHY. A purchase counted twice is worse than one not
   * counted at all, and there are two ways this could fire again: React runs
   * every effect twice on mount in development, and this component re-renders
   * repeatedly while the banner below polls. The ref costs nothing and closes
   * both. Verified by sitting through five poll cycles: one event, not five.
   *
   * DO NOT COPY THE POLLING EFFECT BELOW AS A MODEL. Its comment claims it
   * re-runs when `router.refresh()` produces a new render. It does not — none
   * of its four dependencies change on a refresh, so it schedules one retry and
   * stops, and its give-up message can never appear. Measured 24 August 2026;
   * left alone because it changes behaviour on the live payment path. 06 has
   * the row.
   *
   * NOTHING ABOUT THE BUYER GOES WITH IT. No account id, no email, no pack, no
   * amount. Two booleans' worth of fact: a purchase happened, and whether the
   * credits were already there. See the header of `lib/analytics/events.ts`.
   */
  const reported = useRef(false);

  useEffect(() => {
    if (reported.current) return;
    if (status !== 'success' && status !== 'cancelled') return;

    reported.current = true;

    if (status === 'cancelled') {
      track.purchaseCancelled();
    } else {
      track.purchaseCompleted({ creditsReady: purchaseLanded });
    }
    // `purchaseLanded` is deliberately not a dependency: this reads it once, at
    // the moment the buyer arrives, and the ref stops any later render firing
    // a second event.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  useEffect(() => {
    // Nothing to wait for: either not a purchase return, or it already landed.
    if (status !== 'success' || purchaseLanded || gaveUp) return;

    const id = window.setTimeout(() => {
      attempts.current += 1;

      if (attempts.current >= MAX_ATTEMPTS) {
        setGaveUp(true);

        return;
      }

      // Re-render the server component. If the webhook has landed since, the
      // `purchaseLanded` prop flips and this effect stops rescheduling itself.
      router.refresh();
    }, INTERVAL_MS);

    return () => window.clearTimeout(id);
    // `attempts` is a ref, so this re-runs when refresh() produces a new render.
  }, [status, purchaseLanded, gaveUp, router]);

  if (status === 'cancelled') {
    return (
      <Banner tone={'neutral'}>
        Checkout was cancelled and <strong>nothing was charged</strong>.
      </Banner>
    );
  }

  if (status !== 'success') return null;

  if (purchaseLanded) {
    return (
      <Banner tone={'good'}>
        <strong>Payment received.</strong> Your credits are in your balance
        below, and your receipt is on its way by email.
      </Banner>
    );
  }

  if (gaveUp) {
    return (
      <Banner tone={'neutral'}>
        <strong>Your payment went through.</strong> The credits are taking longer
        than usual to appear. Refresh this page in a moment, and if they are
        still missing, email support@un-claude.com and we will sort it out.
      </Banner>
    );
  }

  return (
    <Banner tone={'good'}>
      <strong>Payment received.</strong> Adding your credits now…
    </Banner>
  );
}

function Banner({
  tone,
  children,
}: {
  tone: 'good' | 'neutral';
  children: React.ReactNode;
}) {
  return (
    <div
      // Announced to screen readers, because for a blind buyer this banner is
      // the only confirmation that their money did something.
      role={'status'}
      aria-live={'polite'}
      className={[
        'rounded-[14px] border px-5 py-4 text-[13.5px] leading-[1.6]',
        tone === 'good'
          ? 'border-emerald-600/25 bg-emerald-600/[0.07] text-emerald-900 dark:text-emerald-200'
          : 'border-border/70 text-muted-foreground',
      ].join(' ')}
    >
      {children}
    </div>
  );
}
