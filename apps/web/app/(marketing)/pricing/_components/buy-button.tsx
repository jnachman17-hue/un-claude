'use client';

import { useState, useTransition } from 'react';

import { useRouter } from 'next/navigation';

import { toast } from '@kit/ui/sonner';

/**
 * The pack button on /pricing. 04 entry 112.
 *
 * IT GOES STRAIGHT TO STRIPE, AND THE CONSENT LIVES THERE. 22 August 2026,
 * Jon's ruling. A version of this file briefly carried a dialog with an
 * immediate-supply checkbox, built for the UK/EU 14 day right of withdrawal.
 * That right is out of scope now that credits are sold to US customers only, a
 * restriction stated in the terms. So the dialog was deleted rather than kept
 * "just in case", because a consent step for a right nobody in scope has is
 * friction that costs sales and teaches nothing.
 *
 * THE RESTRICTION IS CONTRACTUAL AND IS NOT YET ENFORCED IN CODE OR AT STRIPE.
 * Nothing here or in the checkout route refuses a non-US card today. The
 * enforcement is a Stripe Radar block on `card_country_blocklist`, which is a
 * dashboard job Jon has not done yet. Do not write a comment, a page or a
 * receipt anywhere claiming non-US cards are blocked until it is.
 *
 * THE ONLY CONSENT IS STRIPE'S OWN TERMS CHECKBOX, set by
 * `consent_collection` in the checkout route and rendered on Stripe's page as
 * "I agree to Un-Claude's Terms of Service and Privacy Policy". Not pre-ticked,
 * required to pay, and recorded by Stripe with its own timestamp. That is the
 * ordinary pattern and it is deliberately all there is.
 *
 * IF EUROPE IS EVER OPENED UP, THE DIALOG COMES BACK. It is in the history at
 * commit b965e88 and the reasoning is in
 * `docs/session-notes/legal-applied-stripe.md`. Do not rebuild it from scratch.
 *
 * WHAT IT REPLACED, AND WHY THE LAYOUT MUST NOT MOVE. This was a `<Link>` to
 * the sign-up form wearing the label "Purchase now" — 04 entry 109, where Jon
 * ruled that the page reads as live and accepted that a button promising a
 * purchase delivered a sign-up form. That entry names this as the one thing to
 * change the day Stripe lands. **The className is passed in unchanged from the
 * page**, because the card heights on this page were measured at 390px and
 * signed off (entry 109: 315, 319 and 319px, tier three at y=1393), and a
 * button that restyles itself would quietly undo that work.
 *
 * IT ALWAYS POSTS, EVEN WHEN SIGNED OUT, and that is deliberate. The
 * alternative is asking the browser who the visitor is before deciding what the
 * button does, which means either shipping the answer into the static page — it
 * is cached, so it would be wrong — or a loading spinner on a button that
 * should feel instant. The route already answers "who are you" authoritatively:
 * 401 means signed out and 402 means a guest, and both mean the same thing to
 * this button. One request, no guessing, and the server stays the only thing
 * that decides.
 */
export function BuyButton({
  packId,
  packName,
  className,
  children,
}: {
  packId: string;
  packName: string;
  className: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [working, setWorking] = useState(false);

  const busy = pending || working;

  async function onClick() {
    if (busy) return;

    setWorking(true);

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ packId }),
      });

      const data = (await response.json()) as {
        ok?: boolean;
        url?: string;
        error?: string;
      };

      if (response.ok && data.url) {
        /*
         * A full navigation rather than router.push, because the destination is
         * Stripe's own domain. The router only moves within this app.
         *
         * `working` is deliberately never cleared here: the page is leaving,
         * and clearing it would flash the button back to its resting state for
         * the moment before the browser follows the redirect.
         */
        window.location.href = data.url;

        return;
      }

      /*
       * Signed out (401) or a guest account (402). Both mean the same thing to
       * a visitor: they need an account before they can buy. The route decides
       * this, not the browser.
       *
       * THE PACK THEY CHOSE IS LOST AT THIS POINT, and that is a known gap
       * rather than an oversight. Carrying it through sign-up means a return
       * path through `packages/features/auth`, which 04 entry 109 left alone as
       * another session's file. The wallet's "Get credits" button brings them
       * back to this page afterwards, so the loop closes — it just closes one
       * click wider than it should.
       */
      if (response.status === 401 || response.status === 402) {
        router.push('/auth/sign-up');

        return;
      }

      if (response.status === 429) {
        toast.error('That is a lot of checkouts. Give it a minute and try again.');
      } else if (response.status === 503) {
        toast.error('Card payments are briefly unavailable. Nothing was charged.');
      } else {
        toast.error('Something went wrong opening checkout. Nothing was charged.');
      }
    } catch {
      // A network failure before the request landed. Say the reassuring true
      // thing: no money moved.
      toast.error('Could not reach checkout. Nothing was charged.');
    } finally {
      startTransition(() => setWorking(false));
    }
  }

  return (
    <button
      type={'button'}
      onClick={onClick}
      disabled={busy}
      aria-label={`Buy the ${packName} pack`}
      className={[className, busy ? 'cursor-wait opacity-80' : ''].join(' ')}
    >
      {busy ? 'Opening checkout…' : children}
    </button>
  );
}
