'use client';

import { useState, useTransition } from 'react';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { Checkbox } from '@kit/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@kit/ui/dialog';
import { toast } from '@kit/ui/sonner';

import type { Pack } from './pricing-data';

/**
 * The pack button on /pricing, and the consent step between it and Stripe.
 * 04 entry 112 for the button, 04 entry 113 for the split it now carries.
 *
 * WHAT IT REPLACED, AND WHY THE LAYOUT MUST NOT MOVE. This was a `<Link>` to
 * the sign-up form wearing the label "Purchase now" — 04 entry 109, where Jon
 * ruled that the page reads as live and accepted that a button promising a
 * purchase delivered a sign-up form. That entry names this as the one thing to
 * change the day Stripe lands. **The className is passed in unchanged from the
 * page**, because the card heights on this page were measured at 390px and
 * signed off (entry 109: 315, 319 and 319px, tier three at y=1393), and a
 * button that restyles itself would quietly undo that work. THE CONSENT STEP
 * CHANGES NOTHING IN THE CARD for the same reason: it is a dialog, so the card
 * is the same height it was measured at.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * WHY THERE IS A CHECKBOX, AND WHY IT IS NOT DECORATION.
 *
 * A UK or EU consumer has 14 days to cancel a distance purchase and get ALL
 * their money back, spent credits included. That is a statutory right and it is
 * NOT the same thing as our voluntary 30 day refund of UNSPENT credits — being
 * more generous does not discharge it, because the two cover different money.
 *
 * The right is lost only when THREE things happen, and all three are required:
 *
 *   1. The customer EXPRESSLY consents to the service starting immediately.
 *   2. They ACKNOWLEDGE that this loses them the right to cancel.
 *   3. They get confirmation of both on a DURABLE MEDIUM.
 *
 * Credits land the instant the payment succeeds, so supply is immediate whether
 * or not anybody papered it. This dialog is 1 and 2. Stripe's own receipt email
 * is 3, and it already exists. The route writes the consent onto the payment
 * itself so the record survives in Stripe's dashboard, and restates it beside
 * Stripe's pay button through `custom_text`.
 *
 * NOT PRE-TICKED, AND THE PAY BUTTON IS DEAD UNTIL IT IS TICKED. A pre-ticked
 * box is not consent in either jurisdiction, and neither is a box you can walk
 * past. This is the whole reason the dialog exists, so it is not softened into
 * a footnote under the button.
 *
 * THE PAY BUTTON STATES THE AMOUNT. "Pay $9.99", never "Continue" or "Confirm".
 * The button that takes the money has to say what it takes; a button carrying
 * an obligation to pay and hiding the figure is the trap that sits right next
 * to this one.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * THE PRICE IN HERE IS FOR THE EYES ONLY. THE BROWSER STILL SENDS A PACK ID AND
 * NEVER A PRICE. The figure below is rendered from the same `PACKS` array the
 * card above it renders from; the server independently looks the pack up by id
 * and builds the line item itself. If this component lied about the price, the
 * charge would still be right — which is the property that matters.
 *
 * IT STILL ALWAYS POSTS, EVEN WHEN SIGNED OUT, and that is unchanged and
 * deliberate. The alternative is asking the browser who the visitor is before
 * deciding what the button does, which means either shipping the answer into
 * the static page — it is cached, so it would be wrong — or a loading spinner
 * on a button that should feel instant. The route already answers "who are you"
 * authoritatively: 401 means signed out and 402 means a guest, and both mean the
 * same thing to this button. One request, no guessing, and the server stays the
 * only thing that decides.
 *
 * THE COST OF THAT, STATED RATHER THAN HIDDEN: a signed-out visitor ticks the
 * box and then meets a sign-up form, and the tick is thrown away with the
 * request. That is the honest outcome — no purchase happened, so no consent was
 * needed — and it is one wasted click rather than a wrong one. Carrying the
 * chosen pack through sign-up is the same missing return path 04 entry 109 left
 * in `packages/features/auth`, which is another session's file.
 */
export function BuyButton({
  pack,
  className,
  children,
}: {
  pack: Pack;
  className: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [working, setWorking] = useState(false);
  const [open, setOpen] = useState(false);
  const [agreed, setAgreed] = useState(false);

  const busy = pending || working;
  const price = `$${pack.dollars}.${pack.cents}`;

  function onOpenChange(next: boolean) {
    if (busy) return;

    setOpen(next);

    // The tick does not survive the dialog closing. Reopening it is a fresh
    // decision, not a remembered one.
    if (!next) setAgreed(false);
  }

  async function onPay() {
    if (busy || !agreed) return;

    setWorking(true);

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          packId: pack.id,
          // The tick, sent as what it is. The route refuses without it.
          agreedToImmediateSupply: true,
        }),
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
    <>
      <button
        type={'button'}
        onClick={() => setOpen(true)}
        aria-label={`Buy the ${pack.name} pack`}
        className={className}
      >
        {children}
      </button>

      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className={'sm:max-w-[420px]'}>
          <DialogHeader>
            <DialogTitle className={'text-[17px] tracking-[-0.01em]'}>
              Buy the {pack.name} pack
            </DialogTitle>
            <DialogDescription className={'text-[14px] leading-[1.55]'}>
              {price} for {pack.credits} credits. One payment, nothing renews,
              and the credits never expire.
            </DialogDescription>
          </DialogHeader>

          {/* The consent itself. Unticked, and the pay button is dead until it
              is ticked. See the file header for why all of that is load
              bearing rather than fussy. */}
          <label
            htmlFor={`immediate-supply-${pack.id}`}
            className={
              'border-border/70 bg-foreground/[0.02] flex cursor-pointer gap-3 rounded-[12px] border p-3.5'
            }
          >
            <Checkbox
              id={`immediate-supply-${pack.id}`}
              checked={agreed}
              onCheckedChange={(checked) => setAgreed(checked === true)}
              disabled={busy}
              className={'mt-[2px]'}
            />
            <span className={'text-foreground text-[13.5px] leading-[1.5]'}>
              I want my credits delivered immediately, and I understand that once
              they are delivered I lose my 14 day right to cancel.
            </span>
          </label>

          <p className={'text-muted-foreground text-[12.5px] leading-[1.5]'}>
            Our 30 day refund of unspent credits is a separate thing and this does
            not affect it.{' '}
            <Link
              href={'/terms-of-service'}
              className={'text-foreground font-medium underline underline-offset-2'}
            >
              Both are in the terms
            </Link>
            .
          </p>

          <button
            type={'button'}
            onClick={onPay}
            disabled={!agreed || busy}
            className={[
              'bg-foreground text-background w-full rounded-[11px] px-4 py-3.5 text-[14px] font-semibold transition-transform',
              !agreed || busy
                ? 'cursor-not-allowed opacity-40'
                : 'hover:bg-foreground/90 active:scale-[0.98]',
            ].join(' ')}
          >
            {busy ? 'Opening checkout…' : `Pay ${price}`}
          </button>

          <p className={'text-muted-foreground text-center text-[12.5px] leading-[1.5]'}>
            You pay on Stripe’s own page. Your card details never reach us.
          </p>
        </DialogContent>
      </Dialog>
    </>
  );
}
